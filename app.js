const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1AdPQGVtZvoiFpY4tMCrxXEf1KcK96G71OUWYyFEAvRg/gviz/tq?tqx=out:csv&sheet=Sheet1";

const productsDiv = document.getElementById("products");

function parseCSV(text) {
  const rows = text.trim().split("\n");
  const headers = rows[0].split(",");

  return rows.slice(1).map(row => {
    const cols = row.split(",");
    let obj = {};
    headers.forEach((h, i) => (obj[h.trim()] = cols[i]?.trim() || ""));
    return obj;
  });
}

fetch(SHEET_URL)
  .then(r => r.text())
  .then(csv => {
    const items = parseCSV(csv);
    productsDiv.innerHTML = "";

    items.forEach(item => {
      let priceHTML = `<h4>₹${item.price}</h4>`;
      let buttonHTML = `<button class="add-btn">Add to Cart</button>`;
      let badgeHTML = "";

      if (item.discount_price && item.discount_price !== item.price) {
        priceHTML = `
          <h4>
            <del style="color:#888">₹${item.price}</del>
            <span style="color:#e53935;font-weight:bold"> ₹${item.discount_price}</span>
          </h4>
        `;
      }

      if (item.in_stock === "no") {
        buttonHTML = `<button class="add-btn" disabled>Out of Stock</button>`;
        badgeHTML = `<span style="color:red;font-size:12px">Out of Stock</span>`;
      }

      if (item.today_offer === "yes") {
        badgeHTML = `<span style="color:green;font-size:12px">🔥 Aaj ka Offer</span>`;
      }

      productsDiv.innerHTML += `
        <div class="product-card">
          <h3>${item.name}</h3>
          <p>${item.category}</p>
          ${priceHTML}
          ${badgeHTML}<br>
          ${buttonHTML}
        </div>
      `;
    });
  })
  .catch(() => {
    productsDiv.innerHTML = "Data load error";
  });
