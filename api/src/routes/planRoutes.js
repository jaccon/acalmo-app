const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const auth = require('../middleware/auth');
const clientAuth = require('../middleware/clientAuth');

// List all plans (Public/Client Auth)
router.get('/', clientAuth, planController.listPlans);

// Create a new plan (Admin only)
router.post('/', auth, auth.authorize('admin'), planController.addPlan);

// Update a plan (Admin only)
router.put('/:id', auth, auth.authorize('admin'), planController.updatePlan);

// Delete a plan (Admin only)
router.delete('/:id', auth, auth.authorize('admin'), planController.removePlan);

module.exports = router;
