const express = require('express');
const router = express.Router();
const db = require('../database');

// 1. Validar um cupom
router.post('/validate', (req, res) => {
  const { code } = req.body;
  console.log('>>> [Cupom] Validando código:', code);

  if (!code) return res.status(400).json({ error: 'Código do cupom é obrigatório' });

  // Mock de cupom 100% para teste rápido, caso o banco esteja vazio
  if (code.toUpperCase() === 'ACALMO100') {
    return res.json({
      code: 'ACALMO100',
      discount_percent: 100,
      valid: true
    });
  }

  const sql = 'SELECT * FROM coupons WHERE code = ? AND is_active = 1';
  db.get(sql, [code.toUpperCase()], (err, coupon) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!coupon) return res.status(404).json({ error: 'Cupom inválido ou expirado' });

    res.json({
      code: coupon.code,
      discount_percent: coupon.discount_percent,
      valid: true
    });
  });
});

module.exports = router;
