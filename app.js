// ===============================
// CONFIG
// ===============================
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0DkCrsf4_AD96Kv9yaYNbMUUHpQtz59zkXH9f1T9mPI2pXB-OcXTR0pdO-9sgyarYD4pEp8nolt5R/pub?output=csv";

const STORE_PHONE = "9559868648";
const STORE_UPI = "9559868648@paytm";
const MIN_ORDER = 199;
const OUTSIDE_DELIVERY_CHARGE = 20;

// ===============================
// STATE
// ===============================
let allProducts = [];
let filteredProducts = [];
let cart = {}; // {id: {product, qty}}
let activeCategory = "All";

// ===============================
// DOM
// ===============================
const productGrid = document.getElementById("productGrid");
const offerGrid = document.getElementById("offerGrid");
const offerEmpty = document.getElementById("offerEmpty");
const categoryRow = document.getElementById("categoryRow");

const searchInput = document.getElementById("searchInput");

const cartModal = document.getElementById("cartModal");
const openCartBtn = document.getElementById("openCartBtn");
const closeCartBtn = document.getElementById("closeCartBtn");

const cartItemsBox = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");

const itemsTotalEl = document.getElementById("itemsTotal");
const deliveryChargeEl = document.getElementById("deliveryCharge");
const grandTotalEl = document.getElementById("grandTotal");

const deliveryArea = document.getElementById("deliveryArea");
const paymentMethod = document.getElementById("paymentMethod");

const upiPayBox = document.getElementById("upiPayBox");
const upiPayLink = document.getElementById("upiPayLink");

const custName = document.getElementById("custName");
const custPhone = document.getElementById("custPhone");
const custAddress = document.getElementById("custAddress");
const custLocation = document.getElementById("custLocation");
const getLocationBtn = document.getElementById("getLocationBtn");

const whatsappOrderBtn = document.getElementById("whatsappOrderBtn");
const msgBox = document.getElementById("msgBox");

const upiIdBox = document.getElementById("upiIdBox");
const copyUpiBtn = document.getElementById("copyUpiBtn");

