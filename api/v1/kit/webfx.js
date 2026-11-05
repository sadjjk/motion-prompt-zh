// Motion Prompt #1 200–230 · #2 120–123 · MIT License (c) 2026 sadjjk · https://reactbits.dev/
//
// Kit for pack "webfx" (Web effects / Webエフェクト): the constants and helpers its elements share.
// Elements #1 200–230 · #2 120–123 · 539x208 px · cycle 6.4 s. Element code: https://sadjjk.github.io/motion-prompt-zh/api/v1/zh-Hans/e/<id>.txt (or /en/, /ja/).
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
// 网页特效（每格 539x208、6.4 秒周期；每格都是只依赖时间 u 的纯函数）
// 效果思路参考 React Bits（David Haz）的组件说明与在线演示，代码为本仓库独立的 Canvas 2D 实现，未复制或移植其源码。
// 需要用户操作的效果用模拟光标做成循环演示：0–5.4 秒展示，5.4–6.4 秒复位。随机按下标确定性生成。
const CW = 539, CH = 208;
const CYC = 6.4;
const SHOW = 5.4;                                   // 展示段结束、复位段开始的时刻
const TAU = Math.PI * 2;
// 系统字体栈：不打包字体文件
const SANS = "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Arial, sans-serif";
const MONO = "'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', monospace";

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;
const seg = (u, a, b) => clamp((u - a) / (b - a));
const inOut3 = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const out3 = t => 1 - Math.pow(1 - t, 3);
// 确定性"随机"：同一下标永远得到同一个 0..1 的值
const hash = i => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
// 复位段：0 = 展示中，1 = 完全复位（淡出）；fadeIn = 1 - resetK
const resetK = u => inOut3(seg(u, SHOW, SHOW + 0.6));
const fadeIn = u => 1 - resetK(u);
// 光标在场程度：a→b 入场、c→d 离场（0..1）
const presence = (u, a, b, c, d) => inOut3(seg(u, a, b)) * (1 - inOut3(seg(u, c, d)));
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));

function txt(k, s, x, y, f, col, align = 'left', base = 'alphabetic') {
  k.font = f; k.fillStyle = col; k.textAlign = align; k.textBaseline = base; k.fillText(s, x, y);
}
function rr(k, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  k.beginPath(); k.moveTo(x + r, y); k.arcTo(x + w, y, x + w, y + h, r); k.arcTo(x + w, y + h, x, y + h, r);
  k.arcTo(x, y + h, x, y, r); k.arcTo(x, y, x + w, y, r); k.closePath();
}
const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
const lerpC = (a, b, t) => [Math.round(mix(a[0], b[0], t)), Math.round(mix(a[1], b[1], t)), Math.round(mix(a[2], b[2], t))];
// 关键帧路径：kf = [[t, x, y], …]，段间 inOut3 缓动；用于模拟光标
const path = (kf, u) => {
  if (u <= kf[0][0]) return [kf[0][1], kf[0][2]];
  for (let i = 1; i < kf.length; i++) if (u < kf[i][0]) { const a = kf[i - 1], b = kf[i], e = inOut3((u - a[0]) / (b[0] - a[0])); return [mix(a[1], b[1], e), mix(a[2], b[2], e)]; }
  const z = kf[kf.length - 1]; return [z[1], z[2]];
};
// 模拟鼠标指针（press 0→1 为按下；dark = 黑底白边）
function cursor(k, x, y, press = 0, dark = false) {
  const s = 1 - 0.12 * press;
  k.save(); k.translate(x, y); k.scale(s, s);
  k.beginPath(); k.moveTo(0, 0); k.lineTo(0, 17); k.lineTo(4.5, 13); k.lineTo(7.5, 19.5); k.lineTo(10.5, 18.2); k.lineTo(7.6, 11.8); k.lineTo(13, 11.8); k.closePath();
  k.fillStyle = dark ? '#16151B' : '#FFFFFF'; k.fill(); k.strokeStyle = dark ? '#FFFFFF' : '#16151B'; k.lineWidth = 1.3; k.lineJoin = 'round'; k.stroke();
  k.restore();
}
// 点击涟漪（t 0→1）
function ripple(k, x, y, t, col = '255,255,255') {
  if (t <= 0 || t >= 1) return;
  k.strokeStyle = `rgba(${col},${0.6 * (1 - t)})`; k.lineWidth = 1.5;
  k.beginPath(); k.arc(x, y, 5 + 26 * out3(t), 0, TAU); k.stroke();
}
const CELLS = [];

// @shared
// （本包目前没有跨元素共用的代码）
