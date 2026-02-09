// ===============================
// 1) SETTINGS
// ===============================

// Google Sheet Published URL (pubhtml)
const publicSpreadsheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0DkCrsf4_AD96Kv9yaYNbMUUHpQtz59zkXH9f1T9mPI2pXB-OcXTR0pdO-9sgyarYD4pEp8nolt5R/pubhtml";

// WhatsApp Number
const WHATSAPP_NUMBER = "919559868648";

// Call Number
const CALL_NUMBER = "919559868648";

// UPI Settings
const UPI_ID = "9559868648@ptyes";
const SHOP_NAME = "Sultan Mart Bharatganj";

// ===============================
// 2) GLOBALS
// ===============================
let ALL_PRODUCTS = [];
let FILTERED_PRODUCTS = [];
let ACTIVE_CATEGORY = "All";

let CART = JSON.parse(localStorage.getItem("SM_CART") || "{}");

// ===============================
// 3) HELPERS
// ===============================
function saveCart() {
  localStorage.setItem("SM_CART", JSON.stringify(CART));
}

function getCartCount() {
  return Object.values(CART).reduce((a, b) => a + b, 0);
}

function money(n) {
  n = Number(n || 0);
  return `₹${n}`;
}

function safeText(t) {
  return String(t || "").trim();
}

function toNumber(v) {
  const n = Number(String(v || "").replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
}

// ===============================
// 4) LOAD GOOGLE SHEET
// ===============================
function init() {
  Tabletop.init({
    key: publicSpreadsheetUrl,
    simpleSheet: true
  }).then((data) => {

    ALL_PRODUCTS = data.map((row) => {
      const mrp = toNumber(row.MRP);
      const discount = toNumber(row.Discount);
      const sale = toNumber(row["Sale Price"]);

      // अगर Sale Price खाली है तो auto calculate
      let finalSale = sale;
      if (!finalSale && mrp > 0 && discount > 0) {
        finalSale = Math.round(mrp - (mrp * discount / 100));
      }
      if (!finalSale && mrp > 0) finalSale = mrp;

      return {
        id: safeText(row.ID),
        name: safeText(row.Name),
        category: safeText(row.Category),
        mrp: mrp,
        discount: discount,
        salePrice: finalSale,
        stock: toNumber(row.Stock),
        image: safeText(row.Image)
      };
    }).filter(p => p.id && p.name);

    FILTERED_PRODUCTS = [...ALL_PRODUCTS];

    renderCategories();
    renderOffers();
    renderProducts();
    updateCartUI();

  }).catch((err) => {
    console.error("Sheet Load Error:", err);
    document.getElementById("productsGrid").innerHTML =
      `<div class="msg">Google Sheet load nahi ho rahi. Publish link check karo.</div>`;
  });
}

// ===============================
// 5) RENDER CATEGORIES
// ===============================
function renderCategories() {
  const catRow = document.getElementById("catRow");

  const cats = ["All", ...new Set(ALL_PRODUCTS.map(p => p.category).filter(Boolean))];

  catRow.innerHTML = "";

  cats.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "cat-btn" + (cat === ACTIVE_CATEGORY ? " active" : "");
    btn.innerText = cat;

    btn.onclick = () => {
      ACTIVE_CATEGORY = cat;

      document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      applyFilters();
    };

    catRow.appendChild(btn);
  });
}

// ===============================
// 6) SEARCH + FILTER
// ===============================
document.getElementById("searchInput").addEventListener("input", () => {
  applyFilters();
});

function applyFilters() {
  const q = safeText(document.getElementById("searchInput").value).toLowerCase();

  FILTERED_PRODUCTS = ALL_PRODUCTS.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);

    const matchCat =
      ACTIVE_CATEGORY === "All" ? true : (p.category === ACTIVE_CATEGORY);

    return matchSearch && matchCat;
  });

  renderProducts();
}

