const db = require('../database');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

exports.listMusics = (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  // Get user plan first
  const userSql = 'SELECT plan_id, plan_expiry FROM users WHERE id = ?';
  db.get(userSql, [userId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });

    const isPremium = userRole === 'admin' || (user.plan_id !== 'free' && (!user.plan_expiry || new Date(user.plan_expiry) > new Date()));

    const sql = 'SELECT * FROM musics ORDER BY id ASC';
    db.all(sql, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const baseUrl = process.env.BASE_URL || 'http://localhost:8712';
      const fixUrl = (url) => {
        if (!url) return url;
        if (url.startsWith('http')) {
          if (url.includes('172.16.0.105') || url.includes('localhost')) {
            const parts = url.split('/uploads/');
            return parts.length > 1 ? `${baseUrl}/uploads/${parts[1]}` : url;
          }
          return url;
        }
        return `${baseUrl}/${url.replace('./', '')}`;
      };

      // Add is_locked flag and fix URLs
      const musics = rows.map((music, index) => ({
        ...music,
        content: fixUrl(music.content),
        thumbnail: fixUrl(music.thumbnail),
        is_locked: isPremium ? false : (index >= 5)
      }));

      res.json(musics);
    });
  });
};

exports.getMusicByUuid = (req, res) => {
  const { uuid } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  const userSql = 'SELECT plan_id, plan_expiry FROM users WHERE id = ?';
  db.get(userSql, [userId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });

    const isPremium = userRole === 'admin' || (user.plan_id !== 'free' && (!user.plan_expiry || new Date(user.plan_expiry) > new Date()));

    const musicSql = 'SELECT * FROM musics WHERE uuid = ?';
    db.get(musicSql, [uuid], (err, music) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!music) return res.status(404).json({ error: 'Music not found.' });

      const baseUrl = process.env.BASE_URL || 'http://localhost:8712';
      const fixUrl = (url) => {
        if (!url) return url;
        if (url.startsWith('http')) {
          if (url.includes('172.16.0.105') || url.includes('localhost')) {
            const parts = url.split('/uploads/');
            return parts.length > 1 ? `${baseUrl}/uploads/${parts[1]}` : url;
          }
          return url;
        }
        return `${baseUrl}/${url.replace('./', '')}`;
      };

      music.content = fixUrl(music.content);
      music.thumbnail = fixUrl(music.thumbnail);

      // If not premium, check if it's one of the first 5
      if (!isPremium) {
        const checkSql = 'SELECT id FROM musics ORDER BY id ASC LIMIT 5';
        db.all(checkSql, [], (err, freeMusics) => {
          const freeIds = freeMusics.map(m => m.id);
          if (!freeIds.includes(music.id)) {
            return res.status(403).json({ 
              error: 'Upgrade Required', 
              message: 'Esta meditação é exclusiva para assinantes Premium. Faça o upgrade para ouvir!' 
            });
          }
          res.json(music);
        });
      } else {
        res.json(music);
      }
    });
  });
};

exports.addMusic = (req, res) => {
  const { title, description, status, category_id, application } = req.body;
  const uuid = uuidv4();
  
  // File paths from multer
  const musicFile = req.files && req.files.music ? req.files.music[0].path : null;
  const thumbnailFile = req.files && req.files.thumbnail ? req.files.thumbnail[0].path : null;

  if (!title || !musicFile) {
    return res.status(400).json({ error: 'Title and music file are required.' });
  }

  const sql = `INSERT INTO musics (uuid, title, description, thumbnail, content, status, category_id, application) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [uuid, title, description, thumbnailFile, musicFile, status, category_id, application];

  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, uuid, title });
  });
};

exports.removeMusic = (req, res) => {
  const { uuid } = req.params;

  // First get the file paths to delete the physical files
  const selectSql = 'SELECT content, thumbnail FROM musics WHERE uuid = ?';
  db.get(selectSql, [uuid], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Music not found.' });

    // Delete from database
    const deleteSql = 'DELETE FROM musics WHERE uuid = ?';
    db.run(deleteSql, [uuid], function(err) {
      if (err) return res.status(500).json({ error: err.message });

      // Delete physical files
      if (row.content && fs.existsSync(row.content)) fs.unlinkSync(row.content);
      if (row.thumbnail && fs.existsSync(row.thumbnail)) fs.unlinkSync(row.thumbnail);

      res.json({ message: 'Music removed successfully.', uuid });
    });
  });
};
