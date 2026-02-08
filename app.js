// ===============================
// Sultan Mart Bharatganj - PWA
// Products from Google Sheet CSV
// ===============================

const SHOP_NAME = "Sultan Mart Bharatganj";
const WHATSAPP_NUMBER = "9559868648";
const UPI_ID = "9559868648@ptyes";
const MIN_ORDER = 199;

// Delivery Rules
const DELIVERY_RULES = {
  "Bharatganj (Free)": 0,
  "Nearby (₹10)": 10,
  "Far (₹20)": 20,
};

// ✅ Google Sheet CSV Link
const GOOGLE_SHEET_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0DkCrsf4_AD96Kv9yaYNbMUUHpQtz59zkXH9f1T9mPI2pXB-OcXTR0pdO-9sgyarYD4pEp8nolt5R/pub?output=csv";

// Products (will load from sheet)
let products = [];

// Cart
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ===============================
// Elements
// ===============================
const productsContainer = document.getElementById("products");
const cartBtn = document.getElementById("cartBtn");
const cartCount = document.getElementById("cartCount");

const cartModal = document.getElementById("cartModal");
const closeCart = document.getElementById("closeCart");

const cartItems = document.getElementById("cartItems");
const subtotalEl = document.getElementById("subtotal");
const deliveryAreaEl = document.getElementById("deliveryArea");
const deliveryChargeEl = document.getElementById("deliveryCharge");
const totalEl = document.getElementById("total");

const customerNameEl = document.getElementById("customerName");
const customerPhoneEl = document.getElementById("customerPhone");
const customerAddressEl = document.getElementById("customerAddress");
const customerLandmarkEl = document.getElementById("customerLandmark");

const paymentMethodEl = document.getElementById("paymentMethod");
const placeOrderBtn = document.getElementById("placeOrderBtn");
const callShopBtn = document.getElementById("callShopBtn");

const msgBox = document.getElementById("msgBox");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

// ===============================
// Utils
// ===============================
function formatMoney(n) {
  return "₹" + Number(n || 0).toFixed(0);
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  cartCount.innerText = cart.reduce((s, i) => s + i.qty, 0);
}

function getSubtotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

function getDeliveryCharge() {
  return DELIVERY_RULES[deliveryAreaEl.value] || 0;
}

function getTotal() {
  return getSubtotal() + getDeliveryCharge();
}

// ===============================
// Load Products from Google Sheet
// ===============================
async function loadProductsFromSheet() {
  try {
    productsContainer.innerHTML = `<p style="padding:15px;font-weight:bold;">Loading products...</p>`;

    const res = await fetch(GOOGLE_SHEET_CSV, { cache: "no-store" });
    const csvText = await res.text();

    // Split lines
    const lines = csvText.trim().split("\n");

    // Convert CSV line to array (simple)
    const rows = lines.map((line) => line.split(","));

    // Headers
    const headers = rows[0].map((h) => h.replaceAll('"', "").trim().toLowerCase());

    const nameIndex = headers.indexOf("name");
    const priceIndex = headers.indexOf("price");
    const categoryIndex = headers.indexOf("category");

    if (nameIndex === -1 || priceIndex === -1 || categoryIndex === -1) {
      productsContainer.innerHTML = `<p style="padding:15px;color:red;font-weight:bold;">Sheet headers गलत हैं. Row1 में name, price, category होना चाहिए.</p>`;
      return;
    }

    const list = [];

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];

      const name = (cols[nameIndex] || "").replaceAll('"', "").trim();
      const price = parseFloat((cols[priceIndex] || "0").replaceAll('"', "").trim());
      const category = (cols[categoryIndex] || "Others").replaceAll('"', "").trim();

      if (!name) continue;

      list.push({
        id: i,
        name,
        price: isNaN(price) ? 0 : price,
        category: category || "Others",
      });
    }

    products = list;

    renderProducts();
  } catch (err) {
    console.log("Sheet Load Error:", err);
    productsContainer.innerHTML = `<p style="padding:15px;color:red;font-weight:bold;">Products load नहीं हो रहे. Publish to web + CSV check करो.</p>`;
  }
}

// ===============================
// Render Products (Search + Category)
// ===============================
function renderProducts() {
  productsContainer.innerHTML = "";

  const q = searchInput.value.trim().toLowerCase();
  const cat = categoryFilter.value;

  let filtered = products.filter((p) => p.name.toLowerCase().includes(q));

  if (cat !== "All") {
    filtered = filtered.filter((p) => p.category === cat);
  }

  if (filtered.length === 0) {
    productsContainer.innerHTML = `<p style="padding:15px;font-weight:bold;">No products found 😅</p>`;
    return;
  }

  filtered.forEach((p) => {
    const div = document.createElement("div");
    div.className = "product-card";

    div.innerHTML = `
      <h3>${p.name}</h3>
      <p class="category">${p.category}</p>
      <p class="price">${formatMoney(p.price)}</p>
      <button class="add-btn">Add to Cart</button>
    `;

    div.querySelector(".add-btn").addEventListener("click", () => {
      addToCart(p.id);
    });

    productsContainer.appendChild(div);
  });
}

