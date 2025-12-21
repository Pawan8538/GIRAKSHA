const { query } = require('../src/models/db');
require('dotenv').config();

async function updateSchema() {
    try {
        console.log('🛠️ Adding super_admin_id to conversations table...');

        // Add super_admin_id column
        await query(`
            ALTER TABLE conversations 
            ADD COLUMN IF NOT EXISTS super_admin_id INTEGER REFERENCES users(id)
        `);
        console.log('✅ Added super_admin_id column');

        // Make gov_user_id and site_admin_id nullable
        await query(`
            ALTER TABLE conversations 
            ALTER COLUMN gov_user_id DROP NOT NULL
        `);
        await query(`
            ALTER TABLE conversations 
            ALTER COLUMN site_admin_id DROP NOT NULL
        `);
        console.log('✅ Made gov_user_id and site_admin_id nullable');

    } catch (error) {
        console.error('❌ Error updating schema:', error);
    } finally {
        process.exit(0);
    }
}

updateSchema();
