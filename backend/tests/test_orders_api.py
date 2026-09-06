"""P3 exit gate: checkout, lookup and contact.

Covers the plan's scripted matrix — happy path, out-of-stock mid-flight,
invalid phone/city, empty cart, double submit, guest success carrying the
guest's own email — plus price freezing, CRM capture, 404-safe lookup and
contact capture.
"""

from __future__ import annotations

import re
from decimal import Decimal

import pytest
from django.utils import timezone

from apps.catalog.models import Product
from apps.orders.models import Client, ContactMessage, Order

PAYLOAD = {
    "full_name": "زكرياء اختبار",
    "phone": "0914076123",
    "email": "Guest@Example.com",
    "city": "tripoli",
    "address": "شارع الجرابة، مبنى 12، الطابق الثاني",
}


@pytest.fixture
def cart_with_items(seeded, api_client):
    device = Product.objects.get(slug="h2o-floss")
    nozzle = Product.objects.get(slug="nozzle-set-6")
    api_client.post("/api/v1/cart/items/", {"product": device.pk, "quantity": 1}, format="json")
    api_client.post("/api/v1/cart/items/", {"product": nozzle.pk, "quantity": 2}, format="json")


def checkout(api_client, **overrides):
    return api_client.post("/api/v1/checkout/", {**PAYLOAD, **overrides}, format="json")


# ------------------------------------------------------------------ checkout


@pytest.mark.django_db
def test_checkout_happy_path(seeded, api_client, cart_with_items):
    response = checkout(api_client)
    assert response.status_code == 201
    order = response.json()
    assert re.fullmatch(r"H2O-\d{4}-\d{6}", order["number"])
    assert order["status"] == "PENDING"
    assert order["status_display"] == "قيد المراجعة"
    assert order["subtotal"] == "315.00"  # 225 + 2×45
    assert order["shipping"] == "0.00"
    assert order["total"] == "315.00"
    assert order["email"] == "guest@example.com"  # guest order carries its own email
    assert order["city_name"] == "طرابلس"
    assert len(order["items"]) == 2

    # cart cleared by the checkout
    assert api_client.get("/api/v1/cart/").json()["items"] == []

    # CRM client captured with the normalised email
    client = Client.objects.get(email="guest@example.com")
    assert client.name == PAYLOAD["full_name"]
    assert client.phone == "0914076123"
    assert client.orders.count() == 1

    # prices/names frozen: later catalog edits never rewrite the order
    Product.objects.filter(slug="h2o-floss").update(price=999)
    row = Order.objects.get(number=order["number"])
    assert row.total == Decimal("315.00")
    line = row.items.get(product__slug="h2o-floss")
    assert line.unit_price == Decimal("225.00")
    assert line.line_total == Decimal("225.00")
    assert line.product_name == Product.objects.get(slug="h2o-floss").name


@pytest.mark.django_db
def test_checkout_rechecks_stock_under_lock(seeded, api_client, cart_with_items):
    """The unit bought between add-to-cart and checkout must fail the order."""
    Product.objects.filter(slug="nozzle-set-6").update(stock_quantity=1)
    response = checkout(api_client)
    assert response.status_code == 400
    assert Order.objects.count() == 0
    assert api_client.get("/api/v1/cart/").json()["count"] == 3  # cart kept for fixing


@pytest.mark.django_db
def test_checkout_rejects_invalid_phone_and_city(seeded, api_client, cart_with_items):
    bad_phone = checkout(api_client, phone="12345")
    assert bad_phone.status_code == 400
    assert bad_phone.json()["fields"]["phone"]

    bad_city = checkout(api_client, city="cairo")  # valid city, wrong country
    assert bad_city.status_code == 400
    assert bad_city.json()["fields"]["city"]

    # +218 form is accepted and stored normalised
    ok = checkout(api_client, phone="+218 91 407 6123")
    assert ok.status_code == 201
    assert ok.json()["phone"] == "0914076123"


@pytest.mark.django_db
def test_checkout_empty_cart_rejected(seeded, api_client):
    response = checkout(api_client)
    assert response.status_code == 400
    assert Order.objects.count() == 0


@pytest.mark.django_db
def test_checkout_double_submit_fails_closed(seeded, api_client, cart_with_items):
    assert checkout(api_client).status_code == 201
    second = checkout(api_client)
    assert second.status_code == 400  # the cart no longer exists
    assert Order.objects.count() == 1


