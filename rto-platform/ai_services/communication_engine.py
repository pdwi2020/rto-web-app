"""
XFDRC: Communication Engine Component
Auto-escalation and multilingual notification system
Implements CERE (Contextual Escalation Rule Engine)
"""

from typing import Dict, List, Optional
from datetime import datetime
import json


class CommunicationEngine:
    """
    Handles automated communication, notifications, and escalation logic.
    Implements CERE algorithm for intelligent escalation.
    """

    def __init__(self):
        # Escalation thresholds
        self.escalation_threshold = 0.5  # Composite score threshold
        self.anomaly_weight = 0.4
        self.complaint_weight = 0.3
        self.sentiment_weight = 0.2
        self.delay_weight = 0.1

        # Support contact information
        self.support_info = {
            'toll_free': '1800-XXX-XXXX',
            'emergency_contact': '+91-XXX-XXX-XXXX',
            'email': 'support@rto.gov.in',
            'working_hours': 'Monday - Saturday, 9:00 AM - 6:00 PM',
            'helpdesk': 'For urgent assistance, call our 24/7 helpline'
        }

        # Message templates for different scenarios
        self.templates = {
            'application_submitted': {
                'en': 'Your application #{app_id} has been submitted successfully. Broker: {broker_name}. Track status at: {url}',
                'hi': 'आपका आवेदन #{app_id} सफलतापूर्वक जमा किया गया है। ब्रोकर: {broker_name}। स्थिति ट्रैक करें: {url}',
                'ta': 'உங்கள் விண்ணப்பம் #{app_id} வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது. தரகர்: {broker_name}. நிலையை கண்காணிக்க: {url}'
            },
            'status_update': {
                'en': 'Application #{app_id} status updated to: {status}. Expected completion: {date}',
                'hi': 'आवेदन #{app_id} की स्थिति अपडेट: {status}। अपेक्षित पूर्णता: {date}',
                'ta': 'விண்ணப்பம் #{app_id} நிலை புதுப்பிக்கப்பட்டது: {status}. எதிர்பார்க்கப்படும் முடிவு: {date}'
            },
            'fee_estimate': {
                'en': 'Estimated fee for {service_type}: ₹{total}. Breakdown: Govt ₹{govt}, Broker ₹{broker}, Tax ₹{tax}',
                'hi': '{service_type} के लिए अनुमानित शुल्क: ₹{total}। विवरण: सरकार ₹{govt}, ब्रोकर ₹{broker}, कर ₹{tax}',
                'ta': '{service_type} கான மதிப்பீட்டு கட்டணம்: ₹{total}. விவரம்: அரசு ₹{govt}, தரகர் ₹{broker}, வரி ₹{tax}'
            },
            'complaint_received': {
                'en': 'Your complaint #{complaint_id} has been registered. We will respond within 48 hours.',
                'hi': 'आपकी शिकायत #{complaint_id} दर्ज की गई है। हम 48 घंटे के भीतर जवाब देंगे।',
                'ta': 'உங்கள் புகார் #{complaint_id} பதிவு செய்யப்பட்டுள்ளது. நாங்கள் 48 மணி நேரத்திற்குள் பதிலளிப்போம்.'
            },
            'escalation_alert': {
                'en': 'ALERT: Application #{app_id} requires immediate attention. Reason: {reason}. Contact admin.',
                'hi': 'चेतावनी: आवेदन #{app_id} को तत्काल ध्यान की आवश्यकता है। कारण: {reason}। व्यवस्थापक से संपर्क करें।',
                'ta': 'எச்சரிக்கை: விண்ணப்பம் #{app_id} உடனடி கவனம் தேவை. காரணம்: {reason}. நிர்வாகியை தொடர்பு கொள்ளுங்கள்.'
            }
        }

    def calculate_escalation_score(
        self,
        anomaly_score: float = 0.0,
        complaint_probability: float = 0.0,
        sentiment_score: float = 0.0,
        delay_ratio: float = 0.0
    ) -> Dict:
        """
        Calculate escalation score using CERE algorithm

        Formula: E = α × A_score + β × C_prob + γ × (1 - S_score) + δ × D_ratio

        Args:
            anomaly_score: Anomaly score from fraud detection (0-1)
            complaint_probability: Probability of complaint (0-1)
            sentiment_score: Sentiment score (-1 to 1), converted to (0-1)
            delay_ratio: Delay ratio (0-1, where 1 = extreme delay)

        Returns:
            Dictionary with escalation decision and score breakdown
        """
        # Normalize sentiment score to 0-1 range (0 = very negative, 1 = very positive)
        normalized_sentiment = (sentiment_score + 1) / 2

        # Invert sentiment for escalation (negative sentiment = higher escalation)
        sentiment_component = 1 - normalized_sentiment

        # Calculate weighted escalation score
        escalation_score = (
            self.anomaly_weight * anomaly_score +
            self.complaint_weight * complaint_probability +
            self.sentiment_weight * sentiment_component +
            self.delay_weight * delay_ratio
        )

        # Determine if escalation needed
        should_escalate = escalation_score >= self.escalation_threshold

        # Determine escalation level
        if escalation_score >= 0.8:
            escalation_level = 'critical'
        elif escalation_score >= 0.6:
            escalation_level = 'high'
        elif escalation_score >= 0.4:
            escalation_level = 'medium'
        else:
            escalation_level = 'low'

        return {
            'escalation_score': round(escalation_score, 3),
            'should_escalate': should_escalate,
            'escalation_level': escalation_level,
            'threshold': self.escalation_threshold,
            'components': {
                'anomaly': round(self.anomaly_weight * anomaly_score, 3),
                'complaint': round(self.complaint_weight * complaint_probability, 3),
                'sentiment': round(self.sentiment_weight * sentiment_component, 3),
                'delay': round(self.delay_weight * delay_ratio, 3)
            }
        }

    def generate_message(
        self,
        template_key: str,
        language: str = 'en',
        **kwargs
    ) -> str:
        """
        Generate message from template in specified language

        Args:
            template_key: Key identifying the message template
            language: Language code ('en', 'hi', 'ta')
            **kwargs: Template variables

        Returns:
            Formatted message string
        """
        # Get template
        template_dict = self.templates.get(template_key, {})
        template = template_dict.get(language, template_dict.get('en', ''))

        if not template:
            return f"Template '{template_key}' not found"

        # Format with provided variables
        try:
            message = template.format(**kwargs)
        except KeyError as e:
            message = f"Missing template variable: {e}"

        return message

    def create_escalation_ticket(
        self,
        application_id: int,
        broker_id: int,
        citizen_name: str,
        service_type: str,
        escalation_score: float,
        reason: str
    ) -> Dict:
        """
        Create an escalation ticket for admin review

        Returns:
            Escalation ticket dictionary
        """
        ticket = {
            'ticket_id': f'ESC-{application_id}-{int(datetime.now().timestamp())}',
            'application_id': application_id,
            'broker_id': broker_id,
            'citizen_name': citizen_name,
            'service_type': service_type,
            'escalation_score': escalation_score,
            'reason': reason,
            'status': 'Open',
            'priority': 'High' if escalation_score >= 0.7 else 'Medium',
            'created_at': datetime.now().isoformat(),
            'assigned_to': 'RTO Admin Team',
            'auto_generated': True
        }

        return ticket

    def get_support_info(self) -> Dict:
        """Get support contact information"""
        return self.support_info.copy()

    def generate_notification(
        self,
        notification_type: str,
        recipient_phone: str,
        recipient_language: str = 'en',
        **data
    ) -> Dict:
        """
        Generate notification for SMS/WhatsApp/Email

        Args:
            notification_type: Type of notification
            recipient_phone: Phone number
            recipient_language: Preferred language
            **data: Data for message template

        Returns:
            Notification object ready for sending
        """
        # Generate message
        message = self.generate_message(notification_type, recipient_language, **data)

        notification = {
            'type': notification_type,
            'recipient': recipient_phone,
            'language': recipient_language,
            'message': message,
            'channel': 'sms',  # Can be 'sms', 'whatsapp', 'email'
            'created_at': datetime.now().isoformat(),
            'status': 'pending',
            'data': data
        }

        return notification

    def process_feedback_and_escalate(
        self,
        application_id: int,
        broker_id: int,
        citizen_name: str,
        service_type: str,
        feedback_text: str,
        sentiment_score: float,
        complaint_probability: float,
        anomaly_score: float = 0.0,
        delay_days: float = 0.0,
        expected_days: float = 5.0
    ) -> Dict:
        """
        Process feedback and determine if escalation needed

        Returns:
            Dictionary with escalation decision and actions taken
        """
        # Calculate delay ratio
        delay_ratio = min(delay_days / expected_days if expected_days > 0 else 0, 1.0)

        # Calculate escalation score
        escalation_result = self.calculate_escalation_score(
            anomaly_score=anomaly_score,
            complaint_probability=complaint_probability,
            sentiment_score=sentiment_score,
            delay_ratio=delay_ratio
        )

        result = {
            'application_id': application_id,
            'escalation': escalation_result,
            'actions_taken': []
        }

        # If escalation needed, create ticket
        if escalation_result['should_escalate']:
            # Determine reason
            reasons = []
            if anomaly_score > 0.5:
                reasons.append('High anomaly score detected')
            if complaint_probability > 0.5:
                reasons.append('Complaint detected in feedback')
            if sentiment_score < -0.5:
                reasons.append('Negative sentiment in feedback')
            if delay_ratio > 0.5:
                reasons.append(f'Significant delay: {delay_days} days')

            reason = '; '.join(reasons) if reasons else 'Multiple risk factors'

            # Create escalation ticket
            ticket = self.create_escalation_ticket(
                application_id=application_id,
                broker_id=broker_id,
                citizen_name=citizen_name,
                service_type=service_type,
                escalation_score=escalation_result['escalation_score'],
                reason=reason
            )

            result['escalation_ticket'] = ticket
            result['actions_taken'].append('escalation_ticket_created')

            # Generate alert notification (would be sent to admin)
            result['admin_alert'] = {
                'message': f"Application #{application_id} escalated: {reason}",
                'level': escalation_result['escalation_level'],
                'ticket_id': ticket['ticket_id']
            }
            result['actions_taken'].append('admin_alert_generated')

        return result


# Global instance
_communication_engine = None

def get_communication_engine() -> CommunicationEngine:
    """Get or create global communication engine instance"""
    global _communication_engine
    if _communication_engine is None:
        _communication_engine = CommunicationEngine()
    return _communication_engine