// ===============================
// Cart Functions
// ===============================
function addToCart(productId) {
  msgBox.innerText = "";

  const p = products.find((x) => x.id === productId);
  if (!p) return;

  const ex = cart.find((x) => x.id === productId);

  if (ex) ex.qty += 1;
  else cart.push({ ...p, qty: 1 });

  saveCart();
}

function openCart() {
  cartModal.style.display = "flex";
  renderCart();
}

function closeCartModal() {
  cartModal.style.display = "none";
}

function renderCart() {
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = `<p style="text-align:center;">Cart empty hai 😅</p>`;
  }

  cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-row";

    row.innerHTML = `
      <div>
        <b>${item.name}</b>
        <div>${formatMoney(item.price)} × ${item.qty}</div>
      </div>

      <div class="cart-actions">
        <button class="qty-btn minus">-</button>
        <button class="qty-btn plus">+</button>
        <button class="remove-btn">Remove</button>
      </div>
    `;

    row.querySelector(".minus").addEventListener("click", () => {
      item.qty -= 1;
      if (item.qty <= 0) {
        cart = cart.filter((x) => x.id !== item.id);
      }
      saveCart();
      renderCart();
    });

    row.querySelector(".plus").addEventListener("click", () => {
      item.qty += 1;
      saveCart();
      renderCart();
    });

    row.querySelector(".remove-btn").addEventListener("click", () => {
      cart = cart.filter((x) => x.id !== item.id);
      saveCart();
      renderCart();
    });

    cartItems.appendChild(row);
  });

  subtotalEl.innerText = formatMoney(getSubtotal());
  deliveryChargeEl.innerText = formatMoney(getDeliveryCharge());
  totalEl.innerText = formatMoney(getTotal());
}

// ===============================
// Place Order WhatsApp
// ===============================
function placeOrder() {
  msgBox.innerText = "";

  if (cart.length === 0) {
    msgBox.innerText = "Cart empty hai! Pehle product add karo.";
    return;
  }

  const name = customerNameEl.value.trim();
  const phone = customerPhoneEl.value.trim();
  const address = customerAddressEl.value.trim();
  const landmark = customerLandmarkEl.value.trim();

  if (!name || !phone || !address) {
    msgBox.innerText = "Name, Phone aur Address fill karo 🙏";
    return;
  }

  const subtotal = getSubtotal();
  if (subtotal < MIN_ORDER) {
    msgBox.innerText = `Minimum order ₹${MIN_ORDER} required 🙏`;
    return;
  }

  const delivery = getDeliveryCharge();
  const total = getTotal();
  const payment = paymentMethodEl.value;

  let msg = `🛒 *${SHOP_NAME}*%0A%0A`;
  msg += `👤 Name: ${name}%0A`;
  msg += `📞 Phone: ${phone}%0A`;
  msg += `📍 Area: ${deliveryAreaEl.value}%0A`;
  msg += `🏠 Address: ${address}%0A`;
  if (landmark) msg += `🧭 Landmark: ${landmark}%0A`;

  msg += `%0A🧾 *Order Items:*%0A`;
  cart.forEach((i) => {
    msg += `• ${i.name} (${i.qty}) = ${formatMoney(i.price * i.qty)}%0A`;
  });

  msg += `%0A--------------------%0A`;
  msg += `Subtotal: ${formatMoney(subtotal)}%0A`;
  msg += `Delivery: ${formatMoney(delivery)}%0A`;
  msg += `*Total: ${formatMoney(total)}*%0A`;
  msg += `--------------------%0A%0A`;

  if (payment === "UPI") {
    msg += `💳 Payment: UPI%0A`;
    msg += `UPI ID: ${UPI_ID}%0A`;
  } else {
    msg += `💵 Payment: Cash on Delivery (COD)%0A`;
  }

  msg += `%0A✅ Order Confirm kar do 🙏`;

  const url = `https://wa.me/91${WHATSAPP_NUMBER}?text=${msg}`;
  window.open(url, "_blank");
}

// ===============================
// Events
// ===============================
cartBtn.addEventListener("click", openCart);
closeCart.addEventListener("click", closeCartModal);

// Background click close
cartModal.addEventListener("click", (e) => {
  if (e.target === cartModal) {
    closeCartModal();
  }
});

deliveryAreaEl.addEventListener("change", renderCart);
placeOrderBtn.addEventListener("click", placeOrder);

callShopBtn.addEventListener("click", () => {
  window.open(`tel:+91${WHATSAPP_NUMBER}`);
});

searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);

// ===============================
// Init
// ===============================
updateCartCount();
renderCart();
loadProductsFromSheet();

// PWA Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
