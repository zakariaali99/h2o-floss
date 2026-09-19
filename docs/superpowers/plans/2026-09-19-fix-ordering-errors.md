# خطة تنفيذ إصلاح أخطاء عملية الطلب

> **لمنفذي الخطة:** REQUIRED SUB-SKILL: استخدم `superpowers:subagent-driven-development` (موصى به) أو `superpowers:executing-plans` لتنفيذ الخطة مهمةً بعد مهمة. جميع خطوات المتابعة تستخدم مربعات اختيار.

**الهدف:** تأمين قراءة الطلبات، منع أعطال وخصم المخزون المكرر، إخراج الإشعارات الخارجية من طلب الشراء، وضمان تشغيل الخادم بإصدارات Python وDjango الصحيحة.

**البنية:** يبقى مسار الشراء الحالي قائماً، لكن تُشدَّد حدود الإدخال ويُقفل سجل الطلب والمنتجات أثناء انتقال الحالة. يصبح الوصول العام إلى الطلب مشروطاً برقم الطلب ورقم الهاتف معاً، وتُنقل الإشعارات إلى صندوق صادر في قاعدة البيانات تعالجه مهمة تشغيل منفصلة بعد حفظ الطلب. تضاف كذلك حراسة مبكرة لإصدارات وقت التشغيل حتى يكون فشل البيئة واضحاً قبل تحميل النماذج.

**التقنيات:** Python 3.12، Django 5.2، Django REST Framework 3.16، pytest/pytest-django، React 19، TypeScript، React Router، TanStack Query.

**المواصفة:** [`plans/H2o-floss-plan.md`](../../../plans/H2o-floss-plan.md)، مع نتائج تدقيق عملية الطلب بتاريخ 2026-09-19 الموثقة داخل هذه الخطة.

## القيود العامة

- لا تُعرَض بيانات طلب عام إلا عند تطابق رقم الطلب ورقم الهاتف المطبّع معاً.
- يجب ألا ينتج عن تكرار المنتج أو تكرار طلب الموافقة خصم مخزون مرتين أو خطأ HTTP 500.
- كل انتقال حالة يُقيّم بعد قفل سجل الطلب وإعادة قراءة حالته من قاعدة البيانات.
- لا تُنفَّذ اتصالات Telegram أو WhatsApp داخل معاملة إنشاء الطلب أو داخل استجابة checkout.
- لا تُضاف مكتبة طابور خارجية؛ يُستخدم صندوق صادر في قاعدة البيانات وأمر إدارة ملائم للاستضافة المشتركة.
- يعتمد التشغيل على Python 3.12 وDjango 5.2.x كما يحدد المشروع، مع رسالة فشل مبكرة وواضحة عند المخالفة.
- تبقى رسائل الواجهة الموجهة للمستخدم باللغة العربية، ولا توضع أرقام الهاتف أو بيانات العميل في عنوان URL.
- تُكتب الاختبارات الفاشلة أولاً، ثم أقل تنفيذ ينجحها، ويُشغّل الاختبار المحدد قبل مجموعة الاختبارات الكاملة.

---

## خريطة الملفات والمسؤوليات

### ملفات ستُعدّل

- `backend/apps/orders/serializers.py` — رفض تكرار المنتج في حمولة checkout والتحقق من عناصر الطلب.
- `backend/apps/orders/services.py` — إنشاء الطلب وصندوق الإشعارات من دون اتصال خارجي.
- `backend/apps/orders/models.py` — قفل انتقال الحالة وتجميع الكميات حسب المنتج ونموذج مهمة الإشعار.
- `backend/apps/orders/views.py` — فرض رقم الطلب ورقم الهاتف معاً في lookup.
- `backend/apps/orders/admin.py` — عرض حالة مهام الإشعارات للمدير عند الحاجة من دون إرسالها يدوياً.
- `backend/apps/orders/migrations/` — إضافة جدول صندوق الإشعارات وقيد يمنع تكرار المنتج داخل الطلب.
- `backend/tests/test_orders_api.py` — اختبارات checkout الآمن وlookup المقيد.
- `backend/tests/test_order_lifecycle.py` — اختبارات النسخ القديمة للحالة وتجميع المخزون.
- `frontend/src/api/orders.ts` — جعل وسيطَي lookup إلزاميين.
- `frontend/src/pages/Checkout.tsx` — تمرير نتيجة checkout إلى صفحة النجاح داخل حالة التنقل.
- `frontend/src/pages/OrderSuccess.tsx` — استخدام نتيجة checkout أو طلب الهاتف قبل جلب التفاصيل.
- `frontend/src/pages/TrackOrder.tsx` — طلب رقم الطلب والهاتف معاً وتمرير النتيجة بأمان.
- `backend/manage.py` و`backend/config/asgi.py` و`backend/config/wsgi.py` — فحص وقت التشغيل قبل إعداد Django.
- `backend/README.md` و`plans/deployment-plan.md` — توثيق أوامر البيئة الصحيحة وتشغيل عامل صندوق الإشعارات.

