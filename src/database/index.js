const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const config = require('../config');

let db = null;

function initDatabase(customPath) {
  const dbPath = customPath || config.database.filename;
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new DatabaseSync(dbPath);
  
  // Pragmas for performance and safety
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');

  // Run schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  return db;
}

function getDatabase() {
  if (!db) {
    initDatabase();
  }
  return db;
}

/**
 * Execute query and return all matching rows
 */
function queryAll(sql, params = []) {
  const stmt = getDatabase().prepare(sql);
  return stmt.all(...params);
}

/**
 * Execute query and return single row
 */
function queryOne(sql, params = []) {
  const stmt = getDatabase().prepare(sql);
  return stmt.get(...params) || null;
}

/**
 * Execute insert / update / delete query
 * Returns { changes: number, lastInsertRowid: number }
 */
function queryRun(sql, params = []) {
  const stmt = getDatabase().prepare(sql);
  return stmt.run(...params);
}

/**
 * Execute raw statements block
 */
function exec(sql) {
  return getDatabase().exec(sql);
}

module.exports = {
  initDatabase,
  getDatabase,
  queryAll,
  queryOne,
  queryRun,
  exec,
};
