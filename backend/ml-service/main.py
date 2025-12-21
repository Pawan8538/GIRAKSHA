#!/usr/bin/env python3
"""
ML Service for GeoGuard
Provides ML model endpoints for risk prediction, crack detection, and forecasting
"""

import os
import sys
import json
import uuid
from pathlib import Path
from typing import Dict, Optional, List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from datetime import datetime # Added for live sensors

# Add parent directory to path to import from sih2025
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'sih2025'))

try:
    from src.ml.vision_model import CrackDetectionModel
    from src.backend.fusion_engine import FusionEngine
    import xgboost as xgb
    import pandas as pd
    import numpy as np
    ML_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Some ML dependencies not available: {e}")
    ML_AVAILABLE = False

app = FastAPI(
    title="GeoGuard ML Service",
    description="ML models for risk prediction, crack detection, and forecasting",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instances
vision_model = None
xgb_model = None
fusion_engine = None

# Model paths
BASE_DIR = Path(__file__).parent.parent.parent
MODEL_DIR = BASE_DIR / 'sih2025' / 'geo_guard' / 'models'
VISION_MODEL_PATH = BASE_DIR / 'sih2025' / 'geo_guard' / 'colab_final_model.h5'
XGB_MODEL_PATH = MODEL_DIR / 'xgb_baseline.json'
UPLOAD_DIR = BASE_DIR / 'backend' / 'uploads'
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@app.on_event("startup")
async def load_models():
    """Load ML models on startup"""
    global vision_model, xgb_model, fusion_engine
    
    print("Loading ML models...")
    
    # Load vision model
    if ML_AVAILABLE and VISION_MODEL_PATH.exists():
        try:
            vision_model = CrackDetectionModel(str(VISION_MODEL_PATH))
            print(f"✅ Vision model loaded from {VISION_MODEL_PATH}")
        except Exception as e:
            print(f"⚠️ Failed to load vision model: {e}")
    else:
        print(f"⚠️ Vision model not found at {VISION_MODEL_PATH}")
    
    # Load XGBoost model
    if ML_AVAILABLE and XGB_MODEL_PATH.exists():
        try:
            xgb_model = xgb.Booster()
            xgb_model.load_model(str(XGB_MODEL_PATH))
            print(f"✅ XGBoost model loaded from {XGB_MODEL_PATH}")
        except Exception as e:
            print(f"⚠️ Failed to load XGBoost model: {e}")
    else:
        print(f"⚠️ XGBoost model not found at {XGB_MODEL_PATH}")
    
    # Initialize fusion engine
    if ML_AVAILABLE:
        try:
            fusion_engine = FusionEngine()
            print("✅ Fusion engine initialized")
        except Exception as e:
            print(f"⚠️ Failed to initialize fusion engine: {e}")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "GeoGuard ML Service",
        "version": "1.0.0",
        "models_loaded": {
            "vision": vision_model is not None,
            "xgb": xgb_model is not None,
            "fusion": fusion_engine is not None
        }
    }


