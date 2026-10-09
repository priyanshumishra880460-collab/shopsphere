const express = require('express');
const router = express.Router();
const db = require('../data/database');
const { requireAdmin } = require('../middleware/auth');

// GET full administrative analytics and dashboard statistics
router.get('/stats', requireAdmin, (req, res) => {
  try {
    const stats = db.getAdminStats();
    res.json({ success: true, stats });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ success: false, message: 'Server error fetching analytics.' });
  }
});

// GET all registered users with metrics (Admin Only)
router.get('/users', requireAdmin, (req, res) => {
  try {
    const users = db.getUsers();
    const orders = db.getOrders();

    const usersWithStats = users.map(u => {
      const userOrders = orders.filter(o => o.userId === u.id);
      const totalSpent = userOrders.reduce((sum, o) => sum + (o.paymentStatus === 'PAID' ? o.total : 0), 0);

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || 'N/A',
        role: u.role,
        avatar: u.avatar,
        ordersCount: userOrders.length,
        totalSpent,
        createdAt: u.createdAt
      };
    });

    res.json({ success: true, count: usersWithStats.length, users: usersWithStats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching user list.' });
  }
});

module.exports = router;
