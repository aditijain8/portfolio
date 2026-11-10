# Beginner guide: run it on your laptop, then put it online for free

Project folder: `C:\Users\hp\Aditi Projects and work\aditi-portfolio`
Use **PowerShell** for every command below (Start menu → type "PowerShell").

---

## Part 1 — Run it on your laptop

### What you need installed (you already have these)
| Tool | Check with | Needed for |
|---|---|---|
| Java 17 | `java -version` | the backend |
| Node.js 20+ | `node -v` | the website |
| PostgreSQL | pgAdmin app opens | the database |
| Git | `git --version` | uploading to GitHub later |

The Maven build tool is included in the project (`mvnw.cmd`), nothing else to install.

### Step 1 — Create an empty database (once)
1. Open **pgAdmin 4** (installed with PostgreSQL). Enter the master password you chose during installation.
2. Left panel: *Servers → PostgreSQL 18* (enter the `postgres` password you chose at install time).
3. Right-click **Databases → Create → Database…**, name it `portfolio`, click **Save**.

> Forgot the `postgres` password? Ask me — I can switch you to a self-contained local database that needs no password.

### Step 2 — Start the backend (window 1)
```powershell
cd "C:\Users\hp\Aditi Projects and work\aditi-portfolio\backend"
$env:DB_URL="jdbc:postgresql://localhost:5432/portfolio"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="YOUR-POSTGRES-PASSWORD"
$env:ADMIN_EMAIL="your-email@example.com"
$env:ADMIN_PASSWORD="choose-a-long-passphrase-12+-characters"
.\mvnw.cmd spring-boot:run
```
* The first run downloads libraries (a few minutes). Wait for the line `Started PortfolioApiApplication`.
* `ADMIN_EMAIL` / `ADMIN_PASSWORD` create **your admin account on the first start only**. Next time you start, leave those two lines out.
* These `$env:` settings only last in this window. If you close it, type them again (without the two ADMIN lines).
* Leave this window open. `Ctrl+C` stops it.

### Step 3 — Start the website (window 2)
```powershell
cd "C:\Users\hp\Aditi Projects and work\aditi-portfolio\frontend"
npm install
npm run dev
```
(`npm install` is needed only the first time.)

### Step 4 — Open it
* Website: http://localhost:5173
* Admin: http://localhost:5173/admin/login — sign in with the email and passphrase from Step 2.

### Every day after that
Open two PowerShell windows and repeat Step 2 (without the ADMIN lines) and Step 3 (`npm run dev` only). PostgreSQL starts automatically with Windows.

### Using the admin
* **Profile** → add your GitHub, LinkedIn, email, site address.
* **Projects** → *New project*: fill in the title and a real summary → *Save* → *Preview* → *Publish*.
* **Resume** → choose a PDF → *Upload* → *Preview* → *Publish & replace*.
* **Experience / Skills** → edit your timeline and skills.

