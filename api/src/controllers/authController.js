const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
require('dotenv').config();

exports.register = async (req, res) => {
  const { username, password, role, name, email, cpf, address, city, state, zip_code } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userRole = role || 'customer';

  const sql = 'INSERT INTO users (username, password, role, name, email, cpf, address, city, state, zip_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  db.run(sql, [username, hashedPassword, userRole, name, email, cpf, address, city, state, zip_code], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Username or Email already exists.' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, username, role: userRole, plan_id: 'free' });
  });
};

exports.login = (req, res) => {
  const { username, password } = req.body; // 'username' can be email or username from UI

  if (!username || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required.' });
  }

  const sql = 'SELECT * FROM users WHERE username = ? OR email = ?';
  db.get(sql, [username, username], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: 'Invalid credentials.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials.' });

    // Restrição: Se for o app mobile, só permite usuários 'customer'
    if (req.application && req.application.client_id === 'meditation_mobile_app' && user.role !== 'customer') {
      return res.status(403).json({ error: 'Acesso restrito a clientes. Administradores devem usar o painel administrativo.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );
    res.json({ 
      token, 
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        email: user.email,
        plan_id: user.plan_id
      }
    });
  });
};

exports.googleLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'idToken is required.' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: google_id, email, name, picture } = payload;

    // Check if user exists
    const sql = 'SELECT * FROM users WHERE google_id = ? OR email = ?';
    db.get(sql, [google_id, email], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });

      if (user) {
        // Update user if needed (e.g., google_id if matched by email)
        const token = jwt.sign(
          { id: user.id, username: user.username || name, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
        );
        return res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role, plan_id: user.plan_id } });
      } else {
        // Create new user
        const insertSql = 'INSERT INTO users (username, email, google_id, role) VALUES (?, ?, ?, ?)';
        db.run(insertSql, [name, email, google_id, 'customer'], function(err) {
          if (err) return res.status(500).json({ error: err.message });

          const token = jwt.sign(
            { id: this.lastID, username: name, role: 'customer' },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
          );
          res.json({ token, user: { id: this.lastID, username: name, email, role: 'customer', plan_id: 'free' } });
        });
      }
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid Google token.' });
  }
};

