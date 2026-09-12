from .clean_trees import clean_trees
from .clean_workorders import clean_workorders
from .config import CLOSED_STATUSES, OPEN_STATUSES, PROCESSED_DIR
from .join import join_trees
from .load import read_trees, read_workorders


def main():
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    raw = read_workorders()
    trees = clean_trees(read_trees())
    open_wo = join_trees(clean_workorders(raw, OPEN_STATUSES), trees)
    closed_wo = join_trees(clean_workorders(raw, CLOSED_STATUSES), trees)

    trees.to_csv(PROCESSED_DIR / "trees_clean.csv", index=False)
    open_wo.to_csv(PROCESSED_DIR / "workorders_open.csv", index=False)
    closed_wo.to_csv(PROCESSED_DIR / "workorders_closed.csv", index=False)

    print(f"trees:  {len(trees):,}")
    print(f"open:   {len(open_wo):,}  (bad dates {open_wo['flag_bad_date'].sum():,})")
    print(open_wo["asset_type"].value_counts().to_string())
    print(f"closed: {len(closed_wo):,} (training)")
    print("open match_conf:")
    print(open_wo["match_conf"].value_counts(normalize=True).mul(100).round(1).to_string())
    print(f"\nwrote -> {PROCESSED_DIR}")


if __name__ == "__main__":
    main()
