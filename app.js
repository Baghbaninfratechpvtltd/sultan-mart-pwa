const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0DkCrsf4_AD96Kv9yaYNbMUUHpQtz59zkXH9f1T9mPI2pXB-OcXTR0pdO-9sgyarYD4pEp8nolt5R/pub?output=csv";

const SHOP_NAME = "Sultan Mart Bharatganj";
const WHATSAPP_NUMBER = "9559868648";
const MIN_ORDER = 199;
const UPI_ID = "9559868648@ptyes";

/* Delivery Rules */
const DELIVERY_CHARGE_OTHER = 20;

const productsGrid = document.getElementById("productsGrid");
const offersGrid = document.getElementById("offersGrid");
const searchInput = document.getElementById("searchInput");
const categoryButtonsWrap = document.getElementById("categoryButtons");
const allCatBtn = document.getElementById("allCatBtn");

const cartCount = document.getElementById("cartCount");
const cartItems = document.getElementById("cartItems");

const cartSubtotalEl = document.getElementById("cartSubtotal");
const deliveryChargeEl = document.getElementById("deliveryCharge");
const cartTotalEl = document.getElementById("cartTotal");

const whatsappOrderBtn = document.getElementById("whatsappOrderBtn");
const minOrderNote = document.getElementById("minOrderNote");

const deliveryAreaSelect = document.getElementById("deliveryArea");
const deliverySlotSelect = document.getElementById("deliverySlot");
const deliveryDaySelect = document.getElementById("deliveryDay");

const paymentMethodSelect = document.getElementById("paymentMethod");
const upiBox = document.getElementById("upiBox");

const custName = document.getElementById("custName");
const custMobile = document.getElementById("custMobile");
const custAddress = document.getElementById("custAddress");

const copyUpiBtn = document.getElementById("copyUpiBtn");

const cartDrawer = document.getElementById("cartDrawer");
const drawerOverlay = document.getElementById("drawerOverlay");
const cartOpenBtn = document.getElementById("cartOpenBtn");
const cartCloseBtn = document.getElementById("cartCloseBtn");

let ALL_PRODUCTS = [];
let FILTERED_PRODUCTS = [];
let ACTIVE_CATEGORY = "All";
let CART = JSON.parse(localStorage.getItem("sultan_cart") || "{}");

/* Save customer info */
function saveCustomer() {
  localStorage.setItem("cust_name", custName.value.trim());
  localStorage.setItem("cust_mobile", custMobile.value.trim());
  localStorage.setItem("cust_address", custAddress.value.trim());
  localStorage.setItem("delivery_area", deliveryAreaSelect.value);
  localStorage.setItem("delivery_slot", deliverySlotSelect.value);
  localStorage.setItem("delivery_day", deliveryDaySelect.value);
  localStorage.setItem("payment_method", paymentMethodSelect.value);
}

function loadCustomer() {
  custName.value = localStorage.getItem("cust_name") || "";
  custMobile.value = localStorage.getItem("cust_mobile") || "";
  custAddress.value = localStorage.getItem("cust_address") || "";
  deliveryAreaSelect.value = localStorage.getItem("delivery_area") || "Bharatganj";
  deliverySlotSelect.value = localStorage.getItem("delivery_slot") || "Morning";
  deliveryDaySelect.value = localStorage.getItem("delivery_day") || "Today";
  paymentMethodSelect.value = localStorage.getItem("payment_method") || "COD";
}

