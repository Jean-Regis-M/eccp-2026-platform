import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRoutes from '../../server/routes/auth.js';

// Mock dependencies before importing routes if possible,
// or ensure the module under test is properly mocked.
vi.mock('../../server/db.js', () => ({
  default: {
    prepare: vi.fn().mockReturnValue({
      run: vi.fn(),
      get: vi.fn().mockReturnValue({ c: 0 }),
      all: vi.fn(),
    }),
    exec: vi.fn(),
  },
  logHistory: vi.fn(),
}));

vi.mock('../../server/middleware/auth.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
  },
  generateToken: () => 'mock-token',
}));

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth API', () => {
  it('should return 400 when login data is missing', async () => {
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Identifier, password, and role are required');
  });
});
