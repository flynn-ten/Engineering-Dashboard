from rest_framework.permissions import BasePermission


class IsAdminUserProfile(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, 'userprofile')
            and request.user.userprofile.role == 'admin'
        )


from rest_framework.permissions import BasePermission


class IsAuthenticatedUser(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


# permissions.py
from rest_framework.permissions import BasePermission


class IsActiveUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_active and request.user.userprofile.status == 'Active'



