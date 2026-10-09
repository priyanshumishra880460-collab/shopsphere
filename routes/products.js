const express = require('express');
const router = express.Router();
const db = require('../data/database');
const { requireAdmin } = require('../middleware/auth');

// GET all products with filtering, searching, and sorting
router.get('/', (req, res) => {
  try {
    let products = db.getProducts();
    const { q, category, minPrice, maxPrice, sort, inStockOnly } = req.query;

    // Search filter (name, description, category, specs)
    if (q && q.trim()) {
      const query = q.toLowerCase().trim();
      const tokens = query.split(/\s+/).filter(Boolean);
      products = products.filter(p => {
        const corpus = `${p.name} ${p.category} ${p.description} ${(p.specs || []).join(' ')}`.toLowerCase();
        return tokens.every(token => corpus.includes(token));
      });
    }

    // Category filter
    if (category && category !== 'all') {
      products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    // Price range filters
    if (minPrice) {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) products = products.filter(p => p.price >= min);
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) products = products.filter(p => p.price <= max);
    }

    // In-Stock only filter
    if (inStockOnly === 'true') {
      products = products.filter(p => p.stock > 0);
    }

    // Sorting
    if (sort === 'price_asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      products.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      products.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'newest') {
      products.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, message: 'Server error fetching products.' });
  }
});

// GET single product by ID (including reviews)
router.get('/:id', (req, res) => {
  try {
    const product = db.findProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const reviews = db.getProductReviews(product.id);
    res.json({
      success: true,
      product,
      reviews
    });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ success: false, message: 'Server error fetching product.' });
  }
});

// POST new product (Admin Only)
router.post('/', requireAdmin, (req, res) => {
  try {
    const { name, category, price, originalPrice, stock, image, description, specs, isFeatured } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ success: false, message: 'Name, category, and price are required fields.' });
    }

    const newProduct = {
      id: 'prod_' + Date.now(),
      name: name.trim(),
      category: category.trim().toLowerCase(),
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : Math.round(parseFloat(price) * 1.5),
      stock: parseInt(stock, 10) || 10,
      rating: 5.0,
      reviewsCount: 0,
      image: image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80',
      description: description || 'Premium quality product manufactured to exacting standards.',
      specs: Array.isArray(specs) ? specs : (specs ? specs.split(',').map(s => s.trim()) : ['High Durability', 'Official Manufacturer Warranty']),
      isFeatured: Boolean(isFeatured),
      createdAt: new Date().toISOString()
    };

    db.createProduct(newProduct);
    res.status(201).json({ success: true, message: 'Product created successfully!', product: newProduct });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ success: false, message: 'Server error creating product.' });
  }
});

// PUT update product (Admin Only)
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const updated = db.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, message: 'Product updated successfully!', product: updated });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ success: false, message: 'Server error updating product.' });
  }
});

// PATCH update stock / inventory count (Admin Only)
router.patch('/:id/stock', requireAdmin, (req, res) => {
  try {
    const { stock } = req.body;
    if (stock === undefined) {
      return res.status(400).json({ success: false, message: 'Stock value is required.' });
    }
    const updated = db.updateStock(req.params.id, stock);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, message: 'Inventory stock updated successfully!', product: updated });
  } catch (err) {
    console.error('Error updating stock:', err);
    res.status(500).json({ success: false, message: 'Server error updating stock.' });
  }
});

// DELETE product (Admin Only)
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const success = db.deleteProduct(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, message: 'Product deleted successfully from catalog.' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ success: false, message: 'Server error deleting product.' });
  }
});

module.exports = router;
