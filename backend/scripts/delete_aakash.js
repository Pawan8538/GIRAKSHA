require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function deleteUser() {
    const client = await pool.connect();
    try {
        console.log('🗑️ Deleting user "Aakash"...');
        const res = await client.query("DELETE FROM users WHERE name = 'Aakash' RETURNING *");
        if (res.rowCount > 0) {
            console.log(`✅ Deleted user: ${res.rows[0].name} (ID: ${res.rows[0].id})`);
        } else {
            console.log('⚠️ User "Aakash" not found.');
        }
    } catch (error) {
        console.error('❌ Error deleting user:', error);
    } finally {
        client.release();
        pool.end();
    }
}

deleteUser();
