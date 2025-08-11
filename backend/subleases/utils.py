# backend/subleases/utils.py
from universities.models import University
from .models import SubleaseUniversityProximity
import math
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags


def calculate_sublease_proximities(sublease):
    """Calculate and store proximity to all universities"""
    if not sublease.latitude or not sublease.longitude:
        return
    
    # Get all universities at once
    universities = University.objects.all().values('id', 'latitude', 'longitude')
    
    proximities_to_create = []
    proximities_to_update = []
    
    existing_proximities = {
        p.university_id: p 
        for p in sublease.university_proximities.all()
    }
    
    for university in universities:
        distance = calculate_distance(
            float(sublease.latitude), 
            float(sublease.longitude),
            float(university['latitude']), 
            float(university['longitude'])
        )
        
        # Convert to meters
        distance_in_meters = int(distance * 1000)
        
        # Estimate walking time (average walking speed: 5 km/h)
        walking_time = int((distance_in_meters / 1000) * 12)  # 12 minutes per km
        
        if university['id'] in existing_proximities:
            # Update existing
            proximity = existing_proximities[university['id']]
            proximity.distance_in_meters = distance_in_meters
            proximity.walking_time_minutes = walking_time
            proximities_to_update.append(proximity)
        else:
            # Create new
            proximities_to_create.append(
                SubleaseUniversityProximity(
                    sublease=sublease,
                    university_id=university['id'],
                    distance_in_meters=distance_in_meters,
                    walking_time_minutes=walking_time
                )
            )
    
    # Bulk create and update
    if proximities_to_create:
        SubleaseUniversityProximity.objects.bulk_create(proximities_to_create)
    
    if proximities_to_update:
        SubleaseUniversityProximity.objects.bulk_update(
            proximities_to_update,
            ['distance_in_meters', 'walking_time_minutes']
        )


def calculate_distance(lat1, lon1, lat2, lon2):
    """Haversine formula to calculate distance between two points"""
    R = 6371  # Earth radius in kilometers
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = math.sin(dlat/2) * math.sin(dlat/2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dlon/2) * math.sin(dlon/2)
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c
    
    return distance

def send_application_notification(application):
    """Send email notification when someone applies to a sublease"""
    sublease = application.sublease
    owner = sublease.user
    
    if not owner.email:
        return
    
    subject = f'New Application for {sublease.title}'
    
    # Create email context
    context = {
        'owner_name': owner.first_name or owner.email,
        'sublease_title': sublease.title,
        'applicant_name': application.applicant.first_name or application.applicant.email,
        'move_in_date': application.move_in_date,
        'message': application.message,
        'dashboard_url': f"{settings.FRONTEND_URL}/dashboard/subleases/{sublease.id}/applications"
    }
    
    # Create plain text version
    plain_message = f"""
    Hi {context['owner_name']},
    
    You have received a new application for your sublease: {context['sublease_title']}
    
    Application Details:
    - Applicant: {context['applicant_name']}
    - Preferred Move-in Date: {context['move_in_date']}
    - Message: {context['message']}
    
    View the application at: {context['dashboard_url']}
    
    Best regards,
    micalli Team
    """
    
    # If you have an HTML template, use it
    try:
        html_message = render_to_string('subleases/email/new_application.html', context)
    except:
        # If template doesn't exist, use plain message
        html_message = None
    
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[owner.email],
        html_message=html_message,
        fail_silently=True
    )


def send_sublease_status_update(sublease, old_status, new_status):
    """Send email notification when sublease status changes"""
    if old_status == new_status:
        return
    
    # Notify applicants if sublease is filled
    if new_status == 'filled':
        applications = sublease.applications.filter(status='pending')
        for application in applications:
            send_application_status_email(
                application, 
                'Unfortunately, this sublease has been filled.'
            )


def send_application_status_email(application, message):
    """Send email to applicant about their application status"""
    applicant = application.applicant
    sublease = application.sublease
    
    if not applicant.email:
        return
    
    subject = f'Update on your application for {sublease.title}'
    
    plain_message = f"""
    Hi {applicant.first_name or applicant.email},
    
    There's an update on your application for: {sublease.title}
    
    Status: {application.get_status_display()}
    {message}
    
    Best regards,
    micalli Team
    """
    
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[applicant.email],
        fail_silently=True
    )
