const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const authMiddleware = require('../middleware/auth');

// GET configurations is public (accessible by the app to adjust UI)
router.get('/', configController.getConfigs);

// PUT/POST configurations is restricted to admins
router.put('/', authMiddleware, authMiddleware.authorize('admin'), configController.updateConfig);

module.exports = router;
