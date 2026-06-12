import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Helper to execute SQL
export const query = (text, params) => pool.query(text, params);

// Initialization - simple check for main table to ensure connection works
const init = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
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
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        must_change_password BOOLEAN DEFAULT FALSE
      );
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id SERIAL PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
        revoked_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Database connected to PostgreSQL');
  } catch (err) {
    console.error('Database connection error', err);
    process.exit(1);
  }
};

init();

export default { query };
