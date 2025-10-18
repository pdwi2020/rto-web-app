"""
TG-CMAE: Temporal Graph Cross-Modal Autoencoder
Advanced fraud detection system combining temporal, graph, and multimodal analysis
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
import json

# Optional deep learning imports
try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


class FraudDetector:
    """
    Simplified TG-CMAE implementation for fraud detection

    Detects fraud patterns:
    - Ghosting (start without completion)
    - Duplicate submissions
    - Fee inflation
    - Fake delays
    - Document forgery patterns
    """

    def __init__(self):
        # Fraud detection thresholds
        self.thresholds = {
            'ghosting_hours': 48,  # No activity for 48+ hours
            'duplicate_similarity': 0.85,  # 85% similarity threshold
            'fee_inflation': 0.25,  # 25% above expected
            'delay_ratio': 1.5,  # 50% longer than expected
            'forgery_confidence': 0.6  # 60% forgery confidence
        }

        # Temporal patterns for anomaly detection
        self.normal_patterns = {
            'avg_completion_time': 5.0,  # days
            'std_completion_time': 2.0,
            'avg_fee_ratio': 1.15,  # 15% broker markup
            'std_fee_ratio': 0.10
        }

        # Graph relationship tracking
        self.broker_citizen_graph = defaultdict(set)
        self.broker_task_history = defaultdict(list)

    def detect_ghosting(
        self,
        otp_start_time: Optional[datetime],
        otp_close_time: Optional[datetime],
        current_time: Optional[datetime] = None
    ) -> Dict:
        """
        Detect ghosting pattern (OTP start without completion)
        """
        if not otp_start_time:
            return {'is_ghosting': False, 'confidence': 0.0, 'reason': 'No OTP start time'}

        if otp_close_time:
            return {'is_ghosting': False, 'confidence': 0.0, 'reason': 'Task completed'}

        # Calculate elapsed time
        if current_time is None:
            current_time = datetime.now()

        elapsed_hours = (current_time - otp_start_time).total_seconds() / 3600

        # Check if ghosting
        is_ghosting = elapsed_hours > self.thresholds['ghosting_hours']

        confidence = min(elapsed_hours / self.thresholds['ghosting_hours'], 1.0)

        return {
            'is_ghosting': is_ghosting,
            'confidence': round(confidence, 3),
            'elapsed_hours': round(elapsed_hours, 1),
            'threshold_hours': self.thresholds['ghosting_hours'],
            'reason': f"Task started {elapsed_hours:.1f}h ago but not completed"
        }

    def detect_duplicate_submission(
        self,
        new_application: Dict,
        existing_applications: List[Dict],
        similarity_threshold: float = None
    ) -> Dict:
        """
        Detect duplicate/similar submissions
        """
        if similarity_threshold is None:
            similarity_threshold = self.thresholds['duplicate_similarity']

        duplicates = []

        for existing in existing_applications:
            similarity = self._calculate_application_similarity(new_application, existing)

            if similarity >= similarity_threshold:
                duplicates.append({
                    'application_id': existing.get('id'),
                    'similarity': round(similarity, 3),
                    'matching_fields': self._get_matching_fields(new_application, existing)
                })

        is_duplicate = len(duplicates) > 0

        return {
            'is_duplicate': is_duplicate,
            'confidence': max([d['similarity'] for d in duplicates]) if duplicates else 0.0,
            'duplicate_count': len(duplicates),
            'duplicates': duplicates,
            'reason': f"Found {len(duplicates)} similar applications" if is_duplicate else "No duplicates found"
        }

    def _calculate_application_similarity(self, app1: Dict, app2: Dict) -> float:
        """Calculate similarity between two applications"""
        # Key fields to compare
        fields = ['citizen_id', 'vehicle_class', 'application_type', 'chassis_number', 'engine_number']

        matches = 0
        total = 0

        for field in fields:
            if field in app1 and field in app2:
                total += 1
                if app1[field] == app2[field]:
                    matches += 1

        return matches / total if total > 0 else 0.0

    def _get_matching_fields(self, app1: Dict, app2: Dict) -> List[str]:
        """Get list of matching fields between applications"""
        fields = ['citizen_id', 'vehicle_class', 'application_type', 'chassis_number', 'engine_number']
        return [f for f in fields if app1.get(f) == app2.get(f)]

    def detect_fee_inflation(
        self,
        actual_fee: float,
        expected_fee: float,
        inflation_threshold: float = None
    ) -> Dict:
        """
        Detect abnormal fee inflation
        """
        if inflation_threshold is None:
            inflation_threshold = self.thresholds['fee_inflation']

        if expected_fee <= 0:
            return {'is_inflated': False, 'confidence': 0.0, 'reason': 'Invalid expected fee'}

        # Calculate deviation
        deviation = (actual_fee - expected_fee) / expected_fee

        is_inflated = deviation > inflation_threshold

        confidence = min(abs(deviation) / inflation_threshold, 1.0) if is_inflated else 0.0

        return {
            'is_inflated': is_inflated,
            'confidence': round(confidence, 3),
            'deviation_percent': round(deviation * 100, 2),
            'threshold_percent': inflation_threshold * 100,
            'actual_fee': actual_fee,
            'expected_fee': expected_fee,
            'excess_amount': round(actual_fee - expected_fee, 2),
            'reason': f"Fee {deviation*100:.1f}% {'above' if deviation > 0 else 'below'} expected"
        }

    def detect_fake_delay(
        self,
        actual_duration: float,
        expected_duration: float,
        broker_avg_duration: Optional[float] = None
    ) -> Dict:
        """
        Detect artificially inflated delays
        """
        delay_ratio = actual_duration / expected_duration if expected_duration > 0 else 1.0

        is_delayed = delay_ratio > self.thresholds['delay_ratio']

        # Check if this is unusual for this broker
        if broker_avg_duration and broker_avg_duration > 0:
            broker_ratio = actual_duration / broker_avg_duration
            is_unusual = broker_ratio > 1.5
        else:
            is_unusual = False

        confidence = min((delay_ratio - 1.0) / 0.5, 1.0) if is_delayed else 0.0

        return {
            'is_delayed': is_delayed,
            'is_unusual_for_broker': is_unusual,
            'confidence': round(confidence, 3),
            'delay_ratio': round(delay_ratio, 2),
            'actual_days': actual_duration,
            'expected_days': expected_duration,
            'broker_avg_days': broker_avg_duration,
            'reason': f"Task took {delay_ratio:.1f}x expected time"
        }

    def analyze_document_forgery_pattern(
        self,
        forgery_results: List[Dict],
        broker_id: int
    ) -> Dict:
        """
        Analyze pattern of forged documents from a broker
        """
        if not forgery_results:
            return {'pattern_detected': False, 'confidence': 0.0}

        # Count suspicious documents
        suspicious_count = sum(1 for r in forgery_results if r.get('is_forged', False))
        total_count = len(forgery_results)

        suspicious_ratio = suspicious_count / total_count if total_count > 0 else 0.0

        # Detect pattern
        pattern_detected = suspicious_ratio > 0.3  # 30% or more suspicious

        return {
            'pattern_detected': pattern_detected,
            'confidence': round(suspicious_ratio, 3),
            'suspicious_count': suspicious_count,
            'total_documents': total_count,
            'suspicious_ratio': round(suspicious_ratio, 3),
            'broker_id': broker_id,
            'reason': f"{suspicious_ratio*100:.0f}% of documents flagged as suspicious"
        }

    def calculate_composite_anomaly_score(
        self,
        ghosting_result: Dict,
        duplicate_result: Dict,
        fee_inflation_result: Dict,
        delay_result: Dict,
        forgery_pattern: Dict,
        weights: Optional[Dict] = None
    ) -> Dict:
        """
        Calculate composite anomaly score from multiple detectors

        Formula: Score = Σ(weight_i × confidence_i)
        """
        if weights is None:
            weights = {
                'ghosting': 0.25,
                'duplicate': 0.20,
                'fee_inflation': 0.25,
                'delay': 0.15,
                'forgery': 0.15
            }

        # Extract confidences
        confidences = {
            'ghosting': ghosting_result.get('confidence', 0.0),
            'duplicate': duplicate_result.get('confidence', 0.0),
            'fee_inflation': fee_inflation_result.get('confidence', 0.0),
            'delay': delay_result.get('confidence', 0.0),
            'forgery': forgery_pattern.get('confidence', 0.0)
        }

        # Calculate weighted score
        components = {}
        for key, weight in weights.items():
            components[key] = weight * confidences[key]

        total_score = sum(components.values())

        # Determine fraud level
        if total_score >= 0.7:
            fraud_level = 'critical'
        elif total_score >= 0.5:
            fraud_level = 'high'
        elif total_score >= 0.3:
            fraud_level = 'medium'
        else:
            fraud_level = 'low'

        # Identify primary fraud indicators
        fraud_indicators = []
        for key, conf in confidences.items():
            if conf > 0.5:
                fraud_indicators.append({
                    'type': key,
                    'confidence': round(conf, 3)
                })

        return {
            'anomaly_score': round(total_score, 3),
            'fraud_level': fraud_level,
            'is_fraudulent': total_score >= 0.5,
            'confidence_breakdown': {k: round(v, 3) for k, v in confidences.items()},
            'weighted_components': {k: round(v, 3) for k, v in components.items()},
            'fraud_indicators': fraud_indicators,
            'weights_used': weights
        }

    def comprehensive_fraud_check(
        self,
        application_data: Dict,
        broker_data: Optional[Dict] = None,
        existing_applications: Optional[List[Dict]] = None
    ) -> Dict:
        """
        Run comprehensive fraud detection analysis

        Args:
            application_data: Current application details
            broker_data: Broker history and statistics
            existing_applications: List of existing applications for duplicate check

        Returns:
            Complete fraud analysis report
        """
        # Extract data
        otp_start = application_data.get('otp_start_time')
        otp_close = application_data.get('otp_close_time')
        actual_fee = application_data.get('actual_fee', 0.0)
        expected_fee = application_data.get('expected_fee', 0.0)
        actual_duration = application_data.get('actual_duration', 0.0)
        expected_duration = application_data.get('expected_duration', 5.0)
        broker_id = application_data.get('broker_id')

        # Broker statistics
        broker_avg_duration = None
        if broker_data:
            broker_avg_duration = broker_data.get('avg_completion_time')

        # Run individual detectors
        ghosting = self.detect_ghosting(otp_start, otp_close)

        duplicate = {'is_duplicate': False, 'confidence': 0.0}
        if existing_applications:
            duplicate = self.detect_duplicate_submission(application_data, existing_applications)

        fee_inflation = self.detect_fee_inflation(actual_fee, expected_fee)
        delay = self.detect_fake_delay(actual_duration, expected_duration, broker_avg_duration)

        # Forgery pattern (if available)
        forgery_results = application_data.get('forgery_checks', [])
        forgery = self.analyze_document_forgery_pattern(forgery_results, broker_id)

        # Calculate composite score
        composite = self.calculate_composite_anomaly_score(
            ghosting, duplicate, fee_inflation, delay, forgery
        )

        return {
            'application_id': application_data.get('id'),
            'broker_id': broker_id,
            'fraud_analysis': composite,
            'individual_checks': {
                'ghosting': ghosting,
                'duplicate': duplicate,
                'fee_inflation': fee_inflation,
                'delay': delay,
                'forgery_pattern': forgery
            },
            'timestamp': datetime.now().isoformat(),
            'recommendation': self._generate_recommendation(composite)
        }

    def _generate_recommendation(self, composite: Dict) -> Dict:
        """Generate action recommendation based on fraud analysis"""
        score = composite['anomaly_score']
        level = composite['fraud_level']

        if level == 'critical':
            action = 'immediate_review'
            message = "CRITICAL: Immediate manual review required. Consider suspending broker."
        elif level == 'high':
            action = 'escalate'
            message = "HIGH RISK: Escalate to admin for verification before proceeding."
        elif level == 'medium':
            action = 'monitor'
            message = "MEDIUM RISK: Flag for monitoring. Request additional documentation."
        else:
            action = 'approve'
            message = "LOW RISK: Proceed with normal verification."

        return {
            'action': action,
            'message': message,
            'auto_approve': score < 0.3,
            'requires_review': score >= 0.5
        }


# Global instance
_fraud_detector = None

def get_fraud_detector() -> FraudDetector:
    """Get or create global fraud detector instance"""
    global _fraud_detector
    if _fraud_detector is None:
        _fraud_detector = FraudDetector()
    return _fraud_detector
