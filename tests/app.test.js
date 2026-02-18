const request = require('supertest');
const app = require('../src/app');

describe('app basic routes', () => {
  test('GET / responds with API message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/CCOO Glovo Backend API/);
  });
});
