// Motion Prompt #1 049~060 · MIT License (c) 2026 Jakub Antalik · https://libraries.dev/
//
// Kit for pack "aiux" (AI interface motion / AIインターフェースの動き): the constants and helpers its elements share.
// Elements #1 049~060 · 539x208 px · cycle 4.8 s. Element code: https://sadjjk.github.io/motion-prompt-zh/api/v1/zh-Hans/e/<id>.txt (or /en/, /ja/).
//
// Run one element standalone in a browser:
//   1. paste this file into a <script>,
//   2. paste the element code below it (it assigns CELLS[n - 1], n = the element number inside the pack),
//   3. then add:
//        const c = document.createElement('canvas'); c.width = 539; c.height = 208; document.body.append(c);
//        const k = c.getContext('2d'), cell = CELLS.find(Boolean), t0 = performance.now();
//        (function loop() {
//          const u = ((performance.now() - t0) / 1000) % 4.8;   // seconds, 0 <= u < 4.8
//          k.setTransform(1, 0, 0, 1, 0, 0); k.clearRect(0, 0, 539, 208);
//          k.save(); cell(k, 539, 208, u); k.restore();
//          requestAnimationFrame(loop);
//        })();
// Every cell is a pure function of u, so the same call renders video frames: u = frame / fps.

// @kit
// AI 界面动效 12（每格 539x208、4.8 秒周期；每格都是只依赖时间 u 的纯函数）
// 按 Libraries.dev（Jakub Antalik，MIT）的 border-beam、thinking-orbs、liquid-gooey 的公开效果与参数，
// 用 Canvas 2D 重新实现。深色底，对应原版默认 theme="dark"。
const CW = 539, CH = 208;
const CYC = 4.8;                                   // 周期 4.8 秒，所有运动按整数圈数设计，循环无缝
const TAU = Math.PI * 2;
const C = {
  bg: '#0E0E12', panel: '#17171D', line: 'rgba(255,255,255,0.09)',
  text: '#ECECF1', muted: '#7D7D8A', goo: '#F1F1F4', ink: '#17171D',
};
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;
const inOut3 = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const out3 = t => 1 - Math.pow(1 - t, 3);
// 近似 cubic-bezier(0.34, 1.56, 0.64, 1)：末端约 10% 回弹（原版 morph 展开用的缓动）
const backOut = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const seg = (u, a, b) => clamp((u - a) / (b - a));
const hsla = (h, s, l, a) => `hsla(${((h % 360) + 360) % 360},${s}%,${l}%,${a})`;

