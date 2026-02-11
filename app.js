/* ================================
   Sultan Mart / Kirana PWA App.js
   FULL FINAL - Copy Paste
================================== */

/* ====== SETTINGS ====== */
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0DkCrsf4_AD96Kv9yaYNbMUUHpQtz59zkXH9f1T9mPI2pXB-OcXTR0pdO-9sgyarYD4pEp8nolt5R/pub?output=csv";

const STORE = {
  name: "Sultan Mart Bharatganj",
  subtitle: "Online Grocery • 7 AM – 10 PM",
  minOrder: 199,
  freeAreaName: "Bharatganj",
  outsideCharge: 20,
  phone: "9559868648",
  whatsapp: "9559868648",
  upiId: "9559868648@paytm",
  upiName: "Sultan Mart",
};

/* ====== STATE ====== */
let PRODUCTS = [];
let FILTER = "All";
let SEARCH = "";
let CART = [];
let CUSTOMER = {
  name: "",
  phone: "",
  address: "",
  area: STORE.freeAreaName, // Bharatganj default
  timeSlot: "Morning",
  locationText: "",
  locationLink: "",
  payment: "COD", // COD | UPI
};

/* ====== ELEMENTS (safe) ====== */
const $ = (id) => document.getElementById(id);

const productsGrid = $("productsGrid") || $("grid") || $("products") || null;
const searchInput = $("searchInput") || $("search") || null;
const cartCount = $("cartCount") || $("cartBadge") || null;
const openCartBtn = $("openCartBtn") || $("cartBtn") || null;
const cartModal = $("cartModal") || $("cartPopup") || $("cart") || null;
const closeCartBtn = $("closeCartBtn") || $("closeCart") || null;

const cartItemsBox = $("cartItems") || $("cartItemsBox") || null;
const cartSubtotalEl = $("cartSubtotal") || $("subtotal") || null;
const cartDeliveryEl = $("cartDelivery") || $("delivery") || null;
const cartTotalEl = $("cartTotal") || $("grandTotal") || $("total") || null;

const clearCartBtn = $("clearCartBtn") || null;
const whatsappBtn = $("whatsappBtn") || null;

const customerName = $("customerName") || $("name") || null;
const customerPhone = $("customerPhone") || $("phone") || null;
const customerAddress = $("customerAddress") || $("address") || null;
const customerArea = $("customerArea") || $("area") || null;
const timeSlotSelect = $("timeSlot") || null;

const paymentCOD = $("payCOD") || $("paymentCOD") || null;
const paymentUPI = $("payUPI") || $("paymentUPI") || null;

const upiPayBtn = $("upiPayBtn") || $("upiPayButton") || null;
const upiPayLinkBox = $("upiPayLinkBox") || $("upiLinkBox") || null;

const locationBtn = $("locationBtn") || $("getLocationBtn") || null;
const locationTextEl = $("locationText") || $("locationStatus") || null;

const afterOrderActions = $("afterOrderActions") || null;
const cancelOrderBtn = $("cancelOrderBtn") || null;
const replaceOrderBtn = $("replaceOrderBtn") || null;
const lastOrderBox = $("lastOrderBox") || null;

/* Install Button (optional) */
let deferredPrompt;
const installBtn = $("installBtn") || null;

/* ====== HELPERS ====== */
function toNumber(v) {
  if (v === null || v === undefined) return 0;
  const s = String(v).replace(/₹/g, "").replace(/,/g, "").trim();
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(n) {
  n = Math.round(toNumber(n));
  return `₹${n}`;
}

function getDiscountPercent(p) {
  const mrp = toNumber(p.mrp);
  const sale = toNumber(p.salePrice);
  if (!mrp || !sale) return 0;
  if (sale >= mrp) return 0;
  return Math.round(((mrp - sale) / mrp) * 100);
}

function getDeliveryCharge() {
  // Bharatganj = free, Outside = 20
  const area = (CUSTOMER.area || "").toLowerCase().trim();
  const free = STORE.freeAreaName.toLowerCase().trim();
  if (!area) return 0;
  if (area === free) return 0;
  return STORE.outsideCharge;
}

function saveCart() {
  localStorage.setItem("CART", JSON.stringify(CART));
}

function loadCart() {
  try {
    CART = JSON.parse(localStorage.getItem("CART") || "[]");
  } catch {
    CART = [];
  }
}

function saveLastOrder(orderObj) {
  localStorage.setItem("LAST_ORDER", JSON.stringify(orderObj));
}

function loadLastOrder() {
  try {
    return JSON.parse(localStorage.getItem("LAST_ORDER") || "null");
  } catch {
    return null;
  }
}

/* ====== CSV PARSER ====== */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      cur += '"';
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === "," && !inQuotes) {
      row.push(cur);
      cur = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (cur.length || row.length) {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      }
      continue;
    }

    cur += ch;
  }

  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }

  return rows;
}

