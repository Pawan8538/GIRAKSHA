require('dotenv').config();
const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL;
console.log('DB URL Loaded:', dbUrl ? 'Yes' : 'No');
if (dbUrl) console.log('DB Host:', dbUrl.split('@')[1].split(':')[0]);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Supabase
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('--- Starting Auth V2 Migration ---');

        await client.query('BEGIN');

        // 1. Wipe Users (Cascade will handle related data like auth records)
        // Keeping roles and slopes (Demo Mine)
        console.log('1. Wiping existing users...');
        await client.query('DELETE FROM users');
        console.log('✅ Users wiped.');

        // 2. Modify Users Table
        console.log('2. Modifying users table...');

        // Check if columns exist before adding to avoid errors on re-run
        const checkCols = async (col) => {
            const res = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name=$1
      `, [col]);
            return res.rowCount > 0;
        };

        if (!await checkCols('is_approved')) {
            await client.query(`ALTER TABLE users ADD COLUMN is_approved BOOLEAN DEFAULT FALSE`);
        }

        // Create ENUM type safely
        await client.query(`
      DO $$ BEGIN
        CREATE TYPE approval_status_enum AS ENUM ('pending', 'approved', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

        if (!await checkCols('approval_status')) {
            await client.query(`ALTER TABLE users ADD COLUMN approval_status approval_status_enum DEFAULT 'pending'`);
        }

        if (!await checkCols('govt_id_url')) {
            await client.query(`ALTER TABLE users ADD COLUMN govt_id_url TEXT`);
        }

        if (!await checkCols('company_id_url')) {
            await client.query(`ALTER TABLE users ADD COLUMN company_id_url TEXT`);
        }

        if (!await checkCols('department')) {
            await client.query(`ALTER TABLE users ADD COLUMN department TEXT`);
        }
        console.log('✅ Users table modified.');

        // 3. Create Worker Invites Table
        console.log('3. Creating worker_invites table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS worker_invites (
        id SERIAL PRIMARY KEY,
        phone TEXT UNIQUE NOT NULL,
        slope_id INTEGER REFERENCES slopes(id),
        invited_by INTEGER REFERENCES users(id),
        is_registered BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
        console.log('✅ worker_invites table created.');

        await client.query('COMMIT');
        console.log('--- Migration Complete ---');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration Failed:', error);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
