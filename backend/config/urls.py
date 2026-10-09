"""
URL configuration for the skeleton project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/account/', include('account.urls')),
    # Add your own apps' url includes here, e.g.:
    # path('api/core/', include('core.urls')),
]

# Served directly by Django (fine at small scale); move to object storage
# or an nginx-served volume if upload traffic grows significantly.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