@pytest.mark.django_db
def test_checkout_repeats_bump_not_duplicate_the_client(seeded, api_client, cart_with_items):
    assert checkout(api_client).status_code == 201
    device = Product.objects.get(slug="h2o-floss")
    api_client.post("/api/v1/cart/items/", {"product": device.pk}, format="json")
    assert checkout(api_client, full_name="اسم محدَّث").status_code == 201
    assert Order.objects.count() == 2
    assert Client.objects.count() == 1  # upserted, never duplicated
    assert Client.objects.get().name == "اسم محدَّث"


@pytest.mark.django_db
def test_checkout_is_post_only(seeded, api_client):
    assert api_client.get("/api/v1/checkout/").status_code == 405


@pytest.mark.django_db
def test_order_persists_number_and_timestamps(seeded, api_client, cart_with_items):
    response = checkout(api_client)
    row = Order.objects.get(number=response.json()["number"])
    assert row.created_at <= timezone.now()
    assert row.status == "PENDING"
    assert row.history.count() >= 1  # simple-history tracks the order


# -------------------------------------------------------------------- lookup


@pytest.mark.django_db
def test_order_lookup_flexible_by_phone_or_number(seeded, api_client, cart_with_items):
    number = checkout(api_client).json()["number"]
    # empty lookup returns 400
    assert api_client.get("/api/v1/orders/lookup/").status_code == 400
    # lookup by phone alone succeeds
    phone_res = api_client.get("/api/v1/orders/lookup/?phone=0914076123")
    assert phone_res.status_code == 200
    assert phone_res.json()["number"] == number
    # lookup by number alone succeeds
    num_res = api_client.get(f"/api/v1/orders/lookup/?number={number}")
    assert num_res.status_code == 200
    assert num_res.json()["number"] == number


@pytest.mark.django_db
def test_order_lookup_match_and_404_safety(seeded, api_client, cart_with_items):
    number = checkout(api_client).json()["number"]

    found = api_client.get(f"/api/v1/orders/lookup/?number={number}&phone=0914076123")
    assert found.status_code == 200
    assert found.json()["number"] == number
    assert found.json()["status"] == "PENDING"
    assert len(found.json()["items"]) == 2

    # wrong phone → same generic 404 as a wrong number (no enumeration)
    wrong = api_client.get(f"/api/v1/orders/lookup/?number={number}&phone=0999999999")
    assert wrong.status_code == 404

    # +218 form of the same number matches too (URL-encoded +)
    alt = api_client.get(f"/api/v1/orders/lookup/?number={number}&phone=%2B218914076123")
    assert alt.status_code == 200


# ------------------------------------------------------------------- contact


@pytest.mark.django_db
def test_contact_message_captured(seeded, api_client):
    response = api_client.post(
        "/api/v1/contact/",
        {"name": "زكرياء", "message": "سؤال عن الضمان والشحن", "phone": "0914076123"},
        format="json",
    )
    assert response.status_code == 201
    assert ContactMessage.objects.filter(name="زكرياء").exists()

    invalid = api_client.post("/api/v1/contact/", {"name": "x"}, format="json")
    assert invalid.status_code == 400

    assert api_client.get("/api/v1/contact/").status_code == 405  # POST-only


# --------------------------------------------------------------------- admin


@pytest.mark.django_db
def test_orders_are_visible_in_admin(seeded, client, api_client, admin_user, cart_with_items):
    from django.test import Client as DjangoClient

    number = checkout(api_client).json()["number"]
    ContactMessage.objects.create(name="زكرياء", message="سؤال عن الضمان")

    admin_client = DjangoClient()
    admin_client.force_login(admin_user)
    order = Order.objects.get(number=number)
    for url in (
        "/admin/orders/order/",
        f"/admin/orders/order/{order.pk}/change/",
        "/admin/orders/client/",
        "/admin/orders/contactmessage/",
    ):
        response = admin_client.get(url)
        assert response.status_code == 200, url


@pytest.mark.django_db
def test_checkout_without_email_and_bank_transfer(seeded, api_client, cart_with_items):
    res = api_client.post(
        "/api/v1/checkout/",
        {
            "full_name": "علي محمد",
            "phone": "0925551234",
            "city": "benghazi",
            "address": "شارع دبي بجوار الصيدلية",
            "payment_method": "BANK_TRANSFER",
        },
        format="json",
    )
    assert res.status_code == 201
    data = res.json()
    assert data["payment_method"] == "BANK_TRANSFER"
    assert data["email"] == ""
    assert data["full_name"] == "علي محمد"

    # Verify order lookup by phone
    lookup = api_client.get("/api/v1/orders/lookup/?phone=0925551234")
    assert lookup.status_code == 200
    assert lookup.json()["number"] == data["number"]


