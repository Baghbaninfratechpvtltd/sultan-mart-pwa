/***********************
 Sultan Mart - app.js
 Fully Copy Paste
***********************/

// ====== SETTINGS ======
const SHOP_NAME = "Sultan Mart Bharatganj";
const WHATSAPP_NUMBER = "919559868648"; // with country code
const CALL_NUMBER = "9559868648";
const MIN_ORDER = 199;
const UPI_ID = "9559868648@ptyes";

// ✅ YOUR GOOGLE SHEET CSV LINK
const GOOGLE_SHEET_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0DkCrsf4_AD96Kv9yaYNbMUUHpQtz59zkXH9f1T9mPI2pXB-OcXTR0pdO-9sgyarYD4pEp8nolt5R/pub?output=csv";

// ===== Delivery Charges (Area Wise) =====
const DELIVERY_AREAS = [
  { name: "Bharatganj (Free)", charge: 0 },
  { name: "Nearby 2-3 KM (₹20)", charge: 20 },
  { name: "Nearby 4-6 KM (₹40)", charge: 40 },
  { name: "Outside Area (₹60)", charge: 60 }
];

// ===== Delivery Day =====
const DELIVERY_DAYS = [
  "Today",
  "Tomorrow",
  "Day After Tomorrow"
];

// ===== Delivery Slot =====
const DELIVERY_SLOTS = [
  "Morning (7 AM - 11 AM)",
  "Afternoon (12 PM - 4 PM)",
  "Evening (5 PM - 10 PM)"
];

// ===== Payment Methods =====
const PAYMENT_METHODS = [
  "Cash on Delivery",
  "UPI (Pay First)",
  "UPI (Pay on Delivery)"
];

// ====== DOM ======
const productGrid = document.getElementById("productGrid");
const loadingText = document.getElementById("loadingText");
const searchInput = document.getElementById("searchInput");
const categoryChips = document.getElementById("categoryChips");

