const SHOP_NAME = "Sultan Mart Bharatganj";
const WHATSAPP_NUMBER = "9559868648";
const UPI_ID = "9559868648@ptyes";
const MIN_ORDER = 199;

const DELIVERY_RULES = {
  "Bharatganj (Free)": 0,
  "Nearby (₹10)": 10,
  "Far (₹20)": 20
};

let products = [
  { id: 1, name: "Aashirvaad Atta 5kg", price: 280, category: "Atta / Flour" },
  { id: 2, name: "Suji / Rava 1kg", price: 60, category: "Atta / Flour" },
  { id: 3, name: "Poha 1kg", price: 70, category: "Rice / Chawal" },
  { id: 4, name: "Basmati Rice 5kg", price: 300, category: "Rice / Chawal" },
  { id: 5, name: "Toor Dal 1kg", price: 120, category: "Dal / Pulses" },
  { id: 6, name: "Chana Dal 1kg", price: 95, category: "Dal / Pulses" },
  { id: 7, name: "Sugar 1kg", price: 50, category: "Daily Use" },
  { id: 8, name: "Tea 250g", price: 80, category: "Daily Use" },
  { id: 9, name: "Detergent Powder 1kg", price: 90, category: "Soap / Cleaning" },
  { id: 10, name: "Bath Soap Pack", price: 70, category: "Soap / Cleaning" }
];

let cart = JSON.parse(localStorage.getItem("cart")) || [];

const productsContainer = document.getElementById("products");
const cartBtn = document.getElementById("cartBtn");
const cartCount = document.getElementById("cartCount");
const cartModal = document.getElementById("cartModal");
const closeCart = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");

const subtotalEl = document.getElementById("subtotal");
const deliveryChargeEl = document.getElementById("deliveryCharge");
const totalEl = document.getElementById("total");
const deliveryAreaEl = document.getElementById("deliveryArea");

const customerNameEl = document.getElementById("customerName");
const customerPhoneEl = document.getElementById("customerPhone");
const customerAddressEl = document.getElementById("customerAddress");
const customerLandmarkEl = document.getElementById("customerLandmark");

const paymentMethodEl = document.getElementById("paymentMethod");
const placeOrderBtn = document.getElementById("placeOrderBtn");
const callShopBtn = document.getElementById("callShopBtn");

const searchInput = document.getElementById("searchInput");
const categoryBtns = document.querySelectorAll(".cat-btn");

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  cartCount.innerText = cart.reduce((sum, item) => sum + item.qty, 0);
}

function formatMoney(num) {
  return "₹" + Number(num).toFixed(0);
}

function getDeliveryCharge() {
  return DELIVERY_RULES[deliveryAreaEl.value] || 0;
}

function getSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getTotal() {
  return getSubtotal() + getDeliveryCharge();
}

function renderProducts(list) {
  productsContainer.innerHTML = "";

  list.forEach((p) => {
    const div = document.createElement("div");
    div.className = "product-card";

    div.innerHTML = `
      <h3>${p.name}</h3>
      <p class="category">${p.category}</p>
      <p class="price">${formatMoney(p.price)}</p>
      <button class="add-btn">Add to Cart</button>
    `;

    div.querySelector(".add-btn").addEventListener("click", () => {
      addToCart(p.id);
    });

    productsContainer.appendChild(div);
  });
}

function addToCart(productId) {
  const product = products.find((x) => x.id === productId);
  if (!product) return;

  const existing = cart.find((x) => x.id === productId);

  if (existing) existing.qty += 1;
  else cart.push({ ...product, qty: 1 });

  saveCart();
}

function openCart() {
  cartModal.classList.remove("hidden");
  renderCart();
}

function closeCartModal() {
  cartModal.classList.add("hidden");
}

