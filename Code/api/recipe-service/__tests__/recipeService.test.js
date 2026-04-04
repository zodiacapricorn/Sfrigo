/* eslint-disable */
const request = require('supertest');

// Mock axios 
jest.mock('axios');
const axios = require('axios');

const app = require('../index.js');

describe('Recipe Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Middleware
  describe('Middleware autenticazione', () => {

    test('TC-RS-001 - Ritorna 401 se manca X-User-Id', async () => {
      const res = await request(app)
        .post('/recipes')
        .send({ messages: [{ role: 'user', content: 'ciao' }] });

      expect(res.status).toBe(401);
    });

  });


 
  // POST /recipes, validazione input
  describe('POST /recipes — validazione input', () => {

    test('TC-RS-002 - Ritorna 400 se messages manca', async () => {
      const res = await request(app)
        .post('/recipes')
        .set('X-User-Id', 'user-123')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('messages è obbligatorio');
    });

    test('TC-RS-003 - Ritorna 400 se messages non è un array', async () => {
      const res = await request(app)
        .post('/recipes')
        .set('X-User-Id', 'user-123')
        .send({ messages: 'ciao' });

      expect(res.status).toBe(400);
    });

    test('TC-RS-004 - Ritorna 400 se messages è un array vuoto', async () => {
      const res = await request(app)
        .post('/recipes')
        .set('X-User-Id', 'user-123')
        .send({ messages: [] });

      expect(res.status).toBe(400);
    });

  });


  // POST /recipes, OpenAI

  describe('POST /recipes — integrazione OpenAI (mockata)', () => {

    test('TC-RS-005 - Ritorna risposta OpenAI con successo', async () => {
      const fakeOpenAIResponse = {
        data: {
          id: 'chatcmpl-abc123',
          object: 'chat.completion',
          choices: [{
            message: {
              role: 'assistant',
              content: 'Puoi fare una frittata con uova e formaggio.',
            },
            finish_reason: 'stop',
          }],
          usage: { prompt_tokens: 20, completion_tokens: 15, total_tokens: 35 },
        }
      };

      axios.post.mockResolvedValueOnce(fakeOpenAIResponse);

      const res = await request(app)
        .post('/recipes')
        .set('X-User-Id', 'user-123')
        .send({
          messages: [
            { role: 'system', content: 'Sei un assistente culinario.' },
            { role: 'user', content: 'Ho uova e formaggio, cosa cucino?' }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.choices[0].message.content).toContain('frittata');
    });

    test('TC-RS-006 - Chiama OpenAI con il modello corretto (gpt-4o-mini)', async () => {
      axios.post.mockResolvedValueOnce({ data: { choices: [] } });

      await request(app)
        .post('/recipes')
        .set('X-User-Id', 'user-123')
        .send({ messages: [{ role: 'user', content: 'test' }] });

      // Verifica che il body inviato a OpenAI contenga il modello atteso
      const callBody = axios.post.mock.calls[0][1];
      expect(callBody.model).toBe('gpt-4o-mini');
      expect(callBody.max_tokens).toBe(1000);
    });

    test('TC-RS-007 - Inoltra esattamente i messages ricevuti a OpenAI', async () => {
      axios.post.mockResolvedValueOnce({ data: { choices: [] } });

      const messages = [
        { role: 'system', content: 'Sei un cuoco.' },
        { role: 'user', content: 'Cosa faccio con il latte?' }
      ];

      await request(app)
        .post('/recipes')
        .set('X-User-Id', 'user-123')
        .send({ messages });

      const callBody = axios.post.mock.calls[0][1];
      expect(callBody.messages).toEqual(messages);
    });

    test('TC-RS-008 - Ritorna 401 se OpenAI risponde con errore 401', async () => {
      const error = {
        response: {
          status: 401,
          data: { error: { message: 'Invalid API key' } }
        }
      };
      axios.post.mockRejectedValueOnce(error);

      const res = await request(app)
        .post('/recipes')
        .set('X-User-Id', 'user-123')
        .send({ messages: [{ role: 'user', content: 'test' }] });

      expect(res.status).toBe(401);
    });

    test('TC-RS-009 - Ritorna 429 se OpenAI risponde con rate limit', async () => {
      const error = {
        response: {
          status: 429,
          data: { error: { message: 'Rate limit exceeded' } }
        }
      };
      axios.post.mockRejectedValueOnce(error);

      const res = await request(app)
        .post('/recipes')
        .set('X-User-Id', 'user-123')
        .send({ messages: [{ role: 'user', content: 'test' }] });

      expect(res.status).toBe(429);
    });

    test('TC-RS-010 - Ritorna 500 in caso di errore di rete (senza response)', async () => {
      axios.post.mockRejectedValueOnce(new Error('Network error'));

      const res = await request(app)
        .post('/recipes')
        .set('X-User-Id', 'user-123')
        .send({ messages: [{ role: 'user', content: 'test' }] });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Errore nella generazione ricette');
    });

  });

});
