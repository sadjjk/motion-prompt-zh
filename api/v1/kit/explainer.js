// Motion Prompt #4 040–071 · MIT License (c) 2026 Berryxia · https://github.com/andyhuo520/vibe-knowledge
//
// Kit for pack "explainer" (Explainer styles / 解説スタイル): the constants and helpers its elements share.
// Elements #4 040–071 · 539x208 px · cycle 6.4 s. Element code: https://sadjjk.github.io/motion-prompt-zh/api/v1/zh-Hans/e/<id>.txt (or /en/, /ja/).
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
// 讲解画风（每格 539x208、6.4 秒周期；每格都是只依赖时间 u 的纯函数）
// 画风取自 vibe-knowledge（Berryxia，MIT）各套 STYLE.md 的配色、材质与动态语法；画面是为本库新写的通用讲解案例，
// 原作是跟旁白走的一次性长镜头，这里压缩成 0–5.4 秒展示、5.4–6.4 秒复位的无缝循环。不使用原作的风格图、视频与字体。
const CW = 539, CH = 208;
const CYC = 6.4;
const SHOW = 5.4;                                   // 展示段结束、复位段开始的时刻
const TAU = Math.PI * 2;
// 系统字体栈：不打包字体文件
const SANS = "'PingFang SC', 'Noto Sans CJK SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif";
const SERIF = "'Songti SC', 'Noto Serif CJK SC', 'STSong', 'SimSun', serif";
const KAI = "'Kaiti SC', 'STKaiti', 'KaiTi', 'Noto Serif CJK SC', serif";
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
// 复位段：0 = 展示中，1 = 完全复位
const resetK = u => inOut3(seg(u, SHOW, SHOW + 0.6));

// 折线工具：按累计长度截取，用于"一笔笔画出来"
function polyLen(pts) { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; }
function polyCut(pts, len) {
  const out = [pts[0]]; let s = 0;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], d = Math.hypot(x1 - x0, y1 - y0);
    if (s + d >= len) { const t = d ? (len - s) / d : 0; out.push([mix(x0, x1, t), mix(y0, y1, t)]); return out; }
    out.push(pts[i]); s += d;
  }
  return out;
}
function polyAt(pts, len) { const c = polyCut(pts, len); return c[c.length - 1]; }
// 画出折线的前 prog（0..1）比例
function strokePts(k, pts) { k.beginPath(); pts.forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y))); k.stroke(); }
function strokeProg(k, pts, prog) { if (prog > 0) strokePts(k, prog >= 1 ? pts : polyCut(pts, polyLen(pts) * prog)); }
// 圆采样成闭合折线（从 a0 起顺时针），便于按进度画出
function circlePts(cx, cy, r, n = 48, a0 = -Math.PI / 2) { const out = []; for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * TAU; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return out; }

const CELLS = [];
