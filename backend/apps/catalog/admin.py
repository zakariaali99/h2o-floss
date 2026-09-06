from django.contrib import admin
from django.utils.html import format_html
from simple_history.admin import SimpleHistoryAdmin

from .models import Category, Product, ProductImage


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ("image", "thumb", "caption", "order", "is_feature")
    readonly_fields = ("thumb",)

    @admin.display(description="معاينة")
    def thumb(self, obj):
        if not obj or not obj.image:
            return "—"
        return format_html('<img src="{}" style="height:48px;border-radius:6px">', obj.image.url)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "order", "is_parts_group", "product_count", "image_thumb")
    list_editable = ("order", "is_parts_group")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug")

    @admin.display(description="المنتجات")
    def product_count(self, obj):
        return obj.products.count()

    @admin.display(description="الصورة")
    def image_thumb(self, obj):
        return format_html('<img src="{}" style="height:32px">', obj.image.url) if obj.image else "—"


@admin.register(Product)
class ProductAdmin(SimpleHistoryAdmin):
    list_display = (
        "thumb", "name", "kind", "category", "price", "stock_state",
        "hero", "is_active", "is_featured", "badge", "views_count",
    )
    list_editable = ("is_active", "is_featured")
    list_filter = ("kind", "is_active", "hero", "is_featured", "badge", "category")
    search_fields = ("name", "slug", "tagline", "description")
    ordering = ("order", "-created_at")
    prepopulated_fields = {"slug": ("name",)}
    inlines = (ProductImageInline,)
    autocomplete_fields = ("devices",)
    filter_horizontal = ("kit_contents",)
    history_in_columns = True
    readonly_fields = ("views_count", "created_at", "updated_at", "rendered_description")
    fieldsets = (
        (None, {"fields": ("name", "slug", "tagline", "kind", "category", "hero", "order")}),
        ("التسعير والمخزون", {"fields": ("price", "old_price", "currency", "stock_quantity",
                                        "weight_grams", "warranty_months")}),
        ("الوسائط", {"fields": ("main_image", "rendered_description")}),
        ("المحتوى", {"fields": ("description", "specifications")}),
        ("الظهور", {"fields": ("is_active", "is_featured", "badge", "views_count")}),
        ("التوافق", {"fields": ("devices", "kit_contents")}),
        ("التواريخ", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )

    @admin.display(description="الصورة")
    def thumb(self, obj):
        return format_html('<img src="{}" style="height:36px;border-radius:4px">', obj.main_image.url) \
            if obj.main_image else "—"

    @admin.display(description="المخزون", ordering="stock_quantity")
    def stock_state(self, obj):
        if obj.stock_quantity is None:
            return format_html('<span style="color:#64748b">عند الطلب</span>')
        colour = "#10b981" if obj.stock_quantity > 5 else "#f59e0b" if obj.stock_quantity else "#ef4444"
        return format_html('<span style="color:{}">{}</span>', colour, obj.stock_quantity)

    @admin.display(description="الوصف المنقّى")
    def rendered_description(self, obj):
        # Already bleach-sanitized on save, so rendering it as HTML is safe.
        return format_html("{}", obj.description) if obj.description else "—"


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ("product", "order", "is_feature", "caption")
    list_filter = ("is_feature", "product")
