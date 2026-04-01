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
      SELECT f.id, f.name, f.owner_id, f.owner_username, f.created_at, fm.role 
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

// GET /fridges/:fridgeId/members - Lista dei membri di un frigorifero
app.get('/fridges/:fridgeId/members', async (req, res) => {
  const { fridgeId } = req.params;
  try {
    const membership = await checkFridgeMembership(fridgeId, req.userId);
    if (!membership)
      return res.status(403).json({ error: 'Non hai accesso a questo frigorifero' });

    const result = await pgPool.query(
      `SELECT u.id, u.username, fm.role, fm.joined_at
       FROM fridge_members fm
       JOIN users u ON fm.user_id = u.id
       WHERE fm.fridge_id = $1
       ORDER BY fm.joined_at ASC`,
      [fridgeId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore nel recupero dei membri' });
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

// DELETE /fridges/:fridgeId/members/me — lascia il frigorifero
app.delete('/fridges/:fridgeId/members/me', async (req, res) => {
  const { fridgeId } = req.params;
  try {
    const membership = await checkFridgeMembership(fridgeId, req.userId);
    if (!membership)
      return res.status(404).json({ error: 'Non sei membro di questo frigorifero' });
    if (membership.role === 'ADMIN')
      return res.status(403).json({ error: 'Il proprietario non può lasciare il frigorifero. Eliminalo invece.' });

    await pgPool.query(
      'DELETE FROM fridge_members WHERE fridge_id = $1 AND user_id = $2',
      [fridgeId, req.userId]
    );
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore durante l\'uscita dal frigorifero' });
  }
});

// DELETE /fridges/:fridgeId/members/:userId — espelli membro
app.delete('/fridges/:fridgeId/members/:userId', async (req, res) => {
  const { fridgeId, userId } = req.params;
  try {
    const membership = await checkFridgeMembership(fridgeId, req.userId);
    if (!membership || membership.role !== 'ADMIN')
      return res.status(403).json({ error: 'Solo il proprietario può espellere membri' });
    if (userId === req.userId)
      return res.status(400).json({ error: 'Non puoi espellere te stesso' });

    const result = await pgPool.query(
      'DELETE FROM fridge_members WHERE fridge_id = $1 AND user_id = $2 RETURNING user_id',
      [fridgeId, userId]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: 'Membro non trovato' });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore durante l\'espulsione del membro' });
  }
});

