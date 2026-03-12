/* ============================================================
   VOSS — NAVIGATION
   ============================================================ */

export function initNav() {
  const nav    = document.getElementById('nav');
  const burger = document.querySelector('.nav-burger');
  const mobileNav = document.querySelector('.mobile-nav');
  const navLinks  = document.querySelectorAll('.nav-link');
  const sections  = document.querySelectorAll('section[id], div[id]');

  if (!nav) return;

  // ── Scroll state ─────────────────────────────────────────
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;

        // Sticky class
        nav.classList.toggle('scrolled', y > 60);

        // Active section highlight
        let current = '';
        sections.forEach(sec => {
          const top    = sec.offsetTop - 120;
          const bottom = top + sec.offsetHeight;
          if (y >= top && y < bottom) current = sec.id;
        });

        navLinks.forEach(link => {
          const href = link.getAttribute('href')?.replace('#', '');
          link.classList.toggle('active', href === current);
        });

        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // initial

  // ── Smooth anchor scroll ─────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id === '#') return;

      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();

      const navH   = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-h'));
      const top    = target.getBoundingClientRect().top + window.scrollY - (navH || 88);

      window.scrollTo({ top, behavior: 'smooth' });

      // Close mobile menu if open
      mobileNav?.classList.remove('open');
      burger?.classList.remove('open');
    });
  });

  // ── Mobile burger ────────────────────────────────────────
  burger?.addEventListener('click', () => {
    const isOpen = burger.classList.toggle('open');
    mobileNav?.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // ── Close mobile nav on resize ───────────────────────────
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      mobileNav?.classList.remove('open');
      burger?.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}
