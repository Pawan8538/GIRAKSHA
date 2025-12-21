const { query } = require('../src/models/db');

async function checkPending() {
  try {
    console.log('--- Checking Last 10 Users ---');
    const res = await query(`
      SELECT id, name, email, role_id, approval_status, is_approved 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    console.log(res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkPending();
