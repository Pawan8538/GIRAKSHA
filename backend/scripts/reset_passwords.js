const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { query } = require('../src/models/db');
const bcrypt = require('bcrypt');

async function resetPasswords() {
    try {
        const hash = await bcrypt.hash('password123', 10);

        await query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'gov@test.com']);
        await query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'worker@test.com']);

        console.log('Passwords reset to "password123" for gov@test.com and worker@test.com');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

resetPasswords();