// ===============================
// 7) RENDER OFFERS
// ===============================
function renderOffers() {
  const offersGrid = document.getElementById("offersGrid");

  const offers = ALL_PRODUCTS
    .filter(p => p.discount > 0 && p.stock > 0)
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 12);

  offersGrid.innerHTML = "";

  if (offers.length === 0) {
    offersGrid.innerHTML = `<div class="sub">No offers available.</div>`;
    return;
  }

  offers.forEach((p) => {
    const card = document.createElement("div");
    card.className = "today-card";

    card.innerHTML = `
      <div class="today-title">${p.name}</div>
      <div class="today-price">${money(p.salePrice)}</div>
      <div class="today-offer">${p.discount}% OFF</div>
      <button class="today-btn" ${p.stock <= 0 ? "disabled" : ""}>Add to Cart</button>
    `;

    card.querySelector("button").onclick = () => addToCart(p.id);

    offersGrid.appendChild(card);
  });
}

// ===============================
// 8) RENDER PRODUCTS
// ===============================
function renderProducts() {
  const grid = document.getElementById("productsGrid");
  grid.innerHTML = "";

  if (FILTERED_PRODUCTS.length === 0) {
    grid.innerHTML = `<div class="msg">No products found.</div>`;
    return;
  }

  FILTERED_PRODUCTS.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";

    let imgHTML = "";
    if (p.image) {
      imgHTML = `<img class="p-img" src="${p.image}" alt="${p.name}" onerror="this.style.display='none'">`;
    } else {
      imgHTML = `<div class="p-img-placeholder">No Image</div>`;
    }

    const showOffer = p.discount > 0 && p.salePrice < p.mrp;
    const offerHTML = showOffer ? `<div class="offer-badge">${p.discount}% OFF</div>` : "";
    const outStockHTML = p.stock <= 0 ? `<div class="out-stock">Out of Stock</div>` : "";

    card.innerHTML = `
      ${imgHTML}
      <div class="p-title">${p.name}</div>
      <div class="p-cat">${p.category}</div>

      <div class="p-price">
        ${showOffer ? `<span class="old-price">${money(p.mrp)}</span>` : ""}
        <span class="new-price">${money(p.salePrice)}</span>
      </div>

      ${offerHTML}
      ${outStockHTML}

      <button class="add-btn" ${p.stock <= 0 ? "disabled" : ""}>
        Add to Cart
      </button>
    `;

    card.querySelector(".add-btn").onclick = () => addToCart(p.id);

    grid.appendChild(card);
  });
}

// ===============================
// 9) CART FUNCTIONS
// ===============================
function addToCart(productId) {
  CART[productId] = (CART[productId] || 0) + 1;
  saveCart();
  updateCartUI();
}

function removeFromCart(productId) {
  delete CART[productId];
  saveCart();
  updateCartUI();
}

function changeQty(productId, delta) {
  CART[productId] = (CART[productId] || 0) + delta;

  if (CART[productId] <= 0) {
    delete CART[productId];
  }

  saveCart();
  updateCartUI();
}

function updateCartUI() {
  document.getElementById("cartCount").innerText = getCartCount();
  renderCartModal();
}

// ===============================
// 10) CART MODAL
// ===============================
function renderCartModal() {
  const cartItems = document.getElementById("cartItems");

  const ids = Object.keys(CART);
  cartItems.innerHTML = "";

  if (ids.length === 0) {
    cartItems.innerHTML = `<div class="msg">Cart is empty</div>`;
    document.getElementById("subtotal").innerText = money(0);
    document.getElementById("deliveryFee").innerText = money(0);
    document.getElementById("totalBill").innerText = money(0);
    return;
  }

  let subtotal = 0;

  ids.forEach((id) => {
    const qty = CART[id];
    const p = ALL_PRODUCTS.find(x => x.id === id);
    if (!p) return;

    const price = p.salePrice || p.mrp;
    const lineTotal = price * qty;
    subtotal += lineTotal;

    const row = document.createElement("div");
    row.className = "cart-row";

    row.innerHTML = `
      <div>
        <div style="font-weight:900">${p.name}</div>
        <div class="sub">${money(price)} × ${qty} = ${money(lineTotal)}</div>
      </div>

      <div class="cart-actions">
        <button class="qty-btn" onclick="changeQty('${id}', 1)">+ Add</button>
        <button class="qty-btn" onclick="changeQty('${id}', -1)">- Minus</button>
        <button class="remove-btn" onclick="removeFromCart('${id}')">Remove</button>
      </div>
    `;

    cartItems.appendChild(row);
  });

  let delivery = 0;
  if (subtotal < 199) delivery = 20;

  const total = subtotal + delivery;

  document.getElementById("subtotal").innerText = money(subtotal);
  document.getElementById("deliveryFee").innerText = money(delivery);
  document.getElementById("totalBill").innerText = money(total);
}

