# H2o-floss — Build Plan

**Date:** 2026-08-29 · **Status:** ALL PHASES COMPLETE (P0–P8) — Production Ready · **Author:** DeepSeek Harness
**Sourced from:** full read of `reference/docStore` (Django monolith), `reference/h2ofloss.html` (marketing page), `reference/*.mp4` (product video), `reference/docStore/media/products/*` (real product photos)

---

## 1. Goal

Rebuild the H2Ofloss store as a clean two-tier app:

- **`H2o-floss/backend/`** — Django 5.2 + DRF: catalog of **one hero device and its parts/accessories**, session cart, guest cash-on-delivery checkout, order lifecycle, Django admin back office, seed data, tests.
- **`H2o-floss/frontend/`** — React 19 + Vite 7 + TypeScript + Tailwind 4: Arabic RTL storefront (landing, product page with parts cross-sell, cart, checkout, order tracking).

Nothing from `reference/` is modified or imported at runtime — it is used only as the source of domain knowledge, copy, specs, and media assets. Every defect found in the reference is turned into an explicit guardrail (§9).

## 2. Confirmed decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Layout | `H2o-floss/backend/` + `H2o-floss/frontend/` inside this workspace; `reference/` untouched |
| 2 | Back office | **Django admin** re-enabled (order approve/reject/complete, product & part CRUD, groups/permissions, `django-simple-history` audit) |
| 3 | Storefront language | **Arabic RTL only**, Cairo font, no Bootstrap |
| 4 | v1 scope | **Lean store**: catalog + parts, gallery, cart, guest COD checkout, order status lookup, contact capture, seeded data, tests |

**Assumptions I made (flag anything you disagree with):**

- A5. **No online payment.** Same commercial model as the reference: order arrives `PENDING`, staff confirms by phone/WhatsApp. The cart page states it plainly.
- A6. **No customer accounts in v1.** Guests order freely; "my orders" = tracking by order number + phone. JWT exists only for staff/API clients.
- A7. **Currency is Libyan Dinar (د.ل)**, integer display, prices seeded from the reference (device 225, nozzle kit 14.99→ re-priced, see §7).
- A8. **SQLite for dev**, Postgres-ready via `dj-database-url`/`DATABASE_URL`; media on local disk behind `/media/`.
- A9. **Python 3.12 venv** (system `python3` is 3.9 and its global site-packages is a shared mess — Django 4.0.4, 40+ unrelated packages). Node 26 + npm 11 are available; PyPI and npm registry both reachable.

## 3. Repository layout

```
H2o-floss/
├── plans/                      # this plan + future ADRs
├── backend/
│   ├── config/                 # settings/{base,dev,prod}.py, urls.py, wsgi.py, asgi.py
│   ├── apps/
│   │   ├── core/               # health, constants (Libyan cities), validators, TimeStampedModel
│   │   ├── catalog/            # Category, Product, ProductImage, Compatibility, specs
│   │   ├── cart/               # Cart, CartItem (token-bound, anonymous-safe)
│   │   ├── orders/             # Order, OrderItem, status machine, Client capture
│   │   └── accounts/           # custom User (email login, role), JWT glue
│   ├── templates/admin/        # light admin branding overrides only
│   ├── static/  media/
│   ├── tests/                  # pytest-django: factories, API tests, checkout tests
│   ├── manage.py  requirements.txt  requirements-dev.txt  .env.example  pytest.ini
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── app/                # router, providers, layout
│   │   ├── pages/              # Home, Product, Parts, Category, Cart, Checkout, OrderSuccess, TrackOrder, About, Contact
│   │   ├── components/         # ui/ + catalog/ + cart/ + checkout/ + layout/
│   │   ├── api/                # typed fetch client, endpoints, generated types
│   │   ├── features/cart/      # store + hooks
│   │   ├── lib/                # format (LYD, dates), validation (LY phone), i18n strings
│   │   └── styles/             # tailwind entry + design tokens
│   ├── index.html  vite.config.ts  tsconfig.json  tailwind.config.ts  package.json
│   └── README.md
├── .gitignore  .editorconfig  README.md
```

