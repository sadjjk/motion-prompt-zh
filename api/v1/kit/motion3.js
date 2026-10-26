// Motion Prompt #2-077 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#121
// Also: MIT License (c) 2026 Lemomo · https://github.com/lemomo-ai/lemo-wake (#2-077)
//
// Kit for pack "motion3" (Motion graphics, part 3 / モーショングラフィックスの演出 第3弾): the constants and helpers its elements share.
// Elements #2-077 · 539x208 px · cycle 6 s. Element code: https://sadjjk.github.io/motion-prompt-zh/api/v1/zh-Hans/e/<id>.txt (or /en/, /ja/).
//
// Run one element standalone in a browser:
//   1. paste this file into a <script>,
//   2. paste the element code below it (it assigns CELLS[n - 1], n = the element number inside the pack),
//   3. then add:
//        const c = document.createElement('canvas'); c.width = 539; c.height = 208; document.body.append(c);
//        const k = c.getContext('2d'), cell = CELLS.find(Boolean), t0 = performance.now();
//        (function loop() {
//          const u = ((performance.now() - t0) / 1000) % 6;   // seconds, 0 <= u < 6
//          k.setTransform(1, 0, 0, 1, 0, 0); k.clearRect(0, 0, 539, 208);
//          k.save(); cell(k, 539, 208, u); k.restore();
//          requestAnimationFrame(loop);
//        })();
// Every cell is a pure function of u, so the same call renders video frames: u = frame / fps.

// @kit
const CW = 539, CH = 208, CYC = 6.0;
const C = { navy: '#0F1A3D', navy2: '#1B2A5E', navy3: '#2A3D80', dim: '#7F90C4', blue: '#3B7BFF', coral: '#FF6B5C', yel: '#FFC83D', mint: '#2EDBA8', white: '#FFFFFF', cream: '#FFF1D6' };
const JP = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Hiragino Sans", sans-serif';
const DISP = '"Avenir Next", "Helvetica Neue", system-ui, sans-serif';
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, x) => a + (b - a) * x;
const P = (t, a, b) => clamp((t - a) / (b - a));
const eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eOut = x => 1 - Math.pow(1 - x, 3);
const eIn = x => x * x * x;
const smooth = x => x * x * (3 - 2 * x);
const mod = (a, n) => ((a % n) + n) % n;
const backOut = (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
const spring = (t, w = 14, d = 7) => t <= 0 ? 0 : 1 - Math.exp(-d * t) * Math.cos(w * t);
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function txt(ctx, s, x, y, font, col, align = 'left', base = 'alphabetic', ls = '0px') { ctx.font = font; ctx.textAlign = align; ctx.textBaseline = base; ctx.letterSpacing = ls; ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.letterSpacing = '0px'; }
function tw(ctx, s, font, ls = '0px') { ctx.font = font; ctx.letterSpacing = ls; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w; }
function rand(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
function mix(a, b, t) { const A = hex(a), B = hex(b); return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`; }
const PAL = [C.blue, C.coral, C.yel, C.mint];
const eIOs = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
const eOut5 = x => 1 - Math.pow(1 - x, 5);
const backIn = (x, s = 1.70158) => (s + 1) * x * x * x - s * x * x;
function star(k, x, y, R, rot = 0, inner = 0.5, n = 5) { k.beginPath(); for (let i = 0; i < n * 2; i++) { const r = i % 2 ? R * inner : R, a = rot + i * Math.PI / n; k.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } k.closePath(); }
function heartPath(k, s) { k.beginPath(); k.moveTo(0, s * 0.92); k.bezierCurveTo(-s * 1.75, -s * 0.12, -s * 0.85, -s * 1.2, 0, -s * 0.42); k.bezierCurveTo(s * 0.85, -s * 1.2, s * 1.75, -s * 0.12, 0, s * 0.92); }
const snapU = u => mod(Math.round(u * 1e6) / 1e6, CYC);
function H01(n) { n = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); n ^= n >>> 16; return (n >>> 0) / 4294967296; }
const TMP = mkCanvas(CW, CH), TK = TMP.getContext('2d');
function stage(k, col = C.navy) { k.fillStyle = col; k.fillRect(0, 0, CW, CH); }
function chars(k, s, font, ls = 0) { k.font = font; const ws = [...s].map(ch => k.measureText(ch).width + ls); const tot = ws.reduce((a, b) => a + b, 0) - ls; return [...s].map((ch, i) => ({ ch, x: ws.slice(0, i).reduce((a, b) => a + b, 0) + ws[i] / 2 })); }
function pathLen(pts) { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return c; }
function ptAt(pts, cum, f) { const L = cum[cum.length - 1] * clamp(f); let i = 1; while (i < cum.length - 1 && cum[i] < L) i++; const t = (L - cum[i - 1]) / (cum[i] - cum[i - 1]); return [lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t)]; }
const CELLS = [];
