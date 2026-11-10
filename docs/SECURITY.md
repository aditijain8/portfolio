# Security design and review

## Design
* **Authentication:** server-side session (`PORTFOLIO_SESSION`, HttpOnly, SameSite=Lax, `Secure` via `COOKIE_SECURE`), BCrypt(12) password hashes, 60 min idle timeout, session-fixation protection (`changeSessionId`), generic login error, per-email **and** per-IP failure throttling (429 + `Retry-After`).
* **Authorisation:** one `SecurityFilterChain`: `/api/public/**` open, `/api/admin/**` requires `ROLE_ADMIN`, everything else `denyAll`. Public queries hard-code `published = true` in the service layer, so authorisation never depends on the UI.
* **CSRF:** cookie-to-header token on all state-changing requests (public contact form included). Session cookie is SameSite=Lax.
* **CORS:** disabled unless `CORS_ALLOWED_ORIGINS` is set to an explicit list (never `*`). The recommended deployment is same-origin so it is not needed.
* **Admin bootstrap:** environment variables only, minimum 12 characters, no endpoint, no default password, nothing in migrations.
* **Uploads:** PDF — magic bytes `%PDF-`, `%%EOF` trailer, 5 MB cap, rejects `/JavaScript`, `/JS`, `/Launch`, `/EmbeddedFile`. Images — JPEG/PNG/WebP by magic bytes, 3 MB cap, SVG rejected. Storage names are server-generated UUIDs checked by a strict regex; the local backend also verifies the resolved path stays inside its root (path traversal). Original filenames are sanitised and used for display only; downloads use a fixed filename. Files are served with `nosniff`; resumes are only reachable through the publication-checked endpoint or the authenticated preview, never as static assets.
* **Resume safety:** upload → store bytes → insert row (compensating delete on failure) → publish as a single transaction; `published_flag UNIQUE` makes "at most one published" a database guarantee; the published version cannot be deleted.
* **Injection / XSS:** JPA parameter binding and Criteria API (LIKE wildcards escaped); React renders database text as text; URLs are validated server-side (`^https?://`) and again by `safeUrl()` before rendering; nginx/Caddy CSP in the container images.
* **Secrets:** only via environment; `.env` is git-ignored; passwords and file contents are never logged; error responses contain no stack traces.

## Review against the requested checklist (this repository, 2026-10-25)
| Risk | Status |
|---|---|
| Broken authorisation / IDOR | Admin endpoints under `/api/admin/**`, tested anonymously (401) for reads and writes. Draft projects and unpublished resumes are not addressable via public routes (tests). Single-admin model, so no per-user object ownership. |
| XSS | No `dangerouslySetInnerHTML`; test confirms `<b>` in a description renders as text. Contact messages shown with React escaping. |
| CSRF | Enforced and tested (write without token → 403). |
| SQL injection | No string-built SQL; wildcard/quote search test passes. |
| Path traversal | Strict key regex + `normalize().startsWith(root)`; unit-tested. |
| Unsafe uploads | Content sniffing, size limits, no SVG; tested (text-as-pdf, HTML-as-pdf, EXE, JS-PDF, truncated, empty, oversize). |
| Exposed secrets | None in source; `.env.example` placeholders only. Test-only credentials exist in `src/test/resources/application-test.yml` (H2 in-memory, never used in production). |
| Insecure CORS | Off by default; explicit origins only. |
| Missing validation | Bean Validation on every request record + service-level checks. |

## Known limitations / residual risk
* Throttling and contact rate limits are **in memory** (single instance; reset on restart).
* PDF filtering is a best-effort byte scan, not a full PDF parser or antivirus. Only the administrator can upload.
* Project images are public by unguessable UUID even while the project is a draft (they are not listed anywhere, but anyone with the URL can fetch them).
* Behind proxies, client IP comes from `X-Forwarded-For`; the e-mail throttle is the dependable defence.
* Swagger UI/API docs are unauthenticated when `API_DOCS_ENABLED=true` — development only.
* No automated dependency/vulnerability scanning is configured; run `./mvnw versions:display-dependency-updates` and `npm audit` periodically.
* Tests ran on H2 (PostgreSQL mode); see README for the PostgreSQL verification status.
