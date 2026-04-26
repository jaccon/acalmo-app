const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const musicRoutes = require('./routes/musicRoutes');
const userRoutes = require('./routes/userRoutes');
const configRoutes = require('./routes/configRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const statsRoutes = require('./routes/statsRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const couponRoutes = require('./routes/couponRoutes');
const feelingRoutes = require('./routes/feelingRoutes');
const planRoutes = require('./routes/planRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (optional, if you want to access files directly)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rota de Status Padrão
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'ACALMO API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/musics', musicRoutes);
app.use('/api/users', userRoutes);
app.use('/api/configs', configRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/user', statsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/feelings', feelingRoutes);
app.use('/api/plans', planRoutes);

// Endpoint de Feature Flags para controle remoto do App
app.get('/api/v1/flags', (req, res) => {
  res.json({
    showUpgradeAd: true,
  });
});

// Error handling for Multer
app.use((err, req, res, next) => {
  if (err instanceof require('multer').MulterError) {
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(500).json({ error: err.message });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
