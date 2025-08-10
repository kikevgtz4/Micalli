from rest_framework import permissions


class IsSubleaseOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of a sublease to edit it
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner
        return obj.user == request.user


class IsApplicationOwner(permissions.BasePermission):
    """
    Permission for sublease applications
    """
    
    def has_object_permission(self, request, view, obj):
        # Applicant can view and withdraw their own application
        if obj.applicant == request.user:
            return True
        
        # Sublease owner can view and update status
        if obj.sublease.user == request.user:
            return request.method in ['GET', 'PATCH']
        
        return False


class CanCreateSublease(permissions.BasePermission):
    """
    Only verified students can create subleases
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Must be a student
        if request.user.user_type != 'student':
            return False
        
        # Should have verified email (you can add more verification requirements)
        if not request.user.email_verified:
            return False
        
        return True