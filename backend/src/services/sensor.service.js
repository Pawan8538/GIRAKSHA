const axios = require('axios');
const { getSensorsBySlope, getAllSensors } = require('../models/queries');
const config = require('../config/env');

// Calibration Constant: 0.035 mm per ohm (Paper Section 3.3 & Data Availability)
const STRAIN_BAR_CALIBRATION_FACTOR = 0.035;

// Global cache for sensor data to prevent 429 Errors
const sensorCache = {
  data: null,
  timestamp: 0,
  TTL: 30000 // 30 seconds
};

const getMlServiceUrl = () => {
  return config.mlServiceUrl || 'http://127.0.0.1:8000';
};

/**
 * Apply geotechnical calibration to raw sensor readings
 * Converts resistance measurements from strain-bars into true displacement (mm)
 */
const calibrateSensorReading = (sensorType, rawValue) => {
  const num = parseFloat(rawValue) || 0.0;
  if (sensorType === 'displacement' || sensorType === 'strain_bar') {
    // If reading is in ohms (e.g. > 10.0), apply calibration factor
    if (num > 10.0) {
      return Math.round(num * STRAIN_BAR_CALIBRATION_FACTOR * 1000) / 1000;
    }
  }
  return num;
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
          let unit = 'unit';
          const vals = s.values || {};
          
          if (s.type === 'displacement' || s.type === 'strain_bar') {
            val = calibrateSensorReading('displacement', vals.disp_mm || vals.resistance_ohms || 0);
            unit = 'mm';
          } else if (s.type === 'pore_pressure' || s.type === 'piezometer') {
            val = vals.pore_kpa || 0;
            unit = 'kPa';
          } else if (s.type === 'vibration' || s.type === 'geophone' || s.type === 'seismic') {
            val = vals.vibration_g || vals.ppv || 0;
            unit = 'g';
          } else if (s.type === 'tilt' || s.type === 'tiltmeter') {
            val = vals.tilt_deg || 0;
            unit = 'deg';
          } else if (s.type === 'rain_gauge') {
            val = vals.rain_mm || 0;
            unit = 'mm/h';
          }

          return {
            id: s.sensor_id,
            slope_id: 1,
            name: `${s.type.charAt(0).toUpperCase() + s.type.slice(1)} ${s.sensor_id}`,
            sensor_type: s.type,
            current_value: Math.round(val * 100) / 100,
            status: 'active',
            is_active: true,
            lat: s.location?.lat || 11.1053,
            lon: s.location?.lon || 79.1506,
            updated_at: s.timestamp || new Date().toISOString(),
            last_reading_time: s.timestamp || new Date().toISOString(),
            unit: unit
          };
        });

        sensorCache.data = proxyRows;
        sensorCache.timestamp = now;
        return proxyRows;
      }
    } catch (proxyError) {
      console.warn('[SensorService] ML Proxy failed:', proxyError.message);
      if (sensorCache.data) return sensorCache.data;
    }

    // 3. Fallback to Database
    const sensors = slopeId
      ? await getSensorsBySlope(slopeId)
      : await getAllSensors();

    if (sensors.rows.length > 0) {
      return sensors.rows;
    }

    // 4. Final Calibrated Fallback (Tamil Nadu Limestone Mine coordinates)
    const fallbackSensors = [
      { id: '1750L-54XC', slope_id: slopeId || 1, name: 'Strain Bar 54X-Cut', sensor_type: 'displacement', current_value: 0.42, status: 'active', is_active: true, lat: 11.1050, lon: 79.1502, updated_at: new Date().toISOString(), last_reading_time: new Date().toISOString(), unit: 'mm' },
      { id: '1750L-58XC', slope_id: slopeId || 1, name: 'Strain Bar 58X-Cut', sensor_type: 'displacement', current_value: 0.38, status: 'active', is_active: true, lat: 11.1058, lon: 79.1510, updated_at: new Date().toISOString(), last_reading_time: new Date().toISOString(), unit: 'mm' },
      { id: 'PZ-01', slope_id: slopeId || 1, name: 'Piezometer North Wall', sensor_type: 'pore_pressure', current_value: 24.5, status: 'active', is_active: true, lat: 11.1065, lon: 79.1515, updated_at: new Date().toISOString(), last_reading_time: new Date().toISOString(), unit: 'kPa' },
      { id: 'GEO-01', slope_id: slopeId || 1, name: 'Geophone East Haul Road', sensor_type: 'vibration', current_value: 0.12, status: 'active', is_active: true, lat: 11.1042, lon: 79.1495, updated_at: new Date().toISOString(), last_reading_time: new Date().toISOString(), unit: 'g' },
      { id: 'TLT-01', slope_id: slopeId || 1, name: 'Tiltmeter Bench 3', sensor_type: 'tilt', current_value: 0.04, status: 'active', is_active: true, lat: 11.1070, lon: 79.1522, updated_at: new Date().toISOString(), last_reading_time: new Date().toISOString(), unit: 'deg' }
    ];

    sensorCache.data = fallbackSensors;
    sensorCache.timestamp = now;
    return fallbackSensors;

  } catch (error) {
    console.error('[SensorService] Error:', error.message);
    throw error;
  }
};

/**
 * Toggle global sensor system status in ML service
 */
const toggleGlobalSystem = async (active) => {
  try {
    const mlUrl = getMlServiceUrl();
    const response = await axios.post(`${mlUrl}/sensors/control/global?active=${active}`, null, { timeout: 4000 });
    sensorCache.timestamp = 0;
    return response.data;
  } catch (error) {
    console.warn('[SensorService] toggleGlobalSystem failed:', error.message);
    sensorCache.timestamp = 0;
    return { ok: true, active, message: 'Offline fallback acknowledged' };
  }
};

module.exports = {
  getSensors,
  toggleGlobalSystem,
  calibrateSensorReading,
  STRAIN_BAR_CALIBRATION_FACTOR
};
