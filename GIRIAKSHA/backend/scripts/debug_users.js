const { query } = require('../src/models/db');

async function checkSpecificUsers() {
    try {
        console.log('Checking specific users...\n');

        const phones = ['3333333333', '1111111111', '2222222222', '1234567890'];

        const result = await query(`
      SELECT id, name, phone, role_id, is_approved, approval_status 
      FROM users 
      WHERE phone = ANY($1)
    `, [phones]);

        console.log('User Status:');
        result.rows.forEach(u => {
            console.log(`\nName: ${u.name}`);
            console.log(`Phone: ${u.phone}`);
            console.log(`is_approved: ${u.is_approved} (${typeof u.is_approved})`);
            console.log(`approval_status: '${u.approval_status}'`);
        });

        console.log('\n--------------------------------');
        console.log('Testing getPendingUsers query again:');
        const pending = await query(`
      SELECT * FROM users WHERE approval_status = 'pending'
    `);
        console.log('Pending count:', pending.rows.length);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSpecificUsers();
