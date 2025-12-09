# src/api/main.py

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import shutil
import os
import uuid

# Import Fusion Engine
from src.backend.fusion_engine import FusionEngine

app = FastAPI(
    title="GeoGuard AI Backend",
    description="Real-time Rockfall Prediction & Mine Safety System",
    version="2.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Fusion Engine Instance
# In a real app, this might be a singleton dependency
fusion_engine = FusionEngine()

# Ensure temp directory for uploads
UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
async def root():
    return {"status": "online", "system": "GeoGuard AI", "version": "2.0.0"}

@app.get("/stream/sensors")
async def get_sensor_stream():
    """Get real-time readings from all sensors"""
    try:
        readings = fusion_engine.sensors.get_latest_readings()
        return JSONResponse(content={"count": len(readings), "sensors": readings})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/image")
async def analyze_image(file: UploadFile = File(...)):
    """Upload an image for crack detection and risk update"""
    try:
        # Save uploaded file temporarily
        file_ext = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Run analysis via Fusion Engine
        risk_score = fusion_engine.update_visual_risk(file_path)
        
        # Cleanup
        if os.path.exists(file_path):
            os.remove(file_path)
            
        return {
            "filename": file.filename,
            "crack_probability": risk_score,
            "status": "processed"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")

@app.get("/risk/current")
async def get_current_risk():
    """Get the comprehensive fused risk assessment"""
    try:
        assessment = await fusion_engine.get_current_risk_assessment()
        return JSONResponse(content=assessment)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/map/grid")
async def get_risk_map_grid():
    """Get the consistent, high-res risk grid for the heatmap"""
    try:
        grid = await fusion_engine.get_risk_grid()
        return JSONResponse(content={"grid": grid})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sim/event/{event_type}")
async def trigger_simulation_event(event_type: str, intensity: float = 1.0):
    """Trigger a simulation event (rain/tremor) for testing"""
    try:
        if event_type == "rain":
            fusion_engine.sensors.trigger_rain(intensity)
            return {"message": f"Rain event started with intensity {intensity}"}
        elif event_type == "tremor":
            fusion_engine.sensors.trigger_tremor(intensity)
            return {"message": f"Tremor event triggered with magnitude {intensity}"}
        else:
            raise HTTPException(status_code=400, detail="Unknown event type. Use 'rain' or 'tremor'")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting GeoGuard API Server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