Dev wiring: Vite proxies `/api` and `/media` → `http://127.0.0.1:8000`, so the browser sees one origin — **no CORS in development**, session cookie works for the cart. `django-cors-headers` stays configured for the production split-origin case.

## 4. Domain model — one product, and its parts

The store's shape is "one device + everything that attaches to it". That drives the model:

```
Category        name, slug, image, order, is_parts_group
Product         kind: DEVICE | PART | ACCESSORY | KIT      ← exactly one DEVICE row is the hero
                hero (bool, unique-partial-constraint), name, slug, tagline, description (sanitized HTML)
                price, old_price, currency='LYD'
                stock_quantity (nullable = "available on request"), in_stock (derived)
                specifications JSONField  # {"الخزان":"300 مل","الأوضاع":"5","مقاومة الماء":"IPX7","البطارية":"2500 mAh","الضغط":"140 PSI","النبضات":"1300/دقيقة"}
                main_image, order, is_active, is_featured, badge ('جديد'|'الأكثر مبيعاً'|null)
                warranty_months, fits_note
ProductImage    product FK, image, order, is_feature
Compatibility   part FK → Product, device FK → Product (M2M "يناسب")
Order           number (H2O-2026-000123), status, contact fields, city (validated choices),
                address, note, subtotal, shipping, total, created/updated, history
OrderItem       order, product, product_name (frozen), unit_price (frozen), quantity, line_total
Client          email unique, name, phone, city, orders reverse relation   # contact capture
Cart / CartItem token (uuid, indexed), user nullable, session_key nullable, items with qty
```

**Parts catalogue seeded** (from the reference specs + `h2ofloss.html` "محتويات العلبة" and its 6-nozzle claim):

| Part | Category | Notes |
|---|---|---|
| طقم رؤوس بديلة (6 قطع) | رؤوس بديلة | classic jet, orthodontic, periodontal, tongue cleaner, toothbrush tip, mini |
| خزان مياه احتياطي 300 مل | قطع غيار | |
| كابل شحن USB | الشحن | |
| قاعدة/حامل مغناطيسي | التثبيت | |
| حقيبة سفر مبطنة | التنقل | |
| بطارية 2500 mAh | قطع غيار | |
| طقم العائلة (Kit) | أطقم | device + 6 nozzles + case, discounted — proves `KIND=KIT` composition |

Storefront consequence: the device page has a **"أجزاء وملحقات الجهاز"** section fed by `Compatibility`, and each part page shows **"يعمل مع: H2O Floss"** — the single-product story without a fake multi-brand catalog.

## 5. API contract (`/api/v1/`)

| Method & path | Auth | Purpose |
|---|---|---|
| `GET catalog/categories/` | anon | nav + parts grouping |
| `GET catalog/products/?kind=&category=&featured=` | anon | listing, active only |
| `GET catalog/products/{slug}/` | anon | detail incl. `specifications`, `images`, `related_parts[]` |
| `GET catalog/products/{slug}/parts/` | anon | parts for a device |
| `POST catalog/products/{slug}/view/` | anon | **POST** (not GET) view beacon, `update_fields=['views_count']`, throttled |
| `GET cart/` | anon/session | `{items[], subtotal, total, count}` |
| `POST cart/items/` | anon | `{product, quantity}` → 201 + cart |
| `PATCH cart/items/{id}/` | anon | quantity (validated 1–10, ≤ stock) |
| `DELETE cart/items/{id}/` | anon | remove line |
| `POST checkout/` | anon | contact + city + address → creates order atomically, freezes prices/names, clears cart, returns `{number, status, total}` |
| `GET orders/lookup/?number=&phone=` | anon | status timeline (404-safe, no enumeration: requires both fields) |
| `POST contact/` | anon | message → `ContactMessage` row, throttled |
| `POST auth/token/`, `auth/token/refresh/`, `GET auth/me/` | staff | JWT for admin/API clients |
| `/admin/` | staff | back office |

Rules baked in: **all mutations are POST/PATCH/DELETE** (never GET), DRF permissions default to read-only for anon, `IsAdminUser` for anything that writes catalog/orders, throttling on checkout/contact/view, serializer-level validation of Libyan phone (`^09\d{8}$` normalised) and city against `core/constants.py` (deduped — the reference had `Gharyan` *and* `Garyan`).

