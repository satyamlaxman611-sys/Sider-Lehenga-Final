(function () {
  function shouldReduceMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isMobileish() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  }

  function showFallback(canvas, img) {
    if (canvas) canvas.style.display = "none";
    if (img) img.style.display = "block";
  }

  function init({ canvasId, fallbackImgId, accent = 0xd4af37 } = {}) {
    const canvas = document.getElementById(canvasId);
    const fallback = document.getElementById(fallbackImgId);
    if (!canvas) return;

    if (shouldReduceMotion() || isMobileish()) {
      showFallback(canvas, fallback);
      return;
    }

    if (!window.THREE) {
      showFallback(canvas, fallback);
      return;
    }

    const THREE = window.THREE;

    let renderer, scene, camera, mesh, controls, raf = null;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(38, canvas.clientWidth / canvas.clientHeight, 0.1, 50);
      camera.position.set(0.0, 0.4, 2.6);

      const ambient = new THREE.AmbientLight(0xffffff, 0.65);
      scene.add(ambient);

      const key = new THREE.DirectionalLight(0xffffff, 0.9);
      key.position.set(2, 2, 2);
      scene.add(key);

      const rim = new THREE.PointLight(accent, 0.75, 10);
      rim.position.set(-2, 0.4, 2.2);
      scene.add(rim);

      // "Glass" card geometry
      const geo = new THREE.BoxGeometry(1.6, 1.0, 0.14, 1, 1, 1);

      // Simple glass-ish material (works with non-physical older builds)
      const mat = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.18,
        shininess: 120,
        specular: new THREE.Color(accent),
        side: THREE.DoubleSide
      });

      mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);

      // Gold edge wireframe for premium rim
      const edge = new THREE.EdgesGeometry(geo, 35);
      const edgeMat = new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.55 });
      const wire = new THREE.LineSegments(edge, edgeMat);
      mesh.add(wire);

      // Controls (optional if file provided)
      if (THREE.OrbitControls) {
        controls = new THREE.OrbitControls(camera, canvas);
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.35;
      }

      let t = 0;
      const animate = () => {
        t += 0.008; // slow idle
        mesh.rotation.y = t;
        mesh.rotation.x = Math.sin(t * 0.55) * 0.12;

        if (controls) controls.update();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
      animate();

      const onResize = () => {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);

      // Touch / mouse tilt
      const tilt = (nx, ny) => {
        mesh.rotation.y = t + nx * 0.35;
        mesh.rotation.x = (Math.sin(t * 0.55) * 0.12) + ny * -0.22;
      };

      const onMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = ("touches" in e) ? e.touches[0].clientX : e.clientX;
        const y = ("touches" in e) ? e.touches[0].clientY : e.clientY;
        const nx = ((x - rect.left) / rect.width) * 2 - 1;
        const ny = ((y - rect.top) / rect.height) * 2 - 1;
        tilt(nx, ny);
      };

      canvas.addEventListener("mousemove", onMove, { passive: true });
      canvas.addEventListener("touchmove", onMove, { passive: true });

    } catch (e) {
      if (raf) cancelAnimationFrame(raf);
      showFallback(canvas, fallback);
    }
  }

  window.SL_GlassCard = { init };
})();
