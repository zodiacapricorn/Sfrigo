/* eslint-disable */
const request = require('supertest');

// Mock pg
jest.mock('pg', () => {
  const mClient = {
    query: jest.fn(),
    release: jest.fn(),
  };
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(() => mClient),
  };
  return { Pool: jest.fn(() => mPool) };
});

// Mock mongodb
jest.mock('mongodb', () => {
  const mCollection = {
    insertOne: jest.fn(),
    find: jest.fn(() => ({ toArray: jest.fn() })),
    deleteOne: jest.fn(),
  };
  const mDb = {
    collection: jest.fn(() => mCollection),
  };
  const mClient = {
    connect: jest.fn(),
    db: jest.fn(() => mDb),
  };
  return {
    MongoClient: jest.fn(() => mClient),
    ObjectId: jest.fn((id) => id),
  };
});

const { Pool } = require('pg');
const pool = new Pool();
const { MongoClient } = require('mongodb');
const mongoClient = new MongoClient();
const mongoDb = mongoClient.db();
const itemsCollection = mongoDb.collection();

const app = require('../api/fridge-service/index.js');

describe('Fridge Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  
  // GET /fridges
  describe('GET /fridges', () => {

    test('TC-FS-001 - Ritorna 401 se manca X-User-Id', async () => {
      const res = await request(app).get('/fridges');
      expect(res.status).toBe(401);
    });

    test('TC-FS-002 - Ritorna lista frigoriferi utente', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Frigo Casa', owner_id: 'user-123', role: 'ADMIN' }]
      });

      const res = await request(app)
        .get('/fridges')
        .set('X-User-Id', 'user-123');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Frigo Casa');
    });

  });


  // POST /fridges
  describe('POST /fridges', () => {

    test('TC-FS-003 - Ritorna 400 se manca il nome', async () => {
      const res = await request(app)
        .post('/fridges')
        .set('X-User-Id', 'user-123')
        .send({});

      expect(res.status).toBe(400);
    });

    test('TC-FS-004 - Crea frigorifero con successo', async () => {
      const mClient = pool.connect();
      mClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Frigo Nuovo', owner_id: 'user-123', created_at: new Date() }] }) // INSERT fridge
        .mockResolvedValueOnce({}) // INSERT member
        .mockResolvedValueOnce({}); // COMMIT

      const res = await request(app)
        .post('/fridges')
        .set('X-User-Id', 'user-123')
        .send({ name: 'Frigo Nuovo' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Frigo Nuovo');
    });

  });

  // POST /fridges/:fridgeId/items
  describe('POST /fridges/:fridgeId/items', () => {

    test('TC-FS-005 - Ritorna 403 se non sei membro del frigo', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // nessuna membership

      const res = await request(app)
        .post('/fridges/1/items')
        .set('X-User-Id', 'user-123')
        .send({ name: 'Latte' });

      expect(res.status).toBe(403);
    });

    test('TC-FS-006 - Aggiunge alimento con successo', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ role: 'MEMBER' }] }); // membership ok
      itemsCollection.insertOne.mockResolvedValueOnce({ insertedId: 'abc123' });

      const res = await request(app)
        .post('/fridges/1/items')
        .set('X-User-Id', 'user-123')
        .send({ name: 'Latte', category: 'Latticini', quantity: 2 });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Latte');
    });

  });

  // GET /fridges/:fridgeId/items
  describe('GET /fridges/:fridgeId/items', () => {

    test('TC-FS-007 - Ritorna 403 se non sei membro', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/fridges/1/items')
        .set('X-User-Id', 'user-123');

      expect(res.status).toBe(403);
    });

    test('TC-FS-008 - Ritorna lista alimenti', async () => {
  pool.query.mockResolvedValueOnce({ rows: [{ role: 'MEMBER' }] });
  
  // Ricrea il mock di find ogni volta
  itemsCollection.find.mockReturnValueOnce({
    toArray: jest.fn().mockResolvedValueOnce([
      { _id: 'abc123', name: 'Latte', fridge_id: '1' }
    ])
  });

  const res = await request(app)
    .get('/fridges/1/items')
    .set('X-User-Id', 'user-123');

  expect(res.status).toBe(200);
  expect(res.body).toHaveLength(1);
});

  });

  // DELETE /fridges/:fridgeId/items/:itemId
  describe('DELETE /fridges/:fridgeId/items/:itemId', () => {

    test('TC-FS-009 - Ritorna 403 se non sei membro', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .delete('/fridges/1/items/abc123')
        .set('X-User-Id', 'user-123');

      expect(res.status).toBe(403);
    });

    test('TC-FS-010 - Ritorna 404 se alimento non trovato', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ role: 'MEMBER' }] });
      itemsCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 0 });

      const res = await request(app)
        .delete('/fridges/1/items/abc123')
        .set('X-User-Id', 'user-123');

      expect(res.status).toBe(404);
    });

    test('TC-FS-011 - Elimina alimento con successo', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ role: 'MEMBER' }] });
      itemsCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 1 });

      const res = await request(app)
        .delete('/fridges/1/items/abc123')
        .set('X-User-Id', 'user-123');

      expect(res.status).toBe(204);
    });

  });

});