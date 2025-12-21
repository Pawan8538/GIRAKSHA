const { query } = require('../src/models/db');
const bcrypt = require('bcrypt');

async function ensureSuperAdmin() {
    try {
        console.log('Checking for Super Admin...');

        // Get super_admin role
        const roleRes = await query(`SELECT id FROM roles WHERE name = 'super_admin'`);
        if (roleRes.rows.length === 0) {
            console.error('Super Admin role not found!');
            process.exit(1);
        }
        const superAdminRoleId = roleRes.rows[0].id;

        // Check if super admin exists
        const userRes = await query(`SELECT * FROM users WHERE role_id = $1`, [superAdminRoleId]);

        if (userRes.rows.length === 0) {
            console.log('No Super Admin found. Creating one...');
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash('admin123', salt);

            await query(
                `INSERT INTO users (role_id, name, phone, password_hash, is_approved, approval_status) 
         VALUES ($1, 'Super Admin', '9999999999', $2, TRUE, 'approved')`,
                [superAdminRoleId, hash]
            );
            console.log('Super Admin created!');
            console.log('Phone: 9999999999');
            console.log('Password: admin123');
        } else {
            console.log('Super Admin exists. Ensuring approval status...');
            const superAdmin = userRes.rows[0];

            await query(
                `UPDATE users 
         SET is_approved = TRUE, approval_status = 'approved' 
         WHERE id = $1`,
                [superAdmin.id]
            );
            console.log('Super Admin approval status updated!');
            console.log('Phone:', superAdmin.phone);
        }

        console.log('✓ Super Admin setup complete');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

ensureSuperAdmin();
