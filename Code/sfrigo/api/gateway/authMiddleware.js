// authMiddleware.js
const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // Valida il JWT con Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // uid è l'identificativo univoco di Firebase (id univoco saalvato il prostgres)
    req.user = {
      id: decodedToken.uid,
      email: decodedToken.email
    };
    next();
  } catch (error) {
    console.error('JWT Validation Error:', error);
    return res.status(401).json({ message: 'Unauthorized - Invalid Token' });
  }
};

module.exports = verifyToken;