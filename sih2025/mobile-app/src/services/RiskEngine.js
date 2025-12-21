import { Alert } from 'react-native';

// Configuration
const API_KEY = "d35fba280190f0e95977742016f32cb4";
const LAT = 11.1053;
const LON = 79.1506;
const GRID_SIZE = 20; // Increased from 12 for smaller cells
const CELL_SIZE = 0.0005; // Reduced from 0.0008 to keep total area similar

// State
let cachedWeatherData = null;
let lastWeatherFetch = 0;
const WEATHER_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Helper: Gaussian Noise (Box-Muller transform)
const randomNormal = (mean = 0, std = 1) => {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * std + mean;
};

// 1. Weather Engine
export const fetchWeatherData = async () => {
    const now = Date.now();
    if (cachedWeatherData && (now - lastWeatherFetch < WEATHER_CACHE_DURATION)) {
        return cachedWeatherData;
    }

    try {
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.cod !== "200") throw new Error(data.message);

        const current = data.list[0];

        // Calculate rainfall (approximate from 3h data)
        const rain3h = current.rain ? current.rain['3h'] || 0 : 0;
        const rain24h = rain3h * 8; // Rough estimate
        const rain72h = rain24h * 3;

        cachedWeatherData = {
            temperature: current.main.temp,
            humidity: current.main.humidity,
            wind_speed: current.wind.speed,
            weather_condition: current.weather[0].main,
            rainfall_24h: rain24h,
            rainfall_72h: rain72h,
            max_rain_intensity: rain3h / 3, // mm/hr
            data_source: 'REAL_API'
        };
        lastWeatherFetch = now;
        return cachedWeatherData;
    } catch (error) {
        console.warn("Weather fetch failed, using simulation:", error);
        return {
            temperature: 28 + Math.random() * 5,
            humidity: 60 + Math.random() * 20,
            wind_speed: 5 + Math.random() * 10,
            weather_condition: 'Clouds',
            rainfall_24h: 0,
            rainfall_72h: 0,
            max_rain_intensity: 0,
            data_source: 'SIMULATION'
        };
    }
};

// 2. Sensor Simulation
const generateSensors = () => {
    const sensors = [];
    for (let i = 0; i < 5; i++) {
        sensors.push({
            id: `S${i}`,
            location: {
                lat: LAT + (Math.random() - 0.5) * 0.01,
                lon: LON + (Math.random() - 0.5) * 0.01
            },
            values: {
                disp_mm: Math.random() * 5,
                pore_kpa: 20 + Math.random() * 30,
                vibration_g: Math.random() * 0.05
            }
        });
    }
    return sensors;
};

