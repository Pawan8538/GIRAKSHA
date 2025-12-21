require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('../src/models/db');

async function generateData() {
    try {
        console.log('🚀 Starting sensor data generation...');

        // 1. Ensure we have a slope
        let slopeId;
        const slopeRes = await pool.query("SELECT id FROM slopes LIMIT 1");
        if (slopeRes.rows.length === 0) {
            console.log('Creating default slope...');
            const newSlope = await pool.query(
                "INSERT INTO slopes (name, description, risk_level) VALUES ($1, $2, $3) RETURNING id",
                ['Demo Slope', 'Slope for testing', 'low']
            );
            slopeId = newSlope.rows[0].id;
        } else {
            slopeId = slopeRes.rows[0].id;
        }
        console.log(`Using Slope ID: ${slopeId}`);

        // 2. Ensure we have sensors
        const sensorTypes = ['displacement', 'pore_pressure', 'vibration', 'rain_gauge'];
        const sensorIds = [];

        for (const type of sensorTypes) {
            const sensorRes = await pool.query(
                "SELECT id FROM sensors WHERE slope_id = $1 AND sensor_type = $2 LIMIT 1",
                [slopeId, type]
            );

            if (sensorRes.rows.length === 0) {
                console.log(`Creating ${type} sensor...`);
                const newSensor = await pool.query(
                    "INSERT INTO sensors (slope_id, name, sensor_type, is_active) VALUES ($1, $2, $3, $4) RETURNING id",
                    [slopeId, `${type}_01`, type, true]
                );
                sensorIds.push({ id: newSensor.rows[0].id, type });
            } else {
                sensorIds.push({ id: sensorRes.rows[0].id, type });
            }
        }

        // 3. Generate readings
        console.log('Generating readings...');
        const readings = [];

        for (const sensor of sensorIds) {
            let value = 0;
            // Simulate realistic values
            if (sensor.type === 'displacement') value = Math.random() * 10; // mm
            if (sensor.type === 'pore_pressure') value = Math.random() * 50; // kPa
            if (sensor.type === 'vibration') value = Math.random() * 0.5; // g
            if (sensor.type === 'rain_gauge') value = Math.random() * 20; // mm

            readings.push({
                sensor_id: sensor.id,
                value: parseFloat(value.toFixed(2)),
                status: 'ok'
            });
        }

        // 4. Insert readings
        for (const reading of readings) {
            await pool.query(
                "INSERT INTO sensor_readings (sensor_id, value, status) VALUES ($1, $2, $3)",
                [reading.sensor_id, reading.value, reading.status]
            );
        }

        console.log(`✅ Successfully inserted ${readings.length} sensor readings.`);
        console.log('Data flow: Script -> Supabase (sensor_readings table) -> Ready for ML');

    } catch (error) {
        console.error('❌ Error generating data:', error);
    } finally {
        await pool.end();
    }
}

generateData();
