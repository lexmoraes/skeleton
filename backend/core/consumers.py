from urllib.parse import parse_qs

from channels.generic.websocket import AsyncJsonWebsocketConsumer

from core import helpers


class Consumer(AsyncJsonWebsocketConsumer):
    """Server -> client notifications.

    Browsers can't set headers on a WebSocket handshake, so the JWT access
    token goes in the query string: ws://<host>/ws/notifications/?token=<access>.
    Each socket joins its user's group plus the broadcast group; push to them
    from sync code with helpers.send_user_message / send_broadcast_message.
    """

    async def connect(self):
        query = parse_qs(self.scope['query_string'].decode())
        user = await helpers.get_user_from_token(query.get('token', [None])[0])
        if user is None:
            await self.close()
            return

        self.joined_groups = [helpers.user_group_name(user.id), helpers.BROADCAST_GROUP]
        await self.accept()
        for group in self.joined_groups:
            await self.channel_layer.group_add(group, self.channel_name)

    async def disconnect(self, close_code):
        for group in getattr(self, 'joined_groups', []):
            await self.channel_layer.group_discard(group, self.channel_name)

    async def group_message(self, event: dict):
        await self.send_json(event['content'])

    async def receive_json(self, content, **kwargs):
        pass
