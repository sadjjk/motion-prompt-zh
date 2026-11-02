/* Motion Prompt · pack "scenes" · MIT License (c) 2026 Yun · https://github.com/skylarzzzz/motion-atlas */
MotionPrompt.pack('scenes', function () {
  // @kit
  // 风格画面（每格 539x208、6.4 秒周期；每格都是只依赖时间 u 的纯函数）
  // 按 Motion Atlas（Yun，MIT）中对应款式的画面、配色与运动，重新构图到卡片尺寸，并从 8 秒一次性片段
  // 改为无缝循环：多数款 0–5.4 秒展示，5.4–6.4 秒复位；周期运动按整数圈设计。随机改为按下标确定性生成。
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
  const CELLS = [];

  // @element 01
  // 01 书法笔触：一笔一笔写出「永」字，飞白由细丝叠成，最后盖朱红印章；停留后淡出复位
  const YONG = [ // 永字八笔：[[起点, 控制点, 终点], 起笔宽, 收笔宽]（坐标为字框 0..1）
    [[[.47, .07], [.505, .12], [.53, .175]], 34, 22], [[[.33, .27], [.47, .265], [.61, .255]], 30, 26],
    [[[.6, .26], [.585, .5], [.57, .86]], 36, 30], [[[.57, .86], [.53, .83], [.48, .79]], 30, 6],
    [[[.22, .47], [.32, .455], [.42, .45]], 26, 24], [[[.42, .45], [.33, .6], [.2, .73]], 28, 6],
    [[[.77, .33], [.71, .4], [.635, .47]], 26, 8], [[[.62, .47], [.74, .63], [.9, .8]], 16, 46]];
  CELLS[0] = (k, w, h, u) => {
    k.fillStyle = '#EDE6D6'; k.fillRect(0, 0, CW, CH); paper(k, [120, 100, 70], 700, 3);
    const ox = 200, oy = 6, S = 196, WS = 0.22;      // 字框 196px（原 900px 按比例缩小），笔宽同比缩放
    const prog = seg(u, 0.2, 4.2) * YONG.length;     // 4 秒写完 8 笔，每笔 0.5 秒
    const fade = fadeIn(u);
    k.save(); k.globalAlpha = fade; k.lineCap = 'round';
    YONG.forEach(([pts, w0, w1], si) => {
      const pr = clamp(prog - si); if (pr <= 0) return;
      const sm = [];
      for (let q = 0; q <= 40; q++) { const t = q / 40, [a, b, c] = pts; sm.push([(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1]]); }
      const n = Math.max(2, Math.floor(sm.length * pr));
      for (let hb = 0; hb < 60; hb++) {                // 60 根细丝叠成笔画（原 220 根）
        const off = (hash(si * 997 + hb) - 0.5) * 2, dry = hash(si * 131 + hb * 7);
        k.strokeStyle = `rgba(14,12,10,${0.25 + 0.55 * hash(si * 53 + hb * 3)})`; k.lineWidth = 0.5 + hash(hb + si) * 0.7;
        k.beginPath(); let pen = false;
        for (let q = 0; q < n; q++) {
          const t = q / 40, press = Math.min(1, t * 6 + 0.35), wd = (w0 + (w1 - w0) * t) * press * 1.25 * WS;
          const [x, y] = sm[q], [x2, y2] = sm[Math.min(40, q + 1)], tx = x2 - x, ty = y2 - y, tl = Math.hypot(tx, ty) || 1;
          const px = ox + x * S - ty / tl * off * wd, py = oy + y * S + tx / tl * off * wd;
          // 飞白：笔画后半段、靠边缘的细丝按确定性噪声断开
          const gap = t > 0.45 && Math.abs(off) > 0.45 && hash(q * 17 + hb * 31 + si) < 0.3 + dry * 0.35;
          if (gap) { pen = false; continue; }
          if (!pen) { k.moveTo(px, py); pen = true; } else k.lineTo(px, py);
        }
        k.stroke();
      }
    });
    // 朱印：4.4 秒盖下（0.3 秒由大到小落定）
    const sa = out3(seg(u, 4.4, 4.7));
    if (sa > 0) {
      k.save(); k.translate(452, 160); k.scale(1 + (1 - sa) * 0.6, 1 + (1 - sa) * 0.6); k.globalAlpha = sa * fade;
      k.fillStyle = '#B5281D'; k.fillRect(-22, -22, 44, 44);
      txt(k, '永', 0, -2, `900 17px ${SERIF}`, '#EDE6D6', 'center', 'middle'); txt(k, '字', 0, 14, `900 17px ${SERIF}`, '#EDE6D6', 'center', 'middle');
      k.restore();
    }
    k.restore();
    grain(k, 0.06, 'multiply');
  };

  // @element 02
  // 02 字之球：《千字文》的字按斐波那契分布贴在旋转的球面上，近处清晰加粗、远处退成淡影
  const QZW = '天地玄黄宇宙洪荒日月盈昃辰宿列张寒来暑往秋收冬藏闰余成岁律吕调阳云腾致雨露结为霜金生丽水玉出昆冈剑号巨阙珠称夜光果珍李柰菜重芥姜海咸河淡鳞潜羽翔';
  CELLS[1] = (k, w, h, u) => {
    k.fillStyle = '#F2EEE6'; k.fillRect(0, 0, CW, CH);
    const cx = 269.5, cy = 104, R = 84, N = 160;      // 球半径 84px、160 个字（原 400px、420 个）
    const a1 = TAU * u / CYC, a2 = 0.35;              // 每周期自转一圈，俯角 0.35 rad
    const items = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i + 0.5) / N * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996;
      let x = Math.cos(th) * r, z = Math.sin(th) * r;
      [x, z] = [x * Math.cos(a1) - z * Math.sin(a1), x * Math.sin(a1) + z * Math.cos(a1)];
      const yy = y * Math.cos(a2) - z * Math.sin(a2); z = y * Math.sin(a2) + z * Math.cos(a2);
      items.push([x, yy, z, QZW[i % QZW.length]]);
    }
    items.sort((a, b) => a[2] - b[2]);
    for (const [x, y, z, ch] of items) {
      const persp = 2.4 / (2.4 - z), sz = 11 * persp;
      const col = z > 0.9 ? '#C8231B' : z > 0 ? `rgba(20,20,20,${0.35 + 0.65 * z})` : `rgba(20,20,20,${0.08 + 0.1 * (1 + z)})`;
      txt(k, ch, cx + x * R * persp, cy - y * R * persp, `${z > 0 ? 900 : 400} ${sz.toFixed(1)}px ${SERIF}`, col, 'center', 'middle');
    }
    grain(k, 0.05, 'multiply');
  };

  // @element 03
  // 03 机场翻牌：每格字母快速翻过字母表，再错峰停在航班、时刻与状态上；停留后翻回空白
  const AL = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const FLIGHTS = [['0815', 'TOKYO', 'A12', 'BOARDING'], ['0840', 'PARIS', 'B03', 'ON TIME'], ['0905', 'LISBON', 'A07', 'DELAYED']];
  CELLS[2] = (k, w, h, u) => {
    k.fillStyle = '#121214'; k.fillRect(0, 0, CW, CH);
    const cw = 13, chh = 22, gap = 2, cols = [4, 9, 3, 8], colX = [0, 4, 13, 16], cg = 9; // 每格 13×22px
    const x0 = 34, y0 = 58;
    txt(k, 'DEPARTURES', x0, 30, `700 12px ${MONO}`, '#E8B23A');
    ['TIME', 'DESTINATION', 'GATE', 'REMARKS'].forEach((t, i) => txt(k, t, x0 + colX[i] * (cw + gap) + i * cg, 49, `600 8px ${MONO}`, '#8C8670'));
    const back = u >= SHOW;
    FLIGHTS.forEach((row, ri) => row.forEach((s, ci) => {
      for (let q = 0; q < cols[ci]; q++) {
        const ch = s[q] || ' ', target = AL.indexOf(ch);
        const x = x0 + (colX[ci] + q) * (cw + gap) + ci * cg, y = y0 + ri * (chh + 10);
        const st = 0.3 + ri * 0.18 + ci * 0.1 + q * 0.04;  // 错峰开始：每行 0.18 秒、每列 0.1 秒、每格 0.04 秒
        let prog = clamp((u - st) / 1.6), idx;            // 每格翻 1.6 秒后停在目标字符
        if (back) { const bp = clamp((u - SHOW - (2 - ri) * 0.08 - q * 0.02) / 0.5); prog = 1 - bp; idx = bp >= 1 ? 0 : Math.floor((1 - bp) * target); }
        else idx = prog >= 1 ? target : Math.floor(prog * (target + AL.length)) % AL.length;
        k.fillStyle = '#1F1F23'; rr(k, x, y, cw, chh, 2); k.fill();
        k.fillStyle = 'rgba(255,255,255,.04)'; k.fillRect(x, y, cw, chh / 2);
        const red = ci === 3 && s === 'DELAYED', green = ci === 3 && s === 'BOARDING';
        txt(k, AL[idx] || ' ', x + cw / 2, y + chh / 2 + 1, `700 13px ${MONO}`, red ? '#FF5A3C' : green ? '#7CE38B' : '#F4F1E8', 'center', 'middle');
        if (prog > 0 && prog < 1) { // 翻动中：上半片按每秒 14 次的节奏翻下
          const ph = (u * 14 + q) % 1, hh = chh / 2 * Math.abs(Math.cos(ph * Math.PI));
          k.fillStyle = 'rgba(30,30,34,.92)'; k.fillRect(x, y + chh / 2 - hh, cw, hh);
        }
        k.fillStyle = '#0B0B0D'; k.fillRect(x, y + chh / 2 - 0.5, cw, 1);
      }
    }));
    const v = k.createLinearGradient(0, 0, 0, CH); v.addColorStop(0, 'rgba(255,220,160,.06)'); v.addColorStop(1, 'rgba(0,0,0,.25)');
    k.fillStyle = v; k.fillRect(0, 0, CW, CH);
    grain(k, 0.05);
  };

  // @element 04
  // 04 文字海浪：字母铺成的海面随两组正弦波起伏，浪尖变白加粗、浪谷沉进深蓝
  const WORD = 'MOTIONPROMPTWAVE';
  CELLS[3] = (k, w, h, u) => {
    k.fillStyle = '#071226'; k.fillRect(0, 0, CW, CH);
    const ph = TAU * u / CYC;                         // 两组波每周期各推进整数圈
    const items = [];
    for (let j = 0; j < 11; j++) for (let i = -15; i <= 15; i++) {   // 11 排 × 31 列字母（原 40 × 81）
      const x = i * 0.3 + (j % 2) * 0.15, z = j * 0.38 + 0.6;
      const y = 0.45 * Math.sin(x * 0.7 + z * 0.5 - ph * 2) + 0.25 * Math.sin(x * 1.6 - z * 0.8 + ph);
      // 透视：远处收向上方的地平线（y≈18），最近一排落在画面底部；海面高度 y 让字母上下起伏
      const d = z + 1.2, sx = 269.5 + x * 150 / d, sy = 18 + 230 / d - y * 34 / d;
      if (sx < -10 || sx > CW + 10 || sy > CH + 20) continue;
      items.push([sx, sy, d, y, WORD[(i + 15 + j * 3) % WORD.length]]);
    }
    items.sort((a, b) => b[2] - a[2]);
    for (const [sx, sy, d, y, ch] of items) {
      const sz = 30 / d, kk = clamp((y + 0.7) / 1.4);
      const c = lerpC([30, 70, 160], [235, 245, 255], Math.pow(kk, 1.6));
      txt(k, ch, sx, sy, `${kk > 0.75 ? 900 : 600} ${sz.toFixed(1)}px ${DISP}`, rgba(c, Math.min(1, 2.4 / d)), 'center', 'middle');
    }
    grain(k, 0.05);
  };

  // @element 05
  // 05 竖排诗笺：朱丝栏笺纸上，王维《山居秋暝》从右往左逐字浮现，墨色有浓有淡，最后钤一方朱印
  const POEM = ['山居秋暝', '空山新雨後', '天氣晚來秋', '明月松間照', '清泉石上流', '竹喧歸浣女', '蓮動下漁舟', '隨意春芳歇', '王孫自可留'];
  CELLS[4] = (k, w, h, u) => {
    k.fillStyle = '#E2D7C1'; k.fillRect(0, 0, CW, CH); paper(k, [150, 120, 80], 600, 5);
    const colW = 40, ch = 30, x0 = 440, y0 = 30, cols = POEM.length;   // 每列 40px、每字 30px
    const fade = fadeIn(u);
    // 朱丝栏常驻；淡出复位只作用于墨字与印章，使周期首尾画面一致
    k.strokeStyle = 'rgba(190,60,40,.55)'; k.lineWidth = 1;
    const left = x0 - colW * (cols - 1) - colW / 2, top = y0 - 14, bh = ch * 5 + 16;
    k.strokeRect(left, top, colW * cols, bh);
    for (let i = 1; i < cols; i++) { const x = left + i * colW; k.beginPath(); k.moveTo(x, top); k.lineTo(x, top + bh); k.stroke(); }
    k.save(); k.globalAlpha = fade;
    const speed = 9.5; let n = 0;                     // 每秒写 9.5 个字，44 个字约 4.6 秒写完
    POEM.forEach((ln, ci) => {
      const x = x0 - ci * colW;
      [...ln].forEach((c, q) => {
        const t = (u - 0.2) * speed - n; n++;
        if (t <= 0) return;
        const a = clamp(t / 1.5), ink = 0.78 + 0.22 * Math.sin(n * 2.1);   // 墨色深浅按字序起伏
        txt(k, c, x, y0 + q * ch + 10 + (ci === 0 ? 6 : 0), `${ci === 0 ? 900 : 700} ${ci === 0 ? 21 : 23}px ${SERIF}`, `rgba(20,16,12,${a * ink})`, 'center', 'middle');
      });
    });
    const sk = clamp((u - 0.2) * speed - n - 1);      // 写完 1 个字的时间后钤印
    if (sk > 0) {
      k.save(); k.translate(left - 2, top + bh + 2); k.translate(-20, -20); k.rotate(-0.04); k.globalAlpha = sk * fade;
      k.fillStyle = '#B3261E'; k.fillRect(-15, -15, 30, 30);
      txt(k, '摩詰', 0, 1, `900 11px ${SERIF}`, '#F1E4CC', 'center', 'middle');
      k.restore();
    }
    k.restore();
    grain(k, 0.07, 'multiply');
  };

  // @element 06
  // 06 故障艺术：海报「SIGNAL LOST」在信号干扰下 RGB 通道错开，横向切片忽左忽右地跳，压着扫描线
  const GL = (() => { // 海报底稿（常量）：只画一次，绘制时按通道着色并错位
    const c = document.createElement('canvas'); c.width = CW; c.height = CH; const g = c.getContext('2d');
    g.fillStyle = '#0B0B0E'; g.fillRect(0, 0, CW, CH);
    g.fillStyle = '#FF3B5C'; g.fillRect(170, 34, 36, 4);
    font(g, '900', 64, DISP); g.fillStyle = '#F2F0EA'; g.textBaseline = 'alphabetic'; g.fillText('SIGNAL', 168, 104); g.fillText('LOST', 168, 164);
    font(g, '500', 9, MONO); g.fillStyle = '#FF3B5C'; g.fillText('ERR 0x5A · CH 07 · NO CARRIER', 171, 184);
    const ch = col => { const t = document.createElement('canvas'); t.width = CW; t.height = CH; const tc = t.getContext('2d'); tc.drawImage(c, 0, 0); tc.globalCompositeOperation = 'multiply'; tc.fillStyle = col; tc.fillRect(0, 0, CW, CH); return t; };
    return { r: ch('#FF0000'), g: ch('#00FF00'), b: ch('#0000FF') };
  })();
  const TMP = (() => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return c; })();
  CELLS[5] = (k, w, h, u) => {
    // 干扰每秒跳 10 次（每 0.1 秒一帧图案），一周期 64 帧；最后一帧沿用第 0 帧的图案，循环无缝
    const f0 = Math.floor(u * 10), fr = f0 >= 63 ? 0 : f0;
    const sh = 3 + 6 * Math.abs(Math.sin(TAU * u / CYC * 3));   // 通道错开 3–9px，每周期起伏 3 次
    // 先在离屏画布上按通道叠加，再整体贴到卡片并按切片错位（不读回卡片画布）
    const t = TMP.getContext('2d');
    t.globalCompositeOperation = 'source-over'; t.fillStyle = '#0B0B0E'; t.fillRect(0, 0, CW, CH);
    t.globalCompositeOperation = 'lighter'; t.drawImage(GL.r, -sh, 0); t.drawImage(GL.g, 0, 0); t.drawImage(GL.b, sh, 0);
    t.globalCompositeOperation = 'source-over';
    k.drawImage(TMP, 0, 0);
    for (let i = 0; i < 7; i++) {
      const y = hash(fr * 31 + i) * CH, hh = 2 + hash(fr * 17 + i * 5) * 18, dx = (hash(fr * 13 + i * 7) - 0.5) * 64;
      k.drawImage(TMP, 0, y, CW, hh, dx, y, CW, hh);
    }
    for (let i = 0; i < 5; i++) {
      k.fillStyle = hash(fr * 7 + i) > 0.5 ? 'rgba(255,59,92,.8)' : 'rgba(80,240,220,.8)';
      k.fillRect(160 + hash(fr * 11 + i * 3) * 340, hash(fr * 19 + i * 2) * CH, 6 + hash(fr + i * 9) * 46, 1.5 + hash(fr * 5 + i) * 4);
    }
    k.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < CH; y += 3) k.fillRect(0, y, CW, 1);
    grain(k, 0.12);
  };

  // @element 07
  // 07 LED 点阵屏：车站信息屏式的琥珀色点阵，文字从右向左滚过，亮灯带微光，屏幕斜向透视冲出画面
  const LED_MSG = '  NEXT TRAIN  ·  PLATFORM 07  ·  ON TIME  ·  ';
  // 5×7 字模（每字 7 行、每行 5 位），覆盖上面消息用到的字符
  const GLYPH = {
    ' ': [0, 0, 0, 0, 0, 0, 0], '·': [0, 0, 0, 4, 0, 0, 0],
    N: [17, 25, 21, 19, 17, 17, 17], E: [31, 16, 16, 30, 16, 16, 31], X: [17, 17, 10, 4, 10, 17, 17], T: [31, 4, 4, 4, 4, 4, 4],
    R: [30, 17, 17, 30, 20, 18, 17], A: [14, 17, 17, 31, 17, 17, 17], I: [14, 4, 4, 4, 4, 4, 14], P: [30, 17, 17, 30, 16, 16, 16],
    L: [16, 16, 16, 16, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16], O: [14, 17, 17, 17, 17, 17, 14], M: [17, 27, 21, 21, 17, 17, 17],
    '0': [14, 17, 19, 21, 25, 17, 14], '7': [31, 1, 2, 4, 8, 8, 8],
  };
  const LED_BITS = (() => { // 整条消息的点阵：每字 5 列 + 1 列间隔
    const cols = []; for (const ch of LED_MSG) { const gph = GLYPH[ch] || GLYPH[' ']; for (let x = 0; x < 6; x++) cols.push(gph.map(r => x < 5 && (r >> (4 - x)) & 1)); }
    return cols;
  })();
  CELLS[6] = (k, w, h, u) => {
    k.fillStyle = '#0A0806'; k.fillRect(0, 0, CW, CH);
    const COLS = 64, ROWS = 7, N = LED_BITS.length;
    // 每周期正好滚过整条消息（N 列）；取 N 的整数倍时刻，u→CYC 时回到第 0 列，首尾无缝
    const off = Math.floor(u / CYC * N) % N;
    // 透视：左侧远、右侧近，点距与点径随列号增大
    for (let i = 0; i < COLS; i++) {
      const t = i / (COLS - 1), sc = 0.55 + 0.75 * t;   // 远端 0.55 倍、近端 1.3 倍
      const x = 30 + (Math.pow(t, 1.25)) * 480, rr = 2.2 * sc, pitch = 7.2 * sc, y0 = 104 - pitch * 3 - (1 - t) * 6;
      const colBits = LED_BITS[(i + off) % N];
      for (let j = 0; j < ROWS; j++) {
        const y = y0 + j * pitch;
        if (colBits[j]) { glow(k, x, y, rr * 2.6, '255,150,30', 0.5); k.fillStyle = '#FFE3A0'; }
        else k.fillStyle = '#2A1C10';
        k.beginPath(); k.arc(x, y, rr, 0, TAU); k.fill();
      }
    }
    grain(k, 0.06);
  };

  // @element 08
  // 08 科幻仪表：同心刻度环以不同速度转动，中心读数与侧边数据跳动，青色线条叠在深蓝上
  CELLS[7] = (k, w, h, u) => {
    k.fillStyle = '#04101C'; k.fillRect(0, 0, CW, CH);
    const cx = 200, cy = 104, S = 0.2, ph = TAU * u / CYC;   // 环半径按 0.2 倍缩放；转速取每周期整数圈
    const c = a => `rgba(90,220,255,${a})`;
    k.save(); k.globalCompositeOperation = 'lighter';
    const ring = (R, wd, n, turns, gap, a) => {
      k.strokeStyle = c(a); k.lineWidth = wd;
      for (let i = 0; i < n; i++) { const a0 = i / n * TAU + ph * turns; k.beginPath(); k.arc(cx, cy, R * S, a0, a0 + TAU / n * (1 - gap)); k.stroke(); }
    };
    ring(420, 1, 1, 0, 0, 0.25); ring(400, 3, 36, 1, 0.5, 0.5); ring(360, 1, 3, -1, 0.2, 0.8); ring(320, 6, 60, 0.5, 0.7, 0.35);
    ring(270, 1.2, 8, 2, 0.3, 0.7); ring(220, 1, 1, 0, 0, 0.5); ring(200, 4, 4, -2, 0.6, 0.6); ring(140, 1, 12, 3, 0.5, 0.9);
    for (let i = 0; i < 120; i++) { const a = i / 120 * TAU, L = i % 10 === 0 ? 6 : 2.5; k.strokeStyle = c(0.5); k.lineWidth = 0.6; k.beginPath(); k.moveTo(cx + Math.cos(a) * 88, cy + Math.sin(a) * 88); k.lineTo(cx + Math.cos(a) * (88 + L), cy + Math.sin(a) * (88 + L)); k.stroke(); }
    const sweep = ph * 2, g = k.createConicGradient(sweep, cx, cy);   // 扫描扇区每周期 2 圈
    g.addColorStop(0, 'rgba(90,220,255,.35)'); g.addColorStop(0.12, 'rgba(90,220,255,0)'); g.addColorStop(1, 'rgba(90,220,255,0)');
    k.fillStyle = g; k.beginPath(); k.arc(cx, cy, 60, 0, TAU); k.fill();
    k.restore();
    txt(k, String(Math.floor(87 + 12 * Math.sin(ph))).padStart(2, '0'), cx, cy + 8, `200 28px ${DISP}`, '#C9F4FF', 'center');
    txt(k, 'SYNC %', cx, cy + 22, `500 7px ${MONO}`, '#C9F4FF', 'center');
    for (let q = 0; q < 6; q++) txt(k, `CH-${q + 1}  ${(Math.sin(ph * 2 + q) * 50 + 50).toFixed(2).padStart(6, '0')}`, 340, 58 + q * 18, `500 10px ${MONO}`, 'rgba(160,235,255,.8)');
    grain(k, 0.05);
  };

  // @element 09
  // 09 雷达扫描：深绿雷达屏上扫描线转动，扫过的海岸线与目标点亮起再慢慢暗下去
  const RADAR_PTS = (() => { // 海岸线点阵（常量）：按值噪声阈值取点
    const out = [], R = 92;
    for (let y = -R; y < R; y += 3) for (let x = -R; x < R; x += 3) { if (x * x + y * y > R * R) continue; if (fbm2((x + 200) / 56, (y + 70) / 56, 4) < 0.56) continue; out.push([x, y, Math.atan2(y, x)]); }
    return out;
  })();
  const RADAR_TGT = Array.from({ length: 7 }, (_, i) => { const a = hash(i * 7 + 1) * TAU, d = 18 + hash(i * 7 + 2) * 70; return [Math.cos(a) * d, Math.sin(a) * d, a]; });
  CELLS[8] = (k, w, h, u) => {
    k.fillStyle = '#030805'; k.fillRect(0, 0, CW, CH);
    const cx = 269.5, cy = 104, R = 92, ang = TAU * u / CYC * 2;   // 扫描线每周期 2 圈
    const fall = a => { const d = ((ang - a) % TAU + TAU * 2) % TAU; return d; };
    k.save(); k.beginPath(); k.arc(cx, cy, R, 0, TAU); k.clip(); k.fillStyle = '#061810'; k.fillRect(0, 0, CW, CH);
    for (const [x, y, a] of RADAR_PTS) { const b = Math.exp(-fall(a) * 1.1); k.fillStyle = `rgba(90,255,150,${0.08 + 0.6 * b})`; k.fillRect(cx + x, cy + y, 2.2, 2.2); }
    for (const [x, y, a] of RADAR_TGT) { const b = Math.exp(-fall(a) * 0.8); glow(k, cx + x, cy + y, 8, '140,255,180', b * 0.9); k.fillStyle = `rgba(200,255,220,${0.2 + b})`; k.fillRect(cx + x - 1.5, cy + y - 1.5, 3, 3); }
    k.globalCompositeOperation = 'lighter';
    for (let q = 0; q < 40; q++) { const a0 = ang - q * 0.018; k.fillStyle = `rgba(60,255,130,${0.25 * Math.pow(1 - q / 40, 2)})`; k.beginPath(); k.moveTo(cx, cy); k.arc(cx, cy, R, a0 - 0.018, a0); k.closePath(); k.fill(); }
    k.restore();
    k.strokeStyle = 'rgba(100,230,150,.4)'; k.lineWidth = 0.8;
    for (let i = 1; i <= 4; i++) { k.beginPath(); k.arc(cx, cy, R * i / 4, 0, TAU); k.stroke(); }
    for (let i = 0; i < 360; i += 10) { const a = i / 180 * Math.PI, l = i % 30 ? 3 : 6; k.beginPath(); k.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); k.lineTo(cx + Math.cos(a) * (R + l), cy + Math.sin(a) * (R + l)); k.stroke(); }
    for (let i = 0; i < 360; i += 90) { const a = (i - 90) / 180 * Math.PI; txt(k, String(i).padStart(3, '0'), cx + Math.cos(a) * (R + 14), cy + Math.sin(a) * (R + 14), `500 7px ${MONO}`, 'rgba(120,240,160,.7)', 'center', 'middle'); }
    grain(k, 0.06);
  };

  // @element 10
  // 10 全球航线：点阵地图斜铺在桌面上，航线从枢纽弹射成弧线，光点沿弧线飞向另一端
  const HUBS = [[-2.2, 0.5], [0.4, -0.6], [2.1, 2.2], [3.6, 0.1], [-0.8, 3.1], [1.6, -1.6], [-3.2, -1.4], [4, 3.4]];
  const ROUTES = (() => { const out = []; for (let i = 0; i < 22 && out.length < 14; i++) { const a = HUBS[Math.floor(hash(i * 5 + 1) * HUBS.length)], b = HUBS[Math.floor(hash(i * 5 + 2) * HUBS.length)]; if (a !== b) out.push([a, b, hash(i * 5 + 3)]); } return out; })();
  // 斜俯视投影：地面 (x, 0, z) 与弧高 y → 画面坐标
  // 斜俯视投影：地面 (x, 0, z) 与弧高 y → 画面坐标。z 从 -2.5（近，画面底部）到 4.5（远，画面上方）
  const FP = (x, y, z) => { const d = z + 4.5, s = 230 / d; return [269.5 + (x - 0.6) * s, 4 + 400 / d - y * s * 0.9, d]; };
  CELLS[9] = (k, w, h, u) => {
    k.drawImage(layer('flights', g => {
      g.fillStyle = '#060912'; g.fillRect(0, 0, CW, CH);
      for (let gz = -2.5; gz <= 4.5; gz += 0.14) for (let gx = -5.5; gx <= 6.5; gx += 0.14) {
        if (fbm2(gx * 0.45 + 4, gz * 0.45 + 1, 4) < 0.5) continue;
        const [sx, sy, d] = FP(gx, 0, gz); g.fillStyle = `rgba(120,150,210,${Math.min(0.8, 6 / d)})`; const r = Math.max(0.8, 6 / d); g.fillRect(sx - r / 2, sy - r / 2, r, r);
      }
    }), 0, 0);
    const fade = fadeIn(u);
    k.save(); k.globalCompositeOperation = 'lighter'; k.globalAlpha = fade;
    for (const [a, b, kk] of ROUTES) {
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const arc = s => FP(a[0] + (b[0] - a[0]) * s, Math.sin(s * Math.PI) * d * 0.28, a[1] + (b[1] - a[1]) * s);
      const grow = clamp((u - kk * 2) / 1.2); if (grow <= 0) continue;   // 各航线在 0–2 秒内依次出现，1.2 秒画完
      k.strokeStyle = 'rgba(255,170,90,.45)'; k.lineWidth = 0.9; k.beginPath();
      for (let i = 0; i <= 40 * grow; i++) { const [sx, sy] = arc(i / 40); if (i) k.lineTo(sx, sy); else k.moveTo(sx, sy); }
      k.stroke();
      if (grow >= 1) { const [sx, sy] = arc((u * 0.35 + kk) % 1); glow(k, sx, sy, 5, '255,210,150', 0.9); }
    }
    k.restore();
    for (const hb of HUBS) { const [sx, sy] = FP(hb[0], 0, hb[1]); glow(k, sx, sy, 9, '120,200,255', 0.5); k.fillStyle = '#DDEBFF'; k.beginPath(); k.arc(sx, sy, 1.6, 0, TAU); k.fill(); }
    grain(k, 0.05);
  };

  // @element 11
  // 11 行情 K 线：K 线从左往右逐根长出，红涨绿跌，均线顺着走势弯过去，下方成交量柱跟着起伏
  const KDATA = (() => { const N = 48, out = []; let p = 100; for (let i = 0; i < N; i++) { const o = p, c = o + (hash(i * 4 + 1) - 0.47) * 6 + Math.sin(i * 0.15) * 1.5; out.push([o, c, Math.max(o, c) + hash(i * 4 + 2) * 3, Math.min(o, c) - hash(i * 4 + 3) * 3, 30 + hash(i * 4 + 4) * 70 + Math.abs(c - o) * 12]); p = c; } return out; })();
  CELLS[10] = (k, w, h, u) => {
    k.fillStyle = '#0B0F1A'; k.fillRect(0, 0, CW, CH);
    const x0 = 40, x1 = 470, y0 = 20, y1 = 140, N = KDATA.length;
    k.strokeStyle = 'rgba(140,160,200,.1)'; k.lineWidth = 1;
    for (let i = 0; i <= 6; i++) { const y = y0 + (y1 - y0) * i / 6; k.beginPath(); k.moveTo(x0, y); k.lineTo(x1, y); k.stroke(); }
    const mn = Math.min(...KDATA.map(d => d[3])), mx = Math.max(...KDATA.map(d => d[2]));
    const Y = v => y1 - (v - mn) / (mx - mn) * (y1 - y0), cw = (x1 - x0) / N;
    const shown = Math.min(N, seg(u, 0.2, 4.6) * N + (u > 0.2 ? 0.001 : 0));   // 4.4 秒长满 48 根
    const fade = fadeIn(u);
    k.save(); k.globalAlpha = fade;
    for (let i = 0; i < shown; i++) {
      const [o, c, hi, lo, vol] = KDATA[i], up = c >= o, col = up ? '#F0443A' : '#22B573', x = x0 + i * cw + cw / 2, kk = clamp(shown - i);
      k.strokeStyle = col; k.lineWidth = 0.8; k.beginPath(); k.moveTo(x, Y(hi)); k.lineTo(x, Y(lo)); k.stroke();
      const yt = Y(Math.max(o, c)), yb = Y(Math.min(o, c)); k.fillStyle = col; k.fillRect(x - cw * 0.35, yb - (yb - yt) * kk, cw * 0.7, Math.max(1, (yb - yt) * kk));
      k.globalAlpha = 0.5 * fade; k.fillRect(x - cw * 0.35, 196 - vol * 0.42 * kk, cw * 0.7, vol * 0.42 * kk); k.globalAlpha = fade;
    }
    const ma = (n, c) => { k.strokeStyle = c; k.lineWidth = 1.2; k.beginPath(); for (let i = n; i < shown; i++) { let s = 0; for (let j = 0; j < n; j++) s += KDATA[i - j][1]; const x = x0 + i * cw + cw / 2, y = Y(s / n); if (i === n) k.moveTo(x, y); else k.lineTo(x, y); } k.stroke(); };
    ma(5, '#F5C14B'); ma(20, '#7FA8FF');
    if (shown >= 1) {
      const last = KDATA[Math.max(0, Math.floor(shown) - 1)];
      k.setLineDash([3, 3]); k.strokeStyle = 'rgba(240,68,58,.6)'; k.beginPath(); k.moveTo(x0, Y(last[1])); k.lineTo(x1, Y(last[1])); k.stroke(); k.setLineDash([]);
      k.fillStyle = '#F0443A'; k.fillRect(x1 + 4, Y(last[1]) - 7, 46, 14); txt(k, last[1].toFixed(2), x1 + 8, Y(last[1]) + 3, `700 9px ${MONO}`, '#fff');
    }
    k.restore();
    txt(k, 'MA5', x0, 14, `500 8px ${MONO}`, '#F5C14B'); txt(k, 'MA20', x0 + 28, 14, `500 8px ${MONO}`, '#7FA8FF');
    grain(k, 0.05);
  };

  // @element 12
  // 12 神经网络：多层网络的连接图，信号光点沿权重线从左往右传递，节点随激活明暗起伏
  const NN_LAYERS = [4, 7, 9, 9, 7, 3];
  const NN = NN_LAYERS.map((n, li) => Array.from({ length: n }, (_, i) => [90 + li * 72, 98 + (i - (n - 1) / 2) * 19]));
  const NN_W = []; // 每条连线的权重（常量）
  NN.forEach((L, l) => { if (l < NN.length - 1) L.forEach((a, ai) => NN[l + 1].forEach((b, bi) => NN_W.push([l, a, b, hash(l * 1000 + ai * 37 + bi)]))); });
  CELLS[11] = (k, w, h, u) => {
    const bg = k.createRadialGradient(269.5, 104, 0, 269.5, 104, 300); bg.addColorStop(0, '#0E1230'); bg.addColorStop(1, '#04050B'); k.fillStyle = bg; k.fillRect(0, 0, CW, CH);
    const ph = u / CYC;                                // 信号每周期传递 3 轮（原作周期 2.2/0.8≈2.75 秒）
    k.save(); k.globalCompositeOperation = 'lighter';
    for (const [l, a, b, wt] of NN_W) {
      const hot = wt > 0.62;
      k.strokeStyle = hot ? `rgba(120,160,255,${0.12 + wt * 0.2})` : 'rgba(90,120,220,.06)'; k.lineWidth = hot ? 0.8 : 0.5;
      k.beginPath(); k.moveTo(a[0], a[1]); k.lineTo(b[0], b[1]); k.stroke();
      const p = ((ph * 3 - l * 0.12 + wt) % 1 + 1) % 1 * 2.2;
      if (hot && p < 1) { const x = a[0] + (b[0] - a[0]) * p, y = a[1] + (b[1] - a[1]) * p; glow(k, x, y, 7, '255,190,110', 1); }
    }
    k.restore();
    NN.forEach((L, li) => L.forEach(([x, y], i) => {
      const act = 0.5 + 0.5 * Math.sin(TAU * ph * 2 - li * 1.1 + i * 1.3);   // 激活每周期起伏 2 次
      glow(k, x, y, 13, '255,140,60', act * 0.5);
      k.fillStyle = '#0A0D20'; k.strokeStyle = `rgba(170,195,255,${0.6 + act * 0.4})`; k.lineWidth = 1.2;
      k.beginPath(); k.arc(x, y, 5, 0, TAU); k.fill(); k.stroke();
      k.fillStyle = `rgba(255,200,130,${0.3 + act * 0.7})`; k.beginPath(); k.arc(x, y, 2.6 * act + 0.8, 0, TAU); k.fill();
    }));
    ['INPUT', 'H1', 'H2', 'H3', 'H4', 'OUT'].forEach((t, i) => txt(k, t, 90 + i * 72, 196, `500 7px ${MONO}`, 'rgba(170,190,255,.6)', 'center'));
    grain(k, 0.05);
  };

  // @element 13
  // 13 电子云：3d 轨道（n=3, l=2, m=0）的概率云由点阵构成，正负相位分蓝橙两色，整体缓慢旋转
  const ORB = (() => { // 按波函数平方做确定性拒绝采样（常量）
    const out = [];
    for (let i = 0; out.length < 1600 && i < 60000; i++) {
      const x = (hash(i * 4 + 1) - 0.5) * 36, y = (hash(i * 4 + 2) - 0.5) * 36, z = (hash(i * 4 + 3) - 0.5) * 36;
      const r = Math.hypot(x, y, z), ct = z / (r || 1), psi = r * r * Math.exp(-r / 3) * (3 * ct * ct - 1);
      if (hash(i * 4 + 4) * 3 < psi * psi / 30) out.push([x, y, z, psi > 0]);
    }
    return out;
  })();
  CELLS[12] = (k, w, h, u) => {
    k.fillStyle = '#05060F'; k.fillRect(0, 0, CW, CH);
    const a = TAU * u / CYC, b = 0.5, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);   // 每周期转一圈
    k.save(); k.globalCompositeOperation = 'lighter';
    for (const [x, y, z, pos] of ORB) {
      const x1 = x * ca - y * sa, y1 = x * sa + y * ca, y2 = y1 * cb - z * sb, z2 = y1 * sb + z * cb, s = 90 / (60 + y2);
      k.fillStyle = pos ? 'rgba(90,170,255,.55)' : 'rgba(255,130,90,.55)'; k.fillRect(269.5 + x1 * s * 2.6, 104 - z2 * s * 2.6, 1.3, 1.3);
    }
    k.restore();
    glow(k, 269.5, 104, 12, '255,255,255', 0.6);
    k.strokeStyle = 'rgba(180,200,255,.25)'; k.lineWidth = 0.8; k.beginPath(); k.ellipse(269.5, 104, 120, 32, 0, 0, TAU); k.stroke();
    txt(k, 'ψ₃₂₀ · n = 3  l = 2  m = 0', 400, 190, `500 8px ${MONO}`, 'rgba(190,205,255,.7)');
    grain(k, 0.05);
  };

  // @element 14
  // 14 构成主义：红黑两色，大红圆、黑色横杠与竖杠、粗体 FORWARD、红色楔形依次砸进倾斜 -0.42 rad 的画面；停留后逆序退场
  CELLS[13] = (k, w, h, u) => {
    k.fillStyle = '#E9E0CC'; k.fillRect(0, 0, CW, CH);
    // 第 i 个元素在 0.2 + 0.35i 秒入场（0.5 秒 out3，最后一个 1.9 秒到位）；5.4 秒起逆序退场，间隔 0.12 秒、每个 0.4 秒
    const e = i => out3(seg(u, 0.2 + i * 0.35, 0.7 + i * 0.35)) * (1 - inOut3(seg(u, SHOW + (4 - i) * 0.12, SHOW + 0.4 + (4 - i) * 0.12)));
    k.save(); k.translate(300, 104); k.rotate(-0.42);
    const r0 = 92 * e(0);                                        // 红圆半径 92px，从中心胀开
    if (r0 > 0) { k.fillStyle = '#C8231B'; k.beginPath(); k.arc(40, -14, r0, 0, TAU); k.fill(); }
    k.fillStyle = '#141414';
    k.fillRect(-420 - (1 - e(1)) * 1000, 34, 840, 21);          // 横杠从左侧画外 1000px 处滑入
    k.fillRect(-18, -230 - (1 - e(2)) * 700, 18, 460);          // 竖杠从上方画外落下
    k.letterSpacing = '-3px';
    txt(k, 'FORWARD', -250 + (1 - e(3)) * 1000, -40, `900 62px ${DISP}`, '#141414');   // 粗体字从右侧画外冲入
    k.letterSpacing = '0px';
    const tw = 250 * e(4);                                       // 红色楔形向右拉长到 250px
    if (tw > 0) { k.fillStyle = '#C8231B'; k.beginPath(); k.moveTo(70, 70); k.lineTo(70 + tw, 70); k.lineTo(70, 98); k.fill(); }
    k.restore();
    txt(k, 'No. 21  ·  1926 → 2026', 12, 199, `700 8px ${DISP}`, '#141414');
    grain(k, 0.08, 'multiply');
  };

  // @element 15
  // 15 孟菲斯：粉彩底上 36 个圆、三角、波浪线、点阵和条块各自上下弹跳（每周期 2 或 3 次）并旋转（每周期 -1/0/+1 圈）
  const MEM_COLS = ['#1A1A1A', '#FF5C8A', '#2EC4B6', '#FFC93C', '#5B5BF0'];
  const MEM_SHAPES = Array.from({ length: 36 }, (_, i) => {   // 9 列 × 4 行抖动网格铺满卡片
    const c = i % 9, r = Math.floor(i / 9), q = j => hash(i * 7 + j);
    return { x: 30 + c * 60 + (q(1) - 0.5) * 34, y: 26 + r * 52 + (q(2) - 0.5) * 26, s: 18 + q(3) * 30,
      col: MEM_COLS[Math.floor(q(4) * 5)], ty: Math.floor(q(5) * 5), rot: q(6) * 6,
      spin: Math.round((q(7) - 0.5) * 2.4), bob: 2 + (i % 2) };
  });
  CELLS[14] = (k, w, h, u) => {
    k.fillStyle = '#FDE3D6'; k.fillRect(0, 0, CW, CH);
    const ph = TAU * u / CYC;
    k.lineCap = 'round';
    MEM_SHAPES.forEach((m, i) => {
      const s = m.s;
      k.save(); k.translate(m.x, m.y + Math.sin(ph * m.bob + i) * 5);   // 弹跳振幅 5px
      k.rotate(m.rot + m.spin * ph);
      k.fillStyle = m.col; k.strokeStyle = m.col; k.lineWidth = 3;
      if (m.ty === 0) { k.beginPath(); k.arc(0, 0, s * 0.5, 0, TAU); k.fill(); }
      else if (m.ty === 1) { k.beginPath(); k.moveTo(0, -s * 0.5); k.lineTo(s * 0.5, s * 0.45); k.lineTo(-s * 0.5, s * 0.45); k.fill(); }
      else if (m.ty === 2) { k.beginPath(); for (let j = 0; j <= 30; j++) k.lineTo(-s + j / 30 * s * 2, Math.sin(j / 30 * 12) * s * 0.18); k.stroke(); }
      else if (m.ty === 3) { k.beginPath(); for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) { k.moveTo(a * 6 - 9 + 1.6, b * 6 - 9); k.arc(a * 6 - 9, b * 6 - 9, 1.6, 0, TAU); } k.fill(); }
      else { k.fillRect(-s * 0.5, -s * 0.12, s, s * 0.24); k.fillStyle = '#1A1A1A'; k.fillRect(-s * 0.5, s * 0.12, s, 2); }
      k.restore();
    });
    grain(k, 0.06, 'multiply');
  };

  // @element 16
  // 16 装饰艺术：黑底金线，25 道放射线与 9 层扇形弧从底部中心逐层展开，五重阶梯拱门常驻，一道暖光每周期扫过一次；复位段收回
  CELLS[15] = (k, w, h, u) => {
    k.fillStyle = '#0B0B0D'; k.fillRect(0, 0, CW, CH);
    const cx = 269.5, by = 190, gold = a => `rgba(214,176,98,${a})`;
    const back = 1 - inOut3(seg(u, SHOW, SHOW + 0.8));       // 5.4–6.2 秒收回
    const gR = out3(seg(u, 0.2, 1.8)) * back;                  // 放射线 0.2–1.8 秒伸到 300px
    k.lineWidth = 0.8; k.strokeStyle = gold(0.5);
    if (gR > 0) {
      k.beginPath();
      for (let i = 0; i <= 24; i++) { const a = Math.PI + i / 24 * Math.PI; k.moveTo(cx + Math.cos(a) * 26, by + Math.sin(a) * 26); k.lineTo(cx + Math.cos(a) * (26 + 300 * gR), by + Math.sin(a) * (26 + 300 * gR)); }
      k.stroke();
    }
    k.lineWidth = 1;
    for (let i = 0; i < 9; i++) {                              // 第 i 层弧 0.4 + 0.18i 秒起、0.8 秒展开，半径 26 + 19i
      const g = out3(seg(u, 0.4 + i * 0.18, 1.2 + i * 0.18)) * back; if (g <= 0) continue;
      k.strokeStyle = gold(0.9 - i * 0.06); k.beginPath(); k.arc(cx, by, (26 + i * 19) * g, Math.PI, 0); k.stroke();
    }
    for (let s = 0; s < 5; s++) {                              // 阶梯拱门：宽 182 − 26s，常驻
      const wA = 182 - s * 26; k.strokeStyle = gold(0.8); k.lineWidth = s === 0 ? 1.4 : 0.8;
      k.beginPath(); k.moveTo(cx - wA / 2, by); k.lineTo(cx - wA / 2, by - wA / 2); k.arc(cx, by - wA / 2, wA / 2, Math.PI, 0); k.lineTo(cx + wA / 2, by); k.stroke();
    }
    const sx = -60 + (u / CYC) * (CW + 120);                   // 光带每周期从画外左侧扫到画外右侧
    const sg = k.createLinearGradient(sx, 0, sx + 60, 0);
    sg.addColorStop(0, 'rgba(255,240,200,0)'); sg.addColorStop(0.5, 'rgba(255,240,200,.18)'); sg.addColorStop(1, 'rgba(255,240,200,0)');
    k.fillStyle = sg; k.fillRect(0, 0, CW, by);
    k.fillStyle = gold(1); k.fillRect(10, by, CW - 20, 1.2);
    k.letterSpacing = '5px'; txt(k, 'GRAND  LOBBY', cx, by + 13, `300 9px ${DISP}`, gold(1), 'center'); k.letterSpacing = '0px';
    grain(k, 0.05);
  };

  // @element 17
  // 17 孔版印刷：荧光粉与青绿两版正片叠底，大圆、方块、粗体 RISO/PRINT 叠出第三色；两版错位按正弦每周期往复 3 次
  CELLS[16] = (k, w, h, u) => {
    k.fillStyle = '#F4F0E6'; k.fillRect(0, 0, CW, CH);
    const off = 3 + Math.sin(TAU * u / CYC * 3) * 2;           // 套印错位 1–5px
    k.save(); k.globalCompositeOperation = 'multiply'; k.letterSpacing = '-4px';
    k.fillStyle = '#FF48B0';
    k.beginPath(); k.arc(300 + off, 92, 78, 0, TAU); k.fill();
    txt(k, 'RISO', 14 + off, 196, `900 100px ${DISP}`, '#FF48B0');
    k.fillRect(440 + off, 14, 84, 84);
    k.fillStyle = '#00A69C';
    k.beginPath(); k.arc(372, 128 - off, 66, 0, TAU); k.fill();
    txt(k, 'PRINT', 16, 86 - off, `900 64px ${DISP}`, '#00A69C');
    for (let i = 0; i < 8; i++) k.fillRect(440, 118 + i * 11, 90, 4);
    k.restore();
    // 漏印斑点：1500 个固定浅色点（原作 22000 个，按面积缩减），缓存成图层
    k.drawImage(layer('RISO_speck', g => { for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(244,240,230,${hash(i * 3 + 5) * 0.55})`; g.fillRect(hash(i * 3 + 6) * CW, hash(i * 3 + 7) * CH, 1.2, 1.2); } }), 0, 0);
    grain(k, 0.1, 'multiply');
  };

  // @element 18
  // 18 万花尺：三组齿轮各在半径 84 的圆环内滚动，笔尖错峰 0.4 秒画出红、蓝、绿三朵繁花曲线（各 3.6 秒），闭合后停留，5.4 秒淡出
  const SPIRO_R = 84;
  const SPIRO_SETS = [[100, 32, 25, '#D2452F', 8], [269.5, 18, 14, '#1F3B8A', 3], [439, 13, 8, '#2E7D63', 13]]; // [cx, r, d, 墨色, 闭合圈数 r/gcd(R,r)]
  CELLS[17] = (k, w, h, u) => {
    k.fillStyle = '#F2EDE3'; k.fillRect(0, 0, CW, CH);
    const cy = 104, R = SPIRO_R;
    k.strokeStyle = 'rgba(40,40,40,.25)'; k.lineWidth = 4;
    for (const s of SPIRO_SETS) { k.beginPath(); k.arc(s[0], cy, R + 3, 0, TAU); k.stroke(); }
    const fade = fadeIn(u);
    SPIRO_SETS.forEach(([cx, r, d, col, turns], si) => {
      const tm = seg(u, 0.2 + si * 0.4, 3.8 + si * 0.4); if (tm <= 0) return;
      const T = turns * TAU * tm; let px = cx + R - r + d, py = cy;
      k.save(); k.globalAlpha = 0.85 * fade; k.strokeStyle = col; k.lineWidth = 0.9; k.beginPath(); k.moveTo(px, py);
      for (let t = 0.03; ; t += 0.03) {                       // 步长 0.03 rad，最后一点落在 T
        const tt = Math.min(t, T);
        px = cx + (R - r) * Math.cos(tt) + d * Math.cos((R - r) / r * tt); py = cy + (R - r) * Math.sin(tt) - d * Math.sin((R - r) / r * tt); k.lineTo(px, py);
        if (tt >= T) break;
      }
      k.stroke(); k.restore();
      if (tm < 1) {                                            // 画线中显示半透明齿轮与笔尖
        const gx = cx + (R - r) * Math.cos(T), gy = cy + (R - r) * Math.sin(T);
        k.strokeStyle = 'rgba(40,40,40,.35)'; k.fillStyle = 'rgba(255,255,255,.35)'; k.lineWidth = 0.8;
        k.beginPath(); k.arc(gx, gy, r, 0, TAU); k.fill(); k.stroke();
        k.fillStyle = col; k.beginPath(); k.arc(px, py, 2, 0, TAU); k.fill();
      }
    });
    grain(k, 0.07, 'multiply');
  };

  // @element 19
  // 19 桑基图：四种能源（左）分流到四类用途（右），13 条带子粗细即数量、颜色由来源渐变到去向；0.2–3.2 秒依次流入，5.4 秒淡出
  const SK_L = [['太阳能', 120, '#E9A23B'], ['风能', 90, '#4E8FBF'], ['水电', 70, '#3AA39A'], ['天然气', 110, '#B65A4A']];
  const SK_R = [['工业', 150, '#5B5F97'], ['住宅', 110, '#C87D5B'], ['交通', 70, '#6A9A62'], ['储能', 60, '#8E6BB0']];
  const SK_XL = 62, SK_NW = 7, SK_XR = CW - 62 - 7;
  const SK_GEO = (() => {                                      // 节点与带子几何（常量）：每单位 0.4px，节点间隔 7px，自 y=16 排起
    const lay = arr => { let y = 16; return arr.map(a => { const o = { y, h: a[1] * 0.4, off: 0 }; y += a[1] * 0.4 + 7; return o; }); };
    const ln = lay(SK_L), rn = lay(SK_R);
    const flows = [[0, 0, 50], [0, 1, 40], [0, 3, 30], [1, 0, 40], [1, 1, 30], [1, 3, 20], [2, 0, 30], [2, 1, 20], [2, 2, 20], [3, 0, 30], [3, 1, 20], [3, 2, 50], [3, 3, 10]]
      .map(([a, b, v]) => { const hh = v * 0.4, ya = ln[a].y + ln[a].off, yb = rn[b].y + rn[b].off; ln[a].off += hh; rn[b].off += hh; return { a, b, h: hh, ya, yb }; });
    return { ln, rn, flows };
  })();
  CELLS[18] = (k, w, h, u) => {
    k.fillStyle = '#F3EFE7'; k.fillRect(0, 0, CW, CH);
    const { ln, rn, flows } = SK_GEO, x0 = SK_XL + SK_NW, xr = SK_XR, mx = (x0 + xr) / 2;
    const prog = inOut3(seg(u, 0.2, 3.2)), fade = fadeIn(u);
    flows.forEach((f, i) => {
      const kk = clamp(prog * 1.5 - i * 0.04); if (kk <= 0 || fade <= 0) return;   // 第 i 条晚 0.04 进度出发
      const g = k.createLinearGradient(x0, 0, xr, 0); g.addColorStop(0, SK_L[f.a][2]); g.addColorStop(1, SK_R[f.b][2]);
      k.save(); k.beginPath(); k.rect(0, 0, x0 + (xr - x0) * kk, CH); k.clip();
      k.globalAlpha = 0.55 * fade; k.fillStyle = g;
      k.beginPath(); k.moveTo(x0, f.ya); k.bezierCurveTo(mx, f.ya, mx, f.yb, xr, f.yb); k.lineTo(xr, f.yb + f.h);
      k.bezierCurveTo(mx, f.yb + f.h, mx, f.ya + f.h, x0, f.ya + f.h); k.closePath(); k.fill(); k.restore();
    });
    SK_L.forEach((a, i) => { k.fillStyle = a[2]; k.fillRect(SK_XL, ln[i].y, SK_NW, ln[i].h); txt(k, a[0], SK_XL - 5, ln[i].y + ln[i].h / 2, `700 10px ${SANS}`, '#1D1B18', 'right', 'middle'); });
    SK_R.forEach((a, i) => { k.fillStyle = a[2]; k.fillRect(xr, rn[i].y, SK_NW, rn[i].h); txt(k, a[0], xr + SK_NW + 5, rn[i].y + rn[i].h / 2, `700 10px ${SANS}`, '#1D1B18', 'left', 'middle'); });
    grain(k, 0.05, 'multiply');
  };

  // @element 20
  // 20 防伪钞票纹：翡翠绿与金色共 32 条内摆线叠成玫瑰窗，四组按各自对称角整周期旋转（13/17/11 瓣，每周期转 1 瓣），两侧波纹带每周期平移一个波长
  const GU_S = 0.24;                                            // 原作尺寸 ×0.24（外圈 R=400 → 96px）
  const GU_GROUPS = (() => {                                    // 四组摆线：[R, r, d, 透明度, 初始转角]，预先算好点列（常量）
    const groups = [[], [], [], []], cols = ['#0F5A4A', '#0F5A4A', '#B88A2E', '#0F5A4A'];
    for (let i = 0; i < 14; i++) groups[i % 2].push([400, 400 / 13, 150 + i * 10, 0.5, i * 0.045]);
    for (let i = 0; i < 10; i++) groups[2].push([270, 270 / 17, 90 + i * 8, 0.7, i * 0.04]);
    for (let i = 0; i < 8; i++) groups[3].push([140, 140 / 11, 46 + i * 6, 0.8, i * 0.05]);
    return groups.map((gr, gi) => ({ col: cols[gi], curves: gr.map(([R, r, d, al, rot]) => {
      const n = Math.round(R / r), N = n * 30, pts = new Float32Array(N * 2 + 2);   // r = R/n 时 t 走一圈即闭合，取 30n 点：转 1/n 圈后采样点与起点逐一重合
      for (let i = 0; i <= N; i++) {
        const t = i / N * TAU, x = (R - r) * Math.cos(t) + d * Math.cos((R - r) / r * t), y = (R - r) * Math.sin(t) - d * Math.sin((R - r) / r * t);
        pts[i * 2] = (x * Math.cos(rot) - y * Math.sin(rot)) * GU_S; pts[i * 2 + 1] = (x * Math.sin(rot) + y * Math.cos(rot)) * GU_S;
      }
      return { al, pts };
    }) }));
  })();
  const GU_SPIN = [-1 / 13, 1 / 13, -1 / 17, 1 / 11];          // 每周期转过的圈数 = 1/瓣数（转一瓣后与起点重合）
  CELLS[19] = (k, w, h, u) => {
    k.fillStyle = '#F1ECDF'; k.fillRect(0, 0, CW, CH);
    const cx = 269.5, cy = 104, ph = TAU * u / CYC;
    // 两侧波纹带：两族各 10 条正弦线（波长 48px、振幅 10px），绿金反向，裁掉玫瑰窗所在圆
    k.save(); k.beginPath(); k.rect(0, 0, CW, CH); k.arc(cx, cy, 124, 0, TAU, true); k.clip('evenodd'); k.lineWidth = 0.8;
    for (let fam = 0; fam < 2; fam++) {
      k.strokeStyle = fam ? 'rgba(184,138,46,.7)' : 'rgba(15,90,74,.55)'; k.beginPath();
      for (let j = 0; j < 10; j++) {
        const y0 = cy + (j - 4.5) * 14, p0 = (fam ? -ph : ph) + j * 0.6;
        for (let x = 0; x <= CW; x += 3) { const y = y0 + 10 * Math.sin(x / 48 * TAU + p0); x ? k.lineTo(x, y) : k.moveTo(x, y); }
      }
      k.stroke();
    }
    k.restore();
    k.lineWidth = 1;
    GU_GROUPS.forEach((gr, i) => {
      k.save(); k.translate(cx, cy); k.rotate(ph * GU_SPIN[i]); k.strokeStyle = gr.col;
      for (const { al, pts } of gr.curves) { k.globalAlpha = al; k.beginPath(); k.moveTo(pts[0], pts[1]); for (let j = 2; j < pts.length; j += 2) k.lineTo(pts[j], pts[j + 1]); k.stroke(); }
      k.restore();
    });
    k.strokeStyle = '#0F5A4A'; k.lineWidth = 1.2; k.beginPath(); k.arc(cx, cy, 115, 0, TAU); k.stroke();
    k.lineWidth = 0.6; k.beginPath(); k.arc(cx, cy, 118, 0, TAU); k.stroke();
    txt(k, 'SERIAL  A 0 2 6 1 4 9 5 5', 10, 201, `500 7px ${MONO}`, '#0F5A4A');
    grain(k, 0.05, 'multiply');
  };

  // @element 21
  // 21 青海波：深靛底上米白与靛蓝五重同心半圆层层相叠，纹样每周期向下平移一个纹样周期（22px），金色满月压在右上
  const SEI_R = 22;                                             // 波纹半径 22px（原 70px）
  CELLS[20] = (k, w, h, u) => {
    k.fillStyle = '#0F2447'; k.fillRect(0, 0, CW, CH);
    const shift = (u / CYC) * SEI_R;                           // 纹样竖向周期 = R（两行），每周期平移整一个周期
    const R = SEI_R;
    for (let row = -3; row <= Math.ceil((CH + R) / (R / 2)) + 1; row++) {   // 行距 R/2，奇数行错开 R，后画的行压住前一行
      const y = row * R * 0.5 + shift;
      for (let col = -1; col <= Math.ceil(CW / (R * 2)) + 1; col++) {
        const x = col * R * 2 + (((row % 2) + 2) % 2 ? R : 0) - 18;
        for (let q = 5; q >= 1; q--) { k.fillStyle = q % 2 ? '#0F2447' : '#E9E2D0'; k.beginPath(); k.arc(x, y, R * q / 5, Math.PI, 0); k.fill(); }
      }
    }
    const mg = k.createRadialGradient(410, 64, 4, 410, 64, 48); mg.addColorStop(0, '#F5D58A'); mg.addColorStop(1, '#C9952F');
    k.fillStyle = mg; k.beginPath(); k.arc(410, 64, 46, 0, TAU); k.fill();
    grain(k, 0.07);
  };

  // @element 22
  // 22 伊斯兰星纹：松石绿方格上钴蓝八角星、米白十字与金色描线，从中心一格格向外点亮（0.2–2.5 秒），停留后 5.4 秒淡出
  const GIR_S = 62;                                             // 格宽 62px（原 210px），整体转 0.12 rad
  const GIR_STAR = r => { const p = new Path2D(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, q = i % 2 ? r * 0.62 : r; i ? p.lineTo(Math.cos(a) * q, Math.sin(a) * q) : p.moveTo(q, 0); } p.closePath(); return p; };
  const GIR_P = { big: GIR_STAR(GIR_S * 0.44), small: GIR_STAR(GIR_S * 0.2) };
  const GIR_GRID = []; for (let gy = -3; gy <= 3; gy++) for (let gx = -5; gx <= 5; gx++) GIR_GRID.push([gx, gy, Math.hypot(gx, gy)]);
  function girCell(k, x, y, a) {                                // a：点亮进度 0..1（透明度与星形缩放）
    const S = GIR_S; k.save(); k.translate(x, y); k.globalAlpha = a;
    k.fillStyle = '#1F8A8A'; k.fillRect(-S / 2, -S / 2, S, S);
    k.fillStyle = '#F2EBDC'; k.beginPath();
    for (let i = 0; i < 4; i++) { k.rotate(Math.PI / 2); k.moveTo(-S * 0.12, -S / 2); k.lineTo(S * 0.12, -S / 2); k.lineTo(S * 0.12, -S * 0.3); k.lineTo(-S * 0.12, -S * 0.3); }
    k.fill();
    k.save(); k.scale(a, a); k.fillStyle = '#1C3F94'; k.fill(GIR_P.big); k.fillStyle = '#F2EBDC'; k.fill(GIR_P.small);
    k.fillStyle = '#D9A93C'; k.beginPath(); k.arc(0, 0, S * 0.06, 0, TAU); k.fill(); k.restore();
    k.strokeStyle = '#D9A93C'; k.lineWidth = 1.1; k.stroke(GIR_P.big); k.beginPath();
    for (let i = 0; i < 8; i++) { const t = i / 8 * TAU; k.moveTo(Math.cos(t) * S * 0.44, Math.sin(t) * S * 0.44); k.lineTo(Math.cos(t) * S * 0.72, Math.sin(t) * S * 0.72); }
    k.stroke(); k.restore();
  }
  function girAll(k, p) { k.save(); k.translate(269.5, 104); k.rotate(0.12); for (const [gx, gy, d] of GIR_GRID) { const a = out3(clamp(p - d * 0.45)); if (a > 0) girCell(k, gx * GIR_S, gy * GIR_S, a); } k.restore(); }
  CELLS[21] = (k, w, h, u) => {
    k.fillStyle = '#0F1E3A'; k.fillRect(0, 0, CW, CH);
    const p = (u - 0.2) * 1.6, fade = fadeIn(u);                // 距中心 d 格的格子在 p = 0.45d 时开始点亮；最远 d≈5.83，约 2.5 秒全部点亮
    if (p > 0 && fade > 0) { k.save(); k.globalAlpha = fade; girAll(k, p); k.restore(); }
    grain(k, 0.06);
  };

  // @element 23
  // 23 青花瓷盘：俯视白釉瓷盘，钴蓝海水纹、莲瓣、缠枝莲与中心花一圈圈；瓷盘每周期顺时针转一整圈，一道暖金高光每周期从左扫到右
  const QH_R = 152, QH_E = 156;                                 // 盘半径 152px（原 460px，比例 0.33），上下略出画
  const QH_IMG = (() => {                                       // 纹样画在 2 倍分辨率透明离屏图上，绘制时整体旋转
    const c = document.createElement('canvas'); c.width = c.height = QH_E * 4; const g = c.getContext('2d');
    g.scale(2, 2); g.translate(QH_E, QH_E);
    const R = QH_R, f = R / 460, blue = a => `rgba(28,52,140,${a})`;
    const ring = (r, lw) => { g.strokeStyle = blue(0.85); g.lineWidth = lw; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); };
    ring(R * 0.97, 2); ring(R * 0.9, 1);
    for (let i = 0; i < 36; i++) {                            // 36 朵海水纹
      g.save(); g.rotate(i / 36 * TAU); g.strokeStyle = blue(0.8); g.lineWidth = 1;
      g.beginPath(); g.arc(0, -R * 0.935, 18 * f, Math.PI * 0.1, Math.PI * 1.3); g.stroke();
      g.beginPath(); g.arc(6 * f, -R * 0.935, 8 * f, Math.PI * 0.2, Math.PI * 1.6); g.stroke(); g.restore();
    }
    ring(R * 0.74, 1);
    for (let i = 0; i < 16; i++) {                            // 16 片莲瓣
      g.save(); g.rotate(i / 16 * TAU); g.fillStyle = blue(0.22); g.strokeStyle = blue(0.85); g.lineWidth = 0.9;
      g.beginPath(); g.moveTo(-R * 0.07, -R * 0.74); g.quadraticCurveTo(-R * 0.07, -R * 0.88, 0, -R * 0.89); g.quadraticCurveTo(R * 0.07, -R * 0.88, R * 0.07, -R * 0.74); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(0, -R * 0.76); g.lineTo(0, -R * 0.86); g.stroke(); g.restore();
    }
    ring(R * 0.52, 1.1);
    g.strokeStyle = blue(0.9); g.lineWidth = 1.2; g.beginPath();   // 缠枝：18 弧度长的渐开螺旋
    for (let t = 0; t < 18; t += 0.05) { const r = R * (0.15 + 0.3 * (t / 18)), a = t * 1.2; t ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    g.stroke();
    for (let i = 0; i < 9; i++) {                             // 9 片缠枝叶
      const a = i * 2.1, r = R * (0.15 + 0.3 * (i * 2 / 18));
      g.save(); g.translate(Math.cos(a * 1.2) * r, Math.sin(a * 1.2) * r); g.rotate(a); g.fillStyle = blue(0.3); g.strokeStyle = blue(0.85); g.lineWidth = 0.8;
      g.beginPath(); g.ellipse(16 * f, 0, 22 * f, 9 * f, 0, 0, TAU); g.fill(); g.stroke(); g.restore();
    }
    for (let i = 0; i < 8; i++) {                             // 中心八瓣花
      g.save(); g.rotate(i / 8 * TAU); g.fillStyle = blue(0.35); g.strokeStyle = blue(0.9); g.lineWidth = 0.9;
      g.beginPath(); g.ellipse(0, -R * 0.09, R * 0.045, R * 0.1, 0, 0, TAU); g.fill(); g.stroke(); g.restore();
    }
    g.fillStyle = blue(0.85); g.beginPath(); g.arc(0, 0, R * 0.04, 0, TAU); g.fill();
    return c;
  })();
  CELLS[22] = (k, w, h, u) => {
    k.fillStyle = '#E7E2D8'; k.fillRect(0, 0, CW, CH);
    const cx = 269.5, cy = 104, R = QH_R;
    k.fillStyle = 'rgba(80,70,60,.18)'; k.beginPath(); k.ellipse(cx + 10, cy + 13, R, R * 0.98, 0, 0, TAU); k.fill();
    const gl = k.createRadialGradient(cx - 40, cy - 46, 16, cx, cy, R); gl.addColorStop(0, '#FBFBF8'); gl.addColorStop(1, '#E8EBEC');
    k.fillStyle = gl; k.beginPath(); k.arc(cx, cy, R, 0, TAU); k.fill();
    k.save(); k.translate(cx, cy); k.rotate(TAU * u / CYC); k.drawImage(QH_IMG, -QH_E, -QH_E, QH_E * 2, QH_E * 2); k.restore();
    // 描金高光：60px 宽的暖金光带，每周期从盘左外侧扫到右外侧（首尾都在盘外）
    const sx = cx - R - 70 + (u / CYC) * (R * 2 + 140);
    k.save(); k.beginPath(); k.arc(cx, cy, R, 0, TAU); k.clip(); k.globalCompositeOperation = 'screen';
    const sg = k.createLinearGradient(sx - 30, 0, sx + 30, 0);
    sg.addColorStop(0, 'rgba(255,214,140,0)'); sg.addColorStop(0.5, 'rgba(255,214,140,.45)'); sg.addColorStop(1, 'rgba(255,214,140,0)');
    k.fillStyle = sg; k.fillRect(sx - 30, 0, 60, CH); k.restore();
    k.fillStyle = 'rgba(255,255,255,.55)'; k.beginPath(); k.ellipse(cx - 64, cy - 76, 40, 11, -0.6, 0, TAU); k.fill();   // 固定的釉面天光
    grain(k, 0.05, 'multiply');
  };

  // @element 24
  // 24 费尔岛针织：V 字毛线圈（10×8.5px）织出菱格、雪花与驯鹿带，0.2–4.6 秒从下往上逐行织出（行内左右往返），5.4 秒淡出
  const KNIT_SW = 10, KNIT_SH = 8.5, KNIT_ROWS = Math.ceil(CH / 8.5) + 1;
  const KNIT_COLS = [[242, 236, 224], [200, 50, 46], [27, 42, 58], [232, 180, 74]];   // #F2ECE0 #C8322E #1B2A3A #E8B44A
  function knitMotif(c, r) {                                    // 原作的三条 12 行图案带：菱格 / 雪花 / 驯鹿
    const band = Math.floor(r / 12) % 3, rr = r % 12, cc = c % 12;
    if (band === 1) { const dx = Math.abs(cc - 6), dy = Math.abs(rr - 6); if (dx + dy < 5 && (dx === dy || dx === 0 || dy === 0)) return 0; if (rr === 0 || rr === 11) return 3; return 2; }
    if (band === 0) { if ((cc + rr) % 6 === 0 || (cc - rr + 12) % 6 === 0) return 1; return 0; }
    if (rr < 2 || rr > 9) return 3; const d = Math.abs(cc - 6); if (rr > 3 && rr < 8 && d < 4 - Math.abs(rr - 5.5) + 1) return 0; return 1;
  }
  CELLS[23] = (k, w, h, u) => {
    k.fillStyle = '#1B2A3A'; k.fillRect(0, 0, CW, CH);
    const sw = KNIT_SW, sh = KNIT_SH;
    const fab = layer('KNIT_all', g => {                       // 整片织物一次画好（每针两片带渐变的线圈）
      for (let r = 0; r < KNIT_ROWS; r++) { const y = r * sh;
        for (let c = 0; c < Math.ceil(CW / sw) + 1; c++) {
          const x = c * sw, base = KNIT_COLS[knitMotif(c, r)], wave = 0.85 + 0.15 * Math.sin(x / 46) * Math.sin(y / 60);
          for (const side of [-1, 1]) {
            g.save(); g.translate(x + sw / 2 + side * sw * 0.22, y + sh * 0.55); g.rotate(side * -0.55);
            const gr = g.createLinearGradient(-sw * 0.25, 0, sw * 0.25, 0);
            gr.addColorStop(0, rgba(base.map(v => Math.round(v * 0.55 * wave)), 1)); gr.addColorStop(0.5, rgba(base.map(v => Math.round(Math.min(255, v * 1.05 * wave))), 1)); gr.addColorStop(1, rgba(base.map(v => Math.round(v * 0.6 * wave)), 1));
            g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, sw * 0.26, sh * 0.78, 0, 0, TAU); g.fill();
            g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 0.5; g.beginPath();
            for (let q = -1; q <= 1; q++) { g.moveTo(-sw * 0.2, q * 2.2); g.lineTo(sw * 0.2, q * 2.2 + 1.5); }
            g.stroke(); g.restore();
          }
        } }
    });
    const shown = seg(u, 0.2, 4.6) * KNIT_ROWS, full = Math.floor(shown), frac = shown - full, fade = fadeIn(u);
    if (shown > 0 && fade > 0) {
      const yCut = (KNIT_ROWS - full) * sh;                    // 自下而上：第 r 行在 r ≥ 行数 − 已织行数 时出现
      k.save(); k.globalAlpha = fade; k.beginPath(); k.rect(0, yCut, CW, CH + sh - yCut);
      if (frac > 0 && full < KNIT_ROWS) k.rect(full % 2 ? CW * (1 - frac) : 0, yCut - sh, CW * frac, sh);   // 正在织的一行左右往返
      k.clip(); k.drawImage(fab, 0, 0); k.restore();
    }
    grain(k, 0.07);
  };

  // @element 25
  // 25 玻璃马赛克：45×18 块 12px 玻璃砖从右往左依次翻面落位（0.2–3.65 秒），拼出日落海景；5.4 秒起再从右往左翻回
  const MOS_SZ = 12, MOS_GAP = 1.5;
  const MOS_TILES = (() => {
    const out = []; let n = 0;
    for (let y = 0; y < CH; y += MOS_SZ) for (let x = 0; x < CW; x += MOS_SZ) {
      const uu = x / CW, v = y / CH; let c;
      if (v < 0.55) {                                          // 天空：橙红渐变到紫，椭圆落日 rx 46、ry 34
        c = lerpC([255, 120, 80], [80, 60, 140], Math.pow(1 - v / 0.55, 1.2));
        if (Math.hypot((x + MOS_SZ / 2 - CW * 0.55) / 46, (y + MOS_SZ / 2 - CH * 0.45) / 34) < 1) c = [255, 226, 170];
      } else {                                                 // 海面：深蓝渐变，隔行的落日倒影
        c = lerpC([30, 60, 120], [10, 20, 50], (v - 0.55) / 0.45);
        if (Math.abs(x + MOS_SZ / 2 - CW * 0.55) < 40 * (1 - (v - 0.55) * 1.5) && Math.floor(y / MOS_SZ) % 2) c = [255, 170, 110];
      }
      const j = 0.85 + hash(n * 3 + 1) * 0.3; c = c.map(q => Math.min(255, Math.round(q * j)));
      const t0 = 0.2 + (1 - uu) * 2.6 + hash(n * 3 + 2) * 0.5;       // 翻上：从右往左，0.35 秒
      const t1 = SHOW + (1 - uu) * 0.5 + hash(n * 3 + 3) * 0.15;     // 翻回：5.4–6.3 秒，0.25 秒
      out.push({ x, y, c: rgba(c, 1), t0, t1 }); n++;
    }
    return out;
  })();
  CELLS[24] = (k, w, h, u) => {
    k.fillStyle = '#E8E2D6'; k.fillRect(0, 0, CW, CH);
    const s = MOS_SZ - MOS_GAP, hi = new Path2D();
    for (const t of MOS_TILES) {
      const kk = out3(seg(u, t.t0, t.t0 + 0.35)) * (1 - out3(seg(u, t.t1, t.t1 + 0.25))); if (kk <= 0) continue;
      const hh = s * kk, top = t.y + MOS_SZ / 2 - hh / 2;      // 绕水平中线翻转：高度按进度缩放
      k.fillStyle = t.c; k.fillRect(t.x + MOS_GAP / 2, top, s, hh);
      hi.rect(t.x + MOS_GAP / 2, top, s, 1.5 * kk);
    }
    k.fillStyle = 'rgba(255,255,255,.22)'; k.fill(hi);         // 每块砖顶部的一道光泽
    grain(k, 0.05, 'multiply');
  };

  // @element 26
  // 26 方块翻转：22×6 的立方体阵列被斜向波浪依次翻转，每格每周期翻 8 次（每次 90°、0.4 秒），每翻一次顶面换成下一种颜色，4 色循环两轮回到原色
  const CUBE_COLS = [[255, 92, 64], [245, 240, 230], [60, 90, 230], [255, 200, 60]];
  const CUBE_NI = 22, CUBE_NJ = 6, CUBE_G = 0.6, CUBE_H = 0.26, CUBE_SC = 41;
  const CUBE_CA = Math.cos(0.42), CUBE_SA = Math.sin(0.42), CUBE_CB = Math.cos(0.62), CUBE_SB = Math.sin(0.62);
  // 正交轴测：绕 y 轴偏航 0.42、俯仰 0.62；返回 [屏幕 x 分量, 屏幕 y 分量, 深度]
  const CUBE_R = (x, y, z) => { const x1 = x * CUBE_CA + z * CUBE_SA, z1 = -x * CUBE_SA + z * CUBE_CA; return [x1, y * CUBE_CB + z1 * CUBE_SB, -y * CUBE_SB + z1 * CUBE_CB]; };
  const CUBE_C0 = CUBE_R((CUBE_NI - 1) * CUBE_G / 2, 0, (CUBE_NJ - 1) * CUBE_G / 2);
  const CUBE_ORDER = (() => { const o = []; for (let i = 0; i < CUBE_NI; i++) for (let j = 0; j < CUBE_NJ; j++) o.push([i, j, CUBE_R(i * CUBE_G, 0, j * CUBE_G)[2]]); return o.sort((a, b) => b[2] - a[2]); })();
  // 六个面：[局部法线, 四个角, 颜色偏移]；顶面 = 当前色，前面 = 下一色，底面 = 再下一色（翻 90° 后前面转到顶、底面转到前）
  const CUBE_FACES = [
    [[0, 1, 0], [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]], 0], [[0, 0, -1], [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1]], 1],
    [[0, -1, 0], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]], 2], [[0, 0, 1], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], 3],
    [[1, 0, 0], [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]], -1], [[-1, 0, 0], [[-1, -1, -1], [-1, 1, -1], [-1, 1, 1], [-1, -1, 1]], -1]];
  CELLS[25] = (k, w, h, u) => {
    k.fillStyle = '#121214'; k.fillRect(0, 0, CW, CH);
    for (const [i, j] of CUBE_ORDER) {
      const ph = 8 * u / CYC - (i * 0.6 + j) * 0.09, kf = Math.floor(ph), f = clamp((ph - kf) * 2), ci = ((kf % 4) + 4) % 4;
      const ang = inOut3(f) * Math.PI / 2, ca = Math.cos(ang), sa = Math.sin(ang);
      const cx = i * CUBE_G, cz = j * CUBE_G;
      for (const [n, pts, off] of CUBE_FACES) {
        const ny = n[1] * ca - n[2] * sa, nz = n[1] * sa + n[2] * ca, nx = n[0];
        // 正交视线：深度梯度 (-sa·cb, -sb, ca·cb)，点积为负即朝向相机
        if (-nx * CUBE_SA * CUBE_CB - ny * CUBE_SB + nz * CUBE_CA * CUBE_CB >= 0) continue;
        const col = off < 0 ? lerpC(CUBE_COLS[ci], CUBE_COLS[(ci + 1) % 4], f) : CUBE_COLS[(ci + off) % 4];
        const sh = clamp(0.5 - 0.5 * ny + 0.15 * nz);
        k.fillStyle = `rgb(${lerpC(col, [0, 0, 0], sh).join()})`; k.beginPath();
        pts.forEach(([px, py, pz], q) => {
          const yy = (py * ca - pz * sa) * CUBE_H, zz = (py * sa + pz * ca) * CUBE_H;
          const r = CUBE_R(cx + px * CUBE_H, yy, cz + zz);
          const sx = 269.5 + (r[0] - CUBE_C0[0]) * CUBE_SC, sy = 104 - (r[1] - CUBE_C0[1]) * CUBE_SC;
          q ? k.lineTo(sx, sy) : k.moveTo(sx, sy);
        });
        k.closePath(); k.fill();
      }
    }
    grain(k, 0.05);
  };

  // @element 27
  // 27 多米诺：56 块骨牌沿 S 形曲线排开，0.3 秒起第一块倒下，连锁一路传到 4.3 秒（间隔越来越短）；5.4–6.2 秒倒放，骨牌按相反顺序立回原位
  const DOM_CP = Math.cos(0.72), DOM_SP = Math.sin(0.72), DOM_D = 8, DOM_F = 410;
  const DOM_EYE = [0, DOM_D * DOM_SP, -DOM_D * DOM_CP];
  const DOM_P = (p) => { const y1 = p[1] * DOM_CP + p[2] * DOM_SP, d = -p[1] * DOM_SP + p[2] * DOM_CP + DOM_D, s = DOM_F / d; return [269.5 + p[0] * s, 112 - y1 * s]; };
  const DOM_PTS = (() => { // 按等弧长 0.215 在 S 曲线 x = -5→5、z = 1.5·sin 上取点（常量）
    const poly = []; for (let i = 0; i <= 2000; i++) { const s = i / 2000; poly.push([-5 + 10 * s, 1.5 * Math.sin(s * TAU)]); }
    const out = []; let acc = 0, next = 0;
    for (let i = 1; i < poly.length; i++) {
      const dx = poly[i][0] - poly[i - 1][0], dz = poly[i][1] - poly[i - 1][1], l = Math.hypot(dx, dz);
      if (acc + l >= next) { out.push([poly[i][0], poly[i][1], dx / l, dz / l]); next += 0.215; }
      acc += l;
    }
    return out;
  })();
  const DOM_L = (() => { const v = [-0.5, 0.8, -0.3], l = Math.hypot(...v); return v.map(c => c / l); })();
  CELLS[26] = (k, w, h, u) => {
    k.fillStyle = '#E8E3DA'; k.fillRect(0, 0, CW, CH);
    const N = DOM_PTS.length;
    const tau = u < SHOW ? u : mix(SHOW, 0, inOut3(seg(u, SHOW, SHOW + 0.8)));   // 复位段把时间倒放回 0
    const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
    const faces = [], shadows = [];
    DOM_PTS.forEach(([x, z, dx, dz], i) => {
      const t0 = 0.3 + 4.0 * Math.pow(i / (N - 1), 0.7);                       // 倒下时刻：间隔逐渐缩短
      const fall = clamp((tau - t0) / 0.28), ang = inOut3(fall) * (i === N - 1 ? 1.53 : 1.22);
      const dir = [dx, 0, dz], side = [-dz, 0, dx], up = [0, 1, 0], cu = Math.cos(ang), su = Math.sin(ang);
      const upr = add(mul(up, cu), mul(dir, su)), fwd = add(mul(dir, cu), mul(up, -su));
      const hw = 0.11, ht = 0.5, th = 0.035, piv = [x, 0, z];
      const C = (a, b, c) => add(piv, add(add(mul(side, a * hw), mul(upr, b * ht)), mul(fwd, c * th)));
      const v = [C(-1, 0, -1), C(1, 0, -1), C(1, 1, -1), C(-1, 1, -1), C(-1, 0, 1), C(1, 0, 1), C(1, 1, 1), C(-1, 1, 1)];
      // 阴影：顶边沿光线方向压到地面
      const toG = p => [p[0] - DOM_L[0] * p[1] / DOM_L[1], 0, p[2] - DOM_L[2] * p[1] / DOM_L[1]];
      shadows.push([v[0], v[1], toG(v[2]), toG(v[3])]);
      const ctr = mul(v.reduce(add, [0, 0, 0]), 1 / 8);
      for (const f of [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]]) {
        const fc = mul(f.reduce((s, q) => add(s, v[q]), [0, 0, 0]), 0.25), n = [fc[0] - ctr[0], fc[1] - ctr[1], fc[2] - ctr[2]];
        const e = [DOM_EYE[0] - fc[0], DOM_EYE[1] - fc[1], DOM_EYE[2] - fc[2]];
        if (n[0] * e[0] + n[1] * e[1] + n[2] * e[2] <= 0) continue;
        const nl = Math.hypot(...n), dif = Math.max(0, (n[0] * DOM_L[0] + n[1] * DOM_L[1] + n[2] * DOM_L[2]) / nl);
        faces.push([Math.hypot(...e), f.map(q => v[q]), dif, i]);
      }
    });
    k.fillStyle = 'rgba(60,50,40,.12)';
    for (const q of shadows) { k.beginPath(); q.forEach((p, j) => { const s = DOM_P(p); j ? k.lineTo(s[0], s[1]) : k.moveTo(s[0], s[1]); }); k.fill(); }
    faces.sort((a, b) => b[0] - a[0]);
    for (const [, q, dif, i] of faces) {
      const base = i % 8 === 0 ? [214, 70, 52] : [26, 26, 30];                  // 每第 8 块为红色
      k.fillStyle = `rgb(${base.map(c => Math.min(255, Math.round(c * 0.5 + c * 0.9 * dif + 18 * dif))).join()})`;
      k.beginPath(); q.forEach((p, j) => { const s = DOM_P(p); j ? k.lineTo(s[0], s[1]) : k.moveTo(s[0], s[1]); }); k.closePath(); k.fill();
    }
    grain(k, 0.05, 'multiply');
  };

  // @element 28
  // 28 不可能三角：18 块方块沿三条边依次从上方落下（0.2–3.5 秒），在等轴视角里首尾相接成彭罗斯三角；整体每周期在画面内转一整圈并轻轻浮动，5.4–6.0 秒淡出
  const PENR_PAL = [['#FFFFFF', '#FF8A5B', '#3D4FD8'], ['#FFF4D6', '#F6B93B', '#2B7A78'], ['#FDE7EF', '#E85D75', '#4A3F8C']];
  const PENR_CUBES = (() => { const c = []; for (let i = 0; i < 6; i++) c.push([i, 0, 0]); for (let i = 0; i < 6; i++) c.push([6, i, 0]); for (let i = 0; i < 6; i++) c.push([6, 6, i]); return c; })();
  const PENR_ISO = (x, y, z) => [(x - y) * 0.866, (x + y) * 0.5 - z];        // 单位等轴投影（边长 1）
  const PENR_BOX = (() => { // 成品三角的中心与外接半径（常量），用来定比例
    const pts = []; for (const [x, y, z] of PENR_CUBES) for (let q = 0; q < 8; q++) pts.push(PENR_ISO(x + (q & 1), y + ((q >> 1) & 1), z + ((q >> 2) & 1)));
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    return [cx, cy, Math.max(...pts.map(p => Math.hypot(p[0] - cx, p[1] - cy)))];
  })();
  CELLS[27] = (k, w, h, u) => {
    const g = k.createLinearGradient(0, 0, CW, CH); g.addColorStop(0, '#F6E7DC'); g.addColorStop(1, '#DCE3F2');
    k.fillStyle = g; k.fillRect(0, 0, CW, CH);
    const S = 98 / PENR_BOX[2], fade = fadeIn(u);                               // 外接圆直径 196px
    const iso = (x, y, z) => { const p = PENR_ISO(x, y, z); return [(p[0] - PENR_BOX[0]) * S, (p[1] - PENR_BOX[1]) * S]; };
    const face = (pts, c) => { k.fillStyle = c; k.strokeStyle = c; k.beginPath(); pts.forEach((p, i) => i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1])); k.closePath(); k.fill(); k.stroke(); };
    const drawCube = (c, idx) => {
      const kk = out3(clamp(((u - 0.2) * 6 - idx) / 3)); if (kk <= 0) return;   // 每块间隔 1/6 秒，0.5 秒落定
      const [x, y, z0] = c, z = z0 + (1 - kk) * 4, p = PENR_PAL[Math.floor(idx / 6)];
      k.globalAlpha = Math.min(1, kk * 1.5) * fade;
      face([iso(x, y, z + 1), iso(x + 1, y, z + 1), iso(x + 1, y + 1, z + 1), iso(x, y + 1, z + 1)], p[0]);
      face([iso(x + 1, y, z), iso(x + 1, y + 1, z), iso(x + 1, y + 1, z + 1), iso(x + 1, y, z + 1)], p[1]);
      face([iso(x, y + 1, z), iso(x + 1, y + 1, z), iso(x + 1, y + 1, z + 1), iso(x, y + 1, z + 1)], p[2]);
      k.globalAlpha = 1;
    };
    k.save(); k.translate(269.5, 104 + Math.sin(TAU * u / CYC) * 4); k.rotate(TAU * u / CYC);   // 每周期转一圈、浮动 ±4px
    k.lineWidth = 0.6;
    PENR_CUBES.map((c, i) => [c, i]).sort((a, b) => (a[0][0] + a[0][1] + a[0][2]) - (b[0][0] + b[0][1] + b[0][2])).forEach(([c, i]) => drawCube(c, i));
    // 首块再画一次并裁到它与末块交叠的六边形里：造成首尾相接的错觉
    k.beginPath(); [iso(0, 1, 0), iso(1, 1, 0), iso(1, 0, 0), iso(1, 0, 1), iso(0, 0, 1), iso(0, 1, 1)].forEach((p, i) => i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1]));
    k.closePath(); k.clip(); drawCube(PENR_CUBES[0], 0);
    k.restore();
    txt(k, 'x + y + z  →  0', 520, 194, `500 8px ${MONO}`, 'rgba(40,40,70,.5)', 'right');
    grain(k, 0.05, 'multiply');
  };

  // @element 29
  // 29 莫比乌斯环：只有一个面的环带绕竖轴在 -0.1–0.7 rad 间往复摆动、俯仰在 0.04–0.16 rad 间轻摆（各每周期一次）；40 道橙粉条纹沿带子流动，每周期前进 8 道
  const MOB_CP = Math.cos(0.36), MOB_SP = Math.sin(0.36);
  const MOB_L = (() => { const v = [-0.4, 0.8, 0.5], l = Math.hypot(...v); return v.map(c => c / l); })();   // 相机空间光线
  CELLS[28] = (k, w, h, u) => {
    const g = k.createLinearGradient(0, 0, 0, CH); g.addColorStop(0, '#1A1C2A'); g.addColorStop(1, '#0B0C12');
    k.fillStyle = g; k.fillRect(0, 0, CW, CH);
    const a = 0.3 + 0.4 * Math.cos(TAU * u / CYC), b = 0.1 + 0.06 * Math.sin(TAU * u / CYC), ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    // 曲面点 → 相机空间 [x, y, 深度]
    const M = (t, v) => {
      const R = 1.7; let x = (R + v * Math.cos(t / 2)) * Math.cos(t), y = v * Math.sin(t / 2), z = (R + v * Math.cos(t / 2)) * Math.sin(t);
      [x, z] = [x * ca - z * sa, x * sa + z * ca]; [y, z] = [y * cb - z * sb, y * sb + z * cb];
      return [x, y * MOB_CP + z * MOB_SP, -y * MOB_SP + z * MOB_CP + 6];
    };
    const pr = p => [269.5 + p[0] * 590 / p[2], 100 - p[1] * 590 / p[2]];
    const shift = 8 * u / CYC, per = TAU / 40, quads = [];
    // 每道条纹拆成「彩色 0.375 + 白色 0.625」两段，段界随相位连续移动，避免条纹按网格跳格
    for (let s = 0; s < 40; s++) {
      const t0 = (s + shift % 1) * per, cuts = [[t0, t0 + 0.375 * per, true], [t0 + 0.375 * per, t0 + per, false]];
      for (const [ta, tb, st] of cuts) {
        const n = st ? 2 : 3;
        for (let q = 0; q < n; q++) for (let j = 0; j < 3; j++) {
          const u0 = ta + (tb - ta) * q / n, u1 = ta + (tb - ta) * (q + 1) / n, v0 = -0.5 + j / 3, v1 = -0.5 + (j + 1) / 3;
          const p = [M(u0, v0), M(u1, v0), M(u1, v1), M(u0, v1)];
          const e1 = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]], e2 = [p[3][0] - p[0][0], p[3][1] - p[0][1], p[3][2] - p[0][2]];
          let nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0];
          const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
          const mx = (p[0][0] + p[2][0]) / 2, my = (p[0][1] + p[2][1]) / 2, mz = (p[0][2] + p[2][2]) / 2, ml = Math.hypot(mx, my, mz);
          if (nx * mx + ny * my + nz * mz > 0) { nx = -nx; ny = -ny; nz = -nz; }   // 法线翻向相机
          const d = Math.max(0, nx * MOB_L[0] + ny * MOB_L[1] - nz * MOB_L[2]);
          const hx = MOB_L[0] - mx / ml, hy = MOB_L[1] - my / ml, hz = -MOB_L[2] - mz / ml, hl = Math.hypot(hx, hy, hz);
          const sp = Math.pow(Math.max(0, (hx * nx + hy * ny + hz * nz) / hl), 40);
          const uu = (((u0 / TAU) % 1) + 1) % 1;
          quads.push([ml, p, d, sp, st, uu]);
        }
      }
    }
    quads.sort((x, y) => y[0] - x[0]);
    k.lineWidth = 0.8;
    for (const [, p, d, sp, st, uu] of quads) {
      const base = st ? lerpC([255, 140, 90], [255, 90, 140], uu) : [240, 236, 228];
      const c = `rgb(${lerpC(base.map(v => Math.min(255, Math.round(v * (0.25 + 0.8 * d)))), [255, 255, 255], sp * 0.5).join()})`;
      k.fillStyle = c; k.strokeStyle = c; k.beginPath();
      p.forEach((q, i) => { const s = pr(q); i ? k.lineTo(s[0], s[1]) : k.moveTo(s[0], s[1]); });
      k.closePath(); k.fill(); k.stroke();
    }
    grain(k, 0.05);
  };

  // @element 30
  // 30 无限镜屋：四色小灯悬在黑色镜屋里、镜面地板倒映；镜头每周期向前推进 4 排灯（灯阵每 4 排重复，天然无缝），灯色沿纵深每周期呼吸 2 次
  const INF_HUES = [320, 40, 185, 265];
  const INF_SPR = INF_HUES.map(hue => { // 每种色相一张光晕贴图（常量），绘制时只缩放贴图
    const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `hsla(${hue},100%,85%,1)`); gr.addColorStop(0.25, `hsla(${hue},95%,60%,.45)`); gr.addColorStop(1, `hsla(${hue},90%,50%,0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
  });
  const INF_LIGHTS = (() => { // [列 x, 高度 y, 排内深度抖动, 色相下标, 相位]，按 (列, 排 mod 4) 生成
    const o = [];
    for (let rm = 0; rm < 4; rm++) for (let i = -8; i <= 8; i++) {
      const s = (rm * 17 + i + 8) * 5 + 3;
      if (hash(s) > 0.8) continue;
      o.push([rm, i * 0.55 + (hash(s + 1) - 0.5) * 0.3, 0.1 + hash(s + 2) * 2.1 - 1.2, (hash(s + 3) - 0.5) * 0.3, Math.floor(hash(s + 4) * 4), hash(s + 4)]);
    }
    return o;
  })();
  const INF_F = 170, INF_HOR = 96, INF_FL = -1.2;
  CELLS[29] = (k, w, h, u) => {
    k.fillStyle = '#020205'; k.fillRect(0, 0, CW, CH);
    const camZ = 2.2 * u / CYC;                                                   // 每周期前进 4 排 × 0.55
    // 地板网格：纵线静态、横线随镜头移动（间距 1.1 = 2 排）
    k.drawImage(layer('INF_floor', g => {
      g.strokeStyle = 'rgba(120,120,160,.08)'; g.lineWidth = 1;
      for (let i = -8; i <= 8; i++) { g.beginPath(); g.moveTo(269.5 + i * 0.8 * INF_F / 0.6, INF_HOR - INF_FL * INF_F / 0.6); g.lineTo(269.5 + i * 0.8 * INF_F / 24, INF_HOR - INF_FL * INF_F / 24); g.stroke(); }
    }), 0, 0);
    k.strokeStyle = 'rgba(120,120,160,.08)'; k.lineWidth = 1;
    for (let q = 0; q < 18; q++) { const zc = q * 1.1 + 0.6 - (camZ % 1.1); if (zc < 0.6) continue; const y = INF_HOR - INF_FL * INF_F / zc; k.beginPath(); k.moveTo(0, y); k.lineTo(CW, y); k.stroke(); }
    k.save(); k.globalCompositeOperation = 'lighter';
    const items = [];
    for (let r = 40; r >= 0; r--) {
      for (const L of INF_LIGHTS) {
        if (L[0] !== r % 4) continue;
        const zc = r * 0.55 + L[3] - camZ;
        if (zc < 0.35 || zc > 19.8) continue;
        items.push([zc, L]);
      }
    }
    items.sort((a, b) => b[0] - a[0]);
    for (const [zc, L] of items) {
      const [, x, y, , hi, kk] = L;
      const br = 0.55 + 0.45 * Math.sin(TAU * 2 * u / CYC - zc * 0.35 + kk * 6);   // 每周期呼吸 2 次，沿纵深错相
      const edge = clamp((19.8 - zc) / 3) * clamp((zc - 0.35) / 1.0);
      const sx = 269.5 + x * INF_F / zc, rr = Math.max(1.2, 9 / zc), al0 = Math.min(1, 6 / zc) * br * edge;
      if (sx < -rr * 4 || sx > CW + rr * 4) continue;
      for (const [yy, m] of [[y, 1], [2 * INF_FL - y, 0.35]]) {
        const sy = INF_HOR - yy * INF_F / zc; if (sy < -rr * 4 || sy > CH + rr * 4) continue;
        k.globalAlpha = Math.min(1, al0 * m); k.drawImage(INF_SPR[hi], sx - rr * 4, sy - rr * 4, rr * 8, rr * 8);
      }
    }
    k.restore();
    k.drawImage(layer('INF_vig', g => { const v = g.createRadialGradient(269.5, 104, 60, 269.5, 104, 330); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = v; g.fillRect(0, 0, CW, CH); }), 0, 0);
    grain(k, 0.05);
  };

  // @element 31
  // 31 黑胶唱片：红底上一张放大裁切的黑胶，沟槽高光固定在光源方向，标签每周期转 4 整圈（37.5 RPM），唱臂已落在沟槽上静止
  const VIN_CX = 215, VIN_CY = 104, VIN_R = 150;
  CELLS[30] = (k, w, h, u) => {
    k.fillStyle = '#E6513A'; k.fillRect(0, 0, CW, CH);
    k.drawImage(layer('VIN_base', g => {
      const bg = g.createLinearGradient(0, 0, 0, CH); bg.addColorStop(0, '#E6513A'); bg.addColorStop(1, '#C23A26'); g.fillStyle = bg; g.fillRect(0, 0, CW, CH);
      g.save(); g.shadowColor = 'rgba(60,10,0,.45)'; g.shadowBlur = 20; g.shadowOffsetY = 10; g.fillStyle = '#0D0D0F'; g.beginPath(); g.arc(VIN_CX, VIN_CY, VIN_R, 0, TAU); g.fill(); g.restore();
      g.lineWidth = 0.6;
      for (let r = VIN_R - 4; r > 52; r -= 1.1) { g.strokeStyle = `rgba(255,255,255,${0.025 + 0.02 * Math.sin(r * 2.6)})`; g.beginPath(); g.arc(VIN_CX, VIN_CY, r, 0, TAU); g.stroke(); }
      // 两道对置的锥形高光（固定在光源方向，不随唱片转）
      if (g.createConicGradient) {
        g.save(); g.globalCompositeOperation = 'lighter';
        for (const off of [0, Math.PI]) {
          const cg = g.createConicGradient(-0.75 + off - 0.25, VIN_CX, VIN_CY);
          cg.addColorStop(0, 'rgba(255,255,255,0)'); cg.addColorStop(0.04, 'rgba(255,255,255,.22)'); cg.addColorStop(0.08, 'rgba(255,255,255,0)'); cg.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = cg; g.beginPath(); g.arc(VIN_CX, VIN_CY, VIN_R - 4, 0, TAU); g.arc(VIN_CX, VIN_CY, 52, 0, TAU, true); g.fill();
        }
        g.restore();
      }
    }), 0, 0);
    k.save(); k.translate(VIN_CX, VIN_CY); k.rotate(TAU * 4 * u / CYC);          // 每周期 4 圈
    k.fillStyle = '#F3E9D6'; k.beginPath(); k.arc(0, 0, 49, 0, TAU); k.fill();
    k.fillStyle = '#E6513A'; k.beginPath(); k.arc(0, 0, 49, -Math.PI / 2, Math.PI / 2); k.fill();
    txt(k, 'SIDE A', 0, -20, `900 10px ${DISP}`, '#141414', 'center', 'middle');
    txt(k, '37.5 RPM', 0, 28, `500 7px ${MONO}`, '#141414', 'center', 'middle');
    k.fillStyle = '#141414'; k.beginPath(); k.arc(0, 0, 3.2, 0, TAU); k.fill();
    k.restore();
    k.drawImage(layer('VIN_arm', g => { // 唱臂：支点 (420,24) → 肘 (402,128) → 唱头 (330,150)
      g.save(); g.fillStyle = 'rgba(60,10,0,.25)'; g.beginPath(); g.arc(424, 30, 20, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(60,10,0,.3)'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(424, 30); g.lineTo(406, 134); g.lineTo(334, 156); g.stroke();
      g.strokeStyle = '#D9D9DC'; g.lineWidth = 4.5; g.beginPath(); g.moveTo(420, 24); g.lineTo(402, 128); g.lineTo(330, 150); g.stroke();
      g.save(); g.translate(330, 150); g.rotate(-0.3); g.fillStyle = '#2A2A2E'; g.fillRect(-12, -6, 20, 12); g.restore();
      g.fillStyle = '#E2E2E5'; g.beginPath(); g.arc(420, 24, 15, 0, TAU); g.fill();
      g.fillStyle = '#B9B9BE'; g.beginPath(); g.arc(420, 24, 6, 0, TAU); g.fill();
      g.fillStyle = '#2A2A2E'; g.fillRect(412, -6, 16, 14);
      g.restore();
    }), 0, 0);
    grain(k, 0.05);
  };

  // @element 32
  // 32 扑克飞牌：绿呢台面上 24 张牌从中间牌堆依次飞出（0.2–1.95 秒）排成扇形，1.9–3.8 秒逐张翻到正面、3.9–5.35 秒逐张翻回背面，5.4–6.26 秒收拢回牌堆
  const CARD_N = 24, CARD_W = 38, CARD_H = 54;
  const CARD_SUIT = ['♠', '♥', '♦', '♣'], CARD_RANK = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const CARD_HATCH = (() => { // 牌背斜纹贴图（常量）
    const c = document.createElement('canvas'); c.width = 8; c.height = 8; const g = c.getContext('2d');
    g.fillStyle = '#8E1E2A'; g.fillRect(0, 0, 8, 8); g.strokeStyle = 'rgba(255,230,200,.35)'; g.lineWidth = 0.7;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(8, 8); g.moveTo(8, 0); g.lineTo(0, 8); g.stroke(); return c;
  })();
  CELLS[31] = (k, w, h, u) => {
    k.fillStyle = '#0A2016'; k.fillRect(0, 0, CW, CH);
    k.drawImage(layer('CARD_bg', g => { const bg = g.createRadialGradient(269.5, 104, 0, 269.5, 104, 300); bg.addColorStop(0, '#1F5A3E'); bg.addColorStop(1, '#0A2016'); g.fillStyle = bg; g.fillRect(0, 0, CW, CH); }), 0, 0);
    const hatch = k.createPattern(CARD_HATCH, 'repeat');
    for (let i = 0; i < CARD_N; i++) {
      const t = i / (CARD_N - 1), back = CARD_N - 1 - i;
      const e = inOut3(seg(u, 0.2 + i * 0.05, 0.8 + i * 0.05)) * (1 - inOut3(seg(u, SHOW + back * 0.02, SHOW + back * 0.02 + 0.4)));
      const a = (t - 0.5) * 1.7 * e;                                              // 扇面总张角 1.7 rad
      const fx = 269.5 + Math.sin(a) * 270, fy = 336 - Math.cos(a) * 270 + Math.sin(t * TAU + TAU * u / CYC) * 6 * e;
      const x = mix(269.5, fx, e), y = mix(118, fy, e) - i * 0.3 * (1 - e);       // 牌堆：每张高 0.3px 叠起
      const fa = Math.PI * (inOut3(seg(u, 1.9 + i * 0.07, 2.2 + i * 0.07)) - inOut3(seg(u, 3.9 + i * 0.05, 4.2 + i * 0.05)));
      const cs = Math.cos(fa), sx = Math.max(0.03, Math.abs(cs)), face = cs < 0;
      k.save(); k.translate(x, y); k.rotate(a); k.scale(sx, 1);
      k.fillStyle = 'rgba(0,0,0,.3)'; rr(k, -CARD_W / 2 + 1.5, -CARD_H / 2 + 2.5, CARD_W, CARD_H, 2.4); k.fill();
      k.fillStyle = '#FAF8F2'; rr(k, -CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 2.4); k.fill();
      if (face) {
        const su = CARD_SUIT[i % 4], col = (su === '♥' || su === '♦') ? '#C8282E' : '#141414';
        txt(k, CARD_RANK[(i * 5) % 13], -CARD_W / 2 + 3, -CARD_H / 2 + 9, `700 8px ${SERIF}`, col);
        txt(k, su, -CARD_W / 2 + 3, -CARD_H / 2 + 17, `400 7px ${SANS}`, col);
        txt(k, su, 0, 4, `400 22px ${SANS}`, col, 'center', 'middle');
      } else {
        k.fillStyle = hatch; rr(k, -CARD_W / 2 + 2.2, -CARD_H / 2 + 2.2, CARD_W - 4.4, CARD_H - 4.4, 1.6); k.fill();
        k.strokeStyle = '#F4E6D0'; k.lineWidth = 0.7; k.strokeRect(-CARD_W / 2 + 3.7, -CARD_H / 2 + 3.7, CARD_W - 7.4, CARD_H - 7.4);
      }
      k.restore();
    }
    grain(k, 0.05);
  };
  // @element 33
  // 改写自 ui2v · illli Ai Studio · hero-receipt-print（MIT-0）
  // 33 小票打印：深色收银机出纸口里，一张热敏小票从上方出纸口缓缓送出，露出店名、三行明细和虚线下的「合计 已发货」。
  // 时间按原作 4.5 秒 × 1.2 映射到 0–5.4 秒展示段：出纸口 0.36–0.96 秒淡入并上移 5px（原 0.3 秒起 0.5 秒、20px，二次缓出）；
  // 小票 1.08–3.96 秒以二次缓出下送 165px（原 0.9 秒起 2.4 秒送 620px），4.08–5.28 秒再以正弦缓入缓出补送 5px（原 3.4 秒起 1 秒补 20px）；
  // 5.4–6.0 秒整体淡出，6.4 秒回到空背景。尺寸换算：出纸口 520×760 → 341×188（宽 ×0.66、高 ×0.25），小票内容重排为 301×130，
  // 终点位置保持原作「小票顶边停在出纸口高度 16% 处」。配色照抄：底 #111827、出纸口 #1f2937 / 内描边 #374151、出纸嘴 #4b5563→#1f2937、
  // 小票 #f9fafb、字 #111827、合计虚线 #9ca3af。
  const RCPT_X = 99, RCPT_Y = 10, RCPT_W = 341, RCPT_H = 188, RCPT_PW = 301, RCPT_PH = 130;
  const RCPT_LINES = [['动效包', '20×'], ['发布', '成功'], ['Lint', '0 错误']];
  const RCPT_qOut = t => 1 - (1 - t) * (1 - t);                       // GSAP power1.out
  const RCPT_sIO = t => -(Math.cos(Math.PI * t) - 1) / 2;              // GSAP sine.inOut
  CELLS[32] = (k, w, h, u) => {
    k.fillStyle = '#111827'; k.fillRect(0, 0, CW, CH);
    const sa = RCPT_qOut(seg(u, 0.36, 0.96)), fade = fadeIn(u);
    const a = sa * fade; if (a <= 0) return;
    // 小票顶边：起点 -130（整张藏在出纸口上方），一段送 164.7px、二段补 5.3px，终点 y=40
    const top = -130 + 164.7 * RCPT_qOut(seg(u, 1.08, 3.96)) + 5.3 * RCPT_sIO(seg(u, 4.08, 5.28));
    k.save(); k.globalAlpha = a; k.translate(0, 5 * (1 - sa));
    // 出纸口外投影（原 0 24px 50px rgba(0,0,0,.35)，以三层半透明圆角块近似）
    for (let i = 0; i < 3; i++) { k.fillStyle = 'rgba(0,0,0,.12)'; rr(k, RCPT_X - 2 - i * 2, RCPT_Y + 6 + i * 2, RCPT_W + 4 + i * 4, RCPT_H, 9 + i * 2); k.fill(); }
    k.fillStyle = '#1f2937'; rr(k, RCPT_X, RCPT_Y, RCPT_W, RCPT_H, 7); k.fill();
    k.save(); rr(k, RCPT_X, RCPT_Y, RCPT_W, RCPT_H, 7); k.clip();
    // 小票（左右各留 20px）
    const px = RCPT_X + 20;
    k.save(); k.translate(px, top);
    k.fillStyle = 'rgba(0,0,0,.25)'; k.fillRect(-2, 3, RCPT_PW + 4, RCPT_PH + 3);
    k.fillStyle = '#f9fafb'; k.fillRect(0, 0, RCPT_PW, RCPT_PH);
    txt(k, 'UI2V 小卖部', 16, 30, `700 15px ${MONO}`, '#111827');
    RCPT_LINES.forEach(([l, r], i) => {
      txt(k, l, 16, 54 + i * 17, `400 12px ${MONO}`, '#111827');
      txt(k, r, RCPT_PW - 16, 54 + i * 17, `400 12px ${MONO}`, '#111827', 'right');
    });
    k.strokeStyle = '#9ca3af'; k.lineWidth = 1.4; k.setLineDash([4, 3]);
    k.beginPath(); k.moveTo(16, 100); k.lineTo(RCPT_PW - 16, 100); k.stroke(); k.setLineDash([]);
    txt(k, '合计', 16, 118, `700 12px ${MONO}`, '#111827');
    txt(k, '已发货', RCPT_PW - 16, 118, `700 12px ${MONO}`, '#111827', 'right');
    k.restore();
    // 出纸嘴：盖在小票上方（原 z-index 2），高 11px
    const mg = k.createLinearGradient(0, RCPT_Y, 0, RCPT_Y + 11); mg.addColorStop(0, '#4b5563'); mg.addColorStop(1, '#1f2937');
    k.fillStyle = mg; k.fillRect(RCPT_X, RCPT_Y, RCPT_W, 11);
    k.restore();
    // 内描边（原 inset 0 0 0 2px #374151）
    k.strokeStyle = '#374151'; k.lineWidth = 1.5; rr(k, RCPT_X + 0.75, RCPT_Y + 0.75, RCPT_W - 1.5, RCPT_H - 1.5, 6.5); k.stroke();
    k.restore();
  };

  // @element 34
  // 改写自 ui2v · illli Ai Studio · hero-barcode-scan（MIT-0）
  // 34 条码扫描：浅灰台面上一张白色装箱单落定，青色激光从左向右扫过 29 根条码，扫完后绿色「已核验 · 可发货」浮现、激光熄灭。
  // 时间按原作 4.5 秒 × 1.2 映射：装箱单 0.18–1.02 秒淡入、上移 9px、由 -0.6° 转正（四次缓出，对应 power3.out）；
  // 激光 0.9–1.14 秒亮起，1.02–3.6 秒以二次缓入缓出扫过 412px（原 2.15 秒扫 1040px，×0.396）；状态字 3.66–4.2 秒淡入上移 3px；
  // 激光 3.78–4.2 秒熄灭；5.4–6.0 秒整单淡出，6.4 秒回到空台面。尺寸换算：装箱单 1240×800 → 491×180，
  // 条码宽度 ×0.8、7px 间距 → 5.6px（共 399px 宽、68px 高）。去掉原作大标题「Barcode Scan」，保留眉题、SKU 行、角标与状态行。
  // 配色照抄：台面 #e2e8f0→#cbd5e1（160°）、单 #fff、条 #0f172a、虚线 #cbd5e1、角标 #94a3b8、眉题 #64748b、SKU #475569、
  // 激光 #06b6d4 / 光晕 #22d3ee、状态 #059669。
  const BARC_W = [12, 4, 18, 6, 10, 4, 22, 7, 5, 15, 4, 20, 8, 6, 14, 4, 24, 9, 5, 16, 7, 11, 4, 19, 8, 6, 13, 5, 17];
  const BARC_SX = 24, BARC_SY = 14, BARC_SW = 491, BARC_SH = 180;
  const BARC_q4o = t => 1 - Math.pow(1 - t, 4);                           // GSAP power3.out
  const BARC_qIO = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2); // GSAP power1.inOut
  const BARC_qOut = t => 1 - (1 - t) * (1 - t);                            // GSAP 默认 power1.out
  CELLS[33] = (k, w, h, u) => {
    k.fillStyle = '#e2e8f0'; k.fillRect(0, 0, CW, CH);
    k.drawImage(layer('BARC_bg', g => {
      const gr = g.createLinearGradient(200, -80, 339, 288); gr.addColorStop(0, '#e2e8f0'); gr.addColorStop(1, '#cbd5e1');
      g.fillStyle = gr; g.fillRect(0, 0, CW, CH);
    }), 0, 0);
    const e = BARC_q4o(seg(u, 0.18, 1.02)), a = e * fadeIn(u);
    if (a <= 0) return;
    k.save(); k.globalAlpha = a;
    k.translate(BARC_SX + BARC_SW / 2, BARC_SY + BARC_SH / 2 + 9 * (1 - e)); k.rotate(-0.6 * Math.PI / 180 * (1 - e));
    k.translate(-BARC_SW / 2, -BARC_SH / 2);
    // 投影（原 0 28px 70px rgba(15,23,42,.18)）
    for (let i = 0; i < 4; i++) { k.fillStyle = 'rgba(15,23,42,.045)'; rr(k, -i * 3, 6 + i * 2, BARC_SW + i * 6, BARC_SH + i * 2, 4 + i * 3); k.fill(); }
    k.fillStyle = '#fff'; rr(k, 0, 0, BARC_SW, BARC_SH, 3); k.fill();
    // 角标
    k.strokeStyle = '#94a3b8'; k.lineWidth = 1.5; k.beginPath(); k.moveTo(BARC_SW - 58, 22); k.lineTo(BARC_SW - 22, 22); k.lineTo(BARC_SW - 22, 58); k.stroke();
    txt(k, '装 箱 单', 22, 27, `600 9px ${SANS}`, '#64748b');
    txt(k, 'SKU · UI2V-MOTION-2048 · 数量 1', 22, 47, `500 12px ${SANS}`, '#475569');
    // 条码区：上下虚线 y=60 / 136，条高 64–132
    k.strokeStyle = '#cbd5e1'; k.lineWidth = 1; k.setLineDash([3, 3]);
    k.beginPath(); k.moveTo(22, 60.5); k.lineTo(BARC_SW - 22, 60.5); k.moveTo(22, 135.5); k.lineTo(BARC_SW - 22, 135.5); k.stroke(); k.setLineDash([]);
    k.fillStyle = '#0f172a';
    let bx = 22; for (const bw of BARC_W) { k.fillRect(bx, 64, bw * 0.8, 68); bx += bw * 0.8 + 5.6; }
    // 激光
    const la = BARC_qOut(seg(u, 0.9, 1.14)) * (1 - BARC_qOut(seg(u, 3.78, 4.2)));
    if (la > 0) {
      const lx = 22 + 412 * BARC_qIO(seg(u, 1.02, 3.6));
      k.save(); k.globalAlpha = a * la;
      const gl = k.createLinearGradient(lx - 14, 0, lx + 17, 0);
      gl.addColorStop(0, 'rgba(34,211,238,0)'); gl.addColorStop(0.45, 'rgba(34,211,238,.85)'); gl.addColorStop(0.55, 'rgba(34,211,238,.85)'); gl.addColorStop(1, 'rgba(34,211,238,0)');
      k.globalAlpha = a * la * 0.55; k.fillStyle = gl; k.fillRect(lx - 14, 60, 31, 76);
      k.globalAlpha = a * la; k.fillStyle = '#06b6d4'; k.fillRect(lx, 60, 3, 76);
      k.restore();
    }
    // 状态行
    const sq = BARC_qOut(seg(u, 3.66, 4.2));
    if (sq > 0) { k.globalAlpha = a * sq; txt(k, '已核验 · 可发货', 22, 164 + 3 * (1 - sq), `600 15px ${SANS}`, '#059669'); }
    k.restore();
  };

  // @element 35
  // 改写自 ui2v · illli Ai Studio · hero-scope-trace（MIT-0）
  // 35 示波器描线：深色示波器面板上，一道竖直扫描光束从左走到右，身后画出青色脉冲波形（三个起伏、振幅逐次减小）。
  // 时间按原作 4.5 秒 × 1.2 映射：面板 0.3–0.96 秒淡入、上移 6px（二次缓出）；光束 0.84–1.08 秒亮起；
  // 0.96–4.08 秒波形与光束同时匀速推进（原 0.8 秒起 2.6 秒、ease none），波形按原作 1400 的虚线长度推进、到原路径全长即画完；
  // 光束 4.08–4.44 秒熄灭；4.2–5.4 秒面板以正弦缓入缓出上浮 2px；5.4–6.0 秒整体淡出，6.4 秒回到空背景。
  // 尺寸换算：面板 920×720 → 511×188；波形框 840×200 → 467×120（横 ×0.556、纵 ×0.6，纵向放大让波形更醒目），网格 80×60 → 44×16。
  // 配色照抄：底 #020617、面板 #04111d / 边 #164e63、网格 rgba(34,211,238,.08/.05)、波形 #22d3ee、光束 rgba(34,211,238,.55)。
  const SCOPE_X = 14, SCOPE_Y = 10, SCOPE_W = 511, SCOPE_H = 188, SCOPE_WX = 22.2, SCOPE_WY = 34, SCOPE_KX = 0.5554, SCOPE_KY = 0.6;
  const SCOPE_PATH = (() => { // 原作 SVG 路径（840×200 坐标）：C 段后接 6 个 S 段，S 的第一控制点取上一段第二控制点的对称点
    const segs = [[[0, 100], [60, 100], [60, 30], [120, 30]]];
    const S = [[180, 170, 240, 170], [300, 40, 360, 40], [420, 160, 480, 160], [540, 50, 600, 50], [660, 140, 720, 140], [780, 100, 840, 100]];
    for (const [c2x, c2y, ex, ey] of S) { const p = segs[segs.length - 1]; segs.push([p[3], [2 * p[3][0] - p[2][0], 2 * p[3][1] - p[2][1]], [c2x, c2y], [ex, ey]]); }
    const pts = [[0, 100]], cum = [0];
    for (const [a, b, c, d] of segs) for (let i = 1; i <= 40; i++) {
      const t = i / 40, m = 1 - t;
      const x = m * m * m * a[0] + 3 * m * m * t * b[0] + 3 * m * t * t * c[0] + t * t * t * d[0];
      const y = m * m * m * a[1] + 3 * m * m * t * b[1] + 3 * m * t * t * c[1] + t * t * t * d[1];
      const q = pts[pts.length - 1]; cum.push(cum[cum.length - 1] + Math.hypot(x - q[0], y - q[1])); pts.push([x, y]);
    }
    return { pts, cum, L: cum[cum.length - 1] };
  })();
  const SCOPE_qOut = t => 1 - (1 - t) * (1 - t);
  const SCOPE_sIO = t => -(Math.cos(Math.PI * t) - 1) / 2;
  CELLS[34] = (k, w, h, u) => {
    k.fillStyle = '#020617'; k.fillRect(0, 0, CW, CH);
    const e = SCOPE_qOut(seg(u, 0.3, 0.96)), a = e * fadeIn(u);
    if (a <= 0) return;
    const dy = 6 * (1 - e) - 2 * SCOPE_sIO(seg(u, 4.2, 5.4));
    k.save(); k.globalAlpha = a; k.translate(0, dy);
    k.drawImage(layer('SCOPE_panel', g => {
      g.fillStyle = '#04111d'; rr(g, SCOPE_X, SCOPE_Y, SCOPE_W, SCOPE_H, 6); g.fill();
      g.save(); rr(g, SCOPE_X, SCOPE_Y, SCOPE_W, SCOPE_H, 6); g.clip();
      g.fillStyle = 'rgba(34,211,238,.08)'; for (let y = 0; y < SCOPE_H; y += 16) g.fillRect(SCOPE_X, SCOPE_Y + y, SCOPE_W, 1);
      g.fillStyle = 'rgba(34,211,238,.05)'; for (let x = 0; x < SCOPE_W; x += 44) g.fillRect(SCOPE_X + x, SCOPE_Y, 1, SCOPE_H);
      g.restore();
      g.strokeStyle = '#164e63'; g.lineWidth = 1.2; rr(g, SCOPE_X + 0.6, SCOPE_Y + 0.6, SCOPE_W - 1.2, SCOPE_H - 1.2, 6); g.stroke();
    }), 0, 0);
    const p = seg(u, 0.96, 4.08), vis = Math.min(SCOPE_PATH.L, 1400 * p);      // 原作 dasharray 1400：可见长度 = 1400 × 进度
    const ox = SCOPE_X + SCOPE_WX, oy = SCOPE_Y + SCOPE_WY;
    if (vis > 0) {
      const { pts, cum } = SCOPE_PATH;
      k.beginPath(); k.moveTo(ox + pts[0][0] * SCOPE_KX, oy + pts[0][1] * SCOPE_KY);
      for (let i = 1; i < pts.length; i++) {
        if (cum[i] <= vis) { k.lineTo(ox + pts[i][0] * SCOPE_KX, oy + pts[i][1] * SCOPE_KY); continue; }
        const t = (vis - cum[i - 1]) / (cum[i] - cum[i - 1]);
        k.lineTo(ox + mix(pts[i - 1][0], pts[i][0], t) * SCOPE_KX, oy + mix(pts[i - 1][1], pts[i][1], t) * SCOPE_KY); break;
      }
      k.lineCap = 'round'; k.lineJoin = 'round';
      k.strokeStyle = 'rgba(34,211,238,.22)'; k.lineWidth = 7; k.stroke();      // 原 drop-shadow 8px 的光晕
      k.strokeStyle = '#22d3ee'; k.lineWidth = 2.2; k.stroke();
    }
    const ba = SCOPE_qOut(seg(u, 0.84, 1.08)) * (1 - SCOPE_qOut(seg(u, 4.08, 4.44)));
    if (ba > 0) {
      const bx = ox + 840 * p * SCOPE_KX;
      k.save(); k.beginPath(); rr(k, SCOPE_X, SCOPE_Y, SCOPE_W, SCOPE_H, 6); k.clip();
      const gb = k.createLinearGradient(bx - 9, 0, bx + 9, 0);
      gb.addColorStop(0, 'rgba(34,211,238,0)'); gb.addColorStop(0.5, 'rgba(34,211,238,.6)'); gb.addColorStop(1, 'rgba(34,211,238,0)');
      k.globalAlpha = a * ba * 0.45; k.fillStyle = gb; k.fillRect(bx - 9, SCOPE_Y, 18, SCOPE_H);
      k.globalAlpha = a * ba; k.fillStyle = 'rgba(34,211,238,.55)'; k.fillRect(bx - 0.85, SCOPE_Y, 1.7, SCOPE_H);
      k.restore();
    }
    k.restore();
  };

  // @shared
  // 36–39 改写自 KittenJam Motion Library（Hannah 整理，MIT）的共用件：按下标与通道取确定性"随机"值、模拟鼠标指针、点击涟漪
  const kjHash = (i, ch = 0) => hash(i * 7.31 + ch * 113.7);
  // 模拟鼠标指针，箭头尖端 (x, y) 为热点；press 0→1 为按下，箭头缩小 12%
  function kjCursor(k, x, y, press = 0, dark = false) {
    const s = 1 - 0.12 * press;
    k.save(); k.translate(x, y); k.scale(s, s);
    k.beginPath(); k.moveTo(0, 0); k.lineTo(0, 17); k.lineTo(4.5, 13); k.lineTo(7.5, 19.5); k.lineTo(10.5, 18.2); k.lineTo(7.6, 11.8); k.lineTo(13, 11.8); k.closePath();
    k.fillStyle = dark ? '#16151B' : '#FFFFFF'; k.fill(); k.strokeStyle = dark ? '#FFFFFF' : '#16151B'; k.lineWidth = 1.3; k.lineJoin = 'round'; k.stroke();
    k.restore();
  }
  // 点击涟漪：t 0→1 时半径 0→r、透明度 a→0
  function kjRipple(k, x, y, t, r = 22, col = '255,255,255', a = 0.7) {
    if (t <= 0 || t >= 1) return;
    k.save(); k.strokeStyle = `rgba(${col},${a * (1 - t)})`; k.lineWidth = 2;
    k.beginPath(); k.arc(x, y, r * out3(t), 0, TAU); k.stroke(); k.restore();
  }

  // @element 36
  // 改写自 KittenJam Motion Library #99 彩纸爆发（Hannah 整理）：标题「恭喜」先 0.25 秒收缩到 0.6 倍，再以 elastic.out(1, 0.4) 0.8 秒弹回，
  // 同时从卡片 62% 高处喷出 60 片彩纸：初速 187–374px/s、角度 215°–325°、重力 395px/s² 的抛物线，旋转 ±540°/2 秒并翻面，2 秒寿命的最后 0.5 秒淡出。
  // 每 3.2 秒喷一次、一个周期两次；两次之间彩纸已全部消失、标题回到 1 倍，因此循环无缝。原作每次 36 片、无收缩预备。
  const CONF_N = 60, CONF_GAP = 3.2, CONF_T0 = 0.25, CONF_LIFE = 2.0;
  const CONF_X = 269.5, CONF_Y = 129, CONF_G = 395;   // 喷口 = 卡片宽的中点、高的 62%；重力 = 1.9 × 卡片高
  const CONF_COLS = ['#ff5d73', '#ffd23f', '#3ec7ff', '#7cf29a', '#b78bff'];
  const CONF_el = t => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t - 0.1) * TAU / 0.4) + 1); // GSAP elastic.out(1, .4)
  CELLS[35] = (k, w, h, u) => {
    k.drawImage(layer('CONF_bg', g => {
      g.fillStyle = '#15121f'; g.fillRect(0, 0, CW, CH);
      const gr = g.createRadialGradient(269.5, 100, 0, 269.5, 100, 260);
      gr.addColorStop(0, 'rgba(120,80,200,.28)'); gr.addColorStop(1, 'rgba(120,80,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, CW, CH);
    }), 0, 0);
    const b = Math.floor(u / CONF_GAP), tl = u - b * CONF_GAP;                    // 第几次喷发、本次内的时间
    const sc = tl < CONF_T0 ? 1 - 0.4 * inOut3(tl / CONF_T0) : 0.6 + 0.4 * CONF_el((tl - CONF_T0) / 0.8);
    k.save(); k.translate(269.5, 100); k.scale(sc, sc);
    txt(k, '恭喜', 0, 0, `800 64px ${SANS}`, '#ffffff', 'center', 'middle'); k.restore();
    const t = tl - CONF_T0;
    if (t <= 0 || t >= CONF_LIFE) return;
    k.save(); k.globalAlpha = 1 - seg(t, 1.5, 2.0);
    for (let i = 0; i < CONF_N; i++) {
      const s = b * CONF_N + i;                                                   // 两次喷发用不同的种子
      const v = mix(187, 374, kjHash(s, 1)), an = (215 + 110 * kjHash(s, 2)) * Math.PI / 180;
      const x = CONF_X + v * Math.cos(an) * t, y = CONF_Y + v * Math.sin(an) * t + 0.5 * CONF_G * t * t;
      if (y > CH + 12 || x < -12 || x > CW + 12) continue;
      const rot = kjHash(s, 3) * TAU + (kjHash(s, 4) * 2 - 1) * 3 * Math.PI * t / CONF_LIFE;
      const flip = Math.cos(TAU * (1 + kjHash(s, 5)) * t + kjHash(s, 6) * TAU);  // 每秒翻面 1–2 圈
      k.save(); k.translate(x, y); k.rotate(rot); k.scale(1, flip);
      k.fillStyle = CONF_COLS[i % 5]; k.fillRect(-4, -2.5, 8, 5); k.restore();
    }
    k.restore();
  };

  // @element 37
  // 改写自 KittenJam Motion Library #174 飘落花瓣（Hannah 整理）：40 片花瓣下落、左右摆、旋转，scaleX = cos 模拟翻面；
  // 模拟光标 0.8–4.0 秒从左到右横扫一次，经过 52px 内的花瓣被推开最多 46px（随光标方向并背离光标），0.35 秒达到最远后指数回落到原轨迹。
  // 下落、摆动、旋转、翻面在 6.4 秒内都是整数圈，被推的时刻按光标轨迹预先解出，因此每帧只按 u 解析计算。
  const PET_N = 40, PET_SPAN = CH + 40, PET_R = 52, PET_PUSH = 46, PET_TAU = 0.35;
  const PET_cur = s => { const e = inOut3(seg(s, 0.8, 4.0)); return [mix(-16, 555, e), mix(64, 132, e) + 22 * Math.sin(e * TAU)]; };
  const PET_nat = (p, s) => [p.x0 + p.amp * Math.sin(TAU * p.m * s / CYC + p.ph), ((p.y0 + p.n * PET_SPAN * s / CYC) % PET_SPAN) - 20];
  const PET = Array.from({ length: PET_N }, (_, i) => {
    const p = {
      x0: kjHash(i, 11) * CW, y0: kjHash(i, 12) * PET_SPAN, n: 1 + Math.floor(kjHash(i, 13) * 2),   // 每周期落 1 或 2 个跨度（248px）
      amp: 8 + 14 * kjHash(i, 14), m: 1 + Math.floor(kjHash(i, 15) * 3), ph: kjHash(i, 16) * TAU,     // 摆幅 8–22px，每周期 1–3 次
      r: 4 + 4 * kjHash(i, 17), a0: kjHash(i, 18) * TAU, rv: [-2, -1, 1, 2][Math.floor(kjHash(i, 19) * 4)],
      f: 2 + Math.floor(kjHash(i, 20) * 3), fp: kjHash(i, 21) * TAU, tc: -1, k: 0, dx: 0, dy: 0
    };
    // 解光标经过该花瓣的时刻：光标 x 单调，反复用"花瓣此刻的 x"反查光标时刻（二分），三次即收敛
    let s = 2.4;
    for (let j = 0; j < 3; j++) {
      const px = PET_nat(p, s)[0];
      if (px < -16 || px > 555) { s = -1; break; }
      let lo = 0.8, hi = 4.0;
      for (let q = 0; q < 18; q++) { const mid = (lo + hi) / 2; if (PET_cur(mid)[0] < px) lo = mid; else hi = mid; }
      s = (lo + hi) / 2;
    }
    if (s > 0) {
      const [px, py] = PET_nat(p, s), [cx, cy] = PET_cur(s), d = Math.hypot(px - cx, py - cy);
      if (d < PET_R) {
        const a = PET_cur(s - 0.01), b = PET_cur(s + 0.01), vl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        let dx = (px - cx) / (d || 1) * 0.6 + (b[0] - a[0]) / vl, dy = (py - cy) / (d || 1) * 0.6 + (b[1] - a[1]) / vl;
        const dl = Math.hypot(dx, dy) || 1;
        Object.assign(p, { tc: s, k: 1 - d / PET_R, dx: dx / dl, dy: dy / dl });
      }
    }
    return p;
  });
  CELLS[36] = (k, w, h, u) => {
    k.drawImage(layer('PET_bg', g => {
      const gr = g.createLinearGradient(0, 0, 0, CH); gr.addColorStop(0, '#1b1426'); gr.addColorStop(1, '#2e1b2f');
      g.fillStyle = gr; g.fillRect(0, 0, CW, CH);
    }), 0, 0);
    for (const p of PET) {
      let [x, y] = PET_nat(p, u);
      if (p.tc > 0 && u > p.tc) {                                                 // 推开位移：t/τ·e^(1−t/τ)，τ 时最远
        const q = (u - p.tc) / PET_TAU, g = q * Math.exp(1 - q) * p.k * PET_PUSH * (1 - seg(u, 5.4, 6.2)); // 残余位移在 6.2 秒前归零
        x += p.dx * g; y += p.dy * g;
      }
      k.save(); k.translate(x, y); k.rotate(p.a0 + TAU * p.rv * u / CYC);
      k.scale(Math.cos(TAU * p.f * u / CYC + p.fp), 1);                           // 翻面：每周期 2–4 次
      k.fillStyle = 'rgba(255,183,213,.9)'; k.beginPath(); k.ellipse(0, 0, p.r, p.r * 0.62, 0, 0, TAU); k.fill();
      k.fillStyle = 'rgba(255,140,190,.9)'; k.beginPath(); k.ellipse(p.r * 0.35, 0, p.r * 0.3, p.r * 0.2, 0, 0, TAU); k.fill();
      k.restore();
    }
    const [cx, cy] = PET_cur(u);
    kjCursor(k, cx, cy);
  };

  // @element 38
  // 改写自 KittenJam Motion Library #181 烟火（Hannah 整理）：夜空，模拟光标依次点击三处（0.9、2.3、3.7 秒），点击时箭头缩 12% 并出现涟漪；
  // 每次点击从底部升起一枚烟火，0.7 秒（三次缓出）到达点击处炸开 40 颗火花：初速 70–140px/s、阻力系数 1.8/s、重力 120px/s²，1.4 秒内淡出。
  // 光标 4.6–5.6 秒回到右下角原位；最后一朵 5.8 秒熄灭，6.4 秒与开头同一画面。原作为随机自动施放与真实点击。
  const FW_SHOTS = [{ x: 150, y: 62, t: 0.9, hue: 42 }, { x: 392, y: 52, t: 2.3, hue: 196 }, { x: 268, y: 86, t: 3.7, hue: 322 }];
  const FW_REST = [470, 176], FW_MOVES = [[0.3, 0.85], [1.6, 2.25], [3.0, 3.65], [4.6, 5.6]];
  const FW_RISE = 0.7, FW_N = 40, FW_LIFE = 1.4, FW_DRAG = 1.8, FW_G = 120, FW_V = 140;
  // 带线性阻力与重力的解析位移（不逐帧累加）
  const FW_pos = (vx, vy, t) => { const e = (1 - Math.exp(-FW_DRAG * t)) / FW_DRAG; return [vx * e, vy * e + FW_G / FW_DRAG * (t - e)]; };
  CELLS[37] = (k, w, h, u) => {
    k.drawImage(layer('FW_bg', g => {
      const gr = g.createLinearGradient(0, 0, 0, CH); gr.addColorStop(0, '#060a1c'); gr.addColorStop(1, '#1a1838');
      g.fillStyle = gr; g.fillRect(0, 0, CW, CH);
      for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${0.15 + 0.45 * kjHash(i, 40)})`; g.fillRect(kjHash(i, 41) * CW, kjHash(i, 42) * CH * 0.8, 1.2, 1.2); }
    }), 0, 0);
    k.save(); k.globalCompositeOperation = 'lighter'; k.lineCap = 'round';
    FW_SHOTS.forEach((f, j) => {
      const tr = u - f.t, te = tr - FW_RISE;
      if (tr > 0 && tr < FW_RISE) {                                              // 上升中的火箭与尾迹
        const sx = f.x + (kjHash(j, 31) - 0.5) * 60, sy = CH + 4;
        const at = s => { const e = out3(clamp(s / FW_RISE)); return [mix(sx, f.x, e), mix(sy, f.y, e)]; };
        const [x0, y0] = at(Math.max(0, tr - 0.12)), [x1, y1] = at(tr);
        k.strokeStyle = `hsla(${f.hue},100%,75%,.5)`; k.lineWidth = 1.5; k.beginPath(); k.moveTo(x0, y0); k.lineTo(x1, y1); k.stroke();
        k.fillStyle = `hsl(${f.hue},100%,80%)`; k.beginPath(); k.arc(x1, y1, 2, 0, TAU); k.fill();
      }
      if (te > 0 && te < FW_LIFE) {
        glow(k, f.x, f.y, 34, '255,240,220', 0.45 * (1 - seg(te, 0, 0.3)));     // 炸开瞬间的闪光
        const life = 1 - te / FW_LIFE;
        for (let i = 0; i < FW_N; i++) {
          const s = j * FW_N + i, an = TAU * kjHash(s, 32), v = FW_V * (0.5 + 0.5 * kjHash(s, 33));
          const vx = Math.cos(an) * v, vy = Math.sin(an) * v;
          const [ax, ay] = FW_pos(vx, vy, Math.max(0, te - 0.1)), [bx, by] = FW_pos(vx, vy, te);
          const col = `hsla(${f.hue + (kjHash(s, 34) - 0.5) * 40},100%,65%,`;
          k.strokeStyle = col + life * 0.5 + ')'; k.lineWidth = 1.4; k.beginPath(); k.moveTo(f.x + ax, f.y + ay); k.lineTo(f.x + bx, f.y + by); k.stroke();
          k.fillStyle = col + life + ')'; k.beginPath(); k.arc(f.x + bx, f.y + by, 1.8, 0, TAU); k.fill();
        }
      }
    });
    k.restore();
    // 光标：原位 → 三个点击处 → 回原位（三次缓入缓出）
    const pts = [FW_REST, ...FW_SHOTS.map(f => [f.x, f.y]), FW_REST];
    let cx = FW_REST[0], cy = FW_REST[1];
    FW_MOVES.forEach(([a, b], i) => { if (u >= a) { const e = inOut3(seg(u, a, b)); cx = mix(pts[i][0], pts[i + 1][0], e); cy = mix(pts[i][1], pts[i + 1][1], e); } });
    let press = 0;
    for (const f of FW_SHOTS) {
      press = Math.max(press, seg(u, f.t - 0.06, f.t) * (1 - seg(u, f.t + 0.06, f.t + 0.2)));
      kjRipple(k, f.x, f.y, seg(u, f.t, f.t + 0.5), 22, `${f.hue < 100 ? '255,214,120' : f.hue < 250 ? '120,220,255' : '255,140,220'}`);
    }
    kjCursor(k, cx, cy, press);
  };

  // @element 39
  // 改写自 KittenJam Motion Library #54 封锁胶带（Hannah 整理）：两条黄色警示胶带（高 34px、上下 4px 黑边、投影）分别倾斜 −15° 与 13° 交叉成 X，
  // 带上重复的「禁止进入 · 」反向滑动：上层每周期左移 4 个文字单元、下层右移 3 个；滑动距离是单元宽的整数倍，循环无缝。
  const TAPE_TXT = '禁止进入 · ', TAPE_H = 34, TAPE_B = 4, TAPE_L = 840;
  const TAPE_BANDS = [{ y: 112, deg: 13, dir: 1, n: 3 }, { y: 96, deg: -15, dir: -1, n: 4 }]; // 先画下层（13°），再画上层（−15°）
  CELLS[38] = (k, w, h, u) => {
    k.drawImage(layer('TAPE_bg', g => {
      g.fillStyle = '#18171d'; g.fillRect(0, 0, CW, CH);
      const gr = g.createRadialGradient(269.5, 104, 40, 269.5, 104, 320);
      gr.addColorStop(0, 'rgba(255,255,255,.05)'); gr.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = gr; g.fillRect(0, 0, CW, CH);
    }), 0, 0);
    k.font = `800 16px ${SANS}`;
    const uw = k.measureText(TAPE_TXT).width;                                       // 文字单元宽，随系统字体而定
    for (const b of TAPE_BANDS) {
      k.save(); k.translate(269.5, b.y); k.rotate(b.deg * Math.PI / 180);
      k.save(); k.shadowColor = 'rgba(0,0,0,.55)'; k.shadowBlur = 18; k.shadowOffsetY = 8;
      k.fillStyle = '#ffd400'; k.fillRect(-TAPE_L / 2, -TAPE_H / 2, TAPE_L, TAPE_H); k.restore();
      k.fillStyle = '#111111';
      k.fillRect(-TAPE_L / 2, -TAPE_H / 2, TAPE_L, TAPE_B); k.fillRect(-TAPE_L / 2, TAPE_H / 2 - TAPE_B, TAPE_L, TAPE_B);
      const off = (((b.dir * b.n * uw * u / CYC) % uw) + uw) % uw;
      k.textAlign = 'left'; k.textBaseline = 'middle';
      for (let x = -TAPE_L / 2 - uw + off; x < TAPE_L / 2; x += uw) k.fillText(TAPE_TXT, x, 1);
      k.restore();
    }
  };

  // @element 40
  // 改写自 KittenJam Motion Library #175 数字雨（Hannah 整理）：卡片按 14px 字级分成 39 列，每列一串字符匀速下落，最前端的字白亮带光，后面 10–18 格逐渐变暗成绿色拖尾；
  // 每列的起点、速度（每周期落 1–3 个跨度）与拖尾长度按下标确定；前 3 格每 0.1 秒换字（一周期 64 次）、更后面每 0.4 秒换字，循环无缝。原作逐帧半透明覆盖、随机重置。
  const MRN_FS = 14, MRN_COLS = Math.ceil(CW / MRN_FS), MRN_ROWS = Math.ceil(CH / MRN_FS), MRN_SPAN = MRN_ROWS + 24;
  const MRN_GL = [...'0123456789アイウエオカキクケコサシスセソタチツテトナニヌネハヒフヘホマミムメモヤユヨラリルレロワABCDEFZ'];
  CELLS[39] = (k, w, h, u) => {
    k.fillStyle = '#020a06'; k.fillRect(0, 0, CW, CH);
    const step = Math.floor(u * 10 + 1e-6) % 64;
    k.font = `600 ${MRN_FS}px ${MONO}`; k.textAlign = 'center'; k.textBaseline = 'top';
    for (let c = 0; c < MRN_COLS; c++) {
      const n = 1 + Math.floor(kjHash(c, 51) * 3), len = 10 + Math.floor(kjHash(c, 52) * 9);
      const head = (kjHash(c, 53) * MRN_SPAN + n * MRN_SPAN * u / CYC) % MRN_SPAN - 4;   // 以格为单位，-4 起让字从卡片上方进入
      const hr = Math.floor(head), x = c * MRN_FS + MRN_FS / 2;
      for (let j = 0; j <= len; j++) {
        const r = hr - j; if (r < 0 || r >= MRN_ROWS) continue;
        // 字符按 (列, 行, 换字步) 取固定值；拖尾后段换得慢
        const gs = j < 3 ? step : Math.floor(step / 4);
        const g = MRN_GL[Math.floor(kjHash(c * 97 + r, 54 + gs) * MRN_GL.length) % MRN_GL.length];
        const y = r * MRN_FS;
        if (j === 0) { glow(k, x, y + MRN_FS / 2, 14, '120,255,170', 0.35); k.fillStyle = '#eafff0'; }
        else k.fillStyle = `rgba(60,230,120,${(1 - j / (len + 1)) * 0.9})`;
        k.fillText(g, x, y);
      }
    }
    // 上下暗边：字从暗处出现、在暗处消失
    const gr = k.createLinearGradient(0, 0, 0, CH);
    gr.addColorStop(0, 'rgba(2,10,6,.7)'); gr.addColorStop(0.18, 'rgba(2,10,6,0)'); gr.addColorStop(0.82, 'rgba(2,10,6,0)'); gr.addColorStop(1, 'rgba(2,10,6,.7)');
    k.fillStyle = gr; k.fillRect(0, 0, CW, CH);
  };

  // @element 41
  // 改写自 KittenJam Motion Library #56 文字走廊（Hannah 整理）：一点透视的走廊，地板、天花板、左右墙面铺满重复的「文字走廊」，深度 z = 0.5–8 切成 15 段（段深 0.5），
  // 所有段向观者移动，6.4 秒前进 4 段（段深的整数倍，循环无缝）；远处 3 个单位内淡入、近处移出画面，消失点有暗色光晕。焦距 300px，走廊半宽 1、半高 0.5。
  const CORR_F = 300, CORR_DZ = 0.5, CORR_N = 15, CORR_Z0 = 0.5, CORR_TXT = '文字走廊文字走廊';
  const CORR_COLS = ['#ff8c78', '#96aaff', '#ffd678', '#78e6c8'];   // 地板、天花板、左墙、右墙
  const CORR_STRIP = CORR_COLS.map(col => {                          // 每面一张预先上色的字带（常量）
    const c = document.createElement('canvas'); c.width = 512; c.height = 64; const g = c.getContext('2d');
    g.font = `900 52px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col;
    [...CORR_TXT].forEach((ch, i, a) => g.fillText(ch, (i + 0.5) * 512 / a.length, 34));
    return c;
  });
  CELLS[40] = (k, w, h, u) => {
    k.fillStyle = '#0d0b1a'; k.fillRect(0, 0, CW, CH);
    const cx = CW / 2, cy = CH / 2, ZF = CORR_Z0 + CORR_N * CORR_DZ;
    const sx = z => CORR_F / z, sy = z => 0.5 * CORR_F / z;
    const nx = sx(CORR_Z0), ny = sy(CORR_Z0), fx = sx(ZF), fy = sy(ZF);
    // 四个面在 z=0.5 与 z=8 之间的梯形，用来裁切每段的字带
    const SURF = [
      { poly: [[cx - nx, cy + ny], [cx + nx, cy + ny], [cx + fx, cy + fy], [cx - fx, cy + fy]], wall: false, s: 1 },
      { poly: [[cx - nx, cy - ny], [cx + nx, cy - ny], [cx + fx, cy - fy], [cx - fx, cy - fy]], wall: false, s: -1 },
      { poly: [[cx - nx, cy - ny], [cx - fx, cy - fy], [cx - fx, cy + fy], [cx - nx, cy + ny]], wall: true, s: -1 },
      { poly: [[cx + nx, cy - ny], [cx + fx, cy - fy], [cx + fx, cy + fy], [cx + nx, cy + ny]], wall: true, s: 1 }
    ];
    const off = (u / CYC * 4 * CORR_DZ) % CORR_DZ;
    for (let i = CORR_N - 1; i >= -1; i--) {                                        // 由远到近画；i = −1 是正在移出画面的一段
      const z = Math.max(0.1, CORR_Z0 + i * CORR_DZ + CORR_DZ - off), z2 = CORR_Z0 + (i + 2) * CORR_DZ - off;   // 本段近边 z、远边 z2
      const a = clamp((ZF - z) / 3) * 0.8;
      if (a <= 0) continue;
      SURF.forEach((S, si) => {
        k.save(); k.beginPath(); S.poly.forEach((p, q) => q ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1])); k.closePath(); k.clip();
        k.globalAlpha = a;
        if (!S.wall) {
          const y1 = cy + S.s * sy(z), y2 = cy + S.s * sy(z2);
          k.translate(cx, (y1 + y2) / 2); if (S.s < 0) k.scale(1, -1);
          k.drawImage(CORR_STRIP[si], -sx(z), -Math.abs(y1 - y2) / 2, 2 * sx(z), Math.abs(y1 - y2));
        } else {
          const x1 = cx + S.s * sx(z), x2 = cx + S.s * sx(z2);
          k.translate((x1 + x2) / 2, cy); k.rotate(S.s * Math.PI / 2);              // 旋转后局部 x 轴沿屏幕竖直方向
          k.drawImage(CORR_STRIP[si], -sy(z), -Math.abs(x1 - x2) / 2, 2 * sy(z), Math.abs(x1 - x2));
        }
        k.restore();
      });
    }
    k.strokeStyle = 'rgba(255,255,255,.12)'; k.lineWidth = 1;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { k.beginPath(); k.moveTo(cx + a * nx, cy + b * ny); k.lineTo(cx + a * fx, cy + b * fy); k.stroke(); });
    const gr = k.createRadialGradient(cx, cy, 0, cx, cy, 90);
    gr.addColorStop(0, 'rgba(8,6,16,1)'); gr.addColorStop(0.45, 'rgba(8,6,16,.75)'); gr.addColorStop(1, 'rgba(8,6,16,0)');
    k.fillStyle = gr; k.fillRect(0, 0, CW, CH);
  };

  // @element 42
  // 改写自 KittenJam Motion Library #230 起伏线条（Hannah 整理）：26 条水平细线，每条取 80 个点，y = 基准 + 7·sin(0.018x + 2πu/6.4 + 0.35j) + 4·sin(0.043x − 4πu/6.4 + 0.35j)，
  // 相邻线相位错开，每 5 条有一条较粗较亮。模拟光标 0.8–5.4 秒从卡片左外侧 −200px 扫到右外侧 740px（上下起伏 46px），附近的线被高斯形（σx 56px、σy 40px）平滑拱起最多 26px，离开后恢复。原作为真实鼠标。
  const WAVY_N = 26, WAVY_P = 80;
  const WAVY_cur = u => { const e = inOut3(seg(u, 0.8, 5.4)); return [mix(-200, 740, e), 104 + 46 * Math.sin(e * TAU * 1.25)]; };
  CELLS[41] = (k, w, h, u) => {
    k.drawImage(layer('WAVY_bg', g => {
      const gr = g.createLinearGradient(0, 0, CW, CH); gr.addColorStop(0, '#101828'); gr.addColorStop(1, '#1d1430');
      g.fillStyle = gr; g.fillRect(0, 0, CW, CH);
    }), 0, 0);
    const [mx, my] = WAVY_cur(u);
    const ph = TAU * u / CYC, gap = (CH - 24) / (WAVY_N - 1);
    k.lineJoin = 'round';
    for (let j = 0; j < WAVY_N; j++) {
      const base = 12 + j * gap, hi = j % 5 === 2;
      k.beginPath();
      for (let p = 0; p < WAVY_P; p++) {
        const x = p / (WAVY_P - 1) * CW;
        let y = base + 7 * Math.sin(x * 0.018 + ph + j * 0.35) + 4 * Math.sin(x * 0.043 - 2 * ph + j * 0.35);
        y -= 26 * Math.exp(-((x - mx) * (x - mx)) / (2 * 56 * 56) - ((base - my) * (base - my)) / (2 * 40 * 40));
        p ? k.lineTo(x, y) : k.moveTo(x, y);
      }
      k.strokeStyle = hi ? 'rgba(140,220,255,.85)' : `rgba(170,160,230,${(0.22 + 0.12 * Math.sin(j * 0.7)).toFixed(3)})`;
      k.lineWidth = hi ? 2 : 1; k.stroke();
    }
    kjCursor(k, mx, my);
  };

  // @element 43
  // 飘雪（参考镜语「飘雪」词条的说明重新实现）：夜晚街道，雪片分远、中、近三层。远层小而清楚、落得慢；
  // 近层大而虚成光斑、落得快；每片一边下落一边左右漂。经过路灯的光锥时被照成暖白色。
  // 循环无缝：每层在 6.4 秒内正好落完整数趟（远 1 趟、中 2 趟、近 3 趟），左右漂移也是整数个来回。持续下雪，不走复位段。
  // 区别于均匀下落的白点：大小、速度、虚实都随深度变化。
  const SN_LAMP = [392, 70], SN_GROUND = 186;            // 灯头位置；地面高度
  const SN_LAYERS = [                                    // n：每周期落几趟；r：半径范围；a：不透明度；soft：画成柔边光斑
    { count: 70, n: 1, r: [0.7, 1.3], a: 0.75, sway: 6, soft: false },
    { count: 36, n: 2, r: [1.6, 2.4], a: 0.85, sway: 12, soft: false },
    { count: 9, n: 3, r: [6, 10], a: 0.32, sway: 22, soft: true }
  ];
  const SN_M = 14;                                       // 上下各留出的余量，雪片在画面外换行
  // 光锥：从灯头往下张开，到地面时半宽 118px；返回 0..1 的照亮程度，边缘柔和过渡
  const snLit = (x, y) => { const dy = y - SN_LAMP[1]; if (dy < 4) return 0; const half = 10 + 108 * dy / (SN_GROUND - SN_LAMP[1]); return clamp(1.4 * (1 - Math.abs(x - SN_LAMP[0]) / half)); };
  CELLS[42] = (k, w, h, u) => {
    k.drawImage(layer('SN_bg', g => {
      const sky = g.createLinearGradient(0, 0, 0, CH); sky.addColorStop(0, '#0b1230'); sky.addColorStop(1, '#1d2a52');
      g.fillStyle = sky; g.fillRect(0, 0, CW, CH);
      g.fillStyle = '#121a38';                           // 远处楼群剪影 + 几扇亮窗
      [[0, 96, 70], [64, 120, 56], [124, 80, 90], [208, 108, 64], [266, 70, 84], [440, 100, 99], [500, 84, 39]].forEach(([x, y, bw], i) => {
        g.fillStyle = '#121a38'; g.fillRect(x, y, bw, SN_GROUND - y);
        for (let j = 0; j < 6; j++) if (hash(i * 13 + j) > 0.55) { g.fillStyle = 'rgba(255,200,120,.55)'; g.fillRect(x + 8 + (j % 3) * 20, y + 12 + Math.floor(j / 3) * 22, 7, 9); }
      });
      g.fillStyle = '#d9e2f2'; g.fillRect(0, SN_GROUND, CW, CH - SN_GROUND);   // 积雪路面
      g.fillStyle = 'rgba(120,140,180,.35)'; g.fillRect(0, SN_GROUND, CW, 2);
      g.fillStyle = '#0a0f24'; g.fillRect(SN_LAMP[0] - 2, SN_LAMP[1], 4, SN_GROUND - SN_LAMP[1]);   // 灯杆
      g.fillRect(SN_LAMP[0] - 14, SN_LAMP[1] - 6, 28, 7);
      const cone = g.createLinearGradient(0, SN_LAMP[1], 0, SN_GROUND);       // 光锥与地上的光斑
      cone.addColorStop(0, 'rgba(255,214,150,.30)'); cone.addColorStop(1, 'rgba(255,214,150,.06)');
      g.fillStyle = cone; g.beginPath(); g.moveTo(SN_LAMP[0] - 10, SN_LAMP[1]); g.lineTo(SN_LAMP[0] + 10, SN_LAMP[1]);
      g.lineTo(SN_LAMP[0] + 118, SN_GROUND); g.lineTo(SN_LAMP[0] - 118, SN_GROUND); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,214,150,.35)'; g.beginPath(); g.ellipse(SN_LAMP[0], SN_GROUND + 6, 120, 9, 0, 0, TAU); g.fill();
    }), 0, 0);
    glow(k, SN_LAMP[0], SN_LAMP[1] + 2, 34, '255,220,160', 0.75);
    const span = CH + SN_M * 2;
    SN_LAYERS.forEach((L, li) => {
      for (let i = 0; i < L.count; i++) {
        const s = li * 1000 + i * 7;
        const r = mix(L.r[0], L.r[1], hash(s + 1));
        const y = ((hash(s + 2) * span + L.n * span * u / CYC) % span) - SN_M;
        const x = hash(s + 3) * (CW + 40) - 20 + L.sway * Math.sin(TAU * (1 + (i % 2)) * u / CYC + hash(s + 4) * TAU);
        if (y > SN_GROUND + r && li < 2) continue;        // 远、中层落到地面以下就不画（被路面挡住）
        const lit = snLit(x, y);
        const col = lit > 0 ? lerpC([235, 242, 255], [255, 236, 200], lit) : [225, 233, 250];
        const a = L.a * (0.6 + 0.4 * lit);
        if (L.soft) {
          const g = k.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, rgba(col, a)); g.addColorStop(0.5, rgba(col, a * 0.55)); g.addColorStop(1, rgba(col, 0));
          k.fillStyle = g; k.fillRect(x - r, y - r, r * 2, r * 2);
        } else {
          k.fillStyle = rgba(col, a); k.beginPath(); k.arc(x, y, r * (1 + 0.35 * lit), 0, TAU); k.fill();
        }
      }
    });
  };

  // @element 44
  // 半调网点（参考镜语「半调网点」词条的说明重新实现）：米白纸上，一个球和「HALF / TONE」两行大字全部由网点组成。
  // 网点排在 7px 间距的网格上，每个网点的面积 = 该处暗度，所以光源绕球转动（一圈 / 6.4 秒）时，网点大小跟着明暗实时变化；
  // 大字的明暗是一条从左往右移动的亮带。2.8–4.8 秒叠成青、品红、黄、黑四个版（15°、75°、0°、45°），正片叠底出彩色，然后回到单色黑版。
  // 明暗都由解析函数直接算出（球面法线 · 光源方向），不读像素。区别于均匀的装饰圆点：点的大小一直在变。
  const HT_S = 7, HT_BALL = [150, 100, 78];
  const HT_O = document.createElement('canvas'), HT_T = document.createElement('canvas');
  HT_O.width = HT_T.width = CW; HT_O.height = HT_T.height = CH;
  const HT_INK = { c: '#00a3e0', m: '#e4007f', y: '#ffd800', k: '#1d2236' };
  const HT_PLATES = [['c', 15], ['m', 75], ['y', 0], ['k', 45]];   // [版, 网角°]
  // 以 (cx, cy) 为原点、按网角 ang 排的网点；cov(x, y) 返回该点覆盖率 0..1，面积按覆盖率换算成半径
  function htDots(g, ang, cx, cy, half, cov) {
    const ca = Math.cos(ang), sa = Math.sin(ang), n = Math.ceil(half / HT_S) + 1;
    g.beginPath();
    for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
      const x = cx + (i * ca - j * sa) * HT_S, y = cy + (i * sa + j * ca) * HT_S;
      const v = cov(x, y); if (v <= 0.01) continue;
      const r = HT_S * Math.sqrt(Math.min(1, v) / Math.PI) * 1.05;
      g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU);
    }
    g.fill();
  }
  // 一个版在某处的覆盖率：单色时黑版 = 暗度；彩色时青品黄 = 1 − 受光颜色的对应通道，黑版只留最暗的部分
  function htInk(pl, b, rgb, cm) {
    if (pl === 'k') return (1 - cm) * (1 - b) + cm * Math.max(0, 0.38 - b) * 1.4;
    return cm * (1 - rgb['cmy'.indexOf(pl)] * b);
  }
  CELLS[43] = (k, w, h, u) => {
    const phi = TAU * u / CYC;
    const L = [0.72 * Math.cos(phi), 0.72 * Math.sin(phi), 0.69];
    const cm = Math.min(seg(u, 2.8, 3.3), 1 - seg(u, 4.3, 4.8));   // 彩色版的比例
    const [bx, by, br] = HT_BALL, ballRGB = [0.93, 0.32, 0.27], textRGB = [0.12, 0.42, 1];
    const shx = bx - 34 * Math.cos(phi), shy = 188;                  // 桌面投影在光源对面
    const ballLit = (x, y) => { const nx = (x - bx) / br, ny = (y - by) / br, d = nx * nx + ny * ny; if (d >= 1) return -1; const nz = Math.sqrt(1 - d); return 0.1 + 0.9 * Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]); };
    const textLit = x => 0.5 + 0.36 * Math.sin(x * 0.022 - phi);
    k.fillStyle = '#F3ECDD'; k.fillRect(0, 0, w, h); paper(k, [120, 100, 70], 900, 11);
    const glyph = layer('HT_glyph', g => { g.font = `900 80px ${DISP}`; g.fillStyle = '#000'; g.textBaseline = 'alphabetic'; g.fillText('HALF', 268, 96); g.fillText('TONE', 268, 182); });
    const o = HT_O.getContext('2d'), t = HT_T.getContext('2d');
    for (const [pl, deg] of HT_PLATES) {
      if (pl !== 'k' && cm <= 0.001) continue;
      const ang = deg * Math.PI / 180;
      o.clearRect(0, 0, CW, CH); o.fillStyle = HT_INK[pl];
      htDots(o, ang, bx, by, 150, (x, y) => {
        const b = ballLit(x, y); if (b >= 0) return htInk(pl, b, ballRGB, cm);
        const e = 1 - ((x - shx) / 74) ** 2 - ((y - shy) / 11) ** 2;   // 投影只用黑版
        return pl === 'k' && e > 0 ? 0.5 * e : 0;
      });
      t.clearRect(0, 0, CW, CH); t.fillStyle = HT_INK[pl];
      // 彩色阶段把字的明暗整体抬高：暗部四色墨叠满会接近黑色，抬高后青、品红多、黄少，读得出蓝色；亮带仍然在走
      htDots(t, ang, 400, 140, 170, x => { const b = textLit(x); return htInk(pl, b + cm * 0.6 * (1 - b), textRGB, cm); });
      t.globalCompositeOperation = 'destination-in'; t.drawImage(glyph, 0, 0); t.globalCompositeOperation = 'source-over';
      o.drawImage(HT_T, 0, 0);
      k.save(); k.globalCompositeOperation = 'multiply'; k.drawImage(HT_O, 0, 0); k.restore();
    }
    txt(k, cm > 0.5 ? 'C · M · Y · K' : 'K', w - 12, h - 10, `10px ${MONO}`, '#7a6f58', 'right', 'alphabetic');
    grain(k, 0.06);
  };

  // @element 45
  // 45 波普艺术（参考 jingyu-skill「波普艺术」词条的说明重新实现，MIT · 阿梦freedom）：一碗汤面被放大成占满画面的符号。
  // 粗黑轮廓、硬边色块，背后是放射光芒，背景和碗的暗部用印刷网点（越靠外网点越大）；碗上没有任何品牌字样。
  // 节奏：0–2.3 秒单幅，筷子把面条提起又放下、热气上飘；2.3–2.8 秒画面切成 2×2 宫格；2.9 秒起四格按顺序各换一套撞色，
  // 换色时那一格轻轻一弹；5.4–6.0 秒宫格合回单幅并恢复原配色。筷子与热气每周期 2 次，首尾一致。
  const PA_P = [
    { bg: '#ffd23f', ray: '#ff5a36', dot: '#e8371f', bowl: '#fffaf0', pat: '#e8371f', soup: '#c76a2a' },
    { bg: '#38c6f4', ray: '#ff4fa3', dot: '#1d4fd6', bowl: '#fffaf0', pat: '#1d4fd6', soup: '#d08a3a' },
    { bg: '#7be07b', ray: '#ffe04a', dot: '#1f9e4a', bowl: '#fff2fa', pat: '#ff3d8b', soup: '#c76a2a' },
    { bg: '#ff7ab8', ray: '#7a3cff', dot: '#d8166c', bowl: '#fffaf0', pat: '#ffb800', soup: '#b05a24' },
    { bg: '#ff9f1c', ray: '#2ec4b6', dot: '#e85d04', bowl: '#f4fffd', pat: '#2ec4b6', soup: '#a8541f' }];
  const PA_C = [270, 132];                                   // 放射光芒中心
  const PA_SWAP = [2.9, 3.35, 3.8, 4.25];                    // 四格依次换色的时刻
  const PA_BOWL = new Path2D('M 118 108 C 124 170 190 192 232 194 L 308 194 C 350 192 416 170 422 108 Z');
  const PA_INK = '#141414';
  // 网点：交错网格，半径由 r(x, y) 给出（单位 px），一条 path 一次填完
  function paDots(k, r, x0, y0, x1, y1, col) {
    k.beginPath();
    for (let y = y0, row = 0; y < y1; y += 8, row++) for (let x = x0 + (row % 2) * 4; x < x1; x += 8) {
      const d = r(x, y); if (d > 0.35) { k.moveTo(x + d, y); k.arc(x, y, d, 0, TAU); }
    }
    k.fillStyle = col; k.fill();
  }
  // 描粗黑边的线：先黑后色，得到漫画式的包边
  function paLine(k, pts, w, col) {
    const path = () => { k.beginPath(); pts.forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y))); };
    k.lineCap = 'round'; k.lineJoin = 'round';
    path(); k.strokeStyle = PA_INK; k.lineWidth = w + 2.6; k.stroke();
    path(); k.strokeStyle = col; k.lineWidth = w; k.stroke();
  }
  function paScene(k, P, u) {
    const a = TAU * 2 * u / CYC, lift = 9 * (1 - Math.cos(a)) / 2;
    k.fillStyle = P.bg; k.fillRect(0, 0, CW, CH);
    k.beginPath();
    for (let i = 0; i < 28; i += 2) { const a0 = i / 28 * TAU, a1 = (i + 1) / 28 * TAU; k.moveTo(PA_C[0], PA_C[1]); k.lineTo(PA_C[0] + 700 * Math.cos(a0), PA_C[1] + 700 * Math.sin(a0)); k.lineTo(PA_C[0] + 700 * Math.cos(a1), PA_C[1] + 700 * Math.sin(a1)); k.closePath(); }
    k.fillStyle = P.ray; k.fill();
    paDots(k, (x, y) => 3.4 * clamp(Math.hypot(x - PA_C[0], (y - PA_C[1]) * 1.6) / 300 - 0.35, 0, 1), 0, 0, CW + 8, CH + 8, P.dot);
    // 热气：两条粗黑边的白色波浪，往上飘
    for (let s = 0; s < 2; s++) {
      const pts = [];
      for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push([196 + s * 58 + 10 * Math.sin(t * 5 - a + s * 2) * (0.4 + t), 100 - t * 96]); }
      paLine(k, pts, 9, '#fffdf5');
    }
    // 碗身：白底、一圈红色椭圆纹，右下暗部是网点
    k.save(); k.clip(PA_BOWL);
    k.fillStyle = P.bowl; k.fillRect(110, 100, 320, 100);
    k.fillStyle = P.pat; for (let i = 0; i < 9; i++) { k.beginPath(); k.ellipse(146 + i * 31, 150 + Math.abs(i - 4) * -2, 10, 22 - Math.abs(i - 4) * 1.5, 0, 0, TAU); k.fill(); }
    paDots(k, (x, y) => 3.2 * clamp((x - 250) / 170 + (y - 130) / 120, 0, 1), 110, 100, 430, 200, PA_INK);
    k.restore();
    k.lineJoin = 'round'; k.strokeStyle = PA_INK; k.lineWidth = 4; k.stroke(PA_BOWL);
    k.beginPath(); k.ellipse(270, 197, 46, 6, 0, 0, TAU); k.fillStyle = P.bowl; k.fill(); k.stroke();
    // 碗口、汤面、汤里的面、溏心蛋、葱花
    k.beginPath(); k.ellipse(270, 108, 152, 26, 0, 0, TAU); k.fillStyle = P.bowl; k.fill(); k.lineWidth = 4; k.stroke();
    k.save(); k.beginPath(); k.ellipse(270, 110, 140, 19, 0, 0, TAU); k.fillStyle = P.soup; k.fill(); k.clip();
    for (let r = 0; r < 5; r++) { const pts = []; for (let x = 140; x <= 400; x += 6) pts.push([x, 98 + r * 5 + 2.2 * Math.sin(x / 7 + r * 1.7)]); paLine(k, pts, 3, '#ffd84a'); }
    k.restore();
    k.beginPath(); k.ellipse(270, 110, 140, 19, 0, 0, TAU); k.lineWidth = 2.5; k.stroke();
    k.beginPath(); k.ellipse(212, 106, 27, 13, -0.08, 0, TAU); k.fillStyle = '#fffaf0'; k.fill(); k.lineWidth = 2.5; k.stroke();
    k.beginPath(); k.ellipse(216, 106, 13, 7, -0.08, 0, TAU); k.fillStyle = '#ffae00'; k.fill(); k.stroke();
    k.beginPath(); k.ellipse(213, 104, 5, 2.5, -0.08, 0, TAU); k.fillStyle = '#fff3c4'; k.fill();
    [[250, 100], [262, 112], [282, 104], [300, 114], [178, 114]].forEach(([x, y]) => { k.beginPath(); k.ellipse(x, y, 5.5, 3, 0, 0, TAU); k.strokeStyle = PA_INK; k.lineWidth = 5; k.stroke(); k.strokeStyle = '#3fbf4a'; k.lineWidth = 2.6; k.stroke(); });
    // 被筷子提起的面条（一周期提起放下 2 次）
    for (let i = 0; i < 5; i++) {
      const pts = [];
      for (let y = 112; y >= 34 - lift; y -= 4) { const t = (112 - y) / 80; pts.push([318 + i * 5 + (14 - i * 2) * t + 3.2 * Math.sin(y / 5 + i * 1.3), y]); }
      paLine(k, pts, 3.4, '#ffd84a');
    }
    paLine(k, [[330, 30 - lift], [560, -20 - lift * 0.4]], 6, '#c4462b');
    paLine(k, [[344, 40 - lift], [570, 2 - lift * 0.4]], 6, '#c4462b');
  }
  // 宫格节奏：整幅先缩进左上格（2.3–2.7 秒），另外三格依次弹出；结尾三格倒序收回，左上格再放大回整幅
  const PA_IN = [2.7, 2.84, 2.98], PA_OUT = [5.42, 5.32, 5.22];
  const paPop = t => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2));
  CELLS[44] = (k, w, h, u) => {
    const e = inOut3(seg(u, 2.3, 2.7)) * (1 - inOut3(seg(u, 5.55, 6.0)));
    if (e < 0.001) { paScene(k, PA_P[0], u); return; }
    k.fillStyle = PA_INK; k.fillRect(0, 0, CW, CH);
    for (let q = 0; q < 4; q++) {
      const qx = q % 2, qy = q >> 1, on = u >= PA_SWAP[q] && u < 5.2;
      // 左上格跟着 e 缩放；其余三格只在弹出/收回时缩放，换色那一下轻弹
      const s0 = q ? paPop(seg(u, PA_IN[q - 1], PA_IN[q - 1] + 0.26)) * (1 - inOut3(seg(u, PA_OUT[q - 1], PA_OUT[q - 1] + 0.14))) : 1;
      if (s0 < 0.001) continue;
      const bump = on ? 0.05 * Math.sin(Math.PI * seg(u, PA_SWAP[q], PA_SWAP[q] + 0.3)) : 0;
      const sw = (q ? 0.5 * s0 : mix(1, 0.5, e)) * (1 + bump);
      const cx = q ? (qx + 0.5) * CW / 2 : mix(CW / 2, CW / 4, e), cy = q ? (qy + 0.5) * CH / 2 : mix(CH / 2, CH / 4, e);
      const g = 2.5;                                          // 格与格之间留出黑色描边
      k.save(); k.beginPath();
      k.rect(cx - CW * sw / 2 + g * e, cy - CH * sw / 2 + g * e, CW * sw - 2 * g * e, CH * sw - 2 * g * e); k.clip();
      k.translate(cx, cy); k.scale(sw, sw); k.translate(-CW / 2, -CH / 2);
      paScene(k, on ? PA_P[q + 1] : PA_P[0], u);
      k.restore();
    }
  };

  // @element 46
  // 46 浮世绘（参考 jingyu-skill「浮世绘木版画」词条的说明重新实现，MIT · 阿梦freedom）：雨里一座大木桥横贯画面，两个撑伞的人在桥上相向走过。
  // 木版画的做法：墨线描轮廓，几种平涂套色，填色相对墨线错开 2px（套印没对准的样子）；天空上沿和水面下沿用渐染；
  // 雨是固定角度的细刻线；右上角一枝松树压在前景，裁掉画面一角。不照搬任何名作的构图。
  // 动作：两人各走一趟（从画外到画外，一周期一趟，各 18 步），雨丝落 2 遍，水面雨圈扩散 2 次，波纹平移一个纹样宽度；连续循环，不设复位段。
  const UK_INK = '#2b2420';
  const UK_REG = [2, 1.5];                                     // 套色相对墨线的错位
  const UK_DECK = x => 120 - 30 * Math.sin(Math.PI * clamp((x + 60) / (CW + 120)));   // 桥面高度：一道拱贯穿全画
  const UK_PIERS = [-10, 70, 150, 230, 310, 390, 470, 550];   // 桥墩 x
  const UK_RAIN = 110;
  // 套色 + 墨线：先按错位平涂填色，再在原位描墨线
  function ukShape(g, path, fill, lw = 1.2) {
    g.save(); g.translate(UK_REG[0], UK_REG[1]); path(); g.fillStyle = fill; g.fill(); g.restore();
    path(); g.strokeStyle = UK_INK; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke();
  }
  function ukPoly(g, pts) { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); }
  // 撑伞的行人：伞挡住脸，只露发髻；dir 为行走方向，f 为这一趟走了多少（0..1）
  function ukPerson(k, x, dir, umb, robe, f, sc) {
    const s = f * 18, st = Math.sin(TAU * s), bob = -Math.abs(Math.cos(Math.PI * s)) * 1.2;
    k.save(); k.translate(x, UK_DECK(x) - 1 + bob); k.scale(sc * dir, sc);
    k.strokeStyle = UK_INK; k.lineCap = 'round';
    [1, -1].forEach(sg => {
      const fx = sg * st * 3.2;
      k.lineWidth = 2.2; k.beginPath(); k.moveTo(sg * 1.5, -10); k.lineTo(fx, -1.5); k.stroke();
      k.lineWidth = 1.8; k.beginPath(); k.moveTo(fx - 2.4, 0); k.lineTo(fx + 2.6, 0); k.stroke();
    });
    const robeP = () => ukPoly(k, [[-5, -28], [5, -28], [8.5, -8], [-8.5, -8]]);
    ukShape(k, robeP, robe);
    k.save(); robeP(); k.clip(); k.fillStyle = 'rgba(236,226,200,.75)';
    for (let i = 0; i < 7; i++) { k.beginPath(); k.arc(-6 + (i % 4) * 4 + (i > 3 ? 2 : 0), -24 + Math.floor(i / 4) * 9 + (i % 2) * 2, 1, 0, TAU); k.fill(); }
    k.restore();
    k.fillStyle = '#b8443a'; k.fillRect(-5.6, -19.5, 11.2, 3);
    k.fillStyle = UK_INK; k.beginPath(); k.ellipse(0.5, -31, 3.6, 3.4, 0, 0, TAU); k.fill();   // 后脑与发髻（不画五官）
    k.beginPath(); k.arc(-1, -34.5, 1.8, 0, TAU); k.fill();
    k.lineWidth = 2; k.beginPath(); k.moveTo(3, -25); k.lineTo(4.5, -21); k.stroke();
    k.lineWidth = 1.1; k.beginPath(); k.moveTo(4.5, -20); k.lineTo(3.5, -42); k.stroke();
    k.save(); k.translate(3.5, -41); k.rotate(0.22);
    const can = () => {
      k.beginPath(); k.moveTo(-21, 6); k.quadraticCurveTo(-15, -8, 0, -9.5); k.quadraticCurveTo(15, -8, 21, 6);
      for (let i = 0; i < 6; i++) { const x0 = 21 - i * 7; k.quadraticCurveTo(x0 - 3.5, 3.6, x0 - 7, 6); }
      k.closePath();
    };
    ukShape(k, can, umb);
    k.strokeStyle = 'rgba(43,36,32,.6)'; k.lineWidth = 0.6;
    for (let i = 1; i < 6; i++) { k.beginPath(); k.moveTo(0, -9.5); k.lineTo(-21 + i * 7, 6); k.stroke(); }
    k.fillStyle = UK_INK; k.fillRect(-1.2, -12, 2.4, 3);
    k.restore();
    k.restore();
  }
  CELLS[45] = (k, w, h, u) => {
    const f = u / CYC;
    k.drawImage(layer('UK_bg', g => {
      g.fillStyle = '#ece2c8'; g.fillRect(0, 0, CW, CH);
      const sk = g.createLinearGradient(0, 0, 0, 96);
      sk.addColorStop(0, 'rgba(28,44,78,1)'); sk.addColorStop(0.5, 'rgba(52,74,110,.55)'); sk.addColorStop(1, 'rgba(52,74,110,0)');
      g.fillStyle = sk; g.fillRect(0, 0, CW, 96);
      // 远山不描线，只用灰蓝平涂，两层由浅到深
      [[98, 40, 3, '#9aa8b2'], [108, 26, 8, '#7a8c9c']].forEach(([base, amp, sd, col]) => {
        g.beginPath(); g.moveTo(0, 114);
        for (let x = 0; x <= CW; x += 6) g.lineTo(x, base - amp * fbm2(x / 90 + sd, sd, 3));
        g.lineTo(CW, 114); g.closePath(); g.fillStyle = col; g.fill();
      });
      g.fillStyle = '#5d735c'; g.fillRect(0, 108, CW, 6);
      for (let x = 4; x < CW; x += 9) { g.beginPath(); g.ellipse(x + hash(x) * 4, 107, 4 + hash(x + 1) * 3, 3, 0, 0, TAU); g.fill(); }
      const rv = g.createLinearGradient(0, 114, 0, CH); rv.addColorStop(0, '#7099b2'); rv.addColorStop(0.55, '#5a86a3'); rv.addColorStop(1, '#2c4f6e');
      g.fillStyle = rv; g.fillRect(0, 114, CW, CH - 114);
      g.beginPath(); g.moveTo(0, 114); g.lineTo(CW, 114); g.strokeStyle = UK_INK; g.lineWidth = 1; g.stroke();
      // 桥墩倒影
      g.strokeStyle = 'rgba(30,48,70,.35)'; g.lineWidth = 5;
      UK_PIERS.forEach(px => { g.beginPath(); for (let y = 198; y < CH; y += 2) g.lineTo(px + 3.5 + 2 * Math.sin(y / 3), y); g.stroke(); });
    }), 0, 0);
    // 水面：波纹纹样每周期平移一个纹样宽度；雨圈扩散 2 次
    k.save(); k.strokeStyle = 'rgba(32,52,82,.5)'; k.lineWidth = 1;
    for (let r = 0; r < 6; r++) {
      const y = 124 + r * 15, sh = (r % 2 ? 1 : -1) * 40 * f + (r % 2) * 20;
      for (let x0 = -40; x0 < CW + 40; x0 += 40) {
        k.beginPath(); for (let i = 0; i <= 8; i++) k.lineTo(x0 + sh + i * 3, y + 1.6 * Math.sin(i / 8 * TAU)); k.stroke();
      }
    }
    for (let i = 0; i < 14; i++) {
      const p = (hash(i * 7 + 1) + 2 * f) % 1, r = 1.5 + 9 * p;
      k.strokeStyle = `rgba(236,226,200,${0.6 * (1 - p)})`; k.beginPath(); k.ellipse(hash(i * 7 + 2) * CW, 130 + hash(i * 7 + 3) * 72, r, r * 0.32, 0, 0, TAU); k.stroke();
    }
    k.restore();
    k.drawImage(layer('UK_bridge', g => {
      UK_PIERS.forEach((px, i) => {
        const top = UK_DECK(px) + 8;
        ukShape(g, () => { g.beginPath(); g.rect(px, top, 7, 198 - top); }, '#6b4a32');
        const nx = UK_PIERS[i + 1];
        if (nx !== undefined) {
          g.strokeStyle = UK_INK; g.lineWidth = 1.4;
          g.beginPath(); g.moveTo(px + 7, 150); g.lineTo(nx, 184); g.moveTo(px + 7, 184); g.lineTo(nx, 150); g.stroke();
          g.beginPath(); g.moveTo(px + 7, 150); g.lineTo(nx, 150); g.stroke();
        }
      });
      const deck = () => {
        g.beginPath(); for (let x = -12; x <= CW + 12; x += 4) g.lineTo(x, UK_DECK(x));
        for (let x = CW + 12; x >= -12; x -= 4) g.lineTo(x, UK_DECK(x) + 9);
        g.closePath();
      };
      ukShape(g, deck, '#9c6b45');
      g.strokeStyle = 'rgba(43,36,32,.55)'; g.lineWidth = 0.7;
      for (let x = -8; x < CW + 8; x += 9) { g.beginPath(); g.moveTo(x, UK_DECK(x) + 1.5); g.lineTo(x, UK_DECK(x) + 8); g.stroke(); }
    }), 0, 0);
    ukPerson(k, CW + 40 - (CW + 80) * ((f + 0.5) % 1), -1, '#d8a64e', '#3c3f4c', (f + 0.5) % 1, 1.5);
    ukPerson(k, -40 + (CW + 80) * f, 1, '#c8553d', '#2f4a7a', f, 1.7);
    // 栏杆压在行人腿前
    k.drawImage(layer('UK_rail', g => {
      for (let x = -6; x < CW + 12; x += 23) ukShape(g, () => { g.beginPath(); g.rect(x, UK_DECK(x) - 15, 3, 15); }, '#8a5d3c', 0.9);
      [[-16, -13], [-8, -6.5]].forEach(([a, b]) => ukShape(g, () => {
        g.beginPath(); for (let x = -12; x <= CW + 12; x += 4) g.lineTo(x, UK_DECK(x) + a);
        for (let x = CW + 12; x >= -12; x -= 4) g.lineTo(x, UK_DECK(x) + b); g.closePath();
      }, '#a2714a', 1));
    }), 0, 0);
    // 雨：固定角度的细刻线，一周期落 2 遍；深色与纸色两种，深浅底上都看得见
    k.lineWidth = 0.8;
    for (let i = 0; i < UK_RAIN; i++) {
      const y = ((hash(i * 5 + 11) + 2 * f) % 1) * (CH + 60) - 40, x = hash(i * 5 + 12) * (CW + 90) + 10 - y * 0.23;
      k.strokeStyle = i % 3 ? 'rgba(43,36,32,.32)' : 'rgba(236,226,200,.5)';
      k.beginPath(); k.moveTo(x, y); k.lineTo(x - 6.4, y + 28); k.stroke();
    }
    // 前景松枝：裁掉右上角
    k.drawImage(layer('UK_pine', g => {
      const br = () => { g.beginPath(); g.moveTo(CW + 12, -8); g.quadraticCurveTo(500, 4, 446, 26); };
      g.lineCap = 'round'; br(); g.strokeStyle = UK_INK; g.lineWidth = 9; g.stroke(); br(); g.strokeStyle = '#5a3e2c'; g.lineWidth = 6.5; g.stroke();
      [[CW + 4, 18, 0.3], [512, 30, 0.1], [478, 40, -0.1], [450, 30, -0.3], [500, 8, 0.2], [530, 46, 0.25]].forEach(([x, y, r]) => {
        ukShape(g, () => { g.beginPath(); g.ellipse(x, y, 20, 9, r, 0, Math.PI); g.closePath(); }, '#2f4a36');
        g.strokeStyle = 'rgba(43,36,32,.75)'; g.lineWidth = 0.8;
        for (let i = 0; i <= 10; i++) { const a = r + Math.PI * i / 10; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 * Math.cos(a) * Math.cos(r) - 9 * Math.sin(a) * Math.sin(r), y + 20 * Math.cos(a) * Math.sin(r) + 9 * Math.sin(a) * Math.cos(r)); g.stroke(); }
      });
    }), 0, 0);
    paper(k, [110, 90, 60], 900, 46);
    grain(k, 0.06);
  };

  // @element 47
  // 47 木刻版画（参考 jingyu-skill「木刻版画」词条的说明重新实现，MIT · 阿梦freedom）：只有黑与纸色两种颜色，渔民在浪里的木船上拉网。
  // 天空是一排排刻刀留下的平行黑线，越往上越粗，太阳处整块刻空；海是大块黑色，浪花和水纹是顺着浪形刻出的白色刀痕，浪尖是向上挑起的三角刀口；
  // 船身刻出木板缝，渔民戴斗笠（不画五官），黑色区域透出淡淡木纹，最后压一层粗纸纹。
  // 动作：两道浪各自向前推（前浪 1 圈、后浪 1 圈，细浪 2 圈 / 周期），船随前浪起伏摇摆，渔民一周期后仰拉一次网，网兜随之提起、露出鱼；海鸥扇翅；连续循环。
  const WC_INK = '#161310', WC_PAPER = '#e9e0ca';
  const WC_BOAT = 300;
  const WC_FRONT = (x, u) => { const s1 = Math.sin(TAU * (x / 190 - u / CYC)), s2 = Math.sin(TAU * (x / 74 + 2 * u / CYC) + 1.3); return 168 - 14 * (Math.pow((1 + s1) / 2, 2.4) * 2 - 1) - 3 * s2; };
  const WC_BACK = (x, u) => { const s1 = Math.sin(TAU * (x / 130 - u / CYC) + 2.1), s2 = Math.sin(TAU * (x / 52 - 2 * u / CYC)); return 128 - 6 * (Math.pow((1 + s1) / 2, 2) * 2 - 1) - 2 * s2; };
  // 一条两头尖的刀痕：只往当前路径里加子路径，由调用方统一填色
  function wcCut(k, pts, w) {
    const n = pts.length; if (n < 2) return;
    const L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      const hw = w * 0.5 * Math.pow(Math.sin(Math.PI * i / (n - 1)), 0.6);
      L.push([pts[i][0] - dy / d * hw, pts[i][1] + dx / d * hw]); R.push([pts[i][0] + dy / d * hw, pts[i][1] - dx / d * hw]);
    }
    L.forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y))); for (let i = n - 1; i >= 0; i--) k.lineTo(R[i][0], R[i][1]); k.closePath();
  }
  // 海面：黑色水体 + 顺浪形的白色刀痕（断成长短不一的段，位置按屏幕 x 固定）
  function wcSea(k, surf, u, rows, w0, seed) {
    k.beginPath(); k.moveTo(0, CH);
    for (let x = 0; x <= CW; x += 4) k.lineTo(x, surf(x, u));
    k.lineTo(CW, CH); k.closePath(); k.fillStyle = WC_INK; k.fill();
    k.beginPath();
    rows.forEach((d, r) => {
      let x = -10 + hash(seed + r) * 20;
      for (let s = 0; x < CW + 10; s++) {
        const len = 18 + hash(seed + r * 31 + s) * (60 - r * 6), pts = [];
        for (let xx = x; xx <= x + len; xx += 4) pts.push([xx, surf(xx, u) + d + 1.4 * Math.sin(xx / 23 + d)]);
        wcCut(k, pts, mix(w0, 1.5, r / rows.length));   // 最细 1.5px，理由同天空的刻线
        x += len + 4 + hash(seed + r * 17 + s) * (6 + r * 3);
      }
    });
    k.fillStyle = WC_PAPER; k.fill();
  }
  CELLS[46] = (k, w, h, u) => {
    const f = u / CYC, pull = 0.5 - 0.5 * Math.cos(TAU * f);
    // 天空和礁岬每帧直接画，不走缓存图层：缓存图层放大显示会被插值变糊，详情页里刻线就不清楚了
    (g => {
      g.fillStyle = WC_PAPER; g.fillRect(0, 0, CW, CH);
      const SUN = [118, 50, 26];
      g.beginPath();
      for (let y = 3, r = 0; y < 112; y += 5.5, r++) {
        const wd = mix(3.6, 1.3, y / 112); let pts = [];
        const flush = () => { if (pts.length > 2) wcCut(g, pts, wd); pts = []; };
        for (let x = -10; x <= CW + 10; x += 6) {
          const yy = y + 0.8 * Math.sin(x / 37 + r);
          if (Math.hypot(x - SUN[0], yy - SUN[1]) < SUN[2] + 5 || hash(r * 97 + x) > 0.965) { flush(); continue; }
          pts.push([x, yy]);
        }
        flush();
      }
      g.fillStyle = WC_INK; g.fill();
      g.beginPath(); g.arc(SUN[0], SUN[1], SUN[2], 0, TAU); g.strokeStyle = WC_INK; g.lineWidth = 1.6; g.stroke();
      // 右边的礁岬：整块黑，刻出顺坡的白线
      g.beginPath(); g.moveTo(396, 126); g.lineTo(430, 100); g.lineTo(468, 74); g.lineTo(506, 62); g.lineTo(CW, 68); g.lineTo(CW, 130); g.closePath(); g.fillStyle = WC_INK; g.fill();
      g.beginPath();
      for (let i = 0; i < 9; i++) { const x0 = 424 + i * 13; wcCut(g, [[x0, 108 - i * 3], [x0 + 14, 92 - i * 3], [x0 + 26, 78 - i * 2]].map(([x, y]) => [x, Math.max(y, 70 + (x > 506 ? 0 : (506 - x) * 0.3))]), 1.6); }
      g.fillStyle = WC_PAPER; g.fill();
    })(k);
    // 海鸥：在原地附近绕小圈，扇翅 3～5 次 / 周期
    [[208, 78, 0], [252, 64, 1], [360, 84, 2]].forEach(([x0, y0, i]) => {
      const x = x0 + 8 * Math.sin(TAU * f + i), y = y0 + 4 * Math.sin(TAU * 2 * f + i), fl = 5 * Math.sin(TAU * (3 + i) * f);
      const wing = () => { k.beginPath(); k.moveTo(x - 13, y - fl); k.quadraticCurveTo(x - 6, y - 6 - fl * 0.4, x, y); k.quadraticCurveTo(x + 6, y - 6 - fl * 0.4, x + 13, y - fl); };
      k.lineCap = 'round'; wing(); k.strokeStyle = WC_INK; k.lineWidth = 3.4; k.stroke(); wing(); k.strokeStyle = WC_PAPER; k.lineWidth = 1.3; k.stroke();
    });
    wcSea(k, WC_BACK, u, [5, 10, 16, 23, 31, 40, 50], 2.2, 300);
    // 船随前浪起伏摇摆
    const yb = 0.5 * WC_BACK(WC_BOAT, u) + 0.5 * WC_FRONT(WC_BOAT, u) - 12;
    const tilt = Math.atan2(WC_FRONT(WC_BOAT + 60, u) - WC_FRONT(WC_BOAT - 60, u), 120) * 0.5;
    k.save(); k.translate(WC_BOAT, yb); k.rotate(tilt);
    // 渔民：先画，船帮挡住腿；身体绕脚后仰
    const lean = -0.12 - 0.3 * pull, hand = [54 - 12 * pull, -30 + 2 * pull];
    k.save(); k.translate(30, -6); k.rotate(lean);
    k.fillStyle = WC_INK; k.strokeStyle = WC_INK; k.lineCap = 'round';
    k.lineWidth = 5; k.beginPath(); k.moveTo(-4, -14); k.lineTo(-6, 0); k.moveTo(5, -14); k.lineTo(7, 0); k.stroke();
    k.beginPath(); k.moveTo(-7, -15); k.lineTo(7, -15); k.lineTo(9, -38); k.quadraticCurveTo(1, -42, -7, -38); k.closePath(); k.fill();
    k.beginPath(); for (let i = 0; i < 5; i++) wcCut(k, [[-5 + i * 3, -17], [-3 + i * 3.4, -26], [-1 + i * 3.6, -36]], 1.3); k.fillStyle = WC_PAPER; k.fill();
    k.fillStyle = WC_INK; k.beginPath(); k.arc(1, -45, 5.5, 0, TAU); k.fill();
    const hat = () => { k.beginPath(); k.moveTo(-14, -46); k.lineTo(1, -59); k.lineTo(17, -45); k.quadraticCurveTo(1, -42, -14, -46); k.closePath(); };
    hat(); k.fillStyle = WC_PAPER; k.fill(); k.lineWidth = 1.6; k.strokeStyle = WC_INK; k.stroke();
    k.lineWidth = 0.9; for (let i = 0; i < 6; i++) { k.beginPath(); k.moveTo(1, -58); k.lineTo(-11 + i * 5.5, -45.5); k.stroke(); }
    k.restore();
    // 手臂从肩膀伸到手上的绳子（肩膀位置按后仰角算）
    const sh = [30 + 37 * Math.sin(-lean) * -1 + 2, -6 - 37 * Math.cos(lean)];
    k.strokeStyle = WC_INK; k.lineWidth = 4.5; k.beginPath(); k.moveTo(sh[0], sh[1]); k.lineTo(hand[0], hand[1]); k.moveTo(sh[0] - 4, sh[1] + 3); k.lineTo(hand[0] - 2, hand[1] + 2); k.stroke();
    k.lineWidth = 1.8; k.beginPath(); k.moveTo(hand[0] - 4, hand[1] + 1); k.lineTo(80, -9); k.lineTo(98, 10); k.stroke();
    // 船身：整块黑，刻出船帮高光与木板缝
    const hull = () => { k.beginPath(); k.moveTo(-86, -16); k.quadraticCurveTo(0, -3, 82, -10); k.quadraticCurveTo(70, 14, 40, 20); k.lineTo(-40, 20); k.quadraticCurveTo(-74, 12, -86, -16); k.closePath(); };
    hull(); k.fillStyle = WC_INK; k.fill();
    k.beginPath();
    [0.28, 0.52, 0.76].forEach(t => { const pts = []; for (let x = -72; x <= 70; x += 6) { const top = -9.5 + 0.0009 * x * x * -1 + 0.03 * x, bot = 20 - Math.max(0, Math.abs(x) - 40) * 0.5; pts.push([x, mix(top, bot, t)]); } wcCut(k, pts, 1.7); });
    { const pts = []; for (let x = -80; x <= 78; x += 6) pts.push([x, -9.5 + 0.03 * x - 0.0009 * x * x - 4 * Math.max(0, -x - 60) / 26]); wcCut(k, pts, 2); }
    k.fillStyle = WC_PAPER; k.fill();
    k.strokeStyle = WC_INK; k.lineWidth = 3; k.beginPath(); k.moveTo(-24, -8); k.lineTo(-24, -74); k.stroke();
    k.lineWidth = 0.9; k.beginPath(); k.moveTo(-24, -72); k.lineTo(-84, -16); k.moveTo(-24, -72); k.lineTo(78, -10); k.stroke();
    k.lineWidth = 2.2; k.beginPath(); k.moveTo(-40, -60); k.lineTo(-6, -64); k.stroke();
    k.restore();
    wcSea(k, WC_FRONT, u, [6, 12, 19, 27, 36], 2.8, 700);
    // 浪尖：随浪走的向上挑起的三角刀口和飞沫
    const shift = 190 * f, off = shift % 7, base = Math.floor(shift / 7);
    k.beginPath();
    for (let j = -2; j * 7 < CW + 14; j++) {
      const x = j * 7 + off, c = (1 + Math.sin(TAU * (x / 190 - f))) / 2;
      if (c < 0.8) continue;
      const L = (6 + 10 * hash(j - base + 900)) * (c - 0.8) / 0.2, y = WC_FRONT(x, u);
      wcCut(k, [[x + 1, y + 3], [x - L * 0.3, y - L * 0.6], [x - L * 0.6, y - L]], 3);
      if (hash(j - base + 500) > 0.5) k.rect(x - L * 0.8, y - L - 5, 1.8, 1.8);
    }
    k.fillStyle = WC_PAPER; k.fill();
    // 网兜在船尾外的水里，拉网时提起，露出鱼
    k.save(); k.translate(WC_BOAT, yb); k.rotate(tilt);
    const bag = [[88, 6], [150, 10], [124, 34 - 16 * pull]];
    k.save(); k.beginPath(); k.moveTo(bag[0][0], bag[0][1]); k.lineTo(bag[1][0], bag[1][1]); k.quadraticCurveTo(146, 30 - 10 * pull, bag[2][0], bag[2][1]); k.quadraticCurveTo(96, 34 - 14 * pull, bag[0][0], bag[0][1]); k.closePath(); k.clip();
    k.strokeStyle = WC_PAPER; k.lineWidth = 0.9; k.beginPath();
    for (let i = -6; i < 12; i++) { k.moveTo(80 + i * 7, 0); k.lineTo(110 + i * 7, 40); k.moveTo(80 + i * 7, 40); k.lineTo(110 + i * 7, 0); }
    k.stroke();
    k.globalAlpha = seg(pull, 0.4, 0.9);
    [[110, 20, 0.3], [126, 16, -0.4], [118, 26, 0.1]].forEach(([x, y, r]) => {
      k.save(); k.translate(x, y - 6 * pull); k.rotate(r);
      k.beginPath(); k.ellipse(0, 0, 7, 2.6, 0, 0, TAU); k.moveTo(6, 0); k.lineTo(11, -3); k.lineTo(11, 3); k.closePath(); k.fillStyle = WC_PAPER; k.fill(); k.strokeStyle = WC_INK; k.lineWidth = 0.8; k.stroke();
      k.restore();
    });
    k.restore();
    k.strokeStyle = WC_PAPER; k.lineWidth = 1.2; k.beginPath(); k.moveTo(96, 6); k.lineTo(152, 10); k.stroke();
    k.restore();
    // 黑色里透出的木纹 + 粗纸纹
    k.save(); k.globalCompositeOperation = 'screen';
    k.drawImage(layer('WC_wood', g => {
      g.strokeStyle = 'rgba(200,190,170,.14)'; g.lineWidth = 1;
      for (let y = 0; y < CH; y += 3) { g.beginPath(); for (let x = 0; x <= CW; x += 8) g.lineTo(x, y + 3 * Math.sin(x / 61 + y / 9) + 2 * fbm2(x / 40, y / 13, 2)); g.stroke(); }
    }), 0, 0);
    k.restore();
    paper(k, [70, 50, 30], 1400, 47);
    grain(k, 0.09);
  };

  // @element 48
  // 48 刺绣（参考 jingyu-skill「刺绣」词条的说明重新实现，MIT · 阿梦freedom）：木绣绷绷着奶白丝绸，针一针针绣出荷叶、荷花、花苞和一只鸳鸯。
  // 花瓣、叶片用「鱼骨绣」：针脚从中脉斜向边缘，方向随形而走；荷叶用放射的长短针；鸳鸯各部分用平行的缎面绣，方向顺着羽毛。
  // 每针颜色由深到浅渐变；亮度随针脚方向与光的夹角变化，所以同一种颜色因走向不同而有丝光差别；每针下面垫一道阴影，显出凸起。
  // 节奏：0.15–4.2 秒按顺序绣完（针跟着最后一针走，丝线连到画外），4.2–4.6 秒针离开，4.35–5.25 秒一道斜向丝光扫过，5.4–6.4 秒绣线淡出复位。
  const EM_C = [270, 104], EM_R = 92;                              // 绣绷圆心与内半径
  const EM_LIGHT = 0.6;                                            // 光的方向角：针脚与它平行时最亮
  const EM_ST = (() => {
    const st = [];
    const q = v => Math.max(0, Math.min(255, Math.round(v / 6) * 6));
    const add = (x1, y1, x2, y2, c, j) => { const t = 1 + (hash(j) - 0.5) * 0.12; st.push({ x1, y1, x2, y2, c: [q(c[0] * t), q(c[1] * t), q(c[2] * t)], a: Math.atan2(y2 - y1, x2 - x1) }); };
    let J = 1;
    // 鱼骨绣花瓣：从 base 朝 ang 方向长 len，最宽 wid，颜色 c0（根部）→ c1（尖）
    const petal = (bx, by, ang, len, wid, c0, c1, bend = 0) => {
      const dx = Math.cos(ang), dy = Math.sin(ang), n = Math.max(6, Math.round(len / 1.5));
      const sp = t => [bx + dx * len * t - dy * bend * Math.sin(Math.PI * t), by + dy * len * t + dx * bend * Math.sin(Math.PI * t)];
      const hw = t => wid * Math.pow(Math.sin(Math.PI * Math.pow(clamp(t), 0.85)), 0.75);
      for (let i = 0; i < n; i++) {
        const t = i / n, t2 = Math.min(1, t + 0.14), [x, y] = sp(t), [x2, y2] = sp(t2), w = hw(t2), c = lerpC(c0, c1, t);
        [1, -1].forEach(sg => add(x, y, x2 - dy * w * sg, y2 + dx * w * sg, c, J++));
      }
    };
    // 放射长短针的荷叶（透视压扁的圆）
    const leaf = (cx, cy, rx, ry, c0, c1) => {
      for (let i = 0; i < 96; i++) {
        const a = i / 96 * TAU + (i % 2) * 0.02, R = 1 + 0.06 * Math.sin(5 * a), vein = i % 8 === 0;
        const rs = [0.12, 0.38, 0.64, 0.86, 1];
        for (let r = 0; r < 4; r++) {
          const r0 = rs[r] - (i % 2 ? 0.04 : 0), r1 = Math.min(1, rs[r + 1] + (i % 2 ? 0 : 0.05));
          const c = vein ? lerpC(c0, [40, 70, 40], 0.5) : lerpC(c0, c1, r / 3);
          add(cx + Math.cos(a) * rx * r0 * R, cy + Math.sin(a) * ry * r0 * R, cx + Math.cos(a) * rx * r1 * R, cy + Math.sin(a) * ry * r1 * R, c, J++);
        }
      }
    };
    // 缎面绣：在多边形内按角度 ang 铺平行线，长线拆成不超过 12px 的针，错开接缝
    const fill = (poly, ang, gap, col) => {
      const ca = Math.cos(-ang), sa = Math.sin(-ang), rot = ([x, y]) => [x * ca - y * sa, x * sa + y * ca];
      const back = ([x, y]) => [x * ca + y * sa, -x * sa + y * ca], P = poly.map(rot);
      const ys = P.map(p => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
      for (let y = y0 + gap / 2, row = 0; y < y1; y += gap, row++) {
        const xs = [];
        for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; if ((a[1] <= y) !== (b[1] <= y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
        xs.sort((a, b) => a - b);
        for (let i = 0; i + 1 < xs.length; i += 2) {
          const L = xs[i + 1] - xs[i], n = Math.max(1, Math.ceil(L / 12)), sh = row % 2 ? 0.5 : 0;
          for (let s = 0; s < n; s++) {
            const a0 = xs[i] + L * Math.max(0, (s - sh) / n), a1 = xs[i] + L * Math.min(1, (s + 1 - sh) / n);
            if (a1 - a0 < 1) continue;
            const p = back([a0, y]), p2 = back([a1, y]);
            add(p[0], p[1], p2[0], p2[1], col((p[0] + p2[0]) / 2, (p[1] + p2[1]) / 2), J++);
          }
        }
      }
    };
    const ell = (cx, cy, rx, ry, r = 0, n = 28) => Array.from({ length: n }, (_, i) => { const a = i / n * TAU; return [cx + Math.cos(a) * rx * Math.cos(r) - Math.sin(a) * ry * Math.sin(r), cy + Math.cos(a) * rx * Math.sin(r) + Math.sin(a) * ry * Math.cos(r)]; });
    // 劈线绣的茎：沿折线的短针
    const stem = (pts, c) => { for (let i = 0; i + 1 < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], n = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 3.5); for (let s = 0; s < n; s++) add(mix(x1, x2, s / n) - 0.6, mix(y1, y2, s / n), mix(x1, x2, (s + 1.4) / n) + 0.6, mix(y1, y2, (s + 1.4) / n), c, J++); } };
    const G0 = [52, 92, 58], G1 = [128, 170, 110], P0 = [246, 228, 222], P1 = [216, 100, 132];
    leaf(222, 156, 46, 19, G0, G1);
    leaf(346, 58, 20, 9, G0, G1);
    stem([[272, 100], [270, 130], [264, 160], [256, 192]], [86, 120, 66]);
    stem([[214, 70], [218, 100], [222, 130], [226, 150]], [86, 120, 66]);
    petal(214, 72, -1.57 - 0.24, 24, 7.5, P0, P1); petal(214, 72, -1.57 + 0.24, 24, 7.5, P0, P1); petal(214, 72, -1.57, 26, 6.5, [236, 210, 206], [200, 84, 118]);
    [-2.2, -1.57, -0.94].forEach(a => petal(272, 98, a, 44, 14, [228, 196, 196], [196, 78, 112], 2));
    fill(ell(272, 80, 10, 5.5), 0.2, 1.6, () => [206, 196, 96]);
    [-2.65, -1.95, -1.2, -0.5].forEach((a, i) => petal(272, 99, a, 40, 16, P0, P1, i < 2 ? -2 : 2));
    [-3.05, -0.1].forEach(a => petal(272, 100, a, 30, 10, P0, [222, 130, 150]));
    const DUCK0 = st.length;
    // 水纹：鸳鸯下方的跑针
    [[326, 168, 44, 6], [330, 176, 60, 8]].forEach(([cx, cy, rx, ry], r) => { for (let i = 0; i < 18; i++) { const a0 = Math.PI * (0.08 + i * 0.05), a1 = a0 + 0.03; if (i % 2) continue; add(cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry * -0.2 + ry, cx + Math.cos(a1) * rx, cy + Math.sin(a1) * ry * -0.2 + ry, [150, 176, 196], J++); for (let s = 0; s < 1; s++); } for (let i = 0; i < 10; i++) { const x = cx - rx + i * rx * 0.2; add(x, cy, x + 5, cy + 0.5, [160, 186, 204], J++); } });
    // 鸳鸯（朝左）：身体、胸、帆羽、尾、头、冠、喙
    fill(ell(328, 152, 30, 13.5, -0.08), -0.3, 1.5, (x, y) => lerpC([196, 120, 60], [236, 186, 110], clamp((y - 140) / 24)));
    fill(ell(303, 150, 10, 11.5, 0.2), 1.25, 1.5, (x, y) => lerpC([70, 46, 92], [126, 88, 140], clamp((y - 140) / 22)));
    [-1.95, -1.75, -1.55].forEach((a, i) => petal(336 + i * 3, 142, a, 17 - i, 6, [196, 110, 50], [240, 160, 70]));
    [0.15, 0.32].forEach(a => petal(350, 150, a, 15, 5, [96, 70, 60], [150, 120, 96]));
    petal(338, 148, 0.05, 20, 5, [60, 70, 110], [120, 140, 190]);
    fill(ell(299, 130, 10.5, 9.5), 0.45, 1.4, (x, y) => {
      const dy = y - 130, dx = x - 299;
      if (dy < -3.2) return [48, 92, 72];
      if (dy < 0.4 && dx > -4) return [242, 234, 216];
      return [200, 110, 64];
    });
    petal(304, 123, -0.25, 15, 4, [40, 84, 66], [70, 130, 96]);
    fill([[291, 129], [279, 132.5], [291, 136]], 0.1, 1.2, () => [208, 70, 58]);
    st.push({ knot: true, x1: 295, y1: 128.5, x2: 295, y2: 128.5, c: [30, 24, 22], a: 0 });
    // 鸳鸯与水纹按小尺寸设计，整体绕 (328, 150) 放大 1.45 倍，再平移到绣绷右下（针脚方向不变）
    for (let i = DUCK0; i < st.length; i++) { const s = st[i]; ['1', '2'].forEach(n => { s['x' + n] = 316 + (s['x' + n] - 328) * 1.45; s['y' + n] = 146 + (s['y' + n] - 150) * 1.45; }); }
    return st;
  })();
  CELLS[47] = (k, w, h, u) => {
    k.drawImage(layer('EM_bg', g => {
      g.fillStyle = '#e6ddcf'; g.fillRect(0, 0, CW, CH);
      for (let i = 0; i < 7; i++) { const x = hash(i + 30) * CW, gr = g.createLinearGradient(x - 40, 0, x + 40, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(${i % 2 ? '255,255,255' : '150,130,110'},.18)`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - 40, 0, 80, CH); }
      glow(g, EM_C[0] + 6, EM_C[1] + 8, EM_R + 22, '90,70,50', 0.35);
      g.save(); g.beginPath(); g.arc(EM_C[0], EM_C[1], EM_R, 0, TAU); g.clip();
      g.fillStyle = '#f5eedf'; g.fillRect(0, 0, CW, CH);
      g.fillStyle = 'rgba(150,130,100,.06)'; for (let y = 0; y < CH; y += 2) g.fillRect(0, y, CW, 0.7); for (let x = 0; x < CW; x += 2) g.fillRect(x, 0, 0.7, CH);
      const sg = g.createRadialGradient(EM_C[0] - 30, EM_C[1] - 40, 10, EM_C[0], EM_C[1], EM_R); sg.addColorStop(0, 'rgba(255,255,255,.35)'); sg.addColorStop(1, 'rgba(120,100,70,.12)'); g.fillStyle = sg; g.fillRect(0, 0, CW, CH);
      g.restore();
    }), 0, 0);
    const fade = 1 - resetK(u), n = EM_ST.length * seg(u, 0.15, 4.2), cnt = Math.floor(n);
    const sweep = seg(u, 4.35, 5.25), sp = mix(-130, 130, sweep), sx = Math.cos(EM_LIGHT + 0.4), sy = Math.sin(EM_LIGHT + 0.4);
    const end = (s, i) => (i === cnt ? [mix(s.x1, s.x2, n - cnt), mix(s.y1, s.y2, n - cnt)] : [s.x2, s.y2]);
    k.save(); k.beginPath(); k.arc(EM_C[0], EM_C[1], EM_R - 1, 0, TAU); k.clip(); k.globalAlpha = fade; k.lineCap = 'round';
    // 每针下的阴影：一次画完
    k.beginPath();
    for (let i = 0; i <= cnt && i < EM_ST.length; i++) { const s = EM_ST[i], [x2, y2] = end(s, i); k.moveTo(s.x1 + 0.8, s.y1 + 1); k.lineTo(x2 + 0.8, y2 + 1); }
    k.strokeStyle = 'rgba(90,70,50,.22)'; k.lineWidth = 1.9; k.stroke();
    // 按颜色分组一次描一批：颜色 = 底色 × 方向丝光，扫光时再提亮
    const B = new Map();
    for (let i = 0; i <= cnt && i < EM_ST.length; i++) {
      const s = EM_ST[i]; if (s.knot) continue;
      let b = 0.82 + 0.3 * Math.abs(Math.cos(s.a - EM_LIGHT)), wv = 0;
      if (sweep > 0 && sweep < 1) { const pr = (s.x1 - EM_C[0]) * sx + (s.y1 - EM_C[1]) * sy; wv = Math.exp(-Math.pow((pr - sp) / 20, 2)) * Math.abs(Math.cos(s.a - EM_LIGHT - 0.4)); }
      const c = s.c.map(v => Math.round(Math.min(255, v * b + (255 - v * b) * wv * 0.55) / 8) * 8), key = `rgb(${c})`;
      if (!B.has(key)) B.set(key, []);
      B.get(key).push(i);
    }
    k.lineWidth = 1.5;
    B.forEach((ids, key) => { k.beginPath(); ids.forEach(i => { const s = EM_ST[i], [x2, y2] = end(s, i); k.moveTo(s.x1, s.y1); k.lineTo(x2, y2); }); k.strokeStyle = key; k.stroke(); });
    if (cnt >= EM_ST.length) { const e = EM_ST[EM_ST.length - 1]; k.fillStyle = '#1e1816'; k.beginPath(); k.arc(e.x1, e.y1, 1.7, 0, TAU); k.fill(); k.fillStyle = 'rgba(255,255,255,.7)'; k.beginPath(); k.arc(e.x1 - 0.5, e.y1 - 0.5, 0.5, 0, TAU); k.fill(); }
    k.restore();
    // 绣针跟着最后一针，丝线连到画外；绣完后向右上离开
    const out = seg(u, 4.2, 4.6), na = (1 - out) * fade;
    if (na > 0.01 && u > 0.15) {
      const s = EM_ST[Math.min(cnt, EM_ST.length - 1)], [px, py] = end(s, Math.min(cnt, EM_ST.length - 1));
      const nx = px + 40 * out, ny = py - 60 * out;
      k.save(); k.globalAlpha = na;
      k.strokeStyle = `rgb(${s.c})`; k.lineWidth = 1; k.beginPath(); k.moveTo(nx + 10, ny - 16); k.quadraticCurveTo(nx + 40, ny - 40, 420, -4); k.stroke();
      k.strokeStyle = '#8e9aa6'; k.lineWidth = 1.6; k.beginPath(); k.moveTo(nx, ny); k.lineTo(nx + 11, ny - 18); k.stroke();
      k.strokeStyle = '#e8eef4'; k.lineWidth = 0.6; k.beginPath(); k.moveTo(nx + 0.6, ny - 1); k.lineTo(nx + 10.6, ny - 17.5); k.stroke();
      k.restore();
    }
    // 木绣绷：两层木圈 + 右上的铜螺丝
    k.drawImage(layer('EM_hoop', g => {
      [[EM_R + 9, 9, '#b98a56'], [EM_R + 3.5, 3, '#9a6c3c']].forEach(([r, lw, col]) => { g.beginPath(); g.arc(EM_C[0], EM_C[1], r - lw / 2, 0, TAU); g.strokeStyle = col; g.lineWidth = lw; g.stroke(); });
      const hg = g.createLinearGradient(EM_C[0] - EM_R, EM_C[1] - EM_R, EM_C[0] + EM_R, EM_C[1] + EM_R); hg.addColorStop(0, 'rgba(255,235,200,.45)'); hg.addColorStop(1, 'rgba(60,30,10,.35)');
      g.beginPath(); g.arc(EM_C[0], EM_C[1], EM_R + 4.5, 0, TAU); g.strokeStyle = hg; g.lineWidth = 9; g.stroke();
      g.strokeStyle = 'rgba(70,40,20,.5)'; g.lineWidth = 0.8; [EM_R, EM_R + 9].forEach(r => { g.beginPath(); g.arc(EM_C[0], EM_C[1], r, 0, TAU); g.stroke(); });
      const a = -1.05, x = EM_C[0] + (EM_R + 9) * Math.cos(a), y = EM_C[1] + (EM_R + 9) * Math.sin(a);
      g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2);
      g.fillStyle = '#9a6c3c'; g.fillRect(-7, -9, 14, 9); g.fillStyle = '#c9a86a'; g.fillRect(-2, -16, 4, 8); g.fillStyle = '#e0c88c'; g.fillRect(-6, -19, 12, 4);
      g.restore();
    }), 0, 0);
    grain(k, 0.05);
  };

  // @element 49
  // 49 彩色玻璃（参考 jingyu-skill「彩色玻璃」词条的说明重新实现，MIT · 阿梦freedom）：暗色石墙上的弧顶窗，窗上是凤鸟、花丛和远山后的太阳。
  // 每块玻璃是一个多边形，粗黑铅条包边；玻璃颜色按背后光源的远近决定亮度，块内有深浅与气泡；亮的玻璃泛光，并在窗下地面投出拉长、倒置的彩色光斑。
  // 节奏：0.2–3.8 秒背后的光从窗下升到太阳的位置，玻璃从暗到亮一块块透光（离光近的先亮），地面光斑随光升高而缩短；5.4–6.4 秒暗回起点。
  const SG_SUN = [334, 120];
  const SG_WIN = g => { g.beginPath(); g.moveTo(140, 158); g.lineTo(140, 54); g.arc(270, 206, 200, Math.atan2(-152, -130), Math.atan2(-152, 130)); g.lineTo(400, 158); g.closePath(); };
  const SG_TILES = (() => {
    const T = [], add = (pts, c) => T.push({ pts, c, cx: pts.reduce((s, p) => s + p[0], 0) / pts.length, cy: pts.reduce((s, p) => s + p[1], 0) / pts.length });
    const arcPts = (cx, cy, r, a0, a1, n = 3) => Array.from({ length: n + 1 }, (_, i) => [cx + r * Math.cos(mix(a0, a1, i / n)), cy + r * Math.sin(mix(a0, a1, i / n))]);
    const wedge = (cx, cy, r0, r1, a0, a1, c) => add([...arcPts(cx, cy, r1, a0, a1), ...arcPts(cx, cy, r0, a1, a0)], c);
    // 天空：以太阳为中心的放射光芒，金色与蓝色相间
    const RINGS = [14, 34, 60, 92, 132, 180, 250];
    const GOLD = [[252, 214, 90], [246, 182, 52], [236, 150, 40], [226, 128, 36], [214, 110, 40], [200, 96, 44]];
    const BLUE = [[120, 180, 230], [70, 140, 214], [46, 104, 196], [36, 80, 170], [30, 62, 150], [26, 50, 130]];
    for (let r = 0; r + 1 < RINGS.length; r++) {
      const n = r === 0 ? 10 : 20;
      for (let j = 0; j < n; j++) wedge(SG_SUN[0], SG_SUN[1], RINGS[r], RINGS[r + 1], Math.PI + j * Math.PI / n, Math.PI + (j + 1) * Math.PI / n, (r === 0 || j % 2 === 0) ? GOLD[r] : BLUE[r]);
    }
    add(arcPts(SG_SUN[0], SG_SUN[1], 14, 0, TAU, 16), [255, 232, 130]);
    // 远山与湖面
    const ridge = (x, b, a, s) => b - a * Math.abs(Math.sin(x / s + b));
    for (let x = 136; x < 404; x += 34) add([[x, 136], [x, ridge(x, 122, 12, 31)], [x + 17, ridge(x + 17, 122, 12, 31) - 4], [x + 34, ridge(x + 34, 122, 12, 31)], [x + 34, 136]], [128, 104, 176]);
    for (let x = 136; x < 404; x += 27) add([[x, 140], [x, ridge(x, 132, 6, 19)], [x + 27, ridge(x + 27, 132, 6, 19)], [x + 27, 140]], [86, 74, 150]);
    for (let y = 140, r = 0; y < 160; y += 6, r++) for (let x = 136 + (r % 2) * 14; x < 404; x += 30) add([[x, y], [x + 30, y], [x + 30, y + 6], [x, y + 6]], Math.abs(x + 15 - SG_SUN[0]) < 22 ? [246, 196, 80] : [[40, 110, 190], [60, 140, 210]][(r + x) % 2 ? 0 : 1]);
    // 凤鸟：尾羽 → 两翼 → 身、颈、头、喙、冠
    const RED = [200, 40, 34], ORG = [236, 112, 34], GLD = [250, 192, 62];
    const bez = (p0, p1, p2, t) => [mix(mix(p0[0], p1[0], t), mix(p1[0], p2[0], t), t), mix(mix(p0[1], p1[1], t), mix(p1[1], p2[1], t), t)];
    [[[250, 104], [210, 116], [172, 118]], [[254, 108], [234, 146], [192, 140]], [[258, 110], [256, 150], [224, 152]]].forEach(([p0, p1, p2]) => {
      const N = 6;
      for (let i = 0; i < N; i++) {
        const t0 = i / N, t1 = (i + 1) / N, a = bez(p0, p1, p2, t0), b = bez(p0, p1, p2, t1), dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy), w0 = mix(8, 5, t0), w1 = mix(8, 5, t1);
        add([[a[0] - dy / d * w0, a[1] + dx / d * w0], [b[0] - dy / d * w1, b[1] + dx / d * w1], [b[0] + dy / d * w1, b[1] - dx / d * w1], [a[0] + dy / d * w0, a[1] - dx / d * w0]], [RED, ORG, GLD][i % 3]);
      }
      add(arcPts(p2[0], p2[1], 7, 0, TAU, 12), GLD); add(arcPts(p2[0], p2[1], 3.6, 0, TAU, 10), [40, 90, 200]);
    });
    const SW = [262, 80];
    const feather = (a, len, curv) => {
      const dx = Math.cos(a), dy = Math.sin(a), sp = t => [SW[0] + dx * len * t - dy * curv * Math.sin(Math.PI * t), SW[1] + dy * len * t + dx * curv * Math.sin(Math.PI * t)], hw = t => 10 * (1 - 0.75 * t);
      [0, 0.38, 0.7, 1].reduce((t0, t1) => {
        const a0 = sp(t0), a1 = sp(t1);
        add([[a0[0] - dy * hw(t0), a0[1] + dx * hw(t0)], [a1[0] - dy * hw(t1), a1[1] + dx * hw(t1)], [a1[0] + dy * hw(t1), a1[1] - dx * hw(t1)], [a0[0] + dy * hw(t0), a0[1] - dx * hw(t0)]], t0 === 0 ? RED : t0 < 0.5 ? ORG : GLD);
        return t1;
      });
    };
    for (let i = 0; i < 8; i++) feather(-2.78 + i * 0.14, 74 - i * 3, -5);
    for (let i = 0; i < 7; i++) feather(-1.32 + i * 0.14, 64 - i * 4, 5);
    const body = Array.from({ length: 16 }, (_, i) => { const a = i / 16 * TAU; return [262 + 12 * Math.cos(a) * Math.cos(0.5) - 22 * Math.sin(a) * Math.sin(0.5), 92 + 12 * Math.cos(a) * Math.sin(0.5) + 22 * Math.sin(a) * Math.cos(0.5)]; });
    add(body.slice(0, 9), ORG); add([...body.slice(8), body[0]], RED);
    add([[266, 74], [276, 78], [295, 58], [289, 50]], ORG);
    add(arcPts(293, 53, 7, 0, TAU, 12), RED);
    add([[299, 50], [309, 53], [299, 56]], GLD);
    [[[288, 47], [278, 36], [284, 46]], [[291, 46], [286, 32], [293, 45]], [[294, 46], [296, 34], [297, 47]]].forEach(p => add(p, GLD));
    // 花丛：玫瑰（三层花瓣）与叶子
    const leaf = (x, y, a, len, wd) => { const dx = Math.cos(a), dy = Math.sin(a), m = [x + dx * len / 2, y + dy * len / 2], tip = [x + dx * len, y + dy * len]; add([[x, y], [m[0] - dy * wd, m[1] + dx * wd], tip], [36, 120, 56]); add([[x, y], tip, [m[0] + dy * wd, m[1] - dx * wd]], [70, 160, 70]); };
    [[156, 154, -0.5, 26, 7], [150, 132, -1.3, 24, 6], [176, 158, -0.1, 22, 6], [404, 126, -2.0, 26, 7], [372, 136, -2.5, 24, 6], [350, 156, -2.9, 22, 6]].forEach(l => leaf(...l));
    const rose = (cx, cy, r) => {
      for (let j = 0; j < 6; j++) wedge(cx, cy, r * 0.66, r, j / 6 * TAU, (j + 1) / 6 * TAU, [226, 70, 62]);
      for (let j = 0; j < 5; j++) wedge(cx, cy, r * 0.3, r * 0.68, j / 5 * TAU + 0.3, (j + 1) / 5 * TAU + 0.3, [196, 40, 46]);
      add(arcPts(cx, cy, r * 0.32, 0, TAU, 8), [140, 20, 34]);
    };
    rose(158, 148, 12); rose(190, 150, 9); rose(386, 146, 13); rose(362, 154, 9);
    return T;
  })();
  const SG_T = document.createElement('canvas'); SG_T.width = CW; SG_T.height = CH;
  const sgPath = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
  // 按铺块顺序生成的图层：先擦掉被后画玻璃盖住的部分，再画本块，遮挡关系与玻璃一致
  const sgOrdered = (name, each) => layer(name, g => {
    g.save(); SG_WIN(g); g.clip();
    SG_TILES.forEach((t, i) => { g.globalCompositeOperation = 'destination-out'; sgPath(g, t.pts); g.fill(); g.globalCompositeOperation = 'source-over'; each(g, t, i); });
    g.restore();
  });
  CELLS[48] = (k, w, h, u) => {
    const rise = inOut3(seg(u, 0.2, 3.8)), I = rise * (1 - resetK(u));
    const L = [SG_SUN[0], mix(250, SG_SUN[1] - 10, rise)];
    const g = SG_T.getContext('2d');
    g.clearRect(0, 0, CW, CH); g.save(); SG_WIN(g); g.clip();
    SG_TILES.forEach(t => {
      const d = Math.hypot(t.cx - L[0], t.cy - L[1]), b = 0.16 + I * (0.4 + 0.75 * Math.exp(-d * d / (2 * 95 * 95)));
      const c = t.c.map(v => Math.round(b <= 1 ? v * b : v + (255 - v) * (b - 1) * 0.6));
      sgPath(g, t.pts); g.fillStyle = `rgb(${c})`; g.fill();
    });
    g.drawImage(sgOrdered('SG_tex', (q, t, i) => {
      q.save(); sgPath(q, t.pts); q.clip();
      const r = Math.max(...t.pts.map(p => Math.hypot(p[0] - t.cx, p[1] - t.cy))), gr = q.createRadialGradient(t.cx - r * 0.3, t.cy - r * 0.3, 0, t.cx, t.cy, r);
      gr.addColorStop(0, 'rgba(255,255,255,.16)'); gr.addColorStop(1, 'rgba(0,0,0,.2)'); q.fillStyle = gr; q.fillRect(t.cx - r, t.cy - r, 2 * r, 2 * r);
      q.strokeStyle = 'rgba(255,255,255,.3)'; q.lineWidth = 0.6;
      for (let b = 0; b < 3; b++) if (hash(i * 7 + b) > 0.4) { q.beginPath(); q.arc(t.cx + (hash(i * 7 + b + 1) - 0.5) * r, t.cy + (hash(i * 7 + b + 2) - 0.5) * r, 0.6 + hash(i + b) * 1.1, 0, TAU); q.stroke(); }
      q.restore();
    }), 0, 0);
    g.restore();
    k.drawImage(layer('SG_wall', q => {
      const wg = q.createLinearGradient(0, 0, 0, CH); wg.addColorStop(0, '#1a171d'); wg.addColorStop(1, '#25201f'); q.fillStyle = wg; q.fillRect(0, 0, CW, 166);
      q.strokeStyle = 'rgba(255,240,220,.05)'; q.lineWidth = 1;
      for (let y = 0, r = 0; y < 166; y += 22, r++) { q.beginPath(); q.moveTo(0, y); q.lineTo(CW, y); q.stroke(); for (let x = (r % 2) * 30; x < CW; x += 60) { q.beginPath(); q.moveTo(x, y); q.lineTo(x, y + 22); q.stroke(); } }
      q.fillStyle = '#1b1715'; q.fillRect(0, 166, CW, CH - 166);
      q.strokeStyle = 'rgba(255,240,220,.05)'; for (let i = -12; i < 14; i++) { q.beginPath(); q.moveTo(270 + i * 24, 166); q.lineTo(270 + i * 44, CH); q.stroke(); }
      q.fillStyle = '#3a332e'; q.fillRect(126, 158, 288, 8); q.fillStyle = 'rgba(255,240,220,.12)'; q.fillRect(126, 158, 288, 1.5);
    }), 0, 0);
    glow(k, 270, 96, 240, '255,196,120', 0.16 * I);
    // 地面光斑：窗的倒影拉长、模糊后叠加；光越高，光斑越短
    const sy = mix(0.62, 0.34, rise);
    k.save(); k.beginPath(); k.rect(0, 166, CW, CH - 166); k.clip();
    k.globalCompositeOperation = 'lighter'; k.globalAlpha = 0.55 * I; k.filter = 'blur(3px)';
    k.transform(1.3, 0, 0, -sy, 270 - 1.3 * 270, 166 + 158 * sy); k.drawImage(SG_T, 0, 0);
    k.restore();
    k.drawImage(SG_T, 0, 0);
    k.drawImage(sgOrdered('SG_lead', (q, t) => { sgPath(q, t.pts); q.strokeStyle = '#15110f'; q.lineWidth = 2.4; q.lineJoin = 'round'; q.stroke(); }), 0, 0);
    k.drawImage(layer('SG_frame', q => {
      q.fillStyle = '#15110f'; q.beginPath(); q.arc(295, 51.5, 1.7, 0, TAU); q.fill();
      q.save(); SG_WIN(q); q.clip(); q.fillStyle = '#211b18'; [84, 122].forEach(y => q.fillRect(130, y - 1.2, 280, 2.4)); q.restore();
      SG_WIN(q); q.strokeStyle = '#3e3732'; q.lineWidth = 10; q.stroke(); q.strokeStyle = '#15110f'; q.lineWidth = 3; q.stroke();
    }), 0, 0);
    // 亮的玻璃泛光
    k.save(); k.globalCompositeOperation = 'lighter'; k.globalAlpha = 0.32 * I; k.filter = 'blur(6px)'; k.drawImage(SG_T, 0, 0); k.restore();
    grain(k, 0.05);
  };

  // @element 50
  // 50 青绿山水（参考 jingyu-skill「青绿山水」词条的说明重新实现，MIT · 阿梦freedom）：绢本长卷横向缓缓展开，
  // 远、中、近三重山以不同速度平移。每座山由主峰加两座子峰叠成，山顶圆、山壁陡；山体先只有墨线和披麻皴，
  // 0.6–2.6 秒石青、石绿自上而下染开，山脚压赭石；山腰有云带，中景山头一座小亭，近景山谷里一座石桥、桥上一人，江上一叶小舟。
  // 三层的画卷周期是 540 / 810 / 1080 像素，一个周期分别平移正好 1 个画卷周期，首尾帧一致。
  // 5.4–6.0 秒颜色退回墨线，回到开头。
  const QL_SILK = [214, 192, 150], QL_INK = 'rgba(46,40,30,.9)';
  const QL_LAYERS = [
    // 远山：周期 540、半速；[中心, 高, 半宽]（画卷坐标）
    { P: 540, base: 132, sp: 0.5, ink: 0.4, a: 0.5, step: 6, hs: 0.85,
      bumps: [[20, 44, 30], [80, 62, 28], [150, 40, 24], [220, 66, 32], [300, 48, 26], [370, 60, 30], [440, 42, 24], [500, 56, 30]] },
    // 中景：周期 810、3/4 速
    { P: 810, base: 160, sp: 0.75, ink: 0.7, a: 0.78, step: 9, hs: 0.72,
      bumps: [[30, 70, 40], [110, 96, 42], [200, 60, 30], [290, 104, 44], [380, 74, 36], [470, 92, 40], [560, 62, 30], [650, 100, 46], [740, 70, 36]] },
    // 近景：周期 1080、全速；500–660 留出山谷给石桥与江面
    { P: 1080, base: 210, sp: 1, ink: 1, a: 0.95, step: 12, hs: 0.78,
      bumps: [[50, 120, 46], [170, 146, 52], [270, 84, 34], [430, 132, 46], [740, 140, 50], [860, 96, 38], [980, 150, 54]] },
  ].map(L => ({ ...L, bumps: L.bumps.map(([c, H, B]) => [c, H * L.hs, B]) })).map(L => ({ ...L, top: L.base - Math.max(...L.bumps.map(b => b[1])) - 6,
    // 主峰两侧各叠一座矮一些的子峰，让山成簇，不再是一排单尖
    all: L.bumps.flatMap(([c, H, B]) => [[c, H, B], [c - 0.5 * B, 0.68 * H, 0.5 * B], [c + 0.55 * B, 0.6 * H, 0.45 * B]]) }));
  const QL_BRIDGE = 590, QL_BOAT = 530, QL_PAV = 290;   // 石桥、小舟（近景坐标）与小亭（中景坐标）
  // 画卷坐标 X 处的山高：各峰取最大值，峰形 cos^0.55（顶圆、壁陡），再叠一点按周期整数倍起伏的碎纹
  function qlH(L, X) {
    let h = 0;
    for (const [c, H, B] of L.all) {
      let d = X - c; d -= L.P * Math.round(d / L.P);   // 取最近的那一份，保证画卷首尾相接
      const t = Math.abs(d) / B;
      if (t < 1) h = Math.max(h, H * Math.pow(Math.cos(t * Math.PI / 2), 0.55));
    }
    if (h > 0) h += (3 * Math.sin(TAU * 37 * X / L.P) + 2 * Math.sin(TAU * 61 * X / L.P)) * Math.min(1, h / 30);
    return Math.max(0, h);
  }
  // 画卷坐标 → 屏幕 x（落在可见范围附近的那一份）
  const qlScr = (X, sh, P) => { let x = ((X - sh) % P + P) % P; if (x > CW + 80) x -= P; return x; };
  function qlLayer(k, L, sh, rev, near) {
    const ys = [];
    for (let x = -3; x <= CW + 3; x += 3) ys.push([x, L.base - qlH(L, x + sh)]);
    const ridge = () => { k.beginPath(); ys.forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y))); };
    ridge(); k.lineTo(CW + 3, CH + 2); k.lineTo(-3, CH + 2); k.closePath();
    k.fillStyle = rgba(near ? QL_SILK : lerpC(QL_SILK, [236, 224, 196], 0.25), 1); k.fill();
    if (rev > L.top) {                                  // 染色只到 rev 这条水平线（自上而下染开）
      k.save(); k.clip();
      const g = k.createLinearGradient(0, L.top, 0, L.base);
      g.addColorStop(0, '#24557e'); g.addColorStop(0.38, '#2f8a78'); g.addColorStop(0.72, '#7fa56c'); g.addColorStop(1, '#b37a45');
      k.globalAlpha = L.a; k.fillStyle = g; k.fillRect(-3, L.top, CW + 6, Math.min(CH + 2, rev) - L.top);
      k.restore();
    }
    // 披麻皴：顺着山势向下的长短墨线，钉在画卷坐标上随山平移
    k.beginPath();
    for (let X = Math.ceil(sh / L.step) * L.step; X - sh <= CW + 3; X += L.step) {
      const x = X - sh, h = qlH(L, X); if (h < 8) continue;
      const s = Math.sign(qlH(L, X + 2) - qlH(L, X - 2)) || 1, y = L.base - h, len = Math.min(h * 0.5, 34 * L.ink);
      k.moveTo(x, y + 2); k.quadraticCurveTo(x - s * 5, y + len * 0.5, x - s * 3, y + len);
      if (h > 34) { k.moveTo(x - s * 3, y + len + 5); k.quadraticCurveTo(x - s * 7, y + len + 14, x - s * 4, y + Math.min(h - 4, len + 26)); }
    }
    k.strokeStyle = `rgba(46,40,30,${0.45 * L.ink + 0.1})`; k.lineWidth = 0.7; k.stroke();
    // 山脊上的苔点与松树：按画卷格子编号取确定性哈希，位置随山走
    const n = L.P / L.step;
    for (let X = Math.ceil(sh / L.step) * L.step; X - sh <= CW + 3; X += L.step) {
      const idx = ((Math.round(X / L.step) % n) + n) % n, hv = hash(idx * 7 + L.P), x = X - sh, h = qlH(L, X), y = L.base - h;
      if (h < 14 || hv < 0.45) continue;
      if (near && hv > 0.62) {                          // 小松：一根干、三层针叶
        k.strokeStyle = QL_INK; k.lineWidth = 0.8; k.beginPath(); k.moveTo(x, y + 2); k.lineTo(x + 0.5, y - 9); k.stroke();
        k.fillStyle = 'rgba(28,70,52,.9)';
        [[-9, 3.2], [-6, 4.6], [-3, 5.6]].forEach(([dy, rx]) => { k.beginPath(); k.ellipse(x, y + dy, rx, 1.6, 0, 0, TAU); k.fill(); });
      } else {
        k.fillStyle = `rgba(30,50,36,${0.5 + 0.3 * L.ink})`;
        k.beginPath(); k.arc(x - 1.5, y + 2, 0.9 + 0.5 * L.ink, 0, TAU); k.arc(x + 2, y + 3.5, 0.7 + 0.4 * L.ink, 0, TAU); k.fill();
      }
    }
    ridge(); k.strokeStyle = QL_INK; k.lineWidth = 0.5 + 0.7 * L.ink; k.stroke();
  }
  // 山脚的云带：底部渐浓的米白色带，加几团随该层平移的云头
  function qlMist(k, L, sh, a) {
    const y = L.base, g = k.createLinearGradient(0, y - 26, 0, y + 6);
    g.addColorStop(0, 'rgba(244,236,214,0)'); g.addColorStop(0.7, `rgba(244,236,214,${a})`); g.addColorStop(1, 'rgba(244,236,214,0)');
    k.fillStyle = g; k.fillRect(0, y - 26, CW, 32);
    k.fillStyle = `rgba(246,238,218,${a * 0.8})`;
    for (let i = 0; i < L.P / 90; i++) {
      if (hash(i + L.P * 3) < 0.4) continue;
      const x = qlScr(i * 90 + 30, sh, L.P); if (x < -40 || x > CW + 40) continue;
      k.beginPath(); k.ellipse(x, y - 10, 26, 5, 0, 0, TAU); k.ellipse(x + 16, y - 14, 14, 4, 0, 0, TAU); k.fill();
    }
  }
  CELLS[49] = (k, w, h, u) => {
    const off = u / CYC * 1080;                         // 近景平移量；远、中景按各自 sp 换算
    const fill = inOut3(seg(u, 0.6, 2.6)) * (1 - inOut3(seg(u, SHOW, SHOW + 0.6)));
    const rev = mix(-10, CH + 10, fill);
    const [FAR, MID, NEAR] = QL_LAYERS, sh = L => (off * L.sp) % L.P;
    k.fillStyle = rgba(QL_SILK, 1); k.fillRect(0, 0, CW, CH);
    paper(k, [120, 90, 50], 900, 50);
    const sky = k.createLinearGradient(0, 0, 0, 120); sky.addColorStop(0, 'rgba(120,80,40,.10)'); sky.addColorStop(1, 'rgba(120,80,40,0)');
    k.fillStyle = sky; k.fillRect(0, 0, CW, 120);
    qlLayer(k, FAR, sh(FAR), rev, false); qlMist(k, FAR, sh(FAR), 0.7);
    qlLayer(k, MID, sh(MID), rev, false);
    // 中景山头的小亭
    { const x = qlScr(QL_PAV, sh(MID), MID.P), y = MID.base - qlH(MID, QL_PAV);
      if (x > -20 && x < CW + 20) {
        k.strokeStyle = QL_INK; k.lineWidth = 0.9; k.beginPath(); k.moveTo(x - 4, y + 1); k.lineTo(x - 4, y - 7); k.moveTo(x + 4, y + 1); k.lineTo(x + 4, y - 7); k.stroke();
        k.fillStyle = '#7a2e1c'; k.beginPath(); k.moveTo(x - 10, y - 6); k.quadraticCurveTo(x, y - 9, x + 10, y - 6); k.lineTo(x + 2, y - 13); k.lineTo(x - 2, y - 13); k.closePath(); k.fill();
      } }
    qlMist(k, MID, sh(MID), 0.8);
    // 江面与水纹（水纹间距 45 像素，1080 / 45 为整数，首尾一致）
    k.fillStyle = rgba(lerpC(QL_SILK, [170, 196, 176], 0.25 + 0.3 * fill), 1); k.fillRect(0, 170, CW, CH - 170);
    k.beginPath();
    for (let r = 0; r < 6; r++) for (let x = -((off + r * 17) % 45); x < CW; x += 45) { const y = 175 + r * 5.5; k.moveTo(x, y); k.quadraticCurveTo(x + 8, y - 2, x + 16, y); }
    k.strokeStyle = 'rgba(60,70,60,.35)'; k.lineWidth = 0.7; k.stroke();
    // 小舟：在近景坐标里，随画卷平移，轻轻起伏
    { const x = qlScr(QL_BOAT, sh(NEAR), NEAR.P), y = 186 + 1.2 * Math.sin(TAU * 2 * u / CYC);
      if (x > -30 && x < CW + 30) {
        k.beginPath(); k.moveTo(x - 15, y); k.quadraticCurveTo(x, y + 6, x + 15, y); k.closePath(); k.fillStyle = '#5a3d24'; k.fill();
        k.beginPath(); k.moveTo(x + 2, y - 1); k.lineTo(x + 2, y - 19); k.lineTo(x + 11, y - 3); k.closePath(); k.fillStyle = 'rgba(236,222,190,.92)'; k.fill(); k.strokeStyle = QL_INK; k.lineWidth = 0.7; k.stroke();
        k.fillStyle = QL_INK; k.beginPath(); k.moveTo(x - 9, y - 1); k.lineTo(x - 5, y - 1); k.lineTo(x - 7, y - 6); k.fill();
      } }
    qlLayer(k, NEAR, sh(NEAR), rev, true);
    // 石桥与桥上的人（斗笠 + 红衫，只有几笔）
    { const bx = qlScr(QL_BRIDGE, sh(NEAR), NEAR.P);
      if (bx > -60 && bx < CW + 60) {
        k.fillStyle = rgba(lerpC(QL_SILK, [150, 120, 90], 0.3), 1);
        k.beginPath(); k.moveTo(bx - 40, 184); k.quadraticCurveTo(bx, 156, bx + 40, 184); k.lineTo(bx + 40, 188); k.lineTo(bx + 14, 188); k.quadraticCurveTo(bx, 168, bx - 14, 188); k.lineTo(bx - 40, 188); k.closePath(); k.fill();
        k.strokeStyle = QL_INK; k.lineWidth = 1; k.stroke();
        const px = bx - 5, py = 169;
        k.fillStyle = '#c94a32'; k.beginPath(); k.moveTo(px - 2.5, py); k.lineTo(px + 2.5, py); k.lineTo(px + 1.5, py - 8); k.lineTo(px - 1.5, py - 8); k.fill();
        k.fillStyle = QL_INK; k.beginPath(); k.moveTo(px - 4.5, py - 8); k.lineTo(px + 4.5, py - 8); k.lineTo(px, py - 11.5); k.fill();
      } }
    // 卷轴两端的木轴与朱印
    k.fillStyle = '#6b4226'; k.fillRect(0, 0, 6, CH); k.fillRect(CW - 6, 0, 6, CH);
    k.fillStyle = '#b3261e'; k.fillRect(CW - 30, 14, 12, 16);
    txt(k, '印', CW - 24, 26, `600 10px ${SERIF}`, '#f4e2c4', 'center');
    grain(k, 0.08);
  };

  // @element 51
  // 51 中国剪纸（参考 jingyu-skill「中国剪纸」词条的说明重新实现，MIT · 阿梦freedom）：对折的红纸被刻刀从上往下一刀刀刻开，
  // 展开后是一幅左右对称的团花：外圈锯齿纹，左右两条细长的鲤鱼头朝上相对跃起，中间一朵大荷花，下方荷叶与水波，
  // 空处填满卷云纹；鱼鳞是成排的月牙镂空，花瓣只留轮廓线，所有红线彼此相连。
  // 节奏：0.2–2.6 秒刀尖沿半圆从上往下刻（已刻区域露出图案，未刻区域仍是整张红纸）；2.7–3.3 秒展开；展示到 5.4 秒，复位段淡回对折红纸。
  const PC_C = [270, 104], PC_R = 92;
  const PC_RED = '#c8161d';
  let PC_BUF = null;                                  // 离屏画布：每帧整张重画，不跨帧保留状态
  // 在离屏 g 上画「左半边」完整图案（坐标以圆心为原点，x ≤ 0）。先铺红，再用 destination-out 挖镂空、source-over 补红线
  function pcPattern(g) {
    const cut = fn => { g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.strokeStyle = '#000'; fn(); g.globalCompositeOperation = 'source-over'; g.fillStyle = PC_RED; g.strokeStyle = PC_RED; };
    g.fillStyle = PC_RED; g.strokeStyle = PC_RED; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.arc(0, 0, PC_R, Math.PI / 2, Math.PI * 1.5); g.closePath(); g.fill();
    // 外圈：r 84–92 留红并刻一圈锯齿；内圈整片挖空，之后只把图案补回来
    cut(() => {
      for (let i = 0; i < 26; i++) {
        const a0 = Math.PI / 2 + i / 26 * Math.PI, a1 = a0 + Math.PI / 26;
        g.beginPath(); g.moveTo(84 * Math.cos(a0), 84 * Math.sin(a0)); g.lineTo(90 * Math.cos((a0 + a1) / 2), 90 * Math.sin((a0 + a1) / 2)); g.lineTo(84 * Math.cos(a1), 84 * Math.sin(a1)); g.closePath(); g.fill();
      }
      g.beginPath(); g.arc(0, 0, 81, Math.PI / 2, Math.PI * 1.5); g.closePath(); g.fill();
    });
    g.lineWidth = 2.6; g.beginPath(); g.arc(0, 0, 77, Math.PI / 2, Math.PI * 1.5); g.stroke();
    g.lineWidth = 2; for (let i = 0; i < 20; i++) { const a = Math.PI / 2 + (i + 0.5) / 20 * Math.PI; g.beginPath(); g.moveTo(77 * Math.cos(a), 77 * Math.sin(a)); g.lineTo(83 * Math.cos(a), 83 * Math.sin(a)); g.stroke(); }
    // 卷云纹：空处的小漩涡，线宽 1.8，彼此和外圈相接
    g.lineWidth = 1.8;
    [[-62, -40, 7, 0.4], [-70, -10, 6, 1.6], [-50, -62, 6, 2.6], [-26, -70, 5, 0.9], [-72, 22, 6, 3.4], [-12, -56, 5, 2], [-64, 46, 5, 0.2]].forEach(([x, y, r, rot]) => {
      g.beginPath(); for (let t = 0; t <= 1; t += 0.04) { const ang = rot + t * 9, rr0 = r * (1 - t * 0.85); g.lineTo(x + rr0 * Math.cos(ang), y + rr0 * Math.sin(ang)); } g.stroke();
      g.beginPath(); g.moveTo(x + r * Math.cos(rot), y + r * Math.sin(rot)); g.lineTo(x + (r + 7) * Math.cos(rot), y + (r + 7) * Math.sin(rot)); g.stroke();
    });
    // 水波：底部三排鱼鳞状波纹
    g.lineWidth = 2;
    for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) { const x = -6 - i * 13 - (r % 2) * 6, y = 50 + r * 8; if (Math.hypot(x, y) > 76) continue; g.beginPath(); g.arc(x, y, 6.5, Math.PI, TAU); g.stroke(); }
    // 荷叶：左下一片，叶脉是放射的镂空
    g.beginPath(); g.ellipse(-40, 40, 22, 12, -0.25, 0, TAU); g.fill();
    cut(() => { for (let i = 0; i < 7; i++) { const a = -0.25 + Math.PI * (0.1 + i / 7.5); g.beginPath(); g.ellipse(-40 + 11 * Math.cos(a), 40 + 6 * Math.sin(a), 7, 1.3, a, 0, TAU); g.fill(); } });
    // 鲤鱼（左边一条，头朝上）：身子饱满呈弧形，最宽处约 38 像素；尾柄收细后分成两叶扇形尾
    const body = new Path2D('M -20 -60 C -6 -56 -4 -36 -10 -18 C -14 0 -18 18 -22 30 L -30 32 C -42 16 -50 -2 -48 -24 C -46 -44 -34 -58 -20 -60 Z');
    g.fill(body);
    g.fill(new Path2D('M -22 29 C -12 38 -8 52 -12 64 C -18 58 -22 52 -26 45 C -30 53 -38 59 -48 61 C -45 50 -38 40 -30 31 Z'));   // 尾：上下两叶
    g.fill(new Path2D('M -47 -32 C -58 -31 -63 -16 -59 -5 C -55 -10 -51 -12 -48 -12 Z'));                                            // 背鳍
    g.fill(new Path2D('M -10 -26 C -2 -24 2 -16 0 -9 C -4 -13 -8 -15 -12 -15 Z'));                                                  // 胸鳍
    g.fill(new Path2D('M -16 8 C -8 10 -6 18 -8 22 C -11 18 -14 16 -18 16 Z'));                                                     // 腹鳍
    cut(() => {
      // 月牙鳞：在身子内部按交错网格排，只留完全落在身内的
      for (let y = -38, r = 0; y <= 22; y += 6.5, r++) for (let x = -48 + (r % 2) * 3.5; x <= -10; x += 7) {
        const X = x + PC_C[0], Y = y + PC_C[1];
        if (![[0, 0], [-4.5, 0], [4.5, 0], [0, 4]].every(([dx, dy]) => g.isPointInPath(body, X + dx, Y + dy))) continue;
        g.beginPath(); g.arc(x, y, 3.4, 0.12 * Math.PI, 0.88 * Math.PI); g.arc(x, y - 1.8, 2.8, 0.85 * Math.PI, 0.15 * Math.PI, true); g.closePath(); g.fill();
      }
      g.beginPath(); g.arc(-22, -50, 2.8, 0, TAU); g.fill();                    // 眼
      g.lineWidth = 1.3; g.beginPath(); g.arc(-26, -58, 15, 0.2 * Math.PI, 0.75 * Math.PI); g.stroke();   // 鳃线
      g.lineWidth = 1.1;
      for (let i = 0; i < 5; i++) { const t = i / 4; g.beginPath(); g.moveTo(-25, 36); g.lineTo(mix(-14, -44, t), mix(60, 58, t) - Math.sin(t * Math.PI) * 10); g.stroke(); }   // 尾纹放射
      for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-48, -28 + i * 6); g.lineTo(-57 + i * 1.5, -24 + i * 6); g.stroke(); }                                          // 背鳍纹
    });
    g.fillStyle = PC_RED; g.beginPath(); g.arc(-22, -50, 1.2, 0, TAU); g.fill();
    g.lineWidth = 1.6; g.beginPath(); g.moveTo(-14, -58); g.quadraticCurveTo(-4, -64, -8, -74); g.stroke();   // 须
    // 荷花：只画左半（花心在对称轴上，镜像后成整朵）；花瓣只留轮廓线，瓣内一道细脉
    const petal = (x, y, rx, ry, rot) => {
      g.save(); g.translate(x, y); g.rotate(rot);
      g.beginPath(); g.moveTo(0, ry); g.quadraticCurveTo(-rx * 1.3, 0, 0, -ry); g.quadraticCurveTo(rx * 1.3, 0, 0, ry); g.closePath();
      g.lineWidth = 2.2; g.stroke(); g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, ry * 0.7); g.lineTo(0, -ry * 0.6); g.stroke();
      g.restore();
    };
    g.fillStyle = PC_RED;
    g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, 30); g.lineTo(0, 76); g.stroke();                              // 茎
    petal(-24, 16, 7, 15, -1.15); petal(-16, 6, 7, 17, -0.6); petal(0, -2, 8, 22, 0);
    g.beginPath(); g.moveTo(-14, 24); g.quadraticCurveTo(-26, 30, -32, 26); g.lineWidth = 2; g.stroke();
    g.beginPath(); g.rect(-14, 20, 14, 10); g.fill();                                                                // 莲蓬
    cut(() => { [[-10, 23], [-4, 23], [-7, 27.5]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 1.5, 0, TAU); g.fill(); }); });
    // 对称轴上留一条红线，保证左右两半展开后连成一片
    g.fillStyle = PC_RED; g.fillRect(-1.2, -77, 1.2, 154);
  }
  CELLS[50] = (k, w, h, u) => {
    if (!PC_BUF) { PC_BUF = document.createElement('canvas'); PC_BUF.width = CW; PC_BUF.height = CH; }
    const g = PC_BUF.getContext('2d');
    const cutP = inOut3(seg(u, 0.2, 2.6)), open = inOut3(seg(u, 2.7, 3.3)), back = resetK(u);
    // 刻到的位置：从顶部（角度 1.5π）沿左半圆转到底部（0.5π）
    const edge = Math.PI * 1.5 - cutP * Math.PI;
    k.fillStyle = '#efe6d2'; k.fillRect(0, 0, CW, CH); paper(k, [150, 120, 80], 700, 51);
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.globalAlpha = 1;
    g.translate(PC_C[0], PC_C[1]);
    pcPattern(g);
    // 还没刻到的扇区补回整张红纸
    if (cutP < 1) { g.fillStyle = PC_RED; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, PC_R, Math.PI / 2, edge); g.closePath(); g.fill(); }
    g.setTransform(1, 0, 0, 1, 0, 0);
    k.save(); k.globalAlpha = 1 - back;
    k.shadowColor = 'rgba(80,30,10,.28)'; k.shadowBlur = 6; k.shadowOffsetY = 2;
    k.drawImage(PC_BUF, 0, 0);
    if (open > 0.001) {                                  // 右半边：左半镜像，宽度从 0 展开到 1，途中稍暗表示纸面翻转
      k.translate(PC_C[0], 0); k.scale(-open, 1); k.translate(-PC_C[0], 0);
      k.filter = `brightness(${mix(0.7, 1, open)})`; k.drawImage(PC_BUF, 0, 0); k.filter = 'none';
    }
    k.restore();
    if (back > 0) {                                      // 复位：对折的整张红纸淡入，与 u = 0 一致
      k.save(); k.globalAlpha = back; k.shadowColor = 'rgba(80,30,10,.28)'; k.shadowBlur = 6; k.shadowOffsetY = 2;
      k.beginPath(); k.arc(PC_C[0], PC_C[1], PC_R, Math.PI / 2, Math.PI * 1.5); k.closePath(); k.fillStyle = PC_RED; k.fill(); k.restore();
    }
    if (open < 1) {                                      // 对折线
      k.strokeStyle = `rgba(90,10,10,${0.5 * (1 - open)})`; k.lineWidth = 1.2;
      k.beginPath(); k.moveTo(PC_C[0], PC_C[1] - PC_R); k.lineTo(PC_C[0], PC_C[1] + PC_R); k.stroke();
    }
    // 刻刀：刀尖落在刻线上，沿半径来回走（每段 0.3 秒一个来回）
    const kn = seg(u, 0.05, 0.2) * (1 - seg(u, 2.6, 2.8));
    if (kn > 0) {
      const r = 16 + 62 * Math.abs(Math.sin(TAU * u / 0.6)), x = PC_C[0] + r * Math.cos(edge), y = PC_C[1] + r * Math.sin(edge);
      k.save(); k.globalAlpha = kn; k.translate(x, y); k.rotate(-0.5);
      k.fillStyle = '#d9dde2'; k.beginPath(); k.moveTo(0, 0); k.lineTo(3, -14); k.lineTo(-3, -14); k.closePath(); k.fill();
      k.fillStyle = '#8a5a2b'; rr(k, -3.5, -48, 7, 34, 2); k.fill();
      k.restore();
    }
  };

  // @element 52
  // 52 皮影（参考 jingyu-skill「皮影」词条的说明重新实现，MIT · 阿梦freedom）：暖黄灯光透过白幕，两个侧脸皮影隔幕相对。
  // 左边女子身形修长（头小、身长约 8 个头高），高髻插簪，长裙分三层，水袖是半透明的长绸；右边武将骑马，马身是连贯的曲线，
  // 腿分大腿、小腿两节。每块部件先填半透明色，再在部件内刻满细密的圆点与月牙纹（透出幕布的亮色），边缘留一道细镂空线，
  // 关节处一颗铆钉，竹签连在手上和身上。女子抬臂甩袖，马踏步、武将随马颠动，灯光轻闪；全部用整数倍频率，首尾一致。
  const PY_INK = 'rgba(38,16,8,.95)', PY_LIT = 'rgba(255,228,168,.9)';
  const PY_COL = { red: 'rgba(190,36,26,.82)', green: 'rgba(36,112,58,.8)', yel: 'rgba(228,164,36,.82)', blk: 'rgba(32,14,8,.9)', blue: 'rgba(40,70,140,.78)' };
  // 刻纹：在当前路径内按网格刻小孔。kind 0 圆点、1 月牙、2 菱格，step 为网格间距
  function pyCarve(k, path, kind, step, x0, y0, x1, y1) {
    k.save(); k.clip(path); k.fillStyle = PY_LIT; k.beginPath();
    for (let y = y0, r = 0; y < y1; y += step, r++) for (let x = x0 + (r % 2) * step / 2; x < x1; x += step) {
      if (kind === 0) { k.moveTo(x + step * 0.18, y); k.arc(x, y, step * 0.18, 0, TAU); }
      else if (kind === 1) { k.moveTo(x + step * 0.3, y); k.arc(x, y, step * 0.3, 0, Math.PI); k.arc(x, y - step * 0.1, step * 0.24, Math.PI, 0, true); }
      else { k.moveTo(x, y - step * 0.22); k.lineTo(x + step * 0.22, y); k.lineTo(x, y + step * 0.22); k.lineTo(x - step * 0.22, y); k.closePath(); }
    }
    k.fill(); k.restore();
  }
  // 一块部件：填色 → 刻纹 → 边内一道亮线（镂空的描边）→ 墨色外轮廓
  function pyPart(k, d, col, carve) {
    const p = typeof d === 'string' ? new Path2D(d) : d;
    k.fillStyle = col; k.fill(p);
    if (carve) pyCarve(k, p, ...carve);
    k.save(); k.clip(p); k.strokeStyle = PY_LIT; k.lineWidth = 2.2; k.stroke(p); k.restore();
    k.strokeStyle = PY_INK; k.lineWidth = 1.1; k.stroke(p);
    return p;
  }
  const pyRivet = (k, x, y) => { k.beginPath(); k.arc(x, y, 2, 0, TAU); k.fillStyle = '#2a140a'; k.fill(); k.beginPath(); k.arc(x - 0.5, y - 0.5, 0.7, 0, TAU); k.fillStyle = 'rgba(255,220,160,.6)'; k.fill(); };
  function pyRod(k, x, y, lean) { k.beginPath(); k.moveTo(x, y); k.lineTo(x + lean, CH + 4); k.strokeStyle = 'rgba(30,14,8,.55)'; k.lineWidth = 1.2; k.stroke(); }
  function pyJoint(k, x, y, a, fn) { k.save(); k.translate(x, y); k.rotate(a); fn(); k.restore(); pyRivet(k, x, y); }
  function pyLady(k, a) {
    const x = 160, y = 30 + 1.2 * Math.sin(a * 2);
    k.save(); k.translate(x, y);
    // 后侧的水袖（随甩动在身后飘）
    const sw = Math.sin(a * 2);
    pyPart(k, `M 8 40 C 30 ${70 + 10 * sw} 24 ${110 + 8 * sw} ${6 + 10 * sw} 150 C 0 140 10 100 0 46 Z`, 'rgba(250,232,196,.38)', [0, 7, -10, 30, 40, 160]);
    // 裙：三层，最下层拖地
    pyPart(k, 'M -6 96 C -20 120 -30 146 -40 168 L 34 168 C 26 146 18 120 12 96 Z', PY_COL.red, [1, 9, -44, 96, 40, 172]);
    pyPart(k, 'M -4 76 C -14 92 -20 108 -24 124 C -6 130 10 130 22 124 C 18 108 14 92 10 76 Z', PY_COL.green, [2, 7, -26, 76, 24, 132]);
    pyPart(k, 'M -16 118 C -6 124 10 124 22 118 L 24 126 C 8 132 -8 132 -18 126 Z', PY_COL.yel);
    // 上身与云肩
    pyPart(k, 'M -4 30 C -8 44 -8 62 -6 80 L 12 80 C 14 62 14 44 8 30 Z', PY_COL.red, [0, 6, -10, 30, 16, 82]);
    pyPart(k, 'M -8 30 C -2 26 8 26 14 30 C 16 38 12 44 2 46 C -6 44 -10 38 -8 30 Z', PY_COL.blue, [1, 5, -10, 26, 16, 48]);
    // 腰带与垂下的流苏
    k.strokeStyle = PY_COL.yel; k.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) { k.beginPath(); k.moveTo(2 + i * 3, 80); k.quadraticCurveTo(4 + i * 3 + 3 * sw, 100, 2 + i * 4, 116); k.stroke(); }
    // 头：侧脸（额、鼻、唇、下巴）连着后脑勺，是一整颗头；脸是镂空的亮色，只留细眉眼
    pyPart(k, 'M 6 2 C 9 4 10 7 11 11 L 13 14 L 11 15 C 12 17 11 19 9 20 C 8 23 4 25 0 25 C -6 24 -10 18 -10 12 C -10 4 -4 0 6 2 Z', 'rgba(255,238,206,.5)');
    k.strokeStyle = PY_INK; k.lineWidth = 0.9; k.beginPath(); k.moveTo(4, 9); k.quadraticCurveTo(7, 8, 9, 10); k.moveTo(5, 12); k.lineTo(8.5, 12.5); k.stroke();
    // 头发：沿头顶外缘（半径 11.5）包住后脑，内缘（半径 8）就是发际线，紧贴头皮；后上方再盘一大一小两个发髻
    const hair = new Path2D();
    hair.arc(0, 11, 11.5, 0.78 * Math.PI, 1.8 * Math.PI); hair.arc(0, 11, 8, 1.78 * Math.PI, 0.9 * Math.PI, true); hair.closePath();
    hair.moveTo(-1 + 7.5, -5); hair.arc(-1, -5, 7.5, 0, TAU);
    hair.moveTo(-9 + 4.5, 0); hair.arc(-9, 0, 4.5, 0, TAU);
    pyPart(k, hair, PY_COL.blk, [0, 4, -16, -14, 14, 22]);
    k.strokeStyle = PY_COL.yel; k.lineWidth = 1.4; k.beginPath(); k.moveTo(-12, -4); k.lineTo(12, -11); k.stroke();
    [[12, -11], [-6, -12]].forEach(([px, py]) => { k.beginPath(); k.arc(px, py, 2.4, 0, TAU); k.fillStyle = PY_COL.red; k.fill(); k.strokeStyle = PY_INK; k.lineWidth = 0.8; k.stroke(); });
    k.strokeStyle = PY_COL.yel; k.lineWidth = 1; k.beginPath(); k.moveTo(12, -9); k.lineTo(13 + 2 * sw, 2); k.stroke();
    k.beginPath(); k.arc(13 + 2 * sw, 3, 1.6, 0, TAU); k.fillStyle = PY_COL.yel; k.fill();
    k.restore();
    // 前臂：肩 → 肘 → 腕，抬起又放下；水袖挂在腕上向下飘
    const sx = x + 6, sy = y + 34, s1 = -0.15 - 0.55 * (1 - Math.cos(a)) / 2, s2 = 0.35 + 0.3 * Math.sin(a * 2);
    let hx, hy;
    pyJoint(k, sx, sy, s1, () => {
      pyPart(k, 'M 0 -3.5 L 24 -3 L 24 3 L 0 3.5 Z', PY_COL.red, [0, 4, 0, -4, 24, 4]);
      pyJoint(k, 24, 0, s2, () => {
        pyPart(k, 'M 0 -3 L 20 -2.5 L 20 2.5 L 0 3 Z', PY_COL.blue);
        k.save(); k.translate(20, 0); k.rotate(-s1 - s2 + 0.9 + 0.25 * Math.sin(a * 2 + 1));
        pyPart(k, 'M 0 -4 C 20 -6 34 0 44 10 C 38 24 30 34 24 46 C 18 30 8 14 0 4 Z', 'rgba(250,232,196,.42)', [1, 7, -2, -8, 46, 48]);
        k.restore();
      });
    });
    hx = sx + 24 * Math.cos(s1) + 20 * Math.cos(s1 + s2); hy = sy + 24 * Math.sin(s1) + 20 * Math.sin(s1 + s2);
    pyRod(k, hx, hy, 10); pyRod(k, x + 2, y + 60, -6);
  }
  function pyGeneral(k, a) {
    k.save(); k.translate(392, 190); k.scale(1.15, 1.15); k.translate(-392, -190);
    const mx = 392, bob = 2.4 * Math.abs(Math.sin(a * 3)), my = 124 - bob;
    // 四条腿：大腿绕髋、小腿绕膝，对角两两同相
    const leg = (hx, ph, front) => {
      const t = a * 3 + ph, th = 0.3 * Math.sin(t), sh = front ? -0.35 * Math.max(0, Math.sin(t + 0.8)) : 0.45 * Math.max(0, Math.sin(t - 0.6));
      pyJoint(k, mx + hx, my + 8, th, () => {
        pyPart(k, 'M -6 -4 C -7 8 -5 18 -3 24 L 4 24 C 6 16 7 6 6 -4 Z', PY_COL.blk, [0, 4, -7, -4, 7, 24]);
        pyJoint(k, 0, 23, sh, () => { pyPart(k, 'M -3 0 L 3 0 L 2.5 18 L 5 22 L -4 22 L -2.5 18 Z', PY_COL.blk); });
      });
    };
    k.save(); k.globalAlpha = 0.6; leg(24, 0, true); leg(-36, Math.PI, false); k.restore();
    leg(30, Math.PI, true); leg(-30, 0, false);
    // 尾：几缕长条，末端随步子甩
    const tw = 4 * Math.sin(a * 3);
    pyPart(k, `M ${mx + 46} ${my - 6} C ${mx + 64} ${my - 4} ${mx + 70} ${my + 14} ${mx + 66 + tw} ${my + 34} C ${mx + 58} ${my + 22} ${mx + 54} ${my + 8} ${mx + 44} ${my + 2} Z`, PY_COL.blk, [1, 4, mx + 44, my - 8, mx + 72, my + 36]);
    // 马身：一条连贯的曲线（背、臀、腹、胸）
    pyPart(k, `M ${mx - 34} ${my - 14} C ${mx - 10} ${my - 22} ${mx + 26} ${my - 22} ${mx + 46} ${my - 10} C ${mx + 54} ${my - 2} ${mx + 50} ${my + 12} ${mx + 36} ${my + 14} C ${mx + 10} ${my + 18} ${mx - 16} ${my + 18} ${mx - 32} ${my + 12} C ${mx - 42} ${my + 6} ${mx - 42} ${my - 6} ${mx - 34} ${my - 14} Z`,
      PY_COL.blk, [0, 6, mx - 44, my - 22, mx + 54, my + 18]);
    // 颈与头：颈向前上弓起，马头细长
    const nod = 0.06 * Math.sin(a * 3 + 0.5);
    k.save(); k.translate(mx - 30, my - 8); k.rotate(nod);
    pyPart(k, 'M 0 -6 C -6 -22 -14 -36 -22 -44 L -30 -46 C -38 -44 -46 -38 -50 -30 C -48 -26 -44 -26 -40 -28 C -34 -28 -28 -24 -24 -18 C -18 -8 -10 4 6 8 Z', PY_COL.blk, [0, 5, -52, -48, 8, 10]);
    k.fillStyle = PY_LIT; k.beginPath(); k.arc(-34, -38, 1.6, 0, TAU); k.fill();
    k.strokeStyle = PY_COL.red; k.lineWidth = 1.4; k.beginPath(); k.moveTo(-44, -30); k.lineTo(-30, -40); k.lineTo(-20, -20); k.stroke();   // 笼头
    // 鬃毛：一排细长的刻条
    k.fillStyle = PY_COL.blk;
    for (let i = 0; i < 7; i++) { const t = i / 6; k.beginPath(); k.moveTo(-22 + t * 18, -44 + t * 34); k.lineTo(-14 + t * 20 + 2 * Math.sin(a * 3 + i), -46 + t * 32); k.lineTo(-18 + t * 18, -40 + t * 34); k.fill(); }
    k.restore();
    // 鞍鞯：红底，刻菱格，下沿一排流苏
    pyPart(k, `M ${mx - 18} ${my - 20} C ${mx - 6} ${my - 24} ${mx + 16} ${my - 24} ${mx + 26} ${my - 18} L ${mx + 22} ${my + 4} C ${mx + 6} ${my + 8} ${mx - 10} ${my + 8} ${mx - 20} ${my + 4} Z`, PY_COL.red, [2, 6, mx - 22, my - 26, mx + 28, my + 10]);
    k.strokeStyle = PY_COL.yel; k.lineWidth = 1.2;
    for (let i = 0; i < 9; i++) { const fx = mx - 18 + i * 5; k.beginPath(); k.moveTo(fx, my + 5); k.lineTo(fx + 0.6 * Math.sin(a * 3), my + 12); k.stroke(); }
    // 武将：靠旗、铠甲（鱼鳞刻纹）、护腰、腿、侧脸与盔
    const rx = mx, ry = my - 20;
    const flag = (dx, rot) => pyPart(k, `M ${rx + 4} ${ry - 40} L ${rx + 4 + 30 * Math.cos(rot)} ${ry - 40 + 30 * Math.sin(rot)} L ${rx + 4 + 28 * Math.cos(rot + 0.32)} ${ry - 40 + 28 * Math.sin(rot + 0.32)} Z`, dx ? PY_COL.green : PY_COL.red, [1, 5, rx - 40, ry - 80, rx + 40, ry - 20]);
    flag(0, -0.75 + 0.04 * Math.sin(a * 3)); flag(1, -0.35 + 0.04 * Math.sin(a * 3 + 1));
    pyPart(k, `M ${rx - 4} ${ry} L ${rx + 10} ${ry} L ${rx + 6} ${ry + 26} L ${rx - 2} ${ry + 30} Z`, PY_COL.blue, [1, 4, rx - 6, ry, rx + 12, ry + 32]);   // 腿（搭在马侧）
    pyPart(k, `M ${rx - 10} ${ry - 42} C ${rx - 14} ${ry - 28} ${rx - 12} ${ry - 12} ${rx - 10} ${ry + 2} L ${rx + 14} ${ry + 2} C ${rx + 14} ${ry - 14} ${rx + 12} ${ry - 30} ${rx + 8} ${ry - 42} Z`, PY_COL.green, [1, 5, rx - 16, ry - 44, rx + 16, ry + 4]);
    pyPart(k, `M ${rx - 12} ${ry - 10} L ${rx + 14} ${ry - 10} L ${rx + 16} ${ry - 2} L ${rx - 13} ${ry - 2} Z`, PY_COL.yel, [2, 4, rx - 14, ry - 12, rx + 18, ry]);
    pyPart(k, `M ${rx - 12} ${ry - 44} C ${rx - 6} ${ry - 48} ${rx + 6} ${ry - 48} ${rx + 12} ${ry - 44} L ${rx + 10} ${ry - 36} C ${rx + 2} ${ry - 34} ${rx - 6} ${ry - 34} ${rx - 12} ${ry - 36} Z`, PY_COL.red, [0, 4, rx - 14, ry - 50, rx + 14, ry - 32]);  // 护肩
    // 侧脸朝左：额、鼻、唇、下巴，三缕长须
    pyPart(k, `M ${rx + 2} ${ry - 66} C ${rx - 4} ${ry - 66} ${rx - 8} ${ry - 62} ${rx - 9} ${ry - 58} L ${rx - 11} ${ry - 55} L ${rx - 9} ${ry - 54} C ${rx - 10} ${ry - 51} ${rx - 8} ${ry - 49} ${rx - 6} ${ry - 48} L ${rx + 4} ${ry - 46} Z`, 'rgba(255,238,206,.5)');
    k.strokeStyle = PY_INK; k.lineWidth = 0.9; k.beginPath(); k.moveTo(rx - 2, ry - 61); k.quadraticCurveTo(rx - 5, ry - 62.5, rx - 7, ry - 61); k.stroke();
    k.lineWidth = 0.8; for (let i = 0; i < 3; i++) { k.beginPath(); k.moveTo(rx - 6 + i * 2, ry - 49); k.quadraticCurveTo(rx - 8 + i * 2 + 1.5 * Math.sin(a * 3), ry - 40, rx - 6 + i * 2, ry - 32); k.stroke(); }
    pyPart(k, `M ${rx - 10} ${ry - 64} C ${rx - 8} ${ry - 76} ${rx + 8} ${ry - 78} ${rx + 10} ${ry - 64} L ${rx + 6} ${ry - 46} L ${rx + 2} ${ry - 64} Z`, PY_COL.blk, [0, 3.5, rx - 12, ry - 80, rx + 12, ry - 44]);
    k.strokeStyle = PY_COL.red; k.lineWidth = 2.4; k.beginPath(); k.moveTo(rx, ry - 76); k.quadraticCurveTo(rx + 12 + 3 * Math.sin(a * 3), ry - 92, rx + 24, ry - 84); k.stroke();   // 盔缨
    // 持枪的手臂：肩 → 肘两节，枪随肘摆动
    const s1 = Math.PI - 0.7, s2 = -0.45 + 0.2 * Math.sin(a * 2);
    pyJoint(k, rx - 6, ry - 38, s1, () => {
      pyPart(k, 'M 0 -3.5 L 18 -3 L 18 3 L 0 3.5 Z', PY_COL.green);
      pyJoint(k, 18, 0, s2, () => pyPart(k, 'M 0 -3 L 16 -2.5 L 16 2.5 L 0 3 Z', PY_COL.yel));
    });
    const ex = rx - 6 + 18 * Math.cos(s1), ey = ry - 38 + 18 * Math.sin(s1), hx = ex + 16 * Math.cos(s1 + s2), hy = ey + 16 * Math.sin(s1 + s2);
    const sa = -1.35 + 0.15 * Math.sin(a * 2);
    k.strokeStyle = PY_INK; k.lineWidth = 2; k.beginPath(); k.moveTo(hx - 50 * Math.cos(sa), hy - 50 * Math.sin(sa)); k.lineTo(hx + 52 * Math.cos(sa), hy + 52 * Math.sin(sa)); k.stroke();
    const tx = hx + 52 * Math.cos(sa), ty = hy + 52 * Math.sin(sa);
    k.fillStyle = '#d9dde2'; k.beginPath(); k.moveTo(tx + 10 * Math.cos(sa), ty + 10 * Math.sin(sa)); k.lineTo(tx + 3 * Math.cos(sa + 1.6), ty + 3 * Math.sin(sa + 1.6)); k.lineTo(tx + 3 * Math.cos(sa - 1.6), ty + 3 * Math.sin(sa - 1.6)); k.fill();
    k.fillStyle = PY_COL.red; k.beginPath(); k.arc(tx - 1, ty + 1, 3, 0, TAU); k.fill();
    pyRod(k, hx, hy, -6); pyRod(k, mx + 4, my + 6, 6);
    k.restore();
  }
  CELLS[51] = (k, w, h, u) => {
    const a = TAU * u / CYC;
    const fl = 1 + 0.035 * Math.sin(a * 7) + 0.02 * Math.sin(a * 13);   // 灯光闪烁
    const g = k.createRadialGradient(286, 92, 20, 286, 110, 330);
    g.addColorStop(0, `rgb(255,${Math.round(Math.min(255, 216 * fl))},${Math.round(144 * fl)})`);
    g.addColorStop(0.6, '#c98a3e'); g.addColorStop(1, '#4a2610');
    k.fillStyle = g; k.fillRect(0, 0, CW, CH);
    // 左侧亭子剪影：飞檐、两根柱、栏杆格子，稍虚（离幕较远）
    k.save(); k.filter = 'blur(0.8px)'; k.fillStyle = 'rgba(60,24,10,.5)';
    k.beginPath(); k.moveTo(0, 34); k.quadraticCurveTo(56, 44, 96, 20); k.lineTo(90, 40); k.quadraticCurveTo(50, 52, 0, 50); k.closePath(); k.fill();
    k.fillRect(10, 50, 5, 140); k.fillRect(76, 46, 5, 144);
    k.beginPath(); for (let x = 15; x < 76; x += 8) k.rect(x, 140, 1.6, 28); k.rect(15, 138, 61, 2.5); k.rect(15, 166, 61, 2.5);
    for (let x = 18; x < 74; x += 14) { k.moveTo(x + 5, 58); k.arc(x, 58, 5, 0, TAU); } k.fill();
    k.restore();
    pyLady(k, a);
    pyGeneral(k, a);
    // 幕布下沿的木框与纹理
    k.fillStyle = 'rgba(40,18,8,.85)'; k.fillRect(0, CH - 6, CW, 6);
    grain(k, 0.07);
  };

  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});
