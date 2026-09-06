# Plan — Logo rollout + full dashboard rebuild

Date: 2026-09-03
Scope: `H2o-floss/` (frontend + backend). Two deliverables. This is a plan only.

---

## Part 1 — Roll the real logo across the store

**The asset.** The real brand logo is the wordmark `reference/docStore/static/logo.png`
(405×189, "h2ofloss WATER FLOSSER ليبيا LIBYA"), plus a square emblem
`reference/docStore/media/logo.png` (drop + tooth + wave). Today the storefront uses a
**text-only** brand (`SiteHeader.tsx`, `SiteFooter.tsx` render "H2O Floss ليبيا" as text) —
there is no image logo in the frontend yet. The invoice PDF already uses the wordmark.

**Steps:**
1. Add the assets to the frontend:
   - `frontend/public/brand/logo.png` — the wordmark (for headers/footers).
   - `frontend/public/brand/logo-mark.png` — the square emblem (for favicon / app icon / OG image).
   - A **dark-mode variant**: the wordmark is teal on transparent — legible on light, weak on
     dark. Either ship `logo-light.png` (white/knockout version) or render it inside a subtle
     light chip. Decide per surface.
2. Apply it everywhere the brand shows:
   - `SiteHeader.tsx` — replace the text brand with the wordmark `<img>` (keep alt text).
   - `SiteFooter.tsx` — logo above the tagline.
   - `index.html` — favicon + apple-touch-icon from the emblem; keep `<title>`.
   - Social/OG meta (`og:image`) → emblem, for link previews.
   - `OrderSuccess.tsx` — small logo in the success header (optional).
   - The **new dashboard** header (Part 2).
3. Keep the existing teal `brand-*` tokens — the logo already matches them; do not introduce
   new colors.

**Verify:** `npm run typecheck && npm run build`; eyeball header/footer in light + dark.

---

## Part 2 — Delete the current dashboard, build a new one

**Why rebuild.** `frontend/src/pages/AdminDashboard.tsx` is a single ~1500-line file holding
orders, products, customers, settings and stats together. It's hard to extend and mixes
concerns. More importantly, **every admin API endpoint is `permission_classes = (AllowAny,)`** —
orders, products, customers, store settings (including secret tokens) are all open to anyone
who knows the URL. The rebuild is the moment to fix that.

### 2a. Backend hardening (must ship with the rebuild)
- Flip all `Admin*` views from `AllowAny` to real auth (`IsAuthenticated` + an admin check),
  using the existing `accounts` app + `AdminLogin`. Endpoints affected: admin orders (list,
  status, note, seen, seen-all, new-count), admin products, admin customers, and **store
  settings** (currently the biggest hole — anyone can read/patch bank + Telegram config).
- Keep the storefront-facing reads that must stay public (public product catalog, checkout,
  order lookup) public; lock only the `admin/*` surface.
- The public `store/settings/` GET should expose only what the storefront needs (store WhatsApp
  for the support link) — not bank/gateway fields. The token fields are already write-only.

### 2b. Frontend architecture
Replace the mega-file with a routed dashboard:
- `DashboardLayout` — sidebar + header (logo, new-order badge, dark toggle, logout), nested
  routes.
- One route/component per section: **Orders**, **Products**, **Categories**, **Customers**,
  **Settings**, **Analytics**.
- Shared primitives: `DataTable`, `StatusBadge`, `Modal`, `ConfirmDialog`, `FormField`,
  `StatCard` — so sections stay small and consistent.
- Data layer: a react-query hook per resource (`useAdminOrders`, `useAdminProducts`, …) instead
  of inline queries.

### 2c. What each section must do (the system's needs)
- **Orders** (the core): list with status tabs + **NEW/unseen** filter, search, live refresh
  (`refetchInterval` on orders + `new-count`), row detail, status transitions
  (approve/reject/complete), admin notes, the **Telegram/WhatsApp send log** per order
  (sent/failed), and **download the invoice PDF**. The new-order separation (built today) is the
  backbone here — surface the unseen badge, count, mark-seen, mark-all-seen, and optionally a
  soft notification sound on new arrivals.
- **Products** — CRUD, main + gallery images, price/old price, stock, flags (active/new/hot).
- **Categories** — CRUD.
- **Customers (CRM)** — list + per-customer order history (already joined by FK).
- **Settings** — store info, **Telegram** (enable, token [write-only], chat ids, `telegram_get_chat_id`
  helper note), **bank details**, shipping. Keep the "leave blank = keep secret" handling.
- **Analytics** — revenue, orders over time, top cities/products (backend `analytics` endpoint
  exists; wire charts).
- **Auth** — real admin login gate on every dashboard route (ties to 2a).

### 2d. New feature worth adding now: invoice PDF endpoint
Expose `GET /api/v1/admin/orders/<number>/invoice.pdf` (admin-only) reusing
`apps/orders/invoice.build_invoice_pdf`, so the dashboard can show/download the same PDF the
manager gets on Telegram.

### 2e. Migration approach (safe, incremental)
1. Build the new dashboard under a new route (e.g. `/dashboard`) alongside the old one, section
   by section, verifying each against the live API.
2. Add the backend auth gate behind the same change so the new dashboard authenticates properly.
3. When all sections reach parity + the new features, **delete `AdminDashboard.tsx`** and its
   old sub-components, and point the route at the new layout.
4. Keep `npm run typecheck && npm run build` and `pytest` green at every step.

### Risks
- Auth wiring is the delicate part — do it behind the login that already exists, and test the
  full login→dashboard→action path before deleting the old UI.
- Don't regress the storefront (public catalog, checkout, order lookup, order-success) while
  locking down `admin/*`.
- The settings-secret exposure is a real, current vulnerability — treat 2a as the priority, not
  a nice-to-have.

---

## Suggested order
1. **Part 1** (logo) — small, visible, independent.
2. **Part 2a** (lock down admin endpoints) — security first.
3. **Part 2b–2d** (new dashboard, section by section, + invoice endpoint).
4. **Part 2e** (delete old dashboard, swap route).
