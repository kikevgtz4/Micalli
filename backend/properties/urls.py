# backend/properties/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropertyViewSet, PropertyImageViewSet

router = DefaultRouter()
router.register(r'', PropertyViewSet)

app_name = 'properties'  # Add an app namespace

urlpatterns = [
    path('<int:property_id>/images/', PropertyImageViewSet.as_view({'post': 'create'}), name='images-upload'),
    path('', include(router.urls)),
]
