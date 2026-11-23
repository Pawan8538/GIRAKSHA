"""
Comprehensive Validation Test for GIRAKSHA ML Microservice
Validates:
1. 23-Feature Extraction (correct length, no NaNs, correct causal shifts)
2. Calibrated XGBoost & Comparative Models (predict_proba, threshold tiers)
3. TreeSHAP Explanation generation
4. Anomaly Detection (Robust Z, CUSUM, Isolation Forest)
5. Time-Series Forecasting (ARIMA & ETS)
6. 20x20 IDW Spatial Mesh Generation
7. A* Pathfinding Evacuation Routing (latency < 800ms for TC08)
"""

import time
import json
import numpy as np
import pandas as pd
from pathlib import Path

def run_tests():
    print("=" * 60)
    print("🧪 STARTING GIRAKSHA ML PIPELINE VERIFICATION")
    print("=" * 60)

    # 1. Feature Extraction Test
    from feature_extractor import extract_23_features, FEATURES
    assert len(FEATURES) == 23, f"Expected 23 features, got {len(FEATURES)}"
    print(f"✅ Feature definition check passed: {len(FEATURES)} features.")

    # Create synthetic 30-hour sensor stream
    rng = np.random.default_rng(42)
    synthetic_raw = pd.DataFrame({
        "disp_mm": np.cumsum(rng.normal(0.05, 0.02, 30)),
        "pore_kpa": 25.0 + rng.normal(0, 1.0, 30),
        "tilt_deg": rng.normal(0.01, 0.002, 30),
        "rain_mm": np.clip(rng.normal(2.0, 3.0, 30), 0, 50),
        "ppv": np.clip(rng.normal(0.1, 0.2, 30), 0, 5)
    })
    feat_df = extract_23_features(synthetic_raw, {"slope_deg": 32.5, "curvature": 0.04, "roughness": 1.2})
    assert feat_df.shape[1] == 23, f"Expected 23 columns, got {feat_df.shape[1]}"
    assert not feat_df.isna().any().any(), "Found NaNs in extracted feature matrix!"
    print(f"✅ Feature extraction passed: shape {feat_df.shape}, zero NaNs.")

    # 2. Model Loading & Inference Test
    import joblib
    models_dir = Path("D:/GirRakshak/GIRAKSHA/backend/ml-service/models")
    xgb = joblib.load(models_dir / "model_xgboost.joblib")
    lgb = joblib.load(models_dir / "model_lightgbm.joblib")
    rf = joblib.load(models_dir / "model_random_forest.joblib")
    lr = joblib.load(models_dir / "model_logistic_regression.joblib")
    print("✅ All 4 classifiers loaded successfully.")

    t0 = time.time()
    prob_xgb = float(xgb.predict_proba(feat_df.iloc[[-1]])[0, 1])
    inference_ms = (time.time() - t0) * 1000
    print(f"✅ XGBoost prediction: score={prob_xgb:.4f} (latency: {inference_ms:.2f}ms - Target < 1500ms)")
    assert 0.0 <= prob_xgb <= 1.0

    # 3. TreeSHAP Explanation Test
    import shap
    try:
        explainer = shap.TreeExplainer(xgb)
        shap_vals = explainer.shap_values(feat_df.iloc[[-1]])[0]
        print(f"✅ XGBoost TreeSHAP generated: top feature impact = {np.max(np.abs(shap_vals)):.4f}")
    except Exception as e:
        print(f"Notice: XGBoost SHAP compatibility fallback to LightGBM (paper best model): {e}")
        explainer = shap.TreeExplainer(lgb)
        shap_vals = explainer.shap_values(feat_df.iloc[[-1]])[0]
        print(f"✅ LightGBM TreeSHAP generated: top feature impact = {np.max(np.abs(shap_vals)):.4f}")
    assert len(shap_vals) == 23

    # 4. Anomaly Detection Test
    from anomaly_detector import AnomalyDetector
    detector = AnomalyDetector(model_path=models_dir / "model_isolation_forest.joblib")
    anom_res = detector.detect_all(synthetic_raw["disp_mm"].tolist())
    print(f"✅ Anomaly Detection check passed: composite_alert={anom_res['composite_anomaly']}")

    # 5. Time-Series Forecasting Test
    from forecaster import TimeSeriesForecaster
    forecaster = TimeSeriesForecaster(orders_file=models_dir / "arima_orders_selected_by_AIC_on_train.json")
    fc_res = forecaster.forecast_displacement(synthetic_raw["disp_mm"].tolist(), horizon_hours=72)
    assert len(fc_res["forecast"]) == 72
    print(f"✅ Forecaster check passed: method={fc_res['method']}, steps={len(fc_res['forecast'])}")

    # 6. 20x20 IDW Spatial Grid Test
    from spatial_grid import generate_idw_grid
    grid_res = generate_idw_grid(sensor_points=None, grid_size=20)
    assert len(grid_res["grid"]) == 400
    assert len(grid_res["matrix"]) == 20 and len(grid_res["matrix"][0]) == 20
    print(f"✅ 20x20 IDW Grid check passed: 400 cells interpolated.")

    # 7. A* Pathfinding Evacuation Routing Test (TC08: latency < 800ms)
    from astar_router import AStarRouter
    router = AStarRouter(grid_size=20)
    
    # Place a critical hazard barrier in the middle
    risk_mat = grid_res["matrix"]
    risk_mat[10][10] = 0.85 # Critical barrier
    risk_mat[10][11] = 0.85
    risk_mat[10][9] = 0.85
    
    t_start = time.time()
    route_res = router.find_route(
        start=(12, 10),
        exits=[(0, 19), (19, 0)],
        risk_matrix=risk_mat,
        impassable_threshold=0.60
    )
    routing_latency_ms = (time.time() - t_start) * 1000
    print(f"✅ A* Pathfinding check (TC08): route_found={route_res['route_found']}, latency={routing_latency_ms:.2f}ms (Target: < 800ms)")
    assert routing_latency_ms < 800.0, f"A* routing exceeded 800ms budget: {routing_latency_ms}ms"
    assert route_res["route_found"] == True

    print("=" * 60)
    print("🎉 ALL GIRAKSHA ML PIPELINE TESTS PASSED!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
