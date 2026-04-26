const db = require('../database');

module.exports = (req, res, next) => {
  const clientId = req.headers['x-client-id'];
  const clientSecret = req.headers['x-client-secret'];

  if (!clientId || !clientSecret) {
    return res.status(401).json({ error: 'Client identification required (x-client-id and x-client-secret headers).' });
  }

  const sql = 'SELECT * FROM applications WHERE client_id = ? AND client_secret = ?';
  db.get(sql, [clientId, clientSecret], (err, app) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (!app) {
      return res.status(401).json({ error: 'Invalid client credentials.' });
    }

    // Attach application info to request if needed
    req.application = app;
    next();
  });
};