### ملفات ستُنشأ

- `backend/apps/orders/notifications.py` — تنفيذ إرسال إشعارات طلب محفوظ فقط.
- `backend/apps/orders/management/commands/dispatch_order_notifications.py` — معالجة مهام الصندوق خارج طلب HTTP.
- `backend/apps/orders/migrations/0004_merge_duplicate_order_items_and_constraint.py` — دمج أي بيانات قديمة مكررة ثم منع تكرار المنتج داخل الطلب.
- `backend/apps/orders/migrations/0005_order_notification_job.py` — مخطط صندوق الإشعارات.
- `backend/tests/test_order_notifications.py` — اختبارات عدم الإرسال أثناء checkout ومعالجة الصندوق.
- `backend/apps/core/runtime.py` — التحقق المركزي من Python وDjango.
- `backend/tests/test_runtime.py` — اختبارات رسائل عدم توافق البيئة.
- `backend/.python-version` — تثبيت الإصدار `3.12` لأدوات إدارة الإصدارات.

---

### المهمة 1: منع تكرار المنتج وخصم المخزون المكرر

**الملفات:**

- تعديل: `backend/apps/orders/serializers.py`
- تعديل: `backend/apps/orders/models.py`
- إنشاء: `backend/apps/orders/migrations/0004_merge_duplicate_order_items_and_constraint.py`
- اختبار: `backend/tests/test_orders_api.py`
- اختبار: `backend/tests/test_order_lifecycle.py`

**الواجهات:**

- يستهلك: `CheckoutSerializer.items` و`Order.transition_to(new_status: str) -> None`.
- ينتج: حمولة checkout ذات `product_id` فريد، وقيد قاعدة بيانات `UniqueConstraint(order, product)`، وانتقال حالة يعيد القراءة تحت القفل ويجمع كمية كل منتج قبل الخصم.

- [ ] **الخطوة 1: إضافة اختبار API يفشل عند تكرار المنتج**

أضف إلى `backend/tests/test_orders_api.py`:

```python
@pytest.mark.django_db
def test_checkout_rejects_duplicate_product_lines(seeded, api_client):
    product = Product.objects.get(slug="h2o-floss")
    response = checkout(
        api_client,
        items=[
            {"product_id": product.pk, "quantity": 1},
            {"product_id": product.pk, "quantity": 1},
        ],
    )

    assert response.status_code == 400
    assert Order.objects.count() == 0
    assert "items" in response.json()["fields"]
```

- [ ] **الخطوة 2: إضافة اختبار يمنع اعتماد نسخة قديمة من حالة الطلب**

أضف إلى `backend/tests/test_order_lifecycle.py`:

```python
@pytest.mark.django_db
def test_stale_order_instance_cannot_approve_twice(order, device):
    first_reader = Order.objects.get(pk=order.pk)
    stale_reader = Order.objects.get(pk=order.pk)

    first_reader.transition_to(ORDER_STATUS_APPROVED)
    with pytest.raises(ValidationError):
        stale_reader.transition_to(ORDER_STATUS_APPROVED)

    assert stock_of(device) == SEEDED_DEVICE_STOCK - 2
```

- [ ] **الخطوة 3: تشغيل الاختبارين والتأكد من فشلهما للأسباب الصحيحة**

شغّل:

```bash
cd backend
.venv/bin/pytest tests/test_orders_api.py::test_checkout_rejects_duplicate_product_lines tests/test_order_lifecycle.py::test_stale_order_instance_cannot_approve_twice -v
```

المتوقع: يقبل checkout السطرين المكررين، وتخصم النسخة القديمة المخزون مرة ثانية بدلاً من رفع `ValidationError`.

- [ ] **الخطوة 4: رفض المنتج المكرر عند حد الإدخال**

أضف إلى `CheckoutSerializer`:

```python
def validate_items(self, items: list[dict]) -> list[dict]:
    product_ids = [line["product_id"] for line in items]
    if len(product_ids) != len(set(product_ids)):
        raise serializers.ValidationError("لا يمكن تكرار المنتج نفسه في الطلب.")
    return items
```

لا تعتمد على الواجهة لمنع التكرار؛ endpoint عام ويمكن استدعاؤه مباشرة.

- [ ] **الخطوة 5: قفل سجل الطلب وإعادة قراءة الحالة قبل التحقق**

أعد بناء `Order.transition_to` وفق هذا الهيكل:

```python
def transition_to(self, new_status: str) -> None:
    with transaction.atomic():
        locked_order = type(self).objects.select_for_update().get(pk=self.pk)
        locked_order._validate_transition(new_status)
        if new_status == ORDER_STATUS_APPROVED:
            locked_order._reserve_stock()
        elif new_status == ORDER_STATUS_REJECTED and locked_order.status == ORDER_STATUS_APPROVED:
            locked_order._release_stock()
        locked_order.status = new_status
        locked_order.save(update_fields=["status", "updated_at"])
        self.status = locked_order.status
        self.updated_at = locked_order.updated_at
```

