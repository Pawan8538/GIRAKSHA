const { query } = require('../src/models/db');

async function fixSchema() {
    try {
        console.log('Checking for approval_status column...');
        try {
            await query(`ALTER TABLE users ADD COLUMN approval_status VARCHAR(50) DEFAULT 'pending'`);
            console.log('Added approval_status column');
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log('approval_status column already exists');
            } else {
                console.error('Error adding approval_status:', e);
            }
        }

        console.log('Checking for is_approved column...');
        try {
            await query(`ALTER TABLE users ADD COLUMN is_approved BOOLEAN DEFAULT FALSE`);
            console.log('Added is_approved column');
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log('is_approved column already exists');
            } else {
                console.error('Error adding is_approved:', e);
            }
        }

        // Update existing users to have default values if null
        await query(`UPDATE users SET approval_status = 'pending' WHERE approval_status IS NULL`);

        // Set super admin as approved
        await query(`UPDATE users SET approval_status = 'approved', is_approved = TRUE 
                 WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin')`);

        console.log('Schema fix completed');
        process.exit(0);
    } catch (error) {
        console.error('Schema fix failed:', error);
        process.exit(1);
    }
}

fixSchema();
