# Final merged version of models.py (gabungan dari "lama" dan "baru")
from django.utils import timezone
from django.contrib.auth.models import User
from django.db import models
import uuid

# ===============================
# User Profile
# ===============================
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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    avatar = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.full_name

# ===============================
# Work Request
# ===============================
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
    asset_number = models.CharField(max_length=100, default='UNKNOWN')
    asset_department = models.CharField(max_length=100, default='EN')
    resource = models.CharField(max_length=100, default='MTC')
    urgency = models.CharField(max_length=10, choices=URGENCY_CHOICES)
    wr_type = models.CharField(max_length=20, choices=WR_TYPE_CHOICES)

    failure_code = models.CharField(max_length=100, blank=True, null=True)
    failure_cause = models.TextField(blank=True, null=True)
    resolution = models.TextField(blank=True, null=True)
    actual_failure_date = models.DateField(null=True, blank=True)
    completion_by_date = models.DateField(null=True, blank=True)


    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='work_requests')
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.wr_number:
            self.wr_number = f"WR-{uuid.uuid4().hex[:6].upper()}"
        if self.status == 'approved' and not self.approved_at:
            self.approved_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.wr_number

# ===============================
# Work Order
# ===============================
class WorkOrder(models.Model):
    STATUS_CHOICES = [
        ('unreleased', 'Unreleased'),
        ('released', 'Released'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    work_request = models.OneToOneField(WorkRequest, on_delete=models.CASCADE, related_name="work_order")
    wo_number = models.CharField(max_length=100, unique=True, editable=False)
    wr_number = models.CharField(max_length=100, default="WR-DEFAULT")
    title = models.CharField(max_length=255, default="No title")
    description = models.TextField(default="No description")

    asset_number = models.CharField(max_length=100, default='UNKNOWN')
    asset_department = models.CharField(max_length=100, default='EN')
    asset_group = models.CharField(max_length=100, blank=True, null=True)
    asset_area = models.CharField(max_length=100, blank=True, null=True)
    parent_asset = models.CharField(max_length=100, blank=True, null=True)

    resource = models.CharField(max_length=100, default='EN')
    urgency = models.CharField(max_length=10, default='UNKNOWN')
    wo_type = models.CharField(max_length=50, default='UNKNOWN')

    failure_code = models.CharField(max_length=100, blank=True, null=True)
    failure_cause = models.TextField(blank=True, null=True)
    resolution = models.TextField(blank=True, null=True)
    actual_failure_date = models.DateField(blank=True, null=True)
    completion_by_date = models.DateField(blank=True, null=True)
    cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unreleased')
    wo_created_at = models.DateTimeField(auto_now_add=True)
    wo_start_date = models.DateTimeField(blank=True, null=True)
    wo_completion_date = models.DateTimeField(blank=True, null=True)
    actual_duration = models.DurationField(blank=True, null=True)
    requester = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    engineer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='work_orders')

    def save(self, *args, **kwargs):
        if not self.wo_number:
            self.wo_number = f"WO-{uuid.uuid4().hex[:6].upper()}"
        if self.status == 'released' and not self.wo_start_date:
            self.wo_start_date = timezone.now()
        if self.status == 'completed' and not self.wo_completion_date:
            self.wo_completion_date = timezone.now()
            if self.wo_start_date:
                self.actual_duration = self.wo_completion_date - self.wo_start_date
        super().save(*args, **kwargs)

    def __str__(self):
        return self.wo_number

# ===============================
# Analytics, Energy, Document
# ===============================
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.wo_number} - {self.title}"

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
    file_url = models.URLField()
    version = models.CharField(max_length=20)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    department = models.CharField(max_length=100, choices=DEPARTMENT_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    description = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.file_name} ({self.version})"

# ===============================
# Raw-table models untuk SQL mapping
# ===============================
class active_work_orders(models.Model):
    wo_description = models.CharField(max_length=255)
    wo_cost = models.DecimalField(max_digits=10, decimal_places=2)
    wo_status = models.CharField(max_length=50)
    wo_created_date = models.DateTimeField()

    def __str__(self):
        return self.wo_description

class unrealesed_work_orders(models.Model):
    wo_description = models.CharField(max_length=255)
    wo_cost = models.DecimalField(max_digits=10, decimal_places=2)
    wo_status = models.CharField(max_length=50)
    wo_created_date = models.DateTimeField()

    def __str__(self):
        return self.wo_description

class WorkOrderList(models.Model):
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

class energy(models.Model):
    date = models.DateTimeField()
    water_consumption = models.CharField(max_length=50)
    cng_consumption = models.CharField(max_length=50)
    electricity_consumption = models.CharField(max_length=50)
    year = models.CharField(max_length=100)
    month = models.CharField(max_length=100)
    day = models.CharField(max_length=100)
    week_of_month = models.CharField(max_length=100)

    def __str__(self):
        return str(self.date)

class energy_trend(models.Model):
    month_name = models.CharField(max_length=50)
    water_monthly = models.CharField(max_length=50)
    cng_monthly = models.CharField(max_length=50)
    electricity_monthly = models.CharField(max_length=50)
    month_number = models.CharField(max_length=100)

    def __str__(self):
        return self.month_name
