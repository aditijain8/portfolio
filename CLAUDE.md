# CLAUDE.md

Personal portfolio for Aditi Jain: React/TS/Vite/Tailwind frontend + Spring Boot 4 / Java 17 / PostgreSQL backend. One administrator, no public registration.

## Commands
- Backend: `cd backend && ./mvnw test` · `./mvnw spring-boot:run` (needs DB_* env, see `.env.example`)
- Frontend: `cd frontend && npm run dev | npm test | npm run build`
- Full stack: `docker compose up --build` (copy `.env.example` → `.env` first)
- Verify everything: use the `verify-portfolio` skill.

## Architecture
- `backend/src/main/java/dev/aditi/portfolio/<feature>/` — one package per feature (project, resume, media, profile, experience, skill, contact), each Controller → Service → Repository → Entity with DTO records. Shared: `common/` (ApiException, GlobalExceptionHandler, Sanitize), `security/`, `storage/`, `config/`.
- Schema is owned by Flyway (`db/migration`, `ddl-auto: none`). **Never edit an applied migration; add `V<n>__*.sql`.** Keep SQL portable (tests run on H2 in PostgreSQL mode).
- Public API: `/api/public/**` (read-only, published content only). Admin API: `/api/admin/**` (ROLE_ADMIN). Everything else is `denyAll`.
- Files (resume PDFs, images) go through `storage.FileStorage` (`database` default for free hosting, `local` for volumes). Keys are server-generated UUIDs validated by `StorageKeys`.
- Frontend talks to the API same-origin only (Vite proxy / nginx / Cloudflare Function). Admin pages are lazy-loaded under `src/admin`.

## Conventions
- Controllers never expose entities; use DTO records. Validation via Bean Validation + service checks.
- Text from the database is rendered as text in React (never `dangerouslySetInnerHTML`); outgoing links go through `safeUrl()`.
- Visual tokens live in `frontend/src/index.css` (`@theme`). Reuse `components/ui/*`; keep animations CSS-only and reduced-motion safe. Essential content must never depend on an animation.
- Add tests with every behaviour change (`backend/src/test`, `frontend/src/test`).

## Critical constraints (do not break)
- No default/hard-coded admin credentials anywhere. Admin is created only from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env at startup (`AdminInitializer`); there is no HTTP endpoint for it.
- Unpublished projects/resume versions must never be reachable via `/api/public/**`. Resume publish is one transaction; `resume_version.published_flag` is UNIQUE (TRUE or NULL).
- Uploads: validate real content (PDF magic bytes / image magic bytes), size-limit, random storage names, no SVG.
- CSRF: cookie token + `X-XSRF-TOKEN` header on every non-GET. Session cookie is HttpOnly; `COOKIE_SECURE=true` in production.
- Never log passwords/secrets. Never commit `.env`. Never publish confidential employer/client project details — seeded work projects stay drafts until the owner confirms.
