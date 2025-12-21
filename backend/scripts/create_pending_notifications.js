const { query } = require('../src/models/db');

async function createPendingNotifications() {
    try {
        console.log('Creating notifications for pending users...\n');

        // Get super admin ID
        const superAdminResult = await query(`
      SELECT u.id 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = 'super_admin'
      LIMIT 1
    `);

        if (superAdminResult.rows.length === 0) {
            console.log('No super admin found!');
            process.exit(1);
        }

        const superAdminId = superAdminResult.rows[0].id;
        console.log('Super Admin ID:', superAdminId);

        // Get pending users
        const pendingUsers = await query(`
      SELECT u.id, u.name, r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.approval_status = 'pending'
    `);

        console.log(`Found ${pendingUsers.rows.length} pending users\n`);

        // Create notifications for each pending user
        for (const user of pendingUsers.rows) {
            await query(`
        INSERT INTO notifications (user_id, type, title, body, metadata, is_read)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [
                superAdminId,
                'user_registration',
                'New Registration Request',
                `${user.name} has registered as ${user.role_name.replace('_', ' ')} and is awaiting approval.`,
                JSON.stringify({ userId: user.id, userName: user.name, userRole: user.role_name }),
                false
            ]);

            console.log(`✓ Created notification for ${user.name}`);
        }

        console.log('\n✓ Notifications created! Check your notification bell.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createPendingNotifications();