// ===============================
// 11) MODAL OPEN/CLOSE
// ===============================
const cartModal = document.getElementById("cartModal");

document.getElementById("openCartBtn").onclick = () => {
  cartModal.style.display = "flex";
};

document.getElementById("closeCartBtn").onclick = () => {
  cartModal.style.display = "none";
};

cartModal.addEventListener("click", (e) => {
  if (e.target === cartModal) cartModal.style.display = "none";
});

// ===============================
// 12) WHATSAPP ORDER
// ===============================
document.getElementById("placeOrderBtn").addEventListener("click", () => {
  const name = safeText(document.getElementById("custName").value);
  const phone = safeText(document.getElementById("custPhone").value);
  const address = safeText(document.getElementById("custAddress").value);

  const msgBox = document.getElementById("msgBox");
  msgBox.innerText = "";

  if (!name || !phone || !address) {
    msgBox.innerText = "Please fill Name, Phone, Address.";
    return;
  }

  const ids = Object.keys(CART);
  if (ids.length === 0) {
    msgBox.innerText = "Cart is empty.";
    return;
  }

  let text = `🛒 *Sultan Mart Bharatganj Order*\n\n`;
  text += `👤 Name: ${name}\n`;
  text += `📞 Phone: ${phone}\n`;
  text += `🏠 Address: ${address}\n\n`;
  text += `🧾 *Items:*\n`;

  let subtotal = 0;

  ids.forEach((id, index) => {
    const qty = CART[id];
    const p = ALL_PRODUCTS.find(x => x.id === id);
    if (!p) return;

    const price = p.salePrice || p.mrp;
    const lineTotal = price * qty;
    subtotal += lineTotal;

    text += `${index + 1}. ${p.name} × ${qty} = ${money(lineTotal)}\n`;
  });

  let delivery = 0;
  if (subtotal < 199) delivery = 20;

  const total = subtotal + delivery;

  text += `\nSubtotal: ${money(subtotal)}`;
  text += `\nDelivery: ${money(delivery)}`;
  text += `\n*Total: ${money(total)}*`;

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  window.open(waUrl, "_blank");
});

// ===============================
// 13) CALL BUTTON
// ===============================
document.getElementById("callBtn").addEventListener("click", () => {
  window.location.href = `tel:${CALL_NUMBER}`;
});

// ===============================
// 14) UPI PAYMENT BUTTON
// ===============================
document.getElementById("payUpiBtn").addEventListener("click", () => {

  const ids = Object.keys(CART);
  if (ids.length === 0) {
    alert("Cart is empty");
    return;
  }

  let subtotal = 0;

  ids.forEach((id) => {
    const qty = CART[id];
    const p = ALL_PRODUCTS.find(x => x.id === id);
    if (!p) return;

    const price = p.salePrice || p.mrp;
    subtotal += price * qty;
  });

  let delivery = 0;
  if (subtotal < 199) delivery = 20;

  const total = subtotal + delivery;

  const upiUrl =
    `upi://pay?pa=${encodeURIComponent(UPI_ID)}` +
    `&pn=${encodeURIComponent(SHOP_NAME)}` +
    `&am=${encodeURIComponent(total)}` +
    `&cu=INR`;

  window.location.href = upiUrl;
});

// ===============================
// 15) START
// ===============================
window.addEventListener("DOMContentLoaded", init);