@pytest.mark.django_db
def test_admin_endpoints_require_authentication(seeded, api_client):
    # Unauthenticated callers are refused on the gated admin surface.
    assert api_client.get("/api/v1/admin/customers/").status_code in (401, 403)
    assert api_client.get("/api/v1/admin/products/").status_code in (401, 403)
    assert api_client.get("/api/v1/admin/settings/").status_code in (401, 403)
    assert api_client.patch("/api/v1/admin/settings/", {"bank_name": "x"}, format="json").status_code in (401, 403)


@pytest.mark.django_db
def test_public_store_settings_hides_secrets(seeded, api_client):
    # The public storefront endpoint exposes only the support number — no bank/secrets.
    res = api_client.get("/api/v1/store/settings/")
    assert res.status_code == 200
    body = res.json()
    assert "store_whatsapp" in body
    assert "bank_name" not in body
    assert "bank_iban" not in body
    assert "telegram_bot_token" not in body
    assert "whatsapp_gateway_token" not in body


@pytest.mark.django_db
def test_admin_endpoints_customers_settings_products(seeded, api_client, admin_api_client, cart_with_items):
    # Place an order (public checkout)
    checkout(api_client)

    # 1. Admin customers (authenticated)
    customers_res = admin_api_client.get("/api/v1/admin/customers/")
    assert customers_res.status_code == 200
    assert len(customers_res.json()) >= 1
    assert "phone" in customers_res.json()[0]
    assert "orders_count" in customers_res.json()[0]

    # 2. Admin settings
    update_res = admin_api_client.patch(
        "/api/v1/admin/settings/",
        {"bank_name": "مصرف التجاري الوطني", "store_whatsapp": "218921112233"},
        format="json",
    )
    assert update_res.status_code == 200
    assert update_res.json()["bank_name"] == "مصرف التجاري الوطني"
    assert update_res.json()["store_whatsapp"] == "218921112233"

    # 3. Admin products
    products_res = admin_api_client.get("/api/v1/admin/products/")
    assert products_res.status_code == 200
    assert len(products_res.json()["results"]) >= 1

    create_prod = admin_api_client.post(
        "/api/v1/admin/products/",
        {
            "name": "جهاز جديد تجريبي",
            "price": "199.00",
            "kind": "DEVICE",
        },
        format="json",
    )
    assert create_prod.status_code == 201
    prod_id = create_prod.json()["id"]

    patch_prod = admin_api_client.patch(
        f"/api/v1/admin/products/{prod_id}/",
        {"price": "180.00"},
        format="json",
    )
    assert patch_prod.status_code == 200
    assert patch_prod.json()["price"] == "180.00"


@pytest.mark.django_db
def test_automatic_whatsapp_order_dispatch(seeded, api_client, cart_with_items):
    from apps.core.models import StoreSettings, WhatsAppMessageLog

    settings = StoreSettings.get_settings()
    settings.store_whatsapp = "218919999999"
    settings.manager_phones = "218928888888, 218937777777"
    # A gateway URL must be set for the WhatsApp path to run at all. Point it at a
    # refused local port so dispatch executes and logs (status FAILED), fast.
    settings.whatsapp_gateway_url = "http://127.0.0.1:9/none"
    settings.save()

    res = api_client.post(
        "/api/v1/checkout/",
        {
            "full_name": "سالم الفيتوري",
            "phone": "0917770000",
            "city": "tripoli",
            "address": "غوط الشعال",
            "payment_method": "BANK_TRANSFER",
        },
        format="json",
    )
    assert res.status_code == 201
    order_number = res.json()["number"]

    # Manager-only dispatch: entries for Store + Managers, and NONE for the customer.
    logs = WhatsAppMessageLog.objects.filter(order_number=order_number)
    assert logs.count() >= 3

    # The customer is never messaged automatically.
    customer_logs = logs.filter(recipient_type=WhatsAppMessageLog.RECIPIENT_CUSTOMER)
    assert customer_logs.count() == 0

    store_log = logs.filter(recipient_type=WhatsAppMessageLog.RECIPIENT_STORE).first()
    assert store_log is not None
    assert store_log.recipient_phone == "218919999999"
    # Manager alert carries the order + customer contact, not bank/IBAN details.
    assert "سالم الفيتوري" in store_log.message_text
    assert "بيانات الحساب المصرفي" not in store_log.message_text

    manager_logs = logs.filter(recipient_type=WhatsAppMessageLog.RECIPIENT_MANAGER)
    assert manager_logs.count() >= 2


