const { query } = require('../src/models/db');

async function simpleCheck() {
    try {
        // Count all users
        const count = await query('SELECT COUNT(*) FROM users');
        console.log('Total users:', count.rows[0].count);

        // Show all users with their status
        const users = await query(`
      SELECT id, name, phone, is_approved, approval_status 
      FROM users 
      ORDER BY id
    `);

        console.log('\nAll users:');
        users.rows.forEach(u => {
            console.log(`ID: ${u.id}, Name: ${u.name}, Phone: ${u.phone}`);
            console.log(`  is_approved: ${u.is_approved}, approval_status: ${u.approval_status}`);
        });

        // Count pending
        const pendingCount = await query(`
      SELECT COUNT(*) FROM users WHERE approval_status = 'pending'
    `);
        console.log('\nPending users count:', pendingCount.rows[0].count);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

simpleCheck();
