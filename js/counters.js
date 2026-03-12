/* ============================================================
   VOSS — ANIMATED COUNTERS
   Handles both [data-count] and .hero-stat-num elements
   ============================================================ */

export function initCounters() {
  // Hero stats fire immediately after preloader (already in viewport)
  const heroStats = document.querySelectorAll('.hero-stat-num[data-count]');
  heroStats.forEach(el => {
    setTimeout(() => animateCounter(el), 2400); // after hero animations
  });

  // Section counters fire on scroll
  const scrollCounters = document.querySelectorAll('[data-count]:not(.hero-stat-num)');
  if (!scrollCounters.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  scrollCounters.forEach(el => obs.observe(el));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function animateCounter(el) {
  const target   = parseFloat(el.dataset.count);
  const suffix   = el.dataset.suffix   || '';
  const prefix   = el.dataset.prefix   || '';
  const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
  const duration = 1600;
  const start    = performance.now();

  function step(now) {
    const t       = Math.min((now - start) / duration, 1);
    const current = target * easeOutCubic(t);
    el.textContent = prefix + current.toFixed(decimals) + suffix;
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = prefix + target.toFixed(decimals) + suffix;
  }

  requestAnimationFrame(step);
}
