"""
Comprehensive Unit Tests for AI Modules
Tests all 5 novel algorithms: XFDRC, RAG-IVR, TAS-DyRa, TG-CMAE, VAFD-OCR
"""

import pytest
import sys
import os
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_services.fee_estimator import get_fee_estimator
from ai_services.feedback_analyzer import get_feedback_analyzer
from ai_services.communication_engine import get_communication_engine
from ai_services.rating_engine import get_rating_engine
from ai_services.fraud_detection import get_fraud_detector
from ai_services.chatbot import get_chatbot_response, get_rag_response_detailed
from ai_services.rag_retriever import get_knowledge_base


# ============================================================================
# XFDRC Tests - Fee Estimator
# ============================================================================

class TestXFDRCFeeEstimator:
    """Test XFDRC - Explainable Fee-Dynamic Rating-Communication"""

    def setup_method(self):
        """Setup test environment"""
        self.estimator = get_fee_estimator()

    def test_basic_fee_estimation(self):
        """Test basic fee estimation with rule-based method"""
        result = self.estimator.estimate_fee(
            service_type="New Registration",
            vehicle_class="Four Wheeler (Car/SUV)",
            broker_tier="Silver",
            use_ml=False
        )

        assert result is not None
        assert 'breakdown' in result
        assert 'predicted_total' in result
        assert result['method'] == 'rule_based'
        assert result['breakdown']['total'] > 0

    def test_ml_fee_estimation(self):
        """Test ML-based fee estimation"""
        result = self.estimator.estimate_fee(
            service_type="New Registration",
            vehicle_class="Four Wheeler (Car/SUV)",
            broker_tier="Gold",
            use_ml=True
        )

        assert result is not None
        assert 'confidence' in result
        assert 0 <= result['confidence'] <= 1

    def test_fee_breakdown_components(self):
        """Test fee breakdown has all required components"""
        result = self.estimator.estimate_fee(
            service_type="Renewal",
            vehicle_class="Two Wheeler"
        )

        breakdown = result['breakdown']
        assert 'base_fee' in breakdown
        assert 'broker_commission' in breakdown
        assert 'service_fee' in breakdown
        assert 'tax_gst' in breakdown
        assert 'total' in breakdown

    def test_fee_inflation_detection(self):
        """Test fee inflation detection"""
        # Get expected fee
        expected_result = self.estimator.estimate_fee(
            service_type="New Registration",
            vehicle_class="Four Wheeler (Car/SUV)"
        )
        expected_fee = expected_result['predicted_total']

        # Test with inflated fee (30% higher)
        inflated_fee = expected_fee * 1.3
        is_inflated, deviation = self.estimator.detect_fee_inflation(
            actual_fee=inflated_fee,
            expected_fee=expected_fee
        )

        assert is_inflated is True
        assert deviation > 0.25  # Above 25% threshold

    def test_different_broker_tiers(self):
        """Test fee estimation for different broker tiers"""
        tiers = ['Bronze', 'Silver', 'Gold']
        results = []

        for tier in tiers:
            result = self.estimator.estimate_fee(
                service_type="New Registration",
                vehicle_class="Four Wheeler (Car/SUV)",
                broker_tier=tier
            )
            results.append(result['breakdown']['broker_commission'])

        # Gold tier should have highest commission
        assert results[2] > results[1] > results[0]


# ============================================================================
# RAG-IVR Tests - Chatbot & Retrieval
# ============================================================================

class TestRAGIVRChatbot:
    """Test RAG-IVR - Retrieval-Augmented Generation"""

    def setup_method(self):
        """Setup test environment"""
        self.kb = get_knowledge_base()

    def test_knowledge_base_initialization(self):
        """Test knowledge base is properly initialized"""
        assert self.kb is not None
        assert len(self.kb.documents) > 0

    def test_bm25_retrieval(self):
        """Test BM25 keyword-based retrieval"""
        results = self.kb.bm25_search("vehicle registration documents", top_k=3)

        assert len(results) > 0
        assert len(results) <= 3
        assert all('id' in doc for doc in results)
        assert all('content' in doc for doc in results)
        assert all('score' in doc for doc in results)

    def test_dense_retrieval(self):
        """Test dense vector retrieval"""
        results = self.kb.dense_search("What is RC book?", top_k=3)

        assert len(results) > 0
        assert all('similarity' in doc or 'score' in doc for doc in results)

    def test_hybrid_retrieval(self):
        """Test hybrid retrieval (BM25 + Dense)"""
        results = self.kb.hybrid_search("pollution certificate requirements", top_k=5)

        assert len(results) > 0
        assert len(results) <= 5
        # Verify combined scoring
        assert all('score' in doc for doc in results)

    def test_rag_response_generation(self):
        """Test RAG-enhanced response generation"""
        result = get_rag_response_detailed(
            query="What documents do I need for new vehicle registration?",
            top_k=3
        )

        assert result is not None
        assert 'query' in result
        assert 'response' in result
        assert 'num_sources' in result
        assert result['num_sources'] > 0

    def test_retrieval_relevance(self):
        """Test retrieved documents are relevant"""
        results = self.kb.hybrid_search("driving license", top_k=3)

        # Check if results contain relevant terms
        for doc in results:
            content_lower = doc['content'].lower()
            assert any(term in content_lower for term in ['license', 'driving', 'document', 'verification'])