function safeNumber(v) {
  const n = Number(String(v).replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function formatMoney(n) {
  return `₹${Math.round(n)}`;
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const rows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cells = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const ch = line[j];

      if (ch === '"' && line[j + 1] === '"') {
        current += '"';
        j++;
      } else if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    rows.push(cells);
  }
  return rows;
}

async function loadProducts() {
  try {
    const res = await fetch(SHEET_CSV_URL);
    const csvText = await res.text();
    const rows = parseCSV(csvText);

    const headers = rows[0].map((h) => h.trim().toLowerCase());

    const idx = {
      id: headers.indexOf("id"),
      name: headers.indexOf("name"),
      category: headers.indexOf("category"),
      mrp: headers.indexOf("mrp"),
      discount: headers.indexOf("discount"),
      salePrice: headers.indexOf("sale price"),
      stock: headers.indexOf("stock"),
      image: headers.indexOf("image"),
    };

    if (idx.name === -1 || idx.category === -1 || idx.mrp === -1) {
      alert("❌ Sheet headers गलत हैं.\nRow1 में: ID, Name, Category, MRP, Discount, Sale Price, Stock, Image होना चाहिए.");
      return;
    }

    const products = [];

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length < 3) continue;

      const name = r[idx.name] || "";
      const category = r[idx.category] || "Other";
      const mrp = safeNumber(r[idx.mrp]);
      const discount = safeNumber(r[idx.discount] || 0);
      let sale = safeNumber(r[idx.salePrice] || 0);
      const stock = safeNumber(r[idx.stock] || 0);
      const image = (r[idx.image] || "").trim();

      if (!name) continue;

      if (!sale || sale <= 0) {
        sale = mrp - (mrp * discount) / 100;
      }

      products.push({
        id: (r[idx.id] || i).toString(),
        name,
        category,
        mrp,
        discount,
        salePrice: sale,
        stock,
        image: image || "https://i.ibb.co/2y0G8dJ/no-image.png",
      });
    }

    ALL_PRODUCTS = products;
    FILTERED_PRODUCTS = [...ALL_PRODUCTS];

    buildCategoryButtons();
    renderAll();
  } catch (err) {
    console.error(err);
    alert("❌ Products load नहीं हो रहे. Google Sheet publish/CSV link check करो.");
  }
}

function buildCategoryButtons() {
  const cats = [...new Set(ALL_PRODUCTS.map((p) => p.category))].sort();
  categoryButtonsWrap.innerHTML = "";

  cats.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "catBtn";
    btn.dataset.cat = cat;
    btn.textContent = cat;

    btn.addEventListener("click", () => {
      ACTIVE_CATEGORY = cat;
      document.querySelectorAll(".catBtn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      allCatBtn.classList.remove("active");
      filterProducts();
    });

    categoryButtonsWrap.appendChild(btn);
  });

  allCatBtn.addEventListener("click", () => {
    ACTIVE_CATEGORY = "All";
    document.querySelectorAll(".catBtn").forEach((b) => b.classList.remove("active"));
    allCatBtn.classList.add("active");
    filterProducts();
  });
}

function filterProducts() {
  const q = searchInput.value.trim().toLowerCase();

  FILTERED_PRODUCTS = ALL_PRODUCTS.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);

    const matchCat = ACTIVE_CATEGORY === "All" ? true : p.category === ACTIVE_CATEGORY;

    return matchSearch && matchCat;
  });

  renderAll();
}

function renderAll() {
  renderOffers();
  renderProducts();
  renderCart();
}

function renderOffers() {
  const offers = FILTERED_PRODUCTS.filter((p) => p.discount > 0).slice(0, 12);

  if (offers.length === 0) {
    offersGrid.innerHTML = `<div style="opacity:.7;font-weight:900;">No offers today.</div>`;
    return;
  }

  offersGrid.innerHTML = offers.map(productCardHTML).join("");
  bindAddButtons(offersGrid);
}

function renderProducts() {
  if (FILTERED_PRODUCTS.length === 0) {
    productsGrid.innerHTML = `<div style="opacity:.7;font-weight:900;">No products found.</div>`;
    return;
  }

  productsGrid.innerHTML = FILTERED_PRODUCTS.map(productCardHTML).join("");
  bindAddButtons(productsGrid);
}