Order state machine, all transitions reachable from admin:
`PENDING → APPROVED → COMPLETED`, `PENDING|APPROVED → REJECTED`, `REJECTED → PENDING` (reopen). Invalid transitions rejected in `Order.transition_to()`, logged by `django-simple-history`.

## 6. Frontend architecture

- **Stack:** Vite 7, React 19, TypeScript strict, react-router 7 (data router + loaders), TanStack Query 5 (server cache, optimistic cart mutations), Zustand (cart/UI state), Tailwind CSS 4, lucide-react, `@fontsource/cairo` (self-hosted, no CDN), react-hook-form + zod for checkout.
- **RTL:** `<html lang="ar" dir="rtl">`, Tailwind logical utilities (`ms-`, `me-`, `ps-`, `text-start`), no `float:left` hacks; LTR isolation only for phone numbers and `wa.me` links (the reference got this right).
- **Routes:**

| Path | Page | Key content |
|---|---|---|
| `/` | Landing | hero + trust badges (ضمان سنتين / توصيل مجاني / 4.9 من 5), features grid (5 أوضاع، IPX7، كرة الجاذبية 360°), **product video**, stats, parts teaser, testimonials, CTA |
| `/product/:slug` | Device | gallery (zoom + modal + thumbs), price/old price, specs table, qty, sticky add-to-cart bar, **parts cross-sell**, full description, shipping/warranty accordion |
| `/parts` | Parts & accessories | grouped by category, filter chips, each card → `/product/:slug` |
| `/category/:slug` | Listing | paginated cards |
| `/cart` | Cart | lines, qty steppers, subtotal/shipping/total, "الدفع عند الاستلام / المراجعة" notice |
| `/checkout` | Checkout | name, phone, email, city select, address, note → `POST checkout/` |
| `/order/:number` | Success + status | number, timeline, WhatsApp handoff link |
| `/track` | Lookup | number + phone |
| `/about`, `/contact` | Static + form | |
| `*` | 404 | |

- **Design tokens** lifted from `h2ofloss.html`: primary `cyan-800`/`#0c4a6e`, accent `sky-100`/`cyan-500`, `rounded-3xl`, soft layered shadows, Cairo. Dark-mode toggle kept (reference had one) but as a `class` strategy on `<html>` with `localStorage`.
- **No Bootstrap, no Tailwind CDN, no Babel-in-browser, no unused React UMD tags** — the reference loaded all four on every page and used none of them.

## 7. Content & assets carried over

