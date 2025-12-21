#!/usr/bin/env python3
import rasterio
import numpy as np
import pandas as pd
from scipy.ndimage import generic_filter
import os

def compute_dem_features(dem_path="data/dem/siteA_dem.tif", out_csv="data/train/siteA_dem_cells.csv"):
    os.makedirs(os.path.dirname(out_csv), exist_ok=True)

    with rasterio.open(dem_path) as src:
        dem = src.read(1).astype(float)
        transform = src.transform
        res_x, res_y = src.res

        # gradients
        dz_dy, dz_dx = np.gradient(dem, res_y, res_x)
        slope = np.degrees(np.arctan(np.sqrt(dz_dx**2 + dz_dy**2)))

        # aspect
        aspect = np.degrees(np.arctan2(dz_dy, -dz_dx))
        aspect = np.where(aspect < 0, aspect + 360, aspect)

        # curvature
        d2x = np.gradient(dz_dx, res_x, axis=1)
        d2y = np.gradient(dz_dy, res_y, axis=0)
        curvature = d2x + d2y

        # roughness
        roughness = generic_filter(dem, np.std, size=3)

        rows = []
        h, w = dem.shape

        for i in range(h):
            for j in range(w):
                lon, lat = src.transform * (j, i)
                rows.append({
                    "cell_id": f"cell_{i}_{j}",
                    "row": i, "col": j,
                    "lat": lat, "lon": lon,
                    "elevation": float(dem[i,j]),
                    "slope_deg": float(slope[i,j]),
                    "aspect_deg": float(aspect[i,j]),
                    "curvature": float(curvature[i,j]),
                    "roughness": float(roughness[i,j])
                })

    df = pd.DataFrame(rows)
    df.to_csv(out_csv, index=False)
    print("DEM features saved to:", out_csv)
    return out_csv

if __name__ == "__main__":
    compute_dem_features()