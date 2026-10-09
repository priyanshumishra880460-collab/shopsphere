// ShopSphere Client API Connector
const API_BASE = '/api';

const api = {
  getToken() {
    return localStorage.getItem('shopsphere_token') || null;
  },

  setToken(token) {
    if (token) localStorage.setItem('shopsphere_token', token);
    else localStorage.removeItem('shopsphere_token');
  },

  getCurrentUser() {
    try {
      const u = localStorage.getItem('shopsphere_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },

  setCurrentUser(user) {
    if (user) localStorage.setItem('shopsphere_user', JSON.stringify(user));
    else localStorage.removeItem('shopsphere_user');
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Network request failed.');
      }
      return data;
    } catch (err) {
      console.error(`API Error on [${endpoint}]:`, err.message);
      throw err;
    }
  },

  // Auth
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) {
      this.setToken(data.token);
      this.setCurrentUser(data.user);
    }
    return data;
  },

  async register(name, email, password, phone) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone })
    });
    if (data.token) {
      this.setToken(data.token);
      this.setCurrentUser(data.user);
    }
    return data;
  },

  logout() {
    this.setToken(null);
    this.setCurrentUser(null);
  },

  async getMe() {
    return this.request('/auth/me');
  },

  // Products
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/products${query ? '?' + query : ''}`);
  },

  async getProduct(id) {
    return this.request(`/products/${id}`);
  },

  async getCategories() {
    return this.request('/categories');
  },

  // Orders
  async placeOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },

  async getMyOrders() {
    return this.request('/orders/my');
  },

  async getOrder(id) {
    return this.request(`/orders/${id}`);
  },

  // Reviews
  async submitReview(reviewData) {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  },

  // Admin APIs
  async adminGetStats() {
    return this.request('/admin/stats');
  },

  async adminGetUsers() {
    return this.request('/admin/users');
  },

  async adminCreateProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  async adminUpdateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  },

  async adminDeleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE'
    });
  },

  async adminUpdateStock(id, stock) {
    return this.request(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock })
    });
  },

  async adminGetAllOrders() {
    return this.request('/orders/admin/all');
  },

  async adminUpdateOrderStatus(id, status, notes = '') {
    return this.request(`/orders/admin/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes })
    });
  }
};

// UI Notification Toast
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-indigo-600 text-white',
    warning: 'bg-amber-600 text-white'
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  };

  toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl font-medium text-xs sm:text-sm transform transition-all duration-300 translate-y-2 opacity-0 ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `
    <span class="font-bold text-base">${icons[type] || '•'}</span>
    <span class="flex-1">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  // Remove toast
  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
