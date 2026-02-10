// =========================
// SETTINGS
// =========================
const STORE = {
  name: "Sultan Mart Bharatganj",
  phone: "9559868648",
  whatsapp: "9559868648",
  upiId: "9559868648@paytm",
  minOrder: 199,
  deliveryFreeArea: "Bharatganj",
  deliveryChargeOther: 20
};

// Google Sheet CSV
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0DkCrsf4_AD96Kv9yaYNbMUUHpQtz59zkXH9f1T9mPI2pXB-OcXTR0pdO-9sgyarYD4pEp8nolt5R/pub?output=csv";

// fallback image
const FALLBACK_IMG = "assets/fallback.png";

// =========================
// DOM
// =========================
const offersGrid = document.getElementById("offersGrid");
const allGrid = document.getElementById("allGrid");
const chipsEl = document.getElementById("chips");
const searchInput = document.getElementById("searchInput");

const cartBtn = document.getElementById("cartBtn");
const cartModal = document.getElementById("cartModal");
const closeCart = document.getElementById("closeCart");
const cartItemsEl = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");

const billItems = document.getElementById("billItems");
const billDelivery = document.getElementById("billDelivery");
const billTotal = document.getElementById("billTotal");

const whatsappBtn = document.getElementById("whatsappBtn");
const clearCartBtn = document.getElementById("clearCartBtn");

const copyUpi = document.getElementById("copyUpi");
const upiIdInput = document.getElementById("upiId");

const upiLinkBox = document.getElementById("upiLinkBox");
const openUpiLink = document.getElementById("openUpiLink");

// =========================
// STATE
// =========================
let products = [];
let filteredCategory = "All";
let searchText = "";
let cart = JSON.parse(localStorage.getItem("cart_sultanmart") || "{}");

// =========================
// HELPERS
// =========================
function safeNum(v){
  const n = Number(String(v || "").replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function money(n){
  return `₹${Math.round(n)}`;
}

function imgFix(url){
  const u = (url || "").trim();
  if(!u) return FALLBACK_IMG;
  return u;
}

function saveCart(){
  localStorage.setItem("cart_sultanmart", JSON.stringify(cart));
}

function cartQtyTotal(){
  return Object.values(cart).reduce((a,b)=>a+b,0);
}

function cartItemsTotal(){
  let total = 0;
  for(const p of products){
    const qty = cart[p.id] || 0;
    if(qty > 0) total += p.price * qty;
  }
  return total;
}

function deliveryCharge(totalItems){
  // simple: if cart has items, show 0 (Bharatganj) in summary
  // customer location not asked, so we keep delivery as 0.
  // You can change later if needed.
  if(totalItems <= 0) return 0;
  return 0;
}

function escapeText(s){
  return String(s || "").replace(/[<>&"]/g, (c)=>({
    "<":"&lt;",
    ">":"&gt;",
    "&":"&amp;",
    "\"":"&quot;"
  }[c]));
}

// =========================
// CSV PARSE
// =========================
function parseCSV(text){
  const rows = [];
  let cur = "";
  let inQuotes = false;
  let row = [];

  for(let i=0;i<text.length;i++){
    const ch = text[i];
    const next = text[i+1];

    if(ch === '"' && next === '"'){
      cur += '"';
      i++;
      continue;
    }
    if(ch === '"'){
      inQuotes = !inQuotes;
      continue;
    }
    if(ch === "," && !inQuotes){
      row.push(cur);
      cur = "";
      continue;
    }
    if((ch === "\n" || ch === "\r") && !inQuotes){
      if(cur.length || row.length){
        row.push(cur);
        rows.push(row);
      }
      cur = "";
      row = [];
      continue;
    }
    cur += ch;
  }
  if(cur.length || row.length){
    row.push(cur);
    rows.push(row);
  }

  const headers = rows.shift().map(h => h.trim());
  return rows
    .filter(r => r.some(x => String(x).trim() !== ""))
    .map(r=>{
      const obj = {};
      headers.forEach((h,idx)=> obj[h] = (r[idx] || "").trim());
      return obj;
    });
}

// =========================
// LOAD PRODUCTS
// =========================
async function loadProducts(){
  const res = await fetch(CSV_URL, { cache: "no-store" });
  if(!res.ok) throw new Error("CSV not loading");
  const csvText = await res.text();
  const data = parseCSV(csvText);

  // Expected columns in sheet:
  // id, name, category, price, mrp, stock, image, offer, trending
  products = data.map((r, idx) => {
    const id = r.id?.trim() || String(idx+1);
    const price = safeNum(r.price);
    const mrp = safeNum(r.mrp);
    const stock = safeNum(r.stock);
    const offer = safeNum(r.offer);
    const trending = String(r.trending || "").toLowerCase().includes("yes") || offer > 0;

    return {
      id,
      name: r.name || "Unnamed",
      category: r.category || "Other",
      price,
      mrp,
      stock,
      image: imgFix(r.image),
      offer,
      trending
    };
  });
}

// =========================
// UI RENDER
// =========================
function getCategories(){
  const set = new Set(["All"]);
  products.forEach(p => set.add(p.category));
  return Array.from(set);
}

function renderChips(){
  const cats = getCategories();
  chipsEl.innerHTML = cats.map(cat=>{
    const active = cat === filteredCategory ? "active" : "";
    return `<button class="chip ${active}" data-cat="${escapeText(cat)}">${escapeText(cat)}</button>`;
  }).join("");

  chipsEl.querySelectorAll(".chip").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      filteredCategory = btn.dataset.cat;
      renderAll();
    });
  });
}

