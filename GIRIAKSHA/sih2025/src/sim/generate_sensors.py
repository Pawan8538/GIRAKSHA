#!/usr/bin/env python3
# src/sim/generate_sensors.py
import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import rasterio

def create_sensor_timeseries(site_id="siteA", dem_path="data/dem/siteA_dem.tif",
                             out_dir="data/sensors", n_sensors=10, hours=72, freq_seconds=60):
    os.makedirs(out_dir, exist_ok=True)

    # Use DEM transform to place sensors near bench region
    with rasterio.open(dem_path) as src:
        h, w = src.height, src.width
        sensors = []
        for i in range(n_sensors):
            # distribute sensors along a vertical strip on right side
            row = int(h * (0.12 + 0.76 * (i / max(1, n_sensors-1))))
            col = int(w * (0.72 + 0.20 * ((i % 3)/3)))
            lon, lat = src.transform * (col, row)
            sensors.append({
                "sensor_id": f"S{i+1:02d}",
                "lat": float(lat),
                "lon": float(lon),
                "type": random.choice(["displacement","piezometer","vibration"]),
                "installation_m": round(random.uniform(0.5,2.5), 2)
            })

    catalog_df = pd.DataFrame(sensors)
    catalog_path = os.path.join(out_dir, f"{site_id}_catalog.csv")
    catalog_df.to_csv(catalog_path, index=False)
    print("Saved sensor catalog to:", catalog_path)

    # Create timestamp series
    start = datetime.utcnow() - timedelta(hours=hours)
    times = [start + timedelta(seconds=freq_seconds*i) for i in range(int(hours*3600/freq_seconds)+1)]

    records = []
    # pick multiple sensors to simulate failures in a danger zone
    num_danger_sensors = max(3, n_sensors // 3)  # 1/3 of sensors in danger zone
    danger_sensors = random.sample(catalog_df.sensor_id.tolist(), num_danger_sensors)
    ramp_start = int(len(times) * 0.55)

    for t_idx, ts in enumerate(times):
        ts_iso = ts.strftime("%Y-%m-%dT%H:%M:%SZ")
        for s in sensors:
            sid = s["sensor_id"]
            # baseline values with small noise
            base_disp = 0.05 + random.random()*0.3
            base_pore = 5 + random.random()*10
            base_vib = random.random()*0.01
            disp = base_disp + np.random.normal(0, 0.001)
            pore = base_pore + np.random.normal(0, 0.03)
            vib = abs(base_vib + np.random.normal(0, 0.0008))
            
            # if danger zone sensor and after ramp_start add significant ramp
            if sid in danger_sensors and t_idx >= ramp_start:
                k = t_idx - ramp_start
                # More dramatic increases for dangerous area
                disp += min(15.0, 0.05 * k)  # up to 15mm displacement
                pore += min(500.0, 2.0 * k)  # high pore pressure
                vib += min(2.0, 0.05 * k)    # significant vibration
                
            records.append({
                "ts_iso": ts_iso,
                "sensor_id": sid,
                "site_id": site_id,
                "lat": s["lat"],
                "lon": s["lon"],
                "disp_mm": round(float(disp), 6),
                "pore_kpa": round(float(pore), 3),
                "vibration_g": round(float(vib), 5)
            })

    ts_df = pd.DataFrame(records)
    ts_path = os.path.join(out_dir, f"{site_id}_timeseries.parquet")
    ts_df.to_parquet(ts_path, index=False)
    print("Saved sensor timeseries to:", ts_path)
    return catalog_path, ts_path

if __name__ == "__main__":
    create_sensor_timeseries()