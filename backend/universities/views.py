from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import University, TransportationOption
from .serializers import UniversitySerializer, TransportationOptionSerializer

class UniversityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = University.objects.all()
    serializer_class = UniversitySerializer
    permission_classes = [AllowAny]