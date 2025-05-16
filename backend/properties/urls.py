# backend/properties/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropertyViewSet, PropertyImageViewSet

router = DefaultRouter()
router.register(r'', PropertyViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('<int:property_id>/images/', PropertyImageViewSet.as_view({'post': 'create'})),
]