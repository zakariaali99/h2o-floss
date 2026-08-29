# H2O Floss — store

Arabic RTL storefront for the H2O Floss water flosser and its parts, with a Django JSON API behind it.

| Folder | What it is |
|---|---|
| [`backend/`](backend/README.md) | Django 5.2 + DRF: catalog, cart, COD orders, Django admin back office |
| [`frontend/`](frontend/README.md) | React 19 + Vite + TypeScript + Tailwind 4 storefront (Arabic RTL) |
| [`plans/`](plans/H2o-floss-plan.md) | The phased build plan (P0–P8) this code follows |

## Quick start

```bash
# 1. backend  (Python 3.12 venv — the system python3 here is 3.9)
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver 8017        # :8000 is taken by another project on this machine

# 2. frontend (separate terminal)
cd frontend
npm install
VITE_BACKEND_ORIGIN=http://127.0.0.1:8017 npm run dev     # → http://127.0.0.1:5173
```

The Vite dev server proxies `/api`, `/media`, `/static` and `/admin` to Django, so the browser sees one
origin: no CORS setup and the session cart cookie works unchanged.

## Checks

```bash
cd backend  && .venv/bin/python manage.py check && .venv/bin/python -m pytest
cd frontend && npm run build
```

## Build status

| Phase | State |
|---|---|
| **P0 · Scaffold** | ✅ done — settings split, custom user, core constants/validators/health API, admin, Vite+React+TS+Tailwind shell, proxy verified end to end |
| P1 · Catalog data layer | ⏳ next |
| P2–P8 | not started |
