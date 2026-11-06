/* Motion Prompt · pack "drawstyles" · MIT License (c) 2026 sadjjk · https://github.com/alexgreensh/anidoodle */
MotionPrompt.pack('drawstyles', function () {
  // @kit
  // 画材画风（每格 539x208、6.4 秒周期；每格都是只依赖时间 u 的纯函数）
  // 画风思路参考 anidoodle（Alex Greenshpun），代码为本仓库独立实现。
  // 0–5.4 秒按作画顺序画到成品并停住，5.4–6.0 秒画面淡回空白画纸，6.0–6.4 秒保持空白。
  // 随机只用 hash/rnd 加固定种子；点阵和笔触坐标在定义时算好，绘制时按 u 取前若干个。
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
  const vis = u => 1 - resetK(u);            // 画面（纸以外）的整体不透明度

  // 纸：底色 + 固定位置的纸纹点（col 为纸色，grain 为纸纹色，n 为点数）
  function paper(k, col, grain, n = 420, seed = 1) {
    k.fillStyle = col; k.fillRect(0, 0, CW, CH);
    k.fillStyle = grain;
    for (let i = 0; i < n; i++) k.fillRect(rnd(i, seed) * CW, rnd(i, seed + 1) * CH, 1 + rnd(i, seed + 2), 1);
  }
  // 折线按长度画出前 t（0..1）；t<=0 不画
  function partial(k, pts, t) {
    if (t <= 0 || pts.length < 2) return;
    let total = 0;
    for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    let left = clamp(t) * total;
    k.beginPath(); k.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length && left > 0; i++) {
      const a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (d <= left) { k.lineTo(b[0], b[1]); left -= d; }
      else { const f = left / d; k.lineTo(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f); left = 0; }
    }
    k.stroke();
  }
  // 手绘抖动的线：a→b 之间 n 段，中间点沿法线按 hash 偏移 ±amp（两端不动，方便首尾相接）
  function wobble(x1, y1, x2, y2, seed, amp = 1.2, n = 8) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, pts = [];
    for (let i = 0; i <= n; i++) {
      const f = i / n, o = (i === 0 || i === n) ? 0 : (rnd(seed, i) - 0.5) * 2 * amp;
      pts.push([x1 + dx * f + nx * o, y1 + dy * f + ny * o]);
    }
    return pts;
  }
  // 手画椭圆：从角度 a0 开始画一圈再多画 over 圈，半径带 ±amp 抖动（收笔处略过头，像手画）
  function ellPts(cx, cy, rx, ry, seed, amp = 1, n = 48, a0 = 0, over = 0.08) {
    const m = Math.round(n * (1 + over)), pts = [];
    for (let i = 0; i <= m; i++) {
      const a = a0 + (i / n) * TAU, j = (rnd(seed, i % n) - 0.5) * 2 * amp;
      pts.push([cx + Math.cos(a) * (rx + j), cy + Math.sin(a) * (ry + j)]);
    }
    return pts;
  }
  // 平行排线：在 box=[x,y,w,h] 内、clipFn 定义的区域中，角度 ang、间距 gap，按 t 画出前若干条。
  // 线按 box 在法线方向上的投影排布，所以每条线都落在 box 里，不会有“看不见的进度”。
  function hatch(k, clipFn, box, ang, gap, t, col, lw, seed, jitter = 0.6) {
    if (t <= 0) return;
    const [bx, by, bw, bh] = box, cx = bx + bw / 2, cy = by + bh / 2;
    const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
    const half = (Math.abs(bw * nx) + Math.abs(bh * ny)) / 2, len = (Math.abs(bw * ux) + Math.abs(bh * uy)) / 2 + 4;
    const N = Math.max(1, Math.ceil((half * 2) / gap)), shown = clamp(t) * N;
    k.save(); k.beginPath(); clipFn(k); k.clip();
    k.strokeStyle = col; k.lineWidth = lw; k.lineCap = 'round';
    for (let i = 0; i < Math.ceil(shown); i++) {
      const o = -half + (i + 0.5) * gap + (rnd(seed, i) - 0.5) * jitter;
      const f = Math.min(1, shown - i);               // 最后一条按比例画出一段
      const a0 = -len + (rnd(seed + 3, i) - 0.5) * 6, a1 = len + (rnd(seed + 5, i) - 0.5) * 6;
      const px = cx + nx * o, py = cy + ny * o;
      k.beginPath(); k.moveTo(px + ux * a0, py + uy * a0); k.lineTo(px + ux * mix(a0, a1, f), py + uy * mix(a0, a1, f)); k.stroke();
    }
    k.restore();
  }
  // 不规则色块（水彩、颜料、手绘外形）：r 为平均半径，sy 为纵向比例，按 seed 生成 28 个点的闭合多边形
  function blob(cx, cy, r, seed, wav = 0.08, sy = 1) {
    const pts = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * TAU, rr = r * (1 + wav * Math.sin(3 * a + seed) + 0.05 * (rnd(seed, i) - 0.5));
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * sy]);
    }
    return pts;
  }
  function tracePts(k, pts, close = true) { pts.forEach((p, i) => (i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1]))); if (close) k.closePath(); }
  function fillPts(k, pts) { k.beginPath(); tracePts(k, pts); k.fill(); }
  function strokePts(k, pts, close = false) { k.beginPath(); tracePts(k, pts, close); k.stroke(); }
  // 颜色提亮/压暗：f>0 向白色混合，f<0 向黑色混合
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
    const t = f > 0 ? 255 : 0, a = Math.abs(f);
    return `rgb(${c.map(v => Math.round(v + (t - v) * a)).join(',')})`;
  }
  // 球面明暗：(x,y) 在以 (cx,cy) 为中心、半轴 rx/ry 的椭圆内时，按光源 L 返回 0（亮）..1（暗）；椭圆外返回 -1
  const LIGHT = (() => { const v = [-0.5, -0.6, 0.62], m = Math.hypot(...v); return v.map(c => c / m); })();
  function sphereTone(x, y, cx, cy, rx, ry) {
    const nx = (x - cx) / rx, ny = (y - cy) / ry, q = nx * nx + ny * ny;
    if (q >= 1) return -1;
    const nz = Math.sqrt(1 - q), d = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
    return clamp(1 - d, 0.06, 1);
  }
  // 点是否在多边形内（射线法）
  function inPoly(pts, x, y) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  // 多条折线按总长度依次画出前 t；返回已画完的条数 done
  function seqDraw(k, list, t) {
    const lens = list.map(pts => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; });
    let left = clamp(t) * lens.reduce((a, b) => a + b, 0), done = 0;
    for (let i = 0; i < list.length && left > 0; i++) {
      if (left >= lens[i]) { strokePts(k, list[i]); left -= lens[i]; done++; }
      else { partial(k, list[i], left / lens[i]); left = 0; }
    }
    return done;
  }
  // 来回涂抹的路径：在 test 为真的区域里逐行扫描，每行从左到右、再斜着回到下一行左端
  function scribble(test, x0, x1, y0, y1, step, seed, over = 3) {
    const pts = [];
    for (let y = y0, r = 0; y <= y1; y += step, r++) {
      let a = null, b = null;
      for (let x = x0; x <= x1; x += 2) if (test(x, y)) { if (a === null) a = x; b = x; }
      if (a === null) continue;
      pts.push([a - over * rnd(seed, r), y], [b + over * rnd(seed + 1, r), y + step / 2]);
    }
    return pts;
  }
  const CELLS = [];

  // @element 01
  // 圆珠笔排线：只用一支蓝色圆珠笔画马克杯，先勾轮廓，再一层层排线压暗右侧，最后排出投影；笔停处留下小墨点
  {
    const INK = '#1F3A93';
    const RIM = ellPts(270, 62, 50, 10, 104, 0.6, 48, Math.PI, 0.06);
    const BODY = [wobble(220, 62, 220, 170, 101, 1, 10), wobble(220, 170, 320, 170, 102, 1, 10), wobble(320, 170, 320, 62, 103, 1, 10)];
    const arcPts = (rx, ry) => { const p = []; for (let i = 0; i <= 16; i++) { const a = -Math.PI / 2 + Math.PI * i / 16; p.push([318 + Math.cos(a) * rx, 112 + Math.sin(a) * ry]); } return p; };
    const OUTLINE = [RIM, ...BODY, arcPts(26, 30), arcPts(14, 18)];
    const bodyClip = k => k.rect(280, 62, 40, 108), BODY_BOX = [280, 62, 40, 108];
    const rimClip = k => k.ellipse(270, 62, 46, 7.5, 0, 0, TAU), RIM_BOX = [224, 54, 92, 16];
    const shadowClip = k => k.ellipse(326, 176, 48, 6, 0, 0, TAU), SH_BOX = [278, 170, 96, 12];
    CELLS[0] = (k, w, h, u) => {
      paper(k, '#F7F5EF', 'rgba(0,0,0,.035)');
      // 横格本的浅蓝格线（纸的一部分，不淡出）
      k.fillStyle = 'rgba(70,110,170,.12)';
      for (let y = 8; y < CH; y += 6) k.fillRect(0, y, CW, 0.6);
      k.globalAlpha = vis(u);
      k.strokeStyle = INK; k.fillStyle = INK; k.lineCap = 'round'; k.lineJoin = 'round'; k.lineWidth = 1.2;
      const done = seqDraw(k, OUTLINE, seg(u, 0.3, 1.4));
      // 停笔处的积墨：每条轮廓线画完后，按 rnd 在末端留一个小墨点
      for (let i = 0; i < done; i++) if (rnd(i, 9) > 0.35) { const p = OUTLINE[i][OUTLINE[i].length - 1]; k.beginPath(); k.arc(p[0], p[1], 1.1, 0, TAU); k.fill(); }
      hatch(k, bodyClip, BODY_BOX, -Math.PI / 3, 4, seg(u, 1.4, 2.8), INK, 0.8, 11, 0.8);
      hatch(k, bodyClip, BODY_BOX, Math.PI / 6, 5, seg(u, 2.8, 3.8), INK, 0.7, 12, 0.8);
      hatch(k, rimClip, RIM_BOX, -Math.PI / 3, 4, seg(u, 2.8, 3.8), INK, 0.7, 13, 0.8);
      hatch(k, shadowClip, SH_BOX, -Math.PI / 3, 3.5, seg(u, 3.8, 4.4), INK, 0.7, 14, 0.8);
      k.globalAlpha = 1;
    };
  }

  // @element 02
  // 彩色铅笔：米色粗纹纸上画一只苹果，同一斜向的短笔触由浅到深一层层叠色，暗部再加交叉排线；纸纹凹处始终留白
  {
    // 苹果外形：顶部中间压下一个凹口
    const AP = blob(270, 110, 64, 3, 0.05, 0.92).map(([x, y]) => { const dx = (x - 270) / 64; return [x, y + (y < 110 ? 12 * Math.exp(-dx * dx * 18) : 0)]; });
    const LEAF = []; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, ex = Math.cos(a) * 16, ey = Math.sin(a) * 6.5; LEAF.push([292 + ex * Math.cos(-0.45) - ey * Math.sin(-0.45), 40 + ex * Math.sin(-0.45) + ey * Math.cos(-0.45)]); }
    const STEM = wobble(270, 64, 264, 34, 201, 0.8, 5);
    // 一层笔触：在 box 网格上取点，test 为真才保留；按行从上到下排好（手画的顺序）
    const layer = (poly, test, box, dx, dy, seed) => {
      const out = [], [bx, by, bw, bh] = box;
      let i = 0;
      for (let y = by; y <= by + bh; y += dy) for (let x = bx; x <= bx + bw; x += dx, i++) {
        const px = x + (rnd(i, seed) - 0.5) * dx, py = y + (rnd(i, seed + 1) - 0.5) * dy;
        if (inPoly(poly, px, py) && test(px, py)) out.push([px, py, 10 + 6 * rnd(i, seed + 2)]);
      }
      return out;
    };
    const AB = [204, 48, 132, 124];
    const L_Y = layer(AP, () => true, AB, 5, 4, 21);
    const L_O = layer(AP, (x, y) => (x - 270) + (y - 110) * 0.8 > -12, AB, 5, 4, 22);
    const L_R = layer(AP, (x, y) => (x - 270) + (y - 110) > 35, AB, 5, 4, 23);
    const L_X = layer(AP, (x, y) => (x - 270) + (y - 110) > 62, AB, 5, 4, 24);
    const L_L = layer(LEAF, () => true, [274, 28, 38, 26], 3, 3, 25);
    const TOOTH = []; for (let i = 0; i < 900; i++) { const x = AB[0] + rnd(i, 31) * AB[2], y = AB[1] + rnd(i, 32) * AB[3]; if (inPoly(AP, x, y)) TOOTH.push([x, y]); }
    function strokes(k, list, t, ang, col) {
      const n = Math.floor(clamp(t) * list.length), c = Math.cos(ang), s = Math.sin(ang);
      k.strokeStyle = col;
      for (let i = 0; i < n; i++) { const [x, y, L] = list[i]; k.beginPath(); k.moveTo(x - c * L / 2, y - s * L / 2); k.lineTo(x + c * L / 2, y + s * L / 2); k.stroke(); }
    }
    CELLS[1] = (k, w, h, u) => {
      paper(k, '#F1E6D2', 'rgba(90,70,40,.07)', 900, 3);
      const a = vis(u);
      k.lineCap = 'round'; k.lineWidth = 1.1;
      k.save(); k.beginPath(); tracePts(k, AP); k.clip();
      k.globalAlpha = a * 0.55;
      strokes(k, L_Y, seg(u, 0.3, 1.4), -Math.PI / 4, '#E9C46A');
      strokes(k, L_O, seg(u, 1.4, 2.6), -Math.PI / 4, '#E76F51');
      strokes(k, L_R, seg(u, 2.6, 3.6), -Math.PI / 4, '#9B2226');
      strokes(k, L_X, seg(u, 3.6, 4.3), Math.PI / 4, '#5C1A1B');
      // 纸纹凸点挡住铅笔：在已上色的苹果区域压一层纸色小点
      k.globalAlpha = a * 0.55 * seg(u, 0.3, 0.8); k.fillStyle = '#F1E6D2';
      TOOTH.forEach(([x, y]) => k.fillRect(x, y, 1, 1));
      k.restore();
      k.globalAlpha = a; k.strokeStyle = '#6B4F3A'; k.lineWidth = 3; partial(k, STEM, seg(u, 4.3, 4.5));
      k.save(); k.beginPath(); tracePts(k, LEAF); k.clip();
      k.globalAlpha = a * 0.6; k.lineWidth = 1.1; strokes(k, L_L, seg(u, 4.4, 4.8), -Math.PI / 4, '#4A7C59');
      k.restore();
      k.globalAlpha = 1;
    };
  }

  // @element 03
  // 蜡笔：来回涂抹给气球上色，纸纹凹处留白；再用深色压暗部、白色压高光，最后用粗线描两遍轮廓并画出气球线
  {
    const CX = 270, CY = 84;
    const BAL = blob(CX, CY, 54, 5, 0.04, 1.12);
    const inBal = (x, y) => inPoly(BAL, x, y);
    const FILL = scribble(inBal, 206, 334, 24, 146, 6, 41);
    const DARK = scribble((x, y) => inBal(x, y) && (x - CX) + (y - CY) * 0.9 > 28, 206, 334, 24, 146, 6, 42);
    const HI = scribble((x, y) => (x - 250) ** 2 + (y - 58) ** 2 < 13 * 13, 236, 264, 46, 70, 4, 43, 1);
    const GAPS = []; for (let i = 0; i < 300; i++) { const x = 206 + rnd(i, 44) * 128, y = 24 + rnd(i, 45) * 122; if (inBal(x, y)) GAPS.push([x, y, 1 + rnd(i, 46)]); }
    const RIM1 = [...BAL, BAL[0]], RIM2 = RIM1.map(([x, y]) => [CX + (x - CX) * 1.028, CY + (y - CY) * 1.028]);
    const STRING = []; for (let i = 0; i <= 12; i++) STRING.push([CX + 6 * Math.sin(i * 0.6), 150 + i * 4.5]);
    CELLS[2] = (k, w, h, u) => {
      paper(k, '#FBF8F1', 'rgba(0,0,0,.04)');
      const a = vis(u), tf = seg(u, 0.3, 2.6);
      k.lineCap = 'round'; k.lineJoin = 'round';
      k.save(); k.beginPath(); tracePts(k, BAL); k.clip();
      k.globalAlpha = a * 0.85; k.strokeStyle = '#E63946'; k.lineWidth = 7; partial(k, FILL, tf);
      k.globalAlpha = a * 0.8; k.strokeStyle = '#9D0208'; k.lineWidth = 6; partial(k, DARK, seg(u, 2.6, 3.4));
      // 纸纹留白：只在已经涂到的行里出现
      const fy = 24 + tf * 122;
      k.globalAlpha = a * 0.9; k.fillStyle = '#FBF8F1';
      GAPS.forEach(([x, y, s]) => { if (y < fy - 4) k.fillRect(x, y, s, s); });
      k.globalAlpha = a * 0.7; k.strokeStyle = '#FFFFFF'; k.lineWidth = 5; partial(k, HI, seg(u, 3.4, 3.8));
      k.restore();
      k.globalAlpha = a; k.strokeStyle = '#370617'; k.lineWidth = 3.5;
      partial(k, RIM1, seg(u, 3.8, 4.25));
      partial(k, RIM2, seg(u, 4.25, 4.6));
      k.lineWidth = 2; partial(k, STRING, seg(u, 4.6, 4.9));
      if (u >= 4.6) { k.fillStyle = '#370617'; k.beginPath(); k.moveTo(CX - 5, 153); k.lineTo(CX + 5, 153); k.lineTo(CX, 146); k.closePath(); k.fill(); }
      k.globalAlpha = 1;
    };
  }

  // @element 04
  // 炭笔擦画：先用炭条铺满画面并抹匀，再用橡皮擦出梨和窗光，最后在擦过的地方重新勾线，旧线条留下淡淡的痕迹
  {
    const CH_ = '#2A2826', PAPER = '#ECE8E1';
    // 梨：上小下大，由两个 blob 叠成的轮廓
    const PEAR = blob(270, 124, 40, 8, 0.04, 1).map(([x, y]) => { const dy = (y - 124) / 40; return dy < 0 ? [270 + (x - 270) * (1 + 0.55 * dy), 124 + (y - 124) * 1.9] : [x, y]; });
    // 窗框整个放在炭粉区（x 108–432）里面，否则右半边窗光擦在没有炭的白纸上
    const WIN = [[340, 24], [420, 24], [420, 104], [340, 104]];
    const STROKES = []; for (let i = 0; i < 26; i++) STROKES.push([120 + i * 12 + (rnd(i, 61) - 0.5) * 4, 6 + rnd(i, 62) * 6, CH - 6 - rnd(i, 63) * 6]);
    const PEAR_LINE = [...PEAR, PEAR[0]], WIN_LINES = [[...WIN, WIN[0]], [[380, 24], [380, 104]], [[340, 64], [420, 64]]];
    const STEM = wobble(268, 50, 274, 36, 64, 0.6, 4);
    CELLS[3] = (k, w, h, u) => {
      paper(k, PAPER, 'rgba(0,0,0,.05)', 600, 7);
      const a = vis(u);
      k.lineCap = 'round';
      // 0.3–1.4 秒：竖向宽笔触，从左往右铺炭
      const n = seg(u, 0.3, 1.4) * STROKES.length;
      k.globalAlpha = a * 0.12; k.strokeStyle = CH_; k.lineWidth = 22;
      for (let i = 0; i < Math.ceil(n); i++) { const [x, y0, y1] = STROKES[i], f = Math.min(1, n - i); k.beginPath(); k.moveTo(x, y0); k.lineTo(x + 3, mix(y0, y1, f)); k.stroke(); }
      // 1.4–2.0 秒：抹匀
      k.globalAlpha = a * 0.45 * seg(u, 1.4, 2.0); k.fillStyle = CH_; k.fillRect(108, 0, 324, CH);
      // 2.0–3.4 秒：橡皮擦出亮部，边缘柔和
      const e = seg(u, 2.0, 3.4);
      if (e > 0) {
        k.save(); k.globalAlpha = a * 0.85 * e; k.fillStyle = PAPER; k.shadowColor = PAPER; k.shadowBlur = 8;
        fillPts(k, PEAR); k.fillRect(344, 28, 72, 72);
        k.restore();
      }
      // 3.4–4.6 秒：重新勾线；旧轮廓偏 3 px 留一道淡痕
      const r = seg(u, 3.4, 4.6);
      if (r > 0) {
        k.globalAlpha = a * 0.25 * Math.min(1, r * 3); k.strokeStyle = CH_; k.lineWidth = 1.6;
        k.save(); k.translate(3, 2); strokePts(k, PEAR_LINE); k.restore();
        k.globalAlpha = a; k.lineWidth = 2;
        seqDraw(k, [PEAR_LINE, STEM, ...WIN_LINES], r);
      }
      k.globalAlpha = 1;
    };
  }

  // @element 05
  // 铅笔水彩：先打铅笔稿，再由浅到深上水彩，颜色不完全填满轮廓、边缘留下水渍线，最后用铅笔补几笔
  {
    const FC = [270, 82];
    const PETALS = [0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + i * TAU / 5; return blob(FC[0] + Math.cos(a) * 24, FC[1] + Math.sin(a) * 24, 19, 70 + i, 0.06); });
    const LEAVES = [[236, 150, -0.6], [306, 140, 0.5]].map(([x, y, r], i) => { const p = []; for (let j = 0; j < 24; j++) { const t = j / 24 * TAU, ex = Math.cos(t) * 24, ey = Math.sin(t) * 9; p.push([x + ex * Math.cos(r) - ey * Math.sin(r), y + ex * Math.sin(r) + ey * Math.cos(r)]); } return p; });
    const STEM = wobble(270, 106, 272, 196, 75, 1.4, 10);
    const CENTER = ellPts(FC[0], FC[1], 11, 11, 76, 0.6, 28, 0, 0.1);
    const SKETCH = [...PETALS.map(p => [...p, p[0]]), CENTER, STEM, ...LEAVES.map(p => [...p, p[0]])];
    // 水彩块：比轮廓小一圈并偏向一侧，不完全填满
    const wash = (pts, s, ox, oy) => { const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length; return pts.map(([x, y]) => [cx + (x - cx) * s + ox, cy + (y - cy) * s + oy]); };
    const W1 = [...PETALS.map((p, i) => [wash(p, 0.8, 3, 2), 'rgba(240,128,128,', i]), ...LEAVES.map((p, i) => [wash(p, 0.8, 2, 3), 'rgba(120,170,110,', 5 + i])];
    const W2 = [...PETALS.map((p, i) => [wash(p, 0.5, 5, 4), 'rgba(214,84,96,', i]), ...LEAVES.map((p, i) => [wash(p, 0.5, 4, 3), 'rgba(80,130,80,', 5 + i])];
    const DETAIL = [0, 1, 2, 3, 4, 5].map(i => { const a = i * TAU / 6; return [[FC[0] + Math.cos(a) * 4, FC[1] + Math.sin(a) * 4], [FC[0] + Math.cos(a) * 10, FC[1] + Math.sin(a) * 10]]; });
    function washes(k, list, u, t0, t1, alpha) {
      list.forEach(([pts, col, i]) => {
        const t = seg(u, t0 + (t1 - t0) * i / 7 * 0.6, t0 + (t1 - t0) * (i / 7 * 0.6 + 0.4));
        if (t <= 0) return;
        k.fillStyle = col + (alpha * t) + ')'; fillPts(k, pts);
        k.strokeStyle = col + ((alpha + 0.15) * t) + ')'; k.lineWidth = 1.2; strokePts(k, [...pts, pts[0]]);
      });
    }
    CELLS[4] = (k, w, h, u) => {
      paper(k, '#FAF7F0', 'rgba(0,0,0,.04)', 600, 9);
      const a = vis(u);
      k.globalAlpha = a; k.lineCap = 'round'; k.lineJoin = 'round';
      k.strokeStyle = '#7A7A7A'; k.lineWidth = 0.8; seqDraw(k, SKETCH, seg(u, 0.3, 1.4));
      washes(k, W1, u, 1.4, 2.6, 0.35);
      washes(k, W2, u, 2.6, 3.6, 0.3);
      // 3.6–4.4 秒：颜色上面补铅笔线、加深花心
      k.strokeStyle = '#5A5A5A'; k.lineWidth = 1; seqDraw(k, DETAIL, seg(u, 3.6, 4.2));
      const c = seg(u, 4.1, 4.4);
      if (c > 0) { k.fillStyle = `rgba(90,80,60,${0.5 * c})`; k.beginPath(); k.arc(FC[0], FC[1], 5, 0, TAU); k.fill(); }
      k.globalAlpha = 1;
    };
  }

  // @element 06
  // 墨线淡彩：顺序与铅笔水彩相反，先铺湿润的淡彩，颜色漫出轮廓、边缘起回流花边，再用软笔尖勾出两头细中间粗的墨线
  {
    const INK = '#1B1B1B';
    // 小鸟：身体、头、尾巴、喙；站在一根斜枝上
    const BODY = blob(262, 104, 34, 11, 0.03, 0.78);
    const HEAD = blob(292, 78, 17, 12, 0.03);
    // 枝条的淡彩：沿墨线 (150,178)→(392,138) 的一条斜带，半宽 6–9 px，比墨线略长，跟枝条同向
    // （原先用横向椭圆，看起来像鸟脚下的影子，和斜枝对不上）
    const BRANCH_WASH = [];
    {
      const top = [], bot = [];
      for (let i = 0; i <= 24; i++) {
        const s = i / 24, x = 146 + 250 * s, y = 178.7 - 41.4 * s, hw = 6 + 3 * Math.sin(Math.PI * s);
        top.push([x, y - hw + (rnd(i, 17) - 0.5) * 2]); bot.push([x, y + hw + (rnd(i, 18) - 0.5) * 2]);
      }
      BRANCH_WASH.push(...top, ...bot.reverse());
    }
    const WASH = [
      [blob(260, 106, 42, 13, 0.07, 0.8), 'rgba(196,140,90,.40)'],
      [blob(292, 78, 23, 14, 0.07), 'rgba(196,140,90,.40)'],
      [blob(262, 118, 26, 15, 0.08, 0.6), 'rgba(230,200,150,.40)'],
      [BRANCH_WASH, 'rgba(120,100,80,.35)'],
    ];
    const BLOOMS = [[240, 96, 9], [280, 116, 7], [296, 72, 6], [222, 162, 8]];
    const LINES = [
      [...BODY.slice(14), ...BODY.slice(0, 8)],
      [...HEAD.slice(10), ...HEAD.slice(0, 26)],
      [[230, 96], [206, 88], [198, 96], [230, 108]],
      [[307, 76], [322, 80], [306, 84]],
      [[150, 178], [210, 166], [270, 158], [340, 146], [392, 138]],
      [[256, 128], [254, 146], [258, 158]], [[270, 128], [272, 146], [276, 156]],
      [[240, 100], [258, 92], [276, 104]],
    ];
    CELLS[5] = (k, w, h, u) => {
      paper(k, '#F8F4EA', 'rgba(0,0,0,.04)', 500, 13);
      const a = vis(u);
      // 0.3–1.8 秒：淡彩一块块铺开，透明度随进度上升
      WASH.forEach(([pts, col], i) => {
        const t = seg(u, 0.3 + 0.3 * i, 0.9 + 0.3 * i);
        if (t <= 0) return;
        k.globalAlpha = a * t; k.fillStyle = col; fillPts(k, pts);
      });
      // 回流花边：边缘更深的小色块
      BLOOMS.forEach(([x, y, r], i) => {
        const t = seg(u, 1.2 + 0.12 * i, 1.8);
        if (t <= 0) return;
        k.globalAlpha = a * t; k.strokeStyle = 'rgba(150,100,60,.35)'; k.lineWidth = 1.4;
        strokePts(k, [...blob(x, y, r, 80 + i, 0.15), blob(x, y, r, 80 + i, 0.15)[0]]);
      });
      // 1.8–4.4 秒：墨线，每条两头细中间粗
      k.globalAlpha = a; k.strokeStyle = INK; k.lineCap = 'round';
      const tl = seg(u, 1.8, 4.4) * LINES.length;
      for (let j = 0; j < Math.ceil(tl); j++) {
        const pts = LINES[j], f = Math.min(1, tl - j), m = (pts.length - 1) * f;
        for (let i = 0; i < Math.ceil(m); i++) {
          const s = (i + 0.5) / (pts.length - 1), g = Math.min(1, m - i);
          const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
          k.lineWidth = 0.6 + 2.2 * Math.sin(Math.PI * s);
          k.beginPath(); k.moveTo(x0, y0); k.lineTo(mix(x0, x1, g), mix(y0, y1, g)); k.stroke();
        }
      }
      const e = seg(u, 4.4, 4.8);
      if (e > 0) { k.fillStyle = INK; k.beginPath(); k.arc(298, 74, 2.6 * e, 0, TAU); k.fill(); }
      k.globalAlpha = 1;
    };
  }

  // @element 07
  // 油画厚涂：在调过色的亚麻布上先用稀薄的长笔触铺出大形，再一笔笔叠上厚而短的颜料，每笔带亮边和暗边；最后点上最厚的高光
  {
    const BG = '#3E3A35', TB = '#7A5C3E', BOT = '#6B8E4E', PEARC = '#C8A24A';
    const inBottle = (x, y) => (x >= 236 && x <= 276 && y >= 60 && y <= 170) || (x >= 249 && x <= 263 && y >= 26 && y <= 60);
    const inPear = (x, y) => Math.hypot(x - 326, y - 148) < 30 || Math.hypot(x - 320, y - 116) < 17;
    const HZ = 132; // 桌沿
    // 区域：0 背景、1 桌面、2 瓶子、3 梨；按画家顺序先远后近
    const region = (x, y) => (inBottle(x, y) ? 2 : inPear(x, y) ? 3 : y < HZ ? 0 : 1);
    const BASE = [BG, TB, BOT, PEARC];
    // 笔触 = [x, y, 角度, 长, 宽, 主色, 亮边色, 暗边色]
    const BLOCK = [], IMP = [];
    let i = 0;
    for (let y = 8; y <= 200; y += 12) for (let x = 96; x <= 444; x += 16, i++) {
      const px = x + (rnd(i, 71) - 0.5) * 8, py = y + (rnd(i, 72) - 0.5) * 6, r = region(px, py);
      const ang = r === 2 ? Math.PI / 2 : r === 1 ? (rnd(i, 73) - 0.5) * 0.3 : r === 3 ? 0.9 : -0.5 + (rnd(i, 73) - 0.5) * 0.4;
      let L = 30 + 20 * rnd(i, 74);
      // 瓶子和梨的铺色笔触同样收在本区域内（最短 10 px），不然 30–50 px 的长笔触会把梨铺成一大块
      if (r >= 2) {
        const ca = Math.cos(ang), sa = Math.sin(ang);
        while (L > 10 && (region(px - ca * L / 2, py - sa * L / 2) !== r || region(px + ca * L / 2, py + sa * L / 2) !== r)) L -= 2;
      }
      BLOCK.push([r, px, py, ang, L, 14, BASE[r]]);
    }
    BLOCK.sort((a, b) => a[0] - b[0]);
    i = 0;
    for (let y = 10; y <= 198; y += 9) for (let x = 100; x <= 440; x += 10, i++) {
      const px = x + (rnd(i, 75) - 0.5) * 6, py = y + (rnd(i, 76) - 0.5) * 5, r = region(px, py);
      if (r === 0 && rnd(i, 77) > 0.4) continue; // 背景只零星加厚
      // 光从左上来：越靠左越亮
      const f = r === 2 ? 0.25 - 0.5 * (px - 236) / 40 : r === 3 ? 0.3 - 0.6 * clamp((px - 296 + py - 98) / 100) : r === 1 ? 0.12 - 0.2 * (py - HZ) / 70 : 0.08;
      const ang = r === 2 ? Math.PI / 2 + (rnd(i, 78) - 0.5) * 0.3 : (r === 1 ? 0 : 0.8) + (rnd(i, 78) - 0.5) * 0.6;
      const c = BASE[r];
      let L = 12 + 8 * rnd(i, 79);
      // 瓶子和梨上的厚涂笔触两端都要落在本区域内，否则斜向长笔触会把梨的外形糊成一团
      if (r >= 2) {
        const ca = Math.cos(ang), sa = Math.sin(ang);
        while (L > 6 && (region(px - ca * L / 2, py - sa * L / 2) !== r || region(px + ca * L / 2, py + sa * L / 2) !== r)) L -= 2;
        if (L <= 6) continue;
      }
      IMP.push([r, px, py, ang, L, 8 + 2 * rnd(i, 80), shade(c, f), shade(c, clamp(f + 0.3, -1, 1)), shade(c, f - 0.3 < 0 ? f - 0.3 : -0.1)]);
    }
    IMP.sort((a, b) => a[0] - b[0]);
    const HI = [];
    for (let y = 72; y <= 160; y += 14) HI.push([2, 243, y, Math.PI / 2, 12, 5, '#F2E6C8', '#FFF8E8', '#C9B892']);
    HI.push([2, 253, 34, Math.PI / 2, 14, 4, '#F2E6C8', '#FFF8E8', '#C9B892'], [3, 312, 140, 0.9, 12, 6, '#F2E6C8', '#FFF8E8', '#C9B892'], [3, 312, 112, 0.9, 8, 5, '#F2E6C8', '#FFF8E8', '#C9B892']);
    function dab(k, s, f, edges) {
      const [, x, y, a, L, W, col, hi, lo] = s, c = Math.cos(a), sn = Math.sin(a);
      const x0 = x - c * L / 2, y0 = y - sn * L / 2, x1 = x0 + c * L * f, y1 = y0 + sn * L * f;
      k.lineWidth = W; k.strokeStyle = col; k.beginPath(); k.moveTo(x0, y0); k.lineTo(x1, y1); k.stroke();
      if (!edges) return;
      // 厚涂的立体感：笔触一侧沿法线偏 1.5 px 画亮边，另一侧画暗边
      const nx = -sn * (W / 2 - 1.5), ny = c * (W / 2 - 1.5), ga = k.globalAlpha;
      k.lineWidth = 1.5; k.globalAlpha = ga * 0.5;
      k.strokeStyle = hi; k.beginPath(); k.moveTo(x0 - nx, y0 - ny); k.lineTo(x1 - nx, y1 - ny); k.stroke();
      k.strokeStyle = lo; k.beginPath(); k.moveTo(x0 + nx, y0 + ny); k.lineTo(x1 + nx, y1 + ny); k.stroke();
      k.globalAlpha = ga;
    }
    // 按进度依次画一组笔触，最后一笔只画出一部分
    function dabs(k, list, t, edges) {
      const n = clamp(t) * list.length;
      for (let j = 0; j < Math.ceil(n); j++) dab(k, list[j], Math.min(1, n - j), edges);
    }
    CELLS[6] = (k, w, h, u) => {
      k.fillStyle = '#B8865B'; k.fillRect(0, 0, CW, CH);
      // 亚麻布纹：横竖交错的细线
      k.fillStyle = 'rgba(70,45,20,.08)';
      for (let x = 0; x < CW; x += 3) k.fillRect(x, 0, 1, CH);
      for (let y = 0; y < CH; y += 3) k.fillRect(0, y, CW, 1);
      const a = vis(u);
      k.lineCap = 'round';
      k.globalAlpha = a * 0.7; dabs(k, BLOCK, seg(u, 0.3, 1.8), false);
      k.globalAlpha = a; dabs(k, IMP, seg(u, 1.8, 3.8), true);
      dabs(k, HI, seg(u, 3.8, 4.6), true);
      k.globalAlpha = 1;
    };
  }

  // @element 08
  // 分色笔触：水面日落全用不调和的短色点铺成，相邻色点颜色不同，远看才混成天色和水光；太阳最后单独点上
  {
    const SUN = [300, 94, 22], HZ = 112;
    const SKY_T = ['#5B7DB1', '#8E7CC3', '#F2B5A0'], SKY_L = ['#F4A259', '#F6D06F', '#E76F51'];
    const WATER = ['#3D5A80', '#98C1D9', '#5B7DB1'], REFL = ['#F4A259', '#F6D06F', '#98C1D9'];
    const SUNP = ['#FFE8A3', '#FFD166'];
    const COLS = [...new Set([...SKY_T, ...SKY_L, ...WATER, ...REFL])];
    // 色点 = [x, y, 角度, 颜色序号]；按行从上到下、行内从左到右排列，就是落笔顺序
    const DABS = [];
    let i = 0;
    for (let y = 10, r = 0; y <= 200; y += 6, r++) for (let x = 40 + (r % 2) * 3; x <= 500; x += 7, i++) {
      const px = x + (rnd(i, 81) - 0.5) * 4, py = y + (rnd(i, 82) - 0.5) * 2;
      const pal = py < 56 ? SKY_T : py < HZ ? SKY_L : Math.abs(px - SUN[0]) < 14 + (py - HZ) * 0.5 ? REFL : WATER;
      DABS.push([px, py, (rnd(i, 83) - 0.5) * 0.4, COLS.indexOf(pal[Math.floor(rnd(i, 84) * pal.length)])]);
    }
    const SUND = [];
    for (let y = SUN[1] - SUN[2]; y <= SUN[1] + SUN[2]; y += 3) for (let x = SUN[0] - SUN[2]; x <= SUN[0] + SUN[2]; x += 4, i++) {
      if (Math.hypot(x - SUN[0], y - SUN[1]) > SUN[2] - 2) continue;
      SUND.push([x + (rnd(i, 85) - 0.5) * 2, y, rnd(i, 86) * Math.PI, rnd(i, 87) < 0.5 ? 0 : 1]);
    }
    // 同色的点合成一条路径一次填充，减少每帧的填充次数
    function paint(k, list, n, cols) {
      cols.forEach((col, ci) => {
        k.fillStyle = col; k.beginPath();
        for (let j = 0; j < n; j++) { const d = list[j]; if (d[3] !== ci) continue; k.moveTo(d[0] + 4.5 * Math.cos(d[2]), d[1] + 4.5 * Math.sin(d[2])); k.ellipse(d[0], d[1], 4.5, 2, d[2], 0, TAU); }
        k.fill();
      });
    }
    CELLS[7] = (k, w, h, u) => {
      paper(k, '#E9E2D0', 'rgba(80,60,30,.06)', 500, 17);
      k.globalAlpha = vis(u);
      paint(k, DABS, Math.floor(seg(u, 0.3, 4.6) * DABS.length), COLS);
      paint(k, SUND, Math.floor(seg(u, 4.0, 4.6) * SUND.length), SUNP);
      k.globalAlpha = 1;
    };
  }

  // @element 09
  // 世纪中期水粉：不透明的哑光色块一块块拍上去，边缘带干刷的毛边；最后的墨线整体错开几像素，和色块对不齐
  {
    const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    const BLOCKS = [
      [rect(60, 170, 420, 24), '#3D405B'],
      [rect(120, 70, 58, 100), '#3D405B'],
      [rect(178, 96, 52, 74), '#81B29A'],
      [rect(230, 50, 46, 120), '#E07A5F'],
      [rect(300, 84, 64, 86), '#F2CC8F'],
      [blob(440, 44, 20, 91, 0.01), '#E07A5F'],
      [blob(170, 38, 26, 92, 0.06, 0.42), '#FBF7EE'],
      [rect(396, 146, 8, 24), '#3D405B'],
      [blob(400, 126, 26, 93, 0.04), '#81B29A'],
    ];
    const STEP = (3.4 - 0.25 - 0.3) / (BLOCKS.length - 1);
    // 干刷毛边：在每块边缘取点，沿离开中心的方向拉出短细线
    const DRY = BLOCKS.map(([pts], b) => {
      const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      const n = 8 + Math.floor(rnd(b, 94) * 7), out = [];
      for (let j = 0; j < n; j++) {
        const e = Math.floor(rnd(b * 31 + j, 95) * pts.length), q = pts[e], q2 = pts[(e + 1) % pts.length], f = rnd(b * 31 + j, 96);
        const x = mix(q[0], q2[0], f), y = mix(q[1], q2[1], f), d = Math.hypot(x - cx, y - cy) || 1, L = 6 + 4 * rnd(b * 31 + j, 97);
        out.push([x, y, x + (x - cx) / d * L, y + (y - cy) / d * L]);
      }
      return out;
    });
    // 刷痕：色块内的几道纸色细线
    const BRUSH = BLOCKS.map(([pts], b) => {
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      return [0, 1, 2].map(j => { const y = mix(y0, y1, 0.2 + 0.3 * j + 0.1 * rnd(b, 98 + j)); return [x0 + 3, y, x1 - 3, y + 1]; });
    });
    // 墨线：楼的轮廓、窗格、树干、云
    const INK = [];
    BLOCKS.forEach(([pts], b) => { if (b !== 0 && b !== 7) INK.push([...pts, pts[0]]); });
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) INK.push([...rect(128 + c * 17, 80 + r * 17, 8, 10), [128 + c * 17, 80 + r * 17]]);
    for (let c = 0; c < 3; c++) INK.push([[240 + c * 13, 60], [240 + c * 13, 160]]);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) INK.push([...rect(308 + c * 14, 94 + r * 22, 8, 12), [308 + c * 14, 94 + r * 22]]);
    INK.push([[400, 170], [400, 140]], [[60, 170], [480, 170]]);
    CELLS[8] = (k, w, h, u) => {
      paper(k, '#F2E8D5', 'rgba(90,70,40,.06)', 500, 19);
      const a = vis(u);
      k.lineCap = 'round';
      BLOCKS.forEach(([pts, col], b) => {
        const t = seg(u, 0.3 + STEP * b, 0.55 + STEP * b);
        if (t <= 0) return;
        k.globalAlpha = a * t; k.fillStyle = col; fillPts(k, pts);
        k.strokeStyle = col; k.lineWidth = 1; k.globalAlpha = a * t * 0.6;
        DRY[b].forEach(([x0, y0, x1, y1]) => { k.beginPath(); k.moveTo(x0, y0); k.lineTo(x1, y1); k.stroke(); });
        k.globalAlpha = a * t * 0.18; k.fillStyle = '#F2E8D5';
        BRUSH[b].forEach(([x0, y0, x1, y1]) => k.fillRect(x0, y0, x1 - x0, y1 - y0));
      });
      // 3.4–4.6 秒：墨线整体偏移 (3, -2)，故意和色块错位
      k.globalAlpha = a; k.strokeStyle = '#2B2B2B'; k.lineWidth = 1.5; k.lineJoin = 'round';
      k.save(); k.translate(3, -2); seqDraw(k, INK, seg(u, 3.4, 4.6)); k.restore();
      k.globalAlpha = 1;
    };
  }

  // @element 10
  // 点描：一支针管笔，从最暗处开始一点点点出一只蛋和它的投影；明暗只靠点的疏密，最亮处几乎不落点
  {
    const INK = '#20201E', CX = 270, CY = 96, RX = 54, RY = 70;
    // 蛋形：上窄下宽，横半轴随纵向位置变化
    // 边缘再加深一圈（q>0.8 起），否则亮面一侧几乎没有点、蛋形认不出来
    const eggTone = (x, y) => {
      const ny = (y - CY) / RY, rx = RX * (1 + 0.12 * ny), t = sphereTone(x, y, CX, CY, rx, RY);
      if (t < 0) return t;
      const nx = (x - CX) / rx, q = nx * nx + ny * ny;
      return Math.min(1, Math.max(t, 0.14) + 0.45 * seg(q, 0.8, 1));
    };
    const tone = (x, y) => {
      const t = eggTone(x, y);
      if (t >= 0) return t;
      const dx = (x - 304) / 84, dy = (y - 180) / 13, d2 = dx * dx + dy * dy;
      return d2 < 1 ? 0.7 * (1 - d2) : 0;
    };
    // 点阵在定义时算好：2.2 px 网格加抖动，按色调概率保留，再按从暗到亮排序（计划为 3 px，截图后加密）
    const DOTS = [];
    let id = 0;
    for (let y = 18; y <= 204; y += 2.2) for (let x = 150; x <= 390; x += 2.2, id++) {
      const px = x + (rnd(id, 1) - 0.5) * 1.8, py = y + (rnd(id, 2) - 0.5) * 1.8, t = tone(px, py);
      if (t > 0 && rnd(id, 7) < Math.pow(t, 1.2) * 0.9) DOTS.push([px, py, t, id]);
    }
    // 只按色调排序时，相邻两点常在蛋的两头，笔尖每帧乱跳；
    // 改为色调分 6 档从暗到亮，每档内按 10 px 行蛇形扫过，笔尖成片移动
    const band = d => Math.min(5, Math.floor(d[2] * 6)), row = d => Math.floor(d[1] / 10);
    DOTS.sort((a, b) => band(b) - band(a) || row(a) - row(b) || (row(a) % 2 ? b[0] - a[0] : a[0] - b[0]));
    CELLS[9] = (k, w, h, u) => {
      paper(k, '#F6F2EA', 'rgba(60,50,30,.05)');
      const a = vis(u), n = Math.floor(seg(u, 0.3, 4.8) * DOTS.length);
      k.globalAlpha = a; k.fillStyle = INK;
      for (let i = 0; i < n; i++) { k.beginPath(); k.arc(DOTS[i][0], DOTS[i][1], 0.85, 0, TAU); k.fill(); }
      // 针管笔：停在刚点下的那个点上，画完后淡出
      const pa = (1 - seg(u, 4.8, 5.1)) * (n > 0 ? 1 : 0);
      if (pa > 0) {
        const [px, py] = DOTS[Math.min(n, DOTS.length - 1)];
        k.globalAlpha = a * pa * 0.8; k.strokeStyle = INK; k.lineCap = 'round';
        k.lineWidth = 2; k.beginPath(); k.moveTo(px + 2, py - 2); k.lineTo(px + 26, py - 26); k.stroke();
        k.lineWidth = 5; k.beginPath(); k.moveTo(px + 14, py - 14); k.lineTo(px + 26, py - 26); k.stroke();
      }
      k.globalAlpha = 1;
    };
  }

  // @element 11
  // 单线雕版：一条不断开的螺旋线从球心往外画出，线越粗越暗，整只受光的球体只由这一条线构成
  {
    const INK = '#1E2A3A', CX = 270, CY = 104, R = 88, PITCH = 3.2;
    // 螺线点在定义时算好：弧长步长约 2 px，每点记下该处的线宽
    const SP = [];
    for (let th = 0; ;) {
      const r = PITCH * th / TAU;
      if (r > R) break;
      const x = CX + Math.cos(th) * r, y = CY + Math.sin(th) * r, t = Math.max(0, sphereTone(x, y, CX, CY, R + 0.5, R + 0.5));
      SP.push([x, y, 0.35 + 2.3 * t]);
      th += 2 / Math.hypot(r, PITCH / TAU);
    }
    CELLS[10] = (k, w, h, u) => {
      paper(k, '#F1EAD9', 'rgba(80,60,30,.05)');
      const a = vis(u), n = Math.floor(seg(u, 0.3, 4.6) * (SP.length - 1));
      k.globalAlpha = a; k.strokeStyle = INK; k.lineCap = 'round'; k.lineJoin = 'round';
      // 线宽相近（按 0.2 量化）的连续段合成一条路径，减少描边次数
      let i = 0;
      while (i < n) {
        const q = Math.round(SP[i][2] * 5) / 5;
        k.lineWidth = q; k.beginPath(); k.moveTo(SP[i][0], SP[i][1]);
        while (i < n && Math.round(SP[i][2] * 5) / 5 === q) { i++; k.lineTo(SP[i][0], SP[i][1]); }
        k.stroke();
      }
      // 笔尖墨点，画完后淡出
      const pa = 1 - seg(u, 4.6, 4.9);
      if (n > 0 && pa > 0) { k.globalAlpha = a * pa; k.fillStyle = INK; k.beginPath(); k.arc(SP[n][0], SP[n][1], 2, 0, TAU); k.fill(); }
      k.globalAlpha = 1;
    };
  }

  // @element 12
  // 刮画：全黑涂层上用刮刀一道道刮出白线，先刮月亮轮廓，再横向刮满月面（避开月坑），最后刮出海浪和星星
  {
    const WHITE = '#F2EEE6', MX = 270, MY = 84, MR = 56;
    const RIM = ellPts(MX, MY, MR, MR, 31, 0.8, 72, -Math.PI / 2, 0.05);
    const CRATERS = [[248, 70, 10], [290, 96, 14], [262, 112, 7]];
    // 月面横线：37 条、间距 3 px，每条拆成避开月坑的若干段；记下每条的总长，按长度推进
    const LINES = [];
    for (let i = 0; i < 37; i++) {
      const y = MY - 54 + i * 3, half = Math.sqrt(Math.max(0, MR * MR - (y - MY) * (y - MY))) - 2;
      let parts = [[MX - half, MX + half]];
      CRATERS.forEach(([cx, cy, cr]) => {
        const dy = y - cy; if (Math.abs(dy) >= cr) return;
        const hw = Math.sqrt(cr * cr - dy * dy) + 1.5, next = [];
        parts.forEach(([a, b]) => { if (cx - hw > a) next.push([a, Math.min(b, cx - hw)]); if (cx + hw < b) next.push([Math.max(a, cx + hw), b]); });
        parts = next;
      });
      LINES.push({ y, parts, len: parts.reduce((s, [a, b]) => s + (b - a), 0) });
    }
    const WAVES = [158, 167, 176, 185, 194].map((y0, j) => { const pts = []; for (let x = 40; x <= 500; x += 4) pts.push([x, y0 + 2.5 * Math.sin(x / 14 + j)]); return pts; });
    const STARS = [];
    for (let s = 0; STARS.length < 6; s++) {
      const x = 40 + rnd(s, 41) * 460, y = 10 + rnd(s, 42) * 48;
      if (Math.hypot(x - MX, y - MY) > MR + 20 && STARS.every(([sx, sy]) => Math.hypot(sx - x, sy - y) > 50)) STARS.push([x, y]);
    }
    function knife(k, x, y) { k.beginPath(); k.moveTo(x, y); k.lineTo(x + 5, y - 11); k.lineTo(x + 10, y - 7); k.closePath(); k.fill(); }
    CELLS[11] = (k, w, h, u) => {
      // 黑色涂层就是“纸”，不随复位淡出；刮出的白线随 vis 淡去
      paper(k, '#121212', 'rgba(255,255,255,.025)', 300, 5);
      const a = vis(u);
      k.globalAlpha = a; k.strokeStyle = WHITE; k.fillStyle = WHITE; k.lineCap = 'round';
      let tip = null;
      // 0.3–1.2 秒：月亮轮廓
      const tr = seg(u, 0.3, 1.2);
      k.lineWidth = 1.4; partial(k, RIM, tr);
      if (tr > 0 && tr < 1) tip = RIM[Math.floor(tr * (RIM.length - 1))];
      // 1.2–3.6 秒：月面横线，从上到下，每条从左往右
      const p = seg(u, 1.2, 3.6) * LINES.length;
      k.lineWidth = 1.1;
      for (let i = 0; i < Math.ceil(p); i++) {
        const L = LINES[i]; let left = Math.min(1, p - i) * L.len;
        for (const [x0, x1] of L.parts) {
          if (left <= 0) break;
          const x = Math.min(x1, x0 + left); left -= x1 - x0;
          k.beginPath(); k.moveTo(x0, L.y); k.lineTo(x, L.y); k.stroke();
          if (p - i < 1) tip = [x, L.y];
        }
      }
      // 3.6–4.6 秒：海浪，从左往右，每条错开 0.1 秒
      k.lineWidth = 1.2;
      WAVES.forEach((pts, j) => {
        const t = seg(u, 3.6 + 0.1 * j, 4.2 + 0.1 * j);
        partial(k, pts, t);
        if (t > 0 && t < 1) tip = pts[Math.floor(t * (pts.length - 1))];
      });
      // 4.6–5.0 秒：星星一颗颗刮出
      k.lineWidth = 1;
      STARS.forEach(([x, y], i) => {
        const t = seg(u, 4.6 + 0.065 * i, 4.7 + 0.065 * i);
        if (t <= 0) return;
        const r = 4 * t;
        k.beginPath(); k.moveTo(x - r, y); k.lineTo(x + r, y); k.moveTo(x, y - r); k.lineTo(x, y + r); k.stroke();
      });
      // 刮刀刀尖，跟着当前刮到的位置
      if (tip) { k.globalAlpha = a * 0.7; knife(k, tip[0], tip[1]); }
      k.globalAlpha = 1;
    };
  }

  // @element 13
  // 纸艺剧场：剪纸景片由后往前一层层滑入（天幕、太阳、远山、近山），最后台口从上方落下；层与层之间有空隙和投影
  {
    // 撕纸边：沿闭合多边形各边加抖动
    const torn = (corners, seed, amp = 1.4) => {
      const pts = [];
      corners.forEach((p, i) => { const q = corners[(i + 1) % corners.length], n = Math.max(2, Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) / 14)); pts.push(...wobble(p[0], p[1], q[0], q[1], seed + i, amp, n).slice(0, -1)); });
      return pts;
    };
    const ridge = (top, amp, f, ph, seed) => {
      const pts = [[40, 200]];
      for (let x = 40; x <= 500; x += 10) pts.push([x, top + amp * Math.sin(x / f + ph) + 0.5 * amp * Math.sin(x / (f * 0.43) + ph * 2) + (rnd(seed, x) - 0.5) * 1.6]);
      pts.push([500, 200]);
      return pts;
    };
    const SKY = torn([[40, 14], [500, 14], [500, 196], [40, 196]], 51);
    const SUN = blob(360, 70, 30, 2.2, 0.02);
    const FAR = ridge(110, 12, 46, 0.8, 53), NEAR = ridge(142, 10, 34, 2.1, 54);
    const LAYERS = [[SKY, '#F3E3C3'], [SUN, '#E8833A'], [FAR, '#8DB48E'], [NEAR, '#4F8A5B']];
    function stage(k) {
      // 台口：整张卡片挖掉拱形开口（evenodd）
      k.beginPath(); k.rect(0, 0, CW, CH);
      k.moveTo(64, CH); k.lineTo(64, 42); k.quadraticCurveTo(270, 8, 475, 42); k.lineTo(475, CH); k.closePath();
      k.fillStyle = '#B23A3A'; k.fill('evenodd');
    }
    CELLS[12] = (k, w, h, u) => {
      k.fillStyle = '#2B2420'; k.fillRect(0, 0, CW, CH);
      const a = vis(u), sway = seg(u, 4.0, 4.4) * Math.sin((u - 4.0) * 2.2);
      k.globalAlpha = a;
      k.shadowColor = 'rgba(0,0,0,.30)'; k.shadowBlur = 6; k.shadowOffsetY = 4;
      LAYERS.forEach(([pts, col], i) => {
        const t = seg(u, 0.3 + 0.7 * i, 0.8 + 0.7 * i);
        if (t <= 0) return;
        k.save(); k.translate(1.2 * i * sway, 220 * (1 - out3(t)));
        k.fillStyle = col; fillPts(k, pts);
        k.restore();
      });
      // 台口最后从上方落下
      const t = seg(u, 0.3 + 0.7 * 4, 0.8 + 0.7 * 4);
      if (t > 0) {
        // 台口是固定的外框，不跟着景片晃动；晃动会让卡片一侧露出 4–5 px 的暗边
        k.save(); k.translate(0, -220 * (1 - out3(t)));
        stage(k);
        k.shadowColor = 'transparent';
        // 幕布褶皱
        k.strokeStyle = 'rgba(90,20,20,.55)'; k.lineWidth = 1.2;
        [16, 32, 48, 491, 507, 523].forEach(x => { k.beginPath(); k.moveTo(x, 30); k.lineTo(x + 2, CH); k.stroke(); });
        k.restore();
      }
      k.shadowColor = 'transparent'; k.shadowBlur = 0; k.shadowOffsetY = 0;
      k.globalAlpha = 1;
    };
  }

  // @element 14
  // 橡皮管动画：1930 年代黑白墨线卡通，圆身体的角色随节拍原地弹跳，手脚像软管一样弯，落地时压扁；画面带胶片颗粒、闪烁和划痕
  {
    // 例外：周期动画，不走「画出来再复位」。6.4 秒恰好 4 拍，首尾自然衔接
    const INK = '#151515', GREY = '#8C8C8C', WHITE = '#FAFAF5', P = CYC / 4, GROUND = 182;
    // 胶片按 12.5 帧/秒取帧号：6.4 秒正好 80 帧，循环处的换帧和其他帧一样
    const FPS = 12.5;
    // 一条软管：起点到终点的二次曲线，控制点沿法线偏 bend
    function hose(k, x1, y1, x2, y2, bend) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, L = Math.hypot(x2 - x1, y2 - y1) || 1;
      k.beginPath(); k.moveTo(x1, y1); k.quadraticCurveTo(mx - (y2 - y1) / L * bend, my + (x2 - x1) / L * bend, x2, y2); k.stroke();
    }
    // 派眼：黑椭圆缺一角
    function pieEye(k, x, y) {
      k.fillStyle = INK; k.beginPath(); k.ellipse(x, y, 3.6, 6.5, 0, 0, TAU); k.fill();
      k.fillStyle = WHITE; k.beginPath(); k.moveTo(x + 0.6, y - 1.2); k.lineTo(x + 4, y - 3.6); k.lineTo(x + 4, y - 0.2); k.closePath(); k.fill();
    }
    CELLS[13] = (k, w, h, u) => {
      const b = Math.abs(Math.sin(Math.PI * u / P)), sq = Math.pow(1 - b, 4), ph = TAU * u / P;
      const cx = 270, cy = 118 - 16 * b;
      k.fillStyle = '#D9D5CC'; k.fillRect(0, 0, CW, CH);
      // 地面：墨线 + 下方平涂灰；影子随离地高度变小
      k.fillStyle = GREY; k.fillRect(0, GROUND, CW, CH - GROUND);
      k.strokeStyle = INK; k.lineWidth = 2; k.beginPath(); k.moveTo(0, GROUND); k.lineTo(CW, GROUND); k.stroke();
      k.fillStyle = 'rgba(21,21,21,.45)'; k.beginPath(); k.ellipse(cx, GROUND + 3, 26 + 8 * (1 - b), 3.5, 0, 0, TAU); k.fill();
      k.lineCap = 'round'; k.strokeStyle = INK; k.lineWidth = 5;
      // 腿：身体底部到鞋，鞋随身体抬起 10 px，弯曲方向随 b 摆动
      const footY = 176 - 10 * b;
      [-1, 1].forEach(s => {
        hose(k, cx + 12 * s, cy + 24, cx + 18 * s, footY, s * (4 + 8 * (1 - b)));
        k.fillStyle = INK; k.beginPath(); k.ellipse(cx + 22 * s, footY + 1, 11, 6, 0, 0, TAU); k.fill();
      });
      // 手臂：肩到手套，左右反相摆动
      [-1, 1].forEach(s => {
        const th = s < 0 ? Math.PI + 0.2 + 0.7 * Math.sin(ph) : -0.2 + 0.7 * Math.sin(ph);
        const sx = cx + 26 * s, sy = cy - 2, hx = sx + Math.cos(th) * 32, hy = sy + Math.sin(th) * 32;
        k.strokeStyle = INK; k.lineWidth = 5; hose(k, sx, sy, hx, hy, -s * 9);
        k.fillStyle = WHITE; k.lineWidth = 1.8; k.beginPath(); k.arc(hx, hy, 8, 0, TAU); k.fill(); k.stroke();
      });
      // 身体与脸：落地时以身体底部为基准压扁
      k.save();
      k.translate(cx, cy + 30); k.scale(1 + 0.08 * sq, 1 - 0.12 * sq); k.translate(-cx, -(cy + 30));
      k.fillStyle = INK; k.beginPath(); k.arc(cx, cy, 30, 0, TAU); k.fill();
      k.fillStyle = WHITE; k.beginPath(); k.ellipse(cx + 3, cy - 3, 18, 15, 0, 0, TAU); k.fill();
      pieEye(k, cx - 3, cy - 7); pieEye(k, cx + 8, cy - 7);
      k.strokeStyle = INK; k.lineWidth = 2; k.beginPath(); k.arc(cx + 3, cy + 1, 9, 0.25 * Math.PI, 0.75 * Math.PI); k.stroke();
      k.restore();
      // 胶片效果：同一 u 结果相同
      const f = Math.floor(u * FPS);
      for (let i = 0; i < 160; i++) {
        k.fillStyle = i % 2 ? 'rgba(21,21,21,.18)' : 'rgba(250,250,245,.18)';
        k.fillRect(rnd(i, f) * CW, rnd(i, f + 300) * CH, 1.5, 1.5);
      }
      k.fillStyle = `rgba(255,255,255,${0.04 * rnd(f, 9)})`; k.fillRect(0, 0, CW, CH);
      if (rnd(f, 3) > 0.75) {
        const x = rnd(f, 4) * CW;
        k.strokeStyle = 'rgba(21,21,21,.3)'; k.lineWidth = 1; k.beginPath(); k.moveTo(x, 0); k.lineTo(x + 3 * (rnd(f, 5) - 0.5), CH); k.stroke();
      }
      const g = k.createRadialGradient(CW / 2, CH / 2, CH * 0.45, CW / 2, CH / 2, CW * 0.6);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.35)');
      k.fillStyle = g; k.fillRect(0, 0, CW, CH);
    };
  }

  // @element 15
  // 玩具积木：带凸点的塑料积木一块块从上方落下搭成造型；正投影，顶面亮、正面原色、右侧面暗，地面投影随块数变大
  {
    const COL = { R: '#D7372F', Y: '#F2C230', B: '#2D6CC0', G: '#3A9A4B', W: '#F4F4F4' };
    // 计划里的 16 px 单位在卡片缩略图上偏小，整体放大 1.25 倍：单位 20 px、砖高 18 px
    const GROUND = 184, UNIT = 20, BH = 18, DX = 12, DY = -10, SR = UNIT / 16;
    // [左边缘相对 x=270 的偏移（按 16 px 单位写，画时乘 SR）, 层号, 宽度单位数, 颜色]，按落下顺序
    // 偏移都取 16 的整数倍，凸点才对得上下层；顶层两块各压住下层 1 个凸点，向两侧悬出
    const BR = [[-64, 0, 4, 'R'], [0, 0, 4, 'B'], [-48, 1, 4, 'Y'], [16, 1, 2, 'G'], [-32, 2, 4, 'W'], [-32, 3, 4, 'R'], [-48, 4, 2, 'B'], [16, 4, 2, 'Y']];
    const T0 = i => 0.4 + 0.5 * i, FALL = 0.35, DROP = 70;
    function brick(k, x, yb, n, col) {
      const w = n * UNIT, top = yb - BH, c = COL[col];
      k.lineJoin = 'round'; k.lineWidth = 0.8; k.strokeStyle = 'rgba(0,0,0,.18)';
      // 右侧面
      k.fillStyle = shade(c, -0.28);
      k.beginPath(); k.moveTo(x + w, top); k.lineTo(x + w + DX, top + DY); k.lineTo(x + w + DX, yb + DY); k.lineTo(x + w, yb); k.closePath(); k.fill(); k.stroke();
      // 正面
      k.fillStyle = c; k.fillRect(x, top, w, BH); k.strokeRect(x, top, w, BH);
      // 顶面
      k.fillStyle = shade(c, 0.18);
      k.beginPath(); k.moveTo(x, top); k.lineTo(x + DX, top + DY); k.lineTo(x + w + DX, top + DY); k.lineTo(x + w, top); k.closePath(); k.fill(); k.stroke();
      // 凸点：每个单位一个，3 px 高的小圆柱
      for (let j = 0; j < n; j++) {
        const cx = x + UNIT * j + UNIT / 2 + DX / 2, cy = top + DY / 2;
        k.fillStyle = shade(c, -0.28);
        k.beginPath(); k.ellipse(cx, cy, 6, 3, 0, 0, Math.PI); k.lineTo(cx - 6, cy - 4); k.ellipse(cx, cy - 4, 6, 3, 0, Math.PI, 0, true); k.closePath(); k.fill();
        k.fillStyle = shade(c, 0.3);
        k.beginPath(); k.ellipse(cx, cy - 4, 6, 3, 0, 0, TAU); k.fill(); k.stroke();
      }
    }
    CELLS[14] = (k, w, h, u) => {
      paper(k, '#EEF0F2', 'rgba(0,0,0,.035)');
      k.globalAlpha = vis(u);
      // 地面线：0.1–0.4 秒淡入，保证 u=0 与 u=6.4 都只有纸
      k.strokeStyle = `rgba(40,50,60,${0.18 * seg(u, 0.1, 0.4)})`; k.lineWidth = 1;
      k.beginPath(); k.moveTo(60, GROUND + 0.5); k.lineTo(480, GROUND + 0.5); k.stroke();
      // 投影：落地块数连续增长，避免在落地那一帧跳变
      let landed = 0;
      BR.forEach((b, i) => { landed += seg(u, T0(i) + FALL * 0.7, T0(i) + FALL); });
      if (landed > 0) {
        k.fillStyle = 'rgba(0,0,0,.14)';
        k.beginPath(); k.ellipse(270, GROUND + 2, 25 + 11 * landed, 6, 0, 0, TAU); k.fill();
      }
      // 后落的压在先落的上面；同一时刻最多一块在下落，所以按清单顺序画即可
      const a0 = k.globalAlpha;
      BR.forEach(([off, layer, n, col], i) => {
        const t = seg(u, T0(i), T0(i) + FALL);
        if (t <= 0) return;
        const dy = -DROP * (1 - backOut(t, 1.2));
        k.globalAlpha = a0 * Math.min(1, t * 5);
        brick(k, 270 + off * SR, GROUND - layer * BH + dy, n, col);
      });
      k.globalAlpha = 1;
    };
  }

  // @shared
  // （本包目前没有跨元素共用的代码）
  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});
