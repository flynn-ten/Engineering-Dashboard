from django.urls import path
from .views import MeView, RegisterUserView, DivisionListView, WorkOrderDetailAPIView, WorkOrderListCreateAPIView, WorkOrderStatusUpdateAPIView, WorkOrderUpdateAPIView, WorkRequestStatusUpdateAPIView
from . import views
from .views import MeView, RegisterUserView, DivisionListView, UserListView, UserStatsView, WorkRequestCreateAPIView
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
    path('work-request-update/', WorkRequestCreateAPIView.as_view(), name='work-request'),
    path('work-request/create/', WorkRequestCreateAPIView.as_view(), name='work-request-create'),
    path("work-request/update-status/<int:pk>/", WorkRequestStatusUpdateAPIView.as_view(), name="update-work-request-status"),
    path('work-order/update/<str:wo_number>/', WorkOrderUpdateAPIView.as_view(), name='work-order-update'),
    path('work-order/update-status/<str:wo_number>/', WorkOrderStatusUpdateAPIView.as_view(), name='work-order-status-update'),
    path("work-orders/<int:id>/update/", WorkOrderUpdateAPIView.as_view(), name="update-work-order"),
    path("work-orders/<int:id>/status/", WorkOrderStatusUpdateAPIView.as_view(), name="status-work-order"),
    path('work-orders/', WorkOrderListCreateAPIView.as_view(), name='workorder-list'),
    path('work-orders/<int:pk>/', WorkOrderDetailAPIView.as_view(), name='workorder-detail'),
    path("work-orders/<str:wo_number>/", WorkOrderUpdateAPIView.as_view(), name="workorder-update"),


]
