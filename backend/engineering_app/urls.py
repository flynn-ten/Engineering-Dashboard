from django.urls import path
from .views import MeView, RegisterUserView, DivisionListView, WorkRequestStatusUpdateAPIView, CustomTokenObtainPairView, DocumentUploadView, DocumentListView, EnergyInputListView
from . import views
from .views import MeView, RegisterUserView, DivisionListView, UserListView, UserStatsView, WorkRequestCreateAPIView, EnergyInputCreateView, UserEnergyInputListView, latest_energy_inputs, UserStatusUpdateView, ResetUserPasswordView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('me/', MeView.as_view()),
    path('regist/', RegisterUserView.as_view()),
    path('divisions/', DivisionListView.as_view()),
    path('active-work-orders/', views.active_work_orders),
    path('unreleased-work-orders/', views.unreleased_work_orders),
    path('work-order-list/', views.work_order_list),
    path('work-request/', views.work_request_list),
    path("users/", UserListView.as_view(), name="user-list"),
    path('users/stats/', UserStatsView.as_view(), name='user-stats'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('energy/', views.energy),
    path('energy_monthly/', views.energyTrend),
    path('analytics/', views.analytic),
    path('category-analytics/', views.category_analytics),
    path('equipment-analytics/', views.equipment_analytics),
    path('monthly-trend/', views.monthly_trend),
    path('downtime/', views.weekly_downtime),
    path('energydaily/', views.energydaily),
    path('work-request/', WorkRequestCreateAPIView.as_view(), name='work-request'),
    path('work-request/create/', WorkRequestCreateAPIView.as_view(), name='work-request-create'),
    path("work-request/update-status/<int:pk>/", WorkRequestStatusUpdateAPIView.as_view(), name="update-work-request-status"),
    path('energy-input/create/', EnergyInputCreateView.as_view(), name='energy-input-create'),
    path('energy-input/my/', UserEnergyInputListView.as_view(), name='energy-input-my'),
    path('energy-input/latest/', latest_energy_inputs, name='latest-energy-inputs'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path("users/<int:pk>/status/", UserStatusUpdateView.as_view(), name="user-status-update"),
    path("users/<int:pk>/reset-password/", ResetUserPasswordView.as_view(), name="user-reset-password"),
    path('documents/upload/', DocumentUploadView.as_view(), name='upload-document'),
    path('documents/', DocumentListView.as_view(), name='document-list'),
    path('energy-input/', EnergyInputListView.as_view(), name='energy-input-list'),


]