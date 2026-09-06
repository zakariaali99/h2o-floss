"""Seed the store catalog (plan §4, §7) — idempotent by design.

Every object is keyed by a fixed slug or file name and updated in place, so
running ``python manage.py seed_store`` twice leaves the same rows, relations
and media files behind. Reference media is copied — never moved — from
``reference/docStore/media/products``, with the file assignment taken from the
reference database (…34.jpeg was the device's main image, the other three its
gallery).
"""

from __future__ import annotations

import shutil
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.catalog.models import Category, Product, ProductImage

#: reference/docStore/media/products — read-only source of the real photos.
REFERENCE_MEDIA_DIR = (
    Path(settings.BASE_DIR).parent.parent / "reference" / "docStore" / "media" / "products"
)

#: (ascii name under MEDIA_ROOT/products/, original reference file)
DEVICE_PHOTOS = [
    ("h2ofloss-device-main.jpg", "WhatsApp_Image_2026-01-04_at_20.19.34.jpeg"),
    ("h2ofloss-device-1.jpg", "WhatsApp_Image_2026-01-04_at_20.19.33_3.jpeg"),
    ("h2ofloss-device-2.jpg", "WhatsApp_Image_2026-01-04_at_20.19.33_2.jpeg"),
    ("h2ofloss-device-3.jpg", "WhatsApp_Image_2026-01-04_at_20.19.32.jpeg"),
]

DEVICE_DESCRIPTION = (
    "<p>وداعاً للبلاك وجزيئات الطعام! يستخدم جهاز H2Ofloss تياراً من الماء بضغط 140 PSI "
    "و1300 نبضة في الدقيقة لإزالة البلاك والبقايا العالقة بين الأسنان وتحت خط اللثة — "
    "أماكن لا تصل إليها فرشاة الأسنان.</p>"
    "<ul>"
    "<li>5 أوضاع و6 أنواع من الفوهات لتناسب كل الاحتياجات</li>"
    "<li>مقاوم للماء بمعيار IPX7 وآمن للاستخدام في الحمام</li>"
    "<li>يزيل 99.99% من بقع الطعام والبلاك</li>"
    "<li>فوهة تدور 360 درجة وتصميم مريح مانع للانزلاق</li>"
    "</ul>"
)

CATEGORIES = [
    # (slug, name, is_parts_group, order)
    ("water-flossers", "أجهزة الخيط المائي", False, 0),
    ("nozzle-heads", "رؤوس بديلة", True, 1),
    ("spare-parts", "قطع غيار", True, 2),
    ("charging", "الشحن", True, 3),
    ("mounting", "التثبيت", True, 4),
    ("travel", "التنقل", True, 5),
    ("kits", "أطقم", True, 6),
]

# (slug, name, category slug, price, stock, specs, is_featured)
PARTS = [
    (
        "nozzle-set-6", "طقم رؤوس بديلة (6 قطع)", "nozzle-heads", Decimal("45.00"), 40,
        {"العدد": "6 رؤوس", "الأنواع": "كلاسيكي، تقويم، لثوية، منظف لسان، فرشاة، صغيرة"}, True,
    ),
    (
        "water-tank-300", "خزان مياه احتياطي 300 مل", "spare-parts", Decimal("35.00"), 30,
        {"السعة": "300 مل", "النوع": "خزان أصلي بديل"}, False,
    ),
    (
        "usb-charging-cable", "كابل شحن USB", "charging", Decimal("15.00"), 50,
        {"النوع": "USB", "الوظيفة": "شحن بطارية الجهاز 2500 mAh"}, False,
    ),
    (
        "magnetic-stand", "قاعدة/حامل مغناطيسي", "mounting", Decimal("30.00"), 25,
        {"التثبيت": "مغناطيسي للحائط أو المرآة"}, False,
    ),
    (
        "travel-case", "حقيبة سفر مبطنة", "travel", Decimal("40.00"), 20,
        {"المادة": "قماش مبطن", "الاستخدام": "حماية الجهاز والفوهات أثناء التنقل"}, False,
    ),
    (
        "battery-2500mah", "بطارية 2500 mAh", "spare-parts", Decimal("55.00"), 15,
        {"السعة": "2500 mAh", "النوع": "بطارية قابلة للشحن"}, False,
    ),
]

PART_DESCRIPTION = "<p>قطعة أصلية متوافقة مع جهاز H2O Floss — تُشحن مع جميع الطلبات داخل ليبيا مجاناً.</p>"


