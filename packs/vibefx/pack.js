/* Motion Prompt · pack "vibefx" · MIT License (c) 2026 ai-martin-lau · https://github.com/ai-martin-lau/vibe-fx */
MotionPrompt.pack('vibefx', function () {
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

  // @element 01
  // 天平倾斜：5 枚金币依次落进右盘，横梁每多一枚就多倾斜一点，最后带阻尼回摆停稳
  CELLS[0] = (k, w, h, u) => {
    bg(k);
    const R = resetK(u), PX = 270, PY = 56, HALF = 150, N = 5;
    // 每枚金币落定后横梁再斜 0.05 rad，带阻尼过冲 1 − e^(−4t)·cos(10t)，落定瞬间角度连续
    let tilt = 0;
    for (let i = 0; i < N; i++) {
      const t = u - (0.6 + 0.45 * i + 0.35);
      if (t > 0) tilt += 0.05 * (1 - Math.exp(-4 * t) * Math.cos(10 * t));
    }
    const ang = tilt * (1 - R);
    // 立柱与底座
    k.fillStyle = '#3A3D48'; k.fillRect(PX - 4, PY, 8, 132); rr(k, PX - 46, 186, 92, 10, 4); k.fill();
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const ends = [[PX - HALF * ca, PY - HALF * sa], [PX + HALF * ca, PY + HALF * sa]];
    // 横梁
    k.strokeStyle = INK; k.lineWidth = 5; k.lineCap = 'round';
    k.beginPath(); k.moveTo(ends[0][0], ends[0][1]); k.lineTo(ends[1][0], ends[1][1]); k.stroke();
    k.fillStyle = GOLD; k.beginPath(); k.arc(PX, PY, 7, 0, TAU); k.fill();
    // 托盘（不随横梁旋转）
    ends.forEach(([ex, ey], s) => {
      const py = ey + 58;
      k.strokeStyle = DIM; k.lineWidth = 1.5;
      k.beginPath(); k.moveTo(ex, ey); k.lineTo(ex - 44, py); k.moveTo(ex, ey); k.lineTo(ex + 44, py); k.stroke();
      k.fillStyle = '#2A2D36'; k.strokeStyle = INK; k.lineWidth = 2;
      k.beginPath(); k.ellipse(ex, py, 52, 8, 0, 0, TAU); k.fill(); k.stroke();
      txt(k, s ? 'B' : 'A', ex, py + 26, 22, DIM, 'center', 700);
      if (!s) return;
      // 金币：落下 0.35 秒（加速），落定后每层 6 px
      k.globalAlpha = 1 - R;
      for (let i = 0; i < N; i++) {
        const t0 = 0.6 + 0.45 * i, q = seg(u, t0, t0 + 0.35);
        if (u < t0) continue;
        const ty = py - 5 - 6 * i, y = mix(-12, ty, q * q);
        k.fillStyle = GOLD_D; k.beginPath(); k.ellipse(ex, y + 3, 22, 6, 0, 0, TAU); k.fill();
        k.fillStyle = GOLD; k.beginPath(); k.ellipse(ex, y, 22, 6, 0, 0, TAU); k.fill();
      }
      k.globalAlpha = 1;
    });
  };

  // @element 02
  // 牛顿摆：左端金球撞下，右端灰球被弹起，来回 5 次；底部一行说明文字
  CELLS[1] = (k, w, h, u) => {
    bg(k);
    const N = 5, R = 16, GAP = 34, PY = 30, L = 120, x0 = 270 - GAP * 2;
    // 负半周左端金球摆出，正半周右端球摆出；先动的是金球
    const a = -Math.sin(u * TAU * 5 / SHOW) * (u < SHOW ? 1 : 0);
    // 顶杆
    k.strokeStyle = '#3A3D48'; k.lineWidth = 6; k.lineCap = 'round';
    k.beginPath(); k.moveTo(x0 - 40, PY); k.lineTo(x0 + GAP * 4 + 40, PY); k.stroke();
    for (let i = 0; i < N; i++) {
      let th = 0;
      if (i === 0 && a < 0) th = 0.6 * a;
      if (i === N - 1 && a > 0) th = 0.6 * a;
      const px = x0 + GAP * i, bx = px + Math.sin(th) * L, by = PY + Math.cos(th) * L;
      k.strokeStyle = DIM; k.lineWidth = 1.5;
      k.beginPath(); k.moveTo(px, PY); k.lineTo(bx, by); k.stroke();
      k.fillStyle = i === 0 ? GOLD : '#9AA0AC';
      k.beginPath(); k.arc(bx, by, R, 0, TAU); k.fill();
      k.fillStyle = 'rgba(255,255,255,0.35)';
      k.beginPath(); k.arc(bx - 5, by - 5, 4, 0, TAU); k.fill();
    }
    txt(k, '一个动作，连锁反应', 270, 186, 16, DIM, 'center', 500);
  };

  // @element 03
  // 硬币堆高：5 列金币从左到右依次加高（4、7、10、13、16 枚），像柱状图一样长起来
  CELLS[2] = (k, w, h, u) => {
    bg(k);
    const F = fadeIn(u), BASE = 184, STEP = 9;
    k.strokeStyle = '#3A3D48'; k.lineWidth = 2;
    k.beginPath(); k.moveTo(50, BASE + 10); k.lineTo(490, BASE + 10); k.stroke();
    k.globalAlpha = F;
    for (let c = 0; c < 5; c++) {
      const x = 110 + 80 * c, max = 4 + 3 * c, p = seg(u, 0.3 + 0.3 * c, 3.6) * max;
      const n = Math.floor(p + 1e-9), frac = p - n;
      const total = Math.min(max, n + (frac > 0 ? 1 : 0));
      for (let i = 0; i < total; i++) {
        let y = BASE - STEP * i;
        if (i === n) y -= 20 * (1 - out3(clamp(frac / 0.4)));
        k.fillStyle = GOLD_D; k.beginPath(); k.ellipse(x, y + 4, 30, 8, 0, 0, TAU); k.fill();
        k.fillStyle = GOLD; k.beginPath(); k.ellipse(x, y, 30, 8, 0, 0, TAU); k.fill();
        if (i === total - 1) {
          k.strokeStyle = 'rgba(255,255,255,0.6)'; k.lineWidth = 2;
          k.beginPath(); k.ellipse(x, y, 20, 4, 0, Math.PI * 1.1, Math.PI * 1.6); k.stroke();
        }
      }
    }
    k.globalAlpha = 1;
  };

  // @element 04
  // 复利曲线：每期 +10%、共 40 期的增长曲线从坐标原点画出，先平后陡，亮点沿线走，最后标出「×45」
  CELLS[3] = (k, w, h, u) => {
    bg(k);
    const F = fadeIn(u), OX = 40, OY = 184, W = 460, H = 150, G = Math.pow(1.1, 40);
    const f = x => (Math.pow(1.1, 40 * x) - 1) / (G - 1);
    k.strokeStyle = '#3A3D48'; k.lineWidth = 2;
    k.beginPath(); k.moveTo(OX, OY - H - 10); k.lineTo(OX, OY); k.lineTo(OX + W + 10, OY); k.stroke();
    k.globalAlpha = F;
    const p = inOut3(seg(u, 0.3, 3.6)), n = 80;
    if (p > 0) {
      k.save(); k.strokeStyle = GOLD; k.lineWidth = 3; k.lineJoin = 'round'; k.shadowColor = GOLD; k.shadowBlur = 8;
      k.beginPath();
      for (let i = 0; i <= n; i++) { const x = p * i / n; const X = OX + W * x, Y = OY - H * f(x); if (i) k.lineTo(X, Y); else k.moveTo(X, Y); }
      k.stroke(); k.restore();
      const X = OX + W * p, Y = OY - H * f(p);
      k.fillStyle = '#FFFFFF'; k.beginPath(); k.arc(X, Y, 5, 0, TAU); k.fill();
    }
    const L = seg(u, 3.6, 4.0);
    if (L > 0) { k.globalAlpha = F * L; txt(k, '×45', OX + W - 8, OY - H + 6, 30, GOLD, 'right', 800); }
    k.globalAlpha = 1;
  };

  // @element 05
  // 年份时间轴：1930–2020 的年份沿横线滑过，靠近中线的年份放大成金色，最后停在 2020
  CELLS[4] = (k, w, h, u) => {
    bg(k);
    const Y = 120, SP = 120, CX = 270;
    // 5.4–5.7 秒淡出，隐去时跳回 1930，5.8–6.1 秒淡入
    const hide = u >= 5.75;
    const off = hide ? 0 : -9 * SP * inOut3(seg(u, 0.3, 4.6));
    const A = hide ? seg(u, 5.8, 6.1) : 1 - seg(u, 5.4, 5.7);
    k.strokeStyle = '#3A3D48'; k.lineWidth = 2;
    k.beginPath(); k.moveTo(0, Y + 30); k.lineTo(CW, Y + 30); k.stroke();
    for (let i = 0; i < 10; i++) {
      const x = CX + i * SP + off, d = Math.abs(x - CX);
      if (x < -80 || x > CW + 80) continue;
      // 离中线 120 px 以内逐渐放大并渐变为金色：g 从 0 到 1，没有跳变
      const g = inOut3(clamp(1 - d / 120)), s = String(1930 + 10 * i);
      const r = mix(3, 5, g), size = mix(22, 44, g), ty = mix(Y, Y - 4, g);
      k.globalAlpha = A; k.fillStyle = DIM; k.beginPath(); k.arc(x, Y + 30, r, 0, TAU); k.fill();
      k.globalAlpha = A * g; k.fillStyle = GOLD; k.beginPath(); k.arc(x, Y + 30, r, 0, TAU); k.fill();
      k.globalAlpha = A * Math.max(0.2, 1 - d / 240) * (1 - g); txt(k, s, x, ty, size, INK, 'center', 700);
      k.globalAlpha = A * g; txt(k, s, x, ty, size, GOLD, 'center', 700);
      k.globalAlpha = 1;
    }
    k.fillStyle = GOLD;
    k.beginPath(); k.moveTo(CX - 8, 186); k.lineTo(CX + 8, 186); k.lineTo(CX, 174); k.closePath(); k.fill();
  };

  // @element 06
  // 知识树：从底部根节点「主题」向上长出 3 个分支和 6 个末梢，节点逐层弹出，整棵树轻轻浮动
  CELLS[5] = (k, w, h, u) => {
    bg(k);
    const F = fadeIn(u), bob = 2 * Math.sin(u * TAU / CYC * 2);
    const L1 = ['概念', '方法', '案例'], X1 = [110, 270, 430];
    const nodes = [{ x: 270, y: 180, d: 0, label: '主题', p: -1 }];
    X1.forEach((x, i) => nodes.push({ x, y: 110, d: 1, label: L1[i], p: 0 }));
    X1.forEach((x, i) => { nodes.push({ x: x - 40, y: 40, d: 2, p: 1 + i }); nodes.push({ x: x + 40, y: 40, d: 2, p: 1 + i }); });
    k.globalAlpha = F;
    const T0 = d => 0.3 + 0.9 * d;
    nodes.forEach(nd => {
      if (nd.p < 0) return;
      const pa = nodes[nd.p];
      glowLine(k, pa.x, pa.y + bob, nd.x, nd.y + bob, seg(u, T0(nd.d) - 0.5, T0(nd.d)), nd.d === 1 ? GOLD : GOLD_D, nd.d === 1 ? 3 : 2);
    });
    nodes.forEach(nd => {
      const s = spring(u - T0(nd.d));
      if (s <= 0) return;
      const y = nd.y + bob;
      if (nd.label) {
        const bw = nd.d ? 64 : 76, bh = nd.d ? 30 : 34;
        k.save(); k.translate(nd.x, y); k.scale(s, s);
        rr(k, -bw / 2, -bh / 2, bw, bh, 8); k.fillStyle = nd.d ? '#22252E' : GOLD; k.fill();
        k.strokeStyle = GOLD; k.lineWidth = 1.5; k.stroke();
        txt(k, nd.label, 0, 1, nd.d ? 15 : 16, nd.d ? INK : BG, 'center', 700);
        k.restore();
      } else {
        k.fillStyle = GOLD; k.beginPath(); k.arc(nd.x, y, 7 * s, 0, TAU); k.fill();
      }
    });
    k.globalAlpha = 1;
  };

  // @element 07
  // 决策树：一个问题分成两个选项、再分成四个结果，逐层弹出；随后一条路径亮成金色，终点套上圆环
  CELLS[6] = (k, w, h, u) => {
    bg(k);
    const F = fadeIn(u);
    const T = [['要不要继续？'], ['继续', '止损'], ['越陷越深', '侥幸回本', '损失封顶', '重新出发']];
    const YS = [36, 104, 172], FS = [16, 15, 13], BW = [140, 92, 104];
    const xs = d => T[d].map((_, i) => (CW / T[d].length) * (i + 0.5));
    const path = [0, 1, 3]; // 止损 → 重新出发
    const hi = seg(u, 2.6, 3.0);
    k.globalAlpha = F;
    for (let d = 1; d < 3; d++) {
      const X = xs(d), PX = xs(d - 1), t = seg(u, 0.2 + 0.6 * d - 0.4, 0.2 + 0.6 * d);
      X.forEach((x, i) => {
        const p = Math.floor(i / 2), on = path[d] === i && path[d - 1] === p;
        k.save(); k.globalAlpha = F * (on ? 1 : mix(1, 0.5, hi));
        glowLine(k, PX[p], YS[d - 1] + 14, x, YS[d] - 14, t, DIM, 2);
        // 选中路径：金线按 hi 叠上去，颜色渐变不跳
        if (on && hi > 0) { k.globalAlpha = F * hi; glowLine(k, PX[p], YS[d - 1] + 14, x, YS[d] - 14, t, GOLD, 3); }
        k.restore();
      });
    }
    for (let d = 0; d < 3; d++) {
      const X = xs(d), s = spring(u - (0.2 + 0.6 * d));
      if (s <= 0) continue;
      X.forEach((x, i) => {
        const on = path[d] === i, a = on ? 1 : mix(1, 0.5, hi);
        k.save(); k.globalAlpha = F * a; k.translate(x, YS[d]); k.scale(s, s);
        // 底牌始终不透明（遮住穿过的连线），选中时金色底牌与深色字按 g 交叉淡入
        const g = on ? hi : 0;
        rr(k, -BW[d] / 2, -14, BW[d], 28, 7);
        k.fillStyle = '#22252E'; k.fill();
        k.strokeStyle = '#4A4E5A'; k.lineWidth = 1.5; k.stroke();
        if (g > 0) { k.globalAlpha = F * a * g; k.fillStyle = GOLD; k.fill(); k.strokeStyle = GOLD; k.stroke(); }
        k.globalAlpha = F * a * (1 - g); txt(k, T[d][i], 0, 1, FS[d], INK, 'center', 700);
        if (g > 0) { k.globalAlpha = F * a * g; txt(k, T[d][i], 0, 1, FS[d], BG, 'center', 700); }
        k.restore();
      });
    }
    // 终点圆环减速长出，不过冲（右缘距卡片边 9 px）
    const ring = out3(seg(u, 3.0, 3.35));
    if (ring > 0) {
      const x = xs(2)[3];
      k.save(); k.globalAlpha = F; k.strokeStyle = GOLD; k.lineWidth = 2; k.shadowColor = GOLD; k.shadowBlur = 8;
      k.beginPath(); k.ellipse(x, YS[2], 58 * ring, 21 * ring, 0, 0, TAU); k.stroke(); k.restore();
    }
    k.globalAlpha = 1;
  };

  // @element 08
  // 放射脑图：中心「想法」向四周依次伸出 6 个分支，节点弹出后整圈缓慢旋转，背景有 3 圈淡金色椭圆
  CELLS[7] = (k, w, h, u) => {
    bg(k);
    const F = fadeIn(u), CX = 270, CY = 104, RX = 170, RY = 72;
    const LB = ['写作', '视频', '设计', '播客', '咨询', '编程'];
    const rot = 0.12 * u * (1 - resetK(u));
    // 背景椭圆常驻，不参与淡出，循环接缝处没有跳变
    k.strokeStyle = 'rgba(232,176,74,0.12)'; k.lineWidth = 1;
    for (let r = 1; r <= 3; r++) { k.beginPath(); k.ellipse(CX, CY, RX * r / 3 + 12, RY * r / 3 + 6, 0, 0, TAU); k.stroke(); }
    k.globalAlpha = F;
    LB.forEach((s, i) => {
      const t0 = 0.4 + 0.25 * i, a = i / 6 * TAU - Math.PI / 2 + rot;
      const ln = clamp(spring(u - t0), 0, 1.15);
      if (ln <= 0) return;
      const x = CX + Math.cos(a) * RX * ln, y = CY + Math.sin(a) * RY * ln;
      k.save(); k.strokeStyle = GOLD_D; k.lineWidth = 2; k.shadowColor = GOLD; k.shadowBlur = 4;
      k.beginPath(); k.moveTo(CX, CY); k.lineTo(x, y); k.stroke(); k.restore();
      k.fillStyle = GOLD; k.beginPath(); k.arc(x, y, 7, 0, TAU); k.fill();
      // 标签中心沿分支方向外推「12 px + 半个字宽」，旋转时连续移动，不会因对齐方式切换而跳动
      k.font = `600 15px ${SANS}`;
      const c = Math.cos(a), tw = k.measureText(s).width;
      // 分支弹出过冲时，底部标签不超出卡片下沿
      const lx = x + c * (12 + tw / 2), ly = Math.min(CH - 12, y + Math.sin(a) * 16);
      k.globalAlpha = F * clamp((u - t0) / 0.3);
      txt(k, s, lx, ly, 15, INK, 'center', 600);
      k.globalAlpha = F;
    });
    const s = spring(u - 0.1);
    if (s > 0) {
      k.save(); k.translate(CX, CY); k.scale(s, s);
      k.fillStyle = GOLD; k.shadowColor = GOLD; k.shadowBlur = 12;
      k.beginPath(); k.arc(0, 0, 26, 0, TAU); k.fill(); k.shadowBlur = 0;
      txt(k, '想法', 0, 1, 15, BG, 'center', 800);
      k.restore();
    }
    k.globalAlpha = 1;
  };

  // @element 09
  // 词语堆叠：4 张彩色字卡从大到小砸下来，一张压一张地往上叠，每砸一张下面的卡片被压低一下再弹回
  CELLS[8] = (k, w, h, u) => {
    bg(k);
    const F = fadeIn(u), WORDS = ['计划', '执行', '复盘', '迭代'];
    const COLS = ['#B3261E', '#B8601A', '#3A6EA5', '#444A55'], CWD = 200, CHT = 40;
    const t0 = i => 0.4 + 0.7 * i;
    k.globalAlpha = F;
    for (let i = 0; i < 4; i++) {
      const q = seg(u, t0(i), t0(i) + 0.18);
      if (u < t0(i)) continue;
      // 上方每张卡落定时，本卡被压低 2 px，0.1 秒后回弹
      let press = 0;
      for (let j = i + 1; j < 4; j++) {
        const d = u - (t0(j) + 0.18);
        if (d >= 0 && d < 0.2) press += 2 * Math.sin(Math.PI * d / 0.2);
      }
      const sc = mix(1.6, 1, out3(q)), y = 170 - 44 * i + press, rot = (i % 2 ? -0.05 : 0.05);
      k.save(); k.globalAlpha = F * clamp(q * 1.5); k.translate(270, y); k.rotate(rot); k.scale(sc, sc);
      k.shadowColor = 'rgba(0,0,0,0.45)'; k.shadowBlur = 10; k.shadowOffsetY = 4;
      rr(k, -CWD / 2, -CHT / 2, CWD, CHT, 6); k.fillStyle = COLS[i]; k.fill();
      k.shadowColor = 'transparent';
      txt(k, WORDS[i], 0, 1, 24, '#FFFFFF', 'center', 800);
      k.restore();
    }
    k.globalAlpha = 1;
  };

  // @shared
  // （本包目前没有跨元素共用的代码）
  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});