انقل فحص `ORDER_STATUS_TRANSITIONS` الحالي إلى `_validate_transition`، واستخدم حالة `locked_order` فقط، لا حالة النسخة التي استدعت الدالة.

- [ ] **الخطوة 6: تجميع الكميات وقفل المنتجات صراحةً**

داخل `_reserve_stock` اجمع الأسطر أولاً ثم اقفل المنتجات:

```python
requested_quantities: dict[int, int] = {}
for line in self.items.all():
    requested_quantities[line.product_id] = (
        requested_quantities.get(line.product_id, 0) + line.quantity
    )

products = {
    product.pk: product
    for product in Product.objects.select_for_update().filter(
        pk__in=requested_quantities
    )
}
for product_id, quantity in requested_quantities.items():
    product = products[product_id]
    if product.stock_quantity is not None and product.stock_quantity < quantity:
        raise ValidationError(
            _("«%(name)s»: المخزون الحالي لا يكفي للكمية المطلوبة.")
            % {"name": product.name},
            code="insufficient_stock",
        )
for product_id, quantity in requested_quantities.items():
    if products[product_id].stock_quantity is not None:
        Product.objects.filter(pk=product_id).update(
            stock_quantity=F("stock_quantity") - quantity
        )
```

طبّق التجميع نفسه في `_release_stock` حتى تُعاد الكمية نفسها بالضبط.

- [ ] **الخطوة 7: إضافة قيد قاعدة البيانات**

أضف إلى `OrderItem.Meta`:

```python
constraints = [
    models.UniqueConstraint(
        fields=["order", "product"],
        name="orders_one_line_per_product",
    )
]
```

أنشئ migration بيانات تسبق `AddConstraint` وتدمج أي صفوف قديمة مكررة من دون تغيير إجمالي الطلب:

```python
def merge_duplicate_order_items(apps, schema_editor):
    OrderItem = apps.get_model("orders", "OrderItem")
    duplicates = (
        OrderItem.objects.values("order_id", "product_id")
        .annotate(
            row_count=models.Count("id"),
            total_quantity=models.Sum("quantity"),
            total_value=models.Sum("line_total"),
        )
        .filter(row_count__gt=1)
    )
    for duplicate in duplicates:
        rows = OrderItem.objects.filter(
            order_id=duplicate["order_id"],
            product_id=duplicate["product_id"],
        ).order_by("id")
        keeper = rows.first()
        keeper.quantity = duplicate["total_quantity"]
        keeper.line_total = duplicate["total_value"]
        keeper.save(update_fields=["quantity", "line_total"])
        rows.exclude(pk=keeper.pk).delete()
```

استورد `models` مع `migrations` من `django.db` داخل ملف migration، وأضف `migrations.RunPython(merge_duplicate_order_items, migrations.RunPython.noop)` قبل `migrations.AddConstraint`. أنشئ الهيكل أولاً بالأمر التالي ثم ضع عملية الدمج قبل عملية القيد المولدة:

```bash
cd backend
.venv/bin/python manage.py makemigrations orders --name merge_duplicate_order_items_and_constraint
.venv/bin/python manage.py migrate
.venv/bin/python manage.py makemigrations --check
```

- [ ] **الخطوة 8: تشغيل اختبارات الطلب والمخزون**

```bash
cd backend
.venv/bin/pytest tests/test_orders_api.py tests/test_order_lifecycle.py -v
```

المتوقع: نجاح الاختبارات، ورفض التكرار بـ400، وعدم خصم النسخة القديمة للمخزون.

- [ ] **الخطوة 9: حفظ المهمة في commit مستقل**

```bash
git add backend/apps/orders/serializers.py backend/apps/orders/models.py backend/apps/orders/migrations backend/tests/test_orders_api.py backend/tests/test_order_lifecycle.py
git commit -m "fix: make order stock transitions idempotent"
```

---

### المهمة 2: منع كشف بيانات الطلبات العامة

**الملفات:**

- تعديل: `backend/apps/orders/views.py`
- تعديل: `backend/tests/test_orders_api.py`
- تعديل: `frontend/src/api/orders.ts`
- تعديل: `frontend/src/pages/Checkout.tsx`
- تعديل: `frontend/src/pages/OrderSuccess.tsx`
- تعديل: `frontend/src/pages/TrackOrder.tsx`

**الواجهات:**

- يستهلك: استجابة `POST /api/v1/checkout/` الحالية من نوع `OrderData`.
- ينتج: `lookupOrder(number: string, phone: string): Promise<OrderData>`؛ endpoint لا يجيب إلا عند وجود القيمتين وتطابقهما.

