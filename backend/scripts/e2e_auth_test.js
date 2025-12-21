require('dotenv').config();
const { Pool } = require('pg');
const axios = require('axios');
const bcrypt = require('bcrypt');

const API_URL = 'http://localhost:4000/api/auth';
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const CREDENTIALS = {
    superAdmin: { email: 'super@geoguard.com', password: 'admin123', name: 'Super Admin' },
    gov: { email: 'gov_authority@geoguard.com', password: 'gov123', name: 'Gov Authority', phone: '1111111111' },
    siteAdmin: { email: 'site_admin@geoguard.com', password: 'admin123', name: 'Site Admin', phone: '2222222222' },
    worker: { phone: '9999999999', password: 'worker123', name: 'Field Worker' }
};

async function runTest() {
    const client = await pool.connect();
    try {
        console.log('\n🚀 STARTING END-TO-END AUTH TEST 🚀\n');

        // 1. WIPE DATABASE
        console.log('🧹 Wiping Database...');
        await client.query('BEGIN');
        await client.query('DELETE FROM worker_invites');
        await client.query('DELETE FROM govt_authorities');
        await client.query('DELETE FROM users');
        // Note: Slopes are kept or wiped? Let's wipe slopes to be clean, but need to recreate one for Site Admin
        // Actually Site Admin creates a mine.
        await client.query('DELETE FROM slopes WHERE name = \'Test Mine\'');
        await client.query('COMMIT');
        console.log('✅ Database Wiped.\n');

        // 2. SEED SUPER ADMIN
        console.log('🌱 Seeding Super Admin...');
        const roleRes = await client.query("SELECT id FROM roles WHERE name = 'super_admin'");
        const superRole = roleRes.rows[0].id;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(CREDENTIALS.superAdmin.password, salt);
        await client.query(`
            INSERT INTO users (role_id, name, email, phone, password_hash, is_approved, approval_status)
            VALUES ($1, $2, $3, '0000000000', $4, TRUE, 'approved')
        `, [superRole, CREDENTIALS.superAdmin.name, CREDENTIALS.superAdmin.email, hash]);
        console.log('✅ Super Admin Seeded.\n');

        // 3. REGISTER GOV AUTHORITY
        console.log('🏛️ Registering Gov Authority...');
        try {
            await axios.post(`${API_URL}/register/gov`, {
                name: CREDENTIALS.gov.name,
                email: CREDENTIALS.gov.email,
                password: CREDENTIALS.gov.password,
                phone: CREDENTIALS.gov.phone,
                department: 'Disaster Management',
                govt_id_url: 'http://example.com/id.jpg'
            });
            console.log('✅ Gov Authority Registered (Pending).');
        } catch (e) { console.error('❌ Gov Registration Failed:', e.response?.data || e.message); }

        // 4. REGISTER SITE ADMIN
        console.log('🏗️ Registering Site Admin...');
        try {
            await axios.post(`${API_URL}/register/site-admin`, {
                name: CREDENTIALS.siteAdmin.name,
                email: CREDENTIALS.siteAdmin.email,
                password: CREDENTIALS.siteAdmin.password,
                phone: CREDENTIALS.siteAdmin.phone,
                company_id_url: 'http://example.com/company.jpg',
                mine_action: 'create',
                mine_details: {
                    name: 'Test Mine',
                    description: 'E2E Test Mine',
                    lat: 12.9716,
                    lng: 77.5946
                }
            });
            console.log('✅ Site Admin Registered (Pending).');
        } catch (e) { console.error('❌ Site Admin Registration Failed:', e.response?.data || e.message); }

        // 5. LOGIN SUPER ADMIN & APPROVE
        console.log('\n🔐 Logging in Super Admin...');
        // Super admin still uses email/password in this seed, but let's test phone if we seeded it
        // Actually for super admin we seeded '0000000000'
        const superLogin = await axios.post(`${API_URL}/login`, {
            phone: '0000000000',
            password: CREDENTIALS.superAdmin.password
        });
        const superToken = superLogin.data.token;
        console.log('✅ Super Admin Logged In.');

        console.log('📝 Fetching Pending Users...');
        const pendingRes = await axios.get(`${API_URL}/admin/pending-users`, {
            headers: { Authorization: `Bearer ${superToken}` }
        });
        const pendingUsers = pendingRes.data.data;
        console.log(`Found ${pendingUsers.length} pending users.`);

        for (const user of pendingUsers) {
            console.log(`👍 Approving ${user.name} (${user.role_name})...`);
            await axios.post(`${API_URL}/admin/approve-user`, { userId: user.id }, {
                headers: { Authorization: `Bearer ${superToken}` }
            });
        }
        console.log('✅ All Users Approved.\n');

        // 6. LOGIN SITE ADMIN & INVITE WORKER
        console.log('👷 Logging in Site Admin...');
        const adminLogin = await axios.post(`${API_URL}/login`, {
            phone: CREDENTIALS.siteAdmin.phone,
            password: CREDENTIALS.siteAdmin.password
        });
        const adminToken = adminLogin.data.token;
        console.log('✅ Site Admin Logged In.');

        console.log('inviting Worker...');
        await axios.post(`${API_URL}/invite/worker`, {
            phone: CREDENTIALS.worker.phone
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Worker Invited.\n');

        // 7. REGISTER WORKER
        console.log('🛠️ Registering Worker...');
        try {
            await axios.post(`${API_URL}/register/worker`, {
                name: CREDENTIALS.worker.name,
                phone: CREDENTIALS.worker.phone,
                password: CREDENTIALS.worker.password,
                otp: '123456'
            });
            console.log('✅ Worker Registered.');
        } catch (e) { console.error('❌ Worker Registration Failed:', e.response?.data || e.message); }

        // 8. FINAL VERIFICATION
        console.log('\n🔍 Verifying All Logins (Phone Based)...');

        const verifyLogin = async (role, creds, usePhone = true) => {
            try {
                let payload = { password: creds.password };
                if (usePhone && creds.phone) payload.phone = creds.phone;
                else payload.email = creds.email;

                const res = await axios.post(`${API_URL}/login`, payload);
                if (res.data.success) console.log(`✅ ${role}: Login Success`);
                else console.error(`❌ ${role}: Login Failed`);
            } catch (e) {
                console.error(`❌ ${role}: Login Failed (${e.message})`);
            }
        };

        await verifyLogin('Super Admin', { ...CREDENTIALS.superAdmin, phone: '0000000000' });
        await verifyLogin('Gov Authority', CREDENTIALS.gov);
        await verifyLogin('Site Admin', CREDENTIALS.siteAdmin);
        await verifyLogin('Field Worker', CREDENTIALS.worker);

        console.log('\n🎉 TEST COMPLETE 🎉');
        console.log('---------------------------------------------------');
        console.log('HERE ARE THE NEW CREDENTIALS (PHONE LOGIN):');
        console.log('---------------------------------------------------');
        console.log(`1. Super Admin:   0000000000 / ${CREDENTIALS.superAdmin.password}`);
        console.log(`2. Gov Authority: ${CREDENTIALS.gov.phone} / ${CREDENTIALS.gov.password}`);
        console.log(`3. Site Admin:    ${CREDENTIALS.siteAdmin.phone} / ${CREDENTIALS.siteAdmin.password}`);
        console.log(`4. Field Worker:  ${CREDENTIALS.worker.phone} / ${CREDENTIALS.worker.password}`);
        console.log('---------------------------------------------------');

    } catch (error) {
        console.error('❌ Test Script Error:', error.message);
        if (error.response) {
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    } finally {
        client.release();
        pool.end();
    }
}

runTest();
