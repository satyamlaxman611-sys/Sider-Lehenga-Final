(async function () {
  SL.mountLayout({ active: "checkout" });

  const mount = document.getElementById("checkoutMount");
  if (!mount) return;

  const cart = SL.getCart();
  if (!cart.length) {
    mount.innerHTML = `
      <div class="card fade-in" style="padding:14px;">
        <div style="font-weight:900;">Cart is empty</div>
        <div style="color:var(--muted); margin-top:6px;">Add items before checkout.</div>
        <div style="margin-top:12px;"><a class="btn primary" href="products.html">Browse all</a></div>
      </div>`;
    return;
  }

  function subTotalItems() {
    return cart.reduce((sum, it) => sum + (Number(it.price)||0) * (Number(it.qty)||0), 0);
  }

  const FEES = {
    expressDelivery: 150,
    stitching: 700
  };

  const stateList = [
    "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
    "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
    "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
    "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh",
    "Puducherry","Chandigarh","Andaman and Nicobar Islands","Dadra and Nagar Haveli and Daman and Diu"
  ];

  const initial = {
    delivery: "normal",     // normal | express
    stitching: "normal",    // normal | stitching
    fullName: "",
    phone: "",
    whatsapp: "",
    email: "",
    town: "",
    pin: "",
    street: "",
    landmark: "",
    state: "Odisha"
  };

  const saved = (() => {
    try { return JSON.parse(localStorage.getItem("sl_checkout_v1") || "null"); } catch { return null; }
  })();
  const model = Object.assign({}, initial, saved || {});

  function deliveryFee() { return model.delivery === "express" ? FEES.expressDelivery : 0; }
  function stitchingFee() { return model.stitching === "stitching" ? FEES.stitching : 0; }

  function grandTotal() {
    return subTotalItems() + deliveryFee() + stitchingFee();
  }

  function formatFee(n) { return n ? SL.formatINR(n) : "₹0"; }

  function persist() {
    localStorage.setItem("sl_checkout_v1", JSON.stringify(model));
  }

  function cartSummaryHTML() {
    return `
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${cart.map(it => `
          <div class="card" style="padding:10px; display:flex; gap:10px; align-items:center;">
            <img src="${SL.escapeHTML(it.image||"")}" alt="${SL.escapeHTML(it.title)}"
                 style="width:64px;height:64px;border-radius:14px;object-fit:cover;border:1px solid var(--border);background:#f3f4f6;">
            <div style="flex:1; min-width:0;">
              <div style="font-weight:800; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${SL.escapeHTML(it.title)}
              </div>
              <div style="margin-top:6px; color:var(--muted); font-size:12px;">
                Size: <strong>${SL.escapeHTML(it.size||"-")}</strong> • Qty: <strong>${Number(it.qty)||1}</strong>
              </div>
              <div style="margin-top:6px; font-weight:900;">${SL.formatINR(it.price)}</div>
            </div>
            <div class="pill" style="font-size:12px;">${SL.formatINR((Number(it.price)||0) * (Number(it.qty)||0))}</div>
          </div>
        `).join("")}
      </div>
    `;
  }

  function setOptActive(group, value) {
    const wrap = document.querySelector(`[data-group="${group}"]`);
    if (!wrap) return;
    wrap.querySelectorAll(".opt").forEach(el => {
      el.classList.toggle("active", el.dataset.value === value);
    });
  }

  function render() {
    mount.innerHTML = `
      <div style="display:grid; grid-template-columns: 1.05fr .95fr; gap:12px;">
        <div class="card fade-in" style="padding:14px;">
          <div style="font-weight:900; letter-spacing:-.02em;">Customer details</div>
          <div style="height:10px;"></div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
            ${field("Full Name", "fullName", "text", "Full name")}
            ${field("Phone Number", "phone", "tel", "10-digit phone")}
            ${field("WhatsApp Number", "whatsapp", "tel", "WhatsApp number")}
            ${field("Gmail", "email", "email", "email@gmail.com")}
            ${field("Village/Town", "town", "text", "Village/Town")}
            ${field("Postal PIN code", "pin", "text", "PIN code")}
          </div>

          <div style="height:10px;"></div>

          <div style="display:grid; grid-template-columns: 1fr; gap:10px;">
            ${textarea("Street address", "street", "House no, street, area")}
            ${field("Landmark", "landmark", "text", "Near…")}
            ${selectField("State", "state", stateList)}
          </div>

          <div style="height:14px;"></div>

          <div class="card" style="padding:12px; border-color: rgba(212,175,55,.35); background: linear-gradient(180deg, rgba(212,175,55,.10), rgba(212,175,55,.03));">
            <div style="font-weight:900;">Order options (per order)</div>
            <div style="height:10px;"></div>

            <div style="font-weight:800; font-size:13px;">Delivery</div>
            <div class="radioRow" data-group="delivery" style="margin-top:8px;">
              ${optCard("delivery","normal","Normal delivery","7–10 days","₹0")}
              ${optCard("delivery","express","Express delivery","3–5 days", `+${SL.formatINR(FEES.expressDelivery)}`)}
            </div>

            <div style="height:12px;"></div>

            <div style="font-weight:800; font-size:13px;">Stitching</div>
            <div class="radioRow" data-group="stitching" style="margin-top:8px;">
              ${optCard("stitching","normal","Normal buy","As listed","₹0")}
              ${optCard("stitching","stitching","With stitching","Premium tailoring", `+${SL.formatINR(FEES.stitching)}`)}
            </div>
          </div>

          <div style="height:14px;"></div>

          <div id="payError" class="err" style="display:none; font-size:13px;"></div>

          <button class="btn primary" id="payBtn" type="button" style="width:100%; justify-content:center;">
            Pay with Razorpay • <span id="payAmt">${SL.formatINR(grandTotal())}</span>
          </button>

          <div style="margin-top:10px; color:var(--muted); font-size:12px;">
            By paying, you agree to the Terms and Returns & Refund policy.
          </div>
        </div>

        <div class="fade-in" style="display:flex; flex-direction:column; gap:12px;">
          <div class="card" style="padding:14px;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
              <div style="font-weight:900; letter-spacing:-.02em;">Items</div>
              <a class="btn" href="cart.html">Edit cart</a>
            </div>
            <div style="height:10px;"></div>
            ${cartSummaryHTML()}
          </div>

          <div class="card" style="padding:14px;">
            <div style="font-weight:900; letter-spacing:-.02em;">Totals</div>
            <div style="height:10px;"></div>
            <div class="row"><span>Subtotal (items)</span><span>${SL.formatINR(subTotalItems())}</span></div>
            <div class="row"><span>Delivery</span><span>${formatFee(deliveryFee())}</span></div>
            <div class="row"><span>Stitching</span><span>${formatFee(stitchingFee())}</span></div>
            <div style="height:8px;"></div>
            <div class="row grand"><span>Grand Total</span><span>${SL.formatINR(grandTotal())}</span></div>
          </div>
        </div>
      </div>
    `;

    const layout = mount.querySelector("div[style*='grid-template-columns']");
    const apply = () => { layout.style.gridTemplateColumns = window.matchMedia("(max-width: 980px)").matches ? "1fr" : "1.05fr .95fr"; };
    apply();
    window.addEventListener("resize", apply);

    setOptActive("delivery", model.delivery);
    setOptActive("stitching", model.stitching);

    // wire inputs
    mount.querySelectorAll("[data-bind]").forEach(el => {
      const key = el.dataset.bind;
      if (!key) return;
      el.value = model[key] ?? "";
      el.addEventListener("input", () => {
        model[key] = el.value;
        persist();
      });
    });

    mount.querySelectorAll(".opt[data-group][data-value]").forEach(el => {
      el.addEventListener("click", () => {
        const g = el.dataset.group;
        const v = el.dataset.value;
        model[g] = v;
        persist();
        setOptActive(g, v);
        const amt = document.getElementById("payAmt");
        if (amt) amt.textContent = SL.formatINR(grandTotal());
        // update totals panel
        renderTotalsOnly();
      });
    });

    const payBtn = document.getElementById("payBtn");
    if (payBtn) payBtn.addEventListener("click", payNow);
  }

  function renderTotalsOnly() {
    const totalsCard = mount.querySelectorAll(".card")[mount.querySelectorAll(".card").length - 1];
    if (!totalsCard) return;
    totalsCard.innerHTML = `
      <div style="font-weight:900; letter-spacing:-.02em;">Totals</div>
      <div style="height:10px;"></div>
      <div class="row"><span>Subtotal (items)</span><span>${SL.formatINR(subTotalItems())}</span></div>
      <div class="row"><span>Delivery</span><span>${formatFee(deliveryFee())}</span></div>
      <div class="row"><span>Stitching</span><span>${formatFee(stitchingFee())}</span></div>
      <div style="height:8px;"></div>
      <div class="row grand"><span>Grand Total</span><span>${SL.formatINR(grandTotal())}</span></div>
    `;
  }

  function rowCssOnce() {
    const id = "sl_rowcss";
    if (document.getElementById(id)) return;
    const st = document.createElement("style");
    st.id = id;
    st.textContent = `
      .row{display:flex; justify-content:space-between; color:var(--muted); margin-top:8px;}
      .row.grand{color:var(--text); font-weight:900;}
    `;
    document.head.appendChild(st);
  }

  function field(label, key, type, placeholder) {
    return `
      <div class="field">
        <div class="label">${SL.escapeHTML(label)}</div>
        <input class="input" data-bind="${SL.escapeHTML(key)}" type="${SL.escapeHTML(type)}" placeholder="${SL.escapeHTML(placeholder)}">
      </div>
    `;
  }

  function textarea(label, key, placeholder) {
    return `
      <div class="field">
        <div class="label">${SL.escapeHTML(label)}</div>
        <textarea class="textarea" data-bind="${SL.escapeHTML(key)}" placeholder="${SL.escapeHTML(placeholder)}"></textarea>
      </div>
    `;
  }

  function selectField(label, key, items) {
    return `
      <div class="field">
        <div class="label">${SL.escapeHTML(label)}</div>
        <select class="select" data-bind="${SL.escapeHTML(key)}">
          ${items.map(s => `<option value="${SL.escapeHTML(s)}">${SL.escapeHTML(s)}</option>`).join("")}
        </select>
      </div>
    `;
  }

  function optCard(group, value, title, sub, priceLabel) {
    return `
      <div class="opt" data-group="${SL.escapeHTML(group)}" data-value="${SL.escapeHTML(value)}">
        <div class="optTop">
          <div class="optTitle">${SL.escapeHTML(title)}</div>
          <div class="pill" style="font-size:12px; border-color: rgba(212,175,55,.35);">${SL.escapeHTML(priceLabel)}</div>
        </div>
        <div class="optSub">${SL.escapeHTML(sub)}</div>
      </div>
    `;
  }

  function showPayError(msg) {
    const el = document.getElementById("payError");
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
  }

  function clearPayError() {
    const el = document.getElementById("payError");
    if (!el) return;
    el.textContent = "";
    el.style.display = "none";
  }

  function validate() {
    const fullName = String(model.fullName || "").trim();
    const phone = String(model.phone || "").trim();
    const whatsapp = String(model.whatsapp || "").trim();
    const email = String(model.email || "").trim();
    const town = String(model.town || "").trim();
    const pin = String(model.pin || "").trim();
    const street = String(model.street || "").trim();
    const state = String(model.state || "").trim();

    if (!fullName) return "Full Name is required.";
    if (!/^d{10}$/.test(phone)) return "Phone Number must be 10 digits.";
    if (whatsapp && !/^d{10}$/.test(whatsapp)) return "WhatsApp Number must be 10 digits (or leave blank).";
    if (!/^[^s@]+@[^s@]+.[^s@]+$/.test(email)) return "Gmail is invalid.";
    if (!town) return "Village/Town is required.";
    if (!/^d{6}$/.test(pin)) return "Postal PIN code must be 6 digits.";
    if (!street) return "Street address is required.";
    if (!state) return "State is required.";

    // size required per item
    for (const it of cart) {
      if (!it.size) return "One or more items are missing size selection. Please update cart.";
    }
    return "";
  }

  async function payNow() {
    clearPayError();
    const err = validate();
    if (err) { showPayError(err); return; }

    const totalINR = grandTotal();
    const amountPaise = Math.round(totalINR * 100);

    // Create order on server
    let order;
    try {
      const r = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt: `sl_${Date.now()}`,
          notes: {
            brand: "SIDER LEHENGA",
            delivery: model.delivery,
            stitching: model.stitching,
            phone: model.phone
          }
        })
      });
      order = await r.json();
      if (!r.ok || !order.orderId) throw new Error(order?.error || "Order create failed");
    } catch (e) {
      showPayError("Failed to start payment. Please try again.");
      return;
    }

    // Razorpay Checkout
    const options = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "SIDER LEHENGA",
      description: "Lehenga Order Payment",
      order_id: order.orderId,
      theme: { color: "#d4af37" },
      prefill: {
        name: model.fullName,
        email: model.email,
        contact: model.phone
      },
      notes: {
        delivery: model.delivery,
        stitching: model.stitching
      },
      handler: async function (response) {
        try {
          // Verify signature (mandatory) [web:2]
          const vr = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order.orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });
          const vj = await vr.json();
          if (!vr.ok || !vj.ok) throw new Error("verify_failed");

          // Save order to GitHub JSON
          const sr = await fetch("/api/save-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order.orderId,
              paymentId: response.razorpay_payment_id,
              amountINR: totalINR,
              currency: "INR",
              createdAt: new Date().toISOString(),
              delivery: model.delivery,
              deliveryFee: deliveryFee(),
              stitching: model.stitching,
              stitchingFee: stitchingFee(),
              customer: {
                fullName: model.fullName,
                phone: model.phone,
                whatsapp: model.whatsapp,
                email: model.email,
                town: model.town,
                pin: model.pin,
                street: model.street,
                landmark: model.landmark,
                state: model.state
              },
              items: cart.map(it => ({
                id: it.id, title: it.title, price: it.price, qty: it.qty, size: it.size, image: it.image
              }))
            })
          });
          const sj = await sr.json();
          if (!sr.ok || !sj.ok) throw new Error("save_failed");

          // Clear cart after confirmed save
          SL.setCart([]);
          SL.updateCartBadge();

          // Redirect
          location.href = `success.html?orderId=${encodeURIComponent(order.orderId)}&paymentId=${encodeURIComponent(response.razorpay_payment_id)}`;
        } catch (e) {
          location.href = `failed.html?reason=${encodeURIComponent("verification_or_save_failed")}`;
        }
      },
      modal: {
        ondismiss: function () {
          location.href = `failed.html?reason=${encodeURIComponent("dismissed")}`;
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      showPayError("Payment popup failed to open. Please try again.");
    }
  }

  rowCssOnce();
  render();
})();
