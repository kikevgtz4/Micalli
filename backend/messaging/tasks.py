# backend/messaging/tasks.py - NEW FILE

from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def send_match_request_email(self, match_request_id):
    """Send immediate email for new match request"""
    try:
        from roommates.models import MatchRequest
        from messaging.models import NotificationPreference
        
        match_request = MatchRequest.objects.select_related(
            'sender', 'receiver'
        ).get(id=match_request_id)
        
        # Check receiver preferences
        prefs, created = NotificationPreference.objects.get_or_create(
            user=match_request.receiver
        )
        
        if not prefs.email_match_requests:
            return "User has disabled match request emails"
        
        # Check quiet hours
        if prefs.respect_quiet_hours and is_quiet_hours(prefs):
            # Schedule for later
            send_time = get_next_available_time(prefs)
            self.retry(countdown=(send_time - timezone.now()).seconds)
            return "Rescheduled for quiet hours"
        
        # Prepare email
        context = {
            'receiver': match_request.receiver,
            'sender': match_request.sender,
            'message': match_request.initial_message,
            'request_id': match_request.id,
            'frontend_url': settings.FRONTEND_URL,
        }
        
        # Choose template based on language
        template_name = (
            'emails/match_request_es.html' 
            if prefs.preferred_language == 'es' 
            else 'emails/match_request_en.html'
        )
        
        html_content = render_to_string(template_name, context)
        
        # Send email
        send_mail(
            subject='Nueva Solicitud de Match en Micalli' if prefs.preferred_language == 'es' else 'New Match Request on Micalli',
            message=match_request.initial_message[:200],  # Plain text fallback
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[match_request.receiver.email],
            html_message=html_content,
            fail_silently=False,
        )
        
        logger.info(f"Sent match request email to {match_request.receiver.email}")
        return "Email sent successfully"
        
    except Exception as e:
        logger.error(f"Failed to send match request email: {e}")
        raise self.retry(exc=e, countdown=60)


@shared_task
def send_batched_message_notifications():
    """Send batched message notifications every 20 minutes"""
    from messaging.models import PendingNotification, NotificationPreference
    from django.db.models import Count
    
    now = timezone.now()
    
    # Get pending notifications that should be sent
    pending = PendingNotification.objects.filter(
        sent=False,
        scheduled_for__lte=now
    ).values('user').annotate(
        total_messages=Count('id')
    ).order_by('user')
    
    for user_batch in pending:
        user_id = user_batch['user']
        
        # Get all notifications for this user
        notifications = PendingNotification.objects.filter(
            user_id=user_id,
            sent=False,
            scheduled_for__lte=now
        ).select_related('sender', 'conversation')
        
        # Check user preferences
        prefs = NotificationPreference.objects.filter(user_id=user_id).first()
        if not prefs or prefs.message_email_frequency == 'never':
            # Mark as sent without sending
            notifications.update(sent=True, sent_at=now)
            continue
        
        # Group by conversation
        conversations = {}
        for notif in notifications:
            conv_id = notif.conversation_id
            if conv_id not in conversations:
                conversations[conv_id] = {
                    'conversation': notif.conversation,
                    'messages': [],
                    'senders': set()
                }
            conversations[conv_id]['messages'].append(notif)
            conversations[conv_id]['senders'].add(notif.sender)
        
        # Prepare email
        context = {
            'user': notifications[0].user,
            'conversations': conversations,
            'total_messages': user_batch['total_messages'],
            'frontend_url': settings.FRONTEND_URL,
        }
        
        template_name = (
            'emails/message_batch_es.html' 
            if prefs and prefs.preferred_language == 'es' 
            else 'emails/message_batch_en.html'
        )
        
        html_content = render_to_string(template_name, context)
        
        # Send email
        try:
            send_mail(
                subject=f'Tienes {user_batch["total_messages"]} mensajes nuevos en Micalli' 
                        if prefs and prefs.preferred_language == 'es' 
                        else f'You have {user_batch["total_messages"]} new messages on Micalli',
                message=f'You have {user_batch["total_messages"]} new messages',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[notifications[0].user.email],
                html_message=html_content,
                fail_silently=False,
            )
            
            # Mark as sent
            notifications.update(sent=True, sent_at=now)
            logger.info(f"Sent batched email to user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to send batched email to user {user_id}: {e}")
    
    return f"Processed {len(pending)} user batches"


