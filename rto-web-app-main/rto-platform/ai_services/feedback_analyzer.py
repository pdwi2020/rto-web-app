"""
XFDRC: Feedback Analysis & Sentiment Classification Component
Uses NLP for sentiment analysis and intent classification
"""

from typing import Dict, List, Optional, Tuple
import re

# Optional imports
try:
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False


class FeedbackAnalyzer:
    """
    Analyze citizen feedback for sentiment and intent classification.
    Supports multilingual text (English, Hindi, Tamil).
    """

    def __init__(self):
        self.sentiment_pipeline = None
        self.intent_classifier = None

        # Keyword-based fallback sentiment lexicon
        self.positive_keywords = [
            'good', 'excellent', 'great', 'helpful', 'quick', 'fast', 'professional',
            'satisfied', 'happy', 'thank', 'best', 'reliable', 'trustworthy',
            'accha', 'achha', 'badiya', 'mast', 'sahi'  # Hindi
        ]

        self.negative_keywords = [
            'bad', 'poor', 'slow', 'delay', 'fraud', 'cheat', 'rude', 'unprofessional',
            'angry', 'worst', 'terrible', 'useless', 'complaint', 'problem', 'issue',
            'bura', 'kharab', 'bekar', 'galat', 'dhoka'  # Hindi
        ]

        # Complaint intent keywords
        self.complaint_keywords = [
            'complaint', 'problem', 'issue', 'delay', 'fraud', 'cheat', 'money',
            'overcharge', 'fee', 'cost', 'expensive', 'scam', 'not completed',
            'unfinished', 'pending', 'stuck', 'help', 'shikayat'  # Hindi
        ]

        # Initialize transformer models if available
        if TRANSFORMERS_AVAILABLE:
            try:
                # Use lightweight multilingual sentiment model
                self.sentiment_pipeline = pipeline(
                    "sentiment-analysis",
                    model="cardiffnlp/twitter-xlm-roberta-base-sentiment",
                    truncation=True,
                    max_length=512
                )
            except Exception:
                self.sentiment_pipeline = None

    def preprocess_text(self, text: str) -> str:
        """Clean and normalize feedback text"""
        if not text:
            return ""

        # Convert to lowercase
        text = text.lower()

        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()

        # Remove URLs
        text = re.sub(r'http\S+|www\S+', '', text)

        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s\.,!?-]', '', text)

        return text

    def analyze_sentiment_rule_based(self, text: str) -> Dict:
        """
        Rule-based sentiment analysis using keyword matching
        Fallback when transformer models unavailable
        """
        text_lower = text.lower()

        # Count positive and negative keywords
        positive_count = sum(1 for word in self.positive_keywords if word in text_lower)
        negative_count = sum(1 for word in self.negative_keywords if word in text_lower)

        # Calculate sentiment score (-1 to 1)
        total = positive_count + negative_count
        if total == 0:
            sentiment_score = 0.0
            sentiment_label = 'Neutral'
        else:
            sentiment_score = (positive_count - negative_count) / total
            if sentiment_score > 0.2:
                sentiment_label = 'Positive'
            elif sentiment_score < -0.2:
                sentiment_label = 'Negative'
            else:
                sentiment_label = 'Neutral'

        return {
            'sentiment': sentiment_label,
            'score': round(sentiment_score, 3),
            'confidence': 0.7,  # Lower confidence for rule-based
            'method': 'rule_based',
            'positive_keywords_found': positive_count,
            'negative_keywords_found': negative_count
        }

    def analyze_sentiment_ml(self, text: str) -> Dict:
        """
        ML-based sentiment analysis using transformer models
        """
        if not self.sentiment_pipeline:
            return self.analyze_sentiment_rule_based(text)

        try:
            result = self.sentiment_pipeline(text)[0]
            label = result['label']
            score = result['score']

            # Map label to sentiment
            sentiment_mapping = {
                'LABEL_0': 'Negative',  # XLM-RoBERTa sentiment labels
                'LABEL_1': 'Neutral',
                'LABEL_2': 'Positive',
                'negative': 'Negative',  # Generic labels
                'neutral': 'Neutral',
                'positive': 'Positive'
            }

            sentiment = sentiment_mapping.get(label.lower(), label)

            # Convert to score scale (-1 to 1)
            if sentiment == 'Positive':
                sentiment_score = score
            elif sentiment == 'Negative':
                sentiment_score = -score
            else:
                sentiment_score = 0.0

            return {
                'sentiment': sentiment,
                'score': round(sentiment_score, 3),
                'confidence': round(score, 3),
                'method': 'transformer_ml',
                'model': 'xlm-roberta'
            }
        except Exception as e:
            # Fallback to rule-based
            result = self.analyze_sentiment_rule_based(text)
            result['ml_error'] = str(e)
            return result

    def classify_intent(self, text: str) -> Dict:
        """
        Classify feedback intent: complaint, query, appreciation, etc.
        """
        text_lower = text.lower()

        # Count complaint keywords
        complaint_count = sum(1 for word in self.complaint_keywords if word in text_lower)

        # Determine intent
        is_complaint = complaint_count > 0
        complaint_probability = min(complaint_count / 3, 1.0)  # Normalize to 0-1

        # Classify into categories
        intent_type = 'appreciation'
        if is_complaint:
            intent_type = 'complaint'
        elif any(word in text_lower for word in ['query', 'question', 'how', 'what', 'when', 'where']):
            intent_type = 'query'
        elif any(word in text_lower for word in ['thank', 'good', 'excellent', 'appreciate']):
            intent_type = 'appreciation'
        else:
            intent_type = 'general'

        return {
            'intent': intent_type,
            'is_complaint': is_complaint,
            'complaint_probability': round(complaint_probability, 3),
            'complaint_keywords_found': complaint_count
        }

    def analyze_feedback(self, text: str, use_ml: bool = True) -> Dict:
        """
        Complete feedback analysis: sentiment + intent

        Args:
            text: Feedback text to analyze
            use_ml: Whether to use ML models (if available)

        Returns:
            Dictionary with sentiment and intent analysis
        """
        if not text or not text.strip():
            return {
                'error': 'Empty feedback text',
                'sentiment': {'sentiment': 'Neutral', 'score': 0.0},
                'intent': {'intent': 'general', 'is_complaint': False}
            }

        # Preprocess
        cleaned_text = self.preprocess_text(text)

        # Sentiment analysis
        if use_ml and TRANSFORMERS_AVAILABLE and self.sentiment_pipeline:
            sentiment_result = self.analyze_sentiment_ml(cleaned_text)
        else:
            sentiment_result = self.analyze_sentiment_rule_based(cleaned_text)

        # Intent classification
        intent_result = self.classify_intent(cleaned_text)

        return {
            'original_text': text,
            'cleaned_text': cleaned_text,
            'sentiment': sentiment_result,
            'intent': intent_result,
            'analysis_timestamp': None  # Will be set by caller
        }

    def analyze_sentiment(self, text: str, use_ml: bool = True) -> Dict:
        """
        Public helper to analyze sentiment only (used by tests/integration)
        """
        cleaned_text = self.preprocess_text(text)
        if use_ml and TRANSFORMERS_AVAILABLE and self.sentiment_pipeline:
            base_result = self.analyze_sentiment_ml(cleaned_text)
        else:
            base_result = self.analyze_sentiment_rule_based(cleaned_text)

        return {
            'sentiment': base_result.get('score', 0.0),
            'label': base_result.get('sentiment', 'Neutral'),
            'confidence': base_result.get('confidence', 0.7),
            'method': base_result.get('method', 'rule_based')
        }

    def calculate_rating_adjustment(
        self,
        sentiment_score: float,
        complaint_probability: float,
        feedback_weight: float = 0.3,
        complaint_penalty: float = 0.5
    ) -> float:
        """
        Calculate rating adjustment based on feedback
        Implements the SIR (Sentiment-Intent Reinforcement) algorithm

        Formula: ΔRating = α × sentiment_score - β × complaint_probability

        Args:
            sentiment_score: Sentiment score from -1 to 1
            complaint_probability: Probability of being a complaint (0-1)
            feedback_weight: Alpha parameter (default 0.3)
            complaint_penalty: Beta parameter (default 0.5)

        Returns:
            Rating adjustment value (can be positive or negative)
        """
        adjustment = (
            feedback_weight * sentiment_score -
            complaint_penalty * complaint_probability
        )

        # Cap adjustment to reasonable range (-0.5 to +0.5)
        adjustment = max(min(adjustment, 0.5), -0.5)

        return round(adjustment, 3)


# Global instance
_feedback_analyzer = None

def get_feedback_analyzer() -> FeedbackAnalyzer:
    """Get or create global feedback analyzer instance"""
    global _feedback_analyzer
    if _feedback_analyzer is None:
        _feedback_analyzer = FeedbackAnalyzer()
    return _feedback_analyzer