/* ====== LOAD PRODUCTS ====== */
async function loadProducts() {
  try {
    const res = await fetch(SHEET_CSV_URL, { cache: "no-store" });
    const csv = await res.text();

    const rows = parseCSV(csv);
    if (!rows.length) throw new Error("CSV empty");

    const headers = rows[0].map((h) => h.trim());

    // Expected: ID Name Category MRP Discount Sale Price Stock Image
    const data = rows.slice(1).filter((r) => r.join("").trim().length > 0);

    PRODUCTS = data.map((r) => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = r[idx] ?? "";
      });

      return {
        id: obj["ID"] || obj["Id"] || obj["id"] || "",
        name: obj["Name"] || obj["name"] || "",
        category: obj["Category"] || obj["category"] || "All",
        mrp: toNumber(obj["MRP"] || obj["Mrp"] || 0),
        discount: toNumber(obj["Discount"] || obj["discount"] || 0),
        salePrice: toNumber(obj["Sale Price"] || obj["SalePrice"] || obj["salePrice"] || 0),
        stock: toNumber(obj["Stock"] || obj["stock"] || 0),
        image: obj["Image"] || obj["image"] || "",
      };
    });

    renderCategories();
    renderProducts();
  } catch (e) {
    console.error("CSV load error:", e);
    if (productsGrid) {
      productsGrid.innerHTML = `
        <div style="padding:16px; background:#fff3cd; border-radius:14px;">
          <b>CSV Link Wrong / Sheet Not Public</b><br/>
          Google Sheet ko <b>Publish to web</b> karke CSV link use karo.
        </div>
      `;
    }
  }
}

/* ====== CATEGORIES ====== */
function getCategories() {
  const set = new Set(["All"]);
  PRODUCTS.forEach((p) => set.add((p.category || "All").trim() || "All"));
  return [...set];
}

function renderCategories() {
  const catWrap = $("categoryBar") || $("categories") || null;
  if (!catWrap) return;

  const cats = getCategories();
  catWrap.innerHTML = cats
    .map((c) => {
      const active = c === FILTER ? "active" : "";
      return `<button class="catChip ${active}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`;
    })
    .join("");

  catWrap.querySelectorAll(".catChip").forEach((btn) => {
    btn.addEventListener("click", () => {
      FILTER = btn.dataset.cat;
      renderCategories();
      renderProducts();
    });
  });
}

/* ====== PRODUCTS RENDER ====== */
function filteredProducts() {
  return PRODUCTS.filter((p) => {
    const matchCat = FILTER === "All" ? true : (p.category || "All") === FILTER;
    const matchSearch = (p.name || "").toLowerCase().includes(SEARCH.toLowerCase());
    return matchCat && matchSearch;
  });
}

