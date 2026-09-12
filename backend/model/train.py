import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.inspection import permutation_importance
from sklearn.metrics import average_precision_score, roc_auc_score

from .features import CAT, FEATURES, TIER_RANK, build, target

HOLDOUT_FROM = pd.Timestamp("2024-01-01")


def _model():
    return HistGradientBoostingClassifier(
        max_iter=300, learning_rate=0.05, max_leaf_nodes=31,
        categorical_features=[FEATURES.index(c) for c in CAT],
        random_state=0,  # no class_weight: balanced inflates the rare Medium tier
    )


def train(closed: pd.DataFrame):
    """Multiclass Low/Medium/High. Time-based holdout: fit on WOs initiated before
    HOLDOUT_FROM, evaluate on after. Returns (model refit on everything, metrics, importance)."""
    closed = closed[closed["date_initiated"].notna() & closed["priority"].notna()]
    X, y = build(closed), target(closed)
    tr = closed["date_initiated"] < HOLDOUT_FROM

    m = _model().fit(X[tr], y[tr])
    P = m.predict_proba(X[~tr])
    hi = TIER_RANK["High"]
    metrics = {
        "n_train": int(tr.sum()), "n_test": int((~tr).sum()),
        "test_high_rate": float((y[~tr] == hi).mean()),
        "roc_auc_ovr": float(roc_auc_score(y[~tr], P, multi_class="ovr")),
        "high_pr_auc": float(average_precision_score(y[~tr] == hi, P[:, hi])),
        "accuracy": float((P.argmax(1) == y[~tr]).mean()),
    }
    imp = permutation_importance(m, X[~tr], y[~tr], scoring="roc_auc_ovr", n_repeats=3, random_state=0)
    importance = pd.Series(imp.importances_mean, index=FEATURES).sort_values(ascending=False)

    final = _model().fit(X, y)
    return final, metrics, importance