const openCartBtn = document.getElementById("openCartBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartModal = document.getElementById("cartModal");

const cartCount = document.getElementById("cartCount");
const cartItemsList = document.getElementById("cartItemsList");

const billSubtotal = document.getElementById("billSubtotal");
const billDelivery = document.getElementById("billDelivery");
const billGrand = document.getElementById("billGrand");

const custName = document.getElementById("custName");
const custMobile = document.getElementById("custMobile");
const custAddress = document.getElementById("custAddress");

const deliveryArea = document.getElementById("deliveryArea");
const deliveryDay = document.getElementById("deliveryDay");
const deliverySlot = document.getElementById("deliverySlot");
const paymentMethod = document.getElementById("paymentMethod");

const upiText = document.getElementById("upiText");
const copyUpiBtn = document.getElementById("copyUpiBtn");

const callLink = document.getElementById("callLink");
const confirmOrderBtn = document.getElementById("confirmOrderBtn");

// ====== STATE ======
let allProducts = [];
let filteredProducts = [];
let categories = ["All"];
let activeCategory = "All";
let cart = {}; // {id: qty}

// ====== HELPERS ======
function rupee(n){
  const num = Number(n || 0);
  return "₹" + num.toLocaleString("en-IN");
}

function safeText(t){
  return String(t || "").trim();
}

function toNumber(x){
  const n = Number(String(x || "").replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function parseCSV(text){
  // Simple CSV parser (handles commas inside quotes)
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;

  for(let i=0;i<text.length;i++){
    const ch = text[i];
    const next = text[i+1];

    if(ch === '"' && inQuotes && next === '"'){
      cur += '"';
      i++;
    } else if(ch === '"'){
      inQuotes = !inQuotes;
    } else if(ch === "," && !inQuotes){
      row.push(cur);
      cur = "";
    } else if((ch === "\n" || ch === "\r") && !inQuotes){
      if(cur.length || row.length){
        row.push(cur);
        rows.push(row);
      }
      row = [];
      cur = "";
    } else {
      cur += ch;
    }
  }
  if(cur.length || row.length){
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

// ====== LOAD DATA ======
async function loadProducts(){
  loadingText.style.display = "block";
  productGrid.innerHTML = "";

  try{
    // Cache busting so Google sheet change reflects
    const url = GOOGLE_SHEET_CSV + "&t=" + Date.now();

    const res = await fetch(url);
    const csv = await res.text();

    const rows = parseCSV(csv);
    const header = rows[0].map(h => h.trim().toLowerCase());

    // Expected headers
    // ID, Name, Category, MRP, Discount, Sale Price, Stock, Image
    const idx = (name) => header.indexOf(name.toLowerCase());

    const idI = idx("id");
    const nameI = idx("name");
    const catI = idx("category");
    const mrpI = idx("mrp");
    const discI = idx("discount");
    const saleI = idx("sale price");
    const stockI = idx("stock");
    const imgI = idx("image");

    if(nameI === -1 || catI === -1 || mrpI === -1){
      loadingText.innerText = "❌ Sheet headers गलत हैं. Row1 में सही headers चाहिए.";
      return;
    }

    const products = [];

    for(let r=1;r<rows.length;r++){
      const row = rows[r];
      if(!row || row.length < 3) continue;

      const id = safeText(row[idI]) || String(r);
      const name = safeText(row[nameI]);
      const category = safeText(row[catI]) || "Other";

      const mrp = toNumber(row[mrpI]);
      const discount = toNumber(row[discI]);
      let salePrice = toNumber(row[saleI]);

      // If sale price missing -> calculate
      if(!salePrice){
        salePrice = Math.round(mrp - (mrp * discount / 100));
      }

      const stock = toNumber(row[stockI]);
      const image = safeText(row[imgI]);

      if(!name) continue;

      products.push({
        id,
        name,
        category,
        mrp,
        discount,
        salePrice,
        stock,
        image
      });
    }

    // 🔥 Trending/Offer items top (discount desc)
    products.sort((a,b) => (b.discount || 0) - (a.discount || 0));

    allProducts = products;

    // Categories
    const catSet = new Set(["All"]);
    allProducts.forEach(p => catSet.add(p.category));
    categories = Array.from(catSet);

    buildCategoryChips();
    applyFilters();

    loadingText.style.display = "none";

  }catch(e){
    loadingText.innerText = "❌ Error loading sheet. Check publish link.";
  }
}

// ====== UI BUILD ======
function buildCategoryChips(){
  categoryChips.innerHTML = "";

  categories.forEach(cat=>{
    const btn = document.createElement("button");
    btn.className = "chip" + (cat === activeCategory ? " active" : "");
    btn.innerText = cat;
    btn.onclick = ()=>{
      activeCategory = cat;
      buildCategoryChips();
      applyFilters();
    };
    categoryChips.appendChild(btn);
  });
}

function applyFilters(){
  const q = safeText(searchInput.value).toLowerCase();

  filteredProducts = allProducts.filter(p=>{
    const matchCat = activeCategory === "All" ? true : p.category === activeCategory;
    const matchSearch = !q ? true : (p.name.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  renderProducts();
}

function renderProducts(){
  productGrid.innerHTML = "";

  if(filteredProducts.length === 0){
    productGrid.innerHTML = `<div style="padding:18px;font-weight:900;color:#444;">No products found.</div>`;
    return;
  }

  filteredProducts.forEach(p=>{
    const card = document.createElement("div");
    card.className = "card";

    const img = p.image ? p.image : "images/no-image.png";

    const outOfStock = p.stock <= 0;

    card.innerHTML = `
      <div class="imgbox">
        <img src="${img}" alt="${p.name}" onerror="this.src='images/no-image.png'" />
      </div>

      <div class="content">
        <div class="p-name">${p.name}</div>
        <div class="p-cat">${p.category}</div>

        <div class="price-row">
          <div>
            <span class="p-price">${rupee(p.salePrice)}</span>
            ${p.mrp > p.salePrice ? `<span class="p-mrp">${rupee(p.mrp)}</span>` : ""}
          </div>
        </div>

        <div class="badges">
          ${p.discount > 0 ? `<span class="badge off">${p.discount}% OFF</span>` : ""}
          ${outOfStock ? `<span class="badge out">Out of Stock</span>` : `<span class="badge stock">In Stock</span>`}
        </div>

        <button class="btn" ${outOfStock ? "disabled" : ""} data-id="${p.id}">
          ${outOfStock ? "Not Available" : "Add to Cart"}
        </button>
      </div>
    `;

    const btn = card.querySelector(".btn");
    if(!outOfStock){
      btn.onclick = ()=> addToCart(p.id);
    }

    productGrid.appendChild(card);
  });
}

// ====== CART ======
function addToCart(id){
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  updateCartUI();
}

function removeFromCart(id){
  delete cart[id];
  saveCart();
  updateCartUI();
}

function changeQty(id, delta){
  cart[id] = (cart[id] || 0) + delta;
  if(cart[id] <= 0) delete cart[id];
  saveCart();
  updateCartUI();
}

function getCartItems(){
  const items = [];
  Object.keys(cart).forEach(id=>{
    const p = allProducts.find(x => String(x.id) === String(id));
    if(p){
      items.push({ product:p, qty: cart[id] });
    }
  });
  return items;
}

function cartTotalQty(){
  return Object.values(cart).reduce((a,b)=>a+b,0);
}

function cartSubtotal(){
  const items = getCartItems();
  let sum = 0;
  items.forEach(i=>{
    sum += (i.product.salePrice * i.qty);
  });
  return sum;
}

function deliveryCharge(){
  const area = DELIVERY_AREAS[deliveryArea.selectedIndex] || DELIVERY_AREAS[0];
  return area.charge || 0;
}

function grandTotal(){
  return cartSubtotal() + deliveryCharge();
}

// ====== CART UI ======
function updateCartUI(){
  cartCount.innerText = cartTotalQty();

  const items = getCartItems();
  cartItemsList.innerHTML = "";

  if(items.length === 0){
    cartItemsList.innerHTML = `<div style="padding:10px;font-weight:900;color:#666;">Cart is empty.</div>`;
  } else {
    items.forEach(i=>{
      const p = i.product;
      const row = document.createElement("div");
      row.className = "cart-row";

      const img = p.image ? p.image : "images/no-image.png";

      row.innerHTML = `
        <img src="${img}" onerror="this.src='images/no-image.png'" />

        <div class="info">
          <div class="title">${p.name}</div>
          <div class="sub">${rupee(p.salePrice)} × ${i.qty} = ${rupee(p.salePrice*i.qty)}</div>
        </div>

        <div class="qty">
          <button title="Minus">−</button>
          <span>${i.qty}</span>
          <button title="Plus">+</button>
        </div>

        <button class="remove" title="Remove">✖</button>
      `;

      const minus = row.querySelectorAll(".qty button")[0];
      const plus = row.querySelectorAll(".qty button")[1];
      const remove = row.querySelector(".remove");

      minus.onclick = ()=> changeQty(p.id, -1);
      plus.onclick = ()=> changeQty(p.id, 1);
      remove.onclick = ()=> removeFromCart(p.id);

      cartItemsList.appendChild(row);
    });
  }

  // Bill
  billSubtotal.innerText = rupee(cartSubtotal());

  const d = deliveryCharge();
  billDelivery.innerText = d === 0 ? "Free" : rupee(d);

  billGrand.innerText = rupee(grandTotal());
}

// ====== MODAL ======
function openCart(){
  cartModal.classList.add("open");
  updateCartUI();
}

function closeCart(){
  cartModal.classList.remove("open");
}

// ====== FORM DROPDOWNS ======
function fillDropdowns(){
  // Area
  deliveryArea.innerHTML = "";
  DELIVERY_AREAS.forEach(a=>{
    const opt = document.createElement("option");
    opt.value = a.name;
    opt.innerText = a.name;
    deliveryArea.appendChild(opt);
  });

  // Day
  deliveryDay.innerHTML = "";
  DELIVERY_DAYS.forEach(d=>{
    const opt = document.createElement("option");
    opt.value = d;
    opt.innerText = d;
    deliveryDay.appendChild(opt);
  });

  // Slot
  deliverySlot.innerHTML = "";
  DELIVERY_SLOTS.forEach(s=>{
    const opt = document.createElement("option");
    opt.value = s;
    opt.innerText = s;
    deliverySlot.appendChild(opt);
  });

  // Payment
  paymentMethod.innerHTML = "";
  PAYMENT_METHODS.forEach(p=>{
    const opt = document.createElement("option");
    opt.value = p;
    opt.innerText = p;
    paymentMethod.appendChild(opt);
  });

  // UPI
  upiText.innerText = UPI_ID;

  // Call link
  callLink.href = "tel:" + CALL_NUMBER;
}

// ====== WHATSAPP ORDER ======
function buildWhatsAppMessage(){
  const items = getCartItems();
  if(items.length === 0) return "";

  const name = safeText(custName.value);
  const mobile = safeText(custMobile.value);
  const address = safeText(custAddress.value);

  const area = deliveryArea.value;
  const day = deliveryDay.value;
  const slot = deliverySlot.value;
  const pay = paymentMethod.value;

  let msg = `🛒 *New Order - ${SHOP_NAME}*\n\n`;

  msg += `👤 Name: ${name || "Not Given"}\n`;
  msg += `📞 Mobile: ${mobile || "Not Given"}\n`;
  msg += `🏠 Address: ${address || "Not Given"}\n\n`;

  msg += `📦 Delivery Area: ${area}\n`;
  msg += `📅 Day: ${day}\n`;
  msg += `⏰ Time Slot: ${slot}\n`;
  msg += `💳 Payment: ${pay}\n\n`;

  msg += `🧾 *Items:*\n`;

  items.forEach((i, idx)=>{
    msg += `${idx+1}) ${i.product.name}\n   ${rupee(i.product.salePrice)} × ${i.qty} = ${rupee(i.product.salePrice*i.qty)}\n`;
  });

  msg += `\nSubtotal: ${rupee(cartSubtotal())}\n`;

  const d = deliveryCharge();
  msg += `Delivery: ${d===0 ? "Free" : rupee(d)}\n`;

  msg += `*Grand Total: ${rupee(grandTotal())}*\n\n`;

  msg += `✅ Please confirm my order.`;

  return msg;
}

function confirmOrder(){
  const items = getCartItems();
  if(items.length === 0){
    alert("Cart is empty!");
    return;
  }

  const msg = buildWhatsAppMessage();
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

  // Open WhatsApp
  window.open(url, "_blank");

  // Clear cart after click
  cart = {};
  saveCart();
  updateCartUI();

  alert("✅ Order Confirmed! Cart cleared.");
  closeCart();
}

// ====== STORAGE ======
function saveCart(){
  localStorage.setItem("sultan_cart", JSON.stringify(cart));
}

function loadCart(){
  try{
    cart = JSON.parse(localStorage.getItem("sultan_cart") || "{}");
  }catch{
    cart = {};
  }
}

// ====== EVENTS ======
searchInput.addEventListener("input", applyFilters);

openCartBtn.onclick = openCart;
closeCartBtn.onclick = closeCart;

cartModal.addEventListener("click", (e)=>{
  if(e.target === cartModal) closeCart();
});

deliveryArea.addEventListener("change", updateCartUI);

copyUpiBtn.onclick = ()=>{
  navigator.clipboard.writeText(UPI_ID);
  copyUpiBtn.innerText = "Copied!";
  setTimeout(()=> copyUpiBtn.innerText = "Copy", 1200);
};

confirmOrderBtn.onclick = confirmOrder;

// ====== INIT ======
fillDropdowns();
loadCart();
updateCartUI();
loadProducts();
