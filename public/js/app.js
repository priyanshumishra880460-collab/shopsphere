// ShopSphere Core Client Application
let storeProducts = [];
let storeCategories = [];
let cart = [];
let wishlist = [];
let activeCategory = 'all';
let currentSearch = '';
let maxPriceFilter = 100000;
let currentSort = 'default';
let activeModalProductId = null;

// Helper: Escape HTML for security
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  loadLocalState();
  updateAuthUI();
  updateCartBadge();
  updateWishlistBadge();

  await loadCategories();
  await loadStoreProducts();

  // Check URL hash for routing
  handleHashRouting();
  window.addEventListener('hashchange', handleHashRouting);
});

function handleHashRouting() {
  const hash = window.location.hash.replace('#', '') || 'store';
  if (hash === 'admin') {
    navigateTo('admin');
  } else if (hash === 'orders') {
    navigateTo('orders');
  } else {
    navigateTo('store');
  }
}

function navigateTo(view) {
  const vStore = document.getElementById('view-store');
  const vAdmin = document.getElementById('view-admin');
  const vOrders = document.getElementById('view-orders');

  if (vStore) vStore.classList.toggle('hidden', view !== 'store');
  if (vAdmin) vAdmin.classList.toggle('hidden', view !== 'admin');
  if (vOrders) vOrders.classList.toggle('hidden', view !== 'orders');

  window.location.hash = view;

  if (view === 'admin') {
    initAdminDashboard();
  } else if (view === 'orders') {
    loadUserOrders();
  } else if (view === 'store') {
    loadStoreProducts();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------------- LOCAL STORAGE SYNC ----------------
function loadLocalState() {
  try {
    const savedCart = localStorage.getItem('shopsphere_cart');
    cart = savedCart ? JSON.parse(savedCart) : [];
  } catch (e) { cart = []; }

  try {
    const savedWish = localStorage.getItem('shopsphere_wishlist');
    wishlist = savedWish ? JSON.parse(savedWish) : [];
  } catch (e) { wishlist = []; }
}

function saveCart() {
  localStorage.setItem('shopsphere_cart', JSON.stringify(cart));
  updateCartBadge();
  renderCartDrawer();
}

function saveWishlist() {
  localStorage.setItem('shopsphere_wishlist', JSON.stringify(wishlist));
  updateWishlistBadge();
}

function updateCartBadge() {
  const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const badge = document.getElementById('nav-cart-badge');
  if (badge) {
    badge.innerText = totalCount;
    badge.classList.toggle('hidden', totalCount === 0);
  }
}

function updateWishlistBadge() {
  const badge = document.getElementById('nav-wishlist-badge');
  if (badge) {
    badge.innerText = wishlist.length;
    badge.classList.toggle('hidden', wishlist.length === 0);
  }
}

// ---------------- CATEGORIES & CATALOG ----------------
async function loadCategories() {
  try {
    const res = await api.getCategories();
    if (!res.success) return;
    storeCategories = res.categories;

    const rail = document.getElementById('category-filter-rail');
    if (rail) {
      rail.innerHTML = `
        <button onclick="setCategoryFilter('all')" class="cat-pill px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition whitespace-nowrap ${activeCategory === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
          <span>✨</span> All Products
        </button>
        ${storeCategories.map(c => `
          <button onclick="setCategoryFilter('${c.id}')" class="cat-pill px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition whitespace-nowrap ${activeCategory === c.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
            <span>${c.icon}</span> ${c.name}
          </button>
        `).join('')}
      `;
    }
  } catch (e) {
    console.error('Failed to load categories', e);
  }
}

function setCategoryFilter(catId) {
  activeCategory = catId;
  loadCategories();
  loadStoreProducts();
}

async function loadStoreProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="col-span-full py-16 text-center text-slate-400">
      <div class="inline-block animate-spin text-2xl mb-2">⏳</div>
      <p class="font-semibold text-sm">Loading ShopSphere Catalog...</p>
    </div>
  `;

  try {
    const params = {};
    if (activeCategory && activeCategory !== 'all') params.category = activeCategory;
    if (currentSearch && currentSearch.trim()) params.q = currentSearch.trim();
    if (maxPriceFilter) params.maxPrice = maxPriceFilter;
    if (currentSort && currentSort !== 'default') params.sort = currentSort;

    const res = await api.getProducts(params);
    if (!res.success) return;
    storeProducts = res.products;

    renderProductsGrid(storeProducts);
  } catch (err) {
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center text-rose-500">
        <p class="font-bold">Failed to load catalog products.</p>
        <button onclick="loadStoreProducts()" class="mt-2 px-4 py-1.5 bg-slate-900 text-white text-xs rounded-lg">Retry</button>
      </div>
    `;
  }
}

