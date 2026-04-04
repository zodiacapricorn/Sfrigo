const request = require('supertest');

// Mock del database pg prima di importare il servizio
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn()
  };
  return { Pool: jest.fn(() => mPool) };
});

const { Pool } = require('pg');
const pool = new Pool();

// Importo app
const app = require('../index.js');

describe('User Service - POST /users', () => {

  beforeEach(() => {
    jest.clearAllMocks(); // resetta i mock prima di ogni test
  });

  test('TC-US-001 - Ritorna 401 se mancano gli header', async () => {
    const res = await request(app)
      .post('/users')
      .send({ username: 'testuser' });

    expect(res.status).toBe(401);
  });

  test('TC-US-002 - Ritorna 400 se manca username', async () => {
    const res = await request(app)
      .post('/users')
      .set('X-User-Id', 'firebase-uid-123')
      .set('X-User-Email', 'test@test.com')
      .send({});

    expect(res.status).toBe(400);
  });

  test('TC-US-003 - Ritorna 201 se tutto ok', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 'firebase-uid-123',
        username: 'testuser',
        email: 'test@test.com',
        created_at: new Date()
      }]
    });

    const res = await request(app)
      .post('/users')
      .set('X-User-Id', 'firebase-uid-123')
      .set('X-User-Email', 'test@test.com')
      .send({ username: 'testuser' });

    expect(res.status).toBe(201);
    expect(res.body.username).toBe('testuser');
  });

});