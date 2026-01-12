
// =============================
// Veggie's Grocery Market JS
// No GA/GTM. Uses localStorage for cart. Beginner-friendly.
// =============================

// Global cart key
const CART_KEY = 'veggies_cart';

// Dummy product data (you can extend this easily)
const PRODUCTS = [
  {id:1, name:'Apples', category:'Fruits', price:120, image:'assets/images/products/placeholder.png'},
  {id:2, name:'Bananas', category:'Fruits', price:60, image:'assets/images/products/placeholder.png'},
  {id:3, name:'Tomatoes', category:'Vegetables', price:50, image:'assets/images/products/placeholder.png'},
  {id:4, name:'Potatoes', category:'Vegetables', price:40, image:'assets/images/products/placeholder.png'},
  {id:5, name:'Milk (1L)', category:'Dairy', price:70, image:'assets/images/products/placeholder.png'},
  {id:6, name:'Cheese (200g)', category:'Dairy', price:180, image:'assets/images/products/placeholder.png'},
  {id:7, name:'Chips', category:'Snacks', price:30, image:'assets/images/products/placeholder.png'},
  {id:8, name:'Biscuits', category:'Snacks', price:25, image:'assets/images/products/placeholder.png'},
  {id:9, name:'Rice (1kg)', category:'Grains', price:80, image:'assets/images/products/placeholder.png'},
  {id:10, name:'Wheat Flour (1kg)', category:'Grains', price:60, image:'assets/images/products/placeholder.png'},
  {id:11, name:'Juice', category:'Beverages', price:90, image:'assets/images/products/placeholder.png'},
  {id:12, name:'Tea', category:'Beverages', price:110, image:'assets/images/products/placeholder.png'},
  {id:13, name:'Detergent', category:'Household', price:220, image:'assets/images/products/placeholder.png'},
  {id:14, name:'Dish Soap', category:'Household', price:95, image:'assets/images/products/placeholder.png'}
];

// Utility: read & write cart
function getCart(){
  try{
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  }catch(e){
    return [];
  }
}
function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

// Utility: cart count
function updateNavCartCount(){
  const countEl = document.getElementById('navCartCount');
  if(!countEl) return;
  const cart = getCart();
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  countEl.textContent = totalQty;
}

// Add to cart
function addToCart(productId, qty){
  const product = PRODUCTS.find(p => p.id === productId);
  if(!product) return;
  const cart = getCart();
  const existing = cart.find(item => item.id === productId);
  if(existing){ existing.qty += qty; }
  else{ cart.push({ id:product.id, name:product.name, price:product.price, image:product.image, qty:qty }); }
  saveCart(cart);
  updateNavCartCount();
  // Push to dataLayer
  dataLayerPush('add_to_cart', { product_id: product.id, product_name: product.name, qty, price: product.price });
  alert(`${product.name} added to cart!`);
}

// Buy now => send single item to checkout
function buyNow(productId, qty){
  const product = PRODUCTS.find(p => p.id === productId);
  if(!product) return;
  // Optional: store a temp checkout item
  sessionStorage.setItem('veggies_buy_now', JSON.stringify({ id:product.id, name:product.name, price:product.price, image:product.image, qty }));
  dataLayerPush('begin_checkout', { type:'buy_now', product_id: product.id, product_name: product.name, qty, price: product.price });
  window.location.href = 'checkout.html';
}

// Render featured (home)
function renderFeatured(){
  const grid = document.getElementById('featuredGrid');
  if(!grid) return;
  const featured = PRODUCTS.slice(0, 8); // first 8 items
  grid.innerHTML = featured.map(p => cardHTML(p)).join('');
}

// Card HTML (used in home & shop)
function cardHTML(p){
  return `
  <div class="card">
    ${p.image}
    <h3>${p.name}</h3>
    <div class="price">₹${p.price}</div>
    <div class="qty-row">
      <label>Qty</label>
      <input type="number" min="1" value="1" id="qty_${p.id}" />
    </div>
    <div class="actions">
      <button class="btn btn-primary" onclick="addToCart(${p.id}, parseInt(document.getElementById('qty_${p.id}').value)||1)">Add to Cart</button>
      <button class="btn btn-secondary" onclick="buyNow(${p.id}, parseInt(document.getElementById('qty_${p.id}').value)||1)">Buy Now</button>
    </div>
  </div>`;
}

// Render shop grid with filters
function renderShopGrid(filter = {}){
  const grid = document.getElementById('shopGrid');
  if(!grid) return;
  let list = [...PRODUCTS];
  if(filter.category && filter.category !== 'All'){
    list = list.filter(p => p.category === filter.category);
  }
  if(filter.search){
    const q = filter.search.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q));
  }
  if(typeof filter.maxPrice === 'number'){
    list = list.filter(p => p.price <= filter.maxPrice);
  }
  grid.innerHTML = list.map(p => cardHTML(p)).join('');
  dataLayerPush('view_item_list', { category: filter.category || 'All', count: list.length, search: filter.search || '', maxPrice: filter.maxPrice || null });
}

