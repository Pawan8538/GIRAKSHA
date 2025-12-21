// src/tests/queryTest.js
const { query } = require('../models/db');

async function runTests() {
  try {
    console.log("=== Running DB Tests ===");

    // Test 1: Simple SELECT
    const now = await query('SELECT NOW()');
    console.log("DB Connected:", now.rows);

    // Test 2: Check roles table exists
    const roles = await query("SELECT * FROM roles");
    console.log("Roles table OK, count:", roles.rowCount);

    // Test 3: Insert a test user
    const testUser = await query(
      `INSERT INTO users (role_id, name, email, password_hash)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [1, "Test User", "test@example.com", "hashed_password"]
    );
    console.log("Test user inserted:", testUser.rows[0]);

    // Test 4: Fetch users
    const users = await query("SELECT id, name, email FROM users");
    console.log("Users:", users.rows);

  } catch (err) {
    console.error("TEST FAILED:", err);
  } finally {
    process.exit(0);
  }
}

runTests();
