// =======================
// 🔥 Firebase Setup
// =======================
const firebaseConfig = {
  apiKey: "AIzaSyA0zW95qOLokFgruAV8nO-2eeCai6WtQ_c",
  authDomain: "sultan-mart.firebaseapp.com",
  projectId: "sultan-mart",
  storageBucket: "sultan-mart.firebasestorage.app",
  messagingSenderId: "617764247324",
  appId: "1:617764247324:web:08bf92b6904f9c70b9ccd9"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

async function saveOrderToFirebase(orderData){
  try{
    await db.collection("orders").doc(orderData.orderId).set(orderData);
    console.log("✅ Order Saved:", orderData.orderId);
  }catch(err){
    console.error("❌ Firebase Error:", err);
  }
}

// =========================
// Sultan Mart PWA (Sheets)
// =========================

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0DkCrsf4_AD96Kv9yaYNbMUUHpQtz59zkXH9f1T9mPI2pXB-OcXTR0pdO-9sgyarYD4pEp8nolt5R/pub?output=csv";

const STORE = {
  name: "Sultan Mart Bharatganj",
  phone: "9559868648",
  upiId: "9559868648@ptyes",
  minOrder: 199,
  outsideCharge: 20,
};

// DOM
const chipsEl = document.getElementById("chips");
const offersGrid = document.getElementById("offersGrid");
const productsGrid = document.getElementById("productsGrid");
const searchBox = document.getElementById("searchBox");

const cartCount = document.getElementById("cartCount");
const cartModal = document.getElementById("cartModal");
const openCartBtn = document.getElementById("openCartBtn");
const closeCartBtn = document.getElementById("closeCartBtn");

const cartItemsEl = document.getElementById("cartItems");
const clearCartBtn = document.getElementById("clearCartBtn");
const whatsappBtn = document.getElementById("whatsappBtn");

const custName = document.getElementById("custName");
const custPhone = document.getElementById("custPhone");
const custAddress = document.getElementById("custAddress");

const deliveryArea = document.getElementById("deliveryArea");
const deliverySlot = document.getElementById("deliverySlot");

const getLocationBtn = document.getElementById("getLocationBtn");
const locationText = document.getElementById("locationText");

const itemsTotalEl = document.getElementById("itemsTotal");
const deliveryChargeEl = document.getElementById("deliveryCharge");
const grandTotalEl = document.getElementById("grandTotal");

const upiIdBox = document.getElementById("upiIdBox");
const copyUpiBtn = document.getElementById("copyUpiBtn");

const upiPayLink = document.getElementById("upiPayLink");

upiIdBox.value = STORE.upiId;

// State
let allProducts = [];
let filteredProducts = [];
let selectedCategory = "All";

let cart = JSON.parse(localStorage.getItem("sultan_cart") || "{}");
let userLocation = JSON.parse(localStorage.getItem("sultan_location") || "null");

// --------------------
// CSV Parser
// --------------------
function parseCSV(text) {
  const rows = [];
  let row = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (current.length || row.length) {
        row.push(current.trim());
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length || row.length) {
    row.push(current.trim());
    rows.push(row);
  }

  return rows;
}

function num(v) {
  const n = Number(String(v || "").replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function safe(v) {
  return (v || "").toString().trim();
}

// --------------------
// Load Products
// --------------------
async function loadProducts() {
  const res = await fetch(CSV_URL, { cache: "no-store" });
  const text = await res.text();

  const rows = parseCSV(text);
  if (!rows.length) return;

  const headers = rows[0].map((h) => h.trim());
  const data = rows.slice(1);

  allProducts = data
    .map((r) => {
      const obj = {};
      headers.forEach((h, idx) => (obj[h] = r[idx] || ""));

      const mrp = num(obj["MRP"]);
      const discount = num(obj["Discount"]);
      const salePriceFromSheet = num(obj["Sale Price"]);
      const stock = num(obj["Stock"]);

      let sale = salePriceFromSheet;

      // अगर Sale Price खाली है तो auto calculate
      if (!sale) {
        if (discount > 0) {
          sale = Math.round(mrp - (mrp * discount) / 100);
        } else {
          sale = mrp;
        }
      }

      const img = safe(obj["Image"]);
      const name = safe(obj["Name"]);
      const cat = safe(obj["Category"]) || "Other";

      return {
        id: safe(obj["ID"]) || name,
        name,
        category: cat,
        mrp,
        discount,
        sale,
        stock,
        image: img,
      };
    })
    .filter((p) => p.name);

  // Offers = जिनका discount > 0
  filteredProducts = [...allProducts];

  renderChips();
  renderAll();
  updateCartUI();
}

function renderChips() {
  const cats = ["All", ...new Set(allProducts.map((p) => p.category))];

  chipsEl.innerHTML = cats
    .map((c) => {
      const active = c === selectedCategory ? "active" : "";
      return `<button class="chip ${active}" data-cat="${c}">${c}</button>`;
    })
    .join("");

  chipsEl.querySelectorAll(".chip").forEach((b) => {
    b.addEventListener("click", () => {
      selectedCategory = b.dataset.cat;
      chipsEl.querySelectorAll(".chip").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      renderAll();
    });
  });
}

function getVisibleProducts() {
  const q = searchBox.value.trim().toLowerCase();

  return allProducts.filter((p) => {
    const matchCat = selectedCategory === "All" ? true : p.category === selectedCategory;
    const matchQ =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);

    return matchCat && matchQ;
  });
}

function isOffer(p) {
  return p.discount > 0 && p.mrp > p.sale;
}

function productCard(p) {
  const out = p.stock <= 0;
  const offer = isOffer(p);

  const badge = offer ? `<span class="badge">${p.discount}% OFF</span>` : "";
  const mrp = offer ? `<span class="mrp">₹${p.mrp}</span>` : "";

  const img = p.image
    ? p.image
    : "https://dummyimage.com/600x400/ddd/000&text=No+Image";

  return `
  <div class="card">
    <div class="imgWrap">
      <img src="${img}" alt="${p.name}" onerror="this.src='https://dummyimage.com/600x400/ddd/000&text=No+Image'"/>
    </div>
    <div class="cardBody">
      <p class="pName">${p.name}</p>
      <div class="pCat">${p.category}</div>

      <div class="priceRow">
        <div class="sale">₹${p.sale}</div>
        ${mrp}
        ${badge}
      </div>

      <div class="stock">Stock: ${p.stock}</div>

      <button class="addBtn" ${out ? "disabled" : ""} onclick="addToCart('${p.id}')">
        ${out ? "Out of Stock" : "Add to Cart"}
      </button>
    </div>
  </div>`;
}

function renderAll() {
  const visible = getVisibleProducts();

  // Offers section
  const offers = visible.filter((p) => isOffer(p)).slice(0, 8);
  offersGrid.innerHTML = offers.length ? offers.map(productCard).join("") : `<div style="color:#6b7280;font-weight:800;">No offers found.</div>`;

  // All products
  productsGrid.innerHTML = visible.map(productCard).join("");
}

searchBox.addEventListener("input", renderAll);

// --------------------
// Cart
// --------------------
function saveCart() {
  localStorage.setItem("sultan_cart", JSON.stringify(cart));
}

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  updateCartUI();
}

function decCart(id) {
  cart[id] = (cart[id] || 0) - 1;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  updateCartUI();
}

function incCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  updateCartUI();
}

