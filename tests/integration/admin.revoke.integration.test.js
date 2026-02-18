const request = require('supertest');
const app = require('../../src/app');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

describe('integration: admin revoke refresh token', () => {
  const adminEmail = 'revoke-admin@example.com';
  const adminPass = 'RevokeAdmin!2026';
  const userEmail = 'victim@example.com';
  let adminToken;
  let nonAdminToken;
  let tokenRecord;

  beforeAll(async () => {
    // cleanup
    await prisma.token_audit_logs.deleteMany().catch(() => {});
    await prisma.refresh_tokens.deleteMany().catch(() => {});
    await prisma.users.deleteMany({ where: { email: { in: [adminEmail, userEmail] } } }).catch(() => {});

    const adminHash = await bcrypt.hash(adminPass, 10);
    const admin = await prisma.users.create({ data: { email: adminEmail, passwordHash: adminHash, role: 'ADMIN' } });

    const userHash = await bcrypt.hash('UserPass!2026', 10);
    const user = await prisma.users.create({ data: { email: userEmail, passwordHash: userHash, role: 'REPRESENTANTE' } });

    // create a refresh token for the victim user
    tokenRecord = await prisma.refresh_tokens.create({ data: { tokenId: 'testtokenid', tokenHash: await bcrypt.hash('secret', 10), userId: user.id } });

    // get tokens via login
    const ar = await request(app).post('/api/auth/login').send({ email: adminEmail, password: adminPass });
    adminToken = ar.body.accessToken;

    const ur = await request(app).post('/api/auth/login').send({ email: userEmail, password: 'UserPass!2026' });
    nonAdminToken = ur.body.accessToken;
  });

  afterAll(async () => {
    await prisma.token_audit_logs.deleteMany().catch(() => {});
    await prisma.refresh_tokens.deleteMany().catch(() => {});
    await prisma.users.deleteMany({ where: { email: { in: [adminEmail, userEmail] } } }).catch(() => {});
    await prisma.$disconnect();
  });

  test('admin can revoke a refresh token and audit is created', async () => {
    const res = await request(app)
      .post(`/api/admin/refresh-tokens/${tokenRecord.id}/revoke`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'Suspicious activity' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);

    const updated = await prisma.refresh_tokens.findUnique({ where: { id: tokenRecord.id } });
    expect(updated.revoked).toBe(true);

    const audits = await prisma.token_audit_logs.findMany({ where: { tokenId: tokenRecord.tokenId } });
    expect(audits.length).toBeGreaterThan(0);
    expect(audits[0].action).toBe('revoked');
    expect(audits[0].adminUserId).toBeTruthy();
  });

  test('non-admin cannot revoke', async () => {
    const r = await request(app)
      .post(`/api/admin/refresh-tokens/${tokenRecord.id}/revoke`)
      .set('Authorization', `Bearer ${nonAdminToken}`);

    expect(r.statusCode).toBe(403);
  });
});
