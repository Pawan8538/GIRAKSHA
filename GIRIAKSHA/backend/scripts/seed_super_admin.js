require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seed() {
    const client = await pool.connect();
    try {
        console.log('--- Seeding Super Admin ---');

        // Get Role ID
        const roleRes = await client.query("SELECT id FROM roles WHERE name = 'super_admin'");
        if (roleRes.rows.length === 0) {
            console.error('❌ SUPER_ADMIN role not found');
            return;
        }
        const roleId = roleRes.rows[0].id;

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('admin123', salt);

        // Create User
        const res = await client.query(`
            INSERT INTO users (role_id, name, email, phone, password_hash, is_approved, approval_status)
            VALUES ($1, 'Super Admin', 'super@geoguard.com', '0000000000', $2, TRUE, 'approved')
            RETURNING *
        `, [roleId, hash]);

        console.log('✅ Super Admin created:', res.rows[0].email);

    } catch (error) {
        console.error('❌ Failed:', error);
    } finally {
        client.release();
        pool.end();
    }
}

seed();
