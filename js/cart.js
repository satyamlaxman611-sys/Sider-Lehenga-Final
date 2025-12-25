(function () {
  SL.mountLayout({ active: "cart" });

  const mount = document.getElementById("cartMount");
  if (!mount) return;

  function subtotal(cart) {
    return cart.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 0), 0);
  }

  function render() {
    const cart = SL.getCart();

    if (!cart.length) {
      mount.innerHTML = `
        <div class="card fade-in" style="padding:14px;">
          <div style="font-weight:900; letter-spacing:-.02em;">Cart is empty</div>
          <div style="color:var(--muted); margin-top:6px;">Add a lehenga to continue.</div>
          <div style="margin-top:12px;">
            <a class="btn primary" href="products.html">Browse all lehengas</a>
          </div>
        </div>`;
      SL.updateCartBadge();
      return;
    }

    const sub = subtotal(cart);

    mount.innerHTML = `
      <div style="display:grid; grid-template-columns: 1.1fr .9fr; gap:12px;">
        <div class="card" style="padding:12px;">
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${cart.map(it => `
              <div class="card" style="padding:10px; display:flex; gap:10px; align-items:center;">
                <img src="${SL.escapeHTML(it.image || "")}" alt="${SL.escapeHTML(it.title)}"
                     style="width:76px; height:76px; border-radius:14px; object-fit:cover; border:1px solid var(--border); background:#f3f4f6;">
                <div style="flex:1; min-width:0;">
                  <div style="font-weight:800; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${SL.escapeHTML(it.title)}
                  </div>
                  <div style="margin-top:6px; color:var(--muted); font-size:12px;">
                    Size: <strong>${SL.escapeHTML(it.size || "-")}</strong>
                  </div>
                  <div style="margin-top:6px; font-weight:900;">${SL.formatINR(it.price)}</div>
                </div>

                <div style="display:flex; flex-direction:column; gap:8px; align-items:flex-end;">
                  <div style="display:flex; gap:8px; align-items:center;">
                    <button class="icon-btn" data-act="dec" data-key="${SL.escapeHTML(it.key)}" type="button" aria-label="Decrease">−</button>
                    <div class="pill" style="min-width:44px; justify-content:center;">${Number(it.qty)||1}</div>
                    <button class="icon-btn" data-act="inc" data-key="${SL.escapeHTML(it.key)}" type="button" aria-label="Increase">+</button>
                  </div>
                  <button class="btn" data-act="remove" data-key="${SL.escapeHTML(it.key)}" type="button">Remove</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="card" style="padding:14px; height:fit-content;">
          <div style="font-weight:900; letter-spacing:-.02em;">Order summary</div>
          <div style="margin-top:10px; display:flex; justify-content:space-between; color:var(--muted);">
            <span>Subtotal (items)</span>
            <span>${SL.formatINR(sub)}</span>
          </div>
          <div style="margin-top:10px; color:var(--muted); font-size:13px;">
            Delivery (+₹150 Express) and Stitching (+₹700) are selected in checkout (per order).
          </div>
          <div style="margin-top:14px;">
            <a class="btn primary" href="checkout.html" style="width:100%; justify-content:center;">Proceed to checkout</a>
          </div>
        </div>
      </div>
    `;

    // responsive
    const wrap = mount.querySelector("div[style*='grid-template-columns']");
    if (wrap) {
      const apply = () => {
        wrap.style.gridTemplateColumns = window.matchMedia("(max-width: 980px)").matches ? "1fr" : "1.1fr .9fr";
      };
      apply();
      window.addEventListener("resize", apply);
    }

    SL.updateCartBadge();
  }

  function mutate(key, fn) {
    const cart = SL.getCart();
    const i = cart.findIndex(x => x.key === key);
    if (i < 0) return;
    fn(cart[i], cart);
    SL.setCart(cart);
    render();
  }

  mount.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act][data-key]");
    if (!btn) return;
    const act = btn.dataset.act;
    const key = btn.dataset.key;

    if (act === "inc") mutate(key, (it) => it.qty = SL.clamp((Number(it.qty)||1)+1, 1, 99));
    if (act === "dec") mutate(key, (it, cart) => {
      const q = SL.clamp((Number(it.qty)||1)-1, 1, 99);
      it.qty = q;
    });
    if (act === "remove") mutate(key, (it, cart) => {
      const idx = cart.findIndex(x => x.key === key);
      if (idx >= 0) cart.splice(idx, 1);
    });
  });

  render();
})();
