import { sql } from '@vercel/postgres';
import { initDB } from '../src/lib/actions';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkTable() {
    try {
        await initDB();
        const { rows } = await sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'game_saves'`;
        console.log('Table check:', rows);
        
        const { rows: count } = await sql`SELECT count(*) FROM game_saves`;
        console.log('Total saves in DB:', count);
    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}

checkTable();
