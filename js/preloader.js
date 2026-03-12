/* ============================================================
   VOSS — PRELOADER
   ============================================================ */

export function initPreloader(onComplete) {
  const el       = document.getElementById('preloader');
  const bar      = document.getElementById('pre-bar');
  const counter  = document.getElementById('pre-counter');
  const eegPath  = document.querySelector('.pre-eeg-path');

  if (!el) { onComplete?.(); return; }

  // Prevent page scroll during load
  document.body.style.overflow = 'hidden';

  // Kick off EEG path animation
  setTimeout(() => {
    eegPath?.classList.add('animate');
  }, 100);

  // Progress simulation
  let progress = 0;
  const totalMs = 2600;
  const startTime = performance.now();

  // Easing: ease-out cubic
  function ease(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function tick(now) {
    const elapsed = now - startTime;
    const rawT    = Math.min(elapsed / totalMs, 1);
    progress      = Math.round(ease(rawT) * 100);

    bar.style.width       = progress + '%';
    counter.textContent   = String(progress).padStart(3, '0');

    if (rawT < 1) {
      requestAnimationFrame(tick);
    } else {
      finish();
    }
  }

  requestAnimationFrame(tick);

  function finish() {
    // Brief hold at 100
    setTimeout(() => {
      el.classList.add('exiting');

      el.addEventListener('transitionend', () => {
        el.remove();
        document.body.style.overflow = '';
        onComplete?.();
      }, { once: true });
    }, 350);
  }
}
