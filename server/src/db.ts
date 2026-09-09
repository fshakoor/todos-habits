import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'

// DB path is env-overridable so a scratch instance can run without touching real data.
const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(path.resolve(import.meta.dirname, '../data'), 'app.db')
fs.mkdirSync(path.dirname(dbPath), { recursive: true })

export const db = new DatabaseSync(dbPath)
db.exec('PRAGMA journal_mode = WAL;')
db.exec('PRAGMA foreign_keys = ON;')

db.exec(`
-- tasks side (a minimal Todoist) --------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  name     TEXT    NOT NULL,
  color    TEXT    NOT NULL DEFAULT 'gray',
  position INTEGER NOT NULL DEFAULT 0,
  created  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id   INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  title        TEXT    NOT NULL,
  note         TEXT,
  due_date     TEXT,                        -- YYYY-MM-DD or null
  priority     INTEGER NOT NULL DEFAULT 1,  -- 4 = urgent (p1) .. 1 = none (p4)
  done         INTEGER NOT NULL DEFAULT 0,
  completed_at INTEGER,
  position     INTEGER NOT NULL DEFAULT 0,
  created      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);

-- habits side (a minimal Habitica) ------------------------------------------
CREATE TABLE IF NOT EXISTS habits (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  up         INTEGER NOT NULL DEFAULT 1,   -- the + button is enabled
  down       INTEGER NOT NULL DEFAULT 1,   -- the - button is enabled
  value      REAL    NOT NULL DEFAULT 0,   -- running score, drives the color
  difficulty TEXT    NOT NULL DEFAULT 'easy',
  position   INTEGER NOT NULL DEFAULT 0,
  created    INTEGER NOT NULL
);

-- one row per + or - tap, used for history and today's counters
CREATE TABLE IF NOT EXISTS habit_events (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id  INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date      TEXT    NOT NULL,   -- YYYY-MM-DD (local)
  direction INTEGER NOT NULL,   -- +1 or -1
  created   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_habit_events ON habit_events(habit_id, date);

CREATE TABLE IF NOT EXISTS dailies (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  difficulty TEXT    NOT NULL DEFAULT 'easy',
  days       TEXT    NOT NULL DEFAULT '[0,1,2,3,4,5,6]',  -- weekdays it is due, 0 = Sunday
  streak     INTEGER NOT NULL DEFAULT 0,
  position   INTEGER NOT NULL DEFAULT 0,
  created    INTEGER NOT NULL
);

-- presence of a row means the daily was completed on that date
CREATE TABLE IF NOT EXISTS daily_checks (
  daily_id INTEGER NOT NULL REFERENCES dailies(id) ON DELETE CASCADE,
  date     TEXT    NOT NULL,
  PRIMARY KEY (daily_id, date)
);

-- single-row character sheet
CREATE TABLE IF NOT EXISTS stats (
  id        INTEGER PRIMARY KEY CHECK (id = 1),
  level     INTEGER NOT NULL DEFAULT 1,
  xp        REAL    NOT NULL DEFAULT 0,
  hp        REAL    NOT NULL DEFAULT 50,
  max_hp    REAL    NOT NULL DEFAULT 50,
  gold      REAL    NOT NULL DEFAULT 0,
  last_cron TEXT
);
INSERT OR IGNORE INTO stats (id) VALUES (1);
`)

export type Row = Record<string, any>

export const q = {
  all: (sql: string, ...args: any[]): Row[] => db.prepare(sql).all(...args) as Row[],
  get: (sql: string, ...args: any[]): Row | undefined => db.prepare(sql).get(...args) as Row | undefined,
  run: (sql: string, ...args: any[]) => {
    const r = db.prepare(sql).run(...args)
    return { changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) }
  },
}