@app.post("/predict")
async def predict(payload: Dict):
    """
    Predict risk score using XGBoost model
    
    Expected payload:
    {
        "slopeId": "slope_1",
        "sensorData": {
            "disp_last": 0.5,
            "disp_1h_mean": 0.4,
            "disp_1h_std": 0.1,
            "pore_kpa": 15.0,
            "vibration_g": 0.01,
            "slope_deg": 25.0,
            "aspect_deg": 180.0,
            "curvature": 0.1,
            "roughness": 0.5,
            "precip_mm_1h": 5.0,
            "temp_c": 28.0
        }
    }
    """
    try:
        if not xgb_model:
            # Mock prediction for testing
            print("⚠️ XGBoost model not loaded, using mock prediction")
            score = 0.65
            risk_level = "high"
            feature_vector = {k: float(payload.get("sensorData", {}).get(k, 0.0)) for k in [
                "disp_last", "disp_1h_mean", "disp_1h_std", "pore_kpa", "vibration_g",
                "slope_deg", "aspect_deg", "curvature", "roughness", "precip_mm_1h", "temp_c"
            ]}
            
            return {
                "ok": True,
                "implemented": True,
                "data": {
                    "slopeId": payload.get("slopeId"),
                    "risk_score": score,
                    "risk_level": risk_level,
                    "confidence": 0.85,  # Add confidence
                    "sources": { # Add sources for frontend compatibility
                        "xgboost": { "risk_score": score, "risk_level": risk_level, "confidence": 0.85 },
                        "vision": { "risk_score": 0.0, "risk_level": "low", "confidence": 0.0 }, # Default vision
                        "sensors": feature_vector # Pass sensors here
                    },
                    "features_used": feature_vector,
                    "explainability": {
                        "top_features": {
                            "pore_kpa": 0.45,
                            "precip_mm_1h": 0.32,
                            "disp_last": 0.15,
                            "vibration_g": 0.08
                        }
                    },
                    "note": "MOCK PREDICTION (Model not found)"
                }
            }
        
        sensor_data = payload.get("sensorData", {})
        
        # Feature order must match training
        features = [
            "disp_last", "disp_1h_mean", "disp_1h_std",
            "pore_kpa", "vibration_g",
            "slope_deg", "aspect_deg", "curvature", "roughness",
            "precip_mm_1h", "temp_c"
        ]
        
        # Create feature vector with defaults
        feature_vector = {k: float(sensor_data.get(k, 0.0)) for k in features}
        df = pd.DataFrame([feature_vector])[features]
        
        # Predict
        dmat = xgb.DMatrix(df)
        score = float(xgb_model.predict(dmat)[0])
        
        # Classify risk level
        if score > 0.75:
            risk_level = "imminent"
        elif score > 0.6:
            risk_level = "high"
        elif score > 0.35:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        return {
            "ok": True,
            "implemented": True,
            "data": {
                "slopeId": payload.get("slopeId"),
                "risk_score": round(score, 4),
                "risk_level": risk_level,
                "features_used": feature_vector,
                "explainability": {
                    "top_features": _get_feature_importance(feature_vector)
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/detect")
async def detect(file: Optional[UploadFile] = File(None), image_url: Optional[str] = None):
    """
    Detect cracks in uploaded image using vision model
    
    Accepts either:
    - file: Uploaded image file
    - image_url: URL to image (not implemented yet)
    """
    try:
        if not vision_model:
            # Mock detection for testing
            print("⚠️ Vision model not loaded, using mock detection")
            return {
                "ok": True,
                "implemented": True,
                "data": {
                    "detected": True,
                    "confidence": 0.88,
                    "crack_probability": 0.88,
                    "source": {
                        "filename": file.filename if file else "image_url",
                        "size": 0
                    },
                    "risk_assessment": _assess_crack_risk(0.88),
                    "note": "MOCK DETECTION (Model not found)"
                }
            }
        
        if not file and not image_url:
            raise HTTPException(status_code=400, detail="Either file or image_url must be provided")
        
        if file:
            # Save uploaded file
            file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
            filename = f"{uuid.uuid4()}.{file_ext}"
            file_path = UPLOAD_DIR / filename
            
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            # Predict
            crack_probability = vision_model.predict_crack(str(file_path))
            
            # Cleanup
            if file_path.exists():
                file_path.unlink()
            
            detected = crack_probability > 0.5
            confidence = crack_probability
            
            return {
                "ok": True,
                "implemented": True,
                "data": {
                    "detected": detected,
                    "confidence": round(confidence, 4),
                    "crack_probability": round(crack_probability, 4),
                    "source": {
                        "filename": file.filename,
                        "size": len(content)
                    },
                    "risk_assessment": _assess_crack_risk(crack_probability)
                }
            }
        else:
            # TODO: Implement image_url fetching
            raise HTTPException(status_code=501, detail="image_url not yet implemented")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")


@app.post("/forecast")
async def forecast(payload: Dict):
    """
    Generate 72-hour risk forecast
    
    Expected payload:
    {
        "slopeId": "slope_1"
    }
    """
    try:
        if not fusion_engine:
            # Mock forecast
            print("⚠️ Fusion engine not loaded, using mock forecast")
            base_risk = 0.5
            timestamps = ["+12h", "+24h", "+36h", "+48h", "+60h", "+72h"]
            forecast_values = [0.5, 0.52, 0.54, 0.56, 0.58, 0.60]
            
            return {
                "ok": True,
                "implemented": True,
                "data": {
                    "slopeId": payload.get("slopeId"),
                    "timestamps": timestamps,
                    "forecast": forecast_values,
                    "base_risk": base_risk,
                    "current_assessment": {"enhanced_risk": base_risk},
                    "note": "MOCK FORECAST (Fusion engine not found)"
                }
            }
        
        # Get current risk assessment
        assessment = await fusion_engine.get_current_risk_assessment()
        base_risk = assessment.get("enhanced_risk", 0.5)
        
        # Generate forecast (simplified - in production, use time series model)
        timestamps = ["+12h", "+24h", "+36h", "+48h", "+60h", "+72h"]
        forecast_values = []
        
        # Simple trend: slight increase over time with some variation
        for i, ts in enumerate(timestamps):
            # Add small random variation and slight upward trend
            trend = base_risk + (i * 0.02) + np.random.normal(0, 0.05)
            forecast_values.append(max(0.0, min(1.0, trend)))
        
        return {
            "ok": True,
            "implemented": True,
            "data": {
                "slopeId": payload.get("slopeId"),
                "timestamps": timestamps,
                "forecast": [round(v, 4) for v in forecast_values],
                "base_risk": round(base_risk, 4),
                "current_assessment": assessment
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast failed: {str(e)}")


@app.get("/explain/{prediction_id}")
async def explain(prediction_id: str, slopeId: Optional[str] = None):
    """
    Explain a prediction using SHAP values (simplified implementation)
    
    For now, returns feature importance based on current sensor data
    """
    try:
        if not fusion_engine:
            return JSONResponse(
                status_code=503,
                content={
                    "ok": False,
                    "error": "Fusion engine not available"
                }
            )
        
        # Get current assessment for feature importance
        assessment = await fusion_engine.get_current_risk_assessment()
        sources = assessment.get("sources", {})
        
        # Calculate feature importance (simplified)
        sensors = sources.get("sensors", {})
        visual = sources.get("visual", {})
        
        shap_values = {
            "displacement": min(sensors.get("max_disp_mm", 0) / 10.0, 1.0),
            "pore_pressure": min(sensors.get("max_pore_kpa", 0) / 50.0, 1.0),
            "vibration": min(sensors.get("max_vib_g", 0) / 0.5, 1.0),
            "visual_crack": visual.get("risk_score", 0.0),
            "weather": assessment.get("weather_impact", 0.0)
        }
        
        feature_importance = {}
        for key, value in shap_values.items():
            if value > 0.7:
                feature_importance[key] = "high"
            elif value > 0.4:
                feature_importance[key] = "medium"
            else:
                feature_importance[key] = "low"
        
        return {
            "ok": True,
            "implemented": True,
            "data": {
                "predictionId": prediction_id,
                "slopeId": slopeId,
                "shap_values": shap_values,
                "feature_importance": feature_importance,
                "explanation": _generate_explanation(shap_values, feature_importance)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation failed: {str(e)}")


@app.get("/risk/current")
async def get_current_risk():
    """Get current comprehensive risk assessment from fusion engine"""
    try:
        if not fusion_engine:
            raise HTTPException(status_code=503, detail="Fusion engine not available")
        
        assessment = await fusion_engine.get_current_risk_assessment()
        return JSONResponse(content=assessment)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/risk/grid")
async def get_risk_grid():
    """Get risk grid for heatmap visualization"""
    try:
        if not fusion_engine:
            raise HTTPException(status_code=503, detail="Fusion engine not available")
        
        grid = await fusion_engine.get_risk_grid()
        return JSONResponse(content={"grid": grid})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sensors/live")
async def get_live_sensors():
    """Get live raw sensor data for dashboard proxy"""
    try:
        if not fusion_engine:
            raise HTTPException(status_code=503, detail="Fusion engine not available")
        
        # Get raw readings directly from the sensor stream
        readings = fusion_engine.sensors.get_latest_readings()
        return {
            "ok": True, 
            "count": len(readings),
            "timestamp": datetime.now().isoformat(),
            "data": readings
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/sensors/control/global")
async def toggle_global_sensors(active: bool):
    try:
        fusion_engine.sensors.set_global_active(active)
        return {"ok": True, "active": active, "message": f"Global sensors {'resumed' if active else 'paused'}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _get_feature_importance(feature_vector: Dict) -> Dict:
    """Calculate simplified feature importance"""
    # Normalize features to 0-1 scale for importance
    importance = {}
    for key, value in feature_vector.items():
        if "disp" in key:
            importance[key] = min(value / 10.0, 1.0)
        elif "pore" in key:
            importance[key] = min(value / 50.0, 1.0)
        elif "vibration" in key:
            importance[key] = min(value / 0.5, 1.0)
        elif "precip" in key:
            importance[key] = min(value / 50.0, 1.0)
        else:
            importance[key] = abs(value) / 100.0 if value != 0 else 0.0
    return dict(sorted(importance.items(), key=lambda x: x[1], reverse=True)[:5])


def _assess_crack_risk(probability: float) -> Dict:
    """Assess risk level based on crack detection probability"""
    if probability > 0.8:
        level = "critical"
        action = "Immediate inspection required"
    elif probability > 0.6:
        level = "high"
        action = "Schedule inspection soon"
    elif probability > 0.4:
        level = "medium"
        action = "Monitor closely"
    else:
        level = "low"
        action = "No immediate action needed"
    
    return {
        "level": level,
        "action": action,
        "probability": round(probability, 4)
    }


def _generate_explanation(shap_values: Dict, feature_importance: Dict) -> str:
    """Generate human-readable explanation"""
    high_impact = [k for k, v in feature_importance.items() if v == "high"]
    
    if not high_impact:
        return "All features are within normal ranges. Risk is low."
    
    explanations = []
    for feature in high_impact:
        value = shap_values.get(feature, 0)
        if feature == "displacement":
            explanations.append(f"High ground displacement detected ({value:.2%} of critical threshold)")
        elif feature == "pore_pressure":
            explanations.append(f"Elevated pore pressure observed ({value:.2%} of critical threshold)")
        elif feature == "vibration":
            explanations.append(f"Significant vibration detected ({value:.2%} of critical threshold)")
        elif feature == "visual_crack":
            explanations.append(f"Visual crack detection indicates structural issues ({value:.2%} confidence)")
        elif feature == "weather":
            explanations.append(f"Weather conditions are exacerbating risk ({value:.2%} impact)")
    
    return ". ".join(explanations) + "."


if __name__ == "__main__":
    port = int(os.getenv("ML_SERVICE_PORT", 8000))
    print(f"Starting GeoGuard ML Service on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)

