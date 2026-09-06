"""Telegram manager notifications for H2O Floss.

Per new order, each configured manager chat gets, in order:
  1. A short message: customer name, then phone.
  2. The invoice as a PDF document.
  3. (Bank-transfer orders only) the store's bank details, pulled live from settings.

All delivery is a single outbound HTTPS request each, via the official Telegram
Bot API — so it works on shared hosting (no long-running process, no QR).
"""

from __future__ import annotations

import json
import logging
import re
import urllib.error
import urllib.request
import uuid

from apps.core.models import StoreSettings, TelegramMessageLog
from apps.orders.models import Order

logger = logging.getLogger(__name__)

API = "https://api.telegram.org/bot{token}/{method}"


# --------------------------------------------------------------------------- #
# Message builders
# --------------------------------------------------------------------------- #
DIVIDER = "━━━━━━━━━━━━━━━"


def build_summary_message(order: Order) -> str:
    """Order header (divider + number) followed by customer name and phone.

    The divider marks where each new order begins so consecutive orders don't
    blur together in the chat.
    """
    return (
        f"{DIVIDER}\n"
        f"🆕 طلب جديد  #{order.number}\n"
        f"{DIVIDER}\n"
        f"👤 {order.full_name}\n"
        f"📞 {order.phone}"
    )


def build_bank_details_message(settings: StoreSettings, order: Order) -> str:
    """Bank details, read live from store settings (so edits take effect at once).

    Stamped with the order number so it stays tied to the right order.
    """
    return (
        f"💳 بيانات التحويل المصرفي — #{order.number}\n"
        f"المصرف: {settings.bank_name}\n"
        f"المستفيد: {settings.bank_account_holder}\n"
        f"رقم الحساب: {settings.bank_account_number}\n"
        f"الآيبان (IBAN): {settings.bank_iban}"
    )


# --------------------------------------------------------------------------- #
# Transport (mockable in tests)
# --------------------------------------------------------------------------- #
def _send_telegram_message(token: str, chat_id: str, text: str) -> tuple[str, str]:
    """POST a text message via sendMessage. Returns (status, response_details)."""
    url = API.format(token=token, method="sendMessage")
    payload = json.dumps({
        "chat_id": chat_id,
        "text": text,
        "disable_web_page_preview": True,
    }).encode("utf-8")
    req = urllib.request.Request(
        url, data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "H2OFloss-Backend/1.0"},
        method="POST",
    )
    return _do_request(req, chat_id)


def _send_telegram_document(
    token: str, chat_id: str, filename: str, file_bytes: bytes, caption: str = ""
) -> tuple[str, str]:
    """POST a document via sendDocument (multipart/form-data)."""
    url = API.format(token=token, method="sendDocument")
    boundary = f"----H2OFloss{uuid.uuid4().hex}"
    parts: list[bytes] = []

    def field(name: str, value: str) -> None:
        parts.append(f"--{boundary}\r\n".encode())
        parts.append(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode())
        parts.append(f"{value}\r\n".encode())

    field("chat_id", str(chat_id))
    if caption:
        field("caption", caption)

    parts.append(f"--{boundary}\r\n".encode())
    parts.append(
        f'Content-Disposition: form-data; name="document"; filename="{filename}"\r\n'.encode()
    )
    parts.append(b"Content-Type: application/pdf\r\n\r\n")
    parts.append(file_bytes)
    parts.append(b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode())

    body = b"".join(parts)
    req = urllib.request.Request(
        url, data=body,
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "User-Agent": "H2OFloss-Backend/1.0",
        },
        method="POST",
    )
    return _do_request(req, chat_id)


def _do_request(req: urllib.request.Request, chat_id: str) -> tuple[str, str]:
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            return (TelegramMessageLog.STATUS_SENT, response.read().decode("utf-8")[:500])
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace") if hasattr(exc, "read") else str(exc)
        logger.warning("Telegram request to %s failed: HTTP %s %s", chat_id, exc.code, detail[:300])
        return (TelegramMessageLog.STATUS_FAILED, f"HTTP {exc.code}: {detail[:400]}")
    except Exception as exc:
        logger.warning("Telegram request to %s failed: %s", chat_id, exc)
        return (TelegramMessageLog.STATUS_FAILED, str(exc)[:500])


def _log(order_number: str, chat_id: str, text: str, result: tuple[str, str]) -> str:
    status, resp = result
    TelegramMessageLog.objects.create(
        order_number=order_number,
        chat_id=chat_id,
        message_text=text,
        status=status,
        response_payload=resp,
    )
    return status


# --------------------------------------------------------------------------- #
# Orchestration
# --------------------------------------------------------------------------- #
def send_order_telegram_notifications(order: Order) -> list[dict]:
    """Deliver the 3-part order notification to each configured manager chat."""
    settings = StoreSettings.get_settings()
    if not settings.telegram_enabled:
        logger.info("Telegram notifications disabled in settings. Skipping.")
        return []

    token = (settings.telegram_bot_token or "").strip()
    chat_ids = [c.strip() for c in re.split(r"[,،\s]+", settings.telegram_chat_ids or "") if c.strip()]
    if not token or not chat_ids:
        logger.warning("Telegram enabled but bot token or chat ids missing — nothing sent.")
        return []

    summary = build_summary_message(order)
    is_bank = order.payment_method == Order.PAYMENT_BANK

    # Build the invoice PDF once (shared across recipients).
    pdf_bytes = None
    pdf_error = None
    try:
        from apps.orders.invoice import build_invoice_pdf

        pdf_bytes = build_invoice_pdf(order)
    except Exception as exc:  # never let a PDF failure block the text alerts
        pdf_error = str(exc)
        logger.warning("Invoice PDF generation failed for %s: %s", order.number, exc)

    dispatched = []
    for chat_id in chat_ids:
        # 1) name + phone
        status = _log(order.number, chat_id, summary, _send_telegram_message(token, chat_id, summary))
        dispatched.append({"chat_id": chat_id, "part": "summary", "status": status})

        # 2) invoice PDF
        if pdf_bytes is not None:
            filename = f"invoice-{order.number}.pdf"
            caption = f"🧾 فاتورة الطلب #{order.number}"
            result = _send_telegram_document(token, chat_id, filename, pdf_bytes, caption)
            status = _log(order.number, chat_id, f"[PDF] {filename}", result)
        else:
            status = _log(
                order.number, chat_id, "[PDF] generation_failed",
                (TelegramMessageLog.STATUS_FAILED, str(pdf_error)[:400]),
            )
        dispatched.append({"chat_id": chat_id, "part": "invoice", "status": status})

        # 3) bank details (bank-transfer orders only)
        if is_bank:
            bank_msg = build_bank_details_message(settings, order)
            status = _log(order.number, chat_id, bank_msg, _send_telegram_message(token, chat_id, bank_msg))
            dispatched.append({"chat_id": chat_id, "part": "bank", "status": status})

    logger.info("Dispatched %d Telegram parts for order %s", len(dispatched), order.number)
    return dispatched
