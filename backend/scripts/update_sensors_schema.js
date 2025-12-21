const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // This assumes script is known to be in scripts/, but running from backend root?
// If running from backend root:
// path is relative to CWD if straight string?
// require('dotenv').config() defaults to .env in CWD.

// Standard approach:
require('dotenv').config();

/*
 If .env is in backend root, and we run `node scripts/update_sensors_schema.js` from backend root, `require('dotenv').config()` works.
*/

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function updateSensorsSchema() {
    try {
        console.log('Connecting to database...');
        // Add columns if they don't exist
        await pool.query(`
      ALTER TABLE sensors 
      ADD COLUMN IF NOT EXISTS current_value NUMERIC,
      ADD COLUMN IF NOT EXISTS last_reading_time TIMESTAMP WITH TIME ZONE;
    `);

        console.log('Successfully added current_value and last_reading_time columns to sensors table.');

        // Optional: Add basic indexes if useful (id is already PK)

    } catch (error) {
        console.error('Error updating schema:', error);
    } finally {
        await pool.end();
    }
}

updateSensorsSchema();