# ============================================================================
# TAS-DyRa Tests - Dynamic Rating
# ============================================================================

class TestTASDyRaDynamicRating:
    """Test TAS-DyRa - Temporal Anomaly-Scored Dynamic Rating"""

    def setup_method(self):
        """Setup test environment"""
        self.rating_engine = get_rating_engine()

    def test_basic_rating_update(self):
        """Test basic rating update"""
        result = self.rating_engine.process_broker_update(
            broker_id=1,
            current_rating=4.0,
            task_data={
                'actual_time': 3.0,
                'expected_time': 5.0,
                'completed_tasks': 10,
                'total_tasks': 10,
                'sentiment_score': 0.5
            }
        )

        assert result is not None
        assert 'new_rating' in result
        assert 'rating_change' in result
        assert 'explanation' in result

    def test_positive_rating_adjustment(self):
        """Test rating increases with good performance"""
        result = self.rating_engine.process_broker_update(
            broker_id=1,
            current_rating=4.0,
            task_data={
                'actual_time': 2.0,      # Completed faster
                'expected_time': 5.0,
                'completed_tasks': 10,    # All tasks completed
                'total_tasks': 10,
                'sentiment_score': 0.8    # Positive sentiment
            },
            anomaly_score=0.0,
            fraud_score=0.0
        )

        assert result['new_rating'] > result['old_rating']
        assert result['rating_change'] > 0

    def test_negative_rating_adjustment(self):
        """Test rating decreases with poor performance"""
        result = self.rating_engine.process_broker_update(
            broker_id=1,
            current_rating=4.0,
            task_data={
                'actual_time': 8.0,       # Took longer
                'expected_time': 5.0,
                'completed_tasks': 5,     # Only half completed
                'total_tasks': 10,
                'sentiment_score': -0.5   # Negative sentiment
            },
            anomaly_score=0.3,
            fraud_score=0.2
        )

        assert result['new_rating'] < result['old_rating']
        assert result['rating_change'] < 0

    def test_temporal_decay(self):
        """Test temporal decay for old events"""
        # Recent event (1 day ago)
        result_recent = self.rating_engine.process_broker_update(
            broker_id=1,
            current_rating=4.0,
            task_data={
                'actual_time': 2.0,
                'expected_time': 5.0,
                'completed_tasks': 10,
                'total_tasks': 10,
                'sentiment_score': 0.8
            },
            days_ago=1.0
        )

        # Old event (30 days ago)
        result_old = self.rating_engine.process_broker_update(
            broker_id=1,
            current_rating=4.0,
            task_data={
                'actual_time': 2.0,
                'expected_time': 5.0,
                'completed_tasks': 10,
                'total_tasks': 10,
                'sentiment_score': 0.8
            },
            days_ago=30.0
        )

        # Recent event should have bigger impact
        assert abs(result_recent['rating_change']) > abs(result_old['rating_change'])

    def test_rating_categorization(self):
        """Test broker categorization based on rating"""
        # Test Gold tier
        assert self.rating_engine.categorize_broker(4.5) == "Gold"

        # Test Silver tier
        assert self.rating_engine.categorize_broker(4.0) == "Silver"

        # Test Bronze tier
        assert self.rating_engine.categorize_broker(3.0) == "Bronze"

        # Test Blacklisted
        assert self.rating_engine.categorize_broker(2.0) == "Blacklisted"


# ============================================================================
# TG-CMAE Tests - Fraud Detection
# ============================================================================