function clearCart() {
  cart = {};
  saveCart();
  updateCartUI();
}

function cartList() {
  const items = [];
  Object.keys(cart).forEach((id) => {
    const p = allProducts.find((x) => x.id === id);
    if (!p) return;
    items.push({ ...p, qty: cart[id] });
  });
  return items;
}

function calcTotals() {
  const items = cartList();
  const itemsTotal = items.reduce((s, x) => s + x.sale * x.qty, 0);

  const area = deliveryArea.value;
  const deliveryCharge = area === "outside" ? STORE.outsideCharge : 0;

  const grandTotal = itemsTotal + deliveryCharge;

  return { itemsTotal, deliveryCharge, grandTotal };
}

function updateCartUI() {
  const items = cartList();
  const count = items.reduce((s, x) => s + x.qty, 0);
  cartCount.textContent = count;

  // Render items
  if (!items.length) {
    cartItemsEl.innerHTML = `<div style="color:#6b7280;font-weight:900;">Cart is empty.</div>`;
  } else {
    cartItemsEl.innerHTML = items
      .map((x) => {
        const img = x.image
          ? x.image
          : "https://dummyimage.com/600x400/ddd/000&text=No+Image";

        return `
        <div class="cartItem">
          <img class="ciImg" src="${img}" onerror="this.src='https://dummyimage.com/600x400/ddd/000&text=No+Image'"/>
          <div>
            <div class="ciName">${x.name}</div>
            <div class="ciPrice">₹${x.sale} each</div>
          </div>
          <div class="qtyBox">
            <button class="qBtn" onclick="decCart('${x.id}')">-</button>
            <div class="qty">${x.qty}</div>
            <button class="qBtn" onclick="incCart('${x.id}')">+</button>
          </div>
          <div style="font-weight:1000;">₹${x.sale * x.qty}</div>
        </div>`;
      })
      .join("");
  }

  // Totals
  const { itemsTotal, deliveryCharge, grandTotal } = calcTotals();
  itemsTotalEl.textContent = `₹${itemsTotal}`;
  deliveryChargeEl.textContent = `₹${deliveryCharge}`;
  grandTotalEl.textContent = `₹${grandTotal}`;

  // Update UPI link if selected
  updateUpiLink();
}

