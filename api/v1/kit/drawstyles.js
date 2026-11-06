// Motion Prompt #4 072–086 · MIT License (c) 2026 sadjjk · https://github.com/alexgreensh/anidoodle
//
// Kit for pack "drawstyles" (Drawing styles / 画材スタイル): the constants and helpers its elements share.
// Elements #4 072–086 · 539x208 px · cycle 6.4 s. Element code: https://sadjjk.github.io/motion-prompt-zh/api/v1/zh-Hans/e/<id>.txt (or /en/, /ja/).
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
// 画材画风（每格 539x208、6.4 秒周期；每格都是只依赖时间 u 的纯函数）
// 画风思路参考 anidoodle（Alex Greenshpun），代码为本仓库独立实现。
// 0–5.4 秒按作画顺序画到成品并停住，5.4–6.0 秒画面淡回空白画纸，6.0–6.4 秒保持空白。
// 随机只用 hash/rnd 加固定种子；点阵和笔触坐标在定义时算好，绘制时按 u 取前若干个。
const CW = 539, CH = 208;
const CYC = 6.4;
const SHOW = 5.4;
const TAU = Math.PI * 2;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;
const seg = (u, a, b) => clamp((u - a) / (b - a));
const inOut3 = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const out3 = t => 1 - Math.pow(1 - t, 3);
const backOut = (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
const hash = i => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const rnd = (i, j = 0) => hash(i * 127.1 + j * 311.7);
const resetK = u => inOut3(seg(u, SHOW, SHOW + 0.6));
const vis = u => 1 - resetK(u);            // 画面（纸以外）的整体不透明度

// 纸：底色 + 固定位置的纸纹点（col 为纸色，grain 为纸纹色，n 为点数）
function paper(k, col, grain, n = 420, seed = 1) {
  k.fillStyle = col; k.fillRect(0, 0, CW, CH);
  k.fillStyle = grain;
  for (let i = 0; i < n; i++) k.fillRect(rnd(i, seed) * CW, rnd(i, seed + 1) * CH, 1 + rnd(i, seed + 2), 1);
}
// 折线按长度画出前 t（0..1）；t<=0 不画
function partial(k, pts, t) {
  if (t <= 0 || pts.length < 2) return;
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let left = clamp(t) * total;
  k.beginPath(); k.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length && left > 0; i++) {
    const a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (d <= left) { k.lineTo(b[0], b[1]); left -= d; }
    else { const f = left / d; k.lineTo(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f); left = 0; }
  }
  k.stroke();
}
// 手绘抖动的线：a→b 之间 n 段，中间点沿法线按 hash 偏移 ±amp（两端不动，方便首尾相接）
function wobble(x1, y1, x2, y2, seed, amp = 1.2, n = 8) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, pts = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n, o = (i === 0 || i === n) ? 0 : (rnd(seed, i) - 0.5) * 2 * amp;
    pts.push([x1 + dx * f + nx * o, y1 + dy * f + ny * o]);
  }
  return pts;
}
// 手画椭圆：从角度 a0 开始画一圈再多画 over 圈，半径带 ±amp 抖动（收笔处略过头，像手画）
function ellPts(cx, cy, rx, ry, seed, amp = 1, n = 48, a0 = 0, over = 0.08) {
  const m = Math.round(n * (1 + over)), pts = [];
  for (let i = 0; i <= m; i++) {
    const a = a0 + (i / n) * TAU, j = (rnd(seed, i % n) - 0.5) * 2 * amp;
    pts.push([cx + Math.cos(a) * (rx + j), cy + Math.sin(a) * (ry + j)]);
  }
  return pts;
}
// 平行排线：在 box=[x,y,w,h] 内、clipFn 定义的区域中，角度 ang、间距 gap，按 t 画出前若干条。
// 线按 box 在法线方向上的投影排布，所以每条线都落在 box 里，不会有“看不见的进度”。
function hatch(k, clipFn, box, ang, gap, t, col, lw, seed, jitter = 0.6) {
  if (t <= 0) return;
  const [bx, by, bw, bh] = box, cx = bx + bw / 2, cy = by + bh / 2;
  const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
  const half = (Math.abs(bw * nx) + Math.abs(bh * ny)) / 2, len = (Math.abs(bw * ux) + Math.abs(bh * uy)) / 2 + 4;
  const N = Math.max(1, Math.ceil((half * 2) / gap)), shown = clamp(t) * N;
  k.save(); k.beginPath(); clipFn(k); k.clip();
  k.strokeStyle = col; k.lineWidth = lw; k.lineCap = 'round';
  for (let i = 0; i < Math.ceil(shown); i++) {
    const o = -half + (i + 0.5) * gap + (rnd(seed, i) - 0.5) * jitter;
    const f = Math.min(1, shown - i);               // 最后一条按比例画出一段
    const a0 = -len + (rnd(seed + 3, i) - 0.5) * 6, a1 = len + (rnd(seed + 5, i) - 0.5) * 6;
    const px = cx + nx * o, py = cy + ny * o;
    k.beginPath(); k.moveTo(px + ux * a0, py + uy * a0); k.lineTo(px + ux * mix(a0, a1, f), py + uy * mix(a0, a1, f)); k.stroke();
  }
  k.restore();
}
// 不规则色块（水彩、颜料、手绘外形）：r 为平均半径，sy 为纵向比例，按 seed 生成 28 个点的闭合多边形
function blob(cx, cy, r, seed, wav = 0.08, sy = 1) {
  const pts = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * TAU, rr = r * (1 + wav * Math.sin(3 * a + seed) + 0.05 * (rnd(seed, i) - 0.5));
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * sy]);
  }
  return pts;
}
function tracePts(k, pts, close = true) { pts.forEach((p, i) => (i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1]))); if (close) k.closePath(); }
function fillPts(k, pts) { k.beginPath(); tracePts(k, pts); k.fill(); }
function strokePts(k, pts, close = false) { k.beginPath(); tracePts(k, pts, close); k.stroke(); }
// 颜色提亮/压暗：f>0 向白色混合，f<0 向黑色混合
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
  const t = f > 0 ? 255 : 0, a = Math.abs(f);
  return `rgb(${c.map(v => Math.round(v + (t - v) * a)).join(',')})`;
}
// 球面明暗：(x,y) 在以 (cx,cy) 为中心、半轴 rx/ry 的椭圆内时，按光源 L 返回 0（亮）..1（暗）；椭圆外返回 -1
const LIGHT = (() => { const v = [-0.5, -0.6, 0.62], m = Math.hypot(...v); return v.map(c => c / m); })();
function sphereTone(x, y, cx, cy, rx, ry) {
  const nx = (x - cx) / rx, ny = (y - cy) / ry, q = nx * nx + ny * ny;
  if (q >= 1) return -1;
  const nz = Math.sqrt(1 - q), d = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
  return clamp(1 - d, 0.06, 1);
}
// 点是否在多边形内（射线法）
function inPoly(pts, x, y) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}
// 多条折线按总长度依次画出前 t；返回已画完的条数 done
function seqDraw(k, list, t) {
  const lens = list.map(pts => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; });
  let left = clamp(t) * lens.reduce((a, b) => a + b, 0), done = 0;
  for (let i = 0; i < list.length && left > 0; i++) {
    if (left >= lens[i]) { strokePts(k, list[i]); left -= lens[i]; done++; }
    else { partial(k, list[i], left / lens[i]); left = 0; }
  }
  return done;
}
// 来回涂抹的路径：在 test 为真的区域里逐行扫描，每行从左到右、再斜着回到下一行左端
function scribble(test, x0, x1, y0, y1, step, seed, over = 3) {
  const pts = [];
  for (let y = y0, r = 0; y <= y1; y += step, r++) {
    let a = null, b = null;
    for (let x = x0; x <= x1; x += 2) if (test(x, y)) { if (a === null) a = x; b = x; }
    if (a === null) continue;
    pts.push([a - over * rnd(seed, r), y], [b + over * rnd(seed + 1, r), y + step / 2]);
  }
  return pts;
}
const CELLS = [];

// @shared
// （本包目前没有跨元素共用的代码）
