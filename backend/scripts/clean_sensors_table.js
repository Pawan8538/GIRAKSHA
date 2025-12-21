const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function cleanSensors() {
    try {
        console.log("🧹 Cleaning Sensors Table...");
        await pool.query('TRUNCATE TABLE sensors CASCADE;');
        console.log("✅ Sensors table truncated.");

        // Also clear readings for hygiene
        try {
            await pool.query('TRUNCATE TABLE sensor_readings CASCADE;');
            console.log("✅ Sensor Readings table truncated.");
        } catch (e) { console.log("Note: sensor_readings might not exist or be linked."); }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error cleaning tables:', err);
        process.exit(1);
    }
}

cleanSensors();
