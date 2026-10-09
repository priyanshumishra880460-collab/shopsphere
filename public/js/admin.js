// ShopSphere Administrative Dashboard Controller
let salesChartInstance = null;
let categoryChartInstance = null;
let currentAdminTab = 'products';
let adminProductsCache = [];

async function initAdminDashboard() {
  const user = api.getCurrentUser();
  if (!user || user.role !== 'admin') {
    showToast('Administrator privileges required to access the dashboard.', 'error');
    openAuthModal('admin');
    return false;
  }

  // Update Admin Profile in Top Bar
  const nameEl = document.getElementById('admin-profile-name');
  if (nameEl) nameEl.innerText = user.name;

  await loadAdminStats();
  await loadAdminProducts();
  return true;
}

// 1. Load Metrics & Render Visual Charts
async function loadAdminStats() {
  try {
    const res = await api.adminGetStats();
    if (!res.success) return;
    const stats = res.stats;

    // Stat Cards
    document.getElementById('stat-revenue').innerText = `₹${stats.totalRevenue.toLocaleString('en-IN')}`;
    document.getElementById('stat-orders').innerText = stats.totalOrders;
    document.getElementById('stat-products').innerText = stats.totalProducts;
    document.getElementById('stat-customers').innerText = stats.totalCustomers;
    document.getElementById('stat-low-stock').innerText = stats.lowStockCount;

    // Render Charts
    renderSalesCharts(stats);
  } catch (err) {
    showToast('Failed to load administrative analytics: ' + err.message, 'error');
  }
}

