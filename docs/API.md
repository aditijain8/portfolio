# API overview

Interactive OpenAPI documentation (springdoc): set `API_DOCS_ENABLED=true`, then open `/swagger-ui.html` (spec at `/v3/api-docs`). It is off by default and must stay off in production.

All errors use one shape: `{ "timestamp", "status", "error", "message", "fieldErrors"? }`.
State-changing requests need the `X-XSRF-TOKEN` header equal to the `XSRF-TOKEN` cookie (any GET sets it).

## Public (no authentication, published content only)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/public/profile` | name, headline, links |
| GET | `/api/public/skills` | grouped skills |
| GET | `/api/public/experience` | visible entries |
| GET | `/api/public/projects?q=&technology=&category=&featured=&page=&size=` | paginated, published only |
| GET | `/api/public/projects/filters` | technologies + categories of published projects |
| GET | `/api/public/projects/{slug}` | 404 for drafts |
| GET | `/api/public/media/{id}` | images (random UUID ids) |
| GET | `/api/public/resume` | metadata, `204` if none published |
| GET | `/api/public/resume/file[?download=true]` | the published PDF only |
| GET | `/api/public/contact/status` | `{enabled}` |
| POST | `/api/public/contact` | `202` only after the message is stored |
| GET | `/sitemap.xml`, `/robots.txt` | generated |
| GET | `/actuator/health`, `/actuator/health/liveness` | health |

## Administrator (session cookie required → `401` otherwise)

| Area | Endpoints |
|---|---|
| Auth | `POST /api/admin/auth/login` · `POST …/logout` · `GET …/me` · `POST …/change-password` |
| Dashboard | `GET /api/admin/dashboard` |
| Projects | `GET/POST /api/admin/projects` · `GET/PUT/DELETE …/{id}` · `PATCH …/{id}/published` · `PATCH …/{id}/featured` · `PUT …/order` |
| Images | `POST /api/admin/media` (multipart `file`) |
| Resume | `GET/POST /api/admin/resumes` · `GET …/{id}/file` (private preview) · `POST …/{id}/publish` · `POST …/{id}/unpublish` · `DELETE …/{id}` |
| Experience | `GET/POST /api/admin/experience` · `PUT/DELETE …/{id}` |
| Skills | `GET/PUT /api/admin/skills` (replace-all) |
| Profile | `GET/PUT /api/admin/profile` |
| Messages | `GET /api/admin/messages` · `PATCH …/{id}/read` · `DELETE …/{id}` |

Status codes: `200/201/202/204` success · `400` validation · `401` not signed in · `403` missing CSRF token · `404` unknown/unpublished · `409` conflict (duplicate slug, deleting the published resume) · `413` file too large · `429` throttled · `503` contact form disabled.
