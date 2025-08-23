# backend/roommates/tasks.py - Optional improvement
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from accounts.models import User
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

@shared_task
def generate_match_suggestions(user_id):
    """Generate AI-powered match suggestions for a user"""
    from .models import RoommateProfile, MatchSuggestion
    from .matching import RoommateMatchingEngine
    from django.utils import timezone
    from datetime import timedelta
    
    try:
        user = User.objects.get(id=user_id)
        profile = RoommateProfile.objects.get(user=user)
        
        # Initialize matching engine
        engine = RoommateMatchingEngine()
        
        # Find top matches
        matches = engine.find_matches(
            profile,
            limit=20,
            min_score=Decimal('60.00')
        )
        
        # Clear old suggestions
        MatchSuggestion.objects.filter(
            user=user,
            status='pending'
        ).delete()
        
        # Create new suggestions
        for match_profile, score, details in matches[:10]:
            # Generate explanation
            explanation = generate_match_explanation(
                profile, match_profile, details
            )
            
            MatchSuggestion.objects.create(
                user=user,
                suggested_profile=match_profile,
                compatibility_score=score,
                factor_scores=details['factor_scores'],
                explanation=explanation['text'],
                key_compatibilities=explanation['pros'],
                potential_conflicts=explanation['cons'],
                expires_at=timezone.now() + timedelta(days=7)
            )
        
        logger.info(f"Generated {len(matches)} suggestions for user {user_id}")
        return f"Generated {len(matches)} suggestions"
        
    except Exception as e:
        logger.error(f"Failed to generate suggestions for user {user_id}: {e}")
        raise

def generate_match_explanation(profile1, profile2, details):
    """Generate human-readable explanation for match"""
    pros = []
    cons = []
    
    # Analyze factor scores
    for factor, score in details['factor_scores'].items():
        if score >= 0.8:
            pros.append(f"Great {factor.replace('_', ' ')} compatibility")
        elif score <= 0.3:
            cons.append(f"Different {factor.replace('_', ' ')} preferences")
    
    # Generate explanation text
    score = details['overall_score']
    if score >= 90:
        text = "You two would be excellent roommates! "
    elif score >= 80:
        text = "This is a very promising match. "
    elif score >= 70:
        text = "You have good compatibility. "
    else:
        text = "There's potential here. "
    
    if pros:
        text += f"You both share {', '.join(pros[:2])}. "
    if cons:
        text += f"Be aware of {', '.join(cons[:2])}."
    
    return {
        'text': text,
        'pros': pros[:3],
        'cons': cons[:3]
    }