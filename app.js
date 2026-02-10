// ==========================
// Sultan Mart PWA - FIXED FINAL
// ==========================

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0DkCrsf4_AD96Kv9yaYNbMUUHpQtz59zkXH9f1T9mPI2pXB-OcXTR0pdO-9sgyarYD4pEp8nolt5R/pub?output=csv";

const STORE_PHONE = "9559868648";
const STORE_UPI = "9559868648@paytm";

// Elements
const searchInput = document.getElementById("searchInput");
const categoryRow = document.getElementById("categoryRow");

const offersGrid = document.getElementById("offersGrid");
const productsGrid = document.getElementById("productsGrid");

const openCartBtn = document.getElementById("openCartBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartModal = document.getElementById("cartModal");
const cartItemsEl = document.getElementById("cartItems");
const cartCountEl = document.getElementById("cartCount");

const deliveryArea = document.getElementById("deliveryArea");
const deliveryDay = document.getElementById("deliveryDay");
const deliverySlot = document.getElementById("deliverySlot");

const paymentMethod = document.getElementById("paymentMethod");
const upiPayBox = document.getElementById("upiPayBox");
const upiPayLink = document.getElementById("upiPayLink");

const billSubtotal = document.getElementById("billSubtotal");
const billDelivery = document.getElementById("billDelivery");
const billTotal = document.getElementById("billTotal");

const custName = document.getElementById("custName");
const custPhone = document.getElementById("custPhone");
const custAddress = document.getElementById("custAddress");

const whatsappBtn = document.getElementById("whatsappBtn");
const clearCartBtn = document.getElementById("clearCartBtn");

const copyUpiBtn = document.getElementById("copyUpiBtn");
document.getElementById("upiText").innerText = STORE_UPI;
document.getElementById("upiText2").innerText = STORE_UPI;

// Location
const shareLocationBtn = document.getElementById("shareLocationBtn");
const locationText = document.getElementById("locationText");
let customerLocation = "";

// Data
let allProducts = [];
let filteredProducts = [];
let selectedCategory = "All";

// Cart
let cart = JSON.parse(localStorage.getItem("cart_v2") || "{}");

// ==========================
// Helpers
// ==========================
function money(n) {
  return "₹" + Math.round(Number(n || 0));
}
function safeNum(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}
function getDiscountPercent(mrp, sale) {
  mrp = safeNum(mrp);
  sale = safeNum(sale);
  if (mrp <= 0) return 0;
  const p = Math.round(((mrp - sale) / mrp) * 100);
  return p > 0 ? p : 0;
}
function saveCart() {
  localStorage.setItem("cart_v2", JSON.stringify(cart));
}
function getCartCount() {
  let c = 0;
  for (const id in cart) c += cart[id];
  return c;
}
function getDeliveryCharge() {
  return deliveryArea.value === "outside" ? 20 : 0;
}
function calcSubtotal() {
  let sum = 0;
  for (const id in cart) {
    const qty = cart[id];
    const p = allProducts.find((x) => String(x.id) === String(id));
    if (!p) continue;
    sum += safeNum(p.salePrice) * qty;
  }
  return sum;
}
function calcTotal() {
  return calcSubtotal() + getDeliveryCharge();
}

// ==========================
// CSV Fetch
// ==========================
async function fetchProducts() {
  const res = await fetch(SHEET_CSV_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("CSV Link Wrong / Sheet Not Public");

  const text = await res.text();
  const rows = parseCSV(text);

  const products = rows
    .filter((r) => r.length >= 3)
    .slice(1)
    .map((r) => {
      const id = r[0]?.trim();
      const name = r[1]?.trim() || "Unnamed";
      const category = r[2]?.trim() || "Other";
      const mrp = safeNum(r[3]);
      const salePrice = safeNum(r[5] || r[3]);
      const stock = safeNum(r[6]);
      const image = (r[7] || "").trim();

      return {
        id,
        name,
        category,
        mrp,
        salePrice,
        stock,
        image,
        discountPercent: getDiscountPercent(mrp, salePrice),
      };
    });

  allProducts = products;
  filteredProducts = [...products];
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inside = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && inside && next === '"') {
      cur += '"';
      i++;
    } else if (ch === '"') {
      inside = !inside;
    } else if (ch === "," && !inside) {
      row.push(cur);
      cur = "";
    } else if (ch === "\n" && !inside) {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else if (ch !== "\r") {
      cur += ch;
    }
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

// ==========================
// UI
// ==========================
function buildCategories() {
  const cats = ["All", ...new Set(allProducts.map((p) => p.category))];

  categoryRow.innerHTML = "";
  cats.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "catBtn" + (cat === selectedCategory ? " active" : "");
    btn.innerText = cat;
    btn.onclick = () => {
      selectedCategory = cat;
      buildCategories();
      applyFilters();
    };
    categoryRow.appendChild(btn);
  });
}

function applyFilters() {
  const q = searchInput.value.trim().toLowerCase();

  filteredProducts = allProducts.filter((p) => {
    const matchCat = selectedCategory === "All" || p.category === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  renderProducts();
}

function renderProducts() {
  const offers = filteredProducts
    .filter((p) => p.discountPercent > 0)
    .sort((a, b) => b.discountPercent - a.discountPercent);

  const all = [...filteredProducts].sort((a, b) => a.name.localeCompare(b.name));

  offersGrid.innerHTML = "";
  productsGrid.innerHTML = "";

  if (offers.length === 0) {
    offersGrid.innerHTML = `<div style="color:#64748b;font-size:13px;padding:8px;">No offers found.</div>`;
  } else {
    offers.forEach((p) => offersGrid.appendChild(productCard(p)));
  }

  all.forEach((p) => productsGrid.appendChild(productCard(p)));

  updateCartCount();
}

function productCard(p) {
  const card = document.createElement("div");
  card.className = "card";

  const img = document.createElement("img");
  img.className = "pimg";
  img.src = p.image || "./assets/no-image.png";
  img.alt = p.name;
  img.loading = "lazy";

  const name = document.createElement("div");
  name.className = "pname";
  name.innerText = p.name;

  const cat = document.createElement("div");
  cat.className = "pcat";
  cat.innerText = p.category;

  const priceRow = document.createElement("div");
  priceRow.className = "priceRow";

  const sale = document.createElement("div");
  sale.className = "sale";
  sale.innerText = money(p.salePrice);

  const mrp = document.createElement("div");
  mrp.className = "mrp";
  mrp.innerText = p.mrp > 0 && p.mrp !== p.salePrice ? money(p.mrp) : "";

  const off = document.createElement("div");
  off.className = "offBadge";
  off.innerText = p.discountPercent > 0 ? `${p.discountPercent}% OFF` : "";

  priceRow.appendChild(sale);
  priceRow.appendChild(mrp);
  if (p.discountPercent > 0) priceRow.appendChild(off);

  const stock = document.createElement("div");
  stock.className = "stock";
  stock.innerText = p.stock > 0 ? `Stock: ${p.stock}` : "Out of Stock";

  const btn = document.createElement("button");
  btn.className = "addBtn";
  btn.innerText = p.stock > 0 ? "Add to Cart" : "Out of Stock";
  btn.disabled = p.stock <= 0;

  btn.onclick = () => addToCart(p.id);

  card.appendChild(img);
  card.appendChild(name);
  card.appendChild(cat);
  card.appendChild(priceRow);
  card.appendChild(stock);
  card.appendChild(btn);

  return card;
}

// ==========================
// Cart
// ==========================
function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  updateCartCount();
}

function removeFromCart(id) {
  if (!cart[id]) return;
  cart[id]--;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  updateCartCount();
  renderCart();
}

function addQty(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  updateCartCount();
  renderCart();
}

function updateCartCount() {
  cartCountEl.innerText = getCartCount();
}

function openCart() {
  cartModal.classList.add("show");
  renderCart();
}

function closeCart() {
  cartModal.classList.remove("show");
}

function renderCart() {
  cartItemsEl.innerHTML = "";
  const ids = Object.keys(cart);

  if (ids.length === 0) {
    cartItemsEl.innerHTML = `<div style="padding:14px;color:#64748b;">Cart is empty.</div>`;
    updateBill();
    return;
  }

  ids.forEach((id) => {
    const p = allProducts.find((x) => String(x.id) === String(id));
    if (!p) return;

    const qty = cart[id];

    const row = document.createElement("div");
    row.className = "cartRow";

    const left = document.createElement("div");
    left.innerHTML = `<div class="cartName">${p.name}</div>
                      <div class="cartEach">${money(p.salePrice)} each</div>`;

    const qtyBox = document.createElement("div");
    qtyBox.className = "qtyBox";

    const minus = document.createElement("button");
    minus.className = "qtyBtn";
    minus.innerText = "-";
    minus.onclick = () => removeFromCart(id);

    const val = document.createElement("div");
    val.className = "qtyVal";
    val.innerText = qty;

    const plus = document.createElement("button");
    plus.className = "qtyBtn";
    plus.innerText = "+";
    plus.onclick = () => addQty(id);

    qtyBox.appendChild(minus);
    qtyBox.appendChild(val);
    qtyBox.appendChild(plus);

    const price = document.createElement("div");
    price.className = "cartPrice";
    price.innerText = money(p.salePrice * qty);

    row.appendChild(left);
    row.appendChild(qtyBox);
    row.appendChild(price);

    cartItemsEl.appendChild(row);
  });

  updateBill();
}

function updateBill() {
  const subtotal = calcSubtotal();
  const delivery = getDeliveryCharge();
  const total = subtotal + delivery;

  billSubtotal.innerText = money(subtotal);
  billDelivery.innerText = money(delivery);
  billTotal.innerText = money(total);

  updateUpiLink();
}

// ==========================
// UPI Auto Amount (WORKING)
// ==========================
function updateUpiLink() {
  const total = calcTotal();

  // IMPORTANT: UPI link works on MOBILE only (UPI apps)
  const upiUrl =
    `upi://pay?pa=${encodeURIComponent(STORE_UPI)}` +
    `&pn=${encodeURIComponent("Sultan Mart")}` +
    `&am=${encodeURIComponent(Math.round(total))}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent("Sultan Mart Order")}`;

  upiPayLink.href = upiUrl;
  upiPayLink.innerText = `💸 Pay Now (${money(total)})`;
}

// ==========================
// WhatsApp
// ==========================
function makeOrderMessage() {
  const ids = Object.keys(cart);
  const subtotal = calcSubtotal();
  const delivery = getDeliveryCharge();
  const total = subtotal + delivery;

  let msg = `🛒 *New Order - Sultan Mart Bharatganj*%0A%0A`;

  msg += `👤 Name: ${custName.value || "-"}%0A`;
  msg += `📞 Mobile: ${custPhone.value || "-"}%0A`;
  msg += `🏠 Address: ${custAddress.value || "-"}%0A`;
  msg += `📍 Location: ${customerLocation || "Not shared"}%0A%0A`;

  msg += `🚚 Area: ${deliveryArea.value === "free" ? "Bharatganj (Free)" : "Outside (+₹20)"}%0A`;
  msg += `📅 Day: ${deliveryDay.value}%0A`;
  msg += `⏰ Slot: ${deliverySlot.value}%0A`;
  msg += `💳 Payment: ${paymentMethod.value === "upi" ? "UPI" : "COD"}%0A%0A`;

  msg += `📦 *Items:*%0A`;

  ids.forEach((id) => {
    const p = allProducts.find((x) => String(x.id) === String(id));
    if (!p) return;
    const qty = cart[id];
    msg += `• ${p.name} x${qty} = ${money(p.salePrice * qty)}%0A`;
  });

  msg += `%0A🧾 Subtotal: ${money(subtotal)}%0A`;
  msg += `🚚 Delivery: ${money(delivery)}%0A`;
  msg += `💰 Total: *${money(total)}*%0A%0A`;

  msg += `✅ Please confirm my order.`;

  return msg;
}

function confirmOnWhatsApp() {
  if (getCartCount() === 0) {
    alert("Cart is empty!");
    return;
  }

  if (!custPhone.value.trim()) {
    alert("Please enter mobile number!");
    return;
  }

  const msg = makeOrderMessage();
  const url = `https://wa.me/91${STORE_PHONE}?text=${msg}`;
  window.open(url, "_blank");
}

// ==========================
// Location Share (WORKING)
// ==========================
function shareLocation() {
  if (!navigator.geolocation) {
    alert("Location not supported!");
    return;
  }

  shareLocationBtn.innerText = "📍 Getting location...";
  shareLocationBtn.disabled = true;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      customerLocation = `https://maps.google.com/?q=${lat},${lon}`;
      locationText.innerText = "Location: Shared ✅";
      shareLocationBtn.innerText = "📍 Location Shared";
      shareLocationBtn.disabled = false;
    },
    () => {
      customerLocation = "";
      locationText.innerText = "Location: Not shared";
      shareLocationBtn.innerText = "📍 Share Location";
      shareLocationBtn.disabled = false;
      alert("Location permission denied!");
    },
    { enableHighAccuracy: true, timeout: 15000 }
  );
}

