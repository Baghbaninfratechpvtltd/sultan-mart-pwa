// ==============================
// Sultan Mart PWA - app.js
// ==============================

// ✅ YOUR GOOGLE SHEET CSV (PUBLIC)
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0DkCrsf4_AD96Kv9yaYNbMUUHpQtz59zkXH9f1T9mPI2pXB-OcXTR0pdO-9sgyarYD4pEp8nolt5R/pub?output=csv";

// ✅ Store WhatsApp + Phone + UPI
const STORE_WHATSAPP = "9559868648";
const STORE_CALL = "9559868648";
const STORE_UPI = "9559868648@ptyes";

// Delivery Charges
const DELIVERY_CHARGE_OTHER = 20;
const FREE_AREA = "Bharatganj";
const MIN_ORDER = 199;

// DOM
const productsGrid = document.getElementById("productsGrid");
const offersGrid = document.getElementById("offersGrid");
const searchInput = document.getElementById("searchInput");
const categoryChips = document.getElementById("categoryChips");

const cartBtn = document.getElementById("cartBtn");
const cartModal = document.getElementById("cartModal");
const closeCart = document.getElementById("closeCart");
const cartItemsDiv = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");

const itemsTotalEl = document.getElementById("itemsTotal");
const deliveryChargeEl = document.getElementById("deliveryCharge");
const grandTotalEl = document.getElementById("grandTotal");

const deliveryArea = document.getElementById("deliveryArea");
const deliveryDay = document.getElementById("deliveryDay");
const deliverySlot = document.getElementById("deliverySlot");
const paymentMethod = document.getElementById("paymentMethod");

const custName = document.getElementById("custName");
const custPhone = document.getElementById("custPhone");
const custAddress = document.getElementById("custAddress");

const whatsappOrderBtn = document.getElementById("whatsappOrder");
const copyUpiBtn = document.getElementById("copyUpi");
document.getElementById("upiIdText").innerText = STORE_UPI;

document.getElementById("year").innerText = new Date().getFullYear();

// Data
let allProducts = [];
let filteredProducts = [];
let activeCategory = "All";

// Cart
let cart = JSON.parse(localStorage.getItem("sultan_cart") || "{}");

// ==============================
// Helpers
// ==============================
function money(n) {
  const x = Number(n || 0);
  return "₹" + Math.round(x);
}

function normalize(s) {
  return (s || "").toString().trim();
}

function toNumber(x) {
  const n = Number((x || "").toString().replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function parseCSV(csvText) {
  // Simple CSV parser (works for normal sheets)
  const rows = csvText.split("\n").map(r => r.trim()).filter(Boolean);
  const data = [];
  const headers = rows[0].split(",").map(h => normalize(h));

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].split(",").map(c => normalize(c));
    const obj = {};
    headers.forEach((h, idx) => obj[h] = cols[idx] || "");
    data.push(obj);
  }
  return data;
}

// ==============================
// Load Products
// ==============================
async function loadProducts() {
  try {
    const res = await fetch(SHEET_CSV_URL, { cache: "no-store" });

    if (!res.ok) throw new Error("CSV Link Wrong / Sheet Not Public");

    const text = await res.text();
    const raw = parseCSV(text);

    // Expected headers:
    // ID, Name, Category, MRP, Discount, Sale Price, Stock, Image
    allProducts = raw.map(r => {
      const mrp = toNumber(r.MRP);
      const sale = toNumber(r["Sale Price"]);
      const discount = toNumber(r.Discount);
      const stock = toNumber(r.Stock);

      // if sale missing, auto calculate
      const salePrice = sale > 0 ? sale : Math.max(0, mrp - (mrp * discount / 100));

      // if discount missing, auto calculate
      const off = discount > 0 ? discount : (mrp > 0 ? Math.round(((mrp - salePrice) / mrp) * 100) : 0);

      return {
        id: normalize(r.ID) || crypto.randomUUID(),
        name: normalize(r.Name),
        category: normalize(r.Category) || "Other",
        mrp: mrp,
        sale: salePrice,
        discount: off,
        stock: stock || 0,
        image: normalize(r.Image) || "",
      };
    }).filter(p => p.name);

    filteredProducts = [...allProducts];
    renderCategories();
    renderAll();
    updateCartUI();
  } catch (err) {
    productsGrid.innerHTML = `
      <div style="padding:16px;background:#fff;border-radius:18px;box-shadow:var(--shadow)">
        <b>❌ ${err.message}</b>
        <p style="color:#666;margin:8px 0 0">
          Fix: Google Sheet → Share → Anyone with link (Viewer)  
          + File → Publish to web → CSV
        </p>
      </div>
    `;
  }
}

