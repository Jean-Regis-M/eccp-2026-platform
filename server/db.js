import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Determine which database to use
let usePostgres = false;
let dbClient; // For pg: Pool; for sqlite: Database object
let db; // We'll keep the same variable name for sqlite compatibility

if (process.env.DATABASE_URL) {
  usePostgres = true;
  const { Pool } = await import('pg');
  dbClient = new Pool({ connectionString: process.env.DATABASE_URL });
  console.log('🔌 Using PostgreSQL database');
} else {
  usePostgres = false;
  const Database = await import('better-sqlite3');
  const dbPath = process.env.DB_PATH || path.join(__dirname, 'eccp.db');
  db = new Database.default(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  console.log(`🗃️  Using SQLite database at ${dbPath}`);
}

// Initialize database (create tables if not exist)
async function initializeDatabase() {
  if (usePostgres) {
    // For PostgreSQL, create schema if not exists
    try {
      // Test connection
      await dbClient.query('SELECT 1');
      console.log('✅ PostgreSQL connection successful');

      // Create tables if they don't exist
      const schemaSql = `
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          pf_number VARCHAR UNIQUE,
          email VARCHAR UNIQUE,
          password_hash TEXT NOT NULL,
          role VARCHAR NOT NULL CHECK(role IN ('admin','mentor','mentee')),
          name VARCHAR NOT NULL,
          gender VARCHAR,
          phone VARCHAR,
          school VARCHAR,
          mentor_id INTEGER REFERENCES users(id),
          profile_completed INTEGER DEFAULT 0,
          profile_data TEXT DEFAULT '{}',
          mentor_bio TEXT DEFAULT '',
          mentor_linkedin TEXT DEFAULT '',
          mentor_instagram TEXT DEFAULT '',
          mentor_photo TEXT DEFAULT '',
          is_active BOOLEAN DEFAULT TRUE,
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Token blacklist
        CREATE TABLE IF NOT EXISTS token_blacklist (
          id SERIAL PRIMARY KEY,
          token TEXT UNIQUE NOT NULL,
          revoked_at TIMESTAMP DEFAULT NOW()
        );

        -- Sessions
        CREATE TABLE IF NOT EXISTS sessions (
          id SERIAL PRIMARY KEY,
          date DATE NOT NULL,
          topic VARCHAR NOT NULL,
          description TEXT DEFAULT '',
          mentor_id INTEGER REFERENCES users(id),
          created_by INTEGER REFERENCES users(id),
          presentation_url TEXT DEFAULT '',
          notes_url TEXT DEFAULT '',
          message_to_scholars TEXT DEFAULT '',
          google_drive_url TEXT DEFAULT '',
          is_global BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Attendance
        CREATE TABLE IF NOT EXISTS attendance (
          id SERIAL PRIMARY KEY,
          session_id INTEGER NOT NULL REFERENCES sessions(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          attended BOOLEAN DEFAULT FALSE,
          joined_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(session_id, user_id)
        );

        -- Feedback
        CREATE TABLE IF NOT EXISTS feedback (
          id SERIAL PRIMARY KEY,
          session_id INTEGER NOT NULL REFERENCES sessions(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          understanding_rating INTEGER CHECK(understanding_rating BETWEEN 1 AND 5),
          feelings TEXT DEFAULT '',
          questions TEXT DEFAULT '',
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(session_id, user_id)
        );

        -- Quizzes
        CREATE TABLE IF NOT EXISTS quizzes (
          id SERIAL PRIMARY KEY,
          session_id INTEGER REFERENCES sessions(id),
          title VARCHAR NOT NULL,
          mentor_id INTEGER REFERENCES users(id),
          time_limit INTEGER DEFAULT 30,
          is_active BOOLEAN DEFAULT TRUE,
          closed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Quiz questions
        CREATE TABLE IF NOT EXISTS quiz_questions (
          id SERIAL PRIMARY KEY,
          quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
          question TEXT NOT NULL,
          options TEXT NOT NULL,
          correct_answer INTEGER NOT NULL,
          points INTEGER DEFAULT 1
        );

        -- Quiz submissions
        CREATE TABLE IF NOT EXISTS quiz_submissions (
          id SERIAL PRIMARY KEY,
          quiz_id INTEGER NOT NULL REFERENCES quizzes(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          answers TEXT NOT NULL,
          score REAL DEFAULT 0,
          max_score REAL DEFAULT 0,
          submitted_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(quiz_id, user_id)
        );

        -- Messages
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          from_user_id INTEGER NOT NULL REFERENCES users(id),
          target_type VARCHAR NOT NULL CHECK(target_type IN ('all_mentors','all_scholars','mentor_group','individual')),
          target_id INTEGER,
          subject TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Message reads
        CREATE TABLE IF NOT EXISTS message_reads (
          id SERIAL PRIMARY KEY,
          message_id INTEGER NOT NULL REFERENCES messages(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          read_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(message_id, user_id)
        );

        -- SAT exams
        CREATE TABLE IF NOT EXISTS sat_exams (
          id SERIAL PRIMARY KEY,
          title VARCHAR NOT NULL,
          description TEXT DEFAULT '',
          link TEXT DEFAULT '',
          mentor_id INTEGER REFERENCES users(id),
          time_limit INTEGER DEFAULT 60,
          is_active BOOLEAN DEFAULT TRUE,
          closed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- SAT submissions
        CREATE TABLE IF NOT EXISTS sat_submissions (
          id SERIAL PRIMARY KEY,
          exam_id INTEGER NOT NULL REFERENCES sat_exams(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          score REAL,
          notes TEXT DEFAULT '',
          submitted_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(exam_id, user_id)
        );

        -- Activity log
        CREATE TABLE IF NOT EXISTS activity_log (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          action TEXT NOT NULL,
          details TEXT DEFAULT '',
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Settings
        CREATE TABLE IF NOT EXISTS settings (
          key VARCHAR PRIMARY KEY,
          value TEXT NOT NULL
        );

        -- Password reset tokens
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          token TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          used BOOLEAN DEFAULT FALSE
        );

        -- Admin audit log
        CREATE TABLE IF NOT EXISTS admin_audit_log (
          id SERIAL PRIMARY KEY,
          admin_id INTEGER NOT NULL REFERENCES users(id),
          action TEXT NOT NULL,
          target_type TEXT DEFAULT '',
          target_id INTEGER,
          details TEXT DEFAULT '',
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Mentor weekly reports
        CREATE TABLE IF NOT EXISTS mentor_weekly_reports (
          id SERIAL PRIMARY KEY,
          mentor_id INTEGER NOT NULL REFERENCES users(id),
          week_start DATE NOT NULL,
          week_end DATE NOT NULL,
          challenges TEXT DEFAULT '',
          actions_taken TEXT DEFAULT '',
          recommendations TEXT DEFAULT '',
          goals_next_week TEXT DEFAULT '',
          reflections TEXT DEFAULT '',
          submitted_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(mentor_id, week_start, week_end)
        );

        -- Message replies
        CREATE TABLE IF NOT EXISTS message_replies (
          id SERIAL PRIMARY KEY,
          message_id INTEGER NOT NULL REFERENCES messages(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Email log
        CREATE TABLE IF NOT EXISTS email_log (
          id SERIAL PRIMARY KEY,
          to_email TEXT NOT NULL,
          subject TEXT NOT NULL,
          status TEXT NOT NULL,
          sent_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        CREATE INDEX IF NOT EXISTS idx_users_mentor ON users(mentor_id);
        CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);
        CREATE INDEX IF NOT EXISTS idx_feedback_session ON feedback(session_id);

        -- Program timeline
        CREATE TABLE IF NOT EXISTS program_timeline (
          id SERIAL PRIMARY KEY,
          period VARCHAR NOT NULL,
          event VARCHAR NOT NULL,
          description TEXT DEFAULT '',
          sort_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          updated_by INTEGER REFERENCES users(id),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Resources
        CREATE TABLE IF NOT EXISTS resources (
          id SERIAL PRIMARY KEY,
          category VARCHAR NOT NULL,
          title VARCHAR NOT NULL,
          description TEXT DEFAULT '',
          resource_type VARCHAR NOT NULL CHECK(resource_type IN ('link','pdf','ppt','word','youtube','drive')),
          url TEXT DEFAULT '',
          file_path TEXT DEFAULT '',
          mentor_id INTEGER REFERENCES users(id),
          created_by INTEGER NOT NULL REFERENCES users(id),
          is_global BOOLEAN DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Login attempts
        CREATE TABLE IF NOT EXISTS login_attempts (
          id SERIAL PRIMARY KEY,
          identifier VARCHAR NOT NULL,
          role VARCHAR NOT NULL,
          ip TEXT DEFAULT '',
          success BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Platform history
        CREATE TABLE IF NOT EXISTS platform_history (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          user_name VARCHAR DEFAULT '',
          user_role VARCHAR DEFAULT '',
          action TEXT NOT NULL,
          target_type VARCHAR DEFAULT '',
          target_id INTEGER,
          details TEXT DEFAULT '',
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Wellness checkins
        CREATE TABLE IF NOT EXISTS wellness_checkins (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          stress_level INTEGER CHECK(stress_level BETWEEN 1 AND 5),
          week_start DATE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, week_start)
        );

        -- Scholar progress history
        CREATE TABLE IF NOT EXISTS scholar_progress_history (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          score REAL DEFAULT 0,
          attendance INTEGER DEFAULT 0,
          profile_completed INTEGER DEFAULT 0,
          application_status TEXT DEFAULT '',
          snapshot_json TEXT DEFAULT '{}',
          recorded_by INTEGER REFERENCES users(id),
          recorded_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_scholar_progress_user ON scholar_progress_history(user_id);
      `;

      // Execute schema creation
      await dbClient.query(schemaSql);
      console.log('📊 PostgreSQL schema ensured');

      // Seed default timeline if empty
      const tlResult = await dbClient.query('SELECT COUNT(*) as c FROM program_timeline');
      const tlCount = parseInt(tlResult.rows[0].c, 10);
      if (tlCount === 0) {
        const insertTl = `
          INSERT INTO program_timeline (period, event, description, sort_order) VALUES
          ('May 25–30, 2026', 'SGL & Mentor Induction', 'Mentor orientation and program setup', 1),
          ('Jun 1–6, 2026', 'Scholar Induction', 'Welcome scholars, profile setup, platform onboarding', 2),
          ('Jun 8–Jul 4, 2026', 'Bootcamp', 'Intensive college counselling bootcamp', 3),
          ('Jul 6–27, 2026', 'Workshop + SAT Prep', 'SAT preparation and application workshops', 4),
          ('May–Sep 2026', 'Information Sessions', 'Virtual and in-person university info sessions', 5),
          ('Aug–Dec 2026', 'Applications & Mentorship', 'Mentor-mentee sessions through application cycle', 6)
        `;
        await dbClient.query(insertTl);
        console.log('📅 Default timeline seeded');
      }

      // Seed default settings if empty
      const settingsResult = await dbClient.query('SELECT COUNT(*) as c FROM settings');
      const settingsCount = parseInt(settingsResult.rows[0].c, 10);
      if (settingsCount === 0) {
        const settingsDefaults = {
          mission: 'To empower Rwanda\\'s brightest scholars with world-class college counselling, mentorship, and digital tools that transform university dreams into reality.',
          vision: 'A digitally connected ECCP where every scholar receives personalized guidance, measurable progress, and unwavering support from induction to university acceptance.',
          quotes: JSON.stringify([
            'Persistence beats talent when talent does not persist.',
            'Your application is your story — write it authentically.',
            'Small daily progress leads to extraordinary outcomes.',
            'Mentorship is the bridge between potential and achievement.',
            'Excellence is not an act, but a habit — Aristotle',
          ])
        };
        for (const [k, v] of Object.entries(settingsDefaults)) {
          await dbClient.query(
            'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO NOTHING',
            [k, v]
          );
        }
        console.log('⚙️ Default settings seeded');
      }

    } catch (err) {
      console.error('❌ Failed to initialize PostgreSQL database:', err);
      process.exit(1);
    }
  } else {
    // SQLite: run the full schema creation (as before)
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
  }
}

// Initialize the database
initializeDatabase().catch(err => {
  console.error('❌ Database initialization failed:', err);
  process.exit(1);
});

// Query function that works for both PostgreSQL and SQLite
async function query(text, params) {
  try {
    // Ensure params is an array
    if (!Array.isArray(params)) {
      params = [params];
    }

    if (usePostgres) {
      // PostgreSQL: use the pool's query method
      const res = await dbClient.query(text, params);
      return { rows: res.rows };
    } else {
      // SQLite: use the existing logic with placeholder conversion
      function convertQuery(query) {
        return query.replace(/\$\d+/g, '?');
      }

      const sql = convertQuery(text);
      // Count the number of placeholders in the converted SQL
      const placeholderCount = (sql.match(/\?/g) || []).length;

      // If we have fewer params than placeholders, pad with null
      if (params.length < placeholderCount) {
        params = [...params, ...Array(placeholderCount - params.length).fill(null)];
      }
      // If we have more, we'll use as is and let the database driver handle excess (which may cause error)

      const stmt = db.prepare(sql);

      // Determine if it's a SELECT query (case-insensitive, ignoring leading whitespace)
      const isSelect = /^\s*select/i.test(text);

      if (isSelect) {
        const rows = stmt.all(...params);
        return { rows };
      } else {
        // For INSERT, UPDATE, DELETE, etc.
        const info = stmt.run(...params);
        // Return empty rows array to match the pg API expectation in routes
        return { rows: [] };
      }
    }
  } catch (err) {
    console.error('Database query error:', err);
    // Reject the promise so the route can handle the error
    return Promise.reject(err);
  }
}

// Attach a prepare method that returns a statement-like object
function prepare(text) {
  if (usePostgres) {
    // For PostgreSQL, return a wrapper that mimics the BetterSqlite3 Statement interface
    return {
      run: async (params) => {
        if (!Array.isArray(params)) params = [params];
        const res = await dbClient.query(text, params);
        // Mimic BetterSqlite3 run result: we return an object with changes and lastInsertRowid if available
        // For INSERT, we can get the inserted id from res.rows[0] if we used RETURNING, but we don't.
        // For simplicity, we return the raw result; the caller may need to adapt.
        return res;
      },
      all: async (params) => {
        if (!Array.isArray(params)) params = [params];
        const res = await dbClient.query(text, params);
        return res.rows;
      },
      // Add get method for convenience (returns first row)
      get: async (params) => {
        if (!Array.isArray(params)) params = [params];
        const res = await dbClient.query(text, params);
        return res.rows[0];
      }
    };
  } else {
    // SQLite: return the native statement
    function convertQuery(query) {
      return query.replace(/\$\d+/g, '?');
    }
    const sql = convertQuery(text);
    return db.prepare(sql);
  }
}

// Export an object that has the query and prepare methods for backward compatibility with route files
const dbModule = {
  query,
  prepare: prepare
};

export default dbModule;

// Export logHistory function (used by other files)
export function logHistory(userId, userName, userRole, action, targetType = '', targetId = null, details = '') {
  if (usePostgres) {
    // Use the query method to insert
    dbModule.query(
      'INSERT INTO platform_history (user_id, user_name, user_role, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, userName, userRole, action, targetType, targetId, details]
    ).catch(err => {
      console.error('Failed to log history:', err);
    });
  } else {
    db.prepare(`INSERT INTO platform_history (user_id, user_name, user_role, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(userId, userName, userRole, action, targetType, targetId, details);
  }
}