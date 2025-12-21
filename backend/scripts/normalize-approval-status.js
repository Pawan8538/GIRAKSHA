/**
 * Database Normalization Script
 * 
 * Fixes inconsistent approval_status for unapproved users
 * 
 * Issue: Some users have approval_status='approved' but is_approved=false
 * Fix: Set approval_status='pending' for all users where is_approved=false
 */

const { query } = require('../src/models/db');

async function normalizeApprovalStatus() {
    console.log('\n🔧 Normalizing User Approval Status\n');
    console.log('='.repeat(60));

    try {
        // 1. Check current state
        console.log('\n📊 BEFORE FIX:');
        const beforeRes = await query(`
      SELECT approval_status, is_approved, COUNT(*) as count
      FROM users
      WHERE is_approved = FALSE
      GROUP BY approval_status, is_approved
      ORDER BY approval_status
    `);

        console.log('   Unapproved users by status:');
        beforeRes.rows.forEach(row => {
            console.log(`   - ${row.approval_status || 'NULL'}: ${row.count} users`);
        });

        const totalBefore = beforeRes.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
        console.log(`   TOTAL: ${totalBefore} unapproved users`);

        // 2. Apply fix
        console.log('\n🔄 APPLYING FIX...');
        const updateRes = await query(`
      UPDATE users 
      SET approval_status = 'pending'
      WHERE is_approved = FALSE 
      AND approval_status != 'pending'
      RETURNING id, name, email, approval_status
    `);

        console.log(`   ✅ Updated ${updateRes.rows.length} users:`);
        updateRes.rows.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.name} (${user.email})`);
        });

        // 3. Verify fix
        console.log('\n📊 AFTER FIX:');
        const afterRes = await query(`
      SELECT approval_status, is_approved, COUNT(*) as count
      FROM users
      WHERE is_approved = FALSE
      GROUP BY approval_status, is_approved
      ORDER BY approval_status
    `);

        console.log('   Unapproved users by status:');
        afterRes.rows.forEach(row => {
            console.log(`   - ${row.approval_status || 'NULL'}: ${row.count} users`);
        });

        const totalAfter = afterRes.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
        console.log(`   TOTAL: ${totalAfter} unapproved users`);

        // 4. Verify all are now 'pending'
        if (afterRes.rows.length === 1 && afterRes.rows[0].approval_status === 'pending') {
            console.log('\n✅ SUCCESS! All unapproved users now have approval_status=\'pending\'');
        } else {
            console.log('\n⚠️  Warning: Some users still have inconsistent status');
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Normalization complete!');
        console.log(`   Dashboard should now show all ${totalAfter} pending users\n`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }

    process.exit(0);
}

// Run
normalizeApprovalStatus();
