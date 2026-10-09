import os

from celery import Celery
from celery.schedules import crontab
from kombu import Exchange, Queue

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('config')
app.config_from_object('django.conf:settings', namespace='CELERY')

# "default" takes on-demand work dispatched with .delay() from receivers and
# viewsets; "periodic" takes the beat schedule below, so a burst of on-demand
# tasks never delays housekeeping (and vice versa). Start a worker on both:
#   celery -A config worker -Q default,periodic -l info
app.conf.task_queues = (
    Queue('default', Exchange('default'), routing_key='default'),
    Queue('periodic', Exchange('periodic'), routing_key='periodic'),
)
app.conf.task_default_queue = 'default'

TASKS = {
    'flush_expired_tokens': {
        'task': 'account.tasks.flush_expired_tokens',
        'schedule': crontab(hour=3, minute=0),
        'options': {'queue': 'periodic'},
    },
}

app.conf.beat_schedule = TASKS

app.autodiscover_tasks()
