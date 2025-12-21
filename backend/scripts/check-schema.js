const { query } = require('../src/models/db');

async function checkSchema() {
    try {
        console.log('Checking tables...');
        const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        const tableNames = tables.rows.map(t => t.table_name);
        console.log('Tables found:', tableNames);

        const requiredTables = ['users', 'roles', 'slopes', 'worker_invites', 'govt_authorities'];
        const missingTables = requiredTables.filter(t => !tableNames.includes(t));

        if (missingTables.length > 0) {
            console.error('MISSING TABLES:', missingTables);
        } else {
            console.log('All required tables exist.');
        }

        if (tableNames.includes('users')) {
            console.log('Checking users columns...');
            const columns = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users'
      `);
            const columnNames = columns.rows.map(c => c.column_name);
            const requiredColumns = ['is_approved', 'approval_status', 'govt_id_url', 'company_id_url', 'department', 'slope_id'];
            const missingColumns = requiredColumns.filter(c => !columnNames.includes(c));

            if (missingColumns.length > 0) {
                console.error('MISSING COLUMNS in users:', missingColumns);
            } else {
                console.log('All required columns in "users" exist.');
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Schema check failed:', err.message);
        process.exit(1);
    }
}

checkSchema();
