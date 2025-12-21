const { query } = require('../src/models/db');

async function migrate() {
    try {
        console.log('Starting migration...');

        // 1. Add missing columns to users
        console.log('Migrating users table...');
        await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS govt_id_url TEXT,
      ADD COLUMN IF NOT EXISTS company_id_url TEXT,
      ADD COLUMN IF NOT EXISTS department VARCHAR(100);
    `);

        // 2. Create worker_invites table
        console.log('Creating worker_invites table...');
        await query(`
      CREATE TABLE IF NOT EXISTS worker_invites (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        slope_id INTEGER REFERENCES slopes(id),
        invited_by INTEGER REFERENCES users(id),
        is_registered BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

        // 3. Create govt_authorities table
        console.log('Creating govt_authorities table...');
        await query(`
      CREATE TABLE IF NOT EXISTS govt_authorities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        department VARCHAR(100),
        region VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

        console.log('✅ Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
