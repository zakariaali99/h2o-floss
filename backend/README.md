# H2O Floss backend

Django 5.2 + Django REST Framework. Serves JSON under `/api/v1/` and the staff back office under `/admin/`.

## Layout

```
config/settings/{base,dev,test,prod}.py   split settings, all knobs from env (django-environ)
config/urls.py                            /admin/ + /api/v1/ + /media/
apps/core/        constants (Libyan cities, order state machine), validators, TimeStampedModel,
                  health + store-config endpoints, shared API error envelope
apps/accounts/    custom User (email login, derived unique username, role as label only)
apps/catalog/     Category, Product (DEVICE/PART/ACCESSORY/KIT + hero constraints), ProductImage,
                  kit_contents / devices M2Ms, bleach-sanitized descriptions, seed_store command,
                  public read API under /api/v1/catalog/ (P2)
apps/cart/        token/session Cart + CartItem (qty ≤ 10, one line per product)
apps/orders/      Order (frozen prices, H2O-YYYY-NNNNNN, simple-history), OrderItem,
                  Client CRM capture (real FK, not email joins), ContactMessage,
                  checkout / orders-lookup / contact endpoints (P3)
tests/            pytest-django suite (guardrails against the reference app's defects)
```

## Conventions

- **One permission system**: `is_staff` + Django groups/permissions. `User.role` is a display label and
  must never gate access (enforced by `tests/test_accounts.py::test_role_is_a_label_not_a_gate`).
- **No state-changing GETs.** Every mutation is POST/PATCH/DELETE.
- Every API failure is `{"error", "detail", "fields"}` — see `apps/core/exceptions.py`.
- Order status transitions go through `Order.transition_to()` using
  `core.constants.ORDER_STATUS_TRANSITIONS`; `COMPLETED` is reachable (the reference never set it). In admin the status is read-only — staff move orders
  with the changelist actions (approve / complete / reject / reopen); approving
  reserves stock, rejecting an approval releases it, and the reservation is
  all-or-nothing across every line.

## Public API (P2)

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/catalog/categories/` | nav + parts grouping, live product counts |
| `GET /api/v1/catalog/products/?kind=&category=&featured=` | paginated listing, active only |
| `GET /api/v1/catalog/products/{slug}/` | detail: specs, gallery, cross-sell rails |
| `GET /api/v1/catalog/products/{slug}/parts/` | parts for a device / contents of a kit |
| `POST /api/v1/catalog/products/{slug}/view/` | view beacon — `F()` bump, throttled 300/min |
| `GET /api/v1/cart/` · `POST /api/v1/cart/items/` · `PATCH|DELETE /api/v1/cart/items/{id}/` | session/token cart; every mutation returns the full cart |
| `POST /api/v1/checkout/` | cart → PENDING order, atomically; stock re-checked under row locks |
| `GET /api/v1/orders/lookup/?number=&phone=` | 404-safe status lookup; requires both fields |
| `POST /api/v1/contact/` | contact message capture, throttled 5/min |

All catalog reads are anonymous and 405 every write; inactive products are
invisible to the API (staff manage them in `/admin/`). Cart/checkout are
anonymous too — a cart is addressed by `X-Cart-Token`, session cookie, or user;
an order freezes names, unit prices and totals at checkout.

## Commands

```bash
python manage.py migrate
python manage.py seed_store     # idempotent: 1 device + 6 parts + 1 kit, copies reference media
python manage.py createsuperuser --email admin@h2ofloss.ly
python manage.py check --fail-level WARNING
python manage.py makemigrations --check --dry-run   # CI drift gate
python -m pytest                                     # config.settings.test
```

## Environment

Copy `.env.example` → `.env`. Everything has a dev default, so the project runs with no `.env` at all.
`prod.py` deliberately has **no** `SECRET_KEY` default: it fails fast when the env var is missing.