deliveryArea.addEventListener("change", updateCartUI);

// --------------------
// Modal
// --------------------
openCartBtn.addEventListener("click", () => {
  cartModal.classList.add("show");
  updateCartUI();
});
closeCartBtn.addEventListener("click", () => cartModal.classList.remove("show"));
cartModal.addEventListener("click", (e) => {
  if (e.target === cartModal) cartModal.classList.remove("show");
});

// --------------------
// Location
// --------------------
function setLocationText() {
  if (!userLocation) {
    locationText.textContent = "Location: Not shared";
    return;
  }
  locationText.textContent = `Location: ${userLocation.lat}, ${userLocation.lng}`;
}

setLocationText();

getLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Location not supported in your phone browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation = {
        lat: pos.coords.latitude.toFixed(6),
        lng: pos.coords.longitude.toFixed(6),
      };
      localStorage.setItem("sultan_location", JSON.stringify(userLocation));
      setLocationText();
      alert("Location shared successfully ✅");
    },
    () => {
      alert("Location permission denied ❌");
    }
  );
});

// --------------------
// Copy UPI
// --------------------
copyUpiBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(STORE.upiId);
    alert("UPI ID copied ✅");
  } catch {
    alert("Copy failed ❌");
  }
});

// --------------------
// UPI Payment Auto Amount Link
// --------------------
function getSelectedPayMethod() {
  const r = document.querySelector("input[name='payMethod']:checked");
  return r ? r.value : "COD";
}