// 3. Risk Calculation Engine
export const calculateRiskGrid = async () => {
    const weather = await fetchWeatherData();
    const sensors = generateSensors();
    const grid = [];

    // Weather Impact Calculation
    const rain_24 = Math.min(weather.rainfall_24h / 50.0, 1.0);
    const rain_72 = Math.min(weather.rainfall_72h / 100.0, 1.0);
    const intensity = Math.min(weather.max_rain_intensity / 25.0, 1.0);

    const condMap = { 'Thunderstorm': 1.0, 'Rain': 0.6, 'Drizzle': 0.3, 'Clouds': 0.1, 'Clear': 0.0 };
    const condScore = condMap[weather.weather_condition] || 0.0;

    const weatherImpact = (
        rain_24 * 0.35 +
        rain_72 * 0.25 +
        intensity * 0.20 +
        condScore * 0.10 +
        (weather.humidity / 100) * 0.10
    );

    const weatherMultiplier = 1.1 + (weatherImpact * 0.8);

    // Grid Generation
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const lat = LAT + (r - GRID_SIZE / 2) * CELL_SIZE;
            const lon = LON + (c - GRID_SIZE / 2) * CELL_SIZE;

            // 1. Mine Proximity Risk
            const distFromCenter = Math.sqrt(Math.pow(r - GRID_SIZE / 2, 2) + Math.pow(c - GRID_SIZE / 2, 2));
            const maxDist = (GRID_SIZE / 2) * Math.sqrt(2);
            const normDist = distFromCenter / maxDist;
            const mineProximityRisk = 0.85 * Math.exp(-1.0 * normDist);

            // 2. Geological Risk
            let geologicalRisk = 0.0;
            if (r < GRID_SIZE / 2 && c < GRID_SIZE / 2) geologicalRisk += 0.35; // NW
            if (r > GRID_SIZE / 2 && c > GRID_SIZE / 2) geologicalRisk += 0.30; // SE
            if (Math.abs(r - GRID_SIZE / 2) < 6 || Math.abs(c - GRID_SIZE / 2) < 6) geologicalRisk += 0.25; // Center (adjusted for larger grid)

            geologicalRisk += randomNormal(0, 0.05);
            geologicalRisk = Math.max(0, Math.min(0.6, geologicalRisk));

            // 3. Dynamic Sensor Risk
            let dynamicRisk = 0.0;
            let totalWeight = 0.0;

            sensors.forEach(s => {
                const d = Math.sqrt(Math.pow(s.location.lat - lat, 2) + Math.pow(s.location.lon - lon, 2));
                const weight = 1.0 / Math.pow(d + 0.0001, 3);

                let sRisk = (
                    (s.values.disp_mm / 10.0) * 0.4 +
                    (s.values.pore_kpa / 50.0) * 0.35 +
                    (s.values.vibration_g / 0.5) * 0.25
                );
                sRisk = Math.min(sRisk, 0.9);

                dynamicRisk += sRisk * weight;
                totalWeight += weight;
            });

            if (totalWeight > 0) dynamicRisk /= totalWeight;

            // 4. Combine
            const baseRisk = (
                mineProximityRisk * 0.45 +
                geologicalRisk * 0.35 +
                dynamicRisk * 0.20
            );

            // 5. Final Score
            let finalScore = baseRisk * weatherMultiplier;
            finalScore = Math.max(0, Math.min(0.99, finalScore));

            grid.push({
                id: `C${r}-${c}`,
                row: r,
                col: c,
                lat,
                lon,
                risk_score: finalScore,
                mine_proximity: mineProximityRisk,
                sensor_influence: dynamicRisk,
                weather_impact: weatherImpact
            });
        }
    }

    // Calculate Stats
    const risks = grid.map(c => c.risk_score);
    const avgRisk = risks.reduce((a, b) => a + b, 0) / risks.length;
    const maxRisk = Math.max(...risks);

    // Sensor Stats
    const sensorStats = {
        max_disp_mm: Math.max(...sensors.map(s => s.values.disp_mm)),
        max_pore_kpa: Math.max(...sensors.map(s => s.values.pore_kpa)),
        max_vib_g: Math.max(...sensors.map(s => s.values.vibration_g)),
        active_sensors: sensors.length
    };

    return {
        grid,
        stats: {
            average_risk: avgRisk,
            max_risk: maxRisk,
            total_cells: grid.length
        },
        weather_data: weather,
        weather_impact: weatherImpact,
        sensor_stats: sensorStats
    };
};

export const getRiskAssessment = async () => {
    const data = await calculateRiskGrid();

    // Generate Alerts
    const alerts = [];
    if (data.stats.max_risk > 0.75) alerts.push("CRITICAL: High landslide risk detected in central zone");
    if (data.weather_data.rainfall_24h > 20) alerts.push("WARNING: Heavy rainfall increasing soil saturation");
    if (data.sensor_stats.max_disp_mm > 3) alerts.push("ALERT: Significant ground displacement detected");

    return {
        base_risk: data.stats.average_risk,
        enhanced_risk: data.stats.max_risk, // Use max risk for site-wide alert
        weather_impact: data.weather_impact,
        weather_data: data.weather_data,
        risk_level: data.stats.max_risk >= 0.75 ? 'Danger' :
            data.stats.max_risk >= 0.60 ? 'High' :
                data.stats.max_risk >= 0.35 ? 'Medium' : 'Low',
        alerts: alerts,
        sources: {
            sensors: data.sensor_stats,
            visual: { risk_score: 0.0, last_check: null }
        }
    };
};
