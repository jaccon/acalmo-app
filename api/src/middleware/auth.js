const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`[Auth] Token verificado para: ${verified.username}`);
    req.user = verified;
    next();
  } catch (err) {
    console.error(`[Auth] Erro ao verificar token: ${err.message}`);
    res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }
};

// Middleware to check for specific roles
module.exports.authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user || (roles.length && !roles.includes(req.user.role))) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission for this action.' });
    }
    next();
  };
};

// Middleware to check if plan is expired
module.exports.checkPlan = (req, res, next) => {
  const db = require('../database');
  const userId = req.user.id;

  // Admins don't need to check plan expiry
  if (req.user.role === 'admin') {
    return next();
  }

  const sql = 'SELECT plan_id, plan_expiry FROM users WHERE id = ?';
  db.get(sql, [userId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (user.plan_id !== 'free' && user.plan_expiry) {
      const expiry = new Date(user.plan_expiry);
      if (expiry < new Date()) {
        return res.status(403).json({ 
          error: 'Plan expired', 
          message: 'Sua assinatura expirou. Por favor, renove para continuar acessando.' 
        });
      }
    }
    next();
  });
};