function renderProductsGrid(products) {
  const grid = document.getElementById('products-grid');
  const countEl = document.getElementById('catalog-total-count');
  if (countEl) countEl.innerText = `${products.length} product${products.length === 1 ? '' : 's'}`;

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 p-8 max-w-lg mx-auto">
        <span class="text-4xl block mb-2">🔍</span>
        <h3 class="font-bold text-base text-slate-900">No matching products found</h3>
        <p class="text-xs text-slate-500 mt-1">Try resetting your search query or adjusting your price filters.</p>
        <button onclick="resetFilters()" class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition">
          Reset all filters
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map(p => {
    const isWished = wishlist.includes(p.id);
    const stockStatus = p.stock > 10
      ? '<span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">In Stock</span>'
      : (p.stock > 0 
        ? `<span class="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Only ${p.stock} Left</span>`
        : '<span class="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">Out of Stock</span>');

    return `
      <div class="group bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 hover:shadow-xl transition-smooth flex flex-col justify-between overflow-hidden">
        
        <!-- Image & Badges -->
        <div class="relative aspect-square overflow-hidden bg-slate-50 flex items-center justify-center p-4 cursor-pointer" onclick="openProductDetailModal('${p.id}')">
          <img src="${p.image}" alt="${escapeHtml(p.name)}" class="w-full h-full object-contain transform group-hover:scale-105 transition duration-300" />
          
          <!-- Category & Stock Floating Tag -->
          <div class="absolute top-3 left-3 flex flex-col gap-1 items-start">
            <span class="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-900/80 text-white backdrop-blur-xs rounded-md shadow-xs">
              ${p.category}
            </span>
            ${stockStatus}
          </div>

          <!-- Wishlist Heart Button -->
          <button onclick="event.stopPropagation(); toggleWishlist('${p.id}')" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-600 hover:text-rose-500 flex items-center justify-center shadow-xs transition cursor-pointer">
            <span class="text-base ${isWished ? 'text-rose-500' : 'text-slate-400'}">♥</span>
          </button>
        </div>

        <!-- Details Block -->
        <div class="p-4 sm:p-5 flex flex-col flex-1 justify-between">
          <div>
            <div class="flex items-center gap-1.5 text-xs text-slate-700 mb-1">
              <span class="font-bold text-amber-500">★ ${p.rating}</span>
              <span class="text-slate-400 text-[11px]">(${p.reviewsCount} reviews)</span>
            </div>
            
            <h3 class="font-bold text-sm sm:text-base text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition cursor-pointer" onclick="openProductDetailModal('${p.id}')">
              ${escapeHtml(p.name)}
            </h3>
          </div>

          <!-- Pricing & Cart Button -->
          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <div class="text-base sm:text-lg font-extrabold text-slate-900">₹${p.price.toLocaleString('en-IN')}</div>
              ${p.originalPrice ? `<span class="text-xs text-slate-400 line-through">₹${p.originalPrice.toLocaleString('en-IN')}</span>` : ''}
            </div>

            <button onclick="addToCart('${p.id}')" ${p.stock === 0 ? 'disabled' : ''} class="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${p.stock === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-indigo-600 text-white shadow-sm'}">
              <span>+ Add to Cart</span>
            </button>
          </div>
        </div>

      </div>
    `;
  }).join('');
}

// ---------------- LIVE SEARCH & FILTERS ----------------
function handleSearch(val) {
  currentSearch = val;
  const clearBtn = document.getElementById('search-clear-btn');
  if (clearBtn) clearBtn.classList.toggle('hidden', !val.trim());
  loadStoreProducts();
}

function clearSearch() {
  const inp = document.getElementById('nav-search-input');
  if (inp) inp.value = '';
  handleSearch('');
}

function handlePriceFilter(val) {
  maxPriceFilter = parseInt(val, 10);
  const label = document.getElementById('price-range-label');
  if (label) label.innerText = `₹${maxPriceFilter.toLocaleString('en-IN')}`;
  loadStoreProducts();
}

