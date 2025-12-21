const { query } = require('../src/models/db');

async function auditPendingUsers() {
    try {
        console.log('\n==============================================');
        console.log('DATABASE AUDIT: Pending Users');
        console.log('==============================================\n');

        // 1. Count all pending users
        const allPending = await query(`
      SELECT COUNT(*) as count FROM users WHERE approval_status = 'pending'
    `);
        console.log(`✓ Total Pending Users in DB: ${allPending.rows[0].count}`);

        // 2. List all pending users with their roles
        const pendingDetails = await query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.phone,
        u.role_id, 
        r.name as role_name,
        u.approval_status,
        u.created_at
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.approval_status = 'pending'
      ORDER BY u.created_at DESC
    `);

        console.log(`\n✓ Pending Users Details:\n`);
        pendingDetails.rows.forEach((user, index) => {
            console.log(`${index + 1}. ID: ${user.id}, Name: ${user.name}, Role: ${user.role_name || 'NULL'}, Email: ${user.email}`);
        });

        // 3. Check for orphaned users (role_id not in roles table)
        const orphaned = await query(`
      SELECT u.* 
      FROM users u 
      WHERE u.role_id NOT IN (SELECT id FROM roles)
      AND u.approval_status = 'pending'
    `);

        if (orphaned.rows.length > 0) {
            console.log(`\n⚠️  WARNING: Found ${orphaned.rows.length} orphaned users (invalid role_id):`);
            orphaned.rows.forEach(user => {
                console.log(`   - ID: ${user.id}, Name: ${user.name}, Role ID: ${user.role_id}`);
            });
        }

        // 4. Check for NULL role_id
        const nullRole = await query(`
      SELECT * FROM users 
      WHERE role_id IS NULL 
      AND approval_status = 'pending'
    `);

        if (nullRole.rows.length > 0) {
            console.log(`\n⚠️  WARNING: Found ${nullRole.rows.length} users with NULL role_id:`);
            nullRole.rows.forEach(user => {
                console.log(`   - ID: ${user.id}, Name: ${user.name}`);
            });
        }

        // 5. Verify roles table
        const roles = await query(`SELECT * FROM roles ORDER BY id`);
        console.log(`\n✓ Available Roles:`);
        roles.rows.forEach(role => {
            console.log(`   - ID: ${role.id}, Name: ${role.name}`);
        });

        // 6. Test the actual query used by backend
        const backendQuery = await query(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.approval_status = 'pending' 
      ORDER BY u.created_at DESC
    `);

        console.log(`\n✓ Backend Query Returns: ${backendQuery.rows.length} users`);

        if (backendQuery.rows.length !== allPending.rows[0].count) {
            console.log(`\n🔴 DISCREPANCY DETECTED!`);
            console.log(`   Expected: ${allPending.rows[0].count}`);
            console.log(`   Got: ${backendQuery.rows.length}`);
        } else {
            console.log(`\n✅ Query is working correctly!`);
        }

        console.log('\n==============================================\n');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Error:', err.message);
        process.exit(1);
    }
}

auditPendingUsers();
