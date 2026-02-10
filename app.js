/* =========================
   Sultan Mart Bharatganj
   FULL APP.JS (COPY PASTE)
========================= */

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0DkCrsf4_AD96Kv9yaYNbMUUHpQtz59zkXH9f1T9mPI2pXB-OcXTR0pdO-9sgyarYD4pEp8nolt5R/pub?output=csv";

const WHATSAPP_NUMBER = "9559868648";
const CALL_NUMBER = "9559868648";
const UPI_ID = "9559868648@ptyes";

let products = [];
let cart = JSON.parse(localStorage.getItem("cart_sultanmart") || "[]");

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  updateCartUI();

  document.getElementById("searchInput").addEventListener("input", () => {
    renderAll();
  });

  document.getElementById("paymentMethod").addEventListener("change", () => {
    updateUPILink();
  });

  document.getElementById("deliveryArea").addEventListener("change", () => {
    updateCartUI();
  });
});

/* ===== CSV Fetch ===== */
async function loadProducts() {
  try {
    const res = await fetch(CSV_URL + "&t=" + Date.now());
    const text = await res.text();

    products = parseCSV(text);

    if (!products.length) {
      alert("CSV Link Wrong / Sheet Not Public ❌");
      return;
    }

    buildCategories();
    renderAll();

  } catch (err) {
    alert("CSV Link Wrong / Sheet Not Public ❌");
    console.log(err);
  }
}

/* ===== CSV Parser (Simple) ===== */
function parseCSV(csvText) {
  const lines = csvText.trim().split("\n").map(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

  // Required headers
  // ID, Name, Category, MRP, Discount, Sale Price, Stock, Image
  const req = ["name", "category", "mrp", "discount", "sale price", "stock", "image"];
  for (let r of req) {
    if (!headers.includes(r)) {
      console.log("Missing header:", r);
      return [];
    }
  }

  let out = [];

  for (let i = 1; i < lines.length; i++) {
    const row = splitCSVRow(lines[i]);
    if (row.length < headers.length) continue;

    let obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (row[idx] || "").trim();
    });

    // Normalize
    const name = obj["name"];
    const category = obj["category"] || "Other";
    const mrp = Number(obj["mrp"] || 0);
    const discount = Number(obj["discount"] || 0);
    const sale = Number(obj["sale price"] || mrp);
    const stock = Number(obj["stock"] || 0);
    const image = obj["image"] || "";

    if (!name) continue;

    out.push({
      id: obj["id"] || String(i),
      name,
      category,
      mrp,
      discount,
      sale,
      stock,
      image
    });
  }

  return out;
}

/* CSV row safe split (handles commas in quotes) */
function splitCSVRow(row) {
  let result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"' ) {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/* ===== Categories ===== */
function buildCategories() {
  const row = document.getElementById("categoryRow");
  row.innerHTML = "";

  let cats = ["All", ...new Set(products.map(p => p.category))];

  cats.forEach((c, idx) => {
    const btn = document.createElement("button");
    btn.className = "cat-btn" + (idx === 0 ? " active" : "");
    btn.innerText = c;
    btn.onclick = () => {
      document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderAll();
    };
    row.appendChild(btn);
  });
}

/* ===== Render ===== */
function renderAll() {
  const activeCat = document.querySelector(".cat-btn.active")?.innerText || "All";
  const q = document.getElementById("searchInput").value.trim().toLowerCase();

  let filtered = products.filter(p => {
    const catOK = activeCat === "All" ? true : p.category === activeCat;
    const searchOK = p.name.toLowerCase().includes(q);
    return catOK && searchOK;
  });

  // Offers: discount > 0
  const offers = filtered.filter(p => p.discount > 0).slice(0, 12);

  renderGrid("offerGrid", offers);
  renderGrid("productGrid", filtered);
}

/* Render Grid */
function renderGrid(id, list) {
  const grid = document.getElementById(id);
  grid.innerHTML = "";

  if (!list.length) {
    grid.innerHTML = `<p style="padding:10px;color:#6b7280;font-weight:800;">No products found</p>`;
    return;
  }

  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";

    const img = p.image ? p.image : "assets/no-image.png";

    card.innerHTML = `
      <div class="img-wrap">
        <img src="${img}" onerror="this.src='assets/no-image.png'" alt="${p.name}">
      </div>

      <div class="card-body">
        <div class="p-name">${p.name}</div>
        <div class="p-cat">${p.category}</div>

        <div class="price-row">
          <div>
            <div class="price">₹${p.sale}</div>
            ${p.mrp > p.sale ? `<div class="mrp">₹${p.mrp}</div>` : ""}
          </div>

          ${p.discount > 0 ? `<div class="off-badge">${p.discount}% OFF</div>` : ""}
        </div>

        <div class="stock ${p.stock <= 0 ? "out" : ""}">
          ${p.stock <= 0 ? "Out of Stock" : "Stock: " + p.stock}
        </div>

        <button class="add-btn" ${p.stock <= 0 ? "disabled" : ""} onclick="addToCart('${p.id}')">
          ➕ Add to Cart
        </button>
      </div>
    `;

    grid.appendChild(card);
  });
}

/* ===== Cart ===== */
function addToCart(id) {
  const p = products.find(x => x.id == id);
  if (!p) return;

  const found = cart.find(x => x.id == id);

  if (found) found.qty += 1;
  else cart.push({ id: p.id, qty: 1 });

  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem("cart_sultanmart", JSON.stringify(cart));
}

function openCart() {
  document.getElementById("cartModal").classList.add("open");
  renderCart();
  updateCartUI();
}

