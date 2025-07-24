from rest_framework.permissions import BasePermission

class IsAdminUserProfile(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, 'userprofile')
            and request.user.userprofile.role == 'admin'
        )
