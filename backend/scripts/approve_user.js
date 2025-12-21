require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function approve() {
    const client = await pool.connect();
    try {
        await client.query("UPDATE users SET is_approved = TRUE, approval_status = 'approved' WHERE email = 'admin1@example.com'");
        console.log('User approved');
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

approve();
