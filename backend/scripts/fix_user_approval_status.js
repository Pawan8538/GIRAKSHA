const { query } = require('../src/models/db');

async function checkAndFixUsers() {
    try {
        console.log('Checking all users...\n');

        // Check all users
        const allUsers = await query(
            `SELECT u.id, u.name, u.phone, r.name as role_name, u.is_approved, u.approval_status 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       ORDER BY u.created_at DESC`
        );

        console.log('All users in database:');
        allUsers.rows.forEach((user, i) => {
            console.log(`${i + 1}. ${user.name} (${user.phone}) - ${user.role_name}`);
            console.log(`   is_approved: ${user.is_approved}, approval_status: ${user.approval_status}`);
        });

        console.log('\n---\nFixing NULL approval_status values...\n');

        // Fix users with NULL approval_status
        await query(`
      UPDATE users 
      SET approval_status = CASE 
        WHEN is_approved = TRUE THEN 'approved'
        ELSE 'pending'
      END
      WHERE approval_status IS NULL
    `);

        // Also ensure is_approved is set
        await query(`
      UPDATE users 
      SET is_approved = FALSE
      WHERE is_approved IS NULL
    `);

        console.log('✓ Fixed NULL values\n');

        // Check pending users again
        const pending = await query(
            `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.approval_status = 'pending' 
       ORDER BY u.created_at DESC`
        );

        console.log('Pending users after fix:');
        console.log('Count:', pending.rows.length);
        pending.rows.forEach((user, i) => {
            console.log(`${i + 1}. ${user.name} (${user.phone}) - ${user.role_name}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAndFixUsers();
