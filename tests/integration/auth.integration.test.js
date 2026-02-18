const request = require('supertest');
const app = require('../../src/app');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

describe('integration: auth (login / refresh / logout)', () => {
  const adminEmail = 'int-admin@example.com';
  const adminPass = 'AdminPass!2026';
  let refreshToken1;
  let refreshToken2;

  beforeAll(async () => {
    // Clean users and tokens
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

  test('login returns accessToken and refreshToken', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: adminEmail, password: adminPass });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    refreshToken1 = res.body.refreshToken;
  });

  test('refresh rotates and returns new tokens', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: refreshToken1 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    refreshToken2 = res.body.refreshToken;

    // old token must be invalid now
    const resOld = await request(app).post('/api/auth/refresh').send({ refreshToken: refreshToken1 });
    expect(resOld.statusCode).toBe(401);
  });

  test('logout revokes current refresh token', async () => {
    const res = await request(app).post('/api/auth/logout').send({ refreshToken: refreshToken2 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);

    // trying to refresh with revoked token should fail
    const resAfter = await request(app).post('/api/auth/refresh').send({ refreshToken: refreshToken2 });
    expect(resAfter.statusCode).toBe(401);
  });
});
