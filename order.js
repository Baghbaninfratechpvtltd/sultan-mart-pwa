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

function getOrderId(){
  const url = new URL(window.location.href);
  return url.searchParams.get("id");
}

function money(n){
  return `₹${Math.round(Number(n || 0))}`;
}

async function loadOrder(){
  const orderId = getOrderId();

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

    const itemsHtml = (o.items || []).map(it => {
      const lineTotal = (Number(it.salePrice || it.price || 0) * Number(it.qty || 0));
      return `<li>${it.name} × ${it.qty} = ${money(lineTotal)}</li>`;
    }).join("");

    document.getElementById("orderBox").innerHTML = `
      <h2>👤 Customer</h2>
      <p><b>${o.customer?.name || "-"}</b><br/>📞 ${o.customer?.phone || "-"}</p>

      <h2>📍 Address</h2>
      <p>${o.customer?.address || "Not provided"}</p>

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
    `;
  }catch(err){
    console.error(err);
    document.getElementById("orderBox").innerHTML = "❌ Error loading order.";
  }
}

loadOrder();