// POST /fridges - Creazione Frigorifero (Transazione SQL)
app.post('/fridges', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Il nome del frigorifero è obbligatorio' });

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    // Recupera username del proprietario
    const userResult = await client.query(
      'SELECT username FROM users WHERE id = $1',
      [req.userId]
    );
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    const ownerUsername = userResult.rows[0].username;

    const fridgeResult = await client.query(
      `INSERT INTO fridges (name, owner_id, owner_username)
       VALUES ($1, $2, $3) RETURNING id, name, owner_id, owner_username, created_at`,
      [name, req.userId, ownerUsername]
    );
    const newFridge = fridgeResult.rows[0];

    await client.query(
      `INSERT INTO fridge_members (fridge_id, user_id, role) VALUES ($1, $2, 'ADMIN')`,
      [newFridge.id, req.userId]
    );

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
      'SELECT id, name, owner_id, owner_username, created_at FROM fridges WHERE id = $1',
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

// POST /fridges/:fridgeId/recipe - Usa ricetta e aggiorna inventario
app.post('/fridges/:fridgeId/recipe', async (req, res) => {
  const { fridgeId } = req.params;
  const { recipe_name, ingredients_used, item_ids, mode } = req.body;

  try {
    const membership = await checkFridgeMembership(fridgeId, req.userId);
    if (!membership)
      return res.status(403).json({ error: 'Non hai accesso a questo frigorifero' });

    const itemsCollection = mongoDb.collection('items');
    const recipeUsesCollection = mongoDb.collection('recipes');

    if (mode === "shared") {

      const membersResult = await pgPool.query(
        `SELECT fm.user_id, fm.role, u.username
         FROM fridge_members fm
         JOIN users u ON fm.user_id = u.id
         WHERE fm.fridge_id = $1`,
        [fridgeId]
      );

      const members_snapshot = membersResult.rows.map(m => ({
        user_id: m.user_id,
        username: m.username,
        role: m.role,
      }));

      await recipeUsesCollection.insertOne({
        fridge_id: fridgeId,
        recipe_name,
        requested_by: req.userId,
        used_at: new Date(),
        ingredients: ingredients_used,
        members_snapshot,
      });
    }

    await itemsCollection.deleteMany({
      _id: { $in: item_ids.map(id => new ObjectId(id)) },
      fridge_id: fridgeId,
    });

    res.status(200).json({ deleted: item_ids.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore durante l\'utilizzo della ricetta' });
  }
});

// GET /fridges/:fridgeId/recipe — storico utilizzi ricette
app.get('/fridges/:fridgeId/recipe', async (req, res) => {
  const { fridgeId } = req.params;
  try {
    const membership = await checkFridgeMembership(fridgeId, req.userId);
    if (!membership)
      return res.status(403).json({ error: 'Non hai accesso a questo frigorifero' });

    const recipeUsesCollection = mongoDb.collection('recipes');
    const uses = await recipeUsesCollection
      .find({ fridge_id: fridgeId })
      .sort({ used_at: -1 })
      .limit(50)
      .toArray();

    res.json(uses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore nel recupero dello storico ricette' });
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
      _id: new ObjectId(itemId), fridge_id: fridgeId
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

// GET /fridges/:fridgeId/equity - Calcola equità membri
app.get('/fridges/:fridgeId/equity', async (req, res) => {
  const { fridgeId } = req.params;
  try {
    const membership = await checkFridgeMembership(fridgeId, req.userId);
    if (!membership)
      return res.status(403).json({ error: 'Non hai accesso a questo frigorifero' });

    // Recupera tutti i membri attuali del frigo
    const membersResult = await pgPool.query(
      `SELECT fm.user_id, u.username, fm.role
       FROM fridge_members fm
       JOIN users u ON fm.user_id = u.id
       WHERE fm.fridge_id = $1`,
      [fridgeId]
    );

    // Recupera tutte le ricette condivise del frigo
    const recipes = await mongoDb.collection('recipes')
      .find({ fridge_id: fridgeId })
      .toArray();

    // Inizializza struttura dati per ogni membro
    const stats = {};
    for (const m of membersResult.rows) {
      stats[m.user_id] = {
        user_id: m.user_id,
        username: m.username,
        role: m.role,
        recipes_participated: 0,   // R_u
        ingredients_provided: 0,   // C_u
        total_ingredients: 0,   // T_u (somma ingredienti in ricette a cui ha partecipato)
        members_per_recipe: [],  // per calcolare expected_rate
      };
    }

    // Calcola statistiche per ogni ricetta
    for (const recipe of recipes) {
      const snapshot = recipe.members_snapshot || [];
      const ingredients = recipe.ingredients || [];
      const memberCount = snapshot.length;
      const totalIngr = ingredients.length;

      for (const member of snapshot) {
        const uid = member.user_id;
        if (!stats[uid]) continue; // membro non più nel frigo, skippa

        stats[uid].recipes_participated += 1;
        stats[uid].total_ingredients += totalIngr;
        stats[uid].members_per_recipe.push(memberCount);

        // Conta quanti ingredienti di sua proprietà sono in questa ricetta
        const provided = ingredients.filter(i => i.owner_id === uid).length;
        stats[uid].ingredients_provided += provided;
      }
    }

    // Calcola equity index per ogni membro
    const result = Object.values(stats).map(u => {
      const R = u.recipes_participated;
      const C = u.ingredients_provided;
      const T = u.total_ingredients;

      // Nessuna partecipazione ancora
      if (R === 0) {
        return {
          user_id: u.user_id,
          username: u.username,
          role: u.role,
          recipes_participated: 0,
          ingredients_provided: 0,
          contribution_rate: null,
          equity_index: null,
          confidence: 0,
          display_score: null,
          label: "Nessuna partecipazione",
          color: "gray",
        };
      }

      // Contribution rate: % ingredienti propri sul totale delle ricette a cui ha partecipato
      const contribution_rate = T > 0 ? C / T : 0;

      // Expected rate: media di 1/members nelle ricette a cui ha partecipato
      const expected_rate = u.members_per_recipe.reduce((sum, n) => sum + (1 / n), 0) / R;

      // Equity index: quanto contribuisce rispetto all'atteso
      const equity_index = expected_rate > 0
        ? parseFloat((contribution_rate / expected_rate).toFixed(3))
        : 0;

      // Confidence: peso basato sul numero di ricette partecipate
      // Si avvicina a 1 dopo molte ricette, bassa con poche
      const confidence = parseFloat((1 - Math.exp(-R / 3)).toFixed(3));

      const display_score = parseFloat((equity_index * confidence).toFixed(3));

      // Etichetta
      let label, color;
      if (display_score >= 1.1) { label = "Contribuisce troppo"; color = "lightblue"; }
      else if (display_score >= 0.9) { label = "In equilibrio"; color = "green"; }
      else if (display_score >= 0.6) { label = "Contribuisce poco"; color = "yellow"; }
      else if (display_score >= 0.3) { label = "Contribuisce raramente"; color = "orange"; }
      else { label = "Non contribuisce"; color = "red"; }

      return {
        user_id: u.user_id,
        username: u.username,
        role: u.role,
        recipes_participated: R,
        ingredients_provided: C,
        contribution_rate: parseFloat(contribution_rate.toFixed(3)),
        equity_index,
        confidence,
        display_score,
        label,
        color,
      };
    });

    // Ordina per display_score decrescente (null in fondo)
    result.sort((a, b) => {
      if (a.display_score === null) return 1;
      if (b.display_score === null) return -1;
      return b.display_score - a.display_score;
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore nel calcolo dell\'equità' });
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