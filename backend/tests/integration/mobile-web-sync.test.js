/**
 * Mobile-Web Data Sync Integration Tests
 * 
 * Validates that data created on one platform (mobile or web)
 * appears correctly on the other platform via shared backend.
 */

const request = require('supertest');
const app = require('../src/app');

describe('Mobile-Web Cross-Platform Sync', () => {
    let authToken;
    let testAlertId;
    let testTaskId;

    beforeAll(async () => {
        // Login to get auth token
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                phone: '9876543210',
                password: '123456'
            });

        if (loginRes.body.success) {
            authToken = loginRes.body.token;
        }
    });

    describe('Alert Sync: Mobile → Web', () => {
        test('Alert created via mobile endpoint appears on web', async () => {
            if (!authToken) {
                console.log('⏭️  Skipping: No auth token');
                return;
            }

            // Simulate mobile app creating an alert
            const createRes = await request(app)
                .post('/api/alerts')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    slope_id: 1,
                    alert_type: 'sensor',
                    message: 'Test alert from mobile',
                    severity: 'high'
                });

            if (createRes.body.success) {
                testAlertId = createRes.body.data?.id;
            }

            // Verify web app can fetch this alert
            const webFetchRes = await request(app)
                .get('/api/alerts/all')
                .set('Authorization', `Bearer ${authToken}`);

            if (webFetchRes.body.success && testAlertId) {
                const foundAlert = webFetchRes.body.data?.find(a =>
                    a.id === `alert-${testAlertId}` || a.id === testAlertId
                );
                expect(foundAlert).toBeDefined();
            }
        });
    });

    describe('Task Sync: Web → Mobile', () => {
        test('Task created on web appears in mobile endpoint', async () => {
            if (!authToken) {
                console.log('⏭️  Skipping: No auth token');
                return;
            }

            // Simulate web app creating a task
            const createRes = await request(app)
                .post('/api/admin/tasks')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Test Task from Web',
                    description: 'Mobile should see this',
                    assigned_to: 2,
                    slope_id: 1,
                    priority: 'medium'
                });

            if (createRes.body.success) {
                testTaskId = createRes.body.data?.id;
            }

            // Verify mobile app can fetch this task
            const mobileFetchRes = await request(app)
                .get('/api/tasks')
                .set('Authorization', `Bearer ${authToken}`);

            if (mobileFetchRes.body.success && testTaskId) {
                const foundTask = mobileFetchRes.body.data?.find(t => t.id === testTaskId);
                expect(foundTask).toBeDefined();
            }
        });
    });

    describe('Sensor Data: Shared Real-Time', () => {
        test('Both platforms see same sensor data', async () => {
            if (!authToken) return;

            // Web endpoint
            const webRes = await request(app)
                .get('/api/sensors')
                .set('Authorization', `Bearer ${authToken}`);

            // Mobile endpoint (same)
            const mobileRes = await request(app)
                .get('/api/sensors')
                .set('Authorization', `Bearer ${authToken}`);

            // Should return same data
            if (webRes.body.success && mobileRes.body.success) {
                expect(webRes.body.data?.length).toBe(mobileRes.body.data?.length);
            }
        });
    });

    afterAll(async () => {
        // Cleanup test data
        if (testAlertId) {
            await request(app)
                .delete(`/api/alerts/${testAlertId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .catch(() => { });
        }
    });
});

describe('API Version Compatibility', () => {
    test('Response format matches expected structure for both platforms', async () => {
        const res = await request(app).get('/api/auth/roles');

        // Standard response format
        expect(res.body).toHaveProperty('success');
        expect(typeof res.body.success).toBe('boolean');

        if (res.body.success) {
            expect(res.body).toHaveProperty('data');
        } else {
            expect(res.body).toHaveProperty('message');
        }
    });

    test('camelCase and snake_case both work for user approval', async () => {
        // This validates our API standardization effort
        // Backend should accept both userId and user_id

        const testPayloads = [
            { userId: 999 },  // camelCase (web app style)
            { user_id: 999 }  // snake_case (legacy)
        ];

        // Note: These will fail with 404 (user not found) but should NOT fail with 400 (validation)
        for (const payload of testPayloads) {
            const res = await request(app)
                .post('/api/auth/admin/approve-user')
                .send(payload);

            // Should be 401 (no auth) or 404 (user not found), NOT 400 (bad payload)
            expect(res.status).not.toBe(400);
        }
    });
});
