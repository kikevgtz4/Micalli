# backend/properties/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Count, Sum, Q
from .models import Property, PropertyReview, PropertyImage
# UPDATE YOUR IMPORTS TO INCLUDE THE NEW SERIALIZERS
from .serializers import (
    PropertySerializer, 
    PropertyPublicSerializer, 
    PropertyOwnerSerializer,
    PropertyReviewSerializer, 
    PropertyImageSerializer
)
from .permissions import IsOwnerOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser
from messaging.models import Conversation, Message

class PropertyViewSet(viewsets.ModelViewSet):
    # Remove the filtering from get_queryset for retrieve operations
    queryset = Property.objects.all()
    # Remove the default serializer_class since we'll use get_serializer_class
    
    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]
        return [permissions.AllowAny()]
    
    # ADD THIS METHOD TO DETERMINE WHICH SERIALIZER TO USE
    def get_serializer_class(self):
        """Use different serializers based on who's viewing"""
        # For create/update actions, use the full PropertySerializer
        if self.action in ['create', 'update', 'partial_update']:
            return PropertySerializer
        
        # For retrieve actions, check if it's the owner
        if self.action == 'retrieve':
            try:
                property_obj = self.get_object()
                if self.request.user.is_authenticated and self.request.user == property_obj.owner:
                    return PropertyOwnerSerializer
            except:
                pass
        
        # For owner_properties action, use PropertyOwnerSerializer
        if self.action == 'owner_properties':
            return PropertyOwnerSerializer
        
        # Default to public serializer for all other cases
        return PropertyPublicSerializer
    
    def get_queryset(self):
        """
        Returns a filtered queryset of properties based on authentication and user role
        """
        user = self.request.user
        as_owner = self.request.query_params.get('as_owner') == 'true'
        
        # For list operations (not retrieve), filter by active status
        if self.action == 'list':
            # Allow authenticated property owners to view their own properties regardless of status
            if user.is_authenticated and user.user_type == 'property_owner' and as_owner:
                return Property.objects.filter(owner=user)
            
            # For all other cases, only show active properties
            queryset = Property.objects.filter(is_active=True)
            
            # Apply additional filters for list view...
            university_id = self.request.query_params.get('university')
            if university_id:
                from universities.models import University
                try:
                    university = University.objects.get(id=university_id)
                    from universities.utils import find_properties_near_university
                    properties = find_properties_near_university(university_id)
                    property_ids = [p.id for p in properties]
                    queryset = queryset.filter(id__in=property_ids)
                except University.DoesNotExist:
                    pass
                    
            # Filter by property type if provided
            property_type = self.request.query_params.get('property_type')
            if property_type:
                queryset = queryset.filter(property_type=property_type)
                
            # Filter by price range if provided
            min_price = self.request.query_params.get('min_price')
            if min_price:
                try:
                    queryset = queryset.filter(rent_amount__gte=float(min_price))
                except ValueError:
                    pass
                    
            max_price = self.request.query_params.get('max_price')
            if max_price:
                try:
                    queryset = queryset.filter(rent_amount__lte=float(max_price))
                except ValueError:
                    pass
                    
            # Filter by bedrooms if provided
            bedrooms = self.request.query_params.get('bedrooms')
            if bedrooms:
                try:
                    queryset = queryset.filter(bedrooms__gte=int(bedrooms))
                except ValueError:
                    pass
                    
            return queryset
        
        # For retrieve operations, return all properties (we'll handle inactive in retrieve method)
        return Property.objects.all()
    
    def retrieve(self, request, *args, **kwargs):
        """
        Override retrieve to handle inactive properties properly
        """
        try:
            instance = self.get_object()
        except Property.DoesNotExist:
            return Response(
                {"detail": "Property not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user = request.user
        as_owner = request.query_params.get('as_owner') == 'true'
        
        # Check if user can access inactive property
        can_access_inactive = (
            user.is_authenticated and 
            user.user_type == 'property_owner' and 
            as_owner and 
            instance.owner == user
        )
        
        # If property is inactive and user can't access it, return 403
        if not instance.is_active and not can_access_inactive:
            return Response(
                {
                    "detail": "This property is currently unavailable.",
                    "error_code": "property_inactive"
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Property is active or user has permission to view inactive property
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def list(self, request):
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
        # Use perform_create to handle the save
        self.perform_create(serializer)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    # ADD/UPDATE THIS METHOD TO EXTRACT NEIGHBORHOOD DATA
    def perform_create(self, serializer):
        """Save property with extracted neighborhood data"""
        # Extract neighborhood from address
        address_data = self.request.data.get('address', '')
        neighborhood_data = self.extract_neighborhood(address_data)
        
        # Save with owner and neighborhood data
        serializer.save(
            owner=self.request.user,
            display_neighborhood=neighborhood_data.get('neighborhood', ''),
            display_area=neighborhood_data.get('area', '')
        )
    
    # ADD THIS HELPER METHOD
    def extract_neighborhood(self, address):
        """Extract neighborhood and area from full address"""
        # Simple implementation - splits address by commas
        # You can enhance this later with geocoding API data
        parts = [part.strip() for part in address.split(',')]
        
        # Typical format: "Street Number, Neighborhood, Area/Colony, City, State"
        # Example: "Av. Eugenio Garza Sada 2501, Tecnológico, 64849 Monterrey, N.L."
        result = {
            'neighborhood': '',
            'area': ''
        }
        
        if len(parts) >= 2:
            # Second part is usually the neighborhood
            result['neighborhood'] = parts[1]
        
        if len(parts) >= 3:
            # Third part might be area/colony or postal code + city
            # Check if it starts with a number (postal code)
            if parts[2] and not parts[2][0].isdigit():
                result['area'] = parts[2]
            elif len(parts) >= 4:
                # If third part is postal code, fourth might be area
                result['area'] = parts[3].replace('Monterrey', '').strip()
        
        return result
    
    # ... ALL YOUR OTHER EXISTING METHODS REMAIN THE SAME ...
    
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
        
    @action(detail=False, methods=['get'])
    def owner_properties(self, request):
        """Get properties belonging to the current user"""
        properties = Property.objects.filter(owner=request.user)
        serializer = self.get_serializer(properties, many=True)
        return Response(serializer.data)
        
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update property active status"""
        property_obj = get_object_or_404(Property, id=pk)
        
        # Check if user is the owner
        if property_obj.owner != request.user:
            return Response(
                {"detail": "You do not have permission to update this property."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        is_active = request.data.get('is_active')
        if is_active is None:
            return Response(
                {"detail": "is_active field is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        property_obj.is_active = is_active
        property_obj.save(update_fields=['is_active'])
        
        serializer = self.get_serializer(property_obj)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def toggle_active(self, request, pk=None):
        """Toggle a property's active status"""
        property_obj = self.get_object()
        
        # Verify ownership
        if property_obj.owner != request.user:
            return Response(
                {"detail": "You do not have permission to modify this property."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Toggle the status
        property_obj.is_active = not property_obj.is_active
        property_obj.save(update_fields=['is_active'])
        
        serializer = self.get_serializer(property_obj)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get dashboard statistics for property owner"""
        # Get count of owner's properties
        property_count = Property.objects.filter(owner=request.user).count()
        
        # Get unread messages count
        unread_messages = Message.objects.filter(
            conversation__participants=request.user,
            read=False
        ).exclude(sender=request.user).count()
        
        # Get recent activity
        recent_messages = Message.objects.filter(
            conversation__participants=request.user
        ).exclude(sender=request.user).order_by('-created_at')[:5]
        
        return Response({
            'property_count': property_count,
            'unread_messages': unread_messages,
            'recent_activity': {
                'messages': [
                    {
                        'id': msg.id,
                        'sender': msg.sender.username,
                        'content': msg.content[:100],
                        'created_at': msg.created_at,
                        'conversation_id': msg.conversation.id,
                        'property_title': msg.conversation.property.title if msg.conversation.property else None,
                    } for msg in recent_messages
                ],
            }
        })
        
class PropertyImageViewSet(viewsets.ModelViewSet):
    queryset = PropertyImage.objects.all()
    serializer_class = PropertyImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        """Return only images for properties owned by the current user"""
        return PropertyImage.objects.filter(property__owner=self.request.user)
    
    def create(self, request, property_id=None):
        """Add images to a property with enhanced debugging"""
        print(f"PropertyImageViewSet.create called with property_id={property_id}")
        print(f"Request method: {request.method}")
        print(f"Request path: {request.path}")
        print(f"Request FILES: {request.FILES}")
        """Add images to a property with enhanced error handling"""
        try:
            print(f"Processing image upload for property_id: {property_id}")
            print(f"Files in request: {request.FILES}")
            
            # Get the property object or return 404
            property_obj = get_object_or_404(Property, id=property_id)
            print(f"Found property: {property_obj.title}")
            
            # Check if user is the owner
            if property_obj.owner != request.user:
                print(f"Permission denied: User {request.user.username} is not the owner of this property")
                return Response(
                    {"detail": "You do not have permission to add images to this property."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get the list of uploaded images
            images = request.FILES.getlist('images')
            if not images:
                print("No images found in request")
                return Response(
                    {"detail": "No images provided."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print(f"Processing {len(images)} images")
            
            # Process each image
            image_objects = []
            for i, image in enumerate(images):
                print(f"Processing image {i+1}: {image.name}, Size: {image.size} bytes")
                
                serializer = self.get_serializer(data={
                    'property': property_obj.id,
                    'image': image
                })
                
                if serializer.is_valid():
                    image_instance = serializer.save()
                    print(f"Image saved: {image_instance.id}")
                    image_objects.append(serializer.data)
                else:
                    # If any image fails validation, return the errors
                    print(f"Validation error for image {i+1}: {serializer.errors}")
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            print(f"Successfully processed {len(image_objects)} images")
            return Response(image_objects, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # Log any unexpected errors
            print(f"Unexpected error uploading images: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"detail": f"Error uploading images: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        """Delete an image with ownership verification"""
        try:
            image = self.get_object()
            
            # Verify ownership through the property
            if image.property.owner != request.user:
                return Response(
                    {"detail": "You do not have permission to delete this image."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Perform deletion
            image.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        
        except Exception as e:
            print(f"Error deleting image: {str(e)}")
            return Response(
                {"detail": f"Error deleting image: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def bulk_upload(self, request, property_id=None):
        """Upload multiple images in a single request"""
        try:
            property_obj = get_object_or_404(Property, id=property_id)
            
            # Check ownership
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
            
            # Process images in bulk
            created_images = []
            for image in images:
                img = PropertyImage.objects.create(
                    property=property_obj,
                    image=image
                )
                created_images.append(self.get_serializer(img).data)
            
            return Response(created_images, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            print(f"Error in bulk upload: {str(e)}")
            return Response(
                {"detail": f"Error uploading images: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['patch'])
    def set_as_main(self, request, pk=None):
        """Set an image as the main property image"""
        try:
            image = self.get_object()
            
            # Verify ownership
            if image.property.owner != request.user:
                return Response(
                    {"detail": "You do not have permission to modify this image."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Clear main flag on all other images
            PropertyImage.objects.filter(property=image.property).update(is_main=False)
            
            # Set this image as main
            image.is_main = True
            image.save()
            
            return Response(self.get_serializer(image).data)
        
        except Exception as e:
            print(f"Error setting main image: {str(e)}")
            return Response(
                {"detail": f"Error setting main image: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )