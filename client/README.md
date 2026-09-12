# client — HRM Work Order Re-triage UI

Next.js dashboard over `data/processed/final.csv` (generate with
`cd backend && uv run python -m cleanup.run && uv run python -m model.run`).

    npm i
    npm run dev      # http://localhost:3000
    npm test         # vitest: parse / geo

CSV is read on every request (`FINAL_CSV` env overrides path) — rerun the pipeline, reload.
Table: sort by New status (default High→Low, changed first), click a row for the reason. Map: dots by New status.
