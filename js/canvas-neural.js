/* ============================================================
   VOSS — NEURAL CANVAS
   Living connectome visualization.
   Neurons fire, action potentials cascade along axons,
   mouse proximity triggers local activation.
   ============================================================ */

export function initNeuralCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // ── Config ───────────────────────────────────────────────
  const CFG = {
    neuronCount:       88,
    maxConnections:    5,        // max axons per neuron
    connectionRadius:  180,      // px — neurons within this range may connect
    restingColor:      'rgba(180,165,140,0.18)',
    axonColor:         'rgba(201,168,76,0.14)',
    fireColor:         '#c9a84c',
    fireGlowColor:     'rgba(201,168,76,0.55)',
    pulseColor:        'rgba(201,168,76,0.9)',
    bgGrid:            'rgba(201,168,76,0.025)',
    mouseRadius:       130,      // px — mouse activation zone
    mouseStrength:     0.6,
    fireDuration:      420,      // ms a neuron stays fired
    refractoryPeriod:  900,      // ms before neuron can fire again
    cascadeDelay:      80,       // ms between cascade hops
    spontaneousRate:   0.0012,   // probability per frame to self-fire
    pulseSpeed:        2.2,      // px per frame along axon
    neuronMinR:        2.2,
    neuronMaxR:        5,
    dpr:               Math.min(window.devicePixelRatio || 1, 2),
  };

  let W = 0, H = 0;
  let neurons = [];
  let mouse = { x: -9999, y: -9999, active: false };
  let lastMouse = performance.now();

  // ── Neuron class ─────────────────────────────────────────
  class Neuron {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.r = CFG.neuronMinR + Math.random() * (CFG.neuronMaxR - CFG.neuronMinR);
      this.connections = []; // indices
      this.pulses = [];      // active action potentials outgoing
      this.state = 'resting'; // resting | firing | refractory
      this.fireStart = 0;
      this.fireAlpha = 0;
      this.glowSize  = 0;
      this.driftVx = (Math.random() - 0.5) * 0.08;
      this.driftVy = (Math.random() - 0.5) * 0.08;
      this.baseX = x;
      this.baseY = y;
      this.phase  = Math.random() * Math.PI * 2;
      this.phaseSpeed = 0.003 + Math.random() * 0.006;
    }

    fire(time, sourceIdx) {
      if (this.state !== 'resting') return false;
      this.state     = 'firing';
      this.fireStart = time;
      this.fireAlpha = 1;
      this.glowSize  = this.r * 4;

      // Schedule cascade to connected neurons
      this.connections.forEach((targetIdx, i) => {
        const delay = CFG.cascadeDelay * (i + 1) + Math.random() * 60;
        this.pulses.push({
          targetIdx,
          progress: 0,       // 0..1 along axon
          speed: CFG.pulseSpeed / this._axonLength(targetIdx),
          delay,
          startTime: time + delay,
          alpha: 1,
        });
      });

      return true;
    }

    _axonLength(targetIdx) {
      const t = neurons[targetIdx];
      if (!t) return 1;
      const dx = t.x - this.x;
      const dy = t.y - this.y;
      return Math.max(Math.sqrt(dx*dx + dy*dy), 1);
    }

    update(time, dt) {
      // Drift (subtle Lissajous)
      this.phase += this.phaseSpeed;
      this.x = this.baseX + Math.sin(this.phase) * 6;
      this.y = this.baseY + Math.cos(this.phase * 0.7) * 4;

      // State transitions
      if (this.state === 'firing') {
        const elapsed = time - this.fireStart;
        this.fireAlpha = Math.max(0, 1 - elapsed / CFG.fireDuration);
        this.glowSize  = this.r * (4 + 3 * this.fireAlpha);

        if (elapsed > CFG.fireDuration) {
          this.state = 'refractory';
          this.fireStart = time;
        }
      } else if (this.state === 'refractory') {
        if (time - this.fireStart > CFG.refractoryPeriod) {
          this.state = 'resting';
        }
      } else {
        // Spontaneous firing
        if (Math.random() < CFG.spontaneousRate) {
          this.fire(time, -1);
        }

        // Mouse proximity activation
        const mdx = mouse.x - this.x;
        const mdy = mouse.y - this.y;
        const md2 = mdx*mdx + mdy*mdy;
        if (md2 < CFG.mouseRadius * CFG.mouseRadius && mouse.active) {
          const prob = (1 - Math.sqrt(md2) / CFG.mouseRadius) * 0.04;
          if (Math.random() < prob) {
            this.fire(time, -2);
          }
        }
      }

      // Update outgoing pulses
      this.pulses = this.pulses.filter(p => {
        if (time < p.startTime) return true;
        p.progress += p.speed;
        if (p.progress >= 1) {
          // Pulse arrived — fire target neuron
          const target = neurons[p.targetIdx];
          target?.fire(time, -3);
          return false;
        }
        return true;
      });
    }

    draw(ctx) {
      const isFiring     = this.state === 'firing' && this.fireAlpha > 0.01;
      const isRefractory = this.state === 'refractory';

      if (isFiring) {
        // Glow rings
        const glowA = this.fireAlpha * 0.35;
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.glowSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,168,76,${glowA * 0.25})`;
        ctx.fill();

        // Inner glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,168,76,${glowA * 0.6})`;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226,196,114,${this.fireAlpha})`;
        ctx.shadowColor = CFG.fireGlowColor;
        ctx.shadowBlur  = 14;
        ctx.fill();
        ctx.restore();

      } else if (isRefractory) {
        // Dim dot
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(130,115,90,0.25)';
        ctx.fill();

      } else {
        // Resting
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = CFG.restingColor;
        ctx.fill();
      }

      // Draw pulses (action potentials)
      this.pulses.forEach(p => {
        if (performance.now() < p.startTime) return;
        const target = neurons[p.targetIdx];
        if (!target) return;

        const px = this.x + (target.x - this.x) * p.progress;
        const py = this.y + (target.y - this.y) * p.progress;

        // Trailing glow
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 8);
        grad.addColorStop(0, `rgba(201,168,76,${p.alpha * 0.95})`);
        grad.addColorStop(0.4, `rgba(201,168,76,${p.alpha * 0.35})`);
        grad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Bright core dot
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,220,160,${p.alpha})`;
        ctx.fill();
      });
    }
  }

  // ── Build graph ──────────────────────────────────────────
  function buildGraph() {
    neurons = [];

    // Distribute neurons in a scattered grid with jitter
    const cols = Math.ceil(Math.sqrt(CFG.neuronCount * (W / H)));
    const rows = Math.ceil(CFG.neuronCount / cols);

    const cellW = W / cols;
    const cellH = H / rows;

    let count = 0;
    for (let r = 0; r < rows && count < CFG.neuronCount; r++) {
      for (let c = 0; c < cols && count < CFG.neuronCount; c++) {
        const x = cellW * (c + 0.2 + Math.random() * 0.6);
        const y = cellH * (r + 0.2 + Math.random() * 0.6);
        neurons.push(new Neuron(x, y));
        count++;
      }
    }

    // Connect nearby neurons (sparse random wiring)
    neurons.forEach((n, i) => {
      // Find nearby candidates
      const nearby = neurons
        .map((m, j) => {
          if (i === j) return null;
          const dx = m.x - n.x;
          const dy = m.y - n.y;
          const d  = Math.sqrt(dx*dx + dy*dy);
          return d < CFG.connectionRadius ? { j, d } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.d - b.d);

      // Pick up to maxConnections, biased toward closer neurons
      const picks = Math.floor(1 + Math.random() * CFG.maxConnections);
      const count = Math.min(picks, nearby.length);

      for (let k = 0; k < count; k++) {
        if (!n.connections.includes(nearby[k].j)) {
          n.connections.push(nearby[k].j);
        }
      }
    });
  }

  // ── Draw axons ───────────────────────────────────────────
  function drawAxons() {
    neurons.forEach((n, i) => {
      n.connections.forEach(j => {
        // Avoid double-drawing
        if (j < i) return;

        const t = neurons[j];
        const dx = t.x - n.x;
        const dy = t.y - n.y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        const alpha = Math.max(0, 1 - d / CFG.connectionRadius) * 0.55;

        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = `rgba(201,168,76,${alpha * 0.28})`;
        ctx.lineWidth   = 0.5;
        ctx.stroke();
      });
    });
  }

  // ── Background grid ──────────────────────────────────────
  function drawGrid() {
    const step = 72;
    ctx.save();
    ctx.strokeStyle = CFG.bgGrid;
    ctx.lineWidth   = 0.5;

    for (let x = 0; x < W; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    ctx.restore();
  }

  // ── Resize ───────────────────────────────────────────────
  function resize() {
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width  = W * CFG.dpr;
    canvas.height = H * CFG.dpr;
    ctx.scale(CFG.dpr, CFG.dpr);
    buildGraph();
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  });

  resize();

  // ── Mouse events ─────────────────────────────────────────
  const heroEl = document.getElementById('hero');

  heroEl?.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
    lastMouse = performance.now();
  });

  heroEl?.addEventListener('mouseleave', () => {
    mouse.active = false;
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // ── Seed initial fires ───────────────────────────────────
  function seedFires() {
    const count = Math.max(3, Math.floor(neurons.length * 0.05));
    const indices = [...Array(neurons.length).keys()]
      .sort(() => Math.random() - 0.5)
      .slice(0, count);

    indices.forEach((idx, i) => {
      setTimeout(() => {
        neurons[idx]?.fire(performance.now(), -1);
      }, i * 180);
    });
  }

  setTimeout(seedFires, 600);

  // ── Render loop ──────────────────────────────────────────
  let lastTime = performance.now();

  function render(time) {
    const dt = time - lastTime;
    lastTime  = time;

    ctx.clearRect(0, 0, W, H);

    drawGrid();
    drawAxons();

    neurons.forEach(n => {
      n.update(time, dt);
      n.draw(ctx);
    });

    // Radial vignette
    const vg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H) * 0.72);
    vg.addColorStop(0,   'rgba(13,13,15,0)');
    vg.addColorStop(0.7, 'rgba(13,13,15,0)');
    vg.addColorStop(1,   'rgba(13,13,15,0.92)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
