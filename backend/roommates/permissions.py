# backend/roommates/permissions.py (new file)

from rest_framework import permissions

class IsProfileOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners to edit their profile
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Write permissions only for owner
        return obj.user == request.user