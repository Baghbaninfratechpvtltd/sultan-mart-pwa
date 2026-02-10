/* =========================================
   Sultan Mart Bharatganj - PWA Grocery App
   Full app.js (Copy-Paste)
   ========================================= */

/* -------------------------
   YOUR SETTINGS (EDIT ONLY)
   ------------------------- */

// Google Sheet CSV link (IMPORTANT)
// Your sheet must be PUBLIC and headers must be exactly:
// ID,Name,Category,MRP,Discount,Sale Price,Stock,Image

// ⚠️ Replace this with your actual sheet CSV link
const GOOGLE_SHEET_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0DkCrsf4_AD96Kv9yaYNbMUUHpQtz59zkXH9f1T9mPI2pXB-OcXTR0pdO-9sgyarYD4pEp8nolt5R/pub?output=csv";

// Shop details
const SHOP_NAME = "Sultan Mart Bharatganj";
const SHOP_PHONE = "9559868648";
const WHATSAPP_NUMBER = "9559868648";
const UPI_ID = "9559868648@ptyes";

// Delivery rules
const MIN_ORDER = 199;
const OTHER_AREA_CHARGE = 20;

// Delivery slots
const DELIVERY_SLOTS = [
  { value: "Morning (7 AM - 11 AM)", label: "Morning (7 AM - 11 AM)" },
  { value: "Afternoon (12 PM - 4 PM)", label: "Afternoon (12 PM - 4 PM)" },
  { value: "Evening (5 PM - 9 PM)", label: "Evening (5 PM - 9 PM)" },
];

// Delivery areas
const DELIVERY_AREAS = [
  { value: "Bharatganj", label: "Bharatganj (Free)", charge: 0 },
  { value: "Other", label: "Other Areas (₹20)", charge: OTHER_AREA_CHARGE },
];

/* -------------------------
   GLOBAL STATE
   ------------------------- */

let allProducts = [];
let filteredProducts = [];
let cart = [];
let selectedCategory = "All";

/* -------------------------
   HELPERS
   ------------------------- */

const qs = (s) => document.querySelector(s);
const qsa = (s) => document.querySelectorAll(s);

function rupee(n) {
  const num = Number(n || 0);
  return "₹" + Math.round(num);
}

function safeText(t) {
  return String(t || "").trim();
}

function parseNumber(v) {
  if (v === null || v === undefined) return 0;
  const x = String(v).replace(/[^\d.]/g, "");
  return Number(x || 0);
}

/* -------------------------
   CSV PARSER
   ------------------------- */

function csvToArray(csv) {
  const rows = [];
  let row = [];
  let col = "";
  let insideQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    const next = csv[i + 1];

    if (c === '"' && insideQuotes && next === '"') {
      col += '"';
      i++;
      continue;
    }

    if (c === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (c === "," && !insideQuotes) {
      row.push(col);
      col = "";
      continue;
    }

    if ((c === "\n" || c === "\r") && !insideQuotes) {
      if (col.length > 0 || row.length > 0) {
        row.push(col);
        rows.push(row);
      }
      row = [];
      col = "";
      continue;
    }

    col += c;
  }

  if (col.length > 0 || row.length > 0) {
    row.push(col);
    rows.push(row);
  }

  return rows;
}

/* -------------------------
   LOAD PRODUCTS FROM SHEET
   ------------------------- */

