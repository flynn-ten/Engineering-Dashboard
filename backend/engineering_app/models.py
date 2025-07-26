from django.contrib.auth.models import User
from django.db import models

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
<<<<<<< HEAD
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
    
=======
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
        return f"{self.wr_number} - {self.title}"
>>>>>>> bd5f93c570d713006d9458112bb727d9a5503c8f
