from django.urls import path

from .views import HealthView, StoreConfigView

app_name = "core"

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("config/", StoreConfigView.as_view(), name="config"),
]
