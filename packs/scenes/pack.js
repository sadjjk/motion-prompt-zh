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

  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});
