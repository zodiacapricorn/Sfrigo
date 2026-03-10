require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

// --- CONNESSIONI AI DATABASE ---

// 1. PostgreSQL (Permessi, Utenti, Frigoriferi)
const pgPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// 2. MongoDB (Inventario)
const mongoClient = new MongoClient(process.env.MONGO_URI);
let mongoDb;

// Inizializza MongoDB all'avvio
async function connectMongo() {
  try {
    await mongoClient.connect();
    mongoDb = mongoClient.db(process.env.MONGO_DB_NAME || 'sfrigo');
    console.log('Connesso a MongoDB con successo!');
  } catch (error) {
    console.error('Errore connessione MongoDB:', error);
  }
}
connectMongo();


// --- MIDDLEWARE INTERNO ---
const extractUserId = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({ error: 'Accesso negato: Header X-User-Id mancante dal Gateway' });
  }
  
  req.userId = userId;
  next();
};
app.use(extractUserId);


// --- FUNZIONI HELPER ---

// Verifica se l'utente è membro di un frigorifero in PostgreSQL
async function checkFridgeMembership(fridgeId, userId) {
  const query = 'SELECT role FROM fridge_members WHERE fridge_id = $1 AND user_id = $2';
  const result = await pgPool.query(query, [fridgeId, userId]);
  return result.rows[0];
}

// ==========================================
// ROTTE POSTGRES (Gestione Frigoriferi)
// ==========================================

// GET /fridges - Lista dei frigoriferi dell'utente
app.get('/fridges', async (req, res) => {
  try {
    const query = `
      SELECT f.id, f.name, f.owner_id, f.created_at, fm.role 
      FROM fridges f
      JOIN fridge_members fm ON f.id = fm.fridge_id
      WHERE fm.user_id = $1
    `;
    const result = await pgPool.query(query, [req.userId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore nel recupero dei frigoriferi' });
  }
});

// POST /fridges/:fridgeId/members - Aggiungi membro
app.post('/fridges/:fridgeId/members', async (req, res) => {
  const { fridgeId } = req.params;
  const { userId, role } = req.body; // utente da aggiungere

  if (!userId) {
    return res.status(400).json({ error: 'userId è obbligatorio' });
  }

  try {

    // verifica che sia membro
    const membership = await checkFridgeMembership(fridgeId, req.userId);

    if (!membership) {
      return res.status(403).json({
        error: 'Non sei membro di questo frigorifero'
      });
    }

    /* funzione se vogliamo solo che l'admin posso aggiungere membri
    if (membership.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Solo un ADMIN può aggiungere nuovi membri'
      });
    }*/

    // controlla se l'utente è già membro
    const existingMemberQuery = `
      SELECT * FROM fridge_members
      WHERE fridge_id = $1 AND user_id = $2
    `;

    const existingMember = await pgPool.query(existingMemberQuery, [fridgeId, userId]);

    if (existingMember.rows.length > 0) {
      return res.status(409).json({
        error: 'L\'utente è già membro di questo frigorifero'
      });
    }

    // inserimento nuovo membro
    const insertQuery = `
      INSERT INTO fridge_members (fridge_id, user_id, role)
      VALUES ($1, $2, $3)
      RETURNING fridge_id, user_id, role
    `;

    const newMember = await pgPool.query(insertQuery, [
      fridgeId,
      userId,
      role || 'MEMBER'
    ]);

    res.status(201).json(newMember.rows[0]);

  } catch (error) {
    console.error('Errore aggiunta membro:', error);
    res.status(500).json({
      error: 'Errore durante l\'aggiunta del membro'
    });
  }
});

// POST /fridges - Creazione Frigorifero (Transazione SQL)
app.post('/fridges', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Il nome del frigorifero è obbligatorio' });

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN'); // Inizio Transazione

    const insertFridgeQuery = `
      INSERT INTO fridges (name, owner_id) 
      VALUES ($1, $2) RETURNING id, name, owner_id, created_at
    `;
    const fridgeResult = await client.query(insertFridgeQuery, [name, req.userId]);
    const newFridge = fridgeResult.rows[0];

    const insertMemberQuery = `
      INSERT INTO fridge_members (fridge_id, user_id, role) 
      VALUES ($1, $2, 'ADMIN')
    `;
    await client.query(insertMemberQuery, [newFridge.id, req.userId]);

    await client.query('COMMIT');
    res.status(201).json(newFridge);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Errore creazione frigo:', error);
    res.status(500).json({ error: 'Errore durante la creazione del frigorifero' });
  } finally {
    client.release();
  }
});

