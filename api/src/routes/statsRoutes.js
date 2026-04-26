const express = require('express');
const router = express.Router();
const db = require('../database');

// Sincroniza minutos de meditação do usuário
router.post('/sync-stats', (req, res) => {
  const { userId, minutes } = req.body;

  if (!userId || !minutes) {
    return res.status(400).json({ error: 'userId e minutes são obrigatórios' });
  }

  const sql = 'UPDATE users SET total_minutes = total_minutes + ? WHERE id = ?';
  
  db.run(sql, [minutes, userId], function(err) {
    if (err) {
      console.error('[API] Erro ao sincronizar stats:', err.message);
      return res.status(500).json({ error: 'Erro interno ao sincronizar' });
    }
    
    console.log(`[API] Sincronizados ${minutes} minutos para o usuário ${userId}`);
    res.json({ success: true, updated: this.changes });
  });
});

module.exports = router;
