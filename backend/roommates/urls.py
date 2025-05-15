from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoommateProfileViewSet, RoommateRequestViewSet, RoommateMatchViewSet

router = DefaultRouter()
router.register(r'profiles', RoommateProfileViewSet)
router.register(r'requests', RoommateRequestViewSet)
router.register(r'matches', RoommateMatchViewSet)

urlpatterns = [
    path('', include(router.urls)),
]