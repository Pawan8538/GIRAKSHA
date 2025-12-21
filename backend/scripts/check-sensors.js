// Quick debug script to check sensors in database
// Run from backend directory: node scripts/check-sensors.js

const { query } = require('../src/models/db');

async function checkSensors() {
    try {
        console.log('\n=== CHECKING DATABASE ===\n');

        // Count slopes
        const slopes = await query('SELECT COUNT(*) FROM slopes');
        console.log(`Total slopes/mines: ${slopes.rows[0].count}`);

        // List all sl slopes
        const slopeList = await query('SELECT id, name, risk_level FROM slopes');
        console.log('\nSlopes:');
        slopeList.rows.forEach(s => console.log(`  - ID ${s.id}: ${s.name} (${s.risk_level})`));

        // Count sensors
        const sensors = await query('SELECT COUNT(*) FROM sensors');
        console.log(`\nTotal sensors: ${sensors.rows[0].count}`);

        // List all sensors with slope info
        const sensorList = await query(`
            SELECT s.id, s.name, s.sensor_type, s.is_active, s.slope_id, sl.name as slope_name
            FROM sensors s
            LEFT JOIN slopes sl ON s.slope_id = sl.id
            ORDER BY s.id
        `);
        console.log('\nSensors:');
        sensorList.rows.forEach(s => {
            const status = s.is_active ? '✓ Active' : '✗ Inactive';
            console.log(`  - ID ${s.id}: ${s.sensor_type} (${s.name}) - ${status} - Slope: ${s.slope_name || 'N/A'}`);
        });

        // Count readings
        const readings = await query('SELECT COUNT(*) FROM sensor_readings');
        console.log(`\nTotal sensor readings: ${readings.rows[0].count}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSensors();