// ==========================
// Events
// ==========================
openCartBtn.onclick = openCart;
closeCartBtn.onclick = closeCart;

cartModal.onclick = (e) => {
  if (e.target === cartModal) closeCart();
};

searchInput.addEventListener("input", applyFilters);

deliveryArea.addEventListener("change", updateBill);

paymentMethod.addEventListener("change", () => {
  if (paymentMethod.value === "upi") {
    upiPayBox.style.display = "block";
    updateUpiLink();
  } else {
    upiPayBox.style.display = "none";
  }
  updateBill();
});

whatsappBtn.onclick = confirmOnWhatsApp;

clearCartBtn.onclick = () => {
  cart = {};
  saveCart();
  renderCart();
  updateCartCount();
  alert("Cart cleared!");
};

copyUpiBtn.onclick = async () => {
  try {
    await navigator.clipboard.writeText(STORE_UPI);
    alert("UPI copied!");
  } catch {
    alert("Copy failed!");
  }
};

shareLocationBtn.onclick = shareLocation;

// ==========================
// INIT
// ==========================
(async function init() {
  try {
    await fetchProducts();
    buildCategories();
    applyFilters();
    renderCart();
    updateCartCount();
  } catch (err) {
    console.error(err);
    alert(err.message || "Error loading products!");
  }
})();
