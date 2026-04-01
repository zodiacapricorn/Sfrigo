require('dotenv').config();
const express = require('express');
const axios   = require('axios');

const app = express();
app.use(express.json());

// --- MIDDLEWARE INTERNO ---
const extractUserId = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId)
    return res.status(401).json({ error: 'Header X-User-Id mancante dal Gateway' });
  req.userId = userId;
  next();
};
app.use(extractUserId);

// ── POST /recipes ─────────────────────────────────────────────────────────────
app.post('/recipes', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'messages è obbligatorio' });

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model:      'gpt-4o-mini',
        max_tokens: 1000,
        messages,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type':  'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('OpenAI error:', error.response?.status, JSON.stringify(error.response?.data));
    res.status(error.response?.status || 500).json(
      error.response?.data || { error: 'Errore nella generazione ricette' }
    );
  }
});

const PORT = process.env.PORT || 8083;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Recipe Service in esecuzione sulla porta ${PORT}`));
}

module.exports = app;