# backend/roommates/tasks.py - Optional improvement
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

@shared_task
def expire_old_match_requests():
    """
    Auto-expire match requests older than 30 days
    Run daily via Celery Beat
    """
    from .models import MatchRequest
    
    expired_count = MatchRequest.objects.filter(
        status='pending',
        expires_at__lt=timezone.now()
    ).update(status='expired')
    
    logger.info(f"Expired {expired_count} old match requests")
    return f"Expired {expired_count} match requests"

@shared_task
def update_match_scores():
    """
    Recalculate match scores for active profiles
    Run weekly to keep scores current
    """
    from .models import RoommateProfile
    
    # Mark profiles for recalculation
    active_profiles = RoommateProfile.objects.filter(
        user__is_active=True,
        completion_percentage__gte=60
    )
    
    for profile in active_profiles:
        profile.last_match_calculation = timezone.now()
        profile.save(update_fields=['last_match_calculation'])
    
    return f"Updated {active_profiles.count()} profiles for matching"

@shared_task
def send_match_reminder(match_request_id):
    """
    Send reminder for pending match requests
    """
    from .models import MatchRequest
    from messaging.models import NotificationPreference
    from django.core.mail import send_mail
    from django.conf import settings
    
    try:
        match_request = MatchRequest.objects.get(
            id=match_request_id,
            status='pending'
        )
        
        # Check if been pending for 3+ days
        days_pending = (timezone.now() - match_request.created_at).days
        if days_pending < 3:
            return "Too early for reminder"
        
        # Check user preferences
        prefs, _ = NotificationPreference.objects.get_or_create(
            user=match_request.receiver
        )
        
        if not prefs.email_match_requests:
            return "User has disabled match emails"
        
        # Send reminder
        send_mail(
            subject='Pending Match Request Reminder',
            message=f"You have a pending match request from {match_request.sender.get_full_name()}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[match_request.receiver.email],
            fail_silently=False,
        )
        
        return "Reminder sent"
        
    except MatchRequest.DoesNotExist:
        return "Match request not found"
    except Exception as e:
        logger.error(f"Failed to send reminder: {e}")
        raise