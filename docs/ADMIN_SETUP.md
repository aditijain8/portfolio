# Administrator setup

There is exactly one administrator and **no registration, setup or reset endpoint**. The account is created at application start-up from environment variables, so only someone who controls the deployment can create or reset it.

## First-time creation

1. Choose a strong passphrase (**minimum 12 characters**; the app refuses to start the bootstrap with less).
2. Set the environment variables for **one** start-up:

   ```bash
   ADMIN_EMAIL=you@example.com
   ADMIN_PASSWORD='your long passphrase'
   ```
   (Docker Compose: put them in `.env`. Render/other hosts: the service's environment settings.)
3. Start the backend. The log shows `Administrator account created.` (the password is never logged).
4. **Remove `ADMIN_PASSWORD` from the environment** and restart/redeploy. If it stays set the app only warns and ignores it, but secrets should not linger.
5. Sign in at `/admin/login`.

The password is stored as a BCrypt (cost 12) hash. Nothing is seeded by the database migrations.

## Changing the password

Admin → *Profile* → *Change administrator password* (requires the current password, 12+ characters).

## Forgotten password / locked out

Set these for one start-up, then remove them again:

```bash
ADMIN_RESET=true
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD='a new long passphrase'
```

Existing sessions keep working until they expire (60 min idle by default); restart the service to drop all sessions.

## Brute-force protection

After 5 failed sign-ins (configurable: `LOGIN_MAX_FAILURES`, `LOGIN_WINDOW_MINUTES`) for the same e-mail **or** the same client IP within 15 minutes, further attempts get HTTP 429 with `Retry-After`. The counters are in memory (reset on restart) — appropriate for a single-instance personal site.
