/* Motion Prompt · pack "mgstyles" · MIT License (c) 2026 Vincentwei1021 · https://github.com/Vincentwei1021/mg-styles-15 */
MotionPrompt.pack('mgstyles', function () {
  // @kit
  // MG 风格（每格 539x208、6.4 秒周期；每格都是只依赖时间 u 的纯函数）
  // 按 mg-styles-15（Vincentwei1021，MIT）15 支短片各自的配色、构图、节奏与标志手法，在 Canvas 2D 中重画为卡片循环动画；
  // 不使用原作的照片、贴纸、纹理、HDRI、字形轮廓与音频。多数元素 0–5.4 秒展示、5.4–6.4 秒复位；周期运动按整数圈设计；随机按下标确定性生成。
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
  // 弹性缓动（扁平矢量、花字的弹出）：t 0→1，末端带衰减振荡
  const elasticOut = t => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1);
  // 逐帧取整时间（手绘线条沸腾 12fps、像素风 8fps 等）：把 u 落到 1/fps 的格子上，画面按帧跳动
  const stepT = (u, fps) => Math.floor(u * fps + 1e-6) / fps;
  const CELLS = [];
  // @element 01
  // 01 扁平矢量（popwise「One Dot」）：群青天空 #2B2BFF + 奶油地面 #FFF6E9，唯一主角珊瑚圆点 #FF5A4E 0.2 秒从顶部落下，0.4–4.4 秒连跳 5 下（每跳 0.8 秒：落地 0.16 秒挤压 18%、空中拉伸 10%、3 个残影模拟运动模糊），每次落地错峰 0.1 秒用 elasticOut 弹出两栋扁平楼；4.6 秒 popwise 字标与 EVERY DAY, A LITTLE WISER 弹性入场；5.4–6.0 秒楼、字、圆点缩回
  const FLAT_C = { U: '#2B2BFF', UD: '#1F1FCC', UL: '#4D4DFF', CO: '#FF5A4E', COD: '#E0433A', SU: '#FFC62B', SUD: '#F0A91A', MI: '#2EE6A8', MID: '#1FC28C', CR: '#FFF6E9', CRD: '#F1E3CC', INK: '#151433' };
  const FLAT_GY = 168;                                  // 地平线 y
  const FLAT_HOPX = [44, 132, 220, 308, 396, 484];      // 6 个落点（第 0 次为入场落地）
  // 楼：每个落点身后两栋，弹出时刻 = 该落点着地时刻 + 0 / 0.1 秒
  const FLAT_BLD = (() => {
    const cols = [[FLAT_C.SU, FLAT_C.SUD], [FLAT_C.MI, FLAT_C.MID], [FLAT_C.CR, FLAT_C.CRD], [FLAT_C.CO, FLAT_C.COD], [FLAT_C.UL, FLAT_C.UD]];
    const out = [];
    FLAT_HOPX.forEach((x, i) => {
      for (let j = 0; j < 2; j++) {
        const n = i * 2 + j;
        out.push({ x: x - 40 + j * 38 + hash(n * 3) * 6, w: 30 + hash(n * 5) * 12, h: 34 + hash(n * 7) * 36, c: cols[(n * 2 + i) % 5], roof: n % 3, t: 0.4 + 0.8 * i + 0.1 * j });
      }
    });
    return out;
  })();
  function FLAT_dot(t) {
    const R = 16, G = FLAT_GY - R;
    if (t < 0.4) { const p = seg(t, 0.2, 0.4); return { x: FLAT_HOPX[0], y: mix(-30, G, p * p), sx: 0.9, sy: 1.12, air: p > 0 && p < 1 }; }
    const i = Math.min(5, Math.floor((t - 0.4) / 0.8)), dt = t - (0.4 + 0.8 * i);
    if (i >= 5 || dt < 0.12) {                          // 着地：先挤压后回弹（预备）
      const q = dt < 0.16 ? Math.sin(Math.PI * dt / 0.16) * 0.18 : 0;
      const sy = 1 - q;
      return { x: FLAT_HOPX[i], y: G + R * (1 - sy), sx: 1 + q, sy, air: false };
    }
    const p = (dt - 0.12) / 0.68;                       // 空中：抛物线，速度越快拉伸越大
    const st = 1 + 0.1 * Math.abs(1 - 2 * p);
    return { x: mix(FLAT_HOPX[i], FLAT_HOPX[i + 1], p), y: G - 72 * 4 * p * (1 - p), sx: 1 / st, sy: st, air: true };
  }
  CELLS[0] = (k, w, h, u) => {
    const C = FLAT_C, rk = resetK(u), keep = 1 - rk;
    k.fillStyle = C.U; k.fillRect(0, 0, CW, CH);
    // 两朵扁平云：整周期 1 次往返漂移
    for (let i = 0; i < 2; i++) {
      const cx = 150 + i * 230 + 10 * Math.sin(TAU * u / CYC + i * 2), cy = 26 + i * 14;
      k.fillStyle = C.UL; rr(k, cx - 34, cy - 7, 68, 14, 7); k.fill();
      k.beginPath(); k.arc(cx - 6, cy - 7, 11, 0, TAU); k.fill();
    }
    // 楼（在地面线之上，从底边弹出）
    for (const b of FLAT_BLD) {
      const s = elasticOut(seg(u, b.t, b.t + 0.6)) * keep;
      if (s <= 0.001) continue;
      const bh = b.h * s, x0 = b.x, y0 = FLAT_GY - bh;
      k.fillStyle = b.c[0]; k.fillRect(x0, y0, b.w, bh);
      k.fillStyle = b.c[1]; k.fillRect(x0 + b.w * 0.72, y0, b.w * 0.28, bh);     // 无渐变的扁平侧面
      if (b.roof === 0) { k.beginPath(); k.moveTo(x0 - 3, y0); k.lineTo(x0 + b.w / 2, y0 - 12 * s); k.lineTo(x0 + b.w + 3, y0); k.closePath(); k.fillStyle = C.INK; k.fill(); }
      else if (b.roof === 1) { k.fillStyle = C.INK; k.fillRect(x0 - 2, y0 - 4, b.w + 4, 4); }
      k.fillStyle = b.c[0] === C.CR ? C.U : C.CR;
      for (let yy = y0 + 8; yy < FLAT_GY - 10; yy += 12) for (let xx = x0 + 5; xx < x0 + b.w * 0.7 - 5; xx += 9) k.fillRect(xx, yy, 5, 6);
    }
    k.fillStyle = C.CR; k.fillRect(0, FLAT_GY, CW, CH - FLAT_GY);
    k.fillStyle = C.CRD; k.fillRect(0, FLAT_GY + 14, CW, 3);
    // 字标 popwise + 标语（4.6 秒弹性放大入场）
    const ls = elasticOut(seg(u, 4.6, 5.2)) * keep;
    if (ls > 0.001) {
      k.save(); k.translate(28, 68); k.scale(ls, ls);
      txt(k, 'popwise', 0, 0, `800 46px ${DISP}`, C.CR);
      txt(k, 'EVERY DAY, A LITTLE WISER', 2, 18, `600 9px ${DISP}`, '#CFCFFF');
      k.restore();
    }
    // 圆点影子 + 残影 + 本体
    const d = FLAT_dot(u), R = 16 * keep;
    if (R > 0.2) {
      k.fillStyle = rgba([21, 20, 51], 0.18 * clamp(1 - (FLAT_GY - 16 - d.y) / 90));
      k.beginPath(); k.ellipse(d.x, FLAT_GY + 2, R * 1.1, 3.5, 0, 0, TAU); k.fill();
      if (d.air) for (let j = 3; j >= 1; j--) {
        const g = FLAT_dot(Math.max(0.2, u - j * 0.03));
        k.fillStyle = rgba([255, 90, 78], 0.32 - j * 0.08);
        k.beginPath(); k.ellipse(g.x, g.y, R * g.sx, R * g.sy, 0, 0, TAU); k.fill();
      }
      k.fillStyle = C.CO; k.beginPath(); k.ellipse(d.x, d.y, R * d.sx, R * d.sy, 0, 0, TAU); k.fill();
    }
  };

  // @element 02
  // 02 线条动画（ATELIER LINEA「一笔画」）：午夜蓝 #0B1320 底上一根 2.5px 圆头香槟金线 #E9D7A5，0.3–4.5 秒一笔连续画出 地平线→种子→幼苗→亭子→塔楼天际线→海平面波纹→环形字标；镜头跟随发光笔尖平移，走过的线降到 35% 亮度；4.4–5.0 秒拉远成海报构图，4.7 秒环内由线转面填金，4.9 秒 ATELIER LINEA 衬线字标淡入；5.4–6.0 秒整体淡出
  const LINE_GOLD = [233, 215, 165];
  const LINE_PATH = (() => {
    const P = [];
    const L = (x, y) => P.push([x, y]);
    const A = (cx, cy, r, a0, a1, n = 24) => { for (let i = 1; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; P.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
    L(-40, 172); L(118, 172);
    A(118, 165, 7, Math.PI / 2, Math.PI / 2 - TAU, 20);          // 种子：一个小环
    L(150, 172); L(152, 140); L(176, 126); L(166, 118); L(153, 128);   // 幼苗与第一片叶
    L(155, 100); L(130, 90); L(138, 82); L(156, 94); L(158, 72);
    A(166, 72, 8, Math.PI, Math.PI - TAU, 18);                   // 卷须
    L(185, 104); L(185, 172); L(185, 104); L(240, 70); L(295, 104); L(185, 104);   // 亭子：柱、屋顶、檐
    L(280, 104); L(280, 172); L(310, 172);
    L(310, 52); L(330, 32); L(350, 52); L(350, 172); L(370, 172); // 塔楼
    L(370, 92); L(410, 92); L(410, 172); L(430, 172);
    L(430, 62); L(448, 62); L(448, 40); L(458, 40); L(458, 62); L(476, 62); L(476, 172);
    L(600, 172);
    for (let x = 604; x <= 760; x += 4) L(x, 172 - 6 * Math.sin((x - 600) / 160 * TAU * 2));   // 海平面波纹
    L(790, 170); L(815, 162); L(840, 150);
    A(840, 108, 42, Math.PI / 2, Math.PI / 2 + TAU, 48);         // 环形字标
    L(820, 140); L(820, 110); A(840, 110, 20, Math.PI, TAU, 16); L(860, 140);   // 环内拱门
    // 累计长度
    const S = [0];
    for (let i = 1; i < P.length; i++) S.push(S[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    return { P, S, len: S[S.length - 1] };
  })();
  function LINE_at(d) {
    const { P, S } = LINE_PATH;
    let lo = 0, hi = S.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] <= d) lo = m; else hi = m; }
    const t = (d - S[lo]) / Math.max(1e-6, S[hi] - S[lo]);
    return { i: lo, x: mix(P[lo][0], P[hi][0], clamp(t)), y: mix(P[lo][1], P[hi][1], clamp(t)) };
  }
  function LINE_trace(k, d0, d1) {
    const { P } = LINE_PATH;
    if (d1 <= d0) return;
    const a = LINE_at(d0), b = LINE_at(d1);
    k.beginPath(); k.moveTo(a.x, a.y);
    for (let i = a.i + 1; i <= b.i; i++) k.lineTo(P[i][0], P[i][1]);
    k.lineTo(b.x, b.y); k.stroke();
  }
  CELLS[1] = (k, w, h, u) => {
    const f = fadeIn(u);
    k.fillStyle = '#0B1320'; k.fillRect(0, 0, CW, CH);
    glow(k, 270, 104, 300, '233,215,165', 0.04);
    const e = seg(u, 0.3, 4.5);
    const D = LINE_PATH.len * (0.6 * e + 0.4 * (3 * e * e - 2 * e * e * e));   // 转角处略减速的描绘进度
    const tip = LINE_at(D);
    const camX = clamp(tip.x - 300, -40, 361);
    const z = inOut3(seg(u, 4.4, 5.0)), sf = 0.56;
    const s = mix(1, sf, z);
    k.save();
    k.globalAlpha = f;
    k.translate(mix(-camX, 270 - 430 * sf, z), mix(0, 80 - 100 * sf, z)); k.scale(s, s);
    // 线转面：4.7–5.1 秒环内填金
    const fill = seg(u, 4.7, 5.1);
    if (fill > 0) { k.fillStyle = rgba(LINE_GOLD, 0.9 * fill); k.beginPath(); k.arc(840, 108, 42 * out3(fill), 0, TAU); k.fill(); }
    k.lineCap = 'round'; k.lineJoin = 'round'; k.lineWidth = 2.5 / s;
    k.strokeStyle = rgba(LINE_GOLD, mix(0.35, 1, z));                    // 旧线 35%，拉远后整幅回到全亮
    LINE_trace(k, 0, D);
    k.strokeStyle = '#E9D7A5';
    LINE_trace(k, Math.max(0, D - 240), D);                              // 最近 240px 全亮
    if (fill > 0) { k.strokeStyle = rgba([11, 19, 32], fill); k.lineWidth = 2.5 / s; k.beginPath(); k.moveTo(820, 140); k.lineTo(820, 110); k.arc(840, 110, 20, Math.PI, TAU); k.lineTo(860, 140); k.stroke(); }
    const ta = seg(u, 0.15, 0.3) * (1 - seg(u, 4.5, 4.8));
    if (ta > 0) { glow(k, tip.x, tip.y, 16 / s, '255,246,220', 0.8 * ta); k.fillStyle = '#FFFAEC'; k.beginPath(); k.arc(tip.x, tip.y, 2.2 / s, 0, TAU); k.fill(); }
    k.restore();
    const wa = seg(u, 4.9, 5.3) * f;
    if (wa > 0) {
      k.save(); k.globalAlpha = wa;
      k.letterSpacing = '7px'; txt(k, 'ATELIER LINEA', 273, 166, `400 17px ${SERIF}`, '#E9D7A5', 'center');
      k.letterSpacing = '4px'; txt(k, '始于一线', 272, 186, `400 10px ${SERIF}`, '#A8874E', 'center');
      k.letterSpacing = '0px'; k.restore();
    }
  };

  // @element 03
  // 03 形变动画（morphe.「一形万象」）：一个主形每 0.8 秒（150 BPM 两拍）变一次：圆→太阳→落日胶囊→纸飞机三角→地图钉→心→星→方→圆，8 形整周期回到起点；每次 0.45 秒形变都先收成中介圆再展开（A→圆→B，各约 7 帧），全程 13% 挤压拉伸 + 0.35 弧度摆转，速度曲线中段最快；同时背景色块从主形中心圆形擦除换色，右侧中文字幕同步换词
  const MORPH_C = { ink: '#16151B', cream: '#F4EEE3', mari: '#FFB627', verm: '#FF4F2B', ultra: '#2438E8' };
  const MORPH_N = 120;
  const MORPH_SH = (() => {
    const N = MORPH_N, ang = i => -Math.PI / 2 + TAU * i / N;
    const polar = fn => Array.from({ length: N }, (_, i) => fn(ang(i)));
    // 以原点为中心的闭合多边形 → 每个角度上射线与边界的交点半径（星形域，顶点一一对应，不会打结）
    const fromPoly = pts => polar(a => {
      const dx = Math.cos(a), dy = Math.sin(a); let best = 0;
      for (let j = 0; j < pts.length; j++) {
        const p = pts[j], q = pts[(j + 1) % pts.length], ex = q[0] - p[0], ey = q[1] - p[1];
        const den = dx * ey - dy * ex; if (Math.abs(den) < 1e-9) continue;
        const t = (p[0] * ey - p[1] * ex) / den, s = (p[0] * dy - p[1] * dx) / den;
        if (t > 0 && s >= 0 && s <= 1) best = Math.max(best, t);
      }
      return best;
    });
    const heart = []; for (let i = 0; i < 160; i++) { const t = TAU * i / 160; heart.push([16 * Math.pow(Math.sin(t), 3) / 17, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 - 0.12]); }
    const pin = []; for (let i = 0; i <= 60; i++) { const a = Math.PI / 2 + 0.55 + (TAU - 1.1) * i / 60; pin.push([0.72 * Math.cos(a), -0.22 + 0.72 * Math.sin(a)]); } pin.push([0, 1.1]);
    const star = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + Math.PI * i / 5, r = i % 2 ? 0.5 : 1.15; star.push([r * Math.cos(a), r * Math.sin(a)]); }
    const shapes = [
      polar(() => 1),                                                                          // 圆
      polar(a => 0.82 + 0.26 * Math.pow(0.5 + 0.5 * Math.cos(12 * (a + Math.PI / 2)), 5)),     // 太阳（12 道光芒）
      polar(a => Math.pow(Math.pow(Math.abs(Math.cos(a) / 1.25), 4) + Math.pow(Math.abs(Math.sin(a) / 0.6), 4), -0.25)),   // 落日胶囊
      fromPoly([[0.15, -1.05], [1.0, 0.75], [0.1, 0.3], [-0.9, 0.7]]),                         // 纸飞机
      fromPoly(pin),                                                                           // 地图钉
      fromPoly(heart),                                                                         // 心
      fromPoly(star),                                                                          // 星
      polar(a => 0.9 * Math.pow(Math.pow(Math.abs(Math.cos(a)), 6) + Math.pow(Math.abs(Math.sin(a)), 6), -1 / 6)),   // 方
    ];
    return shapes.map(r => { const m = Math.sqrt(r.reduce((s, v) => s + v * v, 0) / N); return r.map(v => v / m); });
  })();
  // 每一形：[背景, 主形填色, 字幕]
  const MORPH_ST = [['cream', 'verm', '早安'], ['mari', 'verm', '日出'], ['verm', 'mari', '日落'], ['ultra', 'cream', '远行'], ['cream', 'ultra', '抵达'], ['verm', 'cream', '心动'], ['ink', 'mari', '一形万象'], ['ultra', 'mari', '海风']];
  const MORPH_CX = 160, MORPH_CY = 104, MORPH_R = 62;
  const MORPH_hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
  CELLS[2] = (k, w, h, u) => {
    const C = MORPH_C, N = MORPH_N;
    const tt = ((u % CYC) + CYC) % CYC, j = Math.floor(tt / 0.8) % 8, dt = tt - j * 0.8, nj = (j + 1) % 8;
    const m = seg(dt, 0.35, 0.8);                          // 0.35 秒定格 + 0.45 秒形变
    const A = MORPH_ST[j], B = MORPH_ST[nj];
    k.fillStyle = C[A[0]]; k.fillRect(0, 0, CW, CH);
    if (m > 0) { k.fillStyle = C[B[0]]; k.beginPath(); k.arc(MORPH_CX, MORPH_CY, 600 * inOut3(m), 0, TAU); k.fill(); }   // 色块擦除
    const ra = MORPH_SH[j], rb = MORPH_SH[nj];
    const e1 = inOut3(clamp(m * 2)), e2 = inOut3(clamp(m * 2 - 1));
    const sq = 0.13 * Math.sin(Math.PI * m), rot = 0.35 * Math.sin(Math.PI * m) * (j % 2 ? 1 : -1);
    k.save(); k.translate(MORPH_CX, MORPH_CY); k.rotate(rot); k.scale(1 + sq, 1 - sq);
    k.beginPath();
    for (let i = 0; i < N; i++) {
      const r = (m < 0.5 ? mix(ra[i], 1, e1) : mix(1, rb[i], e2)) * MORPH_R, a = -Math.PI / 2 + TAU * i / N;
      if (i) k.lineTo(Math.cos(a) * r, Math.sin(a) * r); else k.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    k.closePath();
    k.fillStyle = `rgb(${lerpC(MORPH_hex(C[A[1]]), MORPH_hex(C[B[1]]), inOut3(m)).join(',')})`; k.fill();
    k.restore();
    // 字幕：旧词上移淡出，新词自下方 10px 升入
    const ink = bg => (bg === 'cream' || bg === 'mari') ? C.ink : C.cream;
    const tm = inOut3(seg(dt, 0.55, 0.8));
    const capBg = m > 0.55 ? B[0] : A[0];
    k.save(); k.beginPath(); k.rect(270, 50, 269, 74); k.clip();
    if (tm < 1) txt(k, A[2], 290, 104 - 24 * tm, `900 40px ${SANS}`, ink(capBg));
    if (tm > 0) txt(k, B[2], 290, 128 - 24 * tm, `900 40px ${SANS}`, ink(capBg));
    k.restore();
    const ic = ink(capBg);
    txt(k, 'morphe.', 292, 150, `600 22px ${DISP}`, ic);
    txt(k, '形变动画 · ONE SHAPE, EVERYTHING', 292, 168, `500 8px ${DISP}`, ic);
    for (let i = 0; i < 8; i++) { k.fillStyle = ic; k.globalAlpha = i === (m > 0.5 ? nj : j) ? 1 : 0.3; k.beginPath(); k.arc(296 + i * 14, 186, 3, 0, TAU); k.fill(); }
    k.globalAlpha = 1;
  };

  // @element 04
  // 04 几何构成 / 包豪斯（KONSTRUKTION · 20 SCHLÄGE）：奶油纸 #F1E9DA 上 52px 模数网格，红 #E03C31 黄 #F2B705 蓝 #1E4FA3 黑 #111；120 BPM 每拍 0.5 秒一个动作、power2.inOut 无回弹、落点都在网格线上：0.5 红圆落下 → 1.0 黑柱下拉 → 1.5 黄三角出现 → 2.0 三角翻转 → 2.5 蓝方从角点放大 → 3.0 红圆右移一模 → 3.5 黑四分之一圆绕角点转 90° → 4.0 蓝半圆滑一模 → 4.5 横线画出 → 5.0 BAUHAUS 与 FORM · FARBE · FUNKTION 硬切入；左下 SCHLAG 计拍；5.4–6.0 秒淡回空纸
  const BAU_C = { paper: '#F1E9DA', R: '#E03C31', Y: '#F2B705', B: '#1E4FA3', K: '#111111' };
  const BAU_M = 52, BAU_OX = 9.5;
  const BAU_io2 = x => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  CELLS[3] = (k, w, h, u) => {
    const M = BAU_M, ox = BAU_OX, C = BAU_C, f = fadeIn(u);
    const pr = b => BAU_io2(seg(u, b - 0.25, b));        // 动作在拍点前 0.25 秒启动、正好在拍点落定
    k.fillStyle = C.paper; k.fillRect(0, 0, CW, CH);
    paper(k, [17, 17, 17], 1200, 91);
    k.save(); k.globalAlpha = f;
    // 网格线 0–0.5 秒画出
    const gA = seg(u, 0, 0.5);
    k.strokeStyle = rgba([17, 17, 17], 0.2); k.lineWidth = 0.6; k.beginPath();
    for (let c = 0; c <= 10; c++) { k.moveTo(ox + c * M, 0); k.lineTo(ox + c * M, CH * gA); }
    for (let r = 1; r < 4; r++) { k.moveTo(0, r * M); k.lineTo(CW * gA, r * M); }
    k.stroke();
    // 4.5 横线（y = 2M）
    const ru = pr(4.5); if (ru > 0) { k.fillStyle = C.K; k.fillRect(ox, 2 * M - 1.5, 10 * M * ru, 3); }
    // 2.5 蓝方 2×2 模，从右下角点放大
    const bs = pr(2.5); if (bs > 0) { k.fillStyle = C.B; k.fillRect(ox + 10 * M - 2 * M * bs, 4 * M - 2 * M * bs, 2 * M * bs, 2 * M * bs); }
    // 1.5 黄三角（底边在 y=2M，先朝下出现，2.0 翻转朝上）
    if (u >= 1.25) {
      const sy = u < 1.5 ? -pr(1.5) : mix(-1, 1, pr(2.0));
      if (Math.abs(sy) > 0.002) { k.fillStyle = C.Y; k.beginPath(); k.moveTo(ox + 6 * M, 2 * M); k.lineTo(ox + 9 * M, 2 * M); k.lineTo(ox + 7.5 * M, 2 * M - 2 * M * sy); k.closePath(); k.fill(); }
    }
    // 4.0 蓝半圆（直边贴在网格线上）向右滑一模
    if (u >= 3.75) {
      const cx = ox + M * pr(4.0);
      k.fillStyle = C.B; k.beginPath(); k.moveTo(cx, 0); k.arc(cx, M, M, -Math.PI / 2, Math.PI / 2); k.closePath(); k.fill();
    }
    // 0.5 红圆自上方落下（power2.in 落死），3.0 向右滑一模
    if (u >= 0.25) {
      const d = seg(u, 0.25, 0.5), y = 2 * M - (1 - d * d) * 3 * M;
      k.fillStyle = C.R; k.beginPath(); k.arc(ox + 2 * M + M * pr(3.0), y, M, 0, TAU); k.fill();
    }
    // 1.0 黑柱自顶向下拉满
    if (u >= 0.75) { const d = seg(u, 0.75, 1.0); k.fillStyle = C.K; k.fillRect(ox + 5 * M, 0, M / 2, CH * d * d); }
    // 3.5 黑四分之一圆：绕底边角点 (7M, 4M) 转 90°
    if (u >= 3.25) {
      const a0 = Math.PI + Math.PI / 2 * pr(3.5);
      k.fillStyle = C.K; k.beginPath(); k.moveTo(ox + 7 * M, 4 * M); k.arc(ox + 7 * M, 4 * M, M, a0, a0 + Math.PI / 2); k.closePath(); k.fill();
    }
    // 5.0 字体硬切入
    if (u >= 5.0) {
      txt(k, 'BAUHAUS', ox + 6 * M + 4, 2 * M + 30, `900 21px ${DISP}`, C.K);
      txt(k, 'FORM · FARBE · FUNKTION', ox + 6 * M + 5, 2 * M + 44, `700 7.5px ${DISP}`, C.K);
    }
    k.save(); k.translate(ox + 9 * M + 34, 6); k.rotate(Math.PI / 2);
    txt(k, 'KONSTRUKTION · 20 SCHLÄGE', 0, 0, `700 8px ${MONO}`, C.K);
    k.restore();
    const n = clamp(Math.floor(u / 0.5 + 1e-6), 0, 10);
    txt(k, 'SCHLAG ' + String(n).padStart(2, '0') + ' · 120 BPM', ox + 4, 4 * M - 6, `700 8px ${MONO}`, C.K);
    k.restore();
    grain(k, 0.06, 'multiply');
  };

  // @element 05
  // 05 逐帧手绘 / 线条沸腾（手作 HAND MADE）：奶油纸 #f4e9d0 + 墨黑 #1c1613、番茄红 #e5402b、向日葵黄 #ffc425 三色；整格按 12fps（一拍二）取整时间，静物线稿每帧换 4 张微差版本循环（line boil），变宽笔刷、两头收锋、填色错位 2px；左侧火柴头上的火苗精灵每 0.8 秒一次挤压弹跳，星形火花每 1.6 秒爆一轮，烟团 3.2 秒升起；右侧手写 HAND MADE 黄字黑描边带块状投影持续沸腾；全部周期运动，76 帧 = 4 的整数倍
  const CEL_P = { ink: '#1c1613', red: '#e5402b', yel: '#ffc425', cream: '#f4e9d0', hi: '#fff6e2', wood: '#f0d794' };
  const CEL_LET = {
    H: { w: 0.62, s: [[[0, 0], [0, 1]], [[0.62, 0], [0.62, 1]], [[0, 0.5], [0.62, 0.48]]] },
    A: { w: 0.7, s: [[[0, 1], [0.35, 0], [0.7, 1]], [[0.15, 0.64], [0.55, 0.62]]] },
    N: { w: 0.62, s: [[[0, 1], [0, 0], [0.62, 1], [0.62, 0]]] },
    D: { w: 0.62, s: [[[0, 0], [0, 1]], [[0, 0], [0.34, 0.02], [0.52, 0.12], [0.6, 0.28], [0.62, 0.52], [0.56, 0.8], [0.44, 0.92], [0.32, 0.99], [0, 1]]] },
    M: { w: 0.8, s: [[[0, 1], [0.03, 0], [0.4, 0.68], [0.77, 0], [0.8, 1]]] },
    E: { w: 0.54, s: [[[0.54, 0], [0, 0], [0, 1], [0.56, 1]], [[0, 0.5], [0.44, 0.49]]] },
  };
  function CEL_res(P, step) {                         // 折线按固定步长重采样
    const out = [P[0]];
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
      for (let j = 1; j <= n; j++) out.push([mix(a[0], b[0], j / n), mix(a[1], b[1], j / n)]);
    }
    return out;
  }
  // 沸腾：世界坐标噪声位移，seed 每张画换一次
  const CEL_boil = (pts, sd, amp) => pts.map(([x, y]) => [x + amp * (vnoise(x / 18 + sd * 7.31, y / 18 + 3.1) * 2 - 1), y + amp * (vnoise(x / 18 - 11.7, y / 18 + sd * 5.13) * 2 - 1)]);
  // 变宽笔刷：轮廓多边形 + 圆头，两端收锋到 45%
  function CEL_ink(k, pts, wd, col, sd) {
    const n = pts.length; if (n < 2) return;
    const S = [0]; for (let i = 1; i < n; i++) S.push(S[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const tot = S[n - 1] || 1, Lp = [], Rp = [], W = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const taper = 0.45 + 0.55 * Math.min(1, S[i] / 7, (tot - S[i]) / 7);
      const ww = wd * taper * (0.85 + 0.3 * vnoise(S[i] / 14, sd * 3.7)) / 2; W.push(ww);
      Lp.push([pts[i][0] - ty * ww, pts[i][1] + tx * ww]); Rp.push([pts[i][0] + ty * ww, pts[i][1] - tx * ww]);
    }
    k.fillStyle = col; k.beginPath(); k.moveTo(Lp[0][0], Lp[0][1]);
    for (let i = 1; i < n; i++) k.lineTo(Lp[i][0], Lp[i][1]);
    for (let i = n - 1; i >= 0; i--) k.lineTo(Rp[i][0], Rp[i][1]);
    k.closePath(); k.fill();
    k.beginPath(); k.arc(pts[0][0], pts[0][1], W[0], 0, TAU); k.arc(pts[n - 1][0], pts[n - 1][1], W[n - 1], 0, TAU); k.fill();
  }
  // 闭合形：错位色块 + 墨线
  function CEL_shape(k, pts, fill, sd, amp, wd) {
    const b = CEL_boil(pts, sd, amp);
    k.fillStyle = fill; k.beginPath(); b.forEach((p, i) => (i ? k.lineTo(p[0] - 2, p[1] + 1.5) : k.moveTo(p[0] - 2, p[1] + 1.5))); k.closePath(); k.fill();
    CEL_ink(k, b.concat([b[0], b[1]]), wd, CEL_P.ink, sd);
  }
  // 标题 4 张沸腾版本缓存成图层
  function CEL_title(v) {
    return layer('CEL_T' + v, g => {
      const word = 'HAND MADE', hh = 40, tr = 0.36, y0 = 84;
      let x = 0; const gl = [];
      for (let i = 0; i < word.length; i++) { const ch = word[i]; if (ch === ' ') { x += hh * 0.55; continue; } gl.push({ L: CEL_LET[ch], x, i }); x += (CEL_LET[ch].w + tr) * hh; }
      const x0 = 345 - (x - tr * hh) / 2, strokes = [];
      gl.forEach(({ L, x: gx, i }) => L.s.forEach((S, si) => {
        const by = Math.sin(i * 2.1) * hh * 0.06;
        const P = S.map(([a, b]) => [x0 + gx + a * hh, y0 + by + (b - 0.5) * hh]);
        strokes.push({ pts: CEL_boil(CEL_res(P, 3), 8000 + i * 13 + si + v * 101, 1.3), sd: i * 7 + si + v * 11 });
      }));
      strokes.forEach(s => CEL_ink(g, s.pts.map(p => [p[0] + 4, p[1] + 4]), 12, CEL_P.ink, s.sd));   // 块状投影
      strokes.forEach(s => CEL_ink(g, s.pts, 12, CEL_P.ink, s.sd));                                   // 墨描边
      strokes.forEach(s => CEL_ink(g, s.pts.map(p => [p[0] - 0.6, p[1] - 0.6]), 6, CEL_P.yel, s.sd)); // 黄字身
    });
  }
  const CEL_DROP = (cx, cy, wd, ht, tipDx) => {         // 水滴形火苗：尖端朝上
    const P = [];
    for (let i = 0; i < 28; i++) { const t = TAU * i / 28, x = Math.sin(t) * Math.sin(t / 2), y = -Math.cos(t); P.push([cx + x * wd * 0.65 + tipDx * Math.max(0, -y) * Math.max(0, -y), cy + y * ht / 2]); }
    return P;
  };
  CELLS[4] = (k, w, h, u) => {
    const P = CEL_P, tq = stepT(u, 12), fr = Math.round(tq * 12), v = fr % 4, sd = v + 1;
    k.fillStyle = P.cream; k.fillRect(0, 0, CW, CH);
    paper(k, [28, 22, 19], 1500, 51);
    // 火柴梗与红色火柴头
    CEL_shape(k, CEL_res([[80, 210], [82, 132], [91, 132], [90, 210]], 4), P.wood, sd * 3, 1.2, 3);
    CEL_shape(k, Array.from({ length: 20 }, (_, i) => [86 + 11 * Math.cos(TAU * i / 20), 126 + 13 * Math.sin(TAU * i / 20)]), P.red, sd * 5, 1.2, 3.2);
    // 火苗精灵：每 0.8 秒一次弹跳（8 次/周期），落下时挤压
    const ph = TAU * tq / 0.8, bob = Math.max(0, Math.sin(ph)), sq = 0.14 * Math.cos(ph);
    const fh = 50 * (1 + sq), fw = 36 * (1 - sq * 0.8), fy = 112 - fh / 2 - bob * 10, tip = 7 * Math.sin(ph * 2);
    CEL_shape(k, CEL_DROP(86, fy, fw, fh, tip), P.yel, sd * 7, 1.4, 3.4);
    CEL_shape(k, CEL_DROP(86, fy + fh * 0.18, fw * 0.5, fh * 0.55, tip * 0.6), P.red, sd * 9, 1.1, 2.2);
    k.fillStyle = P.ink;
    k.beginPath(); k.arc(80, fy + fh * 0.12, 2.4, 0, TAU); k.arc(92, fy + fh * 0.12, 2.4, 0, TAU); k.fill();
    CEL_ink(k, CEL_boil(CEL_res([[81, fy + fh * 0.24], [86, fy + fh * 0.29], [91, fy + fh * 0.24]], 2), sd * 13, 0.6), 2, P.ink, sd);
    // 烟团：3.2 秒升起一轮（2 轮/周期），3 团错相
    for (let i = 0; i < 3; i++) {
      const p = (tq / 3.2 + i / 3) % 1, r = 11 * Math.sin(Math.PI * p);
      if (r < 1.5) continue;
      const cx = 112 + p * 52 + 6 * Math.sin(p * 6 + i), cy = 68 - p * 50;
      CEL_shape(k, Array.from({ length: 14 }, (_, j) => [cx + r * Math.cos(TAU * j / 14), cy + r * Math.sin(TAU * j / 14)]), P.hi, sd * 17 + i, 1.0, 2.4);
    }
    // 标题（沸腾 4 版循环）
    k.drawImage(CEL_title(v), 0, 0);
    // 星形火花：1.6 秒一轮（4 轮/周期），弹出 0.5 秒
    const SP = [[40, 40], [150, 30], [190, 152], [505, 30], [520, 140], [140, 178], [300, 30]];
    SP.forEach(([sx, sy], i) => {
      const l = (tq / 1.6 + hash(i * 9 + 2)) % 1; if (l > 0.32) return;
      const s = Math.sin(Math.PI * l / 0.32) * (7 + 5 * hash(i)), pts = [];
      for (let j = 0; j < 8; j++) { const a = -Math.PI / 2 + Math.PI * j / 4, r = j % 2 ? s * 0.35 : s; pts.push([sx + r * Math.cos(a), sy + r * Math.sin(a)]); }
      CEL_shape(k, CEL_res(pts.concat([pts[0]]), 3), i % 2 ? P.yel : P.red, sd * 19 + i, 0.8, 2.2);
    });
    txt(k, '一帧一帧，亲手点亮', 345, 150, `600 13px ${SANS}`, P.ink, 'center');
    txt(k, '星火牌安全火柴 · 第 146 张', 345, 168, `500 8px ${SANS}`, P.red, 'center');
    grain(k, 0.12, 'multiply');
  };

  // @element 06
  // 06 等轴 2.5D（ISOPOLIS「让城市自己生长」）：真等轴投影（30°、无灭点）的薰衣草浮岛，马卡龙色楼房 0.4–3.65 秒按 120 BPM 八分音符（0.25 秒）错峰生长：先落地面阴影、立面 scaleY 从 0 带回弹拉起、0.1 秒后盖顶；3.6–4.6 秒窗户依次点亮，4.2 秒两楼之间青色数据流；两辆小车沿路循环（每周期 2 圈）；左下等轴斜切的 ISOPOLIS 字标；5.4–6.0 秒楼房缩回地面
  const ISO_P = { ink: '#2C2960', road: '#8781D0', mark: '#FBFAFF', white: '#FBFAFF', peach: '#FFC4AC', sky: '#A8D2FF', mint: '#B7ECD6', lilac: '#D9D1FA', butter: '#FFE6A1', coral: '#FF9E86', deepSky: '#74A9F2', winOff: '#98ACEE', winOn: '#FFF0C8', data: '#62F0F2' };
  const ISO_S = 28, ISO_OX = 262, ISO_OY = -6;
  const ISO_pr = (x, y, z) => [ISO_OX + (x - y) * 0.866 * ISO_S, ISO_OY + (x + y) * 0.5 * ISO_S - z * ISO_S];
  const ISO_hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
  const ISO_BLD = (() => {
    const cols = ['white', 'peach', 'sky', 'lilac', 'mint', 'butter'], out = [];
    const back = [[0.3, 1.2], [1.8, 2.4], [3.2, 1.6], [4.6, 3.2], [6.2, 2.0], [7.6, 2.8], [9.0, 1.4], [10.5, 2.2]];
    back.forEach(([x, hz], i) => out.push({ x, y: 0.3, w: 1.15, d: 1.2, h: hz, c: cols[i % 6], row: 0 }));
    const front = [[0.6, 1.0], [2.5, 1.5], [4.5, 0.8], [6.7, 1.8], [8.7, 1.1], [10.5, 1.4]];
    front.forEach(([x, hz], i) => out.push({ x, y: 2.65, w: 1.1, d: 1.05, h: hz, c: cols[(i + 3) % 6], row: 1 }));
    out.slice().sort((a, b) => (a.x + a.y) - (b.x + b.y)).forEach((b, i) => { b.t = 0.4 + i * 0.25; });
    return out;
  })();
  const ISO_TREE = [[2.0, 3.3], [4.0, 3.4], [6.2, 3.3], [8.2, 3.4], [10.1, 3.5]];
  function ISO_poly(k, pts, col) { k.fillStyle = col; k.beginPath(); pts.forEach((p, i) => { const q = ISO_pr(p[0], p[1], p[2]); if (i) k.lineTo(q[0], q[1]); else k.moveTo(q[0], q[1]); }); k.closePath(); k.fill(); }
  function ISO_box(k, x, y, w, d, hz, col) {
    const c = ISO_hex(col), ink = ISO_hex(ISO_P.ink);
    ISO_poly(k, [[x, y + d, 0], [x + w, y + d, 0], [x + w, y + d, hz], [x, y + d, hz]], `rgb(${lerpC(c, ink, 0.12).join(',')})`);   // 左前立面
    ISO_poly(k, [[x + w, y, 0], [x + w, y + d, 0], [x + w, y + d, hz], [x + w, y, hz]], `rgb(${lerpC(c, ink, 0.24).join(',')})`);   // 右前立面
    ISO_poly(k, [[x, y, hz], [x + w, y, hz], [x + w, y + d, hz], [x, y + d, hz]], col);                                              // 顶面
  }
  CELLS[5] = (k, w, h, u) => {
    const P = ISO_P, keep = 1 - resetK(u);
    k.drawImage(layer('ISO_G', g => {
      const bg = g.createLinearGradient(0, 0, 0, CH); bg.addColorStop(0, '#EEEAFC'); bg.addColorStop(0.6, '#DAD3F7'); bg.addColorStop(1, '#C4BAEF');
      g.fillStyle = bg; g.fillRect(0, 0, CW, CH);
      for (let i = 0; i < 40; i++) { g.fillStyle = rgba([167, 158, 226], 0.5); g.beginPath(); g.arc(hash(i * 3) * CW, hash(i * 3 + 1) * CH, 1.2, 0, TAU); g.fill(); }
      ISO_poly(g, [[0, 4, 0], [12, 4, 0], [12, 4, -0.5], [0, 4, -0.5]], '#CBC3F3');      // 浮岛土层
      ISO_poly(g, [[12, 0, 0], [12, 4, 0], [12, 4, -0.5], [12, 0, -0.5]], '#B2A8EC');
      for (let x = 0; x < 12; x++) for (let y = 0; y < 4; y++) ISO_poly(g, [[x, y, 0], [x + 1, y, 0], [x + 1, y + 1, 0], [x, y + 1, 0]], ['#94DFBD', '#8CDBB6', '#9DE3C4', '#86D6B0'][(x * 3 + y * 5) % 4]);
      ISO_poly(g, [[0, 1.65, 0], [12, 1.65, 0], [12, 2.45, 0], [0, 2.45, 0]], P.road);   // 道路
      for (let x = 0.2; x < 12; x += 0.8) ISO_poly(g, [[x, 2.02, 0], [x + 0.4, 2.02, 0], [x + 0.4, 2.08, 0], [x, 2.08, 0]], P.mark);
      for (const b of ISO_BLD) ISO_poly(g, [[b.x - 0.12, b.y - 0.12, 0], [b.x + b.w + 0.12, b.y - 0.12, 0], [b.x + b.w + 0.12, b.y + b.d + 0.12, 0], [b.x - 0.12, b.y + b.d + 0.12, 0]], '#F4F1FD');   // 地块
      // 等轴斜切字标：沿 x 轴方向（右下 30°）的立面字
      g.save(); g.translate(22, 108); g.transform(0.866, 0.5, 0, 1, 0, 0);
      g.font = `800 30px ${DISP}`; g.fillStyle = P.ink; g.textAlign = 'left'; g.fillText('ISOPOLIS', 0, 0);
      g.font = `600 12px ${SANS}`; g.fillText('让城市自己生长', 2, 20);
      g.restore();
    }), 0, 0);
    const grow = b => backOut(seg(u, b.t, b.t + 0.4)) * keep;
    // 软阴影（光从左上来，影子投向 +x）
    for (const b of ISO_BLD) {
      const hz = b.h * grow(b); if (u < b.t - 0.05 || hz <= 0.01) continue;
      ISO_poly(k, [[b.x + b.w, b.y, 0], [b.x + b.w + hz * 0.55, b.y + 0.2, 0], [b.x + b.w + hz * 0.55, b.y + b.d + 0.2, 0], [b.x + b.w, b.y + b.d, 0]], rgba([44, 41, 96], 0.13));
    }
    const drawRow = row => {
      for (const b of ISO_BLD) {
        if (b.row !== row) continue;
        const hz = b.h * grow(b); if (hz <= 0.01) continue;
        ISO_box(k, b.x, b.y, b.w, b.d, hz, P[b.c]);
        const cap = seg(u, b.t + 0.1, b.t + 0.22) * keep;                         // 屋顶盖晚 0.1 秒（3 帧）落下
        if (cap > 0) ISO_box(k, b.x + 0.12, b.y + 0.12, b.w - 0.24, b.d - 0.24, hz + 0.12 + (1 - cap) * 0.6, P.white);
        // 窗：右前立面上逐层
        const ink = ISO_hex(P.ink);
        for (let fl = 0; fl < Math.floor(hz / 0.45); fl++) for (let c2 = 0; c2 < 2; c2++) {
          const on = u > 3.6 + hash(ISO_BLD.indexOf(b) * 7 + fl * 3 + c2) * 1.0 && keep > 0.5;
          const y0 = b.y + 0.2 + c2 * 0.45, z0 = 0.18 + fl * 0.45;
          ISO_poly(k, [[b.x + b.w, y0, z0], [b.x + b.w, y0 + 0.25, z0], [b.x + b.w, y0 + 0.25, z0 + 0.22], [b.x + b.w, y0, z0 + 0.22]], on ? P.winOn : `rgb(${lerpC(ISO_hex(P.winOff), ink, 0.1).join(',')})`);
        }
      }
    };
    drawRow(0);
    // 小车：每周期 2 圈，两车反向
    for (let i = 0; i < 2; i++) {
      const p = ((u / CYC) * 2 + i * 0.37) % 1, x = i ? 12.4 - p * 13 : p * 13 - 0.6, y = i ? 1.75 : 2.1;
      const a = clamp(Math.min(x + 0.6, 12.4 - x) / 0.6);
      if (a <= 0) continue;
      k.save(); k.globalAlpha = a;
      ISO_box(k, x, y, 0.6, 0.3, 0.22, i ? P.deepSky : P.coral);
      ISO_box(k, x + 0.15, y + 0.03, 0.3, 0.24, 0.36, P.white);
      k.restore();
    }
    drawRow(1);
    // 树：随前排楼依次弹出
    ISO_TREE.forEach(([tx, ty], i) => {
      const s = backOut(seg(u, 1.2 + i * 0.5, 1.5 + i * 0.5)) * keep; if (s <= 0.01) return;
      const b = ISO_pr(tx, ty, 0), t = ISO_pr(tx, ty, 0.55 * s);
      k.strokeStyle = '#C9A48F'; k.lineWidth = 2; k.beginPath(); k.moveTo(b[0], b[1]); k.lineTo(t[0], t[1]); k.stroke();
      k.fillStyle = ['#7FD3A6', '#93DDB5', '#6CC79A', '#A9E6C4'][i % 4]; k.beginPath(); k.arc(t[0], t[1] - 4 * s, 8 * s, 0, TAU); k.fill();
      k.fillStyle = rgba([255, 255, 255], 0.35); k.beginPath(); k.arc(t[0] - 3 * s, t[1] - 7 * s, 3 * s, 0, TAU); k.fill();
    });
    // 数据流：两栋最高楼顶之间的青色弧线，光点每周期 4 趟
    const da = seg(u, 4.2, 4.5) * keep;
    if (da > 0) {
      const A = ISO_pr(4.6 + 0.57, 0.9, 3.4), B = ISO_pr(7.6 + 0.57, 0.9, 3.0), cx = (A[0] + B[0]) / 2, cy = Math.min(A[1], B[1]) - 26;
      k.save(); k.globalAlpha = da; k.strokeStyle = rgba([98, 240, 242], 0.7); k.lineWidth = 1.5; k.setLineDash([3, 3]);
      k.beginPath(); k.moveTo(A[0], A[1]); k.quadraticCurveTo(cx, cy, B[0], B[1]); k.stroke(); k.setLineDash([]);
      const p = (u / CYC * 4) % 1, q = 1 - p, px = q * q * A[0] + 2 * q * p * cx + p * p * B[0], py = q * q * A[1] + 2 * q * p * cy + p * p * B[1];
      glow(k, px, py, 9, '98,240,242', 0.9); k.restore();
    }
  };

  // @element 07
  // 07 3D 渲染系（soft.「柔软着陆」）：淡紫粉棚拍无缝背景 #efe2ea，软胶字母 s/o/f/t 在 0.5/1.0/1.5/2.0 秒按拍落下：下落时纵向拉伸 12%，着地后阻尼弹簧挤压回弹（初始 28%、约 0.6 秒衰减）、地面接触影随高度收放；2.8 秒镀铬小球作句号落下；底部一排光面胶囊克隆阵列做每周期 2 次的波浪起伏，每次落地再激起一圈向外传播的涟漪；材质用竖向渐变 + 左上白色高光边 + 右下暗色厚度层 + 镜面光斑模拟；3.2 秒标语淡入；5.4–6.0 秒字母弹回上方出画
  const SOFT_MAT = [
    { c: '#ff5aa6', lt: '#ffc0dc', dk: '#c2357a' },    // 糖果粉软胶
    { c: '#b4a4be', lt: '#eee6f0', dk: '#7d6a8e' },    // 丁香亮面塑料
    { c: '#f4e8ef', lt: '#ffffff', dk: '#bdacb8' },    // 奶油亮面
    { c: '#ff5aa6', lt: '#ffc0dc', dk: '#c2357a' },
  ];
  const SOFT_LAND = [0.5, 1.0, 1.5, 2.0], SOFT_BALL = 2.8, SOFT_BASE = 156;
  const SOFT_PILL = (() => {                             // 胶囊克隆体精灵（2 倍分辨率）
    return ['#f4e8ef', '#b4a4be', '#ff8fc4'].map(col => {
      const c = document.createElement('canvas'); c.width = 56; c.height = 28; const g = c.getContext('2d');
      g.scale(2, 2);
      const gr = g.createLinearGradient(0, 1, 0, 13); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, col); gr.addColorStop(1, '#725f6a');
      rr(g, 1, 1, 26, 12, 6); g.fillStyle = gr; g.fill();
      g.fillStyle = 'rgba(255,255,255,0.7)'; rr(g, 6, 2.5, 12, 3, 1.5); g.fill();
      return c;
    });
  })();
  function SOFT_spring(dt) { return dt < 0 ? 0 : 0.28 * Math.exp(-5.5 * dt) * Math.cos(16 * dt); }
  CELLS[6] = (k, w, h, u) => {
    const rk = resetK(u), out = rk * rk;
    k.drawImage(layer('SOFT_BG', g => {
      const gr = g.createLinearGradient(0, 0, 0, CH); gr.addColorStop(0, '#f4e8ef'); gr.addColorStop(0.62, '#efe2ea'); gr.addColorStop(0.8, '#e6d2df'); gr.addColorStop(1, '#dcc6d6');
      g.fillStyle = gr; g.fillRect(0, 0, CW, CH);
      const v = g.createRadialGradient(270, 90, 60, 270, 104, 320); v.addColorStop(0, 'rgba(255,255,255,0.35)'); v.addColorStop(1, 'rgba(58,30,66,0.12)');
      g.fillStyle = v; g.fillRect(0, 0, CW, CH);
    }), 0, 0);
    // 胶囊阵列：周期波 + 落地涟漪
    for (let row = 0; row < 2; row++) for (let i = 0; i < 21; i++) {
      const x = -6 + i * 27 + row * 13, base = 178 + row * 15;
      let dy = 2.5 * Math.sin(TAU * u / CYC * 2 - i * 0.55 - row);
      for (let j = 0; j < 5; j++) {
        const L = j < 4 ? SOFT_LAND[j] : SOFT_BALL, dt = u - L; if (dt <= 0 || dt > 1.6) continue;
        const lx = 150 + j * 62, d = Math.abs(x + 14 - lx);
        dy -= 7 * Math.exp(-2.5 * dt) * Math.max(0, Math.cos((d - 150 * dt) / 16)) * Math.exp(-d / 220) * (1 - rk);
      }
      k.drawImage(SOFT_PILL[(i + row) % 3], x, base + dy, 28, 14);
    }
    // 字母
    k.font = `900 112px ${DISP}`; k.textAlign = 'center'; k.textBaseline = 'alphabetic';
    const ch = ['s', 'o', 'f', 't'], wd = ch.map(c => k.measureText(c).width), tot = wd.reduce((a, b) => a + b, 0) + 34;
    let x = 270 - tot / 2;
    ch.forEach((c, i) => {
      const cx = x + wd[i] / 2; x += wd[i];
      const L = SOFT_LAND[i], p = seg(u, L - 0.32, L);
      if (p <= 0) return;
      let y = SOFT_BASE - (1 - p * p) * 230 - out * 240, sx = 1, sy = 1;
      if (p < 1) { sy = 1.12; sx = 0.9; } else { const a = SOFT_spring(u - L); sy = 1 - a; sx = 1 + a * 0.8; }
      const air = clamp((SOFT_BASE - y) / 120);
      k.fillStyle = rgba([74, 46, 78], 0.22 * (1 - air)); k.beginPath(); k.ellipse(cx, SOFT_BASE + 4, wd[i] * 0.45 * (1 - air * 0.5) * sx, 4, 0, 0, TAU); k.fill();
      const M = SOFT_MAT[i];
      k.save(); k.translate(cx, y); k.scale(sx, sy);
      k.fillStyle = M.dk; k.fillText(c, 2.5, 3.5);                                     // 厚度/暗部
      k.fillStyle = 'rgba(255,255,255,0.75)'; k.fillText(c, -1.5, -2);               // 左上高光边
      const gr = k.createLinearGradient(0, -82, 0, 0); gr.addColorStop(0, M.lt); gr.addColorStop(0.45, M.c); gr.addColorStop(1, M.dk);
      k.fillStyle = gr; k.fillText(c, 0, 0);
      glow(k, -wd[i] * 0.18, -62, 12, '255,255,255', 0.55);                          // 镜面光斑
      k.restore();
    });
    // 镀铬句号
    const bp = seg(u, SOFT_BALL - 0.3, SOFT_BALL);
    if (bp > 0) {
      const R = 14, bx = x + 18;
      let by = SOFT_BASE - R - (1 - bp * bp) * 230 - out * 240, sq = bp < 1 ? -0.08 : SOFT_spring(u - SOFT_BALL) * 0.6;
      const air = clamp((SOFT_BASE - R - by) / 120);
      k.fillStyle = rgba([9, 16, 21], 0.25 * (1 - air)); k.beginPath(); k.ellipse(bx, SOFT_BASE + 3, R * (1 - air * 0.5), 3.5, 0, 0, TAU); k.fill();
      k.save(); k.translate(bx, by + R * sq); k.scale(1 + sq, 1 - sq);
      const g1 = k.createLinearGradient(0, -R, 0, R); g1.addColorStop(0, '#ffffff'); g1.addColorStop(0.42, '#bdacb8'); g1.addColorStop(0.5, '#4a2e4e'); g1.addColorStop(0.62, '#7d6a8e'); g1.addColorStop(1, '#efe2ea');
      k.fillStyle = g1; k.beginPath(); k.arc(0, 0, R, 0, TAU); k.fill();
      glow(k, -5, -6, 7, '255,255,255', 0.95);
      k.restore();
    }
    const ta = seg(u, 3.2, 3.8) * (1 - rk);
    if (ta > 0) {
      k.save(); k.globalAlpha = ta;
      k.letterSpacing = '5px'; txt(k, '柔软自有分量', 520, 30 + 8 * (1 - ta), `500 11px ${SANS}`, '#4a2e4e', 'right');
      k.letterSpacing = '2.5px'; txt(k, 'SOFTNESS CARRIES WEIGHT', 520, 44 + 8 * (1 - ta), `600 7.5px ${DISP}`, '#725f6a', 'right');
      k.letterSpacing = '0px'; k.restore();
    }
    grain(k, 0.07, 'overlay');
  };

  // @element 08
  // 08 液态流动（drop.「万物始于一滴」）：深梅紫底，顶部液带下 6 条泳道每 3.2 秒滴一次（每周期 2 次、相位按 hash 错开）：0–40% 液泡在带下鼓起拉颈、40–75% 断颈下落（次级小液滴晚 0.12 跟随）、75–100% 落入底部液池并左右压扁溅开；融球用半分辨率离屏图「模糊 4px + 对比度 24 阈值」粘连，再乘橙→粉→紫糖果渐变（#FF5C0F→#FF1A70→#8F1FFF），并以掩膜差分得到左上高光边模拟 fresnel；中央 drop. 衬线字标与「万物始于一滴」常驻
  const LIQ_W = 270, LIQ_H = 104;
  const LIQ_CV = (() => { const mk = () => { const c = document.createElement('canvas'); c.width = LIQ_W; c.height = LIQ_H; return c; }; return { a: mk(), b: mk(), c: mk(), s: mk() }; })();
  const LIQ_LANES = [46, 112, 178, 362, 428, 494];
  function LIQ_blobs(g, u) {                            // 在全尺寸坐标里画融球源（白色圆）
    g.fillStyle = '#fff';
    const C = (x, y, r) => { if (r > 0.3) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } };
    const E = (x, y, rx, ry) => { if (rx > 0.3 && ry > 0.3) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); } };
    for (let x = -10; x <= CW + 20; x += 26) C(x, -8 + 3 * Math.sin(TAU * u / CYC + x * 0.03), 17);     // 顶部液带
    for (let x = -10; x <= CW + 20; x += 26) C(x, 218 + 3 * Math.sin(TAU * u / CYC * 2 + x * 0.02), 22); // 底部液池
    LIQ_LANES.forEach((lx, i) => {
      const l = (u / 3.2 + hash(i * 5 + 1)) % 1;
      if (l < 0.4) {                                    // 鼓起 + 拉颈
        const e = out3(l / 0.4), y = 12 + 28 * e, r = 5 + 8 * e;
        C(lx, y, r); C(lx, (y + 4) / 2, r * 0.55);
      } else if (l < 0.75) {                            // 断颈下落 + 次级液滴
        const p = (l - 0.4) / 0.35, y = 40 + 158 * p * p;
        E(lx, y, 11 * (1 - 0.15 * p), 12 * (1 + 0.35 * p));
        const q = Math.max(0, p - 0.12), y2 = 30 + 160 * q * q; if (p > 0.08) C(lx + 1, y2, 4.5);
        C(lx, 12 * (1 - p), 7 * (1 - clamp(p * 2)) + 3 * Math.sin(Math.PI * clamp(p * 3)));   // 断颈后回弹的残余
      } else {                                          // 落池压扁 + 溅开
        const p = (l - 0.75) / 0.25, s = Math.sin(Math.PI * p);
        E(lx, 196, 13 + 16 * p, 10 * (1 - 0.5 * p) + 2);
        C(lx - 22 * p, 188 - 16 * s, 4 * (1 - p)); C(lx + 22 * p, 188 - 16 * s, 4 * (1 - p));
      }
    });
  }
  CELLS[7] = (k, w, h, u) => {
    const { a, b, c } = LIQ_CV;
    k.drawImage(layer('LIQ_BG', g => {
      const gr = g.createLinearGradient(0, 0, 0, CH); gr.addColorStop(0, '#12051a'); gr.addColorStop(0.6, '#2a0b30'); gr.addColorStop(1, '#34103c');
      g.fillStyle = gr; g.fillRect(0, 0, CW, CH);
      const sp = g.createRadialGradient(270, 110, 10, 270, 110, 220); sp.addColorStop(0, 'rgba(158,41,107,0.35)'); sp.addColorStop(1, 'rgba(158,41,107,0)');
      g.fillStyle = sp; g.fillRect(0, 0, CW, CH);
    }), 0, 0);
    // 1) 模糊源
    const ga = a.getContext('2d');
    // 融球源先清晰地画进草稿图 s，再整张一次性模糊到 a（filter 只作用一次绘制，而不是每个圆各算一次）
    const gs = LIQ_CV.s.getContext('2d');
    gs.save(); gs.fillStyle = '#000'; gs.fillRect(0, 0, LIQ_W, LIQ_H); gs.scale(LIQ_W / CW, LIQ_H / CH); LIQ_blobs(gs, u); gs.restore();
    ga.save(); ga.globalCompositeOperation = 'source-over'; ga.filter = 'none'; ga.fillStyle = '#000'; ga.fillRect(0, 0, LIQ_W, LIQ_H);
    ga.filter = 'blur(4px)'; ga.drawImage(LIQ_CV.s, 0, 0); ga.restore(); ga.filter = 'none';
    // 2) 对比度阈值 → 黑白掩膜
    const gb = b.getContext('2d');
    gb.save(); gb.globalCompositeOperation = 'source-over'; gb.filter = 'contrast(24)'; gb.drawImage(a, 0, 0); gb.restore(); gb.filter = 'none';
    // 3) 高光边：掩膜 与 右下偏移的掩膜 求差，再乘回掩膜 → 只留左上内缘
    const gc = c.getContext('2d');
    gc.save(); gc.globalCompositeOperation = 'source-over'; gc.drawImage(b, 0, 0);
    gc.globalCompositeOperation = 'difference'; gc.drawImage(b, 1.5, 1.5);
    gc.globalCompositeOperation = 'multiply'; gc.drawImage(b, 0, 0); gc.restore();
    // 4) 掩膜乘糖果渐变
    gb.save(); gb.globalCompositeOperation = 'multiply';
    const gr = gb.createLinearGradient(0, 0, LIQ_W, LIQ_H); gr.addColorStop(0, '#FF5C0F'); gr.addColorStop(0.5, '#FF1A70'); gr.addColorStop(1, '#8F1FFF');
    gb.fillStyle = gr; gb.fillRect(0, 0, LIQ_W, LIQ_H); gb.restore();
    k.save(); k.imageSmoothingEnabled = true;
    k.globalCompositeOperation = 'lighter'; k.drawImage(b, 0, 0, CW, CH);
    k.globalCompositeOperation = 'screen'; k.globalAlpha = 0.7; k.drawImage(c, 0, 0, CW, CH);
    k.restore();
    // 字标
    k.save();
    k.textAlign = 'center'; k.textBaseline = 'alphabetic'; k.font = `italic 900 60px ${SERIF}`;
    k.fillStyle = 'rgba(120,10,60,0.6)'; k.fillText('drop.', 272, 118);
    const tg = k.createLinearGradient(220, 70, 330, 120); tg.addColorStop(0, '#FFBD4D'); tg.addColorStop(0.5, '#ff1f73'); tg.addColorStop(1, '#c061ff');
    k.fillStyle = tg; k.fillText('drop.', 270, 115);
    k.globalAlpha = 0.55; k.fillStyle = '#fff7f0'; k.font = `italic 900 60px ${SERIF}`; k.save(); k.beginPath(); k.rect(0, 60, CW, 22); k.clip(); k.fillText('drop.', 269, 114); k.restore();
    k.restore();
    k.letterSpacing = '5px'; txt(k, '万物始于一滴', 272, 142, `600 13px ${SERIF}`, '#ffe8f0', 'center');
    k.letterSpacing = '2px'; txt(k, 'EVERYTHING BEGINS AS A DROP', 271, 158, `600 7.5px ${DISP}`, 'rgba(255,200,224,0.75)', 'center');
    k.letterSpacing = '0px';
  };

  // @element 09
  // 09 弥散渐变 / 玻璃拟态（Aurora「思考，自有光」）：深靛黑 #040312 底上 5 团极光色斑（紫 #7050FF、蓝 #2F46F2、青 #34CFF0、品红 #B653F0、靛 #3320A8）在 68×26 低分辨率离屏里绘制后放大成大面积柔和弥散并整周期 1 圈漂移；两张磨砂玻璃卡（再降一级分辨率的背景 + 1.08 倍放大偏移模拟折射 + 白 8% 填充 + 1px 白 30% 描边 + 顶部高光）每周期 2 次缓慢浮动；卡内对话逐行以透明度 + 8px 上移浮现（0.6/1.3/2.0/2.7 秒），3.4 秒「专注」开关滑开，波形条持续呼吸；一枚液态玻璃透镜整周期往返横扫，放大其下画面并带青/品红色散边与镜面弧光；5.4–6.0 秒文字淡出
  const AUR_LOW = (() => { const c = document.createElement('canvas'); c.width = 68; c.height = 26; return c; })();
  const AUR_LOW2 = (() => { const c = document.createElement('canvas'); c.width = 34; c.height = 13; return c; })();
  const AUR_SC = (() => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return c; })();
  const AUR_BLOBS = [
    { c: '112,80,255', x: 120, y: 60, r: 190, ax: 60, ay: 22, p: 0 },
    { c: '47,70,242', x: 330, y: 150, r: 200, ax: 70, ay: 20, p: 1.7 },
    { c: '52,207,240', x: 470, y: 50, r: 150, ax: 50, ay: 25, p: 3.1 },
    { c: '182,83,240', x: 250, y: 200, r: 160, ax: 80, ay: 18, p: 4.4 },
    { c: '51,32,168', x: 40, y: 190, r: 170, ax: 40, ay: 20, p: 5.6 },
  ];
  function AUR_card(g, x, y, wd, ht, r) {
    g.save(); rr(g, x, y, wd, ht, r); g.clip();
    g.imageSmoothingEnabled = true;
    g.drawImage(AUR_LOW2, -CW * 0.04 + 6, -CH * 0.04 + 4, CW * 1.08, CH * 1.08);   // 更糊、略放大偏移的背景 = 背板模糊 + 折射
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x, y, wd, ht);
    const hl = g.createLinearGradient(0, y, 0, y + ht); hl.addColorStop(0, 'rgba(255,255,255,0.18)'); hl.addColorStop(0.4, 'rgba(255,255,255,0)'); g.fillStyle = hl; g.fillRect(x, y, wd, ht);
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 1; rr(g, x + 0.5, y + 0.5, wd - 1, ht - 1, r); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.moveTo(x + r, y + 1); g.lineTo(x + wd - r, y + 1); g.stroke();
  }
  CELLS[8] = (k, w, h, u) => {
    const ph = TAU * u / CYC, f = fadeIn(u);
    // 极光：低分辨率离屏 → 放大
    const gl = AUR_LOW.getContext('2d');
    gl.save(); gl.globalCompositeOperation = 'source-over'; gl.fillStyle = '#040312'; gl.fillRect(0, 0, 68, 26);
    gl.scale(68 / CW, 26 / CH); gl.globalCompositeOperation = 'screen';
    for (const B of AUR_BLOBS) {
      const bx = B.x + B.ax * Math.sin(ph + B.p), by = B.y + B.ay * Math.sin(ph + B.p * 1.7 + 1);
      const gr = gl.createRadialGradient(bx, by, 0, bx, by, B.r); gr.addColorStop(0, `rgba(${B.c},0.85)`); gr.addColorStop(0.55, `rgba(${B.c},0.35)`); gr.addColorStop(1, `rgba(${B.c},0)`);
      gl.fillStyle = gr; gl.fillRect(bx - B.r, by - B.r, B.r * 2, B.r * 2);
    }
    gl.restore();
    const g2 = AUR_LOW2.getContext('2d'); g2.imageSmoothingEnabled = true; g2.drawImage(AUR_LOW, 0, 0, 34, 13);
    // 整幅画到离屏 SC（透镜要放大它）
    const g = AUR_SC.getContext('2d');
    g.save(); g.imageSmoothingEnabled = true; g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.drawImage(AUR_LOW, 0, 0, CW, CH);
    // 标题
    g.globalAlpha = 0.92 * f;
    g.letterSpacing = '1px'; txt(g, 'Aurora', 24, 92, `300 32px ${DISP}`, '#FFFFFF');
    g.letterSpacing = '2px'; txt(g, '— think in light', 26, 112, `300 10px ${DISP}`, '#C9D2FF');
    g.letterSpacing = '4px'; txt(g, '思考，自有光', 26, 138, `300 13px ${SANS}`, '#E9E4FF');
    g.letterSpacing = '0px'; g.globalAlpha = 1;
    // 卡 A：对话
    const fa = 2.5 * Math.sin(ph * 2), fb = 2.5 * Math.sin(ph * 2 + 1.6);
    AUR_card(g, 214, 22 + fa, 200, 86, 16);
    const line = (s, x, y, t, fnt, col, al = 'left') => { const a = seg(u, t, t + 0.6) * f; if (a <= 0) return; g.globalAlpha = a; txt(g, s, x, y + 8 * (1 - Math.sin(a * Math.PI / 2)), fnt, col, al); g.globalAlpha = 1; };
    const ua = seg(u, 0.6, 1.2) * f;
    if (ua > 0) { g.globalAlpha = ua; g.fillStyle = 'rgba(154,124,255,0.45)'; rr(g, 270, 32 + fa + 8 * (1 - ua), 134, 18, 9); g.fill(); g.globalAlpha = 1; }
    line('帮我安排一个慢悠悠的周日。', 398, 45 + fa, 0.6, `500 9.5px ${SANS}`, '#FFFFFF', 'right');
    line('十点，慢慢吃早餐。', 228, 68 + fa, 1.3, `400 9px ${SANS}`, 'rgba(233,228,255,0.9)');
    line('四点，去湖边走一走，', 228, 82 + fa, 2.0, `400 9px ${SANS}`, 'rgba(233,228,255,0.9)');
    line('正好赶上光变成金色。', 228, 96 + fa, 2.7, `400 9px ${SANS}`, 'rgba(233,228,255,0.9)');
    // 卡 B：专注开关 + 波形
    AUR_card(g, 300, 122 + fb, 216, 66, 18);
    txt(g, '专注', 316, 146 + fb, `500 11px ${SANS}`, '#FFFFFF');
    txt(g, '仅家人可以联系你', 316, 162 + fb, `400 8px ${SANS}`, 'rgba(201,210,255,0.85)');
    const on = inOut3(seg(u, 3.4, 4.0)) * f;
    rr(g, 462, 134 + fb, 40, 20, 10);
    const tg = g.createLinearGradient(462, 0, 502, 0); tg.addColorStop(0, '#5B7CFF'); tg.addColorStop(1, '#43D3F2');
    g.fillStyle = 'rgba(255,255,255,0.15)'; g.fill(); g.globalAlpha = on; g.fillStyle = tg; g.fill(); g.globalAlpha = 1;
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(472 + 20 * on, 144 + fb, 8, 0, TAU); g.fill();
    for (let i = 0; i < 18; i++) {
      const hh = 3 + 7 * (0.5 + 0.5 * Math.sin(ph * 4 + i * 0.7)) * (0.5 + 0.5 * Math.sin(ph * 2 - i * 0.31));
      g.fillStyle = `rgba(${i < 9 ? '154,124,255' : '67,211,242'},0.85)`; rr(g, 316 + i * 7, 176 + fb - hh / 2, 3, hh, 1.5); g.fill();
    }
    txt(g, '聆听中', 446, 180 + fb, `400 8px ${SANS}`, 'rgba(233,228,255,0.8)');
    g.restore();
    k.drawImage(AUR_SC, 0, 0);
    // 液态玻璃透镜
    const lx = 270 + 220 * Math.sin(ph), ly = 108 + 10 * Math.sin(ph * 2), R = 30, mag = 1.35;
    k.save(); k.beginPath(); k.arc(lx, ly, R, 0, TAU); k.clip();
    k.translate(lx, ly); k.scale(mag, mag); k.translate(-lx, -ly); k.drawImage(AUR_SC, 0, 0);
    k.restore();
    k.save(); k.lineWidth = 1.5;
    k.strokeStyle = 'rgba(67,211,242,0.7)'; k.beginPath(); k.arc(lx - 0.8, ly, R - 0.8, 0, TAU); k.stroke();
    k.strokeStyle = 'rgba(224,123,216,0.7)'; k.beginPath(); k.arc(lx + 0.8, ly, R - 0.8, 0, TAU); k.stroke();
    k.strokeStyle = 'rgba(255,255,255,0.9)'; k.lineWidth = 2; k.beginPath(); k.arc(lx, ly, R - 4, Math.PI * 1.1, Math.PI * 1.45); k.stroke();
    k.restore();
    grain(k, 0.04, 'overlay');
  };

  // @element 10
  // 10 赛博朋克 HUD / FUI（22-hud「隼眼-9 · 目标锁定」）：深青黑底 #020A0D，青 #00E5FF 线框按层级错帧生长（0.12 外框角 → 0.4 外环 → 0.55 刻度/雷达 → 0.9 地球 → 1.15 右面板 → 1.0–1.6 六边形网格），雷达扫描 1.6 秒一圈（每周期 4 圈）带 4 个回波点；1.2–2.2 秒五行读数各自乱跳 4 帧（30fps）后落定，日志打字机 45 字/秒带闪烁光标；中央线框地球 0–3.4 秒减速转满一圈把上海（N31°14′ E121°29′）转到正面，2.4/2.9 秒两个候选框跳选后划叉，3.0 秒四角括号从卡片四角飞入、3.25–3.55 秒 ±4px 搜寻、3.55–3.8 秒 1.4→1.0 快出缓入吸附，3.8 秒锁定：全局翻洋红 #FF2A8A、白热闪帧、3 道扩散环（3.8/4.3/4.8）、目标锁定 / TARGET LOCKED，4.2 秒坐标打字；5.4–6.0 秒整体淡出，全程叠扫描线
  const HUD_C = { ink: '#020A0D', cya: '#00E5FF', dim: '#0B7C8C', deep: '#0E3A42', hot: '#E8FEFF', mag: '#FF2A8A', dot: '#FF5A4E' };
  const HUD_LOCK = 3.8;
  const HUD_BLIPS = [[118, 0.62], [205, 0.41], [262, 0.78], [331, 0.55]];
  const HUD_LOG = [[0.4, 'OPTIC CORE v4.2.1', 'OK'], [0.75, 'CRYO FPA 4096² · 77K', 'OK'], [1.1, 'GYRO ALIGN Δ0.0003°', 'OK'], [1.98, '> SEARCH MODE ENGAGED', ''], [2.6, '! SIGNAL · BRG 041°', ''], [3.9, '■ TGT-03 LOCKED', '']];
  const HUD_DATA = [['AZM', 41.27, 2, '°'], ['ELV', 18.04, 2, '°'], ['ALT', 512.08, 2, 'KM'], ['RNG', 296.4, 1, 'KM'], ['SNR', 32.6, 1, 'dB']];
  // 地球表面"陆地"点：随机经纬度按噪声筛选，另在目标（华东）附近加一簇密点
  const HUD_LAND = (() => {
    const a = [];
    for (let i = 0; i < 520; i++) { const lat = Math.asin(2 * hash(i * 3 + 501) - 1) * 180 / Math.PI, lon = hash(i * 3 + 502) * 360 - 180; if (fbm2(lon / 40 + 9, lat / 30 + 4, 3) > 0.52) a.push([lat, lon]); }
    for (let i = 0; i < 70; i++) a.push([22 + hash(i + 901) * 18, 108 + hash(i + 951) * 14]);
    return a;
  })();
  CELLS[9] = (k, w, h, u) => {
    const C = HUD_C, F = fadeIn(u), lock = u >= HUD_LOCK, AC = lock ? C.mag : C.cya, D2R = Math.PI / 180;
    const ga = a => { k.globalAlpha = clamp(a) * F; };
    const pr = (a, d = 0.5) => out3(seg(u, a, a + d));
    k.globalAlpha = 1; k.fillStyle = C.ink; k.fillRect(0, 0, CW, CH);
    // 六边形网格 + 暗角（静态图层）
    ga(seg(u, 1.0, 1.6));
    k.drawImage(layer('HUD_hex', g => {
      g.strokeStyle = C.deep; g.lineWidth = 0.7; g.beginPath();
      const r = 9, dx = r * 1.5, dy = r * Math.sqrt(3);
      for (let i = -1; i < CW / dx + 1; i++) for (let j = -1; j < CH / dy + 1; j++) {
        const cx = i * dx, cy = j * dy + (i % 2 ? dy / 2 : 0);
        for (let q = 0; q <= 6; q++) { const a = q * Math.PI / 3, px = cx + r * Math.cos(a), py = cy + r * Math.sin(a); q ? g.lineTo(px, py) : g.moveTo(px, py); }
      }
      g.stroke();
      const v = g.createRadialGradient(270, 104, 60, 270, 104, 320); v.addColorStop(0, 'rgba(2,10,13,0)'); v.addColorStop(1, 'rgba(2,10,13,0.85)');
      g.fillStyle = v; g.fillRect(0, 0, CW, CH);
    }), 0, 0);
    // 外框四角 + 面板分隔线
    const pf = pr(0.12, 0.4);
    if (pf > 0) {
      ga(1); k.strokeStyle = AC; k.lineWidth = 1.2; k.beginPath();
      const L = 18 * pf;
      for (const [x, y, sx, sy] of [[5, 5, 1, 1], [CW - 5, 5, -1, 1], [CW - 5, CH - 5, -1, -1], [5, CH - 5, 1, -1]]) { k.moveTo(x + sx * L, y); k.lineTo(x, y); k.lineTo(x, y + sy * L); }
      k.stroke();
      k.strokeStyle = C.dim; k.lineWidth = 0.8; k.beginPath();
      k.moveTo(152, 104 - 90 * pf); k.lineTo(152, 104 + 90 * pf); k.moveTo(388, 104 - 90 * pf); k.lineTo(388, 104 + 90 * pf); k.stroke();
    }
    // 左：雷达（扫描 1.6 秒一圈，起始方位 52°）
    const RX = 64, RY = 62, RR = 42, prd = pr(0.55, 0.6);
    if (prd > 0) {
      ga(1); k.strokeStyle = C.dim; k.lineWidth = 0.8;
      for (const r0 of [RR, RR * 0.66, RR * 0.33]) { k.beginPath(); k.arc(RX, RY, r0, -Math.PI / 2, -Math.PI / 2 + TAU * prd); k.stroke(); }
      k.beginPath(); k.moveTo(RX - RR * prd, RY); k.lineTo(RX + RR * prd, RY); k.moveTo(RX, RY - RR * prd); k.lineTo(RX, RY + RR * prd); k.stroke();
      k.strokeStyle = AC; k.lineWidth = 1; k.beginPath();
      for (let i = 0; i < 36 * prd; i++) { const a = i * 10 * D2R, l = i % 9 === 0 ? 5 : 2.5; k.moveTo(RX + Math.cos(a) * RR, RY + Math.sin(a) * RR); k.lineTo(RX + Math.cos(a) * (RR + l), RY + Math.sin(a) * (RR + l)); }
      k.stroke();
      const th = TAU * u / 1.6 + (52 - 90) * D2R, col = lock ? '255,42,138' : '0,229,255';
      ga(prd);
      const cg = k.createConicGradient(th - 1.1, RX, RY);
      cg.addColorStop(0, `rgba(${col},0)`); cg.addColorStop(1.1 / TAU, `rgba(${col},0.5)`); cg.addColorStop(1.1 / TAU + 0.002, `rgba(${col},0)`); cg.addColorStop(1, `rgba(${col},0)`);
      k.fillStyle = cg; k.beginPath(); k.moveTo(RX, RY); k.arc(RX, RY, RR, th - 1.1, th); k.closePath(); k.fill();
      k.strokeStyle = AC; k.lineWidth = 1.2; k.beginPath(); k.moveTo(RX, RY); k.lineTo(RX + Math.cos(th) * RR, RY + Math.sin(th) * RR); k.stroke();
      for (const [brg, r0] of HUD_BLIPS) {
        const a = (brg - 90) * D2R; let d = (th - a) % TAU; if (d < 0) d += TAU; const b = Math.exp(-d * 1.2);
        ga(prd * (0.2 + 0.8 * b)); k.fillStyle = brg === 331 && u > 2.6 ? C.dot : AC;
        k.beginPath(); k.arc(RX + Math.cos(a) * RR * r0, RY + Math.sin(a) * RR * r0, 1.6 + b, 0, TAU); k.fill();
      }
      ga(prd); txt(k, 'RADAR · 雷达扫描', 14, 122, `600 8px ${SANS}`, C.cya);
    }
    // 左：迷你折线（1.6–2.4 描出）与频谱柱（10fps 跳动）
    const psp = pr(1.6, 0.8);
    if (psp > 0) {
      ga(1); k.strokeStyle = C.deep; k.lineWidth = 0.8; k.strokeRect(14, 132, 126, 30);
      k.strokeStyle = AC; k.lineWidth = 1.1; k.beginPath();
      const n = Math.floor(40 * psp);
      for (let i = 0; i <= n; i++) { const x = 14 + i * 126 / 40, y = 158 - 22 * fbm2(i * 0.35 + 3, 1.5, 3); i ? k.lineTo(x, y) : k.moveTo(x, y); }
      k.stroke();
    }
    const psb = pr(1.9, 0.4);
    if (psb > 0) {
      ga(psb); txt(k, '信号分析 SIGNAL', 14, 176, `600 8px ${SANS}`, C.cya);
      const fq = Math.floor(u * 10);
      for (let i = 0; i < 18; i++) {
        const hit = i > 9 && i < 13 && u > 2.6, v = clamp(0.2 + 0.8 * hash(i * 13 + fq * 7) * (hit ? 1.25 : 0.7));
        k.fillStyle = hit ? C.hot : C.dim; k.fillRect(14 + i * 7, 200 - 18 * v, 5, 18 * v);
      }
    }
    // 中：外环（4 段弧，每周期 1 圈）+ 刻度环
    const GX = 270, GY = 106, GR = 80, tilt = 24 * D2R, ct = Math.cos(tilt), st = Math.sin(tilt);
    const rot = TAU * u / CYC, por = pr(0.4, 0.5);
    if (por > 0) {
      ga(1); k.strokeStyle = AC; k.lineWidth = 1.1;
      for (let q = 0; q < 4; q++) { k.beginPath(); k.arc(GX, GY, 97, rot + q * Math.PI / 2, rot + q * Math.PI / 2 + 1.1 * por); k.stroke(); }
      k.strokeStyle = C.dim; k.lineWidth = 0.8; k.beginPath();
      const nt = Math.floor(72 * pr(0.55, 0.5));
      for (let i = 0; i < nt; i++) { const a = -rot + i * 5 * D2R, l = i % 6 === 0 ? 5 : 2; k.moveTo(GX + Math.cos(a) * 90, GY + Math.sin(a) * 90); k.lineTo(GX + Math.cos(a) * (90 - l), GY + Math.sin(a) * (90 - l)); }
      k.stroke();
    }
    // 中：线框地球（正射投影，倾角 24°；0–3.4 秒减速转满 360°）
    const lon0 = 121.48 - 360 * (1 - out3(seg(u, 0, 3.4)));
    const pj = (lat, lon) => { const a = lat * D2R, b = (lon - lon0) * D2R, ca = Math.cos(a); const x = ca * Math.sin(b), y = Math.sin(a), z = ca * Math.cos(b); return [GX + GR * x, GY - GR * (y * ct - z * st), y * st + z * ct]; };
    const pg = pr(0.9, 0.7);
    if (pg > 0) {
      ga(pg); glow(k, GX, GY, 110, lock ? '255,42,138' : '0,229,255', 0.1);
      const lines = [], nm = Math.ceil(12 * pg);
      for (let m = 0; m < nm; m++) { const pts = []; for (let la = -90; la <= 90; la += 6) pts.push(pj(la, m * 30)); lines.push(pts); }
      for (let la = -60; la <= 60; la += 30) if (pg > 0.3 + (la + 60) / 300) { const pts = []; for (let lo = 0; lo <= 360; lo += 6) pts.push(pj(la, lo)); lines.push(pts); }
      for (const pass of [0, 1]) {
        k.beginPath();
        for (const pts of lines) for (let i = 1; i < pts.length; i++) { const p0 = pts[i - 1], p1 = pts[i]; if ((p0[2] > 0 && p1[2] > 0) === (pass === 1)) { k.moveTo(p0[0], p0[1]); k.lineTo(p1[0], p1[1]); } }
        if (pass === 0) { ga(0.22 * pg); k.strokeStyle = C.dim; k.lineWidth = 0.7; k.stroke(); }
        else { ga(0.22 * pg); k.strokeStyle = AC; k.lineWidth = 2.6; k.stroke(); ga(0.85 * pg); k.lineWidth = 0.8; k.stroke(); }
      }
      ga(0.9 * pg); k.strokeStyle = AC; k.lineWidth = 1; k.beginPath(); k.arc(GX, GY, GR, 0, TAU); k.stroke();
      ga(0.75 * pg); k.fillStyle = AC; k.beginPath();
      for (const [la, lo] of HUD_LAND) { const p = pj(la, lo); if (p[2] > 0.05) k.rect(p[0] - 0.6, p[1] - 0.6, 1.2, 1.2); }
      k.fill();
    }
    // 目标点（2.6 秒发现，4Hz 闪烁至锁定）
    const T = pj(31.23, 121.48), tx = T[0], ty = T[1];
    if (u > 2.6 && T[2] > 0) {
      const on = lock || Math.floor((u - 2.6) * 8) % 2 === 0;
      ga(1); glow(k, tx, ty, 14, '255,90,78', on ? 0.6 : 0.25);
      if (on) { k.fillStyle = C.dot; k.beginPath(); k.arc(tx, ty, 2.6, 0, TAU); k.fill(); }
    }
    // 候选目标：跳选 0.5 秒后划叉
    for (const [t0, la, lo, lab] of [[2.4, 24.5, 112.5, 'CND-01 0.231'], [2.9, 38.5, 128.5, 'CND-02 0.418']]) {
      if (u < t0) continue;
      const p = pj(la, lo), age = u - t0;
      if (age < 0.5) {
        const s = 1.4 - 0.4 * out3(clamp(age / 0.15));
        ga(Math.floor(age * 20) % 2 ? 0.6 : 1); k.strokeStyle = C.cya; k.lineWidth = 1; k.beginPath();
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const cx = p[0] + sx * 9 * s, cy = p[1] + sy * 9 * s; k.moveTo(cx - sx * 4, cy); k.lineTo(cx, cy); k.lineTo(cx, cy - sy * 4); }
        k.stroke(); txt(k, lab, p[0] + 13, p[1] - 9, `600 7.5px ${MONO}`, C.cya);
      } else if (age < 1.1) {
        ga(0.6 * (1 - (age - 0.5) / 0.6)); k.strokeStyle = C.dim; k.lineWidth = 1; k.beginPath();
        k.moveTo(p[0] - 5, p[1] - 5); k.lineTo(p[0] + 5, p[1] + 5); k.moveTo(p[0] + 5, p[1] - 5); k.lineTo(p[0] - 5, p[1] + 5); k.stroke();
      }
    }
    // 主锁定框：3.0 飞入 → 3.25 搜寻 → 3.55 吸附 1.4→1.0 → 3.8 锁定咬合至 0.62
    if (u >= 3.0) {
      const HS = 22, cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]], cc = [[8, 8], [CW - 8, 8], [CW - 8, CH - 8], [8, CH - 8]];
      let hs, jx = 0, jy = 0, e = 1;
      if (u < 3.25) { e = out3(seg(u, 3.0, 3.25)); hs = HS * 1.4; }
      else if (u < 3.55) { hs = HS * 1.4; const f = Math.floor(u * 15); jx = (hash(f * 3 + 1) - 0.5) * 8; jy = (hash(f * 3 + 2) - 0.5) * 8; }
      else if (u < HUD_LOCK) { const q = 1 - Math.pow(2, -10 * seg(u, 3.55, HUD_LOCK)); hs = HS * mix(1.4, 1.0, q); }
      else hs = HS * mix(1.0, 0.62, out3(seg(u, HUD_LOCK, HUD_LOCK + 0.2)));
      const col = lock ? C.mag : C.cya, arm = 7;
      for (const [lw, a] of [[3.4, 0.25], [1.4, 1]]) {
        ga(a); k.strokeStyle = col; k.lineWidth = lw; k.beginPath();
        cs.forEach(([sx, sy], i) => { const px = mix(cc[i][0], tx + jx + sx * hs, e), py = mix(cc[i][1], ty + jy + sy * hs, e); k.moveTo(px - sx * arm, py); k.lineTo(px, py); k.lineTo(px, py - sy * arm); });
        k.stroke();
      }
      if (u >= 3.25 && u < HUD_LOCK) {
        const q = seg(u, 3.25, HUD_LOCK); ga(0.8); k.strokeStyle = C.cya; k.lineWidth = 1.2;
        k.beginPath(); k.arc(tx, ty, 11, -Math.PI / 2, -Math.PI / 2 + TAU * q * q); k.stroke();
        txt(k, `LOCK ${Math.round(q * q * 100)}%`, tx, ty + hs + 12, `600 7.5px ${MONO}`, C.cya, 'center');
      }
      if (lock) {
        const d = u - HUD_LOCK, sp = d * 1.4;
        ga(out3(clamp(d / 0.4))); k.strokeStyle = C.mag; k.lineWidth = 1.5;
        for (let q = 0; q < 4; q++) { k.beginPath(); k.arc(tx, ty, 9, sp + q * Math.PI / 2, sp + q * Math.PI / 2 + 0.9); k.stroke(); }
        if (d < 0.25) { const z = out3(d / 0.25); ga(0.9 * (1 - z)); k.strokeStyle = C.hot; k.lineWidth = 2; k.strokeRect(tx - 25 - 35 * z, ty - 25 - 35 * z, 50 + 70 * z, 50 + 70 * z); }
        for (const p0 of [HUD_LOCK, 4.3, 4.8]) { const dd = u - p0; if (dd < 0 || dd > 0.7) continue; const z = out3(dd / 0.7); ga((1 - z) * 0.9); k.strokeStyle = C.mag; k.lineWidth = 1.5; k.beginPath(); k.arc(tx, ty, 18 + z * 90, 0, TAU); k.stroke(); }
        const pl = out3(seg(u, 4.0, 4.3));
        if (pl > 0) { ga(1); k.strokeStyle = C.mag; k.lineWidth = 1; k.beginPath(); k.moveTo(tx + 14, ty - 14); k.lineTo(tx + 14 + 30 * pl, ty - 44 * pl); k.lineTo(tx + 14 + 64 * pl, ty - 44 * pl); k.stroke(); ga(pl); txt(k, 'TGT-03', tx + 46, ty - 47, `700 8px ${MONO}`, C.hot); }
        if (d < 0.3) { ga(0.35 * Math.exp(-d * 14)); k.fillStyle = C.hot; k.fillRect(0, 0, CW, CH); }
      }
    }
    // 右面板：标题、打字机日志、读数、锁定标题
    const RXp = 396;
    ga(pr(1.15, 0.3)); txt(k, '隼眼-9 · 轨道光学系统', RXp, 19, `600 9px ${SANS}`, AC);
    k.fillStyle = C.dim; k.fillRect(RXp, 24, 136 * pr(1.15, 0.5), 0.8);
    let lastI = -1;
    HUD_LOG.forEach(([t0], i) => { if (u >= t0) lastI = i; });
    HUD_LOG.forEach(([t0, s, ok], i) => {
      if (u < t0) return;
      const n = Math.min(s.length, Math.floor((u - t0) * 45)), y = 36 + i * 10;
      ga(1); txt(k, s.slice(0, n), RXp, y, `500 7.5px ${MONO}`, i === 5 ? C.mag : i >= 3 ? C.hot : C.cya);
      if (n === s.length && ok) txt(k, ok, 532, y, `700 7.5px ${MONO}`, C.cya, 'right');
      if (i === lastI && Math.floor(u * 4) % 2 === 0) { k.font = `500 7.5px ${MONO}`; const x = RXp + k.measureText(s.slice(0, n)).width + 1; k.fillStyle = AC; k.fillRect(x, y - 6, 4, 7); }
    });
    HUD_DATA.forEach(([lab, v, dp, unit], i) => {
      const t0 = 1.2 + i * 0.25; if (u < t0 - 0.3) return;
      const y = 104 + i * 11, rolling = u >= t0 && u < t0 + 4 / 30;
      ga(seg(u, t0 - 0.3, t0 - 0.1)); txt(k, lab, RXp, y, `600 7.5px ${MONO}`, C.dim);
      let s;
      if (u < t0) s = '---.--';
      else if (rolling) s = (hash(Math.floor(u * 30) * 7 + i) * 999).toFixed(dp);
      else s = (v + (lab === 'ALT' ? 0.02 * Math.sin(u * 3) : 0)).toFixed(dp);
      txt(k, s + ' ' + unit, 532, y, `600 8px ${MONO}`, rolling ? C.hot : AC, 'right');
    });
    if (!lock) {
      if (u > 1.98) { ga(Math.floor(u * 3) % 2 ? 0.45 : 1); txt(k, '扫描中 · SCANNING', RXp, 178, `600 9px ${SANS}`, C.cya); }
    } else {
      const e = out3(seg(u, HUD_LOCK, HUD_LOCK + 0.15));
      ga(e); txt(k, 'TARGET LOCKED', RXp, 162, `800 10px ${DISP}`, C.hot);
      ga(0.55 * e); txt(k, '目标锁定', RXp - 1.5, 186, `900 22px ${SANS}`, C.cya); txt(k, '目标锁定', RXp + 1.5, 186, `900 22px ${SANS}`, C.hot);
      ga(e); txt(k, '目标锁定', RXp, 186, `900 22px ${SANS}`, C.mag);
      if (u > 4.2) { const s = 'N31°14′ E121°29′', n = Math.min(s.length, Math.floor((u - 4.2) * 30)); ga(1); txt(k, s.slice(0, n), RXp, 200, `600 8.5px ${MONO}`, C.hot); }
    }
    // 扫描线（常量图层，全程覆盖）
    k.globalAlpha = 1;
    k.drawImage(layer('HUD_scan', g => { g.fillStyle = 'rgba(0,0,0,0.22)'; for (let y = 0; y < CH; y += 3) g.fillRect(0, y, CW, 1); }), 0, 0);
  };

  // @element 11
  // 11 复古 80s Synthwave / VHS（10-synthwave「NEON DRIVE / Midnight」）：深紫夜空 #060212→#751266 与星空，条纹落日（#fff59e→#ff3d8f 五段渐变，下半部横向镂空条带自上而下变宽 0→58%，每周期下移 8 格），线框群山 #ff49d6 描边，品红 #FF29D1 一点透视网格双层辉光向镜头滚动（每周期 12 格），两侧棕榈剪影每 3.2 秒交替掠过；0.1–1.15 秒 VHS「PLAY ▶」OSD，1.2 秒铬字 NEON DRIVE 从 2.1 倍砸下（0.13 秒）带镜头光斑与白闪，1.8–2.4 秒高光扫过，2.6–3.4 秒粉色霓虹「Midnight」逐字点亮、3.4 秒按原片 8 帧频闪点燃；RGB 色偏 ±2.5px、2px 扫描线，0.37/2.47/4.6 秒各 2 帧磁带抖动错位；5.4–6.0 秒字幕淡出，背景按整数格循环
  const SYN_SKY = [[0, '#060212'], [0.45, '#1A063D'], [0.8, '#4D0D66'], [1, '#751266']];
  const SYN_SUN = ['#fff59e', '#ffdb5c', '#ff9e38', '#ff6647', '#ff3d8f'];
  const SYN_HZ = 122, SYN_VX = 270;
  const SYN_GLITCH = [0.37, 2.47, 4.6];
  const SYN_STRIKE = [1, 0.15, 1, 1, 0.08, 0.5, 0.85, 1];
  // 棕榈剪影：先描一圈品红轮廓光，再压深色本体；40 单位 = 1 个世界单位
  function SYN_palm(k, x, yb, S, side, a) {
    if (a <= 0) return;
    k.save(); k.globalAlpha = a; k.translate(x, yb); k.scale(S / 40, S / 40); k.lineCap = 'round';
    const tx = -side * 14, ty = -120;
    for (const [col, extra] of [['rgba(255,60,185,0.85)', 3], ['#0a0118', 0]]) {
      k.strokeStyle = col; k.lineWidth = 7 + extra; k.beginPath(); k.moveTo(0, 0); k.quadraticCurveTo(side * 8, -60, tx, ty); k.stroke();
      k.lineWidth = 4 + extra;
      for (let i = 0; i < 7; i++) {
        const a0 = -Math.PI + i * Math.PI / 6, L = 42 + 10 * Math.sin(i * 1.7);
        k.beginPath(); k.moveTo(tx, ty); k.quadraticCurveTo(tx + Math.cos(a0) * L * 0.6, ty + Math.sin(a0) * L * 0.6 - 12, tx + Math.cos(a0) * L, ty + Math.sin(a0) * L * 0.5 + 20); k.stroke();
      }
    }
    k.restore();
  }
  // 铬字标题 + 霓虹手写字（磁带抖动时会在错位条带里重画一次）
  function SYN_title(k, u, a) {
    if (u < 1.2 || a <= 0) return;
    const ps = seg(u, 1.2, 1.33), s = ps < 1 ? mix(2.1, 1, out3(ps)) : 1 + 0.03 * Math.exp(-(u - 1.33) * 10) * Math.sin((u - 1.33) * 40);
    const T = 'NEON DRIVE';
    k.save(); k.globalAlpha = a * clamp(ps * 3); k.translate(270, 68); k.scale(s, s); k.transform(1, 0, -0.22, 1, 0, 0);
    k.font = `italic 900 44px ${DISP}`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.lineJoin = 'round';
    k.fillStyle = 'rgba(255,0,60,0.55)'; k.fillText(T, -2.5, 0); k.fillStyle = 'rgba(0,220,255,0.55)'; k.fillText(T, 2.5, 0);
    k.strokeStyle = 'rgba(255,0,176,0.3)'; k.lineWidth = 14; k.strokeText(T, 0, 0);
    k.strokeStyle = '#ff49d6'; k.lineWidth = 9; k.strokeText(T, 0, 0);
    k.strokeStyle = '#0a0014'; k.lineWidth = 6; k.strokeText(T, 0, 0);
    const rim = k.createLinearGradient(0, -20, 0, 20);
    [[0, '#ffffff'], [0.22, '#8ea4dc'], [0.47, '#ffffff'], [0.53, '#3a1830'], [0.78, '#ffab66'], [1, '#fff4e0']].forEach(([o, c]) => rim.addColorStop(o, c));
    k.strokeStyle = rim; k.lineWidth = 2.4; k.strokeText(T, 0, 0);
    const fill = k.createLinearGradient(0, -17, 0, 17);
    [[0, '#0b1a4d'], [0.12, '#1d4fae'], [0.3, '#5fb8ff'], [0.44, '#d8f6ff'], [0.494, '#ffffff'], [0.506, '#2b0a26'], [0.56, '#5a1438'], [0.7, '#c2452f'], [0.84, '#ff9a3c'], [0.94, '#ffd98a'], [1, '#fff6dc']].forEach(([o, c]) => fill.addColorStop(o, c));
    k.fillStyle = fill; k.fillText(T, 0, 0);
    const gp = seg(u, 1.8, 2.4);
    if (gp > 0 && gp < 1) {
      const gx = mix(-180, 180, gp), gg = k.createLinearGradient(gx - 24, 0, gx + 24, 0);
      gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(0.5, 'rgba(255,255,255,0.95)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
      k.fillStyle = gg; k.fillText(T, 0, 0);
    }
    k.restore();
    // 星芒：高光扫到 80% 时在字顶闪一下
    const sk = Math.max(0, 1 - Math.abs(gp - 0.8) / 0.12);
    if (sk > 0) {
      k.save(); k.globalAlpha = a * sk; k.translate(mix(90, 450, 0.8) - 6, 50); k.fillStyle = '#ffffff';
      k.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 1.6 : 13 * sk, an = i * Math.PI / 4; i ? k.lineTo(Math.cos(an) * r, Math.sin(an) * r) : k.moveTo(r, 0); } k.closePath(); k.fill(); k.restore();
    }
    // 霓虹 Midnight：2.6–3.4 逐字点亮（半亮），3.4 起 8 帧频闪后全亮
    const pm = seg(u, 2.6, 3.4);
    if (pm > 0) {
      let fl = 1; if (u < 3.4) fl = 0.6; else { const i = Math.floor((u - 3.4) * 30); if (i < 8) fl = SYN_STRIKE[i]; }
      k.save(); k.globalAlpha = a * fl; k.translate(378, 106); k.rotate(-0.12);
      k.font = `italic 700 30px ${SERIF}`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.lineJoin = 'round';
      const tw = k.measureText('Midnight').width;
      k.beginPath(); k.rect(-tw / 2 - 8, -30, (tw + 16) * pm, 60); k.clip();
      k.strokeStyle = 'rgba(255,20,170,0.35)'; k.lineWidth = 8; k.strokeText('Midnight', 0, 0);
      k.strokeStyle = '#ff3dcf'; k.lineWidth = 2.6; k.strokeText('Midnight', 0, 0);
      k.fillStyle = '#fff0fb'; k.fillText('Midnight', 0, 0);
      k.restore();
    }
  }
  CELLS[10] = (k, w, h, u) => {
    const HZ = SYN_HZ, VX = SYN_VX, F = fadeIn(u);
    k.globalAlpha = 1; k.fillStyle = '#060212'; k.fillRect(0, 0, CW, CH);
    k.drawImage(layer('SYN_sky', g => {
      const sg = g.createLinearGradient(0, 0, 0, HZ); SYN_SKY.forEach(([o, c]) => sg.addColorStop(o, c));
      g.fillStyle = sg; g.fillRect(0, 0, CW, HZ);
      for (let i = 0; i < 90; i++) { const big = hash(i + 5) > 0.85 ? 1.6 : 1; g.fillStyle = `rgba(242,230,255,${0.25 + 0.6 * hash(i + 77)})`; g.fillRect(hash(i * 2 + 31) * CW, hash(i * 2 + 32) * (HZ - 30), big, big); }
      const fg = g.createLinearGradient(0, HZ, 0, CH); fg.addColorStop(0, '#2a0838'); fg.addColorStop(0.25, '#170326'); fg.addColorStop(1, '#05000D');
      g.fillStyle = fg; g.fillRect(0, HZ, CW, CH - HZ);
    }), 0, 0);
    // 闪烁星：每颗整数圈
    for (let i = 0; i < 8; i++) { const a = 0.5 + 0.5 * Math.sin(TAU * u / CYC * (2 + i % 3) + i * 1.3); k.fillStyle = `rgba(255,240,255,${a})`; k.fillRect(hash(i + 300) * CW, hash(i + 340) * 70, 1.8, 1.8); }
    // 条纹落日
    const SX = VX, SY = 92, SR = 58;
    glow(k, SX, SY, 130, '255,71,133', 0.35);
    k.save(); k.beginPath(); k.rect(0, 0, CW, HZ); k.clip();
    const sunG = k.createLinearGradient(0, SY - SR, 0, SY + SR); SYN_SUN.forEach((c, i) => sunG.addColorStop(i / 4, c));
    k.fillStyle = sunG; k.beginPath(); k.arc(SX, SY, SR, 0, TAU); k.fill();
    const y0 = SY - 6, P = 9, ph = (u / CYC * 8) % 1;
    const gapG = k.createLinearGradient(0, y0, 0, HZ); gapG.addColorStop(0, '#4D0D66'); gapG.addColorStop(1, '#d838b0');
    k.fillStyle = gapG;
    for (let j = -1; j < 8; j++) { const yc = y0 + (j + ph) * P; if (yc < y0) continue; const gh = 0.58 * P * clamp((yc - y0) / (HZ - y0)) + 0.6; k.fillRect(SX - SR - 2, yc - gh / 2, SR * 2 + 4, gh); }
    k.restore();
    const hz = k.createLinearGradient(0, HZ - 40, 0, HZ); hz.addColorStop(0, 'rgba(255,71,180,0)'); hz.addColorStop(1, 'rgba(255,130,210,0.45)');
    k.fillStyle = hz; k.fillRect(0, HZ - 40, CW, 40);
    // 线框群山（静态图层）
    k.drawImage(layer('SYN_mtn', g => {
      const ridge = x => { const e = Math.pow(clamp(Math.abs(x - VX) / 250), 1.3); return HZ - (6 + 46 * e * (0.55 + 0.45 * fbm2(x / 38, 2.5, 3)) + 6 * fbm2(x / 9, 7.1, 2)); };
      g.beginPath(); g.moveTo(0, HZ); for (let x = 0; x <= CW; x += 3) g.lineTo(x, ridge(x)); g.lineTo(CW, HZ); g.closePath();
      const mg = g.createLinearGradient(0, HZ - 60, 0, HZ); mg.addColorStop(0, '#2a0f4a'); mg.addColorStop(1, '#0e0420'); g.fillStyle = mg; g.fill();
      g.strokeStyle = 'rgba(255,73,214,0.28)'; g.lineWidth = 0.8;
      for (const f of [0.66, 0.33]) { g.beginPath(); for (let x = 0; x <= CW; x += 3) { const y = HZ - (HZ - ridge(x)) * f; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
      g.beginPath(); for (let x = 0; x <= CW; x += 12) { g.moveTo(x, ridge(x)); g.lineTo(x + (x - VX) * 0.05, HZ); } g.stroke();
      g.strokeStyle = '#ff49d6'; g.lineWidth = 1.3; g.beginPath(); for (let x = 0; x <= CW; x += 3) x ? g.lineTo(x, ridge(x)) : g.moveTo(x, ridge(x)); g.stroke();
    }), 0, 0);
    // 透视网格：横线深度 dd，屏幕 y = HZ + 86/dd；每周期滚动 12 格
    glow(k, VX, HZ + 6, 120, '255,90,170', 0.25);
    k.save(); k.beginPath(); k.rect(0, HZ, CW, CH - HZ); k.clip();
    k.beginPath(); for (let X = -14; X <= 14; X++) { k.moveTo(VX, HZ); k.lineTo(VX + X * 46, CH); }
    k.strokeStyle = 'rgba(255,41,209,0.28)'; k.lineWidth = 3; k.stroke(); k.strokeStyle = '#FF29D1'; k.lineWidth = 1; k.stroke();
    const ph2 = (u / CYC * 12) % 1;
    for (let i = 1; i < 62; i++) {
      const dd = (i - ph2) * 0.5; if (dd < 0.4) continue;
      const y = HZ + 86 / dd; if (y > CH + 2) continue;
      const a = 0.15 + 0.85 * clamp((y - HZ) / 25);
      k.fillStyle = `rgba(255,41,209,${0.28 * a})`; k.fillRect(0, y - 1.5, CW, 3);
      k.fillStyle = `rgba(255,41,209,${a})`; k.fillRect(0, y - 0.5, CW, 1);
    }
    k.restore();
    k.fillStyle = '#ffd1f5'; k.fillRect(0, HZ - 0.8, CW, 1.6);
    // 棕榈：左右交替，每 3.2 秒一棵（每周期 2 棵/侧）
    for (const [side, off] of [[-1, 0], [1, 0.5]]) {
      const p = (u / 3.2 + off) % 1, z = 14 - 13.6 * p, S = 86 / z;
      SYN_palm(k, VX + side * 2.7 * S, HZ + S, S, side, seg(p, 0, 0.12));
    }
    // 标题（白闪 + 横向光斑）
    if (u >= 1.33 && F > 0) {
      const d = u - 1.33;
      k.globalAlpha = F * 0.5 * Math.exp(-d * 9); k.fillStyle = '#ffebfa'; k.fillRect(0, 0, CW, CH);
      k.globalAlpha = F * (0.25 + 0.6 * Math.exp(-d * 4)); glow(k, 270, 68, 90, '255,120,220', 0.6);
      const fl = k.createLinearGradient(0, 0, CW, 0); fl.addColorStop(0, 'rgba(160,220,255,0)'); fl.addColorStop(0.5, 'rgba(230,245,255,0.9)'); fl.addColorStop(1, 'rgba(160,220,255,0)');
      k.fillStyle = fl; k.fillRect(0, 67, CW, 2);
      k.globalAlpha = 1;
    }
    SYN_title(k, u, F);
    // VHS OSD
    if (u >= 0.1 && u < 1.15) { txt(k, 'PLAY ▶', 18, 28, `700 14px ${MONO}`, 'rgba(0,0,0,0.85)'); txt(k, 'PLAY ▶', 16, 26, `700 14px ${MONO}`, '#f4f4ff'); }
    // 磁带抖动：2 帧错位条带 + 噪声横纹
    for (const g0 of SYN_GLITCH) if (u >= g0 && u < g0 + 2 / 30) {
      const f = Math.floor(u * 30), by = 30 + hash(f * 3 + 1) * 130, bh = 10 + hash(f * 3 + 2) * 12;
      k.save(); k.beginPath(); k.rect(0, by, CW, bh); k.clip(); k.fillStyle = 'rgba(10,1,24,0.6)'; k.fillRect(0, by, CW, bh);
      k.translate(10 * (hash(f) - 0.3), 0); SYN_title(k, u, F); k.restore();
      for (let i = 0; i < 14; i++) { k.fillStyle = `rgba(255,255,255,${0.2 + 0.5 * hash(f * 31 + i)})`; k.fillRect(hash(f * 17 + i) * CW, by + hash(f * 13 + i) * bh, 20 + hash(f * 7 + i) * 90, 1); }
    }
    k.drawImage(layer('SYN_vhs', g => {
      g.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 0; y < CH; y += 2) g.fillRect(0, y, CW, 1);
      const v = g.createRadialGradient(270, 104, 120, 270, 104, 330); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)'); g.fillStyle = v; g.fillRect(0, 0, CW, CH);
    }), 0, 0);
  };

  // @element 12
  // 12 像素风（20-pixel「PIXEL QUEST 像素冒险」）：108×42 低分辨率离屏画面按 5 倍最近邻放大，QUEST-32 色板（#0d0b1a #4f6fc0 #8cc8f5 #d23c3c #ffd166 #4fae4a #8a5236 …），Bayer 4×4 抖动天空；精灵与卷轴按每周期 48 帧（7.5fps）阶梯时序、标志按 8fps：红兜帽主角 6 帧跑步循环，远山/树丛/地砖三层视差按 1/4、1/2、1 整像素卷动（地面每周期 192 像素一圈），途中跳起吃 3 枚弧形金币（闪光）、跳踩粉色史莱姆（压扁 + 烟团）、再跑过 3 枚地面金币；0.4 秒块状像素标志 PIXEL QUEST 8fps 落下回弹，1.1 秒「像素冒险」逐字出现，1.5/3.5 秒高光斜扫，5.4 秒标志阶梯式上飞退场；CRT 每行扫描线 + 暗角
  const PIX_W = 108, PIX_H = 42, PIX_GY = 34, PIX_TRACK = 192;
  const PIX_C = { k: '#0d0b1a', w: '#ffffff', r: '#d23c3c', R: '#7a1f2e', s: '#ffc9a0', S: '#e8b27c', b: '#4f6fc0', B: '#3d4a8a', y: '#ffd166', Y: '#f59a4a', u: '#fff3b0', l: '#8a5236', L: '#5a3326', e: '#2b1a1f', p: '#b0415f', P: '#6b2d5c', o: '#e8665a' };
  const PIX_CACHE = {};
  const PIX_LR = (() => { const c = document.createElement('canvas'); c.width = PIX_W; c.height = PIX_H; return c; })();   // 每帧整张重画的低分辨率画布
  // 字符行 → 小画布（可选 1px 深色描边），按 key 缓存
  function PIX_bake(key, rows, outline = true) {
    if (PIX_CACHE[key]) return PIX_CACHE[key];
    const o = outline ? 1 : 0, w0 = Math.max(...rows.map(r => r.length)), W = w0 + 2 * o, H = rows.length + 2 * o;
    const at = (x, y) => { const r = rows[y - o]; const ch = r ? r[x - o] : undefined; return ch && ch !== '.' ? ch : null; };
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let ch = at(x, y);
      if (!ch && outline && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))) ch = 'k';
      if (ch) { g.fillStyle = PIX_C[ch]; g.fillRect(x, y, 1, 1); }
    }
    return (PIX_CACHE[key] = c);
  }
  const PIX_HEAD = ['..rrrrr..', '.rrrrrrr.', 'rrrRRRRrr', 'rRRsssssS', 'rRsssksk.', 'rRsssssS.', '.R.ssss..', '...ss....'];
  const PIX_RUN = [
    { bob: 0, bf: [-3, 3], ff: [3, 4], bh: [3, 1], fh: [-2, 2] },
    { bob: 1, bf: [-3, 2], ff: [1, 4], bh: [2, 2], fh: [-1, 3] },
    { bob: 0, bf: [0, 2], ff: [-1, 4], bh: [0, 3], fh: [1, 3] },
    { bob: 0, bf: [3, 4], ff: [-3, 3], bh: [-2, 2], fh: [3, 1] },
    { bob: 1, bf: [1, 4], ff: [-3, 2], bh: [-1, 3], fh: [2, 2] },
    { bob: 0, bf: [-1, 4], ff: [0, 2], bh: [1, 3], fh: [0, 3] },
  ];
  const PIX_AIR = { bob: 0, bf: [-2, 2], ff: [2, 3], bh: [-3, -2], fh: [3, -3] };
  // 主角精灵：头身固定，四肢按姿势用 Bresenham 线段画出（13×16，描边后 15×18）
  function PIX_hero(fr, air) {
    const key = 'hero' + fr + (air ? 'a' : '');
    if (PIX_CACHE[key]) return PIX_CACHE[key];
    const P = air ? PIX_AIR : PIX_RUN[fr], W = 13, H = 16, g = Array.from({ length: H }, () => Array(W).fill('.'));
    const put = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c; };
    const line = (x0, y0, x1, y1, c) => { const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (let n = 0; n < 40; n++) { put(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } };
    const b = P.bob;
    line(5, 8 + b, 5 + P.bh[0], 8 + b + P.bh[1], 'B'); put(5 + P.bh[0], 8 + b + P.bh[1], 'S');
    line(5, 11 + b, 5 + P.bf[0], 11 + P.bf[1], 'L'); put(5 + P.bf[0], 11 + P.bf[1], 'e'); put(6 + P.bf[0], 11 + P.bf[1], 'e');
    for (let x = 4; x <= 8; x++) { put(x, 8 + b, 'b'); put(x, 9 + b, x === 8 ? 'B' : 'b'); put(x, 10 + b, x === 6 ? 'u' : 'y'); }
    line(7, 11 + b, 7 + P.ff[0], 11 + P.ff[1], 'l'); put(7 + P.ff[0], 11 + P.ff[1], 'e'); put(8 + P.ff[0], 11 + P.ff[1], 'e');
    PIX_HEAD.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') put(2 + i, j + b, r[i]); });
    line(7, 8 + b, 7 + P.fh[0], 8 + b + P.fh[1], 'b'); put(7 + P.fh[0], 8 + b + P.fh[1], 's');
    return PIX_bake(key, g.map(r => r.join('')));
  }
  const PIX_COIN = [['.yyyy.', 'uyyyyY', 'uyYYyY', 'uyYYyY', 'uyYYyY', 'uyYYyY', 'uyyyYY', '.YYYY.'], ['.yy.', 'uyyY', 'uyYY', 'uyYY', 'uyYY', 'uyYY', 'uyyY', '.YY.'], ['uY', 'uY', 'uY', 'uY', 'uY', 'uY', 'uY', 'uY'], ['.yy.', 'Yyyu', 'YYyu', 'YYyu', 'YYyu', 'YYyu', 'Yyyu', '.YY.']];
  const PIX_SLIME = [['....pppp....', '..pppppppp..', '.pwwpppppppP', '.pwppkppkppP', 'pppppkppkpPP', 'ppppppppppPP', 'PpppppppppPP', '.PPPPPPPPPP.'], ['...pppppp...', '.pwwppppppP.', 'pwpppkppkppP', 'pppppkppkpPP', 'PpppppppppPP', '.PPPPPPPPPP.'], ['..pppppppp..', 'ppkkpppkkppP', '.PPPPPPPPPP.']];
  const PIX_SPARK = [['.u.', 'uwu', '.u.'], ['..w..', '..u..', 'wuwuw', '..u..', '..w..'], ['...w...', '...u...', '...u...', 'wuuwuuw', '...u...', '...u...', '...w...']];
  const PIX_PUFF = [['.ww.', 'wwww', 'wwww', '.ww.'], ['..ww..', '.wwwww', 'ww..ww', '.wwww.'], ['.w..w.', 'w....w', '.w..w.']];
  const PIX_FONT = { P: ['111', '101', '111', '100', '100'], I: ['111', '010', '010', '010', '111'], X: ['101', '101', '010', '101', '101'], E: ['111', '100', '110', '100', '111'], L: ['100', '100', '100', '100', '111'], Q: ['111', '101', '101', '110', '011'], U: ['101', '101', '101', '101', '111'], S: ['111', '100', '111', '001', '111'], T: ['111', '010', '010', '010', '010'], ' ': ['000', '000', '000', '000', '000'] };
  // 标志：3×5 点阵字 2 倍放大、上黄下橙，sx 为高光斜带位置（按位置缓存）
  function PIX_logo(sx) {
    const key = 'logo' + sx; if (PIX_CACHE[key]) return PIX_CACHE[key];
    const text = 'PIXEL QUEST', W = text.length * 8 - 2, rows = [];
    for (let y = 0; y < 10; y++) {
      let r = '';
      for (let x = 0; x < W; x++) {
        const ci = Math.floor(x / 8), cx = x % 8; let on = false;
        if (cx < 6) on = PIX_FONT[text[ci]][Math.floor(y / 2)][Math.floor(cx / 2)] === '1';
        let col = y < 1 ? 'u' : y < 5 ? 'y' : y < 8 ? 'Y' : 'o';
        if (on && x - y * 0.5 >= sx && x - y * 0.5 < sx + 2) col = 'w';
        r += on ? col : '.';
      }
      rows.push(r);
    }
    return PIX_bake(key, rows);
  }
  // 静态底图：抖动天空 + 太阳 + 云；远山（48 像素一周期）；树丛（96）；地砖（16）
  function PIX_tiles() {
    if (PIX_CACHE.tiles) return PIX_CACHE.tiles;
    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
    const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const [sky, gs] = mk(PIX_W, PIX_GY), stops = [[0, '#4f6fc0'], [10, '#5b9bea'], [20, '#8cc8f5'], [30, '#c8ecff'], [34, '#c8ecff']];
    for (let y = 0; y < PIX_GY; y++) for (let x = 0; x < PIX_W; x++) {
      let i = 0; while (i < stops.length - 2 && y >= stops[i + 1][0]) i++;
      const t = (y - stops[i][0]) / (stops[i + 1][0] - stops[i][0]), th = (BAY[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
      gs.fillStyle = t > th ? stops[i + 1][1] : stops[i][1]; gs.fillRect(x, y, 1, 1);
    }
    for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) { const d = x * x + y * y; if (d <= 25) { gs.fillStyle = d <= 12 ? '#fff3b0' : '#ffd166'; gs.fillRect(96 + x, 19 + y, 1, 1); } }
    for (const [cx, cy, n] of [[8, 16, 9], [62, 25, 7]]) { gs.fillStyle = '#ffffff'; gs.fillRect(cx, cy, n * 2, 3); gs.fillRect(cx + 3, cy - 2, n, 2); gs.fillRect(cx + 5, cy - 3, 4, 1); gs.fillStyle = '#b8c2d9'; gs.fillRect(cx + 1, cy + 3, n * 2 - 2, 1); }
    const [far, gf] = mk(48, PIX_GY);
    for (const [px, ph, hw] of [[12, 15, 13], [35, 10, 11]]) for (let x = px - hw; x <= px + hw; x++) {
      const top = PIX_GY - 1 - Math.floor(ph * (1 - Math.abs(x - px) / hw));
      for (let y = top; y < PIX_GY; y++) { const xx = (x + 48) % 48; gf.fillStyle = y < top + 2 && ph - (PIX_GY - 1 - top) < 3 ? '#c8ecff' : x < px ? '#8cc8f5' : '#5b9bea'; gf.fillRect(xx, y, 1, 1); }
    }
    const [mid, gm] = mk(96, PIX_GY);
    for (let x = 0; x < 96; x++) {
      const top = Math.floor(25 - 4 * Math.abs(Math.sin(Math.PI * x / 12)) - 2 * Math.sin(TAU * x / 32));
      gm.fillStyle = '#1d4a3a'; gm.fillRect(x, top, 1, PIX_GY - top); gm.fillStyle = '#2e7a45'; gm.fillRect(x, top, 1, 1);
      if (x % 12 === 6) { gm.fillRect(x - 1, top + 1, 1, 1); gm.fillRect(x + 1, top + 1, 1, 1); }
    }
    const [gr, gg] = mk(16, PIX_H - PIX_GY);
    gg.fillStyle = '#8a5236'; gg.fillRect(0, 0, 16, 8); gg.fillStyle = '#93d65a'; gg.fillRect(0, 0, 16, 1); gg.fillStyle = '#4fae4a'; gg.fillRect(0, 1, 16, 1);
    gg.fillRect(3, 2, 1, 1); gg.fillRect(11, 2, 1, 1); gg.fillStyle = '#5a3326'; gg.fillRect(0, 4, 16, 1); gg.fillRect(7, 2, 1, 2); gg.fillRect(15, 5, 1, 3);
    gg.fillStyle = '#c07a45'; gg.fillRect(2, 5, 3, 1); gg.fillRect(9, 2, 3, 1);
    const [zh, gz] = mk(40, 11); gz.font = `700 8px ${SANS}`; gz.textBaseline = 'top'; gz.lineJoin = 'round'; gz.strokeStyle = '#0d0b1a'; gz.lineWidth = 2; gz.strokeText('像素冒险', 2, 1.5); gz.fillStyle = '#fff3b0'; gz.fillText('像素冒险', 2, 1.5);
    return (PIX_CACHE.tiles = { sky, far, mid, gr, zh });
  }
  // 跳跃高度：按主角在 192 像素赛道上的位置 c（整像素）给出
  function PIX_lift(c) {
    if (c >= 48 && c < 78) { const p = (c - 48) / 30; return Math.floor(44 * p * (1 - p)); }
    if (c >= 110 && c < 138) { const p = (c - 110) / 28; return Math.floor(48 * p * (1 - p)); }
    if (c >= 138 && c < 150) { const p = (c - 138) / 12; return Math.floor(24 * p * (1 - p)); }
    return 0;
  }
  CELLS[11] = (k, w, h, u) => {
    const T = PIX_tiles(), g = PIX_LR.getContext('2d');
    // 每周期整 48 帧（7.5fps，地面每帧 4 像素，跑步 6 帧/金币 4 帧都整除）；帧格以 u 为中心取整，u=0 与 u→6.4 落在同一帧
    const f = Math.floor(u / CYC * 48 + 0.5) % 48, pos = f * PIX_TRACK / 48, c = (pos + 31) % PIX_TRACK;
    g.clearRect(0, 0, PIX_W, PIX_H);
    g.drawImage(T.sky, 0, 0);
    const o1 = Math.floor(pos / 4) % 48; for (let x = -o1; x < PIX_W; x += 48) g.drawImage(T.far, x, 0);
    const o2 = Math.floor(pos / 2) % 96; for (let x = -o2; x < PIX_W; x += 96) g.drawImage(T.mid, x, 0);
    const o3 = pos % 16; for (let x = -o3; x < PIX_W; x += 16) g.drawImage(T.gr, x, PIX_GY);
    const sxOf = wx => { let s = wx - c + 31; while (s < -60) s += PIX_TRACK; while (s >= 132) s -= PIX_TRACK; return s; };
    // 金币：前 3 枚沿第一跳弧线，后 3 枚贴地；被吃后 3 帧闪光
    const coins = [[58, PIX_GY - 10 - PIX_lift(58)], [65, PIX_GY - 10 - PIX_lift(65)], [72, PIX_GY - 10 - PIX_lift(72)], [160, PIX_GY - 9], [167, PIX_GY - 9], [174, PIX_GY - 9]];
    coins.forEach(([wx, cy], i) => {
      const dd = (c - wx + PIX_TRACK) % PIX_TRACK, sx = sxOf(wx);
      if (dd < 9) { const sp = PIX_bake('sp' + Math.floor(dd / 3), PIX_SPARK[Math.floor(dd / 3)], false); g.drawImage(sp, Math.floor(sx - sp.width / 2), Math.floor(cy - sp.height / 2)); }
      else if (dd >= 60) { const fi = (f + i) % 4, cn = PIX_bake('coin' + fi, PIX_COIN[fi]); g.drawImage(cn, Math.floor(sx - cn.width / 2), cy - 5); }
    });
    // 史莱姆（赛道 140）：被踩 → 压扁 4 像素 → 烟团 3 帧 → 消失直到出画
    const sd = (c - 138 + PIX_TRACK) % PIX_TRACK, ssx = sxOf(140);
    if (sd < 4) { const s = PIX_bake('slf', PIX_SLIME[2]); g.drawImage(s, Math.floor(ssx - 7), PIX_GY - s.height); }
    else if (sd < 13) { const pi = Math.floor((sd - 4) / 3), s = PIX_bake('pf' + pi, PIX_PUFF[pi], false); g.drawImage(s, Math.floor(ssx - s.width / 2), PIX_GY - 6 - s.height); }
    else if (sd >= 39) { const si = Math.floor(u * 4) % 2, s = PIX_bake('sl' + si, PIX_SLIME[si]); g.drawImage(s, Math.floor(ssx - 7), PIX_GY - s.height); }
    // 主角
    const lift = PIX_lift(c), hero = PIX_hero(f % 6, lift > 0);
    g.drawImage(hero, 24, PIX_GY - 17 - lift);
    // 标志：0.4 秒起 8fps 落下回弹；5.4 秒起阶梯上飞
    const DROP = [-14, -9, -4, 1, 4, 2, 3];
    let ly = null; const fl = Math.floor((u - 0.4) * 8 + 1e-6), fo = Math.floor((u - SHOW) * 8 + 1e-6);
    if (fl >= 0) ly = DROP[Math.min(fl, DROP.length - 1)];
    if (fo >= 0) ly = [3, 1, -3, -9, -16][Math.min(fo, 4)];
    if (ly !== null && ly > -15) {
      let sx = -99;
      for (const s0 of [1.5, 3.5]) { const q = Math.floor((u - s0) * 8 + 1e-6); if (q >= 0 && q < 8) sx = q * 13 - 6; }
      g.drawImage(PIX_logo(sx), 10, ly);
      const n = Math.min(4, Math.floor((u - 1.1) * 8 + 1e-6) + 1);
      if (n > 0) g.drawImage(T.zh, 0, 0, 2 + n * 9, 11, 34, ly + 12, 2 + n * 9, 11);
    }
    // 最近邻放大 5 倍 + CRT 扫描线
    k.globalAlpha = 1; k.fillStyle = '#0d0b1a'; k.fillRect(0, 0, CW, CH);
    k.save(); k.imageSmoothingEnabled = false; k.drawImage(PIX_LR, 0, 0, PIX_W * 5, PIX_H * 5); k.restore();
    k.drawImage(layer('PIX_crt', q => {
      q.fillStyle = 'rgba(0,0,0,0.2)'; for (let y = 4; y < CH; y += 5) q.fillRect(0, y, CW, 1);
      const v = q.createRadialGradient(270, 104, 150, 270, 104, 330); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.4)'); q.fillStyle = v; q.fillRect(0, 0, CW, CH);
    }), 0, 0);
  };

  // @element 13
  // 13 拼贴剪贴（06-collage「NOGGIN 脑洞季刊 · THE MIND IS A COLLAGE」）：牛皮纸底 + 等宽刊头，全部元素是代码画的剪纸（2×预渲染，米白 #F2ECDF 剪刀白边 + 投影 + 墨色 #16130F 半调网点）；12fps 定格节奏：0.25 秒维多利亚绅士头像剪纸「啪」地拍下（1.3→1.12→0.96→1 四帧），0.45 秒红色构成主义圆盘 #D2261C，0.65 秒报纸碎片；1.5 秒头顶沿锯齿剪口像盖子翻开（6 帧翻到 −106°），POP 爆炸纸片 3 帧，1.58–2.25 秒星星、土星、火箭、燕子、玫瑰依次沿 12fps 抛物线从脑洞飞出；2.5–3.0 秒每 1/6 秒拍下一枚勒索信字块「脑 洞 大 开」，3.25 秒黑色撕纸横条 THE MIND IS A COLLAGE 滑入、3.33 秒红条、3.58 秒 Nº06 红签；静止时每 1/6 秒 ±1.2px/±0.9° 手摆抖动，火箭尾焰 3 张替换帧；5.4–6.0 秒一整张牛皮纸带撕边从右向左 12fps 盖过全页复位
  const COL_K = '#16130F', COL_PP = '#F2ECDF', COL_R = '#D2261C', COL_B = '#3F6FA8', COL_O = '#D6A945', COL_N = '#E4DAC4', COL_H = '#3C2608';
  const COL_BK = {};
  // 2 倍分辨率预渲染一个剪纸件；ax/ay 为锚点（局部原点）在件内的位置
  function COL_bake(name, wd, ht, ax, ay, draw) {
    if (!COL_BK[name]) { const c = document.createElement('canvas'); c.width = wd * 2; c.height = ht * 2; const g = c.getContext('2d'); g.scale(2, 2); g.translate(ax, ay); draw(g); COL_BK[name] = { c, w: wd, h: ht, ax, ay }; }
    return COL_BK[name];
  }
  // 剪纸：先带投影描米白剪刀边，再填本色
  function COL_cut(g, path, fill, rim = 3) {
    g.save(); g.shadowColor = 'rgba(22,19,15,0.38)'; g.shadowOffsetX = 5; g.shadowOffsetY = 6; g.shadowBlur = 6;
    path(g); g.fillStyle = rim ? COL_PP : fill; g.fill(); if (rim) { g.lineJoin = 'miter'; g.lineWidth = rim * 2; g.strokeStyle = COL_PP; g.stroke(); }
    g.restore(); path(g); g.fillStyle = fill; g.fill();
  }
  // 半调网点：在 path 内按 rf(x,y) 给出的半径画墨点
  function COL_dots(g, path, col, cell, rf, x0, y0, x1, y1) {
    g.save(); path(g); g.clip(); g.fillStyle = col; g.beginPath();
    for (let y = y0; y <= y1; y += cell) for (let x = x0 + ((y / cell) % 2 ? cell / 2 : 0); x <= x1; x += cell) { const r = rf(x, y); if (r > 0.2) { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); } }
    g.fill(); g.restore();
  }
  const COL_quad = (g, wd, ht, seed, j = 3) => { g.beginPath(); [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy], i) => { const x = sx * wd / 2 + (hash(seed * 9 + i) - 0.5) * j * 2, y = sy * ht / 2 + (hash(seed * 9 + i + 4) - 0.5) * j * 2; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); };
  const COL_torn = (g, wd, ht, seed) => { g.beginPath(); g.moveTo(-wd / 2, -ht / 2); for (let x = -wd / 2; x <= wd / 2; x += 6) g.lineTo(x, -ht / 2 + (hash(seed + x) - 0.5) * 4); for (let x = wd / 2; x >= -wd / 2; x -= 6) g.lineTo(x, ht / 2 + (hash(seed + 77 + x) - 0.5) * 4); g.closePath(); };
  // 头像剪口：横贯脸部的锯齿线（y≈-14），下半为脸、上半为可翻开的头盖
  const COL_ZIG = Array.from({ length: 13 }, (_, i) => [-29 + i * 58 / 12, -14 + (i % 2 ? 1.8 : -1.8)]);
  const COL_lowFace = g => { COL_ZIG.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); for (let t = -0.29; t <= Math.PI + 0.29; t += 0.1) g.lineTo(27 * Math.cos(t), -4 + 35 * Math.sin(t)); g.closePath(); };
  const COL_lidPath = g => { g.beginPath(); COL_ZIG.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); for (let t = -0.29; t >= -Math.PI + 0.29; t -= 0.1) g.lineTo(27 * Math.cos(t), -4 + 35 * Math.sin(t)); g.closePath(); };
  const COL_PIECES = {
    disc: () => COL_bake('disc', 176, 176, 88, 88, g => {
      const p = q => { q.beginPath(); for (let i = 0; i < 44; i++) { const a = i / 44 * TAU, r = 80 + (hash(i + 900) - 0.5) * 3; i ? q.lineTo(Math.cos(a) * r, Math.sin(a) * r) : q.moveTo(r, 0); } q.closePath(); };
      COL_cut(g, p, COL_R, 0); COL_dots(g, p, 'rgba(120,10,8,0.25)', 5, () => 1, -84, -84, 84, 84);
    }),
    head: () => COL_bake('head', 136, 136, 68, 48, g => {
      const all = q => { q.beginPath(); q.moveTo(-62, 90); q.lineTo(-58, 58); q.quadraticCurveTo(-50, 40, -18, 34); q.lineTo(18, 34); q.quadraticCurveTo(50, 40, 58, 58); q.lineTo(62, 90); q.closePath(); q.rect(-11, 12, 22, 26); COL_lowFace(q); q.ellipse(-27, 0, 5, 8, 0, 0, TAU); q.ellipse(27, 0, 5, 8, 0, 0, TAU); };
      COL_cut(g, all, COL_N, 3);
      g.beginPath(); g.moveTo(-62, 90); g.lineTo(-58, 58); g.quadraticCurveTo(-50, 40, -18, 34); g.lineTo(18, 34); g.quadraticCurveTo(50, 40, 58, 58); g.lineTo(62, 90); g.closePath(); g.fillStyle = COL_K; g.fill();
      g.beginPath(); g.moveTo(-14, 34); g.lineTo(14, 34); g.lineTo(0, 58); g.closePath(); g.fillStyle = COL_PP; g.fill();
      g.beginPath(); g.moveTo(-8, 38); g.lineTo(0, 42); g.lineTo(8, 38); g.lineTo(8, 46); g.lineTo(0, 42); g.lineTo(-8, 46); g.closePath(); g.fillStyle = COL_K; g.fill();
      const face = q => { q.beginPath(); COL_lowFace(q); q.rect(-11, 12, 22, 24); q.ellipse(-27, 0, 5, 8, 0, 0, TAU); q.ellipse(27, 0, 5, 8, 0, 0, TAU); };
      face(g); g.fillStyle = COL_N; g.fill();
      COL_dots(g, face, 'rgba(22,19,15,0.55)', 3.2, (x, y) => 1.5 * clamp(-x / 27 * 0.6 + (y + 4) / 35 * 0.45 + 0.15), -34, -16, 34, 40);
      g.fillStyle = COL_H;
      g.beginPath(); g.ellipse(-23, -1, 5, 13, 0.1, 0, TAU); g.ellipse(23, -1, 5, 13, -0.1, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(0, 10); g.quadraticCurveTo(-10, 6, -19, 14); g.quadraticCurveTo(-10, 12, 0, 15); g.quadraticCurveTo(10, 12, 19, 14); g.quadraticCurveTo(10, 6, 0, 10); g.fill();
      g.fillStyle = COL_K; g.beginPath(); g.ellipse(-10, -4, 3, 2, 0, 0, TAU); g.ellipse(10, -4, 3, 2, 0, 0, TAU); g.fill();
      g.strokeStyle = COL_H; g.lineWidth = 2; g.beginPath(); g.moveTo(-16, -9); g.lineTo(-5, -10); g.moveTo(5, -10); g.lineTo(16, -9); g.stroke();
      g.strokeStyle = 'rgba(22,19,15,0.6)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(1, -6); g.quadraticCurveTo(4, 4, -2, 7); g.stroke();
    }),
    lid: () => COL_bake('lid', 72, 48, 36, 46, g => {
      COL_cut(g, COL_lidPath, COL_N, 3);
      const hair = q => { COL_lidPath(q); };
      g.save(); COL_lidPath(g); g.clip(); g.fillStyle = COL_H; g.beginPath(); g.ellipse(0, -16, 31, 26, 0, Math.PI, TAU); g.rect(-31, -18, 6, 6); g.rect(25, -18, 6, 6); g.fill();
      g.fillStyle = COL_N; g.beginPath(); g.moveTo(-6, -40); g.lineTo(-4, -16); g.lineTo(-2, -40); g.fill(); g.restore();
      COL_dots(g, hair, 'rgba(242,236,223,0.35)', 3.2, (x, y) => 1.2 * clamp(0.6 - (x + 10) / 40 - (y + 30) / 60), -32, -42, 32, -12);
    }),
    cav: () => COL_bake('cav', 72, 48, 36, 46, g => {
      COL_lidPath(g); g.fillStyle = '#141a33'; g.fill();
      g.save(); COL_lidPath(g); g.clip();
      const ng = g.createRadialGradient(-6, -26, 2, -6, -26, 26); ng.addColorStop(0, 'rgba(63,111,168,0.9)'); ng.addColorStop(1, 'rgba(63,111,168,0)'); g.fillStyle = ng; g.fillRect(-36, -46, 72, 40);
      g.fillStyle = COL_PP; for (let i = 0; i < 26; i++) { const r = hash(i + 620) > 0.8 ? 1.1 : 0.5; g.beginPath(); g.arc(-26 + hash(i + 600) * 52, -38 + hash(i + 610) * 24, r, 0, TAU); g.fill(); }
      g.restore(); g.strokeStyle = COL_K; g.lineWidth = 1.5; COL_lidPath(g); g.stroke();
    }),
    star: () => COL_bake('star', 40, 40, 20, 20, g => COL_cut(g, q => { q.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 6 : 14, a = i / 10 * TAU - Math.PI / 2; i ? q.lineTo(Math.cos(a) * r, Math.sin(a) * r) : q.moveTo(Math.cos(a) * r, Math.sin(a) * r); } q.closePath(); }, COL_R, 2.5)),
    planet: () => COL_bake('planet', 64, 44, 32, 22, g => {
      const ring = q => { q.beginPath(); q.ellipse(0, 0, 28, 7, -0.3, 0, TAU); q.ellipse(0, 0, 21, 4.5, -0.3, 0, TAU); };
      COL_cut(g, q => { q.beginPath(); q.arc(0, 0, 15, 0, TAU); q.ellipse(0, 0, 28, 7, -0.3, 0, TAU); }, COL_O, 2.5);
      g.fillStyle = COL_B; ring(g); g.fill('evenodd');
      const ball = q => { q.beginPath(); q.arc(0, 0, 15, 0, TAU); };
      g.save(); ball(g); g.clip(); g.fillStyle = COL_O; g.fillRect(-16, -16, 32, 32); g.restore();
      COL_dots(g, ball, 'rgba(22,19,15,0.5)', 3.4, (x, y) => 1.4 * clamp((x + y) / 30 + 0.3), -16, -16, 16, 16);
      g.save(); g.beginPath(); g.rect(-30, 0, 60, 10); g.clip(); g.fillStyle = COL_B; ring(g); g.fill('evenodd'); g.restore();
    }),
    rocket: () => COL_bake('rocket', 40, 60, 20, 30, g => {
      const body = q => { q.beginPath(); q.moveTo(0, -25); q.quadraticCurveTo(11, -10, 9, 14); q.lineTo(-9, 14); q.quadraticCurveTo(-11, -10, 0, -25); q.moveTo(-9, 4); q.lineTo(-16, 20); q.lineTo(-8, 14); q.moveTo(9, 4); q.lineTo(16, 20); q.lineTo(8, 14); };
      COL_cut(g, body, COL_N, 2.5);
      g.fillStyle = COL_R; g.beginPath(); g.moveTo(-9, 4); g.lineTo(-16, 20); g.lineTo(-8, 14); g.closePath(); g.moveTo(9, 4); g.lineTo(16, 20); g.lineTo(8, 14); g.closePath(); g.fill();
      g.save(); body(g); g.clip(); g.fillRect(-12, -26, 24, 11); g.restore();
      COL_dots(g, body, 'rgba(22,19,15,0.4)', 3, x => 1.2 * clamp(x / 10 + 0.2), -10, -14, 10, 14);
      g.fillStyle = COL_B; g.strokeStyle = COL_K; g.lineWidth = 1.5; g.beginPath(); g.arc(0, -3, 4.5, 0, TAU); g.fill(); g.stroke();
    }),
    bird: () => COL_bake('bird', 56, 34, 28, 17, g => COL_cut(g, q => { q.beginPath(); q.moveTo(-24, -2); q.quadraticCurveTo(-8, -4, 0, 2); q.quadraticCurveTo(4, -12, 20, -14); q.quadraticCurveTo(8, -4, 6, 4); q.lineTo(16, 10); q.lineTo(4, 8); q.quadraticCurveTo(-6, 12, -12, 4); q.closePath(); }, COL_B, 2.5)),
    rose: () => COL_bake('rose', 44, 44, 22, 22, g => {
      COL_cut(g, q => { q.beginPath(); q.arc(0, -2, 11, 0, TAU); q.moveTo(2, 8); q.quadraticCurveTo(14, 8, 18, 18); q.quadraticCurveTo(6, 18, 2, 8); }, COL_R, 2.5);
      g.fillStyle = '#7A5516'; g.beginPath(); g.moveTo(2, 8); g.quadraticCurveTo(14, 8, 18, 18); g.quadraticCurveTo(6, 18, 2, 8); g.fill();
      g.strokeStyle = '#8a1510'; g.lineWidth = 1.4; g.beginPath(); for (let t = 0; t < 14; t += 0.3) { const r = t * 0.7; g.lineTo(Math.cos(t) * r, -2 + Math.sin(t) * r); } g.stroke();
    }),
    news: () => COL_bake('news', 132, 96, 66, 48, g => {
      COL_cut(g, q => COL_quad(q, 120, 84, 31, 4), '#EFE8DA', 3);
      g.fillStyle = COL_K; g.fillRect(-52, -34, 70, 7);
      g.fillStyle = 'rgba(22,19,15,0.32)'; for (let r = 0; r < 9; r++) for (let col = 0; col < 3; col++) g.fillRect(-52 + col * 36, -22 + r * 6.5, 30 - hash(r * 3 + col) * 8, 2.2);
    }),
    n06: () => COL_bake('n06', 62, 36, 31, 18, g => { COL_cut(g, q => COL_quad(q, 52, 28, 7, 2), COL_R, 2.5); g.fillStyle = COL_PP; g.font = `800 17px ${DISP}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Nº06', 0, 1); }),
    band: () => COL_bake('band', 430, 44, 215, 22, g => { COL_cut(g, q => COL_torn(q, 420, 30, 41), COL_K, 0); g.fillStyle = COL_PP; g.font = `900 21px ${DISP}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('THE MIND IS A COLLAGE', 0, 1); }),
    strip: () => COL_bake('strip', 400, 14, 200, 7, g => COL_cut(g, q => COL_torn(q, 390, 6, 53), COL_R, 0)),
  };
  // 勒索信字块：脑（红底黑字）洞（报纸底黑字）大（黑底白字）开（米白底红字）
  const COL_CH = [['脑', COL_R, COL_K, SANS], ['洞', '#EFE8DA', COL_K, SERIF], ['大', COL_K, COL_PP, SANS], ['开', COL_PP, COL_R, SERIF]];
  COL_CH.forEach(([ch, bg, fg, ff], i) => { COL_PIECES['ch' + i] = () => COL_bake('ch' + i, 58, 58, 29, 29, g => { COL_cut(g, q => COL_quad(q, 46, 48, 21 + i, 3), bg, 3); g.fillStyle = fg; g.font = `900 34px ${ff}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 0, 2); }); });
  COL_PIECES.flame = i => COL_bake('flame' + i, 24, 30, 12, 4, g => { const L = [16, 22, 13][i]; COL_cut(g, q => { q.beginPath(); q.moveTo(-6, 0); q.quadraticCurveTo(-4, L * 0.6, 0, L); q.quadraticCurveTo(4, L * 0.6, 6, 0); q.closePath(); }, '#E8742A', 1.5); g.fillStyle = '#FFE9A6'; g.beginPath(); g.moveTo(-3, 0); g.quadraticCurveTo(0, L * 0.7, 3, 0); g.fill(); });
  const COL_put = (k, P, x, y, rot, s) => { k.save(); k.translate(x, y); k.rotate(rot); k.scale(s, s); k.drawImage(P.c, -P.ax, -P.ay, P.w, P.h); k.restore(); };
  // 12fps 拍下：提前 2 帧从空中落下（1.3 → 1.12），着纸帧压扁 0.96，之后 1
  const COL_slap = (u, t0) => { const f = Math.floor((u - t0) * 12 + 1e-6); if (f < -2) return null; return f === -2 ? { s: 1.3, d: 1 } : f === -1 ? { s: 1.12, d: 0.45 } : f === 0 ? { s: 0.96, d: 0 } : { s: 1, d: 0 }; };
  const COL_jit = (seed, u) => { const n = Math.floor(u * 6 + 1e-6); return [(hash(seed * 7.13 + n) - 0.5) * 2.4, (hash(seed * 3.31 + n + 50) - 0.5) * 2.4, (hash(seed * 1.77 + n + 90) - 0.5) * 0.03]; };
  const COL_page = () => layer('COL_page', g => {
    g.fillStyle = '#DCC39A'; g.fillRect(0, 0, CW, CH);
    for (let y = 0; y < CH; y += 4) for (let x = 0; x < CW; x += 4) { const v = fbm2(x / 60, y / 60, 3); g.fillStyle = `rgba(150,110,60,${0.28 * clamp(v - 0.35)})`; g.fillRect(x, y, 4, 4); }
    paper(g, [60, 40, 10], 900, 11);
    txt(g, 'NOGGIN QUARTERLY — Nº06 — AUTUMN 2026', 12, 14, `500 8px ${MONO}`, 'rgba(22,19,15,0.82)');
    txt(g, 'PL. VI · CUT & PASTE ON KRAFT, 1860 / 2026', CW - 10, CH - 6, `500 7px ${MONO}`, 'rgba(22,19,15,0.72)', 'right');
  });
  CELLS[12] = (k, w, h, u) => {
    k.globalAlpha = 1; k.fillStyle = '#DCC39A'; k.fillRect(0, 0, CW, CH); k.drawImage(COL_page(), 0, 0);
    if (u >= 6.0) return;
    const P = COL_PIECES, HX = 128, HY = 118;
    const S = (piece, t0, x, y, rot, seed, dir = [30, -24]) => { const sl = COL_slap(u, t0); if (!sl) return; const [jx, jy, jr] = COL_jit(seed, u); COL_put(k, piece, x + jx + dir[0] * sl.d, y + jy + dir[1] * sl.d, rot + jr, sl.s); };
    S(P.disc(), 0.45, HX, HY - 12, 0, 5, [-40, -20]);
    S(P.news(), 0.65, 428, 78, 0.05, 6, [60, -30]);
    // 头像：盖子按 12fps 6 帧翻开（铰链在剪口左端）
    const hs = COL_slap(u, 0.25);
    if (hs) {
      const [jx, jy, jr] = COL_jit(1, u), x = HX + jx + 40 * hs.d, y = HY + jy - 30 * hs.d;
      const LID = [-0.35, -0.95, -1.65, -1.92, -1.8, -1.85], fp = Math.floor((u - 1.5) * 12 + 1e-6), ang = fp < 0 ? 0 : LID[Math.min(fp, 5)];
      k.save(); k.translate(x, y); k.rotate(jr); k.scale(hs.s, hs.s);
      if (ang !== 0) { const cv = P.cav(); k.drawImage(cv.c, -cv.ax, -cv.ay, cv.w, cv.h); }
      const hd = P.head(); k.drawImage(hd.c, -hd.ax, -hd.ay, hd.w, hd.h);
      k.translate(-29, -14); k.rotate(ang); k.translate(29, 14);
      const ld = P.lid(); k.drawImage(ld.c, -ld.ax, -ld.ay, ld.w, ld.h);
      k.restore();
    }
    // POP 爆炸纸片：1.5 秒起 3 帧
    const pf = Math.floor((u - 1.5) * 12 + 1e-6);
    if (pf >= 0 && pf < 3) {
      const s = [0.6, 1.1, 0.9][pf]; k.save(); k.translate(HX, HY - 40); k.rotate(pf * 0.2); k.scale(s, s);
      k.beginPath(); for (let i = 0; i < 24; i++) { const r = i % 2 ? 16 : 34 + hash(i + pf * 30) * 8, a = i / 24 * TAU; i ? k.lineTo(Math.cos(a) * r, Math.sin(a) * r) : k.moveTo(r, 0); } k.closePath();
      k.lineJoin = 'miter'; k.lineWidth = 5; k.strokeStyle = COL_PP; k.stroke(); k.fillStyle = '#FFE9A6'; k.fill();
      txt(k, 'POP!', 0, 1, `900 16px ${DISP}`, COL_R, 'center', 'middle'); k.restore();
    }
    // 脑洞飞出物：6 帧 12fps 抛物线落位
    const SPILL = [['star', 1.583, 196, 32, 0.2], ['planet', 1.75, 252, 58, -0.1], ['rocket', 1.917, 322, 40, 0.55], ['bird', 2.083, 236, 114, -0.15], ['rose', 2.25, 300, 98, 0.3]];
    SPILL.forEach(([name, t0, tx, ty, r0], i) => {
      const fq = Math.floor((u - t0) * 12 + 1e-6); if (fq < 0) return;
      const p = Math.min(fq, 6) / 6, [jx, jy, jr] = p >= 1 ? COL_jit(20 + i, u) : [0, 0, 0];
      const x = mix(HX, tx, p) + jx, y = mix(HY - 36, ty, p) - 46 * Math.sin(Math.PI * p) + jy, rot = r0 * p + (1 - p) * 3 + jr, s = mix(0.35, 1, p);
      if (name === 'rocket') { const fl = P.flame(Math.floor(u * 12 + 1e-6) % 3); k.save(); k.translate(x, y); k.rotate(rot); k.scale(s, s); k.drawImage(fl.c, -fl.ax, 14 - fl.ay, fl.w, fl.h); k.restore(); }
      COL_put(k, P[name](), x, y, rot, s);
    });
    // 勒索信字块、撕纸横条、红条、Nº06
    [[382, 54, -0.11], [436, 48, 0.08], [384, 106, 0.05], [438, 102, -0.08]].forEach(([x, y, r], i) => S(P['ch' + i](), 2.5 + i / 6, x, y, r, 30 + i));
    S(P.band(), 3.25, 368, 168, -0.1, 40, [-70, 7]);
    S(P.strip(), 3.333, 352, 190, -0.1, 41, [-60, 6]);
    S(P.n06(), 3.583, 506, 28, -0.09, 42, [30, -20]);
    // 复位：整张牛皮纸带撕边 12fps 从右盖过
    if (u >= SHOW) {
      const p = out3(seg(stepT(u, 12), SHOW, 6.0)), ex = CW * (1 - p);
      const edge = (dx) => { k.beginPath(); k.moveTo(ex + dx, -5); for (let y = 0; y <= CH + 8; y += 8) k.lineTo(ex + dx + (hash(Math.floor(y / 8) + 300) - 0.5) * 10, y); k.lineTo(CW + 10, CH + 5); k.lineTo(CW + 10, -5); k.closePath(); };
      edge(-6); k.fillStyle = 'rgba(22,19,15,0.25)'; k.fill();
      edge(-2.5); k.fillStyle = COL_PP; k.fill();
      k.save(); edge(0); k.clip(); k.fillStyle = '#DCC39A'; k.fillRect(0, 0, CW, CH); k.drawImage(COL_page(), 0, 0); k.restore();
    }
  };

  // @element 14
  // 14 粗描边贴纸人科普（19-paperclip「一部手机里，藏着多少种元素？」）：蓝灰底 #E9EEF2、石板 #25313D + 唯一强调色 #FF5A36、等线黑体；一条连续镜头串三个信息点：0.2 秒手机贴纸（白描边 + 柔投影）backOut 拍下，0.35/0.5 秒两块标题贴纸，0.6–0.96 秒四条引线标注（屏幕/电池/主板/磁铁 + 元素徽章）；1.6–2.2 秒镜头斜向飞到周期表（中途缩到 0.9），1.9 秒 118 格依次弹入，2.45 秒首批 10 种点亮、2.5–3.2 秒其余 60 种按列 + 行序瀑布点亮（稀土为橙），计数 0→70 / 118；3.5–4.1 秒飞到柱状图，4.15–4.81 秒 70 枚元素小方块逐格长成 5 根柱（过渡金属 23、稀土 16、主族金属与类金属 12、非金属 11、碱金属与碱土金属 8）并计数，4.95 秒「约 70 种」橙色贴纸拍下；5.4–6.0 秒内容淡出、5.4–6.2 秒镜头飞回起点
  const STK = { bg: '#E9EEF2', ink: '#25313D', mid: '#8C9AA8', card: '#F7F9FB', or: '#FF5A36', line: '#CDD6DE', line2: '#AEBAC5' };
  const STK_SYM = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ');
  const STK_RE = new Set(['Sc', 'Y', 'La', 'Ce', 'Pr', 'Nd', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu']);
  const STK_CATS = [['过渡金属', 'Ti V Cr Mn Fe Co Ni Cu Zn Zr Nb Mo Ru Rh Pd Ag Cd Hf Ta W Ir Pt Au'], ['稀土元素', 'Sc Y La Ce Pr Nd Sm Eu Gd Tb Dy Ho Er Tm Yb Lu'], ['主族金属与类金属', 'Al Ga In Sn Pb Bi B Si Ge As Sb Te'], ['非金属', 'H C N O F P S Cl Se Br I'], ['碱金属与碱土金属', 'Li Na K Be Mg Ca Sr Ba']].map(([zh, els]) => ({ zh, els: els.split(' ') }));
  const STK_rc = Z => { if (Z === 1) return [0, 0]; if (Z === 2) return [0, 17]; if (Z <= 4) return [1, Z - 3]; if (Z <= 10) return [1, Z + 7]; if (Z <= 12) return [2, Z - 11]; if (Z <= 18) return [2, Z - 1]; if (Z <= 36) return [3, Z - 19]; if (Z <= 54) return [4, Z - 37]; if (Z <= 56) return [5, Z - 55]; if (Z <= 71) return [7, Z - 55]; if (Z <= 86) return [5, Z - 69]; if (Z <= 88) return [6, Z - 87]; if (Z <= 103) return [8, Z - 87]; return [6, Z - 101]; };
  // 周期表 118 格：位置、弹入延迟、点亮时刻（首批 10 种 2.45 秒，其余按 列+0.45行+随机 排序、立方缓出铺满 2.5–3.2 秒）
  const STK_TILES = (() => {
    const used = new Set(); STK_CATS.forEach(c => c.els.forEach(s => used.add(s)));
    const FIRST = ['In', 'Li', 'Co', 'Si', 'Ga', 'Cu', 'Sn', 'Au', 'Nd', 'Pr'];
    const rest = [...used].filter(s => !FIRST.includes(s)).map(s => { const Z = STK_SYM.indexOf(s) + 1, [r, c] = STK_rc(Z); return { s, key: c + 0.45 * r + hash(Z + 19) * 2.2 }; }).sort((a, b) => a.key - b.key).map(o => o.s);
    const lt = {}; FIRST.forEach(s => { lt[s] = 2.45; }); rest.forEach((s, i) => { lt[s] = mix(2.5, 3.2, 1 - Math.cbrt(1 - (i + 1) / rest.length)); });
    return STK_SYM.map((s, i) => { const [r, c] = STK_rc(i + 1); return { s, x: 14 + c * 15, y: r < 7 ? 34 + r * 15 : 34 + 7 * 15 + 5 + (r - 7) * 15, d: 1.9 + (c + r * 1.4) * 0.012, lt: lt[s] ?? null, re: STK_RE.has(s) }; });
  })();
  const STK_LT = STK_TILES.filter(t => t.lt !== null).map(t => t.lt).sort((a, b) => a - b);
  const STK_PARTS = [['屏幕', 'DISPLAY', ['In'], [98, 66], 42], ['电池', 'BATTERY', ['Li', 'Co'], [86, 100], 82], ['主板', 'BOARD', ['Si', 'Ga', 'Cu', 'Sn', 'Au'], [68, 128], 122], ['磁铁', 'MAGNET', ['Nd', 'Pr'], [92, 156], 162]];
  const STK_SEC = { A: [0, 0], B: [700, 250], C: [1400, 500] };
  // 贴纸底板：柔投影 + 白描边 + 本色
  function STK_plate(k, x, y, wd, ht, r, fill, ow = 4) {
    k.fillStyle = 'rgba(22,34,46,0.12)'; rr(k, x - ow, y - ow + 4, wd + 2 * ow, ht + 2 * ow, r + ow); k.fill();
    k.fillStyle = 'rgba(22,34,46,0.1)'; rr(k, x - ow, y - ow + 1.5, wd + 2 * ow, ht + 2 * ow, r + ow); k.fill();
    k.fillStyle = '#FFFFFF'; rr(k, x - ow, y - ow, wd + 2 * ow, ht + 2 * ow, r + ow); k.fill();
    k.fillStyle = fill; rr(k, x, y, wd, ht, r); k.fill();
  }
  function STK_cam(u) {
    const A = [270, 104], B = [970, 354], C = [1670, 604];
    const fly = (P0, P1, a, b, z0, dip) => { const e = inOut3(seg(u, a, b)); return [mix(P0[0], P1[0], e), mix(P0[1], P1[1], e), mix(z0, 1, e) - dip * Math.sin(Math.PI * e)]; };
    if (u < 1.6) return [A[0], A[1], 1 + 0.03 * seg(u, 0, 1.6)];
    if (u < 2.2) return fly(A, B, 1.6, 2.2, 1.03, 0.1);
    if (u < 3.5) return [B[0], B[1], 1 + 0.03 * seg(u, 2.2, 3.5)];
    if (u < 4.1) return fly(B, C, 3.5, 4.1, 1.03, 0.1);
    if (u < SHOW) return [C[0], C[1], 1 + 0.03 * seg(u, 4.1, SHOW)];
    if (u < 6.2) return fly(C, A, SHOW, 6.2, 1.03, 0.12);
    return [A[0], A[1], 1];
  }
  CELLS[13] = (k, w, h, u) => {
    const F = fadeIn(u), [cx, cy, z] = STK_cam(u);
    k.globalAlpha = 1; k.fillStyle = STK.bg; k.fillRect(0, 0, CW, CH);
    k.save(); k.translate(CW / 2, CH / 2); k.scale(z, z); k.translate(-cx, -cy);
    const vx0 = cx - CW / 2 / z, vx1 = cx + CW / 2 / z, vy0 = cy - CH / 2 / z, vy1 = cy + CH / 2 / z;
    // 世界坐标点阵底纹（随镜头移动）
    k.fillStyle = STK.line; k.beginPath();
    for (let y = Math.floor(vy0 / 26) * 26; y < vy1; y += 26) for (let x = Math.floor(vx0 / 26) * 26; x < vx1; x += 26) k.rect(x - 0.8, y - 0.8, 1.6, 1.6);
    k.fill();
    const vis = ([ox, oy]) => ox < vx1 && ox + CW > vx0 && oy < vy1 && oy + CH > vy0;
    k.globalAlpha = F;
    if (F > 0 && vis(STK_SEC.A)) {
      // A：手机贴纸 + 引线标注 + 标题贴纸
      PARTS_DRAW: {
        STK_PARTS.forEach(([zh, en, els, [ax, ay], ly], i) => {
          const p = out3(seg(u, 0.6 + i * 0.12, 0.85 + i * 0.12)); if (p <= 0) return;
          k.strokeStyle = STK.ink; k.lineWidth = 1.2; k.beginPath(); k.moveTo(ax, ay);
          const ex = 150, L1 = Math.hypot(ex - ax, ly - ay), q = p * (L1 + 6);
          if (q < L1) k.lineTo(mix(ax, ex, q / L1), mix(ay, ly, q / L1)); else { k.lineTo(ex, ly); k.lineTo(ex + (q - L1), ly); }
          k.stroke(); k.fillStyle = STK.ink; k.beginPath(); k.arc(ax, ay, 2.2, 0, TAU); k.fill();
          const a = seg(u, 0.75 + i * 0.12, 0.95 + i * 0.12); if (a <= 0) return;
          k.globalAlpha = F * a;
          txt(k, zh, 160, ly + 2, `700 10px ${SANS}`, STK.ink); k.font = `700 10px ${SANS}`; const zw = k.measureText(zh).width;
          txt(k, en, 164 + zw, ly + 2, `700 7px ${DISP}`, STK.mid);
          els.forEach((s, j) => { const bs = 1 + 0.3 * (1 - backOut(seg(u, 0.8 + i * 0.12 + j * 0.04, 1.0 + i * 0.12 + j * 0.04))); k.save(); k.translate(167 + j * 18, ly + 14); k.scale(bs, bs); STK_plate(k, -7, -7, 14, 14, 3, STK_RE.has(s) ? STK.or : STK.ink, 1.5); txt(k, s, 0, 0.5, `800 7.5px ${DISP}`, '#FFFFFF', 'center', 'middle'); k.restore(); });
          k.globalAlpha = F;
        });
      }
      const pp = seg(u, 0.2, 0.45);
      if (pp > 0) {
        k.save(); k.globalAlpha = F * clamp(pp * 4); k.translate(78, 106); k.rotate(-0.08 + 0.05 * (1 - pp)); const s = mix(1.35, 1, backOut(pp)); k.scale(s, s);
        STK_plate(k, -28, -58, 56, 116, 9, '#1D2731', 5);
        const sg = k.createLinearGradient(0, -52, 0, 52); sg.addColorStop(0, '#303740'); sg.addColorStop(1, '#161E26'); k.fillStyle = sg; rr(k, -25, -52, 50, 104, 6); k.fill();
        const AP = ['#FF5A36', '#8C9AA8', '#5E6D7B', '#AEBAC5'];
        for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { k.fillStyle = AP[(r * 3 + c * 2) % 4]; k.globalAlpha = F * clamp(pp * 4) * 0.85; rr(k, -19 + c * 14, -38 + r * 16, 10, 10, 2.5); k.fill(); }
        k.globalAlpha = F * clamp(pp * 4); k.fillStyle = '#0B0E11'; rr(k, -8, -50, 16, 4, 2); k.fill();
        k.restore();
      }
      const pk = seg(u, 0.3, 0.5);
      if (pk > 0) { k.globalAlpha = F * pk; k.fillStyle = STK.or; k.fillRect(296, 30, 8, 8); txt(k, '硬核拆解 · TEARDOWN', 310, 37.5, `700 8.5px ${SANS}`, STK.mid); }
      [[0.35, '一部手机里，', 70, -0.03], [0.5, '藏着多少种元素？', 106, 0.02]].forEach(([t0, s, y, r]) => {
        const p = seg(u, t0, t0 + 0.25); if (p <= 0) return;
        k.save(); k.globalAlpha = F * clamp(p * 4); k.translate(296, y); k.rotate(r * (1 + (1 - p))); const sc = mix(1.25, 1, backOut(p)); k.scale(sc, sc);
        k.font = `900 24px ${SANS}`; const tw = k.measureText(s).width;
        STK_plate(k, -6, -24, tw + 12, 32, 5, STK.card, 3.5);
        if (s.endsWith('？')) { const main = s.slice(0, -1); txt(k, main, 0, 0, `900 24px ${SANS}`, STK.ink); k.font = `900 24px ${SANS}`; txt(k, '？', k.measureText(main).width, 0, `900 24px ${SANS}`, STK.or); }
        else txt(k, s, 0, 0, `900 24px ${SANS}`, STK.ink);
        k.restore();
      });
      const pc = seg(u, 0.9, 1.2); if (pc > 0) { k.globalAlpha = F * pc; txt(k, '拆开一部智能手机，逐一对照元素周期表', 296, 140, `600 9px ${SANS}`, STK.mid); }
      k.globalAlpha = F;
    }
    if (F > 0 && vis(STK_SEC.B)) {
      // B：周期表点亮 + 计数
      k.save(); k.translate(STK_SEC.B[0], STK_SEC.B[1]);
      const pk = seg(u, 1.95, 2.25);
      if (pk > 0) { k.globalAlpha = F * pk; k.fillStyle = STK.or; k.fillRect(14, 15, 8, 8); txt(k, '02 对照元素周期表', 28, 22.5, `700 9.5px ${SANS}`, STK.ink); txt(k, 'PERIODIC TABLE', 118, 22.5, `700 7px ${DISP}`, STK.mid); }
      let lit = 0;
      for (const t of STK_TILES) {
        const q = seg(u, t.d, t.d + 0.3); if (q <= 0) continue;
        let s = mix(0.55, 1, backOut(q)), on = t.lt !== null && u >= t.lt;
        if (on) { lit++; const qq = seg(u, t.lt, t.lt + 0.16); s *= 1 + 0.16 * (1 - qq); }
        k.globalAlpha = F * clamp(q * 3);
        k.save(); k.translate(t.x + 6.5, t.y + 6.5); k.scale(s, s);
        if (on) { k.fillStyle = t.re ? STK.or : STK.ink; k.fillRect(-6.5, -6.5, 13, 13); txt(k, t.s, 0, 0.5, `700 7px ${DISP}`, '#FFFFFF', 'center', 'middle'); }
        else { k.fillStyle = STK.card; k.fillRect(-6.5, -6.5, 13, 13); k.strokeStyle = STK.line; k.lineWidth = 1; k.strokeRect(-6, -6, 12, 12); txt(k, t.s, 0, 0.5, `600 7px ${DISP}`, STK.mid, 'center', 'middle'); }
        k.restore();
      }
      const pn = seg(u, 2.2, 2.5);
      if (pn > 0) {
        k.globalAlpha = F * pn;
        const nCol = u < 3.2 ? (lit > 0 ? STK.or : STK.mid) : STK.ink;
        txt(k, String(lit), 304, 112, `900 66px ${DISP}`, nCol);
        txt(k, '/ 118', 428, 112, `800 24px ${DISP}`, STK.mid);
        txt(k, '种元素，出现在一部手机里', 306, 134, `700 11px ${SANS}`, STK.ink);
        txt(k, '已知 118 种元素中，一部智能手机用到约 70 种，', 306, 154, `600 8px ${SANS}`, STK.mid);
        txt(k, '其中稀土就有 16 种。', 306, 166, `600 8px ${SANS}`, STK.mid);
      }
      k.restore(); k.globalAlpha = F;
    }
    if (F > 0 && vis(STK_SEC.C)) {
      // C：单位柱状图
      k.save(); k.translate(STK_SEC.C[0], STK_SEC.C[1]);
      const pa = seg(u, 3.75, 4.1);
      if (pa > 0) {
        k.globalAlpha = F * pa; k.fillStyle = STK.or; k.fillRect(14, 15, 8, 8);
        txt(k, '03 按类别统计', 28, 22.5, `700 9.5px ${SANS}`, STK.ink); txt(k, 'BY CATEGORY · 共 70 种', 100, 22.5, `700 7px ${DISP}`, STK.mid);
        k.strokeStyle = STK.ink; k.lineWidth = 1.5; k.beginPath(); k.moveTo(106, 32); k.lineTo(106, 186); k.stroke();
        k.strokeStyle = STK.line2; k.lineWidth = 1; k.setLineDash([2, 4]); k.beginPath();
        for (const n of [5, 10, 15, 20]) { const x = 112 + n * 15 - 1; k.moveTo(x, 32); k.lineTo(x, 186); } k.stroke(); k.setLineDash([]);
        for (const n of [5, 10, 15, 20]) txt(k, String(n), 112 + n * 15 - 1, 197, `600 8px ${DISP}`, STK.mid, 'center');
      }
      STK_CATS.forEach((c, i) => {
        const y = 38 + i * 30, re = i === 1;
        const pl = seg(u, 3.85 + i * 0.05, 4.1 + i * 0.05); if (pl <= 0) return;
        k.globalAlpha = F * pl; txt(k, c.zh, 100, y + 11, `700 9px ${SANS}`, STK.ink, 'right');
        let n = 0;
        c.els.forEach((s, j) => {
          const t0 = 4.15 + j * 0.03 + i * 0.05, q = seg(u, t0, t0 + 0.12); if (q <= 0) return; n = j + 1;
          const sc = 1.3 - 0.3 * out3(q); k.globalAlpha = F * clamp(q * 2);
          k.save(); k.translate(112 + j * 15 + 6.5, y + 6.5 + 2); k.scale(sc, sc); k.fillStyle = re ? STK.or : STK.ink; k.fillRect(-6.5, -6.5, 13, 13);
          txt(k, s, 0, 0.5, `700 7px ${DISP}`, '#FFFFFF', 'center', 'middle'); k.restore();
        });
        if (n > 0) { k.globalAlpha = F; txt(k, String(n), 112 + n * 15 + 4, y + 15, `900 15px ${DISP}`, re ? STK.or : STK.ink); }
      });
      const ps = seg(u, 4.95, 5.2);
      if (ps > 0) {
        k.save(); k.globalAlpha = F * clamp(ps * 4); k.translate(476, 160); k.rotate(-0.1); const sc = mix(1.5, 1, backOut(ps)); k.scale(sc, sc);
        STK_plate(k, -38, -19, 76, 38, 9, STK.or, 4.5);
        txt(k, '约', -27, 6, `800 10px ${SANS}`, '#FFFFFF'); txt(k, '70', -14, 9, `900 26px ${DISP}`, '#FFFFFF'); txt(k, '种', 19, 6, `800 10px ${SANS}`, '#FFFFFF');
        k.restore();
      }
      k.restore();
    }
    k.restore(); k.globalAlpha = 1;
  };

  // @element 15
  // 15 综艺花字（18-hanazi「喵呜日记 EP.07」）：粉色墙面 + 窗光 + 青色坐垫上的矢量橘猫（深紫 #1A1030 粗描边，耳朵每周期抽动 4 次，手持晃动按整数圈），花字三层结构 = 渐变填充 + 粗白描边 + 彩色外描边/深色挤出投影（今日份快乐：#FFFBD6→#FFE23A→#FF9A1F + 白 + #FF3D7F + #A3124F）；入场为阻尼弹簧 0→1.15→1（ζ=0.517、ω=22，约 5 帧到峰）带下落与旋入、逐字错 2 帧，驻留轻微摇摆；0.3 秒今日份快乐、0.8 秒闪光、1.2 秒（小声）正在光合作用…，2.3 秒弹出消失；2.4 秒青色「？？？」逐个弹出并按半拍跳动 + 2.5 秒汗滴下滑，猫变豆豆眼；2.9 秒镜头猛推 1.14 倍 + 3 帧震动、12fps 抖动的白色集中线与黄 #FFF15A / 粉 #FF3D7F 双层爆炸框、「震惊！！」、3.5 秒「这发量合理吗？！」，猫惊吓炸毛；4.3 秒红色「猫主子认证」印章 4 帧砸下；5.4–5.6 秒全部依次 pop-out（1→1.12→0，0.17 秒），左上角节目角标常驻
  const HZ_ST = {
    title: { fill: [[0, '#FFFBD6'], [0.42, '#FFE23A'], [1, '#FF9A1F']], white: 4.5, outer: 3.5, outerC: '#FF3D7F', ext: 4, extC: '#A3124F', gloss: 0.55 },
    q: { fill: [[0, '#E8FBFF'], [1, '#2CCBF2']], white: 4, outer: 3, outerC: '#1E2A78', ext: 3, extC: '#0E1440', gloss: 0.4 },
    shock: { fill: [[0, '#FFF6C0'], [0.45, '#FF7FC8'], [1, '#FF2E4D']], white: 4.5, outer: 3.5, outerC: '#1A1030', ext: 4, extC: '#1A1030', gloss: 0.45 },
    sub: { fill: [[0, '#FFFFFF'], [1, '#FFF6C0']], white: 0, outer: 3, outerC: '#1E2A78', ext: 2, extC: '#0E1440' },
    aside: { fill: [[0, '#FFFFFF'], [1, '#F2EDFF']], white: 0, outer: 2.5, outerC: '#1A1030', ext: 0 },
  };
  const HZ_spring = (t, z = 0.517, w = 22) => { if (t <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + z * w / wd * Math.sin(wd * t)); };
  // 单字变换：弹簧缩放、下落、旋入、驻留摇摆；t1 起 pop-out（0.17 秒：先胀到 1.12 再缩没）
  function HZ_xf(u, t0, o = {}) {
    const t = u - t0; if (t < 0) return null;
    let s = HZ_spring(t, o.z, o.w), y = -(o.drop || 0) * (1 - HZ_spring(t, 0.55, 20)), r = (o.r0 || 0) * (1 - HZ_spring(t, 0.45, 18));
    const hold = clamp((t - 0.22) / 0.35), wf = o.wf || 1.15, ph = o.ph || 0;
    r += hold * (o.wig ?? 1.8) * Math.sin(TAU * wf * u + ph); y += hold * (o.bob ?? 2) * Math.sin(TAU * wf * u + ph + 1.9);
    if (o.t1 != null && u >= o.t1) { const q = (u - o.t1) / 0.17; if (q >= 1) return null; s *= q < 0.3 ? 1 + 0.12 * (1 - (1 - q / 0.3) ** 2) : 1.12 * (1 - ((q - 0.3) / 0.7) ** 3); }
    return s > 0.01 ? { s, y, r } : null;
  }
  function HZ_draw(k, ch, x, y, size, st, f) {
    if (!f) return;
    k.save(); k.translate(x, y + f.y); k.rotate(f.r * Math.PI / 180); k.scale(f.s, f.s);
    k.font = `900 ${size}px ${SANS}`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.lineJoin = 'round';
    const lw = 2 * (st.white + st.outer);
    if (st.ext) { k.strokeStyle = st.extC; k.lineWidth = lw; k.strokeText(ch, 0, st.ext); k.fillStyle = st.extC; k.fillText(ch, 0, st.ext); }
    k.strokeStyle = st.outerC; k.lineWidth = lw; k.strokeText(ch, 0, 0);
    if (st.white) { k.strokeStyle = '#FFFFFF'; k.lineWidth = 2 * st.white; k.strokeText(ch, 0, 0); }
    const g = k.createLinearGradient(0, -size / 2, 0, size / 2); st.fill.forEach(([o, c]) => g.addColorStop(o, c)); k.fillStyle = g; k.fillText(ch, 0, 0);
    if (st.gloss) { const gg = k.createLinearGradient(0, -size / 2, 0, 0); gg.addColorStop(0, `rgba(255,255,255,${st.gloss})`); gg.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = gg; k.fillText(ch, 0, 0); }
    k.restore();
  }
  // 四角闪光
  function HZ_spark(k, x, y, r, col, a) {
    if (r <= 0) return; const q = r * 0.16;
    k.save(); k.globalAlpha = a; k.translate(x, y); k.fillStyle = col; k.strokeStyle = '#1A1030'; k.lineWidth = 1.5; k.lineJoin = 'round';
    k.beginPath(); k.moveTo(0, -r); k.quadraticCurveTo(q, -q, r, 0); k.quadraticCurveTo(q, q, 0, r); k.quadraticCurveTo(-q, q, -r, 0); k.quadraticCurveTo(-q, -q, 0, -r); k.closePath(); k.stroke(); k.fill(); k.restore();
  }
  function HZ_burst(k, rx, ry, seed) {
    k.beginPath();
    for (let i = 0; i < 30; i++) { const a = i / 30 * TAU + (hash(seed + i) - 0.5) * 0.09, out = i % 2 === 0, m = out ? 1 + (hash(seed + i + 40) - 0.45) * 0.26 : 0.7 + (hash(seed + i + 80) - 0.5) * 0.07; const x = Math.cos(a) * rx * m, y = Math.sin(a) * ry * m; i ? k.lineTo(x, y) : k.moveTo(x, y); }
    k.closePath();
  }
  // 矢量橘猫：mode 0 常态、1 豆豆眼、2 惊吓（12fps 炸毛）
  function HZ_cat(k, u, mode) {
    const O = '#1A1030'; k.lineJoin = 'round'; k.lineCap = 'round'; k.strokeStyle = O; k.lineWidth = 3;
    k.fillStyle = '#FF9A1F'; k.beginPath(); k.ellipse(135, 202, 70, 50, 0, 0, TAU); k.fill(); k.stroke();
    k.fillStyle = '#FFF6C0'; k.beginPath(); k.ellipse(135, 198, 32, 30, 0, 0, TAU); k.fill();
    const tw = 0.25 * Math.pow(Math.max(0, Math.sin(TAU * u / CYC * 4)), 8);
    for (const sx of [-1, 1]) {
      k.save(); k.translate(135 + sx * 34, 80); k.rotate(sx * (0.18 + (sx > 0 ? tw : 0)));
      k.beginPath(); k.moveTo(-16, 10); k.lineTo(sx * 2, -26); k.lineTo(16, 10); k.closePath(); k.fillStyle = '#FF9A1F'; k.fill(); k.stroke();
      k.beginPath(); k.moveTo(-8, 6); k.lineTo(sx, -14); k.lineTo(8, 6); k.closePath(); k.fillStyle = '#FF7FC8'; k.fill(); k.restore();
    }
    if (mode === 2) {
      const b = Math.floor(u * 12) % 3; k.fillStyle = '#FF9A1F'; k.beginPath();
      for (let i = 0; i < 36; i++) { const a = i / 36 * TAU, r = i % 2 ? 50 : 62 + hash(i + b * 50) * 6; const x = 135 + Math.cos(a) * r * 1.12, y = 114 + Math.sin(a) * r * 0.92; i ? k.lineTo(x, y) : k.moveTo(x, y); }
      k.closePath(); k.fill(); k.stroke();
    }
    k.fillStyle = '#FF9A1F'; k.beginPath(); k.ellipse(135, 114, 56, 46, 0, 0, TAU); k.fill(); k.stroke();
    k.strokeStyle = 'rgba(170,70,0,0.45)'; k.lineWidth = 4; k.beginPath(); for (const dx of [-12, 0, 12]) { k.moveTo(135 + dx, 72); k.lineTo(135 + dx * 1.2, 86); } k.stroke();
    k.fillStyle = '#FFF6C0'; k.beginPath(); k.ellipse(124, 130, 16, 12, 0, 0, TAU); k.ellipse(146, 130, 16, 12, 0, 0, TAU); k.fill();
    k.fillStyle = 'rgba(255,61,127,0.35)'; k.beginPath(); k.ellipse(100, 126, 9, 5, 0, 0, TAU); k.ellipse(170, 126, 9, 5, 0, 0, TAU); k.fill();
    k.fillStyle = '#FF3D7F'; k.beginPath(); k.moveTo(129, 120); k.lineTo(141, 120); k.lineTo(135, 127); k.closePath(); k.fill();
    k.strokeStyle = O; k.lineWidth = 2.2; k.beginPath(); k.moveTo(135, 127); k.quadraticCurveTo(130, 134, 125, 130); k.moveTo(135, 127); k.quadraticCurveTo(140, 134, 145, 130); k.stroke();
    k.lineWidth = 1.5; k.beginPath(); for (const sx of [-1, 1]) for (const dy of [-3, 3]) { k.moveTo(135 + sx * 22, 129 + dy); k.lineTo(135 + sx * 50, 125 + dy * 2.2); } k.stroke();
    if (mode === 0) {
      for (const ex of [115, 155]) { k.fillStyle = O; k.beginPath(); k.ellipse(ex, 106, 9, 11, 0, 0, TAU); k.fill(); k.fillStyle = '#FFFFFF'; k.beginPath(); k.arc(ex - 3, 102, 3.5, 0, TAU); k.arc(ex + 3, 110, 1.5, 0, TAU); k.fill(); }
    } else if (mode === 1) {
      k.fillStyle = O; k.beginPath(); k.arc(115, 107, 3, 0, TAU); k.arc(155, 107, 3, 0, TAU); k.fill();
    } else {
      for (const ex of [115, 155]) { k.fillStyle = '#FFFFFF'; k.lineWidth = 2.5; k.beginPath(); k.arc(ex, 105, 12, 0, TAU); k.fill(); k.stroke(); k.fillStyle = O; k.beginPath(); k.arc(ex, 105, 2.5, 0, TAU); k.fill(); }
    }
  }
  CELLS[14] = (k, w, h, u) => {
    const F = fadeIn(u);
    k.globalAlpha = 1; k.fillStyle = '#FFC9E0'; k.fillRect(0, 0, CW, CH);
    // 镜头：手持晃动（整数圈）+ 2.9 秒猛推 1.14 倍并 3 帧震动
    const pz = u >= 2.9 ? clamp((u - 2.9) / 0.067) * Math.exp(-(u - 2.9) * 1.0) * F : 0;
    const fh = Math.floor((u - 2.9) * 30), hit = fh >= 0 && fh < 3 ? [[5, -3], [-5, 3], [3, -2]][fh] : [0, 0];
    const shx = 1.2 * Math.sin(TAU * u / CYC * 5) + 0.8 * Math.sin(TAU * u / CYC * 11 + 1) + hit[0], shy = 1.0 * Math.sin(TAU * u / CYC * 7 + 2) + 0.6 * Math.sin(TAU * u / CYC * 13) + hit[1];
    const z = 1.03 + 0.14 * pz;
    k.save(); k.translate(135 + shx, 112 + shy); k.scale(z, z); k.translate(-135, -112);
    k.drawImage(layer('HZ_bg', g => {
      const wg = g.createLinearGradient(0, 0, 0, CH); wg.addColorStop(0, '#FFE3F0'); wg.addColorStop(1, '#FFC2DC'); g.fillStyle = wg; g.fillRect(-20, -20, CW + 40, CH + 40);
      g.fillStyle = 'rgba(255,127,200,0.22)'; for (let y = 6; y < CH; y += 18) for (let x = 250 + ((y / 18) % 2 ? 9 : 0); x < CW + 20; x += 18) { g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); }
      g.fillStyle = '#FFF6C0'; rr(g, 14, 12, 160, 124, 10); g.fill(); g.strokeStyle = '#FFFFFF'; g.lineWidth = 6; rr(g, 14, 12, 160, 124, 10); g.stroke();
      g.beginPath(); g.moveTo(94, 12); g.lineTo(94, 136); g.moveTo(14, 74); g.lineTo(174, 74); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.28)'; g.beginPath(); g.moveTo(40, 12); g.lineTo(90, 12); g.lineTo(230, 208); g.lineTo(150, 208); g.closePath(); g.fill();
      g.fillStyle = '#2CCBF2'; rr(g, -20, 170, 330, 70, 26); g.fill(); g.fillStyle = '#1E2A78'; g.fillRect(-20, 200, 330, 30);
    }), -20, -20, CW + 40, CH + 40);
    const mode = u >= 2.4 && u < 2.9 ? 1 : u >= 2.9 && u < 5.6 ? 2 : 0;
    HZ_cat(k, u, mode);
    k.restore();
    // 集中线 + 爆炸框（2.9–5.4，12fps 抖动 3 张）
    const boil = Math.floor(u * 12) % 3;
    if (u >= 2.9 && u < SHOW) {
      k.globalAlpha = 0.9 - 0.3 * seg(u, 2.9, 3.5); k.fillStyle = '#FFFFFF'; k.beginPath();
      for (let i = 0; i < 44; i++) { const a = i / 44 * TAU + (hash(i + boil * 60) - 0.5) * 0.12, wd = 0.012 + 0.02 * hash(i + boil * 60 + 7), r0 = 82 + hash(i + boil * 60 + 9) * 40; k.moveTo(400 + Math.cos(a) * r0, 104 + Math.sin(a) * r0 * 0.7); k.lineTo(400 + Math.cos(a - wd) * 460, 104 + Math.sin(a - wd) * 460); k.lineTo(400 + Math.cos(a + wd) * 460, 104 + Math.sin(a + wd) * 460); k.closePath(); }
      k.fill(); k.globalAlpha = 1;
    }
    const bs = u >= 2.9 ? HZ_xf(u, 2.9 + 2 / 30, { z: 0.42, w: 24, wig: 1.2, bob: 0, wf: 1.1, t1: 5.45 }) : null;
    if (bs) {
      k.save(); k.translate(400 + 7, 104 + 8); k.rotate(-0.05); k.scale(bs.s, bs.s); HZ_burst(k, 124, 74, 200 + boil); k.fillStyle = '#FF3D7F'; k.fill(); k.lineWidth = 4; k.strokeStyle = '#1A1030'; k.lineJoin = 'round'; k.stroke(); k.restore();
      k.save(); k.translate(400, 104); k.rotate((-5 + 1.2 * Math.sin(u * 7)) * Math.PI / 180); k.scale(bs.s, bs.s); HZ_burst(k, 118, 70, 100 + boil); k.fillStyle = '#FFF15A'; k.fill(); k.lineWidth = 4; k.strokeStyle = '#1A1030'; k.stroke(); k.restore();
    }
    // 今日份快乐（0.3 起逐字错 2 帧；2.3 弹出）
    const TX = [312, 351, 390, 429, 468], TDY = [3, -6, 4, -5, 2], TR = [-7, 4, -3, 6, -5];
    [...'今日份快乐'].forEach((ch, i) => HZ_draw(k, ch, TX[i], 52 + TDY[i], 38, HZ_ST.title, HZ_xf(u, 0.3 + i / 15, { drop: 30, r0: i % 2 ? 16 : -16, ph: i * 1.3, t1: 2.3 + i * 0.02 })));
    [[298, 26, 0.8, '#FFFFFF'], [488, 30, 0.9, '#FFE14D'], [470, 84, 1.0, '#FFFFFF'], [296, 44, 3.1, '#FFFFFF'], [516, 58, 3.2, '#FFE14D'], [506, 158, 3.3, '#2CCBF2']].forEach(([x, y, t0, col], i) => {
      const t1 = t0 < 2 ? 2.3 : SHOW + 0.05, f = HZ_xf(u, t0, { z: 0.45, w: 20, t1 }); if (!f) return;
      HZ_spark(k, x, y, (7 + 2 * Math.sin(TAU * u * 1.5 + i)) * f.s, col, 1);
    });
    HZ_draw(k, '（小声）', 322, 96, 13, HZ_ST.aside, HZ_xf(u, 1.2, { z: 0.6, w: 26, wig: 1, bob: 1, t1: 2.3 }));
    [...'正在光合作用…'].forEach((ch, i) => HZ_draw(k, ch, 364 + i * 13, 96, 12, HZ_ST.aside, HZ_xf(u, 1.3 + i * 0.033, { z: 0.6, w: 26, wig: 1, bob: 1, ph: i, t1: 2.32 })));
    // ？？？ + 汗滴（2.4 起，4.1 弹出）
    [[198, 44, -10], [222, 38, 6], [246, 46, 14]].forEach(([x, y, r], i) => { const f = HZ_xf(u, 2.4 + i / 15, { drop: 20, r0: r * 2, ph: i * 2, t1: 4.1 + i * 0.03 }); if (f) { f.y -= 6 * Math.abs(Math.sin(Math.PI * (u - 2.4) / 0.5)); f.r += r; } HZ_draw(k, '？', x, y, 30, HZ_ST.q, f); });
    const sw = HZ_xf(u, 2.5, { z: 0.5, w: 22, wig: 0, bob: 0, t1: 4.1 });
    if (sw) {
      const p = out3(seg(u, 2.5, 3.4)); k.save(); k.translate(188 + 4 * p, 74 + 22 * p); k.scale(sw.s, sw.s); k.rotate(-0.25);
      k.beginPath(); k.moveTo(0, -12); k.quadraticCurveTo(9, 0, 7, 5); k.arc(0, 5, 7, 0, Math.PI); k.quadraticCurveTo(-9, 0, 0, -12); k.closePath();
      k.lineJoin = 'round'; k.lineWidth = 5; k.strokeStyle = '#1E2A78'; k.stroke(); k.lineWidth = 2.5; k.strokeStyle = '#FFFFFF'; k.stroke(); k.fillStyle = '#2CCBF2'; k.fill();
      k.fillStyle = '#FFFFFF'; k.beginPath(); k.ellipse(-2.5, 3, 1.6, 3, 0.3, 0, TAU); k.fill(); k.restore();
    }
    // 震惊！！ + 副字
    [[344, '震'], [384, '惊'], [418, '！'], [444, '！']].forEach(([x, ch], i) => HZ_draw(k, ch, x, 98, 40, HZ_ST.shock, HZ_xf(u, 2.97 + i / 15, { drop: 24, r0: i % 2 ? 14 : -14, wig: 2.4, bob: 3, wf: 1.6, ph: i, t1: SHOW + 0.02 * i })));
    [...'这发量合理吗？！'].forEach((ch, i) => HZ_draw(k, ch, 348 + i * 15, 142, 14, HZ_ST.sub, HZ_xf(u, 3.5 + i * 0.033, { z: 0.6, w: 28, wig: 1.2, bob: 2, ph: i * 0.7, t1: SHOW + 0.1 })));
    // 猫主子认证印章：4.3 秒 4 帧砸下（2.2→1）
    if (u >= 4.3) {
      const fs = Math.floor((u - 4.3) * 30), s0 = fs < 4 ? [2.2, 1.6, 0.92, 1.04][fs] : 1, po = u >= SHOW + 0.1 ? HZ_xf(u, 0, { wig: 0, bob: 0, t1: SHOW + 0.1 }) : { s: 1 };
      if (po) {
        k.save(); k.translate(58, 168); k.rotate(-0.24); k.scale(s0 * po.s, s0 * po.s); k.globalAlpha = 0.92;
        k.fillStyle = 'rgba(255,255,255,0.75)'; k.beginPath(); k.arc(0, 0, 31, 0, TAU); k.fill();
        k.strokeStyle = '#E8283C'; k.lineWidth = 3.5; k.beginPath(); k.arc(0, 0, 29, 0, TAU); k.stroke(); k.lineWidth = 1.5; k.beginPath(); k.arc(0, 0, 23.5, 0, TAU); k.stroke();
        txt(k, '猫主子', 0, -3, `900 13px ${SANS}`, '#E8283C', 'center', 'middle'); txt(k, '认证', 0, 12, `900 10px ${SANS}`, '#E8283C', 'center', 'middle');
        k.restore(); k.globalAlpha = 1;
      }
    }
    // 节目角标（常驻，轻微上下浮动：每周期 4 圈）
    const by = 9 + 1.5 * Math.sin(TAU * u / CYC * 4);
    STK_plate(k, 12, by, 118, 24, 12, '#1E2A78', 3);
    txt(k, '喵呜日记', 22, by + 17, `900 14px ${SANS}`, '#FFE14D');
    txt(k, 'EP.07', 84, by + 16.5, `900 11px ${DISP}`, '#FF7FC8');
  };
  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});
