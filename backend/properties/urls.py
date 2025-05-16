# backend/properties/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropertyViewSet, PropertyImageViewSet

router = DefaultRouter()
router.register(r'', PropertyViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('<int:property_id>/images/', PropertyImageViewSet.as_view({'post': 'create'})),
    # These are implicitly included by the router:
    # path('owner-properties/', PropertyViewSet.as_view({'get': 'owner_properties'})),
    # path('<int:pk>/update-status/', PropertyViewSet.as_view({'patch': 'update_status'})),
    # path('dashboard-stats/', PropertyViewSet.as_view({'get': 'dashboard_stats'})),
]