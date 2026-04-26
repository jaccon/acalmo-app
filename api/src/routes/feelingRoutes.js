const express = require('express');
const router = express.Router();
const feelingController = require('../controllers/feelingController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, feelingController.saveFeeling);
router.get('/:userId', authMiddleware, feelingController.getFeelings);

module.exports = router;
