from django.urls import path
from .views import MeView, RegisterUserView, DivisionListView
from . import views
from .views import MeView, RegisterUserView, DivisionListView, UserListView, UserStatsView
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
]
