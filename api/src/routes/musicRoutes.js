const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'music') {
      cb(null, 'uploads/music/');
    } else if (file.fieldname === 'thumbnail') {
      cb(null, 'uploads/thumbnails/');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'music') {
      if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3') {
        cb(null, true);
      } else {
        cb(new Error('Only MP3 files are allowed for music.'), false);
      }
    } else {
      cb(null, true);
    }
  }
});

// All music routes are protected by JWT and Plan Expiry Check
router.use(authMiddleware);
router.use(authMiddleware.checkPlan);

// GET is allowed for both 'admin' and 'user' (if plan is active)
router.get('/', musicController.listMusics);
router.get('/:uuid', musicController.getMusicByUuid);

// POST and DELETE are restricted to 'admin'
router.post('/', authMiddleware.authorize('admin'), upload.fields([
  { name: 'music', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), musicController.addMusic);

router.delete('/:uuid', authMiddleware.authorize('admin'), musicController.removeMusic);

module.exports = router;
