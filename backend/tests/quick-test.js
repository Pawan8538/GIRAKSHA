/**
 * Quick Integration Test Runner
 * 
 * Simplified test to verify basic integration points
 * Run with: node tests/quick-test.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function quickTest() {
    console.log('\n🚀 Running Quick Integration Tests...\n');

    try {
        // Test 1: Health Check
        console.log('1️⃣  Testing health endpoint...');
        const healthRes = await axios.get('http://localhost:4000/health');
        console.log(`   ✅ Backend is healthy: ${healthRes.data.status}`);

        // Test 2: Login
        console.log('\n2️⃣  Testing login...');
        const loginRes = await axios.post(`${API_BASE}/auth/login`, {
            phone: '9876543210',
            password: '123456'
        });
        const token = loginRes.data.token;
        console.log(`   ✅ Login successful, token received`);

        // Test 3: Get All Users
        console.log('\n3️⃣  Testing /api/admin/users...');
        const usersRes = await axios.get(`${API_BASE}/admin/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const allUsers = usersRes.data.data || [];
        const pendingUsers = allUsers.filter(u => u.approval_status === 'pending' || !u.is_approved);
        console.log(`   ✅ Total users: ${allUsers.length}`);
        console.log(`   ✅ Pending users: ${pendingUsers.length}`);

        // Test 4: Get Pending Users (Problematic endpoint)
        console.log('\n4️⃣  Testing /api/auth/admin/pending-users...');
        const pendingRes = await axios.get(`${API_BASE}/auth/admin/pending-users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const pendingFromEndpoint = pendingRes.data.data || [];
        console.log(`   ✅ Pending users from endpoint: ${pendingFromEndpoint.length}`);

        // Compare
        console.log('\n📊 COMPARISON:');
        console.log(`   /api/admin/users (filtered): ${pendingUsers.length} pending`);
        console.log(`   /api/auth/admin/pending-users: ${pendingFromEndpoint.length} pending`);

        if (pendingUsers.length === pendingFromEndpoint.length) {
            console.log(`   ✅ Match! Both endpoints show same count`);
        } else {
            console.log(`   ❌ MISMATCH! Discrepancy of ${Math.abs(pendingUsers.length - pendingFromEndpoint.length)} users`);
        }

        // Test 5: Alerts
        console.log('\n5️⃣  Testing /api/alerts/all...');
        const alertsRes = await axios.get(`${API_BASE}/alerts/all`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`   ✅ Alerts endpoint working, returned ${alertsRes.data.data?.length || 0} alerts`);

        console.log('\n✅ All tests completed!\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    quickTest();
}

module.exports = { quickTest };
