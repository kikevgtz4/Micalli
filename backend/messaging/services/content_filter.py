# backend/messaging/services/content_filter.py
import re
from typing import Dict, List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class MessageContentFilter:
    """
    Filter messages for potential off-platform transaction attempts
    and other policy violations.
    """
    
    # Phone number patterns (including Mexican and US formats)
    PHONE_PATTERNS = [
        # US phone formats
        (r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b', 'US phone number'),
        (r'\b\(\d{3}\)\s*\d{3}[-.\s]?\d{4}\b', 'US phone number'),
        
        # Mexican phone formats
        (r'\b\d{2,3}[-\s]?\d{4}[-\s]?\d{4}\b', 'Mexican phone number'),
        (r'\b\+?52\s*\d{2,3}[-\s]?\d{4}[-\s]?\d{4}\b', 'Mexican phone number'),
        
        # General patterns
        (r'\b\d{10,11}\b', 'Phone number'),
        
        # Obfuscated numbers
        (r'\b\d{1,3}\s+\d{1,3}\s+\d{1,4}\s+\d{1,4}\b', 'Spaced phone number'),
    ]
    
    # Messaging app patterns
    MESSAGING_APP_PATTERNS = [
        (r'whats\s*app|whats\s*app|what\'s\s*app|wapp|wa\.me', 'WhatsApp'),
        (r'telegram|signal|wechat|line\s*app', 'Messaging app'),
        (r'facebook\s*messenger|fb\s*messenger', 'Facebook Messenger'),
        (r'instagram\s*dm|insta\s*dm|ig\s*dm', 'Instagram DM'),
    ]
    
    # Email patterns
    EMAIL_PATTERNS = [
        (r'\b[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', 'Email address'),
        (r'\b[A-Za-z0-9._%+-]+\s*\[\s*at\s*\]\s*[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', 'Obfuscated email'),
        (r'gmail|yahoo|hotmail|outlook|proton', 'Email service mention'),
    ]
    
    # Payment circumvention patterns
    PAYMENT_PATTERNS = [
        (r'cash\s*only|efectivo|direct\s*payment|pago\s*directo', 'Direct payment request'),
        (r'venmo|paypal|zelle|cashapp|bank\s*transfer', 'External payment method'),
        (r'no\s*platform\s*fee|sin\s*comision|avoid\s*fee|skip\s*fee', 'Fee avoidance'),
        (r'pay\s*outside|pagar\s*fuera|off\s*platform', 'Off-platform payment'),
        (r'deposit\s*directly|deposito\s*directo', 'Direct deposit request'),
    ]
    
    # Social media patterns
    SOCIAL_MEDIA_PATTERNS = [
        (r'facebook\.com|fb\.com|face\s*book', 'Facebook'),
        (r'instagram\.com|insta\s*gram|ig\s*handle', 'Instagram'),
        (r'twitter\.com|twitter\s*handle', 'Twitter'),
        (r'linkedin\.com|linked\s*in', 'LinkedIn'),
        (r'tiktok|tik\s*tok', 'TikTok'),
    ]
    
    # Severity levels for different violation types
    SEVERITY_LEVELS = {
        'phone_number': 'high',
        'email': 'high',
        'messaging_app': 'high',
        'payment_circumvention': 'critical',
        'social_media': 'medium',
        'suspicious_pattern': 'medium',
    }
    
    # Educational messages for different violations
    EDUCATION_MESSAGES = {
        'phone_number': 'Sharing phone numbers is not allowed. All communication should stay within the platform for your safety and security.',
        'email': 'Please keep all communications within the platform. Sharing email addresses bypasses our safety features.',
        'messaging_app': 'External messaging apps are not allowed. Our platform provides secure messaging with dispute resolution support.',
        'payment_circumvention': 'All payments must go through the platform. This ensures both parties are protected with our guarantee and dispute resolution.',
        'social_media': 'Sharing social media profiles is discouraged. Keep conversations on the platform for your protection.',
        'suspicious_pattern': 'Your message contains patterns that might violate our community guidelines.',
    }
    
    def __init__(self):
        self.warning_threshold = 3
        self.block_threshold = 5
        self.context_window = 5  # Number of previous messages to consider
    
    def analyze_message(self, content: str, conversation_history: Optional[List[str]] = None) -> Dict:
        """
        Analyze message content for policy violations.
        
        Args:
            content: The message content to analyze
            conversation_history: Previous messages for context
            
        Returns:
            Dictionary with violations, action, and filtered content
        """
        if not content:
            return {
                'violations': [],
                'action': 'allow',
                'filtered_content': content,
                'severity_score': 0
            }
        
        content_lower = content.lower()
        violations = []
        
        # Check for phone numbers
        violations.extend(self._check_patterns(
            content_lower,
            self.PHONE_PATTERNS,
            'phone_number'
        ))
        
        # Check for messaging apps
        violations.extend(self._check_patterns(
            content_lower,
            self.MESSAGING_APP_PATTERNS,
            'messaging_app'
        ))
        
        # Check for email addresses
        violations.extend(self._check_patterns(
            content,  # Use original case for email detection
            self.EMAIL_PATTERNS,
            'email'
        ))
        
        # Check for payment circumvention
        violations.extend(self._check_patterns(
            content_lower,
            self.PAYMENT_PATTERNS,
            'payment_circumvention'
        ))
        
        # Check for social media
        violations.extend(self._check_patterns(
            content_lower,
            self.SOCIAL_MEDIA_PATTERNS,
            'social_media'
        ))
        
        # Context-aware checking if history provided
        if conversation_history:
            violations.extend(self._check_pattern_evolution(content_lower, conversation_history))
        
        # Remove duplicates while preserving order
        seen = set()
        unique_violations = []
        for v in violations:
            key = (v['type'], v['pattern'])
            if key not in seen:
                seen.add(key)
                unique_violations.append(v)
        
        # Calculate severity score
        severity_score = self._calculate_severity_score(unique_violations)
        
        # Determine action based on violations
        action = self._determine_action(severity_score, unique_violations)
        
        # Filter content if needed
        filtered_content = self._filter_content(content, unique_violations) if action != 'allow' else content
        
        # Log significant violations
        if action in ['warn', 'block']:
            logger.info(f"Content filter {action}: {len(unique_violations)} violations, score: {severity_score}")
        
        return {
            'violations': unique_violations,
            'action': action,
            'filtered_content': filtered_content,
            'severity_score': severity_score
        }
    
    def _check_patterns(self, content: str, patterns: List[Tuple[str, str]], violation_type: str) -> List[Dict]:
        """Check content against a list of regex patterns."""
        violations = []
        
        for pattern, description in patterns:
            matches = re.finditer(pattern, content, re.IGNORECASE)
            for match in matches:
                violations.append({
                    'type': violation_type,
                    'severity': self.SEVERITY_LEVELS.get(violation_type, 'medium'),
                    'pattern': description,
                    'education': self.EDUCATION_MESSAGES.get(violation_type, 'This content may violate our policies.'),
                    'matched_text': match.group()[:50],  # Truncate for privacy
                    'position': match.start()
                })
        
        return violations
    
    def _check_pattern_evolution(self, current_message: str, history: List[str]) -> List[Dict]:
        """
        Check if user is trying to share contact info across multiple messages.
        E.g., "my number is" in one message, then digits in the next.
        """
        violations = []
        
        # Check if previous messages set up contact info sharing
        setup_phrases = [
            'my number', 'mi numero', 'my email', 'mi correo',
            'contact me', 'contactame', 'reach me', 'find me',
            'whatsapp', 'telegram', 'call me', 'llamame'
        ]
        
        # Look for setup phrases in recent history
        recent_history = history[-self.context_window:] if len(history) > self.context_window else history
        has_setup = any(
            any(phrase in msg.lower() for phrase in setup_phrases)
            for msg in recent_history
        )
        
        # If setup detected, be more strict about number patterns
        if has_setup:
            # Look for partial phone numbers or suspicious digit patterns
            digit_groups = re.findall(r'\b\d{3,4}\b', current_message)
            if len(digit_groups) >= 2:
                violations.append({
                    'type': 'suspicious_pattern',
                    'severity': 'high',
                    'pattern': 'Digit pattern following contact setup',
                    'education': 'It appears you may be trying to share contact information across multiple messages.',
                    'matched_text': ' '.join(digit_groups),
                    'position': 0
                })
        
        return violations
    
    def _calculate_severity_score(self, violations: List[Dict]) -> int:
        """Calculate total severity score from violations."""
        severity_values = {
            'low': 1,
            'medium': 2,
            'high': 3,
            'critical': 5
        }
        
        return sum(severity_values.get(v['severity'], 2) for v in violations)
    
    def _determine_action(self, severity_score: int, violations: List[Dict]) -> str:
        """Determine action based on severity score and violation types."""
        # Critical violations always block
        if any(v['severity'] == 'critical' for v in violations):
            return 'block'
        
        # Score-based determination
        if severity_score >= self.block_threshold:
            return 'block'
        elif severity_score >= self.warning_threshold:
            return 'warn'
        elif severity_score > 0:
            return 'educate'
        else:
            return 'allow'
    
    def _filter_content(self, content: str, violations: List[Dict]) -> str:
        """
        Remove or mask violated content.
        Replace phone numbers, emails, etc. with [REMOVED].
        """
        filtered = content
        
        # Sort violations by position (reverse) to replace from end to start
        sorted_violations = sorted(violations, key=lambda x: x['position'], reverse=True)
        
        for violation in sorted_violations:
            if 'matched_text' in violation and violation['matched_text'] in filtered:
                # Replace with placeholder based on type
                placeholder = self._get_placeholder(violation['type'])
                filtered = filtered.replace(violation['matched_text'], placeholder)
        
        return filtered
    
    def _get_placeholder(self, violation_type: str) -> str:
        """Get appropriate placeholder text for filtered content."""
        placeholders = {
            'phone_number': '[PHONE REMOVED]',
            'email': '[EMAIL REMOVED]',
            'messaging_app': '[EXTERNAL APP]',
            'payment_circumvention': '[PAYMENT INFO REMOVED]',
            'social_media': '[SOCIAL MEDIA REMOVED]',
            'suspicious_pattern': '[REMOVED]'
        }
        return placeholders.get(violation_type, '[REMOVED]')


class ContentModerationService:
    """
    Additional service for broader content moderation beyond contact info.
    Handles inappropriate content, spam, etc.
    """
    
    INAPPROPRIATE_PATTERNS = [
        (r'\b(spam|scam|fraud|fake|estafa)\b', 'Potential scam mention'),
        (r'send\s*money|enviar\s*dinero|wire\s*transfer', 'Money request'),
        (r'urgent|emergency|urgente|emergencia', 'Urgency tactics'),
    ]
    
    def __init__(self):
        self.content_filter = MessageContentFilter()
    
    def moderate_content(self, content: str, sender_history: Optional[List[Dict]] = None) -> Dict:
        """
        Perform broader content moderation.
        
        Args:
            content: Message content to moderate
            sender_history: Previous messages from this sender
            
        Returns:
            Moderation result with flags and recommendations
        """
        # First run through contact info filter
        filter_result = self.content_filter.analyze_message(content)
        
        # Additional moderation checks
        flags = []
        
        # Check for spam patterns
        if sender_history and len(sender_history) > 5:
            # Check for repetitive messages
            recent_messages = [msg['content'] for msg in sender_history[-5:]]
            if recent_messages.count(content) > 2:
                flags.append({
                    'type': 'spam',
                    'reason': 'Repetitive messages',
                    'severity': 'medium'
                })
        
        # Check for inappropriate content
        for pattern, description in self.INAPPROPRIATE_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE):
                flags.append({
                    'type': 'inappropriate',
                    'reason': description,
                    'severity': 'medium'
                })
        
        # Combine results
        return {
            'contact_filter': filter_result,
            'moderation_flags': flags,
            'requires_review': len(flags) > 0 or filter_result['action'] in ['warn', 'block'],
            'overall_action': self._determine_overall_action(filter_result, flags)
        }
    
    def _determine_overall_action(self, filter_result: Dict, flags: List[Dict]) -> str:
        """Determine overall action based on all checks."""
        # If contact filter blocks, always block
        if filter_result['action'] == 'block':
            return 'block'
        
        # If multiple flags, escalate
        if len(flags) >= 3:
            return 'flag_for_review'
        
        # If contact filter warns and has flags, flag for review
        if filter_result['action'] == 'warn' and flags:
            return 'flag_for_review'
        
        # Otherwise, use contact filter action
        return filter_result['action']