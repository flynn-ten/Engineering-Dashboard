# ✅ FILE: serializers.py (Merged)
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from uuid import uuid4
from .utils import generate_wo_number

from .models import (
    UserProfile, WorkRequest, WorkOrder,
    EnergyInput, Document
)

# 🔐 Custom Login Serializer (validasi status akun aktif)

class PlannedMaintenanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkOrder
        fields = [
            "title",             # <--- Added
            "description",
            "asset_number",
            "asset_group",
            "asset_area",
            "parent_asset",
            "urgency",
            "wo_type",
            "wo_start_date",
            "pm_name",
            "set_name",
            "asset_activity",
            "status",
            "wo_created_at",
            "wo_number",
        ]
        read_only_fields = ["status", "wo_created_at", "wo_number"]

    def create(self, validated_data):
        validated_data["status"] = "planned"
        validated_data["wo_created_at"] = timezone.now()
        validated_data["wo_number"] = generate_wo_number()
        return super().create(validated_data)


# 👤 UserProfile serializer (basic)
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['role', 'division', 'status']

# 👤 Extended UserProfile + user field (for /api/users/ and /api/me/)
class UserProfileWithUserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email')
    username = serializers.CharField(source='user.username')
    date_joined = serializers.DateTimeField(source='user.date_joined')

    class Meta:
        model = UserProfile
        fields = ['id', 'full_name', 'username', 'email', 'role', 'division', 'status', 'avatar', 'date_joined']

# 🙍 User Serializer
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

# 🛠️ WorkRequest Serializer (Create + GET)
class WorkRequestSerializer(serializers.ModelSerializer):
    requester_name = serializers.SerializerMethodField()

    class Meta:
        model = WorkRequest
        fields = [
            'id', 'wr_number', 'title', 'description', 'asset_number', 'asset_department',
            'resource', 'urgency', 'wr_type', 'failure_code', 'failure_cause', 'resolution',
            'actual_failure_date', 'completion_by_date', 'status',
            'requester_name', 'created_at', 'approved_at'

        ]

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['wr_number'] = f"WR-{uuid4().hex[:6].upper()}"
        validated_data['status'] = "pending"
        validated_data['urgency'] = validated_data.get('urgency')
        validated_data['wr_type'] = validated_data.get('wr_type')

        if request and hasattr(request, 'user'):
            validated_data['requested_by'] = request.user
        else:
            raise serializers.ValidationError("User is not authenticated.")

        return super().create(validated_data)

    def get_requester_name(self, obj):
        return obj.requested_by.get_full_name() or obj.requested_by.username

# 🔧 WorkOrder Serializers
class WorkOrderSerializer(serializers.ModelSerializer):
    requester = serializers.SerializerMethodField()

    class Meta:
        model = WorkOrder
        fields = '__all__'
        read_only_fields = [
            'wo_number', 'wo_created_at', 'wo_start_date',
            'wo_completion_date', 'actual_duration', 'engineer',
        ]

    def get_requester(self, obj):
        if obj.requester:
            return obj.requester.get_full_name() or str(obj.requester)
        return None


class WorkOrderUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkOrder
        fields = [
            'asset_group', 'asset_area', 'parent_asset', 'failure_cause',
            'resolution', 'cost', 'actual_failure_date', 'completion_by_date',
            'failure_code', 'status', 'wo_start_date'
        ]

class WorkOrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkOrder
        fields = ['status', 'wo_start_date', 'wo_completion_date', 'actual_duration']
        read_only_fields = ['wo_start_date', 'wo_completion_date', 'actual_duration']

    def update(self, instance, validated_data):
        new_status = validated_data.get("status")

        if new_status == "released" and instance.status != "released":
            instance.status = "released"
            instance.wo_start_date = timezone.now()

        elif new_status == "completed" and instance.status != "completed":
            instance.status = "completed"
            instance.wo_completion_date = timezone.now()
            if instance.wo_start_date:
                instance.actual_duration = instance.wo_completion_date - instance.wo_start_date

        instance.save()
        return instance



# 👤 UserProfile serializer (basic)
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['role', 'division', 'status']

# 👤 Extended UserProfile + user field (for /api/users/ and /api/me/)
class UserProfileWithUserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email')
    username = serializers.CharField(source='user.username')
    date_joined = serializers.DateTimeField(source='user.date_joined')

    class Meta:
        model = UserProfile
        fields = ['id', 'full_name', 'username', 'email', 'role', 'division', 'status', 'avatar', 'date_joined']

# 🙍 User Serializer
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

# 🛠️ WorkRequest Serializer (Create + GET)
class WorkRequestSerializer(serializers.ModelSerializer):
    requester_name = serializers.SerializerMethodField()

    class Meta:
        model = WorkRequest
        fields = [
            'id', 'wr_number', 'title', 'description', 'asset_number', 'asset_department',
            'resource', 'urgency', 'wr_type', 'failure_code', 'failure_cause', 'resolution',
            'actual_failure_date', 'completion_by_date', 'status',
            'requester_name', 'created_at', 'approved_at'
        ]

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['wr_number'] = f"WR-{uuid4().hex[:6].upper()}"
        validated_data['status'] = "pending"
        validated_data['urgency'] = validated_data.get('urgency', 'medium')
        validated_data['wr_type'] = validated_data.get('wr_type', 'repair')

        if request and hasattr(request, 'user'):
            validated_data['requested_by'] = request.user
        else:
            raise serializers.ValidationError("User is not authenticated.")

        return super().create(validated_data)

    def get_requester_name(self, obj):
        return obj.requested_by.get_full_name() or obj.requested_by.username

# 🔧 WorkOrder Serializers


class WorkOrderUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkOrder
        fields = [
            'asset_group', 'asset_area', 'parent_asset', 'failure_cause',
            'resolution', 'cost', 'actual_failure_date', 'completion_by_date',
            'failure_code', 'status', 'wo_start_date'
        ]

class WorkOrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkOrder
        fields = ['status', 'wo_start_date', 'wo_completion_date', 'actual_duration']
        read_only_fields = ['wo_start_date', 'wo_completion_date', 'actual_duration']

    def update(self, instance, validated_data):
        new_status = validated_data.get("status")

        if new_status == "released" and instance.status != "released":
            instance.status = "released"
            instance.wo_start_date = timezone.now()
            instance.engineer = self.context["request"].user  # ✅ Fix here

        elif new_status == "completed" and instance.status != "completed":
            instance.status = "completed"
            instance.wo_completion_date = timezone.now()
            if instance.wo_start_date:
                instance.actual_duration = instance.wo_completion_date - instance.wo_start_date

        instance.save()
        return instance

# ⚡ EnergyInput Serializer
class EnergyInputSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnergyInput
        fields = "__all__"
        read_only_fields = ['user']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

# 📁 Document Serializer

# 📜 Audit Trail Serializer (Tambahan dari temanmu)
from django.contrib.admin.models import LogEntry
from django.contrib.contenttypes.models import ContentType

from .models import AuditTrail

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth.models import User

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework import serializers
from django.contrib.auth.models import User

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        # Check aktif
        if self.user.userprofile.status.strip().lower() != 'active':
            raise AuthenticationFailed('User account is inactive.')

        self.user = self.user
        # Tambahan data
        data['username'] = self.user.username
        data['user_id'] = self.user.id

        return data


    
class AuditTrailSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = AuditTrail
        fields = ['id', 'user', 'action', 'model_name', 'object_id', 'description', 'timestamp']

    def get_user(self, obj):
        return obj.user.username if obj.user else None


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = '__all__'

