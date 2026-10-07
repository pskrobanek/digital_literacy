import hmac as _hmac
import hashlib
from django.conf import settings


def hmac_birth_number(raw: str) -> str:
    """Return HMAC-SHA256 of a birth number keyed by SECRET_BIRTH_NUMBER_KEY."""
    key = (settings.SECRET_BIRTH_NUMBER_KEY or '').encode()
    return _hmac.new(key, raw.encode(), hashlib.sha256).hexdigest()


def get_client_ip(request) -> str | None:
    """Return the real client IP, preferring X-Forwarded-For (set by Render's proxy)."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')
