const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

async function verifyFlow() {
    try {
        console.log('--- Starting Alerts Verification Flow ---');

        // 1. Login as Gov Authority
        console.log('\n1. Logging in as Gov Authority (gov@test.com)...');
        const govLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'gov@test.com',
            password: 'password123'
        });
        const govToken = govLogin.data.token;
        console.log('✅ Gov Logged In');

        // 2. Post Advisory
        const advisoryTitle = `Test Advisory ${Date.now()}`;
        console.log(`\n2. Posting Advisory: "${advisoryTitle}"...`);
        await axios.post(`${API_URL}/alerts/advisory`, {
            title: advisoryTitle,
            message: 'This is a test advisory from the automated verification script.',
            severity: 'warning'
        }, {
            headers: { Authorization: `Bearer ${govToken}` }
        });
        console.log('✅ Advisory Posted');

        // 3. Login as Field Worker
        console.log('\n3. Logging in as Field Worker (worker@test.com)...');
        const workerLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'worker@test.com',
            password: 'password123'
        });
        const workerToken = workerLogin.data.token;
        console.log('✅ Field Worker Logged In');

        // 4. Fetch Alerts
        console.log('\n4. Fetching Alerts as Field Worker...');
        const alertsRes = await axios.get(`${API_URL}/alerts/all`, {
            headers: { Authorization: `Bearer ${workerToken}` }
        });

        const alerts = alertsRes.data.data;
        const found = alerts.find(a => a.title === advisoryTitle);

        if (found) {
            console.log('✅ SUCCESS: Advisory found in Field Worker alerts list!');
            console.log('Alert Details:', found);
        } else {
            console.error('❌ FAILURE: Advisory NOT found in Field Worker alerts list.');
            console.log('Received Alerts:', alerts.map(a => a.title));
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Error during verification:', error.response?.data || error.message);
        process.exit(1);
    }
}

verifyFlow();
