// =======================
// 🔥 Sultan Mart - App.js
// =======================

// ---------- SETTINGS ----------
window.SETTINGS = {
  store_name: "Sultan Mart",
  upi_id: "yourupi@okaxis", // ⚠️ अपना UPI ID यहाँ डालो
  phone: "91XXXXXXXXXX",    // seller whatsapp phone without + (example: 919999999999)
};

// ---------- FIREBASE ----------
const firebaseConfig = {
  apiKey: "AIzaSyA0zW95qOLokFgruAV8nO-2eeCai6WtQ_c",
  authDomain: "sultan-mart.firebaseapp.com",
  projectId: "sultan-mart",
  storageBucket: "sultan-mart.firebasestorage.app",
  messagingSenderId: "617764247324",
  appId: "1:617764247324:web:08bf92b6904f9c70b9ccd9"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ---------- GLOBALS ----------
let PRODUCTS = [];
let CART = [];
window.currentOrderId = "";

// ---------- HELPERS ----------
function money(n){
  return `₹${Math.round(Number(n || 0))}`;
}

function genOrderId(){
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  const hh = String(d.getHours()).padStart(2,"0");
  const mi = String(d.getMinutes()).padStart(2,"0");
  const ss = String(d.getSeconds()).padStart(2,"0");
  const rand = Math.floor(100 + Math.random()*900);
  return `SM${yy}${mm}${dd}-${hh}${mi}${ss}-${rand}`;
}

// ✅ UPI link builder (with Order ID NOTE)
function buildUPILink(amount, orderId=""){
  const pa = (window.SETTINGS.upi_id || "").trim();
  const pn = encodeURIComponent(window.SETTINGS.store_name || "Sultan Mart");
  const am = encodeURIComponent(String(Math.round(Number(amount || 0))));
  const cu = "INR";

  // 🔥 NOTE में Order ID जाएगा
  const note = encodeURIComponent(`Order ${orderId || "SultanMart"}`);

  return `upi://pay?pa=${encodeURIComponent(pa)}&pn=${pn}&am=${am}&cu=${cu}&tn=${note}`;
}

// ---------- CART ----------
function addToCart(p){
  const found = CART.find(x => x.id === p.id);
  if(found){
    found.qty += 1;
  }else{
    CART.push({ ...p, qty: 1 });
  }
  renderCart();
}

function removeFromCart(id){
  CART = CART.filter(x => x.id !== id);
  renderCart();
}

function changeQty(id, delta){
  const item = CART.find(x => x.id === id);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0) removeFromCart(id);
  renderCart();
}

function cartTotal(){
  return CART.reduce((sum, x) => sum + (Number(x.salePrice || x.price || 0) * Number(x.qty || 1)), 0);
}

// ---------- UI ----------
function renderCart(){
  const cartBox = document.getElementById("cartItems");
  const totalEl = document.getElementById("grandTotal");

  if(!cartBox || !totalEl) return;

  if(!CART.length){
    cartBox.innerHTML = `<p style="opacity:.7;">Cart empty</p>`;
    totalEl.innerText = money(0);
    updateUpiPayButton();
    return;
  }

  cartBox.innerHTML = CART.map(x => `
    <div style="display:flex;gap:10px;align-items:center;border-bottom:1px solid #eee;padding:10px 0;">
      <img src="${x.image}" style="width:52px;height:52px;object-fit:cover;border-radius:10px;" />
      <div style="flex:1;">
        <div style="font-weight:900;">${x.name}</div>
        <div style="opacity:.7;font-size:13px;">${money(x.salePrice || x.price)}</div>
      </div>
      <div style="display:flex;gap:6px;align-items:center;">
        <button onclick="changeQty('${x.id}',-1)">-</button>
        <b>${x.qty}</b>
        <button onclick="changeQty('${x.id}',1)">+</button>
      </div>
      <button onclick="removeFromCart('${x.id}')" style="background:#ffefef;border:1px solid #ffb3b3;">✖</button>
    </div>
  `).join("");

  totalEl.innerText = money(cartTotal());
  updateUpiPayButton();
}