function closeCart() {
  document.getElementById("cartModal").classList.remove("open");
}

function clearCart() {
  cart = [];
  saveCart();
  renderCart();
  updateCartUI();
}

/* Render Cart Items */
function renderCart() {
  const box = document.getElementById("cartItems");
  box.innerHTML = "";

  if (!cart.length) {
    box.innerHTML = `<p style="padding:10px;color:#6b7280;font-weight:900;">Cart is empty</p>`;
    updateBill();
    return;
  }

  cart.forEach(ci => {
    const p = products.find(x => x.id == ci.id);
    if (!p) return;

    const img = p.image ? p.image : "assets/no-image.png";

    const item = document.createElement("div");
    item.className = "cart-item";

    item.innerHTML = `
      <img src="${img}" onerror="this.src='assets/no-image.png'" />

      <div class="cart-info">
        <h4>${p.name}</h4>
        <p>₹${p.sale} each</p>

        <div class="cart-controls">
          <div class="qty">
            <button onclick="qtyMinus('${p.id}')">-</button>
            <span>${ci.qty}</span>
            <button onclick="qtyPlus('${p.id}')">+</button>
          </div>

          <button class="remove-btn" onclick="removeItem('${p.id}')">Remove</button>
        </div>
      </div>
    `;

    box.appendChild(item);
  });

  updateBill();
}

/* Qty */
function qtyPlus(id) {
  const it = cart.find(x => x.id == id);
  if (!it) return;
  it.qty += 1;
  saveCart();
  renderCart();
  updateCartUI();
}

function qtyMinus(id) {
  const it = cart.find(x => x.id == id);
  if (!it) return;
  it.qty -= 1;
  if (it.qty <= 0) cart = cart.filter(x => x.id != id);
  saveCart();
  renderCart();
  updateCartUI();
}

function removeItem(id) {
  cart = cart.filter(x => x.id != id);
  saveCart();
  renderCart();
  updateCartUI();
}

/* Bill */
function updateBill() {
  let total = 0;
  let mrpTotal = 0;

  cart.forEach(ci => {
    const p = products.find(x => x.id == ci.id);
    if (!p) return;

    total += p.sale * ci.qty;
    mrpTotal += p.mrp * ci.qty;
  });

  const saved = mrpTotal - total;

  // Delivery
  const area = document.getElementById("deliveryArea").value;
  let delivery = 0;

  if (area === "paid") {
    if (total < 499) delivery = 30;
    else delivery = 0;
  } else {
    delivery = 0;
  }

  document.getElementById("billTotal").innerText = "₹" + total;
  document.getElementById("deliveryCharge").innerText = "₹" + delivery;
  document.getElementById("discountSaved").innerText = "₹" + (saved > 0 ? saved : 0);
  document.getElementById("grandTotal").innerText = "₹" + (total + delivery);

  updateUPILink();
}

/* Top cart count */
function updateCartUI() {
  const count = cart.reduce((a, b) => a + b.qty, 0);
  document.getElementById("cartCount").innerText = count;
  document.getElementById("fabCount").innerText = count;
}

/* ===== UPI ===== */
function updateUPILink() {
  const method = document.getElementById("paymentMethod").value;
  const upiBox = document.getElementById("upiBox");
  const upiLink = document.getElementById("upiLink");

  if (method !== "upi") {
    upiBox.style.display = "none";
    return;
  }

  upiBox.style.display = "block";

  // Total
  const totalText = document.getElementById("grandTotal").innerText.replace("₹", "");
  const amount = Number(totalText || 0);

  const name = "Sultan Mart Bharatganj";
  const note = "Grocery Order Payment";

  const link = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

  upiLink.href = link;
}

/* ===== Call ===== */
function callNow() {
  window.location.href = `tel:${CALL_NUMBER}`;
}

/* ===== WhatsApp Order ===== */
function sendWhatsApp() {
  if (!cart.length) {
    alert("Cart is empty ❌");
    return;
  }

  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const address = document.getElementById("custAddress").value.trim();
  const area = document.getElementById("deliveryArea").value;
  const time = document.getElementById("deliveryTime").value;
  const payment = document.getElementById("paymentMethod").value;

  if (!name || !phone || !address) {
    alert("Name, Phone, Address required ❌");
    return;
  }

  let msg = `🛒 *New Order - Sultan Mart Bharatganj*%0A%0A`;
  msg += `👤 Name: ${name}%0A`;
  msg += `📞 Phone: ${phone}%0A`;
  msg += `🏠 Address: ${address}%0A`;
  msg += `📍 Area: ${area === "free" ? "Bharatganj (Free Delivery)" : "Outside (Paid Delivery)"}%0A`;
  msg += `⏰ Delivery Time: ${time}%0A`;
  msg += `💳 Payment: ${payment || "Not Selected"}%0A%0A`;

  msg += `🧾 *Items:*%0A`;

  cart.forEach(ci => {
    const p = products.find(x => x.id == ci.id);
    if (!p) return;
    msg += `• ${p.name} × ${ci.qty} = ₹${p.sale * ci.qty}%0A`;
  });

  const grand = document.getElementById("grandTotal").innerText.replace("₹", "");
  const del = document.getElementById("deliveryCharge").innerText.replace("₹", "");

  msg += `%0A🚚 Delivery Charge: ₹${del}%0A`;
  msg += `💰 *Grand Total: ₹${grand}*%0A%0A`;
  msg += `✅ Please Confirm Order`;

  const wa = `https://wa.me/91${WHATSAPP_NUMBER}?text=${msg}`;
  window.open(wa, "_blank");

  // Order confirmed by customer sending message
  // Clear cart automatically
  clearCart();
}
