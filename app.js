// =======================
// SETTINGS
// =======================
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0DkCrsf4_AD96Kv9yaYNbMUUHpQtz59zkXH9f1T9mPI2pXB-OcXTR0pdO-9sgyarYD4pEp8nolt5R/pub?output=csv";

const SHOP_PHONE = "9559868648";
const SHOP_WHATSAPP = "9559868648";
const UPI_ID = "9559868648@ptyes";

const MIN_ORDER = 199;
const OTHER_AREA_CHARGE = 20;

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
const cartCountEl = document.getElementById("cartCount");

const subTotalEl = document.getElementById("subTotal");
const deliveryChargeEl = document.getElementById("deliveryCharge");
const grandTotalEl = document.getElementById("grandTotal");
const orderIdEl = document.getElementById("orderId");

const whatsappBtn = document.getElementById("whatsappBtn");
const confirmBtn = document.getElementById("confirmBtn");
const clearCartBtn = document.getElementById("clearCartBtn");

const copyUpiBtn = document.getElementById("copyUpiBtn");
const upiText = document.getElementById("upiText");

// Form
const custName = document.getElementById("custName");
const custMobile = document.getElementById("custMobile");
const custAddress = document.getElementById("custAddress");
const custArea = document.getElementById("custArea");
const custDay = document.getElementById("custDay");
const custTime = document.getElementById("custTime");
const paymentMethod = document.getElementById("paymentMethod");
const custNote = document.getElementById("custNote");

// =======================
// STATE
// =======================
let allProducts = [];
let selectedCategory = "All";
let searchQuery = "";

let cart = JSON.parse(localStorage.getItem("cart_sultanmart") || "[]");
let customer = JSON.parse(localStorage.getItem("customer_sultanmart") || "{}");
let orderId = localStorage.getItem("order_id_sultanmart") || "";

// =======================
// HELPERS
// =======================
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
function saveOrderId() {
  localStorage.setItem("order_id_sultanmart", orderId);
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
  if (customer.area === "Other") return OTHER_AREA_CHARGE;
  return 0;
}

function cartGrandTotal() {
  return cartSubTotal() + getDeliveryCharge();
}

function generateOrderId() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  const rnd = Math.floor(100 + Math.random() * 900);
  return `${dd}${mm}${yy}-${rnd}`;
}

function updateCartUI() {
  cartCountEl.textContent = cartCount();
}

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
// CART ACTIONS
// =======================
function addToCart(product) {
  const found = cart.find(i => i.id === product.id);
  if (found) found.qty += 1;
  else cart.push({ ...product, qty: 1 });

  if (!orderId) {
    orderId = generateOrderId();
    saveOrderId();
  }

  saveCart();
  updateCartUI();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);

  if (cart.length === 0) {
    orderId = "";
    saveOrderId();
  }

  saveCart();
  updateCartUI();
  renderCart();
}

function clearCart() {
  cart = [];
  orderId = "";
  saveCart();
  saveOrderId();
  updateCartUI();
  renderCart();
}

