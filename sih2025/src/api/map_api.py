#!/usr/bin/env python3
# src/api/map_api.py
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import xgboost as xgb
import pandas as pd
import os
import uvicorn
import json
from typing import Dict

app = FastAPI()

# Enable CORS for browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_model = None

@app.on_event("startup")
def load_model_and_cache():
    global _model
    try:
        _model = xgb.Booster()
        _model.load_model("models/xgb_baseline.json")
        print("Loaded XGBoost model.")
    except Exception as e:
        print("Warning: model not loaded.", e)
        _model = None

@app.get("/map/heatmap")
def get_heatmap(site_id: str = "siteA", sample_rate: int = 100, limit: int = 1000):
    """
    Get risk heatmap as GeoJSON. 
    sample_rate: Return every Nth cell spatially (default 100 for Swagger UI). Use 1 for full data.
    limit: Maximum number of features to return (default 1000 for Swagger UI).
    """
    path = f"data/map/{site_id}_heatmap.geojson"
    
    # Generate if doesn't exist
    if not os.path.exists(path):
        try:
            from src.geo.generate_heatmap import load_model, prepare_latest_features, compute_risk_and_geojson
            model = load_model("models/xgb_baseline.json")
            merged = prepare_latest_features()
            compute_risk_and_geojson(model, merged, out_geojson=path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate heatmap: {str(e)}")
    
    # Read and sample the data
    try:
        with open(path, 'r') as f:
            geojson_data = json.load(f)
        
        original_count = len(geojson_data['features'])
        
        # Spatial sampling: create a grid pattern instead of sequential
        import numpy as np
        features_array = np.array(geojson_data['features'])
        
        # Calculate grid dimensions (approximate square root for rows/cols)
        total_features = len(features_array)
        grid_size = int(np.sqrt(total_features))
        
        # Sample in a grid pattern to maintain spatial distribution
        sample_indices = []
        step = max(1, int(np.sqrt(sample_rate)))  # grid step size
        for i in range(0, grid_size, step):
            for j in range(0, grid_size, step):
                idx = i * grid_size + j
                if idx < total_features:
                    sample_indices.append(idx)
        
        sampled_features = [features_array[i] for i in sample_indices[:limit]]
        
        geojson_data['features'] = sampled_features
        sampled_count = len(geojson_data['features'])
        
        # Add metadata about sampling
        geojson_data['metadata'] = {
            "total_features": original_count,
            "returned_features": sampled_count,
            "sample_rate": sample_rate,
            "note": "Spatially sampled in grid pattern. For full data, use sample_rate=1 and limit=0."
        }
        
        print(f"Returning {sampled_count}/{original_count} features (sample_rate={sample_rate}, limit={limit})")
        
        return JSONResponse(content=geojson_data, media_type="application/geo+json")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read heatmap: {str(e)}")

@app.get("/map/summary")
def get_heatmap_summary(site_id: str = "siteA"):
    """Get summary statistics of the risk heatmap without returning all features"""
    path = f"data/map/{site_id}_heatmap.geojson"
    
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Heatmap not found. Call /map/heatmap first to generate.")
    
    try:
        with open(path, 'r') as f:
            geojson_data = json.load(f)
        
        features = geojson_data['features']
        risk_scores = [f['properties']['risk_score'] for f in features]
        risk_classes = [f['properties']['risk_class'] for f in features]
        
        from collections import Counter
        class_counts = Counter(risk_classes)
        
        return {
            "total_cells": len(features),
            "risk_stats": {
                "min": min(risk_scores),
                "max": max(risk_scores),
                "mean": sum(risk_scores) / len(risk_scores)
            },
            "risk_class_distribution": dict(class_counts),
            "sample_features": features[:5]  # First 5 as examples
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read heatmap: {str(e)}")

@app.post("/predict")
def predict(payload: Dict):
    # payload should be the fused features for one sample
    # IMPORTANT: feature order must match training order
    features = ["disp_last","disp_1h_mean","disp_1h_std","pore_kpa","vibration_g",
                "slope_deg","aspect_deg","curvature","roughness","precip_mm_1h","temp_c"]
    row = {k: float(payload.get(k, 0.0)) for k in features}
    df = pd.DataFrame([row])[features]  # ensure column order
    if _model is None:
        return {"risk_score": 0.0, "risk_class": "low", "note":"model not loaded"}
    dmat = xgb.DMatrix(df)
    score = float(_model.predict(dmat)[0])
    risk_class = "imminent" if score>0.75 else ("high" if score>0.6 else ("medium" if score>0.35 else "low"))
    return {"risk_score": score, "risk_class": risk_class}

if __name__ == "__main__":
    uvicorn.run("src.api.map_api:app", host="0.0.0.0", port=8001, reload=True)