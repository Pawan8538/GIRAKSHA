const { query } = require('../src/models/db');
require('dotenv').config();

async function renameMine() {
    try {
        console.log('🔍 Renaming mine ID 1 to "Limestone Mine Alpha"...');

        const res = await query(
            "UPDATE slopes SET name = 'Limestone Mine Alpha', description = 'Main mining site' WHERE id = 1 RETURNING *"
        );

        if (res.rows.length > 0) {
            console.log('✅ Successfully renamed mine:', res.rows[0]);
        } else {
            console.error('❌ Mine ID 1 not found!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

renameMine();
