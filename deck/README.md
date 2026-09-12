# Pitch deck

`index.html` is the four-slide TreeOps deck. Open it in a browser — arrow keys,
space, or the on-screen arrows move between slides. No build step, no server.

## Slide 4 comes from the model

The priority table on the last slide is generated from
`data/processed/backlog_scored.csv` — the priority model's output — rather than
typed in by hand. To rebuild it after the model reruns:

```sh
cd backend
uv run generate_deck.py           # the tree rows, ordered by model rank
uv run generate_deck.py --top 3
```

The script rewrites only the blocks between the `PRIORITY_ROWS` and `SUBTITLE`
markers in `index.html`, so the rest of the deck can be edited freely by hand.
Columns map straight onto the model's output: `risk_score` into Score,
`age_days` into Age, and `street_class` / `any_wires_25m` / `priority` into the
flags. Score colour follows the model's `priority` label, not the number, since
`risk_score` is on a different scale from the original mock-up.

## Read this before presenting: slides 1–3 and slide 4 count different things

| | Slides 1–3 | `backlog_scored.csv` (slide 4) |
| --- | --- | --- |
| Asset filter | `AST_TREE` only | every asset type |
| Status filter | OPEN, ASSIGNED, HOLD, REVIEWED, APPROVED | `OPEN` only |
| Population | 3,543 tree work orders | 4,361 rows, of which **5 are trees** |

Tree work in this extract sits almost entirely in ASSIGNED, HOLD and REVIEWED —
only 5 tree orders carry the literal status `OPEN`. So slide 4 currently shows
those 5, at model ranks 232 through 4,139, topped by a Medium-priority pruning
job on a local street. It is not the top of the backlog, and the subtitle on the
slide says so.

To make slide 4 the arterial-hazard list the first three slides set up, the
scoring pipeline needs to treat the same population they do — the five active
statuses on `AST_TREE`, not `STATUS == 'OPEN'`. That is a filter change upstream
in the model, not something this script can correct after the fact.