// ===============================
// HELPERS
// ===============================
function parseCSV(csvText){
  const rows = [];
  let current = "";
  let insideQuotes = false;
  const lines = [];

  for(let i=0;i<csvText.length;i++){
    const char = csvText[i];
    if(char === '"') insideQuotes = !insideQuotes;
    if(char === "\n" && !insideQuotes){
      lines.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if(current.trim() !== "") lines.push(current);

  for(const line of lines){
    const cols = [];
    let c = "";
    let q = false;
    for(let i=0;i<line.length;i++){
      const ch = line[i];
      if(ch === '"') q = !q;
      if(ch === "," && !q){
        cols.push(c.trim().replace(/^"|"$/g,""));
        c = "";
      } else {
        c += ch;
      }
    }
    cols.push(c.trim().replace(/^"|"$/g,""));
    rows.push(cols);
  }
  return rows;
}

function money(n){
  return `₹${Math.round(Number(n) || 0)}`;
}

function safeNum(v){
  const n = Number(String(v || "").replace(/[^\d.]/g,""));
  return isNaN(n) ? 0 : n;
}

function normalizeText(t){
  return String(t || "").trim().toLowerCase();
}

function discountPercent(mrp, sale){
  mrp = safeNum(mrp);
  sale = safeNum(sale);
  if(mrp <= 0 || sale <= 0) return 0;
  const p = Math.round(((mrp - sale) / mrp) * 100);
  return p > 0 ? p : 0;
}

function getDeliveryCharge(){
  return deliveryArea.value === "outside" ? OUTSIDE_DELIVERY_CHARGE : 0;
}

function getCartTotals(){
  let itemsTotal = 0;
  for(const id in cart){
    const it = cart[id];
    itemsTotal += safeNum(it.product.salePrice) * it.qty;
  }
  const del = getDeliveryCharge();
  const grand = itemsTotal + del;
  return {itemsTotal, del, grand};
}

// ===============================
// LOAD PRODUCTS
// ===============================
async function loadProducts(){
  productGrid.innerHTML = `<p class="emptyText">Loading products...</p>`;
  try{
    const res = await fetch(CSV_URL);
    const text = await res.text();
    const rows = parseCSV(text);

    // Expect header row:
    // ID | Name | Category | MRP | Discount | Sale Price | Stock | Image
    const header = rows[0].map(h => normalizeText(h));
    const idx = (name) => header.indexOf(normalizeText(name));

    const idI = idx("id");
    const nameI = idx("name");
    const catI = idx("category");
    const mrpI = idx("mrp");
    const discI = idx("discount");
    const saleI = idx("sale price");
    const stockI = idx("stock");
    const imgI = idx("image");

    const products = [];

    for(let i=1;i<rows.length;i++){
      const r = rows[i];
      if(!r || r.length < 2) continue;

      const id = r[idI] || `row-${i}`;
      const name = r[nameI] || "Unnamed";
      const category = r[catI] || "Other";
      const mrp = safeNum(r[mrpI]);
      const salePrice = safeNum(r[saleI]);
      const stock = safeNum(r[stockI]);
      const image = r[imgI] || "";

      let disc = safeNum(r[discI]);
      if(disc <= 0) disc = discountPercent(mrp, salePrice);

      products.push({
        id,
        name,
        category,
        mrp,
        discount: disc,
        salePrice,
        stock,
        image
      });
    }

    allProducts = products;
    filteredProducts = [...allProducts];

    renderCategories();
    renderOffers();
    renderProducts();

  }catch(err){
    productGrid.innerHTML = `<p class="emptyText">CSV Link Wrong / Sheet Not Public</p>`;
    console.error(err);
  }
}

// ===============================
// RENDER CATEGORIES
// ===============================
function renderCategories(){
  const cats = ["All", ...new Set(allProducts.map(p => p.category || "Other"))];

  categoryRow.innerHTML = "";
  cats.forEach(cat=>{
    const btn = document.createElement("button");
    btn.className = "cat-btn" + (cat === activeCategory ? " active" : "");
    btn.textContent = cat;

    btn.onclick = ()=>{
      activeCategory = cat;
      document.querySelectorAll(".cat-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      applyFilters();
    };

    categoryRow.appendChild(btn);
  });
}

// ===============================
// FILTER
// ===============================
function applyFilters(){
  const q = normalizeText(searchInput.value);

  filteredProducts = allProducts.filter(p=>{
    const matchSearch =
      normalizeText(p.name).includes(q) ||
      normalizeText(p.category).includes(q);

    const matchCat =
      activeCategory === "All" ? true : p.category === activeCategory;

    return matchSearch && matchCat;
  });

  renderOffers();
  renderProducts();
}

// ===============================
// RENDER OFFERS (TOP)
// ===============================
function renderOffers(){
  const offers = filteredProducts
    .filter(p => safeNum(p.discount) > 0 && safeNum(p.stock) > 0)
    .sort((a,b)=> safeNum(b.discount) - safeNum(a.discount))
    .slice(0, 12);

  offerGrid.innerHTML = "";

  if(offers.length === 0){
    offerEmpty.style.display = "block";
    return;
  }

  offerEmpty.style.display = "none";

  offers.forEach(p=>{
    const card = document.createElement("div");
    card.className = "today-card";

    card.innerHTML = `
      <img src="${p.image || "https://via.placeholder.com/400x300?text=No+Image"}" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
      <div class="today-title">${p.name}</div>
      <div class="today-price">${money(p.salePrice)}</div>
      <div class="offer-badge">${p.discount}% OFF</div>
      <button class="today-btn" ${p.stock<=0 ? "disabled":""}>Add to Cart</button>
    `;

    card.querySelector("button").onclick = ()=> addToCart(p.id);

    offerGrid.appendChild(card);
  });
}

// ===============================
// RENDER PRODUCTS
// ===============================
function renderProducts(){
  productGrid.innerHTML = "";

  if(filteredProducts.length === 0){
    productGrid.innerHTML = `<p class="emptyText">No products found.</p>`;
    return;
  }

  filteredProducts.forEach(p=>{
    const card = document.createElement("div");
    card.className = "product-card";

    const inStock = safeNum(p.stock) > 0;

    card.innerHTML = `
      <img class="p-img" src="${p.image || "https://via.placeholder.com/400x300?text=No+Image"}"
        onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">

      <div class="p-title">${p.name}</div>
      <div class="p-cat">${p.category}</div>

      <div class="p-price">
        ${p.mrp > 0 ? `<span class="old-price">${money(p.mrp)}</span>` : ""}
        <span class="new-price">${money(p.salePrice)}</span>
        ${p.discount > 0 ? `<span class="offText">${p.discount}% OFF</span>` : ""}
      </div>

      <div class="stockText ${inStock ? "stockIn":"stockOut"}">
        ${inStock ? `In Stock (${p.stock})` : "Out of Stock"}
      </div>

      <button class="add-btn" ${!inStock ? "disabled":""}>
        ${inStock ? "Add to Cart" : "Out of Stock"}
      </button>
    `;

    card.querySelector("button").onclick = ()=> addToCart(p.id);

    productGrid.appendChild(card);
  });
}

// ===============================
// CART
// ===============================
function addToCart(id){
  const p = allProducts.find(x=>x.id==id);
  if(!p) return;

  if(safeNum(p.stock) <= 0) return;

  if(!cart[id]){
    cart[id] = {product:p, qty:1};
  } else {
    cart[id].qty++;
  }

  updateCartUI();
}

function removeFromCart(id){
  delete cart[id];
  updateCartUI();
}

function changeQty(id, delta){
  if(!cart[id]) return;
  cart[id].qty += delta;
  if(cart[id].qty <= 0) delete cart[id];
  updateCartUI();
}

function updateCartUI(){
  // count
  let count = 0;
  for(const id in cart) count += cart[id].qty;
  cartCount.textContent = count;

  // render cart
  cartItemsBox.innerHTML = "";

  const ids = Object.keys(cart);
  if(ids.length === 0){
    cartItemsBox.innerHTML = `<p class="emptyText">Cart is empty.</p>`;
  } else {
    ids.forEach(id=>{
      const it = cart[id];
      const row = document.createElement("div");
      row.className = "cart-row";

      row.innerHTML = `
        <div>
          <h4>${it.product.name}</h4>
          <p>${money(it.product.salePrice)} × ${it.qty} = <b>${money(it.product.salePrice * it.qty)}</b></p>
        </div>

        <div class="cart-actions">
          <button class="qty-btn">+</button>
          <button class="qty-btn">-</button>
          <button class="remove-btn">Remove</button>
        </div>
      `;

      const btns = row.querySelectorAll("button");
      btns[0].onclick = ()=> changeQty(id, +1);
      btns[1].onclick = ()=> changeQty(id, -1);
      btns[2].onclick = ()=> removeFromCart(id);

      cartItemsBox.appendChild(row);
    });
  }

  // totals
  const t = getCartTotals();
  itemsTotalEl.textContent = money(t.itemsTotal);
  deliveryChargeEl.textContent = money(t.del);
  grandTotalEl.textContent = money(t.grand);

  // upi pay link
  updateUpiPayLink();
}

function updateUpiPayLink(){
  const t = getCartTotals();
  const total = t.grand;

  if(paymentMethod.value === "upi" && total > 0){
    upiPayBox.style.display = "block";

    // UPI deeplink
    const upiUrl =
      `upi://pay?pa=${encodeURIComponent(STORE_UPI)}` +
      `&pn=${encodeURIComponent("Sultan Mart Bharatganj")}` +
      `&am=${encodeURIComponent(total.toFixed(2))}` +
      `&cu=INR` +
      `&tn=${encodeURIComponent("Grocery Order Payment")}`;

    upiPayLink.href = upiUrl;
  } else {
    upiPayBox.style.display = "none";
    upiPayLink.href = "#";
  }
}

// ===============================
// LOCATION
// ===============================
getLocationBtn.onclick = ()=>{
  msgBox.textContent = "";
  if(!navigator.geolocation){
    msgBox.textContent = "Location not supported.";
    return;
  }

  getLocationBtn.textContent = "📍 Getting location...";
  navigator.geolocation.getCurrentPosition(
    (pos)=>{
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const link = `https://maps.google.com/?q=${lat},${lng}`;
      custLocation.value = link;
      getLocationBtn.textContent = "📍 Location Added ✅";
    },
    ()=>{
      getLocationBtn.textContent = "📍 Share Location";
      msgBox.textContent = "Location permission denied.";
    },
    {enableHighAccuracy:true, timeout:10000}
  );
};

// ===============================
// WHATSAPP ORDER
// ===============================
whatsappOrderBtn.onclick = ()=>{
  msgBox.textContent = "";

  const name = custName.value.trim();
  const phone = custPhone.value.trim();
  const address = custAddress.value.trim();
  const loc = custLocation.value.trim();

  if(Object.keys(cart).length === 0){
    msgBox.textContent = "Cart is empty.";
    return;
  }

  if(!name || !phone || phone.length < 10){
    msgBox.textContent = "Name & valid phone required.";
    return;
  }

  if(!address){
    msgBox.textContent = "Address required.";
    return;
  }

  const t = getCartTotals();

  if(t.itemsTotal < MIN_ORDER){
    msgBox.textContent = `Minimum order ₹${MIN_ORDER} required.`;
    return;
  }

  let itemsText = "";
  for(const id in cart){
    const it = cart[id];
    itemsText += `• ${it.product.name} × ${it.qty} = ${money(it.product.salePrice * it.qty)}\n`;
  }

  const payMethodText = paymentMethod.value === "upi" ? "UPI (Pay Now)" : "Cash on Delivery";

  const message =
`🛒 *New Order - Sultan Mart Bharatganj*

👤 *Customer Details*
Name: ${name}
Phone: ${phone}
Address: ${address}
Location: ${loc || "Not shared"}

📦 *Items*
${itemsText}

🧾 *Bill Summary*
Items Total: ${money(t.itemsTotal)}
Delivery Charge: ${money(t.del)}
Total Payable: ${money(t.grand)}

🚚 Delivery Area: ${deliveryArea.value === "outside" ? "Outside Bharatganj" : "Bharatganj"}
💳 Payment Method: ${payMethodText}

🙏 Please confirm order.`;

  const waUrl = `https://wa.me/91${STORE_PHONE}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, "_blank");
};

// ===============================
// EVENTS
// ===============================
searchInput.addEventListener("input", applyFilters);

openCartBtn.onclick = ()=>{
  cartModal.style.display = "flex";
  updateCartUI();
};

closeCartBtn.onclick = ()=>{
  cartModal.style.display = "none";
};

cartModal.onclick = (e)=>{
  if(e.target === cartModal){
    cartModal.style.display = "none";
  }
};

deliveryArea.onchange = ()=>{
  updateCartUI();
};

paymentMethod.onchange = ()=>{
  updateUpiPayLink();
};

copyUpiBtn.onclick = async ()=>{
  try{
    await navigator.clipboard.writeText(upiIdBox.value);
    copyUpiBtn.textContent = "Copied ✅";
    setTimeout(()=> copyUpiBtn.textContent="Copy", 1500);
  }catch{
    alert("Copy failed");
  }
};

// ===============================
// PWA (Service Worker)
// ===============================
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("service-worker.js");
}

// START
loadProducts();
