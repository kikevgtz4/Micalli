from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db.models import Q, F, Count, Sum
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Sublease, SubleaseImage, SubleaseApplication,
    SubleaseVerification, SubleaseUniversityProximity, SubleaseSave
)
from .serializers import (
    SubleaseListSerializer, SubleaseDetailSerializer,
    SubleaseCreateSerializer, SubleaseUpdateSerializer,
    SubleaseApplicationSerializer, SubleaseImageSerializer,
    SubleaseSaveSerializer
)
from .permissions import IsSubleaseOwner, IsApplicationOwner, CanCreateSublease


class SubleasePagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 50


class SubleaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for sublease listings
    
    list: Get all active subleases (paginated)
    create: Create a new sublease (students only)
    retrieve: Get sublease details
    update: Update sublease (owner only)
    partial_update: Partial update (owner only)
    destroy: Delete sublease (owner only)
    
    Custom actions:
    - toggle_save: Save/unsave a sublease
    - apply: Apply to a sublease
    - applications: Get applications for a sublease (owner only)
    - my_applications: Get user's applications
    - saved: Get saved subleases
    - stats: Get sublease statistics
    - upload_images: Upload images for a sublease
    - dashboard_stats: Get dashboard statistics
    - bulk_update_status: Update status for multiple subleases
    """
    queryset = Sublease.objects.all()
    pagination_class = SubleasePagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'display_neighborhood', 'display_area']
    ordering_fields = ['created_at', 'sublease_rent', 'start_date', 'urgency_level']
    ordering = ['-urgency_level', '-created_at']
    
    # Filter fields
    filterset_fields = {
        'sublease_type': ['exact', 'in'],
        'listing_type': ['exact', 'in'],
        'status': ['exact', 'in'],
        'urgency_level': ['exact', 'in'],
        'furnished': ['exact'],
        'pet_friendly': ['exact'],
        'smoking_allowed': ['exact'],
        'start_date': ['gte', 'lte', 'exact'],
        'end_date': ['gte', 'lte', 'exact'],
        'sublease_rent': ['gte', 'lte'],
        'original_rent': ['gte', 'lte'],
        'bedrooms': ['exact', 'gte', 'lte'],
        'bathrooms': ['gte', 'lte'],
        'property_type': ['exact', 'in'],
        'city': ['exact', 'icontains'],
        'display_neighborhood': ['icontains'],
        'display_area': ['icontains'],
        'deposit_required': ['exact'],
        'lease_transfer_allowed': ['exact'],
        'available_immediately': ['exact'],
    }
    
    def get_serializer_class(self):
        if self.action == 'list':
            return SubleaseListSerializer
        elif self.action == 'create':
            return SubleaseCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return SubleaseUpdateSerializer
        return SubleaseDetailSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated(), CanCreateSublease()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsSubleaseOwner()]
        return [permissions.AllowAny()]
    
    def get_queryset(self):
        queryset = Sublease.objects.select_related('user', 'user__university')
        
        # For list view, only show active subleases (unless viewing own)
        if self.action == 'list':
            if self.request.user.is_authenticated:
                # Allow users to see their own subleases regardless of status
                my_subleases = self.request.query_params.get('my_subleases') == 'true'
                if my_subleases:
                    return queryset.filter(user=self.request.user)
            
            # Otherwise only show active subleases
            queryset = queryset.filter(status='active')
        
        # Filter by university proximity if requested
        university_id = self.request.query_params.get('university')
        if university_id:
            queryset = queryset.filter(
                university_proximities__university_id=university_id
            ).distinct()
        
        # Filter by duration
        duration = self.request.query_params.get('duration')
        if duration:
            if duration == 'short':  # 1-3 months
                queryset = queryset.annotate(
                    duration_days=F('end_date') - F('start_date')
                ).filter(duration_days__lte=90)
            elif duration == 'medium':  # 3-6 months
                queryset = queryset.annotate(
                    duration_days=F('end_date') - F('start_date')
                ).filter(duration_days__gt=90, duration_days__lte=180)
            elif duration == 'long':  # 6+ months
                queryset = queryset.annotate(
                    duration_days=F('end_date') - F('start_date')
                ).filter(duration_days__gt=180)
        
        # Filter by roommate gender preference
        roommate_gender = self.request.query_params.get('roommate_gender')
        if roommate_gender and roommate_gender != 'any':
            queryset = queryset.filter(roommate_genders=roommate_gender)
        
        return queryset.prefetch_related('images', 'university_proximities__university')
    
    # Also, in your retrieve method, fix the view count increment to match properties pattern:
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Increment view count (matching properties pattern)
        if not request.user.is_authenticated or request.user != instance.user:
            Sublease.objects.filter(pk=instance.pk).update(
                views_count=F('views_count') + 1
            )
            instance.refresh_from_db()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_save(self, request, pk=None):
        """Toggle save/bookmark status for a sublease"""
        sublease = self.get_object()
        
        saved, created = SubleaseSave.objects.get_or_create(
            user=request.user,
            sublease=sublease
        )
        
        if not created:
            saved.delete()
            sublease.saved_count = F('saved_count') - 1
            message = 'Sublease removed from saved'
            is_saved = False
        else:
            sublease.saved_count = F('saved_count') + 1
            message = 'Sublease saved'
            is_saved = True
        
        sublease.save(update_fields=['saved_count'])
        
        return Response({
            'message': message,
            'is_saved': is_saved
        })
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def apply(self, request, pk=None):
        """Apply to a sublease"""
        sublease = self.get_object()
        
        # Check if sublease is active
        if sublease.status != 'active':
            return Response(
                {'error': 'This sublease is not accepting applications'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is the owner
        if sublease.user == request.user:
            return Response(
                {'error': 'You cannot apply to your own sublease'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = SubleaseApplicationSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.initial_data['sublease'] = sublease.id
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def applications(self, request, pk=None):
        """Get applications for a sublease (owner only)"""
        sublease = self.get_object()
        
        if sublease.user != request.user:
            return Response(
                {'error': 'You can only view applications for your own subleases'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        applications = sublease.applications.select_related('applicant')
        serializer = SubleaseApplicationSerializer(applications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_applications(self, request):
        """Get user's sublease applications"""
        applications = SubleaseApplication.objects.filter(
            applicant=request.user
        ).select_related('sublease', 'sublease__user')
        
        serializer = SubleaseApplicationSerializer(applications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def saved(self, request):
        """Get user's saved subleases"""
        saved_subleases = SubleaseSave.objects.filter(
            user=request.user
        ).select_related('sublease', 'sublease__user')
        
        serializer = SubleaseSaveSerializer(saved_subleases, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get sublease statistics"""
        stats = {
            'total_active': Sublease.objects.filter(status='active').count(),
            'by_type': {},
            'by_urgency': {},
            'average_discount': 0
        }
        
        # Count by type
        for choice in Sublease.SubleaseType.choices:
            stats['by_type'][choice[0]] = Sublease.objects.filter(
                status='active',
                sublease_type=choice[0]
            ).count()
        
        # Count by urgency
        for choice in Sublease.UrgencyLevel.choices:
            stats['by_urgency'][choice[0]] = Sublease.objects.filter(
                status='active',
                urgency_level=choice[0]
            ).count()
        
        # Calculate average discount
        active_subleases = Sublease.objects.filter(
            status='active',
            original_rent__gt=0,
            sublease_rent__gt=0
        )
        
        if active_subleases.exists():
            total_discount = sum([s.discount_percentage for s in active_subleases])
            stats['average_discount'] = round(total_discount / active_subleases.count(), 1)
        
        return Response(stats)
    
    @action(detail=True, methods=['post'], 
            permission_classes=[permissions.IsAuthenticated, IsSubleaseOwner],
            parser_classes=[MultiPartParser, FormParser])
    def upload_images(self, request, pk=None):
        """Upload images for a sublease"""
        sublease = self.get_object()
        images = request.FILES.getlist('images')
        
        if not images:
            return Response(
                {'error': 'No images provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_images = []
        for image in images:
            # Set first image as main if no main image exists
            is_main = not sublease.images.filter(is_main=True).exists() and not created_images
            
            sublease_image = SubleaseImage.objects.create(
                sublease=sublease,
                image=image,
                is_main=is_main,
                caption=request.data.get('caption', ''),
                order=len(created_images)
            )
            created_images.append(sublease_image)
        
        serializer = SubleaseImageSerializer(created_images, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def dashboard_stats(self, request):
        """Get dashboard statistics for user's subleases"""
        user_subleases = Sublease.objects.filter(user=request.user)
        
        stats = {
            'total_subleases': user_subleases.count(),
            'active_subleases': user_subleases.filter(status='active').count(),
            'draft_subleases': user_subleases.filter(status='draft').count(),
            'filled_subleases': user_subleases.filter(status='filled').count(),
            'total_applications': SubleaseApplication.objects.filter(
                sublease__user=request.user
            ).count(),
            'pending_applications': SubleaseApplication.objects.filter(
                sublease__user=request.user,
                status='pending'
            ).count(),
            'total_views': user_subleases.aggregate(
                total=Sum('views_count')
            )['total'] or 0,
            'total_saves': user_subleases.aggregate(
                total=Sum('saved_count')
            )['total'] or 0,
            'urgent_count': user_subleases.filter(
                urgency_level='urgent',
                status='active'
            ).count(),
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def bulk_update_status(self, request):
        """Bulk update status for multiple subleases"""
        ids = request.data.get('ids', [])
        new_status = request.data.get('status')
        
        if not ids or not new_status:
            return Response(
                {'error': 'ids and status are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate status
        if new_status not in dict(Sublease.Status.choices):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update only user's subleases
        updated = Sublease.objects.filter(
            id__in=ids,
            user=request.user
        ).update(
            status=new_status,
            updated_at=timezone.now()
        )
        
        return Response({
            'updated': updated,
            'message': f'Successfully updated {updated} subleases'
        })