- Copy: Arabic headlines, feature bullets, "محتويات العلبة", testimonials from `reference/h2ofloss.html` and `templates/home.html` / `about.html` / `contact.html`.
- Specs: 300 مل / 5 أوضاع / IPX7 / 2500 mAh / 140 PSI / 1300 نبضة / 6 رؤوس / ضمان سنتين.
- Media: the 4 real product photos in `reference/docStore/media/products/` are **copied** into `backend/media/products/` by the seed command (never moved); the 53 s 1080p MP4 is referenced from `frontend/public/video/` (copied) with a poster frame.
- Pricing: device **225 د.ل** (DB value, not the landing page's 195 — flagged in §14), nozzle kit 45 د.ل, cable 15 د.ل, tank 35 د.ل, case 40 د.ل, battery 55 د.ل, family kit 289 د.ل. All editable in admin; seed is idempotent.

## 8. Back office (Django admin)

- `OrderAdmin`: list filters (status, city, date), search (number/name/phone/email), read-only money fields, **actions** `mark_approved / mark_completed / mark_rejected`, detail inline of items, no raw `total_amount` editing (computed).
- `ProductAdmin`: prepopulated slug, image widget, inline `ProductImage` formset (ordered), filter by `kind`/`is_active`, `Compatibility` M2M widget, `django-filter` for category/kind.
- `ClientAdmin`, `ContactMessageAdmin`, `LogEntry`-plus-`simple-history` pages.
- Access: `role` on `User` (`ADMIN`/`STAFF`) + Django groups/permissions — one mechanism, not two (the reference had flags honoured by the API and ignored by its dashboard).
- Admin branded (`templates/admin/base_site.html`), Arabic `LANGUAGE_CODE='ar'`, `TIME_ZONE='Africa/Tripoli'`.

## 9. Anti-regression guardrails (reference defect → our rule)

| Reference defect | Rule in the new build |
|---|---|
| `/dashboard/*` 500 for anon (`admin:login` NoReverseMatch) | Admin URLs registered; API-only backend, no hand-rolled staff views |
| `/about/` duplicate `{% extends %}` | Content lives in React; templates limited to admin |
| Analytics 500 (`floatform`, `KeyError monthly_stats`) | Analytics deferred (§13); any aggregate returns a typed schema with defaults |
| `crispy_forms` / `messages` NameError | No template-form libraries; admin only; lint + `manage.py check --fail-level W` in CI |
| Cart at `/cart/cart/` | Explicit route table, one prefix per app |
| `order.user.email` blank for guests | Guest order success renders `order.email` |
| State-changing GETs | POST/PATCH/DELETE only; enforced in API tests |
| `views_count` lost update | `F()` expression + `update_fields`, throttled beacon |
| `COMPLETED` unreachable | Full transition matrix in admin + unit test |
| Duplicate city choices | Single deduped tuple, validated in serializer + test |
| `LIBYAN_CITIES` imported inside model class | Constants module imported at top of file |
| Two disagreeing permission systems | One: Django permissions/groups |
| Audit log never written | `django-simple-history` on Product/Order, middleware-free |
| `description \| safe` stored XSS | `BLEACH`-sanitized on save; render sanitized |
| No stock model | `stock_quantity` nullable + `in_stock`, checkout validates under `select_for_update` |
| Zero tests | pytest suite (§11) as a merge gate |
| No requirements pinning | `requirements.txt` pinned + `.env.example` |

## 10. Phases

Nine phases, each with a hard **exit gate** — a phase is not done until its gate passes, and each is a
natural stop-and-review point. P0–P4 backend, P5–P8 frontend/polish.

| Phase | Scope | Exit gate |
|---|---|---|
| ✅ **P0 · Scaffold** *(done 2026-08-29)* | Repo layout, py3.12 venv, pinned requirements, `config/settings/{base,dev,prod}`, `.env.example`, root README/.gitignore/.editorconfig, Django project + 5 app skeletons + custom `User`, `core` constants + health endpoint, Vite+React+TS+Tailwind app with `/api` + `/media` proxy | `manage.py check` clean · `makemigrations --check --dry-run` clean · `npm run build` succeeds · `/api/v1/health/` returns JSON |
| ✅ **P1 · Catalog data layer** *(done 2026-08-29)* | `Category`, `Product` (DEVICE/PART/ACCESSORY/KIT + `hero`), `ProductImage`, `Compatibility` (realized as self-M2M `devices` / `kit_contents` on Product), `TimeStampedModel`, migrations, admin, `seed_store` copying reference media | `migrate` + `seed_store` run twice = idempotent · 1 DEVICE + ≥6 PARTs + 1 KIT present · visible in admin |
| ✅ **P2 · Read APIs** *(done 2026-08-29)* | `/api/v1/catalog/*` (categories, products, detail with `related_parts`, parts-by-device), anon read-only, throttled **POST** view beacon | curl matrix 200/403/404/405 correct · anon write rejected · pytest green |
| ✅ **P3 · Cart + checkout** *(done 2026-08-29)* | `Cart`/`CartItem` (token + session), cart CRUD, `checkout/` atomic under `select_for_update` with stock validation, frozen line prices, order number, `Client` capture, `orders/lookup/`, `contact/` | pytest: happy path, out-of-stock, invalid phone/city, empty cart, double-submit, guest success renders `order.email` |
| ✅ **P4 · Order lifecycle** *(done 2026-08-29)* | `Order.transition_to()` state machine (`PENDING→APPROVED→COMPLETED`, rejects, reopen), admin actions, `django-simple-history`, bleach-sanitized descriptions | invalid transition rejected · history rows written · approve→complete verified |
| ✅ **P5 · Frontend shell** *(done 2026-08-29)* | Design tokens (cyan/sky, self-hosted Cairo, `rounded-3xl`), RTL layout, router + providers, typed API client, landing page (hero, trust badges, features, video, testimonials, CTA), dark mode | `npm run build` clean · no console errors · RTL verified |
| ✅ **P6 · Product + parts pages** *(done 2026-08-29)* | Gallery (zoom/modal/thumbs), specs table, sticky add bar, **parts cross-sell from `Compatibility`**, `/parts`, `/category/:slug`, empty states | device page shows its real parts · part page shows "يعمل مع" |
| ✅ **P7 · Purchase flow UI** *(done 2026-08-29)* | Cart, checkout (react-hook-form + zod, Libyan phone/city), success + tracking, contact, 404, toasts | scripted run: browse → add device + 2 parts → checkout → track |
| ✅ **P8 · Hardening + docs** *(done 2026-08-29)* | a11y pass, loading/error states, coverage gate, ruff + ESLint clean, README run-book verified from a fresh clone, `plans/DECISIONS.md` | fresh-clone run from README works first try · `pytest` + `npm run test` + `npm run lint` green |

### 10.1 Defaults applied for §14 (no answer received — override any of these)

| # | Question | Default taken |
|---|---|---|
| 1 | Device price | **225 د.ل** — the price the reference DB actually sold at (195 was the marketing page) |
| 2 | Video | **CDN URL via `VITE_PRODUCT_VIDEO_URL`**, documented local swap into `frontend/public/video/` — keeps 47 MB out of the repo |
| 3 | WhatsApp handoff | **Yes**, number from `VITE_WHATSAPP_NUMBER`; unset → button hidden |
| 4 | Shipping | **Free** (matches "توصيل مجاني لجميع أنحاء ليبيا"), stored as a `shipping` field defaulting to 0 so per-city fees become config, not a migration |
| 5 | Git | **No `git init`** — your home directory is already a git repo; `.gitignore` provided, nesting the repo is your call |

## 11. Testing & verification

- **Backend:** pytest + pytest-django + DRF `APIClient`; factories in `tests/factories.py`. Coverage target: models (state machine, totals, slugs), checkout (atomicity, stock, price freeze), permissions (anon read / staff write), serializers (phone/city validation). `pytest.ini` configured; `manage.py check --fail-level W` and `makemigrations --check --dry-run` as gates.
- **Frontend:** `tsc --noEmit`, ESLint, Vitest + Testing Library for cart store, price formatting, phone validation, and one render smoke per page.
- **End-to-end (manual, scripted in README):** seed → `GET /api/v1/catalog/products/` → add to cart → checkout → track → approve in admin. Plus a Playwright pass deferred to §13.

## 12. Run book (target state)

```bash
# backend
cd H2o-floss/backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
python manage.py migrate && python manage.py seed_store && python manage.py createsuperuser
python manage.py runserver 8000

# frontend
cd H2o-floss/frontend && npm install && npm run dev     # → http://127.0.0.1:5173, proxies /api + /media
```

## 13. Out of scope for v1 (parked, cheap to add later)

Online payment (ePayLib/Moyasar), customer accounts + order history, React admin panel, analytics dashboard (revenue by city / monthly MRR — the pandas idea, reimplemented in ORM), email/SMS notifications, search + facets, multi-language EN, Playwright E2E, Docker/CI, image thumbnails pipeline, reviews/UGC.

## 14. Open questions for your review

1. **Price of the device:** seed at **225 د.ل** (what the reference DB actually sold) or **195 د.ل** (what the marketing page advertised)?
2. **Video hosting:** copy the 47 MB MP4 into `frontend/public/video/` (self-contained, heavier repo) or reference the original `h2ofloss.com` CDN URL (light, external dependency)?
3. **WhatsApp handoff:** after order success, deep-link to `wa.me/218…` with the order number prefilled (the reference had a `wa.me` template tag but no storefront button)? If yes, which number?
4. **Shipping:** flat free shipping (reference advertised "توصيل مجاني لجميع أنحاء ليبيا") or per-city fee in the admin?
5. **Repo:** should I `git init` inside `H2o-floss/` and commit per milestone? (Your home directory is currently a git repo, so an explicit nested repo keeps this project isolated.)

---

**Defaults for §14 recorded in §10.1. Reply "next phase" and I'll begin at P0.**