function productCardHTML(p) {
  const showMrp = p.mrp > p.salePrice;
  const discountBadge = p.discount > 0 ? `<span class="badge">${p.discount}% OFF</span>` : "";

  const disabled = p.stock <= 0 ? "disabled" : "";

  return `
    <div class="card">
      <img class="cardImg" src="${p.image}" alt="${p.name}" loading="lazy" />
      <div class="cardBody">
        <div class="cardTitle">${p.name}</div>
        <div class="cardCat">${p.category}</div>

        <div class="priceRow">
          <div class="salePrice">${formatMoney(p.salePrice)}</div>
          ${showMrp ? `<div class="mrp">${formatMoney(p.mrp)}</div>` : ""}
          ${discountBadge}
        </div>

        <div class="stock">${p.stock > 0 ? `Stock: ${p.stock}` : "Out of stock ❌"}</div>

        <button class="addBtn" data-id="${p.id}" ${disabled}>
          ${p.stock > 0 ? "Add to Cart" : "Not Available"}
        </button>
      </div>
    </div>
  `;
}

function bindAddButtons(root) {
  root.querySelectorAll(".addBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      addToCart(btn.dataset.id);
    });
  });
}

function addToCart(id) {
  const p = ALL_PRODUCTS.find((x) => x.id === id);
  if (!p) return;

  if (p.stock <= 0) {
    alert("❌ ये product अभी available नहीं है");
    return;
  }

  CART[id] = (CART[id] || 0) + 1;
  saveCart();
  renderCart();
}

function changeQty(id, delta) {
  CART[id] = (CART[id] || 0) + delta;
  if (CART[id] <= 0) delete CART[id];
  saveCart();
  renderCart();
}

function saveCart() {
  localStorage.setItem("sultan_cart", JSON.stringify(CART));
}

function getDeliveryCharge(subtotal) {
  if (subtotal <= 0) return 0;
  return deliveryAreaSelect.value === "Bharatganj" ? 0 : DELIVERY_CHARGE_OTHER;
}

function toggleUPIBox() {
  if (paymentMethodSelect.value === "UPI") {
    upiBox.style.display = "block";
  } else {
    upiBox.style.display = "none";
  }
}

