# backend/roommates/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoommateProfileViewSet, 
    RoommateRequestViewSet, 
    RoommateMatchViewSet,
    RoommateProfileImageViewSet
)

router = DefaultRouter()
router.register(r'profiles', RoommateProfileViewSet, basename='roommateprofile')
router.register(r'requests', RoommateRequestViewSet, basename='roommaterequest')
router.register(r'matches', RoommateMatchViewSet, basename='roommatematch')

urlpatterns = [
    path('', include(router.urls)),
    
    # Image management endpoints
    path('profiles/<int:profile_id>/images/', 
         RoommateProfileImageViewSet.as_view({'post': 'create', 'get': 'list'}), 
         name='profile-images-create'),
    path('profiles/<int:profile_id>/images/<int:pk>/', 
         RoommateProfileImageViewSet.as_view({'delete': 'destroy'}), 
         name='profile-image-delete'),
    path('profiles/<int:profile_id>/images/set_primary/', 
         RoommateProfileImageViewSet.as_view({'patch': 'set_primary'}), 
         name='profile-image-set-primary'),
    path('profiles/<int:profile_id>/images/reorder/', 
         RoommateProfileImageViewSet.as_view({'patch': 'reorder'}), 
         name='profile-image-reorder'),
]