---
name: verify-portfolio
description: Run every automated check for the portfolio (backend tests, frontend tests, type-check, production build) and report honestly what ran and what did not.
---

Run, from the repository root, and report the real output of each step. Never claim a step passed without running it.

1. `cd backend && ./mvnw test` — expect all JUnit tests green (uses H2 in PostgreSQL mode; no database needed).
2. `cd frontend && npm test` — Vitest.
3. `cd frontend && npm run build` — runs `tsc -b` then the Vite production build.
4. Optional smoke test against a real database: start the backend with `DB_*` and `ADMIN_*` env vars, then log in via `/admin/login`, create a project, publish it, upload and publish a PDF resume, and confirm `/projects` and `/resume` show them while drafts stay hidden.
5. Say explicitly which checks could not be run (e.g. Docker daemon not running, no PostgreSQL credentials).
