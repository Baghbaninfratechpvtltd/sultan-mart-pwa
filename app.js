// =====================================
// Sultan Mart - Full Copy Paste App.js
// =====================================

// CSV LINK (ALREADY SET)
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0DkCrsf4_AD96Kv9yaYNbMUUHpQtz59zkXH9f1T9mPI2pXB-OcXTR0pdO-9sgyarYD4pEp8nolt5R/pub?output=csv";

const SHOP_NAME = "Sultan Mart Bharatganj";
const WHATSAPP_NUMBER = "9559868648";
const UPI_ID = "9559868648@ptyes";

// DOM
const productsGrid = document.getElementById("productsGrid");
const offersGrid = document.getElementById("offersGrid");
const categoryRow = document.getElementById("categoryRow");
const searchInput = document.getElementById("searchInput");

const cartBtn = document.getElementById("cartBtn");
const cartCount = document.getElementById("cartCount");
const cartModal = document.getElementById("cartModal");
const closeModal = document.getElementById("closeModal");
const closeModalBtn = document.getElementById("closeModalBtn");

const cartItems = document.getElementById("cartItems");

const custName = document.getElementById("custName");
const custMobile = document.getElementById("custMobile");
const custAddress = document.getElementById("custAddress");

const deliveryArea = document.getElementById("deliveryArea");
const deliveryDay = document.getElementById("deliveryDay");
const deliverySlot = document.getElementById("deliverySlot");

const paymentMethod = document.getElementById("paymentMethod");
const upiBox = document.getElementById("upiBox");
const upiIdText = document.getElementById("upiIdText");
const copyUpiBtn = document.getElementById("copyUpiBtn");

const itemsTotalEl = document.getElementById("itemsTotal");
const deliveryChargeEl = document.getElementById("deliveryCharge");
const grandTotalEl = document.getElementById("grandTotal");

const whatsappBtn = document.getElementById("whatsappBtn");
const confirmBtn = document.getElementById("confirmBtn");
const clearCartBtn = document.getElementById("clearCartBtn");

// STATE
let ALL_PRODUCTS = [];
let FILTERED_PRODUCTS = [];
let ACTIVE_CATEGORY = "All";
let CART = loadCart();

// HELPERS
function money(n) { return "₹" + Number(n || 0).toFixed(0); }
function safeNum(v) { const x = Number(String(v || "").trim()); return isNaN(x) ? 0 : x; }

function percentOff(mrp, sale) {
  mrp = safeNum(mrp);
  sale = safeNum(sale);
  if (mrp <= 0) return 0;
  const off = Math.round(((mrp - sale) / mrp) * 100);
  return off > 0 ? off : 0;
}

// CSV PARSER
function parseCSV(text) {
  const rows = [];
  let cur = "";
  let inQuotes = false;
  let row = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      cur += '"'; i++; continue;
    }
    if (ch === '"') { inQuotes = !inQuotes; continue; }

    if (ch === "," && !inQuotes) { row.push(cur); cur = ""; continue; }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (cur.length || row.length) { row.push(cur); rows.push(row); row = []; cur = ""; }
      continue;
    }
    cur += ch;
  }

  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

function csvToObjects(csvText) {
  const table = parseCSV(csvText);
  if (!table.length) return [];

  const headers = table[0].map(h => String(h).trim());
  const out = [];

  for (let i = 1; i < table.length; i++) {
    const r = table[i];
    if (!r || !r.length) continue;

    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (r[idx] ?? "").trim(); });
    if (Object.values(obj).join("").trim() === "") continue;
    out.push(obj);
  }
  return out;
}

function normalizeRow(row) {
  const id = String(row["ID"] || "").trim() || crypto.randomUUID();
  const name = String(row["Name"] || "").trim();
  const category = String(row["Category"] || "Other").trim();
  const mrp = safeNum(row["MRP"]);
  const discount = safeNum(row["Discount"]);
  const salePrice = safeNum(row["Sale Price"]);
  const stock = safeNum(row["Stock"]);
  const image = String(row["Image"] || "").trim();

  const finalSale = salePrice > 0 ? salePrice : Math.max(0, mrp - discount);

  return {
    id,
    name,
    category,
    mrp,
    discount,
    salePrice: finalSale,
    stock,
    image,
    offPercent: percentOff(mrp, finalSale)
  };
}

