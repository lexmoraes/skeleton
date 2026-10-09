from django_filters import rest_framework as filters

from account import models


class AccountUserFilter(filters.FilterSet):
    email = filters.CharFilter(lookup_expr='icontains')
    username = filters.CharFilter(lookup_expr='icontains')
    registration_number = filters.CharFilter(lookup_expr='icontains')
    identifier = filters.CharFilter(method='filter_identifier')

    class Meta:
        model = models.AccountUser
        fields = ['is_active', 'is_staff']

    def filter_identifier(self, queryset, name, value):
        return queryset.by_identifier(value)
