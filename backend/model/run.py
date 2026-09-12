import pandas as pd

from cleanup.config import PROCESSED_DIR, WORKORDERS_CSV

from .explain import explain
from .score import score
from .train import train

OUT_COLS = ["rank", "risk_score", "priority", "new_status", "changed", "pred_priority", "p_low", "p_medium", "p_high",
            "blocked", "n_history", "work_order_id", "asset_type", "work_type", "status", "cause", "street_class", "district",
            "address", "date_initiated", "age_days", "needs_traffic_control", "needs_nsp", "waiting_tender",
            "is_storm", "match_conf", "species_common", "dbh_class", "wires", "is_ash", "max_dbh_25m",
            "any_wires_25m", "exposure", "x", "y"]


def _read(name):
    return pd.read_csv(PROCESSED_DIR / name, low_memory=False, parse_dates=["date_initiated"], dtype={"work_order_id": str, "district": str})


def main():
    closed, open_wo = _read("workorders_closed.csv"), _read("workorders_open.csv")

    model, metrics, importance = train(closed)
    print("holdout metrics:", {k: round(v, 3) if isinstance(v, float) else v for k, v in metrics.items()})
    print("\ntop features (perm. importance, roc_auc_ovr drop):")
    print(importance.head(10).round(4).to_string())

    scored = score(model, open_wo, closed)
    scored["new_description"] = explain(scored, closed)
    scored[OUT_COLS + ["new_description"]].to_csv(PROCESSED_DIR / "backlog_scored.csv", index=False)

    # final.csv = original columns as-is + OLD_STATUS + NEW_STATUS + NEW_DESCRIPTION, for the UI
    raw = pd.read_csv(WORKORDERS_CSV, encoding="utf-8-sig", low_memory=False, dtype=str)
    final = raw.merge(scored[["work_order_id", "new_status", "new_description"]]
                      .rename(columns={"work_order_id": "WORK_ORDER_ID", "new_status": "NEW_STATUS",
                                       "new_description": "NEW_DESCRIPTION"}),
                      on="WORK_ORDER_ID", how="inner")
    final.insert(final.columns.get_loc("NEW_STATUS"), "OLD_STATUS", final["PRIORITY"])
    final.to_csv(PROCESSED_DIR / "final.csv", index=False)
    print(f"final.csv: {len(final):,} rows, {final.shape[1]} cols")

    print(f"\nscored {len(scored):,} OPEN WOs -> backlog_scored.csv")
    print("priority -> new_status:")
    print(pd.crosstab(scored["priority"], scored["new_status"]).to_string())
    print(f"changed: {scored['changed'].sum():,}")
    print("\ntop 10:")
    print(scored[["rank", "risk_score", "priority", "new_status", "p_high", "asset_type", "work_type",
                  "street_class", "age_days", "address"]].head(10).to_string(index=False))


if __name__ == "__main__":
    main()