function renderCart() {
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = `<p style="text-align:center;">Cart empty hai 😅</p>`;
  }

  cart.forEach((item) => {
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

    row.querySelector(".minus").addEventListener("click", () => {
      item.qty -= 1;
      if (item.qty <= 0) cart = cart.filter((x) => x.id !== item.id);
      saveCart();
      renderCart();
    });

    row.querySelector(".plus").addEventListener("click", () => {
      item.qty += 1;
      saveCart();
      renderCart();
    });

    row.querySelector(".remove-btn").addEventListener("click", () => {
      cart = cart.filter((x) => x.id !== item.id);
      saveCart();
      renderCart();
    });

    cartItems.appendChild(row);
  });

  subtotalEl.innerText = formatMoney(getSubtotal());
  deliveryChargeEl.innerText = formatMoney(getDeliveryCharge());
  totalEl.innerText = formatMoney(getTotal());
}

function placeOrder() {
  if (cart.length === 0) {
    alert("Pehle product Add to Cart karo 🙏");
    return;
  }

  const name = customerNameEl.value.trim();
  const phone = customerPhoneEl.value.trim();
  const address = customerAddressEl.value.trim();
  const landmark = customerLandmarkEl.value.trim();

  if (!name || !phone || !address) {
    alert("Name, Phone aur Address fill karo 🙏");
    return;
  }

  const subtotal = getSubtotal();
  const delivery = getDeliveryCharge();
  const total = getTotal();

  if (subtotal < MIN_ORDER) {
    alert(`Minimum order ₹${MIN_ORDER} required 🙏`);
    return;
  }

  let msg = `🛒 *${SHOP_NAME}*%0A%0A`;
  msg += `👤 Name: ${name}%0A`;
  msg += `📞 Phone: ${phone}%0A`;
  msg += `📍 Area: ${deliveryAreaEl.value}%0A`;
  msg += `🏠 Address: ${address}%0A`;
  if (landmark) msg += `🧭 Landmark: ${landmark}%0A`;

  msg += `%0A🧾 *Order Items:*%0A`;

  cart.forEach((item) => {
    msg += `• ${item.name} (${item.qty}) = ${formatMoney(item.price * item.qty)}%0A`;
  });

  msg += `%0A--------------------%0A`;
  msg += `Subtotal: ${formatMoney(subtotal)}%0A`;
  msg += `Delivery: ${formatMoney(delivery)}%0A`;
  msg += `*Total: ${formatMoney(total)}*%0A`;
  msg += `--------------------%0A%0A`;

  const payment = paymentMethodEl.value;

  if (payment === "UPI") {
    msg += `💳 Payment: UPI%0A`;
    msg += `UPI ID: ${UPI_ID}%0A`;
  } else {
    msg += `💵 Payment: Cash on Delivery (COD)%0A`;
  }

  msg += `%0A✅ Order Confirm kar do 🙏`;

  const url = `https://wa.me/91${WHATSAPP_NUMBER}?text=${msg}`;
  window.open(url, "_blank");
}

function filterProducts() {
  const q = searchInput.value.trim().toLowerCase();
  const activeCat = document.querySelector(".cat-btn.active")?.dataset.cat || "All";

  let filtered = products.filter((p) => p.name.toLowerCase().includes(q));

  if (activeCat !== "All") {
    filtered = filtered.filter((p) => p.category === activeCat);
  }

  renderProducts(filtered);
}

cartBtn.addEventListener("click", openCart);
closeCart.addEventListener("click", closeCartModal);

cartModal.addEventListener("click", (e) => {
  if (e.target === cartModal) closeCartModal();
});

deliveryAreaEl.addEventListener("change", renderCart);
placeOrderBtn.addEventListener("click", placeOrder);
callShopBtn.addEventListener("click", () => window.open(`tel:+91${WHATSAPP_NUMBER}`));

searchInput.addEventListener("input", filterProducts);

categoryBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    categoryBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filterProducts();
  });
});

renderProducts(products);
updateCartCount();
renderCart();
