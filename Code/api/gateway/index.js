// index.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const verifyToken = require('./authMiddleware');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://localhost:8081';
const FRIDGE_SERVICE_URL = process.env.FRIDGE_SERVICE_URL || 'http://localhost:8082';
const RECIPE_SERVICE_URL = process.env.RECIPE_SERVICE_URL || 'http://localhost:8083';

const forwardRequest = async (req, res, targetUrl) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${targetUrl}${req.originalUrl.replace('/api/v1', '')}`,
      data: req.body,
      headers: {
        'X-User-Id': req.user.id,
        'X-User-Email': req.user.email,
        'Content-Type': 'application/json'
      }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: 'Internal Server Error - Microservice unreachable' });
    }
  }
};

// ==========================================
// ROUTES
// ==========================================
const apiRouter = express.Router();
apiRouter.use(verifyToken); // Auth

// --- USERS ---
apiRouter.post('/users', (req, res) => {
  forwardRequest(req, res, USERS_SERVICE_URL);
});

// --- FRIDGES ---
apiRouter.get('/fridges', (req, res) => {
  forwardRequest(req, res, FRIDGE_SERVICE_URL);
});

apiRouter.post('/fridges', (req, res) => {
  forwardRequest(req, res, FRIDGE_SERVICE_URL);
});

apiRouter.post('/recipes', (req, res) => {
  forwardRequest(req, res, RECIPE_SERVICE_URL);
});

apiRouter.delete('/fridges/:fridgeId', (req, res) => {
  forwardRequest(req, res, FRIDGE_SERVICE_URL);
});

apiRouter.get('/fridges/:fridgeId', (req, res) => {
  forwardRequest(req, res, FRIDGE_SERVICE_URL);
});

// --- MEMBERS / INVITES ---
apiRouter.post('/fridges/:fridgeId/invites', (req, res) => {
  forwardRequest(req, res, FRIDGE_SERVICE_URL);
});

apiRouter.post('/invites/:token/accept', (req, res) => {
  forwardRequest(req, res, FRIDGE_SERVICE_URL);
});

apiRouter.get('/fridges/:fridgeId/members', (req, res) => {
  forwardRequest(req, res, FRIDGE_SERVICE_URL);
});

apiRouter.delete('/fridges/:fridgeId/members/:userId', (req, res) => {
  forwardRequest(req, res, FRIDGE_SERVICE_URL);
});

apiRouter.delete('/fridges/:fridgeId/members/me', (req, res) => {
  forwardRequest(req, res, FRIDGE_SERVICE_URL);
});

// --- INVENTORY (ITEMS) ---
apiRouter.get('/fridges/:fridgeId/items', (req, res) => {
  forwardRequest(req, res, FRIDGE_SERVICE_URL);
});

apiRouter.post('/fridges/:fridgeId/items', (req, res) => {
  forwardRequest(req, res, FRIDGE_SERVICE_URL);
});

apiRouter.delete('/fridges/:fridgeId/items/:itemId', (req, res) => {
  forwardRequest(req, res, FRIDGE_SERVICE_URL);
});



app.use('/api/v1', apiRouter);

app.listen(PORT, () => {
  console.log(`API Gateway in ascolto sulla porta ${PORT}`);
});