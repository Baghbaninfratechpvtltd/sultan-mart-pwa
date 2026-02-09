// ===============================
// Sultan Mart Bharatganj - PWA
// Google Sheet + Images + Offers
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

// ===============================
// Data
// ===============================
let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let selectedCategory = "All";

// ===============================
// Elements (must exist in HTML)
// ===============================
const productsDiv = document.getElementById("products");
const categoriesDiv = document.getElementById("categories");
const todayOffersDiv = document.getElementById("todayOffers");

const searchInput = document.getElementById("searchInput");

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

// ===============================
// Helpers
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
  return cart.reduce((s, i) => s + i.finalPrice * i.qty, 0);
}

function getDeliveryCharge() {
  return DELIVERY_RULES[deliveryAreaEl.value] || 0;
}

function getTotal() {
  return getSubtotal() + getDeliveryCharge();
}

// ===============================
// CSV parser (comma safe)
// ===============================
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"' && line[i + 1] === '"') {
      current += '"';
      i++;
      continue;
    }

    if (ch === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (ch === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  result.push(current.trim());
  return result;
}

// ===============================
// Load Products from Google Sheet
// Required columns in Sheet:
// name,price,discount_price,offer_text,category,stock,today_offer,image
// ===============================
async function loadProductsFromSheet() {
  try {
    productsDiv.innerHTML = `<p style="padding:15px;font-weight:bold;">Loading products...</p>`;

    const res = await fetch(GOOGLE_SHEET_CSV, { cache: "no-store" });
    const csvText = await res.text();

    const lines = csvText.trim().split("\n");
    if (lines.length < 2) {
      productsDiv.innerHTML = `<p style="padding:15px;color:red;font-weight:bold;">Sheet empty है!</p>`;
      return;
    }

    const headers = parseCSVLine(lines[0]).map((h) =>
      h.trim().toLowerCase()
    );

    const getIndex = (name) => headers.indexOf(name);

    const idxName = getIndex("name");
    const idxPrice = getIndex("price");
    const idxDiscount = getIndex("discount_price");
    const idxOfferText = getIndex("offer_text");
    const idxCategory = getIndex("category");
    const idxStock = getIndex("stock");
    const idxToday = getIndex("today_offer");
    const idxImage = getIndex("image");

    if (idxName === -1 || idxPrice === -1 || idxCategory === -1) {
      productsDiv.innerHTML = `<p style="padding:15px;color:red;font-weight:bold;">
      Sheet headers गलत हैं!<br>
      Row1 में minimum: name, price, category होना चाहिए.
      </p>`;
      return;
    }

    const list = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);

      const name = (cols[idxName] || "").trim();
      if (!name) continue;

      const price = parseFloat((cols[idxPrice] || "0").trim());
      const discountPrice = parseFloat((cols[idxDiscount] || "").trim());

      const category = (cols[idxCategory] || "Others").trim() || "Others";
      const offerText = (cols[idxOfferText] || "").trim();

      const stockRaw = (cols[idxStock] || "in").trim().toLowerCase();
      const stock = stockRaw === "out" ? "out" : "in";

      const todayRaw = (cols[idxToday] || "no").trim().toLowerCase();
      const todayOffer = todayRaw === "yes";

      const image = (cols[idxImage] || "").trim();

      const finalPrice =
        !isNaN(discountPrice) && discountPrice > 0 && discountPrice < price
          ? discountPrice
          : price;

      list.push({
        id: i,
        name,
        price: isNaN(price) ? 0 : price,
        discount_price: isNaN(discountPrice) ? null : discountPrice,
        finalPrice,
        category,
        offer_text: offerText,
        stock,
        today_offer: todayOffer,
        image,
      });
    }

    products = list;

    renderCategories();
    renderTodayOffers();
    renderProducts();
  } catch (err) {
    console.log("Sheet Load Error:", err);
    productsDiv.innerHTML = `<p style="padding:15px;color:red;font-weight:bold;">
    Products load नहीं हो रहे. Publish to web + CSV check करो.
    </p>`;
  }
}

