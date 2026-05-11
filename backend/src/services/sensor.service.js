const axios = require('axios');
const { getSensorsBySlope, getAllSensors } = require('../models/queries');
const config = require('../config/env');

// Global cache for sensor data to prevent 429 Errors
const sensorCache = {
  data: null,
  timestamp: 0,
  TTL: 45000 // 45 seconds
};

const getMlServiceUrl = () => {
  return config.mlServiceUrl || 'http://127.0.0.1:8000';
};

/**
 * Get sensors with real-time data from ML service or fallback to DB/Mock
 */
const getSensors = async (slopeId = null) => {
  try {
    const now = Date.now();
    
    // 1. Serve from cache if valid
    if (sensorCache.data && (now - sensorCache.timestamp < sensorCache.TTL)) {
      return sensorCache.data;
    }

    // 2. Try fetching from Python ML Service
    try {
      const mlUrl = getMlServiceUrl();
      const mlResponse = await axios.get(`${mlUrl}/sensors/live`, { timeout: 3000 });
      
      if (mlResponse.data && mlResponse.data.ok && mlResponse.data.data) {
        const proxyRows = mlResponse.data.data.map(s => {
          let val = 0;
          const vals = s.values;
          if (s.type === 'displacement') val = vals.disp_mm;
          else if (s.type === 'pore_pressure' || s.type === 'piezometer') val = vals.pore_kpa;
          else if (s.type === 'vibration' || s.type === 'seismic') val = vals.vibration_g;
          else if (s.type === 'tilt') val = vals.tilt_deg;
          else if (s.type === 'rain_gauge') val = vals.rain_mm || 0;

          return {
            id: s.sensor_id,
            slope_id: 1,
            name: `${s.type.charAt(0).toUpperCase() + s.type.slice(1)} ${s.sensor_id}`,
            sensor_type: s.type,
            current_value: val,
            status: 'active',
            is_active: true,
            lat: s.location.lat,
            lon: s.location.lon,
            updated_at: s.timestamp,
            last_reading_time: s.timestamp,
            unit: 'unit'
          };
        });

        sensorCache.data = proxyRows;
        sensorCache.timestamp = now;
        return proxyRows;
      }
    } catch (proxyError) {
      console.warn('[SensorService] ML Proxy failed:', proxyError.message);
      // Fallback to database or stale cache
      if (sensorCache.data) return sensorCache.data;
    }

    // 3. Fallback to Database
    const sensors = slopeId
      ? await getSensorsBySlope(slopeId)
      : await getAllSensors();

    if (sensors.rows.length > 0) {
      return sensors.rows;
    }

    // 4. Final Fallback: Mock Data
    return [
      { id: 'S01', slope_id: slopeId || 1, name: 'Displacement S01', sensor_type: 'displacement', current_value: 0.5, status: 'active', is_active: true, lat: 11.1022, lon: 79.1564, updated_at: new Date().toISOString(), last_reading_time: new Date().toISOString(), unit: 'mm' },
      { id: 'S02', slope_id: slopeId || 1, name: 'Pore Pressure S02', sensor_type: 'pore_pressure', current_value: 15.2, status: 'active', is_active: true, lat: 11.1032, lon: 79.1574, updated_at: new Date().toISOString(), last_reading_time: new Date().toISOString(), unit: 'kPa' },
      { id: 'S03', slope_id: slopeId || 1, name: 'Vibration S03', sensor_type: 'vibration', current_value: 0.02, status: 'active', is_active: true, lat: 11.1042, lon: 79.1584, updated_at: new Date().toISOString(), last_reading_time: new Date().toISOString(), unit: 'g' }
    ];

  } catch (error) {
    console.error('[SensorService] Error:', error.message);
    throw error;
  }
};

module.exports = {
  getSensors
};
