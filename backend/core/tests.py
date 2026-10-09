from django.test import SimpleTestCase

from core import helpers


class BuildObjectPathTests(SimpleTestCase):
    def test_slugifies_owner_and_sanitizes_filename(self):
        class Owner:
            name = 'Acme Corp'

        self.assertEqual(helpers.build_object_path(Owner(), 'reports', 'q1 report.pdf'), 'acme-corp/reports/q1_report.pdf')
        self.assertEqual(helpers.build_object_path('acme', 'avatars', '../../etc/passwd'), 'acme/avatars/....etcpasswd')


class RequiredFieldsErrorTests(SimpleTestCase):
    def test_maps_each_field_to_required_message(self):
        error = helpers.RequiredFieldsError(['name', 'email'])
        self.assertEqual(error.status_code, 400)
        self.assertEqual(
            {field: [str(m) for m in messages] for field, messages in error.detail.items()},
            {'name': ['This field is required.'], 'email': ['This field is required.']},
        )
