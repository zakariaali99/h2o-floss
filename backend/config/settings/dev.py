"""Local development settings. Never deploy with these."""
from .base import *  # noqa: F403

DEBUG = True
SECRET_KEY = env("SECRET_KEY", default="dev-only-insecure-key-change-me")  # noqa: F405
ALLOWED_HOSTS = ["*"]

# The Vite dev server proxies /api and /media, so this is same-origin already.
CORS_ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_CROSS_ORIGIN_OPENER_POLICY = None

INTERNAL_IPS = ["127.0.0.1", "localhost"]
