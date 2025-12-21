const axios = require('axios');
const FormData = require('form-data');
const config = require('../config/env');

const ML_SERVICE_URL = config.mlServiceUrl;

/**
 * Call ML service endpoint
 */
const callMLService = async (method, endpoint, data = null, isFormData = false) => {
  try {
    const url = `${ML_SERVICE_URL}${endpoint}`;
    let response;

    if (isFormData && data) {
      // For file uploads
      response = await axios({
        method,
        url,
        data,
        headers: data.getHeaders(),
        timeout: 30000 // 30 seconds for ML processing
      });
    } else {
      response = await axios({
        method,
        url,
        data,
        timeout: 30000
      });
    }

    return response.data;
  } catch (error) {
    console.error(`ML Service error (${endpoint}):`, error.message);

    // If ML service is not available, return placeholder
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return {
        ok: false,
        implemented: false,
        message: 'ML service unavailable — ensure Python ML service is running',
        error: error.message
      };
    }

    // If ML service returned an error response
    if (error.response) {
      return error.response.data || {
        ok: false,
        implemented: false,
        message: error.response.statusText || 'ML service error',
        error: error.response.data?.detail || error.message
      };
    }

    throw error;
  }
};

/**
 * Helper: Fetch current weather for real-time prediction
 */
const fetchLiveWeather = async (lat = 11.1022, lon = 79.1564) => {
  try {
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,rain,precipitation',
        timezone: 'auto'
      },
      timeout: 3000
    });
    return response.data?.current;
  } catch (error) {
    console.warn('Live weather fetch failed:', error.message);
    return null;
  }
};

/**
 * Predict risk score using XGBoost model
 */
const predict = async ({ slopeId, sensorData = {} }) => {
  try {
    // INJECT LIVE WEATHER
    // Ensure the model uses the absolute latest weather data
    const liveWeather = await fetchLiveWeather();
    if (liveWeather) {
      sensorData.temp_c = liveWeather.temperature_2m;
      sensorData.precip_mm_1h = liveWeather.rain; // mm/h
      // Optional: Add logging to verify injection
      // console.log(`[ML] Injected Weather: ${sensorData.temp_c}°C, ${sensorData.precip_mm_1h}mm`);
    }

    const payload = {
      slopeId,
      sensorData
    };

    const result = await callMLService('POST', '/predict', payload);
    return result;
  } catch (error) {
    console.error('ML predict error:', error);
    return {
      ok: false,
      implemented: false,
      message: 'ML prediction failed',
      error: error.message
    };
  }
};

/**
 * Detect cracks in uploaded image
 */
const detect = async ({ file, imageUrl }) => {
  try {
    if (file) {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype
      });

      const result = await callMLService('POST', '/analyze/image', formData, true);
      return result;
    } else if (imageUrl) {
      const payload = { image_url: imageUrl };
      const result = await callMLService('POST', '/detect', payload);
      return result;
    } else {
      return {
        ok: false,
        implemented: false,
        message: 'Either file or image_url must be provided'
      };
    }
  } catch (error) {
    console.error('ML detect error:', error);
    return {
      ok: false,
      implemented: false,
      message: 'ML detection failed',
      error: error.message
    };
  }
};

/**
 * Helper: Fetch real-time weather forecast from Open-Meteo
 */
const fetchWeatherForecast = async (lat = 11.1022, lon = 79.1564, days = 3) => {
  try {
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: 'temperature_2m,precipitation,rain,weather_code,wind_speed_10m',
        forecast_days: days,
        timezone: 'auto'
      },
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    console.error('Open-Meteo API Error:', error.message);
    return null;
  }
};

/**
 * Generate 72-hour risk forecast with Weather Integration
 */