function renderProducts() {
  if (!productsGrid) return;

  const list = filteredProducts();

  // Offers top: discount OR salePrice < mrp
  list.sort((a, b) => {
    const da = getDiscountPercent(a);
    const db = getDiscountPercent(b);
    return db - da;
  });

  productsGrid.innerHTML = list
    .map((p) => {
      const off = getDiscountPercent(p);
      const out = p.stock <= 0;

      return `
      <div class="productCard ${out ? "out" : ""}">
        <div class="imgWrap">
          ${
            p.image
              ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" />`
              : `<div class="noImg">No Image</div>`
          }
          ${off > 0 ? `<div class="offBadge">${off}% OFF</div>` : ""}
          ${out ? `<div class="stockBadge">Out of Stock</div>` : ""}
        </div>

        <div class="pBody">
          <div class="pName">${escapeHtml(p.name)}</div>
          <div class="pCat">${escapeHtml(p.category || "")}</div>

          <div class="priceRow">
            <div class="salePrice">${formatMoney(p.salePrice || p.mrp)}</div>
            ${
              off > 0
                ? `<div class="mrpPrice">${formatMoney(p.mrp)}</div>`
                : ""
            }
          </div>

          <button class="addBtn" ${out ? "disabled" : ""} data-id="${escapeHtml(p.id)}">
            ${out ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>
      `;
    })
    .join("");

  productsGrid.querySelectorAll(".addBtn").forEach((btn) => {
    btn.addEventListener("click", () => addToCart(btn.dataset.id));
  });
}

/* ====== CART ====== */
function addToCart(id) {
  const p = PRODUCTS.find((x) => String(x.id) === String(id));
  if (!p) return;
  if (p.stock <= 0) return;

  const item = CART.find((x) => String(x.id) === String(id));
  if (item) item.qty += 1;
  else CART.push({ id: p.id, qty: 1 });

  saveCart();
  updateCartUI();
}

function changeQty(id, delta) {
  const item = CART.find((x) => String(x.id) === String(id));
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) CART = CART.filter((x) => String(x.id) !== String(id));

  saveCart();
  updateCartUI();
}

function clearCart() {
  CART = [];
  saveCart();
  updateCartUI();
}

function cartTotals() {
  let subtotal = 0;

  CART.forEach((ci) => {
    const p = PRODUCTS.find((x) => String(x.id) === String(ci.id));
    if (!p) return;
    const price = toNumber(p.salePrice || p.mrp);
    subtotal += price * ci.qty;
  });

  const delivery = subtotal > 0 ? getDeliveryCharge() : 0;
  const total = subtotal + delivery;

  return { subtotal, delivery, total };
}

function updateCartUI() {
  // cart count
  const count = CART.reduce((a, b) => a + b.qty, 0);
  if (cartCount) cartCount.textContent = count;

  // cart items render
  if (cartItemsBox) {
    if (!CART.length) {
      cartItemsBox.innerHTML = `<div class="emptyCart">Cart is empty</div>`;
    } else {
      cartItemsBox.innerHTML = CART.map((ci) => {
        const p = PRODUCTS.find((x) => String(x.id) === String(ci.id));
        if (!p) return "";

        const price = toNumber(p.salePrice || p.mrp);
        const line = price * ci.qty;

        return `
          <div class="cartItem">
            <div class="ciLeft">
              <div class="ciName">${escapeHtml(p.name)}</div>
              <div class="ciPrice">${formatMoney(price)} × ${ci.qty} = <b>${formatMoney(line)}</b></div>
            </div>

            <div class="ciRight">
              <button class="qtyBtn" data-id="${escapeHtml(p.id)}" data-d="-1">−</button>
              <div class="qtyVal">${ci.qty}</div>
              <button class="qtyBtn" data-id="${escapeHtml(p.id)}" data-d="1">+</button>
            </div>
          </div>
        `;
      }).join("");

      cartItemsBox.querySelectorAll(".qtyBtn").forEach((b) => {
        b.addEventListener("click", () => changeQty(b.dataset.id, Number(b.dataset.d)));
      });
    }
  }

  // totals
  const t = cartTotals();
  if (cartSubtotalEl) cartSubtotalEl.textContent = formatMoney(t.subtotal);
  if (cartDeliveryEl)
    cartDeliveryEl.textContent = t.delivery === 0 ? "FREE" : formatMoney(t.delivery);
  if (cartTotalEl) cartTotalEl.textContent = formatMoney(t.total);

  // update UPI link
  updateUpiLink();
  updateUpiPayButton();

  // show last order box if exists
  renderLastOrderBox();
}

/* ====== CUSTOMER INPUTS ====== */
function bindCustomerInputs() {
  if (customerName) {
    customerName.addEventListener("input", () => (CUSTOMER.name = customerName.value.trim()));
  }
  if (customerPhone) {
    customerPhone.addEventListener("input", () => (CUSTOMER.phone = customerPhone.value.trim()));
  }
  if (customerAddress) {
    customerAddress.addEventListener("input", () => (CUSTOMER.address = customerAddress.value.trim()));
  }
  if (customerArea) {
    customerArea.addEventListener("input", () => {
      CUSTOMER.area = customerArea.value.trim();
      updateCartUI();
    });
  }
  if (timeSlotSelect) {
    timeSlotSelect.addEventListener("change", () => (CUSTOMER.timeSlot = timeSlotSelect.value));
  }

  // Payment
  if (paymentCOD) {
    paymentCOD.addEventListener("change", () => {
      if (paymentCOD.checked) CUSTOMER.payment = "COD";
      updateUpiPayButton();
      updateUpiLink();
    });
  }
  if (paymentUPI) {
    paymentUPI.addEventListener("change", () => {
      if (paymentUPI.checked) CUSTOMER.payment = "UPI";
      updateUpiPayButton();
      updateUpiLink();
    });
  }
}

/* ====== LOCATION ====== */
async function getLocation() {
  if (!navigator.geolocation) {
    alert("Location not supported in this phone.");
    return;
  }

  if (locationTextEl) locationTextEl.textContent = "Getting location...";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      CUSTOMER.locationText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      CUSTOMER.locationLink = `https://maps.google.com/?q=${lat},${lng}`;

      if (locationTextEl) locationTextEl.innerHTML = `📍 ${CUSTOMER.locationText}`;
      updateCartUI();
    },
    () => {
      if (locationTextEl) locationTextEl.textContent = "Location permission denied";
    },
    { enableHighAccuracy: true, timeout: 12000 }
  );
}

