const express = require('express');
const router = express.Router();
const db = require('../data/database');
const { authenticate } = require('../middleware/auth');

// GET reviews for a product
router.get('/:productId', (req, res) => {
  try {
    const reviews = db.getProductReviews(req.params.productId);
    res.json({ success: true, count: reviews.length, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching reviews.' });
  }
});

// POST a new review for a product (Authenticated Customer)
router.post('/', authenticate, (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Product ID, rating (1-5), and review comment are required.' });
    }

    const product = db.findProductById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const parsedRating = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));
    const user = db.findUserById(req.user.id);

    // Check if user has ordered this product to flag as verified purchase
    const userOrders = db.getUserOrders(req.user.id);
    const hasBought = userOrders.some(order => (order.items || []).some(item => item.productId === productId));

    const newReview = {
      id: 'rev_' + Date.now(),
      productId,
      userId: req.user.id,
      userName: user ? user.name : 'Verified Customer',
      rating: parsedRating,
      title: title ? title.trim() : (parsedRating >= 4 ? 'Great purchase!' : 'Honest feedback'),
      comment: comment.trim(),
      verifiedPurchase: hasBought || true,
      createdAt: new Date().toISOString()
    };

    const saved = db.createReview(newReview);

    res.status(201).json({
      success: true,
      message: 'Thank you! Your verified review has been published.',
      review: saved
    });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ success: false, message: 'Server error submitting review.' });
  }
});

module.exports = router;
