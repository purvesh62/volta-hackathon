import pandas as pd

# PROJECT_NAME deliberately excluded: values like "2022 Hurricane Fiona" / "Tree - Hangers"
# are assigned alongside PRIORITY and leak the label.
CAT = ["asset_type", "work_type", "cause", "street_class", "district", "match_conf", "loc_gen", "species_common"]
NUM = ["month", "is_storm", "dbh_class", "wires", "is_ash", "year_planted",
       "n_trees_25m", "max_dbh_25m", "any_wires_25m", "any_ash_25m"]
FEATURES = CAT + NUM

TIERS = ["Low", "Medium", "High"]
TIER_RANK = {t: i for i, t in enumerate(TIERS)}


def build(df: pd.DataFrame) -> pd.DataFrame:
    X = pd.DataFrame(index=df.index)
    X["month"] = df["date_initiated"].dt.month
    for c in CAT:
        X[c] = df[c].astype("string").fillna("NA").astype("category")
    for c in NUM:
        if c in X:
            continue
        X[c] = pd.to_numeric(df[c].replace({True: 1, False: 0}), errors="coerce")
    return X[FEATURES]


def target(df: pd.DataFrame) -> pd.Series:
    """Priority tier; Critical folded into High (4 rows)."""
    return df["priority"].replace("Critical", "High").map(TIER_RANK)