// ---------- UPI PAY BUTTON ----------
function updateUpiPayButton() {
  const upiPayLink = document.getElementById("upiPayLink");

  const selected = document.querySelector("input[name='payMethod']:checked");
  const method = selected ? selected.value : "COD";

  const grandTotal = Number(document.getElementById("grandTotal").innerText.replace(/[^\d.]/g, "")) || 0;

  if (method !== "UPI") {
    upiPayLink.style.display = "none";
    return;
  }

  // ✅ Order ID note में जाएगा
  const orderId = window.currentOrderId || "";
  const link = buildUPILink(grandTotal, orderId);

  upiPayLink.href = link;
  upiPayLink.style.display = "block";
}

// ---------- PLACE ORDER ----------
async function placeOrder(){
  if(!CART.length){
    alert("Cart empty!");
    return;
  }

  const cname = (document.getElementById("custName")?.value || "").trim();
  const cphone = (document.getElementById("custPhone")?.value || "").trim();
  const caddr = (document.getElementById("custAddress")?.value || "").trim();

  if(!cname || !cphone || !caddr){
    alert("Name, Phone, Address required");
    return;
  }

  const selected = document.querySelector("input[name='payMethod']:checked");
  const payMethod = selected ? selected.value : "COD";

  const orderId = genOrderId();
  window.currentOrderId = orderId; // ✅ UPI note के लिए

  // totals
  const grandTotal = cartTotal();

  const orderData = {
    orderId,
    time: new Date().toISOString(),

    customer: {
      name: cname,
      phone: cphone,
      address: caddr,
    },

    cart: CART.map(x => ({
      id: x.id,
      name: x.name,
      qty: x.qty,
      price: Number(x.salePrice || x.price || 0),
      image: x.image || ""
    })),

    totals: {
      grandTotal: grandTotal
    },

    paymentMethod: payMethod,

    // 🔥 IMPORTANT: default always NOT_PAID
    paymentStatus: "NOT_PAID",

    status: "PENDING"
  };

  // Save to Firebase
  try{
    await db.collection("orders").doc(orderId).set(orderData);
  }catch(err){
    console.error(err);
    alert("Firebase error!");
    return;
  }

  // WhatsApp message
  const lines = [];
  lines.push(`🛒 NEW ORDER`);
  lines.push(`🆔 Order ID: ${orderId}`);
  lines.push(`👤 Name: ${cname}`);
  lines.push(`📞 Phone: ${cphone}`);
  lines.push(`🏠 Address: ${caddr}`);
  lines.push(`💳 Payment: ${payMethod}`);
  lines.push(`💰 Total: ${money(grandTotal)}`);
  lines.push("");
  lines.push("Items:");
  CART.forEach(x => {
    lines.push(`• ${x.name} x${x.qty} = ${money((x.salePrice||x.price)*x.qty)}`);
  });

  // 🔗 Order page link
  const orderLink = `${location.origin}/order.html?id=${encodeURIComponent(orderId)}`;
  lines.push("");
  lines.push(`🔗 Order Page: ${orderLink}`);

  // UPI link (with Order ID)
  if(payMethod === "UPI"){
    const upi = buildUPILink(grandTotal, orderId);
    lines.push(`💳 Pay Link: ${upi}`);
  }

  const msg = encodeURIComponent(lines.join("\n"));
  const wa = `https://wa.me/${window.SETTINGS.phone}?text=${msg}`;
  window.open(wa, "_blank");

  alert("✅ Order placed!");

  CART = [];
  renderCart();
}

// ---------- EVENTS ----------
document.addEventListener("change", (e) => {
  if(e.target && e.target.name === "payMethod"){
    updateUpiPayButton();
  }
});

// Place order button
document.getElementById("placeOrderBtn")?.addEventListener("click", placeOrder);

// ---------- PWA INSTALL ----------
let deferredPrompt;
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = "inline-flex";
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  await deferredPrompt.userChoice;

  deferredPrompt = null;
  installBtn.style.display = "none";
});
