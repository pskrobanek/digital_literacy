from django.apps import AppConfig
from django.core.exceptions import ImproperlyConfigured


class DigitaltestConfig(AppConfig):
    name = 'digitaltest'

    def ready(self):
        from django.conf import settings
        if not settings.SECRET_BIRTH_NUMBER_KEY:
            raise ImproperlyConfigured(
                'SECRET_BIRTH_NUMBER_KEY must be set in environment variables.'
            )
