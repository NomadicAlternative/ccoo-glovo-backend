const request = require('supertest');
const app = require('../../src/app');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

describe('integration: attachments (upload + protected download)', () => {
  const adminEmail = 'attach-admin@example.com';
  const adminPass = 'AttachPass!2026';
  let accessToken;
  let casoId;
  let attachmentId;

  beforeAll(async () => {
    // Clean DB
    await prisma.refresh_tokens.deleteMany().catch(() => {});
    await prisma.attachments.deleteMany().catch(() => {});
    await prisma.casos.deleteMany().catch(() => {});
    await prisma.trabajadores.deleteMany().catch(() => {});
    await prisma.users.deleteMany({ where: { email: adminEmail } }).catch(() => {});

    const hash = await bcrypt.hash(adminPass, 10);
    await prisma.users.create({ data: { email: adminEmail, passwordHash: hash, role: 'ADMIN' } });

    // create trabajador and caso
    const trabajador = await prisma.trabajadores.create({ data: { nombre: 'Adj Test', email: 'adj@example.com' } });
    const caso = await prisma.casos.create({ data: { trabajador_id: trabajador.id, tipo_problema: 'otro', descripcion: 'Adj test', estado: 'pendiente' } });
    casoId = caso.id;
  });

  afterAll(async () => {
    await prisma.attachments.deleteMany().catch(() => {});
    await prisma.casos.deleteMany().catch(() => {});
    await prisma.trabajadores.deleteMany().catch(() => {});
    await prisma.users.deleteMany({ where: { email: adminEmail } }).catch(() => {});
    await prisma.$disconnect();
  });

  test('login as admin and upload attachment', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: adminEmail, password: adminPass });
    expect(r.statusCode).toBe(200);
    accessToken = r.body.accessToken;
    expect(accessToken).toBeTruthy();

    // Upload a small file (pdf). Use a Buffer and filename 'test.pdf'
    const fileBuffer = Buffer.from('hello-attachment');
    const uploadRes = await request(app)
      .post(`/api/submissions/${casoId}/attachments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', fileBuffer, 'test.pdf');

    expect(uploadRes.statusCode).toBe(201);
    expect(uploadRes.body).toHaveProperty('id');
    expect(uploadRes.body).toHaveProperty('url');
    attachmentId = uploadRes.body.id;
  });

  test('download attachment with auth', async () => {
    const res = await request(app)
      .get(`/api/attachments/${attachmentId}/download`)
      .set('Authorization', `Bearer ${accessToken}`)
      .buffer(true);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="/);
    // body should contain the bytes we uploaded
    const body = res.body && Buffer.isBuffer(res.body) ? res.body.toString('utf8') : '';
    expect(body).toContain('hello-attachment');
  });
});
