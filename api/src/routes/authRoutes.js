const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const clientAuth = require('../middleware/clientAuth');

// All auth routes now require client identification
router.use(clientAuth);

const authMiddleware = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);
router.get('/validate', authMiddleware, (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = router;
