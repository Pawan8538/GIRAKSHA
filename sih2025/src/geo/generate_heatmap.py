#!/usr/bin/env python3
# src/geo/generate_heatmap.py
import pandas as pd
import numpy as np
import xgboost as xgb
import json
import os
import math
from shapely.geometry import Point, mapping, box
from shapely.ops import transform
import geopandas as gpd
from pyproj import Transformer

# parameters: adjust cell polygon size in meters (estimate)
CELL_SIZE_M = 10  # approximate pixel resolution you used for DEM

def load_model(path="models/xgb_baseline.json"):
    model = xgb.Booster()
    model.load_model(path)
    return model

def prepare_latest_features(cells_csv="data/train/siteA_dem_cells.csv",
                            sensor_agg_parquet="data/train/agg_sensor_features.parquet",
                            sensor_catalog="data/sensors/siteA_catalog_mapped.csv"):
    # read cells and latest sensor agg per nearest cell
    cells = pd.read_csv(cells_csv)
    
    # load aggregated sensor features and take latest timestamp per sensor -> per cell aggregation
    if os.path.exists(sensor_agg_parquet):
        agg = pd.read_parquet(sensor_agg_parquet)
        agg['ts'] = pd.to_datetime(agg['ts'])
        # For each sensor pick last values by timestamp
        latest = agg.sort_values('ts').groupby('sensor_id').last().reset_index()
        
        # Load sensor locations
        sensors = pd.read_csv(sensor_catalog)
        latest = latest.merge(sensors[['sensor_id', 'lat', 'lon', 'nearest_cell']], on='sensor_id')
        
        # For each cell, interpolate from nearby sensors using inverse distance weighting
        from scipy.spatial import cKDTree
        
        # Build KDTree of sensor locations
        sensor_coords = np.column_stack([latest['lon'].values, latest['lat'].values])
        tree = cKDTree(sensor_coords)
        
        # For each cell, find 3 nearest sensors and interpolate with distance decay
        cell_coords = np.column_stack([cells['lon'].values, cells['lat'].values])
        distances, indices = tree.query(cell_coords, k=min(3, len(sensor_coords)))
        
        # Interpolate sensor readings with distance decay
        sensor_features = ['disp_last', 'disp_1h_mean', 'disp_1h_std', 'pore_kpa', 'vibration_g']
        max_influence_distance = 2000.0  # meters - sensors influence within 2km radius
        
        for feat in sensor_features:
            interpolated = []
            for i in range(len(cells)):
                if len(sensor_coords) == 1:
                    # Only one sensor
                    dist = distances[i]
                    if dist < max_influence_distance:
                        interpolated.append(latest.iloc[indices[i]][feat])
                    else:
                        interpolated.append(0.1)  # baseline safe value
                else:
                    # Inverse distance weighting with cutoff
                    dists = distances[i] if isinstance(distances[i], np.ndarray) else np.array([distances[i]])
                    
                    # Apply distance decay - far cells get baseline values
                    weights = np.zeros_like(dists, dtype=float)
                    mask = dists < max_influence_distance
                    if mask.any():
                        weights[mask] = 1.0 / np.maximum(dists[mask], 1.0)  # IDW for nearby
                        weights = weights / (weights.sum() + 1e-10)
                        values = latest.iloc[indices[i]][feat].values
                        interpolated_val = np.sum(weights * values)
                    else:
                        # Too far from any sensor, use safe baseline
                        interpolated_val = 0.1 if 'disp' in feat else (5.0 if 'pore' in feat else 0.001)
                    
                    interpolated.append(interpolated_val)
            cells[feat] = interpolated
        
        merged = cells
    else:
        # fallback: zeroed sensor features
        sensor_features = ['disp_last', 'disp_1h_mean', 'disp_1h_std', 'pore_kpa', 'vibration_g']
        for feat in sensor_features:
            cells[feat] = 0.0
        merged = cells
    
    return merged

def compute_risk_and_geojson(model, merged_df, out_geojson="data/map/siteA_heatmap.geojson"):
    # features used by model — keep consistent with training
    feature_cols = ["disp_last","disp_1h_mean","disp_1h_std","pore_kpa","vibration_g",
                    "slope_deg","aspect_deg","curvature","roughness","precip_mm_1h","temp_c"]
    # ensure weather columns present - use realistic storm values for demo
    if 'precip_mm_1h' not in merged_df.columns:
        merged_df['precip_mm_1h'] = 15.0  # Heavy rainfall scenario
    if 'temp_c' not in merged_df.columns:
        merged_df['temp_c'] = 25.0

    X = merged_df[feature_cols].fillna(0.0)
    dmat = xgb.DMatrix(X)
    preds = model.predict(dmat)
    merged_df['risk_score'] = preds
    merged_df['risk_class'] = merged_df['risk_score'].apply(lambda s: 'imminent' if s>0.75 else ('high' if s>0.6 else ('medium' if s>0.35 else 'low')))

    # Create transformer from UTM 43N (EPSG:32643) to WGS84 (EPSG:4326)
    transformer = Transformer.from_crs("EPSG:32643", "EPSG:4326", always_xy=True)
    
    # Build GeoDataFrame with square polygons in UTM, then convert to lat/lon
    features = []
    for _, r in merged_df.iterrows():
        # Coordinates are in UTM meters
        x_utm = float(r['lon'])  # easting in meters
        y_utm = float(r['lat'])  # northing in meters
        
        # Create square polygon in UTM (meters)
        half_size = CELL_SIZE_M / 2.0
        minx_utm = x_utm - half_size
        maxx_utm = x_utm + half_size
        miny_utm = y_utm - half_size
        maxy_utm = y_utm + half_size
        
        # Convert corners to lat/lon
        corners_utm = [
            (minx_utm, miny_utm),
            (minx_utm, maxy_utm),
            (maxx_utm, maxy_utm),
            (maxx_utm, miny_utm),
            (minx_utm, miny_utm)
        ]
        
        corners_latlon = [transformer.transform(x, y) for x, y in corners_utm]
        
        # GeoJSON polygon (note: GeoJSON uses [lon, lat] order)
        polygon = {
            "type": "Polygon",
            "coordinates": [corners_latlon]
        }
        
        props = {
            "cell_id": r['cell_id'],
            "slope_deg": float(r.get('slope_deg', 0.0)),
            "risk_score": float(r['risk_score']),
            "risk_class": r['risk_class']
        }
        
        feat = {
            "type": "Feature",
            "geometry": polygon,
            "properties": props
        }
        features.append(feat)

    fc = {"type": "FeatureCollection", "features": features}
    os.makedirs(os.path.dirname(out_geojson), exist_ok=True)
    with open(out_geojson, "w") as f:
        json.dump(fc, f)
    print("Wrote heatmap GeoJSON to:", out_geojson)
    return out_geojson
    return out_geojson

if __name__ == "__main__":
    model = load_model("models/xgb_baseline.json")
    merged = prepare_latest_features()
    compute_risk_and_geojson(model, merged)