require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSuperAdmin() {
    const client = await pool.connect();
    try {
        console.log('🔍 Checking Super Admin...');

        // 1. Get Super Admin Role ID
        const roleRes = await client.query("SELECT id FROM roles WHERE name = 'super_admin'");
        if (roleRes.rows.length === 0) {
            console.error('❌ Role "super_admin" not found!');
            return;
        }
        const roleId = roleRes.rows[0].id;
        console.log(`ℹ️ Super Admin Role ID: ${roleId}`);

        // 2. Find User with this Role
        const userRes = await client.query("SELECT * FROM users WHERE role_id = $1", [roleId]);

        if (userRes.rows.length === 0) {
            console.log('❌ No Super Admin user found.');
        } else {
            userRes.rows.forEach(u => {
                console.log(`✅ Found Super Admin:`);
                console.log(`   - ID: ${u.id}`);
                console.log(`   - Name: ${u.name}`);
                console.log(`   - Email: ${u.email}`);
                console.log(`   - Phone: ${u.phone}`);
                console.log(`   - Approved: ${u.is_approved}`);
                console.log(`   - Slope ID: ${u.slope_id}`);
            });
        }

    } catch (error) {
        console.error('❌ Error checking super admin:', error);
    } finally {
        client.release();
        pool.end();
    }
}

checkSuperAdmin();
