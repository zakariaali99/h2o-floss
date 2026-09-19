import os

from django.core.wsgi import get_wsgi_application

from apps.core.runtime import ensure_supported_runtime

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.prod")
ensure_supported_runtime()
application = get_wsgi_application()
