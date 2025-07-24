from rest_framework.permissions import BasePermission

class IsAdminUserProfile(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, 'userprofile')
            and request.user.userprofile.role == 'admin'
        )

from rest_framework import serializers
from .models import WorkRequest

class WorkRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkRequest
        fields = '__all__'
        read_only_fields = ['user']