- [ ] **الخطوة 1: تعديل اختبارات lookup لتعريف العقد الأمني الجديد**

استبدل اختبار البحث المرن باختبار واضح:

```python
@pytest.mark.django_db
def test_order_lookup_requires_matching_number_and_phone(seeded, api_client, cart_with_items):
    number = checkout(api_client).json()["number"]

    missing_phone = api_client.get(f"/api/v1/orders/lookup/?number={number}")
    missing_number = api_client.get("/api/v1/orders/lookup/?phone=0914076123")
    wrong_phone = api_client.get(
        f"/api/v1/orders/lookup/?number={number}&phone=0999999999"
    )
    found = api_client.get(
        f"/api/v1/orders/lookup/?number={number}&phone=0914076123"
    )

    assert missing_phone.status_code == 400
    assert missing_number.status_code == 400
    assert wrong_phone.status_code == 404
    assert found.status_code == 200
    assert found.json()["number"] == number
```

- [ ] **الخطوة 2: تشغيل الاختبار والتأكد من أنه يفشل**

```bash
cd backend
.venv/bin/pytest tests/test_orders_api.py::test_order_lookup_requires_matching_number_and_phone -v
```

المتوقع: الطلب الذي يحتوي رقم الطلب وحده أو الهاتف وحده يرجع 200 حالياً.

- [ ] **الخطوة 3: فرض الحقلين في الخادم**

بسّط `OrderLookupView.get` إلى العقد التالي:

```python
number = (request.query_params.get("number") or "").strip().upper()
phone = (request.query_params.get("phone") or "").strip()
if not number or not phone:
    raise ValidationError(
        {"detail": "رقم الطلب ورقم الهاتف مطلوبان لتتبع الطلب."}
    )

try:
    normalized_phone = validate_libyan_phone(phone)
except DjangoValidationError as exc:
    raise ValidationError({"phone": exc.messages}) from exc

order = (
    Order.objects.filter(number=number, phone=normalized_phone)
    .prefetch_related("items")
    .first()
)
if order is None:
    raise NotFound("لا يوجد طلب مطابق لهذه البيانات.")
return Response(OrderSerializer(order).data)
```

لا تُرجع استجابة مختلفة بين رقم غير موجود وهاتف غير مطابق.

- [ ] **الخطوة 4: جعل واجهة API في TypeScript تتطلب القيمتين**

في `frontend/src/api/orders.ts`:

```typescript
lookupOrder: async (number: string, phone: string): Promise<OrderData> => {
  const params = new URLSearchParams({ number, phone })
  return api.get<OrderData>(`/orders/lookup/?${params.toString()}`)
},
```

- [ ] **الخطوة 5: تمرير الطلب المكتمل داخل حالة التنقل**

في `Checkout.tsx`، استبدل التنقل الحالي بـ:

```typescript
const order = await ordersApi.submitCheckout(payload)
clearCart()
navigate(`/order/${order.number}`, {
  replace: true,
  state: { order },
})
```

هذا يمنع الحاجة إلى وضع الهاتف في URL بعد نجاح checkout.

- [ ] **الخطوة 6: حماية صفحة نجاح الطلب**

في `OrderSuccess.tsx`:

```typescript
const location = useLocation()
const navigationOrder = (location.state as { order?: OrderData } | null)?.order
const [phone, setPhone] = useState(navigationOrder?.phone ?? '')
const [lookupEnabled, setLookupEnabled] = useState(Boolean(navigationOrder))

const { data: fetchedOrder, isError } = useQuery({
  queryKey: ['order-success', number, phone],
  queryFn: () => ordersApi.lookupOrder(number, phone),
  enabled: lookupEnabled && Boolean(number) && Boolean(phone),
  retry: false,
  initialData: navigationOrder,
})
const order = fetchedOrder ?? navigationOrder
```

إذا لم يصل `navigationOrder` — مثل فتح الرابط مباشرة أو تحديث الصفحة — اعرض نموذج هاتف قصيراً. زر النموذج يضبط `lookupEnabled` فقط بعد تطابق الهاتف مع صيغة `09XXXXXXXX`. لا تعرض الاسم أو العنوان أو المنتجات قبل نجاح lookup.

- [ ] **الخطوة 7: جعل صفحة التتبع تطلب رقم الطلب والهاتف معاً**

حدّث شرط `executeLookup` والنصوص:

```typescript
if (!p.trim() || !n.trim()) {
  setErrorMsg('يرجى إدخال رقم الطلب ورقم الهاتف المسجل معاً.')
  return
}
const data = await ordersApi.lookupOrder(n.trim(), p.trim())
```

وعند الانتقال إلى صفحة التفاصيل، مرر الطلب في `state`:

```tsx
<Link to={`/order/${orderResult.number}`} state={{ order: orderResult }}>
  عرض تفاصيل الطلب
</Link>
```