### If something goes wrong
| Message | Fix |
|---|---|
| "site can't be reached" | Window 1 or 2 isn't running. Start both. |
| `password authentication failed` | Wrong `DB_PASSWORD`. |
| `database "portfolio" does not exist` | Redo Step 1. |
| `Port 8080 was already in use` | Another copy is running; close it, or restart the laptop. |
| `mvnw is not recognized` | Use `.\mvnw.cmd` (with `.\` and `.cmd`). |
| Can't sign in | Admin only exists if `ADMIN_EMAIL`/`ADMIN_PASSWORD` were set on a start where the database was empty of admins. To reset: set them again plus `$env:ADMIN_RESET="true"` for one start. |

---

## Part 2 — Put it online for free

**The plan (3 free services, no code changes):**
```
Visitor → Cloudflare Pages (the website) → Render (Java backend) → Neon (database, also stores your PDFs/images)
```
Honest limits: the free Render backend **falls asleep after ~15 minutes without visitors**; the next visitor waits about a minute. Free plans can change — check each site's pricing page when you sign up. Total cost: $0.

### Step A — Put the code on GitHub
1. Create an account at https://github.com. Click **New repository**, name it `portfolio`, choose **Private**, don't add a README, click Create.
2. In PowerShell:
```powershell
cd "C:\Users\hp\Aditi Projects and work\aditi-portfolio"
git init
git add .
git commit -m "Initial portfolio"
git branch -M main
git remote add origin https://github.com/YOUR-GITHUB-NAME/portfolio.git
git push -u origin main
```
Your passwords and `.env` files are **not** uploaded (they are listed in `.gitignore`). Check on GitHub that no `.env` or `.localdev` folder appears.

### Step B — Free database (Neon)
1. Sign up at https://neon.com (you can use your GitHub login) → **Create project** (name `portfolio`, pick the region closest to you).
2. Open **Connection details**. Turn **off** "Connection pooling" so you get the *direct* host (it does **not** contain `-pooler`).
3. Write down: **host**, **database name**, **user**, **password**. Build this value:
   `jdbc:postgresql://HOST/DATABASE?sslmode=require`

### Step C — Free backend (Render)
1. Sign up at https://render.com (GitHub login) → **New → Web Service** → pick your `portfolio` repo.
2. Settings:
   * **Language:** Docker
   * **Root Directory:** `backend`
   * **Instance type:** Free
   * **Health Check Path:** `/actuator/health/liveness`
3. **Environment variables** (Add each):
   | Name | Value |
   |---|---|
   | `DB_URL` | the `jdbc:postgresql://…` from Step B |
   | `DB_USERNAME` | Neon user |
   | `DB_PASSWORD` | Neon password |
   | `COOKIE_SECURE` | `true` |
   | `STORAGE_TYPE` | `database` |
   | `API_DOCS_ENABLED` | `false` |
   | `ADMIN_EMAIL` | your email |
   | `ADMIN_PASSWORD` | a long passphrase (12+ chars) |
   | `APP_PUBLIC_URL` | leave for now; set in Step E |
4. Click **Create Web Service**. The first build takes several minutes. When it says *Live*, copy its address (like `https://portfolio-api-xxxx.onrender.com`).
5. Test: open `https://…onrender.com/actuator/health/liveness` → you should see `{"status":"UP"}`.

### Step D — Free website (Cloudflare Pages)
1. Sign up at https://dash.cloudflare.com → **Workers & Pages → Create → Pages → Connect to Git** → pick the repo.
2. Settings:
   * **Root directory:** `frontend`
   * **Build command:** `npm run build`
   * **Build output directory:** `dist`
   * **Environment variables:** `BACKEND_ORIGIN` = your Render address (no trailing slash), and `NODE_VERSION` = `22`
3. **Save and Deploy**. You get an address like `https://portfolio-xxx.pages.dev`.
4. Open it: the site should show your content. (If the page loads but data is missing, the `BACKEND_ORIGIN` value is wrong, or wait ~1 minute for the sleeping backend to wake.)

### Step E — Final settings (important)
1. In Render → your service → **Environment**:
   * set `APP_PUBLIC_URL` to your `pages.dev` address (or your own domain)
   * **delete `ADMIN_PASSWORD`** and save (the service restarts)
2. Go to `https://YOUR-SITE/admin/login`, sign in, then fill in Profile, publish projects, upload your resume.

### Step F — Optional extras
* **Stop the sleeping:** make a free account at https://uptimerobot.com and add an HTTP monitor for `https://YOUR-RENDER-ADDRESS/actuator/health/liveness` every 5–10 minutes. Use exactly that address (it doesn't touch the database, so it doesn't use up Neon's free hours).
* **Your own domain:** buy one (that costs money), then add it in Cloudflare Pages → *Custom domains*. Update `APP_PUBLIC_URL`.
* **Backups:** see `docs/BACKUP_RESTORE.md` — do one before big changes.

### Updating the site later
Change the code, then `git add . ; git commit -m "message" ; git push`. Render and Cloudflare redeploy automatically. Content changes (projects, resume, profile) don't need any push — use the admin page.

### Online troubleshooting
| Problem | Cause / fix |
|---|---|
| Site shows loading or errors for ~1 minute | Backend was asleep. Wait; see Step F. |
| Render build fails | Open Render → *Logs*; send me the last 30 lines. |
| Render restarts / "out of memory" | Free plan has little RAM. Add env var `JAVA_OPTS` = `-XX:MaxRAMPercentage=60 -XX:+UseSerialGC`. |
| Login says "Invalid email or password" | Typo, or the admin was created with different values. Use `ADMIN_RESET=true` + new `ADMIN_PASSWORD` for one deploy, then remove both. |
| Cloudflare shows "BACKEND_ORIGIN is not configured" | Add the variable in Pages settings and redeploy. |
| `/api/...` gives 404 on Cloudflare | The `functions` folder wasn't picked up: check Root directory is `frontend`. |
| Resume/images vanish | They don't — they're in the database. If Neon was deleted/expired, restore from a backup. |

The same backend and website were verified to run locally with a PostgreSQL database, but these exact PowerShell commands (and your own PostgreSQL password) were not run by me, and I have not used Render, Neon or Cloudflare accounts, so their screens may look slightly different. If any step differs, tell me what you see and I'll adjust.
