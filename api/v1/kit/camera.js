// Motion Prompt #3 001~024 · 049~056 · 064~067 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#025
// Also: MIT License (c) 2026 阿梦freedom · https://idea.ameng.dev/terms/extreme-long-shot (#3-049)
// Also: MIT License (c) 2026 阿梦freedom · https://idea.ameng.dev/terms/full-shot (#3-050)
// Also: MIT License (c) 2026 阿梦freedom · https://idea.ameng.dev/terms/medium-long-shot (#3-051)
// Also: MIT License (c) 2026 阿梦freedom · https://idea.ameng.dev/terms/medium-shot (#3-052)
// Also: MIT License (c) 2026 阿梦freedom · https://idea.ameng.dev/terms/medium-close-up (#3-053)
// Also: MIT License (c) 2026 阿梦freedom · https://idea.ameng.dev/terms/close-up (#3-054)
// Also: MIT License (c) 2026 阿梦freedom · https://idea.ameng.dev/terms/extreme-close-up (#3-055)
// Also: MIT License (c) 2026 阿梦freedom · https://idea.ameng.dev/terms/macro-shot (#3-056)
// Also: MIT License (c) 2026 阿梦freedom · https://idea.ameng.dev/terms/establishing-shot (#3-064)
// Also: MIT License (c) 2026 阿梦freedom · https://idea.ameng.dev/terms/shot-reverse-shot (#3-065)
// Also: MIT License (c) 2026 阿梦freedom · https://idea.ameng.dev/terms/match-on-action (#3-066)
// Also: MIT License (c) 2026 阿梦freedom · https://idea.ameng.dev/terms/180-degree-rule (#3-067)
//
// Kit for pack "camera" (Camera moves & transitions / カメラワークと切り替え): the constants and helpers its elements share.
// Elements #3 001~024 · 049~056 · 064~067 · 539x208 px · cycle 9.4 s. Element code: https://sadjjk.github.io/motion-prompt-zh/api/v1/zh-Hans/e/<id>.txt (or /en/, /ja/).
//
// Run one element standalone in a browser:
//   1. paste this file into a <script>,
//   2. paste the element code below it (it assigns CELLS[n - 1], n = the element number inside the pack),
//   3. then add:
//        const c = document.createElement('canvas'); c.width = 539; c.height = 208; document.body.append(c);
//        const k = c.getContext('2d'), cell = CELLS.find(Boolean), t0 = performance.now();
//        (function loop() {
//          const u = ((performance.now() - t0) / 1000) % 9.4;   // seconds, 0 <= u < 9.4
//          k.setTransform(1, 0, 0, 1, 0, 0); k.clearRect(0, 0, 539, 208);
//          k.save(); cell(k, 539, 208, u); k.restore();
//          requestAnimationFrame(loop);
//        })();
// Every cell is a pure function of u, so the same call renders video frames: u = frame / fps.

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

// @shared
// 跳躍の高さと、舞い落ちる葉（13・14・16 で使う）
function jumpY(q) { return q <= 0 || q >= 1 ? 0 : 4 * q * (1 - q) * 1.1; }
function leaves(u, speed) { const ex = []; for (let i = 0; i < 9; i++) { const ph = mod(u * speed / 4.7 + i / 9, 1); ex.push([-3 + i * 0.75 + Math.sin(i * 3) * 0.3, 3.4 - ph * 3.4, 6 + (i % 3), (kk) => { kk.fillStyle = i % 2 ? C.blueM : C.g3; kk.save(); kk.rotate(ph * 6 + i); kk.beginPath(); kk.ellipse(0, 0, 0.09, 0.045, 0, 0, 7); kk.fill(); kk.restore(); }]); } return ex; }

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
