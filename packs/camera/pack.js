/* Motion Prompt · pack "camera" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt */
MotionPrompt.pack('camera', function () {
  // @kit
  // カメラワーク＆切り替え 36（カード 539x208）。各コマは時間 u の純関数。
  // 25〜32 は景别（取景框で示す）、33〜36 は镜头衔接（固定机位の切り替え）。
  // 1つの動きは CYC=4.7秒。切り替え（19〜21）は A→B の次に B→A と戻るので、パックの周期は CYC×2=9.4秒。
  const CW = 539, CH = 208, FPS = 30;
  const HOLD = 9.4, CYC = HOLD / 2;
  const C = {
    bg: '#F4F3F0', card: '#FFFFFF', border: '#E3E1DC', ink: '#1E1E21', sub: '#8E8E93', faint: '#C9C9CC',
    blue: '#2F6BEB', blueM: '#9DB8F6', blueL: '#C9D8FB', blueXL: '#E4ECFE', blueBg: '#F1F5FF',
    grid: '#ECECEC', g1: '#F1F0EE', g2: '#E2E1DE', g3: '#CFCECB', g4: '#A9A8A5'
  };
  const JP = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Hiragino Sans", sans-serif';   // 画面文字为简体中文：中文字体优先，日文字体作后备
  const EN = '"Helvetica Neue", "SF Pro Display", system-ui, sans-serif';
  const MONO = '"SF Mono", ui-monospace, Menlo, monospace';

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const eIOs = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const eOut = x => 1 - Math.pow(1 - x, 3);
  const mod = (a, n) => ((a % n) + n) % n;
  function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function txt(ctx, s, x, y, font, col, align = 'left', base = 'alphabetic', ls = '0px') {
    ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = base; ctx.letterSpacing = ls; ctx.fillText(s, x, y); ctx.letterSpacing = '0px';
  }
  function tw(ctx, s, font, ls = '0px') { ctx.font = font; ctx.letterSpacing = ls; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w; }

  // ============================== 3D SCENE ==============================
  // 世界座標: Y上・カメラは +Z を向く（yaw=0）。単位はメートル。焦点距離 f はピクセル。
  const F0 = 330;  // = 24mm 表示
  const mm = f => Math.round(f / F0 * 24) + 'mm';
  function cam(o) { return Object.assign({ x: 0, y: 1.5, z: 0, yaw: 0, pitch: 0, roll: 0, f: F0 }, o); }
  function proj(c, X, Y, Z) {
    const dx = X - c.x, dy = Y - c.y, dz = Z - c.z;
    const cy = Math.cos(c.yaw), sy = Math.sin(c.yaw);
    const x1 = dx * cy - dz * sy, z1 = dx * sy + dz * cy;
    const cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
    const y2 = dy * cp - z1 * sp, z2 = dy * sp + z1 * cp;
    return { x: c.f * x1 / z2, y: -c.f * y2 / z2, z: z2, s: c.f / z2, cx: x1, cy: y2 };
  }
  function camZ(c, X, Y, Z) { return proj(c, X, Y, Z).z; }
  const NEAR = 0.25;
  function seg(ctx, c, a, b) {   // 3D line with near clipping
    let za = camZ(c, ...a), zb = camZ(c, ...b);
    if (za < NEAR && zb < NEAR) return;
    if (za < NEAR) { const t = (NEAR - za) / (zb - za); a = a.map((v, i) => lerp(v, b[i], t)); }
    else if (zb < NEAR) { const t = (NEAR - zb) / (za - zb); b = b.map((v, i) => lerp(v, a[i], t)); }
    const p = proj(c, ...a), q = proj(c, ...b);
    ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
  }
  function poly(ctx, c, pts) { ctx.beginPath(); pts.forEach((p, i) => { const q = proj(c, ...p); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }); ctx.closePath(); }

  // sprite = local drawing (meters, y up) anchored at a world point, always facing camera (billboard)
  function sprite(ctx, c, X, Y, Z, fn) {
    const p = proj(c, X, Y, Z); if (p.z < NEAR) return;
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.s, -p.s); fn(ctx, p.s); ctx.restore();
  }
  function person(ctx, s, o = {}) {
    const col = o.col || C.blue, walk = o.walk || 0, face = o.face;
    ctx.fillStyle = col;
    const sw = Math.sin(walk) * 0.42;
    // legs
    [[-0.08, sw], [0.08, -sw]].forEach(([x, a]) => { ctx.save(); ctx.translate(x, 0.86); ctx.rotate(a); rr(ctx, -0.075, -0.86, 0.15, 0.88, 0.07); ctx.fill(); ctx.restore(); });
    // arms
    [[-0.25, -sw], [0.25, sw]].forEach(([x, a]) => { ctx.save(); ctx.translate(x, 1.38); ctx.rotate(a * (o.armUp ? 0 : 1) + (o.armUp ? (x < 0 ? -2.6 : 2.6) : 0)); rr(ctx, -0.06, -0.58, 0.12, 0.6, 0.06); ctx.fill(); ctx.restore(); });
    rr(ctx, -0.23, 0.82, 0.46, 0.64, 0.12); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 1.63, 0.16, 0, 7); ctx.fill();
    if (face !== undefined && Math.cos(face) > 0) {   // 顔の向き（オービット用）
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(Math.sin(face) * -0.09, 1.65, 0.035, 0, 7); ctx.fill();
    }
  }
  function tree(ctx, s, h = 4, col = C.g2) {
    ctx.fillStyle = C.g3; ctx.fillRect(-0.09 * h / 4, 0, 0.18 * h / 4, h * 0.55);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, h * 0.68, h * 0.3, 0, 7); ctx.fill();
  }
  function building(ctx, s, w, h, col = C.g1) {
    ctx.fillStyle = col; ctx.fillRect(-w / 2, 0, w, h);
    ctx.strokeStyle = C.g3; ctx.lineWidth = 1.4 / s; ctx.strokeRect(-w / 2, 0, w, h);
    ctx.fillStyle = C.g2;
    for (let y = h - 1.6; y > 1; y -= 1.8) for (let x = -w / 2 + 0.6; x < w / 2 - 0.7; x += 1.3) ctx.fillRect(x, y, 0.6, 0.8);
  }
  function post(ctx, s, h = 1.2) { ctx.fillStyle = C.g4; ctx.fillRect(-0.07, 0, 0.14, h); ctx.fillRect(-0.12, h - 0.06, 0.24, 0.1); }

  // scene presets
  const MTN_FAR = [[-420, 0], [-300, 22], [-230, 8], [-150, 30], [-80, 12], [-20, 34], [50, 14], [120, 28], [190, 6], [260, 26], [340, 10], [420, 0]];
  const MTN_NEAR = [[-260, 0], [-190, 12], [-140, 4], [-70, 18], [-20, 6], [30, 15], [95, 3], [160, 16], [230, 5], [300, 0]];
  const BLD = [[-17, 4, 9], [-12, 3.2, 13], [-8, 2.6, 7], [11, 3.4, 11], [15.5, 4, 8], [20, 3, 15], [-24, 3.5, 10], [26, 4, 7]];
  const CITY = [[-9, 3.4, 12], [-5.5, 3, 18], [-2, 3.6, 9], [1.8, 3, 22], [5.4, 3.6, 14], [9, 3, 10], [-13, 3.4, 15], [12.8, 3.6, 19]];

  // ぼかしは描画ごとに ctx.filter をかけると 1 回ごとに全面 blur が走って重い（1 格 60ms 前後）。
  // 同じぼかし量で続く描画は LAYER にまとめて描き、量が変わる時と最後に 1 回だけ blur して重ねる。
  const LAYERS = new Map();   // canvas の大きさごとに 1 枚（TMP と本番 canvas を交互に使っても作り直さない）
  function layerFor(cv) {
    const key = cv.width + 'x' + cv.height;
    let L = LAYERS.get(key);
    if (!L) { const lc = mkCanvas(cv.width, cv.height); L = { lc, lk: lc.getContext('2d') }; LAYERS.set(key, L); }
    return L;
  }
  function world(ctx, w, h, c, o = {}) {
    ctx.save();
    ctx.translate(w / 2, h / 2); ctx.rotate(c.roll || 0);
    const blurBg = o.blurBg || 0, blurFg = o.blurFg || 0;
    const { lc, lk } = layerFor(ctx.canvas);
    let cur = 0, d = ctx;   // d = 今の描画先（ぼかし中は lk）
    const flush = () => {
      if (d !== lk) return;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = `blur(${cur}px)`; ctx.drawImage(lc, 0, 0); ctx.restore();
    };
    const setBlur = b => {
      b = b > 0.05 ? +b.toFixed(2) : 0;
      if (b === cur) return;
      flush(); cur = b;
      if (!b) { d = ctx; return; }
      lk.setTransform(1, 0, 0, 1, 0, 0); lk.clearRect(0, 0, lc.width, lc.height);
      lk.setTransform(ctx.getTransform()); lk.globalAlpha = 1; lk.filter = 'none'; lk.globalCompositeOperation = 'source-over';
      d = lk;
    };
    // sky tint
    if (o.sky) { ctx.fillStyle = o.sky; ctx.fillRect(-w * 2, -h * 3, w * 4, h * 6); }
    setBlur(blurBg);
    // sun / moon
    const sun = o.sun === undefined ? [30, 30, 170] : o.sun;
    if (sun) { const p = proj(c, ...sun); if (p.z > NEAR) { d.fillStyle = o.sunCol || C.blueL; d.beginPath(); d.arc(p.x, p.y, Math.max(0, 5.5 * p.s * (o.sunScale || 1)), 0, 7); d.fill(); } }
    if (o.clouds) o.clouds.forEach(([X, Y, Z, r]) => { const p = proj(c, X, Y, Z); if (p.z < NEAR) return; d.fillStyle = C.g1; d.beginPath(); d.ellipse(p.x, p.y, r * 2.2 * p.s, r * p.s, 0, 0, 7); d.ellipse(p.x + r * 1.2 * p.s, p.y + r * .2 * p.s, r * 1.4 * p.s, r * .8 * p.s, 0, 0, 7); d.fill(); });
    // mountains (far planes)
    if (o.mountains !== false) {
      const off = o.mtnZ || 0;
      d.fillStyle = C.blueXL; poly(d, c, [...MTN_FAR.map(([x, y]) => [x, y, 175 + off])]); d.fill();
      d.fillStyle = C.blueL; poly(d, c, [...MTN_NEAR.map(([x, y]) => [x, y, 120 + off])]); d.fill();
    }
    // ground + grid
    if (o.grid !== false) {
      setBlur(blurBg * 0.6);
      d.save();
      d.strokeStyle = C.grid; d.lineWidth = 1.3; d.beginPath();
      const z0 = Math.floor(c.z / 2) * 2, xs = o.gridX || 40;
      for (let z = z0 + 2; z <= z0 + 90; z += (z - z0 < 30 ? 2 : 6)) seg(d, c, [-xs + c.x, 0, z], [xs + c.x, 0, z]);
      for (let x = Math.floor(c.x / 2) * 2 - xs; x <= c.x + xs; x += 2) seg(d, c, [x, 0, z0 + 0.5], [x, 0, z0 + 90]);
      d.stroke();
      // horizon
      d.strokeStyle = C.g2; d.lineWidth = 1.5; d.beginPath(); seg(d, c, [c.x - 400, 0, c.z + 300], [c.x + 400, 0, c.z + 300]); d.stroke();
      d.restore();
    }
    // sprites sorted by depth
    const list = [];
    const add = (X, Y, Z, fn, fg) => list.push({ z: camZ(c, X, Y, Z), X, Y, Z, fn, fg });
    if (o.buildings !== false) (o.city ? CITY.map(([x, bw, bh]) => [x, bw, bh, 30]) : BLD.map(([x, bw, bh]) => [x, bw, bh, 48])).forEach(([x, bw, bh, z]) => add(x, 0, z, (k, s) => building(k, s, bw, bh)));
    if (o.trees !== false) [[-7, 22], [6.5, 19], [9.5, 24], [-11, 26], [3, 30]].forEach(([x, z]) => add(x, 0, z, (k, s) => tree(k, s, 4)));
    if (o.tower) add(o.tower[0], 0, o.tower[1], (k, s) => { building(k, s, 6, 9.5, C.g1); k.fillStyle = C.g4; k.fillRect(-0.08, 9.5, 0.16, 2.2); k.fillStyle = C.blue; k.beginPath(); k.arc(0, 11.8, 0.3, 0, 7); k.fill(); });
    if (o.ring) for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; add(o.ring[0] + Math.sin(a) * o.ring[2], 0, o.ring[1] + Math.cos(a) * o.ring[2], (k, s) => tree(k, s, 3.2, i % 3 ? C.g2 : C.blueXL)); }
    if (o.extra) o.extra.forEach(e => add(e[0], e[1], e[2], e[3], e[4]));
    if (o.person) { const pp = o.person; add(pp.x || 0, pp.y || 0, pp.z === undefined ? 8 : pp.z, (k, s) => person(k, s, pp), pp.fg); }
    if (o.fg) o.fg.forEach(([X, Z, kind]) => add(X, 0, Z, (k, s) => kind === 'rock' ? (k.fillStyle = C.g3, k.beginPath(), k.ellipse(0, 0.1, 0.55, 0.38, 0, 0, 7), k.fill()) : post(k, s), true));
    list.sort((a, b) => b.z - a.z);
    for (const it of list) { setBlur(it.fg ? blurFg : blurBg); sprite(d, c, it.X, it.Y, it.Z, it.fn); }
    setBlur(0);
    if (o.after) o.after(ctx, c);
    ctx.restore();
  }

  // ============================== VIEWFINDER CARD ==============================
  const CARD = mkCanvas(CW, CH), CK = CARD.getContext('2d');
  const TMP = mkCanvas(CW, CH), TK = TMP.getContext('2d');
  const TMP2 = mkCanvas(CW, CH), TK2 = TMP2.getContext('2d');
  function clear(k, w = CW, h = CH) { k.setTransform(1, 0, 0, 1, 0, 0); k.globalAlpha = 1; k.filter = 'none'; k.fillStyle = '#FFFFFF'; k.fillRect(0, 0, w, h); }
  // draw fnA then blend fnB on top with alpha a (into k)
  function blend(k, fnA, fnB, a) {
    if (a <= 0.001) return fnA(k);
    if (a >= 0.999) return fnB(k);
    fnA(k);
    clear(TK2); fnB(TK2); k.save(); k.globalAlpha = a; k.drawImage(TMP2, 0, 0); k.restore();
  }
  // motion blur: average n renders of fn(k, s) with s spread over [s0, s1]
  function mblur(k, fn, s0, s1, n) {
    if (Math.abs(s1 - s0) < 1e-4 || n < 2) return fn(k, s0);
    const acc = mkCanvasCached(), ak = acc.getContext('2d');
    for (let i = 0; i < n; i++) {
      clear(TK); fn(TK, lerp(s0, s1, (i + .5) / n));
      ak.globalAlpha = 1 / (i + 1); ak.drawImage(TMP, 0, 0);
    }
    ak.globalAlpha = 1; k.save(); k.drawImage(acc, 0, 0); k.restore();
  }
  let _acc; function mkCanvasCached() { if (!_acc) _acc = mkCanvas(CW, CH); const k = _acc.getContext('2d'); k.globalAlpha = 1; k.fillStyle = '#fff'; k.fillRect(0, 0, CW, CH); return _acc; }

  function viewfinder(k, w, h, t, hud, hudCol) {
    k.save();
    const m = 13, L = 20;
    k.strokeStyle = '#8F8F94'; k.lineWidth = 2.6; k.lineCap = 'round';
    k.beginPath();
    [[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]].forEach(([x, y, sx, sy]) => { k.moveTo(x, y + sy * L); k.lineTo(x, y); k.lineTo(x + sx * L, y); });
    k.stroke();
    // center mark
    k.strokeStyle = 'rgba(143,143,148,.55)'; k.lineWidth = 1.6; k.beginPath(); k.moveTo(w / 2 - 7, h / 2); k.lineTo(w / 2 + 7, h / 2); k.moveTo(w / 2, h / 2 - 7); k.lineTo(w / 2, h / 2 + 7); k.stroke();
    // REC (なめらかな明滅・9.4秒で9回＝ループの継ぎ目なし)
    const a = 0.55 + 0.45 * Math.cos(t * Math.PI * 2 * 9 / HOLD);
    k.fillStyle = C.blue; k.globalAlpha = a; k.beginPath(); k.arc(m + 16, m + 17, 5, 0, 7); k.fill(); k.globalAlpha = 1;
    txt(k, 'REC', m + 27, m + 17, `600 14px ${MONO}`, '#7D7D82', 'left', 'middle');
    if (hud) {
      const f = `600 15px ${MONO}`, ww = tw(k, hud, f);
      k.fillStyle = 'rgba(255,255,255,.82)'; rr(k, w - m - 14 - ww - 10, m + 6, ww + 20, 23, 6); k.fill();
      txt(k, hud, w - m - 14, m + 18, f, hudCol || '#6E6E73', 'right', 'middle');
    }
    k.restore();
  }

  // ============================== CELLS ==============================
  // each: (k, w, h, u) where u = time within the cycle (0..CYC), cyc = cycle index; returns HUD string
  const RESET = 0.5;  // 末尾のクロスフェードで開始状態へ戻す
  function camCell(stateAt, hudAt, t0 = 0.5, t1 = 3.4) {
    return (k, w, h, u) => {
      const p = eIO(P(u, t0, t1));
      const r = P(u, CYC - RESET, CYC);
      blend(k, kk => stateAt(kk, w, h, p, u), kk => stateAt(kk, w, h, 0, u - CYC), eIOs(r));
      return hudAt(r > 0.5 ? 0 : p, u);
    };
  }
  // 1コマぶんの枠: 白地 → 中身 → ファインダー（四隅・REC・右上の数値）。u はパック周期 0..CYC×2
  function shot(fn, vh) {
    return (k, w, h, u) => {
      const uu = mod(u, CYC), cyc = Math.floor(u / CYC);
      k.fillStyle = '#FFFFFF'; k.fillRect(0, 0, w, h);
      k.save(); const hud = fn(k, w, h, uu, cyc); k.restore();
      k.globalAlpha = 1; k.filter = 'none';
      viewfinder(k, w, vh || h, u, hud);
    };
  }
  const CELLS = [];

  // @element 01
  // 01 パン: 回転なので全ての層が同じだけ横に流れる
  CELLS[0] = shot(camCell((k, w, h, p) => world(k, w, h, cam({ yaw: lerp(-0.32, 0.32, p) }), { person: { x: 0, z: 8 } }),
    p => `${Math.round(lerp(-0.32, 0.32, p) * 57.3)}°`.replace(/^(\d)/, '+$1')));

  // @element 02
  // 02 ティルト
  CELLS[1] = shot(camCell((k, w, h, p) => world(k, w, h, cam({ pitch: lerp(-0.06, 0.36, p), y: 1.4 }), { person: { z: 7 }, tower: [0, 26], buildings: false, sun: [7, 13, 40], sunScale: 0.4 }),
    p => `${Math.round(lerp(-0.06, 0.36, p) * 57.3)}°`.replace(/^(\d)/, '+$1')));

  // @element 03
  // 03 ドリーイン: カメラ位置が前へ（手前は大きく、奥はほぼそのまま）
  CELLS[2] = shot(camCell((k, w, h, p) => world(k, w, h, cam({ z: lerp(0, 5.8, p) }), { person: { z: 8 }, fg: [[-1.5, 3.6], [1.6, 4.8, 'rock']] }),
    p => mm(F0)));

  // @element 04
  // 04 ズームイン: 位置は固定・焦点距離だけ伸びる（全体が同じ比率で拡大）
  CELLS[3] = shot(camCell((k, w, h, p) => world(k, w, h, cam({ f: F0 * Math.pow(8 / 2.2, p) }), { person: { z: 8 }, fg: [[-1.5, 3.6], [1.6, 4.8, 'rock']] }),
    p => mm(F0 * Math.pow(8 / 2.2, p))));

  // @element 05
  // 05 トラッキング: 人物と並んで横移動（手前ほど速く流れる）
  CELLS[4] = shot((k, w, h, u) => {
    const x = (u - CYC / 2) * 1.7;
    const fgp = []; for (let i = -12; i <= 12; i++) fgp.push([i * 1.6, 4]);
    world(k, w, h, cam({ x, y: 1.3 }), { person: { x, z: 7.5, walk: u * 7 }, fg: fgp });
    return '→ 1.7m/s';
  });

  // @element 06
  // 06 オービット: 被写体を中心に円を描いて回り込む
  CELLS[5] = shot(camCell((k, w, h, p) => {
    const a = lerp(-0.95, 0.95, p), R = 6, P0 = [0, 0, 9];
    const c = cam({ x: P0[0] + Math.sin(a) * R, z: P0[2] - Math.cos(a) * R, yaw: -a, y: 1.7, pitch: -0.07 });
    world(k, w, h, c, {
      person: { z: 9, face: a }, ring: [0, 9, 10], buildings: true, trees: false,
      after: (kk, cc) => { kk.strokeStyle = C.blueM; kk.lineWidth = 2; kk.setLineDash([5, 5]); kk.beginPath(); for (let i = 0; i <= 48; i++) { const b = i / 48 * Math.PI * 2; const q = proj(cc, Math.sin(b) * 1.3, 0, 9 + Math.cos(b) * 1.3); i ? kk.lineTo(q.x, q.y) : kk.moveTo(q.x, q.y); } kk.stroke(); kk.setLineDash([]); }
    });
  }, p => `${Math.round(lerp(-0.95, 0.95, p) * 57.3)}°`.replace(/^(\d)/, '+$1'), 0.5, 3.6));

  // @element 07
  // 07 クレーンアップ: カメラが上昇し、見下ろしになる
  CELLS[6] = shot(camCell((k, w, h, p) => {
    const y = lerp(1.4, 9, p), z = lerp(0, 1.5, p);
    world(k, w, h, cam({ y, z, pitch: -0.86 * Math.atan2(y - 1.0, 8 - z) }), { person: { z: 8 } });
  }, p => `↑ ${lerp(1.4, 9, p).toFixed(1)}m`));

  // @element 08
  // 08 ドリーズーム: 人物の大きさは一定、背景だけ伸び縮み
  CELLS[7] = shot(camCell((k, w, h, p) => {
    const d = lerp(3.2, 8, p), f = F0 * d / 8 * 1.0;
    const c = cam({ z: 8 - d, f, y: 1.3 });
    world(k, w, h, c, {
      person: { z: 8 }, trees: true,
      after: (kk, cc) => { const top = proj(cc, 0, 1.8, 8).y, bot = proj(cc, 0, 0, 8).y; kk.strokeStyle = C.blue; kk.lineWidth = 1.6; kk.setLineDash([6, 5]); kk.beginPath(); kk.moveTo(-80, top); kk.lineTo(80, top); kk.moveTo(-80, bot); kk.lineTo(80, bot); kk.stroke(); kk.setLineDash([]); }
    });
  }, p => mm(F0 * lerp(3.2, 8, p) / 8)));

  // @element 09
  // 09 ラックフォーカス
  CELLS[8] = shot(camCell((k, w, h, p) => {
    world(k, w, h, cam({ y: 1.1 }), {
      person: { x: 0.9, z: 9 }, blurFg: 7 * p, blurBg: 6 * (1 - p),
      extra: [[-0.75, 0, 2.0, (kk, s) => { kk.fillStyle = C.g3; kk.fillRect(-0.025, 0, 0.05, 0.75); kk.fillStyle = C.blueM; for (let i = 0; i < 6; i++) { kk.beginPath(); kk.ellipse(Math.cos(i) * 0.09, 0.8 + Math.sin(i) * 0.09, 0.08, 0.05, i, 0, 7); kk.fill(); } kk.fillStyle = C.blue; kk.beginPath(); kk.arc(0, 0.8, 0.05, 0, 7); kk.fill(); }, true]],
      after: (kk, cc) => {   // ピント位置の枠
        const a = proj(cc, -0.75, 0.8, 2.0), b = proj(cc, 0.9, 0.9, 9);
        const x = lerp(a.x, b.x, p), y = lerp(a.y, b.y, p), r = lerp(46, 30, p);
        kk.strokeStyle = C.blue; kk.lineWidth = 2; kk.beginPath();
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { kk.moveTo(x + sx * r, y + sy * r - sy * 9); kk.lineTo(x + sx * r, y + sy * r); kk.lineTo(x + sx * r - sx * 9, y + sy * r); });
        kk.stroke();
      }
    });
  }, p => `◎ ${lerp(2, 9, p).toFixed(0)}m`, 1.0, 2.6));

  // @element 10
  // 10 手持ち
  CELLS[9] = shot((k, w, h, u) => {
    const T = u * 2 * Math.PI / CYC;   // 周期をサイクルに合わせて継ぎ目なし
    const n = (a, b, c2) => Math.sin(T * a + b) * c2;
    const yaw = n(3, 0, .016) + n(7, 1, .008) + n(13, 2, .004), pitch = n(4, 2, .012) + n(9, .5, .006) + n(17, 1.2, .003), roll = n(5, 1, .02) + n(11, 3, .008);
    world(k, w, h, cam({ yaw, pitch, roll, y: 1.5 + n(6, 0, .03) }), { person: { z: 6.5 } });
    return 'HANDHELD';
  });

  // @element 11
  // 11 FPV
  CELLS[10] = shot((k, w, h, u) => {
    const sp = 14, z = u * sp, T = u * 2 * Math.PI / CYC;
    const c = cam({ z, y: 1.4 + 0.5 * Math.sin(T * 2), roll: 0.22 * Math.sin(T * 2 + 0.6), yaw: 0.05 * Math.sin(T * 2), x: 0.6 * Math.sin(T * 2 - 0.4), pitch: -0.05 });
    const ex = [];
    const L = 8, base = Math.floor(z / L) * L;
    for (let i = 0; i < 12; i++) { const zz = base + i * L; ex.push([-3.6, 0, zz, (kk, s) => tree(kk, s, 4.2)]); ex.push([3.6, 0, zz + L / 2, (kk, s) => tree(kk, s, 4.2, C.blueXL)]); }
    world(k, w, h, c, {
      buildings: false, trees: false, extra: ex, gridX: 20,
      after: (kk) => {   // スピード線
        kk.strokeStyle = 'rgba(150,150,155,.45)'; kk.lineWidth = 2;
        for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + 0.3, ph = mod(u * 2.2 + i * 0.37, 1); const r0 = 120 + ph * 160; kk.beginPath(); kk.moveTo(Math.cos(a) * r0 * 1.9, Math.sin(a) * r0 * 0.8); kk.lineTo(Math.cos(a) * (r0 + 40) * 1.9, Math.sin(a) * (r0 + 40) * 0.8); kk.stroke(); }
      }
    });
    return `${Math.round(sp * 3.6)}km/h`;
  });

  // @element 12
  // 12 ダッチアングル
  CELLS[11] = shot(camCell((k, w, h, p) => world(k, w, h, cam({ roll: lerp(0, 0.36, p) }), { person: { z: 7 } }), p => `∠ ${Math.round(lerp(0, 0.36, p) * 57.3)}°`, 0.6, 2.2));

  // @shared
  // 跳躍の高さと、舞い落ちる葉（13・14・16 で使う）
  function jumpY(q) { return q <= 0 || q >= 1 ? 0 : 4 * q * (1 - q) * 1.1; }
  function leaves(u, speed) { const ex = []; for (let i = 0; i < 9; i++) { const ph = mod(u * speed / 4.7 + i / 9, 1); ex.push([-3 + i * 0.75 + Math.sin(i * 3) * 0.3, 3.4 - ph * 3.4, 6 + (i % 3), (kk) => { kk.fillStyle = i % 2 ? C.blueM : C.g3; kk.save(); kk.rotate(ph * 6 + i); kk.beginPath(); kk.ellipse(0, 0, 0.09, 0.045, 0, 0, 7); kk.fill(); kk.restore(); }]); } return ex; }

  // @element 13
  // 13 スローモーション
  CELLS[12] = shot((k, w, h, u) => {
    const q = P(u, 0.5, 4.3);
    world(k, w, h, cam({ y: 1.3 }), { person: { z: 7, y: jumpY(q), armUp: q > 0 && q < 1 }, extra: leaves(u, 1) });
    return '120fps ×0.25';
  });

  // @element 14
  // 14 スピードランプ: 速い→遅い（グラフで速さを表示）
  function rampTime(u) {   // 再生速度 v(u): 2.4 → 0.25（u 1.2〜1.9 で切替）
    const v = x => lerp(2.4, 0.25, eIOs(P(x, 1.2, 1.9)));
    let s = 0; const N = 60; for (let i = 0; i < N; i++) { const x = u * (i + .5) / N; s += v(x) * u / N; } return { s, v: v(u) };
  }
  CELLS[13] = shot((k, w, h, u) => {
    const uu = Math.min(u, CYC - RESET);
    const draw = (kk, uu) => {
      const { s, v } = rampTime(uu);
      const x = -6 + s * 2.0, q = P(x, -1.5, 2.5);
      world(kk, w, h, cam({ y: 1.3 }), {
        person: { x, z: 8, walk: s * 9, y: jumpY(q) * 0.9, armUp: q > 0 && q < 1 },
        after: (k2) => {   // 速度グラフ
          const gx = -w / 2 + 26, gy = h / 2 - 22, gw = 120, gh = 40;
          k2.fillStyle = 'rgba(255,255,255,.85)'; rr(k2, gx - 8, gy - gh - 10, gw + 16, gh + 18, 6); k2.fill();
          k2.strokeStyle = C.faint; k2.lineWidth = 1.5; k2.beginPath(); k2.moveTo(gx, gy); k2.lineTo(gx + gw, gy); k2.stroke();
          k2.strokeStyle = C.blue; k2.lineWidth = 2.5; k2.beginPath();
          for (let i = 0; i <= 40; i++) { const xx = i / 40 * (CYC - RESET), vv = rampTime(xx).v; const X = gx + i / 40 * gw, Y = gy - vv / 2.4 * gh; i ? k2.lineTo(X, Y) : k2.moveTo(X, Y); }
          k2.stroke();
          const X = gx + uu / (CYC - RESET) * gw, Y = gy - v / 2.4 * gh; k2.fillStyle = C.blue; k2.beginPath(); k2.arc(X, Y, 5, 0, 7); k2.fill();
        }
      });
      return v;
    };
    const r = P(u, CYC - RESET, CYC); let v;
    blend(k, kk => { v = draw(kk, uu); }, kk => draw(kk, 0), eIOs(r));
    return `×${(r > .5 ? 2.4 : v).toFixed(1)}`;
  });

  // @element 15
  // 15 タイムラプス: 太陽が動き、雲と人が早送り
  CELLS[14] = shot(camCell((k, w, h, p, u) => {
    const a = lerp(-1.25, 1.25, p);
    const clouds = [[-20 + mod(p * 140 + 0, 80) - 10, 18, 90, 2.2], [-50 + mod(p * 140 + 40, 80), 24, 120, 3], [-10 + mod(p * 140 + 20, 80) - 30, 13, 70, 1.6]];
    const ex = [];
    for (let i = 0; i < 7; i++) { const ph = mod(p * 6 + i / 7, 1), dir = i % 2 ? 1 : -1; ex.push([dir * lerp(-9, 9, ph), 0, 10 + i * 1.3, (kk) => { kk.fillStyle = i % 3 ? C.g4 : C.blueM; kk.fillRect(-0.12, 0, 0.24, 0.9); kk.beginPath(); kk.arc(0, 1.05, 0.13, 0, 7); kk.fill(); }]); }
    world(k, w, h, cam({ y: 1.6, pitch: 0.08 }), {
      sun: [Math.sin(a) * 120, Math.cos(a) * 60 - 8, 170], sunCol: C.blueM, clouds, extra: ex,
      after: (kk, cc) => {   // 建物の影
        kk.fillStyle = 'rgba(160,160,165,.22)';
        BLD.slice(0, 6).forEach(([x, bw, bh]) => { const L = bh * 0.9; const q1 = proj(cc, x - bw / 2, 0, 48), q2 = proj(cc, x + bw / 2, 0, 48), q3 = proj(cc, x + bw / 2 - Math.sin(a) * L, 0, 48 - Math.cos(a) * L * 0.4 - 1), q4 = proj(cc, x - bw / 2 - Math.sin(a) * L, 0, 48 - Math.cos(a) * L * 0.4 - 1); kk.beginPath(); kk.moveTo(q1.x, q1.y); kk.lineTo(q2.x, q2.y); kk.lineTo(q3.x, q3.y); kk.lineTo(q4.x, q4.y); kk.fill(); });
      }
    });
  }, p => { const m = Math.round(lerp(6 * 60, 18 * 60, p) / 10) * 10; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; }, 0.4, 4.1));

  // @element 16
  // 16 フリーズフレーム
  CELLS[15] = shot((k, w, h, u) => {
    // 跳躍の頂点で 1.4 秒止める
    const tj = u < 1.6 ? u : u < 3.0 ? 1.6 : u - 1.4;   // 実時間→映像時間
    const q = P(tj, 0.6, 2.6);
    const frozen = u >= 1.6 && u < 3.0;
    world(k, w, h, cam({ y: 1.3 }), { person: { z: 7, y: jumpY(q), armUp: q > 0 && q < 1 }, extra: leaves(tj, 1.5) });
    if (frozen) {
      const a = Math.min(1, (u - 1.6) / 0.12, (3.0 - u) / 0.12);
      k.save(); k.globalAlpha = a; k.strokeStyle = C.blue; k.lineWidth = 5; k.strokeRect(2.5, 2.5, w - 5, h - 5);
      k.fillStyle = 'rgba(255,255,255,.88)'; rr(k, w / 2 - 34, h - 58, 68, 40, 8); k.fill();
      k.fillStyle = C.blue; k.fillRect(w / 2 - 12, h - 49, 8, 22); k.fillRect(w / 2 + 4, h - 49, 8, 22); k.restore();
    }
    return frozen ? 'FREEZE' : '';
  });

  // @shared
  // ---- 切り替え: 奇数サイクルは B→A に戻る（リセット不要）
  const sceneA = (k, w, h, extra = {}) => world(k, w, h, cam(Object.assign({ y: 1.4 }, extra.cam)), Object.assign({ person: { x: -0.6, z: 7 } }, extra));
  const CAR = [1.2, 0, 9, (kk) => { kk.fillStyle = C.blue; rr(kk, -1.9, 0.35, 3.8, 0.75, 0.25); kk.fill(); rr(kk, -1.1, 0.95, 2.1, 0.62, 0.28); kk.fill(); kk.fillStyle = '#fff'; kk.fillRect(-0.85, 1.08, 0.8, 0.36); kk.fillRect(0.12, 1.08, 0.7, 0.36); kk.fillStyle = C.ink; [-1.15, 1.15].forEach(x => { kk.beginPath(); kk.arc(x, 0.34, 0.34, 0, 7); kk.fill(); }); }];
  const SB = { city: true, mountains: false, trees: false, sun: [-26, 40, 150], extra: [CAR] };
  const sceneB = (k, w, h, extra = {}) => world(k, w, h, cam(Object.assign({ y: 1.6, pitch: 0.1 }, extra.cam)), Object.assign({}, SB, extra));
  function abCell(trans, hudFn) {
    return (k, w, h, u, cyc) => {
      const S = cyc % 2 === 0 ? [sceneA, sceneB] : [sceneB, sceneA];
      trans(k, w, h, u, S[0], S[1], cyc);
      return hudFn ? hudFn(u, cyc) : (cyc % 2 === 0 ? 'A → B' : 'B → A');
    };
  }

  // @element 17
  // 17 ジャンプカット（同じ画角で人物の位置と時刻だけ飛ぶ）
  CELLS[16] = shot((k, w, h, u) => {
    const shots = [[-2.2, 0], [1.4, 1], [-0.4, 0], [2.4, 1], [0.6, 0]];
    const times = ['10:02', '10:17', '10:41', '11:06', '11:30'];
    const i = Math.min(4, Math.floor(u / (CYC / 5)));
    const [x, arm] = shots[i];
    world(k, w, h, cam({ y: 1.4 }), { person: { x, z: 7, armUp: !!arm } });
    return times[i];
  });

  // @element 18
  // 18 マッチカット（投げたボール → 同じ位置・大きさの太陽）
  CELLS[17] = shot((k, w, h, u) => {
    const cut = 2.3;
    const BX = 120, BY = -46, BR = 17;
    if (u < cut) {
      const q = eOut(P(u, 0.5, cut));
      world(k, w, h, cam({ y: 1.4 }), {
        person: { x: -1.2, z: 7, armUp: q > 0.05 }, sun: null,
        after: (kk, cc) => { const s = proj(cc, -1.2, 2.3, 7); const x = lerp(s.x, BX, q), y = lerp(s.y, BY, q) - Math.sin(q * Math.PI) * 30, r = lerp(5, BR, q); kk.fillStyle = C.blue; kk.beginPath(); kk.arc(x, y, r, 0, 7); kk.fill(); }
      });
    } else {
      const q = P(u, cut, CYC);
      world(k, w, h, cam({ y: 1.2 }), {
        buildings: false, sun: null, trees: true,
        after: (kk) => { kk.fillStyle = C.blue; kk.beginPath(); kk.arc(BX, BY + q * 14, BR, 0, 7); kk.fill(); }
      });
    }
    // 形がそろっていることを示す点線の円
    const g = Math.max(0, 1 - Math.abs(u - cut) / 0.7);
    if (g > 0) { k.save(); k.translate(w / 2, h / 2); k.globalAlpha = g; k.strokeStyle = C.blue; k.lineWidth = 2; k.setLineDash([5, 4]); k.beginPath(); k.arc(BX, BY + (u > cut ? P(u, cut, CYC) * 14 : 0), BR + 9, 0, 7); k.stroke(); k.restore(); }
    return u < cut ? 'SHOT 1' : 'SHOT 2';
  });

  // @element 19
  // 19 ホイップパン（ブレで次の場面へ）
  CELLS[18] = shot(abCell((k, w, h, u, A, B) => {
    const t0 = 1.7, t1 = 2.5;
    const at = (kk, s) => {   // s: 0..1 の進み。前半 A を右へ振り、後半 B が左から止まる
      if (s < .5) world(kk, w, h, cam({ y: 1.4, yaw: eIOs(s * 2) * 0.45 }), A === sceneA ? { person: { x: -0.6, z: 7 } } : SB);
      else world(kk, w, h, cam({ y: 1.4, yaw: -(1 - eIOs((s - .5) * 2)) * 0.45 }), B === sceneA ? { person: { x: -0.6, z: 7 } } : SB);
    };
    if (u < t0) return A(k, w, h);
    if (u > t1) return B(k, w, h);
    const s = P(u, t0, t1), ds = 1 / FPS / (t1 - t0);
    mblur(k, at, clamp(s - ds * 1.6), clamp(s + ds * 1.6), 9);
  }));

  // @element 20
  // 20 クロスディゾルブ
  CELLS[19] = shot(abCell((k, w, h, u, A, B) => blend(k, kk => A(kk, w, h), kk => B(kk, w, h), eIOs(P(u, 1.5, 3.0)))));

  // @element 21
  // 21 ワイプ
  CELLS[20] = shot(abCell((k, w, h, u, A, B) => {
    const p = eIO(P(u, 1.7, 2.8)), ex = p * (w + 8) - 4;
    A(k, w, h);
    if (p > 0) { k.save(); k.beginPath(); k.rect(0, 0, ex, h); k.clip(); k.fillStyle = '#fff'; k.fillRect(0, 0, w, h); B(k, w, h); k.restore(); }
    if (p > 0 && p < 1) { k.fillStyle = C.blue; k.fillRect(ex - 2, 0, 4, h); }
  }));

  // @element 22
  // 22 スマッシュカット（静かな場面 → 急に激しい場面）
  function meter(k, w, h, lv) {   // 音量メーター（左下）
    const x = 24, y = h - 22, n = 8;
    for (let i = 0; i < n; i++) { k.fillStyle = (i + 0.5) / n < lv ? C.blue : C.g2; k.fillRect(x + i * 9, y - 6 - i * 2.2, 6, 6 + i * 2.2); }
  }
  CELLS[21] = shot((k, w, h, u) => {
    const cut = 2.4, r = P(u, CYC - RESET, CYC);
    const quiet = (kk, uu) => {
      world(kk, w, h, cam({ y: 1.2 }), {
        buildings: false, sun: [24, 26, 170], sunCol: C.blueXL, extra: [[0.4, 0, 7, (k2) => { k2.fillStyle = C.blue; rr(k2, -0.8, 0, 1.6, 0.34, 0.15); k2.fill(); k2.beginPath(); k2.arc(-0.95, 0.24, 0.17, 0, 7); k2.fill(); }]],
        after: (k2, cc) => { const p0 = proj(cc, -0.6, 1.0, 7); for (let i = 0; i < 3; i++) { const ph = mod(uu * 0.35 + i / 3, 1); k2.globalAlpha = Math.sin(ph * Math.PI) * 0.8; txt(k2, 'z', p0.x - 10 - ph * 20 - i * 4, p0.y - ph * 50, `600 ${16 + i * 4}px ${EN}`, C.sub, 'center', 'middle'); } k2.globalAlpha = 1; }
      });
      meter(kk, w, h, 0.08 + 0.04 * Math.sin(uu * 5));
    };
    const loud = (kk, uu) => {
      const T = uu * 40;
      const c = cam({ y: 1.25, f: F0 * 2.6, roll: -0.12 + Math.sin(T) * 0.03, yaw: Math.sin(T * 1.3) * 0.006 });
      world(kk, w, h, c, {
        buildings: false, trees: false, mountains: false, grid: true, sun: null,
        person: { x: 0, z: 7, armUp: true, walk: 0.6 },
        after: (k2) => { k2.strokeStyle = C.blue; k2.lineWidth = 3.5; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2 + 0.1; const r0 = 92 + (i % 3) * 14; k2.beginPath(); k2.moveTo(Math.cos(a) * r0 * 1.7, Math.sin(a) * r0); k2.lineTo(Math.cos(a) * 500, Math.sin(a) * 300); k2.stroke(); } }
      });
      meter(kk, w, h, 0.85 + 0.15 * Math.sin(uu * 31));
    };
    if (u < cut) quiet(k, u);
    else blend(k, kk => loud(kk, u), kk => quiet(kk, 0), eIOs(r));
    return u < cut || r > .5 ? '♪ 安静' : '♪ 大音量';
  });

  // @shared
  // 23/24 J・L カット: 上が映像、下に映像と音のタイムライン
  function splitCell(lead) {   // lead>0: 音が先（J） / lead<0: 音が後（L）
    return (k, w, h, u, cyc) => {
      const vh = 134;
      const p = clamp((u - 0.4) / 3.6);       // 再生ヘッド
      const r = P(u, CYC - RESET, CYC);
      const X0 = 70, X1 = w - 22, cutV = 0.55, cutA = cutV - lead;
      const draw = (kk, p) => {
        // 映像
        kk.save(); kk.beginPath(); kk.rect(0, 0, w, vh); kk.clip();
        (p < cutV ? sceneA : sceneB)(kk, w, vh, { cam: { pitch: p < cutV ? -0.13 : -0.06 } });
        // 今流れている音
        const aB = p >= cutA, lab = aB ? '♪ B 的声音' : '♪ A 的声音', f = `700 15px ${JP}`;
        const bw = tw(kk, lab, f) + 22;
        kk.fillStyle = aB ? C.blue : '#8E8E93'; rr(kk, w - 42 - bw, vh - 40, bw, 26, 13); kk.fill();
        txt(kk, lab, w - 42 - bw / 2, vh - 26.5, f, '#fff', 'center', 'middle');
        const sl = p < cutV ? 'A' : 'B';
        kk.fillStyle = 'rgba(255,255,255,.9)'; rr(kk, 42, vh - 40, 70, 26, 13); kk.fill();
        txt(kk, '画面' + sl, 77, vh - 26.5, `700 15px ${JP}`, C.ink, 'center', 'middle');
        kk.restore();
        kk.strokeStyle = C.border; kk.lineWidth = 1.5; kk.beginPath(); kk.moveTo(0, vh + .5); kk.lineTo(w, vh + .5); kk.stroke();
        // タイムライン
        const tracks = [['画面', vh + 14, cutV], ['声音', vh + 44, cutA]];
        const xAt = q => lerp(X0, X1, q);
        tracks.forEach(([name, y, cut]) => {
          txt(kk, name, 18, y + 11, `600 15px ${JP}`, C.sub, 'left', 'middle');
          kk.fillStyle = C.g2; rr(kk, X0, y, xAt(cut) - X0 - 2, 22, 5); kk.fill();
          kk.fillStyle = C.blueL; rr(kk, xAt(cut) + 2, y, X1 - xAt(cut) - 2, 22, 5); kk.fill();
          txt(kk, 'A', X0 + 10, y + 11.5, `700 14px ${EN}`, C.g4, 'left', 'middle');
          txt(kk, 'B', xAt(cut) + 12, y + 11.5, `700 14px ${EN}`, C.blue, 'left', 'middle');
          if (name === '音') {   // 波形
            kk.strokeStyle = 'rgba(255,255,255,.95)'; kk.lineWidth = 1.6; kk.beginPath();
            for (let x = X0 + 26; x < X1 - 6; x += 5) { if (x < X0 + 24 || (x > xAt(cut) - 4 && x < xAt(cut) + 26)) continue; const a = 3 + 5 * Math.abs(Math.sin(x * 0.37) * Math.cos(x * 0.11)); kk.moveTo(x, y + 11 - a); kk.lineTo(x, y + 11 + a); }
            kk.stroke();
          }
        });
        // ずれている区間を強調
        const a1 = xAt(Math.min(cutA, cutV)), a2 = xAt(Math.max(cutA, cutV));
        kk.fillStyle = 'rgba(47,107,235,.12)'; kk.fillRect(a1, vh + 8, a2 - a1, 64);
        kk.strokeStyle = C.blue; kk.lineWidth = 1.5; kk.setLineDash([4, 3]); kk.beginPath(); kk.moveTo(a1, vh + 8); kk.lineTo(a1, vh + 72); kk.moveTo(a2, vh + 8); kk.lineTo(a2, vh + 72); kk.stroke(); kk.setLineDash([]);
        // 再生ヘッド
        const hx = xAt(p); kk.fillStyle = C.ink; kk.fillRect(hx - 1.5, vh + 6, 3, 68); kk.beginPath(); kk.moveTo(hx - 6, vh + 4); kk.lineTo(hx + 6, vh + 4); kk.lineTo(hx, vh + 11); kk.fill();
      };
      blend(k, kk => draw(kk, p), kk => draw(kk, 0), eIOs(r));
      return null;
    };
  }

  // @element 23
  // 23 Jカット: 音が先に次の場面（B）へ切り替わり、映像が後から追う
  CELLS[22] = shot(splitCell(0.2), 134);

  // @element 24
  // 24 Lカット: 映像が先に次の場面（B）へ切り替わり、前の場面（A）の音が残る
  CELLS[23] = shot(splitCell(-0.2), 134);

  // @shared
  // 景别（25〜）：每格一开始就是目标景别（不做收框动画），画面里的动作只有在这个景别下才看得清。
  // 景别概念参考 jingyu-skill（MIT · 阿梦freedom）。演示「框住多少」，镜头全程不推不摇，避免和 03 推进、04 变焦重复。
  // 右上角固定显示景别名（frameCell）；右下角的比例尺（ruler）标出本景别截到身体的哪一段。
  // 八格动作：25 来回走 / 26 踏出一大步 / 27 跨步（膝上可见抬腿）/ 28 单臂挥手 / 29 说话（两段+停顿眨眼+字幕+「！」）
  //          30 视线+眨眼+小步后退 / 31 大特写眨眼+视线扫视 / 32 微距（对焦拉实+小虫沿伞缘走）

  // 微距前景的草叶：细长叶片从画面两侧探进来（局部米制，y 向上）
  function reed(k, s) {
    k.strokeStyle = 'rgba(128,150,110,0.92)'; k.lineCap = 'round'; k.lineWidth = 0.006;
    [[-0.38, 0.3, 0.28], [-0.55, 0.33, 0.39], [0.42, 0.28, -0.3]].forEach(([x, h, lean]) => {
      k.beginPath(); k.moveTo(x, -0.02); k.quadraticCurveTo(x + lean * 0.5, h * 0.55, x + lean, h + 0.08); k.stroke();
    });
  }
  // 蘑菇（局部米制，y 向上，原点在地面）。S 缩放全身：远景 1，微距 1.5 时总高约 0.26 m 撑满微距画面
  //   bug：小虫沿伞盖外缘的行进度 0→1（0 = 右缘）；不传则不画虫（远景太小，看不见）
  function mushroom(k, s, bug, S = 1) {
    const top = 0.115 * S, capR = 0.09 * S, capH = 0.058 * S, capY = top + 0.004 * S;
    // 茎柄：白肚，微距距离才看得见的两道细纹
    k.fillStyle = '#EFE9DB';
    k.beginPath(); k.moveTo(-0.024 * S, 0);
    k.quadraticCurveTo(-0.021 * S, top * 0.5, -0.02 * S, top + 0.004 * S);
    k.lineTo(0.02 * S, top + 0.004 * S);
    k.quadraticCurveTo(0.021 * S, top * 0.5, 0.024 * S, 0);
    k.closePath(); k.fill();
    if (S > 1.3) {
      k.strokeStyle = '#D9CFBE'; k.lineWidth = 0.0022 * S; k.lineCap = 'round';
      [0.052, 0.09].forEach(hh => { k.beginPath(); k.moveTo(-0.019 * S, hh * S); k.quadraticCurveTo(0, (hh + 0.005) * S, 0.019 * S, hh * S); k.stroke(); });
      // 菌褶：伞盖下缘的细密放射纹
      k.save();
      k.beginPath(); k.moveTo(-0.085 * S, top); k.lineTo(0.085 * S, top);
      k.quadraticCurveTo(0, top - 0.052 * S, -0.085 * S, top); k.closePath();
      k.fillStyle = '#F3EEDF'; k.fill(); k.clip();
      k.strokeStyle = 'rgba(140,120,105,0.55)'; k.lineWidth = 0.0025 * S;
      for (let j = -6; j <= 6; j++) { k.beginPath(); k.moveTo(j * 0.02 * S, top - 0.003 * S); k.lineTo(j * 0.003 * S, top - 0.024 * S); k.stroke(); }
      k.restore();
    }
    // 伞盖：白边包一圈，伞面从红棕向着日心渐浅，中间一层稍深的色环
    k.fillStyle = '#C34F40'; k.beginPath(); k.ellipse(0, capY, capR, capH, 0, Math.PI, 0, true); k.closePath(); k.fill();
    k.fillStyle = '#D97B57'; k.beginPath(); k.ellipse(0, capY, capR * 0.62, capH * 0.66, 0, Math.PI, 0, true); k.closePath(); k.fill();
    k.fillStyle = '#E7E0CE'; k.beginPath(); k.ellipse(0, capY, capR * 0.3, capH * 0.4, 0, Math.PI, 0, true); k.closePath(); k.fill();
    k.fillStyle = '#F0E9DB'; k.beginPath(); k.ellipse(0, capY, capR, capH, 0, 0, Math.PI, true); k.closePath(); k.fill();
    if (S > 1.3) {
      // 白点花纹：近景才看得见的细节
      k.fillStyle = 'rgba(255,255,255,0.88)';
      [[0.3, 4], [0.55, 7], [0.78, 10]].forEach(([f, n], ring) => {
        for (let j = 0; j < n; j++) {
          const a = Math.PI - (j + 0.5) / n * Math.PI;
          k.beginPath(); k.arc(Math.cos(a) * capR * f, capY + Math.sin(a) * capH * f * 0.82, (0.0062 - ring * 0.0013) * S, 0, TAU); k.fill();
        }
      });
      // 小虫：沿伞盖外缘来回爬；腿的摆动频率跟着行进速度，移得慢时腿也慢
      const A = bug * Math.PI;
      k.save();
      k.translate(Math.cos(A) * capR * 0.9, capY + Math.sin(A) * capH * 0.8);
      k.rotate(A - Math.PI / 2); k.scale(-1, 1);   // 头朝行进方向
      k.fillStyle = '#3A3A40';
      k.beginPath(); k.ellipse(-0.005 * S, -0.004 * S, 0.012 * S, 0.007 * S, 0.2, 0, TAU); k.fill();
      k.beginPath(); k.arc(0.009 * S, -0.003 * S, 0.0045 * S, 0, TAU); k.fill();
      k.strokeStyle = '#3A3A40'; k.lineWidth = 0.0016 * S; k.lineCap = 'round';
      for (let j = 0; j < 3; j++) {
        const w2 = Math.sin(bug * 30 + j * 2.1);
        k.beginPath(); k.moveTo(-0.006 * S + j * 0.005 * S, -0.007 * S);
        k.lineTo(-0.006 * S + j * 0.005 * S + 0.0035 * S * w2, 0.002 * S); k.stroke();
      }
      k.beginPath(); k.moveTo(0.012 * S, -0.006 * S); k.lineTo(0.019 * S, -0.012 * S);
      k.moveTo(0.012 * S, -0.004 * S); k.lineTo(0.021 * S, -0.008 * S); k.stroke();
      k.restore();
    }
  }
  // ---- 景别共用：每格一开始就是目标景别；各格场景、动作都不同，并排看也能分清 ----
  const TAU = Math.PI * 2;
  // wave(u, n)：以 CYC 为周期、一轮 n 次的正弦；n 取整数，u = CYC → 0 处无缝
  const wave = (u, n, ph = 0) => Math.sin(u / CYC * TAU * n + ph);
  // fit(lo, hi, d, o)：机位正对框中心、离框所在深度 d 米，焦距按「lo〜hi 正好占满卡片高」换算
  //   o: { z 框所在深度（缺省 8 = 人物站位）, cx 框中心的世界 x }
  const fit = (lo, hi, d, o = {}) => {
    const z = o.z === undefined ? 8 : o.z;
    return cam({ x: o.cx || 0, y: (lo + hi) / 2, z: z - d, f: CH * d / (hi - lo) });
  };
  // 脸部细节（单独一个 sprite，叠在 person 的头上；局部米制，头心 1.63 m）
  //   o: { gaze 视线左右偏移（米）, blink 0 睁眼〜1 闭眼, talk 张嘴程度 0〜1 }
  function face(k, s, o = {}) {
    const g = o.gaze || 0, open = 1 - (o.blink || 0);
    k.fillStyle = '#FFFFFF';
    [-0.055, 0.055].forEach(x => { k.beginPath(); k.ellipse(x + g, 1.665, 0.022, Math.max(0.003, 0.026 * open), 0, 0, TAU); k.fill(); });
    k.beginPath(); k.ellipse(g * 0.6, 1.56, 0.045, 0.006 + 0.022 * (o.talk || 0), 0, 0, TAU); k.fill();
  }
  // 比例尺：右下角的小人形，蓝色带标出本景别截到身体的哪一段（lo〜hi，米）；超出 0〜2 m 的部分被面板裁掉
  function ruler(k, w, h, lo, hi) {
    const pw = 46, ph = 84, x0 = w - 13 - 14 - pw, y0 = h - 13 - 10 - ph;   // 避开取景器右下角的角标
    const s = (ph - 12) / 2.0, foot = y0 + ph - 6;
    k.save();
    k.fillStyle = 'rgba(255,255,255,.9)'; rr(k, x0, y0, pw, ph, 7); k.fill();
    k.strokeStyle = C.border; k.lineWidth = 1.2; k.stroke();
    rr(k, x0, y0, pw, ph, 7); k.clip();
    k.save(); k.translate(x0 + pw / 2, foot); k.scale(s, -s); person(k, s, { col: C.g3 }); k.restore();
    const yt = foot - hi * s, yb = foot - lo * s;
    k.fillStyle = 'rgba(47,107,235,.22)'; k.fillRect(x0, yt, pw, yb - yt);
    k.strokeStyle = C.blue; k.lineWidth = 1.6; k.beginPath(); k.moveTo(x0, yt); k.lineTo(x0 + pw, yt); k.moveTo(x0, yb); k.lineTo(x0 + pw, yb); k.stroke();
    k.restore();
  }
  // frameCell(o)：o.draw(k, w, h, u) 画主画面；o.lo / o.hi 给比例尺；HUD 固定显示景别名
  const frameCell = o => (k, w, h, u) => { o.draw(k, w, h, u); ruler(k, w, h, o.lo, o.hi); return `${o.name} ${o.abbr}`; };

  // @element 25
  // 25 大远景：机位远、略高，人物只有约 20 px，在山野间来回走；看的是人物和环境的关系
  CELLS[24] = shot(frameCell({ lo: -1, hi: 12, name: '大远景', abbr: 'ELS', draw: (k, w, h, u) => {
    const x = -6 * Math.cos(u / CYC * TAU);   // 一轮走过去再走回来，首尾同一位置
    world(k, w, h, cam({ y: 2.2, z: -22 }), {
      person: { x, z: 8, walk: u / CYC * TAU * 8 },
      clouds: [[-22 + 2 * wave(u, 1), 14, 80, 2.5], [24 + 2 * wave(u, 1, 1), 17, 95, 3]]
    });
  } }));

  // 26〜28：动作选这个景别才看得清的东西——
  //   26 全景：完整看到一个人走一步（踏出一大步 + 手臂摆动），脚步出框也没关系
  //   27 中全景：膝盖以上。画的不是走路，是「跨一步」：腿抬起落下的整段弧线
  //   28 中景：腰以上。画的不是腿部动作，是「抬手招手」：手臂从垂下到举过头顶来回摆
  // @element 26
  CELLS[25] = shot(frameCell({ lo: -0.12, hi: 2.0, name: '全景', abbr: 'FS', draw: (k, w, h, u) => {
    const step = eIO(P(u, 0.4, 1.0)) * (1 - P(u, 3.4, 4.0));   // 踏出一大步再收回来，首尾并脚
    world(k, w, h, fit(-0.12, 2.0, 5.2), {
      person: { x: step * 0.42, walk: step * Math.PI * 0.9, z: 8 }   // 大步幅 + 手臂摆动
    });
  } }));

  // @element 27
  CELLS[26] = shot(frameCell({ lo: 0.42, hi: 1.92, name: '中全景', abbr: 'MLS', draw: (k, w, h, u) => {
    const step = eIO(P(u, 0.4, 1.0)) * (1 - P(u, 3.4, 4.0));   // 跨步弧线：抬腿 → 落脚 → 收回
    world(k, w, h, fit(0.42, 1.92, 4.2), {
      person: { x: step * 0.28, walk: step * Math.PI * 0.8, z: 8, fg: true }, blurBg: 1.4
    });
  } }));

  // @element 28
  CELLS[27] = shot(frameCell({ lo: 0.88, hi: 1.92, name: '中景', abbr: 'MS', draw: (k, w, h, u) => {
    const arm = eIO(P(u, 0.4, 1.0)) * (1 - P(u, 3.4, 4.0));   // 招手：手臂举到头侧来回摆
    const ang = arm * (0.55 + 0.5 * Math.sin(u / CYC * TAU * 4));   // 举手期间摆 4 次，首尾收住
    world(k, w, h, fit(0.88, 1.92, 4.2), {
      person: { x: -0.1, z: 8, fg: true }, blurBg: 1.4,   // 本体双手自然下垂
      extra: [[-0.1, 0, 7.99, (kk, s) => {   // 挥动的那只手臂（本体 walk=0 不会画摆臂）
        kk.save(); kk.translate(0.25, 1.38); kk.rotate(-1.9 - ang * 0.4);
        kk.fillStyle = C.blue; rr(kk, -0.06, -0.6, 0.12, 0.6, 0.06); kk.fill(); kk.restore();
      }, true]]
    });
  } }));

  // @element 29
  // 29 中近景：胸部以上，下沿 1.2 m 落在胸口。画的不是大动作，是「正在说话」：
  // 身体轻晃、嘴跟着说话包络开合（说两段、停一拍眨一次眼），字幕跟着说话出现，最后头顶冒「！」
  CELLS[28] = shot(frameCell({ lo: 1.2, hi: 1.9, name: '中近景', abbr: 'MCU', draw: (k, w, h, u) => {
    const X = -0.35;   // 人物略偏左，右侧留给字幕和气泡
    // 说话包络：两段（0.4–2.0、2.9–4.4），段间停一拍；首尾安静，正好接 RESET 的淡出
    const sp = P(u, 0.4, 0.7) * (1 - P(u, 1.7, 2.0)) + P(u, 2.9, 3.2) * (1 - P(u, 4.0, 4.3));
    // 口型：小开合为主 + 每段中后段一次大张口收尾；停顿时合拢
    const talk = sp > 0.01 ? sp * (0.30 + 0.32 * Math.max(0, wave(u, 9))) + sp * 0.36 * P(wave(u, 3, -0.9), 0, 0.9) : 0;
    const blink = clamp(1 - Math.abs(u - 2.55) / 0.09);   // 停顿中的眨眼
    const sway = wave(u, 2) * 0.014 + sp * wave(u, 1) * 0.02;   // 身体轻晃，说话时加大
    world(k, w, h, fit(1.2, 1.9, 2.2), {
      person: { x: X + sway, z: 8, fg: true }, blurBg: 1.6,   // 人物和脸在前景层，背景只轻微虚化
      extra: [[X + sway, 0, 7.99, (kk, s) => face(kk, s, { talk, blink }), true]],
      after: (kk, cc) => {
        if (sp > 0.01) {   // 字幕：跟着说话出现，显示的就是这一句的内容
          kk.save(); kk.globalAlpha = sp;
          kk.fillStyle = 'rgba(255,255,255,.92)'; rr(kk, 150, 158, 239, 26, 13); kk.fill();
          kk.fillStyle = C.ink; kk.font = `600 13px ${JP}`; kk.textAlign = 'center'; kk.textBaseline = 'middle';
          kk.fillText('今天的风，比昨天轻一点。', 270, 172);
          kk.restore();
        }
        // 最后一拍：头顶冒「！」，跟着 RESET 一起淡出
        const q = P(u, 4.25, 4.5);
        if (q > 0.01) {
          const p = proj(cc, X, 1.78, 8);
          kk.save(); kk.globalAlpha = q;
          kk.fillStyle = C.blue; kk.beginPath(); kk.arc(p.x + 30, p.y - 16, 11, 0, TAU); kk.fill();
          kk.fillStyle = '#FFFFFF'; kk.font = `700 14px ${JP}`; kk.textAlign = 'center'; kk.textBaseline = 'middle';
          kk.fillText('！', p.x + 30, p.y - 15); kk.restore();
        }
      }
    });
  } }));

  // @element 30
  // 30 特写：胸像。动作只有特写才看得清：视线先动（被什么吸引）、一次眨眼、身体轻轻退半步，末段复原；首尾正视，循环无缝
  CELLS[29] = shot(frameCell({ lo: 1.4, hi: 1.85, name: '特写', abbr: 'CU', draw: (k, w, h, u) => {
    const gaze = 0.05 * eOut(P(u, 0.4, 0.9)) * (1 - P(u, 3.7, 4.4));   // 视线先动：被什么吸引
    const sway = -0.05 * eOut(P(u, 0.9, 1.3)) * (1 - P(u, 3.7, 4.4));  // 身体轻轻退半步
    const blink = clamp(1 - Math.abs(u - 1.55) / 0.09);                // 注意到时眨一次眼
    world(k, w, h, fit(1.4, 1.85, 2.6), {
      person: { x: sway, z: 8, fg: true },
      extra: [[sway, 0, 7.99, (kk, s) => face(kk, s, { gaze, blink }), true]],
      blurBg: 2.0
    });
  } }));

  // @element 31
  // 31 大特写：只框住眼带。视线左右扫一眼 + 一次干净利落的眨眼（wave 首尾回 0，循环无缝）
  CELLS[30] = shot(frameCell({ lo: 1.58, hi: 1.72, name: '大特写', abbr: 'ECU', draw: (k, w, h, u) => {
    const gaze = 0.05 * wave(u, 1);                         // 一次左右扫视
    const blink = P(u, 2.4, 2.5) * (1 - P(u, 2.6, 2.75));   // 干净利落的眨眼
    world(k, w, h, fit(1.58, 1.72, 2.0), {
      person: { z: 8, fg: true },
      extra: [[0, 0, 7.99, (kk, s) => face(kk, s, { gaze, blink }), true]],
      blurBg: 2.4
    });
  } }));

  // @element 32
  // 32 微距：0.26 m 的蘑菇撑满画面，对焦拉实（0.4–1.1s）后能看清伞盖的白点花纹、菌褶和沿伞缘爬的小虫；
  // 后景是虚化的树干，人物只剩一双虚化的腿（贴着地面看的视角）；结尾回虚，循环无缝
  CELLS[31] = shot(frameCell({ lo: -0.02, hi: 0.26, name: '微距', abbr: 'MACRO', draw: (k, w, h, u) => {
    const sharp = eIO(P(u, 0.4, 1.1)) * (1 - eIOs(P(u, 4.3, 4.7)));   // 1 = 对上焦；结尾回虚，循环无缝
    const bug = 0.5 - 0.5 * wave(u, 1);   // 小虫沿伞盖外缘来回走（0 = 右缘，1 = 左缘）
    world(k, w, h, fit(-0.02, 0.26, 0.9, { z: 7 }), {
      person: { x: 0.2, z: 7.6 }, blurBg: 4, blurFg: 4 * (1 - sharp),
      extra: [
        [0.3, 0, 7.4, (kk, s) => mushroom(kk, s, bug, 1.5), true],
        [-0.13, 0, 7.9, (kk, s) => tree(kk, s, 4, '#8FA98F')],
        [0.45, 0, 8.2, (kk, s) => tree(kk, s, 4.6, '#9DB3A0')]
      ]
    });
  } }));

  // @shared
  // 镜头衔接（33〜36）：两人 A（蓝）、B（墨色）面对面站在 z=8，用几个固定机位按时刻硬切；末尾 RESET 秒淡回第一个镜头。
  // 衔接概念参考 jingyu-skill（MIT · 阿梦freedom）。机位都不移动，避免和 01〜08 的运镜混淆。
  const DUO = { A: { x: -1.2, z: 8, col: C.blue }, B: { x: 1.2, z: 8, col: C.ink } };
  // two(o)：world 只支持一个 person，第二个人物 B 用 extra 加入；o.talkA / o.talkB 给说话的那个人加嘴部动作
  //   o.faces：画出脸的人（缺省 'AB'）。过肩镜头里背对机位的那个人不画脸，只露肩背
  const two = (o = {}) => {
    const f = o.faces === undefined ? 'AB' : o.faces, extra = [[DUO.B.x, 0, DUO.B.z, (k, s) => person(k, s, DUO.B)]];
    if (f.includes('A')) extra.push([DUO.A.x, 0, DUO.A.z - 0.01, (k, s) => face(k, s, { gaze: 0.04, talk: o.talkA || 0 })]);
    if (f.includes('B')) extra.push([DUO.B.x, 0, DUO.B.z - 0.01, (k, s) => face(k, s, { gaze: -0.04, talk: o.talkB || 0 })]);
    return Object.assign({ person: DUO.A, extra }, o);
  };
  // cutCell(shots)：shots = [[开始时刻, 画法(k,w,h,u), HUD]]，按时刻选镜头；最后 RESET 秒淡回 shots[0]
  function cutCell(shots) {
    const pick = u => shots.reduce((a, s) => (u >= s[0] ? s : a), shots[0]);
    return (k, w, h, u) => {
      const r = P(u, CYC - RESET, CYC), cur = pick(u);
      blend(k, kk => cur[1](kk, w, h, u), kk => shots[0][1](kk, w, h, 0), eIOs(r));
      return r > 0.5 ? shots[0][2] : cur[2];
    };
  }
  // 说话口型：u 落在 [a, b] 内时开合（首尾合拢）
  const mouth = (u, a, b) => P(u, a, a + 0.2) * (1 - P(u, b - 0.2, b)) * (0.35 + 0.35 * Math.max(0, Math.sin(u * 19)));

  // @element 33
  // 33 建立镜头：先用远景交代两人和场地的位置，再切到 A 的近景（观众已经知道 B 在 A 右边）
  CELLS[32] = shot(cutCell([
    [0, (k, w, h) => world(k, w, h, cam({ y: 4.5, z: -12, pitch: -0.12 }), two()), '建立 WIDE'],
    [2.4, (k, w, h, u) => world(k, w, h, cam({ x: -0.6, y: 1.45, z: 4.8 }), two({ talkA: mouth(u, 2.8, 4.1), blurBg: 1.2 })), '近景 A']
  ]));

  // @element 34
  // 34 正反打：两个过肩机位直接交替，不在两点之间移动；说话的人在镜头里，听的人只露肩背。A 始终在画面左、B 始终在右
  const OTS_A = cam({ x: 2.6, y: 1.5, z: 5.6, yaw: -0.741 }), OTS_B = cam({ x: -2.6, y: 1.5, z: 5.6, yaw: 0.741 });
  CELLS[33] = shot(cutCell([
    [0, (k, w, h, u) => world(k, w, h, OTS_A, two({ buildings: false, blurBg: 1.2, faces: 'A', talkA: mouth(u, 0.2, 1.3) })), '正打 A'],
    [1.4, (k, w, h, u) => world(k, w, h, OTS_B, two({ buildings: false, blurBg: 1.2, faces: 'B', talkB: mouth(u, 1.6, 2.7) })), '反打 B'],
    [2.8, (k, w, h, u) => world(k, w, h, OTS_A, two({ buildings: false, blurBg: 1.2, faces: 'A', talkA: mouth(u, 3.0, 4.0) })), '正打 A']
  ]));

  // @element 35
  // 35 动作衔接：A 匀速横穿，走到一半从正面机位切到侧前方机位；走位与步态都由 u 连续算出，切点前后动作不重来
  const walkX = u => lerp(-3.2, 3.2, Math.min(1, u / 4.2));
  const walker = u => ({ person: { x: walkX(u), z: 8, walk: u * 7, col: C.blue } });
  CELLS[34] = shot(cutCell([
    [0, (k, w, h, u) => world(k, w, h, cam({ y: 1.4 }), walker(u)), '机位 1'],
    [2.3, (k, w, h, u) => world(k, w, h, cam({ x: 1.4, y: 1.2, z: 5, yaw: -0.35 }), Object.assign(walker(u), {
      after: (kk, cc) => {   // 切点后 0.35 秒：脚下的蓝色虚线短标，说明是同一个动作
        const g = 1 - P(u, 2.3, 2.65); if (g <= 0) return;
        const p = proj(cc, walkX(u), 0, 8);
        kk.save(); kk.globalAlpha = g; kk.strokeStyle = C.blue; kk.lineWidth = 2; kk.setLineDash([5, 4]);
        kk.beginPath(); kk.moveTo(p.x - 40, p.y + 6); kk.lineTo(p.x + 40, p.y + 6); kk.stroke(); kk.restore();
      }
    })), '机位 2 · 动作延续']
  ]));

  // @element 36
  // 36 180 度轴线：右下角俯视小图画出 A—B 连线（轴线），两次机位都在同一侧；主画面里 A 始终在左
  function axisMap(k, w, h, camIdx) {
    const s = 66, x0 = w - 13 - 14 - s, y0 = h - 13 - 10 - s, cx = x0 + s / 2, cy = y0 + 26;
    k.save();
    k.fillStyle = 'rgba(255,255,255,.92)'; rr(k, x0, y0, s, s, 8); k.fill(); k.strokeStyle = C.border; k.lineWidth = 1.2; k.stroke();
    k.save(); rr(k, x0, y0, s, s, 8); k.clip();
    k.fillStyle = C.blueBg; k.fillRect(x0, cy, s, s);   // 摄影机所在的一侧（俯视图里画在下半）
    k.strokeStyle = C.g2; k.lineWidth = 1; for (let i = -s; i < s; i += 6) { k.beginPath(); k.moveTo(x0 + i, y0); k.lineTo(x0 + i + 26, cy); k.stroke(); }   // 越轴一侧打斜线
    k.restore();
    k.strokeStyle = C.blue; k.lineWidth = 1.6; k.setLineDash([3, 3]); k.beginPath(); k.moveTo(x0 + 6, cy); k.lineTo(x0 + s - 6, cy); k.stroke(); k.setLineDash([]);
    [[-14, C.blue], [14, C.ink]].forEach(([dx, col]) => { k.fillStyle = col; k.beginPath(); k.arc(cx + dx, cy, 4.5, 0, 7); k.fill(); });
    [[cx, cy + 26], [cx - 22, cy + 16]].forEach(([x, y], i) => { k.fillStyle = i === camIdx ? C.blue : C.g4; rr(k, x - 5, y - 3.5, 10, 7, 2); k.fill(); });
    txt(k, '越轴', cx, y0 + 11, `600 10px ${JP}`, C.sub, 'center', 'middle');
    k.restore();
  }
  CELLS[35] = shot(cutCell([
    [0, (k, w, h, u) => { world(k, w, h, cam({ y: 1.5, z: 3 }), two({ buildings: false, talkA: mouth(u, 0.5, 1.9) })); axisMap(k, w, h, 0); }, '机位 1'],
    [2.4, (k, w, h, u) => { world(k, w, h, cam({ x: -2.2, y: 1.5, z: 5.2, yaw: 0.702 }), two({ buildings: false, talkB: mouth(u, 2.7, 4.0) })); axisMap(k, w, h, 1); }, '机位 2 · 同侧']
  ]));

  // @end
  return { width: CW, height: CH, cycle: CYC * 2, cells: CELLS, fonts: [] };
});
