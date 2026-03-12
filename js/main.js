/* ============================================================
   VOSS — MAIN ENTRY POINT
   ============================================================ */

import { initPreloader }    from './preloader.js';
import { initCursor }       from './cursor.js';
import { initNeuralCanvas } from './canvas-neural.js';
import { initNav }          from './nav.js';
import { initScrollEffects } from './scroll.js';
import { initCounters }     from './counters.js';

// ── Form handler ─────────────────────────────────────────────
function initForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn  = form.querySelector('.btn-submit-span');
    const orig = btn?.textContent;

    if (btn) {
      btn.textContent = 'Message Sent ✓';
      btn.closest('.btn-primary')?.classList.add('submitted');
    }

    setTimeout(() => {
      if (btn) btn.textContent = orig;
      btn?.closest('.btn-primary')?.classList.remove('submitted');
      form.reset();
    }, 3500);
  });
}

// ── Methods diagram canvas ────────────────────────────────────
function initMethodsDiagram() {
  const canvas = document.getElementById('methods-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W   = canvas.offsetWidth;
  const H   = canvas.offsetHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const cx = W / 2, cy = H / 2;

  // Concentric rings
  const rings = [
    { r: 30, label: 'Subject', color: 'rgba(201,168,76,0.9)', lw: 1.5 },
    { r: 65, label: 'EEG',     color: 'rgba(201,168,76,0.55)', lw: 1 },
    { r: 100, label: 'fMRI',   color: 'rgba(201,168,76,0.35)', lw: 0.8 },
    { r: 140, label: 'MEG',    color: 'rgba(201,168,76,0.2)',  lw: 0.5 },
  ];

  // Rotating data points
  let angle = 0;
  const points = Array.from({ length: 12 }, (_, i) => ({
    ring:  Math.floor(Math.random() * 3) + 1,
    phase: (Math.PI * 2 / 12) * i,
    speed: 0.003 + Math.random() * 0.006,
  }));

  function draw(time) {
    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(201,168,76,0.04)';
    ctx.lineWidth   = 0.5;
    for (let x = 0; x < W; x += 24) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 24) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Crosshair
    ctx.strokeStyle = 'rgba(201,168,76,0.07)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(cx, 0);  ctx.lineTo(cx, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, cy);  ctx.lineTo(W, cy); ctx.stroke();
    ctx.setLineDash([]);

    // Rings
    rings.forEach(ring => {
      ctx.beginPath();
      ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
      ctx.strokeStyle = ring.color;
      ctx.lineWidth   = ring.lw;
      ctx.stroke();

      // Label
      ctx.fillStyle   = ring.color;
      ctx.font        = `10px DM Mono, monospace`;
      ctx.textAlign   = 'left';
      ctx.fillText(ring.label, cx + ring.r + 4, cy - 4);
    });

    // Rotating points
    angle += 0.006;
    points.forEach(p => {
      p.phase += p.speed;
      const ringR = rings[p.ring]?.r || 60;
      const px = cx + Math.cos(p.phase + angle) * ringR;
      const py = cy + Math.sin(p.phase + angle * 0.7) * ringR;

      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201,168,76,0.8)`;
      ctx.shadowColor = 'rgba(201,168,76,0.6)';
      ctx.shadowBlur  = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle   = 'rgba(201,168,76,1)';
    ctx.shadowColor = 'rgba(201,168,76,0.8)';
    ctx.shadowBlur  = 16;
    ctx.fill();
    ctx.shadowBlur = 0;

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Always start cursor immediately
  initCursor();

  // Preloader → then everything else
  initPreloader(() => {
    initNeuralCanvas();
    initNav();
    initScrollEffects();
    initCounters();
    initForm();
    initMethodsDiagram();
  });
});
