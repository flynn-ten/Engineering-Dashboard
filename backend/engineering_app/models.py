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
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Active')
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
    wr_number = models.IntegerField()
    title = models.CharField(max_length=100)
    wo_description = models.CharField(max_length=255)
    resource = models.CharField(max_length=100)
    wr_type = models.CharField(max_length=50)
    wr_request_by_date = models.DateTimeField()
    wr_requestor = models.CharField(max_length=100)
    year = models.IntegerField()
    month = models.IntegerField()
    week_of_month = models.IntegerField()

    def __str__(self):
        return self.title

class energy(models.Model):
    # Define the fields in your table
    date = models.DateTimeField(max_length=50)
    water_consumption = models.CharField(max_length=50)
    cng_consumption = models.CharField(max_length=50)
    electricity_consumption = models.CharField(max_length=50)
    year = models.CharField(max_length=100)
    month = models.CharField(max_length=100)
    day = models.CharField(max_length=100)
    week_of_month = models.CharField(max_length=100)

    def __str__(self):
        return self.date
    
class energy_trend(models.Model):
    # Define the fields in your table
    month_name = models.CharField(max_length=50)
    water_monthly = models.CharField(max_length=50)
    cng_monthly = models.CharField(max_length=50)
    electricity_monthly = models.CharField(max_length=50)
    month_number = models.CharField(max_length=100)

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


class EnergyInput(models.Model):
    ENERGY_TYPES = [
        ("listrik", "Listrik"),
        ("air", "Air"),
        ("cng", "CNG"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="energy_inputs")
    date = models.DateField()
    type = models.CharField(max_length=10, choices=ENERGY_TYPES)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    meter_number = models.CharField(max_length=100)
    photo = models.ImageField(upload_to="energy_photos/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type} - {self.meter_number} - {self.date}"

from django.db import models
from django.contrib.auth.models import User

class Document(models.Model):
    CATEGORY_CHOICES = [
        ("SOP", "SOP"),
        ("Manual", "Manual"),
        ("Form", "Form"),
        ("Specification", "Specification"),
        ("Work Instruction", "Work Instruction"),
    ]

    DEPARTMENT_CHOICES = [
        ("Engineering", "Engineering"),
        ("Quality", "Quality"),
        ("Utility", "Utility"),
        ("Safety", "Safety"),
        ("Production", "Production"),
    ]

    STATUS_CHOICES = [
        ("Draft", "Draft"),
        ("Active", "Active"),
        ("Archived", "Archived"),
    ]

    file_name = models.CharField(max_length=255)
    file_url = models.URLField()  # Supabase public URL
    version = models.CharField(max_length=20)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    department = models.CharField(max_length=100, choices=DEPARTMENT_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    description = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.file_name} ({self.version})"
