#!/usr/bin/env python3
# src/sim/generate_weather.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

def generate_weather(site_id="siteA", hours=72, freq_mins=60, out_path="data/weather/siteA_weather.parquet"):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    start = datetime.utcnow() - timedelta(hours=hours)
    times = [start + timedelta(minutes=freq_mins*i) for i in range(int(hours*60/freq_mins)+1)]

    storm_start = int(len(times)*0.45)
    storm_len = max(3, int(len(times)*0.08))

    rows = []
    for i, t in enumerate(times):
        precip = np.random.exponential(0.05)
        if storm_start <= i < storm_start + storm_len:
            # heavy rainfall in the storm window
            precip += np.random.uniform(5, 20)
        temp = 25 + np.random.normal(0, 2)
        rows.append({
            "ts_iso": t.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "site_id": site_id,
            "precip_mm_1h": round(float(precip), 3),
            "temp_c": round(float(temp), 2)
        })

    df = pd.DataFrame(rows)
    df.to_parquet(out_path, index=False)
    print("Saved weather to:", out_path)
    return out_path

if __name__ == "__main__":
    generate_weather()