(function () {
  const TOKEN_KEY = "sl_admin_token_v1";
  const EXP_KEY = "sl_admin_exp_v1";

  function setSession(token, expiresInSec) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EXP_KEY, String(Date.now() + (expiresInSec * 1000)));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXP_KEY);
  }

  function isAuthed() {
    const t = localStorage.getItem(TOKEN_KEY);
    const exp = Number(localStorage.getItem(EXP_KEY) || 0);
    return !!t && Date.now() < exp;
  }

  function requireAuthOrRedirect() {
    if (!isAuthed()) location.href = "panel-auth-9x72.html";
  }

  function formatINR(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return "₹0";
    return "₹" + v.toLocaleString("en-IN");
  }

  function escapeHTML(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function login(username, password) {
    const r = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const j = await r.json();
    if (!r.ok || !j.ok) return { ok: false };
    setSession(j.token, j.expiresInSec || (60 * 60 * 8));
    return { ok: true };
  }

  async function fetchOrders() {
    const r = await fetch("/api/get-orders", { method: "GET" });
    const j = await r.json();
    if (!r.ok || !j.ok) throw new Error("get_orders_failed");
    return Array.isArray(j.orders) ? j.orders : [];
  }

  function sumRevenue(orders) {
    return orders.reduce((sum, o) => sum + (Number(o.amountINR) || 0), 0);
  }

  function sumItems(orders) {
    return orders.reduce((sum, o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      return sum + items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
    }, 0);
  }

  function byDay(orders) {
    const map = new Map();
    for (const o of orders) {
      const d = String(o.createdAt || "").slice(0, 10) || "unknown";
      map.set(d, (map.get(d) || 0) + (Number(o.amountINR) || 0));
    }
    return Array.from(map.entries()).sort((a,b) => String(a[0]).localeCompare(String(b[0])));
  }

  function drawBarChart(canvas, series) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width = canvas.clientWidth * devicePixelRatio;
    const h = canvas.height = canvas.clientHeight * devicePixelRatio;
    ctx.clearRect(0,0,w,h);

    const pad = 18 * devicePixelRatio;
    const chartW = w - pad*2;
    const chartH = h - pad*2;

    const values = series.map(x => x[1]);
    const max = Math.max(1, ...values);

    // axes
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(230,232,236,1)";
    ctx.lineWidth = 1 * devicePixelRatio;
    ctx.beginPath();
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, pad + chartH);
    ctx.lineTo(pad + chartW, pad + chartH);
    ctx.stroke();

    const n = Math.max(1, series.length);
    const gap = 10 * devicePixelRatio;
    const barW = (chartW - gap*(n-1)) / n;

    // bars
    for (let i=0;i<n;i++){
      const v = series[i][1];
      const x = pad + i*(barW + gap);
      const barH = (v / max) * (chartH - 8*devicePixelRatio);
      const y = pad + chartH - barH;

      const grd = ctx.createLinearGradient(0, y, 0, y + barH);
      grd.addColorStop(0, "rgba(212,175,55,.55)");
      grd.addColorStop(1, "rgba(212,175,55,.15)");

      ctx.fillStyle = grd;
      roundRect(ctx, x, y, barW, barH, 10*devicePixelRatio);
      ctx.fill();
      ctx.strokeStyle = "rgba(212,175,55,.35)";
      ctx.stroke();
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr, y);
    ctx.arcTo(x+w, y, x+w, y+h, rr);
    ctx.arcTo(x+w, y+h, x, y+h, rr);
    ctx.arcTo(x, y+h, x, y, rr);
    ctx.arcTo(x, y, x+w, y, rr);
    ctx.closePath();
  }

  // Page routers
  document.addEventListener("DOMContentLoaded", async () => {
    const page = document.body.dataset.page;

    if (page === "auth") {
      const form = document.getElementById("adminLoginForm");
      const err = document.getElementById("adminErr");
      if (!form) return;

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (err) err.style.display = "none";
        const u = (document.getElementById("adminUser").value || "").trim();
        const p = (document.getElementById("adminPass").value || "").trim();

        const out = await login(u, p);
        if (!out.ok) {
          if (err) { err.textContent = "Invalid credentials"; err.style.display = "block"; }
          return;
        }
        location.href = "panel-dashboard-x2872.html";
      });

      return;
    }

    if (page === "dash") {
      requireAuthOrRedirect();

      const logoutBtn = document.getElementById("adminLogoutBtn");
      if (logoutBtn) logoutBtn.addEventListener("click", () => { clearSession(); location.href = "panel-auth-9x72.html"; });

      const mount = document.getElementById("ordersMount");
      const kpiOrders = document.getElementById("kpiOrders");
      const kpiRevenue = document.getElementById("kpiRevenue");
      const kpiItems = document.getElementById("kpiItems");
      const chartCanvas = document.getElementById("revChart");

      let orders = [];
      try { orders = await fetchOrders(); }
      catch {
        if (mount) mount.innerHTML = `<div class="card" style="padding:14px;">Failed to load orders.</div>`;
        return;
      }

      if (kpiOrders) kpiOrders.textContent = String(orders.length);
      if (kpiRevenue) kpiRevenue.textContent = formatINR(sumRevenue(orders));
      if (kpiItems) kpiItems.textContent = String(sumItems(orders));

      const series = byDay(orders).slice(-12);
      if (chartCanvas) {
        chartCanvas.style.width = "100%";
        chartCanvas.style.height = "180px";
        drawBarChart(chartCanvas, series);
        window.addEventListener("resize", () => drawBarChart(chartCanvas, series));
      }

      // table
      if (mount) {
        const rows = orders.slice(0, 120).map(o => {
          const c = o.customer || {};
          const items = Array.isArray(o.items) ? o.items : [];
          const itemText = items.map(it => `${it.qty}× ${it.title} (${it.size})`).join("
");

          return `
            <tr>
              <td>
                <div style="font-weight:900;">${escapeHTML(o.orderId || "-")}</div>
                <div class="small">Pay: ${escapeHTML(o.paymentId || "-")}</div>
                <div class="small">${escapeHTML(String(o.createdAt || "").replace("T"," ").slice(0,19))}</div>
              </td>
              <td>
                <div style="font-weight:900;">${escapeHTML(c.fullName || "-")}</div>
                <div class="small">Phone: ${escapeHTML(c.phone || "-")}</div>
                <div class="small">WhatsApp: ${escapeHTML(c.whatsapp || "-")}</div>
                <div class="small">Email: ${escapeHTML(c.email || "-")}</div>
              </td>
              <td>
                <div class="small">${escapeHTML(c.street || "")}</div>
                <div class="small">${escapeHTML(c.landmark || "")}</div>
                <div class="small">${escapeHTML(c.town || "")} • ${escapeHTML(c.pin || "")}</div>
                <div class="small">${escapeHTML(c.state || "")}</div>
              </td>
              <td>
                <div style="white-space:pre-line" class="small">${escapeHTML(itemText)}</div>
                <div class="small" style="margin-top:8px;">
                  Delivery: <strong>${escapeHTML(o.delivery || "-")}</strong> (${formatINR(o.deliveryFee || 0)})
                </div>
                <div class="small">
                  Stitching: <strong>${escapeHTML(o.stitching || "-")}</strong> (${formatINR(o.stitchingFee || 0)})
                </div>
              </td>
              <td style="font-weight:900;">${formatINR(o.amountINR || 0)}</td>
            </tr>
          `;
        }).join("");

        mount.innerHTML = `
          <div class="card" style="padding:12px; overflow:auto;">
            <table class="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Address</th>
                  <th>Items & Options</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>${rows || ""}</tbody>
            </table>
          </div>
        `;
      }

      return;
    }
  });

  window.SL_ADMIN = { isAuthed };
})();
