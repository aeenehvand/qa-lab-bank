# Project Journal

This journal records every small step. Newest entries at the top.

## 2025-08-29
- Ran API locally on port 3001.
- Verified login, list accounts, transfer, and transactions via curl.
- Next: add a tiny web UI scaffold and first E2E test later.
- Pushed first version to GitHub: https://github.com/aeenehvand/qa-lab-bank

## 2025-08-29 (earlier)
- Created repo skeleton.
- Agreed on project name: **qa-lab-bank**.
- Decided to keep documentation in Markdown inside `docs/` and push to GitHub.

## 2025-08-31
- Added "Transfer €5" demo button in the UI.
- Verified that balances update correctly (ACC-001 decreases, ACC-002 increases).
- Current UI features: Login, List Accounts, Transfer.
- Next: write the first Playwright E2E test for this flow.

## 2025-08-31
- Installed Playwright and added first E2E test (`transfer.spec.ts`).
- Test covers: login → list accounts → transfer €5 → verify balances update.
- Verified test runs successfully in headed mode.
- Next: add more E2E tests (e.g., invalid login, multiple transfers).

