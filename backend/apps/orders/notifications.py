"""Manager notification delivery for orders already committed to the database."""

from apps.core.models import StoreSettings, TelegramMessageLog

from .models import Order
from .telegram import send_order_telegram_notifications
from .whatsapp import send_automatic_order_notifications


def dispatch_order_notifications(order: Order) -> None:
    results = send_order_telegram_notifications(order)
    if results and not any(r["status"] == TelegramMessageLog.STATUS_SENT for r in results):
        raise RuntimeError(f"all Telegram parts failed for order {order.number}")
    settings = StoreSettings.get_settings()
    if (settings.whatsapp_gateway_url or "").strip():
        send_automatic_order_notifications(order)