async function loadProducts() {
  qs("#loadingText").style.display = "block";
  qs("#loadingText").innerText = "Loading products from Google Sheet...";

  try {
    const url = GOOGLE_SHEET_CSV + "&_ts=" + Date.now();
    const res = await fetch(url);
    const csv = await res.text();

    const rows = csvToArray(csv);

    if (!rows || rows.length < 2) throw new Error("Sheet is empty.");

    const headers = rows[0].map((h) => safeText(h));

    const required = ["ID", "Name", "Category", "MRP", "Discount", "Sale Price", "Stock", "Image"];
    const missing = required.filter((r) => !headers.includes(r));

    if (missing.length) {
      throw new Error(
        "Sheet headers गलत हैं. Required headers:\n" +
          required.join(", ") +
          "\n\nMissing: " +
          missing.join(", ")
      );
    }

    const idx = {};
    headers.forEach((h, i) => (idx[h] = i));

    allProducts = rows.slice(1).map((r) => {
      const id = safeText(r[idx["ID"]]);
      const name = safeText(r[idx["Name"]]);
      const category = safeText(r[idx["Category"]]);
      const mrp = parseNumber(r[idx["MRP"]]);
      const discount = parseNumber(r[idx["Discount"]]);
      const sale = parseNumber(r[idx["Sale Price"]]);
      const stock = parseNumber(r[idx["Stock"]]);
      const image = safeText(r[idx["Image"]]);

      let salePrice = sale;
      if (!salePrice || salePrice <= 0) {
        if (discount > 0) salePrice = mrp - (mrp * discount) / 100;
        else salePrice = mrp;
      }

      return {
        id,
        name,
        category,
        mrp,
        discount,
        price: Math.round(salePrice),
        stock,
        image,
      };
    });

    allProducts = allProducts.filter((p) => p.id && p.name);
    filteredProducts = [...allProducts];

    renderCategories();
    renderProducts();
    updateCartUI();

    qs("#loadingText").style.display = "none";
  } catch (err) {
    qs("#loadingText").style.display = "block";
    qs("#loadingText").innerText = "❌ Error: " + err.message;
  }
}

/* -------------------------
   RENDER CATEGORIES
   ------------------------- */

function renderCategories() {
  const chipWrap = qs("#categoryChips");
  chipWrap.innerHTML = "";

  const cats = ["All", ...new Set(allProducts.map((p) => p.category))];

  cats.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "chip " + (cat === selectedCategory ? "active" : "");
    btn.innerText = cat;

    btn.onclick = () => {
      selectedCategory = cat;
      qsa(".chip").forEach((x) => x.classList.remove("active"));
      btn.classList.add("active");
      applyFilters();
    };

    chipWrap.appendChild(btn);
  });
}

/* -------------------------
   FILTERS
   ------------------------- */

function applyFilters() {
  const q = safeText(qs("#searchInput").value).toLowerCase();

  filteredProducts = allProducts.filter((p) => {
    const matchText =
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);

    const matchCat = selectedCategory === "All" ? true : p.category === selectedCategory;

    return matchText && matchCat;
  });

  renderProducts();
}

/* -------------------------
   RENDER PRODUCTS
   ------------------------- */

function renderProducts() {
  const grid = qs("#productGrid");
  grid.innerHTML = "";

  if (!filteredProducts.length) {
    grid.innerHTML = `<div style="padding:18px;font-weight:900;color:#444;">No products found.</div>`;
    return;
  }

  filteredProducts.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";

    const showOff = p.discount && p.discount > 0 && p.mrp > p.price;

    card.innerHTML = `
      <div class="imgbox">
        <img src="${p.image}" alt="${p.name}" onerror="this.src='https://dummyimage.com/600x400/f1f3f8/777&text=No+Image';">
      </div>

      <div class="content">
        <div class="p-name">${p.name}</div>
        <div class="p-cat">${p.category}</div>

        <div class="price-row">
          <div>
            <span class="p-price">${rupee(p.price)}</span>
            ${
              showOff
                ? `<span class="p-mrp">${rupee(p.mrp)}</span>`
                : ""
            }
          </div>
        </div>

        <div class="badges">
          ${
            showOff
              ? `<span class="badge off">${p.discount}% OFF</span>`
              : `<span class="badge">MRP</span>`
          }
          <span class="badge">Stock: ${p.stock}</span>
        </div>

        <button class="btn" ${
          p.stock <= 0 ? "disabled" : ""
        } onclick="addToCart('${p.id}')">
          ${p.stock <= 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    `;

    grid.appendChild(card);
  });
}

