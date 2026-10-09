"""
ASGI config for the skeleton project.

It exposes the ASGI callable as a module-level variable named ``application``.
HTTP goes to Django as usual; WebSocket connections are routed by
config/routing.py to the Channels consumers.

For more information on this file, see
https://docs.djangoproject.com/en/6.1/howto/deployment/asgi/
"""

import os

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Must run before importing routing: it sets Django up, and the consumers
# behind routing import models.
django_asgi_app = get_asgi_application()

from config import routing  # noqa: E402

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AllowedHostsOriginValidator(URLRouter(routing.urlrouter)),
})
