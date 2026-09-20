(() => {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches || !window.matchMedia("(pointer: fine)").matches) return;

  const surfaces = document.querySelectorAll(
    ".topbar, .section-jump-nav, .issue-switcher__panel"
  );

  surfaces.forEach((surface) => {
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const paint = () => {
      frame = 0;
      const rect = surface.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = Math.max(0, Math.min(100, ((pointerX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((pointerY - rect.top) / rect.height) * 100));
      surface.style.setProperty("--lg-x", `${x.toFixed(2)}%`);
      surface.style.setProperty("--lg-y", `${y.toFixed(2)}%`);
    };

    surface.addEventListener("pointermove", (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    }, { passive: true });

    surface.addEventListener("pointerleave", () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      surface.style.removeProperty("--lg-x");
      surface.style.removeProperty("--lg-y");
    }, { passive: true });
  });
})();