function renderCart() {
  const ids = Object.keys(CART);

  let subtotal = 0;
  let items = 0;

  if (ids.length === 0) {
    cartItems.innerHTML = `<p style="opacity:.7;font-weight:900;">Cart is empty.</p>`;
  } else {
    cartItems.innerHTML = ids.map((id) => {
      const p = ALL_PRODUCTS.find((x) => x.id === id);
      if (!p) return "";

      const qty = CART[id];
      const line = p.salePrice * qty;

      subtotal += line;
      items += qty;

      return `
        <div class="cartItem">
          <img src="${p.image}" alt="${p.name}" />
          <div class="cartItemInfo">
            <div class="cartItemName">${p.name}</div>
            <div class="cartItemPrice">${formatMoney(p.salePrice)}</div>

            <div class="qtyRow">
              <button class="qtyBtn" data-id="${id}" data-d="-1">-</button>
              <div class="qtyNum">${qty}</div>
              <button class="qtyBtn" data-id="${id}" data-d="1">+</button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    cartItems.querySelectorAll(".qtyBtn").forEach((b) => {
      b.addEventListener("click", () => {
        const id = b.dataset.id;
        const d = Number(b.dataset.d);
        changeQty(id, d);
      });
    });
  }

  const deliveryCharge = getDeliveryCharge(subtotal);
  const total = subtotal + deliveryCharge;

  cartSubtotalEl.textContent = formatMoney(subtotal);
  deliveryChargeEl.textContent = formatMoney(deliveryCharge);
  cartTotalEl.textContent = formatMoney(total);
  cartCount.textContent = items;

  if (subtotal > 0 && subtotal < MIN_ORDER) {
    minOrderNote.style.display = "block";
    minOrderNote.textContent = `Minimum order ₹${MIN_ORDER}. Add ₹${Math.ceil(MIN_ORDER - subtotal)} more.`;
  } else {
    minOrderNote.style.display = "none";
  }

  whatsappOrderBtn.onclick = () => {
    if (ids.length === 0) {
      alert("Cart खाली है 😅");
      return;
    }

    if (subtotal < MIN_ORDER) {
      alert(`Minimum order ₹${MIN_ORDER} है भाई 🙏`);
      return;
    }

    const name = custName.value.trim();
    const mobile = custMobile.value.trim();
    const address = custAddress.value.trim();

    if (!name || !mobile || mobile.length < 10 || !address) {
      alert("❌ कृपया Name, Mobile और Address जरूर भरें");
      return;
    }

    const area = deliveryAreaSelect.value;
    const slot = deliverySlotSelect.value;
    const day = deliveryDaySelect.value;
    const pay = paymentMethodSelect.value;

    saveCustomer();

    let msg = `🛒 *${SHOP_NAME}*%0A%0A`;

    msg += `👤 *Customer:* ${name}%0A`;
    msg += `📞 *Mobile:* ${mobile}%0A`;
    msg += `🏠 *Address:* ${address}%0A%0A`;

    msg += `📍 *Area:* ${area}%0A`;
    msg += `📅 *Delivery Day:* ${day}%0A`;
    msg += `⏰ *Slot:* ${slot}%0A`;
    msg += `💳 *Payment:* ${pay}%0A%0A`;

    msg += `*Order List:*%0A`;

    ids.forEach((id, i) => {
      const p = ALL_PRODUCTS.find((x) => x.id === id);
      const qty = CART[id];
      msg += `${i + 1}. ${p.name}  x${qty}  = ${formatMoney(p.salePrice * qty)}%0A`;
    });

    msg += `%0A*Subtotal:* ${formatMoney(subtotal)}%0A`;
    msg += `*Delivery Charge:* ${formatMoney(deliveryCharge)}%0A`;
    msg += `*Total:* ${formatMoney(total)}%0A%0A`;

    if (pay === "UPI") {
      msg += `💳 *UPI:* ${UPI_ID}%0A`;
      msg += `📸 Payment screenshot भेज दें 🙏`;
    } else {
      msg += `🚚 COD selected. Please keep cash ready 🙏`;
    }

    const waUrl = `https://wa.me/91${WHATSAPP_NUMBER}?text=${msg}`;// ✅ Cart Clear after Confirm
cart = [];
localStorage.setItem("cart", JSON.stringify(cart));
renderCart();
updateCartCount();
alert("✅ Order Confirmed! Cart cleared.");

    window.open(waUrl, "_blank");
  };
}

/* Drawer */
function openCart() {
  cartDrawer.classList.add("show");
  drawerOverlay.classList.add("show");
}
function closeCart() {
  cartDrawer.classList.remove("show");
  drawerOverlay.classList.remove("show");
}

cartOpenBtn.addEventListener("click", openCart);
cartCloseBtn.addEventListener("click", closeCart);
drawerOverlay.addEventListener("click", closeCart);

/* Search */
searchInput.addEventListener("input", filterProducts);

/* Delivery changes */
deliveryAreaSelect.addEventListener("change", () => { saveCustomer(); renderCart(); });
deliverySlotSelect.addEventListener("change", () => { saveCustomer(); renderCart(); });
deliveryDaySelect.addEventListener("change", () => { saveCustomer(); renderCart(); });

/* Payment */
paymentMethodSelect.addEventListener("change", () => {
  saveCustomer();
  toggleUPIBox();
});

/* Customer save */
custName.addEventListener("input", saveCustomer);
custMobile.addEventListener("input", saveCustomer);
custAddress.addEventListener("input", saveCustomer);

/* Copy UPI */
copyUpiBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(UPI_ID);
    copyUpiBtn.textContent = "Copied ✅";
    setTimeout(() => (copyUpiBtn.textContent = "Copy"), 1500);
  } catch (e) {
    alert("Copy नहीं हो पाया, manually copy कर लो: " + UPI_ID);
  }
});

/* PWA */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js").catch(console.error);
}

/* Load */
loadCustomer();
toggleUPIBox();
loadProducts();