// ==============================
// Render Categories
// ==============================
function renderCategories() {
  const cats = ["All", ...new Set(allProducts.map(p => p.category))];

  categoryChips.innerHTML = "";
  cats.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "chip" + (cat === activeCategory ? " active" : "");
    btn.innerText = cat;
    btn.onclick = () => {
      activeCategory = cat;
      document.querySelectorAll(".chip").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
      applyFilters();
    };
    categoryChips.appendChild(btn);
  });
}

// ==============================
// Filters
// ==============================
function applyFilters() {
  const q = normalize(searchInput.value).toLowerCase();

  filteredProducts = allProducts.filter(p => {
    const matchCategory = activeCategory === "All" ? true : p.category === activeCategory;
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);

    return matchCategory && matchSearch;
  });

  renderAll();
}

// ==============================
// Render Cards
// ==============================
function productCard(p) {
  const outOfStock = p.stock <= 0;

  return `
    <div class="card">
      <div class="imgWrap">
        <img src="${p.image || "assets/no-image.png"}" alt="${p.name}" onerror="this.src='assets/no-image.png'"/>
      </div>

      <div class="cardBody">
        <p class="pName">${p.name}</p>
        <p class="pCat">${p.category}</p>

        <div class="priceRow">
          <span class="sale">${money(p.sale)}</span>
          ${p.mrp > 0 ? `<span class="mrp">${money(p.mrp)}</span>` : ""}
          ${p.discount > 0 ? `<span class="offBadge">${p.discount}% OFF</span>` : ""}
        </div>

        <div class="stock">${outOfStock ? "❌ Out of Stock" : "Stock: " + p.stock}</div>

        <button class="addBtn" ${outOfStock ? "disabled style='opacity:.5;cursor:not-allowed'" : ""} onclick="addToCart('${p.id}')">
          ${outOfStock ? "Not Available" : "Add to Cart"}
        </button>
      </div>
    </div>
  `;
}

function renderAll() {
  // Offers = discount वाले products (Top)
  const offers = [...filteredProducts]
    .filter(p => p.discount > 0 && p.stock > 0)
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 8);

  offersGrid.innerHTML = offers.length
    ? offers.map(productCard).join("")
    : `<div style="color:#666">No offers today</div>`;

  // All Products (discount वाले पहले)
  const sorted = [...filteredProducts].sort((a, b) => {
    const aScore = (a.discount || 0) + (a.stock > 0 ? 5 : 0);
    const bScore = (b.discount || 0) + (b.stock > 0 ? 5 : 0);
    return bScore - aScore;
  });

  productsGrid.innerHTML = sorted.map(productCard).join("");
}

// ==============================
// Cart Logic
// ==============================
function saveCart() {
  localStorage.setItem("sultan_cart", JSON.stringify(cart));
}

function addToCart(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p || p.stock <= 0) return;

  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  updateCartUI();
}

function removeFromCart(id) {
  delete cart[id];
  saveCart();
  updateCartUI();
}

function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id] += delta;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  updateCartUI();
}

function cartItemsList() {
  return Object.keys(cart).map(id => {
    const p = allProducts.find(x => x.id === id);
    if (!p) return null;
    return { ...p, qty: cart[id] };
  }).filter(Boolean);
}

function getDeliveryCharge() {
  return deliveryArea.value === FREE_AREA ? 0 : DELIVERY_CHARGE_OTHER;
}

function calcTotals() {
  const items = cartItemsList();
  const itemsTotal = items.reduce((sum, it) => sum + (it.sale * it.qty), 0);
  const del = getDeliveryCharge();
  const grand = itemsTotal + del;
  return { itemsTotal, del, grand };
}

