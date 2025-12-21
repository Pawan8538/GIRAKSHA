const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../backend/.env') });
const { query } = require('../src/models/db');

async function checkSchema() {
    try {
        const userCols = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
        console.log('Users Table Columns:', userCols.rows);

        const slopeCols = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'slopes';
    `);
        console.log('Slopes Table Columns:', slopeCols.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
