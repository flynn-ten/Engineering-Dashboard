from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile
from .models import WorkRequest

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

class WorkRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkRequest
        exclude = ['requested_by', 'status', 'wr_number', 'approved_at', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')  # Lebih aman daripada langsung self.context['request']
        validated_data['wr_number'] = f"WR-{uuid4().hex[:6].upper()}"
        validated_data['status'] = "pending"
        
        if request and hasattr(request, 'user'):
            validated_data['requested_by'] = request.user
        else:
            raise serializers.ValidationError("User is not authenticated.")

        return super().create(validated_data)
from uuid import uuid4
