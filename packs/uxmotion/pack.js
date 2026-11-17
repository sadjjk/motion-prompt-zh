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

  // @element 51
  // 51 聊天消息出现（KittenJam #298）：对方气泡 0.3 秒以左下角为原点弹出（0.35 秒 backOut 过冲 2），内含 3 个依次跳动的点；
  // 2.05 秒变成文字消息，宽度 58→128px、缩放 .85→1 回弹；3.05 秒右侧强调色回复从右下角弹出（0.4 秒）；4.8 秒起两条依次上移 10px 淡出（间隔 0.08 秒）。
  const CHT_T0 = 0.3, CHT_MSG = 2.05, CHT_ME = 3.05, CHT_OUT = 4.8;
  const CHT_TW = 58, CHT_MW = 128, CHT_RW = 112, CHT_BH = 30;
  const CHT_back = (t, c1) => (t <= 0 ? 0 : 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2));
  CELLS[50] = (k, w, h, u) => {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    card(k, 130, 12, 279, 184, 16);
    k.fillStyle = UX.accentSoft; k.beginPath(); k.arc(156, 37, 12, 0, TAU); k.fill();
    txt(k, '林', 156, 41.5, UXB_f(800, 12), UX.accent, 'center');
    txt(k, '小林', 176, 35, UXB_f(800, 12.5), UX.ink);
    txt(k, u >= CHT_T0 && u < CHT_MSG ? '对方正在输入…' : '在线', 176, 50, UXB_f(600, 9.5), UX.ink3);
    k.fillStyle = UX.line; k.fillRect(131, 61, 277, 1);
    txt(k, '今天 14:32', 269.5, 80, UXB_f(600, 9), UX.ink3, 'center');
    // 对方气泡：以左下角 (150, 126) 为原点缩放
    const o1 = seg(u, CHT_OUT, CHT_OUT + 0.4), o2 = seg(u, CHT_OUT + 0.08, CHT_OUT + 0.48);
    const s1 = CHT_back(seg(u, CHT_T0, CHT_T0 + 0.35), 2);
    if (s1 > 0 && o1 < 1) {
      const m = u >= CHT_MSG ? out3(seg(u, CHT_MSG, CHT_MSG + 0.3)) : 0;
      const sm = u >= CHT_MSG ? 0.85 + 0.15 * CHT_back(seg(u, CHT_MSG, CHT_MSG + 0.3), 3) : 1;
      const bw = mix(CHT_TW, CHT_MW, m);
      k.save(); k.globalAlpha = 1 - o1; k.translate(150, 126 - 10 * out3(o1)); k.scale(s1 * sm, s1 * sm);
      rr(k, 0, -CHT_BH, bw, CHT_BH, 14); k.fillStyle = UX.surface3; k.fill();
      const ta = clamp(m * 2);
      if (ta < 1) {
        k.globalAlpha = (1 - o1) * (1 - ta); k.fillStyle = UX.ink3;
        for (let i = 0; i < 3; i++) { const b = Math.max(0, Math.sin(TAU * (u - i * 0.15) / 0.9)); k.beginPath(); k.arc(17 + i * 12, -15 - 4 * b, 3, 0, TAU); k.fill(); }
      }
      if (ta > 0) { k.globalAlpha = (1 - o1) * ta; txt(k, '在吗？想问一下～', 14, -10.5, UXB_f(600, 12.5), UX.ink); }
      k.restore();
    }
    // 你的回复：以右下角 (389, 168) 为原点缩放
    const t2 = seg(u, CHT_ME, CHT_ME + 0.4), s2 = CHT_back(t2, 2);
    if (s2 > 0 && o2 < 1) {
      k.save(); k.globalAlpha = clamp(t2 * 2.5) * (1 - o2); k.translate(389, 168 - 10 * out3(o2)); k.scale(s2, s2);
      rr(k, -CHT_RW, -CHT_BH, CHT_RW, CHT_BH, 14); k.fillStyle = UX.accent; k.fill();
      txt(k, '在的，你说～', -CHT_RW / 2, -10.5, UXB_f(600, 12.5), '#FFFFFF', 'center');
      k.restore();
    }
  };

  // @element 52
  // 52 光源投影字（KittenJam #294）：光标是一盏暖光小灯，在大标题四周游走；标题背后 18 层投影沿「标题中心 − 光源」方向排开，
  // 每层偏移 = 方向（按画布宽高归一）× 层号 × 3.2px，越远越淡；光源 0.6–1.0 秒亮起、4.7–5.2 秒熄灭离开，投影收回字下。
  const LSH_CX = 269.5, LSH_CY = 100, LSH_N = 18, LSH_STEP = 3.2;
  const LSH_KEYS = [[0, 570, 230], [0.3, 570, 230], [0.9, 120, 40], [1.7, 420, 36], [2.5, 440, 176], [3.3, 110, 170], [4.1, 269, 26], [4.7, 200, 56], [5.3, 570, 230]];
  CELLS[51] = (k, w, h, u) => {
    k.fillStyle = '#14121C'; k.fillRect(0, 0, CW, CH);
    const c = UXB_path(u, LSH_KEYS), hv = pingPong(u, 0.6, 1.0, 4.7, 5.2);
    glow(k, c[0], c[1], 170, '255,214,150', 0.2 * hv);
    const dx = (LSH_CX - c[0]) / CW * hv, dy = (LSH_CY - c[1]) / CH * hv;
    k.font = UXB_f(900, 72); k.textAlign = 'center'; k.textBaseline = 'middle';
    // 由远到近叠层，最后画正面字
    for (let i = LSH_N; i >= 1; i--) {
      k.fillStyle = `rgba(106,87,242,${(0.6 * (1 - (i - 1) / LSH_N)).toFixed(3)})`;
      k.fillText('光与影', LSH_CX + dx * i * LSH_STEP, LSH_CY + dy * i * LSH_STEP);
    }
    k.fillStyle = '#F4F0E8'; k.fillText('光与影', LSH_CX, LSH_CY);
    txt(k, '移动光源，影子随之转向', LSH_CX, 186, UXB_f(600, 10.5), UXD.ink3, 'center');
    if (hv > 0) {
      glow(k, c[0], c[1], 22, '255,230,180', 0.9 * hv);
      k.globalAlpha = hv; k.fillStyle = '#FFF6E2'; k.beginPath(); k.arc(c[0], c[1], 4, 0, TAU); k.fill(); k.globalAlpha = 1;
    }
  };

  // @element 53
  // 53 反色混合光标（KittenJam #252）：光标换成白色实心圆（比指针轨迹晚 0.08 秒跟随），用 difference 混合与底下内容反色；
  // 移到大标题上时半径 12→46px（0.45 秒 inOut3），离开后缩回；指针 0.3 秒进场、4.1–4.8 秒离开。
  const BLD_T = [165, 50, 380, 104], BLD_LAG = 0.08, BLD_RS = 12, BLD_RB = 46;
  const BLD_KEYS = [[0, 570, 230], [0.3, 570, 230], [0.9, 420, 160], [1.5, 150, 150], [2.1, 190, 80], [2.9, 350, 74], [3.5, 270, 86], [4.1, 300, 160], [4.8, 570, 230]];
  const BLD_pos = t => UXB_path(Math.max(0, t - BLD_LAG), BLD_KEYS);
  const BLD_HEV = UXB_changes(t => { const p = BLD_pos(t); return p[0] > BLD_T[0] && p[0] < BLD_T[2] && p[1] > BLD_T[1] && p[1] < BLD_T[3] ? 1 : 0; });
  CELLS[52] = (k, w, h, u) => {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    txt(k, '设计工作室 · 2026', 269.5, 36, UXB_f(700, 10.5), UX.ink3, 'center');
    txt(k, '反转视界', 269.5, 96, UXB_f(900, 52), UX.ink, 'center');
    txt(k, '把光标移到标题上，圆形会放大', 269.5, 142, UXB_f(600, 12), UX.ink2, 'center');
    txt(k, '重叠的部分颜色互相反转', 269.5, 162, UXB_f(600, 12), UX.ink2, 'center');
    const p = BLD_pos(u), r = mix(BLD_RS, BLD_RB, UXB_ramp(u, BLD_HEV, 0.45, inOut3));
    k.globalCompositeOperation = 'difference'; k.fillStyle = '#FFFFFF';
    k.beginPath(); k.arc(p[0], p[1], r, 0, TAU); k.fill();
    k.globalCompositeOperation = 'source-over';
  };

  // @element 54
  // 54 情境标签光标（KittenJam #255）：平时光标是半径 5px 的小圆点；移到三张卡片上时弹性放大成半径 34px 的深色圆（0.4 秒 cubic-bezier(.34,1.45,.64,1)），
  // 圆内显示对应图标与动作文字（播放 / 查看 / 拖动），离开卡片缩回小圆点；指针 0.3 秒进场、4.3–5.0 秒离开。
  const CTC_X = [30, 194.5, 359], CTC_Y = 40, CTC_W = 150, CTC_H = 128, CTC_RS = 5, CTC_RB = 34;
  const CTC_LAB = ['播放', '查看', '拖动'], CTC_NAME = ['品牌宣传片', '视觉识别', '作品轮播'];
  const CTC_KEYS = [[0, 570, 230], [0.3, 570, 230], [0.9, 110, 96], [1.5, 88, 122], [1.9, 262, 88], [2.6, 282, 118], [3.0, 430, 96], [3.7, 452, 112], [4.3, 452, 112], [5.0, 570, 230]];
  const CTC_hit = p => { for (let i = 0; i < 3; i++) if (p[0] > CTC_X[i] && p[0] < CTC_X[i] + CTC_W && p[1] > CTC_Y && p[1] < CTC_Y + CTC_H) return i + 1; return 0; };
  const CTC_HEV = UXB_changes(t => CTC_hit(UXB_path(t, CTC_KEYS)));
  const CTC_SEV = [[-1, 0], ...CTC_HEV.slice(1).map(([t, v]) => [t, v ? 1 : 0])];
  function CTC_icon(k, i, x, y) {
    k.strokeStyle = '#FFFFFF'; k.fillStyle = '#FFFFFF'; k.lineWidth = 2; k.lineCap = 'round'; k.lineJoin = 'round';
    if (i === 0) { k.beginPath(); k.moveTo(x - 4, y - 6); k.lineTo(x + 6, y); k.lineTo(x - 4, y + 6); k.closePath(); k.fill(); }
    else if (i === 1) { k.beginPath(); k.moveTo(x - 5, y + 5); k.lineTo(x + 5, y - 5); k.moveTo(x - 2, y - 5); k.lineTo(x + 5, y - 5); k.lineTo(x + 5, y + 2); k.stroke(); }
    else { k.beginPath(); k.moveTo(x - 7, y - 3); k.lineTo(x + 7, y - 3); k.moveTo(x + 4, y - 6); k.lineTo(x + 7, y - 3); k.lineTo(x + 4, y); k.moveTo(x + 7, y + 3); k.lineTo(x - 7, y + 3); k.moveTo(x - 4, y); k.lineTo(x - 7, y + 3); k.lineTo(x - 4, y + 6); k.stroke(); }
  }
  CELLS[53] = (k, w, h, u) => {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    txt(k, '精选作品', 30, 26, UXB_f(900, 13), UX.ink);
    CTC_X.forEach((x, i) => {
      card(k, x, CTC_Y, CTC_W, CTC_H, 12);
      k.save(); rr(k, x + 6, CTC_Y + 6, CTC_W - 12, 90, 8); k.clip();
      if (i === 0) UXB_pic(k, x + 6, CTC_Y + 6, CTC_W - 12, 90, ['night', '#1E2147', '#F6E7B0']);
      else if (i === 1) UXB_pic(k, x + 6, CTC_Y + 6, CTC_W - 12, 90, ['sun', '#FDB98A', '#C86CF0', '#FFF2C6']);
      else { [0, 1, 2].forEach(j => UXB_pic(k, x + 6 + j * 50, CTC_Y + 6, 46, 90, ['split', ['#7B61FF', '#3D8BFF', '#1FB89A'][j], '#EAE7E1'])); }
      k.restore();
      if (i === 0) { k.fillStyle = 'rgba(255,255,255,.85)'; k.beginPath(); k.arc(x + 75, CTC_Y + 51, 13, 0, TAU); k.fill(); k.fillStyle = UX.ink; k.beginPath(); k.moveTo(x + 71, CTC_Y + 45); k.lineTo(x + 80, CTC_Y + 51); k.lineTo(x + 71, CTC_Y + 57); k.closePath(); k.fill(); }
      txt(k, CTC_NAME[i], x + 12, CTC_Y + 116, UXB_f(800, 12), UX.ink);
    });
    const p = UXB_path(u, CTC_KEYS), e = UXB_ramp(u, CTC_SEV, 0.4, UXA_spring), r = Math.max(1, mix(CTC_RS, CTC_RB, e));
    let last = 0; for (const [t, v] of CTC_HEV) if (t <= u && v) last = v;
    k.fillStyle = 'rgba(22,21,27,.92)'; k.beginPath(); k.arc(p[0], p[1], r, 0, TAU); k.fill();
    const a = clamp((r - 14) / 20);
    if (a > 0 && last) {
      k.save(); k.globalAlpha = a; CTC_icon(k, last - 1, p[0], p[1] - 7);
      txt(k, CTC_LAB[last - 1], p[0], p[1] + 15, UXB_f(800, 10.5), '#FFFFFF', 'center'); k.restore();
    }
  };

  // @element 55
  // 55 十字准星坐标（KittenJam #256）：淡格线暗底上，一横一竖两条细线跨满画面交于光标处，交点画半径 6px 小圆；
  // 右下方标签用等宽字实时显示换算到 1920×1080 的 X、Y（补零到 4 位），靠近右缘或下缘时翻到另一侧；0.4–0.8 秒淡入、4.4–4.9 秒淡出离开。
  const XHR_KEYS = [[0, 570, 230], [0.3, 570, 230], [0.9, 140, 60], [1.6, 380, 140], [2.2, 500, 40], [2.9, 90, 180], [3.6, 269.5, 104], [4.3, 269.5, 104], [5.0, 570, 230]];
  const XHR_BW = 112, XHR_BH = 20;
  CELLS[54] = (k, w, h, u) => {
    k.fillStyle = '#0E1016'; k.fillRect(0, 0, CW, CH);
    k.strokeStyle = 'rgba(255,255,255,.05)'; k.lineWidth = 1;
    for (let x = 26.5; x < CW; x += 27) { k.beginPath(); k.moveTo(x, 0); k.lineTo(x, CH); k.stroke(); }
    for (let y = 5.5; y < CH; y += 27) { k.beginPath(); k.moveTo(0, y); k.lineTo(CW, y); k.stroke(); }
    txt(k, '精准定位', 269.5, 96, UXB_f(900, 34), 'rgba(244,240,232,.85)', 'center');
    txt(k, 'PRECISION · 1920 × 1080', 269.5, 120, UXB_f(700, 10, MONO), UXD.ink3, 'center');
    const hv = pingPong(u, 0.4, 0.8, 4.4, 4.9);
    if (hv <= 0) return;
    const c = UXB_path(u, XHR_KEYS), x = c[0], y = c[1];
    k.save(); k.globalAlpha = hv;
    k.strokeStyle = 'rgba(125,180,255,.6)'; k.lineWidth = 1;
    k.beginPath(); k.moveTo(0, Math.round(y) + 0.5); k.lineTo(CW, Math.round(y) + 0.5); k.moveTo(Math.round(x) + 0.5, 0); k.lineTo(Math.round(x) + 0.5, CH); k.stroke();
    k.strokeStyle = UXD.accent2; k.lineWidth = 1.5; k.beginPath(); k.arc(x, y, 6, 0, TAU); k.stroke();
    const X = String(Math.round(clamp(x / CW) * 1920)).padStart(4, '0'), Y = String(Math.round(clamp(y / CH) * 1080)).padStart(4, '0');
    const lx = x + 12 + XHR_BW > CW - 6 ? x - 12 - XHR_BW : x + 12, ly = y + 12 + XHR_BH > CH - 6 ? y - 12 - XHR_BH : y + 12;
    rr(k, lx, ly, XHR_BW, XHR_BH, 5); k.fillStyle = 'rgba(125,180,255,.16)'; k.fill(); k.strokeStyle = 'rgba(125,180,255,.4)'; k.lineWidth = 1; k.stroke();
    txt(k, `X ${X}  Y ${Y}`, lx + XHR_BW / 2, ly + 14, UXB_f(700, 10.5, MONO), '#DDE9FF', 'center');
    k.restore();
  };

  // @element 56
  // 56 成就徽章解锁（KittenJam #327）：六角徽章外框 0.3–1.1 秒一笔描出（inOut3），1.1–1.4 秒内部填色；星星 1.4–1.9 秒从 3 倍、-60° 缩回 1 倍落定（backOut）；
  // 1.8–2.35 秒 12 道光芒从半径 58 射到 80px 后消失，徽章同时弹到 1.08；2.1 / 2.25 秒成就名与「成就解锁」依次上浮 8px 淡入；5.4–6.0 秒淡出复位。
  const BDG_CX = 269.5, BDG_CY = 78, BDG_R = 46, BDG_RAY = 12;
  const BDG_HEX = Array.from({ length: 7 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 3; return [Math.cos(a) * BDG_R, Math.sin(a) * BDG_R]; });
  function BDG_hex(k) { k.beginPath(); BDG_HEX.forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y))); k.closePath(); }
  CELLS[55] = (k, w, h, u) => {
    k.fillStyle = UXD.page; k.fillRect(0, 0, CW, CH);
    const fa = fadeIn(u), fill = seg(u, 1.1, 1.4), sc = 1 + 0.08 * Math.sin(Math.PI * seg(u, 1.8, 2.15));
    glow(k, BDG_CX, BDG_CY, 120, '245,196,81', 0.2 * fill * fa);
    k.save(); k.translate(BDG_CX, BDG_CY); k.scale(sc, sc);
    k.lineJoin = 'round'; k.lineCap = 'round'; k.lineWidth = 3;
    k.strokeStyle = 'rgba(255,255,255,.08)'; BDG_hex(k); k.stroke();
    k.globalAlpha = fa;
    if (fill > 0) {
      const g = k.createLinearGradient(0, -BDG_R, 0, BDG_R); g.addColorStop(0, '#F5C451'); g.addColorStop(1, '#D9892B');
      k.globalAlpha = fa * fill; k.fillStyle = g; BDG_hex(k); k.fill(); k.globalAlpha = fa;
    }
    k.strokeStyle = '#F5C451'; UXB_poly(k, BDG_HEX, inOut3(seg(u, 0.3, 1.1)));
    const st = seg(u, 1.4, 1.9);
    if (st > 0) {
      const e = backOut(st), s = mix(3, 1, e);
      k.save(); k.globalAlpha = fa * seg(u, 1.4, 1.6); k.rotate(mix(-60, 0, e) * Math.PI / 180); k.scale(s, s);
      k.fillStyle = '#FFFFFF'; k.beginPath();
      for (let j = 0; j < 10; j++) { const r = j % 2 ? 8 : 19, a = -Math.PI / 2 + j * Math.PI / 5; k.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      k.closePath(); k.fill(); k.restore();
    }
    // 光芒：线头先射出，线尾随后追上（描边 0%→100%→收尾）
    const hd = out3(seg(u, 1.8, 2.05)), tl = out3(seg(u, 2.05, 2.35));
    if (hd > 0 && tl < 1) {
      k.strokeStyle = '#FFE39A'; k.lineWidth = 2.5;
      for (let j = 0; j < BDG_RAY; j++) {
        const a = (j + 0.5) * TAU / BDG_RAY, r0 = mix(58, 80, tl), r1 = mix(58, 80, hd);
        k.beginPath(); k.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); k.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); k.stroke();
      }
    }
    k.restore();
    const a1 = out3(seg(u, 2.1, 2.5)), a2 = out3(seg(u, 2.25, 2.65));
    k.globalAlpha = fa * a1; txt(k, '连续登录 7 天', BDG_CX, 158 + 8 * (1 - a1), UXB_f(900, 15), UXD.ink, 'center');
    k.globalAlpha = fa * a2; txt(k, '成就解锁', BDG_CX, 180 + 8 * (1 - a2), UXB_f(700, 10.5), '#F5C451', 'center');
    k.globalAlpha = 1;
  };

  // @element 57
  // 57 翻牌配对游戏（KittenJam #307）：4×2 张牌背面朝上；指针 0.9、1.7 秒翻开两张不同的牌（每次翻转 0.4 秒，横向压扁再展开），停 0.8 秒后 2.9 秒一起翻回；
  // 3.4、4.0 秒翻开两张相同的月亮，4.4 秒配对成功：底色转强调色、放大到 1.12 再回落（0.3 秒），进度 0/4→1/4；5.4–6.0 秒交叉淡化复位。
  const MMG_X0 = 147.5, MMG_CW = 52, MMG_CH = 64, MMG_GAP = 12, MMG_Y = [26, 102], MMG_FD = 0.4, MMG_MATCH = 4.4;
  const MMG_DECK = [0, 1, 2, 3, 1, 0, 3, 2];
  const MMG_COL = ['#F5B301', '#6A57F2', '#119C72', '#D93A55'];
  const MMG_EV = { 0: [[0.9, 1], [2.9, 0], [3.4, 1]], 1: [[1.7, 1], [2.9, 0]], 5: [[4.0, 1]] };
  const MMG_cx = i => MMG_X0 + (i % 4) * (MMG_CW + MMG_GAP) + MMG_CW / 2, MMG_cy = i => MMG_Y[i < 4 ? 0 : 1] + MMG_CH / 2;
  const MMG_KEYS = [[0, 570, 230], [0.3, 570, 230], [0.8, MMG_cx(0) + 4, MMG_cy(0) + 6], [1.0, MMG_cx(0) + 4, MMG_cy(0) + 6], [1.6, MMG_cx(1) + 4, MMG_cy(1) + 6],
    [2.9, MMG_cx(1) + 4, MMG_cy(1) + 6], [3.3, MMG_cx(0) + 4, MMG_cy(0) + 6], [3.5, MMG_cx(0) + 4, MMG_cy(0) + 6], [3.9, MMG_cx(5) + 4, MMG_cy(5) + 6], [4.1, MMG_cx(5) + 4, MMG_cy(5) + 6], [4.7, 570, 230]];
  const MMG_flip = (i, u) => { let v = 0; for (const [t, to] of MMG_EV[i] || []) { if (u < t) break; v = mix(v, to, inOut3(seg(u, t, t + MMG_FD))); } return v; };
  function MMG_sym(k, s, col) {
    k.fillStyle = col; k.beginPath();
    if (s === 0) { k.save(); k.arc(0, 0, 12, 0, TAU); k.clip(); k.beginPath(); k.arc(0, 0, 12, 0, TAU); k.moveTo(16, -4); k.arc(6, -4, 10, 0, TAU); k.fill('evenodd'); k.restore(); }   // 月牙：外圆减去偏移圆（裁在外圆内）
    else if (s === 1) { for (let j = 0; j < 10; j++) { const r = j % 2 ? 5.5 : 13, a = -Math.PI / 2 + j * Math.PI / 5; k.lineTo(Math.cos(a) * r, Math.sin(a) * r); } k.closePath(); k.fill(); }
    else if (s === 2) { [0, 1, 2, 3].forEach(j => { const a = j * Math.PI / 2; k.moveTo(Math.cos(a) * 6 + 6, Math.sin(a) * 6); k.arc(Math.cos(a) * 6, Math.sin(a) * 6, 6, 0, TAU); }); k.fill(); }
    else { for (let j = 0; j < 5; j++) { const a = -Math.PI / 2 + j * TAU / 5; k.moveTo(Math.cos(a) * 7 + 5, Math.sin(a) * 7); k.arc(Math.cos(a) * 7, Math.sin(a) * 7, 5, 0, TAU); } k.fill(); k.fillStyle = '#FFE39A'; k.beginPath(); k.arc(0, 0, 3.5, 0, TAU); k.fill(); }
  }
  function MMG_draw(k, u) {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    const mt = seg(u, MMG_MATCH, MMG_MATCH + 0.2), bs = 1 + 0.12 * Math.sin(Math.PI * seg(u, MMG_MATCH, MMG_MATCH + 0.3));
    for (let i = 0; i < 8; i++) {
      const f = MMG_flip(i, u), sx = Math.max(0.02, Math.abs(Math.cos(Math.PI * f))), face = f >= 0.5, hit = i === 0 || i === 5, s = hit ? bs : 1;
      k.save(); k.translate(MMG_cx(i), MMG_cy(i)); k.scale(sx * s, s);
      k.save(); k.shadowColor = UX.shadow; k.shadowBlur = 8; k.shadowOffsetY = 3;
      rr(k, -MMG_CW / 2, -MMG_CH / 2, MMG_CW, MMG_CH, 9);
      if (face) k.fillStyle = hit && mt > 0 ? rgba(UXB_mix('#FFFFFF', '#DCD5FF', mt), 1) : '#FFFFFF';
      else { const g = k.createLinearGradient(0, -MMG_CH / 2, 0, MMG_CH / 2); g.addColorStop(0, '#7B61FF'); g.addColorStop(1, '#5A47D8'); k.fillStyle = g; }
      k.fill(); k.restore();
      if (face) {
        if (hit && mt > 0) { k.strokeStyle = `rgba(106,87,242,${mt})`; k.lineWidth = 2; rr(k, -MMG_CW / 2 + 1, -MMG_CH / 2 + 1, MMG_CW - 2, MMG_CH - 2, 8); k.stroke(); }
        MMG_sym(k, MMG_DECK[i], MMG_COL[MMG_DECK[i]]);
      } else txt(k, '?', 0, 7, UXB_f(900, 20), 'rgba(255,255,255,.9)', 'center');
      k.restore();
    }
    const msg = u >= MMG_MATCH ? '配对成功  1 / 4' : u >= 2.1 && u < 2.9 ? '不一样，翻回去' : '配对进度  0 / 4';
    txt(k, msg, 269.5, 194, UXB_f(800, 11.5), u >= MMG_MATCH ? UX.accent : UX.ink3, 'center');
    const c = UXB_path(u, MMG_KEYS);
    let pr = 0; for (const t of [0.9, 1.7, 3.4, 4.0]) pr = Math.max(pr, UXB_press(u, t));
    if (u > 0.3 && u < 4.7) cursor(k, c[0], c[1], pr);
  }
  CELLS[56] = (k, w, h, u) => UXB_xfade(k, MMG_draw, u, SHOW, SHOW + 0.6);

  // @element 58
  // 58 复制成功反馈（KittenJam #239）：指针 1.0 秒点代码行右侧的复制按钮；复制图标旋转 90° 缩到 0，对勾带回弹放大出现，按钮底色转强调色，
  // 上方「已复制」提示从下 6px 弹出（均为 0.35 秒 cubic-bezier(.3,1.5,.5,1)）；1.5 秒后（2.5 秒）全部反向恢复；指针 1.15–1.8 秒离开。
  const CPY_T = 1.0, CPY_BACK = 2.5, CPY_D = 0.35, CPY_BX = 406, CPY_BY = 108;
  const CPY_ez = UXA_bz(.3, 1.5, .5, 1);
  const CPY_KEYS = [[0, 570, 230], [0.3, 570, 230], [0.9, CPY_BX + 3, CPY_BY + 4], [1.15, CPY_BX + 3, CPY_BY + 4], [1.8, 570, 230]];
  CELLS[57] = (k, w, h, u) => {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    txt(k, '安装', 100, 72, UXB_f(800, 11), UX.ink3);
    k.save(); k.shadowColor = UX.shadow; k.shadowBlur = 14; k.shadowOffsetY = 4; rr(k, 99.5, 84, 340, 48, 12); k.fillStyle = '#16151B'; k.fill(); k.restore();
    txt(k, '$', 120, 112.5, UXB_f(700, 13, MONO), UXD.ink3); txt(k, 'npm i motion-kit', 136, 112.5, UXB_f(700, 13, MONO), UXD.ink);
    const on = UXB_ramp(u, [[-1, 0], [CPY_T, 1], [CPY_BACK, 0]], CPY_D, CPY_ez), oc = clamp(on), pr = UXB_press(u, CPY_T);
    const bs = 1 - 0.08 * pr;
    k.save(); k.translate(CPY_BX, CPY_BY); k.scale(bs, bs);
    rr(k, -16, -16, 32, 32, 8); k.fillStyle = rgba(UXB_mix('#2A2933', UX.accent, oc), 1); k.fill();
    k.lineWidth = 1.8; k.lineJoin = 'round'; k.lineCap = 'round';
    const cs = Math.max(0, 1 - on);
    if (cs > 0.01) {
      k.save(); k.globalAlpha = 1 - oc; k.rotate(on * Math.PI / 2); k.scale(cs, cs); k.strokeStyle = '#FFFFFF';
      rr(k, -3, -6, 9, 11, 2); k.stroke(); k.beginPath(); k.moveTo(-6, 3); k.lineTo(-6, -7); k.quadraticCurveTo(-6, -9, -4, -9); k.lineTo(3, -9); k.stroke(); k.restore();
    }
    if (on > 0.01) {
      k.save(); k.globalAlpha = oc; k.scale(on, on); k.strokeStyle = '#FFFFFF'; k.lineWidth = 2.2;
      k.beginPath(); k.moveTo(-6, 0); k.lineTo(-2, 4); k.lineTo(6, -5); k.stroke(); k.restore();
    }
    k.restore();
    ripple(k, CPY_BX, CPY_BY, (u - CPY_T) / 0.5, '183,164,255');
    if (on > 0.01) {
      const ty = 66 + 6 * (1 - on), ts = 0.8 + 0.2 * on;
      k.save(); k.globalAlpha = oc; k.translate(CPY_BX, ty); k.scale(ts, ts);
      rr(k, -30, -12, 60, 24, 7); k.fillStyle = UX.ink; k.fill();
      k.beginPath(); k.moveTo(-5, 12); k.lineTo(0, 17); k.lineTo(5, 12); k.closePath(); k.fill();
      txt(k, '已复制', 0, 4, UXB_f(800, 11), '#FFFFFF', 'center'); k.restore();
    }
    const c = UXB_path(u, CPY_KEYS);
    if (u > 0.3 && u < 1.8) cursor(k, c[0], c[1], pr);
  };

  // @element 59
  // 59 数据仪表卡片（KittenJam #308）：三张数据卡从下方 30px 依次浮上淡入（0.6 秒 out3，间隔 0.12 秒）；数字 0.5 秒起累加到目标值（1.2 秒，power2.out），
  // 迷你折线 0.6 秒起画出（1.0 秒 inOut3），增长率标签 1.6 秒起淡入（0.4 秒）；三项都按卡片序号错开 0.12 秒；5.4–6.0 秒淡出复位。
  const STC_X0 = 26.5, STC_Y = 44, STC_W = 150, STC_H = 120, STC_GAP = 18, STC_STAG = 0.12;
  const STC_D = [['本月访客', 12480, 0, '', '+12.4%', [3, 5, 4, 6, 5, 7, 9]], ['转化率', 3.6, 1, '%', '+0.8%', [4, 3, 5, 4, 6, 6, 7]], ['新订单', 864, 0, '', '+21%', [2, 4, 3, 5, 7, 6, 9]]];
  const STC_fmt = (n, dec) => (dec ? n.toFixed(dec) : String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  CELLS[58] = (k, w, h, u) => {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    txt(k, '运营概览', STC_X0, 28, UXB_f(900, 13), UX.ink);
    const fa = fadeIn(u);
    STC_D.forEach(([lab, val, dec, suf, gr, sp], i) => {
      const d = i * STC_STAG, e = out3(seg(u, 0.3 + d, 0.9 + d));
      if (e <= 0 || fa <= 0) return;
      const x = STC_X0 + i * (STC_W + STC_GAP), y = STC_Y + 30 * (1 - e);
      k.save(); k.globalAlpha = e * fa; card(k, x, y, STC_W, STC_H, 12);
      txt(k, lab, x + 14, y + 24, UXB_f(700, 11), UX.ink3);
      const ct = seg(u, 0.5 + d, 1.7 + d), n = val * (1 - (1 - ct) * (1 - ct));
      txt(k, STC_fmt(n, dec) + suf, x + 14, y + 54, UXB_f(900, 22), UX.ink);
      const ga = seg(u, 1.6 + d, 2.0 + d);
      if (ga > 0) { k.globalAlpha = e * fa * ga; rr(k, x + STC_W - 60, y + 13, 48, 17, 8.5); k.fillStyle = 'rgba(17,156,114,.12)'; k.fill(); txt(k, gr, x + STC_W - 36, y + 25, UXB_f(800, 9.5), UX.mint, 'center'); k.globalAlpha = e * fa; }
      const pts = sp.map((v, j) => [x + 14 + j * (STC_W - 28) / (sp.length - 1), y + 106 - v * 3]);
      k.strokeStyle = UX.accent; k.lineWidth = 2; k.lineJoin = 'round'; k.lineCap = 'round';
      UXB_poly(k, pts, inOut3(seg(u, 0.6 + d, 1.6 + d)));
      k.restore();
    });
  };

  // @element 60
  // 60 表格十字高亮（KittenJam #291）：指针在 4×4 数据格间停留移动；所在整行与整列铺上淡强调色形成十字（0.25 秒过渡），
  // 指到的格子填满强调色、数字加粗变白并放大到 1.12；指针 0.3 秒进场、4.1–4.8 秒离开表格，高亮全部褪去。
  const TXH_X0 = 64.5, TXH_HW = 90, TXH_CW = 80, TXH_Y0 = 24, TXH_RH = 32, TXH_D = 0.25;
  const TXH_COLS = ['一月', '二月', '三月', '四月'], TXH_ROWS = ['手机', '平板', '耳机', '手表'];
  const TXH_cx = c => TXH_X0 + TXH_HW + (c - 1) * TXH_CW + TXH_CW / 2, TXH_cy = r => TXH_Y0 + r * TXH_RH + TXH_RH / 2;
  const TXH_KEYS = [[0, 570, 230], [0.3, 570, 230], [0.9, TXH_cx(1), TXH_cy(1)], [1.4, TXH_cx(1), TXH_cy(1)], [1.8, TXH_cx(3), TXH_cy(2)], [2.3, TXH_cx(3), TXH_cy(2)],
    [2.7, TXH_cx(2), TXH_cy(4)], [3.2, TXH_cx(2), TXH_cy(4)], [3.6, TXH_cx(4), TXH_cy(3)], [4.1, TXH_cx(4), TXH_cy(3)], [4.8, 570, 230]];
  const TXH_hit = p => {
    const c = Math.floor((p[0] - TXH_X0 - TXH_HW) / TXH_CW) + 1, r = Math.floor((p[1] - TXH_Y0) / TXH_RH);
    return c >= 1 && c <= 4 && r >= 1 && r <= 4 ? r * 10 + c : 0;
  };
  const TXH_HEV = UXB_changes(t => TXH_hit(UXB_path(t, TXH_KEYS)));
  const TXH_sub = f => [[-1, 0], ...TXH_HEV.slice(1).map(([t, v]) => [t, v && f(v) ? 1 : 0])];
  const TXH_REV = [1, 2, 3, 4].map(r => TXH_sub(v => Math.floor(v / 10) === r)), TXH_CEV = [1, 2, 3, 4].map(c => TXH_sub(v => v % 10 === c));
  const TXH_XEV = {}; for (let r = 1; r <= 4; r++) for (let c = 1; c <= 4; c++) TXH_XEV[r * 10 + c] = TXH_sub(v => v === r * 10 + c);
  const TXH_val = (r, c) => Math.round(20 + hash(r * 7 + c * 3) * 80);
  CELLS[59] = (k, w, h, u) => {
    k.fillStyle = UX.page; k.fillRect(0, 0, CW, CH);
    const TW = TXH_HW + 4 * TXH_CW, TH = 5 * TXH_RH;
    card(k, TXH_X0, TXH_Y0, TW, TH, 10);
    k.save(); rr(k, TXH_X0, TXH_Y0, TW, TH, 10); k.clip();
    k.fillStyle = UX.surface2; k.fillRect(TXH_X0, TXH_Y0, TW, TXH_RH);
    for (let i = 1; i <= 4; i++) {
      const ra = UXB_ramp(u, TXH_REV[i - 1], TXH_D), ca = UXB_ramp(u, TXH_CEV[i - 1], TXH_D);
      if (ra > 0) { k.fillStyle = `rgba(106,87,242,${0.1 * ra})`; k.fillRect(TXH_X0, TXH_Y0 + i * TXH_RH, TW, TXH_RH); }
      if (ca > 0) { k.fillStyle = `rgba(106,87,242,${0.1 * ca})`; k.fillRect(TXH_X0 + TXH_HW + (i - 1) * TXH_CW, TXH_Y0, TXH_CW, TH); }
    }
    k.fillStyle = UX.line; for (let r = 1; r < 5; r++) k.fillRect(TXH_X0, TXH_Y0 + r * TXH_RH, TW, 1);
    k.restore();
    txt(k, '产品', TXH_X0 + 14, TXH_Y0 + 20, UXB_f(800, 11), UX.ink3);
    TXH_COLS.forEach((s, i) => txt(k, s, TXH_cx(i + 1), TXH_Y0 + 20, UXB_f(800, 11), UX.ink3, 'center'));
    TXH_ROWS.forEach((s, i) => txt(k, s, TXH_X0 + 14, TXH_cy(i + 1) + 4, UXB_f(800, 12), UX.ink));
    for (let r = 1; r <= 4; r++) for (let c = 1; c <= 4; c++) {
      if (UXB_ramp(u, TXH_XEV[r * 10 + c], TXH_D) > 0.01) continue;
      txt(k, String(TXH_val(r, c)), TXH_cx(c), TXH_cy(r) + 4, UXB_f(600, 12), UX.ink2, 'center');
    }
    // 被指到（或正在褪去）的格子最后画，放大后不被邻格遮住
    for (let r = 1; r <= 4; r++) for (let c = 1; c <= 4; c++) {
      const a = UXB_ramp(u, TXH_XEV[r * 10 + c], TXH_D);
      if (a <= 0.01) continue;
      const s = 1 + 0.12 * a;
      k.save(); k.translate(TXH_cx(c), TXH_cy(r)); k.scale(s, s);
      k.globalAlpha = a; rr(k, -TXH_CW / 2 + 3, -TXH_RH / 2 + 2, TXH_CW - 6, TXH_RH - 4, 6); k.fillStyle = UX.accent; k.fill(); k.globalAlpha = 1;
      txt(k, String(TXH_val(r, c)), 0, 4, UXB_f(a > 0.5 ? 900 : 600, 12), a > 0.5 ? '#FFFFFF' : UX.ink2, 'center');
      k.restore();
    }
    const p = UXB_path(u, TXH_KEYS);
    if (u > 0.3 && u < 4.8) cursor(k, p[0], p[1]);
  };

  // @element 61
  // 61 回到顶部进度环（KittenJam #211）：文章 0.4–3.0 秒向下滚到 86%（inOut3，右侧滚动条同步）；滚过 12% 时右下角按钮放大淡入（0.25 秒），外环弧长 = 阅读进度；
  // 指针 3.6 秒点击按钮，页面 3.65–4.45 秒平滑回到顶部（0.8 秒 inOut3），进度跌回 12% 以下时按钮缩回；指针 4.0–4.6 秒离开。
  const BTP_MAX = 0.86, BTP_TH = 0.12, BTP_CLICK = 3.6, BTP_BX = CW - 52, BTP_BY = CH - 42, BTP_PAGE = 560;
  const BTP_ON = 0.4 + 2.6 * UXA_inv(BTP_TH / BTP_MAX), BTP_OFF = 3.65 + 0.8 * UXA_inv(1 - BTP_TH / BTP_MAX);
  const BTP_KEYS = [[0, 570, 230], [3.0, 570, 230], [3.5, BTP_BX + 3, BTP_BY + 4], [3.75, BTP_BX + 3, BTP_BY + 4], [4.6, 570, 230]];
  const BTP_p = u => (u < 3.65 ? BTP_MAX * inOut3(seg(u, 0.4, 3.0)) : BTP_MAX * (1 - inOut3(seg(u, 3.65, 4.45))));
  CELLS[60] = (k, w, h, u) => {
    k.fillStyle = UX.surface; k.fillRect(0, 0, CW, CH);
    const p = BTP_p(u), oy = -p * (BTP_PAGE - CH);
    k.save(); k.translate(0, oy);
    txt(k, '设计笔记', 60, 34, UXB_f(800, 10.5), UX.accent);
    txt(k, '好的动效，是让用户感觉不到它', 60, 62, UXB_f(900, 20), UX.ink);
    for (let i = 0; i < 26; i++) {
      const y = 92 + i * 18 + Math.floor(i / 5) * 14, wl = i % 5 === 4 ? 0.45 + 0.3 * hash(i + 3) : 0.82 + 0.18 * hash(i + 7);
      k.fillStyle = i % 5 === 0 && i ? UX.ink2 : UX.surface3; rr(k, 60, y, 400 * wl, i % 5 === 0 && i ? 8 : 7, 3.5); k.fill();
    }
    k.restore();
    scrollbar(k, p, CH / BTP_PAGE);
    const sv = UXB_ramp(u, [[-1, 0], [BTP_ON, 1], [BTP_OFF, 0]], 0.25), pr = UXB_press(u, BTP_CLICK);
    if (sv > 0.01) {
      const s = (0.6 + 0.4 * sv) * (1 - 0.08 * pr);
      k.save(); k.globalAlpha = sv; k.translate(BTP_BX, BTP_BY); k.scale(s, s);
      k.save(); k.shadowColor = UX.shadow; k.shadowBlur = 12; k.shadowOffsetY = 4; k.fillStyle = UX.surface; k.beginPath(); k.arc(0, 0, 20, 0, TAU); k.fill(); k.restore();
      k.lineWidth = 3; k.strokeStyle = UX.surface3; k.beginPath(); k.arc(0, 0, 23, 0, TAU); k.stroke();
      k.strokeStyle = UX.accent; k.lineCap = 'round'; k.beginPath(); k.arc(0, 0, 23, -Math.PI / 2, -Math.PI / 2 + TAU * p); k.stroke();
      k.strokeStyle = UX.ink; k.lineWidth = 2; k.lineJoin = 'round';
      k.beginPath(); k.moveTo(0, 7); k.lineTo(0, -6); k.moveTo(-5, -1); k.lineTo(0, -6); k.lineTo(5, -1); k.stroke();
      k.restore();
    }
    ripple(k, BTP_BX, BTP_BY, (u - BTP_CLICK) / 0.5);
    const c = UXB_path(u, BTP_KEYS);
    if (u > 3.0 && u < 4.6) cursor(k, c[0], c[1], pr);
  };

  // @element 62
  // 62 滚动放大全幅图片（KittenJam #153）：滚动进度 0.4–4.6 秒由 0 到 1（右侧滚动条同步）；中央小图宽高从画面的 38%×46% 线性放大到 100%，
  // 圆角 16→0px，图内画面同时从 1.3 倍缩回 1 倍；进度 70%–100% 时标题从下 20px 淡入；5.4–6.3 秒滚回，全部倒退。
  CELLS[61] = (k, w, h, u) => {
    k.fillStyle = UXD.page; k.fillRect(0, 0, CW, CH);
    const p = UXA_scroll(u, 0.4, 4.6), fw = CW * mix(0.38, 1, p), fh = CH * mix(0.46, 1, p), r = mix(16, 0, p), is = mix(1.3, 1, p);
    const hint = 1 - seg(p, 0, 0.25);
    if (hint > 0) {
      k.globalAlpha = hint; txt(k, '第 03 篇 · 旅途', CW / 2, 40, UXB_f(700, 10.5), UXD.ink3, 'center');
      txt(k, '向下滚动 ↓', CW / 2, 182, UXB_f(700, 10.5), UXD.ink3, 'center'); k.globalAlpha = 1;
    }
    const x = (CW - fw) / 2, y = (CH - fh) / 2;
    k.save(); rr(k, x, y, fw, fh, r); k.clip();
    const iw = CW * is, ih = CH * is;
    UXB_pic(k, (CW - iw) / 2, (CH - ih) / 2, iw, ih, ['sea', '#F2A07B', '#24406B', '#FFE0A8']);
    const ca = seg(p, 0.7, 1);
    if (ca > 0) {
      const g = k.createLinearGradient(0, CH * 0.45, 0, CH); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${0.5 * ca})`);
      k.fillStyle = g; k.fillRect(0, 0, CW, CH);
      k.globalAlpha = ca; txt(k, '海边的第七天', 36, CH - 34 + 20 * (1 - ca), UXB_f(900, 24), '#FFFFFF');
      txt(k, '把城市留在身后', 36, CH - 14 + 20 * (1 - ca), UXB_f(700, 11), 'rgba(255,255,255,.8)'); k.globalAlpha = 1;
    }
    k.restore();
    scrollbar(k, p, 0.3, CW - 8, 10, CH - 10, true);
  };
  // @element 63
  CELLS[62] = (function () {
    // 任务状态图标：智能体任务列表 3 行，每行左侧立体圆盘图标在「虚线待机环 → 收拢成旋转进度弧 → 闭合 → 填色画勾」间连贯变形；
    // 三行依次接力，第三行中途失败：弧停住、变红、收成叉并轻微抖动；最后全部复位回待机。
    // 纯函数：画面只由 u 决定；背景、卡片、圆盘底座首次调用时预渲染缓存（3 倍分辨率）。
    const W = 539, H = 208, CYC = 6.4;
    const SANS = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif';
    const MONO = '"SF Mono", Menlo, Consolas, monospace';
    const TAU = Math.PI * 2;
    const S = 3;                    // 缓存分辨率倍数：调用方最多约 2×dpr 放大

    // 配色：沿用 uxmotion 的暖灰纸底 + 紫色强调 / 薄荷绿成功 / 玫红失败
    const PAL = {
      bgTop: '#f7f5f1', bgBot: '#e6e2da', vignette: '40,32,60',
      cardHi: '#ffffff', cardLo: '#f8f6f2', thick: '#dcd7ce', line: 'rgba(22,21,27,0.08)',
      ink: '#16151B', ink2: '#57535F', ink3: '#8E8A97',
      acc: [106, 87, 242], mint: [17, 156, 114], danger: [217, 58, 85], idle: [174, 170, 184],
      shadow: '40,30,80'
    };

    // 卡片几何：宽 348（约占画宽 65%），表头 + 3 行任务
    const CX = 96, CY = 18, CWD = 348, CHT = 172, RAD = 14;
    const HEAD = 32;                          // 表头高度
    const ROW0 = CY + HEAD + 20, ROWH = 40;    // 第一行中心 y、行距
    const IX = CX + 28;                       // 图标圆心 x
    const DR = 13, RR = 8.6, RW = 2.4;        // 圆盘半径、状态环半径、环线宽
    const N = 12;                             // 待机虚线段数

    // 三行任务：s 为开始时刻；spin 为从开始到弧闭合的秒数；fail 为失败行在开始后多少秒停住；sec 为最终显示的耗时
    // 时间线：行1 0.40 起、1.65 闭合、1.73–2.01 填绿、1.87–2.15 画勾；行2 1.55 起、2.90 闭合、2.98–3.26 填绿、3.12–3.40 画勾；
    // 行3 2.75 起、4.05–4.20 减速停住、4.20–4.45 变红、4.45–4.80 弧收向圆心、4.65–4.95 填红、4.75–5.03 画叉、4.80–5.20 抖动；
    // 5.60–6.11 三行错开 0.08 秒依次复位，6.11–6.4 静止
    const ROWS = [
      { name: '读取依赖清单', meta: 'read_file · package.json', s: 0.40, spin: 1.25, sec: 1.6 },
      { name: '运行单元测试', meta: 'bash · pnpm test --run', s: 1.55, spin: 1.35, sec: 12.4 },
      { name: '推送 release 分支', meta: 'git push origin release/2.4', s: 2.75, spin: 2.2, fail: 1.3, sec: 8.3 }
    ];
    const GATHER = 0.35;            // 虚线收拢成弧的时长
    const L0 = 0.22;                // 收拢后进度弧占整圈的比例
    const OMEGA = TAU * 1.25;       // 进度弧匀速转速（rad/s）
    const RESET0 = 5.6, RESET1 = 6.05;

    const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
    const seg = (u, a, b) => clamp((u - a) / (b - a));
    const ease = t => (t = clamp(t), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
    const lerp = (a, b, t) => a + (b - a) * t;
    const mixC = (a, b, t) => [0, 1, 2].map(i => Math.round(lerp(a[i], b[i], t)));
    const rgb = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a === undefined ? 1 : a})`;

    function rr(x, l, t, w, h, r) {
      x.beginPath(); x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + h, r); x.arcTo(l + w, t + h, l, t + h, r);
      x.arcTo(l, t + h, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath();
    }
    function mk(w, h, draw) {
      const c = document.createElement('canvas'); c.width = Math.ceil(w * S); c.height = Math.ceil(h * S);
      const x = c.getContext('2d'); x.scale(S, S); draw(x); return c;
    }

    // 静态底图：竖向渐变 + 径向暗角 + 卡片（投影、厚度、渐变、高光边）+ 表头 + 行分隔线
    let BG = null;
    function bg() {
      if (BG) return BG;
      BG = mk(W, H, x => {
        const gr = x.createLinearGradient(0, 0, 0, H);
        gr.addColorStop(0, PAL.bgTop); gr.addColorStop(1, PAL.bgBot);
        x.fillStyle = gr; x.fillRect(0, 0, W, H);
        const vg = x.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.45, W * 0.62);
        vg.addColorStop(0, 'rgba(' + PAL.vignette + ',0)'); vg.addColorStop(1, 'rgba(' + PAL.vignette + ',0.13)');
        x.fillStyle = vg; x.fillRect(0, 0, W, H);
        // 接触影（贴底的窄暗带）+ 大范围柔和投影
        x.save(); x.shadowColor = 'rgba(' + PAL.shadow + ',0.20)'; x.shadowBlur = 22 * S; x.shadowOffsetY = 9 * S;
        x.fillStyle = PAL.cardLo; rr(x, CX, CY, CWD, CHT, RAD); x.fill(); x.restore();
        x.save(); x.shadowColor = 'rgba(' + PAL.shadow + ',0.16)'; x.shadowBlur = 4 * S; x.shadowOffsetY = 1.5 * S;
        x.fillStyle = PAL.thick; rr(x, CX, CY + 1.6, CWD, CHT, RAD); x.fill(); x.restore();
        // 卡面：竖向渐变 + 左上镜面光斑 + 左上白高光边
        const cg = x.createLinearGradient(0, CY, 0, CY + CHT);
        cg.addColorStop(0, PAL.cardHi); cg.addColorStop(1, PAL.cardLo);
        x.fillStyle = cg; rr(x, CX, CY, CWD, CHT, RAD); x.fill();
        x.save(); rr(x, CX, CY, CWD, CHT, RAD); x.clip();
        const sp = x.createRadialGradient(CX + 60, CY - 10, 0, CX + 60, CY - 10, 180);
        sp.addColorStop(0, 'rgba(255,255,255,0.9)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = sp; x.fillRect(CX, CY, CWD, CHT);
        // 表头底色与分隔线
        x.fillStyle = 'rgba(22,21,27,0.025)'; x.fillRect(CX, CY, CWD, HEAD);
        x.fillStyle = PAL.line; x.fillRect(CX, CY + HEAD, CWD, 1);
        for (let i = 1; i < 3; i++) x.fillRect(CX + 16, ROW0 + ROWH * (i - 0.5), CWD - 32, 1);
        x.restore();
        const hl = x.createLinearGradient(CX, CY, CX + CWD * 0.5, CY + CHT);
        hl.addColorStop(0, 'rgba(255,255,255,1)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
        x.strokeStyle = hl; x.lineWidth = 1; rr(x, CX + 0.5, CY + 0.5, CWD - 1, CHT - 1, RAD - 0.5); x.stroke();
        x.strokeStyle = PAL.line; rr(x, CX, CY, CWD, CHT, RAD); x.stroke();
        // 表头文案：任务组名 + 智能体名 + 右侧「3 项任务」
        x.textBaseline = 'middle'; x.textAlign = 'left';
        x.font = '600 12px ' + SANS; x.fillStyle = PAL.ink; x.fillText('发布前检查', CX + 18, CY + HEAD / 2 + 0.5);
        x.font = '11px ' + SANS; x.fillStyle = PAL.ink3; x.fillText('智能体 Atlas · v2.4.0', CX + 86, CY + HEAD / 2 + 0.5);
        x.textAlign = 'right'; x.fillText('3 项任务', CX + CWD - 64, CY + HEAD / 2 + 0.5);
        // 任务名与工具调用说明（静态文字，状态相关的耗时在动态层画）
        ROWS.forEach((r, i) => {
          const y = ROW0 + ROWH * i;
          x.textAlign = 'left';
          x.font = '600 13px ' + SANS; x.fillStyle = PAL.ink; x.fillText(r.name, IX + DR + 13, y - 6);
          x.font = '10px ' + MONO; x.fillStyle = PAL.ink3; x.fillText(r.meta, IX + DR + 13, y + 9);
        });
      });
      return BG;
    }

    // 立体圆盘底座（所有行共用）：投影 + 接触影 + 竖向渐变 + 右下暗厚度 + 内凹环槽 + 左上高光边
    const DP = 8, DS = (DR + DP) * 2;
    let DISC = null, GLOSS = null;
    function disc() {
      if (DISC) return DISC;
      DISC = mk(DS, DS, x => {
        const c = DR + DP;
        x.save(); x.shadowColor = 'rgba(' + PAL.shadow + ',0.22)'; x.shadowBlur = 6 * S; x.shadowOffsetY = 2.5 * S;
        x.fillStyle = '#d9d5ce'; x.beginPath(); x.arc(c, c + 0.8, DR, 0, TAU); x.fill(); x.restore();
        const gr = x.createLinearGradient(0, c - DR, 0, c + DR);
        gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#ebe8f0');
        x.fillStyle = gr; x.beginPath(); x.arc(c, c, DR, 0, TAU); x.fill();
        // 环槽：状态环落在一圈浅凹槽里，上沿暗、下沿亮，读作压进盘面
        const gg = x.createLinearGradient(0, c - RR, 0, c + RR);
        gg.addColorStop(0, 'rgba(60,50,90,0.13)'); gg.addColorStop(1, 'rgba(255,255,255,0.7)');
        x.strokeStyle = gg; x.lineWidth = RW + 1.6; x.beginPath(); x.arc(c, c, RR, 0, TAU); x.stroke();
        const hl = x.createLinearGradient(c - DR, c - DR, c + DR, c + DR);
        hl.addColorStop(0, 'rgba(255,255,255,1)'); hl.addColorStop(0.5, 'rgba(255,255,255,0)');
        hl.addColorStop(0.75, 'rgba(70,60,100,0)'); hl.addColorStop(1, 'rgba(70,60,100,0.22)');
        x.strokeStyle = hl; x.lineWidth = 1.1; x.beginPath(); x.arc(c, c, DR - 0.55, 0, TAU); x.stroke();
      });
      // 镜面光斑：盖在彩色填充之上，让填色后的圆盘也有玻璃感
      GLOSS = mk(DS, DS, x => {
        const c = DR + DP;
        const sp = x.createRadialGradient(c - 4, c - 6, 0, c - 4, c - 6, DR * 0.95);
        sp.addColorStop(0, 'rgba(255,255,255,0.55)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = sp; x.beginPath(); x.arc(c, c, DR - 1, 0, TAU); x.fill();
      });
      return DISC;
    }

    // 进度时间轴：失败行在 tf 处线性减速、D 秒内停住（速度从 1 线性降到 0）
    const STOP = 0.15;
    function tau(r, t) {
      if (!r.fail || t <= r.fail) return t;
      const x = seg(t, r.fail, r.fail + STOP);
      return r.fail + STOP * (x - x * x / 2);
    }
    // 弧中心角：开始时从 0 速度平滑加速到 OMEGA（GATHER 内线性加速）
    function rot(tt) {
      if (tt <= 0) return -Math.PI / 2;
      if (tt < GATHER) return -Math.PI / 2 + OMEGA * tt * tt / (2 * GATHER);
      return -Math.PI / 2 + OMEGA * (tt - GATHER / 2);
    }
    // 虚线环：N 段以 c 为中心按 f 压缩角距，段长系数 lenK（=1 时相邻段首尾相接成整圈）
    function dashes(k, f, lenK, c, col) {
      if (lenK <= 0.01) return;
      k.strokeStyle = col; k.lineWidth = RW; k.lineCap = 'round';
      const half = TAU / N * f * lenK / 2;
      for (let i = 0; i < N; i++) {
        const a = c + ((i + 0.5) / N * TAU - Math.PI) * f;
        k.beginPath(); k.arc(0, 0, RR, a - half, a + half); k.stroke();
      }
    }

    // 单个图标：t 为本行局部时刻（<0 待机），R 为复位进度（0 = 当前状态，1 = 回到待机）
    function icon(k, r, cy, t, R) {
      const IDLE_LEN = 0.42;
      const ok = !r.fail, tEnd = ok ? r.spin : r.fail + STOP;          // 成功：弧闭合；失败：弧停住
      // 抖动：失败成叉后左右衰减摆动 3 次
      let dx = 0;
      if (!ok) { const s = seg(t, tEnd + 0.6, tEnd + 1.0); if (s > 0 && s < 1) dx = Math.sin(s * TAU * 3) * 2.6 * (1 - s); }
      // 结果圆盘的弹跳：填色瞬间放大 7% 再回落
      const fillT = seg(t, tEnd + (ok ? 0.08 : 0.45), tEnd + (ok ? 0.36 : 0.75));
      const pop = 1 + 0.07 * Math.sin(Math.PI * clamp(fillT * 1.4)) * (1 - R);
      k.save(); k.translate(IX + dx, cy); k.scale(pop, pop);
      const resCol = ok ? PAL.mint : PAL.danger;
      // 结果填色的彩色光晕：画在圆盘之下，像有色投影
      const fa = easeOut(fillT) * (1 - R);
      if (fa > 0) {
        const gl = k.createRadialGradient(0, 3, 0, 0, 3, DR + 8);
        gl.addColorStop(0, rgb(resCol, 0.35 * fa)); gl.addColorStop(1, rgb(resCol, 0));
        k.fillStyle = gl; k.fillRect(-DR - 9, -DR - 6, DS + 2, DS + 2);
      }
      k.drawImage(disc(), -DR - DP, -DR - DP, DS, DS);
      if (t < 0 || R >= 1) {
        dashes(k, 1, IDLE_LEN, -Math.PI / 2, rgb(PAL.idle));
      } else {
        const sa = 1 - R;                 // 当前状态的可见度
        const tt = tau(r, t);
        const c = rot(tt);
        if (t < GATHER) {
          // 收拢：角距压缩到 L0、段长拉满，12 段首尾相接成一段弧；颜色由灰转紫
          const e = ease(t / GATHER);
          dashes(k, lerp(1, L0, e), lerp(IDLE_LEN, 1, e), c, rgb(mixC(PAL.idle, PAL.acc, e), sa));
        } else {
          let L = L0 + (1 - L0) * ease(seg(tt, GATHER, r.spin));
          let col = PAL.acc, rad = RR;
          if (!ok) {
            col = mixC(PAL.acc, PAL.danger, ease(seg(t, tEnd, tEnd + 0.25)));
            const m = ease(seg(t, tEnd + 0.25, tEnd + 0.6));     // 弧收向圆心
            L *= 1 - m; rad = RR * (1 - 0.75 * m);
          }
          if (L > 0.004) {
            k.strokeStyle = rgb(col, sa); k.lineWidth = RW; k.lineCap = 'round';
            k.beginPath(); k.arc(0, 0, rad, c - L * Math.PI, c + L * Math.PI); k.stroke();
          }
        }
        // 结果填色：从圆心扩成整盘，竖向渐变；复位时向圆心收回
        if (fa > 0) {
          const fr = (DR - 0.6) * easeOut(fillT) * (1 - ease(R));
          const fg = k.createLinearGradient(0, -fr, 0, fr);
          fg.addColorStop(0, rgb(mixC(resCol, [255, 255, 255], 0.22))); fg.addColorStop(1, rgb(mixC(resCol, [0, 0, 0], 0.12)));
          k.fillStyle = fg; k.beginPath(); k.arc(0, 0, fr, 0, TAU); k.fill();
          k.globalAlpha = fa; k.drawImage(GLOSS, -DR - DP, -DR - DP, DS, DS); k.globalAlpha = 1;
        }
        glyph(k, ok, t - tEnd, sa);
        // 复位：待机虚线从零长度长回来
        if (R > 0) dashes(k, 1, IDLE_LEN * ease(R), -Math.PI / 2, rgb(PAL.idle, ease(R)));
      }
      k.restore();
    }

    // 按进度 p 描出折线的前一段（用于对勾 / 叉的书写动画）
    function partial(k, pts, p) {
      let tot = 0; const ls = [];
      for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); ls.push(l); tot += l; }
      let rem = tot * p; k.beginPath(); k.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length && rem > 0; i++) {
        const f = Math.min(1, rem / ls[i - 1]); rem -= ls[i - 1];
        k.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f));
      }
      k.stroke();
    }
    // 结果符号：白色粗线 + 下方一层半透明暗线作压印阴影；dt 为相对弧闭合 / 停住的时刻
    const CHECK = [[-4.6, 0.4], [-1.5, 3.5], [4.9, -3.3]];
    const X1 = [[-3.6, -3.6], [3.6, 3.6]], X2 = [[3.6, -3.6], [-3.6, 3.6]];
    function glyph(k, ok, dt, a) {
      const ps = ok ? [ease(seg(dt, 0.22, 0.5))] : [ease(seg(dt, 0.55, 0.72)), ease(seg(dt, 0.66, 0.83))];
      if (ps[0] <= 0 || a <= 0) return;
      k.lineCap = 'round'; k.lineJoin = 'round'; k.lineWidth = 2.3;
      const lines = ok ? [CHECK] : [X1, X2];
      for (let pass = 0; pass < 2; pass++) {
        k.save();
        if (pass === 0) { k.translate(0, 0.9); k.strokeStyle = 'rgba(0,0,0,' + 0.16 * a + ')'; }
        else k.strokeStyle = 'rgba(255,255,255,' + a + ')';
        lines.forEach((pts, i) => { if (ps[i] > 0) partial(k, pts, ps[i]); });
        k.restore();
      }
    }

    const fn = (k, w, h, u) => {
      u = ((u % CYC) + CYC) % CYC;
      k.drawImage(bg(), 0, 0, W, H);
      let done = 0;
      ROWS.forEach((r, i) => {
        const cy = ROW0 + ROWH * i, t = u - r.s;
        const R = ease(seg(u, RESET0 + 0.08 * i, RESET0 + 0.08 * i + 0.35));   // 三行错开 0.08 秒依次复位
        const ok = !r.fail, tEnd = ok ? r.spin : r.fail + STOP;
        // 行底带：执行中淡紫，结束后过渡成淡绿 / 淡红并保留到复位，让整张列表读出进度
        const on = seg(t, 0, 0.25) * (1 - R), toRes = ease(seg(t, tEnd, tEnd + 0.4));
        if (on > 0) {
          const bc = mixC(PAL.acc, ok ? PAL.mint : PAL.danger, toRes);
          const bl = CX + 8, bt = cy - ROWH / 2 + 3, bw = CWD - 16, bh = ROWH - 6;
          k.fillStyle = rgb(bc, lerp(0.11, 0.08, toRes) * on); rr(k, bl, bt, bw, bh, 9); k.fill();
          // 执行中底带内一条细进度线：随弧的进度从左向右推进
          const pp = clamp(tau(r, t) / r.spin) * (1 - toRes);
          if (pp > 0.01) { k.fillStyle = rgb(PAL.acc, 0.5 * on); rr(k, bl + 6, bt + bh - 3, (bw - 12) * pp, 2, 1); k.fill(); }
        }
        icon(k, r, cy, t, R);
        // 右侧：状态词 + 耗时。执行中耗时随进度增长，结束后定格
        const st = t < 0 ? 0 : t < tEnd ? 1 : 2;
        const words = ['等待中', '执行中', ok ? '已完成' : '失败'];
        const cols = [PAL.ink3, rgb(PAL.acc), ok ? rgb(PAL.mint) : rgb(PAL.danger)];
        const sec = st === 0 ? '—' : (r.sec * clamp(t / tEnd)).toFixed(1) + 's';
        // 状态切换时旧文字上移淡出、新文字自下而上淡入（0.2 秒）
        const sw = st === 0 ? 1 : seg(t, st === 1 ? 0 : tEnd, (st === 1 ? 0 : tEnd) + 0.2);
        k.textBaseline = 'middle'; k.textAlign = 'right';
        const tx = CX + CWD - 18, wx = tx - 52;
        const drawState = (s, a, oy) => {
          if (a <= 0.01) return;
          k.globalAlpha = a;
          k.font = '600 11px ' + SANS; k.fillStyle = cols[s]; k.fillText(words[s], wx, cy + oy);
          k.font = '11px ' + MONO; k.fillStyle = s === 0 ? PAL.ink3 : PAL.ink2;
          k.fillText(s === 0 ? '—' : sec, tx, cy + oy);
          k.globalAlpha = 1;
        };
        if (R > 0) { drawState(st, 1 - R, -5 * R); drawState(0, R, 5 * (1 - R)); }
        else { if (st > 0 && sw < 1) drawState(st - 1, 1 - sw, -5 * sw); drawState(st, sw, 5 * (1 - sw)); }
        if (ok && st === 2) done += 1 - R;
      });
      // 表头右侧：完成进度条（已完成 / 3）
      const bx = CX + CWD - 56, by = CY + HEAD / 2 - 2;
      k.fillStyle = 'rgba(22,21,27,0.08)'; rr(k, bx, by, 40, 4, 2); k.fill();
      const pw = 40 * done / ROWS.length;
      if (pw > 0.5) { k.fillStyle = rgb(PAL.mint); rr(k, bx, by, Math.max(4, pw), 4, 2); k.fill(); }
    };
    return fn;
  })();

  // @element 64
  CELLS[63] = (function () {
    // 思考过程折叠：AI 回复卡片顶部「正在思考 · x.xs」计时在跳，推理步骤逐条出现（新一条带微光扫过）；
    // 思考结束标题变为「已思考 4.8 秒」并出现小箭头，步骤向上收拢叠成一行消失，卡片高度平滑收缩，
    // 正式回答第一行淡入；随后复位回首帧。纯函数：画面只由 u 决定；背景层首次调用时预渲染缓存。
    const W = 539, H = 208, CYC = 6.4;
    const SANS = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif';
    const S = 3;                    // 缓存分辨率倍数：调用方最多约 2×dpr 放大

    // 配色：uxmotion 的暖灰纸底 + 紫蓝强调，卡片为微冷的白瓷面
    const PAL = {
      bgTop: '#f7f5f1', bgBot: '#e7e3ec', vig: '38,30,70', glow: '122,104,242',
      cardHi: '#ffffff', cardLo: '#f4f2f9', thick: '#d6d0e3', border: 'rgba(40,32,80,0.11)',
      ink: '#16151b', ink2: '#57535f', ink3: '#8e8a97', line: 'rgba(22,21,27,0.08)',
      acc: '#6a57f2', acc2: '#2f8fe0', shine: '#cfc6ff', shadow: '40,30,80'
    };

    // 卡片几何：左侧头像 + 宽 300 的卡片（约占画宽 56%），整组水平居中；卡片随高度变化保持竖直居中
    const CX = 136, CWD = 300, R = 14, MIDY = 104;
    const H0 = 44, ROW = 22, ANS = 30;   // 标题行高（含底部留白）、每条步骤行高、回答行高
    const AVX = 114;                     // 头像圆心 x

    const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
    const seg = (u, a, b) => clamp((u - a) / (b - a));
    const ease = t => (t = clamp(t), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
    const lerp = (a, b, t) => a + (b - a) * t;
    const rgba = (c, a) => `rgba(${c},${a})`;
    const TAU = Math.PI * 2;

    function rr(x, px, py, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r);
      x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath();
    }

    // 背景：柔和竖向渐变 + 卡片背后的淡紫光晕 + 稀疏点阵 + 径向暗角
    let BG = null;
    function bg() {
      if (BG) return BG;
      const c = document.createElement('canvas'); c.width = W * S; c.height = H * S;
      const x = c.getContext('2d'); x.scale(S, S);
      const gr = x.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, PAL.bgTop); gr.addColorStop(1, PAL.bgBot);
      x.fillStyle = gr; x.fillRect(0, 0, W, H);
      const gl = x.createRadialGradient(W * 0.52, MIDY, 0, W * 0.52, MIDY, 230);
      gl.addColorStop(0, rgba(PAL.glow, 0.10)); gl.addColorStop(1, rgba(PAL.glow, 0));
      x.fillStyle = gl; x.fillRect(0, 0, W, H);
      x.fillStyle = 'rgba(60,50,110,0.07)';
      for (let yy = 12; yy < H; yy += 16) for (let xx = 12; xx < W; xx += 16) x.fillRect(xx, yy, 1, 1);
      const vg = x.createRadialGradient(W / 2, H * 0.45, H * 0.35, W / 2, H * 0.45, W * 0.62);
      vg.addColorStop(0, rgba(PAL.vig, 0)); vg.addColorStop(1, rgba(PAL.vig, 0.16));
      x.fillStyle = vg; x.fillRect(0, 0, W, H);
      BG = c; return c;
    }

    // 卡片材质（高度逐帧变化，不能缓存）：接触影 + 投影 + 右下厚度层 + 竖向渐变 + 左上镜面光斑 + 高光边
    function card(k, y, h) {
      const x = CX, w = CWD;
      const cs = k.createRadialGradient(x + w / 2, y + h + 3, 0, x + w / 2, y + h + 3, w * 0.5);
      cs.addColorStop(0, rgba(PAL.shadow, 0.16)); cs.addColorStop(1, rgba(PAL.shadow, 0));
      k.save(); k.translate(0, y + h + 3); k.scale(1, 0.06); k.translate(0, -(y + h + 3));
      k.fillStyle = cs; k.fillRect(x - 20, y + h + 3 - w * 0.5, w + 40, w); k.restore();
      k.save(); k.shadowColor = rgba(PAL.shadow, 0.17); k.shadowBlur = 22; k.shadowOffsetY = 9;
      rr(k, x + 1, y + 2.4, w, h, R); k.fillStyle = PAL.thick; k.fill(); k.restore();
      const gr = k.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, PAL.cardHi); gr.addColorStop(1, PAL.cardLo);
      rr(k, x, y, w, h, R); k.fillStyle = gr; k.fill();
      k.save(); rr(k, x, y, w, h, R); k.clip();
      const sp = k.createRadialGradient(x + w * 0.18, y - 10, 0, x + w * 0.18, y - 10, w * 0.6);
      sp.addColorStop(0, 'rgba(255,255,255,0.9)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
      k.fillStyle = sp; k.fillRect(x, y, w, h); k.restore();
      rr(k, x + 0.5, y + 0.5, w - 1, h - 1, R); k.strokeStyle = PAL.border; k.lineWidth = 1; k.stroke();
      const hl = k.createLinearGradient(x, y, x + w * 0.5, y + h);
      hl.addColorStop(0, 'rgba(255,255,255,1)'); hl.addColorStop(0.45, 'rgba(255,255,255,0.25)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      rr(k, x + 1.2, y + 1.2, w - 2.4, h - 2.4, R - 1); k.strokeStyle = hl; k.lineWidth = 1.2; k.stroke();
    }

    // 推理步骤：具体的排查句子；出现时刻在思考段内均匀排开，条数按数组长度计算
    const STEPS = [
      '读取 checkout.ts 里的 applyCoupon()',
      '折扣先取整再乘数量，误差累积 0.03 元',
      '对照 order_test.py 第 42 行期望 ¥128.97',
      '改为汇总后统一取整，保留两位小数'
    ];
    const ANSWER = '原因是 applyCoupon() 先取整，已修复：';

    // 时间线（秒）
    const T = {
      think0: 0.2, think1: 3.4,        // 计时段：显示值从 0.0 跳到 DONE
      step0: 0.45, stepGap: 0.7,       // 第 i 条步骤出现于 step0 + i*stepGap
      stepIn: 0.35, shine: 0.85,       // 单条滑入时长、微光扫过时长
      title: 3.4, titleD: 0.28,        // 标题交叉切换
      fold0: 3.62, fold1: 4.36,        // 步骤收拢、卡片收缩
      ans0: 4.12, ans1: 4.6,           // 回答首行淡入
      rst0: 5.6, rst1: 6.1             // 复位段；6.1–6.4 静止（与 u=0 同画面）
    };
    const DONE = 4.8;                  // 最终显示的思考秒数
    const RATE = DONE / (T.think1 - T.think0);   // 演示时间到显示秒数的换算
    const N = STEPS.length;
    const PADB = 8;                    // 有步骤时卡片底部多出的留白
    const HMAX = H0 + N * ROW + PADB;
    const HANS = H0 + ANS;
    const TOP = (H - HMAX) / 2;        // 卡片最高时上下居中
    const DRIFT = 0.4;                 // 卡片变矮时顶边下移的比例：兼顾构图居中与标题不乱跑

    const stepT = i => T.step0 + i * T.stepGap;
    const stepK = (u, i) => easeOut(seg(u, stepT(i), stepT(i) + T.stepIn));

    // 卡片高度：思考段逐条长高 → 收拢段缩到回答高度 → 复位段缩回仅标题
    function cardH(u) {
      let hs = H0;
      for (let i = 0; i < N; i++) hs += ROW * stepK(u, i);
      hs += PADB * stepK(u, 0);
      const f = ease(seg(u, T.fold0, T.fold1));
      const r = ease(seg(u, T.rst0, T.rst1));
      return lerp(lerp(hs, HANS, f), H0, r);
    }

    // 四角星：AI 标识
    function star(k, x, y, r) {
      k.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2 - Math.PI / 2, b = a + Math.PI / 4;
        k.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        k.lineTo(x + Math.cos(b) * r * 0.32, y + Math.sin(b) * r * 0.32);
      }
      k.closePath();
    }

    // 头像：卡片左侧的渐变圆 + 白色四角星；思考中外圈有一段旋转的弧（整数圈/周期，保证无缝）
    function avatar(k, y, think, u) {
      const x = AVX, r = 11;
      k.save(); k.shadowColor = rgba(PAL.glow, 0.35); k.shadowBlur = 8; k.shadowOffsetY = 3;
      const gr = k.createLinearGradient(x - r, y - r, x + r, y + r);
      gr.addColorStop(0, '#8a76ff'); gr.addColorStop(1, PAL.acc2);
      k.beginPath(); k.arc(x, y, r, 0, TAU); k.fillStyle = gr; k.fill(); k.restore();
      const hi = k.createLinearGradient(0, y - r, 0, y);
      hi.addColorStop(0, 'rgba(255,255,255,0.45)'); hi.addColorStop(1, 'rgba(255,255,255,0)');
      k.beginPath(); k.ellipse(x, y - r * 0.45, r * 0.72, r * 0.48, 0, 0, TAU); k.fillStyle = hi; k.fill();
      star(k, x, y, 6.2); k.fillStyle = '#fff'; k.fill();
      if (think > 0.01) {
        const a0 = u * TAU * (5 / CYC);       // 每周期 5 圈
        k.strokeStyle = rgba(PAL.glow, 0.85 * think); k.lineWidth = 1.6; k.lineCap = 'round';
        k.beginPath(); k.arc(x, y, r + 3.5, a0, a0 + 1.9); k.stroke();
        k.strokeStyle = rgba(PAL.glow, 0.14 * think);
        k.beginPath(); k.arc(x, y, r + 3.5, 0, TAU); k.stroke();
      }
    }

    // 标题行：「正在思考 · x.xs」与「已思考 4.8 秒」交叉切换（上下错位 5px）；右侧小箭头展开→收起
    function header(k, cy, u, done, fold) {
      const y = cy + 23, x = CX + 18;
      k.textBaseline = 'middle'; k.textAlign = 'left';
      const secs = u < T.rst0 ? clamp((u - T.think0) * RATE, 0, DONE) : 0;
      if (done < 1) {
        k.globalAlpha = 1 - done;
        const yy = y - 5 * done;
        k.font = '600 12.5px ' + SANS; k.fillStyle = PAL.ink;
        k.fillText('正在思考', x, yy);
        let xx = x + k.measureText('正在思考').width;
        k.font = '12.5px ' + SANS; k.fillStyle = PAL.ink3;
        k.fillText(' · ', xx, yy); xx += k.measureText(' · ').width;
        // 计时数字固定宽度右对齐，跳动时 s 不左右抖
        k.fillStyle = PAL.acc; k.textAlign = 'right';
        k.fillText(secs.toFixed(1), xx + 20, yy); k.textAlign = 'left';
        k.fillText('s', xx + 21, yy);
      }
      if (done > 0) {
        k.globalAlpha = done;
        k.font = '600 12.5px ' + SANS; k.fillStyle = PAL.ink2;
        k.fillText('已思考 ' + DONE.toFixed(1) + ' 秒', x, y + 5 * (1 - done));
        // 小箭头：出现时朝下（已展开），收拢时转向右（已收起）
        const ax = CX + CWD - 24, rot = -Math.PI / 2 * ease(fold);
        k.fillStyle = rgba('106,87,242', 0.08); rr(k, ax - 10, y - 10, 20, 20, 6); k.fill();
        k.save(); k.translate(ax, y); k.rotate(rot);
        k.strokeStyle = PAL.ink2; k.lineWidth = 1.6; k.lineCap = 'round'; k.lineJoin = 'round';
        k.beginPath(); k.moveTo(-4, -2); k.lineTo(0, 2.2); k.lineTo(4, -2); k.stroke();
        k.restore();
      }
      k.globalAlpha = 1;
    }

    // 推理步骤：逐条从下方 6px 滑入；新一条文字先是浅灰，带一段紫色微光从左往右扫过后定为深灰。
    // 收拢段每条向第一行位置上移（下面的先动），同时压扁、淡出，叠成一行后消失。
    const DOTX = CX + 24, TXX = CX + 36, ROW0 = H0 + ROW / 2 - 4;
    function steps(k, cy, ch, u) {
      // 收拢后步骤保持隐藏直到周期结束（复位段只收卡片高度，步骤不再回闪）
      const fold = u >= T.fold0;
      k.save(); rr(k, CX, cy, CWD, ch, R); k.clip();
      k.font = '12px ' + SANS; k.textBaseline = 'middle'; k.textAlign = 'left';
      // 竖向引导线：连接各圆点，随步骤增长、随收拢淡出
      const shown = stepK(u, 0);
      let last = 0; for (let i = 0; i < N; i++) last += stepK(u, i);
      const gA = shown * (1 - ease(seg(u, T.fold0, T.fold0 + 0.3)));
      if (gA > 0 && last > 1) {
        k.strokeStyle = rgba('106,87,242', 0.16 * gA); k.lineWidth = 1;
        k.beginPath(); k.moveTo(DOTX, cy + ROW0); k.lineTo(DOTX, cy + ROW0 + (last - 1) * ROW); k.stroke();
      }
      for (let i = 0; i < N; i++) {
        const a = stepK(u, i); if (a <= 0) continue;
        // 收拢进度：底部步骤先动，每条错开 0.06 秒
        const d = fold ? (N - 1 - i) * 0.06 : 0;
        const f = fold ? ease(seg(u, T.fold0 + d, T.fold0 + d + 0.5)) : 0;
        const alpha = a * (1 - seg(f, 0.35, 1));
        if (alpha <= 0.002) continue;
        const y = cy + lerp(ROW0 + i * ROW + 6 * (1 - a), ROW0, f);
        k.save(); k.globalAlpha = alpha;
        k.translate(0, y); k.scale(1, lerp(1, 0.55, f));
        // 当前进行中的一条：圆点为强调色并带呼吸外圈；已完成的为灰点
        const isCur = !fold && u < T.think1 && (i === N - 1 || u < stepT(i + 1));
        if (isCur) {
          const p = ((u - stepT(i)) / 0.7) % 1;
          k.fillStyle = rgba('106,87,242', 0.25 * (1 - p));
          k.beginPath(); k.arc(DOTX, 0, 2.6 + 4 * p, 0, TAU); k.fill();
        }
        k.fillStyle = isCur ? PAL.acc : '#b4aec4';
        k.beginPath(); k.arc(DOTX, 0, 2.6, 0, TAU); k.fill();
        // 文字微光：p 从 -0.3 走到 1.3，带宽为文字宽度的 ±0.18
        const tw = k.measureText(STEPS[i]).width;
        const sp = seg(u, stepT(i) + 0.1, stepT(i) + 0.1 + T.shine);
        if (sp > 0 && sp < 1) {
          const c = lerp(-0.3, 1.3, sp);
          const gr = k.createLinearGradient(TXX + (c - 0.18) * tw, 0, TXX + (c + 0.18) * tw, 0);
          const base = 'rgba(87,83,95,' + (0.45 + 0.55 * sp).toFixed(3) + ')';
          gr.addColorStop(0, base); gr.addColorStop(0.5, '#7c66ff'); gr.addColorStop(1, base);
          k.fillStyle = gr;
        } else k.fillStyle = sp >= 1 ? PAL.ink2 : 'rgba(87,83,95,0.45)';
        k.fillText(STEPS[i], TXX, 0);
        k.restore();
      }
      k.restore();
    }

    // 正式回答首行：上移 4px 淡入，复位段淡出
    function answer(k, cy, u) {
      const a = ease(seg(u, T.ans0, T.ans1)) * (1 - ease(seg(u, T.rst0, T.rst0 + 0.3)));
      if (a <= 0) return;
      k.globalAlpha = a; k.font = '12.5px ' + SANS; k.fillStyle = PAL.ink;
      k.textBaseline = 'middle'; k.textAlign = 'left';
      k.fillText(ANSWER, CX + 18, cy + H0 + ANS / 2 - 6 + 4 * (1 - a));
      k.globalAlpha = 1;
    }

    const fn = (k, w, h, u) => {
      k.drawImage(bg(), 0, 0, W, H);
      const ch = cardH(u), cy = TOP + (HMAX - ch) * DRIFT;
      const done = ease(seg(u, T.title, T.title + T.titleD)) * (1 - ease(seg(u, T.rst0, T.rst0 + T.titleD)));
      const fold = seg(u, T.fold0, T.fold1);
      card(k, cy, ch);
      // 标题与正文之间的分隔线：卡片高过标题行时才显出
      const sepA = clamp((ch - H0) / 12);
      if (sepA > 0) {
        k.fillStyle = rgba('40,32,80', 0.07 * sepA); k.fillRect(CX + 16, cy + H0 - 5, CWD - 32, 1);
        k.fillStyle = rgba('255,255,255', 0.9 * sepA); k.fillRect(CX + 16, cy + H0 - 4, CWD - 32, 1);
      }
      avatar(k, cy + 23, 1 - done, u);
      header(k, cy, u, done, fold);
      steps(k, cy, ch, u);
      answer(k, cy, u);
    };
    return fn;
  })();

  // @element 65
  CELLS[64] = (function () {
    // 图像生成阶段：左侧是已发送的提示词气泡，右侧是固定尺寸的图片框（版面不跳动）。
    // 图片分四步生成：低饱和大色块流动（构图）→ 粗马赛克并上色（上色）→ 马赛克逐级变细（细化）→ 清晰插画（完成），
    // 完成后图片框轻弹一下、出现下载按钮，灯塔光束缓慢扫动；最后淡回空白占位并静止，与首帧一致。
    // 模糊不用 ctx.filter（Safari 不支持）：色块画在极低分辨率离屏画布上，开 imageSmoothing 放大；
    // 马赛克是插画缩成小图后关 imageSmoothing 放大。静态层首次调用时按 S 倍分辨率预渲染缓存。
    const W = 539, H = 208, CYC = 6.4;
    const SANS = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif';
    const S = 3;                                   // 缓存分辨率倍数：预览最高约 2×dpr 放大

    // 配色：沿用 uxmotion 的暖灰底与紫色强调；插画是黄昏海边的冷暖对比
    const PAL = {
      bgTop: '#f6f4f0', bgBot: '#e7e2da', vignette: '52,40,70',
      surface: '#ffffff', surface2: '#eeebe5', line: 'rgba(22,21,27,.09)',
      ink: '#16151b', ink2: '#57535f', ink3: '#8e8a97',
      acc: '#6a57f2', accHi: '#8a78ff', accDeep: '#4f3fd6', mint: '#119c72', shadow: '40,30,80',
      skyTop: '#28305f', skyMid: '#a5577e', skyLow: '#f29a5c', sun: '#ffe2a8',
      seaTop: '#46466f', seaBot: '#191d3b', rock: '#14162a', tower: '#f4efe6', stripe: '#d9483b', lamp: '#ffd36b'
    };

    // 版面几何：气泡在左，图片卡在右（卡片外框 + 内部图片区），卡片下方是进度条与阶段标签
    const BX = 30, BY = 56, BW = 200, BH = 86;     // 提示词气泡
    const CX = 262, CY = 18, CWD = 240, CHT = 148; // 图片卡外框
    const IX = CX + 6, IY = CY + 6, IW = 228, IH = 136; // 图片区：尺寸始终不变
    const IR = 8;

    const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
    const lerp = (a, b, t) => a + (b - a) * t;
    const seg = (u, a, b) => clamp((u - a) / (b - a));
    const ease = t => (t = clamp(t), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
    const backOut = t => { t = clamp(t); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
    const hs = (i, s) => { const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };
    const rgba = (c, a) => `rgba(${c},${a})`;

    function rr(x, px, py, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r);
      x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath();
    }
    function txt(x, s, px, py, font, col, align) {
      x.font = font; x.fillStyle = col; x.textAlign = align || 'left'; x.textBaseline = 'alphabetic'; x.fillText(s, px, py);
    }
    // 按 S 倍分辨率建离屏画布，绘制坐标仍按逻辑尺寸写
    function mk(w, h, draw, scale) {
      const sc = scale || S, c = document.createElement('canvas');
      c.width = Math.ceil(w * sc); c.height = Math.ceil(h * sc);
      const x = c.getContext('2d'); x.scale(sc, sc); draw(x); return c;
    }

    // 背景：柔和竖向渐变 + 径向暗角
    function drawBg(x) {
      const gr = x.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, PAL.bgTop); gr.addColorStop(1, PAL.bgBot);
      x.fillStyle = gr; x.fillRect(0, 0, W, H);
      const v = x.createRadialGradient(W * 0.5, H * 0.42, 60, W * 0.5, H * 0.5, W * 0.62);
      v.addColorStop(0, rgba(PAL.vignette, 0)); v.addColorStop(1, rgba(PAL.vignette, 0.13));
      x.fillStyle = v; x.fillRect(0, 0, W, H);
    }

    // 提示词气泡（用户消息）：紫色竖向渐变 + 右下厚度层 + 左上高光边 + 镜面光斑，尾巴朝右指向图片卡
    const BP = 14;                                 // 缓存留边：放投影
    function bubblePath(x) {
      const r = 16;
      x.beginPath();
      x.moveTo(r, 0); x.lineTo(BW - r, 0); x.arcTo(BW, 0, BW, r, r);
      x.lineTo(BW, BH - 16); x.quadraticCurveTo(BW + 2, BH - 4, BW + 10, BH);   // 右下尾巴
      x.quadraticCurveTo(BW - 6, BH + 1, BW - 14, BH);
      x.lineTo(r, BH); x.arcTo(0, BH, 0, BH - r, r); x.lineTo(0, r); x.arcTo(0, 0, r, 0, r);
      x.closePath();
    }
    function drawBubble(x) {
      x.translate(BP, BP);
      x.save(); x.shadowColor = rgba(PAL.shadow, 0.28); x.shadowBlur = 14; x.shadowOffsetY = 5;
      x.translate(0, 2); bubblePath(x); x.fillStyle = PAL.accDeep; x.fill(); x.restore();
      const gr = x.createLinearGradient(0, 0, 0, BH);
      gr.addColorStop(0, PAL.accHi); gr.addColorStop(1, PAL.acc);
      bubblePath(x); x.fillStyle = gr; x.fill();
      x.save(); bubblePath(x); x.clip();
      const sp = x.createRadialGradient(BW * 0.22, -10, 0, BW * 0.22, -10, BW * 0.6);
      sp.addColorStop(0, 'rgba(255,255,255,0.32)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = sp; x.fillRect(0, 0, BW, BH);
      x.restore();
      const hl = x.createLinearGradient(0, 0, BW * 0.5, BH);
      hl.addColorStop(0, 'rgba(255,255,255,0.75)'); hl.addColorStop(0.6, 'rgba(255,255,255,0.08)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      bubblePath(x); x.strokeStyle = hl; x.lineWidth = 1; x.stroke();
      txt(x, '黄昏海边的灯塔，', 16, 30, '600 16px ' + SANS, '#ffffff');
      txt(x, '胶片质感', 16, 52, '600 16px ' + SANS, '#ffffff');
      x.fillStyle = 'rgba(255,255,255,0.16)'; x.fillRect(16, 62, BW - 32, 1);
      txt(x, '5:3 · 胶片 35mm · 种子 4127', 16, 77, '11px ' + SANS, 'rgba(255,255,255,0.78)');
    }
    // 气泡上方的发送者行与下方的模型行（静态文字，直接画进背景缓存）
    function drawMeta(x) {
      x.fillStyle = PAL.acc; x.beginPath(); x.arc(BX + 5, BY - 11, 4, 0, Math.PI * 2); x.fill();
      txt(x, '你 · 09:41', BX + 14, BY - 7, '500 11px ' + SANS, PAL.ink2);
      txt(x, '画境 v3 · 约 4 秒', BX + 2, BY + BH + 24, '11px ' + SANS, PAL.ink3);
    }

    // 图片卡外框：白色卡面 + 右下厚度层 + 柔和投影 + 左上高光边；图片区先挖成浅灰占位
    const CP = 18;
    function drawCard(x) {
      x.translate(CP, CP);
      x.save(); x.shadowColor = rgba(PAL.shadow, 0.22); x.shadowBlur = 18; x.shadowOffsetY = 7;
      rr(x, 0, 2, CWD, CHT, 14); x.fillStyle = '#d9d4cc'; x.fill(); x.restore();
      const gr = x.createLinearGradient(0, 0, 0, CHT);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#f7f5f1');
      rr(x, 0, 0, CWD, CHT, 14); x.fillStyle = gr; x.fill();
      const hl = x.createLinearGradient(0, 0, CWD * 0.4, CHT);
      hl.addColorStop(0, 'rgba(255,255,255,1)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      rr(x, 0.5, 0.5, CWD - 1, CHT - 1, 14); x.strokeStyle = PAL.line; x.lineWidth = 1; x.stroke();
      rr(x, 1, 1, CWD - 2, CHT - 2, 13); x.strokeStyle = hl; x.stroke();
    }
    // 空白占位：浅灰底 + 淡淡的「山与太阳」图标，表示尚未生成
    function drawHolder(x) {
      const gr = x.createLinearGradient(0, 0, 0, IH);
      gr.addColorStop(0, '#efece6'); gr.addColorStop(1, '#e6e2db');
      rr(x, 0, 0, IW, IH, IR); x.fillStyle = gr; x.fill();
      x.strokeStyle = 'rgba(22,21,27,0.16)'; x.lineWidth = 1.6; x.lineJoin = 'round';
      const ox = IW / 2 - 18, oy = IH / 2 - 13;
      rr(x, ox, oy, 36, 26, 5); x.stroke();
      x.beginPath(); x.moveTo(ox + 4, oy + 22); x.lineTo(ox + 14, oy + 11); x.lineTo(ox + 21, oy + 18);
      x.lineTo(ox + 25, oy + 14); x.lineTo(ox + 32, oy + 22); x.stroke();
      x.beginPath(); x.arc(ox + 27, oy + 7, 3, 0, Math.PI * 2); x.stroke();
    }

    // 成品插画（局部坐标 0..IW × 0..IH）：黄昏天空渐变、低垂的太阳、海面与碎金倒影、礁石上的红白灯塔、胶片颗粒
    const HZ = IH * 0.6;                           // 海平线
    const SUNX = IW * 0.3, SUNY = HZ - 9;          // 太阳半沉在海平线上
    const LX = IW * 0.74, LTOP = 34;               // 灯塔中心 x 与灯室顶部 y
    const LAMP = { x: LX, y: LTOP + 13 };           // 灯芯位置：动态光束从这里射出
    // 灯塔光束：从灯芯向左下海面张开的楔形，沿长度方向由亮到透明；ang 为中心方向，a 为不透明度
    const BEAM_A = Math.PI + 0.16, BEAM_SPREAD = 0.13, BEAM_LEN = 190;
    function beam(x, ang, a) {
      if (a <= 0) return;
      const ex = LAMP.x + Math.cos(ang) * BEAM_LEN, ey = LAMP.y + Math.sin(ang) * BEAM_LEN;
      const gr = x.createLinearGradient(LAMP.x, LAMP.y, ex, ey);
      gr.addColorStop(0, 'rgba(255,230,160,' + a + ')'); gr.addColorStop(0.45, 'rgba(255,214,150,' + a * 0.35 + ')');
      gr.addColorStop(1, 'rgba(255,214,150,0)');
      x.fillStyle = gr; x.beginPath(); x.moveTo(LAMP.x, LAMP.y - 1.5);
      x.lineTo(LAMP.x + Math.cos(ang - BEAM_SPREAD) * BEAM_LEN, LAMP.y + Math.sin(ang - BEAM_SPREAD) * BEAM_LEN);
      x.lineTo(LAMP.x + Math.cos(ang + BEAM_SPREAD) * BEAM_LEN, LAMP.y + Math.sin(ang + BEAM_SPREAD) * BEAM_LEN);
      x.lineTo(LAMP.x, LAMP.y + 1.5); x.closePath(); x.fill();
    }
    function drawIllus(x) {
      rr(x, 0, 0, IW, IH, IR); x.clip();
      const sky = x.createLinearGradient(0, 0, 0, HZ);
      sky.addColorStop(0, PAL.skyTop); sky.addColorStop(0.55, PAL.skyMid); sky.addColorStop(1, PAL.skyLow);
      x.fillStyle = sky; x.fillRect(0, 0, IW, HZ + 1);
      const glow = x.createRadialGradient(SUNX, SUNY, 0, SUNX, SUNY, 90);
      glow.addColorStop(0, 'rgba(255,214,150,0.75)'); glow.addColorStop(1, 'rgba(255,170,110,0)');
      x.fillStyle = glow; x.fillRect(0, 0, IW, HZ);
      x.fillStyle = PAL.sun; x.beginPath(); x.arc(SUNX, SUNY, 15, 0, Math.PI * 2); x.fill();
      // 几缕横向晚霞云：半透明长椭圆，上缘受光偏暖
      const clouds = [[40, 30, 46, 0.22], [120, 22, 58, 0.18], [70, 52, 70, 0.2], [176, 44, 40, 0.16]];
      clouds.forEach(function (cl) {
        x.fillStyle = 'rgba(255,196,170,' + cl[3] + ')';
        x.beginPath(); x.ellipse(cl[0], cl[1], cl[2], 3.2, 0, 0, Math.PI * 2); x.fill();
      });
      const sea = x.createLinearGradient(0, HZ, 0, IH);
      sea.addColorStop(0, PAL.seaTop); sea.addColorStop(1, PAL.seaBot);
      x.fillStyle = sea; x.fillRect(0, HZ, IW, IH - HZ);
      // 太阳倒影：越近越宽、越稀的碎金短线
      for (let i = 0; i < 26; i++) {
        const t = i / 25, y = HZ + 3 + t * (IH - HZ - 8);
        const half = 6 + t * 26, wob = (hs(i, 2) - 0.5) * half;
        x.fillStyle = 'rgba(255,200,130,' + (0.75 - t * 0.55) + ')';
        x.fillRect(SUNX + wob - (4 + hs(i, 3) * 10) / 2, y, 4 + hs(i, 3) * 10, 1.3);
      }
      x.fillStyle = 'rgba(255,220,180,0.5)'; x.fillRect(0, HZ, IW, 0.8);
      beam(x, BEAM_A, 0.5);                       // 光束属于插画本身，马赛克各级里也有它的影子
      // 礁石：深色剪影，左缘有一点受光
      x.fillStyle = PAL.rock; x.beginPath();
      x.moveTo(LX - 46, IH); x.lineTo(LX - 38, HZ + 22); x.lineTo(LX - 22, HZ + 10); x.lineTo(LX - 6, HZ + 4);
      x.lineTo(LX + 14, HZ + 6); x.lineTo(LX + 30, HZ + 16); x.lineTo(LX + 52, HZ + 30); x.lineTo(IW, HZ + 40); x.lineTo(IW, IH);
      x.closePath(); x.fill();
      x.strokeStyle = 'rgba(242,154,92,0.45)'; x.lineWidth = 1;
      x.beginPath(); x.moveTo(LX - 38, HZ + 22); x.lineTo(LX - 22, HZ + 10); x.lineTo(LX - 6, HZ + 4); x.stroke();
      // 灯塔塔身：上窄下宽的梯形，红白相间，右半边背光
      const tb = HZ + 6, tt = LTOP + 22, bw = 11, tw = 7;
      const body = x.createLinearGradient(LX - bw, 0, LX + bw, 0);
      body.addColorStop(0, '#fffaf0'); body.addColorStop(0.55, PAL.tower); body.addColorStop(1, '#a9a0a8');
      x.fillStyle = body; x.beginPath();
      x.moveTo(LX - bw, tb); x.lineTo(LX - tw, tt); x.lineTo(LX + tw, tt); x.lineTo(LX + bw, tb); x.closePath(); x.fill();
      x.save(); x.clip();
      for (let i = 0; i < 2; i++) { x.fillStyle = PAL.stripe; x.fillRect(LX - bw, tt + 9 + i * 18, bw * 2, 8); }
      x.fillStyle = 'rgba(20,16,40,0.28)'; x.fillRect(LX + 2, tt, bw, tb - tt);
      x.restore();
      // 灯室：深色栏杆、亮黄灯窗、红色尖顶
      x.fillStyle = PAL.rock; x.fillRect(LX - 10, tt - 2, 20, 3);
      x.fillStyle = PAL.lamp; x.fillRect(LX - 5, LTOP + 8, 10, 11);
      x.fillStyle = PAL.rock; x.fillRect(LX - 0.6, LTOP + 8, 1.2, 11);
      x.fillStyle = PAL.stripe; x.beginPath(); x.moveTo(LX - 8, LTOP + 8); x.lineTo(LX, LTOP); x.lineTo(LX + 8, LTOP + 8); x.closePath(); x.fill();
      const lg = x.createRadialGradient(LAMP.x, LAMP.y, 0, LAMP.x, LAMP.y, 22);
      lg.addColorStop(0, 'rgba(255,226,140,0.7)'); lg.addColorStop(1, 'rgba(255,226,140,0)');
      x.fillStyle = lg; x.fillRect(LX - 22, LAMP.y - 22, 44, 44);
      // 胶片质感：确定性颗粒 + 四角压暗
      for (let i = 0; i < 1400; i++) {
        x.fillStyle = hs(i, 7) > 0.5 ? 'rgba(255,240,220,0.07)' : 'rgba(10,8,30,0.09)';
        x.fillRect(hs(i, 5) * IW, hs(i, 6) * IH, 0.7, 0.7);
      }
      const vg = x.createRadialGradient(IW / 2, IH / 2, IH * 0.35, IW / 2, IH / 2, IW * 0.62);
      vg.addColorStop(0, 'rgba(12,8,28,0)'); vg.addColorStop(1, 'rgba(12,8,28,0.38)');
      x.fillStyle = vg; x.fillRect(0, 0, IW, IH);
    }

    // 马赛克各级的横向格数（纵向按图片宽高比算）：逐级翻倍，最后一级之后切到清晰图
    const MOSAIC = [6, 12, 24, 48, 96];
    // 模糊色块草稿画布的分辨率：越小放大后越糊
    const BLW = 20, BLH = Math.round(20 * IH / IW);

    // 由清晰插画逐次减半缩小得到各级小图：每次只缩一半，双线性采样近似区域平均，色块不会闪烁失真
    function buildMosaics(src) {
      const out = [];
      let cur = src, cw = src.width, ch = src.height;
      const targets = MOSAIC.slice().reverse();     // 从最细一级往粗做
      targets.forEach(function (nx) {
        const ny = Math.max(2, Math.round(nx * IH / IW));
        while (cw / 2 > nx) {
          const nw = Math.max(nx, Math.round(cw / 2)), nh = Math.max(ny, Math.round(ch / 2));
          const t = document.createElement('canvas'); t.width = nw; t.height = nh;
          const tx = t.getContext('2d'); tx.imageSmoothingEnabled = true; tx.drawImage(cur, 0, 0, nw, nh);
          cur = t; cw = nw; ch = nh;
        }
        const m = document.createElement('canvas'); m.width = nx; m.height = ny;
        const mx = m.getContext('2d'); mx.imageSmoothingEnabled = true; mx.drawImage(cur, 0, 0, nx, ny);
        out.unshift(m); cur = m; cw = nx; ch = ny;
      });
      return out;
    }

    let C = null;                                  // 静态缓存：首次调用时建立，之后只读（blur 是逐帧整体重画的草稿画布，不留跨帧状态）
    function cache() {
      if (C) return C;
      const bg = mk(W, H, function (x) {
        drawBg(x);
        x.drawImage(mk(BW + BP * 2 + 12, BH + BP * 2, drawBubble), BX - BP, BY - BP, BW + BP * 2 + 12, BH + BP * 2);
        drawMeta(x);
      });
      const illus = mk(IW, IH, drawIllus);
      const blur = document.createElement('canvas'); blur.width = BLW; blur.height = BLH;
      // 图片卡单独缓存：完成时要整体做弹跳缩放，不能烤进背景
      C = { bg: bg, card: mk(CWD + CP * 2, CHT + CP * 2, drawCard), illus: illus, holder: mk(IW, IH, drawHolder),
        mosaics: buildMosaics(illus), blur: blur };
      return C;
    }

    // ---- 时间线（秒）----
    const T = {
      start: 0.3, startEnd: 0.65,                  // 占位淡出、色块淡入
      color: 1.75,                                 // 「上色」：色块交叉淡入最粗马赛克
      lv: [1.75, 2.25, 2.7, 3.08, 3.42],           // 各级马赛克开始的时刻，与 MOSAIC 一一对应
      sharp: 3.76, sharpEnd: 3.98,                 // 最细马赛克 → 清晰图
      pop: 3.9, btn: 4.12, sweep: 4.2, sweepEnd: 5.5,
      reset: 5.62, resetEnd: 6.08                  // 之后静止到周期末，与首帧一致
    };
    const XF = 0.09;                               // 马赛克相邻两级的交叉淡入时长：比硬切柔和，又保留「一级一级」的节奏

    // 色块草稿：在 BLW×BLH 小画布上画几团沿海报构图分布的低饱和色团，缓慢绕锚点流动；
    // conv 0→1 时色团从散乱位置收拢到与成图一致的位置，颜色也由灰调转向成图色
    const BLOBS = [
      // 锚点 x,y（0..1）、半径（相对宽度）、低饱和色、成图色
      [0.2, 0.15, 0.55, '96,96,128', '40,48,95'],
      [0.75, 0.2, 0.5, '120,104,130', '70,60,110'],
      [0.5, 0.45, 0.5, '170,130,140', '165,87,126'],
      [0.3, 0.58, 0.38, '220,180,150', '255,190,120'],
      [0.62, 0.86, 0.6, '80,82,110', '35,36,70'],
      [0.74, 0.5, 0.18, '200,190,180', '244,239,230']
    ];
    // 'r,g,b' 字符串之间插值
    function mixCol(a, b, t) {
      const c0 = a.split(','), c1 = b.split(',');
      return [0, 1, 2].map(function (j) { return Math.round(lerp(+c0[j], +c1[j], t)); }).join(',');
    }
    function drawBlobs(c, u, conv) {
      const x = c.getContext('2d');
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.fillStyle = 'rgb(' + mixCol(BLOBS[2][3], BLOBS[2][4], conv) + ')'; x.fillRect(0, 0, BLW, BLH);
      BLOBS.forEach(function (b, i) {
        const ph = hs(i, 11) * 6.28, sp = 0.7 + hs(i, 12) * 0.6;
        const drift = (1 - conv * 0.75) * 0.16;      // 越收拢流动幅度越小
        const px = (b[0] + Math.sin(u * sp + ph) * drift) * BLW;
        const py = (b[1] + Math.cos(u * sp * 0.8 + ph) * drift) * BLH;
        const r = b[2] * BLW * (0.9 + 0.1 * Math.sin(u * 1.3 + ph));
        const col = mixCol(b[3], b[4], conv);
        const gr = x.createRadialGradient(px, py, 0, px, py, r);
        gr.addColorStop(0, 'rgba(' + col + ',0.95)'); gr.addColorStop(1, 'rgba(' + col + ',0)');
        x.fillStyle = gr; x.fillRect(0, 0, BLW, BLH);
      });
    }

    // 生成内容整体的可见度：开始时由占位淡入，复位时淡回占位
    const genA = u => seg(u, T.start, T.startEnd) * (1 - ease(seg(u, T.reset, T.resetEnd)));

    // 图片区（已在图片卡的弹跳变换内）：占位 → 色块 → 马赛克逐级 → 清晰图 + 光束扫动
    function drawImage(k, u, c) {
      k.save(); rr(k, IX, IY, IW, IH, IR); k.clip();
      k.drawImage(c.holder, IX, IY, IW, IH);
      const a = genA(u);
      if (a > 0) {
        k.globalAlpha = a;
        // 层序列：0 = 色块，1..5 = 各级马赛克，6 = 清晰图；starts[i] 是第 i 层开始盖上来的时刻
        const starts = [0].concat(T.lv, [T.sharp]);
        let ci = 0;
        for (let i = 1; i < starts.length; i++) if (u >= starts[i]) ci = i;
        const layer = (i, al) => {
          if (al <= 0) return;
          k.globalAlpha = a * al;
          if (i === 0) {
            // 色块：在 0.9s 到「上色」之间收拢到成图构图，低分辨率草稿开平滑放大即为柔和模糊
            drawBlobs(c.blur, u, ease(seg(u, 0.9, T.color)));
            k.imageSmoothingEnabled = true; k.imageSmoothingQuality = 'high';
            k.drawImage(c.blur, IX, IY, IW, IH);
          } else if (i <= MOSAIC.length) {
            k.imageSmoothingEnabled = false;       // 关平滑：小图放大成清晰方格
            k.drawImage(c.mosaics[i - 1], IX, IY, IW, IH);
            k.imageSmoothingEnabled = true;
          } else k.drawImage(c.illus, IX, IY, IW, IH);
        };
        // 第一级马赛克用更长的交叉淡入：从糊色块到方格是「上色」阶段的主要变化
        const xf = ci === 1 ? 0.28 : (ci === starts.length - 1 ? T.sharpEnd - T.sharp : XF);
        const t = seg(u, starts[ci], starts[ci] + xf);
        if (ci > 0 && t < 1) layer(ci - 1, 1);
        layer(ci, ci > 0 ? t : 1);
        // 光束扫动：成图后在原光束上叠一束加亮的光，左右摆一个来回后停回原位
        const sw = seg(u, T.sweep, T.sweepEnd);
        if (sw > 0 && sw < 1) {
          const env = Math.sin(sw * Math.PI);
          k.globalAlpha = a; k.globalCompositeOperation = 'lighter';
          k.save(); k.translate(IX, IY); beam(k, BEAM_A + 0.2 * Math.sin(sw * Math.PI * 2), 0.32 * env); k.restore();
          k.globalCompositeOperation = 'source-over';
        }
        // 生成中的扫光：一条斜向柔光带从左到右划过，提示「正在计算」
        const g = seg(u, T.startEnd, T.sharpEnd);
        if (g > 0 && g < 1) {
          const p = ((u - T.startEnd) / 1.1) % 1, bx = IX - 60 + p * (IW + 120);
          const sh = k.createLinearGradient(bx - 40, 0, bx + 40, 0);
          sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,255,255,0.16)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
          k.globalAlpha = a * Math.sin(g * Math.PI); k.fillStyle = sh; k.fillRect(IX, IY, IW, IH);
        }
      }
      k.globalAlpha = 1; k.restore();
      // 图片区内描边：让图片边缘和卡面分开
      rr(k, IX + 0.5, IY + 0.5, IW - 1, IH - 1, IR); k.strokeStyle = 'rgba(22,21,27,0.08)'; k.lineWidth = 1; k.stroke();
    }

    // 阶段与进度：每阶段一个百分比区间，阶段内先快后慢地爬升（像真实推理那样越到后面越慢）
    const STAGES = [
      { name: '构图', t0: T.startEnd, t1: T.color, p0: 0, p1: 24 },
      { name: '上色', t0: T.color, t1: T.lv[2], p0: 24, p1: 52 },
      { name: '细化', t0: T.lv[2], t1: T.sharp, p0: 52, p1: 97 },
      { name: '完成', t0: T.sharp, t1: T.pop, p0: 97, p1: 100 }
    ];
    const pctAt = u => {
      if (u < T.startEnd) return 0;
      for (let i = 0; i < STAGES.length; i++) {
        const s = STAGES[i];
        if (u < s.t1) return lerp(s.p0, s.p1, easeOut(seg(u, s.t0, s.t1)));
      }
      return 100;
    };
    const stageAt = u => {
      if (u < T.start) return -1;
      for (let i = 0; i < STAGES.length; i++) if (u < STAGES[i].t1) return i;
      return STAGES.length - 1;
    };

    // 进度行（卡片正下方，与卡片同宽）：细进度条 + 「构图 › 上色 › 细化 › 完成」+ 右侧百分比
    const RY = CY + CHT + 12;                      // 进度条 y
    function drawStatus(k, u) {
      const back = ease(seg(u, T.reset, T.resetEnd));
      const pct = pctAt(u) * (1 - back), cur = back > 0.5 ? -1 : stageAt(u);
      k.fillStyle = 'rgba(22,21,27,0.08)'; rr(k, CX, RY, CWD, 4, 2); k.fill();
      if (pct > 0.2) {
        const done = u >= T.pop && back < 0.5;
        const gr = k.createLinearGradient(CX, 0, CX + CWD, 0);
        gr.addColorStop(0, done ? PAL.mint : PAL.accHi); gr.addColorStop(1, done ? '#1fb89a' : PAL.acc);
        k.fillStyle = gr; rr(k, CX, RY, Math.max(4, CWD * pct / 100), 4, 2); k.fill();
      }
      k.font = '500 11.5px ' + SANS; k.textBaseline = 'alphabetic'; k.textAlign = 'left';
      let x = CX;
      STAGES.forEach(function (s, i) {
        const on = i === cur, past = cur > i;
        k.fillStyle = on ? (i === 3 ? PAL.mint : PAL.acc) : past ? PAL.ink2 : PAL.ink3;
        k.font = (on ? '600' : '500') + ' 11.5px ' + SANS;
        k.fillText(s.name, x, RY + 21);
        x += k.measureText(s.name).width + 6;
        if (i < STAGES.length - 1) { k.fillStyle = PAL.ink3; k.font = '500 11.5px ' + SANS; k.fillText('›', x, RY + 21); x += 12; }
      });
      // 百分比用等宽数字占位右对齐，数字变化时不抖动
      k.font = '600 12px ' + SANS; k.textAlign = 'right'; k.fillStyle = cur === 3 ? PAL.mint : PAL.ink;
      k.fillText(Math.floor(pct) + '%', CX + CWD, RY + 21);
    }

    // 下载按钮：图片右下角的白色圆钮（磨砂白 + 投影 + 向下箭头），完成后弹出
    function drawDownload(k, u) {
      const t = seg(u, T.btn, T.btn + 0.4), out = ease(seg(u, T.reset - 0.1, T.reset + 0.2));
      const s = backOut(t) * (1 - out);
      if (s <= 0.01) return;
      const bx = IX + IW - 20, by = IY + IH - 20;
      k.save(); k.translate(bx, by); k.scale(s, s);
      k.shadowColor = 'rgba(10,8,30,0.35)'; k.shadowBlur = 8; k.shadowOffsetY = 2;
      k.fillStyle = 'rgba(255,255,255,0.94)'; k.beginPath(); k.arc(0, 0, 12, 0, Math.PI * 2); k.fill();
      k.shadowColor = 'rgba(0,0,0,0)';
      k.strokeStyle = PAL.ink; k.lineWidth = 1.7; k.lineCap = 'round'; k.lineJoin = 'round';
      k.beginPath(); k.moveTo(0, -5.5); k.lineTo(0, 3); k.moveTo(-3.8, -0.6); k.lineTo(0, 3.2); k.lineTo(3.8, -0.6);
      k.moveTo(-5, 6); k.lineTo(5, 6); k.stroke();
      k.restore();
    }

    const fn = (k, w, h, u) => {
      u = ((u % CYC) + CYC) % CYC;
      const c = cache();
      k.imageSmoothingEnabled = true;
      k.drawImage(c.bg, 0, 0, W, H);
      // 完成时卡片整体轻弹：先放大约 3.5% 再阻尼回落，只是瞬时缩放，版面尺寸不变
      const pt = seg(u, T.pop, T.pop + 0.6);
      const s = 1 + 0.035 * Math.sin(pt * Math.PI * 2.4) * Math.exp(-3.2 * pt) * (1 - pt);
      k.save();
      k.translate(CX + CWD / 2, CY + CHT / 2); k.scale(s, s); k.translate(-CX - CWD / 2, -CY - CHT / 2);
      k.drawImage(c.card, CX - CP, CY - CP, CWD + CP * 2, CHT + CP * 2);
      drawImage(k, u, c);
      drawDownload(k, u);
      k.restore();
      drawStatus(k, u);
    };
    return fn;
  })();

  // @element 66
  CELLS[65] = (function () {
    // 语音录制胶囊：立体圆形麦克风按钮被光标按下后横向鼓胀成宽胶囊（红点呼吸 + 均衡器竖条 + 计时），
    // 松开后竖条从两端收拢成一条线、胶囊带过冲缩回圆钮，上方弹出转写文字气泡；随后气泡淡出复位。
    // 纯函数：画面只由 u 决定；背景层首次调用时按 3 倍分辨率预渲染缓存。
    const W = 539, H = 208, CYC = 6.4;
    const SANS = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif';
    const MONO = '"SF Mono", Menlo, Consolas, monospace';
    const S = 3;                                   // 缓存分辨率倍数：调用方最多约 2×dpr 放大

    // 配色：uxmotion 的暖灰底 + 紫色强调；录音态胶囊转为深墨色，红点用 danger 红
    const PAL = {
      bgTop: [248, 246, 242], bgBot: [232, 227, 219], vignette: '52,40,70',
      btnHi: [138, 118, 255], btnLo: [94, 72, 230], btnThick: [64, 46, 170],
      capHi: [52, 49, 66], capLo: [26, 24, 34], capThick: [10, 9, 14],
      ink: '#16151B', ink2: '#57535F', ink3: '#8E8A97',
      red: '#FF4D62', redGlow: '255,77,98', bar1: '#C9BEFF', bar2: '#7DB4FF',
      shadow: '40,30,80', bubble: '#FFFFFF', bubbleLo: '#F3F1EC'
    };

    // 几何：圆钮直径 = 胶囊高 BH；胶囊展开宽 CW（约占画宽 56%）
    const CX = 270, CY = 124, BH = 68, CW = 304;
    const REST = { x: 468, y: 192 }, PRESS = { x: CX + 6, y: CY + 8 };

    const clamp = (x, a, b) => Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, x));
    const seg = (u, a, b) => clamp((u - a) / (b - a));
    const lerp = (a, b, t) => a + (b - a) * t;
    const ease = t => (t = clamp(t), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
    const backOut = (t, c) => { t = clamp(t); c = c || 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
    const mixC = (a, b, t) => `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;

    // 圆角矩形：自己用 arcTo 画，避开 Safari 不支持的原生圆角 API
    function rr(k, x, y, w, h, r) {
      r = Math.max(0, Math.min(r, w / 2, h / 2));
      k.beginPath(); k.moveTo(x + r, y); k.arcTo(x + w, y, x + w, y + h, r); k.arcTo(x + w, y + h, x, y + h, r);
      k.arcTo(x, y + h, x, y, r); k.arcTo(x, y, x + w, y, r); k.closePath();
    }

    let BG = null;
    function bg() {
      if (BG) return BG;
      const c = document.createElement('canvas'); c.width = W * S; c.height = H * S;
      const x = c.getContext('2d'); x.scale(S, S);
      const gr = x.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, mixC(PAL.bgTop, PAL.bgTop, 0)); gr.addColorStop(1, mixC(PAL.bgBot, PAL.bgBot, 0));
      x.fillStyle = gr; x.fillRect(0, 0, W, H);
      // 按钮背后一团很淡的紫色环境光，让主体有落点
      const am = x.createRadialGradient(CX, CY, 0, CX, CY, 220);
      am.addColorStop(0, 'rgba(150,130,255,0.10)'); am.addColorStop(1, 'rgba(150,130,255,0)');
      x.fillStyle = am; x.fillRect(0, 0, W, H);
      // 径向暗角：四角压暗
      const vg = x.createRadialGradient(W / 2, H * 0.45, H * 0.35, W / 2, H * 0.45, W * 0.62);
      vg.addColorStop(0, `rgba(${PAL.vignette},0)`); vg.addColorStop(1, `rgba(${PAL.vignette},0.16)`);
      x.fillStyle = vg; x.fillRect(0, 0, W, H);
      BG = c; return c;
    }

    // 胶囊本体（cw×ch，中心 cx,cy）；rec = 录音态混合 0..1；press = 按下下沉 0..1
    function capsule(k, cx, cy, cw, ch, rec, press) {
      const x0 = cx - cw / 2, y0 = cy - ch / 2, r = Math.min(cw, ch) / 2;
      const th = lerp(4, 1.5, press);              // 厚度：按下时变薄
      k.save();
      k.shadowColor = `rgba(${PAL.shadow},${lerp(0.30, 0.18, press)})`;
      k.shadowBlur = lerp(18, 8, press); k.shadowOffsetY = lerp(9, 4, press);
      rr(k, x0, y0 + th, cw, ch, r); k.fillStyle = mixC(PAL.btnThick, PAL.capThick, rec); k.fill();
      k.restore();
      const gr = k.createLinearGradient(0, y0, 0, y0 + ch);
      gr.addColorStop(0, mixC(PAL.btnHi, PAL.capHi, rec)); gr.addColorStop(1, mixC(PAL.btnLo, PAL.capLo, rec));
      rr(k, x0, y0, cw, ch, r); k.fillStyle = gr; k.fill();
      // 内部光影：顶部镜面光斑 + 底部反光，裁切在胶囊内
      k.save(); rr(k, x0, y0, cw, ch, r); k.clip();
      const sp = k.createRadialGradient(x0 + Math.min(cw * 0.3, 30), y0 - ch * 0.1, 0, x0 + Math.min(cw * 0.3, 30), y0 - ch * 0.1, Math.max(ch * 0.9, cw * 0.45));
      sp.addColorStop(0, `rgba(255,255,255,${lerp(0.42, 0.16, rec)})`); sp.addColorStop(1, 'rgba(255,255,255,0)');
      k.fillStyle = sp; k.fillRect(x0, y0, cw, ch);
      // 上半部玻璃釉面：一条压扁的白色高光带
      rr(k, x0 + r * 0.45, y0 + 3, cw - r * 0.9, ch * 0.42, ch * 0.21);
      const gl = k.createLinearGradient(0, y0 + 3, 0, y0 + 3 + ch * 0.42);
      gl.addColorStop(0, `rgba(255,255,255,${lerp(0.30, 0.10, rec)})`); gl.addColorStop(1, 'rgba(255,255,255,0)');
      k.fillStyle = gl; k.fill();
      const rf = k.createLinearGradient(0, y0 + ch * 0.7, 0, y0 + ch);
      rf.addColorStop(0, 'rgba(255,255,255,0)'); rf.addColorStop(1, `rgba(255,255,255,${lerp(0.10, 0.05, rec)})`);
      k.fillStyle = rf; k.fillRect(x0, y0 + ch * 0.7, cw, ch * 0.3);
      k.restore();
      // 左上白高光边 → 右下渐隐
      const hl = k.createLinearGradient(x0, y0, x0 + Math.min(cw, 120), y0 + ch);
      hl.addColorStop(0, 'rgba(255,255,255,0.85)'); hl.addColorStop(0.5, 'rgba(255,255,255,0.18)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      rr(k, x0 + 0.5, y0 + 0.5, cw - 1, ch - 1, r - 0.5); k.strokeStyle = hl; k.lineWidth = 1; k.stroke();
    }

    // 白色麦克风图标（中心 cx,cy，s 为缩放，a 为不透明度）
    function mic(k, cx, cy, s, a) {
      if (a <= 0.01 || s <= 0.01) return;
      k.save(); k.translate(cx, cy); k.scale(s, s); k.globalAlpha = a;
      k.shadowColor = 'rgba(30,16,110,0.35)'; k.shadowBlur = 3; k.shadowOffsetY = 1;
      k.fillStyle = '#fff'; rr(k, -6, -15, 12, 20, 6); k.fill();
      k.strokeStyle = '#fff'; k.lineWidth = 2.6; k.lineCap = 'round';
      k.beginPath(); k.arc(0, -3, 10, 0.12 * Math.PI, 0.88 * Math.PI); k.stroke();
      k.beginPath(); k.moveTo(0, 7); k.lineTo(0, 13); k.moveTo(-5.5, 13.5); k.lineTo(5.5, 13.5); k.stroke();
      k.restore();
    }

    // 箭头光标（尖端在 x,y）：白描边深色填充；按下时 s<1
    function cursor(k, x, y, s) {
      k.save(); k.translate(x, y); k.scale(s, s);
      k.beginPath();
      k.moveTo(0, 0); k.lineTo(0, 17); k.lineTo(4.2, 13); k.lineTo(7.2, 19.6); k.lineTo(10, 18.4);
      k.lineTo(7.1, 12); k.lineTo(12.6, 12); k.closePath();
      k.shadowColor = 'rgba(20,16,40,0.35)'; k.shadowBlur = 4; k.shadowOffsetY = 1.5;
      k.fillStyle = '#16151B'; k.fill();
      k.shadowColor = 'rgba(0,0,0,0)';
      k.lineJoin = 'round'; k.lineWidth = 1.4; k.strokeStyle = '#fff'; k.stroke();
      k.restore();
    }

    // 时间线（秒）：光标移入 → 按下 → 鼓胀 → 录音 → 松开 → 竖条收拢 → 缩回过冲 → 气泡弹出 → 复位 → 静止
    const T = {
      move0: 0.2, move1: 0.9, down: 0.9, grow0: 1.0, grow1: 1.45, rec0: 1.2,
      up: 4.3, flat1: 4.5, conv1: 4.72, shrink0: 4.62, shrink1: 5.12,
      bub0: 4.95, bub1: 5.35, type1: 5.6, back0: 4.5, back1: 5.6, out0: 5.85, out1: 6.1
    };
    const PAD = 30, DOT_R = 5.5;                    // 胶囊内边距、红点半径
    const BAR_W = 3, BAR_GAP = 3.4;                 // 竖条宽与间隔；条数按可用宽度算
    const BX0 = CX - CW / 2 + PAD + 26, BX1 = CX + CW / 2 - PAD - 40;
    const NB = Math.floor((BX1 - BX0 + BAR_GAP) / (BAR_W + BAR_GAP));
    const BMID = (BX0 + BX1) / 2;

    // 说话音量包络：几组慢正弦叠加，减去阈值后出现自然的停顿（换气）段
    function envelope(t) {
      const a = 0.55 * Math.sin(t * 2.1 + 0.4) + 0.35 * Math.sin(t * 4.7 + 1.3) + 0.22 * Math.sin(t * 9.3 + 2.2);
      return clamp((a + 0.42) / 1.1, 0.04, 1);
    }
    // 第 i 根竖条的高度系数 0..1：包络 × 每根自己的快抖动 × 中间高两边低的钟形
    function barLevel(i, t) {
      const d = (i - (NB - 1) / 2) / ((NB - 1) / 2);
      const bell = 0.35 + 0.65 * Math.exp(-d * d * 2.2);
      const f1 = 7 + 5 * Math.abs(Math.sin(i * 1.73)), f2 = 13 + 4 * Math.abs(Math.sin(i * 2.91));
      const jit = 0.55 + 0.28 * Math.sin(t * f1 + i * 0.9) + 0.17 * Math.sin(t * f2 + i * 2.3);
      return clamp(envelope(t - Math.abs(d) * 0.08) * bell * jit);
    }

    // 均衡器竖条：rec 段跳动；松开后先由两端往中间压平（flat），再整体向中心收成一条线（conv）
    function bars(k, u, alpha) {
      if (alpha <= 0.01) return;
      const t = Math.min(u, T.up) - T.rec0;
      const conv = ease(seg(u, T.flat1 - 0.05, T.conv1));
      const lineA = 1 - seg(u, T.conv1 - 0.06, T.conv1 + 0.08);
      k.save(); k.globalAlpha = alpha * lineA; k.lineCap = 'round'; k.lineWidth = BAR_W;
      const grad = k.createLinearGradient(BX0, 0, BX1, 0);
      grad.addColorStop(0, PAL.bar1); grad.addColorStop(1, PAL.bar2);
      k.strokeStyle = grad;
      for (let i = 0; i < NB; i++) {
        const d = Math.abs((i - (NB - 1) / 2) / ((NB - 1) / 2));
        // 外侧先压平：d=1 的条从 up 开始，中间的条晚 0.12 秒
        const fl = ease(seg(u, T.up + (1 - d) * 0.12, T.up + (1 - d) * 0.12 + 0.12));
        const lv = barLevel(i, t) * (1 - fl);
        const hh = Math.max(0.01, (BH * 0.5) * lv) / 2;
        const x = lerp(BX0 + i * (BAR_W + BAR_GAP) + BAR_W / 2, BMID, conv);
        k.beginPath(); k.moveTo(x, CY - hh); k.lineTo(x, CY + hh); k.stroke();
      }
      // 压平后条与条之间连成一条横线，随 conv 收短
      const lw = seg(u, T.up + 0.08, T.flat1);
      if (lw > 0) {
        const half = (BX1 - BX0) / 2 * (1 - conv);
        k.globalAlpha = alpha * lineA * lw; k.lineWidth = 2.2;
        k.beginPath(); k.moveTo(BMID - half, CY); k.lineTo(BMID + half, CY); k.stroke();
      }
      k.restore();
    }

    // 左侧录音红点：约 1 秒一次呼吸，外圈柔光同步明暗
    function recDot(k, x, u, a) {
      if (a <= 0.01) return;
      const br = 0.5 + 0.5 * Math.cos((u - T.rec0) * Math.PI * 2 / 1.05);
      k.save(); k.globalAlpha = a;
      const gr = k.createRadialGradient(x, CY, 0, x, CY, DOT_R * 3.2);
      gr.addColorStop(0, `rgba(${PAL.redGlow},${0.55 * br})`); gr.addColorStop(1, `rgba(${PAL.redGlow},0)`);
      k.fillStyle = gr; k.fillRect(x - DOT_R * 4, CY - DOT_R * 4, DOT_R * 8, DOT_R * 8);
      k.globalAlpha = a * (0.55 + 0.45 * br);
      k.beginPath(); k.arc(x, CY, DOT_R * (0.86 + 0.14 * br), 0, Math.PI * 2); k.fillStyle = PAL.red; k.fill();
      k.globalAlpha = a * 0.7;
      k.beginPath(); k.arc(x - 1.6, CY - 1.8, 1.6, 0, Math.PI * 2); k.fillStyle = '#fff'; k.fill();
      k.restore();
    }
    // 右侧计时：录音 3.1 秒，走到 0:03；秒位跳变时数字轻微上移淡入
    function timer(k, x, u, a) {
      if (a <= 0.01) return;
      const t = clamp(Math.min(u, T.up) - T.rec0, 0, 59);
      const s = Math.floor(t), fr = t - s;
      const pop = s > 0 ? easeOut(fr / 0.18) : 1;
      k.save(); k.globalAlpha = a; k.textAlign = 'right'; k.textBaseline = 'middle';
      k.font = `600 15px ${MONO}`; k.fillStyle = 'rgba(255,255,255,0.92)';
      k.fillText('0:0', x - 9.2, CY + 0.5);
      k.globalAlpha = a * pop; k.fillText(String(s), x, CY + 0.5 + (1 - pop) * 5);
      k.restore();
    }
    // 转写气泡：底部小尾巴指向按钮；文字逐字出现
    const TEXT = '明天上午十点开会', META = '语音转文字 · 0:03';
    const BW = 214, BHB = 46, BY = 22;
    function bubble(k, u) {
      const inK = seg(u, T.bub0, T.bub1), outK = ease(seg(u, T.out0, T.out1));
      if (inK <= 0 || outK >= 1) return;
      const sc = backOut(inK, 2.0) * lerp(1, 0.94, outK);
      const x0 = CX - BW / 2, tip = BY + BHB + 9;
      k.save(); k.globalAlpha = clamp(inK * 3) * (1 - outK);
      k.translate(CX, tip - outK * 6); k.scale(sc, sc); k.translate(-CX, -tip);
      const path = () => {
        rr(k, x0, BY, BW, BHB, 14);
        k.moveTo(CX - 8, BY + BHB - 0.5); k.quadraticCurveTo(CX - 1, BY + BHB + 2, CX, tip);
        k.quadraticCurveTo(CX + 1, BY + BHB + 2, CX + 8, BY + BHB - 0.5); k.closePath();
      };
      k.save(); k.shadowColor = `rgba(${PAL.shadow},0.20)`; k.shadowBlur = 14; k.shadowOffsetY = 6;
      k.translate(0, 1.5); path(); k.fillStyle = '#E4E0D8'; k.fill(); k.restore();   // 下移 1.5 的厚度层
      const gr = k.createLinearGradient(0, BY, 0, BY + BHB);
      gr.addColorStop(0, PAL.bubble); gr.addColorStop(1, PAL.bubbleLo);
      path(); k.fillStyle = gr; k.fill();
      rr(k, x0 + 0.5, BY + 0.5, BW - 1, BHB - 1, 13.5); k.strokeStyle = 'rgba(255,255,255,0.9)'; k.lineWidth = 1; k.stroke();
      // 左侧紫色小圆标 + 两行文字
      k.beginPath(); k.arc(x0 + 23, BY + BHB / 2, 10, 0, Math.PI * 2); k.fillStyle = 'rgba(106,87,242,0.12)'; k.fill();
      k.strokeStyle = '#6A57F2'; k.lineWidth = 1.8; k.lineCap = 'round';
      for (let i = 0; i < 4; i++) {           // 小圆标里的四根短声波
        const hh = [3, 6, 4.5, 2.5][i];
        k.beginPath(); k.moveTo(x0 + 17.6 + i * 3.6, BY + BHB / 2 - hh); k.lineTo(x0 + 17.6 + i * 3.6, BY + BHB / 2 + hh); k.stroke();
      }
      const n = Math.round(TEXT.length * seg(u, T.bub0 + 0.12, T.type1));
      k.textAlign = 'left'; k.textBaseline = 'alphabetic';
      k.font = `500 11px ${SANS}`; k.fillStyle = PAL.ink3; k.fillText(META, x0 + 42, BY + 18);
      k.font = `600 15px ${SANS}`; k.fillStyle = PAL.ink; k.fillText(TEXT.slice(0, n), x0 + 42, BY + 36);
      if (n < TEXT.length) {                    // 打字光标
        const tw = k.measureText(TEXT.slice(0, n)).width;
        k.fillStyle = '#6A57F2'; k.fillRect(x0 + 43 + tw, BY + 24, 1.6, 15);
      }
      k.restore();
    }

    const fn = (k, w, h, u) => {
      u = ((u % CYC) + CYC) % CYC;
      k.drawImage(bg(), 0, 0, W, H);
      // 按下深度：按下 0.1 秒到底，松开 0.12 秒回弹
      const press = ease(seg(u, T.down, T.down + 0.1)) * (1 - ease(seg(u, T.up, T.up + 0.12)));
      // 宽度：鼓胀带过冲；缩回时 backOut 越过圆形尺寸再弹回
      const gk = backOut(seg(u, T.grow0, T.grow1), 1.3), sk = backOut(seg(u, T.shrink0, T.shrink1), 1.5);   // 缩回过冲约 7%：圆钮先缩到约 52 再弹回 68
      const cw = BH + (CW - BH) * (gk - sk);
      // 横向鼓过头时竖向轻压扁；缩到小于圆钮时保持正圆（高 = 宽）
      const over = Math.max(0, cw - CW) / CW;
      const ch = Math.min(cw, BH * (1 - over * 1.6));
      const rec = ease(seg(u, T.down, T.grow0 + 0.3)) * (1 - ease(seg(u, T.shrink0, T.shrink0 + 0.4)));
      const cy = CY + press * 2;
      capsule(k, CX, cy, cw, ch, rec, press);
      // 圆钮态麦克风：按下即淡出，缩回后带弹性重新出现
      const micA = (1 - seg(u, T.down, T.down + 0.2)) + seg(u, T.back1 - 0.7, T.back1 - 0.4);
      const micS = u > T.up ? backOut(seg(u, T.back1 - 0.7, T.back1 - 0.3), 2) : 1 - press * 0.08;
      mic(k, CX, cy, micS * (ch / BH), clamp(micA));
      // 录音内容：裁切在当前胶囊轮廓内，随胶囊展开被"揭开"
      const cA = seg(u, T.rec0, T.grow1) * (1 - seg(u, T.up + 0.15, T.flat1 + 0.15));
      const barA = seg(u, T.rec0, T.grow1) * (u < T.shrink1 ? 1 : 0);
      if (cA > 0 || barA > 0) {
        const x0 = CX - cw / 2, x1 = CX + cw / 2;
        k.save(); rr(k, x0, cy - ch / 2, cw, ch, Math.min(cw, ch) / 2); k.clip();
        k.translate(0, cy - CY);
        // 红点与计时贴着胶囊两端跟着鼓出去；竖条固定位置，被展开的轮廓逐步露出
        recDot(k, x0 + PAD, u, cA);
        bars(k, u, barA);
        timer(k, x1 - PAD + 6, u, cA);
        k.restore();
      }
      // 按钮下方提示语：随状态切换
      hint(k, u);
      bubble(k, u);
      // 光标：候场 → 移到按钮 → 按住 → 松开后退回
      const mv = ease(seg(u, T.move0, T.move1)) * (1 - ease(seg(u, T.back0 + 0.1, T.back1)));
      const cx = lerp(REST.x, PRESS.x, mv), cyy = lerp(REST.y, PRESS.y, mv) + press * 2;
      cursor(k, cx, cyy, 1 - press * 0.12);
    };

    function hint(k, u) {
      const a0 = 1 - seg(u, T.down, T.down + 0.2) + seg(u, T.out0, T.out1);
      const a1 = seg(u, T.grow1, T.grow1 + 0.25) * (1 - seg(u, T.up, T.up + 0.2));
      k.save(); k.textAlign = 'center'; k.textBaseline = 'alphabetic'; k.font = `500 12px ${SANS}`;
      if (a0 > 0.01) { k.globalAlpha = clamp(a0); k.fillStyle = PAL.ink3; k.fillText('按住说话', CX, 190); }
      if (a1 > 0.01) { k.globalAlpha = a1; k.fillStyle = PAL.ink2; k.fillText('松开结束 · 上滑取消', CX, 190); }
      k.restore();
    }
    return fn;
  })();

  // @element 67
  CELLS[66] = (function () {
    // 格点加载：凹槽托盘里两排 12 列立体方格，一道亮波从左往右反复扫过，被扫到的方格抬起、点亮再落回；
    // 波速与亮度随加载进度增大。右侧是秒表表盘计时，上方状态文字、下方当前文件与计数。
    // 完成时所有方格同时亮起，再横向收拢合并成一条完整进度条并显示「完成」，随后复位到首帧。
    // 纯函数：画面只由 u 决定；背景、托盘、方格材质、表盘等静态层首次调用时按 3 倍分辨率预渲染缓存。
    const W = 539, H = 208, CYC = 6.4;
    const SANS = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif';
    const MONO = '"SF Mono", Menlo, Consolas, monospace';
    const S = 3;                                  // 缓存分辨率倍数：调用方最多约 2×dpr 放大

    // 配色：沿用 uxmotion 浅色主题的暖灰底、墨色文字与紫→蓝→绿渐变强调
    const PAL = {
      bgTop: '#f8f6f2', bgMid: '#f1eee8', bgBot: '#e4dfd6', vignette: '52,40,70',
      ink: '#16151B', ink2: '#57535F', ink3: '#8E8A97',
      tileHi: '#ffffff', tileLo: '#ebe8f1', tileThick: '#cbc5d8', tileLine: 'rgba(22,21,27,.08)',
      trayTop: '#e3dfe8', trayBot: '#efece9', trayLine: 'rgba(22,21,27,.07)',
      mint: '#119C72', shadow: '40,30,80',
      grad: [[123, 97, 255], [61, 139, 255], [31, 184, 154]]
    };

    // 网格几何：12 列 × 2 行，方格 22、间距 6，总宽 330（约占画宽 61%）
    const N = 12, ROWS = 2, TS = 22, GAP = 6, TR = 5, TH = 4;   // TH 为方格厚度
    const GX = 44, GY = 80, GW = N * TS + (N - 1) * GAP, GH = ROWS * TS + GAP;
    const TRAY = { x: GX - 12, y: GY - 12, w: GW + 24, h: GH + 24 + TH, r: 14 };
    const BAR = { y: GY + GH / 2 - 11, h: 22 };                 // 合并后的进度条
    const DIAL = { x: 456, y: 106, r: 42 };                      // 秒表表盘
    const FILES = 1284;

    // 时间线（秒）
    const T_LOAD = 0.3, T_DONE = 4.0, T_MERGE = 4.38, T_BAR = 4.92, T_RESET = 5.6, T_REST = 6.05;

    const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
    const seg = (u, a, b) => clamp((u - a) / (b - a));
    const lerp = (a, b, t) => a + (b - a) * t;
    const ease = t => (t = clamp(t), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
    const backOut = t => { t = clamp(t); const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
    const hs = (i, s) => { const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };
    const rgb = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    const mixC = (a, b, t) => [0, 1, 2].map(i => Math.round(lerp(a[i], b[i], t)));
    // 第 c 列的强调色：沿紫→蓝→绿三段渐变取色
    const colC = c => { const t = c / (N - 1) * 2; return t < 1 ? mixC(PAL.grad[0], PAL.grad[1], t) : mixC(PAL.grad[1], PAL.grad[2], t - 1); };

    function rr(x, px, py, w, h, r) {
      r = Math.max(0, Math.min(r, w / 2, h / 2));
      x.beginPath(); x.moveTo(px + r, py);
      x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r);
      x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath();
    }
    function mk(w, h, draw) {
      const c = document.createElement('canvas'); c.width = Math.ceil(w * S); c.height = Math.ceil(h * S);
      const x = c.getContext('2d'); x.scale(S, S); draw(x); return c;
    }
    const C = {};                                  // 静态缓存

    // 背景：柔和竖向渐变 + 径向暗角 + 托盘落在画面上的柔和外阴影
    function bg(x) {
      const gr = x.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, PAL.bgTop); gr.addColorStop(0.55, PAL.bgMid); gr.addColorStop(1, PAL.bgBot);
      x.fillStyle = gr; x.fillRect(0, 0, W, H);
      const v = x.createRadialGradient(W * 0.45, H * 0.42, 40, W * 0.5, H * 0.5, W * 0.62);
      v.addColorStop(0, rgb(PAL.vignette.split(','), 0)); v.addColorStop(1, rgb(PAL.vignette.split(','), 0.13));
      x.fillStyle = v; x.fillRect(0, 0, W, H);
      tray(x);
    }

    // 托盘：凹进去的浅槽。外圈落影 + 底部白高光边，槽内上暗下亮（像光从上方来、槽沿挡住了顶部）
    function tray(x) {
      const t = TRAY;
      x.save(); x.shadowColor = rgb(PAL.shadow.split(','), 0.10); x.shadowBlur = 18 * S; x.shadowOffsetY = 6 * S;  // 阴影参数不受 scale 影响，缓存里乘 S
      rr(x, t.x - 6, t.y - 6, t.w + 12, t.h + 12, t.r + 5); x.fillStyle = '#f7f5f1'; x.fill(); x.restore();
      // 面板外沿：竖向渐变 + 左上高光边
      rr(x, t.x - 6, t.y - 6, t.w + 12, t.h + 12, t.r + 5);
      const pg = x.createLinearGradient(0, t.y - 6, 0, t.y + t.h + 6);
      pg.addColorStop(0, '#fdfcfa'); pg.addColorStop(1, '#eeebe5'); x.fillStyle = pg; x.fill();
      x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 1; rr(x, t.x - 5.5, t.y - 5.5, t.w + 11, t.h + 11, t.r + 4.5); x.stroke();
      // 凹槽本体
      rr(x, t.x, t.y, t.w, t.h, t.r);
      const tg = x.createLinearGradient(0, t.y, 0, t.y + t.h);
      tg.addColorStop(0, PAL.trayTop); tg.addColorStop(1, PAL.trayBot); x.fillStyle = tg; x.fill();
      // 槽内上沿的内阴影：用裁剪 + 槽外描边的 shadowBlur 做出来
      x.save(); rr(x, t.x, t.y, t.w, t.h, t.r); x.clip();
      x.shadowColor = 'rgba(40,30,80,.22)'; x.shadowBlur = 8 * S; x.shadowOffsetY = 3 * S;
      x.lineWidth = 6; x.strokeStyle = '#000'; rr(x, t.x - 3, t.y - 3, t.w + 6, t.h + 6, t.r + 3); x.stroke();
      x.restore();
      x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 1;   // 槽下沿反光
      x.beginPath(); x.moveTo(t.x + t.r, t.y + t.h + 0.5); x.lineTo(t.x + t.w - t.r, t.y + t.h + 0.5); x.stroke();
    }

    // 方格面：竖向渐变 + 左上白高光边 + 左上镜面光斑 + 细描边。col 为空时是未点亮的白瓷面
    function face(x, col) {
      rr(x, 0, 0, TS, TS, TR);
      const gr = x.createLinearGradient(0, 0, 0, TS);
      if (col) {
        const hi = mixC(col, [255, 255, 255], 0.45), lo = mixC(col, [20, 16, 40], 0.08);
        gr.addColorStop(0, rgb(hi, 1)); gr.addColorStop(1, rgb(lo, 1));
      } else { gr.addColorStop(0, PAL.tileHi); gr.addColorStop(1, PAL.tileLo); }
      x.fillStyle = gr; x.fill();
      x.save(); rr(x, 0, 0, TS, TS, TR); x.clip();
      const sp = x.createRadialGradient(TS * 0.3, TS * 0.22, 0, TS * 0.3, TS * 0.22, TS * 0.55);
      sp.addColorStop(0, `rgba(255,255,255,${col ? 0.75 : 0.95})`); sp.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = sp; x.fillRect(0, 0, TS, TS);
      x.restore();
      x.lineWidth = 1; x.strokeStyle = col ? rgb(mixC(col, [20, 16, 40], 0.25), 0.35) : PAL.tileLine;
      rr(x, 0.5, 0.5, TS - 1, TS - 1, TR - 0.5); x.stroke();
      // 左上高光边：只描上边和左边
      x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineWidth = 1;
      x.beginPath(); x.moveTo(1.2, TS - TR); x.lineTo(1.2, TR); x.arcTo(1.2, 1.2, TR, 1.2, TR - 1.2); x.lineTo(TS - TR, 1.2); x.stroke();
    }
    // 方格的侧面厚度（右下暗层），高度 hh 随抬起变化，因此单独缓存一块再按高度拉伸
    function side(x, col) {
      const c = col ? mixC(col, [20, 16, 40], 0.35) : PAL.tileThick.match(/\w\w/g).map(v => parseInt(v, 16));
      rr(x, 0, 0, TS, TS, TR);
      const gr = x.createLinearGradient(0, 0, TS, 0);
      gr.addColorStop(0, rgb(mixC(c, [255, 255, 255], 0.15), 1)); gr.addColorStop(1, rgb(c, 1));
      x.fillStyle = gr; x.fill();
    }
    // 柔和投影 / 发光的圆斑精灵：一次画好，按需缩放
    function blob(x, col, r) {
      const gr = x.createRadialGradient(r, r, 0, r, r, r);
      gr.addColorStop(0, rgb(col, 1)); gr.addColorStop(0.45, rgb(col, 0.45)); gr.addColorStop(1, rgb(col, 0));
      x.fillStyle = gr; x.fillRect(0, 0, r * 2, r * 2);
    }
    function build() {
      C.bg = mk(W, H, bg);
      C.face0 = mk(TS, TS, x => face(x, null)); C.side0 = mk(TS, TS, x => side(x, null));
      C.face = []; C.side = []; C.glow = [];
      for (let c = 0; c < N; c++) {
        const col = colC(c);
        C.face.push(mk(TS, TS, x => face(x, col))); C.side.push(mk(TS, TS, x => side(x, col)));
        C.glow.push(mk(40, 40, x => blob(x, col, 20)));
      }
      C.shadow = mk(40, 40, x => blob(x, PAL.shadow.split(',').map(Number), 20));
    }

    // 加载进度：不匀速，中间有两次「卡住」（大文件），关键点按加载段内的秒数给出，段内 smoothstep 插值
    const PKEY = [[0, 0], [0.75, 0.17], [1.25, 0.22], [2.1, 0.54], [2.65, 0.6], [3.4, 0.94], [3.7, 1]];
    function prog(s) {
      if (s <= 0) return 0;
      for (let i = 1; i < PKEY.length; i++) {
        const a = PKEY[i - 1], b = PKEY[i];
        if (s <= b[0]) { const t = (s - a[0]) / (b[0] - a[0]); return lerp(a[1], b[1], t * t * (3 - 2 * t)); }
      }
      return 1;
    }
    // 波浪相位（扫过次数）：速度随进度 0.6→1.6 次/秒，对 [0,s] 做固定步数的梯形积分，结果只由 s 决定
    const WSTEP = 48;
    function wavePhase(s) {
      if (s <= 0) return 0;
      const dt = s / WSTEP, v = t => 0.6 + 1.0 * prog(t);
      let sum = 0;
      for (let i = 0; i < WSTEP; i++) sum += (v(i * dt) + v((i + 1) * dt)) * 0.5 * dt;
      return sum;
    }

    // 汇总某一时刻的全部状态，绘制函数只读它
    function state(u) {
      // 复位切换点之后加载秒数归零，保证周期末尾与首帧一致
      const s = u >= T_RESET + 0.22 ? 0 : clamp(u - T_LOAD, 0, T_DONE - T_LOAD);
      const loading = u < T_DONE;
      const p = prog(s);
      // 波浪包络：开始时淡入、到完成时淡出
      const env = seg(u, T_LOAD, T_LOAD + 0.35) * (1 - seg(u, T_DONE - 0.12, T_DONE + 0.05));
      const ph = wavePhase(s), fr = ph - Math.floor(ph);
      const head = lerp(-2.5, N + 4.5, fr);                       // 波头所在列（可越出两端，便于平滑进出）
      // 完成闪亮 → 合并 → 复位拆回
      const flash = u < T_DONE ? 0 : u < T_RESET ? backOut(seg(u, T_DONE, T_DONE + 0.3)) : 1 - ease(seg(u, T_RESET, T_REST));
      const merge = u < T_RESET ? ease(seg(u, T_MERGE, T_BAR)) : 1 - ease(seg(u, T_RESET, T_RESET + 0.32));
      const done = u >= T_DONE && u < T_RESET + 0.22;             // 文案切换点：复位前段仍显示「完成」
      const elapsed = loading ? s : (u < T_RESET + 0.22 ? T_DONE - T_LOAD : 0);
      return { u, s, p: u >= T_RESET + 0.22 ? 0 : p, env, head, flash, merge, done, elapsed, bright: 0.5 + 0.5 * p };
    }
    // 单个方格在波浪下的亮度：波头前方陡、后方拖尾长；下排比上排滞后 0.45 列，形成斜向扫光
    function waveAt(st, c, r) {
      const d = st.head - (c + r * 0.45);
      const k = d >= 0 ? Math.exp(-d * d / 3.2) : Math.exp(-d * d / 0.7);
      return k * st.env;
    }

    // 方格网格：每格先算几何（含合并时向进度条形变），再按 投影 → 发光 → 侧面厚度 → 面 的顺序叠画
    function drawGrid(k, st) {
      const m = ease(st.merge), cw = GW / N;
      const tileA = 1 - seg(st.merge, 0.86, 1);
      const tiles = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < N; c++) {
        const wv = waveAt(st, c, r);
        // 已加载列保留淡淡底色，让进度在波浪之外也看得见
        const filled = clamp(st.p * N - c);
        // flash 用 backOut 会过冲到 1 以上，globalAlpha 超界会被忽略，所以必须钳到 [0,1]
        const lit = clamp(Math.max(wv * st.bright, filled * 0.16, st.flash));
        const lift = Math.max(wv * (3.5 + 3 * st.bright), st.flash * 3.2 * (1 - m) + m * 1.5) + (hs(c, r) - 0.5) * 0.4 * wv;
        const x = lerp(GX + c * (TS + GAP), GX + c * cw - 0.3, m), wd = lerp(TS, cw + 0.6, m);
        const y = lerp(GY + r * (TS + GAP), BAR.y, m), ht = lerp(TS, BAR.h, m);
        tiles.push({ c, r, wv, lit, lift, x, y, wd, ht });
      }
      if (tileA > 0) {
        k.save(); k.globalAlpha = tileA;
        for (const t of tiles) {                                   // 投影：抬得越高越大越淡；接触影贴在槽底
          const sz = t.wd + 10 + t.lift * 2.4;
          k.globalAlpha = tileA * (0.30 - t.lift * 0.022);
          k.drawImage(C.shadow, t.x + t.wd / 2 - sz / 2 + 1, t.y + t.ht + TH - sz * 0.32 + t.lift * 0.4, sz, sz * 0.5);
        }
        for (const t of tiles) {                                   // 发光：点亮时向四周晕出同色光
          if (t.lit < 0.04) continue;
          const sz = t.wd * 2.6 + 6;
          k.globalAlpha = tileA * t.lit * 0.55;
          k.drawImage(C.glow[t.c], t.x + t.wd / 2 - sz / 2, t.y + t.ht / 2 - t.lift - sz / 2 + 2, sz, sz);
        }
        for (const t of tiles) {
          const fy = t.y - t.lift;
          k.globalAlpha = tileA;
          // 厚度层向右下错开：底边露 TH、右边露约 1px，模拟光从左上来
          const sx = t.x + 1 - m;
          k.drawImage(C.side0, sx, fy + TH, t.wd, t.ht);
          if (t.lit > 0.01) { k.globalAlpha = tileA * t.lit; k.drawImage(C.side[t.c], sx, fy + TH, t.wd, t.ht); }
          k.globalAlpha = tileA;
          k.drawImage(C.face0, t.x, fy, t.wd, t.ht);
          if (t.lit > 0.01) { k.globalAlpha = tileA * t.lit; k.drawImage(C.face[t.c], t.x, fy, t.wd, t.ht); }
          // 波头经过时的白色镜面闪光
          if (t.wv > 0.35) { k.globalAlpha = tileA * (t.wv - 0.35) * 0.9 * st.bright; k.fillStyle = '#fff'; rr(k, t.x + 3, fy + 2.5, t.wd - 6, 3, 1.5); k.fill(); }
        }
        k.restore();
      }
      if (st.merge > 0.7) drawBar(k, st, seg(st.merge, 0.7, 1));
    }

    // 合并后的完整进度条：紫→蓝→绿渐变胶囊，带厚度、高光边、扫过一次的光泽和居中的「完成」
    function drawBar(k, st, a) {
      const x = GX, y = BAR.y - 1.5, wd = GW, ht = BAR.h, r = ht / 2;
      const sheen = seg(st.u, T_BAR, T_BAR + 0.55);
      k.save(); k.globalAlpha = a;
      k.save(); k.shadowColor = 'rgba(61,139,255,.35)'; k.shadowBlur = 16; k.shadowOffsetY = 4;
      rr(k, x, y + TH, wd, ht, r); k.fillStyle = rgb(mixC(PAL.grad[1], [20, 16, 40], 0.35), 1); k.fill(); k.restore();
      rr(k, x, y, wd, ht, r);
      const gr = k.createLinearGradient(x, 0, x + wd, 0);
      gr.addColorStop(0, rgb(PAL.grad[0], 1)); gr.addColorStop(0.5, rgb(PAL.grad[1], 1)); gr.addColorStop(1, rgb(PAL.grad[2], 1));
      k.fillStyle = gr; k.fill();
      k.save(); rr(k, x, y, wd, ht, r); k.clip();
      const vg = k.createLinearGradient(0, y, 0, y + ht);              // 竖向体积：上亮下暗
      vg.addColorStop(0, 'rgba(255,255,255,.42)'); vg.addColorStop(0.5, 'rgba(255,255,255,.06)'); vg.addColorStop(1, 'rgba(20,16,40,.14)');
      k.fillStyle = vg; k.fillRect(x, y, wd, ht);
      if (sheen > 0 && sheen < 1) {                                     // 一道斜向光泽从左扫到右
        const sx = lerp(x - 60, x + wd + 60, easeOut(sheen));
        const sg = k.createLinearGradient(sx - 40, 0, sx + 40, 0);
        sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,.55)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
        k.fillStyle = sg; k.fillRect(x, y, wd, ht);
      }
      k.restore();
      k.strokeStyle = 'rgba(255,255,255,.75)'; k.lineWidth = 1;
      k.beginPath(); k.moveTo(x + r, y + 1); k.lineTo(x + wd - r, y + 1); k.stroke();
      // 居中文字「✓ 完成 · 1,284 / 1,284」，对勾以描边绘制
      const ta = ease(seg(st.u, T_BAR - 0.1, T_BAR + 0.25));
      k.globalAlpha = a * ta;
      k.font = `600 12px ${SANS}`; k.textBaseline = 'middle'; k.textAlign = 'left';
      const label = '完成', sub = '  ·  1,284 / 1,284 个文件';
      k.font = `600 12px ${SANS}`; const lw = k.measureText(label).width;
      k.font = `500 11px ${SANS}`; const sw = k.measureText(sub).width;
      const tx = x + wd / 2 - (lw + sw + 16) / 2, ty = y + ht / 2 + 0.5;
      k.strokeStyle = '#fff'; k.lineWidth = 2; k.lineCap = 'round'; k.lineJoin = 'round';
      const ck = easeOut(seg(st.u, T_BAR, T_BAR + 0.3));
      k.beginPath(); k.moveTo(tx, ty); k.lineTo(tx + 3.5 * Math.min(1, ck * 2), ty + 3.5 * Math.min(1, ck * 2));
      if (ck > 0.5) k.lineTo(tx + 3.5 + 6 * (ck - 0.5) * 2, ty + 3.5 - 7.5 * (ck - 0.5) * 2);
      k.stroke();
      k.fillStyle = '#fff'; k.font = `600 12px ${SANS}`; k.fillText(label, tx + 16, ty);
      k.fillStyle = 'rgba(255,255,255,.82)'; k.font = `500 11px ${SANS}`; k.fillText(sub, tx + 16 + lw, ty);
      k.restore();
    }

    // 秒表表盘静态层：金属外圈、白瓷盘面、60 刻度、顶部表冠；按 3 倍缓存
    function dial(x) {
      const R = DIAL.r, cx = R + 10, cy = R + 16;
      x.save(); x.shadowColor = 'rgba(40,30,80,.18)'; x.shadowBlur = 14 * S; x.shadowOffsetY = 5 * S;
      x.beginPath(); x.arc(cx, cy, R + 4, 0, Math.PI * 2); x.fillStyle = '#e9e6ef'; x.fill(); x.restore();
      rr(x, cx - 5, cy - R - 12, 10, 9, 2.5);                          // 表冠
      const cg = x.createLinearGradient(cx - 5, 0, cx + 5, 0); cg.addColorStop(0, '#f4f2f7'); cg.addColorStop(1, '#bdb7c9');
      x.fillStyle = cg; x.fill();
      x.fillStyle = '#cfc9d9'; x.fillRect(cx - 2.5, cy - R - 4, 5, 4);
      x.beginPath(); x.arc(cx, cy, R + 4, 0, Math.PI * 2);              // 金属外圈：左上亮右下暗
      const rg = x.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.5, '#e2dee9'); rg.addColorStop(1, '#bdb6c8');
      x.fillStyle = rg; x.fill();
      x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2);                  // 盘面
      const fg = x.createRadialGradient(cx - R * 0.3, cy - R * 0.4, 2, cx, cy, R);
      fg.addColorStop(0, '#ffffff'); fg.addColorStop(1, '#efedf3'); x.fillStyle = fg; x.fill();
      x.strokeStyle = 'rgba(22,21,27,.10)'; x.lineWidth = 1; x.stroke();
      for (let i = 0; i < 60; i++) {
        const a = i / 60 * Math.PI * 2 - Math.PI / 2, big = i % 5 === 0;
        const r0 = R - (big ? 7 : 4.5), r1 = R - 2.5;
        x.strokeStyle = big ? 'rgba(22,21,27,.42)' : 'rgba(22,21,27,.18)'; x.lineWidth = big ? 1.2 : 0.7;
        x.beginPath(); x.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); x.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); x.stroke();
      }
      x.fillStyle = PAL.ink3; x.font = `500 7.5px ${SANS}`; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('用时', cx, cy - 13);
    }
    // 当前正在索引的文件（按进度轮换，名单固定）
    const NAMES = ['src/app/layout.tsx', 'src/components/Grid/TileButton.tsx', 'docs/2026-10-roadmap.md', 'packages/core/index.ts',
      'assets/brand/logo@3x.png', 'src/hooks/useIndexer.ts', 'design/tokens.json', 'notes/周会纪要-1028.md',
      'src/server/search/bm25.ts', 'tests/e2e/upload.spec.ts', 'README.md'];
    const fmtN = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const pad = (n, l) => { let s = String(n); while (s.length < l) s = '0' + s; return s; };

    const fn = (k, w, h, u) => {
      u = ((u % CYC) + CYC) % CYC;
      if (!C.bg) build();
      k.drawImage(C.bg, 0, 0, W, H);
      const st = state(u);
      drawGrid(k, st);
      // 文案在复位切换点前后淡出淡入，避免数字硬跳
      const ta = 1 - seg(u, T_RESET, T_RESET + 0.2) + seg(u, T_RESET + 0.24, T_RESET + 0.44);
      drawInfo(k, st, ta);
      drawDial(k, st, ta);
    };

    // 托盘上方的状态行与下方的当前文件行
    function drawInfo(k, st, ta) {
      k.save(); k.globalAlpha = ta; k.textBaseline = 'alphabetic';
      const y0 = TRAY.y - 18, y1 = TRAY.y + TRAY.h + 25;
      if (!st.done) {
        // 状态点：随波浪呼吸的小圆点
        const pulse = 0.5 + 0.5 * Math.sin(st.s * 7);
        k.fillStyle = rgb(PAL.grad[0], 0.18 + 0.14 * pulse); k.beginPath(); k.arc(GX - 4 + 3, y0 - 4, 5.5, 0, Math.PI * 2); k.fill();
        k.fillStyle = rgb(PAL.grad[0], 1); k.beginPath(); k.arc(GX - 4 + 3, y0 - 4, 2.6, 0, Math.PI * 2); k.fill();
        k.font = `600 13px ${SANS}`; k.fillStyle = PAL.ink; k.textAlign = 'left';
        k.fillText(`正在索引 ${fmtN(FILES)} 个文件`, GX + 8, y0);
      } else {
        const a = easeOut(seg(st.u, T_DONE, T_DONE + 0.3));
        k.fillStyle = rgb([17, 156, 114], 0.16); k.beginPath(); k.arc(GX - 1, y0 - 4, 5.5 + a, 0, Math.PI * 2); k.fill();
        k.fillStyle = PAL.mint; k.beginPath(); k.arc(GX - 1, y0 - 4, 2.6, 0, Math.PI * 2); k.fill();
        k.font = `600 13px ${SANS}`; k.fillStyle = PAL.ink; k.textAlign = 'left';
        k.fillText(`索引完成，共 ${fmtN(FILES)} 个文件`, GX + 8, y0);
      }
      // 右侧百分比：等宽数字
      const pct = st.done ? 100 : Math.floor(st.p * 100);
      k.font = `600 13px ${MONO}`; k.textAlign = 'right'; k.fillStyle = st.done ? PAL.mint : PAL.ink2;
      k.fillText(pct + '%', GX + GW, y0);
      // 下方：当前文件名 + 计数
      const n = st.done ? FILES : Math.floor(st.p * FILES);
      k.font = `500 11px ${MONO}`; k.textAlign = 'left'; k.fillStyle = PAL.ink3;
      const name = st.done ? '已写入索引 · search.idx  4.8 MB' : NAMES[Math.min(NAMES.length - 1, Math.floor(st.s * 3.1) % NAMES.length)];
      k.fillText(name, GX - 4, y1);
      k.textAlign = 'right'; k.fillStyle = PAL.ink2;
      k.fillText(`${fmtN(n)} / ${fmtN(FILES)}`, GX + GW, y1);
      k.restore();
    }

    // 秒表：缓存的表盘 + 渐变进度弧 + 指针（10 秒一圈）+ 数字计时「00:02.4」
    function drawDial(k, st, ta) {
      const R = DIAL.r, cx = DIAL.x, cy = DIAL.y;
      if (!C.dial) C.dial = mk(R * 2 + 20, R * 2 + 30, dial);
      k.drawImage(C.dial, cx - R - 10, cy - R - 16, R * 2 + 20, R * 2 + 30);
      const p = st.done ? 1 : st.p;
      k.save(); k.globalAlpha = ta;
      if (p > 0.002) {                                         // 外圈进度弧，颜色随进度由紫转绿
        k.lineCap = 'round'; k.lineWidth = 3;
        k.strokeStyle = rgb(st.done ? [17, 156, 114] : colC(Math.round(p * (N - 1))), 0.9);
        k.beginPath(); k.arc(cx, cy, R + 1.5, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); k.stroke();
      }
      const e = st.elapsed, ds = Math.floor(e * 10);
      const txt = `${pad(Math.floor(e / 60), 2)}:${pad(Math.floor(e) % 60, 2)}.${ds % 10}`;
      k.font = `600 13px ${MONO}`; k.textAlign = 'center'; k.textBaseline = 'middle';
      k.fillStyle = st.done ? PAL.mint : PAL.ink; k.fillText(txt, cx, cy + 14);
      k.restore();
      // 指针 10 秒一圈；复位段平滑逆转回 12 点，不随数字硬跳
      const ne = st.u >= T_RESET ? (T_DONE - T_LOAD) * (1 - ease(seg(st.u, T_RESET, T_REST))) : e;
      const a = ne / 10 * Math.PI * 2 - Math.PI / 2;
      k.save(); k.strokeStyle = rgb(PAL.grad[0], 1); k.lineWidth = 1.6; k.lineCap = 'round';
      k.shadowColor = 'rgba(40,30,80,.25)'; k.shadowBlur = 2; k.shadowOffsetY = 1;
      k.beginPath(); k.moveTo(cx - Math.cos(a) * 7, cy - Math.sin(a) * 7); k.lineTo(cx + Math.cos(a) * (R - 8), cy + Math.sin(a) * (R - 8)); k.stroke();
      k.shadowColor = 'transparent';
      k.fillStyle = '#fff'; k.beginPath(); k.arc(cx, cy, 3.2, 0, Math.PI * 2); k.fill();
      k.strokeStyle = rgb(PAL.grad[0], 1); k.lineWidth = 1.4; k.stroke();
      k.restore();
    }
    return fn;
  })();

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

  // @element 68
  // 68 ASCII 尾迹立方（bencho ascii-wake）：等轴立方体由半色调墨点组成（顶面稀、左面中、右面密，面交界和轮廓是密线）；
  // 指针 0.3 秒从右侧进入，沿曲线划过立方体，划过的格子按热度换成 . : - = + * # % @ 并闪动，尾迹按 1.2 秒冷却回点，附近字符向指针倾斜；
  // 2.6 秒按下，从按点荡出一圈 2.2 秒扩散的环；随后再划一笔，4.8 秒离开画面；复位段 5.4–6.0 秒余热清零。
  const AW_R = 92, AW_SZ = 10, AW_CWD = AW_SZ * 0.62, AW_CHT = AW_SZ * 0.82;
  const AW_RAD = 40, AW_TRAIL = 1.2, AW_PULL = 0.4, AW_RING = 2.2, AW_PRESS = 2.6, AW_COLD = 0.04, AW_DT = 1 / 40;
  const AW_RAMP = [' ', '.', ':', '-', '=', '+', '*', '#', '%', '@'];
  const AW_KEYS = [[0, 600, 150], [0.35, 520, 120], [1.0, 330, 46], [1.55, 222, 120], [2.1, 262, 150], [2.45, 286, 112], [2.75, 286, 112], [3.3, 214, 66], [3.9, 300, 70], [4.3, 360, 150], [4.8, 620, 200]];
  const AW_IN = 0.3, AW_OUT = 4.55;
  // 原作 cube()：点 (x, y) 相对立方体中心的墨点大小 0..1（浅色页面按半色调印：亮面稀、暗面密）
  function AW_cube(x, y) {
    const lit = v => 0.35 + 0.65 * clamp(1.09 - v);
    const R = AW_R, c = Math.cos(Math.PI / 6) * R, h = R / 2;
    const T = [0, -R], UR = [c, -h], B = [0, R], LL = [-c, h], UL = [-c, -h];
    const along = (o, p, q) => {
      const ax = p[0] - o[0], ay = p[1] - o[1], bx = q[0] - o[0], by = q[1] - o[1], dx = x - o[0], dy = y - o[1], det = ax * by - ay * bx;
      return [(dx * by - dy * bx) / det, (ax * dy - ay * dx) / det];
    };
    const inside = ([s, t]) => s >= 0 && s <= 1 && t >= 0 && t <= 1, seam = v => (v < 0.045 ? 1 : 0);
    const top = along(T, UR, UL);
    if (inside(top)) { const [s, t] = top; return seam(1 - s) || seam(1 - t) ? 1 : lit(0.96 - 0.1 * (s + t) / 2); }
    const left = along(UL, [0, 0], LL);
    if (inside(left)) { const [s, t] = left; return seam(s) ? 1 : lit(0.56 - 0.12 * t); }
    const right = along([0, 0], UR, B);
    if (inside(right)) { const [s, t] = right; return seam(s) || seam(t) ? 1 : lit(0.13 - 0.05 * s); }
    return 0;
  }
  let AW_GRID = null;                                       // 立方体内的格子 [下标, x, y, m]，只算一次
  function AW_grid() {
    if (AW_GRID) return AW_GRID;
    const cols = Math.floor(CW / AW_CWD - 0.5), rows = Math.floor(CH / AW_CHT);
    const ox = (CW - cols * AW_CWD) / 2, oy = (CH - rows * AW_CHT) / 2;
    AW_GRID = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = ox + (i + 0.5 + (j & 1) * 0.5) * AW_CWD, y = oy + (j + 0.5) * AW_CHT, m = AW_cube(x - CW / 2, y - CH / 2);
      if (m > 0) AW_GRID.push([j * cols + i, x, y, m]);
    }
    return AW_GRID;
  }
  // 热度色阶：冷蓝 → 紫 → 品红 → 橙 → 黄
  const AW_HEAT = ['#5B8CFF', '#8F63FF', '#D04BE8', '#FF4F9A', '#FF7A45', '#FFB238', '#FFE45C'];
  CELLS[67] = (k, w, h, u) => {
    const bg = k.createLinearGradient(0, 0, CW, CH); bg.addColorStop(0, '#121A3D'); bg.addColorStop(1, '#2B1452');
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    const G = AW_grid(), fade = fadeIn(u), near = BN_near(u, AW_IN, AW_OUT), hand = BN_path(u, AW_KEYS);
    // 过去 2.4 秒的路径按 1/40 秒取样：每小段按移动距离折算盖章次数（原作每移动 rad/3 盖一次 0.5），再按 exp(-3Δt/trail) 冷却
    const st = [];
    for (let s = Math.max(0, Math.floor((u - 2.4) / AW_DT) * AW_DT); s < u; s += AW_DT) {
      const e = Math.min(u, s + AW_DT), p0 = BN_path(s, AW_KEYS), p1 = BN_path(e, AW_KEYS), d = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      if (d > 0.01) st.push([p1[0], p1[1], 0.5 * d / (AW_RAD / 3) * Math.exp(-3 * (u - e) / AW_TRAIL)]);
    }
    const R2 = AW_RAD * AW_RAD, far2 = 4 * R2, lean = AW_PULL * near, deal = Math.floor(u / 0.07);
    const rp = (u - AW_PRESS) / AW_RING, rc = BN_path(AW_PRESS, AW_KEYS);
    const ring = rp > 0 && rp < 1 ? { R: 8 + out3(rp) * 220, amp: 0.6 * (1 - rp) * (1 - rp) * Math.min(1, rp * 6) } : null;
    const dot = Math.min(AW_CWD, AW_CHT) * 0.44, top = AW_RAMP.length - 1;
    k.font = `500 ${AW_SZ}px ${MONO}`; k.textAlign = 'center'; k.textBaseline = 'middle';
    const heatTop = AW_HEAT.length - 1;
    for (const [id, cx, cy, m] of G) {
      let hh = 0;
      for (const [sx, sy, a] of st) { const q = ((cx - sx) ** 2 + (cy - sy) ** 2) / R2; if (q < 1) hh += a * (1 - q) * (1 - q); }
      hh = Math.min(1, hh);
      if (near > 0.002) { const q = ((cx - hand[0]) ** 2 + (cy - hand[1]) ** 2) / R2; if (q < 1) hh = Math.max(hh, 0.95 * near * (1 - q) * (1 - q)); }
      if (ring) { const d = (Math.hypot(cx - rc[0], cy - rc[1]) - ring.R) / 20; if (d > -2.5 && d < 2.5) hh += ring.amp * Math.exp(-d * d); }
      hh *= (0.55 + 0.45 * m) * fade;
      let x = cx, y = cy;
      if (lean > 0.002) {
        const dx = hand[0] - x, dy = hand[1] - y, d2 = dx * dx + dy * dy;
        if (d2 < far2) { const f = 1 - d2 / far2, d = Math.sqrt(d2) || 1, mv = Math.min(d * 0.6, 12 * lean * f * f); x += dx / d * mv; y += dy / d * mv; }
      }
      let lv = Math.min(1, hh) * top + 0.5;
      if (hh > AW_COLD) lv += (BN_hash2(id, deal) - 0.5) * 1.6 * Math.min(1, hh * 2);
      const idx = clamp(Math.floor(lv), 1, top);
      if (hh <= AW_COLD || idx === 1) {
        k.fillStyle = `rgba(150,170,255,${(0.35 + 0.4 * m).toFixed(3)})`;
        k.beginPath(); k.arc(x, y, Math.max(0.45, dot * Math.sqrt(m)), 0, TAU); k.fill();
      } else {
        k.fillStyle = AW_HEAT[clamp(Math.round(Math.min(1, hh) * heatTop), 0, heatTop)];
        k.fillText(AW_RAMP[idx], x, y);
      }
    }
    if (u > 0.2 && u < 4.9) cursor(k, hand[0], hand[1], UXB_press(u, AW_PRESS));
  };

  // @element 69
  // 69 热力点阵（bencho heat-word）：深夜蓝底（中心略亮的径向渐变）上 7×3 颗暗蓝紫色圆点（相邻的点边缘相融）；指针 0.3 秒从右侧进入，0.5–2.2 秒在点阵上来回扫，
  // 手下半径 128 px（原作像素，画面整体放大 1.2 倍）的圆内显出 Neon 热成像色（粉边→红→黄→青→蓝→深蓝核心），手下的点胀大相融、中心被"冷却"成一圈圈色环；
  // 2.4 秒按下换成 4 根过中心交叉的粗条（星号），0.9 秒内淡入长出；3.7 秒再按换成粗体单词 BEND，指针在单词上扫过；
  // 4.75 秒指针移出，热色按 0.22 秒时间常数淡回暗蓝紫；5.4–6.0 秒单词淡出，5.5–6.35 秒点阵重新长出。
  const HW_W = 300, HW_H = 170, HW_S = 1.2, HW_PX = 1.3;     // 原作画布 300×170；显示放大 1.2 倍；场按每原作像素 1.3 个像素计算（场本身是模糊的，降低分辨率看不出差别，帧耗时更短）
  const HW_X = (CW - HW_W * HW_S) / 2, HW_Y = (CH - HW_H * HW_S) / 2;
  const HW_HEAT = 60, HW_AREA = 50, HW_SOFT = 40, HW_FLOOR = 34, HW_GROW = 0.9, HW_SEED = 4;
  const HW_T1 = 2.4, HW_T2 = 3.7, HW_IN = 0.45, HW_OUT = 4.75, HW_TAU = 0.217;   // 原作 power 每帧按 0.01^dt 追赶 → 时间常数 1/ln100
  const HW_KEYS = [[0, 600, 118], [0.3, 548, 116], [0.6, 430, 108], [1.05, 330, 66], [1.5, 196, 132], [1.9, 150, 84], [2.2, 236, 74],
    [2.32, 268, 100], [2.52, 268, 100], [2.95, 336, 140], [3.35, 214, 62], [3.6, 250, 100], [3.8, 250, 100], [4.15, 178, 90], [4.5, 330, 120], [4.8, 470, 150], [5.05, 600, 186]];
  const HW_GREY = [92, 98, 196];                              // 静止态的点：深底上的暗蓝紫（原作浅底上为灰）
  // Neon 色带（rim 0 → core 1），沿用原作 PALETTES.Neon，只把最深的两档核心色提亮成电光蓝/靛紫，免得在深底上看成空洞
  const HW_NEON = [[0, [255, 150, 225]], [0.1, [255, 90, 190]], [0.2, [255, 50, 60]], [0.32, [255, 150, 40]], [0.42, [255, 228, 100]],
    [0.54, [120, 215, 255]], [0.68, [40, 120, 245]], [0.84, [52, 70, 235]], [1, [96, 52, 210]]];
  const HW_SPREAD = 0.5 + HW_AREA / 100;
  // 256 级亮度 → 颜色表；FLOOR 以下透明，边缘 26 级内淡入；灰度态的透明度另表
  const HW_LUT = (() => {
    const t = new Uint8ClampedArray(1024);
    for (let i = HW_FLOOR; i < 256; i++) {
      const v = (i - HW_FLOOR) / (255 - HW_FLOOR);
      let j = 0; while (j < HW_NEON.length - 2 && v > HW_NEON[j + 1][0]) j++;
      const [v0, c0] = HW_NEON[j], [v1, c1] = HW_NEON[j + 1], f = clamp((v - v0) / (v1 - v0));
      for (let c = 0; c < 3; c++) t[i * 4 + c] = c0[c] + (c1[c] - c0[c]) * f;
      t[i * 4 + 3] = 255 * clamp((i - HW_FLOOR) / 26);
    }
    return t;
  })();
  const HW_GA = new Uint8ClampedArray(256).map((_, i) => 255 * clamp((i - 70) / 45));
  let HW_BG = null;
  // 原作的线性同余 rng：同一 seed 永远同一排布
  function HW_rng(seed) { let t = seed * 9301 + 49297; return () => { t = (t * 9301 + 49297) % 233280; return t / 233280; }; }
  // 原作 drawShape：Dots 为 7×3 抖动网格，手下的点按高斯胀大；Asterisk 为过中心的 3–4 根粗条
  function HW_shape(g, shape, w, h, r, seed, hand) {
    const rand = HW_rng(seed), cx = w / 2, cy = h / 2;
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (shape === 'Dots') {
      const reach = 62 * r * HW_SPREAD;
      for (let j = 0; j < 3; j++) for (let i = 0; i < 7; i++) {
        const x = cx + (i - 3) * 38 * r + (rand() - 0.5) * 8 * r, y = cy + (j - 1) * 38 * r + (rand() - 0.5) * 8 * r;
        let rad = (9 + rand() * 7) * r;
        if (hand) rad *= 1 + 0.75 * hand.on * Math.exp(-((x - hand.x) ** 2 + (y - hand.y) ** 2) / (reach * reach));
        g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill();
      }
    } else {
      g.lineWidth = 16 * r;
      const n = 3 + Math.floor(rand() * 2), turn = rand() * Math.PI;
      for (let i = 0; i < n; i++) {
        const a = turn + (i / n) * Math.PI, c = Math.cos(a) * 66 * r, s = Math.sin(a) * 66 * r;
        g.beginPath(); g.moveTo(cx - c, cy - s); g.lineTo(cx + c, cy + s); g.stroke();
      }
    }
  }
  const HW_C = {};
  const HW_cv = name => {
    if (!HW_C[name]) { const c = document.createElement('canvas'); c.width = HW_W * HW_PX; c.height = HW_H * HW_PX; HW_C[name] = [c, c.getContext('2d', { willReadFrequently: true })]; }
    return HW_C[name];
  };
  // 灰度场：形状画在画布外，只让模糊的影子落进来（亮在笔画中心、边缘渐暗），画两遍让粗处饱和
  function HW_field(g, shape, seed, hand) {
    const w = HW_W * HW_PX, h = HW_H * HW_PX, r = HW_PX, off = w * 3;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.shadowColor = 'transparent'; g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.shadowColor = '#fff'; g.shadowBlur = (6 + HW_SOFT / 100 * 16) * r; g.shadowOffsetX = off; g.fillStyle = '#fff'; g.strokeStyle = '#fff';
    g.save(); g.translate(-off, 0);
    if (shape === 'Word') {
      let size = 150 * r; g.font = UXB_f(700, size);
      size = Math.min(size, size * (w * 0.88) / g.measureText('BEND').width); g.font = UXB_f(700, size);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let i = 0; i < 2; i++) g.fillText('BEND', w / 2, h / 2 + size * 0.04);
    } else for (let i = 0; i < 2; i++) HW_shape(g, shape, w, h, r, seed, hand);
    g.restore(); g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetX = 0;
  }
  // 静止的场只算一次；Dots 在手下时每帧重画（点会胀大）
  function HW_base(shape, seed, hand) {
    if (hand) { const [c, g] = HW_cv('dyn'); HW_field(g, shape, seed, hand); return c; }
    const key = shape + seed;
    if (!HW_C[key]) { const [c, g] = HW_cv(key); HW_field(g, shape, seed, null); }
    return HW_C[key][0];
  }
  CELLS[68] = (k, w, h, u) => {
    if (!HW_BG) { HW_BG = k.createRadialGradient(CW / 2, CH / 2, 10, CW / 2, CH / 2, CW * 0.62); HW_BG.addColorStop(0, '#141B46'); HW_BG.addColorStop(1, '#060818'); }
    k.fillStyle = HW_BG; k.fillRect(0, 0, CW, CH);
    const hand = BN_path(u, HW_KEYS), on = BN_near(u, HW_IN, HW_OUT, HW_TAU), P = HW_PX, FW = HW_W * P, FH = HW_H * P;
    const hx = (hand[0] - HW_X) / HW_S * P, hy = (hand[1] - HW_Y) / HW_S * P, H = on > 0.002 ? { x: hx, y: hy, on } : null;
    // 当前形状与"长出"程度（原作换形后 globalAlpha 0→1 用 0.9 秒）；复位段单词淡出、点阵叠加长回
    const L = u < HW_T1 ? [['Dots', HW_SEED, 1]]
      : u < HW_T2 ? [['Asterisk', HW_SEED + 1, seg(u, HW_T1, HW_T1 + HW_GROW)]]
        : [['Word', 0, seg(u, HW_T2, HW_T2 + HW_GROW) * (1 - inOut3(seg(u, SHOW, SHOW + 0.6)))], ['Dots', HW_SEED, seg(u, SHOW + 0.1, SHOW + 0.95)]];
    const [wc, g] = HW_cv('work');
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.fillStyle = '#000'; g.fillRect(0, 0, FW, FH);
    L.forEach(([s, sd, a], i) => {
      if (a <= 0) return;
      g.globalCompositeOperation = i ? 'lighter' : 'source-over'; g.globalAlpha = a;
      g.drawImage(HW_base(s, sd, s === 'Dots' ? H : null), 0, 0);
    });
    g.globalAlpha = 1;
    // 指针"冷却"：乘法把手下的场压暗，深蓝核心张开成蓝、青、黄、红的色环
    if (H) {
      const rad = (60 + HW_HEAT / 100 * 50) * P * HW_SPREAD, amt = on * (0.35 + HW_HEAT / 100 * 0.55);
      const v = q => { const c = Math.round(255 * (1 - amt * q)); return `rgb(${c},${c},${c})`; };
      const cool = g.createRadialGradient(hx, hy, 0, hx, hy, rad);
      cool.addColorStop(0, v(1)); cool.addColorStop(0.45, v(0.6)); cool.addColorStop(1, '#fff');
      g.globalCompositeOperation = 'multiply'; g.fillStyle = cool; g.fillRect(0, 0, FW, FH); g.globalCompositeOperation = 'source-over';
    }
    const src = g.getImageData(0, 0, FW, FH).data, [oc, og] = HW_cv('out');
    if (!HW_C.img) HW_C.img = og.createImageData(FW, FH);
    const d = HW_C.img.data, R = (95 + HW_HEAT / 100 * 55) * P * HW_SPREAD, R2 = R * R;
    for (let y = 0, i = 0; y < FH; y++) {
      const dy2 = (y - hy) * (y - hy);
      for (let x = 0; x < FW; x++, i += 4) {
        const f = src[i], ga = HW_GA[f];
        let m = 0;
        if (H) { const q = ((x - hx) * (x - hx) + dy2) / R2; if (q < 1) { const t = 1 - q; m = on * t * t * (3 - 2 * t); } }
        if (m <= 0) { d[i] = HW_GREY[0]; d[i + 1] = HW_GREY[1]; d[i + 2] = HW_GREY[2]; d[i + 3] = ga; continue; }
        const v = f * 4, n = 1 - m;
        d[i] = HW_GREY[0] * n + HW_LUT[v] * m; d[i + 1] = HW_GREY[1] * n + HW_LUT[v + 1] * m;
        d[i + 2] = HW_GREY[2] * n + HW_LUT[v + 2] * m; d[i + 3] = ga * n + HW_LUT[v + 3] * m;
      }
    }
    og.putImageData(HW_C.img, 0, 0);
    k.save(); k.imageSmoothingEnabled = true; k.imageSmoothingQuality = 'high';
    k.drawImage(oc, HW_X, HW_Y, HW_W * HW_S, HW_H * HW_S); k.restore();
    for (const tc of [HW_T1, HW_T2]) { const p = BN_path(tc, HW_KEYS); ripple(k, p[0], p[1], (u - tc) / 0.6, '255,228,120'); }
    if (u > 0.2 && u < 5) cursor(k, hand[0], hand[1], UXB_press(u, HW_T1) + UXB_press(u, HW_T2));
  };

  // @element 70
  // 70 粒子避让回弹（bencho particles）：深靛蓝渐变底上 720 颗点排成实心圆，每颗点按它在圆里的角度取彩虹色（绕一圈 24 档色相）；指针 0.3 秒从右侧进入，0.73 秒进到画布内，在圆上来回划，
  // 手周围 80 px（原作像素）内的点被推开（force 60），手离开后弹簧拉回原位，运动中的点沿速度方向拉长；
  // 2.8 秒按下，按点周围 200 px 内的点被冲击波甩出，随后按角度配对、绕中心扫进下一个形状——圆角方块；指针再划一笔，4.55 秒移出画布；
  // 5.4 秒复位：各点按同样的配对扫回圆形，5.9–6.3 秒收拢到原位。点的颜色跟着点走，换形按角度配对，所以方块上彩虹依旧连贯。
  const PT_N = 720, PT_W = 480, PT_H = 400, PT_S = 0.5;     // 原作画布 480×400，720 颗点；显示缩小到 0.5
  const PT_X = (CW - PT_W * PT_S) / 2, PT_Y = (CH - PT_H * PT_S) / 2;
  const PT_REACH = 80, PT_FORCE = 60, PT_R = 1.9, PT_FPS = 60, PT_PRESS = 2.8;
  const PT_KEYS = [[0, 600, 122], [0.3, 548, 120], [0.75, 380, 92], [1.15, 300, 70], [1.55, 236, 126], [1.95, 262, 64], [2.35, 318, 112],
    [2.65, 276, 102], [2.8, 276, 102], [2.95, 276, 102], [3.45, 330, 56], [3.95, 222, 148], [4.35, 330, 150], [4.75, 470, 176], [5.0, 600, 190]];
  // 原作 outline()：圆半径 150；圆角方块 280×280、圆角 36（圆角用 arcTo 画）
  function PT_outline(s) {
    const p = new Path2D(), cx = PT_W / 2, cy = PT_H / 2;
    if (s === 'Circle') p.arc(cx, cy, 150, 0, TAU);
    else {
      const x = cx - 140, y = cy - 140, w = 280, r = 36;
      p.moveTo(x + r, y); p.arcTo(x + w, y, x + w, y + w, r); p.arcTo(x + w, y + w, x, y + w, r); p.arcTo(x, y + w, x, y, r); p.arcTo(x, y, x + w, y, r); p.closePath();
    }
    return p;
  }
  // 原作 homes()：按形状面积 / N 定六角网格间距，取形状内的格点，再均匀抽取或重复到正好 N 个；同时备好按角度排序的下标
  const PT_HOME = {};
  function PT_homes(s) {
    if (PT_HOME[s]) return PT_HOME[s];
    const c = document.createElement('canvas'); c.width = PT_W; c.height = PT_H;
    const g = c.getContext('2d'), path = PT_outline(s);
    let area = 0;
    for (let y = 1; y < PT_H; y += 2) for (let x = 1; x < PT_W; x += 2) if (g.isPointInPath(path, x, y)) area += 4;
    const sp = Math.sqrt(area / PT_N * (2 / Math.sqrt(3))), rowH = sp * Math.sqrt(3) / 2, pts = [];
    for (let y = rowH / 2, row = 0; y < PT_H; y += rowH, row++)
      for (let x = sp / 2 + (row % 2) * sp / 2; x < PT_W; x += sp) if (g.isPointInPath(path, x, y)) pts.push([x, y]);
    const hx = new Float64Array(PT_N), hy = new Float64Array(PT_N);
    for (let i = 0; i < PT_N; i++) { const q = pts[Math.floor(i * pts.length / PT_N)]; hx[i] = q[0]; hy[i] = q[1]; }
    const order = PT_byAngle(hx, hy);
    return (PT_HOME[s] = { hx, hy, order });
  }
  const PT_byAngle = (xs, ys) => Array.from(xs, (x, i) => [Math.atan2(ys[i] - PT_H / 2, x - PT_W / 2), i]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
  // 换形：把各点按当前位置绕中心的角度排序，与新形状按角度排序的家一一配对（原作 become）
  function PT_become(st, s) {
    const H = PT_homes(s), a = PT_byAngle(st.x, st.y);
    a.forEach((di, j) => { st.hx[di] = H.hx[H.order[j]]; st.hy[di] = H.hy[H.order[j]]; });
  }
  // 指针（原作像素）；只在画布范围内才算"在场"（原作 pointerleave 后 hand = null）
  function PT_hand(t) {
    const p = BN_path(t, PT_KEYS), x = (p[0] - PT_X) / PT_S, y = (p[1] - PT_Y) / PT_S;
    return x >= 0 && x <= PT_W && y >= 0 && y <= PT_H ? [x, y] : null;
  }
  const PT_arr = () => ({ x: new Float64Array(PT_N), y: new Float64Array(PT_N), vx: new Float64Array(PT_N), vy: new Float64Array(PT_N), hx: new Float64Array(PT_N), hy: new Float64Array(PT_N), busy: false });
  const PT_copy = (a, b) => { for (const key of ['x', 'y', 'vx', 'vy', 'hx', 'hy']) b[key].set(a[key]); b.busy = a.busy; return b; };
  // 原作按 60 Hz 逐帧更新：从第 f 帧推进 dt（≤ 1 帧）
  function PT_step(st, f, dt) {
    const t = f / PT_FPS, R = PT_REACH, S = PT_FORCE / 100 * 11;
    if (f === Math.round(PT_PRESS * PT_FPS)) {
      // 冲击波：200 px 内的点按 (1 - d/200)·30·K 获得向外速度，然后换成下一个形状
      const p = PT_hand(PT_PRESS), K = 0.4 + PT_FORCE / 100 * 1.2;
      if (p) for (let i = 0; i < PT_N; i++) {
        const dx = st.x[i] - p[0], dy = st.y[i] - p[1], dd = Math.hypot(dx, dy);
        if (dd > 200 || dd < 0.01) continue;
        const g = (1 - dd / 200) * 30 * K; st.vx[i] += dx / dd * g; st.vy[i] += dy / dd * g;
      }
      PT_become(st, 'Square'); st.busy = true;
    }
    if (f === Math.round(SHOW * PT_FPS)) { PT_become(st, 'Circle'); st.busy = true; }
    const h = PT_hand(t);
    if (!h && !st.busy) return;                                   // 全部静止且无手：这一帧什么都不变（原作停掉循环）
    let busy = !!h;
    const damp = Math.pow(0.84, dt);
    for (let i = 0; i < PT_N; i++) {
      let vx = st.vx[i], vy = st.vy[i];
      if (h) {
        const dx = st.x[i] - h[0], dy = st.y[i] - h[1], dd = Math.hypot(dx, dy);
        if (dd < R && dd > 0.01) { const g = (1 - dd / R) ** 2 * S; vx += dx / dd * g * dt; vy += dy / dd * g * dt; }
      }
      vx = (vx + (st.hx[i] - st.x[i]) * 0.05 * dt) * damp; vy = (vy + (st.hy[i] - st.y[i]) * 0.05 * dt) * damp;
      let x = st.x[i] + vx * dt, y = st.y[i] + vy * dt;
      if (Math.abs(st.hx[i] - x) < 0.05 && Math.abs(st.hy[i] - y) < 0.05 && Math.abs(vx) < 0.02 && Math.abs(vy) < 0.02) { x = st.hx[i]; y = st.hy[i]; vx = vy = 0; }
      else busy = true;
      st.x[i] = x; st.y[i] = y; st.vx[i] = vx; st.vy[i] = vy;
    }
    st.busy = busy;
  }
  // 状态只取决于 u：从 u = 0 的圆形逐帧推进到 u。每 24 帧的整帧状态是确定的，算过一次就缓存为检查点，之后从最近的检查点续算
  const PT_SNAP = [], PT_EVERY = 24, PT_WORK = PT_arr();
  function PT_sim(u) {
    if (!PT_SNAP.length) {
      const s0 = PT_arr(), C = PT_homes('Circle');
      s0.x.set(C.hx); s0.hx.set(C.hx); s0.y.set(C.hy); s0.hy.set(C.hy); PT_SNAP.push(s0);
    }
    const n = u * PT_FPS, whole = Math.floor(n), j = Math.floor(whole / PT_EVERY);
    while (PT_SNAP.length <= j) {
      const m = PT_SNAP.length, s = PT_copy(PT_SNAP[m - 1], PT_arr());
      for (let f = (m - 1) * PT_EVERY; f < m * PT_EVERY; f++) PT_step(s, f, 1);
      PT_SNAP.push(s);
    }
    const st = PT_copy(PT_SNAP[j], PT_WORK);
    for (let f = j * PT_EVERY; f < whole; f++) PT_step(st, f, 1);
    if (n > whole) PT_step(st, whole, n - whole);
    return st;
  }
  // 每颗点的色相取它在初始圆里绕中心的角度，分 24 档，同档的点合并成一条路径填充
  const PT_HUES = 24;
  let PT_BAND = null, PT_BG = null;
  function PT_bands() {
    if (PT_BAND) return PT_BAND;
    const C = PT_homes('Circle'), b = Array.from({ length: PT_HUES }, () => []);
    for (let i = 0; i < PT_N; i++) {
      const a = Math.atan2(C.hy[i] - PT_H / 2, C.hx[i] - PT_W / 2) / TAU + 0.5;
      b[Math.min(PT_HUES - 1, Math.floor(a * PT_HUES))].push(i);
    }
    return (PT_BAND = b);
  }
  CELLS[69] = (k, w, h, u) => {
    if (!PT_BG) { PT_BG = k.createLinearGradient(0, 0, CW, CH); PT_BG.addColorStop(0, '#1A1663'); PT_BG.addColorStop(1, '#0B0A33'); }
    k.fillStyle = PT_BG; k.fillRect(0, 0, CW, CH);
    const st = PT_sim(u), land = inOut3(seg(u, SHOW + 0.5, SHOW + 0.9)), r = PT_R;
    k.save(); k.translate(PT_X, PT_Y); k.scale(PT_S, PT_S);
    PT_bands().forEach((band, bi) => {
    k.fillStyle = `hsl(${Math.round(bi * 360 / PT_HUES + 200) % 360}, 92%, 64%)`; k.beginPath();
    for (const i of band) {
      // 复位段最后 0.4 秒把余下的弹簧位移收拢到家，保证首尾帧一致
      const x = mix(st.x[i], st.hx[i], land), y = mix(st.y[i], st.hy[i], land);
      const vx = st.vx[i] * (1 - land), vy = st.vy[i] * (1 - land), sp = Math.hypot(vx, vy);
      if (sp < 0.3) { k.moveTo(x + r, y); k.arc(x, y, r, 0, TAU); }
      else {
        // 运动中的点沿速度方向拉长、横向略变细（原作的"按速度拉伸"）
        const s = Math.min(2.6, 1 + sp * 0.12), rot = Math.atan2(vy, vx);
        k.moveTo(x + Math.cos(rot) * r * s, y + Math.sin(rot) * r * s); k.ellipse(x, y, r * s, r / Math.sqrt(s), rot, 0, TAU);
      }
    }
    k.fill();
    });
    k.restore();
    const p = BN_path(PT_PRESS, PT_KEYS);
    ripple(k, p[0], p[1], (u - PT_PRESS) / 0.6, '255,255,255');
    if (u > 0.2 && u < 5) { const c = BN_path(u, PT_KEYS); cursor(k, c[0], c[1], UXB_press(u, PT_PRESS)); }
  };

  // @element 71
  // 72 上下文用量条（bencho context-meter）：浅薄荷渐变底上一张深松绿卡片（原作深色卡片的配法），卡片里一条分段堆叠条（Chat 青 108.6K、Files 蓝 46.1K、Tools 紫 12.8K、System 琥珀 4.2K、Memory 玫红 3.9K，共 175.6K / 200K）；
  // 指针 0.3 秒进入，0.8 秒指向 System、1.88 秒指向 Files、2.74 秒滑到 Chat、3.55 秒移出条外，被指的段保持、其余淡到 0.22，大数字逐位滚到该段用量；
  // 4.0 秒点击 "Compact"：Chat 在 0.82 秒内缩到 30.4K，各段依次被压扁一下，总数滚到 97.4K，按钮变 "Undo"；指针 4.75 秒离开，5.4 秒起复原。
  const CM_KINDS = [['sys', 'System', 4.2, '#FFB020'], ['tools', 'Tools', 12.8, '#A06BFF'], ['files', 'Files', 46.1, '#4C8DFF'], ['chat', 'Chat', 108.6, '#22D3C5'], ['mem', 'Memory', 3.9, '#FF5C9A']];
  const CM_ORDER = [3, 2, 1, 0, 4];                                // 从大到小，压缩时也不重排
  const CM_COMPACT = 30.4, CM_WIN = 200, CM_CLICK = 4.0, CM_FOLD = 0.82, CM_GIVE_T = 0.76;
  const CM_X = 16, CM_Y = 6, CM_W = 507, CM_H = 196, CM_PAD = 16;   // 卡片（原作宽 309，这里放宽到画格宽度，纸片排成一行）
  const CM_BX = CM_X + CM_PAD, CM_BW = CM_W - CM_PAD * 2, CM_BY = 102, CM_BH = 40, CM_GAP = 3;
  const CM_INK = '#FFFFFF', CM_SLAB = '#0F3B37', CM_MINT = '#9FF0D2';    // 深色卡片：字为白，底为深松绿；Compact 用薄荷实心胶囊
  const CM_tint = p => UXB_mix(CM_SLAB, CM_INK, p);
  let CM_BG = null;
  const CM_EASE = UXA_bz(0.25, 0.1, 0.25, 1), CM_FOLDZ = UXA_bz(0.65, 0, 0.2, 1), CM_GIVEZ = UXA_bz(0.33, 0, 0.2, 1);
  const CM_POP = UXA_bz(0.34, 1.45, 0.64, 1), CM_CHIPZ = UXA_bz(0.34, 1.56, 0.64, 1), CM_ACTZ = UXA_bz(0.22, 1, 0.36, 1);
  const CM_KEYS = [[0, 572, 30], [0.3, 548, 44], [0.62, 436, 68], [0.95, 431, 122], [1.5, 431, 122], [1.72, 418, 84], [2.05, 338, 124], [2.6, 338, 124],
    [2.95, 172, 126], [3.4, 172, 126], [3.82, 470, 37], [4.22, 470, 37], [4.7, 580, 24]];
  // Chat 的 flex-grow：4.0 秒按 Compact 从 108.6 缓到 30.4，5.4 秒复原时缓回（CSS 820 ms 过渡）
  const CM_chat = u => u < SHOW ? mix(108.6, CM_COMPACT, CM_FOLDZ(seg(u, CM_CLICK, CM_CLICK + CM_FOLD))) : mix(CM_COMPACT, 108.6, CM_FOLDZ(seg(u, SHOW, SHOW + CM_FOLD)));
  const CM_compact = u => u >= CM_CLICK && u < SHOW;
  // 每段的 [左, 宽]（3 px 间隔，最小宽 3 px），最后一项是剩余空间
  function CM_segs(u) {
    const g = CM_ORDER.map(ci => (ci === 3 ? CM_chat(u) : CM_KINDS[ci][2]));
    g.push(CM_WIN - g.reduce((a, b) => a + b, 0));
    const free = CM_BW - CM_GAP * 5; let x = CM_BX;
    return g.map(v => { const w = Math.max(3, free * v / CM_WIN), r = [x, w]; x += w + CM_GAP; return r; });
  }
  // 悬停状态机：指针进入某段就点亮该类（剩余空间 → 无），在 3 px 缝里保持，离开整条 → 无
  let CM_TL = null;
  function CM_timeline() {
    if (CM_TL) return CM_TL;
    const hot = [[-1, -1]], text = [];
    let h = -1, inBar = false;
    for (let i = 0; i <= CYC * 240; i++) {
      const t = i / 240, p = BN_path(t, CM_KEYS), on = t > 0.2 && t < 4.75;
      const now = on && p[1] >= CM_BY && p[1] <= CM_BY + CM_BH && p[0] >= CM_BX && p[0] <= CM_BX + CM_BW;
      let nh = h;
      if (now) {
        CM_segs(t).forEach(([x, w], n) => { if (p[0] >= x && p[0] <= x + w) nh = n < 5 ? CM_ORDER[n] : -1; });
      } else if (inBar) nh = -1;
      inBar = now;
      if (nh !== h) { h = nh; hot.push([t, h]); }
    }
    // 大数字显示的字串：指着某类就是它的用量，否则是总用量
    const show = u => {
      let hh = -1; for (const [t, v] of hot) if (t <= u) hh = v;
      const c = CM_compact(u), size = ci => (ci === 3 && c ? CM_COMPACT : CM_KINDS[ci][2]);
      const v = hh >= 0 ? size(hh) : [0, 1, 2, 3, 4].reduce((a, ci) => a + size(ci), 0);
      return [v, hh];
    };
    const ts = [...hot.map(e => e[0]).filter(t => t >= 0), CM_CLICK, SHOW].sort((a, b) => a - b);
    let last = show(0)[0];
    text.push([-1, last.toFixed(1) + 'K', true]);
    for (const t of ts) { const v = show(t)[0]; if (v.toFixed(1) !== last.toFixed(1)) { text.push([t, v.toFixed(1) + 'K', v > last]); last = v; } }
    return (CM_TL = { hot, text, show });
  }
  // 原作 framer-motion 的数字滚动：改变的数字从下（变大）或上（变小）0.18em 处、2 px 模糊里浮出，0.5 秒带过冲落位，从左到右各晚 70 ms；旧数字 0.16 秒淡出
  function CM_figure(k, u, x0, base, TL) {
    const F = UXB_f(500, 30), em = 30, ls = -0.9;
    k.save(); k.font = F;
    const adv = c => (/[0-9]/.test(c) ? k.measureText('0').width : k.measureText(c).width) + ls;
    const lay = s => { const xs = []; let x = x0; for (const c of s) { xs.push(x); x += adv(c); } return [xs, x - x0]; };
    let ei = 0; for (let i = 0; i < TL.text.length; i++) if (TL.text[i][0] <= u) ei = i;
    const [t1, s1, up] = TL.text[ei], [xs1, w1] = lay(s1);
    const glyph = (c, x, dy, a, b) => {
      if (a <= 0.003) return;
      k.globalAlpha = clamp(a); if (b > 0.05) k.filter = `blur(${b.toFixed(2)}px)`;
      k.fillStyle = CM_INK; k.textAlign = 'left'; k.textBaseline = 'alphabetic'; k.fillText(c, x, base + dy);
      k.filter = 'none';
    };
    const inA = (place, s, te, upw, at) => {                   // 第 te 次变化时进来的数字，在 at 时刻的 [dy, alpha, blur]
      const i = s.length - 1 - place, e = CM_POP(seg(at, te + i * 0.07, te + i * 0.07 + 0.5));
      return [(upw ? 0.18 : -0.18) * em * (1 - e), e, 2 * (1 - e)];
    };
    // 某一位上一次换字的时刻（以位为键，从右数）
    const changedAt = (place, upto) => {
      for (let j = upto; j > 0; j--) {
        const a = TL.text[j - 1][1], b = TL.text[j][1], ca = a[a.length - 1 - place], cb = b[b.length - 1 - place];
        if (ca !== cb) return j;
      }
      return 0;
    };
    const L = Math.max(s1.length, ei > 0 ? TL.text[ei - 1][1].length : 0);
    for (let place = 0; place < L; place++) {
      const i = s1.length - 1 - place, c = i >= 0 ? s1[i] : null;
      const j = changedAt(place, ei);
      if (c !== null) {
        if (!/[0-9]/.test(c) || j === 0) glyph(c, xs1[i], 0, 1, 0);
        else { const [dy, a, b] = inA(place, TL.text[j][1], TL.text[j][0], TL.text[j][2], u); glyph(c, xs1[i], dy, a, b); }
      }
      if (j > 0) {                                               // 退场的旧字：停在旧位置，0.16 秒淡出加模糊
        const [, s0] = TL.text[j - 1], i0 = s0.length - 1 - place;
        if (i0 >= 0) {
          const c0 = s0[i0], [xs0] = lay(s0), f = seg(u, TL.text[j][0], TL.text[j][0] + 0.16);
          if (f < 1) {
            let a0 = 1, d0 = 0;
            if (/[0-9]/.test(c0)) { const k0 = changedAt(place, j - 1); if (k0 > 0) { const r = inA(place, s0, TL.text[k0][0], TL.text[k0][2], TL.text[j][0]); d0 = r[0]; a0 = r[1]; } }
            glyph(c0, xs0[i0], d0, a0 * (1 - out3(f)), 2 * out3(f));
          }
        }
      }
    }
    k.restore();
    return w1;
  }
  // CSS 关键帧 0% 1 → 38% give → 72% 1.03 → 100% 1，每段各用一次 cubic-bezier(0.33, 0, 0.2, 1)
  function CM_give(t, give) {
    const p = t / CM_GIVE_T;
    if (p <= 0 || p >= 1) return 1;
    if (p < 0.38) return mix(1, give, CM_GIVEZ(p / 0.38));
    if (p < 0.72) return mix(give, 1.03, CM_GIVEZ((p - 0.38) / 0.34));
    return mix(1.03, 1, CM_GIVEZ((p - 0.72) / 0.28));
  }
  CELLS[70] = (k, w, h, u) => {
    const TL = CM_timeline();
    if (!CM_BG) { CM_BG = k.createLinearGradient(0, 0, CW, CH); CM_BG.addColorStop(0, '#DDFBEF'); CM_BG.addColorStop(1, '#B8F0DB'); }
    k.fillStyle = CM_BG; k.fillRect(0, 0, CW, CH);
    k.save(); k.shadowColor = 'rgba(12,70,60,.28)'; k.shadowBlur = 14; k.shadowOffsetY = 4;
    k.fillStyle = CM_SLAB; rr(k, CM_X, CM_Y, CM_W, CM_H, 20); k.fill(); k.restore();
    const [, hh] = TL.show(u);
    // 头部：标题 + 按钮（Compact ↔ Undo；Undo 底色更淡、字色 64%，220 ms 过渡；按住时缩到 0.96）
    txt(k, 'Context', CM_BX, CM_Y + CM_PAD + 14, UXB_f(500, 16), CM_INK, 'left', 'middle');
    const quiet = UXB_ramp(u, [[0, 0], [CM_CLICK, 1], [SHOW, 0]], 0.22, CM_EASE);
    const lab = CM_compact(u) ? 'Undo' : 'Compact';
    k.save(); k.font = UXB_f(500, 13); const bw = k.measureText(lab).width + 24; k.restore();
    const bx = CM_BX + CM_BW - bw, by = CM_Y + CM_PAD, act = UXB_ramp(u, [[0, 1], [CM_CLICK - 0.08, 0.96], [CM_CLICK, 1]], 0.24, CM_ACTZ);
    k.save(); k.translate(bx + bw / 2, by + 14); k.scale(act, act);
    // 深色卡片上 Compact 是实心胶囊（薄荷底、深字），Undo 退成淡白洗底、64% 白字
    k.fillStyle = rgba(lerpC(UXB_rgb(CM_MINT), CM_tint(0.10), quiet), 1); rr(k, -bw / 2, -14, bw, 28, 14); k.fill();
    txt(k, lab, 0, 0.5, UXB_f(500, 13), rgba(lerpC(UXB_rgb(CM_SLAB), CM_tint(0.64), quiet), 1), 'center', 'middle');
    k.restore();
    // 大数字与旁注（指着某类时旁注换成类名）
    const base = 86, nw = CM_figure(k, u, CM_BX, base, TL);
    txt(k, hh >= 0 ? CM_KINDS[hh][1] : `of ${CM_WIN}K`, CM_BX + nw + 6, base, UXB_f(400, 13), rgba(hh >= 0 ? UXB_rgb(CM_KINDS[hh][3]) : CM_tint(0.6), 1), 'left', 'alphabetic');
    // 堆叠条：两端圆角 6、拼缝圆角 2；被指的类保持，其余淡到 0.22（220 ms）；压缩时 Chat 压扁到 0.78、其余 0.93，依次晚 55 ms
    const segs = CM_segs(u), dimEv = id => TL.hot.map(([t, v]) => [t, v >= 0 && v !== id ? 0.22 : 1]);
    const dimRoom = TL.hot.map(([t, v]) => [t, v >= 0 ? 0.22 : 1]);
    const wave = u < SHOW ? u - CM_CLICK : u - SHOW;
    segs.forEach(([x, sw], n) => {
      const room = n === 5, ci = room ? -1 : CM_ORDER[n];
      const a = UXB_ramp(u, room ? dimRoom : dimEv(ci), 0.22, CM_EASE);
      const sy = room ? 1 : CM_give(wave - n * 0.055, ci === 3 ? 0.78 : 0.93), hh2 = CM_BH * sy;
      const rl = n === 0 ? 6 : 2, rrr = room ? 6 : 2, y = CM_BY + (CM_BH - hh2) / 2;
      k.globalAlpha = a; k.fillStyle = room ? rgba(CM_tint(0.12), 1) : CM_KINDS[ci][3];
      k.beginPath(); k.roundRect(x, y, sw, hh2, [rl, rrr, rrr, rl]); k.fill();
      k.globalAlpha = 1;
    });
    // 类别纸片：被指的那一片底色加深、缩到 0.975
    let cx = CM_BX;
    const cy = CM_BY + CM_BH + 12;
    for (const ci of CM_ORDER) {
      const [id, name, , col] = CM_KINDS[ci];
      k.save(); k.font = UXB_f(400, 13); const cw = k.measureText(name).width + 40; k.restore();
      const onEv = TL.hot.map(([t, v]) => [t, v === ci ? 1 : 0]);
      const bg = UXB_ramp(u, onEv, 0.16, CM_EASE), sc = UXB_ramp(u, onEv.map(([t, v]) => [t, v ? 0.975 : 1]), 0.26, CM_CHIPZ);
      k.save(); k.translate(cx + cw / 2, cy + 16); k.scale(sc, sc);
      k.fillStyle = rgba(CM_tint(mix(0.09, 0.18, bg)), 1); rr(k, -cw / 2, -16, cw, 32, 16); k.fill();
      k.fillStyle = col; rr(k, -cw / 2 + 12, -4, 8, 8, 2); k.fill();
      txt(k, name, -cw / 2 + 28, 0.5, UXB_f(400, 13), CM_INK, 'left', 'middle');
      k.restore();
      cx += cw + 6;
      void id;
    }
    ripple(k, 470, 37, (u - CM_CLICK) / 0.6, '255,255,255');
    if (u > 0.2 && u < 4.75) { const p = BN_path(u, CM_KEYS); cursor(k, p[0], p[1], UXB_press(u, CM_CLICK)); }
  };

  // @element 72
  // 73 堆叠柱状图悬停（bencho stacked-bars）：卡片左侧是 Traffic、Last 20 days 和 24,182 visits，右侧 20 根四色堆叠柱（间距 6 px），基线下方是红色 Bounced 短柱；
  // 深靛蓝渐变底上一张深色卡片，四个来源用紫、天蓝、薄荷绿、琥珀，Bounced 用珊瑚红；0.15 秒起柱子从基线依次长出（每根晚 14 毫秒，0.6 秒长成）；指针 1.1 秒进入图表从左往右扫，所在那天的柱被圆角框圈住、其余柱融进卡片底色退后，提示框贴在柱旁按弹簧滑动（右侧放不下时换到左侧）；
  // 约 4.3 秒指针从右侧移出，圈框和提示框 0.16 秒淡出，柱色恢复；复位段 5.4–6.0 秒柱子缩回基线。
  // 原作 makeBars('Day', 20) 种子 4396 生成的数据（9 月 22 日 – 10 月 11 日）：[Direct, Search, Social, Email, Bounced]
  const SB_DATA = [
    [350, 378, 144, 238, 8], [526, 389, 126, 334, 8], [508, 270, 256, 179, 6], [686, 423, 263, 304, 6], [561, 322, 151, 406, 5],
    [195, 178, 115, 131, 6], [703, 321, 236, 187, 9], [376, 322, 202, 331, 4], [584, 502, 163, 200, 11], [573, 277, 195, 326, 7],
    [321, 270, 188, 337, 8], [340, 187, 115, 184, 6], [211, 141, 145, 149, 4], [647, 455, 131, 157, 6], [462, 384, 257, 311, 8],
    [710, 323, 249, 335, 12], [416, 316, 172, 163, 11], [726, 386, 271, 291, 11], [267, 187, 156, 192, 3], [231, 243, 112, 113, 5],
  ];
  const SB_CATS = ['Direct', 'Search', 'Social', 'Email'];
  const SB_COL = ['#a78bfa', '#38bdf8', '#34d399', '#fbbf24'].map(UXB_rgb), SB_ALERT = UXB_rgb('#ff6b6b');
  const SB_INK = '#f4f6ff', SB_CARD = UXB_rgb('#161c33'), SB_MUTE = 'rgba(214,222,255,.62)', SB_SOFT = 'rgba(226,232,255,.82)';
  const SB_FAINT = 'rgba(214,222,255,.45)', SB_EDGE = 'rgba(255,255,255,.12)';
  // 卡片与图表区（原作 CH 104 基线上方、BH 22 基线下方、柱段间 2 px、基线两侧留 2 px、提示框宽 132）
  const SB_X = 14, SB_Y = 12, SB_W = 511, SB_H = 184;
  const SB_PL = 190, SB_PT = 28, SB_PW = 319, SB_CH = 104, SB_BH = 22, SB_SEG = 2, SB_LIFT = 2, SB_TIPW = 132, SB_TIPH = 96;
  const SB_N = SB_DATA.length, SB_GAP = Math.max(1, Math.min(6, (SB_PW - 3 * SB_N) / (SB_N - 1)));
  const SB_BW = (SB_PW - SB_GAP * (SB_N - 1)) / SB_N, SB_R = Math.min(2.5, SB_BW / 2);
  const SB_GROW = 0.15, SB_GDUR = 0.6, SB_STAG = 0.014, SB_FADE = 0.16;
  const SB_KEYS = [[0, 120, 250], [0.3, 120, 250], [1.1, 200, 128], [1.55, 250, 126], [1.85, 250, 126], [2.55, 352, 128], [2.85, 352, 128],
    [3.55, 446, 129], [3.85, 446, 129], [4.25, 500, 128], [4.7, 575, 172]];
  const SB_ezGrow = UXA_bz(0.22, 1, 0.36, 1), SB_ezCss = UXA_bz(0.25, 0.1, 0.25, 1);
  const SB_fmt = v => Math.round(v).toLocaleString('en-US');
  const SB_day = i => (i < 9 ? `Sep ${22 + i}` : `Oct ${i - 8}`);
  // 每根柱各段的 [底, 高]（以基线上方 LIFT 处为 0）、柱顶、Bounced 柱高
  const SB_LAY = (() => {
    const tot = SB_DATA.map(d => d[0] + d[1] + d[2] + d[3]), maxT = Math.max(...tot), maxE = Math.max(...SB_DATA.map(d => d[4]));
    const sc = (SB_CH - SB_LIFT - 2 - SB_SEG * 3) / maxT;
    return SB_DATA.map((d, i) => {
      let y = 0; const segs = [];
      for (let c = 0; c < 4; c++) { const h = Math.max(2, d[c] * sc); segs.push([y, h]); y += h + SB_SEG; }
      return { segs, top: y - SB_SEG, esc: Math.max(3, d[4] / maxE * (SB_BH - SB_LIFT - 2)), tot: tot[i] };
    });
  })();
  const SB_TOTAL = SB_LAY.reduce((s, l) => s + l.tot, 0);
  // 指针所在的柱（-1 = 不在图表上）；原作 pick()：floor(相对 x / 宽 × n)
  const SB_at = u => {
    const [x, y] = BN_path(u, SB_KEYS);
    if (x < SB_PL || x >= SB_PL + SB_PW || y < SB_PT || y > SB_PT + SB_CH + 1 + SB_BH) return -1;
    return clamp(Math.floor((x - SB_PL) / SB_PW * SB_N), 0, SB_N - 1);
  };
  // 圈框与提示框的目标位置（图表坐标）：提示框优先放柱右侧，放不下且左侧放得下就放左侧
  const SB_tgt = i => {
    const L = SB_LAY[i], left = i * (SB_BW + SB_GAP), right = left + SB_BW + 8;
    const tx = right + SB_TIPW <= SB_PW || left - 8 - SB_TIPW < 0 ? Math.min(SB_PW - SB_TIPW, right) : left - 8 - SB_TIPW;
    return [left - 3, SB_CH - SB_LIFT - L.top - 3, L.top + SB_LIFT + 1 + SB_LIFT + L.esc + 6, tx];
  };
  // framer 弹簧 stiffness 380、damping 34 的阶跃响应（线性系统：多次改目标 = 各次阶跃叠加，初速度自然连续）
  const SB_W0 = Math.sqrt(380), SB_ZT = 34 / (2 * SB_W0), SB_WD = SB_W0 * Math.sqrt(1 - SB_ZT * SB_ZT);
  const SB_spring = t => (t <= 0 ? 0 : 1 - Math.exp(-SB_ZT * SB_W0 * t) * (Math.cos(SB_WD * t) + SB_ZT * SB_W0 / SB_WD * Math.sin(SB_WD * t)));
  let SB_TAB = null;
  function SB_tab() {
    if (SB_TAB) return SB_TAB;
    const ch = UXB_changes(SB_at), on = ch.filter(c => c[1] >= 0);
    // 每根柱的「退后」程度事件：有悬停且不是自己 → 1
    const dim = [];
    for (let i = 0; i < SB_N; i++) dim.push(ch.map(([t, v]) => [t, v >= 0 && v !== i ? 1 : 0]));
    SB_TAB = { ch, dim, vis: ch.map(([t, v]) => [t, v >= 0 ? 1 : 0]), first: on[0], moves: on.slice(1) };
    return SB_TAB;
  }
  function SB_text(k, s, x, y, size, w, col, al = 'left') { txt(k, s, x, y, UXB_f(w, size), col, al); }
  CELLS[71] = (k, w, h, u) => {
    const bg = k.createLinearGradient(0, 0, CW, CH); bg.addColorStop(0, '#3b2a8f'); bg.addColorStop(1, '#0f4c81');
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    k.save(); k.shadowColor = 'rgba(8,10,40,.45)'; k.shadowBlur = 18; k.shadowOffsetY = 6;
    k.fillStyle = rgba(SB_CARD, 1); rr(k, SB_X, SB_Y, SB_W, SB_H, 20); k.fill(); k.restore();
    k.strokeStyle = SB_EDGE; k.lineWidth = 1; rr(k, SB_X + 0.5, SB_Y + 0.5, SB_W - 1, SB_H - 1, 20); k.stroke();
    const T = SB_tab();
    // 左栏：标题、副标题、总数、Day / Week 切换（Day 选中）
    SB_text(k, 'Traffic', 30, 41, 14, 500, SB_INK);
    SB_text(k, `Last ${SB_N} days`, 30, 58, 12, 400, SB_MUTE);
    k.font = UXB_f(500, 30); const nw = k.measureText(SB_fmt(SB_TOTAL)).width;
    SB_text(k, SB_fmt(SB_TOTAL), 30, 112, 30, 500, SB_INK);
    SB_text(k, 'visits', 30 + nw + 8, 112, 13, 400, SB_MUTE);
    k.fillStyle = 'rgba(255,255,255,.08)'; rr(k, 30, 148, 108, 32, 10); k.fill();
    k.fillStyle = '#a78bfa'; rr(k, 32, 150, 52, 28, 8); k.fill();
    SB_text(k, 'Day', 58, 168, 12, 600, '#1b1340', 'center'); SB_text(k, 'Week', 112, 168, 12, 500, SB_MUTE, 'center');
    // 图表：基线、柱（依次长出，复位段缩回）
    const base = SB_PT + SB_CH;
    k.fillStyle = 'rgba(255,255,255,.18)'; k.fillRect(SB_PL, base, SB_PW, 1);
    const back = fadeIn(u);
    for (let i = 0; i < SB_N; i++) {
      const L = SB_LAY[i], x = SB_PL + i * (SB_BW + SB_GAP), g = SB_ezGrow(seg(u, SB_GROW + i * SB_STAG, SB_GROW + i * SB_STAG + SB_GDUR)) * back;
      if (g <= 0.002) continue;
      const dm = 0.62 * UXB_ramp(u, T.dim[i], SB_FADE, SB_ezCss);
      for (let c = 0; c < 4; c++) {
        const [b0, hh] = L.segs[c], y1 = base - SB_LIFT - b0 * g, y0 = y1 - hh * g;
        k.fillStyle = rgba(lerpC(SB_COL[c], SB_CARD, dm), 1); rr(k, x, y0, SB_BW, y1 - y0, SB_R); k.fill();
      }
      k.fillStyle = rgba(lerpC(SB_ALERT, SB_CARD, dm), 1); rr(k, x, base + 1 + SB_LIFT, SB_BW, L.esc * g, SB_R); k.fill();
    }
    SB_text(k, SB_day(0), SB_PL, 174, 11, 400, SB_FAINT);
    SB_text(k, SB_day(SB_N - 1), SB_PL + SB_PW, 174, 11, 400, SB_FAINT, 'right');
    // 圈框和提示框：第一次出现时直接就位，之后每次换柱按弹簧滑向新位置
    const vis = UXB_ramp(u, T.vis, SB_FADE, SB_ezCss);
    if (vis > 0.002 && T.first) {
      const p = SB_tgt(T.first[1]).slice();
      let cur = T.first[1];
      for (const [t, v] of T.moves) {
        if (t > u) break;
        const a = SB_tgt(cur), b = SB_tgt(v), s = SB_spring(u - t);
        for (let j = 0; j < 4; j++) p[j] += (b[j] - a[j]) * s;
        cur = v;
      }
      let at = -1; for (const [t, v] of T.ch) { if (t > u) break; if (v >= 0) at = v; }
      k.save(); k.globalAlpha = vis;
      k.strokeStyle = 'rgba(255,255,255,.75)'; k.lineWidth = 1.5; rr(k, SB_PL + p[0] + 0.75, SB_PT + p[1] + 0.75, SB_BW + 4.5, p[2] - 1.5, SB_R + 2.25); k.stroke();
      const tx = SB_PL + p[3], ty = SB_PT, d = SB_DATA[at], L = SB_LAY[at];
      k.save(); k.shadowColor = 'rgba(4,6,24,.5)'; k.shadowBlur = 12; k.shadowOffsetY = 4;
      k.fillStyle = '#252d4f'; rr(k, tx, ty, SB_TIPW, SB_TIPH, 10); k.fill(); k.restore();
      k.strokeStyle = 'rgba(255,255,255,.16)'; k.lineWidth = 1; rr(k, tx + 0.5, ty + 0.5, SB_TIPW - 1, SB_TIPH - 1, 10); k.stroke();
      SB_text(k, SB_day(at), tx + 11, ty + 21, 12, 400, SB_MUTE);
      SB_text(k, SB_fmt(L.tot), tx + SB_TIPW - 11, ty + 21, 12, 500, SB_INK, 'right');
      const top2 = [0, 1, 2, 3].sort((a, b) => d[b] - d[a]).slice(0, 2);
      const rows = top2.map(c => [SB_COL[c], SB_CATS[c], SB_fmt(d[c])]).concat([[SB_ALERT, 'Bounced', String(d[4])]]);
      rows.forEach(([col, name, val], r) => {
        const ry = ty + 31 + r * 20;
        k.fillStyle = rgba(col, 1); rr(k, tx + 11, ry + 4, 8, 8, 2); k.fill();
        SB_text(k, name, tx + 25, ry + 12, 12, 400, SB_SOFT);
        SB_text(k, val, tx + SB_TIPW - 11, ry + 12, 12, 400, SB_INK, 'right');
      });
      k.restore();
    }
    if (u > 0.2 && u < 4.9) { const [px, py] = BN_path(u, SB_KEYS); cursor(k, px, py); }
  };

  // @element 73
  // 74 叠放提示展开（bencho toast-stack）：桃色到粉色的渐变底，3 条提示叠放，最新的在前，后两条各露出 14 px、每层缩小 5%，叠着时染成淡玫瑰色、内容隐藏；
  // 每条提示左边有一条按种类上色的边条和一个彩色图标块（红 = 失败、蓝 = 信息、绿 = 成功）；
  // 指针 0.3 秒从右侧进入，1.2 秒进入列表框，3 条提示按弹簧（stiffness 380、damping 34）展开成间距 10 px 的列表（圆角 20 px），内容 0.22 秒淡入；
  // 指针在中间那条的关闭按钮上停留时按钮 0.16 秒淡出一个淡玫瑰色圆底；3.8 秒离开列表框，提示收回叠放，4.4 秒后指针移出画面。
  const TS_W = 300, TS_H = 56, TS_N = 3, TS_PEEK = 14, TS_GAP = 10, TS_R = 20;
  const TS_LISTH = TS_N * TS_H + (TS_N - 1) * TS_GAP, TS_STACKH = TS_H + (TS_N - 1) * TS_PEEK;
  // 列表框 = 展开后列表的大小，居中；叠放和展开都以框的中线为准，所以展开时最前面那条也会下移
  const TS_FX = (CW - TS_W) / 2, TS_FY = (CH - TS_LISTH) / 2;
  const TS_FADE = 0.22;
  const TS_INK = '#2a1620', TS_MUTE = '#7a5a66', TS_WASH = UXB_rgb('#f8d3dc'), TS_CARD = UXB_rgb('#fffaf8');
  // 原作 POOL 的前 3 条：[种类, 标题, 正文, 按钮]，下标 0 在最前
  const TS_TOASTS = [
    ['error', 'Payment declined', 'Try another card.', 'Retry'],
    ['info', 'Kai joined your bench', 'They can comment and copy.', ''],
    ['success', 'brand-kit.zip uploaded', 'Saved to Launch week.', ''],
  ];
  const TS_ICOL = { success: '#16a34a', error: '#e5484d', info: '#3b82f6' };
  const TS_KEYS = [[0, 600, 196], [0.3, 572, 186], [1.2, TS_FX + TS_W, 128], [1.75, 318, 106], [2.35, 318, 106],
    [2.8, TS_FX + TS_W - 27, 104], [3.3, TS_FX + TS_W - 27, 104], [3.8, TS_FX + TS_W, 150], [4.45, 590, 200]];
  // 第 k 条（0 = 最前）在框内的 y 与缩放：叠放时每往后一条高 peek、小 5%，从顶边居中缩放
  const TS_place = (k, open) => (open
    ? [(TS_LISTH - TS_LISTH) / 2 + (TS_N - 1 - k) * (TS_H + TS_GAP), 1]
    : [(TS_LISTH - TS_STACKH) / 2 + (TS_N - 1 - k) * TS_PEEK, 1 - k * 0.05]);
  const TS_inFrame = u => { const [x, y] = BN_path(u, TS_KEYS); return x >= TS_FX && x < TS_FX + TS_W && y >= TS_FY && y < TS_FY + TS_LISTH ? 1 : 0; };
  // 第 i 条此刻的 y 与缩放（op 为开合程度）
  const TS_geo = (i, op) => { const [y0, s0] = TS_place(i, false), [y1, s1] = TS_place(i, true); return [TS_FY + mix(y0, y1, op), mix(s0, s1, op)]; };
  // framer 弹簧 stiffness 380、damping 34、mass 1 的阶跃响应
  const TS_W0 = Math.sqrt(380), TS_ZT = 34 / (2 * TS_W0), TS_WD = TS_W0 * Math.sqrt(1 - TS_ZT * TS_ZT);
  const TS_spring = t => (t <= 0 ? 0 : 1 - Math.exp(-TS_ZT * TS_W0 * t) * (Math.cos(TS_WD * t) + TS_ZT * TS_W0 / TS_WD * Math.sin(TS_WD * t)));
  let TS_TAB = null;
  function TS_tab() {
    if (TS_TAB) return TS_TAB;
    const ch = UXB_changes(TS_inFrame);
    TS_TAB = { ch, ons: ch.slice(1) };
    // 每条关闭按钮的悬停事件（指针换算到该条的局部坐标后落在 14 px 半径内）
    TS_TAB.hov = TS_TOASTS.map((_, i) => UXB_changes(u => { if (u <= 0.2 || u >= 4.6) return 0;
      const [px, py] = BN_path(u, TS_KEYS), [y, s] = TS_geo(i, TS_open(u)), lx = (px - TS_FX - TS_W / 2) / s + TS_W / 2, ly = (py - y) / s;
      return Math.hypot(lx - (TS_W - 12 - 14), ly - TS_H / 2) < 14 ? 1 : 0; }));
    return TS_TAB;
  }
  // 开合程度：线性弹簧，每次切换是一次阶跃，叠加即得连续的位置（中途反向时速度也连续）
  const TS_open = u => { let v = 0; for (const [t, s] of TS_tab().ons) v += (s ? 1 : -1) * TS_spring(u - t); return v; };
  // 图标块：30 px 圆角方块填种类色，里面是白色符号
  function TS_icon(k, kind, x, y) {
    k.fillStyle = TS_ICOL[kind]; rr(k, x - 15, y - 15, 30, 30, 9); k.fill();
    k.strokeStyle = '#ffffff'; k.lineWidth = 2.2; k.lineCap = 'round'; k.lineJoin = 'round'; k.beginPath();
    if (kind === 'error') { k.moveTo(x - 2.5, y - 2.5); k.lineTo(x + 2.5, y + 2.5); k.moveTo(x + 2.5, y - 2.5); k.lineTo(x - 2.5, y + 2.5); }
    else if (kind === 'success') { k.moveTo(x - 3, y); k.lineTo(x - 0.8, y + 2.3); k.lineTo(x + 3.2, y - 2); }
    else { k.moveTo(x, y + 3.2); k.lineTo(x, y - 0.2); k.moveTo(x, y - 3.2); k.lineTo(x + 0.01, y - 3.2); }
    k.stroke();
  }
  CELLS[72] = (k, w, h, u) => {
    const bg = k.createLinearGradient(0, 0, CW, CH); bg.addColorStop(0, '#ffc9a8'); bg.addColorStop(1, '#ff9ec4');
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    const T = TS_tab(), op = TS_open(u), show = UXB_ramp(u, T.ch, TS_FADE, UXA_bz(0.25, 0.1, 0.25, 1));
    const [px, py] = BN_path(u, TS_KEYS);
    for (let i = TS_N - 1; i >= 0; i--) {
      const [y, s] = TS_geo(i, op);
      const front = i === 0, tuck = front ? 0 : 1 - show, [kind, title, body, act] = TS_TOASTS[i];
      k.save(); k.translate(TS_FX + TS_W / 2, y); k.scale(s, s); k.translate(-TS_W / 2, 0);
      // 叠放时后面两条染成淡玫瑰色，展开后变回奶白；投影用同色系的深玫瑰
      k.save(); k.shadowColor = 'rgba(150,40,80,.22)'; k.shadowBlur = 14; k.shadowOffsetY = 4;
      k.fillStyle = rgba(lerpC(TS_CARD, TS_WASH, tuck), 1); rr(k, 0, 0, TS_W, TS_H, TS_R); k.fill(); k.restore();
      // 左边条：5 px 宽，种类色，叠着时随内容一起淡掉
      k.save(); rr(k, 0, 0, TS_W, TS_H, TS_R); k.clip(); k.globalAlpha = front ? 1 : show;
      k.fillStyle = TS_ICOL[kind]; k.fillRect(0, 0, 5, TS_H); k.restore();
      const ca = front ? 1 : show;
      if (ca > 0.01) {
        k.globalAlpha = ca;
        TS_icon(k, kind, 16 + 15, TS_H / 2);
        const tx = 16 + 30 + 12, xr = TS_W - 12 - 28;
        let right = xr - 12;
        if (act) {
          k.font = UXB_f(500, 13); const bw = k.measureText(act).width + 24; right = xr - 12 - bw;
          k.fillStyle = 'rgba(229,72,77,.14)'; rr(k, right, TS_H / 2 - 14, bw, 28, 14); k.fill();
          txt(k, act, right + bw / 2, TS_H / 2 + 4.5, UXB_f(600, 13), '#c42f3a', 'center');
          right -= 12;
        }
        txt(k, title, tx, TS_H / 2 - 3, UXB_f(500, 14), TS_INK);
        txt(k, body, tx, TS_H / 2 + 15, UXB_f(400, 13), TS_MUTE);
        // 关闭按钮：指针在上面时出现浅灰圆底（160 毫秒）
        const cx = xr + 14, cy = TS_H / 2, hov = UXB_ramp(u, T.hov[i], 0.16, UXA_bz(0.25, 0.1, 0.25, 1));
        if (hov > 0.003) { k.fillStyle = `rgba(248,211,220,${hov})`; k.beginPath(); k.arc(cx, cy, 14, 0, TAU); k.fill(); }
        k.strokeStyle = rgba(UXB_mix(TS_MUTE, TS_INK, hov), 1); k.lineWidth = 2; k.lineCap = 'round';
        k.beginPath(); k.moveTo(cx - 4, cy - 4); k.lineTo(cx + 4, cy + 4); k.moveTo(cx + 4, cy - 4); k.lineTo(cx - 4, cy + 4); k.stroke();
        k.globalAlpha = 1;
      }
      k.restore();
    }
    if (u > 0.2 && u < 4.6) cursor(k, px, py);
  };

  // @element 74
  // 75 表情回应（bencho emoji-reactions）：天蓝渐变底上一条蓝色消息气泡 “Shipped the new onboarding flow”（白字），下面是淡紫的 🚀 3、淡橙的 🔥 2 两个回应和一个半透明白底的加表情按钮；
  // 指针 0.3 秒进入，1.0 秒点加表情按钮，消息条按快弹簧（0.22 秒）收成 216 px 宽的表情条，文字模糊淡出、6 个 Work 表情依次升起；
  // 1.55–2.55 秒指针划过表情条，指针下那个表情放大到 1.17 倍（magnify 50）并播放自己的小动作，上方深色标签写出名字；
  // 2.8 秒点中 🚀，表情条变回消息，🚀 沿弧线 0.6 秒飞到 🚀 回应上，3.4 秒落下、回应变成自己的（深蓝边、底色转成淡蓝），数字从 3 滚到 4；复位段 5.4–6.0 秒交叉淡回初始画面。
  const ER_SET = [['👍', 'Nice', 'nod'], ['🎉', 'Celebrate', 'confetti'], ['👀', 'Looking', 'glance'], ['✅', 'Done', 'tick'], ['🚀', 'Ship it', 'launch'], ['🔥', 'Fire', 'flicker']];
  const ER_EMO = 34, ER_PILLW = ER_EMO * ER_SET.length + 12, ER_MH = 48, ER_R = 20, ER_MAG = 1 + 50 / 100 * 0.34;
  const ER_X0 = 120, ER_MY = 56, ER_RY = ER_MY + ER_MH + 8, ER_CHIPH = 36;
  const ER_MSG = 'Shipped the new onboarding flow';
  const ER_OPEN = 1.0, ER_PICK = 2.8, ER_FLY = 0.6, ER_LAND = ER_PICK + ER_FLY, ER_PICKI = 4;
  const ER_INK = '#17181a', ER_SIG = '#1d3fd8', ER_BUB = '#2f6bff';
  // 两个回应各一种底色：🚀 淡紫、🔥 淡橙；变成自己的回应时底色转成淡蓝
  const ER_CHIP = [UXB_rgb('#e7defe'), UXB_rgb('#ffe2cc')], ER_MINE = UXB_rgb('#d6e4ff');
  // framer 的 { bounce, duration } 弹簧换算成阻尼比 ζ = 1 − bounce、包络在 duration 处衰减到千分之一的固有频率（近似 findSpring）
  const ER_mk = (bounce, dur) => { const z = 1 - bounce, w0 = 6.9 / (z * dur), wd = w0 * Math.sqrt(1 - z * z);
    return t => (t <= 0 ? 0 : 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + z * w0 / wd * Math.sin(wd * t))); };
  const ER_quick = ER_mk(45 / 100 * 0.45, 0.22);               // 消息条 ↔ 表情条、表情升起
  const ER_soft = UXA_bz(0.24, 1.34, 0.38, 1);                 // 表情放大、数字滚动、按钮放大的 CSS 过渡
  const ER_KEYS = [[0, 560, 210], [0.3, 520, 196], [0.8, 0, 130], [1.12, 0, 130], [1.55, 0, 80], [2.3, 0, 80], [2.55, 0, 82], [2.95, 0, 82], [3.6, 300, 176], [4.6, 590, 214]];
  let ER_G = null;
  // 一次算好的布局与事件表：回应宽度、加号位置、指针关键帧、悬停表情的切换时刻
  function ER_geo() {
    if (ER_G) return ER_G;
    const c = document.createElement('canvas').getContext('2d');
    c.font = UXB_f(400, 16); const textW = c.measureText(ER_MSG).width + 40;
    c.font = UXB_f(500, 14); const dw = c.measureText('0').width;
    const chipW = 12 + 22 + 8 + dw + 16, chips = [[ER_X0, '🚀', 3], [ER_X0 + chipW + 8, '🔥', 2]];
    const addX = ER_X0 + 2 * (chipW + 8) + 18, cy = ER_RY + ER_CHIPH / 2, ex = i => ER_X0 + 8 + i * ER_EMO + ER_EMO / 2;
    const keys = ER_KEYS.map(([t, x, y], j) => [t, j === 2 || j === 3 ? addX : j === 4 ? ex(0) : j === 5 ? ex(5) + 6 : j === 6 || j === 7 ? ex(ER_PICKI) : x, j === 2 || j === 3 ? cy : y]);
    // 指针下的表情：只在表情条打开时、指针落在条内才算，下标按原作 floor((x − 6) / 34)
    const on = u => {
      if (u < ER_OPEN || u >= ER_PICK) return -1;
      const [x, y] = BN_path(u, keys), lx = x - ER_X0;
      if (lx < 0 || lx > ER_PILLW || y < ER_MY || y > ER_MY + ER_MH) return -1;
      return clamp(Math.floor((lx - 6) / ER_EMO), 0, ER_SET.length - 1);
    };
    const ch = UXB_changes(on);
    const addOn = UXB_changes(u => { const [x, y] = BN_path(u, keys); return (u >= ER_OPEN && u < ER_PICK) || Math.hypot(x - addX, y - cy) < 18 ? 1 : 0; });
    ER_G = { textW, chipW, dw, chips, addX, cy, ex, keys, ch, addOn };
    return ER_G;
  }
  // CSS 关键帧：frames = [[偏移, 值…], …]，每段用 ez 缓动
  function ER_kf(p, frames, ez) {
    p = clamp(p);
    for (let i = 1; i < frames.length; i++) if (p <= frames[i][0]) {
      const a = frames[i - 1], b = frames[i], t = ez((p - a[0]) / (b[0] - a[0]));
      return a.slice(1).map((v, j) => mix(v, b[j + 1], t));
    }
    return frames[frames.length - 1].slice(1);
  }
  const ER_D = Math.PI / 180, ER_io = UXA_bz(0.42, 0, 0.58, 1), ER_eo = UXA_bz(0, 0, 0.58, 1);
  // 每个表情自己的动作，t = 开始后的秒数；返回 [dx, dy, 旋转, sx, sy, 原点 y]
  function ER_act(kind, t) {
    if (t < 0) return [0, 0, 0, 1, 1, 0];
    if (kind === 'launch') { const [x, y, r] = ER_kf(t / 0.64, [[0, 0, 0, 0], [0.3, 2, -7, -12], [0.6, -1, 1, 4], [1, 0, 0, 0]], UXA_bz(0.3, 1.2, 0.4, 1)); return [x, y, r * ER_D, 1, 1, 0]; }
    if (kind === 'flicker') { const [a, b] = ER_kf(t / 0.62, [[0, 1, 1], [0.15, 1.18, 1.1], [0.3, 0.94, 1.08], [0.48, 1.1, 0.96], [0.66, 0.98, 1.04], [1, 1, 1]], ER_eo); return [0, 0, 0, a, b, 0]; }
    if (kind === 'confetti') { const [s, r] = ER_kf(t / 0.42, [[0, 0.7, -12], [0.5, 1.18, 6], [1, 1, 0]], UXA_bz(0.3, 1.6, 0.4, 1)); return [0, 0, r * ER_D, s, s, 0]; }
    if (kind === 'glance') { const [x] = ER_kf(t / 0.7, [[0, 0], [0.25, -2.5], [0.6, 2.5], [1, 0]], ER_io); return [x, 0, 0, 1, 1, 0]; }
    if (kind === 'tick') { const [s, r] = ER_kf(t / 0.46, [[0, 0.6, -14], [0.55, 1.2, 4], [1, 1, 0]], UXA_bz(0.3, 1.6, 0.4, 1)); return [0, 0, r * ER_D, s, s, 0]; }
    const [r, y] = ER_kf(t / 0.52, [[0, 0, 0], [0.35, -16, -2], [1, 0, 0]], UXA_bz(0.3, 1.4, 0.4, 1)); return [0, y, r * ER_D, 1, 1, 8];
  }
  // 画一个表情：绕 (x, y + 原点) 先做动作再缩放 sc；t 为动作开始后的秒数
  function ER_emoji(k, e, kind, x, y, size, sc, t, al = 1) {
    if (al <= 0.003) return;
    const [dx, dy, r, sx, sy, oy] = ER_act(kind, t), o = Math.max(oy, size * 0.4);
    k.save(); k.globalAlpha *= al; k.translate(x + dx, y + dy + o); k.rotate(r); k.scale(sc * sx, sc * sy);
    txt(k, e, 0, -o, UXB_f(400, size), ER_INK, 'center', 'middle'); k.restore();
    if (t >= 0 && t < 0.56 && kind === 'confetti') {               // 礼花：6 个小方块按固定角度飞出
      const cols = ['#f5a524', '#e5484d', '#2f6bff', '#12a150', '#a855f7', '#f5a524'], p = UXA_bz(0.2, 0.8, 0.3, 1)(t / 0.56);
      for (let i = 0; i < 6; i++) { const a = (i * 60 + 15) * ER_D, d = 16 * p, s = 3 * (1 - 0.4 * p);
        k.globalAlpha = al * (1 - p); k.fillStyle = cols[i]; k.fillRect(x + Math.sin(a) * d - s / 2, y - Math.cos(a) * d - s / 2, s, s); }
      k.globalAlpha = 1;
    }
    if (t >= 0 && t < 0.52 && kind === 'launch') {                 // 火箭尾气：一小团灰烟向左下散开
      const p = ER_eo(t / 0.52), a = p < 0.25 ? p / 0.25 : 1 - (p - 0.25) / 0.75;
      k.fillStyle = `rgba(23,24,26,${0.2 * a * al})`; k.beginPath(); k.arc(x - size * 0.3 - 5 * p + 3.5, y + size * 0.2 + 6 * p + 3.5, 3.5 * (0.4 + 1.2 * p), 0, TAU); k.fill();
    }
  }
  // lucide SmilePlus（24 视图框）
  const ER_ICON = ['M22 11v1a10 10 0 1 1-9-10', 'M8 14s1.5 2 4 2 4-2 4-2', 'M9 9h.01', 'M15 9h.01', 'M16 5h6', 'M19 2v6'];
  let ER_P2 = null;
  function ER_draw(k, u) {
    const G = ER_geo();
    const bg = k.createLinearGradient(0, 0, CW * 0.4, CH * 1.3); bg.addColorStop(0, '#a5dcff'); bg.addColorStop(1, '#5aaef0');
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    // 打开程度：1.0 秒打开、2.8 秒关上，线性弹簧叠加
    const op = ER_quick(u - ER_OPEN) - ER_quick(u - ER_PICK);
    const mw = mix(G.textW, ER_PILLW, op), mr = mix(ER_R, 24, op);
    // 气泡：蓝色，投影用同色系的深蓝
    k.save(); k.shadowColor = 'rgba(20,60,160,.28)'; k.shadowBlur = 12; k.shadowOffsetY = 4;
    k.fillStyle = ER_BUB; rr(k, ER_X0, ER_MY, mw, ER_MH, mr); k.fill(); k.restore();
    // 消息文字：打开时 0.09 秒模糊淡出，关上时晚 0.08 秒、0.22 秒淡回
    const ta = u < ER_PICK + 0.08 ? 1 - ER_eo(seg(u, ER_OPEN, ER_OPEN + 0.09)) : ER_eo(seg(u, ER_PICK + 0.08, ER_PICK + 0.3));
    if (ta > 0.003) {
      const ts = 1 - 0.04 * (1 - ta); k.save(); k.translate(ER_X0 + mw / 2, ER_MY + ER_MH / 2); k.scale(ts, ts);
      k.font = UXB_f(500, 16); k.fillStyle = '#ffffff'; k.textAlign = 'center'; k.textBaseline = 'middle';
      UXA_blurText(k, ER_MSG, 0, 0, 4 * (1 - ta), ta); k.restore(); k.globalAlpha = 1;
    }
    // 表情条：依次升起（各晚 0.018 秒），关上时整条 0.16 秒淡出
    const pa = u < ER_OPEN ? 0 : u < ER_PICK ? 1 : 1 - seg(u, ER_PICK, ER_PICK + 0.16);
    let at = -1, since = 0; for (const [t, v] of G.ch) { if (t > u) break; if (v !== at) since = t; at = v; }
    if (pa > 0.003) {
      ER_SET.forEach(([e, , kind], i) => {
        const p = ER_quick(u - ER_OPEN - 0.02 - i * 0.018), a = clamp(p) * pa;
        const sw = UXB_ramp(u, G.ch.map(([t, v]) => [t, v === i ? ER_MAG : 1]), 0.22, ER_soft);
        ER_emoji(k, e, kind, G.ex(i), ER_MY + 24 + 8 * (1 - p), 20, (0.5 + 0.5 * p) * sw, at === i ? u - since : -1, a);
      });
      // 名字标签：深色小块，底边在条上方 10 px，0.16 秒淡入并上移 4 px
      const tl = UXB_ramp(u, G.ch.map(([t, v]) => [t, v >= 0 ? 1 : 0]), 0.16, ER_eo);
      let last = -1; for (const [t, v] of G.ch) { if (t > u) break; if (v >= 0) last = v; }
      if (tl > 0.003 && last >= 0) {
        k.font = UXB_f(400, 11); const lw = k.measureText(ER_SET[last][1]).width + 16, lx = G.ex(last) - lw / 2, ly = ER_MY - 10 - 22 + 4 * (1 - tl);
        k.save(); k.globalAlpha = tl * pa; k.fillStyle = ER_INK; rr(k, lx, ly, lw, 22, 6); k.fill();
        txt(k, ER_SET[last][1], lx + lw / 2, ly + 11.5, UXB_f(400, 11), '#ffffff', 'center', 'middle'); k.restore();
      }
    }
    // 回应：🚀 在 2.8 秒变成自己的（蓝边、蓝字），表情先藏起，3.4 秒落地后显现、播放发射动作，数字 3 → 4 滚动
    const mine = UXB_ramp(u, [[-1, 0], [ER_PICK, 1]], 0.16, ER_io);
    G.chips.forEach(([x, e, n], j) => {
      const own = j === 0 ? mine : 0;
      k.fillStyle = rgba(lerpC(ER_CHIP[j], ER_MINE, own), 1); rr(k, x, ER_RY, G.chipW, ER_CHIPH, 18); k.fill();
      if (own > 0.003) { k.strokeStyle = `rgba(29,63,216,${0.75 * own})`; k.lineWidth = 1.5; rr(k, x + 0.75, ER_RY + 0.75, G.chipW - 1.5, ER_CHIPH - 1.5, 17.25); k.stroke(); }
      const ea = j === 0 ? (u < ER_LAND ? 1 - seg(u, ER_PICK, ER_PICK + 0.16) : seg(u, ER_LAND, ER_LAND + 0.16)) : 1;
      ER_emoji(k, e, j === 0 ? 'launch' : 'flicker', x + 12 + 11, G.cy, 20, 1, j === 0 ? u - ER_LAND : -1, ea);
      const v = j === 0 ? UXB_ramp(u, [[-1, n], [ER_LAND, n + 1]], 0.22, ER_soft) : n, cx = x + 12 + 22 + 8, lh = 14 * 1.4;
      k.save(); k.beginPath(); k.rect(cx - 1, G.cy - lh / 2, G.dw + 2, lh); k.clip();
      const col = rgba(UXB_mix('#3a2a60', ER_SIG, own), 1);
      for (let d = Math.max(0, Math.floor(v) - 1); d <= Math.min(9, Math.ceil(v) + 1); d++) txt(k, String(d), cx, G.cy + (d - v) * lh + 0.5, UXB_f(500, 14), col, 'left', 'middle');
      k.restore();
    });
    // 加表情按钮：半透明白底蓝色图标，悬停或打开时底更亮、图标变深、放大到 1.06 倍
    const ab = UXB_ramp(u, G.addOn, 0.16, ER_soft);
    k.save(); k.translate(G.addX, G.cy); k.scale(1 + 0.06 * ab, 1 + 0.06 * ab);
    k.fillStyle = `rgba(255,255,255,${0.55 + 0.3 * ab})`; k.beginPath(); k.arc(0, 0, 18, 0, TAU); k.fill();
    if (!ER_P2) ER_P2 = ER_ICON.map(d => new Path2D(d));
    k.scale(0.75, 0.75); k.translate(-12, -12); k.strokeStyle = rgba(UXB_mix('#3b6fd6', '#1d3fd8', ab), 1);
    k.lineWidth = 2; k.lineCap = 'round'; k.lineJoin = 'round'; for (const p of ER_P2) k.stroke(p);
    k.restore();
    // 飞行：从点中的表情沿弧线到回应上的表情，最高点比两端高 46 px，0.6 秒，缩放 1.4 → 1.25 → 1，途中转 −14°
    if (u >= ER_PICK && u < ER_LAND) {
      const fx = G.ex(ER_PICKI), fy = ER_MY + 24, tx = G.chips[0][0] + 23, ty = G.cy;
      const [x, y, s, r] = ER_kf((u - ER_PICK) / ER_FLY, [[0, fx, fy, 1.4, 0], [0.45, (fx + tx) / 2, Math.min(fy, ty) - 46, 1.25, -14], [1, tx, ty, 1, 0]], UXA_bz(0.35, 0, 0.3, 1));
      k.save(); k.translate(x, y); k.rotate(r * ER_D); k.scale(s, s); txt(k, '🚀', 0, 0, UXB_f(400, 16), ER_INK, 'center', 'middle'); k.restore();
    }
    if (u > 0.2 && u < 4.9) {
      const [x, y] = BN_path(u, G.keys);
      for (const tc of [ER_OPEN, ER_PICK]) ripple(k, x, y, seg(u, tc, tc + 0.5));
      cursor(k, x, y, UXB_press(u, ER_OPEN) + UXB_press(u, ER_PICK));
    }
  }
  CELLS[73] = (k, w, h, u) => UXB_xfade(k, ER_draw, u, SHOW, SHOW + 0.6);

  // @element 75
  // 76 灵动岛展开（bencho dynamic-island）：橙到紫的手机壁纸渐变上（带两团柔光），中央是 150×36 的黑色胶囊，左边琥珀色计时图标、右边倒计时 4:59，每秒减一；
  // 指针 0.3 秒从右侧进入，1.2 秒按下胶囊，宽、高、圆角同一弹簧（bounce 40，略过冲）长成 300×76 的计时卡片，旧内容模糊缩小淡出、卡片内容（暂停圆钮、Timer、大号倒计时）淡入；
  // 3.8 秒再按一次，卡片按同一弹簧缩回胶囊，指针 4.6 秒离开；复位段 5.4–6.0 秒交叉淡回初始画面。
  const DI_C = [150, 36, 18], DI_O = [300, 76, 38], DI_T1 = 1.2, DI_T2 = 3.8, DI_AMB = '#e09a12';
  // framer 弹簧：stiffness 380、damping 34 − 0.4×16、mass 0.9 的阶跃响应（欠阻尼）
  const DI_step = (() => { const m = 0.9, s = 380, c = 34 - 0.4 * 16, w0 = Math.sqrt(s / m), z = c / (2 * Math.sqrt(s * m)), wd = w0 * Math.sqrt(1 - z * z);
    return t => (t <= 0 ? 0 : 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + z * w0 / wd * Math.sin(wd * t))); })();
  const DI_ez = UXA_bz(0.25, 0.1, 0.25, 1);
  const DI_KEYS = [[0, 560, 196], [0.3, 520, 184], [0.9, 318, 110], [1.32, 318, 110], [2.3, 372, 126], [3.68, 372, 126], [4.6, 580, 214]];
  let DI_P = null;
  const DI_paths = () => DI_P || (DI_P = {
    timer: ['M10 2h4', 'M12 14l3-3', 'M20 14a8 8 0 1 1-16 0a8 8 0 1 1 16 0'].map(d => new Path2D(d)),
    pause: ['M15 3h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z', 'M6 3h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z'].map(d => new Path2D(d)),
  });
  const DI_clock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  // 一层内容（收起或展开），a 为透明度进度：模糊 6 px、缩放 0.92 → 1，以胶囊中心为原点
  function DI_layer(k, open, a, cx, cy, w, h, left) {
    if (a <= 0.003) return;
    const P = DI_paths(), x0 = cx - w / 2, x1 = cx + w / 2, s = 0.92 + 0.08 * a, num = DI_clock(left);
    k.save(); k.globalAlpha = a; if (a < 0.999) k.filter = `blur(${(6 * (1 - a)).toFixed(2)}px)`;
    k.translate(cx, cy); k.scale(s, s); k.translate(-cx, -cy);
    if (!open) {
      k.save(); k.translate(x0 + 12, cy - 8); k.scale(16 / 24, 16 / 24);
      k.strokeStyle = DI_AMB; k.lineWidth = 2 * 24 / 16 * 0.67; k.lineCap = 'round'; k.lineJoin = 'round'; for (const p of P.timer) k.stroke(p); k.restore();
      txt(k, num, x1 - 12, cy + 0.5, UXB_f(500, 13), DI_AMB, 'right', 'middle');
    } else {
      const bx = x0 + 16 + 23;
      k.fillStyle = 'rgba(255,159,10,.24)'; k.beginPath(); k.arc(bx, cy, 23, 0, TAU); k.fill();
      k.save(); k.translate(bx - 9, cy - 9); k.scale(18 / 24, 18 / 24); k.fillStyle = DI_AMB; for (const p of P.pause) k.fill(p); k.restore();
      k.font = UXB_f(500, 30); k.letterSpacing = '-0.9px'; const bw = k.measureText(num).width;
      txt(k, num, x1 - 16, cy + 1, UXB_f(500, 30), DI_AMB, 'right', 'middle'); k.letterSpacing = '0px';
      txt(k, 'Timer', x1 - 16 - bw - 8, cy + 0.5, UXB_f(400, 12), 'rgba(255,255,255,.55)', 'right', 'middle');
    }
    k.restore();
  }
  function DI_draw(k, u) {
    // 壁纸：橙 → 品红 → 紫的斜向渐变，左下一团暖橙柔光、右上一团紫色柔光
    const bg = k.createLinearGradient(0, 0, CW, CH); bg.addColorStop(0, '#ff9a3c'); bg.addColorStop(0.5, '#f0508a'); bg.addColorStop(1, '#6b3fd4');
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    for (const [gx, gy, gr, gc] of [[90, 190, 170, '255,200,90'], [470, 10, 190, '120,70,255']]) {
      const rg = k.createRadialGradient(gx, gy, 0, gx, gy, gr); rg.addColorStop(0, `rgba(${gc},.55)`); rg.addColorStop(1, `rgba(${gc},0)`);
      k.fillStyle = rg; k.fillRect(0, 0, CW, CH);
    }
    // 尺寸：两次按下各起一个阶跃，叠加成同一条弹簧
    const g = DI_step(u - DI_T1) - DI_step(u - DI_T2);
    const w = mix(DI_C[0], DI_O[0], g), h = mix(DI_C[1], DI_O[1], g), r = Math.max(4, mix(DI_C[2], DI_O[2], g));
    const tap = 1 - 0.03 * (UXB_press(u, DI_T1) + UXB_press(u, DI_T2)), cx = CW / 2, cy = CH / 2;
    k.save(); k.translate(cx, cy); k.scale(tap, tap); k.translate(-cx, -cy);
    k.save(); k.shadowColor = 'rgba(40,10,60,.35)'; k.shadowBlur = 16; k.shadowOffsetY = 5;
    k.fillStyle = '#000'; rr(k, cx - w / 2, cy - h / 2, w, h, Math.min(r, h / 2)); k.fill(); k.restore();
    k.save(); rr(k, cx - w / 2, cy - h / 2, w, h, Math.min(r, h / 2)); k.clip();
    // 内容交叉淡换：旧的和新的都晚 0.06 秒、用 0.22 秒
    const left = 299 - Math.floor(u), f = t => DI_ez(seg(u, t + 0.06, t + 0.28));
    const openA = u < DI_T2 ? f(DI_T1) : 1 - f(DI_T2), shutA = u < DI_T2 ? 1 - f(DI_T1) : f(DI_T2);
    DI_layer(k, false, shutA, cx, cy, w, h, left);
    DI_layer(k, true, openA, cx, cy, w, h, left);
    k.restore(); k.restore();
    if (u > 0.2 && u < 4.9) {
      const [x, y] = BN_path(u, DI_KEYS);
      for (const tc of [DI_T1, DI_T2]) ripple(k, x, y, seg(u, tc, tc + 0.5));
      cursor(k, x, y, UXB_press(u, DI_T1) + UXB_press(u, DI_T2));
    }
  }
  CELLS[74] = (k, w, h, u) => UXB_xfade(k, DI_draw, u, SHOW, SHOW + 0.6);

  // @element 76
  // 80 待办砖塔（bencho todo-tower）：奶油黄渐变底上，粉、橙、绿、蓝、紫、黄 6 张糖果色待办卡片像砖一样叠成塔，按 slip 45 左右错开一点；指针 0.3 秒从右下进入，1.5 秒点中第 4 张（Export the icons）的勾选框，
  // 框用字色填满、打上卡片本色的勾、文字从左划线，0.09 秒后整张向右滑出、转 5° 并淡去；上面 3 张同一刻失去支撑一起下落约 0.19 秒补位，被抽走时蹭出一点横向偏移，落地轻轻弹两下；
  // 3.95 秒那张卡在右侧重新浮现，4.2 秒指针按住它往回推，上面的卡抬起让位、回到原位，4.6 秒卡片归位并取消勾选；指针 5.2 秒离开，之后静止到循环结束。
  const TT_S = 0.7, TT_CW = 206 * TT_S, TT_CH = 46 * TT_S, TT_N = 6, TT_SLIP = 0.45, TT_PICK = 3;
  const TT_X = CW / 2, TT_FLOOR = CH - 6;
  const TT_LEAN = [-0.42, 0.68, -0.15, 0.51, -0.86, 0.24];
  const TT_TODOS = ['Reply to Nadia', 'Renew the domain', 'Book the flights', 'Export the icons', 'Pay the invoice', 'Call the landlord'];
  // 6 种糖果色 [卡片底, 同色系深描边, 字色]：深色卡配白字，浅色卡配同色系深字
  const TT_CANDY = [['#E33A7A', '#B8245C', '#FFFFFF'], ['#FF8A3D', '#D9661C', '#4A1D04'], ['#2DBE84', '#1E9466', '#08372A'],
    ['#2F74E0', '#1F57B3', '#FFFFFF'], ['#8B5CF6', '#6B3FD6', '#FFFFFF'], ['#FFCC33', '#D9A000', '#4A3300']];
  const TT_G = (900 + 0.5 * 3300) * TT_S, TT_DEC = (0.85 - TT_SLIP * 0.65) * TT_G;   // 重力（gravity 50）与摩擦减速（slip 45）
  const TT_TF = Math.sqrt(2 * TT_CH / TT_G), TT_E = 0.32;                          // 落一张卡高的时间；轻弹的恢复系数
  const TT_KICK = [17, -29, 58];                                                  // 抽卡时蹭给上方卡片的横向速度（px/s，越近越大）
  const TT_OUT = 1.5, TT_BACK = 4.2, TT_IN0 = 4.3, TT_IN1 = 4.6, TT_SLIDE = 170;
  const TT_EASE = UXA_bz(0.22, 1, 0.36, 1);
  const TT_bx = i => TT_X + TT_LEAN[i] * TT_SLIP * 16 * TT_S;
  const TT_by = i => TT_FLOOR - TT_CH / 2 - (TT_N - 1 - i) * TT_CH;
  const TT_GX = TT_bx(TT_PICK) + TT_SLIDE + 36, TT_GY = TT_by(TT_PICK);           // 推回时指针在卡上的位置（滑出后的位置）
  const TT_CHECK = [TT_bx(TT_PICK) - TT_CW / 2 + 16 * TT_S + 9.5 * TT_S, TT_by(TT_PICK)];
  const TT_KA = [[0, 600, 236], [0.3, 540, 214], [1.3, TT_CHECK[0] + 2, TT_CHECK[1] + 2], [1.62, TT_CHECK[0] + 2, TT_CHECK[1] + 2],
    [2.4, 418, 156], [3.5, 446, 142], [4.08, TT_GX, TT_GY + 2], [4.2, TT_GX, TT_GY + 2]];
  const TT_KB = [[TT_IN1, TT_GX - TT_SLIDE, TT_GY + 2], [4.72, TT_GX - TT_SLIDE, TT_GY + 2], [5.2, 610, 238]];
  // 落地后的小弹跳：两次逐渐变小的抛物线
  const TT_hop = (tau, amp) => {
    let v = TT_E * TT_G * TT_TF * amp;
    for (let n = 0; n < 2; n++) {
      const d = 2 * v / TT_G;
      if (tau < d) return v * tau - TT_G * tau * tau / 2;
      tau -= d; v *= TT_E;
    }
    return 0;
  };
  // 被抽走那张上方的卡：自由下落时带着蹭出的横速，落地后按摩擦减速停下
  function TT_fallen(i, u) {
    const t = u - TT_OUT, v = TT_KICK[i];
    if (t <= 0) return [0, 0];
    if (t < TT_TF) return [v * t, TT_G * t * t / 2];
    const tau = t - TT_TF, ts = Math.min(tau, Math.abs(v) / TT_DEC);
    return [v * TT_TF + v * ts - Math.sign(v) * TT_DEC * ts * ts / 2, TT_CH - TT_hop(tau, 1 + 0.12 * (TT_PICK - 1 - i))];
  }
  function TT_card(k, i, x, y, rot, alpha, chk, strike) {
    if (alpha <= 0.002) return;
    const w = TT_CW, h = TT_CH, s = TT_S;
    k.save(); k.globalAlpha = alpha; k.translate(x, y); k.rotate(rot);
    const [fill, edge, ink] = TT_CANDY[i], on = UXB_rgb(ink);
    k.fillStyle = fill; rr(k, -w / 2, -h / 2, w, h, 10 * s); k.fill();
    k.strokeStyle = edge; k.lineWidth = 1; rr(k, -w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1, 10 * s - 0.5); k.stroke();
    const bs = 19 * s, bx = -w / 2 + 16 * s, by = -bs / 2;
    rr(k, bx, by, bs, bs, 6 * s);
    if (chk > 0) { k.fillStyle = rgba(on, chk); k.fill(); }                  // 勾上后框用卡片上的字色填满
    k.strokeStyle = rgba(on, mix(0.55, 1, chk)); k.lineWidth = 1.5 * s; rr(k, bx + 0.6, by + 0.6, bs - 1.2, bs - 1.2, 6 * s - 0.6); k.stroke();
    if (chk > 0) {                                                             // lucide Check，14 px、线宽 2，用卡片本色
      const q = 14 * s / 24, cx = bx + bs / 2 - 12 * q, cy = -12 * q;
      k.strokeStyle = rgba(UXB_rgb(fill), chk); k.lineWidth = 2 * q * 1.15; k.lineCap = 'round'; k.lineJoin = 'round';
      k.beginPath(); k.moveTo(cx + 4 * q, cy + 12 * q); k.lineTo(cx + 9 * q, cy + 17 * q); k.lineTo(cx + 20 * q, cy + 6 * q); k.stroke();
    }
    const tx = bx + bs + 12 * s, fs = 15.4 * s, ta = mix(1, 0.72, strike);
    txt(k, TT_TODOS[i], tx, 0.5, UXB_f(600, fs), rgba(on, ta), 'left', 'middle');
    if (strike > 0) {                                                          // 划线从左往右拉过文字
      k.font = UXB_f(600, fs); const tw = k.measureText(TT_TODOS[i]).width;
      k.fillStyle = rgba(on, ta); k.fillRect(tx, 0, tw * strike, Math.max(1.2, fs / 12));
    }
    k.restore();
  }
  CELLS[75] = (k, w, h, u) => {
    const bg = k.createLinearGradient(0, 0, 0, CH);                           // 奶油黄底，上浅下深
    bg.addColorStop(0, '#FFF6DA'); bg.addColorStop(1, '#FFE4A6'); k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    const sh = k.createRadialGradient(TT_X, TT_FLOOR + 2, 0, TT_X, TT_FLOOR + 2, 110);  // 塔脚下一片暖棕色的软影
    sh.addColorStop(0, 'rgba(150,90,10,0.22)'); sh.addColorStop(1, 'rgba(150,90,10,0)');
    k.save(); k.translate(0, TT_FLOOR + 2); k.scale(1, 0.08); k.translate(0, -(TT_FLOOR + 2)); k.fillStyle = sh; k.fillRect(TT_X - 110, TT_FLOOR - 108, 220, 220); k.restore();
    const lift = inOut3(seg(u, TT_BACK, TT_BACK + 0.2));                       // 推回时上方卡片抬起、回到原位
    for (let i = 0; i < TT_N; i++) {
      if (i === TT_PICK) continue;
      let x = TT_bx(i), y = TT_by(i);
      if (i < TT_PICK) { const f = TT_fallen(i, u); x += f[0] * (1 - lift); y += f[1] * (1 - lift); }
      TT_card(k, i, x, y, 0, 1, 0, 0);
    }
    // 抽出 / 放回的那张：勾选、划线，向右滑出转 5° 淡去；3.95 秒重新浮现，4.3–4.6 秒被推回原位
    let ox = 0, alpha = 1;
    if (u >= TT_OUT && u < TT_BACK) {
      ox = TT_SLIDE * TT_EASE(seg(u, TT_OUT + 0.09, TT_OUT + 0.31));
      alpha = u < 3.95 ? 1 - seg(u, TT_OUT + 0.15, TT_OUT + 0.37) : 0.92 * inOut3(seg(u, 3.95, 4.15));
    } else if (u >= TT_BACK && u < TT_IN1) {
      ox = TT_SLIDE * (1 - inOut3(seg(u, TT_IN0, TT_IN1)));
      alpha = mix(0.92, 1, seg(u, TT_IN0, TT_IN1));
    }
    const chk = u < TT_OUT ? 0 : u < TT_IN1 ? (seg(u, TT_OUT, TT_OUT + 0.16)) : 1 - seg(u, TT_IN1, TT_IN1 + 0.16);
    const strike = u < TT_IN1 ? out3(seg(u, TT_OUT + 0.02, TT_OUT + 0.2)) : 1 - seg(u, TT_IN1, TT_IN1 + 0.16);
    TT_card(k, TT_PICK, TT_bx(TT_PICK) + ox, TT_by(TT_PICK), ox / TT_SLIDE * 5 * Math.PI / 180, alpha, chk, strike);
    // 指针
    ripple(k, TT_CHECK[0], TT_CHECK[1], seg(u, TT_OUT, TT_OUT + 0.6), '255,255,255');
    if (u > 0.2 && u < 5.2) {
      let p, press;
      if (u < TT_BACK) { p = BN_path(u, TT_KA); press = UXB_press(u, TT_OUT) + seg(u, TT_BACK - 0.08, TT_BACK); }
      else if (u < TT_IN1) { p = [TT_GX - TT_SLIDE + ox, TT_GY + 2]; press = 1; }
      else { p = BN_path(u, TT_KB); press = 1 - seg(u, TT_IN1, TT_IN1 + 0.14); }
      cursor(k, p[0], p[1], press);
    }
  };

  // @element 77
  // 81 签名板（bencho signature）：青绿渐变底上一块 300×180 淡青色签名板，签名线下方写着 Sign here；指针从右下进入，0.8 秒落笔写一个带圈的大写字母（0.8–1.42 秒），再写一串连笔（1.62–2.58 秒），
  // 2.78 秒点一下，3.04–3.4 秒甩出一道下划线；笔走得快线就细、慢就粗（笔重 40，墨色深蓝）。首次落笔时提示淡出、右上角青绿色 Clear 弹出；
  // 3.6 秒点 Clear，墨迹从最后一点起逐点倒退擦掉（111 个点，约 0.67 秒），提示淡回，指针 4.7 秒离开；之后保持空白签名板，与 0 秒画面相同。
  const SG_W = 300, SG_H = 180, SG_X = 120, SG_Y = 14, SG_R = 20, SG_LINE = 128, SG_INSET = 28;
  const SG_PEN = 40, SG_THIN = 0.8 + SG_PEN / 100 * 2, SG_THICK = 2.2 + SG_PEN / 100 * 5;   // 原作 widths()：笔重 40 → 1.6 / 4.2 px
  const SG_K = 1 - 50 / 100 * 0.75;                     // 平滑 50：笔尖每次 pointermove 追手 62.5%
  const SG_EV = 1 / 60;                                 // pointermove 按 60 Hz 到达
  const SG_PER = 2 + (100 - 50) / 100 * 8;              // 倒退速度 50：每个点 6 ms
  const SG_CLICK = 3.6, SG_INK = '#1B2A6B', SG_TEAL = '#0C8378', SG_DEEP = '#0B5F57';
  const SG_CLR = { x: 236, y: 10, w: 54, h: 28 };       // Clear 按钮（板内坐标，right 10 / top 10）
  const SG_CSS = UXA_bz(0.25, 0.1, 0.25, 1), SG_POP = UXA_bz(0.24, 1.34, 0.38, 1);
  // Catmull-Rom 折线（板内坐标），s 0..1 按点均分
  const SG_cr = P => s => {
    const n = P.length - 1, f = clamp(s) * n, i = Math.min(n - 1, Math.floor(f)), t = f - i;
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n, i + 2)];
    const c = (a, b, c2, d) => 0.5 * (2 * b + (c2 - a) * t + (2 * a - 5 * b + 4 * c2 - d) * t * t + (3 * b - a - 3 * c2 + d) * t * t * t);
    return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])];
  };
  // 连笔：顶端打圈的波形（l 形圈），每个波的高度不同，基线微微上扬
  const SG_HUMP = [24, 40, 17, 32, 15];
  const SG_cursive = s => {
    const N = SG_HUMP.length, f = clamp(s) * N;
    const hc = q => { const a = Math.floor(q - 0.5), t = q - 0.5 - a, A = SG_HUMP[clamp(a, 0, N - 1)], B = SG_HUMP[clamp(a + 1, 0, N - 1)]; return mix(A, B, (1 - Math.cos(Math.PI * t)) / 2); };
    const h = hc(f), ph = TAU * f;
    return [108 + 122 * s + 0.32 * h * Math.sin(ph), mix(118, 110, s) - h * (1 - Math.cos(ph)) / 2];
  };
  // 笔画：[落笔, 抬笔, 路径, 两端减速程度]；笔画之间的空档都短于原作 220 ms 的"放松"延时，墨色一直保持全黑
  const SG_STROKES = [
    [0.8, 1.42, SG_cr([[48, 122], [60, 96], [74, 64], [86, 46], [94, 52], [88, 80], [78, 110], [72, 128], [64, 138], [56, 130], [66, 116], [86, 108], [104, 104]]), 1],
    [1.62, 2.58, SG_cursive, 0.3],
    [2.78, 2.84, SG_cr([[184, 72], [191, 66]]), 1],
    [3.04, 3.4, SG_cr([[60, 140], [112, 139], [170, 134], [220, 123], [250, 108], [264, 94]]), 1],
  ];
  const SG_warp = (t, c) => t - c * Math.sin(TAU * t) / TAU;
  // 手的位置（板内坐标）：笔画内沿路径走，笔画之间用 BN_path 平滑移动
  function SG_hand(u) {
    const S = SG_STROKES;
    for (let i = 0; i < S.length; i++) {
      const [a, b, f, c] = S[i];
      if (u >= a && u <= b) return f(SG_warp((u - a) / (b - a), c));
      const prevEnd = i === 0 ? [0.15, 480, 226] : [S[i - 1][1], ...S[i - 1][2](1)];
      if (u < a) return BN_path(u, [prevEnd, [a, ...f(0)]]);
    }
    const e = S[S.length - 1], end = [e[1], ...e[2](1)], cl = [SG_CLR.x + 26, SG_CLR.y + 16];
    return BN_path(u, [end, [SG_CLICK - 0.06, cl[0], cl[1]], [SG_CLICK + 0.2, cl[0], cl[1]], [4.7, 480, 150]]);
  }
  let SG_SIM = null;
  // 一次性模拟原作的 onDown / onMove：平滑追手、按速度算目标线宽、线宽再按 0.35 缓动；每个点记下出现时刻
  function SG_sim() {
    if (SG_SIM) return SG_SIM;
    const strokes = [];
    for (const [a, b] of SG_STROKES) {
      const p0 = SG_hand(a), w0 = (SG_THIN + SG_THICK) / 2, s = [{ x: p0[0], y: p0[1], w: w0, t: a }];
      let l = { x: p0[0], y: p0[1], t: a * 1000, w: w0 };
      for (let t = (Math.floor(a / SG_EV) + 1) * SG_EV; t <= b + 1e-9; t += SG_EV) {
        const raw = SG_hand(t), x = l.x + (raw[0] - l.x) * SG_K, y = l.y + (raw[1] - l.y) * SG_K, d = Math.hypot(x - l.x, y - l.y);
        if (d < 0.8) continue;
        const v = d / Math.max(1, t * 1000 - l.t), target = SG_THICK - (SG_THICK - SG_THIN) * clamp(v / 1.6), w = l.w + (target - l.w) * 0.35;
        l = { x, y, t: t * 1000, w }; s.push({ x, y, w, t });
      }
      strokes.push(s);
    }
    const n = strokes.reduce((m, s) => m + s.length, 0);
    SG_SIM = { strokes, n, dur: clamp(n * SG_PER, 350, 2400) / 1000 };
    return SG_SIM;
  }
  // 原作 pieces()：过各点中点的二次曲线小段，每段宽度取两端点线宽的平均
  function SG_pieces(k, s, upto) {
    const n = Math.min(s.length, upto);
    if (n <= 0) return;
    if (n === 1 || s.length === 1) { k.beginPath(); k.arc(s[0].x, s[0].y, s[0].w / 2, 0, TAU); k.fill(); return; }
    for (let i = 1; i < n; i++) {
      const a = s[i - 1], b = s[i];
      const st = i === 1 ? a : { x: (s[i - 2].x + a.x) / 2, y: (s[i - 2].y + a.y) / 2 };
      const en = i === s.length - 1 ? b : { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      k.lineWidth = (a.w + b.w) / 2; k.beginPath(); k.moveTo(st.x, st.y); k.quadraticCurveTo(a.x, a.y, en.x, en.y); k.stroke();
    }
  }
  CELLS[76] = (k, w, h, u) => {
    // 底：青绿双色线性渐变；签名板是淡青色纸面，阴影用同色系深青
    const bg = k.createLinearGradient(0, 0, CW, CH); bg.addColorStop(0, '#2CC9B0'); bg.addColorStop(1, '#0E8C9E');
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    k.save(); k.shadowColor = 'rgba(4,60,58,0.35)'; k.shadowBlur = 18; k.shadowOffsetY = 6;
    k.fillStyle = '#F1FBF8'; rr(k, SG_X, SG_Y, SG_W, SG_H, SG_R); k.fill(); k.restore();
    const sim = SG_sim(), first = SG_STROKES[0][0];
    k.save(); k.translate(SG_X, SG_Y);
    // 签名线与提示（落笔后提示 220 ms 淡出，点 Clear 后淡回）
    k.fillStyle = 'rgba(15,155,142,0.45)'; k.fillRect(SG_INSET, SG_LINE, SG_W - SG_INSET * 2, 1);
    const hint = 0.7 * UXB_ramp(u, [[0, 1], [first, 0], [SG_CLICK, 1]], 0.22, SG_CSS);
    if (hint > 0.003) txt(k, 'Sign here', SG_W / 2, 141, UXB_f(400, 12), `rgba(11,95,87,${hint})`, 'center', 'top');
    // 墨迹：写字时显示已出现的点；点 Clear 后按 n·(1-ease) 从最后一点倒退
    let left = Infinity;
    if (u >= SG_CLICK) {
      const q = clamp((u - SG_CLICK) / sim.dur), e = q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
      left = q >= 1 ? 0 : Math.round(sim.n * (1 - e));
    }
    k.strokeStyle = SG_INK; k.fillStyle = SG_INK; k.lineCap = 'round'; k.lineJoin = 'round';
    for (const s0 of sim.strokes) {
      if (left <= 0 || s0[0].t > u) break;
      const s = u >= SG_CLICK || s0[s0.length - 1].t <= u ? s0 : s0.filter(p => p.t <= u);
      SG_pieces(k, s, left); left -= s.length;
    }
    // Clear：首次落笔后淡入并弹到 1，悬停加深底色，按下缩到 0.96，点击后淡出缩回 0.9
    const hand = SG_hand(u), C = SG_CLR;
    const op = UXB_ramp(u, [[0, 0], [first, 1], [SG_CLICK, 0]], 0.16, SG_CSS);
    if (op > 0.003) {
      const hov = UXB_ramp(u, [[0, 0], [SG_CLICK - 0.1, 1], [SG_CLICK + 0.26, 0]], 0.16, SG_CSS);
      const sc = UXB_ramp(u, [[0, 0.9], [first, 1], [SG_CLICK - 0.08, 0.96], [SG_CLICK, 0.9]], 0.22, SG_POP);
      k.save(); k.globalAlpha = op; k.translate(C.x + C.w / 2, C.y + C.h / 2); k.scale(sc, sc);
      k.fillStyle = `rgb(${UXB_mix(SG_TEAL, SG_DEEP, hov).join(',')})`; rr(k, -C.w / 2, -C.h / 2, C.w, C.h, 10); k.fill();
      txt(k, 'Clear', 0, 0.5, UXB_f(600, 12), '#FFFFFF', 'center', 'middle');
      k.restore();
    }
    k.restore();
    // 指针：写字时按住，3.6 秒点击 Clear
    let press = UXB_press(u, SG_CLICK);
    for (const [a, b] of SG_STROKES) press = Math.max(press, clamp(Math.min((u - a + 0.06) / 0.06, (b + 0.06 - u) / 0.06)));
    cursor(k, SG_X + hand[0], SG_Y + hand[1], press);
  };

  // @element 78
  // 82 刻度尺拨时间（bencho time-scrubber）：杏色渐变底上一张 300 宽橙色渐变卡，上方是白色 12 小时制时间读数（9:30 AM），下方是一条白色刻度尺（越靠中间越高越不透明），深靛色指针线固定在中间；
  // 指针 0.85 秒按住刻度尺往左慢拖，2.1–2.4 秒加速一甩松手，刻度尺按松手速度滑行、用同一个弹簧停到最近的 15 分钟刻度（1:00 PM），数字逐位滚动并带一点模糊；
  // 3.55–3.85 秒再向右一甩，滑回 9:30 AM，约 4.7 秒停稳；指针 4.8 秒离开，之后画面与 0 秒相同。
  const TR_X = 119.5, TR_Y = 34, TR_W = 300, TR_H = 140, TR_CX = TR_X + TR_W / 2;
  const TR_PX = 2, TR_HALF = (TR_W - 36) / 2, TR_DAY = 1440, TR_STEP = 15, TR_START = 570;
  const TR_CARRY = 6 + 50 / 100 * 30;                  // 动量 50：松手速度 × 21 帧决定落点
  const TR_RUL = TR_Y + 20 + 30 + 16;                   // 刻度尺顶边（高 58）
  const TR_HY = 124;                                    // 手在刻度尺上的高度
  const TR_POP = UXA_bz(0.24, 1.34, 0.38, 1), TR_EO = UXA_bz(0, 0, 0.58, 1);
  const TR_INK = '#FFFFFF', TR_MUTE = 'rgba(255,255,255,0.86)', TR_RED = '#231B5E';
  const TR_P1 = [0.85, 2.4], TR_P2 = [3.55, 3.85];      // 两次按住（按下, 松手）
  const TR_F1 = 120, TR_F2 = 144, TR_V = 2 * TR_F1 / 0.3, TR_V2 = 2 * TR_F2 / 0.3, TR_TAU = 0.09;
  const TR_wrap = m => ((m % TR_DAY) + TR_DAY) % TR_DAY;
  // 手：慢拖用 BN_path；两次甩动是从静止开始的匀加速（x = x0 ± F·s²），松手后速度按 exp 衰减滑出去
  function TR_hand(u) {
    const y = TR_HY;
    if (u < TR_P1[0]) return BN_path(u, [[0.2, 580, 200], [0.78, 330, y], [TR_P1[0], 330, y]]);
    if (u < 2.1) return BN_path(u, [[TR_P1[0], 330, y], [1.75, 270, y + 1], [2.1, 270, y + 1]]);
    if (u < TR_P1[1]) { const s = (u - 2.1) / 0.3; return [270 - TR_F1 * s * s, y + 1 + 2 * s]; }
    const e1 = (t) => [160 - TR_V * TR_TAU * (1 - Math.exp(-(t - TR_P1[1]) / TR_TAU)), y + 3 + 6 * (1 - Math.exp(-(t - TR_P1[1]) / TR_TAU))];
    if (u < 2.75) return e1(u);
    if (u < TR_P2[0]) { const a = e1(2.75); return BN_path(u, [[2.75, a[0], a[1]], [3.35, 200, y], [TR_P2[0], 200, y]]); }
    if (u < TR_P2[1]) { const s = (u - TR_P2[0]) / 0.3; return [200 + TR_F2 * s * s, y - 2 * s]; }
    const x2 = 200 + TR_F2, e2 = (t) => [x2 + TR_V2 * TR_TAU * (1 - Math.exp(-(t - TR_P2[1]) / TR_TAU)), y - 2 + 8 * (1 - Math.exp(-(t - TR_P2[1]) / TR_TAU))];
    if (u < 4.15) return e2(u);
    const b = e2(4.15); return BN_path(u, [[4.15, b[0], b[1]], [4.8, 600, 168]]);
  }
  const TR_down = u => (u >= TR_P1[0] && u < TR_P1[1]) || (u >= TR_P2[0] && u < TR_P2[1]);
  function TR_label(m) {
    const t = TR_wrap(Math.round(m)), h = Math.floor(t / 60);
    return { time: `${h % 12 || 12}:${String(t % 60).padStart(2, '0')}`, mer: h < 12 ? 'AM' : 'PM' };
  }
  let TR_SIM = null;
  // 一次性按 60 Hz 重放原作：拖动时速度 v = v·0.5 + 本帧位移·0.5；松手落点 = round((x + v·21)/15)·15；
  // 弹簧每帧 v += (to-x)·0.022 - v·0.26，起始速度为松手速度的 0.6；同时记下每一位数字何时变化
  function TR_sim() {
    if (TR_SIM) return TR_SIM;
    const N = Math.ceil(CYC * 60) + 1, X = new Float64Array(N);
    let x = TR_START, v = 0, to = TR_START, spring = false, fresh = false, g = null;
    for (let i = 0; i < N; i++) {
      const t = i / 60, hx = TR_hand(t)[0], dn = TR_down(t);
      if (dn && !g) { spring = false; g = { x: hx, t, v: 0 }; v = 0; }
      else if (dn && g) {
        if (Math.abs(hx - g.x) > 0.01) {
          const dm = -(hx - g.x) / TR_PX, dt = Math.max(1, (t - g.t) * 1000) / 16.67;
          g.v = g.v * 0.5 + (dm / dt) * 0.5; g.x = hx; g.t = t; x += dm;
        }
      } else if (g) {
        const vv = t - g.t > 0.08 ? 0 : clamp(g.v, -14, 14);
        to = Math.round((x + vv * TR_CARRY) / TR_STEP) * TR_STEP; v = vv * 0.6; spring = true; fresh = true; g = null;
      } else if (spring) {
        if (fresh) fresh = false;
        v += (to - x) * 0.022 - v * 0.26; x += v;
        if (Math.abs(to - x) < 0.01 && Math.abs(v) < 0.01) { x = to; v = 0; spring = false; }
      }
      X[i] = x;
    }
    // 数字列（从右数：1 分个位，2 分十位，4 时个位，5 时十位）：每列一串 [挂载时刻, [[t, 数字], …]]
    const cols = { 1: [], 2: [], 4: [], 5: [] }, mers = [];
    let prev = null;
    for (let i = 0; i < N; i++) {
      const L = TR_label(X[i]), s = L.time.split(':'), ds = { 1: s[1][1], 2: s[1][0], 4: s[0][s[0].length - 1], 5: s[0].length > 1 ? s[0][0] : null };
      for (const c of [1, 2, 4, 5]) {
        const d = ds[c], p = prev ? prev[c] : undefined;
        if (d === null) continue;
        if (p === undefined || p === null) cols[c].push({ t0: i / 60, ev: [[-1, +d]] });
        else if (p !== d) { cols[c][cols[c].length - 1].ev.push([i / 60, +d]); }
      }
      if (!prev || L.mer !== mers[mers.length - 1][1]) mers.push([i / 60, L.mer]);
      prev = ds;
    }
    TR_SIM = { X, N, cols, mers };
    return TR_SIM;
  }
  const TR_pos = u => { const S = TR_sim(), f = clamp(u * 60, 0, S.N - 1), i = Math.min(S.N - 2, Math.floor(f)); return mix(S.X[i], S.X[i + 1], f - i); };
  CELLS[77] = (k, w, h, u) => {
    // 底：杏色双色渐变；卡片是饱和的橙色竖向渐变，阴影用深橙
    const bg = k.createLinearGradient(0, 0, CW, CH); bg.addColorStop(0, '#FFF1E2'); bg.addColorStop(1, '#FFD2B0');
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    const cg = k.createLinearGradient(0, TR_Y, 0, TR_Y + TR_H); cg.addColorStop(0, '#F2711F'); cg.addColorStop(1, '#C9450F');
    k.save(); k.shadowColor = 'rgba(170,64,8,0.32)'; k.shadowBlur = 18; k.shadowOffsetY = 6;
    k.fillStyle = cg; rr(k, TR_X, TR_Y, TR_W, TR_H, 20); k.fill(); k.restore();
    const S = TR_sim(), pos = TR_pos(u), fi = Math.min(S.N - 1, Math.round(u * 60));
    // ── 读数：每位数字是一条 0–9 竖排数字带，在 1.5em 高、上下渐隐的窗口里滚动（220 ms 回弹过渡 + 260 ms 模糊）
    const F = UXB_f(500, 30); k.font = F;
    const dw = k.measureText('0').width - 0.9, cw = k.measureText(':').width - 0.9 + 1.2;
    const segAt = c => { const L = S.cols[c]; let sg = null; for (const s of L) { if (s.t0 <= u + 1e-9) sg = s; } return sg; };
    const L = TR_label(S.X[fi]), has5 = L.time.length > 4, mer = S.mers.reduce((a, m) => (m[0] <= u + 1e-9 ? m[1] : a), 'AM');
    k.font = UXB_f(500, 14); const mw = k.measureText(mer).width - 0.28;
    const tw = dw * (has5 ? 4 : 3) + cw, x0 = TR_CX - (tw + 8 + mw) / 2, base = TR_Y + 20 + 15 + 10.5, top = TR_Y + 20 - 7.5;
    const order = has5 ? [5, 4, 0, 2, 1] : [4, 0, 2, 1];
    let cx = x0;
    for (const c of order) {
      if (c === 0) { txt(k, ':', cx + 0.6, base, F, TR_INK, 'left', 'alphabetic'); cx += cw; continue; }
      const sg = segAt(c);
      if (sg) {
        const val = UXB_ramp(u, [[sg.t0, sg.ev[0][1]], ...sg.ev.slice(1)], 0.22, TR_POP);
        let lc = -9; for (const e of sg.ev) if (e[0] > 0 && e[0] <= u) lc = e[0];
        const bl = u - lc < 0.26 ? 2 * (1 - TR_EO(seg(u, lc, lc + 0.26))) : 0;
        const gr = k.createLinearGradient(0, top, 0, top + 45);
        gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.3, TR_INK); gr.addColorStop(0.7, TR_INK); gr.addColorStop(1, 'rgba(255,255,255,0)');
        // 模糊用几份错开的半透明副本近似（比 filter 便宜）
        const offs = bl > 0.15 ? [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5], [0, -1], [0, 1]] : [[0, 0]];
        k.globalAlpha = bl > 0.15 ? 0.3 : 1;
        for (let d = Math.max(0, Math.floor(val) - 1); d <= Math.min(9, Math.ceil(val) + 1); d++) {
          const yy = base + (d - val) * 45;
          if (Math.abs(yy - base) < 45) for (const [ox, oy] of offs) txt(k, String(d), cx + ox * bl, yy + oy * bl, F, gr, 'left', 'alphabetic');
        }
        k.globalAlpha = 1;
      }
      cx += dw;
    }
    txt(k, mer, cx + 8, base, UXB_f(500, 14), TR_MUTE, 'left', 'alphabetic');
    // ── 刻度尺：只画窗口内的刻度；越靠中间越高越黑，两端按蒙版渐隐（0→22%→78%→100%）
    const rl = TR_X + 20, rw = TR_W - 40;
    const fade = x => { const q = (x - rl) / rw; return q <= 0 || q >= 1 ? 0 : q < 0.22 ? q / 0.22 : q > 0.78 ? (1 - q) / 0.22 : 1; };
    const span = TR_HALF / TR_PX + 10;
    for (let m = Math.ceil((pos - span) / 5) * 5; m <= pos + span; m += 5) {
      const dx = (m - pos) * TR_PX, X = TR_CX + dx, f = clamp(1 - Math.pow(Math.abs(dx) / TR_HALF, 2)), a = fade(X);
      if (a <= 0) continue;
      const wm = TR_wrap(m), hr = wm % 60 === 0, th = hr ? 25 : wm % 15 === 0 ? 17 : 10;
      k.fillStyle = rgba([255, 255, 255], (0.3 + 0.7 * f) * a);
      rr(k, X - 1, TR_RUL + 8, 2, th * (0.55 + 0.45 * f), 1); k.fill();
      if (hr) {
        const hh = Math.floor(wm / 60);
        txt(k, `${hh % 12 || 12} ${hh < 12 ? 'AM' : 'PM'}`, X, TR_RUL + 38, UXB_f(400, 11), rgba([255, 255, 255], (0.25 + 0.75 * f) * a), 'center', 'top');
      }
    }
    k.fillStyle = TR_RED; rr(k, TR_CX - 1.5, TR_RUL + 2, 3, 32, 1.5); k.fill();
    // ── 指针：按住拖动时显示按下
    const [hx, hy] = TR_hand(u);
    let pr = 0;
    for (const [a, b] of [TR_P1, TR_P2]) pr = Math.max(pr, clamp(Math.min((u - a + 0.06) / 0.06, (b + 0.06 - u) / 0.06)));
    cursor(k, hx, hy, pr);
  };

  // @element 79
  // 83 币种兑换翻转（bencho asset-swap）：桃色→薄荷渐变底上两块圆角板，上板是 BTC 橙色渐变（You pay 0.05 BTC），下板是 HYPE 深青绿渐变（You receive 127.496 HYPE），白字；接缝正中是一个白色圆形箭头按钮（Crypto 组，回弹 30）；
  // 指针 0.3 秒进入，1.4 秒点击箭头：按钮按下缩到 0.9 再弹回，箭头用弹簧转半圈指向上方，两块板原地不动，只是 You pay / You receive 互换、两边金额按价格和 0.3% 手续费重算；
  // 指针随后去悬停下板的 HYPE 币种胶囊，3.6 秒再点箭头，箭头继续同向再转半圈回到朝下、数字复原；指针 4.8 秒离开，之后画面与 0 秒相同。
  const AS_S = 0.84, AS_W = 300, AS_CARD = 116, AS_GAP = 3, AS_H = AS_CARD * 2 + AS_GAP, AS_R = 20;
  const AS_OX = 269.5 - AS_W / 2 * AS_S, AS_OY = 104 - AS_H / 2 * AS_S;
  const AS_FX = AS_W / 2, AS_FY = 117.5;                          // 箭头按钮中心（块内坐标）
  const AS_C1 = 1.4, AS_C2 = 3.6;                                  // 两次点击（click 即松手时刻）
  const AS_INK = '#17181a';
  const AS_COINS = {
    BTC: { bg: '#F7931A', fg: '#FFF', rot: -14, d: 'M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z' },
    HYPE: { bg: '#072723', fg: '#97FCE4', rot: 0, d: 'M7.5 16c0-4.4 2.6-6 5-6 1.9 0 2.6 1.7 3.5 1.7s1.6-1.7 3.5-1.7c2.4 0 5 1.6 5 6s-2.6 6-5 6c-1.9 0-2.6-1.7-3.5-1.7s-1.6 1.7-3.5 1.7c-2.4 0-5-1.6-5-6z' },
  };
  // 原作的读数：付出方显示整手数量，接收方 = 价值 × (1 - 0.3%) ÷ 单价（BTC 97700，HYPE 38.2）；按 en-US 格式化
  const AS_SHOW = [
    [{ role: 'You pay', amt: '0.05', fiat: '$4,885.00' }, { role: 'You receive', amt: '127.496', fiat: '$4,870.35' }],
    [{ role: 'You receive', amt: '0.03898', fiat: '$3,808.54' }, { role: 'You pay', amt: '100', fiat: '$3,820.00' }],
  ];
  // framer-motion 的 duration/bounce 弹簧：阻尼比 1-bounce，固有频率取使包络在 duration 处降到 0.001 的根（与 findSpring 相同）
  const AS_spring = (dur, bounce) => {
    const z = 1 - bounce, w = -Math.log(0.001 * Math.sqrt(1 - z * z) / z) / (z * dur), wd = w * Math.sqrt(1 - z * z);
    return t => (t <= 0 ? 0 : 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + z * w / wd * Math.sin(wd * t)));
  };
  const AS_TURN = AS_spring(0.6, 30 / 100 * 0.5);                 // 旋转：0.6 秒，bounce 0.15
  const AS_TAP = AS_spring(0.42, 0.35);                            // 缩放：0.42 秒，bounce 0.35
  const AS_P = {};
  const AS_path = sym => AS_P[sym] || (AS_P[sym] = new Path2D(AS_COINS[sym].d));
  // 手：0.3 秒从右下进入 → 箭头 → 1.4 秒点击 → 去悬停下板 HYPE 胶囊 → 回到箭头 3.6 秒点击 → 4.8 秒离开
  const AS_pill = (sym, k) => { k.font = UXB_f(500, 13); const w = 4 + 22 + 8 + k.measureText(sym).width + 12; return { x: AS_W - 14 - w, y: AS_CARD - 14 - 30, w, h: 30 }; };
  const AS_PITCH_Y = i => i * (AS_CARD + AS_GAP);
  const AS_KEYS = [[0.3, 330, 250], [1.15, AS_FX + 3, AS_FY + 2], [AS_C1 + 0.25, AS_FX + 3, AS_FY + 2], [2.2, 238, AS_PITCH_Y(1) + 89], [2.75, 240, AS_PITCH_Y(1) + 88], [3.35, AS_FX + 2, AS_FY + 1], [AS_C2 + 0.25, AS_FX + 2, AS_FY + 1], [4.8, 380, 250]];
  const AS_hand = u => BN_path(u, AS_KEYS);
  let AS_HOV = null;
  const AS_TINT = {
    BTC: { a: '#E2730F', b: '#B9500A', sh: 'rgba(150,60,0,0.35)', lab: 'rgba(255,255,255,0.92)' },
    HYPE: { a: '#14806F', b: '#0A4E45', sh: 'rgba(0,60,52,0.35)', lab: '#97FCE4' },
  };
  function AS_drawLogo(k, sym, x, y, s) {
    const c = AS_COINS[sym];
    k.save(); k.translate(x, y); k.scale(s / 32, s / 32);
    k.fillStyle = c.bg; k.beginPath(); k.arc(16, 16, 16, 0, TAU); k.fill();
    if (c.rot) { k.translate(16, 16); k.rotate(c.rot * Math.PI / 180); k.translate(-16, -16); }
    k.fillStyle = c.fg; k.fill(AS_path(sym));
    k.restore();
  }
  CELLS[78] = (k, w, h, u) => {
    // 底：左上桃色 → 右下薄荷的对角渐变，分别呼应 BTC 橙和 HYPE 青绿
    const bg = k.createLinearGradient(0, 0, CW, CH); bg.addColorStop(0, '#FFE4C8'); bg.addColorStop(1, '#C9F2E6');
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    const st = u >= AS_C1 && u < AS_C2 ? 1 : 0, coins = ['BTC', 'HYPE'];
    const [hx, hy] = AS_hand(u);
    k.save(); k.translate(AS_OX, AS_OY); k.scale(AS_S, AS_S);
    // 下板胶囊的悬停（白色底 20% → 34%，160 ms）
    const pl = AS_pill('HYPE', k), py = AS_PITCH_Y(1);
    if (!AS_HOV) AS_HOV = UXB_changes(t => { const p = AS_hand(t); return p[0] >= pl.x && p[0] <= pl.x + pl.w && p[1] >= py + pl.y && p[1] <= py + pl.y + pl.h ? 1 : 0; });
    const hov = UXB_ramp(u, AS_HOV, 0.16, x => x);
    for (let i = 0; i < 2; i++) {
      const y = AS_PITCH_Y(i), f = AS_SHOW[st][i], sym = coins[i];
      // 板：上 BTC 橙、下 HYPE 深青绿，竖向渐变；阴影用各自的深色
      const T = AS_TINT[sym], g = k.createLinearGradient(0, y, 0, y + AS_CARD); g.addColorStop(0, T.a); g.addColorStop(1, T.b);
      k.save(); k.shadowColor = T.sh; k.shadowBlur = 16; k.shadowOffsetY = 5;
      k.fillStyle = g; rr(k, 0, y, AS_W, AS_CARD, AS_R); k.fill(); k.restore();
      txt(k, f.role, 18, y + 16, UXB_f(500, 12), T.lab, 'left', 'top');
      k.letterSpacing = '-0.4px';
      txt(k, f.amt, 20, y + 71, UXB_f(600, 20), '#FFFFFF', 'left', 'middle');
      k.letterSpacing = '0px';
      txt(k, f.fiat, 20, y + 93, UXB_f(400, 12), T.lab, 'left', 'middle');
      // 币种胶囊：半透明白底，悬停加深到 34%；图标外加一圈白边，与彩色板分开
      const p = AS_pill(sym, k), a = 0.2 + (i === 1 ? 0.14 * hov : 0);
      k.fillStyle = `rgba(255,255,255,${a})`; rr(k, p.x, y + p.y, p.w, p.h, 15); k.fill();
      k.fillStyle = '#FFFFFF'; k.beginPath(); k.arc(p.x + 15, y + p.y + 15, 12.5, 0, TAU); k.fill();
      AS_drawLogo(k, sym, p.x + 4, y + p.y + 4, 22);
      txt(k, sym, p.x + 34, y + p.y + 15.5, UXB_f(600, 13), '#FFFFFF', 'left', 'middle');
    }
    // 箭头按钮：按下缩到 0.9（whileTap），松手后 0.42 秒弹簧弹回；每次点击再转 180°（只增不减）
    let rot = 0, sc = 1;
    for (const c of [AS_C1, AS_C2]) { rot += 180 * AS_TURN(u - c); sc -= 0.1 * (AS_TAP(u - (c - 0.1)) - AS_TAP(u - c)); }
    k.save(); k.translate(AS_FX, AS_FY); k.scale(sc, sc); k.rotate(rot * Math.PI / 180);
    k.save(); k.shadowColor = 'rgba(40,30,20,0.28)'; k.shadowBlur = 10; k.shadowOffsetY = 2;
    k.fillStyle = '#FFFFFF'; k.beginPath(); k.arc(0, 0, 20, 0, TAU); k.fill(); k.restore();
    k.scale(0.75, 0.75); k.translate(-12, -12);
    k.strokeStyle = AS_INK; k.lineWidth = 2; k.lineCap = 'round'; k.lineJoin = 'round';
    k.beginPath(); k.moveTo(12, 5); k.lineTo(12, 19); k.moveTo(19, 12); k.lineTo(12, 19); k.lineTo(5, 12); k.stroke();
    k.restore();
    k.restore();
    let press = 0;
    for (const c of [AS_C1, AS_C2]) press = Math.max(press, clamp(Math.min((u - c + 0.16) / 0.06, (c + 0.06 - u) / 0.06)));
    cursor(k, AS_OX + hx * AS_S, AS_OY + hy * AS_S, press);
  };

  // @element 80
  // 84 磁力选项（bencho magnet-select）：浅紫渐变底上 7 个圆形选项排成蜂窝（Large），每个一种色相：未选中是淡色圆（悬停时加深），选中的那个变大、填满饱和色并显示白色图形，其余被径向推开、略缩小并微微倾斜（Pull 55，Bounce 55）；
  // 指针 0.3 秒从右侧进入，靠近时整组一起向指针倾靠几像素；1.0 秒点右边的圆、2.6 秒点左上的圆、4.0 秒点回中心的圆，每次推力由近到远错开 22 ms 一级向外传开，弹簧带一点回弹；
  // 指针 4.8 秒离开，整组倾靠归零，约 5.0 秒后所有弹簧停稳，画面与 0 秒相同。
  const MS_PTS = [[0, 0], [45, 0], [22.5, -39], [-22.5, -39], [-45, 0], [-22.5, 39], [22.5, 39]];
  const MS_CHIP = 44, MS_PITCH = 45, MS_SPREAD = 2.8, MS_HX = 269.5, MS_HY = 104;
  const MS_P = 55 / 100, MS_GROW = 1.16 + 0.22 * MS_P, MS_ROOM = MS_CHIP * (MS_GROW - 1) / 2, MS_AURA = 3 + 9 * MS_P;
  const MS_TILT = 5 * MS_P, MS_COWER = 0.04 + 0.09 * MS_P, MS_ZETA = 0.9 - 0.48 * 0.55, MS_GIVE = 2 + 0.5 * 5, MS_FADE = 44;
  const MS_SEL = [[-1, 0], [1.0, 1], [2.6, 3], [4.0, 0]];       // [点击时刻, 选中序号]，初始选中中心
  const MS_INK = '#17181a';
  // 七种色相（中心紫、右珊瑚、右上琥珀、左上翠绿、左天蓝、左下品红、右下青）；未选中用它与白色 34% 的混色，悬停时 50%
  const MS_HUE = [['#7C4DFF'], ['#FF5A5F'], ['#F5A300'], ['#1DB86A'], ['#2E8BFF'], ['#E540A8'], ['#00B5C8']];
  // 七个占位图形（48 视框，原作 MARKS）
  const MS_MARKS = [
    'M38 24a14 14 0 1 1-28 0a14 14 0 1 1 28 0Z',
    'M16 11h16a5 5 0 0 1 5 5v16a5 5 0 0 1-5 5h-16a5 5 0 0 1-5-5v-16a5 5 0 0 1 5-5Z',
    'M24 8 L40 38 L8 38 Z',
    'M24 6 L42 24 L24 42 L6 24 Z',
    'M10 24 a14 14 0 0 1 28 0 v14 h-28 Z',
    'M24 7 l4.9 10 11 1.6 -8 7.8 1.9 11 -9.8 -5.2 -9.8 5.2 1.9 -11 -8 -7.8 11 -1.6 Z',
    'M15 17h18a7 7 0 0 1 0 14h-18a7 7 0 0 1 0-14Z',
  ];
  const MS_PATH = [];
  // 原作 field：以选中者为磁铁，其余沿连线方向推开固定的 room + aura，fall = exp(-(far-1)/2.8) 只驱动错峰、倾斜和缩小
  function MS_field(at) {
    const [ax, ay] = MS_PTS[at];
    return MS_PTS.map(([px, py], i) => {
      const dx = px - ax, dy = py - ay, gap = Math.hypot(dx, dy), far = gap / MS_PITCH;
      const fall = i === at ? 0 : Math.exp(-(far - 1) / MS_SPREAD), push = i === at ? 0 : MS_ROOM + MS_AURA;
      const ux = gap ? dx / gap : 0, uy = gap ? dy / gap : 0, on = i === at;
      const k = 300 + 280 * (1 - Math.min(far, 3) / 4);
      return { far, fall, k, wait: far * 0.022, tg: [ux * push, uy * push, on ? MS_GROW : 1 - MS_COWER * fall, on ? MS_GROW : 1 - MS_COWER * fall, ux * MS_TILT * fall],
        cx: px + ux * push, cy: py + uy * push };
    });
  }
  const MS_selAt = u => { let s = 0; for (const e of MS_SEL) if (e[0] <= u) s = e[1]; return s; };
  // 指针：按下时刻停在当时目标圆的静止位置上（上一次选择早已停稳）
  const MS_KEYS = (() => {
    const f0 = MS_field(0), f1 = MS_field(1), f3 = MS_field(3);
    const at = (f, i, ox = 0, oy = 0) => [MS_HX + f[i].cx + ox, MS_HY + f[i].cy + oy];
    return [[0.3, 600, 150], [0.75, ...at(f0, 1, 6, 4)], [1.12, ...at(f0, 1, 4, 3)], [1.75, ...at(f1, 6, 10, 26)],
      [2.32, ...at(f1, 3, 2, 2)], [2.72, ...at(f1, 3, 1, 2)], [3.3, ...at(f3, 4, -24, 10)], [3.75, ...at(f3, 0, 3, 2)], [4.12, ...at(f3, 0, 3, 2)],
      [4.8, 600, 190]];
  })();
  const MS_hand = u => BN_path(u, MS_KEYS);
  let MS_SIM = null;
  // 一次性模拟：每个圆 5 个通道（x, y, scaleX, scaleY, rotate）各是一个弹簧，刚度/质量同原作，阻尼比 0.636；
  // 换选中后各圆在 far × 22 ms 后改追新目标，带着当时的速度；同时按 60 Hz 重放倾靠（CSS 220 ms 缓动，每帧重新起步）
  function MS_sim() {
    if (MS_SIM) return MS_SIM;
    const R = 240, N = Math.ceil(CYC * R) + 2, SUB = 4, dt = 1 / R / SUB;
    const F = MS_SEL.map(e => [e[0], MS_field(e[1])]);
    const M = [0.9, 0.9, 0.8, 0.95, 1], KM = [1, 1, 1.24, 0.86, 0.8];
    const X = new Float32Array(N * 35), st = [];
    for (let i = 0; i < 7; i++) for (let c = 0; c < 5; c++) st.push({ x: F[0][1][i].tg[c], v: 0 });
    for (let n = 0; n < N; n++) {
      const t = n / R;
      for (let i = 0; i < 7; i++) {
        let fl = F[0][1][i];
        for (const [t0, f] of F) if (t0 >= 0 && t >= t0 + f[i].wait) fl = f[i];
        for (let c = 0; c < 5; c++) {
          const s = st[i * 5 + c], m = M[c], k = fl.k * KM[c], d = 2 * Math.sqrt(k * m) * MS_ZETA;
          if (n > 0) for (let q = 0; q < SUB; q++) { s.v += (-k * (s.x - fl.tg[c]) - d * s.v) / m * dt; s.x += s.v * dt; }
          X[n * 35 + i * 5 + c] = s.x;
        }
      }
    }
    // 倾靠：以整组中心为原点，指针在组内按距离从 0 升到满值，出组后 44 px 内淡出；最大 4.5 px
    const L = Math.ceil(CYC * 60) + 2, LX = new Float32Array(L), LY = new Float32Array(L), E = UXA_bz(0.22, 1, 0.36, 1)(1 / 60 / 0.22);
    let lx = 0, ly = 0;
    for (let n = 0; n < L; n++) {
      const t = n / 60, [px, py] = MS_hand(t), f = MS_field(MS_selAt(t));
      const r = Math.max(1, ...f.map(c => Math.hypot(c.cx, c.cy) + MS_CHIP / 2));
      const dx = px - MS_HX, dy = py - MS_HY, d = Math.hypot(dx, dy);
      const dr = Math.min(1, d / r) * (d <= r ? 1 : Math.max(0, 1 - (d - r) / MS_FADE)) * MS_GIVE;
      const tx = dr > 0 ? dx / (d || 1) * dr : 0, ty = dr > 0 ? dy / (d || 1) * dr : 0;
      if (n > 0) { lx += (tx - lx) * E; ly += (ty - ly) * E; }
      LX[n] = lx; LY[n] = ly;
    }
    MS_SIM = { X, N, R, LX, LY, L };
    MS_SIM.hov = UXB_changes(t => MS_hit(t));
    return MS_SIM;
  }
  const MS_get = (u, i, c) => { const S = MS_SIM, f = clamp(u * S.R, 0, S.N - 1), n = Math.min(S.N - 2, Math.floor(f)); return mix(S.X[n * 35 + i * 5 + c], S.X[(n + 1) * 35 + i * 5 + c], f - n); };
  // 指针下的圆（按钮是 44 方块，跟着弹簧变换移动）
  function MS_hit(u) {
    const [px, py] = MS_hand(u);
    for (let i = 6; i >= 0; i--) {
      const cx = MS_HX + MS_PTS[i][0] + MS_get(u, i, 0), cy = MS_HY + MS_PTS[i][1] + MS_get(u, i, 1), a = -MS_get(u, i, 4) * Math.PI / 180;
      const dx = px - cx, dy = py - cy, lx = (dx * Math.cos(a) - dy * Math.sin(a)) / MS_get(u, i, 2), ly = (dx * Math.sin(a) + dy * Math.cos(a)) / MS_get(u, i, 3);
      if (Math.abs(lx) <= 22 && Math.abs(ly) <= 22) return i;
    }
    return -1;
  }
  CELLS[79] = (k, w, h, u) => {
    // 底：浅紫径向渐变（中心偏亮）
    const bg = k.createRadialGradient(MS_HX, MS_HY, 20, MS_HX, MS_HY, 320); bg.addColorStop(0, '#F3EEFF'); bg.addColorStop(1, '#DCD0FA');
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    const S = MS_sim(), sel = MS_selAt(u);
    const lf = clamp(u * 60, 0, S.L - 1), ln = Math.min(S.L - 2, Math.floor(lf)), lx = mix(S.LX[ln], S.LX[ln + 1], lf - ln), ly = mix(S.LY[ln], S.LY[ln + 1], lf - ln);
    const ease = UXA_bz(0.25, 0.1, 0.25, 1);
    for (let i = 0; i < 7; i++) {
      // 悬停（220 ms）与选中（底色和图形 220 ms 渐变）
      const hov = UXB_ramp(u, S.hov.map(e => [e[0], e[1] === i ? 1 : 0]), 0.22, ease);
      const mk = UXB_ramp(u, MS_SEL.map(e => [e[0], e[1] === i ? 1 : 0]), 0.22, ease);
      const on = i === sel ? 1 : 0, H = MS_HUE[i];
      k.save();
      k.translate(MS_HX + MS_PTS[i][0] + MS_get(u, i, 0), MS_HY + MS_PTS[i][1] + MS_get(u, i, 1));
      k.rotate(MS_get(u, i, 4) * Math.PI / 180); k.scale(MS_get(u, i, 2), MS_get(u, i, 3)); k.translate(lx, ly);
      // 底：未选中是本色相的淡色，悬停时加深一档；选中填满饱和色，选中且悬停时再压暗 22%
      const hn = hov * (1 - on), hs = hov * on;
      const pale = UXB_mix('#ffffff', H[0], 0.34 + 0.16 * hn), full = UXB_mix(H[0], '#1d1640', 0.22 * hs);
      const c = pale.map((v, j) => Math.round(v + (full[j] - v) * mk));
      k.beginPath(); k.arc(0, 0, 22, 0, TAU);
      k.fillStyle = `rgb(${c.join(',')})`; k.fill();
      k.strokeStyle = rgba(UXB_mix(H[0], H[0], 0), 0.45 * (1 - mk)); k.lineWidth = 1 / MS_get(u, i, 2); k.stroke();
      if (mk > 0.003) {
        if (!MS_PATH[i]) MS_PATH[i] = new Path2D(MS_MARKS[i]);
        k.save(); k.globalAlpha = mk; k.scale(44 / 48, 44 / 48); k.translate(-24, -24);
        k.fillStyle = '#FFFFFF'; k.fill(MS_PATH[i]);
        k.restore();
      }
      k.restore();
    }
    const [hx, hy] = MS_hand(u);
    let press = 0;
    for (const e of MS_SEL) if (e[0] > 0) press = Math.max(press, UXB_press(u, e[0]));
    cursor(k, hx, hy, press);
  };

  // @element 81
  // 85 头像叠入选择（bencho picker）：浅黄渐变底上，左边是写着 Unassigned 的靛蓝胶囊，右边是展开的四人靛蓝名单卡片，四人头像各一种颜色；指针 0.3 秒从右下进入，
  // 0.9、1.7、2.5 秒依次点选 Adam、Priya、Nora，行尾方框填成本人头像的颜色并弹出白对勾，头像带一点转角落进胶囊、按 10 px 重叠排成一行，胶囊随之变宽；
  // 3.15 秒在 Marco 一行停留不点，4.2 秒再点 Priya 取消，她的头像转着缩小消失，Nora 滑过去补位；4.85 秒指针离开，5.5 秒清空选择回到 Unassigned。
  const PK_S = 0.9;                                         // 原作 264 宽的名单卡片按 0.9 缩放，与胶囊左右并排放进 208 高的格子
  const PK_FACE = 28, PK_LAP = 10, PK_R = 20, PK_ROW = 48, PK_CARDW = 264, PK_CARDH = 8 + 4 * PK_ROW + 8;
  // 配色：浅黄双色渐变底，胶囊与卡片为深靛蓝色面，白字 + 淡紫副字；与 rgba() 配合用 RGB 数组
  const PK_BG0 = '#FFF6CF', PK_BG1 = '#FFD98A', PK_SLAB = '#28235E', PK_INK = '#FFFFFF', PK_ROLE = '#B9B3EC', PK_CHEV = '#9C95DD';
  const PK_RING = [40, 35, 94];                            // 头像外圈 = 胶囊色（原作外圈取所在板的颜色）
  const PK_VH = CH / PK_S;                                  // 缩放后坐标系的高度
  const PK_CT = (PK_VH - PK_CARDH) / 2, PK_CX = 257, PK_PX = 77, PK_PY = PK_VH / 2;
  // 名单：名字、职能、头像底色（原作为灰色占位图，这里每人一种色相）、头像字母
  const PK_CAST = [
    ['Adam Marsh', 'Design', [242, 84, 91], 'A'], ['Priya Raman', 'Research', [139, 92, 246], 'P'],
    ['Nora Wilder', 'Engineering', [13, 148, 136], 'N'], ['Marco Bellini', 'Product', [59, 130, 246], 'M'],
  ];
  // 每人 [选中时刻, 取消时刻]（null = 不选）；5.5 秒为复位段清空
  const PK_ON = [[0.9, 5.5], [1.7, 4.2], [2.5, 5.5], null];
  const PK_CLICKS = [0.9, 1.7, 2.5, 4.2];
  // 指针关键点（缩放前坐标）：按下时指尖落在 Adam、Priya、Nora 行尾方框中心（x 496，各行中心 y 44/92/140），在 Marco 行停留，再回 Priya 取消
  const PK_KEYS = [[0, 650, 250], [0.8, 496, 44], [1.0, 496, 44], [1.6, 496, 92], [1.8, 496, 92], [2.4, 496, 140], [2.6, 496, 140],
    [3.15, 470, 188], [3.55, 470, 188], [4.1, 496, 92], [4.3, 496, 92], [4.85, 660, 250]].map(([t, x, y]) => [t, x * PK_S, y * PK_S]);
  const PK_EZ = UXA_bz(0.22, 1, 0.36, 1), PK_EASE = UXA_bz(0.25, 0.1, 0.25, 1);
  // 弹簧阶跃响应 0→1（初速 0）：stiffness k、damping c、mass m，按阻尼比分欠阻尼/临界/过阻尼三种解析解
  function PK_spring(t, k, c, m) {
    if (t <= 0) return 0;
    const w = Math.sqrt(k / m), z = c / (2 * Math.sqrt(k * m));
    if (z < 0.999) { const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + z * w / wd * Math.sin(wd * t)); }
    if (z < 1.001) return 1 - Math.exp(-w * t) * (1 + w * t);
    const s = Math.sqrt(z * z - 1), r1 = -w * (z - s), r2 = -w * (z + s);
    return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
  }
  const PK_TIGHT = t => PK_spring(t, 380, 34, 0.7);         // 位置与缩放：贴手的紧弹簧
  const PK_LOOSE = t => PK_spring(t, 500, 18, 0.8);         // 旋转：松弹簧，落下时晃过水平再回正
  const PK_TICK = t => PK_spring(t, 500, 18, 0.6);
  const PK_count = u => PK_ON.filter(p => p && u >= p[0] && u < p[1]).length;
  // 胶囊里头像个数的变化表（导轨宽度据此过渡）
  const PK_CNT = (() => {
    const ts = [...new Set(PK_ON.filter(Boolean).flat())].sort((a, b) => a - b);
    return [[-1, 0], ...ts.map(t => [t, PK_count(t)])];
  })();
  const PK_EVTS = PK_CNT.slice(1).map(e => e[0]);
  const PK_rail = n => (n ? PK_FACE + (n - 1) * (PK_FACE - PK_LAP) : 0);
  // 头像在导轨里的下标：前面还在的人数（取消时刻之后不再变，退场时留在原位）
  function PK_index(i, u) {
    let n = 0;
    for (let j = 0; j < i; j++) { const p = PK_ON[j]; if (p && u >= p[0] && u < p[1]) n++; }
    return n;
  }
  function PK_rowAt(u) {
    if (u < 0.2 || u > 4.9) return -1;
    const [x, y] = BN_path(u, PK_KEYS), ox = x / PK_S, oy = y / PK_S;
    if (ox < PK_CX + 8 || ox > PK_CX + PK_CARDW - 8) return -1;
    const r = Math.floor((oy - PK_CT - 8) / PK_ROW);
    return r >= 0 && r < 4 ? r : -1;
  }
  let PK_HOV = null;                                        // 每行悬停状态的切换表，只算一次
  function PK_face(k, x, y, d, p, ring) {
    if (ring) { k.fillStyle = rgba(PK_RING, 1); k.beginPath(); k.arc(x, y, d / 2 + 2, 0, TAU); k.fill(); }
    k.fillStyle = rgba(p[2], 1); k.beginPath(); k.arc(x, y, d / 2, 0, TAU); k.fill();
    txt(k, p[3], x, y - d / 2 + d * 61 / 96, UXB_f(500, d * 40 / 96), '#FFFFFF', 'center');
  }
  CELLS[80] = (k, w, h, u) => {
    if (!PK_HOV) PK_HOV = [0, 1, 2, 3].map(r => UXB_changes(t => (PK_rowAt(t) === r ? 1 : 0)));
    const bg = k.createLinearGradient(0, 0, CW, CH); bg.addColorStop(0, PK_BG0); bg.addColorStop(1, PK_BG1);
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    k.save(); k.scale(PK_S, PK_S);
    // 名单卡片：深靛蓝圆角板，无阴影无描边（原作只靠底色衬出）
    k.fillStyle = PK_SLAB; rr(k, PK_CX, PK_CT, PK_CARDW, PK_CARDH, PK_R); k.fill();
    for (let r = 0; r < 4; r++) {
      const p = PK_CAST[r], y0 = PK_CT + 8 + r * PK_ROW, cy = y0 + PK_ROW / 2;
      const hv = UXB_ramp(u, PK_HOV[r], 0.16, PK_EASE);
      if (hv > 0.003) { k.fillStyle = `rgba(255,255,255,${0.1 * hv})`; rr(k, PK_CX + 8, y0, PK_CARDW - 16, PK_ROW, PK_R - 6); k.fill(); }
      PK_face(k, PK_CX + 32, cy, 32, p, false);
      txt(k, p[0], PK_CX + 60, cy - 3, UXB_f(400, 13), PK_INK);
      txt(k, p[1], PK_CX + 60, cy + 12, UXB_f(400, 11), PK_ROLE);
      // 方框一直在，选中时填成本人头像色、白对勾弹出
      const on = PK_ON[r], mx = PK_CX + PK_CARDW - 34, my = cy - 9;
      const m = on ? UXB_ramp(u, [[-1, 0], [on[0], 1], [on[1], 0]], 0.16, PK_EASE) : 0;
      if (m > 0.003) { k.fillStyle = rgba(p[2], m); rr(k, mx, my, 18, 18, 6); k.fill(); }
      k.strokeStyle = m > 0.003 ? rgba(lerpC([185, 179, 236], p[2], m), mix(0.45, 1, m)) : 'rgba(185,179,236,0.45)'; k.lineWidth = 1.5; rr(k, mx + 0.75, my + 0.75, 16.5, 16.5, 5.25); k.stroke();
      if (on && u >= on[0]) {
        const sc = u < on[1] ? mix(0.4, 1, PK_TICK(u - on[0])) : mix(1, 0.4, PK_TICK(u - on[1]));
        const al = u < on[1] ? clamp(PK_TICK(u - on[0])) : 1 - clamp(PK_TICK(u - on[1]));
        if (al > 0.003) {
          k.save(); k.translate(mx + 9, my + 9); k.scale(sc * 14 / 24, sc * 14 / 24); k.translate(-12, -12);
          k.globalAlpha = al; k.strokeStyle = '#FFFFFF'; k.lineWidth = 2; k.lineCap = 'round'; k.lineJoin = 'round';
          k.beginPath(); k.moveTo(20, 6); k.lineTo(9, 17); k.lineTo(4, 12); k.stroke(); k.restore();
        }
      }
    }
    // 胶囊：导轨宽度按 220ms 曲线过渡；没人时显示 Unassigned（原作瞬间切换，这里随导轨一起淡出收窄）
    const rail = UXB_ramp(u, PK_CNT.map(([t, n]) => [t, PK_rail(n)]), 0.22, PK_EZ);
    const la = UXB_ramp(u, PK_CNT.map(([t, n]) => [t, n ? 0 : 1]), 0.22, PK_EZ);
    k.font = UXB_f(500, 14); const lw = k.measureText('Unassigned').width;
    const pw = rail + 46 + la * (lw + 6), px = PK_PX, py = PK_PY - 22;
    k.fillStyle = PK_SLAB; rr(k, px, py, pw, 44, PK_R); k.fill();
    if (la > 0.003) {
      k.save(); rr(k, px, py, pw, 44, PK_R); k.clip(); k.globalAlpha = la * la;
      txt(k, 'Unassigned', px + 8 + rail + 6, PK_PY, UXB_f(500, 14), PK_INK, 'left', 'middle'); k.restore();
    }
    // 展开状态的箭头朝上（原作 ChevronDown 旋转 180°）
    const chx = px + 8 + rail + 10 + la * (lw + 6);
    k.save(); k.translate(chx, PK_PY - 8); k.scale(16 / 24, 16 / 24);
    k.strokeStyle = PK_CHEV; k.lineWidth = 2; k.lineCap = 'round'; k.lineJoin = 'round';
    k.beginPath(); k.moveTo(6, 15); k.lineTo(12, 9); k.lineTo(18, 15); k.stroke(); k.restore();
    // 头像：先画下层；第一个人在最上（z 序反排），4.2 秒后退场的 Priya 压在补位的 Nora 下面
    const order = u < 4.2 ? [2, 1, 0] : [1, 2, 0];
    for (const i of order) {
      const on = PK_ON[i]; if (!on || u < on[0]) continue;
      const leave = u >= on[1], end = Math.min(u, on[1] - 1e-6), step = PK_FACE - PK_LAP;
      // 位置：每次前面有人进出，目标格位变一次；紧弹簧是线性的，逐次阶跃叠加即为当前位置
      let x = PK_index(i, on[0]) * step, last = x;
      for (const tc of PK_EVTS) if (tc > on[0] && tc <= end) { const nx = PK_index(i, tc) * step; x += (nx - last) * PK_TIGHT(u - tc); last = nx; }
      const tt = u - (leave ? on[1] : on[0]), a = PK_TIGHT(tt), b = PK_LOOSE(tt);
      const sc = leave ? mix(1, 0.2, a) : mix(0.2, 1, a), dy = leave ? mix(0, -6, a) : mix(-10, 0, a);
      const rot = (leave ? mix(0, 14, b) : mix(-22, 0, b)) * Math.PI / 180;
      const op = leave ? 1 - seg(tt, 0, 0.16) : seg(tt, 0, 0.16);
      if (op <= 0.003) continue;
      k.save(); k.globalAlpha = op; k.translate(px + 8 + x + PK_FACE / 2, PK_PY + dy); k.rotate(rot); k.scale(sc, sc);
      PK_face(k, 0, 0, PK_FACE, PK_CAST[i], true); k.restore();
    }
    k.restore();
    const [hx, hy] = BN_path(u, PK_KEYS);
    for (const tc of PK_CLICKS) ripple(k, BN_path(tc, PK_KEYS)[0], BN_path(tc, PK_KEYS)[1], (u - tc) / 0.5, '255,255,255');
    if (u > 0.2 && u < 4.9) cursor(k, hx, hy, PK_CLICKS.reduce((s, tc) => s + UXB_press(u, tc), 0));
  };

  // @element 82
  // 86 等面积画幅切换（bencho aspect）：淡蓝渐变底上，一张彩色风景插图（蓝天、黄太阳、黄绿/绿/青绿三层山）放在圆角画框里，下面是淡钴蓝底轨、钴蓝滑块的三格分段控件（4:3、1:1、3:4 三个同面积小框图标），初始选中 1:1；
  // 指针 0.3 秒从右下进入，0.9 秒点 4:3、2.4 秒点 3:4、3.9 秒点 1:1，滑块先到（约 0.29 秒），画框随后在 0.52 秒内改宽高（不是缩放），
  // 三种画幅面积相同，图片按 cover 裁切不变形；4.8 秒指针离开，画面停在 1:1 与初始一致直到循环结束。
  const AR_S = 0.6;                                         // 原作 276 方框 + 16 间距 + 36 控件 = 328 高，按 0.6 缩进 208 高的格子（上下各留约 6 px）
  const AR_W = 276, AR_GAP = 16, AR_BAR = 36, AR_TAB = 40, AR_CORNER = 20, AR_MS = 0.52;
  const AR_BG0 = '#EAF4FF', AR_BG1 = '#BCDBFF';            // 淡蓝渐变底
  const AR_BLUE = '#2563EB', AR_NAVY = '#1E3A8A';           // 滑块钴蓝；未选中图标藏蓝
  const AR_SKY0 = '#4FA8F5', AR_SKY1 = '#BFE3FF', AR_SUN = '#FFC83D';
  const AR_SHAPES = [[276, 207], [239, 239], [207, 276]];
  // 图标小框：同面积 13² 的 4:3、1:1、3:4（原作 18×18 视框里的坐标）
  const AR_MARK = [[1.5, 3.38, 15, 11.25], [2.5, 2.5, 13, 13], [3.38, 1.5, 11.25, 15]];
  const AR_EZ = UXA_bz(0.22, 1, 0.36, 1), AR_COL = UXA_bz(0.25, 0.1, 0.25, 1);
  const AR_OX = (CW / AR_S - AR_W) / 2, AR_OY = (CH / AR_S - (AR_W + AR_GAP + AR_BAR)) / 2;
  const AR_TX = AR_OX + (AR_W - (3 * AR_TAB + 4)) / 2, AR_TY = AR_OY + AR_W + AR_GAP;
  // 点击：[时刻, 选中下标]；首项为初值
  const AR_EVS = [[-1, 1], [0.9, 0], [2.4, 2], [3.9, 1]];
  // 指针（缩放后坐标）：落到对应分段中心按下
  const AR_tab = i => [(AR_TX + 2 + AR_TAB * i + AR_TAB / 2) * AR_S, (AR_TY + AR_BAR / 2) * AR_S];
  const AR_KEYS = [[0, 470, 250], [0.8, ...AR_tab(0)], [1.0, ...AR_tab(0)], [2.3, ...AR_tab(2)], [2.5, ...AR_tab(2)],
    [3.8, ...AR_tab(1)], [4.0, ...AR_tab(1)], [4.8, 470, 250]];
  // 原作插图（600×800，SVG 内联数据）的构图：渐变天空、太阳、三层山丘折线；灰阶换成彩色
  const AR_HILLS = [
    ['#9BD86B', [453.0, 429.8, 424.8, 440.5, 468.7, 494.4, 504.0, 492.4, 465.7]],
    ['#3FB56B', [579.7, 606.0, 599.4, 567.0, 544.5, 556.6, 590.0, 608.0, 590.9]],
    ['#139A8C', [665.3, 681.9, 703.8, 711.8, 698.8, 676.3, 664.1, 672.9, 695.0]],
  ];
  // 在 600×800 的原图坐标系里画插图；调用方已按 cover 比例缩放并平移
  function AR_pic(k) {
    const g = k.createLinearGradient(0, 0, 0, 800);
    g.addColorStop(0, AR_SKY0); g.addColorStop(0.7, AR_SKY1);
    k.fillStyle = g; k.fillRect(0, 0, 600, 800);
    k.fillStyle = 'rgba(255,200,61,0.28)'; k.beginPath(); k.arc(342, 257, 78, 0, TAU); k.fill();
    k.fillStyle = AR_SUN; k.beginPath(); k.arc(342, 257, 54, 0, TAU); k.fill();
    for (const [c, ys] of AR_HILLS) {
      k.fillStyle = c; k.beginPath(); k.moveTo(0, 800);
      ys.forEach((y, i) => k.lineTo(i * 75, y)); k.lineTo(600, 800); k.closePath(); k.fill();
    }
  }
  CELLS[81] = (k, w, h, u) => {
    const bg = k.createLinearGradient(0, 0, CW, CH);
    bg.addColorStop(0, AR_BG0); bg.addColorStop(1, AR_BG1);
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    k.save(); k.scale(AR_S, AR_S);
    // 画框宽高：每次点击从当时的尺寸出发，0.52 秒 cubic-bezier(.22,1,.36,1) 过渡
    const fw = UXB_ramp(u, AR_EVS.map(([t, i]) => [t, AR_SHAPES[i][0]]), AR_MS, AR_EZ);
    const fh = UXB_ramp(u, AR_EVS.map(([t, i]) => [t, AR_SHAPES[i][1]]), AR_MS, AR_EZ);
    const fx = AR_OX + (AR_W - fw) / 2, fy = AR_OY + (AR_W - fh) / 2;
    // 同色系的深蓝软阴影，让画框浮在淡蓝底上
    k.save(); k.shadowColor = 'rgba(30,58,138,0.22)'; k.shadowBlur = 18; k.shadowOffsetY = 6;
    k.fillStyle = AR_SKY1; rr(k, fx, fy, fw, fh, AR_CORNER); k.fill(); k.restore();
    k.save(); rr(k, fx, fy, fw, fh, AR_CORNER); k.clip();
    k.fillStyle = AR_SKY1; k.fillRect(fx, fy, fw, fh);
    // cover：以 3:4 原图铺满画框并居中
    const s = Math.max(fw / 600, fh / 800);
    k.translate(fx + fw / 2 - 300 * s, fy + fh / 2 - 400 * s); k.scale(s, s); AR_pic(k);
    k.restore();
    // 分段控件：14% 钴蓝底轨；钴蓝滑块 0.55 倍时长内先于画框到位
    k.fillStyle = 'rgba(37,99,235,0.14)'; rr(k, AR_TX, AR_TY, 3 * AR_TAB + 4, AR_BAR, AR_BAR / 2); k.fill();
    const th = UXB_ramp(u, AR_EVS, AR_MS * 0.55, AR_EZ);
    const bx = AR_TX + 2 + th * AR_TAB;
    k.fillStyle = 'rgba(30,58,138,0.25)'; rr(k, bx, AR_TY + 3, AR_TAB, AR_BAR - 4, (AR_BAR - 4) / 2); k.fill();
    k.fillStyle = AR_BLUE; rr(k, bx, AR_TY + 2, AR_TAB, AR_BAR - 4, (AR_BAR - 4) / 2); k.fill();
    for (let i = 0; i < 3; i++) {
      // 选中项（在钴蓝滑块上）为白色，其余藏蓝；颜色 0.16 秒过渡
      const on = UXB_ramp(u, AR_EVS.map(([t, j]) => [t, j === i ? 1 : 0]), 0.16, AR_COL);
      const pr = AR_EVS.reduce((a, [t, j]) => a + (j === i ? UXB_press(u, t) : 0), 0);
      const cx = AR_TX + 2 + AR_TAB * i + AR_TAB / 2, cy = AR_TY + AR_BAR / 2, sc = 1 - 0.04 * pr;
      const [mx, my, mw, mh] = AR_MARK[i];
      k.save(); k.translate(cx, cy); k.scale(sc, sc); k.translate(-9, -9);
      k.strokeStyle = rgba(UXB_mix(AR_NAVY, '#FFFFFF', on), 1); k.lineWidth = 1.5; rr(k, mx, my, mw, mh, 2); k.stroke();
      k.restore();
    }
    k.restore();
    const [px, py] = BN_path(u, AR_KEYS);
    for (const [t] of AR_EVS.slice(1)) { const [rx, ry] = BN_path(t, AR_KEYS); ripple(k, rx, ry, (u - t) / 0.5, '37,99,235'); }
    if (u > 0.2 && u < 4.9) cursor(k, px, py, AR_EVS.slice(1).reduce((a, [t]) => a + UXB_press(u, t), 0));
  };

  // @element 83
  // 87 配色生成（bencho palette）：深夜蓝渐变底上两块胶囊并排：左边深石板色胶囊里是四格色块组成的色条，右边是珊瑚粉的刷新按键胶囊（白色图标）；
  // 指针 0.5 秒从右下进入停到刷新键，1.2、3.0、4.8 秒各按一次：按键胶囊缩到 0.96、图标转半圈，四格同时收成圆，在最圆时换成新色，再带回弹铺回原位，色条胶囊跟着轻轻一沉一弹；
  // 第三次按下换回第一套颜色，5.6 秒指针离开，画面与第一帧相同。
  const PL_S = 1.4;                                         // 原作 300×78 整体放大 1.4 倍
  const PL_W = 300, PL_PAD = 10, PL_BAR = 58, PL_TOOL = 30, PL_GAP = 6, PL_CORNER = 14, PL_SEAM = 4, PL_N = 4;
  const PL_MS = 0.76, PL_OUT = 0.4;                         // morph 50 → 760ms；在形变最大处（40%）换色
  const PL_BARW = PL_W - (PL_TOOL + PL_PAD * 2) - PL_GAP - PL_PAD * 2;
  const PL_SEG = (PL_BARW - PL_SEAM * (PL_N - 1)) / PL_N, PL_STEP = PL_SEG + PL_SEAM;
  const PL_SLABR = PL_CORNER + PL_PAD;                      // 同心圆角：swatch 14 + 内边距 10
  const PL_OX = (CW / PL_S - PL_W) / 2, PL_OY = (CH / PL_S - (PL_BAR + PL_PAD * 2)) / 2;
  const PL_PRESS = [1.2, 3.0, 4.8];
  const PL_EZ = UXA_bz(0.22, 1, 0.36, 1);
  const PL_BG0 = '#1B1F3B', PL_BG1 = '#0B0D1A';           // 深夜蓝径向渐变底
  const PL_SLAB = '#262B47', PL_EDGE = 'rgba(255,255,255,0.08)', PL_KEY = '#FF5C7A';
  // oklch → hex（Ottosson 矩阵，超色域时逐通道钳制；原作同法）
  function PL_lin(L, C, H) {
    const h = H * Math.PI / 180, a = C * Math.cos(h), b = C * Math.sin(h);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  }
  const PL_hex = (L, C, H) => '#' + PL_lin(L, C, H).map(v => Math.round(clamp(v <= 0.0031308 ? 12.92 * v : 1.055 * Math.abs(v) ** (1 / 2.4) - 0.055) * 255).toString(16).padStart(2, '0')).join('');
  // 色度先要足，再按色域需要逐步回退（原作 vivid）
  function PL_vivid(L, C, H) {
    let c = C;
    while (c > 0.01 && PL_lin(L, c, H).some(v => v < -0.0005 || v > 1.0005)) c -= 0.004;
    return PL_hex(L, c, H);
  }
  // 原作每次按下随机选色相与“情绪”；这里用固定种子的伪随机，三套依次为 ramp、triad、accent，保证每帧可复现；
  // ramp 最深一格提到 L 0.56（原作 0.42）、accent 的对比色提到 L 0.6（原作 0.52），在深色底上也跳得出来
  const PL_PALS = (() => {
    let sd = 5; const rnd = (a, b) => { sd = (sd * 16807) % 2147483647; return a + (sd / 2147483647) * (b - a); };
    const wrap = x => ((x % 360) + 360) % 360;
    let base = 150;
    const make = (mood, dir) => {
      base = wrap(base + rnd(60, 300));
      const out = [];
      for (let i = 0; i < PL_N; i++) {
        const p = i / (PL_N - 1);
        if (mood === 'ramp') { const st = rnd(14, 26) * dir; out.push([0.92 - p * 0.36, 0.12 + Math.sin(p * Math.PI) * 0.12, base + i * st]); }
        else if (mood === 'triad') out.push([rnd(0.58, 0.82), 0.22, base + (i % 3) * 120 * dir + rnd(-8, 8)]);
        else out.push(i === PL_N - 1 ? [0.6, 0.26, base + 180 * dir] : [rnd(0.8, 0.87), 0.18, base + i * 18 * dir]);
      }
      out.sort((x, y) => y[0] - x[0]);                      // 从浅到深排开
      for (const c of out) { const hh = wrap(c[2]); if (hh > 60 && hh < 120 && c[0] < 0.62) c[0] = 0.62 + (0.62 - c[0]) * 0.2; }
      return out.map(([L, C, H]) => PL_vivid(L, C, wrap(H)));
    };
    return [make('ramp', 1), make('triad', -1), make('accent', 1)];
  })();
  // 第 j 次按下把第 j 套换成第 j+1 套；第三次换回第一套，循环无缝
  const PL_pal = j => PL_PALS[j % PL_PALS.length];
  // 形变曲线：快速收拢（三次缓出），在 OUT 处最圆，之后 back-out 回弹过头再落定
  const PL_back = x => { const c = 1.7, v = x - 1; return 1 + (c + 1) * v ** 3 + c * v ** 2; };
  const PL_swell = ti => (ti <= 0 ? 0 : ti >= 1 ? 0 : ti < PL_OUT ? 1 - (1 - ti / PL_OUT) ** 3 : 1 - PL_back((ti - PL_OUT) / (1 - PL_OUT)));
  // 指针（缩放后坐标）：停在刷新键中心
  const PL_BTN = [(PL_OX + PL_W - PL_PAD - PL_TOOL / 2) * PL_S, (PL_OY + PL_PAD + PL_BAR / 2) * PL_S];
  const PL_KEYS = [[0, 600, 250], [1.0, PL_BTN[0], PL_BTN[1]], [5.2, PL_BTN[0], PL_BTN[1]], [5.9, 610, 240]];
  const PL_ICON = ['M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16', 'M8 16H3v5'];
  let PL_P2 = null;
  CELLS[82] = (k, w, h, u) => {
    if (!PL_P2) PL_P2 = PL_ICON.map(d => new Path2D(d));
    const bg = k.createRadialGradient(CW / 2, CH * 0.4, 20, CW / 2, CH / 2, CW * 0.6);
    bg.addColorStop(0, PL_BG0); bg.addColorStop(1, PL_BG1);
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    // 当前这一次换色的进度：最近一次按下后 0.76 秒内为 0→1
    let j = 0, ti = 0;
    for (let i = 0; i < PL_PRESS.length; i++) if (u >= PL_PRESS[i]) { j = i; ti = (u - PL_PRESS[i]) / PL_MS; }
    const started = u >= PL_PRESS[0], run = started && ti < 1;
    const done = started ? (ti >= 1 ? j + 1 : j) : 0;      // 已完成换色的次数
    const sw = run ? PL_swell(ti) : 0, d = Math.max(0, sw);
    const shown = run && ti >= PL_OUT ? PL_pal(j + 1) : PL_pal(done);
    k.save(); k.scale(PL_S, PL_S); k.translate(PL_OX, PL_OY);
    // 色条胶囊：换色时整体缩 3.5%，回弹时略超 1（用未钳制的曲线）
    const slabW = PL_BARW + PL_PAD * 2, slabH = PL_BAR + PL_PAD * 2, beat = 1 - 0.035 * sw;
    k.save(); k.translate(slabW / 2, slabH / 2); k.scale(beat, beat); k.translate(-slabW / 2, -slabH / 2);
    k.save(); k.shadowColor = 'rgba(0,0,0,0.45)'; k.shadowBlur = 16; k.shadowOffsetY = 5;
    k.fillStyle = PL_SLAB; rr(k, 0, 0, slabW, slabH, PL_SLABR); k.fill(); k.restore();
    k.strokeStyle = PL_EDGE; k.lineWidth = 1; rr(k, 0.5, 0.5, slabW - 1, slabH - 1, PL_SLABR - 0.5); k.stroke();
    for (let i = 0; i < PL_N; i++) {
      // 收成圆：宽从 53 收到 0.66×58、高从 58 收到 0.66×58，圆角随之变成半高
      const side = mix(PL_SEG, PL_BAR * 0.66, d), hh = mix(PL_BAR, PL_BAR * 0.66, d);
      k.fillStyle = shown[i]; rr(k, PL_PAD + i * PL_STEP + (PL_SEG - side) / 2, PL_PAD + (PL_BAR - hh) / 2, side, hh, mix(PL_CORNER, hh / 2, d)); k.fill();
    }
    k.restore();
    // 按键胶囊：按下时缩到 0.96（160ms 曲线），图标每按一次累计转 180°（600ms 曲线）
    const tx = slabW + PL_GAP, tw = PL_TOOL + PL_PAD * 2;
    const pr = PL_PRESS.reduce((a, t) => a + UXB_press(u, t), 0), ts = 1 - 0.04 * PL_EZ(clamp(pr));
    k.save(); k.translate(tx + tw / 2, slabH / 2); k.scale(ts, ts); k.translate(-tw / 2, -slabH / 2);
    k.save(); k.shadowColor = 'rgba(255,92,122,0.35)'; k.shadowBlur = 16; k.shadowOffsetY = 5;
    k.fillStyle = PL_KEY; rr(k, 0, 0, tw, slabH, PL_SLABR); k.fill(); k.restore();
    const rot = PL_PRESS.reduce((a, t) => a + Math.PI * PL_EZ(seg(u, t, t + 0.6)), 0);
    // 悬停时白色图标淡到 75%（160ms），指针停在键上即算悬停
    const hv = UXB_ramp(u, [[-1, 0], [0.95, 1], [5.25, 0]], 0.16, out3);
    k.translate(tw / 2, slabH / 2); k.rotate(rot); k.scale(18 / 24, 18 / 24); k.translate(-12, -12);
    k.strokeStyle = `rgba(255,255,255,${1 - 0.25 * hv})`; k.lineWidth = 2; k.lineCap = 'round'; k.lineJoin = 'round';
    for (const p of PL_P2) k.stroke(p);
    k.restore();
    k.restore();
    const [px, py] = BN_path(u, PL_KEYS);
    for (const t of PL_PRESS) ripple(k, PL_BTN[0], PL_BTN[1], (u - t) / 0.5, '255,255,255');
    if (u > 0.4 && u < 5.95) cursor(k, px, py, pr);
  };

  // @element 84
  // 88 分段播放进度（bencho step-player）：淡紫→淡粉渐变底上一颗靛蓝胶囊，里面一排 5 个浅色圆点，第 1 个点是一根空的横条，右边是珊瑚色圆形播放键；
  // 指针 0.2 秒进入，0.8 秒点下播放键，三角变形成暂停键；当前横条每 0.85 秒灌满琥珀黄，满了就用 0.52 秒滑到下一个点（旧条缩回实心点），
  // 落点两侧的点依次竖起一下（尾波）；5.05 秒最后一格灌满，暂停键变回三角；复位段 5.4 秒横条一路滑回第 1 个点，尾波从第 5 个点传回，黄色退空。
  const SP_S = 2.4, SP_N = 5, SP_DOT = 8, SP_BAR = 36, SP_GAP = 8, SP_PAD = 14, SP_H = SP_DOT + SP_PAD * 2;
  const SP_PLAY = 0.8, SP_PACE = 0.85, SP_RESET = 5.4, SP_MOVE = 0.52, SP_LEAD = 0.06, SP_RISE = 0.3, SP_STAG = 0.055;
  const SP_AMP = 0.34, SP_SELF = 0.3, SP_REACH = 8, SP_INK_R = -Math.log(0.78) * 60;  // 原作每帧追 22% → 连续一阶追赶速率
  const SP_END = SP_PLAY + SP_N * SP_PACE;                                           // 最后一格灌满、自动停下
  const SP_TW = SP_GAP + SP_BAR + (SP_N - 1) * (SP_DOT + SP_GAP) - SP_GAP;           // 轨道宽 = layout 最后一个右缘
  const SP_RW = SP_TW + SP_PAD * 2 + 8 + SP_H;                                       // 一行：轨道胶囊 + 8 间距 + 圆钮
  const SP_OX = (CW - SP_RW * SP_S) / 2, SP_OY = (CH - SP_H * SP_S) / 2;
  const SP_BX = SP_OX + (SP_RW - SP_H / 2) * SP_S, SP_BY = SP_OY + SP_H / 2 * SP_S;  // 播放键圆心（格子坐标）
  // 换步事件 [时刻, 从, 到]：播放中每格灌满换下一格；复位段从最后一格回到第 1 格
  const SP_EV = [];
  for (let j = 1; j < SP_N; j++) SP_EV.push([SP_PLAY + j * SP_PACE, j - 1, j]);
  SP_EV.push([SP_RESET, SP_N - 1, 0]);
  const SP_KEYS = [[0.2, 575, 205], [0.62, SP_BX + 3, SP_BY + 5], [0.95, SP_BX + 3, SP_BY + 5], [1.75, 590, 225]];
  const SP_PAUSE_L = [6, 4, 10, 4, 10, 20, 6, 20], SP_PLAY_L = [6.5, 4, 13.25, 8, 13.25, 16, 6.5, 20];
  const SP_PAUSE_R = [14, 4, 18, 4, 18, 20, 14, 20], SP_PLAY_R = [13.25, 8, 20, 12, 20, 12, 13.25, 16];
  const SP_OUTC = UXA_bz(0.22, 1, 0.36, 1), SP_EASE = UXA_bz(0.25, 0.1, 0.25, 1);
  const SP_DOTC = 'rgba(224,231,255,.34)', SP_TRACK = '#4F46E5', SP_INKC = '#FCD34D', SP_BTN = '#FB7185', SP_SHADOW = 'rgba(55,48,163,.28)';
  // 当前步为 at 时每个点的左右缘
  function SP_layout(at) {
    const out = []; let x = 0;
    for (let i = 0; i < SP_N; i++) { const w = i === at ? SP_BAR : SP_DOT; out.push([x, x + w]); x += w + SP_GAP; }
    return out;
  }
  // 点 i 的墨量：目标值分段（0 → 本格进度线性 0..1 → 1 → 复位后 0），墨量按速率 SP_INK_R 一阶追赶目标（解析解逐段推进）
  function SP_ink(i, u) {
    const s = SP_PLAY + i * SP_PACE;
    const segs = [[0, 0, 0], [s, 0, 1 / SP_PACE], [s + SP_PACE, 1, 0], [SP_RESET, 0, 0]];
    let y = 0;
    for (let j = 0; j < segs.length; j++) {
      const [t0, a, b] = segs[j], t1 = j + 1 < segs.length ? segs[j + 1][0] : Infinity;
      if (u <= t0) break;
      const t = Math.min(u, t1) - t0, c = b / SP_INK_R;
      y = a + b * t - c + (y - a + c) * Math.exp(-SP_INK_R * t);
    }
    return y;
  }
  // 两组四边形之间插值后描成路径（播放三角 ↔ 暂停双竖条是同一组 8 个点）
  function SP_quad(k, a, b, t, dx) {
    k.beginPath();
    for (let i = 0; i < 8; i += 2) k[i ? 'lineTo' : 'moveTo'](mix(a[i], b[i], t) + dx, mix(a[i + 1], b[i + 1], t));
    k.closePath(); k.fill(); k.stroke();
  }
  CELLS[83] = (k, w, h, u) => {
    const bg = k.createLinearGradient(0, 0, CW, CH); bg.addColorStop(0, '#E0E7FF'); bg.addColorStop(1, '#FCE7F3');
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    // 最近一次换步：边缘从旧布局缓到新布局（ease-out 0.52 秒）；两次换步间隔大于 0.52 秒，旧缓动已走完
    let ev = null; for (const e of SP_EV) if (u >= e[0]) ev = e;
    const A = SP_layout(ev ? ev[1] : 0), B = SP_layout(ev ? ev[2] : 0), mv = ev ? out3(seg(u, ev[0], ev[0] + SP_MOVE)) : 1;
    const cur = ev ? ev[2] : 0;
    k.save(); k.translate(SP_OX, SP_OY); k.scale(SP_S, SP_S);
    // 轨道胶囊
    k.save(); k.shadowColor = SP_SHADOW; k.shadowBlur = 12; k.shadowOffsetY = 3;
    k.fillStyle = SP_TRACK; rr(k, 0, 0, SP_TW + SP_PAD * 2, SP_H, SP_H / 2); k.fill(); k.restore();
    for (let i = 0; i < SP_N; i++) {
      const l = mix(A[i][0], B[i][0], mv), r = mix(A[i][1], B[i][1], mv), dw = Math.max(0, r - l);
      // 尾波：越过的点按越过顺序竖起，落点最后（份额 0.3）
      let sy = 1;
      if (ev) {
        const from = ev[1], org = ev[2], span = Math.abs(org - from), skip = Math.max(0, span - SP_REACH);
        let delay = -1, share = 1;
        if (i === org) { delay = Math.min(span, SP_REACH) * SP_STAG; share = SP_SELF; }
        else if (i >= Math.min(from, org) && i <= Math.max(from, org)) { const q = Math.abs(i - from); if (span - q <= SP_REACH) delay = (q - skip) * SP_STAG; }
        if (delay >= 0) { const p = (u - ev[0] - SP_LEAD - delay) / SP_RISE; if (p > 0 && p < 1) sy = 1 + Math.sin(Math.PI * p) * SP_AMP * share; }
      }
      k.save(); k.translate(SP_PAD + l, SP_PAD + SP_DOT / 2); k.scale(1, sy);
      k.fillStyle = SP_DOTC; rr(k, 0, -SP_DOT / 2, dw, SP_DOT, SP_DOT / 2); k.fill();
      const ink = SP_ink(i, u);
      if (ink > 0.001) {
        const iw = Math.max(Math.min(SP_DOT, dw), dw * Math.min(1, ink));
        k.globalAlpha = i === cur ? Math.min(1, ink * 14) : 1;
        k.fillStyle = SP_INKC; rr(k, 0, -SP_DOT / 2, iw, SP_DOT, SP_DOT / 2); k.fill();
      }
      k.restore();
    }
    // 播放键：按下时整颗圆钮缩到 0.96；图形在暂停（0）与播放（1）之间 0.3 秒变形，中途挤扁、两半靠拢、倾斜
    const bx = SP_RW - SP_H / 2, by = SP_H / 2;
    const sc = UXB_ramp(u, [[0, 1], [0.7, 0.96], [SP_PLAY, 1]], 0.16, SP_OUTC);
    k.save(); k.translate(bx, by); k.scale(sc, sc);
    const hv = UXB_ramp(u, [[0, 0], [0.56, 1], [1.05, 0]], 0.16, SP_EASE);
    k.save(); k.shadowColor = 'rgba(190,18,60,.3)'; k.shadowBlur = 12; k.shadowOffsetY = 3;
    k.fillStyle = rgba(UXB_mix(SP_BTN, '#F43F5E', hv), 1); k.beginPath(); k.arc(0, 0, SP_H / 2, 0, TAU); k.fill(); k.restore();
    const t = UXB_ramp(u, [[0, 1], [SP_PLAY, 0], [SP_END, 1]], 0.3, inOut3), goo = Math.sin(clamp(t) * Math.PI);
    const playing = u >= SP_PLAY && u < SP_END, tip = (playing ? -9 : 9) * goo * Math.PI / 180;
    const col = '#FFFFFF';
    k.rotate(tip); k.scale((1 - 0.13 * goo) * 14 / 24, (1 + 0.11 * goo) * 14 / 24); k.translate(-12, -12);
    k.fillStyle = col; k.strokeStyle = col; k.lineWidth = 2; k.lineJoin = 'round';
    SP_quad(k, SP_PAUSE_L, SP_PLAY_L, t, 1.6 * goo); SP_quad(k, SP_PAUSE_R, SP_PLAY_R, t, -1.6 * goo);
    k.restore();
    k.restore();
    if (u > 0.2 && u < 1.75) { const p = BN_path(u, SP_KEYS); cursor(k, p[0], p[1], seg(u, 0.66, 0.7) * (1 - seg(u, 0.8, 0.86))); }
  };

  // @element 85
  // 89 胶囊融开菜单（bencho liq-create）：淡青→奶油渐变底中央一颗 104×38 的紫罗兰→品红渐变「+ Create」胶囊（白字）；指针 0.3 秒进入，1.0 秒点下，胶囊缩到 0.94，
  // 0.06 秒后不过冲的弹簧把它撑开成 212×166、圆角 20 的面板，四行菜单按 0.022 秒间隔浮上，每行图标放在一块不同颜色的小方块里；指针在行间移动，所在行铺上半透明白底；
  // 3.8 秒在面板外按下，行立即淡出，面板收回胶囊、文字回来；4.75 秒指针离开，之后静止到周期结束（与 u=0 画面相同）。
  const LC_S = 1.12, LC_CX = CW / 2, LC_CY = CH / 2;
  const LC_PILL_W = 18 + 8 + 44 + 34, LC_PILL_H = 38, LC_PANEL_W = 212, LC_PANEL_H = 166;
  const LC_CORNER = 20, LC_SHUT_R = Math.min(19, LC_CORNER * 19 / 20), LC_ROW_R = Math.min(17, LC_CORNER - 10);
  const LC_PRESS = 1.0, LC_OPEN = LC_PRESS + 0.06, LC_CLOSE = 3.8;
  // Framer 弹簧 stiffness 420 / damping 30 / mass 0.5：ζ≈1.035 略过阻尼，静止起步的解析解（无过冲）
  const LC_W0 = Math.sqrt(420 / 0.5), LC_Z = 30 / (2 * Math.sqrt(420 * 0.5)), LC_SD = Math.sqrt(LC_Z * LC_Z - 1);
  const LC_R1 = -LC_W0 * (LC_Z - LC_SD), LC_R2 = -LC_W0 * (LC_Z + LC_SD);
  const LC_spring = t => (t <= 0 ? 0 : t > 1.5 ? 1 : 1 - (LC_R2 * Math.exp(LC_R1 * t) - LC_R1 * Math.exp(LC_R2 * t)) / (LC_R2 - LC_R1));
  const LC_OUTC = UXA_bz(0.22, 1, 0.36, 1), LC_EASE = UXA_bz(0.25, 0.1, 0.25, 1);
  const LC_ITEMS = ['Document', 'Spreadsheet', 'Board', 'Folder'];
  const LC_TILE = ['#FBBF24', '#34D399', '#38BDF8', '#FB923C'], LC_GLYPH = '#2E1065';   // 每行图标底块一种色相，深紫图形
  // lucide 图标（24 格 viewBox，描边 2）：FileText / Table2 / Grid2x2 / Folder，以及胶囊上的 Plus
  const LC_ICON = [
    ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', 'M14 2v4a2 2 0 0 0 2 2h4', 'M10 9H8', 'M16 13H8', 'M16 17H8'],
    ['M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18'],
    ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z', 'M3 12h18', 'M12 3v18'],
    ['M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'],
    ['M5 12h14', 'M12 5v14'],
  ];
  let LC_P2D = null;
  function LC_icon(k, i, x, y, col) {
    if (!LC_P2D) LC_P2D = LC_ICON.map(ps => ps.map(d => new Path2D(d)));
    k.save(); k.translate(x, y); k.scale(16 / 24, 16 / 24);
    k.strokeStyle = col; k.lineWidth = 2; k.lineCap = 'round'; k.lineJoin = 'round';
    for (const p of LC_P2D[i]) k.stroke(p);
    k.restore();
  }
  // 行 i 在舞台坐标（以面板中心为原点、CSS px）里的上缘：面板内边距 12，行高 34，行距 2
  const LC_rowY = i => -LC_PANEL_H / 2 + 12 + i * 36;
  const LC_KEYS = [[0.3, 486, 222], [0.85, LC_CX + 6, LC_CY + 8], [1.2, LC_CX + 6, LC_CY + 8], [1.75, LC_CX - 12, LC_CY - 20], [2.3, LC_CX - 12, LC_CY - 20],
    [2.75, LC_CX + 22, LC_CY - 60], [3.05, LC_CX + 22, LC_CY - 60], [3.5, 452, 70], [3.9, 452, 70], [4.75, 578, 232]];
  // 指针所在的菜单行（-1 = 不在行上；面板关着时不响应悬停）
  function LC_hit(u) {
    if (u < LC_OPEN || u >= LC_CLOSE) return -1;
    const [px, py] = BN_path(u, LC_KEYS), x = (px - LC_CX) / LC_S, y = (py - LC_CY) / LC_S;
    if (Math.abs(x) > LC_PANEL_W / 2 - 12) return -1;
    for (let i = 0; i < 4; i++) if (y >= LC_rowY(i) && y < LC_rowY(i) + 34) return i;
    return -1;
  }
  const LC_HEV = UXB_changes(LC_hit);
  // 带各自时长的过渡：evs[0] = [-1, 初值]，其后 [时刻, 目标, 时长]；每次从当时的值出发（等价分别设了 transition 的 CSS 属性）
  function LC_ramp(u, evs, ez) {
    let from = evs[0][1], to = from, t0 = -1e9, d = 1;
    for (let i = 1; i < evs.length; i++) {
      const e = evs[i]; if (e[0] > u) break;
      from = mix(from, to, ez(seg(e[0], t0, t0 + d))); to = e[1]; t0 = e[0]; d = e[2];
    }
    return mix(from, to, ez(seg(u, t0, t0 + d)));
  }
  // 行 i 的悬停程度：进 0.16 秒、出 0.22 秒
  function LC_hover(u, i) {
    const evs = [[-1, 0]];
    for (let j = 1; j < LC_HEV.length; j++) { const [t, v] = LC_HEV[j], on = v === i ? 1 : 0; if (on !== evs[evs.length - 1][1]) evs.push([t, on, on ? 0.16 : 0.22]); }
    return LC_ramp(u, evs, LC_EASE);
  }
  CELLS[84] = (k, w, h, u) => {
    const bg = k.createLinearGradient(0, 0, CW, CH); bg.addColorStop(0, '#CFFAFE'); bg.addColorStop(1, '#FEF3C7');
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    // 形状：开时从胶囊弹到面板，关时弹回；两次之间早已静止，所以各自从静止起步
    const sOpen = LC_spring(u - LC_OPEN), sShut = LC_spring(u - LC_CLOSE), p = u < LC_CLOSE ? sOpen : 1 - sShut;
    const bw = mix(LC_PILL_W, LC_PANEL_W, p), bh = mix(LC_PILL_H, LC_PANEL_H, p), br = mix(LC_SHUT_R, LC_CORNER, p);
    // 按下：0.16 秒缩到 0.94；张开后 0.42 秒回到 1
    const sc = LC_ramp(u, [[-1, 1], [LC_PRESS, 0.94, 0.16], [LC_OPEN, 1, 0.42]], LC_OUTC);
    const pillA = LC_ramp(u, [[-1, 1], [LC_OPEN, 0, 0.16], [LC_CLOSE, 1, 0.16]], LC_EASE);
    k.save(); k.translate(LC_CX, LC_CY); k.scale(LC_S, LC_S);
    k.save(); k.scale(sc, sc);
    // 同一块形状从胶囊到面板，渐变跟着形状的对角拉伸；阴影用同色系深紫
    const gr = k.createLinearGradient(-bw / 2, -bh / 2, bw / 2, bh / 2); gr.addColorStop(0, '#7C3AED'); gr.addColorStop(1, '#DB2777');
    k.save(); k.shadowColor = 'rgba(76,29,149,.32)'; k.shadowBlur = 16; k.shadowOffsetY = 5;
    k.fillStyle = gr; rr(k, -bw / 2, -bh / 2, bw, bh, br); k.fill(); k.restore();
    // 胶囊上的「+ Create」
    if (pillA > 0.002) {
      k.globalAlpha = pillA; k.font = UXB_f(600, 13); const tw = k.measureText('Create').width, x0 = -(16 + 8 + tw) / 2;
      LC_icon(k, 4, x0, -8, '#FFFFFF'); txt(k, 'Create', x0 + 24, 0.5, UXB_f(600, 13), '#FFFFFF', 'left', 'middle');
      k.globalAlpha = 1;
    }
    k.restore();
    // 行裁在当前形状里（面板还在撑开时不会露到外面，原作 overflow: hidden）
    k.save(); rr(k, -bw / 2 * sc, -bh / 2 * sc, bw * sc, bh * sc, br * sc); k.clip();
    // 菜单行：张开时第 i 行延迟 0.03 + 0.022 i 秒，透明度 0.16 秒、上移 6 px 用 0.22 秒；关上时无延迟退回
    for (let i = 0; i < 4; i++) {
      const dl = 0.03 + i * 0.022;
      const a = LC_ramp(u, [[-1, 0], [LC_OPEN + dl, 1, 0.16], [LC_CLOSE, 0, 0.16]], LC_EASE);
      if (a < 0.002) continue;
      const dy = LC_ramp(u, [[-1, 6], [LC_OPEN + dl, 0, 0.22], [LC_CLOSE, 6, 0.22]], LC_OUTC);
      const hv = LC_hover(u, i), x = -LC_PANEL_W / 2 + 12, y = LC_rowY(i) + dy, rw = LC_PANEL_W - 24;
      k.globalAlpha = a;
      if (hv > 0.002) { k.fillStyle = `rgba(255,255,255,${0.18 * hv})`; rr(k, x, y, rw, 34, LC_ROW_R); k.fill(); }
      k.fillStyle = LC_TILE[i]; rr(k, x + 12, y + 5, 24, 24, 7); k.fill();
      LC_icon(k, i, x + 16, y + 9, LC_GLYPH);
      txt(k, LC_ITEMS[i], x + 46, y + 17.5, UXB_f(500, 13), `rgba(255,255,255,${0.9 + 0.1 * hv})`, 'left', 'middle');
      k.globalAlpha = 1;
    }
    k.restore();
    k.restore();
    if (u > 0.3 && u < 4.75) {
      const [px, py] = BN_path(u, LC_KEYS);
      ripple(k, px, py, seg(u, LC_PRESS, LC_PRESS + 0.5), '255,255,255'); ripple(k, px, py, seg(u, LC_CLOSE, LC_CLOSE + 0.5), '124,58,237');
      cursor(k, px, py, Math.max(UXB_press(u, LC_PRESS), UXB_press(u, LC_CLOSE)));
    }
  };

  // @element 86
  // 90 自动化步骤卡（bencho action-node）：薄荷→天蓝渐变底上一张深青绿节点卡「Node 07」（白字、彩色头像），玫红/橙/蓝/紫四颗圆形按钮藏在卡片右上角底下；
  // 指针 1.0 秒进入卡片，按钮按 0.05 秒间隔沿圆角外的弧线带一点回弹地滑出、由 0.82 放大到 1，卡片同时上抬 1 px；指针停到哪颗按钮它就放大到 1.12；
  // 3.8 秒指针离开，按钮倒序（最后一颗先走）缩回角落；4.5 秒后静止到周期结束（与 u=0 画面相同）。
  const AN_S = 0.8, AN_CW = 272, AN_PAD = 20, AN_COR = 20, AN_DOT = 36, AN_R = AN_DOT / 2, AN_N = 4;
  const AN_IN = 1.0, AN_OUT = 3.8, AN_GAP = 0.55 * 0.09;              // stagger 55 → 55% × 90 ms 一拍
  const AN_OFF = 6 + 0.25 * 24 + AN_R, AN_ARC = AN_COR + AN_OFF, AN_LEN = AN_ARC * Math.PI / 2;
  const AN_SAY = 'Reads the thread, writes a summary, and posts it back to the channel it came from.';
  const AN_CREW = [['P', '#F472B6'], ['M', '#FBBF24'], ['A', '#60A5FA']];
  const AN_BTNC = ['#F43F5E', '#F97316', '#3B82F6', '#8B5CF6'], AN_CARD0 = '#0F766E', AN_CARD1 = '#115E59';
  // 按钮停靠点：沿「圆角外 off 处」的轨道，四颗以弧中点为中心、按 48 px 间距排开（原作 ride()）
  function AN_ride(s) {
    if (s <= 0) return [-AN_COR + s, -AN_OFF];
    if (s >= AN_LEN) return [AN_OFF, AN_COR + (s - AN_LEN)];
    const th = Math.PI / 2 - s / AN_ARC;
    return [-AN_COR + AN_ARC * Math.cos(th), AN_COR - AN_ARC * Math.sin(th)];
  }
  const AN_SPOT = [0, 1, 2, 3].map(i => AN_ride(AN_LEN / 2 + (i - (AN_N - 1) / 2) * (AN_DOT + 12)));
  const AN_HID = [-AN_COR, AN_COR];                                     // 收起时圆心在角内 20 px，整颗被卡片盖住
  // 原作逐帧弹簧（bounce 20：k 0.112、阻尼 0.66，60 fps 一帧一步），这里预先算好 0→1 的阶跃响应表
  const AN_SPR = (() => {
    const out = [0]; let c = 0, v = 0;
    for (let f = 0; f < 240; f++) {
      v += (1 - c) * 0.112; v *= 0.66; c += v;
      if (Math.abs(1 - c) < 0.0002 && Math.abs(v) < 0.0002) { out.push(1); break; }
      out.push(c);
    }
    return out;
  })();
  const AN_spr = t => { if (t <= 0) return 0; const f = t * 60, i = Math.floor(f); return i + 1 >= AN_SPR.length ? 1 : mix(AN_SPR[i], AN_SPR[i + 1], f - i); };
  // 第 i 颗的展开量：进入时按 i 依次弹出，离开时倒序弹回（两次之间早已静止）
  const AN_amt = (u, i) => clamp(u < AN_OUT ? AN_spr(u - AN_IN - i * AN_GAP - 1 / 60) : 1 - AN_spr(u - AN_OUT - (AN_N - 1 - i) * AN_GAP - 1 / 60), 0, 1.4);
  const AN_ICON = [
    ['M9 17H7A5 5 0 0 1 7 7h2', 'M15 7h2a5 5 0 1 1 0 10h-2', 'M8 12h8'],
    ['M5 12h14', 'M12 5v14'],
    ['M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z', 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2'],
    ['M20 7h-9', 'M14 17H5', 'M20 17a3 3 0 1 1-6 0a3 3 0 1 1 6 0', 'M10 7a3 3 0 1 1-6 0a3 3 0 1 1 6 0'],
    ['M15 12a3 3 0 1 1-6 0a3 3 0 1 1 6 0', 'M3 12h6', 'M15 12h6'],       // GitCommitHorizontal：卡片标志
  ];
  let AN_P2D = null;
  function AN_icon(k, i, x, y, size, col) {
    if (!AN_P2D) AN_P2D = AN_ICON.map(ps => ps.map(d => new Path2D(d)));
    k.save(); k.translate(x - size / 2, y - size / 2); k.scale(size / 24, size / 24);
    k.strokeStyle = col; k.lineWidth = 2; k.lineCap = 'round'; k.lineJoin = 'round';
    for (const p of AN_P2D[i]) k.stroke(p);
    k.restore();
  }
  // 版面：说明固定折成 3 行（卡片高度和指针路径都按 3 行算）；实测最宽一行超过 232 px 时整体缩小字号，不会溢出
  const AN_LINES = ['Reads the thread, writes a summary,', 'and posts it back to the channel it', 'came from.'];
  let AN_FS = 0;
  function AN_layout(k) {
    if (!AN_FS) { k.font = UXB_f(400, 13); const mw = Math.max(...AN_LINES.map(l => k.measureText(l).width)); AN_FS = Math.min(13, 13 * (AN_CW - AN_PAD * 2) / mw); }
    const ch = AN_PAD + 30 + 13 + AN_LINES.length * 19.5 + 16 + 24 + AN_PAD, reach = AN_OFF + AN_R;
    const ox = (CW - (AN_CW + reach) * AN_S) / 2, oy = (CH - (ch + reach) * AN_S) / 2 + reach * AN_S;
    return { ch, ox, oy, cx: ox + AN_CW * AN_S, cy: oy };
  }
  // 第 i 颗按钮此刻的圆心（相对卡片右上角，CSS px）与缩放
  function AN_btn(u, i) {
    const a = AN_amt(u, i);
    return [mix(AN_HID[0], AN_SPOT[i][0], a), mix(AN_HID[1], AN_SPOT[i][1], a), 0.82 + 0.18 * Math.min(a, 1)];
  }
  const AN_CH = AN_PAD + 30 + 13 + 3 * 19.5 + 16 + 24 + AN_PAD, AN_REACH = AN_OFF + AN_R;
  const AN_CX = (CW - (AN_CW + AN_REACH) * AN_S) / 2 + AN_CW * AN_S, AN_CY = (CH - (AN_CH + AN_REACH) * AN_S) / 2 + AN_REACH * AN_S;  // 卡片右上角（格子坐标）
  const AN_P = (x, y) => [AN_CX + x * AN_S, AN_CY + y * AN_S];
  const AN_KEYS = [[0.3, 492, 214], [1.0, ...AN_P(-12, 96)], [1.5, ...AN_P(-70, 60)], [1.8, ...AN_P(-70, 60)],
    [2.2, ...AN_P(AN_SPOT[1][0] + 2, AN_SPOT[1][1] + 3)], [2.65, ...AN_P(AN_SPOT[1][0] + 2, AN_SPOT[1][1] + 3)],
    [2.95, ...AN_P(AN_SPOT[2][0] + 2, AN_SPOT[2][1] + 3)], [3.4, ...AN_P(AN_SPOT[2][0] + 2, AN_SPOT[2][1] + 3)],
    [3.8, ...AN_P(AN_OFF + AN_R + 10, 40)], [4.5, 560, 236]];
  // 指针压着哪颗按钮（-1 = 都没有）
  function AN_hot(u) {
    if (u < AN_IN || u >= AN_OUT) return -1;
    const [px, py] = BN_path(u, AN_KEYS);
    for (let i = 0; i < AN_N; i++) { const [x, y, s] = AN_btn(u, i), q = AN_P(x, y); if (Math.hypot(px - q[0], py - q[1]) < AN_R * s * AN_S) return i; }
    return -1;
  }
  const AN_HOT = UXB_changes(AN_hot), AN_BACK = UXA_bz(0.24, 1.34, 0.38, 1);
  // 第 i 颗的悬停放大 1 → 1.12（0.16 秒、略过冲）
  function AN_zoom(u, i) {
    const evs = [[0, 1]];
    for (let j = 1; j < AN_HOT.length; j++) { const on = AN_HOT[j][1] === i ? 1.12 : 1; if (on !== evs[evs.length - 1][1]) evs.push([AN_HOT[j][0], on]); }
    return UXB_ramp(u, evs, 0.16, AN_BACK);
  }
  CELLS[85] = (k, w, h, u) => {
    const bg = k.createLinearGradient(0, 0, CW, CH); bg.addColorStop(0, '#D1FAE5'); bg.addColorStop(1, '#DBEAFE');
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    const L = AN_layout(k);
    // 按钮在卡片底下：先画
    for (let i = 0; i < AN_N; i++) {
      const [x, y, s] = AN_btn(u, i), z = s * AN_zoom(u, i);
      k.save(); k.translate(L.cx + x * AN_S, L.cy + y * AN_S); k.scale(AN_S * z, AN_S * z);
      k.fillStyle = AN_BTNC[i]; k.beginPath(); k.arc(0, 0, AN_R, 0, TAU); k.fill();
      AN_icon(k, i, 0, 0, 16, '#FFFFFF');
      k.restore();
    }
    // 卡片：展开期间上抬 1 px（0.22 秒、略过冲）
    const lift = UXB_ramp(u, [[0, 0], [AN_IN, -1], [AN_OUT, 0]], 0.22, AN_BACK);
    k.save(); k.translate(L.ox, L.oy + lift * AN_S); k.scale(AN_S, AN_S);
    const cg = k.createLinearGradient(0, 0, AN_CW, L.ch); cg.addColorStop(0, AN_CARD0); cg.addColorStop(1, AN_CARD1);
    k.save(); k.shadowColor = 'rgba(19,78,74,.3)'; k.shadowBlur = 14; k.shadowOffsetY = 4;
    k.fillStyle = cg; rr(k, 0, 0, AN_CW, L.ch, AN_COR); k.fill(); k.restore();
    k.fillStyle = 'rgba(255,255,255,.16)'; rr(k, AN_PAD, AN_PAD, 30, 30, Math.min(15, AN_COR * 0.47)); k.fill();
    AN_icon(k, 4, AN_PAD + 15, AN_PAD + 15, 18, '#FFFFFF');
    k.save(); k.letterSpacing = '-0.16px'; txt(k, 'Node 07', AN_PAD + 38, AN_PAD + 15.5, UXB_f(500, 16), '#FFFFFF', 'left', 'middle'); k.restore();
    let y = AN_PAD + 30 + 13;
    AN_LINES.forEach((ln, j) => txt(k, ln, AN_PAD, y + 10 + j * 19.5, UXB_f(400, AN_FS), 'rgba(236,253,245,.84)', 'left', 'middle'));
    y += AN_LINES.length * 19.5 + 16;
    // 头像叠成一摞：24 px 彩色圆、后一个压前一个 6 px，外圈 2 px 卡片色
    AN_CREW.forEach(([c, g], j) => {
      const x = AN_PAD + 12 + j * 18;
      k.fillStyle = AN_CARD0; k.beginPath(); k.arc(x, y + 12, 14, 0, TAU); k.fill();
      k.fillStyle = g; k.beginPath(); k.arc(x, y + 12, 12, 0, TAU); k.fill();
      txt(k, c, x, y + 12.5, UXB_f(600, 10), '#1F2937', 'center', 'middle');
    });
    txt(k, '+3', AN_PAD + 3 * 18 + 6 + 8, y + 12.5, UXB_f(500, 11), '#99F6E4', 'left', 'middle');
    k.restore();
    if (u > 0.3 && u < 4.5) { const [px, py] = BN_path(u, AN_KEYS); cursor(k, px, py, 0); }
  };

  // @element 87
  // 87 液体晃荡滑块（bencho slosh）：深海蓝到蓝绿的渐变底上一条 416×52 的胶囊凹槽，亮青色液体初始填到 62，液面略低于槽口、带自然微波，一根白色细把手立在液面前缘、顶端贴在液面上；上方左对齐的 Flow 标签和右对齐的滚动读数；
  // 指针 0.2 秒从右下进入、0.5 秒落到把手上，0.6 秒按住泛起一小圈浅环，0.6–1.05 秒往左拖到 30 停顿，1.14 秒起猛地往右甩、1.32 秒中途松手：液体落在把手后面、液面向右涌起，把手带着松手时的速度滑到 96 停下；
  // 3.45 秒再按住，0.27 秒内快速拖回 20 停住：液面向左倾、漫过把手约 20 px 并在把手旁涌起，表面荡起行波、前缘泛起泡沫，液面在把手两侧来回晃几下，4.3 秒静止；3.85 秒松手，指针 4.9 秒从下方离开；复位段 5.4–6.2 秒把手和液体一起缓回 62。
  const SLO_S = 1.3;                                        // 原作 320×40 的滑槽放大 1.3 倍
  const SLO_W = 416, SLO_H = 52, SLO_R = 20 * SLO_S;        // corner 20 = 半高，胶囊形
  const SLO_X = (CW - SLO_W) / 2, SLO_Y = 90, SLO_CY = SLO_Y + SLO_H / 2;
  const SLO_VISC = 15, SLO_MOM = 55, SLO_TILT = 45, SLO_V0 = 62, SLO_FPS = 60;
  // 两次按住的时段 [按下, 松手]；第二次按下的位置要等第一次滑行停稳后才知道，在 SLO_sim 里补上
  const SLO_G1 = [0.6, 1.32], SLO_G2 = [3.45, 3.85];
  // 第一次：0.6–1.05 秒拖到 30 停顿，1.14 秒起猛地往右甩、在 1.32 秒中途松手（样条通往 1.5 秒的 78，松手时正处在最快段）
  const SLO_K1 = [[0.6, 62, 0], [1.05, 30, 0], [1.14, 30, 0], [1.5, 78, 0]];
  const SLO_vx = v => SLO_X + v / 100 * SLO_W;
  const SLO_fx = f => SLO_X + f / 100 * SLO_W;              // 液面前缘的中心 x
  let SLO_D = null;
  // 按原作逐帧（60 fps，dt = 1）的递推算出整段 0–5.4 秒的把手值、液体值和液体速度，只算一次；之后每帧按 u 在相邻两帧间插值，仍是 u 的纯函数
  function SLO_sim() {
    if (SLO_D) return SLO_D;
    const N = Math.ceil(SHOW * SLO_FPS) + 1, V = new Float64Array(N + 1), F = new Float64Array(N + 1), FV = new Float64Array(N + 1);
    const soft = SLO_VISC / 100, stiff = 0.34 - soft * 0.29, damp = 0.74 + soft * 0.22, fric = 0.86 + SLO_MOM / 100 * 0.115;
    let val = SLO_V0, hv = 0, fill = SLO_V0, fv = 0, wasHeld = false, K2 = null;
    const keyVal = (u, keys) => BN_path(u, keys)[0];
    for (let f = 0; f <= N; f++) {
      const u = f / SLO_FPS;
      if (!K2 && u >= SLO_G2[0]) K2 = [[SLO_G2[0], val, 0], [3.72, 20, 0], [SLO_G2[1], 20, 0]];   // 第二次：0.27 秒拖回 20，停住再松手（不滑行）
      const g = u >= SLO_G1[0] && u < SLO_G1[1] ? SLO_K1 : K2 && u >= SLO_G2[0] && u < SLO_G2[1] ? K2 : null;
      if (g) {
        // 按住：把手刚性地跟着指针；速度取上一帧到这一帧的差（原作 pointermove 的两点差，单位 %/帧）
        const nv = clamp(keyVal(u, g), 0, 100);
        hv = wasHeld ? nv - val : 0; val = nv; wasHeld = true;
      } else {
        if (wasHeld) { hv = clamp(hv, -6, 6); wasHeld = false; }   // 松手：带着真实速度离开，限幅 ±6
        if (hv) {
          val += hv; hv *= fric;                                    // 滑行：摩擦按帧乘
          if (val <= 0 || val >= 100) { val = clamp(val, 0, 100); hv = 0; }
          if (Math.abs(hv) < 0.01) hv = 0;
        }
      }
      // 液体：把手后面的第二个弹簧，偏软、阻尼小；撞到端壁按 0.42 反弹
      fv += (val - fill) * stiff; fv *= damp; fill += fv;
      if (fill > 100) { fill = 100; fv = -fv * 0.42; } else if (fill < 0) { fill = 0; fv = -fv * 0.42; }
      if (Math.abs(val - fill) < 0.02 && Math.abs(fv) < 0.02) { fill = val; fv = 0; }
      V[f] = val; F[f] = fill; FV[f] = fv;
    }
    const at = t => V[Math.round(t * SLO_FPS)];
    const r1 = at(SLO_G1[1]), v1 = at(SLO_G2[0]), r2 = at(SLO_G2[1]);
    // 指针：0.2 秒从右下进入，0.5 秒落到把手上；松手后跟着惯性挪一点、抬起，再落到停稳的把手上；第二次松手后从下方离开
    const P0 = [[0.2, 575, 205], [0.5, SLO_vx(SLO_V0), SLO_CY]];   // 先落稳再按（0.52 秒起压下）
    const P1 = [[SLO_G1[1], SLO_vx(r1), SLO_CY], [1.7, SLO_vx(r1) + 40, SLO_CY - 10], [2.9, SLO_vx(v1) + 16, SLO_CY - 26], [3.35, SLO_vx(v1), SLO_CY]];
    const P2 = [[SLO_G2[1], SLO_vx(r2), SLO_CY], [4.25, SLO_vx(r2) + 8, SLO_CY + 24], [4.9, SLO_vx(r2) + 64, CH + 30]];
    const vr1 = (at(SLO_G1[1]) - V[Math.round(SLO_G1[1] * SLO_FPS) - 1]) * SLO_FPS * SLO_W / 100;   // 松手瞬间把手的速度 px/s
    SLO_D = { V, F, FV, N, P0, P1, P2, vr1, end: V[N] };
    return SLO_D;
  }
  // 展示段按 u 在相邻两帧之间线性插值，返回 [把手值, 液体值, 液体速度]
  function SLO_at(u) {
    const D = SLO_sim(), q = Math.min(u, SHOW) * SLO_FPS, i = Math.min(D.N - 1, Math.floor(q)), t = q - i;
    return [mix(D.V[i], D.V[i + 1], t), mix(D.F[i], D.F[i + 1], t), mix(D.FV[i], D.FV[i + 1], t)];
  }
  // 松手后的指针：手先顺着松手时的速度 vr（px/s）按 0.08 秒时间常数减速前冲，0.45 秒内渐渐交给后面的路径，速度不断档
  function SLO_after(u, t0, vr, keys) {
    const t = u - t0, dx = vr * 0.08 * (1 - Math.exp(-t / 0.08)), w = inOut3(seg(u, t0, t0 + 0.45)), q = BN_path(u, keys);
    return [mix(SLO_vx(SLO_at(t0)[0]) + dx, q[0], w), mix(keys[0][2], q[1], w)];
  }
  // 按住程度 0..1：按下前 0.08 秒压下，松手后 0.12 秒弹起
  const SLO_hold = u => Math.max(...[SLO_G1, SLO_G2].map(([a, b]) => Math.min(seg(u, a - 0.08, a), 1 - seg(u, b, b + 0.12))));
  // 液面高度：比槽口低约 1.7 px 的自然垂面；行波随速度增大、越靠前缘越高；液体经过把手时在把手旁漫起；静止时前缘有毛细微抬
  function SLO_surfY(x, fx, u, kx, amp) {
    const L = Math.max(60, fx - SLO_X), s = clamp((x - SLO_X) / L, 0, 1.12);
    let d = 1.7 * Math.pow(Math.sin(Math.PI * Math.min(Math.max(s, 0), 1)), 0.85);   // 中段下垂
    d += amp * Math.sin(s * 6.8 - u * 9.2) * (0.2 + 0.8 * s * s);                    // 行波，前大后小
    d -= 3.1 * clamp(amp * 1.6) * Math.exp(-Math.pow((x - kx) / 16, 2));             // 把手旁的漫起
    d -= Math.max(0, (s - 0.88) / 0.12) * 1.7 * clamp(1 - amp * 2);                  // 静止时前缘微抬
    return SLO_Y + clamp(d, -2.5, 7);
  }
  // 液体轮廓：左壁沿液面逐点连到前缘顶端，再用 S 形贝塞尔下到底（顶部随 lean 前探、底部回收一半）；close=false 时只画液面+前缘，供描线用
  function SLO_liq(k, fx, lean, u, kx, amp, close) {
    const y1 = SLO_Y + SLO_H, x0 = SLO_X - 6, et = fx + lean;
    const pts = [];
    for (let x = x0; x < et; x += 12) pts.push(x);
    pts.push(Math.max(et, x0));
    k.moveTo(x0, SLO_surfY(x0, fx, u, kx, amp));
    for (const x of pts) k.lineTo(x, SLO_surfY(x, fx, u, kx, amp));
    const ety = SLO_surfY(et, fx, u, kx, amp), eb = fx - lean * 0.45;
    k.bezierCurveTo(et + lean * 0.4, ety + SLO_H * 0.34, eb - lean * 0.22, y1 - SLO_H * 0.28, eb, y1);
    if (close) { k.lineTo(x0, y1); k.closePath(); }
  }
  // 按住提示：一圈快速扩散又收细的浅色环，比默认涟漪小得多，不在空槽里留下大圆
  function SLO_ring(k, x, y, t) {
    if (t <= 0 || t >= 1) return;
    k.strokeStyle = `rgba(210,245,250,${(0.55 * (1 - t)).toFixed(3)})`;
    k.lineWidth = 1.6;
    k.beginPath(); k.arc(x, y, 5 + 15 * out3(t), 0, TAU); k.stroke();
  }
  // 读数：每一位是一个滚动的数字列，只在接近下一个整数时（离下一个整数还差 0.1 以内）滚过去，停住时数字是正的
  function SLO_digits(k, v, xr, yb) {
    k.font = UXB_f(650, 25); k.textAlign = 'center'; k.textBaseline = 'alphabetic';
    const cw = k.measureText('0').width + 1, lh = 29, w = v + 0.5, n = Math.floor(w), r = inOut3(seg(w - n, 0.9, 1));
    k.save(); k.beginPath(); k.rect(xr - 3 * cw - 2, yb - 25, 3 * cw + 4, 31); k.clip();
    for (let c = 0; c < 3; c++) {
      const p = Math.pow(10, c);
      // 本列位置 = 已进位的整数部分 + 正在进位时的 r（低位全是 9 才进）
      const allNine = (n % p) === p - 1;
      const pos = Math.floor(n / p) + (allNine ? r : 0);
      const x = xr - (c + 0.5) * cw;
      for (let d = Math.floor(pos); d <= Math.floor(pos) + 1; d++) {
        const off = (d - pos) * lh;
        if (Math.abs(off) >= lh) continue;
        // 高位的 0 不显示：只有这一位真的有值（或正在从 0 滚进来）时才画
        if (c > 0 && d <= 0) continue;
        k.fillStyle = `rgba(226,250,255,${(1 - Math.abs(off) / lh * 0.9).toFixed(3)})`;
        k.fillText(String(((d % 10) + 10) % 10), x, yb + off);
      }
    }
    k.restore();
  }
  CELLS[86] = (k, w, h, u) => {
    const D = SLO_sim();
    // 底色：深海蓝 → 蓝绿的斜向渐变，左上冷光晕、右下补一点暗青
    const bg = k.createLinearGradient(0, 0, CW, CH); bg.addColorStop(0, '#062A44'); bg.addColorStop(1, '#0A4E60');
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    glow(k, 150, 30, 260, '45,175,205', 0.15);
    glow(k, 480, 195, 210, '18,105,140', 0.12);
    // 当前值：展示段按模拟插值；复位段把手和液体一起缓回 62（液面回平）
    let val, fill, fv;
    if (u < SHOW) [val, fill, fv] = SLO_at(u);
    else { val = fill = mix(D.end, SLO_V0, inOut3(seg(u, SHOW, SHOW + 0.8))); fv = 0; }
    const hold = SLO_hold(u), rip = clamp(Math.abs(fv) / 3.5);
    // 静止时液面也有微波和微倾，不然像塑料；一动起来被真正的晃荡盖过去
    const calm = clamp((0.35 - Math.abs(fv)) / 0.35);
    const micro = calm * 0.55 * Math.sin(u * 2.3 + fill);
    const lean = clamp(SLO_TILT / 100 * fv * 3, -20, 20) * SLO_S + micro;
    const amp = calm * 0.55 + rip * 3.4;                  // 液面行波幅度
    const fx = SLO_fx(fill), kx = SLO_vx(val);
    const sy = x => SLO_surfY(x, fx, u, kx, amp);
    // 标签与读数（读的是把手值，等于原作的 aria-valuenow）
    txt(k, 'Flow', SLO_X + 2, SLO_Y - 16, UXB_f(600, 13), '#9ADBE8');
    SLO_digits(k, val, SLO_X + SLO_W - 2, SLO_Y - 16);
    // 凹槽：同色系深影托底，槽体比底色更深，内上沿压暗、下沿泛一点水光，外圈一条同色细边
    k.save(); k.shadowColor = 'rgba(3,22,36,.7)'; k.shadowBlur = 11; k.shadowOffsetY = 5;
    k.fillStyle = '#062233'; rr(k, SLO_X, SLO_Y, SLO_W, SLO_H, SLO_R); k.fill(); k.restore();
    k.save(); rr(k, SLO_X, SLO_Y, SLO_W, SLO_H, SLO_R); k.clip();
    const tg = k.createLinearGradient(0, SLO_Y, 0, SLO_Y + SLO_H);
    tg.addColorStop(0, 'rgba(0,0,0,.45)'); tg.addColorStop(0.3, 'rgba(0,0,0,.12)'); tg.addColorStop(1, 'rgba(120,220,235,.07)');
    k.fillStyle = tg; k.fillRect(SLO_X, SLO_Y, SLO_W, SLO_H);
    k.restore();
    rr(k, SLO_X + 0.5, SLO_Y + 0.5, SLO_W - 1, SLO_H - 1, SLO_R - 0.5);
    k.strokeStyle = 'rgba(150,225,240,.13)'; k.lineWidth = 1; k.stroke();
    // 液体本体：上亮下深的四段青色体积渐变
    k.save(); rr(k, SLO_X, SLO_Y, SLO_W, SLO_H, SLO_R); k.clip();
    k.beginPath(); SLO_liq(k, fx, lean, u, kx, amp, true);
    const lg = k.createLinearGradient(0, SLO_Y - 2, 0, SLO_Y + SLO_H);
    lg.addColorStop(0, '#93FFF1'); lg.addColorStop(0.22, '#4AE8EA'); lg.addColorStop(0.62, '#1DC0E0'); lg.addColorStop(1, '#0C83BF');
    k.fillStyle = lg; k.fill();
    k.save(); k.beginPath(); SLO_liq(k, fx, lean, u, kx, amp, true); k.clip();
    // 贴着液面的高光带：两条不同宽度的描线沿液面走，宽的那条晕开成皮下光
    k.beginPath(); SLO_liq(k, fx, lean, u, kx, amp, false);
    k.strokeStyle = 'rgba(255,255,255,.14)'; k.lineWidth = 13; k.stroke();
    k.beginPath(); SLO_liq(k, fx, lean, u, kx, amp, false);
    k.strokeStyle = 'rgba(255,255,255,.30)'; k.lineWidth = 6; k.stroke();
    // 底部压暗、左端起一点纵深，让填充有体积
    const dk = k.createLinearGradient(0, SLO_Y + SLO_H - 18, 0, SLO_Y + SLO_H);
    dk.addColorStop(0, 'rgba(3,55,90,0)'); dk.addColorStop(1, 'rgba(3,55,90,.42)');
    k.fillStyle = dk; k.fillRect(SLO_X, SLO_Y, SLO_W, SLO_H);
    const dep = k.createLinearGradient(SLO_X, 0, SLO_X + SLO_W, 0);
    dep.addColorStop(0, 'rgba(2,40,70,.26)'); dep.addColorStop(0.25, 'rgba(2,40,70,0)');
    k.fillStyle = dep; k.fillRect(SLO_X, SLO_Y, SLO_W, SLO_H);
    // 常升的小气泡：2 颗从底部缓慢上浮（相位确定），给静止的液体一点生气
    for (let i = 0; i < 2; i++) {
      const s = hash(730 + i), span = SLO_H - 16;
      const by = SLO_Y + SLO_H - 7 - ((u * (6 + s * 5) + s * 47) % span);
      const bx = SLO_X + 20 + s * Math.max(30, fx - SLO_X - 70) + Math.sin(u * 2.6 + i * 2) * 2;
      if (bx > fx - 14 || by < sy(bx) + 4) continue;
      k.fillStyle = `rgba(230,255,252,${(0.28 + 0.16 * rip).toFixed(3)})`;
      k.beginPath(); k.arc(bx, by, 1.1 + s * 0.9, 0, TAU); k.fill();
    }
    if (rip > 0.03) {
      // 晃荡时贴着前缘液面的 3 颗泡沫
      for (let i = 0; i < 3; i++) {
        const s = hash(760 + i);
        const bx = fx + lean - (5 + i * 11 + s * 7), by = sy(bx) + 1.5;
        const r = (0.8 + s * 1.2) * Math.min(1, rip * 1.4);
        if (r < 0.4 || bx < SLO_X + 8) continue;
        k.fillStyle = `rgba(240,255,253,${(0.6 * rip).toFixed(3)})`;
        k.beginPath(); k.arc(bx, by, r, 0, TAU); k.fill();
      }
      // 前缘后 3 道跟着液面相位走的小浪纹
      for (let i = 0; i < 3; i++) {
        const wx = fx - (12 + i * 16);
        if (wx < SLO_X + 14) break;
        const ph = u * 8 - i * 1.9, a = (1 - i / 3) * 3.2 * rip;
        k.strokeStyle = `rgba(235,255,252,${(0.34 * rip * (1 - i * 0.26)).toFixed(3)})`;
        k.lineWidth = 1.3;
        k.beginPath();
        k.moveTo(wx - 4, sy(wx) + 7 + Math.sin(ph) * a * 0.3);
        k.quadraticCurveTo(wx + 3, SLO_Y + SLO_H / 2 + Math.sin(ph) * a, wx - 3, SLO_Y + SLO_H - 9);
        k.stroke();
      }
    }
    k.restore();
    // 液面描线：沿液面和 S 形前缘的一条细亮边
    k.beginPath(); SLO_liq(k, fx, lean, u, kx, amp, false);
    k.strokeStyle = 'rgba(232,255,251,.8)'; k.lineWidth = 1.4; k.stroke();
    k.restore();
    // 把手：4 px 圆头细条，顶端贴在液面上（液面波动时跟着微动）、下端距槽底 6 px；按住时下沉并发亮
    const sink = hold * 1.6, kw = 4;
    const kTop = clamp(sy(kx), SLO_Y + 4, SLO_Y + 9) + sink, kBot = SLO_Y + SLO_H - 6, kh = kBot - kTop;
    if (hold > 0.02) glow(k, kx, (kTop + kBot) / 2, 13, '180,245,250', hold * 0.15);
    k.save(); k.shadowColor = `rgba(3,38,56,${0.65 - hold * 0.2})`; k.shadowBlur = 5; k.shadowOffsetX = 1.5; k.shadowOffsetY = 1;
    rr(k, kx - kw / 2, kTop, kw, kh, kw / 2); k.fillStyle = hold ? '#FFFFFF' : '#EAFEFF'; k.fill(); k.restore();
    k.fillStyle = `rgba(255,255,255,${0.45 + hold * 0.35})`;
    rr(k, kx - kw / 2 + 0.7, kTop + 1.5, 1.1, kh - 3, 0.55); k.fill();
    // 指针：按住时跟把手走
    let p;
    if (u < SLO_G1[0]) p = BN_path(u, D.P0);
    else if (u < SLO_G1[1] || (u >= SLO_G2[0] && u < SLO_G2[1])) p = [kx, SLO_CY + sink];
    else if (u < SLO_G2[0]) p = SLO_after(u, SLO_G1[1], D.vr1, D.P1);
    else p = SLO_after(u, SLO_G2[1], 0, D.P2);
    SLO_ring(k, SLO_vx(SLO_V0), SLO_CY, seg(u, SLO_G1[0], SLO_G1[0] + 0.45));
    SLO_ring(k, D.P1[3][1], SLO_CY, seg(u, SLO_G2[0], SLO_G2[0] + 0.45));
    if (u > 0.2 && u < 4.95) cursor(k, p[0], p[1], hold);
  };

  // @element 88
  // 88 语音消息左滑删除（bencho voice-note）：柠檬黄→草绿渐变底上一颗深绿胶囊「Hold to record」（青柠麦克风）；指针 0.5 秒按住，胶囊在 0.42 秒内带过冲从 216 撑宽到 300（原作尺寸，按 1.3 倍绘制），红点闪烁、计时走动，28 根青柠音量条每 70 ms 从右侧长出一根；
  // 0.9 秒按住往左滑，整行跟着左移、变淡，下方「‹ Slide to cancel」变淡；约 1.19 秒滑满 90 px，左端弹出红色 × 圆，提示变成红字「Release to cancel」；1.45 秒松手，音量条 0.22 秒压扁消失，0.36 秒后胶囊收回原宽；
  // 2.4 秒再按住录 1.3 秒，3.7 秒松手变成回放条；3.95 秒点播放键（三角变暂停），播放头扫过的条从 0.3 变成全亮，5.25 秒播完变回三角；5.35 秒点右端 ×，条压扁、胶囊收回，约 6.05 秒回到初始画面。
  const VN_S = 1.3;                                          // 原作 300×156 的框放大 1.3 倍
  const VN_H = 56 * VN_S, VN_IW = 216 * VN_S, VN_OW = 300 * VN_S, VN_R = VN_H / 2;
  // 默认参数 bars 28、gain 60（高度系数 0.4 + 0.6×1.2）、bounce 40（宽度过渡 y1 = 1 + 0.4×0.7）；CANCEL 90 px、每 70 ms 一个采样
  const VN_N = 28, VN_G = 0.4 + 0.6 * 1.2, VN_OV = 1 + 0.4 * 0.7, VN_CAN = 90 * VN_S, VN_SMP = 0.07;
  const VN_CX = CW / 2, VN_CY = 86;
  // 时间轴：第一次按住 / 松手（滑满作废）、第二次按住 / 松手（留下）、点播放、点 ×；作废后 0.36 秒回到 idle
  const VN_P1 = 0.5, VN_R1 = 1.45, VN_P2 = 2.4, VN_R2 = 3.7, VN_PLAY = 3.95, VN_X = 5.35, VN_CLOSE = 0.36;
  const VN_MS2 = VN_R2 - VN_P2;                               // 第二段录音时长 = 回放时长
  const VN_wEase = UXA_bz(0.3, VN_OV, 0.4, 1), VN_ease = UXA_bz(0.25, 0.1, 0.25, 1), VN_eio = UXA_bz(0.42, 0, 0.58, 1);
  const VN_grow = UXA_bz(0.3, 1.5, 0.4, 1), VN_pop = UXA_bz(0.24, 1.34, 0.38, 1);
  const VN_WEV = [[-1, VN_IW], [VN_P1, VN_OW], [VN_R1 + VN_CLOSE, VN_IW], [VN_P2, VN_OW], [VN_X + VN_CLOSE, VN_IW]];
  // 配色：青柠底 + 深绿胶囊；红色只给录音点、作废标记和作废提示
  const VN_C = { slab: '#14512F', slab2: '#0C3B22', on: '#F3FFE4', lime: '#CBF55A', red: '#FF5A5F', redInk: '#C8202F', hint: '#2F5A17' };
  const VN_XDIM = UXB_mix(VN_C.on, VN_C.slab, 0.5), VN_XON = UXB_rgb(VN_C.on);   // × 平时是 on 色与胶囊色的 50% 混色
  const VN_PX = VN_CX + 18, VN_PY = VN_CY + 6;
  const VN_PLX = VN_CX - VN_OW / 2 + 30 * VN_S, VN_XX = VN_CX + VN_OW / 2 - 28 * VN_S;
  const VN_KEYS = [[0, 590, 228], [0.42, VN_PX, VN_PY], [0.9, VN_PX, VN_PY], [1.25, VN_PX - 128, VN_PY + 4], [1.45, VN_PX - 128, VN_PY + 4],
    [2.2, VN_PX, VN_PY], [3.7, VN_PX, VN_PY], [3.88, VN_PLX, VN_CY], [4.05, VN_PLX, VN_CY], [4.7, VN_CX + 20, VN_CY + 46],
    [5.2, VN_XX, VN_CY], [5.45, VN_XX, VN_CY], [6.1, 590, 232]];
  // 拖动比例：按下点左移的距离 / CANCEL；只在第一段录音里拖
  const VN_pull = u => clamp((VN_PX - BN_path(Math.min(u, VN_R1), VN_KEYS)[0]) / VN_CAN);
  let VN_TA = VN_R1, VN_XH = VN_X;                            // 滑满（armed）时刻、指针进入 × 按钮的时刻，按路径一次算出
  for (let t = VN_P1; t < VN_R1; t += 1 / 480) if (VN_pull(t) >= 1) { VN_TA = t; break; }
  for (let t = 4.8; t < VN_X; t += 1 / 480) { const p = BN_path(t, VN_KEYS); if (Math.hypot(p[0] - VN_XX, p[1] - VN_CY) < 16 * VN_S) { VN_XH = t; break; } }
  // 原作 standIn()：音节 × 句子 + 停顿；随机部分换成确定性哈希
  const VN_lvl = (k, take) => {
    const t = (k + 1) * VN_SMP, syll = Math.abs(Math.sin(t * 6.1) * Math.sin(t * 1.9 + 0.7)), phrase = Math.sin(t * 0.9 + 0.4) > -0.55 ? 1 : 0.1;
    return Math.min(1, 0.06 + syll * phrase * (0.5 + 0.5 * BN_hash2(k, take)));
  };
  const VN_L = [[VN_P1, VN_R1], [VN_P2, VN_R2]].map(([a, b], i) => Array.from({ length: Math.floor((b - a) / VN_SMP + 1e-6) }, (_, k) => VN_lvl(k, i + 1)));
  // 原作 resample()：每根条取它覆盖的采样里最大的
  const VN_CLIP = Array.from({ length: VN_N }, (_, i) => {
    const s = VN_L[1], a = Math.floor(i * s.length / VN_N), b = Math.max(a + 1, Math.floor((i + 1) * s.length / VN_N));
    let m = 0; for (let j = a; j < b && j < s.length; j++) m = Math.max(m, s[j]); return m;
  });
  const VN_fmt = ms => { const s = Math.floor(ms / 1000 + 1e-6); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const VN_in = dt => VN_ease(seg(dt, 0.08, 0.32));          // .vn-in：挂载后延迟 80 ms、240 ms 淡入
  const VN_FONT = UXB_f(500, 16 * VN_S), VN_HFONT = UXB_f(400, 13 * VN_S);
  const VN_PLAYQ = [[7, 4, 13, 7.6, 13, 16.4, 7, 20], [13, 7.6, 19, 12, 19, 12, 13, 16.4]];
  const VN_PAUSEQ = [[7, 5, 10.5, 5, 10.5, 19, 7, 19], [13.5, 5, 17, 5, 17, 19, 13.5, 19]];
  function VN_bar(k, x, cy, v, sy, a) {
    if (a <= 0.003 || sy <= 0.002) return;
    const hh = (4 + clamp(v * VN_G) * 28) * VN_S * sy, bw = 3 * VN_S;
    k.globalAlpha = a; rr(k, x, cy - hh / 2, bw, hh, Math.min(2 * VN_S, hh / 2)); k.fill();
  }
  // lucide X（24 视图框），s 为像素尺寸
  function VN_xmark(k, x, y, s, col, lw) {
    const q = s / 24 * 6; k.strokeStyle = col; k.lineWidth = lw; k.lineCap = 'round';
    k.beginPath(); k.moveTo(x - q, y - q); k.lineTo(x + q, y + q); k.moveTo(x + q, y - q); k.lineTo(x - q, y + q); k.stroke();
  }
  function VN_mic(k, x, y, col) {                             // MicMark 21 px：实心胶囊 + 描边支架
    const m = 21 * VN_S / 24; k.save(); k.translate(x - 12 * m, y - 12 * m); k.scale(m, m);
    k.fillStyle = col; rr(k, 8.5, 2, 7, 12.5, 3.5); k.fill();
    k.strokeStyle = col; k.lineWidth = 2.2; k.lineCap = 'round';
    k.beginPath(); k.arc(12, 11.5, 7, Math.PI, 0, true); k.stroke();
    k.beginPath(); k.moveTo(12, 18.5); k.lineTo(12, 22); k.stroke(); k.restore();
  }
  function VN_rec(k, u, L, W, take) {
    const t0 = take === 1 ? VN_P1 : VN_P2, te = take === 1 ? VN_R1 : VN_R2, arr = VN_L[take - 1], S = VN_S, cy = VN_CY;
    const cnt = Math.min(arr.length, Math.floor((Math.min(u, te) - t0) / VN_SMP + 1e-6));
    const pull = take === 1 ? VN_pull(u) : 0;
    const fold = u > te ? VN_ease(seg(u, te, te + 0.22)) : 0, f16 = u > te ? VN_ease(seg(u, te, te + 0.16)) : 0;
    const rowA = VN_in(u - t0) * (1 - pull * 0.55), x = L + 24 * S - pull * VN_CAN * 0.5;
    const ph = (u - t0) % 1, blink = 1 - 0.75 * VN_eio(ph < 0.5 ? ph * 2 : 2 - ph * 2);
    const dA = rowA * Math.max(0, 1 - pull * 1.6) * (1 - f16);
    if (dA > 0.003) { k.globalAlpha = dA * blink; k.fillStyle = VN_C.red; k.beginPath(); k.arc(x + 4.5 * S, cy, 4.5 * S, 0, TAU); k.fill(); }
    k.font = VN_FONT; const tw = Math.max(38 * S, k.measureText('0:00').width);
    if (dA > 0.003) { k.globalAlpha = dA; txt(k, VN_fmt(cnt * 70), x + 21 * S, cy + 0.5, VN_FONT, VN_C.on, 'left', 'middle'); }
    const ws = x + 21 * S + tw + 12 * S, we = L + W - 24 * S - pull * VN_CAN * 0.5, st = (we - ws - 3 * S) / (VN_N - 1);
    k.fillStyle = VN_C.lime;
    for (let j = 0; j < VN_N; j++) {
      const i = cnt - VN_N + j, m = i >= 0 ? t0 + VN_SMP * (i + 1) : t0;
      VN_bar(k, ws + j * st, cy, i >= 0 ? arr[i] : 0, mix(0.2, 1, VN_grow(seg(u, m, m + 0.2))) * (1 - fold), rowA * (1 - pull * 0.7) * (1 - fold));
    }
    k.globalAlpha = 1;
  }
  function VN_cancelMark(k, u, L) {                           // 滑满后左端的红色 × 圆（不随行移动）
    if (u < VN_TA) return;
    const on = t => [VN_ease(seg(t, VN_TA, VN_TA + 0.16)), mix(0.4, 1, VN_pop(seg(t, VN_TA, VN_TA + 0.42)))];
    let [op, sc] = on(Math.min(u, VN_R1));
    if (u > VN_R1) { const e = VN_ease(seg(u, VN_R1, VN_R1 + 0.22)); op = mix(op, 0, e); sc = mix(sc, 0.6, e); }
    if (op <= 0.003) return;
    const x = L + 28 * VN_S, r = 14 * VN_S * sc;
    k.globalAlpha = op; k.fillStyle = VN_C.red; k.beginPath(); k.arc(x, VN_CY, r, 0, TAU); k.fill();
    VN_xmark(k, x, VN_CY, 16 * VN_S * sc, '#FFFFFF', 2 * 16 / 24 * VN_S * sc); k.globalAlpha = 1;
  }
  function VN_clip(k, u, L, W) {
    const S = VN_S, cy = VN_CY, a = VN_in(u - VN_R2);
    const f16 = u > VN_X ? VN_ease(seg(u, VN_X, VN_X + 0.16)) : 0, fold = u > VN_X ? VN_ease(seg(u, VN_X, VN_X + 0.22)) : 0, bA = a * (1 - f16);
    const prog = clamp((u - VN_PLAY) / VN_MS2), pe = VN_PLAY + VN_MS2;
    const q = x => 1 - Math.pow(1 - x, 4), mt = u < pe ? q(seg(u, VN_PLAY, VN_PLAY + 0.22)) : 1 - q(seg(u, pe, pe + 0.22));
    // 播放键：直径 44 的青柠圆，里面播放/暂停两块四边形互相变形
    const pcx = L + 30 * S, ps = 1 - 0.04 * UXB_press(u, VN_PLAY);
    if (bA > 0.003) {
      k.globalAlpha = bA; k.fillStyle = VN_C.lime; k.beginPath(); k.arc(pcx, cy, 22 * S * ps, 0, TAU); k.fill();
      const m = 20 * S / 24 * ps; k.save(); k.translate(pcx, cy); k.scale(m, m); k.translate(-12, -12);
      k.fillStyle = k.strokeStyle = VN_C.slab2; k.lineWidth = 1.6; k.lineJoin = 'round'; k.beginPath();
      for (let s = 0; s < 2; s++) {
        const P = VN_PLAYQ[s].map((v, i) => mix(v, VN_PAUSEQ[s][i], mt));
        k.moveTo(P[0], P[1]); k.lineTo(P[2], P[3]); k.lineTo(P[4], P[5]); k.lineTo(P[6], P[7]); k.closePath();
      }
      k.fill(); k.stroke(); k.restore();
    }
    k.font = VN_FONT; const tw = Math.max(38 * S, k.measureText('0:00').width), tx = L + W - 56 * S - tw;
    if (bA > 0.003) {
      k.globalAlpha = bA * 0.6; txt(k, VN_fmt((prog > 0 && prog < 1 ? prog : 1) * VN_MS2 * 1000), tx, cy + 0.5, VN_FONT, VN_C.on, 'left', 'middle');
      // × 按钮：平时是半透明色，指针悬停 160 ms 变亮
      const xs = 1 - 0.04 * UXB_press(u, VN_X), col = rgba(lerpC(VN_XDIM, VN_XON, VN_ease(seg(u, VN_XH, VN_XH + 0.16))), 1);
      k.globalAlpha = bA; VN_xmark(k, L + W - 28 * S, cy, 18 * S * xs, col, 2 * 18 / 24 * S * xs);
    }
    const ws = L + 64 * S, we = tx - 12 * S, st = (we - ws - 3 * S) / (VN_N - 1);
    k.fillStyle = VN_C.lime;
    for (let i = 0; i < VN_N; i++) VN_bar(k, ws + i * st, cy, VN_CLIP[i], 1 - fold, clamp((prog * VN_N - i) * 99, 0.3, 1) * a * (1 - fold));
    k.globalAlpha = 1;
  }
  function VN_hint(u) {                                       // [不透明度, 是否 armed]；opacity 过渡 220 ms ease
    const e = (a) => VN_ease(seg(u, a, a + 0.22));
    if (u < VN_P1) return [0, false];
    if (u < VN_R1) {
      if (u >= VN_TA) { const a0 = VN_ease(seg(VN_TA, VN_P1, VN_P1 + 0.22)) * (1 - VN_pull(VN_TA)); return [mix(a0, 1, e(VN_TA)), true]; }
      return [e(VN_P1) * (1 - VN_pull(u)), false];
    }
    if (u < VN_P2) return [1 - e(VN_R1), true];             // 作废后提示保持红字淡出（原作此时已换回灰字）
    if (u < VN_R2) return [e(VN_P2), false];
    return [1 - e(VN_R2), false];
  }
  CELLS[87] = (k, w, h, u) => {
    const bg = k.createLinearGradient(0, 0, CW, CH); bg.addColorStop(0, '#EEFA7C'); bg.addColorStop(1, '#93DA55');
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    glow(k, 90, 20, 190, '255,255,235', 0.45);
    const S = VN_S, W = UXB_ramp(u, VN_WEV, 0.42, VN_wEase), L = VN_CX - W / 2, T = VN_CY - VN_H / 2;
    const pg = k.createLinearGradient(0, T, 0, T + VN_H); pg.addColorStop(0, VN_C.slab); pg.addColorStop(1, VN_C.slab2);
    k.save(); k.shadowColor = 'rgba(40,96,10,.38)'; k.shadowBlur = 22; k.shadowOffsetY = 8;
    k.fillStyle = pg; rr(k, L, T, W, VN_H, VN_R); k.fill(); k.restore();
    k.save(); rr(k, L, T, W, VN_H, VN_R); k.clip();        // 胶囊质感：顶部细高光 + 底部轻压暗
    const sh = k.createLinearGradient(0, T, 0, T + VN_H * 0.55);
    sh.addColorStop(0, 'rgba(255,255,255,0.10)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    k.fillStyle = sh; k.fillRect(L, T, W, VN_H * 0.55);
    const bs = k.createLinearGradient(0, T + VN_H * 0.55, 0, T + VN_H);
    bs.addColorStop(0, 'rgba(0,0,0,0)'); bs.addColorStop(1, 'rgba(0,0,0,0.16)');
    k.fillStyle = bs; k.fillRect(L, T + VN_H * 0.55, W, VN_H * 0.45);
    k.strokeStyle = 'rgba(255,255,255,0.12)'; k.lineWidth = 1;
    rr(k, L + 0.5, T + 0.5, W - 1, VN_H - 1, VN_R - 0.5); k.stroke(); k.restore();
    k.save(); rr(k, L, T, W, VN_H, VN_R); k.clip();
    const idle1 = u < VN_P1, idle2 = u >= VN_R1 + VN_CLOSE && u < VN_P2, idle3 = u >= VN_X + VN_CLOSE;
    if (idle1 || idle2 || idle3) {
      const a = idle1 ? 1 : VN_in(u - (idle3 ? VN_X : VN_R1) - VN_CLOSE);
      k.font = VN_FONT; const s = 'Hold to record', tw = k.measureText(s).width, gw = 21 * S + 12 * S + tw, x0 = VN_CX - gw / 2;
      k.globalAlpha = a; VN_mic(k, x0 + 10.5 * S, VN_CY, VN_C.lime); txt(k, s, x0 + 33 * S, VN_CY + 0.5, VN_FONT, VN_C.on, 'left', 'middle');
      k.globalAlpha = 1;
    } else if (u < VN_P2) { VN_rec(k, u, L, W, 1); VN_cancelMark(k, u, L); }
    else if (u < VN_R2) VN_rec(k, u, L, W, 2);
    else VN_clip(k, u, L, W);
    k.restore();
    // 提示文字：胶囊中心下方 42 px（原作尺寸）
    const [ha, armed] = VN_hint(u);
    if (ha > 0.003) {
      k.globalAlpha = ha;
      txt(k, armed ? 'Release to cancel' : '\u2039 Slide to cancel', VN_CX, VN_CY + 42 * S + 2, VN_HFONT, armed ? VN_C.redInk : VN_C.hint, 'center', 'top');
      k.globalAlpha = 1;
    }
    for (const t of [VN_PLAY, VN_X]) ripple(k, BN_path(t, VN_KEYS)[0], VN_CY, seg(u, t, t + 0.5), '243,255,228');
    if (u < 6.12) {
      const p = BN_path(u, VN_KEYS);
      const hold = (a, b) => (u < a - 0.08 || u > b + 0.14 ? 0 : u < a ? seg(u, a - 0.08, a) : u <= b ? 1 : 1 - seg(u, b, b + 0.14));
      cursor(k, p[0], p[1], Math.max(hold(VN_P1, VN_R1), hold(VN_P2, VN_R2), UXB_press(u, VN_PLAY), UXB_press(u, VN_X)));
    }
  };

  // @element 89
  // 89 超限文件拒收（bencho upload-dropzone）：明黄渐变底，右边 300×176、圆角 20 的蓝色投放框（Drag a file here / Up to 5 MB），左边托盘放 mood.png 2.4 MB 和 demo.mp4 12.6 MB；
  // 0.5 秒拿起图片拖进框（框放大 1.02、改成 Drop to upload），1.0 秒松手被吸进框中心，框收成上传行，1.22–2.57 秒百分比滚动、薄荷绿进度条填满后打勾，3.27 秒图片回托盘；
  // 2.95 秒拖视频进框，3.55 秒松手：框抖 0.42 秒、变红说 Too big — up to 5 MB，视频按 bounce 40 弹回；4.0 秒再拖，4.38 秒松手改说 Still 12.6 MB. It didn't shrink.；5.35 秒提示消失、框变回蓝色，静止到周期结束。
  const UD_MAX = 5, UD_SPEED = 50, UD_BOUNCE = 40, UD_COR = 20;          // README 默认值；MAX 单位 MB
  const UD_TW = 76, UD_SH = 75, UD_SG = 20, UD_GAP = 44, UD_BW = 300, UD_BH = 176;
  // 原作托盘在框下方；画布是横条，改成托盘在左、框在右，整体水平居中
  const UD_X0 = (CW - (UD_TW + UD_GAP + UD_BW)) / 2, UD_TY = (CH - (UD_SH * 2 + UD_SG)) / 2;
  const UD_BX = UD_X0 + UD_TW + UD_GAP + UD_BW / 2, UD_BY = CH / 2;      // 框中心
  const UD_HW = 36 + 12 + 150 + 12 + 22, UD_HH = 46;                      // 上传行：图标 36 + 文字列 150 + 勾位 22，间距 12
  // MP4 原作用蓝色标签，这里框是蓝的，换成紫色免得拖到框上看不清
  const UD_FILES = [
    { name: 'mood.png', ext: 'PNG', size: 2.4e6, tint: '#079455', x: UD_X0, y: UD_TY },
    { name: 'demo.mp4', ext: 'MP4', size: 12.6e6, tint: '#7A4CF0', x: UD_X0, y: UD_TY + UD_SH + UD_SG },
  ];
  const UD_SNARK = "Still 12.6 MB. It didn't shrink.";
  const UD_fmt = b => (b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`);
  // 指针：拿起图片 → 拖进框 → 看上传 → 两次拿视频拖进框
  // 松手点放在框的上半部：拖着的文件盖住箭头块，不盖住中间那行提示
  const UD_KEYS = [[0, 30, 250], [0.45, 98, 44], [0.5, 98, 44], [0.75, 200, 58], [0.95, 292, 66], [1.0, 292, 66],
    [1.5, 330, 158], [2.3, 300, 166], [2.85, 98, 139], [2.95, 98, 139], [3.25, 215, 100], [3.5, 300, 68], [3.55, 300, 68],
    [3.9, 98, 139], [4.0, 98, 139], [4.2, 215, 96], [4.33, 306, 64], [4.38, 306, 64], [4.85, 430, 262]];
  const UD_G = [[0.5, 1.0, 0], [2.95, 3.55, 1], [4.0, 4.38, 1]];          // [按下, 松手, 第几个文件]
  // 原作 speed 50 时 2.4 MB 的发送时长 (4 − 0.5×3.2)×(0.7 + 0.48×0.6) ≈ 2.37 秒；一个周期装不下两次拒收，按 0.57 倍压到 1.35 秒
  const UD_SECS = (4 - UD_SPEED / 100 * 3.2) * (0.7 + Math.min(1, UD_FILES[0].size / 5e6) * 0.6), UD_D = UD_SECS * 0.57;
  const UD_R1 = UD_G[0][1], UD_TS = UD_R1 + 0.22, UD_TD = UD_TS + UD_D, UD_TI = UD_TD + 0.7;   // 完成后停 0.7 秒（原作 1.5 秒）回到空闲
  const UD_RF = [UD_G[1][1], UD_G[2][1]], UD_CLR = UD_RF[0] + 1.8;    // 原作每次拒收 1.8 秒后清空提示，第一次的计时器也会清掉第二句
  const UD_SPR = UXA_bz(0.3, 1 + UD_BOUNCE / 100 * 0.9, 0.4, 1);       // --upl-spring：bounce 40 → 1.36
  const UD_BOXE = UXA_bz(0.24, 1.34, 0.38, 1), UD_SUCK = UXA_bz(0.55, 0, 0.85, 0.3), UD_EIN = UXA_bz(0.42, 0, 1, 1);
  const UD_EASE = UXA_bz(0.25, 0.1, 0.25, 1), UD_EIO = UXA_bz(0.42, 0, 0.58, 1), UD_GULPE = UXA_bz(0.3, 1.2, 0.4, 1), UD_POP = UXA_bz(0.3, 1.6, 0.4, 1);
  const UD_SHAKE = [0, -7, 6, -4, 2, 0];
  const UD_BLUE = '#2563EB', UD_HOT = '#3D7BFF', UD_RED = '#D8343F', UD_MINT = '#7CF5C4', UD_OK = '#12B76A', UD_INK = '#3D2C00';
  // 进度：原作每帧按 0.4–1.6 倍随机速率前进；这里切成 12 段、每段速率按下标哈希，归一化到 1.35 秒正好 100%
  const UD_PN = 12, UD_PC = (() => { const c = [0]; for (let i = 0; i < UD_PN; i++) c.push(c[i] + 0.4 + 1.2 * hash(i + 31)); return c.map(v => v / c[UD_PN]); })();
  const UD_p = t => { if (t <= 0) return 0; if (t >= UD_D) return 1; const x = t / UD_D * UD_PN, i = Math.floor(x); return mix(UD_PC[i], UD_PC[i + 1], x - i); };
  const UD_pinv = q => { let i = 0; while (UD_PC[i + 1] < q) i++; return (i + (q - UD_PC[i]) / (UD_PC[i + 1] - UD_PC[i])) / UD_PN * UD_D; };
  let UD_C = null;                                                          // 只算一次的表：路径、悬停切换、数字滚动事件
  function UD_cache() {
    if (UD_C) return UD_C;
    const P = [new Path2D('M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z'),
      new Path2D('M27 .5V8a4 4 0 0 0 4 4h7.5'), new Path2D('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12'), new Path2D('M20 6 9 17l-5-5')];
    // 文件悬在框上（且框空闲）才算 over；按 1/240 秒取样成切换表
    const over = UXB_changes(u => (UD_G.some(g => u >= g[0] && u < g[1]) && UD_inBox(BN_path(u, UD_KEYS)) && UD_idle(u) ? 1 : 0));
    // 百分比 n 在 p 越过 (n − 0.5)% 时出现；个位每次都变，十位从 10% 才出现（新列直接停在 1，不滚动）
    const ones = [[-1, 0]], tens = [[-1, 1]];
    for (let n = 1; n <= 99; n++) { const t = UD_TS + UD_pinv((n - 0.5) / 100); ones.push([t, n % 10]); if (n > 10 && n % 10 === 0) tens.push([t, n / 10]); }
    UD_C = { P, over, ones, tens };
    return UD_C;
  }
  const UD_inBox = p => Math.abs(p[0] - UD_BX) < UD_BW / 2 && Math.abs(p[1] - UD_BY) < UD_BH / 2;
  const UD_idle = u => u < UD_TS || u >= UD_TI;
  // 文件图标（Untitled UI 式）：40 格上的圆角纸页 + 折角，扩展名标签伸出纸页左边
  function UD_page(k, P, x, y, s, f, line) {
    k.save(); k.translate(x, y); k.scale(s / 40, s / 40);
    k.fillStyle = '#FFFFFF'; k.fill(P[0]);
    k.strokeStyle = line; k.lineWidth = 1.5; k.lineJoin = 'round'; k.lineCap = 'round'; k.stroke(P[0]); k.stroke(P[1]);
    k.fillStyle = f.tint; rr(k, 1, 18, 29, 16, 8); k.fill();
    txt(k, f.ext, 15.5, 29.1, UXB_f(600, 9), '#FFFFFF', 'center');
    k.restore();
  }
  // 拿在手里：跟着指针平移，放大 1.08，按横向位移倾斜（最多 6°）
  function UD_held(g, u) {
    const a = BN_path(g[0], UD_KEYS), b = BN_path(u, UD_KEYS), dx = b[0] - a[0], dy = b[1] - a[1];
    return { dx, dy, sx: 1.08, sy: 1.08, rot: clamp(dx * 0.04, -6, 6) * Math.PI / 180, op: 1 };
  }
  const UD_lerpT = (a, b, e) => ({ dx: mix(a.dx, b.dx, e), dy: mix(a.dy, b.dy, e), sx: mix(a.sx, b.sx, e), sy: mix(a.sy, b.sy, e), rot: mix(a.rot, b.rot, e), op: 1 });
  const UD_HOME = { dx: 0, dy: 0, sx: 1, sy: 1, rot: 0, op: 1 };
  // 文件 i 在 u 时刻的变换（相对托盘位置，绕卡片中心 38, 32.5）；null 表示不可见
  function UD_tile(i, u) {
    for (const g of UD_G) {
      if (g[2] !== i) continue;
      if (u >= g[0] && u < g[1]) return UD_held(g, u);
      if (i === 0 && u >= g[1]) {
        // 吸入：0.38 秒 ease-in 飞向框中心，沿拉动方向压扁（横拉变宽、竖拉变高、太近只缩小），透明度晚 0.08 秒用 0.3 秒淡出
        const from = UD_held(g, g[1]), f = UD_FILES[0];
        const tx = UD_BX - (f.x + 38), ty = UD_BY - (f.y + 32.5), ux = Math.abs(tx - from.dx), uy = Math.abs(ty - from.dy);
        const [sx, sy] = Math.hypot(ux, uy) < 24 ? [0.16, 0.16] : uy >= ux ? [0.14, 0.34] : [0.34, 0.14];
        const t = u - g[1];
        if (t < 0.38) { const o = UD_lerpT(from, { dx: tx, dy: ty, sx, sy, rot: 0 }, UD_SUCK(t / 0.38)); o.op = 1 - UD_EIN(seg(t, 0.08, 0.38)); return o; }
        if (u < UD_TI) return null;
        // 回到托盘：0.36 秒从 0.7 倍、透明弹回（upl-back）
        const s = UD_SPR(seg(u, UD_TI, UD_TI + 0.36));
        return { dx: 0, dy: 0, sx: 0.7 + 0.3 * s, sy: 0.7 + 0.3 * s, rot: 0, op: clamp(s) };
      }
    }
    // 松手在框外或被拒：0.42 秒按 bounce 40 的弹簧飞回原位
    for (const g of UD_G) if (g[2] === i && u >= g[1] && u < g[1] + 0.42) return UD_lerpT(UD_held(g, g[1]), UD_HOME, UD_SPR((u - g[1]) / 0.42));
    return UD_HOME;
  }
  // 数字列：滚动条带 0–9，每次变化 0.22 秒带回弹地滚到新数字（中途再变就从当前位置接着滚）
  function UD_roll(k, x, y, evs, u, cw) {
    const s = UXB_ramp(u, evs, 0.22, UD_BOXE);
    k.save(); k.beginPath(); k.rect(x, y - 6.5, cw, 13); k.clip();
    for (let d = Math.max(0, Math.floor(s) - 1); d <= Math.min(9, Math.ceil(s) + 1); d++) k.fillText(String(d), x + cw / 2, y + (d - s) * 12);
    k.restore();
  }
  CELLS[88] = (k, w, h, u) => {
    const C = UD_cache(), P = C.P;
    const bg = k.createLinearGradient(0, 0, CW, CH); bg.addColorStop(0, '#FFE867'); bg.addColorStop(1, '#FFBE3B');
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    glow(k, 80, 20, 220, '255,250,215', 0.55);
    const busy = !UD_idle(u), done = u >= UD_TD;
    const over = UXB_ramp(u, C.over, 0.42, UD_BOXE);
    const ref = UXB_ramp(u, [[-1, 0], [UD_RF[0], 1], [UD_CLR, 0]], 0.22, UD_EASE);
    const hug = UXB_ramp(u, [[-1, 0], [UD_TS, 1], [UD_TI, 0]], 0.42, UD_BOXE);
    const bw = mix(UD_BW, UD_HW + 32, hug), bh = mix(UD_BH, UD_HH + 28, hug);
    // 框的缩放：悬停 1.02；松手 0.2 秒后「吞一口」0.46 秒（.985 → 1.006 → 1），从当时的值起步免得跳
    let sc = 1 + 0.02 * over;
    const gt = (u - UD_R1 - 0.2) / 0.46;
    if (gt >= 0 && gt < 1) {
      const s0 = 1 + 0.02 * UXB_ramp(UD_R1 + 0.2, C.over, 0.42, UD_BOXE), K = [s0, 0.985, 1.006, 1], T = [0, 0.35, 0.7, 1];
      const j = gt < 0.35 ? 0 : gt < 0.7 ? 1 : 2; sc = mix(K[j], K[j + 1], UD_GULPE((gt - T[j]) / (T[j + 1] - T[j])));
    }
    let shx = 0;
    for (const t0 of UD_RF) { const s = (u - t0) / 0.42; if (s >= 0 && s < 1) { const j = Math.floor(s * 5); shx = mix(UD_SHAKE[j], UD_SHAKE[j + 1], UD_EIO(s * 5 - j)); } }
    // —— 投放框
    k.save(); k.translate(UD_BX + shx, UD_BY); k.scale(sc, sc);
    k.save(); k.shadowColor = 'rgba(150,92,0,.34)'; k.shadowBlur = 22; k.shadowOffsetY = 8;
    k.fillStyle = rgba(lerpC(UXB_mix(UD_BLUE, UD_HOT, over), UXB_rgb(UD_RED), ref), 1); rr(k, -bw / 2, -bh / 2, bw, bh, UD_COR); k.fill(); k.restore();
    rr(k, -bw / 2, -bh / 2, bw, bh, UD_COR); k.clip();
    if (!busy) {
      // 空闲：图标块 38 + 两行字，竖向居中；悬停时图标块上抬 4 px
      const msg = u >= UD_RF[0] && u < UD_CLR ? (u < UD_RF[1] ? `Too big — up to ${UD_MAX} MB` : UD_SNARK) : UD_overNow(C, u) ? 'Drop to upload' : 'Drag a file here';
      const iy = -42.5 - 4 * over;
      k.fillStyle = `rgba(255,255,255,${(0.2 + 0.1 * over).toFixed(3)})`; rr(k, -19, iy, 38, 38, 10); k.fill();
      k.save(); k.translate(-9, iy + 10); k.scale(0.75, 0.75); k.strokeStyle = '#FFFFFF'; k.lineWidth = 2; k.lineCap = 'round'; k.lineJoin = 'round'; k.stroke(P[2]); k.restore();
      txt(k, msg, 0, 15.5, UXB_f(600, 13), '#FFFFFF', 'center', 'middle');
      txt(k, `Up to ${UD_MAX} MB`, 0, 35, UXB_f(500, 12), 'rgba(255,255,255,.8)', 'center', 'middle');
    } else {
      // 上传行：0.42 秒从 0.85 倍、下移 10 px、透明弹到位（upl-land）
      const f = UD_FILES[0], lt = UD_SPR(seg(u, UD_TS, UD_TS + 0.42)), p = done ? 1 : UD_p(u - UD_TS);
      k.save(); k.globalAlpha = clamp(lt); k.translate(0, 10 * (1 - lt)); k.scale(0.85 + 0.15 * lt, 0.85 + 0.15 * lt);
      const x0 = -UD_HW / 2, tx = x0 + 48;
      UD_page(k, P, x0, -18, 36, f, 'rgba(20,50,150,.45)');
      txt(k, f.name, tx, -14, UXB_f(600, 13), '#FFFFFF', 'left', 'middle');
      const meta = UXB_f(500, 12), dim = 'rgba(255,255,255,.82)';
      if (done) txt(k, `${UD_fmt(f.size)} · Uploaded`, tx, 4, meta, dim, 'left', 'middle');
      else {
        const head = `${UD_fmt(f.size)} ·`; txt(k, head, tx, 4, meta, dim, 'left', 'middle');
        const cw = k.measureText('0').width, v = Math.min(99, Math.round(p * 100));
        let x = tx + k.measureText(head).width + 4;
        k.textAlign = 'center';
        if (v >= 10) { UD_roll(k, x, 4, C.tens, u, cw); x += cw; }
        UD_roll(k, x, 4, C.ones, u, cw); x += cw;
        txt(k, '%', x, 4, meta, dim, 'left', 'middle');
      }
      k.fillStyle = 'rgba(255,255,255,.24)'; rr(k, tx, 19, 150, 4, 2); k.fill();
      if (p > 0) { k.fillStyle = UD_MINT; rr(k, tx, 19, 150 * p, 4, 2); k.fill(); }
      if (done) {
        const s = UD_POP(seg(u, UD_TD, UD_TD + 0.38)), cx = tx + 150 + 12 + 11;
        k.save(); k.translate(cx, 0); k.scale(s, s);
        k.fillStyle = UD_OK; k.beginPath(); k.arc(0, 0, 11, 0, TAU); k.fill();
        k.translate(-7, -7); k.scale(14 / 24, 14 / 24); k.strokeStyle = '#FFFFFF'; k.lineWidth = 2.6; k.lineCap = 'round'; k.lineJoin = 'round'; k.stroke(P[3]);
        k.restore();
      }
      k.restore();
    }
    k.restore();
    // —— 托盘里的文件（总画在框上面，原作托盘在 DOM 里排在框后）
    UD_FILES.forEach((f, i) => {
      const T = UD_tile(i, u);
      if (!T || T.op <= 0) return;
      k.save(); k.globalAlpha = clamp(T.op);
      k.translate(f.x + 38 + T.dx, f.y + 32.5 + T.dy); k.rotate(T.rot); k.scale(T.sx, T.sy); k.translate(-38, -32.5);
      UD_page(k, P, 18, 4, 40, f, '#A87700');
      // 拿起时名字下垫一块奶油色底，拖到蓝框上也看得清（原作名字直接压在框上）
      // 名字按文件中心进框深度淡出：进框后 chip 会压住框里的提示行（尤其拒收时那句彩蛋文案）
      const tcx = f.x + 38 + T.dx, tcy = f.y + 32.5 + T.dy;
      const dep = clamp(Math.min(tcx - (UD_BX - UD_BW / 2), UD_BX + UD_BW / 2 - tcx, tcy - (UD_BY - UD_BH / 2), UD_BY + UD_BH / 2 - tcy) / 12);
      const lift = clamp((T.sx - 1) / 0.08) * (1 - dep), lf = UXB_f(600, 11);
      if (lift > 0) { k.font = lf; const lw = k.measureText(f.name).width; k.fillStyle = `rgba(255,248,220,${(0.92 * lift).toFixed(3)})`; rr(k, 38 - lw / 2 - 6, 51, lw + 12, 15, 7.5); k.fill(); }
      txt(k, f.name, 38, 58.5, lf, `rgba(61,44,0,${(1 - dep).toFixed(3)})`, 'center', 'middle');
      k.restore();
    });
    if (u < 4.86) {
      const pp = BN_path(u, UD_KEYS);
      let pr = 0;
      for (const g of UD_G) pr = Math.max(pr, seg(u, g[0] - 0.08, g[0]) * (1 - seg(u, g[1], g[1] + 0.14)));
      cursor(k, pp[0], pp[1], pr);
    }
  };
  // 当前是否处于 over（切换表里最后一个不晚于 u 的值）
  function UD_overNow(C, u) { let v = 0; for (const e of C.over) { if (e[0] > u) break; v = e[1]; } return v === 1; }

  // @element 90
  // 90 里程表进位计数器（bencho rolling-counter）：热粉→玫红渐变底上一块深紫计数条，左青色「−」键、右翠绿「+」键，中间白色数字从 95 起，每列是 0–9 的滚筒；
  // 指针 0.3 秒从右下进入，0.75、1.10 秒点两下「+」（96、97）；1.5 秒按住「+」：0.38 秒后开始连发，先 0.09 秒一次、按住 0.9 秒后 0.055 秒一次，1.97 秒 99→100 百位列滑入，按住 1.5 秒后每次 +10，到 185；
  // 3.4 秒松手，指针移到「−」，3.95、4.30 秒点两下（184、183），4.9 秒离开；各列按 45 ms 错开、用弹簧（bounce 45）落位，转得快的列带模糊；复位段 5.4 秒各列就近转不到半圈回到 95、百位列收起，6.1 秒前静止。
  const OD_S = 2;                                                     // 原作约 156×56 px 的小控件，放大 2 倍绘制
  const OD_PLACES = 5, OD_CELL = 46, OD_PAD = 5, OD_BTN = 40, OD_NPAD = 14, OD_FONT = 30, OD_COLW = 0.64 * OD_FONT, OD_COR = 16;
  const OD_START = 95, OD_STAGGER = 0.045, OD_BLUR = 50, OD_BOUNCE = 45, OD_RESET = SHOW;
  const OD_CX = CW / 2, OD_CY = CH / 2;
  const OD_COL = { slab: '#2A0E3D', digit: '#FFF7FC', minus: '#2CC8F5', plus: '#2FDC86', glyph: '#2A0E3D', shadow: 'rgba(120,0,52,.5)' };
  // 按键：[按下, 松开, 方向]；按住超过 0.38 秒才开始连发（原作 setTimeout 380）
  const OD_PRESS = [[0.75, 0.87, 1], [1.10, 1.22, 1], [1.5, 3.4, 1], [3.95, 4.07, -1], [4.3, 4.42, -1]];
  const OD_KEYS = [[0, 590, 245], [0.3, 548, 205], [0.65, 388, 112], [3.45, 388, 112], [3.85, 146, 112], [4.45, 146, 112], [4.95, 70, 250]];
  // 原作 springOf(bounce)：每帧（1/60 秒）v += (目标 − 位置)·k，v *= d，位置 += v
  const OD_K = 0.08 + OD_BOUNCE / 100 * 0.16, OD_D = 0.62 + OD_BOUNCE / 100 * 0.2;
  // 该线性差分方程的阶跃响应写成解析式：误差 e(n) = r^n (cos θn + B sin θn)，n 为帧数，可取小数
  const OD_R = Math.sqrt(OD_D), OD_TH = Math.acos((1 + OD_D - OD_D * OD_K) / (2 * OD_R));
  const OD_B = (1 - OD_K * OD_D - OD_R * Math.cos(OD_TH)) / (OD_R * Math.sin(OD_TH)), OD_LR = Math.log(OD_R);
  // 数值变化表 [时刻, 新值]：按原作 press() 的连发规则（380 ms 后连发；按住超过 0.9 秒间隔 90→55 ms；超过 1.5 秒每次 ±10）预先算好
  const OD_EV = (() => {
    const ev = []; let v = OD_START;
    const bump = (t, n) => { const nv = clamp(v + n, 0, 10 ** OD_PLACES - 1); if (nv !== v) { v = nv; ev.push([t, v]); } };
    for (const [t0, t1, dir] of OD_PRESS) {
      bump(t0, dir);
      for (let t = t0 + 0.38; t < t1;) { const held = t - t0; bump(t, dir * (held > 1.5 ? 10 : 1)); t += held > 0.9 ? 0.055 : 0.09; }
    }
    ev.push([OD_RESET, OD_START]);                                     // 复位：直接回到初值，各列照常滚动过去
    return ev;
  })();
  // 每列的目标阶跃 [时刻, 增量]：列 p 的目标是 floor(值 / 10^p)，晚 p 个 stagger 生效。
  // 增量只要模 10 不变，画面就一样（原作对相差 24 以上的列也先整圈跳近）：复位那一步每列就近转不到半圈（±5 格内），0.9 秒内落定
  const OD_STEPS = Array.from({ length: OD_PLACES }, (_, p) => {
    const out = []; let prev = Math.floor(OD_START / 10 ** p);
    for (const [t, v] of OD_EV) {
      const to = Math.floor(v / 10 ** p); let d = to - prev; prev = to;
      if (t === OD_RESET) d = ((d % 10) + 15) % 10 - 5;
      if (d) out.push([t + p * OD_STAGGER, d]);
    }
    return out;
  });
  // 列 p 在 u 时的位置与每帧速度（各阶跃响应叠加）
  function OD_col(p, u) {
    let pos = Math.floor(OD_START / 10 ** p), vel = 0;
    for (const [t, d] of OD_STEPS[p]) {
      if (u <= t) break;
      const n = (u - t) * 60, rn = Math.exp(OD_LR * n), c = Math.cos(OD_TH * n), s = Math.sin(OD_TH * n);
      pos += d * (1 - rn * (c + OD_B * s));
      vel -= d * rn * (OD_LR * (c + OD_B * s) + OD_TH * (OD_B * c - s));
    }
    return [pos, vel];
  }
  const OD_value = u => { let v = OD_START; for (const [t, x] of OD_EV) { if (t > u) break; v = x; } return v; };
  // 键面质感：彩色键顶部一条亮带、底部一条暗影（仿原作 button 6% 明度差的层次）
  function OD_keyShade(k, cx, w, h, r) {
    for (const [sgn, a] of [[-1, 0.22], [1, 0.14]]) {
      const y0 = sgn * h / 2, g = k.createLinearGradient(0, y0, 0, y0 - sgn * h * 0.55);
      g.addColorStop(0, `rgba(255,255,255,${a * (sgn < 0)})`); g.addColorStop(1, `rgba(255,255,255,0)`);
      const g2 = k.createLinearGradient(0, y0, 0, y0 - sgn * h * 0.5);
      g2.addColorStop(0, `rgba(26,5,38,${0.18 * (sgn > 0)})`); g2.addColorStop(1, 'rgba(26,5,38,0)');
      k.fillStyle = sgn < 0 ? g : g2; rr(k, cx - w / 2, -h / 2, w, h, r); k.fill();
    }
  }
  // CSS transition：evs = [[时刻, 目标, 时长]]，每次从当时的值出发
  function OD_trans(u, v0, evs, ez) {
    let from = v0, to = v0, t0 = -1e9, dur = 1;
    for (const [t, v, du] of evs) {
      if (t > u) break;
      from = mix(from, to, ez(seg(t, t0, t0 + dur))); to = v; t0 = t; dur = du;
    }
    return mix(from, to, ez(seg(u, t0, t0 + dur)));
  }
  const OD_WEZ = UXA_bz(0.3, 1.2, 0.4, 1), OD_EASE = UXA_bz(0.25, 0.1, 0.25, 1), OD_KEZ = UXA_bz(0.3, 0.9, 0.4, 1);
  // 显示位数随数值即时变化，列宽按 320 ms 回弹曲线、透明度按 220 ms ease 过渡（原作 .rct-col）
  const OD_SHOWN = (() => {
    const len = v => Math.max(1, String(v).length), out = []; let cur = len(OD_START);
    for (const [t, v] of OD_EV) if (len(v) !== cur) { cur = len(v); out.push([t, cur]); }
    return out;
  })();
  function OD_lay(u) {
    const cols = [];
    let num = 2 * OD_NPAD;
    for (let p = OD_PLACES - 1; p >= 0; p--) {
      const on = q => (p < q ? 1 : 0), s0 = on(Math.max(1, String(OD_START).length));
      const evs = OD_SHOWN.map(([t, q]) => [t, on(q), 0.32]), evo = OD_SHOWN.map(([t, q]) => [t, on(q), 0.22]);
      const w = Math.max(0, OD_COLW * OD_trans(u, s0, evs, OD_WEZ)), a = clamp(OD_trans(u, s0, evo, OD_EASE));
      cols.push([p, w, a]); num += w;
    }
    const W = 2 * OD_PAD + 2 * OD_BTN + num;
    return { W, num, cols, x0: -W / 2 };
  }
  // 指针在哪个键上（按画面实际的键位逐 1/240 秒判断）：0 无、-1 「−」、1 「+」
  const OD_HOVER = UXB_changes(u => {
    if (u < 0.2 || u > 4.95) return 0;
    const L = OD_lay(u), [px, py] = BN_path(u, OD_KEYS), x = (px - OD_CX) / OD_S, y = (py - OD_CY) / OD_S;
    if (Math.abs(y) > OD_CELL / 2) return 0;
    if (x >= L.x0 + OD_PAD && x <= L.x0 + OD_PAD + OD_BTN) return -1;
    if (x >= -L.x0 - OD_PAD - OD_BTN && x <= -L.x0 - OD_PAD) return 1;
    return 0;
  });
  function OD_key(k, x, dir, u, col) {
    // :active 按下 110 ms 缩到 0.9，松开 200 ms 回到 1；:hover 160 ms 加深 10%
    const evs = [];
    for (const [t0, t1, d] of OD_PRESS) if (d === dir) evs.push([t0, 0.9, 0.11], [t1, 1, 0.2]);
    const sc = OD_trans(u, 1, evs, OD_KEZ);
    const hv = OD_trans(u, 0, OD_HOVER.slice(1).map(([t, v]) => [t, v === dir ? 1 : 0, 0.16]), OD_EASE);
    const cx = x + OD_BTN / 2, w = OD_BTN * sc, h = OD_CELL * sc, r = (OD_COR - OD_PAD) * sc;
    k.fillStyle = rgba(UXB_mix(col, '#1A0526', 0.16 * hv), 1); rr(k, cx - w / 2, -h / 2, w, h, r); k.fill();
    OD_keyShade(k, cx, w, h, r);
    const g = (16 / 24 * 14 / 2) * sc;                                                  // lucide 16 px 图标，线段 14/24 宽
    k.strokeStyle = OD_COL.glyph; k.lineWidth = 2.2 * sc * 16 / 24; k.lineCap = 'round';
    k.beginPath(); k.moveTo(cx - g, 0); k.lineTo(cx + g, 0);
    if (dir > 0) { k.moveTo(cx, -g); k.lineTo(cx, g); }
    k.stroke();
  }
  CELLS[89] = (k, w, h, u) => {
    const bg = k.createLinearGradient(0, 0, CW, CH); bg.addColorStop(0, '#FF4FA6'); bg.addColorStop(1, '#E3115F');
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    glow(k, CW * 0.22, CH * 0.1, 220, '255,170,220', 0.35);
    const L = OD_lay(u), H = OD_CELL + 2 * OD_PAD;
    k.save(); k.translate(OD_CX, OD_CY); k.scale(OD_S, OD_S);
    k.save(); k.shadowColor = OD_COL.shadow; k.shadowBlur = 24; k.shadowOffsetY = 8;
    k.fillStyle = OD_COL.slab; rr(k, L.x0, -H / 2, L.W, H, OD_COR); k.fill(); k.restore();
    OD_key(k, L.x0 + OD_PAD, -1, u, OD_COL.minus);
    OD_key(k, -L.x0 - OD_PAD - OD_BTN, 1, u, OD_COL.plus);
    // 数字窗：每列一条 0–9,0 的竖条，按 位置 mod 10 平移；转得快就模糊（原作 min(3, |v|·2.4)·blur/50 px）
    k.font = UXB_f(500, OD_FONT); k.textAlign = 'center'; k.textBaseline = 'alphabetic';
    // 数字相对列居中要按字形包围盒算（'1' 等窄字左缘留白比右缘宽）
    const bw = {}, dy = (() => { for (const d of '0123456789') { const m = k.measureText(d); bw[d] = [m.actualBoundingBoxLeft ?? m.width / 2, m.actualBoundingBoxRight ?? m.width / 2]; } const m = k.measureText('0'); return (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2; })();
    const dcen = d => { const [l, r] = bw[d]; return (r - l) / 2; };
    const T = k.getTransform(), dev = Math.hypot(T.a, T.b);           // canvas 的 blur 按设备像素算，要乘上当前缩放
    let x = L.x0 + OD_PAD + OD_BTN + OD_NPAD;
    for (const [p, cw, a] of L.cols) {
      if (cw > 0.05 && a > 0.004) {
        const [pos, vel] = OD_col(p, u), m = ((pos % 10) + 10) % 10, j = Math.floor(m), f = m - j;
        const smear = Math.min(3, Math.abs(vel) * 2.4) * (OD_BLUR / 50);
        k.save(); k.beginPath(); k.rect(x, -OD_CELL / 2, cw, OD_CELL); k.clip();
        k.globalAlpha = a; k.fillStyle = OD_COL.digit;
        if (smear > 0.15) k.filter = `blur(${(smear * dev).toFixed(2)}px)`;
        const d0 = String(j % 10), d1 = String((j + 1) % 10);
        k.fillText(d0, x + cw / 2 + dcen(d0), -f * OD_CELL + dy);
        k.fillText(d1, x + cw / 2 + dcen(d1), (1 - f) * OD_CELL + dy);
        k.restore();
      }
      x += cw;
    }
    // 窗口上下 20% 渐隐（原作 mask-image）：底色是纯色，用同色渐变盖住即等效
    const nx = L.x0 + OD_PAD + OD_BTN, fh = OD_CELL * 0.2, sc = UXB_rgb(OD_COL.slab);
    for (const s of [-1, 1]) {
      const y0 = s * OD_CELL / 2, g = k.createLinearGradient(0, y0, 0, y0 - s * fh);
      g.addColorStop(0, rgba(sc, 1)); g.addColorStop(1, rgba(sc, 0));
      k.fillStyle = g; k.fillRect(nx, Math.min(y0, y0 - s * fh), L.num, fh);
    }
    k.restore();
    if (u > 0.2 && u < 4.95) {
      const [px, py] = BN_path(u, OD_KEYS);
      let pr = 0;
      for (const [t0, t1] of OD_PRESS) pr = Math.max(pr, u < t1 ? seg(u, t0 - 0.06, t0) : 1 - seg(u, t1, t1 + 0.1));
      cursor(k, px, py, pr);
    }
  };

  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});
