from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Count, Sum, Q
from .models import Property, PropertyReview, PropertyImage
from .serializers import PropertySerializer, PropertyReviewSerializer, PropertyImageSerializer
from .permissions import IsOwnerOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser
from messaging.models import Conversation, Message, ViewingRequest

class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.filter(is_active=True)
    serializer_class = PropertySerializer
    
    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]
        return [permissions.AllowAny()]
    
    def get_queryset(self):
        """
        Returns a filtered queryset of properties based on authentication and user role
        """
        user = self.request.user
        as_owner = self.request.query_params.get('as_owner') == 'true'
        
        # Allow authenticated property owners to view their own properties regardless of status
        if user.is_authenticated and user.user_type == 'property_owner' and as_owner:
            # Property owners can see their own properties (active or inactive)
            return Property.objects.filter(owner=user)
        
        if user.is_authenticated:
            if user.user_type == 'property_owner':
                # CHANGED: Property owners now only see active properties on the main listing page
                # This ensures consistency with what students see
                queryset = Property.objects.filter(is_active=True)
            elif user.user_type == 'admin':
                # Admins can see all properties
                queryset = Property.objects.all()
            else:
                # Regular users (students) can only see active properties
                queryset = Property.objects.filter(is_active=True)
        else:
            # Unauthenticated users can only see active properties
            queryset = Property.objects.filter(is_active=True)
        
        # Apply the following filters to the base queryset
        
        # Filter by university if provided
        university_id = self.request.query_params.get('university')
        if university_id:
            from universities.models import University
            try:
                university = University.objects.get(id=university_id)
                # This uses the utility function to find nearby properties
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
        
        # Get active viewing requests
        active_viewing_requests = ViewingRequest.objects.filter(
            property__owner=request.user,
            status__in=['pending', 'approved']
        ).count()
        
        # Get unread messages count
        unread_messages = Message.objects.filter(
            conversation__participants=request.user,
            read=False
        ).exclude(sender=request.user).count()
        
        # Get recent activity
        recent_messages = Message.objects.filter(
            conversation__participants=request.user
        ).exclude(sender=request.user).order_by('-created_at')[:5]
        
        recent_viewing_requests = ViewingRequest.objects.filter(
            property__owner=request.user
        ).order_by('-created_at')[:5]
        
        return Response({
            'property_count': property_count,
            'active_viewing_requests': active_viewing_requests,
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
                'viewing_requests': [
                    {
                        'id': req.id,
                        'requester': req.requester.username,
                        'property_title': req.property.title,
                        'proposed_date': req.proposed_date,
                        'status': req.status,
                        'created_at': req.created_at,
                    } for req in recent_viewing_requests
                ]
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