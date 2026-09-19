# H2O Floss — Deployment & Pre-Launch Correctness Plan

Date: 2026-09-03
Target host: Libyan Spider **shared hosting**, Python app as the main application (cPanel
"Setup Python App" / Passenger). Frontend built to static `dist/` and served by Django.

This plan has two halves: **(A) verify the system is correct** before shipping, and
**(B) the deployment steps** themselves.

---

## A. Pre-launch correctness checklist (do first)

### A1. Automated gates (must pass)
- Backend: `cd backend && .venv/bin/pytest tests` → all tests must pass.
- Frontend: `cd frontend && npm run typecheck && npm run build` → passing.
- Django: `.venv/bin/python manage.py check --deploy` (surfaces prod security warnings — see A4).

### A2. Data / catalog
- The storefront now reads the catalog live (`?featured=true` for the hero; product page by
  slug). Confirm the **real device product** exists, is `is_active`, `is_featured`, priced
  correctly — Home and the product page both mirror it now.
- Seed only if the target DB is empty: `.venv/bin/python manage.py seed_store` (idempotent). Do **not**
  re-seed over a live catalog.

### A3. Manual smoke test (staging or local prod build)
1. Home loads; hero price = dashboard price; WhatsApp/phone = dashboard `store_whatsapp`.
2. Product page: add to cart → cart → checkout (COD and Bank transfer) → order success (no
   bank/secret leakage, order number shown).
3. New order → run the notification command (or wait for cron) → manager(s) get the Telegram
   messages (summary / invoice PDF / bank), each block clearly separated. Chat ids:
   `2111022017`, `5410315705` (Nabeel).
4. Admin: `/admin-login` with the real admin email/password → `/dashboard`.
   - Orders: new-order badge, mark seen / mark-all-seen, status change, note, invoice PDF
     download, print receipt, WhatsApp to customer.
   - Products: all 8 rows show; edit price → reflected on storefront.
   - Customers: list + search.
   - Settings: the **three cards save independently** (change bank only, save, others untouched);
     secret token fields stay blank on reload and are not wiped on save.
5. Log out → dashboard routes redirect to login; direct `/api/v1/admin/*` without a token → 401/403.

### A4. Production security settings (currently dev defaults — MUST change)
In `config/settings/prod.py` / environment:
- `DEBUG = False`
- `SECRET_KEY` = a fresh long random value from env (the dev key is short — see the JWT
  "short key" test warning; production needs ≥ 50 chars).
- `ALLOWED_HOSTS` = the real domain(s).
- `CSRF_TRUSTED_ORIGINS` / `CORS_ALLOWED_ORIGINS` = the real https origin(s).
- HTTPS hardening: `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`,
  `SECURE_HSTS_SECONDS`.
- Confirm the admin account password is strong (not the local `Admin12345`).
- **Revoke the Telegram bot token** that was shared in chat (`/revoke` in BotFather) and set the
  new one in Settings → Telegram on production.

---

## B. Deployment steps (shared hosting)

### B1. Build the frontend into the backend
```bash
cd frontend
npm ci
npm run build           # → frontend/dist
```
Serve `dist/` from Django (WhiteNoise is the shared-hosting-friendly option):
- Add `whitenoise` to requirements and to `MIDDLEWARE` (after `SecurityMiddleware`).
- Point Django at the built assets: collect `dist/` into `STATIC_ROOT`, and add a catch-all
  view/`TemplateView` that serves `dist/index.html` for non-`/api/`, non-`/admin/`, non-`/media/`
  routes so the React Router deep links (e.g. `/dashboard`, `/order/123`) resolve.
- `VITE_API_BASE` stays `/api/v1` (same origin), so no CORS in production.

### B2. Backend on the Python app host
```bash
cd backend
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python manage.py migrate
.venv/bin/python manage.py collectstatic --noinput
.venv/bin/python manage.py createsuperuser     # real admin email + strong password
```
- cPanel "Setup Python App": set the application root, entry `config/wsgi.py`
  (`application`), and the env vars from A4. Restart the app after changes.
- **Media uploads** (product images): ensure `MEDIA_ROOT` is a writable path and served
  (WhiteNoise doesn't serve user media — map `/media/` to that folder via the host, or store
  under a served static path).

### B3. Notifications on production
- Checkout writes a durable notification job and never waits for Telegram or WhatsApp.
- Add a cPanel cron job every minute, using absolute paths:
  ```bash
  /absolute/path/H2o-floss/backend/.venv/bin/python /absolute/path/H2o-floss/backend/manage.py dispatch_order_notifications --limit 20
  ```
- **Telegram** uses outbound HTTPS from that command. Set the *new* bot token + chat ids in
  Settings → Telegram. This is the primary manager channel.
- **WhatsApp self-hosted bot**: NOT possible on shared hosting (needs a persistent process).
  Leave `whatsapp_gateway_url` empty; the code already skips it cleanly. It stays dormant until
  a VPS is available (per the earlier plan).

### B4. Post-deploy verification (on the live domain)
- Re-run the A3 smoke test against the production URL, on **desktop and mobile**.
- Place one real test order and confirm the manager Telegram messages arrive.
- Check `/admin/` (Django admin) and `/dashboard` (staff UI) both require login.
- Confirm no secrets in any public response (`/api/v1/store/settings/` returns only
  `store_whatsapp`).

---

## C. Known constraints / notes
- Shared hosting has no persistent worker; the one-minute cron command processes the database outbox.
- WhatsApp self-hosting remains deferred; Telegram covers the primary manager notification need.
- Passenger may recycle the web app when idle without interrupting notification delivery because
  notification jobs are stored in the database.
- Mobile: the main flows (Home, Product, Cart, Checkout, Order Success, Dashboard) were verified
  responsive. Re-check any custom/marketing page added later at 375px width.

## D. Rollback
- Keep the previous `dist/` and DB backup. To roll back: restore `dist/`, `git checkout` the
  prior backend revision, `migrate` if needed, restart the Python app.
