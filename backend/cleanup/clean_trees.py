import pandas as pd

RENAME = {
    "OBJECTID": "object_id",
    "TreeID": "tree_id",
    "Owner": "owner",
    "Year Planted": "year_planted",
    "General Location": "loc_gen",
    "Wires Present": "wires",
    "Scientific Name": "species_sci",
    "Common Name": "species_common",
    "Diameter at breast height": "dbh_class",
    "Install Date": "install_date",
    "Location": "location",
    "Maintained By": "maintained_by",
    "Modified Date": "modified_date",
    "Data Source": "source",
    "x": "x",
    "y": "y",
}


def clean_trees(df: pd.DataFrame, today: pd.Timestamp | None = None) -> pd.DataFrame:
    today = today or pd.Timestamp.today()

    df = df[list(RENAME)].rename(columns=RENAME).copy()
    df = df.dropna(subset=["x", "y"])

    df["wires"] = df["wires"].str.strip().map({"Y": True, "N": False})
    df["dbh_class"] = df["dbh_class"].astype("Int64")

    yr = df["year_planted"].astype("Int64")
    df["year_planted"] = yr.where((yr > 1800) & (yr <= today.year))

    sp = (df["species_common"].fillna("") + " " + df["species_sci"].fillna("")).str.lower()
    df["is_ash"] = sp.str.contains(r"\bash\b|fraxinus")          # emerald ash borer
    df["is_elm"] = sp.str.contains(r"\belm\b|ulmus")             # dutch elm disease
    df["is_norway_maple"] = sp.str.contains("norway maple|acer platanoides")

    return df.reset_index(drop=True)
