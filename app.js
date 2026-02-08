const WHATSAPP_NUMBER = "9559868648";
const UPI_ID = "9559868648@ptyes";
const MIN_ORDER = 199;

const deliveryCharges = {
  bharatganj: 0,
  nearby: 10,
  far: 20
};

const products = [
  { id:1, name:"Aashirvaad Atta 5kg", cat:"Atta / Flour", price:280, unit:"5kg" },
  { id:2, name:"Fortune Chakki Atta 5kg", cat:"Atta / Flour", price:270, unit:"5kg" },
  { id:3, name:"Maida 1kg", cat:"Atta / Flour", price:55, unit:"1kg" },
  { id:4, name:"Besan 1kg", cat:"Atta / Flour", price:90, unit:"1kg" },
  { id:5, name:"Suji / Rava 1kg", cat:"Atta / Flour", price:60, unit:"1kg" },

  { id:6, name:"Basmati Rice 5kg", cat:"Rice / Chawal", price:420, unit:"5kg" },
  { id:7, name:"Sona Masoori Rice 5kg", cat:"Rice / Chawal", price:360, unit:"5kg" },
  { id:8, name:"Normal Rice 5kg", cat:"Rice / Chawal", price:300, unit:"5kg" },
  { id:9, name:"Poha 1kg", cat:"Rice / Chawal", price:70, unit:"1kg" },
  { id:10, name:"Muri / Puff Rice 500g", cat:"Rice / Chawal", price:30, unit:"500g" },

  { id:11, name:"Arhar Dal 1kg", cat:"Dal / Pulses", price:160, unit:"1kg" },
  { id:12, name:"Masoor Dal 1kg", cat:"Dal / Pulses", price:120, unit:"1kg" },
  { id:13, name:"Moong Dal 1kg", cat:"Dal / Pulses", price:140, unit:"1kg" },
  { id:14, name:"Chana Dal 1kg", cat:"Dal / Pulses", price:95, unit:"1kg" },
  { id:15, name:"Rajma 1kg", cat:"Dal / Pulses", price:160, unit:"1kg" },

  { id:16, name:"Fortune Refined Oil 1L", cat:"Oil / Ghee", price:140, unit:"1L" },
  { id:17, name:"Sunflower Oil 1L", cat:"Oil / Ghee", price:135, unit:"1L" },
  { id:18, name:"Mustard Oil 1L", cat:"Oil / Ghee", price:170, unit:"1L" },
  { id:19, name:"Vanaspati 1kg", cat:"Oil / Ghee", price:160, unit:"1kg" },
  { id:20, name:"Desi Ghee 1L", cat:"Oil / Ghee", price:550, unit:"1L" },

  { id:21, name:"Haldi Powder 200g", cat:"Masale / Spices", price:40, unit:"200g" },
  { id:22, name:"Lal Mirch Powder 200g", cat:"Masale / Spices", price:60, unit:"200g" },
  { id:23, name:"Dhaniya Powder 200g", cat:"Masale / Spices", price:55, unit:"200g" },
  { id:24, name:"Garam Masala 100g", cat:"Masale / Spices", price:50, unit:"100g" },
  { id:25, name:"Jeera 200g", cat:"Masale / Spices", price:70, unit:"200g" },

  { id:26, name:"Sugar 1kg", cat:"Sugar / Salt", price:48, unit:"1kg" },
  { id:27, name:"Jaggery / Gud 1kg", cat:"Sugar / Salt", price:55, unit:"1kg" },
  { id:28, name:"Tata Salt 1kg", cat:"Sugar / Salt", price:25, unit:"1kg" },
  { id:29, name:"Rock Salt 1kg", cat:"Sugar / Salt", price:35, unit:"1kg" },
  { id:30, name:"Black Salt 200g", cat:"Sugar / Salt", price:20, unit:"200g" },

  { id:31, name:"Tata Tea 250g", cat:"Tea / Coffee", price:75, unit:"250g" },
  { id:32, name:"Red Label Tea 250g", cat:"Tea / Coffee", price:80, unit:"250g" },
  { id:33, name:"Nescafe Coffee 50g", cat:"Tea / Coffee", price:120, unit:"50g" },
  { id:34, name:"Sugar Free 100g", cat:"Tea / Coffee", price:140, unit:"100g" },
  { id:35, name:"Green Tea 25 bags", cat:"Tea / Coffee", price:130, unit:"25 bags" },

  { id:36, name:"Haldiram Bhujia 400g", cat:"Snacks / Namkeen", price:110, unit:"400g" },
  { id:37, name:"Mixture Namkeen 400g", cat:"Snacks / Namkeen", price:90, unit:"400g" },
  { id:38, name:"Kurkure 90g", cat:"Snacks / Namkeen", price:20, unit:"90g" },
  { id:39, name:"Lays 52g", cat:"Snacks / Namkeen", price:20, unit:"52g" },
  { id:40, name:"Toast / Rusk 200g", cat:"Snacks / Namkeen", price:35, unit:"200g" },

  { id:41, name:"Surf Excel 1kg", cat:"Soap / Cleaning", price:210, unit:"1kg" },
  { id:42, name:"Rin Detergent 1kg", cat:"Soap / Cleaning", price:95, unit:"1kg" },
  { id:43, name:"Vim Bar 3 pcs", cat:"Soap / Cleaning", price:30, unit:"3 pcs" },
  { id:44, name:"Harpic 500ml", cat:"Soap / Cleaning", price:95, unit:"500ml" },
  { id:45, name:"Phenyl 1L", cat:"Soap / Cleaning", price:85, unit:"1L" },

  { id:46, name:"Colgate Toothpaste 200g", cat:"Daily Use", price:110, unit:"200g" },
  { id:47, name:"Toothbrush 1 pc", cat:"Daily Use", price:20, unit:"1 pc" },
  { id:48, name:"Shampoo Sachet Pack", cat:"Daily Use", price:60, unit:"Pack" },
  { id:49, name:"Bathing Soap 4 pcs", cat:"Daily Use", price:120, unit:"4 pcs" },
  { id:50, name:"Hair Oil 200ml", cat:"Daily Use", price:85, unit:"200ml" },
];

