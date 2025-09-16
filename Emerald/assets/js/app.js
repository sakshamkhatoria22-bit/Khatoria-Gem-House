/* Core app: data loading, cart, and page renderers */
(function() {
  const BASE = location.pathname.includes('/pages/') ? '..' : '.';
  const PRODUCTS_URL = `${BASE}/data/products.json`;
  const STORAGE_KEY = 'emerald.cart.v1';

  const qs = (sel, ctx=document) => ctx.querySelector(sel);
  const qsa = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  function getCart() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  }
  function saveCart(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    updateCartCount();
  }
  function addToCart(productId, quantity=1) {
    const cart = getCart();
    const existing = cart.find(i => i.id === productId);
    if (existing) existing.quantity += quantity; else cart.push({ id: productId, quantity });
    saveCart(cart);
  }
  function removeFromCart(productId) {
    saveCart(getCart().filter(i => i.id !== productId));
  }
  function setQuantity(productId, quantity) {
    const cart = getCart();
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    item.quantity = Math.max(1, quantity|0);
    saveCart(cart);
  }
  function updateCartCount() {
    const el = qs('#cartCount');
    if (!el) return;
    const count = getCart().reduce((n, i) => n + i.quantity, 0);
    el.textContent = String(count);
    el.classList.toggle('hidden', count === 0);
  }

  async function loadProducts() {
    const res = await fetch(PRODUCTS_URL);
    if (!res.ok) throw new Error('Failed to load products');
    return await res.json();
  }

  function formatPrice(n) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n); }

  function productCard(p) {
    const href = `${BASE}/pages/product.html?id=${encodeURIComponent(p.id)}`;
    const img = p.image && p.image.startsWith('/') ? `${BASE}${p.image}` : (p.image || `${BASE}/assets/img/placeholder.jpg`);
    return `
      <div class="card">
        <a href="${href}"><img class="card-media" src="${img}" alt="${p.title}"></a>
        <div class="card-body">
          <strong>${p.title}</strong>
          <span class="muted">${p.cut} • ${p.carat} ct • ${p.clarity}</span>
          <div class="price">${formatPrice(p.price)}</div>
          <div>
            <a href="${href}" class="btn btn-outline">View details</a>
            <button class="btn btn-primary" data-add="${p.id}">Add to cart</button>
          </div>
        </div>
      </div>`;
  }

  async function renderHome() {
    const grid = qs('#featuredGrid');
    if (!grid) return;
    const products = await loadProducts();
    const featured = products.slice(0, 8);
    grid.innerHTML = featured.map(productCard).join('');
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add]');
      if (!btn) return;
      addToCart(btn.getAttribute('data-add'));
    });
  }

  async function renderProductsPage() {
    const grid = qs('#productsGrid');
    if (!grid) return;
    const params = new URLSearchParams(location.search);
    const cutFilter = params.get('cut');
    const q = (params.get('q') || '').toLowerCase();
    const products = await loadProducts();
    const filtered = products.filter(p => (
      (!cutFilter || p.cut.toLowerCase() === cutFilter.toLowerCase()) &&
      (!q || (`${p.title} ${p.cut} ${p.clarity}`.toLowerCase().includes(q)))
    ));
    grid.innerHTML = filtered.map(productCard).join('');
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add]');
      if (!btn) return;
      addToCart(btn.getAttribute('data-add'));
    });
  }

  async function renderProductDetail() {
    const container = qs('#productDetail');
    if (!container) return;
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const products = await loadProducts();
    const p = products.find(x => String(x.id) === String(id));
    if (!p) { container.innerHTML = '<p>Product not found.</p>'; return; }
    const img = p.image && p.image.startsWith('/') ? `${BASE}${p.image}` : (p.image || `${BASE}/assets/img/placeholder.jpg`);
    container.innerHTML = `
      <div class="product-layout">
        <div>
          <img class="card-media" style="border-radius: 16px;" src="${img}" alt="${p.title}">
        </div>
        <div class="stack-md">
          <div class="stack-sm">
            <h1>${p.title}</h1>
            <div class="badge">${p.cut} • ${p.carat} ct • ${p.clarity}</div>
          </div>
          <div class="price">${formatPrice(p.price)}</div>
          <p class="muted">${p.description || 'Beautiful natural emerald with excellent saturation and clarity.'}</p>
          <div class="stack-sm">
            <button id="addToCart" class="btn btn-primary">Add to cart</button>
            <a class="btn btn-outline" href="/pages/checkout.html">Buy now</a>
          </div>
        </div>
      </div>`;
    qs('#addToCart').addEventListener('click', () => addToCart(p.id));
  }

  async function renderCart() {
    const table = qs('#cartTable');
    if (!table) return;
    const products = await loadProducts();
    const cart = getCart();
    const rows = cart.map(item => {
      const p = products.find(x => x.id === item.id);
      if (!p) return '';
      const total = p.price * item.quantity;
      return `
        <tr>
          <td><div class="stack-sm"><strong>${p.title}</strong><span class="muted">${p.cut} • ${p.carat} ct</span></div></td>
          <td>${formatPrice(p.price)}</td>
          <td>
            <input type="number" min="1" value="${item.quantity}" data-qty="${p.id}" style="width:84px">
          </td>
          <td>${formatPrice(total)}</td>
          <td><button class="btn btn-outline" data-remove="${p.id}">Remove</button></td>
        </tr>`;
    }).join('');
    const subtotal = cart.reduce((n, item) => {
      const p = products.find(x => x.id === item.id);
      return n + (p ? p.price * item.quantity : 0);
    }, 0);
    table.querySelector('tbody').innerHTML = rows || '<tr><td colspan="5">Your cart is empty.</td></tr>';
    qs('#cartSubtotal').textContent = formatPrice(subtotal);
    table.addEventListener('input', (e) => {
      const input = e.target.closest('[data-qty]');
      if (!input) return;
      setQuantity(input.getAttribute('data-qty'), Number(input.value));
      renderCart();
    });
    table.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove]');
      if (!btn) return;
      removeFromCart(btn.getAttribute('data-remove'));
      renderCart();
    });
  }

  async function renderCheckout() {
    const summary = qs('#checkoutSummary');
    if (!summary) return;
    const products = await loadProducts();
    const cart = getCart();
    if (!cart.length) { summary.innerHTML = '<p>Your cart is empty.</p>'; return; }
    const lines = cart.map(item => {
      const p = products.find(x => x.id === item.id);
      if (!p) return null;
      return `${item.quantity} x ${p.title} (${p.carat} ct) - ${formatPrice(p.price * item.quantity)}`;
    }).filter(Boolean);
    const total = cart.reduce((n, item) => {
      const p = products.find(x => x.id === item.id); return n + (p ? p.price * item.quantity : 0);
    }, 0);
    summary.innerHTML = `
      <div class="card" style="padding: 16px;">
        <div class="stack-sm">
          ${lines.map(l => `<div>${l}</div>`).join('')}
          <hr>
          <div><strong>Total: ${formatPrice(total)}</strong></div>
        </div>
      </div>`;
    const waBtn = qs('#whatsappCheckout');
    if (waBtn) {
      const msg = encodeURIComponent(`Hello! I'd like to order:\n\n${lines.join('\n')}\n\nTotal: ${formatPrice(total)}`);
      const phone = waBtn.getAttribute('data-phone') || '919999999999';
      waBtn.setAttribute('href', `https://wa.me/${phone}?text=${msg}`);
    }
  }

  function init() {
    updateCartCount();
    const y = qs('#year'); if (y) y.textContent = String(new Date().getFullYear());
    renderHome();
    renderProductsPage();
    renderProductDetail();
    renderCart();
    renderCheckout();
  }

  document.addEventListener('DOMContentLoaded', init);
})();


