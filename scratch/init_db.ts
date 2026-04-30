import { initDB } from '../src/lib/actions';

async function main() {
    console.log('Initializing DB...');
    try {
        const res = await initDB();
        console.log('Result:', res);
    } catch (error) {
        console.error('Error during DB initialization:', error);
    }
    process.exit(0);
}

main();
