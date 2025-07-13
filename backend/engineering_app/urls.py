from django.urls import path
from .views import MeView, RegisterUserView, DivisionListView

urlpatterns = [
    path('me/', MeView.as_view()),
    path('regist/', RegisterUserView.as_view()),
    path('divisions/', DivisionListView.as_view()),
]