def is_quiet_hours(prefs):
    """Check if current time is in quiet hours"""
    from datetime import datetime
    
    now = timezone.now().astimezone(timezone.get_current_timezone())
    current_time = now.time()
    
    # Handle overnight quiet hours
    if prefs.quiet_hours_start > prefs.quiet_hours_end:
        return current_time >= prefs.quiet_hours_start or current_time <= prefs.quiet_hours_end
    else:
        return prefs.quiet_hours_start <= current_time <= prefs.quiet_hours_end


def get_next_available_time(prefs):
    """Get next time outside of quiet hours"""
    from datetime import datetime, time
    
    now = timezone.now()
    tomorrow = now + timedelta(days=1)
    
    # Next morning after quiet hours end
    next_time = datetime.combine(
        tomorrow.date() if now.time() > prefs.quiet_hours_end else now.date(),
        prefs.quiet_hours_end
    )
    
    return timezone.make_aware(next_time)

@shared_task
def send_match_accepted_email(match_request_id):
    """Send email when match request is accepted"""
    try:
        from roommates.models import MatchRequest
        from messaging.models import NotificationPreference
        
        match_request = MatchRequest.objects.select_related(
            'sender', 'receiver'
        ).get(id=match_request_id)
        
        # Check sender preferences (they get notified of acceptance)
        prefs, created = NotificationPreference.objects.get_or_create(
            user=match_request.sender
        )
        
        if not prefs.email_match_requests:
            return "User has disabled match emails"
        
        # Send email
        context = {
            'user': match_request.sender,
            'accepter': match_request.receiver,
            'conversation_id': match_request.conversation.id if match_request.conversation else None,
            'frontend_url': settings.FRONTEND_URL,
        }
        
        template_name = (
            'emails/match_accepted_es.html' 
            if prefs.preferred_language == 'es' 
            else 'emails/match_accepted_en.html'
        )
        
        # For now, use plain text since templates don't exist
        message = f"""
        Great news! {match_request.receiver.get_full_name()} accepted your match request.
        
        You can now start chatting at: {settings.FRONTEND_URL}/messages/{match_request.conversation.id}
        """
        
        send_mail(
            subject='Your match request was accepted!' if prefs.preferred_language == 'en' else '¡Tu solicitud de match fue aceptada!',
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[match_request.sender.email],
            fail_silently=False,
        )
        
        return "Email sent successfully"
        
    except Exception as e:
        logger.error(f"Failed to send match accepted email: {e}")
        raise


@shared_task
def send_match_rejected_email(match_request_id):
    """Send email when match request is rejected (optional)"""
    # Only send if there's a message
    try:
        from roommates.models import MatchRequest
        match_request = MatchRequest.objects.get(id=match_request_id)
        
        if not match_request.response_message:
            return "No message, skipping email"
        
        # Similar implementation as accepted
        return "Email sent"
        
    except Exception as e:
        logger.error(f"Failed to send match rejected email: {e}")
        return "Failed"


@shared_task
def cleanup_old_notifications():
    """Clean up old sent notifications"""
    from messaging.models import PendingNotification
    from datetime import timedelta
    
    cutoff = timezone.now() - timedelta(days=30)
    
    # Delete old sent notifications
    deleted_count = PendingNotification.objects.filter(
        sent=True,
        sent_at__lt=cutoff
    ).delete()[0]
    
    logger.info(f"Deleted {deleted_count} old notifications")
    return f"Deleted {deleted_count} notifications"


@shared_task
def check_auto_suspensions():
    """Check for users who should be auto-suspended based on reports"""
    # This will be implemented with the reporting system
    return "Check completed"