function updateUpiLink() {
  const method = getSelectedPayMethod();
  const { grandTotal } = calcTotals();

  if (method !== "UPI") {
    upiPayLink.style.display = "none";
    return;
  }

  // UPI Deep Link (Auto Amount)
  const upi = STORE.upiId;
  const payeeName = encodeURIComponent(STORE.name);
  const amount = grandTotal;

  const url = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${payeeName}&am=${amount}&cu=INR`;

  upiPayLink.href = url;
  upiPayLink.style.display = "block";
}

document.querySelectorAll("input[name='payMethod']").forEach((r) => {
  r.addEventListener("change", () => {
    updateUpiLink();
  });
});

// --------------------
// Clear Cart
// --------------------
clearCartBtn.addEventListener("click", () => {
  if (confirm("Clear cart?")) clearCart();
});

// --------------------
// WhatsApp Order
// --------------------
function buildWhatsAppMessage() {
  const name = custName.value.trim();
  const phone = custPhone.value.trim();
  const address = custAddress.value.trim();
  const slot = deliverySlot.value;
  const area = deliveryArea.value === "outside" ? "Outside Bharatganj (+₹20)" : "Bharatganj (Free)";

  const payMethod = getSelectedPayMethod();
  const orderId = generateOrderId();
  window.currentOrderId = orderId;
// ✅ Order Page Link + QR
const orderPageLink = `https://sultan-mart-pwa.vercel.app/order.html?id=${orderId}`;
const qrLink = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(orderPageLink)}`;

  const items = cartList();
  const { itemsTotal, deliveryCharge, grandTotal } = calcTotals();


  if (!items.length) return { ok: false, msg: "Cart is empty!" };
  if (!name) return { ok: false, msg: "Enter customer name!" };
  if (!phone || phone.length < 10) return { ok: false, msg: "Enter valid mobile number!" };
  if (!address) return { ok: false, msg: "Enter full address!" };
  if (grandTotal < STORE.minOrder) return { ok: false, msg: `Minimum order ₹${STORE.minOrder} required!` };

  let text = `🛒 *${STORE.name}* Order\n\n`;
  text += `🆔 Order ID: *${orderId}*\n\n`;

  text += `👤 Name: ${name}\n`;
  text += `📞 Mobile: ${phone}\n`;
  text += `🏠 Address: ${address}\n`;
  text += `🚚 Delivery Area: ${area}\n`;
  text += `⏰ Time Slot: ${slot}\n`;

  if (userLocation) {
    text += `📍 Location: https://www.google.com/maps?q=${userLocation.lat},${userLocation.lng}\n`;
  }

  text += `\n---------------------\n`;
  text += `🧾 *Items*\n`;

  items.forEach((x, i) => {
    text += `${i + 1}. ${x.name} × ${x.qty} = ₹${x.sale * x.qty}\n`;
  });

  text += `\n---------------------\n`;
  text += `💰 Items Total: ₹${itemsTotal}\n`;
  text += `🚚 Delivery: ₹${deliveryCharge}\n`;
  text += `✅ *Grand Total: ₹${grandTotal}*\n\n`;

  text += `💳 Payment Method: ${payMethod}\n`;

  if (payMethod === "UPI") {
    text += `UPI ID: ${STORE.upiId}\n`;
    text += `Pay Link: ${buildUPILink(grandTotal, orderId)}\n`;
  }

  text += `\n🔗 Order Page: ${orderPageLink}\n`;
text += `📌 QR Code: ${qrLink}\n`;
  text += `\n🙏 Please confirm my order.`;
  const orderData = {
  orderId,
  time: new Date().toISOString(),
  customer: {
  name,
  phone,
  address,
},
status: "PENDING",
  delivery: {
    area,
    slot,
    charge: deliveryCharge,
  },
  payment: {
    method: payMethod,
    upiId: STORE.upiId,
    upiLink: (payMethod === "UPI") ? buildUPILink(grandTotal, orderId) : "",
  },
  totals: {
    subTotal: itemsTotal,
    delivery: deliveryCharge,
    grandTotal: grandTotal,
  },
  items: items.map(x => ({
    id: x.id,
    name: x.name,
    qty: x.qty,
    salePrice: x.sale,
    mrp: x.mrp,
    discount: x.discount
  })),
  location: userLocation ? {
    lat: userLocation.lat,
    lng: userLocation.lng,
    map: `https://www.google.com/maps?q=${userLocation.lat},${userLocation.lng}`
  } : null,
  links: {
    orderPage: orderPageLink,
    qr: qrLink
  }
};

saveLastOrder({
  orderId,
  total: grandTotal,
  name,
  phone,
  address,
  slot,
  area,
  payMethod,
  time: new Date().toLocaleString(),
});
  return { ok: true, text, orderData };
}

whatsappBtn.addEventListener("click", async () => {
  const result = buildWhatsAppMessage();

  if (!result.ok) {
    alert(result.msg);
    return;
  }

  // ✅ Firebase order data
  window.__lastOrderData = result.orderData;

  // ✅ Save in Firebase first
  await saveOrderToFirebase(result.orderData);

  // ✅ WhatsApp open
  const url = `https://wa.me/91${STORE.phone}?text=${encodeURIComponent(result.text)}`;
  window.open(url, "_blank");

  showLastOrderBox();
});

