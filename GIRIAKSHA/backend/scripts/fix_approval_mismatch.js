const { query } = require('../src/models/db');

async function fixApprovalStatus() {
    try {
        console.log('Fixing approval status mismatch...\n');

        // Update users where is_approved is FALSE but approval_status is 'approved'
        const result = await query(`
      UPDATE users 
      SET approval_status = 'pending'
      WHERE is_approved = FALSE 
      AND approval_status != 'pending'
      RETURNING id, name, phone, is_approved, approval_status
    `);

        console.log(`Updated ${result.rowCount} users to pending status:\n`);
        result.rows.forEach(u => {
            console.log(`- ${u.name} (${u.phone})`);
        });

        // Verify pending users now
        console.log('\n--------------------------------');
        console.log('Verifying pending users:');
        const pending = await query(`
      SELECT u.id, u.name, u.phone, r.name as role_name, u.approval_status
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.approval_status = 'pending'
      ORDER BY u.created_at DESC
    `);

        console.log(`\nPending users count: ${pending.rows.length}\n`);
        pending.rows.forEach((u, i) => {
            console.log(`${i + 1}. ${u.name} (${u.phone}) - ${u.role_name}`);
        });

        console.log('\n✓ Fix complete! Refresh your dashboard.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixApprovalStatus();
