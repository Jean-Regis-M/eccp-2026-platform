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

import db from './db.js';
import winston from 'winston';
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'eccp-api' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Environment Validation Layer
const validateEnvironment = () => {
  // Always check for JWT_SECRET; in production it must be set, in dev we can generate a fallback.
  const jwtSecret = process.env.JWT_SECRET;
  console.debug(`[validate] NODE_ENV=${process.env.NODE_ENV}, JWT_SECRET=${!!jwtSecret}`); // eslint-disable-line no-console
  if (!jwtSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ FATAL: JWT_SECRET is not set in environment variables.');
      console.error('   Please set JWT_SECRET before starting the server.');
      process.exit(1);
    } else {
      // Development: generate a temporary secret and warn.
      const secret = crypto.randomBytes(32).toString('base64');
      process.env.JWT_SECRET = secret;
      console.warn('⚠️  JWT_SECRET not set. Generated a temporary secret for development.');
      console.warn('   To persist across restarts, add JWT_SECRET=<your-secret> to a .env file.');
    }
  }

  // In production, also verify other required variables.
  if (process.env.NODE_ENV === 'production') {
    const requiredVars = ['DB_PATH', 'ALLOWED_ORIGIN'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
      console.error('   Please set these variables before starting the server in production.');
      process.exit(1);
    }

    // Warn about SMTP if not set
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️  SMTP_* environment variables are not fully set. Email functionality will be disabled.');
    }
  }
};

validateEnvironment();

// Use ALLOWED_ORIGIN from environment variables if set, otherwise default to '*' for development.
// In production, it MUST be set to a specific origin for security.
const corsOrigin = process.env.NODE_ENV === 'production' ? process.env.ALLOWED_ORIGIN : '*';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Startup banner
console.log('\n🔐 JWT secret loaded.');
console.log(`🚀 Server starting on port ${PORT}`);
console.log(`🌐 Allowed origin: ${corsOrigin}\n`);

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

app.set('trust proxy', 1);

// Proper rate limiter config
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  skip: (req) => req.path === '/api/health',
});
app.use('/api', limiter);

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

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      // Only include stack in non-production
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    }
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
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