/* ====== UPI ====== */
function buildUpiUrl(amount) {
  const amt = Math.round(toNumber(amount));
  const upi = STORE.upiId;
  const name = encodeURIComponent(STORE.upiName);

  // Standard UPI deeplink
  return `upi://pay?pa=${encodeURIComponent(upi)}&pn=${name}&am=${amt}&cu=INR`;
}

function updateUpiLink() {
  if (!upiPayBtn && !upiPayLinkBox) return;

  const t = cartTotals();
  const url = buildUpiUrl(t.total);

  if (upiPayBtn) upiPayBtn.href = url;
  if (upiPayLinkBox) upiPayLinkBox.textContent = url;
}

function updateUpiPayButton() {
  if (!upiPayBtn) return;

  if (CUSTOMER.payment === "UPI") {
    upiPayBtn.style.display = "inline-flex";
  } else {
    upiPayBtn.style.display = "none";
  }
}

/* ====== WHATSAPP ORDER ====== */
function buildOrderMessage(orderId) {
  const t = cartTotals();

  let text = "";
  text += `🛒 *${STORE.name}*\n`;
  text += `🆔 *Order ID:* ${orderId}\n\n`;

  text += `📦 *Items:*\n`;
  CART.forEach((ci, idx) => {
    const p = PRODUCTS.find((x) => String(x.id) === String(ci.id));
    if (!p) return;
    const price = toNumber(p.salePrice || p.mrp);
    text += `${idx + 1}. ${p.name} × ${ci.qty} = ${formatMoney(price * ci.qty)}\n`;
  });

  text += `\n💰 *Bill Summary*\n`;
  text += `Subtotal: ${formatMoney(t.subtotal)}\n`;
  text += `Delivery: ${t.delivery === 0 ? "FREE" : formatMoney(t.delivery)}\n`;
  text += `Total: *${formatMoney(t.total)}*\n`;

  text += `\n🧑 Customer Details\n`;
  text += `Name: ${CUSTOMER.name || "-"}\n`;
  text += `Phone: ${CUSTOMER.phone || "-"}\n`;
  text += `Address: ${CUSTOMER.address || "-"}\n`;
  text += `Area: ${CUSTOMER.area || "-"}\n`;
  text += `Time Slot: ${CUSTOMER.timeSlot || "-"}\n`;

  if (CUSTOMER.locationLink) {
    text += `📍 Location: ${CUSTOMER.locationLink}\n`;
  }

  text += `\n💳 Payment: ${CUSTOMER.payment}\n`;

  if (CUSTOMER.payment === "UPI") {
    text += `UPI Pay Link: ${buildUpiUrl(t.total)}\n`;
  }

  text += `\n🙏 Please confirm my order.\n`;
  return text;
}

function sendOrderToWhatsApp() {
  if (!CART.length) {
    alert("Cart empty hai bhai 😄");
    return;
  }

  const t = cartTotals();
  if (t.subtotal < STORE.minOrder) {
    alert(`Minimum order ${formatMoney(STORE.minOrder)} hai.`);
    return;
  }

  if (!CUSTOMER.phone || CUSTOMER.phone.length < 10) {
    alert("Customer phone number sahi se bharo.");
    return;
  }

  // Order ID
  const orderId = "ORD" + Date.now();

  // Save last order (for cancel/replace)
  const orderObj = {
    orderId,
    cart: JSON.parse(JSON.stringify(CART)),
    customer: JSON.parse(JSON.stringify(CUSTOMER)),
    totals: t,
    time: new Date().toLocaleString(),
  };
  saveLastOrder(orderObj);

  // WhatsApp message
  const msg = buildOrderMessage(orderId);
  const url = `https://wa.me/91${STORE.whatsapp}?text=${encodeURIComponent(msg)}`;

  // show after order buttons
  if (afterOrderActions) afterOrderActions.style.display = "flex";

  // Clear cart after sending
  clearCart();

  // open WhatsApp
  window.open(url, "_blank");
}

