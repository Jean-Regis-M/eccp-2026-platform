import { fileURLToPath } from 'url';
import path from 'path';
import { promises as fs } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'server', 'eccp.db');

const Database = await import('better-sqlite3');
const db = new Database.default(dbPath);

try {
  // Check if the user exists
  const user = db.prepare('SELECT id, name, email, role, is_active FROM users WHERE email = ?').get('eccpmentor.regismukiza@gmail.com');

  if (user) {
    console.log('User found:', user);
  } else {
    console.log('User not found with email: eccpmentor.regismukiza@gmail.com');

    // Let's see what users are in the database
    const allUsers = db.prepare('SELECT id, name, email, role, is_active FROM users').all();
    console.log('All users in database:');
    console.log(allUsers);
  }
} catch (err) {
  console.error('Error querying database:', err);
} finally {
  db.close();
}