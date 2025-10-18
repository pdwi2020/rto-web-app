"""
XFDRC: Explainable Fee-Dynamic Rating-Communication Model
Fee Estimator Component with XGBoost + SHAP Explainability
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
import json

# Optional imports with fallbacks
try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False


class FeeEstimator:
    """
    Explainable fee estimation using XGBoost with SHAP interpretability.
    Predicts fair fee (Government + Broker) and detects fee inflation.
    """

    def __init__(self):
        self.model = None
        self.feature_names = [
            'service_type_encoded',
            'vehicle_class_encoded',
            'region_encoded',
            'broker_tier_encoded',
            'avg_processing_time',
            'seasonal_load',
            'anomaly_score'
        ]

        # Official fee structure (Government fees - base values in INR)
        self.govt_fees = {
            'New Registration': {
                'Two Wheeler': 1500,
                'Four Wheeler (Car/SUV)': 3000,
                'Commercial': 5000,
                'Heavy Vehicle': 8000
            },
            'Renewal': {
                'Two Wheeler': 800,
                'Four Wheeler (Car/SUV)': 1500,
                'Commercial': 2500,
                'Heavy Vehicle': 4000
            },
            'Transfer of Ownership': {
                'Two Wheeler': 600,
                'Four Wheeler (Car/SUV)': 1200,
                'Commercial': 2000,
                'Heavy Vehicle': 3500
            },
            'Duplicate RC': {
                'Two Wheeler': 300,
                'Four Wheeler (Car/SUV)': 500,
                'Commercial': 800,
                'Heavy Vehicle': 1200
            },
            'License Renewal': {
                'Two Wheeler': 400,
                'Four Wheeler (Car/SUV)': 600,
                'Commercial': 1000,
                'Heavy Vehicle': 1500
            }
        }

        # Broker fee percentage (based on tier)
        self.broker_fee_percent = {
            'Gold': 0.15,      # 15% of govt fee
            'Silver': 0.20,    # 20% of govt fee
            'Bronze': 0.25,    # 25% of govt fee
            'Default': 0.20    # 20% default
        }

        # Service type encoding
        self.service_encoding = {
            'New Registration': 0,
            'Renewal': 1,
            'Transfer of Ownership': 2,
            'Duplicate RC': 3,
            'License Renewal': 4
        }

        # Vehicle class encoding
        self.vehicle_encoding = {
            'Two Wheeler': 0,
            'Four Wheeler (Car/SUV)': 1,
            'Commercial': 2,
            'Heavy Vehicle': 3
        }

        # Broker tier encoding
        self.tier_encoding = {
            'Gold': 0,
            'Silver': 1,
            'Bronze': 2,
            'Blacklisted': 3,
            'Default': 1
        }

        # Initialize model with synthetic training if XGBoost available
        if XGBOOST_AVAILABLE:
            self._initialize_model()

    def _initialize_model(self):
        """Initialize XGBoost model with synthetic training data"""
        # Generate synthetic training data
        X_train, y_train = self._generate_synthetic_training_data(n_samples=1000)

        # Train XGBoost model
        self.model = xgb.XGBRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42,
            objective='reg:squarederror'
        )
        self.model.fit(X_train, y_train)

    def _generate_synthetic_training_data(self, n_samples: int = 1000) -> Tuple[np.ndarray, np.ndarray]:
        """Generate synthetic training data for fee estimation"""
        np.random.seed(42)

        features = []
        labels = []

        for _ in range(n_samples):
            # Random service type and vehicle class
            service_idx = np.random.randint(0, 5)
            vehicle_idx = np.random.randint(0, 4)
            region_idx = np.random.randint(0, 10)  # 10 regions
            tier_idx = np.random.randint(0, 3)  # Gold, Silver, Bronze

            # Random operational features
            avg_time = np.random.uniform(1, 10)  # 1-10 days
            seasonal_load = np.random.uniform(0.5, 1.5)  # Load multiplier
            anomaly_score = np.random.uniform(0, 0.3)  # Low anomaly for training

            # Calculate expected fee
            service_types = list(self.service_encoding.keys())
            vehicle_classes = list(self.vehicle_encoding.keys())

            service_type = service_types[service_idx]
            vehicle_class = vehicle_classes[vehicle_idx]

            base_fee = self.govt_fees.get(service_type, {}).get(vehicle_class, 1000)
            broker_tier = ['Gold', 'Silver', 'Bronze'][tier_idx]
            broker_multiplier = self.broker_fee_percent[broker_tier]

            # Calculate total with variations
            govt_fee = base_fee * seasonal_load
            broker_fee = govt_fee * broker_multiplier
            service_fee = govt_fee + broker_fee
            tax = service_fee * 0.18  # 18% GST

            total_fee = govt_fee + broker_fee + tax

            # Add some noise
            total_fee *= np.random.uniform(0.95, 1.05)

            features.append([
                service_idx, vehicle_idx, region_idx, tier_idx,
                avg_time, seasonal_load, anomaly_score
            ])
            labels.append(total_fee)

        return np.array(features), np.array(labels)

    def _encode_features(
        self,
        service_type: str,
        vehicle_class: str,
        broker_tier: str = 'Silver',
        region: str = 'TN-45',
        avg_processing_time: float = 5.0,
        seasonal_load: float = 1.0,
        anomaly_score: float = 0.0
    ) -> np.ndarray:
        """Encode categorical features to numerical"""
        service_encoded = self.service_encoding.get(service_type, 0)
        vehicle_encoded = self.vehicle_encoding.get(vehicle_class, 0)
        tier_encoded = self.tier_encoding.get(broker_tier, 1)
        region_encoded = hash(region) % 10  # Simple region encoding

        return np.array([[
            service_encoded,
            vehicle_encoded,
            region_encoded,
            tier_encoded,
            avg_processing_time,
            seasonal_load,
            anomaly_score
        ]])

    def calculate_base_fee(
        self,
        service_type: str,
        vehicle_class: str,
        broker_tier: str = 'Silver'
    ) -> Dict:
        """
        Calculate base fee structure (rule-based fallback)
        """
        # Get government base fee
        base_fee = self.govt_fees.get(service_type, {}).get(vehicle_class, 0)

        if base_fee == 0:
            # Default fallback
            base_fee = 1000

        # Calculate broker commission
        broker_multiplier = self.broker_fee_percent.get(broker_tier, 0.20)
        broker_commission = base_fee * broker_multiplier

        # Service fee (govt + broker)
        service_fee = base_fee + broker_commission

        # GST (18%)
        tax_gst = service_fee * 0.18

        # Total
        total = base_fee + broker_commission + tax_gst

        return {
            'base_fee': round(base_fee, 2),
            'broker_commission': round(broker_commission, 2),
            'service_fee': round(service_fee, 2),
            'tax_gst': round(tax_gst, 2),
            'total': round(total, 2)
        }

    def estimate_fee(
        self,
        service_type: str,
        vehicle_class: str,
        broker_tier: str = 'Silver',
        region: str = 'TN-45',
        avg_processing_time: float = 5.0,
        seasonal_load: float = 1.0,
        anomaly_score: float = 0.0,
        use_ml: bool = True
    ) -> Dict:
        """
        Estimate fee using ML model or rule-based calculation

        Args:
            service_type: Type of RTO service
            vehicle_class: Class of vehicle
            broker_tier: Broker rating tier
            region: Region code
            avg_processing_time: Average processing time in days
            seasonal_load: Seasonal workload multiplier
            anomaly_score: Anomaly score from fraud detection (0-1)
            use_ml: Whether to use ML model (if available)

        Returns:
            Dictionary with fee breakdown and explainability
        """
        # Rule-based calculation as fallback
        base_breakdown = self.calculate_base_fee(service_type, vehicle_class, broker_tier)

        result = {
            'service_type': service_type,
            'vehicle_class': vehicle_class,
            'broker_tier': broker_tier,
            'breakdown': base_breakdown,
            'predicted_total': base_breakdown['total'],
            'confidence': 0.85,
            'method': 'rule_based',
            'explanation': {}
        }

        # Try ML prediction if available and requested
        if use_ml and XGBOOST_AVAILABLE and self.model is not None:
            try:
                # Encode features
                X = self._encode_features(
                    service_type, vehicle_class, broker_tier,
                    region, avg_processing_time, seasonal_load, anomaly_score
                )

                # Predict
                predicted_total = self.model.predict(X)[0]

                # Get SHAP explanation if available
                explanation = {}
                if SHAP_AVAILABLE:
                    try:
                        explainer = shap.TreeExplainer(self.model)
                        shap_values = explainer.shap_values(X)

                        # Create explanation dictionary
                        for i, feature_name in enumerate(self.feature_names):
                            explanation[feature_name] = float(shap_values[0][i])

                        # Get top contributing factors
                        sorted_features = sorted(
                            explanation.items(),
                            key=lambda x: abs(x[1]),
                            reverse=True
                        )
                        explanation['top_factors'] = [
                            {'feature': k, 'contribution': round(v, 2)}
                            for k, v in sorted_features[:3]
                        ]
                    except Exception:
                        explanation = {'error': 'SHAP explanation failed'}

                result.update({
                    'predicted_total': round(float(predicted_total), 2),
                    'confidence': 0.92,
                    'method': 'xgboost_ml',
                    'explanation': explanation
                })
            except Exception as e:
                # Fall back to rule-based if ML fails
                result['ml_error'] = str(e)

        return result

    def detect_fee_inflation(
        self,
        actual_fee: float,
        service_type: str,
        vehicle_class: str,
        broker_tier: str = 'Silver',
        threshold: float = 0.20  # 20% deviation threshold
    ) -> Dict:
        """
        Detect if actual fee charged is inflated compared to expected

        Returns:
            Dictionary with inflation status and penalty score
        """
        # Get expected fee
        expected = self.estimate_fee(service_type, vehicle_class, broker_tier)
        expected_total = expected['predicted_total']

        # Calculate deviation
        deviation = (actual_fee - expected_total) / expected_total if expected_total > 0 else 0

        # Inflation penalty
        inflation_penalty = 0.0
        status = 'normal'

        if deviation > threshold:
            inflation_penalty = min(deviation * 2, 1.0)  # Cap at 1.0
            status = 'inflated'
        elif deviation < -threshold:
            status = 'undercharged'

        return {
            'status': status,
            'actual_fee': actual_fee,
            'expected_fee': expected_total,
            'deviation_percent': round(deviation * 100, 2),
            'inflation_penalty': round(inflation_penalty, 3),
            'threshold_percent': threshold * 100,
            'is_suspicious': abs(deviation) > threshold
        }


# Global instance
_fee_estimator = None

def get_fee_estimator() -> FeeEstimator:
    """Get or create global fee estimator instance"""
    global _fee_estimator
    if _fee_estimator is None:
        _fee_estimator = FeeEstimator()
    return _fee_estimator
