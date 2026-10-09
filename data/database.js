const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  products: path.join(DATA_DIR, 'products.json'),
  categories: path.join(DATA_DIR, 'categories.json'),
  orders: path.join(DATA_DIR, 'orders.json'),
  reviews: path.join(DATA_DIR, 'reviews.json')
};

// Generic read/write helpers
function readJSON(filePath, defaultVal = []) {
  try {
    if (!fs.existsSync(filePath)) {
      writeJSON(filePath, defaultVal);
      return defaultVal;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultVal;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Initial Seeds
const DEFAULT_CATEGORIES = [
  { id: 'electronics', name: 'Electronics & Gadgets', icon: '💻', count: 4 },
  { id: 'audio', name: 'Audio & Wearables', icon: '🎧', count: 3 },
  { id: 'fashion', name: 'Fashion & Apparel', icon: '👕', count: 3 },
  { id: 'home', name: 'Home & Living', icon: '🏡', count: 2 }
];

const DEFAULT_PRODUCTS = [
  {
    id: 'prod_1',
    name: 'AeroSound Pro Wireless ANC Headphones',
    category: 'audio',
    price: 3499,
    originalPrice: 7999,
    stock: 24,
    rating: 4.8,
    reviewsCount: 38,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    description: 'Studio-grade Active Noise Cancellation headphones with 40mm titanium drivers, 40-hour ultra-long battery life, and Bluetooth 5.3 instant multi-point pairing.',
    specs: ['Active Noise Cancellation (ANC)', '40-Hour Battery Life', 'Bluetooth 5.3 with AAC/LDAC', 'Memory Foam Ear Cushions'],
    isFeatured: true,
    createdAt: '2026-09-01T10:00:00Z'
  },
  {
    id: 'prod_2',
    name: 'PulseTrack Ultra AMOLED Smartwatch',
    category: 'audio',
    price: 2799,
    originalPrice: 5999,
    stock: 18,
    rating: 4.7,
    reviewsCount: 29,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    description: '1.96-inch Always-on AMOLED display with precision SpO2 tracking, 24/7 heart rate monitoring, Bluetooth phone calling, and 100+ athletic sport modes.',
    specs: ['1.96" AMOLED Always-on Display', 'IP68 Water & Dust Resistant', 'BT 5.2 Calling with Speaker/Mic', '7-Day Battery Backup'],
    isFeatured: true,
    createdAt: '2026-09-05T10:00:00Z'
  },
  {
    id: 'prod_3',
    name: 'ZenBook Studio 4K Mechanical Keyboard',
    category: 'electronics',
    price: 4299,
    originalPrice: 8499,
    stock: 15,
    rating: 4.9,
    reviewsCount: 52,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
    description: 'Hot-swappable gasket-mounted mechanical keyboard with pre-lubed linear switches, per-key RGB backlighting, aircraft aluminum frame, and triple-mode connectivity (2.4G, BT, Type-C).',
    specs: ['Gasket Mount with Sound Dampening', 'Hot-Swappable 5-Pin Sockets', 'CNC Anodized Aluminum Top', 'Triple Connection Modes'],
    isFeatured: true,
    createdAt: '2026-09-08T10:00:00Z'
  },
  {
    id: 'prod_4',
    name: 'PrecisionGlide 4K Optical Ergonomic Mouse',
    category: 'electronics',
    price: 1899,
    originalPrice: 3499,
    stock: 32,
    rating: 4.6,
    reviewsCount: 22,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80',
    description: 'Ergonomic vertical contour design that reduces wrist strain by 65%. Equipped with 26,000 DPI optical sensor, silent tactile clicks, and hyper-fast metal scroll wheel.',
    specs: ['26,000 DPI Optical Sensor', '65° Natural Ergonomic Handshake Grip', 'Silent Click Mechanism', 'Rechargeable 500mAh Battery'],
    isFeatured: false,
    createdAt: '2026-09-10T10:00:00Z'
  },
  {
    id: 'prod_5',
    name: 'UltraView 27" QHD 165Hz IPS Gaming Monitor',
    category: 'electronics',
    price: 18999,
    originalPrice: 28999,
    stock: 7,
    rating: 4.9,
    reviewsCount: 41,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
    description: '2560x1440 QHD resolution with 165Hz refresh rate, 1ms response time, HDR400 certified color gamut (99% sRGB), AMD FreeSync Premium, and ergonomic height-adjustable stand.',
    specs: ['27" QHD (2560 x 1440) IPS Panel', '165Hz Refresh Rate & 1ms MPRT', '99% sRGB Color Accuracy', 'Tilt, Swivel, Pivot & Height Stand'],
    isFeatured: true,
    createdAt: '2026-09-12T10:00:00Z'
  },
  {
    id: 'prod_6',
    name: 'NovaCharge 100W GaN Triple-Port Fast Charger',
    category: 'electronics',
    price: 2199,
    originalPrice: 4299,
    stock: 45,
    rating: 4.8,
    reviewsCount: 64,
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80',
    description: 'Ultra-compact Gallium Nitride (GaN III) fast charger capable of simultaneously powering laptops, phones, and tablets with dual USB-C (100W PD) and USB-A ports.',
    specs: ['100W Power Delivery 3.0', 'GaN III Temperature Safety Tech', 'Dual USB-C + Single USB-A', 'Foldable Compact Travel Prongs'],
    isFeatured: false,
    createdAt: '2026-09-15T10:00:00Z'
  },
  {
    id: 'prod_7',
    name: 'BassPod Mini 360° Waterproof Bluetooth Speaker',
    category: 'audio',
    price: 1499,
    originalPrice: 2999,
    stock: 28,
    rating: 4.5,
    reviewsCount: 19,
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80',
    description: 'Compact rugged cylindrical speaker delivering 360-degree punchy bass, IPX7 complete waterproof submergibility, 16-hour playtime, and True Wireless Stereo (TWS) pairing.',
    specs: ['360° Omnidirectional Stereo', 'IPX7 Waterproof Submersible', '16-Hour Battery Life', 'Built-in Noise-Cancelling Mic'],
    isFeatured: false,
    createdAt: '2026-09-18T10:00:00Z'
  },
  {
    id: 'prod_8',
    name: 'Minimalist Urban Waterproof Commuter Backpack',
    category: 'fashion',
    price: 2299,
    originalPrice: 4999,
    stock: 20,
    rating: 4.8,
    reviewsCount: 33,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
    description: '25L capacity water-repellent ballistic nylon backpack with padded dedicated compartment for 16-inch laptops, hidden anti-theft passport pocket, and luggage trolley strap.',
    specs: ['Fits up to 16" Laptops', '900D Water-Repellent Ballistic Oxford', 'YKK Weather-Proof Zippers', 'Anti-Theft Hidden Back Pocket'],
    isFeatured: true,
    createdAt: '2026-09-20T10:00:00Z'
  },
  {
    id: 'prod_9',
    name: 'Polarized Aviator Classic Titanium Sunglasses',
    category: 'fashion',
    price: 1299,
    originalPrice: 2899,
    stock: 14,
    rating: 4.6,
    reviewsCount: 17,
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
    description: 'Ultra-lightweight aerospace titanium alloy aviator frames with 100% UV400 multi-layer polarized TAC lenses that eliminate blinding glare and reduce eye fatigue.',
    specs: ['UV400 Category 3 Polarization', 'Titanium Flex Temples (Only 18g)', 'Scratch-Resistant Hydrophobic Coat', 'Leather Hard Case Included'],
    isFeatured: false,
    createdAt: '2026-09-22T10:00:00Z'
  },
  {
    id: 'prod_10',
    name: 'Oversized Heavyweight Premium Cotton Hoodie',
    category: 'fashion',
    price: 1799,
    originalPrice: 3599,
    stock: 35,
    rating: 4.7,
    reviewsCount: 26,
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80',
    description: '450 GSM luxury brushed fleece cotton hoodie with drop-shoulder relaxed silhouette, double-layered thick hood, pre-shrunk fabric, and ribbed elastic cuffs.',
    specs: ['450 GSM 100% Combed Cotton', 'Pre-Shrunk Brushed Fleece', 'Double-Layered Hood (No Drawstring)', 'Relaxed Boxy Drop-Shoulder Fit'],
    isFeatured: false,
    createdAt: '2026-09-25T10:00:00Z'
  },
  {
    id: 'prod_11',
    name: 'Ceramic Pour-Over Coffee Brewing Station',
    category: 'home',
    price: 1999,
    originalPrice: 3899,
    stock: 12,
    rating: 4.9,
    reviewsCount: 28,
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80',
    description: 'Artisan matte black ceramic dripper set with heat-resistant borosilicate glass server (600ml), solid natural walnut wood base, and precision spiral extraction ribs.',
    specs: ['Heat-Resistant Borosilicate Glass', 'Matte Glazed Ceramic V60 Dripper', 'Natural Solid Walnut Stand', '600ml Capacity (2–4 Cups)'],
    isFeatured: true,
    createdAt: '2026-09-28T10:00:00Z'
  },
  {
    id: 'prod_12',
    name: 'Ambient Warm Desk Lamp with Wireless Qi Charger',
    category: 'home',
    price: 2499,
    originalPrice: 4999,
    stock: 16,
    rating: 4.8,
    reviewsCount: 31,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
    description: 'Stepless touch-dimmable LED reading lamp with 3 color temperatures (2700K–6500K), built-in 15W fast wireless charging pad on wooden base, and 1-hour auto-off timer.',
    specs: ['15W Fast Wireless Qi Charging Base', 'Stepless Dimming & 3 Color Modes', 'Flicker-Free Eye Care Diffuser', 'Natural Beech Wood Accent'],
    isFeatured: false,
    createdAt: '2026-10-01T10:00:00Z'
  }
];

const DEFAULT_ORDERS = [
  {
    id: 'ORD-94021',
    userId: 'user_cust_1',
    customerName: 'Rahul Sharma',
    customerEmail: 'customer@shopsphere.com',
    customerPhone: '+91 98765 43210',
    shippingAddress: {
      fullName: 'Rahul Sharma',
      addressLine: 'Flat 402, Skyline Residency, HSR Layout Sector 2',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560102'
    },
    items: [
      {
        productId: 'prod_1',
        name: 'AeroSound Pro Wireless ANC Headphones',
        price: 3499,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'
      },
      {
        productId: 'prod_4',
        name: 'PrecisionGlide 4K Optical Ergonomic Mouse',
        price: 1899,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80'
      }
    ],
    subtotal: 5398,
    shippingFee: 0,
    tax: 971,
    total: 6369,
    paymentMethod: 'UPI / Razorpay',
    paymentStatus: 'PAID',
    transactionId: 'TXN_RZP_881920381',
    orderStatus: 'Shipped',
    trackingHistory: [
      { status: 'Order Placed', timestamp: '2026-10-07T14:22:00Z', notes: 'Payment verified successfully.' },
      { status: 'Processing', timestamp: '2026-10-07T18:10:00Z', notes: 'Packed and verified at Central Fulfillment Hub.' },
      { status: 'Shipped', timestamp: '2026-10-08T09:30:00Z', notes: 'Dispatched via BlueDart Express (AWB: BD84920194).' }
    ],
    estimatedDelivery: '11 Oct 2026',
    createdAt: '2026-10-07T14:22:00Z'
  },
  {
    id: 'ORD-89104',
    userId: 'user_cust_1',
    customerName: 'Rahul Sharma',
    customerEmail: 'customer@shopsphere.com',
    customerPhone: '+91 98765 43210',
    shippingAddress: {
      fullName: 'Rahul Sharma',
      addressLine: 'Flat 402, Skyline Residency, HSR Layout Sector 2',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560102'
    },
    items: [
      {
        productId: 'prod_8',
        name: 'Minimalist Urban Waterproof Commuter Backpack',
        price: 2299,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80'
      }
    ],
    subtotal: 2299,
    shippingFee: 0,
    tax: 413,
    total: 2712,
    paymentMethod: 'Credit / Debit Card',
    paymentStatus: 'PAID',
    transactionId: 'TXN_CARD_77491029',
    orderStatus: 'Delivered',
    trackingHistory: [
      { status: 'Order Placed', timestamp: '2026-10-02T11:15:00Z', notes: 'Payment confirmed.' },
      { status: 'Processing', timestamp: '2026-10-02T14:00:00Z', notes: 'Order packaged.' },
      { status: 'Shipped', timestamp: '2026-10-03T10:00:00Z', notes: 'Dispatched via Delhivery.' },
      { status: 'Out for Delivery', timestamp: '2026-10-05T08:30:00Z', notes: 'Courier agent out for delivery.' },
      { status: 'Delivered', timestamp: '2026-10-05T16:45:00Z', notes: 'Delivered to recipient with OTP.' }
    ],
    estimatedDelivery: 'Delivered on 5 Oct 2026',
    createdAt: '2026-10-02T11:15:00Z'
  },
  {
    id: 'ORD-72941',
    userId: 'user_cust_2',
    customerName: 'Ananya Verma',
    customerEmail: 'ananya.verma@example.com',
    customerPhone: '+91 99887 76655',
    shippingAddress: {
      fullName: 'Ananya Verma',
      addressLine: 'Plot 18, Sector 15, Vashi',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      pincode: '400703'
    },
    items: [
      {
        productId: 'prod_3',
        name: 'ZenBook Studio 4K Mechanical Keyboard',
        price: 4299,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'
      }
    ],
    subtotal: 4299,
    shippingFee: 0,
    tax: 773,
    total: 5072,
    paymentMethod: 'UPI / Netbanking',
    paymentStatus: 'PAID',
    transactionId: 'TXN_UPI_99201948',
    orderStatus: 'Processing',
    trackingHistory: [
      { status: 'Order Placed', timestamp: '2026-10-09T08:45:00Z', notes: 'Order received and verified.' },
      { status: 'Processing', timestamp: '2026-10-09T11:20:00Z', notes: 'Item allocated in warehouse.' }
    ],
    estimatedDelivery: '13 Oct 2026',
    createdAt: '2026-10-09T08:45:00Z'
  }
];

const DEFAULT_REVIEWS = [
  {
    id: 'rev_1',
    productId: 'prod_1',
    userId: 'user_cust_1',
    userName: 'Rahul Sharma',
    rating: 5,
    title: 'Incredible Sound & Deep Bass!',
    comment: 'The noise cancellation completely shuts out traffic and air conditioner noise. Battery easily lasts 4-5 days of heavy coding and calls.',
    verifiedPurchase: true,
    createdAt: '2026-10-06T12:00:00Z'
  },
  {
    id: 'rev_2',
    productId: 'prod_1',
    userId: 'user_cust_2',
    userName: 'Sneha Patel',
    rating: 5,
    title: 'Value for money ANC',
    comment: 'Super comfortable memory foam cups. Does not press against ears even after 6 hours straight. Highly recommended.',
    verifiedPurchase: true,
    createdAt: '2026-10-04T15:30:00Z'
  },
  {
    id: 'rev_3',
    productId: 'prod_3',
    userId: 'user_cust_2',
    userName: 'Ananya Verma',
    rating: 5,
    title: 'Dream keyboard for developers',
    comment: 'The creamy thocky sound out of the box is unmatched. Zero rattle on the spacebar. Beautiful RGB and solid heavy aluminum feel.',
    verifiedPurchase: true,
    createdAt: '2026-09-29T10:15:00Z'
  }
];

// Initialize and seed database files
function initDatabase() {
  // Categories
  if (!fs.existsSync(FILES.categories)) {
    writeJSON(FILES.categories, DEFAULT_CATEGORIES);
  }

  // Products
  if (!fs.existsSync(FILES.products)) {
    writeJSON(FILES.products, DEFAULT_PRODUCTS);
  }

  // Orders
  if (!fs.existsSync(FILES.orders)) {
    writeJSON(FILES.orders, DEFAULT_ORDERS);
  }

  // Reviews
  if (!fs.existsSync(FILES.reviews)) {
    writeJSON(FILES.reviews, DEFAULT_REVIEWS);
  }

  // Users (Seed Admin & Customer with hashed passwords)
  if (!fs.existsSync(FILES.users)) {
    const salt = bcrypt.genSaltSync(10);
    const adminPasswordHash = bcrypt.hashSync('admin123', salt);
    const customerPasswordHash = bcrypt.hashSync('customer123', salt);

    const initialUsers = [
      {
        id: 'user_admin_1',
        name: 'Priyanshu Mishra',
        email: 'admin@shopsphere.com',
        password: adminPasswordHash,
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
        phone: '+91 63880 46065',
        createdAt: '2026-08-01T00:00:00Z'
      },
      {
        id: 'user_cust_1',
        name: 'Rahul Sharma',
        email: 'customer@shopsphere.com',
        password: customerPasswordHash,
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
        phone: '+91 98765 43210',
        createdAt: '2026-09-15T00:00:00Z'
      },
      {
        id: 'user_cust_2',
        name: 'Ananya Verma',
        email: 'ananya.verma@example.com',
        password: customerPasswordHash,
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
        phone: '+91 99887 76655',
        createdAt: '2026-09-20T00:00:00Z'
      }
    ];

    writeJSON(FILES.users, initialUsers);
  }

  console.log('✓ ShopSphere Persistent JSON Database initialized & seeded successfully.');
}

// ----------------- CRUD & QUERY METHODS -----------------

// Users
function getUsers() { return readJSON(FILES.users, []); }
function saveUsers(users) { writeJSON(FILES.users, users); }
function findUserById(id) { return getUsers().find(u => u.id === id); }
function findUserByEmail(email) { return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()); }
function createUser(userData) {
  const users = getUsers();
  users.push(userData);
  saveUsers(users);
  return userData;
}

// Products
function getProducts() { return readJSON(FILES.products, []); }
function saveProducts(products) { writeJSON(FILES.products, products); }
function findProductById(id) { return getProducts().find(p => p.id === id); }
function createProduct(prod) {
  const products = getProducts();
  products.unshift(prod);
  saveProducts(products);
  return prod;
}
function updateProduct(id, updateData) {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;
  products[index] = { ...products[index], ...updateData, updatedAt: new Date().toISOString() };
  saveProducts(products);
  return products[index];
}
function deleteProduct(id) {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  if (filtered.length === products.length) return false;
  saveProducts(filtered);
  return true;
}
function updateStock(id, newStock) {
  return updateProduct(id, { stock: Math.max(0, parseInt(newStock, 10)) });
}

// Categories
function getCategories() { return readJSON(FILES.categories, []); }
function saveCategories(cats) { writeJSON(FILES.categories, cats); }
function createCategory(cat) {
  const cats = getCategories();
  cats.push(cat);
  saveCategories(cats);
  return cat;
}

// Orders
function getOrders() { return readJSON(FILES.orders, []); }
function saveOrders(orders) { writeJSON(FILES.orders, orders); }
function findOrderById(id) { return getOrders().find(o => o.id === id); }
function getUserOrders(userId) {
  return getOrders().filter(o => o.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
function createOrder(orderData) {
  const orders = getOrders();
  orders.unshift(orderData);
  saveOrders(orders);

  // Decrement inventory stock automatically
  if (Array.isArray(orderData.items)) {
    orderData.items.forEach(item => {
      const p = findProductById(item.productId);
      if (p) {
        updateStock(p.id, Math.max(0, p.stock - (item.quantity || 1)));
      }
    });
  }

  return orderData;
}
function updateOrderStatus(id, newStatus, notes = '') {
  const orders = getOrders();
  const order = orders.find(o => o.id === id);
  if (!order) return null;

  order.orderStatus = newStatus;
  if (!Array.isArray(order.trackingHistory)) order.trackingHistory = [];
  order.trackingHistory.push({
    status: newStatus,
    timestamp: new Date().toISOString(),
    notes: notes || `Order marked as ${newStatus} by administrator.`
  });

  saveOrders(orders);
  return order;
}

// Reviews
function getReviews() { return readJSON(FILES.reviews, []); }
function saveReviews(reviews) { writeJSON(FILES.reviews, reviews); }
function getProductReviews(productId) {
  return getReviews().filter(r => r.productId === productId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
function createReview(rev) {
  const reviews = getReviews();
  reviews.unshift(rev);
  saveReviews(reviews);

  // Recalculate average rating for product
  const prodReviews = reviews.filter(r => r.productId === rev.productId);
  const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
  updateProduct(rev.productId, {
    rating: parseFloat(avg.toFixed(1)),
    reviewsCount: prodReviews.length
  });

  return rev;
}

// Admin Analytics & Reporting Engine
function getAdminStats() {
  const orders = getOrders();
  const products = getProducts();
  const users = getUsers();

  const totalRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'PAID' ? o.total : 0), 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const totalCustomers = users.filter(u => u.role !== 'admin').length;

  const lowStockProducts = products.filter(p => p.stock <= 10);

  // Category breakdown
  const categorySales = {};
  orders.forEach(order => {
    (order.items || []).forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const cat = prod ? prod.category : 'other';
      categorySales[cat] = (categorySales[cat] || 0) + (item.price * item.quantity);
    });
  });

  // Recent 5 orders
  const recentOrders = [...orders].slice(0, 5);

  return {
    totalRevenue,
    totalOrders,
    totalProducts,
    totalCustomers,
    lowStockCount: lowStockProducts.length,
    lowStockProducts,
    categorySales,
    recentOrders
  };
}

module.exports = {
  initDatabase,
  getUsers,
  findUserById,
  findUserByEmail,
  createUser,
  getProducts,
  findProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getCategories,
  createCategory,
  getOrders,
  findOrderById,
  getUserOrders,
  createOrder,
  updateOrderStatus,
  getReviews,
  getProductReviews,
  createReview,
  getAdminStats
};
