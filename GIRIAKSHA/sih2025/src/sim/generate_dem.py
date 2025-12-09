#!/usr/bin/env python3
# src/sim/generate_dem.py
import numpy as np
import rasterio
from rasterio.transform import from_origin
import os

def make_synthetic_dem(out_path="data/dem/siteA_dem.tif", width=400, height=300, res=10.0, crs='EPSG:32643'):
    """
    Generate synthetic DEM in UTM Zone 43N (EPSG:32643) for proper metric coordinates.
    res: resolution in meters (default 10m per pixel)
    Origin: approximately 77°E, 10.8°N in UTM coordinates
    """
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    # Create a smooth hill + a steep bench (open-pit-like)
    x = np.linspace(-3, 3, width)
    y = np.linspace(-2.5, 2.5, height)
    X, Y = np.meshgrid(x, y)
    base = 200 + 30 * np.exp(-((X/2)**2 + (Y/1.5)**2))

    # Bench: a sharp drop on the right side
    bench = np.zeros_like(base)
    bench_area = (X > 1.0) & (Y > -1.0) & (Y < 1.2)
    bench[bench_area] = -60 * np.exp(-((X[bench_area]-1.5)**2)/0.08)

    # Add natural roughness/noise
    noise = np.random.normal(0, 0.6, base.shape)
    dem = base + bench + noise

    # UTM coordinates for Bellary mining region (Karnataka: ~15.15°N, 76.92°E in UTM 43N)
    # Approximately: Easting ~674000, Northing ~1675000
    utm_origin_x = 674000.0  # meters east
    utm_origin_y = 1675000.0 + (height * res)  # meters north (top-left corner)
    
    transform = from_origin(utm_origin_x, utm_origin_y, res, res)
    with rasterio.open(
        out_path, 'w',
        driver='GTiff',
        height=height, width=width,
        count=1, dtype='float32',
        crs=crs,
        transform=transform,
        nodata=None
    ) as dst:
        dst.write(dem.astype('float32'), 1)
    print("Saved synthetic DEM to:", out_path)
    return out_path

if __name__ == "__main__":
    make_synthetic_dem()