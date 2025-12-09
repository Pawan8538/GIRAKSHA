require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function resetPassword() {
    const client = await pool.connect();
    try {
        console.log('🔐 Resetting Super Admin Password...');

        const email = 'super@geoguard.com';
        const newPassword = 'admin123';

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        const res = await client.query(
            "UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email",
            [hash, email]
        );

        if (res.rowCount > 0) {
            console.log(`✅ Password reset for ${res.rows[0].email}`);
            console.log(`🔑 New Password: ${newPassword}`);
        } else {
            console.error('❌ Super Admin user not found.');
        }

    } catch (error) {
        console.error('❌ Error resetting password:', error);
    } finally {
        client.release();
        pool.end();
    }
}

resetPassword();