// CART STORAGE
function saveCart() { localStorage.setItem("sultan_cart", JSON.stringify(CART)); }
function loadCart() { try { return JSON.parse(localStorage.getItem("sultan_cart") || "[]"); } catch { return []; } }
function cartCountTotal() { return CART.reduce((sum, i) => sum + i.qty, 0); }
function cartItemsTotal() { return CART.reduce((sum, i) => sum + (i.salePrice * i.qty), 0); }
function deliveryCharge() { return deliveryArea.value === "other" ? 20 : 0; }
function grandTotal() { return cartItemsTotal() + deliveryCharge(); }

// RENDER
function renderCategories() {
  const cats = ["All", ...new Set(ALL_PRODUCTS.map(p => p.category))];

  categoryRow.innerHTML = cats.map(cat => {
    const active = cat === ACTIVE_CATEGORY ? "active" : "";
    return `<button class="cat-pill ${active}" data-cat="${cat}">${cat}</button>`;
  }).join("");

  categoryRow.querySelectorAll(".cat-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      ACTIVE_CATEGORY = btn.dataset.cat;
      renderCategories();
      applyFilters();
    });
  });
}

function productCard(p) {
  const out = p.stock <= 0 ? "out" : "";
  const img = p.image || "assets/no-image.png";

  return `
    <div class="product-card ${out}">
      <img class="product-img" src="${img}" alt="${p.name}" onerror="this.src='assets/no-image.png'">

      <div class="p-name">${p.name}</div>
      <div class="p-cat">${p.category}</div>

      <div class="price-row">
        <div class="sale-price">${money(p.salePrice)}</div>
        ${p.mrp > 0 ? `<div class="mrp">${money(p.mrp)}</div>` : ""}
        ${p.offPercent > 0 ? `<div class="off-badge">${p.offPercent}% OFF</div>` : ""}
      </div>

      <div class="stock">Stock: ${p.stock}</div>

      <button class="add-btn" ${p.stock <= 0 ? "disabled" : ""} data-id="${p.id}">
        Add to Cart
      </button>
    </div>
  `;
}

function renderProducts() {
  productsGrid.innerHTML = FILTERED_PRODUCTS.map(productCard).join("");
  productsGrid.querySelectorAll(".add-btn").forEach(btn => btn.addEventListener("click", () => addToCart(btn.dataset.id)));
}

function renderOffers() {
  const offers = ALL_PRODUCTS
    .filter(p => p.offPercent > 0 && p.stock > 0)
    .sort((a, b) => b.offPercent - a.offPercent)
    .slice(0, 12);

  offersGrid.innerHTML = offers.map(productCard).join("");
  offersGrid.querySelectorAll(".add-btn").forEach(btn => btn.addEventListener("click", () => addToCart(btn.dataset.id)));
}

function applyFilters() {
  const q = searchInput.value.trim().toLowerCase();

  FILTERED_PRODUCTS = ALL_PRODUCTS.filter(p => {
    const matchCat = ACTIVE_CATEGORY === "All" ? true : p.category === ACTIVE_CATEGORY;
    const matchSearch = p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  renderProducts();
}

// CART LOGIC
function addToCart(id) {
  const p = ALL_PRODUCTS.find(x => x.id === id);
  if (!p || p.stock <= 0) return;

  const existing = CART.find(x => x.id === id);
  if (existing) existing.qty += 1;
  else CART.push({ ...p, qty: 1 });

  saveCart();
  updateCartUI();
}

function changeQty(id, delta) {
  const item = CART.find(x => x.id === id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) CART = CART.filter(x => x.id !== id);

  saveCart();
  updateCartUI();
}

function clearCart() {
  CART = [];
  saveCart();
  updateCartUI();
}

function updateCartUI() {
  cartCount.textContent = cartCountTotal();

  if (CART.length === 0) {
    cartItems.innerHTML = `<div style="color:#666;font-weight:900;">Cart is empty 😅</div>`;
  } else {
    cartItems.innerHTML = CART.map(i => `
      <div class="cart-item">
        <img src="${i.image || "assets/no-image.png"}" onerror="this.src='assets/no-image.png'">
        <div>
          <div class="ci-name">${i.name}</div>
          <div class="ci-price">${money(i.salePrice)} × ${i.qty} = ${money(i.salePrice * i.qty)}</div>
        </div>

        <div class="qty-box">
          <button class="qty-btn" data-act="minus" data-id="${i.id}">−</button>
          <div class="qty">${i.qty}</div>
          <button class="qty-btn" data-act="plus" data-id="${i.id}">+</button>
        </div>
      </div>
    `).join("");

    cartItems.querySelectorAll(".qty-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const act = btn.dataset.act;
        changeQty(id, act === "plus" ? 1 : -1);
      });
    });
  }

  itemsTotalEl.textContent = money(cartItemsTotal());
  deliveryChargeEl.textContent = money(deliveryCharge());
  grandTotalEl.textContent = money(grandTotal());

  upiIdText.textContent = UPI_ID;
  upiBox.style.display = paymentMethod.value === "UPI Payment" ? "block" : "none";
}

