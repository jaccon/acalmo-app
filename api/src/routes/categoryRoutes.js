const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/auth');

// List categories is public/user accessible
router.get('/', categoryController.listCategories);

// Create and Delete are restricted to admin
router.post('/', authMiddleware, authMiddleware.authorize('admin'), categoryController.addCategory);
router.delete('/:uuid', authMiddleware, authMiddleware.authorize('admin'), categoryController.removeCategory);

module.exports = router;
