# backend/micalli_backend/celery.py - NEW FILE

import os
from celery import Celery
from django.conf import settings

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'micalli_backend.settings')

# Create Celery app
app = Celery('micalli_backend')

# Configure from Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all installed apps
app.autodiscover_tasks()

# Beat schedule for periodic tasks
from celery.schedules import crontab

app.conf.beat_schedule = {
    'send-batched-message-notifications': {
        'task': 'messaging.tasks.send_batched_message_notifications',
        'schedule': crontab(minute='*/20'),  # Every 20 minutes
    },
    'cleanup-old-notifications': {
        'task': 'messaging.tasks.cleanup_old_notifications',
        'schedule': crontab(hour=3, minute=0),  # Daily at 3 AM
    },
    'check-suspended-users': {
        'task': 'accounts.tasks.check_auto_suspensions',
        'schedule': crontab(minute='*/30'),  # Every 30 minutes
    },
    'expire-old-match-requests': {
        'task': 'roommates.tasks.expire_old_match_requests',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    },
    'update-match-scores': {
        'task': 'roommates.tasks.update_match_scores',
        'schedule': crontab(day_of_week=1, hour=3, minute=0),  # Weekly on Monday at 3 AM
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')