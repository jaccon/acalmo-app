const db = require('../database');

exports.saveFeeling = (req, res) => {
  const { userId, feeling, period } = req.body;

  if (!userId || !feeling || !period) {
    return res.status(400).json({ error: 'userId, feeling e period são obrigatórios' });
  }

  // Verifica se já respondeu para este período hoje
  const today = new Date().toISOString().split('T')[0];
  const checkSql = 'SELECT id FROM feelings WHERE user_id = ? AND period = ? AND DATE(created_at) = ?';
  
  db.get(checkSql, [userId, period, today], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      return res.status(400).json({ error: `Você já registrou seu sentimento para o período: ${period} hoje.` });
    }

    const insertSql = 'INSERT INTO feelings (user_id, feeling, period) VALUES (?, ?, ?)';
    db.run(insertSql, [userId, feeling, period], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ success: true, id: this.lastID });
    });
  });
};

exports.getFeelings = (req, res) => {
  const userId = req.params.userId;
  const sql = 'SELECT * FROM feelings WHERE user_id = ? ORDER BY created_at DESC LIMIT 30';
  
  db.all(sql, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};
