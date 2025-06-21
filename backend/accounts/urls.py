# backend/accounts/urls.py

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    TestView, 
    UserRegistrationView, 
    UserProfileView, 
    EmailTokenObtainView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    PasswordResetValidateTokenView,
    EmailVerificationView,
    ResendVerificationView,
    # Profile management views
    ProfileUpdateView,
    PasswordChangeView,
    ProfilePictureView,
    EmailChangeRequestView,
    AccountSettingsView,
    AccountDeactivationView,
    DeleteAccountView,
    PropertyOwnerProfileView,
)

urlpatterns = [
    path('test/', TestView.as_view(), name='test'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('token/', EmailTokenObtainView.as_view(), name='token_obtain_pair'),  # Email-based login
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Password reset endpoints
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('password-reset/validate/', PasswordResetValidateTokenView.as_view(), name='password_reset_validate'),
    
    # Email verification endpoints
    path('verify-email/', EmailVerificationView.as_view(), name='verify_email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend_verification'),
    
    # Profile management endpoints
    path('profile/update/', ProfileUpdateView.as_view(), name='profile_update'),
    path('profile/password/', PasswordChangeView.as_view(), name='password_change'),
    path('profile/picture/', ProfilePictureView.as_view(), name='profile_picture'),
    path('profile/email-change/', EmailChangeRequestView.as_view(), name='email_change_request'),
    path('profile/settings/', AccountSettingsView.as_view(), name='account_settings'),
    path('profile/deactivate/', AccountDeactivationView.as_view(), name='account_deactivation'),
    path('profile/delete/', DeleteAccountView.as_view(), name='delete_account'),

    # Property Owner endpoints
    path('property-owner/profile/', PropertyOwnerProfileView.as_view(), name='property_owner_profile'),
]