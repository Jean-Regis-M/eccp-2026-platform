import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');
const major = parseInt(process.versions.node.split('.')[0], 10);

console.log(`Node.js v${process.versions.node}`);

if (major > 22) {
  console.error('\n⚠️  Node 24+ is not supported for better-sqlite3 on Windows yet.');
  console.error('   Install Node 22 LTS: https://nodejs.org/en/download (LTS version)');
  console.error('   Or run: winget install OpenJS.NodeJS.LTS\n');
  process.exit(1);
}

// Ensure .env exists; if not, create from .env.example and prompt for JWT_SECRET
if (!fs.existsSync(envPath)) {
  if (fs.existsSync(examplePath)) {
    console.log('\n📝 No .env found. Creating from .env.example...');
    fs.copyFileSync(examplePath, envPath);
    console.log('   Created .env from template.');
  } else {
    console.log('\n📝 Creating .env with placeholder values...');
    const secret = crypto.randomBytes(32).toString('base64');
    fs.writeFileSync(
      envPath,
      `# Environment variables for ECCP platform\nJWT_SECRET=${secret}\nDB_PATH=/data/eccp.db\nALLOWED_ORIGIN=https://your-render-app.onrender.com\nSMTP_HOST=your-smtp-host\nSMTP_PORT=587\nSMTP_USER=your-email\nSMTP_PASS=your-password\nPORT=10000\nAPI_PORT=10000\n`
    );
    console.log('   Created .env with generated JWT_SECRET.');
  }
  console.log('   Please review .env and adjust values as needed.\n');
}

// Prompt user to confirm JWT_SECRET is set (optional)
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
rl.question('🔑 Enter JWT_SECRET (leave blank to keep existing/generated): ', (answer) => {
  rl.close();
  if (answer.trim()) {
    // Update .env with provided JWT_SECRET
    let content = fs.readFileSync(envPath, 'utf8');
    content = content.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${answer.trim()}`);
    fs.writeFileSync(envPath, content, 'utf8');
    console.log('   ✅ JWT_SECRET updated.');
  }
});

try {
  const mod = path.join(root, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node');
  if (!fs.existsSync(mod)) {
    console.log('Rebuilding better-sqlite3...');
    execSync('npm rebuild better-sqlite3', { stdio: 'inherit', cwd: root });
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