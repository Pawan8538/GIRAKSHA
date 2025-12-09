# src/backend/fusion_engine.py

import time
from datetime import datetime
import numpy as np

# Import our modules
from src.sim.sensor_stream import SensorStream
from src.geo.climate_module import ClimateRiskEngine
from src.ml.vision_model import CrackDetectionModel

class FusionEngine:
    def __init__(self):
        print("Initializing GeoGuard Fusion Engine...")
        
        # Initialize Subsystems
        self.sensors = SensorStream(n_sensors=10)
        self.climate = ClimateRiskEngine()
        self.vision = CrackDetectionModel()
        
        # State
        self.latest_visual_risk = 0.0
        self.last_visual_check = None
        
        # Weights for Base Risk Calculation
        self.weights = {
            'sensor_disp': 0.4,
            'sensor_pore': 0.3,
            'sensor_vib': 0.2,
            'visual': 0.1
        }
        
        print("Fusion Engine Ready.")
        print(f"SYSTEM STATUS: All 4 Modules Connected (Sensors, Vision, Climate, Backend)")
        print(f"SITE CONTEXT: {self.sensors.site_id} (Lat: {self.climate.lat}, Lon: {self.climate.lon})")

    def update_visual_risk(self, image_path):
        """Update the visual risk component from a new image"""
        print(f"Analyzing image: {image_path}")
        risk_score = self.vision.predict_crack(image_path)
        self.latest_visual_risk = risk_score
        self.last_visual_check = datetime.now().isoformat()
        return risk_score

    async def get_current_risk_assessment(self):
        """
        Main Loop: Aggregate all data and calculate final risk
        """
        # 1. Get Sensor Data
        sensor_data = self.sensors.get_latest_readings()
        
        # Calculate Sensor Aggregate Risk (0.0 - 1.0)
        # We take the MAX risk from any single sensor to be conservative
        max_disp_risk = 0.0
        max_pore_risk = 0.0
        max_vib_risk = 0.0
        
        for s in sensor_data:
            vals = s['values']
            # Normalize readings to risk scores (approximate thresholds)
            # Displacement: > 10mm is critical
            d_risk = min(vals['disp_mm'] / 10.0, 1.0)
            max_disp_risk = max(max_disp_risk, d_risk)
            
            # Pore Pressure: > 50 kPa is critical
            p_risk = min(vals['pore_kpa'] / 50.0, 1.0)
            max_pore_risk = max(max_pore_risk, p_risk)
            
            # Vibration: > 0.5g is critical
            v_risk = min(vals['vibration_g'] / 0.5, 1.0)
            max_vib_risk = max(max_vib_risk, v_risk)
            
        # 2. Calculate Base Geotechnical Risk
        # Weighted sum of sensor risks + latest visual risk
        base_risk = (
            (max_disp_risk * self.weights['sensor_disp']) +
            (max_pore_risk * self.weights['sensor_pore']) +
            (max_vib_risk * self.weights['sensor_vib']) +
            (self.latest_visual_risk * self.weights['visual'])
        )
        
        # 3. Apply Climate Impact (now async)
        # The climate engine takes the base risk and amplifies it based on weather
        final_assessment = await self.climate.calculate_weather_risk(base_risk)
        
        # 4. Enrich with Source Data
        final_assessment['sources'] = {
            'sensors': {
                'max_disp_mm': max([s['values']['disp_mm'] for s in sensor_data]),
                'max_pore_kpa': max([s['values']['pore_kpa'] for s in sensor_data]),
                'max_vib_g': max([s['values']['vibration_g'] for s in sensor_data]),
                'active_sensors': len(sensor_data)
            },
            'visual': {
                'risk_score': self.latest_visual_risk,
                'last_check': self.last_visual_check
            }
        }
        
        # 5. Add Fusion Alerts
        if self.latest_visual_risk > 0.8:
            final_assessment['alerts'].append("CRITICAL: Major crack detected by vision system")
        
        if max_disp_risk > 0.8:
            final_assessment['alerts'].append("CRITICAL: Significant ground displacement detected")

        return final_assessment

    async def get_risk_grid(self, grid_size=20):
        """
        Generate a consistent spatial grid of risk values.
        Uses Inverse Distance Weighting (IDW) from sensors.
        """
        # Fixed bounds for Site A (approx 500m x 500m)
        base_lat = 11.1053
        base_lon = 79.1506
        cell_size = 0.0004  # Approx 40m

        grid = []
        sensors = self.sensors.get_latest_readings()
        
        # Fetch weather data once for the entire grid (optimization)
        weather_data = await self.climate.get_weather_data()
        
        # Use a fixed seed for geological features so they don't change on reload
        np.random.seed(42) 
        
        for r in range(grid_size):
            for c in range(grid_size):
                # Calculate cell center
                lat = base_lat + (r - grid_size/2) * cell_size
                lon = base_lon + (c - grid_size/2) * cell_size
                
                # 1. Mine Proximity Risk - Higher risk in the center (active mining area)
                dist_from_center = np.sqrt((r - grid_size/2)**2 + (c - grid_size/2)**2)
                max_dist = grid_size / 2 * np.sqrt(2)
                norm_dist = dist_from_center / max_dist
                
                # AGGRESSIVE BOOST: Peak at 85% in center to ensure Imminent risk is possible
                mine_proximity_risk = 0.85 * np.exp(-1.0 * norm_dist)
                
                # 2. Geological Features - Major variation
                geological_risk = 0.0
                
                # Zone 1: Northwest quadrant (unstable rock formation)
                if r < grid_size/2 and c < grid_size/2:
                    geological_risk += 0.35
                
                # Zone 2: Southeast slope (higher water table)
                if r > grid_size/2 and c > grid_size/2:
                    geological_risk += 0.30
                
                # Zone 3: Center strip (active excavation zone)
                if abs(r - grid_size/2) < 4 or abs(c - grid_size/2) < 4:
                    geological_risk += 0.25
                
                # Add noise for natural variation
                geological_risk += np.random.normal(0, 0.05)
                geological_risk = np.clip(geological_risk, 0.0, 0.6)

                # 3. Dynamic Sensor Risk
                dynamic_risk = 0.0
                total_weight = 0.0
                
                for s in sensors:
                    d = np.sqrt((s['location']['lat'] - lat)**2 + (s['location']['lon'] - lon)**2)
                    weight = 1.0 / (d + 0.0001)**3
                    
                    vals = s['values']
                    s_risk = (
                        (vals['disp_mm'] / 10.0) * 0.4 +
                        (vals['pore_kpa'] / 50.0) * 0.35 +
                        (vals['vibration_g'] / 0.5) * 0.25
                    )
                    s_risk = min(s_risk, 0.9)
                    
                    dynamic_risk += s_risk * weight
                    total_weight += weight
                
                if total_weight > 0:
                    dynamic_risk /= total_weight
                
                # 4. Combine with balanced weighting
                # Adjusted to ensure high values propagate
                base_risk = (
                    mine_proximity_risk * 0.45 +      # 45% from mine location (dominant)
                    geological_risk * 0.35 +          # 35% from geology
                    dynamic_risk * 0.20               # 20% from sensors
                )
                
                # 5. Apply Climate Multiplier
                rain_24 = min(weather_data['rainfall_24h'] / 50.0, 1.0)
                rain_72 = min(weather_data['rainfall_72h'] / 100.0, 1.0)
                intensity = min(weather_data['max_rain_intensity'] / 25.0, 1.0)
                cond_map = {'Thunderstorm': 1.0, 'Rain': 0.6, 'Drizzle': 0.3, 'Clouds': 0.1, 'Clear': 0.0}
                cond_score = cond_map.get(weather_data['weather_condition'], 0.0)
                
                weather_impact = (
                    rain_24 * 0.35 +
                    rain_72 * 0.25 +
                    intensity * 0.20 +
                    cond_score * 0.10
                )
                
                # Weather amplifies base risk
                # Ensure we don't just multiply by 1.0 if impact is 0, add a small base multiplier
                final_risk = base_risk * (1.1 + weather_impact * 0.8)
                
                grid.append({
                    "id": f"R{r}-C{c}",
                    "lat": lat,
                    "lon": lon,
                    "risk_score": min(final_risk, 1.0),
                    "mine_proximity": mine_proximity_risk,
                    "sensor_influence": dynamic_risk
                })
                
        return grid

if __name__ == "__main__":
    # Test Run
    engine = FusionEngine()
    
    # Simulate a visual check
    print("\n--- Simulating Visual Check ---")
    # In a real scenario, we'd pass a real image path
    # For now, the mock loader will handle it or we pass a dummy path
    engine.update_visual_risk("dummy_path.jpg") 
    
    # Get Assessment
    print("\n--- Generating Risk Assessment ---")
    assessment = engine.get_current_risk_assessment()
    
    import json
    print(json.dumps(assessment, indent=2))
