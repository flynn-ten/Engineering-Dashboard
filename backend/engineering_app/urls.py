from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

from .views import (
    MeView, PlannedMaintenanceCreateView, RegisterUserView, DivisionListView, ReleaseScheduledWorkOrdersView, 
    UserListView, UserStatsView,
    WorkRequestCreateAPIView, WorkRequestStatusUpdateAPIView,
    WorkOrderListCreateAPIView, WorkOrderDetailAPIView, SendDailyReportAPIView,
    WorkOrderUpdateAPIView, WorkOrderStatusUpdateAPIView,AuditTrailListAPIView,
    EnergyInputCreateView,MeView, RegisterUserView, DivisionListView, WorkRequestStatusUpdateAPIView,  DocumentUploadView, DocumentListView, EnergyInputListView

)


urlpatterns = [

    # === 🔐 Auth & User ===    
    path("me/", MeView.as_view(), name="me"),
    path("regist/", RegisterUserView.as_view(), name="register"),
    path("divisions/", DivisionListView.as_view(), name="division-list"),
    path("users/", UserListView.as_view(), name="user-list"),
    path("users/stats/", UserStatsView.as_view(), name="user-stats"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),


    # === 🛠️ Work Request ===
    path("work-request/", WorkRequestCreateAPIView.as_view(), name="work-request"),
    path("work-request/create/", WorkRequestCreateAPIView.as_view(), name="work-request-create"),
    path("work-request/update-status/<int:pk>/", WorkRequestStatusUpdateAPIView.as_view(), name="work-request-status-update"),

    # === ⚙️ Work Order ===
    path("work-orders/", WorkOrderListCreateAPIView.as_view(), name="workorder-list"),
    path("work-orders/<int:pk>/", WorkOrderDetailAPIView.as_view(), name="workorder-detail"),  # GET/PUT detail
    path("work-orders/status/<str:wo_number>/", WorkOrderStatusUpdateAPIView.as_view(), name="workorder-status-update"),  # PATCH status (trigger email)
    path("work-orders/update/<str:wo_number>/", WorkOrderUpdateAPIView.as_view(), name="workorder-update"),  # Optional if used for form updates

    # === 📊 Analytics & Raw Data ===
    path("active-work-orders/", views.active_work_orders, name="active-work-orders"),
    path("unreleased-work-orders/", views.unreleased_work_orders, name="unreleased-work-orders"),
    path("work-order-list/", views.work_order_list, name="work-order-list"),
    path("work-request-list/", views.work_request_list, name="work-request-list"),
    path("analytics/", views.analytic, name="analytics"),
    path("category-analytics/", views.category_analytics, name="category-analytics"),
    path("equipment-analytics/", views.equipment_analytics, name="equipment-analytics"),
    path("monthly-trend/", views.monthly_trend, name="monthly-trend"),
    path("downtime/", views.weekly_downtime, name="weekly-downtime"),

    # === ⚡ Energy ===
    path("energy/", views.energy, name="energy-data"),
    path("energy_monthly/", views.energyTrend, name="energy-monthly-trend"),
    path("energydaily/", views.energydaily, name="energy-daily"),
    path("energy-input/create/", EnergyInputCreateView.as_view(), name="energy-input-create"),

    # === 📄 Documents (if used) ===
    path("documents/", views.DocumentListView.as_view(), name="document-list"),
    path("documents/upload/", views.DocumentUploadView.as_view(), name="document-upload"),

    # === 🧑‍💼 User Management (optional) ===
    path("users/<int:pk>/update-status/", views.UserStatusUpdateView.as_view(), name="user-status-update"),
    path("users/<int:pk>/reset-password/", views.ResetUserPasswordView.as_view(), name="user-password-reset"),
    path("audit-trail/", AuditTrailListAPIView.as_view(), name="audit-trail"),


    path('documents/upload/', DocumentUploadView.as_view(), name='upload-document'),
    path('documents/', DocumentListView.as_view(), name='document-list'),
    path('documents/<int:pk>/', DocumentUploadView.as_view(), name='document-detail'),
    path('energy-input/', EnergyInputListView.as_view(), name='energy-input-list'),
    path("planned-maintenance/create/", PlannedMaintenanceCreateView.as_view(), name="planned-maintenance-create"),
    path("release-scheduled-wo/", ReleaseScheduledWorkOrdersView.as_view(), name="release-scheduled-wo"),
    path('send-daily-report/', SendDailyReportAPIView.as_view(), name='send-daily-report'),

]
