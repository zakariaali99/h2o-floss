from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .forms import AdminUserChangeForm, AdminUserCreationForm
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    form = AdminUserChangeForm
    add_form = AdminUserCreationForm
    ordering = ["-date_joined"]
    list_display = ("email", "first_name", "last_name", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_superuser", "is_active")
    search_fields = ("email", "username", "first_name", "last_name", "phone")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("الشخصي", {"fields": ("first_name", "last_name", "phone")}),
        ("الدور والصلاحيات", {"fields": ("role", "is_active", "is_staff", "is_superuser",
                                       "groups", "user_permissions"),
                              "classes": ("collapse",)}),
        ("التواريخ", {"fields": ("last_login", "date_joined"), "classes": ("collapse",)}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",),
                "fields": ("email", "first_name", "last_name", "role",
                           "password1", "password2")}),
    )
    readonly_fields = ("last_login", "date_joined")
