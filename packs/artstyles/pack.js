/* Motion Prompt · pack "artstyles" · MIT License (c) 2026 alchaincyf (花叔) · https://github.com/alchaincyf/huashu-art-motion */
MotionPrompt.pack('artstyles', function () {
  // @kit
  // 艺术史画风（每格 539x208、6.4 秒周期；每格都是只依赖时间 u 的纯函数）
  // 改写自 huashu-art-motion（花叔）的场景与风格配方：取其算法思路（可变线宽鞭线、半透明切面、流线笔触等），
  // 缩到小格子里重新构图；不使用原作的笔画数据、字体和卡通形象。
  // 0–5.4 秒画到成品并带一点循环动作，5.4–6.0 秒内容淡出，只剩底色；6.0–6.4 秒保持底色，与 u=0 相接。
  // 原作用离屏缓存和逐像素遮罩，格子里不能这样做：坐标在定义时算好，金箔改用渐变加高光带。
  const CW = 539, CH = 208;
  const CYC = 6.4;
  const SHOW = 5.4;
  const TAU = Math.PI * 2;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const seg = (u, a, b) => clamp((u - a) / (b - a));
  const inOut3 = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const out3 = t => 1 - Math.pow(1 - t, 3);
  const backOut = (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
  const hash = i => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
  const rnd = (i, j = 0) => hash(i * 127.1 + j * 311.7);
  const resetK = u => inOut3(seg(u, SHOW, SHOW + 0.6));
  const vis = u => 1 - resetK(u);            // 内容（底色以外）的整体不透明度
  // 循环动作的渐入系数：从 t0 起 0.4 秒内由 0 升到 1，避免动作突然开始
  const ease = (u, t0) => inOut3(seg(u, t0, t0 + 0.4));

  const hex3 = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const rgba = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const mix3 = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  function tracePts(k, pts, close = true) { pts.forEach((p, i) => (i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1]))); if (close) k.closePath(); }
  function fillPts(k, pts) { k.beginPath(); tracePts(k, pts); k.fill(); }
  function strokePts(k, pts, close = false) { k.beginPath(); tracePts(k, pts, close); k.stroke(); }
  const polyLen = pts => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; };
  // 折线按长度画出前 t（0..1）
  function partial(k, pts, t) {
    if (t <= 0 || pts.length < 2) return;
    let left = clamp(t) * polyLen(pts);
    k.beginPath(); k.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length && left > 0; i++) {
      const a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (d <= left) { k.lineTo(b[0], b[1]); left -= d; }
      else { const f = left / d; k.lineTo(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f); left = 0; }
    }
    k.stroke();
  }
  // Catmull-Rom 加密：控制点之间各插 n 个点，得到平滑曲线（同原作 dense）
  function dense(pts, n = 8) {
    const o = [], N = pts.length, g = i => pts[Math.max(0, Math.min(N - 1, i))];
    for (let i = 0; i < N - 1; i++) {
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      for (let s = 0; s < n; s++) {
        const t = s / n, t2 = t * t, t3 = t2 * t;
        o.push([0, 1].map(d => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
      }
    }
    o.push(pts[N - 1]);
    return o;
  }
  // 可变线宽路径：沿点列两侧各偏移 w(q)/2，返回闭合多边形的点（新艺术的粗细变化勾线靠它）。
  // t<1 时只取前一段，线宽仍按整条线的位置 q 计算，所以画出来的过程中粗细不会跳变。
  function ribbon(pts, wf, t = 1) {
    const n = pts.length, m = Math.max(2, Math.ceil(clamp(t) * (n - 1)) + 1), L = [], R = [];
    for (let i = 0; i < Math.min(m, n); i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const w = wf(i / (n - 1)) / 2;
      L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
    }
    return L.concat(R.reverse());
  }
  const swellW = (wmax, wend = 0.8) => q => wend + (wmax - wend) * Math.sin(Math.PI * q);   // 两头尖、中间粗
  // 向内收的螺旋点列（鞭线末端的卷曲）
  function spiral(cx, cy, r0, a0, turns, dir = 1, n = 24) {
    const o = [];
    for (let i = 0; i <= n; i++) { const q = i / n, a = a0 + dir * q * turns * TAU, r = r0 * (1 - q * 0.85); o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return o;
  }
  // 切面：沿多边形内一条方向由亮到暗的半透明渐变（立体主义的明暗切面，同原作 plane）
  function plane(k, pts, col, alpha, dir, dark = 0.4, light = 0.25) {
    const a = pts[0], b = pts[dir % pts.length === 0 ? 1 : dir % pts.length];
    const g = k.createLinearGradient(a[0], a[1], b[0], b[1]);
    g.addColorStop(0, rgba(mix3(col, [250, 244, 228], light), alpha));
    g.addColorStop(0.55, rgba(col, alpha));
    g.addColorStop(1, rgba(mix3(col, [45, 35, 25], dark), alpha));
    k.fillStyle = g; fillPts(k, pts);
  }
  // 底色加固定种子的噪点
  function grainBg(k, col, dot, n, seed) {
    k.fillStyle = col; k.fillRect(0, 0, CW, CH);
    k.fillStyle = dot;
    for (let i = 0; i < n; i++) k.fillRect(rnd(i, seed) * CW, rnd(i, seed + 1) * CH, 1 + rnd(i, seed + 2) * 1.5, 1);
  }
  const CELLS = [];
  const INK = '#1E1A16';
  // 在多边形列表上按顺序画轮廓：第 i 个在 t0+i*step 起、用 dur 秒画完
  function outlines(k, list, u, t0, step, dur) { list.forEach((p, i) => partial(k, p.concat([p[0]]), seg(u, t0 + i * step, t0 + i * step + dur))); }

  // @element 01
  // 洞穴岩画：凹凸的赭色岩壁上，炭点沿野牛轮廓一点点戳出来，再抹上红赭石，旁边喷出手印；之后火光摇曳，野牛的腿在两种姿势间交替，像在奔跑
  // 对应原作 scenes/01_cave.js（浮雕岩壁、炭点毛边、赭石、两姿势交替、火光）；岩壁改成定义时算好的明暗斑块
  {
    const ROCK = Array.from({ length: 70 }, (_, i) => [rnd(i, 1) * CW, rnd(i, 2) * CH, 14 + rnd(i, 3) * 40, 6 + rnd(i, 4) * 18, rnd(i, 5) * Math.PI, rnd(i, 6) < 0.5]);
    const CRACKS = Array.from({ length: 7 }, (_, i) => {
      let x = rnd(i, 11) * CW, y = rnd(i, 12) * CH; const o = [[x, y]];
      for (let s = 0; s < 6; s++) { x += 8 + rnd(i, 13 + s) * 14; y += (rnd(i, 20 + s) - 0.5) * 16; o.push([x, y]); }
      return o;
    });
    const BISON = dense([[172, 100], [190, 80], [222, 66], [252, 56], [282, 60], [302, 76], [318, 98], [324, 116], [312, 126], [298, 120], [290, 132], [258, 138], [220, 136], [190, 132], [174, 118], [172, 100]], 6);
    const BELLY = dense([[196, 128], [230, 120], [270, 124], [290, 132], [258, 138], [220, 136], [196, 128]], 4);
    // 炭点：沿轮廓每 2.4 px 一点，带一点抖动形成毛边
    const DOTS = [];
    for (let i = 1; i < BISON.length; i++) {
      const p = BISON[i - 1], q = BISON[i], d = Math.hypot(q[0] - p[0], q[1] - p[1]);
      for (let s = 0; s < d; s += 2.4) { const f = s / d, j = DOTS.length; DOTS.push([mix(p[0], q[0], f) + (rnd(j, 31) - 0.5) * 2.4, mix(p[1], q[1], f) + (rnd(j, 32) - 0.5) * 2.4, 1 + rnd(j, 33) * 1.3]); }
    }
    const HORN = dense([[298, 70], [312, 60], [308, 48]], 4), TAIL = dense([[174, 104], [162, 112], [166, 126]], 4);
    const LEGS = [[290, 128, 9], [278, 134, -6], [208, 134, -9], [194, 130, 6]];   // 腿根 x、y，姿势 A 时腿尖的水平偏移
    // 手印：手形本身留空，周围喷上赭石点。几只手大小、角度、颜色各不同：[中心 x, y, 放大倍数, 旋转, 颜色]
    const HANDS = [
      [446, 100, 1.9, 0, 'rgba(150,52,30,0.62)'],
      [352, 44, 0.95, -0.35, 'rgba(150,52,30,0.6)'],
      [500, 170, 0.9, 0.5, 'rgba(50,30,20,0.55)'],
      [50, 66, 1.15, -0.2, 'rgba(150,52,30,0.58)'],
      [112, 160, 0.95, 0.45, 'rgba(120,44,26,0.58)'],
    ];
    // 点是否落在第 hi 只手的手形里（先转到手的局部坐标）
    const inHand = (hi, x, y) => {
      const [cx, cy, sc, rot] = HANDS[hi], c0 = Math.cos(-rot), s0 = Math.sin(-rot);
      const ox = (x - cx) / sc, oy = (y - cy) / sc, dx = ox * c0 - oy * s0, dy = ox * s0 + oy * c0;
      if ((dx * dx) / 144 + ((dy - 8) * (dy - 8)) / 196 < 1) return true;            // 手掌
      return [[-13, -4, -0.7], [-6, -14, -0.25], [1, -16, 0], [8, -14, 0.25], [14, -6, 0.6]].some(([fx, fy, r]) => {   // 五指
        const c = Math.cos(-r), s = Math.sin(-r), lx = (dx - fx) * c - (dy - fy) * s, ly = (dx - fx) * s + (dy - fy) * c;
        return Math.abs(lx) < 3.6 && ly > -12 && ly < 6;
      });
    };
    // 喷点：网格间距和点大小随手的大小缩放；范围半径要大于指尖到中心的距离。
    // 密度看到手形的距离（贴着手形最密、往外变稀），这样小手的指缝也喷得满，手形看得出来；手形里不喷
    const nearHand = (hi, x, y, d) => inHand(hi, x + d, y) || inHand(hi, x - d, y) || inHand(hi, x, y + d) || inHand(hi, x, y - d);
    const SPRAYS = HANDS.map(([cx, cy, sc], hi) => {
      const SR = Math.round(34 * sc), st = Math.max(1.3, 2 * sc / 1.9), oy = -14 * sc / 1.9, out = [];
      for (let gy = -SR, i = hi * 20000; gy <= SR; gy += st) for (let gx = -SR; gx <= SR; gx += st, i++) {
        const x = cx + gx + (rnd(i, 41) - 0.5) * st, y = cy + oy + gy + (rnd(i, 42) - 0.5) * st, r = Math.hypot(x - cx, y - cy - oy);
        if (r >= SR || inHand(hi, x, y)) continue;
        const edge = nearHand(hi, x, y, 4 * sc) ? 0.5 : 0;
        if (rnd(i, 43) < 1.1 - r / SR + edge) out.push([x, y, (0.6 + rnd(i, 44) * 0.8) * Math.max(0.7, sc / 1.9), r]);
      }
      return out.sort((p, q) => q[3] - p[3]);              // 先喷外圈，最后贴着手指
    });
    CELLS[0] = (k, w, h, u) => {
      const g = k.createLinearGradient(0, 0, 0, CH); g.addColorStop(0, '#C9A072'); g.addColorStop(1, '#9A714B');
      k.fillStyle = g; k.fillRect(0, 0, CW, CH);
      ROCK.forEach(([x, y, rx, ry, r, light]) => { k.fillStyle = light ? 'rgba(240,215,175,0.16)' : 'rgba(70,45,25,0.14)'; k.beginPath(); k.ellipse(x, y, rx, ry, r, 0, TAU); k.fill(); });
      k.strokeStyle = 'rgba(60,40,25,0.3)'; k.lineWidth = 1; CRACKS.forEach(c => strokePts(k, c));
      const a = vis(u); k.globalAlpha = a;
      // 红赭石（2.0–2.8 秒）
      const ot = seg(u, 2.0, 2.8);
      if (ot > 0) { k.globalAlpha = a * ot * 0.8; k.fillStyle = '#A8452A'; fillPts(k, BISON); k.fillStyle = 'rgba(60,25,15,0.35)'; fillPts(k, BELLY); k.globalAlpha = a; }
      // 炭点轮廓（0.3–1.6 秒）
      const n = Math.floor(seg(u, 0.3, 1.6) * DOTS.length);
      k.fillStyle = '#231A14';
      for (let i = 0; i < n; i++) { const d = DOTS[i]; k.beginPath(); k.arc(d[0], d[1], d[2], 0, TAU); k.fill(); }
      // 角、尾、腿（1.6–2.0 秒）；3.4 秒后每 0.22 秒换一次姿势
      const lt = seg(u, 1.6, 2.0), pose = u > 3.4 && Math.floor((u - 3.4) / 0.22) % 2 ? -1 : 1;
      k.strokeStyle = '#231A14'; k.lineCap = 'round';
      if (lt > 0) {
        k.lineWidth = 3; partial(k, HORN, lt); k.lineWidth = 2; partial(k, TAIL, lt);
        k.lineWidth = 4; LEGS.forEach(([x, y, o]) => partial(k, [[x, y], [x + o * pose, 172]], lt));
      }
      // 手印（大手 2.6–3.2 秒，其余每只晚 0.18 秒，各喷 0.45 秒）和一排赭石圆点（3.2–3.4 秒）
      SPRAYS.forEach((sp, hi) => {
        const t0 = hi ? 2.75 + hi * 0.18 : 2.6, sn = Math.floor(seg(u, t0, t0 + (hi ? 0.45 : 0.6)) * sp.length);
        k.fillStyle = HANDS[hi][4];
        for (let i = 0; i < sn; i++) { const s = sp[i]; k.fillRect(s[0] - s[2], s[1] - s[2], s[2] * 2, s[2] * 2); }
      });
      for (let i = 0; i < 5; i++) { const t = seg(u, 3.2 + i * 0.04, 3.28 + i * 0.04); if (t > 0) { k.fillStyle = '#A8452A'; k.globalAlpha = a * t; k.beginPath(); k.arc(390 + i * 14, 168 - i * 3, 3.2, 0, TAU); k.fill(); } }
      k.globalAlpha = a;
      // 火光（3.4 秒后）：左下角暖光忽明忽暗
      const f = ease(u, 3.4) * (0.6 + 0.25 * Math.sin(u * 7.3) + 0.15 * Math.sin(u * 17.1));
      if (f > 0) {
        const fg = k.createRadialGradient(40, 220, 10, 40, 220, 460);
        fg.addColorStop(0, `rgba(255,170,80,${0.32 * f})`); fg.addColorStop(1, 'rgba(255,170,80,0)');
        k.fillStyle = fg; k.fillRect(0, 0, CW, CH);
      }
      k.globalAlpha = 1;
    };
  }

  // @element 02
  // 埃及墓室壁画：先画出上下的色带，墨线勾出侧脸、正面眼、正面双肩的行走人物，再平涂肤色、白裙和项圈，右侧象形文字一格格出现，最后太阳光线伸出小手；之后小手一开一合，水波符号流动
  // 对应原作 scenes/02_egypt.js（侧脸正面眼、象形文字栏、阿顿光线小手、水波符号）
  {
    const SKIN = '#B5572E', WHITE = '#F4EEDC', BLUE = '#2C5E8C', RED = '#B8432A', YEL = '#D9A93A';
    const WIG = [[186, 44], [204, 40], [214, 46], [212, 62], [200, 74], [186, 72], [182, 58]];
    const FACE = [[206, 48], [216, 52], [218, 58], [222, 62], [217, 64], [218, 68], [214, 72], [206, 74], [202, 68]];
    const NECK = [[201, 70], [211, 70], [211, 82], [201, 82]];
    const TORSO = [[184, 80], [226, 80], [220, 104], [210, 120], [196, 120], [188, 104]];
    const ARM_F = [[220, 82], [230, 84], [242, 110], [246, 120], [240, 122], [234, 112]];
    const ARM_B = [[186, 82], [192, 86], [184, 112], [182, 122], [176, 120], [178, 110]];
    const KILT = [[194, 118], [214, 118], [222, 150], [188, 150]];
    const LEG_F = [[208, 150], [216, 150], [228, 184], [236, 190], [222, 190], [220, 186]];
    const LEG_B = [[192, 150], [200, 150], [194, 186], [198, 190], [184, 190], [186, 186]];
    const FILLS = [[ARM_B, SKIN], [LEG_B, SKIN], [LEG_F, SKIN], [TORSO, SKIN], [ARM_F, SKIN], [KILT, WHITE], [NECK, SKIN], [FACE, SKIN], [WIG, INK]];
    const OUTL = [WIG, FACE, TORSO, ARM_F, ARM_B, KILT, LEG_F, LEG_B];
    const COLS = [433, 463, 493];
    const GLYPHS = [0, 1, 3, 6, 2, 5, 4, 1, 0, 3, 2, 6, 1, 5, 4];   // 0 眼 1 水波 2 生命符 3 太阳 4 面包 5 芦苇 6 鸟
    const SUN = [340, 40];
    const RAYS = Array.from({ length: 7 }, (_, i) => Math.PI * (0.32 + i * 0.06));
    function glyph(k, type, x, y, flow) {
      k.strokeStyle = INK; k.fillStyle = INK; k.lineWidth = 1.4;
      if (type === 0) { k.beginPath(); k.ellipse(x, y, 7, 3, 0, 0, TAU); k.stroke(); k.beginPath(); k.arc(x, y, 1.6, 0, TAU); k.fill(); strokePts(k, [[x - 2, y + 3], [x - 4, y + 8], [x - 1, y + 9]]); }
      else if (type === 1) {
        k.save(); k.beginPath(); k.rect(x - 9, y - 6, 18, 12); k.clip(); k.strokeStyle = BLUE;
        for (let r = -1; r <= 1; r++) { k.beginPath(); for (let s = 0; s <= 12; s++) { const xx = x - 12 + s * 2 + (flow % 4); k.lineTo(xx, y + r * 4 + (s % 2 ? -1.6 : 1.6)); } k.stroke(); }
        k.restore();
      } else if (type === 2) { k.beginPath(); k.ellipse(x, y - 6, 3.5, 5, 0, 0, TAU); k.stroke(); strokePts(k, [[x - 7, y - 1], [x + 7, y - 1]]); strokePts(k, [[x, y - 1], [x, y + 10]]); }
      else if (type === 3) { k.fillStyle = RED; k.beginPath(); k.arc(x, y, 5.5, 0, TAU); k.fill(); k.stroke(); k.fillStyle = INK; k.beginPath(); k.arc(x, y, 1.3, 0, TAU); k.fill(); }
      else if (type === 4) { k.fillStyle = BLUE; k.beginPath(); k.arc(x, y + 4, 7, Math.PI, 0); k.closePath(); k.fill(); k.stroke(); }
      else if (type === 5) { k.fillStyle = '#5E8A3A'; k.beginPath(); k.ellipse(x, y, 2.6, 9, 0.2, 0, TAU); k.fill(); k.stroke(); }
      else { k.beginPath(); k.ellipse(x, y + 1, 6, 3.6, -0.2, 0, TAU); k.fill(); k.beginPath(); k.arc(x + 5, y - 4, 2.6, 0, TAU); k.fill(); strokePts(k, [[x + 7, y - 4], [x + 10, y - 3]]); strokePts(k, [[x - 1, y + 4], [x - 2, y + 10]]); strokePts(k, [[x + 2, y + 4], [x + 3, y + 10]]); }
    }
    function band(k, y, t, dir) {      // 三色带，按 dir 从左或从右展开
      const wdt = CW * t, x0 = dir > 0 ? 0 : CW - wdt;
      [BLUE, RED, YEL].forEach((c, i) => { k.fillStyle = c; k.fillRect(x0, y + i * 3, wdt, 3); });
    }
    CELLS[1] = (k, w, h, u) => {
      grainBg(k, '#E8D6AE', 'rgba(150,110,60,0.10)', 500, 5);
      const a = vis(u); k.globalAlpha = a;
      const bt = inOut3(seg(u, 0.3, 0.9));
      if (bt > 0) { band(k, 10, bt, 1); band(k, 194, bt, -1); k.fillStyle = INK; k.fillRect(0, 190, CW * bt, 1.5); }
      // 平涂（2.0–2.6 秒）
      const ft = seg(u, 2.0, 2.6);
      if (ft > 0) { k.globalAlpha = a * ft; FILLS.forEach(([p, c]) => { k.fillStyle = c; fillPts(k, p); }); k.globalAlpha = a; }
      // 墨线（0.9–2.2 秒）
      k.strokeStyle = INK; k.lineWidth = 1.3; k.lineJoin = 'round';
      outlines(k, OUTL, u, 0.9, 0.14, 0.3);
      // 正面眼、项圈、裙褶（2.4–2.8 秒）
      const ct = seg(u, 2.4, 2.8);
      if (ct > 0) {
        k.globalAlpha = a * ct;
        [[BLUE, 8], [RED, 11], [YEL, 14]].forEach(([c, r]) => { k.strokeStyle = c; k.lineWidth = 3; k.beginPath(); k.arc(206, 80, r, 0.15, Math.PI - 0.15); k.stroke(); });
        k.fillStyle = WHITE; k.beginPath(); k.ellipse(212, 57, 3.4, 1.5, 0, 0, TAU); k.fill();
        k.fillStyle = INK; k.beginPath(); k.arc(212.6, 57, 1.2, 0, TAU); k.fill();
        k.strokeStyle = INK; k.lineWidth = 1; strokePts(k, [[208, 56], [218, 56.5]]);
        k.lineWidth = 0.7; for (let i = 1; i < 5; i++) strokePts(k, [[194 + i * 4, 120], [190 + i * 7, 150]]);
        k.globalAlpha = a;
      }
      // 栏线（2.8–3.0 秒）和象形文字（2.8–3.6 秒）
      const lt = seg(u, 2.8, 3.0);
      k.strokeStyle = INK; k.lineWidth = 1;
      [418, 448, 478, 508].forEach(x => partial(k, [[x, 24], [x, 186]], lt));
      const flow = ease(u, 4.0) * (u - 4.0) * 6;
      GLYPHS.forEach((g, i) => {
        const t = seg(u, 2.9 + i * 0.045, 3.05 + i * 0.045);
        if (t <= 0) return;
        k.globalAlpha = a * t; glyph(k, g, COLS[i % 3], 40 + Math.floor(i / 3) * 32, g === 1 ? flow : 0);
      });
      k.globalAlpha = a;
      // 太阳（3.4–3.6 秒）和光线小手（3.6–4.0 秒）；4.0 秒后小手开合
      const st = backOut(seg(u, 3.4, 3.6), 1.4);
      if (st > 0) { k.fillStyle = RED; k.strokeStyle = INK; k.lineWidth = 1.2; k.beginPath(); k.arc(SUN[0], SUN[1], 14 * st, 0, TAU); k.fill(); k.stroke(); }
      const rt = seg(u, 3.6, 4.0), op = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin((u - 4.0) * 5)) * ease(u, 4.0);
      if (rt > 0) RAYS.forEach((an, i) => {
        const L = 16 + 64 * rt, ex = SUN[0] + Math.cos(an) * L, ey = SUN[1] + Math.sin(an) * L;
        k.strokeStyle = RED; k.lineWidth = 1.2; strokePts(k, [[SUN[0] + Math.cos(an) * 16, SUN[1] + Math.sin(an) * 16], [ex, ey]]);
        k.lineWidth = 1.4; k.strokeStyle = SKIN;
        for (let f = -1; f <= 1; f++) strokePts(k, [[ex, ey], [ex + Math.cos(an + f * op) * 4.5, ey + Math.sin(an + f * op) * 4.5]]);
      });
      k.globalAlpha = 1;
    };
  }

  // @element 03
  // 希腊黑绘陶瓶：陶土色瓶面上先画出上下的回纹带，再用黑釉剪影铺出帆船，然后用刻线刮出帆格和船板，再点上紫红色带和白点；之后两条回纹带反向滚动，船随波起伏，海豚跃出
  // 对应原作 scenes/03_greek.js（黑剪影 + 陶土色刻线 + 紫红带白点、回纹反向滚动、船起伏、海豚跃）
  {
    const BLACK = '#1B120D', CLAY = '#D4844A';
    const HULL = [[180, 120], [360, 120], [350, 136], [330, 142], [210, 142], [192, 136]];
    const RAM = [[356, 120], [380, 129], [350, 134]];
    const STERN = dense([[192, 122], [178, 110], [174, 96], [182, 92], [186, 104], [200, 120]], 4);
    const SAIL = [[236, 50], [304, 50], [300, 100], [240, 100]];
    const OARS = Array.from({ length: 8 }, (_, i) => [[206 + i * 18, 136], [194 + i * 18, 160]]);
    const INCISE = [[[256, 50], [254, 100]], [[270, 50], [270, 100]], [[284, 50], [286, 100]], [[238, 66], [302, 66]], [[239, 83], [301, 83]], [[200, 130], [344, 130]], [[214, 137], [330, 137]]];
    const DOLPHIN = dense([[-14, 0], [-6, -4], [6, -5], [14, -1], [18, 0], [14, 2], [4, 4], [-8, 3], [-14, 0]], 3);
    const meander = (k, y0, off) => {
      k.beginPath();
      for (let x = -36 + (((off % 18) + 18) % 18); x < CW + 18; x += 18) {
        tracePts(k, [[x, y0 + 12], [x, y0], [x + 12, y0], [x + 12, y0 + 8], [x + 5, y0 + 8], [x + 5, y0 + 4], [x + 8, y0 + 4]], false);
        k.moveTo(x, y0 + 12); k.lineTo(x + 18, y0 + 12);
      }
      k.stroke();
    };
    CELLS[2] = (k, w, h, u) => {
      const g = k.createLinearGradient(0, 0, CW, 0);
      g.addColorStop(0, '#9E5226'); g.addColorStop(0.5, '#D4844A'); g.addColorStop(1, '#9E5226');
      k.fillStyle = g; k.fillRect(0, 0, CW, CH);
      const a = vis(u); k.globalAlpha = a;
      // 回纹带（0.3–1.2 秒），3.6 秒后上下反向滚动
      const mt = inOut3(seg(u, 0.3, 1.2)), off = ease(u, 3.6) * (u - 3.6) * 14;
      k.strokeStyle = BLACK; k.lineWidth = 1.8; k.lineCap = 'butt';
      [[12, -off, 0], [182, off, CW * (1 - mt)]].forEach(([y, o, x0]) => {
        if (mt <= 0) return;
        k.save(); k.beginPath(); k.rect(y === 12 ? 0 : x0, 0, CW * mt, CH); k.clip();
        meander(k, y, o); k.fillStyle = BLACK; k.fillRect(0, y - 4, CW, 1.6); k.fillRect(0, y + 15, CW, 1.6);
        k.restore();
      });
      // 船：3.6 秒后起伏
      const bob = ease(u, 3.6);
      k.save();
      k.translate(270, 120); k.rotate(0.02 * bob * Math.sin((u - 3.6) * 2.6)); k.translate(-270, -120 + 2.5 * bob * Math.sin((u - 3.6) * 2.6 + 0.8));
      // 黑釉剪影（1.2–2.0 秒）
      const st = seg(u, 1.2, 2.0);
      if (st > 0) {
        k.globalAlpha = a * st; k.fillStyle = BLACK; k.strokeStyle = BLACK;
        fillPts(k, HULL); fillPts(k, RAM); fillPts(k, STERN.concat([[200, 130]])); fillPts(k, SAIL);
        k.lineWidth = 3; strokePts(k, [[270, 120], [270, 40]]); k.lineWidth = 2; strokePts(k, [[228, 50], [312, 50]]);
        k.lineWidth = 1.8; OARS.forEach(o => strokePts(k, o)); strokePts(k, [[196, 128], [184, 158]]);
        k.globalAlpha = a;
      }
      // 刻线（2.0–2.8 秒）
      k.strokeStyle = CLAY; k.lineWidth = 0.9;
      INCISE.forEach((l, i) => partial(k, l, seg(u, 2.0 + i * 0.1, 2.2 + i * 0.1)));
      const et = seg(u, 2.6, 2.8);
      if (et > 0) { k.globalAlpha = a * et; k.beginPath(); k.arc(360, 126, 2.4, 0, TAU); k.stroke(); k.globalAlpha = a; }
      // 紫红色带和白点（2.8–3.4 秒）
      const pt = seg(u, 2.8, 3.4);
      if (pt > 0) {
        k.globalAlpha = a * pt; k.fillStyle = '#6E2424'; k.fillRect(202, 123, 146, 4); k.fillRect(240, 53, 60, 5);
        k.fillStyle = '#F0E6D2';
        for (let x = 208; x < 346; x += 10) { k.beginPath(); k.arc(x, 125, 1.2, 0, TAU); k.fill(); }
        k.globalAlpha = a;
      }
      k.restore();
      // 海豚（3.6 秒后）：各自 1.8 秒一跃，入水前后淡出
      [[120, 1, 0], [420, -1, 0.5]].forEach(([x0, dir, ph]) => {
        if (u <= 3.6) return;
        const s = (((u - 3.6) / 1.8 + ph) % 1 + 1) % 1, al = ease(u, 3.6) * clamp(Math.sin(Math.PI * s) * 4);
        if (al <= 0) return;
        k.save(); k.globalAlpha = a * al;
        k.translate(x0 + (s - 0.5) * 60 * dir, 168 - 40 * Math.sin(Math.PI * s)); k.scale(dir, 1); k.rotate(Math.atan2(-40 * Math.PI * Math.cos(Math.PI * s), 60));
        k.fillStyle = BLACK; fillPts(k, DOLPHIN); fillPts(k, [[-13, 0], [-20, -6], [-17, 0], [-20, 6]]); fillPts(k, [[-1, -4], [3, -10], [6, -4]]);
        k.restore();
      });
      k.globalAlpha = 1;
    };
  }

  // @element 04
  // 哥特泥金手抄本：羊皮纸上先打红色格线，金箔大写字母框亮起，金色边条从字母框沿左页边和页眉伸出，蓝底上出现红色首字母，
  // 黑体字一笔笔竖着写满版面，藤蔓沿页边长出彩叶和金色圆饰；之后金箔上斜着扫过高光，叶子轻摇，蜗牛沿页脚爬
  // 对应原作 scenes/05_gothic.js（金箔高光斜扫、藤蔓摇、蜗牛爬）；原作逐像素做金箔遮罩，这里改成金色渐变加移动的高光带
  {
    const GOLD = ['#9C6A1A', '#E8C35A', '#FFF0B0', '#B07A22'];
    const BOX = [40, 26, 90, 90];
    // 黑体字的竖笔（minim）：按阅读顺序生成，每词 3–9 笔，少数笔画上伸或下伸
    const MINIMS = [];
    for (let r = 0; r < 9; r++) {
      let x = 152; const y = 44 + r * 14;
      for (let wd = 0; x < 498; wd++) {
        const n = 3 + Math.floor(rnd(r * 40 + wd, 51) * 7);
        // 第 6 项：同一个词里的下一笔是否连着（连笔用细斜线，从这一笔脚连到下一笔头），词尾不连
        for (let m = 0; m < n && x < 498; m++, x += 4.6) { const v = rnd(MINIMS.length, 52); MINIMS.push([x, y, v < 0.1 ? -4 : 0, v > 0.92 ? 3 : 0, wd === 0 && r % 5 === 0, m < n - 1 && x + 4.6 < 498 && rnd(MINIMS.length, 53) < 0.8]); }
        x += 8;
      }
    }
    const VINE = dense([[86, 122], [78, 140], [92, 158], [84, 176], [110, 188], [160, 182], [220, 190], [280, 184], [340, 190], [400, 184], [460, 190], [512, 184]], 6);
    const LEAVES = VINE.map((p, i) => [p, i]).filter(([, i]) => i % 6 === 3).map(([p, i], j) => [p[0], p[1], i / (VINE.length - 1), ['#D9A63A', '#2A4A9A', '#B8302A'][j % 3], j % 2 ? 1 : -1]);
    const STAINS = Array.from({ length: 14 }, (_, i) => [rnd(i, 61) * CW, rnd(i, 62) * CH, 10 + rnd(i, 63) * 30]);
    // 金色边条：[x, y, 宽, 高, 生长方向]，从字母框往外长（v 向下，h 向右）
    const BARS = [[42, 116, 6, 54, 'v'], [130, 18, 376, 5, 'h']];
    // 金色圆饰（bezant）：藤蔓上隔几个点放一颗，和彩叶错开
    const BEZANTS = VINE.map((p, i) => [p, i]).filter(([, i]) => i % 6 === 0 && i > 0).map(([p, i]) => [p[0], p[1] - 5, i / (VINE.length - 1)]);
    const goldFill = (k, x0, y0, x1, y1) => { const g = k.createLinearGradient(x0, y0, x1, y1); GOLD.forEach((c, i) => g.addColorStop(i / 3, c)); return g; };
    CELLS[3] = (k, w, h, u) => {
      grainBg(k, '#EEDFBE', 'rgba(150,110,60,0.08)', 400, 7);
      STAINS.forEach(([x, y, r]) => { k.fillStyle = 'rgba(150,110,60,0.06)'; k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill(); });
      const a = vis(u); k.globalAlpha = a;
      // 红色格线（0.3–0.7 秒）
      k.strokeStyle = 'rgba(184,67,42,0.55)'; k.lineWidth = 0.8;
      const rt = seg(u, 0.3, 0.7);
      [[[146, 26], [146, 172]], [[504, 26], [504, 172]], [[146, 30], [504, 30]], [[146, 168], [504, 168]]].forEach(l => partial(k, l, rt));
      // 金箔框（0.7–1.3 秒）、蓝底（1.0–1.5 秒）、首字母（1.5–2.0 秒）
      const gt = seg(u, 0.7, 1.3);
      if (gt > 0) {
        k.globalAlpha = a * gt;
        const gg = k.createLinearGradient(BOX[0], BOX[1], BOX[0] + BOX[2], BOX[1] + BOX[3]);
        GOLD.forEach((c, i) => gg.addColorStop(i / 3, c));
        k.fillStyle = gg; k.fillRect(BOX[0], BOX[1], BOX[2], BOX[3]);
        k.strokeStyle = '#6E4A12'; k.lineWidth = 1; k.strokeRect(BOX[0], BOX[1], BOX[2], BOX[3]);
        k.globalAlpha = a;
      }
      // 金色边条（1.0–1.8 秒从字母框往外长），两头各带一个小金叶
      const bar = out3(seg(u, 1.0, 1.8));
      if (bar > 0) {
        BARS.forEach(([x, y, bw, bh, dir]) => {
          const ww = dir === 'h' ? bw * bar : bw, hh = dir === 'v' ? bh * bar : bh;
          k.fillStyle = goldFill(k, x, y, x + ww, y + hh); k.fillRect(x, y, ww, hh);
          k.strokeStyle = '#6E4A12'; k.lineWidth = 0.8; k.strokeRect(x, y, ww, hh);
          if (bar >= 1) {
            const [ex, ey] = dir === 'h' ? [x + bw, y + bh / 2] : [x + bw / 2, y + bh];
            k.fillStyle = goldFill(k, ex - 6, ey - 6, ex + 6, ey + 6); k.beginPath(); k.ellipse(ex + (dir === 'h' ? 5 : 0), ey + (dir === 'v' ? 5 : 0), dir === 'h' ? 6 : 3.5, dir === 'h' ? 3.5 : 6, 0, 0, TAU); k.fill(); k.stroke();
          }
        });
      }
      const bt = seg(u, 1.0, 1.5);
      if (bt > 0) {
        k.globalAlpha = a * bt; k.fillStyle = '#2A4A9A'; k.fillRect(48, 34, 74, 74);
        k.fillStyle = 'rgba(240,230,210,0.7)';
        for (let y = 40; y < 106; y += 8) for (let x = 54 + (y % 16 ? 4 : 0); x < 120; x += 8) k.fillRect(x, y, 1.4, 1.4);
        k.globalAlpha = a;
      }
      const lt = seg(u, 1.5, 2.0);
      if (lt > 0) {
        k.globalAlpha = a * lt; k.font = `700 66px "Didot", "Bodoni 72", Georgia, "Times New Roman", serif`; k.textAlign = 'center'; k.textBaseline = 'middle';
        k.lineWidth = 3; k.strokeStyle = '#F4EEDC'; k.strokeText('A', 85, 74); k.fillStyle = '#B8302A'; k.fillText('A', 85, 74);
        k.globalAlpha = a;
      }
      // 金箔高光（3.8 秒后）：斜带从左上扫到右下，扫过字母框的金边和两条金色边条（圆饰另在画藤蔓时闪）
      if (u > 3.8 && gt > 0) {
        const p = mix(-80, 560, seg(u, 3.8, 5.2));
        k.save(); k.beginPath(); k.rect(BOX[0], BOX[1], BOX[2], 8); k.rect(BOX[0], BOX[1] + BOX[3] - 8, BOX[2], 8); k.rect(BOX[0], BOX[1], 8, BOX[3]); k.rect(BOX[0] + BOX[2] - 8, BOX[1], 8, BOX[3]);
        BARS.forEach(([x, y, bw, bh]) => k.rect(x, y, bw, bh)); k.clip();
        const sg = k.createLinearGradient(p - 40, p * 0.35 - 40, p + 40, p * 0.35 + 40);
        sg.addColorStop(0, 'rgba(255,255,230,0)'); sg.addColorStop(0.5, `rgba(255,255,230,${0.85 * ease(u, 3.8)})`); sg.addColorStop(1, 'rgba(255,255,230,0)');
        k.fillStyle = sg; k.fillRect(0, 0, CW, CH); k.restore();
      }
      // 黑体字（1.8–3.6 秒）：每笔是竖直粗笔加上下两个菱形笔锋
      const n = Math.floor(seg(u, 1.8, 3.6) * MINIMS.length);
      for (let i = 0; i < n; i++) {
        const [x, y, up, dn, red, join] = MINIMS[i];
        k.fillStyle = red ? '#B8302A' : '#1E1612';
        k.fillRect(x - 0.9, y - 7 + up, 1.8, 7 - up + dn);
        if (join && i + 1 < n) { k.strokeStyle = k.fillStyle; k.lineWidth = 0.6; k.beginPath(); k.moveTo(x + 0.9, y + 0.6); k.lineTo(x + 3.7, y - 6.2); k.stroke(); }
        k.beginPath(); k.moveTo(x - 1.6, y - 6.4 + up); k.lineTo(x, y - 8 + up); k.lineTo(x + 1.6, y - 6.4 + up); k.fill();
        k.beginPath(); k.moveTo(x - 1.6, y + dn); k.lineTo(x, y + 1.6 + dn); k.lineTo(x + 1.6, y + dn); k.fill();
      }
      // 藤蔓（3.0–3.8 秒）和彩叶；3.8 秒后叶子轻摇
      const vt = seg(u, 3.0, 3.8), sw = ease(u, 3.8);
      k.strokeStyle = '#3A5A2A'; k.lineWidth = 1.6; k.lineCap = 'round'; partial(k, VINE, vt);
      LEAVES.forEach(([x, y, q, c, s], i) => {
        const t = out3(seg(vt, q, q + 0.12));
        if (t <= 0) return;
        k.save(); k.translate(x, y); k.rotate(s * 0.7 + 0.2 * sw * Math.sin((u - 3.8) * 2.4 + i)); k.scale(t, t);
        k.fillStyle = c; k.beginPath(); k.moveTo(0, 0); k.quadraticCurveTo(6 * s, -4, 0, -11); k.quadraticCurveTo(-6 * s, -4, 0, 0); k.fill();
        k.restore();
      });
      // 金色圆饰：藤蔓长到才鼓出来；3.8 秒后高光扫过时依次闪一下
      BEZANTS.forEach(([x, y, q], i) => {
        const t = backOut(seg(vt, q, q + 0.1), 1.5);
        if (t <= 0) return;
        const r = 3.6 * t;
        k.fillStyle = goldFill(k, x - r, y - r, x + r, y + r); k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill();
        k.strokeStyle = '#6E4A12'; k.lineWidth = 0.7; k.stroke();
        const sx = mix(-80, 560, seg(u, 3.8, 5.2)), f = clamp(1 - Math.abs(x - sx) / 40) * ease(u, 3.8);
        if (f > 0) { k.fillStyle = `rgba(255,255,230,${0.8 * f})`; k.beginPath(); k.arc(x - 1, y - 1, r * 0.6, 0, TAU); k.fill(); }
      });
      // 蜗牛（3.8 秒后）沿页脚往右爬
      const nt = seg(u, 3.8, 4.2);
      if (nt > 0) {
        const x = 300 + 26 * seg(u, 3.8, 5.4), y = 178;
        k.globalAlpha = a * nt;
        k.fillStyle = '#8C8478'; k.beginPath(); k.ellipse(x + 2, y + 3, 11, 3, 0, 0, TAU); k.fill();
        k.strokeStyle = '#5A5248'; k.lineWidth = 0.9; strokePts(k, [[x + 10, y + 1], [x + 14, y - 6]]); strokePts(k, [[x + 8, y + 1], [x + 10, y - 7]]);
        k.fillStyle = '#C89A3A'; k.beginPath(); k.arc(x - 2, y - 3, 6.5, 0, TAU); k.fill();
        k.strokeStyle = '#6E4A12'; k.lineWidth = 1; k.beginPath();
        for (let s = 0; s <= 24; s++) { const an = s / 24 * 3.5 * Math.PI, r = 6 - s * 0.22; k.lineTo(x - 2 + Math.cos(an) * r, y - 3 + Math.sin(an) * r); }
        k.stroke();
      }
      k.globalAlpha = 1;
    };
  }

  // @element 05
  // 波斯细密画：蓝金花边框先亮，高地平线的金色天空、平涂绿地和淡紫色海绵状山石依次铺出，溪流从山上蜿蜒流下，再立起贴满几何花砖的亭子、柏树和开花的树，最后一个人坐在毯子上；之后溪水的波纹流动，花瓣飘落
  // 对应原作 references/风格配方/51_persian_miniature.md（原作标为研究配方）：平面化、高地平线、无透视、装饰性花边
  {
    const FRAME = '#1E3A7A', GOLDC = '#E8C35A', GREEN = '#6E9A4A';
    const IN = [14, 14, CW - 14, CH - 14];
    const HORIZON = 46;
    const HILLS = dense([[14, 104], [40, 70], [70, 80], [96, 52], [128, 64], [150, 46], [176, 60], [200, 46], [230, 54], [250, 46]], 4).concat([[250, HORIZON], [14, HORIZON]]);
    // 海绵状山石：沿山脊画一串小半圆
    const SCALLOP = dense([[14, 104], [40, 70], [70, 80], [96, 52], [128, 64], [150, 46], [176, 60], [200, 46], [230, 54], [250, 46]], 3);
    const STREAM = dense([[222, 56], [200, 80], [236, 104], [214, 132], [168, 150], [120, 176], [70, 196]], 8);
    const CYPRESS = dense([[118, 172], [108, 140], [106, 100], [112, 70], [118, 46], [124, 70], [130, 100], [128, 140], [118, 172]], 4);
    const CROWN = [292, 86];
    const BLOSSOM = Array.from({ length: 70 }, (_, i) => { const an = rnd(i, 71) * TAU, r = 26 * Math.sqrt(rnd(i, 72)); return [CROWN[0] + Math.cos(an) * r, CROWN[1] + Math.sin(an) * r * 0.8, rnd(i, 73) < 0.6 ? '#FFFFFF' : '#F4A8B8', rnd(i, 74)]; });
    const FLOWERS = Array.from({ length: 60 }, (_, i) => [IN[0] + rnd(i, 81) * 340, 100 + rnd(i, 82) * 90, ['#FFFFFF', '#E8433A', '#F4D35A'][i % 3]]);
    const PETALS = Array.from({ length: 10 }, (_, i) => [CROWN[0] - 30 + rnd(i, 91) * 60, rnd(i, 92), rnd(i, 93) * TAU]);
    const PAV = [372, 54, 112, 128];         // 亭子 x, y, 宽, 高
    CELLS[4] = (k, w, h, u) => {
      k.fillStyle = '#F2E8D0'; k.fillRect(0, 0, CW, CH);
      const a = vis(u); k.globalAlpha = a;
      // 花边框（0.3–0.8 秒）
      const ft = seg(u, 0.3, 0.8);
      if (ft > 0) {
        k.globalAlpha = a * ft; k.fillStyle = FRAME;
        k.fillRect(0, 0, CW, IN[1]); k.fillRect(0, IN[3], CW, CH - IN[3]); k.fillRect(0, IN[1], IN[0], IN[3] - IN[1]); k.fillRect(IN[2], IN[1], CW - IN[2], IN[3] - IN[1]);
        // 金点沿花边顺时针一颗颗亮起
        const DOT = (x, y, q) => { if (q <= ft) { k.beginPath(); k.arc(x, y, 1.6, 0, TAU); k.fill(); } };
        k.fillStyle = GOLDC; k.globalAlpha = a;
        for (let x = 7; x < CW; x += 12) { DOT(x, 7, x / CW * 0.5); DOT(x, CH - 7, 0.5 + x / CW * 0.5); }
        for (let y = 19; y < CH - 12; y += 12) { DOT(CW - 7, y, y / CH * 0.5); DOT(7, y, 0.5 + y / CH * 0.5); }
        k.globalAlpha = a * ft; k.strokeStyle = GOLDC; k.lineWidth = 1.5; k.strokeRect(IN[0] - 1, IN[1] - 1, IN[2] - IN[0] + 2, IN[3] - IN[1] + 2);
        k.globalAlpha = a;
      }
      k.save(); k.beginPath(); k.rect(IN[0], IN[1], IN[2] - IN[0], IN[3] - IN[1]); k.clip();
      // 金色天空（0.8–1.2 秒）和平涂绿地（1.1–1.5 秒）
      const skt = seg(u, 0.8, 1.2);
      if (skt > 0) {
        k.globalAlpha = a * skt; k.fillStyle = GOLDC; k.fillRect(IN[0], IN[1], CW, HORIZON - IN[1] + 2);
        k.strokeStyle = '#FFFFFF'; k.lineWidth = 1.4;
        [[330, 26], [460, 30]].forEach(([x, y]) => { k.beginPath(); k.arc(x, y, 5, Math.PI, 0); k.arc(x + 10, y, 5, Math.PI, 0); k.arc(x + 20, y, 5, Math.PI, TAU * 0.9); k.stroke(); });
        k.globalAlpha = a;
      }
      const gt = seg(u, 1.1, 1.5);
      if (gt > 0) {
        k.globalAlpha = a * gt; k.fillStyle = GREEN; k.fillRect(IN[0], HORIZON, CW, CH);
        FLOWERS.forEach(([x, y, c]) => { k.fillStyle = c; k.beginPath(); k.arc(x, y, 1.6, 0, TAU); k.fill(); });
        k.globalAlpha = a;
      }
      // 淡紫色山石（1.4–1.9 秒）
      const ht = seg(u, 1.4, 1.9);
      if (ht > 0) {
        k.globalAlpha = a * ht; k.fillStyle = '#B9A3C9'; fillPts(k, HILLS);
        k.strokeStyle = '#7E6A94'; k.lineWidth = 1;
        for (let i = 0; i < SCALLOP.length - 1; i += 2) { const p = SCALLOP[i], q = SCALLOP[i + 1]; k.beginPath(); k.arc((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, Math.hypot(q[0] - p[0], q[1] - p[1]) / 2 + 1.5, Math.PI, 0); k.stroke(); }
        k.globalAlpha = a;
      }
      // 溪流（1.9–2.6 秒从上往下流出），4.2 秒后波纹沿溪流移动
      const rt = seg(u, 1.9, 2.6);
      if (rt > 0) {
        k.fillStyle = '#A8C4D4'; fillPts(k, ribbon(STREAM, q => 6 + 18 * q, rt));
        k.strokeStyle = '#5E7E94'; k.lineWidth = 1;
        const flow = ease(u, 4.2) * (u - 4.2) * 0.08;
        for (let j = 0; j < 14; j++) {
          const q = ((j / 14 + flow) % 1 + 1) % 1;
          if (q > rt) continue;
          const p = STREAM[Math.floor(q * (STREAM.length - 1))], r = 2 + 3 * q;
          k.beginPath(); k.arc(p[0], p[1], r, Math.PI * 1.1, Math.PI * 1.9); k.stroke();
        }
      }
      // 亭子（2.4–3.0 秒）和花砖（2.8–3.4 秒）
      const pt = seg(u, 2.4, 3.0);
      if (pt > 0) {
        const [x, y, pw, ph] = PAV;
        // 从地面往上长：裁剪框的上沿从亭子底部升到屋檐
        k.save(); k.beginPath(); k.rect(x - 8, y + ph - (ph + 10) * out3(pt), pw + 16, ph + 10); k.clip();
        k.fillStyle = '#C8401E'; k.fillRect(x - 6, y - 8, pw + 12, 10);
        k.fillStyle = '#2F6FA8'; k.fillRect(x, y, pw, ph);
        k.globalAlpha = a * seg(u, 2.8, 3.4); k.strokeStyle = '#F2E8D0'; k.lineWidth = 0.8;   // 花砖淡入
        for (let ty = y + 6; ty < y + ph; ty += 10) for (let tx = x + 6 + ((ty - y) % 20 ? 5 : 0); tx < x + pw - 2; tx += 10) {
          k.beginPath(); k.moveTo(tx, ty - 4); k.lineTo(tx + 4, ty); k.lineTo(tx, ty + 4); k.lineTo(tx - 4, ty); k.closePath(); k.stroke();
        }
        k.globalAlpha = a;
        const dx = x + pw / 2;
        k.fillStyle = GOLDC; k.beginPath(); k.moveTo(dx - 20, y + ph); k.lineTo(dx - 20, y + 64); k.quadraticCurveTo(dx - 20, y + 40, dx, y + 30); k.quadraticCurveTo(dx + 20, y + 40, dx + 20, y + 64); k.lineTo(dx + 20, y + ph); k.closePath(); k.fill();
        k.strokeStyle = '#8C5A1E'; k.lineWidth = 1.2; k.stroke();
        k.restore();
      }
      // 柏树（3.0–3.4 秒）和开花的树（3.2–3.6 秒，花 3.6–4.2 秒）
      const ct = out3(seg(u, 3.0, 3.4));
      if (ct > 0) {
        const sw = 0.03 * ease(u, 4.2) * Math.sin((u - 4.2) * 2);
        k.save(); k.translate(118, 172); k.rotate(sw); k.scale(1, ct); k.translate(-118, -172);
        k.fillStyle = '#2D4A2A'; fillPts(k, CYPRESS); k.strokeStyle = '#4E7A3A'; k.lineWidth = 1; strokePts(k, CYPRESS);
        k.restore();
      }
      const tt = seg(u, 3.2, 3.6);
      if (tt > 0) {
        k.strokeStyle = '#6B4A2A'; k.lineCap = 'round'; k.lineWidth = 4; partial(k, [[292, 170], [290, 130], [292, 96]], tt);
        k.lineWidth = 2; partial(k, [[291, 118], [270, 96]], tt); partial(k, [[291, 112], [314, 92]], tt);
      }
      BLOSSOM.forEach(([x, y, c, d]) => {
        const t = seg(u, 3.6 + d * 0.5, 3.7 + d * 0.5);
        if (t <= 0) return;
        k.fillStyle = c; k.beginPath(); k.arc(x, y, 2.2 * t, 0, TAU); k.fill();
      });
      // 坐在毯子上的人（4.2–4.6 秒）
      const mt = seg(u, 4.2, 4.6);
      if (mt > 0) {
        k.globalAlpha = a * mt;
        k.fillStyle = '#B8302A'; k.fillRect(316, 160, 40, 12); k.fillStyle = GOLDC; k.fillRect(318, 162, 36, 2); k.fillRect(318, 168, 36, 2);
        k.fillStyle = '#E8743A'; k.beginPath(); k.moveTo(326, 162); k.quadraticCurveTo(336, 128, 346, 162); k.closePath(); k.fill();
        k.fillStyle = '#F0CFB0'; k.beginPath(); k.arc(336, 136, 5, 0, TAU); k.fill();
        k.fillStyle = '#FFFFFF'; k.beginPath(); k.ellipse(336, 131, 6.5, 4, 0, Math.PI, 0); k.fill();
        k.globalAlpha = a;
      }
      // 花瓣飘落（4.2 秒后）
      const fl = ease(u, 4.2);
      if (fl > 0) PETALS.forEach(([x, ph, r]) => {
        const s = (((u - 4.2) * 0.35 + ph) % 1 + 1) % 1;
        k.globalAlpha = a * fl * clamp(Math.sin(Math.PI * s) * 3); k.fillStyle = '#F4A8B8';
        k.beginPath(); k.ellipse(x + 14 * Math.sin(s * 6 + r), 96 + s * 80, 2.2, 1.2, r + s * 4, 0, TAU); k.fill();
      });
      k.restore();
      k.globalAlpha = 1;
    };
  }

  // @element 06
  // 慕夏新艺术海报：先描出双线外框和拱形画框，右侧拱窗里太阳升起；光环亮起，两侧花茎长出，
  // 粗细会变的鞭形曲线勾出侧脸和长发，发梢卷成螺旋；最后底部字带滑入、字母逐个浮出；之后光环转、花轻摇
  // 对应原作 scenes/10_nouveau.js（dense + ribbon + swellW + spiral；海报框、拱窗和字带的版式）
  {
    const LINE = '#4E3320', SKIN = '#F6DCC4', HAIR = '#9C7A2E', HALO = '#E8BF55', HALO_LINE = '#C9A24A', POPPY = '#C9503A', LEAF = '#8FAC80';
    const W = (pts, wmax, wend = 0.8) => ribbon(dense(pts, 8), swellW(wmax, wend));
    // 侧脸朝右：额头、鼻尖、嘴唇、下巴
    const FACE = dense([[266, 52], [282, 56], [291, 68], [293, 78], [299, 87], [292, 90], [294, 96], [289, 100], [291, 106], [283, 113], [270, 116]], 6);
    const FACE_FILL = FACE.concat([[252, 112], [246, 80], [254, 56]]);
    const NECK = [dense([[276, 115], [274, 132], [276, 150]], 6), dense([[252, 108], [250, 130], [244, 150]], 6)];
    const HAIR_MASS = dense([[266, 50], [250, 42], [230, 48], [218, 68], [222, 96], [236, 116], [250, 112], [252, 80], [260, 60], [266, 50]], 6);
    // 鞭形发束：从头后向外甩出，末端接螺旋
    const LOCKS = [
      [[[232, 60], [196, 52], [170, 70], [160, 96]], spiral(150, 104, 12, -0.6, 1.1, -1)],
      [[[226, 84], [196, 96], [180, 124], [190, 150]], spiral(180, 156, 11, -0.2, 1.1, 1)],
      [[[234, 104], [214, 128], [214, 158], [234, 176]], spiral(240, 170, 10, 2.4, 1.1, -1)],
      [[[248, 112], [252, 140], [272, 164], [300, 170]], spiral(306, 160, 10, 1.6, 1.1, -1)],
      [[[262, 48], [292, 34], [322, 40], [336, 60]], spiral(328, 66, 9, 0.2, 1.1, 1)]
    ].map(([a, b]) => dense(a.concat(b), 6));
    const SHOULDER = dense([[214, 208], [228, 168], [260, 154], [300, 160], [326, 208]], 6);
    // 两侧花：花茎底点、花心、弯度
    const FLOWERS = [[70, 208, 84, 70, 30], [104, 208, 120, 112, -24], [470, 208, 456, 66, -30], [436, 208, 420, 110, 24]];
    const STEMS = FLOWERS.map(([bx, by, hx, hy, bend]) => dense([[bx, by], [mix(bx, hx, 0.4) + bend, mix(by, hy, 0.4)], [mix(bx, hx, 0.75) - bend * 0.4, mix(by, hy, 0.75)], [hx, hy]], 8));
    const HC = [270, 88], HR = 64;
    // 外框：内缩 6 px 的矩形（顺时针，从左上角起），按长度描出
    const BORDER = [[6, 6], [CW - 6, 6], [CW - 6, CH - 6], [6, CH - 6], [6, 6]];
    const BORDER_IN = [[11, 11], [CW - 11, 11], [CW - 11, CH - 11], [11, CH - 11], [11, 11]];
    // 拱形画框：包住光环的半圆顶 + 两条竖边，底边落在字带上
    const archPts = (cx, top, rw, bottom) => [[cx - rw, bottom]].concat(Array.from({ length: 33 }, (_, i) => { const an = Math.PI + i / 32 * Math.PI; return [cx + rw * Math.cos(an), top + rw + rw * Math.sin(an)]; }), [[cx + rw, bottom]]);
    const ARCH = archPts(HC[0], 14, 84, 178), ARCH_IN = archPts(HC[0], 19, 79, 178);
    // 右侧拱窗：窗框、太阳（从窗底升到窗中上部）、远山
    const WIN = { cx: 373, top: 30, rw: 25, bottom: 150 };
    const WIN_PTS = archPts(WIN.cx, WIN.top, WIN.rw, WIN.bottom);
    const HILLS = [[WIN.cx - 26, 136], [WIN.cx - 12, 124], [WIN.cx, 130], [WIN.cx + 12, 120], [WIN.cx + 26, 128], [WIN.cx + 26, 151], [WIN.cx - 26, 151]];
    // 底部字带：字母逐个浮出；字间距按字宽在画时量
    const BAND_Y = 178, BAND_H = 18, TITLE = 'SALON DU PRINTEMPS';
    CELLS[5] = (k, w, h, u) => {
      const bg = k.createLinearGradient(0, 0, 0, CH);
      bg.addColorStop(0, '#B9CBA0'); bg.addColorStop(0.5, '#CFD3A6'); bg.addColorStop(1, '#ECC9A2');
      k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
      const a = vis(u); k.globalAlpha = a;
      // 拱形画框（0.1–0.8 秒）：框内填浅杏色，再描双线
      const at = seg(u, 0.1, 0.8);
      if (at > 0) {
        k.globalAlpha = a * seg(u, 0.4, 0.9); k.fillStyle = '#F3E2C2'; fillPts(k, ARCH_IN); k.globalAlpha = a;
        k.strokeStyle = LINE; k.lineWidth = 1.6; partial(k, ARCH, at); k.lineWidth = 0.8; partial(k, ARCH_IN, at);
      }
      // 拱窗（0.5–0.9 秒）：天空渐变 + 升起的太阳与放射光 + 远山 + 窗框
      const wt = seg(u, 0.5, 0.9);
      if (wt > 0) {
        k.save(); k.globalAlpha = a * wt;
        k.beginPath(); tracePts(k, WIN_PTS, true); k.clip();
        const sky = k.createLinearGradient(0, WIN.top, 0, WIN.bottom);
        sky.addColorStop(0, '#E9C98A'); sky.addColorStop(1, '#F6E6C4');
        k.fillStyle = sky; k.fillRect(WIN.cx - 30, WIN.top, 60, WIN.bottom - WIN.top);
        const sy = mix(150, 84, out3(seg(u, 0.8, 2.6))), rot = 0.2 * u;
        k.strokeStyle = 'rgba(214,140,60,0.55)'; k.lineWidth = 1;
        k.beginPath(); for (let i = 0; i < 16; i++) { const an = rot + i / 16 * TAU; k.moveTo(WIN.cx + Math.cos(an) * 13, sy + Math.sin(an) * 13); k.lineTo(WIN.cx + Math.cos(an) * 40, sy + Math.sin(an) * 40); } k.stroke();
        k.fillStyle = '#E88A3A'; k.beginPath(); k.arc(WIN.cx, sy, 11, 0, TAU); k.fill();
        k.strokeStyle = LINE; k.lineWidth = 1; k.stroke();
        k.fillStyle = '#8FAC80'; fillPts(k, HILLS); k.strokeStyle = LINE; k.lineWidth = 1; strokePts(k, HILLS.slice(0, 5));
        k.restore(); k.globalAlpha = a * wt;
        k.strokeStyle = LINE; k.lineWidth = 2; strokePts(k, WIN_PTS);
        k.lineWidth = 1; k.beginPath(); k.moveTo(WIN.cx, WIN.top + WIN.rw); k.lineTo(WIN.cx, WIN.bottom); k.stroke();
        k.globalAlpha = a;
      }
      // 人物、光环和花都裁在内框里，不越过外框
      k.save(); k.beginPath(); k.rect(11, 11, CW - 22, CH - 22); k.clip();
      // 光环（0.3–0.9 秒放大），3.6 秒后放射纹缓慢转动
      const ht = out3(seg(u, 0.3, 0.9));
      if (ht > 0) {
        const r = HR * ht, rot = 0.25 * ease(u, 3.6) * (u - 3.6);
        k.fillStyle = HALO; k.globalAlpha = a * 0.55; k.beginPath(); k.arc(HC[0], HC[1], r, 0, TAU); k.fill(); k.globalAlpha = a;
        k.strokeStyle = HALO_LINE; k.lineWidth = 1.2;
        k.beginPath(); k.arc(HC[0], HC[1], r, 0, TAU); k.stroke();
        k.beginPath(); k.arc(HC[0], HC[1], r * 0.86, 0, TAU); k.stroke();
        k.beginPath();
        for (let i = 0; i < 36; i++) { const an = rot + i / 36 * TAU; k.moveTo(HC[0] + Math.cos(an) * r * 0.86, HC[1] + Math.sin(an) * r * 0.86); k.lineTo(HC[0] + Math.cos(an) * r, HC[1] + Math.sin(an) * r); }
        k.stroke();
      }
      // 两侧花茎（0.6–2.0 秒长出），3.6 秒后绕底点轻摇
      FLOWERS.forEach(([bx, by, hx, hy], i) => {
        const t = seg(u, 0.6 + i * 0.15, 1.6 + i * 0.15);
        if (t <= 0) return;
        const sw = 0.035 * ease(u, 3.6) * Math.sin((u - 3.6) * 2.4 + i * 1.3);
        k.save(); k.translate(bx, by); k.rotate(sw); k.translate(-bx, -by);
        k.fillStyle = LINE; fillPts(k, ribbon(STEMS[i], swellW(4, 1.2), t));
        const ft = backOut(seg(u, 1.4 + i * 0.15, 1.9 + i * 0.15), 1.4);
        if (ft > 0) {
          k.save(); k.translate(hx, hy); k.scale(ft, ft);
          for (let p = 0; p < 5; p++) { k.rotate(TAU / 5); k.fillStyle = POPPY; k.beginPath(); k.ellipse(0, -9, 7, 10, 0, 0, TAU); k.fill(); k.strokeStyle = LINE; k.lineWidth = 1.2; k.stroke(); }
          k.fillStyle = LINE; k.beginPath(); k.arc(0, 0, 3.5, 0, TAU); k.fill();
          k.restore();
          k.fillStyle = LEAF; k.strokeStyle = LINE; k.lineWidth = 1;
          const lx = mix(bx, hx, 0.55), ly = mix(by, hy, 0.55), s = i % 2 ? -1 : 1;
          k.beginPath(); k.ellipse(lx + 9 * s, ly, 10 * ft, 3.5 * ft, -0.6 * s, 0, TAU); k.fill(); k.stroke();
        }
        k.restore();
      });
      // 头发底色、脸、肩（1.2–1.8 秒淡入）
      const ft = seg(u, 1.2, 1.8);
      if (ft > 0) {
        k.globalAlpha = a * ft;
        k.fillStyle = '#7FA07A'; k.beginPath(); tracePts(k, SHOULDER, false); k.closePath(); k.fill();
        k.fillStyle = SKIN; fillPts(k, [[252, 108], [276, 115], [276, 152], [244, 152]]);
        k.fillStyle = HAIR; fillPts(k, HAIR_MASS);
        k.fillStyle = SKIN; fillPts(k, FACE_FILL);
        k.globalAlpha = a;
      }
      // 墨线：侧脸、脖子、肩、发束依次画出（1.4–3.6 秒）
      k.fillStyle = LINE;
      const lines = [[FACE, 3.2], [NECK[0], 2.6], [NECK[1], 2.6], [SHOULDER, 3.4], [HAIR_MASS, 2.8]].concat(LOCKS.map(l => [l, 5]));
      lines.forEach(([pts, wm], i) => {
        const t = seg(u, 1.4 + i * 0.2, 2.0 + i * 0.2);
        if (t > 0) fillPts(k, ribbon(pts, swellW(wm, 0.8), t));
      });
      // 眼睛和眉（3.2–3.6 秒）
      const et = seg(u, 3.2, 3.6);
      if (et > 0) { k.globalAlpha = a * et; fillPts(k, ribbon(dense([[274, 72], [281, 70], [286, 73]], 4), swellW(1.8, 0.4))); fillPts(k, ribbon(dense([[275, 78], [281, 77], [285, 79]], 4), swellW(2, 0.5))); }
      k.restore(); k.globalAlpha = a;
      // 底部字带（3.8–4.3 秒从左往右展开），字母 4.0–4.9 秒逐个浮出；字带压在人物和花茎底部上，像海报的落款栏
      const bt = out3(seg(u, 3.8, 4.3));
      if (bt > 0) {
        const bw = (CW - 22) * bt;
        k.fillStyle = '#D9A94E'; k.fillRect(11, BAND_Y, bw, BAND_H);
        k.strokeStyle = LINE; k.lineWidth = 1.2; k.strokeRect(11, BAND_Y, bw, BAND_H);
        k.lineWidth = 0.6; k.strokeRect(14, BAND_Y + 3, Math.max(0, bw - 6), BAND_H - 6);
        k.font = `600 11px "Didot", "Bodoni 72", Georgia, "Times New Roman", serif`; k.textBaseline = 'middle'; k.textAlign = 'left';
        const sp = 5, ws = [...TITLE].map(c => k.measureText(c).width), tw = ws.reduce((x, y) => x + y, 0) + sp * (TITLE.length - 1);
        let x = CW / 2 - tw / 2;
        [...TITLE].forEach((c, i) => {
          const lt = seg(u, 4.0 + i * 0.05, 4.2 + i * 0.05);
          if (lt > 0 && c !== ' ') { k.globalAlpha = a * lt; k.fillStyle = '#3A2414'; k.fillText(c, x, BAND_Y + BAND_H / 2 + 1 + (1 - out3(lt)) * 3); }
          x += ws[i] + sp;
        });
        k.globalAlpha = a;
      }
      // 双线外框（0–0.6 秒顺时针描出），四角各一个小圆饰
      const ot = seg(u, 0, 0.6);
      k.strokeStyle = LINE; k.lineWidth = 1.6; partial(k, BORDER, ot); k.lineWidth = 0.7; partial(k, BORDER_IN, ot);
      if (ot >= 1) {
        k.fillStyle = HALO;
        for (const [x, y] of [[8.5, 8.5], [CW - 8.5, 8.5], [CW - 8.5, CH - 8.5], [8.5, CH - 8.5]]) { k.beginPath(); k.arc(x, y, 3.2, 0, TAU); k.fill(); k.stroke(); }
      }
      k.globalAlpha = 1;
    };
  }

  // @element 07
  // 分析立体主义：褐灰半透明切面一片片叠上，同一个酒瓶和杯子从两个视角同时出现，再加断开的轮廓线和字母；之后几片切面来回滑动
  // 对应原作 scenes/11_cubism.js（plane 切面 + 断开的线段 + 报纸字母）
  {
    const PAL = ['#B8975F', '#6E5538', '#3A2C1E', '#A8A395', '#8E9EAB', '#5A5852', '#C9D3DA', '#D6C8AC'].map(hex3);
    // 切面：在静物附近随机生成三角形和四边形
    const PLANES = [];
    for (let i = 0; i < 46; i++) {
      const cx = 150 + rnd(i, 1) * 240, cy = 20 + rnd(i, 2) * 170, r = 18 + rnd(i, 3) * 34, n = rnd(i, 4) < 0.5 ? 3 : 4, a0 = rnd(i, 5) * TAU;
      const pts = Array.from({ length: n }, (_, j) => { const an = a0 + j / n * TAU + (rnd(i, 6 + j) - 0.5) * 0.9, rr = r * (0.6 + rnd(i, 10 + j) * 0.6); return [cx + Math.cos(an) * rr, cy + Math.sin(an) * rr * 0.9]; });
      PLANES.push({ pts, col: PAL[Math.floor(rnd(i, 7) * PAL.length)], al: 0.18 + rnd(i, 8) * 0.52, dir: 1 + Math.floor(rnd(i, 9) * 3), slide: i % 9 === 4 ? (rnd(i, 11) - 0.5) * 2 : 0 });
    }
    // 酒瓶（正视）和错位的第二视角；杯口一个正视的扁椭圆、一个俯视的圆
    const BOTTLE = [[218, 182], [218, 92], [228, 72], [230, 40], [242, 40], [244, 72], [254, 92], [254, 182]];
    const BOTTLE2 = BOTTLE.map(([x, y]) => [x + 16 + (y - 100) * 0.08, y - 6]);
    const GLASS = [[300, 112], [306, 176], [334, 176], [340, 112]];
    // 断开的轮廓线：每条只画边的一部分，并略微延长出边外
    const segsOf = (pts, seed) => pts.map((p, i) => {
      const q = pts[(i + 1) % pts.length], s = rnd(seed, i) * 0.3 - 0.1, e = 0.7 + rnd(seed + 1, i) * 0.45;
      return [[mix(p[0], q[0], s), mix(p[1], q[1], s)], [mix(p[0], q[0], e), mix(p[1], q[1], e)]];
    }).filter((_, i) => rnd(seed + 2, i) > 0.2);
    const LINES = segsOf(BOTTLE, 3).concat(segsOf(BOTTLE2, 5), segsOf(GLASS, 7), [[[150, 150], [420, 132]], [[170, 190], [400, 170]], [[380, 20], [372, 196]]]);
    const LETTERS = ['C', 'A', 'F', 'É'];
    CELLS[6] = (k, w, h, u) => {
      grainBg(k, '#D6C8AC', 'rgba(110,85,56,0.10)', 500, 3);
      const a = vis(u); k.globalAlpha = a;
      const sl = ease(u, 3.4);
      // 切面逐片叠上（0.3–3.4 秒，每片 0.2 秒淡入）
      PLANES.forEach((p, i) => {
        const t = seg(u, 0.3 + i * 0.062, 0.5 + i * 0.062);
        if (t <= 0) return;
        const dx = p.slide * 6 * sl * Math.sin((u - 3.4) * 2.2 + i);
        k.save(); k.translate(dx, 0); k.globalAlpha = a * t;
        plane(k, p.pts, p.col, p.al, p.dir); k.restore();
      });
      k.globalAlpha = a;
      // 点纹和排线纹理（2.0–2.6 秒）
      const tt = seg(u, 2.0, 2.6);
      if (tt > 0) {
        k.globalAlpha = a * tt; k.fillStyle = 'rgba(40,30,20,0.55)';
        for (let y = 128; y < 168; y += 5) for (let x = 352; x < 400; x += 5) k.fillRect(x, y, 1.4, 1.4);
        k.strokeStyle = 'rgba(40,30,20,0.4)'; k.lineWidth = 0.8; k.beginPath();
        for (let i = 0; i < 9; i++) { k.moveTo(160 + i * 6, 40); k.lineTo(150 + i * 6, 80); }
        k.stroke(); k.globalAlpha = a;
      }
      // 杯口两个视角（2.2–2.8 秒）
      const gt = seg(u, 2.2, 2.8);
      if (gt > 0) {
        k.strokeStyle = 'rgba(40,30,20,0.75)'; k.lineWidth = 1.6; k.globalAlpha = a * gt;
        k.beginPath(); k.ellipse(320, 112, 20, 4, 0, 0, TAU); k.stroke();
        k.beginPath(); k.ellipse(322, 104, 18, 15, 0, 0, TAU); k.stroke();
        k.globalAlpha = a;
      }
      // 断开的轮廓线（1.5–3.4 秒）
      k.strokeStyle = 'rgba(40,30,20,0.72)'; k.lineWidth = 2; k.lineCap = 'round';
      LINES.forEach((l, i) => partial(k, l, seg(u, 1.5 + i * 0.05, 1.8 + i * 0.05)));
      // 字母（2.8–3.4 秒），3.6 秒后逐个上下跳
      k.fillStyle = '#2A2018'; k.font = `700 20px "Didot", "Bodoni 72", Georgia, "Times New Roman", serif`; k.textAlign = 'center'; k.textBaseline = 'alphabetic';
      LETTERS.forEach((c, i) => {
        const t = seg(u, 2.8 + i * 0.1, 3.0 + i * 0.1);
        if (t <= 0) return;
        const hop = ease(u, 3.6) * Math.max(0, Math.sin((u - 3.6) * 3.2 - i * 0.9)) * 4;
        k.globalAlpha = a * t; k.fillText(c, 356 + i * 15, 60 - hop - (i % 2) * 3);
      });
      k.globalAlpha = 1;
    };
  }

  // @element 08
  // 克里姆特金色时期：满屏金箔马赛克做底，底部一片花草地的小花依次开出；金色长袍的人物铺出底色，
  // 长袍上螺旋纹、方块纹和眼形纹逐块铺满；之后金箔上高光斜扫、碎片闪烁，眼形纹轮流眨、金屑飘落
  // 对应原作 scenes/18_klimt.js（spiral、eye、robePattern、金箔底与花草地）；金箔改用色块加移动的高光带，不读像素
  {
    const SKIN = '#F0CFB8', SKIN_D = '#D8A88C', HAIR = '#2A1D14';
    const ROBE = [[246, 70], [294, 70], [318, 120], [344, 208], [196, 208], [222, 120]];
    const robeIn = (x, y) => { // 点是否在长袍内（左右边按 y 线性插值）
      if (y < 70 || y > 208) return false;
      const t = y < 120 ? (y - 70) / 50 : (y - 120) / 88;
      const l = y < 120 ? mix(246, 222, t) : mix(222, 196, t), r = y < 120 ? mix(294, 318, t) : mix(318, 344, t);
      return x > l + 4 && x < r - 4;
    };
    // 长袍纹样：0 螺旋、1 方块、2 眼形；按网格放置，只保留在长袍内的
    const MOTIFS = [];
    for (let y = 80, j = 0; y < 204; y += 15, j++) for (let x = 200 + (j % 2) * 8; x < 344; x += 17) {
      if (!robeIn(x, y)) continue;
      const i = MOTIFS.length;
      MOTIFS.push({ x: x + (rnd(i, 1) - 0.5) * 4, y: y + (rnd(i, 2) - 0.5) * 4, kind: Math.floor(rnd(i, 3) * 3), ph: rnd(i, 4) * 1.6 });
    }
    MOTIFS.sort((p, q) => p.y - q.y);
    const DUST = Array.from({ length: 70 }, (_, i) => [rnd(i, 21) * CW, rnd(i, 22) * CH, 0.8 + rnd(i, 23) * 1.6, rnd(i, 24) * TAU]);
    // 金箔马赛克：6 px 方块错行排列，按色阶分组，画时每组一条路径；少数深褐和浅色碎片打破均匀
    const TILE = 6, GROUT = '#8A6424';
    const GOLDS = ['#B9892E', '#C59536', '#D0A140', '#D9AC4B', '#E2B858', '#EAC468', '#7A5420', '#F6E0A0'];
    const TILES = GOLDS.map(() => []), GLINT = [];
    for (let r = 0, y = 0; y < CH; y += TILE, r++) for (let x = (r % 2) * -3; x < CW; x += TILE) {
      const id = r * 100 + Math.round(x), q = rnd(id, 41);
      const g = q < 0.018 ? 6 : q > 0.99 ? 7 : Math.min(5, Math.floor(rnd(id, 42) * 6));
      TILES[g].push(x + 0.5, y + 0.5);
      if (rnd(id, 43) < 0.12) GLINT.push({ x: x + 0.5, y: y + 0.5, ph: rnd(id, 44) * TAU });
    }
    // 花草地：y 172 以下，草叶和五色小花；花按 x 从两边往中间依次开
    const MEADOW_Y = 172;
    const BLADES = Array.from({ length: 150 }, (_, i) => [rnd(i, 51) * CW, MEADOW_Y + 6 + rnd(i, 52) * 34, 4 + rnd(i, 53) * 7, (rnd(i, 54) - 0.5) * 0.7]);
    const FCOL = ['#C8301E', '#2A58A8', '#F6EEDB', '#E8743A', '#8A4FA0', '#E9C23C'];
    const MFLOWERS = Array.from({ length: 64 }, (_, i) => {
      const x = rnd(i, 61) * CW, y = MEADOW_Y + 4 + rnd(i, 62) * 32;
      return { x, y, r: 2.2 + rnd(i, 63) * 2.4 * (0.6 + (y - MEADOW_Y) / 40), c: FCOL[Math.floor(rnd(i, 64) * FCOL.length)], t0: 0.9 + Math.abs(x - CW / 2) / (CW / 2) * -0.6 + 0.6 + rnd(i, 65) * 0.2, ph: rnd(i, 66) * TAU };
    });
    CELLS[7] = (k, w, h, u) => {
      // 金箔底（每帧相同，是本格的底色）
      k.fillStyle = GROUT; k.fillRect(0, 0, CW, CH);
      TILES.forEach((list, g) => {
        k.fillStyle = GOLDS[g]; k.beginPath();
        for (let n = 0; n < list.length; n += 2) k.rect(list[n], list[n + 1], TILE - 1, TILE - 1);
        k.fill();
      });
      const a = vis(u); k.globalAlpha = a;
      // 金箔高光（3.4 秒后）：一条斜向亮带从左扫到右，另有少量碎片各自闪烁
      const gl = ease(u, 3.4);
      if (gl > 0) {
        const bx = mix(-160, CW + 160, seg(u, 3.4, 5.4));
        const bg = k.createLinearGradient(bx - 70, 0, bx + 70, CH * 0.4);
        bg.addColorStop(0, 'rgba(255,246,206,0)'); bg.addColorStop(0.5, 'rgba(255,246,206,0.38)'); bg.addColorStop(1, 'rgba(255,246,206,0)');
        k.globalAlpha = a * gl; k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
        k.fillStyle = '#FFF6D6';
        for (const t of GLINT) { const f = Math.pow(Math.max(0, Math.sin(u * 2.6 + t.ph)), 10); if (f > 0.02) { k.globalAlpha = a * gl * f; k.fillRect(t.x, t.y, TILE - 1, TILE - 1); } }
        k.globalAlpha = a;
      }
      // 花草地（0.3–0.8 秒草地淡入，花 0.9–2.1 秒从两边往中间开出，3.6 秒后轻摇）
      const mt = seg(u, 0.3, 0.8);
      if (mt > 0) {
        k.globalAlpha = a * mt;
        const mg = k.createLinearGradient(0, MEADOW_Y, 0, CH);
        mg.addColorStop(0, '#5E7A3A'); mg.addColorStop(1, '#2F4A24');
        k.fillStyle = mg; k.beginPath(); k.moveTo(0, CH);
        for (let x = 0; x <= CW; x += 12) k.lineTo(x, MEADOW_Y + 3 * Math.sin(x * 0.05));
        k.lineTo(CW, CH); k.closePath(); k.fill();
        k.strokeStyle = '#86A456'; k.lineWidth = 1; k.lineCap = 'round';
        k.beginPath(); for (const [x, y, l, lean] of BLADES) { k.moveTo(x, y); k.lineTo(x + lean * l, y - l); } k.stroke();
        k.globalAlpha = a;
      }
      const sway = ease(u, 3.6);
      for (const f of MFLOWERS) {
        const t = backOut(seg(u, f.t0, f.t0 + 0.4), 1.6);
        if (t <= 0) continue;
        const dx = sway * Math.sin((u - 3.6) * 2.2 + f.ph) * 1.2, r = f.r * t;
        k.fillStyle = f.c; k.beginPath();
        for (let p = 0; p < 5; p++) { const an = p / 5 * TAU + f.ph; k.moveTo(f.x + dx + Math.cos(an) * r * 0.9 + r * 0.55, f.y + Math.sin(an) * r * 0.9); k.arc(f.x + dx + Math.cos(an) * r * 0.9, f.y + Math.sin(an) * r * 0.9, r * 0.55, 0, TAU); }
        k.fill();
        k.fillStyle = f.c === '#E9C23C' ? '#8A4A12' : '#F2C640'; k.beginPath(); k.arc(f.x + dx, f.y, r * 0.38, 0, TAU); k.fill();
      }
      // 长袍金色底（0.3–1.0 秒）
      const rt = seg(u, 0.3, 1.0);
      if (rt > 0) {
        k.globalAlpha = a * rt;
        const g = k.createLinearGradient(196, 70, 344, 208);
        g.addColorStop(0, '#9C6A1A'); g.addColorStop(0.45, '#D9A63A'); g.addColorStop(0.7, '#F8DE86'); g.addColorStop(1, '#B07A22');
        k.save(); k.translate(3, 2); k.fillStyle = 'rgba(46,30,12,0.45)'; fillPts(k, ROBE); k.restore();
        k.fillStyle = g; fillPts(k, ROBE);
        // 高光带：3.4 秒后斜着扫过长袍
        const sx = mix(120, 420, seg(u, 3.4, 5.2));
        if (u > 3.4) {
          k.save(); k.beginPath(); tracePts(k, ROBE); k.clip();
          const sg = k.createLinearGradient(sx - 40, 0, sx + 40, 0);
          sg.addColorStop(0, 'rgba(255,245,200,0)'); sg.addColorStop(0.5, `rgba(255,245,200,${0.45 * ease(u, 3.4)})`); sg.addColorStop(1, 'rgba(255,245,200,0)');
          k.fillStyle = sg; k.fillRect(0, 0, CW, CH); k.restore();
        }
        // 头发、脸、手
        k.fillStyle = HAIR; k.beginPath(); k.ellipse(266, 44, 22, 22, 0, 0, TAU); k.fill();
        k.fillStyle = SKIN; k.beginPath(); k.ellipse(272, 50, 12, 15, -0.25, 0, TAU); k.fill();
        k.fillStyle = SKIN_D; k.beginPath(); k.ellipse(276, 56, 4, 2, -0.25, 0, TAU); k.fill();
        k.fillStyle = SKIN; k.beginPath(); k.ellipse(284, 112, 9, 6, -0.6, 0, TAU); k.fill();
        k.strokeStyle = '#3A2614'; k.lineWidth = 1.2;
        k.beginPath(); k.moveTo(266, 47); k.quadraticCurveTo(270, 45, 274, 47); k.stroke();
        k.beginPath(); k.moveTo(275, 49); k.quadraticCurveTo(279, 47, 282, 49); k.stroke();
        // 发间小花
        [[252, 30, '#C8301E'], [284, 26, '#E8743A'], [246, 52, '#2A58A8']].forEach(([x, y, c]) => { k.fillStyle = c; k.beginPath(); k.arc(x, y, 3.2, 0, TAU); k.fill(); });
        k.globalAlpha = a;
      }
      // 纹样逐块铺上（1.0–3.4 秒）
      k.save(); k.beginPath(); tracePts(k, ROBE); k.clip();
      const STEP = (3.4 - 1.0 - 0.2) / Math.max(1, MOTIFS.length - 1);
      MOTIFS.forEach((m, i) => {
        const t = out3(seg(u, 1.0 + i * STEP, 1.2 + i * STEP));
        if (t <= 0) return;
        k.save(); k.translate(m.x, m.y); k.scale(t, t);
        if (m.kind === 0) {
          k.strokeStyle = '#3A2614'; k.lineWidth = 1.1; k.beginPath();
          for (let s = 0; s <= 30; s++) { const an = s / 30 * 4.5 * Math.PI, r = 0.6 + s * 0.18; s ? k.lineTo(Math.cos(an) * r, Math.sin(an) * r) : k.moveTo(r, 0); }
          k.stroke();
        } else if (m.kind === 1) {
          k.fillStyle = m.ph > 0.8 ? '#1E1610' : '#F6EEDB'; k.fillRect(-4, -5, 8, 10);
          k.fillStyle = '#D9A63A'; k.fillRect(-1.5, -2, 3, 4);
        } else {
          // 眼形纹：3.4 秒后轮流眨（纵向压扁再恢复）
          const cyc = ((u - 3.4 + m.ph) % 1.6 + 1.6) % 1.6, blink = u > 3.4 ? clamp(Math.abs(cyc - 0.12) / 0.1) : 1;
          const open = mix(1, blink, ease(u, 3.4));
          k.fillStyle = '#F6EEDB'; k.beginPath(); k.ellipse(0, 0, 6, 3.4 * open, 0, 0, TAU); k.fill();
          k.strokeStyle = '#3A2614'; k.lineWidth = 0.9; k.stroke();
          if (open > 0.25) { k.fillStyle = '#2A58A8'; k.beginPath(); k.arc(0, 0, 1.8 * open, 0, TAU); k.fill(); }
        }
        k.restore();
      });
      k.restore();
      // 长袍轮廓
      if (rt > 0) { k.strokeStyle = 'rgba(46,30,12,0.85)'; k.lineWidth = 1.6; k.globalAlpha = a * rt; strokePts(k, ROBE, true); k.globalAlpha = a; }
      // 金屑飘落（3.4 秒后）
      const dt = ease(u, 3.4);
      if (dt > 0) {
        k.fillStyle = '#F8DE86';
        DUST.forEach(([x, y, r, ph]) => {
          const yy = y + (u - 3.4) * (10 + r * 6), xx = x + Math.sin((u - 3.4) * 1.5 + ph) * 4;
          k.globalAlpha = a * dt * (0.5 + 0.5 * Math.sin(ph + u * 3)); k.beginPath(); k.arc(xx, yy, r, 0, TAU); k.fill();
        });
      }
      k.globalAlpha = 1;
    };
  }

  // @element 09
  // 蒙克《呐喊》式表现主义：长而薄的半透明流线笔从天空往下一层层铺出，血色天空、打旋的深蓝峡湾、左侧山岸和斜向右下的桥；
  // 桥栏画出后，远处两个人影走在桥头，双手捂脸的人出现在前景；之后整幅画面连人带桥按行、按列扭动，嘴一张一合
  // 对应原作 scenes/19_munch.js（按区域取方向场的 flowLines、不描边半透明长笔、同色系底色、整幅按行列正弦位移、捂颊尖叫者）
  {
    const BG = '#3A2418';
    // 区域：0 天空、1 峡湾、2 左侧山岸、3 桥面。桥栏从左侧中部斜到右下角，桥面是它下方的三角
    const railY = x => 102 + x / CW * 96;
    const skyY = x => 64 - 7 * Math.sin(x * 0.011 + 0.6);
    const shoreX = y => 70 + (y - 60) * 2.4;                 // 山岸右缘：越往下越靠右，和峡湾交成斜岸
    const region = (x, y) => (y > railY(x) + 4 ? 3 : y < skyY(x) ? 0 : x < shoreX(y) ? 2 : 1);
    // 方向场：天空是横向波浪，峡湾是顺着岸线弯的 S 形长波（同心旋涡一看就成了梵高《星夜》），山岸顺着坡斜，桥面指向左上方的桥头
    const angle = (x, y, r) => r === 0 ? 0.45 * Math.sin(x * 0.035 + y * 0.09)
      : r === 1 ? -0.18 + 0.6 * Math.sin(x * 0.017 - y * 0.045 + 1.1) - 0.5 * Math.exp(-Math.max(0, x - shoreX(y)) / 40)
        : r === 2 ? 1.15 + 0.45 * Math.sin(y * 0.09 + x * 0.03)
          : Math.atan2(92 - y, -90 - x);
    // 每区 [步数, 步长, 线宽, 不透明度]：长笔、薄涂，笔与笔叠出颜色，不描边（描边短笔一看就成了梵高）
    const PARAM = [[26, 2.6, 3.2, 0.72], [30, 2.8, 3.0, 0.72], [24, 2.6, 3.4, 0.6], [34, 3.2, 3.6, 0.6]];
    const SKY = ['#E2541C', '#F08A24', '#F4C03A', '#C8301E', '#E8743A', '#F6A63A', '#B82A1E'];
    const PAL = [null, ['#1E2A5A', '#2C4A8A', '#3E66A8', '#16204A'], ['#3E5A2A', '#5A6A2A', '#2A3A1E', '#7A6A30'], ['#C8642A', '#E8843A', '#A8401E', '#D89A4A']];
    // 各区域底色：笔缝里露出的是同色系，不是黑
    const skyLine = Array.from({ length: 28 }, (_, n) => [n * 20, skyY(n * 20)]);
    const BASE = [
      ['#C8401E', skyLine.concat([[CW, 0], [0, 0]])],
      ['#22305E', skyLine.concat([[CW, railY(CW) + 4], [0, railY(0) + 4]])],
      ['#34482A', [[0, skyY(0)], [shoreX(skyY(0)), skyY(0)], [shoreX(railY(shoreX(railY(0)))) , railY(shoreX(railY(0))) + 4], [0, railY(0) + 4]]],
      ['#B4562A', [[0, railY(0) + 4], [CW, railY(CW) + 4], [CW, CH], [0, CH]]]
    ];
    // 预先积分笔触：7 px 抖动网格的种子，沿方向场走，越出本区就停，所以区域边界干净
    const STROKES = [];
    for (let y = 1, jr = 0; y < CH + 3; y += 7, jr++) for (let x = 1 + (jr % 2) * 3.5; x < CW + 3; x += 7) {
      const id = STROKES.length + jr * 1000, sx = x + (rnd(id, 1) - 0.5) * 6, sy = y + (rnd(id, 2) - 0.5) * 6, r = region(sx, sy);
      const [steps, st, lw, al] = PARAM[r], n = steps + Math.floor(rnd(id, 3) * 7), pts = [[sx, sy]];
      let px = sx, py = sy;
      for (let q = 0; q < n; q++) {
        const an = angle(px, py, r), nx = px + Math.cos(an) * st, ny = py + Math.sin(an) * st;
        if (region(nx, ny) !== r || nx < -6 || nx > CW + 6 || ny < -6 || ny > CH + 6) break;
        px = nx; py = ny; pts.push([px, py]);
      }
      if (pts.length < 4) continue;
      // 天空按「波浪化的 y」分色带，带宽 9 px，7 色循环
      const col = r === 0 ? SKY[((Math.floor((sy + 6 * Math.sin(sx * 0.03)) / 9) % 7) + 7) % 7] : PAL[r][Math.floor(rnd(id, 4) * 4)];
      STROKES.push({ pts, r, y: sy, col, lw: lw - 0.6 + rnd(id, 5) * 1.2, al });
    }
    // 先天空，再从上往下
    STROKES.sort((p, q) => (p.r === 0 ? 0 : 1) - (q.r === 0 ? 0 : 1) || p.y - q.y);
    const N = STROKES.length;
    const T_OF = n => 0.3 + n / N * 3.3;                      // 笔触在 0.3–3.6 秒内匀速出现
    const SPAN = [0, 1, 2, 3].map(r => { const ids = STROKES.map((st, n) => (st.r === r ? n : -1)).filter(n => n >= 0); return [T_OF(ids[0]), T_OF(ids[ids.length - 1])]; });
    // 桥栏：加密成点列，扭动时逐点位移
    const RAIL_TOP = Array.from({ length: 55 }, (_, n) => [n * 10, railY(n * 10) - 3]);
    const RAIL_LOW = Array.from({ length: 55 }, (_, n) => [n * 10, railY(n * 10) + 4]);
    // 尖叫者：站在桥面前景，脚落在画面底边以下
    // 尖叫者以脚底为基点放大 FS 倍，头落在峡湾前面，是画面主角
    const FX = 352, FS = 1.35;
    CELLS[8] = (k, w, h, u) => {
      k.fillStyle = BG; k.fillRect(0, 0, CW, CH);
      const a = vis(u); k.globalAlpha = a;
      const wv = ease(u, 3.8), ph = Math.max(0, u - 3.8);
      // 整个世界在流：按行水平位移 + 按列竖直位移（3.8 秒起渐入）
      const DX = y => wv * (3.2 * Math.sin(y * 0.05 + 4.2 * ph) + 1.4 * Math.sin(y * 0.13 - 6 * ph));
      const DY = x => wv * 2.0 * Math.sin(x * 0.03 - 3.6 * ph);
      BASE.forEach(([col, pts], r) => {
        const t = seg(u, SPAN[r][0], SPAN[r][1]);
        if (t > 0) { k.globalAlpha = a * t; k.fillStyle = col; fillPts(k, pts); }
      });
      const shown = Math.floor(seg(u, 0.3, 3.6) * N);
      k.lineCap = 'round'; k.lineJoin = 'round';
      for (let n = 0; n < shown; n++) {
        const st = STROKES[n];
        k.globalAlpha = a * st.al; k.strokeStyle = st.col; k.lineWidth = st.lw;
        k.beginPath();
        st.pts.forEach((p, m) => { const x = p[0] + DX(p[1]), y = p[1] + DY(p[0]); m ? k.lineTo(x, y) : k.moveTo(x, y); });
        k.stroke();
      }
      k.globalAlpha = a;
      const warp = pts => pts.map(([x, y]) => [x + DX(y), y + DY(x)]);
      // 桥栏（2.6–3.3 秒，从左边桥头画到右下）：粗扶手、细下栏、竖杆
      const rt = seg(u, 2.6, 3.3);
      if (rt > 0) {
        k.strokeStyle = '#3A2214'; k.lineWidth = 4; partial(k, warp(RAIL_TOP), rt);
        k.lineWidth = 1.6; partial(k, warp(RAIL_LOW), rt);
        k.lineWidth = 1.4; k.beginPath();
        for (let x = 14; x < CW * rt; x += 30) { const t0 = railY(x); k.moveTo(x + DX(t0 - 3), t0 - 3 + DY(x)); k.lineTo(x + DX(t0 + 4), t0 + 4 + DY(x)); }
        k.stroke();
      }
      // 远处两个戴高帽、穿长外套的人影（3.0–3.4 秒），在桥头扶手内侧，一前一后
      const ft = seg(u, 3.0, 3.4);
      if (ft > 0) {
        k.globalAlpha = a * ft; k.fillStyle = '#1E140E';
        [[28, 126, 1], [48, 130, 0.92]].forEach(([x, y, sc]) => {
          const o = DX(y - 10), v = DY(x);
          k.save(); k.translate(x + o, y + v); k.scale(sc, sc);
          // 外套：窄肩、下摆张开到膝下，两条腿露一小截
          fillPts(k, [[-2.6, -17], [2.6, -17], [4.2, -5], [-4.4, -5]]);
          k.fillRect(-2.6, -5, 1.6, 5); k.fillRect(1.0, -5, 1.6, 5);
          // 头、高帽（帽身 + 帽檐）
          k.beginPath(); k.arc(0, -19.2, 2.4, 0, TAU); k.fill();
          k.fillRect(-2.2, -26, 4.4, 5); k.fillRect(-4.2, -21.6, 8.4, 1.4);
          k.restore();
        });
        k.globalAlpha = a;
      }
      // 尖叫者（3.1–3.7 秒从下往上浮出并淡入）；3.8 秒起身体摆动、嘴一张一合
      const pt = seg(u, 3.1, 3.7);
      if (pt > 0) {
        const lift = (1 - out3(pt)) * 18, sway = wv * 0.06 * Math.sin(ph * 3.2), mouth = 1 + wv * 0.35 * Math.sin(ph * 9);
        k.globalAlpha = a * pt;
        k.save(); k.translate(FX + DX(120), lift + DY(FX)); k.translate(0, 214); k.rotate(sway); k.scale(FS, FS); k.translate(0, -214);
        // 身体：深色长袍，S 形向左弯，下摆出画
        const L = dense([[-8, 126], [-14, 146], [-12, 168], [-20, 190], [-26, 214]], 4), R = dense([[8, 126], [12, 146], [16, 168], [12, 190], [18, 214]], 4);
        k.fillStyle = '#1C1A2A'; fillPts(k, L.concat(R.reverse()));
        k.strokeStyle = 'rgba(70,60,90,0.6)'; k.lineWidth = 2;
        strokePts(k, dense([[-2, 132], [-6, 160], [-10, 190], [-14, 212]], 4));
        // 手臂：从肩膀弯上去，手捂住两颊
        k.strokeStyle = '#1C1A2A'; k.lineWidth = 5; k.lineCap = 'round';
        strokePts(k, dense([[-9, 130], [-17, 122], [-15, 110]], 4)); strokePts(k, dense([[9, 130], [17, 122], [15, 110]], 4));
        // 头：上宽下窄的梨形，浅黄带一点绿影，像骷髅
        k.fillStyle = '#D6C68E';
        k.beginPath(); k.moveTo(0, 88); k.bezierCurveTo(14, 88, 15, 104, 9, 114); k.bezierCurveTo(6, 121, -6, 121, -9, 114); k.bezierCurveTo(-15, 104, -14, 88, 0, 88); k.fill();
        k.fillStyle = 'rgba(120,150,70,0.35)'; k.beginPath(); k.ellipse(5, 108, 5, 9, 0.2, 0, TAU); k.fill();
        // 手：贴在脸两侧
        k.fillStyle = '#C8B880';
        k.beginPath(); k.ellipse(-12, 106, 3.6, 7.5, 0.15, 0, TAU); k.fill(); k.beginPath(); k.ellipse(12, 106, 3.6, 7.5, -0.15, 0, TAU); k.fill();
        // 眼窝、鼻孔、张开的嘴
        k.fillStyle = '#2A1E16';
        k.beginPath(); k.ellipse(-4.2, 99, 2.2, 3, 0, 0, TAU); k.fill(); k.beginPath(); k.ellipse(4.2, 99, 2.2, 3, 0, 0, TAU); k.fill();
        k.fillRect(-1.2, 104, 0.9, 1.6); k.fillRect(0.4, 104, 0.9, 1.6);
        k.beginPath(); k.ellipse(0, 112, 2.4, 3.4 * mouth, 0, 0, TAU); k.fill();
        k.restore();
      }
      k.globalAlpha = 1;
    };
  }

  // @shared
  // （本包目前没有跨元素共用的代码）
  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});
