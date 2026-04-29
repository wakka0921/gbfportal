const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
    try {
        console.log('Adding completed_count column to daily_logs...');
        await sql`ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS completed_count INTEGER DEFAULT 1;`;
        console.log('Migration completed successfully.');
    } catch (e) {
        console.error('Migration failed:', e);
    }
}

migrate();
