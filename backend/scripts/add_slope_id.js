const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../backend/.env') });
const { query } = require('../src/models/db');

async function migrate() {
    try {
        console.log('Adding slope_id to users table...');
        await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS slope_id INTEGER REFERENCES slopes(id);
    `);
        console.log('Migration successful');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
