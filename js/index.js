(async function () {
  SL.mountLayout({ active: "home" });

  const mount = document.getElementById("homeFeaturedMount");
  if (!mount) return;

  let products = [];
  try {
    products = await SL.loadProducts();
  } catch (e) {
    mount.innerHTML = `<div class="card" style="padding:14px;">Failed to load products.</div>`;
    return;
  }

  // shuffle
  const shuffled = products
    .slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, 60);

  function productCard(p) {
    const img = (p.images && p.images[0]) ? p.images[0] : "";
    return `
      <a class="card fade-in" href="product.html?id=${encodeURIComponent(p.id)}"
         style="text-decoration:none; overflow:hidden; display:block;">
        <div style="aspect-ratio: 4/5; background:#f3f4f6; overflow:hidden;">
          <img src="${SL.escapeHTML(img)}" alt="${SL.escapeHTML(p.title)}"
               loading="lazy" decoding="async"
               style="width:100%; height:100%; object-fit:cover; display:block;">
        </div>
        <div style="padding:12px 12px 14px;">
          <div style="font-weight:800; font-size:13px; letter-spacing:-.01em;">
            ${SL.escapeHTML(p.title)}
          </div>
          <div style="display:flex; align-items:baseline; gap:10px; margin-top:8px;">
            <div style="font-weight:900;">${SL.formatINR(p.price)}</div>
            <div style="color:var(--muted); text-decoration:line-through; font-size:13px;">
              ${SL.formatINR(p.comparePrice)}
            </div>
          </div>
          <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
            <span class="pill" style="font-size:12px; padding:6px 10px;">Fast UI</span>
            <span class="pill" style="font-size:12px; padding:6px 10px; border-color: rgba(212,175,55,.45);">Gold accent</span>
          </div>
        </div>
      </a>
    `;
  }

  // Multi-layout: horizontal rail + grid + list preview
  const rail = shuffled.slice(0, 18);
  const grid = shuffled.slice(18, 48);
  const list = shuffled.slice(48, 60);

  mount.innerHTML = `
    <div class="card fade-in" style="padding:14px; overflow:hidden;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
        <div style="font-weight:900; letter-spacing:-.02em;">Trending rail</div>
        <div class="pill" style="border-color: rgba(212,175,55,.45); color:var(--muted); font-size:12px;">Auto-scroll • Medium</div>
      </div>
      <div id="autoRail" style="margin-top:12px; overflow:hidden;">
        <div id="autoRailTrack" style="display:flex; gap:12px; will-change: transform;">
          ${rail.map(p => `
            <a href="product.html?id=${encodeURIComponent(p.id)}" class="card"
               style="text-decoration:none; min-width: 190px; width: 190px; overflow:hidden;">
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
          `).join("")}
        </div>
      </div>
    </div>

    <div style="height:12px;"></div>

    <div class="fade-in" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:12px;">
      ${grid.map(productCard).join("")}
    </div>

    <div style="height:12px;"></div>

    <div class="card fade-in" style="padding:14px;">
      <div style="font-weight:900; letter-spacing:-.02em;">Quick picks</div>
      <div style="margin-top:10px; display:flex; flex-direction:column; gap:10px;">
        ${list.map(p => `
          <a href="product.html?id=${encodeURIComponent(p.id)}" class="card"
             style="text-decoration:none; padding:10px; display:flex; gap:10px; align-items:center;">
            <img src="${SL.escapeHTML(p.images?.[0] || "")}" alt="${SL.escapeHTML(p.title)}"
                 loading="lazy" decoding="async"
                 style="width:64px; height:64px; border-radius:14px; object-fit:cover; border:1px solid var(--border);">
            <div style="flex:1; min-width:0;">
              <div style="font-weight:800; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${SL.escapeHTML(p.title)}
              </div>
              <div style="margin-top:6px; color:var(--muted); font-size:12px;">
                ${SL.formatINR(p.price)} • ${p.vendor ? SL.escapeHTML(p.vendor) : "SIDER"}
              </div>
            </div>
            <div class="pill" style="font-size:12px;">View</div>
          </a>
        `).join("")}
      </div>
    </div>
  `;

  // responsive grid tweak
  const mq = window.matchMedia("(max-width: 900px)");
  const applyGridCols = () => {
    const gridEl = mount.querySelector('div[style*="grid-template-columns"]');
    if (!gridEl) return;
    gridEl.style.gridTemplateColumns = mq.matches ? "repeat(2, 1fr)" : "repeat(3, 1fr)";
    if (window.matchMedia("(max-width: 520px)").matches) gridEl.style.gridTemplateColumns = "1fr";
  };
  applyGridCols();
  window.addEventListener("resize", applyGridCols);

  // Auto-scroll rail (medium speed)
  const track = document.getElementById("autoRailTrack");
  if (track) {
    let x = 0;
    let raf = null;
    let paused = false;

    const loop = () => {
      if (!paused) {
        x += 0.6; // medium speed
        const max = track.scrollWidth - track.parentElement.clientWidth;
        if (x > max + 20) x = 0;
        track.style.transform = `translateX(${-x}px)`;
      }
      raf = requestAnimationFrame(loop);
    };

    track.addEventListener("mouseenter", () => paused = true);
    track.addEventListener("mouseleave", () => paused = false);
    track.addEventListener("touchstart", () => paused = true, { passive: true });
    track.addEventListener("touchend", () => paused = false, { passive: true });

    loop();
    window.addEventListener("beforeunload", () => { if (raf) cancelAnimationFrame(raf); });
  }
})();
