import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_DB_PATH = path.join(PROJECT_ROOT, 'data', 'taskpilot.db');

let dbInstance = null;
let currentDbPath = null;

export function getDb(dbPath = null) {
  const resolvedPath = dbPath
    ? path.resolve(process.cwd(), dbPath)
    : process.env.TASKPILOT_DB
    ? path.resolve(PROJECT_ROOT, process.env.TASKPILOT_DB)
    : DEFAULT_DB_PATH;

  if (dbInstance && currentDbPath === resolvedPath) {
    return dbInstance;
  }

  if (dbInstance && currentDbPath !== resolvedPath) {
    try {
      dbInstance.close();
    } catch {}
    dbInstance = null;
  }

  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
      due TEXT,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','done')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );
  `);

  dbInstance = db;
  currentDbPath = resolvedPath;
  return db;
}

export function listTasks(status = 'open', db = null) {
  const conn = db || getDb();
  let query = 'SELECT * FROM tasks';
  const params = [];

  if (status && status !== 'all') {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += " ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END, due ASC, id ASC";

  const stmt = conn.prepare(query);
  const tasks = stmt.all(...params);
  return {
    tasks,
    count: tasks.length,
  };
}

export function createTask({ title, priority = 'medium', due = null }, db = null) {
  const conn = db || getDb();
  const normalizedPriority = ['low', 'medium', 'high'].includes(priority?.toLowerCase())
    ? priority.toLowerCase()
    : 'medium';

  const stmt = conn.prepare(`
    INSERT INTO tasks (title, priority, due, status, created_at)
    VALUES (?, ?, ?, 'open', datetime('now'))
  `);

  const info = stmt.run(title.trim(), normalizedPriority, due || null);
  const task = conn.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
  return { task };
}

export function completeTask({ id = null, title = null }, db = null) {
  const conn = db || getDb();

  if (id !== null && id !== undefined && id !== '') {
    const numericId = Number(id);
    const existing = conn.prepare('SELECT * FROM tasks WHERE id = ?').get(numericId);
    if (!existing) {
      return {
        isError: true,
        message: `Task #${numericId} was not found.`,
      };
    }
    if (existing.status === 'done') {
      return {
        isError: true,
        alreadyDone: true,
        task: existing,
        message: `Task #${numericId} ("${existing.title}") is already completed.`,
      };
    }

    conn.prepare(`
      UPDATE tasks 
      SET status = 'done', completed_at = datetime('now')
      WHERE id = ?
    `).run(numericId);

    const updated = conn.prepare('SELECT * FROM tasks WHERE id = ?').get(numericId);
    return { task: updated, isError: false };
  }

  if (title) {
    const searchPattern = `%${title.trim().toLowerCase()}%`;
    const openMatches = conn.prepare(`
      SELECT * FROM tasks 
      WHERE LOWER(title) LIKE ? AND status = 'open'
    `).all(searchPattern);

    if (openMatches.length === 0) {
      const doneMatches = conn.prepare(`
        SELECT * FROM tasks 
        WHERE LOWER(title) LIKE ? AND status = 'done'
      `).all(searchPattern);

      if (doneMatches.length > 0) {
        return {
          isError: true,
          alreadyDone: true,
          task: doneMatches[0],
          message: `Task "${doneMatches[0].title}" is already marked as done.`,
        };
      }

      return {
        isError: true,
        message: `No active tasks found matching "${title}".`,
      };
    }

    if (openMatches.length === 1) {
      const taskToComplete = openMatches[0];
      conn.prepare(`
        UPDATE tasks 
        SET status = 'done', completed_at = datetime('now')
        WHERE id = ?
      `).run(taskToComplete.id);

      const updated = conn.prepare('SELECT * FROM tasks WHERE id = ?').get(taskToComplete.id);
      return { task: updated, isError: false };
    }

    return {
      isError: true,
      ambiguous: true,
      candidates: openMatches,
      message: `Found ${openMatches.length} tasks matching "${title}": ${openMatches.map((t) => `#${t.id} "${t.title}"`).join(', ')}. Which one did you complete?`,
    };
  }

  return {
    isError: true,
    message: 'Either id or title must be provided to complete a task.',
  };
}

export function clearTasks(db = null) {
  const conn = db || getDb();
  conn.prepare('DELETE FROM tasks').run();
}

export function closeDb() {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {}
    dbInstance = null;
    currentDbPath = null;
  }
}
