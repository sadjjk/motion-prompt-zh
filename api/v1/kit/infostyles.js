// Motion Prompt #4 087–090 · MIT License (c) 2026 sadjjk · https://github.com/lemomo-ai/lemo-opuscar
//
// Kit for pack "infostyles" (Info visuals / 情報ビジュアル): the constants and helpers its elements share.
// Elements #4 087–090 · 539x208 px · cycle 6.4 s. Element code: https://sadjjk.github.io/motion-prompt-zh/api/v1/zh-Hans/e/<id>.txt (or /en/, /ja/).
//
// Run one element standalone in a browser:
//   1. paste this file into a <script>,
//   2. paste the element code below it (it assigns CELLS[n - 1], n = the element number inside the pack),
//   3. then add:
//        const c = document.createElement('canvas'); c.width = 539; c.height = 208; document.body.append(c);
//        const k = c.getContext('2d'), cell = CELLS.find(Boolean), t0 = performance.now();
//        (function loop() {
//          const u = ((performance.now() - t0) / 1000) % 6.4;   // seconds, 0 <= u < 6.4
//          k.setTransform(1, 0, 0, 1, 0, 0); k.clearRect(0, 0, 539, 208);
//          k.save(); cell(k, 539, 208, u); k.restore();
//          requestAnimationFrame(loop);
//        })();
// Every cell is a pure function of u, so the same call renders video frames: u = frame / fps.

// @kit
// 信息影像（每格 539x208、6.4 秒周期；每格都是只依赖时间 u 的纯函数）
// 风格思路参考 lemo-opuscar（Lemomo）的风格说明，代码为本仓库独立实现。
// 0–5.4 秒推进到成品并停住，5.4–6.0 秒内容淡出，只剩底色；6.0–6.4 秒保持底色，与 u=0 相接。
// 随机只用 hash/rnd 加固定种子；点和线的坐标在定义时算好，绘制时按 u 取用。
const CW = 539, CH = 208;
const CYC = 6.4;
const SHOW = 5.4;
const TAU = Math.PI * 2;
const MONO = "'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', monospace";
const SANS = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Hiragino Sans", sans-serif';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;
const seg = (u, a, b) => clamp((u - a) / (b - a));
const inOut3 = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const out3 = t => 1 - Math.pow(1 - t, 3);
const backOut = (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
const hash = i => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const rnd = (i, j = 0) => hash(i * 127.1 + j * 311.7);
const resetK = u => inOut3(seg(u, SHOW, SHOW + 0.6));
const vis = u => 1 - resetK(u);            // 内容（底色以外）的整体不透明度

// 两个 #rrggbb 颜色按 t 混合，返回 rgb() 字符串
function mixHex(a, b, t) {
  const p = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const A = p(a), B = p(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
}
function tracePts(k, pts, close = false) { pts.forEach((p, i) => (i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1]))); if (close) k.closePath(); }
function fillPts(k, pts) { k.beginPath(); tracePts(k, pts, true); k.fill(); }
function strokePts(k, pts, close = false) { k.beginPath(); tracePts(k, pts, close); k.stroke(); }
const polyLen = pts => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; };
// 折线按长度画出前 t（0..1）；t<=0 不画
function partial(k, pts, t) {
  if (t <= 0 || pts.length < 2) return;
  let left = clamp(t) * polyLen(pts);
  k.beginPath(); k.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length && left > 0; i++) {
    const a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (d <= left) { k.lineTo(b[0], b[1]); left -= d; }
    else { const f = left / d; k.lineTo(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f); left = 0; }
  }
  k.stroke();
}
// 多条折线按总长度依次画出前 t；返回已画完的条数
function seqDraw(k, list, t) {
  const lens = list.map(polyLen);
  let left = clamp(t) * lens.reduce((a, b) => a + b, 0), done = 0;
  for (let i = 0; i < list.length && left > 0; i++) {
    if (left >= lens[i]) { strokePts(k, list[i]); left -= lens[i]; done++; }
    else { partial(k, list[i], left / lens[i]); left = 0; }
  }
  return done;
}
// 折线上按长度比例 t 的点
function pointAt(pts, t) {
  let left = clamp(t) * polyLen(pts);
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (d >= left) { const f = d ? left / d : 0; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }
    left -= d;
  }
  return pts[pts.length - 1];
}
// 发光线：先画宽的半透明线做光晕，再画细的实线
function glowLine(k, pts, t, col, lw) {
  k.save(); k.lineCap = 'round'; k.lineJoin = 'round'; k.strokeStyle = col;
  k.globalAlpha *= 0.22; k.lineWidth = lw * 5; partial(k, pts, t);
  k.globalAlpha /= 0.22; k.lineWidth = lw; partial(k, pts, t);
  k.restore();
}
// 光点：径向渐变光晕 + 实心核
function glowDot(k, x, y, r, col, core) {
  const g = k.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  k.fillStyle = g; k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill();
  k.fillStyle = core; k.beginPath(); k.arc(x, y, Math.max(1, r * 0.22), 0, TAU); k.fill();
}
// 细线标注：两端带短横的测量线，按 t 画出，标签随 t 淡入
function tick(k, x1, y1, x2, y2, label, t, col, lx = 0, ly = -6, align = 'center') {
  if (t <= 0) return;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L * 3.5, ny = dx / L * 3.5;
  k.save(); k.strokeStyle = col; k.fillStyle = col; k.lineWidth = 0.8;
  partial(k, [[x1, y1], [x2, y2]], seg(t, 0, 0.7));
  k.beginPath(); k.moveTo(x1 - nx, y1 - ny); k.lineTo(x1 + nx, y1 + ny);
  if (t >= 0.7) { k.moveTo(x2 - nx, y2 - ny); k.lineTo(x2 + nx, y2 + ny); }
  k.stroke();
  k.globalAlpha *= seg(t, 0.6, 1); k.font = `500 9px ${MONO}`; k.textAlign = align; k.textBaseline = 'alphabetic';
  k.fillText(label, (x1 + x2) / 2 + lx, (y1 + y2) / 2 + ly);
  k.restore();
}
// 等轴投影：x 轴朝右下，z 轴朝左下，y 轴朝上（单位为像素）
const iso = (ox, oy) => (x, y, z) => [ox + (x - z) * 0.866, oy + (x + z) * 0.5 - y];
const CELLS = [];

// @shared
// （本包目前没有跨元素共用的代码）