function bg(k) { k.fillStyle = C.bg; k.fillRect(0, 0, CW, CH); }
function rr(k, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  k.beginPath(); k.moveTo(x + r, y); k.arcTo(x + w, y, x + w, y + h, r); k.arcTo(x + w, y + h, x, y + h, r);
  k.arcTo(x, y + h, x, y, r); k.arcTo(x, y, x + w, y, r); k.closePath();
}
function txt(k, s, x, y, font, col, align = 'left') {
  k.font = font; k.fillStyle = col; k.textAlign = align; k.textBaseline = 'middle'; k.fillText(s, x, y);
}
// 示例输入框：深色面板 + 细边框 + 占位文字 + 右侧发送按钮
function field(k, x, y, w, h, r, hint, send = true) {
  k.fillStyle = C.panel; rr(k, x, y, w, h, r); k.fill();
  k.strokeStyle = C.line; k.lineWidth = 1; rr(k, x + 0.5, y + 0.5, w - 1, h - 1, r); k.stroke();
  txt(k, hint, x + 22, y + h / 2, `400 14px ${FONT}`, C.muted);
  if (send) {
    const s = h - 20, sx = x + w - s - 10, sy = y + 10;
    k.fillStyle = C.text; k.beginPath(); k.arc(sx + s / 2, sy + s / 2, s / 2, 0, TAU); k.fill();
    k.strokeStyle = C.ink; k.lineWidth = 2; k.lineCap = 'round'; k.beginPath();
    k.moveTo(sx + s / 2, sy + s * 0.7); k.lineTo(sx + s / 2, sy + s * 0.3);
    k.moveTo(sx + s * 0.34, sy + s * 0.46); k.lineTo(sx + s / 2, sy + s * 0.3); k.lineTo(sx + s * 0.66, sy + s * 0.46); k.stroke();
  }
}
// 圆角矩形的周长参数化：t ∈ [0,1) 从上边左端起顺时针，返回 [x, y]
function perim(x, y, w, h, r, t) {
  const sw = w - 2 * r, sh = h - 2 * r, arc = Math.PI * r / 2;
  let d = (((t % 1) + 1) % 1) * (2 * sw + 2 * sh + 4 * arc);
  if (d < sw) return [x + r + d, y]; d -= sw;
  if (d < arc) { const a = -Math.PI / 2 + d / r; return [x + w - r + r * Math.cos(a), y + r + r * Math.sin(a)]; } d -= arc;
  if (d < sh) return [x + w, y + r + d]; d -= sh;
  if (d < arc) { const a = d / r; return [x + w - r + r * Math.cos(a), y + h - r + r * Math.sin(a)]; } d -= arc;
  if (d < sw) return [x + w - r - d, y + h]; d -= sw;
  if (d < arc) { const a = Math.PI / 2 + d / r; return [x + r + r * Math.cos(a), y + h - r + r * Math.sin(a)]; } d -= arc;
  if (d < sh) return [x, y + h - r - d]; d -= sh;
  const a = Math.PI + d / r; return [x + r + r * Math.cos(a), y + r + r * Math.sin(a)];
}
// 沿边框行进的彩色光束：三层（宽而淡的 bloom、中层、细亮芯），尾部渐隐，色相沿光束变化
function beam(k, x, y, w, h, r, head, len, hue0) {
  const N = 40;
  k.lineCap = 'round';
  for (const ps of [{ lw: 9, a: 0.16, blur: 16 }, { lw: 4, a: 0.45, blur: 8 }, { lw: 1.6, a: 1, blur: 0 }]) {
    for (let i = 0; i < N; i++) {
      const f0 = i / N, f1 = (i + 1) / N;
      const p0 = perim(x, y, w, h, r, head - len * (1 - f0)), p1 = perim(x, y, w, h, r, head - len * (1 - f1));
      const a = ps.a * Math.pow(f1, 1.5), hue = hue0 + f1 * 150;
      k.strokeStyle = hsla(hue, 100, 64, a); k.lineWidth = ps.lw;
      k.shadowColor = ps.blur ? hsla(hue, 100, 60, a) : 'transparent'; k.shadowBlur = ps.blur;
      k.beginPath(); k.moveTo(p0[0], p0[1]); k.lineTo(p1[0], p1[1]); k.stroke();
    }
  }
  const p = perim(x, y, w, h, r, head);
  k.shadowColor = hsla(hue0 + 150, 100, 70, 1); k.shadowBlur = 12; k.fillStyle = '#fff';
  k.beginPath(); k.arc(p[0], p[1], 1.8, 0, TAU); k.fill();
  k.shadowBlur = 0; k.shadowColor = 'transparent';
}
// 彩色锥形渐变（呼吸光晕用），start 随时间旋转
function conic(k, cx, cy, start, alpha) {
  const g = k.createConicGradient(start, cx, cy);
  [[0, 330], [0.2, 30], [0.4, 60], [0.6, 160], [0.8, 220], [1, 330]].forEach(([o, h]) => g.addColorStop(o, hsla(h, 100, 62, alpha)));
  return g;
}

// —— 点阵球（thinking-orbs）——
// 斐波那契球面均匀分布的单位点，初始化时生成一次（常量，不随时间变化）
function fib(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(1 - y * y), t = i * 2.399963229728653;
    out.push([Math.cos(t) * r, y, Math.sin(t) * r]);
  }
  return out;
}
const SPHERE = fib(240);
const NODES = fib(10);
// 先绕 Y 轴转 a，再绕 X 轴转 b（视角俯仰），返回 [x, y, z]，z>0 朝向观众
function rot(p, a, b) {
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
  const x = p[0] * ca + p[2] * sa, z1 = -p[0] * sa + p[2] * ca;
  return [x, p[1] * cb - z1 * sb, p[1] * sb + z1 * cb];
}
const ORB = { x: 200, y: 104, r: 58, tilt: 0.32 };
// 画一个球面点：越靠前越大越亮；boost 用于高亮（扫描线、波峰、数据包）
function dot(k, p, base = 1, boost = 0) {
  const d = (p[2] + 1) / 2;
  const a = clamp((0.1 + 0.6 * d) * base + boost);
  const s = 0.8 + 1.2 * d + boost * 1.4;
  k.fillStyle = `rgba(236,236,241,${a})`;
  k.beginPath(); k.arc(ORB.x + p[0] * ORB.r, ORB.y - p[1] * ORB.r, s, 0, TAU); k.fill();
}
function orbLabel(k, s) { txt(k, s, 296, ORB.y, `500 15px ${FONT}`, C.muted); }
const wrapPi = a => Math.atan2(Math.sin(a), Math.cos(a));