def _mock_telegram_transport(monkeypatch):
    """Patch the two Telegram transports; return (messages, documents) capture lists."""
    from apps.core.models import TelegramMessageLog
    from apps.orders import telegram as telegram_mod

    messages, documents = [], []

    def fake_message(token, chat_id, text):
        messages.append((chat_id, text))
        return (TelegramMessageLog.STATUS_SENT, '{"ok": true}')

    def fake_document(token, chat_id, filename, file_bytes, caption=""):
        documents.append((chat_id, filename, len(file_bytes)))
        return (TelegramMessageLog.STATUS_SENT, '{"ok": true}')

    monkeypatch.setattr(telegram_mod, "_send_telegram_message", fake_message)
    monkeypatch.setattr(telegram_mod, "_send_telegram_document", fake_document)
    return messages, documents


@pytest.mark.django_db
def test_telegram_cash_order_sends_summary_and_invoice(seeded, api_client, cart_with_items, monkeypatch):
    from apps.core.models import StoreSettings, TelegramMessageLog

    settings = StoreSettings.get_settings()
    settings.telegram_enabled = True
    settings.telegram_bot_token = "123456:TEST-TOKEN"
    settings.telegram_chat_ids = "111111111, 222222222"
    settings.save()

    messages, documents = _mock_telegram_transport(monkeypatch)

    res = api_client.post(
        "/api/v1/checkout/",
        {
            "full_name": "عائشة المزوغي",
            "phone": "0918887777",
            "city": "tripoli",
            "address": "سوق الجمعة",
            "payment_method": "CASH_ON_DELIVERY",
        },
        format="json",
    )
    assert res.status_code == 201
    order_number = res.json()["number"]

    # Cash order → per chat: summary message + invoice document, NO bank message.
    assert len(messages) == 2          # 2 chats × summary
    assert len(documents) == 2         # 2 chats × invoice PDF
    # Summary carries the order header (divider) plus name and phone.
    assert all("عائشة المزوغي" in text and "0918887777" in text and "طلب جديد" in text for _, text in messages)
    # A real invoice PDF was built and had non-trivial size.
    assert all(size > 1000 for _, _, size in documents)

    logs = TelegramMessageLog.objects.filter(order_number=order_number)
    assert logs.count() == 4           # 2 summary + 2 invoice
    assert all(log.status == TelegramMessageLog.STATUS_SENT for log in logs)


@pytest.mark.django_db
def test_telegram_bank_order_adds_bank_message(seeded, api_client, cart_with_items, monkeypatch):
    from apps.core.models import StoreSettings, TelegramMessageLog

    settings = StoreSettings.get_settings()
    settings.telegram_enabled = True
    settings.telegram_bot_token = "123456:TEST-TOKEN"
    settings.telegram_chat_ids = "111111111"
    settings.bank_iban = "LY99TESTIBAN000111"
    settings.save()

    messages, documents = _mock_telegram_transport(monkeypatch)

    res = api_client.post(
        "/api/v1/checkout/",
        {
            "full_name": "سالم",
            "phone": "0919990000",
            "city": "tripoli",
            "address": "الظهرة",
            "payment_method": "BANK_TRANSFER",
        },
        format="json",
    )
    assert res.status_code == 201
    order_number = res.json()["number"]

    # Bank order → per chat: summary + invoice + bank details message.
    assert len(messages) == 2          # summary + bank
    assert len(documents) == 1         # invoice PDF
    bank_texts = [t for _, t in messages if "الآيبان" in t]
    assert len(bank_texts) == 1
    assert "LY99TESTIBAN000111" in bank_texts[0]   # pulled live from settings

    logs = TelegramMessageLog.objects.filter(order_number=order_number)
    assert logs.count() == 3


@pytest.mark.django_db
def test_build_invoice_pdf_returns_pdf_bytes(seeded, api_client, cart_with_items):
    from apps.orders.models import Order
    from apps.orders.invoice import build_invoice_pdf

    res = api_client.post(
        "/api/v1/checkout/",
        {
            "full_name": "منتصر القذافي",
            "phone": "0915554444",
            "city": "tripoli",
            "address": "قرقارش",
            "payment_method": "BANK_TRANSFER",
        },
        format="json",
    )
    assert res.status_code == 201
    order = Order.objects.get(number=res.json()["number"])

    pdf = build_invoice_pdf(order)
    assert isinstance(pdf, bytes)
    assert pdf.startswith(b"%PDF")
    assert len(pdf) > 2000


