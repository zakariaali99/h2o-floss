"""Automated WhatsApp dispatch service for H2O Floss.

Automatically dispatches WhatsApp messages upon order completion:
1. Customer: Full invoice + Bank details/IBAN (if bank transfer) or Invoice confirmation (if cash).
2. Store / System: Full order alert for preparation.
3. Manager(s): Follow-up notification for each configured manager phone number.
"""

from __future__ import annotations

import json
import logging
import re
import urllib.request
import urllib.error

from apps.core.models import StoreSettings, WhatsAppMessageLog
from apps.orders.models import Order

logger = logging.getLogger(__name__)


def normalize_libyan_whatsapp(phone: str) -> str:
    """Normalize Libyan phone number into standard international WhatsApp MSISDN format."""
    digits = re.sub(r"\D", "", phone or "")
    if digits.startswith("00218"):
        return digits[2:]
    if digits.startswith("218"):
        return digits
    if digits.startswith("09") and len(digits) == 10:
        return f"218{digits[1:]}"
    if digits.startswith("9") and len(digits) == 9:
        return f"218{digits}"
    return digits


def build_customer_whatsapp_message(order: Order, settings: StoreSettings) -> str:
    """Build formatted Arabic WhatsApp invoice for customer."""
    items_text = "\n".join(
        f"• {item.product_name} (عدد: {item.quantity}) = {item.line_total} د.ل"
        for item in order.items.all()
    )
    if not items_text:
        items_text = "• جهاز H2O Floss الأصلي"

    shipping_text = "مجاني لكافة المدن" if str(order.shipping) == "0.00" else f"{order.shipping} د.ل"

    if order.payment_method == Order.PAYMENT_BANK:
        return (
            f"🧾 *فاتورة طلب متجر H2O Floss (تحويل مصرفي)*\n"
            f"رقم الطلب: #{order.number}\n"
            f"العميل: {order.full_name}\n"
            f"الهاتف: {order.phone}\n"
            f"المدينة: {order.city} — {order.address}\n"
            f"-------------------------\n"
            f"المنتجات المطلوبة:\n"
            f"{items_text}\n"
            f"المجموع الفرعي: {order.subtotal} د.ل\n"
            f"الشحن: {shipping_text}\n"
            f"*الإجمالي المطلوب تحويله: {order.total} د.ل*\n"
            f"طريقة الدفع: تحويل مصرفي عبر واتساب\n"
            f"-------------------------\n"
            f"💳 *بيانات الحساب المصرفي المعتمد للتحويل:*\n"
            f"المصرف: {settings.bank_name}\n"
            f"المستفيد: {settings.bank_account_holder}\n"
            f"رقم الحساب: {settings.bank_account_number}\n"
            f"الآيبان (IBAN): {settings.bank_iban}\n"
            f"-------------------------\n"
            f"تم إرسال هذا الإشعار تلقائياً فور تسجيل طلبك. يرجى إرسال صورة إيصال التحويل رداً على هذه الرسالة لتأكيد الشحن فوراً."
        )

    return (
        f"🧾 *فاتورة طلب متجر H2O Floss (دفع عند الاستلام)*\n"
        f"رقم الطلب: #{order.number}\n"
        f"العميل: {order.full_name}\n"
        f"الهاتف: {order.phone}\n"
        f"المدينة: {order.city} — {order.address}\n"
        f"-------------------------\n"
        f"المنتجات المطلوبة:\n"
        f"{items_text}\n"
        f"المجموع الفرعي: {order.subtotal} د.ل\n"
        f"الشحن: {shipping_text}\n"
        f"*الإجمالي للدفع عند الاستلام: {order.total} د.ل*\n"
        f"طريقة الدفع: نقداً عند الاستلام (كاش)\n"
        f"-------------------------\n"
        f"تم تسجيل طلبك بنجاح وسيتواصل معك مندوب الشحن لتأكيد وقت التوصيل المناسب."
    )


def build_manager_whatsapp_message(order: Order) -> str:
    """Build formatted alert for store management."""
    items_text = "\n".join(
        f"• {item.product_name} × {item.quantity} ({item.line_total} د.ل)"
        for item in order.items.all()
    )
    is_bank = order.payment_method == Order.PAYMENT_BANK
    pay_label = "💳 تحويل مصرفي عبر واتساب" if is_bank else "💵 كاش عند الاستلام"

    note_line = f"\nملاحظات العميل: {order.note}" if order.note else ""

    return (
        f"🔔 *إشعار طلب جديد وارد (إرسال تلقائي من النظام)*\n"
        f"رقم الطلب: #{order.number}\n"
        f"العميل: {order.full_name} ({order.phone})\n"
        f"المدينة والمكان: {order.city} - {order.address}\n"
        f"طريقة الدفع: {pay_label}\n"
        f"*الإجمالي: {order.total} د.ل*\n"
        f"المنتجات:\n{items_text}"
        f"{note_line}"
    )


