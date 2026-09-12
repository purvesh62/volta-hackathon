# HRM Work Order Re-triage — Pipeline

## Problem

Every OPEN work order needs a site visit before anyone knows how urgent it is. `PRIORITY` is set
at intake and 95% of OPEN is `Low` (4,259 of 4,500). It doesn't rank tickets *within* Low, and it
doesn't account for exposure (road class, traffic control) or how long a ticket has sat.

Goal: for every `STATUS=OPEN` WO (asset types `AST_TREE, TRN_STREET, TRN_SECTRAV`), predict the
priority HRM historically assigned to similar closed WOs and emit `new_status` — never lower than
the current label (Low → any, Medium → Medium/High, High → High) — plus a `risk_score` ranking.

## Data

| File | Rows | Source |
|---|---|---|
| `data/city-works.csv` | 118,912 WOs (40,850 tree) | [HRM Cityworks Work Orders](https://data-hrm.hub.arcgis.com/datasets/HRM::cityworks-work-orders) |
| `data/public-trees.csv` | 80,051 trees | [HRM Public Trees](https://data-hrm.hub.arcgis.com/datasets/HRM::public-trees) |

Both use Web Mercator (EPSG:3857) coordinates. No shared key between them.

### Findings from profiling

- `STATUS='OPEN'` = 4,679 raw; 4,500 in the 3 asset types, only 5 of them `AST_TREE`. 3,772 are a 2021 WOOD sidewalk audit bulk load.
- Asset filter: `ASSET_TYPE ∈ {AST_TREE, TRN_STREET, TRN_SECTRAV}`.
- `PROJECT_NAME` carries the useful operational flags: `Tree - Traffic Control Required` (201),
  `Tree - NSP Resource Required` (212, power lines), `Tree - Waiting for Tender` (1,698), `Tree - Parking Issues`.
- `WORK_ORDER_CAUSE` has storm events (Fiona/Lee/Dorian) — ~40 still open.
- Trees: `DBH` is a size class 1–11, not cm. `Condition*` and `Protected From Development` are all null.
  `Wires Present` Y/N is populated (35k Y).
- 5 WOs are dated in the future (up to 2029); 97 have no coordinates.

## Pipeline

```
cd backend
uv run python -m cleanup.run   # -> data/processed/{workorders_open,workorders_closed,trees_clean}.csv
uv run python -m model.run     # -> data/processed/{backlog_scored,final}.csv  (final = raw cols + OLD_STATUS, NEW_STATUS, NEW_DESCRIPTION)
```

`data/processed/` is gitignored; regenerate from the raw CSVs.

### `backend/cleanup/`

| Module | Does |
|---|---|
| `load.py` | reads CSVs (`utf-8-sig`, parses `MM/DD/YYYY hh:mm:ss AM` dates) |
| `clean_workorders.py` | filters to `ASSET_TYPES` (+ optional status set), **drops rows w/o coords**, snake_case, blanks→NaN, future dates→NaT + flag; derives `work_type, is_active, age_days, days_to_finish, is_storm, needs_traffic_control, needs_nsp, waiting_tender, has_coords` |
| `clean_trees.py` | snake_case, `wires`→bool, bad `year_planted`→NaN, `is_ash / is_elm / is_norway_maple` (EAB / DED / weak-crotch species) |
| `join.py` | spatial left join WO → nearest tree via KD-tree |
| `run.py` | CLI |

#### Spatial join

- Web Mercator units are inflated by `1/cos(lat)` (~1.4× at Halifax). Coordinates are scaled by
  `cos(mean lat)` — **one shared factor for both datasets** (per-dataset factors shift them ~70m apart).
- Nearest tree → `tree_dist_m`, `match_conf`: `high` ≤5m / `med` ≤10m / `low` ≤20m / `none`.
- Tree attributes (`tree_id, species_common, dbh_class, wires, loc_gen, year_planted, is_ash`) copied only if ≤10m.
- 25m neighbourhood aggregates for every WO: `n_trees_25m, max_dbh_25m, any_wires_25m, any_ash_25m`.

Match rates (OPEN WOs): 27% high, 23% med, 21% low, 29% none. WO coords are address geocodes,
not tree positions, so only the ≤10m tier is a confident tree match. Removals frequently match
nothing — the tree is often not in inventory or was deleted after removal.

### `backend/model/`

| Module | Does |
|---|---|
| `features.py` | feature set; **excludes `PROJECT_NAME`** (values like `2022 Hurricane Fiona` are assigned with the label → leakage) |
| `train.py` | `HistGradientBoostingClassifier`, multiclass target `PRIORITY ∈ {Low, Medium, High}` (Critical→High), trained on CLOSED/COMPLETE of same asset types, time-based holdout (train <2024-01-01, test after), permutation importance |
| `score.py` | `p_low/p_medium/p_high` → `pred_priority` (argmax, gated by `P_THRESH` + `MIN_SUPPORT`) → `new_status` (= max(current, predicted)); `risk_score`, `blocked`, `rank` |
| `explain.py` | `new_description`: verdict + confidence, closed-history split for the work_type, factors (road class, traffic control, NSP, storm, age, tree) |
| `run.py` | CLI |

#### Scoring

```
risk_score = 100 × (0.6·p_high + 0.2·exposure + 0.2·age_norm)

exposure  = 0.5·road_class(ARTERIAL=1 … LOCAL=0) + 0.25·needs_traffic_control + 0.25·needs_nsp
age_norm  = min(age_days / 3yr, 1)
pred_priority = argmax(p_low, p_medium, p_high)
                if max prob ≥ 0.5 AND work_type has ≥ 100 closed WOs   # else: no opinion, keep current
new_status    = max(priority, pred_priority)       # never downgrade
changed       = new_status != priority
blocked       = waiting_tender OR status == HOLD   # stuck behind procurement
```

#### Results (holdout ≥2024, n=24,441, High rate 41%)

- ROC-AUC (OvR) **0.72**, High PR-AUC **0.69**, accuracy 0.59 — predictive, not deterministic.
- No `class_weight="balanced"`: it ×2.4-upweighted the rare Medium tier and pushed median `p_medium` to 0.75 on the backlog (~3.8k spurious Low→Medium).
- `work_type` carries almost all signal, then `district`, `street_class`. Tree features add little
  (most OPEN rows are sidewalk/street assets).
- OPEN backlog after cleanup: **4,361** (4,074 `TRN_SECTRAV`, 282 `TRN_STREET`, 5 `AST_TREE`; 139 dropped for no coords).
- `priority → new_status`: Low→High **45**, Low→Medium 9, Medium→High 4; 58 changed. Mostly crosswalk / walkway asphalt repairs (94% High historically).
- 3,769 `Unclassified Work Order from WOOD Sidewalk Audit` (2021 bulk load) stay Low: only 61 closed
  examples (< `MIN_SUPPORT`=100), so the model has no opinion. Descriptions say so.
- Top-ranked: crosswalk asphalt repairs on Dartmouth arterials, already High.

## Caveats

- Model learns HRM's *labelling habits*, including inconsistency and storm-season bias.
- Tree join is address-based; treat tree attributes as context, not ground truth for the ticket.
- No condition / damage field exists in either dataset. "Damage" is only inferable from `work_type` + storm cause.
- Only 5 of the 4,361 OPEN WOs are trees; "tree" framing applies to the closed history (40k AST_TREE), not this backlog.
- Blank `STREET_CLASSIFICATION` → exposure = 0.

## Not done / next

- Google geocoding for the 97 coordinate-less WOs (not needed otherwise — both datasets share a CRS).
- Fill blank `STREET_CLASSIFICATION` from road centrelines.
- Enrich with traffic volumes, schools/transit stops, 311 complaint clusters.
- Drop `month` to remove storm-season bias if the aim is "hidden hazards" rather than "predict label".
- Frontend: `client/` (Next.js) reads `final.csv` — see `client/README.md`.
