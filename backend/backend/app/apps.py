from __future__ import annotations

from django.apps import AppConfig as DjangoAppConfig


class BackendAppConfig(DjangoAppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "app"