// Cart page
function renderCart(){
  const wrap = document.getElementById('cartItems');
  if(!wrap) return;
  const cart = getCart();
  if(cart.length === 0){
    wrap.innerHTML = '<p>Your cart is empty.</p>';
    document.getElementById('cartTotal').textContent = '0';
    return;
  }
  wrap.innerHTML = cart.map(item => `
    <div class="cart-item">
      ${item.image}
      <div>
        <h4>${item.name}</h4>
        <div>₹${item.price} x ${item.qty} = ₹${item.price * item.qty}</div>
        <div class="qty-controls">
          <button class="btn" onclick="changeQty(${item.id}, -1)">-</button>
          <button class="btn" onclick="changeQty(${item.id}, +1)">+</button>
          <span class="remove" onclick="removeItem(${item.id})">Remove</span>
        </div>
      </div>
      <div></div>
    </div>
  `).join('');
  updateTotals();
}
function changeQty(id, delta){
  const cart = getCart();
  const it = cart.find(i => i.id === id);
  if(!it) return;
  it.qty = Math.max(1, it.qty + delta);
  saveCart(cart);
  renderCart();
  updateNavCartCount();
}
function removeItem(id){
  let cart = getCart();
  const it = cart.find(i => i.id === id);
  cart = cart.filter(i => i.id !== id);
  saveCart(cart);
  renderCart();
  updateNavCartCount();
  dataLayerPush('remove_from_cart', { product_id: it?.id, product_name: it?.name });
}
function updateTotals(){
  const cart = getCart();
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const el = document.getElementById('cartTotal');
  if(el) el.textContent = total;
}

// Checkout page
function renderOrderSummary(){
  const wrap = document.getElementById('orderSummary');
  if(!wrap) return;
  const buyNowItem = JSON.parse(sessionStorage.getItem('veggies_buy_now') || 'null');
  let cart = getCart();
  let items = cart;
  if(buyNowItem){ items = [buyNowItem]; }
  if(items.length === 0){ wrap.innerHTML = '<p>No items to checkout.</p>'; document.getElementById('orderTotal').textContent = '0'; return; }
  wrap.innerHTML = items.map(i => `<div>${i.name} - ₹${i.price} x ${i.qty} = ₹${i.price * i.qty}</div>`).join('');
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  document.getElementById('orderTotal').textContent = total;
}
function handleCheckout(){
  const form = document.getElementById('checkoutForm');
  if(!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    const name = document.getElementById('custName').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const total = document.getElementById('orderTotal').textContent;

    dataLayerPush('purchase', { name, address, phone, total });
    alert('Order placed successfully!');
    // Clear cart and buy-now temp
    localStorage.removeItem(CART_KEY);
    sessionStorage.removeItem('veggies_buy_now');
    updateNavCartCount();
    window.location.href = 'index.html';
  });
}

// Common init
function init(){
  // Year
  const y = document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();

  updateNavCartCount();

  const page = document.body.getAttribute('data-page');
  // Push page view
  dataLayerPush('page_view', { page });

  if(page === 'home'){
    renderFeatured();
  }
  if(page === 'shop'){
    // Filters
    const searchInput = document.getElementById('searchInput');
    const priceRange = document.getElementById('priceRange');
    const maxLabel = document.getElementById('maxPriceLabel');
    const catButtons = document.querySelectorAll('.cat-card');
    let currentFilter = { category:'All', search:'', maxPrice:1000 };
    renderShopGrid(currentFilter);

    searchInput.addEventListener('input', () => {
      currentFilter.search = searchInput.value;
      renderShopGrid(currentFilter);
    });
    priceRange.addEventListener('input', () => {
      currentFilter.maxPrice = parseInt(priceRange.value);
      maxLabel.textContent = priceRange.value;
      renderShopGrid(currentFilter);
    });
    catButtons.forEach(btn => btn.addEventListener('click', () => {
      currentFilter.category = btn.dataset.category;
      renderShopGrid(currentFilter);
    }));
  }
  if(page === 'cart'){
    renderCart();
    const checkoutBtn = document.getElementById('checkoutBtn');
    if(checkoutBtn){
      checkoutBtn.addEventListener('click', ()=>{
        dataLayerPush('begin_checkout', { source:'cart' });
      });
    }
  }
  if(page === 'checkout'){
    renderOrderSummary();
    handleCheckout();
  }
}

// Initialize after DOM ready
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
}else{ init(); }
