import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// Import route files
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import sessionRoutes from './routes/sessions.js';
import quizRoutes from './routes/quizzes.js';
import messageRoutes from './routes/messages.js';
import satRoutes from './routes/sat.js';
import adminRoutes from './routes/admin.js';
import reportRoutes from './routes/reports.js';
import platformRoutes from './routes/platform.js';
import resourceRoutes from './routes/resources.js';

// Environment Validation Layer
const validateEnvironment = () => {
  const warnings = [];

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET) {
      warnings.push('JWT_SECRET is not set. Using a temporary secret. Token validity will not persist across restarts. THIS IS INSECURE FOR PRODUCTION.');
      // Generate a random secret for this instance only
      process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');
    }
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      warnings.push('SMTP_* environment variables are not fully set. Email functionality will be disabled.');
    }
    if (!process.env.DB_PATH) {
      const serverDir = path.dirname(fileURLToPath(import.meta.url));
      const defaultDbPath = path.join(serverDir, 'eccp.db');
      warnings.push(`DB_PATH is not set. Defaulting to ${defaultDbPath}. Data will not persist across restarts without persistent storage.`);
      process.env.DB_PATH = defaultDbPath;
    }
    if (!process.env.ALLOWED_ORIGIN) {
      warnings.push('ALLOWED_ORIGIN is not set. Defaulting to * for CORS. THIS IS INSECURE FOR PRODUCTION.');
      process.env.ALLOWED_ORIGIN = '*';
    }
  }

  return warnings;
};

const environmentWarnings = validateEnvironment();
if (environmentWarnings.length > 0) {
  console.warn('----------------------------------------------------');
  console.warn('Environment Configuration Warnings:');
  environmentWarnings.forEach(warn => console.warn(`- ${warn}`));
  console.warn('Application will start with potential limitations.');
  console.warn('See HOSTING.md for details on setting environment variables for production.');
  console.warn('----------------------------------------------------');
}

// Use ALLOWED_ORIGIN from environment variables if set, otherwise default to '*' for development.
// In production, it MUST be set to a specific origin for security.
const corsOrigin = process.env.NODE_ENV === 'production' ? process.env.ALLOWED_ORIGIN : '*';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Helmet with production-grade CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", corsOrigin],
    },
  },
}));

app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many login attempts' } });
app.use('/api/auth/login', loginLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/sat', satRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/public', express.static(path.join(__dirname, '..', 'public')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', program: 'ECCP 2026', version: '1.0.0' });
});

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath, {
  index: false,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (/\.(js|css|woff2?|png|jpg|svg|ico|webp)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) res.status(200).send('<h1>ECCP Platform API running. Run npm run dev for full app.</h1>');
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  ECCP 2026 Platform Server`);
  console.log(`  ─────────────────────────`);
  console.log(`  API:  http://localhost:${PORT}/api`);
  console.log(`  App:  http://localhost:5173 (dev) or http://localhost:${PORT} (prod)\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use. Close the other server or run:`);
    console.error('   Get-Process node | Stop-Process -Force\n');
  } else {
    console.error('\n❌ Server error:', err.message, '\n');
  }
  process.exit(1);
});