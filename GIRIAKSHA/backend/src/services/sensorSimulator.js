const { getAllSensors, insertSensorReading } = require('../models/queries');

let simulationInterval = null;

// Sensor type value ranges for realistic simulation
const SENSOR_RANGES = {
    displacement: { min: 0, max: 10, variance: 0.1 },
    pore_pressure: { min: 10, max: 50, variance: 0.5 },
    vibration: { min: 0, max: 0.5, variance: 0.01 },
    rain_gauge: { min: 0, max: 20, variance: 2 },
    seismic: { min: 0, max: 5, variance: 0.2 },
    tilt: { min: -5, max: 5, variance: 0.1 }
};

const getNewValue = (currentValue, type) => {
    const range = SENSOR_RANGES[type] || { min: 0, max: 100, variance: 1 };

    // If no current value, start random within range
    let val = currentValue !== null ? parseFloat(currentValue) :
        (Math.random() * (range.max - range.min) + range.min);

    // Apply variance (random walk)
    val += (Math.random() - 0.5) * range.variance;

    // Clamp to range
    return Math.max(range.min, Math.min(range.max, val));
};

const runSimulationCycle = async () => {
    try {
        const sensorsResult = await getAllSensors();
        const sensors = sensorsResult.rows;

        for (const sensor of sensors) {
            // Simulate new value based on previous or default
            const newValue = getNewValue(sensor.current_value, sensor.sensor_type);

            // 10% chance to update (don't update all sensors every second to avoid DB thrashing)
            // Or update all every 5 seconds. Let's do all.
            await insertSensorReading(sensor.id, newValue);
        }
        // console.log(`Simulated readings for ${sensors.length} sensors`);
    } catch (error) {
        console.error('Simulation cycle failed:', error);
    }
};

const startSimulation = (intervalMs = 5000) => {
    if (simulationInterval) return;

    console.log(`Starting sensor data simulation (interval: ${intervalMs}ms)...`);
    // Run once immediately
    runSimulationCycle();

    simulationInterval = setInterval(runSimulationCycle, intervalMs);
};

const stopSimulation = () => {
    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
        console.log('Stopped sensor data simulation');
    }
};

module.exports = {
    startSimulation,
    stopSimulation
};
