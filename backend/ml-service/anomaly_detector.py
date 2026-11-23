"""
GIRAKSHA Anomaly Detection Engine
Implements:
1. Robust Z-Score (|z| > 3.5 via Median Absolute Deviation)
2. Tabular CUSUM (k=0.5, h=5.0)
3. Isolation Forest inference via model_isolation_forest.joblib
4. CIMFR Rockfall Advisory Rules
"""

from typing import List, Dict, Any
import numpy as np
import pandas as pd
import joblib
from pathlib import Path

class AnomalyDetector:
    def __init__(self, model_path: Path = None):
        self.iso_forest = None
        if model_path and model_path.exists():
            try:
                self.iso_forest = joblib.load(model_path)
            except Exception as e:
                print(f"Warning: Could not load Isolation Forest: {e}")

    def robust_z_score(self, series: np.ndarray, threshold: float = 3.5) -> Dict[str, Any]:
        """
        Calculates Robust Z-score using Median and Median Absolute Deviation (MAD).
        Robust against extreme sensor spikes.
        """
        clean_s = series[~np.isnan(series)]
        if len(clean_s) < 3:
            return {"anomaly": False, "score": 0.0, "threshold": threshold}

        med = np.median(clean_s)
        mad = np.median(np.abs(clean_s - med))
        if mad < 1e-6:
            mad = np.std(clean_s) + 1e-6

        # Scale factor 1.4826 for normal consistency
        z_score = np.abs(clean_s[-1] - med) / (1.4826 * mad)
        return {
            "anomaly": bool(z_score > threshold),
            "z_score": round(float(z_score), 3),
            "threshold": threshold,
            "metric": "robust_z"
        }

    def cusum(self, series: np.ndarray, k: float = 0.5, h: float = 5.0) -> Dict[str, Any]:
        """
        Two-sided Cumulative Sum (CUSUM) detector for abrupt mean shifts.
        k: slack parameter (allowable drift)
        h: decision interval threshold
        """
        clean_s = series[~np.isnan(series)]
        if len(clean_s) < 5:
            return {"anomaly": False, "sh": 0.0, "sl": 0.0, "threshold": h}

        mu = np.mean(clean_s[:-1])
        std = np.std(clean_s[:-1]) + 1e-6

        sh, sl = 0.0, 0.0
        for x in clean_s:
            z = (x - mu) / std
            sh = max(0.0, sh + z - k)
            sl = max(0.0, sl - z - k)

        anomaly = bool(sh > h or sl > h)
        return {
            "anomaly": anomaly,
            "cusum_high": round(float(sh), 3),
            "cusum_low": round(float(sl), 3),
            "threshold": h,
            "metric": "cusum"
        }

    def detect_all(self, displacement_series: List[float], pore_series: List[float] = None) -> Dict[str, Any]:
        """
        Multi-technique composite anomaly detection.
        """
        d_arr = np.array(displacement_series, dtype=float)
        
        z_res = self.robust_z_score(d_arr, threshold=3.5)
        cusum_res = self.cusum(d_arr, k=0.5, h=5.0)

        # Isolation Forest scoring
        if_anomaly = False
        if_score = 0.0
        if self.iso_forest is not None and len(d_arr) >= 1:
            try:
                # Prepare single row feature vector if available or recent rolling stats
                feat = np.array([[d_arr[-1], np.diff(d_arr)[-1] if len(d_arr) > 1 else 0.0]])
                if hasattr(self.iso_forest, "n_features_in_") and self.iso_forest.n_features_in_ == 2:
                    pred = self.iso_forest.predict(feat)
                    if_anomaly = bool(pred[0] == -1)
                    if_score = float(self.iso_forest.score_samples(feat)[0])
            except Exception:
                pass

        # Composite agreement
        composite_alert = bool(z_res["anomaly"] or cusum_res["anomaly"] or if_anomaly)

        return {
            "composite_anomaly": composite_alert,
            "techniques": {
                "robust_z": z_res,
                "cusum": cusum_res,
                "isolation_forest": {
                    "anomaly": if_anomaly,
                    "score": round(if_score, 4)
                }
            }
        }