function productMatch(p){
  const catOk = (filteredCategory === "All" || p.category === filteredCategory);
  const text = searchText.trim().toLowerCase();
  const textOk = !text || p.name.toLowerCase().includes(text) || p.category.toLowerCase().includes(text);
  return catOk && textOk;
}

function productCard(p){
  const off = p.offer > 0 ? `<span class="offBadge">${p.offer}% OFF</span>` : "";
  const mrp = p.mrp > 0 && p.mrp > p.price ? `<span class="mrp">${money(p.mrp)}</span>` : "";
  const stockTxt = p.stock > 0 ? `Stock: ${p.stock}` : `Out of Stock`;

  const disabled = p.stock <= 0 ? "disabled" : "";
  const btnText = p.stock <= 0 ? "Out of Stock" : "Add to Cart";

  return `
    <div class="card">
      <img class="cardImg" src="${escapeText(p.image)}" alt="${escapeText(p.name)}"
        onerror="this.src='${FALLBACK_IMG}'"
      />
      <div class="cardBody">
        <div class="cat">${escapeText(p.category)}</div>
        <h3 class="title">${escapeText(p.name)}</h3>

        <div class="priceRow">
          <div>
            <div class="price">${money(p.price)} ${mrp}</div>
          </div>
          ${off}
        </div>

        <div class="stock">${stockTxt}</div>

        <button class="addBtn" ${disabled} onclick="addToCart('${p.id}')">${btnText}</button>
      </div>
    </div>
  `;
}

function renderOffers(){
  const list = products.filter(p => p.trending).filter(productMatch);
  offersGrid.innerHTML = list.map(productCard).join("") || `<p class="small">No offers found.</p>`;
}

function renderAllProducts(){
  const list = products.filter(p => !p.trending).filter(productMatch);
  allGrid.innerHTML = list.map(productCard).join("") || `<p class="small">No products found.</p>`;
}

function renderAll(){
  renderChips();
  renderOffers();
  renderAllProducts();
  updateCartCount();
}

// =========================
// CART
// =========================
window.addToCart = function(id){
  const p = products.find(x => x.id === id);
  if(!p) return;

  if(p.stock <= 0) return;

  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  updateCartCount();
};

function updateCartCount(){
  cartCount.textContent = cartQtyTotal();
}

function openCart(){
  renderCart();
  cartModal.classList.remove("hidden");
}

function closeCartModal(){
  cartModal.classList.add("hidden");
}

function renderCart(){
  const items = [];
  for(const p of products){
    const qty = cart[p.id] || 0;
    if(qty > 0){
      items.push({p, qty});
    }
  }

  if(items.length === 0){
    cartItemsEl.innerHTML = `<p class="small">Your cart is empty.</p>`;
  } else {
    cartItemsEl.innerHTML = items.map(({p, qty})=>{
      return `
        <div class="cartRow">
          <div class="cartLeft">
            <div class="cartName">${escapeText(p.name)}</div>
            <div class="cartEach">${money(p.price)} each</div>
          </div>

          <div class="qtyBox">
            <button class="qBtn" onclick="decQty('${p.id}')">-</button>
            <div class="qty">${qty}</div>
            <button class="qBtn" onclick="incQty('${p.id}')">+</button>
          </div>

          <div class="cartPrice">${money(p.price * qty)}</div>
        </div>
      `;
    }).join("");
  }

  // Bill
  const itemsTotal = cartItemsTotal();
  const del = deliveryCharge(itemsTotal);
  const total = itemsTotal + del;

  billItems.textContent = money(itemsTotal);
  billDelivery.textContent = money(del);
  billTotal.textContent = money(total);
}

