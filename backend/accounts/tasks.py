# backend/accounts/tasks.py - NEW FILE

from celery import shared_task
from django.utils import timezone
from accounts.models import UserReport, User
import logging

logger = logging.getLogger(__name__)

@shared_task
def check_auto_suspensions():
    """Auto-suspend users with 4+ reports"""
    from django.db.models import Count
    
    # Find users with 4+ pending reports
    users_to_check = UserReport.objects.filter(
        status='pending'
    ).values('reported_user').annotate(
        report_count=Count('id')
    ).filter(report_count__gte=4)
    
    suspended_count = 0
    
    for user_data in users_to_check:
        user = User.objects.get(id=user_data['reported_user'])
        
        if not user.is_suspended:
            # Suspend user
            user.is_suspended = True
            user.suspension_reason = f"Auto-suspended: {user_data['report_count']} reports"
            user.suspended_at = timezone.now()
            user.save()
            
            # Mark reports as actioned
            UserReport.objects.filter(
                reported_user=user,
                status='pending'
            ).update(
                status='action_taken',
                action_taken='User auto-suspended',
                reviewed_at=timezone.now()
            )
            
            suspended_count += 1
            logger.info(f"Auto-suspended user {user.id} with {user_data['report_count']} reports")
    
    return f"Suspended {suspended_count} users"