/* -------------------------
   CART FUNCTIONS
   ------------------------- */

function addToCart(id) {
  const p = allProducts.find((x) => x.id === id);
  if (!p) return;

  if (p.stock <= 0) {
    alert("Out of stock!");
    return;
  }

  const found = cart.find((c) => c.id === id);
  if (found) {
    if (found.qty + 1 > p.stock) {
      alert("Stock limit reached!");
      return;
    }
    found.qty += 1;
  } else {
    cart.push({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      mrp: p.mrp,
      img: p.image,
      qty: 1,
    });
  }

  updateCartUI();
}

function changeQty(id, delta) {
  const p = allProducts.find((x) => x.id === id);
  const c = cart.find((x) => x.id === id);
  if (!c) return;

  c.qty += delta;

  if (c.qty <= 0) {
    cart = cart.filter((x) => x.id !== id);
  } else {
    if (p && c.qty > p.stock) {
      c.qty = p.stock;
      alert("Max stock reached!");
    }
  }

  updateCartUI();
}

function removeItem(id) {
  cart = cart.filter((x) => x.id !== id);
  updateCartUI();
}

function cartCount() {
  return cart.reduce((sum, x) => sum + x.qty, 0);
}

function cartSubtotal() {
  return cart.reduce((sum, x) => sum + x.price * x.qty, 0);
}

function getDeliveryCharge() {
  const area = qs("#deliveryArea").value;
  const areaObj = DELIVERY_AREAS.find((a) => a.value === area);
  return areaObj ? areaObj.charge : OTHER_AREA_CHARGE;
}

function updateCartUI() {
  qs("#cartCount").innerText = cartCount();

  const list = qs("#cartItemsList");
  list.innerHTML = "";

  if (!cart.length) {
    list.innerHTML = `<div style="padding:10px;font-weight:900;color:#555;">Cart is empty.</div>`;
  } else {
    cart.forEach((item) => {
      const row = document.createElement("div");
      row.className = "cart-row";
      row.innerHTML = `
        <img src="${item.img}" onerror="this.src='https://dummyimage.com/600x400/f1f3f8/777&text=No+Image';">
        <div class="info">
          <div class="title">${item.name}</div>
          <div class="sub">${item.category} • ${rupee(item.price)} each</div>
        </div>

        <div class="qty">
          <button onclick="changeQty('${item.id}', -1)">-</button>
          <span>${item.qty}</span>
          <button onclick="changeQty('${item.id}', 1)">+</button>
        </div>

        <button class="remove" onclick="removeItem('${item.id}')">Remove</button>
      `;
      list.appendChild(row);
    });
  }

  const sub = cartSubtotal();
  const charge = getDeliveryCharge();
  const grand = sub + charge;

  qs("#billSubtotal").innerText = rupee(sub);
  qs("#billDelivery").innerText = charge === 0 ? "Free" : rupee(charge);
  qs("#billGrand").innerText = rupee(grand);

  qs("#callLink").href = "tel:" + SHOP_PHONE;
  qs("#upiText").innerText = UPI_ID;
}

/* -------------------------
   MODAL OPEN/CLOSE
   ------------------------- */

function openCart() {
  qs("#cartModal").classList.add("open");
}

function closeCart() {
  qs("#cartModal").classList.remove("open");
}

/* -------------------------
   COPY UPI
   ------------------------- */

function copyUPI() {
  navigator.clipboard.writeText(UPI_ID);
  alert("UPI ID Copied: " + UPI_ID);
}

/* -------------------------
   ORDER CONFIRM (WhatsApp)
   ------------------------- */

