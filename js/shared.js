(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function formatINR(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return "₹0";
    return "₹" + v.toLocaleString("en-IN");
  }

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function escapeHTML(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Cart
  const CART_KEY = "sl_cart_v1";
  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
    catch { return []; }
  }
  function setCart(items) { localStorage.setItem(CART_KEY, JSON.stringify(items || [])); }

  function cartCount() {
    const c = getCart();
    return c.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
  }

  function updateCartBadge() {
    const el = $(".cart-badge");
    if (!el) return;
    const count = cartCount();
    el.textContent = String(count);
    el.style.display = count > 0 ? "grid" : "none";
  }

  function addToCart({ id, title, price, image, size }, qty = 1) {
    const cart = getCart();
    const key = `${id}__${size || ""}`;
    const existing = cart.find(x => x.key === key);
    if (existing) {
      existing.qty = clamp((Number(existing.qty) || 0) + qty, 1, 99);
    } else {
      cart.push({
        key,
        id,
        title,
        price: Number(price) || 0,
        image: image || "",
        size: size || "",
        qty: clamp(qty, 1, 99)
      });
    }
    setCart(cart);
    updateCartBadge();
  }

  // Drawer
  function initDrawer() {
    const backdrop = $(".drawer-backdrop");
    const drawer = $(".drawer");
    const btn = $("#navMenuBtn");
    const closeBtn = $("#drawerCloseBtn");
    if (!backdrop || !drawer || !btn || !closeBtn) return;

    const open = () => { backdrop.classList.add("open"); drawer.classList.add("open"); document.body.style.overflow = "hidden"; };
    const close = () => { backdrop.classList.remove("open"); drawer.classList.remove("open"); document.body.style.overflow = ""; };

    btn.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

    // expose
    window.SL_Drawer = { open, close };
  }

  // Fade-in on view
  function initReveal() {
    const els = $$(".fade-in");
    if (!els.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });

    els.forEach(el => io.observe(el));
  }

  function svgIcon(name) {
    if (name === "cart") {
      return `
<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M6 7h15l-2 9H7L6 7Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M6 7 5 4H2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M8 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor"/>
  <path d="M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor"/>
</svg>`;
    }
    if (name === "dots") {
      return `
<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M6.5 12a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" fill="currentColor"/>
  <path d="M13.5 12a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" fill="currentColor"/>
  <path d="M20.5 12a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" fill="currentColor"/>
</svg>`;
    }
    if (name === "chev") {
      return `<span aria-hidden="true">→</span>`;
    }
    return "";
  }

  function headerHTML(active = "") {
    return `
<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="index.html" aria-label="SIDER LEHENGA Home">
      <img src="assets/pictures/logo.png" alt="SIDER LEHENGA logo">
      <div class="meta">
        <div class="name">SIDER LEHENGA</div>
        <div class="tagline">Premium Lehenga in Lowest Price</div>
      </div>
    </a>

    <div class="header-actions">
      <a class="icon-btn" href="cart.html" aria-label="Cart" style="position:relative">
        ${svgIcon("cart")}
        <div class="cart-badge" style="display:none"></div>
      </a>
      <button class="icon-btn" id="navMenuBtn" type="button" aria-label="Menu">
        ${svgIcon("dots")}
      </button>
    </div>
  </div>
</header>

<div class="drawer-backdrop"></div>
<aside class="drawer" aria-label="Navigation drawer">
  <div class="drawer-header">
    <div class="drawer-title">Navigate</div>
    <button class="drawer-close" id="drawerCloseBtn" type="button" aria-label="Close menu">✕</button>
  </div>
  <div class="drawer-body">
    <nav class="nav-list">
      <a class="nav-item" href="index.html">Home <span>Index</span></a>
      <a class="nav-item" href="products.html">All Lehengas <span>115</span></a>
      <a class="nav-item" href="about.html">About <span>Brand</span></a>
      <a class="nav-item" href="contact.html">Contact <span>Support</span></a>
      <a class="nav-item" href="returns-refund.html">Returns & Refund <span>Policy</span></a>
      <a class="nav-item" href="terms.html">Terms <span>Legal</span></a>
      <a class="nav-item" href="admin/panel-auth-9x72.html">Admin <span>Login</span></a>
      <a class="nav-item" href="about-developer.html">About Developer <span>3D</span></a>
    </nav>
  </div>
</aside>
`;
  }

  function footerHTML() {
    return `
<footer class="site-footer" aria-label="Footer">
  <div class="footer-pattern" aria-hidden="true">
    <img src="assets/pictures/footer-pattern.jpg" alt="" loading="lazy" decoding="async">
  </div>

  <div class="footer-bottom">
    <div class="footer-brand">
      <div class="footer-title">SIDER LEHENGA</div>
      <div class="footer-tagline">Premium Lehenga in Lowest Price</div>
    </div>

    <div class="footer-links">
      <a href="about.html">About</a>
      <a href="contact.html">Contact</a>
      <a href="terms.html">Terms</a>
      <a href="returns-refund.html">Returns & Refund</a>
    </div>
  </div>
</footer>`;
  }

  function mountLayout({ active = "" } = {}) {
    const mountHeader = document.getElementById("siteHeaderMount");
    const mountFooter = document.getElementById("siteFooterMount");
    if (mountHeader) mountHeader.innerHTML = headerHTML(active);
    if (mountFooter) mountFooter.innerHTML = footerHTML();

    initDrawer();
    updateCartBadge();
    initReveal();
  }

  async function loadProducts() {
    const res = await fetch("products-data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load products-data.json");
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("products-data.json must be an array");
    return data.filter(p => p && p.visible !== false);
  }

  window.SL = {
    $,
    $$,
    formatINR,
    escapeHTML,
    clamp,
    mountLayout,
    loadProducts,
    getCart,
    setCart,
    addToCart,
    cartCount,
    updateCartBadge
  };
})();
