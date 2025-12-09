#!/usr/bin/env python3
import pandas as pd
import numpy as np
import os
from sklearn.neighbors import KDTree
from datetime import datetime

def map_sensors_to_cells(catalog_csv, cells_csv):
    sensors = pd.read_csv(catalog_csv)
    cells = pd.read_csv(cells_csv)

    cell_coords = np.vstack([cells.lat.values, cells.lon.values]).T
    tree = KDTree(cell_coords)
    sensor_coords = np.vstack([sensors.lat.values, sensors.lon.values]).T
    
    _, idx = tree.query(sensor_coords, k=1)
    sensors["nearest_cell"] = cells.iloc[idx.flatten()]["cell_id"].values

    mapped_path = catalog_csv.replace(".csv", "_mapped.csv")
    sensors.to_csv(mapped_path, index=False)
    print("Sensor mapped saved to:", mapped_path)

    return mapped_path

def aggregate_sensor_features(ts_parquet, mapped_catalog_csv):
    ts = pd.read_parquet(ts_parquet)
    sensors = pd.read_csv(mapped_catalog_csv)

    ts = ts.merge(sensors[["sensor_id", "nearest_cell"]], on="sensor_id", how="left")
    ts["ts"] = pd.to_datetime(ts.ts_iso)
    ts = ts.sort_values("ts")

    agg_rows = []

    for sid in ts.sensor_id.unique():
        sdf = ts[ts.sensor_id == sid].copy()
        # Select only numeric columns for resampling
        numeric_cols = ["disp_mm", "pore_kpa", "vibration_g"]
        sdf_resampled = sdf.set_index("ts")[numeric_cols].resample("1Min").mean().ffill().reset_index()
        
        sdf_resampled["disp_1h_mean"] = sdf_resampled["disp_mm"].rolling(60).mean()
        sdf_resampled["disp_1h_std"] = sdf_resampled["disp_mm"].rolling(60).std()
        sdf_resampled["disp_last"] = sdf_resampled["disp_mm"]
        sdf_resampled["sensor_id"] = sid
        sdf_resampled["nearest_cell"] = sdf["nearest_cell"].iloc[0]
        agg_rows.append(sdf_resampled)

    agg = pd.concat(agg_rows)
    out = "data/train/agg_sensor_features.parquet"
    agg.to_parquet(out, index=False)
    print("Aggregated sensor features saved to:", out)

    return out

def create_training_dataset(cells_csv, sensor_agg_parquet, weather_parquet, out_parquet):
    cells = pd.read_csv(cells_csv)
    agg = pd.read_parquet(sensor_agg_parquet)
    weather = pd.read_parquet(weather_parquet)
    weather["ts"] = pd.to_datetime(weather.ts_iso)

    # Join DEM features
    merged = agg.merge(cells, left_on="nearest_cell", right_on="cell_id", how="left")

    # Join weather by nearest timestamp
    weather = weather.set_index("ts")

    precip_list = []
    temp_list = []

    for ts in merged["ts"]:
        idx = weather.index.get_indexer([ts], method='nearest')[0]
        precip_list.append(weather.iloc[idx]["precip_mm_1h"])
        temp_list.append(weather.iloc[idx]["temp_c"])

    merged["precip_mm_1h"] = precip_list
    merged["temp_c"] = temp_list

    # Simple label: displacement > X or rapid trend
    merged["label"] = ((merged["disp_last"] > 1.0) | (merged["disp_1h_mean"] > 0.5)).astype(int)

    merged.to_parquet(out_parquet, index=False)
    print("Training dataset saved to:", out_parquet)
    return out_parquet

if __name__ == "__main__":
    catalog = "data/sensors/siteA_catalog.csv"
    ts_parquet = "data/sensors/siteA_timeseries.parquet"
    cells = "data/train/siteA_dem_cells.csv"
    weather = "data/weather/siteA_weather.parquet"
    out = "data/train/train_dataset.parquet"

    mapped_catalog = map_sensors_to_cells(catalog, cells)
    agg = aggregate_sensor_features(ts_parquet, mapped_catalog)
    create_training_dataset(cells, agg, weather, out)