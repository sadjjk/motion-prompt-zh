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
  // 32 微距：贴着苔藓拍一朵约 2.7 cm 高的小毒蝇伞，蘑菇撑满画面高度。缺了就不像的两点：
  //   ① 很小的东西占满画面 —— 左下角 1 cm 比例尺 + 伞盖上的水珠和一只蚂蚁当参照；
  //   ② 只有极薄的一层是清楚的 —— 草叶按前后深度分层，离焦平面越远越虚；右下角侧视图里蓝色细带就是清楚范围。
  // 节奏（4.7 s 一轮）：开头焦点在远处、全画面发虚 → 0.5–1.4 s 焦点拉到蘑菇 → 镜头极慢前推到 1.08 倍 →
  // 4.2–4.7 s 焦点退回远处、推镜回到起点，与第 0 帧同一画面。
  // 不再用 world() 的 3D 场景：旧画法蘑菇被挤到右上角、前景大块虚腿抢画面，看不出「小东西撑满画面」。
  const MC_X = 270, MC_GY = 202;               // 蘑菇中心 x、地面 y（px）
  const MC_CM = 64;                            // 1 cm 对应的像素（蘑菇约 2.6 cm 高，与上面比例一致）
  const MC_FOCUS = [0.95, 0.5];                // 焦平面深度：远处 → 蘑菇所在深度（0 = 贴镜头，1 = 最远）
  const MC_PULL = [0.5, 1.4], MC_BACK = [4.2, 4.7];
  const MC_PUSH = 0.08;                        // 极慢前推的放大量
  const MC_DOF_K = 14;                         // 虚化 px = |深度 − 焦平面| × K，景深极浅所以 K 取大
  // 背景色块：远处的花和落叶虚成一团团颜色（径向渐变代替 blur，边缘本身就是软的）[x, y, r, 颜色]
  const MC_BOKEH = [[92, 72, 74, '233,178,110'], [448, 58, 62, '244,231,200'], [150, 158, 54, '159,191,138'], [486, 156, 58, '185,211,166'], [34, 30, 44, '255,255,255'], [330, 26, 40, '214,229,196']];
  // 草叶 [根部 x, 高, 叶尖偏移, 叶宽, 深度]；深度决定颜色和虚化程度
  const MC_BLADES = [
    [40, 120, 10, 7, 0.86], [72, 92, -8, 6, 0.9], [122, 142, 14, 7, 0.84], [184, 104, -10, 6, 0.88], [366, 132, 12, 7, 0.86], [412, 96, -6, 6, 0.9], [470, 152, 8, 7, 0.84], [512, 112, -12, 6, 0.88],
    [204, 72, -14, 5, 0.52], [230, 54, 8, 4, 0.48], [316, 66, 12, 5, 0.5], [344, 50, -6, 4, 0.53],
    [18, 176, 42, 24, 0.07], [84, 122, 30, 18, 0.1], [456, 162, -36, 22, 0.08], [524, 194, -30, 26, 0.06]
  ];
  const mcCol = d => d > 0.7 ? '#B9D0A6' : d > 0.3 ? '#6E9E5A' : '#3F6B3A';
  // 虚化：ctx.filter 的 px 是设备像素，按当前缩放换算，2 倍画布上看起来一样虚
  function mcBlur(k, b, fn) {
    if (b < 0.3) { fn(); return; }
    const t = k.getTransform();
    k.save(); k.filter = `blur(${(b * Math.hypot(t.a, t.b)).toFixed(2)}px)`; fn(); k.restore();
  }
  function mcBlade(k, [x, bh, lean, bw], gy) {
    k.beginPath(); k.moveTo(x - bw / 2, gy);
    k.quadraticCurveTo(x - bw * 0.3, gy - bh * 0.6, x + lean, gy - bh);
    k.quadraticCurveTo(x + bw * 0.3, gy - bh * 0.6, x + bw / 2, gy);
    k.closePath(); k.fill();
  }
  // 右下角侧视图：左边镜头，右边是深度轴；蓝色细带 = 清楚范围，跟着焦平面移动，蘑菇小图标在 0.5 处
  function mcDof(k, w, h, focus) {
    const pw = 92, ph = 46, x0 = w - 13 - 14 - pw, y0 = h - 13 - 10 - ph;
    const ax = x0 + 24, bx = x0 + pw - 8, gy = y0 + ph - 10, fx = lerp(ax, bx, focus);
    k.save();
    k.fillStyle = 'rgba(255,255,255,.92)'; rr(k, x0, y0, pw, ph, 7); k.fill();
    k.strokeStyle = C.border; k.lineWidth = 1.2; k.stroke();
    txt(k, '景深', x0 + 6, y0 + 10, `600 9px ${JP}`, C.sub, 'left', 'middle');
    k.fillStyle = C.g4; rr(k, x0 + 6, gy - 9, 10, 8, 2); k.fill();   // 机身
    k.beginPath(); k.moveTo(x0 + 16, gy - 7); k.lineTo(ax, gy - 9); k.lineTo(ax, gy - 1); k.lineTo(x0 + 16, gy - 3); k.fill();   // 镜头
    k.strokeStyle = C.g2; k.lineWidth = 1.2; k.beginPath(); k.moveTo(ax, gy); k.lineTo(bx, gy); k.stroke();
    const mx = lerp(ax, bx, MC_FOCUS[1]);   // 蘑菇小图标
    k.fillStyle = '#C34F40'; k.beginPath(); k.arc(mx, gy - 8, 5, Math.PI, 0); k.fill();
    k.fillStyle = '#E2DACB'; k.fillRect(mx - 1.5, gy - 8, 3, 8);
    k.fillStyle = 'rgba(47,107,235,.28)'; k.fillRect(fx - 2.5, y0 + 16, 5, gy - y0 - 16);
    k.strokeStyle = C.blue; k.lineWidth = 1.2; k.beginPath(); k.moveTo(fx, y0 + 16); k.lineTo(fx, gy); k.stroke();
    k.restore();
  }
  // 微距专用蘑菇（像素坐标，镜头与伞盖齐平略低）：毒蝇伞。比例参照实拍照片（360 图片搜索「毒蝇伞 微距」「fly agaric macro」）：
  //   伞盖是偏圆的馒头形，宽约等于全高的 0.9；伞面密布细小的白色疣点（不是大块斑），伞缘偏橙、挂着几片白色碎膜；
  //   菌柄细长洁白（宽只有伞盖的 1/6 左右），上部紧贴伞盖下垂一圈裙状菌环，基部膨大成球，球上绕几圈鳞状残片。
  //   平视时几乎看不到菌褶，只在伞缘下露出一线乳白。远景格仍用 mushroom()；这里单独画是因为微距要看清这些结构。
  const MC_CAP = { top: 26, rim: 90, rx: 78, n: 2.15 };               // 伞顶 y、伞缘 y、半宽、圆顶指数（2 = 椭圆，越大越方）
  const MC_STEM = { w0: 20, w1: 26, ring: 98, bulb: 180, base: 196 }; // 柄上宽、下宽、菌环上沿 y、菌球中心 y、着地 y
  const MC_WART_ROWS = [[0.1, 15], [0.26, 15], [0.42, 14], [0.58, 12], [0.73, 9], [0.86, 6], [0.96, 2]];   // 疣点各行 [高度比例, 个数]
  const mcH = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };      // 固定伪随机（纯函数）
  // 圆顶在高度比例 f（0 = 伞缘，1 = 伞顶）处的横向半宽比例；t ∈ [-1, 1] 横向位置处的顶面 y
  const mcDomeW = f => Math.pow(Math.max(0, 1 - Math.pow(f, MC_CAP.n)), 1 / MC_CAP.n);
  const mcDomeY = t => MC_CAP.rim - (MC_CAP.rim - MC_CAP.top) * mcDomeW(Math.min(1, Math.abs(t)));
  function mcShroom(k) {
    const X = MC_X, Cp = MC_CAP, S = MC_STEM, capPath = () => {
      k.beginPath(); for (let j = 0; j <= 60; j++) { const t = -1 + j / 30; k[j ? 'lineTo' : 'moveTo'](X + t * Cp.rx, mcDomeY(t)); }
      k.ellipse(X, Cp.rim, Cp.rx, 5, 0, 0, Math.PI, false); k.closePath();
    };
    // 菌褶：伞缘下一线乳白，细纹汇向柄（汇聚处被柄挡住）
    k.fillStyle = '#EEE6D4'; k.beginPath(); k.ellipse(X, Cp.rim + 1, Cp.rx * 0.95, 7, 0, 0, Math.PI); k.closePath(); k.fill();
    k.save(); k.clip(); k.strokeStyle = 'rgba(160,140,110,.45)'; k.lineWidth = 0.6;
    for (let j = 1; j < 44; j++) { const a = j / 44 * Math.PI; k.beginPath(); k.moveTo(X + Math.cos(a) * 8, Cp.rim + 1); k.lineTo(X + Math.cos(a) * Cp.rx, Cp.rim + 1 + Math.sin(a) * 7); k.stroke(); }
    k.restore();
    // 菌柄：细长、上窄下宽，左侧受光；下半段有一圈圈细碎的横向鳞纹
    const sg = k.createLinearGradient(X - S.w1 / 2 - 4, 0, X + S.w1 / 2 + 4, 0);
    sg.addColorStop(0, '#D6CCB8'); sg.addColorStop(0.3, '#FBF8F1'); sg.addColorStop(0.68, '#ECE5D6'); sg.addColorStop(1, '#BDB09A');
    k.fillStyle = sg; k.beginPath(); k.moveTo(X - S.w0 / 2, Cp.rim);
    k.bezierCurveTo(X - S.w0 / 2 - 1, Cp.rim + 40, X - S.w1 / 2 - 1, S.bulb - 30, X - S.w1 / 2, S.bulb - 6); k.lineTo(X + S.w1 / 2, S.bulb - 6);
    k.bezierCurveTo(X + S.w1 / 2 + 1, S.bulb - 30, X + S.w0 / 2 + 1, Cp.rim + 40, X + S.w0 / 2, Cp.rim); k.closePath(); k.fill();
    // 鳞纹只是淡淡几道断续的短弧（实拍里柄面是细绒状，不是整圈锯齿）
    k.strokeStyle = 'rgba(170,155,130,.28)'; k.lineWidth = 0.6;
    for (let y = S.ring + 30; y < S.bulb - 12; y += 9) {
      const hw = lerp(S.w0, S.w1, (y - Cp.rim) / (S.bulb - Cp.rim)) / 2;
      for (let j = 0; j < 3; j++) { const x = X - hw + (j + mcH(y + j)) * hw * 0.62; k.beginPath(); k.arc(x + 2, y - 1, 3, 0.3, Math.PI - 0.3); k.stroke(); }
    }
    // 菌球：基部膨大，绕 3 圈鳞状残片
    const bg = k.createRadialGradient(X - 7, S.bulb - 4, 2, X, S.bulb, 22);
    bg.addColorStop(0, '#FBF7EE'); bg.addColorStop(1, '#CFC2A8');
    k.fillStyle = bg; k.beginPath(); k.ellipse(X, S.bulb, 20, 15, 0, 0, TAU); k.fill();
    for (let r = 0; r < 3; r++) for (let j = 0; j < 9; j++) {
      const a = Math.PI * (0.06 + j * 0.11), x = X - Math.cos(a) * (19 - r * 2.5), y = S.bulb - 9 + r * 6 + Math.sin(a) * 3;
      k.fillStyle = 'rgba(150,130,100,.45)'; k.beginPath(); k.ellipse(x + 0.6, y + 0.8, 2.6, 1.4, 0, 0, TAU); k.fill();
      k.fillStyle = '#F8F3E8'; k.beginPath(); k.ellipse(x, y, 2.6, 1.4, 0, 0, TAU); k.fill();
    }
    // 菌环：紧贴伞盖下方的一圈白裙，上窄下宽、下沿波浪，左亮右暗；裙下柄上一道阴影
    k.fillStyle = 'rgba(90,70,40,.13)'; k.fillRect(X - S.w0 / 2, S.ring + 17, S.w0 + 0.5, 7);
    const rg = k.createLinearGradient(X - 18, 0, X + 18, 0); rg.addColorStop(0, '#E2D9C6'); rg.addColorStop(0.35, '#FFFDF8'); rg.addColorStop(1, '#C9BCA4');
    k.fillStyle = rg; k.strokeStyle = 'rgba(160,140,110,.7)'; k.lineWidth = 0.7; k.beginPath();
    k.moveTo(X - S.w0 / 2 - 1, S.ring); k.quadraticCurveTo(X - S.w0 / 2 - 6, S.ring + 9, X - S.w0 / 2 - 9, S.ring + 18);
    for (let j = 1; j <= 7; j++) { const x = X - S.w0 / 2 - 9 + j * (S.w0 + 18) / 7; k.quadraticCurveTo(x - (S.w0 + 18) / 14, S.ring + 22.5, x, S.ring + 18 + (j % 2) * 1.2); }
    k.quadraticCurveTo(X + S.w0 / 2 + 6, S.ring + 9, X + S.w0 / 2 + 1, S.ring); k.closePath(); k.fill(); k.stroke();
    k.strokeStyle = 'rgba(170,150,120,.35)'; [-6, -1, 4].forEach(dx => { k.beginPath(); k.moveTo(X + dx * 0.6, S.ring + 3); k.lineTo(X + dx * 1.6, S.ring + 19); k.stroke(); });
    // 伞盖：馒头形；左上受光的红，往伞缘渐成橙红，右下暗
    const cg = k.createRadialGradient(X - 28, Cp.top + 18, 4, X - 6, Cp.top + 36, Cp.rx * 1.25);
    cg.addColorStop(0, '#F65E3E'); cg.addColorStop(0.45, '#D92A1F'); cg.addColorStop(1, '#8E140F');
    k.fillStyle = cg; capPath(); k.fill();
    k.save(); capPath(); k.clip();
    const eg = k.createLinearGradient(0, Cp.rim - 16, 0, Cp.rim + 4); eg.addColorStop(0, 'rgba(240,120,50,0)'); eg.addColorStop(1, 'rgba(240,120,50,.55)');
    k.fillStyle = eg; k.fillRect(X - Cp.rx, Cp.rim - 16, Cp.rx * 2, 22);   // 伞缘偏橙
    k.fillStyle = 'rgba(255,255,255,.16)'; k.beginPath(); k.ellipse(X - 30, Cp.top + 20, 24, 12, -0.5, 0, TAU); k.fill();   // 湿润的反光
    k.restore();
    // 疣点：一行行铺满伞面，越靠两侧越扁（圆顶透视）、越靠伞缘越小；每颗下方一点暗影显出凸起
    MC_WART_ROWS.forEach(([f, n], row) => {
      const ew = mcDomeW(f);
      for (let j = 0; j < n; j++) {
        const id = row * 31 + j, t = ew * (-0.94 + (j + 0.5 + (mcH(id) - 0.5) * 0.7) / n * 1.88);
        const x = X + t * Cp.rx, y = Cp.rim - (Cp.rim - Cp.top) * Math.min(0.99, f + (mcH(id + 7) - 0.5) * 0.08);
        const r = (1.5 + mcH(id + 3) * 1.4) * (0.75 + 0.25 * f), sx = Math.sqrt(Math.max(0.15, 1 - (t / Math.max(ew, 0.01)) ** 2 * 0.85));
        k.fillStyle = 'rgba(100,15,10,.35)'; k.beginPath(); k.ellipse(x + 0.5, y + 0.9, r * sx, r * 0.8, 0, 0, TAU); k.fill();
        k.fillStyle = '#F4EEDF'; k.beginPath(); k.ellipse(x, y, r * sx, r * 0.8, 0, 0, TAU); k.fill();
        k.fillStyle = '#FFFFFF'; k.beginPath(); k.arc(x - r * sx * 0.3, y - r * 0.3, r * 0.35, 0, TAU); k.fill();
      }
    });
    // 伞缘挂着的几片白色碎膜
    k.fillStyle = '#F1EADA';
    [-0.86, -0.6, -0.31, 0.05, 0.38, 0.7].forEach((t, i) => { const x = X + t * Cp.rx, w = 4 + mcH(i + 400) * 4; k.beginPath(); k.moveTo(x - w / 2, Cp.rim + 2); k.lineTo(x + w / 2, Cp.rim + 2); k.lineTo(x + w * 0.1, Cp.rim + 5 + mcH(i + 410) * 3); k.closePath(); k.fill(); });
    // 苔藓：菌球一半埋进去，表面亮绿颗粒
    k.fillStyle = '#4F7A3A'; k.beginPath(); k.ellipse(X, S.base + 12, 120, 18, 0, Math.PI, 0); k.fill();
    k.fillStyle = '#7FAE5A'; for (let j = 0; j < 40; j++) { const x = X - 110 + mcH(j + 200) * 220, y = S.base + 10 - Math.sqrt(Math.max(0, 1 - ((x - X) / 120) ** 2)) * 16 * mcH(j + 260); k.beginPath(); k.arc(x, y, 1.2 + mcH(j + 300) * 1.4, 0, TAU); k.fill(); }
  }
  // 水珠：伞盖左前方一颗，透明体——边缘深、中间透出底色、左上高光、右下聚光
  const MC_DROP = [MC_X - 36, mcDomeY(-0.46) + 10, 6, 5.2];
  function mcDrop(k) {
    const [x, y, rx, ry] = MC_DROP;
    k.fillStyle = 'rgba(70,10,8,.3)'; k.beginPath(); k.ellipse(x + 1.5, y + 5, 6, 2, 0, 0, TAU); k.fill();
    const g = k.createRadialGradient(x - 2, y - 2, 1, x, y, rx);
    g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(0.6, 'rgba(235,130,115,.35)'); g.addColorStop(1, 'rgba(120,20,15,.6)');
    k.fillStyle = g; k.beginPath(); k.ellipse(x, y, rx, ry, 0, 0, TAU); k.fill();
    k.strokeStyle = 'rgba(90,15,10,.45)'; k.lineWidth = 0.7; k.stroke();
    k.fillStyle = '#FFFFFF'; k.beginPath(); k.ellipse(x - 2.6, y - 2.4, 2, 1.4, -0.5, 0, TAU); k.fill();
    k.fillStyle = 'rgba(255,225,205,.85)'; k.beginPath(); k.arc(x + 2.6, y + 2.6, 1.2, 0, TAU); k.fill();
  }
  // 蚂蚁：沿伞盖顶面爬，0.3–2.1 s 从右走到左，停下转身，2.5–4.3 s 走回右边，4.5 s 再转身——首尾帧同位同向。
  // 腿按走过的距离交替迈步（三足步态），停下时腿也停；每段路正好 4 步，0 与 4.7 s 腿的相位一致。
  const MC_ANT = { t0: 0.58, t1: -0.5, go: [0.3, 2.1], back: [2.5, 4.3], turn: [2.3, 4.5], steps: 4 };
  function mcAnt(k, ph, wig) {
    const ink = '#2B1D18';
    const leg = (hx, fx, near, i) => {
      const a = ph + (i % 2) * Math.PI + (near ? 0 : Math.PI), f = fx + 2.4 * Math.sin(a) + (near ? 0 : 1.4), lift = Math.max(0, Math.cos(a)) * 1.6;
      k.strokeStyle = near ? ink : 'rgba(43,29,24,.5)'; k.lineWidth = near ? 1.1 : 0.9;
      k.beginPath(); k.moveTo(hx, -4); k.lineTo((hx + f) / 2 + (fx - hx) * 0.15, -8.5 - lift * 0.5); k.lineTo(f, -lift); k.stroke();
    };
    [[0.6, -6], [2.2, 2], [3.8, 9.5]].forEach(([hx, fx], i) => leg(hx, fx, false, i));   // 远侧三条腿先画（被身体压住）
    k.fillStyle = ink;
    k.beginPath(); k.ellipse(-9, -5.5, 7, 5, -0.25, 0, TAU); k.fill();        // 腹部
    k.beginPath(); k.arc(-2.4, -4.6, 1.7, 0, TAU); k.fill();                  // 腹柄
    k.beginPath(); k.ellipse(2.2, -5.6, 4.6, 2.6, -0.2, 0, TAU); k.fill();    // 胸部
    k.beginPath(); k.ellipse(8.6, -7, 3.4, 3, 0.2, 0, TAU); k.fill();         // 头
    k.fillStyle = 'rgba(255,255,255,.35)'; k.beginPath(); k.ellipse(-10.5, -8, 2.6, 1.3, -0.4, 0, TAU); k.fill();   // 腹部高光
    k.beginPath(); k.arc(9.6, -8, 0.8, 0, TAU); k.fill();                    // 眼睛反光
    [[0.6, -6], [2.2, 2], [3.8, 9.5]].forEach(([hx, fx], i) => leg(hx, fx, true, i));
    k.strokeStyle = ink; k.lineWidth = 0.9;                                    // 触角：膝状，轻轻抖
    k.beginPath(); k.moveTo(10, -9.4); k.lineTo(11.5, -14.5 + wig); k.lineTo(16, -12 + wig * 0.6); k.stroke();
    k.beginPath(); k.moveTo(11, -9); k.lineTo(13.5, -13.5 - wig * 0.5); k.lineTo(17.5, -10.5 - wig * 0.3); k.stroke();
  }
  function mcAntOn(k, u) {
    const A = MC_ANT, s1 = eIO(P(u, A.go[0], A.go[1])), s2 = eIO(P(u, A.back[0], A.back[1]));
    const t = lerp(A.t0, A.t1, s1 - s2), x = MC_X + t * MC_CAP.rx, y = mcDomeY(t) + 0.5;
    const ang = Math.atan2(mcDomeY(t + 0.01) - mcDomeY(t - 0.01), 0.02 * MC_CAP.rx);
    const dir = u >= A.turn[0] && u < A.turn[1] ? 1 : -1;   // -1 = 朝左
    k.save(); k.translate(x, y); k.rotate(ang); k.scale(dir, 1);
    mcAnt(k, (s1 + s2) * A.steps * TAU, 1.2 * wave(u, 6));
    k.restore();
  }
  CELLS[31] = shot((k, w, h, u) => {
    const pull = eIO(P(u, MC_PULL[0], MC_PULL[1])) * (1 - eIOs(P(u, MC_BACK[0], MC_BACK[1])));
    const focus = lerp(MC_FOCUS[0], MC_FOCUS[1], pull);
    const Z = 1 + MC_PUSH * eIOs(P(u, MC_PULL[0], MC_BACK[0])) * (1 - eIOs(P(u, MC_BACK[0], MC_BACK[1])));
    const blurAt = d => Math.abs(d - focus) * MC_DOF_K;
    const zoom = z => { k.translate(MC_X, 110); k.scale(z, z); k.translate(-MC_X, -110); };
    // 底色 + 背景色块（远处，推镜时只放大 30%，有一点视差）
    const g = k.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#E8F0DF'); g.addColorStop(1, '#C9DDB9');
    k.fillStyle = g; k.fillRect(0, 0, w, h);
    k.save(); zoom(1 + (Z - 1) * 0.3);
    MC_BOKEH.forEach(([x, y, r, c]) => {
      const rg = k.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, `rgba(${c},.75)`); rg.addColorStop(0.6, `rgba(${c},.45)`); rg.addColorStop(1, `rgba(${c},0)`);
      k.fillStyle = rg; k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill();
    });
    k.restore();
    k.save(); zoom(Z);
    const layer = (lo, hi) => MC_BLADES.filter(b => b[4] >= lo && b[4] < hi).forEach(b => mcBlur(k, blurAt(b[4]), () => { k.fillStyle = mcCol(b[4]); mcBlade(k, b, MC_GY + 8); }));
    layer(0.7, 1.01);
    // 蘑菇、水珠、蚂蚁：都在焦平面 0.5 附近，一起虚实
    mcBlur(k, blurAt(MC_FOCUS[1]), () => { mcShroom(k); mcDrop(k); mcAntOn(k, u); });
    layer(0.3, 0.7);
    layer(0, 0.3);
    k.restore();
    // 1 cm 比例尺：跟着推镜一起变长，说明画面里的东西实际很小
    const L = MC_CM * Z, sx = 40, sy = h - 34;
    k.save();
    k.fillStyle = 'rgba(255,255,255,.85)'; rr(k, sx - 6, sy - 15, L + 12, 22, 5); k.fill();
    k.strokeStyle = C.ink; k.lineWidth = 1.6; k.beginPath();
    k.moveTo(sx, sy - 3); k.lineTo(sx, sy + 3); k.moveTo(sx, sy); k.lineTo(sx + L, sy); k.moveTo(sx + L, sy - 3); k.lineTo(sx + L, sy + 3); k.stroke();
    txt(k, '1 cm', sx + L / 2, sy - 8, `600 9px ${MONO}`, C.ink, 'center', 'middle');
    k.restore();
    mcDof(k, w, h, focus);
    return '微距 MACRO';
  });

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

  // @shared
  // 分镜与节奏（37〜47）：一张卡横排几个小镜头格，按时间依次点亮；当前格蓝框、已播格灰框、未播格只有浅底。
  // 这一组按整轮 9.4 秒走（shot 传进来的 uu + cyc × CYC）：0–8.8 秒播完全部格子，8.8–9.4 秒淡回起始画面，首尾同一帧。
  // 描述方法参考 jingyu-skill（MIT · 阿梦freedom）。
  const SB_END = HOLD - 0.6;                          // 8.8：开始淡回
  const sbU = (uu, cyc) => uu + cyc * CYC;            // 还原整轮时间 0..HOLD
  const sbFade = U => 1 - eIOs(P(U, SB_END, HOLD));   // 1 = 正常显示，结尾降到 0，与 U = 0 的起始画面一致
  // sbRow(n, o)：n 个格子的位置；缺省排在 REC / HUD 之下、取景器底角之上
  function sbRow(n, o = {}) {
    const x0 = o.x0 || 30, x1 = o.x1 || CW - 30, y = o.y || 50, h = o.h || 112, gap = o.gap || 12;
    const w = (x1 - x0 - gap * (n - 1)) / n;
    return Array.from({ length: n }, (_, i) => ({ x: x0 + i * (w + gap), y, w, h }));
  }
  // sbState(U, ts, i)：ts = 各格开始时刻。落在本格区间为当前（1），之后为已播（2），未到或淡回过半为未播（0）
  const sbState = (U, ts, i) => (U < ts[i] || U >= SB_END + 0.3) ? 0 : (i + 1 < ts.length && U >= ts[i + 1]) ? 2 : 1;
  const sbOn = (U, ts, i) => P(U, ts[i], ts[i] + 0.3) * sbFade(U);   // 格内画面的不透明度
  // sbPanel(k, r, st, on, draw, no)：先画浅底，再在格内局部坐标（已裁切）draw(k, w, h)，最后描框和左上角编号
  function sbPanel(k, r, st, on, draw, no) {
    k.save();
    k.fillStyle = C.g1; rr(k, r.x, r.y, r.w, r.h, 6); k.fill();
    if (on > 0.001) { k.save(); rr(k, r.x, r.y, r.w, r.h, 6); k.clip(); k.translate(r.x, r.y); k.globalAlpha = on; draw(k, r.w, r.h); k.restore(); }
    k.strokeStyle = st === 1 ? C.blue : st === 2 ? C.g3 : C.border; k.lineWidth = st === 1 ? 2.4 : 1.4;
    rr(k, r.x, r.y, r.w, r.h, 6); k.stroke();
    if (no) { k.fillStyle = 'rgba(255,255,255,.85)'; rr(k, r.x + 4, r.y + 4, 18, 14, 4); k.fill(); txt(k, no, r.x + 13, r.y + 11.5, `600 10px ${MONO}`, st === 1 ? C.blue : C.sub, 'center', 'middle'); }
    k.restore();
  }
  // sbLabel：格子下方的说明文字，当前格用蓝色
  const sbLabel = (k, r, s, st, dy = 14) => txt(k, s, r.x + r.w / 2, r.y + r.h + dy, `600 12px ${JP}`, st === 1 ? C.blue : st === 2 ? C.ink : C.faint, 'center', 'middle');

  // @element 37
  // 37 前后对比：之前（杂乱房间）→ 衔接（一只手从镜头前扫过）→ 之后（同一机位的整洁房间）。
  // 第 1、3 格的家具位置、取景完全相同，只差杂物；两格叠同一个蓝色虚线框，标「同机位」。
  const BA_TS = [0.3, 3.0, 4.7];              // 三格开始时刻；衔接格只占 1.7 秒，扫过要快
  const BA_SWEEP = [0.25, 1.15];              // 衔接格内：手从左扫到右的区间（相对 BA_TS[1]）
  const BA_ALIGN = [0.45, 0.30, 0.42, 0.50];  // 对齐框（占格宽高的比例 x, y, w, h），框住沙发和挂画
  // 杂物：[x, y, w, h, 角度, 颜色]，按格宽高比例给出；整洁房间里不画
  const BA_MESS = [[0.08, 0.80, 0.14, 0.07, 0.4, C.blueM], [0.30, 0.86, 0.10, 0.06, -0.6, C.g4], [0.72, 0.82, 0.16, 0.06, 0.25, C.blueL],
    [0.56, 0.90, 0.09, 0.05, 1.1, C.g3], [0.86, 0.74, 0.08, 0.10, -0.3, C.g4], [0.40, 0.76, 0.12, 0.05, -0.15, C.blueM]];
  function baRoom(k, w, h, mess) {
    k.fillStyle = C.blueBg; k.fillRect(0, 0, w, h * 0.72);   // 墙
    k.fillStyle = C.g2; k.fillRect(0, h * 0.72, w, h * 0.28); // 地板
    k.fillStyle = '#FFFFFF'; rr(k, w * 0.08, h * 0.16, w * 0.24, h * 0.34, 3); k.fill();   // 窗
    k.strokeStyle = C.g3; k.lineWidth = 1.2; k.stroke();
    k.beginPath(); k.moveTo(w * 0.20, h * 0.16); k.lineTo(w * 0.20, h * 0.50); k.stroke();
    // 挂画：杂乱时歪着
    k.save(); k.translate(w * 0.66, h * 0.26); k.rotate(mess ? 0.16 : 0);
    k.fillStyle = C.blueL; k.fillRect(-w * 0.08, -h * 0.08, w * 0.16, h * 0.16); k.strokeStyle = C.blueM; k.strokeRect(-w * 0.08, -h * 0.08, w * 0.16, h * 0.16); k.restore();
    // 沙发
    k.fillStyle = C.blue; rr(k, w * 0.48, h * 0.50, w * 0.36, h * 0.24, 5); k.fill();
    k.fillStyle = '#5A87F0'; rr(k, w * 0.50, h * 0.42, w * 0.32, h * 0.14, 4); k.fill();
    if (!mess) return;
    BA_MESS.forEach(([x, y, bw, bh, a, col]) => { k.save(); k.translate(x * w, y * h); k.rotate(a); k.fillStyle = col; rr(k, -bw * w / 2, -bh * h / 2, bw * w, bh * h, 2); k.fill(); k.restore(); });
    k.fillStyle = C.g4; k.save(); k.translate(w * 0.62, h * 0.50); k.rotate(-0.5); rr(k, -w * 0.06, -h * 0.03, w * 0.12, h * 0.06, 3); k.fill(); k.restore();   // 搭在沙发上的衣服
  }
  // 一只手：掌心朝镜头的剪影，离镜头很近所以又大又虚；p = 0 在格子左外侧，1 在右外侧
  function baHand(k, w, h, p) {
    const x = lerp(-w * 0.5, w * 1.5, eIO(p));
    k.save(); k.filter = 'blur(2px)'; k.fillStyle = C.ink; k.translate(x, h * 0.62); k.rotate(-0.25);
    rr(k, -w * 0.22, -h * 0.30, w * 0.44, h * 0.80, w * 0.12); k.fill();   // 手掌
    [-0.16, -0.05, 0.06, 0.17].forEach((fx, i) => { rr(k, fx * w - w * 0.045, -h * (0.62 + (i === 1 || i === 2 ? 0.06 : 0)), w * 0.09, h * 0.42, w * 0.045); k.fill(); });
    k.restore();
  }
  CELLS[36] = shot((k, w, h, uu, cyc) => {
    const U = sbU(uu, cyc), R = sbRow(3), names = ['之前', '衔接', '之后'];
    const st = R.map((_, i) => sbState(U, BA_TS, i));
    sbPanel(k, R[0], st[0], sbOn(U, BA_TS, 0), (kk, pw, ph) => baRoom(kk, pw, ph, true), '1');
    sbPanel(k, R[1], st[1], sbOn(U, BA_TS, 1), (kk, pw, ph) => {
      const p = P(U - BA_TS[1], BA_SWEEP[0], BA_SWEEP[1]);
      baRoom(kk, pw, ph, p < 0.5);   // 手挡住镜头的那一刻换成整洁房间
      if (p > 0 && p < 1) baHand(kk, pw, ph, p);
    }, '2');
    sbPanel(k, R[2], st[2], sbOn(U, BA_TS, 2), (kk, pw, ph) => baRoom(kk, pw, ph, false), '3');
    R.forEach((r, i) => sbLabel(k, r, names[i], st[i]));
    // 同机位：第 3 格出现后，在 1、3 两格的同一位置画虚线框，上方用折线连起来
    const a = P(U, BA_TS[2] + 0.5, BA_TS[2] + 0.9) * sbFade(U);
    if (a > 0.001) {
      k.save(); k.globalAlpha = a; k.strokeStyle = C.blue; k.lineWidth = 1.6; k.setLineDash([4, 3]);
      const box = r => [r.x + BA_ALIGN[0] * r.w, r.y + BA_ALIGN[1] * r.h, BA_ALIGN[2] * r.w, BA_ALIGN[3] * r.h];
      const b1 = box(R[0]), b3 = box(R[2]);
      k.strokeRect(...b1); k.strokeRect(...b3);
      const yTop = R[0].y - 6;
      k.beginPath(); k.moveTo(b1[0] + b1[2] / 2, b1[1]); k.lineTo(b1[0] + b1[2] / 2, yTop); k.lineTo(b3[0] + b3[2] / 2, yTop); k.lineTo(b3[0] + b3[2] / 2, b3[1]); k.stroke();
      k.setLineDash([]);
      const f = `600 11px ${JP}`, tx = (b1[0] + b3[0] + b3[2]) / 2, ww = tw(k, '同机位', f) + 14;
      k.fillStyle = '#FFFFFF'; rr(k, tx - ww / 2, yTop - 9, ww, 18, 9); k.fill(); k.strokeStyle = C.blue; k.stroke();
      txt(k, '同机位', tx, yTop, f, C.blue, 'center', 'middle');
      k.restore();
    }
    const cur = st.lastIndexOf(1);
    return cur < 0 ? '前后对比' : `${cur + 1}/3 ${names[cur]}`;
  });

  // @element 38
  // 38 混剪卡点：底部节拍条每 0.5 秒一拍、每 2 拍一个重拍；画面只在拍点上切换。
  // 重拍切到特写并轻微放大再回落，弱拍在全景、中景之间交替；节拍条上方的色块显示每段用了哪种镜头，色块边界就是拍线。
  const BS_T0 = 0.4, BS_BEAT = 0.5, BS_N = 17;   // 第 1 拍时刻、拍长、拍数（最后一拍 8.4 秒，8.8 秒前播完）
  const BS_BAR = { x0: 40, x1: 499, y: 168 };    // 节拍条：U = 0..SB_END 映射到 x0..x1
  const BS_POP = 0.07;                            // 重拍放大量，按 e^(-6t) 回落
  const bsX = U => lerp(BS_BAR.x0, BS_BAR.x1, U / SB_END);
  // 第 i 拍用的镜头：偶数拍是重拍 → 特写；弱拍按 全景 / 中景 交替；第 1 拍之前停在全景
  const bsKind = i => i < 0 ? 'W' : i % 2 === 0 ? 'C' : i % 4 === 1 ? 'W' : 'M';
  const BS_NAME = { W: '全景', M: '中景', C: '特写' };
  // 三种镜头都按整卡取景；bsFrame 把画面整体上移 22 px，给底部节拍条让位
  const bsShot = (kk, kind, U) => {
    const sway = 0.6 * Math.sin(U / HOLD * TAU * 2);   // 人物缓慢来回走，一轮 2 个来回，首尾同位
    if (kind === 'W') return world(kk, CW, CH, cam({ y: 1.4, z: 0 }), { person: { x: sway, z: 8, walk: U * 7 } });
    if (kind === 'M') return world(kk, CW, CH, fit(0.88, 1.92, 4.2, { cx: sway }), { person: { x: sway, z: 8, armUp: true, fg: true } });
    world(kk, CW, CH, fit(1.4, 1.85, 2.6, { cx: sway }), {
      person: { x: sway, z: 8, fg: true },
      extra: [[sway, 0, 7.99, (k2, s) => face(k2, s, { talk: 0.5 + 0.5 * Math.sin(U * 12) }), true]]
    });
  };
  function bsFrame(k, U) {
    const i = Math.floor((U - BS_T0) / BS_BEAT + 1e-9), beat = Math.min(i, BS_N - 1), kind = bsKind(beat);
    const since = U - (BS_T0 + beat * BS_BEAT);
    const pop = kind === 'C' && beat >= 0 ? 1 + BS_POP * Math.exp(-since * 6) : 1;
    k.save(); k.translate(CW / 2, CH / 2 - 22); k.scale(pop, pop); k.translate(-CW / 2, -CH / 2); bsShot(k, kind, U); k.restore();
    // 节拍条底板
    k.save();
    k.fillStyle = 'rgba(255,255,255,.94)'; rr(k, BS_BAR.x0 - 10, BS_BAR.y - 22, BS_BAR.x1 - BS_BAR.x0 + 20, 36, 8); k.fill();
    // 每段镜头的色块（已播段实色，未播段浅色）
    for (let j = -1; j < BS_N; j++) {
      const a = j < 0 ? 0 : BS_T0 + j * BS_BEAT, b = j < 0 ? BS_T0 : Math.min(SB_END, a + BS_BEAT), kd = bsKind(j);
      const col = kd === 'C' ? C.blue : kd === 'M' ? C.blueM : C.g3;
      k.globalAlpha = U >= a ? 1 : 0.28; k.fillStyle = col; k.fillRect(bsX(a) + 1, BS_BAR.y - 16, bsX(b) - bsX(a) - 2, 8);
    }
    k.globalAlpha = 1;
    // 拍线：重拍高、蓝色；播放头经过时亮一下
    for (let j = 0; j < BS_N; j++) {
      const t = BS_T0 + j * BS_BEAT, x = bsX(t), acc = j % 2 === 0, hit = clamp(1 - (U - t) / 0.25) * (U >= t ? 1 : 0);
      k.strokeStyle = acc ? C.blue : C.g4; k.lineWidth = acc ? 2 + hit * 1.5 : 1.2;
      k.beginPath(); k.moveTo(x, BS_BAR.y + (acc ? -4 : 0)); k.lineTo(x, BS_BAR.y + 10); k.stroke();
    }
    // 播放头
    const px = bsX(Math.min(U, SB_END));
    k.fillStyle = C.ink; k.beginPath(); k.moveTo(px - 4, BS_BAR.y - 20); k.lineTo(px + 4, BS_BAR.y - 20); k.lineTo(px, BS_BAR.y - 15); k.fill();
    k.fillRect(px - 0.75, BS_BAR.y - 16, 1.5, 28);
    k.restore();
    return beat < 0 ? '混剪卡点' : `${beat % 2 === 0 ? '重拍' : '弱拍'} · ${BS_NAME[kind]}`;
  }
  CELLS[37] = shot((k, w, h, uu, cyc) => {
    const U = sbU(uu, cyc), r = 1 - sbFade(U);
    let hud = '混剪卡点';
    blend(k, kk => { hud = bsFrame(kk, U); }, kk => bsFrame(kk, 0), r);
    return r > 0.5 ? '混剪卡点' : hud;
  });


  // sbCam(ph, lo, hi, d, cx, z)：小格里的机位；lo〜hi（米）正好占满格高 ph，d = 离主体的距离
  const sbCam = (ph, lo, hi, d, cx = 0, z = 8) => cam({ x: cx, y: (lo + hi) / 2, z: z - d, f: ph * d / (hi - lo) });

  // @element 39
  // 39 首尾帧：左格首帧、右格尾帧从头到尾不动（锁定），只有中间格在演过程：人物从左走到右、停下举手。
  // 下方时间轴两端钉在首尾帧上，播放头只在两端之间走，标「只写过程」。
  const FL_X = [-1.6, 1.6];            // 首帧、尾帧里人物的位置（米）
  const FL_RUN = [1.0, 7.4];           // 过程在整轮里的区间
  const FL_ARM = 0.82;                 // 过程走到这个比例后举手（尾帧是举手姿态）
  const flPose = p => ({ x: lerp(FL_X[0], FL_X[1], clamp(p / FL_ARM)), z: 8, walk: clamp(p / FL_ARM) * 14, armUp: p >= FL_ARM });
  const flScene = (k, w, h, p) => world(k, w, h, sbCam(h, -0.3, 2.4, 6), { person: flPose(p), trees: false, mountains: false });
  // 锁形小图标：紧挨左上角编号（右上角是太阳、右下角是尾帧人物，放那里会叠在一起），说明这一帧固定
  function flLock(k, r, col) {
    const x = r.x + 33, y = r.y + 12;
    k.save(); k.strokeStyle = col; k.fillStyle = col; k.lineWidth = 1.6;
    k.beginPath(); k.arc(x, y - 2, 3.5, Math.PI, 0); k.stroke();
    rr(k, x - 5, y - 2, 10, 8, 2); k.fill(); k.restore();
  }
  CELLS[38] = shot((k, w, h, uu, cyc) => {
    const U = sbU(uu, cyc), R = sbRow(3, { h: 100 }), fade = sbFade(U);
    const endsOn = P(U, 0.2, 0.5) * fade, p = eIOs(P(U, FL_RUN[0], FL_RUN[1]));
    const run = U >= FL_RUN[0] && U < SB_END + 0.3 ? 1 : 0;   // 过程格在演时为当前格（蓝框）
    sbPanel(k, R[0], endsOn > 0.5 ? 2 : 0, endsOn, (kk, pw, ph) => flScene(kk, pw, ph, 0), '首');
    sbPanel(k, R[1], run, P(U, FL_RUN[0] - 0.3, FL_RUN[0]) * fade, (kk, pw, ph) => flScene(kk, pw, ph, p), '');
    sbPanel(k, R[2], endsOn > 0.5 ? 2 : 0, endsOn, (kk, pw, ph) => flScene(kk, pw, ph, 1), '尾');
    if (endsOn > 0.5) { flLock(k, R[0], C.g4); flLock(k, R[2], C.g4); }
    sbLabel(k, R[0], '首帧 · 固定', endsOn > 0.5 ? 2 : 0);
    sbLabel(k, R[1], '只写过程', run);
    sbLabel(k, R[2], '尾帧 · 固定', endsOn > 0.5 ? 2 : 0);
    // 时间轴：从首帧中心到尾帧中心，两端是实心钉，播放头在中间走
    const y = R[0].y + R[0].h + 32, xa = R[0].x + R[0].w / 2, xb = R[2].x + R[2].w / 2;
    k.save(); k.globalAlpha = endsOn;
    k.strokeStyle = C.g3; k.lineWidth = 2; k.beginPath(); k.moveTo(xa, y); k.lineTo(xb, y); k.stroke();
    k.strokeStyle = C.blue; k.lineWidth = 3; k.beginPath(); k.moveTo(xa, y); k.lineTo(lerp(xa, xb, p), y); k.stroke();
    [xa, xb].forEach(x => { k.fillStyle = C.ink; k.beginPath(); k.arc(x, y, 4.5, 0, TAU); k.fill(); });
    if (run) { const px = lerp(xa, xb, p); k.fillStyle = C.blue; k.beginPath(); k.arc(px, y, 5.5, 0, TAU); k.fill(); k.fillStyle = '#FFFFFF'; k.beginPath(); k.arc(px, y, 2.2, 0, TAU); k.fill(); }
    k.restore();
    return run ? `过程 ${Math.round(p * 100)}%` : '首尾帧';
  });

  // @element 40
  // 40 动作拆节拍：「端起杯子喝一口」拆成 5 拍：起始 → 伸手（慢）→ 停 1 拍 → 举杯（快）→ 结束。
  // 5 个格子等宽，下方时间条的段长按每拍实际时长画：慢的拍长、快的拍短、停顿单独占一段，一眼看出节奏。
  const BT_BEATS = [   // [格下标签, 时长 s, 速度]；速度 slow / stop / fast 决定时间条颜色和段内字
    ['起始', 1.2, ''], ['伸手 · 慢', 2.6, 'slow'], ['停 1 拍', 1.0, 'stop'], ['举杯 · 快', 0.8, 'fast'], ['结束', 2.6, '']
  ];
  const BT_T0 = 0.3;   // 第 1 拍开始；5 拍共 8.2 s，8.5 s 播完，留在 SB_END（8.8）之前
  const BT_TS = BT_BEATS.reduce((a, b, i) => (a.push(i ? a[i - 1] + BT_BEATS[i - 1][1] : BT_T0), a), []);
  const BT_FAST = 0.5;   // 举杯只用本拍前一半时间，后一半停在嘴边，显得快
  // 每拍的姿态：r = 手从桌上伸到杯子（0〜1），l = 杯子从桌面举到嘴边（0〜1）
  const btPose = (i, q) => i === 0 ? { r: 0, l: 0 } : i === 1 ? { r: eIO(q), l: 0 } : i === 2 ? { r: 1, l: 0 } : i === 3 ? { r: 1, l: eOut(clamp(q / BT_FAST)) } : { r: 1, l: 1 };
  // 坐在桌边的人（侧面）：手臂用一条弯线从肩膀连到手，杯子在手里
  function btFig(k, w, h, r, l) {
    const ty = h * 0.74, bx = w * 0.26;
    k.fillStyle = C.g3; k.fillRect(w * 0.42, ty, w * 0.58, 4); k.fillRect(w * 0.88, ty + 4, 3, h - ty);   // 桌面、桌腿
    k.fillStyle = C.blue;
    rr(k, bx - 9, h * 0.4, 18, ty - h * 0.4 + 4, 6); k.fill();                 // 上身
    k.beginPath(); k.arc(bx + l * 2, h * 0.3 - l * 2, 9, 0, TAU); k.fill();    // 头，喝的时候略后仰
    const rest = [w * 0.46, ty - 3], grip = [w * 0.66, ty - 7], lip = [bx + 14, h * 0.33], sh = [bx + 4, h * 0.45];
    const cup = [lerp(grip[0], lip[0], l), lerp(grip[1], lip[1], l)];
    const hand = l > 0 ? cup : [lerp(rest[0], grip[0], r), lerp(rest[1], grip[1], r)];
    k.strokeStyle = C.blue; k.lineWidth = 5; k.lineCap = 'round';
    k.beginPath(); k.moveTo(sh[0], sh[1]); k.quadraticCurveTo((sh[0] + hand[0]) / 2, Math.max(sh[1], hand[1]) + 10, hand[0], hand[1]); k.stroke();
    k.save(); k.translate(cup[0] + 6, cup[1]); k.rotate(-l * 0.5);   // 杯子朝嘴的方向倾斜
    k.fillStyle = '#FFFFFF'; k.strokeStyle = C.ink; k.lineWidth = 1.4;
    rr(k, -5, -8, 10, 13, 2); k.fill(); k.stroke();
    k.fillStyle = C.blueL; k.fillRect(-4, -4, 8, 8);
    k.restore();
  }
  CELLS[39] = shot((k, w, h, uu, cyc) => {
    const U = sbU(uu, cyc), R = sbRow(5, { h: 92, gap: 10 }), fade = sbFade(U);
    let cur = -1;
    R.forEach((r, i) => {
      const st = sbState(U, BT_TS, i), q = st === 1 ? clamp((U - BT_TS[i]) / BT_BEATS[i][1]) : 1, pose = btPose(i, q);
      if (st === 1) cur = i;
      sbPanel(k, r, st, sbOn(U, BT_TS, i), (kk, pw, ph) => btFig(kk, pw, ph, pose.r, pose.l), String(i + 1));
      sbLabel(k, r, BT_BEATS[i][0], st);
    });
    // 时间条：段长 ∝ 每拍时长；慢 = 浅蓝、停 = 灰、快 = 深蓝，段内写字；黑色播放头
    const x0 = R[0].x, x1 = R[4].x + R[4].w, y = R[0].y + R[0].h + 32, total = BT_TS[4] + BT_BEATS[4][1] - BT_T0;
    k.save(); k.globalAlpha = P(U, 0.2, 0.5) * fade;
    BT_BEATS.forEach(([, dur, kind], i) => {
      const xa = lerp(x0, x1, (BT_TS[i] - BT_T0) / total), xb = lerp(x0, x1, (BT_TS[i] + dur - BT_T0) / total);
      k.fillStyle = kind === 'fast' ? C.blue : kind === 'slow' ? C.blueM : kind === 'stop' ? C.g4 : C.g2;
      rr(k, xa + 1, y - 6, xb - xa - 2, 12, 3); k.fill();
      const tag = { slow: '慢', stop: '停', fast: '快' }[kind];
      if (tag) txt(k, tag, (xa + xb) / 2, y + 0.5, `700 9px ${JP}`, '#FFFFFF', 'center', 'middle');
    });
    if (U >= BT_T0 && U < SB_END + 0.3) { const px = lerp(x0, x1, clamp((U - BT_T0) / total)); k.fillStyle = C.ink; k.fillRect(px - 1, y - 9, 2, 18); }
    k.restore();
    return cur >= 0 ? `${cur + 1}/5 ${BT_BEATS[cur][0]}` : '动作拆节拍';
  });

  // @element 41
  // 41 一镜一动作：先看反例 —— 一个镜头里同时塞进「走」「挥手」「推镜」，三处红标，下方红字说明；
  // 再拆成 3 个镜头，每格只有 1 个动作 + 1 种机位（走·固定 / 挥手·固定 / 站定·推镜），依次播放。
  const OA_RED = '#E5484D';
  const OA_BAD = [0.3, 3.6];         // 反例镜头的区间
  const OA_TAGS = [1.0, 1.5, 2.0];   // 三处红标出现：走、挥手、推镜
  const OA_SWAP = [3.6, 4.1];        // 反例淡出、三格淡入
  const OA_TS = [4.2, 5.7, 7.2], OA_DUR = 1.5;   // 三格各自开始与时长，8.7 s 播完
  const OA_LABEL = ['走 · 固定', '挥手 · 固定', '站定 · 推镜'];
  const oaWave = t => Math.floor(t * 4) % 2 === 0;   // 挥手：每 0.25 s 举放一次
  const oaPerson = (x, walk, up) => ({ x, z: 8, walk, armUp: up });
  // 推镜用固定焦距、机位前移，人物变大；d0 = 起始距离（与 sbCam 同样的画框）
  const oaPush = (h, d0, d) => cam({ x: 0, y: 1.05, z: 8 - d, f: h * d0 / 2.7 });
  function oaBox(k, x, y, s) {
    const bw = tw(k, s, `700 11px ${JP}`) + 10;
    k.fillStyle = OA_RED; rr(k, x, y, bw, 16, 4); k.fill();
    txt(k, s, x + bw / 2, y + 8.5, `700 11px ${JP}`, '#FFFFFF', 'center', 'middle');
  }
  // 红圈 + 右侧红标；y 限制在格内，推近后标签不出格
  function oaTag(k, w, h, x, y, s, a) {
    if (a <= 0) return;
    y = Math.max(12, Math.min(h - 12, y));
    k.save(); k.globalAlpha *= a;
    k.strokeStyle = OA_RED; k.lineWidth = 1.6; k.beginPath(); k.arc(x, y, 9, 0, TAU); k.stroke();
    oaBox(k, x + 12, y - 8, s);
    k.restore();
  }
  function oaBad(k, w, h, U) {
    const p = P(U, OA_BAD[0], OA_BAD[1]), x = lerp(-1.6, 1.6, p), c = oaPush(h, 7, lerp(7, 4.4, eIOs(p)));
    world(k, w, h, c, { person: oaPerson(x, p * 20, oaWave(U)), trees: false, mountains: false });
    const ft = proj(c, x, 0.4, 8), hd = proj(c, x + 0.3, 1.75, 8);
    oaTag(k, w, h, w / 2 + ft.x, h / 2 + ft.y, '走', P(U, OA_TAGS[0], OA_TAGS[0] + 0.25));
    oaTag(k, w, h, w / 2 + hd.x, h / 2 + hd.y, '挥手', P(U, OA_TAGS[1], OA_TAGS[1] + 0.25));
    const a = P(U, OA_TAGS[2], OA_TAGS[2] + 0.25);
    if (a <= 0) return;
    // 推镜：四角红色箭头指向画面中心
    k.save(); k.globalAlpha *= a; k.strokeStyle = OA_RED; k.lineWidth = 2; k.lineCap = 'round';
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sy]) => {
      const xa = sx > 0 ? 12 : w - 12, ya = sy > 0 ? 10 : h - 10, xb = xa + sx * 16, yb = ya + sy * 10;
      k.beginPath(); k.moveTo(xa, ya); k.lineTo(xb, yb); k.moveTo(xb - sx * 6, yb); k.lineTo(xb, yb); k.lineTo(xb, yb - sy * 5); k.stroke();
    });
    oaBox(k, 36, 8, '推镜');   // 放在左上箭头旁；放中间会和推近后的人头、「挥手」标叠在一起
    k.restore();
  }
  function oaGood(k, w, h, i, q, U) {
    const opt = { trees: false, mountains: false };
    if (i === 0) return world(k, w, h, sbCam(h, -0.3, 2.4, 6), { ...opt, person: oaPerson(lerp(-1.2, 1.2, q), q * 10, false) });
    if (i === 1) return world(k, w, h, sbCam(h, -0.3, 2.4, 6), { ...opt, person: oaPerson(0, 0, q < 1 && oaWave(U)) });
    world(k, w, h, oaPush(h, 6, lerp(6, 3.6, eIOs(q))), { ...opt, person: oaPerson(0, 0, false) });
  }
  CELLS[40] = shot((k, w, h, uu, cyc) => {
    const U = sbU(uu, cyc), back = P(U, SB_END, HOLD), sw = P(U, OA_SWAP[0], OA_SWAP[1]);
    // 反例布局在开头和结尾淡回时可见，三格布局在中段；两者交叉淡入淡出，首尾同一帧
    const aA = Math.min(1, 1 - sw + back), aB = sw * (1 - back);
    let cur = -1;
    if (aA > 0.001) {
      const A = { x: 30, y: 48, w: CW - 60, h: 112 };
      k.save(); k.globalAlpha = aA;
      sbPanel(k, A, 0, P(U, 0.2, 0.5) * (1 - sw) * aA, (kk, pw, ph) => oaBad(kk, pw, ph, U), '');
      const bad = P(U, OA_BAD[0], OA_BAD[0] + 0.3) * (1 - sw), msg = P(U, 2.5, 2.8) * (1 - sw);
      if (bad > 0) { k.globalAlpha = aA * bad; k.strokeStyle = OA_RED; k.lineWidth = 2.4; rr(k, A.x, A.y, A.w, A.h, 6); k.stroke(); }
      if (msg > 0) { k.globalAlpha = aA * msg; txt(k, '✕ 一个镜头塞了 3 个动作', A.x + A.w / 2, A.y + A.h + 16, `700 12px ${JP}`, OA_RED, 'center', 'middle'); }
      k.restore();
    }
    if (aB > 0.001) {
      const R = sbRow(3, { h: 100 });
      k.save(); k.globalAlpha = aB;
      R.forEach((r, i) => {
        const st = sbState(U, OA_TS, i), q = st === 1 ? clamp((U - OA_TS[i]) / OA_DUR) : 1;
        if (st === 1) cur = i;
        sbPanel(k, r, st, sbOn(U, OA_TS, i) * aB, (kk, pw, ph) => oaGood(kk, pw, ph, i, q, U), String(i + 1));
        sbLabel(k, r, OA_LABEL[i], st);
      });
      k.globalAlpha = aB * P(U, OA_SWAP[1], OA_SWAP[1] + 0.3);
      txt(k, '✓ 拆成 3 个镜头，每格 1 个动作', CW / 2, R[0].y + R[0].h + 34, `700 12px ${JP}`, C.blue, 'center', 'middle');
      k.restore();
    }
    return cur >= 0 ? `${cur + 1}/3 ${OA_LABEL[cur]}` : (U < OA_SWAP[0] || back > 0.5) ? '一镜多动作' : '一镜一动作';
  });

  // @element 42
  // 42 前 3 秒钩子：第一格就是最终结果（做好的蛋糕特写，蜡烛在跳），再接人物反应、最后才给建立镜头交代在哪。
  // 下方时间轴把 0–3 秒涂成蓝色标「前 3 秒 · 钩子」，播放头走过时第一格正好占满这一段。
  // 三格里的蛋糕是同一个物体（同一张桌子、同一位置），只是机位不同。
  const HK_TS = [0.3, 3.3, 5.8], HK_END = 8.5;   // 第 1 格正好 3 秒
  const HK_LABEL = ['结果特写', '人物反应', '建立镜头'];
  const HK_TABLE = { x: 0.7, z: 8, h: 0.75 };      // 桌子位置；蛋糕放在桌面中间
  // 蛋糕：两层奶油蛋糕 + 草莓 + 一根蜡烛（局部米制，原点在桌面，y 向上）；fl = 火苗晃动
  function hkCake(k, fl) {
    k.fillStyle = '#F6E7D2'; rr(k, -0.15, 0, 0.3, 0.11, 0.02); k.fill();
    k.fillStyle = '#FBF3E6'; rr(k, -0.11, 0.11, 0.22, 0.09, 0.02); k.fill();
    k.fillStyle = '#E8A0A8';   // 两层之间、顶上的粉色奶油边
    [[0.11, 0.15], [0.2, 0.11]].forEach(([y, r]) => { for (let j = -3; j <= 3; j++) { k.beginPath(); k.arc(j * r / 3.3, y, 0.017, 0, TAU); k.fill(); } });
    k.fillStyle = '#E5484D';
    [-0.07, 0, 0.07].forEach(x => { k.beginPath(); k.ellipse(x, 0.215, 0.017, 0.02, 0, 0, TAU); k.fill(); });
    k.fillStyle = C.blueM; k.fillRect(-0.006, 0.2, 0.012, 0.08);   // 蜡烛
    k.save(); k.translate(0, 0.3); k.scale(1 + fl * 0.15, 1 - fl * 0.1);
    k.fillStyle = '#FFC24A'; k.beginPath(); k.ellipse(0, 0, 0.012, 0.022, 0, 0, TAU); k.fill();
    k.fillStyle = '#FFF4D6'; k.beginPath(); k.ellipse(0, -0.004, 0.005, 0.01, 0, 0, TAU); k.fill();
    k.restore();
  }
  function hkTable(k, fl) {
    k.fillStyle = C.g3; k.fillRect(-0.5, HK_TABLE.h - 0.04, 1.0, 0.04); k.fillRect(-0.45, 0, 0.04, HK_TABLE.h); k.fillRect(0.41, 0, 0.04, HK_TABLE.h);
    k.save(); k.translate(0, HK_TABLE.h); hkCake(k, fl); k.restore();
  }
  function hkShot(k, w, h, i, q, U) {
    const fl = Math.sin(U * 23) * 0.5 + Math.sin(U * 37) * 0.5;   // 火苗：两个频率叠加，看起来不规则
    const extra = [[HK_TABLE.x, 0, HK_TABLE.z, kk => hkTable(kk, fl), true]];   // fg = true：蛋糕不跟后景一起虚化
    const opt = { trees: false, mountains: false, extra };
    // 1 结果特写：蛋糕撑满画面，极慢推近；后景虚化
    if (i === 0) return world(k, w, h, sbCam(h, 0.7 + q * 0.03, 1.1 - q * 0.03, 1.2, HK_TABLE.x), { ...opt, blurBg: 3, buildings: false, grid: false, sky: '#F3EDE4' });
    // 2 人物反应：人物脸的近景，张嘴「哇」，眨一次眼
    if (i === 1) {
      world(k, w, h, sbCam(h, 1.2, 1.95, 2.2, -0.5), { ...opt, person: { x: -0.5, z: 8.3 }, extra: [[-0.5, 0, 8.29, kk => face(kk, 0, { gaze: 0.05, talk: 0.4 + 0.5 * P(q, 0.1, 0.3), blink: q > 0.6 && q < 0.68 ? 1 : 0 })]] });
      const a = P(q, 0.15, 0.3);
      if (a > 0) { k.save(); k.globalAlpha *= a; k.fillStyle = '#FFFFFF'; rr(k, w * 0.6, h * 0.2, 44, 22, 8); k.fill(); txt(k, '哇！', w * 0.6 + 22, h * 0.2 + 11.5, `700 12px ${JP}`, C.ink, 'center', 'middle'); k.restore(); }
      return;
    }
    // 3 建立镜头：拉到全景，人物站在桌边，观众这时才知道这是在哪
    world(k, w, h, sbCam(h, -0.2, 2.4, 6, 0.1), { ...opt, person: { x: -0.5, z: 8.3, armUp: q > 0.4 } });
  }
  CELLS[41] = shot((k, w, h, uu, cyc) => {
    const U = sbU(uu, cyc), R = sbRow(3, { h: 100 }), fade = sbFade(U);
    const ts = [...HK_TS, HK_END];
    let cur = -1;
    R.forEach((r, i) => {
      const st = sbState(U, HK_TS, i), q = st === 1 ? clamp((U - ts[i]) / (ts[i + 1] - ts[i])) : 1;
      if (st === 1) cur = i;
      sbPanel(k, r, st, sbOn(U, HK_TS, i), (kk, pw, ph) => hkShot(kk, pw, ph, i, q, U), String(i + 1));
      sbLabel(k, r, HK_LABEL[i], st);
    });
    // 时间轴：0–3 秒蓝色段 + 刻度 0 / 3 s；播放头按真实秒数走
    const x0 = R[0].x, x1 = R[2].x + R[2].w, y = R[0].y + R[0].h + 32, sx = t => lerp(x0, x1, (t - HK_TS[0]) / (HK_END - HK_TS[0]));
    k.save(); k.globalAlpha = P(U, 0.2, 0.5) * fade;
    // 条高 12，「前 3 秒 · 钩子」写在蓝色段里面；写在条上方会和格子下面的标签挤在一起
    k.fillStyle = C.g2; rr(k, x0, y - 6, x1 - x0, 12, 4); k.fill();
    k.fillStyle = C.blue; rr(k, x0, y - 6, sx(HK_TS[1]) - x0, 12, 4); k.fill();
    txt(k, '前 3 秒 · 钩子', (x0 + sx(HK_TS[1])) / 2, y + 0.5, `700 9px ${JP}`, '#FFFFFF', 'center', 'middle');
    txt(k, '0', x0, y + 15, `600 9px ${MONO}`, C.sub, 'center', 'middle');
    txt(k, '3s', sx(HK_TS[1]), y + 15, `600 9px ${MONO}`, C.sub, 'center', 'middle');
    if (U >= HK_TS[0] && U < SB_END + 0.3) { const px = sx(clamp(U, HK_TS[0], HK_END)); k.fillStyle = C.ink; k.fillRect(px - 1, y - 9, 2, 18); }
    k.restore();
    return cur >= 0 ? `${cur + 1}/3 ${HK_LABEL[cur]}` : '前 3 秒钩子';
  });

  // @element 43
  // 43 产品三段式：同一只保温杯在三格里都是画面焦点 ——
  //   ① 全貌：杯子立在转台上缓慢环绕（高光和杯身标志左右移动表现转动）；
  //   ② 卖点：黑底侧光大特写，光从左扫到右，杯盖的防滑纹一条条亮起，标「防滑纹」；
  //   ③ 场景：户外，手拿着杯子轻轻晃，杯子仍在画面中心。
  const PD_TS = [0.3, 3.1, 5.9], PD_DUR = 2.8;
  const PD_LABEL = ['全貌 · 环绕', '卖点 · 侧光特写', '场景 · 拿着用'];
  const PD_BODY = C.blue, PD_CAP = '#2A2A30', PD_SKIN = '#F2C9A8';
  // 杯子（px，底边中心 cx, by，高 H）；rot = 环绕角度（只影响高光和标志的位置）
  function pdBottle(k, cx, by, H, rot) {
    const W = H * 0.34, capH = H * 0.2, bodyH = H - capH;
    const g = k.createLinearGradient(cx - W / 2, 0, cx + W / 2, 0);
    g.addColorStop(0, '#1F4FB8'); g.addColorStop(0.5, PD_BODY); g.addColorStop(1, '#1F4FB8');
    k.fillStyle = g; rr(k, cx - W / 2, by - bodyH, W, bodyH, W * 0.22); k.fill();
    k.fillStyle = PD_CAP; rr(k, cx - W * 0.44, by - H, W * 0.88, capH + 2, W * 0.12); k.fill();
    k.save(); rr(k, cx - W / 2, by - bodyH, W, bodyH, W * 0.22); k.clip();
    const hx = cx + Math.sin(rot) * W * 0.36;   // 高光条随转动左右移
    k.fillStyle = 'rgba(255,255,255,.35)'; k.fillRect(hx - W * 0.07, by - bodyH + 4, W * 0.14, bodyH - 8);
    const c = Math.cos(rot + 1.2);
    if (c > 0) {   // 杯身白色标志：转到正面时变宽、侧面时变窄，转到背面时看不见
      const lx = cx + Math.sin(rot + 1.2) * W * 0.4;
      k.fillStyle = `rgba(255,255,255,${0.9 * c})`; k.beginPath(); k.ellipse(lx, by - bodyH * 0.5, W * 0.14 * c, W * 0.14, 0, 0, TAU); k.fill();
    }
    k.restore();
  }
  function pdShot(k, w, h, i, q) {
    if (i === 0) {
      k.fillStyle = '#F7F7F5'; k.fillRect(0, 0, w, h);
      k.fillStyle = C.g2; k.beginPath(); k.ellipse(w / 2, h * 0.86, w * 0.3, 9, 0, 0, TAU); k.fill();
      return pdBottle(k, w / 2, h * 0.86, h * 0.72, q * TAU);   // 一格转一整圈
    }
    if (i === 1) {
      k.fillStyle = '#16161A'; k.fillRect(0, 0, w, h);
      const lx = lerp(-0.1, 1.1, eIO(q)) * w, top = h * 0.12, bot = h * 0.88, x0 = w * 0.12, x1 = w * 0.88;
      k.fillStyle = PD_CAP; rr(k, x0, top, x1 - x0, bot - top, 8); k.fill();
      // 防滑纹：竖条，离光越近越亮
      for (let x = x0 + 6; x < x1 - 4; x += 7) {
        const b = Math.max(0, 1 - Math.abs(x - lx) / (w * 0.35));
        k.fillStyle = `rgba(${Math.round(70 + 170 * b)},${Math.round(72 + 168 * b)},${Math.round(80 + 165 * b)},1)`;
        k.fillRect(x, top + 6, 2.6, bot - top - 12);
      }
      const a = P(q, 0.45, 0.6);
      if (a > 0) { k.save(); k.globalAlpha *= a; k.fillStyle = '#FFFFFF'; rr(k, w - 62, 8, 52, 18, 5); k.fill(); txt(k, '防滑纹', w - 36, 17.5, `700 11px ${JP}`, C.ink, 'center', 'middle'); k.restore(); }
      return;
    }
    const g = k.createLinearGradient(0, 0, 0, h); g.addColorStop(0, C.blueBg); g.addColorStop(1, C.blueXL);
    k.fillStyle = g; k.fillRect(0, 0, w, h);
    k.fillStyle = '#CFE3C4'; k.beginPath(); k.moveTo(0, h * 0.72); k.quadraticCurveTo(w * 0.5, h * 0.55, w, h * 0.7); k.lineTo(w, h); k.lineTo(0, h); k.fill();
    const sway = Math.sin(q * TAU) * 0.08;   // 一格晃一个来回
    k.save(); k.translate(w * 0.5, h * 0.62); k.rotate(sway);
    k.fillStyle = C.blueM; k.beginPath(); k.moveTo(10, 8); k.lineTo(w * 0.5, h * 0.42); k.lineTo(w * 0.5, h * 0.62); k.lineTo(-2, 22); k.fill();   // 袖子从右下伸进来
    pdBottle(k, 0, 26, h * 0.6, 0.6);
    k.fillStyle = PD_SKIN; rr(k, -14, 2, 30, 18, 8); k.fill();   // 握住杯身的手
    k.restore();
  }
  CELLS[42] = shot((k, w, h, uu, cyc) => {
    const U = sbU(uu, cyc), R = sbRow(3, { h: 112 });
    let cur = -1;
    R.forEach((r, i) => {
      const st = sbState(U, PD_TS, i), q = st === 1 ? clamp((U - PD_TS[i]) / PD_DUR) : 1;
      if (st === 1) cur = i;
      sbPanel(k, r, st, sbOn(U, PD_TS, i), (kk, pw, ph) => pdShot(kk, pw, ph, i, q), String(i + 1));
      sbLabel(k, r, PD_LABEL[i], st);
    });
    return cur >= 0 ? `${cur + 1}/3 ${PD_LABEL[cur]}` : '产品三段式';
  });

  // @element 44
  // 44 分镜脚本：左边一张表逐行写出 5 个镜头（编号 / 时长 / 景别与运镜 / 画面 / 声音），当前行高亮；
  // 右边小画面同步播放这一行写的镜头。相邻镜头景别拉开（全景 → 中景 → 特写 → 中近景 → 远景），剪在一起不跳。
  const SS_ROWS = [   // [时长秒, 景别与运镜, 画面, 声音]，时长相加 8 秒，从 0.4 秒开始，8.4 秒播完
    [2.0, '全景 · 固定', '清晨街口，她走进来', '环境声'],
    [1.5, '中景 · 推镜', '停在咖啡店门口', '脚步声'],
    [1.5, '特写 · 固定', '抬眼看招牌', '风铃'],
    [1.5, '中近景 · 固定', '推门，笑着说早', '「早！」'],
    [1.5, '远景 · 拉镜', '店里暖光，她坐下', '音乐起']
  ];
  const SS_TS = SS_ROWS.reduce((a, r) => (a.push(a[a.length - 1] + r[0]), a), [0.4]).slice(0, -1);   // 各行开始时刻
  const SS_COLS = [['#', 18], ['时长', 30], ['景别与运镜', 74], ['画面', 112], ['声音', 50]];          // 列名与列宽（px）
  const SS_TAB = { x: 28, y: 44, head: 18, row: 22 };
  const SS_VIEW = { x: 352, y: 50, w: 160, h: 100 };   // 右侧小画面
  const SS_SHOP = [[1.6, 0, 9.5, (k, s) => building(k, s, 2.6, 3.2, C.blueXL)]];   // 咖啡店：人物右后方的一栋浅蓝小楼
  // ssCam：小画面里的机位；lo〜hi 正好占满小画面高，d = 离人物的距离
  const ssCam = (lo, hi, d, cx = 0) => cam({ x: cx, y: (lo + hi) / 2, z: 8 - d, f: SS_VIEW.h * d / (hi - lo) });
  // 第 i 个镜头在镜头内时间 t（0..时长）的画面
  function ssShot(k, w, h, i, t) {
    const p = clamp(t / SS_ROWS[i][0]);
    if (i === 0) return world(k, w, h, cam({ y: 1.4, z: -2, f: F0 * h / CH }), { person: { x: lerp(-3, 0.2, eOut(p)), z: 8, walk: t * 8 }, extra: SS_SHOP, trees: false });
    if (i === 1) { const d = lerp(4.6, 3.2, eIO(p)); return world(k, w, h, ssCam(0.6, 1.95, d), { person: { x: 0.2, z: 8 }, extra: SS_SHOP, trees: false, blurBg: 0 }); }
    if (i === 2) return world(k, w, h, ssCam(1.42, 1.86, 2.6, 0.2), { person: { x: 0.2, z: 8, fg: true }, extra: [[0.2, 0, 7.99, (kk, s) => face(kk, s, { gaze: 0.035 * eOut(P(t, 0.2, 0.6)), blink: clamp(1 - Math.abs(t - 0.9) / 0.08) }), true]], trees: false });
    if (i === 3) return world(k, w, h, ssCam(1.2, 1.9, 2.2, 0.2), { person: { x: 0.2, z: 8, fg: true }, extra: [[0.2, 0, 7.99, (kk, s) => face(kk, s, { talk: mouth(t, 0.3, 1.1) }), true]], trees: false });
    const z = lerp(-4, -11, eIO(p));   // 拉镜：机位后退，画面里慢慢露出整条街
    return world(k, w, h, cam({ y: 2.2, z, f: F0 * h / CH }), { person: { x: 1.2, z: 8 }, extra: SS_SHOP, sky: '#FFF7EC', sunCol: '#FFD9A8' });
  }
  function ssFrame(k, U) {
    const cur = SS_TS.reduce((a, t, i) => (U >= t ? i : a), -1);
    // 表格：表头一直在；行到开始时刻才写出来（从左往右展开），当前行蓝底
    const T = SS_TAB, tw0 = SS_COLS.reduce((s, c) => s + c[1], 0);
    k.save();
    k.fillStyle = '#FFFFFF'; rr(k, T.x - 4, T.y - 4, tw0 + 8, T.head + T.row * SS_ROWS.length + 8, 6); k.fill();
    k.strokeStyle = C.border; k.lineWidth = 1.2; k.stroke();
    let x = T.x;
    SS_COLS.forEach(([name, cw]) => { txt(k, name, x + 4, T.y + T.head / 2, `600 10px ${JP}`, C.sub, 'left', 'middle'); x += cw; });
    k.strokeStyle = C.g2; k.beginPath(); k.moveTo(T.x, T.y + T.head); k.lineTo(T.x + tw0, T.y + T.head); k.stroke();
    SS_ROWS.forEach((row, i) => {
      const y = T.y + T.head + i * T.row, show = P(U, SS_TS[i], SS_TS[i] + 0.35);
      if (show <= 0) return;
      if (i === cur) { k.fillStyle = C.blueBg; k.fillRect(T.x, y + 1, tw0, T.row - 2); k.fillStyle = C.blue; k.fillRect(T.x, y + 1, 3, T.row - 2); }
      k.save(); k.beginPath(); k.rect(T.x, y, tw0 * eOut(show), T.row); k.clip();
      const cells = [String(i + 1), row[0].toFixed(1) + 's', row[1], row[2], row[3]], col = i === cur ? C.blue : C.ink;
      let cx = T.x;
      cells.forEach((s, j) => { txt(k, s, cx + 4, y + T.row / 2, `${j === 2 || i === cur ? 600 : 400} 10.5px ${j < 2 ? MONO : JP}`, j === 0 && i !== cur ? C.sub : col, 'left', 'middle'); cx += SS_COLS[j][1]; });
      k.restore();
      if (i < SS_ROWS.length - 1) { k.strokeStyle = C.g1; k.beginPath(); k.moveTo(T.x, y + T.row); k.lineTo(T.x + tw0, y + T.row); k.stroke(); }
    });
    // 右侧小画面：播放当前行的镜头；第 1 行开始前是空白画面
    const V = SS_VIEW;
    k.fillStyle = C.g1; rr(k, V.x, V.y, V.w, V.h, 6); k.fill();
    if (cur >= 0) {
      k.save(); rr(k, V.x, V.y, V.w, V.h, 6); k.clip(); k.translate(V.x, V.y);
      ssShot(k, V.w, V.h, cur, U - SS_TS[cur]);
      k.restore();
      const p = clamp((U - SS_TS[cur]) / SS_ROWS[cur][0]);
      k.fillStyle = C.g2; k.fillRect(V.x, V.y + V.h + 8, V.w, 3); k.fillStyle = C.blue; k.fillRect(V.x, V.y + V.h + 8, V.w * p, 3);
      txt(k, `镜头 ${cur + 1} · ${SS_ROWS[cur][1]}`, V.x, V.y + V.h + 22, `600 11px ${JP}`, C.blue, 'left', 'middle');
    }
    k.strokeStyle = cur >= 0 ? C.blue : C.border; k.lineWidth = cur >= 0 ? 2.2 : 1.2; rr(k, V.x, V.y, V.w, V.h, 6); k.stroke();
    k.restore();
    return cur < 0 ? '分镜脚本' : `镜头 ${cur + 1}/${SS_ROWS.length}`;
  }
  CELLS[43] = shot((k, w, h, uu, cyc) => {
    const U = sbU(uu, cyc), r = 1 - sbFade(U);
    let hud = '分镜脚本';
    blend(k, kk => { hud = ssFrame(kk, U); }, kk => ssFrame(kk, 0), r);
    return r > 0.5 ? '分镜脚本' : hud;
  });

  // @element 45
  // 45 开箱：5 格 —— 包装顶拍 → 手部打开 → 取出停顿 → 细节横移 → 上手。
  // 第 3 格「取出」后停 1 拍（揭晓），格下多一个「揭晓 · 停」标；格子下方的折线标出景别远近：一路变近，最后拉开。
  // 产品沿用 43 格的保温杯（pdBottle），开箱的是同一只杯子。
  const UB_TS = [0.3, 1.9, 3.5, 5.3, 6.9], UB_END = 8.5;
  const UB_LABEL = ['包装 · 顶拍', '手部打开', '取出 · 停', '细节横移', '上手'];
  const UB_NEAR = [0.15, 0.55, 0.7, 1.0, 0.4];   // 每格景别有多近（0 远〜1 近），画折线用
  const UB_REVEAL = 0.45;                        // 第 3 格里取出动作只用前 45%，之后停住
  const UB_BOX = '#D9C3A5', UB_BOX_D = '#B89C78';
  function ubShot(k, w, h, i, q) {
    k.fillStyle = i === 3 ? '#16161A' : '#F4EFE8'; k.fillRect(0, 0, w, h);   // 细节格用黑底，跟 43 格卖点同一种打光
    const cx = w / 2, cy = h / 2;
    if (i === 0) {   // 顶拍：盒盖正面，缎带十字，镜头极慢下降（盒子微微变大）
      const s = 1 + q * 0.06, bw = w * 0.5 * s, bh = h * 0.62 * s;
      k.fillStyle = UB_BOX; rr(k, cx - bw / 2, cy - bh / 2, bw, bh, 4); k.fill();
      k.fillStyle = C.blue; k.fillRect(cx - 3, cy - bh / 2, 6, bh); k.fillRect(cx - bw / 2, cy - 3, bw, 6);
      return;
    }
    if (i === 1) {   // 手部打开：盒盖从下往上掀开，两只手扶在盒盖两侧
      const lift = eIO(q), bw = w * 0.64, top = h * 0.42;
      k.fillStyle = UB_BOX_D; rr(k, cx - bw / 2, top, bw, h * 0.5, 4); k.fill();
      k.fillStyle = '#FFFFFF'; k.fillRect(cx - bw / 2 + 6, top + 4, bw - 12, 10);   // 内衬
      const ly = top - lift * h * 0.34;
      k.fillStyle = UB_BOX; rr(k, cx - bw / 2 - 3, ly - 10, bw + 6, 14, 3); k.fill();
      k.fillStyle = PD_SKIN; [cx - bw / 2 - 6, cx + bw / 2 - 12].forEach(x => { rr(k, x, ly - 14, 18, 22, 8); k.fill(); });
      return;
    }
    if (i === 2) {   // 取出：杯子从盒子里升起，到位后停住；身后一圈淡光表示「揭晓」
      const p = eOut(clamp(q / UB_REVEAL)), by = lerp(h * 1.25, h * 0.86, p);
      if (q > UB_REVEAL) { const a = Math.min(1, (q - UB_REVEAL) * 4); k.fillStyle = `rgba(255,236,179,${0.7 * a})`; k.beginPath(); k.arc(cx, h * 0.5, h * 0.42, 0, TAU); k.fill(); }
      pdBottle(k, cx, by, h * 0.7, 0.9);
      k.fillStyle = UB_BOX_D; k.fillRect(cx - w * 0.36, h * 0.86, w * 0.72, h * 0.14);
      return;
    }
    if (i === 3) {   // 细节横移：杯盖防滑纹贴近画面，从右往左平移
      const off = lerp(18, -18, eIOs(q)), top = h * 0.14, bot = h * 0.86;
      k.fillStyle = PD_CAP; rr(k, off - 10, top, w + 20, bot - top, 6); k.fill();
      for (let x = off - 6; x < w + 14; x += 7) { k.fillStyle = 'rgba(200,200,210,.75)'; k.fillRect(x, top + 6, 2.6, bot - top - 12); }
      return;
    }
    // 上手：拉开到中景，人拿起杯子在胸前转一下
    world(k, w, h, sbCam(h, 0.6, 2.0, 2.8), { trees: false, mountains: false, person: { x: 0, z: 8 },
      extra: [[0.18, 1.08, 7.9, kk => { kk.save(); kk.scale(1, -1); pdBottle(kk, 0, 0, 0.32, q * TAU); kk.restore(); }, true]] });
  }
  CELLS[44] = shot((k, w, h, uu, cyc) => {
    const U = sbU(uu, cyc), R = sbRow(5, { h: 86, gap: 10 }), fade = sbFade(U), ts = [...UB_TS, UB_END];
    let cur = -1;
    R.forEach((r, i) => {
      const st = sbState(U, UB_TS, i), q = st === 1 ? clamp((U - ts[i]) / (ts[i + 1] - ts[i])) : 1;
      if (st === 1) cur = i;
      sbPanel(k, r, st, sbOn(U, UB_TS, i), (kk, pw, ph) => ubShot(kk, pw, ph, i, q), String(i + 1));
      sbLabel(k, r, UB_LABEL[i], st);
    });
    // 景别折线：点越高 = 越近；已播到的点变蓝，线也画到当前格
    const yb = R[0].y + R[0].h + 46, hh = 20, lx = R[0].x + R[0].w / 2 - 22;   // 「近 / 远」放在第 1 个点左边，避开取景器左下角标
    k.save(); k.globalAlpha = P(U, 0.2, 0.5) * fade;
    txt(k, '近', lx, yb - hh, `600 9px ${JP}`, C.sub, 'center', 'middle');
    txt(k, '远', lx, yb, `600 9px ${JP}`, C.sub, 'center', 'middle');
    const pts = R.map((r, i) => [r.x + r.w / 2, yb - UB_NEAR[i] * hh]);
    k.strokeStyle = C.g3; k.lineWidth = 1.4; k.beginPath(); pts.forEach(([x, y], i) => i ? k.lineTo(x, y) : k.moveTo(x, y)); k.stroke();
    const n = cur >= 0 ? cur : (U >= UB_END && U < SB_END + 0.3 ? 4 : -1);
    if (n > 0) { k.strokeStyle = C.blue; k.lineWidth = 2; k.beginPath(); pts.slice(0, n + 1).forEach(([x, y], i) => i ? k.lineTo(x, y) : k.moveTo(x, y)); k.stroke(); }
    pts.forEach(([x, y], i) => { k.fillStyle = i <= n ? C.blue : C.g3; k.beginPath(); k.arc(x, y, 3.2, 0, TAU); k.fill(); });
    k.restore();
    return cur >= 0 ? `${cur + 1}/5 ${UB_LABEL[cur]}` : '开箱';
  });

  // @element 46
  // 46 口播穿插画面：两条轨道 —— 下面「口播」主轨从头到尾不断，声波一直在跳；上面「B-roll」轨在三处插入画面。
  // 左边是成片画面：没有插入时是人物中近景口播，插入时换成 B-roll，但字幕和声音照常走；字幕里的关键词高亮。
  const VO_T0 = 0.3, VO_T1 = 8.6;
  const VO_BROLL = [[1.5, 3.0, '手部特写'], [4.0, 5.5, '桌面俯拍'], [6.5, 7.8, '环境空镜']];
  const VO_SUBS = [[0.3, 3.0, '这只杯子', '保温 12 小时'], [3.0, 5.8, '杯盖做了', '防滑纹'], [5.8, 8.6, '出门', '一只手就能拿']];   // [开始, 结束, 普通字, 关键词]
  const VO_VIEW = { x: 30, y: 48, w: 200, h: 112 };
  const VO_TL = { x0: 290, x1: 509, yB: 66, yM: 104, th: 26 };
  const voB = U => VO_BROLL.findIndex(([a, b]) => U >= a && U < b);
  function voView(k, w, h, U, bi, q) {
    if (bi < 0) {   // 口播：中近景，嘴在动
      const talk = U > VO_T0 && U < VO_T1 ? 0.25 + 0.35 * Math.max(0, Math.sin(U * 19)) : 0;
      return world(k, w, h, sbCam(h, 1.05, 1.95, 2.6, 0.25), { trees: false, mountains: false, person: { x: 0, z: 8 }, extra: [[0, 0, 7.99, kk => face(kk, 0, { gaze: 0, talk })]] });
    }
    if (bi === 0) { k.fillStyle = '#F4EFE8'; k.fillRect(0, 0, w, h); return pdShot(k, w, h, 2, q); }   // 手拿杯子
    if (bi === 1) {   // 桌面俯拍：木桌上杯子、笔记本、一支笔，镜头慢慢转
      k.fillStyle = '#E6D3B8'; k.fillRect(0, 0, w, h);
      k.save(); k.translate(w / 2, h / 2); k.rotate(-0.1 + q * 0.12);
      k.fillStyle = '#FFFFFF'; rr(k, -70, -30, 56, 64, 3); k.fill();
      k.strokeStyle = C.g3; k.lineWidth = 1; for (let y = -18; y < 28; y += 9) { k.beginPath(); k.moveTo(-62, y); k.lineTo(-22, y); k.stroke(); }
      k.fillStyle = C.ink; k.save(); k.rotate(0.5); k.fillRect(-10, -36, 4, 50); k.restore();
      k.fillStyle = PD_CAP; k.beginPath(); k.arc(36, 0, 22, 0, TAU); k.fill();
      k.fillStyle = PD_BODY; k.beginPath(); k.arc(36, 0, 16, 0, TAU); k.fill();
      k.restore(); return;
    }
    // 环境空镜：远处城市和山，云慢慢飘
    world(k, w, h, cam({ y: 1.6, z: -6 + q * 1.5 }), { clouds: [[-8 + q * 3, 10, 60, 2], [9 + q * 3, 12, 70, 2.6]], trees: true });
  }
  function voWave(k, x0, x1, y, U) {
    k.strokeStyle = 'rgba(255,255,255,.85)'; k.lineWidth = 1.4; k.beginPath();
    for (let x = x0 + 3; x < x1 - 3; x += 3) {
      const t = (x - x0) * 0.21 - U * 9, a = 0.35 + 0.65 * Math.abs(Math.sin(t) * Math.sin(t * 0.37 + 1.3));
      k.moveTo(x, y - a * 8); k.lineTo(x, y + a * 8);
    }
    k.stroke();
  }
  CELLS[45] = shot((k, w, h, uu, cyc) => {
    const U = sbU(uu, cyc), fade = sbFade(U), on = P(U, 0.2, 0.5) * fade, bi = U < SB_END ? voB(U) : -1;
    const q = bi >= 0 ? clamp((U - VO_BROLL[bi][0]) / (VO_BROLL[bi][1] - VO_BROLL[bi][0])) : 0;
    const V = VO_VIEW;
    sbPanel(k, V, bi >= 0 ? 1 : 0, on, (kk, pw, ph) => {
      voView(kk, pw, ph, U, bi, q);
      const s = VO_SUBS.find(([a, b]) => U >= a && U < b);
      if (!s) return;
      // 字幕：底部黑条，关键词黄色
      const f = `700 11px ${JP}`, w1 = tw(kk, s[2], f), w2 = tw(kk, s[3], f), sx = pw / 2 - (w1 + w2 + 4) / 2, sy = ph - 14;
      kk.fillStyle = 'rgba(0,0,0,.62)'; rr(kk, sx - 8, sy - 10, w1 + w2 + 20, 20, 4); kk.fill();
      txt(kk, s[2], sx, sy + 0.5, f, '#FFFFFF', 'left', 'middle');
      kk.fillStyle = '#FFD84A'; rr(kk, sx + w1 + 2, sy - 8, w2 + 4, 16, 3); kk.fill();
      txt(kk, s[3], sx + w1 + 4, sy + 0.5, f, C.ink, 'left', 'middle');
    }, '');
    txt(k, bi >= 0 ? `B-roll · ${VO_BROLL[bi][2]}` : '口播', V.x + V.w / 2, V.y + V.h + 14, `600 12px ${JP}`, bi >= 0 ? C.blue : C.ink, 'center', 'middle');
    // 时间线：两条轨道
    const T = VO_TL, sx = t => lerp(T.x0, T.x1, (t - VO_T0) / (VO_T1 - VO_T0));
    k.save(); k.globalAlpha = on;
    txt(k, 'B-roll', T.x0 - 8, T.yB + T.th / 2, `600 10px ${EN}`, C.sub, 'right', 'middle');
    txt(k, '口播', T.x0 - 8, T.yM + T.th / 2, `600 10px ${JP}`, C.sub, 'right', 'middle');
    k.fillStyle = C.g1; rr(k, T.x0, T.yB, T.x1 - T.x0, T.th, 4); k.fill();
    VO_BROLL.forEach(([a, b, name], i) => {
      k.fillStyle = i === bi ? C.blue : C.blueL; rr(k, sx(a), T.yB + 2, sx(b) - sx(a), T.th - 4, 3); k.fill();
      txt(k, name, (sx(a) + sx(b)) / 2, T.yB + T.th / 2 + 0.5, `600 9px ${JP}`, i === bi ? '#FFFFFF' : C.blue, 'center', 'middle');
    });
    k.fillStyle = C.ink; rr(k, T.x0, T.yM, T.x1 - T.x0, T.th, 4); k.fill();
    voWave(k, T.x0, T.x1, T.yM + T.th / 2, U);
    txt(k, '声音不断', (T.x0 + T.x1) / 2, T.yM + T.th + 14, `600 10px ${JP}`, C.sub, 'center', 'middle');
    if (U >= VO_T0 && U < SB_END + 0.3) { const px = sx(clamp(U, VO_T0, VO_T1)); k.fillStyle = '#E5484D'; k.fillRect(px - 1, T.yB - 6, 2, T.yM + T.th - T.yB + 12); }
    k.restore();
    return bi >= 0 ? `插入 ${bi + 1}/3` : '口播穿插画面';
  });

  // @element 47
  // 47 15 秒广告脚本：4 段按 3 : 7 : 3 : 2 秒分配，格子宽度也按这个比例 —— 一眼看出卖点段最长、结尾最短。
  // 钩子（杯子从高处掉下弹起，「摔不坏？」）→ 两个卖点（防滑纹 / 保温 12 小时）→ 使用（手拿着出门）→ 产品 + 口号（干净底色 + 口号条）。
  // 15 秒压到 0.3–8.55 s 播放（每秒 0.55 s），沿用 43 格的保温杯。
  const AD_SEC = [3, 7, 3, 2], AD_K = 0.55, AD_T0 = 0.3;
  const AD_TS = AD_SEC.reduce((a, s, i) => (a.push(i ? a[i - 1] + AD_SEC[i - 1] * AD_K : AD_T0), a), []);
  const AD_LABEL = ['钩子', '卖点 × 2', '使用', '产品 + 口号'];
  const AD_SLOGAN = '热水随身带';
  function adShot(k, w, h, i, q) {
    if (i === 0) {   // 钩子：杯子从画面上方掉下，落地弹两下，问号字卡
      k.fillStyle = '#FFF6E5'; k.fillRect(0, 0, w, h);
      const t = q * 1.6, y = t < 0.5 ? (t / 0.5) ** 2 : t < 0.9 ? 1 - 0.18 * Math.sin((t - 0.5) / 0.4 * Math.PI) : 1 - 0.05 * Math.sin(Math.min(1, (t - 0.9) / 0.25) * Math.PI);
      k.fillStyle = C.g2; k.fillRect(0, h * 0.86, w, h * 0.14);
      pdBottle(k, w / 2, lerp(-h * 0.1, h * 0.86, y), h * 0.56, 0.5);
      if (q > 0.55) txt(k, '摔不坏？', w / 2, h * 0.16, `800 12px ${JP}`, '#E5484D', 'center', 'middle');
      return;
    }
    if (i === 1) {   // 两个卖点各占一半：左半段防滑纹侧光，右半段保温（热气 + 12h）
      if (q < 0.5) return pdShot(k, w, h, 1, q * 2);
      const p = (q - 0.5) * 2;
      k.fillStyle = '#16161A'; k.fillRect(0, 0, w, h);
      pdBottle(k, w * 0.32, h * 0.92, h * 0.78, 0.8);
      k.strokeStyle = 'rgba(255,255,255,.5)'; k.lineWidth = 2; k.lineCap = 'round';
      for (let j = 0; j < 3; j++) {   // 热气：三条波浪线往上飘
        const x = w * 0.26 + j * 9, y0 = h * 0.18 - ((p * 2 + j * 0.3) % 1) * 12;
        k.beginPath(); for (let s = 0; s <= 12; s++) { const yy = y0 - s * 1.6; k[s ? 'lineTo' : 'moveTo'](x + Math.sin(s * 0.8 + p * 9) * 2.5, yy); } k.stroke();
      }
      txt(k, `${Math.round(12 * eOut(clamp(p * 1.5)))}h`, w * 0.7, h * 0.48, `800 26px ${EN}`, '#FFFFFF', 'center', 'middle');
      txt(k, '保温', w * 0.7, h * 0.72, `700 11px ${JP}`, C.blueM, 'center', 'middle');
      return;
    }
    if (i === 2) return pdShot(k, w, h, 2, q);
    // 产品 + 口号：浅蓝干净底色，杯子居中，下方口号条
    k.fillStyle = C.blueBg; k.fillRect(0, 0, w, h);
    pdBottle(k, w / 2, h * 0.7, h * 0.56, 0.6 + q * 0.3);
    const a = P(q, 0.15, 0.4);
    k.save(); k.globalAlpha *= a; k.fillStyle = C.blue; k.fillRect(0, h * 0.76, w, h * 0.24);
    txt(k, AD_SLOGAN, w / 2, h * 0.88, `700 10px ${JP}`, '#FFFFFF', 'center', 'middle'); k.restore();
  }
  CELLS[46] = shot((k, w, h, uu, cyc) => {
    const U = sbU(uu, cyc), fade = sbFade(U), x0 = 30, x1 = CW - 30, gap = 10, y = 50, ph = 100;
    const unit = (x1 - x0 - gap * 3) / 15;
    let x = x0, cur = -1;
    const R = AD_SEC.map(s => { const r = { x, y, w: s * unit, h: ph }; x += s * unit + gap; return r; });
    R.forEach((r, i) => {
      const st = sbState(U, AD_TS, i), q = st === 1 ? clamp((U - AD_TS[i]) / (AD_SEC[i] * AD_K)) : 1;
      if (st === 1) cur = i;
      sbPanel(k, r, st, sbOn(U, AD_TS, i), (kk, pw, phh) => adShot(kk, pw, phh, i, q), String(i + 1));
      sbLabel(k, r, AD_LABEL[i], st);
      // 秒数：格下第二行，等宽字
      k.save(); k.globalAlpha = P(U, 0.2, 0.5) * fade;
      txt(k, `${AD_SEC[i]}s`, r.x + r.w / 2, r.y + r.h + 30, `700 11px ${MONO}`, st === 1 ? C.blue : C.sub, 'center', 'middle');
      k.restore();
    });
    // 已播秒数：按 15 秒刻度换算
    const sec = cur >= 0 ? Math.min(15, Math.floor((U - AD_T0) / AD_K)) : 0;
    return cur >= 0 ? `${String(sec).padStart(2, '0')} / 15s  ${AD_LABEL[cur]}` : '15 秒广告脚本';
  });

  // @end
  return { width: CW, height: CH, cycle: CYC * 2, cells: CELLS, fonts: [] };
});
