const {
  createSensor,
  getSensorsBySlope,
  getAllSensors,
  getSensorById,
  insertSensorReading,
  getSensorHistory,
  getSlopeById,
  toggleSensorActive,
  getSensorReadingStats
} = require('../models/queries');

const axios = require('axios'); // Added for Proxy

const getMlServiceUrl = () => {
  let url = process.env.ML_SERVICE_URL;
  if (url) {
    if (!url.startsWith('http')) {
      url = url.includes('.onrender.com') ? `https://${url}` : `http://${url}`;
    }
    return url.replace(/\/$/, '');
  }
  return 'http://127.0.0.1:8000';
};

// Global cache to prevent 429 Too Many Requests on Render Free Tier
let proxyCache = {
  data: null,
  timestamp: 0
};
const CACHE_TTL = 60000; // 60 seconds
const CACHE_TTL_429 = 120000; // 2 minutes backoff after a 429

const listSensors = async (req, res, next) => {
  try {
    const { slopeId } = req.query;

    // PROXY STRATEGY: Try fetching Real-Time Data from Python ML Service first
    try {
      const mlUrl = getMlServiceUrl();
      
      // Serve from cache if valid
      if (proxyCache.data && (Date.now() - proxyCache.timestamp < CACHE_TTL)) {
        return res.json({
          success: true,
          data: proxyCache.data,
          source: 'python_ml_proxy_cached'
        });
      }

      const mlResponse = await axios.get(`${mlUrl}/sensors/live`, { timeout: 2000 });
      if (mlResponse.data && mlResponse.data.ok && mlResponse.data.data) {

        // Transform attributes to match expected DB schema for Frontend
        const proxyRows = mlResponse.data.data.map(s => {
          // Identify primary value
          let val = 0;
          const vals = s.values;
          if (s.type === 'displacement') val = vals.disp_mm;
          else if (s.type === 'pore_pressure' || s.type === 'piezometer') val = vals.pore_kpa;
          else if (s.type === 'vibration' || s.type === 'seismic') val = vals.vibration_g;
          else if (s.type === 'tilt') val = vals.tilt_deg;
          else if (s.type === 'rain_gauge') val = vals.rain_mm || 0; // if available

          const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

          return {
            id: s.sensor_id,
            slope_id: 1,
            name: `${capitalize(s.type)} ${s.sensor_id}`,
            sensor_type: s.type,
            current_value: val,
            status: 'active',
            is_active: true, // Frontend uses this for filtering
            lat: s.location.lat,
            lon: s.location.lon,
            updated_at: s.timestamp,
            last_reading_at: s.timestamp,
            last_reading_time: s.timestamp, // Correct field for SensorCard
            unit: 'unit'
          };
        });

        // Update Cache
        proxyCache.data = proxyRows;
        proxyCache.timestamp = Date.now();

        return res.json({
          success: true,
          data: proxyRows,
          source: 'python_ml_proxy' // Debug flag
        });
      }
    } catch (proxyError) {
      // On 429, extend cache TTL aggressively to back off from the ML service
      if (proxyError.response && proxyError.response.status === 429 && proxyCache.data) {
        proxyCache.timestamp = Date.now() - CACHE_TTL + CACHE_TTL_429; // Extend cache for 2 min
        console.warn('⚠️ ML Service rate-limited (429). Serving stale cache for 2 minutes.');
        return res.json({ success: true, data: proxyCache.data, source: 'python_ml_proxy_stale' });
      }
      console.error('❌ Proxy Failed:', proxyError.message, proxyError.code ? `Code: ${proxyError.code}` : '');
      // Fallthrough to DB logic
    }

    const sensors = slopeId
      ? await getSensorsBySlope(slopeId)
      : await getAllSensors();

    // FALLBACK: If DB is empty and proxy failed (e.g., due to Render rate limit 429s), 
    // provide mock sensor data to keep the dashboard functioning and prevent the 'System Paused' UI trap.
    if (sensors.rows.length === 0) {
      const mockSensors = [
        { id: 'S01', slope_id: slopeId || 1, name: 'Displacement S01', sensor_type: 'displacement', current_value: 0.5, status: 'active', is_active: true, lat: 11.1022, lon: 79.1564, updated_at: new Date().toISOString(), last_reading_time: new Date().toISOString(), unit: 'mm' },
        { id: 'S02', slope_id: slopeId || 1, name: 'Pore Pressure S02', sensor_type: 'pore_pressure', current_value: 15.2, status: 'active', is_active: true, lat: 11.1032, lon: 79.1574, updated_at: new Date().toISOString(), last_reading_time: new Date().toISOString(), unit: 'kPa' },
        { id: 'S03', slope_id: slopeId || 1, name: 'Vibration S03', sensor_type: 'vibration', current_value: 0.02, status: 'active', is_active: true, lat: 11.1042, lon: 79.1584, updated_at: new Date().toISOString(), last_reading_time: new Date().toISOString(), unit: 'g' },
        { id: 'S04', slope_id: slopeId || 1, name: 'Rain Gauge S04', sensor_type: 'rain_gauge', current_value: 0.0, status: 'active', is_active: true, lat: 11.1052, lon: 79.1594, updated_at: new Date().toISOString(), last_reading_time: new Date().toISOString(), unit: 'mm' }
      ];
      
      return res.json({
        success: true,
        data: mockSensors,
        source: 'mock_fallback'
      });
    }

    return res.json({
      success: true,
      data: sensors.rows,
      source: 'database'
    });
  } catch (error) {
    next(error);
  }
};

