# backend/accounts/urls.py

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    TestView, 
    UserRegistrationView, 
    UserProfileView, 
    CustomTokenObtainPairView,
    PasswordResetRequestView,      # New
    PasswordResetConfirmView,      # New
    PasswordResetValidateTokenView # New
)

urlpatterns = [
    path('test/', TestView.as_view(), name='test'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Password reset endpoints
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('password-reset/validate/', PasswordResetValidateTokenView.as_view(), name='password_reset_validate'),
]