const express = require('express');
const router = express.Router();
const db = require('../data/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// POST place a new order (Authenticated Customer)
router.post('/', authenticate, (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty. Please add items to checkout.' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.addressLine || !shippingAddress.city || !shippingAddress.pincode) {
      return res.status(400).json({ success: false, message: 'Complete shipping address is required.' });
    }

    // Verify stock availability
    for (const item of items) {
      const product = db.findProductById(item.productId);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product "${item.name}" was not found.` });
      }
      if (product.stock < (item.quantity || 1)) {
        return res.status(400).json({
          success: false,
          message: `Insufficient inventory for "${product.name}". Only ${product.stock} units remaining.`
        });
      }
    }

    // Compute totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const shippingFee = subtotal > 1999 ? 0 : 99;
    const tax = Math.round(subtotal * 0.18); // 18% GST standard e-commerce
    const total = subtotal + shippingFee + tax;

    const user = db.findUserById(req.user.id);
    const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
    const transactionId = 'TXN_' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

    // Delivery date calculation (3 days from now)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);
    const deliveryStr = deliveryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const newOrder = {
      id: orderId,
      userId: req.user.id,
      customerName: user ? user.name : shippingAddress.fullName,
      customerEmail: user ? user.email : (shippingAddress.email || ''),
      customerPhone: shippingAddress.phone || (user ? user.phone : ''),
      shippingAddress: {
        fullName: shippingAddress.fullName,
        addressLine: shippingAddress.addressLine,
        city: shippingAddress.city,
        state: shippingAddress.state || 'India',
        pincode: shippingAddress.pincode
      },
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        image: item.image
      })),
      subtotal,
      shippingFee,
      tax,
      total,
      paymentMethod: paymentMethod || 'Online UPI / Card',
      paymentStatus: 'PAID',
      transactionId,
      orderStatus: 'Order Placed',
      trackingHistory: [
        {
          status: 'Order Placed',
          timestamp: new Date().toISOString(),
          notes: 'Order confirmed and payment verified successfully.'
        }
      ],
      estimatedDelivery: deliveryStr,
      createdAt: new Date().toISOString()
    };

    const savedOrder = db.createOrder(newOrder);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Delivery tracking is now active.',
      order: savedOrder
    });
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).json({ success: false, message: 'Server error placing order.' });
  }
});

// GET user's own orders ("My Orders")
router.get('/my', authenticate, (req, res) => {
  try {
    const orders = db.getUserOrders(req.user.id);
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching orders.' });
  }
});

// GET single order tracking details by ID
router.get('/:id', authenticate, (req, res) => {
  try {
    const order = db.findOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Ensure users can only view their own orders unless they are admin
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied to this order.' });
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching order.' });
  }
});

// GET all orders (Admin Only)
router.get('/admin/all', requireAdmin, (req, res) => {
  try {
    const orders = db.getOrders();
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching all orders.' });
  }
});

// PATCH update order status (Admin Only)
router.patch('/admin/:id/status', requireAdmin, (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Order status value is required.' });
    }

    const validStatuses = ['Order Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Choose from: ${validStatuses.join(', ')}`
      });
    }

    const updated = db.updateOrderStatus(req.params.id, status, notes);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.json({ success: true, message: `Order status updated to "${status}"!`, order: updated });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ success: false, message: 'Server error updating order status.' });
  }
});

module.exports = router;
