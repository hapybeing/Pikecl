/* ============================================================
   VOSS — ANIMATED COUNTERS
   ============================================================ */

export function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateCounter(el) {
    const target   = parseFloat(el.dataset.count);
    const suffix   = el.dataset.suffix   || '';
    const prefix   = el.dataset.prefix   || '';
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
    const duration = 1800;
    const start    = performance.now();

    function step(now) {
      const elapsed = now - start;
      const t       = Math.min(elapsed / duration, 1);
      const eased   = easeOutCubic(t);
      const current = target * eased;

      el.textContent = prefix + current.toFixed(decimals) + suffix;

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = prefix + target.toFixed(decimals) + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  counters.forEach(el => obs.observe(el));
}