class TestTGCMAEFraudDetection:
    """Test TG-CMAE - Temporal Graph Cross-Modal Autoencoder"""

    def setup_method(self):
        """Setup test environment"""
        self.fraud_detector = get_fraud_detector()

    def test_ghosting_detection(self):
        """Test ghosting detection (48h+ OTP delay)"""
        # OTP started 50 hours ago, not closed
        start_time = (datetime.now() - timedelta(hours=50)).isoformat()

        result = self.fraud_detector.detect_ghosting(
            otp_start_time=start_time,
            otp_close_time=None
        )

        assert result['is_ghosting'] is True
        assert result['hours_elapsed'] > 48

    def test_no_ghosting_quick_completion(self):
        """Test no ghosting with quick completion"""
        # OTP started 2 hours ago and closed
        start_time = (datetime.now() - timedelta(hours=2)).isoformat()
        close_time = datetime.now().isoformat()

        result = self.fraud_detector.detect_ghosting(
            otp_start_time=start_time,
            otp_close_time=close_time
        )

        assert result['is_ghosting'] is False

    def test_fee_inflation_detection(self):
        """Test fee inflation detection (25%+ deviation)"""
        result = self.fraud_detector.detect_fee_inflation(
            actual_fee=5000.0,
            expected_fee=4000.0  # 25% inflation
        )

        assert result['is_inflated'] is True
        assert result['deviation_percentage'] >= 25

    def test_duplicate_submission_detection(self):
        """Test duplicate submission detection"""
        app1 = {
            'vehicle_number': 'TN01AB1234',
            'owner_name': 'John Doe',
            'application_type': 'New Registration'
        }

        app2 = {
            'vehicle_number': 'TN01AB1234',  # Same vehicle
            'owner_name': 'John Doe',        # Same owner
            'application_type': 'New Registration'
        }

        result = self.fraud_detector.detect_duplicate_submission(
            application_data=app1,
            existing_applications=[app2]
        )

        assert result['is_duplicate'] is True
        assert result['similarity'] > 0.85

    def test_fake_delay_detection(self):
        """Test fake delay detection"""
        result = self.fraud_detector.detect_fake_delay(
            actual_duration=10.0,
            expected_duration=5.0  # 2x delay
        )

        assert result['is_delayed'] is True
        assert result['delay_ratio'] >= 1.5

    def test_comprehensive_fraud_check(self):
        """Test comprehensive fraud check combining all patterns"""
        start_time = (datetime.now() - timedelta(hours=50)).isoformat()

        result = self.fraud_detector.comprehensive_fraud_check(
            application_data={
                'application_id': 1,
                'otp_start_time': start_time,
                'otp_close_time': None,
                'actual_fee': 5000.0,
                'expected_fee': 4000.0,
                'actual_duration': 10.0,
                'expected_duration': 5.0
            }
        )

        assert result['fraud_analysis']['is_fraudulent'] is True
        assert result['fraud_analysis']['anomaly_score'] > 0.5
        assert len(result['fraud_analysis']['fraud_indicators']) > 0
        assert result['recommendation']['action'] in ['approve', 'review', 'escalate']


# ============================================================================
# VAFD-OCR Tests - Forgery Detection
# ============================================================================

class TestVAFDOCRForgeryDetection:
    """Test VAFD-OCR - Verification-Aware Forgery Detection OCR"""

    def test_forgery_detection_exists(self):
        """Test forgery detection module exists"""
        from ai_services import forgery
        assert forgery is not None

    def test_basic_forgery_detection(self):
        """Test basic forgery detection (would need actual image in real scenario)"""
        # This is a placeholder - in real scenario, you'd test with actual images
        from ai_services.forgery import analyze_document_advanced
        # In production, you'd test with real base64 encoded images
        pass


# ============================================================================
# Integration Tests
# ============================================================================

class TestIntegration:
    """Integration tests combining multiple AI modules"""

    def test_xfdrc_feedback_integration(self):
        """Test XFDRC integration: Fee estimation + Feedback analysis"""
        # Estimate fee
        estimator = get_fee_estimator()
        fee_result = estimator.estimate_fee(
            service_type="New Registration",
            vehicle_class="Four Wheeler (Car/SUV)"
        )

        # Analyze feedback
        analyzer = get_feedback_analyzer()
        feedback_result = analyzer.analyze_sentiment(
            text="Great service, completed on time!",
            use_ml=False
        )

        # Both should return valid results
        assert fee_result is not None
        assert feedback_result is not None
        assert feedback_result['sentiment'] > 0  # Positive sentiment

    def test_fraud_rating_integration(self):
        """Test TG-CMAE + TAS-DyRa integration: Fraud affects rating"""
        fraud_detector = get_fraud_detector()
        rating_engine = get_rating_engine()

        # Detect fraud
        fraud_result = fraud_detector.comprehensive_fraud_check(
            application_data={
                'application_id': 1,
                'actual_fee': 5000.0,
                'expected_fee': 4000.0
            }
        )

        fraud_score = fraud_result['fraud_analysis']['anomaly_score']

        # Update rating with fraud score
        rating_result = rating_engine.process_broker_update(
            broker_id=1,
            current_rating=4.0,
            task_data={
                'actual_time': 5.0,
                'expected_time': 5.0,
                'completed_tasks': 10,
                'total_tasks': 10,
                'sentiment_score': 0.0
            },
            fraud_score=fraud_score
        )

        # Fraud should negatively impact rating
        if fraud_score > 0.5:
            assert rating_result['new_rating'] < rating_result['old_rating']


# ============================================================================
# Run Tests
# ============================================================================

if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
