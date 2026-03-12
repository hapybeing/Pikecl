/* ============================================================
   VOSS — CUSTOM CURSOR
   ============================================================ */

export function initCursor() {
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');

  if (!dot || !ring) return;

  // Touch devices: hide cursor
  if (window.matchMedia('(pointer: coarse)').matches) {
    dot.style.display  = 'none';
    ring.style.display = 'none';
    document.body.style.cursor = 'auto';
    return;
  }

  let mouseX = window.innerWidth  / 2;
  let mouseY = window.innerHeight / 2;
  let ringX  = mouseX;
  let ringY  = mouseY;
  let raf    = null;

  // ── Track mouse ─────────────────────────────────────────
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';
  });

  document.addEventListener('mouseleave', () => {
    document.body.classList.add('cursor-hidden');
  });

  document.addEventListener('mouseenter', () => {
    document.body.classList.remove('cursor-hidden');
  });

  // ── Lerp ring loop ───────────────────────────────────────
  function lerp(a, b, t) { return a + (b - a) * t; }

  function loop() {
    ringX = lerp(ringX, mouseX, 0.11);
    ringY = lerp(ringY, mouseY, 0.11);
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    raf = requestAnimationFrame(loop);
  }

  loop();

  // ── Hover states ─────────────────────────────────────────
  const interactiveSelectors = [
    'a', 'button', '[data-cursor="hover"]',
    '.nav-cta', '.btn', '.research-card',
    '.pub-item', '.talk-card', '.timeline-item',
    '.affiliation-item', '.method-item',
    '.footer-link', '.footer-social-link'
  ];

  function addHoverState(selector) {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('mouseenter', () => {
        document.body.classList.add('cursor-hover');
      });
      el.addEventListener('mouseleave', () => {
        document.body.classList.remove('cursor-hover');
      });
    });
  }

  interactiveSelectors.forEach(addHoverState);

  // Text cursor for inputs
  document.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('mouseenter', () => {
      document.body.classList.remove('cursor-hover');
      document.body.classList.add('cursor-text');
    });
    el.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-text');
    });
  });

  // ── Magnetic effect for primary buttons ──────────────────
  const magneticEls = document.querySelectorAll('.btn-primary, .nav-cta, [data-magnetic]');

  magneticEls.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width  / 2);
      const dy = e.clientY - (rect.top  + rect.height / 2);
      el.style.transform = `translate(${dx * 0.16}px, ${dy * 0.2}px)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });

  // ── Click pulse ──────────────────────────────────────────
  document.addEventListener('mousedown', () => {
    ring.style.transform = 'translate(-50%,-50%) scale(0.8)';
    dot.style.transform  = 'translate(-50%,-50%) scale(0.6)';
  });

  document.addEventListener('mouseup', () => {
    ring.style.transform = '';
    dot.style.transform  = '';
  });
}
