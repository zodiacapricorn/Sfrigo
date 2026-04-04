/* eslint-disable */
const request = require('supertest');

// ─── Mock pg ─────────────────────────────────────────────────────────────────
const mockPgClient = {
  query:   jest.fn(),
  release: jest.fn(),
};
const mockPgPool = {
  query:   jest.fn(),
  connect: jest.fn(() => mockPgClient),
};
jest.mock('pg', () => ({
  Pool: jest.fn(() => mockPgPool),
}));

// ─── Mock mongodb ─────────────────────────────────────────────────────────────
const mockItemsCollection = {
  insertOne:  jest.fn(),
  find:       jest.fn(),
  deleteOne:  jest.fn(),
  deleteMany: jest.fn(),
};
const mockRecipesCollection = {
  insertOne: jest.fn(),
  find:      jest.fn(),
};
const mockMongoDb = {
  collection: jest.fn((name) => {
    if (name === 'recipes') return mockRecipesCollection;
    return mockItemsCollection;
  }),
};
const mockMongoClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  db:      jest.fn(() => mockMongoDb),
};
jest.mock('mongodb', () => ({
  MongoClient: jest.fn(() => mockMongoClient),
  ObjectId:    jest.fn((id) => id),
}));

// Path is now local — test lives inside fridge-service/
const app = require('../index.js');

const USER_ID   = 'user-123';
const OTHER_ID  = 'user-456';
const FRIDGE_ID = '1';

