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
