import { Database } from 'bun:sqlite';
import { QUEUE_DB_DIR, QUEUE_DB_FILE } from './constant';
import { existsSync, mkdirSync } from 'node:fs';

if (!existsSync(QUEUE_DB_DIR)) {
  mkdirSync(QUEUE_DB_DIR, { recursive: true });
}

export const db = new Database(QUEUE_DB_FILE);

db.run("PRAGMA journal_mode = WAL;");
db.run("PRAGMA busy_timeout = 5000;");
db.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payload TEXT NOT NULL,
    executor TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
  )
`);
