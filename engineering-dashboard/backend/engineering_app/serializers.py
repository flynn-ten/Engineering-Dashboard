from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile, WorkOrder
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
    def get_requested_by_name(self, obj):
        return obj.requested_by.get_full_name() or obj.requested_by.username
    
from uuid import uuid4



class WorkOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkOrder
        fields = '__all__'
        read_only_fields = [
            'wo_number',
            'wo_created_at',
            'wo_start_date',
            'wo_completion_date',
            'actual_duration',
            'engineer',  # can be optional or handled manually depending on context
        ]

class WorkOrderUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkOrder
        fields = [
            'asset_group',
            'asset_area',
            'parent_asset',
            'failure_cause',
            'resolution',
            'cost',
            'actual_failure_date',
            'completion_by_date',
            'failure_code',
            'status',
            'wo_start_date',
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

            if instance.wo_start_date and instance.wo_completion_date:
                instance.actual_duration = instance.wo_completion_date - instance.wo_start_date

        instance.save()
        return instance
    
    
    