/* ===============================
   Sultan Mart Bharatganj
   FULL COPY-PASTE APP.JS
   Sheet Headers:
   ID, Name, Category, MRP, Discount, Sale Price, Stock, Image
================================ */

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0DkCrsf4_AD96Kv9yaYNbMUUHpQtz59zkXH9f1T9mPI2pXB-OcXTR0pdO-9sgyarYD4pEp8nolt5R/pub?output=csv";

const SHOP_NAME = "Sultan Mart Bharatganj";
const WHATSAPP = "9559868648";
const CALL_NUMBER = "9559868648";
const UPI_ID = "9559868648@ptyes";

let products = [];
let cart = JSON.parse(localStorage.getItem("sultan_cart") || "[]");

/* DOM */
const offerGrid = document.getElementById("offerGrid");
const productGrid = document.getElementById("productGrid");
const categoryRow = document.getElementById("categoryRow");
const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");

const cartModal = document.getElementById("cartModal");
const openCartBtn = document.getElementById("openCartBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const fabCart = document.getElementById("fabCart");

const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const fabCount = document.getElementById("fabCount");

const billSubtotal = document.getElementById("billSubtotal");
const billDelivery = document.getElementById("billDelivery");
const billTotal = document.getElementById("billTotal");

const custName = document.getElementById("custName");
const custPhone = document.getElementById("custPhone");
const custAddress = document.getElementById("custAddress");
const deliveryArea = document.getElementById("deliveryArea");
const deliveryDay = document.getElementById("deliveryDay");
const deliverySlot = document.getElementById("deliverySlot");
const paymentMethod = document.getElementById("paymentMethod");

const upiPayBox = document.getElementById("upiPayBox");
const upiPayBtn = document.getElementById("upiPayBtn");
const copyUpiBtn = document.getElementById("copyUpiBtn");

const whatsappBtn = document.getElementById("whatsappBtn");
const clearCartBtn = document.getElementById("clearCartBtn");
const shareLocationBtn = document.getElementById("shareLocationBtn");

/* INIT */
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  updateCartUI();

  searchInput.addEventListener("input", renderAll);
  refreshBtn.addEventListener("click", loadProducts);

  openCartBtn.addEventListener("click", openCart);
  fabCart.addEventListener("click", openCart);
  closeCartBtn.addEventListener("click", closeCart);

  clearCartBtn.addEventListener("click", () => {
    cart = [];
    saveCart();
    renderCart();
    updateCartUI();
  });

  whatsappBtn.addEventListener("click", sendWhatsApp);

  paymentMethod.addEventListener("change", () => {
    updateCartUI();
  });

  deliveryArea.addEventListener("change", () => {
    updateCartUI();
  });

  deliverySlot.addEventListener("change", () => {
    updateCartUI();
  });

  deliveryDay.addEventListener("change", () => {
    updateCartUI();
  });

  copyUpiBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(UPI_ID);
    copyUpiBtn.innerText = "Copied ✅";
    setTimeout(() => copyUpiBtn.innerText = "Copy", 1200);
  });

  shareLocationBtn.addEventListener("click", shareLocationOnWhatsApp);
});

/* FETCH CSV */
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

  } catch (e) {
    alert("CSV Link Wrong / Sheet Not Public ❌");
    console.log(e);
  }
}

