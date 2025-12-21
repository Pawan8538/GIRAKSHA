# Integration Testing Guide

## Setup

Install test dependencies:
```bash
npm install --save-dev jest supertest @types/jest
```

## Running Tests

```bash
# Run all tests
npm test

# Run integration tests only
npm run test:integration

# Run tests in watch mode
npm run test:watch
```

## Test Structure

### Critical Tests
- **Endpoint Discrepancy Test**: Compares `/api/admin/users` vs `/api/auth/admin/pending-users`
- **Database Integrity**: Validates user-role relationships
- **Auth Flow**: Tests registration → approval → login flow

### Test Output

The tests will output detailed comparisons:
```
📊 ENDPOINT 1: /api/admin/users returned 10 total users
   └─ 6 are pending
📊 ENDPOINT 2: /api/auth/admin/pending-users returned 3 users
📊 DATABASE: 6 users with approval_status='pending'

🔍 ANALYSIS:
   ❌ DISCREPANCY: Endpoint 2 shows 3, DB has 6
```

## Current Known Issues

### Pending Users Endpoint Discrepancy
- **Issue**: `/api/auth/admin/pending-users` returns fewer users than database count
- **Impact**: Super Admin dashboard shows incomplete pending list
- **Test**: `ali-pawan.integration.test.js` → "Compare endpoints"

## Writing New Tests

Example test:
```javascript
test('Description', async () => {
  const res = await request(app)
    .get('/api/your-endpoint')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
});
```

## Troubleshooting

### Tests Timeout
- Increase timeout in jest.config: `testTimeout: 30000`
- Check database connection

### Auth Failures
- Ensure super admin exists in database
- Check credentials in `beforeAll` block
- Verify JWT_SECRET is consistent

### Database Connection Errors
- Ensure PostgreSQL is running
- Check `.env` configuration
-Verify connection pool isn't exhausted
