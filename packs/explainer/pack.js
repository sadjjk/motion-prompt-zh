/* Motion Prompt · pack "explainer" · MIT License (c) 2026 Berryxia · https://github.com/andyhuo520/vibe-knowledge */
MotionPrompt.pack('explainer', function () {
  // @kit
  // 讲解画风（每格 539x208、6.4 秒周期；每格都是只依赖时间 u 的纯函数）
  // 画风取自 vibe-knowledge（Berryxia，MIT）各套 STYLE.md 的配色、材质与动态语法；画面是为本库新写的通用讲解案例，
  // 原作是跟旁白走的一次性长镜头，这里压缩成 0–5.4 秒展示、5.4–6.4 秒复位的无缝循环。不使用原作的风格图、视频与字体。
  const CW = 539, CH = 208;
  const CYC = 6.4;
  const SHOW = 5.4;                                   // 展示段结束、复位段开始的时刻
  const TAU = Math.PI * 2;
  // 系统字体栈：不打包字体文件
  const SANS = "'PingFang SC', 'Noto Sans CJK SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif";
  const SERIF = "'Songti SC', 'Noto Serif CJK SC', 'STSong', 'SimSun', serif";
  const KAI = "'Kaiti SC', 'STKaiti', 'KaiTi', 'Noto Serif CJK SC', serif";
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
  // 复位段：0 = 展示中，1 = 完全复位
  const resetK = u => inOut3(seg(u, SHOW, SHOW + 0.6));

  // 折线工具：按累计长度截取，用于"一笔笔画出来"
  function polyLen(pts) { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; }
  function polyCut(pts, len) {
    const out = [pts[0]]; let s = 0;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], d = Math.hypot(x1 - x0, y1 - y0);
      if (s + d >= len) { const t = d ? (len - s) / d : 0; out.push([mix(x0, x1, t), mix(y0, y1, t)]); return out; }
      out.push(pts[i]); s += d;
    }
    return out;
  }
  function polyAt(pts, len) { const c = polyCut(pts, len); return c[c.length - 1]; }
  // 画出折线的前 prog（0..1）比例
  function strokePts(k, pts) { k.beginPath(); pts.forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y))); k.stroke(); }
  function strokeProg(k, pts, prog) { if (prog > 0) strokePts(k, prog >= 1 ? pts : polyCut(pts, polyLen(pts) * prog)); }
  // 圆采样成闭合折线（从 a0 起顺时针），便于按进度画出
  function circlePts(cx, cy, r, n = 48, a0 = -Math.PI / 2) { const out = []; for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * TAU; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return out; }

  const CELLS = [];

  // @element 01
  // 01 粉笔黑板：墨绿黑板上，粉笔一笔笔画出直角三角形和三边上的正方形，a²、b²、c² 晚半拍写进方格，红粉笔圈出 c²，
  // 黄粉笔写出 a² + b² = c² 并画双下划线；最后板擦从左到右擦净，擦痕散去复位
  const CB_BOARD = '#1F4A42', CB_W = '#EEECE3', CB_Y = '#F5D76E', CB_R = '#F28B82';
  // 粉笔线：3 道错开的细线 + 不规则虚线，模拟粉笔在板面上的颗粒断续
  function chalkLine(k, pts, prog, col, wd, seed) {
    if (prog <= 0) return;
    const part = polyCut(pts, polyLen(pts) * clamp(prog));
    k.save(); k.lineCap = 'round'; k.lineJoin = 'round'; k.strokeStyle = col;
    for (let p = 0; p < 3; p++) {
      const ox = (hash(seed * 7 + p) - 0.5) * wd * 0.7, oy = (hash(seed * 13 + p) - 0.5) * wd * 0.7;
      k.globalAlpha = 0.55 + 0.25 * hash(seed + p * 3);
      k.lineWidth = wd * (0.5 + 0.2 * p);
      k.setLineDash([3 + hash(seed + p) * 5, 0.5 + hash(seed * 3 + p) * 1.2]);
      k.save(); k.translate(ox, oy); strokePts(k, part); k.restore();
    }
    k.restore();
  }
  // 粉笔字：从左往右写出（clip），叠一层错位描影，再撒板面色细点做颗粒；align 'center' 时 x 为中心
  function chalkText(k, s, x, y, size, col, prog, seed, align = 'left') {
    if (prog <= 0) return;
    k.save();
    k.font = `700 ${size}px ${KAI}`; k.textAlign = 'left'; k.textBaseline = 'alphabetic';
    const w = k.measureText(s).width, x0 = align === 'center' ? x - w / 2 : x;
    k.beginPath(); k.rect(x0 - 2, y - size, (w + 4) * clamp(prog), size * 1.3); k.clip();
    k.fillStyle = col; k.globalAlpha = 0.9; k.fillText(s, x0, y);
    k.globalAlpha = 0.35; k.fillText(s, x0 + 0.6, y + 0.5);
    k.globalAlpha = 0.55; k.fillStyle = CB_BOARD;
    const n = Math.round(w * size / 14);
    for (let i = 0; i < n; i++) k.fillRect(x0 + hash(seed * 31 + i) * w, y - size * 0.85 + hash(seed * 17 + i * 3) * size, 0.9, 0.9);
    k.restore();
  }
  // 3-4-5 直角三角形：直角顶点 CB_O，直角边 a = 60（水平）、b = 45（竖直），斜边 c = 75
  const CB_O = [200, 128], CB_A = 60, CB_B = 45;
  const CB_PA = [CB_O[0] + CB_A, CB_O[1]], CB_PB = [CB_O[0], CB_O[1] - CB_B];
  const CB_TRI = [CB_PB, CB_O, CB_PA, CB_PB];
  const CB_SQA = [CB_O, [CB_O[0], CB_O[1] + CB_A], [CB_PA[0], CB_O[1] + CB_A], CB_PA];
  const CB_SQB = [CB_O, [CB_O[0] - CB_B, CB_O[1]], [CB_O[0] - CB_B, CB_PB[1]], CB_PB];
  // 斜边上的正方形向右上外翻：沿斜边法向 (b, -a) 平移
  const CB_SQC = [CB_PB, [CB_PB[0] + CB_B, CB_PB[1] - CB_A], [CB_PA[0] + CB_B, CB_PA[1] - CB_A], CB_PA];
  const CB_RT = [[CB_O[0] + 9, CB_O[1]], [CB_O[0] + 9, CB_O[1] - 9], [CB_O[0], CB_O[1] - 9]];   // 直角标记
  const CB_CC = [(CB_PB[0] + CB_PA[0] + CB_B) / 2, (CB_PB[1] + CB_PA[1] - CB_A) / 2];           // c² 方格中心
  // 红圈套住 c² 字样：字以 CB_CC[1] + 8 为基线、24px，字形视觉中心约在 CB_CC[1]，圈心与之重合
  const CB_RING = []; for (let i = 0; i <= 48; i++) { const a = -Math.PI * 0.9 + (i / 48) * TAU * 1.06; CB_RING.push([CB_CC[0] + Math.cos(a) * 22, CB_CC[1] + Math.sin(a) * 17]); }
  const CB_UL1 = [[338, 92], [430, 91], [512, 93]], CB_UL2 = [[342, 99], [432, 98], [508, 100]];
  CELLS[0] = (k, w, h, u) => {
    // 黑板底：偏左上的高光 + 两团擦拭留下的白雾
    const g = k.createRadialGradient(150, 50, 10, 200, 80, 420);
    g.addColorStop(0, '#2C5E54'); g.addColorStop(0.45, CB_BOARD); g.addColorStop(1, '#173A34');
    k.fillStyle = g; k.fillRect(0, 0, CW, CH);
    [[110, 50, 120, 0.06], [420, 150, 110, 0.05]].forEach(([x, y, r, a]) => {
      const hz = k.createRadialGradient(x, y, 0, x, y, r); hz.addColorStop(0, `rgba(255,255,255,${a})`); hz.addColorStop(1, 'rgba(255,255,255,0)');
      k.fillStyle = hz; k.fillRect(0, 0, CW, CH);
    });
    // 板擦：5.4–6.2 秒从左到右扫过，擦过的部分不再绘制
    const ex = mix(-40, CW + 40, inOut3(seg(u, SHOW, SHOW + 0.8)));
    k.save(); k.beginPath(); k.rect(ex, 0, CW, CH); k.clip();
    const P = (a, b) => seg(u, a, b);
    chalkText(k, '勾股定理', 24, 40, 24, CB_W, P(0.2, 0.7), 1);
    chalkLine(k, CB_TRI, P(0.6, 1.4), CB_W, 2.4, 2);
    chalkLine(k, CB_RT, P(1.4, 1.55), CB_W, 1.6, 3);
    chalkLine(k, CB_SQA, P(1.6, 2.0), CB_W, 2.0, 4);
    chalkLine(k, CB_SQB, P(2.0, 2.4), CB_W, 2.0, 5);
    chalkLine(k, CB_SQC, P(2.4, 2.9), CB_W, 2.0, 6);
    // 方格里的面积标注晚半拍写出
    chalkText(k, 'a²', CB_O[0] + CB_A / 2, CB_O[1] + CB_A / 2 + 8, 22, CB_W, P(2.0, 2.2), 7, 'center');
    chalkText(k, 'b²', CB_O[0] - CB_B / 2, CB_O[1] - CB_B / 2 + 8, 20, CB_W, P(2.4, 2.6), 8, 'center');
    chalkText(k, 'c²', CB_CC[0], CB_CC[1] + 8, 24, CB_W, P(2.9, 3.1), 9, 'center');
    chalkLine(k, CB_RING, P(3.2, 3.6), CB_R, 2.4, 10);
    chalkText(k, 'a² + b² = c²', 340, 82, 30, CB_Y, P(3.7, 4.3), 11);
    chalkLine(k, CB_UL1, P(4.35, 4.55), CB_Y, 2.2, 12);
    chalkLine(k, CB_UL2, P(4.55, 4.75), CB_Y, 2.2, 13);
    chalkText(k, '3² + 4² = 5²', 352, 140, 22, CB_W, P(4.6, 5.1), 14);
    k.restore();
    // 擦过的地方留一道淡白擦痕，6.0–6.4 秒散去，循环起点是干净黑板
    const smear = 1 - seg(u, 6.0, CYC);
    if (u > SHOW && smear > 0) {
      k.fillStyle = `rgba(255,255,255,${0.045 * smear})`; k.fillRect(0, 16, clamp(ex, 0, CW), 170);
      k.save(); k.translate(ex, 100); k.rotate(-0.08);
      k.fillStyle = '#6B4A2E'; k.fillRect(-18, -9, 36, 12); k.fillStyle = '#D9D4C7'; k.fillRect(-18, 3, 36, 6);
      k.restore();
    }
    // 粉笔槽与两截粉笔
    const tr = k.createLinearGradient(0, 198, 0, CH);
    tr.addColorStop(0, '#80583A'); tr.addColorStop(1, '#5A3A22');
    k.fillStyle = tr; k.fillRect(0, 198, CW, 10);
    k.fillStyle = '#F4F1E6'; k.fillRect(452, 193, 28, 6); k.fillStyle = CB_Y; k.fillRect(486, 194, 18, 5);
  };

  // @element 02
  // 02 蓝图专利图：普鲁士蓝方格纸上，先淡入构造虚线，再按顺序画出法兰零件的主视图与侧视图，接着拉尺寸线、写数字，
  // 右下角图签逐字打出 FIG. 1，红铅笔圈出孔位写「公差」；复位时整张图纸向上卷走，新纸从下方滑入
  const BP_BG = '#123F74', BP_L = '#EAF2FF', BP_R = '#FF6B5B';
  const BP_C = [290, 110];                                     // 侧视图圆心
  const BP_OBJ = [                                              // 物体线：[折线, 线宽, 是否虚线（隐藏线）]
    [[[90, 40], [110, 40], [110, 180], [90, 180], [90, 40]], 2.2, false],          // 法兰盘
    [[[110, 75], [150, 75], [150, 145], [110, 145]], 2.2, false],                  // 轮毂
    [[[90, 95], [150, 95]], 1.2, true], [[[90, 125], [150, 125]], 1.2, true],      // 内孔（隐藏线）
    [circlePts(BP_C[0], BP_C[1], 70), 2.2, false],
    [circlePts(BP_C[0], BP_C[1], 35), 2.2, false],
    [circlePts(BP_C[0], BP_C[1], 15), 1.8, false],
    ...[45, 135, 225, 315].map(d => [circlePts(BP_C[0] + Math.cos(d * Math.PI / 180) * 52, BP_C[1] - Math.sin(d * Math.PI / 180) * 52, 6, 20), 1.6, false]),
  ];
  const BP_CON = [                                              // 构造线（50% 虚线）
    [[76, 110], [164, 110]], [[206, 110], [374, 110]], [[290, 28], [290, 192]],
    [[110, 40], [290, 40]], [[150, 75], [290, 75]], [[150, 145], [290, 145]], [[110, 180], [290, 180]],
    circlePts(BP_C[0], BP_C[1], 52),
  ];
  const BP_HOLE = [BP_C[0] + Math.cos(-Math.PI / 4) * 52, BP_C[1] + Math.sin(-Math.PI / 4) * 52];
  const BP_STEP = 0.16, BP_DRAW = 0.45, BP_T0 = 0.8;            // 物体线依次画出：错开 0.16 秒，每条 0.45 秒
  const BP_TB = [400, 142, 128, 56];                            // 图签 x, y, w, h
  const BP_TB_ROWS = [['FIG. 1', 13, 700], ['FLANGE · 法兰', 10, 500], ['SCALE 1:2   NO. 07', 9, 500]];
  function bpArrow(k, x, y, ang) {
    k.save(); k.translate(x, y); k.rotate(ang);
    k.beginPath(); k.moveTo(0, 0); k.lineTo(-7, -2.6); k.lineTo(-7, 2.6); k.closePath(); k.fill(); k.restore();
  }
  // 一张图纸：网格 + 截至时刻 u 已画出的内容；withDrawing = false 时只有空白方格纸
  function bpSheet(k, u, withDrawing) {
    k.fillStyle = BP_BG; k.fillRect(0, 0, CW, CH);
    k.fillStyle = 'rgba(234,242,255,0.10)';
    for (let x = 0; x < CW; x += 10) k.fillRect(x, 0, 1, CH);
    for (let y = 0; y < CH; y += 10) k.fillRect(0, y, CW, 1);
    k.fillStyle = 'rgba(234,242,255,0.22)';
    for (let x = 0; x < CW; x += 50) k.fillRect(x, 0, 1, CH);
    for (let y = 0; y < CH; y += 50) k.fillRect(0, y, CW, 1);
    if (!withDrawing) return;
    k.lineCap = 'round'; k.lineJoin = 'round'; k.strokeStyle = BP_L; k.fillStyle = BP_L;
    // 1. 构造线淡入
    k.save(); k.globalAlpha = 0.5 * seg(u, 0.2, 0.8); k.lineWidth = 0.8; k.setLineDash([5, 4]);
    BP_CON.forEach(p => strokePts(k, p)); k.restore();
    // 2. 物体线按顺序画出
    BP_OBJ.forEach(([pts, lw, hidden], i) => {
      const t0 = BP_T0 + Math.min(i, 7) * BP_STEP;              // 4 个螺栓孔同一拍画
      k.save(); k.lineWidth = lw; if (hidden) k.setLineDash([4, 3]);
      strokeProg(k, pts, inOut3(seg(u, t0, t0 + BP_DRAW))); k.restore();
    });
    // 3. 尺寸线、箭头和数字
    const d = seg(u, 2.5, 3.0), dt = seg(u, 2.9, 3.3);
    k.save(); k.lineWidth = 0.9;
    if (d > 0) {
      strokeProg(k, [[88, 40], [64, 40]], d); strokeProg(k, [[88, 180], [64, 180]], d);
      strokeProg(k, [[70, 110], [70, 40]], d); strokeProg(k, [[70, 110], [70, 180]], d);
      strokeProg(k, [[110, 182], [110, 200]], d); strokeProg(k, [[150, 147], [150, 200]], d);
      strokeProg(k, [[130, 195], [110, 195]], d); strokeProg(k, [[130, 195], [150, 195]], d);
      strokeProg(k, [BP_HOLE, [356, 42], [404, 42]], d);
    }
    if (d >= 1) { bpArrow(k, 70, 40, -Math.PI / 2); bpArrow(k, 70, 180, Math.PI / 2); bpArrow(k, 110, 195, Math.PI); bpArrow(k, 150, 195, 0); }
    k.globalAlpha = dt; k.font = `600 11px ${MONO}`; k.textBaseline = 'alphabetic';
    k.save(); k.translate(64, 110); k.rotate(-Math.PI / 2); k.textAlign = 'center'; k.fillText('Ø140', 0, 0); k.restore();
    k.textAlign = 'center'; k.fillText('40', 130, 191);
    k.textAlign = 'left'; k.fillText('4×Ø12', 360, 38);
    k.restore();
    // 4. 图签：框线画出后逐字打出
    const [tx, ty, tw, th] = BP_TB;
    k.save(); k.lineWidth = 1.4;
    strokeProg(k, [[tx, ty], [tx + tw, ty], [tx + tw, ty + th], [tx, ty + th], [tx, ty]], seg(u, 3.4, 3.8));
    k.lineWidth = 0.8; const row = th / 3;
    strokeProg(k, [[tx, ty + row], [tx + tw, ty + row]], seg(u, 3.7, 3.85)); strokeProg(k, [[tx, ty + row * 2], [tx + tw, ty + row * 2]], seg(u, 3.75, 3.9));
    k.textAlign = 'left'; k.textBaseline = 'middle';
    BP_TB_ROWS.forEach(([s, sz, wt], i) => {
      const n = Math.floor([...s].length * seg(u, 3.9 + i * 0.25, 4.2 + i * 0.25));
      k.font = `${wt} ${sz}px ${MONO}`; k.fillText([...s].slice(0, n).join(''), tx + 7, ty + row * (i + 0.5) + 1);
    });
    k.restore();
    // 5. 红铅笔批注：圈出内孔端口，手写「公差 ±0.02」
    k.save(); k.strokeStyle = BP_R; k.fillStyle = BP_R; k.lineWidth = 1.8;
    const ring = []; for (let i = 0; i <= 40; i++) { const a = -2.2 + (i / 40) * TAU * 1.08; ring.push([150 + Math.cos(a) * (17 + 2 * Math.sin(a * 2)), 110 + Math.sin(a) * 23]); }
    strokeProg(k, ring, inOut3(seg(u, 4.6, 5.0)));
    const np = seg(u, 4.95, 5.3);
    if (np > 0) { k.font = `700 15px ${KAI}`; k.textAlign = 'left'; k.textBaseline = 'alphabetic'; const s = '公差 ±0.02', tw2 = k.measureText(s).width;
      k.beginPath(); k.rect(160, 46, tw2 * np + 2, 22); k.clip(); k.fillText(s, 162, 63); }
    k.restore();
  }
  CELLS[1] = (k, w, h, u) => {
    // 复位：旧图纸带着内容向上卷走（底边有一道卷起的高光），新空白纸从下方同步滑入
    const r = inOut3(seg(u, SHOW, SHOW + 0.7));
    if (r <= 0) { bpSheet(k, u, true); return; }
    const up = -r * (CH + 12);
    k.save(); k.translate(0, up); bpSheet(k, u, true);
    const roll = k.createLinearGradient(0, CH - 10, 0, CH + 12);
    roll.addColorStop(0, 'rgba(234,242,255,0)'); roll.addColorStop(0.5, 'rgba(234,242,255,0.35)'); roll.addColorStop(1, 'rgba(6,24,48,0.9)');
    k.fillStyle = roll; k.fillRect(0, CH - 10, CW, 22);
    k.restore();
    k.save(); k.translate(0, up + CH + 12); bpSheet(k, u, false); k.restore();
  };

  // @element 03
  // 03 深色数学：近黑底，坐标轴从原点长出、刻度依次亮起，蓝色 y = sin x 从左描到右，金点沿曲线滑动，
  // 切线随点转动，右上角公式逐字浮现并实时读出斜率；最后所有线条与文字渐暗归零
  const DM_BG = '#0F1014', DM_B = '#58C4DD', DM_Y = '#F4D35E', DM_R = '#FC6255', DM_W = '#ECECEC';
  const DM_O = [56, 112];                                       // 原点
  const DM_SX = 420 / TAU, DM_AMP = 62;                         // x 方向 2π 占 420 px，振幅 62 px
  const DM_N = 160;
  const DM_CURVE = Array.from({ length: DM_N + 1 }, (_, i) => { const x = (i / DM_N) * TAU; return [DM_O[0] + x * DM_SX, DM_O[1] - Math.sin(x) * DM_AMP]; });
  const DM_TICKS = ['π/2', 'π', '3π/2', '2π'];
  const DM_FORM = 'y = sin x';
  CELLS[2] = (k, w, h, u) => {
    k.fillStyle = DM_BG; k.fillRect(0, 0, CW, CH);
    k.save(); k.globalAlpha = 1 - resetK(u);
    k.lineCap = 'round'; k.strokeStyle = DM_W; k.fillStyle = DM_W; k.lineWidth = 1.4;
    // 坐标轴：从原点向四个方向长出
    const ax = out3(seg(u, 0.2, 0.9));
    if (ax > 0) {
      strokePts(k, [[DM_O[0] - 16 * ax, DM_O[1]], [DM_O[0] + 456 * ax, DM_O[1]]]);
      strokePts(k, [[DM_O[0], DM_O[1] + 76 * ax], [DM_O[0], DM_O[1] - 80 * ax]]);
      if (ax >= 1) {
        k.beginPath(); k.moveTo(DM_O[0] + 462, DM_O[1]); k.lineTo(DM_O[0] + 454, DM_O[1] - 3.5); k.lineTo(DM_O[0] + 454, DM_O[1] + 3.5); k.fill();
        k.font = `italic 12px ${SERIF}`; k.textAlign = 'left'; k.textBaseline = 'middle'; k.fillText('x', DM_O[0] + 466, DM_O[1]);
      }
    }
    // 刻度错开淡入
    k.font = `10px ${MONO}`; k.textAlign = 'center'; k.textBaseline = 'top';
    DM_TICKS.forEach((s, i) => {
      const a = seg(u, 0.9 + i * 0.12, 1.1 + i * 0.12); if (a <= 0) return;
      const x = DM_O[0] + (i + 1) * (Math.PI / 2) * DM_SX;
      k.globalAlpha = (1 - resetK(u)) * a; strokePts(k, [[x, DM_O[1] - 4], [x, DM_O[1] + 4]]); k.fillText(s, x, DM_O[1] + 7);
    });
    [[1, '1'], [-1, '-1']].forEach(([v, s], i) => {
      const a = seg(u, 1.38 + i * 0.12, 1.58 + i * 0.12); if (a <= 0) return;
      const y = DM_O[1] - v * DM_AMP;
      k.globalAlpha = (1 - resetK(u)) * a; strokePts(k, [[DM_O[0] - 4, y], [DM_O[0] + 4, y]]);
      k.textAlign = 'right'; k.textBaseline = 'middle'; k.fillText(s, DM_O[0] - 8, y);
    });
    k.globalAlpha = 1 - resetK(u);
    // 公式逐字浮现（每个字符 0.08 秒，从下方 6 px 升起）
    k.font = `italic 22px ${SERIF}`; k.textAlign = 'left'; k.textBaseline = 'alphabetic';
    const fw = k.measureText(DM_FORM).width; let fx = 516 - fw;
    [...DM_FORM].forEach((c, i) => {
      const a = seg(u, 0.6 + i * 0.08, 0.85 + i * 0.08);
      k.globalAlpha = (1 - resetK(u)) * a; k.fillStyle = DM_B; k.fillText(c, fx, 38 + 6 * (1 - out3(a)));
      fx += k.measureText(c).width;
    });
    k.globalAlpha = 1 - resetK(u);
    // 曲线从左描到右，金点跟随
    const t = inOut3(seg(u, 1.6, 4.6));
    if (t > 0) {
      const x = t * TAU, px = DM_O[0] + x * DM_SX, py = DM_O[1] - Math.sin(x) * DM_AMP;
      k.strokeStyle = DM_B; k.lineWidth = 2.6; strokePts(k, DM_CURVE.slice(0, Math.max(2, Math.ceil(t * DM_N) + 1)).map((p, i, arr) => (i === arr.length - 1 ? [px, py] : p)));
      // 点到 x 轴的投影虚线
      k.save(); k.strokeStyle = DM_B; k.globalAlpha *= 0.35; k.lineWidth = 1; k.setLineDash([3, 3]); strokePts(k, [[px, py], [px, DM_O[1]]]); k.restore();
      // 切线：屏幕坐标下方向 (1, -AMP·cos x / SX)，长 84 px，以金点为中心
      const slope = Math.cos(x), dx = 1, dy = -DM_AMP * slope / DM_SX, dl = Math.hypot(dx, dy), L = 42;
      const flat = Math.abs(slope) < 0.06;                      // 斜率接近 0（波峰、波谷）时切线变红
      k.strokeStyle = flat ? DM_R : DM_W; k.globalAlpha = (1 - resetK(u)) * 0.85; k.lineWidth = 1.4;
      strokePts(k, [[px - dx / dl * L, py - dy / dl * L], [px + dx / dl * L, py + dy / dl * L]]);
      k.globalAlpha = 1 - resetK(u);
      k.fillStyle = DM_Y; k.beginPath(); k.arc(px, py, 4.5, 0, TAU); k.fill();
      // 斜率读数
      k.font = `11px ${MONO}`; k.textAlign = 'right'; k.textBaseline = 'alphabetic';
      k.fillStyle = flat ? DM_R : DM_Y; k.fillText(`k = cos x = ${(Math.abs(slope) < 0.005 ? 0 : slope).toFixed(2)}`, 516, 58);
    }
    k.restore();
  };

  // @element 04
  // 04 地铁线路图：白底，红色 1 号线只走 0°/45°/90°，一站站长出、到站站点弹出；博物馆站变灰挂「暂停服务」，
  // 市中心站画出黄色支线和「换乘 2 号线」；列车从起点站开到终点站，整图淡出复位
  const MT_RED = '#E4002B', MT_GOLD = '#F2A900', MT_INK = '#1A1A1A';
  const MT_LINE = [[30, 170], [110, 170], [150, 130], [250, 130], [300, 80], [420, 80], [460, 40], [510, 40]];
  const MT_X = [[360, 14], [360, 80], [390, 110], [390, 196]];
  // [x, y, 中文, 英文, 类型 0 普通 / 1 端点 / 2 换乘, 标签 dx, dy]
  const MT_ST = [
    [30, 170, '火车站', 'Railway Sta.', 1, -12, 26], [95, 170, '人民路', 'Renmin Rd', 0, -16, 24], [200, 130, '博物馆', 'Museum', 0, -18, -14],
    [275, 105, '大学城', 'University', 0, 10, 20], [360, 80, '市中心', 'City Centre', 2, -54, -16], [510, 40, '机场', 'Airport', 1, -26, 26]];
  const MT_OFF = 2, MT_XST = 4;                                  // 暂停服务站、换乘站的下标
  const MT_LEN = polyLen(MT_LINE);
  // 每站在线路上的累计长度（站点都落在折线上，取最近的采样点）
  const MT_AT = MT_ST.map(([x, y]) => { let best = 0, bd = 1e9; for (let l = 0; l <= MT_LEN; l += 0.5) { const [px, py] = polyAt(MT_LINE, l), d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = l; } } return best; });
  // 线路生长关键帧 [时刻, 长度]：每段停在一站
  const MT_KEYS = [[0.2, 0], [0.7, MT_AT[1]], [0.95, MT_AT[1]], [1.4, MT_AT[2]], [1.9, MT_AT[2]], [2.3, MT_AT[3]], [2.55, MT_AT[3]], [3.0, MT_AT[4]], [3.7, MT_AT[4]], [4.2, MT_LEN]];
  const MT_TRAIN = [4.2, 5.3];                                  // 列车从起点开到终点的时段
  CELLS[3] = (k, w, h, u) => {
    k.fillStyle = '#FAFAF7'; k.fillRect(0, 0, CW, CH);
    let l = 0;
    for (let i = 0; i < MT_KEYS.length - 1; i++) if (u >= MT_KEYS[i][0]) l = mix(MT_KEYS[i][1], MT_KEYS[i + 1][1], inOut3(seg(u, MT_KEYS[i][0], MT_KEYS[i + 1][0])));
    const fade = 1 - resetK(u);
    k.save(); k.globalAlpha = fade; k.lineCap = 'round'; k.lineJoin = 'round';
    // 线路牌
    k.globalAlpha = fade * seg(u, 0.2, 0.4);
    k.fillStyle = MT_RED; k.beginPath(); k.roundRect(16, 14, 22, 22, 4); k.fill();
    k.fillStyle = '#fff'; k.font = `900 15px ${DISP}`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('1', 27, 26);
    k.fillStyle = MT_INK; k.font = `800 15px ${SANS}`; k.textAlign = 'left'; k.fillText('1 号线', 44, 26);
    k.globalAlpha = fade;
    // 底线（灰）+ 生长中的红线
    k.lineWidth = 6; k.strokeStyle = '#E6E6E2'; strokePts(k, MT_LINE);
    k.strokeStyle = MT_RED; if (l > 0) strokePts(k, polyCut(MT_LINE, l));
    // 换乘支线：到市中心站后画出
    k.strokeStyle = MT_GOLD; strokeProg(k, MT_X, inOut3(seg(u, 3.1, 3.5)));
    // 站点：线路到站才弹出
    MT_ST.forEach(([x, y, cn, en, kind, dx, dy], i) => {
      if (u < 0.2 || l < MT_AT[i] - 0.5) return;
      const reach = MT_KEYS.find(kf => kf[1] >= MT_AT[i] - 0.5)[0];
      const sc = backOut(seg(u, reach, reach + 0.25));
      const off = i === MT_OFF && u >= 1.6;
      k.save(); k.translate(x, y); k.scale(sc, sc);
      k.fillStyle = '#fff'; k.strokeStyle = off ? '#AAA' : kind ? MT_INK : MT_RED; k.lineWidth = kind ? 3 : 2;
      k.beginPath(); k.arc(0, 0, kind ? 7 : 4.5, 0, TAU); k.fill(); k.stroke();
      k.restore();
      k.globalAlpha = fade * seg(u, reach, reach + 0.2) * (off ? 0.45 : 1);
      k.textAlign = 'left'; k.textBaseline = 'alphabetic';
      k.fillStyle = MT_INK; k.font = `800 13px ${SANS}`; k.fillText(cn, x + dx, y + dy);
      k.fillStyle = '#888'; k.font = `500 7px ${MONO}`; k.fillText(en, x + dx, y + dy + 10);
      k.globalAlpha = fade;
    });
    // 「暂停服务」「换乘 2 号线」标签
    const tag = (s, x, y, bg, fg, a) => {
      if (a <= 0) return;
      k.globalAlpha = fade * a; k.font = `800 9px ${SANS}`; const tw = k.measureText(s).width;
      k.fillStyle = bg; k.beginPath(); k.roundRect(x, y, tw + 10, 15, 3); k.fill();
      k.fillStyle = fg; k.textAlign = 'left'; k.textBaseline = 'middle'; k.fillText(s, x + 5, y + 8);
      k.globalAlpha = fade;
    };
    tag('暂停服务', 180, 138, '#888', '#fff', seg(u, 1.65, 1.8));
    tag('换乘 2 号线', 366, 10, MT_GOLD, MT_INK, seg(u, 3.4, 3.55));
    // 列车：线路全部建成后从起点开到终点，车头朝向取当前路段方向
    if (u >= MT_TRAIN[0]) {
      const tl = MT_LEN * inOut3(seg(u, MT_TRAIN[0], MT_TRAIN[1]));
      const [tx, ty] = polyAt(MT_LINE, tl), [bx, by] = polyAt(MT_LINE, Math.max(0, tl - 2)), [fx, fy] = polyAt(MT_LINE, Math.min(MT_LEN, tl + 2));
      k.save(); k.translate(tx, ty); k.rotate(Math.atan2(fy - by, fx - bx));
      k.fillStyle = MT_INK; k.strokeStyle = '#fff'; k.lineWidth = 1.5;
      k.beginPath(); k.roundRect(-12, -5.5, 24, 11, 5.5); k.fill(); k.stroke();
      k.restore();
    }
    k.restore();
  };

  // @element 05
  // 05 象形统计：米色纸上三座城市每天乘地铁的人数，1 个人形 = 10 万人；人形一行行盖章落下（落地压扁回弹），
  // 行末数字跟着滚到终值，最多那一行变红并挂「最多」；复位时人形从右往左依次抬起消失
  const IS_BG = '#EFE7D6', IS_GRAY = '#8F877A', IS_INK = '#1F1B16', IS_RED = '#C8352B';
  const IS_ROWS = [['A 城', 12, 76], ['B 城', 8, 122], ['C 城', 5, 168]];   // [名称, 人形个数, 行中线 y]
  const IS_X0 = 100, IS_DX = 24, IS_UNIT = 10;                  // 第一个人形 x、间距、每个人形代表的万人数
  const IS_GAP = 0.11, IS_ROWGAP = 0.2;                          // 同行人形间隔、换行停顿
  const IS_MAXN = Math.max(...IS_ROWS.map(r => r[1]));
  // 每行第一个人形的盖章时刻
  const IS_START = IS_ROWS.reduce((acc, r, i) => { acc.push(i ? acc[i - 1] + IS_ROWS[i - 1][1] * IS_GAP + IS_ROWGAP : 0.5); return acc; }, []);
  const IS_HI = 3.9;                                             // 最多那一行变色的时刻
  function isPerson(k, col) {
    k.fillStyle = col;
    k.beginPath(); k.arc(0, -10, 4.2, 0, TAU); k.fill();
    k.beginPath(); k.moveTo(-5, -4.5); k.lineTo(5, -4.5); k.lineTo(7, 10); k.lineTo(-7, 10); k.closePath(); k.fill();
  }
  CELLS[4] = (k, w, h, u) => {
    k.fillStyle = IS_BG; k.fillRect(0, 0, CW, CH);
    const txtA = seg(u, 0.1, 0.4) * (1 - seg(u, 5.9, 6.3));   // 文字层：开场淡入、复位末段淡出
    k.save();
    // 图例与标题
    k.globalAlpha = txtA;
    k.save(); k.translate(26, 30); k.scale(0.8, 0.8); isPerson(k, IS_GRAY); k.restore();
    k.fillStyle = IS_INK; k.font = `700 12px ${SANS}`; k.textAlign = 'left'; k.textBaseline = 'middle'; k.fillText(`= ${IS_UNIT} 万人`, 38, 30);
    k.font = `900 15px ${SANS}`; k.textAlign = 'right'; k.fillText('每天乘地铁的人数', 523, 30);
    const hi = seg(u, IS_HI, IS_HI + 0.3);
    IS_ROWS.forEach(([name, n, cy], r) => {
      k.globalAlpha = txtA;
      k.fillStyle = IS_INK; k.font = `900 15px ${SANS}`; k.textAlign = 'left'; k.textBaseline = 'middle'; k.fillText(name, 22, cy + 1);
      // 已盖下的个数 → 行末数字
      let done = 0;
      for (let i = 0; i < n; i++) {
        const at = IS_START[r] + i * IS_GAP, t = seg(u, at, at + 0.16);
        if (t <= 0) continue;
        if (t >= 0.5) done++;
        // 复位：按列从右往左抬起，最右一列先走
        const lt = SHOW + (IS_MAXN - 1 - i) * 0.045, lift = out3(seg(u, lt, lt + 0.25));
        if (lift >= 1) continue;
        const drop = out3(clamp(t * 1.6)), sq = Math.sin(Math.PI * seg(t, 0.55, 1));
        const sc = mix(1.5, 1, drop);
        const col = r === 0 && hi > 0 ? (hi >= 1 ? IS_RED : `rgb(${Math.round(mix(143, 200, hi))},${Math.round(mix(135, 53, hi))},${Math.round(mix(122, 43, hi))})`) : IS_GRAY;
        k.globalAlpha = clamp(t * 3) * (1 - lift);
        k.save(); k.translate(IS_X0 + i * IS_DX, cy + 10 - 30 * lift);
        k.scale(sc * (1 + 0.1 * sq), sc * (1 - 0.18 * sq)); k.translate(0, -10);
        isPerson(k, col); k.restore();
      }
      if (done > 0) {
        k.globalAlpha = txtA;
        k.fillStyle = r === 0 && hi >= 1 ? IS_RED : IS_INK; k.font = `900 18px ${DISP}`; k.textAlign = 'left'; k.textBaseline = 'middle';
        k.fillText(`${done * IS_UNIT} 万`, IS_X0 + IS_MAXN * IS_DX + 4, cy + 1);
      }
    });
    // 「最多」标签
    const ta = seg(u, IS_HI + 0.3, IS_HI + 0.45);
    if (ta > 0) {
      k.globalAlpha = txtA * ta; k.font = `800 11px ${SANS}`;
      const x = IS_X0 + IS_MAXN * IS_DX + 64, y = IS_ROWS[0][2] - 9, sc = backOut(ta);
      k.save(); k.translate(x + 18, y + 9); k.scale(sc, sc);
      k.fillStyle = IS_RED; k.beginPath(); k.roundRect(-18, -9, 36, 18, 3); k.fill();
      k.fillStyle = '#fff'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('最多', 0, 1);
      k.restore();
    }
    k.restore();
  };

  // @element 06
  // 06 留白极简：暖白纸大片留白，一笔墨圈从起笔处顺时针画到收笔（收笔处飞白），圈内「静」淡入，
  // 下方「心不动，则万物静」逐字出现；复位时墨色褪淡、圈从收笔处倒着收回
  const MN_BG = '#F4F1EA', MN_INK = '#2A2622', MN_SUB = '#6E675C';
  const MN_C = [270, 88], MN_R = 56, MN_W = 9;                 // 圈心、半径、最粗笔宽
  const MN_A0 = -Math.PI * 0.62, MN_SPAN = TAU * 0.93;          // 起笔角度、圈的张角（不闭合，留一个口）
  const MN_N = 120, MN_DRY = 0.72;                              // 采样数；从 72% 处开始飞白
  const MN_LINE = '心不动，则万物静';
  CELLS[5] = (k, w, h, u) => {
    k.fillStyle = MN_BG; k.fillRect(0, 0, CW, CH);
    // 纸纹：确定性的淡色纤维
    k.fillStyle = 'rgba(120,100,70,0.05)';
    for (let i = 0; i < 160; i++) k.fillRect(hash(i * 3) * CW, hash(i * 7 + 1) * CH, 6 + hash(i) * 14, 1);
    const back = inOut3(seg(u, SHOW, SHOW + 0.8));              // 复位：圈从收笔处往回收
    const prog = inOut3(seg(u, 0.3, 1.5)) * (1 - back);
    const ink = 1 - 0.7 * seg(u, SHOW, SHOW + 0.5);             // 复位时墨色褪淡
    const n = Math.floor(MN_N * prog);
    k.save(); k.lineCap = 'round'; k.strokeStyle = MN_INK;
    for (let i = 0; i < n; i++) {
      const t = i / MN_N, a1 = MN_A0 + MN_SPAN * t, a2 = MN_A0 + MN_SPAN * (i + 1) / MN_N;
      // 笔宽：起笔稍细 → 中段最粗 → 收笔变细
      const wd = MN_W * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, t * 1.3))) * (1 - 0.5 * seg(t, 0.8, 1));
      const r1 = MN_R + 2 * Math.sin(t * 9), r2 = MN_R + 2 * Math.sin((i + 1) / MN_N * 9);
      const p1 = [MN_C[0] + Math.cos(a1) * r1, MN_C[1] + Math.sin(a1) * r1], p2 = [MN_C[0] + Math.cos(a2) * r2, MN_C[1] + Math.sin(a2) * r2];
      if (t < MN_DRY) { k.globalAlpha = ink * 0.92; k.lineWidth = wd; strokePts(k, [p1, p2]); continue; }
      // 飞白：拆成 5 道细丝，越往后断得越多
      const dry = (t - MN_DRY) / (1 - MN_DRY);
      for (let j = 0; j < 5; j++) {
        if (hash(i * 5 + j) < dry * 0.75) continue;
        const off = (j / 4 - 0.5) * wd, nx = Math.cos(a1), ny = Math.sin(a1);
        k.globalAlpha = ink * (0.85 - 0.4 * dry); k.lineWidth = wd / 5;
        strokePts(k, [[p1[0] + nx * off, p1[1] + ny * off], [p2[0] + nx * off, p2[1] + ny * off]]);
      }
    }
    k.restore();
    // 圈内大字与下方小字
    const fade = 1 - resetK(u);
    const za = seg(u, 1.5, 2.3);
    if (za > 0) {
      k.save(); k.globalAlpha = za * fade * ink; k.fillStyle = MN_INK;
      k.translate(MN_C[0], MN_C[1] + 2); k.scale(mix(1.06, 1, out3(za)), mix(1.06, 1, out3(za)));
      k.font = `400 54px ${SERIF}`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('静', 0, 0);
      k.restore();
    }
    k.save(); k.font = `400 13px ${SERIF}`; k.textBaseline = 'middle'; k.textAlign = 'left'; k.fillStyle = MN_SUB;
    const cs = [...MN_LINE], cw = 17, x0 = MN_C[0] - (cs.length * cw) / 2;
    cs.forEach((c, i) => { const a = seg(u, 2.5 + i * 0.16, 2.8 + i * 0.16); if (a > 0) { k.globalAlpha = a * fade; k.fillText(c, x0 + i * cw + 2, 178); } });
    k.restore();
  };

  // @element 07
  // 07 发布会极简：纯黑底一屏一件事——小标题「续航」淡入，超大白色数字从 0 滚到 32 落定，「小时」跟上，
  // 数字下方渐变色条从左扫亮；复位时整屏缓慢淡黑
  const KN_W = '#F5F5F7', KN_G = '#86868B';
  const KN_VAL = 32, KN_NUM = 112, KN_UNIT = 30, KN_BASE = 146;  // 终值、数字字号、单位字号、数字基线
  const KN_ROLL = [0.8, 2.2], KN_BAR = [2.8, 3.6];
  CELLS[6] = (k, w, h, u) => {
    k.fillStyle = '#000'; k.fillRect(0, 0, CW, CH);
    const fade = 1 - inOut3(seg(u, SHOW, SHOW + 0.9));
    k.save(); k.globalAlpha = fade;
    // 背后一团很淡的蓝色光
    const glow = k.createRadialGradient(270, 110, 0, 270, 110, 200);
    glow.addColorStop(0, `rgba(70,120,255,${0.18 * seg(u, 0.8, 2.2)})`); glow.addColorStop(1, 'rgba(0,0,0,0)');
    k.fillStyle = glow; k.fillRect(0, 0, CW, CH);
    k.textBaseline = 'alphabetic';
    // 先按终值量出整组宽度，数字右对齐到固定位置，滚动时不左右跳
    k.font = `700 ${KN_NUM}px ${DISP}`; const nw = k.measureText(String(KN_VAL)).width;
    k.font = `600 ${KN_UNIT}px ${SANS}`; const uw = k.measureText('小时').width;
    const gx = (CW - (nw + 10 + uw)) / 2, nx = gx + nw;
    // 小标题
    k.globalAlpha = fade * seg(u, 0.3, 0.7); k.fillStyle = KN_G; k.font = `600 17px ${SANS}`; k.textAlign = 'center';
    k.fillText('续航', CW / 2, 40 + 6 * (1 - out3(seg(u, 0.3, 0.7))));
    // 数字：0.8–2.2 秒从 0 滚到终值，落定时轻微回弹
    const r = seg(u, KN_ROLL[0], KN_ROLL[1]);
    if (r > 0) {
      const v = Math.round(KN_VAL * out3(r)), land = seg(u, KN_ROLL[1], KN_ROLL[1] + 0.3);
      const sc = land > 0 ? 1 + 0.04 * Math.sin(Math.PI * land) : 1;
      k.globalAlpha = fade * seg(u, KN_ROLL[0], KN_ROLL[0] + 0.2); k.fillStyle = KN_W; k.font = `700 ${KN_NUM}px ${DISP}`; k.textAlign = 'right';
      k.save(); k.translate(nx, KN_BASE); k.scale(sc, sc); k.fillText(String(v), 0, 0); k.restore();
    }
    // 单位跟上
    const ua = seg(u, 2.2, 2.6);
    if (ua > 0) { k.globalAlpha = fade * ua; k.fillStyle = KN_W; k.font = `600 ${KN_UNIT}px ${SANS}`; k.textAlign = 'left'; k.fillText('小时', nx + 10 + 12 * (1 - out3(ua)), KN_BASE); }
    // 渐变色条：从左扫亮
    const b = inOut3(seg(u, KN_BAR[0], KN_BAR[1]));
    if (b > 0) {
      const bw = nw + 10 + uw, bar = k.createLinearGradient(gx, 0, gx + bw, 0);
      bar.addColorStop(0, '#FFE7A3'); bar.addColorStop(0.5, '#F2A54A'); bar.addColorStop(1, '#E8603C');
      k.globalAlpha = fade; k.fillStyle = bar; k.beginPath(); k.roundRect(gx, KN_BASE + 16, bw * b, 5, 2.5); k.fill();
    }
    k.restore();
  };

  // @element 08
  // 08 星空光点：深蓝黑星空，背景星点按确定性闪烁；一颗金色光点从下方升起，描出灯泡轮廓，再碎成 7 颗光点
  // 散开连成星座；复位时连线断开，光点汇回一颗并沉到画面下方
  const SF_GOLD = '#F2C46D', SF_STARS = 90;
  const SF_C = [270, 92], SF_BR = 30;                           // 灯泡圆心、半径
  // 灯泡轮廓：左颈 → 绕过顶部 → 右颈 → 灯座
  const SF_BULB = (() => {
    const a0 = Math.acos(-0.4), a1 = Math.acos(0.4) + TAU, out = [];
    for (let i = 0; i <= 40; i++) { const a = mix(a0, a1, i / 40); out.push([SF_C[0] + Math.cos(a) * SF_BR, SF_C[1] + Math.sin(a) * SF_BR]); }
    const yb = SF_C[1] + Math.sin(a0) * SF_BR;
    return [...out, [282, yb + 16], [258, yb + 16], [258, yb]];
  })();
  const SF_PTS = [[96, 72], [168, 46], [236, 80], [310, 58], [362, 112], [436, 92], [470, 156]];
  const SF_EDGES = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [2, 4]];
  function sfDot(k, x, y, r, a) {
    const g = k.createRadialGradient(x, y, 0, x, y, r * 4);
    g.addColorStop(0, `rgba(255,243,208,${a})`); g.addColorStop(0.3, `rgba(242,196,109,${0.8 * a})`); g.addColorStop(1, 'rgba(242,196,109,0)');
    k.fillStyle = g; k.beginPath(); k.arc(x, y, r * 4, 0, TAU); k.fill();
    k.fillStyle = `rgba(255,250,235,${a})`; k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill();
  }
  CELLS[7] = (k, w, h, u) => {
    const bg = k.createLinearGradient(0, 0, 0, CH); bg.addColorStop(0, '#05070F'); bg.addColorStop(1, '#0E1430');
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    // 背景星：每颗按整数倍周期闪烁，6.4 秒首尾一致
    for (let i = 0; i < SF_STARS; i++) {
      const tw = 0.5 + 0.5 * Math.sin(TAU * (u / CYC) * (1 + Math.floor(hash(i * 5) * 4)) + hash(i * 9) * TAU);
      k.fillStyle = `rgba(207,214,234,${0.15 + 0.55 * tw * hash(i * 2 + 1)})`;
      k.fillRect(hash(i * 3 + 7) * CW, hash(i * 11 + 3) * CH, hash(i) > 0.85 ? 2 : 1, hash(i) > 0.85 ? 2 : 1);
    }
    // 1. 光点从下方升起，停在灯泡中心
    const scatter = out3(seg(u, 2.8, 3.4));                     // 0 = 一颗，1 = 散成星座
    const gather = inOut3(seg(u, 5.5, 5.9));                     // 复位：汇回一颗
    const sink = inOut3(seg(u, 5.9, CYC));                       // 复位：沉到画面下方
    const rise = out3(seg(u, 0.3, 1.3));
    // 2. 灯泡轮廓：1.4–2.6 秒描出，2.8–3.1 秒淡出
    const bp = inOut3(seg(u, 1.4, 2.6)), ba = 1 - seg(u, 2.8, 3.1);
    if (bp > 0 && ba > 0) {
      k.save(); k.globalAlpha = ba; k.strokeStyle = SF_GOLD; k.lineWidth = 2; k.lineJoin = 'round'; k.lineCap = 'round';
      k.shadowColor = 'rgba(242,196,109,0.8)'; k.shadowBlur = 10; strokeProg(k, SF_BULB, bp);
      if (bp >= 1) { strokePts(k, [[260, 130], [280, 130]]); }
      k.restore();
    }
    // 3. 星座连线：3.4–4.4 秒逐条画出，复位时向中点收缩断开
    const brk = seg(u, SHOW, 5.7);
    SF_EDGES.forEach(([a, b], i) => {
      const p = inOut3(seg(u, 3.4 + i * 0.14, 3.7 + i * 0.14)); if (p <= 0 || brk >= 1) return;
      const A = SF_PTS[a], B = SF_PTS[b], m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
      const s = [mix(A[0], m[0], brk), mix(A[1], m[1], brk)], e = [mix(B[0], m[0], brk), mix(B[1], m[1], brk)];
      k.save(); k.strokeStyle = 'rgba(242,196,109,0.6)'; k.lineWidth = 1.2; strokePts(k, [s, [mix(s[0], e[0], p), mix(s[1], e[1], p)]]); k.restore();
    });
    // 光点：一颗（升起 / 灯丝）或 7 颗（星座）
    if (scatter <= 0 || gather >= 1) {
      const y = gather >= 1 ? mix(SF_C[1], 236, sink) : mix(236, SF_C[1], rise);
      sfDot(k, SF_C[0], y, u > 1.3 && u < 2.8 ? 4 + 1.5 * seg(u, 1.3, 1.6) : 4, 1);
    } else {
      const s = scatter * (1 - gather);
      SF_PTS.forEach(([x, y], i) => {
        const tw = 0.85 + 0.15 * Math.sin(TAU * (u / CYC) * 4 + i);
        sfDot(k, mix(SF_C[0], x, s), mix(SF_C[1], y, s), mix(4, 2.6, s), tw);
      });
    }
  };

  // @element 09
  // 09 暗金线描：固定机位，炭黑底，琥珀色发光线条一笔笔画出地面、书桌、椅子、读书的人、摊开的书和台灯；
  // 台灯闪两下亮起，在桌面投出一圈暖光，书页翻过一页；复位时线条从末端往回收，光晕熄灭
  const DG_BG = '#15130F', DG_GOLD = '#F0B44C', DG_GLOW = 'rgba(240,180,76,0.7)', DG_BLUR = 8;
  const DG_HEAD = circlePts(196, 64, 13, 32, Math.PI / 2);
  // [折线, 开始时刻, 结束时刻]：按"地面 → 桌 → 椅 → 人 → 书 → 灯"的顺序画
  const DG_STROKES = [
    [[[60, 184], [480, 184]], 0.3, 0.7],
    [[[226, 120], [434, 120]], 0.6, 0.95], [[[244, 120], [244, 184]], 0.85, 1.05], [[[416, 120], [416, 184]], 0.95, 1.15],
    [[[146, 82], [150, 142], [204, 142]], 1.1, 1.45], [[[152, 142], [152, 184]], 1.35, 1.5], [[[200, 142], [200, 184]], 1.4, 1.55],
    [DG_HEAD, 1.5, 1.8],
    [[[194, 78], [186, 104], [182, 138], [236, 140], [236, 181], [252, 182]], 1.75, 2.25],
    [[[192, 92], [222, 112], [262, 112]], 2.15, 2.5],
    [[[258, 119], [262, 108], [292, 113], [322, 108], [326, 119]], 2.5, 2.85], [[[292, 113], [292, 119]], 2.8, 2.9],
    [[[380, 120], [404, 120]], 2.95, 3.05], [[[392, 120], [372, 84], [398, 60]], 3.0, 3.25],
    [[[388, 56], [414, 62], [422, 82], [396, 79], [388, 56]], 3.2, 3.5],
  ];
  const DG_ON = 3.6, DG_FLIP = [4.2, 4.8];
  CELLS[8] = (k, w, h, u) => {
    k.fillStyle = DG_BG; k.fillRect(0, 0, CW, CH);
    // 台灯：3.6 秒起闪两下后常亮，复位开始时熄灭
    const flick = u >= DG_ON && u < DG_ON + 0.3 ? (hash(Math.floor(u * 30)) > 0.45 ? 1 : 0.25) : 1;
    const lit = seg(u, DG_ON, DG_ON + 0.05) * flick * (1 - seg(u, SHOW, SHOW + 0.25));
    if (lit > 0) {
      // 光锥 + 桌面光圈
      k.save(); k.globalAlpha = lit;
      const cone = k.createLinearGradient(410, 80, 300, 120);
      cone.addColorStop(0, 'rgba(255,190,90,0.22)'); cone.addColorStop(1, 'rgba(255,140,60,0.03)');
      k.fillStyle = cone; k.beginPath(); k.moveTo(396, 79); k.lineTo(422, 82); k.lineTo(380, 120); k.lineTo(250, 120); k.closePath(); k.fill();
      k.translate(318, 120); k.scale(1, 0.13);
      const pool = k.createRadialGradient(0, 0, 0, 0, 0, 90);
      pool.addColorStop(0, 'rgba(255,200,110,0.55)'); pool.addColorStop(0.6, 'rgba(255,106,61,0.18)'); pool.addColorStop(1, 'rgba(255,106,61,0)');
      k.fillStyle = pool; k.beginPath(); k.arc(0, 0, 90, 0, TAU); k.fill();
      k.restore();
    }
    k.save(); k.strokeStyle = DG_GOLD; k.lineWidth = 1.8; k.lineCap = 'round'; k.lineJoin = 'round';
    k.shadowColor = DG_GLOW; k.shadowBlur = DG_BLUR;
    const N = DG_STROKES.length;
    DG_STROKES.forEach(([pts, a, b], i) => {
      // 复位：后画的先收，每笔 0.3 秒从末端往回收
      const rs = SHOW + (N - 1 - i) * 0.035, back = inOut3(seg(u, rs, rs + 0.3));
      strokeProg(k, pts, inOut3(seg(u, a, b)) * (1 - back));
    });
    // 灯泡亮点
    if (lit > 0) { k.globalAlpha = lit; k.fillStyle = '#FFF4D6'; k.beginPath(); k.arc(408, 79, 2.6, 0, TAU); k.fill(); k.globalAlpha = 1; }
    // 翻页：从右页绕书脊翻到左页，页角抬起成弧
    const f = inOut3(seg(u, DG_FLIP[0], DG_FLIP[1]));
    if (f > 0 && f < 1) {
      const tip = [292 + 30 * Math.cos(Math.PI * f), 113 - 16 * Math.sin(Math.PI * f) - 5 * (1 - Math.abs(Math.cos(Math.PI * f)))];
      strokePts(k, [[292, 113], [mix(292, tip[0], 0.5), Math.min(113, tip[1]) - 4 * Math.sin(Math.PI * f)], tip]);
    }
    k.restore();
  };

  // @element 10
  // 10 黏土卡哇伊：粉色奶油底，黏土质感（软阴影 + 左上高光）；奶茶摊、奶茶杯和三个豆豆依次挤压回弹出场，
  // 豆豆眨眼，奶茶递到第一个豆豆手上，它开心地连跳两下；复位时全部压扁缩回地面
  const CL_BG = '#FFF1F5', CL_FLOOR = '#FFD6E3', CL_DARK = '#3B2430', CL_GROUND = 170;
  const CL_BEANS = [[322, '#FF8FB1', 1.0, 2.3], [252, '#C9B6FF', 1.3, 2.9], [182, '#FFD25A', 1.6, 3.3]];  // [x, 颜色, 出场时刻, 眨眼时刻]
  const CL_BW = 36, CL_BH = 48;
  const CL_HAND = [3.0, 3.5], CL_JUMP = [3.7, 4.5];
  // 十六进制颜色按比例混白 / 混黑，做黏土的高光与暗部
  const clShade = (hex, t) => { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(t > 0 ? mix(v, 255, t) : mix(v, 0, -t))); return `rgb(${c})`; };
  // 挤压回弹：t 0→1，先扁宽再瘦高再回原样；以底边为锚
  const clPop = t => { const s = backOut(clamp(t)); return [1 + (1 - s) * 0.6, s]; };
  // 黏土体：地面软阴影 + 径向渐变填充 + 左上高光
  function clBody(k, x, yb, sx, sy, wd, ht, col, path) {
    if (sy <= 0.01) return;
    k.save(); k.fillStyle = `rgba(150,60,90,${0.18 * Math.min(1, sy)})`; k.beginPath(); k.ellipse(x, CL_GROUND + 2, wd * 0.55 * sx, 4, 0, 0, TAU); k.fill(); k.restore();
    k.save(); k.translate(x, yb); k.scale(sx, sy);
    const g = k.createRadialGradient(-wd * 0.25, -ht * 0.75, 2, 0, -ht * 0.5, ht * 0.75);
    g.addColorStop(0, clShade(col, 0.45)); g.addColorStop(0.55, col); g.addColorStop(1, clShade(col, -0.18));
    k.fillStyle = g; path(k); k.fill();
    k.fillStyle = 'rgba(255,255,255,0.55)'; k.beginPath(); k.ellipse(-wd * 0.22, -ht * 0.78, wd * 0.12, ht * 0.07, -0.5, 0, TAU); k.fill();
    k.restore();
  }
  const clBean = k => { k.beginPath(); k.roundRect(-CL_BW / 2, -CL_BH, CL_BW, CL_BH, CL_BW / 2); };
  function clFace(k, x, yb, sx, sy, blink, happy) {
    if (sy < 0.3) return;
    k.save(); k.translate(x, yb - CL_BH * 0.58 * sy); k.scale(sx, sy);
    k.fillStyle = CL_DARK; k.strokeStyle = CL_DARK; k.lineWidth = 1.8; k.lineCap = 'round';
    [-7, 7].forEach(ex => {
      if (happy) { k.beginPath(); k.arc(ex, 1, 3, Math.PI * 1.15, Math.PI * 1.85); k.stroke(); }
      else if (blink) strokePts(k, [[ex - 2.6, 0], [ex + 2.6, 0]]);
      else { k.beginPath(); k.arc(ex, 0, 2.6, 0, TAU); k.fill(); }
    });
    k.fillStyle = 'rgba(224,90,138,0.45)'; [-11, 11].forEach(bx => { k.beginPath(); k.ellipse(bx, 6, 3.5, 2, 0, 0, TAU); k.fill(); });
    k.beginPath(); if (happy) { k.fillStyle = CL_DARK; k.arc(0, 5, 3.4, 0, Math.PI); k.fill(); } else { k.arc(0, 4, 2.6, 0.2, Math.PI - 0.2); k.stroke(); }
    k.restore();
  }
  function clCup(k, x, yb, sx, sy) {
    if (sy <= 0.01) return;
    k.save(); k.translate(x, yb); k.scale(sx, sy);
    k.strokeStyle = '#E05A8A'; k.lineWidth = 2.4; k.lineCap = 'round'; strokePts(k, [[3, -30], [8, -44]]);   // 吸管
    const g = k.createLinearGradient(-11, 0, 11, 0); g.addColorStop(0, clShade('#D9A06B', 0.3)); g.addColorStop(1, '#C98A55');
    k.fillStyle = g; k.beginPath(); k.moveTo(-12, -28); k.lineTo(12, -28); k.lineTo(9, 0); k.lineTo(-9, 0); k.closePath(); k.fill();
    k.fillStyle = '#C9B6FF'; k.beginPath(); k.roundRect(-14, -33, 28, 6, 3); k.fill();                          // 杯盖
    k.fillStyle = CL_DARK; [[-5, -5], [0, -4], [5, -6], [-2, -9], [4, -10]].forEach(([px, py]) => { k.beginPath(); k.arc(px, py, 1.8, 0, TAU); k.fill(); });  // 珍珠
    k.fillStyle = 'rgba(255,255,255,0.5)'; k.fillRect(-8, -24, 2.5, 16);
    k.restore();
  }
  CELLS[9] = (k, w, h, u) => {
    k.fillStyle = CL_BG; k.fillRect(0, 0, CW, CH);
    k.fillStyle = CL_FLOOR; k.fillRect(0, CL_GROUND, CW, CH - CL_GROUND);
    // 复位：按"后出场先压扁"错开 0.08 秒
    const flat = i => inOut3(seg(u, SHOW + i * 0.08, SHOW + 0.4 + i * 0.08));
    const squash = ([sx, sy], f) => [sx * (1 + 0.5 * f), sy * (1 - f)];
    // 奶茶摊
    const [stx, sty] = squash(clPop(seg(u, 0.2, 0.65)), flat(4));
    clBody(k, 440, CL_GROUND, stx, sty, 110, 62, '#9EE6D0', kk => { kk.beginPath(); kk.roundRect(-55, -62, 110, 62, 10); });
    if (sty > 0.3) {
      k.save(); k.translate(440, CL_GROUND); k.scale(stx, sty);
      ['#FF8FB1', '#FFFFFF', '#FF8FB1', '#FFFFFF', '#FF8FB1'].forEach((c, i) => { k.fillStyle = c; k.beginPath(); k.roundRect(-60 + i * 24, -72, 24, 12, i === 0 ? [6, 0, 0, 6] : i === 4 ? [0, 6, 6, 0] : 0); k.fill(); });
      k.fillStyle = CL_DARK; k.font = `800 12px ${SANS}`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('奶茶', 0, -36);
      k.restore();
    }
    // 豆豆
    const j = seg(u, CL_JUMP[0], CL_JUMP[1]) * 2, jf = j - Math.floor(j);
    const hop = u >= CL_JUMP[0] && u < CL_JUMP[1] ? Math.sin(Math.PI * jf) * 26 : 0;
    const landSq = u >= CL_JUMP[0] && u < CL_JUMP[1] + 0.12 ? Math.max(0, 1 - Math.min(jf, 1 - jf) * 8) * (hop < 6 ? 1 : 0) : 0;
    let b0 = null;
    CL_BEANS.forEach(([x, col, at, bl], i) => {
      let [sx, sy] = squash(clPop(seg(u, at, at + 0.45)), flat(2 - i));
      const bob = Math.sin(TAU * (u / CYC) * 3 + i) * 1.2 * seg(u, at + 0.45, at + 0.6);   // 站着时轻轻起伏
      let yb = CL_GROUND;
      if (i === 0) { yb -= hop; sx *= 1 + 0.12 * landSq; sy *= 1 - 0.12 * landSq; b0 = [x, yb, sx, sy]; }
      clBody(k, x, yb, sx, sy * (1 + bob / CL_BH), CL_BW, CL_BH, col, clBean);
      const blink = Math.abs(u - bl) < 0.07 || Math.abs(u - bl - 0.22) < 0.05;
      clFace(k, x, yb, sx, sy, blink, i === 0 && u >= CL_HAND[1]);
    });
    // 奶茶杯：先挤压出场在摊上，3.0–3.5 秒沿弧线递到第一个豆豆身侧，之后跟着它跳
    const [cx0, cy0] = [440, CL_GROUND - 62];
    let [csx, csy] = clPop(seg(u, 0.6, 1.0));
    let cx = cx0, cy = cy0;
    const hp = inOut3(seg(u, CL_HAND[0], CL_HAND[1]));
    if (b0 && hp > 0) {
      const tx = b0[0] + 24, ty = b0[1] - 14;
      cx = mix(cx0, tx, hp); cy = mix(cy0, ty, hp) - Math.sin(Math.PI * hp) * 30;
      if (hp >= 1) { csx = b0[2]; csy = Math.min(1, b0[3]); }
    }
    if (hp <= 0) [csx, csy] = squash([csx, csy], flat(3));
    clCup(k, cx, cy, csx * 0.9, csy * 0.9);
  };

  // @element 11
  // 11 杂志编辑：暖白纸上一篇专题开篇页「慢生活」——刊头细线从中间向两侧拉开，衬线大标题落下，两栏正文灰条逐行排出，
  // 右栏一段正文换成大号斜体引语并加左侧红竖线，右下角页码；复位时整页向左翻走，露出下一张空白页
  const ED_BG = '#F6F1E7', ED_INK = '#1E1B17', ED_DIM = '#8A8174', ED_RED = '#B3261E';
  const ED_M = 30, ED_RULE = 30;                                 // 左右页边距、刊头细线 y
  const ED_RULE_T = [0.2, 0.7], ED_TITLE_T = [0.7, 1.2];          // 细线拉开、标题落下的时段
  const ED_COLS = [30, 186], ED_COLW = 140;                       // 两栏正文 x、栏宽
  const ED_ROW0 = 118, ED_LH = 10, ED_ROWS = 7;                   // 首行 y、行距、每栏行数
  const ED_LINE_T0 = 1.3, ED_LINE_DT = 0.09;                      // 正文灰条开始时刻、逐行间隔
  const ED_QX = 372, ED_QW = 137, ED_QROWS = 5, ED_QUOTE = [3.2, 3.8];   // 右栏 x、宽、灰条行数、换成引语的时段
  const ED_QLINES = ['「慢一点，', '才看得见。」'];
  const ED_PAGE_T = 4.0, ED_TURN = [SHOW, SHOW + 0.8];            // 页码出现、整页向左翻走
  // 灰条一行：最后一行短一截，像段落收尾
  function edBar(k, x, y, wd, last, a) { k.globalAlpha = a; k.fillRect(x, y, wd * (last ? 0.55 : 1), 3); }
  CELLS[10] = (k, w, h, u) => {
    // 底下一页：翻走后露出的空白页，和 0 秒画面一致
    k.fillStyle = ED_BG; k.fillRect(0, 0, CW, CH);
    const turn = inOut3(seg(u, ED_TURN[0], ED_TURN[1]));
    if (turn >= 1) return;
    k.save(); k.translate(-turn * (CW + 24), 0);
    k.fillStyle = ED_BG; k.fillRect(0, 0, CW, CH);
    // 翻页时右边缘投一道阴影，看得出是一张纸
    if (turn > 0) { const sh = k.createLinearGradient(CW, 0, CW + 18, 0); sh.addColorStop(0, 'rgba(60,40,20,0.22)'); sh.addColorStop(1, 'rgba(60,40,20,0)'); k.fillStyle = sh; k.fillRect(CW, 0, 18, CH); }
    // 刊头细线：从中间向两侧拉开
    const half = (CW / 2 - ED_M) * inOut3(seg(u, ED_RULE_T[0], ED_RULE_T[1]));
    if (half > 0) { k.fillStyle = ED_INK; k.fillRect(CW / 2 - half, ED_RULE, half * 2, 1); }
    const ma = seg(u, ED_RULE_T[1], ED_RULE_T[1] + 0.3);
    if (ma > 0) {
      k.globalAlpha = ma; k.textBaseline = 'alphabetic';
      k.fillStyle = ED_INK; k.font = `700 12px ${SERIF}`; k.textAlign = 'left'; k.fillText('生活周刊', ED_M, ED_RULE - 8);
      k.fillStyle = ED_DIM; k.font = `500 10px ${DISP}`; k.textAlign = 'right'; k.fillText('NO. 46 · 2026', CW - ED_M, ED_RULE - 8);
      k.fillStyle = ED_RED; k.font = `700 10px ${SANS}`; k.textAlign = 'left'; k.fillText('专题 · FEATURE', ED_M, ED_RULE + 16);
      k.globalAlpha = 1;
    }
    // 衬线大标题：从上方轻轻落下
    const ta = seg(u, ED_TITLE_T[0], ED_TITLE_T[1]);
    if (ta > 0) {
      k.globalAlpha = ta; k.fillStyle = ED_INK; k.font = `700 50px ${SERIF}`; k.textAlign = 'left';
      k.fillText('慢生活', ED_M, 98 - 18 * (1 - out3(ta))); k.globalAlpha = 1;
    }
    // 两栏正文灰条：先排左栏再排右栏，逐行出现
    k.fillStyle = ED_DIM;
    ED_COLS.forEach((cx, c) => {
      for (let r = 0; r < ED_ROWS; r++) {
        const a = seg(u, ED_LINE_T0 + (c * ED_ROWS + r) * ED_LINE_DT, ED_LINE_T0 + (c * ED_ROWS + r) * ED_LINE_DT + 0.25);
        if (a > 0) edBar(k, cx, ED_ROW0 + r * ED_LH, ED_COLW * (0.9 + 0.1 * hash(c * 20 + r)) * a, r === ED_ROWS - 1, 0.55);
      }
    });
    // 右栏：接在两栏之后排出同样的灰条，再换成大号斜体引语 + 左侧红竖线
    const q = inOut3(seg(u, ED_QUOTE[0], ED_QUOTE[1]));
    for (let r = 0; r < ED_QROWS; r++) {
      const t0 = ED_LINE_T0 + (2 * ED_ROWS + r) * ED_LINE_DT;
      const a = seg(u, t0, t0 + 0.25);
      if (a > 0 && q < 1) edBar(k, ED_QX + 12, 98 + r * ED_LH, (ED_QW - 12) * (0.88 + 0.12 * hash(r + 50)) * a, r === ED_QROWS - 1, 0.55 * (1 - q));
    }
    k.globalAlpha = 1;
    if (q > 0) {
      k.fillStyle = ED_RED; k.fillRect(ED_QX, 92, 2.5, 56 * q);
      k.save(); k.globalAlpha = q; k.fillStyle = ED_INK; k.font = `600 20px ${SERIF}`; k.textAlign = 'left';
      // 中文字体大多没有斜体字形，用错切变换得到稳定的斜体效果
      ED_QLINES.forEach((s, i) => { k.save(); k.translate(ED_QX + 12, 114 + i * 28); k.transform(1, 0, -0.2, 1, 0, 0); k.fillText(s, 0, 0); k.restore(); });
      k.restore();
    }
    // 右下角页码
    const pa = seg(u, ED_PAGE_T, ED_PAGE_T + 0.4);
    if (pa > 0) {
      k.globalAlpha = pa; k.fillStyle = ED_DIM; k.font = `500 10px ${DISP}`; k.textAlign = 'right'; k.fillText('P. 24', CW - ED_M, 196);
      k.fillRect(CW - ED_M - 60, 192, 24, 1); k.globalAlpha = 1;
    }
    k.restore();
  };

  // @element 12
  // 12 默片字卡：棕褐黑白胶片——光圈打开，剪影火车从右驶入站台减速停下；硬切到花边框黑底字卡「终于到了！」，
  // 再切回画面，一位乘客走下站台。全程颗粒、闪烁、竖向划痕和 18 帧/秒的抖动；复位时光圈收成黑点，下一轮再圈出
  const SL_BG = '#0B0A08', SL_INK = '#E9E1CF', SL_SIL = '#1D1812', SL_GROUND = '#6B5D48';
  const SL_FPS = 18;                                              // 抖动、闪烁、颗粒按 18 帧/秒取帧号
  const SL_TRAIN = [0.4, 2.2], SL_STOP = 120, SL_RAIL = 156;     // 火车驶入时段、车头停靠 x、站台面 y
  const SL_CARD = [2.4, 4.0];                                     // 字卡（硬切进出）
  const SL_WALK = [4.2, 5.2], SL_STEP = 34;                       // 乘客走下站台的时段、走到前景地面下移的距离
  const SL_OPEN = [0, 0.6], SL_CLOSE = [SHOW, 6.0];               // 圈出、圈入时段
  const SL_R = Math.hypot(CW, CH) / 2 + 4;                        // 光圈全开半径
  // 剪影火车：x 为车头左端；车头 + 三节车厢，车窗透出天光
  function slTrain(k, x) {
    k.fillStyle = SL_SIL;
    k.fillRect(x, 112, 70, 28); k.fillRect(x + 60, 96, 30, 46); k.fillRect(x + 56, 91, 38, 6); k.fillRect(x + 12, 96, 10, 16); k.fillRect(x - 2, 138, 94, 8);
    k.beginPath(); k.moveTo(x - 12, 150); k.lineTo(x, 130); k.lineTo(x, 150); k.closePath(); k.fill();   // 排障器
    [16, 40, 74].forEach(dx => { k.beginPath(); k.arc(x + dx, 148, 8, 0, TAU); k.fill(); });
    for (let i = 0; i < 3; i++) {
      const cx = x + 98 + i * 96;
      k.fillStyle = SL_SIL; k.fillRect(cx, 104, 90, 42); k.fillRect(cx - 6, 128, 6, 4);
      [16, 74].forEach(dx => { k.beginPath(); k.arc(cx + dx, 148, 7, 0, TAU); k.fill(); });
      k.fillStyle = '#B9A888'; for (let j = 0; j < 4; j++) k.fillRect(cx + 8 + j * 21, 112, 13, 12);
    }
    k.fillStyle = '#B9A888'; k.fillRect(x + 68, 102, 14, 12);
  }
  CELLS[11] = (k, w, h, u) => {
    const q = Math.floor(u * SL_FPS);                              // 当前胶片帧号：同一帧内抖动不变
    k.fillStyle = SL_BG; k.fillRect(0, 0, CW, CH);
    k.save(); k.translate((hash(q + 1) - 0.5) * 3, (hash(q + 2) - 0.5) * 4);
    const card = u >= SL_CARD[0] && u < SL_CARD[1];
    if (!card) {
      const sky = k.createLinearGradient(0, 0, 0, SL_RAIL); sky.addColorStop(0, '#D8C9A8'); sky.addColorStop(1, '#A8977A');
      k.fillStyle = sky; k.fillRect(-6, -6, CW + 12, SL_RAIL + 6);
      k.fillStyle = SL_GROUND; k.fillRect(-6, SL_RAIL, CW + 12, CH - SL_RAIL + 6);
      k.fillStyle = '#4E4334'; k.fillRect(-6, SL_RAIL, CW + 12, 4);
      // 火车：减速驶入（out3），停稳后车头冒烟
      const tx = mix(CW + 20, SL_STOP, out3(seg(u, SL_TRAIN[0], SL_TRAIN[1])));
      for (let i = 0; i < 6; i++) {
        const p = (u * 0.9 + i / 6) % 1;
        k.fillStyle = `rgba(138,130,112,${0.5 * (1 - p)})`;
        k.beginPath(); k.arc(tx + 17 + p * 46, 92 - p * 56, 5 + p * 12, 0, TAU); k.fill();
      }
      slTrain(k, tx);
      // 站台雨棚与立柱在火车前面
      k.fillStyle = SL_SIL; k.fillRect(-6, 26, CW + 12, 9);
      [40, 250, 460].forEach(px => k.fillRect(px, 35, 5, SL_RAIL - 35));
      // 乘客：切回画面后从车门走下站台
      // 剪影和车身同色，所以人走到车前方的站台地面上（基线比轨面低 SL_STEP），才看得出轮廓
      const wk = seg(u, SL_WALK[0], SL_WALK[1]);
      if (u >= SL_CARD[1]) {
        const px = mix(236, 330, wk), by = SL_RAIL + SL_STEP * out3(seg(wk, 0, 0.3)), step = Math.sin(wk * Math.PI * 8) * 2;
        k.fillRect(px - 5, by - 26, 10, 18); k.fillRect(px - 4 + step, by - 9, 3, 9); k.fillRect(px + 1 - step, by - 9, 3, 9);
        k.beginPath(); k.arc(px, by - 31, 5, 0, TAU); k.fill(); k.fillRect(px - 7, by - 37, 14, 2); k.fillRect(px - 4, by - 41, 8, 4);   // 礼帽
        k.fillRect(px + 6, by - 16, 8, 7);                          // 手提箱
      }
    } else {
      // 字卡：黑底双线边框 + 四角卷草
      k.fillStyle = SL_BG; k.fillRect(-6, -6, CW + 12, CH + 12);
      k.strokeStyle = SL_INK; k.lineWidth = 2; k.strokeRect(22, 16, CW - 44, CH - 32);
      k.lineWidth = 1; k.strokeRect(30, 24, CW - 60, CH - 48);
      [[30, 24, 1, 1], [CW - 30, 24, -1, 1], [30, CH - 24, 1, -1], [CW - 30, CH - 24, -1, -1]].forEach(([x, y, a, b]) => {
        k.lineWidth = 1.5; k.beginPath(); k.moveTo(x, y + b * 30); k.quadraticCurveTo(x + a * 4, y + b * 4, x + a * 30, y); k.stroke();
        k.beginPath(); k.arc(x + a * 10, y + b * 10, 3, 0, TAU); k.stroke();
      });
      k.fillStyle = SL_INK; k.font = `700 34px ${SERIF}`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('终于到了！', CW / 2, CH / 2 + 2);
    }
    k.restore();
    // 胶片质感：整帧闪烁、颗粒与灰尘、竖向划痕、暗角
    k.fillStyle = `rgba(0,0,0,${0.14 * hash(q * 3 + 5)})`; k.fillRect(0, 0, CW, CH);
    for (let i = 0; i < 50; i++) {
      const g = hash(q * 37 + i * 11);
      k.fillStyle = g > 0.5 ? 'rgba(242,234,216,0.5)' : 'rgba(20,16,10,0.4)';
      const s = hash(q * 13 + i) > 0.92 ? 2.5 : 1;
      k.fillRect(hash(q * 31 + i * 7) * CW, hash(q * 17 + i * 3) * CH, s, s);
    }
    const sq = Math.floor(u * 6);                                   // 划痕换位比抖动慢，像胶片上的长划痕
    k.fillStyle = 'rgba(240,230,210,0.35)';
    for (let i = 0; i < 2; i++) if (hash(sq + i * 5) > 0.5) k.fillRect(hash(sq + i * 9 + 3) * CW, 0, 1, CH);
    const vg = k.createRadialGradient(CW / 2, CH / 2, 110, CW / 2, CH / 2, 300);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.65)');
    k.fillStyle = vg; k.fillRect(0, 0, CW, CH);
    // 光圈：0 秒与 6.4 秒都是全黑，首尾无缝
    const r = u < SL_CLOSE[0] ? SL_R * out3(seg(u, SL_OPEN[0], SL_OPEN[1])) : SL_R * (1 - inOut3(seg(u, SL_CLOSE[0], SL_CLOSE[1])));
    if (r < SL_R) {
      k.fillStyle = '#000'; k.beginPath(); k.rect(0, 0, CW, CH);
      if (r > 0.5) k.arc(CW / 2, CH / 2, r, 0, TAU, true);
      k.fill('evenodd');
    }
  };

  // @element 13
  // 13 RPG 对话框：上方像素场景（勇者站在商人的摊位前），下方深蓝对话框逐字打出「要买药草吗？」并闪光标；
  // 弹出选项「买 / 不买」，光标上下移动后选中「买」，金币 50 → 40；复位时对话框合上，场景像素化淡出
  const RP_BG = '#0A0C1C', RP_W = '#F4F4F4', RP_Y = '#FFD84A', RP_BOX = '#141A46', RP_IN = '#2C3680';
  const RP_PX = 4;                                                // 一个像素格 = 4 px
  const RP_SKY = ['#24306E', '#2E3C86', '#3C4C9C', '#5464AE', '#7A78B8', '#B68CB0'], RP_GRASS = 22;   // 天空色带、草地起始行
  const RP_DLG = [12, 120, 515, 80];                              // 对话框 x, y, w, h
  const RP_LINES = [['要买药草吗？', 0.8, 1.6], ['谢谢惠顾！', 4.0, 4.5]];   // [台词, 开始打字, 打完]
  const RP_MENU = [2.0, 3.9], RP_PICK = [[2.0, 0], [2.6, 1], [3.1, 0]], RP_OK = 3.5;   // 菜单时段、光标（时刻, 项）、确认时刻
  const RP_GOLD = 50, RP_COST = 10;
  const RP_IN_T = [0, 0.4], RP_OUT_T = [5.6, 6.3];               // 场景由粗到细出现、由细到粗消失
  // 像素框：白边 + 内衬线，像老式 RPG 的窗口
  function rpBox(k, x, y, wd, ht) {
    k.fillStyle = RP_BOX; k.beginPath(); k.roundRect(x, y, wd, ht, 8); k.fill();
    k.strokeStyle = RP_W; k.lineWidth = 3; k.stroke();
    k.strokeStyle = RP_IN; k.lineWidth = 1.5; k.beginPath(); k.roundRect(x + 4, y + 4, wd - 8, ht - 8, 5); k.stroke();
  }
  CELLS[12] = (k, w, h, u) => {
    k.fillStyle = RP_BG; k.fillRect(0, 0, CW, CH);
    const sa = seg(u, RP_IN_T[0], RP_IN_T[1]) * (1 - seg(u, RP_OUT_T[0] + 0.2, RP_OUT_T[1]));
    // 像素化程度：块边长 4 → 64 px，坐标按块对齐，形状变粗糙
    const pix = Math.max(1 - seg(u, RP_IN_T[0], RP_IN_T[1]), seg(u, RP_OUT_T[0], RP_OUT_T[1]));
    const blk = RP_PX * Math.pow(2, Math.floor(pix * 4.99));
    const P = (x, y, ww, hh, c) => {
      const x0 = Math.floor(x * RP_PX / blk) * blk, y0 = Math.floor(y * RP_PX / blk) * blk;
      const x1 = Math.ceil((x + ww) * RP_PX / blk) * blk, y1 = Math.min(112, Math.ceil((y + hh) * RP_PX / blk) * blk);
      k.fillStyle = c; k.fillRect(x0, y0, x1 - x0, y1 - y0);
    };
    if (sa > 0) {
      k.save(); k.globalAlpha = sa;
      RP_SKY.forEach((c, i) => { const r0 = Math.floor(i * RP_GRASS / 6), r1 = Math.floor((i + 1) * RP_GRASS / 6); P(0, r0, 135, r1 - r0, c); });
      for (let i = 0; i < 12; i++) P(Math.floor(hash(i * 3) * 135), Math.floor(hash(i * 5 + 1) * 10), 1, 1, RP_W);
      P(0, RP_GRASS, 135, 6, '#3D6B3A'); for (let x = 0; x < 135; x += 3) P(x, RP_GRASS, 1, 1, '#5A8F4E');
      // 勇者
      P(41, 14, 2, 1, '#3A2418'); P(41, 15, 2, 2, '#F0C8A0'); P(40, 17, 4, 3, '#2A6CF0'); P(40, 20, 1, 2, '#24306E'); P(43, 20, 1, 2, '#24306E'); P(45, 15, 1, 5, '#D8D8E0');
      // 商人的摊位：红白遮阳棚、柜台、药瓶
      for (let i = 0; i < 10; i++) P(70 + i * 2, 9, 2, 2, i % 2 ? RP_W : '#C8352B');
      P(70, 11, 1, 11, '#7A4A32'); P(89, 11, 1, 11, '#7A4A32');
      P(79, 12, 4, 1, '#8A5A30'); P(80, 13, 2, 2, '#F0C8A0'); P(79, 15, 4, 2, '#8A4AA0');
      P(70, 17, 20, 5, '#7A4A32'); P(70, 17, 20, 1, '#A8683E');
      P(73, 15, 2, 2, '#4CC38A'); P(76, 15, 2, 2, '#4CC38A'); P(86, 15, 2, 2, '#E05A5A');
      // 金币栏
      const paid = u >= RP_OK + 0.4;
      rpBox(k, 10, 8, 78, 24);
      k.fillStyle = RP_Y; k.beginPath(); k.arc(26, 20, 6, 0, TAU); k.fill();
      k.fillStyle = RP_W; k.font = `700 13px ${MONO}`; k.textAlign = 'left'; k.textBaseline = 'middle'; k.fillText(String(paid ? RP_GOLD - RP_COST : RP_GOLD), 40, 21);
      const fa = seg(u, RP_OK + 0.4, RP_OK + 1.1);
      if (fa > 0 && fa < 1) { k.globalAlpha = sa * (1 - fa); k.fillStyle = '#FF6B5B'; k.font = `800 14px ${MONO}`; k.fillText('−' + RP_COST, 94, 22 - 12 * out3(fa)); }
      k.restore();
    }
    // 对话框：0.3–0.6 秒展开，复位时上下合拢
    const op = out3(seg(u, 0.3, 0.6)) * (1 - inOut3(seg(u, SHOW, SHOW + 0.3)));
    if (op > 0) {
      const [x, y, wd, ht] = RP_DLG;
      k.save(); k.translate(0, y + ht / 2); k.scale(1, op); k.translate(0, -(y + ht / 2));
      rpBox(k, x, y, wd, ht);
      if (op >= 1) {
        rpBox(k, 24, 106, 52, 22); k.fillStyle = RP_Y; k.font = `800 12px ${SANS}`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('商人', 50, 118);
        // 逐字打出：只按时间取前 n 个字，不保留状态
        const [line, a, b] = u >= RP_LINES[1][1] ? RP_LINES[1] : RP_LINES[0];
        const cs = [...line], n = Math.floor(seg(u, a, b) * cs.length);
        k.fillStyle = RP_W; k.font = `700 18px ${SANS}`; k.textAlign = 'left'; k.fillText(cs.slice(0, n).join(''), 34, 156);
        if (u >= a && n < cs.length && Math.floor(u * 8) % 2 === 0) { const tw = k.measureText(cs.slice(0, n).join('')).width; k.fillRect(36 + tw, 146, 9, 18); }
        if (n >= cs.length && Math.floor(u * 3) % 2 === 0) { k.beginPath(); k.moveTo(500, 184); k.lineTo(512, 184); k.lineTo(506, 191); k.closePath(); k.fill(); }
      }
      k.restore();
    }
    // 选项菜单：光标在两项之间移动，确认时闪两下
    if (u >= RP_MENU[0] && u < RP_MENU[1]) {
      const pop = out3(seg(u, RP_MENU[0], RP_MENU[0] + 0.15));
      k.save(); k.translate(468, 65); k.scale(pop, pop); k.translate(-468, -65);
      rpBox(k, 420, 30, 96, 70);
      let cy = 0; RP_PICK.forEach(([t, i], j) => { if (u >= t) cy = j ? mix(RP_PICK[j - 1][1], i, inOut3(seg(u, t, t + 0.12))) : i; });
      const sel = Math.round(cy);
      ['买', '不买'].forEach((s, i) => { k.fillStyle = i === sel ? RP_Y : RP_W; k.font = `700 16px ${SANS}`; k.textAlign = 'left'; k.textBaseline = 'middle'; k.fillText(s, 450, 52 + i * 26); });
      if (!(u >= RP_OK && Math.floor(u * 8) % 2)) { const ty = 52 + cy * 26; k.fillStyle = RP_Y; k.beginPath(); k.moveTo(431, ty - 6); k.lineTo(441, ty); k.lineTo(431, ty + 6); k.closePath(); k.fill(); }
      k.restore();
    }
  };

  // @element 14
  // 14 卡牌对战：绿绒桌面，左下牌堆里两张卡依次翻面打出——「骑士」攻击「巨龙」被挡下（MISS），
  // 「巨龙」反击冲撞，伤害数字弹出、骑士震动、血条减少；复位时两张卡翻回背面飞回牌堆
  const CD_GOLD = '#E9C46A', CD_DARK = '#2A2016', CD_MISS = '#FF5A4E';
  const CD_CW = 74, CD_CH = 104;                                  // 卡牌宽高
  const CD_DECK = [44, 104];                                      // 牌堆中心
  // [名称, 边框色, 图案, 攻击, 生命, 落位中心, 打出时刻]
  const CD_CARDS = [['骑士', '#8A9BB8', 'sword', 3, 8, [200, 104], 0.3], ['巨龙', '#C8352B', 'fire', 5, 9, [380, 104], 0.8]];
  const CD_ATK1 = [1.6, 2.1], CD_ATK2 = [2.7, 3.2], CD_DMG = 5;  // 骑士攻击、巨龙反击时段；反击伤害
  const CD_DASH = 100;                                             // 冲撞前冲距离：两卡相距 180 px，冲到最远时刚好压上对方边缘
  const CD_BACK = [SHOW, SHOW + 0.8];                              // 复位：翻回背面并飞回牌堆
  function cdBack(k) {
    k.fillStyle = '#7A1E1E'; k.beginPath(); k.roundRect(-CD_CW / 2, -CD_CH / 2, CD_CW, CD_CH, 7); k.fill();
    k.save(); k.clip(); k.fillStyle = '#5A1414';
    for (let i = -CD_CH; i < CD_CW + CD_CH; i += 12) { k.beginPath(); k.moveTo(-CD_CW / 2 + i, -CD_CH / 2); k.lineTo(-CD_CW / 2 + i + 6, -CD_CH / 2); k.lineTo(-CD_CW / 2 + i + 6 - CD_CH, CD_CH / 2); k.lineTo(-CD_CW / 2 + i - CD_CH, CD_CH / 2); k.closePath(); k.fill(); }
    k.restore();
    k.strokeStyle = CD_GOLD; k.lineWidth = 3; k.beginPath(); k.roundRect(-CD_CW / 2 + 1.5, -CD_CH / 2 + 1.5, CD_CW - 3, CD_CH - 3, 6); k.stroke();
  }
  function cdFace(k, [name, col, art, atk, hp], hpNow) {
    const g = k.createLinearGradient(-CD_CW / 2, -CD_CH / 2, CD_CW / 2, CD_CH / 2); g.addColorStop(0, '#FDF7E8'); g.addColorStop(1, '#EADCB8');
    k.fillStyle = g; k.beginPath(); k.roundRect(-CD_CW / 2, -CD_CH / 2, CD_CW, CD_CH, 7); k.fill();
    k.strokeStyle = col; k.lineWidth = 4; k.beginPath(); k.roundRect(-CD_CW / 2 + 2, -CD_CH / 2 + 2, CD_CW - 4, CD_CH - 4, 6); k.stroke();
    k.fillStyle = CD_DARK; k.font = `800 12px ${SANS}`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(name, 0, -CD_CH / 2 + 14);
    k.fillStyle = CD_DARK; k.beginPath(); k.roundRect(-28, -28, 56, 42, 4); k.fill();
    if (art === 'sword') {
      k.fillStyle = '#D8DEE8'; k.fillRect(-2, -24, 4, 24); k.fillStyle = CD_GOLD; k.fillRect(-9, 0, 18, 3); k.fillRect(-1.5, 3, 3, 7);
    } else {
      k.fillStyle = '#FF8A3D'; k.beginPath(); k.moveTo(0, -24); k.quadraticCurveTo(16, -4, 8, 10); k.quadraticCurveTo(0, 2, -8, 10); k.quadraticCurveTo(-16, -4, 0, -24); k.fill();
      k.fillStyle = '#FFE08A'; k.beginPath(); k.moveTo(0, -10); k.quadraticCurveTo(7, 0, 3, 9); k.lineTo(-3, 9); k.quadraticCurveTo(-7, 0, 0, -10); k.fill();
    }
    k.font = `800 11px ${MONO}`; k.fillStyle = CD_DARK; k.textAlign = 'left'; k.fillText('⚔' + atk, -30, 26);
    // 血条：按当前生命 / 最大生命缩短
    k.fillStyle = 'rgba(42,32,22,0.25)'; k.fillRect(-30, 36, 60, 6);
    k.fillStyle = hpNow / hp > 0.5 ? '#4CAF6A' : '#E07A3A'; k.fillRect(-30, 36, 60 * hpNow / hp, 6);
    k.fillStyle = CD_DARK; k.textAlign = 'right'; k.fillText('♥' + hpNow, 30, 26);
  }
  CELLS[13] = (k, w, h, u) => {
    const bg = k.createRadialGradient(CW / 2, CH * 0.45, 0, CW / 2, CH * 0.45, CW * 0.6);
    bg.addColorStop(0, '#1E5A45'); bg.addColorStop(0.55, '#0F3B2E'); bg.addColorStop(1, '#082219');
    k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    k.save(); k.strokeStyle = 'rgba(255,255,255,0.12)'; k.setLineDash([6, 5]); k.lineWidth = 1.5; k.beginPath(); k.roundRect(110, 18, 380, 172, 14); k.stroke(); k.restore();
    // 牌堆：几张背面叠在一起，始终在场
    for (let i = 3; i >= 0; i--) { k.save(); k.translate(CD_DECK[0] - i * 1.5, CD_DECK[1] - i * 1.5); cdBack(k); k.restore(); }
    const back = inOut3(seg(u, CD_BACK[0], CD_BACK[1]));
    const hit1 = seg(u, CD_ATK1[0], CD_ATK1[1]), hit2 = seg(u, CD_ATK2[0], CD_ATK2[1]);
    const knightHp = u >= mix(CD_ATK2[0], CD_ATK2[1], 0.5) ? CD_CARDS[0][4] - CD_DMG : CD_CARDS[0][4];
    // 冲撞的一方画在上层，压住被攻击的卡
    const order = hit1 > 0 && hit1 < 1 ? [1, 0] : [0, 1];
    order.forEach(i => {
      const c = CD_CARDS[i];
      const [, , , , hp, [tx, ty], t0] = c;
      const play = out3(seg(u, t0, t0 + 0.5));
      if (play <= 0) return;
      // 打出：从牌堆沿弧线飞到落位，途中翻面（scaleX 过 0 时换面）；复位时倒过来
      const p = play * (1 - back);
      let x = mix(CD_DECK[0], tx, p), y = mix(CD_DECK[1], ty, p) - Math.sin(Math.PI * p) * 30;
      const flip = Math.cos(Math.PI * (1 - p));                  // -1 = 背面，1 = 正面
      // 冲撞：前半冲向对方，后半弹回
      const atk = i === 0 ? hit1 : hit2;
      if (atk > 0 && atk < 1) x += (i === 0 ? 1 : -1) * CD_DASH * Math.sin(Math.PI * atk);
      // 被击中的卡震动
      let rot = 0;
      if (i === 0 && hit2 > 0.5 && hit2 < 1) { const s = (1 - hit2) * 2; x += Math.sin(u * 90) * 5 * s; rot = Math.sin(u * 70) * 0.06 * s; }
      if (i === 1 && hit1 > 0.5 && hit1 < 1) x += Math.sin(u * 90) * 1.5 * (1 - hit1);
      k.save(); k.translate(x, y); k.rotate(rot);
      k.shadowColor = 'rgba(0,0,0,0.45)'; k.shadowBlur = 10; k.shadowOffsetY = 5;
      k.scale(Math.max(0.02, Math.abs(flip)), 1);
      if (flip > 0) cdFace(k, c, i === 0 ? knightHp : hp); else cdBack(k);
      k.restore();
    });
    // MISS：骑士攻击撞上巨龙时弹出
    const ma = seg(u, mix(CD_ATK1[0], CD_ATK1[1], 0.45), mix(CD_ATK1[0], CD_ATK1[1], 0.45) + 0.8);
    if (ma > 0 && ma < 1) {
      k.save(); k.globalAlpha = 1 - seg(ma, 0.7, 1); k.translate(390, 46 - 10 * out3(ma)); k.rotate(-0.17); k.scale(backOut(seg(ma, 0, 0.3)), backOut(seg(ma, 0, 0.3)));
      k.font = `900 26px ${DISP}`; k.textAlign = 'center'; k.textBaseline = 'middle';
      k.fillStyle = '#2A0A08'; k.fillText('MISS', 0, 3); k.fillStyle = CD_MISS; k.fillText('MISS', 0, 0); k.restore();
    }
    // 伤害数字：反击命中时从骑士头顶弹出
    const da = seg(u, mix(CD_ATK2[0], CD_ATK2[1], 0.5), mix(CD_ATK2[0], CD_ATK2[1], 0.5) + 0.9);
    if (da > 0 && da < 1) {
      k.save(); k.globalAlpha = 1 - seg(da, 0.7, 1); k.translate(206, 40 - 16 * out3(da)); k.scale(backOut(seg(da, 0, 0.3)), backOut(seg(da, 0, 0.3)));
      k.font = `900 28px ${DISP}`; k.textAlign = 'center'; k.textBaseline = 'middle';
      k.fillStyle = '#2A0A08'; k.fillText('−' + CD_DMG, 0, 3); k.fillStyle = CD_GOLD; k.fillText('−' + CD_DMG, 0, 0); k.restore();
    }
  };

  // @element 15
  // 15 瑞士网格动态字：米白底 12 栏网格线淡入，超大黑字「GRID」按栏位一个个砸进来、左边对齐栏线，「2026」随后落在下一行；
  // 红色色块在栏间推拉，日期、地点小字左对齐落位；复位时字和色块沿栏线向右滑出画面
  const SW_BG = '#F2F1EC', SW_INK = '#111111', SW_DIM = '#777777', SW_RED = '#E3001B';
  const SW_COLS = 12, SW_M = 20, SW_G = 8;                        // 栏数、页边距、栏间距
  const SW_CW = (CW - SW_M * 2 - SW_G * (SW_COLS - 1)) / SW_COLS; // 单栏宽
  const swX = c => SW_M + c * (SW_CW + SW_G);                     // 第 c 栏左边线
  const SW_WORD = [['G', 0], ['R', 2], ['I', 4], ['D', 5]];       // [字母, 起始栏]：字母左边贴栏线
  const SW_BIG = 100, SW_BASE = 108, SW_SLAM = 0.7, SW_SDT = 0.22;   // 大字字号、基线、第一个字砸进时刻、间隔
  const SW_YEAR = [1.8, 2.1], SW_YBASE = 182, SW_YSIZE = 62;     // 「2026」落下时段、基线、字号
  const SW_BLOCK = [[2.3, 8, 1], [3.1, 7, 3], [3.9, 9, 2]];      // 红块推拉关键帧：[时刻, 起始栏, 跨栏数]
  const SW_INFO = 3.0;                                             // 小字开始落位
  const SW_OUT = [SHOW, SHOW + 0.7];
  CELLS[14] = (k, w, h, u) => {
    k.fillStyle = SW_BG; k.fillRect(0, 0, CW, CH);
    // 网格线：从左到右依次淡入，复位时一起淡出
    const ga = 1 - seg(u, SW_OUT[0] + 0.3, SW_OUT[1]);
    k.fillStyle = 'rgba(17,17,17,0.12)';
    for (let c = 0; c <= SW_COLS; c++) {
      const a = seg(u, 0.1 + c * 0.03, 0.4 + c * 0.03) * ga; if (a <= 0) continue;
      k.globalAlpha = a; const x = c < SW_COLS ? swX(c) : CW - SW_M;
      k.fillRect(x, 0, 1, CH); if (c < SW_COLS) k.fillRect(x + SW_CW, 0, 1, CH);
    }
    k.globalAlpha = 1;
    // 退场：所有元素沿栏线方向（水平）向右滑出，越靠右的越先走
    const out = c => CW * inOut3(seg(u, SW_OUT[0] + (11 - c) * 0.02, SW_OUT[0] + 0.45 + (11 - c) * 0.02));
    // 红色色块：在栏之间推拉，宽度与位置都按栏对齐
    const bt = seg(u, SW_BLOCK[0][0], SW_BLOCK[0][0] + 0.25);
    if (bt > 0) {
      let c0 = SW_BLOCK[0][1], n = SW_BLOCK[0][2];
      for (let j = 1; j < SW_BLOCK.length; j++) { const p = inOut3(seg(u, SW_BLOCK[j][0], SW_BLOCK[j][0] + 0.35)); c0 = mix(c0, SW_BLOCK[j][1], p); n = mix(n, SW_BLOCK[j][2], p); }
      const x0 = SW_M + c0 * (SW_CW + SW_G), wd = n * (SW_CW + SW_G) - SW_G;
      k.fillStyle = SW_RED; k.fillRect(x0 + out(c0), CH * (1 - out3(bt)) + 0, wd, 118);
    }
    // 大字：每个字母从上方快速砸下，落地时下沉 3 px 再弹回
    k.fillStyle = SW_INK; k.textAlign = 'left'; k.textBaseline = 'alphabetic';
    k.font = `800 ${SW_BIG}px ${DISP}`;
    SW_WORD.forEach(([ch, c], i) => {
      const t0 = SW_SLAM + i * SW_SDT, d = seg(u, t0, t0 + 0.12); if (d <= 0) return;
      const land = seg(u, t0 + 0.12, t0 + 0.24), y = SW_BASE - 140 * (1 - d * d) + 3 * Math.sin(Math.PI * land);
      // 字形左侧有留白，按实际墨迹左缘对齐栏线
      const lb = k.measureText(ch).actualBoundingBoxLeft || 0;
      k.fillText(ch, swX(c) + lb + out(c), y);
    });
    const yd = seg(u, SW_YEAR[0], SW_YEAR[1]);
    if (yd > 0) {
      k.font = `800 ${SW_YSIZE}px ${DISP}`; const lb = k.measureText('2026').actualBoundingBoxLeft || 0;
      // 「2026」沿基线从左侧推入：竖直落下会穿过上一行大字
      k.fillText('2026', swX(0) + lb + out(0) - (CW / 2) * (1 - out3(yd)), SW_YBASE);
    }
    // 小字信息：左对齐第 8 栏线，逐行从右滑入落位
    const INFO = [['设计讲座', 700, 13, SW_INK], ['11.20 — 11.22', 500, 11, SW_INK], ['上海 · 西岸艺术中心', 500, 10, SW_DIM]];
    INFO.forEach(([s, wt, sz, col], i) => {
      const a = out3(seg(u, SW_INFO + i * 0.15, SW_INFO + 0.35 + i * 0.15)); if (a <= 0) return;
      k.globalAlpha = a; k.fillStyle = col; k.font = `${wt} ${sz}px ${SANS}`;
      k.fillText(s, swX(8) + 16 * (1 - a) + out(8), 148 + i * 17);
    });
    k.globalAlpha = 1;
  };

  // @element 16
  // 16 剪影片头：橘红底，黑色硬边色块从画外切进来拼成城市天际线，一道竖线从上到下劈开画面，
  // 片名「夜行」和演职员小字依次硬切入；复位时色块按反方向切出，回到纯橘红
  const TT_BG = '#E8562A', TT_INK = '#14110F', TT_CREAM = '#F6EFE3';
  // 城市剪影色块：[x, 顶边 y, 宽, 切入方向（-1 从左、1 从右、0 从下）, 切入时刻]
  const TT_BLDG = [
    [0, 120, 52, -1, 0.3], [48, 92, 40, 0, 0.42], [86, 132, 60, -1, 0.5], [142, 70, 30, 0, 0.6], [170, 112, 48, 1, 0.66],
    [324, 104, 44, -1, 0.72], [364, 60, 34, 0, 0.8], [396, 124, 56, 1, 0.86], [450, 84, 38, 0, 0.94], [486, 116, 53, 1, 1.0],
  ];
  const TT_CUT = 0.18;                                             // 每块切入耗时（硬切感：很短）
  const TT_LINE_X = 270, TT_LINE = [1.3, 1.6];                     // 竖线 x、劈开时段
  const TT_TITLE = 1.9, TT_CREDITS = [2.5, 2.8, 3.1];             // 片名、三行小字的切入时刻
  const TT_OUT = [SHOW, SHOW + 0.6];
  CELLS[15] = (k, w, h, u) => {
    k.fillStyle = TT_BG; k.fillRect(0, 0, CW, CH);
    // 复位：后进来的先出去，方向和切入相反
    const N = TT_BLDG.length;
    k.fillStyle = TT_INK;
    TT_BLDG.forEach(([x, y, wd, dir, t0], i) => {
      const inn = seg(u, t0, t0 + TT_CUT), os = TT_OUT[0] + (N - 1 - i) * 0.03, o = seg(u, os, os + TT_CUT);
      if (inn <= 0 || o >= 1) return;
      const e = inOut3(inn) * (1 - inOut3(o));
      const dx = dir ? dir * (CW * 0.6) * (1 - e) : 0, dy = dir ? 0 : (CH - y) * (1 - e);
      k.fillRect(x + dx, y + dy, wd, CH - y);
      // 窗格：在色块上挖出几道橘红缝，剪纸感
      if (wd > 40 && e > 0.99) { k.fillStyle = TT_BG; for (let r = y + 14; r < CH - 20; r += 16) k.fillRect(x + dx + 8, r + dy, wd - 16, 3); k.fillStyle = TT_INK; }
    });
    // 竖线：从上往下劈开
    const lp = inOut3(seg(u, TT_LINE[0], TT_LINE[1])) * (1 - seg(u, TT_OUT[0] + 0.25, TT_OUT[0] + 0.25 + TT_CUT));
    if (lp > 0) { k.fillStyle = TT_INK; k.fillRect(TT_LINE_X - 3, 0, 6, CH * lp); }
    // 片名与小字：硬切出现（无渐变），切出时整体向左平移出画
    const shift = CW * inOut3(seg(u, TT_OUT[0], TT_OUT[0] + 0.3));
    k.textBaseline = 'middle';
    if (u >= TT_TITLE) {
      // 片名两字分立在竖线两侧，奶白色压在剪影之上
      k.fillStyle = TT_CREAM; k.font = `900 52px ${SERIF}`;
      k.textAlign = 'right'; k.fillText('夜', TT_LINE_X - 14 - shift, 46);
      k.textAlign = 'left'; k.fillText('行', TT_LINE_X + 14 - shift, 46);
    }
    const CR = [['导演  林一川', TT_LINE_X - 14, 'right', 84], ['主演  周白  沈青', TT_LINE_X + 14, 'left', 84], ['NIGHT WALK · 2026', TT_LINE_X + 14, 'left', 100]];
    CR.forEach(([s, x, al, y], i) => {
      if (u < TT_CREDITS[i]) return;
      // 小字跨在橘红底和黑色楼顶上，统一用奶白，两种底上都看得清
      k.fillStyle = TT_CREAM; k.font = i === 2 ? `700 9px ${DISP}` : `600 10px ${SANS}`; k.textAlign = al;
      k.fillText(s, x - shift, y);
    });
  };

  // @element 17
  // 17 霓虹赛博：深紫雨夜，雨丝斜落；招牌「24H 拉面」的灯管一节节闪着通电，「面」字接触不良，
  // 间歇熄灭并出现红青错位；湿地面上有压扁的倒影。复位时断电，灯管倒序逐节熄灭
  const NE_CY = '#00F0FF', NE_MG = '#FF2BD6', NE_YL = '#FFE45C';
  const NE_GY = 140;                                               // 地面线：以下是湿地面和倒影
  const NE_BOX = [150, 18, 240, 92];                               // 招牌灯管框 x、y、宽、高
  const NE_RAIN = 70, NE_RAIN_P = CH + 30;                         // 雨丝条数、竖向循环周期
  // 招牌各节点亮时刻：框四边、24H、拉、面、营业中
  const NE_ON = { frame: [0.3, 0.45, 0.6, 0.75], h24: 1.1, la: 1.4, mian: 1.7, open: 2.1 };
  const NE_BAD = [2.5, SHOW];                                      // 「面」接触不良的时段
  const NE_OFF_DT = 0.1;                                           // 断电时每节熄灭间隔
  // 通电闪烁：前 0.35 秒按帧号哈希忽明忽暗，之后常亮
  const neFlick = (u, at, seed) => { if (u < at) return 0; const t = u - at; if (t > 0.35) return 1; return hash(Math.floor(t * 30) + seed * 17) > 0.45 ? 1 : 0.12; };
  CELLS[16] = (k, w, h, u) => {
    const g = k.createLinearGradient(0, 0, 0, CH);
    g.addColorStop(0, '#05040B'); g.addColorStop(0.6, '#1A0B2E'); g.addColorStop(1, '#2A0D3E');
    k.fillStyle = g; k.fillRect(0, 0, CW, CH);
    // 两侧楼体剪影
    k.fillStyle = '#0B0716'; k.fillRect(0, 0, 110, NE_GY); k.fillRect(430, 0, 109, NE_GY);
    k.fillStyle = 'rgba(0,240,255,0.18)';
    for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) if (hash(r * 7 + c) > 0.5) { k.fillRect(14 + c * 32, 12 + r * 20, 14, 8); k.fillRect(446 + c * 30, 12 + r * 20, 14, 8); }
    k.fillStyle = '#0E0818'; k.fillRect(0, NE_GY, CW, CH - NE_GY);
    // 每节的亮度：通电闪烁 × 断电（断电按点亮的倒序）
    const order = ['f0', 'f1', 'f2', 'f3', 'h24', 'la', 'mian', 'open'];
    const onAt = { f0: NE_ON.frame[0], f1: NE_ON.frame[1], f2: NE_ON.frame[2], f3: NE_ON.frame[3], h24: NE_ON.h24, la: NE_ON.la, mian: NE_ON.mian, open: NE_ON.open };
    const lv = {};
    order.forEach((key, i) => {
      const offAt = SHOW + (order.length - 1 - i) * NE_OFF_DT;
      lv[key] = neFlick(u, onAt[key], i + 1) * (1 - seg(u, offAt, offAt + 0.06));
    });
    // 接触不良：按 12 帧/秒的帧号哈希决定「面」这一帧亮不亮、要不要错位
    const fr = Math.floor(u * 12), bad = u >= NE_BAD[0] && u < NE_BAD[1];
    if (bad && hash(fr) < 0.3) lv.mian *= 0.15;
    const glitch = bad && hash(fr + 5) > 0.7 ? (hash(fr + 9) - 0.5) * 8 : 0;
    const [bx, by, bw, bh] = NE_BOX;
    const sides = [[[bx, by], [bx + bw, by]], [[bx + bw, by], [bx + bw, by + bh]], [[bx + bw, by + bh], [bx, by + bh]], [[bx, by + bh], [bx, by]]];
    const tube = (a, color, draw) => {
      if (a <= 0) return;
      k.globalAlpha = a; k.shadowColor = color; k.shadowBlur = 12; draw(color);
      k.shadowBlur = 0; draw('#FFF2FC', true); k.globalAlpha = 1;
    };
    const drawSign = () => {
      k.lineCap = 'round';
      sides.forEach((p, i) => tube(lv['f' + i], NE_MG, (c, core) => { k.strokeStyle = c; k.lineWidth = core ? 1.5 : 4; strokePts(k, p); }));
      k.textBaseline = 'middle';
      tube(lv.h24, NE_CY, c => { k.fillStyle = c; k.font = `800 26px ${DISP}`; k.textAlign = 'left'; k.fillText('24H', bx + 14, by + 30); });
      tube(lv.la, NE_MG, c => { k.fillStyle = c; k.font = `900 46px ${SANS}`; k.textAlign = 'center'; k.fillText('拉', bx + 116, by + 52); });
      if (glitch) {
        // 错位故障：红、青两层分别往两侧偏
        k.font = `900 46px ${SANS}`; k.textAlign = 'center'; k.globalAlpha = 0.7 * lv.mian;
        k.fillStyle = '#FF3355'; k.fillText('面', bx + 186 - glitch, by + 52);
        k.fillStyle = NE_CY; k.fillText('面', bx + 186 + glitch, by + 52); k.globalAlpha = 1;
      }
      tube(lv.mian, NE_MG, c => { k.fillStyle = c; k.font = `900 46px ${SANS}`; k.textAlign = 'center'; k.fillText('面', bx + 186, by + 52); });
      tube(lv.open, NE_YL, c => { k.fillStyle = c; k.font = `700 11px ${SANS}`; k.textAlign = 'left'; k.fillText('营业中', bx + 16, by + 70); });
    };
    drawSign();
    // 倒影：以地面线为轴竖向翻转并压扁到 0.6，透明度低，随雨水轻微横向抖
    k.save();
    k.beginPath(); k.rect(0, NE_GY, CW, CH - NE_GY); k.clip();
    k.translate(Math.sin(u * TAU * 2) * 1.5, NE_GY); k.scale(1, -0.6); k.translate(0, -NE_GY);
    k.globalAlpha = 0.3; drawSign();
    k.restore(); k.globalAlpha = 1;
    // 雨丝：每条在一个周期内整数次落完，保证 6.4 → 0 无缝
    k.strokeStyle = 'rgba(150,200,255,0.28)'; k.lineWidth = 1; k.beginPath();
    for (let i = 0; i < NE_RAIN; i++) {
      const loops = 6 + Math.floor(hash(i + 200) * 4), x0 = hash(i) * (CW + 60);
      const y = ((hash(i + 100) + (u / CYC) * loops) % 1) * NE_RAIN_P - 20, len = 8 + hash(i + 300) * 10;
      k.moveTo(x0 - y * 0.25, y); k.lineTo(x0 - (y + len) * 0.25, y + len);
    }
    k.stroke();
  };

  // @element 18
  // 18 复古桌面：1-bit 灰点阵桌面和黑白窗口。窗口「日记.txt」缩放框打开，文字逐字打出；光标移到「文件」，
  // 下拉菜单里点「保存」，弹出对话框、进度条走满、显示「已保存」，文件图标落到桌面。复位时窗口缩回、图标闪两下消失
  const DT_GRAY = '#B8B8B8', DT_DOT = '#7E7E7E';
  const DT_BAR = 14;                                               // 菜单栏高
  const DT_WIN = [60, 30, 230, 118], DT_DLG = [290, 64, 200, 74];  // 文档窗口、保存对话框 x、y、宽、高
  const DT_MENU = [20, DT_BAR, 66, 56], DT_ITEMS = ['新建', '打开…', '保存', '关闭'];
  const DT_TEXT = '今天把讲义写完了。\n明天整理图表。';
  const DT_T = { open: 0.1, type: [0.4, 1.2], menu: [1.65, 2.25], hover: 2.05, dlg: 2.3, prog: [2.55, 3.5], dlgClose: 3.9, icon: 4.2, close: SHOW, iconOff: 5.9 };
  const DT_ZOOM = 0.25;                                            // 缩放框动画时长
  const DT_ICON = [470, 150];
  // 光标路径关键帧 [时刻, x, y]；起点与终点相同，循环无缝
  const DT_CUR = [[0, 330, 160], [1.2, 330, 160], [1.6, 30, 7], [1.8, 30, 7], [2.05, 42, 50], [2.25, 42, 50], [2.5, 400, 120], [4.4, 400, 120], [5.0, 330, 160]];
  const dtCursor = u => {
    for (let i = 1; i < DT_CUR.length; i++) {
      const [t1, x1, y1] = DT_CUR[i], [t0, x0, y0] = DT_CUR[i - 1];
      if (u <= t1) { const e = inOut3(seg(u, t0, t1)); return [mix(x0, x1, e), mix(y0, y1, e)]; }
    }
    return DT_CUR[DT_CUR.length - 1].slice(1);
  };
  CELLS[17] = (k, w, h, u) => {
    k.fillStyle = DT_GRAY; k.fillRect(0, 0, CW, CH);
    // 点阵：隔行错位的 1px 虚线，模拟 50% 抖动灰
    k.strokeStyle = DT_DOT; k.lineWidth = 1; k.setLineDash([1, 1]);
    for (let y = DT_BAR + 1; y < CH; y += 2) { k.lineDashOffset = (y >> 1) % 2; k.beginPath(); k.moveTo(0, y + 0.5); k.lineTo(CW, y + 0.5); k.stroke(); }
    k.setLineDash([]); k.lineDashOffset = 0;
    // 菜单栏
    k.fillStyle = '#FFF'; k.fillRect(0, 0, CW, DT_BAR); k.fillStyle = '#000'; k.fillRect(0, DT_BAR, CW, 1.5);
    const menuOpen = u >= DT_T.menu[0] && u < DT_T.menu[1];
    k.textBaseline = 'middle'; k.textAlign = 'left'; k.font = `700 9px ${SANS}`;
    [['◆', 8], ['文件', 24], ['编辑', 52], ['显示', 80], ['特别', 108]].forEach(([s, x], i) => {
      if (i === 1 && menuOpen) { k.fillStyle = '#000'; k.fillRect(x - 3, 0, 24, DT_BAR); k.fillStyle = '#FFF'; } else k.fillStyle = '#000';
      k.fillText(s, x, DT_BAR / 2 + 0.5);
    });
    // 黑白窗口：白底、黑框、硬投影、条纹标题栏
    const win = ([x, y, ww, hh], title) => {
      k.fillStyle = '#000'; k.fillRect(x + 4, y + 4, ww, hh);
      k.fillStyle = '#FFF'; k.fillRect(x, y, ww, hh); k.strokeStyle = '#000'; k.lineWidth = 1.5; k.strokeRect(x, y, ww, hh);
      k.fillStyle = '#000'; for (let r = y + 3; r < y + 11; r += 2) k.fillRect(x + 2, r, ww - 4, 1);
      k.fillRect(x, y + 12, ww, 1.5);
      k.font = `700 8px ${SANS}`; const tw = k.measureText(title).width + 10;
      k.fillStyle = '#FFF'; k.fillRect(x + ww / 2 - tw / 2, y + 1, tw, 10); k.fillRect(x + 8, y + 2, 9, 8);
      k.strokeStyle = '#000'; k.lineWidth = 1; k.strokeRect(x + 8.5, y + 2.5, 8, 7);
      k.fillStyle = '#000'; k.textAlign = 'center'; k.fillText(title, x + ww / 2, y + 6.5);
    };
    // 缩放框：从标题栏中心长到整窗（p 0→1），或反向；中间态只画几层虚线框
    const zoom = ([x, y, ww, hh], p) => {
      if (p <= 0 || p >= 1) return;
      k.strokeStyle = '#000'; k.lineWidth = 1; k.setLineDash([2, 2]);
      for (let i = 0; i < 3; i++) {
        const s = clamp(p - i * 0.2); if (s <= 0) continue;
        const cx = x + ww / 2, cy = y + 6;
        k.strokeRect(cx - (ww / 2) * s, cy - 6 * s, ww * s, 6 * s + (hh - 6) * s);
      }
      k.setLineDash([]);
    };
    // 文档窗口：开、关两次缩放
    const wOpen = seg(u, DT_T.open, DT_T.open + DT_ZOOM), wClose = seg(u, DT_T.close, DT_T.close + DT_ZOOM);
    if (wOpen >= 1 && wClose <= 0) {
      win(DT_WIN, '日记.txt');
      const n = Math.floor(seg(u, DT_T.type[0], DT_T.type[1]) * DT_TEXT.length);
      k.fillStyle = '#000'; k.font = `500 11px ${SANS}`; k.textAlign = 'left';
      DT_TEXT.slice(0, n).split('\n').forEach((line, i) => k.fillText(line, DT_WIN[0] + 10, DT_WIN[1] + 30 + i * 17));
      // 文字插入点：打字时常亮，之后按 2 次/秒闪
      if (u < DT_T.menu[0] && (u < DT_T.type[1] || Math.floor(u * 2) % 2 === 0)) {
        const lines = DT_TEXT.slice(0, n).split('\n'), last = lines[lines.length - 1];
        k.font = `500 11px ${SANS}`;
        k.fillRect(DT_WIN[0] + 10 + k.measureText(last).width + 1, DT_WIN[1] + 23 + (lines.length - 1) * 17, 1, 13);
      }
    }
    zoom(DT_WIN, wClose > 0 ? 1 - wClose : wOpen);
    // 保存对话框
    const dOpen = seg(u, DT_T.dlg, DT_T.dlg + DT_ZOOM), dClose = seg(u, DT_T.dlgClose, DT_T.dlgClose + DT_ZOOM);
    if (dOpen >= 1 && dClose <= 0) {
      const [x, y, ww] = DT_DLG; win(DT_DLG, '保存');
      const pr = seg(u, DT_T.prog[0], DT_T.prog[1]);
      k.fillStyle = '#000'; k.font = `600 10px ${SANS}`; k.textAlign = 'left';
      k.fillText(pr < 1 ? '正在保存「日记.txt」…' : '已保存 ✓', x + 12, y + 28);
      k.lineWidth = 1.5; k.strokeRect(x + 12, y + 44, ww - 24, 12);
      // 进度条按 8 格跳格走，像老系统那样一格一格填
      k.fillRect(x + 14, y + 46, (ww - 28) * Math.floor(pr * 8) / 8, 8);
    }
    zoom(DT_DLG, dClose > 0 ? 1 - dClose : dOpen);
    // 下拉菜单：悬停到「保存」时反白
    if (menuOpen) {
      const [x, y, ww, hh] = DT_MENU;
      k.fillStyle = '#000'; k.fillRect(x + 3, y + 3, ww, hh); k.fillStyle = '#FFF'; k.fillRect(x, y, ww, hh);
      k.strokeStyle = '#000'; k.lineWidth = 1.5; k.strokeRect(x, y, ww, hh);
      k.font = `600 9px ${SANS}`; k.textAlign = 'left';
      DT_ITEMS.forEach((s, i) => {
        const hot = i === 2 && u >= DT_T.hover;
        if (hot) { k.fillStyle = '#000'; k.fillRect(x + 1, y + 2 + i * 13, ww - 2, 13); }
        k.fillStyle = hot ? '#FFF' : (i === 1 ? '#888' : '#000'); k.fillText(s, x + 8, y + 9 + i * 13);
      });
    }
    // 桌面图标：一步一步跳落（1-bit 没有平滑位移），落定后反白闪一下；复位末段闪两下消失
    const ip = seg(u, DT_T.icon, DT_T.icon + 0.4);
    const iconVis = ip > 0 && !(u >= DT_T.iconOff - 0.2 && (u >= DT_T.iconOff || Math.floor((u - DT_T.iconOff) * 20) % 2 === 0));
    if (iconVis) {
      const [ix, iy0] = DT_ICON, iy = iy0 - 40 * (1 - Math.floor(out3(ip) * 5) / 5);
      const inv = u >= DT_T.icon + 0.45 && u < DT_T.icon + 0.7 && Math.floor(u * 10) % 2 === 0;
      k.fillStyle = inv ? '#000' : '#FFF'; k.strokeStyle = '#000'; k.lineWidth = 1.5;
      k.beginPath(); k.moveTo(ix - 9, iy - 11); k.lineTo(ix + 4, iy - 11); k.lineTo(ix + 9, iy - 6); k.lineTo(ix + 9, iy + 11); k.lineTo(ix - 9, iy + 11); k.closePath(); k.fill(); k.stroke();
      k.fillStyle = inv ? '#FFF' : '#000'; for (let r = -4; r < 8; r += 3) k.fillRect(ix - 5, iy + r, 10, 1);
      k.fillStyle = '#FFF'; k.font = `600 8px ${SANS}`; k.textAlign = 'center';
      const lw = k.measureText('日记.txt').width + 6; k.fillRect(ix - lw / 2, iy + 14, lw, 10);
      k.fillStyle = '#000'; k.fillText('日记.txt', ix, iy + 19.5);
    }
    // 光标：等待进度时换成沙漏
    const [cx, cy] = dtCursor(u);
    k.fillStyle = '#000'; k.strokeStyle = '#FFF'; k.lineWidth = 1.2;
    if (u >= DT_T.prog[0] && u < DT_T.prog[1]) {
      k.beginPath(); k.moveTo(cx - 5, cy - 7); k.lineTo(cx + 5, cy - 7); k.lineTo(cx, cy); k.lineTo(cx + 5, cy + 7); k.lineTo(cx - 5, cy + 7); k.lineTo(cx, cy); k.closePath(); k.stroke(); k.fill();
    } else {
      const A = [[0, 0], [0, 14], [4, 10], [7, 16], [9, 15], [6, 9], [11, 9]];
      k.beginPath(); A.forEach(([x, y], i) => (i ? k.lineTo(cx + x, cy + y) : k.moveTo(cx + x, cy + y))); k.closePath(); k.stroke(); k.fill();
    }
  };

  // @element 19
  // 19 田园像素：俯视春天农场，4px 一格整数格绘制；右上角木框 HUD 显示时钟（按 10 分钟跳）和今日收入。
  // 农夫沿田埂给两行作物逐列浇水，作物分 3 个阶段长大，再逐列收获，每株 +5。复位时入夜变暗，天亮回到清晨、作物回到种子
  const FM_PX = 4;                                                 // 像素格边长
  const FM_COLS = 5, FM_COL_X0 = 14, FM_COL_DX = 11;               // 列数、首列 x、列距（单位：格）
  const FM_ROWS_Y = [14, 32], FM_PLOT = 7;                         // 两行地块的 y、地块边长（格）
  const FM_LANE_Y = 22;                                            // 农夫走的田埂 y（格）
  const FM_WATER = i => 0.6 + i * 0.32;                            // 第 i 列浇水时刻
  const FM_GROW = i => [FM_WATER(i) + 0.5, 2.6 + i * 0.12, 3.2 + i * 0.08]; // 三个生长阶段的出现时刻
  const FM_HARV = i => 3.7 + i * 0.28;                             // 第 i 列收获时刻
  const FM_GOLD = 5;                                               // 每株收入
  const FM_CLOCK0 = 6 * 60, FM_TICK = 0.45;                        // 清晨 6:00 起，每 0.45 秒跳 10 分钟
  const FM_NIGHT = [SHOW, SHOW + 0.5, CYC];                        // 入夜、翻到次日、天亮
  const FM_START_X = 4;
  CELLS[18] = (k, w, h, u) => {
    // 入夜后（翻到次日那一刻起）场景状态回到 0 秒，保证 6.4 秒与 0 秒一致
    const t = u >= FM_NIGHT[1] ? 0 : u;
    const P = (x, y, ww, hh, c) => { k.fillStyle = c; k.fillRect(Math.round(x) * FM_PX, Math.round(y) * FM_PX, ww * FM_PX, hh * FM_PX); };
    const GW = Math.ceil(CW / FM_PX), GH = Math.ceil(CH / FM_PX);
    // 草地、草簇、小花
    P(0, 0, GW, GH, '#6DB54A');
    for (let i = 0; i < 90; i++) { const x = Math.floor(hash(i) * GW), y = Math.floor(hash(i + 50) * GH); P(x, y, 2, 1, '#57A03C'); }
    for (let i = 0; i < 18; i++) P(Math.floor(hash(i + 400) * GW), 46 + Math.floor(hash(i + 420) * 5), 1, 1, hash(i + 440) > 0.5 ? '#F7E26B' : '#F59AB6');
    // 上方木栅栏
    for (let x = 0; x < GW; x += 4) P(x, 2, 1, 5, '#C08A52');
    P(0, 3, GW, 1, '#8A5A30'); P(0, 5, GW, 1, '#8A5A30');
    // 田地
    P(FM_COL_X0 - 3, FM_ROWS_Y[0] - 2, FM_COLS * FM_COL_DX + 2, FM_ROWS_Y[1] + FM_PLOT + 2 - FM_ROWS_Y[0] + 2, '#B88A55');
    let today = 0;
    for (let i = 0; i < FM_COLS; i++) {
      const x = FM_COL_X0 + i * FM_COL_DX, wet = t >= FM_WATER(i), harvested = t >= FM_HARV(i);
      if (harvested) today += FM_GOLD * FM_ROWS_Y.length;
      const [g1, g2, g3] = FM_GROW(i);
      FM_ROWS_Y.forEach(y => {
        P(x, y, FM_PLOT, FM_PLOT, wet ? '#6E4426' : '#9A6A3A');
        P(x, y + FM_PLOT - 1, FM_PLOT, 1, wet ? '#5A361E' : '#86592F');
        const cx = x + 3, cy = y + 3;
        if (harvested) return;
        if (t < g1) { P(cx, cy + 1, 1, 1, '#E8D08A'); return; }                // 种子
        if (t < g2) { P(cx, cy, 1, 2, '#5DBE3B'); P(cx - 1, cy, 1, 1, '#86CF5E'); P(cx + 1, cy - 1, 1, 1, '#86CF5E'); return; } // 嫩芽
        if (t < g3) { P(cx, cy - 1, 1, 3, '#3E8E3A'); P(cx - 2, cy - 1, 2, 1, '#5DBE3B'); P(cx + 1, cy - 2, 2, 1, '#5DBE3B'); P(cx - 1, cy + 1, 3, 1, '#86CF5E'); return; } // 长叶
        P(cx - 2, cy - 3, 5, 2, '#3E8E3A'); P(cx - 1, cy - 4, 3, 1, '#5DBE3B');  // 成熟：叶冠 + 南瓜
        P(cx - 2, cy - 1, 5, 3, '#F28C28'); P(cx - 1, cy - 1, 1, 2, '#F7B04A'); P(cx, cy - 1, 1, 3, '#C9661A');
      });
    }
    // 农夫位置：沿田埂到每列浇水 → 回到起点 → 逐列收获
    const keys = [[0, FM_START_X], [0.4, FM_START_X]];
    for (let i = 0; i < FM_COLS; i++) { const x = FM_COL_X0 + i * FM_COL_DX + 2; keys.push([FM_WATER(i) - 0.12, x], [FM_WATER(i) + 0.15, x]); }
    keys.push([2.2, FM_COL_X0 + (FM_COLS - 1) * FM_COL_DX + 2], [3.0, FM_START_X]);
    for (let i = 0; i < FM_COLS; i++) { const x = FM_COL_X0 + i * FM_COL_DX + 2; keys.push([FM_HARV(i) - 0.12, x], [FM_HARV(i) + 0.12, x]); }
    let px = keys[keys.length - 1][1], moving = false;
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) { const e = seg(t, keys[i - 1][0], keys[i][0]); px = mix(keys[i - 1][1], keys[i][1], e); moving = e > 0 && e < 1 && keys[i][1] !== keys[i - 1][1]; break; }
    }
    const step = moving ? Math.floor(u * 8) % 2 : 0, py = FM_LANE_Y - step;
    P(px, py + 9, 1, 2, '#3B2A1E'); P(px + 3, py + 9, 1, 2, '#3B2A1E');          // 腿
    P(px, py + 5, 4, 4, '#3D6FB8');                                              // 衣服
    P(px, py + 1, 4, 4, '#F2C9A0'); P(px + 1, py + 2, 1, 1, '#3B2A1E'); P(px + 3, py + 2, 1, 1, '#3B2A1E');
    P(px - 1, py, 6, 1, '#E8C35A'); P(px, py - 1, 4, 1, '#E8C35A');             // 草帽
    // 浇水：水壶在右手，浇水时上下两行各落三滴水
    const wi = [...Array(FM_COLS).keys()].find(i => Math.abs(t - FM_WATER(i)) < 0.2);
    if (t < 2.2) { P(px + 4, py + 5, 3, 2, '#5A8FD8'); P(px + 7, py + 4, 1, 1, '#5A8FD8'); }
    if (wi !== undefined) {
      const x = FM_COL_X0 + wi * FM_COL_DX, f = Math.floor(u * 12) % 3;
      FM_ROWS_Y.forEach(y => { for (let d = 0; d < 3; d++) P(x + 1 + d * 2, y + ((f + d) % 3) * 2, 1, 1, '#9FD3FF'); });
    }
    // 收获飘字 +5
    k.textAlign = 'center'; k.textBaseline = 'middle'; k.font = `800 11px ${MONO}`;
    for (let i = 0; i < FM_COLS; i++) {
      const p = seg(t, FM_HARV(i), FM_HARV(i) + 0.6); if (p <= 0 || p >= 1) continue;
      k.globalAlpha = 1 - p; k.fillStyle = '#FFF3A0';
      FM_ROWS_Y.forEach(y => k.fillText('+' + FM_GOLD, (FM_COL_X0 + i * FM_COL_DX + 3.5) * FM_PX, (y - 1) * FM_PX - p * 14));
      k.globalAlpha = 1;
    }
    // HUD 木框：时钟按 10 分钟跳、今日收入
    const hx = 400, hy = 8, hw = 128, hh = 50;
    k.fillStyle = '#5C3317'; k.fillRect(hx, hy, hw, hh); k.fillStyle = '#C98A43'; k.fillRect(hx + 3, hy + 3, hw - 6, hh - 6);
    k.fillStyle = '#F6E3B4'; k.fillRect(hx + 6, hy + 6, hw - 12, hh - 12);
    const mins = FM_CLOCK0 + Math.floor(clamp(t, 0, SHOW) / FM_TICK) * 10;
    k.fillStyle = '#4A2A12'; k.textAlign = 'left'; k.font = `800 13px ${MONO}`;
    k.fillText(`${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`, hx + 12, hy + 18);
    k.font = `700 10px ${SANS}`; k.fillText('上午', hx + 60, hy + 18);
    k.fillStyle = '#F2B21B'; k.beginPath(); k.arc(hx + 18, hy + 35, 5, 0, TAU); k.fill(); k.strokeStyle = '#7A4E10'; k.lineWidth = 1.5; k.stroke();
    k.fillStyle = '#4A2A12'; k.font = `800 11px ${MONO}`; k.fillText(`今日 +${today}`, hx + 28, hy + 35);
    // 入夜 → 天亮：深蓝罩层先压暗再退去，状态在最暗时翻回清晨
    const night = u < FM_NIGHT[1] ? inOut3(seg(u, FM_NIGHT[0], FM_NIGHT[1])) : 1 - inOut3(seg(u, FM_NIGHT[1], FM_NIGHT[2]));
    if (night > 0) { k.fillStyle = `rgba(16,20,56,${(0.85 * night).toFixed(3)})`; k.fillRect(0, 0, CW, CH); }
  };

  // @element 20
  // 20 剪报拼字：灰白新闻纸上，「全场五折 / 仅限今天」每个字像从不同报纸剪下来（字体、底色、大小、角度各不同），
  // 一个字一个字拍上去；订书钉钉上，红笔手画一圈。复位时字、钉、红圈整体淡出，只剩新闻纸
  const RN_PAPER = '#E6E2D6', RN_RED = '#E2463B';
  const RN_PAL = [['#FFFFFF', '#111111'], ['#111111', '#FFFFFF'], ['#F2D43D', '#111111'], ['#E2463B', '#FFFFFF'], ['#DCD7CB', '#111111'], ['#5A7FB5', '#FFFFFF'], ['#FFFFFF', '#E2463B']];
  const RN_FONTS = [s => `900 ${s}px ${SANS}`, s => `700 ${s}px ${SERIF}`, s => `700 ${s}px ${KAI}`, s => `700 ${s}px ${MONO}`, s => `900 ${s}px ${DISP}`];
  const RN_LINES = [{ text: '全场五折', y: 74, size: 60, t0: 0.3 }, { text: '仅限今天', y: 152, size: 40, t0: 1.4 }];
  const RN_DT = 0.22, RN_SLAP = 0.12;                              // 每字间隔、拍下时长
  const RN_STAPLE = [[2.5, 160, 34, -8], [2.6, 378, 36, 6]];       // 订书钉 [时刻, x, y, 角度°]
  const RN_CIRCLE = [3.0, 3.6];                                    // 红圈画出的时段
  CELLS[19] = (k, w, h, u) => {
    k.fillStyle = RN_PAPER; k.fillRect(0, 0, CW, CH);
    // 新闻纸：横向细线 + 栏线 + 复印颗粒
    k.fillStyle = 'rgba(60,55,45,0.10)'; for (let y = 0; y < CH; y += 7) k.fillRect(0, y, CW, 1.5);
    k.fillStyle = 'rgba(60,55,45,0.12)'; for (let i = 0; i < 6; i++) k.fillRect(20 + i * 100, 0, 1, CH);
    for (let i = 0; i < 260; i++) { k.fillStyle = `rgba(40,36,30,${(0.08 + hash(i + 900) * 0.18).toFixed(3)})`; k.fillRect(hash(i) * CW, hash(i + 500) * CH, 1 + hash(i + 700) * 1.2, 1); }
    const fade = 1 - seg(u, SHOW, CYC);
    if (fade <= 0) return;
    k.globalAlpha = fade;
    let seed = 0;
    RN_LINES.forEach(L => {
      // 每个字的底色、字体、大小、角度都由下标哈希决定，保证每帧一致
      const boxes = [...L.text].map(c => {
        seed++;
        const sz = L.size * (0.82 + hash(seed * 3.1) * 0.36);
        return { c, sz, bw: sz * 1.18, rot: (hash(seed * 5.7) - 0.5) * 16 * Math.PI / 180, dy: (hash(seed * 2.3) - 0.5) * 8,
          pal: RN_PAL[Math.floor(hash(seed * 7.3) * RN_PAL.length)], font: RN_FONTS[Math.floor(hash(seed * 9.1) * RN_FONTS.length)] };
      });
      const gap = L.size * 0.08, total = boxes.reduce((s, b) => s + b.bw, 0) + gap * (boxes.length - 1);
      let x = CW / 2 - total / 2;
      boxes.forEach((b, i) => {
        const at = L.t0 + i * RN_DT, cx = x + b.bw / 2; x += b.bw + gap;
        if (u < at) return;
        const s = mix(1.35, 1, out3(seg(u, at, at + RN_SLAP)));
        k.save(); k.translate(cx, L.y + b.dy); k.rotate(b.rot); k.scale(s, s);
        const bh = b.sz * 1.18;
        k.fillStyle = 'rgba(0,0,0,0.18)'; k.fillRect(-b.bw / 2 + 2, -bh / 2 + 2, b.bw, bh);
        k.fillStyle = b.pal[0]; k.fillRect(-b.bw / 2, -bh / 2, b.bw, bh);
        k.fillStyle = b.pal[1]; k.font = b.font(Math.round(b.sz)); k.textAlign = 'center'; k.textBaseline = 'middle';
        k.fillText(b.c, 0, b.sz * 0.04);
        k.restore();
      });
    });
    // 订书钉
    RN_STAPLE.forEach(([at, x, y, deg]) => {
      if (u < at) return;
      k.save(); k.translate(x, y - 6 * (1 - out3(seg(u, at, at + 0.1)))); k.rotate(deg * Math.PI / 180);
      k.fillStyle = '#666'; k.fillRect(-13, -1, 26, 4); k.fillStyle = '#9A9A9A'; k.fillRect(-13, -2, 26, 3);
      k.restore();
    });
    // 红笔圈：比一整圈多画一点，半径带起伏，像手画的
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = -2.4 + (i / 64) * TAU * 1.1, r = 1 + Math.sin(i * 0.7) * 0.03;
      pts.push([CW / 2 + Math.cos(a) * 150 * r, 74 + Math.sin(a) * 48 * r]);
    }
    k.strokeStyle = RN_RED; k.lineWidth = 3.5; k.lineCap = 'round'; k.lineJoin = 'round';
    strokeProg(k, pts, inOut3(seg(u, RN_CIRCLE[0], RN_CIRCLE[1])));
    k.globalAlpha = 1;
  };

  // @element 21
  // 21 国家公园海报：深棕墙上一张米色纸海报，限定 5 色平涂；天空、远山、近山、湖面、松树、题字条一版版从下往上套印（带轻微错版），
  // 太阳最后从远山后升起；右侧色标随印版点亮。复位时色版从最上一版起依次往下撤掉，回到空白纸
  const PO_CARD = [152, 6, 235, 196];                              // 海报纸 x、y、宽、高
  const PO_INK = ['#F2C14E', '#D9682B', '#2F6B6B', '#1F4F4F', '#2B2B2B'];  // 5 色：黄、橙、青、深青、墨
  const PO_INK_NAME = ['暖黄', '橘红', '湖青', '深青', '墨黑'];        // 色标文字：标的是颜色，不是版次（6 版共用这 5 色）
  const PO_PAPER = '#F3E6C4';
  // 印版：[开印时刻, 用色下标]；顺序即套印顺序
  const PO_PLATES = [[0.3, 0], [0.7, 1], [1.1, 2], [1.5, 3], [1.9, 4], [2.3, 4]];
  const PO_PRESS = 0.35, PO_LIFT = 24;                             // 压印时长、压上前的下移距离
  const PO_SUN = [2.8, 3.8];
  const PO_OFF_DT = 0.12;                                          // 复位时每版撤掉的间隔
  CELLS[20] = (k, w, h, u) => {
    k.fillStyle = '#3A2E28'; k.fillRect(0, 0, CW, CH);
    const [cx, cy, cw, chh] = PO_CARD;
    k.fillStyle = 'rgba(0,0,0,0.35)'; k.fillRect(cx + 5, cy + 6, cw, chh);
    k.fillStyle = PO_PAPER; k.fillRect(cx, cy, cw, chh);
    // 每版的进度：压上 0→1，撤掉 1→0（最后一版最先撤）
    const n = PO_PLATES.length;
    const lv = PO_PLATES.map(([at], i) => {
      const off = SHOW + (n - 1 - i) * PO_OFF_DT;
      return { on: out3(seg(u, at, at + PO_PRESS)), vis: u >= at && u < off + 0.2, off: inOut3(seg(u, off, off + 0.2)) };
    });
    const draws = [
      () => { k.fillStyle = PO_INK[0]; k.fillRect(0, 0, cw, 130);
        const sp = inOut3(seg(u, PO_SUN[0], PO_SUN[1]));
        k.fillStyle = PO_PAPER; k.beginPath(); k.arc(165, mix(118, 48, sp), 22, 0, TAU); k.fill(); },
      () => { k.fillStyle = PO_INK[1]; k.beginPath(); [[0, 110], [35, 72], [62, 95], [100, 52], [140, 92], [175, 64], [235, 100], [235, 196], [0, 196]].forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y))); k.fill(); },
      () => { k.fillStyle = PO_INK[2]; k.beginPath(); [[0, 128], [50, 98], [90, 120], [135, 94], [190, 122], [235, 108], [235, 196], [0, 196]].forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y))); k.fill(); },
      () => { k.fillStyle = PO_INK[3]; k.beginPath(); k.moveTo(0, 140); k.quadraticCurveTo(cw / 2, 126, cw, 140); k.lineTo(cw, 196); k.lineTo(0, 196); k.fill();
        // 湖面波纹留出纸色，不加第 6 种墨
        k.strokeStyle = PO_PAPER; k.lineWidth = 1.2; [[60, 143, 40], [130, 140, 52], [96, 147, 30]].forEach(([x, y, l]) => { k.beginPath(); k.moveTo(x, y); k.lineTo(x + l, y); k.stroke(); }); },
      () => { k.fillStyle = PO_INK[4];
        [14, 30, 46, 62, 196, 214].forEach((x, i) => { const th = 20 + hash(i + 60) * 14, by = 144;
          k.fillRect(x - 1.5, by - 4, 3, 6);
          for (let t = 0; t < 2; t++) { k.beginPath(); k.moveTo(x, by - th + t * th * 0.35); k.lineTo(x - 8, by - th * 0.35 + t * th * 0.35); k.lineTo(x + 8, by - th * 0.35 + t * th * 0.35); k.fill(); } }); },
      () => { k.fillStyle = PO_INK[4]; k.fillRect(0, 150, cw, 46);
        k.textAlign = 'center'; k.textBaseline = 'middle';
        k.fillStyle = PO_INK[0]; k.font = `900 19px ${SANS}`; k.fillText('云 岭 · 国 家 公 园', cw / 2, 168);
        k.fillStyle = PO_PAPER; k.font = `700 7px ${DISP}`; k.fillText('Y U N L I N G   N A T I O N A L   P A R K', cw / 2, 185); },
    ];
    k.save(); k.beginPath(); k.rect(cx, cy, cw, chh); k.clip();
    lv.forEach((l, i) => {
      if (!l.vis) return;
      // 错版：每一版固定偏一点点，像手工套印没对准
      const dx = (hash(i + 30) - 0.5) * 3, dy = (hash(i + 40) - 0.5) * 2;
      k.save(); k.translate(cx + dx, cy + dy + (1 - l.on) * PO_LIFT + l.off * PO_LIFT); k.globalAlpha = (l.on > 0 ? 1 : 0) * (1 - l.off);
      draws[i](); k.restore();
    });
    // 纸面颗粒
    for (let i = 0; i < 160; i++) { k.fillStyle = `rgba(60,40,20,${(0.05 + hash(i + 3000) * 0.1).toFixed(3)})`; k.fillRect(cx + hash(i + 3100) * cw, cy + hash(i + 3200) * chh, 1.2, 1.2); }
    k.restore(); k.globalAlpha = 1;
    // 右侧色标：某色已有印版在纸上就点亮
    k.textAlign = 'left'; k.textBaseline = 'middle'; k.font = `700 9px ${SANS}`; k.fillStyle = '#C9B79A'; k.fillText('5 色套印', 420, 26);
    PO_INK.forEach((c, j) => {
      const a = Math.max(0, ...PO_PLATES.map(([, ci], i) => (ci === j && lv[i].vis ? (l => (l.on > 0 ? 1 : 0) * (1 - l.off))(lv[i]) : 0)));
      k.strokeStyle = '#6A5A4C'; k.lineWidth = 1; k.strokeRect(420.5, 42.5 + j * 30, 18, 18);
      if (a > 0) { k.globalAlpha = a; k.fillStyle = c; k.fillRect(421, 43 + j * 30, 17, 17); k.globalAlpha = 1; }
      k.fillStyle = '#8A7A68'; k.fillText(PO_INK_NAME[j], 446, 52 + j * 30);
    });
  };

  // @element 22
  // 22 手账涂鸦：点阵纸上撕贴和纸胶带，马克笔写出标题「本周计划」，荧光笔划重点，三条待办逐条写出，
  // 圆珠笔逐个打勾，便利贴拍上去，最后补一颗涂鸦星星。复位时便利贴被揭走，笔迹和胶带淡去
  const JN_BG = '#FBF8F1', JN_DOT = '#D6CFC0', JN_INK = '#2B2B2B', JN_BLUE = '#2D5BD8';
  const JN_GRID = 12;                                              // 点阵间距
  // 胶带 [x, y, 长, 角度°, 主色, 浅色, 贴上时刻]
  const JN_TAPES = [[24, 10, 96, -6, '#F7B6C8', '#FCD9E3', 0.2], [436, 182, 90, 8, '#A8DCC9', '#D3EFE4', 0.35], [446, 8, 72, 14, '#F9E08B', '#FCEFC2', 0.5]];
  const JN_TITLE = { text: '本周计划', x: 40, y: 50, t: [0.6, 1.3] };
  const JN_HL = [0.9, 1.4];                                        // 荧光笔划过时段
  const JN_ITEMS = [['周一 背 30 个单词', 1.5], ['周三 跑步 5 公里', 1.8], ['周五 交读书报告', 2.1]];
  const JN_ITEM_Y0 = 96, JN_ITEM_DY = 32, JN_WRITE = 0.3;
  const JN_TICKS = [2.6, 3.0, 3.4], JN_TICK = 0.25;
  const JN_NOTE = { x: 392, y: 64, w: 108, h: 88, t: 3.9, text: ['别忘了', '喝水！'] };
  const JN_STAR = [4.4, 4.9];
  CELLS[21] = (k, w, h, u) => {
    k.fillStyle = JN_BG; k.fillRect(0, 0, CW, CH);
    k.fillStyle = JN_DOT; for (let y = JN_GRID / 2; y < CH; y += JN_GRID) for (let x = JN_GRID / 2; x < CW; x += JN_GRID) k.fillRect(x - 0.8, y - 0.8, 1.6, 1.6);
    const fade = 1 - seg(u, SHOW + 0.2, CYC);
    if (fade <= 0) return;
    k.globalAlpha = fade;
    // 和纸胶带：从左往右撕出来
    JN_TAPES.forEach(([x, y, len, deg, c1, c2, at]) => {
      const p = out3(seg(u, at, at + 0.3)); if (p <= 0) return;
      k.save(); k.translate(x, y); k.rotate(deg * Math.PI / 180);
      k.beginPath(); k.rect(0, 0, len * p, 16); k.clip();
      k.fillStyle = c2; k.fillRect(0, 0, len, 16);
      k.strokeStyle = c1; k.lineWidth = 4; for (let s = -16; s < len; s += 9) { k.beginPath(); k.moveTo(s, 16); k.lineTo(s + 16, 0); k.stroke(); }
      k.restore();
    });
    // 荧光笔：斜切的半透明黄条从左往右划过标题
    k.font = `700 28px ${KAI}`; const tw = k.measureText(JN_TITLE.text).width;
    const hp = inOut3(seg(u, JN_HL[0], JN_HL[1]));
    if (hp > 0) { k.save(); k.translate(JN_TITLE.x - 4, JN_TITLE.y - 2); k.transform(1, 0, -0.2, 1, 0, 0); k.fillStyle = 'rgba(255,226,70,0.6)'; k.fillRect(0, 0, (tw + 10) * hp, 14); k.restore(); }
    // 手写字：用从左往右展开的裁剪框模拟一笔笔写出
    const write = (text, x, y, font, color, p) => {
      if (p <= 0) return;
      k.font = font; const ww = k.measureText(text).width;
      k.save(); k.beginPath(); k.rect(x - 2, y - 30, (ww + 4) * p, 50); k.clip();
      k.fillStyle = color; k.textAlign = 'left'; k.textBaseline = 'alphabetic'; k.fillText(text, x, y); k.restore();
    };
    write(JN_TITLE.text, JN_TITLE.x, JN_TITLE.y + 6, `700 28px ${KAI}`, JN_INK, seg(u, JN_TITLE.t[0], JN_TITLE.t[1]));
    JN_ITEMS.forEach(([text, at], i) => {
      const y = JN_ITEM_Y0 + i * JN_ITEM_DY;
      if (u >= at) { k.strokeStyle = JN_INK; k.lineWidth = 1.5; k.strokeRect(44, y - 13, 13, 13); }
      write(text, 66, y, `700 17px ${KAI}`, JN_INK, seg(u, at, at + JN_WRITE));
      // 圆珠笔打勾
      k.strokeStyle = JN_BLUE; k.lineWidth = 2.5; k.lineCap = 'round'; k.lineJoin = 'round';
      strokeProg(k, [[45, y - 8], [50, y - 1], [62, y - 18]], seg(u, JN_TICKS[i], JN_TICKS[i] + JN_TICK));
    });
    // 便利贴：带弹性拍上去
    const np = seg(u, JN_NOTE.t, JN_NOTE.t + 0.25), lift = inOut3(seg(u, SHOW, SHOW + 0.4));
    if (np > 0 && lift < 1) {
      const { x, y, w: nw, h: nh } = JN_NOTE, s = mix(1.3, 1, backOut(np));
      k.save(); k.globalAlpha = fade * (1 - lift);
      k.translate(x + nw / 2, y + nh / 2 - lift * 40); k.rotate(0.07 + lift * 0.3); k.scale(s, s);
      k.fillStyle = 'rgba(0,0,0,0.15)'; k.fillRect(-nw / 2 + 3, -nh / 2 + 5, nw, nh);
      k.fillStyle = '#FFE873'; k.fillRect(-nw / 2, -nh / 2, nw, nh);
      k.fillStyle = 'rgba(247,182,200,0.8)'; k.fillRect(-20, -nh / 2 - 6, 40, 12);
      k.fillStyle = JN_INK; k.font = `700 19px ${KAI}`; k.textAlign = 'center'; k.textBaseline = 'middle';
      JN_NOTE.text.forEach((s2, i) => k.fillText(s2, 0, -12 + i * 26));
      k.restore(); k.globalAlpha = fade;
    }
    // 涂鸦星星
    const star = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 6 : 15; star.push([300 + Math.cos(a) * r, 46 + Math.sin(a) * r]); }
    k.strokeStyle = '#F2A900'; k.lineWidth = 2.5; strokeProg(k, star, seg(u, JN_STAR[0], JN_STAR[1]));
    k.globalAlpha = 1;
  };

  // @element 23
  // 23 手绘过程：白纸上，一支悬空的笔带着笔尖走，画一杯咖啡：铅笔灰线快速起稿 → 换针管笔逐条描出墨线 →
  // 换马克笔来回平涂杯身 → 换回针管笔在右下角签名。换笔时旧笔抬起缩小、新笔落下。复位时新的一页从右往左翻过来盖住，回到白纸，笔停在画外
  const SK_BG = '#FBF8F2', SK_INK = '#23201C', SK_PENCIL = '#B4AC9C', SK_RED = '#D7392B';
  const SK_REST = [560, 230];                                      // 笔的停靠点（画外右下）
  const skEllipse = (cx, cy, rx, ry, n = 40) => { const o = []; for (let i = 0; i <= n; i++) { const a = Math.PI + (i / n) * TAU; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; };
  const skWave = (x, y0, y1) => { const o = []; for (let i = 0; i <= 16; i++) { const t = i / 16; o.push([x + Math.sin(t * TAU) * 5, mix(y0, y1, t)]); } return o; };
  const skArc = (cx, cy, r, a0, a1, n = 20) => { const o = []; for (let i = 0; i <= n; i++) { const a = mix(a0, a1, i / n); o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return o; };
  // 杯子的线稿：碟子、杯身、杯口、把手、两缕热气
  const SK_PATHS = [skEllipse(230, 166, 84, 12), [[180, 74], [189, 152], [271, 152], [280, 74]], skEllipse(230, 74, 50, 8), skArc(286, 108, 19, -Math.PI / 2 - 0.2, Math.PI / 2 + 0.2), skWave(214, 58, 22), skWave(246, 58, 28)];
  const SK_BODY = [[181, 78], [189, 152], [271, 152], [279, 78]];   // 马克笔平涂的裁剪区
  const SK_FILL = (() => { const o = []; for (let x = 184, i = 0; x <= 278; x += 7, i++) o.push([x, i % 2 ? 150 : 80]); return o; })();
  const SK_SIGN = { text: '画一杯咖啡 · 阿青', x: 348, y: 186 };
  // 笔画时间表：铅笔起稿 0.25–1.57，墨线 1.7–3.34，马克笔 3.4–4.3，签名 4.5–5.0。
  // 笔画之间留出抬笔挪动的空隙，笔不会在两笔之间瞬移
  const SK_PEN = { t0: 0.25, dt: 0.23, dur: 0.17 }, SK_INKT = { t0: 1.7, dt: 0.28, dur: 0.24 };
  const SK_STROKES = (() => {
    const o = [], n = SK_PATHS.length;
    SK_PATHS.forEach((pts, i) => o.push({ kind: 'pencil', pts, i, t0: SK_PEN.t0 + i * SK_PEN.dt, t1: SK_PEN.t0 + i * SK_PEN.dt + SK_PEN.dur }));
    SK_PATHS.forEach((pts, i) => o.push({ kind: 'ink', pts, i, t0: SK_INKT.t0 + i * SK_INKT.dt, t1: SK_INKT.t0 + i * SK_INKT.dt + SK_INKT.dur }));
    o.push({ kind: 'fill', pts: SK_FILL, t0: 3.4, t1: 4.3 });
    o.push({ kind: 'sign', pts: [[SK_SIGN.x, SK_SIGN.y], [SK_SIGN.x + 150, SK_SIGN.y]], t0: 4.5, t1: 5.0 });
    return o;
  })();
  const SK_FLIP = [SHOW, SHOW + 0.8];
  CELLS[22] = (k, w, h, u) => {
    k.fillStyle = SK_BG; k.fillRect(0, 0, CW, CH);
    if (u >= SK_FLIP[1]) return;
    // 铅笔稿：灰色细线，带一点错位，像起稿时的虚线条
    k.lineCap = 'round'; k.lineJoin = 'round';
    SK_STROKES.forEach(s => {
      const p = seg(u, s.t0, s.t1); if (p <= 0) return;
      if (s.kind === 'pencil') {
        k.strokeStyle = SK_PENCIL; k.lineWidth = 1; k.save(); k.translate((hash(s.i) - 0.5) * 3, (hash(s.i + 9) - 0.5) * 3); strokeProg(k, s.pts, p); k.restore();
      } else if (s.kind === 'fill') {
        k.save(); k.beginPath(); SK_BODY.forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y))); k.closePath(); k.clip();
        k.strokeStyle = 'rgba(215,57,43,0.55)'; k.lineWidth = 11; strokeProg(k, s.pts, p); k.restore();
      } else if (s.kind === 'sign') {
        k.font = `700 13px ${KAI}`; const tw = k.measureText(SK_SIGN.text).width;
        k.save(); k.beginPath(); k.rect(SK_SIGN.x - 2, SK_SIGN.y - 16, (tw + 4) * p, 24); k.clip();
        k.fillStyle = SK_INK; k.textAlign = 'left'; k.textBaseline = 'alphabetic'; k.fillText(SK_SIGN.text, SK_SIGN.x, SK_SIGN.y); k.restore();
      }
    });
    // 墨线画在马克笔上面，保留轮廓
    SK_STROKES.forEach(s => { if (s.kind !== 'ink') return; k.strokeStyle = SK_INK; k.lineWidth = 2.4; strokeProg(k, s.pts, seg(u, s.t0, s.t1)); });
    // 笔的位置：画笔时在笔尖上；笔画之间直线挪过去并略微抬笔；开头从画外进来、最后回到画外。
    // 前后两笔换了工具时，在空隙前半段旧笔缩小抬起、后半段新笔放大落下
    // 签名时笔尖跟着文字的显露边走：按实际字宽算终点，不用固定的 150 px
    k.font = `700 13px ${KAI}`; const signW = k.measureText(SK_SIGN.text).width;
    const sEnd = s => (s.kind === 'sign' ? [s.pts[0][0] + signW, s.pts[0][1]] : s.pts[s.pts.length - 1]);
    const sAt = (s, p) => (s.kind === 'sign' ? [s.pts[0][0] + signW * p, s.pts[0][1]] : polyAt(s.pts, polyLen(s.pts) * p));
    let tip = SK_REST, lift = 0, tool = SK_TOOL[SK_STROKES[0].kind], sc = 1;
    const first = SK_STROKES[0], last = SK_STROKES[SK_STROKES.length - 1];
    if (u < first.t0) { const e = inOut3(seg(u, first.t0 - 0.3, first.t0)); tip = [mix(SK_REST[0], first.pts[0][0], e), mix(SK_REST[1], first.pts[0][1], e)]; }
    else if (u >= last.t1) { const e = inOut3(seg(u, last.t1, last.t1 + 0.4)); const a = sEnd(last); tip = [mix(a[0], SK_REST[0], e), mix(a[1], SK_REST[1], e)]; tool = SK_TOOL[last.kind]; lift = 6 * e; }
    else for (let i = 0; i < SK_STROKES.length; i++) {
      const s = SK_STROKES[i];
      if (u <= s.t1) { tip = sAt(s, seg(u, s.t0, s.t1)); tool = SK_TOOL[s.kind]; break; }
      const nx = SK_STROKES[i + 1];
      if (u < nx.t0) {
        const e = seg(u, s.t1, nx.t0), a = sEnd(s), b = nx.pts[0], swap = SK_TOOL[s.kind] !== SK_TOOL[nx.kind];
        tip = [mix(a[0], b[0], e), mix(a[1], b[1], e)]; lift = Math.sin(Math.PI * e) * (swap ? 14 : 8);
        tool = SK_TOOL[(e < 0.5 ? s : nx).kind]; if (swap) sc = out3(Math.abs(2 * e - 1));
        break;
      }
    }
    // 翻页：新的一页从右边翻过来，页边左侧压一道阴影
    const fp = inOut3(seg(u, SK_FLIP[0], SK_FLIP[1]));
    if (fp > 0) {
      const ex = CW * (1 - fp);
      const sg = k.createLinearGradient(ex - 18, 0, ex, 0); sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(0,0,0,0.18)');
      k.fillStyle = sg; k.fillRect(ex - 18, 0, 18, CH);
      k.fillStyle = SK_BG; k.fillRect(ex, 0, CW - ex, CH);
      k.fillStyle = '#EDE6DA'; k.fillRect(ex, 0, 6, CH);
    }
    skTool(k, tip[0], tip[1] - lift, lift, tool, sc);
  };
  // 画笔：只画悬在纸上的笔，按阶段换笔——起稿用铅笔、描线和签名用黑色针管笔、上色用红色马克笔。
  // 局部坐标里笔尖在原点、笔杆朝 −y，整体顺时针转 SK_TILT，笔杆指向右上
  const SK_TILT = 0.5;
  const SK_TOOL = { pencil: 'pencil', ink: 'pen', sign: 'pen', fill: 'marker' };  // 笔画种类 → 用哪支笔
  // 笔的剪影（投影用）：笔尖到笔尾的近似轮廓，[半宽, 长度]
  const SK_TOOL_SIL = { pencil: [3, 67], pen: [3.4, 64], marker: [5, 60] };
  function skTool(k, x, y, lift, tool, sc) {
    if (sc <= 0) return;
    // 投影：笔尖贴纸时投影贴着笔尖，抬笔时投影往右下离开、变淡
    const [hw, len] = SK_TOOL_SIL[tool];
    k.save(); k.translate(x + 2 + lift * 0.7, y + 2 + lift * 0.9); k.rotate(SK_TILT + 0.08); k.scale(sc, sc);
    k.fillStyle = `rgba(70,50,30,${(0.10 - lift * 0.004).toFixed(3)})`;
    k.beginPath(); k.moveTo(0, 0); k.lineTo(-hw, -10); k.lineTo(-hw, -len); k.lineTo(hw, -len); k.lineTo(hw, -10); k.closePath(); k.fill();
    k.restore();
    k.save(); k.translate(x, y); k.rotate(SK_TILT); k.scale(sc, sc);
    if (tool === 'pencil') {
      // 铅笔：石墨尖、削开的木头、六棱黄杆（亮面 + 暗面）、铁箍、橡皮
      k.fillStyle = '#ECC995'; k.beginPath(); k.moveTo(0, 0); k.lineTo(-3, -10); k.lineTo(3, -10); k.closePath(); k.fill();
      k.fillStyle = SK_INK; k.beginPath(); k.moveTo(0, 0); k.lineTo(-1.1, -3.6); k.lineTo(1.1, -3.6); k.closePath(); k.fill();
      k.fillStyle = '#F2B630'; k.fillRect(-3, -56, 6, 46);
      k.fillStyle = '#D9961C'; k.fillRect(1, -56, 2, 46);
      k.fillStyle = '#F9D772'; k.fillRect(-2.2, -56, 0.9, 46);
      k.fillStyle = '#B9B9B9'; k.fillRect(-3.2, -62, 6.4, 6); k.fillStyle = '#8E8E8E'; k.fillRect(-3.2, -60.5, 6.4, 0.8); k.fillRect(-3.2, -58.3, 6.4, 0.8);
      k.fillStyle = '#EE8E8E'; k.beginPath(); k.moveTo(-3, -62); k.lineTo(-3, -65); k.quadraticCurveTo(0, -67.5, 3, -65); k.lineTo(3, -62); k.fill();
    } else if (tool === 'pen') {
      // 针管笔：细钢针、银色锥头、黑色笔杆、白色标签环、笔尾夹
      k.strokeStyle = '#6E6E6E'; k.lineWidth = 0.9; k.beginPath(); k.moveTo(0, 0); k.lineTo(0, -4); k.stroke();
      k.fillStyle = '#C9C9C9'; k.beginPath(); k.moveTo(-0.9, -4); k.lineTo(-3.2, -13); k.lineTo(3.2, -13); k.lineTo(0.9, -4); k.closePath(); k.fill();
      k.fillStyle = '#9A9A9A'; k.beginPath(); k.moveTo(0.9, -4); k.lineTo(3.2, -13); k.lineTo(1.6, -13); k.closePath(); k.fill();
      k.fillStyle = '#2A2826'; k.fillRect(-3.4, -60, 6.8, 47);
      k.fillStyle = '#45423E'; k.fillRect(-2.4, -60, 1, 47);
      k.fillStyle = '#F1EEE8'; k.fillRect(-3.4, -36, 6.8, 6); k.fillStyle = SK_INK; k.font = `700 4px ${MONO}`; k.textAlign = 'center'; k.textBaseline = 'middle';
      k.save(); k.translate(0, -33); k.rotate(-Math.PI / 2); k.fillText('0.5', 0, 0.3); k.restore();
      k.fillStyle = '#1A1917'; k.beginPath(); k.moveTo(-3.4, -60); k.lineTo(-3.4, -63); k.quadraticCurveTo(0, -65, 3.4, -63); k.lineTo(3.4, -60); k.fill();
      k.fillStyle = '#8E8E8E'; k.fillRect(3.4, -58, 1.4, 16);
    } else {
      // 马克笔：红色斜切笔头、白色粗笔杆、红色笔帽端和色环
      k.fillStyle = SK_RED; k.beginPath(); k.moveTo(-2.4, 0); k.lineTo(2.4, -2.5); k.lineTo(2.6, -7); k.lineTo(-2.6, -7); k.closePath(); k.fill();
      k.fillStyle = '#D8D4CC'; k.beginPath(); k.moveTo(-2.6, -7); k.lineTo(-4.6, -13); k.lineTo(4.6, -13); k.lineTo(2.6, -7); k.closePath(); k.fill();
      k.fillStyle = '#F7F5F0'; k.fillRect(-5, -54, 10, 41);
      k.fillStyle = '#E2DED6'; k.fillRect(2, -54, 3, 41);
      k.strokeStyle = '#BDB7AC'; k.lineWidth = 0.8; k.strokeRect(-5, -54, 10, 41);
      k.fillStyle = SK_RED; k.fillRect(-5, -40, 10, 7);
      k.fillStyle = '#B42A1F'; k.beginPath(); k.moveTo(-5, -54); k.lineTo(-5, -58); k.quadraticCurveTo(0, -61, 5, -58); k.lineTo(5, -54); k.fill();
    }
    k.restore();
  }

  // @element 24
  // 24 水墨纸本：宣纸底纹；远山从淡到浓一层层晕染开，近处一笔浓墨画出山石，孤舟从左往右缓缓漂过；
  // 宋体竖排题字逐字出现，最后盖朱砂印。全幅只用墨色单色 + 一方朱印。复位时墨色洇淡、纸面复白
  const PA_INK = '28,24,20';                                       // 墨色 RGB，用透明度分出浓淡
  const PA_SEAL = '#B23A2E';
  // 山形两端都收到山脚线 PA_BASE，避免端头被竖着切断
  const PA_FAR = [[0, 120], [50, 86], [92, 104], [140, 62], [196, 98], [240, 80], [290, 112], [330, 128], [370, 150]];
  const PA_MID = [[150, 150], [180, 132], [228, 104], [262, 118], [300, 92], [350, 122], [400, 110], [440, 134], [480, 150]];
  const PA_BASE = 150;
  const PA_ROCK = [[24, 208], [30, 168], [52, 146], [74, 154], [92, 140], [116, 160], [128, 208]];
  const PA_T = { far: [0.2, 1.6], mid: [0.8, 2.0], rock: [2.0, 2.6], boat: [1.2, SHOW], title: 3.0, title_dt: 0.25, seal: 4.4 };
  const PA_LAYERS = 12;                                            // 晕染层数：层多、每层很淡，叠出的边缘看不出台阶
  const PA_FOOT = 0.15;                                            // 山脚处墨色相对山顶的浓度：往下渐淡，融进水面
  const PA_TITLE = ['孤', '舟', '一', '叶', '远', '山', '青'];
  CELLS[23] = (k, w, h, u) => {
    const g = k.createRadialGradient(CW / 2, CH / 2, 20, CW / 2, CH / 2, CW * 0.6);
    g.addColorStop(0, '#F4EDDC'); g.addColorStop(1, '#E2D6BC'); k.fillStyle = g; k.fillRect(0, 0, CW, CH);
    // 宣纸纤维：固定的短细线
    k.strokeStyle = 'rgba(120,100,70,0.10)'; k.lineWidth = 0.6;
    for (let i = 0; i < 120; i++) { const x = hash(i + 11) * CW, y = hash(i + 22) * CH, a = hash(i + 33) * TAU, l = 3 + hash(i + 44) * 7; k.beginPath(); k.moveTo(x, y); k.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); k.stroke(); }
    // 复位：墨色整体变淡
    const fade = 1 - inOut3(seg(u, SHOW, CYC - 0.1));
    if (fade <= 0) return;
    // 每层山形向下错开 spread，用纵向渐变从山顶浓到山脚淡，叠起来是软边的墨晕
    const wash = (pts, base, p, alpha, spread) => {
      if (p <= 0) return;
      const top = Math.min(...pts.map(([, y]) => y)), a = alpha * p * fade / PA_LAYERS * 2;
      const g = k.createLinearGradient(0, top, 0, base);
      g.addColorStop(0, `rgba(${PA_INK},${a.toFixed(4)})`); g.addColorStop(1, `rgba(${PA_INK},${(a * PA_FOOT).toFixed(4)})`);
      k.fillStyle = g;
      for (let l = 0; l < PA_LAYERS; l++) {
        const dy = l * spread * (1 + (1 - fade) * 2);
        k.beginPath(); pts.forEach(([x, y], i) => { const yy = Math.min(base, y + dy); i ? k.lineTo(x, yy) : k.moveTo(x, yy); });
        k.lineTo(pts[pts.length - 1][0], base); k.lineTo(pts[0][0], base); k.closePath(); k.fill();
      }
    };
    wash(PA_FAR, PA_BASE, inOut3(seg(u, PA_T.far[0], PA_T.far[1])), 0.32, 1.5);
    wash(PA_MID, PA_BASE, inOut3(seg(u, PA_T.mid[0], PA_T.mid[1])), 0.5, 1.2);
    // 水面：几道淡墨横线
    k.strokeStyle = `rgba(${PA_INK},${(0.18 * fade * seg(u, PA_T.mid[0], PA_T.mid[1])).toFixed(3)})`; k.lineWidth = 1;
    [[150, 158, 60], [260, 166, 80], [200, 176, 50], [330, 172, 40]].forEach(([x, y, l]) => { k.beginPath(); k.moveTo(x, y); k.lineTo(x + l, y); k.stroke(); });
    // 近处山石：浓墨一笔从左往右扫出，再补几道皴线
    const rp = out3(seg(u, PA_T.rock[0], PA_T.rock[1]));
    if (rp > 0) {
      k.save(); k.beginPath(); k.rect(0, 0, 24 + 110 * rp, CH); k.clip();
      k.fillStyle = `rgba(${PA_INK},${(0.88 * fade).toFixed(3)})`; k.beginPath(); PA_ROCK.forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y))); k.closePath(); k.fill();
      k.strokeStyle = `rgba(244,237,220,${(0.5 * fade).toFixed(3)})`; k.lineWidth = 1.2;
      [[[50, 160], [60, 190]], [[78, 162], [84, 196]], [[100, 158], [106, 184]]].forEach(p => strokePts(k, p));
      k.restore();
    }
    // 孤舟：船身 + 撑篙人，匀速漂过
    const bp = seg(u, PA_T.boat[0], PA_T.boat[1]);
    if (bp > 0) {
      const bx = mix(140, 300, bp), by = 160, ba = Math.min(1, bp * 8) * fade;
      k.fillStyle = `rgba(${PA_INK},${(0.85 * ba).toFixed(3)})`;
      k.beginPath(); k.moveTo(bx - 16, by); k.quadraticCurveTo(bx, by + 6, bx + 16, by - 1); k.lineTo(bx - 16, by); k.fill();
      k.fillRect(bx - 1, by - 12, 3, 11); k.beginPath(); k.arc(bx + 0.5, by - 14, 2.5, 0, TAU); k.fill();
      k.strokeStyle = `rgba(${PA_INK},${(0.7 * ba).toFixed(3)})`; k.lineWidth = 1; k.beginPath(); k.moveTo(bx + 6, by - 18); k.lineTo(bx - 8, by + 6); k.stroke();
    }
    // 竖排题字：从上往下逐字淡入
    k.textAlign = 'center'; k.textBaseline = 'middle'; k.font = `700 20px ${SERIF}`;
    PA_TITLE.forEach((c, i) => {
      const col = i < 4 ? 0 : 1, row = i < 4 ? i : i - 4;
      const a = seg(u, PA_T.title + i * PA_T.title_dt, PA_T.title + i * PA_T.title_dt + 0.3) * fade;
      if (a <= 0) return;
      k.fillStyle = `rgba(${PA_INK},${(0.9 * a).toFixed(3)})`; k.fillText(c, 488 - col * 26, 34 + row * 26);
    });
    // 朱砂印：略大处落下压实
    const sp = seg(u, PA_T.seal, PA_T.seal + 0.18);
    if (sp > 0) {
      const s = mix(1.4, 1, out3(sp));
      k.save(); k.translate(462, 140); k.rotate(-0.05); k.scale(s, s); k.globalAlpha = fade * Math.min(1, sp * 2);
      k.fillStyle = PA_SEAL; k.fillRect(-13, -13, 26, 26);
      k.fillStyle = '#F4EDDC'; k.font = `900 10px ${SERIF}`; k.fillText('山', -5, -5); k.fillText('水', 5, -5); k.fillText('小', -5, 6); k.fillText('品', 5, 6);
      k.restore(); k.globalAlpha = 1;
    }
  };

  // @element 25
  // 25 古风：上元灯会的黄昏，靛蓝到橘红的天色里挂着一轮暖月；朱墙金边的城楼门洞透出暖光，人群剪影在楼前。
  // 城楼前一串红灯笼一盏盏亮起并轻轻摆动，天灯缓缓升空，朱红印章「灯会」盖下，金色年份数字从下浮上。
  // 复位时灯笼依次熄灭，印章和年份淡出；城楼与天色全程保留，避免整格沉成一片黑
  const GF_GOLD = '#E9B949', GF_RED = '#D93A26', GF_WALL = '#9A3324', GF_ROOF = '#2C2B45', GF_CREAM = '#FFF1D6';
  const GF_LAMPS = 7, GF_LAMP_X0 = 150, GF_LAMP_DX = 40;            // 灯笼数、首盏 x、间距
  const GF_LAMP_ON = i => 0.5 + i * 0.25;
  const GF_LAMP_OFF = i => SHOW + i * 0.07;
  const GF_SWING = 4;                                              // 每个周期摆动的整数次数，保证循环无缝
  const GF_SKY_X = [64, 118, 420, 466, 508];                       // 天灯起飞的 x，避开城楼
  const GF_SKY_ON = i => 1.0 + i * 0.35, GF_SKY_DUR = 3.2;          // 第 i 盏天灯起飞时刻、升空时长
  const GF_SEAL = 2.5, GF_YEAR = [3.2, 3.9], GF_YEAR_TEXT = '1120 年';
  const GF_FADE = [SHOW, SHOW + 0.5];                              // 印章、年份淡出
  CELLS[24] = (k, w, h, u) => {
    // 黄昏天色：上靛蓝、中紫、近地平线橘红
    const g = k.createLinearGradient(0, 0, 0, CH);
    g.addColorStop(0, '#24306A'); g.addColorStop(0.55, '#5A3F78'); g.addColorStop(1, '#D9774E');
    k.fillStyle = g; k.fillRect(0, 0, CW, CH);
    for (let i = 0; i < 22; i++) { k.fillStyle = `rgba(255,240,210,${(0.3 + hash(i + 500) * 0.4).toFixed(2)})`; k.fillRect(hash(i + 510) * CW, hash(i + 520) * 70, 1.5, 1.5); }
    // 暖月与月晕
    const mh = k.createRadialGradient(478, 38, 4, 478, 38, 44); mh.addColorStop(0, 'rgba(255,236,190,0.45)'); mh.addColorStop(1, 'rgba(255,236,190,0)');
    k.fillStyle = mh; k.fillRect(430, 0, 100, 90);
    k.fillStyle = '#FBE9BE'; k.beginPath(); k.arc(478, 38, 15, 0, TAU); k.fill();
    // 亮灯比例：用于整格暖光
    let lit = 0;
    const lampOn = i => seg(u, GF_LAMP_ON(i), GF_LAMP_ON(i) + 0.15) * (1 - seg(u, GF_LAMP_OFF(i), GF_LAMP_OFF(i) + 0.1));
    for (let i = 0; i < GF_LAMPS; i++) lit += lampOn(i) / GF_LAMPS;
    // 远处街巷屋顶，紫灰剪影
    k.fillStyle = '#3E2F5E';
    k.beginPath(); k.moveTo(0, CH);
    for (let x = 0; x <= CW; x += 28) { const y = 150 + hash(x + 7) * 14; k.lineTo(x, y + 6); k.lineTo(x + 6, y); k.lineTo(x + 22, y); k.lineTo(x + 28, y + 6); }
    k.lineTo(CW, CH); k.closePath(); k.fill();
    // 城楼台基：朱墙、砖缝、门洞里的暖光
    k.fillStyle = GF_WALL;
    k.beginPath(); k.moveTo(170, 208); k.lineTo(180, 124); k.lineTo(360, 124); k.lineTo(370, 208); k.closePath(); k.fill();
    k.strokeStyle = 'rgba(0,0,0,0.12)'; k.lineWidth = 1;
    for (let y = 134; y < 208; y += 10) { k.beginPath(); k.moveTo(172, y + 0.5); k.lineTo(368, y + 0.5); k.stroke(); }
    const ag = k.createLinearGradient(0, 140, 0, 208); ag.addColorStop(0, '#FFD98A'); ag.addColorStop(1, '#F0954A');
    k.fillStyle = ag; k.beginPath(); k.moveTo(246, 208); k.lineTo(246, 154); k.quadraticCurveTo(270, 128, 294, 154); k.lineTo(294, 208); k.closePath(); k.fill();
    k.fillStyle = '#6E2016'; k.fillRect(176, 118, 188, 7);
    // 两层殿身：红柱、金色窗格透光
    const hall = (x0, x1, y0, y1) => {
      k.fillStyle = '#B8412C'; k.fillRect(x0, y0, x1 - x0, y1 - y0);
      const n = Math.round((x1 - x0) / 16);
      for (let i = 0; i < n; i++) {
        const x = x0 + 4 + i * ((x1 - x0 - 8) / n);
        k.fillStyle = `rgba(255,${Math.round(mix(170, 205, lit))},110,${(0.55 + 0.35 * lit).toFixed(3)})`; k.fillRect(x + 2, y0 + 5, (x1 - x0 - 8) / n - 5, y1 - y0 - 9);
        k.fillStyle = '#7E2519'; k.fillRect(x, y0, 2, y1 - y0);
      }
    };
    // 翘檐屋顶：深青瓦面 + 金色檐线
    const roof = (cx, y, hw, hh) => {
      k.beginPath(); k.moveTo(cx - hw - 14, y - 6); k.quadraticCurveTo(cx - hw, y, cx - hw + 10, y - hh * 0.4); k.lineTo(cx - hw * 0.6, y - hh);
      k.lineTo(cx + hw * 0.6, y - hh); k.lineTo(cx + hw - 10, y - hh * 0.4); k.quadraticCurveTo(cx + hw, y, cx + hw + 14, y - 6); k.closePath();
      k.fillStyle = GF_ROOF; k.fill(); k.strokeStyle = GF_GOLD; k.lineWidth = 1.3; k.stroke();
    };
    hall(206, 334, 94, 120); roof(270, 96, 84, 22);
    hall(226, 314, 54, 78); roof(270, 56, 62, 20);
    k.fillStyle = GF_GOLD; k.fillRect(266, 28, 8, 8);
    // 楼前暖光随灯笼点亮而变强
    if (lit > 0) {
      const wg = k.createRadialGradient(270, 120, 10, 270, 120, 260); wg.addColorStop(0, `rgba(255,170,90,${(0.28 * lit).toFixed(3)})`); wg.addColorStop(1, 'rgba(255,170,90,0)');
      k.fillStyle = wg; k.fillRect(0, 0, CW, CH);
    }
    // 天灯：起飞后边升边轻摆、渐小，升到顶部前淡出
    for (let i = 0; i < GF_SKY_X.length; i++) {
      const p = seg(u, GF_SKY_ON(i), GF_SKY_ON(i) + GF_SKY_DUR); if (p <= 0 || p >= 1) continue;
      const x = GF_SKY_X[i] + Math.sin(p * TAU * 1.5 + i) * 6, y = mix(170, 14, p), s = mix(1, 0.6, p);
      const a = Math.min(1, p * 6) * (1 - seg(p, 0.75, 1));
      k.save(); k.translate(x, y); k.scale(s, s); k.globalAlpha = a;
      const sg = k.createRadialGradient(0, 0, 1, 0, 0, 22); sg.addColorStop(0, 'rgba(255,200,110,0.55)'); sg.addColorStop(1, 'rgba(255,200,110,0)');
      k.fillStyle = sg; k.fillRect(-22, -22, 44, 44);
      k.fillStyle = '#FFC266'; k.beginPath(); k.moveTo(-6, -9); k.lineTo(6, -9); k.lineTo(4.5, 8); k.lineTo(-4.5, 8); k.closePath(); k.fill();
      k.fillStyle = '#FFF1C8'; k.fillRect(-2, 3, 4, 4);
      k.restore();
    }
    // 人群：前景一排头肩剪影，深紫褐，几个人手里提着小灯
    k.fillStyle = '#2E1A2E';
    for (let i = 0; i < 30; i++) {
      const x = i * 19 + hash(i + 70) * 8, r = 6 + hash(i + 80) * 3, y = 196 - hash(i + 90) * 8;
      k.beginPath(); k.arc(x, y - r * 1.6, r * 0.7, 0, TAU); k.fill();
      k.beginPath(); k.ellipse(x, y + 8, r * 1.4, r * 1.6, 0, Math.PI, TAU); k.fill(); k.fillRect(x - r * 1.4, y + 8, r * 2.8, 20);
    }
    for (let i = 0; i < 30; i += 6) {
      const x = i * 19 + hash(i + 70) * 8 + 10, y = 186 - hash(i + 90) * 8, on = lampOn(i % GF_LAMPS);
      k.fillStyle = `rgba(255,${Math.round(mix(120, 190, on))},90,${(0.5 + 0.5 * on).toFixed(3)})`; k.beginPath(); k.ellipse(x, y, 3.5, 4.5, 0, 0, TAU); k.fill();
      k.fillStyle = '#2E1A2E';
    }
    // 灯笼绳
    k.strokeStyle = '#4A2A1C'; k.lineWidth = 1; k.beginPath(); k.moveTo(110, 96); k.quadraticCurveTo(CW / 2, 122, 430, 96); k.stroke();
    // 灯笼：未亮是暗朱红，亮起变亮红并带光晕；摆角用周期内整数次的正弦
    for (let i = 0; i < GF_LAMPS; i++) {
      const x = GF_LAMP_X0 + i * GF_LAMP_DX, t = (x - 110) / 320, y = 96 + 2 * (1 - t) * t * 26, on = lampOn(i);
      const ang = Math.sin(TAU * (u / CYC) * GF_SWING + i * 1.3) * 0.12;
      k.save(); k.translate(x, y); k.rotate(ang);
      if (on > 0) {
        const gl = k.createRadialGradient(0, 18, 2, 0, 18, 38); gl.addColorStop(0, `rgba(255,180,90,${(0.6 * on).toFixed(3)})`); gl.addColorStop(1, 'rgba(255,180,90,0)');
        k.fillStyle = gl; k.fillRect(-38, -20, 76, 76);
      }
      k.strokeStyle = '#4A2A1C'; k.beginPath(); k.moveTo(0, 0); k.lineTo(0, 8); k.stroke();
      k.fillStyle = `rgb(${Math.round(mix(122, 236, on))},${Math.round(mix(40, 72, on))},${Math.round(mix(32, 40, on))})`;
      k.beginPath(); k.ellipse(0, 18, 9, 11, 0, 0, TAU); k.fill();
      // 灯骨竖线 + 金色上下盖 + 金穗
      k.strokeStyle = `rgba(120,30,20,${(0.5).toFixed(2)})`; k.beginPath(); k.ellipse(0, 18, 4, 11, 0, 0, TAU); k.stroke();
      k.fillStyle = GF_GOLD; k.fillRect(-5, 7, 10, 3); k.fillRect(-5, 27, 10, 3);
      k.strokeStyle = GF_GOLD; k.lineWidth = 1.5; k.beginPath(); k.moveTo(0, 30); k.lineTo(0, 39); k.stroke(); k.lineWidth = 1;
      k.restore();
    }
    const fade = 1 - seg(u, GF_FADE[0], GF_FADE[1]);
    // 朱红印章：实底红印、米白字，大一号处压下
    const sp = seg(u, GF_SEAL, GF_SEAL + 0.18);
    if (sp > 0 && fade > 0) {
      const s = mix(1.6, 1, out3(sp));
      k.save(); k.translate(70, 50); k.rotate(-0.14); k.scale(s, s); k.globalAlpha = fade * Math.min(1, sp * 2);
      k.fillStyle = GF_RED; k.fillRect(-30, -17, 60, 34);
      k.strokeStyle = GF_CREAM; k.lineWidth = 1.5; k.strokeRect(-26, -13, 52, 26);
      k.fillStyle = GF_CREAM; k.font = `900 20px ${SERIF}`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('灯会', 0, 1);
      k.restore();
    }
    // 金色年份：从下往上浮起淡入
    const yp = out3(seg(u, GF_YEAR[0], GF_YEAR[1]));
    if (yp > 0 && fade > 0) {
      k.save(); k.globalAlpha = fade * yp; k.fillStyle = GF_GOLD; k.font = `900 34px ${SERIF}`; k.textAlign = 'right'; k.textBaseline = 'middle';
      k.shadowColor = 'rgba(60,20,40,0.7)'; k.shadowBlur = 8; k.fillText(GF_YEAR_TEXT, 520, 96 + (1 - yp) * 30);
      k.restore();
    }
  };

  // @element 26
  // 26 电视新闻包装：蓝色演播室底，虚构台标「晨光新闻」和「直播」角标亮起；右侧画中画弹出现场示意（地铁进站），
  // 两层下方标题条依次滑入，底部滚动字幕一直走；「突发」红色横幅从左扫到右。复位时标题条、画中画倒序收回，演播室灯光淡出
  const TV_BLUE = '#0B3A7A', TV_DEEP = '#06224A', TV_SKY = '#9FC2F0', TV_RED = '#E8202A';
  const TV_PIP = [318, 30, 206, 92];                               // 画中画 x、y、宽、高
  const TV_L3_Y = 134;                                             // 下方标题条首行 y
  const TV_TICK = { y: 190, p: 560, loops: 2 };                    // 滚动字幕：y、一轮长度、每周期整数轮（保证无缝）
  const TV_TICK_ITEMS = [[0, '早高峰客流平稳'], [140, '今日气温 18–25℃'], [290, '城东新桥今晚封闭施工'], [450, '明日有小雨']];
  const TV_T = { light: 0.3, logo: 0.2, live: 0.4, pip: 0.6, train: [1.0, 2.4], tick: 0.8, l1: 1.2, l2: 1.6, bk: [2.6, 2.9, 3.5, 3.8] };
  // 复位倒序：第二层标题条 → 第一层 → 画中画 → 字幕条和台标，每样 0.35 秒
  const TV_OUT = { l2: SHOW, l1: SHOW + 0.12, pip: SHOW + 0.25, chrome: SHOW + 0.4 };
  const tvIn = (u, a, d = 0.35) => out3(seg(u, a, a + d));
  const tvOut = (u, a) => 1 - inOut3(seg(u, a, a + 0.35));
  CELLS[25] = (k, w, h, u) => {
    const g = k.createRadialGradient(170, 90, 10, 170, 90, 380);
    g.addColorStop(0, '#1C5AA8'); g.addColorStop(0.55, TV_BLUE); g.addColorStop(1, TV_DEEP);
    k.fillStyle = g; k.fillRect(0, 0, CW, CH);
    // 演播室灯光：斜向光束、地面透视网格、线框地球，开场亮起、复位时淡出
    const lit = seg(u, 0, TV_T.light) * tvOut(u, TV_OUT.chrome);
    if (lit > 0) {
      k.globalAlpha = lit;
      k.fillStyle = 'rgba(159,194,240,0.07)';
      [[60, 140], [210, 300], [380, 470]].forEach(([a, b]) => { k.beginPath(); k.moveTo(a, 0); k.lineTo(a + 40, 0); k.lineTo(b + 60, CH); k.lineTo(b - 30, CH); k.closePath(); k.fill(); });
      k.strokeStyle = 'rgba(159,194,240,0.16)'; k.lineWidth = 1;
      for (let i = 0; i < 5; i++) { const y = 150 + i * i * 3; k.beginPath(); k.moveTo(0, y); k.lineTo(CW, y); k.stroke(); }
      // 地球经线随时间转一整圈/周期，6.4 秒回到原样
      const R = 44, gx = 150, gy = 76, ph = (u / CYC) * TAU;
      k.strokeStyle = 'rgba(159,194,240,0.3)';
      k.beginPath(); k.arc(gx, gy, R, 0, TAU); k.stroke();
      [-0.5, 0, 0.5].forEach(t => { k.beginPath(); k.ellipse(gx, gy + t * R, R * Math.sqrt(1 - t * t), 5, 0, 0, TAU); k.stroke(); });
      for (let i = 0; i < 4; i++) { const rx = Math.abs(Math.cos(ph + (i * Math.PI) / 4)) * R; k.beginPath(); k.ellipse(gx, gy, rx, R, 0, 0, TAU); k.stroke(); }
      k.globalAlpha = 1;
    }
    // 画中画：弹出放大，里面是地铁进站的示意画面
    const ps = backOut(seg(u, TV_T.pip, TV_T.pip + 0.35)) * tvOut(u, TV_OUT.pip);
    if (ps > 0.01) {
      const [x, y, pw, ph2] = TV_PIP;
      k.save(); k.translate(x + pw / 2, y + ph2 / 2); k.scale(ps, ps); k.translate(-(x + pw / 2), -(y + ph2 / 2));
      k.fillStyle = '#FFF'; k.fillRect(x - 2, y - 2, pw + 4, ph2 + 4);
      k.save(); k.beginPath(); k.rect(x, y, pw, ph2); k.clip();
      const sg = k.createLinearGradient(0, y, 0, y + ph2); sg.addColorStop(0, '#6E8CB0'); sg.addColorStop(1, '#C9D6E4');
      k.fillStyle = sg; k.fillRect(x, y, pw, ph2);
      k.fillStyle = '#3A4658'; for (let i = 0; i < 6; i++) k.fillRect(x + 8 + i * 36, y + 8, 3, 46);   // 站台立柱
      k.fillStyle = '#8B95A3'; k.fillRect(x, y + 66, pw, ph2 - 66);                                     // 站台地面
      k.fillStyle = '#F2C230'; k.fillRect(x, y + 64, pw, 3);                                            // 黄色安全线
      const tx = mix(x + pw + 10, x + 24, out3(seg(u, TV_T.train[0], TV_T.train[1])));
      k.fillStyle = '#E9EDF2'; k.beginPath(); k.moveTo(tx + 10, y + 26); k.lineTo(tx + 200, y + 26); k.lineTo(tx + 200, y + 62); k.lineTo(tx, y + 62); k.lineTo(tx, y + 38); k.closePath(); k.fill();
      k.fillStyle = TV_BLUE; k.fillRect(tx, y + 52, 200, 4);
      k.fillStyle = '#2B3A4E'; k.fillRect(tx + 6, y + 31, 14, 12); for (let i = 0; i < 5; i++) k.fillRect(tx + 30 + i * 34, y + 32, 24, 13);
      k.restore();
      k.fillStyle = TV_RED; k.fillRect(x, y, 34, 14); k.fillStyle = '#FFF'; k.font = `700 9px ${SANS}`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('现场', x + 17, y + 7.5);
      k.restore();
    }
    // 台标和直播角标
    const chrome = tvOut(u, TV_OUT.chrome);
    const la = tvIn(u, TV_T.logo) * chrome;
    if (la > 0) {
      k.globalAlpha = la; k.save(); k.translate(-20 * (1 - la), 0);
      k.fillStyle = TV_RED; k.fillRect(14, 10, 22, 22); k.fillStyle = '#FFF'; k.font = `900 14px ${SANS}`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('晨', 25, 21.5);
      k.textAlign = 'left'; k.font = `800 13px ${SANS}`; k.fillText('晨光新闻', 42, 17); k.fillStyle = TV_SKY; k.font = `600 7px ${DISP}`; k.fillText('MORNING NEWS', 42, 28);
      k.restore(); k.globalAlpha = 1;
    }
    const lv = tvIn(u, TV_T.live) * chrome;
    if (lv > 0) {
      k.globalAlpha = lv; k.textBaseline = 'middle';
      k.fillStyle = TV_RED; k.fillRect(CW - 104, 10, 44, 15);
      k.fillStyle = '#FFF'; if (Math.floor(u * 2) % 2 === 0) { k.beginPath(); k.arc(CW - 96, 17.5, 2.5, 0, TAU); k.fill(); }
      k.font = `800 9px ${SANS}`; k.textAlign = 'left'; k.fillText('直播', CW - 89, 18);
      k.font = `700 11px ${MONO}`; k.fillText('07:30', CW - 54, 18); k.globalAlpha = 1;
    }
    // 「突发」横幅：平行四边形从左扫进、停住、再往右扫出
    const bi = out3(seg(u, TV_T.bk[0], TV_T.bk[1])), bo = inOut3(seg(u, TV_T.bk[2], TV_T.bk[3]));
    if (bi > 0 && bo < 1) {
      const bx = -CW * (1 - bi) + CW * bo, by = 96;
      k.fillStyle = '#FFF'; k.beginPath(); k.moveTo(bx - 10, by - 2); k.lineTo(bx + CW + 8, by - 2); k.lineTo(bx + CW, by + 28); k.lineTo(bx - 18, by + 28); k.closePath(); k.fill();
      k.fillStyle = TV_RED; k.beginPath(); k.moveTo(bx - 6, by); k.lineTo(bx + CW + 4, by); k.lineTo(bx + CW - 2, by + 26); k.lineTo(bx - 12, by + 26); k.closePath(); k.fill();
      k.fillStyle = '#FFF'; k.font = `900 14px ${SANS}`; k.textAlign = 'left'; k.textBaseline = 'middle';
      k.fillText('突发', bx + 18, by + 13.5); k.font = `700 12px ${SANS}`; k.fillText('城东新桥今晚封闭施工', bx + 62, by + 13.5);
    }
    // 两层下方标题条：从左滑入，复位时第二层先收
    k.textBaseline = 'middle'; k.textAlign = 'left';
    const p1 = tvIn(u, TV_T.l1) * tvOut(u, TV_OUT.l1), p2 = tvIn(u, TV_T.l2) * tvOut(u, TV_OUT.l2);
    if (p1 > 0) {
      const x = 14 - 380 * (1 - p1);
      k.fillStyle = TV_RED; k.fillRect(x, TV_L3_Y, 46, 26); k.fillStyle = '#FFF'; k.font = `900 13px ${SANS}`; k.fillText('最新', x + 9, TV_L3_Y + 13.5);
      k.fillStyle = '#FFF'; k.fillRect(x + 46, TV_L3_Y, 300, 26); k.fillStyle = TV_DEEP; k.font = `900 16px ${SANS}`; k.fillText('地铁今起延长运营', x + 58, TV_L3_Y + 13.5);
    }
    if (p2 > 0) {
      const x = 14 - 380 * (1 - p2);
      k.fillStyle = 'rgba(6,34,74,0.92)'; k.fillRect(x, TV_L3_Y + 26, 346, 18);
      k.fillStyle = '#FFF'; k.font = `600 10px ${SANS}`; k.fillText('末班车延后至 23:30 · 周末再延 1 小时', x + 12, TV_L3_Y + 35.5);
    }
    // 滚动字幕：每周期整数轮，6.4 秒与 0 秒位置相同
    const tk = tvIn(u, TV_T.tick, 0.3) * chrome;
    if (tk > 0) {
      const y = TV_TICK.y + 20 * (1 - tk);
      k.fillStyle = '#FFF'; k.fillRect(0, y, CW, 18);
      const off = (((u / CYC) * TV_TICK.loops) % 1) * TV_TICK.p;
      k.save(); k.beginPath(); k.rect(44, y, CW - 44, 18); k.clip();
      k.fillStyle = TV_DEEP; k.font = `600 10px ${SANS}`;
      for (let j = 0; j < 2; j++) TV_TICK_ITEMS.forEach(([dx, s]) => { const x = 56 + dx - off + j * TV_TICK.p; k.fillText(s, x, y + 9.5); k.fillStyle = TV_RED; k.fillRect(x - 8, y + 7, 3, 3); k.fillStyle = TV_DEEP; });
      k.restore();
      k.fillStyle = TV_RED; k.fillRect(0, y, 44, 18); k.fillStyle = '#FFF'; k.font = `800 10px ${SANS}`; k.fillText('快讯', 11, y + 9.5);
    }
  };

  // @element 27
  // 27 字幕新闻：压暗的夜间街景当底，一句一屏超大字幕。「外卖平均」逐字打出，数字从 0 滚到 28，
  // 「28 分钟」压上黄色色块，补充句逐字出现，来源小字从下方滑入；右侧计时环跟着数字走。复位时字幕整体上移出画面
  const CN_Y = '#FFD600', CN_N = 28;
  const CN_T = { bar: [0.2, 0.6], l1: [0.3, 0.9], num: [1.0, 2.0], blk: [2.05, 2.4], l3: [2.7, 3.4], src: [3.6, 4.0] };
  const CN_L1 = '外卖平均', CN_L3 = '比三年前快了 6 分钟', CN_SRC = '来源：示例调查（虚构数据）';
  const CN_BOKEH = 16;                                             // 背景光斑数
  CELLS[26] = (k, w, h, u) => {
    k.fillStyle = '#0A0A0A'; k.fillRect(0, 0, CW, CH);
    // 光斑每周期整好横移一屏，循环无缝
    for (let i = 0; i < CN_BOKEH; i++) {
      const x = ((hash(i) + u / CYC) % 1) * (CW + 60) - 30, y = 30 + hash(i + 20) * 150, r = 6 + hash(i + 40) * 16;
      k.fillStyle = hash(i + 60) > 0.5 ? 'rgba(255,190,90,0.07)' : 'rgba(255,214,0,0.05)';
      k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill();
    }
    k.fillStyle = 'rgba(255,255,255,0.05)'; k.fillRect(0, 176, CW, 2);
    k.save(); k.translate(0, -CH * resetK(u));
    // 左侧黄竖条
    const bh = 150 * out3(seg(u, CN_T.bar[0], CN_T.bar[1]));
    k.fillStyle = CN_Y; k.fillRect(24, 32, 4, bh);
    k.textAlign = 'left'; k.textBaseline = 'alphabetic';
    k.fillStyle = '#FFF'; k.font = `800 26px ${SANS}`;
    k.fillText(CN_L1.slice(0, Math.floor(seg(u, CN_T.l1[0], CN_T.l1[1]) * CN_L1.length)), 42, 58);
    const val = Math.round(out3(seg(u, CN_T.num[0], CN_T.num[1])) * CN_N);
    if (u >= CN_T.num[0]) {
      // 数字宽度按「28」固定，滚动时后面的「分钟送达」不跟着抖
      k.font = `900 76px ${DISP}`; const wn = k.measureText(String(CN_N)).width;
      k.font = `900 38px ${SANS}`; const wm = k.measureText('分钟').width;
      // 「分钟」与「送达」分开画、中间留 CN_GAP，黄块右沿落在空隙正中，不压到「送」
      const CN_GAP = 12, xm = 42 + wn + 10, xs = xm + wm + CN_GAP;
      const draw = c => {
        k.fillStyle = c; k.font = `900 76px ${DISP}`; k.textAlign = 'right'; k.fillText(String(val), 42 + wn, 140);
        k.textAlign = 'left'; k.font = `900 38px ${SANS}`; k.fillText('分钟', xm, 140); k.fillText('送达', xs, 140);
      };
      draw('#FFF');
      // 关键词黄块：从左往右铺过「28 分钟」，左右各留 6 px，块内的字反成黑色
      const bw = (xm + wm + CN_GAP / 2 - 36) * out3(seg(u, CN_T.blk[0], CN_T.blk[1]));
      if (bw > 0) {
        k.fillStyle = CN_Y; k.fillRect(36, 78, bw, 74);
        k.save(); k.beginPath(); k.rect(36, 78, bw, 74); k.clip(); draw('#0A0A0A'); k.restore();
      }
    }
    k.fillStyle = '#BDBDBD'; k.font = `600 15px ${SANS}`;
    k.fillText(CN_L3.slice(0, Math.floor(seg(u, CN_T.l3[0], CN_T.l3[1]) * CN_L3.length)), 42, 172);
    const sp = out3(seg(u, CN_T.src[0], CN_T.src[1]));
    if (sp > 0) { k.globalAlpha = sp; k.fillStyle = '#9A9A9A'; k.font = `500 9px ${SANS}`; k.fillText(CN_SRC, 42, 196 + 14 * (1 - sp)); k.globalAlpha = 1; }
    // 计时环：灰底圈 + 黄弧，弧长 = 数字 / 60 分钟
    if (u >= CN_T.num[0]) {
      const cx = 450, cy = 100, R = 46;
      k.strokeStyle = 'rgba(255,255,255,0.14)'; k.lineWidth = 8; k.beginPath(); k.arc(cx, cy, R, 0, TAU); k.stroke();
      k.strokeStyle = CN_Y; k.lineCap = 'butt'; k.beginPath(); k.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + (val / 60) * TAU); k.stroke();
      k.fillStyle = '#FFF'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.font = `800 22px ${DISP}`; k.fillText(String(val), cx, cy - 4);
      k.fillStyle = '#9A9A9A'; k.font = `600 9px ${SANS}`; k.fillText('分钟 / 60', cx, cy + 16);
    }
    k.restore();
  };

  // @element 28
  // 28 视觉调查：深灰工作台上并排三栏——左边原文剪报、中间现场示意画、右边时间线。原文里荧光笔划出「钟楼刚刚落成」，
  // 现场画上红圈圈住钟楼，时间线游标从 1920 滑到 1934 停住，镜头推近到现场画定格并打上「推定：1934 年」。复位时红圈、划线擦去，镜头拉回
  const IV_RED = '#FF3B30', IV_PAPER = '#ECE6D6', IV_INK = '#1F1D1A';
  const IV_COL = { doc: [20, 28, 150, 160], pic: [186, 28, 170, 120], tl: [372, 28, 148, 160] }; // 三栏 x、y、宽、高
  const IV_YEARS = [1920, 1945], IV_HIT = 1934;                    // 时间线范围、推定年份
  // 三栏常驻（复位只擦标记、拉回镜头，6.4 秒与 0 秒画面一致），标记从 0.4 秒开始依次出现
  const IV_T = { hl: [0.4, 0.9], ring: [1.2, 1.8], cur: [2.0, 2.8], zoom: [3.3, 3.9], stamp: 4.0 };
  const IV_ZOOM = 1.7;                                             // 推近倍数（以红圈为中心）
  const IV_RING = [270, 70, 22, 30];                               // 红圈中心与横、竖半径（落在钟楼上）
  CELLS[27] = (k, w, h, u) => {
    k.fillStyle = '#101114'; k.fillRect(0, 0, CW, CH);
    k.strokeStyle = 'rgba(255,255,255,0.04)'; k.lineWidth = 1;
    for (let x = 0; x < CW; x += 20) { k.beginPath(); k.moveTo(x + 0.5, 0); k.lineTo(x + 0.5, CH); k.stroke(); }
    // 擦除：复位段红圈、划线、游标、印章一起变淡，镜头同时拉回
    const er = 1 - resetK(u);
    const zp = inOut3(seg(u, IV_T.zoom[0], IV_T.zoom[1])) * er;
    const z = mix(1, IV_ZOOM, zp), [rx, ry] = IV_RING;
    // 推近：红圈中心从原位移到画面中心，同时放大
    k.save(); k.translate(mix(rx, CW / 2, zp), mix(ry, CH / 2, zp)); k.scale(z, z); k.translate(-rx, -ry);
    // 左栏：原文剪报
    {
      const [x, y, cw, ch] = IV_COL.doc; k.save();
      k.fillStyle = IV_PAPER; k.fillRect(x, y, cw, ch);
      k.fillStyle = IV_INK; k.font = `900 12px ${SERIF}`; k.textAlign = 'left'; k.textBaseline = 'alphabetic'; k.fillText('本埠新闻', x + 10, y + 20);
      k.fillRect(x + 10, y + 25, cw - 20, 1);
      const lines = ['南岸码头近日', '人潮如织，', '钟楼刚刚落成，', '市民争相合影。', '记者 摄于江边'];
      k.font = `500 11px ${SERIF}`;
      lines.forEach((s, i) => {
        const ly = y + 44 + i * 22;
        if (i === 2) {
          // 荧光笔：黄色半透明条从左往右划过关键句
          const hw = k.measureText(s).width * out3(seg(u, IV_T.hl[0], IV_T.hl[1])) * er;
          if (hw > 0) { k.fillStyle = 'rgba(255,214,0,0.55)'; k.fillRect(x + 8, ly - 11, hw + 4, 14); }
        }
        k.fillStyle = i === 4 ? '#7A7468' : IV_INK; k.fillText(s, x + 10, ly);
      });
      k.restore();
    }
    // 中栏：现场示意画（江岸、钟楼、人群），下方标注
    {
      const [x, y, cw, ch] = IV_COL.pic; k.save();
      k.fillStyle = '#F4F1EA'; k.fillRect(x - 4, y - 4, cw + 8, ch + 22);
      k.save(); k.beginPath(); k.rect(x, y, cw, ch); k.clip();
      const sg = k.createLinearGradient(0, y, 0, y + ch); sg.addColorStop(0, '#B8B2A4'); sg.addColorStop(1, '#8E887A'); k.fillStyle = sg; k.fillRect(x, y, cw, ch);
      k.fillStyle = '#6E695E'; k.fillRect(x, y + 92, cw, 28);                                   // 江面
      k.fillStyle = '#4A463F';
      [[x + 6, 50, 26], [x + 34, 36, 30], [x + 120, 44, 40]].forEach(([bx, bh, bw]) => k.fillRect(bx, y + 92 - bh, bw, bh));
      k.fillRect(rx - 9, y + 30, 18, 62); k.beginPath(); k.moveTo(rx - 12, y + 30); k.lineTo(rx, y + 10); k.lineTo(rx + 12, y + 30); k.fill(); // 钟楼
      k.fillStyle = '#D9D4C8'; k.beginPath(); k.arc(rx, y + 42, 5, 0, TAU); k.fill();
      k.strokeStyle = '#4A463F'; k.lineWidth = 1; k.beginPath(); k.moveTo(rx, y + 42); k.lineTo(rx, y + 39); k.moveTo(rx, y + 42); k.lineTo(rx + 2.5, y + 42); k.stroke();
      k.fillStyle = '#3A362F'; for (let i = 0; i < 18; i++) { const px = x + 10 + i * 9 + hash(i) * 4, py = y + 92; k.fillRect(px, py - 7, 3, 7); k.beginPath(); k.arc(px + 1.5, py - 9, 2, 0, TAU); k.fill(); }
      k.restore();
      k.fillStyle = '#6A665E'; k.font = `500 8px ${SANS}`; k.textAlign = 'left'; k.fillText('现场示意 · 南岸码头', x, y + ch + 12);
      k.restore();
    }
    // 右栏：时间线，游标滑到推定年份
    {
      const [x, y, cw, ch] = IV_COL.tl; k.save();
      k.fillStyle = '#1B1D22'; k.fillRect(x, y, cw, ch);
      k.fillStyle = '#8D8F96'; k.font = `700 9px ${SANS}`; k.textAlign = 'left'; k.fillText('时间线', x + 10, y + 16);
      const lx = x + 30, y0 = y + 30, y1 = y + ch - 14, yAt = yr => mix(y0, y1, (yr - IV_YEARS[0]) / (IV_YEARS[1] - IV_YEARS[0]));
      k.strokeStyle = '#4A4D55'; k.lineWidth = 2; k.beginPath(); k.moveTo(lx, y0); k.lineTo(lx, y1); k.stroke();
      const cp = out3(seg(u, IV_T.cur[0], IV_T.cur[1])) * er;
      [[1920, '码头扩建'], [1927, '江堤加固'], [1934, '钟楼落成'], [1941, '码头停用']].forEach(([yr, s]) => {
        const yy = yAt(yr); k.fillStyle = '#4A4D55'; k.fillRect(lx - 4, yy - 1, 8, 2);
        k.fillStyle = '#8D8F96'; k.font = `600 9px ${MONO}`; k.textAlign = 'right'; k.fillText(String(yr).slice(2), lx - 7, yy + 3);
        // 游标停到推定年份后，该条事件变亮
        k.textAlign = 'left'; k.fillStyle = yr === IV_HIT && cp > 0.98 ? '#F2EFE8' : '#8D8F96'; k.font = `600 9px ${SANS}`; k.fillText(s, lx + 10, yy + 3);
      });
      if (cp > 0) {
        const yy = yAt(mix(IV_YEARS[0], IV_HIT, cp));
        k.fillStyle = IV_RED; k.beginPath(); k.moveTo(lx - 10, yy - 5); k.lineTo(lx - 2, yy); k.lineTo(lx - 10, yy + 5); k.fill();
        k.fillRect(lx - 2, yy - 1, cw - 40, 2);
      }
      k.restore();
    }
    // 红圈：手绘感的椭圆，起止点错开一点；线宽按缩放反算，推近后不变粗
    const rp = seg(u, IV_T.ring[0], IV_T.ring[1]) * er;
    if (rp > 0) {
      const pts = []; for (let i = 0; i <= 50; i++) { const t = i / 50, an = -2 + t * (TAU + 0.5), rr = 1 + 0.06 * Math.sin(t * 7); pts.push([rx + Math.cos(an) * IV_RING[2] * rr, ry + Math.sin(an) * IV_RING[3] * rr]); }
      k.strokeStyle = IV_RED; k.lineWidth = 2.5 / z; k.lineCap = 'round'; strokeProg(k, pts, rp);
    }
    k.restore();
    // 定格印章（不跟镜头缩放）
    const sp = backOut(seg(u, IV_T.stamp, IV_T.stamp + 0.3)) * er;
    if (sp > 0) {
      k.save(); k.translate(CW - 96, CH - 34); k.rotate(-0.08); k.scale(sp, sp);
      k.fillStyle = 'rgba(16,17,20,0.85)'; k.fillRect(-70, -14, 140, 28);
      k.strokeStyle = IV_RED; k.lineWidth = 2; k.strokeRect(-70, -14, 140, 28);
      k.fillStyle = IV_RED; k.font = `900 14px ${SANS}`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(`推定：${IV_HIT} 年`, 0, 1);
      k.restore();
    }
    // 定格时的四角取景框
    if (zp > 0.5) {
      k.strokeStyle = `rgba(242,239,232,${((zp - 0.5) * 1.6).toFixed(3)})`; k.lineWidth = 2;
      [[10, 10, 1, 1], [CW - 10, 10, -1, 1], [10, CH - 10, 1, -1], [CW - 10, CH - 10, -1, -1]].forEach(([x, y, sx, sy]) => { k.beginPath(); k.moveTo(x, y + 14 * sy); k.lineTo(x, y); k.lineTo(x + 14 * sx, y); k.stroke(); });
    }
  };

  // @element 29
  // 29 档案灯台：暗房里冷白灯台亮起，一条胶片和三根竹简依次放上；放大镜从左沿竹简滑过，停在关键字「年」上放大，
  // 红笔在镜片里一笔圈住，旁边贴上编号签。复位时灯台熄灭，物件往上撤出画面
  const LT_TABLE = [30, 22, 479, 164];                             // 灯台 x、y、宽、高
  const LT_RED = '#E0302A';
  const LT_T = { on: [0.1, 0.5], film: 0.6, slips: [0.9, 1.1, 1.3], lens: [1.7, 3.0], ring: [3.2, 3.7], tag: 3.9 };
  const LT_SLIPS = [{ x: 300, s: '元年春正月' }, { x: 340, s: '王命作宫室' }, { x: 380, s: '三年乃成' }]; // 竹简 x 与文字
  const LT_KEY = { slip: 2, ch: 1 };                               // 关键字：第 3 根竹简第 2 个字「年」
  const LT_CH = 18, LT_Y0 = 46;                                    // 竹简字距、首字 y
  const LT_LENS_R = 30, LT_LENS_Z = 2.2;                           // 放大镜半径、倍数
  CELLS[28] = (k, w, h, u) => {
    k.fillStyle = '#0A0D14'; k.fillRect(0, 0, CW, CH);
    const off = resetK(u), on = out3(seg(u, LT_T.on[0], LT_T.on[1])) * (1 - off);
    // 灯台本体：开灯时日光灯启辉闪几帧
    const flick = u > LT_T.on[0] && u < LT_T.on[0] + 0.25 && Math.floor(u * 30) % 3 === 0 ? 0.4 : 1;
    const [tx, ty, tw, th] = LT_TABLE;
    k.fillStyle = '#1A1F2A'; k.fillRect(tx - 6, ty - 6, tw + 12, th + 12);
    const lg = k.createRadialGradient(tx + tw / 2, ty + th / 2, 20, tx + tw / 2, ty + th / 2, tw * 0.62);
    lg.addColorStop(0, '#F4F9FF'); lg.addColorStop(1, '#BFD0E6');
    k.globalAlpha = on * flick; k.fillStyle = lg; k.fillRect(tx, ty, tw, th);
    k.strokeStyle = 'rgba(30,50,90,0.12)'; k.lineWidth = 1; for (let x = tx + 20; x < tx + tw; x += 20) { k.beginPath(); k.moveTo(x + 0.5, ty); k.lineTo(x + 0.5, ty + th); k.stroke(); }
    k.globalAlpha = 1;
    // 物件落下：淡入 + 从上方落 16 px；复位时整体往上撤 220 px
    const drop = t0 => { const p = out3(seg(u, t0, t0 + 0.3)); return { a: p, dy: -16 * (1 - p) - off * 220 }; };
    const drawScene = () => {
      // 胶片条：透光的琥珀色片基，两侧齿孔，三格画面
      let d = drop(LT_T.film);
      if (d.a > 0) {
        k.save(); k.globalAlpha = d.a; k.translate(70, 104 + d.dy); k.rotate(-0.06);
        k.fillStyle = 'rgba(60,34,14,0.88)'; k.fillRect(0, 0, 196, 56);
        k.fillStyle = '#F4F9FF'; for (let i = 0; i < 14; i++) { k.fillRect(5 + i * 14, 4, 7, 5); k.fillRect(5 + i * 14, 47, 7, 5); }
        for (let i = 0; i < 3; i++) {
          k.fillStyle = 'rgba(244,210,160,0.75)'; k.fillRect(8 + i * 62, 13, 56, 30);
          k.fillStyle = 'rgba(60,34,14,0.8)'; k.fillRect(8 + i * 62 + 14 + i * 6, 23, 14, 20); k.beginPath(); k.arc(8 + i * 62 + 21 + i * 6, 20, 5, 0, TAU); k.fill();
        }
        k.restore();
      }
      // 竹简：竖条、编绳、竖排墨字
      LT_SLIPS.forEach((sl, i) => {
        d = drop(LT_T.slips[i]); if (d.a <= 0) return;
        k.save(); k.globalAlpha = d.a; k.translate(0, d.dy);
        const g = k.createLinearGradient(sl.x - 13, 0, sl.x + 13, 0); g.addColorStop(0, '#B9935A'); g.addColorStop(0.5, '#D9B67A'); g.addColorStop(1, '#A9834C');
        k.fillStyle = g; k.fillRect(sl.x - 13, 32, 26, 140);
        k.fillStyle = '#6E4E2A'; k.fillRect(sl.x - 15, 58, 30, 2); k.fillRect(sl.x - 15, 140, 30, 2);
        k.fillStyle = '#2A1A0E'; k.font = `700 14px ${KAI}`; k.textAlign = 'center'; k.textBaseline = 'middle';
        [...sl.s].forEach((c, j) => k.fillText(c, sl.x, LT_Y0 + 6 + j * LT_CH + (j > 0 ? 6 : 0)));
        k.restore();
      });
    };
    drawScene();
    // 关键字中心（与上面竖排字位置公式一致）
    const kx = LT_SLIPS[LT_KEY.slip].x, ky = LT_Y0 + 6 + LT_KEY.ch * LT_CH + 6;
    // 放大镜：从胶片右侧沿弧线滑到关键字，镜片里按倍数重画一遍场景
    const lp = inOut3(seg(u, LT_T.lens[0], LT_T.lens[1]));
    // 放大镜和编号签在复位开头 0.25 秒内先撤，免得灯灭后还留一个暗圆
    const early = 1 - seg(u, SHOW, SHOW + 0.25);
    const la = seg(u, LT_T.lens[0] - 0.2, LT_T.lens[0]) * early;
    if (la > 0) {
      const mx = mix(250, kx, lp), my = mix(150, ky, lp) - Math.sin(lp * Math.PI) * 30;
      k.save(); k.globalAlpha = la;
      k.beginPath(); k.arc(mx, my, LT_LENS_R, 0, TAU); k.clip();
      k.fillStyle = '#F4F9FF'; k.fillRect(mx - LT_LENS_R, my - LT_LENS_R, LT_LENS_R * 2, LT_LENS_R * 2);
      k.translate(mx, my); k.scale(LT_LENS_Z, LT_LENS_Z); k.translate(-mx, -my); drawScene();
      k.restore();
      k.save(); k.globalAlpha = la;
      k.strokeStyle = '#2A2F3A'; k.lineWidth = 5; k.beginPath(); k.arc(mx, my, LT_LENS_R, 0, TAU); k.stroke();
      k.strokeStyle = 'rgba(255,255,255,0.6)'; k.lineWidth = 2; k.beginPath(); k.arc(mx, my, LT_LENS_R - 5, -2.4, -1.6); k.stroke();
      k.strokeStyle = '#2A2F3A'; k.lineWidth = 8; k.lineCap = 'round'; k.beginPath(); k.moveTo(mx + 22, my + 22); k.lineTo(mx + 46, my + 46); k.stroke();
      // 红笔圈：画在镜片里，围住放大后的关键字
      const rp = seg(u, LT_T.ring[0], LT_T.ring[1]);
      if (rp > 0) { k.strokeStyle = LT_RED; k.lineWidth = 2.5; k.lineCap = 'round'; strokeProg(k, circlePts(mx, my, 16, 40, -2.2), rp); }
      k.restore();
    }
    // 编号签
    const tp = backOut(seg(u, LT_T.tag, LT_T.tag + 0.3)) * early;
    if (tp > 0) {
      k.save(); k.translate(kx + 90, ky - 4); k.scale(tp, tp); k.rotate(0.04);
      k.fillStyle = '#FFF'; k.fillRect(-38, -18, 76, 36); k.fillStyle = LT_RED; k.fillRect(-38, -18, 4, 36);
      k.fillStyle = '#0A0D14'; k.font = `800 11px ${SANS}`; k.textAlign = 'left'; k.textBaseline = 'middle'; k.fillText('关键字「年」', -29, -5);
      k.fillStyle = '#8AA0C0'; k.font = `600 8px ${MONO}`; k.fillText('No.03-2', -29, 9);
      k.restore();
    }
  };

  // @element 30
  // 30 铜版博物：旧纸底的博物图版「蒲公英」。先用细墨线勾出茎、基生叶、花序和果球，再由一道 45° 排线从左上往右下扫过叶片和花心，
  // 淡彩晚一拍从中心渗开，左侧图注逐条出现。复位时淡彩先褪，排线和墨线从末端收回，回到空白图版
  const CP_PAPER = '#EFE6D2', CP_INK = '#3A2E22', CP_RED = '#7A1E14';
  const CP_FRAME = [176, 8, 352, 192];                             // 图版框 x、y、宽、高
  const CP_T = { stem: [0.3, 0.7], leaf: [0.5, 0.18, 0.45], flower: [1.0, 1.4], seed: [1.2, 1.8], hatch: [1.4, 2.9], tint: [2.7, 3.6], cap: [1.0, 0.45] };
  const CP_BACK = [SHOW + 0.25, CYC - 0.05];                       // 墨线和排线收回的时段
  const CP_HATCH = 3.2;                                            // 排线间距
  const CP_FLOWER = [300, 62], CP_SEED = [410, 58, 30];            // 花序中心；果球中心与半径
  // 基生叶：[基点 x, 基点 y, 朝向角, 长, 半宽]；锯齿用相邻采样点宽窄交替做出倒向的裂片
  const CP_LEAVES = [[330, 196, -2.75, 120, 17], [330, 196, -2.35, 96, 14], [332, 196, -0.42, 118, 16], [332, 196, -0.8, 92, 13]];
  const cpLeaf = ([bx, by, ang, L, W]) => {
    const n = 16, left = [], right = [], c = Math.cos(ang), s = Math.sin(ang);
    for (let i = 0; i <= n; i++) {
      const t = i / n, wv = W * Math.sin(Math.PI * Math.min(1, t * 1.08)) * (i % 2 ? 0.5 : 1);
      left.push([t * L, -wv]); right.push([t * L, wv * 0.85]);
    }
    return left.concat(right.reverse()).map(([x, y]) => [bx + x * c - y * s, by + x * s + y * c]);
  };
  const CP_LEAF_PTS = CP_LEAVES.map(cpLeaf);
  const cpQuad = (a, b, c2, n = 24) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, m = 1 - t; o.push([m * m * a[0] + 2 * m * t * b[0] + t * t * c2[0], m * m * a[1] + 2 * m * t * b[1] + t * t * c2[1]]); } return o; };
  const CP_STEMS = [cpQuad([330, 196], [318, 130], [CP_FLOWER[0], CP_FLOWER[1] + 10]), cpQuad([334, 196], [362, 120], [CP_SEED[0], CP_SEED[1] + CP_SEED[2]])];
  const CP_CAPS = [['PL. XII', 9, MONO, '#8A7A60'], ['蒲公英', 22, SERIF, CP_INK], ['Taraxacum officinale', 9, SERIF, '#6A5A44'], ['1  头状花序', 10, SERIF, CP_INK], ['2  冠毛果球', 10, SERIF, CP_INK], ['3  基生叶，倒向羽裂', 10, SERIF, CP_INK]];
  CELLS[29] = (k, w, h, u) => {
    k.fillStyle = '#E4D8BE'; k.fillRect(0, 0, CW, CH);
    k.fillStyle = CP_PAPER; k.fillRect(8, 4, CW - 16, CH - 8);
    // 纸面霉斑
    for (let i = 0; i < 26; i++) { k.fillStyle = `rgba(150,110,60,${(0.05 + hash(i + 7) * 0.08).toFixed(3)})`; k.beginPath(); k.arc(12 + hash(i) * (CW - 24), 8 + hash(i + 30) * (CH - 16), 1 + hash(i + 60) * 3, 0, TAU); k.fill(); }
    const [fx, fy, fw, fh] = CP_FRAME;
    k.strokeStyle = CP_INK; k.lineWidth = 1.2; k.strokeRect(fx, fy, fw, fh); k.lineWidth = 0.5; k.strokeRect(fx + 3, fy + 3, fw - 6, fh - 6);
    const back = 1 - seg(u, CP_BACK[0], CP_BACK[1]);
    const tintK = out3(seg(u, CP_T.tint[0], CP_T.tint[1])) * (1 - seg(u, SHOW, SHOW + 0.3));
    // 淡彩：从各部位中心按圆形往外渗开，和墨线错开 1.5 px，像手工上色没对准
    const wash = (pts, color, cx, cy, R) => {
      if (tintK <= 0) return;
      k.save(); k.beginPath(); k.arc(cx, cy, R * tintK, 0, TAU); k.clip();
      k.fillStyle = color; k.beginPath(); pts.forEach(([x, y], i) => (i ? k.lineTo(x + 1.5, y + 1) : k.moveTo(x + 1.5, y + 1))); k.closePath(); k.fill();
      k.restore();
    };
    CP_LEAF_PTS.forEach(p => wash(p, 'rgba(112,140,78,0.38)', 330, 190, 130));
    wash(circlePts(CP_FLOWER[0], CP_FLOWER[1], 17, 24), 'rgba(230,178,40,0.5)', CP_FLOWER[0], CP_FLOWER[1], 22);
    wash(circlePts(CP_SEED[0], CP_SEED[1], CP_SEED[2], 32), 'rgba(170,180,190,0.25)', CP_SEED[0], CP_SEED[1], 34);
    // 排线：x + y = c 的 45° 斜线，只画 c 小于扫过阈值的部分；阈值随复位倒退
    const thr = mix(160, 640, seg(u, CP_T.hatch[0], CP_T.hatch[1]) * back);
    const hatch = (pts, dir = 1) => {
      if (thr <= 160) return;
      k.save(); k.beginPath(); pts.forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y))); k.closePath(); k.clip();
      k.strokeStyle = 'rgba(58,46,34,0.55)'; k.lineWidth = 0.6; k.beginPath();
      for (let c = 160; c < thr; c += CP_HATCH) {
        if (dir > 0) { k.moveTo(c - 220, 220); k.lineTo(c, 0); }
        else { const d = c - 400; k.moveTo(d, 0); k.lineTo(d + 220, 220); }
      }
      k.stroke(); k.restore();
    };
    CP_LEAF_PTS.forEach(p => hatch(p));
    hatch(circlePts(CP_FLOWER[0], CP_FLOWER[1], 6, 20)); hatch(circlePts(CP_FLOWER[0], CP_FLOWER[1], 6, 20), -1);
    // 墨线
    k.strokeStyle = CP_INK; k.lineCap = 'round'; k.lineJoin = 'round';
    const pr = (a, b) => seg(u, a, b) * back;
    k.lineWidth = 1.3; CP_STEMS.forEach(s => strokeProg(k, s, pr(CP_T.stem[0], CP_T.stem[1])));
    k.lineWidth = 1;
    CP_LEAF_PTS.forEach((p, i) => { const a = CP_T.leaf[0] + i * CP_T.leaf[1]; strokeProg(k, p.concat([p[0]]), pr(a, a + CP_T.leaf[2])); k.lineWidth = 0.6; strokeProg(k, [p[0], p[8]], pr(a, a + CP_T.leaf[2])); k.lineWidth = 1; });
    // 花序：放射状舌状花 + 下垂总苞
    const fp = pr(CP_T.flower[0], CP_T.flower[1]);
    if (fp > 0) {
      const [cx, cy] = CP_FLOWER; k.lineWidth = 0.8; k.beginPath();
      for (let i = 0; i < 26; i++) { const a = (i / 26) * TAU, r0 = 5, r1 = 15 + hash(i) * 4; const e = clamp(fp * 1.4 - (i / 26) * 0.4); if (e <= 0) continue; k.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.7); k.lineTo(cx + Math.cos(a) * mix(r0, r1, e), cy + Math.sin(a) * mix(r0, r1, e) * 0.7); }
      for (let i = -3; i <= 3; i++) { k.moveTo(cx + i * 2, cy + 8); k.quadraticCurveTo(cx + i * 3, cy + 14, cx + i * 4.5, cy + 16 * fp); }
      k.stroke();
      k.beginPath(); k.ellipse(cx, cy, 6, 4.2, 0, 0, TAU * fp); k.stroke();
    }
    // 果球：冠毛细线，末端分三叉
    const sp = pr(CP_T.seed[0], CP_T.seed[1]);
    if (sp > 0) {
      const [cx, cy, R] = CP_SEED; k.lineWidth = 0.5; k.beginPath();
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * TAU + hash(i) * 0.1, e = clamp(sp * 1.5 - hash(i + 9) * 0.5); if (e <= 0) continue;
        const x1 = cx + Math.cos(a) * mix(3, R, e), y1 = cy + Math.sin(a) * mix(3, R, e);
        k.moveTo(cx + Math.cos(a) * 3, cy + Math.sin(a) * 3); k.lineTo(x1, y1);
        if (e >= 1) for (let j = -1; j <= 1; j++) { k.moveTo(x1, y1); k.lineTo(x1 + Math.cos(a + j * 0.5) * 4, y1 + Math.sin(a + j * 0.5) * 4); }
      }
      k.stroke(); k.fillStyle = CP_INK; k.beginPath(); k.arc(cx, cy, 3 * sp, 0, TAU); k.fill();
    }
    // 部位编号
    k.fillStyle = CP_RED; k.font = `italic 600 9px ${SERIF}`; k.textAlign = 'center'; k.textBaseline = 'middle';
    const na = clamp(seg(u, CP_T.seed[1], CP_T.seed[1] + 0.3) * back * 2);
    if (na > 0) { k.globalAlpha = na; k.fillText('1', CP_FLOWER[0] - 24, CP_FLOWER[1] - 8); k.fillText('2', CP_SEED[0] + 40, CP_SEED[1] - 20); k.fillText('3', 220, 176); k.globalAlpha = 1; }
    // 左侧图注逐条出现，复位时淡出
    const capOut = 1 - seg(u, SHOW + 0.2, SHOW + 0.5);
    k.textAlign = 'left'; k.textBaseline = 'alphabetic';
    let cy = 30;
    CP_CAPS.forEach(([s, size, font, color], i) => {
      const a = out3(seg(u, CP_T.cap[0] + i * CP_T.cap[1], CP_T.cap[0] + i * CP_T.cap[1] + 0.3)) * capOut;
      cy += size + (i === 1 ? 10 : i === 3 ? 14 : 6);
      if (a <= 0) return;
      k.globalAlpha = a; k.fillStyle = color; k.font = `${i === 2 ? 'italic ' : ''}${i === 1 ? 900 : 500} ${size}px ${font}`; k.fillText(s, 24 + 8 * (1 - a), cy);
      if (i === 2) { k.fillStyle = CP_INK; k.fillRect(24, cy + 8, 120, 0.8); }
      k.globalAlpha = 1;
    });
  };

  // @element 31
  // 31 长卷：深褐案面上，一幅街市长卷从右往左展开——左轴滚过去，河、拱桥、店铺、柳树和行人的线描淡彩依次露出；
  // 卷首竖排题签贴上并盖印，放大镜移到桥上挑担的人物身上放大停住。复位时左轴往右卷回，长卷收起
  const HS_PAPER = '#EFE3C8', HS_INK = '#3A2A1C', HS_WOOD = '#C08A52';
  const HS_Y = [30, 178];                                          // 画心上下边
  const HS_RIGHT = 506, HS_LEFT_MIN = 34;                          // 右轴位置、左轴展开到的最左
  const HS_T = { open: [0.3, 2.2], slip: 2.3, seal: 2.6, lens: [3.0, 3.8], lensOff: [4.9, 5.3] };
  const HS_HERO = [304, 112];                                      // 放大镜要找的挑担人物
  const HS_LENS_R = 34, HS_LENS_Z = 2.4;
  const hsPerson = (k, x, y, s, robe) => {
    k.fillStyle = robe; k.beginPath(); k.moveTo(x, y - 6 * s); k.lineTo(x - 3.5 * s, y + 3 * s); k.lineTo(x + 3.5 * s, y + 3 * s); k.closePath(); k.fill();
    k.fillStyle = HS_INK; k.beginPath(); k.arc(x, y - 8 * s, 2.2 * s, 0, TAU); k.fill();
  };
  const hsScene = k => {
    // 河：淡青色水带和几道水纹
    k.fillStyle = 'rgba(150,175,165,0.45)'; k.fillRect(40, 140, 470, 34);
    k.strokeStyle = 'rgba(58,42,28,0.35)'; k.lineWidth = 0.7; k.beginPath();
    for (let r = 0; r < 4; r++) for (let x = 44; x < 506; x += 22) { const y = 146 + r * 7 + ((x / 22) % 2) * 2; k.moveTo(x, y); k.quadraticCurveTo(x + 5, y - 2, x + 10, y); }
    k.stroke();
    // 拱桥
    k.strokeStyle = HS_INK; k.lineWidth = 1.4; k.fillStyle = '#D6C29C';
    k.beginPath(); k.moveTo(250, 142); k.quadraticCurveTo(305, 98, 360, 142); k.lineTo(352, 142); k.quadraticCurveTo(305, 112, 258, 142); k.closePath(); k.fill(); k.stroke();
    k.lineWidth = 0.8; for (let i = 0; i <= 10; i++) { const t = i / 10, x = mix(254, 356, t), y = 142 - 44 * 4 * t * (1 - t) * 0.92; k.beginPath(); k.moveTo(x, y); k.lineTo(x, y - 6); k.stroke(); }
    // 店铺与屋宇：灰青屋顶、土黄墙、酒旗
    [[60, 96, 70, 'rgba(110,124,128,0.85)'], [140, 104, 56, 'rgba(110,124,128,0.85)'], [392, 92, 60, 'rgba(96,108,112,0.85)'], [456, 100, 46, 'rgba(110,124,128,0.85)']].forEach(([x, y, ww, roof]) => {
      k.fillStyle = '#DCC9A2'; k.fillRect(x + 4, y, ww - 8, 140 - y);
      k.strokeStyle = HS_INK; k.lineWidth = 1; k.strokeRect(x + 4, y, ww - 8, 140 - y);
      k.fillStyle = roof; k.beginPath(); k.moveTo(x - 6, y + 2); k.quadraticCurveTo(x + ww / 2, y - 4, x + ww + 6, y + 2); k.lineTo(x + ww - 6, y - 12); k.lineTo(x + 6, y - 12); k.closePath(); k.fill(); k.stroke();
      k.fillStyle = 'rgba(58,42,28,0.55)'; k.fillRect(x + ww / 2 - 6, y + 14, 12, 140 - y - 14);
    });
    k.strokeStyle = HS_INK; k.lineWidth = 1; k.beginPath(); k.moveTo(196, 140); k.lineTo(196, 70); k.stroke();
    k.fillStyle = '#B5452C'; k.fillRect(196, 72, 14, 26); k.fillStyle = HS_PAPER; k.font = `700 9px ${KAI}`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('酒', 203, 85);
    // 柳树：垂下的细枝
    [[232, 80], [372, 78]].forEach(([x, y]) => {
      k.strokeStyle = HS_INK; k.lineWidth = 1.6; k.beginPath(); k.moveTo(x, 140); k.lineTo(x + 2, y); k.stroke();
      k.strokeStyle = 'rgba(110,140,80,0.8)'; k.lineWidth = 0.8; k.beginPath();
      for (let i = 0; i < 10; i++) { const a = -1.2 + i * 0.27, ex = x + Math.cos(a) * 22, ey = y + Math.sin(a) * 10; k.moveTo(x + 2, y); k.quadraticCurveTo(ex, ey, ex + 2, ey + 26); }
      k.stroke();
    });
    // 小船
    k.fillStyle = '#8A6A44'; k.beginPath(); k.moveTo(120, 156); k.lineTo(176, 156); k.lineTo(168, 164); k.lineTo(128, 164); k.closePath(); k.fill();
    k.strokeStyle = HS_INK; k.lineWidth = 0.8; k.stroke(); hsPerson(k, 160, 154, 0.9, '#5E6E7A');
    // 行人
    [[80, 138, '#7A5A3A'], [110, 139, '#5E6E7A'], [176, 138, '#8A4A3A'], [420, 138, '#5E6E7A'], [480, 139, '#7A5A3A'], [278, 122, '#8A4A3A'], [334, 120, '#5E6E7A']].forEach(([x, y, c]) => hsPerson(k, x, y, 1, c));
    // 主角：桥上挑担的人
    const [hx, hy] = HS_HERO; hsPerson(k, hx, hy, 1.1, '#3E5E7A');
    k.strokeStyle = HS_INK; k.lineWidth = 1; k.beginPath(); k.moveTo(hx - 12, hy - 9); k.lineTo(hx + 12, hy - 7); k.stroke();
    k.beginPath(); k.moveTo(hx - 11, hy - 9); k.lineTo(hx - 11, hy - 2); k.moveTo(hx + 11, hy - 7); k.lineTo(hx + 11, hy); k.stroke();
    k.fillStyle = '#A8843E'; k.beginPath(); k.arc(hx - 11, hy, 3, 0, TAU); k.arc(hx + 11, hy + 2, 3, 0, TAU); k.fill();
  };
  CELLS[30] = (k, w, h, u) => {
    k.fillStyle = '#241910'; k.fillRect(0, 0, CW, CH);
    k.strokeStyle = 'rgba(243,231,207,0.04)'; k.lineWidth = 1; for (let y = 6; y < CH; y += 9) { k.beginPath(); k.moveTo(0, y + hash(y) * 3); k.lineTo(CW, y); k.stroke(); }
    const lx = mix(HS_RIGHT, HS_LEFT_MIN, inOut3(seg(u, HS_T.open[0], HS_T.open[1])) * (1 - inOut3(seg(u, SHOW, CYC - 0.1))));
    const [y0, y1] = HS_Y;
    // 画心：裱边上下各一道锦条，只露出左轴到右轴之间
    k.save(); k.beginPath(); k.rect(lx, y0 - 8, HS_RIGHT - lx, y1 - y0 + 16); k.clip();
    k.fillStyle = 'rgba(0,0,0,0.35)'; k.fillRect(lx, y0 - 4, HS_RIGHT - lx, y1 - y0 + 14);
    k.fillStyle = '#8A5A3A'; k.fillRect(0, y0 - 8, CW, 8); k.fillRect(0, y1, CW, 8);
    k.fillStyle = HS_PAPER; k.fillRect(0, y0, CW, y1 - y0);
    hsScene(k);
    // 题签与印章：卷首（右端）
    const sl = backOut(seg(u, HS_T.slip, HS_T.slip + 0.3));
    if (sl > 0) {
      k.save(); k.translate(486, 74); k.scale(sl, sl);
      k.fillStyle = '#F7F0DE'; k.fillRect(-8, -38, 16, 76); k.strokeStyle = HS_WOOD; k.lineWidth = 0.8; k.strokeRect(-8, -38, 16, 76);
      k.fillStyle = HS_INK; k.font = `700 11px ${KAI}`; k.textAlign = 'center'; k.textBaseline = 'middle'; [...'市井图卷'].forEach((c, i) => k.fillText(c, 0, -27 + i * 17));
      k.restore();
    }
    const se = backOut(seg(u, HS_T.seal, HS_T.seal + 0.25));
    if (se > 0) { k.save(); k.translate(486, 124); k.scale(se, se); k.fillStyle = '#B5291F'; k.fillRect(-7, -7, 14, 14); k.fillStyle = HS_PAPER; k.font = `700 6px ${KAI}`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('长卷', 0, 0.5); k.restore(); }
    k.restore();
    // 两根木轴：圆柱渐变 + 两端轴头
    const roller = x => {
      const g = k.createLinearGradient(x - 6, 0, x + 6, 0); g.addColorStop(0, '#6E4A26'); g.addColorStop(0.45, HS_WOOD); g.addColorStop(1, '#5A3A1C');
      k.fillStyle = g; k.fillRect(x - 6, y0 - 12, 12, y1 - y0 + 24);
      k.fillStyle = '#E9D6A8'; k.fillRect(x - 4, y0 - 20, 8, 8); k.fillRect(x - 4, y1 + 12, 8, 8);
    };
    roller(HS_RIGHT); roller(lx);
    // 放大镜：从右上移到挑担人物，镜片里放大重画一遍
    const la = seg(u, HS_T.lens[0] - 0.2, HS_T.lens[0]) * (1 - seg(u, HS_T.lensOff[0], HS_T.lensOff[1]));
    if (la > 0) {
      const lp = inOut3(seg(u, HS_T.lens[0], HS_T.lens[1]));
      const mx = mix(440, HS_HERO[0], lp), my = mix(66, HS_HERO[1] - 6, lp);
      k.save(); k.globalAlpha = la; k.beginPath(); k.arc(mx, my, HS_LENS_R, 0, TAU); k.clip();
      k.fillStyle = HS_PAPER; k.fillRect(mx - HS_LENS_R, my - HS_LENS_R, HS_LENS_R * 2, HS_LENS_R * 2);
      k.translate(mx, my); k.scale(HS_LENS_Z, HS_LENS_Z); k.translate(-mx, -my); hsScene(k);
      k.restore();
      k.save(); k.globalAlpha = la;
      k.strokeStyle = '#3A2A1C'; k.lineWidth = 5; k.beginPath(); k.arc(mx, my, HS_LENS_R, 0, TAU); k.stroke();
      k.strokeStyle = 'rgba(255,255,255,0.5)'; k.lineWidth = 2; k.beginPath(); k.arc(mx, my, HS_LENS_R - 6, -2.5, -1.7); k.stroke();
      k.strokeStyle = '#6E4A26'; k.lineWidth = 8; k.lineCap = 'round'; k.beginPath(); k.moveTo(mx + 25, my + 25); k.lineTo(mx + 50, my + 50); k.stroke();
      k.restore();
    }
  };

  // @element 32
  // 32 敦煌壁画：石窟壁面被土黄灰泥盖着，灰泥一块块剥落，露出赭红底上的飞天——头光、石绿裙、两条长飘带随风起伏，
  // 卷云和落花点缀；左上金色榜题「飞天」有流光扫过两次。复位时灰泥从边缘往中间重新覆上
  const DH_WALL = [16, 12, 507, 184];                              // 壁面 x、y、宽、高
  const DH_COLS = 10, DH_ROWS = 4;                                 // 灰泥块网格
  const DH_FALL = { t0: 0.4, dt: 0.05, dur: 0.4 };                 // 剥落起始、相邻块间隔、单块下落时长
  const DH_COAT = { dt: 0.018, dur: 0.15 };                        // 复位重新覆上的间隔与淡入时长
  const DH_GLINT = [[3.0, 3.8], [4.4, 5.1]];                       // 榜题流光两次
  const DH_RED = '#8A3B22', DH_GREEN = '#3E7A5E', DH_GOLD = '#E9C86A', DH_OUT = '#3A1A10', DH_SKIN = '#D8A47A';
  const DH_FIG = { x: 236, y: 104, sc: 1.1, bobX: 10, bobY: 6, tilt: -0.16, sway: 0.05 }; // 飞天腰部位置、缩放、浮动幅度、身体倾角与摆幅
  // 灰泥块顶点：网格点加抖动，相邻块共用顶点，裂缝严丝合缝
  const DH_V = (() => { const o = []; for (let r = 0; r <= DH_ROWS; r++) for (let c = 0; c <= DH_COLS; c++) { const edge = r === 0 || r === DH_ROWS || c === 0 || c === DH_COLS; const jx = edge && (c === 0 || c === DH_COLS) ? 0 : (hash(r * 31 + c) - 0.5) * 22, jy = edge && (r === 0 || r === DH_ROWS) ? 0 : (hash(r * 17 + c + 5) - 0.5) * 18; o.push([DH_WALL[0] + (c / DH_COLS) * DH_WALL[2] + jx, DH_WALL[1] + (r / DH_ROWS) * DH_WALL[3] + jy]); } return o; })();
  const DH_TILES = (() => {
    const o = [];
    for (let r = 0; r < DH_ROWS; r++) for (let c = 0; c < DH_COLS; c++) {
      const v = (rr, cc) => DH_V[rr * (DH_COLS + 1) + cc];
      const edgeD = Math.min(r, DH_ROWS - 1 - r, c, DH_COLS - 1 - c);
      o.push({ pts: [v(r, c), v(r, c + 1), v(r + 1, c + 1), v(r + 1, c)], h: hash(r * 13 + c * 7 + 3), edgeD });
    }
    // 剥落顺序按哈希打乱；重新覆上按离边缘的远近，从外往里
    [...o].sort((a, b) => a.h - b.h).forEach((t, i) => { t.fall = DH_FALL.t0 + i * DH_FALL.dt; });
    [...o].sort((a, b) => a.edgeD - b.edgeD || a.h - b.h).forEach((t, i) => { t.coat = SHOW + i * DH_COAT.dt; });
    return o;
  })();
  CELLS[31] = (k, w, h, u) => {
    k.fillStyle = '#2A1712'; k.fillRect(0, 0, CW, CH);
    const [wx, wy, ww, wh] = DH_WALL;
    // 壁画底：赭红渐变 + 土色斑驳
    const g = k.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, '#9A4628'); g.addColorStop(1, DH_RED);
    k.fillStyle = g; k.fillRect(wx, wy, ww, wh);
    for (let i = 0; i < 30; i++) { k.fillStyle = `rgba(60,24,12,${(0.08 + hash(i + 3) * 0.1).toFixed(3)})`; k.beginPath(); k.arc(wx + hash(i) * ww, wy + hash(i + 40) * wh, 3 + hash(i + 80) * 9, 0, TAU); k.fill(); }
    // 卷云：石绿与白的勾卷
    [[90, 150, 1], [420, 46, -1], [470, 160, 1]].forEach(([cx, cy, d]) => {
      k.strokeStyle = 'rgba(214,226,206,0.8)'; k.lineWidth = 2; k.beginPath();
      for (let j = 0; j < 3; j++) { const x = cx + j * 18 * d; k.moveTo(x + 8, cy); k.arc(x, cy, 8, 0, Math.PI * 1.5, d < 0); }
      k.stroke();
      k.fillStyle = 'rgba(62,122,94,0.55)'; k.beginPath(); k.ellipse(cx + 18 * d, cy + 6, 30, 6, 0, 0, TAU); k.fill();
    });
    // 飞天：整个人在局部坐标里画（原点在腰，朝左飞），外层做上下浮动、前后漂移和身体轻摆。
    // 所有摆动都用 ph（每周期整 2 圈）或 ph / 2（整 1 圈）驱动，6.4 秒与 0 秒同一帧
    const ph = (u / CYC) * TAU * 2;
    const F = DH_FIG;
    // 先裁到壁面内：带尾甩得远，不能伸出窟壁
    k.save(); k.beginPath(); k.rect(wx, wy, ww, wh); k.clip();
    k.save();
    k.translate(F.x + Math.sin(ph / 2) * F.bobX, F.y + Math.sin(ph) * F.bobY);
    k.rotate(F.tilt + Math.sin(ph + 0.6) * F.sway); k.scale(F.sc, F.sc);
    k.lineJoin = 'round'; k.lineCap = 'round';
    // 飘带：沿三次贝塞尔走大 S 形，波从身体往带尾传（sin(t·k − ph)），越往尾摆幅越大、越细
    const ribbon = (B, amp, kw, off, w0, color) => {
      const top = [], bot = [];
      for (let i = 0; i <= 44; i++) {
        const t = i / 44, m = 1 - t;
        const x = m * m * m * B[0][0] + 3 * m * m * t * B[1][0] + 3 * m * t * t * B[2][0] + t * t * t * B[3][0];
        const y = m * m * m * B[0][1] + 3 * m * m * t * B[1][1] + 3 * m * t * t * B[2][1] + t * t * t * B[3][1] + Math.sin(t * kw - ph + off) * amp * t;
        const wv = w0 * (1 - 0.65 * t) + 0.5 + Math.sin(t * 9 - ph * 2 + off) * 0.6 * t;
        top.push([x, y - wv]); bot.push([x, y + wv]);
      }
      k.fillStyle = color; k.beginPath(); top.concat(bot.reverse()).forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y))); k.closePath(); k.fill();
      k.strokeStyle = DH_OUT; k.lineWidth = 0.7; k.stroke();
    };
    // 肢体：先画深色描边粗线再叠肤色细线，关节处自然圆滑
    const limb = (pts, w) => {
      [[DH_OUT, w + 2], [DH_SKIN, w]].forEach(([c, lw]) => { k.strokeStyle = c; k.lineWidth = lw; k.beginPath(); pts.forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y))); k.stroke(); });
      // 末端加手（脚）掌，避免肢体像一根棍
      const [ex, ey] = pts[pts.length - 1], [px, py] = pts[pts.length - 2], an = Math.atan2(ey - py, ex - px);
      k.fillStyle = DH_SKIN; k.strokeStyle = DH_OUT; k.lineWidth = 0.9; k.beginPath(); k.ellipse(ex + Math.cos(an) * 2, ey + Math.sin(an) * 2, w * 0.95, w * 0.6, an, 0, TAU); k.fill(); k.stroke();
    };
    const rotP = ([x, y], [ox, oy], r) => [ox + (x - ox) * Math.cos(r) - (y - oy) * Math.sin(r), oy + (x - ox) * Math.sin(r) + (y - oy) * Math.cos(r)];
    // 前手从下巴下方往前托莲（整条手臂低于头，不挡脸），后手往头后上扬；各自绕肩轻摆，相位错开
    const sF = [-24, -7], aF = Math.sin(ph + 0.4) * 0.12, eF = rotP([-40, 1], sF, aF), hF = rotP([-57, -5], sF, aF * 1.4);
    const sB = [-16, -12], aB = Math.sin(ph + 2.2) * 0.16, eB = rotP([-6, -30], sB, aB), hB = rotP([-18, -44], sB, aB * 1.3);
    // 三条飘带：青带从前手绕过头顶甩到身后，红带从肩下兜一圈拖到身后，细青带接在后手
    ribbon([hF, [-46, -82], [40, -70], [236, -40]], 12, 7, 0, 3.4, '#2F6E7A');
    ribbon([[-14, -8], [18, 34], [120, 32], [246, 6]], 14, 6, 1.7, 3.2, '#B5452C');
    ribbon([hB, [20, -62], [110, -22], [200, -58]], 9, 8, 3.1, 2.2, '#3F8A92');
    // 头光
    k.strokeStyle = DH_GREEN; k.lineWidth = 3; k.beginPath(); k.arc(-36, -22, 16, 0, TAU); k.stroke();
    k.fillStyle = 'rgba(233,200,106,0.35)'; k.beginPath(); k.arc(-36, -22, 14, 0, TAU); k.fill();
    limb([sB, eB, hB], 4.4);
    // 腿：大腿藏在裙里，只露出纤长的小腿和绷直的脚背。前腿屈膝把脚勾到身后上方，后腿顺着裙尾向后伸；
    // 小腿画成两头收窄的填充形，脚尖拉成尖角，踝上一道金镯
    const leg = (kx, ky, ax, ay, tx, ty, wK, wA) => {
      const an = Math.atan2(ay - ky, ax - kx), nx = -Math.sin(an), ny = Math.cos(an);
      k.fillStyle = DH_SKIN; k.strokeStyle = DH_OUT; k.lineWidth = 0.9;
      k.beginPath(); k.moveTo(kx + nx * wK, ky + ny * wK);
      k.quadraticCurveTo((kx + ax) / 2 + nx * (wK + 1.2), (ky + ay) / 2 + ny * (wK + 1.2), ax + nx * wA, ay + ny * wA);   // 小腿肚微鼓
      k.quadraticCurveTo(ax + nx * wA * 1.6 + (tx - ax) * 0.4, ay + ny * wA * 1.6 + (ty - ay) * 0.4, tx, ty);              // 脚背到脚尖
      k.quadraticCurveTo(ax - nx * wA * 0.6 + (tx - ax) * 0.3, ay - ny * wA * 0.6 + (ty - ay) * 0.3, ax - nx * wA, ay - ny * wA);
      k.lineTo(kx - nx * wK, ky - ny * wK); k.closePath(); k.fill(); k.stroke();
      k.strokeStyle = DH_GOLD; k.lineWidth = 1.3; k.beginPath(); k.moveTo(ax + nx * (wA + 0.6), ay + ny * (wA + 0.6)); k.lineTo(ax - nx * (wA + 0.6), ay - ny * (wA + 0.6)); k.stroke();
    };
    // 裙身与腿共用的起伏：w1 在膝附近，w2 滞后一拍在裙尾
    const w1 = Math.sin(ph) * 2.5, w2 = Math.sin(ph - 0.9) * 5;
    // 双腿画在裙子之前：从胯到膝的大腿和膝盖都被裙子盖住，只有小腿从裙子上沿里伸出来，衔接处由裙边自然遮住。
    // 前腿屈膝把脚勾到身后上方；后腿顺着裙身往后伸，脚从中股裙尾上沿探出。大腿、小腿都绕各自关节轻摆
    const thigh = (hx, hy, kx, ky, w) => { k.strokeStyle = DH_SKIN; k.lineWidth = w; k.lineCap = 'round'; k.beginPath(); k.moveTo(hx, hy); k.lineTo(kx, ky); k.stroke(); };
    const aL = Math.sin(ph + 1.2) * 0.12, kn = [60, 0 + w1];
    const an1 = rotP([80, -24 + w1], kn, aL), to1 = rotP([88, -34 + w1], kn, aL * 1.2);
    thigh(8, 2, kn[0], kn[1], 9); leg(kn[0], kn[1], an1[0], an1[1], to1[0], to1[1], 4, 1.8);
    const kn2 = [82, 4 + w2], aL2 = Math.sin(ph + 2.0) * 0.1;
    const an2 = rotP([106, -10 + w2], kn2, aL2), to2 = rotP([116, -16 + w2], kn2, aL2 * 1.3);
    thigh(10, 4, kn2[0], kn2[1], 8); leg(kn2[0], kn2[1], an2[0], an2[1], to2[0], to2[1], 3.6, 1.6);
    // 长裙：仿唐代飞天「吴带当风」的画法——裙身沿一条 S 形脊线往身后拖，末端分成 3 股渐细的裙尾，尾尖向上卷起；
    // 轮廓全部由脊线采样生成（不用折线拼），裙褶是一组跟脊线平行的细长弧线。波沿脊线往后传，越往尾摆幅越大
    const DH_SK_N = 40;                                               // 每股采样点数
    // 脊线：腰 (−2, 2) → 膝 (66, 4) → 往后上方甩出；k0 控制该股在尾部的上下分散
    const spine = (t, k0) => {
      const m = 1 - t, P = [[-2, 2], [44, -2], [96, 4 + k0 * 4], [150, -6 + k0 * 18]];
      const x = m * m * m * P[0][0] + 3 * m * m * t * P[1][0] + 3 * m * t * t * P[2][0] + t * t * t * P[3][0];
      const y = m * m * m * P[0][1] + 3 * m * m * t * P[1][1] + 3 * m * t * t * P[2][1] + t * t * t * P[3][1];
      return [x, y + Math.sin(t * 5 - ph + k0) * 6 * t * t];
    };
    // 一股裙尾：宽度从腰到尾先略鼓后收尖，尾尖最后 12% 向上卷
    const strand = (k0, wMax, curl) => {
      const top = [], bot = [];
      for (let i = 0; i <= DH_SK_N; i++) {
        const t = i / DH_SK_N, [x, y] = spine(t, k0), [x2, y2] = spine(Math.min(1, t + 0.01), k0);
        const an = Math.atan2(y2 - y, x2 - x), nx = -Math.sin(an), ny = Math.cos(an);
        const wv = wMax * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.1)) * (1 - t * 0.55);
        const cu = t > 0.88 ? -curl * ((t - 0.88) / 0.12) ** 2 : 0;
        top.push([x + nx * wv, y + ny * wv + cu]); bot.push([x - nx * wv, y - ny * wv + cu]);
      }
      return { top, bot };
    };
    const path = ({ top, bot }) => { k.beginPath(); top.concat([...bot].reverse()).forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y))); k.closePath(); };
    const sgr = k.createLinearGradient(0, -14, 0, 24); sgr.addColorStop(0, '#2C664E'); sgr.addColorStop(1, '#43836A');
    // 三股裙尾：下股最长最宽，上股细长上扬；先画远的下股，近的上股压在上面
    const SK = [{ k0: 1.0, w: 12, c: 3, col: '#2E6A50' }, { k0: 0.35, w: 13, c: 4, col: null }, { k0: -0.45, w: 8, c: 6, col: '#3F8066' }];
    SK.forEach(({ k0, w, c, col }) => {
      const st = strand(k0, w, c);
      k.fillStyle = col || sgr; k.strokeStyle = DH_OUT; k.lineWidth = 1; path(st); k.fill(); k.stroke();
      // 裙褶：同一股里 3 条平行于脊线的细弧，起点错开、终点汇向尾尖
      k.save(); path(st); k.clip();
      k.strokeStyle = 'rgba(220,236,214,0.42)'; k.lineWidth = 0.7;
      for (let j = 1; j <= 3; j++) {
        const f = j / 4 * 2 - 1; k.beginPath();
        for (let i = 4 + j * 2; i <= DH_SK_N - 2; i++) {
          const t = i / DH_SK_N, A = st.top[i], B = st.bot[i], q = (1 - f * (1 - t)) / 2;
          const x = A[0] * q + B[0] * (1 - q), y = A[1] * q + B[1] * (1 - q);
          i === 4 + j * 2 ? k.moveTo(x, y) : k.lineTo(x, y);
        }
        k.stroke();
      }
      k.restore();
      // 裙边：米白宽边压朱红细线，沿该股下沿从膝后走到尾尖
      [['#EADFC4', 2.2], ['#B5452C', 0.8]].forEach(([cc, lw]) => {
        k.strokeStyle = cc; k.lineWidth = lw; k.beginPath();
        st.bot.slice(Math.floor(DH_SK_N * 0.45)).forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y)));
        k.stroke();
      });
    });
    // 外层短裙：浅石绿，荷叶边下摆三段弧，弧随相位轻轻翻动
    k.fillStyle = '#5E9E80'; k.strokeStyle = DH_OUT; k.lineWidth = 1;
    k.beginPath(); k.moveTo(-4, -8); k.bezierCurveTo(14, -13, 32, -12, 46, -6 + w1 * 0.5);
    for (let i = 0; i < 3; i++) { const x0 = 46 - i * 15, x1 = x0 - 15, d = Math.sin(ph - i * 0.7) * 1.5; k.quadraticCurveTo((x0 + x1) / 2 + 1, 8 + i * 0.5 + d, x1, 2 + i * 1.5); }
    k.quadraticCurveTo(-6, 9, 0, 8); k.closePath(); k.fill(); k.stroke();
    k.strokeStyle = DH_GOLD; k.lineWidth = 1; k.beginPath(); k.moveTo(-3, -6); k.bezierCurveTo(14, -11, 30, -10, 44, -5 + w1 * 0.5); k.stroke();   // 腰缘金线
    // 腰带：红色短带垂下，带尾随风摆
    k.strokeStyle = '#B5452C'; k.lineWidth = 2.2; k.beginPath(); k.moveTo(-2, 0); k.quadraticCurveTo(6, 12, 2 + Math.sin(ph + 0.8) * 5, 22); k.stroke();
    // 躯干与项圈
    k.fillStyle = DH_SKIN; k.strokeStyle = DH_OUT; k.lineWidth = 1.1;
    k.beginPath(); k.moveTo(-31, -13); k.quadraticCurveTo(-16, -18, -2, -9); k.lineTo(2, 4); k.quadraticCurveTo(-14, 1, -28, -3); k.closePath(); k.fill(); k.stroke();
    k.strokeStyle = DH_GOLD; k.lineWidth = 1.4; k.beginPath(); k.arc(-28, -14, 6, 0.2, 1.9); k.stroke();
    // 头：微微低首。唐代飞天常见的高髻——头顶盘起两个发环（双环髻），额前一道弧形发际，鬓发垂过耳侧；
    // 髻前插金花冠，两条宝缯（发带）从髻后长长甩向身后，波从发髻往带尾传
    const bao = (x0, y0, len, off, col, wd) => {
      const top = [], bot = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20, x = x0 + t * len, y = y0 - t * 6 + Math.sin(t * 6 - ph + off) * 4 * t, wv = wd * (1 - 0.7 * t);
        top.push([x, y - wv]); bot.push([x, y + wv]);
      }
      k.fillStyle = col; k.beginPath(); top.concat(bot.reverse()).forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y))); k.closePath(); k.fill();
    };
    bao(-26, -36, 34, 0, '#B5452C', 1.3);
    bao(-25, -33, 28, 1.4, '#3F8A92', 1.1);
    // 脑后发团：盖住头顶和后脑
    k.fillStyle = '#2A140C'; k.beginPath(); k.ellipse(-33, -24, 9, 9.5, -0.45, 0, TAU); k.fill();
    // 脸
    k.fillStyle = DH_SKIN; k.strokeStyle = DH_OUT; k.lineWidth = 1;
    k.beginPath(); k.ellipse(-38, -20, 6.8, 8.2, -0.45, 0, TAU); k.fill(); k.stroke();
    // 额前发际：从额头弧到耳后，把脸上半部收进发里
    k.fillStyle = '#2A140C'; k.beginPath(); k.moveTo(-44, -24); k.quadraticCurveTo(-41, -31, -33, -30); k.quadraticCurveTo(-34, -25, -31, -19); k.quadraticCurveTo(-37, -27, -44, -24); k.fill();
    // 鬓发：一缕细发垂过耳侧，随风轻摆
    k.strokeStyle = '#2A140C'; k.lineWidth = 1.2; k.beginPath(); k.moveTo(-32, -20); k.quadraticCurveTo(-30, -12, -27 + Math.sin(ph + 0.5) * 1.5, -6); k.stroke();
    // 双环髻：两个空心发环立在头顶，后环略低
    k.strokeStyle = '#2A140C'; k.lineCap = 'round';
    k.lineWidth = 3; k.beginPath(); k.ellipse(-27, -36, 4, 5.5, 0.5, 0, TAU); k.stroke();
    k.lineWidth = 3.2; k.beginPath(); k.ellipse(-34, -38, 4.2, 6, -0.15, 0, TAU); k.stroke();
    k.fillStyle = '#2A140C'; k.beginPath(); k.ellipse(-31, -31, 6, 3, -0.3, 0, TAU); k.fill();   // 髻根
    // 金花冠：一道金弧加三朵小花钿
    k.strokeStyle = DH_GOLD; k.lineWidth = 1.3; k.beginPath(); k.arc(-34, -26, 7.5, -2.6, -1.2); k.stroke();
    k.fillStyle = DH_GOLD; [[-40, -31], [-35, -34], [-29, -32]].forEach(([x, y]) => { k.beginPath(); k.arc(x, y, 1.6, 0, TAU); k.fill(); });
    k.fillStyle = '#B5452C'; k.beginPath(); k.arc(-35, -34, 0.8, 0, TAU); k.fill();
    // 五官：低垂的眼线与一点朱唇，额间花钿
    k.strokeStyle = DH_OUT; k.lineWidth = 0.9; k.beginPath(); k.moveTo(-44, -20); k.quadraticCurveTo(-42, -18.6, -40, -19.6); k.stroke();
    k.fillStyle = '#B5452C'; k.beginPath(); k.arc(-44.5, -14.5, 0.9, 0, TAU); k.fill(); k.beginPath(); k.arc(-45, -24.5, 0.7, 0, TAU); k.fill();
    limb([sF, eF, hF], 4.4);
    // 手中莲花：五瓣，随手一起摆
    k.fillStyle = '#E8B6A0'; k.strokeStyle = DH_OUT; k.lineWidth = 0.8;
    for (let i = -2; i <= 2; i++) { k.beginPath(); k.ellipse(hF[0] - 3 + i * 2, hF[1] - 4, 2.3, 5.5, i * 0.35 - 0.3, 0, TAU); k.fill(); k.stroke(); }
    k.restore();
    k.restore();
    // 落花：慢慢飘落，每周期整数次落完
    for (let i = 0; i < 12; i++) {
      const loops = 1 + (i % 2), y = wy + ((hash(i + 50) + (u / CYC) * loops) % 1) * wh, x = wx + 30 + hash(i) * (ww - 60) + Math.sin(y / 14 + i) * 6;
      k.fillStyle = i % 3 ? '#E8B6A0' : '#F3E6CC'; k.beginPath(); k.ellipse(x, y, 2.6, 1.6, y / 20, 0, TAU); k.fill();
    }
    // 榜题：金框竖条，流光是一条斜向亮带扫过
    const bx = 42, by = 24, bw = 28, bh = 70;
    k.fillStyle = '#5A2A16'; k.fillRect(bx, by, bw, bh); k.strokeStyle = DH_GOLD; k.lineWidth = 2; k.strokeRect(bx + 2, by + 2, bw - 4, bh - 4);
    k.fillStyle = DH_GOLD; k.font = `900 18px ${KAI}`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('飞', bx + bw / 2, by + 22); k.fillText('天', bx + bw / 2, by + 48);
    DH_GLINT.forEach(([a, b]) => {
      const p = seg(u, a, b); if (p <= 0 || p >= 1) return;
      k.save(); k.beginPath(); k.rect(bx, by, bw, bh); k.clip();
      const yy = mix(by - 30, by + bh + 30, p), lg = k.createLinearGradient(bx, yy - 14, bx + bw, yy + 14);
      lg.addColorStop(0, 'rgba(255,240,190,0)'); lg.addColorStop(0.5, 'rgba(255,240,190,0.75)'); lg.addColorStop(1, 'rgba(255,240,190,0)');
      k.fillStyle = lg; k.fillRect(bx, by, bw, bh); k.restore();
    });
    // 灰泥块：剥落时下坠、旋转、变淡；复位时从边缘往里重新淡入覆上。裁在壁面内，下坠的块不掉到窟壁外
    k.save(); k.beginPath(); k.rect(wx, wy, ww, wh); k.clip();
    DH_TILES.forEach(t => {
      const fp = seg(u, t.fall, t.fall + DH_FALL.dur), cp = seg(u, t.coat, t.coat + DH_COAT.dur);
      let a, dy = 0, rot = 0;
      if (u >= t.coat) a = cp;
      else { a = 1 - fp; dy = 60 * fp * fp; rot = (t.h - 0.5) * 0.6 * fp; }
      if (a <= 0) return;
      const cx = t.pts.reduce((s, p) => s + p[0], 0) / 4, cy = t.pts.reduce((s, p) => s + p[1], 0) / 4;
      k.save(); k.globalAlpha = a; k.translate(cx, cy + dy); k.rotate(rot); k.translate(-cx, -cy);
      k.fillStyle = t.h > 0.5 ? '#C9A46A' : '#BF9A60';
      k.beginPath(); t.pts.forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y))); k.closePath(); k.fill();
      k.strokeStyle = 'rgba(80,50,24,0.55)'; k.lineWidth = 1; k.stroke();
      k.fillStyle = 'rgba(120,84,44,0.25)'; for (let i = 0; i < 4; i++) { k.beginPath(); k.arc(cx + (hash(t.h * 100 + i) - 0.5) * 30, cy + (hash(t.h * 100 + i + 9) - 0.5) * 24, 1.5 + hash(i + t.h) * 2, 0, TAU); k.fill(); }
      k.restore();
    });
    k.restore();
    // 壁面外框与窟壁阴影
    k.strokeStyle = 'rgba(0,0,0,0.5)'; k.lineWidth = 3; k.strokeRect(wx, wy, ww, wh);
  };

  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});