function handleSortChange(val) {
  currentSort = val;
  loadStoreProducts();
}

function resetFilters() {
  activeCategory = 'all';
  currentSearch = '';
  maxPriceFilter = 100000;
  currentSort = 'default';

  const sInp = document.getElementById('nav-search-input');
  if (sInp) sInp.value = '';
  const pSlider = document.getElementById('price-range-slider');
  if (pSlider) pSlider.value = 100000;
  const pLabel = document.getElementById('price-range-label');
  if (pLabel) pLabel.innerText = '₹1,00,000';
  const sortSel = document.getElementById('sort-selector');
  if (sortSel) sortSel.value = 'default';

  loadCategories();
  loadStoreProducts();
}

// ---------------- CART & CHECKOUT ENGINE ----------------
function addToCart(prodId) {
  const prod = storeProducts.find(p => p.id === prodId);
  if (!prod) return;

  const existing = cart.find(item => item.productId === prodId);
  if (existing) {
    if (existing.quantity >= prod.stock) {
      showToast(`Cannot add more. Only ${prod.stock} items in stock.`, 'warning');
      return;
    }
    existing.quantity += 1;
  } else {
    cart.push({
      productId: prod.id,
      name: prod.name,
      price: prod.price,
      image: prod.image,
      stock: prod.stock,
      quantity: 1
    });
  }

  saveCart();
  showToast(`Added "${prod.name}" to cart!`);
  openCartDrawer();
}

function updateCartQty(prodId, delta) {
  const item = cart.find(i => i.productId === prodId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.productId !== prodId);
  } else if (item.quantity > item.stock) {
    item.quantity = item.stock;
    showToast(`Maximum stock limit (${item.stock}) reached.`, 'warning');
  }

  saveCart();
}

function removeFromCart(prodId) {
  cart = cart.filter(i => i.productId !== prodId);
  saveCart();
  showToast('Item removed from cart.');
}

function openCartDrawer() {
  renderCartDrawer();
  document.getElementById('cart-drawer-backdrop').classList.remove('hidden');
  document.getElementById('cart-drawer-panel').classList.remove('translate-x-full');
}

function closeCartDrawer() {
  document.getElementById('cart-drawer-panel').classList.add('translate-x-full');
  setTimeout(() => {
    document.getElementById('cart-drawer-backdrop').classList.add('hidden');
  }, 250);
}

function renderCartDrawer() {
  const list = document.getElementById('cart-items-list');
  const subtotalEl = document.getElementById('cart-subtotal-val');
  const taxEl = document.getElementById('cart-tax-val');
  const shippingEl = document.getElementById('cart-shipping-val');
  const totalEl = document.getElementById('cart-total-val');

  if (!list) return;

  if (cart.length === 0) {
    list.innerHTML = `
      <div class="py-20 text-center text-slate-400">
        <span class="text-4xl block mb-2">🛒</span>
        <p class="font-bold text-sm text-slate-700">Your cart is empty</p>
        <p class="text-xs text-slate-400 mt-1">Explore our catalog and add items you love!</p>
      </div>
    `;
    if (subtotalEl) subtotalEl.innerText = '₹0';
    if (taxEl) taxEl.innerText = '₹0';
    if (shippingEl) shippingEl.innerText = '₹0';
    if (totalEl) totalEl.innerText = '₹0';
    document.getElementById('cart-checkout-btn').disabled = true;
    return;
  }

  document.getElementById('cart-checkout-btn').disabled = false;

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = Math.round(subtotal * 0.18);
  const shipping = subtotal > 1999 ? 0 : 99;
  const total = subtotal + tax + shipping;

  list.innerHTML = cart.map(item => `
    <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
      <img src="${item.image}" class="w-14 h-14 object-cover rounded-lg bg-white border border-slate-200" />
      <div class="flex-1 min-w-0">
        <h4 class="font-bold text-xs text-slate-900 truncate">${escapeHtml(item.name)}</h4>
        <div class="text-xs font-bold text-indigo-600 mt-0.5">₹${item.price.toLocaleString('en-IN')}</div>
        <div class="flex items-center gap-2 mt-1.5">
          <div class="flex items-center border border-slate-200 rounded-lg bg-white">
            <button onclick="updateCartQty('${item.productId}', -1)" class="w-6 h-6 flex items-center justify-center font-bold text-xs text-slate-700 hover:bg-slate-100 rounded-l">-</button>
            <span class="w-7 text-center font-bold text-xs text-slate-900">${item.quantity}</span>
            <button onclick="updateCartQty('${item.productId}', 1)" class="w-6 h-6 flex items-center justify-center font-bold text-xs text-slate-700 hover:bg-slate-100 rounded-r">+</button>
          </div>
          <button onclick="removeFromCart('${item.productId}')" class="text-xs text-slate-400 hover:text-rose-500 font-medium">Remove</button>
        </div>
      </div>
    </div>
  `).join('');

  if (subtotalEl) subtotalEl.innerText = `₹${subtotal.toLocaleString('en-IN')}`;
  if (taxEl) taxEl.innerText = `₹${tax.toLocaleString('en-IN')}`;
  if (shippingEl) shippingEl.innerText = shipping === 0 ? 'FREE' : `₹${shipping}`;
  if (totalEl) totalEl.innerText = `₹${total.toLocaleString('en-IN')}`;
}

