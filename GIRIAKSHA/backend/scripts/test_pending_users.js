const { query } = require('../src/models/db');

async function testPendingUsers() {
    try {
        console.log('Testing getPendingUsers query...\n');

        const result = await query(
            `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.approval_status = 'pending' 
       ORDER BY u.created_at DESC`
        );

        console.log('Query result:');
        console.log('Row count:', result.rows.length);
        console.log('\nPending users:');
        result.rows.forEach((user, i) => {
            console.log(`${i + 1}. ${user.name} (${user.phone}) - ${user.role_name} - Status: ${user.approval_status}`);
        });

        console.log('\nFull data:');
        console.log(JSON.stringify(result.rows, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testPendingUsers();
