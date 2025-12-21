const axios = require('axios');

const API_URL = 'http://localhost:4000/api/auth';

async function testEndpoints() {
    console.log('--- Starting Endpoint Tests ---');

    // 1. Test GET /slopes
    try {
        console.log('\n1. Testing GET /slopes...');
        const slopesRes = await axios.get(`${API_URL}/slopes`);
        if (slopesRes.data.success) {
            console.log('✅ GET /slopes successful');
            console.log(`   Found ${slopesRes.data.data.length} slopes`);
        } else {
            console.error('❌ GET /slopes failed:', slopesRes.data);
        }
    } catch (error) {
        console.error('❌ GET /slopes error:', error.message);
        if (error.response) console.error('   Status:', error.response.status);
    }

    // 2. Test POST /login (Super Admin)
    try {
        console.log('\n2. Testing POST /login (Super Admin)...');
        const loginRes = await axios.post(`${API_URL}/login`, {
            email: 'super@geoguard.com',
            password: 'admin123'
        });

        if (loginRes.data.success) {
            console.log('✅ Login successful');
            console.log('   Token received:', loginRes.data.token ? 'Yes' : 'No');
            console.log('   User Role:', loginRes.data.data.role_name);
        } else {
            console.error('❌ Login failed:', loginRes.data);
        }
    } catch (error) {
        console.error('❌ Login error:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }

    console.log('\n--- Tests Completed ---');
}

testEndpoints();
