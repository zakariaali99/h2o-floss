from __future__ import annotations

import pytest
from django.core.management import call_command

from apps.catalog.models import Product
from apps.core.models import StoreSettings, TelegramMessageLog
from apps.orders import notifications, telegram
from apps.orders.models import Order, OrderNotificationJob


def submit_order(api_client):
    product = Product.objects.get(slug="h2o-floss")
    return api_client.post(
        "/api/v1/checkout/",
        {
            "full_name": "عميل اختبار",
            "phone": "0912223344",
            "city": "tripoli",
            "address": "عنوان اختبار واضح",
            "items": [{"product_id": product.pk, "quantity": 1}],
        },
        format="json",
    )


@pytest.mark.django_db
def test_checkout_queues_notifications_without_dispatching(seeded, api_client, monkeypatch):
    settings = StoreSettings.get_settings()
    settings.telegram_enabled = True
    settings.telegram_bot_token = "123456:TEST-TOKEN"
    settings.telegram_chat_ids = "111111111"
    settings.save()

    sent = (TelegramMessageLog.STATUS_SENT, '{"ok": true}')
    monkeypatch.setattr(telegram, "_send_telegram_message", lambda *args, **kwargs: sent)
    monkeypatch.setattr(telegram, "_send_telegram_document", lambda *args, **kwargs: sent)

    response = submit_order(api_client)

    assert response.status_code == 201
    assert TelegramMessageLog.objects.count() == 0
    assert OrderNotificationJob.objects.filter(order__number=response.json()["number"]).exists()


@pytest.mark.django_db
def test_dispatch_command_completes_pending_job(seeded, api_client):
    response = submit_order(api_client)
    job = OrderNotificationJob.objects.get(order__number=response.json()["number"])

    call_command("dispatch_order_notifications", limit=10)

    job.refresh_from_db()
    assert job.status == OrderNotificationJob.Status.DONE
    assert job.attempts == 1


@pytest.mark.django_db
def test_dispatch_command_records_unexpected_failure(seeded, api_client, monkeypatch):
    response = submit_order(api_client)
    job = OrderNotificationJob.objects.get(order__number=response.json()["number"])

    def fail_dispatch(order):
        raise RuntimeError("gateway unavailable")

    monkeypatch.setattr(notifications, "send_order_telegram_notifications", fail_dispatch)

    call_command("dispatch_order_notifications", limit=10)

    job.refresh_from_db()
    assert Order.objects.filter(pk=job.order_id).exists()
    assert job.status == OrderNotificationJob.Status.FAILED
    assert job.attempts == 1
    assert job.last_error == "gateway unavailable"


@pytest.mark.django_db
def test_dispatch_marks_failed_when_all_telegram_parts_fail(seeded, api_client, monkeypatch):
    settings = StoreSettings.get_settings()
    settings.telegram_enabled = True
    settings.telegram_bot_token = "123456:TEST-TOKEN"
    settings.telegram_chat_ids = "111111111"
    settings.save()

    failed = (TelegramMessageLog.STATUS_FAILED, "boom")
    monkeypatch.setattr(telegram, "_send_telegram_message", lambda *args, **kwargs: failed)
    monkeypatch.setattr(telegram, "_send_telegram_document", lambda *args, **kwargs: failed)

    response = submit_order(api_client)
    assert response.status_code == 201
    job = OrderNotificationJob.objects.get(order__number=response.json()["number"])

    call_command("dispatch_order_notifications", limit=10)

    job.refresh_from_db()
    assert Order.objects.filter(pk=job.order_id).exists()
    assert job.status == OrderNotificationJob.Status.FAILED
    assert job.attempts == 1


@pytest.mark.django_db
def test_dispatch_marks_done_when_at_least_one_part_sends(seeded, api_client, monkeypatch):
    settings = StoreSettings.get_settings()
    settings.telegram_enabled = True
    settings.telegram_bot_token = "123456:TEST-TOKEN"
    settings.telegram_chat_ids = "111111111"
    settings.save()

    sent = (TelegramMessageLog.STATUS_SENT, '{"ok": true}')
    monkeypatch.setattr(telegram, "_send_telegram_message", lambda *args, **kwargs: sent)
    monkeypatch.setattr(telegram, "_send_telegram_document", lambda *args, **kwargs: sent)

    response = submit_order(api_client)
    assert response.status_code == 201
    job = OrderNotificationJob.objects.get(order__number=response.json()["number"])

    call_command("dispatch_order_notifications", limit=10)

    job.refresh_from_db()
    assert job.status == OrderNotificationJob.Status.DONE
    assert job.attempts == 1

