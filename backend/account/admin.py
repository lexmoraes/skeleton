from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from account import models


@admin.register(models.AccountUser)
class AccountUserAdmin(UserAdmin):
    model = models.AccountUser
    ordering = ('email',)
    list_display = ('email', 'username', 'registration_number', 'first_name', 'last_name', 'is_staff', 'is_active')
    search_fields = ('email', 'username', 'registration_number', 'first_name', 'last_name')
    fieldsets = (
        (None, {'fields': ('email', 'username', 'registration_number', 'password')}),
        (_('Personal information'), {'fields': ('first_name', 'last_name', 'cellphone')}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'registration_number', 'password1', 'password2', 'is_staff', 'is_active'),
        }),
    )
