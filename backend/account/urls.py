from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from account import viewsets

router = DefaultRouter()
router.register('users', viewsets.AccountUserViewSet)

urlpatterns = [
    path('login/', viewsets.LoginView.as_view(), name='account-login'),
    path('login/refresh/', TokenRefreshView.as_view(), name='account-login-refresh'),
] + router.urls
