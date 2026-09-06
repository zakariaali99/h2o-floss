# Plan — Remove customer invoice/bank screen + Manager-only WhatsApp bot

Date: 2026-09-02
Scope: `H2o-floss/` (the live system). Two independent deliverables.

---

## Current reality (verified by reading the code)

- The "WhatsApp bot" already exists but **sends nothing**. `deliver_message_payload`
  (`backend/apps/orders/whatsapp.py:113`) either POSTs to an external `whatsapp_gateway_url`
  or, by default, returns a **fake `SENT`** status and writes a log row — no message ever
  reaches a phone.
- On checkout, `send_automatic_order_notifications` (whatsapp.py:163) dispatches to
  **customer + store + managers**.
- The screen in the screenshot is `frontend/src/pages/OrderSuccess.tsx` — specifically
  card #2 (green "sent automatically via WhatsApp") and card #3 (bank/IBAN details).
  Both display a success that never happened.
- Store/bank/manager config lives in `StoreSettings` (`backend/apps/core/models.py:17`),
  editable via `/api/.../store/settings/` and the admin dashboard.

---

## Part A — Remove the invoice/bank screen (frontend only)

**File:** `frontend/src/pages/OrderSuccess.tsx`

1. Delete **card #2** — "AUTOMATIC WHATSAPP DISPATCH STATUS CARD" (lines ~148-193). This is
   the misleading green banner from the screenshot.
2. Delete **card #3** — "BANK TRANSFER INFORMATION CARD" (lines ~195-248).
3. Card #4 (direct-chat button) — **simplify**: keep a plain "contact support" WhatsApp link
   to the store, but strip the pre-filled invoice + bank-details text dump. (Or remove it
   entirely — your call; default = keep simplified.)
4. Remove now-dead code: the `settings` query, `bankName/bankHolder/bankAccount/bankIban`,
   `isBankTransfer` bank branch, `handleCopyIban`, `copiedIban`, and unused icon imports
   (`Zap`, `CreditCard`, and the IBAN `Copy` usage).
5. **Keep:** success badge + order-number copy, order-progress timeline (relabel step 1 from
   "تم الإرسال آلياً" → "تم استلام الطلب"), invoice details card, nav actions.

**Verify:** `cd frontend && npm run typecheck && npm run build`

Result: customer sees a clean confirmation (order number, status, invoice summary) with **no
bank details and no false "sent via WhatsApp" claim.**

---

## Part B — Manager-only WhatsApp notifications, actually sent

### B1 — Backend: make dispatch manager-only + stop faking success

**File:** `backend/apps/orders/whatsapp.py`

1. In `send_automatic_order_notifications`: **remove the customer message block** (lines
   ~177-198). Send only the manager alert (`build_manager_whatsapp_message`) to
   `store_whatsapp` + each `manager_phones` entry. Customer is never messaged.
2. In `deliver_message_payload`: **remove the fake-SENT fallback.** If no real sender is
   configured, record status `FAILED` (or a new `PENDING`) with a truthful reason — never
   report `SENT` for a message that wasn't sent.
3. Leave `build_customer_whatsapp_message` in place but unused (or delete it) — no longer
   part of auto-send.

No DB migration needed unless we add a `PENDING` status (optional, 1 migration).

### B2 — The actual sender: a local self-hosted sidecar (the real "bot")

New service: `whatsapp-bot/` (Node + [Baileys](https://github.com/WhiskeySockets/Baileys)).

- Tiny Express server: `POST /send { to, message }`, auth via a shared bearer token.
- First run prints a **QR code in the terminal** → scan once with the **store phone** →
  session persisted to `whatsapp-bot/auth_info/` (survives restarts).
- Sends the text to `to` (already normalized to `218...` by the backend).
- Runs on `127.0.0.1:PORT`.

**Wiring (no new Django code — the gateway path already exists):**
- Set `StoreSettings.whatsapp_gateway_url = http://127.0.0.1:PORT/send`
- Set `StoreSettings.whatsapp_gateway_token = <shared secret>`
- Django's existing branch POSTs there and records the real result.

Run alongside Django (dev: two terminals; prod: pm2 or systemd unit).

### B3 — Admin control (verify, likely already works)

- `StoreSettings.manager_phones` and `whatsapp_auto_send` are already editable via the admin
  settings endpoint/dashboard. Confirm the AdminDashboard settings form exposes
  `manager_phones` so the owner can change who gets alerts without code.

---

## Honest caveats (unchanged from discussion)

- Not "no external connection" — the sidecar still talks to WhatsApp's servers. It is
  self-hosted (no third-party API company, no per-message fee).
- Unofficial (Baileys) → against WhatsApp ToS; the store number can be banned, especially if
  volume spikes. Manager-only keeps volume tiny and risk low.
- If WhatsApp logs the session out, the bot needs a QR re-scan.

---

## Suggested order of execution

1. **Part A** (fast, self-contained, immediately removes the misleading screen).
2. **Part B1** (backend goes manager-only + stops lying about delivery).
3. **Part B2** (build + wire the sidecar so alerts actually send).
4. **Part B3** (confirm admin can edit manager numbers).
