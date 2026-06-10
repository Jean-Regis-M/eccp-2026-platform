import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const major = parseInt(process.versions.node.split('.')[0], 10);

console.log(`Node.js v${process.versions.node}`);

if (major > 22) {
  console.error('\n⚠️  Node 24+ is not supported for better-sqlite3 on Windows yet.');
  console.error('   Install Node 22 LTS: https://nodejs.org/en/download (LTS version)');
  console.error('   Or run: winget install OpenJS.NodeJS.LTS\n');
  process.exit(1);
}

try {
  const mod = path.join(__dirname, '..', 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node');
  if (!fs.existsSync(mod)) {
    console.log('Rebuilding better-sqlite3...');
    execSync('npm rebuild better-sqlite3', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  }
  await import('better-sqlite3');
  console.log('✅ Database module OK — run: npm run dev');
} catch (e) {
  console.error('\n❌ better-sqlite3 failed:', e.message);
  console.error('   1. Close ALL terminals running the server (npm run dev / npm start)');
  console.error('   2. Run PowerShell as Administrator in this folder');
  console.error('   3. Run: Remove-Item -Recurse -Force node_modules\\better-sqlite3\\build -ErrorAction SilentlyContinue');
  console.error('   4. Run: npm rebuild better-sqlite3\n');
  process.exit(1);
}
