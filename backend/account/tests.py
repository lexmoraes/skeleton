from unittest import mock

from channels.layers import get_channel_layer
from channels.testing import WebsocketCommunicator
from django.test import TestCase, override_settings
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from account import models
from config.asgi import application
from core import helpers

IN_MEMORY_CHANNEL_LAYERS = {'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'}}


def make_user(**overrides):
    fields = {
        'email': 'ana@example.com',
        'username': 'ana',
        'registration_number': '2024001',
        'password': 's3cret-pass',
    }
    fields.update(overrides)
    return models.AccountUser.objects.create_user(**fields)


class LoginTests(APITestCase):
    url = '/api/account/login/'

    def setUp(self):
        self.user = make_user()

    def login(self, identifier, password='s3cret-pass'):
        return self.client.post(self.url, {'identifier': identifier, 'password': password}, format='json')

    def test_accepts_email_username_or_registration_number_case_insensitively(self):
        for identifier in ('ana@example.com', 'ANA', '2024001'):
            with self.subTest(identifier=identifier):
                response = self.login(identifier)
                self.assertEqual(response.status_code, 200, response.data)
                self.assertEqual(response.data['user']['id'], self.user.id)
                self.assertIn('access', response.data)
                self.assertIn('refresh', response.data)

    def test_rejects_wrong_password_unknown_identifier_and_inactive_user(self):
        self.assertEqual(self.login('ana', password='wrong').status_code, 401)
        self.assertEqual(self.login('nobody').status_code, 401)
        make_user(email='off@example.com', username='off', registration_number='2024002', is_active=False)
        self.assertEqual(self.login('off').status_code, 401)

    def test_ambiguous_identifier_does_not_log_into_either_account(self):
        # Another user's username equals Ana's registration number.
        make_user(email='bob@example.com', username='2024001', registration_number='2024003')
        self.assertEqual(self.login('2024001').status_code, 401)

    def test_rotated_refresh_token_is_blacklisted(self):
        refresh = self.login('ana').data['refresh']
        first = self.client.post('/api/account/login/refresh/', {'refresh': refresh}, format='json')
        self.assertEqual(first.status_code, 200)
        reused = self.client.post('/api/account/login/refresh/', {'refresh': refresh}, format='json')
        self.assertEqual(reused.status_code, 401)


class AccountUserViewSetTests(APITestCase):
    def setUp(self):
        self.user = make_user()

    def test_me_requires_authentication_and_returns_current_user(self):
        self.assertEqual(self.client.get('/api/account/users/me/').status_code, 401)
        self.client.force_authenticate(self.user)
        response = self.client.get('/api/account/users/me/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['email'], 'ana@example.com')

    def test_listing_users_is_admin_only_and_filterable_by_identifier(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get('/api/account/users/').status_code, 403)

        admin = make_user(email='admin@example.com', username='admin', registration_number='1', is_staff=True)
        self.client.force_authenticate(admin)
        response = self.client.get('/api/account/users/', {'identifier': 'ANA'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual([u['id'] for u in response.data['results']], [self.user.id])


class NotifyAccountUpdatedReceiverTests(TestCase):
    def setUp(self):
        self.user = make_user()

    @mock.patch('account.tasks.notify_account_updated.delay')
    def test_profile_edit_dispatches_notification_after_commit(self, delay):
        with self.captureOnCommitCallbacks(execute=True):
            self.user.first_name = 'Ana'
            self.user.save()
        delay.assert_called_once_with(self.user.pk)

    @mock.patch('account.tasks.notify_account_updated.delay')
    def test_creation_and_last_login_bump_do_not_notify(self, delay):
        with self.captureOnCommitCallbacks(execute=True):
            make_user(email='new@example.com', username='new', registration_number='9')
            self.user.save(update_fields=['last_login'])
        delay.assert_not_called()


@override_settings(CHANNEL_LAYERS=IN_MEMORY_CHANNEL_LAYERS, ALLOWED_HOSTS=['testserver'])
class NotificationConsumerTests(TestCase):
    def setUp(self):
        self.user = make_user()
        self.token = str(AccessToken.for_user(self.user))

    def communicator(self, query=''):
        return WebsocketCommunicator(
            application, f'/ws/notifications/{query}', headers=[(b'origin', b'http://testserver')],
        )

    async def test_rejects_connection_without_valid_token(self):
        for query in ('', '?token=garbage'):
            with self.subTest(query=query):
                connected, _ = await self.communicator(query).connect()
                self.assertFalse(connected)

    async def test_user_receives_messages_sent_to_their_group_and_broadcast(self):
        communicator = self.communicator(f'?token={self.token}')
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        layer = get_channel_layer()
        await layer.group_send(helpers.user_group_name(self.user.id), {'type': 'group.message', 'content': {'n': 1}})
        self.assertEqual(await communicator.receive_json_from(), {'n': 1})
        await layer.group_send(helpers.BROADCAST_GROUP, {'type': 'group.message', 'content': {'n': 2}})
        self.assertEqual(await communicator.receive_json_from(), {'n': 2})
        await communicator.disconnect()
