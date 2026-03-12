/* ============================================================
   VOSS — SCROLL REVEAL & PARALLAX
   ============================================================ */

export function initScrollEffects() {
  initReveal();
  initParallax();
}

// ── Intersection-observer reveal ──────────────────────────
function initReveal() {
  const revealClasses = ['.reveal-up', '.reveal-left', '.reveal-right', '.reveal-scale'];
  const elements = document.querySelectorAll(revealClasses.join(','));

  if (!elements.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold:  0.1,
    rootMargin: '0px 0px -60px 0px',
  });

  elements.forEach(el => obs.observe(el));
}

// ── Parallax layers ────────────────────────────────────────
function initParallax() {
  // Hero content subtle upward parallax
  const heroContent = document.querySelector('.hero-content');
  if (!heroContent) return;

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const vh = window.innerHeight;

        if (y < vh) {
          const ratio = y / vh;
          // Translate up + fade out gently
          heroContent.style.transform = `translateY(${y * 0.28}px)`;
          heroContent.style.opacity   = Math.max(0, 1 - ratio * 1.6).toFixed(3);
        } else {
          heroContent.style.transform = '';
          heroContent.style.opacity   = '';
        }

        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}
