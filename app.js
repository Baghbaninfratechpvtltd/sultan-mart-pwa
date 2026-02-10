// =======================
// SETTINGS
// =======================
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0DkCrsf4_AD96Kv9yaYNbMUUHpQtz59zkXH9f1T9mPI2pXB-OcXTR0pdO-9sgyarYD4pEp8nolt5R/pub?output=csv";

const SHOP_PHONE = "9559868648";
const SHOP_WHATSAPP = "9559868648";
const MIN_ORDER = 199;

// Delivery
const FREE_AREA = "Bharatganj";
const PAID_DELIVERY_CHARGE = 20;

// =======================
// DOM
// =======================
const offersGrid = document.getElementById("offersGrid");
const productsGrid = document.getElementById("productsGrid");
const categoryChips = document.getElementById("categoryChips");
const searchInput = document.getElementById("searchInput");

const openCartBtn = document.getElementById("openCartBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartBackdrop = document.getElementById("cartBackdrop");
const cartModal = document.getElementById("cartModal");

const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");

const whatsappBtn = document.getElementById("whatsappBtn");
const confirmBtn = document.getElementById("confirmBtn");
const clearCartBtn = document.getElementById("clearCartBtn");
const callBtn = document.getElementById("callBtn");

// =======================
// STATE
// =======================
let allProducts = [];
let selectedCategory = "All";
let searchQuery = "";

let cart = JSON.parse(localStorage.getItem("cart_sultanmart") || "[]");

// Customer form data
let customer = JSON.parse(localStorage.getItem("customer_sultanmart") || "{}");

// =======================
// HELPERS
// =======================
function parseCSV(csvText) {
  const rows = csvText.trim().split("\n").map(r => r.split(","));
  const headers = rows[0].map(h => h.trim());
  const data = [];

  for (let i = 1; i < rows.length; i++) {
    const obj = {};
    rows[i].forEach((val, idx) => {
      obj[headers[idx]] = (val || "").trim();
    });
    data.push(obj);
  }
  return data;
}

function toNumber(v) {
  const n = Number(String(v || "").replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function getDiscountPercent(mrp, sale) {
  if (!mrp || !sale || mrp <= 0) return 0;
  const p = Math.round(((mrp - sale) / mrp) * 100);
  return p > 0 ? p : 0;
}

function saveCart() {
  localStorage.setItem("cart_sultanmart", JSON.stringify(cart));
}

function saveCustomer() {
  localStorage.setItem("customer_sultanmart", JSON.stringify(customer));
}

function cartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function cartSubTotal() {
  return cart.reduce((sum, item) => sum + item.qty * item.salePrice, 0);
}

function getDeliveryCharge() {
  if (!customer.area) return 0;
  if (customer.area === "Bharatganj") return 0;
  return PAID_DELIVERY_CHARGE;
}

function cartGrandTotal() {
  return cartSubTotal() + getDeliveryCharge();
}

// =======================
// MODAL OPEN/CLOSE
// =======================
function openCart() {
  cartBackdrop.style.display = "block";
  cartModal.style.display = "block";
  renderCart();
}

function closeCart() {
  cartBackdrop.style.display = "none";
  cartModal.style.display = "none";
}

// =======================
// CART FUNCTIONS
// =======================
function addToCart(product) {
  const found = cart.find(i => i.id === product.id);
  if (found) found.qty += 1;
  else cart.push({ ...product, qty: 1 });

  saveCart();
  updateCartUI();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);

  saveCart();
  updateCartUI();
  renderCart();
}

function clearCart() {
  cart = [];
  saveCart();
  updateCartUI();
  renderCart();
}

function updateCartUI() {
  cartCountEl.textContent = cartCount();
}

// =======================
// PRODUCTS RENDER
// =======================
function productCard(p) {
  const mrp = toNumber(p.MRP);
  const sale = toNumber(p["Sale Price"]);
  const stock = toNumber(p.Stock);
  const disc = getDiscountPercent(mrp, sale);

  const outOfStock = stock <= 0;

  return `
    <div class="product-card">
      <img class="product-img" src="${p.Image}" alt="${p.Name}" onerror="this.src='assets/logo.png'" />

      <div>
        <div class="product-name">${p.Name}</div>
        <div class="product-cat">${p.Category || ""}</div>
      </div>

      <div class="price-row">
        <div class="sale-price">₹${sale}</div>
        ${mrp > 0 && mrp !== sale ? `<div class="mrp">₹${mrp}</div>` : ""}
        ${disc > 0 ? `<div class="badge-off">${disc}% OFF</div>` : ""}
      </div>

      <div class="stock">${outOfStock ? "❌ Out of Stock" : `Stock: ${stock}`}</div>

      <button class="btn-add" ${outOfStock ? "disabled" : ""} onclick="window.__addToCart('${p.ID}')">
        ${outOfStock ? "Out of Stock" : "Add to Cart"}
      </button>
    </div>
  `;
}

function renderCategories() {
  const cats = ["All", ...new Set(allProducts.map(p => (p.Category || "").trim()).filter(Boolean))];

  categoryChips.innerHTML = cats.map(cat => `
    <button class="chip ${cat === selectedCategory ? "active" : ""}" onclick="window.__selectCategory('${cat}')">
      ${cat}
    </button>
  `).join("");
}

function filteredProducts() {
  return allProducts.filter(p => {
    const name = (p.Name || "").toLowerCase();
    const cat = (p.Category || "").toLowerCase();

    const matchesSearch =
      name.includes(searchQuery) || cat.includes(searchQuery);

    const matchesCat =
      selectedCategory === "All" || (p.Category || "") === selectedCategory;

    return matchesSearch && matchesCat;
  });
}

function renderProducts() {
  const list = filteredProducts();

  // Offers first
  const offers = list.filter(p => {
    const mrp = toNumber(p.MRP);
    const sale = toNumber(p["Sale Price"]);
    return getDiscountPercent(mrp, sale) > 0;
  });

  offersGrid.innerHTML = offers.map(productCard).join("") || `<div style="opacity:.7">No offers available</div>`;
  productsGrid.innerHTML = list.map(productCard).join("") || `<div style="opacity:.7">No products found</div>`;
}

// =======================
// CART RENDER (FULL DETAILS)
// =======================
function renderCart() {
  if (cart.length === 0) {
    cartItemsEl.innerHTML = `
      <div style="opacity:.7; padding: 10px 0;">Cart is empty</div>
    `;
    cartTotalEl.textContent = "0";
    return;
  }

  // Customer form inside cart
  cartItemsEl.innerHTML = `
    <div style="padding-bottom:12px;">
      <div style="font-weight:900; margin-bottom:8px;">👤 Customer Details</div>

      <div style="display:grid; gap:8px;">
        <input id="custName" placeholder="Customer Name" value="${customer.name || ""}" style="padding:12px;border-radius:14px;border:1px solid #ddd;width:100%;" />
        <input id="custMobile" placeholder="Mobile Number" value="${customer.mobile || ""}" style="padding:12px;border-radius:14px;border:1px solid #ddd;width:100%;" />
        <input id="custAddress" placeholder="Full Address" value="${customer.address || ""}" style="padding:12px;border-radius:14px;border:1px solid #ddd;width:100%;" />

        <select id="custArea" style="padding:12px;border-radius:14px;border:1px solid #ddd;width:100%;">
          <option value="">Select Area</option>
          <option value="Bharatganj" ${customer.area === "Bharatganj" ? "selected" : ""}>Bharatganj (Free Delivery)</option>
          <option value="Other" ${customer.area === "Other" ? "selected" : ""}>Other Area (₹20 Delivery)</option>
        </select>

        <select id="custTime" style="padding:12px;border-radius:14px;border:1px solid #ddd;width:100%;">
          <option value="">Select Delivery Time</option>
          <option value="Morning" ${customer.time === "Morning" ? "selected" : ""}>Morning (7 AM – 11 AM)</option>
          <option value="Afternoon" ${customer.time === "Afternoon" ? "selected" : ""}>Afternoon (12 PM – 4 PM)</option>
          <option value="Evening" ${customer.time === "Evening" ? "selected" : ""}>Evening (5 PM – 9 PM)</option>
        </select>

        <textarea id="custNote" placeholder="Any Note (optional)" style="padding:12px;border-radius:14px;border:1px solid #ddd;width:100%;min-height:70px;">${customer.note || ""}</textarea>
      </div>
    </div>

    <div style="font-weight:900; margin: 8px 0;">🛒 Items</div>

    ${cart.map(item => `
      <div class="cart-item">
        <div>
          <div class="cart-item-name">${item.name}</div>
          <div style="opacity:.7; font-size:12px;">₹${item.salePrice} each</div>
        </div>

        <div class="qty-controls">
          <button class="qty-btn" onclick="window.__changeQty('${item.id}', -1)">-</button>
          <div class="qty">${item.qty}</div>
          <button class="qty-btn" onclick="window.__changeQty('${item.id}', 1)">+</button>
        </div>

        <div class="cart-item-price">₹${item.qty * item.salePrice}</div>
      </div>
    `).join("")}
  `;

  // Save customer live
  setTimeout(() => {
    const nameEl = document.getElementById("custName");
    const mobEl = document.getElementById("custMobile");
    const addEl = document.getElementById("custAddress");
    const areaEl = document.getElementById("custArea");
    const timeEl = document.getElementById("custTime");
    const noteEl = document.getElementById("custNote");

    function update() {
      customer.name = nameEl.value.trim();
      customer.mobile = mobEl.value.trim();
      customer.address = addEl.value.trim();
      customer.area = areaEl.value;
      customer.time = timeEl.value;
      customer.note = noteEl.value.trim();
      saveCustomer();

      cartTotalEl.textContent = cartGrandTotal();
    }

    [nameEl, mobEl, addEl, areaEl, timeEl, noteEl].forEach(el => {
      el.addEventListener("input", update);
      el.addEventListener("change", update);
    });

    cartTotalEl.textContent = cartGrandTotal();
  }, 50);
}

// =======================
// WHATSAPP MESSAGE
// =======================
function buildWhatsAppMessage() {
  let msg = `🛒 *Sultan Mart Bharatganj*\n\n`;
  msg += `📌 *New Order*\n\n`;

  msg += `👤 Name: ${customer.name || "-"}\n`;
  msg += `📞 Mobile: ${customer.mobile || "-"}\n`;
  msg += `🏠 Address: ${customer.address || "-"}\n`;
  msg += `📍 Area: ${customer.area || "-"}\n`;
  msg += `⏰ Delivery Time: ${customer.time || "-"}\n`;
  msg += `📝 Note: ${customer.note || "-"}\n\n`;

  msg += `🛍️ *Items:*\n`;

  cart.forEach((item, idx) => {
    msg += `${idx + 1}. ${item.name}  x${item.qty}  = ₹${item.qty * item.salePrice}\n`;
  });

  msg += `\n------------------------\n`;
  msg += `🧾 Subtotal: ₹${cartSubTotal()}\n`;
  msg += `🚚 Delivery Charge: ₹${getDeliveryCharge()}\n`;
  msg += `💰 *Grand Total:* ₹${cartGrandTotal()}\n`;
  msg += `📦 Minimum Order: ₹${MIN_ORDER}\n`;
  msg += `------------------------\n\n`;

  msg += `✅ Please confirm my order.\n`;

  return msg;
}

// =======================
// LOAD SHEET
// =======================
async function loadProducts() {
  try {
    const res = await fetch(SHEET_CSV_URL);
    const text = await res.text();

    const raw = parseCSV(text);

    allProducts = raw.map(r => ({
      ID: r.ID || r.Id || r.id,
      Name: r.Name || r.name,
      Category: r.Category || r.category,
      MRP: r.MRP || r.mrp,
      Discount: r.Discount || r.discount,
      "Sale Price": r["Sale Price"] || r["SalePrice"] || r.saleprice || r.sale,
      Stock: r.Stock || r.stock,
      Image: r.Image || r.image || "assets/logo.png"
    }))
    .filter(p => p.ID && p.Name);

    renderCategories();
    renderProducts();
    updateCartUI();
  } catch (e) {
    offersGrid.innerHTML = `<div style="color:red; font-weight:800;">CSV Link Wrong / Sheet Not Public</div>`;
    productsGrid.innerHTML = `<div style="color:red; font-weight:800;">CSV Link Wrong / Sheet Not Public</div>`;
    console.log(e);
  }
}

// =======================
// GLOBAL
// =======================
window.__addToCart = function(id){
  const p = allProducts.find(x => String(x.ID) === String(id));
  if (!p) return;

  const item = {
    id: String(p.ID),
    name: p.Name,
    salePrice: toNumber(p["Sale Price"]),
  };
  addToCart(item);
};

window.__changeQty = changeQty;

window.__selectCategory = function(cat){
  selectedCategory = cat;
  renderCategories();
  renderProducts();
};

// =======================
// EVENTS
// =======================
openCartBtn.addEventListener("click", openCart);
closeCartBtn.addEventListener("click", closeCart);
cartBackdrop.addEventListener("click", closeCart);

searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value.trim().toLowerCase();
  renderProducts();
});

whatsappBtn.addEventListener("click", () => {
  if (cart.length === 0) return alert("Cart is empty!");

  if (cartGrandTotal() < MIN_ORDER) {
    return alert(`Minimum order ₹${MIN_ORDER} required!`);
  }

  const msg = buildWhatsAppMessage();
  const url = `https://wa.me/91${SHOP_WHATSAPP}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
});

confirmBtn.addEventListener("click", () => {
  if (cart.length === 0) return alert("Cart is empty!");

  alert("✅ Your order is confirmed! Thank you 😊");

  const confirmMsg = `✅ *Your order is confirmed!* \n\nThank you for shopping from *Sultan Mart Bharatganj* 😊`;
  const url = `https://wa.me/91${SHOP_WHATSAPP}?text=${encodeURIComponent(confirmMsg)}`;
  window.open(url, "_blank");

  clearCart();
  closeCart();
});

clearCartBtn.addEventListener("click", () => {
  clearCart();
});

// Call
callBtn.href = `tel:${SHOP_PHONE}`;

// =======================
// INIT
// =======================
loadProducts();
updateCartUI();
