const SHOP_NAME = "Sultan Mart Bharatganj";
const WHATSAPP_NUMBER = "9559868648";
const UPI_ID = "9559868648@ptyes";
const MIN_ORDER = 199;

const DELIVERY_RULES = {
  "Bharatganj (Free)": 0,
  "Nearby (₹10)": 10,
  "Far (₹20)": 20
};

// 50 Products (Fixed Price)
// ✅ Sultan Mart - Products Google Sheet CSV
const GOOGLE_SHEET_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0DkCrsf4_AD96Kv9yaYNbMUUHpQtz59zkXH9f1T9mPI2pXB-OcXTR0pdO-9sgyarYD4pEp8nolt5R/pub?output=csv";

let products = []; // products अब sheet से आएंगे

// ✅ CSV Loader
async function loadProductsFromSheet() {
  try {
    const res = await fetch(GOOGLE_SHEET_CSV, { cache: "no-store" });
    const csvText = await res.text();

    const rows = csvText.trim().split("\n").map(r => r.split(","));

    // headers: name, price, category
    const headers = rows[0].map(h => h.trim().toLowerCase());

    const nameIndex = headers.indexOf("name");
    const priceIndex = headers.indexOf("price");
    const categoryIndex = headers.indexOf("category");

    const list = [];

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];

      const name = (cols[nameIndex] || "").trim();
      const price = parseFloat((cols[priceIndex] || "0").trim());
      const category = (cols[categoryIndex] || "Others").trim();

      if (!name) continue;

      list.push({
        id: i,
        name,
        price: isNaN(price) ? 0 : price,
        category: category || "Others",
      });
    }

    products = list;

   loadProductsFromSheet();
    
  } catch (err) {
    alert("Products load nahi ho rahe. Sheet publish check karo!");
    console.log(err);
  }
}
// CART
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Elements
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

// Utils
function formatMoney(n){ return "₹" + Number(n).toFixed(0); }

function saveCart(){
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount(){
  cartCount.innerText = cart.reduce((s,i)=>s+i.qty,0);
}

function getSubtotal(){
  return cart.reduce((s,i)=>s+(i.price*i.qty),0);
}

function getDeliveryCharge(){
  return DELIVERY_RULES[deliveryAreaEl.value] || 0;
}

function getTotal(){
  return getSubtotal() + getDeliveryCharge();
}

// Render products
function renderProducts(list){
  productsContainer.innerHTML = "";
  list.forEach(p=>{
    const div = document.createElement("div");
    div.className = "product-card";
    div.innerHTML = `
      <h3>${p.name}</h3>
      <p class="category">${p.category}</p>
      <p class="price">${formatMoney(p.price)}</p>
      <button class="add-btn">Add to Cart</button>
    `;
    div.querySelector(".add-btn").addEventListener("click", ()=>{
      addToCart(p.id);
    });
    productsContainer.appendChild(div);
  });
}

function addToCart(id){
  msgBox.innerText = "";
  const p = products.find(x=>x.id===id);
  if(!p) return;

  const ex = cart.find(x=>x.id===id);
  if(ex) ex.qty += 1;
  else cart.push({...p, qty:1});

  saveCart();
}

// Cart modal
function openCart(){
  cartModal.style.display = "flex";
  renderCart();
}

function closeCartModal(){
  cartModal.style.display = "none";
}

function renderCart(){
  cartItems.innerHTML = "";

  if(cart.length===0){
    cartItems.innerHTML = `<p style="text-align:center;">Cart empty hai 😅</p>`;
  }

  cart.forEach(item=>{
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

    row.querySelector(".minus").addEventListener("click", ()=>{
      item.qty -= 1;
      if(item.qty<=0){
        cart = cart.filter(x=>x.id!==item.id);
      }
      saveCart();
      renderCart();
    });

    row.querySelector(".plus").addEventListener("click", ()=>{
      item.qty += 1;
      saveCart();
      renderCart();
    });

    row.querySelector(".remove-btn").addEventListener("click", ()=>{
      cart = cart.filter(x=>x.id!==item.id);
      saveCart();
      renderCart();
    });

    cartItems.appendChild(row);
  });

  subtotalEl.innerText = formatMoney(getSubtotal());
  deliveryChargeEl.innerText = formatMoney(getDeliveryCharge());
  totalEl.innerText = formatMoney(getTotal());
}

// Place Order
function placeOrder(){
  msgBox.innerText = "";

  if(cart.length===0){
    msgBox.innerText = "Cart empty hai! Pehle product add karo.";
    return;
  }

  const name = customerNameEl.value.trim();
  const phone = customerPhoneEl.value.trim();
  const address = customerAddressEl.value.trim();
  const landmark = customerLandmarkEl.value.trim();

  if(!name || !phone || !address){
    msgBox.innerText = "Name, Phone aur Address fill karo 🙏";
    return;
  }

  const subtotal = getSubtotal();
  if(subtotal < MIN_ORDER){
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
  if(landmark) msg += `🧭 Landmark: ${landmark}%0A`;

  msg += `%0A🧾 *Order Items:*%0A`;
  cart.forEach(i=>{
    msg += `• ${i.name} (${i.qty}) = ${formatMoney(i.price*i.qty)}%0A`;
  });

  msg += `%0A--------------------%0A`;
  msg += `Subtotal: ${formatMoney(subtotal)}%0A`;
  msg += `Delivery: ${formatMoney(delivery)}%0A`;
  msg += `*Total: ${formatMoney(total)}*%0A`;
  msg += `--------------------%0A%0A`;

  if(payment==="UPI"){
    msg += `💳 Payment: UPI%0A`;
    msg += `UPI ID: ${UPI_ID}%0A`;
  }else{
    msg += `💵 Payment: Cash on Delivery (COD)%0A`;
  }

  msg += `%0A✅ Order Confirm kar do 🙏`;

  const url = `https://wa.me/91${WHATSAPP_NUMBER}?text=${msg}`;
  window.open(url, "_blank");
}

// Filter
function filterProducts(){
  const q = searchInput.value.trim().toLowerCase();
  const cat = categoryFilter.value;

  let list = products.filter(p=>p.name.toLowerCase().includes(q));
  if(cat !== "All"){
    list = list.filter(p=>p.category===cat);
  }
  renderProducts(list);
}

// Events
cartBtn.addEventListener("click", openCart);
closeCart.addEventListener("click", closeCartModal);

// modal background click close
cartModal.addEventListener("click", (e)=>{
  if(e.target === cartModal){
    closeCartModal();
  }
});

deliveryAreaEl.addEventListener("change", renderCart);
placeOrderBtn.addEventListener("click", placeOrder);

callShopBtn.addEventListener("click", ()=>{
  window.open(`tel:+91${WHATSAPP_NUMBER}`);
});

searchInput.addEventListener("input", filterProducts);
categoryFilter.addEventListener("change", filterProducts);

// Init
renderProducts(products);
updateCartCount();
renderCart();

// PWA Service Worker
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("service-worker.js");
}

