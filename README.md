# Aditi Jain — Portfolio

A full-stack personal portfolio with a database-backed project manager, a secure resume publishing workflow and a single-administrator dashboard.

| Layer | Stack |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router |
| Backend | Java 17, Spring Boot 4.0.9 (Web, Security, Data JPA, Validation), Flyway, springdoc-openapi |
| Data | PostgreSQL (production/dev), H2 in PostgreSQL mode (automated tests only) |
| Tooling | Maven (wrapper included), Vitest, JUnit 5 + MockMvc, Docker Compose |

Content (profile, skills, experience, projects, resume) lives in the database and is edited from `/admin` — no source changes needed.

## Quick start (Docker)

```bash
cp .env.example .env     # set DB_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD (12+ chars)
docker compose up --build
```

Open http://localhost:5173 (site) and http://localhost:5173/admin/login. Swagger UI: http://localhost:8080/swagger-ui.html (dev only).
After the first start remove `ADMIN_PASSWORD` from `.env` — see [docs/ADMIN_SETUP.md](docs/ADMIN_SETUP.md).

## Quick start (without Docker for the app)

Requirements: JDK 17, Node 20+, a PostgreSQL database.

```bash
# 1. database (once)
createdb portfolio    # or: create a database/user of your choice

# 2. backend  (http://localhost:8080)
cd backend
export DB_URL=jdbc:postgresql://localhost:5432/portfolio DB_USERNAME=postgres DB_PASSWORD=...   # your values
export ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-passphrase'                              # first start only
export API_DOCS_ENABLED=true
./mvnw spring-boot:run

# 3. frontend (http://localhost:5173, proxies /api to :8080)
cd frontend && npm install && npm run dev
```

Flyway creates the schema and seeds starter content on first start (a profile, six **draft** candidate projects, a KPMG India experience entry, skill groups). Nothing seeded is public except the profile/skills/experience text — review it in the dashboard.

## Day-to-day use

* **Add a project:** `/admin/projects` → *New project* → fill in details → *Save* (draft) → *Preview* → *Publish*. Drafts are never served by the public API. Reorder with the arrows; mark *Feature* to show it on the homepage.
* **Publish a resume:** `/admin/resume` → choose a PDF (≤ 5 MB) → *Upload* (stays private) → *Preview* → *Publish & replace*. The switch is a single database transaction; a failed upload never touches the live resume.
* **Profile, links, skills, experience:** the matching admin screens. Empty links are hidden from the public site (no fake placeholder links).
* **Messages:** contact-form messages are stored and readable only by the administrator.

## Commands

| Task | Command |
|---|---|
| Backend tests | `cd backend && ./mvnw test` |
| Backend package | `cd backend && ./mvnw package` |
| Frontend dev | `cd frontend && npm run dev` |
| Frontend tests | `cd frontend && npm test` |
| Frontend production build | `cd frontend && npm run build` (output in `frontend/dist`) |

## Documentation

* [docs/ADMIN_SETUP.md](docs/ADMIN_SETUP.md) — creating / resetting the administrator
* [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — free-tier hosting comparison, recommended architecture, steps, limitations
* [docs/BACKUP_RESTORE.md](docs/BACKUP_RESTORE.md) — backups and restores
* [docs/API.md](docs/API.md) — endpoint overview (full OpenAPI at `/v3/api-docs` when `API_DOCS_ENABLED=true`)
* [docs/SECURITY.md](docs/SECURITY.md) — security design and review notes

## Project layout

```
backend/   Spring Boot API (controller → service → repository → entity, DTO records, Flyway migrations)
frontend/  React SPA (pages, components, admin/, api/, hooks/), Cloudflare Pages Functions proxy in functions/
deploy/    Single-VM production compose + Caddy (HTTPS)
docs/      Guides
```

## Verification status
See the final report in the project hand-off: backend (42 tests) passed on both H2 and a real PostgreSQL 18.4; frontend 15 tests and the production build pass. Docker images/compose files were written but **not built** (Docker daemon was not running) — run `docker compose up --build` once to confirm.
