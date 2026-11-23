// Motion Prompt #1 068–077 · 087 · 091–095 · 097 · 124–135 · 140–142 · 149–158 · 160–161 · 165–166 · 176–196 · 231–259 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/
// Also: MIT License (c) 2026 Hannah · https://kittenjam-motion-library.vercel.app/ (#1 075–077 · 087 · 097 · 130–135 · 140–142 · 152–158 · 193–196)
// Also: MIT License (c) 2026 sadjjk · https://github.com/sadjjk/motion-prompt-zh (#1 165–166 · 176–178)
// Also: MIT License (c) 2026 Lorenzo Cabra · https://github.com/cabralorenzo/bencho (#1 231–253)
// Also: MIT License (c) 2026 holo-card-3d contributors · https://github.com/deepslit/holo-card-3d (#1 254–259)
//
// Kit for pack "uxmotion" (Interaction & data motion / インタラクションとデータの動き): the constants and helpers its elements share.
// Elements #1 068–077 · 087 · 091–095 · 097 · 124–135 · 140–142 · 149–158 · 160–161 · 165–166 · 176–196 · 231–259 · 539x208 px · cycle 6.4 s. Element code: https://sadjjk.github.io/motion-prompt-zh/api/v1/zh-Hans/e/<id>.txt (or /en/, /ja/).
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

// @shared
// 38–50 共用（改写自 KittenJam Motion Library，Hannah，MIT）：伪 3D 倾斜投影、卡片仿射映射、按住时长
// 以卡片中心为原点：先绕 Y 轴转 ry，再绕 X 轴转 rx，透视距离 P；z 为正表示远离观众
function UXC_proj(x, y, rx, ry, cx, cy, P = 600) {
  const x1 = x * Math.cos(ry), z1 = x * Math.sin(ry);
  const y2 = y * Math.cos(rx) - z1 * Math.sin(rx), z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
  const s = P / (P + z2);
  return [cx + x1 * s, cy + y2 * s];
}
// 把 W×H 的本地坐标（左上角为原点）映射到投影后的左上、右上、左下三个角：Canvas 2D 只有仿射变换，倾斜 ≤13° 时近似误差很小
function UXC_tilt(k, W, H, rx, ry, cx, cy, sc = 1, P = 600) {
  const a = UXC_proj(-W / 2 * sc, -H / 2 * sc, rx, ry, cx, cy, P), b = UXC_proj(W / 2 * sc, -H / 2 * sc, rx, ry, cx, cy, P), c = UXC_proj(-W / 2 * sc, H / 2 * sc, rx, ry, cx, cy, P);
  k.transform((b[0] - a[0]) / W, (b[1] - a[1]) / W, (c[0] - a[0]) / H, (c[1] - a[1]) / H, a[0], a[1]);
}
// 按住程度：a 前 0.08 秒按下，b 后 0.14 秒抬起（拖动、刮擦这类持续按压）
const UXC_hold = (u, a, b) => (u >= a - 0.08 && u < b + 0.14 ? Math.min(1, seg(u, a - 0.08, a)) * (1 - seg(u, b, b + 0.14)) : 0);

// @shared
// 68–90 共用小工具（bencho，Lorenzo Cabra，MIT）：平滑指针路径、指针进出程度、两参数哈希
// 指针路径：keys = [[t, x, y], ...]，三次 Hermite 样条穿过各关键点，速度连续；端点和相邻两点相同（停顿）处速度为 0
function BN_path(u, keys) {
  const n = keys.length, same = (a, b) => a[1] === b[1] && a[2] === b[2];
  if (u <= keys[0][0]) return [keys[0][1], keys[0][2]];
  if (u >= keys[n - 1][0]) return [keys[n - 1][1], keys[n - 1][2]];
  let i = 0; while (u >= keys[i + 1][0]) i++;
  const vel = j => {
    if (j === 0 || j === n - 1 || same(keys[j], keys[j - 1]) || same(keys[j], keys[j + 1])) return [0, 0];
    const a = keys[j - 1], b = keys[j + 1], d = b[0] - a[0];
    return [(b[1] - a[1]) / d, (b[2] - a[2]) / d];
  };
  const a = keys[i], b = keys[i + 1], D = b[0] - a[0], t = (u - a[0]) / D, t2 = t * t, t3 = t2 * t;
  const va = vel(i), vb = vel(i + 1);
  const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
  return [h00 * a[1] + h10 * D * va[0] + h01 * b[1] + h11 * D * vb[0], h00 * a[2] + h10 * D * va[1] + h01 * b[2] + h11 * D * vb[1]];
}
// 指针在画面内的程度：a 秒进入后按时间常数 tau 趋近 1，b 秒离开后按 tau 衰减到 0（原作每帧按 0.004^dt 追赶）
const BN_near = (u, a, b, tau = 0.18) => {
  if (u < a) return 0;
  const inn = 1 - Math.exp(-(Math.min(u, b) - a) / tau);
  return u < b ? inn : inn * Math.exp(-(u - b) / tau);
};
// 两个整数参数的确定性哈希（格子下标 × 换牌序号）
const BN_hash2 = (i, n) => hash(i * 0.7311 + n * 101.37);

