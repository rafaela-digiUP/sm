// Accessibility audit for 1080px social slides.
// For every text run: font size, weight, letter-spacing, and contrast against the
// real rendered background (screenshot with all text hidden), worst 2% of pixels.
// Usage: node audit.js <dir-with-carrossel.html> [--json out.json]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { PNG } = require('pngjs');

const MIN_ANY = 26, MIN_BODY = 30;          // px on a 1080px canvas
const LARGE = 66, LARGE_BOLD = 52;          // 24px / 18.66px bold at phone scale (~0.36)

function lum([r, g, b]) {
  const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

(async () => {
  const dir = path.resolve(process.argv[2]);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 1400 } });
  await p.goto('file://' + path.join(dir, 'carrossel.html'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const ids = await p.evaluate(() => [...document.querySelectorAll('section.s')].map(s => s.id));
  const report = []; let fails = 0;
  for (const id of ids) {
    const runs = await p.evaluate((id) => {
      const sec = document.getElementById(id); const sr = sec.getBoundingClientRect();
      const out = [];
      const walker = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        const t = n.textContent.replace(/\s+/g, ' ').trim(); if (!t) continue;
        const el = n.parentElement; const cs = getComputedStyle(el);
        if (el.closest('[aria-hidden="true"]')) continue; // decorative duplicates
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        let op = 1; for (let e = el; e && e !== sec.parentElement; e = e.parentElement) op *= +getComputedStyle(e).opacity;
        const r = document.createRange(); r.selectNodeContents(n);
        let svgRects = null;
        if (el instanceof SVGTextContentElement) {          // curved/SVG text: measure glyph by glyph
          const host = el.closest('text'); const m = host.getScreenCTM(); svgRects = [];
          for (let i = 0; i < el.getNumberOfChars(); i++) {
            const e = el.getExtentOfChar(i);
            const pts = [[e.x, e.y], [e.x + e.width, e.y], [e.x, e.y + e.height], [e.x + e.width, e.y + e.height]]
              .map(([x, y]) => new DOMPoint(x, y).matrixTransform(m));
            const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
            const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2, hw = e.width / 2, hh = e.height / 2;
            svgRects.push({ x: cx - hw - sr.left, y: cy - hh - sr.top, w: e.width, h: e.height });
          }
        }
        const pb = el.getBoundingClientRect();
        let rects = [...r.getClientRects()].map(q => {
            const l = Math.max(q.left, pb.left), t = Math.max(q.top, pb.top), rr = Math.min(q.right, pb.right), bb = Math.min(q.bottom, pb.bottom);
            return { left: l, top: t, width: rr - l, height: bb - t };
          }).filter(q => q.width > 1 && q.height > 1)
          .map(q => ({ x: q.left - sr.left, y: q.top - sr.top, w: q.width, h: q.height }))
          .filter(q => q.x < 1080 && q.y < 1350 && q.x + q.w > 0 && q.y + q.h > 0);
        if (svgRects) rects.splice(0, rects.length, ...svgRects);
        if (!rects.length) continue;
        const m = ((el instanceof SVGTextContentElement) ? cs.fill : cs.color).match(/[\d.]+/g).map(Number);
        out.push({ text: t.slice(0, 60), size: parseFloat(cs.fontSize), weight: +cs.fontWeight, ls: cs.letterSpacing,
          family: cs.fontFamily.split(',')[0].replace(/['"]/g, ''), italic: cs.fontStyle !== 'normal',
          upper: cs.textTransform === 'uppercase', body: !!el.closest('.body,p'),
          color: [m[0], m[1], m[2]], alpha: (m[3] ?? 1) * op, rects });
      }
      return out;
    }, id);
    await p.addStyleTag({ content: `#${id} *{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;caret-color:transparent!important} #${id} text,#${id} tspan,#${id} textPath{fill:transparent!important;stroke:none!important}` });
    const buf = await p.locator('#' + id).screenshot();
    await p.evaluate(() => document.querySelectorAll('style').forEach((s, i, a) => { if (i === a.length - 1) s.remove(); }));
    const png = PNG.sync.read(buf);
    for (const r of runs) {
      const vals = [];
      for (const q of r.rects) {
        const x0 = Math.max(0, Math.ceil(q.x) + 2), y0 = Math.max(0, Math.ceil(q.y) + 2);
        const x1 = Math.min(png.width - 1, Math.floor(q.x + q.w) - 3), y1 = Math.min(png.height - 1, Math.floor(q.y + q.h) - 3);
        for (let y = y0; y <= y1; y += 2) for (let x = x0; x <= x1; x += 2) {
          const i = (y * png.width + x) * 4; const bg = [png.data[i], png.data[i + 1], png.data[i + 2]];
          const fg = r.color.map((c, k) => c * r.alpha + bg[k] * (1 - r.alpha));
          vals.push(ratio(fg, bg));
        }
      }
      vals.sort((a, c) => a - c);
      const worst = vals[Math.floor(vals.length * 0.02)] ?? 21;
      const large = r.size >= LARGE || (r.size >= LARGE_BOLD && r.weight >= 700);
      const need = large ? 3 : 4.5;
      const minSize = r.body ? MIN_BODY : MIN_ANY;
      const issues = [];
      if (worst < need) issues.push(`contraste ${worst.toFixed(2)}:1 < ${need}:1`);
      if (r.size < minSize) issues.push(`tamanho ${r.size}px < ${minSize}px`);
      if (r.italic) issues.push('itálico');
      if (issues.length) fails++;
      report.push({ slide: id, text: r.text, size: r.size, weight: r.weight, family: r.family, contrast: +worst.toFixed(2), need, issues });
    }
  }
  await b.close();
  const bad = report.filter(r => r.issues.length);
  console.log(`${path.basename(dir)}: ${report.length} textos, ${bad.length} com problemas`);
  for (const r of bad) console.log(`  ${r.slide} · ${r.size}px ${r.family} · «${r.text}» → ${r.issues.join('; ')}`);
  const minC = Math.min(...report.map(r => r.contrast / r.need));
  const minS = Math.min(...report.map(r => r.size));
  console.log(`  menor tamanho: ${minS}px · pior margem de contraste: ${minC.toFixed(2)}× o mínimo`);
  if (process.argv[3] === '--json') fs.writeFileSync(process.argv[4], JSON.stringify(report, null, 1));
})();
