from django.contrib import admin
from .models import Property, PropertyImage, Room, PropertyReview

class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1

class RoomInline(admin.TabularInline):
    model = Room
    extra = 1

class PropertyReviewInline(admin.TabularInline):
    model = PropertyReview
    extra = 0
    readonly_fields = ('reviewer', 'created_at')

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('title', 'property_type', 'address', 'bedrooms', 'bathrooms', 'rent_amount', 'available_from', 'is_active')
    list_filter = ('property_type', 'is_active', 'is_verified', 'is_featured', 'furnished')
    search_fields = ('title', 'address', 'description')
    inlines = [PropertyImageInline, RoomInline, PropertyReviewInline]
    fieldsets = (
        ('Basic Info', {
            'fields': ('title', 'description', 'property_type', 'owner')
        }),
        ('Location', {
            'fields': ('address', 'latitude', 'longitude')
        }),
        ('Details', {
            'fields': ('bedrooms', 'bathrooms', 'total_area', 'furnished', 'amenities', 'rules')
        }),
        ('Pricing', {
            'fields': ('rent_amount', 'deposit_amount', 'payment_frequency', 'included_utilities')
        }),
        ('Availability', {
            'fields': ('available_from', 'minimum_stay', 'maximum_stay')
        }),
        ('Status', {
            'fields': ('is_active', 'is_verified', 'is_featured')
        }),
    )

@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ('property', 'image', 'is_main', 'caption', 'order')
    list_filter = ('is_main', 'property')
    search_fields = ('property__title', 'caption')

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'property', 'size', 'rent_amount', 'available_from', 'occupied')
    list_filter = ('occupied', 'private_bathroom', 'furnished')
    search_fields = ('name', 'property__title', 'description')

@admin.register(PropertyReview)
class PropertyReviewAdmin(admin.ModelAdmin):
    list_display = ('property', 'reviewer', 'rating', 'cleanliness', 'value', 'created_at')
    list_filter = ('rating', 'cleanliness', 'value', 'location', 'accuracy', 'communication')
    search_fields = ('property__title', 'reviewer__username', 'review_text')
    readonly_fields = ('reviewer', 'created_at')