"""
Inverse Distance Weighting (IDW) 20x20 Spatial Risk Grid Generator
Maps discrete geotechnical sensors and DEM topography onto a 20x20 risk mesh over the mine.
"""

from typing import List, Dict, Any, Tuple
import numpy as np

# Coordinates for Tamil Nadu Limestone Mine (Reference Location from Research Paper)
DEFAULT_MINE_BOUNDS = {
    "center_lat": 11.1053,
    "center_lon": 79.1506,
    "lat_min": 11.1010,
    "lat_max": 11.1096,
    "lon_min": 79.1460,
    "lon_max": 79.1552
}

def classify_risk_tier(score: float) -> str:
    """
    Standardized 4-tier risk classification from Paper Table 3:
    Low: [0.00, 0.35)
    Medium: [0.35, 0.60)
    High: [0.60, 0.75)
    Imminent: [0.75, 1.00]
    """
    if score < 0.35:
        return "low"
    elif score < 0.60:
        return "medium"
    elif score < 0.75:
        return "high"
    else:
        return "imminent"

def generate_idw_grid(
    sensor_points: List[Dict[str, Any]],
    rain_amplification_factor: float = 1.0,
    grid_size: int = 20,
    power: float = 2.0,
    bounds: Dict[str, float] = None
) -> Dict[str, Any]:
    """
    Interpolates sensor risks onto a grid_size x grid_size continuous risk mesh.
    
    sensor_points: [{"sensor_id": str, "lat": float, "lon": float, "risk_score": float}]
    rain_amplification_factor: scales geotechnical vulnerability based on accumulated rain
    """
    if bounds is None:
        bounds = DEFAULT_MINE_BOUNDS

    lats = np.linspace(bounds["lat_min"], bounds["lat_max"], grid_size)
    lons = np.linspace(bounds["lon_min"], bounds["lon_max"], grid_size)

    # Fallback default sensors if none provided
    if not sensor_points:
        sensor_points = [
            {"sensor_id": "SN_BENCH_1", "lat": 11.1025, "lon": 79.1475, "risk_score": 0.22},
            {"sensor_id": "SN_BENCH_2", "lat": 11.1050, "lon": 79.1500, "risk_score": 0.45},
            {"sensor_id": "SN_HAUL_ROAD", "lat": 11.1075, "lon": 79.1530, "risk_score": 0.18},
            {"sensor_id": "SN_NORTH_WALL", "lat": 11.1085, "lon": 79.1490, "risk_score": 0.78}
        ]

    cells = []
    matrix = [[0.0 for _ in range(grid_size)] for _ in range(grid_size)]

    for r, lat in enumerate(lats):
        for c, lon in enumerate(lons):
            numerator = 0.0
            denominator = 0.0
            exact_hit = False
            base_score = 0.12 # Background residual slope risk

            for s in sensor_points:
                dist = np.hypot(lat - s["lat"], lon - s["lon"])
                if dist < 1e-6:
                    base_score = s["risk_score"]
                    exact_hit = True
                    break
                weight = 1.0 / (dist ** power)
                numerator += weight * s["risk_score"]
                denominator += weight

            if not exact_hit and denominator > 0:
                base_score = numerator / denominator

            # Apply weather amplification
            amplified_score = float(np.clip(base_score * rain_amplification_factor, 0.0, 1.0))
            tier = classify_risk_tier(amplified_score)
            impassable = amplified_score >= 0.60 # High & Imminent cells are impassable

            matrix[r][c] = round(amplified_score, 4)

            cells.append({
                "row": r,
                "col": c,
                "lat": round(float(lat), 6),
                "lon": round(float(lon), 6),
                "risk_score": round(amplified_score, 4),
                "risk_level": tier,
                "impassable": impassable
            })

    return {
        "dimensions": {"rows": grid_size, "cols": grid_size},
        "bounds": bounds,
        "grid": cells,
        "matrix": matrix
    }
