const express = require('express');
const router = express.Router();
const db = require('../data/database');
const { requireAdmin } = require('../middleware/auth');

// GET all categories
router.get('/', (req, res) => {
  try {
    const categories = db.getCategories();
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching categories.' });
  }
});

// POST new category (Admin Only)
router.post('/', requireAdmin, (req, res) => {
  try {
    const { name, icon, id } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required.' });

    const newCat = {
      id: (id || name.toLowerCase().replace(/[^a-z0-9]/g, '-')),
      name: name.trim(),
      icon: icon || '📦',
      count: 0
    };

    db.createCategory(newCat);
    res.status(201).json({ success: true, message: 'Category created successfully!', category: newCat });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error creating category.' });
  }
});

module.exports = router;
