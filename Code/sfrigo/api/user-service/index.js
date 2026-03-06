require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Endpoint: POST /users
app.post('/users', async (req, res) => {
  const firebaseUid = req.headers['x-user-id']; 
  const email = req.headers['x-user-email'];
  
  const { username } = req.body;

  if (!firebaseUid || !email) {
    return res.status(401).json({ error: 'Accesso negato: Header di autenticazione mancanti' });
  }
  if (!username) {
    return res.status(400).json({ error: 'Lo username è obbligatorio' });
  }

  try {
    const upsertQuery = `
      INSERT INTO users (id, email, username)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) 
      DO UPDATE SET 
        username = EXCLUDED.username,
        email = EXCLUDED.email
      RETURNING id, username, email, created_at;
    `;
    
    const values = [firebaseUid, email, username];
    const result = await pool.query(upsertQuery, values);

    const user = result.rows[0];

    return res.status(201).json(user);

  } catch (error) {
    console.error('Errore DB durante la registrazione:', error);
    
    if (error.code === '23505' && error.constraint === 'users_username_key') {
        return res.status(409).json({ error: 'Questo username è già in uso da un altro utente.' });
    }

    return res.status(500).json({ error: 'Errore interno del server durante il salvataggio.' });
  }
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Users Service in esecuzione e in ascolto sulla porta ${PORT}`);
});