require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function reassignUsers() {
    const client = await pool.connect();
    try {
        console.log('🔄 Reassigning users to Demo Mine...');
        await client.query('BEGIN');

        // 1. Get Demo Mine ID
        const slopeRes = await client.query("SELECT id FROM slopes WHERE name = 'Demo Mine'");
        if (slopeRes.rows.length === 0) {
            throw new Error('Demo Mine not found. Please run reset_mines.js first.');
        }
        const demoMineId = slopeRes.rows[0].id;
        console.log(`📍 Found Demo Mine ID: ${demoMineId}`);

        // 2. Update all users to this mine
        // We exclude Super Admin (role_id 1 usually) if they shouldn't be assigned, 
        // but usually it doesn't hurt. Let's just update everyone for simplicity in this demo environment.
        const updateRes = await client.query(`
            UPDATE users 
            SET slope_id = $1 
            RETURNING id, name, email, role_id
        `, [demoMineId]);

        console.log(`✅ Updated ${updateRes.rowCount} users:`);
        updateRes.rows.forEach(u => {
            console.log(`   - ${u.name} (${u.email}) -> Slope ${demoMineId}`);
        });

        // 3. Also update worker invites
        await client.query('UPDATE worker_invites SET slope_id = $1', [demoMineId]);
        console.log('✅ Updated worker invites.');

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error reassigning users:', error);
    } finally {
        client.release();
        pool.end();
    }
}

reassignUsers();