function buildOrderMessage() {
  const name = safeText(qs("#custName").value);
  const mobile = safeText(qs("#custMobile").value);
  const address = safeText(qs("#custAddress").value);

  const area = qs("#deliveryArea").value;
  const day = qs("#deliveryDay").value;
  const slot = qs("#deliverySlot").value;
  const payment = qs("#paymentMethod").value;

  const sub = cartSubtotal();
  const charge = getDeliveryCharge();
  const grand = sub + charge;

  let msg = `🛒 *${SHOP_NAME}*\n`;
  msg += `✅ *New Order Request*\n\n`;

  msg += `👤 Name: ${name}\n`;
  msg += `📞 Mobile: ${mobile}\n`;
  msg += `🏠 Address: ${address}\n\n`;

  msg += `🚚 Delivery Area: ${area}\n`;
  msg += `📅 Delivery Day: ${day}\n`;
  msg += `⏰ Time Slot: ${slot}\n\n`;

  msg += `💳 Payment: ${payment}\n`;
  if (payment === "UPI Payment") msg += `🧾 UPI ID: ${UPI_ID}\n`;
  msg += `\n`;

  msg += `🧺 *Items:*\n`;
  cart.forEach((x, i) => {
    msg += `${i + 1}. ${x.name}  x${x.qty}  = ${rupee(x.price * x.qty)}\n`;
  });

  msg += `\n📌 Subtotal: ${rupee(sub)}\n`;
  msg += `🚚 Delivery Charge: ${charge === 0 ? "Free" : rupee(charge)}\n`;
  msg += `💰 *Grand Total: ${rupee(grand)}*\n\n`;

  msg += `🙏 Please confirm my order.`;

  return msg;
}

function confirmOrder() {
  if (!cart.length) {
    alert("Cart is empty!");
    return;
  }

  const name = safeText(qs("#custName").value);
  const mobile = safeText(qs("#custMobile").value);
  const address = safeText(qs("#custAddress").value);

  if (!name || !mobile || !address) {
    alert("Please fill Name, Mobile, Address.");
    return;
  }

  if (mobile.length < 10) {
    alert("Mobile number सही डालो!");
    return;
  }

  const message = buildOrderMessage();
  const wa = `https://wa.me/91${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(wa, "_blank");

  alert("✅ Order Request Sent on WhatsApp!\n\nShop will confirm your order soon.");

  cart = [];
  updateCartUI();
  closeCart();

  qs("#custName").value = "";
  qs("#custMobile").value = "";
  qs("#custAddress").value = "";
}

/* -------------------------
   INIT DROPDOWNS
   ------------------------- */

function initDeliveryUI() {
  const areaSel = qs("#deliveryArea");
  areaSel.innerHTML = "";
  DELIVERY_AREAS.forEach((a) => {
    const opt = document.createElement("option");
    opt.value = a.value;
    opt.innerText = a.label;
    areaSel.appendChild(opt);
  });

  const daySel = qs("#deliveryDay");
  daySel.innerHTML = "";
  ["Today", "Tomorrow"].forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.innerText = d;
    daySel.appendChild(opt);
  });

  const slotSel = qs("#deliverySlot");
  slotSel.innerHTML = "";
  DELIVERY_SLOTS.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.value;
    opt.innerText = s.label;
    slotSel.appendChild(opt);
  });

  const paySel = qs("#paymentMethod");
  paySel.innerHTML = "";
  ["UPI Payment", "Cash on Delivery"].forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.innerText = p;
    paySel.appendChild(opt);
  });

  areaSel.addEventListener("change", () => updateCartUI());
}

/* -------------------------
   EVENT LISTENERS
   ------------------------- */

window.addEventListener("load", () => {
  qs("#openCartBtn").addEventListener("click", openCart);
  qs("#closeCartBtn").addEventListener("click", closeCart);

  qs("#copyUpiBtn").addEventListener("click", copyUPI);
  qs("#confirmOrderBtn").addEventListener("click", confirmOrder);

  qs("#searchInput").addEventListener("input", applyFilters);

  qs("#cartModal").addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) closeCart();
  });

  initDeliveryUI();
  loadProducts();
});

/* -------------------------
   MAKE FUNCTIONS GLOBAL
   ------------------------- */
window.addToCart = addToCart;
window.changeQty = changeQty;
window.removeItem = removeItem;
