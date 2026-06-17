/**
 * Starts API server first, waits until healthy, then starts Vite.
 * Fixes "fetch failed" on login when only the frontend was running.
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';

function run(cmd, args, label) {
  return spawn(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: isWin,
    env: process.env,
  });
}

async function waitForApi(maxAttempts = 40) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch('http://127.0.0.1:3001/api/health');
      if (res.ok) {
        console.log('\n✅ API server ready at http://localhost:3001/api\n');
        return;
      }
    } catch {
      // server still starting
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  console.error('\n❌ API server did not start on port 3001.');
  console.error('   Run: npm run setup');
  console.error('   Then: node server/index.js   (check for errors)\n');
  process.exit(1);
}

console.log('\n🚀 Starting ECCP 2026 Platform...\n');
// In production, ensure JWT_SECRET is set before proceeding.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('\n❌ Missing JWT_SECRET in environment variables.');
  console.error('   Create a .env file with JWT_SECRET=... (see .env.example)');
  console.error('   Then run: npm run dev\n');
  process.exit(1);
}

console.log('   Step 1: API server (port 3001)');

const server = run('node', ['server/index.js'], 'server');
server.on('exit', (code) => {
  if (code && code !== 0) {
    console.error(`\n❌ API server exited with code ${code}`);
    process.exit(code);
  }
});

await waitForApi();

console.log('   Step 2: Frontend (port 5173)');
console.log('   Open: http://localhost:5173\n');

const vite = run('npx', ['vite'], 'vite');

const shutdown = () => {
  server.kill();
  vite.kill();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

vite.on('exit', (code) => {
  server.kill();
  process.exit(code || 0);
});
