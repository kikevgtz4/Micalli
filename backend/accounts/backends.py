# backend/accounts/backends.py
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class EmailBackend(ModelBackend):
    """
    Custom authentication backend that uses email instead of username
    """
    def authenticate(self, request, username=None, password=None, email=None, **kwargs):
        # Handle both username and email parameters
        email_value = email or username
        
        if email_value is None:
            return None
        
        try:
            user = User.objects.get(email__iexact=email_value)
        except User.DoesNotExist:
            return None
        
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        
        return None