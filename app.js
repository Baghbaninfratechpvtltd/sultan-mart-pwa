// ===============================
// Sultan Mart Bharatganj - ADVANCED
// ===============================

const SHOP_NAME = "Sultan Mart Bharatganj";
const WHATSAPP_NUMBER = "9559868648";
const UPI_ID = "9559868648@ptyes";
const MIN_ORDER = 199;

const DELIVERY_RULES = {
  "Bharatganj (Free)": 0,
  "Nearby (₹10)": 10,
  "Far (₹20)": 20,
};

const GOOGLE_SHEET_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0DkCrsf4_AD96Kv9yaYNbMUUHpQtz59zkXH9f1T9mPI2pXB-OcXTR0pdO-9sgyarYD4pEp8nolt5R/pub?output=csv";

const ADMIN_MODE = window.location.search.includes("admin=9559");

let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Elements
const productsContainer = document.getElementById("products");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const cartBtn = document.getElementById("cartBtn");
const cartCount = document.getElementById("cartCount");

// Utils
const money = n => "₹" + Number(n || 0).toFixed(0);

// ===============================
// Load Products
// ===============================
async function loadProductsFromSheet() {
  const res = await fetch(GOOGLE_SHEET_CSV, { cache: "no-store" });
  const csv = await res.text();

  const rows = csv.trim().split("\n").map(r => r.split(","));
  const h = rows[0].map(x => x.replace(/"/g,"").toLowerCase());

  const id = k => h.indexOf(k);

  products = [];

  for (let i = 1; i < rows.length; i++) {
    const c = rows[i].map(x => x.replace(/"/g,"").trim());
    if (!c[id("name")]) continue;

    products.push({
      id: i,
      name: c[id("name")],
      price: +c[id("price")] || 0,
      discount_price: +c[id("discount_price")] || +c[id("price")] || 0,
      category: c[id("category")] || "Others",
      image: c[id("image")] || "https://via.placeholder.com/150",
      offer: c[id("offer")] || "",
      in_stock: (c[id("in_stock")] || "yes").toLowerCase(),
      today_offer: (c[id("today_offer")] || "").toLowerCase()
    });
  }

  renderProducts();
}

// ===============================
// Render Products
// ===============================
function renderProducts() {
  productsContainer.innerHTML = "";

  const q = searchInput.value.toLowerCase();
  const cat = categoryFilter.value;

  let list = products.filter(p =>
    p.name.toLowerCase().includes(q) &&
    (cat === "All" || p.category === cat)
  );

  // ❌ hide out of stock for normal users
  if (!ADMIN_MODE) {
    list = list.filter(p => p.in_stock !== "no");
  }

  // 🔥 Aaj ke Offer
  const today = list.filter(p => p.today_offer === "yes");
  if (today.length) {
    productsContainer.innerHTML += `<h3 style="padding:10px">🔥 Aaj ke Offer</h3>`;
    today.forEach(p => productsContainer.appendChild(card(p)));
  }

  list.forEach(p => {
    if (p.today_offer !== "yes") {
      productsContainer.appendChild(card(p));
    }
  });
}

function card(p) {
  const d = document.createElement("div");
  d.className = "product-card";

  const out = p.in_stock === "no";

  d.innerHTML = `
    <img src="${p.image}" style="opacity:${out?0.4:1}">
    <h3>${p.name}</h3>
    <p>
      <span style="text-decoration:line-through;color:gray">${money(p.price)}</span>
      <b style="color:red"> ${money(p.discount_price)}</b>
    </p>
    <small style="color:green">${p.offer}</small>
    ${out ? "<b style='color:red'>Out of Stock</b>" :
      "<button>Add to Cart</button>"}
  `;

  if (!out) {
    d.querySelector("button").onclick = () => addToCart(p);
  }

  return d;
}

// ===============================
// Cart
// ===============================
function addToCart(p) {
  const ex = cart.find(x => x.id === p.id);
  ex ? ex.qty++ : cart.push({...p, qty:1});
  cartCount.innerText = cart.reduce((s,i)=>s+i.qty,0);
}

// Init
loadProductsFromSheet();
searchInput.oninput = renderProducts;
categoryFilter.onchange = renderProducts;
