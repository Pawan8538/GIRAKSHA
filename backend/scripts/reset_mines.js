require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function resetMines() {
    const client = await pool.connect();
    try {
        console.log('🔄 Starting Mine Reset...');
        await client.query('BEGIN');

        // 1. Unlink users from slopes to avoid FK violations
        console.log('Unlinking users from slopes...');
        await client.query('UPDATE users SET slope_id = NULL');
        await client.query('UPDATE worker_invites SET slope_id = NULL');

        // 2. Delete all slopes
        console.log('Deleting all slopes...');
        await client.query('DELETE FROM slopes');

        // 3. Create Demo Mine
        console.log('Creating Demo Mine...');
        const res = await client.query(`
            INSERT INTO slopes (name, description, location, risk_level)
            VALUES ($1, $2, ST_SetSRID(ST_MakePoint($4, $3), 4326), 'low')
            RETURNING id, name
        `, ['Demo Mine', 'Official Demo Mine for Testing', 11.1022, 79.1564]);

        console.log(`✅ Created: ${res.rows[0].name} (ID: ${res.rows[0].id})`);

        await client.query('COMMIT');
        console.log('🎉 Mine Reset Complete.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error resetting mines:', error);
    } finally {
        client.release();
        pool.end();
    }
}

resetMines();
