// Motion Prompt #2 124–132 · MIT License (c) 2026 ai-martin-lau · https://github.com/ai-martin-lau/vibe-fx
//
// Kit for pack "vibefx" (Short-video motion / ショート動画モーション): the constants and helpers its elements share.
// Elements #2 124–132 · 539x208 px · cycle 6.4 s. Element code: https://sadjjk.github.io/motion-prompt-zh/api/v1/zh-Hans/e/<id>.txt (or /en/, /ja/).
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
// 短视频动效（每格 539x208、6.4 秒周期；每格都是只依赖时间 u 的纯函数）
// 改写自 vibe-fx（ai-martin-lau）的 Canvas 2D 画法：竖屏 2.5 秒单次片段重新构图为横向卡片，
// 0–5.4 秒展示，5.4–6.4 秒复位；没有随机数。
const CW = 539, CH = 208;
const CYC = 6.4;
const SHOW = 5.4;
const TAU = Math.PI * 2;
const SANS = "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', 'Hiragino Sans', 'Helvetica Neue', Arial, sans-serif";
// 配色：深底 + 金色强调
const BG = '#14161C', INK = '#EDE6D6', DIM = '#6E7180', GOLD = '#E8B04A', GOLD_D = '#8A6420';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;
const seg = (u, a, b) => clamp((u - a) / (b - a));
const inOut3 = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const out3 = t => 1 - Math.pow(1 - t, 3);
// 阻尼弹簧 0→1（t<=0 为 0）
const spring = t => (t <= 0 ? 0 : 1 - Math.exp(-7 * t) * Math.cos(13 * t));
const resetK = u => inOut3(seg(u, SHOW, SHOW + 0.6));
const fadeIn = u => 1 - resetK(u);

function txt(k, s, x, y, size, col, align = 'center', weight = 600) {
  k.font = `${weight} ${size}px ${SANS}`; k.fillStyle = col; k.textAlign = align; k.textBaseline = 'middle'; k.fillText(s, x, y);
}
function rr(k, x, y, w, h, r) {
  k.beginPath(); k.moveTo(x + r, y);
  k.arcTo(x + w, y, x + w, y + h, r); k.arcTo(x + w, y + h, x, y + h, r);
  k.arcTo(x, y + h, x, y, r); k.arcTo(x, y, x + w, y, r); k.closePath();
}
function bg(k) { k.fillStyle = BG; k.fillRect(0, 0, CW, CH); }
// 发光线：从 (x1,y1) 画到 (x2,y2) 的前 t 段（0..1），竖向时走 S 形曲线
function glowLine(k, x1, y1, x2, y2, t, col, lw) {
  if (t <= 0) return;
  const my = (y1 + y2) / 2, n = 24, T = clamp(t);
  k.save(); k.strokeStyle = col; k.lineWidth = lw; k.lineCap = 'round'; k.shadowColor = col; k.shadowBlur = 6;
  k.beginPath();
  for (let i = 0; i <= n; i++) {
    // 三次贝塞尔 (x1,y1) (x1,my) (x2,my) (x2,y2)，取 0..T 段
    const q = T * i / n, a = 1 - q;
    const x = a * a * a * x1 + 3 * a * a * q * x1 + 3 * a * q * q * x2 + q * q * q * x2;
    const y = a * a * a * y1 + 3 * a * a * q * my + 3 * a * q * q * my + q * q * q * y2;
    if (i === 0) k.moveTo(x, y); else k.lineTo(x, y);
  }
  k.stroke(); k.restore();
}
const CELLS = [];

// @shared
// （本包目前没有跨元素共用的代码）
