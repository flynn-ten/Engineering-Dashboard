from rest_framework import serializers
from .models import WorkRequest, UserProfile
from django.contrib.auth.models import User

# Untuk WorkRequest (sudah ada)
class WorkRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkRequest
        fields = '__all__'
        read_only_fields = ['wr_requestor']

# Sudah ada sebelumnya
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['role', 'division']

class UserSerializer(serializers.ModelSerializer):
    userprofile = UserProfileSerializer(read_only=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'userprofile']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class UserProfileWithUserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email')
    date_joined = serializers.DateTimeField(source='user.date_joined')

    class Meta:
        model = UserProfile
        fields = ['id', 'full_name', 'email', 'role', 'division', 'status', 'avatar', 'date_joined']

from rest_framework import serializers
from .models import WorkRequest

class WorkRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkRequest
        fields = '__all__'
        read_only_fields = ['wr_number', 'created_at', 'approved_at', 'requested_by']

from rest_framework import serializers
from .models import EnergyInput

class EnergyInputSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnergyInput
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at']

