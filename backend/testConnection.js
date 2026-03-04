const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, '..', 'python-chatbot', 'cashswap.db');

async function test() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      console.error('❌ Database file not found at:', DB_PATH);
      return;
    }

    const SQL = await initSqlJs();
    const fileBuffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(fileBuffer);

    console.log('✅ SQLite database connected successfully!');
    console.log('📁 Path:', DB_PATH);

    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = tables[0]?.values.map(r => r[0]) || [];
    console.log('📋 Tables:', tableNames.join(', '));

    const users = db.exec('SELECT COUNT(*) as count FROM users');
    console.log('👥 Users in DB:', users[0]?.values[0][0]);

    const wallets = db.exec('SELECT COUNT(*) as count FROM wallets');
    console.log('💰 Wallets in DB:', wallets[0]?.values[0][0]);

    db.close();
    console.log('✅ Connection test complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

test();