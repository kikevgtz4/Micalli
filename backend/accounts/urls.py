from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import TestView, UserRegistrationView, UserProfileView, CustomTokenObtainPairView

urlpatterns = [
    path('test/', TestView.as_view(), name='test'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]