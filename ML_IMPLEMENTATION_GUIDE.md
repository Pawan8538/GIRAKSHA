# GIRAKSHA: Machine Learning Engineer Guide & Integration Handshake
**Author:** ML Core Specialist (You)  
**Collaborators:** Friend 1 (Backend Engineer), Friend 2 (Frontend Engineer)  
**Status:** ✅ Fully Implemented, Models Extracted, and Verified  
**Local ML Service Directory:** `backend/ml-service/`  
**Execution Command:** `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`

---

## 1. What Has Been Completed & Verified in Your ML Microservice

All files have been generated, tested, and validated in [backend/ml-service](file:///D:/GirRakshak/GIRAKSHA/backend/ml-service):

1. **Extracted Validated Models from `giraksha_results_bundle.zip` into `backend/ml-service/models/`**:
   * `model_xgboost.joblib` (Calibrated XGBoost classifier trained on 23 causal features, Brier Score 0.0044)
   * `model_lightgbm.joblib` (Benchmark LightGBM classifier)
   * `model_random_forest.joblib` & `model_logistic_regression.joblib` (Baseline models)
   * `model_isolation_forest.joblib` (Unsupervised anomaly detection)
   * `fit_info.json` & `arima_orders_selected_by_AIC_on_train.json` (Calibration & ARIMA parameters)

2. **Implemented 23 Causal Feature Extractor (`feature_extractor.py`)**:
   * Matches the published research paper specification and `giraksha_sim.py:make_features()`.
   * Calculates kinematic velocities (`v6, v24, v72, v7d`), acceleration (`acc24`), velocity ratios (`v24_ratio`), pore pressure dynamics (`u, du24, du72, u_dev30`), multi-scale rainfall sums (`r24, r72, r7d, r30d`), seismic vibration (`ppv24, ppv7d, blast24`), geotechnical tilt (`tilt24`), and DEM terrain features (`slope_deg, curvature, roughness`).

3. **Implemented Dynamic A\* Evacuation Router (`astar_router.py`)**:
   * Generates step-by-step turn waypoints and compass headings (N, NE, E, SE, S, SW, W, NW).
   * **Strictly enforces impassable barriers:** Any cell where rockfall risk $\ge 0.60$ (High/Imminent) is treated as an impassable wall.
   * Tested latency: **~2.5 ms** (well within the Paper Table 6 TC08 target of $< 800$ ms).

4. **Implemented 20×20 Continuous Spatial Risk Mesh (`spatial_grid.py`)**:
   * Inverse Distance Weighting (IDW) interpolation mapping geotechnical sensors over Tamil Nadu Limestone Mine coordinates (`11.1053°N, 79.1506°E`).
   * Produces a 400-cell grid with exact 4-tier risk classification (Low: <0.35, Medium: 0.35–0.60, High: 0.60–0.75, Imminent: $\ge 0.75$).

5. **Implemented Multi-Technique Anomaly Detector (`anomaly_detector.py`)**:
   * Robust Z-Score ($|z| > 3.5$ via Median Absolute Deviation).
   * Two-sided CUSUM ($k=0.5, h=5.0$) for abrupt sensor drift.
   * Isolation Forest outlier scoring.

6. **Implemented Statistical Forecaster (`forecaster.py`)**:
   * Replaced fake trigonometric sine waves with real Exponential Smoothing (ETS) and ARIMA 72-hour forecasting with 95% confidence intervals.

7. **Production FastAPI Service (`main.py`) & Tests**:
   * Both `test_ml_service.py` and `test_api_endpoints.py` pass 100%.

---

## 2. API Contract Handshake: What to Give to Friend 1 (Backend)

Friend 1's Express backend (`backend/src/services/ml.service.js`) interacts with your service via HTTP on `http://localhost:8000`.

### Contract 1: Rockfall Risk Prediction (`POST /predict`)
* **Request Payload (Friend 1 sends):**
```json
{
  "slopeId": "SLOPE_BENCH_04",
  "slope_deg": 35.0,
  "curvature": 0.02,
  "roughness": 1.15,
  "history": [
    {
      "disp_mm": 1.45,
      "pore_kpa": 32.1,
      "tilt_deg": 0.015,
      "rain_mm": 12.0,
      "ppv": 0.25
    }
  ]
}
```
*(Also supports legacy `{ "slopeId": "...", "sensorData": { "disp_last": 1.45, "pore_kpa": 32.1, ... } }` without crashing).*

* **Response Payload (You return):**
```json
{
  "ok": true,
  "data": {
    "slopeId": "SLOPE_BENCH_04",
    "risk_score": 0.6842,
    "risk_level": "high",
    "calibrated": true,
    "threshold_alert": true,
    "explainability": {
      "top_drivers": [
        {"feature": "v24_ratio", "shap_value": 0.2812, "impact": "high", "raw_value": 3.82},
        {"feature": "r24", "shap_value": 0.1945, "impact": "high", "raw_value": 18.5},
        {"feature": "u_dev30", "shap_value": 0.1205, "impact": "medium", "raw_value": 4.2}
      ]
    }
  }
}
```
*Note for Friend 1:* If `threshold_alert == true` (risk $\ge 0.60$), Friend 1 triggers the **15-second ACK countdown** on the worker's smart band.

---

### Contract 2: 20×20 IDW Spatial Risk Heatmap (`GET /risk/grid`)
* **Request:** `GET http://localhost:8000/risk/grid?rain_factor=1.0`
* **Response Payload (You return):**
```json
{
  "ok": true,
  "dimensions": {"rows": 20, "cols": 20},
  "bounds": {
    "center_lat": 11.1053,
    "center_lon": 79.1506,
    "lat_min": 11.1010,
    "lat_max": 11.1096,
    "lon_min": 79.1460,
    "lon_max": 79.1552
  },
  "grid": [
    {
      "row": 0,
      "col": 0,
      "lat": 11.101,
      "lon": 79.146,
      "risk_score": 0.18,
      "risk_level": "low",
      "impassable": false
    },
    {
      "row": 12,
      "col": 8,
      "lat": 11.1055,
      "lon": 79.1502,
      "risk_score": 0.782,
      "risk_level": "imminent",
      "impassable": true
    }
  ]
}
```
*Note for Friend 2 (Frontend):* Friend 2 renders these 400 polygons in Leaflet with the colors:
- Green: `low` (<0.35)
- Yellow: `medium` (0.35–0.60)
- Orange: `high` (0.60–0.75)
- Red: `imminent` ($\ge 0.75$)

---

### Contract 3: Dynamic A\* Evacuation Route (`POST /evacuation/route`)
* **Request Payload (Friend 1 sends):**
```json
{
  "workerId": "WORKER_102",
  "startCell": [12, 7],
  "exits": [[0, 19], [19, 0]]
}
```
* **Response Payload (You return):**
```json
{
  "ok": true,
  "workerId": "WORKER_102",
  "data": {
    "route_found": true,
    "target_exit": [0, 19],
    "total_distance_meters": 343.6,
    "estimated_time_seconds": 264,
    "path_coordinates": [[12, 7], [11, 8], [10, 9], [0, 19]],
    "waypoints": [
      {
        "step": 1,
        "instruction": "Head NE to cell (11, 8)",
        "heading": "NE",
        "from_cell": [12, 7],
        "to_cell": [11, 8],
        "distance_meters": 35.4
      }
    ]
  }
}
```
*Note for Friend 2 (Frontend) & Smart Band App:* Friend 2 renders the green polyline along `path_coordinates` on the map and displays the turn-by-turn cards.

---

### Contract 4: Time-Series 72-Hour Forecasting (`POST /forecast`)
* **Request Payload:**
```json
{
  "sensorId": "1750L-54XC",
  "displacement_history": [1.2, 1.25, 1.30, 1.38, 1.45, 1.52],
  "horizon_hours": 72
}
```
* **Response Payload:**
```json
{
  "ok": true,
  "sensorId": "1750L-54XC",
  "data": {
    "timestamps": ["+1h", "+2h", "+3h", "...", "+72h"],
    "base_risk": [1.58, 1.64, 1.71, "..."],
    "lower_ci": [1.38, 1.41, "..."],
    "upper_ci": [1.78, 1.87, "..."],
    "method": "Holt_ETS_Linear"
  }
}
```

---

## 3. How to Run and Verify Locally

Whenever you or your friends need to run the ML service:
```powershell
# Open terminal in ML directory
cd D:\GirRakshak\GIRAKSHA\backend\ml-service

# Start the FastAPI server on port 8000
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
You can view the interactive Swagger UI documentation at:
**[http://localhost:8000/docs](http://localhost:8000/docs)**
