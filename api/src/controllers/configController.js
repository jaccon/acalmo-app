const db = require('../database');

exports.getConfigs = (req, res) => {
  const sql = 'SELECT key, value, is_enabled, description FROM configurations';
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.updateConfig = (req, res) => {
  const { key, value, is_enabled, description } = req.body;

  if (!key) {
    return res.status(400).json({ error: 'Configuration key is required.' });
  }

  // Upsert logic for SQLite
  const sql = `INSERT INTO configurations (key, value, is_enabled, description) 
               VALUES (?, ?, ?, ?) 
               ON CONFLICT(key) DO UPDATE SET 
               value = COALESCE(excluded.value, value), 
               is_enabled = COALESCE(excluded.is_enabled, is_enabled),
               description = COALESCE(excluded.description, description)`;
  
  db.run(sql, [key, value, is_enabled, description], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Configuration updated successfully.', key });
  });
};
