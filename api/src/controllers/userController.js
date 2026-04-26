const db = require('../database');

exports.listUsers = (req, res) => {
  const sql = 'SELECT id, username, email, google_id, role, points, listen_hours, plan_id, plan_expiry, created_at FROM users';
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.getUserStats = (req, res) => {
  const userId = req.user.id;
  const sql = 'SELECT id, username, email, points, listen_hours, role FROM users WHERE id = ?';
  
  db.get(sql, [userId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  });
};

exports.updateUserStats = (req, res) => {
  const userId = req.user.id;
  const { points, listen_hours } = req.body;

  if (points === undefined && listen_hours === undefined) {
    return res.status(400).json({ error: 'Points or listen_hours are required for update.' });
  }

  // First get current values to increment
  const selectSql = 'SELECT points, listen_hours FROM users WHERE id = ?';
  db.get(selectSql, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found.' });

    const newPoints = points !== undefined ? row.points + points : row.points;
    const newHours = listen_hours !== undefined ? row.listen_hours + listen_hours : row.listen_hours;

    const updateSql = 'UPDATE users SET points = ?, listen_hours = ? WHERE id = ?';
    db.run(updateSql, [newPoints, newHours, userId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Stats updated successfully.', points: newPoints, listen_hours: newHours });
    });
  });
};

exports.getUserDetails = (req, res) => {
  const userId = req.params.id;
  const sql = 'SELECT id, username, name, email, plan_id, avatar, points FROM users WHERE id = ?';
  db.get(sql, [userId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  });
};

exports.updatePlanById = (req, res) => {
  const { userId, plan_id } = req.body;
  if (!userId || !plan_id) {
    return res.status(400).json({ error: 'User ID and Plan ID are required.' });
  }
  const sql = 'UPDATE users SET plan_id = ? WHERE id = ?';
  db.run(sql, [plan_id, userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: `Plan updated to ${plan_id}` });
  });
};

exports.upgradePlan = (req, res) => {
  const userId = req.user.id;
  const { plan_id } = req.body;

  if (!plan_id) {
    return res.status(400).json({ error: 'Plan ID is required.' });
  }

  const sql = 'UPDATE users SET plan_id = ? WHERE id = ?';
  db.run(sql, [plan_id, userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: `Plan upgraded to ${plan_id}` });
  });
};
