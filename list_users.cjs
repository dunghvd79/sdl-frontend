const path = require('path');
require('E:/sdl-project/node_modules/dotenv').config({ path: 'E:/sdl-project/.env' });

const pool = require('E:/sdl-project/src/config/database');

async function main() {
  try {
    const res = await pool.query('SELECT id, email, role, is_active FROM users');
    console.log('--- ALL USERS IN SYSTEM ---');
    console.log(res.rows);
    pool.end();
  } catch (err) {
    console.error('Error querying users:', err);
    pool.end();
  }
}

main();