let cart = {}; // {productId: qty}
let selectedCategory = "All";

const categoryListEl = document.getElementById("categoryList");
const productGridEl = document.getElementById("productGrid");
const cartCountEl = document.getElementById("cartCount");

const cartModal = document.getElementById("cartModal");
const cartItemsEl = document.getElementById("cartItems");

const subtotalEl = document.getElementById("subtotal");
const deliveryChargeEl = document.getElementById("deliveryCharge");
const totalEl = document.getElementById("total");

const deliveryAreaEl = document.getElementById("deliveryArea");
const searchInput = document.getElementById("searchInput");

function getCategories(){
  const cats = [...new Set(products.map(p => p.cat))];
  return ["All", ...cats];
}

function renderCategories(){
  const cats = getCategories();
  categoryListEl.innerHTML = "";
  cats.forEach(cat=>{
    const btn = document.createElement("button");
    btn.className = "chip" + (cat===selectedCategory ? " active" : "");
    btn.innerText = cat;
    btn.onclick = ()=>{ selectedCategory = cat; renderCategories(); renderProducts(); };
    categoryListEl.appendChild(btn);
  });
}

function renderProducts(){
  const q = (searchInput.value || "").toLowerCase();
  let list = products;

  if(selectedCategory !== "All"){
    list = list.filter(p=>p.cat===selectedCategory);
    document.getElementById("productsTitle").innerText = selectedCategory;
  } else {
    document.getElementById("productsTitle").innerText = "All Products";
  }

  if(q){
    list = list.filter(p=>p.name.toLowerCase().includes(q));
  }

  productGridEl.innerHTML = "";
  list.forEach(p=>{
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h4>${p.name}</h4>
      <p class="small">${p.cat} • ${p.unit}</p>
      <p class="price">₹${p.price}</p>
      <button class="btn full" onclick="addToCart(${p.id})">Add to Cart</button>
    `;
    productGridEl.appendChild(card);
  });
}

function addToCart(id){
  cart[id] = (cart[id] || 0) + 1;
  updateCartCount();
}

function updateCartCount(){
  const count = Object.values(cart).reduce((a,b)=>a+b,0);
  cartCountEl.innerText = count;
}

function openCart(){
  cartModal.classList.remove("hidden");
  renderCart();
  updateTotals();
}

function closeCart(){
  cartModal.classList.add("hidden");
}

function renderCart(){
  cartItemsEl.innerHTML = "";
  const ids = Object.keys(cart);

  if(ids.length === 0){
    cartItemsEl.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  ids.forEach(id=>{
    const p = products.find(x=>x.id==id);
    const qty = cart[id];

    const row = document.createElement("div");
    row.className = "cartRow";
    row.innerHTML = `
      <div>
        <b>${p.name}</b><br/>
        <span class="small">₹${p.price} • Qty: ${qty}</span>
      </div>
      <div>
        <button class="qtyBtn" onclick="changeQty(${p.id},-1)">-</button>
        <button class="qtyBtn" onclick="changeQty(${p.id},1)">+</button>
      </div>
    `;
    cartItemsEl.appendChild(row);
  });
}

function changeQty(id,delta){
  cart[id] = (cart[id] || 0) + delta;
  if(cart[id] <= 0) delete cart[id];
  renderCart();
  updateCartCount();
  updateTotals();
}

function calcSubtotal(){
  let s = 0;
  Object.keys(cart).forEach(id=>{
    const p = products.find(x=>x.id==id);
    s += p.price * cart[id];
  });
  return s;
}

function updateTotals(){
  const subtotal = calcSubtotal();
  const area = deliveryAreaEl.value;
  const delivery = deliveryCharges[area] || 0;
  const total = subtotal + delivery;

  subtotalEl.innerText = subtotal;
  deliveryChargeEl.innerText = delivery;
  totalEl.innerText = total;
}

function callShop(){
  window.location.href = "tel:+919559868648";
}

function placeOrder(){
  const subtotal = calcSubtotal();
  const areaText = deliveryAreaEl.options[deliveryAreaEl.selectedIndex].text;
  const delivery = deliveryCharges[deliveryAreaEl.value] || 0;
  const total = subtotal + delivery;

  if(subtotal === 0){
    alert("Cart empty hai!");
    return;
  }

  if(subtotal < MIN_ORDER){
    alert(`Minimum order ₹${MIN_ORDER} required!`);
    return;
  }

  const name = document.getElementById("custName").value.trim();
  const mobile = document.getElementById("custMobile").value.trim();
  const address = document.getElementById("custAddress").value.trim();
  const landmark = document.getElementById("custLandmark").value.trim();
  const payment = document.getElementById("paymentMethod").value;

  if(!name || !mobile || !address){
    alert("Name, Mobile aur Address fill karo!");
    return;
  }

  let itemsText = "";
  Object.keys(cart).forEach((id, idx)=>{
    const p = products.find(x=>x.id==id);
    itemsText += `${idx+1}) ${p.name} x ${cart[id]} = ₹${p.price*cart[id]}\n`;
  });

  const msg =
`Hello Sultan Mart Bharatganj 👋
Main order karna chahta/chahti hu.

Name: ${name}
Mobile: ${mobile}
Area: ${areaText}
Address: ${address}
Landmark: ${landmark || "N/A"}

Order Items:
${itemsText}

Subtotal: ₹${subtotal}
Delivery: ₹${delivery}
Total: ₹${total}

Payment: ${payment}
UPI: ${UPI_ID}

Timing: 7 AM – 10 PM`;

  const url = `https://wa.me/91${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

searchInput.addEventListener("input", renderProducts);

renderCategories();
renderProducts();

// INSTALL BUTTON
let deferredPrompt;
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", async ()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.classList.add("hidden");
});