def deliver_message_payload(
    phone: str,
    message: str,
    recipient_type: str,
    order_number: str,
    settings: StoreSettings,
) -> tuple[str, str]:
    """
    Attempt real dispatch via configured gateway URL or log as automatically sent.
    Returns (status, response_details).
    """
    normalized_phone = normalize_libyan_whatsapp(phone)
    gateway_url = (settings.whatsapp_gateway_url or "").strip()
    token = (settings.whatsapp_gateway_token or "").strip()

    # No self-hosted sender configured → nothing was sent. Record the truth; never
    # report SENT for a message that never left the server.
    if not gateway_url:
        logger.warning(
            "WhatsApp sender not configured (whatsapp_gateway_url empty); "
            "message to %s was NOT sent.",
            normalized_phone,
        )
        return (
            WhatsAppMessageLog.STATUS_FAILED,
            json.dumps({"error": "gateway_not_configured", "to": normalized_phone}),
        )

    try:
        payload = json.dumps({
            "to": normalized_phone,
            "message": message,
            "order_number": order_number,
            "recipient_type": recipient_type,
        }).encode("utf-8")

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "H2OFloss-Backend/1.0",
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"

        req = urllib.request.Request(gateway_url, data=payload, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as response:
            resp_data = response.read().decode("utf-8")
            return (WhatsAppMessageLog.STATUS_SENT, resp_data[:500])
    except Exception as exc:
        logger.warning("WhatsApp gateway dispatch failed for %s: %s", normalized_phone, exc)
        return (WhatsAppMessageLog.STATUS_FAILED, str(exc)[:500])


def send_automatic_order_notifications(order: Order) -> list[dict]:
    """
    Manager-only dispatch: notify the store/manager numbers of a new order.

    The customer is never messaged automatically (they contact the store
    themselves via the storefront support link).

    1. Store system WhatsApp
    2. Manager(s) phone(s)
    """
    settings = StoreSettings.get_settings()
    if not settings.whatsapp_auto_send:
        logger.info("WhatsApp auto-send is disabled in settings. Skipping.")
        return []

    dispatched = []

    # 1. Store / System WhatsApp
    manager_msg = build_manager_whatsapp_message(order)
    store_phone = settings.store_whatsapp
    if store_phone:
        s_status, s_resp = deliver_message_payload(
            phone=store_phone,
            message=manager_msg,
            recipient_type=WhatsAppMessageLog.RECIPIENT_STORE,
            order_number=order.number,
            settings=settings,
        )
        WhatsAppMessageLog.objects.create(
            order_number=order.number,
            recipient_type=WhatsAppMessageLog.RECIPIENT_STORE,
            recipient_phone=store_phone,
            message_text=manager_msg,
            status=s_status,
            response_payload=s_resp,
        )
        dispatched.append({
            "recipient": "STORE",
            "phone": store_phone,
            "status": s_status,
        })

    # 3. Manager(s) WhatsApp Phones
    manager_phones = [
        p.strip()
        for p in re.split(r"[,،\s]+", settings.manager_phones or "")
        if p.strip()
    ]
    for m_phone in manager_phones:
        # Avoid duplicate if same as store phone
        if normalize_libyan_whatsapp(m_phone) == normalize_libyan_whatsapp(store_phone):
            continue

        m_status, m_resp = deliver_message_payload(
            phone=m_phone,
            message=manager_msg,
            recipient_type=WhatsAppMessageLog.RECIPIENT_MANAGER,
            order_number=order.number,
            settings=settings,
        )
        WhatsAppMessageLog.objects.create(
            order_number=order.number,
            recipient_type=WhatsAppMessageLog.RECIPIENT_MANAGER,
            recipient_phone=m_phone,
            message_text=manager_msg,
            status=m_status,
            response_payload=m_resp,
        )
        dispatched.append({
            "recipient": "MANAGER",
            "phone": m_phone,
            "status": m_status,
        })

    logger.info("Automatically dispatched %d WhatsApp notifications for order %s", len(dispatched), order.number)
    return dispatched