// WHATSAPP MESSAGE
function buildOrderMessage() {
  const name = custName.value.trim();
  const mobile = custMobile.value.trim();
  const address = custAddress.value.trim();

  if (!name || !mobile || !address) { alert("Please fill Name, Mobile, Address."); return null; }
  if (CART.length === 0) { alert("Cart is empty."); return null; }

  const area = deliveryArea.value === "bharatganj" ? "Bharatganj (Free)" : "Other Area (₹20)";
  const day = deliveryDay.value;
  const slot = deliverySlot.value;
  const pay = paymentMethod.value;

  let msg = `🛒 *${SHOP_NAME}*%0A✅ *New Order*%0A%0A`;
  msg += `👤 Name: ${encodeURIComponent(name)}%0A`;
  msg += `📱 Mobile: ${encodeURIComponent(mobile)}%0A`;
  msg += `🏠 Address: ${encodeURIComponent(address)}%0A%0A`;

  msg += `📦 Delivery Area: ${encodeURIComponent(area)}%0A`;
  msg += `📅 Day: ${encodeURIComponent(day)}%0A`;
  msg += `⏰ Time Slot: ${encodeURIComponent(slot)}%0A`;
  msg += `💳 Payment: ${encodeURIComponent(pay)}%0A%0A`;

  msg += `🧾 *Items:*%0A`;
  CART.forEach((i, idx) => {
    msg += `${idx + 1}) ${encodeURIComponent(i.name)} - ${i.qty} × ${i.salePrice} = ${i.salePrice * i.qty}%0A`;
  });

  msg += `%0AItems Total: ${cartItemsTotal()}%0A`;
  msg += `Delivery: ${deliveryCharge()}%0A`;
  msg += `Grand Total: ${grandTotal()}%0A%0A`;
  msg += `🙏 Please confirm my order.`;

  return msg;
}

// EVENTS
cartBtn.addEventListener("click", () => { cartModal.classList.remove("hidden"); updateCartUI(); });
closeModal.addEventListener("click", () => cartModal.classList.add("hidden"));
closeModalBtn.addEventListener("click", () => cartModal.classList.add("hidden"));

searchInput.addEventListener("input", applyFilters);
deliveryArea.addEventListener("change", updateCartUI);
paymentMethod.addEventListener("change", updateCartUI);

copyUpiBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(UPI_ID);
    copyUpiBtn.textContent = "Copied!";
    setTimeout(() => (copyUpiBtn.textContent = "Copy"), 1200);
  } catch {
    alert("Copy failed. UPI: " + UPI_ID);
  }
});

whatsappBtn.addEventListener("click", () => {
  const msg = buildOrderMessage();
  if (!msg) return;
  window.open(`https://wa.me/91${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
});

confirmBtn.addEventListener("click", () => {
  if (CART.length === 0) return alert("Cart empty.");
  clearCart();
  alert("🎉 Your order confirmed! Thank you 😊");
  cartModal.classList.add("hidden");
});

clearCartBtn.addEventListener("click", () => {
  if (!confirm("Clear cart?")) return;
  clearCart();
});

// LOAD PRODUCTS
async function loadProducts() {
  try {
    const res = await fetch(SHEET_CSV_URL, { cache: "no-store" });
    const text = await res.text();
    const objs = csvToObjects(text);

    ALL_PRODUCTS = objs.map(normalizeRow).filter(p => p.name);
    renderCategories();
    renderOffers();
    applyFilters();
    updateCartUI();
  } catch (err) {
    console.error(err);
    productsGrid.innerHTML = `<div style="color:red;font-weight:900;">CSV Link Wrong / Sheet Not Public</div>`;
  }
}

loadProducts();
