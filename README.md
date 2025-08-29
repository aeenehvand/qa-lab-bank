# QA Lab Bank

A tiny **banking‑lite web app** used to demonstrate end‑to‑end quality engineering:
- API + (later) UI
- Automated tests (API, E2E, performance, security)
- CI ideas (to be added)
- Documentation kept in `docs/` (this repo is the single source of truth)

> Start simple. We will grow it step by step.

## Repo layout
```
qa-lab-bank/
  app/
    api/           # minimal API (runs today)
    web/           # UI (added later)
  tests/
    api/           # API tests (added soon)
    e2e/           # Playwright tests (added soon)
  docs/            # all documentation lives here
  tools/           # helper tools (e.g., flakewatch later)
```
