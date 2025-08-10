# backend/subleases/utils.py
from universities.models import University
from .models import SubleaseUniversityProximity
import math
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
import os
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags


def calculate_sublease_proximities(sublease):
    """Calculate and store proximity to all universities"""
    if not sublease.latitude or not sublease.longitude:
        return
    
    universities = University.objects.all()
    
    for university in universities:
        distance = calculate_distance(
            float(sublease.latitude), 
            float(sublease.longitude),
            float(university.latitude), 
            float(university.longitude)
        )
        
        # Convert to meters
        distance_in_meters = int(distance * 1000)
        
        # Estimate walking time (average walking speed: 5 km/h)
        walking_time = int((distance_in_meters / 1000) * 12)  # 12 minutes per km
        
        SubleaseUniversityProximity.objects.update_or_create(
            sublease=sublease,
            university=university,
            defaults={
                'distance_in_meters': distance_in_meters,
                'walking_time_minutes': walking_time,
            }
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


def process_sublease_image(image_field):
    """Process and optimize sublease images"""
    if not image_field:
        return
    
    img = Image.open(image_field)
    
    # Convert RGBA to RGB if necessary
    if img.mode in ('RGBA', 'LA', 'P'):
        rgb_img = Image.new('RGB', img.size, (255, 255, 255))
        rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
        img = rgb_img
    
    # Resize if too large (max 1920x1080)
    max_width = 1920
    max_height = 1080
    
    if img.width > max_width or img.height > max_height:
        img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
    
    # Save optimized image
    output = BytesIO()
    img.save(output, format='JPEG', quality=85, optimize=True)
    output.seek(0)
    
    # Update the image field
    filename = os.path.splitext(image_field.name)[0]
    image_field.save(
        f"{filename}.jpg",
        ContentFile(output.read()),
        save=False
    )


def create_thumbnail(image_field):
    """Create thumbnail for sublease image"""
    if not image_field:
        return None
    
    img = Image.open(image_field)
    
    # Convert to RGB if necessary
    if img.mode in ('RGBA', 'LA', 'P'):
        rgb_img = Image.new('RGB', img.size, (255, 255, 255))
        rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
        img = rgb_img
    
    # Create thumbnail (400x300)
    img.thumbnail((400, 300), Image.Resampling.LANCZOS)
    
    # Save thumbnail
    output = BytesIO()
    img.save(output, format='JPEG', quality=75, optimize=True)
    output.seek(0)
    
    return ContentFile(output.read())


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
    UniHousing Team
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
    UniHousing Team
    """
    
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[applicant.email],
        fail_silently=True
    )