- [ ] **الخطوة 8: تشغيل اختبارات الخادم وفحص TypeScript**

```bash
cd backend
.venv/bin/pytest tests/test_orders_api.py -v
cd ../frontend
npm run typecheck
```

المتوقع: نجاح الاختبارات وفحص الأنواع، وعدم وجود أي استدعاء `lookupOrder` بمعامل واحد.

- [ ] **الخطوة 9: فحص يدوي لمسارات الخصوصية**

تحقق من الحالات التالية في المتصفح:

1. checkout ناجح يعرض الطلب فوراً من `navigation state`.
2. تحديث صفحة النجاح يطلب الهاتف ولا يعرض بيانات قبل التحقق.
3. رقم صحيح وهاتف خطأ يعرض رسالة عامة فقط.
4. صفحة التتبع لا ترسل البحث قبل إدخال القيمتين.
5. لا يظهر رقم الهاتف في عنوان URL أو سجل التنقل.

- [ ] **الخطوة 10: حفظ المهمة في commit مستقل**

```bash
git add backend/apps/orders/views.py backend/tests/test_orders_api.py frontend/src/api/orders.ts frontend/src/pages/Checkout.tsx frontend/src/pages/OrderSuccess.tsx frontend/src/pages/TrackOrder.tsx
git commit -m "fix: require customer verification for order lookup"
```

---

### المهمة 3: نقل الإشعارات إلى صندوق صادر بعد حفظ الطلب

**الملفات:**

- تعديل: `backend/apps/orders/models.py`
- تعديل: `backend/apps/orders/services.py`
- تعديل: `backend/apps/orders/admin.py`
- إنشاء: `backend/apps/orders/notifications.py`
- إنشاء: `backend/apps/orders/management/commands/dispatch_order_notifications.py`
- إنشاء: `backend/apps/orders/migrations/0005_order_notification_job.py`
- إنشاء: `backend/tests/test_order_notifications.py`
- تعديل: `plans/deployment-plan.md`

**الواجهات:**

- يستهلك: `send_order_telegram_notifications(order)` و`send_automatic_order_notifications(order)`.
- ينتج: `OrderNotificationJob` بحالات `PENDING/PROCESSING/DONE/FAILED`، والدالة `dispatch_order_notifications(order: Order) -> None`، وأمر `dispatch_order_notifications --limit N`.

- [ ] **الخطوة 1: كتابة اختبار يثبت أن checkout لا يتصل بالشبكة**

أنشئ `backend/tests/test_order_notifications.py`:

```python
import pytest
from django.core.management import call_command

from apps.catalog.models import Product
from apps.orders.models import Order, OrderNotificationJob


@pytest.mark.django_db
def test_checkout_queues_notification_without_dispatch(
    seeded, api_client, cart_with_items, monkeypatch
):
    def unexpected_dispatch(order):
        raise AssertionError("checkout must not dispatch external notifications")

    monkeypatch.setattr(
        "apps.orders.notifications.dispatch_order_notifications",
        unexpected_dispatch,
    )
    product = Product.objects.get(slug="h2o-floss")
    response = api_client.post(
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

    assert response.status_code == 201
    order = Order.objects.get(number=response.json()["number"])
    assert order.notification_job.status == OrderNotificationJob.Status.PENDING
```

- [ ] **الخطوة 2: كتابة اختبار لمعالجة المهمة بعد checkout**

```python
@pytest.mark.django_db
def test_dispatch_command_processes_pending_job(order, monkeypatch):
    job = OrderNotificationJob.objects.create(order=order)
    dispatched = []

    monkeypatch.setattr(
        "apps.orders.management.commands.dispatch_order_notifications.dispatch_order_notifications",
        lambda saved_order: dispatched.append(saved_order.pk),
    )
    call_command("dispatch_order_notifications", limit=10)

    job.refresh_from_db()
    assert dispatched == [order.pk]
    assert job.status == OrderNotificationJob.Status.DONE
    assert job.attempts == 1
```

وأضف اختبار الفشل التالي:

```python
@pytest.mark.django_db
def test_dispatch_command_records_unexpected_failure(order, monkeypatch):
    job = OrderNotificationJob.objects.create(order=order)

    def fail_dispatch(saved_order):
        raise RuntimeError("gateway unavailable")

    monkeypatch.setattr(
        "apps.orders.management.commands.dispatch_order_notifications.dispatch_order_notifications",
        fail_dispatch,
    )
    call_command("dispatch_order_notifications", limit=10)

    job.refresh_from_db()
    assert Order.objects.filter(pk=order.pk).exists()
    assert job.status == OrderNotificationJob.Status.FAILED
    assert job.attempts == 1
    assert job.last_error == "gateway unavailable"
```

- [ ] **الخطوة 3: تشغيل الاختبارات والتأكد من فشلها بسبب غياب الصندوق**