const addSensor = async (req, res, next) => {
  try {
    const { slopeId, name, sensorType, unit } = req.body;

    const slope = await getSlopeById(slopeId);
    if (slope.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Slope not found'
      });
    }

    const created = await createSensor(slopeId, name, sensorType, unit);
    return res.status(201).json({
      success: true,
      data: created.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const addReading = async (req, res, next) => {
  try {
    const { sensorId } = req.params;
    const { value, status = 'ok' } = req.body;

    const sensor = await getSensorById(sensorId);
    if (sensor.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sensor not found'
      });
    }

    // TODO: Attach TimescaleDB-specific hypertable logic when we enable Timescale.
    const created = await insertSensorReading(sensorId, value, status);
    return res.status(201).json({
      success: true,
      data: created.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const getReadings = async (req, res, next) => {
  try {
    const { sensorId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 100;

    const sensor = await getSensorById(sensorId);
    if (sensor.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sensor not found'
      });
    }

    const readings = await getSensorHistory(sensorId, limit);
    return res.json({
      success: true,
      data: readings.rows
    });
  } catch (error) {
    next(error);
  }
};

const getSensor = async (req, res, next) => {
  try {
    const { sensorId } = req.params;
    const sensor = await getSensorById(sensorId);

    if (sensor.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sensor not found'
      });
    }

    return res.json({
      success: true,
      data: sensor.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const toggleSensorStatus = async (req, res, next) => {
  try {
    const { sensorId } = req.params;

    // VIRTUAL SENSOR CHECK (Proxy IDs like S01, S02)
    if (sensorId.toString().startsWith('S') || isNaN(parseInt(sensorId))) {
      return res.json({
        success: true,
        data: { id: sensorId, is_active: true }, // Mock toggle
        message: 'Virtual sensor status updated (Simulation Only)'
      });
    }

    // Check if sensor exists
    const sensor = await getSensorById(sensorId);
    if (sensor.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sensor not found'
      });
    }

    const updated = await toggleSensorActive(sensorId);
    return res.json({
      success: true,
      data: updated.rows[0],
      message: `Sensor marked as ${updated.rows[0].is_active ? 'active' : 'inactive'}`
    });
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const { sensorId } = req.params;
    const { hours = 24 } = req.query;

    const sensor = await getSensorById(sensorId);
    if (sensor.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sensor not found'
      });
    }

    const stats = await getSensorReadingStats(sensorId, hours);
    return res.json({
      success: true,
      data: stats.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const toggleGlobalSystem = async (req, res, next) => {
  try {
    const { active } = req.body; // Expect { active: false } to pause

    // Proxy to Python ML Service
    try {
      const mlUrl = getMlServiceUrl();
      const mlResponse = await axios.post(`${mlUrl}/sensors/control/global?active=${active}`, null, { timeout: 5000 });
      
      // Invalidate the cache so the next poll sees the new state immediately!
      proxyCache.timestamp = 0;

      return res.json({
        success: true,
        data: mlResponse.data,
        message: mlResponse.data.message || 'System status updated'
      });
    } catch (proxyError) {
      console.warn('[toggleGlobalSystem] ML proxy failed, responding with local success:', proxyError.message);
      
      // RESILIENT FALLBACK: If ML service is sleeping/unavailable (common on Render free tier),
      // return success locally. The toggle is a UI state — the simulation continues anyway.
      proxyCache.timestamp = 0; // Still invalidate cache
      return res.json({
        success: true,
        message: `System ${active ? 'resumed' : 'paused'} (ML service offline — state may not persist)`,
        data: { ok: true, active }
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSensors,
  addSensor,
  addReading,
  getReadings,
  getSensor,
  toggleSensorStatus,
  getStats,
  toggleGlobalSystem
};

