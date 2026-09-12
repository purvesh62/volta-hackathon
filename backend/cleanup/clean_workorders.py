import pandas as pd

from .config import ASSET_TYPES, CLOSED_STATUSES

RENAME = {
    "WORK_ORDER_CAUSE": "cause",
    "RESOLUTION": "resolution",
    "OBJECT_ID": "object_id",
    "WORK_ORDER_ID": "work_order_id",
    "DATE_INITIATED": "date_initiated",
    "ACTUAL_START_DATE": "date_started",
    "ACTUAL_FINISH_DATE": "date_finished",
    "ASSET_TYPE": "asset_type",
    "ASSET_GROUP": "asset_group",
    "DESCRIPTION": "description",
    "PRIORITY": "priority",
    "STATUS": "status",
    "STREET_CLASSIFICATION": "street_class",
    "QUANTITY": "quantity",
    "UNIT": "unit",
    "ADDRESS": "address",
    "DISTRICT": "district",
    "X_COORDINATE": "x",
    "Y_COORDINATE": "y",
    "PROJECT_NAME": "project_name",
}
BLANK_TO_NAN = ["cause", "resolution", "street_class", "project_name", "address"]


def clean_workorders(df: pd.DataFrame, statuses: set[str] | None = None,
                     today: pd.Timestamp | None = None) -> pd.DataFrame:
    """Keep ASSET_TYPES rows (optionally only `statuses`), drop rows without coords."""
    today = today or pd.Timestamp.today().normalize()

    keep = df["ASSET_TYPE"].isin(ASSET_TYPES) & df["X_COORDINATE"].notna() & df["Y_COORDINATE"].notna()
    if statuses:
        keep &= df["STATUS"].isin(statuses)
    df = df[keep].rename(columns=RENAME).copy()

    for c in BLANK_TO_NAN:
        df[c] = df[c].str.strip().replace("", pd.NA)

    # a handful of rows are dated years in the future
    df["flag_bad_date"] = df["date_initiated"] > today
    df.loc[df["flag_bad_date"], "date_initiated"] = pd.NaT

    df["work_type"] = df["description"].str.replace(r"^Tree - ", "", regex=True)
    df["is_active"] = ~df["status"].isin(CLOSED_STATUSES)
    df["age_days"] = (today - df["date_initiated"]).dt.days
    df["days_to_finish"] = (df["date_finished"] - df["date_initiated"]).dt.days
    df.loc[df["is_active"], "days_to_finish"] = pd.NA

    cause = df["cause"].fillna("")
    df["is_storm"] = cause.str.startswith("Event") | cause.eq("Weather")

    proj = df["project_name"].fillna("")
    df["needs_traffic_control"] = proj.eq("Tree - Traffic Control Required")
    df["needs_nsp"] = proj.eq("Tree - NSP Resource Required")
    df["waiting_tender"] = proj.eq("Tree - Waiting for Tender")
    df["has_coords"] = True  # no-coord rows dropped above; kept for join.py

    return df.reset_index(drop=True)
