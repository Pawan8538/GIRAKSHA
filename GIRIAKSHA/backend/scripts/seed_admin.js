const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../backend/.env') });
console.log('DB URL loaded:', !!process.env.DATABASE_URL);
const { query } = require('../src/models/db');
const bcrypt = require('bcrypt');

async function seedSuperAdmin() {
    try {
        const email = 'super@test.com';
        const password = 'password123';
        const name = 'Super Admin';
        const phone = '1234567890';

        // 1. Get Role ID
        const roleRes = await query("SELECT id FROM roles WHERE name = 'super_admin'");
        if (roleRes.rows.length === 0) {
            console.error('Super Admin role not found');
            process.exit(1);
        }
        const roleId = roleRes.rows[0].id;

        // 2. Check if user exists
        const userRes = await query("SELECT * FROM users WHERE email = $1", [email]);
        if (userRes.rows.length > 0) {
            console.log('Super Admin already exists');
            process.exit(0);
        }

        // 3. Create User
        const hash = await bcrypt.hash(password, 10);
        await query(
            "INSERT INTO users (role_id, name, email, phone, password_hash) VALUES ($1, $2, $3, $4, $5)",
            [roleId, name, email, phone, hash]
        );
        console.log('Super Admin created successfully');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

seedSuperAdmin();
