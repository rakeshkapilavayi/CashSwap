const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

// cashswap.db is in the backend/ root folder
const DB_PATH = path.join(__dirname, '..', 'cashswap.db');

let db = null;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(DB_PATH);
  db = new SQL.Database(fileBuffer);
  console.log('✅ SQLite database loaded from', DB_PATH);
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

const dbPool = {
  query: async (sql, params = []) => {
    const database = await getDb();
    const trimmed = sql.trim().toUpperCase();

    if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')) {
      const stmt = database.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return [rows];

    } else if (trimmed.startsWith('INSERT')) {
      database.run(sql, params);
      const [[{ id }]] = dbPool._raw('SELECT last_insert_rowid() as id');
      saveDb();
      return [{ insertId: id, affectedRows: 1 }];

    } else {
      database.run(sql, params);
      const [[{ changes }]] = dbPool._raw('SELECT changes() as changes');
      saveDb();
      return [{ affectedRows: changes }];
    }
  },

  _raw: (sql) => {
    const stmt = db.prepare(sql);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return [rows];
  }
};

module.exports = dbPool;