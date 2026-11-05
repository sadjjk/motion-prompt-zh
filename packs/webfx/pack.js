/* Motion Prompt · pack "webfx" · MIT License (c) 2026 sadjjk · https://reactbits.dev/ */
MotionPrompt.pack('webfx', function () {
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

  // @element 01
  // 01 物理球池：26 个硬球从上方落进深色框里堆成一池，重力 1600 px/s²；
  // 1.6–3.4 秒模拟光标贴着池底从左扫到右（推开半径 30），把球拱起、互相撞开；4.0 秒在中间点击，200 px 内的球被炸开后再落回。
  // 物理按固定步长 1/120 秒从 0 时刻积分并整段预烘焙成 60 fps 的帧表，同一时刻画面恒定；5.4–6.0 秒球层淡出，0 时刻球都在框外，循环无缝。
  const BP_N = 26, BP_FPS = 60, BP_SUB = 2;
  const BP_L = 12, BP_R = 527, BP_B = 196;            // 框的左右墙与地面（无顶）
  const BP_G = 1600, BP_E = 0.32, BP_PUSH = 30, BP_BLAST = 200, BP_CLICK = 4.0;
  const BP_COL = ['#FF6B5A', '#FFC94A', '#3ED6A4', '#4FA3FF', '#A98BFF', '#F2EFE8'];
  const BP_KF = [[1.3, -40, 186], [1.6, 30, 178], [3.4, 500, 168], [3.7, 420, 140], [BP_CLICK, 270, 150], [4.5, 300, 120], [5.3, 580, 60]];
  let BP_FRAMES = null;
  function BP_bake() {
    const r = [], x = [], y = [], vx = [], vy = [];
    for (let i = 0; i < BP_N; i++) {
      r[i] = 13 + 9 * hash(i * 3 + 1);
      x[i] = BP_L + r[i] + (BP_R - BP_L - 2 * r[i]) * hash(i * 3 + 2);
      y[i] = -30 - i * 18; vx[i] = (hash(i * 3 + 3) - 0.5) * 120; vy[i] = 0;
    }
    const n = Math.ceil(CYC * BP_FPS) + 1, dt = 1 / (BP_FPS * BP_SUB);
    const frames = [];
    let [cx, cy] = path(BP_KF, 0), blasted = false;
    for (let f = 0; f < n; f++) {
      const fr = new Float32Array(BP_N * 2);
      for (let i = 0; i < BP_N; i++) { fr[i * 2] = x[i]; fr[i * 2 + 1] = y[i]; }
      frames.push(fr);
      for (let s = 0; s < BP_SUB; s++) {
        const t = (f * BP_SUB + s + 1) * dt;
        const [nx, ny] = path(BP_KF, t), cvx = (nx - cx) / dt, cvy = (ny - cy) / dt;
        cx = nx; cy = ny;
        const pushing = t > 1.5 && t < 3.6;
        if (!blasted && t >= BP_CLICK) {
          blasted = true;
          for (let i = 0; i < BP_N; i++) {
            const dx = x[i] - cx, dy = y[i] - cy, d = Math.hypot(dx, dy) || 1;
            if (d < BP_BLAST) { const p = 1100 * (1 - d / BP_BLAST); vx[i] += dx / d * p; vy[i] += dy / d * p - 260 * (1 - d / BP_BLAST); }
          }
        }
        for (let i = 0; i < BP_N; i++) { vy[i] += BP_G * dt; vx[i] *= 0.999; x[i] += vx[i] * dt; y[i] += vy[i] * dt; }
        for (let it = 0; it < 3; it++) {
          for (let i = 0; i < BP_N; i++) for (let j = i + 1; j < BP_N; j++) {
            const dx = x[j] - x[i], dy = y[j] - y[i], d = Math.hypot(dx, dy), m = r[i] + r[j];
            if (d >= m || d === 0) continue;
            const ux = dx / d, uy = dy / d, o = (m - d) / 2;
            x[i] -= ux * o; y[i] -= uy * o; x[j] += ux * o; y[j] += uy * o;
            const vn = (vx[j] - vx[i]) * ux + (vy[j] - vy[i]) * uy;
            if (vn < 0) { const q = -(1 + BP_E) * vn / 2; vx[i] -= ux * q; vy[i] -= uy * q; vx[j] += ux * q; vy[j] += uy * q; }
          }
          for (let i = 0; i < BP_N; i++) {
            if (pushing) {
              const dx = x[i] - cx, dy = y[i] - cy, d = Math.hypot(dx, dy), m = r[i] + BP_PUSH;
              if (d < m && d > 0) {
                const ux = dx / d, uy = dy / d; x[i] += ux * (m - d); y[i] += uy * (m - d);
                const rel = (cvx * ux + cvy * uy) - (vx[i] * ux + vy[i] * uy);
                if (rel > 0) { vx[i] += ux * rel * 1.1; vy[i] += uy * rel * 1.1; }
              }
            }
            if (x[i] < BP_L + r[i]) { x[i] = BP_L + r[i]; if (vx[i] < 0) vx[i] *= -BP_E; }
            if (x[i] > BP_R - r[i]) { x[i] = BP_R - r[i]; if (vx[i] > 0) vx[i] *= -BP_E; }
            if (y[i] > BP_B - r[i]) { y[i] = BP_B - r[i]; if (vy[i] > 0) vy[i] *= -BP_E; vx[i] *= 0.985; }
          }
        }
      }
    }
    BP_FRAMES = { frames, r };
  }
  CELLS[0] = (k, w, h, u) => {
    if (!BP_FRAMES) BP_bake();
    k.fillStyle = '#0B0C11'; k.fillRect(0, 0, CW, CH);
    k.fillStyle = '#14151D'; rr(k, BP_L - 2, 10, BP_R - BP_L + 4, BP_B - 8, 16); k.fill();
    txt(k, '把重力玩起来', CW / 2, 92, `700 34px ${SANS}`, 'rgba(244,240,232,.92)', 'center');
    txt(k, 'PUSH · CLICK · DROP', CW / 2, 120, `500 11px ${MONO}`, 'rgba(244,240,232,.4)', 'center');
    const fr = BP_FRAMES.frames[Math.min(BP_FRAMES.frames.length - 1, Math.floor(u * BP_FPS))], R = BP_FRAMES.r;
    const a = fadeIn(u);
    if (a > 0) {
      k.save(); rr(k, BP_L - 2, 10, BP_R - BP_L + 4, BP_B - 8, 16); k.clip(); k.globalAlpha = a;
      for (let i = 0; i < BP_N; i++) {
        const x = fr[i * 2], y = fr[i * 2 + 1], r = R[i];
        if (y < -r) continue;
        k.fillStyle = BP_COL[i % BP_COL.length]; k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill();
        const g = k.createRadialGradient(x - r * 0.35, y - r * 0.4, 0, x - r * 0.35, y - r * 0.4, r * 1.25);
        g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(0.35, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(0,0,0,.28)');
        k.fillStyle = g; k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill();
      }
      k.restore();
    }
    const [cx, cy] = path(BP_KF, u);
    const press = u > BP_CLICK - 0.12 && u < BP_CLICK + 0.12 ? 1 : 0;
    ripple(k, cx, cy, (u - BP_CLICK) / 0.6);
    if (u > 1.3 && u < 5.3) cursor(k, cx, cy, press);
  };

  // @element 02
  // 02 撕贴纸：白边模切贴纸（160×140、圆角 22）贴在浅色点阵底上；模拟光标 0.3–1.0 秒移到右下角按住，
  // 1.2–3.2 秒向左上拖到 (222, 72)，折线为拖点与角点连线的中垂线，翻起部分按折线镜像画成背面，并在贴着的一侧投下阴影；
  // 3.6 秒松手，翻起量按阻尼振荡 e^(−4.5t)·cos(8t) 回落贴平，光标 3.9–4.8 秒移出画面
  const ST_X = 189, ST_Y = 34, ST_W = 160, ST_H = 140, ST_RAD = 22;
  const ST_C = [ST_X + ST_W, ST_Y + ST_H], ST_T = [222, 72];
  function ST_face(k) {
    k.fillStyle = '#FFFFFF'; rr(k, ST_X, ST_Y, ST_W, ST_H, ST_RAD); k.fill();
    const g = k.createLinearGradient(ST_X, ST_Y, ST_X + ST_W, ST_Y + ST_H);
    g.addColorStop(0, '#FF7A59'); g.addColorStop(1, '#FFC24B');
    k.fillStyle = g; rr(k, ST_X + 8, ST_Y + 8, ST_W - 16, ST_H - 16, ST_RAD - 7); k.fill();
    txt(k, '嗨！', ST_X + ST_W / 2, ST_Y + 84, `800 50px ${SANS}`, '#FFFFFF', 'center');
    txt(k, 'PEEL ME', ST_X + ST_W / 2, ST_Y + 112, `700 11px ${MONO}`, 'rgba(255,255,255,.85)', 'center');
  }
  function ST_amount(u) {
    if (u < 3.6) return inOut3(seg(u, 1.2, 3.2));
    const t = u - 3.6; return Math.max(0, Math.exp(-4.5 * t) * Math.cos(8 * t));
  }
  CELLS[1] = (k, w, h, u) => {
    k.fillStyle = '#E9E6DF'; k.fillRect(0, 0, CW, CH);
    k.fillStyle = 'rgba(22,21,27,.12)';
    for (let gx = 14; gx < CW; gx += 18) for (let gy = 14; gy < CH; gy += 18) k.fillRect(gx, gy, 1.5, 1.5);
    const f = ST_amount(u);
    const P = [mix(ST_C[0], ST_T[0], f), mix(ST_C[1], ST_T[1], f)];
    const dx = ST_C[0] - P[0], dy = ST_C[1] - P[1], L = Math.hypot(dx, dy);
    // 贴着的投影
    k.save(); k.shadowColor = 'rgba(40,30,20,.18)'; k.shadowBlur = 6; k.shadowOffsetY = 2;
    if (L < 0.5) { ST_face(k); k.restore(); }
    else {
      k.restore();
      const nx = dx / L, ny = dy / L, Mx = (ST_C[0] + P[0]) / 2, My = (ST_C[1] + P[1]) / 2;
      // 折线一侧的大半平面（side = +1 为角点一侧）
      const half = side => {
        const ox = Mx + nx * 2000 * side, oy = My + ny * 2000 * side, tx = -ny * 2000, ty = nx * 2000;
        k.beginPath(); k.moveTo(Mx + tx, My + ty); k.lineTo(Mx - tx, My - ty); k.lineTo(ox - tx, oy - ty); k.lineTo(ox + tx, oy + ty); k.closePath();
      };
      // 贴着的部分
      k.save(); half(-1); k.clip();
      k.shadowColor = 'rgba(40,30,20,.18)'; k.shadowBlur = 6; k.shadowOffsetY = 2; ST_face(k);
      k.restore();
      // 翻起的部分：按折线镜像 X' = X − 2((X − M)·n)n
      const d0 = Mx * nx + My * ny;
      k.save();
      k.setTransform(1 - 2 * nx * nx, -2 * nx * ny, -2 * nx * ny, 1 - 2 * ny * ny, 2 * d0 * nx, 2 * d0 * ny);
      half(1); k.clip();
      k.shadowColor = 'rgba(40,30,20,.3)'; k.shadowBlur = 14; k.shadowOffsetX = 3; k.shadowOffsetY = 5;
      k.fillStyle = '#F3F1EC'; rr(k, ST_X, ST_Y, ST_W, ST_H, ST_RAD); k.fill();
      k.shadowColor = 'transparent';
      const g = k.createLinearGradient(Mx, My, Mx + nx * L * 0.6, My + ny * L * 0.6);
      g.addColorStop(0, 'rgba(120,110,95,.32)'); g.addColorStop(0.4, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(210,205,196,.25)');
      k.fillStyle = g; rr(k, ST_X, ST_Y, ST_W, ST_H, ST_RAD); k.fill();
      k.restore();
    }
    // 光标：移到角点 → 按住拖动 → 松手移出
    let cp, press = 0;
    if (u < 1.0) cp = path([[0.3, 590, 240], [1.0, ST_C[0] - 3, ST_C[1] - 3]], u);
    else if (u < 3.6) { cp = [P[0] - 3, P[1] - 3]; press = seg(u, 1.0, 1.15); }
    else cp = path([[3.9, ST_T[0] - 3, ST_T[1] - 3], [4.8, 590, 30]], u);
    if (u > 0.3 && u < 4.8) cursor(k, cp[0], cp[1], press, true);
  };

  // @element 03
  // 03 压感文字：一行 76 px 的大写 PRESSURE，每个字母按与模拟光标的距离求权重 w = e^(−(dx/60)²)·e^(−(dy/70)²)；
  // 横向缩放 0.78→1.45、纵向 1→1.08，描边 0→3 px 加粗，颜色由灰 #9A97A3 变墨 #16151B，整行按当前宽度重新居中；
  // 光标 0.2–0.8 秒入场，左右来回扫过三次，4.4–5.2 秒离场，权重随光标在场程度回到 0
  const PT_WORD = 'PRESSURE', PT_SIZE = 76, PT_GAP = 4, PT_BASE = 140;
  const PT_KF = [[0.2, 300, 250], [0.8, 70, 112], [2.2, 470, 104], [3.4, 120, 110], [4.4, 330, 106], [5.2, 330, 250]];
  const PT_GRAY = [154, 151, 163], PT_INK = [22, 21, 27];
  CELLS[2] = (k, w, h, u) => {
    k.fillStyle = '#F4F2EE'; k.fillRect(0, 0, CW, CH);
    txt(k, '光标越近，字越宽越粗', 24, 30, `600 12px ${SANS}`, '#8E8A97');
    const [cx, cy] = path(PT_KF, u);
    const on = inOut3(seg(u, 0.2, 0.8)) * (1 - inOut3(seg(u, 4.4, 5.2)));
    k.font = `800 ${PT_SIZE}px ${SANS}`;
    const gw = [...PT_WORD].map(c => k.measureText(c).width);
    // 中性排版（w = 0）下的字母中心，用来求距离，避免宽度变化反过来影响权重
    const nTot = gw.reduce((s, v) => s + v * 0.78, 0) + PT_GAP * (gw.length - 1);
    let nx = (CW - nTot) / 2;
    const wt = gw.map(v => { const c = nx + v * 0.39; nx += v * 0.78 + PT_GAP; const dx = (cx - c) / 60, dy = (cy - (PT_BASE - 28)) / 70; return on * Math.exp(-dx * dx) * Math.exp(-dy * dy); });
    const sx = wt.map(q => mix(0.78, 1.45, q));
    const tot = gw.reduce((s, v, i) => s + v * sx[i], 0) + PT_GAP * (gw.length - 1);
    let x = (CW - tot) / 2;
    k.textAlign = 'left'; k.textBaseline = 'alphabetic'; k.lineJoin = 'round';
    [...PT_WORD].forEach((c, i) => {
      const q = wt[i], col = rgb(lerpC(PT_GRAY, PT_INK, clamp(q * 1.4)));
      k.save(); k.translate(x, PT_BASE); k.scale(sx[i], mix(1, 1.08, q));
      k.fillStyle = col; k.fillText(c, 0, 0);
      if (q > 0.02) { k.strokeStyle = col; k.lineWidth = 3 * q / sx[i]; k.strokeText(c, 0, 0); }
      k.restore();
      x += gw[i] * sx[i] + PT_GAP;
    });
    k.fillStyle = 'rgba(22,21,27,.1)'; k.fillRect(24, PT_BASE + 18, CW - 48, 1);
    if (u > 0.2 && u < 5.2) cursor(k, cx, cy, 0, true);
  };
  // @element 04
  // 04 磁力线阵：24×9 根短线排成固定网格，平时随一道缓慢的正弦波轻轻摆动；
  // 光标 0.4–1.0 秒入场后，每根线按在场程度转向光标（线两端对称，转角按 π 取最短方向），离光标 120 px 内变长变亮；
  // 3.6 秒点击，一圈波以 420 px/s 向外扩散，波经过时每根线在 0.5 秒内多转半圈；光标 4.5–5.2 秒离场，线回到波浪摆动
  const ML_COLS = 24, ML_ROWS = 9, ML_CLICK = 3.6, ML_WAVE = 420;
  const ML_KF = [[0.4, -30, 150], [1.0, 120, 120], [2.0, 300, 60], [2.8, 420, 140], [ML_CLICK, 270, 104], [4.4, 140, 70], [5.2, -40, 40]];
  const ML_DIM = [88, 94, 120], ML_HOT = [124, 243, 208];
  const wrapH = a => a - Math.PI * Math.round(a / Math.PI);
  CELLS[3] = (k, w, h, u) => {
    k.fillStyle = '#0D0E13'; k.fillRect(0, 0, CW, CH);
    const [cx, cy] = path(ML_KF, u), p = presence(u, 0.4, 1.0, 4.5, 5.2), ct = u - ML_CLICK;
    const sx = CW / ML_COLS, sy = CH / ML_ROWS;
    k.lineCap = 'round';
    for (let r = 0; r < ML_ROWS; r++) for (let c = 0; c < ML_COLS; c++) {
      const x = (c + 0.5) * sx, y = (r + 0.5) * sy, d = Math.hypot(cx - x, cy - y);
      const rest = -Math.PI / 4 + 0.5 * Math.sin(TAU * u / CYC + c * 0.35 + r * 0.5);
      let a = rest + wrapH(Math.atan2(cy - y, cx - x) - rest) * p;
      if (ct > 0) a += Math.PI * out3(seg(ct, d / ML_WAVE, d / ML_WAVE + 0.5));
      const near = p * Math.exp(-(d / 120) * (d / 120));
      const len = 7 + 6 * near, ex = Math.cos(a) * len / 2, ey = Math.sin(a) * len / 2;
      k.strokeStyle = rgb(lerpC(ML_DIM, ML_HOT, near)); k.lineWidth = 2 + 0.6 * near;
      k.beginPath(); k.moveTo(x - ex, y - ey); k.lineTo(x + ex, y + ey); k.stroke();
    }
    ripple(k, ML_KF[4][1], ML_KF[4][2], ct / 0.6);
    if (u > 0.4 && u < 5.2) cursor(k, cx, cy, Math.abs(ct) < 0.1 ? 1 : 0);
  };

  // @element 05
  // 05 透镜点阵：13 px 间距的点阵按横向三色渐变着色，亮度随两道斜向正弦波呼吸；
  // 光标带着半径 72 px 的透镜移动：1.0–2.6 秒为放大模式（透镜内的点按 d·(1+0.9t²) 向外推开并变大，t = 1 − d/72），
  // 2.6–3.0 秒过渡到漩涡模式（点绕光标转 2.2t² 弧度），光标 0.3–1.0 秒入场、4.6–5.3 秒离场
  const DF_S = 13, DF_R = 72;
  const DF_KF = [[0.3, -40, 120], [1.0, 110, 104], [2.6, 250, 90], [3.0, 300, 110], [4.6, 430, 100], [5.3, 600, 80]];
  const DF_A = [106, 92, 255], DF_B = [34, 211, 238], DF_C = [244, 114, 182];
  CELLS[4] = (k, w, h, u) => {
    k.fillStyle = '#0A0A12'; k.fillRect(0, 0, CW, CH);
    const [cx, cy] = path(DF_KF, u), p = presence(u, 0.3, 1.0, 4.6, 5.3), sw = inOut3(seg(u, 2.6, 3.0));
    const mag = p * (1 - 0.6 * sw), swirl = p * sw;
    const cols = Math.floor(CW / DF_S), rows = Math.floor(CH / DF_S);
    const ox = (CW - (cols - 1) * DF_S) / 2, oy = (CH - (rows - 1) * DF_S) / 2;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      let x = ox + c * DF_S, y = oy + r * DF_S;
      const fx = x / CW, col = fx < 0.5 ? lerpC(DF_A, DF_B, fx * 2) : lerpC(DF_B, DF_C, fx * 2 - 1);
      let br = 0.38 + 0.22 * Math.sin(TAU * u / CYC * 2 - x * 0.02 + y * 0.03) + 0.12 * Math.sin(TAU * u / CYC - y * 0.05);
      let rad = 1.5;
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
      if (d < DF_R && p > 0) {
        const t = 1 - d / DF_R, s = 1 + 0.9 * mag * t * t, an = swirl * 2.2 * t * t;
        const ca = Math.cos(an), sa = Math.sin(an);
        x = cx + (dx * ca - dy * sa) * s; y = cy + (dx * sa + dy * ca) * s;
        rad += 2.2 * t * (mag + 0.5 * swirl); br = mix(br, 1, t * p);
      }
      k.globalAlpha = clamp(br); k.fillStyle = rgb(col);
      k.beginPath(); k.arc(x, y, rad, 0, TAU); k.fill();
    }
    k.globalAlpha = 1;
    if (p > 0.01) {
      k.strokeStyle = `rgba(255,255,255,${0.22 * p})`; k.lineWidth = 1.2;
      k.beginPath(); k.arc(cx, cy, DF_R, 0, TAU); k.stroke();
      const g = k.createRadialGradient(cx - 24, cy - 28, 0, cx, cy, DF_R);
      g.addColorStop(0, `rgba(255,255,255,${0.1 * p})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      k.fillStyle = g; k.beginPath(); k.arc(cx, cy, DF_R, 0, TAU); k.fill();
    }
    if (u > 0.3 && u < 5.3) cursor(k, cx, cy);
  };

  // @element 06
  // 06 字符故障墙：49×13 个等宽字符铺满画面，每格在一个周期里换字 2–8 次（次数与起点按下标确定），换字瞬间闪亮后 0.18 秒内变暗，颜色在 4 色里切换；
  // 光标 60 px 内的字符每秒乱换 20 次并泛白；3.5 秒点击，光标上下 46 px 内的行被横向撕开最多 ±30 px、染成洋红，0.25 秒衰减；四周暗角
  const LG_CW = 11, LG_CH = 17, LG_COLS = 49, LG_ROWS = 13, LG_CLICK = 3.5;
  const LG_G = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+-/<>=?@[]{}';
  const LG_PAL = [[31, 122, 85], [61, 220, 151], [76, 201, 240], [123, 97, 255]];
  const LG_KF = [[0.4, -30, 60], [1.2, 140, 90], [2.4, 330, 60], [LG_CLICK, 300, 120], [4.4, 430, 150], [5.1, 590, 110]];
  CELLS[5] = (k, w, h, u) => {
    k.fillStyle = '#05070A'; k.fillRect(0, 0, CW, CH);
    const [cx, cy] = path(LG_KF, u), p = presence(u, 0.4, 1.0, 4.4, 5.1), ct = u - LG_CLICK;
    const tear = ct > 0 ? Math.exp(-ct / 0.25) : 0;
    k.font = `600 13px ${MONO}`; k.textAlign = 'center'; k.textBaseline = 'middle';
    const oy = (CH - LG_ROWS * LG_CH) / 2;
    for (let r = 0; r < LG_ROWS; r++) {
      const y = oy + (r + 0.5) * LG_CH;
      const torn = tear > 0.01 && Math.abs(y - LG_KF[3][2]) < 46;
      const shift = torn ? (hash(r * 5.3 + 1) - 0.5) * 60 * tear : 0;
      for (let c = 0; c < LG_COLS; c++) {
        const i = r * LG_COLS + c, x = (c + 0.5) * LG_CW + shift;
        const n = 2 + Math.floor(hash(i * 7.1) * 7), o = hash(i * 3.3), f = (u / CYC + o) * n;
        const slot = Math.floor(f) % n, since = (f - Math.floor(f)) * CYC / n;
        let gi = Math.floor(hash(i * 13 + slot * 7.7) * LG_G.length);
        let col = LG_PAL[Math.floor(hash(i * 5.9 + slot * 3.1) * LG_PAL.length)];
        let br = 0.42 + 0.58 * Math.exp(-since / 0.18);
        const d = Math.hypot(x - cx, y - cy), near = p * Math.exp(-(d / 60) * (d / 60));
        if (near > 0.15) { gi = Math.floor(hash(i * 1.7 + Math.floor(u * 20) * 0.37) * LG_G.length); col = lerpC(col, [235, 255, 245], near); br = mix(br, 1, near); }
        if (torn && hash(i * 9.1) < 0.45) { col = lerpC(col, [255, 61, 127], tear); br = mix(br, 1, tear); }
        k.globalAlpha = br; k.fillStyle = rgb(col); k.fillText(LG_G[gi], x, y);
      }
    }
    k.globalAlpha = 1;
    const v = k.createRadialGradient(CW / 2, CH / 2, 60, CW / 2, CH / 2, 300);
    v.addColorStop(0, 'rgba(5,7,10,0)'); v.addColorStop(1, 'rgba(5,7,10,.85)');
    k.fillStyle = v; k.fillRect(0, 0, CW, CH);
    ripple(k, LG_KF[3][1], LG_KF[3][2], ct / 0.6);
    if (u > 0.4 && u < 5.1) cursor(k, cx, cy, Math.abs(ct) < 0.1 ? 1 : 0);
  };

  // @element 07
  // 07 光标点亮网格：26 px 方格铺满深色画面，光标经过的格子立刻亮起，再按 e^(−Δt/0.45) 渐暗，形成一条拖尾；
  // 格子颜色从左到右由粉 #FF4D8D 渐变到紫 #7A5CFF；3.4 秒点击，一圈亮格以 360 px/s 向外扩散并在 1.2 秒内减弱
  const CG_S = 26, CG_CLICK = 3.4;
  const CG_KF = [[0.3, -30, 40], [1.2, 180, 60], [2.0, 330, 150], [2.8, 470, 70], [CG_CLICK, 300, 110], [4.4, 90, 160], [5.0, -30, 120]];
  const CG_A = [255, 77, 141], CG_B = [122, 92, 255];
  CELLS[6] = (k, w, h, u) => {
    k.fillStyle = '#0C0B12'; k.fillRect(0, 0, CW, CH);
    const cols = Math.ceil(CW / CG_S), rows = Math.ceil(CH / CG_S), ox = (CW - cols * CG_S) / 2;
    const lit = new Float32Array(cols * rows);
    for (let s = Math.max(0.3, u - 1.6); s <= Math.min(u, 5.0); s += 1 / 90) {
      const [px, py] = path(CG_KF, s), c = Math.floor((px - ox) / CG_S), r = Math.floor(py / CG_S);
      if (c >= 0 && c < cols && r >= 0 && r < rows) lit[r * cols + c] = Math.max(lit[r * cols + c], Math.exp(-(u - s) / 0.45));
    }
    const ct = u - CG_CLICK;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = ox + c * CG_S, y = r * CG_S;
      let v = lit[r * cols + c];
      if (ct > 0 && ct < 1.2) {
        const d = Math.hypot(x + CG_S / 2 - CG_KF[4][1], y + CG_S / 2 - CG_KF[4][2]), q = (d - ct * 360) / 22;
        v = Math.max(v, 0.8 * Math.exp(-q * q) * (1 - ct / 1.2));
      }
      v *= fadeIn(u);
      k.strokeStyle = 'rgba(255,255,255,.06)'; k.lineWidth = 1; k.strokeRect(x + 0.5, y + 0.5, CG_S, CG_S);
      if (v > 0.01) {
        k.fillStyle = rgb(lerpC(CG_A, CG_B, c / (cols - 1))); k.globalAlpha = 0.9 * v;
        rr(k, x + 2, y + 2, CG_S - 3, CG_S - 3, 3); k.fill(); k.globalAlpha = 1;
      }
    }
    const [cx, cy] = path(CG_KF, u);
    ripple(k, CG_KF[4][1], CG_KF[4][2], ct / 0.6);
    if (u > 0.3 && u < 5.0) cursor(k, cx, cy, Math.abs(ct) < 0.1 ? 1 : 0);
  };

  // @element 08
  // 08 等高线地形：高度场 h(x, z) 由三组正弦波叠加，相位每周期转一圈；用 64×32 网格的 marching squares 在 13 个高度上求等高线，
  // 按透视投影成一片起伏的发光线条地形（远处变暗）。光标在地面上移动时把它下面的地形抬高 1.1（高斯半径 0.28），
  // 3.5 秒点击，一圈光环以每秒 1.6 个单位从点击处扩散，经过的线条变白
  const TP_NX = 64, TP_NZ = 32, TP_X0 = -3, TP_X1 = 3, TP_Z1 = 1.4, TP_CLICK = 3.5;
  const TP_LV = Array.from({ length: 13 }, (_, i) => -0.8 + i * 0.2);
  const TP_KF = [[0.3, -2.4, 0.25], [1.2, -0.9, 0.35], [2.4, 0.5, 0.65], [TP_CLICK, 0.0, 0.42], [4.4, 1.0, 0.3], [5.2, 2.8, 0.2]];
  const TP_proj = (x, z, y) => { const D = 0.8 + 2.6 * z; return [CW / 2 + x * 200 / D, 20 + 150 / D - y * 60 / D]; };
  CELLS[7] = (k, w, h, u) => {
    const bg = k.createLinearGradient(0, 0, 0, CH); bg.addColorStop(0, '#04060C'); bg.addColorStop(1, '#0A1424');
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    const ph = TAU * u / CYC, p = presence(u, 0.3, 1.0, 4.5, 5.2), [wx, wz] = path(TP_KF, u), ct = u - TP_CLICK;
    const hf = (x, z) => 0.42 * Math.sin(1.1 * x + 2.1 * z + ph) + 0.28 * Math.sin(1.6 * x - 6.3 * z - ph) + 0.18 * Math.cos(3.1 * x + 5.1 * z + 2 * ph)
      + 1.1 * p * Math.exp(-((x - wx) ** 2 + (z - wz) ** 2) / 0.08);
    const dx = (TP_X1 - TP_X0) / TP_NX, dz = TP_Z1 / TP_NZ, H = [];
    for (let j = 0; j <= TP_NZ; j++) for (let i = 0; i <= TP_NX; i++) H.push(hf(TP_X0 + i * dx, j * dz));
    const buckets = new Map();
    const add = (key, a, b) => { let arr = buckets.get(key); if (!arr) buckets.set(key, arr = []); arr.push(a, b); };
    const ringR = ct > 0 && ct < 1.6 ? ct * 1.6 : -9;
    for (let j = 0; j < TP_NZ; j++) for (let i = 0; i < TP_NX; i++) {
      const v0 = H[j * (TP_NX + 1) + i], v1 = H[j * (TP_NX + 1) + i + 1], v2 = H[(j + 1) * (TP_NX + 1) + i + 1], v3 = H[(j + 1) * (TP_NX + 1) + i];
      const x0 = TP_X0 + i * dx, z0 = j * dz;
      const lo = Math.min(v0, v1, v2, v3), hi = Math.max(v0, v1, v2, v3);
      TP_LV.forEach((L, li) => {
        if (L < lo || L > hi) return;
        const pts = [];
        const e = (va, vb, xa, za, xb, zb) => { if ((va < L) !== (vb < L)) { const t = (L - va) / (vb - va); pts.push([mix(xa, xb, t), mix(za, zb, t)]); } };
        e(v0, v1, x0, z0, x0 + dx, z0); e(v1, v2, x0 + dx, z0, x0 + dx, z0 + dz); e(v2, v3, x0 + dx, z0 + dz, x0, z0 + dz); e(v3, v0, x0, z0 + dz, x0, z0);
        for (let q = 0; q + 1 < pts.length; q += 2) {
          const mx = (pts[q][0] + pts[q + 1][0]) / 2, mz = (pts[q][1] + pts[q + 1][1]) / 2;
          const fog = Math.min(3, Math.floor(mz / TP_Z1 * 4));
          const hot = ringR > 0 && Math.abs(Math.hypot(mx - TP_KF[3][1], (mz - TP_KF[3][2]) * 2) - ringR) < 0.14 ? 1 : 0;
          add(li * 10 + fog * 2 + hot, TP_proj(pts[q][0], pts[q][1], L), TP_proj(pts[q + 1][0], pts[q + 1][1], L));
        }
      });
    }
    k.lineCap = 'round';
    const ringFade = 1 - clamp(ct / 1.6);
    for (const [key, arr] of buckets) {
      const li = Math.floor(key / 10), fog = Math.floor((key % 10) / 2), hot = key % 2;
      const t = li / (TP_LV.length - 1), col = hot ? lerpC(lerpC([40, 120, 200], [150, 245, 255], t), [255, 255, 255], ringFade) : lerpC([40, 120, 200], [150, 245, 255], t);
      const a = (0.95 - fog * 0.22) * (hot ? 1 : 0.55 + 0.45 * t);
      k.beginPath();
      for (let q = 0; q < arr.length; q += 2) { k.moveTo(arr[q][0], arr[q][1]); k.lineTo(arr[q + 1][0], arr[q + 1][1]); }
      k.strokeStyle = rgb(col); k.globalAlpha = a * 0.25; k.lineWidth = 3.5; k.stroke();
      k.globalAlpha = a; k.lineWidth = hot ? 1.6 : 1.1; k.stroke();
    }
    k.globalAlpha = 1;
    const [sx, sy] = TP_proj(wx, wz, hf(wx, wz));
    if (u > 0.3 && u < 5.2) cursor(k, sx, sy, Math.abs(ct) < 0.1 ? 1 : 0);
  };

  // @element 09
  // 09 几何形状波：28×11 个圆、三角、方块排满画面（形状按下标确定），一道斜向主波滚过、另一道慢波调制强度，
  // 波值 v = ((主波+1)/2)^2.2 × (0.55 + 0.45·(慢波+1)/2)：形状尺寸 2.5→11 px、不透明度 0.18→1，颜色从暗紫变成由左金黄到右粉红的亮色，三角和方块随 v 转 90°；
  // 主波每周期走 2 个波长、慢波走 1 个，循环无缝
  const SW_COLS = 28, SW_ROWS = 11;
  CELLS[8] = (k, w, h, u) => {
    k.fillStyle = '#100E1A'; k.fillRect(0, 0, CW, CH);
    const ph = TAU * u / CYC;
    for (let r = 0; r < SW_ROWS; r++) for (let c = 0; c < SW_COLS; c++) {
      const i = r * SW_COLS + c, x = (c + 0.5) * CW / SW_COLS, y = (r + 0.5) * CH / SW_ROWS;
      const w1 = Math.sin(0.024 * x + 0.03 * y - 2 * ph), w2 = Math.sin(-0.012 * x + 0.02 * y - ph);
      const v = Math.pow((w1 + 1) / 2, 2.2) * (0.55 + 0.45 * (w2 + 1) / 2);
      const s = 2.5 + 8.5 * v, type = Math.floor(hash(i * 2.7) * 3);
      const bright = lerpC([255, 190, 92], [255, 92, 138], x / CW);
      k.fillStyle = rgb(lerpC([70, 60, 140], bright, v)); k.globalAlpha = 0.18 + 0.82 * v;
      k.save(); k.translate(x, y); k.rotate(v * Math.PI / 2 + hash(i) * 0.6);
      k.beginPath();
      if (type === 0) k.arc(0, 0, s / 2, 0, TAU);
      else if (type === 1) { k.moveTo(0, -s * 0.6); k.lineTo(s * 0.52, s * 0.3); k.lineTo(-s * 0.52, s * 0.3); k.closePath(); }
      else k.rect(-s * 0.42, -s * 0.42, s * 0.84, s * 0.84);
      k.fill(); k.restore();
    }
    k.globalAlpha = 1;
  };

  // @element 10
  // 10 ASCII 渐变光：77×17 格等宽字符（每格 7×12 px），三团柔和光斑按整数频率的李萨如路径漂移，
  // 每格亮度 I = Σ e^(−d²/r²)（r = 95–120 px）映射到字符梯度 " .`-:;=+*#%@"，颜色按各光斑权重混合（橙、洋红、青）；
  // 光标 0.4–1.0 秒入场、4.5–5.2 秒离场，55 px 内的字符每秒乱换 15 次并泛白
  const GA_CW = 7, GA_CH = 12, GA_COLS = 77, GA_ROWS = 17, GA_RAMP = ' .`-:;=+*#%@', GA_SCR = '#$%&*+=?@<>/\\|01';
  const GA_B = [
    { ax: 190, fx: 1, px: 0.0, ay: 50, fy: 2, py: 0.6, r: 120, c: [255, 138, 61] },
    { ax: 160, fx: 2, px: 2.1, ay: 45, fy: 1, py: 2.4, r: 105, c: [240, 70, 170] },
    { ax: 200, fx: 1, px: 4.0, ay: 55, fy: 3, py: 1.2, r: 95, c: [60, 200, 255] }];
  const GA_KF = [[0.4, -30, 140], [1.4, 150, 90], [2.6, 330, 120], [3.6, 420, 70], [4.5, 260, 100], [5.2, 600, 150]];
  CELLS[9] = (k, w, h, u) => {
    k.fillStyle = '#07070B'; k.fillRect(0, 0, CW, CH);
    const ph = TAU * u / CYC, [cx, cy] = path(GA_KF, u), p = presence(u, 0.4, 1.0, 4.5, 5.2);
    const bs = GA_B.map(b => [CW / 2 + b.ax * Math.sin(b.fx * ph + b.px), CH / 2 + b.ay * Math.sin(b.fy * ph + b.py)]);
    k.font = `600 11px ${MONO}`; k.textAlign = 'center'; k.textBaseline = 'middle';
    const oy = (CH - GA_ROWS * GA_CH) / 2 + GA_CH / 2, ox = (CW - GA_COLS * GA_CW) / 2 + GA_CW / 2;
    for (let r = 0; r < GA_ROWS; r++) for (let c = 0; c < GA_COLS; c++) {
      const x = ox + c * GA_CW, y = oy + r * GA_CH;
      let I = 0, cr = 0, cg = 0, cb = 0;
      GA_B.forEach((b, j) => { const dx = x - bs[j][0], dy = (y - bs[j][1]) * 1.6, wgt = Math.exp(-(dx * dx + dy * dy) / (b.r * b.r)); I += wgt; cr += b.c[0] * wgt; cg += b.c[1] * wgt; cb += b.c[2] * wgt; });
      const col = I > 0 ? [cr / I, cg / I, cb / I] : [0, 0, 0];
      I = clamp(I * 0.95 + 0.04 * Math.sin(c * 0.7 + r * 1.3 + ph));
      let ch = GA_RAMP[Math.min(GA_RAMP.length - 1, Math.floor(I * GA_RAMP.length))];
      let fc = col, a = 0.25 + 0.75 * I;
      const d = Math.hypot(x - cx, y - cy), near = p * Math.exp(-(d / 55) * (d / 55));
      if (near > 0.2) { ch = GA_SCR[Math.floor(hash(r * 97 + c * 13 + Math.floor(u * 15) * 0.71) * GA_SCR.length)]; fc = lerpC(col, [255, 255, 255], near); a = mix(a, 1, near); }
      if (ch === ' ') continue;
      k.globalAlpha = a; k.fillStyle = rgb(fc.map(Math.round)); k.fillText(ch, x, y);
    }
    k.globalAlpha = 1;
    if (u > 0.4 && u < 5.2) cursor(k, cx, cy);
  };

  // @element 11
  // 11 抖动网点波：在 135×52 的低分辨率缓冲上算出流动的波 v（三道正弦叠加，相位按整数倍随周期转动），
  // 用 4×4 Bayer 矩阵做有序抖动量化成 4 级色（深靛、紫、珊瑚、奶油），每个像素放大 4 倍、关闭平滑，得到复古抖动网点；
  // 光标 0.5–1.1 秒入场、4.6–5.3 秒离场，经过处留下 0.35 秒衰减的亮尾迹（半径 18 px）
  const DI_W = 135, DI_H = 52, DI_S = 4;
  const DI_BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const DI_PAL = [[20, 18, 48], [96, 58, 170], [244, 112, 102], [255, 226, 180]];
  const DI_KF = [[0.5, -30, 150], [1.5, 160, 60], [2.6, 330, 150], [3.6, 460, 80], [4.6, 300, 120], [5.3, 600, 40]];
  let DI_C = null, DI_IMG = null;
  CELLS[10] = (k, w, h, u) => {
    if (!DI_C) { DI_C = document.createElement('canvas'); DI_C.width = DI_W; DI_C.height = DI_H; DI_IMG = DI_C.getContext('2d').createImageData(DI_W, DI_H); }
    const ph = TAU * u / CYC, d = DI_IMG.data;
    const trail = [];
    for (let s = Math.max(0.5, u - 1.2); s <= Math.min(u, 5.3); s += 1 / 40) { const [tx, ty] = path(DI_KF, s); trail.push([tx / DI_S, ty / DI_S, Math.exp(-(u - s) / 0.35) * presence(s, 0.5, 1.1, 4.6, 5.3)]); }
    for (let y = 0; y < DI_H; y++) for (let x = 0; x < DI_W; x++) {
      let v = 0.5 + 0.22 * Math.sin(x * 0.075 + y * 0.05 - 2 * ph) + 0.16 * Math.sin(y * 0.19 - x * 0.03 + ph + Math.sin(x * 0.04 + ph)) + 0.1 * Math.sin((x + y) * 0.11 + 3 * ph);
      for (const [tx, ty, a] of trail) { const q = ((x - tx) ** 2 + (y - ty) ** 2) / 20; if (q < 9) v += 0.55 * a * Math.exp(-q); }
      const thr = (DI_BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
      const lv = clamp(Math.floor(clamp(v) * 3 + thr), 0, 3), c = DI_PAL[lv], o = (y * DI_W + x) * 4;
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
    }
    DI_C.getContext('2d').putImageData(DI_IMG, 0, 0);
    k.save(); k.imageSmoothingEnabled = false; k.drawImage(DI_C, 0, 0, DI_W * DI_S, DI_H * DI_S); k.restore();
    const [cx, cy] = path(DI_KF, u);
    if (u > 0.5 && u < 5.3) cursor(k, cx, cy);
  };

  // @element 12
  // 12 像素漩涡颜料：108×42 的低分辨率缓冲，每像素 5 px，关闭平滑；坐标先绕中心旋转 2.4·e^(−1.4r) + 一整圈/周期，
  // 再做两层正弦域扭曲，值按 4 个阈值量化成深蓝灰、蓝、红、浅粉四色，像一池打旋的颜料；
  // 光标 0.4–1.0 秒入场后搅动它附近的颜料（额外旋转 1.8·e^(−d²/0.05)），3.6 秒点击生成一个旋涡（最多 5 弧度，1.4 秒内升起再平息）
  const BA_W = 108, BA_H = 42, BA_S = 5, BA_CLICK = 3.6;
  const BA_PAL = [[30, 40, 56], [38, 120, 240], [236, 66, 56], [255, 214, 200]];
  const BA_KF = [[0.4, -30, 60], [1.4, 150, 140], [2.6, 220, 60], [BA_CLICK, 300, 104], [4.6, 430, 150], [5.3, 600, 90]];
  let BA_C = null, BA_IMG = null;
  CELLS[11] = (k, w, h, u) => {
    if (!BA_C) { BA_C = document.createElement('canvas'); BA_C.width = BA_W; BA_C.height = BA_H; BA_IMG = BA_C.getContext('2d').createImageData(BA_W, BA_H); }
    const ph = TAU * u / CYC, d = BA_IMG.data, [cx, cy] = path(BA_KF, u), p = presence(u, 0.4, 1.0, 4.6, 5.3);
    const ct = u - BA_CLICK, whirl = ct > 0 ? 5 * Math.sin(Math.PI * clamp(ct / 1.4)) ** 2 : 0;
    const mx = (cx / BA_S - BA_W / 2) / BA_H, my = (cy / BA_S - BA_H / 2) / BA_H;
    const kx = (BA_KF[3][1] / BA_S - BA_W / 2) / BA_H, ky = (BA_KF[3][2] / BA_S - BA_H / 2) / BA_H;
    for (let y = 0; y < BA_H; y++) for (let x = 0; x < BA_W; x++) {
      let nx = (x - BA_W / 2) / BA_H, ny = (y - BA_H / 2) / BA_H;
      const r = Math.hypot(nx, ny), dm = (nx - mx) ** 2 + (ny - my) ** 2, dk = (nx - kx) ** 2 + (ny - ky) ** 2;
      const a = 2.4 * Math.exp(-1.4 * r) + ph + p * 1.8 * Math.exp(-dm / 0.05) + whirl * Math.exp(-dk / 0.06);
      const ca = Math.cos(a), sa = Math.sin(a), qx = nx * ca - ny * sa, qy = nx * sa + ny * ca;
      const wx = qx + 0.35 * Math.sin(qy * 4.0 + ph), wy = qy + 0.35 * Math.sin(qx * 3.0 - ph);
      const v = Math.sin(wx * 5.0 + Math.sin(wy * 4.0) * 1.5) + Math.sin(wy * 6.0 + Math.sin(wx * 3.0) * 1.2);
      const lv = v < -0.7 ? 0 : v < 0.35 ? 1 : v < 1.25 ? 2 : 3, c = BA_PAL[lv], o = (y * BA_W + x) * 4;
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
    }
    BA_C.getContext('2d').putImageData(BA_IMG, 0, 0);
    k.save(); k.imageSmoothingEnabled = false; k.drawImage(BA_C, 0, 0, BA_W * BA_S, BA_H * BA_S); k.restore();
    ripple(k, BA_KF[3][1], BA_KF[3][2], ct / 0.6);
    if (u > 0.4 && u < 5.3) cursor(k, cx, cy, Math.abs(ct) < 0.1 ? 1 : 0);
  };

  // @element 13
  // 13 渐变百叶：18 片竖向百叶横跨画面，颜色沿横向从粉 #FF5C8A 经紫 #7B5CFF 到青 #2EC4FF；
  // 每片百叶的转角 θ = 0.35·sin(相位 + 0.4i) 的轻摆 + 在场程度 × 0.9·tanh((光源x − 百叶x)/120)，可见宽度 ∝ 0.2 + 0.8·|cos θ|，朝向光源的一面更亮；
  // 光源是跟随光标的聚光（半径 170 px，叠加模式），光标不在时光源停在画面中上方、亮度减半
  const GB_N = 18, GB_A = [255, 92, 138], GB_M = [123, 92, 255], GB_B = [46, 196, 255];
  const GB_KF = [[0.3, 270, 30], [1.0, 120, 80], [2.4, 420, 110], [3.6, 200, 70], [4.6, 330, 120], [5.3, 270, 30]];
  CELLS[12] = (k, w, h, u) => {
    k.fillStyle = '#0B0A14'; k.fillRect(0, 0, CW, CH);
    const ph = TAU * u / CYC, [lx, ly] = path(GB_KF, u), p = presence(u, 0.3, 1.0, 4.6, 5.3);
    const sw = CW / GB_N;
    for (let i = 0; i < GB_N; i++) {
      const x = (i + 0.5) * sw, t = i / (GB_N - 1);
      const base = t < 0.5 ? lerpC(GB_A, GB_M, t * 2) : lerpC(GB_M, GB_B, t * 2 - 1);
      const th = 0.35 * Math.sin(ph + i * 0.4) + p * 0.9 * Math.tanh((lx - x) / 120);
      const vis = sw * (0.2 + 0.8 * Math.abs(Math.cos(th))), lit = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(th) * Math.sign(lx - x || 1)) * (0.5 + 0.5 * p);
      const near = Math.exp(-(((x - lx) / 150) ** 2)) * (0.5 + 0.5 * p);
      const g = k.createLinearGradient(x - vis / 2, 0, x + vis / 2, 0);
      const c0 = lerpC([12, 10, 22], base, 0.35 + 0.35 * lit), c1 = lerpC(base, [255, 255, 255], 0.35 * near);
      if (th > 0) { g.addColorStop(0, rgb(c0)); g.addColorStop(1, rgb(c1)); } else { g.addColorStop(0, rgb(c1)); g.addColorStop(1, rgb(c0)); }
      const vg = k.createLinearGradient(0, 0, 0, CH);
      k.fillStyle = g; k.fillRect(x - vis / 2, 0, vis, CH);
      vg.addColorStop(0, 'rgba(0,0,0,.35)'); vg.addColorStop(0.5, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)');
      k.fillStyle = vg; k.fillRect(x - vis / 2, 0, vis, CH);
    }
    k.save(); k.globalCompositeOperation = 'lighter';
    const sp = k.createRadialGradient(lx, ly, 0, lx, ly, 170);
    sp.addColorStop(0, `rgba(255,255,255,${0.32 * (0.5 + 0.5 * p)})`); sp.addColorStop(1, 'rgba(255,255,255,0)');
    k.fillStyle = sp; k.fillRect(0, 0, CW, CH); k.restore();
    if (u > 0.3 && u < 5.3 && p > 0.05) cursor(k, lx, ly);
  };

  // @element 14
  // 14 夜间公路光轨：透视的夜间公路（地平线 y = 76，路面向远处弯曲 0.012·z²·sin(相位)），右侧两条车道是远去的红色尾灯、左侧两条是迎面的白蓝车灯，每条车道 14 辆车，路肩两侧是发光的路边线；
  // 车流位置 p(u) = 3·u/6.4 + 2·S(u)，S 在 2.4–4.2 秒内从 0 缓到 1：模拟光标 2.3 秒在路面按住、4.0 秒松开，期间车速飙升、光轨拉长、视野放大 1.35 倍并泛紫，进入"超空间"；
  // p 在一个周期里正好走 5 整圈，循环无缝
  const HS_HOR = 76, HS_N = 14, HS_LANES = [[1.0, 1], [2.3, 1], [-1.0, -1], [-2.3, -1]];
  const HS_S = u => inOut3(seg(u, 2.4, 4.2));
  CELLS[13] = (k, w, h, u) => {
    const bg = k.createLinearGradient(0, 0, 0, CH); bg.addColorStop(0, '#04030A'); bg.addColorStop(0.37, '#120B22'); bg.addColorStop(1, '#05040A');
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    const ph = TAU * u / CYC, P = 3 * u / CYC + 2 * HS_S(u);
    const spd = (3 / CYC + 2 * (HS_S(u + 0.01) - HS_S(u - 0.01)) / 0.02) / (3 / CYC);   // 1 = 巡航
    const warp = clamp((spd - 1) / 3), fov = 170 * (1 + 0.35 * warp);
    const proj = (X, z) => [CW / 2 + (X + 0.012 * z * z * Math.sin(ph)) * fov / z, HS_HOR + 130 / z];
    // 路面与车道线
    k.lineWidth = 1;
    k.beginPath();
    for (let z = 1; z <= 40; z += 0.5) { const [x, y] = proj(-3.4, z); z === 1 ? k.moveTo(x, y) : k.lineTo(x, y); }
    for (let z = 40; z >= 1; z -= 0.5) { const [x, y] = proj(3.4, z); k.lineTo(x, y); }
    k.closePath(); k.fillStyle = '#0B0915'; k.fill();
    const hz = k.createRadialGradient(CW / 2, HS_HOR, 0, CW / 2, HS_HOR, 260);
    hz.addColorStop(0, `rgba(170,90,255,${0.28 + 0.3 * warp})`); hz.addColorStop(1, 'rgba(170,90,255,0)');
    k.fillStyle = hz; k.fillRect(0, 0, CW, CH);
    for (const X of [-3.4, 3.4]) {
      k.beginPath();
      for (let z = 1; z <= 40; z += 0.5) { const [x, y] = proj(X, z); z === 1 ? k.moveTo(x, y) : k.lineTo(x, y); }
      k.strokeStyle = 'rgba(150,120,255,.25)'; k.lineWidth = 4; k.stroke();
      k.strokeStyle = 'rgba(190,170,255,.8)'; k.lineWidth = 1.2; k.stroke();
    }
    k.strokeStyle = 'rgba(255,220,160,.5)'; k.lineWidth = 1.2;
    for (let j = 0; j < 20; j++) {
      const z0 = 1 + 39 * ((j / 20 + P) % 1), z1 = z0 + 0.8;
      const [x0, y0] = proj(0, z0), [x1, y1] = proj(0, z1);
      k.beginPath(); k.moveTo(x0, y0); k.lineTo(x1, y1); k.stroke();
    }
    k.save(); k.globalCompositeOperation = 'lighter'; k.lineCap = 'round';
    HS_LANES.forEach(([X, dir], li) => {
      for (let j = 0; j < HS_N; j++) {
        const f = ((hash(li * 17 + j * 3.1) + j / HS_N + dir * P) % 1 + 1) % 1;
        const z = dir > 0 ? 1.5 + 38 * f : 1.5 + 38 * (1 - f), len = (1.4 + 7 * warp) * (dir > 0 ? 1 : 1.3);
        const col = dir > 0 ? lerpC([255, 50, 70], [255, 80, 200], warp) : lerpC([210, 230, 255], [120, 200, 255], warp);
        const a = clamp((40 - z) / 10) * clamp((z - 1.3) / 1.5);
        for (const off of [-0.18, 0.18]) {
          const [x0, y0] = proj(X + off, z), [x1, y1] = proj(X + off, z + len);
          k.strokeStyle = `rgba(${col},${0.3 * a})`; k.lineWidth = 16 / z + 3;
          k.beginPath(); k.moveTo(x0, y0); k.lineTo(x1, y1); k.stroke();
          k.strokeStyle = `rgba(${col},${a})`; k.lineWidth = 5 / z + 1; k.stroke();
        }
      }
    });
    k.restore();
    if (warp > 0.01) { k.fillStyle = `rgba(150,80,255,${0.16 * warp})`; k.fillRect(0, 0, CW, CH); }
    // 模拟按住
    const press = u > 2.3 && u < 4.0 ? 1 : 0;
    const [cx, cy] = path([[1.6, 600, 200], [2.2, 300, 170], [4.1, 300, 170], [4.8, 600, 220]], u);
    if (press) { k.strokeStyle = 'rgba(255,255,255,.35)'; k.lineWidth = 2; k.beginPath(); k.arc(cx, cy, 14, -Math.PI / 2, -Math.PI / 2 + TAU * seg(u, 2.3, 4.0)); k.stroke(); }
    if (u > 1.6 && u < 4.8) cursor(k, cx, cy, press);
  };

  // @element 15
  // 15 倾斜图块墙：5 排圆角图块（92×58，间距 104）整体倾斜 −12°，奇偶排反向漂移，速度为每周期 2 或 3 个图块，每排的配色也按 2 或 3 个图块重复，所以周期末与开头完全重合；
  // 光标 0.4–1.0 秒入场后，各排按 (光标x − 中心)·(0.12 + 0.07·排号) 跟着平移，光标下方的图块提亮、放大 1.08 倍并描白边；光标 4.6–5.3 秒离场，平移回 0
  const GM_W = 92, GM_H = 58, GM_ST = 104, GM_ROWS = 5, GM_ROT = -12 * Math.PI / 180;
  const GM_SPD = [2, 3, 2, 3, 2], GM_PAL = [['#FF8A5B', '#FF4D6D'], ['#5B8CFF', '#7A5CFF'], ['#32D5A4', '#11998E'], ['#FFD166', '#F4A261'], ['#E0E0E8', '#A0A4B8'], ['#C77DFF', '#7B2CBF']];
  const GM_KF = [[0.4, -30, 160], [1.2, 140, 120], [2.4, 400, 90], [3.6, 220, 130], [4.6, 330, 80], [5.3, 600, 40]];
  CELLS[14] = (k, w, h, u) => {
    k.fillStyle = '#121218'; k.fillRect(0, 0, CW, CH);
    const [cx, cy] = path(GM_KF, u), p = presence(u, 0.4, 1.0, 4.6, 5.3);
    const cr = Math.cos(-GM_ROT), sr = Math.sin(-GM_ROT);
    const lx = (cx - CW / 2) * cr - (cy - CH / 2) * sr, ly = (cx - CW / 2) * sr + (cy - CH / 2) * cr;   // 光标在墙面坐标系里的位置
    k.save(); k.translate(CW / 2, CH / 2); k.rotate(GM_ROT);
    for (let r = 0; r < GM_ROWS; r++) {
      const y = (r - (GM_ROWS - 1) / 2) * (GM_H + 14) - GM_H / 2;
      const dir = r % 2 ? 1 : -1, off = dir * GM_SPD[r] * GM_ST * u / CYC + p * (cx - CW / 2) * (0.12 + 0.07 * r);
      const j0 = Math.floor((-420 - off) / GM_ST), j1 = Math.ceil((420 - off) / GM_ST);
      for (let j = j0; j <= j1; j++) {
        const x = j * GM_ST + off - GM_W / 2, pal = GM_PAL[(r * 2 + ((j % GM_SPD[r]) + GM_SPD[r]) % GM_SPD[r]) % GM_PAL.length];
        const hov = p * clamp(1 - Math.hypot((lx - (x + GM_W / 2)) / 60, (ly - (y + GM_H / 2)) / 40));
        const s = 1 + 0.08 * hov;
        k.save(); k.translate(x + GM_W / 2, y + GM_H / 2); k.scale(s, s);
        const g = k.createLinearGradient(-GM_W / 2, -GM_H / 2, GM_W / 2, GM_H / 2); g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]);
        k.globalAlpha = 0.55 + 0.45 * hov; k.fillStyle = g; rr(k, -GM_W / 2, -GM_H / 2, GM_W, GM_H, 9); k.fill();
        k.globalAlpha = 0.85; k.fillStyle = 'rgba(255,255,255,.75)';
        k.beginPath(); k.arc(-GM_W / 2 + 18, -GM_H / 2 + 18, 8, 0, TAU); k.fill();
        rr(k, -GM_W / 2 + 12, GM_H / 2 - 22, 50, 5, 2.5); k.fill(); rr(k, -GM_W / 2 + 12, GM_H / 2 - 13, 32, 5, 2.5); k.fill();
        if (hov > 0.02) { k.globalAlpha = hov; k.strokeStyle = '#FFFFFF'; k.lineWidth = 2; rr(k, -GM_W / 2, -GM_H / 2, GM_W, GM_H, 9); k.stroke(); }
        k.restore();
      }
    }
    k.restore(); k.globalAlpha = 1;
    const v = k.createLinearGradient(0, 0, CW, 0);
    v.addColorStop(0, 'rgba(18,18,24,.9)'); v.addColorStop(0.12, 'rgba(18,18,24,0)'); v.addColorStop(0.88, 'rgba(18,18,24,0)'); v.addColorStop(1, 'rgba(18,18,24,.9)');
    k.fillStyle = v; k.fillRect(0, 0, CW, CH);
    if (u > 0.4 && u < 5.3) cursor(k, cx, cy);
  };

  // @element 16
  // 16 立方体朝向阵：12×4 个实心小立方体（边长 24，间距 44）正交投影，静止时统一侧转（rx 0.5、ry 0.62）；
  // 光标 0.4–1.0 秒入场，立方体按 e^(−(d/80)²) 朝光标方向偏转，最多 1.1 rad；3.2 秒点击，一圈波以 300 px/s 扩散，
  // 波经过的立方体绕自身 y 轴转满 90°：立方体各面同色、只按法线打光，转完与原样完全重合，所以周期末不用转回；光标 4.6–5.3 秒离场
  const CU_COLS = 12, CU_ROWS = 4, CU_S = 24, CU_GAP = 44, CU_CLICK = 3.2;
  const CU_KF = [[0.4, -30, 60], [1.2, 150, 70], [2.2, 300, 150], [CU_CLICK, 330, 100], [4.0, 440, 60], [4.6, 470, 140], [5.3, 580, 150]];
  const CU_V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
  // 每个面 4 个顶点按边相邻排列，第 0 与第 2 个是对角，用来求面中心（= 外法线）
  const CU_F = [[0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7], [1, 5, 6, 2], [4, 5, 1, 0], [3, 2, 6, 7]];
  const CU_L = [-0.447, -0.744, -0.496];               // 指向光源（左上前方）的单位向量
  const CU_A = [46, 196, 182], CU_B = [122, 92, 255];
  CELLS[15] = (k, w, h, u) => {
    k.fillStyle = '#0E1016'; k.fillRect(0, 0, CW, CH);
    const [cx, cy] = path(CU_KF, u), p = presence(u, 0.4, 1.0, 4.6, 5.3), R = (u - CU_CLICK) * 300;
    const x0 = (CW - (CU_COLS - 1) * CU_GAP) / 2, y0 = (CH - (CU_ROWS - 1) * CU_GAP) / 2, hs = CU_S / 2;
    k.lineJoin = 'round'; k.lineWidth = 1;
    for (let r = 0; r < CU_ROWS; r++) for (let c = 0; c < CU_COLS; c++) {
      const X = x0 + c * CU_GAP, Y = y0 + r * CU_GAP, dx = cx - X, dy = cy - Y;
      const wt = p * Math.exp(-((dx * dx + dy * dy) / 6400));
      const dc = Math.hypot(X - CU_KF[3][1], Y - CU_KF[3][2]);
      const spin = u > CU_CLICK ? Math.PI / 2 * inOut3(clamp((R - dc) / 70)) : 0;
      const ry = 0.62 - wt * 1.1 * clamp(dx / 60, -1, 1) + spin, rx = 0.5 + wt * 1.1 * clamp(dy / 60, -1, 1);
      const cY = Math.cos(ry), sY = Math.sin(ry), cX = Math.cos(rx), sX = Math.sin(rx);
      const P = CU_V.map(([a, b, z]) => { const x1 = a * cY + z * sY, z1 = -a * sY + z * cY; return [x1, b * cX - z1 * sX, b * sX + z1 * cX]; });
      const base = lerpC(CU_A, CU_B, c / (CU_COLS - 1)), glow = 1 + 0.5 * wt;
      for (const f of CU_F) {
        const n = [0, 1, 2].map(i => (P[f[0]][i] + P[f[2]][i]) / 2);
        if (n[2] >= 0) continue;                         // 观察者在 −z 一侧，只画朝向观察者的面
        const sh = 0.32 + 0.68 * Math.max(0, n[0] * CU_L[0] + n[1] * CU_L[1] + n[2] * CU_L[2]);
        k.fillStyle = rgb(base.map(v => Math.min(255, Math.round(v * sh * glow))));
        k.beginPath();
        f.forEach((i, j) => { const x = X + P[i][0] * hs, y = Y + P[i][1] * hs; if (j) k.lineTo(x, y); else k.moveTo(x, y); });
        k.closePath(); k.fill(); k.strokeStyle = 'rgba(255,255,255,.16)'; k.stroke();
      }
    }
    ripple(k, CU_KF[3][1], CU_KF[3][2], (u - CU_CLICK) / 0.6);
    if (u > 0.4 && u < 5.3) cursor(k, cx, cy, Math.abs(u - CU_CLICK) < 0.1 ? 1 : 0);
  };

  // @element 17
  // 17 弹性飘带光标：4 条飘带跟着光标，每条 36 个节点；头节点挂在光标周围 9 px 处缓慢转动，后面每个节点用弹簧追前一个节点，
  // 每步 v ← d·v + s·(前一节点 − 本节点)，4 条的拉力 s（0.42/0.32/0.24/0.18）不同、保留速度 d 都是 0.3，
  // 所以硬的那条紧贴光标、软的那条拖得更长更甩；线宽从头到尾变细，叠加混合发光。
  // 光标 0.4 秒从左入场，沿波浪线穿过画面，5.3 秒从右离场；物理按 1/120 秒步长预烘焙成 60 fps 帧表，同一时刻画面恒定；5.4–6.0 秒淡出
  const RB_N = 36, RB_FPS = 60, RB_SUB = 2, RB_OFF = 9;
  // 头节点不完全重合：各自挂在光标周围 RB_OFF px 的一个转动点上（相位差 90°），四条飘带才能分开
  // d 取小值：节点链一级级传递速度，d 一大就会层层放大成乱甩的折线，所以只留一点惯性
  const RB_SET = [{ s: 0.42, d: 0.3, c: '255,77,141', w: 10 }, { s: 0.32, d: 0.3, c: '255,179,71', w: 8 }, { s: 0.24, d: 0.3, c: '79,209,255', w: 7 }, { s: 0.18, d: 0.3, c: '155,123,255', w: 6 }];
  // 光标路径：横向匀速推进叠加正弦摆动，速度连续，飘带不会在关键帧处顿住
  const RB_cur = t => { const s = clamp((t - 0.4) / 4.9); return [-40 + 620 * s + 40 * Math.sin(TAU * 2 * s), 104 + 62 * Math.sin(TAU * 1.5 * s + 0.4)]; };
  let RB_FRAMES = null;
  function RB_bake() {
    const n = Math.ceil(CYC * RB_FPS) + 1, dt = 1 / (RB_FPS * RB_SUB), [x0, y0] = RB_cur(0);
    const P = RB_SET.map(() => Array.from({ length: RB_N }, () => [x0, y0, 0, 0]));
    const frames = [];
    for (let f = 0; f < n; f++) {
      frames.push(P.map(rib => Float32Array.from(rib.flatMap(q => [q[0], q[1]]))));
      for (let s = 0; s < RB_SUB; s++) {
        const [cx, cy] = RB_cur((f * RB_SUB + s + 1) * dt);
        RB_SET.forEach((o, ri) => {
          const rib = P[ri], ang = (f * RB_SUB + s) * dt * 5 + ri * Math.PI / 2;
          rib[0][0] = cx + RB_OFF * Math.cos(ang); rib[0][1] = cy + RB_OFF * Math.sin(ang);
          for (let j = 1; j < RB_N; j++) {
            const q = rib[j], pr = rib[j - 1];
            // 离散弹簧（按步计，不乘 dt）
            q[2] = q[2] * o.d + (pr[0] - q[0]) * o.s; q[3] = q[3] * o.d + (pr[1] - q[1]) * o.s;
            q[0] += q[2]; q[1] += q[3];
          }
        });
      }
    }
    RB_FRAMES = frames;
  }
  CELLS[16] = (k, w, h, u) => {
    if (!RB_FRAMES) RB_bake();
    k.fillStyle = '#0B0A12'; k.fillRect(0, 0, CW, CH);
    txt(k, 'MOVE · 跟手', CW / 2, CH / 2 + 6, `600 16px ${MONO}`, 'rgba(255,255,255,.14)', 'center');
    const fr = RB_FRAMES[Math.min(RB_FRAMES.length - 1, Math.floor(u * RB_FPS))], a = fadeIn(u);
    k.save(); k.globalCompositeOperation = 'lighter'; k.lineCap = 'round'; k.lineJoin = 'round';
    // 从最软的一条画起，硬的那条压在最上面
    for (let ri = RB_SET.length - 1; ri >= 0; ri--) {
      const o = RB_SET[ri], q = fr[ri];
      for (let pass = 0; pass < 2; pass++) {             // 第 0 遍宽而淡当光晕，第 1 遍是飘带本体
        for (let j = 1; j < RB_N; j++) {
          const f = 1 - j / RB_N;
          k.strokeStyle = `rgba(${o.c},${a * (pass ? 0.9 * f : 0.18 * f)})`;
          k.lineWidth = (pass ? 1 : 2.6) * (1 + (o.w - 1) * f);
          k.beginPath(); k.moveTo(q[j * 2 - 2], q[j * 2 - 1]); k.lineTo(q[j * 2], q[j * 2 + 1]); k.stroke();
        }
      }
    }
    k.restore();
    const [cx, cy] = RB_cur(u);
    if (u > 0.4 && u < 5.3) cursor(k, cx, cy);
  };

  // @element 18
  // 18 准星吸附：光标换成一个小圆点加四个角括号；自由移动时括号在圆点周围 14 px 处慢慢旋转，
  // 停到目标元素上时四个括号带回弹地吸附到该元素外框（外扩 6 px），离开后 0.3 秒内收回圆点周围。
  // 三个目标依次是导航胶囊（1.0–1.8 秒）、主按钮（2.3–3.4 秒）、一张卡片（3.9–4.7 秒）；2.9 秒在主按钮上点击，括号收紧 4 px、按钮压下
  const TC_T = [
    { x: 40, y: 24, w: 92, h: 30, a: 1.0, b: 1.8 },
    { x: 40, y: 120, w: 150, h: 44, a: 2.3, b: 3.4 },
    { x: 300, y: 36, w: 200, h: 136, a: 3.9, b: 4.7 },
  ];
  const TC_KF = [[0.4, 260, -24], [1.0, 86, 39], [1.8, 92, 41], [2.3, 115, 142], [3.4, 120, 140], [3.9, 400, 104], [4.7, 410, 112], [5.3, 590, 160]];
  const TC_CLICK = 2.9, TC_LEAD = 0.12, TC_REL = 0.3;
  const TC_spring = t => (t <= 0 ? 0 : 1 - Math.exp(-9 * t) * Math.cos(13 * t));   // 带一次过冲的吸附曲线
  CELLS[17] = (k, w, h, u) => {
    k.fillStyle = '#0F1117'; k.fillRect(0, 0, CW, CH);
    const [cx, cy] = path(TC_KF, u);
    // 当前吸附的目标与吸附程度 e（0 = 围着圆点，1 = 贴在目标外框）
    let tg = null, e = 0;
    for (const t of TC_T) if (u >= t.a - TC_LEAD && u < t.b + TC_REL) { tg = t; e = u < t.b ? TC_spring(u - t.a + TC_LEAD) : (1 - out3((u - t.b) / TC_REL)) * TC_spring(t.b - t.a + TC_LEAD); }
    const cp = Math.sin(Math.PI * seg(u, TC_CLICK, TC_CLICK + 0.25)) * (u > TC_CLICK ? 1 : 0);
    const hv = t => (t === tg ? clamp(e) : 0);
    // 页面：导航胶囊、主按钮、卡片
    let t = TC_T[0];
    k.fillStyle = `rgba(255,255,255,${0.06 + 0.08 * hv(t)})`; rr(k, t.x, t.y, t.w, t.h, 15); k.fill();
    txt(k, '产品介绍', t.x + t.w / 2, t.y + 20, `500 13px ${SANS}`, 'rgba(255,255,255,.85)', 'center');
    txt(k, '定价', 162, 44, `500 13px ${SANS}`, 'rgba(255,255,255,.5)'); txt(k, '文档', 210, 44, `500 13px ${SANS}`, 'rgba(255,255,255,.5)');
    txt(k, '对准，再出手', 40, 100, `700 24px ${SANS}`, '#FFFFFF');
    t = TC_T[1];
    k.save(); k.translate(t.x + t.w / 2, t.y + t.h / 2); k.scale(1 - 0.05 * cp, 1 - 0.05 * cp);
    const bg = k.createLinearGradient(-t.w / 2, 0, t.w / 2, 0); bg.addColorStop(0, '#7A5CFF'); bg.addColorStop(1, '#4F8BFF');
    k.fillStyle = bg; k.globalAlpha = 0.85 + 0.15 * hv(t); rr(k, -t.w / 2, -t.h / 2, t.w, t.h, 12); k.fill(); k.globalAlpha = 1;
    txt(k, '立即开始 →', 0, 5, `600 15px ${SANS}`, '#FFFFFF', 'center'); k.restore();
    t = TC_T[2];
    k.fillStyle = `rgba(255,255,255,${0.05 + 0.05 * hv(t)})`; rr(k, t.x, t.y, t.w, t.h, 14); k.fill();
    const ig = k.createLinearGradient(t.x, t.y, t.x + t.w, t.y + 72); ig.addColorStop(0, '#FF8A5B'); ig.addColorStop(1, '#C04CFD');
    k.fillStyle = ig; rr(k, t.x + 10, t.y + 10, t.w - 20, 70, 9); k.fill();
    k.fillStyle = 'rgba(255,255,255,.75)'; rr(k, t.x + 12, t.y + 94, 120, 8, 4); k.fill();
    k.fillStyle = 'rgba(255,255,255,.35)'; rr(k, t.x + 12, t.y + 110, 160, 6, 3); k.fill(); rr(k, t.x + 12, t.y + 122, 96, 6, 3); k.fill();
    if (!(u > 0.4 && u < 5.3)) return;
    // 四个角括号：自由角度随时间旋转，吸附时角度按最短弧转正、位置移到目标外框四角
    const rot = u * 2.2, pad = 6 - 4 * (tg === TC_T[1] ? cp : 0);
    const rc = tg && [[tg.x - pad, tg.y - pad], [tg.x + tg.w + pad, tg.y - pad], [tg.x + tg.w + pad, tg.y + tg.h + pad], [tg.x - pad, tg.y + tg.h + pad]];
    k.strokeStyle = '#FFFFFF'; k.lineWidth = 2.5; k.lineCap = 'square';
    for (let i = 0; i < 4; i++) {
      const pf = rot - 3 * Math.PI / 4 + i * Math.PI / 2, pl = -3 * Math.PI / 4 + i * Math.PI / 2;
      const ph = pf + wrapA(pl - pf) * clamp(e), fx = cx + 14 * Math.cos(pf), fy = cy + 14 * Math.sin(pf);
      const x = rc ? mix(fx, rc[i][0], e) : fx, y = rc ? mix(fy, rc[i][1], e) : fy;
      // L 形两臂指向框内：与角方向相反、左右各偏 45°
      k.beginPath();
      k.moveTo(x + 9 * Math.cos(ph + Math.PI * 3 / 4), y + 9 * Math.sin(ph + Math.PI * 3 / 4));
      k.lineTo(x, y); k.lineTo(x + 9 * Math.cos(ph - Math.PI * 3 / 4), y + 9 * Math.sin(ph - Math.PI * 3 / 4)); k.stroke();
    }
    k.fillStyle = '#FFFFFF'; k.beginPath(); k.arc(cx, cy, 3, 0, TAU); k.fill();
  };

  // @element 19
  // 19 躲避光标：7×3 个圆角图标块铺在浅色画面上；每块沿远离光标的方向让开 28·(1 − d/90)² px（d ≥ 90 px 时不动），并缩小到最少 0.92 倍；
  // 位移取光标最近 0.3 秒、11 个采样位置的指数加权平均（时间常数 0.12 秒），所以光标走开后图块顺滑地滑回原位，而不是瞬间跳回。
  // 光标 0.4 秒入场，蛇形扫过三行，5.0 秒离场
  const DG_COLS = 7, DG_ROWS = 3, DG_S = 44, DG_DX = 72, DG_Y = [44, 104, 164], DG_R = 90, DG_PUSH = 28;
  const DG_KF = [[0.4, -30, 44], [1.5, 300, 46], [2.0, 500, 62], [2.6, 420, 104], [3.4, 120, 102], [3.9, 60, 150], [4.5, 300, 166], [5.0, 590, 172]];
  const DG_COL = ['#FF6B5A', '#FFB020', '#2EC4B6', '#4F8BFF', '#7A5CFF', '#FF4D8D', '#1F2430'];
  CELLS[18] = (k, w, h, u) => {
    k.fillStyle = '#F3F1EC'; k.fillRect(0, 0, CW, CH);
    const x0 = (CW - (DG_COLS - 1) * DG_DX) / 2;
    for (let r = 0; r < DG_ROWS; r++) for (let c = 0; c < DG_COLS; c++) {
      const X = x0 + c * DG_DX, Y = DG_Y[r];
      let ox = 0, oy = 0, sw = 0;
      for (let i = 0; i <= 10; i++) {
        const s = u - i * 0.03, wt = Math.exp(-i * 0.03 / 0.12);
        sw += wt;
        if (s < 0.4 || s > 5.0) continue;
        const [px, py] = path(DG_KF, s), dx = X - px, dy = Y - py, d = Math.hypot(dx, dy);
        if (d < DG_R && d > 0.01) { const f = DG_PUSH * (1 - d / DG_R) ** 2; ox += wt * dx / d * f; oy += wt * dy / d * f; }
      }
      ox /= sw; oy /= sw;
      const sc = 1 - 0.08 * clamp(Math.hypot(ox, oy) / DG_PUSH), i = r * DG_COLS + c;
      k.save(); k.translate(X + ox, Y + oy); k.scale(sc, sc);
      k.fillStyle = 'rgba(0,0,0,.08)'; rr(k, -DG_S / 2, -DG_S / 2 + 3, DG_S, DG_S, 12); k.fill();
      k.fillStyle = DG_COL[(i * 3) % DG_COL.length]; rr(k, -DG_S / 2, -DG_S / 2, DG_S, DG_S, 12); k.fill();
      // 图标符号：圆、方、三角轮换
      k.fillStyle = 'rgba(255,255,255,.92)'; k.beginPath();
      if (i % 3 === 0) k.arc(0, 0, 8, 0, TAU);
      else if (i % 3 === 1) rr(k, -7, -7, 14, 14, 3);
      else { k.moveTo(0, -9); k.lineTo(8.5, 7); k.lineTo(-8.5, 7); k.closePath(); }
      k.fill(); k.restore();
    }
    const [cx, cy] = path(DG_KF, u);
    if (u > 0.4 && u < 5.0) cursor(k, cx, cy);
  };

  // @element 20
  // 20 网点显影：8 px 网格上的网点默认只是 1 px 的暗灰点；光标附近（高斯半径 46 px）的网点按原图亮度胀大到最多 4.6 px 并换成原图颜色，
  // 光标走过的地方按 e^(−Δt/0.9) 慢慢缩回，像用光标把一张网点照片擦出来。原图是程序画的落日山景（天空渐变、太阳、三层山脊）。
  // 4.0 秒点击，显影圈以 420 px/s 扩到全图；5.4–6.0 秒网点全部缩回
  const HT_S = 8, HT_MAX = 4.6, HT_SIG = 46, HT_CLICK = 4.0;
  const HT_KF = [[0.4, -30, 150], [1.4, 130, 120], [2.2, 250, 70], [3.0, 380, 130], [3.6, 300, 100], [HT_CLICK, 270, 104], [4.6, 330, 150], [5.2, 590, 190]];
  // 原图：返回 [r, g, b, 亮度]
  function HT_img(x, y) {
    const r1 = 120 + 16 * Math.sin(x * 0.013 + 1) + 9 * Math.sin(x * 0.037), r2 = 150 + 12 * Math.sin(x * 0.019 + 3) + 7 * Math.sin(x * 0.05);
    const r3 = 180 + 8 * Math.sin(x * 0.027 + 5);
    let c;
    if (y > r3) c = [44, 30, 70]; else if (y > r2) c = [92, 52, 112]; else if (y > r1) c = [150, 74, 128];
    else if (Math.hypot(x - 360, y - 86) < 32) c = [255, 226, 150];
    else { const t = clamp(y / 130); c = lerpC([48, 40, 120], [255, 142, 92], t); }
    return [c[0], c[1], c[2], (0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]) / 255];
  }
  let HT_DOTS = null;
  CELLS[19] = (k, w, h, u) => {
    const cols = Math.ceil(CW / HT_S), rows = Math.ceil(CH / HT_S);
    if (!HT_DOTS) { HT_DOTS = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) HT_DOTS.push(HT_img(c * HT_S + HT_S / 2, r * HT_S + HT_S / 2)); }
    k.fillStyle = '#0D0C12'; k.fillRect(0, 0, CW, CH);
    const rv = new Float32Array(cols * rows), reach = Math.ceil(3 * HT_SIG / HT_S);
    // 拖尾：对过去 2.5 秒的光标采样，只更新采样点 3σ 范围内的网点
    for (let s = Math.max(0.4, u - 2.5); s <= Math.min(u, 5.2); s += 1 / 40) {
      const [px, py] = path(HT_KF, s), pc = Math.floor(px / HT_S), pr = Math.floor(py / HT_S), dec = Math.exp(-(u - s) / 0.9);
      for (let r = Math.max(0, pr - reach); r <= Math.min(rows - 1, pr + reach); r++) for (let c = Math.max(0, pc - reach); c <= Math.min(cols - 1, pc + reach); c++) {
        const dx = c * HT_S + HT_S / 2 - px, dy = r * HT_S + HT_S / 2 - py, v = Math.exp(-(dx * dx + dy * dy) / (HT_SIG * HT_SIG)) * dec;
        if (v > rv[r * cols + c]) rv[r * cols + c] = v;
      }
    }
    const R = (u - HT_CLICK) * 420, fi = fadeIn(u);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * HT_S + HT_S / 2, y = r * HT_S + HT_S / 2, im = HT_DOTS[r * cols + c];
      let v = rv[r * cols + c];
      if (R > 0) v = Math.max(v, clamp((R - Math.hypot(x - HT_KF[5][1], y - HT_KF[5][2])) / 60));
      v *= fi;
      const rad = mix(1, HT_MAX * (0.35 + 0.65 * im[3]), v);
      k.fillStyle = rgb(lerpC([58, 56, 66], im, v));
      k.beginPath(); k.arc(x, y, rad, 0, TAU); k.fill();
    }
    const [cx, cy] = path(HT_KF, u);
    ripple(k, HT_KF[5][1], HT_KF[5][2], (u - HT_CLICK) / 0.6);
    if (u > 0.4 && u < 5.2) cursor(k, cx, cy, Math.abs(u - HT_CLICK) < 0.1 ? 1 : 0);
  };

  // @element 21
  // 21 像素换图：卡片（300×150）切成 15 px 的像素块；1.0 秒光标从左边进入，以入口点为圆心、260 px/s 的波逐块把白天图 A 换成夜晚图 B，
  // 波前 18 px 宽的一圈块先闪成强调色；3.4 秒光标从右下角离开，从出口点再起一道波把 B 换回 A。每块加 0–14 px 的确定性延迟，让波前呈锯齿像素状
  const PS_X = 120, PS_Y = 29, PS_W = 300, PS_H = 150, PS_C = 15, PS_V = 260, PS_EDGE = 18;
  const PS_IN = [1.0, 120, 100], PS_OUT = [3.4, 420, 179];
  const PS_KF = [[0.3, -30, 104], [PS_IN[0], PS_IN[1], PS_IN[2]], [1.8, 250, 80], [2.6, 340, 128], [PS_OUT[0], PS_OUT[1], PS_OUT[2]], [4.0, 570, 204]];
  let PS_A = null, PS_B = null;
  function PS_paint(night) {
    const c = document.createElement('canvas'); c.width = PS_W; c.height = PS_H;
    const g = c.getContext('2d'), sky = g.createLinearGradient(0, 0, 0, PS_H);
    if (night) { sky.addColorStop(0, '#1B1446'); sky.addColorStop(1, '#4A2C7A'); } else { sky.addColorStop(0, '#7CC8FF'); sky.addColorStop(1, '#DDF2FF'); }
    g.fillStyle = sky; g.fillRect(0, 0, PS_W, PS_H);
    if (night) {
      for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(255,255,255,${0.4 + 0.5 * hash(i + 40)})`; g.fillRect(hash(i) * PS_W, hash(i + 90) * 90, 2, 2); }
      g.fillStyle = '#F4EFD8'; g.beginPath(); g.arc(230, 44, 20, 0, TAU); g.fill();
      g.fillStyle = '#1B1446'; g.beginPath(); g.arc(240, 38, 17, 0, TAU); g.fill();
    } else { g.fillStyle = '#FFD45A'; g.beginPath(); g.arc(230, 44, 22, 0, TAU); g.fill(); }
    g.fillStyle = night ? '#2A1D52' : '#5BBE7A'; g.beginPath(); g.moveTo(0, PS_H);
    for (let x = 0; x <= PS_W; x += 10) g.lineTo(x, 112 + 12 * Math.sin(x * 0.03));
    g.lineTo(PS_W, PS_H); g.closePath(); g.fill();
    g.font = `800 34px ${SANS}`; g.textBaseline = 'alphabetic'; g.fillStyle = night ? '#FFFFFF' : '#0F3B5C'; g.fillText(night ? 'NIGHT' : 'DAY', 22, 66);
    return c;
  }
  CELLS[20] = (k, w, h, u) => {
    if (!PS_A) { PS_A = PS_paint(false); PS_B = PS_paint(true); }
    k.fillStyle = '#EDEAF3'; k.fillRect(0, 0, CW, CH);
    const hov = presence(u, PS_IN[0] - 0.1, PS_IN[0] + 0.2, PS_OUT[0] - 0.1, PS_OUT[0] + 0.2);
    k.fillStyle = `rgba(40,20,90,${0.10 + 0.12 * hov})`; rr(k, PS_X, PS_Y + 4 + 4 * hov, PS_W, PS_H, 14); k.fill();
    k.save(); rr(k, PS_X, PS_Y, PS_W, PS_H, 14); k.clip();
    const R1 = (u - PS_IN[0]) * PS_V, R2 = (u - PS_OUT[0]) * PS_V;
    for (let r = 0; r < PS_H / PS_C; r++) for (let c = 0; c < PS_W / PS_C; c++) {
      const x = PS_X + c * PS_C, y = PS_Y + r * PS_C, jit = 14 * hash(r * 37 + c * 11 + 5);
      const d1 = Math.hypot(x + PS_C / 2 - PS_IN[1], y + PS_C / 2 - PS_IN[2]) + jit, d2 = Math.hypot(x + PS_C / 2 - PS_OUT[1], y + PS_C / 2 - PS_OUT[2]) + jit;
      const onB = R1 > d1 && !(R2 > d2);
      k.drawImage(onB ? PS_B : PS_A, c * PS_C, r * PS_C, PS_C, PS_C, x, y, PS_C, PS_C);
      // 波前：刚被波扫到的那一圈块闪成强调色
      const fr = R2 > 0 ? R2 - d2 : R1 - d1;
      if (fr > 0 && fr < PS_EDGE) { k.fillStyle = `rgba(122,92,255,${0.85 * (1 - fr / PS_EDGE)})`; k.fillRect(x, y, PS_C, PS_C); }
    }
    k.restore();
    const [cx, cy] = path(PS_KF, u);
    if (u > 0.3 && u < 4.0) cursor(k, cx, cy);
  };

  // @element 22
  // 22 电流边框：深色卡片（280×124）的圆角边框是一圈抖动的电弧。沿周长约每 4 px 取一点，按外法线方向偏移；
  // 偏移由 5 个正弦叠加，每项沿周长的波数和每周期的圈数都取整数，所以边框首尾闭合、u = 6.4 秒与 0 秒完全一致，不需要复位段。
  // 光标 70 px 内的边框抖动幅度从 3 px 增到 11 px；光标越接近卡片，整圈越亮（最多 1.6 倍）。
  const EB_X = 129.5, EB_Y = 42, EB_W = 280, EB_H = 124, EB_R = 18, EB_STEP = 4;
  const EB_A = 3, EB_NEAR = 8, EB_FALL = 70;
  const EB_WAVES = [[7, 9, 0.5], [13, -17, 0.35], [23, 31, 0.25], [41, -47, 0.18], [67, 59, 0.12]]; // [沿周长波数, 每周期圈数, 权重]
  const EB_KF = [[0.5, 570, 196], [1.4, 430, 176], [2.3, 330, 34], [3.2, 150, 96], [4.1, 250, 170], [5.0, -30, 196]];
  // 预先沿圆角矩形顺时针取点：[x, y, 外法线 nx, ny]。边按 上 → 右 → 下 → 左，每条边后接一个四分之一圆角
  const EB_PTS = (() => {
    const a = EB_W - 2 * EB_R, b = EB_H - 2 * EB_R, q = TAU * EB_R / 4, P = 2 * a + 2 * b + 4 * q;
    const L = [[EB_X + EB_R, EB_Y, 1, 0], [EB_X + EB_W, EB_Y + EB_R, 0, 1], [EB_X + EB_W - EB_R, EB_Y + EB_H, -1, 0], [EB_X, EB_Y + EB_H - EB_R, 0, -1]];
    const C = [[EB_X + EB_W - EB_R, EB_Y + EB_R], [EB_X + EB_W - EB_R, EB_Y + EB_H - EB_R], [EB_X + EB_R, EB_Y + EB_H - EB_R], [EB_X + EB_R, EB_Y + EB_R]];
    const n = Math.round(P / EB_STEP), out = [];
    for (let i = 0; i < n; i++) {
      let s = i * P / n;
      for (let j = 0; j < 4; j++) {
        const len = j % 2 ? b : a;
        if (s < len) { const [x, y, dx, dy] = L[j]; out.push([x + dx * s, y + dy * s, dy, -dx]); break; }
        s -= len;
        if (s < q || j === 3) { const g = -Math.PI / 2 + j * Math.PI / 2 + s / EB_R, c = Math.cos(g), si = Math.sin(g); out.push([C[j][0] + EB_R * c, C[j][1] + EB_R * si, c, si]); break; }
        s -= q;
      }
    }
    return out;
  })();
  // 第 i 个点在时刻 u 的法向偏移（约 -1..1），tr 取不同相位得到第二条电弧
  const EB_off = (i, u, tr) => {
    let v = 0;
    EB_WAVES.forEach(([kk, m, wt], j) => { v += wt * Math.sin(TAU * (kk * i / EB_PTS.length + m * u / CYC) + TAU * hash(j * 7 + tr * 31 + 3)); });
    return v;
  };
  function EB_trace(k, u, tr, amps, scale) {
    k.beginPath();
    EB_PTS.forEach(([x, y, nx, ny], i) => { const o = EB_off(i, u, tr) * amps[i] * scale; if (i) k.lineTo(x + nx * o, y + ny * o); else k.moveTo(x + nx * o, y + ny * o); });
    k.closePath();
  }
  CELLS[21] = (k, w, h, u) => {
    k.fillStyle = '#07080F'; k.fillRect(0, 0, CW, CH);
    const on = u > EB_KF[0][0] && u < EB_KF[EB_KF.length - 1][0];
    const [cx, cy] = path(EB_KF, u);
    // 光标到卡片矩形的外部距离，40 px 内逐渐点亮；出入场位置离卡片都很远，亮度不会跳变
    const dOut = Math.hypot(Math.max(0, EB_X - cx, cx - EB_X - EB_W), Math.max(0, EB_Y - cy, cy - EB_Y - EB_H));
    const hov = on ? clamp(1 - dOut / 40) : 0, bright = 1 + 0.6 * hov;
    const amps = EB_PTS.map(([x, y]) => EB_A + (on ? EB_NEAR * Math.exp(-((Math.hypot(x - cx, y - cy) / EB_FALL) ** 2)) : 0));
    // 卡片本体与文字
    const g = k.createLinearGradient(0, EB_Y, 0, EB_Y + EB_H); g.addColorStop(0, '#141829'); g.addColorStop(1, '#0C0E18');
    k.fillStyle = g; rr(k, EB_X, EB_Y, EB_W, EB_H, EB_R); k.fill();
    txt(k, 'PRO PLAN', EB_X + 24, EB_Y + 34, `600 11px ${MONO}`, `rgba(120,215,255,${0.55 + 0.35 * hov})`);
    txt(k, 'Electric', EB_X + 24, EB_Y + 72, `800 30px ${SANS}`, '#F2F6FF');
    txt(k, 'hover to charge the border', EB_X + 24, EB_Y + 98, `400 13px ${SANS}`, 'rgba(200,210,235,0.6)');
    // 外圈柔光：宽线低透明度叠两层，代替 shadowBlur（shadowBlur 不随画布缩放，详情页会画得不一样）
    k.lineJoin = 'round';
    EB_trace(k, u, 0, amps, 1);
    k.strokeStyle = `rgba(60,170,255,${0.07 * bright})`; k.lineWidth = 16; k.stroke();
    k.strokeStyle = `rgba(80,200,255,${0.16 * bright})`; k.lineWidth = 7; k.stroke();
    k.strokeStyle = `rgba(120,220,255,${Math.min(1, 0.7 * bright)})`; k.lineWidth = 2.4; k.stroke();
    k.strokeStyle = 'rgba(240,250,255,0.95)'; k.lineWidth = 1; k.stroke();
    // 第二条电弧：相位不同、幅度 0.6 倍，与主弧交错显出噼啪感
    EB_trace(k, u, 1, amps, 0.6);
    k.strokeStyle = `rgba(160,190,255,${0.45 * bright})`; k.lineWidth = 1.2; k.stroke();
    if (on) cursor(k, cx, cy);
  };

  // @element 23
  // 23 弹跳扇形卡片：5 张 96×124 的卡片扇形叠放（-14°…14°），0.1 秒起依次间隔 0.12 秒带回弹放大入场；
  // 光标从左到右依次停在每张卡上，悬停的卡转正、放大 1.08 倍并上抬 12 px，两侧的卡按距离被推开（相邻 30 px，隔一张 15 px）。
  // 悬停程度按光标与卡中心的水平距离连续计算（不记状态），5.4–6.0 秒全部缩回 0，与 0 秒的未入场状态衔接。
  const BC_N = 5, BC_W = 96, BC_H = 124, BC_GAP = 58, BC_ROT = 14 * Math.PI / 180, BC_PUSH = 30;
  const BC_COLS = [['#FF7A59', '#FFC15E'], ['#7A5CFF', '#C77DFF'], ['#2EC4B6', '#9BF6FF'], ['#FF5D8F', '#FFB3C6'], ['#3A86FF', '#8EC5FF']];
  const BC_KF = [[0.9, -20, 196], [1.5, 154, 104], [2.2, 212, 104], [2.9, 270, 100], [3.6, 328, 104], [4.3, 386, 104], [5.0, 560, 200]];
  const backOut = t => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
  CELLS[22] = (k, w, h, u) => {
    k.fillStyle = '#F4F1EA'; k.fillRect(0, 0, CW, CH);
    const on = u > BC_KF[0][0] && u < BC_KF[BC_KF.length - 1][0];
    const [cx, cy] = path(BC_KF, u);
    const out = 1 - resetK(u);
    // 每张卡的悬停程度：光标水平距离的高斯权重 × 光标是否落在卡片高度范围内
    const inY = on ? clamp(1 - Math.max(0, Math.abs(cy - 104) - 50) / 30) : 0;
    const hv = [...Array(BC_N)].map((_, i) => inY * Math.exp(-(((cx - (270 + (i - 2) * BC_GAP)) / 26) ** 2)));
    const cards = [...Array(BC_N)].map((_, i) => {
      let dx = 0;
      for (let j = 0; j < BC_N; j++) if (j !== i) dx += Math.sign(i - j) * hv[j] * BC_PUSH / Math.abs(i - j);
      const a = (i - 2) / 2 * BC_ROT * (1 - hv[i]);
      const s = backOut(seg(u, 0.1 + 0.12 * i, 0.6 + 0.12 * i)) * out * (1 + 0.08 * hv[i]);
      return { i, x: 270 + (i - 2) * BC_GAP + dx, y: 110 + Math.abs(i - 2) * 6 - 12 * hv[i], a, s, hv: hv[i] };
    });
    // 悬停越强越晚画（在最上层）；中间的卡默认在上面
    cards.sort((p, q) => (p.hv - q.hv) || (Math.abs(q.i - 2) - Math.abs(p.i - 2)));
    for (const c of cards) {
      if (c.s <= 0.001) continue;
      k.save(); k.translate(c.x, c.y); k.rotate(c.a); k.scale(c.s, c.s);
      k.fillStyle = `rgba(40,30,20,${0.12 + 0.1 * c.hv})`; rr(k, -BC_W / 2 + 2, -BC_H / 2 + 5 + 5 * c.hv, BC_W, BC_H, 12); k.fill();
      k.fillStyle = '#FFFFFF'; rr(k, -BC_W / 2, -BC_H / 2, BC_W, BC_H, 12); k.fill();
      // 卡面"图片"：渐变 + 一座山和太阳
      const [c1, c2] = BC_COLS[c.i], g = k.createLinearGradient(0, -BC_H / 2, 0, BC_H / 2);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      k.save(); rr(k, -BC_W / 2 + 6, -BC_H / 2 + 6, BC_W - 12, BC_H - 12, 8); k.clip();
      k.fillStyle = g; k.fillRect(-BC_W / 2, -BC_H / 2, BC_W, BC_H);
      k.fillStyle = 'rgba(255,255,255,0.75)'; k.beginPath(); k.arc(18, -30, 10, 0, TAU); k.fill();
      k.fillStyle = 'rgba(0,0,0,0.16)'; k.beginPath(); k.moveTo(-50, 62); k.lineTo(-14, 6); k.lineTo(8, 34); k.lineTo(26, 16); k.lineTo(50, 62); k.closePath(); k.fill();
      k.restore();
      k.restore();
    }
    if (on) cursor(k, cx, cy, 0, true);
  };

  // @element 24
  // 24 挂绳胸牌：胸牌（84×116）挂在从画面上方垂下的挂绳上，平时以 3.2 秒为周期轻微摆动（±0.04 rad）。
  // 1.2 秒光标按住胸牌中心，向右上拖到 (400, 118)，挂绳被拉长；2.6 秒松手后按阻尼摆回落：
  // 摆角 θ = θ松手·e^(−2.2τ)·cos(5.2τ)，绳长按 e^(−6τ)·cos(14τ) 弹回 84 px，胸牌自身转角比挂绳晚 0.06 秒，显出甩动感。
  // 全部是 u 的解析式，不做逐帧积分；5.4–6.0 秒把剩余摆动乘 (1 − resetK) 归零，回到只有轻摆的 0 秒状态。
  const LY_AX = 270, LY_AY = -20, LY_L0 = 84, LY_HALF = 66, LY_BW = 84, LY_BH = 116;
  const LY_GRAB = 1.2, LY_REL = 2.6, LY_W = 5.2, LY_DAMP = 2.2, LY_LAG = 0.06;
  const LY_KF = [[0.4, 520, 210], [LY_GRAB, LY_AX, LY_AY + LY_L0 + LY_HALF], [2.5, 400, 118], [LY_REL, 400, 118], [3.2, 450, 160], [4.0, 580, 214]];
  const LY_idle = u => 0.04 * Math.sin(TAU * 2 * u / CYC);
  // 拖动时由光标位置反推挂绳角度与长度（光标抓在胸牌中心：夹子下 8 px 起是 116 px 高的卡，中心离绳端 66 px）
  const LY_drag = (cx, cy) => [Math.atan2(cx - LY_AX, cy - LY_AY), Math.hypot(cx - LY_AX, cy - LY_AY) - LY_HALF];
  CELLS[23] = (k, w, h, u) => {
    k.fillStyle = '#E9EEF5'; k.fillRect(0, 0, CW, CH);
    const [cx, cy] = path(LY_KF, u), keep = 1 - resetK(u);
    let th, L, rot;
    if (u < LY_REL) {
      const e = inOut3(seg(u, LY_GRAB, LY_GRAB + 0.15)), [dt, dl] = LY_drag(cx, cy);
      th = mix(LY_idle(u), dt, e); L = mix(LY_L0, dl, e); rot = th;
    } else {
      const [tR, lR] = LY_drag(LY_KF[3][1], LY_KF[3][2]), tau = u - LY_REL;
      const sw = t => t < 0 ? tR : tR * Math.exp(-LY_DAMP * t) * Math.cos(LY_W * t);
      th = LY_idle(u) + sw(tau) * keep;
      rot = LY_idle(u) + sw(tau - LY_LAG) * keep;
      L = LY_L0 + (lR - LY_L0) * Math.exp(-6 * tau) * Math.cos(14 * tau) * keep;
    }
    const clipX = LY_AX + L * Math.sin(th), clipY = LY_AY + L * Math.cos(th);
    // 挂绳：两股带子从上方汇到夹子；中点按胸牌与挂绳的角度差横向弯一点
    const bend = (rot - th) * 40, mx = (LY_AX + clipX) / 2 + bend * Math.cos(th), my = (LY_AY + clipY) / 2 - bend * Math.sin(th);
    for (const [off, col] of [[-5, '#5A3FD6'], [5, '#7A5CFF']]) {
      k.strokeStyle = col; k.lineWidth = 7; k.lineCap = 'round';
      k.beginPath(); k.moveTo(LY_AX + off * 2.2, LY_AY); k.quadraticCurveTo(mx + off, my, clipX + off * 0.4, clipY); k.stroke();
    }
    k.save(); k.translate(clipX, clipY); k.rotate(-rot);
    // 夹子
    k.fillStyle = '#9AA3B2'; rr(k, -9, -4, 18, 14, 3); k.fill();
    k.fillStyle = '#C9D0DB'; rr(k, -5, -1, 10, 6, 2); k.fill();
    // 胸牌本体：阴影 + 白卡 + 顶部色带 + 头像 + 姓名 + 条码
    const by = 8;
    k.fillStyle = 'rgba(30,40,70,0.16)'; rr(k, -LY_BW / 2 + 3, by + 5, LY_BW, LY_BH, 10); k.fill();
    k.fillStyle = '#FFFFFF'; rr(k, -LY_BW / 2, by, LY_BW, LY_BH, 10); k.fill();
    k.save(); rr(k, -LY_BW / 2, by, LY_BW, LY_BH, 10); k.clip();
    const g = k.createLinearGradient(-LY_BW / 2, 0, LY_BW / 2, 0); g.addColorStop(0, '#7A5CFF'); g.addColorStop(1, '#2EC4B6');
    k.fillStyle = g; k.fillRect(-LY_BW / 2, by, LY_BW, 30);
    k.restore();
    k.fillStyle = '#E9EEF5'; rr(k, -11, by + 6, 22, 5, 2.5); k.fill();          // 穿绳孔
    k.fillStyle = '#FFD6A5'; k.beginPath(); k.arc(0, by + 44, 15, 0, TAU); k.fill();
    k.strokeStyle = '#FFFFFF'; k.lineWidth = 3; k.stroke();
    k.fillStyle = '#3D2C8D'; k.beginPath(); k.arc(0, by + 40, 6, 0, TAU); k.fill();
    k.beginPath(); k.arc(0, by + 56, 10, Math.PI, TAU); k.fill();
    txt(k, 'MIKA TAN', 0, by + 78, `800 11px ${SANS}`, '#1E2340', 'center');
    txt(k, 'ENGINEER', 0, by + 91, `600 8px ${MONO}`, '#7A5CFF', 'center');
    for (let i = 0; i < 18; i++) { k.fillStyle = '#1E2340'; k.fillRect(-27 + i * 3, by + 98, hash(i + 70) > 0.5 ? 2 : 1, 10); }
    k.restore();
    const press = u > LY_GRAB && u < LY_REL ? 1 : 0;
    if (u > LY_KF[0][0] && u < LY_KF[LY_KF.length - 1][0]) cursor(k, cx, cy, press);
  };

  // @element 25
  // 25 弧形输入框：搜索框整条弯在一段圆弧上，0.2–0.8 秒从平直弯成弧（弧半径 200 px），5.4–6.0 秒再变回平直，与 0 秒衔接。
  // 输入框是沿中线描出的 44 px 宽圆头粗线；搜索图标、逐字键入的文字、插入符和右端的发送按钮都按所在弧长位置放置并沿切线旋转。
  // 1.2 秒点击聚焦（外圈出现聚焦光环），1.4–3.0 秒逐字键入，3.8 秒点发送：文字沿弧滑向按钮并淡出，随后占位文字回来。
  const CI_CX = 270, CI_Y = 112, CI_R = 200, CI_HALF = 150, CI_TH = 44;
  const CI_TEXT = 'curved text input', CI_PH = 'Search effects…';
  const CI_TYPE0 = 1.4, CI_TYPE1 = 3.0, CI_SEND = 3.8;
  const CI_KF = [[0.4, 520, 214], [1.1, 230, 117], [1.6, 230, 117], [2.6, 330, 190], [3.5, 389, 152], [4.0, 389, 152], [4.8, 540, 220]];
  // 弧长 s、法向偏移 t（向外为正）→ 画面坐标与切线角；b = 弯曲程度 0..1
  const CI_pt = (s, t, b) => {
    const R = CI_R / Math.max(b, 1e-3), f = s / R;
    return [CI_CX + (R + t) * Math.sin(f), CI_Y + R - (R + t) * Math.cos(f), f];
  };
  CELLS[24] = (k, w, h, u) => {
    k.fillStyle = '#EEF0F6'; k.fillRect(0, 0, CW, CH);
    const b = inOut3(seg(u, 0.2, 0.8)) * (1 - resetK(u));
    const focus = presence(u, 1.2, 1.4, 4.4, 4.8);
    // 中线折线
    const line = (t, lw, col) => {
      k.strokeStyle = col; k.lineWidth = lw; k.lineCap = 'round'; k.lineJoin = 'round'; k.beginPath();
      for (let s = -CI_HALF; s <= CI_HALF; s += 4) { const [x, y] = CI_pt(s, t, b); s === -CI_HALF ? k.moveTo(x, y) : k.lineTo(x, y); }
      k.stroke();
    };
    line(-3, CI_TH + 4, 'rgba(30,40,80,0.08)');
    if (focus > 0) line(0, CI_TH + 10, `rgba(91,99,255,${0.22 * focus})`);
    line(0, CI_TH + 2, focus > 0.5 ? '#5B63FF' : '#C9CEDC');
    line(0, CI_TH - 1, '#FFFFFF');
    // 沿弧放置一个绘制函数
    const at = (s, t, fn) => { const [x, y, f] = CI_pt(s, t, b); k.save(); k.translate(x, y); k.rotate(f); fn(); k.restore(); };
    // 搜索图标
    at(-CI_HALF + 20, 0, () => {
      k.strokeStyle = '#8A90A6'; k.lineWidth = 2; k.beginPath(); k.arc(-1.5, -1.5, 5.5, 0, TAU); k.stroke();
      k.beginPath(); k.moveTo(2.5, 2.5); k.lineTo(6.5, 6.5); k.stroke();
    });
    // 文字：键入的字符数；发送后整串沿弧滑向按钮并淡出
    const n = Math.floor(CI_TEXT.length * seg(u, CI_TYPE0, CI_TYPE1) + 1e-6);
    const go = seg(u, CI_SEND + 0.05, CI_SEND + 0.55), slide = 110 * inOut3(go), fade = 1 - go;
    const s0 = -CI_HALF + 38;
    k.font = `500 14px ${SANS}`;
    let s = s0;
    if (n > 0 && fade > 0) {
      for (let i = 0; i < n; i++) {
        const ch = CI_TEXT[i], cw = k.measureText(ch).width;
        at(s + cw / 2 + slide, 0, () => txt(k, ch, 0, 0.5, `500 14px ${SANS}`, `rgba(30,34,52,${fade})`, 'center', 'middle'));
        s += cw;
      }
    }
    // 占位文字：没有键入内容时显示（发送后 0.3 秒淡回）
    const ph = n === 0 ? 1 : seg(u, CI_SEND + 0.5, CI_SEND + 0.8);
    if (ph > 0) {
      let sp = s0;
      for (const ch of CI_PH) {
        const cw = k.measureText(ch).width;
        at(sp + cw / 2, 0, () => txt(k, ch, 0, 0.5, `500 14px ${SANS}`, `rgba(138,144,166,${ph})`, 'center', 'middle'));
        sp += cw;
      }
    }
    // 插入符：聚焦时闪烁（键入期间常亮）
    if (focus > 0.5 && u < CI_SEND) {
      const typing = u > CI_TYPE0 && u < CI_TYPE1 + 0.1;
      if (typing || Math.floor(u / 0.5) % 2 === 0) at(s + 1.5, 0, () => { k.fillStyle = '#5B63FF'; k.fillRect(-0.8, -9, 1.6, 18); });
    }
    // 发送按钮：右端圆形，按下时缩小；箭头沿切线
    const press = presence(u, CI_SEND - 0.05, CI_SEND, CI_SEND + 0.1, CI_SEND + 0.2);
    at(CI_HALF - 20, 0, () => {
      const r = 16 * (1 - 0.12 * press);
      k.fillStyle = n > 0 && fade > 0.5 ? '#5B63FF' : '#B8BDF5'; k.beginPath(); k.arc(0, 0, r, 0, TAU); k.fill();
      k.strokeStyle = '#FFFFFF'; k.lineWidth = 2.2; k.lineCap = 'round'; k.lineJoin = 'round';
      k.beginPath(); k.moveTo(-6, 0); k.lineTo(6, 0); k.moveTo(1, -5); k.lineTo(6, 0); k.lineTo(1, 5); k.stroke();
    });
    const [bx, by] = CI_pt(CI_HALF - 20, 0, b);
    ripple(k, bx, by, seg(u, CI_SEND, CI_SEND + 0.5), '91,99,255');
    const [cx, cy] = path(CI_KF, u);
    const down = presence(u, 1.15, 1.2, 1.25, 1.3) + press;
    if (u > CI_KF[0][0] && u < CI_KF[CI_KF.length - 1][0]) cursor(k, cx, cy, down);
  };

  // @element 26
  // 26 拖动调数：数值框 "Opacity"，按住后左右拖动直接改数值（每 2 px 变 1），范围 0–100。
  // 1.0 秒按下向右拖，数值到 100 后继续拖，超出部分按橡皮筋 r(d) = 40·(1 − 1/(1 + d/80)) 让整个框向右被拉长、越拉越难；
  // 2.6 秒松手，框按 e^(−9τ)·cos(18τ) 弹回原宽；3.2 秒再按下向左拖到 0 以下，同样左侧被拉长，4.6 秒松手弹回。
  // 拖动时光标变成左右箭头，框内底部的进度条跟随数值；5.4–6.0 秒数值缓回 0 秒的 40。
  const SF_X = 270, SF_Y = 98, SF_W = 220, SF_H = 48, SF_V0 = 40, SF_PX = 2;
  const SF_KF = [[0.3, 330, 220], [0.9, 310, 102], [1.0, 310, 102], [2.4, 500, 102], [2.6, 500, 102], [3.1, 430, 102], [3.2, 430, 102], [4.4, 130, 102], [4.6, 130, 102], [5.2, 200, 220]];
  const SF_D = [[1.0, 2.6, 310], [3.2, 4.6, 430]];
  const SF_band = d => 40 * (1 - 1 / (1 + d / 80));
  // 拖动状态：返回 [数值, 越界拉伸(+右/−左), 是否按住]
  const SF_state = (u, cx) => {
    let v = SF_V0, over = 0, held = false;
    for (const [a, b, x0] of SF_D) {
      if (u < a) break;
      const xe = u < b ? cx : path(SF_KF, b)[0];
      const raw = v + (xe - x0) / SF_PX, cl = clamp(raw, 0, 100);
      const ex = (raw - cl) * SF_PX, st = Math.sign(ex) * SF_band(Math.abs(ex));
      if (u < b) { held = true; over = st; v = cl; break; }
      const tau = u - b;
      over = st * Math.exp(-9 * tau) * Math.cos(18 * tau); v = cl;
    }
    return [v, over, held];
  };
  CELLS[25] = (k, w, h, u) => {
    k.fillStyle = '#16181F'; k.fillRect(0, 0, CW, CH);
    const [cx, cy] = path(SF_KF, u);
    let [v, over, held] = SF_state(u, cx);
    v = mix(v, SF_V0, resetK(u)); over *= 1 - resetK(u);
    // 拉伸：右越界只拉长右边缘，左越界只拉长左边缘；高度略收窄
    const l = SF_X - SF_W / 2 + Math.min(0, over), r = SF_X + SF_W / 2 + Math.max(0, over);
    const hh = SF_H * (1 - 0.06 * Math.abs(over) / 40);
    const y0 = SF_Y - hh / 2;
    k.fillStyle = held ? '#2A2E3C' : '#232632'; rr(k, l, y0, r - l, hh, 10); k.fill();
    k.strokeStyle = held ? '#7C8CFF' : '#3A3F50'; k.lineWidth = 1.5; rr(k, l, y0, r - l, hh, 10); k.stroke();
    // 进度条
    k.save(); rr(k, l, y0, r - l, hh, 10); k.clip();
    k.fillStyle = 'rgba(124,140,255,0.22)'; k.fillRect(l, y0, (r - l) * v / 100, hh);
    k.restore();
    txt(k, 'Opacity', l + 16, SF_Y + 1, `600 13px ${SANS}`, '#9AA1B8', 'left', 'middle');
    txt(k, `${Math.round(v)}`, r - 34, SF_Y + 1, `700 18px ${MONO}`, '#FFFFFF', 'right', 'middle');
    txt(k, '%', r - 16, SF_Y + 2, `600 12px ${MONO}`, '#6F7690', 'right', 'middle');
    // 两端刻度提示
    txt(k, '0', SF_X - SF_W / 2, SF_Y + 44, `600 10px ${MONO}`, '#5A6078', 'center');
    txt(k, '100', SF_X + SF_W / 2, SF_Y + 44, `600 10px ${MONO}`, '#5A6078', 'center');
    txt(k, 'drag to scrub', SF_X, SF_Y - 40, `600 10px ${MONO}`, '#5A6078', 'center');
    if (u > SF_KF[0][0] && u < SF_KF[SF_KF.length - 1][0]) {
      if (held) {
        // 左右箭头光标
        k.save(); k.translate(cx, cy);
        k.fillStyle = '#FFFFFF'; k.strokeStyle = '#16181F'; k.lineWidth = 1.3; k.lineJoin = 'round';
        k.beginPath(); k.moveTo(-12, 0); k.lineTo(-5, -6); k.lineTo(-5, -2.5); k.lineTo(5, -2.5); k.lineTo(5, -6); k.lineTo(12, 0);
        k.lineTo(5, 6); k.lineTo(5, 2.5); k.lineTo(-5, 2.5); k.lineTo(-5, 6); k.closePath(); k.fill(); k.stroke();
        k.restore();
      } else cursor(k, cx, cy, 0, true);
    }
  };

  // @element 27
  // 27 弧面画廊：一排 7 张 92×116 的卡片排在半径 560 px 的圆弧上（中间高、两边低），卡片本身也沿弧弯曲（上下边按弧采样成多边形）。
  // 卡片首尾循环排列，间距 116 px。1.0–2.2 秒按住向左拖 170 px，松手后按 e^(−5τ) 吸附到最近的卡位（−116 px）；
  // 3.4–4.4 秒再向右拖 170 px（到 54 px），松手后吸附回最近的原位，所以 0 秒与 6.4 秒画面相同。卡片下方的标题沿同一段弧排列。
  const AG_N = 7, AG_W = 92, AG_H = 116, AG_SP = 116, AG_R = 560, AG_Y = 92;
  const AG_COLS = [['#FF9A62', '#FF5F6D'], ['#7F7FD5', '#86A8E7'], ['#43E97B', '#38F9D7'], ['#F7971E', '#FFD200'], ['#C471F5', '#FA71CD'], ['#30CFD0', '#330867'], ['#F857A6', '#FF5858']];
  const AG_NAMES = ['Dunes', 'Harbor', 'Fern', 'Amber', 'Bloom', 'Tide', 'Ember'];
  // 拖动段：[按下, 松手, 光标起点 x, 光标终点 x, 吸附目标偏移]
  const AG_DR = [[1.0, 2.2, 420, 250, -AG_SP], [3.4, 4.4, 160, 330, 0]];
  const AG_KF = [[0.4, 540, 200], [0.95, 420, 96], [1.0, 420, 96], [2.2, 250, 96], [2.5, 300, 196], [3.0, 160, 150], [3.4, 160, 96], [4.4, 330, 96], [5.0, 560, 190]];
  const AG_off = u => {
    let o = 0;
    for (const [a, b, x0, x1, tgt] of AG_DR) {
      if (u < a) break;
      if (u < b) return o + (path(AG_KF, u)[0] - x0);
      const rel = o + (x1 - x0);
      o = tgt + (rel - tgt) * Math.exp(-5 * (u - b));
    }
    return o;
  };
  const AG_pt = (s, t) => { const f = s / AG_R; return [270 + (AG_R + t) * Math.sin(f), AG_Y + AG_R - (AG_R + t) * Math.cos(f), f]; };
  CELLS[26] = (k, w, h, u) => {
    k.fillStyle = '#0F1016'; k.fillRect(0, 0, CW, CH);
    const off = AG_off(u), span = AG_N * AG_SP;
    for (let i = 0; i < AG_N; i++) {
      // 循环位置：相对中心的弧长落在 [−span/2, span/2)
      let s = i * AG_SP - 3 * AG_SP + off;
      s = ((s + span / 2) % span + span) % span - span / 2;
      if (Math.abs(s) > 330) continue;
      // 卡片轮廓：上下边沿弧各采样 9 点
      k.beginPath();
      for (let j = 0; j <= 8; j++) { const [x, y] = AG_pt(s - AG_W / 2 + AG_W * j / 8, AG_H / 2); j ? k.lineTo(x, y) : k.moveTo(x, y); }
      for (let j = 8; j >= 0; j--) { const [x, y] = AG_pt(s - AG_W / 2 + AG_W * j / 8, -AG_H / 2); k.lineTo(x, y); }
      k.closePath();
      const [px, py, f] = AG_pt(s, 0), [c1, c2] = AG_COLS[i];
      const g = k.createLinearGradient(px + 60 * Math.sin(f), py - 60 * Math.cos(f), px - 60 * Math.sin(f), py + 60 * Math.cos(f));
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      k.fillStyle = g; k.fill();
      // 越靠两边越暗
      k.fillStyle = `rgba(15,16,22,${clamp(Math.abs(s) / 320) * 0.55})`; k.fill();
      // 卡上的"太阳"
      const [sx, sy] = AG_pt(s + 18, 26);
      k.fillStyle = 'rgba(255,255,255,0.55)'; k.beginPath(); k.arc(sx, sy, 9, 0, TAU); k.fill();
      // 标题：沿弧放在卡片下方
      const [tx, ty, tf] = AG_pt(s, -AG_H / 2 - 16);
      k.save(); k.translate(tx, ty); k.rotate(tf);
      txt(k, AG_NAMES[i], 0, 0, `700 12px ${SANS}`, `rgba(235,236,245,${1 - clamp(Math.abs(s) / 340) * 0.6})`, 'center', 'middle');
      k.restore();
    }
    const [cx, cy] = path(AG_KF, u);
    const held = AG_DR.some(([a, b]) => u > a && u < b);
    if (u > AG_KF[0][0] && u < AG_KF[AG_KF.length - 1][0]) cursor(k, cx, cy, held ? 1 : 0, true);
  };

  // @element 28
  // 28 流动菜单：4 行大号菜单项。光标进入某一行时，一条浅色色带从光标进入的那一侧（上或下）滑入盖住该行，
  // 色带里是该项名称与小圆点循环向左滚动的跑马灯（每秒 70 px）；光标离开时色带朝离开的方向滑出（0.35 秒）。
  // 光标 0.5 秒从上方进入，依次向下经过 4 行，再向上回到第 3 行（色带从下方进入），4.8 秒从右侧离开。
  // 进出时刻和方向在加载时按 1/120 秒步长从光标路径推算一次。
  const FM_N = 4, FM_T = 18, FM_RH = 44, FM_DUR = 0.35, FM_SPD = 70;
  const FM_ITEMS = ['Mojave', 'Sonoma', 'Monterey', 'Big Sur'];
  const FM_DOTS = ['#FF6B3D', '#3D7BFF', '#22B07D', '#B04DFF'];
  const FM_KF = [[0.5, 300, -14], [1.0, 300, 36], [1.6, 312, 54], [2.2, 300, 84], [2.8, 290, 104], [3.3, 284, 128], [3.8, 280, 160], [4.3, 276, 116], [4.8, 560, 112]];
  const FM_row = y => { const r = Math.floor((y - FM_T) / FM_RH); return r >= 0 && r < FM_N ? r : -1; };
  // 每一行的悬停区间：[进入时刻, 进入方向(−1 从上方/+1 从下方), 离开时刻, 离开方向(−1 向上/+1 向下)]
  const FM_SPANS = (() => {
    const out = [...Array(FM_N)].map(() => []);
    let prev = -1, py = -99, cur = null;
    for (let n = 0; n <= CYC * 120; n++) {
      const t = n / 120, [x, y] = path(FM_KF, t), r = x > 509 ? -1 : FM_row(y);
      if (r !== prev) {
        const down = y >= py;
        if (cur) { cur[2] = t; cur[3] = down ? 1 : -1; out[prev].push(cur); cur = null; }
        if (r >= 0) cur = [t, down ? -1 : 1, 99, 0];
        prev = r;
      }
      py = y;
    }
    if (cur) out[prev].push(cur);
    return out;
  })();
  CELLS[27] = (k, w, h, u) => {
    k.fillStyle = '#101114'; k.fillRect(0, 0, CW, CH);
    k.strokeStyle = '#2A2C33'; k.lineWidth = 1;
    for (let r = 0; r <= FM_N; r++) { const y = FM_T + r * FM_RH + 0.5; k.beginPath(); k.moveTo(30, y); k.lineTo(509, y); k.stroke(); }
    for (let r = 0; r < FM_N; r++) {
      const y0 = FM_T + r * FM_RH, yc = y0 + FM_RH / 2;
      txt(k, FM_ITEMS[r], 270, yc + 1, `800 24px ${SANS}`, '#ECEDEF', 'center', 'middle');
      // 色带位置：0 = 盖住本行；−1/+1 = 完全在上方/下方
      let pos = 0, vis = false;
      for (const [a, da, b, db] of FM_SPANS[r]) {
        if (u < a) continue;
        if (u < b) { pos = da * (1 - out3(seg(u, a, a + FM_DUR))); vis = true; }
        else if (u < b + FM_DUR) { pos = db * out3(seg(u, b, b + FM_DUR)); vis = true; }
      }
      if (!vis) continue;
      k.save();
      k.beginPath(); k.rect(30, y0, 479, FM_RH); k.clip();
      const by = y0 + pos * FM_RH;
      k.fillStyle = '#F2E9D8'; k.fillRect(30, by, 479, FM_RH);
      k.beginPath(); k.rect(30, by, 479, FM_RH); k.clip();
      // 跑马灯：名称 + 圆点重复排列，整体向左滚动
      k.font = `800 22px ${SANS}`;
      const unit = k.measureText(FM_ITEMS[r]).width + 46;
      for (let x = 30 - ((u * FM_SPD) % unit); x < 509; x += unit) {
        txt(k, FM_ITEMS[r], x, by + FM_RH / 2 + 1, `800 22px ${SANS}`, '#141414', 'left', 'middle');
        k.fillStyle = FM_DOTS[r]; k.beginPath(); k.arc(x + unit - 23, by + FM_RH / 2, 8, 0, TAU); k.fill();
      }
      k.restore();
    }
    const [cx, cy] = path(FM_KF, u);
    if (u > FM_KF[0][0] && u < FM_KF[FM_KF.length - 1][0]) cursor(k, cx, cy, 0, true);
  };

  // @element 29
  // 29 引线撤销：0.62 秒光标点文件行的删除键，文件行向右滑出，底部出现深色提示条，
  // 提示条里撤销按钮的胶囊外缘是一根引线：从上边中点起顺时针燃烧，4 秒烧完（烧过的部分变成灰色虚线，燃点有火星）。
  // 3.82 秒光标点撤销：引线熄灭冒一小团烟，提示条下沉消失，文件行滑回原位；末态与 0 秒相同。
  const FB_ROW = [120, 40, 300, 52], FB_PILL = [330, 138, 78, 26];
  const FB_DEL = 0.62, FB_UNDO = 3.82, FB_BURN0 = 1.2, FB_BURN = 4.0;
  const FB_KF = [[0.1, 560, 190], [FB_DEL, 392, 66], [1.4, 392, 72], [3.6, 369, 152], [FB_UNDO, 369, 152], [4.8, 560, 200]];
  const FB_R = 13, FB_SL = FB_PILL[2] - 2 * FB_R, FB_LEN = 2 * FB_SL + TAU * FB_R;
  // 胶囊外缘上弧长 s 处的点（s = 0 为上边中点，顺时针）
  function FB_pt(s) {
    const [x, y, w, h] = FB_PILL, r = FB_R, cxL = x + r, cxR = x + w - r, cy = y + h / 2;
    s = (((s + FB_SL / 2) % FB_LEN) + FB_LEN) % FB_LEN;
    if (s < FB_SL) return [cxL + s, y];
    s -= FB_SL; if (s < Math.PI * r) { const a = -Math.PI / 2 + s / r; return [cxR + r * Math.cos(a), cy + r * Math.sin(a)]; }
    s -= Math.PI * r; if (s < FB_SL) return [cxR - s, y + h];
    s -= FB_SL; const a = Math.PI / 2 + s / r; return [cxL + r * Math.cos(a), cy + r * Math.sin(a)];
  }
  function FB_stroke(k, s0, s1) {
    if (s1 - s0 < 0.5) return;
    k.beginPath();
    for (let s = s0; ; s += 1.5) { const [x, y] = FB_pt(Math.min(s, s1)); s === s0 ? k.moveTo(x, y) : k.lineTo(x, y); if (s >= s1) break; }
    k.stroke();
  }
  CELLS[28] = (k, w, h, u) => {
    k.fillStyle = '#F2EFE9'; k.fillRect(0, 0, CW, CH);
    // 文件行：删除后滑出，撤销后滑回
    const gone = inOut3(seg(u, FB_DEL + 0.05, FB_DEL + 0.4)) * (1 - out3(seg(u, FB_UNDO + 0.2, FB_UNDO + 0.6)));
    const [rx, ry, rw, rh] = FB_ROW;
    k.save(); k.globalAlpha = 1 - gone; k.translate(gone * 60, 0);
    rr(k, rx, ry, rw, rh, 12); k.fillStyle = '#FFFFFF'; k.fill(); k.strokeStyle = '#E0DBD2'; k.lineWidth = 1; k.stroke();
    rr(k, rx + 14, ry + 12, 22, 28, 4); k.fillStyle = '#E8604C'; k.fill();
    txt(k, 'PDF', rx + 25, ry + 30, `800 7px ${SANS}`, '#FFFFFF', 'center');
    txt(k, 'Q3-report.pdf', rx + 48, ry + 23, `600 14px ${SANS}`, '#24232A');
    txt(k, '2.4 MB · edited today', rx + 48, ry + 40, `12px ${SANS}`, '#8C8880');
    const hov = presence(u, FB_DEL - 0.25, FB_DEL - 0.05, FB_DEL + 0.3, FB_DEL + 0.45);
    k.fillStyle = `rgba(232,96,76,${0.1 + 0.12 * hov})`; k.beginPath(); k.arc(392, 66, 15, 0, TAU); k.fill();
    k.strokeStyle = '#E8604C'; k.lineWidth = 1.6; k.lineCap = 'round'; k.lineJoin = 'round';
    k.beginPath(); k.moveTo(386, 60); k.lineTo(398, 60); k.moveTo(390, 60); k.lineTo(390, 57.5); k.lineTo(394, 57.5); k.lineTo(394, 60); k.stroke();
    rr(k, 387.5, 62, 9, 11, 2); k.stroke();
    k.restore();
    // 提示条
    const vis = out3(seg(u, FB_DEL + 0.25, FB_DEL + 0.55)) * (1 - inOut3(seg(u, FB_UNDO + 0.15, FB_UNDO + 0.45)));
    const f = seg(Math.min(u, FB_UNDO), FB_BURN0, FB_BURN0 + FB_BURN), sb = f * FB_LEN;
    if (vis > 0) {
      k.save(); k.globalAlpha = vis; k.translate(0, (1 - vis) * 20);
      rr(k, 120, 130, 300, 42, 21); k.fillStyle = '#1E1D22'; k.fill();
      txt(k, 'File moved to Trash', 144, 151, `600 13px ${SANS}`, '#F4F2EE', 'left', 'middle');
      const uh = presence(u, 3.4, 3.6, FB_UNDO + 0.1, FB_UNDO + 0.2);
      rr(k, ...FB_PILL, FB_R); k.fillStyle = rgb(lerpC([46, 44, 51], [66, 63, 72], uh)); k.fill();
      txt(k, 'Undo', 369, 151.5, `700 13px ${SANS}`, '#FFFFFF', 'center', 'middle');
      // 烧过的部分：灰色虚线
      k.lineCap = 'round';
      k.strokeStyle = '#5A5660'; k.lineWidth = 2; k.setLineDash([2, 3]); FB_stroke(k, 0, sb); k.setLineDash([]);
      // 未烧部分：宽的半透明线叠细亮线
      k.strokeStyle = 'rgba(255,138,61,0.25)'; k.lineWidth = 6; FB_stroke(k, sb, FB_LEN);
      k.strokeStyle = '#FFB547'; k.lineWidth = 2.5; FB_stroke(k, sb, FB_LEN);
      if (u > FB_BURN0 && u < FB_UNDO) {
        const [px, py] = FB_pt(sb), fr = Math.floor(u * 20) * 31;
        k.fillStyle = 'rgba(255,138,61,0.35)'; k.beginPath(); k.arc(px, py, 6, 0, TAU); k.fill();
        k.fillStyle = '#FFF3C4'; k.beginPath(); k.arc(px, py, 2.5, 0, TAU); k.fill();
        k.strokeStyle = '#FFD36B'; k.lineWidth = 1.2;
        for (let i = 0; i < 7; i++) {
          const a = hash(i * 13 + fr) * TAU, l0 = 3 + 2 * hash(i * 5 + fr), l = l0 + 6 * hash(i * 7 + fr + 1);
          k.beginPath(); k.moveTo(px + Math.cos(a) * l0, py + Math.sin(a) * l0); k.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); k.stroke();
        }
      }
      k.restore();
    }
    // 熄灭的烟
    const st = (u - FB_UNDO) / 0.7;
    if (st > 0 && st < 1) {
      const [px, py] = FB_pt(sb);
      for (let i = 0; i < 3; i++) {
        k.fillStyle = `rgba(150,146,156,${0.4 * (1 - st)})`;
        k.beginPath(); k.arc(px + (i - 1) * 4 * st, py - st * 30 - i * 5, 3 + st * 9 - i, 0, TAU); k.fill();
      }
    }
    if (u < 4.8) {
      const [cx, cy] = path(FB_KF, u);
      const pr = Math.max(presence(u, FB_DEL - 0.06, FB_DEL, FB_DEL + 0.06, FB_DEL + 0.14), presence(u, FB_UNDO - 0.06, FB_UNDO, FB_UNDO + 0.06, FB_UNDO + 0.14));
      ripple(k, 392, 66, seg(u, FB_DEL, FB_DEL + 0.5), '232,96,76');
      ripple(k, 369, 151, seg(u, FB_UNDO, FB_UNDO + 0.5), '255,181,71');
      cursor(k, cx, cy, pr);
    }
  };

  // @element 30
  // 30 晃动液位计：圆角玻璃罐里的液体追着目标值走（目标 20% → 0.6 秒 55% → 2.0 秒 85% → 3.2 秒 100%）。
  // 液位按弹簧 x'' = 40(目标 − x) − 9x' 追赶（1/120 秒步长从 0 积分），液面倾斜角与液位速度成正比，上面叠两层小波；
  // 到 100% 时撞顶溅起 8 颗水珠并按抛物线落下；5.4–6.0 秒液位回到 20%。
  const SG_X = 210, SG_Y = 26, SG_W = 120, SG_H = 160, SG_STEPS = [[0, 20], [0.6, 55], [2.0, 85], [3.2, 100], [SHOW, 20]];
  const SG_SIM = (() => {               // 每 1/120 秒一帧：[液位 %, 速度 %/s]
    const out = []; let x = 20, v = 0;
    for (let n = 0; n <= CYC * 120; n++) {
      const t = n / 120; let g = 20;
      for (const [a, b] of SG_STEPS) if (t >= a) g = b;
      out.push([x, v]);
      const acc = 40 * (g - x) - 9 * v; v += acc / 120; x += v / 120;
      if (x > 100) { x = 100; v = Math.min(v, 0) - Math.max(v, 0) * 0.2; }
    }
    return out;
  })();
  const SG_W1 = TAU * 5 / CYC, SG_W2 = TAU * 3 / CYC;   // 波的角频率取周期的整数倍，0 秒与 6.4 秒相位一致
  const SG_HIT = (() => { for (let n = 0; n < SG_SIM.length; n++) if (SG_SIM[n][0] >= 99.5) return n / 120; return 99; })();
  CELLS[29] = (k, w, h, u) => {
    k.fillStyle = '#0F1720'; k.fillRect(0, 0, CW, CH);
    // 6.0–6.4 秒把弹簧余振收到正好 20%，与 0 秒一致
    const [lv0, vel0] = SG_SIM[Math.min(SG_SIM.length - 1, Math.round(u * 120))];
    const settle = inOut3(seg(u, 6.0, 6.35)), lv = mix(lv0, 20, settle), vel = vel0 * (1 - settle);
    const tilt = clamp(vel / 260, -0.35, 0.35);           // 液面左右高差（相对罐宽）
    for (let i = 0; i <= 4; i++) {
      const y = SG_Y + SG_H - SG_H * i / 4;
      k.fillStyle = '#3A4756'; k.fillRect(SG_X - 16, y - 0.5, 8, 1);
      txt(k, `${i * 25}`, SG_X - 22, y, `11px ${MONO}`, '#6B7A8C', 'right', 'middle');
    }
    // 液体（剪裁到罐内）：后层浅色、前层深色，两层波相位错开
    k.save(); rr(k, SG_X, SG_Y, SG_W, SG_H, 18); k.clip();
    k.fillStyle = '#162433'; k.fillRect(SG_X, SG_Y, SG_W, SG_H);
    const surf = x => {
      const f = (x - SG_X) / SG_W - 0.5;
      return SG_Y + SG_H * (1 - lv / 100) + f * tilt * SG_W
        + Math.sin(x * 0.09 + u * SG_W1) * 2 * (0.4 + Math.abs(tilt) * 3) + Math.sin(x * 0.05 - u * SG_W2) * 1.5;
    };
    for (const [off, col] of [[-4, 'rgba(56,189,248,0.35)'], [0, '#2BA6E8']]) {
      k.beginPath(); k.moveTo(SG_X, SG_Y + SG_H);
      for (let x = SG_X; x <= SG_X + SG_W; x += 3) k.lineTo(x, surf(x + off * 3) + off);
      k.lineTo(SG_X + SG_W, SG_Y + SG_H); k.closePath(); k.fillStyle = col; k.fill();
    }
    k.restore();
    rr(k, SG_X, SG_Y, SG_W, SG_H, 18); k.strokeStyle = '#8FA3B8'; k.lineWidth = 2; k.stroke();
    k.strokeStyle = 'rgba(255,255,255,0.18)'; k.lineWidth = 4; k.lineCap = 'round';
    k.beginPath(); k.moveTo(SG_X + 14, SG_Y + 24); k.lineTo(SG_X + 14, SG_Y + 70); k.stroke();
    // 撞顶溅起的水珠
    const st = u - SG_HIT;
    if (st > 0 && st < 1.0) {
      for (let i = 0; i < 8; i++) {
        const vx = (hash(i * 3 + 5) - 0.5) * 160, vy = -120 - 90 * hash(i * 3 + 6);
        const x = SG_X + SG_W * (0.2 + 0.6 * hash(i * 3 + 7)) + vx * st, y = SG_Y + 4 + vy * st + 420 * st * st;
        if (y > SG_Y + 6 && st > 0.15) continue;
        k.fillStyle = `rgba(56,189,248,${0.9 * (1 - st)})`; k.beginPath(); k.arc(x, y, 2.5 + hash(i) * 1.5, 0, TAU); k.fill();
      }
    }
    txt(k, `${Math.round(clamp(lv, 0, 100))}%`, 360, 98, `800 34px ${SANS}`, lv >= 99.5 ? '#5EEAD4' : '#E6EDF5', 'left', 'middle');
    txt(k, 'STORAGE', 362, 128, `600 11px ${MONO}`, '#6B7A8C', 'left', 'middle');
  };

  // @element 31
  // 31 工具调用芯片：AI 回答里的工具调用小芯片。填充条随计时从左到右推进，右侧显示秒数，左侧图标转圈；
  // 第 1 次调用 search_docs 0.3–2.3 秒填满后变绿、出现对勾；第 2 次调用 run_query 2.9 秒开始，4.1 秒在 62% 处失败：
  // 填充变红、芯片左右抖动（e^(−6τ)·sin(40τ)·6 px）、出现叉号；5.4–6.0 秒两枚芯片淡出。
  const CC_W = 236, CC_H = 34, CC_X = 152;
  const CC_CALLS = [
    { y: 58, name: 'search_docs', a: 0.3, b: 2.3, ok: true },
    { y: 122, name: 'run_query', a: 2.9, b: 4.1, ok: false, at: 0.62 },
  ];
  CELLS[30] = (k, w, h, u) => {
    k.fillStyle = '#FBFAF7'; k.fillRect(0, 0, CW, CH);
    const fade = fadeIn(u);
    txt(k, 'Assistant', CC_X, 32, `700 12px ${SANS}`, `rgba(140,138,132,${fade})`, 'left', 'middle');
    for (const c of CC_CALLS) {
      const show = out3(seg(u, c.a - 0.25, c.a)) * fade;
      if (show <= 0) continue;
      const done = u >= c.b, fr = seg(u, c.a, c.b) * (c.ok ? 1 : c.at);
      const res = seg(u, c.b, c.b + 0.25), te = u - c.b;
      const shake = !c.ok && te > 0 ? Math.exp(-6 * te) * Math.sin(40 * te) * 6 : 0;
      const col = done ? (c.ok ? [34, 160, 100] : [220, 70, 60]) : [90, 110, 230];
      k.save(); k.globalAlpha = show; k.translate(CC_X + shake, c.y + (1 - show) * 8);
      rr(k, 0, 0, CC_W, CC_H, CC_H / 2); k.fillStyle = '#FFFFFF'; k.fill();
      k.strokeStyle = rgb(lerpC([222, 219, 212], col, done ? res : 0)); k.lineWidth = 1.2; k.stroke();
      k.save(); rr(k, 0, 0, CC_W, CC_H, CC_H / 2); k.clip();
      k.fillStyle = `rgba(${col.join(',')},${done ? 0.16 : 0.12})`; k.fillRect(0, 0, CC_W * fr, CC_H);
      k.fillStyle = `rgba(${col.join(',')},0.8)`; k.fillRect(0, CC_H - 3, CC_W * fr, 3);
      k.restore();
      // 左侧图标：运行中转圈，结束后对勾或叉号
      const ix = 18, iy = CC_H / 2;
      k.lineWidth = 2; k.lineCap = 'round';
      if (!done) {
        k.strokeStyle = 'rgba(90,110,230,0.25)'; k.beginPath(); k.arc(ix, iy, 7, 0, TAU); k.stroke();
        k.strokeStyle = '#5A6EE6'; k.beginPath(); k.arc(ix, iy, 7, u * 7, u * 7 + 1.8); k.stroke();
      } else {
        k.fillStyle = rgb(col); k.beginPath(); k.arc(ix, iy, 8 * out3(res) + 0.01, 0, TAU); k.fill();
        k.strokeStyle = '#FFFFFF'; k.beginPath();
        if (c.ok) { k.moveTo(ix - 3.5, iy); k.lineTo(ix - 1, iy + 3); k.lineTo(ix + 4, iy - 3); }
        else { k.moveTo(ix - 3, iy - 3); k.lineTo(ix + 3, iy + 3); k.moveTo(ix + 3, iy - 3); k.lineTo(ix - 3, iy + 3); }
        k.globalAlpha = show * res; k.stroke(); k.globalAlpha = show;
      }
      txt(k, c.name, 34, iy + 0.5, `600 13px ${MONO}`, '#2A2A30', 'left', 'middle');
      const secs = (Math.min(u, c.b) - c.a).toFixed(1);
      const tag = done ? (c.ok ? `done · ${secs}s` : 'failed') : `${secs}s`;
      txt(k, tag, CC_W - 14, iy + 0.5, `12px ${MONO}`, done ? rgb(col) : '#8C8A84', 'right', 'middle');
      k.restore();
    }
  };

  // @element 32
  // 32 模糊显字：标题按词、副标题按字母，从模糊、偏上、透明的状态逐个变清晰落位。
  // 模糊用多份错位叠印来模拟（不用 filter / shadowBlur，放大查看时也能等比缩放）：1 + 6 + 10 份字形分布在半径 r 的圆盘里，
  // 每份透明度 α = 1 − (1 − a)^(1/17)，r 收到 0 时 17 份正好叠成一份透明度为 a 的字。
  // 标题 5 个词从 0.3 秒起每隔 0.14 秒出现一个，每个用 0.8 秒从 r = 10、上移 14 px 变清晰；
  // 副标题从 1.5 秒起每个字母隔 0.03 秒，每个用 0.6 秒从 r = 6、上移 8 px 变清晰；5.4–6.0 秒全部重新变模糊淡出，接回 0 秒。
  const BT_WORDS = ['Ship', 'faster', 'with', 'less', 'noise.'], BT_SUB = 'Blur text reveals one word at a time';
  const BT_TAPS = (() => {
    const t = [[0, 0]];
    for (let i = 0; i < 6; i++) t.push([0.5 * Math.cos(i * TAU / 6), 0.5 * Math.sin(i * TAU / 6)]);
    for (let i = 0; i < 10; i++) t.push([Math.cos((i + 0.5) * TAU / 10), Math.sin((i + 0.5) * TAU / 10)]);
    return t;
  })();
  function BT_draw(k, s, x, y, r, a) {
    if (a <= 0.002) return;
    if (r < 0.1) { k.globalAlpha = a; k.fillText(s, x, y); k.globalAlpha = 1; return; }
    k.globalAlpha = 1 - Math.pow(1 - Math.min(a, 0.999), 1 / BT_TAPS.length);
    for (const [dx, dy] of BT_TAPS) k.fillText(s, x + dx * r, y + dy * r);
    k.globalAlpha = 1;
  }
  CELLS[31] = (k, w, h, u) => {
    k.fillStyle = '#0F1016'; k.fillRect(0, 0, CW, CH);
    const out = resetK(u);
    // 标题：按词
    k.font = `800 36px ${SANS}`; k.textAlign = 'left'; k.textBaseline = 'alphabetic';
    const sp = k.measureText(' ').width, ws = BT_WORDS.map(s => k.measureText(s).width);
    let x = (CW - ws.reduce((a, b) => a + b, 0) - sp * (BT_WORDS.length - 1)) / 2;
    BT_WORDS.forEach((s, i) => {
      const p = out3(seg(u, 0.3 + 0.14 * i, 1.1 + 0.14 * i));
      k.fillStyle = i >= 3 ? '#8B9CFF' : '#F4F2EC';
      BT_draw(k, s, x, 102 - 14 * (1 - p), 10 * (1 - p) + 10 * out, p * (1 - out));
      x += ws[i] + sp;
    });
    // 副标题：按字母
    k.font = `500 16px ${SANS}`; k.fillStyle = '#8C8FA3';
    const total = k.measureText(BT_SUB).width, x0 = (CW - total) / 2;
    for (let j = 0; j < BT_SUB.length; j++) {
      const ch = BT_SUB[j]; if (ch === ' ') continue;
      const p = out3(seg(u, 1.5 + 0.03 * j, 2.1 + 0.03 * j));
      BT_draw(k, ch, x0 + k.measureText(BT_SUB.slice(0, j)).width, 140 - 8 * (1 - p), 6 * (1 - p) + 6 * out, p * (1 - out));
    }
  };

  // @element 33
  // 33 毛糙抖动字：大字按 2 px 高的横条切开，每条各自左右错开，像信号不稳的屏幕。
  // 每秒换 24 次随机偏移（hash(行号, 帧号)），偏移幅度 = 平时 1.5 px，光标停在字上时升到 12 px；
  // 字整体不做红绿蓝分色。光标 0.6 秒入场，1.4–3.6 秒停在字上（幅度 0.25 秒升满、0.35 秒回落），5.0 秒前离开。
  const FZ_ROW = 2, FZ_TOP = 58, FZ_H = 76, FZ_IDLE = 1.5, FZ_HOT = 12, FZ_FPS = 24;
  const FZ_KF = [[0.6, 520, 196], [1.4, 300, 104], [3.6, 330, 108], [4.6, 540, 200]];
  CELLS[32] = (k, w, h, u) => {
    k.fillStyle = '#F3F0E8'; k.fillRect(0, 0, CW, CH);
    const heat = inOut3(seg(u, 1.4, 1.65)) * (1 - inOut3(seg(u, 3.6, 3.95)));
    const amp = mix(FZ_IDLE, FZ_HOT, heat), frame = Math.floor(u * FZ_FPS);
    k.font = `900 84px ${SANS}`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillStyle = '#1B1A20';
    for (let r = 0; r * FZ_ROW < FZ_H; r++) {
      const y = FZ_TOP + r * FZ_ROW;
      const n = hash(r * 7.31 + frame * 131.7) - 0.5, n2 = hash(r * 3.17 + frame * 57.3) - 0.5;
      const dx = amp * (2 * n) * (0.6 + 0.4 * Math.abs(2 * n2));
      k.save(); k.beginPath(); k.rect(0, y, CW, FZ_ROW + 0.5); k.clip();
      k.fillText('FUZZY', CW / 2 + dx, FZ_TOP + FZ_H / 2 + 4);
      k.restore();
    }
    txt(k, heat > 0.5 ? 'hovering — noise ×8' : 'hover to shake the signal', CW / 2, 168, `500 14px ${MONO}`, '#8A8577', 'center', 'middle');
    const [cx, cy] = path(FZ_KF, u);
    if (u > 0.6 && u < 4.6) cursor(k, cx, cy, 0, false);
  };

  // @element 34
  // 34 折纸展开字：一张便签上的 3 行字像折过的纸一样，一折一折往下展开。
  // 每行是一条 40 px 高的纸带，挂在上一条的下沿；纸带绕上沿翻折，角度 θ 从 90° 落到 0°，可见高度 = 40·cos θ，
  // 奇数折向里（变暗 0.32·sin θ），偶数折向外（变亮 0.5·sin θ），折痕处画一条细线。
  // 标题条 0.3 秒落下（0.5 秒），第 1–3 行从 0.8 秒起每隔 0.45 秒展开一条（每条 0.6 秒，out3 缓动）；
  // 5.4–6.0 秒从最后一行往上依次折回，只剩标题条缩回 0，接回 0 秒。
  const FT_X = 150, FT_W = 240, FT_TOP = 18, FT_BAND = 40, FT_HEAD = 36;
  const FT_LINES = ['Fold the plan', 'into three lines', 'and open it slowly.'];
  CELLS[33] = (k, w, h, u) => {
    k.fillStyle = '#2B3A4A'; k.fillRect(0, 0, CW, CH);
    const back = seg(u, SHOW, SHOW + 0.6);                 // 折回进度
    const open = i => {                                    // i = 0 标题，1–3 正文
      const a = i === 0 ? out3(seg(u, 0.3, 0.8)) : out3(seg(u, 0.8 + 0.45 * (i - 1), 1.4 + 0.45 * (i - 1)));
      const b = inOut3(seg(back, (3 - i) * 0.22, (3 - i) * 0.22 + 0.34));
      return a * (1 - b);
    };
    let y = FT_TOP;
    // 投影：跟着纸的总高度
    const heights = [0, 1, 2, 3].map(i => (i === 0 ? FT_HEAD : FT_BAND) * Math.sin(open(i) * Math.PI / 2));
    const total = heights.reduce((a, b) => a + b, 0);
    if (total > 0.5) { k.fillStyle = 'rgba(0,0,0,0.22)'; rr(k, FT_X + 4, FT_TOP + 6, FT_W, total, 6); k.fill(); }
    for (let i = 0; i < 4; i++) {
      const p = open(i), th = (1 - p) * Math.PI / 2, bh = i === 0 ? FT_HEAD : FT_BAND, vis = bh * Math.cos(th);
      if (vis < 0.3) break;
      k.save(); k.translate(0, y); k.scale(1, Math.cos(th));
      k.beginPath(); k.rect(FT_X, 0, FT_W, bh); k.clip();
      k.fillStyle = i === 0 ? '#F2C14E' : '#FBF7EE'; k.fillRect(FT_X, 0, FT_W, bh);
      if (i === 0) txt(k, 'NOTE', FT_X + 16, bh / 2 + 1, `800 14px ${MONO}`, '#5B4310', 'left', 'middle');
      else txt(k, FT_LINES[i - 1], FT_X + 16, bh / 2 + 1, `700 19px ${SANS}`, '#24303C', 'left', 'middle');
      const sh = Math.sin(th);
      k.fillStyle = i % 2 ? `rgba(30,40,55,${0.32 * sh})` : `rgba(255,255,255,${0.5 * sh})`; k.fillRect(FT_X, 0, FT_W, bh);
      k.restore();
      if (i > 0) { k.fillStyle = `rgba(40,50,60,${0.10 + 0.25 * Math.sin(th)})`; k.fillRect(FT_X, y, FT_W, 1); }
      y += vis;
    }
  };

  // @element 35
  // 35 滚速流动字：两行大字跑马灯方向相反、平时匀速流动（一个周期流过一组文字 570 px，约每秒 89 px）。页面滚动速度 v 叠加到流速上（每 1 px/s 滚动加 0.3 px/s），
  // 并让字按 v 横向倾斜（最大 0.3）；向上滚时两行同时反向。模拟滚动：1.0–1.8 秒向下快滚、3.0–3.8 秒向上快滚（峰值 1500 px/s，
  // sin² 形速度曲线，上下滚动距离相等，右侧滚动条回到原位）。位移在加载时按 1/120 秒步长积分；
  // 上下滚动的加速抵消，整周期位移正好 570 px；积分误差再按步均摊修正到 570 的整数倍，循环无缝。
  const SV_SLOT = 190, SV_U = 3 * SV_SLOT, SV_WORDS = ['SCROLL', 'VELOCITY', 'MARQUEE'], SV_GAIN = 0.3;
  const SV_BASE = SV_U / CYC;        // 基础流速：一个周期正好流过一组文字（约 89 px/s）
  const SV_v = t => {               // 页面滚动速度 px/s（正 = 向下）
    if (t > 1.0 && t < 1.8) return 1500 * Math.sin(Math.PI * (t - 1.0) / 0.8) ** 2;
    if (t > 3.0 && t < 3.8) return -1500 * Math.sin(Math.PI * (t - 3.0) / 0.8) ** 2;
    return 0;
  };
  const SV_TAB = (() => {           // 每 1/120 秒：[跑马灯位移, 页面滚动位置]
    const n = Math.round(CYC * 120), raw = [[0, 0]];
    let d = 0, y = 0;
    for (let i = 0; i < n; i++) { const v = SV_v(i / 120); d += (SV_BASE + SV_GAIN * v) / 120; y += v / 120; raw.push([d, y]); }
    const fix = (Math.round(d / SV_U) * SV_U - d) / n;          // 每步修正量，让总位移落在 570 的整数倍
    return raw.map(([dd, yy], i) => [dd + fix * i, yy]);
  })();
  CELLS[34] = (k, w, h, u) => {
    k.fillStyle = '#121016'; k.fillRect(0, 0, CW, CH);
    const i = Math.min(SV_TAB.length - 1, Math.round(u * 120)), [d, py] = SV_TAB[i], v = SV_v(u);
    const skew = 0.3 * clamp(v / 1500, -1, 1);
    for (const [row, dir, y, fg, bg] of [[0, -1, 64, '#F4EFE6', '#1C1A22'], [1, 1, 138, '#FF7A45', '#18161D']]) {
      k.fillStyle = bg; k.fillRect(0, y - 30, CW, 60);
      k.save(); k.beginPath(); k.rect(0, y - 30, 518, 60); k.clip();
      k.transform(1, 0, -skew * dir, 1, skew * dir * y, 0);
      // 一组 3 个词按实测字宽排开，剩余宽度均分成 3 个间隙，圆点放在间隙正中；一组总宽固定 570 px
      k.font = `900 30px ${SANS}`;
      const words = [0, 1, 2].map(j => SV_WORDS[(j + row) % 3]), ws = words.map(s => k.measureText(s).width);
      const gap = (SV_U - ws[0] - ws[1] - ws[2]) / 3;
      const off = ((dir * d) % SV_U + SV_U) % SV_U;
      for (let base = off - SV_U; base < CW; base += SV_U) {
        let x = base;
        for (let j = 0; j < 3; j++) {
          txt(k, words[j], x, y + 1, `900 30px ${SANS}`, fg, 'left', 'middle');
          k.fillStyle = fg; k.beginPath(); k.arc(x + ws[j] + gap / 2, y, 4, 0, TAU); k.fill();
          x += ws[j] + gap;
        }
      }
      k.restore();
    }
    // 滚动条与速度读数
    k.fillStyle = '#2A2732'; rr(k, 526, 12, 5, 184, 2.5); k.fill();
    k.fillStyle = Math.abs(v) > 50 ? '#FF7A45' : '#6F6A7A'; rr(k, 526, 20 + py * 0.16, 5, 40, 2.5); k.fill();
    const mult = (SV_BASE + SV_GAIN * v) / SV_BASE;            // 负值 = 跑马灯反向
    txt(k, `${v >= 0 ? '↓' : '↑'} ×${mult.toFixed(1)}`, 512, 194, `600 12px ${MONO}`, '#8E889A', 'right', 'middle');
  };

  // @shared
  // （本包目前没有跨元素共用的代码）
  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});