function updateCartUI() {
  const items = cartItemsList();

  // count
  const count = items.reduce((sum, it) => sum + it.qty, 0);
  cartCount.innerText = count;

  // list
  if (items.length === 0) {
    cartItemsDiv.innerHTML = `<p style="color:#666">Cart is empty</p>`;
  } else {
    cartItemsDiv.innerHTML = items.map(it => `
      <div class="cartItem">
        <img src="${it.image || "assets/no-image.png"}" onerror="this.src='assets/no-image.png'" />
        <div class="meta">
          <b>${it.name}</b>
          <div style="color:#666;font-size:12px">${money(it.sale)} × ${it.qty}</div>
          <div class="qtyRow">
            <button class="qtyBtn" onclick="changeQty('${it.id}', -1)">−</button>
            <button class="qtyBtn" onclick="changeQty('${it.id}', 1)">+</button>
            <button class="removeBtn" onclick="removeFromCart('${it.id}')">Remove</button>
          </div>
        </div>
      </div>
    `).join("");
  }

  // totals
  const t = calcTotals();
  itemsTotalEl.innerText = money(t.itemsTotal);
  deliveryChargeEl.innerText = money(t.del);
  grandTotalEl.innerText = money(t.grand);
}

// ==============================
// WhatsApp Order
// ==============================
function buildWhatsAppMessage() {
  const items = cartItemsList();
  const t = calcTotals();

  const name = normalize(custName.value);
  const phone = normalize(custPhone.value);
  const address = normalize(custAddress.value);

  const area = deliveryArea.value;
  const day = deliveryDay.value;
  const slot = deliverySlot.value;
  const pay = paymentMethod.value;

  let msg = `🛒 *Sultan Mart Bharatganj*%0A`;
  msg += `====================%0A`;

  msg += `👤 Name: ${encodeURIComponent(name)}%0A`;
  msg += `📞 Mobile: ${encodeURIComponent(phone)}%0A`;
  msg += `🏠 Address: ${encodeURIComponent(address)}%0A%0A`;

  msg += `🚚 Delivery: ${encodeURIComponent(area)}%0A`;
  msg += `📅 Day: ${encodeURIComponent(day)}%0A`;
  msg += `⏰ Slot: ${encodeURIComponent(slot)}%0A`;
  msg += `💳 Payment: ${encodeURIComponent(pay)}%0A`;
  msg += `====================%0A%0A`;

  msg += `🧾 *Order Items*%0A`;

  items.forEach((it, i) => {
    msg += `${i + 1}. ${encodeURIComponent(it.name)}  (${it.qty} × ${Math.round(it.sale)})%0A`;
  });

  msg += `%0A====================%0A`;
  msg += `Items Total: ${Math.round(t.itemsTotal)}%0A`;
  msg += `Delivery: ${Math.round(t.del)}%0A`;
  msg += `Grand Total: ${Math.round(t.grand)}%0A`;
  msg += `====================%0A`;

  msg += `%0A✅ Please confirm my order.`;

  return msg;
}

function validateOrder() {
  const items = cartItemsList();
  const t = calcTotals();

  if (items.length === 0) return "Cart is empty!";
  if (!custName.value.trim()) return "Please enter your name.";
  if (!custPhone.value.trim()) return "Please enter mobile number.";
  if (!custAddress.value.trim()) return "Please enter full address.";
  if (t.itemsTotal < MIN_ORDER) return `Minimum order is ₹${MIN_ORDER}`;
  return "";
}

// ==============================
// Events
// ==============================
searchInput.addEventListener("input", applyFilters);

cartBtn.onclick = () => cartModal.classList.remove("hidden");
closeCart.onclick = () => cartModal.classList.add("hidden");

deliveryArea.addEventListener("change", updateCartUI);

copyUpiBtn.onclick = async () => {
  try {
    await navigator.clipboard.writeText(STORE_UPI);
    alert("UPI ID Copied!");
  } catch {
    alert("Copy failed. Manually copy: " + STORE_UPI);
  }
};

whatsappOrderBtn.onclick = () => {
  const err = validateOrder();
  if (err) {
    alert(err);
    return;
  }

  const msg = buildWhatsAppMessage();
  const wa = `https://wa.me/91${STORE_WHATSAPP}?text=${msg}`;
  window.open(wa, "_blank");

  // ✅ Confirm = clear cart
  cart = {};
  saveCart();
  updateCartUI();

  alert("✅ Order Sent on WhatsApp!\nYour cart is cleared.");
};

// Make functions global
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeQty = changeQty;

// ==============================
// Start
// ==============================
loadProducts();

// Service Worker (optional)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}
