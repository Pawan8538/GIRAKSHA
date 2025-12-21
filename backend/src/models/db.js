const { Pool } = require('pg');
const config = require('../config/env');

const pool = new Pool({
  connectionString: config.databaseUrl,
  // ssl: config.dbSSL ? { rejectUnauthorized: false } : false
  ssl: { rejectUnauthorized: false },
  max: 10,                            // Reduced to 10 to prevent exhausting remote DB connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,     // Increased to 20s to be very tolerant of lag
});

// CRASH PREVENTION:
// This handler catches background connection errors so they don't crash the server.
pool.on('error', (err) => {
  console.error('Unexpected PG pool error', err.message);
  // Do NOT throw or exit here. The pool will recover automatically.
});

// RETRY LOGIC:
// Wraps the database query to retry once if the connection was dropped.
const query = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (error) {
    // Check for connection loss errors (XX000 is common for Supabase pooler resets)
    if (error.code === 'XX000' || error.message.includes('DbHandler exited') || error.code === '57P01') {
      console.warn('⚠️ Database connection reset. Retrying query...');
      return await pool.query(text, params);
    }
    // If it's a real error (like bad SQL), throw it normally
    throw error;
  }
};

module.exports = { pool, query };
