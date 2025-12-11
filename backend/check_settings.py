# check_settings.py - run from backend folder (venv active)
from app.core.config import settings

def mask_uri(uri: str):
    if not uri:
        return None
    try:
        left, right = uri.split('@', 1)
        proto, creds = left.split('//', 1)
        if ':' in creds:
            user, pwd = creds.split(':', 1)
            return f"{proto}//{user}:****@{right}"
    except Exception:
        return uri
    return uri

print("---- Settings diagnostic ----")
print("MONGODB_URI (masked):", mask_uri(getattr(settings, 'mongodb_uri', None)))
print("MONGODB_NAME:", getattr(settings, 'mongodb_name', None))
print("JWT_SECRET present?:", bool(getattr(settings, 'jwt_secret', None)))
print("---- End ----")