```bash
cd backend
.venv/bin/pytest tests/test_order_notifications.py -v
```

المتوقع: فشل import لنموذج `OrderNotificationJob` والأمر الإداري.

- [ ] **الخطوة 4: إضافة نموذج صندوق الإشعارات**

أضف بعد `OrderItem`:

```python
class OrderNotificationJob(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "PENDING", _("بانتظار الإرسال")
        PROCESSING = "PROCESSING", _("قيد الإرسال")
        DONE = "DONE", _("تمت المعالجة")
        FAILED = "FAILED", _("فشل الإرسال")

    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name="notification_job",
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    attempts = models.PositiveSmallIntegerField(default=0)
    last_error = models.TextField(blank=True, default="")
```

- [ ] **الخطوة 5: فصل تنفيذ الإشعارات عن خدمة إنشاء الطلب**

أنشئ `backend/apps/orders/notifications.py`:

```python
import logging

from apps.core.models import StoreSettings

from .models import Order
from .telegram import send_order_telegram_notifications
from .whatsapp import send_automatic_order_notifications

logger = logging.getLogger(__name__)


def dispatch_order_notifications(order: Order) -> None:
    send_order_telegram_notifications(order)
    settings = StoreSettings.get_settings()
    if (settings.whatsapp_gateway_url or "").strip():
        send_automatic_order_notifications(order)
```

لا تلتقط `Exception` هنا؛ الأمر الإداري هو حد الاسترداد الذي يسجل فشل المهمة. دوال النقل الحالية مسؤولة عن تسجيل فشل الشبكة المتوقع في سجلات القناة.

- [ ] **الخطوة 6: إنشاء مهمة الصندوق داخل معاملة checkout**

في `create_order_from_cart`، احذف استدعاء `_dispatch_notifications(order)` والدالة الخاصة القديمة، ثم أضف بعد `bulk_create` وقبل حذف السلة:

```python
OrderNotificationJob.objects.create(order=order)
```

استورد النموذج مع `Order` و`OrderItem`. لا تستخدم `transaction.on_commit` للاتصال الخارجي لأنه ما يزال ينفذ بشكل متزامن داخل طلب HTTP.

- [ ] **الخطوة 7: إنشاء أمر معالجة الصندوق**

نفّذ `dispatch_order_notifications.py` بحيث:

1. يقرأ أقدم مهام `PENDING` أو `FAILED` حتى `--limit`.
2. يقفل كل مهمة في `transaction.atomic()` ويحولها إلى `PROCESSING` ويزيد `attempts`.
3. ينفذ الاتصال خارج معاملة القفل.
4. يحدّثها إلى `DONE` عند النجاح أو `FAILED` مع `last_error` عند الاستثناء.

استخدم التنفيذ التالي، مع إبقاء الاتصال الخارجي خارج معاملة القفل:

```python
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.orders.models import OrderNotificationJob
from apps.orders.notifications import dispatch_order_notifications


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=20)

    def handle(self, *args, **options):
        job_ids = list(
            OrderNotificationJob.objects.filter(
                status__in=[
                    OrderNotificationJob.Status.PENDING,
                    OrderNotificationJob.Status.FAILED,
                ],
                attempts__lt=3,
            )
            .order_by("created_at")
            .values_list("pk", flat=True)[: options["limit"]]
        )
        for job_id in job_ids:
            self._dispatch_job(job_id)

    def _dispatch_job(self, job_id: int) -> None:
        with transaction.atomic():
            job = (
                OrderNotificationJob.objects.select_for_update()
                .select_related("order")
                .get(pk=job_id)
            )
            if job.status not in {
                OrderNotificationJob.Status.PENDING,
                OrderNotificationJob.Status.FAILED,
            }:
                return
            job.status = OrderNotificationJob.Status.PROCESSING
            job.attempts += 1
            job.last_error = ""
            job.save(update_fields=["status", "attempts", "last_error", "updated_at"])

        try:
            dispatch_order_notifications(job.order)
        except Exception as exc:
            OrderNotificationJob.objects.filter(pk=job.pk).update(
                status=OrderNotificationJob.Status.FAILED,
                last_error=str(exc)[:2000],
            )
        else:
            OrderNotificationJob.objects.filter(pk=job.pk).update(
                status=OrderNotificationJob.Status.DONE,
                last_error="",
            )
```

التقاط `Exception` هنا مقصود لأنه حد استرداد المهمة: لا يُخفى الخطأ، بل يُحفظ في `last_error`. لا تعالج `DONE` أبداً.

- [ ] **الخطوة 8: توليد migration صندوق الإشعارات**

```bash
cd backend
.venv/bin/python manage.py makemigrations orders --name order_notification_job
.venv/bin/python manage.py migrate
.venv/bin/python manage.py makemigrations --check
```

راجع migration يدوياً للتأكد من أنها تعتمد على `0004_merge_duplicate_order_items_and_constraint` وتحتوي نموذج `OrderNotificationJob` فقط.

