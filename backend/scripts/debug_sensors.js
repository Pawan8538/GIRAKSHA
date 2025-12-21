const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

async function debugSensors() {
    try {
        console.log('--- Debugging Sensors API ---');

        // 1. Login as Gov Authority
        console.log('\n1. Logging in as Gov Authority (gov@test.com)...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'gov@test.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        const user = loginRes.data.data;
        console.log('✅ Logged In. User:', user.email, 'Role:', user.role_name, 'SlopeID:', user.slope_id);

        // 2. Fetch Sensors (without slopeId if user.slope_id is null)
        console.log('\n2. Fetching Sensors...');
        const params = user.slope_id ? { slopeId: user.slope_id } : {};
        console.log('Params:', params);

        const sensorsRes = await axios.get(`${API_URL}/sensors`, {
            headers: { Authorization: `Bearer ${token}` },
            params
        });

        console.log('✅ Sensors Response Status:', sensorsRes.status);
        console.log('✅ Sensors Data Length:', sensorsRes.data.data?.length);
        if (sensorsRes.data.data?.length > 0) {
            console.log('Sample Sensor:', sensorsRes.data.data[0]);
        } else {
            console.log('⚠️ No sensors found.');
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

debugSensors();
