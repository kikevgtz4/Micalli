# backend/roommates/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoommateProfileViewSet, 
    RoommateRequestViewSet, 
    RoommateMatchViewSet,
    RoommateProfileImageViewSet  # Add this import
)

router = DefaultRouter()
router.register(r'profiles', RoommateProfileViewSet)
router.register(r'requests', RoommateRequestViewSet)
router.register(r'matches', RoommateMatchViewSet)

app_name = 'roommates'  # Add namespace for consistency

urlpatterns = [
    # Add the dedicated image upload endpoint BEFORE the router includes
    path(
        'profiles/<int:profile_id>/images/', 
        RoommateProfileImageViewSet.as_view({
            'post': 'create',
            'get': 'list'
        }), 
        name='profile-images-upload'
    ),
    path(
        'profiles/<int:profile_id>/images/<int:pk>/', 
        RoommateProfileImageViewSet.as_view({
            'delete': 'destroy'
        }), 
        name='profile-image-delete'
    ),
    # Include the router URLs
    path('', include(router.urls)),
]