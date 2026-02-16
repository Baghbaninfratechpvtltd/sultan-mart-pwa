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

function getParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function money(n){
  return `₹${Math.round(Number(n || 0))}`;
}

function statusBadge(status){
  const s = (status || "PENDING").toUpperCase();
  if(s === "CANCELLED") return `🔴 <b style="color:red">${s}</b>`;
  if(s === "DELIVERED") return `✅ <b style="color:green">${s}</b>`;
  if(s === "CONFIRMED") return `🟢 <b style="color:green">${s}</b>`;
  return `🟡 <b style="color:#b8860b">${s}</b>`;
}

async function updateStatus(orderId, newStatus){
  await db.collection("orders").doc(orderId).update({
    status: newStatus,
    statusUpdatedAt: new Date().toISOString()
  });
  alert("✅ Status Updated: " + newStatus);
  loadOrder(); // reload
}

async function customerCancel(orderId){
  const ok = confirm("❌ Cancel this order?");
  if(!ok) return;

  await db.collection("orders").doc(orderId).update({
    status: "CANCELLED",
    cancelledBy: "CUSTOMER",
    statusUpdatedAt: new Date().toISOString()
  });

  alert("✅ Order Cancelled");
  loadOrder();
}

async function loadOrder(){
  const orderId = getParam("id");
  const isAdmin = getParam("admin") === "1";

  if(!orderId){
    document.getElementById("orderIdText").innerText = "❌ No Order ID Found";
    document.getElementById("orderBox").innerHTML = "Order ID missing.";
    return;
  }

  document.getElementById("orderIdText").innerText = `Order ID: ${orderId}`;

  try{
    const doc = await db.collection("orders").doc(orderId).get();

    if(!doc.exists){
      document.getElementById("orderBox").innerHTML = "❌ Order not found.";
      return;
    }

    const o = doc.data();
    const st = (o.status || "PENDING").toUpperCase();

    const itemsHtml = (o.items || []).map(it => {
      const lineTotal = (Number(it.salePrice || it.price || 0) * Number(it.qty || 0));
      return `<li>${it.name} × ${it.qty} = ${money(lineTotal)}</li>`;
    }).join("");

    // Payment display
    const payMethod = o.payment?.method || "-";
    const paidText = (payMethod === "UPI") ? "PAID (UPI)" : "CASH ON DELIVERY";

    // Customer cancel allowed only if not confirmed/delivered
    const customerCancelAllowed = (st === "PENDING");

    let adminButtons = "";
    if(isAdmin){
      adminButtons = `
        <hr/>
        <h2>🧑‍💼 Seller Controls</h2>
        <button class="btn" onclick="updateStatus('${orderId}','CONFIRMED')">🟢 Confirm</button>
        <button class="btn" style="background:#c62828" onclick="updateStatus('${orderId}','CANCELLED')">🔴 Cancel</button>
        <button class="btn" style="background:#2e7d32" onclick="updateStatus('${orderId}','DELIVERED')">✅ Delivered</button>
      `;
    }

    let customerButtons = "";
    if(!isAdmin && customerCancelAllowed){
      customerButtons = `
        <hr/>
        <button class="btn" style="background:#c62828" onclick="customerCancel('${orderId}')">❌ Cancel Order</button>
      `;
    }

    document.getElementById("orderBox").innerHTML = `
      <h2>📌 Status</h2>
      <p>${statusBadge(st)}</p>

      <h2>👤 Customer</h2>
      <p><b>${o.customer?.name || "-"}</b><br/>📞 ${o.customer?.phone || "-"}</p>

      <h2>📍 Address</h2>
      <p>${o.customer?.address || "Not provided"}</p>

      <h2>💳 Payment</h2>
      <p>
        Method: <b>${payMethod}</b><br/>
        <b>${paidText}</b>
      </p>

      <h2>🛒 Items</h2>
      <ul>${itemsHtml}</ul>

      <h2>💰 Bill Summary</h2>
      <p>
        Subtotal: ${money(o.totals?.subTotal || 0)}<br/>
        Delivery: ${money(o.totals?.delivery || 0)}<br/>
        <b>Grand Total: ${money(o.totals?.grandTotal || 0)}</b>
      </p>

      <hr/>
      <button class="btn" onclick="window.print()">🖨️ Print</button>

      ${customerButtons}
      ${adminButtons}
    `;
  }catch(err){
    console.error(err);
    document.getElementById("orderBox").innerHTML = "❌ Error loading order.";
  }
}

loadOrder();