- [ ] **الخطوة 9: تسجيل النموذج في لوحة الإدارة للقراءة والتشخيص**

اعرض `order`, `status`, `attempts`, `last_error`, و`updated_at`، واجعل الحقول للقراءة فقط. لا تضف زر إرسال مباشر؛ إعادة المحاولة تتم بتغيير `FAILED` عبر الأمر الدوري فقط.

- [ ] **الخطوة 10: توثيق تشغيل العامل الدوري**

أضف إلى `plans/deployment-plan.md` أمر cron كل دقيقة باستخدام المسار المطلق للبيئة:

```bash
/absolute/path/H2o-floss/backend/.venv/bin/python /absolute/path/H2o-floss/backend/manage.py dispatch_order_notifications --limit 20
```

وثّق أن checkout يحفظ المهمة فقط وأن cron هو المسؤول عن الإرسال.

- [ ] **الخطوة 11: تشغيل اختبارات الإشعارات والطلبات**

```bash
cd backend
.venv/bin/pytest tests/test_order_notifications.py tests/test_orders_api.py -v
```

المتوقع: checkout سريع ولا يستدعي النقل، والأمر يحول المهام إلى `DONE` أو `FAILED` من دون تغيير الطلب.

- [ ] **الخطوة 12: حفظ المهمة في commit مستقل**

```bash
git add backend/apps/orders backend/tests/test_order_notifications.py plans/deployment-plan.md
git commit -m "fix: dispatch order notifications outside checkout"
```

---

### المهمة 4: تثبيت بيئة التشغيل وإظهار خطأ واضح مبكراً

**الملفات:**

- إنشاء: `backend/apps/core/runtime.py`
- إنشاء: `backend/tests/test_runtime.py`
- إنشاء: `backend/.python-version`
- تعديل: `backend/manage.py`
- تعديل: `backend/config/asgi.py`
- تعديل: `backend/config/wsgi.py`
- تعديل: `backend/README.md`
- تعديل: `plans/deployment-plan.md`

**الواجهات:**

- ينتج: `ensure_supported_runtime() -> None`، وهي دالة لا تُرجع شيئاً في Python 3.12/Django 5.2 وترفع `RuntimeError` برسالة مباشرة خلاف ذلك.

- [ ] **الخطوة 1: كتابة اختبارات التحقق من البيئة**

أنشئ `backend/tests/test_runtime.py`:

```python
from unittest.mock import patch

import pytest

from apps.core.runtime import ensure_supported_runtime


def test_supported_runtime_passes():
    ensure_supported_runtime()


def test_old_python_reports_required_version():
    with patch("apps.core.runtime.sys.version_info", (3, 11, 9)):
        with pytest.raises(RuntimeError, match="Python 3.12"):
            ensure_supported_runtime()


def test_wrong_django_reports_required_version():
    with patch("apps.core.runtime.django.VERSION", (4, 2, 27, "final", 0)):
        with pytest.raises(RuntimeError, match="Django 5.2"):
            ensure_supported_runtime()
```

- [ ] **الخطوة 2: تشغيل الاختبارات والتأكد من فشل import**

```bash
cd backend
.venv/bin/pytest tests/test_runtime.py -v
```

المتوقع: فشل لأن `apps.core.runtime` غير موجود.

- [ ] **الخطوة 3: تنفيذ الحراسة المركزية**

أنشئ `backend/apps/core/runtime.py`:

```python
import sys

import django

REQUIRED_PYTHON = (3, 12)
REQUIRED_DJANGO = (5, 2)


def ensure_supported_runtime() -> None:
    if sys.version_info[:2] != REQUIRED_PYTHON:
        raise RuntimeError(
            "H2o-floss requires Python 3.12; activate backend/.venv before running commands."
        )
    if django.VERSION[:2] != REQUIRED_DJANGO:
        raise RuntimeError(
            "H2o-floss requires Django 5.2.x; install backend/requirements.txt in backend/.venv."
        )
```

- [ ] **الخطوة 4: استدعاء الحراسة من جميع نقاط التشغيل**

أضف قبل `execute_from_command_line` في `manage.py` وقبل `get_wsgi_application` أو `get_asgi_application` في ملفات config:

```python
from apps.core.runtime import ensure_supported_runtime

ensure_supported_runtime()
```

بهذا تتحول رسالة `CheckConstraint(condition=...)` الغامضة إلى رسالة إعداد مباشرة.

- [ ] **الخطوة 5: تثبيت إصدار Python وتوثيق أوامر التشغيل**

ضع النص التالي فقط في `backend/.python-version`:

```text
3.12
```

وثّق في `backend/README.md` و`plans/deployment-plan.md`:

```bash
cd backend
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt -r requirements-dev.txt
.venv/bin/python manage.py check
.venv/bin/pytest
```

