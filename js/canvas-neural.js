/* ============================================================
   VOSS — NEURAL CANVAS v2
   Upgraded: cortical column clustering, depth layering,
   richer glow, better cascade timing, wave propagation.
   ============================================================ */

export function initNeuralCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let W = 0, H = 0;
  let neurons = [];
  let mouse = { x: -9999, y: -9999, active: false };

  const CFG = {
    neuronCount:       140,
    clusterCount:      7,
    clusterRadius:     110,
    connectionRadius:  160,
    maxConnDist:       190,
    fireDuration:      400,
    refractoryMs:      1100,
    cascadeDelayBase:  65,
    cascadeJitter:     40,
    pulseSpeed:        2.6,
    spontaneousRate:   0.0008,
    mouseRadius:       150,
    mouseFireProb:     0.05,
    dpr,
  };

  class Neuron {
    constructor(x, y, depth, clusterId) {
      this.bx = x; this.by = y;
      this.x  = x; this.y  = y;
      this.depth     = depth;
      this.clusterId = clusterId;
      this.r         = (1.5 + Math.random() * 2.5) * (0.6 + depth * 0.7);
      this.alpha     = 0.15 + depth * 0.55;
      this.phase     = Math.random() * Math.PI * 2;
      this.phaseSpd  = 0.002 + Math.random() * 0.005;
      this.driftAmt  = 4 + depth * 3;
      this.connections = [];
      this.pulses    = [];
      this.state     = 'resting';
      this.fireT     = 0;
      this.fireAlpha = 0;
    }

    fire(now) {
      if (this.state !== 'resting') return false;
      this.state     = 'firing';
      this.fireT     = now;
      this.fireAlpha = 1;
      this.connections.forEach((ti, i) => {
        const delay  = CFG.cascadeDelayBase * (i * 0.6 + 1) + Math.random() * CFG.cascadeJitter;
        const target = neurons[ti];
        if (!target) return;
        const dx = target.bx - this.bx, dy = target.by - this.by;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        this.pulses.push({ ti, progress: 0, speed: CFG.pulseSpeed / dist, startT: now + delay, alpha: 1 });
      });
      return true;
    }

    update(now) {
      this.phase += this.phaseSpd;
      this.x = this.bx + Math.sin(this.phase)       * this.driftAmt;
      this.y = this.by + Math.cos(this.phase * 0.73) * this.driftAmt * 0.6;

      if (this.state === 'firing') {
        const el = now - this.fireT;
        this.fireAlpha = Math.max(0, 1 - el / CFG.fireDuration);
        if (el > CFG.fireDuration) { this.state = 'refractory'; this.fireT = now; }
      } else if (this.state === 'refractory') {
        if (now - this.fireT > CFG.refractoryMs) this.state = 'resting';
      } else {
        if (Math.random() < CFG.spontaneousRate) this.fire(now);
        const mdx = mouse.x - this.x, mdy = mouse.y - this.y;
        const md2 = mdx*mdx + mdy*mdy;
        if (mouse.active && md2 < CFG.mouseRadius**2) {
          const str = (1 - Math.sqrt(md2) / CFG.mouseRadius) * CFG.mouseFireProb;
          if (Math.random() < str) this.fire(now);
        }
      }

      this.pulses = this.pulses.filter(p => {
        if (now < p.startT) return true;
        p.progress += p.speed;
        if (p.progress >= 1) { neurons[p.ti]?.fire(now); return false; }
        return true;
      });
    }

    drawPulses(ctx) {
      this.pulses.forEach(p => {
        if (performance.now() < p.startT) return;
        const t = neurons[p.ti]; if (!t) return;
        const px = this.x + (t.x - this.x) * p.progress;
        const py = this.y + (t.y - this.y) * p.progress;
        const gr = 9 * this.depth + 4;
        const g = ctx.createRadialGradient(px, py, 0, px, py, gr);
        g.addColorStop(0,   `rgba(201,168,76,${p.alpha * 0.9})`);
        g.addColorStop(0.4, `rgba(201,168,76,${p.alpha * 0.28})`);
        g.addColorStop(1,   'transparent');
        ctx.beginPath(); ctx.arc(px, py, gr, 0, Math.PI*2); ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(px, py, 2 + this.depth, 0, Math.PI*2);
        ctx.fillStyle = `rgba(236,210,140,${p.alpha})`; ctx.fill();
      });
    }

    drawBody(ctx) {
      const isFiring = this.state === 'firing' && this.fireAlpha > 0.01;
      const isRefrac = this.state === 'refractory';
      if (isFiring) {
        const fa = this.fireAlpha, glowR = this.r * (3 + 4 * fa);
        const bloom = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowR * 2.5);
        bloom.addColorStop(0, `rgba(201,168,76,${fa * 0.22})`);
        bloom.addColorStop(0.5, `rgba(201,168,76,${fa * 0.06})`);
        bloom.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(this.x, this.y, glowR*2.5, 0, Math.PI*2); ctx.fillStyle = bloom; ctx.fill();
        const inner = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowR);
        inner.addColorStop(0,   `rgba(240,215,145,${fa * 0.9})`);
        inner.addColorStop(0.4, `rgba(201,168,76,${fa * 0.5})`);
        inner.addColorStop(1,   'transparent');
        ctx.beginPath(); ctx.arc(this.x, this.y, glowR, 0, Math.PI*2); ctx.fillStyle = inner; ctx.fill();
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(245,220,155,${fa})`; ctx.fill();
      } else if (isRefrac) {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r*0.55, 0, Math.PI*2);
        ctx.fillStyle = `rgba(140,125,95,${this.alpha * 0.3})`; ctx.fill();
      } else {
        if (this.depth > 0.5) {
          const rg = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r*2.5);
          rg.addColorStop(0, `rgba(201,168,76,${this.alpha*0.15})`);
          rg.addColorStop(1, 'transparent');
          ctx.beginPath(); ctx.arc(this.x, this.y, this.r*2.5, 0, Math.PI*2); ctx.fillStyle = rg; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(185,170,140,${this.alpha * 0.55})`; ctx.fill();
      }
    }
  }

  function buildNetwork() {
    neurons = [];
    const clusters = Array.from({ length: CFG.clusterCount }, (_, i) => {
      const angle  = (Math.PI*2 / CFG.clusterCount) * i + Math.random() * 0.5;
      const radius = 0.22 + Math.random() * 0.24;
      return { cx: W*0.5 + Math.cos(angle)*W*radius, cy: H*0.5 + Math.sin(angle)*H*radius*0.72 };
    });

    for (let i = 0; i < CFG.neuronCount; i++) {
      const cid = i % CFG.clusterCount;
      const {cx, cy} = clusters[cid];
      const a   = Math.random() * Math.PI * 2;
      const r   = Math.pow(Math.random(), 0.6) * CFG.clusterRadius;
      const dep = 0.2 + Math.random() * 0.8;
      neurons.push(new Neuron(cx + Math.cos(a)*r, cy + Math.sin(a)*r, dep, cid));
    }
    neurons.sort((a, b) => a.depth - b.depth);

    neurons.forEach((n, i) => {
      const cands = neurons.map((m, j) => {
        if (i === j) return null;
        const dx = m.bx - n.bx, dy = m.by - n.by;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d > CFG.maxConnDist) return null;
        const bonus = m.clusterId === n.clusterId ? 60 : 0;
        return { j, score: d - bonus };
      }).filter(Boolean).sort((a, b) => a.score - b.score).slice(0, 3 + Math.floor(Math.random()*3));
      cands.forEach(c => { if (!n.connections.includes(c.j)) n.connections.push(c.j); });
    });
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(201,168,76,0.022)';
    ctx.lineWidth = 0.5;
    for (let x = 32; x < W; x += 64) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 32; y < H; y += 64) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    ctx.restore();
  }

  function drawAxons() {
    const drawn = new Set();
    neurons.forEach((n, i) => {
      n.connections.forEach(j => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (drawn.has(key)) return; drawn.add(key);
        const t = neurons[j];
        const dx = t.x - n.x, dy = t.y - n.y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        const da = (n.depth + t.depth) * 0.5;
        const fa = Math.max(0, 1 - d / CFG.connectionRadius) * da * 0.38;
        ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = `rgba(201,168,76,${fa})`;
        ctx.lineWidth   = 0.35 + da * 0.55;
        ctx.stroke();
      });
    });
  }

  function drawVignette() {
    const vg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.7);
    vg.addColorStop(0,    'rgba(17,17,19,0)');
    vg.addColorStop(0.52, 'rgba(17,17,19,0)');
    vg.addColorStop(1,    'rgba(17,17,19,0.97)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }

  function resize() {
    W = canvas.offsetWidth; H = canvas.offsetHeight;
    canvas.width = W*dpr; canvas.height = H*dpr;
    ctx.scale(dpr, dpr);
    buildNetwork();
  }

  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 180); });
  resize();

  const heroEl = document.getElementById('hero');
  heroEl?.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true;
  });
  heroEl?.addEventListener('mouseleave', () => { mouse.active = false; mouse.x = -9999; mouse.y = -9999; });

  setTimeout(() => {
    const count = Math.max(5, Math.floor(neurons.length * 0.06));
    [...Array(neurons.length).keys()].sort(() => Math.random()-0.5).slice(0,count)
      .forEach((idx, k) => setTimeout(() => neurons[idx]?.fire(performance.now()), k*140 + 400));
  }, 700);

  function render(now) {
    ctx.clearRect(0, 0, W, H);
    drawGrid(); drawAxons();
    neurons.forEach(n => n.update(now));
    neurons.forEach(n => n.drawPulses(ctx));
    neurons.forEach(n => n.drawBody(ctx));
    drawVignette();
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
