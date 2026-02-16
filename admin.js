// =======================
// 🔥 Firebase Setup
// =======================
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

// 🔒 Admin Password (CHANGE if you want)
const ADMIN_PASSWORD = "SULTAN123";

const loginBox = document.getElementById("loginBox");
const adminPanel = document.getElementById("adminPanel");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const adminPass = document.getElementById("adminPass");
const loginMsg = document.getElementById("loginMsg");
const ordersList = document.getElementById("ordersList");
const searchBox = document.getElementById("searchBox");

let allOrders = [];

function money(n){
  return `₹${Math.round(Number(n || 0))}`;
}

function badge(status){
  const s = (status || "PENDING").toUpperCase();
  if(s === "CANCELLED") return `<span style="color:red;font-weight:800;">🔴 CANCELLED</span>`;
  if(s === "DELIVERED") return `<span style="color:green;font-weight:800;">✅ DELIVERED</span>`;
  if(s === "CONFIRMED") return `<span style="color:green;font-weight:800;">🟢 CONFIRMED</span>`;
  return `<span style="color:#b8860b;font-weight:800;">🟡 PENDING</span>`;
}

async function updateStatus(orderId, newStatus){
  try{
    await db.collection("orders").doc(orderId).update({
      status: newStatus,
      statusUpdatedAt: new Date().toISOString(),
      statusUpdatedBy: "SELLER"
    });
    alert("✅ Updated: " + newStatus);
  }catch(err){
    console.error(err);
    alert("❌ Status update failed");
  }
}

function renderOrders(list){
  if(!list.length){
    ordersList.innerHTML = `<p style="opacity:.7;">No orders found.</p>`;
    return;
  }

  ordersList.innerHTML = list.map(o => {
    const orderId = o.orderId || "(no id)";
    const name = o.customer?.name || "-";
    const phone = o.customer?.phone || "-";
    const total = o.totals?.grandTotal || 0;
    const st = o.status || "PENDING";
    const time = o.time ? new Date(o.time).toLocaleString() : "-";

    const orderLink = `order.html?id=${encodeURIComponent(orderId)}`;

    return `
      <div style="background:#fff;border-radius:14px;padding:14px;box-shadow:0 10px 25px rgba(0,0,0,.08);">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
          <div>
            <div style="font-weight:900;">🆔 ${orderId}</div>
            <div style="opacity:.75;font-size:13px;">${time}</div>
          </div>
          <div>${badge(st)}</div>
        </div>

        <div style="margin-top:10px;">
          <div><b>👤 ${name}</b></div>
          <div style="opacity:.8;">📞 ${phone}</div>
          <div style="margin-top:6px;"><b>💰 Total: ${money(total)}</b></div>
        </div>

        <div style="display:grid;gap:8px;margin-top:12px;">
          <a target="_blank" href="${orderLink}"
             style="text-decoration:none;text-align:center;padding:10px;border-radius:10px;background:#eee;color:#111;font-weight:800;">
             🔗 Open Order Page
          </a>

          <button onclick="updateStatus('${orderId}','CONFIRMED')"
            style="padding:10px;border-radius:10px;border:none;background:#2e7d32;color:#fff;font-weight:800;cursor:pointer;">
            🟢 Confirm
          </button>

          <button onclick="updateStatus('${orderId}','CANCELLED')"
            style="padding:10px;border-radius:10px;border:none;background:#c62828;color:#fff;font-weight:800;cursor:pointer;">
            🔴 Cancel
          </button>

          <button onclick="updateStatus('${orderId}','DELIVERED')"
            style="padding:10px;border-radius:10px;border:none;background:#1565c0;color:#fff;font-weight:800;cursor:pointer;">
            ✅ Delivered
          </button>
        </div>
      </div>
    `;
  }).join("");
}

async function loadOrders(){
  ordersList.innerHTML = `<p style="opacity:.7;">Loading orders...</p>`;

  try{
    const snap = await db.collection("orders").orderBy("time", "desc").limit(200).get();
    allOrders = snap.docs.map(d => d.data());
    renderOrders(allOrders);
  }catch(err){
    console.error(err);
    ordersList.innerHTML = `<p style="color:red;">❌ Firebase load error (check Firestore rules)</p>`;
  }
}

function doLogin(){
  const p = (adminPass.value || "").trim();

  if(p !== ADMIN_PASSWORD){
    loginMsg.innerText = "❌ Wrong password";
    return;
  }

  loginMsg.innerText = "";
  loginBox.style.display = "none";
  adminPanel.style.display = "block";

  loadOrders();
}

function doLogout(){
  adminPass.value = "";
  loginBox.style.display = "block";
  adminPanel.style.display = "none";
}

loginBtn.addEventListener("click", doLogin);
logoutBtn.addEventListener("click", doLogout);

adminPass.addEventListener("keydown", (e) => {
  if(e.key === "Enter") doLogin();
});

searchBox.addEventListener("input", () => {
  const q = (searchBox.value || "").toLowerCase().trim();

  const filtered = allOrders.filter(o => {
    const id = (o.orderId || "").toLowerCase();
    const name = (o.customer?.name || "").toLowerCase();
    const phone = (o.customer?.phone || "").toLowerCase();
    return id.includes(q) || name.includes(q) || phone.includes(q);
  });

  renderOrders(filtered);
});
