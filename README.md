# NORA - Neighborhood Operating & Resilience Atlas

NORA is a participatory operating system for a future city. It combines live neighborhood conditions, resident observations, public pilots, and scenario planning so communities can see tradeoffs before a city spends money.

## Why it belongs in tomorrow's city

Most "smart city" tools optimize infrastructure from the top down. NORA puts people in the loop: a resident can notice a problem, see it alongside sensor and service data, turn it into a public pilot, and test a transparent response in the same place.

## Demo highlights

- Run the guided 3-minute demo from the hero button.
- Inspect the city operations snapshot for API status, SQL-backed signals, active pilots, and recent civic actions.
- Click the 3D city districts and watch selected interventions appear as visible city changes.
- Explore the living city map and switch between pulse, mobility, and climate layers.
- Select districts to compare heat, mobility, water risk, safety, air quality, belonging, equity priority, and live alerts.
- Submit neighborhood signals that persist to the SQL backend.
- Vote on signals, send them to triage, and promote high-priority signals into public pilots.
- Inspect the SQL-backed civic audit trail for signal, vote, pilot, and proposal activity.
- Bundle civic interventions in the 2035 sandbox and watch budget, before/after impact, equity, confidence, and district-specific forecasts update.
- Generate a printable proposal summary that explains the selected interventions, cost, projected reach, and public value.
- Test responsive layouts across desktop, tablet, and mobile.

## Run locally

Start the SQL backend and frontend together with one command:

```bash
pnpm install
pnpm dev
```

The API runs on `http://localhost:8787`, the frontend runs on `http://localhost:5174`, and Vite proxies `/api` requests to the backend. The SQLite-compatible database file is created at `data/nora.sqlite`.

Create a production build with:

```bash
pnpm build
```

Run the production app with one local server:

```bash
pnpm start
```

The production server runs at `http://localhost:8787` and serves both the API and the built frontend.

## Built with

React, Vite, Express, SQL.js/SQLite storage, Three.js, Lucide icons, custom SVG data visualizations, and responsive CSS.
