# GeoGuard ML Integration Documentation

This document describes the ML models integrated into the GeoGuard system, their features, API routes, and how to use them.

## ML MODELS OVERVIEW

### 1. XGBoost Risk Prediction Model
- **Purpose**: Predicts landslide/rockfall risk based on sensor data and terrain features
- **Model File**: `sih2025/geo_guard/models/xgb_baseline.json`
- **Input Features**:
  - `disp_last`: Latest displacement reading (mm)
  - `disp_1h_mean`: Mean displacement over 1 hour (mm)
  - `disp_1h_std`: Standard deviation of displacement over 1 hour (mm)
  - `pore_kpa`: Pore pressure (kPa)
  - `vibration_g`: Vibration reading (g)
  - `slope_deg`: Slope angle (degrees)
  - `aspect_deg`: Aspect angle (degrees)
  - `curvature`: Terrain curvature
  - `roughness`: Terrain roughness
  - `precip_mm_1h`: Precipitation in last hour (mm)
  - `temp_c`: Temperature (Celsius)
- **Output**: Risk score (0.0 to 1.0) and risk level (low/medium/high/imminent)

### 2. Vision Model (Crack Detection)
- **Purpose**: Detects cracks in images of slopes and structures
- **Model File**: `sih2025/geo_guard/colab_final_model.h5`
- **Input**: Image file (JPG, PNG, WebP)
- **Output**: Crack probability (0.0 to 1.0), detection status, risk assessment

### 3. Fusion Engine
- **Purpose**: Combines sensor data, climate data, and visual inspections
- **Components**:
  - **Sensor Stream**: Real-time sensor readings (displacement, pore pressure, vibration)
  - **Climate Risk Engine**: Weather data integration (OpenWeatherMap API)
  - **Vision Model**: Crack detection from images
- **Output**: Comprehensive risk assessment with alerts and recommendations

## PYTHON ML SERVICE API

- **Service Location**: `backend/ml-service/main.py`
- **Default Port**: 8000 (configurable via `ML_SERVICE_PORT` env variable)
- **BASE URL**: `http://localhost:8000`

### Endpoints:

#### 1. `GET /`
- Health check endpoint
- Returns: Service status and model loading status

#### 2. `POST /predict`
- Predict risk score using XGBoost model
- Request Body:
  ```json
  {
    "slopeId": "slope_1",
    "sensorData": {
      "disp_last": 0.5,
       ...
    }
  }
  ```
- Response:
  ```json
  {
    "ok": true,
    "data": {
      "risk_score": 0.65,
      "risk_level": "high"
    }
  }
  ```

#### 3. `POST /detect`
- Detect cracks in uploaded image
- Request: `multipart/form-data` with 'file' field

#### 4. `POST /forecast`
- Generate 72-hour risk forecast

#### 5. `GET /explain/{prediction_id}`
- Explain a prediction using SHAP values

## NODE.JS BACKEND API ROUTES

All routes require authentication and appropriate role (SITE_ADMIN or SUPER_ADMIN)
**BASE URL**: `http://localhost:4000/api/ml`

1. `POST /api/ml/predict` - Calls Python ML Service `/predict`
2. `POST /api/ml/detect` - Calls Python ML Service `/detect`
3. `POST /api/ml/forecast` - Calls Python ML Service `/forecast`
4. `GET /api/ml/explain/:predictionId` - Calls Python ML Service `/explain`

## WEB-APP UI PAGES

All pages require SITE_ADMIN or SUPER_ADMIN role

1. `/ml/predictions` - ML Risk Prediction page
2. `/ml/detect` - Crack Detection page
3. `/ml/forecast` - 72-Hour Risk Forecast page
4. `/ml/explain` - ML Model Explainability page

## SETUP & CONFIGURATION

### Python ML Service Setup:
```bash
cd backend/ml-service/
pip install -r requirements.txt
python main.py
```

### Node.js Backend Configuration:
Set in `.env`: `ML_SERVICE_URL=http://localhost:8000`

### Risk Level Classifications
- **0.0 - 0.35**: LOW (No immediate action)
- **0.35 - 0.6**: MEDIUM (Schedule inspection within 48h)
- **0.6 - 0.75**: HIGH (Consider suspending operations)
- **0.75 - 1.0**: IMMINENT (Immediate inspection, evacuate)