// ---------------- WISHLIST ----------------
function toggleWishlist(prodId) {
  if (wishlist.includes(prodId)) {
    wishlist = wishlist.filter(id => id !== prodId);
    showToast('Removed from Wishlist.');
  } else {
    wishlist.push(prodId);
    showToast('Added to your Wishlist! ♥');
  }
  saveWishlist();
  renderProductsGrid(storeProducts);
}

// ---------------- PRODUCT DETAILS MODAL & REVIEWS ----------------
async function openProductDetailModal(prodId) {
  activeModalProductId = prodId;
  const modal = document.getElementById('product-detail-modal');
  modal.classList.remove('hidden');

  const content = document.getElementById('pdp-modal-content');
  content.innerHTML = `
    <div class="py-20 text-center text-slate-400">
      <div class="inline-block animate-spin text-2xl mb-2">⏳</div>
      <p class="font-semibold text-sm">Loading Product Details...</p>
    </div>
  `;

  try {
    const res = await api.getProduct(prodId);
    if (!res.success) return;
    const { product, reviews } = res;

    content.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <!-- Photo Stage -->
        <div class="bg-slate-50 rounded-2xl p-6 flex items-center justify-center border border-slate-200/80">
          <img src="${product.image}" class="w-full max-h-80 object-contain drop-shadow-md" />
        </div>

        <!-- Info -->
        <div class="flex flex-col justify-between">
          <div>
            <span class="text-xs uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
              ${product.category}
            </span>
            <h2 class="text-xl sm:text-2xl font-bold text-slate-900 mt-2 leading-snug">${escapeHtml(product.name)}</h2>
            
            <div class="flex items-center gap-2 mt-2">
              <span class="text-amber-500 font-bold">★ ${product.rating}</span>
              <span class="text-slate-400 text-xs">(${product.reviewsCount} customer reviews)</span>
              <span class="text-slate-300">|</span>
              <span class="text-xs font-bold ${product.stock > 0 ? 'text-emerald-700' : 'text-rose-600'}">
                ${product.stock > 0 ? `In Stock (${product.stock} units available)` : 'Out of Stock'}
              </span>
            </div>

            <div class="mt-4 flex items-baseline gap-3">
              <span class="text-2xl sm:text-3xl font-extrabold text-slate-900">₹${product.price.toLocaleString('en-IN')}</span>
              ${product.originalPrice ? `<span class="text-sm text-slate-400 line-through">₹${product.originalPrice.toLocaleString('en-IN')}</span>` : ''}
            </div>

            <p class="text-xs sm:text-sm text-slate-600 mt-4 leading-relaxed">${escapeHtml(product.description)}</p>

            <!-- Specifications -->
            <div class="mt-4 pt-4 border-t border-slate-100">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Key Specifications</h4>
              <ul class="space-y-1.5 text-xs text-slate-700">
                ${(product.specs || []).map(s => `<li class="flex items-center gap-2"><span class="text-indigo-600 font-bold">✓</span> ${escapeHtml(s)}</li>`).join('')}
              </ul>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
            <button onclick="addToCart('${product.id}'); closeProductDetailModal();" class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition">
              Add to Cart
            </button>
            <button onclick="toggleWishlist('${product.id}')" class="p-3 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 hover:text-rose-500 transition">
              ♥
            </button>
          </div>
        </div>

      </div>

      <!-- Reviews Section -->
      <div class="mt-10 pt-8 border-t border-slate-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-lg text-slate-900">Customer Ratings & Reviews</h3>
          <button onclick="toggleReviewForm()" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition">
            ✍ Write a Review
          </button>
        </div>

        <!-- Inline Review Form -->
        <div id="inline-review-box" class="hidden mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h4 class="font-bold text-xs uppercase text-slate-700 mb-2">Share Your Verified Experience</h4>
          <form onsubmit="handleReviewSubmit(event)" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Rating</label>
              <select id="rev-form-rating" class="text-xs border border-slate-200 rounded-lg p-2 bg-white">
                <option value="5">5 ★ Superb</option>
                <option value="4">4 ★ Very Good</option>
                <option value="3">3 ★ Average</option>
                <option value="2">2 ★ Poor</option>
                <option value="1">1 ★ Terrible</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Headline</label>
              <input type="text" id="rev-form-title" placeholder="e.g. Excellent build quality!" class="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white" required />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Detailed Review</label>
              <textarea id="rev-form-comment" rows="2" placeholder="Tell other shoppers what you liked or disliked..." class="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white" required></textarea>
            </div>
            <div class="flex justify-end gap-2">
              <button type="button" onclick="toggleReviewForm()" class="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800">Cancel</button>
              <button type="submit" class="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg">Submit Review</button>
            </div>
          </form>
        </div>

        <!-- Reviews List -->
        <div class="space-y-3">
          ${reviews.length === 0 ? '<p class="text-xs text-slate-400 italic">No reviews yet for this product. Be the first to review!</p>' : ''}
          ${reviews.map(r => `
            <div class="p-3.5 bg-white border border-slate-100 rounded-xl">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-600 text-white">${r.rating} ★</span>
                  <span class="font-bold text-xs text-slate-800">${escapeHtml(r.title)}</span>
                </div>
                <span class="text-[11px] text-slate-400">${new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
              <p class="text-xs text-slate-600 mt-2">${escapeHtml(r.comment)}</p>
              <div class="text-[11px] text-slate-400 mt-2 font-medium">By ${escapeHtml(r.userName)} • <span class="text-emerald-600">✓ Verified Buyer</span></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<p class="text-rose-500 text-center py-8">Failed to load details.</p>`;
  }
}

function closeProductDetailModal() {
  document.getElementById('product-detail-modal').classList.add('hidden');
}

function toggleReviewForm() {
  const box = document.getElementById('inline-review-box');
  if (box) box.classList.toggle('hidden');
}

async function handleReviewSubmit(e) {
  e.preventDefault();
  const user = api.getCurrentUser();
  if (!user) {
    showToast('Please sign in to post a review.', 'info');
    openAuthModal('customer');
    return;
  }

  const rating = document.getElementById('rev-form-rating').value;
  const title = document.getElementById('rev-form-title').value;
  const comment = document.getElementById('rev-form-comment').value;

  try {
    await api.submitReview({
      productId: activeModalProductId,
      rating,
      title,
      comment
    });
    showToast('Review submitted successfully!');
    openProductDetailModal(activeModalProductId);
    loadStoreProducts();
  } catch (err) {
    showToast('Failed to post review: ' + err.message, 'error');
  }
}

// ---------------- CHECKOUT & ORDERS ENGINE ----------------
function openCheckoutModal() {
  closeCartDrawer();
  const user = api.getCurrentUser();
  if (!user) {
    showToast('Please sign in or register to complete your purchase.', 'info');
    openAuthModal('customer');
    return;
  }

  // Pre-fill user name and phone
  const nameInp = document.getElementById('chk-name');
  if (nameInp) nameInp.value = user.name || '';
  const phoneInp = document.getElementById('chk-phone');
  if (phoneInp) phoneInp.value = user.phone || '';

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = Math.round(subtotal * 0.18);
  const shipping = subtotal > 1999 ? 0 : 99;
  const total = subtotal + tax + shipping;

  document.getElementById('chk-summary-subtotal').innerText = `₹${subtotal.toLocaleString('en-IN')}`;
  document.getElementById('chk-summary-total').innerText = `₹${total.toLocaleString('en-IN')}`;

  document.getElementById('checkout-modal').classList.remove('hidden');
}

function closeCheckoutModal() {
  document.getElementById('checkout-modal').classList.add('hidden');
}

async function handlePlaceOrder(e) {
  e.preventDefault();

  const shippingAddress = {
    fullName: document.getElementById('chk-name').value.trim(),
    phone: document.getElementById('chk-phone').value.trim(),
    addressLine: document.getElementById('chk-address').value.trim(),
    city: document.getElementById('chk-city').value.trim(),
    state: document.getElementById('chk-state').value.trim(),
    pincode: document.getElementById('chk-pincode').value.trim()
  };

  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

  try {
    const res = await api.placeOrder({
      items: cart,
      shippingAddress,
      paymentMethod
    });

    if (res.success) {
      cart = [];
      saveCart();
      closeCheckoutModal();
      showToast('🎉 Order confirmed! Tracking number: ' + res.order.id, 'success');
      navigateTo('orders');
    }
  } catch (err) {
    showToast('Order placement failed: ' + err.message, 'error');
  }
}

// ---------------- USER ORDERS & LIVE TRACKING VIEW ----------------
async function loadUserOrders() {
  const user = api.getCurrentUser();
  const container = document.getElementById('orders-list-container');
  if (!container) return;

  if (!user) {
    container.innerHTML = `
      <div class="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 p-8 max-w-md mx-auto">
        <span class="text-4xl block mb-2">🔒</span>
        <h3 class="font-bold text-base text-slate-900">Sign in to track orders</h3>
        <p class="text-xs text-slate-500 mt-1">View live order status, shipment tracking, and purchase receipts.</p>
        <button onclick="openAuthModal('customer')" class="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition">
          Sign In / Register
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="py-16 text-center text-slate-400">
      <div class="inline-block animate-spin text-2xl mb-2">⏳</div>
      <p class="font-semibold text-sm">Fetching your orders...</p>
    </div>
  `;

  try {
    const res = await api.getMyOrders();
    if (!res.success) return;
    const orders = res.orders;

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 p-8 max-w-md mx-auto">
          <span class="text-4xl block mb-2">📦</span>
          <h3 class="font-bold text-base text-slate-900">No past orders found</h3>
          <p class="text-xs text-slate-500 mt-1">Start shopping from the ShopSphere catalog to place your first order.</p>
          <button onclick="navigateTo('store')" class="mt-4 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition">
            Explore Store Catalog
          </button>
        </div>
      `;
      return;
    }

    const statusSteps = ['Order Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

    container.innerHTML = orders.map(order => {
      const currentStepIdx = statusSteps.indexOf(order.orderStatus);

      return `
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          
          <!-- Order Header Bar -->
          <div class="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono font-bold text-sm text-indigo-600">${order.id}</span>
                <span class="text-xs font-bold px-2.5 py-0.5 rounded-full ${order.orderStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}">
                  ${order.orderStatus}
                </span>
              </div>
              <div class="text-xs text-slate-500 mt-0.5">Placed on ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • Payment: ${order.paymentMethod}</div>
            </div>

            <div class="text-right">
              <div class="text-xs text-slate-500">Total Order Amount</div>
              <div class="font-extrabold text-base text-slate-900">₹${order.total.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <!-- Live Step-by-Step Delivery Progress Tracker -->
          <div class="p-5 sm:p-6 border-b border-slate-100">
            <h4 class="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Live Delivery Progress</h4>
            
            <div class="relative flex items-center justify-between max-w-2xl mx-auto">
              <!-- Connecting Line -->
              <div class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0"></div>
              <div class="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 z-0 transition-all duration-500" style="width: ${Math.max(0, (currentStepIdx / (statusSteps.length - 1)) * 100)}%;"></div>

              <!-- Steps Circles -->
              ${statusSteps.map((step, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return `
                  <div class="relative z-10 flex flex-col items-center">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition ${isCurrent ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : (isPassed ? 'bg-indigo-600 text-white' : 'bg-white border-2 border-slate-300 text-slate-400')}">
                      ${isPassed ? '✓' : idx + 1}
                    </div>
                    <span class="text-[10px] sm:text-xs font-semibold mt-1.5 text-center ${isPassed ? 'text-slate-900 font-bold' : 'text-slate-400'} whitespace-nowrap">
                      ${step}
                    </span>
                  </div>
                `;
              }).join('')}
            </div>

            <div class="mt-4 p-3 bg-indigo-50/70 rounded-xl border border-indigo-100/80 text-xs text-indigo-950 flex items-center justify-between">
              <div><strong>Estimated Delivery:</strong> ${order.estimatedDelivery}</div>
              <div class="text-slate-500">Shipping to: <strong>${escapeHtml(order.shippingAddress.city)} (${order.shippingAddress.pincode})</strong></div>
            </div>
          </div>

          <!-- Items in Order -->
          <div class="p-4 sm:p-5 space-y-3">
            <h4 class="font-bold text-xs uppercase tracking-wider text-slate-400">Items in this shipment</h4>
            ${(order.items || []).map(item => `
              <div class="flex items-center gap-3">
                <img src="${item.image}" class="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                <div class="flex-1">
                  <h5 class="font-bold text-xs text-slate-900">${escapeHtml(item.name)}</h5>
                  <span class="text-xs text-slate-500">Qty: ${item.quantity} • ₹${item.price.toLocaleString('en-IN')} each</span>
                </div>
              </div>
            `).join('')}
          </div>

        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-rose-500 py-8 text-center">Failed to load orders.</p>`;
  }
}

// ---------------- USER AUTHENTICATION UI ----------------
function updateAuthUI() {
  const user = api.getCurrentUser();
  const guestBtn = document.getElementById('nav-guest-btn');
  const userMenu = document.getElementById('nav-user-menu');
  const userNameEl = document.getElementById('nav-user-name');
  const userRoleBadge = document.getElementById('nav-user-role-badge');
  const adminPill = document.getElementById('nav-admin-quick-switch');

  if (user) {
    if (guestBtn) guestBtn.classList.add('hidden');
    if (userMenu) userMenu.classList.remove('hidden');
    if (userNameEl) userNameEl.innerText = user.name;
    if (userRoleBadge) {
      userRoleBadge.innerText = user.role.toUpperCase();
      userRoleBadge.className = `text-[9px] font-bold px-1.5 py-0.5 rounded ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`;
    }
    // Show admin view switcher if admin
    if (adminPill) {
      adminPill.classList.toggle('hidden', user.role !== 'admin');
    }
  } else {
    if (guestBtn) guestBtn.classList.remove('hidden');
    if (userMenu) userMenu.classList.add('hidden');
    if (adminPill) adminPill.classList.add('hidden');
  }
}

function openAuthModal(mode = 'customer') {
  document.getElementById('auth-modal').classList.remove('hidden');
  switchAuthTab('login');
  if (mode === 'admin') {
    fillDemoAdmin();
  }
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.add('hidden');
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('auth-tab-login').className = isLogin 
    ? 'flex-1 py-2 font-bold text-xs border-b-2 border-indigo-600 text-indigo-600' 
    : 'flex-1 py-2 font-semibold text-xs border-b-2 border-transparent text-slate-400 hover:text-slate-700';
  document.getElementById('auth-tab-register').className = !isLogin 
    ? 'flex-1 py-2 font-bold text-xs border-b-2 border-indigo-600 text-indigo-600' 
    : 'flex-1 py-2 font-semibold text-xs border-b-2 border-transparent text-slate-400 hover:text-slate-700';

  document.getElementById('auth-form-login').classList.toggle('hidden', !isLogin);
  document.getElementById('auth-form-register').classList.toggle('hidden', isLogin);
}

// Quick Autofill for Viva / Professors!
function fillDemoAdmin() {
  switchAuthTab('login');
  document.getElementById('login-email').value = 'admin@shopsphere.com';
  document.getElementById('login-password').value = 'admin123';
  showToast('Filled Administrator demo credentials!');
}

function fillDemoCustomer() {
  switchAuthTab('login');
  document.getElementById('login-email').value = 'customer@shopsphere.com';
  document.getElementById('login-password').value = 'customer123';
  showToast('Filled Customer demo credentials!');
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value.trim();

  try {
    const res = await api.login(email, pass);
    showToast(res.message, 'success');
    closeAuthModal();
    updateAuthUI();

    if (res.user.role === 'admin') {
      navigateTo('admin');
    } else {
      navigateTo('store');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const pass = document.getElementById('reg-password').value.trim();

  try {
    const res = await api.register(name, email, pass, phone);
    showToast(res.message, 'success');
    closeAuthModal();
    updateAuthUI();
    navigateTo('store');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function handleLogout() {
  api.logout();
  updateAuthUI();
  showToast('Signed out successfully.');
  navigateTo('store');
}
