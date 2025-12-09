const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';
const TEST_USER = {
    name: 'Verification Bot',
    email: `verify_${Date.now()}@example.com`,
    password: 'password123',
    phone: '1234567890',
    roleId: 2 // Site Admin (needed for demo-data endpoint)
};

async function runVerification() {
    console.log('🚀 Starting System Verification...');
    let token;

    try {
        // 1. Register
        console.log('\n1️⃣  Testing Registration...');
        const regRes = await axios.post(`${BASE_URL}/auth/register`, TEST_USER);
        if (regRes.data.success) {
            console.log('✅ Registration successful');
        } else {
            throw new Error('Registration failed');
        }

        // 2. Login
        console.log('\n2️⃣  Testing Login...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        if (loginRes.data.success) {
            token = loginRes.data.token;
            console.log('✅ Login successful');
        } else {
            throw new Error('Login failed');
        }

        const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

        // 3. Generate Demo Data
        console.log('\n3️⃣  Testing Demo Data Generation...');
        const demoRes = await axios.post(`${BASE_URL}/admin/demo-data`, {}, authHeaders);
        if (demoRes.data.success) {
            console.log(`✅ Demo data generated (${demoRes.data.data.length} readings)`);
        } else {
            throw new Error('Demo data generation failed');
        }

        // 4. Fetch Sensors
        console.log('\n4️⃣  Testing Sensor Retrieval...');
        const sensorsRes = await axios.get(`${BASE_URL}/sensors`, authHeaders);
        if (sensorsRes.data.success && sensorsRes.data.data.length > 0) {
            console.log(`✅ Found ${sensorsRes.data.data.length} sensors`);
            const sensorId = sensorsRes.data.data[0].id;

            // 5. Fetch Readings
            console.log('\n5️⃣  Testing Sensor Readings...');
            const readingsRes = await axios.get(`${BASE_URL}/sensors/${sensorId}/readings`, authHeaders);
            if (readingsRes.data.success && readingsRes.data.data.length > 0) {
                console.log(`✅ Retrieved readings for sensor ${sensorId}`);
            } else {
                throw new Error('No readings found');
            }
        } else {
            throw new Error('No sensors found');
        }

        // 6. Test ML Prediction
        console.log('\n6️⃣  Testing ML Prediction...');
        const predictRes = await axios.post(`${BASE_URL}/ml/predict`, {
            slopeId: '1',
            sensorData: {
                disp_last: 0.5,
                pore_kpa: 15.0,
                vibration_g: 0.01,
                precip_mm_1h: 5.0
            }
        }, authHeaders);

        if (predictRes.data.ok) {
            console.log(`✅ ML Prediction received: Risk Level = ${predictRes.data.data.risk_level}`);
        } else {
            throw new Error('ML Prediction failed');
        }

        console.log('\n🎉 SYSTEM VERIFICATION COMPLETE: ALL TESTS PASSED');

    } catch (error) {
        console.error('\n❌ Verification Failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

runVerification();