// —— 液态融合（liquid-gooey）——
// 两圆之间的 metaball 颈部（按 paper.js metaball 示例的几何构造）；v 随距离减小，分离时颈部平滑收细
function neck(k, x1, y1, r1, x2, y2, r2, maxD) {
  const d = Math.hypot(x2 - x1, y2 - y1);
  if (r1 <= 0 || r2 <= 0 || d > maxD || d <= Math.abs(r1 - r2)) return;
  const v = 0.5 * (1 - clamp((d - (r1 + r2)) / (maxD - (r1 + r2) || 1)));
  if (v <= 0.001) return;
  let u1 = 0, u2 = 0;
  if (d < r1 + r2) {
    u1 = Math.acos(clamp((r1 * r1 + d * d - r2 * r2) / (2 * r1 * d), -1, 1));
    u2 = Math.acos(clamp((r2 * r2 + d * d - r1 * r1) / (2 * r2 * d), -1, 1));
  }
  const a0 = Math.atan2(y2 - y1, x2 - x1), am = Math.acos(clamp((r1 - r2) / d, -1, 1));
  const a1a = a0 + u1 + (am - u1) * v, a1b = a0 - u1 - (am - u1) * v;
  const a2a = a0 + Math.PI - u2 - (Math.PI - u2 - am) * v, a2b = a0 - Math.PI + u2 + (Math.PI - u2 - am) * v;
  const P = (cx, cy, r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const p1a = P(x1, y1, r1, a1a), p1b = P(x1, y1, r1, a1b), p2a = P(x2, y2, r2, a2a), p2b = P(x2, y2, r2, a2b);
  let d2 = Math.min(v * 2.4, Math.hypot(p1a[0] - p2a[0], p1a[1] - p2a[1]) / (r1 + r2));
  d2 *= Math.min(1, d * 2 / (r1 + r2));
  const h1 = r1 * d2, h2 = r2 * d2, H = (p, a, l) => [p[0] + l * Math.cos(a), p[1] + l * Math.sin(a)];
  const c1 = H(p1a, a1a - Math.PI / 2, h1), c2 = H(p2a, a2a + Math.PI / 2, h2);
  const c3 = H(p2b, a2b - Math.PI / 2, h2), c4 = H(p1b, a1b + Math.PI / 2, h1);
  k.beginPath(); k.moveTo(p1a[0], p1a[1]);
  k.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], p2a[0], p2a[1]);
  k.lineTo(p2b[0], p2b[1]);
  k.bezierCurveTo(c3[0], c3[1], c4[0], c4[1], p1b[0], p1b[1]);
  k.closePath(); k.fill();
}
function disc(k, x, y, r) { k.beginPath(); k.arc(x, y, Math.max(0, r), 0, TAU); k.fill(); }
// 多项式平滑并集（smin）：两个形状表面相距小于 s 时被液体桥接，s 越大越"黏"
const smin = (a, b, s) => { const hh = clamp(0.5 + 0.5 * (b - a) / s); return mix(b, a, hh) - s * hh * (1 - hh); };
// 按有向距离场 sdf（<0 为液体内部）画液体：marching squares 求零等值线，整块一次 fill（相邻格子之间无接缝）
function liquid(k, sdf, x0, y0, x1, y1, st) {
  const nx = Math.ceil((x1 - x0) / st), ny = Math.ceil((y1 - y0) / st), W1 = nx + 1;
  const V = new Float32Array(W1 * (ny + 1));
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) V[j * W1 + i] = -sdf(x0 + i * st, y0 + j * st);
  k.beginPath();
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = V[j * W1 + i], b = V[j * W1 + i + 1], c = V[(j + 1) * W1 + i + 1], d = V[(j + 1) * W1 + i];
    if (a < 0 && b < 0 && c < 0 && d < 0) continue;
    const X = x0 + i * st, Y = y0 + j * st;
    const cs = [[X, Y, a], [X + st, Y, b], [X + st, Y + st, c], [X, Y + st, d]], pts = [];
    for (let e = 0; e < 4; e++) {
      const p = cs[e], q = cs[(e + 1) % 4];
      if (p[2] >= 0) pts.push(p);
      if ((p[2] >= 0) !== (q[2] >= 0)) { const t = p[2] / (p[2] - q[2]); pts.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    }
    k.moveTo(pts[0][0], pts[0][1]);
    for (let m = 1; m < pts.length; m++) k.lineTo(pts[m][0], pts[m][1]);
    k.closePath();
  }
  k.fill();
}
// 鼠标指针（press 0→1 为按下）与点击涟漪（r 半径，a 不透明度）
function cursor(k, x, y, press) {
  const s = 1 - 0.12 * press;
  k.save(); k.translate(x, y); k.scale(s, s);
  k.beginPath(); k.moveTo(0, 0); k.lineTo(0, 17); k.lineTo(4.5, 13); k.lineTo(7.5, 19.5); k.lineTo(10.5, 18.2); k.lineTo(7.6, 11.8); k.lineTo(13, 11.8); k.closePath();
  k.fillStyle = '#FFFFFF'; k.fill(); k.strokeStyle = '#0E0E12'; k.lineWidth = 1.3; k.lineJoin = 'round'; k.stroke();
  k.restore();
}
function ripple(k, x, y, t) {
  if (t <= 0 || t >= 1) return;
  k.strokeStyle = `rgba(236,236,241,${0.45 * (1 - t)})`; k.lineWidth = 1.5;
  k.beginPath(); k.arc(x, y, 6 + 26 * out3(t), 0, TAU); k.stroke();
}
// 背景的浅点阵，让液体元素有参照
function grid(k) {
  k.fillStyle = 'rgba(255,255,255,0.05)';
  for (let x = 14; x < CW; x += 22) for (let y = 16; y < CH; y += 22) k.fillRect(x, y, 1.2, 1.2);
}
const CELLS = [];