// =======================
// RENDER CART
// =======================
function renderCart() {
  orderIdEl.textContent = orderId || "----";

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `<div style="opacity:.7;padding:10px 0;">Cart is empty</div>`;
  } else {
    cartItemsEl.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div>
          <div class="cart-item-name">${item.name}</div>
          <div style="opacity:.7;font-size:12px;">₹${item.salePrice} each</div>
        </div>

        <div class="qty-controls">
          <button class="qty-btn" onclick="window.__changeQty('${item.id}',-1)">-</button>
          <div class="qty">${item.qty}</div>
          <button class="qty-btn" onclick="window.__changeQty('${item.id}',1)">+</button>
        </div>

        <div class="cart-item-price">₹${item.qty * item.salePrice}</div>
      </div>
    `).join("");
  }

  subTotalEl.textContent = cartSubTotal();
  deliveryChargeEl.textContent = getDeliveryCharge();
  grandTotalEl.textContent = cartGrandTotal();
}

// =======================
// PRODUCT CARD
// =======================
function productCard(p) {
  const mrp = toNumber(p.MRP);
  const sale = toNumber(p.sale);
  const stock = toNumber(p.stock);
  const disc = getDiscountPercent(mrp, sale);

  const outOfStock = stock <= 0;

  return `
    <div class="product-card">
      <img class="product-img" src="${p.image}" alt="${p.name}" onerror="this.src='assets/logo.png'"/>

      <div>
        <div class="product-name">${p.name}</div>
        <div class="product-cat">${p.category}</div>
      </div>

      <div class="price-row">
        <div class="sale-price">₹${sale}</div>
        ${mrp > 0 && mrp !== sale ? `<div class="mrp">₹${mrp}</div>` : ""}
        ${disc > 0 ? `<div class="badge-off">${disc}% OFF</div>` : ""}
      </div>

      <div class="stock">${outOfStock ? "❌ Out of Stock" : `Stock: ${stock}`}</div>

      <button class="btn-add" ${outOfStock ? "disabled" : ""} onclick="window.__addToCart('${p.id}')">
        ${outOfStock ? "Out of Stock" : "Add to Cart"}
      </button>
    </div>
  `;
}

// =======================
// FILTER + SORT (TRENDING/OFFER TOP)
// =======================
function filteredProducts() {
  let list = allProducts.filter(p => {
    const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
    const q = searchQuery;
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  // Sorting:
  // 1) Offer first
  // 2) In-stock first
  // 3) By stock high -> low
  list.sort((a, b) => {
    const aMrp = toNumber(a.MRP);
    const bMrp = toNumber(b.MRP);
    const aSale = toNumber(a.sale);
    const bSale = toNumber(b.sale);

    const aDisc = getDiscountPercent(aMrp, aSale);
    const bDisc = getDiscountPercent(bMrp, bSale);

    const aStock = toNumber(a.stock);
    const bStock = toNumber(b.stock);

    // Offer
    if (bDisc !== aDisc) return bDisc - aDisc;

    // In stock
    const aIn = aStock > 0 ? 1 : 0;
    const bIn = bStock > 0 ? 1 : 0;
    if (bIn !== aIn) return bIn - aIn;

    // Stock high
    return bStock - aStock;
  });

  return list;
}

function renderCategories() {
  const cats = ["All", ...new Set(allProducts.map(p => p.category).filter(Boolean))];
  categoryChips.innerHTML = cats.map(cat => `
    <button class="chip ${cat === selectedCategory ? "active" : ""}" onclick="window.__selectCategory('${cat}')">
      ${cat}
    </button>
  `).join("");
}

function renderProducts() {
  const list = filteredProducts();

  // Offers top
  const offers = list.filter(p => getDiscountPercent(toNumber(p.MRP), toNumber(p.sale)) > 0);

  offersGrid.innerHTML = offers.map(productCard).join("") || `<div style="opacity:.7">No offers available</div>`;
  productsGrid.innerHTML = list.map(productCard).join("") || `<div style="opacity:.7">No products found</div>`;
}

// =======================
// CSV LOAD
// =======================
async function loadProducts() {
  try {
    const res = await fetch(SHEET_CSV_URL);
    const csv = await res.text();

    const lines = csv.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim());

    const idx = (name) => headers.indexOf(name);

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");

      const obj = {
        id: (cols[idx("ID")] || "").trim(),
        name: (cols[idx("Name")] || "").trim(),
        category: (cols[idx("Category")] || "").trim(),
        MRP: (cols[idx("MRP")] || "").trim(),
        sale: (cols[idx("Sale Price")] || "").trim(),
        stock: (cols[idx("Stock")] || "").trim(),
        image: (cols[idx("Image")] || "").trim() || "assets/logo.png",
      };

      if (obj.id && obj.name) data.push(obj);
    }

    allProducts = data;

    renderCategories();
    renderProducts();
    updateCartUI();
    renderCart();
  } catch (e) {
    offersGrid.innerHTML = `<div style="color:red;font-weight:900;">CSV Link Wrong / Sheet Not Public</div>`;
    productsGrid.innerHTML = `<div style="color:red;font-weight:900;">CSV Link Wrong / Sheet Not Public</div>`;
    console.log(e);
  }
}

// =======================
// WHATSAPP MESSAGE
// =======================
function buildWhatsAppMessage() {
  let msg = `🛒 *Sultan Mart Bharatganj*\n`;
  msg += `📌 *New Order*\n\n`;

  msg += `🧾 Order ID: *#${orderId || generateOrderId()}*\n\n`;

  msg += `👤 Name: ${customer.name || "-"}\n`;
  msg += `📞 Mobile: ${customer.mobile || "-"}\n`;
  msg += `🏠 Address: ${customer.address || "-"}\n`;
  msg += `📍 Area: ${customer.area || "-"}\n`;
  msg += `📅 Day: ${customer.day || "Today"}\n`;
  msg += `⏰ Time: ${customer.time || "-"}\n`;
  msg += `💳 Payment: ${customer.payment || "-"}\n`;
  msg += `📝 Note: ${customer.note || "-"}\n\n`;

  msg += `🛍️ *Items:*\n`;
  cart.forEach((item, idx) => {
    msg += `${idx + 1}. ${item.name} x${item.qty} = ₹${item.qty * item.salePrice}\n`;
  });

  msg += `\n------------------------\n`;
  msg += `Subtotal: ₹${cartSubTotal()}\n`;
  msg += `Delivery: ₹${getDeliveryCharge()}\n`;
  msg += `*Grand Total: ₹${cartGrandTotal()}*\n`;
  msg += `------------------------\n\n`;

  if ((customer.payment || "") === "UPI") {
    msg += `💳 UPI ID: ${UPI_ID}\n`;
    msg += `📸 Screenshot भेजें.\n\n`;
  }

  msg += `✅ Please confirm my order.\n`;
  return msg;
}

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

  if (!customer.name || !customer.mobile || !customer.address || !customer.area || !customer.time || !customer.payment) {
    return alert("Please fill customer details, area, time & payment method!");
  }

  const msg = buildWhatsAppMessage();
  const url = `https://wa.me/91${SHOP_WHATSAPP}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
});

confirmBtn.addEventListener("click", () => {
  if (cart.length === 0) return alert("Cart is empty!");
  alert("✅ Your order is confirmed! Thank you 😊");
  clearCart();
  closeCart();
});

clearCartBtn.addEventListener("click", clearCart);

// Copy UPI
upiText.textContent = UPI_ID;
copyUpiBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(UPI_ID);
    copyUpiBtn.textContent = "Copied!";
    setTimeout(() => copyUpiBtn.textContent = "Copy", 1200);
  } catch {
    alert("Copy not supported on this device");
  }
});

// Customer form save
function bindCustomerForm() {
  function update() {
    customer.name = custName.value.trim();
    customer.mobile = custMobile.value.trim();
    customer.address = custAddress.value.trim();
    customer.area = custArea.value;
    customer.day = custDay.value;
    customer.time = custTime.value;
    customer.payment = paymentMethod.value;
    customer.note = custNote.value.trim();

    saveCustomer();
    renderCart();
  }

  [custName, custMobile, custAddress, custArea, custDay, custTime, paymentMethod, custNote].forEach(el => {
    el.addEventListener("input", update);
    el.addEventListener("change", update);
  });

  // Load saved
  custName.value = customer.name || "";
  custMobile.value = customer.mobile || "";
  custAddress.value = customer.address || "";
  custArea.value = customer.area || "";
  custDay.value = customer.day || "Today";
  custTime.value = customer.time || "";
  paymentMethod.value = customer.payment || "";
  custNote.value = customer.note || "";
}

// =======================
// GLOBAL
// =======================
window.__addToCart = function(id){
  const p = allProducts.find(x => String(x.id) === String(id));
  if (!p) return;

  addToCart({
    id: String(p.id),
    name: p.name,
    salePrice: toNumber(p.sale)
  });

  renderCart();
};

window.__changeQty = changeQty;

window.__selectCategory = function(cat){
  selectedCategory = cat;
  renderCategories();
  renderProducts();
};

// =======================
// INIT
// =======================
bindCustomerForm();
loadProducts();
updateCartUI();
renderCart();
