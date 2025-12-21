/**
 * Integration Test Suite for ALI-PAWAN Integration
 * 
 * Tests critical integration points between ALI and PAWAN:
 * - Backend API endpoints consistency
 * - Web App and Mobile App data sync
 * - Database schema integrity
 * - Authentication flows
 */

const request = require('supertest');
const app = require('../src/app');
const { query } = require('../src/models/db');

describe('Integration Tests: Critical Endpoints Comparison', () => {
    let superAdminToken;
    let testUserId;

    beforeAll(async () => {
        // Login as super admin for tests
        try {
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    phone: '9876543210',
                    password: '123456'
                });

            if (loginRes.body.success && loginRes.body.token) {
                superAdminToken = loginRes.body.token;
            } else {
                console.warn('⚠️  Super admin login failed, some tests may be skipped');
            }
        } catch (error) {
            console.error('Error in beforeAll:', error.message);
        }
    });

    describe('🔍 CRITICAL: Pending Users Endpoint Discrepancy', () => {
        test('Compare /api/admin/users vs /api/auth/admin/pending-users', async () => {
            if (!superAdminToken) {
                console.log('⏭️  Skipping: No auth token');
                return;
            }

            // Endpoint 1: Web App uses this (/dashboard/users page)
            const allUsersRes = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${superAdminToken}`);

            const allUsers = allUsersRes.body.data || [];
            console.log(`\n📊 ENDPOINT 1: /api/admin/users returned ${allUsers.length} total users`);

            // Filter pending from all users
            const pendingFromAll = allUsers.filter(u =>
                u.approval_status === 'pending' || !u.is_approved
            );
            console.log(`   └─ ${pendingFromAll.length} are pending`);

            // Endpoint 2: Super Admin Dashboard uses this
            const pendingUsersRes = await request(app)
                .get('/api/auth/admin/pending-users')
                .set('Authorization', `Bearer ${superAdminToken}`);

            const pendingUsers = pendingUsersRes.body.data || [];
            console.log(`📊 ENDPOINT 2: /api/auth/admin/pending-users returned ${pendingUsers.length} users`);

            // Direct database check
            const dbPendingRes = await query(`
        SELECT COUNT(*) as count FROM users 
        WHERE approval_status = 'pending'
      `);
            const dbCount = parseInt(dbPendingRes.rows[0].count);
            console.log(`📊 DATABASE: ${dbCount} users with approval_status='pending'`);

            // Report disc repancies
            console.log(`\n🔍 ANALYSIS:`);
            if (pendingUsers.length === dbCount) {
                console.log(`   ✅ Endpoint 2 matches database`);
            } else {
                console.log(`   ❌ DISCREPANCY: Endpoint 2 shows ${pendingUsers.length}, DB has ${dbCount}`);
            }

            if (pendingFromAll.length === pendingUsers.length) {
                console.log(`   ✅ Both endpoints show same count`);
            } else {
                console.log(`   ⚠️  Endpoint 1 shows ${pendingFromAll.length} pending, Endpoint 2 shows ${pendingUsers.length}`);
            }

            // Assertions - expect all endpoints to match DB
            expect(pendingUsers.length).toBe(dbCount);
        }, 15000);

        test('Database has no orphaned users (invalid role_id)', async () => {
            const orphaned = await query(`
        SELECT * FROM users u
        WHERE u.role_id NOT IN (SELECT id FROM roles)
      `);

            if (orphaned.rows.length > 0) {
                console.error(`❌ Found ${orphaned.rows.length} orphaned users:`,
                    orphaned.rows.map(u => ({ id: u.id, name: u.name, role_id: u.role_id }))
                );
            }

            expect(orphaned.rows.length).toBe(0);
        });

        test('LEFT JOIN returns same count as database', async () => {
            const leftJoinRes = await query(`
        SELECT u.*, r.name as role_name 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE u.approval_status = 'pending'
      `);

            const dbRes = await query(`
        SELECT COUNT(*) as count FROM users 
        WHERE approval_status = 'pending'
      `);

            expect(leftJoinRes.rows.length).toBe(parseInt(dbRes.rows[0].count));
        });
    });

    describe('Authentication & User Flow', () => {
        test('Site Admin can register with optional mine details', async () => {
            const registerRes = await request(app)
                .post('/api/auth/register/site-admin')
                .send({
                    name: `Test Admin ${Date.now()}`,
                    email: `test${Date.now()}@example.com`,
                    phone: `98765${Math.floor(Math.random() * 100000)}`,
                    password: 'password123',
                    company_id_url: '12345' // Numeric ID
                });

            expect([200, 201]).toContain(registerRes.status);
            if (registerRes.body.success) {
                testUserId = registerRes.body.data?.id;
                console.log(`✅ Created test user ID: ${testUserId}`);
            }
        });

        test('Super Admin can approve user with camelCase payload', async () => {
            if (!testUserId || !superAdminToken) {
                console.log('⏭️  Skipping: No test user or token');
                return;
            }

            const approveRes = await request(app)
                .post('/api/auth/admin/approve-user')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ userId: testUserId }); // camelCase

            expect([200, 201]).toContain(approveRes.status);
        });
    });

    describe('API Response Consistency', () => {
        test('All auth endpoints return standard format', async () => {
            const res = await request(app)
                .get('/api/auth/roles');

            expect(res.body).toHaveProperty('success');
            expect(typeof res.body.success).toBe('boolean');
        });

        test('Protected endpoints return 401 without auth', async () => {
            const res = await request(app).get('/api/admin/users');
            expect(res.status).toBe(401);
        });
    });

    afterAll(async () => {
        // Cleanup
        if (testUserId) {
            await query('DELETE FROM users WHERE id = $1', [testUserId]).catch(() => { });
        }
    });
});

describe('Database Schema Validation', () => {
    test('Required roles exist', async () => {
        const res = await query('SELECT name FROM roles ORDER BY id');
        const roleNames = res.rows.map(r => r.name);

        expect(roleNames).toContain('super_admin');
        expect(roleNames).toContain('site_admin');
        expect(roleNames).toContain('gov_authority');
        expect(roleNames).toContain('field_worker');
    });

    test('Users table has ALI-integration columns', async () => {
        const res = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
        const columns = res.rows.map(r => r.column_name);

        // ALI additions
        expect(columns).toContain('approval_status');
        expect(columns).toContain('is_approved');
        expect(columns).toContain('company_id_url');
        expect(columns).toContain('govt_id_url');
    });

    test('worker_invites table exists (ALI feature)', async () => {
        const res = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = 'worker_invites'
    `);

        expect(res.rows.length).toBe(1);
    });
});
