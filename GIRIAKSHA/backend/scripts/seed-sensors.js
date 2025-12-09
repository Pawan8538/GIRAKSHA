#!/usr/bin/env node

/**
 * Database Seeding Script - Sensors
 * 
 * This script populates the database with sensors for all existing slopes/mines.
 * It can be run multiple times safely - it will skip existing sensors.
 * 
 * Usage:
 *   node scripts/seed-sensors.js
 *   node scripts/seed-sensors.js --force  (recreate all sensors)
 *   node scripts/seed-sensors.js --help
 */

const { query } = require('../src/models/db');
const { createSensor } = require('../src/models/queries');

// Sensor templates - customize these as needed
const SENSOR_TEMPLATES = [
    { name: 'Displacement Sensor 1', type: 'displacement', unit: 'mm' },
    { name: 'Displacement Sensor 2', type: 'displacement', unit: 'mm' },
    { name: 'Rain Gauge 1', type: 'rain_gauge', unit: 'mm' },
    { name: 'Rain Gauge 2', type: 'rain_gauge', unit: 'mm' },
    { name: 'Pore Pressure Sensor 1', type: 'pore_pressure', unit: 'kPa' },
    { name: 'Pore Pressure Sensor 2', type: 'pore_pressure', unit: 'kPa' },
    { name: 'Vibration Sensor 1', type: 'vibration', unit: 'm/s²' },
    { name: 'Seismic Sensor 1', type: 'seismic', unit: 'Hz' },
    { name: 'Tiltmeter 1', type: 'tilt', unit: 'deg' },
    { name: 'Tiltmeter 2', type: 'tilt', unit: 'deg' }
];

// Parse command line arguments
const args = process.argv.slice(2);
const forceRecreate = args.includes('--force');
const showHelp = args.includes('--help') || args.includes('-h');

function printHelp() {
    console.log(`
Database Sensor Seeding Script

Usage:
  node scripts/seed-sensors.js [options]

Options:
  --force    Delete all existing sensors and recreate them
  --help     Show this help message

Examples:
  node scripts/seed-sensors.js          # Add sensors to slopes that don't have them
  node scripts/seed-sensors.js --force  # Recreate all sensors (WARNING: deletes existing)
`);
}

async function clearExistingSensors() {
    console.log('⚠️  Clearing existing sensors...');
    await query('DELETE FROM sensor_readings');
    await query('DELETE FROM sensors');
    console.log('✓ All sensors and readings deleted\n');
}

async function seedSensors() {
    try {
        console.log('\n╔════════════════════════════════════════╗');
        console.log('║   GeoGuard - Sensor Seeding Script    ║');
        console.log('╚════════════════════════════════════════╝\n');

        if (showHelp) {
            printHelp();
            process.exit(0);
        }

        // Force recreate if requested
        if (forceRecreate) {
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });

            await new Promise((resolve) => {
                readline.question('⚠️  WARNING: This will delete ALL sensors and readings. Continue? (yes/no): ', (answer) => {
                    readline.close();
                    if (answer.toLowerCase() !== 'yes') {
                        console.log('Aborted.');
                        process.exit(0);
                    }
                    resolve();
                });
            });

            await clearExistingSensors();
        }

        // Get all slopes
        const slopes = await query('SELECT id, name FROM slopes ORDER BY id');

        if (slopes.rows.length === 0) {
            console.log('❌ No slopes found in database!');
            console.log('   Please create slopes first before seeding sensors.\n');
            process.exit(1);
        }

        console.log(`📍 Found ${slopes.rows.length} slope(s)\n`);

        let totalCreated = 0;
        let totalSkipped = 0;

        // Process each slope
        for (const slope of slopes.rows) {
            console.log(`\n🏔️  Processing: ${slope.name} (ID: ${slope.id})`);
            console.log('─'.repeat(50));

            for (const template of SENSOR_TEMPLATES) {
                try {
                    // Check if sensor already exists (by name and slope)
                    const existing = await query(
                        'SELECT id FROM sensors WHERE slope_id = $1 AND name = $2',
                        [slope.id, template.name]
                    );

                    if (existing.rows.length > 0 && !forceRecreate) {
                        console.log(`  ⊘ Skipped: ${template.name} (already exists)`);
                        totalSkipped++;
                        continue;
                    }

                    // Create sensor
                    const result = await createSensor(
                        slope.id,
                        template.name,
                        template.type,
                        template.unit
                    );

                    if (result.rows[0]) {
                        console.log(`  ✓ Created: ${template.name} (${template.type})`);
                        totalCreated++;
                    }
                } catch (err) {
                    console.error(`  ✗ Error creating ${template.name}: ${err.message}`);
                }
            }
        }

        // Summary
        console.log('\n' + '═'.repeat(50));
        console.log('📊 SUMMARY');
        console.log('═'.repeat(50));
        console.log(`✓ Sensors created: ${totalCreated}`);
        console.log(`⊘ Sensors skipped: ${totalSkipped}`);

        // Final count
        const finalCount = await query('SELECT COUNT(*) FROM sensors');
        console.log(`📈 Total sensors in database: ${finalCount.rows[0].count}`);

        console.log('\n✅ Seeding completed successfully!\n');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error during seeding:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the seeding
seedSensors();
