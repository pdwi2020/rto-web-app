"""
TAS-DyRa: Temporal Anomaly-Scored Dynamic Rating Algorithm
Implements reinforcement-inspired dynamic broker rating with temporal decay
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import json


class TASRatingEngine:
    """
    Temporal Anomaly-Scored Dynamic Rating Engine

    Implements the TAS-DyRa algorithm:
    R(t+1) = R(t) + α × Reward(t)

    Where Reward = w1×timeliness + w2×completion + w3×sentiment - w4×anomaly - w5×fraud
    """

    def __init__(self):
        # Learning rate for rating updates
        self.alpha = 0.1

        # Feature weights (will be learned/adapted)
        self.weights = {
            'timeliness': 0.25,
            'completion': 0.20,
            'sentiment': 0.20,
            'anomaly_penalty': 0.20,
            'fraud_penalty': 0.15
        }

        # Temporal decay parameter
        self.decay_lambda = 0.1  # Decay rate for older data

        # Rating thresholds for categories
        self.rating_thresholds = {
            'Gold': 4.0,
            'Silver': 3.0,
            'Bronze': 2.0,
            'Blacklisted': 0.0
        }

        # Maximum rating change per update (prevents drastic swings)
        self.max_delta = 0.5

    def calculate_timeliness_score(
        self,
        actual_time: float,
        expected_time: float
    ) -> float:
        """
        Calculate timeliness score based on completion time

        Score = 1 - (actual_time / expected_time)
        Capped between 0 and 1
        """
        if expected_time <= 0:
            return 0.5  # Neutral score

        ratio = actual_time / expected_time

        if ratio <= 0.5:
            return 1.0  # Completed in half the time
        elif ratio <= 1.0:
            return 1.0 - (ratio - 0.5)  # Linear decrease
        else:
            # Penalty for delays
            penalty = min(0.5, (ratio - 1.0) * 0.5)
            return max(0.0, 0.5 - penalty)

    def calculate_completion_rate(
        self,
        completed_tasks: int,
        total_tasks: int
    ) -> float:
        """Calculate task completion rate"""
        if total_tasks == 0:
            return 0.5  # Neutral for no tasks
        return completed_tasks / total_tasks

    def apply_temporal_decay(
        self,
        score: float,
        days_ago: float,
        max_days: float = 90
    ) -> float:
        """
        Apply temporal decay to older scores

        weight = e^(-λ × days_ago / max_days)
        """
        if max_days <= 0:
            return score

        normalized_days = days_ago / max_days
        decay_factor = np.exp(-self.decay_lambda * normalized_days)

        return score * decay_factor

    def calculate_reward(
        self,
        timeliness_score: float,
        completion_rate: float,
        sentiment_score: float,
        anomaly_score: float = 0.0,
        fraud_score: float = 0.0
    ) -> Dict:
        """
        Calculate reward using weighted combination of metrics

        Returns reward value and component breakdown
        """
        # Normalize sentiment from [-1, 1] to [0, 1]
        normalized_sentiment = (sentiment_score + 1) / 2

        # Calculate weighted components
        components = {
            'timeliness': self.weights['timeliness'] * timeliness_score,
            'completion': self.weights['completion'] * completion_rate,
            'sentiment': self.weights['sentiment'] * normalized_sentiment,
            'anomaly_penalty': -self.weights['anomaly_penalty'] * anomaly_score,
            'fraud_penalty': -self.weights['fraud_penalty'] * fraud_score
        }

        # Total reward
        total_reward = sum(components.values())

        return {
            'total_reward': total_reward,
            'components': components,
            'weights_used': self.weights.copy()
        }

    def update_rating(
        self,
        current_rating: float,
        reward: float,
        clamp: bool = True
    ) -> float:
        """
        Update rating using reinforcement-inspired rule

        R(t+1) = R(t) + α × reward
        """
        # Calculate delta
        delta = self.alpha * reward

        # Cap maximum change
        delta = max(min(delta, self.max_delta), -self.max_delta)

        # Update rating
        new_rating = current_rating + delta

        # Clamp to valid range [0, 5]
        if clamp:
            new_rating = max(0.0, min(5.0, new_rating))

        return new_rating

    def categorize_rating(self, rating: float) -> str:
        """Determine broker category based on rating"""
        if rating >= self.rating_thresholds['Gold']:
            return 'Gold'
        elif rating >= self.rating_thresholds['Silver']:
            return 'Silver'
        elif rating >= self.rating_thresholds['Bronze']:
            return 'Bronze'
        else:
            return 'Blacklisted'

    def process_broker_update(
        self,
        broker_id: int,
        current_rating: float,
        task_data: Dict,
        anomaly_score: float = 0.0,
        fraud_score: float = 0.0,
        days_ago: float = 0.0
    ) -> Dict:
        """
        Complete rating update pipeline for a broker

        Args:
            broker_id: Broker identifier
            current_rating: Current rating value
            task_data: Dictionary with task metrics
                - actual_time: float (days)
                - expected_time: float (days)
                - completed_tasks: int
                - total_tasks: int
                - sentiment_score: float (-1 to 1)
            anomaly_score: Score from TG-CMAE (0 to 1)
            fraud_score: Fraud indicator score (0 to 1)
            days_ago: How old is this data (for temporal weighting)

        Returns:
            Dictionary with new rating and explanation
        """
        # Extract task data
        actual_time = task_data.get('actual_time', 5.0)
        expected_time = task_data.get('expected_time', 5.0)
        completed_tasks = task_data.get('completed_tasks', 0)
        total_tasks = task_data.get('total_tasks', 1)
        sentiment_score = task_data.get('sentiment_score', 0.0)

        # Calculate component scores
        timeliness = self.calculate_timeliness_score(actual_time, expected_time)
        completion = self.calculate_completion_rate(completed_tasks, total_tasks)

        # Calculate reward
        reward_info = self.calculate_reward(
            timeliness, completion, sentiment_score,
            anomaly_score, fraud_score
        )

        # Apply temporal decay to reward
        if days_ago > 0:
            decayed_reward = self.apply_temporal_decay(
                reward_info['total_reward'],
                days_ago
            )
            decay_factor = decayed_reward / reward_info['total_reward'] if reward_info['total_reward'] != 0 else 1.0
        else:
            decayed_reward = reward_info['total_reward']
            decay_factor = 1.0

        # Update rating
        new_rating = self.update_rating(current_rating, decayed_reward)

        # Categorize
        old_category = self.categorize_rating(current_rating)
        new_category = self.categorize_rating(new_rating)

        # Build explanation
        explanation = self._build_explanation(
            current_rating, new_rating,
            reward_info, timeliness, completion,
            sentiment_score, anomaly_score, fraud_score,
            decay_factor
        )

        return {
            'broker_id': broker_id,
            'old_rating': round(current_rating, 3),
            'new_rating': round(new_rating, 3),
            'rating_change': round(new_rating - current_rating, 3),
            'old_category': old_category,
            'new_category': new_category,
            'category_changed': old_category != new_category,
            'reward': round(decayed_reward, 3),
            'temporal_decay_factor': round(decay_factor, 3),
            'explanation': explanation,
            'metrics': {
                'timeliness_score': round(timeliness, 3),
                'completion_rate': round(completion, 3),
                'sentiment_score': sentiment_score,
                'anomaly_score': anomaly_score,
                'fraud_score': fraud_score
            }
        }

    def _build_explanation(
        self,
        old_rating: float,
        new_rating: float,
        reward_info: Dict,
        timeliness: float,
        completion: float,
        sentiment: float,
        anomaly: float,
        fraud: float,
        decay_factor: float
    ) -> Dict:
        """Build human-readable explanation of rating change"""

        delta = new_rating - old_rating
        components = reward_info['components']

        # Identify top positive and negative factors
        positive_factors = []
        negative_factors = []

        for factor, value in components.items():
            if value > 0.05:
                positive_factors.append({
                    'factor': factor.replace('_', ' ').title(),
                    'contribution': round(value, 3)
                })
            elif value < -0.05:
                negative_factors.append({
                    'factor': factor.replace('_', ' ').title(),
                    'contribution': round(abs(value), 3)
                })

        # Sort by magnitude
        positive_factors.sort(key=lambda x: x['contribution'], reverse=True)
        negative_factors.sort(key=lambda x: x['contribution'], reverse=True)

        # Generate summary text
        if delta > 0.05:
            direction = "increased"
        elif delta < -0.05:
            direction = "decreased"
        else:
            direction = "remained stable"

        summary = f"Rating {direction} by {abs(delta):.3f} points."

        return {
            'summary': summary,
            'direction': direction,
            'magnitude': round(abs(delta), 3),
            'positive_factors': positive_factors,
            'negative_factors': negative_factors,
            'temporal_adjustment': f"Decay factor: {decay_factor:.2%}" if decay_factor < 1.0 else "Current data",
            'component_breakdown': {k: round(v, 3) for k, v in components.items()}
        }

    def batch_update_ratings(
        self,
        broker_updates: List[Dict]
    ) -> List[Dict]:
        """
        Process multiple broker rating updates

        Args:
            broker_updates: List of update dictionaries

        Returns:
            List of results
        """
        results = []
        for update in broker_updates:
            result = self.process_broker_update(**update)
            results.append(result)

        return results

    def get_rating_trend(
        self,
        rating_history: List[Tuple[datetime, float]],
        days: int = 30
    ) -> Dict:
        """
        Analyze rating trend over time

        Args:
            rating_history: List of (timestamp, rating) tuples
            days: Number of days to analyze

        Returns:
            Trend analysis
        """
        if not rating_history:
            return {'trend': 'no_data', 'slope': 0.0}

        # Filter to recent days
        cutoff = datetime.now() - timedelta(days=days)
        recent = [(ts, r) for ts, r in rating_history if ts >= cutoff]

        if len(recent) < 2:
            return {'trend': 'insufficient_data', 'slope': 0.0}

        # Calculate linear trend
        times = np.array([(ts - recent[0][0]).days for ts, _ in recent])
        ratings = np.array([r for _, r in recent])

        # Simple linear regression
        slope = np.polyfit(times, ratings, 1)[0]

        # Categorize trend
        if slope > 0.05:
            trend = 'improving'
        elif slope < -0.05:
            trend = 'declining'
        else:
            trend = 'stable'

        return {
            'trend': trend,
            'slope': round(float(slope), 4),
            'days_analyzed': days,
            'data_points': len(recent),
            'start_rating': round(float(recent[0][1]), 2),
            'current_rating': round(float(recent[-1][1]), 2),
            'change': round(float(recent[-1][1] - recent[0][1]), 2)
        }


# Global instance
_rating_engine = None

def get_rating_engine() -> TASRatingEngine:
    """Get or create global rating engine instance"""
    global _rating_engine
    if _rating_engine is None:
        _rating_engine = TASRatingEngine()
    return _rating_engine