window.incQty = function(id){
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  updateCartCount();
  renderCart();
};

window.decQty = function(id){
  cart[id] = (cart[id] || 0) - 1;
  if(cart[id] <= 0) delete cart[id];
  saveCart();
  updateCartCount();
  renderCart();
};

// =========================
// WHATSAPP ORDER
// =========================
function getSelectedPayment(){
  const v = document.querySelector("input[name='pay']:checked")?.value || "cod";
  return v;
}

function buildWhatsAppMessage(){
  const items = [];
  for(const p of products){
    const qty = cart[p.id] || 0;
    if(qty > 0){
      items.push(`• ${p.name} x${qty} = ${money(p.price * qty)}`);
    }
  }

  const itemsTotal = cartItemsTotal();
  const del = deliveryCharge(itemsTotal);
  const total = itemsTotal + del;

  const pay = getSelectedPayment();
  const payText = pay === "upi" ? `UPI (Pay Now)` : `COD (Cash on Delivery)`;

  return `
🛒 *New Order - Sultan Mart Bharatganj*

${items.join("\n")}

🧾 *Bill Summary*
Items Total: ${money(itemsTotal)}
Delivery: ${money(del)}
*Grand Total: ${money(total)}*

💳 Payment: *${payText}*
📞 Contact: ${STORE.phone}

✅ Please confirm my order.
`.trim();
}

function openWhatsApp(){
  if(cartQtyTotal() === 0){
    alert("Cart is empty!");
    return;
  }

  const total = cartItemsTotal();
  if(total < STORE.minOrder){
    alert(`Minimum order is ₹${STORE.minOrder}`);
    return;
  }

  const msg = buildWhatsAppMessage();
  const url = `https://wa.me/91${STORE.whatsapp}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

// =========================
// UPI LINK
// =========================
function openUpi(){
  const total = cartItemsTotal();
  if(total <= 0){
    alert("Cart is empty!");
    return;
  }

  // UPI deep link
  const upi = STORE.upiId;
  const payee = encodeURIComponent(STORE.name);
  const am = encodeURIComponent(Math.round(total));
  const link = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${payee}&am=${am}&cu=INR`;

  window.location.href = link;
}

// =========================
// EVENTS
// =========================
cartBtn.addEventListener("click", openCart);
closeCart.addEventListener("click", closeCartModal);

cartModal.addEventListener("click", (e)=>{
  if(e.target === cartModal) closeCartModal();
});

searchInput.addEventListener("input", ()=>{
  searchText = searchInput.value;
  renderAll();
});

whatsappBtn.addEventListener("click", ()=>{
  openWhatsApp();
});

clearCartBtn.addEventListener("click", ()=>{
  cart = {};
  saveCart();
  updateCartCount();
  renderCart();
});

copyUpi.addEventListener("click", async ()=>{
  try{
    await navigator.clipboard.writeText(upiIdInput.value);
    copyUpi.textContent = "Copied!";
    setTimeout(()=> copyUpi.textContent="Copy", 1200);
  }catch(e){
    alert("Copy not supported on this browser.");
  }
});

document.querySelectorAll("input[name='pay']").forEach(r=>{
  r.addEventListener("change", ()=>{
    const pay = getSelectedPayment();
    if(pay === "upi"){
      upiLinkBox.classList.remove("hidden");
    } else {
      upiLinkBox.classList.add("hidden");
    }
  });
});

openUpiLink.addEventListener("click", openUpi);

// =========================
// INIT
// =========================
(async function init(){
  try{
    await loadProducts();
    renderAll();
    updateCartCount();
  }catch(err){
    console.log(err);
    offersGrid.innerHTML = `<p class="small">CSV Link Wrong / Sheet Not Public</p>`;
    allGrid.innerHTML = `<p class="small">CSV Link Wrong / Sheet Not Public</p>`;
  }
})();
