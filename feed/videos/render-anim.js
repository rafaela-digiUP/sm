// Render the two animated feed posts frame by frame (1080x1350, 30 fps, 7 s loop).
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const FPS = 30, DUR = 7, N = FPS * DUR;
(async () => {
  const dir = process.argv[2];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 1500 } });
  await p.goto('file://' + path.join(dir, 'carrossel.html'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);

  // 08 — only the hand-drawn circle moves: it draws itself, holds, fades before the loop restarts
  fs.mkdirSync(path.join(dir, 'f8'), { recursive: true });
  // a pen circling the button: ~2.4 irregular turns that drift and wobble, like a hand going round and round
  const len = await p.evaluate(() => {
    const q = document.querySelector('#s8 svg path');
    const cx = 190, cy = 187, turns = 2.4, steps = 900, tilt = -0.14;
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const u = i / steps, th = -2.2 + u * turns * 2 * Math.PI;
      const wob = 1 + 0.045 * Math.sin(3 * th + 0.7) + 0.028 * Math.sin(5 * th + 2.1) + 0.018 * Math.sin(9 * th);
      const grow = 1 + 0.05 * Math.sin(u * Math.PI * 1.3) - 0.03 * u;     // each pass a little wider or tighter
      const rx = 168 * wob * grow, ry = 158 * wob * grow;
      const ox = 7 * Math.sin(u * 5.1), oy = 6 * Math.cos(u * 4.3);         // the hand drifts
      const x0 = rx * Math.cos(th), y0 = ry * Math.sin(th);
      const x = cx + ox + x0 * Math.cos(tilt) - y0 * Math.sin(tilt), y = cy + oy + x0 * Math.sin(tilt) + y0 * Math.cos(tilt);
      d += (i ? ' L ' : 'M ') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    q.setAttribute('d', d); q.setAttribute('stroke-width', '6'); q.setAttribute('stroke-linejoin', 'round'); q.style.opacity = .95;
    const L = q.getTotalLength(); q.style.strokeDasharray = L; return L;
  });
  for (let i = 0; i < N; i++) {
    const t = i / FPS;
    await p.evaluate(([t, L]) => {
      const q = document.querySelector('#s8 svg path');
      const k = Math.min(1, Math.max(0, (t - 0.3) / 4.2));
      const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2 + 0.0;   // pen speeds up, then slows to a stop
      const jit = 0.004 * Math.sin(t * 23);                                    // tiny hesitations of the hand
      q.style.strokeDashoffset = L * Math.min(1, Math.max(0, 1 - e - jit * (k > 0 && k < 1)));
      q.style.opacity = t > 6.4 ? Math.max(0, 0.95 * (1 - (t - 6.4) / 0.5)) : 0.95;
    }, [t, len]);
    await p.locator('#s8').screenshot({ path: path.join(dir, 'f8', String(i).padStart(4, '0') + '.png') });
  }

  // 09 — only the red sphere moves: slow figure-eight drift, breathing scale, wandering hot spot (all periodic → seamless loop)
  fs.mkdirSync(path.join(dir, 'f9'), { recursive: true });
  for (let i = 0; i < N; i++) {
    const t = i / N, w = 2 * Math.PI * t;
    await p.evaluate(([w]) => {
      const orb = [...document.querySelectorAll('#s9 > div.abs')].find(d => d.style.background.includes('radial-gradient'));
      const x = 22 * Math.sin(w), y = 16 * Math.sin(2 * w), s = 1 + 0.045 * Math.sin(2 * w + 1.2);
      const hx = 46 + 7 * Math.cos(w), hy = 44 + 7 * Math.sin(w);
      orb.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
      orb.style.background = `radial-gradient(circle at ${hx}% ${hy}%,#e8112d 0%,#b00e22 34%,rgba(176,14,34,.35) 56%,rgba(250,247,244,0) 72%)`;
    }, [w]);
    await p.locator('#s9').screenshot({ path: path.join(dir, 'f9', String(i).padStart(4, '0') + '.png') });
  }
  await b.close();
  console.log('frames', N, 'each');
})();
