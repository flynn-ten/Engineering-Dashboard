from django.urls import path
from .views import (
    # 🔐 Auth & User
    MeView,
    RegisterUserView,
    DivisionListView,
    UserListView,
    UserStatsView,

    # 📊 Work Order (Raw SQL)
    active_work_orders,
    unreleased_work_orders,
    work_order_list,
    work_request_list,
    
    WorkRequestCreateAPIView,
    UserStatusUpdateView,
    EnergyInputCreateView,
    UserEnergyInputListView,
)

urlpatterns = [
    # 🔐 Auth & User
    path('me/', MeView.as_view(), name='me'),
    path('regist/', RegisterUserView.as_view(), name='register-user'),
    path('divisions/', DivisionListView.as_view(), name='division-list'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/stats/', UserStatsView.as_view(), name='user-stats'),

    # 📊 Work Order (Raw SQL)
    path('active-work-orders/', active_work_orders, name='active-work-orders'),
    path('unreleased-work-orders/', unreleased_work_orders, name='unreleased-work-orders'),
    path('work-order-list/', work_order_list, name='work-order-list'),
    path('work-request/', work_request_list, name='work-request-list-raw'),
    
    path('work-requests/create/', WorkRequestCreateAPIView.as_view(), name='work-request-create'),
    path("users/<int:pk>/status/", UserStatusUpdateView.as_view(), name="update-user-status"),
    
    path("energy-input/create/", EnergyInputCreateView.as_view(), name="energy-input-create"),
    path("energy-input/my/", UserEnergyInputListView.as_view(), name="energy-input-my"),


]




