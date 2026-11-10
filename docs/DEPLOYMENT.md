# Deployment guide (zero-cost first)

> Free tiers change often. The figures below come from provider documentation and web searches on **2026-10-25**; several third-party sources disagreed with each other and are flagged. **Re-check each provider's pricing page before relying on a number.** Nothing in this repository was deployed to these providers during development.

## What the app needs

| Need | Why |
|---|---|
| Static hosting for `frontend/dist` | The React SPA |
| A JVM host (≈ 512 MB+ RAM) | Spring Boot API. The JVM alone uses ~200–300 MB |
| PostgreSQL | All content **and** (by default) uploaded PDFs/images (`STORAGE_TYPE=database`) |
| Same-origin routing of `/api/*` (+ `/sitemap.xml`, `/robots.txt`) to the API | First-party HttpOnly cookies and CSRF without CORS exposure |
| HTTPS | Required for `COOKIE_SECURE=true` |

## Provider comparison

| Option | Free allowance (per official/other sources) | Sleep / cold start | Persistence | Custom domain | Caveats |
|---|---|---|---|---|---|
| **Cloudflare Pages** (frontend) | Unlimited static requests & bandwidth, 500 builds/month, 100 custom domains/project, 20,000 files ([docs](https://developers.cloudflare.com/pages/platform/limits/)) | None (static) | n/a | Yes | Proxying `/api` needs a Pages Function (counts against the Workers free request quota) |
| **Render** web service (backend) | 750 free instance-hours/month; spins down after 15 min without traffic, ~1 min to wake; **ephemeral filesystem**; no persistent disk on free ([docs](https://render.com/docs/free)) | **Yes** — first request after idle takes about a minute | Disk lost on redeploy → use `STORAGE_TYPE=database` | Yes | 512 MB RAM is tight for Spring Boot (Dockerfile is tuned for it). One always-on free service fits in 750 h only if nothing else uses the pool |
| **Render Postgres** (free) | 1 GB, no backups, **expires 30 days after creation** (+14 days grace, then deleted) ([docs](https://render.com/docs/free)) | — | Deleted if not upgraded | — | **Do not use** for a permanent portfolio |
| **Neon** Postgres | Free plan with scale-to-zero after 5 min idle. **Sources conflict:** 0.5 GB/50 CU-h vs 1 GB/100 CU-h per project ([pricing](https://neon.com/pricing)) | Compute wakes in about a second or so on first query | Data persists while the project exists | — | Check current quota. Health checks that query the DB keep compute awake and consume CU-hours — keep-alive pings must target `/actuator/health/liveness` (no DB access) |
| **Supabase** Postgres | Reported (third-party) 500 MB/project, **paused after 7 days of inactivity** | Manual un-pause | — | — | Unverified against official docs; a quiet portfolio could be paused |
| **Oracle Cloud Always Free** VM | Ampere A1: first 1,500 OCPU-h + 9,000 GB-h per month ≙ **2 OCPU / 12 GB** always-on ([docs](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)) | **None** (real VM) | Persistent boot/block volume | Yes (your DNS) | **Requires a credit/debit card for verification** (not charged unless you upgrade; prepaid/virtual cards rejected). Capacity availability varies by region. You run and patch the server |
| Fly.io / Koyeb / others | Reports conflict (Fly: no free tier for new users; Koyeb: free instance reported with changing specs and a card hold) | — | — | — | Not recommended without verifying current terms |

## Recommendation

### Option A — truly zero cost, no card (with trade-offs): **Cloudflare Pages + Render (Docker) + Neon**

* Frontend: Cloudflare Pages (global CDN, no sleep).
* API: Render free web service built from `backend/Dockerfile`.
* Database + files: Neon (PDFs and images live in the database, so they survive Render's redeploys).

**Honest limitations**

1. **Cold starts:** after 15 idle minutes the API sleeps; the first visitor waits ~1 minute (the SPA shows loading skeletons, then content). Recruiters who open your link after a quiet period will experience this. Mitigations: a free uptime pinger calling `https://<api>/actuator/health/liveness` every ~10 minutes keeps it awake (one always-on service uses ~744 of the 750 free hours; this relies on provider terms staying as documented — check them). Do **not** ping `/actuator/health` (it touches the DB and would burn Neon compute hours).
2. Neon's compute also idles after 5 minutes; the first query after idle is slower but quick.
3. Free quotas can change or be withdrawn; keep the backup routine in `BACKUP_RESTORE.md`.
4. JVM memory is tight at 512 MB. If the service restarts with out-of-memory errors, lower `JAVA_OPTS` (`-XX:MaxRAMPercentage=60`) or move to Option B.
5. Contact-form spam counters and login-throttle counters reset on every restart (in-memory).

### Option B — always-on, still $0: **Oracle Always Free VM running `deploy/docker-compose.prod.yml`**

No sleeping, persistent disk, runs Postgres + API + frontend + HTTPS (Caddy) on one machine. Costs: needs a card for verification, you maintain the server (OS updates, backups), and the compose file in `deploy/` was **not executed** in this project's verification — review before use.

### Option C — paid later

Everything is plain Docker + env vars: move the API to any container host, point `DB_URL` at any PostgreSQL, switch `STORAGE_TYPE=local` with a persistent volume if you prefer files on disk. No code changes.

## Option A step by step

### 1. Database (Neon)
1. Create a project and database; copy the **JDBC-style** connection details: host, database, user, password.
2. You will set: `DB_URL=jdbc:postgresql://<host>/<db>?sslmode=require`, `DB_USERNAME`, `DB_PASSWORD`.

### 2. Backend (Render)
1. New → Web Service → connect the Git repository → *Language: Docker*, root directory `backend`.
2. Instance type: Free. Health check path: `/actuator/health/liveness`.
3. Environment variables:
   | Variable | Value |
   |---|---|
   | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | from Neon |
   | `COOKIE_SECURE` | `true` |
   | `STORAGE_TYPE` | `database` |
   | `APP_PUBLIC_URL` | `https://your-site-domain` (used in sitemap/robots) |
   | `API_DOCS_ENABLED` | `false` |
   | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | first start only — then delete `ADMIN_PASSWORD` |
   | `CORS_ALLOWED_ORIGINS` | leave **empty** (same-origin proxy) |
4. Deploy. Flyway migrates the schema on first start.

### 3. Frontend (Cloudflare Pages)
1. Create a Pages project from the repository. Root directory `frontend`, build command `npm run build`, output directory `dist`, Node 20+.
2. Add the environment variable `BACKEND_ORIGIN=https://<your-service>.onrender.com`. The functions in `frontend/functions/` proxy `/api/*`, `/sitemap.xml` and `/robots.txt` to it, so the browser sees one origin.
3. Attach your custom domain (optional) and set `APP_PUBLIC_URL` on the backend to it.

*Netlify alternative:* add `frontend/public/_redirects`:
```
/api/*        https://<backend-host>/api/:splat  200
/sitemap.xml  https://<backend-host>/sitemap.xml 200
/robots.txt   https://<backend-host>/robots.txt  200
/*            /index.html                         200
```
(Check Netlify's current free-plan terms first.)

### 4. First sign-in
Visit `https://<site>/admin/login`, sign in, remove `ADMIN_PASSWORD` from Render, then fill in the profile and links and publish projects/resume.

## Client IP and rate limiting behind proxies
The API sees the proxy chain via `X-Forwarded-For` (`server.forward-headers-strategy=native`). Login throttling is keyed on **both** e-mail and IP, so a spoofed header cannot bypass the e-mail-based limit.

## Pre-launch checklist
- [ ] `COOKIE_SECURE=true`, HTTPS only, `API_DOCS_ENABLED=false`
- [ ] `ADMIN_PASSWORD` removed from the environment
- [ ] Profile links, e-mail, site URL filled in; seeded draft projects reviewed (unpublish/delete anything you may not publish)
- [ ] Resume uploaded and published; download tested
- [ ] A database backup taken and restore tested
