(async function () {
  SL.mountLayout({ active: "product" });

  const mount = document.getElementById("productMount");
  if (!mount) return;

  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  if (!id) {
    mount.innerHTML = `<div class="card" style="padding:14px;">Missing product id.</div>`;
    return;
  }

  let products = [];
  try { products = await SL.loadProducts(); }
  catch {
    mount.innerHTML = `<div class="card" style="padding:14px;">Failed to load products.</div>`;
    return;
  }

  const product = products.find(p => String(p.id) === String(id));
  if (!product) {
    mount.innerHTML = `<div class="card" style="padding:14px;">Product not found.</div>`;
    return;
  }

  const imgs = Array.isArray(product.images) ? product.images : [];
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const hasCompare = Number(product.comparePrice) > Number(product.price);

  mount.innerHTML = `
    <div class="fade-in" style="display:grid; grid-template-columns: 1.05fr .95fr; gap:14px;">
      <div class="card" style="overflow:hidden;">
        <div style="position:relative; background:#f3f4f6;">
          <img id="mainImg" src="${SL.escapeHTML(imgs[0] || "")}" alt="${SL.escapeHTML(product.title)}"
               style="width:100%; height:min(520px, 70vh); object-fit:cover; display:block;">
          <div style="position:absolute; inset:0; pointer-events:none; background: radial-gradient(600px 260px at 20% 20%, rgba(212,175,55,.16), transparent 55%);"></div>
        </div>

        <div style="padding:10px; border-top:1px solid var(--border);">
          <div id="thumbs" style="display:flex; gap:10px; overflow:auto; padding-bottom:2px;"></div>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:12px;">
        <div class="card" style="padding:14px;">
          <div style="font-weight:900; font-size:18px; letter-spacing:-.02em;">${SL.escapeHTML(product.title)}</div>
          <div style="margin-top:10px; display:flex; align-items:baseline; gap:10px; flex-wrap:wrap;">
            <div style="font-weight:900; font-size:20px;">${SL.formatINR(product.price)}</div>
            ${hasCompare ? `<div style="color:var(--muted); text-decoration:line-through;">${SL.formatINR(product.comparePrice)}</div>` : ""}
            <div class="pill" style="border-color: rgba(212,175,55,.45); color:var(--muted); font-size:12px;">
              Secure Razorpay checkout
            </div>
          </div>

          <div style="margin-top:12px;">
            <div style="font-weight:800; font-size:13px; margin-bottom:8px;">Select size (required)</div>
            <div id="sizeChips" style="display:flex; flex-wrap:wrap; gap:8px;"></div>
            <div id="sizeError" style="display:none; margin-top:10px; color:#9a3412; font-size:13px;">
              Please select a size.
            </div>
          </div>

          <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn primary" id="addCartBtn" type="button">Add to cart</button>
            <a class="btn" href="cart.html">Go to cart</a>
          </div>

          <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
            <div class="pill"><span style="color:var(--muted); font-size:13px;">Normal:</span> <strong style="font-size:13px;">7–10 days</strong></div>
            <div class="pill"><span style="color:var(--muted); font-size:13px;">Express:</span> <strong style="font-size:13px;">3–5 days (+₹150)</strong></div>
          </div>
        </div>

        <div class="card" style="padding:14px;">
          <div style="font-weight:900; letter-spacing:-.02em;">Details</div>
          <div style="color:var(--muted); margin-top:8px; font-size:13px;">
            Vendor: ${SL.escapeHTML(product.vendor || "SIDER LEHENGA")}
          </div>
          <div id="descHtml" style="margin-top:10px; color:var(--text); font-size:14px;"></div>
        </div>

        <div class="card" style="padding:14px;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
            <div style="font-weight:900; letter-spacing:-.02em;">More you may like</div>
            <a class="btn" href="products.html">Explore all</a>
          </div>
          <div id="moreRail" style="margin-top:12px; overflow:hidden;">
            <div id="moreTrack" style="display:flex; gap:12px; will-change: transform;"></div>
          </div>
        </div>

      </div>
    </div>
  `;

  // thumbs
  const thumbs = document.getElementById("thumbs");
  const mainImg = document.getElementById("mainImg");
  if (thumbs && mainImg) {
    thumbs.innerHTML = imgs.map((u, idx) => `
      <button type="button" data-i="${idx}"
        class="card"
        style="border-radius:14px; overflow:hidden; border:1px solid var(--border); padding:0; cursor:pointer; background:#fff;">
        <img src="${SL.escapeHTML(u)}" alt="Image ${idx+1}" loading="lazy" decoding="async"
             style="width:86px; height:86px; object-fit:cover; display:block;">
      </button>
    `).join("");
    thumbs.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-i]");
      if (!b) return;
      const i = Number(b.dataset.i);
      const src = imgs[i];
      if (src) mainImg.src = src;
    });
  }

  // sizes
  let selectedSize = "";
  const sizeChips = document.getElementById("sizeChips");
  const sizeError = document.getElementById("sizeError");

  function setSize(s) {
    selectedSize = s;
    if (sizeError) sizeError.style.display = selectedSize ? "none" : "block";
    if (sizeChips) {
      Array.from(sizeChips.querySelectorAll("button[data-size]")).forEach(btn => {
        const active = btn.dataset.size === selectedSize;
        btn.style.borderColor = active ? "rgba(212,175,55,.75)" : "var(--border)";
        btn.style.boxShadow = active ? "0 0 0 6px rgba(212,175,55,.12)" : "none";
      });
    }
  }

  if (sizeChips) {
    sizeChips.innerHTML = sizes.map(s => `
      <button type="button" data-size="${SL.escapeHTML(s)}"
        class="pill"
        style="cursor:pointer; border-color: var(--border); background: rgba(255,255,255,.8);">
        ${SL.escapeHTML(s)}
      </button>
    `).join("");
    sizeChips.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-size]");
      if (!b) return;
      setSize(b.dataset.size || "");
    });
  }

  // desc
  const desc = document.getElementById("descHtml");
  if (desc) desc.innerHTML = product.descriptionHtml || "<div style='color:var(--muted)'>No description.</div>";

  // more rail (random)
  const more = products.filter(p => p.id !== product.id).sort(() => Math.random() - 0.5).slice(0, 14);
  const moreTrack = document.getElementById("moreTrack");
  if (moreTrack) {
    moreTrack.innerHTML = more.map(p => `
      <a href="product.html?id=${encodeURIComponent(p.id)}" class="card"
         style="text-decoration:none; min-width: 180px; width: 180px; overflow:hidden;">
        <div style="aspect-ratio: 4/5; background:#f3f4f6;">
          <img src="${SL.escapeHTML(p.images?.[0] || "")}" alt="${SL.escapeHTML(p.title)}"
               loading="lazy" decoding="async"
               style="width:100%; height:100%; object-fit:cover; display:block;">
        </div>
        <div style="padding:10px;">
          <div style="font-weight:800; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${SL.escapeHTML(p.title)}
          </div>
          <div style="margin-top:6px; font-weight:900; font-size:13px;">${SL.formatINR(p.price)}</div>
        </div>
      </a>
    `).join("");

    // medium auto-scroll
    let x = 0, raf = null, paused = false;
    const loop = () => {
      if (!paused) {
        x += 0.6;
        const max = moreTrack.scrollWidth - moreTrack.parentElement.clientWidth;
        if (x > max + 20) x = 0;
        moreTrack.style.transform = `translateX(${-x}px)`;
      }
      raf = requestAnimationFrame(loop);
    };
    moreTrack.addEventListener("mouseenter", () => paused = true);
    moreTrack.addEventListener("mouseleave", () => paused = false);
    moreTrack.addEventListener("touchstart", () => paused = true, { passive: true });
    moreTrack.addEventListener("touchend", () => paused = false, { passive: true });
    loop();
    window.addEventListener("beforeunload", () => { if (raf) cancelAnimationFrame(raf); });
  }

  // Add to cart
  const addBtn = document.getElementById("addCartBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      if (!selectedSize) {
        if (sizeError) sizeError.style.display = "block";
        return;
      }
      SL.addToCart({
        id: product.id,
        title: product.title,
        price: product.price,
        image: (imgs[0] || ""),
        size: selectedSize
      }, 1);
      addBtn.textContent = "Added ✓";
      setTimeout(() => addBtn.textContent = "Add to cart", 900);
    });
  }

  // responsive
  const apply = () => {
    const wrap = mount.querySelector(".fade-in");
    if (!wrap) return;
    wrap.style.gridTemplateColumns = window.matchMedia("(max-width: 980px)").matches ? "1fr" : "1.05fr .95fr";
  };
  apply();
  window.addEventListener("resize", apply);
})();
