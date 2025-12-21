const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });
const { query } = require('../backend/src/models/db');

async function checkUsers() {
    try {
        const roles = await query('SELECT * FROM roles');
        console.log('ROLES:', roles.rows);

        const users = await query('SELECT id, name, email, role_id FROM users');
        console.log('USERS:', users.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