// --------------------
loadProducts();

function buildUPILink(amount, orderId="") {
  const UPI_ID = STORE.upiId;
  const PAYEE_NAME = STORE.name;

  const amt = Number(amount || 0);
  if (!amt || amt < 1) return "";

  const cleanAmount = amt.toFixed(2);

  const NOTE = `Order ${orderId || "SultanMart"}`;

  return (
    "upi://pay" +
    "?pa=" + encodeURIComponent(UPI_ID) +
    "&pn=" + encodeURIComponent(PAYEE_NAME) +
    "&am=" + encodeURIComponent(cleanAmount) +
    "&cu=INR" +
    "&tn=" + encodeURIComponent(NOTE)
  );
}

function updateUpiPayButton() {
  const upiPayLink = document.getElementById("upiPayLink");

  // Payment method check
  const selected = document.querySelector("input[name='payMethod']:checked");
  const method = selected ? selected.value : "COD";

  // Total निकालो
  const grandTotal = Number(document.getElementById("grandTotal").innerText.replace(/[^\d.]/g, "")) || 0;

  if (method !== "UPI") {
    upiPayLink.style.display = "none";
    return;
  }

  const orderId = window.currentOrderId || document.getElementById("orderIdText")?.innerText || "";
const link = buildUPILink(grandTotal, orderId);

  upiPayLink.href = link;
  upiPayLink.style.display = "block";
}

let deferredPrompt;
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = "inline-flex";
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  await deferredPrompt.userChoice;

  deferredPrompt = null;
  installBtn.style.display = "none";
});

// =====================
// ORDER ID + CANCEL / REPLACE SYSTEM
// =====================
function generateOrderId() {
  return "SM" + Date.now();
}

function saveLastOrder(orderObj) {
  localStorage.setItem("sultan_last_order", JSON.stringify(orderObj));
}

function getLastOrder() {
  try {
    return JSON.parse(localStorage.getItem("sultan_last_order") || "null");
  } catch {
    return null;
  }
}

function showLastOrderBox() {
  const last = getLastOrder();
  const box = document.getElementById("lastOrderBox");
  const actions = document.getElementById("afterOrderActions");

  if (!box || !actions) return;

  if (!last) {
    box.style.display = "none";
    actions.style.display = "none";
    return;
  }

  box.style.display = "block";
  actions.style.display = "flex";

  box.innerHTML = `
    <b>Last Order Saved ✅</b><br>
    <b>Order ID:</b> ${last.orderId}<br>
    <b>Total:</b> ₹${last.total}<br>
    <small>Cancel/Replacement ke liye button use karein.</small>
  `;
}

function sendCancelOrder() {
  const last = getLastOrder();
  if (!last) return alert("No last order found!");

  const msg =
    `❌ Order Cancel Request%0A%0A` +
    `Order ID: ${last.orderId}%0A` +
    `Name: ${last.name}%0A` +
    `Phone: ${last.phone}%0A%0A` +
    `Please cancel my order.`;

  window.open(`https://wa.me/91${STORE.phone}?text=${msg}`, "_blank");
}

function sendReplaceOrder() {
  const last = getLastOrder();
  if (!last) return alert("No last order found!");

  const msg =
    `🔁 Replacement Request%0A%0A` +
    `Order ID: ${last.orderId}%0A` +
    `Name: ${last.name}%0A` +
    `Phone: ${last.phone}%0A%0A` +
    `Replacement details:%0A- Remove: ____%0A- Add: ____`;

  window.open(`https://wa.me/91${STORE.phone}?text=${msg}`, "_blank");
}

window.addEventListener("load", () => {
  const cancelBtn = document.getElementById("cancelOrderBtn");
  const replaceBtn = document.getElementById("replaceOrderBtn");

  if (cancelBtn) cancelBtn.addEventListener("click", sendCancelOrder);
  if (replaceBtn) replaceBtn.addEventListener("click", sendReplaceOrder);

  showLastOrderBox();
});


