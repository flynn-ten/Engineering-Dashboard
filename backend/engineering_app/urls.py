from django.urls import path
from .views import MeView, RegisterUserView, DivisionListView, UserListView, UserStatsView

urlpatterns = [
    path('me/', MeView.as_view()),
    path('regist/', RegisterUserView.as_view()),
    path('divisions/', DivisionListView.as_view()),
    path("users/", UserListView.as_view(), name="user-list"),
    path('users/stats/', UserStatsView.as_view(), name='user-stats'),
]
