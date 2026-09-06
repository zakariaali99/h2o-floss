"""Abstract base models."""

from django.db import models


class TimeStampedModel(models.Model):
    """Adds created/updated bookkeeping. Mixed into catalog and order models."""

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        get_latest_by = "created_at"


class StoreSettings(TimeStampedModel):
    """Store, WhatsApp, and Bank account configuration."""

    store_whatsapp = models.CharField(
        max_length=32,
        default="218910000000",
        help_text="رقم واتساب المتجر الرسمي المعتمد للتواصل مع الزبائن",
    )
    manager_phones = models.TextField(
        default="218910000000",
        help_text="أرقام هواتف المدراء لمتابعة الطلبات (مفصولة بفواصل)",
    )
    whatsapp_auto_send = models.BooleanField(
        default=True,
        help_text="إرسال الفاتورة والإشعارات تلقائياً للزبون والإدارة فور تسجيل الطلب",
    )
    whatsapp_gateway_url = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="رابط Webhook أو بوابة الواتساب API الخارجية (اختياري)",
    )
    whatsapp_gateway_token = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="مفتاح API Token للبوابة (اختياري)",
    )
    bank_name = models.CharField(
        max_length=120,
        default="مصرف الجمهورية",
        blank=True,
        help_text="اسم المصرف للحوالات المصرفية",
    )
    bank_account_holder = models.CharField(
        max_length=120,
        default="متجر H2O Floss ليبيا",
        blank=True,
        help_text="اسم صاحب الحساب أو المستفيد",
    )
    bank_account_number = models.CharField(
        max_length=64,
        default="001-123456-001",
        blank=True,
        help_text="رقم الحساب المصرفي",
    )
    bank_iban = models.CharField(
        max_length=64,
        default="LY00001001123456001",
        blank=True,
        help_text="رقم الآيبان (IBAN)",
    )

    # --- Telegram manager notifications (works on shared hosting) ---
    telegram_enabled = models.BooleanField(
        default=False,
        help_text="إرسال إشعار بكل طلب جديد إلى المدير عبر تيليجرام",
    )
    telegram_bot_token = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="توكن بوت تيليجرام (يُنشأ من BotFather)",
    )
    telegram_chat_ids = models.TextField(
        blank=True,
        default="",
        help_text="معرّفات المحادثة (Chat ID) للمدراء، مفصولة بفواصل",
    )

    class Meta:
        verbose_name = "إعدادات المتجر والإشعارات"
        verbose_name_plural = "إعدادات المتجر والإشعارات"

    @classmethod
    def get_settings(cls) -> "StoreSettings":
        obj, _ = cls.objects.get_or_create(id=1)
        return obj


class WhatsAppMessageLog(TimeStampedModel):
    """Tracks every automated WhatsApp message sent by the system."""

    RECIPIENT_CUSTOMER = "CUSTOMER"
    RECIPIENT_STORE = "STORE"
    RECIPIENT_MANAGER = "MANAGER"
    RECIPIENT_CHOICES = (
        (RECIPIENT_CUSTOMER, "الزبون"),
        (RECIPIENT_STORE, "المتجر"),
        (RECIPIENT_MANAGER, "المدير"),
    )

    STATUS_SENT = "SENT"
    STATUS_FAILED = "FAILED"
    STATUS_CHOICES = (
        (STATUS_SENT, "تم الإرسال تلقائياً"),
        (STATUS_FAILED, "فشل الإرسال"),
    )

    order_number = models.CharField(max_length=32, db_index=True)
    recipient_type = models.CharField(max_length=16, choices=RECIPIENT_CHOICES)
    recipient_phone = models.CharField(max_length=32)
    message_text = models.TextField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_SENT)
    response_payload = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "سجل رسائل الواتساب التلقائية"
        verbose_name_plural = "سجلات رسائل الواتساب التلقائية"
        ordering = ("-created_at",)


class TelegramMessageLog(TimeStampedModel):
    """Tracks every automated Telegram manager notification sent by the system."""

    STATUS_SENT = "SENT"
    STATUS_FAILED = "FAILED"
    STATUS_CHOICES = (
        (STATUS_SENT, "تم الإرسال"),
        (STATUS_FAILED, "فشل الإرسال"),
    )

    order_number = models.CharField(max_length=32, db_index=True)
    chat_id = models.CharField(max_length=64)
    message_text = models.TextField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_SENT)
    response_payload = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "سجل رسائل تيليجرام"
        verbose_name_plural = "سجلات رسائل تيليجرام"
        ordering = ("-created_at",)

