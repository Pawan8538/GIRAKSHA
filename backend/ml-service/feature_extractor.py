"""
GIRAKSHA 23-Feature Causal Extractor
Converts raw geotechnical & environmental sensor time-series into the exact
23-feature vector expected by model_xgboost.joblib and benchmark classifiers.
"""

from typing import Dict, Any, List
import numpy as np
import pandas as pd

FEATURES = [
    "v6", "v24", "v72", "v7d", "acc24", "v24_ratio", "maxjump24", "drange24",
    "u", "du24", "du72", "u_dev30",
    "r24", "r72", "r7d", "r30d",
    "ppv24", "ppv7d", "blast24",
    "tilt24",
    "slope_deg", "curvature", "roughness"
]

def extract_23_features(df_history: pd.DataFrame, slope_metadata: Dict[str, float] = None) -> pd.DataFrame:
    """
    Extracts the 23 causal features from a pandas DataFrame of raw sensor readings.
    
    Expected raw columns (aliases supported):
      - displacement: 'd_obs' or 'disp_mm' or 'displacement'
      - pore pressure: 'u_obs' or 'pore_kpa' or 'pore_pressure'
      - tilt: 'tilt' or 'tilt_deg'
      - rainfall: 'rain_obs' or 'rain_mm' or 'precip_mm'
      - vibration/PPV: 'ppv' or 'vibration_g' or 'ppv_mms'
    """
    if slope_metadata is None:
        slope_metadata = {}
        
    g = pd.DataFrame()
    
    # Map input column names with fallbacks
    def get_col(candidates, default=0.0):
        for c in candidates:
            if c in df_history.columns:
                return df_history[c].astype(float)
        return pd.Series(default, index=df_history.index, dtype=float)

    g["d_obs"] = get_col(["d_obs", "disp_mm", "displacement"])
    g["u_obs"] = get_col(["u_obs", "pore_kpa", "pore_pressure"])
    g["tilt"] = get_col(["tilt", "tilt_deg"])
    g["rain_obs"] = get_col(["rain_obs", "rain_mm", "precip_mm", "precip_mm_1h"])
    g["ppv"] = get_col(["ppv", "vibration_g", "ppv_mms"])

    # Forward fill gaps up to 6 hours, smooth displacement with 3-hour median filter
    d = g["d_obs"].ffill(limit=6).bfill().rolling(3, min_periods=1).median()
    u = g["u_obs"].ffill(limit=6).bfill()
    tl = g["tilt"].ffill(limit=6).bfill()
    r = g["rain_obs"].fillna(0.0)
    p = g["ppv"].fillna(0.0)

    # 1. Displacement Kinematics
    # Shift with fallbacks to avoid NaN on short series
    d_s6 = d.shift(6).bfill()
    d_s24 = d.shift(24).bfill()
    d_s72 = d.shift(72).bfill()
    d_s168 = d.shift(168).bfill()
    
    g["v6"] = (d - d_s6) / 0.25                    # mm/day (6h normalized)
    g["v24"] = (d - d_s24)                         # mm/day (24h window)
    g["v72"] = (d - d_s72) / 3.0                   # mm/day (72h window)
    g["v7d"] = (d - d_s168) / 7.0                  # mm/day (7d window)
    
    v24_s24 = g["v24"].shift(24).bfill()
    g["acc24"] = g["v24"] - v24_s24                # mm/day^2
    g["v24_ratio"] = (g["v24"] / (g["v7d"].abs() + 0.01)).clip(-200, 200)

    dd = d.diff().abs().fillna(0.0)
    g["maxjump24"] = dd.rolling(24, min_periods=1).max().fillna(0.0)
    g["drange24"] = (d.rolling(24, min_periods=1).max() - d.rolling(24, min_periods=1).min()).fillna(0.0)

    # 2. Pore Pressure Dynamics
    g["u"] = u
    u_s24 = u.shift(24).bfill()
    u_s72 = u.shift(72).bfill()
    g["du24"] = u - u_s24
    g["du72"] = u - u_s72
    u_baseline = u.rolling(720, min_periods=1).mean().bfill()
    g["u_dev30"] = u - u_baseline

    # 3. Multi-Scale Rainfall Accumulation
    g["r24"] = r.rolling(24, min_periods=1).sum().fillna(0.0)
    g["r72"] = r.rolling(72, min_periods=1).sum().fillna(0.0)
    g["r7d"] = r.rolling(168, min_periods=1).sum().fillna(0.0)
    g["r30d"] = r.rolling(720, min_periods=1).sum().fillna(0.0)

    # 4. Vibration & Seismic Dynamics
    g["ppv24"] = p.rolling(24, min_periods=1).max().fillna(0.0)
    g["ppv7d"] = p.rolling(168, min_periods=1).max().fillna(0.0)
    g["blast24"] = (p > 1.0).astype(int).rolling(24, min_periods=1).sum().fillna(0.0)

    # 5. Geotechnical Tilt Deviation
    tl_s24 = tl.shift(24).bfill()
    g["tilt24"] = tl - tl_s24

    # 6. DEM Static Topography
    g["slope_deg"] = float(slope_metadata.get("slope_deg", 35.0))
    g["curvature"] = float(slope_metadata.get("curvature", 0.02))
    g["roughness"] = float(slope_metadata.get("roughness", 1.15))

    # Return exactly the 23 ordered features
    result = g[FEATURES].fillna(0.0)
    return result
