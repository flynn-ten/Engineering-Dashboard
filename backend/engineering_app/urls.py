from django.urls import path
<<<<<<< HEAD
from .views import MeView, RegisterUserView, DivisionListView
from . import views
from .views import MeView, RegisterUserView, DivisionListView, UserListView, UserStatsView
from rest_framework_simplejwt.views import TokenRefreshView
=======
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

    # 📝 Work Request (Model-based)
    WORequesterListAPIView,
    WORequesterCreateAPIView,
)
>>>>>>> bd5f93c570d713006d9458112bb727d9a5503c8f

urlpatterns = [
    # 🔐 Auth & User
    path('me/', MeView.as_view(), name='me'),
    path('regist/', RegisterUserView.as_view(), name='register-user'),
    path('divisions/', DivisionListView.as_view(), name='division-list'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/stats/', UserStatsView.as_view(), name='user-stats'),
<<<<<<< HEAD
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('energy/', views.energy),
    path('energy_monthly/', views.energyTrend),
=======

    # 📊 Work Order (Raw SQL)
    path('active-work-orders/', active_work_orders, name='active-work-orders'),
    path('unreleased-work-orders/', unreleased_work_orders, name='unreleased-work-orders'),
    path('work-order-list/', work_order_list, name='work-order-list'),
    path('work-request/', work_request_list, name='work-request-list-raw'),

    # 📝 Work Request (Model-based)
    path('work-requests/', WORequesterListAPIView.as_view(), name='work-request-list'),
    path('work-requests/create/', WORequesterCreateAPIView.as_view(), name='create-work-request'),
>>>>>>> bd5f93c570d713006d9458112bb727d9a5503c8f
]
