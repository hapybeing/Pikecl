/* ============================================================
   VOSS — PRELOADER
   ============================================================ */

export function initPreloader(onComplete) {
  const el      = document.getElementById('preloader');
  const bar     = document.getElementById('pre-bar');
  const counter = document.getElementById('pre-counter');
  const eegPath = document.querySelector('.pre-eeg-path');

  if (!el) { onComplete?.(); return; }

  document.body.style.overflow = 'hidden';

  setTimeout(() => { eegPath?.classList.add('animate'); }, 100);

  const totalMs  = 2400;
  const startTime = performance.now();

  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  function tick(now) {
    const rawT   = Math.min((now - startTime) / totalMs, 1);
    const progress = Math.round(ease(rawT) * 100);

    bar.style.width     = progress + '%';
    counter.textContent = String(progress).padStart(3, '0');

    if (rawT < 1) {
      requestAnimationFrame(tick);
    } else {
      finish();
    }
  }

  requestAnimationFrame(tick);

  function finish() {
    setTimeout(() => {
      // Fade out
      el.classList.add('exiting');

      // Guaranteed removal — no reliance on transitionend
      setTimeout(() => {
        el.style.display = 'none';
        document.body.style.overflow = '';
        onComplete?.();
      }, 1000);
    }, 300);
  }
}