لا تستخدم `pytest` أو `python manage.py` من النظام من دون المسار `.venv/bin/`.

- [ ] **الخطوة 6: إثبات الفرق بين البيئة الصحيحة والخاطئة**

```bash
cd backend
.venv/bin/python manage.py check
.venv/bin/pytest tests/test_runtime.py -v
python3 manage.py check
```

المتوقع: أول أمرين ينجحان. الأمر الثالث يفشل فوراً برسالة الإصدار المطلوبة إذا كان Python/Django النظام غير مطابق، بدلاً من traceback داخل نموذج catalog.

- [ ] **الخطوة 7: حفظ المهمة في commit مستقل**

```bash
git add backend/apps/core/runtime.py backend/tests/test_runtime.py backend/.python-version backend/manage.py backend/config/asgi.py backend/config/wsgi.py backend/README.md plans/deployment-plan.md
git commit -m "fix: enforce supported backend runtime"
```

---

### المهمة 5: التحقق النهائي من عملية الطلب كاملة

**الملفات:**

- لا ملفات جديدة؛ هذه بوابة قبول ومراجعة لجميع المهام السابقة.

**الواجهات:**

- يستهلك: checkout، lookup، انتقالات الحالة، صندوق الإشعارات، ونقاط التشغيل.
- ينتج: دليل تحقق قابل للتكرار قبل النشر.

- [ ] **الخطوة 1: تشغيل فحص migrations والنظام**

```bash
cd backend
.venv/bin/python manage.py makemigrations --check
.venv/bin/python manage.py check
```

المتوقع: لا migrations ناقصة ولا أخطاء نظام.

- [ ] **الخطوة 2: تشغيل جميع اختبارات الخادم**

```bash
cd backend
.venv/bin/pytest
```

المتوقع: نجاح الاختبارات الـ99 الأصلية إضافة إلى الاختبارات الجديدة.

- [ ] **الخطوة 3: تشغيل فحص الواجهة وبنائها**

```bash
cd frontend
npm run typecheck
npm run build
```

المتوقع: نجاح TypeScript وVite من دون أخطاء.

- [ ] **الخطوة 4: تجربة سيناريوهات القبول**

نفّذ هذه المصفوفة على قاعدة اختبار:

1. طلب طبيعي بمنتجين مختلفين → 201، طلب `PENDING`، مهمة إشعار `PENDING`، ولا اتصال خارجي أثناء الاستجابة.
2. المنتج نفسه مكرر في الحمولة → 400، لا طلب ولا مهمة إشعار.
3. تغيير المخزون بعد إضافة المنتج وقبل checkout → 400 مع بقاء السلة قابلة للتصحيح.
4. اعتماد الطلب مرتين من نسختين قديمتين → اعتماد واحد وخصم واحد، والطلب الثاني يرفض كتحول غير صالح.
5. lookup برقم الطلب فقط أو الهاتف فقط → 400 من دون بيانات.
6. lookup بالقيمتين مع تطابق → 200؛ مع هاتف خطأ → 404 عام.
7. تشغيل أمر الإشعارات → تتحول المهمة إلى `DONE`، وفشل gateway يترك الطلب محفوظاً ويسجل حالة القناة.
8. تشغيل الخادم خارج `.venv` → رسالة واضحة عن Python/Django قبل تحميل النماذج.

- [ ] **الخطوة 5: مراجعة التغييرات قبل الدمج**

```bash
git status --short
git diff --check
git diff --stat HEAD~4..HEAD
```

راجع خصوصاً عدم ظهور الهاتف في URL، وعدم وجود اتصال شبكي في `create_order_from_cart`، ووجود قفل `Order` وقفل `Product` داخل الانتقال.

- [ ] **الخطوة 6: حفظ أي توثيق تحقق نهائي إن أضيف**

إذا نتج عن التحقق تعديل توثيقي فقط، احفظه منفصلاً:

```bash
git add backend/README.md plans/deployment-plan.md
git commit -m "docs: record order flow verification"
```

إذا لم تتغير ملفات، لا تنشئ commit فارغاً.

---

## معايير الاكتمال

- لا يمكن استرجاع طلب عام برقم الطلب وحده أو الهاتف وحده.
- لا يمكن لتكرار المنتج أو تكرار الموافقة أن يؤدي إلى مخزون سالب أو HTTP 500.
- لا ينفذ checkout أي اتصال Telegram أو WhatsApp ويعيد الاستجابة بعد حفظ الطلب فقط.
- توجد مهمة صندوق واحدة لكل طلب وتتم معالجتها خارج HTTP.
- تشغيل البيئة الخاطئة ينتج رسالة مباشرة، وتشغيل `.venv` ينجح فيه `manage.py check` وجميع الاختبارات.
- ينجح `npm run typecheck` و`npm run build`.
- لا توجد تغييرات migrations غير مولدة ولا أخطاء `git diff --check`.
