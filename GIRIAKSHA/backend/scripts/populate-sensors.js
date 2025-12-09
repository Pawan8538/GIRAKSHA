// Script to populate database with sensors for all slopes
const { query } = require('../src/models/db');
const { createSensor } = require('../src/models/queries');

const sensorTemplates = [
    { name: 'Displacement Sensor 1', type: 'displacement', unit: 'mm' },
    { name: 'Displacement Sensor 2', type: 'displacement', unit: 'mm' },
    { name: 'Rain Gauge 1', type: 'rain_gauge', unit: 'mm' },
    { name: 'Pore Pressure Sensor 1', type: 'pore_pressure', unit: 'kPa' },
    { name: 'Pore Pressure Sensor 2', type: 'pore_pressure', unit: 'kPa' },
    { name: 'Vibration Sensor 1', type: 'vibration', unit: 'm/s²' },
    { name: 'Seismic Sensor 1', type: 'seismic', unit: 'Hz' },
    { name: 'Tiltmeter 1', type: 'tilt', unit: 'deg' },
    { name: 'Tiltmeter 2', type: 'tilt', unit: 'deg' }
];

async function populateSensors() {
    try {
        console.log('\n=== POPULATING SENSORS ===\n');

        // Get all slopes
        const slopes = await query('SELECT id, name FROM slopes ORDER BY id');
        console.log(`Found ${slopes.rows.length} slopes\n`);

        let createdCount = 0;

        for (const slope of slopes.rows) {
            console.log(`Creating sensors for slope: ${slope.name} (ID: ${slope.id})`);

            // Create multiple sensors for each slope
            for (const template of sensorTemplates) {
                try {
                    const result = await createSensor(
                        slope.id,
                        `${template.name}`,
                        template.type,
                        template.unit
                    );

                    if (result.rows[0]) {
                        console.log(`  ✓ Created: ${template.name} (${template.type})`);
                        createdCount++;
                    }
                } catch (err) {
                    console.error(`  ✗ Error creating ${template.name}:`, err.message);
                }
            }
            console.log('');
        }

        console.log(`\nTotal sensors created: ${createdCount}`);

        // Show final count
        const final = await query('SELECT COUNT(*) FROM sensors');
        console.log(`Total sensors in database: ${final.rows[0].count}\n`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

populateSensors();
