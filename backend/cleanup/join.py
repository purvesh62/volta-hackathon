import numpy as np
import pandas as pd
from scipy.spatial import cKDTree

from .config import MATCH_M, NEIGH_M

TREE_ATTRS = ["tree_id", "species_common", "dbh_class", "wires", "loc_gen", "year_planted", "is_ash"]

R = 6378137.0  # WGS84 / Web Mercator radius


def _mercator_scale(y: np.ndarray) -> float:
    """Web Mercator units are inflated by 1/cos(lat) (~1.4x at Halifax). Returns cos(mean lat)."""
    lat = 2 * np.arctan(np.exp(y / R)) - np.pi / 2
    return float(np.cos(lat.mean()))


def _match_conf(d: pd.Series) -> pd.Series:
    return pd.cut(d, bins=[-np.inf, 5, 10, 20, np.inf], labels=["high", "med", "low", "none"]).astype(str).replace("nan", "none")


def join_trees(wo: pd.DataFrame, trees: pd.DataFrame, match_m=MATCH_M, neigh_m=NEIGH_M) -> pd.DataFrame:
    """Left join: every WO row kept; nearest-tree attrs + neighbourhood aggregates attached."""
    out = wo.copy()
    # one shared scale for both sets; per-set scales would shift them relative to each other
    k = _mercator_scale(trees["y"].to_numpy())
    kd = cKDTree(trees[["x", "y"]].to_numpy() * k)

    has = out["has_coords"].to_numpy()
    pts = out.loc[has, ["x", "y"]].to_numpy() * k

    # nearest tree
    dist, idx = kd.query(pts)
    out["tree_dist_m"] = np.nan
    out.loc[has, "tree_dist_m"] = dist
    out["match_conf"] = _match_conf(out["tree_dist_m"])

    nearest = trees.iloc[idx][TREE_ATTRS].reset_index(drop=True)
    nearest.index = out.index[has]
    too_far = pd.Series(dist > match_m, index=nearest.index)
    for c in TREE_ATTRS:
        # too far: keep distance but not attrs. mask() upcasts bool -> object so NA fits
        out[c] = nearest[c].mask(too_far).reindex(out.index)

    # neighbourhood aggregates
    neigh = kd.query_ball_point(pts, r=neigh_m)
    dbh = trees["dbh_class"].to_numpy(dtype=float, na_value=np.nan)
    wires = trees["wires"].to_numpy(dtype=float, na_value=np.nan)
    ash = trees["is_ash"].to_numpy()

    def agg(ids):
        if not ids:
            return (0, np.nan, False, False)
        ids = np.asarray(ids)
        return (len(ids), np.nanmax(dbh[ids]) if np.isfinite(dbh[ids]).any() else np.nan,
                bool(np.nansum(wires[ids]) > 0), bool(ash[ids].any()))

    cols = ["n_trees_25m", "max_dbh_25m", "any_wires_25m", "any_ash_25m"]
    agg_df = pd.DataFrame([agg(n) for n in neigh], columns=cols, index=out.index[has])
    for c in cols:
        out[c] = agg_df[c].reindex(out.index)
    out["n_trees_25m"] = out["n_trees_25m"].fillna(0).astype(int)

    assert len(out) == len(wo)
    return out
