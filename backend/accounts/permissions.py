# backend/accounts/permissions.py

from rest_framework import permissions

class IsStudent(permissions.BasePermission):
    """Permission to check if user is a student"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'student'

class IsPropertyOwner(permissions.BasePermission):
    """Permission to check if user is a property owner"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'property_owner'

class IsOwnerOrReadOnly(permissions.BasePermission):
    """Object-level permission to only allow owners of an object to edit it"""
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner
        return obj.user == request.user