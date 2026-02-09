/* ==============================
   Sultan Mart Bharatganj - PWA
   Google Sheet → CSV → Products
   ============================== */

/* ✅ Your Google Sheet CSV URL */
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0DkCrsf4_AD96Kv9yaYNbMUUHpQtz59zkXH9f1T9mPI2pXB-OcXTR0pdO-9sgyarYD4pEp8nolt5R/pub?output=csv";

/* Shop Settings */
const SHOP_NAME = "Sultan Mart Bharatganj";
const WHATSAPP_NUMBER = "9559868648";
const MIN_ORDER = 199;
const UPI_ID = "9559868648@ptyes";

/* Elements */
const productsGrid = document.getElementById("productsGrid");
const offersGrid = document.getElementById("offersGrid");
const searchInput = document.getElementById("searchInput");
const categoryButtonsWrap = document.getElementById("categoryButtons");

const cartCount = document.getElementById("cartCount");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartItemsCount = document.getElementById("cartItemsCount");
const whatsappOrderBtn = document.getElementById("whatsappOrderBtn");
const minOrderNote = document.getElementById("minOrderNote");

const cartDrawer = document.getElementById("cartDrawer");
const drawerOverlay = document.getElementById("drawerOverlay");
const cartOpenBtn = document.getElementById("cartOpenBtn");
const cartCloseBtn = document.getElementById("cartCloseBtn");

/* State */
let ALL_PRODUCTS = [];
let FILTERED_PRODUCTS = [];
let ACTIVE_CATEGORY = "All";
let CART = JSON.parse(localStorage.getItem("sultan_cart") || "{}");

/* ==============================
   Helpers
   ============================== */

function safeNumber(v) {
  const n = Number(String(v).replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function formatMoney(n) {
  return `₹${Math.round(n)}`;
}

/* CSV Parser (simple) */
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

/* ==============================
   Fetch Products from Google Sheet
   ============================== */

async function loadProducts() {
  try {
    const res = await fetch(SHEET_CSV_URL);
    const csvText = await res.text();

    const rows = parseCSV(csvText);

    // headers
    const headers = rows[0].map((h) => h.trim().toLowerCase());

    // expected headers (your format)
    // ID, Name, Category, MRP, Discount, Sale Price, Stock, Image
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

      // If sale price missing → calculate
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

/* ==============================
   UI Render
   ============================== */

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
      filterProducts();
    });

    categoryButtonsWrap.appendChild(btn);
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
  // offers = discount > 0
  const offers = FILTERED_PRODUCTS.filter((p) => p.discount > 0).slice(0, 12);

  if (offers.length === 0) {
    offersGrid.innerHTML = `<div class="empty">No offers today.</div>`;
    return;
  }

  offersGrid.innerHTML = offers.map(productCardHTML).join("");
  bindAddButtons(offersGrid);
}

function renderProducts() {
  if (FILTERED_PRODUCTS.length === 0) {
    productsGrid.innerHTML = `<div class="empty">No products found.</div>`;
    return;
  }

  productsGrid.innerHTML = FILTERED_PRODUCTS.map(productCardHTML).join("");
  bindAddButtons(productsGrid);
}

function productCardHTML(p) {
  const showMrp = p.mrp > p.salePrice;
  const discountBadge = p.discount > 0 ? `<span class="badge">${p.discount}% OFF</span>` : "";

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

        <div class="stock">Stock: ${p.stock}</div>

        <button class="addBtn" data-id="${p.id}">Add to Cart</button>
      </div>
    </div>
  `;
}

function bindAddButtons(root) {
  root.querySelectorAll(".addBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      addToCart(id);
    });
  });
}

/* ==============================
   Cart
   ============================== */

function addToCart(id) {
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

function renderCart() {
  const ids = Object.keys(CART);

  let total = 0;
  let items = 0;

  if (ids.length === 0) {
    cartItems.innerHTML = `<p style="opacity:.7;font-weight:800;">Cart is empty.</p>`;
  } else {
    cartItems.innerHTML = ids.map((id) => {
      const p = ALL_PRODUCTS.find((x) => x.id === id);
      if (!p) return "";

      const qty = CART[id];
      const line = p.salePrice * qty;

      total += line;
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

  cartTotal.textContent = formatMoney(total);
  cartItemsCount.textContent = items;
  cartCount.textContent = items;

  // min order note
  if (total > 0 && total < MIN_ORDER) {
    minOrderNote.style.display = "block";
    minOrderNote.textContent = `Minimum order is ₹${MIN_ORDER}. Add ₹${Math.ceil(MIN_ORDER - total)} more.`;
  } else {
    minOrderNote.style.display = "none";
  }

  // WhatsApp button
  whatsappOrderBtn.onclick = () => {
    if (ids.length === 0) {
      alert("Cart खाली है 😅");
      return;
    }

    if (total < MIN_ORDER) {
      alert(`Minimum order ₹${MIN_ORDER} है भाई 🙏`);
      return;
    }

    let msg = `🛒 *${SHOP_NAME}*%0A%0A`;
    msg += `*Order List:*%0A`;

    ids.forEach((id, i) => {
      const p = ALL_PRODUCTS.find((x) => x.id === id);
      const qty = CART[id];
      msg += `${i + 1}. ${p.name}  x${qty}  = ${formatMoney(p.salePrice * qty)}%0A`;
    });

    msg += `%0A*Total:* ${formatMoney(total)}%0A`;
    msg += `%0A📍 Delivery: Bharatganj%0A`;
    msg += `%0A💳 UPI: ${UPI_ID}%0A`;

    const waUrl = `https://wa.me/91${WHATSAPP_NUMBER}?text=${msg}`;
    window.open(waUrl, "_blank");
  };
}

/* ==============================
   Drawer
   ============================== */

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

/* ==============================
   Search
   ============================== */
searchInput.addEventListener("input", filterProducts);

/* ==============================
   PWA Service Worker
   ============================== */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js").catch(console.error);
}

/* Start */
loadProducts();
