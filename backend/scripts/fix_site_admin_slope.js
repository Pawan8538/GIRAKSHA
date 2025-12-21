const { query } = require('../src/models/db');
require('dotenv').config();

async function fixSiteAdmin() {
    try {
        console.log('🔍 Finding available slopes (mines)...');
        const slopesRes = await query("SELECT * FROM slopes");

        let slope;
        if (slopesRes.rows.length === 0) {
            console.log('⚠️ No slopes found! Creating default mine...');
            const newSlope = await query(`
                INSERT INTO slopes (name, description, location)
                VALUES ('Limestone Mine Alpha', 'Main mining site', ST_SetSRID(ST_MakePoint(79.156389, 11.102222), 4326))
                RETURNING *
            `);
            slope = newSlope.rows[0];
        } else {
            // Find Limestone Mine Alpha or use the first one
            slope = slopesRes.rows.find(s => s.name === 'Limestone Mine Alpha') || slopesRes.rows[0];
        }

        console.log(`✅ Using Default Mine: ${slope.name} (ID: ${slope.id})`);

        console.log('🔍 Finding users without a mine assignment...');
        const usersRes = await query("SELECT id, name, role_id FROM users WHERE slope_id IS NULL AND role_id != (SELECT id FROM roles WHERE name = 'super_admin')");

        if (usersRes.rows.length === 0) {
            console.log('✅ All valid users already have a mine assigned. No action needed.');
        } else {
            console.log(`🛠️ Found ${usersRes.rows.length} users without a mine. Assigning default mine...`);

            const updateRes = await query(
                "UPDATE users SET slope_id = $1 WHERE slope_id IS NULL AND role_id != (SELECT id FROM roles WHERE name = 'super_admin') RETURNING id, name",
                [slope.id]
            );

            console.log(`🎉 Successfully assigned ${slope.name} to ${updateRes.rows.length} users:`);
            updateRes.rows.forEach(u => console.log(`   - ${u.name} (ID: ${u.id})`));
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

fixSiteAdmin();