/* CSV PARSER */
function parseCSV(csvText) {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = splitCSVRow(lines[0]).map(h => h.trim().toLowerCase());

  function get(row, key) {
    const idx = headers.indexOf(key.toLowerCase());
    if (idx === -1) return "";
    return (row[idx] || "").trim();
  }

  const out = [];

  for (let i = 1; i < lines.length; i++) {
    const row = splitCSVRow(lines[i]);
    if (row.length < headers.length) continue;

    const id = get(row, "id") || String(i);
    const name = get(row, "name") || get(row, "Name");
    const category = get(row, "category") || "Other";

    const mrp = Number(get(row, "mrp") || 0);
    const discount = Number(get(row, "discount") || 0);

    // Important: your sheet uses "Sale Price"
    const sale = Number(get(row, "sale price") || 0);

    const stock = Number(get(row, "stock") || 0);
    const image = get(row, "image") || "";

    if (!name) continue;

    out.push({
      id,
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

function splitCSVRow(row) {
  let result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
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

/* CATEGORIES */
function buildCategories() {
  categoryRow.innerHTML = "";

  const cats = ["All", ...new Set(products.map(p => p.category))];

  cats.forEach((c, idx) => {
    const btn = document.createElement("button");
    btn.className = "catBtn" + (idx === 0 ? " active" : "");
    btn.innerText = c;

    btn.onclick = () => {
      document.querySelectorAll(".catBtn").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
      renderAll();
    };

    categoryRow.appendChild(btn);
  });
}

/* RENDER */
function renderAll() {
  const activeCat = document.querySelector(".catBtn.active")?.innerText || "All";
  const q = searchInput.value.trim().toLowerCase();

  let filtered = products.filter(p => {
    const catOk = activeCat === "All" ? true : p.category === activeCat;
    const qOk = p.name.toLowerCase().includes(q);
    return catOk && qOk;
  });

  // Offers top
  const offers = filtered
    .filter(p => Number(p.discount) > 0)
    .sort((a, b) => Number(b.discount) - Number(a.discount))
    .slice(0, 12);

  renderGrid(offerGrid, offers);
  renderGrid(productGrid, filtered);
}

function renderGrid(grid, list) {
  grid.innerHTML = "";

  if (!list.length) {
    grid.innerHTML = `<p style="padding:10px;font-weight:900;color:#64748b;">No products found</p>`;
    return;
  }

  list.forEach(p => {
    const img = p.image || "assets/no-image.png";

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="imgWrap">
        <img src="${img}" alt="${p.name}" onerror="this.src='assets/no-image.png'">
      </div>

      <div class="cardBody">
        <div class="pName">${p.name}</div>
        <div class="pCat">${p.category}</div>

        <div class="priceRow">
          <div>
            <div class="price">₹${p.sale}</div>
            ${p.mrp > p.sale ? `<div class="mrp">₹${p.mrp}</div>` : ""}
          </div>

          ${p.discount > 0 ? `<div class="offBadge">${p.discount}% OFF</div>` : ""}
        </div>

        <div class="stock ${p.stock <= 0 ? "out" : ""}">
          ${p.stock <= 0 ? "Out of Stock" : "Stock: " + p.stock}
        </div>

        <button class="addBtn" ${p.stock <= 0 ? "disabled" : ""} onclick="addToCart('${p.id}')">
          ➕ Add to Cart
        </button>
      </div>
    `;

    grid.appendChild(card);
  });
}

/* CART */
function addToCart(id) {
  const found = cart.find(x => x.id == id);
  if (found) found.qty += 1;
  else cart.push({ id, qty: 1 });

  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem("sultan_cart", JSON.stringify(cart));
}

function openCart() {
  cartModal.classList.add("open");
  renderCart();
  updateCartUI();
}

function closeCart() {
  cartModal.classList.remove("open");
}

function renderCart() {
  cartItems.innerHTML = "";

  if (!cart.length) {
    cartItems.innerHTML = `<p style="padding:10px;font-weight:950;color:#64748b;">Cart is empty</p>`;
    updateCartUI();
    return;
  }

  cart.forEach(ci => {
    const p = products.find(x => x.id == ci.id);
    if (!p) return;

    const img = p.image || "assets/no-image.png";

    const div = document.createElement("div");
    div.className = "cartItem";

    div.innerHTML = `
      <img src="${img}" onerror="this.src='assets/no-image.png'">

      <div class="cartInfo">
        <h4>${p.name}</h4>
        <p>₹${p.sale} each</p>

        <div class="cartControls">
          <div class="qty">
            <button onclick="qtyMinus('${p.id}')">-</button>
            <span>${ci.qty}</span>
            <button onclick="qtyPlus('${p.id}')">+</button>
          </div>

          <button class="removeBtn" onclick="removeItem('${p.id}')">Remove</button>
        </div>
      </div>
    `;

    cartItems.appendChild(div);
  });
}

/* QTY */
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

/* BILL */
function calcSubtotal() {
  let total = 0;
  cart.forEach(ci => {
    const p = products.find(x => x.id == ci.id);
    if (!p) return;
    total += Number(p.sale) * Number(ci.qty);
  });
  return total;
}

function getDeliveryCharge() {
  const area = deliveryArea.value;

  // Bharatganj free
  if (area === "free") return 0;

  // Outside Bharatganj fixed charge
  return 20;
}

function money(n) {
  return "₹" + Number(n || 0);
}

/* UPI */
function buildUpiLink(amount) {
  const am = Math.max(0, Math.round(amount));
  const pn = encodeURIComponent(SHOP_NAME);
  const pa = encodeURIComponent(UPI_ID);
  const tr = "SM" + Date.now();
  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tr=${tr}`;
}

function updateUpiPayLink() {
  const subtotal = calcSubtotal();
  const delivery = getDeliveryCharge();
  const total = subtotal + delivery;

  if (paymentMethod.value === "upi" && total > 0) {
    upiPayBox.style.display = "block";
    upiPayBtn.href = buildUpiLink(total);
    upiPayBtn.innerHTML = `💰 Pay Now (${money(total)})`;
  } else {
    upiPayBox.style.display = "none";
    upiPayBtn.href = "#";
  }
}

/* UI UPDATE */
function updateCartUI() {
  const count = cart.reduce((a, b) => a + b.qty, 0);
  cartCount.innerText = count;
  fabCount.innerText = count;

  const subtotal = calcSubtotal();
  const delivery = getDeliveryCharge();
  const total = subtotal + delivery;

  billSubtotal.innerText = money(subtotal);
  billDelivery.innerText = money(delivery);
  billTotal.innerText = money(total);

  updateUpiPayLink();
}

/* WHATSAPP */
function sendWhatsApp() {
  if (!cart.length) {
    alert("Cart is empty ❌");
    return;
  }

  const name = custName.value.trim();
  const phone = custPhone.value.trim();
  const address = custAddress.value.trim();

  if (!name || !phone || !address) {
    alert("Name, Phone, Address जरूरी है ❌");
    return;
  }

  const subtotal = calcSubtotal();
  const delivery = getDeliveryCharge();
  const total = subtotal + delivery;

  let msg = `🛒 *New Order - ${SHOP_NAME}*\n\n`;
  msg += `👤 Name: ${name}\n`;
  msg += `📞 Phone: ${phone}\n`;
  msg += `🏠 Address: ${address}\n\n`;

  msg += `📍 Delivery Area: ${deliveryArea.value === "free" ? "Bharatganj (FREE)" : "Outside (PAID)"}\n`;
  msg += `📅 Delivery Day: ${deliveryDay.value}\n`;
  msg += `⏰ Time Slot: ${deliverySlot.value}\n`;
  msg += `💳 Payment: ${paymentMethod.value || "Not Selected"}\n\n`;

  msg += `🧾 *Items:*\n`;

  cart.forEach(ci => {
    const p = products.find(x => x.id == ci.id);
    if (!p) return;
    msg += `• ${p.name} × ${ci.qty} = ₹${p.sale * ci.qty}\n`;
  });

  msg += `\nSubtotal: ₹${subtotal}\n`;
  msg += `Delivery: ₹${delivery}\n`;
  msg += `*Grand Total: ₹${total}*\n`;

  if (paymentMethod.value === "upi") {
    msg += `\n💰 UPI ID: ${UPI_ID}\n`;
    msg += `✅ Customer can pay using Pay Now button on website.\n`;
  }

  msg += `\n📍 Location (Optional): Customer can share Live Location on WhatsApp.\n`;
  msg += `\n✅ Please Confirm Order`;

  const wa = `https://wa.me/91${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  window.open(wa, "_blank");

  // Clear cart after sending
  cart = [];
  saveCart();
  renderCart();
  updateCartUI();
  closeCart();
}

/* LOCATION SHARE */
function shareLocationOnWhatsApp() {
  if (!navigator.geolocation) {
    alert("Location not supported ❌");
    return;
  }

  shareLocationBtn.innerText = "📍 Getting location...";

  navigator.geolocation.getCurrentPosition((pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    const link = `https://maps.google.com/?q=${lat},${lng}`;
    const msg = `📍 My Live Location:\n${link}`;

    const wa = `https://wa.me/91${WHATSAPP}?text=${encodeURIComponent(msg)}`;
    window.open(wa, "_blank");

    shareLocationBtn.innerText = "📍 Share Live Location";
  }, () => {
    alert("Location permission denied ❌");
    shareLocationBtn.innerText = "📍 Share Live Location";
  });
}
