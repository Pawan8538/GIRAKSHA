const { query } = require('../src/models/db');

async function verifyDatabase() {
    try {
        console.log('=== VERIFYING DATABASE CONNECTION ===\n');

        // Test connection
        console.log('1. Testing connection...');
        await query('SELECT NOW()');
        console.log('✓ Connection successful\n');

        // Check if tables exist
        console.log('2. Checking if tables exist...');
        const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'roles', 'slopes')
      ORDER BY table_name
    `);
        console.log('Tables found:', tables.rows.map(r => r.table_name).join(', '));

        if (tables.rows.length === 0) {
            console.log('\n❌ NO TABLES FOUND! You need to upload the schema to Supabase.');
            process.exit(1);
        }
        console.log('✓ Tables exist\n');

        // Check roles
        console.log('3. Checking roles...');
        const roles = await query('SELECT * FROM roles ORDER BY id');
        console.log('Roles:', roles.rows.map(r => r.name).join(', '));
        console.log('✓ Roles exist\n');

        // Check all users
        console.log('4. Checking all users...');
        const allUsers = await query(`
      SELECT u.id, u.name, u.phone, r.name as role_name, 
             u.is_approved, u.approval_status
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `);

        console.log(`Total users: ${allUsers.rows.length}\n`);

        if (allUsers.rows.length === 0) {
            console.log('❌ NO USERS IN DATABASE!');
            console.log('You need to register some users or run ensure_super_admin.js\n');
        } else {
            console.log('Users in database:');
            allUsers.rows.forEach((user, i) => {
                console.log(`${i + 1}. ${user.name} (${user.phone})`);
                console.log(`   Role: ${user.role_name || 'NULL'}`);
                console.log(`   is_approved: ${user.is_approved}, approval_status: ${user.approval_status}`);
            });
        }

        // Check pending users
        console.log('\n5. Checking pending users query...');
        const pending = await query(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.approval_status = 'pending' 
      ORDER BY u.created_at DESC
    `);

        console.log(`Pending users: ${pending.rows.length}`);
        if (pending.rows.length > 0) {
            pending.rows.forEach((user, i) => {
                console.log(`${i + 1}. ${user.name} (${user.phone}) - ${user.role_name}`);
            });
        } else {
            console.log('No pending users found.');
        }

        console.log('\n=== VERIFICATION COMPLETE ===');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    }
}

verifyDatabase();
