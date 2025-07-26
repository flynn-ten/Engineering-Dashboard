from django.contrib.auth.models import User
from django.db import models
import uuid

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('engineer', 'Engineer'),
        ('utility', 'Utility Team'),
        ('qac', 'QAC/Compliance'),
        ('requester', 'Division Req'),
    ]
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
        ('Pending', 'Pending'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='userprofile')
    full_name = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    division = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    avatar = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.full_name

class active_work_orders(models.Model):
    # Define the fields in your table
    wo_description = models.CharField(max_length=255)
    wo_cost = models.DecimalField(max_digits=10, decimal_places=2)
    wo_status = models.CharField(max_length=50)
    wo_created_date = models.DateTimeField()

    def __str__(self):
        return self.wo_description
    
class unrealesed_work_orders(models.Model):
    # Define the fields in your table
    wo_description = models.CharField(max_length=255)
    wo_cost = models.DecimalField(max_digits=10, decimal_places=2)
    wo_status = models.CharField(max_length=50)
    wo_created_date = models.DateTimeField()

    def __str__(self):
        return self.wo_description
    
class WorkOrderList(models.Model):
    # Define the fields in your table
    no = models.IntegerField()
    title = models.CharField(max_length=100)
    wo_description = models.CharField(max_length=255)
    resource = models.CharField(max_length=100)
    wo_type = models.CharField(max_length=50)
    wo_status = models.CharField(max_length=50)
    wo_created_date = models.DateTimeField()
    wr_requestor = models.CharField(max_length=100)
    wo_actual_completion_date = models.DateTimeField()
    actual_duration = models.DurationField()

    def __str__(self):
        return self.wo_description

class WorkRequest(models.Model):
    wr_number = models.BigIntegerField(unique=True)
    title = models.CharField(max_length=255)
    wo_description = models.TextField()
    wr_type = models.CharField(max_length=100, default="Perbaikan")
    resource = models.CharField(max_length=50)
    
    asset_number = models.CharField(max_length=50)
    asset_department = models.CharField(max_length=50)

    wr_requestor = models.ForeignKey(User, on_delete=models.CASCADE)
    wr_request_by_date = models.DateField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    year = models.IntegerField()
    month = models.IntegerField()
    week_of_month = models.IntegerField()

    status = models.CharField(max_length=50, default="Pending")
    urgency = models.CharField(max_length=50, default="Normal")

    def __str__(self):
        return f"{self.wr_number} - {self.title}"

class WORequesterTwo(models.Model):
    RESOURCE_CHOICES = [
        ('MTC', 'Maintenance'),
        ('CAL', 'Calibration'),
        ('UTY', 'Utility'),
    ]

    DEPARTMENT_CHOICES = [
        ('EN', 'Engineering'),
        ('GA', 'General Affairs'),
        ('PD', 'Production'),
        ('QA', 'Quality Assurance'),
        ('QC', 'Quality Control'),
        ('RD', 'Research & Development'),
        ('WH', 'Warehouse'),
    ]

    
    wr_number = models.BigIntegerField(unique=True)
    title = models.CharField(max_length=255)
    wo_description = models.TextField()
    wr_type = models.CharField(max_length=50)  # e.g., 'Perbaikan', 'Kalibrasi'
    wr_requestor = models.ForeignKey(User, on_delete=models.CASCADE)  # Jika pakai auth
    wr_request_by_date = models.DateField()
    year = models.IntegerField()
    month = models.IntegerField()
    week_of_month = models.IntegerField()
    resource = models.CharField(max_length=10, choices=RESOURCE_CHOICES)
    asset_number = models.CharField(max_length=50)
    asset_department = models.CharField(max_length=10, choices=DEPARTMENT_CHOICES)
    urgency = models.CharField(max_length=50, default="Normal")
    status = models.CharField(max_length=50, default="Pending")

    def __str__(self):
        return self.date
    
class analytics(models.Model):
    wo_number = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    scheduled_start = models.DateTimeField(blank=True, null=True)
    scheduled_completion = models.DateTimeField(blank=True, null=True)
    actual_failure_date = models.DateTimeField(blank=True, null=True)

    asset_code = models.CharField(max_length=100, blank=True, null=True)
    asset_group = models.CharField(max_length=100, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)  # optional
    updated_at = models.DateTimeField(auto_now=True)      # optional

    def __str__(self):
        return f"{self.wo_number} - {self.title}"
    
class WorkRequest(models.Model):
    URGENCY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    WR_TYPE_CHOICES = [
        ('repair', 'Repair'),
        ('inspection', 'Inspection'),
        ('corrective', 'Corrective'),
        ('modification', 'Modification'),
        ('routine', 'Routine Check'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('in_review', 'In Review'),
    ]

    wr_number = models.CharField(max_length=100, unique=True, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    asset_number = models.CharField(max_length=100)
    asset_department = models.CharField(max_length=100)
    resource = models.CharField(max_length=100)
    urgency = models.CharField(max_length=10, choices=URGENCY_CHOICES)
    wr_type = models.CharField(max_length=20, choices=WR_TYPE_CHOICES)
    
    failure_code = models.CharField(max_length=100, blank=True, null=True)
    failure_cause = models.TextField(blank=True, null=True)
    resolution = models.TextField(blank=True, null=True)
    actual_failure_date = models.DateField(blank=True, null=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='work_requests')
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.wr_number:
            self.wr_number = f"WR-{uuid.uuid4().hex[:6].upper()}"
        if self.status == 'approved' and not self.approved_at:
            from django.utils import timezone
            self.approved_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.wr_number
