# backend/accounts/email_backends.py
from django.core.mail.backends.console import EmailBackend as ConsoleEmailBackend
import logging

class LoggingEmailBackend(ConsoleEmailBackend):
    """Email backend that logs all emails for debugging"""
    
    def send_messages(self, messages):
        logger = logging.getLogger('accounts.email')
        for message in messages:
            logger.info(f"Sending email to: {message.to}")
            logger.info(f"Subject: {message.subject}")
            if hasattr(message, 'body'):
                logger.info(f"Body preview: {message.body[:100]}...")
        return super().send_messages(messages)