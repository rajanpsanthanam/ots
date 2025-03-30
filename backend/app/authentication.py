from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.utils import timezone
from .models import Token as CustomToken

class CustomTokenAuthentication(TokenAuthentication):
    def authenticate_credentials(self, key):
        try:
            token = CustomToken.objects.get(key=key)
            if not token.is_valid():
                raise AuthenticationFailed('Token has expired')
            token.last_used_at = timezone.now()
            token.save()
            return (token.user, token)
        except CustomToken.DoesNotExist:
            raise AuthenticationFailed('Invalid token') 