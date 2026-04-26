const db = require('../database');
const { v4: uuidv4 } = require('uuid');

exports.listPlans = (req, res) => {
  const sql = 'SELECT * FROM plans ORDER BY price ASC';
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Parse features JSON string back to array
    const plans = rows.map(plan => ({
      ...plan,
      features: plan.features ? JSON.parse(plan.features) : [],
      highlight: !!plan.highlight
    }));
    
    res.json(plans);
  });
};

exports.addPlan = (req, res) => {
  const { id, name, price, period, duration_days, features, highlight, badge, description } = req.body;
  const planId = id || uuidv4();

  if (!name || !price) {
    return res.status(400).json({ error: 'Plan name and price are required.' });
  }

  const featuresJson = features ? JSON.stringify(features) : '[]';
  const highlightVal = highlight ? 1 : 0;

  const sql = `INSERT INTO plans (id, name, price, period, duration_days, features, highlight, badge, description) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [planId, name, price, period, duration_days, featuresJson, highlightVal, badge, description], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Plan ID already exists.' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: planId, name, price });
  });
};

exports.updatePlan = (req, res) => {
  const { id } = req.params;
  const { name, price, period, duration_days, features, highlight, badge, description } = req.body;

  // Build dynamic update query
  let updates = [];
  let params = [];

  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (price !== undefined) { updates.push('price = ?'); params.push(price); }
  if (period !== undefined) { updates.push('period = ?'); params.push(period); }
  if (duration_days !== undefined) { updates.push('duration_days = ?'); params.push(duration_days); }
  if (features !== undefined) { updates.push('features = ?'); params.push(JSON.stringify(features)); }
  if (highlight !== undefined) { updates.push('highlight = ?'); params.push(highlight ? 1 : 0); }
  if (badge !== undefined) { updates.push('badge = ?'); params.push(badge); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update.' });
  }

  params.push(id);
  const sql = `UPDATE plans SET ${updates.join(', ')} WHERE id = ?`;

  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Plan not found.' });
    res.json({ message: 'Plan updated successfully.', id });
  });
};

exports.removePlan = (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM plans WHERE id = ?';
  db.run(sql, [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Plan not found.' });
    res.json({ message: 'Plan removed successfully.', id });
  });
};
