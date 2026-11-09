/* Motion Prompt · pack "infostyles" · MIT License (c) 2026 sadjjk · https://github.com/lemomo-ai/lemo-opuscar */
MotionPrompt.pack('infostyles', function () {
  // @kit
  // 信息影像（每格 539x208、6.4 秒周期；每格都是只依赖时间 u 的纯函数）
  // 风格思路参考 lemo-opuscar（Lemomo）的风格说明，代码为本仓库独立实现。
  // 0–5.4 秒推进到成品并停住，5.4–6.0 秒内容淡出，只剩底色；6.0–6.4 秒保持底色，与 u=0 相接。
  // 随机只用 hash/rnd 加固定种子；点和线的坐标在定义时算好，绘制时按 u 取用。
  const CW = 539, CH = 208;
  const CYC = 6.4;
  const SHOW = 5.4;
  const TAU = Math.PI * 2;
  const MONO = "'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', monospace";
  const SANS = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Hiragino Sans", sans-serif';

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

  // 两个 #rrggbb 颜色按 t 混合，返回 rgb() 字符串
  function mixHex(a, b, t) {
    const p = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
    const A = p(a), B = p(b);
    return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
  }
  function tracePts(k, pts, close = false) { pts.forEach((p, i) => (i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1]))); if (close) k.closePath(); }
  function fillPts(k, pts) { k.beginPath(); tracePts(k, pts, true); k.fill(); }
  function strokePts(k, pts, close = false) { k.beginPath(); tracePts(k, pts, close); k.stroke(); }
  const polyLen = pts => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; };
  // 折线按长度画出前 t（0..1）；t<=0 不画
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
  // 多条折线按总长度依次画出前 t；返回已画完的条数
  function seqDraw(k, list, t) {
    const lens = list.map(polyLen);
    let left = clamp(t) * lens.reduce((a, b) => a + b, 0), done = 0;
    for (let i = 0; i < list.length && left > 0; i++) {
      if (left >= lens[i]) { strokePts(k, list[i]); left -= lens[i]; done++; }
      else { partial(k, list[i], left / lens[i]); left = 0; }
    }
    return done;
  }
  // 折线上按长度比例 t 的点
  function pointAt(pts, t) {
    let left = clamp(t) * polyLen(pts);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (d >= left) { const f = d ? left / d : 0; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }
      left -= d;
    }
    return pts[pts.length - 1];
  }
  // 发光线：先画宽的半透明线做光晕，再画细的实线
  function glowLine(k, pts, t, col, lw) {
    k.save(); k.lineCap = 'round'; k.lineJoin = 'round'; k.strokeStyle = col;
    k.globalAlpha *= 0.22; k.lineWidth = lw * 5; partial(k, pts, t);
    k.globalAlpha /= 0.22; k.lineWidth = lw; partial(k, pts, t);
    k.restore();
  }
  // 光点：径向渐变光晕 + 实心核
  function glowDot(k, x, y, r, col, core) {
    const g = k.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    k.fillStyle = g; k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill();
    k.fillStyle = core; k.beginPath(); k.arc(x, y, Math.max(1, r * 0.22), 0, TAU); k.fill();
  }
  // 细线标注：两端带短横的测量线，按 t 画出，标签随 t 淡入
  function tick(k, x1, y1, x2, y2, label, t, col, lx = 0, ly = -6, align = 'center') {
    if (t <= 0) return;
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L * 3.5, ny = dx / L * 3.5;
    k.save(); k.strokeStyle = col; k.fillStyle = col; k.lineWidth = 0.8;
    partial(k, [[x1, y1], [x2, y2]], seg(t, 0, 0.7));
    k.beginPath(); k.moveTo(x1 - nx, y1 - ny); k.lineTo(x1 + nx, y1 + ny);
    if (t >= 0.7) { k.moveTo(x2 - nx, y2 - ny); k.lineTo(x2 + nx, y2 + ny); }
    k.stroke();
    k.globalAlpha *= seg(t, 0.6, 1); k.font = `500 9px ${MONO}`; k.textAlign = align; k.textBaseline = 'alphabetic';
    k.fillText(label, (x1 + x2) / 2 + lx, (y1 + y2) / 2 + ly);
    k.restore();
  }
  // 等轴投影：x 轴朝右下，z 轴朝左下，y 轴朝上（单位为像素）
  const iso = (ox, oy) => (x, y, z) => [ox + (x - z) * 0.866, oy + (x + z) * 0.5 - y];
  const CELLS = [];

  // @element 01
  // 点云测绘：暖金色的树林点云铺满画面，一道青色切面斜着扫过；扫过的地方树冠点落到地上、消失，
  // 露出侧光照亮的裸地，地上有几道旧石墙的隆起；切面停在右上角，留一角树林。左上角是地名和回波计数，最后出字幕条。
  {
    const BG = '#050505', CUT = '#7FE0D2', GROUND_LO = '#3E3A35', GROUND_HI = '#DDD7CC';
    const GOLD_LO = '#3A2D18', GOLD_HI = '#F2D497';
    const ECHOES = 4812306;                       // 角标回波数的终值，随切面推进累加
    // 透视：z=0 在近处（画面底部外），z=1 在远处（画面顶部）；d 为视距
    const dOf = z => 0.8 + 1.6 * z;
    const scr = (x, z, y) => { const d = dOf(z); return [270 + (x - 0.2) * 360 / d, -100 + (264 - y * 150) / d]; };
    // 地面起伏：几层正弦叠加，幅度很小，靠侧光显出来
    // 平滑值噪声（格点取 rnd，双三次平滑插值），三层叠加；固定种子，结果只由坐标决定
    const vnoise = (x, z, sd) => {
      const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi;
      const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
      const v = (i, j) => rnd(i * 57 + j * 131 + sd, sd);
      return mix(mix(v(xi, zi), v(xi + 1, zi), sx), mix(v(xi, zi + 1), v(xi + 1, zi + 1), sx), sz);
    };
    const WALLS_RAW = [
      [[-1.6, 0.55], [-0.2, 0.6], [0.9, 0.52], [1.9, 0.63]],
      [[-0.25, 0.0], [-0.3, 0.3], [-0.2, 0.6], [-0.38, 1.0]],
      [[0.55, 0.02], [0.72, 0.3], [0.9, 0.52]],
      [[-1.5, 0.86], [-0.3, 0.93]],
      [[-1.0, 0.12], [-0.27, 0.27]],
    ];
    // 石墙在地面上是一道低矮的隆起：到墙线的距离越近越高（z 方向按 2 倍算，抵消透视压缩）
    const segDist = (x, z, A, B) => {
      const vx = B[0] - A[0], vz = (B[1] - A[1]) * 2, px = x - A[0], pz = (z - A[1]) * 2;
      const t = clamp((px * vx + pz * vz) / (vx * vx + vz * vz));
      return Math.hypot(px - vx * t, pz - vz * t);
    };
    const ridge = (x, z) => {
      let d = 9;
      for (const w of WALLS_RAW) for (let i = 1; i < w.length; i++) d = Math.min(d, segDist(x, z, w[i - 1], w[i]));
      return 0.008 * Math.exp(-(d * d) / (0.03 * 0.03));
    };
    const hgt = (x, z) => 0.05 * vnoise(x * 2.2, z * 3.0, 11) + 0.025 * vnoise(x * 5, z * 7, 23) + 0.01 * vnoise(x * 11, z * 15, 37) + ridge(x, z);
    // 切面位置：g = x + z，g < c 的一侧已被扫过
    const gOf = (x, z) => x + z;
    // 切面从画面左缘外（C0）推到右上角（C1），留一角树林；用较缓的 smoothstep，中段不至于一闪而过
    const C0 = -0.55, C1 = 1.2;
    const cutAt = u => { const t = seg(u, 0.4, 4.2); return mix(C0, C1, t * t * (3 - 2 * t)); };
    // 网格：行按 1/d 均分（屏幕上行距近似相等），列按每行可见宽度均分
    const ROWS = 96, COLS = 230, GT = 28;
    const rowZ = s => (1 / mix(1 / 0.6, 1 / 2.9, s) - 0.8) / 1.6;   // 近处从 z<0 开始铺满画面底边，远处到 z≈1.3 盖住顶边
    const halfW = z => 300 * dOf(z) / 360;
    const gridX = (a, z) => 0.2 + (a * 2 - 1) * halfW(z);
    const GCOL = Array.from({ length: GT }, (_, i) => mixHex(GROUND_LO, GROUND_HI, i / (GT - 1)));
    const QUADS = [];
    for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
      const s0 = j / ROWS, s1 = (j + 1) / ROWS, a0 = i / COLS, a1 = (i + 1) / COLS;
      const z0 = rowZ(s0), z1 = rowZ(s1);
      const P = [[a0, z0], [a1, z0], [a1, z1], [a0, z1]].map(([a, z]) => { const x = gridX(a, z); return scr(x, z, hgt(x, z)); });
      const zc = (z0 + z1) / 2, xc = gridX((a0 + a1) / 2, zc), e = 0.01;
      const dx = (hgt(xc + e, zc) - hgt(xc - e, zc)) / (2 * e), dz = (hgt(xc, zc + e) - hgt(xc, zc - e)) / (2 * e);
      // 光从左边低角度照来：朝左的坡亮，朝右的坡暗；远处略暗。不加逐格随机，免得出马赛克
      const tone = clamp((0.62 - 2.2 * dx + 0.6 * dz) * mix(1, 0.8, clamp(zc)));
      QUADS.push({ P, g: gOf(xc, zc), b: Math.min(GT - 1, Math.floor(tone * GT)) });
    }
    // 石墙：地面坐标里的折线，加密并加小抖动，像手垒的石墙
    const WALLS = WALLS_RAW.map((w, wi) => {
      const out = [];
      for (let i = 1; i < w.length; i++) {
        const [x0, z0] = w[i - 1], [x1, z1] = w[i];
        const n = Math.ceil(Math.hypot(x1 - x0, (z1 - z0) * 2) * 60);
        for (let t = i === 1 ? 0 : 1; t <= n; t++) {
          const f = t / n, x = mix(x0, x1, f) + (rnd(wi * 500 + out.length, 1) - 0.5) * 0.012, z = mix(z0, z1, f) + (rnd(wi * 500 + out.length, 2) - 0.5) * 0.006;
          out.push({ p: scr(x, z, hgt(x, z) + 0.012), g: gOf(x, z) });
        }
      }
      return out;
    });
    // 树林点云：在屏幕上大致均匀撒点，每点有地面位置和树冠高度
    const NPTS = 7600, PT = 6;
    const PCOL = Array.from({ length: PT }, (_, i) => mixHex(GOLD_LO, GOLD_HI, i / (PT - 1)));
    const crown = (x, z) => 0.5 + 0.5 * Math.sin(9 * x + 2) * Math.sin(8 * z + 1) + 0.3 * Math.sin(17 * x - 13 * z);
    const PTS = [];
    for (let i = 0; i < NPTS; i++) {
      const z = rowZ(rnd(i, 1)), x = gridX(rnd(i, 2) * 1.04 - 0.02, z);
      const top = 0.16 + 0.12 * clamp(crown(x, z) / 1.3);
      const y0 = hgt(x, z), yc = y0 + top * Math.pow(rnd(i, 3), 0.4);
      const [sx, sy] = scr(x, z, yc), [gx, gy] = scr(x, z, y0);
      const tone = clamp(0.25 + 0.75 * (yc - y0) / 0.28 * (0.6 + 0.4 * rnd(i, 4)));
      PTS.push({ sx, sy, gx, gy, g: gOf(x, z), b: Math.min(PT - 1, Math.floor(tone * PT)), s: 0.9 + 1.0 * (1 - z) });
    }
    // 切面与地面的交线（按当前 c 现算），以及竖起的半透明切面
    const edgeAt = c => {
      const pts = [];
      for (let i = 0; i <= 20; i++) { const z = i / 20, x = c - z; pts.push([x, z]); }
      return pts;
    };
    const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    CELLS[0] = (k, w, h, u) => {
      k.fillStyle = BG; k.fillRect(0, 0, CW, CH);
      const a = vis(u) * seg(u, 0, 0.4);
      if (a <= 0) return;
      k.globalAlpha = a;
      const c = cutAt(u);
      // 1. 已扫过的裸地：按色阶合并成一条路径填充，描同色细边盖住接缝
      const paths = Array.from({ length: GT }, () => []);
      for (const q of QUADS) if (q.g < c) paths[q.b].push(q.P);
      paths.forEach((list, bi) => {
        if (!list.length) return;
        k.fillStyle = GCOL[bi]; k.strokeStyle = GCOL[bi]; k.lineWidth = 0.7;
        k.beginPath(); for (const P of list) tracePts(k, P, true); k.fill(); k.stroke();
      });
      // 2. 石墙：阴影线 + 高光线，只画已扫过的部分；扫完后青色描一遍再退回浮雕
      const trace = seg(u, 4.1, 4.8), traceFade = 1 - seg(u, 4.9, 5.4);
      WALLS.forEach((wall, wi) => {
        const runs = []; let cur = [];
        for (const pt of wall) { if (pt.g < c) cur.push(pt.p); else if (cur.length) { runs.push(cur); cur = []; } }
        if (cur.length) runs.push(cur);
        for (const r of runs) {
          if (r.length < 2) continue;
          k.lineCap = 'round'; k.lineJoin = 'round';
          // 隆起本身已由地形光照显出，这里只补一道细碎石高光
          k.strokeStyle = 'rgba(248,244,236,0.45)'; k.lineWidth = 0.8; strokePts(k, r);
        }
        if (trace > 0 && traceFade > 0) {
          const pts = wall.map(p => p.p);
          k.globalAlpha = a * traceFade;
          glowLine(k, pts, seg(trace, wi * 0.1, wi * 0.1 + 0.6), CUT, 0.9);
          k.globalAlpha = a;
        }
      });
      // 3. 树林点云：未扫过的保持金色；刚扫过（切面后 0.15 内）的点落到地面、变青白、淡掉
      const buckets = Array.from({ length: PT }, () => []), falling = [];
      for (const p of PTS) {
        const dg = c - p.g;
        if (dg <= 0) buckets[p.b].push(p.sx, p.sy, p.s);
        else if (dg < 0.15) { const f = out3(dg / 0.15); falling.push(mix(p.sx, p.gx, f), mix(p.sy, p.gy, f), p.s, 1 - f); }
      }
      buckets.forEach((arr, bi) => {
        k.fillStyle = PCOL[bi];
        for (let i = 0; i < arr.length; i += 3) k.fillRect(arr[i] - arr[i + 2] / 2, arr[i + 1] - arr[i + 2] / 2, arr[i + 2], arr[i + 2]);
      });
      k.fillStyle = '#E6FFF8';
      for (let i = 0; i < falling.length; i += 4) {
        k.globalAlpha = a * falling[i + 3];
        k.fillRect(falling[i] - falling[i + 2] / 2, falling[i + 1] - falling[i + 2] / 2, falling[i + 2], falling[i + 2]);
      }
      k.globalAlpha = a;
      // 4. 切面：竖起的半透明青色面，底边贴地发光
      const edge = edgeAt(c);
      const base = edge.map(([x, z]) => scr(x, z, hgt(x, z))), topE = edge.map(([x, z]) => scr(x, z, hgt(x, z) + 0.32));
      k.globalAlpha = a * 0.22; k.fillStyle = CUT;
      fillPts(k, base.concat(topE.slice().reverse()));
      k.globalAlpha = a * 0.5; k.strokeStyle = CUT; k.lineWidth = 0.8; strokePts(k, topE);
      k.globalAlpha = a; glowLine(k, base, 1, '#C8FFF4', 1.3);
      // 5. 左上角：地名与回波计数
      const ta = seg(u, 0.2, 0.7);
      // 文字底下垫一层从左上往外淡开的暗色，浅色地面上也读得清
      const hg = k.createLinearGradient(0, 0, 230, 0);
      hg.addColorStop(0, 'rgba(10,10,10,0.55)'); hg.addColorStop(1, 'rgba(10,10,10,0)');
      k.globalAlpha = a * ta; k.fillStyle = hg; k.fillRect(0, 8, 230, 56);
      k.textAlign = 'left'; k.textBaseline = 'alphabetic';
      k.fillStyle = '#F2EEE6'; k.font = `600 11px ${SANS}`; k.fillText('康涅狄格 · 林下旧墙', 14, 22);
      k.fillStyle = 'rgba(232,228,220,0.72)'; k.font = `500 8px ${MONO}`;
      k.fillText('41.89°N  72.20°W  ·  0.74 km²', 14, 35);
      k.fillText(`LIDAR 2016  ·  ${fmt(Math.round(ECHOES * seg(c, C0, C1)))} 回波`, 14, 46);
      k.fillStyle = 'rgba(232,228,220,0.4)'; k.fillText('地形起伏 ×2', 14, 57);
      // 6. 字幕条（4.5–5.0 秒淡入）
      const sa = seg(u, 4.5, 5.0);
      if (sa > 0) {
        k.globalAlpha = a * sa * 0.62; k.fillStyle = '#16171A'; k.fillRect(12, 158, 250, 38);
        k.globalAlpha = a * sa; k.fillStyle = '#F2EEE6'; k.fillRect(18, 163, 1.5, 28);
        k.font = `600 12px ${SANS}`; k.fillText('树下还有墙。', 26, 176);
        k.fillStyle = 'rgba(242,238,230,0.75)'; k.font = `400 8.5px ${SANS}`; k.fillText('Walls under the trees.', 26, 189);
      }
      k.globalAlpha = 1;
    };
  }

  // @element 02
  // 白模投影：暗室里一块高密度的纯白城市体块模型。先在室内灯下出现；灯一关、投影机亮起，高度色阶像水位一样沿立面升上去；
  // 之后换成冬日阳光，长影铺满模型，投影机把最高那栋楼的影子描成蓝色并量出长度。模型本身不动，变的只有光
  {
    const ROOM = '#0B0C0E';
    const OX = 118, OY = 96, KX = 0.45, KZ = 0.42, KY = 0.9;     // 斜二测：z 越大越近、越靠右下；看得到顶面、正面和左面
    const PW = 520, PD = 200, PLINTH = 7;                        // 底板（右侧出画）和底座厚度
    const SC = 1.4;                                              // 1 个模型单位代表 1.4 m，只用于标注
    const SUN = [1.5, -0.8];                                     // 每 1 单位高度的影子在地面上的位移（朝右后方）
    const SUN_LEN = Math.hypot(SUN[0], SUN[1]);
    const riverX = z => 400 - 0.62 * z, RIVER_HW = 15;           // 河道中心线与半宽
    let DX = 0;                                                  // 镜头横移量，每帧由 u 算出
    const P = (x, y, z) => [OX + DX + x + KX * z, OY + KZ * z - KY * y];
    // 体块：按街区行生成，行之间留街道；落在河道里的跳过，少量空地
    const B = [], ROWB = [];
    for (let z = 4, r = 0; z < PD - 12; r++) {
      const z1 = Math.min(PD - 4, z + 16 + Math.floor(rnd(r, 1) * 10));
      ROWB.push([z, z1]);
      for (let x = 4 + rnd(r, 2) * 6, c = 0; x < 470 - KX * z; c++) {
        const id = r * 40 + c, wd = 12 + rnd(id, 3) * 20, xc = x + wd / 2;
        if (Math.abs(xc - riverX((z + z1) / 2)) > RIVER_HW + wd / 2 + 2 && rnd(id, 4) > 0.08) {
          const hh = rnd(id, 5) > 0.93 ? 40 + rnd(id, 6) * 22 : 8 + Math.pow(rnd(id, 7), 2) * 26;
          B.push({ row: r, x0: x, x1: x + wd, z0: z + rnd(id, 8) * 3, z1: z1 - rnd(id, 9) * 3, h: hh });
        }
        x += wd + 3 + (c % 4 === 3 ? 6 : 0);
      }
      z = z1 + 6;
    }
    // 最高的一栋塔楼放在 z≈150 那一行，先清掉和它重叠的体块
    const TR = ROWB.findIndex(([a, b]) => a <= 150 && b >= 150);
    for (let i = B.length - 1; i >= 0; i--) if (B[i].row === TR && B[i].x1 > 154 && B[i].x0 < 180) B.splice(i, 1);
    const TOWER = { row: TR, x0: 158, x1: 176, z0: ROWB[TR][0] + 1, z1: ROWB[TR][1] - 1, h: 104 };
    B.push(TOWER);
    B.sort((a, b) => a.row - b.row || b.x0 - a.x0);              // 远的行先画，同一行从右往左画
    const MAXH = Math.max(...B.map(b => b.h));
    const TOWER_M = Math.round(TOWER.h * SC);
    // 影子 = 底面矩形与它沿阳光方向平移后的凸包
    function hull(pts) {
      pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      const lo = [], up = [];
      for (const p of pts) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
      for (const p of pts.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
      return lo.slice(0, -1).concat(up.slice(0, -1));
    }
    const shadowW = (b, kk) => {
      const fx = [[b.x0, b.z0], [b.x1, b.z0], [b.x1, b.z1], [b.x0, b.z1]], ox = SUN[0] * b.h * kk, oz = SUN[1] * b.h * kk;
      return hull(fx.concat(fx.map(([x, z]) => [x + ox, z + oz])));
    };
    const inPolyW = (pts, x, z) => {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, zi] = pts[i], [xj, zj] = pts[j];
        if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
      }
      return inside;
    };
    // 塔楼影子：从塔楼中心量到影子尖端
    const TA = [(TOWER.x0 + TOWER.x1) / 2, (TOWER.z0 + TOWER.z1) / 2], TLEN = TOWER.h * SUN_LEN;
    const DIR = [SUN[0] / SUN_LEN, SUN[1] / SUN_LEN], PERP = [-DIR[1], DIR[0]];
    const TIP = [TA[0] + DIR[0] * TLEN, TA[1] + DIR[1] * TLEN];
    const TS = shadowW(TOWER, 1);
    const SHADOW_M = Math.round(TLEN * SC);
    const SUN_ALT = (Math.atan(1 / SUN_LEN) * 180 / Math.PI).toFixed(1);
    // 落在塔楼影子里的体块：记下它离塔楼的距离比例，描影时依次染蓝
    B.forEach(b => {
      const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
      b.sh = b === TOWER || !inPolyW(TS, cx, cz) ? -1 : clamp(((cx - TA[0]) * DIR[0] + (cz - TA[1]) * DIR[1]) / TLEN);
    });
    // 颜色：白模在室内灯、关灯（只剩环境光）和阳光下各有一组面明度；投影是加在表面上的光
    const W = [243, 243, 241], AMB = 0.42;         // 关灯后只剩环境光，白模降到约 4 成亮度
    const HOUSE = { top: 1, left: 0.86, front: 0.7 };
    const SUNC = { top: [241, 228, 208], left: [236, 218, 194], front: [172, 165, 158] };   // 阳光从左前方来
    const FAC = { top: 1, left: 0.78, front: 0.6 };                                     // 投影机在前上方，朝向它的面更亮
    const PLATE = { house: [222, 222, 219], sun: [226, 212, 192] };
    const RIVER = { house: [46, 50, 56], sun: [60, 62, 66] };
    const BLUE = [64, 112, 232];                                                        // 塔楼影子里的楼被投影染成的蓝
    const RAMP = [[91, 75, 214], [201, 60, 156], [255, 180, 138]];                      // 紫 → 洋红 → 桃色
    const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
    const ramp = t => (t < 0.5 ? lerp(RAMP[0], RAMP[1], t * 2) : lerp(RAMP[1], RAMP[2], t * 2 - 1));
    const css = c => `rgb(${c.map(v => Math.round(clamp(v, 0, 255))).join(',')})`;
    const lit = (house, sun, hk, sk) => lerp(lerp(house.map(v => v * AMB), house, hk), sun, sk);
    const front = (b, ya, yb) => [P(b.x0, ya, b.z1), P(b.x1, ya, b.z1), P(b.x1, yb, b.z1), P(b.x0, yb, b.z1)];
    const left = (b, ya, yb) => [P(b.x0, ya, b.z0), P(b.x0, ya, b.z1), P(b.x0, yb, b.z1), P(b.x0, yb, b.z0)];
    const top = b => [P(b.x0, b.h, b.z0), P(b.x1, b.h, b.z0), P(b.x1, b.h, b.z1), P(b.x0, b.h, b.z1)];
    const W2S = pts => pts.map(([x, z]) => P(x, 0, z));
    // 标签：从锚点拉一根细线到深色小牌，牌上一行数值、一行说明
    function pin(k, x, y, title, sub, t, dx = 0) {
      if (t <= 0) return;
      const ty = y - 30, tx = x + dx;
      k.save(); k.globalAlpha *= t;
      k.strokeStyle = 'rgba(230,232,236,0.85)'; k.lineWidth = 0.7;
      k.beginPath(); k.moveTo(x, y); k.lineTo(tx, ty + 11); k.stroke();
      k.font = `600 10px ${SANS}`; const w1 = k.measureText(title).width;
      k.font = `500 7px ${MONO}`; const w2 = k.measureText(sub).width;
      const bw = Math.max(w1, w2) + 10;
      k.fillStyle = 'rgba(14,15,18,0.86)'; k.fillRect(tx, ty - 11, bw, 23);
      k.textAlign = 'left'; k.textBaseline = 'alphabetic';
      k.fillStyle = '#F4F4F2'; k.font = `600 10px ${SANS}`; k.fillText(title, tx + 5, ty);
      k.fillStyle = '#AEB3BC'; k.font = `500 7px ${MONO}`; k.fillText(sub, tx + 5, ty + 9);
      k.restore();
    }
    CELLS[1] = (k, w, h, u) => {
      k.fillStyle = ROOM; k.fillRect(0, 0, CW, CH);
      const a = vis(u) * inOut3(seg(u, 0, 0.6));                   // 开头缓入，避免第一帧整块跳出
      if (a <= 0) return;
      k.globalAlpha = a;
      DX = -16 * seg(u, 0, 6.0);                                   // 镜头一直缓慢横移，不停顿
      const hk = 1 - seg(u, 1.2, 1.45);                            // 室内灯 1.2 秒切掉（0.25 秒）
      const fl = u < 1.45 ? 0 : u < 1.5 ? 1 : u < 1.56 ? 0.3 : 1;  // 投影灯启动时闪一下
      const wash = 0.22 * fl * (1 - seg(u, 1.56, 1.9));
      const hA = fl * seg(u, 1.6, 1.75) * (1 - seg(u, 2.9, 3.2));   // 第 1 层：高度
      const L = MAXH * inOut3(seg(u, 1.6, 2.4));                    // 光的水位，2.4 秒升到最高那栋楼顶
      const sk = inOut3(seg(u, 3.0, 3.5));                          // 冬日阳光
      const lenK = mix(0.55, 1, inOut3(seg(u, 3.0, 3.9)));          // 太阳走低，影子拉长
      const tr = inOut3(seg(u, 3.9, 4.6));                          // 第 2 层：描出塔楼影子
      // 底座与底板
      k.fillStyle = '#121316'; fillPts(k, [P(0, 0, 0), P(0, 0, PD), P(0, -PLINTH, PD), P(0, -PLINTH, 0)]);
      k.fillStyle = '#17181B'; fillPts(k, [P(0, 0, PD), P(PW, 0, PD), P(PW, -PLINTH, PD), P(0, -PLINTH, PD)]);
      k.fillStyle = css(lerp(lit(PLATE.house, PLATE.sun, hk, sk), [255, 255, 255], wash * 0.5));
      fillPts(k, [P(0, 0, 0), P(PW, 0, 0), P(PW, 0, PD), P(0, 0, PD)]);
      k.fillStyle = css(lit(RIVER.house, RIVER.sun, hk, sk));
      fillPts(k, [P(riverX(0) - RIVER_HW, 0, 0), P(riverX(0) + RIVER_HW, 0, 0), P(riverX(PD) + RIVER_HW, 0, PD), P(riverX(PD) - RIVER_HW, 0, PD)]);
      // 阳光下的影子（只画在地面上）
      if (sk > 0) {
        k.fillStyle = `rgba(52,46,48,${0.55 * sk})`;
        k.beginPath(); B.forEach(b => tracePts(k, W2S(shadowW(b, lenK)), true)); k.fill();
      }
      // 投影机把塔楼影子描成蓝色：从塔脚往影子尖端推进
      if (tr > 0) {
        const d = tr * TLEN, q = (s, p) => [TA[0] + DIR[0] * s + PERP[0] * p, TA[1] + DIR[1] * s + PERP[1] * p];
        k.save(); k.beginPath(); tracePts(k, W2S([q(-30, -90), q(d, -90), q(d, 90), q(-30, 90)]), true); k.clip();
        k.fillStyle = 'rgba(64,112,232,0.78)'; fillPts(k, W2S(TS));
        k.strokeStyle = 'rgba(160,200,255,0.95)'; k.lineWidth = 1; strokePts(k, W2S(TS), true);
        k.restore();
      }
      // 体块
      for (const b of B) {
        const bt = b.sh >= 0 ? clamp((tr - b.sh) / 0.15) * 0.7 : 0;
        // 室内灯/阳光下的面色，叠上投影机开灯的白闪；在塔楼影子里的楼再朝蓝色混
        const add = f => lerp(lit(W.map(v => v * HOUSE[f]), SUNC[f], hk, sk).map(v => v + 255 * wash * FAC[f]), BLUE.map(v => v * (0.55 + 0.45 * FAC[f])), bt);
        // 高度层是加在表面上的光，按 0.7 的强度叠加，白模底色仍透得出来
        const withRamp = (f, base) => base.map((v, i) => v + ramp(b.h / MAXH)[i] * hA * FAC[f] * 0.7);
        const cl = add('left'), cf = add('front'), ct = add('top');
        k.fillStyle = css(cl); fillPts(k, left(b, 0, b.h));
        k.fillStyle = css(cf); fillPts(k, front(b, 0, b.h));
        const lv = Math.min(L, b.h);
        if (hA > 0 && lv > 0) {
          k.fillStyle = css(withRamp('left', cl)); fillPts(k, left(b, 0, lv));
          k.fillStyle = css(withRamp('front', cf)); fillPts(k, front(b, 0, lv));
        }
        k.fillStyle = css(hA > 0 && L >= b.h ? withRamp('top', ct) : ct); fillPts(k, top(b));
      }
      // 测量线：塔脚到影子尖端，每 50 m 一个刻度
      const ms = seg(u, 4.1, 4.7);
      if (ms > 0) {
        const A = P(TA[0], 0, TA[1]), Z = P(TIP[0], 0, TIP[1]);
        const ex = A[0] + (Z[0] - A[0]) * ms, ey = A[1] + (Z[1] - A[1]) * ms;
        const L2 = Math.hypot(Z[0] - A[0], Z[1] - A[1]), nx = -(Z[1] - A[1]) / L2 * 3, ny = (Z[0] - A[0]) / L2 * 3;
        k.strokeStyle = '#F2D6A8'; k.lineWidth = 1.3;
        k.beginPath(); k.moveTo(A[0], A[1]); k.lineTo(ex, ey);
        for (let m = 50; m < SHADOW_M; m += 50) {
          const f = m / SHADOW_M; if (f > ms) break;
          const tx = A[0] + (Z[0] - A[0]) * f, ty = A[1] + (Z[1] - A[1]) * f;
          k.moveTo(tx - nx, ty - ny); k.lineTo(tx + nx, ty + ny);
        }
        k.stroke();
        k.fillStyle = '#F2D6A8'; k.beginPath(); k.arc(A[0], A[1], 1.8, 0, TAU); k.arc(ex, ey, 1.8, 0, TAU); k.fill();
      }
      // 标签：塔楼高度（第 1 层末尾）、影子长度（第 2 层末尾）
      const TT = P(TA[0], TOWER.h, TA[1]);
      pin(k, TT[0], TT[1], `${TOWER_M} m`, 'TALLEST ROOF', seg(u, 2.4, 2.7) * (1 - seg(u, 2.9, 3.2)), -64);
      const TP = P(TIP[0], 0, TIP[1]);
      pin(k, TP[0], TP[1], `${SHADOW_M} m`, 'WINTER NOON SHADOW', seg(u, 4.6, 4.9), -104);
      // 左侧读数和左上角标识（不随镜头移动）
      k.textAlign = 'left'; k.textBaseline = 'alphabetic';
      k.fillStyle = 'rgba(236,236,232,0.9)'; k.font = `600 9px ${SANS}`; k.fillText('CITY CENTRE · 1:1000 WHITE MODEL', 14, 20);
      k.fillStyle = 'rgba(160,164,170,0.8)'; k.font = `500 7px ${MONO}`; k.fillText(`${B.length} BUILDINGS · OPEN DATA`, 14, 30);
      const r1 = seg(u, 1.7, 1.9) * (1 - seg(u, 2.95, 3.15)), r2 = seg(u, 3.2, 3.4);
      const readout = (t, idx, name, num, label, sub, bar) => {
        if (t <= 0) return;
        k.save(); k.globalAlpha *= t;
        k.fillStyle = 'rgba(160,164,170,0.9)'; k.font = `500 8px ${MONO}`; k.fillText(idx, 14, 74);
        k.fillStyle = '#ECECE8'; k.font = `600 9px ${SANS}`; k.fillText(name, 30, 74);
        k.fillStyle = '#F2D6A8'; k.fillRect(14, 79, 12, 1);
        k.fillStyle = '#F6F6F4'; k.font = `200 30px ${SANS}`; k.fillText(num, 13, 110);
        k.fillStyle = '#ECECE8'; k.font = `600 9px ${SANS}`; k.fillText(label, 14, 124);
        k.fillStyle = 'rgba(160,164,170,0.9)'; k.font = `500 7px ${MONO}`; k.fillText(sub, 14, 134);
        bar(); k.restore();
      };
      readout(r1, '01', 'HEIGHT', `${Math.round(L * SC)} m`, 'ROOF HEIGHT', `LIGHT LEVEL · MAX ${TOWER_M} m`, () => {
        const g = k.createLinearGradient(14, 0, 94, 0);
        g.addColorStop(0, css(RAMP[0])); g.addColorStop(0.5, css(RAMP[1])); g.addColorStop(1, css(RAMP[2]));
        k.fillStyle = g; k.fillRect(14, 141, 80, 3);
      });
      readout(r2, '02', 'WINTER SUN', `${Math.round(tr * SHADOW_M)} m`, 'TOWER SHADOW', `DEC 21 · SUN ${SUN_ALT}°`, () => {
        k.fillStyle = 'rgba(160,164,170,0.5)'; k.fillRect(14, 142, 80, 1);
        k.fillStyle = '#F2D6A8'; k.beginPath(); k.arc(14 + 80 * inOut3(seg(u, 3.0, 3.9)), 142.5, 2.2, 0, TAU); k.fill();
      });
      k.globalAlpha = 1;
    };
  }

  // @element 03
  // 电路板：绿色阻焊板上，铜条先从中间向两边铺开，两束平行走线依次连上铜条，中间宽通道里的青色光流往下淌，
  // 穿过铜条流到右下角；两排各 8 颗 LED 从中间向两边依次点亮，最后浮出中英双行丝印和 J2 接口标注
  {
    const BOARD = '#1D7349', BOARD_D = '#145536', TRACE = '#0E3A25', COPPER_A = '#E0946A', COPPER_B = '#B9683F';
    const SILK = 'rgba(232,240,232,0.62)', CYAN = '#BFF8FF', LED_ON = '#FFF6B8', LED_OFF = '#5F6C3E';
    const BAR = { x0: 70, x1: 470, y0: 116, y1: 126 };
    const CH_L = 252, CH_R = 288;                       // 上方宽通道左右边
    // 两束扇形走线：从通道两侧水平伸出一小段，再斜着落到铜条上沿；N 条，从内到外依次画
    const N = 11, FAN = [];
    for (const side of [-1, 1]) for (let i = 0; i < N; i++) {
      const y = 106 - i * 8, x0 = side < 0 ? CH_L : CH_R, x1 = x0 + side * (8 + i * 0.6);
      FAN.push({ side, i, pts: [[x0, y], [x1, y], [x1 + side * (BAR.y0 - 2 - y) * 1.55, BAR.y0 - 2]] });
    }
    // 两排 LED：左排 G9–G16、右排 G1–G8，各 8 颗；点亮顺序从靠中间的那颗往外
    const LEDS = [];
    for (let i = 0; i < 8; i++) {
      LEDS.push({ x: 92 + i * 15, row: 0, order: 7 - i });      // 左排，最右边（靠中间）先亮
      LEDS.push({ x: 336 + i * 15, row: 1, order: i });         // 右排，最左边先亮
    }
    const LED_Y = 140, BUS_Y = 166;
    // 下方窄通道：从铜条下沿往下，再斜向右下，最后水平出画
    const LOW = [[270, BAR.y1], [270, 172], [292, 194], [CW + 10, 194]];
    // J2 接口与引线（左排母线左端往下到接口）
    const J2 = { x: 16, y: 170 }, J2_LEAD = [[86, BUS_Y], [34, BUS_Y], [34, J2.y]];
    // 右侧一条细边框走线：右排母线右端往右再向上出画
    const EDGE = [[456, BUS_Y], [512, BUS_Y], [512, -4]];
    // 散景光斑：位置固定，透明度随时间缓慢起伏
    const BOKEH = Array.from({ length: 10 }, (_, i) => ({ x: rnd(i, 1) * CW, y: rnd(i, 2) * CH, r: 7 + rnd(i, 3) * 14, ph: rnd(i, 4) * TAU }));
    // 通道里的光流：每条有固定 x、长度和相位，y 随时间往下走，超出通道底部从顶部重新进入
    const STREAKS = Array.from({ length: 16 }, (_, i) => ({ x: CH_L + 6 + rnd(i, 5) * (CH_R - CH_L - 12), len: 8 + rnd(i, 6) * 24, ph: rnd(i, 7), sp: 0.8 + rnd(i, 8) * 0.6 }));
    const roundRect = (k, x, y, w, h, r) => { k.beginPath(); k.moveTo(x + r, y); k.arcTo(x + w, y, x + w, y + h, r); k.arcTo(x + w, y + h, x, y + h, r); k.arcTo(x, y + h, x, y, r); k.arcTo(x, y, x + w, y, r); k.closePath(); };
    CELLS[2] = (k, w, h, u) => {
      // 底板：上亮下暗的渐变 + 细网点
      const bg = k.createLinearGradient(0, 0, 0, CH);
      bg.addColorStop(0, BOARD); bg.addColorStop(1, BOARD_D);
      k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
      k.fillStyle = 'rgba(255,255,255,0.025)';
      for (let y = 3; y < CH; y += 6) for (let x = (y % 12 ? 0 : 3); x < CW; x += 6) k.fillRect(x, y, 1, 1);
      const a = vis(u) * seg(u, 0, 0.3);
      if (a <= 0) return;
      k.globalAlpha = a;
      k.lineCap = 'round'; k.lineJoin = 'round';
      // 1. 上方宽通道（0.2–0.6 秒淡入）：深色描边 + 半透明青灰内芯
      const ch = seg(u, 0.2, 0.6);
      k.globalAlpha = a * ch;
      k.fillStyle = TRACE; k.fillRect(CH_L - 3, -2, CH_R - CH_L + 6, BAR.y0 + 2);
      const cg = k.createLinearGradient(CH_L, 0, CH_R, 0);
      cg.addColorStop(0, '#4E8E8C'); cg.addColorStop(0.5, '#7FB5B4'); cg.addColorStop(1, '#4E8E8C');
      k.fillStyle = cg; k.fillRect(CH_L, -2, CH_R - CH_L, BAR.y0 + 2);
      // 下方窄通道
      k.strokeStyle = TRACE; k.lineWidth = 16; strokePts(k, LOW);
      k.strokeStyle = '#5E9C99'; k.lineWidth = 11; strokePts(k, LOW);
      k.globalAlpha = a;
      // 2. 扇形走线（0.9–2.2 秒，左右两束同时从内往外画）
      const fanT = seg(u, 0.9, 2.2);
      for (const f of FAN) {
        const t = seg(fanT, f.i / N * 0.7, f.i / N * 0.7 + 0.3);
        if (t <= 0) continue;
        k.strokeStyle = TRACE; k.lineWidth = 5; partial(k, f.pts, t);
        k.strokeStyle = '#2C8558'; k.lineWidth = 2.2; partial(k, f.pts, t);
      }
      // 3. 铜条（0.5–1.1 秒从中间往两边铺开）
      const bt = out3(seg(u, 0.5, 1.1));
      if (bt > 0) {
        const cx = (BAR.x0 + BAR.x1) / 2, hw = (BAR.x1 - BAR.x0) / 2 * bt;
        k.fillStyle = TRACE; k.fillRect(cx - hw - 3, BAR.y0 - 3, hw * 2 + 6, BAR.y1 - BAR.y0 + 6);
        const g = k.createLinearGradient(0, BAR.y0, 0, BAR.y1);
        g.addColorStop(0, COPPER_A); g.addColorStop(1, COPPER_B);
        k.fillStyle = g; k.fillRect(cx - hw, BAR.y0, hw * 2, BAR.y1 - BAR.y0);
        k.fillStyle = 'rgba(255,230,200,0.35)'; k.fillRect(cx - hw, BAR.y0, hw * 2, 1.5);
      }
      // 4. 青色光流（2.0 秒起淡入）：宽通道里的竖条往下淌；扇形走线和下方通道上的虚线光点同步流动
      const flow = seg(u, 2.0, 2.6);
      if (flow > 0) {
        k.save(); k.beginPath(); k.rect(CH_L, 0, CH_R - CH_L, BAR.y0); k.clip();
        k.strokeStyle = CYAN; k.lineCap = 'round';
        for (const s of STREAKS) {
          const span = BAR.y0 + s.len, y = ((s.ph + u * s.sp * 0.55) % 1) * span - s.len;
          k.globalAlpha = a * flow * 0.25; k.lineWidth = 4; k.beginPath(); k.moveTo(s.x, y); k.lineTo(s.x, y + s.len); k.stroke();
          k.globalAlpha = a * flow * 0.9; k.lineWidth = 1.4; k.beginPath(); k.moveTo(s.x, y); k.lineTo(s.x, y + s.len); k.stroke();
        }
        k.restore();
        k.save(); k.strokeStyle = CYAN; k.lineWidth = 1.2; k.globalAlpha = a * flow * 0.75;
        k.setLineDash([4, 10]); k.lineDashOffset = -u * 40;
        for (const f of FAN) strokePts(k, f.pts);
        k.lineWidth = 1.3; k.globalAlpha = a * flow * 0.85;
        for (const off of [-3, 0, 3]) { k.setLineDash([5 + (off + 3), 7]); k.lineDashOffset = -u * 70 + off * 5; strokePts(k, LOW.map(([x, y], i) => [x + (i < 2 ? off : off * 0.7), y + (i >= 2 ? off : 0)])); }
        k.restore();
      }
      // 5. LED、母线、J2 在铜条铺好后（1.0–1.5 秒）淡入，2.6–3.8 秒依次点亮
      k.globalAlpha = a * seg(u, 1.0, 1.5);
      LEDS.forEach(L => {
        const on = seg(u, 2.6 + L.order * 0.14, 2.75 + L.order * 0.14);
        const bx = L.x, top = LED_Y;
        // 铜条到 LED 的短引线、LED 到母线的引脚
        k.strokeStyle = TRACE; k.lineWidth = 2.4;
        strokePts(k, [[bx + 10, BAR.y1 + 2], [bx + 5, top]]);
        strokePts(k, [[bx + 5, top + 14], [bx + 5, BUS_Y]]);
        k.fillStyle = mixHex(LED_OFF, LED_ON, on);
        roundRect(k, bx, top, 10, 13, 3); k.fill();
        if (on > 0) { const ga = k.globalAlpha; k.globalAlpha = ga * on * 0.55; glowDot(k, bx + 5, top + 5, 13, 'rgba(255,246,170,0.9)', LED_ON); k.globalAlpha = ga; }
        k.fillStyle = 'rgba(255,255,255,0.7)'; k.fillRect(bx + 2, top + 2, 2, 4);
      });
      // 母线：两排各一条，灯全亮后发光
      const busOn = seg(u, 3.6, 4.0);
      [[86, 206], [330, 456]].forEach(([x0, x1]) => {
        k.strokeStyle = TRACE; k.lineWidth = 6; strokePts(k, [[x0, BUS_Y], [x1, BUS_Y]]);
        k.strokeStyle = mixHex('#3E7F4C', '#F2FFD8', busOn); k.lineWidth = 3; strokePts(k, [[x0, BUS_Y], [x1, BUS_Y]]);
      });
      // LED 行的虚线框
      k.strokeStyle = SILK; k.lineWidth = 0.7; k.setLineDash([2.5, 2]);
      k.strokeRect(86, LED_Y - 3, 122, 20); k.strokeRect(330, LED_Y - 3, 122, 20); k.setLineDash([]);
      // J2 引线与接口、右侧边框走线
      k.strokeStyle = TRACE; k.lineWidth = 3.4; strokePts(k, J2_LEAD); strokePts(k, EDGE);
      k.strokeStyle = mixHex('#2F8E5F', '#F2FFD8', busOn * 0.8); k.lineWidth = 1.4; k.setLineDash([3, 3]); strokePts(k, J2_LEAD); k.setLineDash([]);
      k.strokeStyle = '#2F8E5F'; k.lineWidth = 1.2; strokePts(k, EDGE);
      k.fillStyle = '#10301F'; k.fillRect(J2.x, J2.y, 26, 26);
      k.strokeStyle = SILK; k.lineWidth = 0.8; k.strokeRect(J2.x - 2, J2.y - 2, 30, 30);
      k.fillStyle = '#C9A85A';
      for (const [dx, dy] of [[7, 7], [19, 7], [7, 19], [19, 19]]) { k.beginPath(); k.arc(J2.x + dx, J2.y + dy, 3.6, 0, TAU); k.fill(); }
      k.fillStyle = '#10301F'; for (const [dx, dy] of [[19, 7], [7, 19], [19, 19]]) { k.beginPath(); k.arc(J2.x + dx, J2.y + dy, 1.5, 0, TAU); k.fill(); }
      k.fillRect(J2.x + 5.5, J2.y + 5.5, 3, 3);
      k.globalAlpha = a;
      // 6. 丝印（3.8–4.6 秒）：LED 组号、J2、左上和右上的中英双行字
      const st = seg(u, 3.8, 4.6);
      if (st > 0) {
        k.globalAlpha = a * st; k.fillStyle = SILK; k.textBaseline = 'alphabetic';
        k.font = `500 8px ${SANS}`; k.textAlign = 'center';
        k.fillText('G9–G16', 147, 182); k.fillText('G1–G8', 391, 182); k.fillText('J2', J2.x + 13, 205);
        k.textAlign = 'left'; k.font = `300 17px ${SANS}`; k.fillText('锦屏', 14, 30);
        k.font = `500 7px ${SANS}`; k.fillText('JINPING', 14, 41);
        k.textAlign = 'right'; k.font = `300 17px ${SANS}`; k.fillText('九毫秒', 496, 30);
        k.font = `600 8px ${SANS}`; k.fillText('NINE MILLISECONDS', 496, 42);
        k.globalAlpha = a;
      }
      // 7. 散景光斑
      for (const b of BOKEH) {
        k.globalAlpha = a * (0.05 + 0.04 * Math.sin(u * 1.2 + b.ph));
        glowDot(k, b.x, b.y, b.r, 'rgba(230,255,240,0.9)', 'rgba(0,0,0,0)');
      }
      k.globalAlpha = 1;
    };
  }

  // @element 04
  // 体育战术板：转播机位斜看的透视球场，球员跑动；画面定格后，脚下亮起黄圈和半透明聚光区，
  // 黄色虚线弧箭头从开球点画到头球队员，再接一支箭头指向球门；左上机位标签、名条，右上「定格」角标，右下比分条
  {
    const GRASS_A = '#2F5A26', GRASS_B = '#28501F', LINE = 'rgba(236,240,226,0.78)', YEL = '#FFD21F';
    const KIT_W = '#EEEDE6', KIT_W2 = '#2A2A2A', KIT_D = '#1E2533', KIT_D2 = '#E8C33A';
    // 透视：用 4 点对应求单应矩阵，把地面坐标 (gx, gz) ∈ [0,1]² 映到屏幕上的梯形；
    // gx 朝球门（右）增大，gz 由近（下）到远（上）增大，远端边线在 gz=1。w 越大越远，物体高度按 1/w 缩小
    function homography(src, dst) {
      const A = [], b = [];
      for (let i = 0; i < 4; i++) {
        const [x, y] = src[i], [X, Y] = dst[i];
        A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]); b.push(X);
        A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]); b.push(Y);
      }
      for (let c = 0; c < 8; c++) {
        let q = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[q][c])) q = r;
        [A[c], A[q]] = [A[q], A[c]]; [b[c], b[q]] = [b[q], b[c]];
        for (let r = 0; r < 8; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let j = c; j < 8; j++) A[r][j] -= f * A[c][j]; b[r] -= f * b[c]; }
      }
      return b.map((v, i) => v / A[i][i]);
    }
    const HM = homography([[0, 0], [1, 0], [1, 1], [0, 1]], [[-40, 236], [610, 250], [440, 44], [30, 70]]);
    const proj = (gx, gz, hpx = 0) => {
      const wq = HM[6] * gx + HM[7] * gz + 1;
      return [(HM[0] * gx + HM[1] * gz + HM[2]) / wq, (HM[3] * gx + HM[4] * gz + HM[5]) / wq - hpx / wq, wq];
    };
    const poly = pts => pts.map(([x, z]) => proj(x, z));
    // 地面上的圆（投影后自然变成椭圆）；z 方向按 0.62 压扁，抵消地面坐标两轴长度不同
    const circle = (cx, cz, r, n = 40) => Array.from({ length: n + 1 }, (_, i) => proj(cx + r * Math.cos(i / n * TAU), cz + r * 1.6 * Math.sin(i / n * TAU)));
    // 标线：远端边线 gz=1，球门线 gx=0.95；禁区 gx 0.74–0.95、gz 0.28–0.92；小禁区 gx 0.88–0.95、gz 0.47–0.73
    const FAR = 1, GOAL_X = 0.95;
    const STRIPES = Array.from({ length: 14 }, (_, i) => ({ q: poly([[-0.4 + i * 0.12, -0.4], [-0.28 + i * 0.12, -0.4], [-0.28 + i * 0.12, FAR + 0.06], [-0.4 + i * 0.12, FAR + 0.06]]), c: i % 2 ? GRASS_B : GRASS_A }));
    const LINES = [
      poly([[-0.4, FAR], [GOAL_X, FAR]]), poly([[GOAL_X, FAR], [GOAL_X, -0.4]]),
      poly([[0.74, 0.28], [0.74, 0.92], [GOAL_X, 0.92]]), poly([[0.74, 0.28], [GOAL_X, 0.28]]),
      poly([[0.88, 0.47], [0.88, 0.73], [GOAL_X, 0.73]]), poly([[0.88, 0.47], [GOAL_X, 0.47]]),
      poly(Array.from({ length: 13 }, (_, i) => { const an = -0.9 + i * 0.15; return [0.8 - 0.09 * Math.cos(an) - 0.06, 0.6 + 0.15 * Math.sin(an)]; })),
    ];
    // 远端广告板：沿远端边线外侧立起的一条，分成若干块
    const BOARDS = Array.from({ length: 12 }, (_, i) => {
      const x0 = -0.4 + i * 0.12, x1 = x0 + 0.118;
      return { q: [proj(x0, FAR + 0.05), proj(x1, FAR + 0.05), proj(x1, FAR + 0.05, 10), proj(x0, FAR + 0.05, 10)], c: ['#7A1F1A', '#B5472A', '#2B2F3C'][i % 3] };
    });
    // 球门：两根门柱
    const GP = [[GOAL_X, 0.55], [GOAL_X, 0.65]];
    // 看台人群：广告板以上暗色区域里撒的小点
    const CROWD = Array.from({ length: 1100 }, (_, i) => ({ x: rnd(i, 1) * CW, y: rnd(i, 2), c: ['#5B4A44', '#3C3A40', '#7A5E50', '#2E3138', '#8A3A34'][Math.floor(rnd(i, 3) * 5)] }));
    // 球员 [起点 gx, gz, 终点 gx, gz, 队]；队 0 白衣，队 1 深色；第 0 号为头球队员，第 1 号为开球队员
    const PL = [
      [0.62, 0.5, 0.82, 0.6, 0], [0.25, 0.15, 0.25, 0.15, 0], [0.56, 0.78, 0.78, 0.82, 0], [0.42, 0.34, 0.62, 0.4, 0], [0.4, 0.62, 0.6, 0.7, 0],
      [0.66, 0.56, 0.85, 0.54, 1], [0.6, 0.72, 0.8, 0.76, 1], [0.5, 0.38, 0.7, 0.44, 1], [0.93, 0.6, 0.93, 0.6, 1], [0.38, 0.22, 0.55, 0.26, 1],
    ];
    const tauAt = u => out3(seg(u, 0.3, 1.8));           // 1.8 秒后定格
    const posOf = (p, tau) => [mix(p[0], p[2], tau), mix(p[1], p[3], tau)];
    // 人形剪影：脚底在 (sx, sy)，高 hh 像素；ph 为跑动相位
    function figure(k, sx, sy, hh, kit, ph, still) {
      const sw = still ? 0.35 : Math.sin(ph), s = hh / 26;
      k.fillStyle = 'rgba(0,0,0,0.3)'; k.beginPath(); k.ellipse(sx + 2 * s, sy, 6 * s, 1.8 * s, 0, 0, TAU); k.fill();
      const [c1, c2] = kit ? [KIT_D, KIT_D2] : [KIT_W, KIT_W2];
      k.lineCap = 'round';
      // 腿
      k.strokeStyle = kit ? '#1A1D24' : '#F2F2EE'; k.lineWidth = 2.2 * s;
      k.beginPath(); k.moveTo(sx, sy - 12 * s); k.lineTo(sx + sw * 4 * s, sy); k.moveTo(sx, sy - 12 * s); k.lineTo(sx - sw * 4 * s, sy - 0.5 * s); k.stroke();
      // 短裤
      k.fillStyle = c2; k.fillRect(sx - 3 * s, sy - 14 * s, 6 * s, 4 * s);
      // 上身
      k.fillStyle = c1; k.fillRect(sx - 3.4 * s, sy - 22 * s, 6.8 * s, 8.5 * s);
      if (kit) { k.fillStyle = c2; k.fillRect(sx - 0.8 * s, sy - 22 * s, 1.6 * s, 8.5 * s); }
      // 手臂
      k.strokeStyle = c1; k.lineWidth = 1.8 * s;
      k.beginPath(); k.moveTo(sx - 3 * s, sy - 21 * s); k.lineTo(sx - 5 * s - sw * 2 * s, sy - 15 * s); k.moveTo(sx + 3 * s, sy - 21 * s); k.lineTo(sx + 5 * s + sw * 2 * s, sy - 15 * s); k.stroke();
      // 头
      k.fillStyle = '#C79A7A'; k.beginPath(); k.arc(sx, sy - 24.5 * s, 2.4 * s, 0, TAU); k.fill();
      k.fillStyle = '#2A1E18'; k.beginPath(); k.arc(sx, sy - 25.3 * s, 2.4 * s, Math.PI, TAU); k.fill();
    }
    // 黄色箭头头部
    function head(k, pts, size) {
      const [x2, y2] = pts[pts.length - 1], [x1, y1] = pts[pts.length - 3], an = Math.atan2(y2 - y1, x2 - x1);
      k.fillStyle = YEL; k.beginPath(); k.moveTo(x2 + Math.cos(an) * size * 0.6, y2 + Math.sin(an) * size * 0.6);
      k.lineTo(x2 + Math.cos(an + 2.6) * size, y2 + Math.sin(an + 2.6) * size); k.lineTo(x2 + Math.cos(an - 2.6) * size, y2 + Math.sin(an - 2.6) * size); k.closePath(); k.fill();
    }
    // 标签块：左侧黄条 + 半透明黑底，上行中文、下行英文
    function tag(k, x, y, wd, zh, en, t, big) {
      if (t <= 0) return;
      k.save(); k.globalAlpha *= t; k.translate((1 - out3(t)) * -10, 0);
      k.fillStyle = 'rgba(12,14,16,0.72)'; k.fillRect(x, y, wd, big ? 34 : 28);
      k.fillStyle = YEL; k.fillRect(x, y, 2.5, big ? 34 : 28);
      k.textAlign = 'left'; k.textBaseline = 'alphabetic';
      k.fillStyle = '#F4F4F0'; k.font = `800 ${big ? 15 : 11}px ${SANS}`; k.fillText(zh, x + 8, y + (big ? 18 : 14));
      k.fillStyle = big ? YEL : 'rgba(230,230,224,0.7)'; k.font = `700 ${big ? 7.5 : 6.5}px ${MONO}`; k.fillText(en, x + 8, y + (big ? 28 : 23));
      k.restore();
    }
    // 定格时的位置（不依赖 u），箭头、圈、聚光区都按它算
    const F = PL.map(p => posOf(p, 1));
    const HEAD_G = F[0], KICK_G = F[1];
    const HP = proj(HEAD_G[0], HEAD_G[1]), KP = proj(KICK_G[0], KICK_G[1]);
    // 弧形箭头：屏幕上从开球队员到头球队员的二次曲线，中段抬高
    const ARC = Array.from({ length: 40 }, (_, i) => {
      const t = i / 39, cx = (KP[0] + HP[0]) / 2 - 40, cy = Math.min(KP[1], HP[1]) - 70;
      return [(1 - t) ** 2 * KP[0] + 2 * (1 - t) * t * cx + t * t * HP[0], (1 - t) ** 2 * (KP[1] - 10) + 2 * (1 - t) * t * cy + t * t * (HP[1] - 22)];
    });
    const GOAL_PT = proj(GOAL_X, 0.6, 12);
    const SHOT = Array.from({ length: 12 }, (_, i) => { const t = i / 11; return [mix(HP[0] + 2, GOAL_PT[0] - 4, t), mix(HP[1] - 22, GOAL_PT[1], t) - Math.sin(t * Math.PI) * 4]; });
    const SPOT = circle(HEAD_G[0] - 0.08, HEAD_G[1] + 0.02, 0.2, 60), RING = circle(HEAD_G[0], HEAD_G[1], 0.03), RING2 = circle(HEAD_G[0], HEAD_G[1], 0.043);
    CELLS[3] = (k, w, h, u) => {
      // 看台（暗色）+ 人群小点
      k.fillStyle = '#17181B'; k.fillRect(0, 0, CW, CH);
      for (const c of CROWD) { const yy = c.y * 66; k.fillStyle = c.c; k.fillRect(c.x, yy, 1.6, 1.6); }
      // 草皮条纹、广告板、标线、球门
      for (const s of STRIPES) { k.fillStyle = s.c; fillPts(k, s.q); }
      for (const b of BOARDS) { k.fillStyle = b.c; fillPts(k, b.q); }
      k.strokeStyle = LINE; k.lineWidth = 1.3; for (const l of LINES) strokePts(k, l);
      k.strokeStyle = '#F4F4F0'; k.lineWidth = 1.6;
      const g0 = proj(GP[0][0], GP[0][1]), g1 = proj(GP[1][0], GP[1][1]), g0t = proj(GP[0][0], GP[0][1], 22), g1t = proj(GP[1][0], GP[1][1], 22);
      strokePts(k, [g0, g0t, g1t, g1]);
      k.strokeStyle = 'rgba(240,240,236,0.25)'; k.lineWidth = 0.6;
      for (let i = 1; i < 6; i++) strokePts(k, [[mix(g0t[0], g1t[0], i / 6), mix(g0t[1], g1t[1], i / 6)], [mix(g0[0], g1[0], i / 6) + 6, mix(g0[1], g1[1], i / 6) - 4]]);
      const a = vis(u) * seg(u, 0, 0.3);
      if (a <= 0) return;
      k.globalAlpha = a;
      const tau = tauAt(u), still = u >= 1.8;
      // 半透明聚光区（2.2–2.7 秒）
      const sp = seg(u, 2.2, 2.7);
      if (sp > 0) { k.globalAlpha = a * sp * 0.28; k.fillStyle = '#E6F2B0'; fillPts(k, SPOT); k.globalAlpha = a; }
      // 脚下黄圈（2.6–3.1 秒）：内圈画满，外圈画四段
      const rg = seg(u, 2.6, 3.1);
      if (rg > 0) {
        k.strokeStyle = YEL; k.lineWidth = 2; partial(k, RING, out3(rg));
        k.lineWidth = 1.2; for (let q = 0; q < 4; q++) partial(k, RING2.slice(q * 10, q * 10 + 8), out3(rg));
      }
      // 球员：按纵深从远到近画
      const now = PL.map((p, i) => { const [gx, gz] = posOf(p, tau), pp = proj(gx, gz); return { i, sx: pp[0], sy: pp[1], d: pp[2], kit: p[4] }; }).sort((A, B) => B.d - A.d);
      for (const f of now) figure(k, f.sx, f.sy, 34 / f.d, f.kit, tau * 26 + f.i * 1.7, still || f.i === 1 || f.i === 8);
      // 定格：白闪 + 轻微压暗
      if (still) {
        const fl = 1 - seg(u, 1.8, 1.95);
        k.fillStyle = `rgba(255,255,255,${0.35 * fl})`; k.fillRect(0, 0, CW, CH);
      }
      // 弧形虚线箭头（3.2–4.1 秒）和射门箭头（4.0–4.5 秒）
      const ar = seg(u, 3.2, 4.1), sh = seg(u, 4.0, 4.5);
      k.lineCap = 'round';
      if (ar > 0) {
        k.strokeStyle = 'rgba(60,40,0,0.45)'; k.lineWidth = 4; k.setLineDash([7, 5]); partial(k, ARC, ar);
        k.strokeStyle = YEL; k.lineWidth = 2.4; partial(k, ARC, ar); k.setLineDash([]);
      }
      if (sh > 0) {
        k.strokeStyle = YEL; k.lineWidth = 2.6; partial(k, SHOT, out3(sh));
        if (sh >= 1) head(k, SHOT, 9);
      }
      // 左上机位标签（0.3 秒起）与名条（3.0–3.4 秒）
      tag(k, 12, 10, 104, 'A 主机位', 'MAIN CAMERA', seg(u, 0.3, 0.7), false);
      tag(k, 12, 44, 72, '林远', 'LIN YUAN', seg(u, 3.0, 3.4), false);
      // 名条到球员的细引线
      const nl = seg(u, 3.2, 3.5);
      if (nl > 0) { k.strokeStyle = 'rgba(255,210,31,0.8)'; k.lineWidth = 0.8; partial(k, [[84, 58], [HP[0] - 10, HP[1] - 30]], nl); }
      // 右上「定格」角标（1.9–2.3 秒）
      const fb = seg(u, 1.9, 2.3);
      if (fb > 0) {
        k.save(); k.globalAlpha *= fb; k.translate((1 - backOut(fb)) * 14, 0);
        k.fillStyle = 'rgba(12,14,16,0.78)'; k.fillRect(392, 10, 136, 30);
        k.fillStyle = YEL; k.fillRect(392, 10, 38, 30);
        k.fillStyle = '#121212'; k.font = `900 14px ${SANS}`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('定格', 411, 25.5);
        k.textAlign = 'left'; k.textBaseline = 'alphabetic';
        k.fillStyle = '#F4F4F0'; k.font = `italic 900 10px ${SANS}`; k.fillText('FREEZE FRAME', 436, 23);
        k.fillStyle = YEL; k.font = `700 7px ${SANS}`; k.fillText('战术分析 ANALYSIS', 436, 34);
        k.restore();
      }
      // 右下比分条（4.3–4.8 秒）
      const sb = seg(u, 4.3, 4.8);
      if (sb > 0) {
        k.save(); k.globalAlpha *= sb; k.translate(0, (1 - out3(sb)) * 8);
        k.fillStyle = 'rgba(10,12,14,0.85)'; k.fillRect(392, 172, 136, 24);
        k.fillStyle = YEL; k.fillRect(426, 172, 44, 24);
        k.textBaseline = 'middle'; k.textAlign = 'center';
        k.fillStyle = '#F4F4F0'; k.font = `italic 900 11px ${SANS}`; k.fillText('HAN', 409, 184.5); k.fillText('SEA', 486, 184.5);
        k.fillStyle = '#121212'; k.font = `italic 900 13px ${SANS}`; k.fillText('2 - 1', 448, 184.5);
        k.fillStyle = 'rgba(255,255,255,0.25)'; k.fillRect(503, 177, 0.8, 14);
        k.fillStyle = YEL; k.font = `italic 900 11px ${SANS}`; k.fillText('61′', 516, 184.5);
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
