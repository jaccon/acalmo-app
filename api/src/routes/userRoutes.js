const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// Públicas ou protegidas por ID
router.get('/:id', userController.getUserDetails);
router.post('/update-plan', userController.updatePlanById);

// Admin only
router.get('/', authMiddleware.authorize('admin'), userController.listUsers);

// Protegidas por Token
router.get('/stats', authMiddleware, userController.getUserStats);
router.put('/stats', authMiddleware, userController.updateUserStats);
router.put('/upgrade', authMiddleware, userController.upgradePlan);

module.exports = router;
