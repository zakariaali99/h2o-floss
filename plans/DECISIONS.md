# Architectural Decision Record (ADR) — H2O Floss Storefront

This document records the architectural, technical, and domain decisions made during the build of the H2O Floss Storefront application.

---

## 1. Decoupled Architecture (Django DRF + Vite React TS)

- **Decision**: Build the application using Django 5.x + Django REST Framework on the backend and Vite 8 + React 19 + TypeScript + Tailwind CSS v4 on the frontend.
- **Rationale**: Clean separation of data management (order processing, catalog seeding, admin controls) from customer-facing e-commerce UI. Allows high-performance client-side rendering while preserving Django's robust security, admin interface, and ORM.

---

## 2. Cash-on-Delivery (COD) & Libyan Localization

- **Decision**: Standardize on **Cash on Delivery (الدفع عند الاستلام)** as the single payment method, with mandatory Libyan phone number validation (`09XXXXXXXX`) and official Libyan city code selection (`TRIPOLI`, `BENGHAZI`, `MISRATA`, etc.).
- **Rationale**: Reflects local commercial expectations in Libya where credit card penetration is minimal and customers expect to inspect hardware before making cash payment to the delivery driver.
- **Implementation**:
  - Backend: `validate_libyan_phone()` normalizes numbers to `09XXXXXXXX` and `validate_city()` enforces valid city codes.
  - Frontend: `react-hook-form` + `zod` regex validation with isolated RTL/LTR number formatting (`.ltr-nums`).
  - Handoff: Post-checkout WhatsApp deep-link (`https://wa.me/218...`) pre-filling order details.

---

## 3. Self-Hosted Cairo Typography & Tailwind CSS v4 Dark Mode

- **Decision**:
  - Package `@fontsource/cairo` directly within npm dependencies (weights 400, 600, 700, 800) instead of linking to external Google Fonts CDNs.
  - Fix Tailwind CSS v4 dark mode class targeting using `@custom-variant dark (&:where(.dark, .dark *));` in `src/styles/index.css`.
- **Rationale**:
  - Self-hosting fonts guarantees offline capability, fast page loads, zero third-party tracking, and immediate rendering without FOIT/FOUT.
  - Tailwind v4 defaults `dark:` to `@media (prefers-color-scheme: dark)`. Adding `@custom-variant dark` allows the `ThemeToggle` component to switch `<html class="dark">` dynamically on click.

---

## 4. Product Compatibility Model (Self-M2M Relationship)

- **Decision**: Implement part-to-device and device-to-part compatibility using self-referential Many-to-Many relationships on the `Product` model (`devices` and `kit_contents`).
- **Rationale**: Eliminates the need for redundant junction tables. A single `Product` model represents Devices, Parts, Accessories, and Kits (`kind` enum).
- **APIs**:
  - `ProductDetailSerializer` exposes `related_parts` for `DEVICE` products.
  - `ProductDetailSerializer` exposes `compatible_devices` for `PART` products.

---

## 5. State Machine Order Transitions & Audit History

- **Decision**:
  - Implement explicit state transition logic on `Order.transition_to(target_status)`.
  - Use `django-simple-history` to track model modifications over time.
- **Rationale**: Prevents illegal order state jumps (e.g., from `CANCELLED` directly to `COMPLETED`). Guarantees an immutable audit trail for administrative management.
