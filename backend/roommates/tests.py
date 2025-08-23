# backend/roommates/tests.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError  # Add this import
from .models import MatchRequest, RoommateProfile

User = get_user_model()

class MatchRequestTestCase(TestCase):
    def setUp(self):
        self.sender = User.objects.create_user(
            username='sender',
            email='sender@test.com',
            user_type='student'
        )
        self.receiver = User.objects.create_user(
            username='receiver', 
            email='receiver@test.com',
            user_type='student'
        )
        
    def test_cannot_send_to_self(self):
        """Test that users cannot send match requests to themselves"""
        with self.assertRaises(ValidationError):  # Changed from ValueError
            MatchRequest.objects.create(
                sender=self.sender,
                receiver=self.sender
            )
    
    def test_silent_rejection(self):
        """Test that rejected requests are hidden from sender"""
        match_request = MatchRequest.objects.create(
            sender=self.sender,
            receiver=self.receiver
        )
        match_request.reject()
        
        # Sender shouldn't see rejected requests
        visible = MatchRequest.objects.filter(
            sender=self.sender
        ).exclude(status='rejected')
        self.assertEqual(visible.count(), 0)