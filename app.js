// ====== GOOGLE SHEET CSV LINK (FINAL & WORKING) ======
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1AdPQGVtZvoiFpY4tMCrxXEf1KcK96G71OUWYyFEAvRg/gviz/tq?tqx=out:csv&sheet=Sheet1";

const productsDiv = document.getElementById("products");
const todayOfferDiv = document.getElementById("today-offer");

// ====== CSV PARSER ======
function csvToArray(str) {
  const rows = str.trim().split("\n").map(r => r.split(","));
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ? row[i].trim() : "";
    });
    return obj;
  });
}

// ====== LOAD PRODUCTS ======
fetch(SHEET_URL)
  .then(res => res.text())
  .then(csv => {
    const items = csvToArray(csv);

    productsDiv.innerHTML = "";
    todayOfferDiv.innerHTML = "";

    items.forEach(item => {
      if (item.in_stock !== "yes") return;

      const card = `
        <div class="product-card">
          <img src="${item.image}" alt="${item.name}">
          <h3>${item.name}</h3>
          <p>
            <span style="text-decoration:line-through;color:gray;">₹${item.price}</span>
            <b style="color:red;"> ₹${item.discount_price}</b>
          </p>
          <small style="color:green;">${item.offer}</small>
          <br>
          <button>Add to Cart</button>
        </div>
      `;

      productsDiv.innerHTML += card;

      if (item.today_offer === "yes") {
        todayOfferDiv.innerHTML += card;
      }
    });
  })
  .catch(err => {
    productsDiv.innerHTML = "Data load nahi ho raha";
    console.error(err);
  });
