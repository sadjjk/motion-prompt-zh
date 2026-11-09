// Motion Prompt #4 091–099 · MIT License (c) 2026 alchaincyf (花叔) · https://github.com/alchaincyf/huashu-art-motion
//
// Kit for pack "artstyles" (Art history styles / 美術史スタイル): the constants and helpers its elements share.
// Elements #4 091–099 · 539x208 px · cycle 6.4 s. Element code: https://sadjjk.github.io/motion-prompt-zh/api/v1/zh-Hans/e/<id>.txt (or /en/, /ja/).
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
// 艺术史画风（每格 539x208、6.4 秒周期；每格都是只依赖时间 u 的纯函数）
// 改写自 huashu-art-motion（花叔）的场景与风格配方：取其算法思路（可变线宽鞭线、半透明切面、流线笔触等），
// 缩到小格子里重新构图；不使用原作的笔画数据、字体和卡通形象。
// 0–5.4 秒画到成品并带一点循环动作，5.4–6.0 秒内容淡出，只剩底色；6.0–6.4 秒保持底色，与 u=0 相接。
// 原作用离屏缓存和逐像素遮罩，格子里不能这样做：坐标在定义时算好，金箔改用渐变加高光带。
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
const vis = u => 1 - resetK(u);            // 内容（底色以外）的整体不透明度
// 循环动作的渐入系数：从 t0 起 0.4 秒内由 0 升到 1，避免动作突然开始
const ease = (u, t0) => inOut3(seg(u, t0, t0 + 0.4));

const hex3 = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const rgba = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const mix3 = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
function tracePts(k, pts, close = true) { pts.forEach((p, i) => (i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1]))); if (close) k.closePath(); }
function fillPts(k, pts) { k.beginPath(); tracePts(k, pts); k.fill(); }
function strokePts(k, pts, close = false) { k.beginPath(); tracePts(k, pts, close); k.stroke(); }
const polyLen = pts => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; };
// 折线按长度画出前 t（0..1）
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
// Catmull-Rom 加密：控制点之间各插 n 个点，得到平滑曲线（同原作 dense）
function dense(pts, n = 8) {
  const o = [], N = pts.length, g = i => pts[Math.max(0, Math.min(N - 1, i))];
  for (let i = 0; i < N - 1; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    for (let s = 0; s < n; s++) {
      const t = s / n, t2 = t * t, t3 = t2 * t;
      o.push([0, 1].map(d => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
    }
  }
  o.push(pts[N - 1]);
  return o;
}
// 可变线宽路径：沿点列两侧各偏移 w(q)/2，返回闭合多边形的点（新艺术的粗细变化勾线靠它）。
// t<1 时只取前一段，线宽仍按整条线的位置 q 计算，所以画出来的过程中粗细不会跳变。
function ribbon(pts, wf, t = 1) {
  const n = pts.length, m = Math.max(2, Math.ceil(clamp(t) * (n - 1)) + 1), L = [], R = [];
  for (let i = 0; i < Math.min(m, n); i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = wf(i / (n - 1)) / 2;
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  return L.concat(R.reverse());
}
const swellW = (wmax, wend = 0.8) => q => wend + (wmax - wend) * Math.sin(Math.PI * q);   // 两头尖、中间粗
// 向内收的螺旋点列（鞭线末端的卷曲）
function spiral(cx, cy, r0, a0, turns, dir = 1, n = 24) {
  const o = [];
  for (let i = 0; i <= n; i++) { const q = i / n, a = a0 + dir * q * turns * TAU, r = r0 * (1 - q * 0.85); o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return o;
}
// 切面：沿多边形内一条方向由亮到暗的半透明渐变（立体主义的明暗切面，同原作 plane）
function plane(k, pts, col, alpha, dir, dark = 0.4, light = 0.25) {
  const a = pts[0], b = pts[dir % pts.length === 0 ? 1 : dir % pts.length];
  const g = k.createLinearGradient(a[0], a[1], b[0], b[1]);
  g.addColorStop(0, rgba(mix3(col, [250, 244, 228], light), alpha));
  g.addColorStop(0.55, rgba(col, alpha));
  g.addColorStop(1, rgba(mix3(col, [45, 35, 25], dark), alpha));
  k.fillStyle = g; fillPts(k, pts);
}
// 底色加固定种子的噪点
function grainBg(k, col, dot, n, seed) {
  k.fillStyle = col; k.fillRect(0, 0, CW, CH);
  k.fillStyle = dot;
  for (let i = 0; i < n; i++) k.fillRect(rnd(i, seed) * CW, rnd(i, seed + 1) * CH, 1 + rnd(i, seed + 2) * 1.5, 1);
}
const CELLS = [];
const INK = '#1E1A16';
// 在多边形列表上按顺序画轮廓：第 i 个在 t0+i*step 起、用 dur 秒画完
function outlines(k, list, u, t0, step, dur) { list.forEach((p, i) => partial(k, p.concat([p[0]]), seg(u, t0 + i * step, t0 + i * step + dur))); }

// @shared
// （本包目前没有跨元素共用的代码）
