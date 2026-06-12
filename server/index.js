import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Enforce production-only allowed origin
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
if (process.env.NODE_ENV === 'production' && !ALLOWED_ORIGIN) {
  console.error('ERROR: ALLOWED_ORIGIN must be set in production');
  process.exit(1);
}

// ... rest of imports ...

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
      connectSrc: ["'self'", ALLOWED_ORIGIN],
    },
  },
}));

app.use(cors({
  origin: ALLOWED_ORIGIN || '*',
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
