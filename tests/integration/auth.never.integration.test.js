// Set env before loading app so auth uses 'never' behavior
process.env.JWT_EXPIRES_IN = 'never';

const request = require('supertest');
const app = require('../../src/app');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

describe("integration: auth with JWT_EXPIRES_IN='never'", () => {
  const adminEmail = 'never-admin@example.com';
  const adminPass = 'NeverPass!2026';
  let refreshToken1;

  beforeAll(async () => {
    await prisma.refresh_tokens.deleteMany().catch(() => {});
    await prisma.users.deleteMany({ where: { email: adminEmail } }).catch(() => {});
    const hash = await bcrypt.hash(adminPass, 10);
    await prisma.users.create({ data: { email: adminEmail, passwordHash: hash, role: 'ADMIN' } });
  });

  afterAll(async () => {
    await prisma.refresh_tokens.deleteMany().catch(() => {});
    await prisma.users.deleteMany({ where: { email: adminEmail } }).catch(() => {});
    await prisma.$disconnect();
  });

  test('login returns accessToken without exp claim and refresh works', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: adminEmail, password: adminPass });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    const accessToken = res.body.accessToken;
    refreshToken1 = res.body.refreshToken;

    const decoded = jwt.decode(accessToken);
    // when JWT_EXPIRES_IN='never' we shouldn't have an exp claim
    expect(decoded).toBeTruthy();
    expect(decoded).not.toHaveProperty('exp');

    // now refresh and ensure new access token also has no exp
    const r = await request(app).post('/api/auth/refresh').send({ refreshToken: refreshToken1 });
    expect(r.statusCode).toBe(200);
    expect(r.body).toHaveProperty('accessToken');
    expect(r.body).toHaveProperty('refreshToken');
    const decoded2 = jwt.decode(r.body.accessToken);
    expect(decoded2).toBeTruthy();
    expect(decoded2).not.toHaveProperty('exp');
  });
});
