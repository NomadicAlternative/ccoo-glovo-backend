const request = require('supertest');
const app = require('../../src/app');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('integration: submissions', () => {
  beforeAll(async () => {
    // Clean relevant tables before running integration tests
    await prisma.attachments.deleteMany().catch(() => {});
    await prisma.casos.deleteMany().catch(() => {});
    await prisma.trabajadores.deleteMany().catch(() => {});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('create submission and retrieve via public token', async () => {
    const payload = { name: 'Test User', email: 'testuser@example.com', category: 'DESPIDO', subject: 'Test', message: 'Prueba' };
    const res = await request(app).post('/api/submissions').send(payload).set('Accept', 'application/json');
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('publicToken');

    const token = res.body.publicToken;
    const getRes = await request(app).get(`/api/submissions/public/${token}`);
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body).toHaveProperty('caso');
    expect(getRes.body.caso).toHaveProperty('id', res.body.id);
  });
});