// @shared
// 全息卡共用底层（holo-card-3d，deepslit，MIT）：按原作 scripts/render_card.py、scripts/build_html_card.py 的公式在 Canvas 2D 中逐像素重写。
// 卡片 3:4、圆角 0.045·宽、厚 0.036·宽，相机距离 3.8·宽；自动摆动 yaw = 24°·sin a、pitch = 11.5°·sin 2a、roll = 1.6°·sin a、上下浮动 1.3% 卡高（a = 2πu/6.4），整圈即循环。
// 每个像素从相机反投影一条射线，按原作层深由后到前取：底层底纹（z = −0.082W）→ 流麻丝带与亮片（−0.058W / −0.036W）→ 徽章（−0.03W）→ 卡面倒角金属边框、顶层箔光与扫光（0）；
// 卡面没打中、背面（z = −厚度）打中的像素画成卡边。原作的角色立绘浮雕和 PNG 边框依赖图片素材，这里换成程序生成的多面徽章与倒角边框。
const HC_W = 126, HC_H = 168, HC_R = 0.045 * HC_W, HC_D = 3.8 * HC_W, HC_T = 0.036 * HC_W, HC_BW = 0.06 * HC_W;
const HC_CX = CW / 2, HC_CY = CH / 2 - 2, HC_ASP = HC_H / HC_W, HC_DEG = Math.PI / 180;
const HC_AC = [0.5, 0.44];                                     // 底纹中心（原作 astrolabe_center），也是徽章中心
const HC_EZ = -0.03 * HC_W, HC_ER = 0.26 * HC_W;               // 徽章所在层深与外接半径
const HC_fr = x => x - Math.floor(x);
const HC_ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// 原作 hash12 / hash32（GLSL 版本逐行照搬）；hash32 写进 HC_h3，避免每像素新建数组
function HC_hash12(x, y) {
  let a = HC_fr(x * 0.1031), b = HC_fr(y * 0.1031), c = HC_fr(x * 0.1031);
  const d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33);
  a += d; b += d; c += d;
  return HC_fr((a + b) * c);
}
const HC_h3 = [0, 0, 0];
function HC_hash32(x, y) {
  let a = HC_fr(x * 0.1031), b = HC_fr(y * 0.1030), c = HC_fr(x * 0.0973);
  const d = a * (b + 33.33) + b * (a + 33.33) + c * (c + 33.33);
  a += d; b += d; c += d;
  HC_h3[0] = HC_fr((a + b) * c); HC_h3[1] = HC_fr((a + c) * b); HC_h3[2] = HC_fr((b + c) * a);
}
// 原作 spectral：0.5 + 0.5·cos(2π·phase + (0, 2.0944, 4.1888))，乘 m 后累加进 o
function HC_spa(o, ph, m) {
  const p = ph * TAU;
  o[0] += m * (0.5 + 0.5 * Math.cos(p)); o[1] += m * (0.5 + 0.5 * Math.cos(p + 2.0944)); o[2] += m * (0.5 + 0.5 * Math.cos(p + 4.1888));
}
// 摆动姿态、旋转矩阵 R（Ry·Rx·Rz，行优先）、光线与半程向量（原作 build_html_card.py 的 lightDir / halfCam）
function HC_pose(u) {
  const a = TAU * u / CYC;
  const yaw = 24 * Math.sin(a), pitch = 11.5 * Math.sin(2 * a), roll = 1.6 * Math.sin(a);
  const cy = Math.cos(yaw * HC_DEG), sy = Math.sin(yaw * HC_DEG), cp = Math.cos(pitch * HC_DEG), sp = Math.sin(pitch * HC_DEG);
  const cr = Math.cos(roll * HC_DEG), sr = Math.sin(roll * HC_DEG);
  // Ry·Rx
  const m = [cy, sy * sp, sy * cp, 0, cp, -sp, -sy, cy * sp, cy * cp];
  // ·Rz
  const R = [
    m[0] * cr + m[1] * sr, -m[0] * sr + m[1] * cr, m[2],
    m[3] * cr + m[4] * sr, -m[3] * sr + m[4] * cr, m[5],
    m[6] * cr + m[7] * sr, -m[6] * sr + m[7] * cr, m[8],
  ];
  let lx = 0.36 * Math.cos(a) - 0.25 * Math.sin(a) + 0.28 * Math.sin(yaw * HC_DEG);
  let ly = -0.42 + 0.14 * Math.sin(2 * a) - 0.20 * Math.sin(pitch * HC_DEG), lz = 0.84;
  let n = Math.hypot(lx, ly, lz); lx /= n; ly /= n; lz /= n;
  let hx = lx, hy = ly, hz = lz + 1; n = Math.hypot(hx, hy, hz); hx /= n; hy /= n; hz /= n;
  // 光线在卡片局部坐标里的方向（RT·L），用于徽章投影
  const llx = R[0] * lx + R[3] * ly + R[6] * lz, lly = R[1] * lx + R[4] * ly + R[7] * lz;
  return { a, yaw, pitch, R, L: [lx, ly, lz], Hv: [hx, hy, hz], Ll: [llx, lly], hover: -0.013 * HC_H * Math.sin(a), tilt: 0.016 * yaw + 0.012 * pitch };
}
// 局部点 → 屏幕（相对卡心）
function HC_proj(P, x, y, z) {
  const R = P.R, wx = R[0] * x + R[1] * y + R[2] * z, wy = R[3] * x + R[4] * y + R[5] * z, wz = R[6] * x + R[7] * y + R[8] * z;
  const s = HC_D / (HC_D - wz);
  return [wx * s, wy * s];
}
// 局部法线 (x, y, z) 与世界向量 v 的点积（法线先经 R 转到世界）
function HC_ndot(R, x, y, z, v) {
  return (R[0] * x + R[1] * y + R[2] * z) * v[0] + (R[3] * x + R[4] * y + R[5] * z) * v[1] + (R[6] * x + R[7] * y + R[8] * z) * v[2];
}
// 圆角矩形 SDF（局部单位≈像素）与外法线方向
const HC_g = [0, 0];
function HC_box(x, y) {
  const qx = Math.abs(x) - HC_W / 2 + HC_R, qy = Math.abs(y) - HC_H / 2 + HC_R;
  if (qx > 0 && qy > 0) { const l = Math.hypot(qx, qy); HC_g[0] = Math.sign(x) * qx / l; HC_g[1] = Math.sign(y) * qy / l; return l - HC_R; }
  if (qx > qy) { HC_g[0] = Math.sign(x); HC_g[1] = 0; } else { HC_g[0] = 0; HC_g[1] = Math.sign(y); }
  return Math.max(qx, qy) - HC_R;
}
// 原作 evalHoloPattern 五种底纹（starburst 0 / prism_grid 1 / cosmos_waves 2 / cracked_ice 3 / diamond_lattice 5）。
// 小格里原作 110×145 的微纹会混叠，频率按卡宽比例降到 36×48；碎冰裂纹宽 0.036 放宽到 0.07 格
function HC_pat(id, u, v, P, o, g) {
  if (id === 3) { HC_ice(u, v, P, o, g); return; }
  const yaw = P.yaw, tilt = P.tilt;
  if (id === 1) {
    const gx = u * 9, gy = v * 12, tx = Math.floor(gx), ty = Math.floor(gy), fx = gx - tx, fy = gy - ty;
    const tm = HC_ss(0, 0.08, fx) * HC_ss(0, 0.08, 1 - fx) * HC_ss(0, 0.08, fy) * HC_ss(0, 0.08, 1 - fy);
    const cph = HC_hash12(tx + 7.13, ty + 7.13);
    const sh = Math.pow(0.5 + 0.5 * Math.cos(cph * 6.283 + yaw * 0.20 + P.pitch * 0.15), 2.2);
    HC_spa(o, cph * 1.9 + tilt * 1.8, g * tm * (0.12 + 0.95 * sh));
    const gl = (1 - tm) * 0.25 * g; o[0] += 0.95 * gl; o[1] += 0.98 * gl; o[2] += gl;
    return;
  }
  if (id === 5) {
    const d1 = Math.abs(Math.sin((u * 11 + v * 14.5) * Math.PI)), d2 = Math.abs(Math.sin((u * 11 - v * 14.5) * Math.PI));
    const ridge = Math.max(1 - HC_ss(0, 0.24, d1), 1 - HC_ss(0, 0.24, d2));
    const sw = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.cos((u * 5 - v * 6.5) * Math.PI + yaw * 0.18), 1.6);
    HC_spa(o, u * 1.35 + v * 1.10 + tilt * 1.7, g * ridge * sw * 1.05);
    return;
  }
  const dx = u - HC_AC[0], dy = (v - HC_AC[1]) * HC_ASP, ang = Math.atan2(dy, dx), rad = Math.hypot(dx, dy);
  if (id === 2) {
    const wave = Math.pow(0.5 + 0.5 * Math.sin(rad * 32 - ang * 4 + yaw * 0.18), 2.3);
    HC_spa(o, rad * 2.1 - tilt * 1.5 + 0.18 * wave, g * (0.10 + 0.95 * wave));
    return;
  }
  const rays = Math.pow(0.5 + 0.5 * Math.cos(ang * 24 + yaw * 0.14), 2.4);
  const micro = 0.76 + 0.24 * Math.sin((u * 36 + v * 48) * Math.PI + yaw * 0.14);
  HC_spa(o, ang / TAU + rad * 1.35 + tilt * 1.6, g * (0.10 + 0.95 * rays * micro));
}
// 原作 evalCrackedIce：10×13 格 Voronoi 晶面，每块一个随机法线，按与半程向量的夹角闪光，裂纹发白
// 每块碎冰的特征点、法线、色相只与格子有关，先按原作哈希算成表（格 −1…10 × −1…13）
const HC_ICE = (() => {
  const t = [];
  for (let ny = -1; ny <= 13; ny++) for (let nx = -1; nx <= 10; nx++) {
    HC_hash32(nx + 31.7, ny + 31.7); const px = nx + 0.14 + 0.72 * HC_h3[0], py = ny + 0.14 + 0.72 * HC_h3[1];
    HC_hash32(nx * 2.13 + 19.4, ny * 2.13 + 19.4);
    let ax = (HC_h3[0] * 2 - 1) * 0.72, ay = (HC_h3[1] * 2 - 1) * 0.72, az = Math.sqrt(Math.max(0.12, 1 - ax * ax - ay * ay)); const l = Math.hypot(ax, ay, az);
    t.push([px, py, ax / l, ay / l, az / l, HC_h3[2]]);
  }
  return t;
})();
function HC_ice(u, v, P, o, g) {
  const gx = u * 10, gy = v * 13, cx = Math.floor(gx), cy = Math.floor(gy);
  let d1 = 8, d2 = 8, b = null;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const nx = cx + i, ny = cy + j;
    if (nx < -1 || nx > 10 || ny < -1 || ny > 13) continue;
    const e = HC_ICE[(ny + 1) * 12 + nx + 1], ex = gx - e[0], ey = gy - e[1], d = Math.sqrt(ex * ex + ey * ey);
    if (d < d1) { d2 = d1; d1 = d; b = e; } else if (d < d2) d2 = d;
  }
  const R = P.R, H = P.Hv;
  const ndh = clamp(Math.abs((R[0] * b[2] + R[1] * b[3] + R[2] * b[4]) * H[0] + (R[3] * b[2] + R[4] * b[3] + R[5] * b[4]) * H[1] + (R[6] * b[2] + R[7] * b[3] + R[8] * b[4]) * H[2]));
  const spec = Math.pow(ndh, 7.5), flash = HC_ss(0.32, 0.88, spec);
  const edge = Math.exp(-Math.pow((d2 - d1) / 0.07, 2)) * (0.28 + 0.85 * spec);
  HC_spa(o, b[5] * 2.4 + P.tilt * 1.9 + 0.45 * ndh, g * (0.08 + 0.92 * flash));
  const wv = g * (edge * 0.58 + Math.pow(ndh, 24) * 0.55); o[0] += 0.98 * wv; o[1] += 0.99 * wv; o[2] += wv;
}
// 原作流麻层：两条随重力（yaw / pitch）流动的丝带
function HC_silk(u1, v1, u2, v2, P, S, o) {
  const a = P.a, gx = 0.025 * Math.sin(P.yaw * HC_DEG), gy = 0.020 * Math.sin(P.pitch * HC_DEG);
  const f1 = Math.sin((u1 + gx) * 18 + v1 * 9 + a) * Math.cos((v1 + gy) * 14 - u1 * 7 - a);
  const s1 = Math.pow(clamp(0.5 + 0.5 * f1), 3.2) * 0.24;
  const f2 = Math.sin((u2 - gx * 1.3) * 24 - v2 * 13 - 2 * a) * Math.cos((v2 + gy * 1.2) * 19 + u2 * 11 + a);
  const s2 = Math.pow(clamp(0.5 + 0.5 * f2), 3.6) * 0.22;
  for (let c = 0; c < 3; c++) o[c] += (s1 * S.sand[0][c] + s2 * S.sand[1][c]) * S.sandG;
}
// 每片亮片的随机量（位置、转速、大小、法线）同样先算成 15 × 19 的表
const HC_SEQ = (() => {
  const t = [];
  for (let ny = 0; ny < 19; ny++) for (let nx = 0; nx < 15; nx++) {
    HC_hash32(nx + 17.3, ny + 17.3); const r = [HC_h3[0], HC_h3[1], HC_h3[2]], rad = 0.09 + 0.07 * HC_hash12(nx + 9.1, ny + 9.1);
    HC_hash32(nx * 3.17 + 41, ny * 3.17 + 41);
    let ax = HC_h3[0] * 2 - 1, ay = HC_h3[1] * 2 - 1, az = Math.abs(HC_h3[2] * 2 - 1) + 0.35; const l = Math.hypot(ax, ay, az);
    t.push([r[0], r[1], r[2], rad, ax / l, ay / l, az / l]);
  }
  return t;
})();
// 亮片的中心、亮度、颜色只与帧有关：每帧先算一遍（P.sq），逐像素只剩距离和高斯衰减
function HC_seqFrame(P, S) {
  const gx = 0.024 * Math.sin(P.yaw * HC_DEG), gy = 0.019 * Math.sin(P.pitch * HC_DEG), GX = 15, GY = 19, f = new Float32Array(GX * GY * 7);
  for (let n = 0; n < GX * GY; n++) {
    const q = HC_SEQ[n], r0 = q[0], r1 = q[1], r2 = q[2], nx = n % GX, ny = (n - nx) / GX, o = n * 7;
    if (r0 < 0.08) { f[o + 3] = 0; continue; }
    const sp = r1 > 0.65 ? 2 : 1, ph = r2 * TAU, zs = (r0 - 0.5) * 0.35;
    f[o] = nx + 0.24 + 0.52 * r1 + gx * zs * GX + 0.14 * Math.sin(P.a * sp + ph);
    f[o + 1] = ny + 0.24 + 0.52 * r2 + gy * zs * GY + 0.14 * Math.cos(P.a * sp + ph);
    f[o + 2] = q[3];
    const spec = Math.pow(clamp(Math.abs(HC_ndot(P.R, q[4], q[5], q[6], P.Hv))), 34);
    const diff = 0.22 + 0.78 * clamp(Math.abs(HC_ndot(P.R, q[4], q[5], q[6], P.L)));
    const br = (diff * 0.36 + spec * 1.75) * 1.15 * 0.85 * S.seqG, col = S.seqC[r1 < 0.35 ? 0 : r1 < 0.68 ? 1 : r1 < 0.85 ? 2 : 3];
    f[o + 3] = 1; f[o + 4] = col[0] * br; f[o + 5] = col[1] * br; f[o + 6] = col[2] * br;
  }
  P.sq = f; P.sg = [gx, gy];
}
// 原作 evalQuicksandSequins：15×19 格亮片，随重力整体滑动、各自绕小圈，按随机法线闪光
function HC_seq(u, v, P, S, o) {
  const f = P.sq, GX = 15, GY = 19;
  const qx = (u + P.sg[0]) * GX, qy = (v + P.sg[1]) * GY, bx = Math.floor(qx - 0.5), by = Math.floor(qy - 0.5);
  for (let j = 0; j <= 1; j++) for (let i = 0; i <= 1; i++) {
    const nx = bx + i, ny = by + j;
    if (nx < 0 || nx >= GX || ny < 0 || ny >= GY) continue;
    const k = (ny * GX + nx) * 7;
    if (!f[k + 3]) continue;
    const ddx = f[k] - qx, ddy = f[k + 1] - qy, d2 = ddx * ddx + ddy * ddy, rad = f[k + 2];
    if (d2 > rad * rad * 8) continue;
    const spot = Math.exp(-d2 / (2 * rad * rad));
    o[0] += f[k + 4] * spot; o[1] += f[k + 5] * spot; o[2] += f[k + 6] * spot;
  }
}
// 徽章 SDF：iq 的 n 角星（m = 2 为正多边形），orb 为圆
function HC_star(x, y, r, n, m) {
  const an = Math.PI / n, en = Math.PI / m, acx = Math.cos(an), acy = Math.sin(an), ecx = Math.cos(en), ecy = Math.sin(en);
  const at = Math.atan2(x, y), bn = ((at % (2 * an)) + 2 * an) % (2 * an) - an, l = Math.hypot(x, y);
  let px = l * Math.cos(bn) - r * acx, py = l * Math.abs(Math.sin(bn)) - r * acy;
  const t = clamp(-(px * ecx + py * ecy), 0, r * acy / ecy);
  px += ecx * t; py += ecy * t;
  return Math.hypot(px, py) * Math.sign(px);
}
function HC_esdf(S, x, y) {
  const e = S.em;
  if (e === 'orb') return Math.hypot(x, y) - HC_ER * 0.78;
  if (e === 'crystal') return HC_star(x, y / 1.35, HC_ER * 0.8, 4, 2) * 1.1;
  if (e === 'hex') return HC_star(x, y, HC_ER * 0.9, 6, 2);
  if (e === 'star8') return HC_star(x, y, HC_ER, 8, 5.2);
  if (e === 'star4') return HC_star(x, y, HC_ER, 4, 3.3);
  return HC_star(x, y, HC_ER, 5, 3.4);
}
// 徽章着色：SDF 梯度当作斜面法线（多角星每个尖角两面，正多边形每边一面），金属色 + 高光 + 少量随面朝向变化的虹彩
function HC_emblem(S, P, x, y, o, res) {
  if (x * x + y * y > HC_ER * HC_ER * (S.em === 'orb' ? 1.5 : 1.25)) return;
  const sd = HC_esdf(S, x, y);
  if (sd > 1.5) return;
  let nx, ny, nz;
  if (S.em === 'orb') {
    const r0 = HC_ER * 0.78, rx = x / r0, ry = y / r0; nx = rx * 0.85; ny = ry * 0.85; nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
  } else {
    const e = 0.6, gx = HC_esdf(S, x + e, y) - sd, gy = HC_esdf(S, x, y + e) - sd, gl = Math.hypot(gx, gy) || 1;
    nx = 0.95 * gx / gl; ny = 0.95 * gy / gl; nz = 1;
  }
  const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
  const diff = 0.3 + 0.7 * Math.max(0, HC_ndot(P.R, nx, ny, nz, P.L)), spec = Math.pow(Math.max(0, HC_ndot(P.R, nx, ny, nz, P.Hv)), 36);
  const t = S.emT, rim = sd > -1.4 ? 0.55 : 1;
  const c = [t[0] * (0.25 + 0.75 * diff) * rim + spec * 1.1, t[1] * (0.25 + 0.75 * diff) * rim + spec * 1.1, t[2] * (0.25 + 0.75 * diff) * rim + spec * 1.1];
  HC_spa(c, Math.atan2(ny, nx) / TAU + P.tilt * 1.4, 0.16);
  if (S.em === 'orb') {                                            // 星球加一圈斜环
    const rr0 = Math.abs(Math.hypot(x, (y + x * 0.35) * 3.2) - HC_ER * 1.05);
    if (rr0 < 2.2 && !(sd < 0 && y + x * 0.35 < 0)) { const k = 1 - rr0 / 2.2; for (let i = 0; i < 3; i++) c[i] = c[i] * (1 - k) + (t[i] * 0.9 + spec * 0.4) * k; }
  }
  const a = clamp(0.5 - sd * res);
  for (let i = 0; i < 3; i++) o[i] = o[i] * (1 - a) + c[i] * a;
}
// 逐像素渲染卡片到离屏画布；同一 u、同一分辨率只算一次
function HC_render(S, P, u, res) {
  const ow = Math.ceil(CW * res), oh = Math.ceil(CH * res);
  if (!S.c || S.c.width !== ow || S.c.height !== oh) { S.c = document.createElement('canvas'); S.c.width = ow; S.c.height = oh; S.img = S.c.getContext('2d').createImageData(ow, oh); S.u = null; }
  if (S.u === u && S.res === res) return;
  S.u = u; S.res = res;
  const sx0 = HC_CX, sy0 = HC_CY + P.hover;
  // 包围盒：正面与背面 8 个角的投影
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const z of [0, -HC_T]) for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const [px, py] = HC_proj(P, sx * HC_W / 2, sy * HC_H / 2, z);
    x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
  }
  const bx0 = Math.max(0, Math.floor((sx0 + x0 - 2) * res)), by0 = Math.max(0, Math.floor((sy0 + y0 - 2) * res));
  const bx1 = Math.min(ow, Math.ceil((sx0 + x1 + 2) * res)), by1 = Math.min(oh, Math.ceil((sy0 + y1 + 2) * res));
  S.bb = [bx0, by0, bx1 - bx0, by1 - by0];
  const R = P.R, d = S.img.data;
  if (S.sandG > 0) HC_seqFrame(P, S);
  // 相机原点在局部坐标：RT·(0, 0, D)
  const ox = R[6] * HC_D, oy = R[7] * HC_D, oz = R[8] * HC_D;
  const o = [0, 0, 0], ob = [0, 0, 0];
  const comp = z => HC_D / (HC_D - z);
  const cB = comp(-0.082 * HC_W), c1 = comp(-0.058 * HC_W), c2 = comp(-0.036 * HC_W), cE = comp(HC_EZ);
  const fn = [R[2], R[5], R[8]];                                   // 卡面法线（世界）
  const faceSpec = Math.pow(Math.max(0, fn[0] * P.Hv[0] + fn[1] * P.Hv[1] + fn[2] * P.Hv[2]), 50);
  const sweep = 0.70 + P.yaw / 24 * 0.6;
  const rim = S.rim, base0 = S.base[0], base1 = S.base[1];
  for (let iy = by0; iy < by1; iy++) for (let ix = bx0; ix < bx1; ix++) {
    const sx = (ix + 0.5) / res - sx0, sy = (iy + 0.5) / res - sy0, sz = -HC_D;
    const dx = R[0] * sx + R[3] * sy + R[6] * sz, dy = R[1] * sx + R[4] * sy + R[7] * sz, dz = R[2] * sx + R[5] * sy + R[8] * sz;
    const at = z => (z - oz) / dz;
    // 正面
    const t0 = at(0), px = ox + t0 * dx, py = oy + t0 * dy;
    const sd0 = HC_box(px, py), gX = HC_g[0], gY = HC_g[1];
    const af = clamp(0.5 - sd0 * res);
    let ab = 0;
    if (af < 1) {                                                  // 卡边：背面轮廓内、正面轮廓外
      const tb = at(-HC_T), sdb = HC_box(ox + tb * dx, oy + tb * dy);
      ab = clamp(0.5 - sdb * res);
      if (ab > 0) {
        const sh = 0.35 + 0.65 * Math.abs(HC_ndot(R, HC_g[0], HC_g[1], 0, P.L)), sp = Math.pow(Math.abs(HC_ndot(R, HC_g[0], HC_g[1], 0, P.Hv)), 12) * 0.5;
        for (let c = 0; c < 3; c++) ob[c] = rim[c] * 0.42 * sh + sp;
      }
    }
    const off = (iy * ow + ix) * 4;
    if (af <= 0 && ab <= 0) { d[off + 3] = 0; continue; }
    if (af > 0) {
      const u0 = 0.5 + px / HC_W, v0 = 0.5 + py / HC_H;
      o[0] = o[1] = o[2] = 0;
      if (sd0 < -HC_BW + 0.5) {
        // 底层：底色渐变 + 底纹（原作 1.07× 过扫描）
        const tB = at(-0.082 * HC_W);
        let ub = 0.5 + (ox + tB * dx) * cB / HC_W, vb = 0.5 + (oy + tB * dy) * cB / HC_H;
        ub = clamp(0.5 + (ub - 0.5) / 1.07); vb = clamp(0.5 + (vb - 0.5) / 1.07);
        const rd = Math.hypot(ub - HC_AC[0], (vb - HC_AC[1]) * HC_ASP), lift = Math.max(0, 1 - rd * 1.6) * 0.35;
        for (let c = 0; c < 3; c++) o[c] = base0[c] + (base1[c] - base0[c]) * vb + lift * S.glowC[c];
        HC_pat(S.pat, ub, vb, P, o, 0.52 * S.bgG);
        // 徽章投影
        const qx = (ub - HC_AC[0]) * HC_W + P.Ll[0] * 5.5, qy = (vb - HC_AC[1]) * HC_H + P.Ll[1] * 5.5;
        if (qx * qx + qy * qy < HC_ER * HC_ER * 1.6) {
          const shd = clamp(0.5 - HC_esdf(S, qx, qy) / 5);
          for (let c = 0; c < 3; c++) o[c] *= 1 - 0.5 * shd;
        }
        if (S.sandG > 0) {
          const t1 = at(-0.058 * HC_W), t2 = at(-0.036 * HC_W);
          const u1 = 0.5 + (ox + t1 * dx) * c1 / HC_W, v1 = 0.5 + (oy + t1 * dy) * c1 / HC_H;
          HC_silk(u1, v1, 0.5 + (ox + t2 * dx) * c2 / HC_W, 0.5 + (oy + t2 * dy) * c2 / HC_H, P, S, o);
          HC_seq(u1, v1, P, S, o);
        }
        // 徽章层
        const tE = at(HC_EZ);
        HC_emblem(S, P, (ox + tE * dx) * cE + (0.5 - HC_AC[0]) * HC_W, (oy + tE * dy) * cE + (0.5 - HC_AC[1]) * HC_H, o, res);
        // 顶层箔光
        HC_pat(S.pat, u0, v0, P, o, S.topG);
        // 底部名牌：暗玻璃条 + 三颗虹彩小钻
        if (v0 > 0.855 && v0 < 0.915 && u0 > 0.2 && u0 < 0.8) {
          const edge = Math.min(v0 - 0.855, 0.915 - v0, (u0 - 0.2) * HC_W / HC_H, (0.8 - u0) * HC_W / HC_H) * HC_H;
          for (let c = 0; c < 3; c++) o[c] = o[c] * 0.3 + rim[c] * (edge < 1 ? 0.6 : 0.06);
          for (let j = -1; j <= 1; j++) {
            const gd = Math.hypot((u0 - 0.5 - j * 0.07) * HC_W, (v0 - 0.885) * HC_H);
            if (gd < 2.6) { const k = clamp(2.6 - gd); HC_spa(o, j * 0.3 + P.tilt * 2, 0.9 * k); }
          }
        }
        // 边框内沿的阴影
        const inner = clamp((sd0 + HC_BW + 2.5) / 2.5);
        for (let c = 0; c < 3; c++) o[c] *= 1 - 0.45 * inner;
      }
      if (sd0 > -HC_BW - 0.5) {
        // 倒角金属边框：外斜面、平面、中间一道细槽、内斜面
        const t = clamp(-sd0 / HC_BW), sl = t < 0.3 ? 1.4 : t > 0.72 ? -1.1 : 0;
        let nx = gX * sl * 0.7, ny = gY * sl * 0.7, nz = 1; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
        const diff = Math.max(0, HC_ndot(R, nx, ny, nz, P.L)), sp = Math.pow(Math.max(0, HC_ndot(R, nx, ny, nz, P.Hv)), 28);
        const groove = Math.abs(t - 0.5) < 0.06 ? 0.55 : 1;
        const f = [0, 0, 0];
        for (let c = 0; c < 3; c++) f[c] = (rim[c] * (0.22 + 0.78 * diff) + sp * 1.2) * groove;
        HC_spa(f, u0 * 1.5 + v0 + P.tilt * 1.8, 0.12);
        const fa = clamp((sd0 + HC_BW + 0.5) * res);
        for (let c = 0; c < 3; c++) o[c] = o[c] * (1 - fa) + f[c] * fa;
      }
      // 扫光与卡面高光
      const gl = Math.exp(-Math.pow((u0 * 0.85 + v0 * 0.55 - sweep) / 0.09, 2)) * 0.2 + faceSpec * 0.12;
      for (let c = 0; c < 3; c++) o[c] += gl;
    }
    const A = af + (1 - af) * ab;
    for (let c = 0; c < 3; c++) {
      let v = (o[c] * af + ob[c] * (1 - af) * ab) / (A || 1);
      if (v > 0.85) v = 0.85 + 0.15 * (1 - Math.exp(-(v - 0.85) / 0.15));   // 原作高光 0.85 以上压缩
      d[off + c] = Math.max(0, v) * 255;
    }
    d[off + 3] = A * 255;
  }
  S.c.getContext('2d').putImageData(S.img, 0, 0, S.bb[0], S.bb[1], S.bb[2], S.bb[3]);
}
// 四角十字星（原作 4-Point Cross-Star Glints）：边框两角与徽章顶点，按整数倍频率闪烁
function HC_glints(k, S, P) {
  const pts = [[-HC_W / 2 + HC_BW * 0.5, -HC_H / 2 + HC_BW * 0.5, 0, 2, 0.3], [HC_W / 2 - HC_BW * 0.5, HC_H / 2 - HC_BW * 0.5, 0, 2, 3.4], [0, (HC_AC[1] - 0.5) * HC_H - HC_ER * 0.95, HC_EZ, 3, 1.7]];
  k.save(); k.globalCompositeOperation = 'lighter'; k.lineCap = 'round';
  for (const [x, y, z, f, ph] of pts) {
    const I = Math.pow(0.5 + 0.5 * Math.sin(P.a * f + ph), 6);
    if (I < 0.02) continue;
    const [px, py] = HC_proj(P, x, y, z), X = HC_CX + px, Y = HC_CY + P.hover + py, L = 3 + 9 * I;
    glow(k, X, Y, 8 * I + 2, '255,255,255', 0.5 * I);
    k.strokeStyle = `rgba(255,255,255,${(0.85 * I).toFixed(3)})`; k.lineWidth = 1;
    k.beginPath(); k.moveTo(X - L, Y); k.lineTo(X + L, Y); k.moveTo(X, Y - L * 0.8); k.lineTo(X, Y + L * 0.8); k.stroke();
  }
  k.restore();
}
// 一款全息卡：深色台面 + 款式色光晕 + 地面投影 + 卡片位图 + 十字星
function HC_cell(S) {
  S.glowC = S.glow.split(',').map(x => +x / 255);
  return (k, w, h, u) => {
    const P = HC_pose(u), T = k.getTransform(), dev = Math.hypot(T.a, T.b);
    const res = Math.min(1.5, Math.max(1, Math.round(dev * 4) / 4));
    const bg = k.createLinearGradient(0, 0, 0, CH); bg.addColorStop(0, '#0d0d16'); bg.addColorStop(1, '#050509');
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    glow(k, HC_CX, HC_CY, 200, S.glow, 0.20);
    const sh = k.createRadialGradient(0, 0, 0, 0, 0, 1);
    sh.addColorStop(0, 'rgba(0,0,0,0.55)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    k.save(); k.translate(HC_CX + P.yaw * 0.5, HC_CY + HC_H / 2 + 8); k.scale(64, 6.5); k.fillStyle = sh; k.beginPath(); k.arc(0, 0, 1, 0, TAU); k.fill(); k.restore();
    HC_render(S, P, u, res);
    const b = S.bb;
    if (b[2] > 0 && b[3] > 0) k.drawImage(S.c, b[0], b[1], b[2], b[3], b[0] / res, b[1] / res, b[2] / res, b[3] / res);
    HC_glints(k, S, P);
  };
}
const HC_GOLD = [1.0, 0.80, 0.46], HC_SILV = [0.84, 0.88, 0.95];
const HC_hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16) / 255);