/* ====== CANCEL / REPLACEMENT ====== */
function sendCancelMessage() {
  const last = loadLastOrder();
  if (!last) {
    alert("No last order found.");
    return;
  }

  const msg =
    `❌ *Order Cancel Request*\n` +
    `🛒 ${STORE.name}\n` +
    `🆔 Order ID: ${last.orderId}\n` +
    `Customer: ${last.customer?.name || "-"}\n` +
    `Phone: ${last.customer?.phone || "-"}\n\n` +
    `Please cancel my order.`;

  const url = `https://wa.me/91${STORE.whatsapp}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

function sendReplacementMessage() {
  const last = loadLastOrder();
  if (!last) {
    alert("No last order found.");
    return;
  }

  const msg =
    `🔁 *Replacement Request*\n` +
    `🛒 ${STORE.name}\n` +
    `🆔 Order ID: ${last.orderId}\n\n` +
    `Please replace item(s) in my order.\n` +
    `I will tell replacement details in chat.`;

  const url = `https://wa.me/91${STORE.whatsapp}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

function renderLastOrderBox() {
  const last = loadLastOrder();
  if (!lastOrderBox) return;

  if (!last) {
    lastOrderBox.style.display = "none";
    return;
  }

  lastOrderBox.style.display = "block";
  lastOrderBox.innerHTML = `
    <div class="lobTitle">🧾 Last Order</div>
    <div><b>Order ID:</b> ${escapeHtml(last.orderId)}</div>
    <div><b>Total:</b> ${formatMoney(last.totals?.total || 0)}</div>
    <div><b>Time:</b> ${escapeHtml(last.time || "")}</div>
    <div style="margin-top:6px; font-size:13px; opacity:.85;">
      Cancel/Replacement ke liye Order ID use hoga.
    </div>
  `;
}

/* ====== CART MODAL OPEN/CLOSE ====== */
function openCart() {
  if (!cartModal) return;
  cartModal.classList.add("show");
  updateCartUI();
}

function closeCart() {
  if (!cartModal) return;
  cartModal.classList.remove("show");
}

/* ====== SEARCH ====== */
if (searchInput) {
  searchInput.addEventListener("input", () => {
    SEARCH = searchInput.value.trim();
    renderProducts();
  });
}

/* ====== EVENTS ====== */
if (openCartBtn) openCartBtn.addEventListener("click", openCart);
if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);

if (clearCartBtn) clearCartBtn.addEventListener("click", clearCart);
if (whatsappBtn) whatsappBtn.addEventListener("click", sendOrderToWhatsApp);

if (locationBtn) locationBtn.addEventListener("click", getLocation);

if (cancelOrderBtn) cancelOrderBtn.addEventListener("click", sendCancelMessage);
if (replaceOrderBtn) replaceOrderBtn.addEventListener("click", sendReplacementMessage);

/* ====== INSTALL BUTTON (OPTIONAL) ====== */
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.style.display = "inline-flex";
});

if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.style.display = "none";
  });
}

/* ====== INIT ====== */
function init() {
  // Fill store details if elements exist
  const storeNameEl = $("storeName");
  const storeSubEl = $("storeSubtitle");
  const minOrderEl = $("minOrderText");

  if (storeNameEl) storeNameEl.textContent = STORE.name;
  if (storeSubEl) storeSubEl.textContent = STORE.subtitle;
  if (minOrderEl) minOrderEl.textContent = `Minimum Order: ${formatMoney(STORE.minOrder)} • ${STORE.freeAreaName} Free Delivery`;

  // prefill
  if (customerArea && !customerArea.value) customerArea.value = STORE.freeAreaName;
  if (timeSlotSelect && !timeSlotSelect.value) timeSlotSelect.value = "Morning";

  loadCart();
  bindCustomerInputs();
  loadProducts();
  updateCartUI();
  renderLastOrderBox();
}

document.addEventListener("DOMContentLoaded", init);
