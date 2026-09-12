"""Plain-English reason for each new_status, built from the same signals the model uses."""
import pandas as pd

from .features import TIERS
from .score import MIN_SUPPORT, P_THRESH

BIG_DBH = 7  # size class; roughly >50 cm trunk


def _history(closed: pd.DataFrame) -> pd.DataFrame:
    """Per work_type: n closed + share of each tier. This is what the model mostly learns."""
    pr = closed["priority"].replace("Critical", "High")
    h = pd.crosstab(closed["work_type"], pr, normalize="index").reindex(columns=TIERS, fill_value=0)
    h["n"] = closed["work_type"].value_counts()
    return h


def _row(r: pd.Series, hist: pd.DataFrame) -> str:
    cur, new = r["priority"], r["new_status"]
    wt = r["work_type"]
    parts = []

    pred = r["pred_priority"]
    if new != cur:
        parts.append(f"{cur} -> {new}: model predicts {new} ({r[f'p_{new.lower()}']:.0%}).")
    elif cur == "High":
        parts.append("Kept High.")
    elif pd.isna(pred):
        parts.append(f"Kept {cur}: not enough closed history for this work type "
                     f"({r['n_history']} WOs, need {MIN_SUPPORT}) or model not confident (<{P_THRESH:.0%}).")
    else:
        parts.append(f"Unchanged: model agrees with {cur} ({r[f'p_{cur.lower()}']:.0%}).")

    if wt in hist.index:
        h = hist.loc[wt]
        parts.append(f"Of {int(h['n']):,} closed '{wt}' WOs, HRM rated "
                     f"{h['High']:.0%} High / {h['Medium']:.0%} Medium / {h['Low']:.0%} Low.")
    else:
        parts.append(f"No closed history for '{wt}'.")

    why = []
    sc = r["street_class"]
    if sc in ("ARTERIAL", "EXPRESSWAY", "MAJOR COLLECTOR"):
        why.append(f"{sc.lower()} road")
    if r["needs_traffic_control"]:
        why.append("needs traffic control")
    if r["needs_nsp"]:
        why.append("needs NSP (power line) crew")
    if r["is_storm"]:
        why.append("storm-caused")
    if r["age_days"] >= 365:
        why.append(f"open {r['age_days'] / 365:.1f} yrs")
    if r["match_conf"] in ("high", "med"):
        t = f"{r['species_common']}" if pd.notna(r["species_common"]) else "tree"
        bits = []
        if pd.notna(r["dbh_class"]) and r["dbh_class"] >= BIG_DBH:
            bits.append("large")
        if r["wires"] is True or r["wires"] == 1:
            bits.append("under wires")
        why.append(f"{' '.join(bits + [t])} at site" if bits else f"{t} at site")
    if why:
        parts.append("Factors: " + ", ".join(why) + ".")

    if r["blocked"]:
        parts.append("Blocked (tender/hold).")
    return " ".join(parts)


def explain(scored: pd.DataFrame, closed: pd.DataFrame) -> pd.Series:
    hist = _history(closed)
    return scored.apply(_row, axis=1, hist=hist)
