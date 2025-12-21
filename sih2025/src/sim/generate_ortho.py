#!/usr/bin/env python3
# src/sim/generate_ortho.py
import rasterio
import numpy as np
from matplotlib import cm
from PIL import Image
import os

def dem_to_rgb(dem_path="data/dem/siteA_dem.tif", out_path="data/images/siteA_ortho.png"):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with rasterio.open(dem_path) as src:
        dem = src.read(1)
        # Normalize elevation to 0..1
        m, M = np.nanmin(dem), np.nanmax(dem)
        norm = (dem - m) / (M - m + 1e-9)
        cmap = cm.get_cmap('terrain')
        rgba = cmap(norm)
        rgb = (rgba[:, :, :3] * 255).astype('uint8')
        img = Image.fromarray(rgb)
        img.save(out_path)
    print("Saved orthophoto-like PNG to:", out_path)
    return out_path

if __name__ == "__main__":
    dem_to_rgb()