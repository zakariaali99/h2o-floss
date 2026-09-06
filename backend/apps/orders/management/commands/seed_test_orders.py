"""Create realistic test orders for dashboard testing — WITHOUT sending any
Telegram/WhatsApp notifications (orders are written straight to the DB, bypassing
the checkout service that dispatches messages).

Usage:
    python manage.py seed_test_orders            # 10 orders
    python manage.py seed_test_orders 25         # 25 orders
    python manage.py seed_test_orders --clear     # delete previous test orders first
"""

from __future__ import annotations

import datetime
import random
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.catalog.models import Product
from apps.orders.models import Client, Order, OrderItem

TEST_NOTE = "طلب تجريبي للاختبار"

NAMES = [
    "محمد الأسود", "فاطمة القذافي", "أحمد الفيتوري", "سارة بن عمر", "خالد الشريف",
    "نورا المبروك", "عمر الدرسي", "ليلى العبيدي", "يوسف الطرابلسي", "هالة الزنتاني",
    "إبراهيم الورفلي", "مريم المصراتي", "علي البركي", "زينب الساعدي", "طارق المقري",
]

# (city code, a plausible address in that city)
CITIES = [
    ("tripoli", "طرابلس - حي الأندلس، شارع الجمهورية"),
    ("benghazi", "بنغازي - شارع جمال عبدالناصر"),
    ("misrata", "مصراتة - المنطقة الحرة"),
    ("zawiya", "الزاوية - وسط المدينة"),
    ("sabha", "سبها - حي المنشية"),
    ("tobruk", "طبرق - شارع النصر"),
    ("bayda", "البيضاء - حي الوحدة"),
    ("khoms", "الخمس - شارع المدرسة"),
    ("zliten", "زليتن - قرب السوق القديم"),
]

PAYMENTS = ["CASH_ON_DELIVERY", "BANK_TRANSFER"]
# weighted toward PENDING so there are plenty of "new" orders to test with
STATUSES = ["PENDING", "PENDING", "PENDING", "APPROVED", "APPROVED", "COMPLETED", "REJECTED"]


class Command(BaseCommand):
    help = "Seed N realistic test orders for the dashboard (no notifications sent)."

    def add_arguments(self, parser):
        parser.add_argument("count", nargs="?", type=int, default=10, help="How many orders (default 10).")
        parser.add_argument("--clear", action="store_true", help="Delete existing test orders first.")

    def handle(self, *args, **options):
        count = max(1, options["count"])
        device = Product.objects.filter(kind="DEVICE", is_active=True).first()
        parts = list(Product.objects.filter(is_active=True).exclude(kind="DEVICE")[:6])

        if device is None:
            self.stderr.write(self.style.ERROR("No active DEVICE product found — run `seed_store` first."))
            return

        if options["clear"]:
            deleted, _ = Order.objects.filter(note=TEST_NOTE).delete()
            self.stdout.write(self.style.WARNING(f"Cleared {deleted} previous test order rows."))

        created = []
        for i in range(count):
            name = random.choice(NAMES)
            phone = f"09{random.randint(10, 29)}{random.randint(100000, 999999)}"
            city, address = random.choice(CITIES)
            payment = random.choice(PAYMENTS)
            status = random.choice(STATUSES)

            # 1 device, sometimes plus a part or two
            lines = [(device, random.randint(1, 2))]
            if parts and random.random() < 0.4:
                lines.append((random.choice(parts), random.randint(1, 3)))

            client, _ = Client.objects.update_or_create(phone=phone, defaults={"name": name, "city": city})
            subtotal = sum((p.price * q for p, q in lines), Decimal("0.00"))

            order = Order.objects.create(
                client=client,
                full_name=name,
                phone=phone,
                email="",
                city=city,
                address=address,
                note=TEST_NOTE,
                payment_method=payment,
                status=status,
                # new (PENDING) orders arrive unseen; older ones are already handled
                is_seen=status != "PENDING",
                subtotal=subtotal,
                shipping=Decimal("0.00"),
                total=subtotal,
            )
            OrderItem.objects.bulk_create(
                OrderItem(order=order, product=p, product_name=p.name, unit_price=p.price, quantity=q, line_total=p.price * q)
                for p, q in lines
            )
            # Backdate non-pending orders so the list looks organic.
            if status != "PENDING":
                Order.objects.filter(pk=order.pk).update(
                    created_at=timezone.now() - datetime.timedelta(days=random.randint(1, 20))
                )
            created.append(order.number)

        self.stdout.write(self.style.SUCCESS(f"Created {len(created)} test orders (no notifications sent):"))
        for number in created:
            self.stdout.write(f"  - {number}")
        self.stdout.write(f"Total orders now: {Order.objects.count()}")
