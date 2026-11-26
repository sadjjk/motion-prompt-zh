// Motion Prompt #1 200–230 · 260–265 · #2 120–123 · MIT License (c) 2026 sadjjk · https://reactbits.dev/
// Also: MIT License (c) 2017 Pavel Dobryakov · https://github.com/PavelDoGreat/WebGL-Fluid-Simulation (#1 260–261)
// Also: MIT License (c) 2026 sadjjk · https://shaders.paper.design/grain-gradient (#1-262)
// Also: MIT License (c) 2026 sadjjk · https://shaders.paper.design/smoke-ring (#1-263)
// Also: MIT License (c) 2026 sadjjk · https://reactbits.dev/backgrounds/liquid-chrome (#1-264)
// Also: MIT License (c) 2026 sadjjk · https://reactbits.dev/backgrounds/silk (#1-265)
//
// Kit for pack "webfx" (Web effects / Webエフェクト): the constants and helpers its elements share.
// Elements #1 200–230 · 260–265 · #2 120–123 · 539x208 px · cycle 6.4 s. Element code: https://sadjjk.github.io/motion-prompt-zh/api/v1/zh-Hans/e/<id>.txt (or /en/, /ja/).
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
// 逐像素背景（36–41）共用：颜色换算、值噪声、离屏像素缓冲、网格放大，以及 36、37 的流体求解器。
// 都写成函数声明（会提升），元素块顶层可以直接调用；带缓存的表在第一次绘制时才建。
// 颜色：#RRGGBB → 线性光 RGB；线性光 ↔ OKLab（Björn Ottosson 的公式）
function hexLin(s) {
  return [1, 3, 5].map(i => { const c = parseInt(s.slice(i, i + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
}
function toLab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function fromLab([L, A, B]) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].map(v => Math.max(0, v));
}
// 色表：一串颜色在 OKLab 里等距插值成 n 级（循环色表把首色再写一遍在末尾），每级 3 个线性光值
function labRamp(cols, n = 256) {
  const L = cols.map(c => toLab(hexLin(c))), out = new Float32Array(3 * n);
  for (let q = 0; q < n; q++) {
    const x = q / (n - 1) * (L.length - 1), i = Math.min(L.length - 2, Math.floor(x)), t = x - i;
    out.set(fromLab([0, 1, 2].map(m => mix(L[i][m], L[i + 1][m], t))), 3 * q);
  }
  return out;
}
// 值噪声 0..1；px > 0 时 x 方向每 px 格重复一次（绕圆周取样时首尾相接）。fbm 叠 3 层
// 格点值 = hash(i·57.31 + j·113.7)；−64..63 范围内的格点在 NZ_T 里预先算好（结果与现算相同），超出范围再现算
function vnoise(x, y, px = 0) {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const i0 = px ? ((i % px) + px) % px : i, i1 = px ? (i0 + 1) % px : i + 1;
  let a, b, c, d;
  if (i0 >= -64 && i0 < 64 && i1 >= -64 && i1 < 64 && j >= -64 && j < 63) {
    const r0 = (j + 64) * 128 + 64, r1 = r0 + 128;
    a = NZ_T[r0 + i0]; b = NZ_T[r0 + i1]; c = NZ_T[r1 + i0]; d = NZ_T[r1 + i1];
  } else {
    a = hash(i0 * 57.31 + j * 113.7); b = hash(i1 * 57.31 + j * 113.7); c = hash(i0 * 57.31 + (j + 1) * 113.7); d = hash(i1 * 57.31 + (j + 1) * 113.7);
  }
  return mix(mix(a, b, sx), mix(c, d, sx), sy);
}
const NZ_T = Float64Array.from({ length: 128 * 128 }, (_, q) => hash(((q & 127) - 64) * 57.31 + ((q >> 7) - 64) * 113.7));
function fbm(x, y, px = 0) {
  const m1 = px ? 2 : 2.03, m2 = px ? 4 : 4.01;
  return 0.5 * vnoise(x, y, px) + 0.3 * vnoise(m1 * x + 11.1, m1 * y + 3.7, px * 2) + 0.2 * vnoise(m2 * x - 7.3, m2 * y + 9.2, px * 4);
}
// 每像素固定噪点表（0..1），seed 不同则互不相关
function grainTab(seed) { return Float32Array.from({ length: CW * CH }, (_, p) => hash(p + seed)); }
// 离屏像素画布：往 buf（CW×CH×3）里写 0..1 的颜色，show(k) 画到 k 上；默认 buf 是线性光、显示前转 sRGB，srgb = true 时原样显示
let LIN8 = null, RAW8 = null;
function pixels(srgb = false) {
  if (!LIN8) {
    LIN8 = new Uint8Array(1024); RAW8 = new Uint8Array(1024);
    for (let i = 0; i < 1024; i++) { const v = i / 1023; LIN8[i] = Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)); RAW8[i] = Math.round(255 * v); }
  }
  const c = document.createElement('canvas'); c.width = CW; c.height = CH;
  const x = c.getContext('2d'), img = x.createImageData(CW, CH), buf = new Float32Array(CW * CH * 3), L = srgb ? RAW8 : LIN8;
  const d = img.data;
  for (let p = 3; p < d.length; p += 4) d[p] = 255;
  const ix = v => (v = v * 1023, v > 1023 ? 1023 : v > 0 ? v | 0 : 0);
  return { buf, show(k) {
    for (let p = 0, q = 0; p < d.length; p += 4, q += 3) {
      d[p] = L[ix(buf[q])]; d[p + 1] = L[ix(buf[q + 1])]; d[p + 2] = L[ix(buf[q + 2])];
    }
    x.putImageData(img, 0, 0); k.drawImage(c, 0, 0);
  } };
}
// 把 W×H 网格上每格 C 个数的场双线性放大到 CW×CH（格心对齐），写入 out
// 每种网格尺寸的取样下标与权重只算一次（UP_T 缓存）
const UP_T = {};
function upGrid(src, W, H, C, out) {
  const key = W + 'x' + H;
  if (!UP_T[key]) {
    const kx = W / CW, ky = H / CH, I = new Int32Array(CW), FX = new Float64Array(CW), J = new Int32Array(CH), FY = new Float64Array(CH);
    for (let x = 0; x < CW; x++) { const gx = clamp((x + 0.5) * kx - 0.5, 0, W - 1.001); I[x] = gx | 0; FX[x] = gx - I[x]; }
    for (let y = 0; y < CH; y++) { const gy = clamp((y + 0.5) * ky - 0.5, 0, H - 1.001); J[y] = gy | 0; FY[y] = gy - J[y]; }
    UP_T[key] = { I, FX, J, FY };
  }
  const { I, FX, J, FY } = UP_T[key];
  for (let y = 0, p = 0; y < CH; y++) {
    const row = J[y] * W, fy = FY[y];
    for (let x = 0; x < CW; x++, p += C) {
      const fx = FX[x], o = C * (row + I[x]), o2 = o + C * W;
      for (let c = 0; c < C; c++) {
        const a = src[o + c], b = src[o2 + c], t = a + (src[o + C + c] - a) * fx;
        out[p + c] = t + (b + (src[o2 + C + c] - b) * fx - t) * fy;
      }
    }
  }
}
// 高斯印章：以 (x, y) 为中心、半径 r 格，对 3r 以内每格回调 fn(下标, g)，g = exp(−d² / 2r²)
function gaussAt(W, H, x, y, r, fn) {
  const rr = Math.ceil(3 * r);
  for (let j = Math.max(0, Math.floor(y - rr)); j <= Math.min(H - 1, Math.ceil(y + rr)); j++)
    for (let i = Math.max(0, Math.floor(x - rr)); i <= Math.min(W - 1, Math.ceil(x + rr)); i++)
      fn(j * W + i, Math.exp(-((i - x) ** 2 + (j - y) ** 2) / (2 * r * r)));
}
// 流体求解器（36、37 共用）：步骤按 Pavel Dobryakov 的 WebGL Fluid Simulation（MIT）改写，四周是墙。
// 每步 1/fps 秒：注入（回调 inject）→ 涡量 → 涡量约束 → 散度 → 压力衰减 → Jacobi 迭代 → 减压力梯度 → 半拉格朗日平流并衰减。
// o = { W, H, fps, curl, pdecay, iter, vdis, ddis, t0, steps, keep, inject(t, S) }，S = { U, V, R, G, B } 是当前各场。
// 从 t0 起走 steps 步，第 keep 步起每步存一帧染料：0..2 按平方根压成 1 字节，用 dyeAt 读回。
function fluidBake(o) {
  const { W, H } = o, N = W * H, dt = 1 / o.fps, F = () => new Float32Array(N);
  let U = F(), V = F(), U2 = F(), V2 = F(), P = F(), P2 = F(), R = F(), G = F(), B = F(), R2 = F(), G2 = F(), B2 = F();
  const C = F(), DV = F(), S = {}, frames = [];
  const samp = (f, x, y) => {
    x = Math.min(W - 1.001, Math.max(0, x)); y = Math.min(H - 1.001, Math.max(0, y));
    const i = x | 0, j = y | 0, fx = x - i, fy = y - j, q = j * W + i;
    return (f[q] * (1 - fx) + f[q + 1] * fx) * (1 - fy) + (f[q + W] * (1 - fx) + f[q + W + 1] * fx) * fy;
  };
  const kv = 1 / (1 + o.vdis * dt), kd = 1 / (1 + o.ddis * dt);
  for (let s = 1; s <= o.steps; s++) {
    // 1 注入
    Object.assign(S, { U, V, R, G, B }); o.inject(o.t0 + s * dt, S);
    // 2 涡量 curl = ∂v/∂x − ∂u/∂y
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const q = j * W + i, l = i > 0 ? q - 1 : q, r = i < W - 1 ? q + 1 : q, tp = j > 0 ? q - W : q, bt = j < H - 1 ? q + W : q;
      C[q] = 0.5 * ((V[r] - V[l]) - (U[bt] - U[tp]));
    }
    // 3 涡量约束：沿 |curl| 梯度把小涡旋推回去，让卷曲不被数值耗散抹平
    for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) {
      const q = j * W + i, nx = 0.5 * (Math.abs(C[q + 1]) - Math.abs(C[q - 1])), ny = 0.5 * (Math.abs(C[q + W]) - Math.abs(C[q - W]));
      const len = Math.hypot(nx, ny) + 1e-4, w = o.curl * C[q];
      U[q] += (ny / len) * w * dt; V[q] += (-nx / len) * w * dt;
    }
    // 4 散度（越界的邻格取反向速度）
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const q = j * W + i;
      const uL = i > 0 ? U[q - 1] : -U[q], uR = i < W - 1 ? U[q + 1] : -U[q], vT = j > 0 ? V[q - W] : -V[q], vB = j < H - 1 ? V[q + W] : -V[q];
      DV[q] = 0.5 * (uR - uL + vB - vT);
    }
    // 5 压力：沿用上一帧 × pdecay，再做 iter 次 Jacobi 迭代
    for (let q = 0; q < N; q++) P[q] *= o.pdecay;
    for (let it = 0; it < o.iter; it++) {
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        const q = j * W + i;
        const pL = i > 0 ? P[q - 1] : P[q], pR = i < W - 1 ? P[q + 1] : P[q], pT = j > 0 ? P[q - W] : P[q], pB = j < H - 1 ? P[q + W] : P[q];
        P2[q] = (pL + pR + pT + pB - DV[q]) * 0.25;
      }
      [P, P2] = [P2, P];
    }
    // 6 减压力梯度，速度场变成无散度
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const q = j * W + i;
      const pL = i > 0 ? P[q - 1] : P[q], pR = i < W - 1 ? P[q + 1] : P[q], pT = j > 0 ? P[q - W] : P[q], pB = j < H - 1 ? P[q + W] : P[q];
      U[q] -= 0.5 * (pR - pL); V[q] -= 0.5 * (pB - pT);
    }
    // 7 平流：沿速度倒推一步取值，再除以 (1 + 衰减·dt)
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const q = j * W + i, x = i - dt * U[q], y = j - dt * V[q];
      U2[q] = samp(U, x, y) * kv; V2[q] = samp(V, x, y) * kv;
    }
    [U, U2] = [U2, U]; [V, V2] = [V2, V];
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const q = j * W + i, x = i - dt * U[q], y = j - dt * V[q];
      R2[q] = samp(R, x, y) * kd; G2[q] = samp(G, x, y) * kd; B2[q] = samp(B, x, y) * kd;
    }
    [R, R2] = [R2, R]; [G, G2] = [G2, G]; [B, B2] = [B2, B];
    if (s >= o.keep) {
      const f = new Uint8Array(3 * N), e = v => Math.round(255 * Math.sqrt(Math.min(1, Math.max(0, v) / 2)));
      for (let q = 0; q < N; q++) { f[3 * q] = e(R[q]); f[3 * q + 1] = e(G[q]); f[3 * q + 2] = e(B[q]); }
      frames.push(f);
    }
  }
  return frames;
}
// 读帧表：第 f 帧（可带小数，相邻两帧线性插值）的染料乘 wgt 累加进 out
const DYE = Float32Array.from({ length: 256 }, (_, q) => 2 * (q / 255) ** 2);
function dyeAt(frames, f, out, wgt) {
  f = clamp(f, 0, frames.length - 1.0001);
  const a = Math.floor(f), A = frames[a], Bf = frames[Math.min(frames.length - 1, a + 1)], e = f - a;
  for (let i = 0; i < out.length; i++) out[i] += wgt * mix(DYE[A[i]], DYE[Bf[i]], e);
}
