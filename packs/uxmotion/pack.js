/* Motion Prompt · pack "uxmotion" · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/ */
MotionPrompt.pack('uxmotion', function () {
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

  // @element 01
  // 01 词立方翻滚：关键词贴在 3D 方块的 4 个面上（面高 72、半深 36、透视 520），每 1.6 秒向下翻一面（0.9 秒，cubic-bezier(.5,-.25,.3,1.3) 两端回弹）；
  // 翻转时旧正面变暗到 brightness .55、新正面变亮，下方说明同步上下翻页（.7 秒弹簧、透明度 .4 秒），底部进度条 1.6 秒线性填满；4 次翻转正好转满一圈回到首词
  const CUBE_WORDS = ['规划', '设计', '开发', '运营'];
  const CUBE_DESC = ['把问题拆开，排好先后顺序', '画出让人想伸手去点的界面', '又快又稳地把它做出来', '上线之后也一直陪着你'];
  const CUBE_STEP = 1.6, CUBE_ROLL = 0.9;              // 原作每 2.6 秒自动前进；为让 6.4 秒内 4 个词各出现一次改为 1.6 秒
  const CUBE_roll = UXA_bz(.5, -.25, .3, 1.3);
  CELLS[0] = (k, w, h, u) => {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    card(k, 10, 10, CW - 20, CH - 20, 22);
    txt(k, '我们做什么', 30, 38, `700 12px ${SANS}`, UX.ink3);
    // n：当前段的目标面；每段开头 0.9 秒翻转，其余时间停住
    const n = Math.floor(u / CUBE_STEP), fr = u - n * CUBE_STEP;
    const e = CUBE_roll(clamp(fr / CUBE_ROLL)), lit = inOut3(clamp(fr / CUBE_ROLL));
    const idx = n % 4, prev = (n + 3) % 4, ang = (n - 1 + e) * 90;
    const X0 = 30, X1 = 462, FW = X1 - X0, FH = 72, R = 36, cx = (X0 + X1) / 2, cy = 88, P = 520;
    const faces = [];
    for (let i = 0; i < 4; i++) {
      // 第 i 面的转角 φ：φ=-90° 在顶上，0° 正对，90° 转到底下
      const ph = ((((ang - 90 * i) % 360) + 540) % 360 - 180) * Math.PI / 180, c = Math.cos(ph), s = Math.sin(ph);
      if (c > 0.02) faces.push({ i, c, s });
    }
    faces.sort((a, b) => a.c - b.c);
    for (const f of faces) {
      // 面的上下边在 yz 平面的位置 → 透视投影（整体 translateZ(-36px)）
      const zT = R * f.c + R * f.s - R, zB = R * f.c - R * f.s - R;
      const sT = P / (P - zT), sB = P / (P - zB);
      const yT = cy + (R * f.s - R * f.c) * sT, yB = cy + (R * f.s + R * f.c) * sB;
      const hh = yB - yT;
      if (hh < 0.5) continue;
      k.save(); k.translate(cx, (yT + yB) / 2); k.scale((sT + sB) / 2, hh / FH);
      const odd = f.i % 2 === 1;
      k.fillStyle = odd ? UX.accent : UX.ink; rr(k, -FW / 2, -FH / 2, FW, FH, 16); k.fill();
      k.letterSpacing = '-2px';
      txt(k, CUBE_WORDS[f.i], -FW / 2 + 18, 2, `800 42px ${SANS}`, odd ? '#FFFFFF' : UX.page, 'left', 'middle');
      k.letterSpacing = '0px';
      const on = f.i === idx ? lit : f.i === prev ? 1 - lit : 0;
      if (on < 1) { k.fillStyle = `rgba(0,0,0,${0.45 * (1 - on)})`; rr(k, -FW / 2, -FH / 2, FW, FH, 16); k.fill(); }
      k.restore();
    }
    // 上/下箭头按钮（36×33、圆角 11）
    k.lineWidth = 2.2; k.lineCap = 'round'; k.lineJoin = 'round';
    for (let j = 0; j < 2; j++) {
      const by = j ? 91 : 52, mx = 492, my = by + 16.5;
      k.fillStyle = UX.surface2; rr(k, 474, by, 36, 33, 11); k.fill();
      k.strokeStyle = UX.ink; k.beginPath();
      if (j) { k.moveTo(mx - 4.5, my - 2.2); k.lineTo(mx, my + 2.3); k.lineTo(mx + 4.5, my - 2.2); }
      else { k.moveTo(mx - 4.5, my + 2.2); k.lineTo(mx, my - 2.3); k.lineTo(mx + 4.5, my + 2.2); }
      k.stroke();
    }
    // 说明文字：旧行上移淡出、新行从下方弹入
    const q = UXA_spring(clamp(fr / 0.7)), op = clamp(fr / 0.4), F = `600 16px ${SANS}`;
    k.save(); k.beginPath(); k.rect(30, 134, 470, 26); k.clip();
    if (op < 1) { k.globalAlpha = 1 - op; txt(k, CUBE_DESC[prev], 30, 153 - 26 * q, F, UX.ink2); }
    k.globalAlpha = op; txt(k, CUBE_DESC[idx], 30, 153 + 26 * (1 - q), F, UX.ink2);
    k.restore();
    // 圆点（当前点放大 1.3 倍、.4 秒弹簧）与进度条
    const dq = UXA_spring(clamp(fr / 0.4)), dc = clamp(fr / 0.3);
    for (let i = 0; i < 4; i++) {
      let sc = 1, t = 0;
      if (i === idx) { sc = 1 + 0.3 * dq; t = dc; } else if (i === prev) { sc = 1.3 - 0.3 * dq; t = 1 - dc; }
      k.fillStyle = rgba(lerpC([215, 215, 216], [22, 21, 27], t), 1);
      k.beginPath(); k.arc(43 + i * 32, 178, 4 * sc, 0, TAU); k.fill();
    }
    k.fillStyle = UX.line; rr(k, 162, 176.5, 347, 3, 1.5); k.fill();
    k.fillStyle = UX.accent; rr(k, 162, 176.5, 347 * (fr / CUBE_STEP), 3, 1.5); k.fill();
  };

  // @element 02
  // 02 环形文字徽章：等宽字沿圆周排布匀速旋转（18°/s）；指针 1.2 秒移入后目标转速 150°/s（每帧逼近 6%），1.8/3.0/4.2 秒三次点击各 +120°/s，
  // 新文字从 120ms 起每字间隔 22ms 逐个淡入（.25 秒），中心按钮按下回弹（.6 秒，30% 处缩到 .78）；4.6 秒移出后按每帧 2.5% 惯性减速；三次点击后文字轮换回第一段
  const BADGE_TEXTS = ['SCROLL TO EXPLORE • SCROLL TO EXPLORE • ', 'OPEN FOR PROJECTS • 2026 • OPEN • ', 'MADE WITH CARE • LUCIANLABS • '];
  const BADGE_CLICKS = [1.8, 3.0, 4.2];
  const BADGE_CX = 112, BADGE_CY = 104, BADGE_R = 84;  // 原作直径 218，这里半径 84（缩放 .77）
  const BADGE_KF = [[0, 590, 240], [0.6, 590, 240], [1.2, 132, 122], [1.8, 126, 116], [3.0, 120, 122], [4.2, 130, 114], [4.6, 134, 120], [5.2, 590, 240]];
  const BADGE_path = u => UXA_path(BADGE_KF, u);
  // 一次性模拟整周期转速与转角（120 步/秒，原作每帧系数换算到连续时间）；复位段把转速平滑拉回 18°/s，总转角缩放到 360° 整数倍保证无缝
  const BADGE_SIM = (() => {
    const N = 768, dt = CYC / N, V = new Float32Array(N + 1), A = new Float32Array(N + 1);
    let vel = 18, ang = 0, ci = 0, tin = -1, tout = -1, was = false;
    for (let j = 0; j <= N; j++) {
      const t = j * dt;
      if (j > 0) {
        const [x, y] = BADGE_path(t), hov = Math.hypot(x - BADGE_CX, y - BADGE_CY) < BADGE_R;
        if (hov && !was) tin = t; if (!hov && was) tout = t; was = hov;
        const target = hov ? 150 : 18, kk = target > vel ? 0.06 : 0.025;
        vel += (target - vel) * (1 - Math.pow(1 - kk, dt * 60));
        while (ci < BADGE_CLICKS.length && BADGE_CLICKS[ci] <= t) { vel += 120; ci++; }
      }
      const ve = mix(vel, 18, resetK(t));
      if (j > 0) ang += ve * dt;
      V[j] = ve; A[j] = ang;
    }
    const f = Math.max(1, Math.round(A[N] / 360)) * 360 / A[N];
    for (let j = 0; j <= N; j++) A[j] *= f;
    return { V, A, N, tin, tout };
  })();
  const BADGE_at = (arr, u) => { const N = BADGE_SIM.N, x = clamp(u / CYC) * N, i = Math.min(N - 1, Math.floor(x)); return arr[i] + (arr[i + 1] - arr[i]) * (x - i); };
  CELLS[1] = (k, w, h, u) => {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    card(k, 10, 10, CW - 20, CH - 20, 22);
    const S = BADGE_SIM, cx = BADGE_CX, cy = BADGE_CY, R = BADGE_R;
    // 徽章底：外圈 surface2、内 40% 为 surface，细描边
    k.fillStyle = UX.surface2; k.beginPath(); k.arc(cx, cy, R, 0, TAU); k.fill();
    k.fillStyle = UX.surface; k.beginPath(); k.arc(cx, cy, R * 0.566, 0, TAU); k.fill();
    k.strokeStyle = UX.line; k.lineWidth = 1; k.beginPath(); k.arc(cx, cy, R - 0.5, 0, TAU); k.stroke();
    // 当前文字与点击时间
    let nc = 0; for (const t of BADGE_CLICKS) if (u >= t) nc++;
    const tc = nc ? BADGE_CLICKS[nc - 1] : -9, str = BADGE_TEXTS[nc % 3];
    const rot = BADGE_at(S.A, u) * Math.PI / 180, rT = 86 * R / 109, span = 532 / 540.4 * TAU, N = str.length;
    k.font = `800 12px ${MONO}`; k.fillStyle = UX.ink; k.textAlign = 'center'; k.textBaseline = 'alphabetic';
    for (let i = 0; i < N; i++) {
      const op = nc ? clamp((u - tc - 0.12 - i * 0.022) / 0.25) : 1;
      if (op <= 0 || str[i] === ' ') continue;
      const th = Math.PI + (i + 0.5) * span / N + rot;
      k.save(); k.globalAlpha = op; k.translate(cx + Math.cos(th) * rT, cy + Math.sin(th) * rT); k.rotate(th + Math.PI / 2);
      k.fillText(str[i], 0, 0); k.restore();
    }
    // 中心按钮：悬停放大 1.06（.5 秒弹簧）、箭头从 -45° 转正（.6 秒）；点击时 .6 秒内 30% 处缩到 .78
    const [px, py] = BADGE_path(u), hov = Math.hypot(px - cx, py - cy) < R;
    const hp = hov ? UXA_spring(clamp((u - S.tin) / 0.5)) : 1 - UXA_spring(clamp((u - S.tout) / 0.5));
    const ap = hov ? UXA_spring(clamp((u - S.tin) / 0.6)) : 1 - UXA_spring(clamp((u - S.tout) / 0.6));
    let sc = 1 + 0.06 * hp;
    const pt = (u - tc) / 0.6;
    if (pt >= 0 && pt < 1) sc = pt < 0.3 ? mix(sc, 0.78, UXA_spring(pt / 0.3)) : mix(0.78, sc, UXA_spring((pt - 0.3) / 0.7));
    const cr = 39 * R / 109;
    k.save(); k.translate(cx, cy); k.scale(sc, sc);
    k.fillStyle = UX.ink; k.beginPath(); k.arc(0, 0, cr, 0, TAU); k.fill();
    k.rotate((-45 + 45 * ap) * Math.PI / 180); k.scale(23 / 24, 23 / 24); k.translate(-12, -12);
    k.strokeStyle = UX.page; k.lineWidth = 2.2; k.lineCap = 'round'; k.lineJoin = 'round';
    k.beginPath(); k.moveTo(5, 12); k.lineTo(19, 12); k.moveTo(13, 6); k.lineTo(19, 12); k.lineTo(13, 18); k.stroke();
    k.restore();
    // 右侧：转速读数（每 120ms 刷新）与近 3 秒转速曲线
    txt(k, '每按一次换一段文字', 236, 40, `700 12px ${SANS}`, UX.ink3);
    txt(k, '转速', 236, 78, `700 12px ${SANS}`, UX.ink3);
    txt(k, `${Math.round(BADGE_at(S.V, Math.floor(u / 0.12) * 0.12))}°/s`, 268, 80, `700 24px ${MONO}`, UX.ink);
    txt(k, '近 3 秒', 509, 78, `600 10px ${SANS}`, UX.ink3, 'right');
    const GX = 236, GW = 273, GY = 176, GH = 80;
    k.strokeStyle = UX.line; k.lineWidth = 1;
    for (let j = 0; j <= 3; j++) { const y = Math.round(GY - j * GH / 3) + 0.5; k.beginPath(); k.moveTo(GX, y); k.lineTo(GX + GW, y); k.stroke(); }
    k.beginPath();
    for (let j = 0; j <= 90; j++) {
      const tt = (((u - 3 + j * 3 / 90) % CYC) + CYC) % CYC, v = BADGE_at(S.V, tt), x = GX + j / 90 * GW, y = GY - Math.min(1, v / 300) * GH;
      j ? k.lineTo(x, y) : k.moveTo(x, y);
    }
    k.strokeStyle = UX.accent; k.lineWidth = 2; k.stroke();
    k.lineTo(GX + GW, GY); k.lineTo(GX, GY); k.closePath(); k.fillStyle = UX.accentSoft; k.fill();
    // 模拟指针
    let press = 0; for (const t of BADGE_CLICKS) press = Math.max(press, pingPong(u, t - 0.1, t, t + 0.02, t + 0.14));
    for (const t of BADGE_CLICKS) ripple(k, BADGE_path(t)[0], BADGE_path(t)[1], (u - t) / 0.5);
    cursor(k, px, py, press);
  };

  // @element 03
  // 03 字母飞散重组：PLAYFUL 七个字母各有色相（oklch .62 .2，色相 20+48i），1.0 秒点「飞散」：每个字母以 7–14 像素/帧随机方向弹出、自转 ±15°/帧，
  // 受重力 .05、阻尼 .985，撞墙反弹 .8/.75，悬停 1.3 秒（每字再晚 70ms）后按弹簧 .06/阻尼 .8 归位；3.4 秒点字再飞一次，4.5 秒点「归位」立即收回
  const SCAT_WORD = 'PLAYFUL';
  const SCAT_EV = [[1.0, 1], [3.4, 1], [4.5, 0]];       // 1 = 飞散，0 = 归位
  const SCAT_KF = [[0, 590, 240], [0.3, 590, 240], [0.9, 140, 182], [1.0, 140, 182], [2.9, 282, 96], [3.4, 270, 92], [4.0, 392, 182], [4.5, 392, 182], [5.3, 590, 240]];
  const SCAT_path = u => UXA_path(SCAT_KF, u);
  // oklch → sRGB（与原作 color-mix 85% 色相色 + 15% 墨色一致的近似）
  const SCAT_oklch = (L, C, hd) => {
    const hr = hd * Math.PI / 180, a = C * Math.cos(hr), b = C * Math.sin(hr);
    const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3), m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3), s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
    const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
    return lin.map(v => { v = clamp(v); return Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)); });
  };
  const SCAT_COL = Array.from(SCAT_WORD, (_, i) => rgba(lerpC(SCAT_oklch(0.62, 0.2, 20 + i * 48), [22, 21, 27], 0.15), 1));
  const SCAT_TOP = 46, SCAT_FLOOR = 160, SCAT_FONT = `900 64px ${SANS}`;
  let SCAT_SIM = null;   // 惰性常量：首帧量字宽后按原作逐帧常数一次性模拟 384 帧（60 帧/秒）
  const SCAT_build = k => {
    k.font = SCAT_FONT;
    const ws = Array.from(SCAT_WORD, ch => k.measureText(ch).width);
    const tot = ws.reduce((a, b) => a + b, 0) + 2 * (ws.length - 1), bx = [];
    let x0 = (CW - tot) / 2;
    ws.forEach(w => { bx.push(x0); x0 += w + 2; });
    const F = 384, X = new Float32Array((F + 1) * 21);
    const L = ws.map(() => ({ x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0, free: -1 }));
    let ev = 0;
    for (let f = 0; f <= F; f++) {
      const t = f / 60;
      if (f > 0) {
        while (ev < SCAT_EV.length && SCAT_EV[ev][0] <= t) {
          const [t0, type] = SCAT_EV[ev];
          L.forEach((l, i) => {
            if (!type) { l.free = -1; return; }
            const s = ev * 17 + i * 3, a = hash(s + 1) * TAU, sp = 7 + hash(s + 2) * 7;
            l.vx = Math.cos(a) * sp; l.vy = Math.sin(a) * sp - 3; l.vr = (hash(s + 3) - 0.5) * 30; l.free = t0 + 1.3 + i * 0.07;
          });
          ev++;
        }
        L.forEach((l, i) => {
          if (t < l.free) {
            l.vy += 0.05; l.vx *= 0.985; l.vy *= 0.985; l.vr *= 0.98;
            const X0 = bx[i] + l.x, Y0 = SCAT_TOP + l.y;
            if ((X0 < 6 && l.vx < 0) || (X0 + ws[i] > CW - 6 && l.vx > 0)) l.vx *= -0.8;
            if ((Y0 < 6 && l.vy < 0) || (Y0 + 64 > SCAT_FLOOR && l.vy > 0)) l.vy *= -0.75;
          } else {
            l.vx += -l.x * 0.06; l.vy += -l.y * 0.06; l.vr += -l.r * 0.06;
            l.vx *= 0.8; l.vy *= 0.8; l.vr *= 0.8;
          }
          l.x += l.vx; l.y += l.vy; l.r += l.vr;
          if (!(t < l.free || Math.abs(l.x) + Math.abs(l.y) + Math.abs(l.r) > 0.1 || Math.abs(l.vx) + Math.abs(l.vy) > 0.05)) { l.x = l.y = l.r = l.vx = l.vy = l.vr = 0; }
        });
      }
      L.forEach((l, i) => { const o = f * 21 + i * 3; X[o] = l.x; X[o + 1] = l.y; X[o + 2] = l.r; });
    }
    return { ws, bx, X, F };
  };
  CELLS[2] = (k, w, h, u) => {
    k.fillStyle = UX.surface; k.fillRect(0, 0, CW, CH);
    k.drawImage(layer('SCAT_dots', g => {
      g.fillStyle = 'rgba(22,21,27,.1)';
      for (let y = 9; y < CH; y += 18) for (let x = 9; x < CW; x += 18) { g.beginPath(); g.arc(x, y, 1, 0, TAU); g.fill(); }
    }), 0, 0);
    if (!SCAT_SIM) SCAT_SIM = SCAT_build(k);
    const S = SCAT_SIM, fx = clamp(u / CYC) * S.F, f0 = Math.min(S.F - 1, Math.floor(fx)), ft = fx - f0;
    k.font = SCAT_FONT; k.textAlign = 'center'; k.textBaseline = 'middle';
    for (let i = 0; i < S.ws.length; i++) {
      const a = f0 * 21 + i * 3, b = a + 21;
      const x = mix(S.X[a], S.X[b], ft), y = mix(S.X[a + 1], S.X[b + 1], ft), r = mix(S.X[a + 2], S.X[b + 2], ft);
      k.save(); k.translate(S.bx[i] + S.ws[i] / 2 + x, SCAT_TOP + 32 + y); k.rotate(r * Math.PI / 180);
      k.fillStyle = SCAT_COL[i]; k.fillText(SCAT_WORD[i], 0, 3); k.restore();
    }
    // 底部按钮：飞散（墨色）/ 归位（浅灰），按下缩到 .94
    const pr = t => pingPong(u, t - 0.1, t, t + 0.02, t + 0.2);
    [[20, '飞散', UX.ink, UX.page, pr(1.0)], [275, '归位', UX.surface2, UX.ink, pr(4.5)]].forEach(([x, s, bg, fg, p]) => {
      const sc = 1 - 0.06 * p;
      k.save(); k.translate(x + 122, 181); k.scale(sc, sc);
      k.fillStyle = bg; rr(k, -122, -15, 244, 30, 11); k.fill();
      txt(k, s, 0, 1, `700 13px ${SANS}`, fg, 'center', 'middle'); k.restore();
    });
    const [px, py] = SCAT_path(u);
    let press = 0; for (const [t] of SCAT_EV) press = Math.max(press, pr(t));
    for (const [t] of SCAT_EV) ripple(k, SCAT_path(t)[0], SCAT_path(t)[1], (u - t) / 0.5);
    cursor(k, px, py, press);
  };

  // @element 04
  // 04 逐词卡点字幕：0.2 秒指针按下播放，字幕按语速逐词弹出（每词 .30 秒 + 随机 0–.08，重点词前后各多停 .12/.22 秒），
  // 普通词 .35 秒从下 12px、缩放 .6 弹入，重点词 .6 秒先放大到 1.45 倍（转 -3°）再落回并变黄 #FFE066；整句结束后整行上折淡出（.45 秒），下方 26 根声波条随说话起伏
  const CAP_SCRIPT = [['今天', '我们', '只改了', '*一个*', '按钮'], ['结果', '注册量', '*翻了一倍*']];
  const CAP_T0 = 0.25;                                  // 播放开始时刻（原作 WORD .36、GAP 1.0，为装进一个周期改为 .30 / .8，并只保留前两句）
  const CAP_TL = (() => {
    let t = 0.3; const lines = [];
    CAP_SCRIPT.forEach((sent, si) => {
      const start = t;
      const words = sent.map((wd, wi) => {
        const em = wd[0] === '*'; if (em) t += 0.12;
        const at = t; t += 0.30 + (em ? 0.22 : 0) + hash(si * 10 + wi + 5) * 0.08;
        return { text: em ? wd.slice(1, -1) : wd, em, at };
      });
      lines.push({ start, end: t + 0.8 * 0.6, words });
      t += 0.8;
    });
    return { lines, total: t };
  })();
  const CAP_pop = UXA_bz(.3, 1.6, .5, 1), CAP_em = UXA_bz(.3, 1.4, .5, 1), CAP_out = UXA_bz(.6, 0, .3, 1);
  let CAP_W = null;                                    // 惰性常量：每句每词的宽度
  CELLS[3] = (k, w, h, u) => {
    k.fillStyle = UX.surface; k.fillRect(0, 0, CW, CH);
    const F = `900 24px ${SANS}`;
    if (!CAP_W) { k.font = F; CAP_W = CAP_TL.lines.map(l => l.words.map(x => k.measureText(x.text).width)); }
    const pos = u - CAP_T0, playing = pos >= 0 && pos < CAP_TL.total;
    k.drawImage(layer('CAP_scr', g => {
      g.save(); rr(g, 10, 10, 519, 146, 16); g.clip();
      g.fillStyle = '#0B0C12'; g.fillRect(10, 10, 519, 146);
      let gr = g.createRadialGradient(166, 54, 0, 166, 54, 230); gr.addColorStop(0, '#3A2F7A'); gr.addColorStop(1, 'rgba(58,47,122,0)'); g.fillStyle = gr; g.fillRect(10, 10, 519, 146);
      gr = g.createRadialGradient(425, 127, 0, 425, 127, 210); gr.addColorStop(0, '#0E6B63'); gr.addColorStop(1, 'rgba(14,107,99,0)'); g.fillStyle = gr; g.fillRect(10, 10, 519, 146);
      g.restore();
      g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, 22, 22, 84, 20, 10); g.fill();
      txt(g, '设计复盘 · 02', 64, 32.5, `700 11px ${SANS}`, 'rgba(255,255,255,.8)', 'center', 'middle');
    }), 0, 0);
    k.save(); rr(k, 10, 10, 519, 146, 16); k.clip();
    // 说话的人：播放中 .5 秒往返轻微上下点头（-2px、.6°）
    let tk = 0;
    if (playing) { const p = pos / 0.5, fr = p - Math.floor(p); tk = (Math.floor(p) % 2 ? 1 - fr : fr); tk = 0.5 - 0.5 * Math.cos(tk * Math.PI); }
    k.save(); k.translate(270, 126 - 2 * tk); k.rotate(0.6 * tk * Math.PI / 180); k.globalAlpha = 0.9;
    let gp = k.createLinearGradient(0, -47, 0, 47); gp.addColorStop(0, '#5B4FA8'); gp.addColorStop(1, '#2E2867');
    k.fillStyle = gp; k.beginPath(); k.moveTo(-41.5, 47); k.lineTo(-41.5, 0); k.arc(0, 0, 41.5, Math.PI, 0); k.lineTo(41.5, 47); k.closePath(); k.fill();
    gp = k.createLinearGradient(0, -78, 0, -44); gp.addColorStop(0, '#7C6FD0'); gp.addColorStop(1, '#4A3F96');
    k.fillStyle = gp; k.beginPath(); k.arc(0, -61, 17, 0, TAU); k.fill();
    k.restore();
    // 字幕：当前句逐词出现；结束的句子整行上折（rotateX 70°、上移 26px）淡出
    const drawLine = (li, lineAlpha, q) => {
      const L = CAP_TL.lines[li], ws = CAP_W[li], tot = ws.reduce((a, b) => a + b, 0) + 7 * (ws.length - 1);
      let x = 270 - tot / 2;
      k.save();
      if (q > 0) { k.translate(270, 108); k.translate(0, -26 * q); k.scale(1, Math.max(0.02, Math.cos(70 * q * Math.PI / 180))); k.translate(-270, -108); }
      k.font = F; k.textAlign = 'center'; k.textBaseline = 'alphabetic';
      L.words.forEach((wd, i) => {
        const cx = x + ws[i] / 2; x += ws[i] + 7;
        const dt = pos - wd.at; if (dt < 0) return;
        const op = clamp(dt / 0.15) * lineAlpha;
        let sc, ty = 0, rot = 0, col = '#FFFFFF';
        if (wd.em) {
          const p = clamp(dt / 0.6);
          if (p < 0.45) { const e = CAP_em(p / 0.45); sc = mix(0.4, 1.45, e); rot = -3 * e; }
          else { const e = CAP_em((p - 0.45) / 0.55); sc = mix(1.45, 1, e); rot = -3 * (1 - e); col = rgba(lerpC([255, 255, 255], [255, 224, 102], e), 1); }
        } else { const e = CAP_pop(clamp(dt / 0.35)); sc = mix(0.6, 1, e); ty = 12 * (1 - e); }
        k.save(); k.translate(cx, 126 + ty); k.rotate(rot * Math.PI / 180); k.scale(sc, sc);
        k.globalAlpha = op * 0.45; k.fillStyle = '#000'; k.fillText(wd.text, 0, 10);
        k.globalAlpha = op; k.fillStyle = col; k.fillText(wd.text, 0, 8);
        k.restore();
      });
      k.restore();
    };
    CAP_TL.lines.forEach((L, li) => {
      if (pos >= L.start && pos < L.end) drawLine(li, 1, 0);
      else if (pos >= L.end && pos < L.end + 0.45) { const o = pos - L.end; drawLine(li, 1 - clamp(o / 0.35), CAP_out(o / 0.45)); }
    });
    k.restore();
    // 底栏：播放/暂停、声波条（每 90ms 换一组高度，.09 秒线性过渡）、回到开头
    k.fillStyle = UX.ink; k.beginPath(); k.arc(30, 182, 17, 0, TAU); k.fill();
    k.fillStyle = UX.page;
    if (playing) { k.fillRect(24, 175, 4, 14); k.fillRect(32, 175, 4, 14); }
    else { k.beginPath(); k.moveTo(26, 174); k.lineTo(26, 190); k.lineTo(38, 182); k.closePath(); k.fill(); }
    k.fillStyle = UX.surface2; k.beginPath(); k.arc(509, 182, 17, 0, TAU); k.fill();
    k.strokeStyle = UX.ink; k.lineWidth = 1.8; k.lineCap = 'round'; k.lineJoin = 'round';
    k.beginPath(); k.arc(509, 182, 6.5, Math.PI * 1.25, Math.PI * 1.25 + Math.PI * 1.6, false); k.stroke();
    k.beginPath(); k.moveTo(503.5, 173.5); k.lineTo(503.5, 177.5); k.lineTo(507.5, 177.5); k.stroke();
    const talk = t => CAP_TL.lines.some(L => t >= L.start && t < L.end - 0.4);
    const bv = (st, i) => (talk(st * 0.09) ? 0.25 + hash(st * 31 + i) * 0.75 * Math.sin((i + 2) / 28 * Math.PI) : 0.08 + hash(st * 31 + i) * 0.06);
    const st = Math.floor(Math.max(0, pos) / 0.09), sf = clamp((pos - st * 0.09) / 0.09), bw = (418 - 25 * 3) / 26;
    k.fillStyle = UX.accent; k.globalAlpha = 0.75;
    for (let i = 0; i < 26; i++) {
      const v = playing ? mix(st > 0 ? bv(st - 1, i) : 0.08, bv(st, i), sf) : 0.08, bh = Math.max(3, 30 * v);
      rr(k, 58 + i * (bw + 3), 182 - bh / 2, bw, bh, 1.5); k.fill();
    }
    k.globalAlpha = 1;
    // 指针：0.2 秒按下播放后移出，5.6 秒起回到播放键
    const KF = [[0, 34, 186], [0.25, 34, 186], [1.0, 590, 240], [5.6, 590, 240], [6.4, 34, 186]];
    const cp = UXA_path(KF, u);
    ripple(k, 34, 186, (u - 0.2) / 0.5);
    cursor(k, cp[0], cp[1], pingPong(u, 0.1, 0.2, 0.22, 0.34));
  };

  // @element 05
  // 05 手绘圈画标注：句中 3 个关键词被红笔（#D93A55，主笔 2.4px + 1.6px 70% 副笔）依次标注；指针在 0.2 / 1.75 / 3.3 / 4.9 秒依次点「圈出 / 方框 / 删除线 / 下划线」，
  // 每次先把旧标注倒着擦掉（.26 秒），再逐词画新标注（每词间隔 .24 秒、副笔再晚 .13 秒，单笔时长 .25 秒 + 路径长 ×0.9ms，缓动 cubic-bezier(.55,.1,.35,1)），周期末回到下划线
  const MARK_SEG = [['这个季度，我们要把', 0], ['注册率', 1], ['提升到', 0], ['两倍', 1], ['，并把首周的', 0], ['流失率', 1], ['砍掉一半。', 0]];
  const MARK_TABS = ['下划线', '圈出', '方框', '删除线'];
  const MARK_EV = [[0.2, 1], [1.75, 2], [3.3, 3], [4.9, 0]];   // [点击时刻, 样式]
  const MARK_X = 30, MARK_W = 480, MARK_Y = 74, MARK_LH = 38;
  const MARK_ease = UXA_bz(.55, .1, .35, 1);
  let MARK_LAY = null;                                 // 惰性常量：文字片段位置、关键词矩形、4 种样式的笔画折线
  const MARK_build = k => {
    const frags = [], rects = []; let x = 0, y = 0;
    for (const [s, b] of MARK_SEG) {
      k.font = `${b ? 850 : 700} 21px ${SANS}`;
      if (b) {
        const ww = k.measureText(s).width;
        if (x + ww > MARK_W) { x = 0; y += MARK_LH; }
        frags.push({ s, b, x: MARK_X + x, y: MARK_Y + y }); rects.push({ x: MARK_X + x, y: MARK_Y + y - 21, w: ww, h: 26 }); x += ww;
      } else {
        let cur = '';
        for (const ch of s) {
          const ww = k.measureText(cur + ch).width;
          if (x + ww > MARK_W && cur) { frags.push({ s: cur, b, x: MARK_X + x, y: MARK_Y + y }); x = 0; y += MARK_LH; cur = ch; }
          else cur += ch;
        }
        if (cur) { frags.push({ s: cur, b, x: MARK_X + x, y: MARK_Y + y }); x += k.measureText(cur).width; }
      }
    }
    // 笔画折线：抖动用 hash（按样式、词、笔次固定），与原作 j(n) 幅度一致
    const shapes = [0, 1, 2, 3].map(type => rects.map((r, wi) => [0, 1].map(pass => {
      let sd = type * 1000 + wi * 100 + pass * 50;
      const j = n => (hash(++sd) - 0.5) * 2 * n, s = pass ? 1.6 : 1, pts = [];
      const quad = (x0, y0, cx, cy, x1, y1) => { for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push([(1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * cy + t * t * y1]); } };
      const { x, y, w, h } = r;
      if (type === 0) quad(x - 2, y + h - 1 + j(1.5), x + w / 2, y + h + 3 * s + j(2), x + w + 3, y + h - 2 + j(1.5));
      if (type === 3) quad(x - 3, y + h * 0.55 + j(2), x + w / 2, y + h * 0.45 + j(3), x + w + 3, y + h * 0.52 + j(2));
      if (type === 2) pts.push([x - 4 + j(1.5), y - 1 + j(1.5)], [x + w + 4 + j(1.5), y - 2 + j(1.5)], [x + w + 3 + j(1.5), y + h + 2 + j(1.5)], [x - 3 + j(1.5), y + h + 1 + j(1.5)], [x - 4 + j(1), y - 3 + j(1)]);
      if (type === 1) {
        const cx = x + w / 2, cy = y + h / 2, rx = w / 2 + 9, ry = h / 2 + 5, a0 = -2.2 + j(0.3);
        for (let i = 0; i <= 26; i++) { const a = a0 + (i / 26) * (TAU + 0.6), kk = 1 + j(0.05) + i * 0.004 * s; pts.push([cx + Math.cos(a) * rx * kk, cy + Math.sin(a) * ry * kk]); }
      }
      const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      return { pts, L, len: L[L.length - 1] };
    })));
    return { frags, shapes };
  };
  // 画折线的前 f 段（0..1，按长度）
  const MARK_part = (k, sh, f) => {
    if (f <= 0) return;
    const lim = sh.len * Math.min(1, f);
    k.beginPath(); k.moveTo(sh.pts[0][0], sh.pts[0][1]);
    for (let i = 1; i < sh.pts.length; i++) {
      if (sh.L[i] <= lim) { k.lineTo(sh.pts[i][0], sh.pts[i][1]); continue; }
      const t = (lim - sh.L[i - 1]) / (sh.L[i] - sh.L[i - 1]);
      k.lineTo(mix(sh.pts[i - 1][0], sh.pts[i][0], t), mix(sh.pts[i - 1][1], sh.pts[i][1], t)); break;
    }
    k.stroke();
  };
  CELLS[4] = (k, w, h, u) => {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    card(k, 10, 10, CW - 20, CH - 20, 22);
    if (!MARK_LAY) MARK_LAY = MARK_build(k);
    txt(k, '季度计划备忘', MARK_X, 36, `700 12px ${SANS}`, UX.ink3);
    for (const f of MARK_LAY.frags) txt(k, f.s, f.x, f.y, `${f.b ? 850 : 700} 21px ${SANS}`, UX.ink);
    // 当前样式与上一样式
    let ne = 0; for (const [t] of MARK_EV) if (u >= t) ne++;
    const evt = ne ? MARK_EV[ne - 1] : [MARK_EV[3][0] - CYC, 0], prevType = MARK_EV[(ne + 2) % 4][1], type = evt[1];
    const dt = u - evt[0];
    k.strokeStyle = UX.danger; k.lineCap = 'round'; k.lineJoin = 'round';
    const drawSet = (tp, fn) => MARK_LAY.shapes[tp].forEach((pair, wi) => pair.forEach((sh, pass) => {
      k.lineWidth = pass ? 1.6 : 2.4; k.globalAlpha = pass ? 0.7 : 1; MARK_part(k, sh, fn(sh, wi, pass));
    }));
    if (dt < 0.26) drawSet(prevType, () => 1 - MARK_ease(dt / 0.26));
    else drawSet(type, (sh, wi, pass) => MARK_ease(clamp((dt - 0.26 - wi * 0.24 - pass * 0.13) / (0.25 + sh.len * 0.0009))));
    k.globalAlpha = 1;
    // 样式分段控件：选中项白底 + 细描边，切换 .25 秒
    const TX = 30, TY = 152, TW = 479, BW = (TW - 8 - 12) / 4;
    k.fillStyle = UX.surface2; rr(k, TX, TY, TW, 36, 12); k.fill();
    for (let i = 0; i < 4; i++) {
      const bx = TX + 4 + i * (BW + 4);
      const on = i === type ? clamp(dt / 0.25) : i === prevType && type !== prevType ? 1 - clamp(dt / 0.25) : 0;
      if (on > 0) { k.globalAlpha = on; card(k, bx, TY + 4, BW, 28, 9); k.globalAlpha = 1; }
      txt(k, MARK_TABS[i], bx + BW / 2, TY + 19, `700 12.5px ${SANS}`, rgba(lerpC([142, 138, 151], [22, 21, 27], on), 1), 'center', 'middle');
    }
    // 指针依次点 4 个按钮
    const tabX = i => TX + 4 + i * (BW + 4) + BW / 2 + 4, ty = TY + 22;
    const KF = [[0, tabX(0), ty + 4], [0.2, tabX(1), ty]];
    MARK_EV.forEach(([t, tp], i) => { if (i) KF.push([t - 0.5, tabX(tp), ty], [t, tabX(tp), ty]); });
    KF.push([5.6, tabX(0), ty + 4], [6.4, tabX(0), ty + 4]);
    KF[0] = [0, tabX(0), ty + 4]; KF.splice(1, 0, [0.0001, tabX(0), ty + 4]);
    const [px, py] = UXA_path(KF.sort((a, b) => a[0] - b[0]), u);
    let press = 0; for (const [t] of MARK_EV) press = Math.max(press, pingPong(u, t - 0.1, t, t + 0.02, t + 0.14));
    for (const [t, tp] of MARK_EV) ripple(k, tabX(tp), ty, (u - t) / 0.5);
    cursor(k, px, py, press);
  };

  // @element 06
  // 06 剧透沙粒遮挡：聊天气泡里的剧透短语盖着闪烁的沙粒（每 9 平方像素 1 粒、边长 .6–1.5px，亮度 .45–1 起伏、±.8px 抖动）；
  // 指针 1.2 秒点第一句、2.6 秒点第二句：沙粒从点击处按 2–5 像素/帧向外炸开（每帧速度 ×.94、透明度 −.025），文字 .5 秒显出（延迟 .1 秒）；
  // 4.2 秒点「再藏起来」：沙粒从 60px 外每帧收拢 12% 回到原位，文字同时隐去
  const SPOIL_B = [
    { x: 16, y: 14, me: false, who: '敏智', seg: [['你看那部电影了吗？结局', 0], ['原来侦探一直就是凶手', 1], ['，看得我起鸡皮疙瘩。', 0]] },
    { x: 0, y: 96, me: true, who: '', seg: [['我还没看！！就告诉我一件事：', 0], ['片尾有彩蛋吗？', 1]] },
  ];
  const SPOIL_TAP = [[1.2, 0], [2.6, 1]], SPOIL_HIDE = 4.2;
  const SPOIL_F = `550 14.5px ${SANS}`, SPOIL_MAXW = 360, SPOIL_LH = 23;
  let SPOIL_LAY = null;                                // 惰性常量：气泡尺寸、文字片段、剧透矩形与沙粒
  const SPOIL_build = k => {
    k.font = SPOIL_F;
    const out = SPOIL_B.map((b, bi) => {
      const frags = [], boxes = []; let x = 0, y = 0, maxx = 0;
      for (const [s, sp] of b.seg) {
        let cur = '', sx = x;
        const flush = () => { if (!cur) return; const ww = k.measureText(cur).width; frags.push({ s: cur, sp, x: sx, y }); if (sp) boxes.push({ x: sx, y: y - 15, w: ww, h: 19 }); maxx = Math.max(maxx, sx + ww); };
        for (const ch of s) {
          const ww = k.measureText(cur + ch).width;
          if (sx + ww > SPOIL_MAXW && cur) { flush(); y += SPOIL_LH; sx = 0; cur = ch; } else cur += ch;
        }
        flush(); x = sx + k.measureText(cur).width;
      }
      const top = b.who ? 32 : 26, bw = maxx + 28, bh = top + y + 12;
      const bx = b.me ? CW - 16 - bw : b.x;
      return { bx, by: b.y, bw, bh, top, frags, boxes, me: b.me, who: b.who };
    });
    const parts = [];
    out.forEach((b, bi) => b.boxes.forEach(r => {
      const n = Math.round(r.w * r.h / 9);
      for (let j = 0; j < n; j++) {
        const sd = bi * 5000 + parts.length * 7;
        parts.push({ s: bi, hx: b.bx + 14 + r.x + hash(sd + 1) * r.w, hy: b.by + b.top + r.y + hash(sd + 2) * r.h, r: 0.6 + hash(sd + 3) * 0.9, sp: 2 + hash(sd + 4) * 3, ang: hash(sd + 5) * TAU, ph: hash(sd + 6) * TAU });
      }
    }));
    return { b: out, parts };
  };
  CELLS[5] = (k, w, h, u) => {
    k.fillStyle = UX.surface; k.fillRect(0, 0, CW, CH);
    if (!SPOIL_LAY) SPOIL_LAY = SPOIL_build(k);
    const L = SPOIL_LAY, opened = [0, 0], tap = [9, 9];
    for (const [t, i] of SPOIL_TAP) tap[i] = t;
    const hidden = u >= SPOIL_HIDE;
    // 气泡与文字（剧透文字颜色从透明过渡到正常色 .5 秒、延迟 .1 秒；再藏起来时反向）
    L.b.forEach((b, bi) => {
      k.fillStyle = b.me ? UX.accent : UX.surface2;
      const r = 18, rs = 6;
      k.beginPath();
      if (b.me) { k.moveTo(b.bx + r, b.by); k.arcTo(b.bx + b.bw, b.by, b.bx + b.bw, b.by + b.bh, r); k.arcTo(b.bx + b.bw, b.by + b.bh, b.bx, b.by + b.bh, rs); k.arcTo(b.bx, b.by + b.bh, b.bx, b.by, r); k.arcTo(b.bx, b.by, b.bx + b.bw, b.by, r); }
      else { k.moveTo(b.bx + r, b.by); k.arcTo(b.bx + b.bw, b.by, b.bx + b.bw, b.by + b.bh, r); k.arcTo(b.bx + b.bw, b.by + b.bh, b.bx, b.by + b.bh, r); k.arcTo(b.bx, b.by + b.bh, b.bx, b.by, rs); k.arcTo(b.bx, b.by, b.bx + b.bw, b.by, r); }
      k.closePath(); k.fill();
      if (b.who) txt(k, b.who, b.bx + 14, b.by + 22, `750 11.5px ${SANS}`, UX.ink3);
      const show = hidden ? 1 - clamp((u - SPOIL_HIDE - 0.1) / 0.5) : clamp((u - tap[bi] - 0.1) / 0.5);
      opened[bi] = show;
      const col = b.me ? [255, 255, 255] : [22, 21, 27];
      for (const f of b.frags) {
        const a = f.sp ? uxEase(show) : 1;
        if (a <= 0.003) continue;
        txt(k, f.s, b.bx + 14 + f.x, b.by + b.top + f.y, SPOIL_F, rgba(col, a));
      }
    });
    // 沙粒：常态闪烁（|sin| 每周期 5 次、x 抖动 3 次、y 抖动 4 次，保证无缝）；炸开与收拢按原作逐帧系数的闭式解
    const inkC = UX.ink;
    for (const p of L.parts) {
      const b = L.b[p.s], tp = tap[p.s];
      let x = p.hx + Math.sin(TAU * 3 * u / CYC + p.hy) * 0.8, y = p.hy + Math.cos(TAU * 4 * u / CYC + p.hx) * 0.8;
      let a = 0.45 + 0.55 * Math.abs(Math.sin(Math.PI * 5 * u / CYC + p.hx * 3));
      if (u >= tp && u < SPOIL_HIDE) {
        const n = (u - tp) * 60, cx = SPOIL_PT[p.s][0], cy = SPOIL_PT[p.s][1];
        const dx = p.hx - cx, dy = p.hy - cy, d = Math.max(4, Math.hypot(dx, dy)), g = (1 - Math.pow(0.94, n)) / 0.06;
        x = p.hx + dx / d * p.sp * g; y = p.hy + (dy / d * p.sp - 0.5) * g; a = 1 - 0.025 * n;
      } else if (u >= SPOIL_HIDE) {
        const off = 60 * Math.pow(0.88, (u - SPOIL_HIDE) * 60);
        x += Math.cos(p.ang) * off; y += Math.sin(p.ang) * off;
      }
      if (a <= 0) continue;
      k.globalAlpha = Math.min(1, a); k.fillStyle = b.me ? '#FFFFFF' : inkC; k.fillRect(x, y, p.r, p.r);
    }
    k.globalAlpha = 1;
    // 「再藏起来」按钮
    const hp = pingPong(u, SPOIL_HIDE - 0.1, SPOIL_HIDE, SPOIL_HIDE + 0.02, SPOIL_HIDE + 0.16);
    k.save(); k.translate(CW / 2, 180); k.scale(1 - 0.05 * hp, 1 - 0.05 * hp);
    k.fillStyle = UX.surface2; rr(k, -44, -15, 88, 30, 15); k.fill();
    txt(k, '再藏起来', 0, 1, `750 12.5px ${SANS}`, UX.ink2, 'center', 'middle'); k.restore();
    // 指针：点两处剧透、再点按钮，最后移出
    const KF = [[0, 590, 240], [0.4, 590, 240], [1.2, SPOIL_PT[0][0], SPOIL_PT[0][1]], [1.9, SPOIL_PT[0][0], SPOIL_PT[0][1]], [2.6, SPOIL_PT[1][0], SPOIL_PT[1][1]], [3.4, SPOIL_PT[1][0], SPOIL_PT[1][1]], [4.2, CW / 2 + 4, 182], [4.6, CW / 2 + 4, 182], [5.4, 590, 240]];
    const [px, py] = UXA_path(KF, u);
    let press = 0;
    for (const t of [1.2, 2.6, SPOIL_HIDE]) press = Math.max(press, pingPong(u, t - 0.1, t, t + 0.02, t + 0.14));
    ripple(k, SPOIL_PT[0][0], SPOIL_PT[0][1], (u - 1.2) / 0.5); ripple(k, SPOIL_PT[1][0], SPOIL_PT[1][1], (u - 2.6) / 0.5); ripple(k, CW / 2 + 4, 182, (u - SPOIL_HIDE) / 0.5);
    cursor(k, px, py, press);
  };
  // 两处剧透的点击点（第一处偏左、第二处在中间），由布局算出后固定
  const SPOIL_PT = [[0, 0], [0, 0]];
  {
    // 用离屏量一次字宽确定点击点（与 SPOIL_build 相同的布局）
    const c = document.createElement('canvas').getContext('2d');
    const L = SPOIL_build(c);
    L.b.forEach((b, i) => { const r = b.boxes[0]; SPOIL_PT[i] = [b.bx + 14 + r.x + r.w * (i ? 0.5 : 0.3), b.by + b.top + r.y + r.h * 0.55]; });
  }

  // @element 07
  // 07 阅读句子聚焦：段落 5 句话只留指针下那句清晰，其余降到 25% 透明度并轻微模糊（.45 秒过渡）；左侧 4px 紫色竖条随句子移动并伸缩到句高（.55 秒弹簧），
  // 顶部计数器按 16px 一格滚动（.5 秒弹簧）；指针在 0 / 1.2 / 2.2 / 3.2 / 4.2 秒依次移到第 1→5 句，5.6 秒回到第 1 句
  const READ_S = ['读长文的时候，眼睛迷路的次数比你想的多。', '只让一句保持清晰，就知道下一步该读哪里。', '把其余部分模糊掉不是为了藏起来，而是为了显出顺序。', '焦点会顺滑地跟着你的手走。', '读完以后，随时都能重新看到全文。'];
  const READ_EV = [[0, 0], [1.2, 1], [2.2, 2], [3.2, 3], [4.2, 4], [5.6, 0]];
  const READ_F = `620 16px ${SANS}`, READ_X = 46, READ_W = 462, READ_Y = 76, READ_LH = 27;
  let READ_LAY = null;                                 // 惰性常量：每句的折行片段与上下边界
  CELLS[6] = (k, w, h, u) => {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    card(k, 10, 10, CW - 20, CH - 20, 22);
    k.font = READ_F;
    if (!READ_LAY) {
      const frags = [], tops = [], bots = []; let x = 0, y = 0;
      READ_S.forEach((s, si) => {
        let cur = '', sx = x; tops.push(y);
        for (const ch of s) {
          const ww = k.measureText(cur + ch).width;
          if (sx + ww > READ_W && cur) { frags.push({ si, s: cur, x: sx, y }); y += READ_LH; sx = 0; cur = ch; } else cur += ch;
        }
        frags.push({ si, s: cur, x: sx, y }); x = sx + k.measureText(cur).width + 4; bots.push(y);
      });
      READ_LAY = { frags, tops, bots };
    }
    const L = READ_LAY;
    // 每句的清晰度 on（0..1，.45 秒 ux-ease）
    let curI = 0, tcur = -9, prevI = 0;
    READ_EV.forEach(([t, i], j) => { if (u >= t) { prevI = curI; curI = i; tcur = t; } });
    const fo = uxEase(clamp((u - tcur) / 0.45));
    // 头部：阅读模式 · N / 5，数字一格 16px 滚动
    txt(k, '阅读模式 ·', 30, 38, `750 12px ${SANS}`, UX.ink3);
    const roll = UXA_steps(READ_EV.map(([t, i]) => [t, i]), u, 0.5);
    k.save(); k.beginPath(); k.rect(92, 26, 14, 16); k.clip();
    for (let i = 0; i < 5; i++) txt(k, String(i + 1), 99, 38 + (i - roll) * 16, `700 12px ${MONO}`, UX.ink, 'center');
    k.restore();
    txt(k, '/ 5', 108, 38, `750 12px ${SANS}`, UX.ink3);
    k.fillStyle = UX.surface2; rr(k, 433, 20, 76, 26, 13); k.fill();
    txt(k, '关闭聚焦', 471, 33.5, `700 12px ${SANS}`, UX.ink2, 'center', 'middle');
    // 段落
    k.textAlign = 'left'; k.textBaseline = 'alphabetic'; k.fillStyle = UX.ink;
    for (const f of L.frags) {
      const on = f.si === curI ? (curI === prevI ? 1 : fo) : f.si === prevI && prevI !== curI ? 1 - fo : 0;
      UXA_blurText(k, f.s, READ_X + f.x, READ_Y + f.y, 1.2 * (1 - on), 0.25 + 0.75 * on);
    }
    k.globalAlpha = 1;
    // 左侧竖条：top = 句首行顶 + 3，height = 句高 − 6（行高 27，字形占上 19px）
    const top = UXA_steps(READ_EV.map(([t, i]) => [t, READ_Y + L.tops[i] - 19 + 3]), u, 0.55);
    const hh = UXA_steps(READ_EV.map(([t, i]) => [t, Math.max(8, L.bots[i] - L.tops[i] + 25 - 6)]), u, 0.55);
    k.fillStyle = UX.accent; rr(k, 30, top, 4, hh, 2); k.fill();
    // 指针停在当前句中部
    const KF = READ_EV.map(([t, i]) => [t, READ_X + 70 + i * 52, READ_Y + (L.tops[i] + L.bots[i]) / 2 - 2]);
    const PK = []; KF.forEach((p, j) => { if (j) PK.push([p[0] - 0.45, KF[j - 1][1], KF[j - 1][2]]); PK.push(p); }); PK.push([6.4, KF[0][1], KF[0][2]]);
    const [px, py] = UXA_path(PK, u);
    cursor(k, px, py);
  };

  // @element 08
  // 08 字母弹簧涟漪：一行 6 个大字母「MOTION」各自停在固定位置，只做上下弹动；模拟指针 0.4–3.0 秒自左向右划过，
  // 靠近的字母按高斯分布（σ 34px）抬起，最高 −34px；每个字母一根弹簧（每帧 v += (目标 − y)×0.16，v ×= 0.8，按 60Hz 预先积分），
  // 抬得越高越偏紫（y/−50）、地面投影越淡越窄；3.4 秒点「发送波浪」，一道 1.1 秒、1.35 倍幅度的脉冲从左到右扫过；6 秒前全部静止
  const RIPL_WORD = 'MOTION', RIPL_SIG = 34, RIPL_AMP = 34, RIPL_N = 384;  // 384 帧 = 6.4 秒 × 60Hz
  const RIPL_X0 = 60, RIPL_GAP = 66, RIPL_BASE = 142;
  const RIPL_PX = u => u < 0.4 || u > 3.0 ? null : mix(RIPL_X0 - 50, RIPL_X0 + RIPL_GAP * 5 + 50, inOut3(seg(u, 0.4, 3.0)));
  const RIPL_PULSE = 3.4;
  // 预先按 60Hz 积分弹簧（纯函数：绘制时只查表）
  const RIPL_SIM = (() => {
    const y = new Array(6).fill(0), v = new Array(6).fill(0), out = [];
    const g = (d, s) => Math.exp(-(d * d) / (2 * s * s));
    for (let f = 0; f <= RIPL_N; f++) {
      const u = f / 60, px = RIPL_PX(u);
      const pk = u >= RIPL_PULSE && u < RIPL_PULSE + 1.1 ? (u - RIPL_PULSE) / 1.1 : -1;
      const pc = pk < 0 ? null : -60 + (RIPL_GAP * 5 + 120) * pk + RIPL_X0 - 30;
      out.push(y.map((_, i) => {
        const x = RIPL_X0 + i * RIPL_GAP; let tgt = 0;
        if (px != null) tgt -= RIPL_AMP * g(x - px, RIPL_SIG);
        if (pc != null) tgt -= RIPL_AMP * 1.35 * g(x - pc, RIPL_SIG * 1.2);
        v[i] += (tgt - y[i]) * 0.16; v[i] *= 0.8; y[i] += v[i];
        return [y[i], v[i]];
      }));
    }
    return out;
  })();
  CELLS[7] = (k, w, h, u) => {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    card(k, 12, 10, CW - 24, CH - 20, 24);
    const sea = k.createLinearGradient(0, 110, 0, CH - 10); sea.addColorStop(0, 'rgba(47,143,224,0)'); sea.addColorStop(1, 'rgba(47,143,224,.1)');
    k.fillStyle = sea; rr(k, 12, 110, CW - 24, CH - 120, 24); k.fill();
    const st = RIPL_SIM[Math.min(RIPL_N, Math.round(u * 60))];
    const ac = [106, 87, 242], ink = [22, 21, 27];
    for (let i = 0; i < 6; i++) {
      const [y, v] = st[i], x = RIPL_X0 + i * RIPL_GAP, t = clamp(-y / 50), sy = 1 + Math.max(-0.08, Math.min(0.14, -v * 0.02));
      // 地面投影：抬得越高越淡越窄
      k.fillStyle = `rgba(40,30,80,${0.3 * (1 - t * 0.7)})`;
      k.beginPath(); k.ellipse(x, RIPL_BASE + 10, 18 * (1 - t * 0.5), 3, 0, 0, TAU); k.fill();
      k.save(); k.translate(x, RIPL_BASE + y); k.scale(1, sy);
      txt(k, RIPL_WORD[i], 0, 0, `900 62px ${SANS}`, rgba(lerpC(ink, ac, t), 1), 'center', 'alphabetic');
      k.restore();
    }
    // 右侧控制条：波高读数 + 「发送波浪」按钮（3.4 秒按下）
    const bp = clamp(1 - Math.abs(u - RIPL_PULSE) / 0.12);
    k.fillStyle = UX.surface2; rr(k, 446, 72, 72, 64, 14); k.fill();
    txt(k, '波高', 456, 92, `700 9px ${SANS}`, UX.ink3); txt(k, '34', 456, 112, `800 16px ${SANS}`, UX.ink);
    k.save(); k.translate(482, 156); k.scale(1 - 0.07 * bp, 1 - 0.07 * bp);
    k.fillStyle = UX.ink; rr(k, -36, -14, 72, 28, 10); k.fill();
    txt(k, '发送波浪', 0, 4, `750 10px ${SANS}`, UX.page, 'center');
    k.restore();
    ripple(k, 482, 156, seg(u, RIPL_PULSE, RIPL_PULSE + 0.5));
    // 模拟指针：划过字母后移向按钮，按下后离开
    const px = RIPL_PX(u);
    let cx, cy;
    if (px != null) { cx = px; cy = RIPL_BASE - 30; }
    else if (u < 0.4) { cx = mix(RIPL_X0 - 70, RIPL_X0 - 50, seg(u, 0, 0.4)); cy = RIPL_BASE - 30; }
    else if (u < 3.3) { const q = inOut3(seg(u, 3.0, 3.3)); cx = mix(RIPL_X0 + RIPL_GAP * 5 + 50, 480, q); cy = mix(RIPL_BASE - 30, 152, q); }
    else if (u < 4.2) { cx = 480; cy = 152; }
    else { const q = inOut3(seg(u, 4.2, 6.0)); cx = mix(480, RIPL_X0 - 70, q); cy = mix(152, RIPL_BASE - 30, q); }
    cursor(k, cx, cy, bp);
  };

  // @shared
  // 滚动类元素（09–14）共用：一个周期内「向下滚到底 → 停留 → 回到顶部」的滚动进度 0..1
  // a→b 秒向下滚（ux-ease 式 inOut3），5.4→6.3 秒回顶
  const UXA_scroll = (u, a = 0.4, b = 4.6) => (u < SHOW ? inOut3(seg(u, a, b)) : 1 - inOut3(seg(u, SHOW, SHOW + 0.9)));

  // @element 09
  // 09 卡片堆叠吸顶：4 张渐变卡片（高 150、间距 16）依次滚到顶部吸住（吸顶位置 14 + 序号×8，原作 14 + 序号×12）；
  // 下一张盖上来时，下面那张按「重叠比例」缩小（每层 −6%）、压暗（每层黑色 18%），到最后一张时叠成台阶。0.4→4.6 秒滚到底，5.4→6.3 秒回顶
  const STACK_C = [['01', '一处规划', '把零散的笔记和文档汇到一块看板上。'], ['02', '一起打磨', '评论和版本都留在同一个地方。'], ['03', '即刻分享', '一个链接就能给团队外的人看。'], ['04', '看看数据', '每天早上收到一份反馈摘要。']];
  const STACK_BG = [['#7048E8', '#4C6EF5'], ['#F76707', '#F59F00'], ['#0CA678', '#15AABF'], ['#E64980', '#BE4BDB']];
  const STACK_H = 150, STACK_GAP = 16, STACK_X = 24, STACK_W = 470, STACK_HEAD = 50;
  const STACK_MAX = STACK_HEAD + 3 * (STACK_H + STACK_GAP) - (14 + 3 * 8);   // 最后一张刚好吸顶时的滚动量
  CELLS[8] = (k, w, h, u) => {
    k.fillStyle = UX.surface2; k.fillRect(0, 0, CW, CH);
    const p = UXA_scroll(u), s = p * (STACK_MAX + 40);
    txt(k, '工作方式', STACK_X + 4, 34 - s, `880 22px ${SANS}`, UX.ink);
    // 每张卡片的屏幕位置：自然位置 − 滚动量，但不高于吸顶位置
    const nat = i => STACK_HEAD + i * (STACK_H + STACK_GAP) - s, stick = i => 14 + i * 8;
    const pos = [0, 1, 2, 3].map(i => Math.max(stick(i), nat(i)));
    for (let i = 0; i < 4; i++) {
      let depth = 0;
      for (let j = i + 1; j < 4; j++) depth += clamp(1 - (pos[j] - stick(j)) / STACK_H);
      const sc = 1 - depth * 0.06, y = pos[i];
      if (y > CH) continue;
      k.save(); k.translate(STACK_X + STACK_W / 2, y); k.scale(sc, sc); k.translate(-STACK_W / 2, 0);
      // 顶部投影：0 -10px 30px -18px rgba(0,0,0,.35)
      k.fillStyle = 'rgba(0,0,0,.08)'; rr(k, 6, -3, STACK_W - 12, 20, 18); k.fill();
      const g = k.createLinearGradient(0, 0, STACK_W * 0.5, STACK_H * 1.2); g.addColorStop(0, STACK_BG[i][0]); g.addColorStop(1, STACK_BG[i][1]);
      k.fillStyle = g; rr(k, 0, 0, STACK_W, STACK_H, 22); k.fill();
      k.save(); rr(k, 0, 0, STACK_W, STACK_H, 22); k.clip();
      // 装饰：旋转 12° 的半透明圆角方块 + 内圆
      k.save(); k.translate(STACK_W - 70, 62); k.rotate(12 * Math.PI / 180);
      k.fillStyle = 'rgba(255,255,255,.18)'; rr(k, -40, -40, 80, 80, 22); k.fill();
      k.fillStyle = 'rgba(255,255,255,.35)'; k.beginPath(); k.arc(0, 0, 20, 0, TAU); k.fill(); k.restore();
      k.restore();
      txt(k, STACK_C[i][0], 20, 30, `800 12px ${MONO}`, 'rgba(255,255,255,.7)');
      txt(k, STACK_C[i][1], 20, 104, `880 26px ${SANS}`, '#FFFFFF');
      txt(k, STACK_C[i][2], 20, 130, `500 14px ${SANS}`, 'rgba(255,255,255,.85)');
      if (depth > 0) { k.fillStyle = `rgba(0,0,0,${0.18 * depth})`; rr(k, 0, 0, STACK_W, STACK_H, 22); k.fill(); }
      k.restore();
    }
    scrollbar(k, p, 0.32, CW - 14);
  };

  // @element 10
  // 10 滚动填色文字：大句子先是淡灰（line-2），滚到哪里就按词从头填成实色（每词占进度 1/N，整体 ×1.15 提前填满）；
  // 两处重点词填满时变成紫色并亮起光晕，读完后「下一篇 →」按钮从下方 12px 弹起（.35 秒淡入、.5 秒弹簧）；右侧 3px 进度条同步伸长。0.4→4.4 秒滚到底，5.4→6.3 秒回顶、文字重新变淡
  const FILL_T = '我们每天都在把*复杂的事情*变简单。因为我们相信，一个按钮、一句话，就能*省下某人的一个下午*。';
  const FILL_WORDS = (() => {
    // 中文没有空格：按标点与 2–4 字的短语切词（重点词整体作为一个词）
    const out = [];
    FILL_T.split('*').forEach((chunk, ci) => {
      if (ci % 2) { out.push({ s: chunk, em: true }); return; }
      const parts = chunk.match(/[^，。、]{1,3}[，。、]?/g) || [];
      parts.forEach(s => out.push({ s, em: false }));
    });
    return out;
  })();
  const FILL_F = `820 28px ${SANS}`, FILL_X = 30, FILL_W = 468, FILL_LH = 39;
  let FILL_LAY = null;                                 // 惰性常量：每个词的位置
  CELLS[9] = (k, w, h, u) => {
    k.fillStyle = UX.surface; k.fillRect(0, 0, CW, CH);
    k.font = FILL_F;
    if (!FILL_LAY) { let x = 0, y = 0; FILL_LAY = FILL_WORDS.map(wd => { const ww = k.measureText(wd.s).width; if (x + ww > FILL_W) { x = 0; y += FILL_LH; } const r = { x: FILL_X + x, y: 66 + y, w: ww }; x += ww; return r; }); }
    const t = u < SHOW ? inOut3(seg(u, 0.4, 4.4)) : 1 - inOut3(seg(u, SHOW, SHOW + 0.9));
    const N = FILL_WORDS.length, f = t * 1.15 * N;
    txt(k, '我们为什么做这件事', FILL_X, 34, `750 12px ${SANS}`, UX.ink3);
    const grey = [215, 215, 216];
    FILL_WORDS.forEach((wd, i) => {
      const v = clamp(f - i), r = FILL_LAY[i];
      if (wd.em && v >= 1) glow(k, r.x + r.w / 2, r.y - 9, r.w * 0.7, '106,87,242', 0.16);
      txt(k, wd.s, r.x, r.y, FILL_F, rgba(lerpC(grey, wd.em ? [106, 87, 242] : [22, 21, 27], v), 1));
    });
    // 「下一篇 →」：进度 ×1.15 ≥ 1 时出现（按到达/离开时刻做 .35 秒淡入与 .5 秒弹簧）
    const tOn = 0.4 + 4.0 * UXA_inv(1 / 1.15), tOff = SHOW + 0.9 * (1 - UXA_inv(1 / 1.15));
    const on = u < tOff ? (u >= tOn ? 1 : 0) : 0, dt = on ? u - tOn : u - tOff;
    const op = on ? clamp(dt / 0.35) : (u >= tOff ? 1 - clamp(dt / 0.35) : 0), ty = on ? 12 * (1 - UXA_spring(clamp(dt / 0.5))) : 12 * UXA_spring(clamp(dt / 0.5));
    if (op > 0) {
      k.globalAlpha = op; k.fillStyle = UX.ink; rr(k, FILL_X, 154 + ty, 106, 34, 17); k.fill();
      txt(k, '下一篇 →', FILL_X + 53, 171.5 + ty, `750 13px ${SANS}`, UX.page, 'center', 'middle'); k.globalAlpha = 1;
    }
    // 右侧进度条：高 120、宽 3
    k.fillStyle = UX.line; rr(k, 516, 24, 3, 120, 1.5); k.fill();
    k.fillStyle = UX.ink; rr(k, 516, 24, 3, 120 * Math.min(1, t * 1.15), 1.5); k.fill();
  };

  // @element 11
  // 11 分区背景切换：滚过四种口味，整张卡片背景在相邻两色间连续插值（不跳变），中间的易拉罐跟着换色、换标签名；
  // 罐身按「离最近分区的偏移」倾斜（偏移×24°）、标签横移（偏移×−60px）。四色 #FFAB91 / #C0EB75 / #A5B4FC / #FFC8DD，罐色 #E64A19 / #5C940D / #4C3BCF / #D6336C。0.4→4.8 秒滚到底，5.4→6.3 秒回顶
  const SECT_F = [['葡萄柚', '明亮微苦的早晨'], ['青葡萄', '轻盈冒泡的午后'], ['蓝莓', '深沉香甜的傍晚'], ['水蜜桃', '温柔收尾的夜晚']];
  const SECT_BG = [[255, 171, 145], [192, 235, 117], [165, 180, 252], [255, 200, 221]];
  const SECT_CAN = ['#E64A19', '#5C940D', '#4C3BCF', '#D6336C'];
  CELLS[10] = (k, w, h, u) => {
    const p = UXA_scroll(u, 0.4, 4.8), f = p * 3;
    const i = Math.min(2, Math.floor(f)), t = f - i;
    k.fillStyle = rgba(lerpC(SECT_BG[i], SECT_BG[i + 1], t), 1); k.fillRect(0, 0, CW, CH);
    const cur = Math.round(f), off = f - cur;
    txt(k, '四种气泡口味', 22, 32, `800 13px ${SANS}`, 'rgba(27,27,34,.75)');
    // 右侧分区文字：每个分区占一屏（208px），随滚动上移
    k.save(); k.beginPath(); k.rect(250, 0, 250, CH); k.clip();
    SECT_F.forEach((s, j) => {
      const y = 132 + (j - f) * CH;
      if (y < -40 || y > CH + 40) return;
      txt(k, s[0], 262, y, `900 32px ${SANS}`, '#1B1B22');
      txt(k, s[1], 264, y + 26, `700 14px ${SANS}`, 'rgba(27,27,34,.75)');
    });
    k.restore();
    // 易拉罐（原作 104×196，这里 74×140），绕中心倾斜
    const cw = 74, ch = 140, col = SECT_CAN[cur];
    k.save(); k.translate(150, 34 + ch / 2 + 4); k.rotate(off * 24 * Math.PI / 180);
    k.save(); k.shadowColor = 'rgba(0,0,0,.35)'; k.shadowBlur = 20; k.shadowOffsetY = 14;
    k.fillStyle = col; rr(k, -cw / 2, -ch / 2, cw, ch, 18); k.fill(); k.restore();
    k.save(); rr(k, -cw / 2, -ch / 2, cw, ch, 18); k.clip();
    // 白色标签带（高 57，横移）
    k.fillStyle = 'rgba(255,255,255,.9)'; k.fillRect(-cw / 2 + off * -60 * 0.71, -ch / 2 + 46, cw, 57);
    txt(k, 'SPARKLING', off * -60 * 0.71, -ch / 2 + 66, `800 7px ${SANS}`, '#555555', 'center', 'middle');
    txt(k, SECT_F[cur][0], off * -60 * 0.71, -ch / 2 + 84, `900 14px ${SANS}`, col, 'center', 'middle');
    // 金属高光：左暗 → 30% 亮 → 55% 透 → 右暗
    const g = k.createLinearGradient(-cw / 2, 0, cw / 2, 0);
    g.addColorStop(0, 'rgba(0,0,0,.25)'); g.addColorStop(0.3, 'rgba(255,255,255,.35)'); g.addColorStop(0.55, 'rgba(255,255,255,.05)'); g.addColorStop(1, 'rgba(0,0,0,.28)');
    k.fillStyle = g; k.fillRect(-cw / 2, -ch / 2, cw, ch);
    const lid = k.createLinearGradient(0, -ch / 2, 0, -ch / 2 + 10); lid.addColorStop(0, '#E9ECEF'); lid.addColorStop(1, '#ADB5BD');
    k.fillStyle = lid; rr(k, -cw / 2 + 6, -ch / 2 - 6, cw - 12, 16, 6); k.fill();
    k.restore(); k.restore();
    // 右侧分区圆点（当前点放大 1.5 倍，.3 秒）
    for (let j = 0; j < 4; j++) {
      const on = j === cur ? 1 : 0;
      k.fillStyle = on ? '#1B1B22' : 'rgba(0,0,0,.25)';
      k.beginPath(); k.arc(516, CH / 2 - 19.5 + j * 13, 3 * (on ? 1.5 : 1), 0, TAU); k.fill();
    }
    scrollbar(k, p, 0.25, CW - 8, 10, CH - 10);
  };

  // @element 12
  // 12 速度倾斜列表：快速滚动时整列卡片朝滚动方向倾斜（skewY = −速度×3.2°，限 ±10°）并轻微拉长（每度 +0.6%，最多 6%），停下立刻弹回（弹簧：每帧 0.2 逼近、0.72 阻尼）；
  // 慢慢滚几乎不倾斜。顶部半圆仪表指针按速度从 −88° 转到 +80°。周期：0.4–0.9 秒快滚、1.9–3.5 秒慢滚、4.2–4.6 秒快速回顶
  const LEAN_ITEMS = ['首尔林散步', '乙支路胶片冲印', '望远市场炒年糕', '圣水工作室参观', '汉江日落骑行', '益善洞喝茶', '北村巷子拍照', '延南公园野餐', '西村书店巡游', '南山夜游'];
  const LEAN_C = [['#FF8787', '#FFD43B'], ['#74C0FC', '#B197FC'], ['#63E6BE', '#4DABF7'], ['#FFA94D', '#F783AC'], ['#A9E34B', '#38D9A9']];
  const LEAN_IH = 46, LEAN_GAP = 8, LEAN_TOP = 50, LEAN_VIEW = CH - LEAN_TOP;
  const LEAN_MAX = LEAN_ITEMS.length * (LEAN_IH + LEAN_GAP) - LEAN_GAP + 12 - LEAN_VIEW;
  // 滚动位置（像素）：快滚 0→240、慢滚 240→MAX、快速回顶
  const LEAN_Y = u => (u < 1.9 ? 240 * inOut3(seg(u, 0.4, 0.9)) : u < 4.2 ? mix(240, LEAN_MAX, seg(u, 1.9, 3.5)) : LEAN_MAX * (1 - inOut3(seg(u, 4.2, 4.6))));
  // 一次性按 60 帧/秒模拟原作的速度平滑（vel = .6 旧 + .4 新）与倾斜弹簧，得到每帧的 skew 与速度
  const LEAN_SIM = (() => {
    const F = 384, S = new Float32Array(F + 1), V = new Float32Array(F + 1);
    let vel = 0, skew = 0, sv = 0, py = LEAN_Y(0);
    for (let f = 0; f <= F; f++) {
      const y = LEAN_Y(f / 60), v = (y - py) / 16.67; py = y;
      vel = vel * 0.6 + v * 0.4;
      const target = clamp(-vel * 3.2, -10, 10);
      sv += (target - skew) * 0.2; sv *= 0.72; skew += sv;
      S[f] = skew; V[f] = vel;
    }
    return { S, V, F };
  })();
  CELLS[11] = (k, w, h, u) => {
    k.fillStyle = UX.surface; k.fillRect(0, 0, CW, CH);
    const fx = clamp(u / CYC) * LEAN_SIM.F, f0 = Math.min(LEAN_SIM.F - 1, Math.floor(fx)), ft = fx - f0;
    const skew = mix(LEAN_SIM.S[f0], LEAN_SIM.S[f0 + 1], ft), vel = mix(LEAN_SIM.V[f0], LEAN_SIM.V[f0 + 1], ft);
    const sy = LEAN_Y(u);
    txt(k, '周末计划', 22, 32, `850 17px ${SANS}`, UX.ink);
    // 速度仪表：半圆轨 + 红色指针
    txt(k, '滚动速度', 456, 32, `750 11px ${SANS}`, UX.ink3, 'right');
    k.strokeStyle = UX.line2; k.lineWidth = 4; k.lineCap = 'round';
    k.beginPath(); k.arc(486, 38, 18, Math.PI, 0); k.stroke();
    const na = clamp(-88 + Math.min(1, Math.abs(vel) / 3) * 176, -80, 80) * Math.PI / 180;
    const nv = Math.abs(vel) < 0.01 && Math.abs(skew) < 0.02 ? -88 * Math.PI / 180 : na;
    k.strokeStyle = UX.danger; k.lineWidth = 2.5;
    k.beginPath(); k.moveTo(486, 38); k.lineTo(486 + Math.sin(nv) * 15, 38 - Math.cos(nv) * 15); k.stroke();
    // 列表：以可视区中心为原点做 skewY + scaleY
    k.save(); k.beginPath(); k.rect(0, LEAN_TOP - 4, CW, CH - LEAN_TOP + 4); k.clip();
    const cy = LEAN_TOP + LEAN_VIEW / 2, sc = 1 + Math.min(0.06, Math.abs(skew) * 0.006);
    k.translate(CW / 2, cy); k.transform(1, Math.tan(skew * Math.PI / 180), 0, sc, 0, 0); k.translate(-CW / 2, -cy);
    LEAN_ITEMS.forEach((s, i) => {
      const y = LEAN_TOP + i * (LEAN_IH + LEAN_GAP) - sy;
      if (y > CH + 20 || y + LEAN_IH < LEAN_TOP - 30) return;
      k.fillStyle = UX.surface2; rr(k, 16, y, CW - 40, LEAN_IH, 14); k.fill();
      k.strokeStyle = UX.line; k.lineWidth = 1; rr(k, 16.5, y + 0.5, CW - 41, LEAN_IH - 1, 14); k.stroke();
      const g = k.createLinearGradient(28, y + 7, 60, y + 39); g.addColorStop(0, LEAN_C[i % 5][0]); g.addColorStop(1, LEAN_C[i % 5][1]);
      k.fillStyle = g; rr(k, 28, y + 7, 32, 32, 10); k.fill();
      txt(k, s, 72, y + 21, `780 14px ${SANS}`, UX.ink);
      txt(k, `${1 + (i * 7) % 5}.${(i * 3) % 10} 公里 · ${30 + i * 15} 分钟`, 72, y + 37, `650 11px ${SANS}`, UX.ink3);
    });
    k.restore();
    scrollbar(k, sy / LEAN_MAX, LEAN_VIEW / (LEAN_VIEW + LEAN_MAX), CW - 14, LEAN_TOP, CH - 8);
  };

  // @element 13
  // 13 翻滚章节数字：左栏大号章节数字像数字带一样连续滚动（每章读到 75% 后才开始滚向下一章，一格 78px，这里 64px），
  // 下方章节名在换章时上滑替换（.45 秒弹簧），圆环按本章阅读比例填满。右侧正文 0.4→4.8 秒滚到第 4 章，5.4→6.3 秒回顶
  const CHAP = [['萌芽', '每个故事都始于一个小问题：为什么这个按钮总让人困惑？'], ['观察', '我们花了一周观察大家真实的使用方式，手总在意想不到的地方停住。'], ['尝试', '我们做了二十种不同的方案逐一测试，大多失败了，但留下了两个。'], ['打磨', '我们把两个合成一个，一直删减到不需要任何解释。']];
  const CHAP_SIDE = 150, CHAP_TX = 166, CHAP_TW = 340, CHAP_LH = 22;
  let CHAP_LAY = null;                                 // 惰性常量：每章正文折行与章节起点/高度
  CELLS[12] = (k, w, h, u) => {
    k.fillStyle = UX.surface; k.fillRect(0, 0, CW, CH);
    if (!CHAP_LAY) {
      k.font = `400 13.5px ${SANS}`; let y = 16;
      CHAP_LAY = CHAP.map((c, i) => {
        const lines = []; let cur = '';
        for (const ch of c[1]) { if (k.measureText(cur + ch).width > CHAP_TW && cur) { lines.push(cur); cur = ch; } else cur += ch; }
        lines.push(cur);
        const top = y, hh = 6 + 20 + lines.length * CHAP_LH + 10 + 50 + 30; y += hh;
        return { top, hh, lines };
      });
    }
    const L = CHAP_LAY, maxS = L[3].top + L[3].hh * 0.8 - 20;
    const st = UXA_scroll(u, 0.4, 4.8) * maxS, yy = st + 20;
    let f = 0; L.forEach((s, i) => { if (yy >= s.top) f = i + Math.min(1, (yy - s.top) / s.hh); });
    const ci = Math.min(3, Math.floor(f)), inCh = f - ci;
    const roll = clamp(ci + Math.max(0, inCh - 0.75) / 0.25, 0, 3);
    // 正文
    k.save(); k.beginPath(); k.rect(CHAP_SIDE, 0, CW - CHAP_SIDE, CH); k.clip();
    L.forEach((s, i) => {
      const y0 = s.top - st;
      if (y0 > CH || y0 + s.hh < 0) return;
      txt(k, `${String(i + 1).padStart(2, '0')} · ${CHAP[i][0]}`, CHAP_TX, y0 + 22, `850 16px ${SANS}`, UX.ink);
      s.lines.forEach((ln, j) => txt(k, ln, CHAP_TX, y0 + 46 + j * CHAP_LH, `400 13.5px ${SANS}`, UX.ink2));
      k.fillStyle = UX.surface2; rr(k, CHAP_TX, y0 + 32 + s.lines.length * CHAP_LH + 10, CHAP_TW, 50, 12); k.fill();
    });
    k.restore();
    // 左栏
    k.fillStyle = UX.surface2; k.fillRect(0, 0, CHAP_SIDE, CH);
    k.fillStyle = UX.line; k.fillRect(CHAP_SIDE, 0, 1, CH);
    txt(k, 'CH', CHAP_SIDE / 2, 30, `800 11px ${MONO}`, UX.ink3, 'center');
    // 数字带：上下 22% 渐隐遮罩（用逐行透明度模拟）
    const NH = 64, ny = 40;
    k.save(); k.beginPath(); k.rect(0, ny, CHAP_SIDE, NH); k.clip();
    for (let i = 0; i < 4; i++) {
      const y = ny + (i - roll) * NH; if (y < ny - NH || y > ny + NH) continue;
      const d = Math.abs(y - ny) / NH;
      k.globalAlpha = clamp(1 - Math.max(0, d - 0.0) * 1.6);
      k.letterSpacing = '-3px';
      txt(k, String(i + 1).padStart(2, '0'), CHAP_SIDE / 2 + 2, y + NH / 2 + 2, `900 58px ${MONO}`, UX.ink, 'center', 'middle');
      k.letterSpacing = '0px';
    }
    k.restore(); k.globalAlpha = 1;
    // 章节名：换章时旧名上移淡出、新名从下方弹入（.45 秒弹簧、透明度 .3 秒）
    // 换章时刻：在一个周期内按 128 步扫描章节号的变化，取 u 之前最近一次
    const chAt = uu => { const s2 = UXA_scroll(uu, 0.4, 4.8) * maxS + 20; let c2 = 0; L.forEach((s, i) => { if (s2 >= s.top) c2 = i + (s2 - s.top >= s.hh ? 1 : 0); }); return Math.min(3, c2); };
    const tch = []; let prev = 0;
    for (let j = 1; j <= 128; j++) { const uu = j * CYC / 128; if (uu > u) break; const c2 = chAt(uu); if (c2 !== prev) tch.push([uu, prev, c2]); prev = c2; }
    const last = tch.length ? tch[tch.length - 1] : null, dt = last ? u - last[0] : 9;
    k.save(); k.beginPath(); k.rect(0, 110, CHAP_SIDE, 22); k.clip();
    const sp = UXA_spring(clamp(dt / 0.45)), op = clamp(dt / 0.3);
    if (last && op < 1) { k.globalAlpha = 1 - op; txt(k, CHAP[last[1]][0], CHAP_SIDE / 2, 121 - 20 * sp, `800 13px ${SANS}`, UX.ink, 'center', 'middle'); }
    k.globalAlpha = last ? op : 1; txt(k, CHAP[ci][0], CHAP_SIDE / 2, 121 + (last ? 20 * (1 - sp) : 0), `800 13px ${SANS}`, UX.ink, 'center', 'middle');
    k.restore(); k.globalAlpha = 1;
    // 进度圆环（r 16、线宽 4）
    k.lineWidth = 4; k.strokeStyle = UX.line2; k.beginPath(); k.arc(CHAP_SIDE / 2, 162, 16, 0, TAU); k.stroke();
    if (inCh > 0.003) { k.strokeStyle = UX.accent; k.lineCap = 'round'; k.beginPath(); k.arc(CHAP_SIDE / 2, 162, 16, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, inCh)); k.stroke(); }
    scrollbar(k, st / maxS, 0.3, CW - 8);
  };

  // @element 14
  // 14 滚筒时间选择器：上午/下午、小时、分钟三个滚筒，中线（高 36 的浅色条）上的值即选中值；离中线的值按距离 d 绕滚筒背面倾斜（rotateX d×22°，限 80°）并变淡（1 − |d|×0.28，最低 .15）。
  // 指针 0.5–1.5 秒把小时从 6 拨到 9，2.0–3.0 秒把分钟从 30 拨到 45，3.5–4.1 秒把上午拨到下午；停下 120ms 后标题与「还有 X 小时 Y 分响铃」更新（现在 22:40）；5.4–6.3 秒全部拨回
  const DRUM_DATA = [['上午', '下午'], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(String), Array.from({ length: 12 }, (_, m) => String(m * 5).padStart(2, '0'))];
  const DRUM_EV = [[1, 5, 8, 0.5, 1.5], [2, 6, 9, 2.0, 3.0], [0, 0, 1, 3.5, 4.1]];   // [列, 起始下标, 目标下标, 开始, 结束]
  const DRUM_IH = 34, DRUM_CX = [318, 398, 478], DRUM_CY = 112, DRUM_COLW = 72;
  const DRUM_idx = (ci, u) => {
    const e = DRUM_EV.find(x => x[0] === ci);
    if (u >= SHOW) return mix(e[2], e[1], inOut3(seg(u, SHOW, SHOW + 0.9)));
    return mix(e[1], e[2], UXA_bz(.2, .8, .2, 1)(seg(u, e[3], e[4])));
  };
  CELLS[13] = (k, w, h, u) => {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    card(k, 10, 10, CW - 20, CH - 20, 22);
    // 选中值：每列停下 120ms 后才更新文字
    const sel = [0, 1, 2].map(ci => Math.round(DRUM_idx(ci, Math.max(0, u - 0.12))));
    const hour = +DRUM_DATA[1][sel[1]], mm = DRUM_DATA[2][sel[2]];
    txt(k, `闹钟 ${DRUM_DATA[0][sel[0]]} ${hour}:${mm}`, 30, 52, `850 22px ${SANS}`, UX.ink);
    const target = (hour % 12 + (sel[0] ? 12 : 0)) * 60 + (+mm), diff = (target - (22 * 60 + 40) + 1440) % 1440;
    txt(k, `还有 ${Math.floor(diff / 60)} 小时 ${diff % 60} 分响铃 · 工作日重复`, 30, 76, `700 12.5px ${SANS}`, UX.ink3);
    // 小星期标记
    ['一', '二', '三', '四', '五', '六', '日'].forEach((d, i) => {
      const on = i < 5; k.fillStyle = on ? UX.accentSoft : UX.surface2; k.beginPath(); k.arc(42 + i * 26, 152, 10, 0, TAU); k.fill();
      txt(k, d, 42 + i * 26, 152.5, `700 11px ${SANS}`, on ? UX.accent : UX.ink3, 'center', 'middle');
    });
    // 中线浅色条
    k.fillStyle = UX.surface2; rr(k, 276, DRUM_CY - DRUM_IH / 2, 244, DRUM_IH, 12); k.fill();
    k.strokeStyle = UX.line; k.lineWidth = 1; rr(k, 276.5, DRUM_CY - DRUM_IH / 2 + 0.5, 243, DRUM_IH - 1, 12); k.stroke();
    // 三个滚筒：位置线性排列，按 rotateX 的 cos 压扁、按距离变淡，再乘上下 30% 的遮罩渐隐
    k.save(); k.beginPath(); k.rect(270, 20, 260, 168); k.clip();
    for (let ci = 0; ci < 3; ci++) {
      const idx = DRUM_idx(ci, u), F = `750 ${ci ? 22 : 17}px ${SANS}`;
      DRUM_DATA[ci].forEach((v, j) => {
        const d = j - idx; if (Math.abs(d) > 3) return;
        const y = DRUM_CY + d * DRUM_IH, a = clamp(d * 22, -80, 80) * Math.PI / 180;
        const fade = clamp(Math.min(y - 20, 188 - y) / (168 * 0.3));
        const op = Math.max(0.15, 1 - Math.abs(d) * 0.28) * fade;
        if (op <= 0.01) return;
        k.save(); k.translate(DRUM_CX[ci], y); k.scale(1 - Math.abs(d) * 0.012, Math.cos(a)); k.globalAlpha = op;
        txt(k, v, 0, 1, F, UX.ink, 'center', 'middle'); k.restore();
      });
    }
    k.restore();
    // 指针：按住滚筒往上拖（拖动时跟随滚筒移动）
    const pts = [];
    pts.push([0, 590, 240], [0.1, 590, 240]);
    DRUM_EV.forEach(([ci, a, b, t0, t1]) => {
      const x = DRUM_CX[ci] + 6, dy = (b - a) * DRUM_IH;
      pts.push([t0 - 0.35, x, DRUM_CY + 30], [t0, x, DRUM_CY + 30], [t1, x, DRUM_CY + 30 - Math.min(dy, 60)]);
    });
    pts.push([4.9, 590, 240], [6.4, 590, 240]);
    const [px, py] = UXA_path(pts, u);
    let press = 0; DRUM_EV.forEach(e => { press = Math.max(press, pingPong(u, e[3] - 0.1, e[3], e[4], e[4] + 0.12)); });
    cursor(k, px, py, press);
  };

  // @element 15
  // 15 网格光束背景：深色首屏（#07080F）铺 34px 淡网格（白 7%，中心椭圆遮罩），光束沿网格线横竖滑过（三色 129,140,248 / 45,212,191 / 244,114,182，
  // 拖尾 50–90px 渐变、头部 1.8px 亮点，速度约 100–210 px/s）；指针绕 ∞ 字形移动，周围半径 90px 的网格亮成靛蓝（129,140,248 / .55）。光束按每周期 2 或 3 趟排期，循环无缝
  const BEAM_COL = ['129,140,248', '45,212,191', '244,114,182'];
  const BEAM_SLOTS = Array.from({ length: 8 }, (_, s) => ({ v: s % 2 === 1, m: s % 3 === 0 ? 3 : 2, f: s % 2 ? 0.62 + hash(s + 40) * 0.2 : 0.75 + hash(s + 40) * 0.25, off: hash(s + 50), len: 50 + hash(s + 60) * 40 }));
  const BEAM_ptr = u => [270 + 205 * Math.sin(TAU * u / CYC), 104 + 62 * Math.sin(2 * TAU * u / CYC)];
  const BEAM_grid = (g, col) => {
    g.strokeStyle = col; g.lineWidth = 1; g.beginPath();
    for (let x = 33; x < CW; x += 34) { g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, CH); }
    for (let y = 33; y < CH; y += 34) { g.moveTo(0, y + 0.5); g.lineTo(CW, y + 0.5); }
    g.stroke();
  };
  CELLS[14] = (k, w, h, u) => {
    k.drawImage(layer('BEAM_bg', g => {
      g.fillStyle = '#07080F'; g.fillRect(0, 0, CW, CH);
      // 淡网格 + 椭圆遮罩（75% × 70%，中心 50% / 45%）
      const c = document.createElement('canvas'); c.width = CW; c.height = CH; const q = c.getContext('2d');
      BEAM_grid(q, 'rgba(255,255,255,.07)');
      q.globalCompositeOperation = 'destination-in'; q.save(); q.translate(CW / 2, CH * 0.45); q.scale(1, 0.7 * CH / (0.75 * CW) * 2.6);
      const rg = q.createRadialGradient(0, 0, 0, 0, 0, 0.75 * CW / 1.4); rg.addColorStop(0, '#000'); rg.addColorStop(1, 'rgba(0,0,0,0)');
      q.fillStyle = rg; q.fillRect(-CW, -CW, CW * 2, CW * 2); q.restore();
      g.drawImage(c, 0, 0);
    }), 0, 0);
    // 指针附近的亮网格：三层同心裁剪近似 90px 径向遮罩
    const [mx, my] = BEAM_ptr(u), lit = layer('BEAM_lit', g => BEAM_grid(g, 'rgba(129,140,248,.55)'));
    [[90, 0.3], [62, 0.35], [34, 0.45]].forEach(([r, a]) => { k.save(); k.beginPath(); k.arc(mx, my, r, 0, TAU); k.clip(); k.globalAlpha = a; k.drawImage(lit, 0, 0); k.restore(); });
    // 光束
    k.lineCap = 'butt';
    BEAM_SLOTS.forEach((b, s) => {
      const P = CYC / b.m, ph = u / P + b.off, n = Math.floor(ph), fr = ph - n, kk = ((n % b.m) + b.m) % b.m;
      const pr = fr / b.f; if (pr >= 1) return;
      const dim = b.v ? CH : CW, sd = s * 31 + kk * 7, dir = hash(sd + 1) < 0.5 ? 1 : -1;
      const line = (1 + Math.floor(hash(sd + 2) * (Math.floor(dim === CH ? CW / 34 : CH / 34) - 1))) * 34 - 1;
      const col = BEAM_COL[Math.floor(hash(sd + 3) * 3)], p = dir > 0 ? -60 + pr * (dim + 120) : dim + 60 - pr * (dim + 120);
      const x0 = b.v ? line : p - dir * b.len, y0 = b.v ? p - dir * b.len : line, x1 = b.v ? line : p, y1 = b.v ? p : line;
      const g = k.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},.95)`);
      k.strokeStyle = g; k.lineWidth = 1.6; k.beginPath(); k.moveTo(x0 + 0.5, y0 + 0.5); k.lineTo(x1 + 0.5, y1 + 0.5); k.stroke();
      glow(k, x1 + 0.5, y1 + 0.5, 8, col, 0.6);
      k.fillStyle = `rgb(${col})`; k.beginPath(); k.arc(x1 + 0.5, y1 + 0.5, 1.8, 0, TAU); k.fill();
    });
    // 中央光晕与文案
    k.drawImage(layer('BEAM_fg', g => {
      g.save(); g.translate(CW / 2, 92); g.scale(1.6, 0.8);
      const rg = g.createRadialGradient(0, 0, 0, 0, 0, 120); rg.addColorStop(0, 'rgba(99,102,241,.35)'); rg.addColorStop(1, 'rgba(99,102,241,0)');
      g.fillStyle = rg; g.fillRect(-140, -140, 280, 280); g.restore();
      g.fillStyle = 'rgba(255,255,255,.06)'; rr(g, CW / 2 - 34, 30, 68, 20, 10); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; rr(g, CW / 2 - 33.5, 30.5, 67, 19, 10); g.stroke();
      txt(g, '基础设施', CW / 2, 40.5, `800 10px ${SANS}`, '#A5B4FC', 'center', 'middle');
      const hg = g.createLinearGradient(0, 64, 0, 100); hg.addColorStop(0, '#FFFFFF'); hg.addColorStop(1, '#AEB4D6');
      g.letterSpacing = '-1px'; txt(g, '部署时间只要十分之一', CW / 2, 96, `900 30px ${SANS}`, hg, 'center'); g.letterSpacing = '0px';
      txt(g, '推送一下，几秒内全球上线。', CW / 2, 124, `600 12px ${SANS}`, '#9AA0C3', 'center');
      g.fillStyle = '#FFFFFF'; rr(g, CW / 2 - 92, 142, 88, 30, 15); g.fill();
      txt(g, '立即部署', CW / 2 - 48, 157.5, `800 11px ${SANS}`, '#07080F', 'center', 'middle');
      g.fillStyle = 'rgba(255,255,255,.06)'; rr(g, CW / 2 + 4, 142, 88, 30, 15); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.14)'; rr(g, CW / 2 + 4.5, 142.5, 87, 29, 15); g.stroke();
      txt(g, '阅读文档', CW / 2 + 48, 157.5, `800 11px ${SANS}`, '#F2F4FF', 'center', 'middle');
    }), 0, 0);
    cursor(k, mx, my, 0, false);
  };

  // @element 16
  // 16 产品屏由斜到正：左侧首屏文案，右侧产品窗口起初缩小（.84）并向后倾倒 34°（透视 900），滚动 0→210px 时按 1−(1−p)² 立起、放大到 1、上移 18px，阴影由 10/20px 加深到 34/54px；
  // 立正（p>.88）后图表 8 根柱子依次长高（.7 秒 cubic-bezier(.3,1.3,.5,1)，每根延迟 50ms），回滚时倒回 .15。0.4→2.6 秒滚下，5.4→6.3 秒回顶；未滚动时底部「滚动」提示上下跳（1.6 秒一次）
  const TILT_H = [0.42, 0.58, 0.5, 0.72, 0.64, 0.86, 0.78, 0.95];
  const TILT_WW = 270, TILT_WH = 152, TILT_CX = 380, TILT_TOP = 34;
  const TILT_bar = UXA_bz(.3, 1.3, .5, 1);
  let TILT_BUF = null;                                 // 2 倍分辨率的窗口草稿画布：每帧整块重画后按条带透视贴图（不跨帧保留内容）
  let TILT_CHROME = null;                              // 窗口外框、统计卡与网格线（常量，首帧画好后只贴图）
  CELLS[15] = (k, w, h, u) => {
    k.fillStyle = UX.surface; k.fillRect(0, 0, CW, CH);
    k.drawImage(layer('TILT_bg', g => {
      g.save(); g.translate(CW / 2, 0); g.scale(1.6, 0.6);
      const rg = g.createRadialGradient(0, 0, 0, 0, 0, 300); rg.addColorStop(0, 'rgba(106,87,242,.12)'); rg.addColorStop(0.7, 'rgba(106,87,242,0)');
      g.fillStyle = rg; g.fillRect(-300, 0, 600, 400); g.restore();
      g.fillStyle = UX.surface; rr(g, 26, 34, 76, 20, 10); g.fill(); g.strokeStyle = UX.line; g.lineWidth = 1; rr(g, 26.5, 34.5, 75, 19, 10); g.stroke();
      txt(g, '团队数据看板', 64, 44.5, `800 10px ${SANS}`, UX.accent, 'center', 'middle');
      g.letterSpacing = '-1px';
      txt(g, '所有数字', 26, 88, `900 26px ${SANS}`, UX.ink); txt(g, '一屏看全', 26, 118, `900 26px ${SANS}`, UX.ink);
      g.letterSpacing = '0px';
      txt(g, '把分散的指标实时汇到一起。', 26, 142, `600 11.5px ${SANS}`, UX.ink2);
      g.fillStyle = UX.ink; rr(g, 26, 154, 74, 28, 14); g.fill();
      txt(g, '免费试用', 63, 168.5, `800 11.5px ${SANS}`, UX.surface, 'center', 'middle');
    }), 0, 0);
    const p = u < SHOW ? inOut3(seg(u, 0.4, 2.6)) : 1 - inOut3(seg(u, SHOW, SHOW + 0.9));
    const e = 1 - Math.pow(1 - p, 2), ang = 34 * (1 - e) * Math.PI / 180, sc = 0.84 + 0.16 * e, ty = -18 * e;
    // 柱子目标：立正时（p>.88）为数据高度，否则 .15；按切换时刻做弹性过渡
    const tUp = 0.4 + 2.2 * UXA_inv(0.88), tDn = SHOW + 0.9 * UXA_inv(0.12);
    const full = u >= tUp && u < tDn, tch = full ? tUp : (u >= tDn ? tDn : -9);
    // 窗口内容画到草稿画布（2 倍分辨率）：窗口外框、统计卡与网格线是常量，缓存为 TILT_CHROME；每帧只重画柱子
    if (!TILT_BUF) { TILT_BUF = document.createElement('canvas'); TILT_BUF.width = TILT_WW * 2; TILT_BUF.height = TILT_WH * 2; }
    if (!TILT_CHROME) {
      TILT_CHROME = document.createElement('canvas'); TILT_CHROME.width = TILT_WW * 2; TILT_CHROME.height = TILT_WH * 2;
      const c = TILT_CHROME.getContext('2d'); c.scale(2, 2);
      c.save(); rr(c, 0, 0, TILT_WW, TILT_WH, 12); c.clip();
      c.fillStyle = UX.surface; c.fillRect(0, 0, TILT_WW, TILT_WH);
      c.fillStyle = UX.surface2; c.fillRect(0, 0, TILT_WW, 20);
      for (let i = 0; i < 3; i++) { c.fillStyle = UX.line2; c.beginPath(); c.arc(13 + i * 11, 10, 3.5, 0, TAU); c.fill(); }
      [['月收入', '¥48万'], ['注册数', '1,284'], ['回访率', '62%']].forEach(([a, b], i) => {
        const x = 10 + i * 85; c.fillStyle = UX.surface2; rr(c, x, 28, 80, 36, 8); c.fill();
        txt(c, a, x + 7, 41, `800 8px ${SANS}`, UX.ink3); txt(c, b, x + 7, 58, `900 13px ${SANS}`, UX.ink);
      });
      c.strokeStyle = UX.line; c.lineWidth = 1;
      for (let y = 72; y < 142; y += 16) { c.beginPath(); c.moveTo(10, y + 0.5); c.lineTo(TILT_WW - 10, y + 0.5); c.stroke(); }
      c.restore();
      c.strokeStyle = UX.line; c.lineWidth = 1; rr(c, 0.5, 0.5, TILT_WW - 1, TILT_WH - 1, 12); c.stroke();
    }
    const g = TILT_BUF.getContext('2d');
    g.save(); g.clearRect(0, 0, TILT_WW * 2, TILT_WH * 2); g.drawImage(TILT_CHROME, 0, 0); g.scale(2, 2);
    g.save(); rr(g, 0, 0, TILT_WW, TILT_WH, 12); g.clip();
    const bw = (TILT_WW - 28 - 7 * 6) / 8;
    TILT_H.forEach((hv, i) => {
      const q = TILT_bar(clamp((u - tch - i * 0.05) / 0.7));
      const v = full ? mix(0.15, hv, q) : (tch > 0 ? mix(hv, 0.15, q) : 0.15), bh = 66 * v, x = 14 + i * (bw + 6);
      const bg = g.createLinearGradient(0, 142 - bh, 0, 142); bg.addColorStop(0, UX.accent); bg.addColorStop(1, 'rgba(106,87,242,.45)');
      g.fillStyle = bg; rr(g, x, 142 - bh, bw, bh + 4, 4); g.fill();
    });
    g.restore();
    g.restore();
    // 透视：绕窗口顶边 rotateX（底边朝观者），先缩放与上移；按 16 条水平条带贴图
    const P = 900, N = 16, proj = yl => { const y = yl * sc, z = y * Math.sin(ang), s = P / (P - z); return [TILT_TOP + (ty * sc + y * Math.cos(ang)) * s, s]; };
    const [yb, sb] = proj(TILT_WH);
    // 阴影：0 sy sb −12px
    k.save(); k.shadowColor = 'rgba(40,30,80,.3)'; k.shadowBlur = (20 + 34 * e) * 0.5; k.shadowOffsetY = (10 + 24 * e) * 0.6;
    const wb = TILT_WW * sc * sb, wt = TILT_WW * sc, yt = proj(0)[0];
    k.fillStyle = UX.surface; k.beginPath(); k.moveTo(TILT_CX - wt / 2 + 12, yt + 6); k.lineTo(TILT_CX + wt / 2 - 12, yt + 6); k.lineTo(TILT_CX + wb / 2 - 12, yb - 4); k.lineTo(TILT_CX - wb / 2 + 12, yb - 4); k.closePath(); k.fill();
    k.restore();
    for (let i = 0; i < N; i++) {
      const a = i / N * TILT_WH, b = (i + 1) / N * TILT_WH, [y0, s0] = proj(a), [y1, s1] = proj(b), ww = TILT_WW * sc * (s0 + s1) / 2;
      k.drawImage(TILT_BUF, 0, a * 2, TILT_WW * 2, (b - a) * 2, TILT_CX - ww / 2, y0, ww, y1 - y0 + 0.6);
    }
    // 「滚动」提示：未滚动时显示（scrollTop > 8 即隐藏，.3 秒），箭头 1.6 秒上下 4px
    const ho = p * 210 > 8 ? 0 : 1, bob = 2 - 2 * Math.cos(TAU * 4 * u / CYC);
    if (ho) {
      txt(k, '滚动', 470, 188, `800 9.5px ${SANS}`, UX.ink3, 'center');
      k.strokeStyle = UX.ink3; k.lineWidth = 1.8; k.lineCap = 'round'; k.lineJoin = 'round';
      k.beginPath(); k.moveTo(466, 192 + bob); k.lineTo(470, 196 + bob); k.lineTo(474, 192 + bob); k.stroke();
    }
    scrollbar(k, p, 0.4, CW - 8);
  };

  // @element 17
  // 17 星空跃迁：280 颗星从中心朝镜头飞来（焦距 150，按 1−z 变亮变粗）；指针 1.2 秒按住「按住跃迁」，速度以每秒剩 25% 的指数逼近 3.2（巡航 0.22），
  // 星星拉成长线并偏蓝（蓝度 = (v−.22)/1.6），中心泛起 120px 蓝色光晕；3.6 秒松开后以每秒剩 12% 回落到巡航。指针位置让航向偏移（x×70、y×60）。总行程取整，星星循环无缝
  const WARP_N = 280;
  const WARP_SIM = (() => {
    // 120 步/秒模拟速度 v 与航向 steer，积分得到总行程 D；按 D 的整数倍缩放 → 循环无缝
    const S = 768, dt = CYC / S, V = new Float32Array(S + 1), D = new Float32Array(S + 1), SX = new Float32Array(S + 1), SY = new Float32Array(S + 1);
    let v = 0.22, d = 0, sx = 0, sy = 0;
    for (let j = 0; j <= S; j++) {
      const t = j * dt, warp = t >= 1.2 && t < 3.6, [px, py] = WARP_ptr(t), on = t > 0.5 && t < 5.2;
      const ax = on ? (px / CW - 0.5) * 2 : 0, ay = on ? (py / CH - 0.5) * 2 : 0;
      if (j) {
        v += ((warp ? 3.2 : 0.22) - v) * (1 - Math.pow(warp ? 0.25 : 0.12, dt));
        sx += (ax - sx) * (1 - Math.pow(0.05, dt)); sy += (ay - sy) * (1 - Math.pow(0.05, dt));
        d += v * dt;
      }
      V[j] = mix(v, 0.22, resetK(t)); SX[j] = sx * fadeIn(t); SY[j] = sy * fadeIn(t); D[j] = d;
    }
    const f = Math.round(D[S]) / D[S];
    for (let j = 0; j <= S; j++) D[j] *= f;
    return { V, D, SX, SY, S, total: Math.round(D[S]) };
  })();
  function WARP_ptr(t) { return UXA_path([[0, 590, 240], [0.4, 590, 240], [1.1, CW / 2 + 6, 184], [3.7, CW / 2 + 6, 184], [4.2, 380, 70], [4.8, 150, 60], [5.4, 590, 240]], t); }
  const WARP_at = (arr, u) => { const S = WARP_SIM.S, x = clamp(u / CYC) * S, i = Math.min(S - 1, Math.floor(x)); return arr[i] + (arr[i + 1] - arr[i]) * (x - i); };
  CELLS[16] = (k, w, h, u) => {
    k.drawImage(layer('WARP_bg', g => {
      const rg = g.createRadialGradient(CW / 2, CH / 2, 0, CW / 2, CH / 2, CW * 0.7 * 0.7); rg.addColorStop(0, '#0B1230'); rg.addColorStop(1, '#02030A');
      g.fillStyle = rg; g.fillRect(0, 0, CW, CH);
    }), 0, 0);
    const v = WARP_at(WARP_SIM.V, u), D = WARP_at(WARP_SIM.D, u), M = WARP_SIM.total;
    const ox = CW / 2 + WARP_at(WARP_SIM.SX, u) * 70, oy = CH / 2 + WARP_at(WARP_SIM.SY, u) * 60, f = 150, blue = Math.min(1, Math.max(0, (v - 0.22) / 1.6));
    // 拖尾长度：原作上一帧 z + v×0.03，再加跃迁时 .35 透明残影 → 用 v×(0.05 + 0.08×blue)
    const tail = v * (0.05 + 0.08 * blue);
    k.lineCap = 'round';
    for (let i = 0; i < WARP_N; i++) {
      // z 每走完 1 个单位重生一次；重生序号对 M 取模 → 位置随序号变化但整周期一致
      const ph = hash(i * 3 + 1) + D, n = Math.floor(ph), z = 1 - (ph - n) * 0.98, sd = i * 97 + ((n % M) + M) % M * 13;
      const sx = (hash(sd + 1) - 0.5) * 2.8, sy = (hash(sd + 2) - 0.5) * 1.6, c = hash(sd + 3);
      const x = ox + sx / z * f, y = oy + sy / z * f;
      if (x < -20 || x > CW + 20 || y < -20 || y > CH + 20) continue;
      const pz = Math.min(1.02, z + tail), px = ox + sx / pz * f, py = oy + sy / pz * f;
      const a = Math.min(1, (1 - z) * 1.4), lw = Math.max(0.6, (1 - z) * 2.6);
      k.strokeStyle = `rgba(${Math.round(255 - blue * 120 * c)},${Math.round(255 - blue * 40)},255,${a.toFixed(2)})`; k.lineWidth = lw;
      k.beginPath(); k.moveTo(px, py); k.lineTo(x + 0.01, y); k.stroke();
    }
    if (blue > 0.05) glow(k, ox, oy, 120, '120,190,255', 0.25 * blue);
    // HUD：模式标签 + 倍速
    const warp = u >= 1.2 && u < 3.6;
    k.fillStyle = warp ? '#4DABF7' : 'rgba(255,255,255,.12)'; rr(k, 18, 16, 40, 22, 11); k.fill();
    txt(k, warp ? '跃迁' : '巡航', 38, 27.5, `700 12px ${SANS}`, warp ? '#03122B' : '#FFFFFF', 'center', 'middle');
    txt(k, '×' + (v / 0.22).toFixed(1), 66, 28, `700 12px ${MONO}`, '#FFFFFF', 'left', 'middle');
    // 按钮：按住时变蓝并缩到 .96
    k.save(); k.translate(CW / 2, 184); const bs = warp ? 0.96 : 1; k.scale(bs, bs);
    k.fillStyle = warp ? 'rgba(77,171,247,.35)' : 'rgba(255,255,255,.1)'; rr(k, -50, -15, 100, 30, 15); k.fill();
    k.strokeStyle = 'rgba(255,255,255,.25)'; k.lineWidth = 1; rr(k, -49.5, -14.5, 99, 29, 15); k.stroke();
    txt(k, '按住跃迁', 0, 1, `800 12.5px ${SANS}`, '#FFFFFF', 'center', 'middle'); k.restore();
    const [px, py] = WARP_ptr(u);
    cursor(k, px, py, pingPong(u, 1.1, 1.2, 3.6, 3.7), false);
  };

  // @element 18
  // 18 粒子连线网：72 个点缓慢漂移（约 12 px/s 的闭合小轨迹），相距 72px 内连淡线（色相 210+x/宽×90，透明度 (1−d/72)×.45）；
  // 指针 0.6 秒进入后成为一个节点，120px 内连亮黄线（255,224,130，(1−d/120)×.8）并把点轻轻吸过来；2.8 秒按下在该处炸出 9 个新点（60–130 px/s，超 30 px/s 按每秒 1.5 衰减，出生 .6 秒内半径由 4 缩到 1.6），左上角显示当前连线数
  const MESH_LINK = 72, MESH_PL = 120;
  const MESH_P = Array.from({ length: 72 }, (_, i) => ({ x: 8 + hash(i * 5 + 1) * (CW - 16), y: 8 + hash(i * 5 + 2) * (CH - 16), ax: 6 + hash(i * 5 + 3) * 8, ay: 5 + hash(i * 5 + 4) * 7, n: 1 + (i % 2), ph: hash(i * 5 + 5) * TAU, ph2: hash(i * 5 + 6) * TAU }));
  const MESH_BURST = 2.8;
  const MESH_ptr = u => UXA_path([[0, 590, 240], [0.6, 560, 200], [1.6, 380, 110], [2.8, 250, 96], [3.0, 250, 96], [4.0, 140, 70], [4.8, 90, 140], [5.6, -40, 240], [6.4, -40, 240]], u);
  const MESH_on = u => clamp(seg(u, 0.5, 1.0)) * (1 - clamp(seg(u, 5.0, 5.5)));
  // 反射折叠：让炸出的点在卡片内反弹
  const MESH_fold = (v, L) => { const m = ((v % (2 * L)) + 2 * L) % (2 * L); return m > L ? 2 * L - m : m; };
  CELLS[17] = (k, w, h, u) => {
    k.drawImage(layer('MESH_bg', g => {
      g.fillStyle = '#0A0D1F'; g.fillRect(0, 0, CW, CH);
      g.save(); g.translate(CW * 0.2, 0); g.scale(1, 0.9 * CH / (1.2 * CW) * 2.2);
      const rg = g.createRadialGradient(0, 0, 0, 0, 0, CW * 0.72); rg.addColorStop(0, '#1E2552'); rg.addColorStop(1, 'rgba(30,37,82,0)');
      g.fillStyle = rg; g.fillRect(-CW, -CW, CW * 3, CW * 3); g.restore();
    }), 0, 0);
    const on = MESH_on(u), [mx, my] = MESH_ptr(u);
    const pts = MESH_P.map(p => {
      let x = p.x + p.ax * Math.sin(TAU * p.n * u / CYC + p.ph), y = p.y + p.ay * Math.sin(TAU * p.n * u / CYC + p.ph2);
      if (on > 0) { const dx = mx - x, dy = my - y, d = Math.hypot(dx, dy); if (d < MESH_PL && d > 12) { const g = 16 * (1 - d / MESH_PL) * on; x += dx / d * g; y += dy / d * g; } }
      return [x, y, 1.6];
    });
    // 炸出的 9 个点：s 为初速，t 秒后的路程 = 30t + (s−30)(1−e^(−1.5t))/1.5；复位段淡出
    if (u >= MESH_BURST) {
      const t = u - MESH_BURST, [bx, by] = MESH_ptr(MESH_BURST), fade = fadeIn(u);
      for (let j = 0; j < 9; j++) {
        const a = j / 9 * TAU + hash(j + 300) * 0.4, s = 60 + hash(j + 310) * 70, dist = 30 * t + (s - 30) * (1 - Math.exp(-1.5 * t)) / 1.5;
        if (fade > 0.02) pts.push([MESH_fold(bx + Math.cos(a) * dist, CW), MESH_fold(by + Math.sin(a) * dist, CH), t < 0.6 ? 1.6 + (1 - t / 0.6) * 2.4 : 1.6, fade]);
      }
    }
    let links = 0;
    k.lineWidth = 1;
    for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) {
      const dx = pts[a][0] - pts[b][0], dy = pts[a][1] - pts[b][1];
      if (Math.abs(dx) > MESH_LINK || Math.abs(dy) > MESH_LINK) continue;
      const d = Math.hypot(dx, dy); if (d > MESH_LINK) continue;
      links++;
      const al = (1 - d / MESH_LINK) * 0.45 * (pts[a][3] ?? 1) * (pts[b][3] ?? 1);
      k.strokeStyle = `hsla(${(210 + pts[a][0] / CW * 90).toFixed(0)},90%,75%,${al.toFixed(2)})`;
      k.beginPath(); k.moveTo(pts[a][0], pts[a][1]); k.lineTo(pts[b][0], pts[b][1]); k.stroke();
    }
    if (on > 0.01) {
      k.lineWidth = 1.3;
      for (const p of pts) {
        const d = Math.hypot(p[0] - mx, p[1] - my); if (d > MESH_PL) continue;
        links++;
        k.strokeStyle = `rgba(255,224,130,${((1 - d / MESH_PL) * 0.8 * on).toFixed(2)})`;
        k.beginPath(); k.moveTo(mx, my); k.lineTo(p[0], p[1]); k.stroke();
      }
      k.globalAlpha = on; k.fillStyle = '#FFE082'; k.beginPath(); k.arc(mx, my, 3.5, 0, TAU); k.fill(); k.globalAlpha = 1;
    }
    k.fillStyle = '#E7ECFF';
    for (const p of pts) { k.globalAlpha = p[3] ?? 1; k.beginPath(); k.arc(p[0], p[1], p[2], 0, TAU); k.fill(); }
    k.globalAlpha = 1;
    k.fillStyle = 'rgba(255,255,255,.1)'; rr(k, 14, 12, 92, 22, 11); k.fill();
    txt(k, `${links} 条连线`, 60, 23.5, `700 11.5px ${MONO}`, '#C5D0FF', 'center', 'middle');
    ripple(k, mx, my, (u - MESH_BURST) / 0.5, '255,224,130');
    cursor(k, mx, my, pingPong(u, MESH_BURST - 0.1, MESH_BURST, MESH_BURST + 0.02, MESH_BURST + 0.16), false);
  };

  // @element 19
  // 19 点阵涟漪：17px 间距的点阵（静止时 ink-3、55% 透明）；指针划过时每 110ms 在经过处投下一圈小涟漪（振幅 .55），2.4 秒按下投下大波（振幅 1.6）；
  // 波前以 170 px/s 扩散，波形 sin(k/14)·e^(k/60)，按 e^(−1.3·年龄) 衰减、2.6 秒消失，同时最多 14 道；隆起的点变大（1.6+m×3.4）、上浮 m×3 并由蓝紫转到青绿（色相 230−m×110）。上一周期的余波计入，循环无缝
  const DOTW_GAP = 17;
  const DOTW_DOTS = (() => { const d = []; for (let y = 12; y < CH - 4; y += DOTW_GAP) for (let x = 14; x < CW - 4; x += DOTW_GAP) d.push([x, y]); return d; })();
  const DOTW_ptr = u => UXA_path([[0, 590, 240], [0.4, 520, 170], [1.4, 360, 60], [2.4, 270, 110], [2.6, 270, 110], [3.6, 130, 150], [4.4, 60, 60], [5.0, -40, -40], [6.4, -40, -40]], u);
  const DOTW_WAVES = (() => {
    const W = [];
    for (let t = 0.45; t < 4.95; t += 0.11) { const [x, y] = DOTW_ptr(t); if (x > 0 && x < CW && y > 0 && y < CH) W.push([t, x, y, 0.55]); }
    W.push([2.4, 270, 110, 1.6]);
    return W.sort((a, b) => a[0] - b[0]);
  })();
  CELLS[18] = (k, w, h, u) => {
    k.fillStyle = UX.surface; k.fillRect(0, 0, CW, CH);
    // 当前存活的波（含上一周期，年龄 < 2.6 秒），只保留最近 14 道
    const live = [];
    for (const wv of DOTW_WAVES) for (const off of [0, CYC]) { const age = u - wv[0] + off; if (age >= 0 && age < 2.6) live.push([age, wv[1], wv[2], wv[3]]); }
    live.sort((a, b) => a[0] - b[0]); live.length = Math.min(live.length, 14);
    for (const d of DOTW_DOTS) {
      let hsum = 0;
      for (const [age, x, y, a] of live) {
        const kk = Math.hypot(d[0] - x, d[1] - y) - age * 170;
        if (kk > 0 || kk < -90) continue;
        hsum += Math.sin(kk / 14) * Math.exp(kk / 60) * a * Math.exp(-age * 1.3);
      }
      const m = clamp(hsum, -1, 1.6), calm = Math.abs(m) < 0.04;
      k.globalAlpha = calm ? 0.55 : 1;
      k.fillStyle = calm ? UX.ink3 : `hsl(${(230 - Math.max(0, m) * 110).toFixed(0)} 85% ${(58 - Math.min(0, m) * 10).toFixed(0)}%)`;
      k.beginPath(); k.arc(d[0], d[1] - m * 3, 1.6 + Math.max(0, m) * 3.4, 0, TAU); k.fill();
    }
    k.globalAlpha = 1;
    const [px, py] = DOTW_ptr(u);
    cursor(k, px, py, pingPong(u, 2.3, 2.4, 2.42, 2.56));
  };

  // @element 20
  // 20 粒子聚合成字：720 颗光点以弹簧（刚度 38、阻尼 7.5）聚成单词，叠加发光（lighter），速度越快越偏暖越亮；不在字上的光点散在外圈（透明度 .18）。
  // 指针 0.6–1.5 秒划过字面把光点推开（60px 内）；1.8 秒点击换成 NICE、3.6 秒换成 LUCIAN，每次给所有光点 ±130 px/s 的随机冲量；5.4 秒回到 HELLO，6.0–6.4 秒精确归位
  const PWORD_WORDS = ['HELLO', 'NICE', 'LUCIAN'];
  const PWORD_FONT = { H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'], E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'], L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'], O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'], N: ['10001', '11001', '11001', '10101', '10011', '10011', '10001'], I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'], C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'], U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'], A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'] };
  const PWORD_N = 720, PWORD_CELL = 12, PWORD_EV = [[1.8, 1], [3.6, 2], [5.4, 0]];
  const PWORD_W2 = 38, PWORD_C = 7.5, PWORD_AL = PWORD_C / 2, PWORD_WD = Math.sqrt(PWORD_W2 - PWORD_AL * PWORD_AL);
  // 每个词的目标点：5×7 点阵字，每格 3×3 个点（间距 4px，抖动 ±.75），确定性洗牌；不在字上的点放到外圈椭圆
  const PWORD_T = PWORD_WORDS.map((wd, wi) => {
    const cols = wd.length * 6 - 1, x0 = CW / 2 - cols * PWORD_CELL / 2, y0 = CH / 2 - 7 * PWORD_CELL / 2, pts = [];
    Array.from(wd).forEach((ch, li) => PWORD_FONT[ch].forEach((row, r) => Array.from(row).forEach((b, c) => {
      if (b !== '1') return;
      for (let a = 0; a < 3; a++) for (let bb = 0; bb < 3; bb++) pts.push([x0 + (li * 6 + c) * PWORD_CELL + 2 + a * 4, y0 + r * PWORD_CELL + 2 + bb * 4]);
    })));
    for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(hash(wi * 9000 + i) * (i + 1)); const t = pts[i]; pts[i] = pts[j]; pts[j] = t; }
    return Array.from({ length: PWORD_N }, (_, i) => {
      if (i < pts.length) return [pts[i][0] + (hash(wi * 7000 + i) - 0.5) * 1.5, pts[i][1] + (hash(wi * 7100 + i) - 0.5) * 1.5, 1];
      const a = hash(wi * 7200 + i) * TAU, r = 1 + hash(wi * 7300 + i) * 0.4;
      return [CW / 2 + Math.cos(a) * 200 * r, CH / 2 + Math.sin(a) * 78 * r, 0];
    });
  });
  // 阻尼弹簧闭式解：位移 d、速度 v0 经过 t 秒后的 [位移, 速度]
  const PWORD_spr = (d, v0, t) => {
    const e = Math.exp(-PWORD_AL * t), c = Math.cos(PWORD_WD * t), s = Math.sin(PWORD_WD * t), B = (v0 + PWORD_AL * d) / PWORD_WD;
    return [e * (d * c + B * s), e * (-PWORD_AL * (d * c + B * s) + (-d * PWORD_WD * s + B * PWORD_WD * c))];
  };
  // 每个事件开始时每颗点的位移与速度（链式计算一次）
  const PWORD_ST = (() => {
    const st = [];
    let prev = PWORD_T[0].map(() => [0, 0, 0, 0]), tp = 0, wp = 0;   // [dx, dy, vx, vy]（相对当前目标）
    PWORD_EV.forEach(([t, wi], ei) => {
      const cur = PWORD_T[wi].map((T, i) => {
        const [dx, vx] = PWORD_spr(prev[i][0], prev[i][2], t - tp), [dy, vy] = PWORD_spr(prev[i][1], prev[i][3], t - tp);
        const P = PWORD_T[wp][i];
        return [P[0] + dx - T[0], P[1] + dy - T[1], vx + (hash(ei * 5000 + i * 2) - 0.5) * 260, vy + (hash(ei * 5000 + i * 2 + 1) - 0.5) * 260];
      });
      st.push(cur); prev = cur; tp = t; wp = wi;
    });
    return st;
  })();
  const PWORD_ptr = u => UXA_path([[0, 590, 240], [0.4, 520, 200], [0.9, 340, 96], [1.5, 200, 112], [1.8, 200, 112], [2.4, 330, 180], [3.4, 400, 178], [3.6, 400, 178], [4.4, 590, 240], [6.4, 590, 240]], u);
  const PWORD_HUE = Array.from({ length: PWORD_N }, (_, i) => 250 + hash(i + 8000) * 80);
  CELLS[19] = (k, w, h, u) => {
    k.drawImage(layer('PWORD_bg', g => {
      g.fillStyle = '#0A0716'; g.fillRect(0, 0, CW, CH);
      g.save(); g.translate(CW / 2, CH * 0.45); g.scale(1, 0.7 * CH / (0.9 * CW) * 2.6);
      const rg = g.createRadialGradient(0, 0, 0, 0, 0, CW * 0.9 * 0.7 / 1.4); rg.addColorStop(0, '#22144A'); rg.addColorStop(1, 'rgba(34,20,74,0)');
      g.fillStyle = rg; g.fillRect(-CW, -CW, CW * 2, CW * 2); g.restore();
    }), 0, 0);
    let ei = -1; for (let j = 0; j < PWORD_EV.length; j++) if (u >= PWORD_EV[j][0]) ei = j;
    const wi = ei < 0 ? 0 : PWORD_EV[ei][1], T = PWORD_T[wi], t = ei < 0 ? 0 : u - PWORD_EV[ei][0];
    const settle = inOut3(seg(u, 6.0, CYC));             // 周期末把残余振动精确归零
    const [mx, my] = PWORD_ptr(u), push = clamp(seg(u, 0.5, 0.8)) * (1 - clamp(seg(u, 1.5, 1.9)));
    k.globalCompositeOperation = 'lighter';
    for (let i = 0; i < PWORD_N; i++) {
      let x = T[i][0], y = T[i][1], sp = 0;
      if (ei >= 0) {
        const S = PWORD_ST[ei][i], [dx, vx] = PWORD_spr(S[0], S[2], t), [dy, vy] = PWORD_spr(S[1], S[3], t);
        x += dx * (1 - settle); y += dy * (1 - settle); sp = Math.min(1, Math.hypot(vx, vy) / 300) * (1 - settle);
      }
      if (push > 0) {
        const dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
        if (d2 < 3600) { const d = Math.sqrt(d2) + 0.01, f = (1 - d2 / 3600) * 26 * push; x += dx / d * f; y += dy / d * f; }
      }
      k.fillStyle = `hsla(${(PWORD_HUE[i] - sp * 60).toFixed(0)},90%,${(68 + sp * 20).toFixed(0)}%,${T[i][2] ? 0.9 : 0.18})`;
      k.fillRect(x - 1.3, y - 1.3, 2.6, 2.6);
    }
    k.globalCompositeOperation = 'source-over';
    let press = 0; for (const [tt] of PWORD_EV.slice(0, 2)) press = Math.max(press, pingPong(u, tt - 0.1, tt, tt + 0.02, tt + 0.16));
    for (const [tt] of PWORD_EV.slice(0, 2)) { const [rx, ry] = PWORD_ptr(tt); ripple(k, rx, ry, (u - tt) / 0.5, '183,164,255'); }
    cursor(k, mx, my, press, false);
  };

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

  // @element 21
  // 21 光标聚光边框：暗色底 #0A0B10 上一行四张功能卡；模拟指针 0.3–4.9 秒自左向右波浪形横扫（竖向 1.5 个正弦周期），
  // 以指针为圆心的 160px 光晕（rgba(132,94,247) → 40% 处 rgba(77,171,247,.5) → 70% 透明）同时点亮相邻卡片的 1.5px 描边，
  // 卡内叠 220px、.14 强度的淡紫光；进入后亮度以 8/秒逼近 1，离开后以 2.5/秒缓慢熄灭（原作逐帧缓动改写为指数解析式）。
  const CSB_CARDS = [['极速部署', '一次推送，全球生效'], ['实时分析', '数字即时跳动'], ['安全登录', '无需密码即可登录'], ['自动扩容', '从容应对高峰']];
  const CSB_X0 = 14, CSB_G = 10, CSB_W = (CW - 28 - 30) / 4, CSB_Y = 14, CSB_H = CH - 28;
  // 指针 x = -30 + 600·s（s 为 0.3→4.9 秒进度）：s=0.05 进入画面、s≈0.948 离开
  const CSB_TIN = 0.3 + (30 / 600) * 4.6, CSB_TOUT = 0.3 + (569 / 600) * 4.6;
  function CSB_icon(k, i, x, y) {
    // 原作 24 单位 viewBox 的图标，缩放到 16px 放进 30px 图标框
    k.save(); k.translate(x + 7, y + 7); k.scale(16 / 24, 16 / 24); k.lineCap = 'round'; k.lineJoin = 'round';
    if (i === 0) { k.fillStyle = '#B197FC'; k.beginPath(); k.moveTo(5, 19); k.lineTo(12, 5); k.lineTo(19, 19); k.lineTo(12, 16); k.closePath(); k.fill(); }
    else if (i === 1) { k.strokeStyle = '#74C0FC'; k.lineWidth = 2.2; k.beginPath(); k.moveTo(4, 18); k.lineTo(4, 9); k.moveTo(10, 18); k.lineTo(10, 5); k.moveTo(16, 18); k.lineTo(16, 12); k.moveTo(22, 18); k.lineTo(2, 18); k.stroke(); }
    else if (i === 2) { k.fillStyle = '#63E6BE'; k.beginPath(); k.moveTo(12, 3); k.lineTo(19, 6); k.lineTo(19, 11); k.bezierCurveTo(19, 16, 16, 19, 12, 21); k.bezierCurveTo(8, 19, 5, 16, 5, 11); k.lineTo(5, 6); k.closePath(); k.fill(); }
    else { k.strokeStyle = '#FFA94D'; k.lineWidth = 2.2; k.beginPath(); k.moveTo(4, 14); k.lineTo(8, 10); k.lineTo(12, 14); k.lineTo(20, 6); k.moveTo(14, 6); k.lineTo(20, 6); k.lineTo(20, 12); k.stroke(); }
    k.restore();
  }
  CELLS[20] = (k, w, h, u) => {
    k.fillStyle = '#0A0B10'; k.fillRect(0, 0, CW, CH);
    const s = seg(u, 0.3, 4.9), px = -30 + 600 * s, py = 104 + 50 * Math.sin(s * TAU * 1.5);
    let o = 0;
    if (u >= CSB_TIN && u < CSB_TOUT) o = 1 - Math.exp(-8 * (u - CSB_TIN));
    else if (u >= CSB_TOUT) o = (1 - Math.exp(-8 * (CSB_TOUT - CSB_TIN))) * Math.exp(-2.5 * (u - CSB_TOUT)) * (1 - seg(u, 6.0, 6.4));
    for (let i = 0; i < 4; i++) {
      const x = CSB_X0 + i * (CSB_W + CSB_G), y = CSB_Y;
      // 外层 = 1.5px 描边：底色 rgba(255,255,255,.08) + 跨卡共享的同一盏"灯"
      rr(k, x, y, CSB_W, CSB_H, 18); k.fillStyle = 'rgba(255,255,255,.08)'; k.fill();
      if (o > 0.003) {
        const g = k.createRadialGradient(px, py, 0, px, py, 160);
        g.addColorStop(0, `rgba(132,94,247,${o})`); g.addColorStop(0.4, `rgba(77,171,247,${o * 0.5})`); g.addColorStop(0.7, 'rgba(77,171,247,0)');
        k.fillStyle = g; k.fill();
      }
      rr(k, x + 1.5, y + 1.5, CSB_W - 3, CSB_H - 3, 16.5); k.fillStyle = '#12141C'; k.fill();
      if (o > 0.003) {
        const g = k.createRadialGradient(px, py, 0, px, py, 220);
        g.addColorStop(0, `rgba(132,94,247,${o * 0.14})`); g.addColorStop(0.6, 'rgba(132,94,247,0)');
        k.fillStyle = g; k.fill();
      }
      rr(k, x + 14, y + 14, 30, 30, 10); k.fillStyle = 'rgba(255,255,255,.06)'; k.fill();
      k.strokeStyle = 'rgba(255,255,255,.08)'; k.lineWidth = 1; k.stroke();
      CSB_icon(k, i, x + 14, y + 14);
      txt(k, CSB_CARDS[i][0], x + 14, y + CSB_H - 34, UXB_f(800, 13.5), '#E9ECF5');
      txt(k, CSB_CARDS[i][1], x + 14, y + CSB_H - 16, UXB_f(600, 10.5), '#8A90A6');
    }
    if (px > -20 && px < CW + 4) cursor(k, px, py);
  };

  // @element 22
  // 22 悬停跟随预览图：#111 暗底作品列表（6 行大字项目名）；指针 0.3 秒从上方进入，0.8–4.8 秒逐行向下停留并左右游走，5.0 秒从底部离开。
  // 悬停行右移 10px（.35s 回弹）并亮起箭头，其余行变暗 #5C5852（.25s）；预览图（渐变色块画的缩略图）在指针右侧 18px、
  // 滞后约 0.11 秒跟随，按水平速度×0.02 倾斜（±12°）；换行时图片带 .5s cubic-bezier(.6,0,.2,1) 上下滑到下一张；出现 .25s 淡入 + .6→1 回弹缩放。
  const HFP_WK = [['House of Wind', '建筑', '2026'], ['Salt Studio', '品牌', '2025'], ['Night Library', '应用', '2025'], ['Blue Garden', '展览', '2024'], ['Paper Workshop', '包装', '2024'], ['Slow Post Office', '网页', '2023']];
  const HFP_ART = [['city', '#DEE2E6', '#868E96', '#343A40'], ['sea', '#FFFFFF', '#CED4DA', '#ADB5BD'], ['night', '#1B1F3B', '#FFE066'], ['sky', '#A5D8FF', '#2F9E44', '#1E6B30'], ['split', '#F8F0E3', '#D9B482', '#B08A55'], ['sun', '#FFA8A8', '#C92A2A', '#FFE3E3']];
  const HFP_TOP = 30, HFP_RH = 29, HFP_PW = 84, HFP_PH = 105;
  const HFP_ry = r => HFP_TOP + HFP_RH * (r + 0.5);
  const HFP_KEYS = [[0.3, 250, -16], [0.8, 230, HFP_ry(0)], [1.25, 290, HFP_ry(0) + 3], [1.55, 270, HFP_ry(1)], [2.0, 330, HFP_ry(1) - 2], [2.3, 300, HFP_ry(2)], [2.7, 250, HFP_ry(2) + 3], [3.0, 280, HFP_ry(3)], [3.4, 340, HFP_ry(3)], [3.7, 310, HFP_ry(4)], [4.1, 260, HFP_ry(4) + 2], [4.4, 290, HFP_ry(5)], [4.8, 330, HFP_ry(5)], [5.2, 350, CH + 26]];
  const HFP_row = p => (p[0] >= 18 && p[0] <= CW - 18 && p[1] >= HFP_TOP && p[1] < HFP_TOP + HFP_RH * 6 ? Math.floor((p[1] - HFP_TOP) / HFP_RH) : -1);
  const HFP_EV = UXB_changes(u => HFP_row(UXB_path(u, HFP_KEYS)));
  const HFP_ON = [0, 1, 2, 3, 4, 5].map(r => [[-1, 0], ...HFP_EV.slice(1).map(([t, v]) => [t, v === r ? 1 : 0])]);
  const HFP_ANY = [[-1, 0], ...HFP_EV.slice(1).map(([t, v]) => [t, v >= 0 ? 1 : 0])];
  const HFP_STRIP = [[-1, 0], ...HFP_EV.slice(1).filter(e => e[1] >= 0)];
  CELLS[21] = (k, w, h, u) => {
    k.fillStyle = '#111111'; k.fillRect(0, 0, CW, CH);
    txt(k, 'SELECTED WORK', 20, 21, UXB_f(750, 9.5), '#8D8880');
    txt(k, '2023—26', CW - 20, 21, UXB_f(750, 9.5), '#8D8880', 'right');
    k.fillStyle = '#2A2826';
    for (let r = 0; r <= 6; r++) k.fillRect(18, HFP_TOP + r * HFP_RH, CW - 36, 1);
    const any = UXB_ramp(u, HFP_ANY, 0.25, x => x);
    for (let r = 0; r < 6; r++) {
      const on = UXB_ramp(u, HFP_ON[r], 0.25, x => x), sh = 10 * UXB_ramp(u, HFP_ON[r], 0.35, backOut);
      const y = HFP_TOP + r * HFP_RH, col = rgba(lerpC([242, 239, 234], [92, 88, 82], any * (1 - on)), 1);
      txt(k, HFP_WK[r][0], 20 + sh, y + 21, UXB_f(800, 16), col);
      txt(k, `${HFP_WK[r][1]} · ${HFP_WK[r][2]}`, CW - 46 + sh, y + 19, UXB_f(650, 9.5), '#8D8880', 'right');
      if (on > 0.01) { k.save(); k.globalAlpha = on; txt(k, '→', CW - 38 + sh - 8 * (1 - on), y + 20, UXB_f(700, 14), '#F2EFEA'); k.restore(); }
    }
    const vis = any;
    if (vis > 0.01) {
      const sc = 0.6 + 0.4 * UXB_ramp(u, HFP_ANY, 0.35, backOut);
      const p = UXB_path(u - 0.11, HFP_KEYS), p2 = UXB_path(u - 0.11 - 1 / 60, HFP_KEYS);
      const tilt = clamp((p[0] - p2[0]) * 60 * 0.02, -12, 12) * Math.PI / 180;
      const x = p[0] + 18, y = clamp(p[1] - HFP_PH / 2, 4, CH - HFP_PH - 4), st = UXB_ramp(u, HFP_STRIP, 0.5, inOut3);
      k.save(); k.globalAlpha = vis; k.translate(x + HFP_PW / 2, y + HFP_PH / 2); k.rotate(tilt); k.scale(sc, sc);
      k.save(); k.shadowColor = 'rgba(0,0,0,.6)'; k.shadowBlur = 22; k.shadowOffsetY = 10;
      rr(k, -HFP_PW / 2, -HFP_PH / 2, HFP_PW, HFP_PH, 6); k.fillStyle = '#222'; k.fill(); k.restore();
      rr(k, -HFP_PW / 2, -HFP_PH / 2, HFP_PW, HFP_PH, 6); k.clip();
      const i0 = Math.floor(st);
      for (let j = Math.max(0, i0); j <= Math.min(5, i0 + 1); j++) UXB_pic(k, -HFP_PW / 2, -HFP_PH / 2 + (j - st) * HFP_PH, HFP_PW, HFP_PH, HFP_ART[j]);
      k.restore();
    }
    const c = UXB_path(u, HFP_KEYS);
    if (u > 0.3 && u < 5.2) cursor(k, c[0], c[1]);
  };

  // @element 23
  // 23 光标图片拖尾：#F4F1EA 底、居中大标题；指针 0.3–2.6 秒自左向右正弦扫过、2.6–3.3 秒回到中间，3.5 秒按下一次（5 张呈扇形散开，
  // 每张间隔 60ms、横向 16px、旋转 12°），3.7–4.6 秒向右离开。指针每移动 46px 落下一张白边照片（旋转 ±12° 随机 + 横移×0.06），
  // .32s 回弹弹入（scale .3→1），存活 0.9 秒（按下的 1.4 秒）后 .45s 缩小下沉淡出；同时最多 14 张。最后一张在 6.2 秒前消失。
  const CPT_ART = [['sky', '#FFB4A2', '#5C7CFA', '#3B5BDB'], ['sun', '#2B8A3E', '#8CE99A', '#FFF3BF'], ['night', '#1B1F3B', '#FCC419'], ['sea', '#FFD8A8', '#E8590C', '#FFF4E6'], ['split', '#E7F5FF', '#748FFC', '#4C6EF5'], ['sky', '#D0BFFF', '#7048E8', '#5F3DC4'], ['sea', '#A5D8FF', '#1864AB', '#E7F5FF'], ['night', '#1A1B4B', '#FFF3BF'], ['sun', '#FFA94D', '#C92A2A', '#FFE8CC'], ['city', '#E3FAFC', '#66D9E8', '#0C8599']];
  const CPT_PW = 58, CPT_PH = 72, CPT_CLICK = 3.5;
  function CPT_ptr(u) {
    if (u < 2.6) { const s = seg(u, 0.3, 2.6); return [-20 + 490 * s, 104 + 62 * Math.sin(s * TAU * 2)]; }
    return UXB_path(u, [[2.6, 470, 104], [3.3, 270, 112], [3.7, 270, 112], [4.6, 570, 60]]);
  }
  // 预先模拟落图表：{t 落下, x, y, r 角度, kill 开始淡出, art}
  const CPT_DROPS = (() => {
    const D = []; let last = null;
    for (let i = Math.round(0.3 * 240); i <= Math.round(4.7 * 240); i++) {
      const t = i / 240, q = CPT_ptr(t);
      if (q[0] < 0 || q[0] > CW || q[1] < 0 || q[1] > CH) { last = null; continue; }
      if (!last) { last = q; continue; }
      if (Math.hypot(q[0] - last[0], q[1] - last[1]) > 46) { D.push({ t, x: q[0], y: q[1], r: (hash(D.length + 3) - 0.5) * 24 + (q[0] - last[0]) * 0.06, life: 0.9 }); last = q; }
    }
    const c = CPT_ptr(CPT_CLICK);
    for (let i = 0; i < 5; i++) D.push({ t: CPT_CLICK + i * 0.06, x: c[0] + (i - 2) * 16, y: c[1] + Math.abs(i - 2) * 4, r: (i - 2) * 12, life: 1.4 });
    D.sort((a, b) => a.t - b.t);
    const live = [];
    D.forEach((d, i) => {
      d.art = i % 10; d.kill = d.t + d.life;
      for (let j = live.length - 1; j >= 0; j--) if (live[j].kill + 0.46 <= d.t) live.splice(j, 1);
      live.push(d);
      if (live.length > 14) { const o = live.shift(); o.kill = Math.min(o.kill, d.t); }
    });
    return D;
  })();
  CELLS[22] = (k, w, h, u) => {
    k.fillStyle = '#F4F1EA'; k.fillRect(0, 0, CW, CH);
    txt(k, '照片里的四季', CW / 2, 112, UXB_f(900, 40), '#1E1B16', 'center');
    txt(k, '移动指针，落下照片', CW / 2, 136, UXB_f(700, 11.5), '#8A8274', 'center');
    for (const d of CPT_DROPS) {
      if (u < d.t || u > d.kill + 0.45) continue;
      let sc, al, dy = 0;
      if (u < d.kill) { const e = seg(u, d.t, d.t + 0.32); sc = 0.3 + 0.7 * backOut(e); al = clamp(e * 1.6); }
      else { const e = seg(u, d.kill, d.kill + 0.45), ei = e * e; sc = 1 - 0.6 * ei; al = 1 - ei; dy = 14 * ei; }
      k.save(); k.globalAlpha = al; k.translate(d.x, d.y + dy); k.rotate(d.r * Math.PI / 180); k.scale(sc, sc);
      k.save(); k.shadowColor = 'rgba(30,27,22,.32)'; k.shadowBlur = 12; k.shadowOffsetY = 6;
      rr(k, -CPT_PW / 2, -CPT_PH / 2, CPT_PW, CPT_PH, 3); k.fillStyle = '#FFFFFF'; k.fill(); k.restore();
      UXB_pic(k, -CPT_PW / 2 + 4, -CPT_PH / 2 + 4, CPT_PW - 8, CPT_PH - 14, CPT_ART[d.art]);
      k.restore();
    }
    const c = CPT_ptr(u);
    ripple(k, c[0], c[1], seg(u, CPT_CLICK, CPT_CLICK + 0.5), '30,27,22');
    if (u > 0.3 && u < 4.6) cursor(k, c[0], c[1], UXB_press(u, CPT_CLICK));
  };

  // @element 24
  // 24 方向感知遮罩：#F1EEE8 底上 3×3 作品格（渐变色块缩略图）；指针 0.3–4.9 秒依次从左、下、左、上、上、右等不同方向穿过 8 个格子。
  // 进入某格时，深色说明面板 rgba(20,18,30,.82) 从指针越过的那条边滑入覆盖（.32s cubic-bezier(.3,.8,.3,1)），离开时朝指针离开的方向滑出；
  // 判断方向用原作算法：指针相对格中心的偏移按格宽高归一化，比较 |dx| 与 |dy|。
  const DAO_TT = [['House of Wind', '建筑'], ['Salt Studio', '品牌'], ['Night Library', '应用'], ['Blue Garden', '展览'], ['Paper Workshop', '包装'], ['Slow Post', '网页'], ['Sea Cinema', '电影'], ['Little Bakery', '品牌'], ['Forest Sounds', '音乐']];
  const DAO_ART = [['city', '#ADB5BD', '#343A40', '#212529'], ['sea', '#F8F9FA', '#CED4DA', '#ADB5BD'], ['night', '#1B1F3B', '#FFE066'], ['sky', '#A5D8FF', '#2F9E44', '#237032'], ['split', '#F8F0E3', '#D9B482'], ['sun', '#FFA8A8', '#C92A2A', '#FFE3E3'], ['sea', '#1864AB', '#0B3D91', '#FCC419'], ['sun', '#FFE8CC', '#E8590C', '#FFF4E6'], ['sky', '#B2F2BB', '#087F5B', '#0B5E46']];
  const DAO_P = 12, DAO_G = 7, DAO_W = (CW - 2 * DAO_P - 2 * DAO_G) / 3, DAO_H = (CH - 2 * DAO_P - 2 * DAO_G) / 3;
  const DAO_xy = i => [DAO_P + (i % 3) * (DAO_W + DAO_G), DAO_P + Math.floor(i / 3) * (DAO_H + DAO_G)];
  const DAO_KEYS = [[0.3, -20, 104], [0.9, 95, 104], [1.4, 270, 100], [1.9, 268, 38], [2.4, 440, 36], [2.9, 445, 104], [3.4, 440, 172], [3.9, 265, 170], [4.4, 95, 172], [4.9, -20, 150]];
  const DAO_at = p => { for (let i = 0; i < 9; i++) { const [x, y] = DAO_xy(i); if (p[0] >= x && p[0] < x + DAO_W && p[1] >= y && p[1] < y + DAO_H) return i; } return -1; };
  const DAO_side = (i, p) => { const [x, y] = DAO_xy(i), dx = (p[0] - x - DAO_W / 2) / DAO_W, dy = (p[1] - y - DAO_H / 2) / DAO_H; return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0); };
  // 每格事件表 [时刻, 1 进入/0 离开, 边 0上1右2下3左]
  const DAO_EV = (() => {
    const E = DAO_TT.map(() => []); let cur = -1;
    for (let i = 0; i <= CYC * 240; i++) {
      const t = i / 240, p = UXB_path(t, DAO_KEYS), o = DAO_at(p);
      if (o === cur) continue;
      if (cur >= 0) E[cur].push([t, 0, DAO_side(cur, p)]);
      if (o >= 0) E[o].push([t, 1, DAO_side(o, p)]);
      cur = o;
    }
    return E;
  })();
  const DAO_OUT = [[0, -1.01], [1.01, 0], [0, 1.01], [-1.01, 0]];
  function DAO_off(u, ev) {
    let fx = 0, fy = -1.01, tx = 0, ty = -1.01, t0 = -1e9;
    for (const [t, show, s] of ev) {
      if (t > u) break;
      const e = uxEase(seg(t, t0, t0 + 0.32)), cx = mix(fx, tx, e), cy = mix(fy, ty, e);
      if (show) { fx = DAO_OUT[s][0]; fy = DAO_OUT[s][1]; tx = 0; ty = 0; } else { fx = cx; fy = cy; tx = DAO_OUT[s][0]; ty = DAO_OUT[s][1]; }
      t0 = t;
    }
    const e = uxEase(seg(u, t0, t0 + 0.32)); return [mix(fx, tx, e), mix(fy, ty, e)];
  }
  CELLS[23] = (k, w, h, u) => {
    k.fillStyle = '#F1EEE8'; k.fillRect(0, 0, CW, CH);
    for (let i = 0; i < 9; i++) {
      const [x, y] = DAO_xy(i);
      k.save(); rr(k, x, y, DAO_W, DAO_H, 10); k.clip();
      UXB_pic(k, x, y, DAO_W, DAO_H, DAO_ART[i]);
      const [ox, oy] = DAO_off(u, DAO_EV[i]);
      if (Math.abs(ox) < 1 && Math.abs(oy) < 1) {
        const X = x + ox * DAO_W, Y = y + oy * DAO_H;
        k.fillStyle = 'rgba(20,18,30,.82)'; k.fillRect(X, Y, DAO_W, DAO_H);
        k.save(); k.globalAlpha = 0.7; txt(k, DAO_TT[i][1], X + 10, Y + DAO_H - 34, UXB_f(650, 9.5), '#FFFFFF'); k.restore();
        txt(k, DAO_TT[i][0], X + 10, Y + DAO_H - 21, UXB_f(800, 12), '#FFFFFF');
        txt(k, '查看 →', X + 10, Y + DAO_H - 8, UXB_f(800, 10), '#FFD8A8');
      }
      k.restore();
    }
    const c = UXB_path(u, DAO_KEYS);
    if (u > 0.3 && u < 4.9) cursor(k, c[0], c[1]);
  };

  // @element 25
  // 25 光标透镜揭示：#F5F1E8 底上两行 58px 粗体句子；指针 0.3 秒进入，圆形窗（半径 54，原作 66 按卡片缩放）以弹簧
  // （刚度 260、阻尼 24）跟随，窗内露出反色 #1D1A16 底的另一句（#FFD43B / #FF8787），快速移动时窗沿速度方向最多拉伸 35%；
  // 2.8 秒点击：窗以 5/秒扩满全卡揭示整句；4.1 秒再点：缩回 54（12/秒）；5.0 秒移出画面窗收为 0。弹簧逐帧积分预先算成 240Hz 表。
  const CLR_KEYS = [[0.3, -20, 150], [0.7, 70, 120], [1.4, 210, 70], [2.0, 330, 140], [2.6, 420, 96], [3.4, 430, 100], [3.9, 300, 120], [4.4, 260, 110], [5.0, 560, 150]];
  const CLR_CLICK = [2.8, 4.1], CLR_R = 54, CLR_FULL = 620;
  const CLR_SIM = (() => {
    const dt = 1 / 240, n = Math.round(CYC / dt) + 1, S = new Float32Array(n * 5);
    let sx = 270, sy = 104, vx = 0, vy = 0, r = 0, rT = 0, full = false, pos = [270, 104], wasIn = false, prev = null;
    for (let i = 0; i < n; i++) {
      const t = i * dt, p = UXB_path(t, CLR_KEYS), inside = p[0] >= 0 && p[0] <= CW && p[1] >= 0 && p[1] <= CH;
      const moved = !prev || p[0] !== prev[0] || p[1] !== prev[1];
      if (inside && moved) { if (!rT && !full) { sx = p[0]; sy = p[1]; } pos = p; if (!full) rT = CLR_R; }
      if (!inside && wasIn && !full) rT = 0;
      for (const c of CLR_CLICK) if (i === Math.round(c * 240)) { full = !full; rT = full ? CLR_FULL : CLR_R; }
      vx += ((pos[0] - sx) * 260 - vx * 24) * dt; vy += ((pos[1] - sy) * 260 - vy * 24) * dt; sx += vx * dt; sy += vy * dt;
      r += (rT - r) * Math.min(1, dt * (full ? 5 : 12));
      S.set([sx, sy, vx, vy, r], i * 5); wasIn = inside; prev = p;
    }
    return S;
  })();
  function CLR_text(g, bg, c1, c2) {
    g.fillStyle = bg; g.fillRect(0, 0, CW, CH);
    const f = UXB_f(900, 58);
    const put = (parts, y) => { let x = 60; g.font = f; for (const [s, c] of parts) { txt(g, s, x, y, f, c); x += g.measureText(s).width; } };
    return put;
  }
  CELLS[24] = (k, w, h, u) => {
    k.drawImage(layer('CLR_A', g => { const put = CLR_text(g, '#F5F1E8'); put([['再普通的按钮', '#1D1A16']], 93); put([['也藏着一个故事', '#1D1A16']], 155); }), 0, 0);
    const i = Math.min(Math.round(u * 240), CLR_SIM.length / 5 - 1) * 5;
    const sx = CLR_SIM[i], sy = CLR_SIM[i + 1], vx = CLR_SIM[i + 2], vy = CLR_SIM[i + 3], r = CLR_SIM[i + 4];
    if (r > 0.5) {
      const spd = Math.min(1, Math.hypot(vx, vy) / 1600), ang = Math.atan2(vy, vx);
      const rx = r * (1 + spd * 0.35 * Math.abs(Math.cos(ang))), ry = r * (1 + spd * 0.35 * Math.abs(Math.sin(ang)));
      k.save(); k.beginPath(); k.ellipse(sx, sy, rx, ry, 0, 0, TAU); k.clip();
      k.drawImage(layer('CLR_B', g => { const put = CLR_text(g, '#1D1A16'); put([['微小的', '#FFD43B'], ['动效', '#FF8787']], 93); put([['也能', '#FFD43B'], ['打动人心', '#FF8787']], 155); }), 0, 0);
      k.restore();
      const ra = clamp((r - 4) / 6) * (1 - clamp((r - CLR_R - 6) / 20));
      if (ra > 0) { k.strokeStyle = `rgba(255,212,59,${0.9 * ra})`; k.lineWidth = 1.5; k.beginPath(); k.ellipse(sx, sy, rx, ry, 0, 0, TAU); k.stroke(); }
    }
    const c = UXB_path(u, CLR_KEYS);
    for (const t of CLR_CLICK) ripple(k, c[0], c[1], seg(u, t, t + 0.5), '255,212,59');
    if (u > 0.3 && u < 5.0) cursor(k, c[0], c[1], Math.max(UXB_press(u, CLR_CLICK[0]), UXB_press(u, CLR_CLICK[1])));
  };

  // @element 26
  // 26 滑动卡片堆叠：4 张地点卡叠放（下层每张下移 9px、缩小 5%）；模拟指针 0.5–1.6 秒把顶卡向右拖 150px（卡片按 拖动量×0.06° 倾斜），
  // 「收藏」印章随拖动距离显出；松手后 .45 秒飞出画面，下一张以 .5 秒弹簧补上；2.6–3.7 秒把第 2 张向左拖，显出「跳过」印章并飞出；
  // 5.0–6.2 秒两张卡依次从两侧飞回原位（倒放），周期末回到初始那一叠
  const SWIPE_D = [
    ['延南洞 · 咖啡馆', '午后温室', ['安静', '靠窗座位'], ['#FFB547', '#FF6B8B'], ['#FFE2B8', '#FF8A65']],
    ['圣水洞 · 展览', '光之花园', ['需预约', '2 小时'], ['#5B8CFF', '#7B61FF'], ['#B7A4FF', '#3D5BFF']],
    ['望远洞 · 书店', '海边书屋', ['独立出版', '饮品'], ['#22C3A6', '#0E7490'], ['#A5F2D3', '#14B8A6']],
    ['乙支路 · 酒吧', '霓虹之家', ['爵士', '营业到 23 点'], ['#B04FD0', '#2B1B6B'], ['#FF9BD2', '#B04FD0']],
  ];
  const SWIPE_CX = 200, SWIPE_CY = 100, SWIPE_W = 190, SWIPE_H = 150;
  // 第 i 张卡在时刻 u 的拖动偏移 dx（0 = 在叠中）与是否已离开
  function SWIPE_state(i, u) {
    const ev = i === 0 ? { s: 0.5, e: 1.6, dir: 1, back: [5.0, 5.6] } : i === 1 ? { s: 2.6, e: 3.7, dir: -1, back: [5.5, 6.1] } : null;
    if (!ev) return { dx: 0, out: 0 };
    if (u >= ev.back[0]) { const q = inOut3(seg(u, ev.back[0], ev.back[1])); return { dx: ev.dir * 420 * (1 - q), out: 1 - q }; }
    if (u < ev.s) return { dx: 0, out: 0 };
    if (u < ev.e) return { dx: ev.dir * 150 * inOut3(seg(u, ev.s, ev.e)), out: 0 };
    const q = out3(seg(u, ev.e, ev.e + 0.45)); return { dx: ev.dir * (150 + 270 * q), out: q };
  }
  CELLS[25] = (k, w, h, u) => {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    // 叠中位置：已离开的卡不占层；depth = 前面仍在叠中的卡数（带 .5 秒弹簧过渡）
    const outs = SWIPE_D.map((_, i) => SWIPE_state(i, u));
    const depthOf = i => { let d = 0; for (let j = 0; j < i; j++) d += 1 - outs[j].out; return d; };
    for (let i = SWIPE_D.length - 1; i >= 0; i--) {
      const d = Math.min(3, depthOf(i)), { dx } = outs[i];
      const [place, title, tags, g1, g2] = SWIPE_D[i];
      k.save(); k.translate(SWIPE_CX + dx, SWIPE_CY + d * 9 + SWIPE_H / 2); k.rotate(dx * 0.06 * Math.PI / 180); k.scale(1 - d * 0.05, 1 - d * 0.05);
      k.translate(0, -SWIPE_H / 2);
      k.save(); k.shadowColor = 'rgba(20,10,50,.35)'; k.shadowBlur = 18; k.shadowOffsetY = 10;
      const bg = k.createLinearGradient(-SWIPE_W / 2, -SWIPE_H / 2, SWIPE_W / 2, SWIPE_H / 2); bg.addColorStop(0, g1[0]); bg.addColorStop(1, g1[1]);
      k.fillStyle = bg; rr(k, -SWIPE_W / 2, -SWIPE_H / 2, SWIPE_W, SWIPE_H, 18); k.fill(); k.restore();
      k.save(); rr(k, -SWIPE_W / 2, -SWIPE_H / 2, SWIPE_W, SWIPE_H, 18); k.clip();
      glow(k, SWIPE_W / 2 - 30, -SWIPE_H / 2 + 10, 90, '255,255,255', 0.45);
      const sg = k.createLinearGradient(-40, -60, 40, 20); sg.addColorStop(0, g2[0]); sg.addColorStop(1, g2[1]);
      k.fillStyle = sg; k.beginPath(); k.ellipse(0, -18, 46, 42, 0.3, 0, TAU); k.fill();
      const sh = k.createLinearGradient(0, 0, 0, SWIPE_H / 2); sh.addColorStop(0, 'rgba(10,6,30,0)'); sh.addColorStop(1, 'rgba(10,6,30,.6)');
      k.fillStyle = sh; k.fillRect(-SWIPE_W / 2, 0, SWIPE_W, SWIPE_H / 2);
      txt(k, place, -SWIPE_W / 2 + 14, 34, `700 9px ${SANS}`, 'rgba(255,255,255,.8)');
      txt(k, title, -SWIPE_W / 2 + 14, 52, `800 16px ${SANS}`, '#fff');
      let tx = -SWIPE_W / 2 + 14; for (const t of tags) { k.font = `700 8.5px ${SANS}`; const tw = k.measureText(t).width + 14; k.fillStyle = 'rgba(255,255,255,.22)'; rr(k, tx, 58, tw, 14, 7); k.fill(); txt(k, t, tx + 7, 68, `700 8.5px ${SANS}`, '#fff'); tx += tw + 5; }
      // 印章：右滑「收藏」（左上、−14°），左滑「跳过」（右上、14°），透明度随拖动量
      const a = clamp(Math.abs(dx) / 110);
      if (a > 0.02) {
        const yes = dx > 0; k.save(); k.translate(yes ? -SWIPE_W / 2 + 46 : SWIPE_W / 2 - 46, -SWIPE_H / 2 + 26); k.rotate((yes ? -14 : 14) * Math.PI / 180);
        k.globalAlpha = a; k.strokeStyle = yes ? '#7EE8C0' : '#FF8FA3'; k.lineWidth = 2.5; rr(k, -30, -12, 60, 24, 7); k.stroke();
        txt(k, yes ? '收藏' : '跳过', 0, 5, `900 13px ${SANS}`, yes ? '#7EE8C0' : '#FF8FA3', 'center'); k.restore();
      }
      k.restore(); k.restore();
    }
    // 右侧按钮栏与计数
    const saved = outs[0].out > 0.5 ? 1 : 0, passed = outs[1].out > 0.5 ? 1 : 0;
    txt(k, '今日推荐', 360, 52, `800 15px ${SANS}`, UX.ink);
    txt(k, `收藏 ${saved} · 跳过 ${passed}`, 360, 72, `700 10px ${SANS}`, UX.ink3);
    [['✕', UX.danger, 380], ['↺', UX.ink3, 428], ['♥', UX.mint, 476]].forEach(([s, c, x]) => {
      k.save(); k.shadowColor = UX.shadow; k.shadowBlur = 10; k.shadowOffsetY = 3; k.fillStyle = UX.surface; k.beginPath(); k.arc(x, 128, 18, 0, TAU); k.fill(); k.restore();
      txt(k, s, x, 133, `800 15px ${SANS}`, c, 'center');
    });
    // 模拟指针：抓住顶卡中部拖动
    let cx = 330, cy = 170, press = 0;
    if (u >= 0.3 && u < 1.6) { cx = SWIPE_CX + outs[0].dx + 10; cy = SWIPE_CY + 60; press = u >= 0.5 ? 1 : seg(u, 0.3, 0.5); }
    else if (u >= 1.6 && u < 2.6) { const q = inOut3(seg(u, 1.7, 2.5)); cx = mix(SWIPE_CX + 160, SWIPE_CX + 10, q); cy = SWIPE_CY + 60; }
    else if (u >= 2.6 && u < 3.7) { cx = SWIPE_CX + outs[1].dx + 10; cy = SWIPE_CY + 60; press = 1; }
    else if (u >= 3.7) { const q = inOut3(seg(u, 3.8, 4.6)); cx = mix(SWIPE_CX - 140, 330, q); cy = mix(SWIPE_CY + 60, 170, q); }
    else { cx = mix(330, SWIPE_CX + 10, inOut3(seg(u, 0, 0.3))); cy = mix(170, SWIPE_CY + 60, inOut3(seg(u, 0, 0.3))); }
    cursor(k, cx, cy, press);
  };

  // @element 27
  // 27 支付成功对勾：左栏订单摘要与支付卡，右栏"支付 ₩32,000"按钮。0.6 秒指针点击：按钮 .5s 回弹收成 44px 圆，文字 .2s 淡出；
  // 延迟 .25s 环形进度出现，0.95 秒起 2.6 秒画满一圈（缓动 1-(1-k)^2.2），三步"请求中/银行确认/完成"在进度 2%、45%、99.9% 依次点亮；
  // 3.55 秒满环转绿 #119C72，延迟 .2s 用 .45s 画出对勾；再过 .9 秒收据卡从下方 .6s 回弹滑入；5.8–6.3 秒交叉淡化回到初始。
  const PAY_BX = 296, PAY_BY = 126, PAY_BW = 214, PAY_BH = 44, PAY_CX = PAY_BX + PAY_BW / 2, PAY_CY = PAY_BY + PAY_BH / 2;
  const PAY_T = 0.6, PAY_P0 = 0.95, PAY_OK = PAY_P0 + 2.6, PAY_REC = PAY_OK + 0.9;
  const PAY_ST = [0.02, 0.45, 0.999].map(th => PAY_P0 + (1 - Math.pow(1 - th, 1 / 2.2)) * 2.6);
  const PAY_KEYS = [[0, 560, 240], [0.15, 560, 240], [0.5, PAY_CX + 20, PAY_CY + 4], [0.8, PAY_CX + 20, PAY_CY + 4], [1.3, 500, 200], [1.7, 570, 240]];
  function PAY_draw(k, u) {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    card(k, 10, 10, CW - 20, CH - 20, 18);
    // 左栏：订单摘要
    rr(k, 24, 22, 250, 84, 14); k.fillStyle = UX.surface2; k.fill();
    const f1 = UXB_f(650, 10.5);
    txt(k, 'Daily Bottle 500 · 珊瑚色', 38, 42, f1, UX.ink2); txt(k, '₩29,000', 260, 42, f1, UX.ink2, 'right');
    txt(k, '运费', 38, 59, f1, UX.ink2); txt(k, '₩3,000', 260, 59, f1, UX.ink2, 'right');
    k.setLineDash([3, 3]); k.strokeStyle = UX.line2; k.lineWidth = 1; k.beginPath(); k.moveTo(38, 69.5); k.lineTo(260, 69.5); k.stroke(); k.setLineDash([]);
    txt(k, '合计', 38, 93, UXB_f(850, 13), UX.ink); txt(k, '₩32,000', 260, 93, UXB_f(850, 13), UX.ink, 'right');
    rr(k, 24.75, 114.75, 248.5, 30.5, 12); k.strokeStyle = UX.line2; k.lineWidth = 1.5; k.stroke();
    const cg = k.createLinearGradient(34, 120, 64, 140); cg.addColorStop(0, '#2B1B6B'); cg.addColorStop(0.5, '#5B3FD9'); cg.addColorStop(1, '#1E7BD9');
    rr(k, 34, 120, 30, 20, 4); k.fillStyle = cg; k.fill();
    txt(k, 'Lumen Card', 74, 134, UXB_f(700, 11.5), UX.ink); txt(k, '•••• 0818', 262, 134, UXB_f(650, 10.5), UX.ink3, 'right');
    txt(k, '分期', 28, 170, f1, UX.ink3); txt(k, '一次付清', 270, 170, UXB_f(750, 10.5), UX.ink, 'right');
    txt(k, '可得积分', 28, 188, f1, UX.ink3); txt(k, '+ 960P', 270, 188, UXB_f(750, 10.5), UX.mint, 'right');
    // 右栏
    txt(k, '订单支付', PAY_BX, 46, UXB_f(850, 15), UX.ink); txt(k, '确认金额后点击支付', PAY_BX, 63, f1, UX.ink3);
    const stA = 1 - seg(u, PAY_REC, PAY_REC + 0.3), run = seg(u, PAY_T, PAY_T + 0.3) * stA;
    const kk = seg(u, PAY_P0, PAY_OK), e = 1 - Math.pow(1 - kk, 2.2), okK = seg(u, PAY_OK, PAY_OK + 0.4);
    const accent = UXB_rgb(UX.accent), mint = UXB_rgb(UX.mint), okC = rgba(lerpC(accent, mint, okK), 1);
    if (run > 0) {
      // 三个步骤点：亮起时 .3s 变色、圆点 .4s 回弹放大到 1.3 倍
      k.save(); k.globalAlpha = run;
      const labels = ['请求中', '银行确认', '完成'], f2 = UXB_f(700, 10.5); k.font = f2;
      const ws = labels.map(s => 12 + k.measureText(s).width), tot = ws.reduce((a, b) => a + b, 0) + 12;
      let x = PAY_CX - tot / 2;
      labels.forEach((s, i) => {
        const on = seg(u, PAY_ST[i], PAY_ST[i] + 0.3), sc = 1 + 0.3 * backOut(seg(u, PAY_ST[i], PAY_ST[i] + 0.4));
        k.fillStyle = on > 0 ? rgba(lerpC(UXB_rgb('#D4D3D8'), lerpC(accent, mint, okK), on), 1) : 'rgba(22,21,27,.17)';
        k.beginPath(); k.arc(x + 3.5, 98, 3.5 * sc, 0, TAU); k.fill();
        txt(k, s, x + 12, 102, f2, rgba(lerpC(UXB_rgb(UX.ink3), UXB_rgb(UX.ink), on), 1));
        x += ws[i] + 6;
      });
      k.restore();
    }
    if (stA > 0) {
      k.save(); k.globalAlpha = stA;
      const sh = backOut(seg(u, PAY_T, PAY_T + 0.5)), bw = Math.max(38, mix(PAY_BW, PAY_BH, sh)), ps = 1 - 0.03 * UXB_press(u, PAY_T);
      k.translate(PAY_CX, PAY_CY); k.scale(ps, ps);
      rr(k, -bw / 2, -PAY_BH / 2, bw, PAY_BH, mix(14, 22, clamp(sh))); k.fillStyle = rgba(lerpC(UXB_rgb(UX.ink), mint, okK), 1); k.fill();
      const ta = 1 - seg(u, PAY_T, PAY_T + 0.2);
      if (ta > 0) { k.globalAlpha = stA * ta; txt(k, '支付 ₩32,000', 0, 5, UXB_f(800, 13.5), UX.page, 'center'); k.globalAlpha = stA; }
      const ra = seg(u, PAY_T + 0.25, PAY_T + 0.55);
      if (ra > 0) {
        k.globalAlpha = stA * ra; k.lineCap = 'round'; k.lineWidth = 4.5;
        k.strokeStyle = UX.surface3; k.beginPath(); k.arc(0, 0, 29, 0, TAU); k.stroke();
        if (e > 0.001) { k.strokeStyle = okC; k.beginPath(); k.arc(0, 0, 29, -Math.PI / 2, -Math.PI / 2 + TAU * e); k.stroke(); }
        k.globalAlpha = stA;
      }
      const ck = uxEase(seg(u, PAY_OK + 0.2, PAY_OK + 0.65));
      if (ck > 0) { k.strokeStyle = '#FFFFFF'; k.lineWidth = 3.2; k.lineCap = 'round'; k.lineJoin = 'round'; UXB_poly(k, [[-7, 0.5], [-2.5, 5], [7, -4.5]], ck); }
      k.restore();
    }
    // 收据：.6s 回弹从下方滑入（原作 translateY(110%) → 0）
    if (u >= PAY_REC) {
      const off = (1 - backOut(seg(u, PAY_REC, PAY_REC + 0.6))) * 1.1 * 172;
      k.save(); rr(k, 10, 10, CW - 20, CH - 20, 18); k.clip(); k.translate(0, off);
      rr(k, 282, 18, 236, 172, 16); k.fillStyle = UX.surface2; k.fill();
      k.fillStyle = 'rgba(17,156,114,.16)'; k.beginPath(); k.arc(312, 52, 23, 0, TAU); k.fill();
      k.fillStyle = UX.mint; k.beginPath(); k.arc(312, 52, 17, 0, TAU); k.fill();
      k.strokeStyle = '#FFFFFF'; k.lineWidth = 2.8; k.lineCap = 'round'; k.lineJoin = 'round'; UXB_poly(k, [[305, 52.5], [310, 57.5], [320, 47]], 1);
      txt(k, '支付完成', 340, 50, UXB_f(850, 16), UX.ink); txt(k, '收据已发送至邮箱', 340, 67, f1, UX.ink3);
      [['订单号', 'LM-20261010-0428'], ['支付时间', '10月10日 18:42'], ['金额', '₩32,000']].forEach(([a, b], i) => {
        txt(k, a, 298, 98 + i * 17, UXB_f(650, 10.5), UX.ink3); txt(k, b, 504, 98 + i * 17, UXB_f(750, 10.5), UX.ink, 'right');
      });
      rr(k, 298, 148, 206, 30, 10); k.fillStyle = UX.ink; k.fill();
      txt(k, '重新开始', 401, 167, UXB_f(750, 12), UX.page, 'center');
      k.restore();
    }
  }
  CELLS[26] = (k, w, h, u) => {
    UXB_xfade(k, PAY_draw, u, 5.8, 6.3);
    const c = UXB_path(u, PAY_KEYS);
    ripple(k, c[0], c[1], seg(u, PAY_T, PAY_T + 0.5));
    if (u > 0.15 && u < 1.7) cursor(k, c[0], c[1], UXB_press(u, PAY_T));
  };

  // @element 28
  // 28 图标安装进度：渐变 App 图标（#FFB547→#FF6B8B→#7B61FF）上的暗色罩 rgba(12,10,24,.55) 按进度顺时针扫开，右侧百分比与 MB 数同步上涨；
  // 速度 0.16+0.04·sin(2.5t)（原作每秒进度，此处 ×2 以便 6.4 秒内装完）；1.8 秒指针点图标暂停（中心圈换成播放三角 .2s），2.7 秒再点继续；
  // 约 4.25 秒装满：罩层 .5s 淡出、中心圈 .45s 缩到 .4，图标 .7s 弹跳（30% 缩到 .9、60% 放大 1.08 并上移 4px），"打开"按钮 .5s 回弹出现；5.6–6.2 秒交叉淡化复位。
  const INS_SIZE = 186, INS_P1 = 1.8, INS_P2 = 2.7;
  const INS_A = u => (u < 0.3 ? 0 : u < INS_P1 ? u - 0.3 : u < INS_P2 ? INS_P1 - 0.3 : u - INS_P2 + INS_P1 - 0.3);
  const INS_p = A => Math.min(1, 2 * (0.16 * A + 0.016 * (1 - Math.cos(2.5 * A))));
  const INS_DONE = (() => { let A = 0; while (INS_p(A) < 1) A += 1 / 2000; return INS_P2 + A - (INS_P1 - 0.3); })();
  const INS_KEYS = [[0, -20, 230], [1.2, -20, 230], [1.7, 110, 112], [2.85, 110, 112], [3.4, -20, 232]];
  function INS_draw(k, u) {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    card(k, 10, 10, CW - 20, CH - 20, 18);
    const A = INS_A(u), p = INS_p(A), done = u >= INS_DONE, paused = u >= INS_P1 && u < INS_P2;
    let sc = 1 - 0.06 * Math.max(UXB_press(u, INS_P1), UXB_press(u, INS_P2)), ty = 0;
    if (done) {
      const hp = seg(u, INS_DONE, INS_DONE + 0.7);
      if (hp < 0.3) sc *= mix(1, 0.9, inOut3(hp / 0.3));
      else if (hp < 0.6) { const e = inOut3((hp - 0.3) / 0.3); sc *= mix(0.9, 1.08, e); ty = -4 * e; }
      else { const e = inOut3((hp - 0.6) / 0.4); sc *= mix(1.08, 1, e); ty = -4 * (1 - e); }
    }
    const S = 120, cx = 46 + S / 2, cy = 44 + S / 2;
    k.save(); k.translate(cx, cy + ty); k.scale(sc, sc); k.translate(-S / 2, -S / 2);
    const g = k.createLinearGradient(S * 0.2, 0, S * 0.8, S); g.addColorStop(0, '#FFB547'); g.addColorStop(0.5, '#FF6B8B'); g.addColorStop(1, '#7B61FF');
    k.save(); k.shadowColor = 'rgba(120,50,120,.45)'; k.shadowBlur = 24; k.shadowOffsetY = 14; rr(k, 0, 0, S, S, 29); k.fillStyle = g; k.fill(); k.restore();
    rr(k, 0, 0, S, S, 29); k.clip();
    k.fillStyle = 'rgba(255,255,255,.92)'; k.beginPath(); k.moveTo(60, 29.4); k.lineTo(90.5, 60); k.lineTo(60, 90.6); k.lineTo(29.5, 60); k.closePath(); k.fill();
    glow(k, 111, 0, 54.5 * 0.65 / 0.65, '255,255,255', 0.45);
    const fade = 1 - seg(u, INS_DONE, INS_DONE + 0.5);
    if (p < 1 && fade > 0) {
      k.fillStyle = `rgba(12,10,24,${0.55 * fade})`; k.beginPath(); k.moveTo(60, 60);
      k.arc(60, 60, 100, -Math.PI / 2 + p * TAU, -Math.PI / 2 + TAU); k.closePath(); k.fill();
    }
    const ra = 1 - seg(u, INS_DONE, INS_DONE + 0.4);
    if (ra > 0) {
      const rs = done ? mix(1, 0.4, backOut(seg(u, INS_DONE, INS_DONE + 0.45))) : 1;
      k.save(); k.globalAlpha = ra; k.translate(60, 60); k.scale(rs, rs);
      k.fillStyle = 'rgba(12,10,24,.5)'; k.beginPath(); k.arc(0, 0, 26.4, 0, TAU); k.fill();
      k.strokeStyle = 'rgba(255,255,255,.9)'; k.lineWidth = 3; k.beginPath(); k.arc(0, 0, 27.9, 0, TAU); k.stroke();
      const pl = u < INS_P1 ? 0 : u < INS_P2 ? seg(u, INS_P1, INS_P1 + 0.2) : 1 - seg(u, INS_P2, INS_P2 + 0.2);
      k.fillStyle = '#FFFFFF';
      if (pl < 1) { k.globalAlpha = ra * (1 - pl); rr(k, -6.4, -7.3, 4.5, 14.5, 1.4); k.fill(); rr(k, 1.8, -7.3, 4.5, 14.5, 1.4); k.fill(); }
      if (pl > 0) { k.globalAlpha = ra * pl; k.beginPath(); k.moveTo(-4.5, -7.3); k.lineTo(8.2, 0); k.lineTo(-4.5, 7.3); k.closePath(); k.fill(); }
      k.restore();
    }
    k.restore();
    // 右侧文字
    const X = 196, speed = 0.16 + 0.04 * Math.sin(2.5 * A), mb = Math.round(p * INS_SIZE);
    txt(k, 'Lumen Studio', X, 66, UXB_f(850, 22), UX.ink);
    const meta = done ? `已安装 · ${INS_SIZE} MB` : paused ? `已暂停 · ${mb} MB / ${INS_SIZE} MB` : `安装中 · ${mb} MB / ${INS_SIZE} MB · ${(speed * INS_SIZE / 10).toFixed(1)} MB/s`;
    txt(k, meta, X, 90, UXB_f(650, 12), UX.ink3);
    const pf = UXB_f(850, 40), ps = String(Math.floor(p * 100)); k.font = pf;
    txt(k, ps, X, 138, pf, UX.ink); txt(k, '%', X + k.measureText(ps).width + 3, 138, UXB_f(800, 18), UX.ink3);
    rr(k, X, 152, 86, 32, 16); k.fillStyle = UX.surface2; k.fill();
    txt(k, done ? '重新安装' : '重新开始', X + 43, 172, UXB_f(780, 12), UX.ink, 'center');
    if (done) {
      const e = seg(u, INS_DONE, INS_DONE + 0.5), s2 = 0.6 + 0.4 * backOut(e);
      k.save(); k.globalAlpha = clamp(e * 2); k.translate(X + 96 + 32, 168); k.scale(s2, s2);
      rr(k, -32, -16, 64, 32, 16); k.fillStyle = UX.accent; k.fill(); txt(k, '打开', 0, 4, UXB_f(780, 12), '#FFFFFF', 'center');
      k.restore();
    }
  }
  CELLS[27] = (k, w, h, u) => {
    UXB_xfade(k, INS_draw, u, 5.6, 6.2);
    const c = UXB_path(u, INS_KEYS);
    ripple(k, c[0], c[1], seg(u, INS_P1, INS_P1 + 0.5), '255,255,255'); ripple(k, c[0], c[1], seg(u, INS_P2, INS_P2 + 0.5), '255,255,255');
    if (u > 1.2 && u < 3.4) cursor(k, c[0], c[1], Math.max(UXB_press(u, INS_P1), UXB_press(u, INS_P2)));
  };

  // @element 29
  // 29 不定转确定进度：部署卡左栏为标题、状态药丸、进度轨与"重新部署"按钮，右栏为日志。0.2–1.8 秒排队：两段色条以 1.6s 周期
  // 伸缩滑过（a 段 left -35%→100%、right 100%→-90%；b 段延迟 .55s、left -200%→107%、right 100%→-8%，均在 60% 处到位）；
  // 1.8 秒同一根轨变为确定进度，5 个步骤依次推进到 22/38/70/85/100%（每步时长 (650+120i)ms×0.6，填充 .5s 缓动），日志逐行上浮、转圈变对勾；
  // 药丸 排队中(#D6731E)→构建中(#6A57F2)→就绪(#119C72)；约 4.5 秒完成，5.45 秒指针点"重新部署"，5.6–6.2 秒交叉淡化回到排队状态。
  const IDP_STEPS = [['安装依赖', 0.22], ['类型检查', 0.38], ['构建产物', 0.7], ['优化图片', 0.85], ['部署到边缘节点', 1]];
  const IDP_Q = 1.8;
  const IDP_T = (() => { const T = [IDP_Q]; for (let i = 0; i < 5; i++) T.push(T[i] + (650 + i * 120) * 0.6 / 1000); return T; })();
  const IDP_SEC = (() => { let s = 0; return [0, 1, 2, 3, 4, 5].map(i => (s += 1 + Math.round(hash(i + 40) * 3))); })();
  const IDP_FILL = [[-1, 0], ...IDP_STEPS.map((s, i) => [IDP_T[i], s[1]])];
  const IDP_KEYS = [[0, 560, 240], [4.9, 560, 240], [5.35, 152, 170]];
  function IDP_seg(k, x0, x1, y, w) { const a = Math.max(x0, 0), b = Math.min(x1, 100); if (b > a) { rr(k, 24 + w * a / 100, y, w * (b - a) / 100, 6, 3); k.fill(); } }
  function IDP_draw(k, u) {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    card(k, 10, 10, CW - 20, CH - 20, 18);
    const done = u >= IDP_T[5], det = u >= IDP_Q;
    // 标题
    rr(k, 24, 24, 32, 32, 10); k.fillStyle = UX.ink; k.fill();
    k.fillStyle = UX.page; k.beginPath(); k.moveTo(40, 33); k.lineTo(47, 46); k.lineTo(33, 46); k.closePath(); k.fill();
    txt(k, 'Deploy #128', 64, 38, UXB_f(850, 14), UX.ink); txt(k, 'main · a3f9c21', 64, 53, UXB_f(650, 10.5), UX.ink3);
    // 药丸
    const warn = UXB_rgb(UX.warn), acc = UXB_rgb(UX.accent), mint = UXB_rgb(UX.mint);
    const pc = !det ? warn : !done ? lerpC(warn, acc, seg(u, IDP_Q, IDP_Q + 0.4)) : lerpC(acc, mint, seg(u, IDP_T[5], IDP_T[5] + 0.4));
    const pt = !det ? '排队中' : !done ? '构建中' : '就绪', pf = UXB_f(800, 10.5); k.font = pf;
    const pw = k.measureText(pt).width + 27;
    rr(k, 280 - pw, 29, pw, 22, 11); k.fillStyle = rgba(pc, 0.14); k.fill();
    const blink = done ? 1 : 1 - 0.7 * (0.5 - 0.5 * Math.cos(TAU * u / 1.2));
    k.fillStyle = rgba(pc, blink); k.beginPath(); k.arc(280 - pw + 12, 40, 3.5, 0, TAU); k.fill();
    txt(k, pt, 280 - pw + 20, 44, pf, rgba(pc, 1));
    // 进度轨
    const TW = 256;
    rr(k, 24, 80, TW, 6, 3); k.fillStyle = UX.surface3; k.fill();
    const sa = 1 - seg(u, IDP_Q, IDP_Q + 0.4);
    if (sa > 0) {
      k.save(); rr(k, 24, 80, TW, 6, 3); k.clip(); k.globalAlpha = sa; k.fillStyle = UX.accent;
      const pa = (u % 1.6) / 1.6, ea = inOut3(clamp(pa / 0.6));
      IDP_seg(k, mix(-35, 100, ea), 100 - mix(100, -90, ea), 80, TW);
      if (u >= 0.55) { const pb = ((u - 0.55) % 1.6) / 1.6, eb = uxEase(clamp(pb / 0.6)); IDP_seg(k, mix(-200, 107, eb), 100 - mix(100, -8, eb), 80, TW); }
      k.restore();
    }
    const fa = seg(u, IDP_Q, IDP_Q + 0.3);
    if (fa > 0) {
      const fp = UXB_ramp(u, IDP_FILL, 0.5, uxEase);
      k.save(); k.globalAlpha = fa; k.fillStyle = rgba(lerpC(acc, mint, done ? seg(u, IDP_T[5], IDP_T[5] + 0.4) : 0), 1);
      if (fp > 0.005) { rr(k, 24, 80, TW * fp, 6, 3); k.fill(); }
      k.restore();
    }
    let si = -1; for (let i = 0; i < 5; i++) if (u >= IDP_T[i]) si = i;
    const ml = !det ? '等待队列空位' : done ? '已部署到 lumen.app' : IDP_STEPS[si][0];
    const mr = !det ? '' : done ? '38s' : Math.round(IDP_STEPS[si][1] * 100) + '%';
    txt(k, ml, 24, 104, UXB_f(700, 11), UX.ink3); txt(k, mr, 24 + TW, 104, UXB_f(700, 11), UX.ink3, 'right');
    // 重新部署按钮（未完成时 .35 透明）
    k.save(); k.globalAlpha = done ? mix(0.35, 1, seg(u, IDP_T[5], IDP_T[5] + 0.3)) : 0.35;
    const bs = 1 - 0.03 * UXB_press(u, 5.45); k.translate(152, 168); k.scale(bs, bs);
    rr(k, -128, -18, 256, 36, 12); k.fillStyle = UX.ink; k.fill(); txt(k, '重新部署', 0, 4.5, UXB_f(750, 12.5), UX.page, 'center');
    k.restore();
    // 日志
    rr(k, 296, 22, 220, 166, 14); k.fillStyle = UX.surface2; k.fill();
    const lines = [{ t: 0, ok: IDP_Q, s: '排队中 · 前面还有 2 个', d: '排队中 · 前面还有 2 个' }];
    IDP_STEPS.forEach((s, i) => lines.push({ t: IDP_T[i], ok: IDP_T[i + 1], s: s[0] + '…', d: s[0] + ' 完成' }));
    lines.forEach((L, j) => {
      if (u < L.t) return;
      const e = j === 0 ? 1 : uxEase(seg(u, L.t, L.t + 0.4)), y = 46 + j * 25 + 8 * (1 - e), ok = u >= L.ok;
      k.save(); k.globalAlpha = e;
      if (ok) { k.strokeStyle = UX.mint; k.lineWidth = 2.2; k.lineCap = 'round'; k.lineJoin = 'round'; UXB_poly(k, [[307, y - 4], [310, y - 1], [315, y - 7.5]], 1); }
      else { k.strokeStyle = UX.accent; k.lineWidth = 2; const a0 = u / 0.7 * TAU; k.beginPath(); k.arc(311, y - 4, 5, a0, a0 + Math.PI * 1.5); k.stroke(); }
      txt(k, '00:' + ('0' + IDP_SEC[j]).slice(-2), 324, y, UXB_f(600, 9.5, MONO), UX.ink3);
      txt(k, ok ? L.d : L.s, 360, y, UXB_f(600, 11), ok ? UX.ink3 : UX.ink2);
      k.restore();
    });
  }
  CELLS[28] = (k, w, h, u) => {
    UXB_xfade(k, IDP_draw, u, 5.6, 6.2);
    const c = UXB_path(u, IDP_KEYS);
    ripple(k, c[0], c[1], seg(u, 5.45, 5.95), '255,255,255');
    if (u > 4.9) cursor(k, c[0], c[1], UXB_press(u, 5.45));
  };

  // @element 30
  // 30 点赞爱心迸发：圆形按钮里一颗爱心；0.8 秒点击：.7 秒节拍（1 → .72 → 1.24 → .94 → 1），渐变红 #FF4D6D→#FF8A5B 由中心填满，
  // 粉色圆环 .6 秒从 .3 倍扩到 1 倍并变细消失（延迟 .1 秒），7 对彩色小点沿 51° 间隔向外迸发；点赞数 842 → 843 向上滚动；
  // 4.0 秒再点一次取消：爱心变回描边、数字向下滚回 842；周期末回到未点赞状态
  const HEART_C1 = 0.8, HEART_C2 = 4.0, HEART_X = 200, HEART_Y = 96;
  const HEART_DOTS = [['#FF4D6D', '#FFB26B'], ['#8B6CFF', '#FF7A93'], ['#FFB547', '#22C3A6'], ['#FF4D6D', '#8B6CFF'], ['#22C3A6', '#FFB547'], ['#FF7A93', '#5B8CFF'], ['#FFB547', '#FF4D6D']];
  // 爱心路径（中心在原点，宽约 2r）
  function HEART_path(k, r) {
    k.beginPath(); k.moveTo(0, r * 0.95);
    k.bezierCurveTo(-r * 1.25, r * 0.15, -r * 1.05, -r * 0.95, 0, -r * 0.42);
    k.bezierCurveTo(r * 1.05, -r * 0.95, r * 1.25, r * 0.15, 0, r * 0.95); k.closePath();
  }
  // .7 秒节拍关键帧（0, .18, .48, .70, 1 → 1, .72, 1.24, .94, 1）
  function HEART_beat(t) {
    const K = [[0, 1], [0.18, 0.72], [0.48, 1.24], [0.7, 0.94], [1, 1]];
    for (let i = 1; i < K.length; i++) if (t <= K[i][0]) return mix(K[i - 1][1], K[i][1], inOut3((t - K[i - 1][0]) / (K[i][0] - K[i - 1][0])));
    return 1;
  }
  CELLS[29] = (k, w, h, u) => {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    const on = u >= HEART_C1 && u < HEART_C2, tp = u - HEART_C1;
    const beat = tp >= 0 && tp < 0.7 ? HEART_beat(tp / 0.7) : 1;
    const fill = on ? (tp < 0.7 * 0.18 ? 0 : tp < 0.7 * 0.48 ? inOut3((tp - 0.126) / 0.21) : 1) : 0;
    const press = Math.max(clamp(1 - Math.abs(u - HEART_C1) / 0.1), clamp(1 - Math.abs(u - HEART_C2) / 0.1));
    // 按钮
    k.save(); k.translate(HEART_X, HEART_Y); k.scale(1 - 0.1 * press, 1 - 0.1 * press);
    k.save(); k.shadowColor = on ? 'rgba(255,77,109,.5)' : 'rgba(40,30,80,.25)'; k.shadowBlur = 22; k.shadowOffsetY = 10;
    k.fillStyle = UX.surface; k.beginPath(); k.arc(0, 0, 50, 0, TAU); k.fill(); k.restore();
    k.strokeStyle = on ? 'rgba(255,77,109,.3)' : UX.line; k.lineWidth = 1; k.beginPath(); k.arc(0, 0, 50, 0, TAU); k.stroke();
    // 圆环：.6 秒，延迟 .1 秒，从 .3 倍扩到 1 倍，线宽 22→0、透明度 1→0
    const rt = on ? (tp - 0.1) / 0.6 : -1;
    if (rt > 0 && rt < 1) { const e = out3(rt); k.strokeStyle = `rgba(255,122,147,${1 - e})`; k.lineWidth = 12 * (1 - e) + 0.5; k.beginPath(); k.arc(0, 0, 62 * mix(0.3, 1, e), 0, TAU); k.stroke(); }
    // 小点迸发：每组两颗，沿各自角度飞出 30→62px 并缩小消失
    const dt = on ? (tp - 0.25) / 0.6 : -1;
    if (dt > 0 && dt < 1) {
      const e = out3(dt);
      HEART_DOTS.forEach(([c1, c2], i) => {
        const a = (i * 51.4 - 90) * Math.PI / 180, r = mix(30, 62, e), s = 4 * (1 - e);
        k.fillStyle = c1; k.beginPath(); k.arc(Math.cos(a) * r, Math.sin(a) * r, s, 0, TAU); k.fill();
        const a2 = a + 0.28; k.fillStyle = c2; k.beginPath(); k.arc(Math.cos(a2) * (r - 9), Math.sin(a2) * (r - 9), s * 0.7, 0, TAU); k.fill();
      });
    }
    k.scale(beat, beat); k.translate(0, 1);
    if (fill > 0) { k.save(); k.scale(fill, fill); const g = k.createLinearGradient(-24, -24, 24, 24); g.addColorStop(0, '#FF4D6D'); g.addColorStop(1, '#FF8A5B'); k.fillStyle = g; HEART_path(k, 23); k.fill(); k.restore(); }
    if (fill < 1) { k.strokeStyle = UX.ink2; k.lineWidth = 2.6; k.lineJoin = 'round'; HEART_path(k, 23); k.stroke(); }
    k.restore();
    // 点赞数：向上滚动到 843（点赞），向下滚回 842（取消），各 .45 秒
    const tr = u >= HEART_C2 ? -out3(seg(u, HEART_C2, HEART_C2 + 0.45)) : out3(seg(u, HEART_C1, HEART_C1 + 0.45));
    const n0 = u >= HEART_C2 ? 843 : 842, n1 = u >= HEART_C2 ? 842 : 843, dir = u >= HEART_C2 ? -1 : 1, p = Math.abs(tr);
    k.save(); k.beginPath(); k.rect(HEART_X - 40, 150, 80, 26); k.clip();
    txt(k, String(n0), HEART_X, 168 - dir * 22 * p, `800 18px ${SANS}`, rgba([22, 21, 27], 1 - p), 'center');
    txt(k, String(n1), HEART_X, 168 + dir * 22 * (1 - p), `800 18px ${SANS}`, rgba([22, 21, 27], p), 'center');
    k.restore();
    // 右侧帖子摘要
    card(k, 300, 34, 210, 128, 16);
    const av = k.createLinearGradient(316, 50, 344, 78); av.addColorStop(0, '#FF8A5B'); av.addColorStop(1, '#B49CFF');
    k.fillStyle = av; k.beginPath(); k.arc(330, 64, 14, 0, TAU); k.fill();
    txt(k, '金夏琳', 352, 61, `800 11px ${SANS}`, UX.ink); txt(k, '3 分钟前', 352, 75, `600 9px ${SANS}`, UX.ink3);
    txt(k, '新做的动效终于上线了，', 316, 102, `600 11px ${SANS}`, UX.ink2); txt(k, '大家觉得节奏怎么样？', 316, 120, `600 11px ${SANS}`, UX.ink2);
    txt(k, on ? '你和其他 842 人赞了' : '842 人赞了', 316, 146, `700 9.5px ${SANS}`, on ? '#FF4D6D' : UX.ink3);
    // 模拟指针
    let cx, cy;
    if (u < 0.6) { const q = inOut3(seg(u, 0, 0.6)); cx = mix(290, HEART_X + 6, q); cy = mix(180, HEART_Y + 8, q); }
    else if (u < 1.6) { cx = HEART_X + 6; cy = HEART_Y + 8; }
    else if (u < 3.6) { const q = inOut3(seg(u, 1.6, 2.4)) - inOut3(seg(u, 3.0, 3.6)); cx = mix(HEART_X + 6, 330, q); cy = mix(HEART_Y + 8, 150, q); }
    else if (u < 4.6) { cx = HEART_X + 6; cy = HEART_Y + 8; }
    else { const q = inOut3(seg(u, 4.6, 6.2)); cx = mix(HEART_X + 6, 290, q); cy = mix(HEART_Y + 8, 180, q); }
    cursor(k, cx, cy, press);
    ripple(k, HEART_X, HEART_Y, seg(u, HEART_C1, HEART_C1 + 0.5), '255,77,109');
  };

  // @element 31
  // 31 数字逐位滚动：「实时访客」大数字，每次变化只有变了的位单独滚动（每位 .9 秒 cubic-bezier(.3,1.25,.5,1)，从左到右每位延迟 45ms），
  // 不变的位保持不动；1.0 / 2.4 / 3.8 秒依次变为 12,486 → 12,531 → 12,529 → 回到 12,407（周期末与开头一致）；
  // 下方 24 点走势线随每次更新向左推进一格并在末端画出新点，「较一小时前」增幅徽标同步更新；红点每 1.6 秒呼吸一次
  const ODO_VALS = [12407, 12486, 12531, 12529];
  const ODO_T = [1.0, 2.4, 3.8, 5.2];                   // 第 i 次更新时刻：第 4 次回到初始值 12,407
  const ODO_bez = UXA_bz(.3, 1.25, .5, 1);
  const ODO_SERIES = (() => { let s = 3, v = 12100; const out = []; for (let i = 0; i < 27; i++) { s = (s * 9301 + 49297) % 233280; v += (s / 233280 - 0.45) * 90; out.push(v); } return out; })();
  const ODO_fmt = n => n.toLocaleString('en-US');
  CELLS[30] = (k, w, h, u) => {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    card(k, 12, 10, CW - 24, CH - 20, 22);
    // 当前与上一个值
    let idx = 0; for (let i = 0; i < ODO_T.length; i++) if (u >= ODO_T[i]) idx = i + 1;
    const cur = ODO_VALS[idx % ODO_VALS.length], prev = ODO_VALS[(idx + ODO_VALS.length - 1) % ODO_VALS.length];
    const tch = idx ? ODO_T[idx - 1] : -9;
    // 标题行与呼吸红点（1.6 秒一次，每周期 4 次）
    const lp = (u % 1.6) / 1.6;
    k.fillStyle = `rgba(217,58,85,${0.5 * (1 - lp)})`; k.beginPath(); k.arc(36, 36, 4 + 8 * lp, 0, TAU); k.fill();
    k.fillStyle = UX.danger; k.beginPath(); k.arc(36, 36, 4, 0, TAU); k.fill();
    txt(k, '实时访客', 48, 40, `750 12px ${SANS}`, UX.ink2);
    // 大数字：逐位比较，只有变了的位滚动
    const s0 = ODO_fmt(prev), s1 = ODO_fmt(cur), DH = 52, X0 = 30, Y0 = 62;
    k.font = `850 46px ${SANS}`; const cw = k.measureText('0').width;
    k.save(); k.beginPath(); k.rect(X0 - 4, Y0, 260, DH); k.clip();
    let x = X0, di = 0;
    for (let i = 0; i < s1.length; i++) {
      const c1 = s1[i], c0 = s0[i] || c1;
      if (c1 === ',') { txt(k, ',', x, Y0 + 40, `850 46px ${SANS}`, UX.ink); x += cw * 0.45; continue; }
      const changed = c1 !== c0, t = changed ? clamp((u - tch - di * 0.045) / 0.9) : 1, e = changed ? ODO_bez(t) : 1;
      // 新值大于旧值时数字从下往上滚，反之从上往下
      const dir = cur > prev ? 1 : -1;
      if (changed && e < 1) txt(k, c0, x, Y0 + 40 - dir * DH * e, `850 46px ${SANS}`, UX.ink);
      txt(k, c1, x, Y0 + 40 + dir * DH * (1 - e), `850 46px ${SANS}`, UX.ink);
      x += cw; di++;
    }
    k.restore();
    // 渐隐遮罩（上下 14%）
    const fm = k.createLinearGradient(0, Y0, 0, Y0 + DH);
    fm.addColorStop(0, UX.surface); fm.addColorStop(0.14, 'rgba(255,255,255,0)'); fm.addColorStop(0.86, 'rgba(255,255,255,0)'); fm.addColorStop(1, UX.surface);
    k.fillStyle = fm; k.fillRect(X0 - 4, Y0, 260, DH);
    // 增幅徽标
    const diff = cur - 12090, up = diff >= 0;
    k.fillStyle = up ? 'rgba(17,156,114,.12)' : 'rgba(217,58,85,.12)'; rr(k, X0, 126, 74, 20, 10); k.fill();
    txt(k, `${up ? '▲' : '▼'} ${(Math.abs(diff) / 12090 * 100).toFixed(1)}%`, X0 + 10, 140, `800 10px ${SANS}`, up ? UX.mint : UX.danger);
    txt(k, '较一小时前', X0 + 84, 140, `600 10px ${SANS}`, UX.ink3);
    // 右侧走势线：24 个点，每次更新左移一格（.6 秒）
    const gx = 300, gy = 40, gw = 210, gh = 120, step = gw / 23;
    const shift = idx + (tch > 0 ? out3(clamp((u - tch) / 0.6)) - 1 : 0);
    const off = ((shift % 4) + 4) % 4;
    const pts = []; for (let i = 0; i < 25; i++) pts.push(ODO_SERIES[i + Math.floor(off)] * (1 - (off % 1)) + ODO_SERIES[i + Math.floor(off) + 1] * (off % 1));
    const mn = 11900, mx = 12700, Y = v => gy + gh - (v - mn) / (mx - mn) * gh;
    k.save(); k.beginPath(); k.rect(gx, gy - 6, gw, gh + 12); k.clip();
    const ag = k.createLinearGradient(0, gy, 0, gy + gh); ag.addColorStop(0, 'rgba(106,87,242,.26)'); ag.addColorStop(1, 'rgba(106,87,242,0)');
    k.beginPath(); pts.forEach((v, i) => { const px = gx + i * step - (off % 1) * step; if (i) k.lineTo(px, Y(v)); else k.moveTo(px, Y(v)); });
    k.lineTo(gx + gw + step, gy + gh); k.lineTo(gx - step, gy + gh); k.closePath(); k.fillStyle = ag; k.fill();
    k.beginPath(); pts.forEach((v, i) => { const px = gx + i * step - (off % 1) * step; if (i) k.lineTo(px, Y(v)); else k.moveTo(px, Y(v)); });
    k.strokeStyle = UX.accent; k.lineWidth = 2; k.lineJoin = 'round'; k.stroke();
    k.restore();
    const ly = Y(pts[23]); k.fillStyle = UX.surface; k.beginPath(); k.arc(gx + 23 * step - (off % 1) * step, ly, 4.5, 0, TAU); k.fill();
    k.strokeStyle = UX.accent; k.lineWidth = 2; k.stroke();
  };

  // @element 32
  // 32 等轴数据积木：4 个地区 × 6 个月的等轴积木城（格距 DX 32、DY 12，柱宽 0.72 格）。0.2 秒起从最前排开始逐排升起
  // （延迟 (8-行-列)×70ms，时长 650ms，缓动 1-(1-t)³·cos(4.2t)·(1-0.2t) 带回弹）；1.9–2.7 秒指针悬停"釜山·3月"：只留同行同列着色、其余变灰（.2s），
  // 值浮出；3.1 秒点"访问"：高度按 (行+列)×45ms 波浪重排；4.0–4.7 秒悬停"首尔·6月"；5.4 秒起按 (行+列)×30ms 依次 .5s 落回地面、切回"订单"。
  const ISO_REG = ['首尔', '釜山', '大邱', '光州'], ISO_MON = ['1月', '2月', '3月', '4月', '5月', '6月'];
  const ISO_COL = [['#7C8CFF', '#5A69E6', '#4352C4'], ['#4FD1C5', '#2FB3A8', '#22948A'], ['#FFB86B', '#F2994A', '#D97F2E'], ['#F78FB3', '#E26D98', '#C4537D']];
  const ISO_DIM = ['#E4E7F1', '#D2D7E5', '#C0C6D9'];
  const ISO_D = [[[42, 55, 61, 58, 74, 88], [30, 34, 41, 47, 45, 52], [22, 25, 24, 31, 36, 40], [15, 19, 23, 21, 27, 33]], [[66, 70, 64, 80, 85, 92], [48, 44, 57, 60, 66, 63], [35, 41, 38, 46, 44, 55], [28, 26, 34, 38, 41, 47]]];
  const ISO_OX = 238, ISO_OY = 88, ISO_DX = 32, ISO_DY = 12, ISO_FW = 0.72, ISO_SW = 3.1;
  const ISO_iso = (c, r) => [ISO_OX + (c - r) * ISO_DX, ISO_OY + (c + r) * ISO_DY];
  const ISO_ease = t => 1 - Math.pow(1 - t, 3) * Math.cos(t * 4.2) * (1 - t * 0.2);
  const ISO_ORDER = (() => { const B = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) B.push([r, c]); return B.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]) || a[1] - b[1]); })();
  const ISO_H1 = [1, 2], ISO_H2 = [0, 5];
  function ISO_h(r, c, u) {
    const d0 = ISO_D[0][r][c], d1 = ISO_D[1][r][c];
    if (u < ISO_SW) { const a = 0.2 + (8 - r - c) * 0.07, t = seg(u, a, a + 0.65); return t <= 0 ? 0 : d0 * ISO_ease(t); }
    if (u < SHOW) { const a = ISO_SW + (c + r) * 0.045, t = seg(u, a, a + 0.65); return mix(d0, d1, t <= 0 ? 0 : ISO_ease(t)); }
    const a = SHOW + (c + r) * 0.03; return mix(d1, 0, inOut3(seg(u, a, a + 0.5)));
  }
  const ISO_top = ([r, c], m) => { const q = ISO_iso(c, r); return [q[0], q[1] - ISO_D[m][r][c]]; };
  const ISO_KEYS = (() => { const a = ISO_top(ISO_H1, 0), b = ISO_top(ISO_H2, 1); return [[0, 560, 240], [1.4, 560, 240], [1.85, a[0], a[1]], [2.7, a[0] + 2, a[1] + 2], [3.0, 501, 24], [3.25, 501, 24], [3.95, b[0], b[1] + 2], [4.7, b[0] + 2, b[1] + 4], [5.2, 570, 240]]; })();
  const ISO_HOV = [[-1, 0], [1.9, 1], [2.7, 0], [4.0, 1], [4.7, 0]];
  const ISO_CHIP = [[-1, 0], [ISO_SW, 1], [SHOW, 0]];
  CELLS[31] = (k, w, h, u) => {
    k.drawImage(layer('ISO_BG', g => {
      const bg = g.createLinearGradient(0, 0, CW * 0.4, CH * 1.2); bg.addColorStop(0, '#F5F7FF'); bg.addColorStop(1, '#E9EEFB');
      g.fillStyle = bg; g.fillRect(0, 0, CW, CH);
      const f = [ISO_iso(-0.6, -0.6), ISO_iso(5.6, -0.6), ISO_iso(5.6, 3.6), ISO_iso(-0.6, 3.6)];
      g.beginPath(); f.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
      g.fillStyle = 'rgba(30,36,64,.05)'; g.fill(); g.strokeStyle = 'rgba(30,36,64,.1)'; g.lineWidth = 1; g.stroke();
      txt(g, '按地区', 18, 29, UXB_f(800, 13.5), '#1E2440');
      let x = 18; ISO_REG.forEach((n, i) => { g.fillStyle = ISO_COL[i][0]; rr(g, x, 189, 8, 8, 2); g.fill(); txt(g, n, x + 12, 197, UXB_f(700, 10), '#525A7A'); x += 50; });
    }), 0, 0);
    const hk = UXB_ramp(u, ISO_HOV, 0.2, x => x), ref = u < 3.4 ? ISO_H1 : ISO_H2, metric = u >= ISO_SW && u < SHOW ? 1 : 0;
    const hw = ISO_FW / 2;
    for (const [r, c] of ISO_ORDER) {
      const hh = ISO_h(r, c, u), line = r === ref[0] || c === ref[1], on = r === ref[0] && c === ref[1];
      const dimK = line ? 0 : hk;
      const P = (dc, dr, up) => { const q = ISO_iso(c + dc, r + dr); return [q[0], q[1] - up]; };
      const faces = [[P(-hw, -hw, hh), P(hw, -hw, hh), P(hw, hw, hh), P(-hw, hw, hh)], [P(-hw, hw, hh), P(hw, hw, hh), P(hw, hw, 0), P(-hw, hw, 0)], [P(hw, -hw, hh), P(hw, hw, hh), P(hw, hw, 0), P(hw, -hw, 0)]];
      faces.forEach((f, j) => {
        k.beginPath(); f.forEach((p, i) => (i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1]))); k.closePath();
        k.fillStyle = rgba(UXB_mix(ISO_COL[r][j], ISO_DIM[j], dimK), 1); k.fill();
        if (on && hk > 0.01) { k.strokeStyle = `rgba(255,255,255,${hk})`; k.lineWidth = 1.2; k.lineJoin = 'round'; k.stroke(); }
      });
    }
    // 筛选芯片（.2s 切换）
    const ck = UXB_ramp(u, ISO_CHIP, 0.2, x => x);
    rr(k, 444, 12, 78, 24, 12); k.fillStyle = 'rgba(30,36,64,.07)'; k.fill();
    [['订单', 447, 1 - ck], ['访问', 483, ck]].forEach(([s, x, a]) => {
      if (a > 0) { k.save(); k.globalAlpha = a; rr(k, x, 15, 36, 18, 9); k.fillStyle = '#1E2440'; k.fill(); k.restore(); }
      txt(k, s, x + 18, 28, UXB_f(750, 10.5), rgba(lerpC([82, 90, 122], [255, 255, 255], a), 1), 'center');
    });
    // 提示框（.15s 淡入、.22s 回弹）
    if (hk > 0.01) {
      const [r, c] = ref, m = ref === ISO_H1 ? 0 : 1, q = ISO_iso(c, r), y = q[1] - ISO_h(r, c, u) - 6, sc = 0.92 + 0.08 * UXB_ramp(u, ISO_HOV, 0.22, backOut);
      const v = Math.round(ISO_D[m][r][c] * 37).toLocaleString('en-US') + (m ? ' 次访问' : ' 单');
      k.save(); k.globalAlpha = hk; k.translate(q[0], y); k.scale(sc, sc);
      k.font = UXB_f(800, 12); const tw = Math.max(k.measureText(v).width, 56) + 18;
      rr(k, -tw / 2, -40, tw, 34, 9); k.fillStyle = '#1E2440'; k.fill();
      txt(k, `${ISO_REG[r]} · ${ISO_MON[c]}`, -tw / 2 + 9, -27, UXB_f(700, 9.5), 'rgba(255,255,255,.8)');
      txt(k, v, -tw / 2 + 9, -12, UXB_f(800, 12), '#FFFFFF');
      k.restore();
    }
    const cp = UXB_path(u, ISO_KEYS);
    ripple(k, cp[0], cp[1], seg(u, ISO_SW, ISO_SW + 0.5), '30,36,64');
    if (u > 1.4 && u < 5.2) cursor(k, cp[0], cp[1], UXB_press(u, ISO_SW));
  };

  // @element 33
  // 33 气泡分组重排：36 个项目气泡（半径 (4.5+√预算×5)×0.85，按团队着色），力导布局：向组中心的弹力 5、阻尼 e^(-5dt)、3 轮碰撞分离。
  // 指针 1.0 秒点"按团队"→挤开重组成 4 群；2.6 秒点"按状态"→3 群；3.3–3.9 秒悬停最大的气泡（其余 .45 透明、浮出提示框）；4.2 秒点"全部"→聚回一团；
  // 每群顶上的标签随群移动并显示预算合计。物理按 60Hz 预先模拟成帧表；5.3–6.3 秒把位置平滑并回初始的聚团排布，保证首尾一致。
  const BBL_COL = ['#F472B6', '#6366F1', '#F59E0B', '#10B981'], BBL_TEAM = ['设计', '工程', '市场', '运营'], BBL_STAT = ['规划中', '进行中', '已完成'];
  const BBL_CEN = [[[270, 114]], [[78, 114], [205, 114], [334, 114], [461, 114]], [[110, 114], [270, 114], [430, 114]]];
  const BBL_MODES = [[0, 0], [1.0, 1], [2.6, 2], [4.2, 0]];
  const BBL_TW = [46, 57, 57], BBL_TX = [190, 236, 293];
  const BBL_tc = i => BBL_TX[i] + BBL_TW[i] / 2;
  const BBL_C = {};
  function BBL_get() {
    if (BBL_C.F) return BBL_C;
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const TC = [8, 12, 9, 7], SC = [10, 16, 10], si = [], P = [];
    SC.forEach((c, s) => { for (let j = 0; j < c; j++) si.push(s); });
    for (let j = si.length - 1; j > 0; j--) { const m = Math.floor(rnd() * (j + 1)), t = si[j]; si[j] = si[m]; si[m] = t; }
    TC.forEach((c, tm) => { for (let j = 0; j < c; j++) { const v = 0.4 + Math.pow(rnd(), 1.6) * 4.6; P.push({ team: tm, st: si[P.length], v, r: (4.5 + Math.sqrt(v) * 5) * 0.85, x: 270 + (rnd() - 0.5) * 300, y: 114 + (rnd() - 0.5) * 120, vx: 0, vy: 0 }); } });
    const gOf = (p, m) => (m === 0 ? 0 : m === 1 ? p.team : p.st);
    const step = (dt, m) => {
      P.forEach(p => { const c = BBL_CEN[m][gOf(p, m)]; p.vx += (c[0] - p.x) * 5 * dt; p.vy += (c[1] - p.y) * 5 * dt; const d = Math.exp(-5 * dt); p.vx *= d; p.vy *= d; p.x += p.vx * dt * 1.6; p.y += p.vy * dt * 1.6; });
      for (let it = 0; it < 3; it++) for (let a = 0; a < P.length; a++) for (let b = a + 1; b < P.length; b++) {
        const A = P[a], B = P[b], dx = B.x - A.x, dy = B.y - A.y, d = Math.sqrt(dx * dx + dy * dy) || 0.01, mm = A.r + B.r + 1.5;
        if (d < mm) { const o = (mm - d) / 2, ux = dx / d, uy = dy / d; A.x -= ux * o; A.y -= uy * o; B.x += ux * o; B.y += uy * o; }
      }
      P.forEach(p => { p.x = clamp(p.x, p.r + 4, CW - p.r - 4); p.y = clamp(p.y, p.r + 44, CH - p.r - 28); });
    };
    for (let i = 0; i < 600; i++) step(1 / 60, 0);
    P.forEach(p => { p.vx = 0; p.vy = 0; });
    const snap = () => { const a = new Float32Array(P.length * 2); P.forEach((p, i) => { a[i * 2] = p.x; a[i * 2 + 1] = p.y; }); return a; };
    const S0 = snap(), F = [S0], n = Math.round(CYC * 60);
    let mode = 0;
    for (let f = 1; f <= n; f++) {
      const t = f / 60;
      for (const [mt, m] of BBL_MODES) if (mt > 0 && mt > (f - 1) / 60 && mt <= t) { mode = m; P.forEach(p => { p.vx += (rnd() - 0.5) * 60; p.vy += (rnd() - 0.5) * 60; }); }
      step(1 / 60, mode); F.push(snap());
    }
    // 悬停目标：最大的气泡在 3.6 秒的位置
    let hi = 0; P.forEach((p, i) => { if (p.r > P[hi].r) hi = i; });
    const hf = F[Math.round(3.6 * 60)], hx = hf[hi * 2], hy = hf[hi * 2 + 1];
    BBL_C.P = P; BBL_C.S0 = S0; BBL_C.F = F; BBL_C.gOf = gOf;
    BBL_C.KEYS = [[0, 560, 240], [0.5, 560, 240], [0.92, BBL_tc(1), 23], [1.2, BBL_tc(1), 23], [2.5, BBL_tc(2), 23], [3.25, hx + 2, hy + 2], [3.95, hx + 3, hy + 3], [4.12, BBL_tc(0), 23], [4.35, BBL_tc(0), 23], [4.9, 570, 240]];
    return BBL_C;
  }
  CELLS[32] = (k, w, h, u) => {
    const B = BBL_get(), P = B.P, F = B.F;
    k.fillStyle = UX.surface; k.fillRect(0, 0, CW, CH);
    const f = clamp(u * 60, 0, F.length - 1), f0 = Math.min(F.length - 2, Math.floor(f)), a = f - f0, wB = inOut3(seg(u, 5.3, 6.3));
    const X = [], Y = [];
    P.forEach((p, i) => { X[i] = mix(mix(F[f0][i * 2], F[f0 + 1][i * 2], a), B.S0[i * 2], wB); Y[i] = mix(mix(F[f0][i * 2 + 1], F[f0 + 1][i * 2 + 1], a), B.S0[i * 2 + 1], wB); });
    let mi = 0; BBL_MODES.forEach((m, i) => { if (u >= m[0]) mi = i; });
    const mode = BBL_MODES[mi][1], tsw = BBL_MODES[mi][0];
    const c = UXB_path(u, B.KEYS), cIn = u > 0.5 && u < 4.9;
    let hov = -1; if (cIn) P.forEach((p, i) => { if ((c[0] - X[i]) ** 2 + (c[1] - Y[i]) ** 2 <= p.r * p.r) hov = i; });
    P.forEach((p, i) => {
      k.globalAlpha = hov >= 0 && hov !== i ? 0.45 : 1;
      k.fillStyle = BBL_COL[p.team]; k.beginPath(); k.arc(X[i], Y[i], p.r, 0, TAU); k.fill();
      k.fillStyle = 'rgba(255,255,255,.28)'; k.beginPath(); k.arc(X[i] - p.r * 0.3, Y[i] - p.r * 0.35, p.r * 0.35, 0, TAU); k.fill();
      if (hov === i) { k.globalAlpha = 1; k.strokeStyle = UX.ink; k.lineWidth = 2; k.beginPath(); k.arc(X[i], Y[i], p.r + 2.5, 0, TAU); k.stroke(); }
    });
    k.globalAlpha = 1;
    // 群标签（切换后 .3s 淡入）
    const names = mode === 0 ? ['全部'] : mode === 1 ? BBL_TEAM : BBL_STAT, la = mi === 0 ? 1 : seg(u, tsw, tsw + 0.3), lf = UXB_f(800, 9.5);
    k.save(); k.globalAlpha = la; k.font = lf;
    names.forEach((nm, g) => {
      let top = 1e9, sx = 0, n = 0, sum = 0;
      P.forEach((p, i) => { if (B.gOf(p, mode) === g) { top = Math.min(top, Y[i] - p.r); sx += X[i]; n++; sum += p.v; } });
      const s = mode === 0 ? `全部 ${P.length} 个项目 · ${sum.toFixed(1)}B` : `${nm} · ${sum.toFixed(1)}B`, tw = k.measureText(s).width + 16;
      const lx = clamp(sx / n - tw / 2, 4, CW - tw - 4), ly = Math.max(40, top - 20);
      rr(k, lx, ly, tw, 16, 8); k.fillStyle = UX.surface; k.fill(); k.strokeStyle = UX.line; k.lineWidth = 1; k.stroke();
      txt(k, s, lx + 8, ly + 11.5, lf, UX.ink);
    });
    k.restore();
    // 分组标签页：滑块 .35s 回弹
    rr(k, 187, 10, 166, 26, 13); k.fillStyle = UX.surface2; k.fill(); k.strokeStyle = UX.line; k.lineWidth = 1; k.stroke();
    const tabEv = [[-1, 0], ...BBL_MODES.slice(1).map(([t, m]) => [t, m])];
    const pp = UXB_ramp(u, tabEv, 0.35, backOut), pi0 = clamp(Math.floor(pp), 0, 1), pf = pp - pi0;
    const px = mix(BBL_TX[pi0], BBL_TX[pi0 + 1], pf), pw = mix(BBL_TW[pi0], BBL_TW[pi0 + 1], pf);
    rr(k, px, 13, pw, 20, 10); k.fillStyle = UX.ink; k.fill();
    ['全部', '按团队', '按状态'].forEach((s, i) => txt(k, s, BBL_tc(i), 27, UXB_f(800, 11), Math.abs(pp - i) < 0.5 ? UX.surface : UX.ink2, 'center'));
    // 图例
    let lx = 154; BBL_TEAM.forEach((n, i) => { k.fillStyle = BBL_COL[i]; k.beginPath(); k.arc(lx + 4, 196, 4, 0, TAU); k.fill(); txt(k, n, lx + 12, 200, UXB_f(750, 10), UX.ink2); lx += 60; });
    if (hov >= 0) {
      const p = P[hov], l1 = `项目 ${hov + 1}`, l2 = `${BBL_TEAM[p.team]} · ${BBL_STAT[p.st]} · ${p.v.toFixed(1)}B`;
      k.font = UXB_f(700, 9.5); const tw = k.measureText(l2).width + 18, tx = clamp(X[hov], 70, CW - 70), ty = Y[hov] - p.r - 6;
      rr(k, tx - tw / 2, ty - 34, tw, 32, 9); k.fillStyle = UX.ink; k.fill();
      txt(k, l1, tx - tw / 2 + 9, ty - 21, UXB_f(900, 9.5), UX.surface); txt(k, l2, tx - tw / 2 + 9, ty - 8, UXB_f(700, 9.5), UX.surface);
    }
    for (const [t] of BBL_MODES.slice(1)) ripple(k, c[0], c[1], seg(u, t, t + 0.5));
    if (cIn) cursor(k, c[0], c[1], Math.max(UXB_press(u, 1.0), UXB_press(u, 2.6), UXB_press(u, 4.2)));
  };

  // @element 34
  // 34 表格实时插入："实时订单"表（红点 1.4s 呼吸）。0.8 秒一笔新订单从顶部滑入并闪一下紫色（1.4s 褪去），下面各行 .45s 滑下；
  // 2.2 秒指针点"金额"表头：行彼此穿过、按金额降序重排；3.1 秒又来一笔，按当前排序从底部滑到位置；4.2 秒点"时间"表头恢复按时间排序；
  // 每行"N 秒前"随时间增长；只显示 5 行，挤出的行 .35s 淡出。5.6–6.2 秒交叉淡化回初始 5 行。
  const LTB_NM = ['Seoyeon K.', 'Junho L.', 'Haeun P.', 'Minjun C.', 'Yuna J.', 'Jiho H.', 'Jia Y.', 'Taemin O.'];
  const LTB_ST = [['已支付', '#10B981'], ['打包中', '#0EA5E9'], ['审核中', '#F59E0B']];
  const LTB_MAX = 5, LTB_RH = 24, LTB_Y0 = 70;
  const LTB_ROWS = [1, 2, 3, 4, 5, 6, 7].map(id => ({ id, a: Math.round(12 + hash(id * 3.1) * 230), n: LTB_NM[id % 8], s: LTB_ST[Math.floor(hash(id * 7.7) * 3)], t: id <= 5 ? -(6 - id) * 7 : id === 6 ? 0.8 : 3.1 }));
  const LTB_EVT = [[0.8, 'add', 6], [2.2, 'sort', 1], [3.1, 'add', 7], [4.2, 'sort', 0]];
  // 每行的槽位与透明度过渡表
  const LTB_TR = (() => {
    const tr = {}, rows = LTB_ROWS.slice(0, 5); let sort = 0;
    const order = t => { rows.sort((x, y) => (sort === 1 ? y.a - x.a : y.t - x.t) || y.id - x.id); rows.forEach((o, i) => { tr[o.id].slot.push([t, i]); tr[o.id].op.push([t, i < LTB_MAX ? 1 : 0]); }); };
    rows.forEach(o => (tr[o.id] = { slot: [[-1, 0]], op: [[-1, 1]] }));
    rows.sort((x, y) => y.t - x.t).forEach((o, i) => (tr[o.id].slot[0][1] = i));
    for (const [t, kind, v] of LTB_EVT) {
      if (kind === 'add') { const o = LTB_ROWS[v - 1]; tr[v] = { slot: [[-1, sort === 0 ? -1 : LTB_MAX]], op: [[-1, 0]], at: t }; rows.push(o); }
      else sort = v;
      order(t);
    }
    return tr;
  })();
  const LTB_KEYS = [[0, 560, 240], [1.6, 560, 240], [2.1, 262, 60], [3.8, 262, 60], [4.1, 46, 60], [4.3, 46, 60], [4.9, 570, 240]];
  function LTB_draw(k, u) {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    card(k, 10, 10, CW - 20, CH - 20, 18);
    const pa = 0.35 + 0.65 * (0.5 + 0.5 * Math.cos(TAU * u / 1.4));
    k.fillStyle = 'rgba(225,29,72,.25)'; k.beginPath(); k.arc(32, 30, 7, 0, TAU); k.fill();
    k.fillStyle = `rgba(225,29,72,${pa})`; k.beginPath(); k.arc(32, 30, 4, 0, TAU); k.fill();
    txt(k, '实时订单', 44, 35, UXB_f(900, 14), UX.ink);
    rr(k, 452, 18, 60, 24, 12); k.fillStyle = UX.surface2; k.fill(); k.strokeStyle = UX.line; k.lineWidth = 1; k.stroke();
    k.fillStyle = UX.ink2; k.fillRect(466, 26, 2.5, 8); k.fillRect(470.5, 26, 2.5, 8);
    txt(k, '暂停', 478, 34, UXB_f(800, 10.5), UX.ink2);
    k.save(); rr(k, 20, 48, CW - 40, 142, 12); k.fillStyle = UX.surface2; k.fill(); k.clip();
    const sort = u < 2.2 ? 0 : u < 4.2 ? 1 : 0;
    [['时间', 34, 0], ['金额', 250, 1], ['状态', 390, -1]].forEach(([s, x, i]) => {
      const on = i === sort, f = UXB_f(850, 10); k.font = f;
      txt(k, s, x, 63, f, on ? UX.ink : UX.ink3);
      if (i >= 0) { const cx = x + k.measureText(s).width + 7; k.strokeStyle = on ? UX.ink : 'rgba(142,138,151,.55)'; k.lineWidth = 1.5; k.lineCap = 'round'; k.lineJoin = 'round'; k.beginPath(); k.moveTo(cx - 3, 58.5); k.lineTo(cx, 61.5); k.lineTo(cx + 3, 58.5); k.stroke(); }
    });
    k.fillStyle = UX.line; k.fillRect(20, LTB_Y0, CW - 40, 1);
    k.beginPath(); k.rect(20, LTB_Y0 + 1, CW - 40, 120); k.clip();
    for (const o of LTB_ROWS) {
      const tr = LTB_TR[o.id];
      if (tr.at !== undefined && u < tr.at) continue;
      const slot = UXB_ramp(u, tr.slot, 0.45, out3), op = UXB_ramp(u, tr.op, 0.35, x => x);
      if (op <= 0.01) continue;
      const y = LTB_Y0 + slot * LTB_RH;
      k.save(); k.globalAlpha = op;
      if (tr.at !== undefined) { const g = 1 - seg(u, tr.at, tr.at + 1.4); if (g > 0) { k.fillStyle = `rgba(106,87,242,${0.22 * g})`; k.fillRect(20, y, CW - 40, LTB_RH); } }
      const s = Math.round(u - o.t);
      txt(k, o.n, 34, y + 16, UXB_f(850, 11), UX.ink);
      txt(k, s < 3 ? '刚刚' : `${s} 秒前`, 118, y + 16, UXB_f(700, 9.5), UX.ink3);
      txt(k, '$' + o.a, 250, y + 16, UXB_f(900, 11), UX.ink);
      k.fillStyle = o.s[1]; k.beginPath(); k.arc(393, y + 12.5, 3, 0, TAU); k.fill();
      txt(k, o.s[0], 401, y + 16, UXB_f(800, 10), o.s[1]);
      k.fillStyle = UX.line; k.fillRect(20, y + LTB_RH - 1, CW - 40, 1);
      k.restore();
    }
    k.restore();
  }
  CELLS[33] = (k, w, h, u) => {
    UXB_xfade(k, LTB_draw, u, 5.6, 6.2);
    const c = UXB_path(u, LTB_KEYS);
    ripple(k, c[0], c[1], seg(u, 2.2, 2.7)); ripple(k, c[0], c[1], seg(u, 4.2, 4.7));
    if (u > 1.6 && u < 4.9) cursor(k, c[0], c[1], Math.max(UXB_press(u, 2.2), UXB_press(u, 4.2)));
  };

  // @element 35
  // 35 排名赛跑柱状图：8 种饮品 2019–2026 年销量（单位万杯）赛跑，只显示前 6 名；变长的柱子上移与上一名交换位置（位置以 10/秒、拖动时 16/秒逼近，
  // 刻度最大值 = 第一名×1.08、以 4/秒逼近），右下角大年份与柱端数字同步跳动。0.3–4.5 秒自动播放（每年 0.6 秒，原作 1.5 秒）；
  // 5.0 秒指针按住年份滑块，5.05–5.8 秒向左拖回 2019（排名倒放）；6.0 秒点播放键恢复播放状态，指针离开。逐帧平滑预先模拟两轮、取第二轮，首尾连续。
  const RACE_N = ['美式', '拿铁', '冷萃', '抹茶拿铁', '奶茶', '柠檬水', '西柚', '香草拿铁'];
  const RACE_COL = ['#6366F1', '#F59E0B', '#10B981', '#84CC16', '#A855F7', '#EAB308', '#F43F5E', '#0EA5E9'];
  const RACE_V = [[120, 128, 135, 140, 146, 150, 153, 156], [95, 100, 104, 108, 110, 112, 113, 115], [20, 38, 60, 82, 104, 121, 138, 152], [30, 34, 45, 63, 80, 102, 118, 130], [70, 75, 72, 66, 62, 58, 55, 52], [50, 48, 52, 56, 58, 60, 57, 55], [40, 55, 64, 68, 66, 63, 60, 56], [60, 63, 66, 70, 74, 79, 86, 98]];
  const RACE_SL0 = 52, RACE_SL1 = 516, RACE_RH = 22, RACE_TOP = 36, RACE_BW = 330, RACE_SHOW = 6;
  const RACE_t = u => (u < 0.3 ? 0 : u < 4.5 ? (u - 0.3) / 0.6 : u < 5.05 ? 7 : u < 5.8 ? 7 * (1 - inOut3(seg(u, 5.05, 5.8))) : 0);
  const RACE_KEYS = [[0, 560, 240], [4.5, 560, 240], [4.95, RACE_SL1, 189], [5.05, RACE_SL1, 189], [5.8, RACE_SL0, 189], [6.0, 31, 188], [6.36, -20, 236]];
  const RACE_val = (i, t) => { const a = Math.floor(t), b = Math.min(7, a + 1), f = t - a; return RACE_V[i][a] + (RACE_V[i][b] - RACE_V[i][a]) * f; };
  const RACE_tgt = t => {
    const vals = RACE_N.map((n, i) => RACE_val(i, t)), order = vals.map((v, i) => i).sort((a, b) => vals[b] - vals[a]), rank = [];
    order.forEach((i, r) => (rank[i] = r));
    return { vals, rank, mx: vals[order[0]] * 1.08 };
  };
  const RACE_SIM = (() => {
    const dt = 1 / 120, n = Math.round(CYC / dt), out = new Float32Array(n * 17);
    const t0 = RACE_tgt(0), y = t0.rank.map(r => (r < RACE_SHOW ? r * RACE_RH : RACE_SHOW * RACE_RH + 8)), o = t0.rank.map(r => (r < RACE_SHOW ? 1 : 0));
    let sc = t0.mx;
    for (let cyc = 0; cyc < 2; cyc++) for (let i = 0; i < n; i++) {
      const u = i * dt, T = RACE_tgt(RACE_t(u)), drag = u >= 5.0 && u < 5.8, kk = Math.min(1, dt * (drag ? 16 : 10));
      sc += (T.mx - sc) * Math.min(1, dt * 4);
      for (let j = 0; j < 8; j++) { const r = T.rank[j]; y[j] += ((r < RACE_SHOW ? r * RACE_RH : RACE_SHOW * RACE_RH + 8) - y[j]) * kk; o[j] += ((r < RACE_SHOW ? 1 : 0) - o[j]) * kk; }
      if (cyc === 1) { for (let j = 0; j < 8; j++) { out[i * 17 + j] = y[j]; out[i * 17 + 8 + j] = o[j]; } out[i * 17 + 16] = sc; }
    }
    return out;
  })();
  CELLS[34] = (k, w, h, u) => {
    k.fillStyle = UX.surface; k.fillRect(0, 0, CW, CH);
    txt(k, '饮品销量排行', 20, 25, UXB_f(900, 13), UX.ink); txt(k, '单位：万杯', CW - 20, 25, UXB_f(700, 10), UX.ink3, 'right');
    const t = RACE_t(u), T = RACE_tgt(t), n = RACE_SIM.length / 17, i0 = (Math.round(u * 120) % n) * 17, sc = RACE_SIM[i0 + 16];
    k.save(); k.globalAlpha = 0.1; txt(k, String(2019 + Math.floor(t + 1e-4)), CW - 20, 166, UXB_f(900, 58), UX.ink, 'right'); k.restore();
    k.save(); k.beginPath(); k.rect(0, RACE_TOP - 2, CW, RACE_SHOW * RACE_RH + 2); k.clip();
    const ord = RACE_N.map((nm, i) => i).sort((a, b) => T.rank[b] - T.rank[a]);
    for (const i of ord) {
      const y = RACE_TOP + RACE_SIM[i0 + i], o = RACE_SIM[i0 + 8 + i];
      if (o < 0.01) continue;
      k.save(); k.globalAlpha = o;
      const bw = Math.max(4, T.vals[i] / sc * RACE_BW);
      txt(k, RACE_N[i], 88, y + 14, UXB_f(800, 11), UX.ink, 'right');
      rr(k, 94, y + 3, bw, 16, 5); k.fillStyle = RACE_COL[i]; k.fill();
      k.save(); k.clip(); k.fillStyle = 'rgba(0,0,0,.12)'; k.fillRect(94, y + 16, bw, 3); k.restore();
      txt(k, String(Math.round(T.vals[i])), 94 + bw + 6, y + 15, UXB_f(800, 10.5), UX.ink2);
      k.restore();
    }
    k.restore();
    // 播放键与年份滑块
    const paused = u >= 4.95 && u < 6.0;
    k.fillStyle = UX.ink; k.beginPath(); k.arc(31, 188, 11, 0, TAU); k.fill(); k.fillStyle = UX.surface;
    if (paused) { k.beginPath(); k.moveTo(27.5, 182.5); k.lineTo(36, 188); k.lineTo(27.5, 193.5); k.closePath(); k.fill(); }
    else { rr(k, 26.5, 182.5, 3.2, 11, 1); k.fill(); rr(k, 32.3, 182.5, 3.2, 11, 1); k.fill(); }
    const L = RACE_SL1 - RACE_SL0, tx = RACE_SL0 + L * t / 7;
    rr(k, RACE_SL0, 186, L, 4, 2); k.fillStyle = UX.line; k.fill();
    rr(k, RACE_SL0, 186, Math.max(4, tx - RACE_SL0), 4, 2); k.fillStyle = UX.accent; k.fill();
    k.fillStyle = 'rgba(142,138,151,.5)'; for (let j = 0; j < 8; j++) k.fillRect(RACE_SL0 + L * j / 7, 194, 1, 3);
    k.save(); k.shadowColor = 'rgba(40,30,80,.3)'; k.shadowBlur = 6; k.shadowOffsetY = 2;
    k.fillStyle = UX.accent; k.beginPath(); k.arc(tx, 188, 8.5, 0, TAU); k.fill(); k.restore();
    k.fillStyle = UX.surface; k.beginPath(); k.arc(tx, 188, 5.5, 0, TAU); k.fill();
    const c = UXB_path(u, RACE_KEYS), pr = u >= 4.92 && u < 5.8 ? Math.min(1, seg(u, 4.92, 5.0)) * (1 - seg(u, 5.8, 5.9)) : UXB_press(u, 6.0);
    ripple(k, c[0], c[1], seg(u, 6.0, 6.4), '255,255,255');
    if (u > 4.5 && u < 6.36) cursor(k, c[0], c[1], pr);
  };

  // @element 36
  // 36 华夫格翻转：100 格华夫图表示 100 人的通勤方式（地铁/公交/汽车/骑行步行）。指针 0.8、2.0、3.2 秒依次点 30–39、40–49、50+ 岁标签，
  // 只有换了归属的格子沿对角线波浪（延迟 (列+行)×22ms）做 380ms 翻转（中点 rotateY 90°、缩到 .85、此刻换色）；右侧百分比 700ms 滚动到新值；
  // 3.85–4.6 秒悬停图例"汽车"：其余格子降到 .16 透明（.25s）；5.0 秒点回 20–29 岁，翻回初始分布，指针离开。
  const WAF_CAT = ['地铁', '公交', '汽车', '骑行/步行'], WAF_AGE = ['20–29 岁', '30–39 岁', '40–49 岁', '50 岁+'];
  const WAF_COL = ['#6366F1', '#10B981', '#F59E0B', '#EC4899'];
  const WAF_D = [[46, 28, 10, 16], [41, 22, 27, 10], [30, 18, 45, 7], [24, 27, 41, 8]];
  const WAF_OWN = WAF_D.map(d => { const o = []; d.forEach((n, c) => { for (let j = 0; j < n; j++) o.push(c); }); return o; });
  const WAF_EV = [[0, 0], [0.8, 1], [2.0, 2], [3.2, 3], [5.0, 0]];
  const WAF_GX = 22, WAF_GY = 40, WAF_CS = 13, WAF_GAP = 3, WAF_TX0 = 200, WAF_TW = 76.75;
  const WAF_tx = i => WAF_TX0 + i * (WAF_TW + 4) + WAF_TW / 2;
  const WAF_li = i => [WAF_TX0 + (i % 2) * 163, 70 + Math.floor(i / 2) * 64, 156, 58];
  const WAF_KEYS = [[0, 560, 230], [0.4, 560, 230], [0.75, WAF_tx(1), 48], [1.0, WAF_tx(1), 48], [1.95, WAF_tx(2), 48], [2.2, WAF_tx(2), 48], [3.15, WAF_tx(3), 48], [3.4, WAF_tx(3), 48], [3.85, 278, 166], [4.6, 282, 170], [4.95, WAF_tx(0), 48], [5.2, WAF_tx(0), 48], [5.8, 570, 230]];
  const WAF_hit = p => { for (let i = 0; i < 4; i++) { const [x, y, w, h] = WAF_li(i); if (p[0] >= x && p[0] < x + w && p[1] >= y && p[1] < y + h) return i; } return -1; };
  const WAF_HEV = UXB_changes(u => WAF_hit(UXB_path(u, WAF_KEYS)));
  const WAF_ANY = [[-1, 0], ...WAF_HEV.slice(1).map(([t, v]) => [t, v >= 0 ? 1 : 0])];
  const WAF_HL = [0, 1, 2, 3].map(c => [[-1, 0], ...WAF_HEV.slice(1).map(([t, v]) => [t, v === c ? 1 : 0])]);
  CELLS[35] = (k, w, h, u) => {
    k.fillStyle = UX.surface; k.fillRect(0, 0, CW, CH);
    txt(k, '通勤方式', 22, 28, UXB_f(900, 14), UX.ink); txt(k, '每 100 人', CW - 20, 28, UXB_f(700, 10.5), UX.ink3, 'right');
    let j = 0; WAF_EV.forEach((e, i) => { if (u >= e[0]) j = i; });
    const te = WAF_EV[j][0], own = WAF_OWN[WAF_EV[j][1]], prev = j > 0 ? WAF_OWN[WAF_EV[j - 1][1]] : own;
    const fAny = UXB_ramp(u, WAF_ANY, 0.25, x => x), hl = WAF_HL.map(e => UXB_ramp(u, e, 0.25, x => x));
    for (let i = 0; i < 100; i++) {
      const delay = ((i % 10) + Math.floor(i / 10)) * 0.022;
      let col = own[i], sx = 1, sc = 1;
      if (j > 0 && prev[i] !== own[i]) {
        if (u < te + delay + 0.19) col = prev[i];
        const lt = (u - te - delay) / 0.38;
        if (lt > 0 && lt < 1) { const e = lt * lt * (3 - 2 * lt), ang = (e < 0.5 ? e * 2 : (1 - e) * 2) * 90; sx = Math.cos(ang * Math.PI / 180); sc = 1 - 0.15 * ang / 90; }
      }
      const x = WAF_GX + (i % 10) * (WAF_CS + WAF_GAP) + WAF_CS / 2, y = WAF_GY + Math.floor(i / 10) * (WAF_CS + WAF_GAP) + WAF_CS / 2;
      const cw = WAF_CS * sc * Math.max(0.02, sx), ch = WAF_CS * sc;
      k.globalAlpha = 1 - 0.84 * clamp(fAny - hl[col]);
      rr(k, x - cw / 2, y - ch / 2, cw, ch, Math.min(4, cw / 2)); k.fillStyle = WAF_COL[col]; k.fill();
    }
    k.globalAlpha = 1;
    WAF_AGE.forEach((s, i) => {
      const on = i === WAF_EV[j][1], x = WAF_TX0 + i * (WAF_TW + 4);
      rr(k, x, 36, WAF_TW, 24, 9); k.fillStyle = on ? UX.ink : UX.surface2; k.fill();
      txt(k, s, x + WAF_TW / 2, 52, UXB_f(800, 10.5), on ? UX.surface : UX.ink2, 'center');
    });
    const from = j > 0 ? WAF_D[WAF_EV[j - 1][1]] : WAF_D[0], to = WAF_D[WAF_EV[j][1]], re = out3(seg(u, te, te + 0.7));
    for (let i = 0; i < 4; i++) {
      const [x, y, lw, lh] = WAF_li(i);
      k.save(); k.globalAlpha = 1 - 0.6 * clamp(fAny - hl[i]);
      if (hl[i] > 0.01) { k.save(); k.globalAlpha *= hl[i]; rr(k, x, y, lw, lh, 10); k.fillStyle = UX.surface2; k.fill(); k.restore(); }
      rr(k, x + 8, y + 10, 8, 8, 2); k.fillStyle = WAF_COL[i]; k.fill();
      txt(k, WAF_CAT[i], x + 21, y + 18, UXB_f(750, 10.5), UX.ink2);
      const v = String(Math.round(mix(from[i], to[i], re))), pf = UXB_f(900, 26); k.font = pf;
      txt(k, v, x + 8, y + 47, pf, UX.ink); txt(k, '%', x + 10 + k.measureText(v).width, y + 47, UXB_f(800, 12), UX.ink3);
      k.restore();
    }
    const c = UXB_path(u, WAF_KEYS);
    for (const [t] of WAF_EV.slice(1)) ripple(k, c[0], c[1], seg(u, t, t + 0.5));
    if (u > 0.4 && u < 5.8) cursor(k, c[0], c[1], Math.max(...WAF_EV.slice(1).map(([t]) => UXB_press(u, t))));
  };

  // @element 37
  // 37 季度气泡移动：8 个 App 气泡（面积≈营收，半径 4+√营收×2.6）在"月活用户（对数 1万–1000万）× 30 日留存（10–70%）"坐标上随季度沿各自路径滑动，
  // 背后是大号季度字样，"照片编辑"留着虚线轨迹与逐季点。0.2–2.8 秒自动播放（每秒 2.4 个季度）；2.8 秒指针按住背景，2.9–3.9 秒向右拖（每 8px 一个季度）快进到 2026 Q4；
  // 4.6 秒再次按住，4.7–5.8 秒向左拖回 2021 Q1；6.0 秒点右上角播放键恢复播放状态，指针离开。关键帧在 0/8/16/23 季度，之间 smoothstep 插值（用户数取对数插值）。
  const QBB_NAME = ['笔记', '待办', '健走', '冥想', '照片编辑', '阅读', '记账', '投资'];
  const QBB_CAT = ['效率', '健康', '爱好', '金融'], QBB_COL = ['#6366F1', '#10B981', '#F59E0B', '#EC4899'], QBB_C = [0, 0, 1, 1, 2, 2, 3, 3];
  const QBB_KQ = [0, 8, 16, 23];
  const QBB_K = [[[30, 42, 5], [60, 46, 8], [90, 48, 10], [110, 50, 12]], [[8, 30, 2], [40, 38, 6], [150, 44, 15], [300, 47, 26]], [[200, 25, 4], [500, 22, 6], [420, 28, 7], [380, 34, 9]], [[15, 50, 6], [80, 55, 14], [60, 52, 12], [45, 58, 13]],
    [[120, 35, 10], [180, 30, 12], [260, 33, 18], [600, 38, 32]], [[5, 60, 3], [9, 62, 4], [20, 64, 6], [35, 66, 8]], [[50, 28, 3], [70, 31, 4], [140, 40, 9], [180, 45, 12]], [[2, 20, 1], [260, 18, 10], [90, 24, 6], [70, 35, 7]]];
  const QBB_PL = 46, QBB_PR = 512, QBB_PT = 38, QBB_PB = 170, QBB_NQ = 23;
  function QBB_at(i, q) {
    let s = 1; for (; s < QBB_KQ.length; s++) if (q <= QBB_KQ[s]) break;
    s = Math.min(s, QBB_KQ.length - 1);
    const a = QBB_K[i][s - 1], b = QBB_K[i][s]; let f = (q - QBB_KQ[s - 1]) / (QBB_KQ[s] - QBB_KQ[s - 1]); f = f * f * (3 - 2 * f);
    return [Math.exp(Math.log(a[0]) + (Math.log(b[0]) - Math.log(a[0])) * f), a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }
  const QBB_px = v => QBB_PL + Math.log(v) / Math.LN10 / 3 * (QBB_PR - QBB_PL);
  const QBB_py = r => QBB_PB - (r - 10) / 60 * (QBB_PB - QBB_PT);
  const QBB_rad = v => 4 + Math.sqrt(v) * 2.6;
  const QBB_KEYS = [[0, 560, 240], [2.3, 560, 240], [2.75, 200, 100], [2.9, 200, 100], [3.9, 200 + (QBB_NQ - 2.6 * 2.4) * 8, 100], [4.45, 380, 120], [4.7, 380, 120], [5.8, 380 - QBB_NQ * 8, 120], [6.0, 509, 24], [6.38, 570, 6]];
  function QBB_q(u) {
    if (u < 0.2) return 0;
    if (u < 2.8) return (u - 0.2) * 2.4;
    const c = UXB_path(u, QBB_KEYS);
    if (u < 4.6) return clamp(2.6 * 2.4 + (c[0] - 200) / 8, 0, QBB_NQ);
    if (u < 5.8) return clamp(QBB_NQ + (c[0] - 380) / 8, 0, QBB_NQ);
    return 0;
  }
  CELLS[36] = (k, w, h, u) => {
    k.fillStyle = UX.surface; k.fillRect(0, 0, CW, CH);
    const q = QBB_q(u), qk = Math.floor(q + 1e-4);
    k.save(); k.globalAlpha = 0.07; txt(k, `${2021 + Math.floor(qk / 4)} Q${qk % 4 + 1}`, (QBB_PL + QBB_PR) / 2, 124, UXB_f(900, 52), UX.ink, 'center'); k.restore();
    k.strokeStyle = 'rgba(22,21,27,.09)'; k.lineWidth = 1; const tf = UXB_f(700, 9);
    [['1万', 0], ['10万', 1], ['100万', 2], ['1000万', 3]].forEach(([s, j]) => {
      const x = QBB_PL + j / 3 * (QBB_PR - QBB_PL); k.beginPath(); k.moveTo(x + 0.5, QBB_PT); k.lineTo(x + 0.5, QBB_PB); k.stroke();
      txt(k, s, x, QBB_PB + 12, tf, UX.ink3, j === 0 ? 'left' : j === 3 ? 'right' : 'center');
    });
    [20, 40, 60].forEach(r => { const y = QBB_py(r); k.beginPath(); k.moveTo(QBB_PL, y + 0.5); k.lineTo(QBB_PR, y + 0.5); k.stroke(); txt(k, r + '%', QBB_PL - 5, y + 3, tf, UX.ink3, 'right'); });
    txt(k, '月活用户 →', QBB_PR, QBB_PB + 26, tf, UX.ink3, 'right'); txt(k, '30 日留存', 16, 24, tf, UX.ink3);
    let lx = 150; QBB_CAT.forEach((c, i) => { k.fillStyle = QBB_COL[i]; k.beginPath(); k.arc(lx + 4, 20, 4, 0, TAU); k.fill(); txt(k, c, lx + 11, 24, UXB_f(750, 10), UX.ink2); lx += 54; });
    // "照片编辑"的虚线轨迹与逐季点
    const ti = 4; k.save(); k.strokeStyle = QBB_COL[QBB_C[ti]]; k.fillStyle = QBB_COL[QBB_C[ti]]; k.setLineDash([3, 3]); k.lineWidth = 1.4; k.globalAlpha = 0.6; k.beginPath();
    for (let s = 0; s <= q; s += 0.25) { const p = QBB_at(ti, s); if (s === 0) k.moveTo(QBB_px(p[0]), QBB_py(p[1])); else k.lineTo(QBB_px(p[0]), QBB_py(p[1])); }
    const pe = QBB_at(ti, q); k.lineTo(QBB_px(pe[0]), QBB_py(pe[1])); k.stroke(); k.setLineDash([]);
    for (let s = 0; s <= Math.floor(q); s++) { const p = QBB_at(ti, s); k.beginPath(); k.arc(QBB_px(p[0]), QBB_py(p[1]), 1.8, 0, TAU); k.fill(); }
    k.restore();
    const cur = QBB_NAME.map((n, i) => { const p = QBB_at(i, q); return { i, x: QBB_px(p[0]), y: QBB_py(p[1]), r: QBB_rad(p[2]) }; }).sort((a, b) => b.r - a.r);
    cur.forEach(b => {
      k.globalAlpha = 0.85; k.fillStyle = QBB_COL[QBB_C[b.i]]; k.beginPath(); k.arc(b.x, b.y, b.r, 0, TAU); k.fill();
      k.globalAlpha = 1; k.strokeStyle = 'rgba(255,255,255,.75)'; k.lineWidth = 1.2; k.stroke();
      if (b.i === ti) txt(k, QBB_NAME[b.i], b.x, b.y - b.r - 5, UXB_f(800, 10), UX.ink, 'center');
    });
    const paused = u >= 2.8 && u < 6.0;
    k.fillStyle = UX.ink; k.beginPath(); k.arc(509, 24, 11, 0, TAU); k.fill(); k.fillStyle = UX.surface;
    if (paused) { k.beginPath(); k.moveTo(505.5, 18.5); k.lineTo(514, 24); k.lineTo(505.5, 29.5); k.closePath(); k.fill(); }
    else { rr(k, 504.5, 18.5, 3.2, 11, 1); k.fill(); rr(k, 510.3, 18.5, 3.2, 11, 1); k.fill(); }
    const c = UXB_path(u, QBB_KEYS);
    const hold = (a, b) => (u >= a - 0.08 && u < b + 0.14 ? Math.min(1, seg(u, a - 0.08, a)) * (1 - seg(u, b, b + 0.14)) : 0);
    ripple(k, c[0], c[1], seg(u, 6.0, 6.4));
    if (u > 2.3 && u < 6.38) cursor(k, c[0], c[1], Math.max(hold(2.8, 3.9), hold(4.6, 5.8), UXB_press(u, 6.0)));
  };

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

  // @element 38
  // 38 折线图绘制（KittenJam #197）：淡格线上，折线 0.3–1.9 秒由左到右匀速画出；线头经过时 10 个数据点依次弹出（0.3 秒 backOut），
  // 画到 60% 起线下渐变面积 0.6 秒淡入；1.9–2.3 秒终点上方浮出增长标签；5.4–6.0 秒全部淡出复位。
  const LCD_V = [12, 18, 15, 24, 22, 31, 29, 38, 44, 52];
  const LCD_X0 = 60, LCD_X1 = 500, LCD_Y0 = 50, LCD_Y1 = 176, LCD_MAX = 60, LCD_T0 = 0.3, LCD_DUR = 1.6;
  const LCD_pt = i => [mix(LCD_X0, LCD_X1, i / (LCD_V.length - 1)), LCD_Y1 - LCD_V[i] / LCD_MAX * (LCD_Y1 - LCD_Y0)];
  CELLS[37] = (k, w, h, u) => {
    k.fillStyle = UX.surface; k.fillRect(0, 0, CW, CH);
    txt(k, '月营收增长', 22, 28, UXB_f(900, 14), UX.ink); txt(k, '单位：万元', CW - 20, 28, UXB_f(700, 10.5), UX.ink3, 'right');
    k.strokeStyle = UX.line; k.lineWidth = 1;
    [0, 20, 40, 60].forEach(v => {
      const y = Math.round(LCD_Y1 - v / LCD_MAX * (LCD_Y1 - LCD_Y0)) + 0.5;
      k.beginPath(); k.moveTo(LCD_X0, y); k.lineTo(LCD_X1, y); k.stroke(); txt(k, String(v), LCD_X0 - 10, y + 3.5, UXB_f(700, 9), UX.ink3, 'right');
    });
    const fa = fadeIn(u), p = seg(u, LCD_T0, LCD_T0 + LCD_DUR), hx = mix(LCD_X0, LCD_X1, p);
    if (fa <= 0 || p <= 0) return;
    const pts = LCD_V.map((_, i) => LCD_pt(i));
    k.save(); k.globalAlpha = fa;
    k.save(); k.beginPath(); k.rect(0, 0, hx, CH); k.clip();
    // 线下面积：线画到 60% 时开始淡入
    const aa = seg(u, LCD_T0 + LCD_DUR * 0.6, LCD_T0 + LCD_DUR * 0.6 + 0.6);
    if (aa > 0) {
      const g = k.createLinearGradient(0, LCD_Y0, 0, LCD_Y1); g.addColorStop(0, 'rgba(106,87,242,.28)'); g.addColorStop(1, 'rgba(106,87,242,0)');
      k.globalAlpha = fa * aa; k.fillStyle = g; k.beginPath(); k.moveTo(pts[0][0], LCD_Y1);
      pts.forEach(q => k.lineTo(q[0], q[1])); k.lineTo(pts[pts.length - 1][0], LCD_Y1); k.closePath(); k.fill(); k.globalAlpha = fa;
    }
    k.strokeStyle = UX.accent; k.lineWidth = 2.5; k.lineJoin = 'round'; k.lineCap = 'round';
    k.beginPath(); pts.forEach((q, i) => (i ? k.lineTo(q[0], q[1]) : k.moveTo(q[0], q[1]))); k.stroke();
    k.restore();
    // 数据点：线头经过（间隔 = 描绘时长 ÷ 段数）时从 0 弹出
    pts.forEach((q, i) => {
      const s = backOut(seg(u, LCD_T0 + LCD_DUR * i / (LCD_V.length - 1), LCD_T0 + LCD_DUR * i / (LCD_V.length - 1) + 0.3));
      if (s <= 0) return;
      k.fillStyle = UX.surface; k.strokeStyle = UX.accent; k.lineWidth = 2;
      k.beginPath(); k.arc(q[0], q[1], 4 * s, 0, TAU); k.fill(); k.stroke();
    });
    const la = out3(seg(u, 1.9, 2.3));
    if (la > 0) {
      const q = pts[pts.length - 1], y = q[1] - 22 + 8 * (1 - la);
      k.globalAlpha = fa * la; rr(k, q[0] - 30, y - 12, 50, 20, 10); k.fillStyle = UX.mint; k.fill();
      txt(k, '+333%', q[0] - 5, y + 2, UXB_f(800, 10.5), '#FFFFFF', 'center');
    }
    k.restore();
  };

  // @element 39
  // 39 环形图分段（KittenJam #199）：4 段环（42/28/18/12%）从正上方起顺时针依次画出，每段 0.45 秒（inOut3）、段间留 2° 间隙；
  // 中心总数 0.3–0.8 秒淡入；右侧图例从 0.5 秒起每隔 0.12 秒从右 24px 滑入（0.4 秒 out3）；5.4–6.0 秒淡出复位。
  const DNT_V = [42, 28, 18, 12], DNT_N = ['自然搜索', '社交媒体', '直接访问', '邮件推广'];
  const DNT_COL = ['#6A57F2', '#2F8FE0', '#1FB89A', '#D6731E'];
  const DNT_CX = 170, DNT_CY = 108, DNT_R = 62, DNT_LW = 20, DNT_GAP = 2 * Math.PI / 180, DNT_T0 = 0.3, DNT_SEG = 0.45;
  CELLS[38] = (k, w, h, u) => {
    k.fillStyle = UX.surface; k.fillRect(0, 0, CW, CH);
    txt(k, '流量来源', 22, 28, UXB_f(900, 14), UX.ink);
    k.strokeStyle = UX.surface2; k.lineWidth = DNT_LW; k.beginPath(); k.arc(DNT_CX, DNT_CY, DNT_R, 0, TAU); k.stroke();
    const fa = fadeIn(u);
    k.save(); k.globalAlpha = fa; k.lineCap = 'butt';
    let a0 = -Math.PI / 2;
    DNT_V.forEach((v, i) => {
      const span = v / 100 * TAU, t = inOut3(seg(u, DNT_T0 + i * DNT_SEG, DNT_T0 + (i + 1) * DNT_SEG));
      if (t > 0) { k.strokeStyle = DNT_COL[i]; k.beginPath(); k.arc(DNT_CX, DNT_CY, DNT_R, a0 + DNT_GAP / 2, a0 + DNT_GAP / 2 + (span - DNT_GAP) * t); k.stroke(); }
      a0 += span;
    });
    k.globalAlpha = fa * out3(seg(u, 0.3, 0.8));
    txt(k, '12.4万', DNT_CX, DNT_CY + 4, UXB_f(900, 20), UX.ink, 'center');
    txt(k, '本月访问', DNT_CX, DNT_CY + 22, UXB_f(700, 10), UX.ink3, 'center');
    DNT_V.forEach((v, i) => {
      const t = out3(seg(u, 0.5 + i * 0.12, 0.9 + i * 0.12)), y = 62 + i * 30, dx = 24 * (1 - t);
      k.globalAlpha = fa * t;
      rr(k, 300 + dx, y - 9, 10, 10, 3); k.fillStyle = DNT_COL[i]; k.fill();
      txt(k, DNT_N[i], 318 + dx, y, UXB_f(750, 12), UX.ink2);
      txt(k, v + '%', 500 + dx, y, UXB_f(900, 12), UX.ink, 'right');
    });
    k.restore();
  };

  // @element 40
  // 40 全息闪卡（KittenJam #289）：指针 0.3 秒进场在收藏卡上游走；卡片随指针相对位置倾斜（最大 13°，透视 600px），
  // 彩虹箔光（color-dodge 斜条纹）随指针平移、倾斜越大越亮（不透明度 .15→.75），白色柔光（半径 90px）跟随指针；4.6–4.9 秒指针离开，卡片回正。
  const HOL_CX = 269.5, HOL_CY = 100, HOL_W = 112, HOL_H = 164, HOL_MAX = 13 * Math.PI / 180;
  const HOL_KEYS = [[0, 570, 230], [0.3, 570, 230], [0.9, 300, 62], [1.6, 236, 146], [2.4, 306, 146], [3.2, 232, 58], [4.0, 292, 94], [4.6, 300, 88], [5.2, 570, 230]];
  function HOL_face(k) {
    const bg = k.createLinearGradient(0, 0, HOL_W, HOL_H); bg.addColorStop(0, '#2A2350'); bg.addColorStop(1, '#141226');
    k.fillStyle = bg; k.fillRect(0, 0, HOL_W, HOL_H);
    const ag = k.createLinearGradient(0, 8, 0, 104); ag.addColorStop(0, '#5B4BD6'); ag.addColorStop(1, '#E06AA8');
    k.fillStyle = ag; rr(k, 8, 8, HOL_W - 16, 96, 6); k.fill();
    k.strokeStyle = 'rgba(255,255,255,.35)'; k.lineWidth = 1; k.beginPath(); k.arc(HOL_W / 2, 56, 34, 0, TAU); k.stroke();
    k.fillStyle = '#FFE9A8'; k.beginPath();
    for (let j = 0; j < 10; j++) { const r = j % 2 ? 11 : 26, a = -Math.PI / 2 + j * Math.PI / 5; k.lineTo(HOL_W / 2 + Math.cos(a) * r, 56 + Math.sin(a) * r); }
    k.closePath(); k.fill();
    txt(k, '星辉', 10, 124, UXB_f(900, 15), UXD.ink); txt(k, 'No. 027', HOL_W - 10, 124, UXB_f(700, 9, MONO), UXD.ink3, 'right');
    k.fillStyle = 'rgba(255,255,255,.18)'; rr(k, 10, 134, 70, 4, 2); k.fill(); rr(k, 10, 143, 50, 4, 2); k.fill();
  }
  CELLS[39] = (k, w, h, u) => {
    k.fillStyle = UXD.page; k.fillRect(0, 0, CW, CH);
    glow(k, HOL_CX, HOL_CY, 150, '183,164,255', 0.12);
    const c = UXB_path(u, HOL_KEYS), hv = pingPong(u, 0.7, 0.95, 4.6, 4.9);
    const px = clamp((c[0] - (HOL_CX - HOL_W / 2)) / HOL_W), py = clamp((c[1] - (HOL_CY - HOL_H / 2)) / HOL_H);
    const ry = (px - 0.5) * 2 * HOL_MAX * hv, rx = (py - 0.5) * 2 * HOL_MAX * hv;
    const tilt = clamp(Math.hypot(px - 0.5, py - 0.5) * 2) * hv;
    k.fillStyle = 'rgba(0,0,0,.5)'; k.beginPath(); k.ellipse(HOL_CX - ry * 40, HOL_CY + HOL_H / 2 + 9, HOL_W * 0.45, 4, 0, 0, TAU); k.fill();
    k.save(); UXC_tilt(k, HOL_W, HOL_H, rx, ry, HOL_CX, HOL_CY);
    rr(k, 0, 0, HOL_W, HOL_H, 10); k.clip();
    HOL_face(k);
    // 箔光：斜向彩虹条纹，位置跟指针，倾斜越大越亮
    k.globalCompositeOperation = 'color-dodge'; k.globalAlpha = 0.15 + 0.6 * tilt;
    const o = (px - 0.5) * HOL_W * 1.6 + (py - 0.5) * HOL_H * 0.5;
    const fg = k.createLinearGradient(o - HOL_W, -20, o + HOL_W * 2, HOL_H + 20);
    for (let i = 0; i <= 12; i++) fg.addColorStop(i / 12, `hsl(${(i * 60) % 360},90%,${i % 2 ? 35 : 62}%)`);
    k.fillStyle = fg; k.fillRect(0, 0, HOL_W, HOL_H);
    k.globalCompositeOperation = 'source-over'; k.globalAlpha = 1;
    // 柔光：白色径向渐变跟随指针
    const gx = px * HOL_W, gy = py * HOL_H, gl = k.createRadialGradient(gx, gy, 0, gx, gy, 90);
    gl.addColorStop(0, `rgba(255,255,255,${0.35 * hv})`); gl.addColorStop(1, 'rgba(255,255,255,0)');
    k.fillStyle = gl; k.fillRect(0, 0, HOL_W, HOL_H);
    k.restore();
    k.save(); UXC_tilt(k, HOL_W, HOL_H, rx, ry, HOL_CX, HOL_CY);
    k.strokeStyle = 'rgba(255,255,255,.28)'; k.lineWidth = 1; rr(k, 0.5, 0.5, HOL_W - 1, HOL_H - 1, 10); k.stroke(); k.restore();
    if (u > 0.3 && u < 5.2) cursor(k, c[0], c[1]);
  };

  // @element 41
  // 41 3D 倾斜视差图片（KittenJam #105）：指针在风景图上游走，整图朝指针方向倾斜（最大 10°）并放大到 1.04；
  // 天空/太阳/远山/中丘/近景分层向指针反方向位移 2/3/5/10/18px 形成景深；柔光（半径 120px）跟随指针；说明文字从下方 18px 滑上；4.6–4.95 秒指针离开，全部回正。
  const TPI_CX = 269.5, TPI_CY = 100, TPI_W = 280, TPI_H = 150, TPI_MAX = 10 * Math.PI / 180;
  const TPI_KEYS = [[0, 570, 230], [0.3, 570, 230], [0.9, 340, 62], [1.7, 176, 146], [2.5, 364, 146], [3.3, 186, 58], [4.1, 300, 106], [4.6, 290, 98], [5.2, 570, 230]];
  const TPI_FAR = [[-20, 110], [30, 72], [70, 92], [120, 58], [170, 88], [220, 64], [300, 104]];
  const TPI_MID = [[-20, 124], [50, 100], [110, 118], [180, 94], [240, 112], [300, 98]];
  const TPI_NEAR = [[-20, 136], [80, 126], [160, 138], [300, 128]];
  function TPI_ridge(k, pts, dx, dy, col) {
    k.fillStyle = col; k.beginPath(); pts.forEach(([x, y], i) => (i ? k.lineTo(x + dx, y + dy) : k.moveTo(x + dx, y + dy)));
    k.lineTo(300 + dx, TPI_H + 30); k.lineTo(-20 + dx, TPI_H + 30); k.closePath(); k.fill();
  }
  CELLS[40] = (k, w, h, u) => {
    k.fillStyle = UXD.page; k.fillRect(0, 0, CW, CH);
    const c = UXB_path(u, TPI_KEYS), hv = pingPong(u, 0.7, 1.0, 4.6, 4.95);
    const px = clamp((c[0] - (TPI_CX - TPI_W / 2)) / TPI_W), py = clamp((c[1] - (TPI_CY - TPI_H / 2)) / TPI_H);
    const ry = (px - 0.5) * 2 * TPI_MAX * hv, rx = (py - 0.5) * 2 * TPI_MAX * hv, sc = 1 + 0.04 * hv;
    k.fillStyle = 'rgba(0,0,0,.5)'; k.beginPath(); k.ellipse(TPI_CX, TPI_CY + TPI_H / 2 + 12, TPI_W * 0.42, 5, 0, 0, TAU); k.fill();
    k.save(); UXC_tilt(k, TPI_W, TPI_H, rx, ry, TPI_CX, TPI_CY, sc);
    rr(k, 0, 0, TPI_W, TPI_H, 14); k.clip();
    // 视差方向与指针相反，系数越大越靠前
    const ox = -(px - 0.5) * 2 * hv, oy = -(py - 0.5) * 2 * hv;
    const sky = k.createLinearGradient(0, -20, 0, TPI_H); sky.addColorStop(0, '#2B2D6E'); sky.addColorStop(0.75, '#F08A5D'); sky.addColorStop(1, '#F6C177');
    k.fillStyle = sky; k.fillRect(-20 + ox * 2, -20 + oy * 2, TPI_W + 40, TPI_H + 40);
    const sx = TPI_W * 0.62 + ox * 3, sy = 70 + oy * 3;
    glow(k, sx, sy, 60, '255,227,163', 0.45); k.fillStyle = '#FFE3A3'; k.beginPath(); k.arc(sx, sy, 20, 0, TAU); k.fill();
    TPI_ridge(k, TPI_FAR, ox * 5, oy * 5, 'rgba(92,70,140,.9)');
    TPI_ridge(k, TPI_MID, ox * 10, oy * 10, '#3A2F63');
    TPI_ridge(k, TPI_NEAR, ox * 18, oy * 18, '#1A1530');
    k.fillStyle = '#1A1530';
    [[26, 128, 30], [44, 124, 38], [238, 126, 34], [256, 128, 26]].forEach(([x, y, th]) => {
      k.beginPath(); k.moveTo(x + ox * 18 - 8, y + oy * 18); k.lineTo(x + ox * 18, y - th + oy * 18); k.lineTo(x + ox * 18 + 8, y + oy * 18); k.closePath(); k.fill();
    });
    const gx = px * TPI_W, gy = py * TPI_H, gl = k.createRadialGradient(gx, gy, 0, gx, gy, 120);
    gl.addColorStop(0, `rgba(255,255,255,${0.3 * hv})`); gl.addColorStop(1, 'rgba(255,255,255,0)');
    k.fillStyle = gl; k.fillRect(0, 0, TPI_W, TPI_H);
    // 说明：底部暗渐变 + 小标与标题从下方滑上
    if (hv > 0) {
      const cg = k.createLinearGradient(0, TPI_H - 60, 0, TPI_H); cg.addColorStop(0, 'rgba(0,0,0,0)'); cg.addColorStop(1, `rgba(0,0,0,${0.55 * hv})`);
      k.fillStyle = cg; k.fillRect(0, TPI_H - 60, TPI_W, 60);
      const dy = 18 * (1 - out3(hv));
      k.globalAlpha = hv; txt(k, '摄影 · 2026', 14, TPI_H - 30 + dy, UXB_f(700, 9.5), 'rgba(255,255,255,.75)');
      txt(k, '山岚 夕照', 14, TPI_H - 12 + dy, UXB_f(900, 16), '#FFFFFF'); k.globalAlpha = 1;
    }
    k.restore();
    k.save(); UXC_tilt(k, TPI_W, TPI_H, rx, ry, TPI_CX, TPI_CY, sc);
    k.strokeStyle = 'rgba(255,255,255,.18)'; k.lineWidth = 1; rr(k, 0.5, 0.5, TPI_W - 1, TPI_H - 1, 14); k.stroke(); k.restore();
    if (u > 0.3 && u < 5.2) cursor(k, c[0], c[1]);
  };

  // @element 42
  // 42 眼睛跟随（KittenJam #257）：吉祥物脸上一对大眼，眼珠朝指针方向偏移，距离 = min(1, 距离/150)×14px（比指针晚 0.06 秒）；
  // 1.9 与 3.9 秒两眼同时眨一下（0.15 秒内纵向压到 10% 再恢复）；指针 0.3–0.8 秒进场、4.9–5.4 秒离开，眼珠回到中央。
  const EYE_P = [[229, 92], [309, 92]], EYE_RX = 30, EYE_RY = 34, EYE_PR = 13, EYE_OFF = 14, EYE_RANGE = 150, EYE_LAG = 0.06;
  const EYE_KEYS = [[0, 570, 230], [0.3, 570, 230], [0.9, 470, 36], [1.6, 70, 50], [2.3, 269, 168], [2.8, 269, 106], [3.4, 90, 176], [4.1, 480, 172], [4.8, 430, 56], [5.4, 570, 230]];
  const EYE_BLINK = [1.9, 3.9];
  CELLS[41] = (k, w, h, u) => {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    k.save(); k.shadowColor = UX.shadow; k.shadowBlur = 18; k.shadowOffsetY = 6;
    k.fillStyle = UX.accent; rr(k, 164, 26, 210, 140, 60); k.fill(); k.restore();
    const hv = pingPong(u, 0.3, 0.8, 4.9, 5.4), c = UXB_path(Math.max(0, u - EYE_LAG), EYE_KEYS);
    let bl = 1; for (const t of EYE_BLINK) { const e = seg(u, t, t + 0.15); bl = Math.min(bl, 1 - 0.9 * (1 - Math.abs(2 * e - 1))); }
    EYE_P.forEach(([ex, ey]) => {
      k.save(); k.translate(ex, ey); k.scale(1, bl);
      k.fillStyle = '#FFFFFF'; k.beginPath(); k.ellipse(0, 0, EYE_RX, EYE_RY, 0, 0, TAU); k.fill();
      const dx = c[0] - ex, dy = c[1] - ey, a = Math.atan2(dy, dx), r = Math.min(1, Math.hypot(dx, dy) / EYE_RANGE) * EYE_OFF * hv;
      const qx = Math.cos(a) * r, qy = Math.sin(a) * r;
      k.fillStyle = UX.ink; k.beginPath(); k.arc(qx, qy, EYE_PR, 0, TAU); k.fill();
      k.fillStyle = '#FFFFFF'; k.beginPath(); k.arc(qx + 4, qy - 4, 4, 0, TAU); k.fill();
      k.restore();
    });
    k.strokeStyle = 'rgba(255,255,255,.85)'; k.lineWidth = 3; k.lineCap = 'round';
    k.beginPath(); k.arc(269, 134, 12, 0.15 * Math.PI, 0.85 * Math.PI); k.stroke();
    txt(k, '404 · 页面走丢了', 269.5, 192, UXB_f(800, 11), UX.ink3, 'center');
    const cp = UXB_path(u, EYE_KEYS);
    if (u > 0.3 && u < 5.4) cursor(k, cp[0], cp[1]);
  };

  // @element 43
  // 43 刮刮乐揭示（KittenJam #180）：银色表层盖住优惠券；指针 0.85 秒按下，沿 7 段之字形来回刮到 3.0 秒（圆头笔刷 30px），
  // 离屏 canvas 每帧重画表层，再用 destination-out 擦掉截至当前时刻的整条轨迹；3.1–3.6 秒剩余表层淡出；5.4–6.0 秒表层淡回复位。
  const SCR_X = 120, SCR_Y = 34, SCR_W = 300, SCR_H = 140, SCR_BR = 30, SCR_T0 = 0.85, SCR_T1 = 3.0;
  const SCR_KEYS = [[0, 570, 230], [0.3, 570, 230], [0.75, 145, 52], [0.85, 145, 52], [1.17, 395, 62], [1.49, 145, 82], [1.81, 395, 102],
    [2.13, 145, 122], [2.45, 395, 142], [2.77, 145, 160], [3.0, 262, 158], [3.6, 570, 230]];
  const SCR_OFF = {};                                   // 只缓存离屏画布本身；内容每帧清空重画，不跨帧保留
  function SCR_coat(g) {
    g.save(); rr(g, SCR_X, SCR_Y, SCR_W, SCR_H, 14); g.clip();
    const m = g.createLinearGradient(SCR_X, SCR_Y, SCR_X + SCR_W, SCR_Y + SCR_H);
    m.addColorStop(0, '#B8BCC8'); m.addColorStop(0.45, '#EEF0F4'); m.addColorStop(0.55, '#D9DCE4'); m.addColorStop(1, '#AEB2BE');
    g.fillStyle = m; g.fillRect(SCR_X, SCR_Y, SCR_W, SCR_H);
    g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 6;
    for (let x = SCR_X - SCR_H; x < SCR_X + SCR_W; x += 26) { g.beginPath(); g.moveTo(x, SCR_Y + SCR_H); g.lineTo(x + SCR_H, SCR_Y); g.stroke(); }
    txt(g, '刮开看看', SCR_X + SCR_W / 2, SCR_Y + 74, UXB_f(900, 22), '#5F6370', 'center');
    txt(g, '按住来回刮开表层', SCR_X + SCR_W / 2, SCR_Y + 96, UXB_f(700, 10.5), '#7A7E8A', 'center');
    g.restore();
  }
  CELLS[42] = (k, w, h, u) => {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    const cx = SCR_X + SCR_W / 2;
    card(k, SCR_X, SCR_Y, SCR_W, SCR_H, 14, '#FFF7EC');
    k.setLineDash([5, 4]); k.strokeStyle = 'rgba(214,115,30,.5)'; k.lineWidth = 1.2; rr(k, SCR_X + 10.5, SCR_Y + 10.5, SCR_W - 21, SCR_H - 21, 10); k.stroke(); k.setLineDash([]);
    txt(k, '恭喜获得', cx, SCR_Y + 40, UXB_f(700, 11), UX.ink3, 'center');
    txt(k, '免运费优惠券', cx, SCR_Y + 78, UXB_f(900, 26), UX.warn, 'center');
    txt(k, '全场满 99 元可用 · 券码 FREESHIP', cx, SCR_Y + 106, UXB_f(700, 10.5), UX.ink2, 'center');
    if (!SCR_OFF.c) { SCR_OFF.c = document.createElement('canvas'); SCR_OFF.c.width = CW * 2; SCR_OFF.c.height = CH * 2; SCR_OFF.g = SCR_OFF.c.getContext('2d'); }
    const g = SCR_OFF.g;
    g.setTransform(2, 0, 0, 2, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, CW, CH);
    SCR_coat(g);
    let a;
    if (u >= SHOW) a = resetK(u);                       // 复位：完整表层淡回
    else {
      a = 1 - inOut3(seg(u, 3.1, 3.6));
      if (u > SCR_T0) {
        // 从按下时刻起按 1/60 秒取样指针轨迹，整条重画擦除
        const te = Math.min(u, SCR_T1), n = Math.floor((te - SCR_T0) * 60);
        g.globalCompositeOperation = 'destination-out'; g.strokeStyle = '#000'; g.lineWidth = SCR_BR; g.lineCap = 'round'; g.lineJoin = 'round';
        g.beginPath(); let p = UXB_path(SCR_T0, SCR_KEYS); g.moveTo(p[0], p[1]);
        for (let j = 1; j <= n; j++) { p = UXB_path(SCR_T0 + j / 60, SCR_KEYS); g.lineTo(p[0], p[1]); }
        p = UXB_path(te, SCR_KEYS); g.lineTo(p[0], p[1]); g.stroke();
        g.globalCompositeOperation = 'source-over';
      }
    }
    if (a > 0) { k.save(); k.globalAlpha = a; k.drawImage(SCR_OFF.c, 0, 0, CW, CH); k.restore(); }
    const c = UXB_path(u, SCR_KEYS);
    if (u > 0.3 && u < 3.6) cursor(k, c[0], c[1], UXC_hold(u, SCR_T0, SCR_T1));
  };

  // @element 44
  // 44 流场线条（KittenJam #173）：220 条细线顺着随时间缓变的流场（角度 = 两组正弦叠加，相位每 6.4 秒一圈）以 60px/s 前进，留 0.6 秒拖尾；
  // 每条寿命 1.6 秒（每周期 4 代，出生位置按下标与代数确定性生成），透明度按 sin 渐入渐出；指针 1.2–4.2 秒在画面中游走，周围 70px（高斯 σ）流向被扭成切向漩涡。
  const FLF_N = 220, FLF_LIFE = CYC / 4, FLF_DT = 1 / 30, FLF_SPD = 60, FLF_TAIL = 18, FLF_SIG = 70;
  const FLF_KEYS = [[0, 570, 230], [0.6, 570, 230], [1.2, 330, 100], [2.2, 200, 80], [3.2, 360, 132], [4.2, 262, 108], [5.0, 570, 230]];
  const FLF_P = Array.from({ length: FLF_N }, (_, i) => ({ off: hash(i * 3 + 1) * FLF_LIFE, alt: hash(i * 5 + 2) < 0.5 }));
  const FLF_wrap = t => ((t % CYC) + CYC) % CYC;
  function FLF_ang(x, y, t) {
    const ph = TAU * t / CYC;
    let a = Math.sin(x * 0.009 + Math.cos(ph) * 1.2) * 1.3 + Math.cos(y * 0.016 + Math.sin(ph) * 1.5) * 0.9;
    const hv = pingPong(t, 0.9, 1.2, 4.4, 4.8);
    if (hv > 0) {
      const c = UXB_path(t, FLF_KEYS), dx = x - c[0], dy = y - c[1], wgt = hv * Math.exp(-(dx * dx + dy * dy) / (2 * FLF_SIG * FLF_SIG));
      if (wgt > 0.01) { const tg = Math.atan2(dy, dx) + Math.PI / 2; a = Math.atan2(mix(Math.sin(a), Math.sin(tg), wgt), mix(Math.cos(a), Math.cos(tg), wgt)); }
    }
    return a;
  }
  CELLS[43] = (k, w, h, u) => {
    k.fillStyle = UXD.page; k.fillRect(0, 0, CW, CH);
    k.lineWidth = 1.1; k.lineCap = 'round'; k.lineJoin = 'round';
    const pts = [];
    for (let i = 0; i < FLF_N; i++) {
      const P = FLF_P[i]; let tt = u - P.off; if (tt < 0) tt += CYC;
      const gen = Math.floor(tt / FLF_LIFE), age = tt - gen * FLF_LIFE, born = P.off + gen * FLF_LIFE;
      const al = 0.6 * Math.sin(Math.PI * age / FLF_LIFE), n = Math.floor(age / FLF_DT);
      if (al < 0.02 || n < 1) continue;
      // 每帧从出生点重新积分到当前年龄（纯函数，不保留粒子状态）
      let x = hash(i * 7 + gen * 131 + 0.5) * (CW + 60) - 30, y = hash(i * 11 + gen * 97 + 0.25) * (CH + 40) - 20;
      pts.length = 0; pts.push(x, y);
      for (let s = 0; s < n; s++) { const a = FLF_ang(x, y, FLF_wrap(born + s * FLF_DT)); x += Math.cos(a) * FLF_SPD * FLF_DT; y += Math.sin(a) * FLF_SPD * FLF_DT; pts.push(x, y); }
      const s0 = Math.max(0, n - FLF_TAIL);
      k.strokeStyle = P.alt ? `rgba(183,164,255,${al})` : `rgba(125,180,255,${al})`;
      k.beginPath(); k.moveTo(pts[s0 * 2], pts[s0 * 2 + 1]); for (let s = s0 + 1; s <= n; s++) k.lineTo(pts[s * 2], pts[s * 2 + 1]); k.stroke();
    }
    const c = UXB_path(u, FLF_KEYS);
    if (u > 0.6 && u < 5.0) cursor(k, c[0], c[1]);
  };

  // @element 45
  // 45 加入购物车飞入（KittenJam #221）：指针 1.0 秒点「加入购物车」（按钮缩到 .95）；商品缩略图复制一份 1.05–1.8 秒飞向右上角购物车：
  // x 按 t² 加速、y 线性并叠加 40px 上拱弧，尺寸 1→0.15；抵达时购物车放大 1.25 弹一下（0.35 秒），角标 2→3 弹出（0.3 秒 backOut）；5.4–6.0 秒交叉淡化复位。
  const CRT_T = 1.0, CRT_F0 = 1.05, CRT_F1 = 1.8, CRT_CX = 470, CRT_CY = 42, CRT_IX = 134, CRT_IY = 104, CRT_IS = 124;
  const CRT_KEYS = [[0, 570, 230], [0.3, 570, 230], [0.85, 282, 150], [1.1, 282, 150], [1.75, 570, 230]];
  function CRT_cup(k, x, y, s) {
    const g = k.createLinearGradient(x, y - s / 2, x, y + s / 2); g.addColorStop(0, '#F3E3CF'); g.addColorStop(1, '#E7CBA9');
    k.fillStyle = g; rr(k, x - s / 2, y - s / 2, s, s, s * 0.1); k.fill();
    k.fillStyle = '#8E4A2B'; k.beginPath(); k.ellipse(x - s * 0.02, y + s * 0.25, s * 0.3, s * 0.04, 0, 0, TAU); k.fill();
    k.strokeStyle = '#B0623B'; k.lineWidth = s * 0.05; k.beginPath(); k.arc(x + s * 0.17, y + s * 0.03, s * 0.1, -Math.PI / 2, Math.PI / 2); k.stroke();
    k.fillStyle = '#B0623B'; rr(k, x - s * 0.2, y - s * 0.16, s * 0.36, s * 0.4, s * 0.06); k.fill();
  }
  function CRT_draw(k, u) {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    card(k, 60, 30, 300, 148, 14);
    CRT_cup(k, CRT_IX, CRT_IY, CRT_IS);
    txt(k, '手工陶杯', 212, 66, UXB_f(900, 16), UX.ink); txt(k, '柴烧 · 320 ml', 212, 86, UXB_f(700, 10.5), UX.ink3);
    txt(k, '¥128', 212, 116, UXB_f(900, 18), UX.ink);
    const pr = UXB_press(u, CRT_T), bs = 1 - 0.05 * pr;
    k.save(); k.translate(280, 150); k.scale(bs, bs); rr(k, -68, -17, 136, 34, 17); k.fillStyle = UX.accent; k.fill();
    txt(k, '加入购物车', 0, 4.5, UXB_f(800, 12.5), '#FFFFFF', 'center'); k.restore();
    const bt = seg(u, CRT_F1, CRT_F1 + 0.35), cs = 1 + 0.25 * Math.sin(Math.PI * bt);
    k.save(); k.translate(CRT_CX, CRT_CY); k.scale(cs, cs);
    k.fillStyle = UX.surface; k.beginPath(); k.arc(0, 0, 22, 0, TAU); k.fill(); k.strokeStyle = UX.line2; k.lineWidth = 1; k.stroke();
    k.strokeStyle = UX.ink; k.lineWidth = 2; k.lineJoin = 'round'; k.lineCap = 'round';
    k.beginPath(); k.moveTo(-11, -8); k.lineTo(-7, -8); k.lineTo(-3, 5); k.lineTo(9, 5); k.lineTo(11, -4); k.lineTo(-5, -4); k.stroke();
    k.fillStyle = UX.ink; k.beginPath(); k.arc(-1, 9.5, 1.8, 0, TAU); k.arc(7, 9.5, 1.8, 0, TAU); k.fill();
    k.restore();
    const n = u >= CRT_F1 ? 3 : 2, ps = u >= CRT_F1 ? 0.4 + 0.6 * backOut(seg(u, CRT_F1, CRT_F1 + 0.3)) : 1;
    k.save(); k.translate(CRT_CX + 16, CRT_CY - 16); k.scale(ps, ps);
    k.fillStyle = UX.danger; k.beginPath(); k.arc(0, 0, 9, 0, TAU); k.fill(); txt(k, String(n), 0, 3.8, UXB_f(900, 11), '#FFFFFF', 'center'); k.restore();
    const ft = seg(u, CRT_F0, CRT_F1);
    if (ft > 0 && ft < 1) {
      const x = mix(CRT_IX, CRT_CX, ft * ft), y = mix(CRT_IY, CRT_CY, ft) - 40 * Math.sin(Math.PI * ft);
      k.save(); k.shadowColor = UX.shadow; k.shadowBlur = 12; CRT_cup(k, x, y, CRT_IS * mix(1, 0.15, ft)); k.restore();
    }
    const c = UXB_path(u, CRT_KEYS);
    if (u > 0.3 && u < 1.75) cursor(k, c[0], c[1], pr);
  }
  CELLS[44] = (k, w, h, u) => UXB_xfade(k, CRT_draw, u, SHOW, SHOW + 0.6);

  // @element 46
  // 46 纸飞机发送（KittenJam #241）：指针 0.95 秒按下发送按钮（缩到 .94 回弹）；1.0–1.3 秒文字右移 16px 淡出，纸飞机 1.0–1.2 秒后撤 6px 蓄力，
  // 1.2–1.8 秒按 t³ 加速向右上飞出按钮（+300px、-60px、转 -25°，被按钮裁切）；1.75–2.05 秒按钮转绿、「已发送 ✓」从左滑入；3.3–3.9 秒换回原文，飞机从左下飞回。
  const SND_CX = 269.5, SND_CY = 104, SND_W = 210, SND_H = 54;
  const SND_KEYS = [[0, 570, 230], [0.3, 570, 230], [0.85, 300, 118], [1.05, 300, 118], [1.7, 570, 230]];
  function SND_plane(k, x, y, rot) {
    k.save(); k.translate(x, y); k.rotate(rot);
    k.fillStyle = '#FFFFFF'; k.beginPath(); k.moveTo(-10, -1); k.lineTo(11, -9); k.lineTo(4, 10); k.lineTo(1, 2); k.closePath(); k.fill();
    k.strokeStyle = 'rgba(0,0,0,.18)'; k.lineWidth = 1; k.beginPath(); k.moveTo(1, 2); k.lineTo(11, -9); k.stroke();
    k.restore();
  }
  CELLS[45] = (k, w, h, u) => {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    const pr = UXB_press(u, 0.95), bs = 1 - 0.06 * pr, x0 = SND_CX - SND_W / 2, y0 = SND_CY - SND_H / 2;
    const si = out3(seg(u, 1.75, 2.05)), so = out3(seg(u, 3.3, 3.55));
    const col = UXB_mix(UX.accent, UX.mint, inOut3(seg(u, 1.75, 2.05)) * (1 - inOut3(seg(u, 3.3, 3.6))));
    k.save(); k.translate(SND_CX, SND_CY); k.scale(bs, bs); k.translate(-SND_CX, -SND_CY);
    k.save(); k.shadowColor = UX.shadow; k.shadowBlur = 16; k.shadowOffsetY = 6; rr(k, x0, y0, SND_W, SND_H, SND_H / 2); k.fillStyle = rgba(col, 1); k.fill(); k.restore();
    rr(k, x0, y0, SND_W, SND_H, SND_H / 2); k.clip();
    const to = out3(seg(u, 1.0, 1.3)), ti = out3(seg(u, 3.45, 3.75));
    k.globalAlpha = u < 3.45 ? 1 - to : ti;
    txt(k, '发送消息', SND_CX + 14 + (u < 3.45 ? 16 * to : -10 * (1 - ti)), SND_CY + 5.5, UXB_f(800, 15), '#FFFFFF', 'center');
    k.globalAlpha = si * (1 - so);
    txt(k, '已发送 ✓', SND_CX - 16 * (1 - si) + 10 * so, SND_CY + 5.5, UXB_f(800, 15), '#FFFFFF', 'center');
    k.globalAlpha = 1;
    let px = x0 + 44, py = SND_CY, rot = 0;
    if (u >= 1.0 && u < 3.4) {
      const w1 = inOut3(seg(u, 1.0, 1.2)), f = Math.pow(seg(u, 1.2, 1.8), 3);
      px += -6 * w1 + 300 * f; py += -60 * f; rot = (-10 * w1 - 15 * f) * Math.PI / 180;
    } else if (u >= 3.4) { const r = out3(seg(u, 3.4, 3.9)); px -= 40 * (1 - r); py += 24 * (1 - r); rot = 20 * (1 - r) * Math.PI / 180; }
    SND_plane(k, px, py, rot);
    k.restore();
    const c = UXB_path(u, SND_KEYS);
    if (u > 0.3 && u < 1.7) cursor(k, c[0], c[1], pr);
  };

  // @element 47
  // 47 星星评分（KittenJam #149）：指针 0.9 秒悬停第 2 颗，前 2 颗浅色预览（0.15 秒过渡）、下方显示「较差」；2.2 秒点第 4 颗，
  // 第 1–4 颗每隔 0.08 秒依次填满并弹跳（0.3 秒内放大到 1.35 再回落），下方浮出「很好」；指针 2.3–3.0 秒离开；5.4–6.0 秒交叉淡化复位。
  const STR_Y = 98, STR_GAP = 48, STR_RO = 17, STR_RI = 7.5, STR_CLICK = 2.2, STR_PICK = 4, STR_STAG = 0.08;
  const STR_x = i => 269.5 + (i - 2) * STR_GAP;
  const STR_LAB = ['很差', '较差', '一般', '很好', '超赞！'];
  const STR_KEYS = [[0, 570, 230], [0.3, 570, 230], [0.9, STR_x(1) + 3, STR_Y + 6], [1.7, STR_x(1) + 3, STR_Y + 6], [2.1, STR_x(3) + 3, STR_Y + 6], [2.3, STR_x(3) + 3, STR_Y + 6], [3.0, 570, 230]];
  const STR_hit = p => { for (let i = 0; i < 5; i++) if (Math.abs(p[0] - STR_x(i)) < 22 && Math.abs(p[1] - STR_Y) < 22) return i + 1; return 0; };
  const STR_HEV = UXB_changes(t => STR_hit(UXB_path(t, STR_KEYS)));
  const STR_PEV = [0, 1, 2, 3, 4].map(i => [[-1, 0], ...STR_HEV.slice(1).map(([t, v]) => [t, v > i ? 1 : 0])]);
  function STR_star(k) {
    k.beginPath();
    for (let j = 0; j < 10; j++) { const r = j % 2 ? STR_RI : STR_RO, a = -Math.PI / 2 + j * Math.PI / 5; k.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    k.closePath();
  }
  function STR_draw(k, u) {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    card(k, 120, 22, 299, 164, 16);
    txt(k, '为这次体验打分', 269.5, 56, UXB_f(900, 15), UX.ink, 'center');
    let hov = 0; for (const [t, v] of STR_HEV) if (t <= u) hov = v;
    for (let i = 0; i < 5; i++) {
      const t0 = STR_CLICK + i * STR_STAG, on = i < STR_PICK && u >= t0, pre = UXB_ramp(u, STR_PEV[i], 0.15, x => x);
      const sc = on ? 1 + 0.35 * Math.sin(Math.PI * seg(u, t0, t0 + 0.3)) : 1;
      k.save(); k.translate(STR_x(i), STR_Y); k.scale(sc, sc); STR_star(k);
      k.fillStyle = on ? '#F5B301' : UX.surface2; k.fill();
      if (!on && pre > 0) { k.globalAlpha = 0.45 * pre; k.fillStyle = '#F5B301'; k.fill(); k.globalAlpha = 1; }
      k.strokeStyle = on ? '#E0A100' : UX.line2; k.lineWidth = 1.5; k.lineJoin = 'round'; k.stroke();
      k.restore();
    }
    if (u >= STR_CLICK) {
      const a = out3(seg(u, STR_CLICK + 0.24, STR_CLICK + 0.5));
      k.globalAlpha = a; txt(k, STR_LAB[STR_PICK - 1], 269.5, 152 + 6 * (1 - a), UXB_f(900, 14), UX.ink, 'center'); k.globalAlpha = 1;
    } else txt(k, hov ? STR_LAB[hov - 1] : '点击星星评分', 269.5, 152, UXB_f(700, 12), UX.ink3, 'center');
    const c = UXB_path(u, STR_KEYS);
    if (u > 0.3 && u < 3.0) cursor(k, c[0], c[1], UXB_press(u, STR_CLICK));
  }
  CELLS[46] = (k, w, h, u) => UXB_xfade(k, STR_draw, u, SHOW, SHOW + 0.6);

  // @element 48
  // 48 滑动确认（KittenJam #235）：胶囊滑轨 300×56，提示字有一道每 1.6 秒扫过一次的流光；第一次 0.9–1.7 秒拖到 60% 松开，
  // 把手贴着起点衰减弹回（0.6 秒）；第二次 2.65–3.45 秒拖到底，3.55 秒松开时超过 85% 即确认，0.3 秒内轨道填满变绿、显示「已确认 ✓」；5.4–6.0 秒交叉淡化复位。
  const SLD_X = 119.5, SLD_Y = 76, SLD_W = 300, SLD_H = 56, SLD_R = 23, SLD_PASS = 0.85, SLD_SHINE = 1.6;
  const SLD_D = SLD_W - 10 - SLD_R * 2, SLD_K0 = SLD_X + 5 + SLD_R, SLD_KY = SLD_Y + SLD_H / 2;
  function SLD_d(u) {
    if (u < 0.9) return 0;
    if (u < 1.8) return 0.6 * SLD_D * inOut3(seg(u, 0.9, 1.7));
    if (u < 2.65) { const t = u - 1.8; return t >= 0.6 ? 0 : 0.6 * SLD_D * Math.exp(-7 * t) * Math.abs(Math.cos(t * 9)) * (1 - t / 0.6); }
    return SLD_D * inOut3(seg(u, 2.65, 3.45));
  }
  function SLD_cur(u, d) {
    if (u < 0.85) return UXB_path(u, [[0, 570, 230], [0.3, 570, 230], [0.8, SLD_K0 + 3, SLD_KY + 2]]);
    if (u < 1.8) return [SLD_K0 + 3 + d, SLD_KY + 2];
    if (u < 2.6) return UXB_path(u, [[1.8, SLD_K0 + 3 + 0.6 * SLD_D, SLD_KY + 2], [2.0, SLD_K0 + 3 + 0.6 * SLD_D, SLD_KY + 10], [2.5, SLD_K0 + 3, SLD_KY + 2]]);
    if (u < 3.55) return [SLD_K0 + 3 + d, SLD_KY + 2];
    return UXB_path(u, [[3.55, SLD_K0 + 3 + SLD_D, SLD_KY + 2], [4.3, 570, 230]]);
  }
  // s = 状态时间（复位时冻结），u = 真实时间（只驱动流光，保证流光不停）
  function SLD_draw(k, s, u) {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    const d = SLD_d(s), done = s >= 3.55 && d >= SLD_PASS * SLD_D ? inOut3(seg(s, 3.55, 3.85)) : 0, kx = SLD_K0 + d;
    rr(k, SLD_X, SLD_Y, SLD_W, SLD_H, SLD_H / 2); k.fillStyle = UX.surface3; k.fill();
    const fw = mix(kx + SLD_R + 5 - SLD_X, SLD_W, done);
    k.globalAlpha = mix(0.25, 1, done); rr(k, SLD_X, SLD_Y, fw, SLD_H, SLD_H / 2); k.fillStyle = rgba(UXB_mix(UX.accent, UX.mint, done), 1); k.fill(); k.globalAlpha = 1;
    const ha = clamp(1 - d / (0.5 * SLD_D)) * (1 - done);
    if (ha > 0) {
      const sx = mix(SLD_X + 40, SLD_X + SLD_W + 20, (u % SLD_SHINE) / SLD_SHINE), g = k.createLinearGradient(sx - 40, 0, sx + 40, 0);
      g.addColorStop(0, UX.ink3); g.addColorStop(0.5, UX.ink); g.addColorStop(1, UX.ink3);
      k.globalAlpha = ha; txt(k, '滑动以付款', SLD_X + SLD_W / 2 + 20, SLD_KY + 5, UXB_f(800, 14), g, 'center'); k.globalAlpha = 1;
    }
    if (done > 0) { k.globalAlpha = done; txt(k, '已确认 ✓', SLD_X + SLD_W / 2 - 20, SLD_KY + 5, UXB_f(900, 15), '#FFFFFF', 'center'); k.globalAlpha = 1; }
    k.save(); k.shadowColor = UX.shadow; k.shadowBlur = 8; k.shadowOffsetY = 2;
    k.fillStyle = '#FFFFFF'; k.beginPath(); k.arc(kx, SLD_KY, SLD_R, 0, TAU); k.fill(); k.restore();
    k.lineWidth = 2.2; k.lineCap = 'round'; k.lineJoin = 'round'; k.beginPath();
    if (done < 0.5) { k.strokeStyle = UX.ink; k.moveTo(kx - 7, SLD_KY); k.lineTo(kx + 7, SLD_KY); k.moveTo(kx + 2, SLD_KY - 5); k.lineTo(kx + 7, SLD_KY); k.lineTo(kx + 2, SLD_KY + 5); }
    else { k.strokeStyle = UX.mint; k.moveTo(kx - 7, SLD_KY); k.lineTo(kx - 2, SLD_KY + 5); k.lineTo(kx + 7, SLD_KY - 5); }
    k.stroke();
    const c = SLD_cur(s, d);
    if (s > 0.3 && s < 4.3) cursor(k, c[0], c[1], Math.max(UXC_hold(s, 0.85, 1.8), UXC_hold(s, 2.6, 3.55)));
  }
  CELLS[47] = (k, w, h, u) => UXB_xfade(k, (g, s) => SLD_draw(g, s, u), u, SHOW, SHOW + 0.6);

  // @element 49
  // 49 圆形扩张转场（KittenJam #161）：滚动进度 0.5–4.4 秒由 0 到 1（inOut3，右侧滚动条同步），第二章从中央以圆形遮罩出现，
  // 半径随进度从 0 扩到画面半对角线；第一章标题缩到 0.8 并淡出，第二章标题从 1.2 倍缩回 1；5.4–6.3 秒滚回，圆形缩回。
  const CRV_RMAX = Math.hypot(CW / 2, CH / 2);
  CELLS[48] = (k, w, h, u) => {
    const p = UXA_scroll(u, 0.5, 4.4), r = CRV_RMAX * p;
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    const s1 = 1 - 0.2 * p;
    k.save(); k.globalAlpha = 1 - p; k.translate(CW / 2, CH / 2); k.scale(s1, s1);
    txt(k, '第一章', 0, -26, UXB_f(800, 12), UX.ink3, 'center'); txt(k, '启程', 0, 18, UXB_f(900, 40, SERIF), UX.ink, 'center');
    k.restore();
    if (r > 0.5) {
      k.save(); k.beginPath(); k.arc(CW / 2, CH / 2, r, 0, TAU); k.clip();
      k.fillStyle = UXD.page; k.fillRect(0, 0, CW, CH); glow(k, CW / 2, CH / 2, 200, '183,164,255', 0.25);
      const s2 = 1.2 - 0.2 * p; k.translate(CW / 2, CH / 2); k.scale(s2, s2);
      txt(k, '第二章', 0, -26, UXB_f(800, 12), UXD.ink3, 'center'); txt(k, '远方', 0, 18, UXB_f(900, 40, SERIF), UXD.ink, 'center');
      k.restore();
    }
    scrollbar(k, p, 0.3, CW - 8, 10, CH - 10, p > 0.85);
  };

  // @element 50
  // 50 时间轴延伸（KittenJam #127）：滚动进度 0.4–4.6 秒由 0 到 1（右侧滚动条同步），左侧细线从顶端往下延伸 164px；
  // 线头到达某个节点时，该节点圆点填色、周次 / 标题 / 说明从左 10px 滑入淡现（线头越过节点后 16px 内完成）；5.4–6.3 秒滚回，节点依次收起。
  const TLD_X = 130, TLD_Y0 = 22, TLD_Y1 = 186, TLD_NY = [36, 80, 124, 168];
  const TLD_NODES = [['需求访谈', '了解目标、用户与限制', '第 1 周'], ['概念构思', '草图、方向与评审', '第 2 周'], ['设计制作', '视觉稿与可交互原型', '第 3–5 周'], ['上线交付', '测试、发布与复盘', '第 6 周']];
  CELLS[49] = (k, w, h, u) => {
    k.fillStyle = UX.surface; k.fillRect(0, 0, CW, CH);
    const p = UXA_scroll(u, 0.4, 4.6), ly = mix(TLD_Y0, TLD_Y1, p);
    k.lineCap = 'round'; k.lineWidth = 2;
    k.strokeStyle = UX.line2; k.beginPath(); k.moveTo(TLD_X, TLD_Y0); k.lineTo(TLD_X, TLD_Y1); k.stroke();
    if (p > 0) { k.strokeStyle = UX.accent; k.beginPath(); k.moveTo(TLD_X, TLD_Y0); k.lineTo(TLD_X, ly); k.stroke(); }
    TLD_NODES.forEach(([title, desc, week], i) => {
      const ny = TLD_NY[i], a = out3(clamp((ly - ny + 4) / 16)), dx = -10 * (1 - a);
      k.fillStyle = UX.surface; k.strokeStyle = UX.line2; k.lineWidth = 1.5; k.beginPath(); k.arc(TLD_X, ny, 6, 0, TAU); k.fill(); k.stroke();
      if (a > 0) {
        k.globalAlpha = a; k.fillStyle = UX.accent; k.beginPath(); k.arc(TLD_X, ny, 6, 0, TAU); k.fill();
        txt(k, week, TLD_X - 18 + dx, ny + 4, UXB_f(700, 10.5), UX.ink3, 'right');
        txt(k, title, TLD_X + 22 + dx, ny + 4.5, UXB_f(800, 13), UX.ink);
        txt(k, desc, TLD_X + 100 + dx, ny + 4.5, UXB_f(600, 11), UX.ink3);
        k.globalAlpha = 1;
      }
    });
    if (p > 0 && p < 1) glow(k, TLD_X, ly, 12, '106,87,242', 0.5);
    scrollbar(k, p);
  };
  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});
