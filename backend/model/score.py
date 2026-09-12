import numpy as np
import pandas as pd

from .features import TIER_RANK, TIERS, build

ROAD = {"ARTERIAL": 1.0, "MAJOR COLLECTOR": 0.67, "MINOR COLLECTOR": 0.33, "LOCAL STREET": 0.0}
W_HAZARD, W_EXPOSURE, W_AGE = 0.6, 0.2, 0.2
AGE_CAP_DAYS = 3 * 365
P_THRESH = 0.5      # min prob of the predicted tier to act on it
MIN_SUPPORT = 100   # min closed WOs of same work_type; below this the model is guessing


def _predicted_tier(P: np.ndarray, confident: np.ndarray) -> pd.Series:
    """argmax tier when its prob >= P_THRESH and the work_type has enough history, else NaN (= keep current)."""
    top = P.argmax(1)
    ok = (P.max(1) >= P_THRESH) & confident
    return pd.Series(np.where(ok, np.array(TIERS)[top], None))


def score(model, open_wo: pd.DataFrame, closed: pd.DataFrame) -> pd.DataFrame:
    out = open_wo.copy()
    out["n_history"] = out["work_type"].map(closed["work_type"].value_counts()).fillna(0).astype(int)
    P = model.predict_proba(build(open_wo))
    for t in TIERS:
        out[f"p_{t.lower()}"] = P[:, TIER_RANK[t]]

    out["pred_priority"] = _predicted_tier(P, out["n_history"].ge(MIN_SUPPORT).to_numpy()).to_numpy()
    # never downgrade: Low -> any, Medium -> Medium/High, High -> High
    cur = out["priority"].replace("Critical", "High").map(TIER_RANK).fillna(0).astype(int)
    new = np.maximum(cur, out["pred_priority"].map(TIER_RANK).fillna(0).astype(int))
    out["new_status"] = new.map(dict(enumerate(TIERS)))
    out["changed"] = out["new_status"].ne(out["priority"])

    # exposure: who gets hurt if it fails
    out["exposure"] = (
        0.5 * out["street_class"].map(ROAD).fillna(0)
        + 0.25 * out["needs_traffic_control"]
        + 0.25 * out["needs_nsp"]
    )
    out["age_norm"] = (out["age_days"].fillna(0) / AGE_CAP_DAYS).clip(0, 1)
    out["risk_score"] = (100 * (W_HAZARD * out["p_high"] + W_EXPOSURE * out["exposure"] + W_AGE * out["age_norm"])).round(1)
    out["blocked"] = out["waiting_tender"] | out["status"].eq("HOLD")

    out["rank"] = out["risk_score"].rank(ascending=False, method="first").astype(int)
    return out.sort_values("rank")
