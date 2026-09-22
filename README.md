# RF Scanner Dashboard

The dashboard includes an open-conflict list for transfers rejected after an offline scanner reconnects. Supervisors can inspect the source, destination, SKU, quantity, and reason, then correct inventory and ask the worker to retry on that scanner. A successful retry disappears from the open list automatically.

The scanner repository's `supabase/offline_conflicts.sql` migration creates the conflict table and submission function before this dashboard's `supabase.sql` reporting function is applied.

A supervisor-facing dashboard for the [RF Stock Move Scanner](https://dakshal72-commits.github.io/RF-Scanner/). It reads the same Supabase transfer and inventory data and presents operational metrics without exposing direct table access.

## Supervisor information

- Completed transfers and units moved
- Frequently moved SKUs
- Busiest source-to-destination routes
- Inventory positions with 10 units or fewer
- Recent transfer audit trail with item quantities
- 7-day, 30-day, and all-time filters

## Technology

JavaScript, HTML/CSS, Supabase/PostgreSQL, GitHub Pages

## Run locally

```bash
python -m http.server 4174 --directory .
```

Open `http://127.0.0.1:4174/`.
