from django.urls import path

from core import consumers

urlrouter = [
    path('ws/notifications/', consumers.Consumer.as_asgi()),
]
