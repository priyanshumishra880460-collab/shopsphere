require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./data/database');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize persistent database and seed records
db.initDatabase();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    project: 'ShopSphere E-Commerce Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// SPA catch-all fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 ShopSphere Full-Stack Application Running!`);
  console.log(`🌐 Local URL:  http://localhost:${PORT}`);
  console.log(`👤 Customer:   customer@shopsphere.com / customer123`);
  console.log(`🛡️ Admin:      admin@shopsphere.com / admin123`);
  console.log(`====================================================`);
});