// GET /fridges/:fridgeId - Id Frigorifero
app.get('/fridges/:fridgeId', async (req, res) => {
  const { fridgeId } = req.params;
  try {
    const membership = await checkFridgeMembership(fridgeId, req.userId);
    if (!membership) return res.status(403).json({ error: 'Non hai accesso a questo frigorifero' });

    const result = await pgPool.query(
      'SELECT id, name, owner_id, created_at FROM fridges WHERE id = $1',
      [fridgeId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Frigorifero non trovato' });

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore nel recupero del frigorifero' });
  }
});

// DELETE /fridges/:fridgeId - Elimina frigorifero
app.delete('/fridges/:fridgeId', async (req, res) => {
  const { fridgeId } = req.params;
  const client = await pgPool.connect();
  try {
    // Verifica che sia il proprietario
    const ownerCheck = await pgPool.query(
      'SELECT owner_id FROM fridges WHERE id = $1',
      [fridgeId]
    );
    if (ownerCheck.rows.length === 0)
      return res.status(404).json({ error: 'Frigorifero non trovato' });
    if (ownerCheck.rows[0].owner_id !== req.userId)
      return res.status(403).json({ error: 'Solo il proprietario può eliminare il frigorifero' });

    await client.query('BEGIN');
    // fridge_members ha ON DELETE CASCADE, si elimina da solo
    await client.query('DELETE FROM fridges WHERE id = $1', [fridgeId]);
    await client.query('COMMIT');

    res.status(204).send();
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Errore eliminazione frigo:', error);
    res.status(500).json({ error: 'Errore durante l\'eliminazione del frigorifero' });
  } finally {
    client.release();
  }
});

// POST /fridges/:fridgeId/invites — genera token invite
app.post('/fridges/:fridgeId/invites', async (req, res) => {
  const { fridgeId } = req.params;
  try {
    const membership = await checkFridgeMembership(fridgeId, req.userId);
    if (!membership || membership.role !== 'ADMIN')
      return res.status(403).json({ error: 'Solo un ADMIN può generare inviti' });

    const result = await pgPool.query(
      `INSERT INTO fridge_invitations (fridge_id, created_by)
       VALUES ($1, $2)
       RETURNING token, expires_at`,
      [fridgeId, req.userId]
    );

    const { token, expires_at } = result.rows[0];
    res.status(201).json({ token, expires_at });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore nella generazione dell\'invito' });
  }
});

// POST /invites/:token/accept — accetta invito e aggiunge al frigo
app.post('/invites/:token/accept', async (req, res) => {
  const { token } = req.params;
  const client = await pgPool.connect();
  try {
    const inviteResult = await pgPool.query(
      `SELECT fridge_id, expires_at FROM fridge_invitations
       WHERE token = $1`,
      [token]
    );

    if (inviteResult.rows.length === 0)
      return res.status(404).json({ error: 'Invito non trovato' });

    const invite = inviteResult.rows[0];

    if (new Date() > new Date(invite.expires_at))
      return res.status(410).json({ error: 'Invito scaduto' });

    const existing = await checkFridgeMembership(invite.fridge_id, req.userId);
    if (existing)
      return res.status(200).json({ fridge_id: invite.fridge_id, already_member: true });

    await client.query('BEGIN');
    await client.query(
      `INSERT INTO fridge_members (fridge_id, user_id, role) VALUES ($1, $2, 'MEMBER')`,
      [invite.fridge_id, req.userId]
    );
    await client.query('COMMIT');

    res.status(200).json({ fridge_id: invite.fridge_id });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Errore nell\'accettazione dell\'invito' });
  } finally {
    client.release();
  }
});

// ==========================================
// ROTTE MONGODB (Gestione Inventario)
// ==========================================

// POST /fridges/:fridgeId/items - Aggiungi alimento
app.post('/fridges/:fridgeId/items', async (req, res) => {
  const { fridgeId } = req.params;
  
  try {
    const membership = await checkFridgeMembership(fridgeId, req.userId);
    if (!membership) {
      return res.status(403).json({ error: 'Non hai i permessi per accedere a questo frigorifero' });
    }

    const itemsCollection = mongoDb.collection('items');
    
    const newItem = {
      fridge_id: fridgeId,
      owner_id: req.userId,
      name: req.body.name,
      category: req.body.category || 'Altro',
      quantity: req.body.quantity || 1,
      unit: req.body.unit || 'pezzi',
      expiration_date: req.body.expiration_date ? new Date(req.body.expiration_date) : null,
      brand: req.body.brand || '',
      notes: req.body.notes || '',
      sharing_status: {
        is_common_use: req.body.sharing_status?.is_common_use || false,
        is_available_for_loan: req.body.sharing_status?.is_available_for_loan || false
      },
      inserted_at: new Date()
    };

    const result = await itemsCollection.insertOne(newItem);
    
    res.status(201).json({ _id: result.insertedId, ...newItem });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore nell\'aggiunta dell\'alimento' });
  }
});

// GET /fridges/:fridgeId/items - Mostra alimenti
app.get('/fridges/:fridgeId/items', async (req, res) => {
  const { fridgeId } = req.params;

  try {
    const membership = await checkFridgeMembership(fridgeId, req.userId);
    if (!membership) {
      return res.status(403).json({ error: 'Non hai i permessi per accedere a questo frigorifero' });
    }

    const itemsCollection = mongoDb.collection('items');
    const items = await itemsCollection.find({ fridge_id: fridgeId }).toArray();
    
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore nel recupero degli alimenti' });
  }
});

// DELETE /fridges/:fridgeId/items/:itemId - Rimuovi alimento
app.delete('/fridges/:fridgeId/items/:itemId', async (req, res) => {
  const { fridgeId, itemId } = req.params;

  try {
    const membership = await checkFridgeMembership(fridgeId, req.userId);
    if (!membership) {
      return res.status(403).json({ error: 'Non hai i permessi per accedere a questo frigorifero' });
    }

    const itemsCollection = mongoDb.collection('items');
    const result = await itemsCollection.deleteOne({ 
      _id: new ObjectId(itemId), 
      fridge_id: fridgeId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Alimento non trovato' });
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore nell\'eliminazione dell\'alimento' });
  }
});

/**
 * @description Esporta l'app Express per i test con Jest/Supertest.
 * se il index.js viene chiamata da node, si avvia il server normalmente,
 * se invece viene chiamato da jest allora passa l'app a jest senza avviare il server.
 */
const PORT = process.env.PORT || 8082;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Fridge Service in esecuzione sulla porta ${PORT}`);
  });
}

module.exports = app;