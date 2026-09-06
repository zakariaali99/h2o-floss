# H2O Floss Storefront — E-Commerce Platform

A modern, high-converting e-commerce web application for **H2O Floss** water flossers, spare parts, and accessories in Libya. Built with **Django REST Framework** (Python 3.12) on the backend and **Vite + React + TypeScript + Tailwind CSS v4** on the frontend.

---

## 🌟 Key Features

- **High-Converting Arabic RTL Design**: Complete Arabic localization, Cairo typography, responsive mobile drawers, and smooth dark/light mode toggle.
- **Product & Parts Catalog**: Real device photography, 6 interactive feature cards, HTML5 video showcase, interactive FAQ accordion, and specs tables.
- **Dynamic Cross-Sell & Compatibility**: Automatic pairing of devices with replacement tips, spare tanks, USB cables, and travel cases.
- **Libyan Cash-on-Delivery (COD) Checkout**: Form validation for Libyan phone numbers (`09XXXXXXXX`), 14 Libyan cities, and cash payment on delivery.
- **WhatsApp Order Handoff**: One-click WhatsApp confirmation link (`wa.me/218...`) pre-filling order numbers and items.
- **Order State Machine & Tracking**: Real-time order status tracking page (`/track`) and backend transition enforcement (`PENDING -> APPROVED -> COMPLETED`).

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python**: 3.12 or higher
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher

---

### 1. Backend Setup (Django DRF)

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Seed initial store catalog data (idempotent seed command)
python manage.py seed_store

# Start Django development server on port 8017
python manage.py runserver 8017
```

- **Backend API Base**: `http://127.0.0.1:8017/api/v1/`
- **Django Admin**: `http://127.0.0.1:8017/admin/`

---

### 2. Frontend Setup (Vite + React + TS)

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server with proxy to backend port 8017
npm run dev
```

- **Storefront App**: `http://localhost:5173/`

---

## 🧪 Testing & Verification

### Run Backend Pytest Suite
```bash
cd backend
.venv/bin/pytest tests
```

### Run Frontend Typecheck & Production Build
```bash
cd frontend
npm run typecheck
npm run build
```

---

## 📁 Repository Structure

```
H2o-floss/
├── backend/                  # Django REST Framework backend project
│   ├── apps/
│   │   ├── accounts/         # Custom User & Admin Auth
│   │   ├── cart/             # Session/Token Cart API
│   │   ├── catalog/          # Product, Category & Compatibility models
│   │   ├── core/             # Constants, Validators & Health checks
│   │   └── orders/           # Checkout, Order Lifecycle & WhatsApp
│   ├── config/               # Settings (base, dev, prod) & URL router
│   ├── media/                # Seeded product images & media uploads
│   └── tests/                # Pytest test suite (86/86 passing)
├── frontend/                 # Vite + React + TS + Tailwind v4 storefront
│   ├── public/               # Static product photos & video assets
│   ├── src/
│   │   ├── api/              # Typed API clients & DRF serializers mapping
│   │   ├── app/              # Router & App Root Layout
│   │   ├── components/       # Layout, Header, Footer & Skeletons
│   │   ├── features/         # Zustand Cart state store
│   │   ├── pages/            # Home, ProductDetail, Parts, Cart, Checkout, OrderSuccess, TrackOrder, Contact
│   │   └── styles/           # Tailwind v4 theme tokens & Cairo fonts
└── plans/                    # Master build plan & ADR decisions log
```

---

## 📄 License
All rights reserved © 2026 H2O Floss Libya.
