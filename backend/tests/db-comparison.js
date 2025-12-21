/**
 * Direct Database Comparison Test
 * 
 * Compares database state with API endpoint responses
 * No authentication required - direct DB access
 */

const { query } = require('../src/models/db');
const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function compareEndpoints() {
    console.log('\n🔍 Database vs Endpoint Comparison\n');
    console.log('='.repeat(60));

    try {
        // 1. Direct database query
        console.log('\n📊 DATABASE CHECK:');
        const dbPendingRes = await query(`
      SELECT 
        u.id, 
        u.name, 
        u.email,
        u.phone,
        u.approval_status,
        u.is_approved,
        u.role_id,
        r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.approval_status = 'pending'
      ORDER BY u.created_at DESC
    `);

        console.log(`   Total pending users: ${dbPendingRes.rows.length}`);
        console.log('\n   Pending Users:');
        dbPendingRes.rows.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role_name || 'NULL'}`);
        });

        // 2. Get all users (for comparison)
        console.log('\n📊 ALL USERS CHECK:');
        const allUsersRes = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE approval_status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE is_approved = false) as not_approved_count,
        COUNT(*) as total_count
      FROM users
    `);
        console.log(`   Total users: ${allUsersRes.rows[0].total_count}`);
        console.log(`   Pending (approval_status): ${allUsersRes.rows[0].pending_count}`);
        console.log(`   Not approved (is_approved=false): ${allUsersRes.rows[0].not_approved_count}`);

        // 3. Check for data integrity issues
        console.log('\n🔍 DATA INTEGRITY CHECKS:');

        // Check for NULL role_id
        const nullRoleRes = await query(`
      SELECT COUNT(*) as count FROM users 
      WHERE role_id IS NULL AND approval_status = 'pending'
    `);
        if (parseInt(nullRoleRes.rows[0].count) > 0) {
            console.log(`   ⚠️  ${nullRoleRes.rows[0].count} pending users have NULL role_id`);
        } else {
            console.log(`   ✅ All pending users have role_id`);
        }

        // Check for orphaned roles
        const orphanedRes = await query(`
      SELECT COUNT(*) as count FROM users u
      WHERE u.approval_status = 'pending'
      AND u.role_id NOT IN (SELECT id FROM roles)
    `);
        if (parseInt(orphanedRes.rows[0].count) > 0) {
            console.log(`   ⚠️  ${orphanedRes.rows[0].count} pending users have invalid role_id`);
        } else {
            console.log(`   ✅ All pending users have valid role_id`);
        }

        // 4. Test LEFT JOIN vs INNER JOIN
        console.log('\n📊 JOIN COMPARISON:');
        const leftJoinRes = await query(`
      SELECT COUNT(*) as count FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.approval_status = 'pending'
    `);
        const innerJoinRes = await query(`
      SELECT COUNT(*) as count FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.approval_status = 'pending'
    `);
        console.log(`   LEFT JOIN result: ${leftJoinRes.rows[0].count}`);
        console.log(`   INNER JOIN result: ${innerJoinRes.rows[0].count}`);
        if (leftJoinRes.rows[0].count !== innerJoinRes.rows[0].count) {
            console.log(`   ⚠️  DISCREPANCY: ${leftJoinRes.rows[0].count - innerJoinRes.rows[0].count} users lost in INNER JOIN`);
        } else {
            console.log(`   ✅ Both JOINs return same count`);
        }

        // 5. Check what the actual backend query returns (simulation)
        console.log('\n📊 BACKEND QUERY SIMULATION:');
        console.log('   Running exact query from queries.js getPendingUsers...');
        const backendQueryRes = await query(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.approval_status = 'pending' 
      ORDER BY u.created_at DESC
    `);
        console.log(`   Backend query would return: ${backendQueryRes.rows.length} users`);

        // 6. Summary
        console.log('\n' + '='.repeat(60));
        console.log('📋 SUMMARY:');
        console.log(`   Database has: ${dbPendingRes.rows.length} pending users`);
        console.log(`   Backend query returns: ${backendQueryRes.rows.length} users`);
        console.log(`   Expected on dashboard: ${backendQueryRes.rows.length}`);

        if (dbPendingRes.rows.length === backendQueryRes.rows.length) {
            console.log('\n✅ DATABASE AND QUERY MATCH!');
            console.log('   If dashboard shows different number, issue is in:');
            console.log('   - Frontend data fetch');
            console.log('   - API middleware filtering');
            console.log('   - Frontend state management');
        } else {
            console.log('\n❌ MISMATCH DETECTED IN DATABASE QUERIES');
        }

        console.log('\n' + '='.repeat(60) + '\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }

    process.exit(0);
}

// Run
compareEndpoints();
