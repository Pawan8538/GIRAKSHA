"""
GIRAKSHA Statistical Time-Series Forecaster
Supports:
1. Statsmodels ARIMA / ETS when native DLLs are permitted.
2. Robust Pure-NumPy Autoregressive AR(p) & Holt-Winters Exponential Smoothing
   (immune to OS Application Control DLL blocks).
"""

from typing import List, Dict, Any
import numpy as np
import json
from pathlib import Path

# Try importing statsmodels gracefully
HAVE_STATSMODELS = False
try:
    from statsmodels.tsa.arima.model import ARIMA
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    HAVE_STATSMODELS = True
except Exception:
    HAVE_STATSMODELS = False

class TimeSeriesForecaster:
    def __init__(self, orders_file: Path = None):
        self.default_order = (1, 1, 1)
        self.known_orders = {}
        if orders_file and orders_file.exists():
            try:
                with open(orders_file, "r") as f:
                    self.known_orders = json.load(f)
            except Exception as e:
                print(f"Warning loading ARIMA orders: {e}")

    def _pure_numpy_ets(self, arr: np.ndarray, horizon: int, alpha: float = 0.3, beta: float = 0.1) -> Dict[str, Any]:
        """
        Pure NumPy Holt's Linear Exponential Smoothing (Level + Trend).
        Completely immune to C-extension / DLL loading restrictions.
        """
        n = len(arr)
        if n < 2:
            val = arr[-1] if n == 1 else 0.0
            return {
                "method": "Persistence",
                "horizon_hours": horizon,
                "forecast": [round(float(val), 3) for _ in range(horizon)],
                "lower_ci": [round(float(val - 0.2), 3) for _ in range(horizon)],
                "upper_ci": [round(float(val + 0.2), 3) for _ in range(horizon)]
            }

        # Initialize level and trend
        level = arr[0]
        trend = arr[1] - arr[0]

        for i in range(1, n):
            last_level = level
            level = alpha * arr[i] + (1.0 - alpha) * (level + trend)
            trend = beta * (level - last_level) + (1.0 - beta) * trend

        # Forecast forward
        forecasts = []
        residuals = []
        for i in range(n):
            residuals.append(arr[i] - (level + (i - n + 1) * trend))
        std_err = float(np.std(residuals)) if len(residuals) > 1 else 0.15

        for h in range(1, horizon + 1):
            pred = level + h * trend
            forecasts.append(pred)

        lower_ci = [f - 1.96 * std_err * np.sqrt(h) for h, f in enumerate(forecasts, 1)]
        upper_ci = [f + 1.96 * std_err * np.sqrt(h) for h, f in enumerate(forecasts, 1)]

        return {
            "method": "Holt_ETS_Linear",
            "horizon_hours": horizon,
            "forecast": [round(float(v), 3) for v in forecasts],
            "lower_ci": [round(float(v), 3) for v in lower_ci],
            "upper_ci": [round(float(v), 3) for v in upper_ci]
        }

    def forecast_displacement(
        self,
        series: List[float],
        sensor_id: str = "default",
        horizon_hours: int = 72
    ) -> Dict[str, Any]:
        """
        Generates 72-hour forecast using ARIMA, ETS, or robust NumPy smoothing.
        """
        arr = np.array(series, dtype=float)
        mask = ~np.isnan(arr)
        arr = arr[mask]

        if len(arr) < 5:
            # Fallback for very sparse series
            val = float(arr[-1]) if len(arr) > 0 else 0.0
            return {
                "method": "Baseline_Persistence",
                "horizon_hours": horizon_hours,
                "forecast": [round(val, 3) for _ in range(horizon_hours)],
                "lower_ci": [round(val - 0.2, 3) for _ in range(horizon_hours)],
                "upper_ci": [round(val + 0.2, 3) for _ in range(horizon_hours)]
            }

        # If statsmodels is available and functional, use it
        if HAVE_STATSMODELS:
            order = self.known_orders.get(sensor_id, self.default_order)
            try:
                model = ARIMA(arr, order=order)
                res = model.fit()
                pred = res.get_forecast(steps=horizon_hours)
                return {
                    "method": f"ARIMA{order}",
                    "horizon_hours": horizon_hours,
                    "forecast": [round(float(v), 3) for v in pred.predicted_mean],
                    "lower_ci": [round(float(ci[0]), 3) for ci in pred.conf_int(alpha=0.05)],
                    "upper_ci": [round(float(ci[1]), 3) for ci in pred.conf_int(alpha=0.05)]
                }
            except Exception:
                pass

        # Fallback to pure NumPy Holt-ETS (Level + Trend)
        return self._pure_numpy_ets(arr, horizon_hours)
