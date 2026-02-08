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
const products = [
  { id: 1, name: "Aashirvaad Atta 5kg", price: 280, category: "Atta / Flour" },
  { id: 2, name: "Aashirvaad Atta 10kg", price: 550, category: "Atta / Flour" },
  { id: 3, name: "Maida 1kg", price: 55, category: "Atta / Flour" },
  { id: 4, name: "Besan 1kg", price: 95, category: "Atta / Flour" },
  { id: 5, name: "Suji 1kg", price: 60, category: "Atta / Flour" },

  { id: 6, name: "Basmati Rice 5kg", price: 320, category: "Rice / Chawal" },
  { id: 7, name: "Sona Masoori Rice 5kg", price: 290, category: "Rice / Chawal" },
  { id: 8, name: "Normal Chawal 5kg", price: 240, category: "Rice / Chawal" },
  { id: 9, name: "Poha 1kg", price: 70, category: "Rice / Chawal" },
  { id: 10, name: "Murmura 500g", price: 35, category: "Rice / Chawal" },

  { id: 11, name: "Toor Dal 1kg", price: 120, category: "Dal / Pulses" },
  { id: 12, name: "Chana Dal 1kg", price: 95, category: "Dal / Pulses" },
  { id: 13, name: "Moong Dal 1kg", price: 110, category: "Dal / Pulses" },
  { id: 14, name: "Masoor Dal 1kg", price: 105, category: "Dal / Pulses" },
  { id: 15, name: "Urad Dal 1kg", price: 130, category: "Dal / Pulses" },

  { id: 16, name: "Fortune Mustard Oil 1L", price: 165, category: "Oil / Ghee" },
  { id: 17, name: "Fortune Refined Oil 1L", price: 150, category: "Oil / Ghee" },
  { id: 18, name: "Sunflower Oil 1L", price: 155, category: "Oil / Ghee" },
  { id: 19, name: "Desi Ghee 500ml", price: 280, category: "Oil / Ghee" },
  { id: 20, name: "Vanaspati 1kg", price: 140, category: "Oil / Ghee" },

  { id: 21, name: "Haldi Powder 200g", price: 45, category: "Spices" },
  { id: 22, name: "Mirch Powder 200g", price: 55, category: "Spices" },
  { id: 23, name: "Dhaniya Powder 200g", price: 50, category: "Spices" },
  { id: 24, name: "Garam Masala 100g", price: 60, category: "Spices" },
  { id: 25, name: "Jeera 100g", price: 35, category: "Spices" },

  { id: 26, name: "Namkeen Mix 200g", price: 30, category: "Snacks" },
  { id: 27, name: "Bhujia 200g", price: 35, category: "Snacks" },
  { id: 28, name: "Kurkure 90g", price: 20, category: "Snacks" },
  { id: 29, name: "Chips Packet", price: 20, category: "Snacks" },
  { id: 30, name: "Peanuts 500g", price: 70, category: "Snacks" },

  { id: 31, name: "Tata Tea 250g", price: 85, category: "Tea / Coffee" },
  { id: 32, name: "Red Label Tea 250g", price: 90, category: "Tea / Coffee" },
  { id: 33, name: "Nescafe Coffee 50g", price: 90, category: "Tea / Coffee" },
  { id: 34, name: "Bru Coffee 50g", price: 85, category: "Tea / Coffee" },
  { id: 35, name: "Green Tea 25 Bags", price: 120, category: "Tea / Coffee" },

  { id: 36, name: "Sugar 1kg", price: 50, category: "Daily Use" },
  { id: 37, name: "Salt 1kg", price: 22, category: "Daily Use" },
  { id: 38, name: "Tea Sugar 500g", price: 28, category: "Daily Use" },
  { id: 39, name: "Milk Powder 500g", price: 220, category: "Daily Use" },
  { id: 40, name: "Bread 1 Packet", price: 35, category: "Daily Use" },

  { id: 41, name: "Detergent Powder 1kg", price: 90, category: "Soap / Cleaning" },
  { id: 42, name: "Dishwash Liquid 500ml", price: 85, category: "Soap / Cleaning" },
  { id: 43, name: "Bath Soap Pack", price: 70, category: "Soap / Cleaning" },
  { id: 44, name: "Shampoo Sachet Pack", price: 60, category: "Soap / Cleaning" },
  { id: 45, name: "Toothpaste 200g", price: 85, category: "Soap / Cleaning" },

  { id: 46, name: "Parle-G Biscuit", price: 10, category: "Biscuits" },
  { id: 47, name: "Marie Gold Biscuit", price: 30, category: "Biscuits" },
  { id: 48, name: "Good Day Biscuit", price: 35, category: "Biscuits" },

  { id: 49, name: "Coca Cola 750ml", price: 40, category: "Cold Drinks" },
  { id: 50, name: "Sprite 750ml", price: 40, category: "Cold Drinks" }
];

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
