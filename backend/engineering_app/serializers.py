# ✅ FILE: serializers.py (Django backend)
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile, WorkRequest, EnergyInput
from uuid import uuid4
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed

# 🔐 Custom Login Serializer (validasi status akun)
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        # Validasi status aktif
        if self.user.userprofile.status.strip().lower() != 'active':
            raise AuthenticationFailed('User account is inactive.')

        return data

# 👤 User Profile Serializer
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['role', 'division', 'status'] 

# 🧑 User Serializer (buat user baru)
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

# 📄 Extended UserProfile (for /api/me/ endpoint)
class UserProfileWithUserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email')
    username = serializers.CharField(source='user.username')
    date_joined = serializers.DateTimeField(source='user.date_joined')

    class Meta:
        model = UserProfile
        fields = ['id', 'full_name', 'username', 'email', 'role', 'division', 'status', 'avatar', 'date_joined']

# 🛠️ WorkRequest Serializer
class WorkRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkRequest
        exclude = ['requested_by', 'status', 'wr_number', 'approved_at', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')  
        validated_data['wr_number'] = f"WR-{uuid4().hex[:6].upper()}"
        validated_data['status'] = "pending"

        if request and hasattr(request, 'user'):
            validated_data['requested_by'] = request.user
        else:
            raise serializers.ValidationError("User is not authenticated.")

        return super().create(validated_data)

# 🔌 EnergyInput Serializer
class EnergyInputSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnergyInput
        fields = "__all__"
        read_only_fields = ['user']

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)

from rest_framework import serializers
from .models import Document

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = '__all__'

from django.contrib.admin.models import LogEntry
from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

class AuditTrailSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    content_type = serializers.SerializerMethodField()
    
    class Meta:
        model = LogEntry
        fields = ['action_time', 'user', 'content_type', 'object_id', 'object_repr', 'action_flag', 'change_message']
    
    def get_user(self, obj):
        return obj.user.get_full_name() if obj.user else None
    
    def get_content_type(self, obj):
        return obj.content_type.model if obj.content_type else None

