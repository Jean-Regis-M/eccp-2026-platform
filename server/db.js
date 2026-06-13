import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, 'eccp.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pf_number TEXT UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','mentor','mentee')),
    name TEXT NOT NULL,
    gender TEXT,
    phone TEXT,
    school TEXT,
    mentor_id INTEGER REFERENCES users(id),
    profile_completed INTEGER DEFAULT 0,
    profile_data TEXT DEFAULT '{}',
    mentor_bio TEXT DEFAULT '',
    mentor_linkedin TEXT DEFAULT '',
    mentor_instagram TEXT DEFAULT '',
    mentor_photo TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    last_login TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS token_blacklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    revoked_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    topic TEXT NOT NULL,
    description TEXT DEFAULT '',
    mentor_id INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id),
    presentation_url TEXT DEFAULT '',
    notes_url TEXT DEFAULT '',
    message_to_scholars TEXT DEFAULT '',
    google_drive_url TEXT DEFAULT '',
    is_global INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    attended INTEGER DEFAULT 0,
    joined_at TEXT DEFAULT (datetime('now')),
    UNIQUE(session_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    understanding_rating INTEGER CHECK(understanding_rating BETWEEN 1 AND 5),
    feelings TEXT DEFAULT '',
    questions TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(session_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER REFERENCES sessions(id),
    title TEXT NOT NULL,
    mentor_id INTEGER REFERENCES users(id),
    time_limit INTEGER DEFAULT 30,
    is_active INTEGER DEFAULT 1,
    closed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS quiz_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    correct_answer INTEGER NOT NULL,
    points INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS quiz_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    answers TEXT NOT NULL,
    score REAL DEFAULT 0,
    max_score REAL DEFAULT 0,
    submitted_at TEXT DEFAULT (datetime('now')),
    UNIQUE(quiz_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER NOT NULL REFERENCES users(id),
    target_type TEXT NOT NULL CHECK(target_type IN ('all_mentors','all_scholars','mentor_group','individual')),
    target_id INTEGER,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS message_reads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL REFERENCES messages(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    read_at TEXT DEFAULT (datetime('now')),
    UNIQUE(message_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS sat_exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    link TEXT DEFAULT '',
    mentor_id INTEGER REFERENCES users(id),
    time_limit INTEGER DEFAULT 60,
    is_active INTEGER DEFAULT 1,
    closed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sat_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL REFERENCES sat_exams(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    score REAL,
    notes TEXT DEFAULT '',
    submitted_at TEXT DEFAULT (datetime('now')),
    UNIQUE(exam_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    details TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS admin_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    target_type TEXT DEFAULT '',
    target_id INTEGER,
    details TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS mentor_weekly_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_id INTEGER NOT NULL REFERENCES users(id),
    week_start TEXT NOT NULL,
    week_end TEXT NOT NULL,
    challenges TEXT DEFAULT '',
    actions_taken TEXT DEFAULT '',
    recommendations TEXT DEFAULT '',
    goals_next_week TEXT DEFAULT '',
    reflections TEXT DEFAULT '',
    submitted_at TEXT DEFAULT (datetime('now')),
    UNIQUE(mentor_id, week_start, week_end)
  );

  CREATE TABLE IF NOT EXISTS message_replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL REFERENCES messages(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS email_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL,
    sent_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_users_mentor ON users(mentor_id);
  CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);
  CREATE INDEX IF NOT EXISTS idx_feedback_session ON feedback(session_id);

  CREATE TABLE IF NOT EXISTS program_timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period TEXT NOT NULL,
    event TEXT NOT NULL,
    description TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    updated_by INTEGER REFERENCES users(id),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    resource_type TEXT NOT NULL CHECK(resource_type IN ('link','pdf','ppt','word','youtube','drive')),
    url TEXT DEFAULT '',
    file_path TEXT DEFAULT '',
    mentor_id INTEGER REFERENCES users(id),
    created_by INTEGER NOT NULL REFERENCES users(id),
    is_global INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier TEXT NOT NULL,
    role TEXT NOT NULL,
    ip TEXT DEFAULT '',
    success INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS platform_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    user_name TEXT DEFAULT '',
    user_role TEXT DEFAULT '',
    action TEXT NOT NULL,
    target_type TEXT DEFAULT '',
    target_id INTEGER,
    details TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS wellness_checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    stress_level INTEGER CHECK(stress_level BETWEEN 1 AND 5),
    week_start TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, week_start)
  );
`);

const migrations = [
  'ALTER TABLE attendance ADD COLUMN marked_by INTEGER REFERENCES users(id)',
  'ALTER TABLE attendance ADD COLUMN marked_at TEXT',
  'ALTER TABLE sessions ADD COLUMN session_link TEXT DEFAULT ""',
  'ALTER TABLE sessions ADD COLUMN is_deleted INTEGER DEFAULT 0',
  'ALTER TABLE sessions ADD COLUMN presentation_file TEXT DEFAULT ""',
  'ALTER TABLE quizzes ADD COLUMN opens_at TEXT',
  'ALTER TABLE quizzes ADD COLUMN closes_at TEXT',
  'ALTER TABLE quiz_submissions ADD COLUMN missed INTEGER DEFAULT 0',
  'ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0',
];
for (const sql of migrations) { try { db.exec(sql); } catch {} }

db.exec(`
  CREATE TABLE IF NOT EXISTS scholar_progress_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    score REAL DEFAULT 0,
    attendance INTEGER DEFAULT 0,
    profile_completed INTEGER DEFAULT 0,
    application_status TEXT DEFAULT '',
    snapshot_json TEXT DEFAULT '{}',
    recorded_by INTEGER REFERENCES users(id),
    recorded_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_scholar_progress_user ON scholar_progress_history(user_id);
`);

// Seed default timeline if empty
const tlCount = db.prepare('SELECT COUNT(*) as c FROM program_timeline').get().c;
if (tlCount === 0) {
  const insertTl = db.prepare('INSERT INTO program_timeline (period, event, description, sort_order) VALUES (?, ?, ?, ?)');
  [
    ['May 25–30, 2026', 'SGL & Mentor Induction', 'Mentor orientation and program setup', 1],
    ['Jun 1–6, 2026', 'Scholar Induction', 'Welcome scholars, profile setup, platform onboarding', 2],
    ['Jun 8–Jul 4, 2026', 'Bootcamp', 'Intensive college counselling bootcamp', 3],
    ['Jul 6–27, 2026', 'Workshop + SAT Prep', 'SAT preparation and application workshops', 4],
    ['May–Sep 2026', 'Information Sessions', 'Virtual and in-person university info sessions', 5],
    ['Aug–Dec 2026', 'Applications & Mentorship', 'Mentor-mentee sessions through application cycle', 6],
  ].forEach(([p, e, d, o]) => insertTl.run(p, e, d, o));
}

const settingsDefaults = {
  mission: 'To empower Rwanda\'s brightest scholars with world-class college counselling, mentorship, and digital tools that transform university dreams into reality.',
  vision: 'A digitally connected ECCP where every scholar receives personalized guidance, measurable progress, and unwavering support from induction to university acceptance.',
  quotes: JSON.stringify([
    'Persistence beats talent when talent does not persist.',
    'Your application is your story — write it authentically.',
    'Small daily progress leads to extraordinary outcomes.',
    'Mentorship is the bridge between potential and achievement.',
    'Excellence is not an act, but a habit — Aristotle',
  ]),
};
const upsertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING');
for (const [k, v] of Object.entries(settingsDefaults)) upsertSetting.run(k, v);

// Query function that mimics the pg API: returns a Promise that resolves to { rows: [] }
function convertQuery(query) {
  return query.replace(/\$\d+/g, '?');
}

function query(text, params) {
  try {
    const sql = convertQuery(text);
    const stmt = db.prepare(sql);

    // Determine if it's a SELECT query (case-insensitive, ignoring leading whitespace)
    const isSelect = /^\s*select/i.test(text);

    if (isSelect) {
      const rows = stmt.all(...params);
      return Promise.resolve({ rows });
    } else {
      // For INSERT, UPDATE, DELETE, etc.
      const info = stmt.run(...params);
      // Return empty rows array to match the pg API expectation in routes
      return Promise.resolve({ rows: [] });
    }
  } catch (err) {
    console.error('Database query error:', err);
    // Reject the promise so the route can handle the error
    return Promise.reject(err);
  }
}

// Attach a prepare method that returns a raw BetterSqlite3 statement
// This is used by seed.js and any other files that need direct statement access
query.prepare = function (text) {
  const sql = convertQuery(text);
  return db.prepare(sql);
};

export default query;

export function logHistory(userId, userName, userRole, action, targetType = '', targetId = null, details = '') {
  db.prepare(`INSERT INTO platform_history (user_id, user_name, user_role, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(userId, userName, userRole, action, targetType, targetId, details);
}