describe('Fridge Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockPgPool.connect.mockReturnValue(mockPgClient);
  });

  // GET /fridges
  describe('GET /fridges', () => {

    test('TC-FS-001 - Ritorna 401 se manca X-User-Id', async () => {
      const res = await request(app).get('/fridges');
      expect(res.status).toBe(401);
    });

    test('TC-FS-002 - Ritorna lista frigoriferi utente', async () => {
      mockPgPool.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Frigo Casa', owner_id: USER_ID, role: 'ADMIN' }]
      });

      const res = await request(app)
        .get('/fridges')
        .set('X-User-Id', USER_ID);

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
        .set('X-User-Id', USER_ID)
        .send({});

      expect(res.status).toBe(400);
    });

    test('TC-FS-004 - Crea frigorifero con successo', async () => {
      mockPgClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ username: 'mario' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Frigo Nuovo', owner_id: USER_ID, owner_username: 'mario', created_at: new Date() }] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      const res = await request(app)
        .post('/fridges')
        .set('X-User-Id', USER_ID)
        .send({ name: 'Frigo Nuovo' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Frigo Nuovo');
    });

    test('TC-FS-004b - Ritorna 404 se utente non trovato durante creazione', async () => {
      mockPgClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({});

      const res = await request(app)
        .post('/fridges')
        .set('X-User-Id', 'user-ghost')
        .send({ name: 'Frigo Fantasma' });

      expect(res.status).toBe(404);
    });

  });

  // GET /fridges/:fridgeId
  describe('GET /fridges/:fridgeId', () => {

    test('TC-FS-012 - Ritorna 403 se non sei membro', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get(`/fridges/${FRIDGE_ID}`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(403);
    });

    test('TC-FS-013 - Ritorna 404 se il frigorifero non esiste', async () => {
      mockPgPool.query
        .mockResolvedValueOnce({ rows: [{ role: 'MEMBER' }] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/fridges/999')
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(404);
    });

    test('TC-FS-014 - Ritorna dettagli frigorifero', async () => {
      mockPgPool.query
        .mockResolvedValueOnce({ rows: [{ role: 'ADMIN' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Frigo Casa', owner_id: USER_ID, owner_username: 'mario', created_at: new Date() }] });

      const res = await request(app)
        .get(`/fridges/${FRIDGE_ID}`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Frigo Casa');
    });

  });


  // DELETE /fridges/:fridgeId
  describe('DELETE /fridges/:fridgeId', () => {

    test('TC-FS-015 - Ritorna 404 se frigorifero non esiste', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .delete('/fridges/999')
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(404);
    });

    test('TC-FS-016 - Ritorna 403 se non sei il proprietario', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [{ owner_id: OTHER_ID }] });

      const res = await request(app)
        .delete(`/fridges/${FRIDGE_ID}`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(403);
    });

    test('TC-FS-017 - Elimina frigorifero con successo', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [{ owner_id: USER_ID }] });
      mockPgClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      const res = await request(app)
        .delete(`/fridges/${FRIDGE_ID}`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(204);
    });

  });


  // GET /fridges/:fridgeId/members
  describe('GET /fridges/:fridgeId/members', () => {

    test('TC-FS-018 - Ritorna 403 se non sei membro', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get(`/fridges/${FRIDGE_ID}/members`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(403);
    });

    test('TC-FS-019 - Ritorna lista membri', async () => {
      mockPgPool.query
        .mockResolvedValueOnce({ rows: [{ role: 'ADMIN' }] })
        .mockResolvedValueOnce({ rows: [
          { id: USER_ID,  username: 'mario', role: 'ADMIN',  joined_at: new Date() },
          { id: OTHER_ID, username: 'luigi', role: 'MEMBER', joined_at: new Date() },
        ]});

      const res = await request(app)
        .get(`/fridges/${FRIDGE_ID}/members`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

  });


  // POST /fridges/:fridgeId/members
  describe('POST /fridges/:fridgeId/members', () => {

    test('TC-FS-020 - Ritorna 400 se manca userId', async () => {
      const res = await request(app)
        .post(`/fridges/${FRIDGE_ID}/members`)
        .set('X-User-Id', USER_ID)
        .send({});

      expect(res.status).toBe(400);
    });

    test('TC-FS-021 - Ritorna 403 se non sei membro del frigo', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post(`/fridges/${FRIDGE_ID}/members`)
        .set('X-User-Id', USER_ID)
        .send({ userId: 'user-789' });

      expect(res.status).toBe(403);
    });

    test('TC-FS-022 - Ritorna 409 se utente è già membro', async () => {
      mockPgPool.query
        .mockResolvedValueOnce({ rows: [{ role: 'ADMIN' }] })
        .mockResolvedValueOnce({ rows: [{ user_id: 'user-789' }] });

      const res = await request(app)
        .post(`/fridges/${FRIDGE_ID}/members`)
        .set('X-User-Id', USER_ID)
        .send({ userId: 'user-789' });

      expect(res.status).toBe(409);
    });

    test('TC-FS-023 - Aggiunge membro con successo', async () => {
      mockPgPool.query
        .mockResolvedValueOnce({ rows: [{ role: 'ADMIN' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ fridge_id: FRIDGE_ID, user_id: 'user-789', role: 'MEMBER' }] });

      const res = await request(app)
        .post(`/fridges/${FRIDGE_ID}/members`)
        .set('X-User-Id', USER_ID)
        .send({ userId: 'user-789', role: 'MEMBER' });

      expect(res.status).toBe(201);
      expect(res.body.role).toBe('MEMBER');
    });

  });

  // DELETE /fridges/:fridgeId/members/me
  describe('DELETE /fridges/:fridgeId/members/me', () => {

    test('TC-FS-024 - Ritorna 404 se non sei membro', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .delete(`/fridges/${FRIDGE_ID}/members/me`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(404);
    });

    test('TC-FS-025 - Ritorna 403 se sei ADMIN', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [{ role: 'ADMIN' }] });

      const res = await request(app)
        .delete(`/fridges/${FRIDGE_ID}/members/me`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(403);
    });

    test('TC-FS-026 - Lascia il frigorifero con successo', async () => {
      mockPgPool.query
        .mockResolvedValueOnce({ rows: [{ role: 'MEMBER' }] })
        .mockResolvedValueOnce({});

      const res = await request(app)
        .delete(`/fridges/${FRIDGE_ID}/members/me`)
        .set('X-User-Id', OTHER_ID);

      expect(res.status).toBe(204);
    });

  });


  // DELETE /fridges/:fridgeId/members/:userId
  describe('DELETE /fridges/:fridgeId/members/:userId', () => {

    test('TC-FS-027 - Ritorna 403 se non sei ADMIN', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [{ role: 'MEMBER' }] });

      const res = await request(app)
        .delete(`/fridges/${FRIDGE_ID}/members/${OTHER_ID}`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(403);
    });

    test('TC-FS-028 - Ritorna 400 se cerchi di espellere te stesso', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [{ role: 'ADMIN' }] });

      const res = await request(app)
        .delete(`/fridges/${FRIDGE_ID}/members/${USER_ID}`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(400);
    });

    test('TC-FS-029 - Ritorna 404 se il membro non esiste', async () => {
      mockPgPool.query
        .mockResolvedValueOnce({ rows: [{ role: 'ADMIN' }] })
        .mockResolvedValueOnce({ rowCount: 0, rows: [] });

      const res = await request(app)
        .delete(`/fridges/${FRIDGE_ID}/members/user-999`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(404);
    });

    test('TC-FS-030 - Espelle membro con successo', async () => {
      mockPgPool.query
        .mockResolvedValueOnce({ rows: [{ role: 'ADMIN' }] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ user_id: OTHER_ID }] });

      const res = await request(app)
        .delete(`/fridges/${FRIDGE_ID}/members/${OTHER_ID}`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(204);
    });

  });

  // POST /fridges/:fridgeId/invites
  describe('POST /fridges/:fridgeId/invites', () => {

    test('TC-FS-031 - Ritorna 403 se non sei ADMIN', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [{ role: 'MEMBER' }] });

      const res = await request(app)
        .post(`/fridges/${FRIDGE_ID}/invites`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(403);
    });

    test('TC-FS-032 - Genera token invito con successo', async () => {
      const expires = new Date(Date.now() + 86400000);
      mockPgPool.query
        .mockResolvedValueOnce({ rows: [{ role: 'ADMIN' }] })
        .mockResolvedValueOnce({ rows: [{ token: 'tok-abc', expires_at: expires }] });

      const res = await request(app)
        .post(`/fridges/${FRIDGE_ID}/invites`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(201);
      expect(res.body.token).toBe('tok-abc');
    });

  });


  // POST /invites/:token/accept
  describe('POST /invites/:token/accept', () => {

    test('TC-FS-033 - Ritorna 404 se il token non esiste', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/invites/token-inesistente/accept')
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(404);
    });

    test('TC-FS-034 - Ritorna 410 se il token è scaduto', async () => {
      const expired = new Date(Date.now() - 1000);
      mockPgPool.query.mockResolvedValueOnce({ rows: [{ fridge_id: FRIDGE_ID, expires_at: expired }] });

      const res = await request(app)
        .post('/invites/token-scaduto/accept')
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(410);
    });

    test('TC-FS-035 - Ritorna 200 con already_member se già membro', async () => {
      const future = new Date(Date.now() + 86400000);
      mockPgPool.query
        .mockResolvedValueOnce({ rows: [{ fridge_id: FRIDGE_ID, expires_at: future }] })
        .mockResolvedValueOnce({ rows: [{ role: 'MEMBER' }] });

      const res = await request(app)
        .post('/invites/token-valido/accept')
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(200);
      expect(res.body.already_member).toBe(true);
    });

    test('TC-FS-036 - Accetta invito e aggiunge al frigo con successo', async () => {
      const future = new Date(Date.now() + 86400000);
      mockPgPool.query
        .mockResolvedValueOnce({ rows: [{ fridge_id: FRIDGE_ID, expires_at: future }] })
        .mockResolvedValueOnce({ rows: [] });

      mockPgClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      const res = await request(app)
        .post('/invites/token-valido/accept')
        .set('X-User-Id', OTHER_ID);

      expect(res.status).toBe(200);
      expect(res.body.fridge_id).toBe(FRIDGE_ID);
    });

  });

  // POST /fridges/:fridgeId/items
  describe('POST /fridges/:fridgeId/items', () => {

    test('TC-FS-005 - Ritorna 403 se non sei membro', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post(`/fridges/${FRIDGE_ID}/items`)
        .set('X-User-Id', USER_ID)
        .send({ name: 'Latte' });

      expect(res.status).toBe(403);
    });

    test('TC-FS-006 - Aggiunge alimento con successo', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [{ role: 'MEMBER' }] });
      mockItemsCollection.insertOne.mockResolvedValueOnce({ insertedId: 'abc123' });

      const res = await request(app)
        .post(`/fridges/${FRIDGE_ID}/items`)
        .set('X-User-Id', USER_ID)
        .send({ name: 'Latte', category: 'Latticini', quantity: 2 });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Latte');
    });

  });


  // GET /fridges/:fridgeId/items
  describe('GET /fridges/:fridgeId/items', () => {

    test('TC-FS-007 - Ritorna 403 se non sei membro', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get(`/fridges/${FRIDGE_ID}/items`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(403);
    });

    test('TC-FS-008 - Ritorna lista alimenti', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [{ role: 'MEMBER' }] });
      mockItemsCollection.find.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValueOnce([
          { _id: 'abc123', name: 'Latte', fridge_id: FRIDGE_ID }
        ])
      });

      const res = await request(app)
        .get(`/fridges/${FRIDGE_ID}/items`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

  });


  // DELETE /fridges/:fridgeId/items/:itemId
  describe('DELETE /fridges/:fridgeId/items/:itemId', () => {

    test('TC-FS-009 - Ritorna 403 se non sei membro', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .delete(`/fridges/${FRIDGE_ID}/items/abc123`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(403);
    });

    test('TC-FS-010 - Ritorna 404 se alimento non trovato', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [{ role: 'MEMBER' }] });
      mockItemsCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 0 });

      const res = await request(app)
        .delete(`/fridges/${FRIDGE_ID}/items/abc123`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(404);
    });

    test('TC-FS-011 - Elimina alimento con successo', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [{ role: 'MEMBER' }] });
      mockItemsCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 1 });

      const res = await request(app)
        .delete(`/fridges/${FRIDGE_ID}/items/abc123`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(204);
    });

  });


  // POST /fridges/:fridgeId/recipe
  describe('POST /fridges/:fridgeId/recipe', () => {

    test('TC-FS-037 - Ritorna 403 se non sei membro', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post(`/fridges/${FRIDGE_ID}/recipe`)
        .set('X-User-Id', USER_ID)
        .send({ recipe_name: 'Pasta', ingredients_used: [], item_ids: [], mode: 'personal' });

      expect(res.status).toBe(403);
    });

    test('TC-FS-038 - Usa ricetta in modalità personal', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [{ role: 'MEMBER' }] });
      mockItemsCollection.deleteMany.mockResolvedValueOnce({ deletedCount: 2 });

      const res = await request(app)
        .post(`/fridges/${FRIDGE_ID}/recipe`)
        .set('X-User-Id', USER_ID)
        .send({
          recipe_name:      'Frittata',
          ingredients_used: [{ name: 'Uova' }, { name: 'Sale' }],
          item_ids:         ['id1', 'id2'],
          mode:             'personal',
        });

      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(2);
    });

    test('TC-FS-039 - Usa ricetta in modalità shared', async () => {
      mockPgPool.query
        .mockResolvedValueOnce({ rows: [{ role: 'MEMBER' }] })
        .mockResolvedValueOnce({ rows: [
          { user_id: USER_ID,  username: 'mario', role: 'ADMIN' },
          { user_id: OTHER_ID, username: 'luigi', role: 'MEMBER' },
        ]});

      mockRecipesCollection.insertOne.mockResolvedValueOnce({});
      mockItemsCollection.deleteMany.mockResolvedValueOnce({ deletedCount: 1 });

      const res = await request(app)
        .post(`/fridges/${FRIDGE_ID}/recipe`)
        .set('X-User-Id', USER_ID)
        .send({
          recipe_name:      'Pizza',
          ingredients_used: [{ name: 'Farina', owner_id: USER_ID }],
          item_ids:         ['id1'],
          mode:             'shared',
        });

      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(1);
    });

  });


  // GET /fridges/:fridgeId/recipe
  describe('GET /fridges/:fridgeId/recipe', () => {

    test('TC-FS-040 - Ritorna 403 se non sei membro', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get(`/fridges/${FRIDGE_ID}/recipe`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(403);
    });

    test('TC-FS-041 - Ritorna storico ricette', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [{ role: 'MEMBER' }] });
      mockRecipesCollection.find.mockReturnValueOnce({
        sort:    jest.fn().mockReturnThis(),
        limit:   jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValueOnce([
          { _id: 'r1', recipe_name: 'Pizza', fridge_id: FRIDGE_ID, used_at: new Date() }
        ]),
      });

      const res = await request(app)
        .get(`/fridges/${FRIDGE_ID}/recipe`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].recipe_name).toBe('Pizza');
    });

  });


  // GET /fridges/:fridgeId/equity
  describe('GET /fridges/:fridgeId/equity', () => {

    test('TC-FS-042 - Ritorna 403 se non sei membro', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get(`/fridges/${FRIDGE_ID}/equity`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(403);
    });

    test('TC-FS-043 - Label "Nessuna partecipazione" per membro senza ricette', async () => {
      mockPgPool.query
        .mockResolvedValueOnce({ rows: [{ role: 'MEMBER' }] })
        .mockResolvedValueOnce({ rows: [{ user_id: USER_ID, username: 'mario', role: 'ADMIN' }] });

      mockRecipesCollection.find.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValueOnce([]),
      });

      const res = await request(app)
        .get(`/fridges/${FRIDGE_ID}/equity`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(200);
      expect(res.body[0].label).toBe('Nessuna partecipazione');
      expect(res.body[0].equity_index).toBeNull();
    });

    test('TC-FS-044 - Calcola equity index per membro con partecipazioni', async () => {
      mockPgPool.query
        .mockResolvedValueOnce({ rows: [{ role: 'MEMBER' }] })
        .mockResolvedValueOnce({ rows: [{ user_id: USER_ID, username: 'mario', role: 'ADMIN' }] });

      mockRecipesCollection.find.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValueOnce([{
          fridge_id:        FRIDGE_ID,
          requested_by:     USER_ID,
          members_snapshot: [{ user_id: USER_ID, username: 'mario', role: 'ADMIN' }],
          ingredients:      [
            { name: 'Uova', owner_id: USER_ID },
            { name: 'Sale', owner_id: USER_ID },
          ],
        }]),
      });

      const res = await request(app)
        .get(`/fridges/${FRIDGE_ID}/equity`)
        .set('X-User-Id', USER_ID);

      expect(res.status).toBe(200);
      expect(res.body[0].recipes_participated).toBe(1);
      expect(res.body[0].equity_index).toBeGreaterThan(0);
    });

  });

});