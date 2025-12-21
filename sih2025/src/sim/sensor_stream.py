#!/usr/bin/env python3
# src/sim/sensor_stream.py

import time
import random
import math
import numpy as np
from datetime import datetime
import json
import os
from .db_client import DBClient

class SensorStream:
    def __init__(self, n_sensors=10, site_id="siteA"):
        self.n_sensors = n_sensors
        self.site_id = site_id
        self.sensors = self._initialize_sensors()
        self.start_time = time.time()
        self.db = DBClient() # Initialize DB Client
        
        # Physics parameters
        self.drift_factor = 0.5  # High drift for visibility
        self.cycle_amplitude = {
            'temp': 10.0,    # +/- 10 degrees daily cycle
            'pore': 10.0,    # +/- 10 kPa daily cycle
            'disp': 1.0      # +/- 1.0 mm thermal expansion
        }
        
        # Event state
        self.active_events = {
            'rain': {'active': False, 'intensity': 0.0, 'start_time': 0},
            'tremor': {'active': False, 'magnitude': 0.0, 'decay': 0.0}
        }
        self.is_active = True # Global Master Switch

    def set_global_active(self, active: bool):
        """Master override for all sensors"""
        print(f"🔌 SYSTEM: Global Sensors set to {active}")
        self.is_active = active

    def _initialize_sensors(self):
        """Create initial state for all sensors"""
        sensors = []
        for i in range(self.n_sensors):
            s_type = random.choice(["displacement", "piezometer", "vibration", "tilt"])
            sensors.append({
                "id": f"S{i+1:02d}",
                "type": s_type,
                "lat": 11.102222 + random.uniform(-0.001, 0.001),
                "lon": 79.156389 + random.uniform(-0.001, 0.001),
                "state": {
                    "disp_mm": random.uniform(0.0, 0.5),
                    "pore_kpa": random.uniform(5.0, 15.0),
                    "vibration_g": 0.001,
                    "tilt_deg": random.uniform(0.0, 0.1),
                    "temp_c": 25.0
                },
                "baseline": {
                    "disp_mm": random.uniform(0.0, 0.5),
                    "pore_kpa": random.uniform(5.0, 15.0)
                }
            })
        return sensors

    def _apply_daily_cycle(self, timestamp):
        """Calculate daily cycle factor (-1.0 to 1.0) based on hour of day"""
        # Peak at 2 PM (14:00), Trough at 2 AM (02:00)
        hour = datetime.fromtimestamp(timestamp).hour
        minute = datetime.fromtimestamp(timestamp).minute
        day_progress = (hour + minute/60.0) / 24.0
        # Shift sine wave so max is at 14:00 (approx 0.58 of day)
        return math.sin(2 * math.pi * (day_progress - 0.25))

    def _update_physics(self):
        """Update sensor states based on physics and events"""
        now = time.time()
        cycle = self._apply_daily_cycle(now)
        
        for s in self.sensors:
            # 1. Brownian Motion (Random Drift)
            s['state']['disp_mm'] += random.gauss(0, self.drift_factor * 0.1)
            s['state']['pore_kpa'] += random.gauss(0, self.drift_factor * 1.0)
            
            # 2. Daily Cycles (Thermal Expansion / Evaporation)
            # Temp follows cycle directly
            s['state']['temp_c'] = 25.0 + (self.cycle_amplitude['temp'] * cycle)
            
            # Pore pressure drops during day (evaporation) and rises at night
            # We add a small cyclic component to the baseline
            pore_cycle = -1.0 * cycle * self.cycle_amplitude['pore'] * 0.1
            s['state']['pore_kpa'] += pore_cycle * 0.01 # Slow accumulation
            
            # 3. Event Injection: Rain
            if self.active_events['rain']['active']:
                # Rain increases pore pressure significantly
                intensity = self.active_events['rain']['intensity']
                s['state']['pore_kpa'] += intensity * 0.05 * random.random()
                
                # Rain can cause small displacements in unstable sensors
                if s['type'] == 'displacement' and random.random() < 0.3:
                    s['state']['disp_mm'] += intensity * 0.001

            # 4. Event Injection: Tremor
            if self.active_events['tremor']['active']:
                mag = self.active_events['tremor']['magnitude']
                decay = self.active_events['tremor']['decay']
                elapsed = now - self.active_events['tremor']['start_time']
                
                # Vibration spikes and decays
                current_vib = mag * math.exp(-decay * elapsed)
                if current_vib < 0.001:
                    self.active_events['tremor']['active'] = False
                    current_vib = 0.001
                
                s['state']['vibration_g'] = current_vib + random.uniform(0, 0.002)
                
                # Tremors cause permanent displacement shifts
                if current_vib > 0.05:
                    s['state']['disp_mm'] += current_vib * 0.1
                    s['state']['tilt_deg'] += current_vib * 0.05
            else:
                # Background noise
                s['state']['vibration_g'] = random.uniform(0.0005, 0.0015)

            # 5. Physical Constraints (Clamping)
            s['state']['disp_mm'] = max(0.0, s['state']['disp_mm'])
            s['state']['pore_kpa'] = max(0.0, s['state']['pore_kpa'])

    def trigger_rain(self, intensity=1.0, duration_s=60):
        """Inject a rain event"""
        print(f"🌧️ EVENT: Rain started (Intensity: {intensity})")
        self.active_events['rain']['active'] = True
        self.active_events['rain']['intensity'] = intensity
        # In a real system, we'd use a timer to stop it, 
        # for now we'll just let it run or toggle it manually
        
    def stop_rain(self):
        print("☁️ EVENT: Rain stopped")
        self.active_events['rain']['active'] = False

    def trigger_tremor(self, magnitude=0.5):
        """Inject a seismic tremor"""
        print(f"📉 EVENT: Tremor detected (Magnitude: {magnitude}g)")
        self.active_events['tremor']['active'] = True
        self.active_events['tremor']['magnitude'] = magnitude
        self.active_events['tremor']['start_time'] = time.time()
        self.active_events['tremor']['decay'] = 0.5 # Decay factor

    def get_latest_readings(self):
        """Get current snapshot of all sensors (Physics Engine -> DB Sync)"""
        if not self.is_active:
            return []
            
        self._update_physics()
        timestamp = datetime.now().isoformat()
        
        readings = []
        for s in self.sensors:
            # Determin primary value based on type
            primary_val = 0.0
            if s['type'] == 'displacement':
                primary_val = s['state']['disp_mm']
            elif s['type'] == 'pore_pressure' or s['type'] == 'piezometer': # Handle alias
                primary_val = s['state']['pore_kpa']
            elif s['type'] == 'vibration' or s['type'] == 'seismic':
                primary_val = s['state']['vibration_g']
            elif s['type'] == 'tilt':
                primary_val = s['state']['tilt_deg']
            elif s['type'] == 'rain_gauge':
                primary_val = 0.0 # TODO: Rainfall state
                
            # Sync to real DB (Best Effort)
            # We map local sensor types to DB types
            # Using 'piezometer' for pore pressure if needed, or matching strings
            db_type = s['type']
            if s['type'] == 'piezometer': db_type = 'pore_pressure'
            
            # This pushes the simulated physics value to the Live DB
            # self.db.update_sensor_value(db_type, primary_val) # Disabled to prevent DB overload per user Request

            readings.append({
                "sensor_id": s['id'],
                "type": s['type'],
                "timestamp": timestamp,
                "values": {
                    "disp_mm": round(s['state']['disp_mm'], 4),
                    "pore_kpa": round(s['state']['pore_kpa'], 2),
                    "vibration_g": round(s['state']['vibration_g'], 5),
                    "tilt_deg": round(s['state']['tilt_deg'], 4),
                    "temp_c": round(s['state']['temp_c'], 1)
                },
                "location": {
                    "lat": s['lat'],
                    "lon": s['lon']
                }
            })
        return readings

# Example Usage
if __name__ == "__main__":
    stream = SensorStream(n_sensors=5)
    
    print("Starting Sensor Stream (Press Ctrl+C to stop)...")
    try:
        # Simulate normal operation
        for i in range(5):
            data = stream.get_latest_readings()
            print(f"Tick {i}: {data[0]['values']}") # Print first sensor only
            time.sleep(1)
            
        # Simulate an event
        stream.trigger_tremor(magnitude=0.8)
        
        for i in range(5):
            data = stream.get_latest_readings()
            print(f"Tick {i+5} (Tremor): {data[0]['values']['vibration_g']}g")
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("Stream stopped.")