// ===============================
// Render Categories
// ===============================
function renderCategories() {
  const categories = ["All", ...new Set(products.map((p) => p.category))];

  categoriesDiv.innerHTML = "";

  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "cat-btn" + (cat === selectedCategory ? " active" : "");
    btn.innerText = cat;

    btn.onclick = () => {
      selectedCategory = cat;
      renderCategories();
      renderProducts();
    };

    categoriesDiv.appendChild(btn);
  });
}

// ===============================
// Render Today Offers
// ===============================
function renderTodayOffers() {
  const todayList = products.filter((p) => p.today_offer === true);

  todayOffersDiv.innerHTML = "";

  if (todayList.length === 0) {
    todayOffersDiv.innerHTML = `<div class="no-today">आज कोई Today Offer नहीं है</div>`;
    return;
  }

  todayList.forEach((p) => {
    const box = document.createElement("div");
    box.className = "today-card";

    box.innerHTML = `
      <div class="today-title">🔥 ${p.name}</div>
      <div class="today-price">${formatMoney(p.finalPrice)}</div>
      ${
        p.offer_text
          ? `<div class="today-offer">${p.offer_text}</div>`
          : ""
      }
      <button class="today-btn" ${
        p.stock === "out" ? "disabled" : ""
      } onclick="addToCart(${p.id})">
        ${p.stock === "out" ? "Out of Stock" : "Add"}
      </button>
    `;

    todayOffersDiv.appendChild(box);
  });
}

// ===============================
// Render Products
// ===============================
function renderProducts() {
  const q = (searchInput.value || "").trim().toLowerCase();

  let filtered = products.filter((p) => p.name.toLowerCase().includes(q));

  if (selectedCategory !== "All") {
    filtered = filtered.filter((p) => p.category === selectedCategory);
  }

  productsDiv.innerHTML = "";

  if (filtered.length === 0) {
    productsDiv.innerHTML = `<p style="padding:15px;font-weight:bold;">No products found 😅</p>`;
    return;
  }

  filtered.forEach((p) => {
    const showDiscount =
      p.discount_price &&
      p.discount_price > 0 &&
      p.discount_price < p.price;

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      ${
        p.image
          ? `<img class="p-img" src="${p.image}" alt="${p.name}" onerror="this.style.display='none'">`
          : `<div class="p-img-placeholder">No Image</div>`
      }

      <div class="p-title">${p.name}</div>
      <div class="p-cat">${p.category}</div>

      <div class="p-price">
        ${
          showDiscount
            ? `<span class="old-price">${formatMoney(p.price)}</span> 
               <span class="new-price">${formatMoney(p.finalPrice)}</span>`
            : `<span class="new-price">${formatMoney(p.finalPrice)}</span>`
        }
      </div>

      ${
        p.offer_text
          ? `<div class="offer-badge">${p.offer_text}</div>`
          : ""
      }

      ${
        p.stock === "out"
          ? `<div class="out-stock">Out of Stock</div>`
          : ""
      }

      <button class="add-btn" ${
        p.stock === "out" ? "disabled" : ""
      } onclick="addToCart(${p.id})">
        ${p.stock === "out" ? "Not Available" : "Add to Cart"}
      </button>
    `;

    productsDiv.appendChild(card);
  });
}

// ===============================
// Cart Functions
// ===============================
function addToCart(productId) {
  msgBox.innerText = "";

  const p = products.find((x) => x.id === productId);
  if (!p) return;

  if (p.stock === "out") return;

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
        <div>${formatMoney(item.finalPrice)} × ${item.qty}</div>
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
    msg += `• ${i.name} (${i.qty}) = ${formatMoney(i.finalPrice * i.qty)}%0A`;
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

cartModal.addEventListener("click", (e) => {
  if (e.target === cartModal) closeCartModal();
});

deliveryAreaEl.addEventListener("change", renderCart);
placeOrderBtn.addEventListener("click", placeOrder);

callShopBtn.addEventListener("click", () => {
  window.open(`tel:+91${WHATSAPP_NUMBER}`);
});

searchInput.addEventListener("input", renderProducts);

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
