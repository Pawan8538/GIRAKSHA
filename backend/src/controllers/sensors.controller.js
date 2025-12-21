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

const listSensors = async (req, res, next) => {
  try {
    const { slopeId } = req.query;

    // PROXY STRATEGY: Try fetching Real-Time Data from Python ML Service first
    try {
      const mlResponse = await axios.get('http://127.0.0.1:8000/sensors/live', { timeout: 2000 });
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

        return res.json({
          success: true,
          data: proxyRows,
          source: 'python_ml_proxy' // Debug flag
        });
      }
    } catch (proxyError) {
      console.error('❌ Proxy Failed:', proxyError.message, proxyError.code ? `Code: ${proxyError.code}` : '');
      // Fallthrough to DB logic
    }

    const sensors = slopeId
      ? await getSensorsBySlope(slopeId)
      : await getAllSensors();

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

    // Proxy to Python
    try {
      const mlResponse = await axios.post(`http://127.0.0.1:8000/sensors/control/global?active=${active}`);
      return res.json({
        success: true,
        data: mlResponse.data,
        message: mlResponse.data.message || 'System status updated'
      });
    } catch (proxyError) {
      console.error('Proxy Error:', proxyError.message);
      return res.status(503).json({ success: false, message: 'ML Service Unavailable' });
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

