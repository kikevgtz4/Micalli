from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubleaseViewSet

app_name = 'subleases'

router = DefaultRouter()
router.register(r'', SubleaseViewSet, basename='sublease')  # Changed from r'subleases' to r''

urlpatterns = [
    path('', include(router.urls)),
]