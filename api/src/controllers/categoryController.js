const db = require('../database');
const { v4: uuidv4 } = require('uuid');

exports.listCategories = (req, res) => {
  const sql = 'SELECT * FROM categories ORDER BY name ASC';
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.addCategory = (req, res) => {
  const { name, description } = req.body;
  const uuid = uuidv4();

  if (!name) {
    return res.status(400).json({ error: 'Category name is required.' });
  }

  const sql = 'INSERT INTO categories (uuid, name, description) VALUES (?, ?, ?)';
  db.run(sql, [uuid, name, description], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Category name already exists.' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ uuid, name });
  });
};

exports.removeCategory = (req, res) => {
  const { uuid } = req.params;

  // Check if there are musics using this category
  const checkSql = 'SELECT count(*) as count FROM musics WHERE category_id = ?';
  db.get(checkSql, [uuid], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row.count > 0) {
      return res.status(400).json({ error: 'Cannot delete category with associated musics.' });
    }

    const deleteSql = 'DELETE FROM categories WHERE uuid = ?';
    db.run(deleteSql, [uuid], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Category removed successfully.', uuid });
    });
  });
};