const forecast = async ({ slopeId }) => {
  try {
    // 1. Get Base Prediction from ML Service (or fallback)
    let mlForecast = {
      timestamps: [],
      base_risk: []
    };

    try {
      const mlResponse = await callMLService('POST', '/forecast', { slopeId });
      if (mlResponse.ok && mlResponse.data) {
        mlForecast = mlResponse.data;
      }
    } catch (e) {
      console.warn('ML Forecast sub-call failed, using heuristic baseline:', e.message);
    }

    // 2. Get Real-time Weather
    const weatherData = await fetchWeatherForecast();

    // 3. Process & Merge Data
    const hourly = weatherData?.hourly || {};
    const timestamps = hourly.time || [];
    const temperatures = hourly.temperature_2m || new Array(timestamps.length).fill(0);
    const rainfall = hourly.rain || new Array(timestamps.length).fill(0);
    const windSpeed = hourly.wind_speed_10m || new Array(timestamps.length).fill(0);
    const weatherCodes = hourly.weather_code || new Array(timestamps.length).fill(0);

    const mergedForecast = timestamps.map((time, index) => {
      // Base risk from ML or default curve if missing
      let baseRisk = mlForecast.base_risk?.[index] ?? (0.3 + Math.sin(index / 10) * 0.1);

      const temp = temperatures[index] || 0;
      const rain = rainfall[index] || 0;
      const wind = windSpeed[index] || 0;

      // Risk Enhancement Heuristic
      // Impact: 1mm rain adds ~2% risk, 10km/h wind adds ~1% risk (simplified)
      const weatherImpact = (rain * 0.05) + (wind * 0.01);

      let enhancedRisk = baseRisk + weatherImpact;
      enhancedRisk = Math.min(Math.max(enhancedRisk, 0), 1); // Clamp 0-1

      return {
        timestamp: time,
        base_risk: baseRisk,
        enhanced_risk: enhancedRisk,
        weather: {
          temp_c: temp,
          rain_mm: rain,
          wind_kph: wind,
          code: weatherCodes[index]
        }
      };
    });

    // 4. Calculate Current Assessment (using immediate forecast)
    const currentFrame = mergedForecast[0] || {};
    const rainfall24h = rainfall.slice(0, 24).reduce((a, b) => a + b, 0);
    const maxIntensity = Math.max(...rainfall);

    return {
      ok: true,
      data: {
        timestamps: timestamps,
        forecast: mergedForecast.map(f => f.enhanced_risk),
        forecast_details: mergedForecast, // Added full details for UI (temp, rain, etc.)
        base_risk_trend: mergedForecast.map(f => f.base_risk),
        current_assessment: {
          timestamp: currentFrame.timestamp,
          base_risk: currentFrame.base_risk,
          enhanced_risk: currentFrame.enhanced_risk,
          weather_impact: {
            total_impact: currentFrame.enhanced_risk - currentFrame.base_risk,
            temp_c: currentFrame.weather?.temp_c,
            rainfall_24h: rainfall24h,
            rainfall_72h: rainfall.reduce((a, b) => a + b, 0),
            max_intensity: maxIntensity,
            wind_speed: currentFrame.weather?.wind_kph,
            condition: interpretWeatherCode(currentFrame.weather?.code)
          }
        }
      }
    };

  } catch (error) {
    console.error('Combined Forecast Error:', error);
    return {
      ok: false,
      message: 'Forecast generation failed',
      error: error.message
    };
  }
};

function interpretWeatherCode(code) {
  const codes = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog',
    51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
    61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
    80: 'Slight Showers', 81: 'Moderate Showers', 82: 'Violent Showers',
    95: 'Thunderstorm'
  };
  return codes[code] || 'Unknown';
}

/**
 * Explain a prediction using SHAP values
 */
const explain = async ({ predictionId, slopeId }) => {
  try {
    const endpoint = `/explain/${predictionId}${slopeId ? `?slopeId=${slopeId}` : ''}`;
    const result = await callMLService('GET', endpoint);
    return result;
  } catch (error) {
    console.error('ML explain error:', error);
    return {
      ok: false,
      implemented: false,
      message: 'ML explanation failed',
      error: error.message
    };
  }
};

/**
 * List all predictions (placeholder - not implemented in ML service yet)
 */
const listPredictions = async () => {
  // This would require storing predictions in database
  // For now, return placeholder
  return {
    ok: false,
    implemented: false,
    message: 'List predictions not yet implemented',
    data: {
      predictions: []
    }
  };
};

/**
 * Get current risk assessment from fusion engine
 */
const getCurrentRisk = async () => {
  try {
    const result = await callMLService('GET', '/risk/current');
    return result;
  } catch (error) {
    console.error('ML getCurrentRisk error:', error);
    return {
      ok: false,
      implemented: false,
      message: 'Failed to get current risk assessment',
      error: error.message
    };
  }
};

/**
 * Get risk grid for heatmap
 */
const getRiskGrid = async () => {
  try {
    const result = await callMLService('GET', '/risk/grid');
    return result;
  } catch (error) {
    console.error('ML getRiskGrid error:', error);
    return {
      ok: false,
      implemented: false,
      message: 'Failed to get risk grid',
      error: error.message
    };
  }
};

/**
 * Get real-time sensor stream
 */
const getSensorStream = async () => {
  try {
    const result = await callMLService('GET', '/stream/sensors');
    return result;
  } catch (error) {
    console.error('ML getSensorStream error:', error);
    return {
      ok: false,
      implemented: false,
      message: 'Failed to get sensor stream',
      error: error.message
    };
  }
};

module.exports = {
  predict,
  detect,
  forecast,
  explain,
  listPredictions,
  getCurrentRisk,
  getRiskGrid,
  getSensorStream
};

