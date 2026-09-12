import pandas as pd

from .config import TREES_CSV, WORKORDERS_CSV

DATE_FMT = "%m/%d/%Y %I:%M:%S %p"

WO_DATE_COLS = ["DATE_INITIATED", "ACTUAL_START_DATE", "ACTUAL_FINISH_DATE"]
TREE_DATE_COLS = ["Install Date", "Add Date", "Modified Date", "Source Date"]


def _parse_dates(df: pd.DataFrame, cols: list[str]) -> pd.DataFrame:
    for c in cols:
        df[c] = pd.to_datetime(df[c], format=DATE_FMT, errors="coerce")
    return df


def read_workorders(path=WORKORDERS_CSV) -> pd.DataFrame:
    df = pd.read_csv(path, encoding="utf-8-sig", low_memory=False, dtype={"WORK_ORDER_ID": str, "DISTRICT": str})
    return _parse_dates(df, WO_DATE_COLS)


def read_trees(path=TREES_CSV) -> pd.DataFrame:
    df = pd.read_csv(path, encoding="utf-8-sig", low_memory=False)
    return _parse_dates(df, TREE_DATE_COLS)
