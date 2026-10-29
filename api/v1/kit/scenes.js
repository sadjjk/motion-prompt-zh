// Motion Prompt #4 001~042 · MIT License (c) 2026 Yun · https://github.com/skylarzzzz/motion-atlas
// Also: MIT-0 License (c) 2026 illli Ai Studio · https://ui2v.com/ (#4 033~035)
// Also: MIT License (c) 2026 Hannah · https://kittenjam-motion-library.vercel.app/ (#4 036~042)
//
// Kit for pack "scenes" (Styled scenes / スタイルシーン): the constants and helpers its elements share.
// Elements #4 001~042 · 539x208 px · cycle 6.4 s. Element code: https://sadjjk.github.io/motion-prompt-zh/api/v1/zh-Hans/e/<id>.txt (or /en/, /ja/).
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
// 风格画面（每格 539x208、6.4 秒周期；每格都是只依赖时间 u 的纯函数）
// 按 Motion Atlas（Yun，MIT）中对应款式的画面、配色与运动，重新构图到卡片尺寸，并从 8 秒一次性片段
// 改为无缝循环：多数款 0–5.4 秒展示，5.4–6.4 秒复位；周期运动按整数圈设计。随机改为按下标确定性生成。
const CW = 539, CH = 208;
const CYC = 6.4;
const SHOW = 5.4;                                   // 展示段结束、复位段开始的时刻
const TAU = Math.PI * 2;
// 系统字体栈：不打包字体文件
const SANS = "'PingFang SC', 'Noto Sans CJK SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif";
const SERIF = "'Songti SC', 'Noto Serif CJK SC', 'STSong', 'SimSun', serif";
const MONO = "'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', monospace";
const DISP = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;
const seg = (u, a, b) => clamp((u - a) / (b - a));
const inOut3 = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const out3 = t => 1 - Math.pow(1 - t, 3);
const backOut = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
// 确定性"随机"：同一下标永远得到同一个 0..1 的值
const hash = i => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
// 复位段：0 = 展示中，1 = 完全复位（淡出）
const resetK = u => inOut3(seg(u, SHOW, SHOW + 0.6));
// 复位后的淡入：u 接近 CYC 时从 0 回到展示起点
const fadeIn = u => 1 - resetK(u);

function font(k, w, s, f) { k.font = `${w} ${s}px ${f}`; }
function txt(k, s, x, y, f, col, align = 'left', base = 'alphabetic') {
  k.font = f; k.fillStyle = col; k.textAlign = align; k.textBaseline = base; k.fillText(s, x, y);
}
function rr(k, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  k.beginPath(); k.moveTo(x + r, y); k.arcTo(x + w, y, x + w, y + h, r); k.arcTo(x + w, y + h, x, y + h, r);
  k.arcTo(x, y + h, x, y, r); k.arcTo(x, y, x + w, y, r); k.closePath();
}
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const lerpC = (a, b, t) => [Math.round(mix(a[0], b[0], t)), Math.round(mix(a[1], b[1], t)), Math.round(mix(a[2], b[2], t))];

// 颗粒：初始化时用 hash 画一张 64×64 的灰度噪点图（常量），绘制时只平铺，不再取随机数
const GRAIN = (() => {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  for (let i = 0; i < 64 * 64; i++) { const v = Math.floor(hash(i + 7) * 255); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(i % 64, Math.floor(i / 64), 1, 1); }
  return c;
})();
function grain(k, a, mode = 'overlay') {
  k.save(); k.globalAlpha = a; k.globalCompositeOperation = mode;
  k.fillStyle = k.createPattern(GRAIN, 'repeat'); k.fillRect(0, 0, CW, CH); k.restore();
}
// 纸纹：固定位置的细短划（宣纸、笺纸底色用），按参数缓存成一张常量图层，绘制时只贴图
const PAPERS = {};
function paper(k, col, n, seed) {
  const key = col.join() + n + '/' + seed;
  if (!PAPERS[key]) {
    const c = document.createElement('canvas'); c.width = CW; c.height = CH; const g = c.getContext('2d');
    for (let i = 0; i < n; i++) {
      g.fillStyle = rgba(col, hash(seed + i * 3) * 0.08);
      g.fillRect(hash(seed + i * 3 + 1) * CW, hash(seed + i * 3 + 2) * CH, 1 + hash(seed + i) * 2, 1);
    }
    PAPERS[key] = c;
  }
  k.drawImage(PAPERS[key], 0, 0);
}
// 二维值噪声与分形叠加（确定性，替代原作者的 fbm2）：返回 0..1
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
  const h = (a, b) => hash(a * 157 + b * 311);
  return mix(mix(h(xi, yi), h(xi + 1, yi), sx), mix(h(xi, yi + 1), h(xi + 1, yi + 1), sx), sy);
}
function fbm2(x, y, oct = 4) { let s = 0, a = 0.5, n = 0; for (let i = 0; i < oct; i++) { s += a * vnoise(x, y); n += a; x = x * 2.03 + 1.7; y = y * 2.03 + 9.2; a *= 0.5; } return s / n; }
// 径向光晕
function glow(k, x, y, r, c, a) {
  if (a <= 0) return;
  const g = k.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${c},${a})`); g.addColorStop(1, `rgba(${c},0)`);
  k.fillStyle = g; k.fillRect(x - r, y - r, r * 2, r * 2);
}
// 一次性计算并缓存的静态图层（背景、地图、走线等不随时间变化的部分），绘制时只贴图
const LAYERS = {};
function layer(name, draw) {
  if (!LAYERS[name]) { const c = document.createElement('canvas'); c.width = CW; c.height = CH; draw(c.getContext('2d')); LAYERS[name] = c; }
  return LAYERS[name];
}
const CELLS = [];

// @shared
// 36–39 改写自 KittenJam Motion Library（Hannah 整理，MIT）的共用件：按下标与通道取确定性"随机"值、模拟鼠标指针、点击涟漪
const kjHash = (i, ch = 0) => hash(i * 7.31 + ch * 113.7);
// 模拟鼠标指针，箭头尖端 (x, y) 为热点；press 0→1 为按下，箭头缩小 12%
function kjCursor(k, x, y, press = 0, dark = false) {
  const s = 1 - 0.12 * press;
  k.save(); k.translate(x, y); k.scale(s, s);
  k.beginPath(); k.moveTo(0, 0); k.lineTo(0, 17); k.lineTo(4.5, 13); k.lineTo(7.5, 19.5); k.lineTo(10.5, 18.2); k.lineTo(7.6, 11.8); k.lineTo(13, 11.8); k.closePath();
  k.fillStyle = dark ? '#16151B' : '#FFFFFF'; k.fill(); k.strokeStyle = dark ? '#FFFFFF' : '#16151B'; k.lineWidth = 1.3; k.lineJoin = 'round'; k.stroke();
  k.restore();
}
// 点击涟漪：t 0→1 时半径 0→r、透明度 a→0
function kjRipple(k, x, y, t, r = 22, col = '255,255,255', a = 0.7) {
  if (t <= 0 || t >= 1) return;
  k.save(); k.strokeStyle = `rgba(${col},${a * (1 - t)})`; k.lineWidth = 2;
  k.beginPath(); k.arc(x, y, r * out3(t), 0, TAU); k.stroke(); k.restore();
}
