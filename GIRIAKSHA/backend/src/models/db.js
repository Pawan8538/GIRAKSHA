const { Pool } = require('pg');
const config = require('../config/env');

const pool = new Pool({
  connectionString: config.databaseUrl,
  // ssl: config.dbSSL ? { rejectUnauthorized: false } : false
  ssl: { rejectUnauthorized: false }  // Supabase requires this
});

pool.on('error', (err) => {
  console.error('Unexpected PG pool error', err);
});

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
