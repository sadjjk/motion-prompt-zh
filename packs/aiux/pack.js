/* Motion Prompt · pack "aiux" · MIT License (c) 2026 Jakub Antalik · https://libraries.dev/ */
MotionPrompt.pack('aiux', function () {
  // @kit
  // 光效与液态 12（每格 539x208、4.8 秒周期；每格都是只依赖时间 u 的纯函数）
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

  // @element 01
  // 01 环绕光束（border-beam size="md"）：一道彩色光沿输入框边框顺时针绕行，一圈 4.8 秒
  CELLS[0] = (k, w, h, u) => {
    bg(k);
    const x = 79.5, y = 72, W = 380, H = 64, R = 16;
    field(k, x, y, W, H, R, 'Ask anything…');
    beam(k, x, y, W, H, R, u / CYC, 0.22, 200 + 360 * u / CYC);
  };

  // @element 02
  // 02 底边光束（border-beam size="line"）：光沿搜索框底边左右扫动，表示提交后正在加载
  CELLS[1] = (k, w, h, u) => {
    bg(k);
    const x = 79.5, y = 80, W = 380, H = 48, R = 24;
    field(k, x, y, W, H, R, 'Search docs…', false);
    const s = u < 2.4 ? inOut3(seg(u, 0.1, 2.3)) : 1 - inOut3(seg(u, 2.5, 4.7));
    const cx = x + 60 + (W - 120) * s, hue = 200 + 360 * u / CYC;
    // 底边描边：水平渐变只在光束窗口内可见，并裁到输入框下半部分
    k.save(); k.beginPath(); k.rect(0, y + H / 2, CW, CH); k.clip();
    const g = k.createLinearGradient(cx - 90, 0, cx + 90, 0);
    g.addColorStop(0, hsla(hue, 100, 62, 0)); g.addColorStop(0.3, hsla(hue, 100, 62, 0.7));
    g.addColorStop(0.5, hsla(hue + 60, 100, 72, 1)); g.addColorStop(0.7, hsla(hue + 120, 100, 62, 0.7)); g.addColorStop(1, hsla(hue + 120, 100, 62, 0));
    for (const [lw, blur] of [[6, 14], [1.6, 0]]) {
      k.strokeStyle = g; k.lineWidth = lw; k.shadowColor = hsla(hue + 60, 100, 60, 0.9); k.shadowBlur = blur;
      rr(k, x + 0.5, y + 0.5, W - 1, H - 1, R); k.stroke();
    }
    k.restore(); k.shadowBlur = 0; k.shadowColor = 'transparent';
    // 边框下方的柔光
    const rg = k.createRadialGradient(cx, y + H, 0, cx, y + H, 70);
    rg.addColorStop(0, hsla(hue + 60, 100, 65, 0.28)); rg.addColorStop(1, hsla(hue + 60, 100, 65, 0));
    k.fillStyle = rg; k.save(); k.translate(cx, y + H); k.scale(1, 0.35); k.translate(-cx, -(y + H)); k.fillRect(cx - 70, y + H - 70, 140, 140); k.restore();
    // 放大镜图标
    k.strokeStyle = C.muted; k.lineWidth = 1.6; k.beginPath(); k.arc(x + W - 30, y + H / 2 - 2, 6, 0, TAU);
    k.moveTo(x + W - 25.5, y + H / 2 + 2.5); k.lineTo(x + W - 21, y + H / 2 + 7); k.stroke();
  };

  // @element 03
  // 03 内呼吸光晕（border-beam size="pulse-inner"）：彩色光在按钮内部明暗呼吸，不溢出按钮
  CELLS[2] = (k, w, h, u) => {
    bg(k);
    const x = 169.5, y = 76, W = 200, H = 56, R = 28;
    const s = 0.5 - 0.5 * Math.cos(TAU * u / 2.4);          // 2.4 秒一呼一吸，周期内 2 次
    k.fillStyle = C.panel; rr(k, x, y, W, H, R); k.fill();
    k.save(); rr(k, x, y, W, H, R); k.clip();
    const drift = Math.sin(TAU * u / CYC) * 14;
    [[x + 40 + drift, 330], [x + W / 2 - drift, 40], [x + W - 40 + drift, 200]].forEach(([bx, hue]) => {
      const rad = 46 + 34 * s;
      const g = k.createRadialGradient(bx, y + H / 2, 0, bx, y + H / 2, rad);
      g.addColorStop(0, hsla(hue, 100, 62, 0.35 + 0.55 * s)); g.addColorStop(1, hsla(hue, 100, 62, 0));
      k.fillStyle = g; k.fillRect(x, y, W, H);
    });
    k.restore();
    k.strokeStyle = conic(k, x + W / 2, y + H / 2, TAU * u / CYC, 0.3 + 0.5 * s); k.lineWidth = 1.4;
    rr(k, x + 0.7, y + 0.7, W - 1.4, H - 1.4, R); k.stroke();
    txt(k, '✦  Ask AI', x + W / 2, y + H / 2 + 1, `600 16px ${FONT}`, C.text, 'center');
  };

  // @element 04
  // 04 外扩呼吸光晕（border-beam size="pulse-outside"）：彩色光晕在输入框外侧向外扩散再收回
  CELLS[3] = (k, w, h, u) => {
    bg(k);
    const x = 79.5, y = 72, W = 380, H = 64, R = 16;
    const s = 0.5 - 0.5 * Math.cos(TAU * u / 2.4);
    const e = 4 + 14 * s, rot0 = TAU * u / CYC;
    for (let i = 4; i >= 1; i--) {
      const ex = e * i / 4;
      k.strokeStyle = conic(k, x + W / 2, y + H / 2, rot0, (0.25 + 0.45 * s) * (1.15 - i / 4));
      k.lineWidth = 3; k.shadowColor = hsla(200 + 360 * u / CYC, 100, 60, 0.5 * s); k.shadowBlur = 18;
      rr(k, x - ex, y - ex, W + ex * 2, H + ex * 2, R + ex); k.stroke();
    }
    k.shadowBlur = 0; k.shadowColor = 'transparent';
    field(k, x, y, W, H, R, 'Describe what you want to build…');
  };

  // @element 05
  // 05 思考球·运转（thinking-orbs state="working"）：粒子在三条倾斜轨道上绕点阵球运行
  CELLS[4] = (k, w, h, u) => {
    bg(k);
    const spin = TAU * u / CYC;
    for (const p of SPHERE) dot(k, rot(p, spin, ORB.tilt), 0.45);
    const orbits = [[0.35, 0, 1], [1.05, 2.1, 2], [-0.6, 4.2, -1]];   // [倾角, 偏航, 每周期圈数]
    for (const [tilt, yaw, sp] of orbits) {
      for (let j = 0; j < 8; j++) {
        for (let tr = 5; tr >= 0; tr--) {
          const th = sp * TAU * u / CYC + j * TAU / 8 - Math.sign(sp) * tr * 0.07;
          let p = [Math.cos(th) * 1.14, 0, Math.sin(th) * 1.14];
          p = rot([p[0], p[1] * Math.cos(tilt) - p[2] * Math.sin(tilt), p[1] * Math.sin(tilt) + p[2] * Math.cos(tilt)], yaw, ORB.tilt);
          dot(k, p, tr ? 0.5 * (1 - tr / 6) : 1, tr ? 0 : 0.35);
        }
      }
    }
    orbLabel(k, 'Working…');
  };

  // @element 06
  // 06 思考球·搜索（state="searching"）：点阵地球自转，一条亮经线扫过，扫到的点变亮
  CELLS[5] = (k, w, h, u) => {
    bg(k);
    const spin = TAU * u / CYC, sweep = 2 * TAU * u / CYC;   // 自转 1 圈、扫描 2 圈 / 周期
    for (const p of SPHERE) {
      const q = rot(p, spin, 0), lon = Math.atan2(q[0], q[2]);
      const dd = wrapPi(lon - sweep), boost = 0.75 * Math.exp(-(dd * dd) / 0.05);
      dot(k, rot(p, spin, ORB.tilt), 0.7, boost);
    }
    k.strokeStyle = 'rgba(236,236,241,0.35)'; k.lineWidth = 1; k.beginPath();
    for (let i = 0; i <= 40; i++) {
      const lat = -Math.PI / 2 + Math.PI * i / 40;
      const q = rot([Math.cos(lat) * Math.sin(sweep), Math.sin(lat), Math.cos(lat) * Math.cos(sweep)], 0, ORB.tilt);
      const X = ORB.x + q[0] * ORB.r * 1.02, Y = ORB.y - q[1] * ORB.r * 1.02;
      if (i) k.lineTo(X, Y); else k.moveTo(X, Y);
    }
    k.stroke();
    orbLabel(k, 'Searching the web…');
  };

  // @element 07
  // 07 思考球·聆听（state="listening"）：纬线环上的点随声波起伏，波沿纬度方向滚动
  CELLS[6] = (k, w, h, u) => {
    bg(k);
    const spin = TAU * u / CYC;
    for (let i = 0; i < 11; i++) {
      const lat = (-75 + 15 * i) * Math.PI / 180, cl = Math.cos(lat);
      const amp = 0.1 * Math.sin(2 * TAU * u / CYC - i * 0.7);   // 振幅 ≈ 6 px，2 个波 / 周期
      const n = Math.max(8, Math.round(34 * cl));
      for (let j = 0; j < n; j++) {
        const lon = j * TAU / n, rr2 = cl * (1 + amp);
        dot(k, rot([rr2 * Math.cos(lon), Math.sin(lat), rr2 * Math.sin(lon)], spin, ORB.tilt), 0.8, Math.max(0, amp) * 4);
      }
    }
    orbLabel(k, 'Listening…');
  };

  // @element 08
  // 08 思考球·连接（state="connecting"）：球面节点依次连线，数据包沿连线流动，最后淡出复位
  CELLS[7] = (k, w, h, u) => {
    bg(k);
    const spin = TAU * u / CYC;
    const fade = 1 - inOut3(seg(u, 4.0, 4.8));
    for (const p of SPHERE) dot(k, rot(p, spin, ORB.tilt), 0.35);
    const E = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [0, 4], [2, 6], [3, 8]];
    const slerp = (a, b, t) => {
      const d = clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1), om = Math.acos(d);
      if (om < 1e-4) return a;
      const s1 = Math.sin((1 - t) * om) / Math.sin(om), s2 = Math.sin(t * om) / Math.sin(om);
      return [a[0] * s1 + b[0] * s2, a[1] * s1 + b[1] * s2, a[2] * s1 + b[2] * s2];
    };
    const P = q => [ORB.x + q[0] * ORB.r, ORB.y - q[1] * ORB.r];
    const lit = new Array(NODES.length).fill(0);
    E.forEach(([a, b], e) => {
      const g = out3(seg(u, 0.15 + e * 0.17, 0.5 + e * 0.17));   // 每条连线 0.35 秒画出，依次错开 0.17 秒
      if (g <= 0) return;
      lit[a] = Math.max(lit[a], 1); lit[b] = Math.max(lit[b], g);
      k.lineWidth = 1.2; k.beginPath();
      for (let i = 0; i <= 16; i++) {
        const q = rot(slerp(NODES[a], NODES[b], g * i / 16), spin, ORB.tilt), pt = P(q);
        k.strokeStyle = `rgba(236,236,241,${(0.25 + 0.4 * (q[2] + 1) / 2) * fade})`;
        if (i) k.lineTo(pt[0], pt[1]); else k.moveTo(pt[0], pt[1]);
      }
      k.stroke();
      if (u >= 2.4 && u < 4.0) {
        const t = ((u - 2.4) / 0.8 + e * 0.137) % 1;
        dot(k, rot(slerp(NODES[a], NODES[b], t), spin, ORB.tilt), fade, 0.6 * fade);
      }
    });
    NODES.forEach((n, i) => dot(k, rot(n, spin, ORB.tilt), 0.6, lit[i] * 0.55 * fade));
    orbLabel(k, 'Connecting sources…');
  };

  // @element 09
  // 09 思考球·写作（state="composing"）：三条起伏的点阵波带绕球流动
  CELLS[8] = (k, w, h, u) => {
    bg(k);
    const spin = TAU * u / CYC;
    for (const p of SPHERE) dot(k, rot(p, spin, ORB.tilt), 0.3);
    const bands = [[0.5, 0], [-0.45, TAU / 3], [1.15, 2 * TAU / 3]];   // [倾角, 相位]
    for (const [tilt, ph] of bands) {
      for (let j = 0; j < 72; j++) {
        const lon = j * TAU / 72;
        const glow = Math.max(0, Math.sin(lon - 2 * TAU * u / CYC + ph));
        for (const off of [-0.09, 0, 0.09]) {
          const lat = 0.32 * Math.sin(2 * lon + TAU * u / CYC + ph) + off, cl = Math.cos(lat);
          let p = [cl * Math.cos(lon), Math.sin(lat), cl * Math.sin(lon)];
          p = [p[0], p[1] * Math.cos(tilt) - p[2] * Math.sin(tilt), p[1] * Math.sin(tilt) + p[2] * Math.cos(tilt)];
          dot(k, rot(p, spin, ORB.tilt), off ? 0.55 : 0.85, glow * glow * 0.5);
        }
      }
    }
    orbLabel(k, 'Writing…');
  };

  // @element 10
  // 10 液态分裂菜单（liquid-gooey effect="morph"）：点「+」后三个操作按钮像液滴一样从按钮里被拉出、
  //    拉断成独立的圆，图标浮现；再点一次，三个圆被吸回并重新融成一个按钮
  CELLS[9] = (k, w, h, u) => {
    bg(k); grid(k);
    // 尺寸取自原版示例按比例放大 1.5 倍：按钮 40px → 半径 30/24，位移 (±54,-34)、(0,-64) → (±81,-51)、(0,-96)
    const cx = 269.5, cy = 156, R0 = 30, R1 = 24;
    const OFF = [[-81, -51], [0, -96], [81, -51]];
    const OPEN = 0.8, CLOSE = 3.0, DUR = 0.55, LAG = 0.04;          // 展开、收回各 550 ms，按钮依次错开 40 ms（原版 delay={i*40}）
    const prog = OFF.map((_, i) => {
      if (u < CLOSE) return backOut(seg(u, OPEN + i * LAG, OPEN + i * LAG + DUR));      // 回弹缓动，末端约 10% 冲过头
      return 1 - inOut3(seg(u, CLOSE + (2 - i) * LAG, CLOSE + (2 - i) * LAG + DUR));    // 收回：后出去的先回来
    });
    const pts = OFF.map(([dx, dy], i) => [cx + dx * prog[i], cy + dy * prog[i]]);
    // 主按钮在子按钮离开时被轻微拉扁，回弹后恢复（液体的体积感）
    const pull = Math.max(...prog.map(p => Math.sin(Math.PI * clamp(p))));
    const r0 = R0 * (1 - 0.06 * pull);
    // 液体：主按钮与三个子按钮的距离场做平滑并集；黏度 s 随距离递减，距离远了颈部自然拉细、断开
    const sdf = (x, y) => {
      let d = Math.hypot(x - cx, y - cy) - r0;
      pts.forEach(([px, py], i) => {
        const r = R1 * (0.55 + 0.45 * clamp(prog[i] * 1.6));      // 刚被拉出时小，离开后长到完整大小
        const di = Math.hypot(x - px, y - py) - r;
        d = smin(d, di, 22);
      });
      return d;
    };
    k.save(); k.shadowColor = 'rgba(0,0,0,0.45)'; k.shadowBlur = 14; k.shadowOffsetY = 4;
    k.fillStyle = C.goo; liquid(k, sdf, cx - 120, cy - 132, cx + 120, cy + 34, 2.5);
    k.restore();
    // 图标在液体之上单独绘制，保持清晰：「+」随展开旋转 45° 变成「×」
    const op = clamp(Math.max(...prog));
    k.save(); k.translate(cx, cy); k.rotate(Math.PI / 4 * op);
    k.strokeStyle = C.ink; k.lineWidth = 2.6; k.lineCap = 'round'; k.beginPath();
    k.moveTo(-9, 0); k.lineTo(9, 0); k.moveTo(0, -9); k.lineTo(0, 9); k.stroke(); k.restore();
    pts.forEach(([x, y], i) => {
      const a = clamp((prog[i] - 0.6) * 2.5); if (a <= 0) return;
      k.save(); k.globalAlpha = a; k.translate(x, y); k.scale(0.7 + 0.3 * a, 0.7 + 0.3 * a);
      k.strokeStyle = C.ink; k.lineWidth = 1.8; k.lineJoin = 'round'; k.lineCap = 'round'; k.beginPath();
      if (i === 0) { k.moveTo(-6, -8); k.lineTo(2, -8); k.lineTo(6, -4); k.lineTo(6, 8); k.lineTo(-6, 8); k.closePath(); k.moveTo(2, -8); k.lineTo(2, -4); k.lineTo(6, -4); }  // 新文件
      if (i === 1) { k.rect(-8, -7, 16, 14); k.moveTo(-8, 4); k.lineTo(-3, -1); k.lineTo(1, 3); k.lineTo(4, 0); k.lineTo(8, 4); k.moveTo(5, -3.5); k.arc(4, -3.5, 1.2, 0, TAU); }  // 图片
      if (i === 2) { k.moveTo(-8, -6); k.lineTo(-2, -6); k.lineTo(0, -3.5); k.lineTo(8, -3.5); k.lineTo(8, 7); k.lineTo(-8, 7); k.closePath(); }  // 文件夹
      k.stroke(); k.restore();
    });
    // 触发：指针移到「+」上点击（0.55 s 与 2.75 s 按下），点击处出现涟漪
    const hx = cx + 6, hy = cy + 8;
    const away = [cx + 120, cy + 34];
    const tIn = inOut3(seg(u, 0.15, 0.55)), tOut = inOut3(seg(u, 1.5, 2.0)), tIn2 = inOut3(seg(u, 2.35, 2.75)), tOut2 = inOut3(seg(u, 3.6, 4.2));
    let m = u < 1.5 ? tIn : u < 2.35 ? 1 - tOut : u < 3.6 ? tIn2 : 1 - tOut2;
    const px = mix(away[0], hx, m), py = mix(away[1], hy, m);
    const press = Math.max(1 - Math.abs(u - 0.68) / 0.12, 1 - Math.abs(u - 2.88) / 0.12, 0);
    ripple(k, cx, cy, seg(u, 0.7, 1.3)); ripple(k, cx, cy, seg(u, 2.9, 3.5));
    cursor(k, px, py, press);
  };

  // @element 11
  // 11 液态拖尾（effect="move"）：分段控件的指示块移动时拉长，身后拖出液滴尾巴
  CELLS[10] = (k, w, h, u) => {
    bg(k); grid(k);
    const tx = 125.5, ty = 82, TW = 288, TH = 44, step = 96, x0 = tx + 48;
    const MOVES = [[0.1, 0.55, 0, 1], [1.3, 1.75, 1, 2], [2.5, 2.95, 2, 1], [3.7, 4.15, 1, 0]];   // 每 1.2 秒移动一次，位移 96 px
    const pos = t => { t = ((t % CYC) + CYC) % CYC; let s = 0; for (const [a, b, f, g] of MOVES) { if (t >= a) s = mix(f, g, inOut3(seg(t, a, b))); } return s; };
    const s = pos(u), hx = x0 + step * s;
    const v = (pos(u + 0.01) - pos(u - 0.01)) / 0.02 * step;   // px/s
    const sp = clamp(Math.abs(v) / 320), dir = Math.sign(v) || 1;
    k.fillStyle = C.panel; rr(k, tx, ty, TW, TH, TH / 2); k.fill();
    k.strokeStyle = C.line; k.lineWidth = 1; rr(k, tx + 0.5, ty + 0.5, TW - 1, TH - 1, TH / 2); k.stroke();
    const PW = 84 * (1 + 0.25 * sp), PH = 34 * (1 - 0.12 * sp);   // 速度越快越扁长（stretch）
    const lag = x0 + step * pos(u - 0.09);                       // 尾巴滞后 0.09 秒（trail）
    const tailR = 6 + 10 * sp, tailX = lag - dir * (PW / 2 - 10);
    const endX = hx - dir * (PW / 2 - PH / 2);
    k.fillStyle = C.goo;
    rr(k, hx - PW / 2, ty + TH / 2 - PH / 2, PW, PH, PH / 2); k.fill();
    if (sp > 0.02) { neck(k, endX, ty + TH / 2, PH / 2, tailX, ty + TH / 2, tailR, PH / 2 + tailR + 40); disc(k, tailX, ty + TH / 2, tailR); }
    ['Chat', 'Search', 'Agents'].forEach((lab, i) => {
      const lx = x0 + step * i, on = clamp(1 - Math.abs(lx - hx) / 46);
      txt(k, lab, lx, ty + TH / 2 + 1, `600 14px ${FONT}`, on > 0.5 ? C.ink : C.muted, 'center');
    });
  };

  // @element 12
  // 12 液态弯曲（effect="bend"）：卡片被左右拖动，卡身向运动反方向弯曲，速度越快弯得越多
  CELLS[11] = (k, w, h, u) => {
    bg(k); grid(k);
    const th = TAU * u / CYC, cx = 269.5 + 90 * Math.sin(th), cy = 104;
    const b = -16 * Math.cos(th);                             // 弯曲量与速度成正比，最大约 9 px
    const W = 170, H = 100, r = 16, x0 = cx - W / 2, x1 = cx + W / 2, y0 = cy - H / 2, y1 = cy + H / 2;
    k.fillStyle = 'rgba(0,0,0,0.35)'; k.beginPath(); k.ellipse(cx, y1 + 14, W * 0.42, 6, 0, 0, TAU); k.fill();
    k.fillStyle = C.goo; k.beginPath();
    k.moveTo(x0 + r, y0); k.lineTo(x1 - r, y0);
    k.quadraticCurveTo(x1, y0, x1 + b * 0.15, y0 + r);
    k.quadraticCurveTo(x1 + b, cy, x1 + b * 0.15, y1 - r);
    k.quadraticCurveTo(x1, y1, x1 - r, y1); k.lineTo(x0 + r, y1);
    k.quadraticCurveTo(x0, y1, x0 + b * 0.15, y1 - r);
    k.quadraticCurveTo(x0 + b, cy, x0 + b * 0.15, y0 + r);
    k.quadraticCurveTo(x0, y0, x0 + r, y0); k.closePath(); k.fill();
    // 卡片内容随弯曲轻微偏移（中间行偏得最多）
    const row = (yy, f) => cx + b * 0.4 * f;
    k.fillStyle = C.ink; k.beginPath(); k.arc(row(0, 0.6) - 52, cy - 14, 13, 0, TAU); k.fill();
    k.fillStyle = 'rgba(23,23,29,0.75)'; rr(k, row(0, 0.6) - 30, cy - 21, 82, 7, 3.5); k.fill();
    k.fillStyle = 'rgba(23,23,29,0.35)'; rr(k, row(0, 0.9) - 30, cy - 8, 60, 6, 3); k.fill();
    rr(k, row(0, 0.9) - 65, cy + 14, 130, 6, 3); k.fill(); rr(k, row(0, 0.6) - 65, cy + 26, 96, 6, 3); k.fill();
    // 拖动手势：卡片顶部的指针
    k.fillStyle = 'rgba(236,236,241,0.9)'; k.beginPath(); k.arc(cx, y0 - 2, 5, 0, TAU); k.fill();
    k.strokeStyle = 'rgba(236,236,241,0.35)'; k.lineWidth = 1.5; k.beginPath(); k.arc(cx, y0 - 2, 10, 0, TAU); k.stroke();
  };

  // @element 13
  // 13 旋转光芒（改写自 KittenJam #227，Hannah，MIT）：标题后 12 条放射光纹（各占间距的 45%）绕中心匀速旋转，
  // 每 4.8 秒正好转过一个光纹间距（30°），画面无缝；径向渐变让中心最亮、半径 300px 处淡入背景；标题轻微呼吸（亮度 ±6%）。
  const SBR_N = 12, SBR_DUTY = 0.45, SBR_R = 300, SBR_CX = 269.5, SBR_CY = 104;
  CELLS[12] = (k, w, h, u) => {
    bg(k);
    const step = TAU / SBR_N, rot = step * u / CYC;
    k.save(); k.translate(SBR_CX, SBR_CY); k.rotate(rot);
    k.fillStyle = 'rgba(255,214,120,0.16)';
    for (let i = 0; i < SBR_N; i++) {
      const a = i * step; k.beginPath(); k.moveTo(0, 0); k.arc(0, 0, SBR_R, a, a + step * SBR_DUTY); k.closePath(); k.fill();
    }
    k.restore();
    // 遮罩：中心透明、向外渐变到底色，让光纹往外淡出
    const g = k.createRadialGradient(SBR_CX, SBR_CY, 0, SBR_CX, SBR_CY, SBR_R);
    g.addColorStop(0, 'rgba(14,14,18,0)'); g.addColorStop(0.35, 'rgba(14,14,18,0.35)'); g.addColorStop(1, 'rgba(14,14,18,1)');
    k.fillStyle = g; k.fillRect(0, 0, CW, CH);
    const core = k.createRadialGradient(SBR_CX, SBR_CY, 0, SBR_CX, SBR_CY, 120);
    core.addColorStop(0, 'rgba(255,220,140,0.35)'); core.addColorStop(1, 'rgba(255,220,140,0)');
    k.fillStyle = core; k.fillRect(0, 0, CW, CH);
    const br = 0.94 + 0.06 * Math.sin(TAU * u / CYC);
    k.save(); k.shadowColor = 'rgba(255,200,90,0.6)'; k.shadowBlur = 18;
    txt(k, '年度大奖', SBR_CX, SBR_CY - 4, `800 40px ${FONT}`, `rgba(255,236,190,${br})`, 'center'); k.restore();
    txt(k, 'WINNER 2026', SBR_CX, SBR_CY + 32, `600 12px ${FONT}`, C.muted, 'center');
  };
  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});
