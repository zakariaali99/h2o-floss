import os

from django.core.asgi import get_asgi_application

from apps.core.runtime import ensure_supported_runtime

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.prod")
ensure_supported_runtime()
application = get_asgi_application()
