"""Fill slide 4 of the pitch deck from the scored backlog.

Reads data/processed/backlog_scored.csv - the output of the priority model -
keeps the tree work orders, and rewrites the table on slide 4 of
deck/index.html between the PRIORITY_ROWS markers.

The scored backlog covers every asset type and is filtered to STATUS == 'OPEN',
so only a handful of its rows are trees. Slides 1-3 describe the wider active
tree backlog (OPEN + ASSIGNED + HOLD + REVIEWED + APPROVED), which is a
different population - see the note in deck/README.md.

Usage:  uv run generate_deck.py [--top N]
"""

import argparse
import datetime as dt
import html
import re
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
SCORED = ROOT / "data" / "processed" / "backlog_scored.csv"
DECK = ROOT / "deck" / "index.html"

TREE_ASSET = "AST_TREE"

SHORT_CLASS = {
    "ARTERIAL": "Arterial",
    "MAJOR COLLECTOR": "Major coll.",
    "MINOR COLLECTOR": "Minor coll.",
    "LOCAL STREET": "Local",
}
HOT_CLASSES = {"ARTERIAL", "MAJOR COLLECTOR"}

# The model's own priority label drives the score colour. Its risk_score is on a
# different scale from the mock-up's 0-100, so thresholds on the number itself
# would wash out; the label is what the model actually asserts.
PRIORITY_COLOUR = {
    "High": "var(--danger)",
    "Medium": "var(--accent2)",
}


def load_tree_rows(top: int) -> tuple[pd.DataFrame, int]:
    scored = pd.read_csv(SCORED, low_memory=False)
    trees = scored[scored.asset_type == TREE_ASSET].nsmallest(top, "rank")
    return trees, len(scored)


def tidy_address(raw: object) -> str:
    """'467 POPLAR DR, COLE HARBOUR, B2W 4L2' -> '467 Poplar Dr'."""
    if not isinstance(raw, str) or not raw.strip():
        return "Address not recorded"
    street = raw.split(",")[0].strip()
    return " ".join(word.capitalize() for word in street.split())


def format_age(days: object) -> str:
    if pd.isna(days):
        return "—"
    days = int(days)
    return f"{days / 365:.1f}y" if days >= 365 else f"{days}d"


def is_true(value: object) -> bool:
    return str(value).strip().lower() == "true"


def render_rows(trees: pd.DataFrame) -> str:
    rows = []
    for position, (_, o) in enumerate(trees.iterrows(), start=1):
        colour = PRIORITY_COLOUR.get(o.priority)
        colour = f' style="color:{colour};"' if colour else ""

        district = (
            f"District {int(o.district)}" if pd.notna(o.district) else "Unassigned"
        )

        flags = []
        if isinstance(o.street_class, str) and o.street_class in SHORT_CLASS:
            hot = " hot" if o.street_class in HOT_CLASSES else ""
            flags.append(f'<span class="flag{hot}">{SHORT_CLASS[o.street_class]}</span>')
        if is_true(o.any_wires_25m):
            flags.append('<span class="flag wire">Near wires</span>')
        if o.priority in PRIORITY_COLOUR:
            flags.append(f'<span class="flag">{o.priority}</span>')

        rows.append(
            '            <div class="mock-row">'
            f'<span class="mock-rank">{position}</span>'
            f'<span class="mock-addr">{html.escape(tidy_address(o.address))}</span>'
            f"<span>{district}</span>"
            f'<span class="mock-score"{colour}>{o.risk_score:.0f}</span>'
            f'<span class="mono">{format_age(o.age_days)}</span>'
            f'<span class="mock-flags">{"".join(flags)}</span>'
            "</div>"
        )
    return "\n".join(rows)


def splice(text: str, marker: str, body: str) -> str:
    """Replace whatever sits between <!-- MARKER:START --> and :END."""
    pattern = re.compile(
        rf"(<!-- {marker}:START -->\n).*?(\n\s*<!-- {marker}:END -->)",
        re.DOTALL,
    )
    text, n = pattern.subn(lambda m: m.group(1) + body + m.group(2), text)
    if n != 1:
        raise SystemExit(f"expected 1 {marker} block in {DECK}, found {n}")
    return text


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--top", type=int, default=5, help="rows to show (default 5)")
    args = p.parse_args()

    trees, backlog_size = load_tree_rows(args.top)
    if trees.empty:
        raise SystemExit(f"no {TREE_ASSET} rows in {SCORED}")

    ranks = trees["rank"].astype(int)
    provenance = (
        f"Tree work orders in the scored backlog · "
        f"ranks {ranks.min():,}–{ranks.max():,} of {backlog_size:,} · "
        f"generated {dt.date.today():%b} {dt.date.today().day}, {dt.date.today().year}"
    )

    deck = DECK.read_text(encoding="utf-8")
    deck = splice(deck, "PRIORITY_ROWS", render_rows(trees))
    deck = splice(deck, "SUBTITLE", f'            <div class="sub">{provenance}</div>')
    DECK.write_text(deck, encoding="utf-8")

    print(f"{len(trees)} tree rows of {backlog_size:,} scored -> {DECK.relative_to(ROOT)}")
    for position, (_, o) in enumerate(trees.iterrows(), start=1):
        print(
            f"  {position}. {tidy_address(o.address):<28} "
            f"rank {int(o['rank']):>5}  risk {o.risk_score:>5.1f}  {o.priority}"
        )


if __name__ == "__main__":
    main()
