# backend/messaging/tests.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Conversation, Message, MessageTemplate
from properties.models import Property

User = get_user_model()


class ContentFilterTestCase(TestCase):
    """Test content filtering functionality"""
    
    def setUp(self):
        from .services.content_filter import MessageContentFilter
        self.filter = MessageContentFilter()
    
    def test_phone_number_detection(self):
        """Test detection of phone numbers"""
        test_cases = [
            ("Call me at 555-123-4567", True),
            ("Mi número es 81 1234 5678", True),
            ("Contact via platform only", False),
        ]
        
        for content, should_flag in test_cases:
            result = self.filter.analyze_message(content)
            has_violations = len(result['violations']) > 0
            self.assertEqual(has_violations, should_flag, 
                           f"Failed for: {content}")
    
    def test_payment_circumvention(self):
        """Test detection of payment circumvention attempts"""
        content = "Let's do cash only to avoid fees"
        result = self.filter.analyze_message(content)
        self.assertEqual(result['action'], 'block')


class ConversationAPITestCase(APITestCase):
    """Test conversation API endpoints"""
    
    def setUp(self):
        self.student = User.objects.create_user(
            username='student1',
            email='student@test.com',
            user_type='student'
        )
        self.owner = User.objects.create_user(
            username='owner1',
            email='owner@test.com',
            user_type='property_owner'
        )
        self.property = Property.objects.create(
            title='Test Property',
            owner=self.owner,
            rent_amount=5000,
            bedrooms=2,
            bathrooms=1,
            total_area=80,
            is_active=True
        )
    
    def test_start_conversation(self):
        """Test starting a new conversation"""
        self.client.force_authenticate(user=self.student)
        
        response = self.client.post('/api/messages/conversations/start/', {
            'user_id': self.owner.id,
            'property_id': self.property.id,
            'message': 'Hello, I am interested in your property'
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Conversation.objects.count(), 1)
        self.assertEqual(Message.objects.count(), 1)
