from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import Property, PropertyReview, PropertyImage
from .serializers import PropertySerializer, PropertyReviewSerializer, PropertyImageSerializer
from .permissions import IsOwnerOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser

class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.filter(is_active=True)
    serializer_class = PropertySerializer
    
    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]
        return [permissions.AllowAny()]
    
    def list(self, request):
        # Add filtering logic here based on query parameters
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        # Check if the user is a property owner
        if request.user.user_type != 'property_owner':
            return Response(
                {"detail": "Only property owners can create listings."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Associate the property with the authenticated user
        serializer.save(owner=request.user)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        property = self.get_object()
        serializer = PropertyReviewSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save(property=property)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def images(self, request, pk=None):
        """Add images to a property"""
        property_obj = self.get_object()
        
        # Check if user is the owner
        if property_obj.owner != request.user:
            return Response(
                {"detail": "You do not have permission to add images to this property."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        images = request.FILES.getlist('images')
        if not images:
            return Response(
                {"detail": "No images provided."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_objects = []
        for image in images:
            serializer = PropertyImageSerializer(data={
                'property': property_obj.id,
                'image': image
            })
            if serializer.is_valid():
                serializer.save()
                image_objects.append(serializer.data)
            else:
                # If any image fails validation, return the errors
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(image_objects, status=status.HTTP_201_CREATED)
    
# Add this new ViewSet
class PropertyImageViewSet(viewsets.ModelViewSet):
    queryset = PropertyImage.objects.all()
    serializer_class = PropertyImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        return PropertyImage.objects.filter(property__owner=self.request.user)
    
    def create(self, request, property_id=None):
        property_obj = get_object_or_404(Property, id=property_id)
        
        # Check if user is the owner
        if property_obj.owner != request.user:
            return Response(
                {"detail": "You do not have permission to add images to this property."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        images = request.FILES.getlist('images')
        if not images:
            return Response(
                {"detail": "No images provided."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_objects = []
        for image in images:
            serializer = self.get_serializer(data={
                'property': property_obj.id,
                'image': image
            })
            
            if serializer.is_valid():
                serializer.save()
                image_objects.append(serializer.data)
            else:
                # If any image fails validation, return the errors
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(image_objects, status=status.HTTP_201_CREATED)