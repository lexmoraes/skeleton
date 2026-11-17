from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from account import filters, models, serializers


class LoginView(TokenObtainPairView):
    """Public (simplejwt's views set no permission/authentication classes).
    Throttled per client IP — rate in REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']."""

    serializer_class = serializers.LoginSerializer
    throttle_scope = 'login'


class AccountUserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.AccountUser.objects.all()
    serializer_class = serializers.AccountUserSerializer
    filterset_class = filters.AccountUserFilter
    permission_classes = [permissions.IsAdminUser]
    ordering_fields = ('id', 'email', 'username', 'registration_number', 'date_joined')
    ordering = ('-id',)

    @action(methods=['get'], detail=False, permission_classes=[permissions.IsAuthenticated])
    def me(self, request, *args, **kwargs):
        return Response(self.get_serializer(request.user).data)
