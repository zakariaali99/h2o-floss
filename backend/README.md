# H2O Floss backend

Django 5.2 + Django REST Framework. Serves JSON under `/api/v1/` and the staff back office under `/admin/`.

## Layout

```
config/settings/{base,dev,test,prod}.py   split settings, all knobs from env (django-environ)
config/urls.py                            /admin/ + /api/v1/ + /media/
apps/core/        constants (Libyan cities, order state machine), validators, TimeStampedModel,
                  health + store-config endpoints, shared API error envelope
apps/accounts/    custom User (email login, derived unique username, role as label only)
apps/catalog/     Category, Product (DEVICE/PART/ACCESSORY/KIT), images, compatibility   → P1
apps/cart/        session/token cart                                                     → P3
apps/orders/      Order, OrderItem, Client capture, status transitions                   → P3–P4
tests/            pytest-django suite (guardrails against the reference app's defects)
```

## Conventions

- **One permission system**: `is_staff` + Django groups/permissions. `User.role` is a display label and
  must never gate access (enforced by `tests/test_accounts.py::test_role_is_a_label_not_a_gate`).
- **No state-changing GETs.** Every mutation is POST/PATCH/DELETE.
- Every API failure is `{"error", "detail", "fields"}` — see `apps/core/exceptions.py`.
- Order status transitions go through `Order.transition_to()` using
  `core.constants.ORDER_STATUS_TRANSITIONS`; `COMPLETED` is reachable (the reference never set it).

## Commands

```bash
python manage.py migrate
python manage.py createsuperuser --email admin@h2ofloss.ly
python manage.py check --fail-level W
python manage.py makemigrations --check --dry-run   # CI drift gate
python -m pytest                                     # config.settings.test
```

## Environment

Copy `.env.example` → `.env`. Everything has a dev default, so the project runs with no `.env` at all.
`prod.py` deliberately has **no** `SECRET_KEY` default: it fails fast when the env var is missing.
