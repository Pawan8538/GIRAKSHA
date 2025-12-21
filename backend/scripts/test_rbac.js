const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

const roles = [
    { name: 'Super Admin', roleId: 4, email: 'super@test.com', password: 'password123', expectedAccess: true },
    { name: 'Site Admin', roleId: 2, email: 'site@test.com', password: 'password123', expectedAccess: true }, // Site admin can list users? No, strictly restricted in my list. Let's check admin.routes.js. 
    // Wait, admin.routes.js says: router.get('/users', ...adminOnly, adminController.listUsers);
    // adminOnly = [requireAuth, requireRole('SITE_ADMIN', 'SUPER_ADMIN')];
    // So Site Admin CAN list users.
    { name: 'Field Worker', roleId: 1, email: 'worker@test.com', password: 'password123', expectedAccess: false },
    { name: 'Gov Authority', roleId: 3, email: 'gov@test.com', password: 'password123', expectedAccess: false }
];

async function testRBAC() {
    console.log('🚀 Starting RBAC Backend Test...\n');

    for (const role of roles) {
        console.log(`Testing Role: ${role.name}`);

        // 1. Register (or Login if exists)
        let token;
        try {
            try {
                // Try registering
                if (role.name === 'Super Admin') {
                    // Super Admin needs special endpoint and likely an existing admin token, 
                    // but for the FIRST super admin, the backend allows it if totalUsers=0.
                    // However, since other users exist now, we can't create one easily via public API.
                    // We will skip registration and assume it exists or try to login.
                    console.log(`  ℹ️  Skipping public register for Super Admin`);
                } else {
                    await axios.post(`${API_URL}/auth/register`, {
                        name: role.name,
                        email: role.email,
                        phone: '1234567890',
                        password: role.password,
                        roleId: role.roleId
                    });
                    console.log(`  ✅ Registered`);
                }
            } catch (e) {
                if (e.response?.status === 409) {
                    console.log(`  ℹ️  User exists, logging in...`);
                } else {
                    console.error(`  ❌ Registration failed: ${e.message}`);
                }
            }
        } catch (e) {
            // This outer catch block will now only catch errors from the inner try block
            // if they are not caught by the inner catch block (e.g., non-409 errors).
            // However, the inner catch block handles all errors, so this outer one might be redundant now.
            // Keeping it for now as per the instruction's implied structure.
            console.error(`  ❌ Unexpected error during registration phase: ${e.message}`);
        }


        // 2. Login
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: role.email,
                password: role.password
            });
            token = loginRes.data.token;
            console.log(`  ✅ Logged in (Token received)`);
        } catch (e) {
            console.error(`  ❌ Login failed: ${e.message}`);
            continue;
        }

        // 3. Test Protected Route (List Users - Restricted to Admin/SuperAdmin)
        try {
            await axios.get(`${API_URL}/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (role.expectedAccess) {
                console.log(`  ✅ Access Granted to /admin/users (Expected: YES)`);
            } else {
                console.error(`  ❌ Access Granted to /admin/users (Expected: NO) - SECURITY FAIL`);
            }
        } catch (e) {
            if (e.response?.status === 403) {
                if (!role.expectedAccess) {
                    console.log(`  ✅ Access Denied to /admin/users (Expected: NO)`);
                } else {
                    console.error(`  ❌ Access Denied to /admin/users (Expected: YES) - PERMISSION FAIL`);
                }
            } else {
                console.error(`  ❌ Request failed with ${e.response?.status}: ${e.message}`);
            }
        }
        console.log('-----------------------------------');
    }
}

testRBAC();