class Command(BaseCommand):
    help = "Seed the catalog: hero device + 6 parts + family kit, copying reference media."

    def handle(self, *args, **options):
        photos = self._copy_reference_media()
        categories = self._seed_categories()
        device = self._seed_device(categories["water-flossers"], photos)
        parts = self._seed_parts(categories, device)
        self._seed_kit(categories["kits"], device, parts)
        device_count = Product.objects.count()
        parts_count = Product.objects.parts().count()
        kits_count = Product.objects.filter(kind=Product.Kind.KIT).count()
        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded: {device_count} products ({Product.objects.devices().count()} device, "
                f"{parts_count} parts, {kits_count} kits), "
                f"{Category.objects.count()} categories, "
                f"{ProductImage.objects.count()} gallery images."
            )
        )

    # ------------------------------------------------------------------ helpers

    def _copy_reference_media(self) -> dict[str, str]:
        """Copy the four real product photos into MEDIA_ROOT/products (idempotent).

        The destination is checked first: seeded media is git-ignored, so a checkout
        that already has the photos must not fail just because ``reference/`` — which
        lives outside this repo — is absent.
        """
        products_dir = Path(settings.MEDIA_ROOT) / "products"
        products_dir.mkdir(parents=True, exist_ok=True)
        photos: dict[str, str] = {}
        for ascii_name, original in DEVICE_PHOTOS:
            destination = products_dir / ascii_name
            if not destination.exists():
                source = REFERENCE_MEDIA_DIR / original
                if not source.exists():
                    raise CommandError(
                        f"صورة المرجع مفقودة: {source}\n"
                        f"ضع {ascii_name} في {products_dir} أو توفّر مجلد reference/ بجانب المستودع."
                    )
                shutil.copy2(source, destination)
            photos[ascii_name] = f"products/{ascii_name}"
        return photos

    def _seed_categories(self) -> dict[str, Category]:
        categories: dict[str, Category] = {}
        for slug, name, is_parts_group, order in CATEGORIES:
            categories[slug], _ = Category.objects.update_or_create(
                slug=slug,
                defaults={"name": name, "is_parts_group": is_parts_group, "order": order},
            )
        return categories

    def _seed_device(self, category: Category, photos: dict[str, str]) -> Product:
        device, _ = Product.objects.update_or_create(
            slug="h2o-floss",  # matches the storefront nav link /product/h2o-floss
            defaults=dict(
                kind=Product.Kind.DEVICE,
                hero=True,
                category=category,
                name="جهاز الخيط المائي الاحترافي H2Ofloss",
                tagline="نظافة فائقة ولثة صحية في دقائق — 5 أوضاع و6 فوهات.",
                description=DEVICE_DESCRIPTION,
                price=Decimal("225.00"),
                currency="LYD",
                stock_quantity=25,
                specifications={
                    "الخزان": "300 مل",
                    "الأوضاع": "5",
                    "مقاومة الماء": "IPX7",
                    "البطارية": "2500 mAh",
                    "الضغط": "140 PSI",
                    "النبضات": "1300/دقيقة",
                },
                main_image=photos["h2ofloss-device-main.jpg"],
                order=0,
                is_active=True,
                is_featured=True,
                badge=Product.Badge.HOT,
                warranty_months=24,
            ),
        )
        for index, ascii_name in enumerate(
            ("h2ofloss-device-1.jpg", "h2ofloss-device-2.jpg", "h2ofloss-device-3.jpg"), start=1
        ):
            ProductImage.objects.update_or_create(
                product=device,
                image=photos[ascii_name],
                defaults={"order": index, "is_feature": index == 1, "caption": ""},
            )
        return device

    def _seed_parts(self, categories: dict[str, Category], device: Product) -> dict[str, Product]:
        parts: dict[str, Product] = {}
        for order, (slug, name, category_slug, price, stock, specs, featured) in enumerate(PARTS, start=1):
            part, _ = Product.objects.update_or_create(
                slug=slug,
                defaults=dict(
                    kind=Product.Kind.PART,
                    category=categories[category_slug],
                    name=name,
                    description=PART_DESCRIPTION,
                    price=price,
                    currency="LYD",
                    stock_quantity=stock,
                    specifications=specs,
                    order=order,
                    is_active=True,
                    is_featured=featured,
                    warranty_months=6,
                ),
            )
            part.devices.set([device])
            parts[slug] = part
        return parts

    def _seed_kit(self, category: Category, device: Product, parts: dict[str, Product]) -> Product:
        kit, _ = Product.objects.update_or_create(
            slug="family-kit",
            defaults=dict(
                kind=Product.Kind.KIT,
                category=category,
                name="طقم العائلة — الجهاز + 6 فوهات + حقيبة سفر",
                tagline="كل ما تحتاجه العائلة في صندوق واحد وبسعر مخفض.",
                description=(
                    "<p>طقم العائلة يجمع جهاز H2O Floss الاحترافي مع طقم الرؤوس البديلة الست "
                    "وحقيبة السفر المبطنة — بسعر أقل من شرائها منفردة.</p>"
                    "<ul><li>1 × جهاز H2O Floss</li><li>1 × طقم رؤوس بديلة (6 قطع)</li>"
                    "<li>1 × حقيبة سفر مبطنة</li></ul>"
                ),
                price=Decimal("289.00"),
                old_price=Decimal("310.00"),  # 225 + 45 + 40 bought separately
                currency="LYD",
                stock_quantity=10,
                order=7,
                is_active=True,
                is_featured=True,
                badge=Product.Badge.NEW,
                warranty_months=24,
            ),
        )
        kit.kit_contents.set([device, parts["nozzle-set-6"], parts["travel-case"]])
        return kit
