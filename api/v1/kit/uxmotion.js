// Motion Prompt #1 061~097 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/
//
// Kit for pack "uxmotion" (Interaction & data motion / インタラクションとデータの動き): the constants and helpers its elements share.
// Elements #1 061~097 · 539x208 px · cycle 6.4 s. Element code: https://sadjjk.github.io/motion-prompt-zh/api/v1/zh-Hans/e/<id>.txt (or /en/, /ja/).
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
// 交互与数据动效（每格 539x208、6.4 秒周期；每格都是只依赖时间 u 的纯函数）
// 按 Lucian UX/UI Prompt（Seokwoooo，MIT）中对应元素的结构、时长、缓动与配色，在 Canvas 2D 中重写为卡片演示：
// 需要用户操作的元素（光标、滚动、点击）用模拟指针与模拟滚动条做成循环演示。
// 多数元素 0–5.4 秒展示，5.4–6.4 秒复位；周期运动按整数圈设计。随机按下标确定性生成。
const CW = 539, CH = 208;
const CYC = 6.4;
const SHOW = 5.4;                                   // 展示段结束、复位段开始的时刻
const TAU = Math.PI * 2;
// 系统字体栈：不打包字体文件
const SANS = "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Arial, sans-serif";
const SERIF = "'Iowan Old Style', 'Songti SC', Georgia, 'Times New Roman', serif";
const MONO = "'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', monospace";
// Lucian 主题色（tokens.css 的 light 取值；UXD 为 dark 取值，原作为暗色的元素使用）
const UX = {
  page: '#F4F2EE', surface: '#FFFFFF', surface2: '#F5F3EF', surface3: '#EAE7E1',
  ink: '#16151B', ink2: '#57535F', ink3: '#8E8A97', line: 'rgba(22,21,27,.09)', line2: 'rgba(22,21,27,.17)',
  accent: '#6A57F2', accent2: '#2F8FE0', accentSoft: 'rgba(106,87,242,.12)', mint: '#119C72', warn: '#D6731E', danger: '#D93A55',
  shadow: 'rgba(40,30,80,.14)', grad: ['#7B61FF', '#3D8BFF', '#1FB89A'],
};
const UXD = {
  page: '#07080D', surface: '#13141C', surface2: '#1A1B25', surface3: '#252632',
  ink: '#F4F0E8', ink2: 'rgba(244,240,232,.68)', ink3: 'rgba(244,240,232,.42)', line: 'rgba(255,255,255,.08)', line2: 'rgba(255,255,255,.16)',
  accent: '#B7A4FF', accent2: '#7DB4FF',
};

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;
const seg = (u, a, b) => clamp((u - a) / (b - a));
const inOut3 = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const out3 = t => 1 - Math.pow(1 - t, 3);
const backOut = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
// Lucian 的 --ux-ease cubic-bezier(.2,.8,.2,1) 近似：快起慢收
const uxEase = t => 1 - Math.pow(1 - t, 3.2);
// 确定性"随机"：同一下标永远得到同一个 0..1 的值
const hash = i => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
// 复位段：0 = 展示中，1 = 完全复位（淡出）；fadeIn = 1 - resetK
const resetK = u => inOut3(seg(u, SHOW, SHOW + 0.6));
const fadeIn = u => 1 - resetK(u);

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
// 径向光晕
function glow(k, x, y, r, c, a) {
  if (a <= 0) return;
  const g = k.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${c},${a})`); g.addColorStop(1, `rgba(${c},0)`);
  k.fillStyle = g; k.fillRect(x - r, y - r, r * 2, r * 2);
}
// 一次性画好并缓存的 539×208 静态图层
const LAYERS = {};
function layer(name, draw) {
  if (!LAYERS[name]) { const c = document.createElement('canvas'); c.width = CW; c.height = CH; draw(c.getContext('2d')); LAYERS[name] = c; }
  return LAYERS[name];
}
// 卡片：白底圆角 + 柔和阴影（Lucian surface + shadow）
function card(k, x, y, w, h, r = 12, fill = UX.surface) {
  k.save(); k.shadowColor = UX.shadow; k.shadowBlur = 14; k.shadowOffsetY = 4;
  k.fillStyle = fill; rr(k, x, y, w, h, r); k.fill(); k.restore();
  k.strokeStyle = UX.line; k.lineWidth = 1; rr(k, x + 0.5, y + 0.5, w - 1, h - 1, r); k.stroke();
}
// 模拟鼠标指针（press 0→1 为按下）
function cursor(k, x, y, press = 0, dark = false) {
  const s = 1 - 0.12 * press;
  k.save(); k.translate(x, y); k.scale(s, s);
  k.beginPath(); k.moveTo(0, 0); k.lineTo(0, 17); k.lineTo(4.5, 13); k.lineTo(7.5, 19.5); k.lineTo(10.5, 18.2); k.lineTo(7.6, 11.8); k.lineTo(13, 11.8); k.closePath();
  k.fillStyle = dark ? '#16151B' : '#FFFFFF'; k.fill(); k.strokeStyle = dark ? '#FFFFFF' : '#16151B'; k.lineWidth = 1.3; k.lineJoin = 'round'; k.stroke();
  k.restore();
}
// 点击涟漪（t 0→1）
function ripple(k, x, y, t, col = '106,87,242') {
  if (t <= 0 || t >= 1) return;
  k.strokeStyle = `rgba(${col},${0.5 * (1 - t)})`; k.lineWidth = 1.5;
  k.beginPath(); k.arc(x, y, 5 + 22 * out3(t), 0, TAU); k.stroke();
}
// 模拟滚动条：右侧细轨与滑块（p 为 0..1 滚动进度，frac 为可视比例）
function scrollbar(k, p, frac = 0.3, x = CW - 8, y0 = 10, y1 = CH - 10, dark = false) {
  const H = y1 - y0, th = Math.max(16, H * frac);
  k.fillStyle = dark ? 'rgba(255,255,255,.08)' : 'rgba(22,21,27,.06)'; rr(k, x, y0, 4, H, 2); k.fill();
  k.fillStyle = dark ? 'rgba(255,255,255,.35)' : 'rgba(22,21,27,.28)'; rr(k, x, y0 + (H - th) * clamp(p), 4, th, 2); k.fill();
}
// 平滑往返：0→1→0（用于"操作一次再回到起点"）
const pingPong = (u, a, b, c, d) => (u < c ? inOut3(seg(u, a, b)) : 1 - inOut3(seg(u, c, d)));
const CELLS = [];

// @shared
// 01–21 共用的小工具：CSS 贝塞尔缓动、关键帧指针路径、弹簧过渡、模拟模糊文字
// CSS cubic-bezier(x1,y1,x2,y2) 求值（牛顿迭代，8 步）
const UXA_bz = (x1, y1, x2, y2) => t => {
  if (t <= 0) return 0; if (t >= 1) return 1;
  let s = t;
  for (let i = 0; i < 8; i++) {
    const x = 3 * x1 * s * (1 - s) * (1 - s) + 3 * x2 * s * s * (1 - s) + s * s * s - t;
    const d = 3 * x1 * (1 - s) * (1 - s) + 6 * (x2 - x1) * s * (1 - s) + 3 * (1 - x2) * s * s;
    if (Math.abs(d) < 1e-6) break;
    s = clamp(s - x / d);
  }
  return 3 * y1 * s * (1 - s) * (1 - s) + 3 * y2 * s * s * (1 - s) + s * s * s;
};
// Lucian --ux-spring cubic-bezier(.34,1.45,.64,1) 的精确值（带过冲）
const UXA_spring = UXA_bz(.34, 1.45, .64, 1);
// 关键帧路径：kf = [[t, x, y], …]，段间 inOut3 缓动；用于模拟指针
const UXA_path = (kf, u) => {
  for (let i = 1; i < kf.length; i++) if (u < kf[i][0]) { const a = kf[i - 1], b = kf[i], e = inOut3((u - a[0]) / (b[0] - a[0])); return [mix(a[1], b[1], e), mix(a[2], b[2], e)]; }
  const z = kf[kf.length - 1]; return [z[1], z[2]];
};
// 离散目标值的过渡：steps = [[t, v], …]（按时间排序，第一项为初值），每次改变用 ease 在 dur 秒内过渡
const UXA_steps = (steps, u, dur, ease = UXA_spring) => {
  let v = steps[0][1];
  for (let i = 1; i < steps.length; i++) { if (u < steps[i][0]) break; v = mix(v, steps[i][1], ease(clamp((u - steps[i][0]) / dur))); }
  return v;
};
// inOut3 的反函数：由进度求时刻（用于「滚到 88% 时」这类阈值的触发时刻）
const UXA_inv = y => (y < 0.5 ? Math.cbrt(y / 4) : 1 - Math.cbrt(2 * (1 - y)) / 2);
// 模拟模糊文字：中心一层 + 6 个偏移幽灵层（半径 b 像素），与画布缩放无关，替代 filter: blur
const UXA_blurText = (k, s, x, y, b, a) => {
  if (a <= 0) return;
  if (b < 0.3) { k.globalAlpha = a; k.fillText(s, x, y); return; }
  const m = clamp(b / 6);
  k.globalAlpha = a * (1 - 0.75 * m); k.fillText(s, x, y);
  k.globalAlpha = a * (0.16 + 0.04 * (1 - m));
  for (let j = 0; j < 6; j++) { const t = j / 6 * TAU; k.fillText(s, x + Math.cos(t) * b, y + Math.sin(t) * b * 0.7); }
};

// @shared
// 滚动类元素（09–14）共用：一个周期内「向下滚到底 → 停留 → 回到顶部」的滚动进度 0..1
// a→b 秒向下滚（ux-ease 式 inOut3），5.4→6.3 秒回顶
const UXA_scroll = (u, a = 0.4, b = 4.6) => (u < SHOW ? inOut3(seg(u, a, b)) : 1 - inOut3(seg(u, SHOW, SHOW + 0.9)));

// @shared
// 22–37 共用小工具（字体串、颜色、指针关键帧、按压、事件过渡、交叉淡化、折线、照片缩略图）
const UXB_f = (w, s, fam = SANS) => `${w} ${s}px ${fam}`;
const UXB_rgb = hx => [parseInt(hx.slice(1, 3), 16), parseInt(hx.slice(3, 5), 16), parseInt(hx.slice(5, 7), 16)];
const UXB_mix = (a, b, t) => lerpC(UXB_rgb(a), UXB_rgb(b), clamp(t));
// 关键帧路径：keys = [[t, x, y], ...]，相邻关键帧之间 inOut3 插值（模拟指针轨迹）
function UXB_path(u, keys) {
  if (u <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (u < b[0]) { const e = inOut3(seg(u, a[0], b[0])); return [mix(a[1], b[1], e), mix(a[2], b[2], e)]; }
  }
  const z = keys[keys.length - 1]; return [z[1], z[2]];
}
// 点击按下程度：tc 前 0.08 秒按下，之后 0.14 秒抬起
const UXB_press = (u, tc) => (u < tc - 0.08 || u > tc + 0.14 ? 0 : u < tc ? seg(u, tc - 0.08, tc) : 1 - seg(u, tc, tc + 0.14));
// 状态过渡：evs[0] 为初值，其后 [t, 目标值]；每次切换从当时的值出发、dur 秒内缓到目标（等价 CSS transition）
function UXB_ramp(u, evs, dur, ez = out3) {
  let from = evs[0][1], to = from, t0 = -1e9;
  for (let i = 1; i < evs.length; i++) {
    const t = evs[i][0]; if (t > u) break;
    from = mix(from, to, ez(seg(t, t0, t0 + dur))); to = evs[i][1]; t0 = t;
  }
  return mix(from, to, ez(seg(u, t0, t0 + dur)));
}
// 以 1/240 秒采样 fn(u)，返回 [[-1, 初值], [切换时刻, 新值], ...]（悬停区等离散状态的切换表）
function UXB_changes(fn) {
  const out = [[-1, fn(0)]]; let cur = out[0][1];
  for (let i = 1; i <= CYC * 240; i++) { const t = i / 240, v = fn(t); if (v !== cur) { out.push([t, v]); cur = v; } }
  return out;
}
// 交叉淡化复位：a 秒前正常绘制；a→b 秒把 a 时刻画面淡出、露出 u=0 的初始画面
const UXB_OFF = {};
function UXB_xfade(k, draw, u, a, b) {
  if (u < a) { draw(k, u); return; }
  draw(k, 0);
  const al = 1 - inOut3(seg(u, a, b));
  if (al <= 0) return;
  if (!UXB_OFF.c) { UXB_OFF.c = document.createElement('canvas'); UXB_OFF.c.width = CW * 2; UXB_OFF.c.height = CH * 2; UXB_OFF.g = UXB_OFF.c.getContext('2d'); }
  const g = UXB_OFF.g; g.save(); g.scale(2, 2); draw(g, a); g.restore();
  k.save(); k.globalAlpha = al; k.drawImage(UXB_OFF.c, 0, 0, CW, CH); k.restore();
}
// 按长度比例画折线（对勾描线）
function UXB_poly(k, pts, frac) {
  let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let left = L * clamp(frac); if (left <= 0) return;
  k.beginPath(); k.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length && left > 0; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]), f = Math.min(1, left / d);
    k.lineTo(mix(pts[i - 1][0], pts[i][0], f), mix(pts[i - 1][1], pts[i][1], f)); left -= d;
  }
  k.stroke();
}
// 渐变色块 + 简单几何画成的"照片"缩略图（不用外部图片）。s = [种类, c1, c2, c3]：
// sky 天空+双峰山+地面；sun 斜向渐变+太阳+丘陵；night 夜空+月亮+星点；split 斜切两色；city 竖向渐变+楼群剪影；sea 天空+半个落日+海面
function UXB_pic(k, x, y, w, h, s) {
  const [kind, c1, c2, c3] = s, ga = k.globalAlpha;
  k.save(); k.beginPath(); k.rect(x, y, w, h); k.clip();
  if (kind === 'sky') {
    k.fillStyle = c1; k.fillRect(x, y, w, h);
    const hz = y + h * 0.6;
    k.fillStyle = c3 || c2;
    k.beginPath(); k.moveTo(x - w * 0.1, hz); k.lineTo(x + w * 0.3, y + h * 0.24); k.lineTo(x + w * 0.66, hz); k.closePath(); k.fill();
    k.globalAlpha = ga * 0.7; k.beginPath(); k.moveTo(x + w * 0.36, hz); k.lineTo(x + w * 0.72, y + h * 0.36); k.lineTo(x + w * 1.1, hz); k.closePath(); k.fill(); k.globalAlpha = ga;
    k.fillStyle = c2; k.fillRect(x, hz, w, h);
  } else if (kind === 'sun') {
    const g = k.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, c1); g.addColorStop(1, c2);
    k.fillStyle = g; k.fillRect(x, y, w, h);
    k.fillStyle = c3; k.beginPath(); k.arc(x + w * 0.68, y + h * 0.32, Math.min(w, h) * 0.16, 0, TAU); k.fill();
    k.fillStyle = 'rgba(0,0,0,.16)'; k.beginPath(); k.ellipse(x + w * 0.25, y + h * 1.02, w * 0.7, h * 0.3, 0, 0, TAU); k.fill();
    k.fillStyle = 'rgba(0,0,0,.1)'; k.beginPath(); k.ellipse(x + w * 0.9, y + h * 1.05, w * 0.6, h * 0.24, 0, 0, TAU); k.fill();
  } else if (kind === 'night') {
    k.fillStyle = c1; k.fillRect(x, y, w, h);
    k.fillStyle = c2; k.beginPath(); k.arc(x + w * 0.6, y + h * 0.32, Math.min(w, h) * 0.15, 0, TAU); k.fill();
    k.fillStyle = 'rgba(255,255,255,.7)';
    for (let j = 0; j < 6; j++) k.fillRect(x + w * hash(j + 11), y + h * 0.75 * hash(j + 23), 1.4, 1.4);
    k.fillStyle = 'rgba(0,0,0,.28)'; k.fillRect(x, y + h * 0.8, w, h);
  } else if (kind === 'split') {
    k.fillStyle = c2; k.fillRect(x, y, w, h);
    k.fillStyle = c1; k.beginPath(); k.moveTo(x, y); k.lineTo(x + w, y); k.lineTo(x, y + h); k.closePath(); k.fill();
    if (c3) { k.fillStyle = c3; rr(k, x + w * 0.56, y + h * 0.56, w * 0.24, h * 0.24, 2); k.fill(); }
  } else if (kind === 'city') {
    const g = k.createLinearGradient(x, y, x, y + h); g.addColorStop(0, c1); g.addColorStop(1, c2);
    k.fillStyle = g; k.fillRect(x, y, w, h);
    k.fillStyle = c3; const bw = w / 6;
    for (let j = 0; j < 6; j++) { const bh = h * (0.25 + 0.4 * hash(j * 3 + 5)); k.fillRect(x + j * bw + 0.5, y + h - bh, bw - 1, bh); }
  } else {
    k.fillStyle = c1; k.fillRect(x, y, w, h);
    const hz = y + h * 0.58;
    k.fillStyle = c3; k.beginPath(); k.arc(x + w * 0.66, hz, Math.min(w, h) * 0.16, Math.PI, TAU); k.fill();
    k.fillStyle = c2; k.fillRect(x, hz, w, h);
    k.fillStyle = c3; k.globalAlpha = ga * 0.45;
    for (let j = 0; j < 3; j++) k.fillRect(x + w * (0.5 + 0.06 * j), hz + h * (0.08 + 0.09 * j), w * (0.32 - 0.08 * j), 1.2);
    k.globalAlpha = ga;
  }
  k.restore();
}
