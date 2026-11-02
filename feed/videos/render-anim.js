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
  const len = await p.evaluate(() => { const q = document.querySelector('#s8 svg path'); const L = q.getTotalLength(); q.style.strokeDasharray = L; return L; });
  for (let i = 0; i < N; i++) {
    const t = i / FPS;
    await p.evaluate(([t, L]) => {
      const q = document.querySelector('#s8 svg path');
      const k = Math.min(1, Math.max(0, (t - 0.4) / 1.5));
      const e = 1 - Math.pow(1 - k, 3);                    // ease-out, like a marker stroke
      q.style.strokeDashoffset = L * (1 - e);
      q.style.opacity = t > 6.5 ? Math.max(0, 1 - (t - 6.5) / 0.4) : 1;
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