function renderSalesCharts(stats) {
  // 1. Monthly Revenue Trend Chart (Simulated 6-month historical curve)
  const salesCtx = document.getElementById('admin-sales-chart');
  if (salesCtx) {
    if (salesChartInstance) salesChartInstance.destroy();

    salesChartInstance = new Chart(salesCtx, {
      type: 'line',
      data: {
        labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct (Current)'],
        datasets: [{
          label: 'Revenue (₹)',
          data: [18400, 24500, 31200, 29800, 42100, stats.totalRevenue || 55000],
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#4F46E5',
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: val => '₹' + (val >= 1000 ? (val / 1000) + 'k' : val)
            }
          }
        }
      }
    });
  }

  // 2. Category Distribution Doughnut
  const catCtx = document.getElementById('admin-category-chart');
  if (catCtx) {
    if (categoryChartInstance) categoryChartInstance.destroy();

    const catLabels = Object.keys(stats.categorySales).map(c => c.toUpperCase());
    const catData = Object.values(stats.categorySales);

    categoryChartInstance = new Chart(catCtx, {
      type: 'doughnut',
      data: {
        labels: catLabels.length ? catLabels : ['ELECTRONICS', 'AUDIO', 'FASHION', 'HOME'],
        datasets: [{
          data: catData.length ? catData : [45, 25, 20, 10],
          backgroundColor: ['#4F46E5', '#06B6D4', '#F59E0B', '#10B981']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }
}

// 2. Tab Navigation
function switchAdminTab(tabName) {
  currentAdminTab = tabName;
  ['products', 'inventory', 'orders', 'customers'].forEach(t => {
    const tabBtn = document.getElementById(`admin-tab-btn-${t}`);
    const tabSection = document.getElementById(`admin-tab-content-${t}`);
    if (tabBtn) {
      if (t === tabName) {
        tabBtn.className = 'px-4 py-2 font-bold text-sm rounded-xl bg-indigo-600 text-white shadow-sm transition';
      } else {
        tabBtn.className = 'px-4 py-2 font-semibold text-sm rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition';
      }
    }
    if (tabSection) {
      tabSection.classList.toggle('hidden', t !== tabName);
    }
  });

  if (tabName === 'products') loadAdminProducts();
  if (tabName === 'inventory') loadAdminInventory();
  if (tabName === 'orders') loadAdminOrders();
  if (tabName === 'customers') loadAdminCustomers();
}

// 3. Products Management Tab
async function loadAdminProducts() {
  try {
    const res = await api.getProducts();
    if (!res.success) return;
    adminProductsCache = res.products;

    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;

    tbody.innerHTML = adminProductsCache.map(p => {
      const stockBadge = p.stock > 10 
        ? '<span class="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700">In Stock (' + p.stock + ')</span>'
        : (p.stock > 0 
          ? '<span class="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-700">Low Stock (' + p.stock + ')</span>'
          : '<span class="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700">Out of Stock</span>');

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50/60 transition">
          <td class="py-3 px-4 flex items-center gap-3">
            <img src="${p.image}" class="w-11 h-11 object-cover rounded-lg border border-slate-200" />
            <div>
              <div class="font-bold text-sm text-slate-900 leading-snug">${escapeHtml(p.name)}</div>
              <div class="text-xs text-slate-400 capitalize">${p.category}</div>
            </div>
          </td>
          <td class="py-3 px-4 font-bold text-sm text-slate-900">₹${p.price.toLocaleString('en-IN')}</td>
          <td class="py-3 px-4">${stockBadge}</td>
          <td class="py-3 px-4 text-xs font-semibold text-slate-700">${p.rating} ★ <span class="text-slate-400">(${p.reviewsCount})</span></td>
          <td class="py-3 px-4 text-right space-x-2">
            <button onclick="openEditProductModal('${p.id}')" class="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition">Edit</button>
            <button onclick="handleDeleteProduct('${p.id}', '${escapeHtml(p.name)}')" class="px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg transition">Delete</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    showToast('Failed to load products: ' + err.message, 'error');
  }
}

// 4. Inventory Tab
async function loadAdminInventory() {
  try {
    const res = await api.getProducts();
    if (!res.success) return;
    const products = res.products;

    const tbody = document.getElementById('admin-inventory-tbody');
    if (!tbody) return;

    tbody.innerHTML = products.map(p => `
      <tr class="border-b border-slate-100 hover:bg-slate-50/60 transition">
        <td class="py-3 px-4 flex items-center gap-3">
          <img src="${p.image}" class="w-10 h-10 object-cover rounded-lg border border-slate-200" />
          <span class="font-bold text-sm text-slate-900">${escapeHtml(p.name)}</span>
        </td>
        <td class="py-3 px-4 text-xs font-medium text-slate-500 uppercase">${p.category}</td>
        <td class="py-3 px-4">
          <div class="flex items-center gap-2">
            <button onclick="quickAdjustStock('${p.id}', ${p.stock - 1})" class="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800 font-bold transition flex items-center justify-center">-</button>
            <input type="number" value="${p.stock}" min="0" onchange="quickAdjustStock('${p.id}', this.value)" class="w-16 text-center font-bold text-sm border border-slate-200 rounded-lg py-1 focus:border-indigo-600 focus:outline-none" />
            <button onclick="quickAdjustStock('${p.id}', ${p.stock + 1})" class="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800 font-bold transition flex items-center justify-center">+</button>
          </div>
        </td>
        <td class="py-3 px-4">
          ${p.stock <= 10 
            ? '<span class="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">⚠ Low Stock Alert</span>' 
            : '<span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">✓ Healthy Stock</span>'}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showToast('Failed to load inventory: ' + err.message, 'error');
  }
}

async function quickAdjustStock(prodId, newStock) {
  const stockVal = Math.max(0, parseInt(newStock, 10));
  try {
    await api.adminUpdateStock(prodId, stockVal);
    showToast(`Stock updated to ${stockVal} units!`);
    loadAdminInventory();
    loadAdminStats();
  } catch (err) {
    showToast('Stock update failed: ' + err.message, 'error');
  }
}

// 5. Orders Management Tab
async function loadAdminOrders() {
  try {
    const res = await api.adminGetAllOrders();
    if (!res.success) return;
    const orders = res.orders;

    const tbody = document.getElementById('admin-orders-tbody');
    if (!tbody) return;

    tbody.innerHTML = orders.map(o => {
      const statusOptions = ['Order Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50/60 transition">
          <td class="py-3.5 px-4">
            <span class="font-mono font-bold text-xs text-indigo-600">${o.id}</span>
            <div class="text-[11px] text-slate-400 mt-0.5">${new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
          </td>
          <td class="py-3.5 px-4">
            <div class="font-bold text-sm text-slate-900">${escapeHtml(o.customerName)}</div>
            <div class="text-xs text-slate-500">${escapeHtml(o.customerEmail)}</div>
          </td>
          <td class="py-3.5 px-4 text-xs text-slate-600">
            ${(o.items || []).map(i => `${i.quantity}x ${escapeHtml(i.name)}`).join('<br>')}
          </td>
          <td class="py-3.5 px-4 font-bold text-sm text-slate-900">₹${o.total.toLocaleString('en-IN')}</td>
          <td class="py-3.5 px-4">
            <select onchange="handleAdminStatusChange('${o.id}', this.value)" class="text-xs font-bold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:border-indigo-600 focus:outline-none cursor-pointer">
              ${statusOptions.map(s => `<option value="${s}" ${s === o.orderStatus ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    showToast('Failed to load orders: ' + err.message, 'error');
  }
}

async function handleAdminStatusChange(orderId, newStatus) {
  try {
    await api.adminUpdateOrderStatus(orderId, newStatus);
    showToast(`Order ${orderId} status set to "${newStatus}"!`);
    loadAdminStats();
  } catch (err) {
    showToast('Failed to update status: ' + err.message, 'error');
  }
}

// 6. Customers Tab
async function loadAdminCustomers() {
  try {
    const res = await api.adminGetUsers();
    if (!res.success) return;
    const users = res.users;

    const tbody = document.getElementById('admin-customers-tbody');
    if (!tbody) return;

    tbody.innerHTML = users.map(u => `
      <tr class="border-b border-slate-100 hover:bg-slate-50/60 transition">
        <td class="py-3.5 px-4 flex items-center gap-3">
          <img src="${u.avatar}" class="w-9 h-9 rounded-full bg-slate-100" />
          <div>
            <div class="font-bold text-sm text-slate-900">${escapeHtml(u.name)}</div>
            <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}">${u.role}</span>
          </div>
        </td>
        <td class="py-3.5 px-4 text-xs text-slate-600">${escapeHtml(u.email)}</td>
        <td class="py-3.5 px-4 font-bold text-sm text-slate-800">${u.ordersCount} orders</td>
        <td class="py-3.5 px-4 font-bold text-sm text-emerald-700">₹${u.totalSpent.toLocaleString('en-IN')}</td>
        <td class="py-3.5 px-4 text-xs text-slate-400">${new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
      </tr>
    `).join('');
  } catch (err) {
    showToast('Failed to load customers: ' + err.message, 'error');
  }
}

// 7. Add / Edit / Delete Modals
function openAddProductModal() {
  document.getElementById('modal-product-title').innerText = 'Add New Product to ShopSphere';
  document.getElementById('form-product-id').value = '';
  document.getElementById('form-prod-name').value = '';
  document.getElementById('form-prod-category').value = 'electronics';
  document.getElementById('form-prod-price').value = '';
  document.getElementById('form-prod-orig-price').value = '';
  document.getElementById('form-prod-stock').value = '20';
  document.getElementById('form-prod-image').value = '';
  document.getElementById('form-prod-desc').value = '';
  document.getElementById('form-prod-specs').value = '';
  document.getElementById('product-edit-modal').classList.remove('hidden');
}

function openEditProductModal(id) {
  const p = adminProductsCache.find(x => x.id === id);
  if (!p) return;

  document.getElementById('modal-product-title').innerText = 'Edit Product Details';
  document.getElementById('form-product-id').value = p.id;
  document.getElementById('form-prod-name').value = p.name;
  document.getElementById('form-prod-category').value = p.category;
  document.getElementById('form-prod-price').value = p.price;
  document.getElementById('form-prod-orig-price').value = p.originalPrice || '';
  document.getElementById('form-prod-stock').value = p.stock;
  document.getElementById('form-prod-image').value = p.image;
  document.getElementById('form-prod-desc').value = p.description;
  document.getElementById('form-prod-specs').value = (p.specs || []).join(', ');
  document.getElementById('product-edit-modal').classList.remove('hidden');
}

function closeProductEditModal() {
  document.getElementById('product-edit-modal').classList.add('hidden');
}

async function handleSaveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('form-product-id').value;
  const prodData = {
    name: document.getElementById('form-prod-name').value.trim(),
    category: document.getElementById('form-prod-category').value,
    price: parseFloat(document.getElementById('form-prod-price').value),
    originalPrice: parseFloat(document.getElementById('form-prod-orig-price').value) || undefined,
    stock: parseInt(document.getElementById('form-prod-stock').value, 10),
    image: document.getElementById('form-prod-image').value.trim(),
    description: document.getElementById('form-prod-desc').value.trim(),
    specs: document.getElementById('form-prod-specs').value.split(',').map(s => s.trim()).filter(Boolean)
  };

  try {
    if (id) {
      await api.adminUpdateProduct(id, prodData);
      showToast('Product updated successfully!');
    } else {
      await api.adminCreateProduct(prodData);
      showToast('New product published to catalog!');
    }
    closeProductEditModal();
    loadAdminProducts();
    loadAdminStats();
    // Also refresh storefront catalog
    if (typeof loadStoreProducts === 'function') loadStoreProducts();
  } catch (err) {
    showToast('Failed to save product: ' + err.message, 'error');
  }
}

async function handleDeleteProduct(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}" from ShopSphere?`)) return;

  try {
    await api.adminDeleteProduct(id);
    showToast(`"${name}" removed successfully.`);
    loadAdminProducts();
    loadAdminStats();
    if (typeof loadStoreProducts === 'function') loadStoreProducts();
  } catch (err) {
    showToast('Delete failed: ' + err.message, 'error');
  }
}