@pytest.mark.django_db
def test_new_orders_are_unseen_and_can_be_marked_seen(seeded, api_client, admin_api_client, cart_with_items):
    res = api_client.post(
        "/api/v1/checkout/",
        {
            "full_name": "خالد",
            "phone": "0917778888",
            "city": "tripoli",
            "address": "حي الأندلس",
            "payment_method": "CASH_ON_DELIVERY",
        },
        format="json",
    )
    assert res.status_code == 201
    number = res.json()["number"]

    # A fresh order is unseen and counts as new.
    count = admin_api_client.get("/api/v1/admin/orders/new-count/")
    assert count.status_code == 200
    assert count.json()["count"] >= 1

    listing = admin_api_client.get("/api/v1/admin/orders/?unseen=1")
    assert any(o["number"] == number and o["is_seen"] is False for o in listing.json())

    # Marking it seen removes it from the new set.
    seen = admin_api_client.post(f"/api/v1/admin/orders/{number}/seen/")
    assert seen.status_code == 200
    assert seen.json()["is_seen"] is True

    unseen_after = admin_api_client.get("/api/v1/admin/orders/?unseen=1")
    assert all(o["number"] != number for o in unseen_after.json())


@pytest.mark.django_db
def test_mark_all_orders_seen(seeded, api_client, admin_api_client, cart_with_items):
    api_client.post(
        "/api/v1/checkout/",
        {"full_name": "ن", "phone": "0910002222", "city": "tripoli", "address": "شارع", "payment_method": "CASH_ON_DELIVERY"},
        format="json",
    )
    res = admin_api_client.post("/api/v1/admin/orders/seen-all/")
    assert res.status_code == 200
    assert admin_api_client.get("/api/v1/admin/orders/new-count/").json()["count"] == 0


@pytest.mark.django_db
def test_admin_invoice_pdf_endpoint(seeded, api_client, admin_api_client, cart_with_items):
    number = api_client.post(
        "/api/v1/checkout/",
        {"full_name": "عميل تجريبي", "phone": "0913334444", "city": "tripoli", "address": "شارع رئيسي", "payment_method": "BANK_TRANSFER"},
        format="json",
    ).json()["number"]

    # Unauthenticated is refused; admin gets a real PDF.
    assert api_client.get(f"/api/v1/admin/orders/{number}/invoice.pdf").status_code in (401, 403)
    res = admin_api_client.get(f"/api/v1/admin/orders/{number}/invoice.pdf")
    assert res.status_code == 200
    assert res["Content-Type"] == "application/pdf"
    assert bytes(res.content).startswith(b"%PDF")


@pytest.mark.django_db
def test_admin_login_issues_token_for_admin_and_rejects_others(api_client, admin_user, customer_user):
    # Admin logs in and receives access + refresh + user.
    ok = api_client.post(
        "/api/v1/auth/login/",
        {"email": "admin@h2ofloss.ly", "password": "Str0ng!Pass1"},
        format="json",
    )
    assert ok.status_code == 200
    assert "access" in ok.json() and "refresh" in ok.json()
    assert ok.json()["user"]["is_superuser"] is True

    # A non-staff customer is refused a dashboard token.
    bad = api_client.post(
        "/api/v1/auth/login/",
        {"email": "shopper@example.com", "password": "Str0ng!Pass1"},
        format="json",
    )
    assert bad.status_code == 400

    # The issued token actually authorizes an admin call.
    token = ok.json()["access"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    assert api_client.get("/api/v1/admin/orders/new-count/").status_code == 200


@pytest.mark.django_db
def test_telegram_skipped_when_disabled(seeded, api_client, cart_with_items):
    from apps.core.models import StoreSettings, TelegramMessageLog

    settings = StoreSettings.get_settings()
    settings.telegram_enabled = False
    settings.save()

    res = api_client.post(
        "/api/v1/checkout/",
        {
            "full_name": "منير",
            "phone": "0910001111",
            "city": "tripoli",
            "address": "تاجوراء",
            "payment_method": "CASH_ON_DELIVERY",
        },
        format="json",
    )
    assert res.status_code == 201
    assert TelegramMessageLog.objects.filter(order_number=res.json()["number"]).count() == 0


