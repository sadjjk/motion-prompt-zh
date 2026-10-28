/* Motion Prompt · pack "motion2" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt */
MotionPrompt.pack('motion2', function () {
  // @kit
  // モーショングラフィックスの演出の名前 第2弾 24（各カード 539x208・4.7秒周期。各コマは時間 u の純関数）
  // カードの中だけ共通パレット（濃紺の地＋青・コーラル・黄・ミント）。第1弾（motion）と同じ見た目。
  const CW = 539, CH = 208;
  const CYC = 4.7;                          // 各カードは4.7秒周期（ループの継ぎ目なし）
  const C = {
    navy: '#0F1A3D', navy2: '#1B2A5E', navy3: '#2A3D80', dim: '#7F90C4',
    blue: '#3B7BFF', coral: '#FF6B5C', yel: '#FFC83D', mint: '#2EDBA8', white: '#FFFFFF', cream: '#FFF1D6'
  };
  const PAL = [C.blue, C.coral, C.yel, C.mint];
  const JP = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Hiragino Sans", sans-serif';   // 画面文字为简体中文：中文字体优先，日文字体作后备
  const DISP = '"Avenir Next", "Helvetica Neue", system-ui, sans-serif';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const eIOs = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const eOut = x => 1 - Math.pow(1 - x, 3);
  const eOut5 = x => 1 - Math.pow(1 - x, 5);
  const eIn = x => x * x * x;
  const smooth = x => x * x * (3 - 2 * x);
  const mod = (a, n) => ((a % n) + n) % n;
  const backOut = (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
  const backIn = (x, s = 1.70158) => (s + 1) * x * x * x - s * x * x;
  const spring = (t, w = 14, d = 7) => t <= 0 ? 0 : 1 - Math.exp(-d * t) * Math.cos(w * t);   // 0→行き過ぎ→1
  function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function txt(ctx, s, x, y, font, col, align = 'left', base = 'alphabetic', ls = '0px') {
    ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = base; ctx.letterSpacing = ls; ctx.fillText(s, x, y); ctx.letterSpacing = '0px';
  }
  function tw(ctx, s, font, ls = '0px') { ctx.font = font; ctx.letterSpacing = ls; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w; }
  function rand(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(a, b, t) { const A = hex(a), B = hex(b); return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`; }
  function star(k, x, y, R, rot = 0, inner = 0.5, n = 5) { k.beginPath(); for (let i = 0; i < n * 2; i++) { const r = i % 2 ? R * inner : R, a = rot - Math.PI / 2 + i * Math.PI / n; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; i ? k.lineTo(px, py) : k.moveTo(px, py); } k.closePath(); }
  function heartPath(k, s) { k.beginPath(); k.moveTo(0, s * 0.92); k.bezierCurveTo(-s * 1.75, -s * 0.12, -s * 0.85, -s * 1.2, 0, -s * 0.42); k.bezierCurveTo(s * 0.85, -s * 1.2, s * 1.75, -s * 0.12, 0, s * 0.92); k.closePath(); }
  // 整数→0..1 の決まった乱数（コマ番号ごとの揺れ・入れ替わりに使う。描画時の Math.random は使わない）
  // 浮動小数の誤差で周期の終わり（4.6999…）と始まり（0）が別のコマ扱いになるのを防ぐ
  const snapU = u => mod(Math.round(u * 1e6) / 1e6, CYC);
  function H01(n) { n = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); n ^= n >>> 16; return (n >>> 0) / 4294967296; }
  const TMP = mkCanvas(CW, CH), TK = TMP.getContext('2d');
  function stage(k, col = C.navy) { k.fillStyle = col; k.fillRect(0, 0, CW, CH); }
  function chars(k, s, font, ls = 0) { k.font = font; const ws = [...s].map(ch => k.measureText(ch).width + ls); const tot = ws.reduce((a, b) => a + b, 0) - ls; let x = -tot / 2; return [...s].map((ch, i) => { const o = { ch, x: x + (ws[i] - ls) / 2, w: ws[i] - ls }; x += ws[i]; return o; }); }
  function pathLen(pts) { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return c; }
  function ptAt(pts, cum, f) { const L = cum[cum.length - 1] * clamp(f); let i = 1; while (i < cum.length - 1 && cum[i] < L) i++; const t = (L - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]); return [lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t), Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; }
  const CELLS = [];

  // @element 01
  // 01 アンティシペーション（進む向きと逆へ少し引いて、つぶれて溜めてから、勢いよく飛び出す）
  CELLS[0] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const T = CYC / 2, n = Math.floor(u / T), lu = u - n * T, dir = n % 2 ? -1 : 1;
    const XL = 108, XR = w - 108, xs = dir > 0 ? XL : XR, xe = dir > 0 ? XR : XL, floor = h - 30, S = 86, BACK = 44;
    k.fillStyle = C.navy3; rr(k, 26, floor, w - 52, 5, 2.5); k.fill();
    const wind = eIOs(P(lu, 0.2, 0.95)), go = P(lu, 0.95, 1.38);
    let x, sx = 1, sy = 1, rot = 0;
    if (go <= 0) { x = xs - dir * BACK * wind; sx = 1 + 0.22 * wind; sy = 1 - 0.24 * wind; rot = -dir * 0.18 * wind; }
    else {
      x = lerp(xs - dir * BACK, xe, backOut(go, 1.1));
      const st = go < 0.6 ? Math.sin(Math.PI * go / 0.6) : 0;
      sx = 1 + 0.55 * st; sy = 1 - 0.28 * st; rot = dir * 0.08 * st;
      const land = lu - 1.38; if (land > 0) { const wob = 0.13 * Math.exp(-7 * land) * Math.sin(17 * land); sy = 1 - wob; sx = 1 + wob; }
    }
    // 飛び出した地点の土けむり
    if (go > 0 && go < 0.7) { const q = go / 0.7; k.fillStyle = C.dim; k.globalAlpha = 0.8 * (1 - q); for (let i = 0; i < 3; i++) { k.beginPath(); k.arc(xs - dir * (BACK + 30 + i * 22 + q * 30), floor - 8 - i * 6 - q * 10, 7 + q * 12 - i * 2, 0, 7); k.fill(); } k.globalAlpha = 1; }
    // 影
    k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(x, floor + 8, S * 0.62 * sx, 6, 0, 0, 7); k.fill();
    // スピード線
    if (go > 0.02 && go < 0.8) { const a = 1 - go / 0.8; k.strokeStyle = C.yel; k.lineCap = 'round'; k.lineWidth = 8; k.globalAlpha = a;[0.28, 0.55, 0.8].forEach((f, i) => { const y = floor - S * sy * f, x0 = x - dir * (S * sx / 2 + 12), L = 120 * a + 20; k.beginPath(); k.moveTo(x0, y); k.lineTo(x0 - dir * L * (i === 1 ? 1 : 0.7), y); k.stroke(); }); k.globalAlpha = 1; }
    k.save(); k.translate(x, floor); k.rotate(rot); k.scale(sx, sy);
    k.fillStyle = C.coral; rr(k, -S / 2, -S, S, S, 24); k.fill();
    k.fillStyle = 'rgba(255,255,255,.16)'; rr(k, -S / 2, -S, S, S / 2, [24, 24, 0, 0]); k.fill();
    k.strokeStyle = '#fff'; k.lineWidth = 10; k.lineCap = 'round'; k.lineJoin = 'round';
    k.beginPath(); k.moveTo(-dir * 12, -S / 2 - 20); k.lineTo(dir * 12, -S / 2); k.lineTo(-dir * 12, -S / 2 + 20); k.stroke();
    k.restore();
  };

  // @element 02
  // 02 フォロースルー（体が止まった後も、旗としっぽだけが遅れて揺れて収まる）
  const FTAB = (() => {
    const T = CYC / 2, dt = 1 / 600, N = Math.ceil(T / dt) + 2, D = CW - 2 * 118;
    const pos = lu => { const q = P(lu, 0.15, 0.85), c = 1 / 0.85; return (q < 0.3 ? q * q / 0.6 : 0.15 + (q - 0.3)) * c; };
    const A = new Float32Array(N), B = new Float32Array(N);
    let a = 0, va = 0, b = 0, vb = 0, xp = 0, vp = 0;
    for (let i = 0; i < N; i++) {
      const lu = i * dt, x = pos(lu) * D, v = (x - xp) / dt, acc = i ? (v - vp) / dt : 0; xp = x; vp = v;
      va += (-121 * a - 5.5 * va - acc * 0.0175) * dt; a += va * dt;
      vb += (-56 * b - 2.8 * vb - acc * 0.012) * dt; b += vb * dt;
      const fade = 1 - smooth(P(lu, T - 0.3, T)); A[i] = a * fade; B[i] = b * fade;
    }
    return { A, B, pos, D };
  })();
  CELLS[1] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const T = CYC / 2, n = Math.floor(u / T), lu = u - n * T, dir = n % 2 ? -1 : 1;
    const i = Math.min(FTAB.A.length - 1, Math.round(lu * 600)), q = FTAB.pos(lu);
    const xs = dir > 0 ? 118 : w - 118, x = xs + dir * q * FTAB.D;
    const floor = h - 26, R = 38, cy = floor - R, a = dir * FTAB.A[i];
    k.fillStyle = C.navy3; rr(k, 26, floor, w - 52, 5, 2.5); k.fill();
    k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(x, floor + 8, R * 1.1, 6, 0, 0, 7); k.fill();
    // 滑っている間のスピード線
    const moving = lu > 0.2 && lu < 0.85;
    if (moving) { k.strokeStyle = C.dim; k.lineCap = 'round'; k.lineWidth = 6; k.globalAlpha = 0.7;[[-18, 70], [6, 100], [26, 56]].forEach(([dy, L]) => { const x0 = x - dir * (R + 30); k.beginPath(); k.moveTo(x0, cy + dy); k.lineTo(x0 - dir * L, cy + dy); k.stroke(); }); k.globalAlpha = 1; }
    // しっぽ（体の後ろ）
    let px = x - dir * (R - 8), py = cy + 10; const pts = [[px, py]];
    for (let j = 1; j <= 7; j++) {
      const ij = Math.max(0, i - j * 22), d = FTAB.B[ij] * (0.55 + j * 0.16), ang0 = Math.PI + 0.25 + d;
      const ang = dir > 0 ? ang0 : Math.PI - ang0; px += Math.cos(ang) * 14; py += Math.sin(ang) * 14; pts.push([px, py]);
    }
    k.lineCap = 'round'; k.lineJoin = 'round'; k.strokeStyle = C.coral;
    for (let j = 1; j < pts.length; j++) { k.lineWidth = lerp(14, 6, j / pts.length); k.beginPath(); k.moveTo(pts[j - 1][0], pts[j - 1][1]); k.lineTo(pts[j][0], pts[j][1]); k.stroke(); }
    k.fillStyle = C.coral; k.beginPath(); k.arc(px, py, 9, 0, 7); k.fill();
    // 体
    k.fillStyle = C.mint; k.beginPath(); k.arc(x, cy, R, 0, 7); k.fill();
    k.fillStyle = 'rgba(255,255,255,.18)'; k.beginPath(); k.arc(x - 10, cy - 12, R * 0.55, 0, 7); k.fill();
    k.fillStyle = '#fff'; k.beginPath(); k.arc(x + dir * 16, cy - 6, 9, 0, 7); k.fill();
    k.fillStyle = C.navy; k.beginPath(); k.arc(x + dir * 19, cy - 6, 4.5, 0, 7); k.fill();
    // アンテナの旗
    const L = 58, top = cy - R + 4;
    k.save(); k.translate(x, top); k.rotate(a);
    k.strokeStyle = '#fff'; k.lineWidth = 5; k.beginPath(); k.moveTo(0, 0); k.lineTo(0, -L); k.stroke();
    k.rotate(a * 0.6);
    k.fillStyle = C.yel; k.beginPath(); k.moveTo(0, -L); k.quadraticCurveTo(-dir * 22, -L + 4 + 8 * a * dir, -dir * 44, -L + 12); k.lineTo(0, -L + 28); k.closePath(); k.fill();
    k.restore();
    k.fillStyle = '#fff'; k.beginPath(); k.arc(x + Math.sin(a) * L, top - Math.cos(a) * L, 6, 0, 7); k.fill();
  };

  // @element 03
  // 03 バウンス（ボールが落ちて、だんだん低く弾みながら止まる）
  const BNC = (() => { const g = 1900, e = 0.56, d = 190, t0 = Math.sqrt(2 * d / g), v0 = g * t0; const segs = []; let t = t0, v = v0 * e; while (v > 35) { segs.push({ t, v }); t += 2 * v / g; v *= e; } const imp = [{ t: t0, v: v0 }]; segs.forEach((s, i) => { if (i) imp.push({ t: s.t, v: segs[i - 1].v }); }); return { g, d, t0, segs, imp, end: t }; })();
  function bounceH(t) { const B = BNC; if (t < B.t0) return B.d - 0.5 * B.g * Math.max(0, t) * Math.max(0, t) * (t < 0 ? 0 : 1); for (const s of B.segs) { const tau = t - s.t; if (tau >= 0 && tau < 2 * s.v / B.g) return s.v * tau - 0.5 * B.g * tau * tau; } return 0; }
  CELLS[2] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const T = CYC / 2, n = Math.floor(u / T), lu = u - n * T, t = lu - 0.1;
    const floor = h - 26, R = 26, rest = floor - R, x = lerp(150, 390, eOut(P(lu, 0.1, 1.8)));
    const hg = t < 0 ? BNC.d : bounceH(t), out = 1 - backIn(P(lu, 1.95, 2.25), 2);
    k.fillStyle = C.navy3; rr(k, 26, floor, w - 52, 5, 2.5); k.fill();
    // 着地の印
    let sq = 0;
    for (const im of BNC.imp) {
      const dtI = t - im.t;
      if (Math.abs(dtI) < 0.045) sq = Math.max(sq, clamp(im.v / 850) * 0.4 * (1 - Math.abs(dtI) / 0.045));
      if (dtI > 0 && dtI < 0.3 && im.v > 200) { const q = dtI / 0.3, ix = lerp(150, 390, eOut(P(im.t + 0.1, 0.1, 1.8))); k.strokeStyle = '#fff'; k.globalAlpha = 1 - q; k.lineWidth = 5; k.lineCap = 'round';[-1, 1].forEach(s => { k.beginPath(); k.moveTo(ix + s * (34 + 14 * q), floor - 6 - 8 * q); k.lineTo(ix + s * (48 + 22 * q), floor - 16 - 14 * q); k.stroke(); }); k.globalAlpha = 1; }
    }
    const sh = clamp(1 - hg / BNC.d);
    k.fillStyle = 'rgba(0,0,0,.32)'; k.beginPath(); k.ellipse(x, floor + 7, R * (0.4 + 0.8 * sh) * out, 5 * (0.4 + 0.6 * sh) * out, 0, 0, 7); k.fill();
    if (out > 0.01) {
      k.save(); k.translate(x, rest - hg + R); k.scale((1 + sq) * out, (1 - sq) * out);
      k.fillStyle = n ? C.coral : C.yel; k.beginPath(); k.arc(0, -R, R, 0, 7); k.fill();
      k.fillStyle = 'rgba(255,255,255,.7)'; k.beginPath(); k.ellipse(-9, -R - 9, 8, 5, -0.6, 0, 7); k.fill();
      k.restore();
    }
  };

  // @element 04
  // 04 ウィグル（ベルが、小刻みに不規則に揺れ続ける。1回の衝撃ではなく、ずっと続く細かい揺れ）
  const WGF = 2 * Math.PI / CYC;
  const wsum = (u, arr) => arr.reduce((s, [kk, am, ph]) => s + am * Math.sin(WGF * kk * u + ph), 0);
  CELLS[3] = (k, w, h, u) => {
    stage(k);
    const rot = wsum(u, [[23, 0.085, 0.3], [31, 0.065, 1.9], [43, 0.05, 4.2], [59, 0.035, 2.6]]);
    const dx = wsum(u, [[29, 4, 0.7], [47, 3, 3.1], [61, 2, 5.0]]), dy = wsum(u, [[37, 2.4, 2.2], [53, 1.8, 0.4]]);
    const X = w / 2 + dx, Y = 34 + dy;
    // 両わきの振動の線（揺れているあいだ、ずっと出ている）
    k.strokeStyle = '#fff'; k.lineCap = 'round'; k.lineWidth = 6;
    [[86, 0.85], [110, 0.5]].forEach(([r, al], j) => { const fl = 0.55 + 0.45 * Math.abs(Math.sin(WGF * (41 + j * 12) * u)); k.globalAlpha = al * fl;[0, Math.PI].forEach(base => { k.beginPath(); k.arc(w / 2, 104, r, base - 0.42, base + 0.42); k.stroke(); }); });
    k.globalAlpha = 1;
    k.save(); k.translate(X, Y); k.rotate(rot);
    // 舌（ベルと逆にふれる）
    k.fillStyle = C.coral; k.beginPath(); k.arc(-rot * 70, 128, 13, 0, 7); k.fill();
    k.fillStyle = C.yel;
    k.beginPath(); k.arc(0, 8, 10, 0, 7); k.fill();
    k.beginPath(); k.moveTo(-50, 112); k.quadraticCurveTo(-42, 100, -42, 76); k.bezierCurveTo(-42, 36, -22, 18, 0, 18); k.bezierCurveTo(22, 18, 42, 36, 42, 76); k.quadraticCurveTo(42, 100, 50, 112); k.closePath(); k.fill();
    rr(k, -60, 106, 120, 16, 8); k.fill();
    k.fillStyle = 'rgba(255,255,255,.35)'; rr(k, -28, 40, 12, 50, 6); k.fill();
    k.restore();
  };

  // @element 05
  // 05 パルス（ハートが鼓動のように、ドクン・ドクンと大きさを脈打たせる）
  CELLS[4] = (k, w, h, u) => {
    stage(k);
    const T = CYC / 4, lu = mod(u, T), X = w / 2, Y = h / 2 + 10;
    const g = (c, s) => Math.exp(-Math.pow((lu - c) / s, 2));
    const b = 0.26 * g(0.2, 0.065) + 0.15 * g(0.44, 0.07) + 0.26 * Math.exp(-Math.pow((lu - T - 0.2) / 0.065, 2));
    for (const [t0, s] of [[0.16, 1], [0.4, 0.6]]) {
      const q = P(lu, t0, t0 + 0.8); if (q <= 0 || q >= 1) continue;
      k.save(); k.translate(X, Y); const sc = 1.2 + 1.2 * eOut(q); k.scale(sc, sc); heartPath(k, 44);
      k.strokeStyle = C.coral; k.globalAlpha = (1 - q) * 0.75 * s; k.lineWidth = (7 * (1 - q) + 1.5) / sc; k.stroke(); k.restore();
    }
    k.globalAlpha = 1;
    k.save(); k.translate(X, Y); k.scale(1 + b, 1 + b); heartPath(k, 44); k.fillStyle = C.coral; k.fill();
    k.fillStyle = 'rgba(255,255,255,.75)'; k.beginPath(); k.ellipse(-30, -28, 9, 6, -0.7, 0, 7); k.fill(); k.restore();
  };

  // @element 06
  // 06 モーションパス（点線の道に沿って、紙飛行機が向きを変えながら進む）
  const MPX = th => 270 + 112 * th - 150 * Math.sin(th), MPY = th => 106 - 74 * Math.cos(th);
  const MP = (() => { const pts = []; for (let i = 0; i <= 400; i++) { const th = -Math.PI + 2 * Math.PI * i / 400; pts.push([MPX(th), MPY(th)]); } return pts; })();
  CELLS[5] = (k, w, h, u) => {
    stage(k);
    k.save(); k.setLineDash([2, 15]); k.lineCap = 'round'; k.strokeStyle = C.dim; k.lineWidth = 6; k.beginPath(); MP.forEach((p, i) => i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1])); k.stroke(); k.restore();
    const th = -Math.PI + 2 * Math.PI * (u / CYC);
    // 通ったあとの線
    k.lineCap = 'round';
    for (let j = 0; j < 24; j++) { const a = th - j * 0.03, b = th - (j + 1) * 0.03; k.strokeStyle = C.mint; k.globalAlpha = 0.9 * (1 - j / 24); k.lineWidth = 7 * (1 - j / 30); k.beginPath(); k.moveTo(MPX(a), MPY(a)); k.lineTo(MPX(b), MPY(b)); k.stroke(); }
    k.globalAlpha = 1;
    const x = MPX(th), y = MPY(th), ang = Math.atan2(74 * Math.sin(th), 112 - 150 * Math.cos(th));
    k.save(); k.translate(x, y); k.rotate(ang);
    k.fillStyle = '#fff'; k.beginPath(); k.moveTo(32, 0); k.lineTo(-22, -22); k.lineTo(-12, 0); k.closePath(); k.fill();
    k.fillStyle = '#C9D6FF'; k.beginPath(); k.moveTo(32, 0); k.lineTo(-22, 22); k.lineTo(-12, 0); k.closePath(); k.fill();
    k.fillStyle = '#9FB3F0'; k.beginPath(); k.moveTo(32, 0); k.lineTo(-12, 0); k.lineTo(-6, 9); k.closePath(); k.fill();
    k.restore();
  };

  // @element 07
  // 07 ピンポンループ（端まで行ったら、同じ道を逆再生のように戻ってくる。往復をくり返す）
  CELLS[6] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const q = u / CYC, fwd = q < 0.5, g = fwd ? 2 * q : 2 - 2 * q, X0 = 92, X1 = w - 92, base = 136, S = 48;
    const pos = gg => [lerp(X0, X1, gg), base - 62 * Math.abs(Math.sin(3 * Math.PI * gg))];
    k.save(); k.setLineDash([2, 12]); k.lineCap = 'round'; k.strokeStyle = C.navy3; k.lineWidth = 5; k.beginPath();
    for (let i = 0; i <= 150; i++) { const [px, py] = pos(i / 150); i ? k.lineTo(px, py - S / 2) : k.moveTo(px, py - S / 2); } k.stroke(); k.restore();
    k.fillStyle = C.navy3; rr(k, X0 - 40, base + 2, X1 - X0 + 80, 5, 2.5); k.fill();
    // 両端の折り返し点
    [X0, X1].forEach(xx => { k.fillStyle = C.navy3; rr(k, xx - 4, base - 70, 8, 72, 4); k.fill(); });
    // 残像
    for (let j = 4; j >= 1; j--) { const qq = mod(u - j * 0.045, CYC) / CYC, gg = qq < 0.5 ? 2 * qq : 2 - 2 * qq, [gx, gy] = pos(gg); k.globalAlpha = 0.1 * (5 - j); k.fillStyle = C.mint; k.save(); k.translate(gx, gy - S / 2); k.rotate(gg * Math.PI * 2); rr(k, -S / 2, -S / 2, S, S, 13); k.fill(); k.restore(); }
    k.globalAlpha = 1;
    const [x, y] = pos(g);
    k.save(); k.translate(x, y - S / 2); k.rotate(g * Math.PI * 2);
    k.fillStyle = C.mint; rr(k, -S / 2, -S / 2, S, S, 13); k.fill();
    k.fillStyle = '#fff'; k.beginPath(); k.arc(S / 2 - 13, -S / 2 + 13, 6.5, 0, 7); k.fill();
    k.restore();
    // 再生バー
    const ty = 184, tx0 = 196, tx1 = w - 34;
    k.fillStyle = fwd ? C.blue : C.coral; rr(k, 22, ty - 20, 158, 40, 20); k.fill();
    txt(k, fwd ? '▶ 播放' : '◀ 倒放', 101, ty + 1, `800 25px ${JP}`, '#fff', 'center', 'middle');
    k.fillStyle = C.navy3; rr(k, tx0, ty - 5, tx1 - tx0, 10, 5); k.fill();
    k.fillStyle = fwd ? C.blue : C.coral; rr(k, tx0, ty - 5, Math.max(10, (tx1 - tx0) * g), 10, 5); k.fill();
    k.fillStyle = C.yel; k.beginPath(); k.arc(tx0 + (tx1 - tx0) * g, ty, 12, 0, 7); k.fill();
  };

  // @element 08
  // 08 ストップモーション風（1秒8コマのカクカクした動き。コマごとに位置が少しずつぶれる）
  CELLS[7] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    k.fillStyle = '#0A1230'; k.fillRect(0, 0, w, 26); k.fillRect(0, h - 26, w, 26);
    k.fillStyle = C.navy3; for (let x = 12; x < w; x += 34) { rr(k, x, 8, 18, 11, 3); k.fill(); rr(k, x, h - 19, 18, 11, 3); k.fill(); }
    const NS = 38, st = CYC / NS, fi = Math.floor(u / st), floor = h - 44;
    const pose = f => { const t = f / NS, j = i => H01(f * 7919 + i * 131 + 77) - 0.5; return { x: lerp(-44, w + 44, t) + j(1) * 10, y: floor - 36 - 54 * Math.abs(Math.sin(t * Math.PI * 3)) + j(2) * 9, r: t * Math.PI * 4 + j(3) * 0.3, s: 1 + j(4) * 0.1 }; };
    const draw = (p, a) => {
      k.globalAlpha = a;
      k.save(); k.translate(p.x + 5, p.y + 6); k.rotate(p.r); k.scale(p.s, p.s); k.fillStyle = 'rgba(0,0,0,.35)'; star(k, 0, 0, 38, 0, 0.5); k.fill(); k.restore();
      k.save(); k.translate(p.x, p.y); k.rotate(p.r); k.scale(p.s, p.s); k.fillStyle = C.yel; star(k, 0, 0, 38, 0, 0.5); k.fill();
      k.fillStyle = C.coral; k.beginPath(); k.arc(0, 2, 9, 0, 7); k.fill(); k.restore();
      k.globalAlpha = 1;
    };
    draw(pose(mod(fi - 2, NS)), 0.12); draw(pose(mod(fi - 1, NS)), 0.28);
    const p = pose(fi);
    k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(p.x, floor + 6, 30, 5, 0, 0, 7); k.fill();
    draw(p, 1);
    // 1秒あたりのコマ数
    txt(k, '8 帧/秒', w - 16, 50, `800 24px ${JP}`, C.dim, 'right', 'middle');
  };


  // @element 09
  // 09 テキストスクランブル（ランダムな文字が入れ替わり続け、左から順に正しい単語に決まる）
  const SCR_GL = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#$%&@?';
  CELLS[8] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const T = CYC / 2, n = Math.floor(u / T), lu = u - n * T, word = n ? 'WORLD' : 'HELLO', N = 5;
    const f = `700 92px Menlo, "SF Mono", monospace`; k.font = f;
    const cw = k.measureText('M').width + 16, x0 = w / 2 - cw * (N - 1) / 2, Y = h / 2 - 8;
    const step = Math.floor(u / (CYC / 76));
    for (let i = 0; i < N; i++) {
      const tl = 0.45 + i * 0.18, tu = 1.85 + (N - 1 - i) * 0.08, locked = lu >= tl && lu < tu;
      let ch, col, sc = 1;
      if (locked) { ch = word[i]; const age = lu - tl; col = age < 0.22 ? C.yel : '#fff'; sc = 1 + 0.2 * Math.exp(-age * 14); }
      else { ch = SCR_GL[Math.floor(H01(step * 131 + i * 977 + n * 31) * SCR_GL.length)]; col = C.mint; }
      k.save(); k.translate(x0 + i * cw, Y); k.scale(sc, sc); k.globalAlpha = locked ? 1 : 0.75; txt(k, ch, 0, 0, f, col, 'center', 'middle'); k.restore();
      const next = !locked && lu < tl && (i === 0 || lu >= 0.45 + (i - 1) * 0.18);
      k.fillStyle = locked ? C.blue : next ? C.yel : C.navy3; rr(k, x0 + i * cw - cw / 2 + 8, Y + 58, cw - 16, 8, 4); k.fill();
    }
  };

  // @element 10
  // 10 ウェーブテキスト（1文字ずつ、波のように順に上下する）
  CELLS[9] = (k, w, h, u) => {
    stage(k);
    const f = `800 70px ${DISP}`, cs = chars(k, 'WAVE TEXT', f, 4), Y = h / 2 + 2, ph = 2 * Math.PI * 3 * u / CYC;
    cs.forEach((c, i) => {
      if (c.ch === ' ') return;
      const s = Math.sin(ph - i * 0.62), y = -28 * s;
      k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(w / 2 + c.x, Y + 62, c.w * (0.42 - 0.12 * s), 4, 0, 0, 7); k.fill();
      k.save(); k.translate(w / 2 + c.x, Y + y); k.scale(1, 1 + 0.06 * s); txt(k, c.ch, 0, 0, f, mix('#FFFFFF', C.yel, clamp(s)), 'center', 'middle'); k.restore();
    });
  };

  // @element 11
  // 11 テキストオンパス（文字列が、波打つ線に沿って流れていく）
  const TOP = (() => { const pts = []; for (let x = -70; x <= CW + 70; x += 4) pts.push([x, 118 + 42 * Math.sin(x * 2 * Math.PI / 330 + 0.6)]); return { pts, cum: pathLen(pts) }; })();
  CELLS[10] = (k, w, h, u) => {
    stage(k);
    k.save(); k.setLineDash([14, 10]); k.strokeStyle = C.navy3; k.lineWidth = 5; k.lineCap = 'round'; k.beginPath(); TOP.pts.forEach((p, i) => i ? k.lineTo(p[0], p[1] + 6) : k.moveTo(p[0], p[1] + 6)); k.stroke(); k.restore();
    const f = `800 42px ${DISP}`, S = 'ALONG THE LINE • '; k.font = f;
    const ws = [...S].map(ch => k.measureText(ch).width + 2), run = ws.reduce((a, b) => a + b, 0), L = TOP.cum[TOP.cum.length - 1], shift = (u / CYC) * run;
    for (let r = -2; r * run + shift < L; r++) {
      let s = r * run + shift;
      [...S].forEach((ch, j) => {
        const c = s + ws[j] / 2; s += ws[j];
        if (c < 0 || c > L || ch === ' ') return;
        const p = ptAt(TOP.pts, TOP.cum, c / L);
        k.save(); k.translate(p[0], p[1]); k.rotate(p[2]); txt(k, ch, 0, 0, f, ch === '•' ? C.yel : '#fff', 'center', 'alphabetic'); k.restore();
      });
    }
  };

  // @element 12
  // 12 可変フォントアニメーション（同じ単語の太さが、細→極太→細となめらかに変わる）
  CELLS[11] = (k, w, h, u) => {
    stage(k);
    const v = 0.5 - 0.5 * Math.cos(2 * Math.PI * 2 * u / CYC), wt = Math.round(100 + 800 * v);
    txt(k, 'MOTION', w / 2, 80, `${wt} 112px system-ui`, '#fff', 'center', 'middle', '2px');
    const x0 = 112, x1 = w - 112, y = 180, kx = x0 + (x1 - x0) * v;
    txt(k, '细', x0 - 34, y + 1, `300 30px ${JP}`, C.dim, 'center', 'middle');
    txt(k, '粗', x1 + 34, y + 1, `900 30px ${JP}`, C.dim, 'center', 'middle');
    k.fillStyle = C.navy3; rr(k, x0, y - 5, x1 - x0, 10, 5); k.fill();
    k.fillStyle = C.blue; rr(k, x0, y - 5, Math.max(10, kx - x0), 10, 5); k.fill();
    k.fillStyle = C.yel; k.beginPath(); k.arc(kx, y, 14, 0, 7); k.fill();
    txt(k, String(wt), kx, y - 30, `800 24px ${DISP}`, C.yel, 'center', 'middle');
  };

  // @element 13
  // 13 テキストマスク（太い文字の形にくり抜いて、その中だけに動く景色が見える）
  const G0 = mkCanvas(CW, CH), GK0 = G0.getContext('2d', { willReadFrequently: true });
  function seaPattern(g, w, h, u) {
    g.fillStyle = C.coral; g.fillRect(0, 0, w, h);
    g.fillStyle = C.yel; g.beginPath(); g.arc(w * 0.6, 116 + 6 * Math.sin(2 * Math.PI * u / CYC), 60, 0, 7); g.fill();
    g.fillStyle = C.blue; g.fillRect(0, 116, w, h - 116);
    const off = (u / CYC) * 240; g.strokeStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'round';
    for (let j = 0; j < 4; j++) { const y = 128 + j * 22, d = j % 2 ? -1 : 1; g.beginPath(); for (let x = -20; x <= w + 20; x += 6) { const yy = y + 5 * Math.sin((x + off * d + j * 40) * 2 * Math.PI / 120); x === -20 ? g.moveTo(x, yy) : g.lineTo(x, yy); } g.stroke(); }
    const bx = mod(u / CYC * (w + 160), w + 160) - 80;
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(bx, 46); g.lineTo(bx, 100); g.lineTo(bx + 40, 100); g.closePath(); g.fill();
    g.fillStyle = C.navy; g.beginPath(); g.moveTo(bx - 42, 104); g.lineTo(bx + 52, 104); g.lineTo(bx + 38, 122); g.lineTo(bx - 30, 122); g.closePath(); g.fill();
    g.fillStyle = '#fff';[[60, 40], [320, 30], [470, 56]].forEach(([x, y]) => { const xx = mod(x + u / CYC * 60, w + 80) - 40; g.beginPath(); g.ellipse(xx, y, 30, 11, 0, 0, 7); g.fill(); });
  }
  CELLS[12] = (k, w, h, u) => {
    stage(k);
    let fs = 172; while (fs > 90 && tw(k, 'OCEAN', `900 ${fs}px system-ui`, '2px') > 500) fs -= 2;
    const font = `900 ${fs}px system-ui`, Y = h / 2 + 6;
    const open = smooth(P(u, 3.45, 3.85)) * (1 - smooth(P(u, 4.25, 4.65)));
    TK.setTransform(1, 0, 0, 1, 0, 0); TK.globalCompositeOperation = 'source-over'; TK.clearRect(0, 0, w, h);
    txt(TK, 'OCEAN', w / 2, Y, font, '#fff', 'center', 'middle', '2px');
    GK0.setTransform(1, 0, 0, 1, 0, 0); GK0.globalCompositeOperation = 'source-over'; GK0.clearRect(0, 0, w, h); seaPattern(GK0, w, h, u);
    TK.globalCompositeOperation = 'source-in'; TK.drawImage(G0, 0, 0); TK.globalCompositeOperation = 'source-over';
    k.globalAlpha = 0.12 + 0.88 * open; seaPattern(k, w, h, u); k.globalAlpha = 1;
    k.drawImage(TMP, 0, 0);
    k.font = font; k.textAlign = 'center'; k.textBaseline = 'middle'; k.letterSpacing = '2px'; k.lineJoin = 'round';
    k.strokeStyle = '#fff'; k.lineWidth = 4; k.strokeText('OCEAN', w / 2, Y); k.letterSpacing = '0px';
  };

  // @element 14
  // 14 リピーター（1つの図形が複製されて円に並び、少しずつずれながら回る）
  CELLS[13] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const N = 12, X = w / 2, Y = h / 2, R = 58, spin = 2 * Math.PI * u / CYC;
    const cnt = 1 + (N - 1) * (eIOs(P(u, 0.35, 1.7)) - eIOs(P(u, 3.6, 4.45)));
    for (let i = N - 1; i >= 0; i--) {
      const vis = i === 0 ? 1 : clamp(cnt - i); if (vis <= 0) continue;
      const ang = spin + (i === 0 ? 0 : (i - 1 + eOut(vis))) * 2 * Math.PI / N;
      const pul = (1 + 0.22 * Math.sin(2 * Math.PI * 2 * u / CYC - i * 0.55)) * (0.55 + 0.45 * vis);
      k.save(); k.translate(X + Math.cos(ang) * R, Y + Math.sin(ang) * R); k.rotate(ang + Math.PI / 2); k.scale(pul, pul);
      k.fillStyle = PAL[i % 4]; rr(k, -12, -30, 24, 60, 12); k.fill();
      if (i === 0) { k.strokeStyle = '#fff'; k.lineWidth = 4; rr(k, -12, -30, 24, 60, 12); k.stroke(); }
      k.restore();
    }
    txt(k, '×' + Math.round(cnt), w - 34, 46, `800 40px ${DISP}`, C.yel, 'right', 'middle');
  };

  // @element 15
  // 15 カレイドスコープ（万華鏡のように、8分割の対称な模様が回りながら広がる）
  const KAL = (() => { const R = rand(1515), a = []; for (let i = 0; i < 13; i++) a.push({ r0: R() * 300, th: 0.06 + R() * 0.66, kind: i % 3, col: PAL[i % 4], sz: 0.7 + R() * 0.7, ph: R() * 6 }); return a; })();
  CELLS[14] = (k, w, h, u) => {
    stage(k);
    const X = w / 2, Y = h / 2, RM = 300, rot = (Math.PI / 2) * u / CYC, W8 = Math.PI / 4;
    for (let s = 0; s < 8; s++) {
      k.save(); k.translate(X, Y);
      if (s % 2) { k.rotate(rot + (s + 1) * W8); k.scale(1, -1); } else k.rotate(rot + s * W8);
      k.beginPath(); k.moveTo(0, 0); k.arc(0, 0, RM + 60, -0.006, W8 + 0.006); k.closePath(); k.clip();
      for (const it of KAL) {
        const r = mod(it.r0 + (u / CYC) * RM, RM), th = it.th + 0.08 * Math.sin(2 * Math.PI * u / CYC + it.ph), sz = (5 + r * 0.1) * it.sz;
        const a = smooth(P(r, 0, 30)) * (1 - smooth(P(r, RM - 70, RM))); if (a <= 0) continue;
        k.globalAlpha = a; k.fillStyle = it.col; k.save(); k.translate(Math.cos(th) * r, Math.sin(th) * r); k.rotate(r * 0.02);
        if (it.kind === 0) { k.beginPath(); k.arc(0, 0, sz, 0, 7); k.fill(); }
        else if (it.kind === 1) { k.beginPath(); k.moveTo(0, -sz * 1.2); k.lineTo(sz * 0.8, 0); k.lineTo(0, sz * 1.2); k.lineTo(-sz * 0.8, 0); k.closePath(); k.fill(); }
        else { k.beginPath(); k.moveTo(0, -sz); k.lineTo(sz * 0.95, sz * 0.7); k.lineTo(-sz * 0.95, sz * 0.7); k.closePath(); k.fill(); }
        k.restore();
      }
      k.globalAlpha = 1; k.restore();
    }
    k.fillStyle = '#fff'; star(k, X, Y, 20 + 4 * Math.sin(2 * Math.PI * 2 * u / CYC), rot, 0.5, 8); k.fill();
  };

  // @element 16
  // 16 ラインボイル（手描き風の線の絵が、数コマごとに小刻みに揺らぐ。絵は動かない）
  function densify(pts, closed, step) { const out = [], n = pts.length, m = closed ? n : n - 1; for (let i = 0; i < m; i++) { const a = pts[i], b = pts[(i + 1) % n], d = Math.hypot(b[0] - a[0], b[1] - a[1]), c = Math.max(1, Math.round(d / step)); for (let j = 0; j < c; j++) out.push([lerp(a[0], b[0], j / c), lerp(a[1], b[1], j / c)]); } if (!closed) out.push(pts[n - 1]); return out; }
  const LB = (() => {
    const st = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 30 : 70, a = -Math.PI / 2 + i * Math.PI / 5; st.push([150 + Math.cos(a) * r, 112 + Math.sin(a) * r]); }
    const CIR = [[318, 132, 26], [354, 104, 36], [408, 94, 42], [456, 122, 30]], O = [388, 130], cl = [];
    for (let i = 0; i < 96; i++) {
      const a = i / 96 * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a); let tm = 0;
      const tx = dx > 0 ? (470 - O[0]) / dx : dx < 0 ? (310 - O[0]) / dx : 1e9, ty = dy > 0 ? (150 - O[1]) / dy : dy < 0 ? (118 - O[1]) / dy : 1e9; tm = Math.min(tx, ty);
      for (const [ccx, ccy, r] of CIR) { const ox = O[0] - ccx, oy = O[1] - ccy, b = ox * dx + oy * dy, c2 = ox * ox + oy * oy - r * r, D = b * b - c2; if (D >= 0) { const t = -b + Math.sqrt(D); if (t > tm) tm = t; } }
      cl.push([O[0] + dx * tm, O[1] + dy * tm]);
    }
    return [
      { pts: densify(st, true, 13), col: C.yel, closed: true, w: 8 },
      { pts: cl, col: '#fff', closed: true, w: 8 },
      { pts: densify([[248, 44], [266, 62]], false, 6), col: C.mint, closed: false, w: 7 },
      { pts: densify([[254, 104], [280, 104]], false, 6), col: C.mint, closed: false, w: 7 },
      { pts: densify([[60, 34], [74, 52]], false, 6), col: C.mint, closed: false, w: 7 },
      { pts: densify([[318, 178], [460, 178]], false, 10), col: C.dim, closed: false, w: 6 },
    ];
  })();
  CELLS[15] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const fi = Math.floor(u / (CYC / 47));
    k.lineCap = 'round'; k.lineJoin = 'round';
    LB.forEach((sh, si) => {
      const q = sh.pts.map((p, j) => [p[0] + (H01(fi * 7919 + j * 131 + si * 17) - 0.5) * 7, p[1] + (H01(fi * 6007 + j * 97 + si * 29 + 5) - 0.5) * 7]);
      k.strokeStyle = sh.col; k.lineWidth = sh.w; k.beginPath();
      const n = q.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (sh.closed) { const m0 = mid(q[n - 1], q[0]); k.moveTo(m0[0], m0[1]); for (let j = 0; j < n; j++) { const m = mid(q[j], q[(j + 1) % n]); k.quadraticCurveTo(q[j][0], q[j][1], m[0], m[1]); } k.closePath(); }
      else { k.moveTo(q[0][0], q[0][1]); for (let j = 1; j < n - 1; j++) { const m = mid(q[j], q[j + 1]); k.quadraticCurveTo(q[j][0], q[j][1], m[0], m[1]); } k.lineTo(q[n - 1][0], q[n - 1][1]); }
      k.stroke();
    });
  };

  // @shared
  // 場面（昼・夜・海・山・街・野原）。同じ絵柄がそろわないよう、カードごとに組み合わせを変える
  const SUN = [112, 104], MOON = [CW - 112, 104];
  function scrA(k, w, h) {
    k.fillStyle = C.cream; k.fillRect(0, 0, w, h);
    k.fillStyle = '#FFD9A8'; k.beginPath(); k.arc(SUN[0], SUN[1], 66, 0, 7); k.fill();
    k.fillStyle = C.coral; k.beginPath(); k.arc(SUN[0], SUN[1], 44, 0, 7); k.fill();
    txt(k, 'DAY', 214, h / 2 + 4, `800 96px ${DISP}`, C.navy, 'left', 'middle', '2px');
    k.fillStyle = '#fff'; rr(k, 400, 34, 96, 26, 13); k.fill(); rr(k, 430, 20, 50, 26, 13); k.fill();
  }
  function scrB(k, w, h) {
    k.fillStyle = '#16255A'; k.fillRect(0, 0, w, h);
    k.fillStyle = '#fff';[[40, 30, 3], [150, 170, 2.5], [250, 24, 2.5], [330, 180, 3], [500, 30, 2.5], [20, 150, 2]].forEach(s => { k.beginPath(); k.arc(s[0], s[1], s[2], 0, 7); k.fill(); });
    k.fillStyle = C.yel; k.beginPath(); k.arc(MOON[0], MOON[1], 46, 0, 7); k.fill();
    k.fillStyle = '#16255A'; k.beginPath(); k.arc(MOON[0] + 22, MOON[1] - 14, 38, 0, 7); k.fill();
    txt(k, 'NIGHT', 40, h / 2 + 4, `800 88px ${DISP}`, '#fff', 'left', 'middle', '1px');
  }
  function clipX(k, x0, x1, h) { k.beginPath(); k.rect(x0, 0, x1 - x0, h); k.clip(); }
  function pnSea(k, x0, x1, h, t, label) {
    const c = (x0 + x1) / 2; k.save(); clipX(k, x0, x1, h);
    k.fillStyle = '#CFE0FF'; k.fillRect(x0, 0, x1 - x0, h);
    k.fillStyle = C.yel; k.beginPath(); k.arc(c + 120, 54, 30, 0, 7); k.fill();
    k.fillStyle = C.blue; k.fillRect(x0, 126, x1 - x0, h - 126);
    const off = (t / CYC) * 200; k.strokeStyle = '#fff'; k.lineWidth = 6; k.lineCap = 'round';
    for (let j = 0; j < 3; j++) { const y = 146 + j * 22; k.beginPath(); for (let x = x0 - 10; x <= x1 + 10; x += 6) { const yy = y + 4 * Math.sin((x + off * (j % 2 ? -1 : 1) + j * 30) * 2 * Math.PI / 100); x === x0 - 10 ? k.moveTo(x, yy) : k.lineTo(x, yy); } k.stroke(); }
    const bx = c + 26 * Math.sin(2 * Math.PI * t / CYC) + (label ? 110 : 0), by = 124 + 3 * Math.sin(2 * Math.PI * 3 * t / CYC);
    k.fillStyle = '#fff'; k.beginPath(); k.moveTo(bx, by - 62); k.lineTo(bx, by - 8); k.lineTo(bx + 42, by - 8); k.closePath(); k.fill();
    k.fillStyle = C.coral; k.beginPath(); k.moveTo(bx - 40, by - 4); k.lineTo(bx + 50, by - 4); k.lineTo(bx + 36, by + 14); k.lineTo(bx - 28, by + 14); k.closePath(); k.fill();
    if (label) txt(k, 'SEA', x0 + 30, 82, `800 76px ${DISP}`, C.navy, 'left', 'middle', '2px');
    k.restore();
  }
  function pnMtn(k, x0, x1, h, t, label) {
    const c = (x0 + x1) / 2; k.save(); clipX(k, x0, x1, h);
    k.fillStyle = '#FFE1DA'; k.fillRect(x0, 0, x1 - x0, h);
    k.fillStyle = C.yel; k.beginPath(); k.arc(c - 30, 112, 34, 0, 7); k.fill();
    const tri = (a, px, py, b, col) => { k.fillStyle = col; k.beginPath(); k.moveTo(a, h); k.lineTo(px, py); k.lineTo(b, h); k.closePath(); k.fill(); };
    const snow = (a, px, py, b, f) => { const L = lerp(px, a, f), R = lerp(px, b, f), y = lerp(py, h, f); k.fillStyle = '#fff'; k.beginPath(); k.moveTo(px, py); k.lineTo(R, y); k.lineTo(lerp(px, R, 0.5), y + 10); k.lineTo(px, y - 2); k.lineTo(lerp(L, px, 0.5), y + 10); k.lineTo(L, y); k.closePath(); k.fill(); };
    tri(c - 330, c - 230, 104, c - 110, C.mint);
    tri(c - 110, c + 50, 30, c + 210, C.navy3); snow(c - 110, c + 50, 30, c + 210, 0.22);
    tri(c + 80, c + 190, 86, c + 330, C.blue); snow(c + 80, c + 190, 86, c + 330, 0.2);
    k.fillStyle = C.mint; k.fillRect(x0, h - 20, x1 - x0, 20);
    if (label) txt(k, 'MOUNTAIN', x0 + 26, 54, `800 44px ${DISP}`, C.navy, 'left', 'middle', '1px');
    k.restore();
  }
  const BLD = [[-250, 70, 116, 0], [-175, 62, 150, 1], [-108, 80, 96, 0], [-22, 64, 172, 1], [48, 92, 122, 0], [146, 58, 150, 1], [210, 80, 108, 0]];
  function pnCity(k, x0, x1, h, t, label) {
    const c = (x0 + x1) / 2; k.save(); clipX(k, x0, x1, h);
    k.fillStyle = C.navy2; k.fillRect(x0, 0, x1 - x0, h);
    k.fillStyle = '#fff'; k.beginPath(); k.arc(c + 150, 46, 22, 0, 7); k.fill();
    const stp = Math.floor(t / (CYC / 8));
    BLD.forEach(([dx, bw, bh, ci], bi) => {
      const bx = c + dx, by = h - bh; k.fillStyle = ci ? C.blue : C.navy3; k.fillRect(bx, by, bw, bh);
      let wi = 0; for (let y = by + 14; y < h - 16; y += 22) for (let x = bx + 10; x < bx + bw - 14; x += 18) { const on = H01(bi * 97 + wi * 13 + stp * 7) > 0.35; wi++; k.fillStyle = on ? C.yel : 'rgba(15,26,61,.45)'; k.fillRect(x, y, 9, 11); }
    });
    if (label) { k.fillStyle = 'rgba(15,26,61,.55)'; rr(k, x0 + 18, 28, 196, 70, 14); k.fill(); txt(k, 'CITY', x0 + 34, 64, `800 66px ${DISP}`, '#fff', 'left', 'middle', '2px'); }
    k.restore();
  }
  function pnField(k, x0, x1, h, t, label) {
    const c = (x0 + x1) / 2; k.save(); clipX(k, x0, x1, h);
    k.fillStyle = '#DDF6EC'; k.fillRect(x0, 0, x1 - x0, h);
    k.fillStyle = '#fff';[[-150, 40], [60, 30], [210, 52]].forEach(([dx, y]) => { const xx = c + dx + 14 * Math.sin(2 * Math.PI * t / CYC + dx); k.beginPath(); k.ellipse(xx, y, 34, 12, 0, 0, 7); k.ellipse(xx + 14, y - 8, 18, 12, 0, 0, 7); k.fill(); });
    k.fillStyle = C.mint; k.beginPath(); k.moveTo(x0, h); k.lineTo(x0, 150); for (let x = x0; x <= x1; x += 10) k.lineTo(x, 150 + 8 * Math.sin((x - c) * 0.02)); k.lineTo(x1, h); k.closePath(); k.fill();
    const mx = c + (label ? 120 : 0), my = 72;
    k.fillStyle = '#fff'; k.beginPath(); k.moveTo(mx - 10, my); k.lineTo(mx + 10, my); k.lineTo(mx + 18, 160); k.lineTo(mx - 18, 160); k.closePath(); k.fill();
    const ang = 2 * Math.PI * 2 * t / CYC + 0.3; k.fillStyle = C.coral;
    for (let i = 0; i < 4; i++) { k.save(); k.translate(mx, my); k.rotate(ang + i * Math.PI / 2); k.beginPath(); k.moveTo(0, -3); k.lineTo(58, -10); k.lineTo(58, 8); k.lineTo(0, 3); k.closePath(); k.fill(); k.restore(); }
    k.fillStyle = C.yel; k.beginPath(); k.arc(mx, my, 8, 0, 7); k.fill();
    [[-200, 176, 0], [-120, 186, 1], [-40, 172, 0], [40, 184, 1], [180, 178, 0], [230, 190, 1]].forEach(([dx, y, ci]) => { k.fillStyle = ci ? C.yel : C.coral; k.beginPath(); k.arc(c + dx, y, 7, 0, 7); k.fill(); });
    if (label) txt(k, 'FIELD', x0 + 28, 70, `800 70px ${DISP}`, C.navy, 'left', 'middle', '2px');
    k.restore();
  }
  const scSea = (k, w, h) => pnSea(k, 0, w, h, 0, true), scMtn = (k, w, h) => pnMtn(k, 0, w, h, 0, true);
  const scCity = (k, w, h) => pnCity(k, 0, w, h, 0, true), scField = (k, w, h) => pnField(k, 0, w, h, 0, true);
  const SEG3 = CYC / 2;
  function abCell(trans) { return (k, w, h, u) => { u = snapU(u); const sgi = Math.min(1, Math.floor(u / SEG3)), uu = u - sgi * SEG3; trans(k, w, h, uu, sgi, 1 - sgi); }; }
  const TA = 0.5, TB = 1.5;
  // 破片や紙の形（多角形）のパス。ページめくり（20）とガラス割れ（22）で使う
  function polyPath(k, pts) { k.beginPath(); pts.forEach((p, i) => i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1])); k.closePath(); }

  // @element 17
  // 17 プッシュ（次の画面が横から入ってきて、前の画面を一緒に押し出す）
  const SC17 = [scSea, scMtn];
  CELLS[16] = abCell((k, w, h, u, a, b) => {
    const p = eIO(P(u, TA - 0.05, TB + 0.1)), dir = a === 0 ? -1 : 1;
    if (p <= 0) return SC17[a](k, w, h);
    if (p >= 1) return SC17[b](k, w, h);
    k.save(); k.translate(dir * p * w, 0); SC17[a](k, w, h); k.restore();
    k.save(); k.translate(dir * (p - 1) * w, 0); SC17[b](k, w, h); k.restore();
    const ex = dir < 0 ? w * (1 - p) : w * p;
    k.fillStyle = C.navy; k.fillRect(ex - 3, 0, 6, h);
  });

  // @element 18
  // 18 ブラインド（細い帯ごとのすき間がだんだん広がって、次の画面が開く）
  CELLS[17] = abCell((k, w, h, u, a, b) => {
    const p = eIOs(P(u, TA - 0.1, TB + 0.15)), N = 7, sh = h / N, S = [scrA, scrB];
    S[a](k, w, h);
    if (p <= 0) return;
    k.save(); k.beginPath(); for (let i = 0; i < N; i++) k.rect(0, i * sh, w, sh * p + (p > 0.999 ? 1 : 0)); k.clip(); S[b](k, w, h); k.restore();
  });

  // @element 19
  // 19 キューブ（立方体が回るように、前の面が奥へ倒れて次の面が現れる）
  const CFW = 250, CFH = 146, CF = [mkCanvas(CFW, CFH), mkCanvas(CFW, CFH)];
  function cubeFace(i) {
    const g = CF[i].getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CFW, CFH);
    g.fillStyle = i ? C.mint : C.coral; g.fillRect(0, 0, CFW, CFH);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 4; g.strokeRect(12, 12, CFW - 24, CFH - 24);
    txt(g, i ? 'B' : 'A', 78, CFH / 2 + 4, `800 104px ${DISP}`, i ? C.navy : '#fff', 'center', 'middle');
    g.fillStyle = i ? C.navy : '#fff'; g.globalAlpha = 0.8; rr(g, 140, 46, 78, 14, 7); g.fill(); g.globalAlpha = 0.45; rr(g, 140, 72, 60, 12, 6); g.fill(); rr(g, 140, 94, 70, 12, 6); g.fill(); g.globalAlpha = 1;
    return CF[i];
  }
  CELLS[18] = abCell((k, w, h, u, a, b) => {
    stage(k);
    const phi = (Math.PI / 2) * eIO(P(u, TA - 0.05, TB + 0.1)), c = Math.cos(phi), s = Math.sin(phi), HW = CFW / 2, D = 820, X = w / 2, Y = h / 2 - 4;
    const rot = (x, z) => [x * c - z * s, x * s + z * c];
    const FL = rot(-HW, HW), FR = rot(HW, HW), BR = rot(HW, -HW);
    const pj = p => { const f = D / (D - (p[1] - HW)); return [X + p[0] * f, f]; };
    k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(X, h - 16, HW * (c + s) * 0.95, 7, 0, 0, 7); k.fill();
    const face = (img, P0, P1, shade) => {
      const A0 = pj(P0), A1 = pj(P1); if (A1[0] - A0[0] < 1) return;
      const STEP = 2;
      for (let sx = 0; sx < CFW; sx += STEP) {
        const t0 = sx / CFW, t1 = Math.min(1, (sx + STEP) / CFW);
        const q0 = pj([lerp(P0[0], P1[0], t0), lerp(P0[1], P1[1], t0)]), q1 = pj([lerp(P0[0], P1[0], t1), lerp(P0[1], P1[1], t1)]);
        const hh = CFH * q0[1]; k.drawImage(img, sx, 0, STEP, CFH, q0[0], Y - hh / 2, q1[0] - q0[0] + 0.7, hh);
      }
      if (shade > 0.01) { k.fillStyle = `rgba(8,14,40,${shade})`; k.beginPath(); k.moveTo(A0[0], Y - CFH * A0[1] / 2); k.lineTo(A1[0], Y - CFH * A1[1] / 2); k.lineTo(A1[0], Y + CFH * A1[1] / 2); k.lineTo(A0[0], Y + CFH * A0[1] / 2); k.closePath(); k.fill(); }
    };
    face(cubeFace(a), FL, FR, 0.55 * s);
    face(cubeFace(b), FR, BR, 0.55 * c);
  });

  // @element 20
  // 20 ページめくり（角から紙がめくれて裏返り、下から次のページが現れる）
  function paper(k, w, h, i) {
    k.fillStyle = i ? C.cream : '#FFFFFF'; k.fillRect(0, 0, w, h);
    txt(k, i ? 'PAGE 2' : 'PAGE 1', 30, 58, `800 46px ${DISP}`, C.navy, 'left', 'middle', '1px');
    k.fillStyle = i ? '#EBD9B4' : '#D7DCEA';[[96, 230], [122, 250], [148, 200], [174, 236]].forEach(([y, ww]) => { rr(k, 30, y, ww, 12, 6); k.fill(); });
    k.fillStyle = i ? C.mint : C.coral; rr(k, 310, 26, 200, 156, 14); k.fill();
    k.fillStyle = '#fff'; k.beginPath(); k.arc(462, 66, 18, 0, 7); k.fill();
    k.beginPath(); k.moveTo(326, 168); k.lineTo(390, 92); k.lineTo(440, 150); k.lineTo(462, 126); k.lineTo(496, 168); k.closePath(); k.fill();
  }
  function clipHalf(poly, d, s0, keepLess) { const out = [], f = p => (p[0] - CW) * d[0] + (p[1] - CH) * d[1] - s0; for (let i = 0; i < poly.length; i++) { const A = poly[i], B = poly[(i + 1) % poly.length], fa = f(A), fb = f(B), ia = keepLess ? fa <= 0 : fa >= 0, ib = keepLess ? fb <= 0 : fb >= 0; if (ia) out.push(A); if (ia !== ib) { const t = fa / (fa - fb); out.push([lerp(A[0], B[0], t), lerp(A[1], B[1], t)]); } } return out; }
  CELLS[19] = abCell((k, w, h, u, a, b) => {
    const dl = Math.hypot(1, 0.42), d = [-1 / dl, -0.42 / dl], sM = 600 * eIOs(P(u, TA - 0.15, TB + 0.25));
    paper(k, w, h, b);
    if (sM >= 599) return;
    const rect = [[0, 0], [w, 0], [w, h], [0, h]], rest = clipHalf(rect, d, sM, false), corner = clipHalf(rect, d, sM, true);
    if (rest.length > 2) { k.save(); polyPath(k, rest); k.clip(); paper(k, w, h, a); k.restore(); }
    if (corner.length > 2 && sM > 0.5) {
      // 折り目の影（下のページ側）
      k.save(); polyPath(k, corner); k.clip();
      const mx = w + d[0] * sM, my = h + d[1] * sM, gr = k.createLinearGradient(mx, my, mx - d[0] * 50, my - d[1] * 50);
      gr.addColorStop(0, 'rgba(15,26,61,.35)'); gr.addColorStop(1, 'rgba(15,26,61,0)'); k.fillStyle = gr; k.fillRect(0, 0, w, h); k.restore();
      const flap = corner.map(p => { const s = (p[0] - w) * d[0] + (p[1] - h) * d[1], m = 2 * (sM - s); return [p[0] + m * d[0], p[1] + m * d[1]]; });
      k.save(); k.shadowColor = 'rgba(0,0,0,.35)'; k.shadowBlur = 14; k.shadowOffsetX = 4; k.shadowOffsetY = 4;
      polyPath(k, flap); k.fillStyle = a ? '#EADBB8' : '#E3E6EF'; k.fill(); k.restore();
      k.strokeStyle = 'rgba(255,255,255,.8)'; k.lineWidth = 2; polyPath(k, flap); k.stroke();
    }
  });

  // @element 21
  // 21 ピクセレート（画面がだんだん粗いモザイクになり、いちばん粗いところで切り替わって細かく戻る）
  const SMC = mkCanvas(CW, CH), SMK = SMC.getContext('2d');
  const BLV = [1, 2, 3, 4, 6, 8, 11, 15, 20, 27, 36];
  CELLS[20] = abCell((k, w, h, u, a, b) => {
    const S = [scField, scCity], p = P(u, TA - 0.3, TB + 0.4), tri = 1 - Math.abs(2 * p - 1), bs = BLV[Math.round(tri * (BLV.length - 1))];
    const scr = p < 0.5 ? a : b;
    if (bs <= 1) return S[scr](k, w, h);
    TK.setTransform(1, 0, 0, 1, 0, 0); TK.globalCompositeOperation = 'source-over'; TK.clearRect(0, 0, w, h); S[scr](TK, w, h);
    const sw = Math.ceil(w / bs), sh = Math.ceil(h / bs);
    SMK.setTransform(1, 0, 0, 1, 0, 0); SMK.clearRect(0, 0, CW, CH); SMK.imageSmoothingEnabled = true; SMK.imageSmoothingQuality = 'high'; SMK.drawImage(TMP, 0, 0, sw, sh);
    k.imageSmoothingEnabled = false; k.drawImage(SMC, 0, 0, sw, sh, 0, 0, sw * bs, sh * bs); k.imageSmoothingEnabled = true;
  });

  // @element 22
  // 22 ガラス割れ（画面がガラスのようにひび割れ、破片が飛び散って次の画面が現れる）
  const SHARDS = (() => {
    const R = rand(2222), I = [304, 92], NA = 13, RAD = [0, 40, 98, 175, 360], V = [];
    const angs = []; for (let i = 0; i < NA; i++) angs.push((i + (R() - 0.5) * 0.6) / NA * Math.PI * 2);
    for (let r = 0; r < RAD.length; r++) { V.push([]); for (let i = 0; i < NA; i++) { const rr_ = r ? RAD[r] * (0.85 + R() * 0.3) : 0, a = angs[i] + (r ? (R() - 0.5) * 0.12 : 0); V[r].push([I[0] + Math.cos(a) * rr_, I[1] + Math.sin(a) * rr_]); } }
    const sh = [];
    for (let r = 0; r < RAD.length - 1; r++) for (let i = 0; i < NA; i++) {
      const j = (i + 1) % NA, poly = r ? [V[r][i], V[r][j], V[r + 1][j], V[r + 1][i]] : [I, V[1][j], V[1][i]];
      const cxp = poly.reduce((s, p) => s + p[0], 0) / poly.length, cyp = poly.reduce((s, p) => s + p[1], 0) / poly.length;
      const dx = cxp - I[0], dy = cyp - I[1], dd = Math.hypot(dx, dy) || 1, sp = 220 + R() * 260;
      sh.push({ poly, c: [cxp, cyp], vx: dx / dd * sp, vy: dy / dd * sp * 0.7 - 120 * R(), spin: (R() - 0.5) * 8, dl: r * 0.035 + R() * 0.03 });
    }
    return { I, V, RAD, NA, sh };
  })();
  CELLS[21] = abCell((k, w, h, u, a, b) => {
    const S = [scMtn, scrA], crack = eOut(P(u, TA - 0.2, TA + 0.15)) * 420, tb = TA + 0.32;
    if (u < tb) {
      S[a](k, w, h);
      if (crack > 0) {
        const { I, V, RAD, NA } = SHARDS; k.strokeStyle = '#fff'; k.lineWidth = 3; k.lineCap = 'round'; k.lineJoin = 'round'; k.globalAlpha = 0.95;
        for (let i = 0; i < NA; i++) { k.beginPath(); k.moveTo(I[0], I[1]); for (let r = 1; r < RAD.length; r++) { if (RAD[r] * 0.85 > crack) break; k.lineTo(V[r][i][0], V[r][i][1]); } k.stroke(); }
        for (let r = 1; r < RAD.length - 1; r++) { if (RAD[r] * 1.4 > crack) break; k.beginPath(); for (let i = 0; i <= NA; i++) { const p = V[r][i % NA]; i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1]); } k.stroke(); }
        k.globalAlpha = 1;
        const fl = 1 - P(u, TA - 0.2, TA + 0.1); if (fl > 0) { k.fillStyle = '#fff'; star(k, I[0], I[1], 26 * fl + 6, 0.3, 0.3, 6); k.fill(); }
      }
      return;
    }
    S[b](k, w, h);
    TK.setTransform(1, 0, 0, 1, 0, 0); TK.globalCompositeOperation = 'source-over'; TK.clearRect(0, 0, w, h); S[a](TK, w, h);
    for (const s of SHARDS.sh) {
      const t = u - tb - s.dl; let al = 1, x = 0, y = 0, rt = 0, sc = 1;
      if (t > 0) { x = s.vx * t; y = s.vy * t + 0.5 * 1300 * t * t; rt = s.spin * t; sc = 1 - 0.35 * Math.min(1, t); al = 1 - P(t, 0.55, 1.0); }
      if (al <= 0) continue;
      k.save(); k.globalAlpha = al; k.translate(s.c[0] + x, s.c[1] + y); k.rotate(rt); k.scale(sc, sc); k.translate(-s.c[0], -s.c[1]);
      polyPath(k, s.poly); k.save(); k.clip(); k.drawImage(TMP, 0, 0); k.restore();
      k.strokeStyle = 'rgba(255,255,255,.85)'; k.lineWidth = 2.5; polyPath(k, s.poly); k.stroke();
      k.restore();
    }
  });

  // @element 23
  // 23 分解図（スマホの部品が層ごとにばらけて中の構造を見せ、また組み上がる）
  const XL = [
    { name: '背壳', o: [-27, -50, 54, 100, 10], side: '#B8483D', draw: g => { g.fillStyle = C.coral; rr(g, -27, -50, 54, 100, 10); g.fill(); g.fillStyle = C.navy; g.beginPath(); g.arc(-12, -34, 7, 0, 7); g.fill(); g.beginPath(); g.arc(2, -34, 5, 0, 7); g.fill(); } },
    { name: '电池', o: [-21, -40, 42, 68, 6], side: '#17946F', draw: g => { g.fillStyle = C.mint; rr(g, -21, -40, 42, 68, 6); g.fill(); g.fillStyle = '#fff'; g.fillRect(-3, -18, 6, 20); g.fillRect(-10, -11, 20, 6); } },
    { name: '主板', o: [-25, -48, 50, 96, 6], side: '#2550B5', draw: g => { g.fillStyle = C.blue; rr(g, -25, -48, 50, 96, 6); g.fill(); g.fillStyle = C.yel; g.fillRect(-16, -38, 16, 14); g.fillRect(4, -30, 12, 10); g.fillRect(-14, 8, 26, 14); g.fillStyle = C.mint; g.fillRect(-18, -14, 34, 3); g.fillRect(-4, 26, 3, 16); } },
    { name: '屏幕', o: [-27, -50, 54, 100, 10], side: '#AEB8D4', draw: g => { g.fillStyle = '#fff'; rr(g, -27, -50, 54, 100, 10); g.fill(); g.fillStyle = C.navy2; rr(g, -22, -44, 44, 88, 6); g.fill(); for (let i = 0; i < 6; i++) { g.fillStyle = PAL[i % 4]; rr(g, -16 + (i % 2) * 18, -36 + Math.floor(i / 2) * 18, 13, 13, 3); g.fill(); } } },
  ];
  const ISO = (px, py) => [(px - py) * 0.866, (px + py) * 0.5];
  CELLS[22] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const X = 200, Y = 156, SP = 30, SC = 0.85;
    const ex = i => backOut(P(u, 0.45 + i * 0.08, 1.2 + i * 0.08), 1.3) * (1 - eIO(P(u, 3.25 + (3 - i) * 0.07, 3.95 + (3 - i) * 0.07)));
    const E = XL.map((_, i) => ex(i)), zs = E.map((e, i) => i * 7 + e * i * SP + 3 * Math.sin(2 * Math.PI * 2 * u / CYC + i) * clamp(e));
    k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(X, Y + 40, 64, 13, 0, 0, 7); k.fill();
    // 縦の補助線（ばらけたときだけ）
    const e3 = clamp(E[3]); if (e3 > 0.03) { k.save(); k.setLineDash([4, 7]); k.strokeStyle = C.dim; k.lineWidth = 2; k.globalAlpha = e3;[[-27, -50], [27, 50], [-27, 50]].forEach(([px, py]) => { const [ix, iy] = ISO(px * SC, py * SC); k.beginPath(); k.moveTo(X + ix, Y + iy - zs[0]); k.lineTo(X + ix, Y + iy - zs[3]); k.stroke(); }); k.restore(); }
    XL.forEach((L, i) => {
      const z = zs[i];
      for (let dz = 6; dz >= 1; dz--) { k.save(); k.translate(X, Y - z + dz); k.scale(SC, SC); k.transform(0.866, 0.5, -0.866, 0.5, 0, 0); k.fillStyle = L.side; rr(k, ...L.o); k.fill(); k.restore(); }
      k.save(); k.translate(X, Y - z); k.scale(SC, SC); k.transform(0.866, 0.5, -0.866, 0.5, 0, 0); L.draw(k); k.restore();
      // ラベル
      const a = clamp(E[i]); if (a > 0.03) {
        const [rx, ry] = ISO((L.o[0] + L.o[2]) * SC, L.o[1] * SC), sx = X + rx + 6, sy = Y + ry - z + 4, lx = 352, ly = Y + 8 - z - i * 2;
        k.globalAlpha = a; k.strokeStyle = C.dim; k.lineWidth = 2; k.beginPath(); k.moveTo(sx, sy); k.lineTo(lx - 10, ly); k.stroke();
        k.fillStyle = C.dim; k.beginPath(); k.arc(sx, sy, 4, 0, 7); k.fill();
        txt(k, L.name, lx, ly + 1, `800 26px ${JP}`, '#fff', 'left', 'middle'); k.globalAlpha = 1;
      }
    });
  };

  // @element 24
  // 24 スプリットスクリーン（1枚の画面が2つ、3つに分かれて、別々の場面が同時に動く）
  CELLS[23] = (k, w, h, u) => {
    u = snapU(u);
    const s2 = eIO(P(u, 0.45, 0.95)), s3 = eIO(P(u, 1.4, 1.9)), m = eIO(P(u, 3.75, 4.4));
    let b1 = lerp(lerp(w, w / 2, s2), w / 3, s3), b2 = lerp(w, 2 * w / 3, s3);
    b1 = lerp(b1, w, m); b2 = lerp(b2, w, m);
    pnSea(k, 0, b1, h, u, false);
    if (b1 < w - 0.5) pnCity(k, b1, Math.max(b1, b2), h, u, false);
    if (b2 < w - 0.5) pnField(k, b2, w, h, u, false);
    k.fillStyle = '#fff';[b1, b2].forEach(b => { if (b < w - 0.5) k.fillRect(b - 3, 0, 6, h); });
  };

  // @element 25
  // 25 テキストモーフ / 文字逐字变换（Text morph）：蓝色按钮里的文字按「保存 → 已保存 → 再次保存 → 保存」依次变化，变化时刻 0.6、2.0、3.4 秒。
  // 两个词之间按最长公共子序列配对：相同的字（如「保存」）留下来，只用 0.5 秒 easeInOut（3 次方）平移到新位置；
  // 消失的字 0.25 秒内向上移 16px 并淡出；新出现的字从 0.15 秒起每字错开 0.06 秒，0.3 秒 easeOut（3 次方）从下方 18px 翻入，刚出现时为黄色、0.4 秒内变回白色。
  // 按钮宽度（文字宽 + 左右各 48px）同样 0.5 秒 easeInOut 平滑变化。字号 60px。3.95 秒后回到「保存」静止，到周期末与开头一致。
  // 与「文字乱码解码」「打字机效果」的区别：不出现乱码、也不逐字敲出，没变的字始终可见只是挪位置，只有变化的那几个字在换。
  const TMORPH_W = ['保存', '已保存', '再次保存'], TMORPH_SEQ = [[0.6, 0, 1], [2.0, 1, 2], [3.4, 2, 0]], TMORPH_F = `800 60px ${JP}`, TMORPH_PAD = 48;
  const TMORPH_LAY = TMORPH_W.map(s => chars(TK, s, TMORPH_F, 2));
  // 两个词的最长公共子序列：返回 [[旧下标, 新下标], …]
  const TMORPH_LCS = (a, b) => {
    const A = [...a], B = [...b], L = A.map(() => B.map(() => 0));
    const g = (i, j) => (i < A.length && j < B.length ? L[i][j] : 0);
    for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? 1 + g(i + 1, j + 1) : Math.max(g(i + 1, j), g(i, j + 1));
    const out = []; let i = 0, j = 0;
    while (i < A.length && j < B.length) { if (A[i] === B[j]) { out.push([i, j]); i++; j++; } else if (g(i + 1, j) >= g(i, j + 1)) i++; else j++; }
    return out;
  };
  const TMORPH_PAIRS = TMORPH_SEQ.map(([, a, b]) => TMORPH_LCS(TMORPH_W[a], TMORPH_W[b]));
  const TMORPH_WID = i => { const c = TMORPH_LAY[i]; return c[c.length - 1].x + c[c.length - 1].w / 2 - (c[0].x - c[0].w / 2); };
  CELLS[24] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const CX = w / 2, Y = 92;
    // 当前所处的变化段
    let si = -1; for (let i = 0; i < TMORPH_SEQ.length; i++) if (u >= TMORPH_SEQ[i][0]) si = i;
    const glyphs = [];   // [字, x, dy, alpha, 黄色程度]
    let bw;
    if (si < 0) { TMORPH_LAY[0].forEach(c => glyphs.push([c.ch, c.x, 0, 1, 0])); bw = TMORPH_WID(0); }
    else {
      const [t0, a, b] = TMORPH_SEQ[si], d = u - t0, la = TMORPH_LAY[a], lb = TMORPH_LAY[b], pairs = TMORPH_PAIRS[si];
      const mv = eIO(P(d, 0, 0.5));
      const keptA = new Set(pairs.map(p => p[0])), keptB = new Set(pairs.map(p => p[1]));
      pairs.forEach(([i, j]) => glyphs.push([lb[j].ch, lerp(la[i].x, lb[j].x, mv), 0, 1, 0]));
      // 消失的字：向上 16px 淡出
      la.forEach((c, i) => { if (keptA.has(i)) return; const q = P(d, 0, 0.25); if (q < 1) glyphs.push([c.ch, c.x, -16 * eOut(q), 1 - q, 0]); });
      // 新出现的字：错开 0.06 秒，从下方 18px 翻入
      let n = 0;
      lb.forEach((c, j) => {
        if (keptB.has(j)) return;
        const s = 0.15 + 0.06 * n++, q = eOut(P(d, s, s + 0.3));
        if (q > 0) glyphs.push([c.ch, c.x, 18 * (1 - q), q, 1 - P(d, s, s + 0.4)]);
      });
      bw = lerp(TMORPH_WID(a), TMORPH_WID(b), mv);
    }
    // 按钮（宽度平滑变化）
    const BW = bw + TMORPH_PAD * 2, BH = 96;
    k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(CX, Y + BH / 2 + 14, BW * 0.46, 6, 0, 0, 7); k.fill();
    k.fillStyle = C.blue; rr(k, CX - BW / 2, Y - BH / 2, BW, BH, BH / 2); k.fill();
    k.fillStyle = 'rgba(255,255,255,.14)'; rr(k, CX - BW / 2, Y - BH / 2, BW, BH / 2, [BH / 2, BH / 2, 0, 0]); k.fill();
    k.save(); rr(k, CX - BW / 2, Y - BH / 2, BW, BH, BH / 2); k.clip();
    for (const [ch, x, dy, al, yl] of glyphs) { k.globalAlpha = al; txt(k, ch, CX + x, Y + 2 + dy, TMORPH_F, mix(C.white, C.yel, clamp(yl)), 'center', 'middle'); }
    k.globalAlpha = 1; k.restore();
    // 下方：三个状态的进度标记
    const cur = si < 0 ? 0 : TMORPH_SEQ[si][2], LX = [w / 2 - 150, w / 2, w / 2 + 150];
    k.fillStyle = C.navy3; rr(k, LX[0], 182, LX[2] - LX[0], 4, 2); k.fill();
    TMORPH_W.forEach((s, i) => {
      k.fillStyle = i === cur ? C.yel : C.navy3; k.beginPath(); k.arc(LX[i], 184, i === cur ? 8 : 6, 0, 7); k.fill();
      txt(k, s, LX[i] + (i === 2 ? 14 : i === 0 ? -14 : 0), 184 + (i === 1 ? -20 : 0), `700 16px ${JP}`, i === cur ? '#fff' : C.dim, i === 0 ? 'right' : i === 2 ? 'left' : 'center', 'middle');
    });
  };

  // @element 26
  // 改写自 ui2v · illli Ai Studio · broll-wave-interference（MIT-0）
  // 26 波的干涉：三条横向泳道，上两条是向相反方向行进的波 A（青 #67e8f9）与波 B（橙 #ffb454），下方合成泳道把两者逐点相加 y₁ + y₂，
  // 一根竖直采样虚线上三个圆点实时读出 A、B 与合成值，合成波时而相长（加高）时而相消（压平）。
  // 时间按原作 8 秒 × 0.55 映射：面板 0.07–0.42 秒由 0.96 倍放大并淡入（三次缓出 = power2.out）；波 A、B 0.25 / 0.34 秒起 0.36 秒从左 20px 滑入（四次缓出 = power3.out）；
  // 合成泳道 0.59 秒起从下 20px 滑入；「+」号 0.8 秒起 0.23 秒回弹放大（back 1.8）；合成波振幅 0.88–1.62 秒由 0 增到满（三次缓入缓出）；
  // 相位 0.6–3.74 秒匀速走 5π；采样线 1.4 秒淡入，三个采样点 1.44 秒起每隔 0.044 秒回弹出现（back 2）；合成线宽 1.87–2.97 秒按正弦脉动 2 次（2.7→3.9px）。
  // 4.22–4.39 秒内容淡出（原 7.68 秒 0.3 秒淡出），只留背景网格，与 u=0 画面相同。
  // 波函数照抄：a = sin(0.012x + φ)，b = sin(0.012x − 0.62φ + 1.08)，x 取原作 190–1660；源波振幅 58、合成 66（原 1740×730 坐标）。
  // 尺寸换算：面板 1740×730 → 523×196（横 ×0.3006、纵 ×0.2685），去掉标题与页脚；标签字号放大到 10px / 8px。配色照抄原作 CSS 变量。
  const WAVE_SX = 8, WAVE_SY = 6, WAVE_KX = 523 / 1740, WAVE_KY = 196 / 730, WAVE_S = 0.55;
  const WAVE_q4o = x => 1 - Math.pow(1 - x, 4);                               // power3.out
  const WAVE_sIO = x => -(Math.cos(Math.PI * x) - 1) / 2;                    // sine.inOut
  const WAVE_X = (x) => WAVE_SX + x * WAVE_KX, WAVE_Y = (y) => WAVE_SY + y * WAVE_KY;
  const WAVE_LANES = [[26, 188, 120, '波 A', 'y₁(x,t)', '#eefdf8'], [238, 188, 332, '波 B', 'y₂(x,t)', '#eefdf8'], [486, 218, 595, '合成', 'y₁ + y₂', '#d8fff2']];
  function WAVE_lane(k, i) {
    const [y0, hh, base, lb, fm, col] = WAVE_LANES[i];
    k.fillStyle = '#101b1f'; k.strokeStyle = '#29464e'; k.lineWidth = 0.8;
    rr(k, WAVE_X(26), WAVE_Y(y0), 1688 * WAVE_KX, hh * WAVE_KY, 7); k.fill(); k.stroke();
    k.strokeStyle = '#46636a'; k.lineWidth = 0.8; k.setLineDash([2.1, 3.3]);
    k.beginPath(); k.moveTo(WAVE_X(190), WAVE_Y(base)); k.lineTo(WAVE_X(1660), WAVE_Y(base)); k.stroke(); k.setLineDash([]);
    txt(k, lb, WAVE_X(52), WAVE_Y(base) - 3, `900 10px ${JP}`, col);
    txt(k, fm, WAVE_X(52), WAVE_Y(base) + 9, `700 8px ui-monospace, Menlo, monospace`, '#91aaa5');
  }
  function WAVE_curve(k, base, amp, kind, ph, col, lw) {
    k.beginPath();
    for (let x = 190; x <= 1660; x += 15) {
      const a = Math.sin(x * 0.012 + ph), b = Math.sin(x * 0.012 - ph * 0.62 + 1.08), v = kind === 0 ? a : kind === 1 ? b : a + b;
      const px = WAVE_X(x), py = WAVE_Y(base - v * amp); x === 190 ? k.moveTo(px, py) : k.lineTo(px, py);
    }
    k.lineCap = 'round'; k.lineJoin = 'round';
    const ga = k.globalAlpha; k.strokeStyle = col; k.lineWidth = lw * 2.6; k.globalAlpha = ga * 0.22; k.stroke();   // 原 drop-shadow 12px 光晕
    k.globalAlpha = ga; k.lineWidth = lw; k.stroke();
  }
  const WAVE_BG = (() => {                                                   // 静态底：右上径向光 + 14.4px 网格（原 48px）
    const c = mkCanvas(CW, CH), g = c.getContext('2d');
    const r = g.createRadialGradient(CW * 0.76, CH * 0.2, 0, CW * 0.76, CH * 0.2, CW * 0.3); r.addColorStop(0, '#123139'); r.addColorStop(1, 'rgba(18,49,57,0)');
    g.fillStyle = r; g.fillRect(0, 0, CW, CH);
    g.fillStyle = 'rgba(103,232,249,.055)'; for (let x = 0; x < CW; x += 14.4) g.fillRect(x, 0, 1, CH); for (let y = 0; y < CH; y += 14.4) g.fillRect(0, y, CW, 1);
    return c;
  })();
  // GSAP yoyo：从 t0 起每 d 秒走半程，共 n 个半程，返回 0..1..0 的正弦缓动值
  const WAVE_yoyo = (t, t0, d, n) => { const q = (t - t0) / d; if (q <= 0 || q >= n) return 0; const f = q % 1; return WAVE_sIO(Math.floor(q) % 2 ? 1 - f : f); };
  CELLS[25] = (k, w, h, u) => {
    u = snapU(u);
    const t = u / WAVE_S;                                                      // 换回原作时间轴
    stage(k, '#081013');
    k.drawImage(WAVE_BG, 0, 0);
    const out = 1 - eIn(P(t, 7.68, 7.98));                                      // 原 power2.in 淡出
    const sc = eOut(P(t, 0.12, 0.77));
    if (sc <= 0 || out <= 0) return;
    const ph = Math.PI * 5 * P(t, 1.1, 6.8), mixA = eIO(P(t, 1.6, 2.95));
    k.save(); k.globalAlpha = sc * out;
    k.translate(w / 2, h / 2); k.scale(0.96 + 0.04 * sc, 0.96 + 0.04 * sc); k.translate(-w / 2, -h / 2);
    k.fillStyle = 'rgba(5,13,16,.68)'; k.fillRect(WAVE_SX, WAVE_SY, 1740 * WAVE_KX, 730 * WAVE_KY);
    k.strokeStyle = '#31515a'; k.lineWidth = 0.8; k.strokeRect(WAVE_SX + 0.4, WAVE_SY + 0.4, 1740 * WAVE_KX - 0.8, 730 * WAVE_KY - 0.8);
    // 波 A、B：从左 70（→20px）滑入
    [[0.45, 0, '#67e8f9'], [0.61, 1, '#ffb454']].forEach(([s, i, col]) => {
      const e = WAVE_q4o(P(t, s, s + 0.65)); if (e <= 0) return;
      k.save(); k.globalAlpha = sc * out * e; k.translate(-20 * (1 - e), 0);
      WAVE_lane(k, i); WAVE_curve(k, WAVE_LANES[i][2], 58, i, ph, col, 2.1); k.restore();
    });
    // 合成：从下 70（→19px）滑入
    const er = WAVE_q4o(P(t, 1.08, 1.73));
    if (er > 0) {
      k.save(); k.globalAlpha = sc * out * er; k.translate(0, 19 * (1 - er));
      WAVE_lane(k, 2);
      const pulse = 4 * WAVE_yoyo(t, 3.4, 0.5, 4);                             // 线宽 9→13 往返 2 次（原 yoyo repeat 3）
      if (mixA > 0) WAVE_curve(k, 595, 66 * mixA, 2, ph, '#d8fff2', (9 + pulse) * 0.3);
      // 采样线与三个采样点（x = 1160）
      const sl = P(t, 2.55, 2.9);
      const sa = Math.sin(1160 * 0.012 + ph), sb = Math.sin(1160 * 0.012 - ph * 0.62 + 1.08);
      if (sl > 0) {
        k.save(); k.globalAlpha *= sl * 0.55; k.strokeStyle = '#d8fff2'; k.lineWidth = 0.8; k.setLineDash([1.5, 2.4]);
        k.beginPath(); k.moveTo(WAVE_X(1160), WAVE_Y(45)); k.lineTo(WAVE_X(1160), WAVE_Y(686)); k.stroke(); k.restore();
        k.save(); k.globalAlpha *= sl;
        txt(k, `振幅 ${(sa + sb) * mixA >= 0 ? '+' : '−'}${Math.abs((sa + sb) * mixA).toFixed(2)}`, WAVE_X(1160) + 7, WAVE_Y(510), `700 9px ui-monospace, Menlo, monospace`, '#d8fff2');
        k.restore();
      }
      [[120 - sa * 58, 2.1], [332 - sb * 58, 2.1], [595 - (sa + sb) * 66 * mixA, 3]].forEach(([cy, r], i) => {
        const d = backOut(P(t, 2.62 + i * 0.08, 2.97 + i * 0.08), 2); if (d <= 0) return;
        k.fillStyle = '#d8fff2'; k.beginPath(); k.arc(WAVE_X(1160), WAVE_Y(cy), r * d, 0, 7); k.fill();
      });
      k.restore();
    }
    // 「+」号
    const pl = P(t, 1.45, 1.87);
    if (pl > 0) {
      const s = 0.2 + 0.8 * backOut(pl, 1.8);
      k.save(); k.globalAlpha = sc * out * clamp(pl * 1.5); k.translate(WAVE_X(870), WAVE_Y(452)); k.scale(s, s);
      txt(k, '+', 0, 0, `900 16px ${DISP}`, '#d8fff2', 'center', 'middle'); k.restore();
    }
    k.restore();
  };

  // @element 27
  // 改写自 ui2v · illli Ai Studio · broll-probability-cloud（MIT-0）
  // 27 散点聚成正态分布：紫色坐标区里 98 个观测点先散成一团云，再一个个落进 13 列、高度 1-2-4-7-11-15-18-15-11-7-4-2-1 的钟形柱，均值线 μ 亮起锁定。
  // 时间按原作 8 秒 × 0.55 映射：点 0.11 秒起从中间向两侧每隔 0.0022 秒回弹出现（0.22 秒、back 1.6，透明度到 0.78）；均值线 0.28–0.58 秒自下而上长出（透明度 0.28）；
  // 每 3 个点中 1 个 0.44–1.1 秒按 0.82 倍往返 3 个半程（缩→回→缩，停在 0.82 倍）；1.13 秒起各点按 (i mod 13)×0.0066 秒错开、用时 1.29–1.46 秒（四次缓入缓出 = power3.inOut）飞到钟形位置；
  // 计数 1.13–2.6 秒从 000 升到 098（三次缓入缓出）；状态字 2.0 秒变「分布浮现」、3.05 秒变「均值锁定 / μ」；均值线 2.61 秒起变实；每 6 个点中 1 个（橙色大点）2.83 秒起放大到 1.28 倍再回落；
  // 坐标区 3.55–3.99 秒微放大到 1.012 倍；4.19–4.38 秒点、均值线与文字淡出，只剩坐标轴与网格，与 u=0 相同。
  // 点的初始位置照抄原作确定性公式：sx = 70 + (149k mod 1510)，sy = 60 + ((97k + 11k²) mod 430)；终点 fx = 118 + 121·列，fy = 620 − 27·行。
  // 尺寸换算：坐标区 1680×700 → 479×192（横 ×0.285、纵 ×0.274），点直径 17 / 22 → 5.4 / 7px。配色照抄：底 #17152d、紫 #8a72ff、橙 #ffbf69、轴 #5a5478、字 #f3f0ff / #9890b8。
  const PCLD_X = 32, PCLD_Y = 8, PCLD_KX = 479 / 1680, PCLD_KY = 192 / 700, PCLD_S = 0.55;
  const PCLD_DOTS = (() => {
    const counts = [1, 2, 4, 7, 11, 15, 18, 15, 11, 7, 4, 2, 1], o = []; let k = 0;
    counts.forEach((n, col) => { for (let row = 0; row < n; row++) { o.push({ sx: 70 + ((k * 149) % 1510), sy: 60 + ((k * 97 + k * k * 11) % 430), fx: 118 + col * 121, fy: 620 - row * 27, big: (k + 1) % 6 === 0, third: (k + 1) % 3 === 0 }); k++; } });
    return o;
  })();
  const PCLD_qIO4 = x => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2);   // power3.inOut
  const PCLD_qIO3 = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);       // power2.inOut
  const PCLD_sIO = x => -(Math.cos(Math.PI * x) - 1) / 2;
  // GSAP yoyo 共 n 个半程：奇数个半程结束后停在终值（原作每 3 个点的 0.82 倍缩放 repeat 2 即停在 0.82）
  const PCLD_yoyo = (t, t0, d, n) => { const q = (t - t0) / d; if (q <= 0) return 0; if (q >= n) return n % 2; const f = q % 1; return PCLD_sIO(Math.floor(q) % 2 ? 1 - f : f); };
  const PCLD_BG = (() => {
    const c = mkCanvas(CW, CH), g = c.getContext('2d');
    g.fillStyle = '#17152d'; g.fillRect(0, 0, CW, CH);
    const a = g.createRadialGradient(CW * 0.5, CH * 0.46, 0, CW * 0.5, CH * 0.46, CW * 0.38); a.addColorStop(0, 'rgba(138,114,255,.25)'); a.addColorStop(1, 'rgba(138,114,255,0)'); g.fillStyle = a; g.fillRect(0, 0, CW, CH);
    const b = g.createRadialGradient(CW * 0.22, CH * 0.7, 0, CW * 0.22, CH * 0.7, CW * 0.26); b.addColorStop(0, 'rgba(255,191,105,.09)'); b.addColorStop(1, 'rgba(255,191,105,0)'); g.fillStyle = b; g.fillRect(0, 0, CW, CH);
    g.fillStyle = 'rgba(243,240,255,.045)';
    for (let x = 0; x <= 1680; x += 70) g.fillRect(PCLD_X + x * PCLD_KX, PCLD_Y, 1, 700 * PCLD_KY);
    for (let y = 0; y <= 700; y += 70) g.fillRect(PCLD_X, PCLD_Y + y * PCLD_KY, 1680 * PCLD_KX, 1);
    g.fillStyle = '#5a5478'; g.fillRect(PCLD_X - 1, PCLD_Y, 1.2, 700 * PCLD_KY); g.fillRect(PCLD_X - 1, PCLD_Y + 700 * PCLD_KY - 1.2, 1680 * PCLD_KX + 1, 1.2);
    return c;
  })();
  CELLS[26] = (k, w, h, u) => {
    u = snapU(u);
    const t = u / PCLD_S;
    k.drawImage(PCLD_BG, 0, 0);
    const out = 1 - eIn(P(t, 7.62, 7.96));
    if (t < 0.2 || out <= 0) return;
    const ps = 1 + 0.012 * PCLD_sIO(P(t, 6.45, 7.25));
    k.save(); k.globalAlpha = out;
    k.translate(PCLD_X + 840 * PCLD_KX, PCLD_Y + 350 * PCLD_KY); k.scale(ps, ps); k.translate(-(PCLD_X + 840 * PCLD_KX), -(PCLD_Y + 350 * PCLD_KY));
    // 均值线 μ（坐标区正中，顶端距上沿 34）
    const mg = eOut(P(t, 0.5, 1.05)), mx = PCLD_X + 840 * PCLD_KX, mb = PCLD_Y + 700 * PCLD_KY, mt = PCLD_Y + 34 * PCLD_KY;
    if (mg > 0) {
      const ma = mg * lerp(0.28, 1, eOut(P(t, 4.75, 5.2)));
      k.save(); k.globalAlpha = out * ma; k.fillStyle = '#ffbf69'; k.fillRect(mx - 0.5, lerp(mb, mt, mg), 1.2, (mb - mt) * mg);
      txt(k, 'μ', mx - 4, mt + 1, `italic 900 12px Georgia, serif`, '#ffbf69', 'right', 'top'); k.restore();
    }
    // 98 个点
    k.shadowColor = 'rgba(138,114,255,.45)'; k.shadowBlur = 4;
    PCLD_DOTS.forEach((d, i) => {
      const ap = P(t, 0.2 + Math.abs(i - 49) * 0.004, 0.6 + Math.abs(i - 49) * 0.004); if (ap <= 0) return;
      let s = backOut(ap, 1.6);
      if (d.third) s *= 1 - 0.18 * PCLD_yoyo(t, 0.8, 0.4, 3);
      if (d.big) s *= 1 + 0.28 * PCLD_yoyo(t, 5.15, 0.42, 2);
      const t0 = 2.05 + (i % 13) * 0.012, mv = PCLD_qIO4(P(t, t0, t0 + 2.35 + (i % 6) * 0.06));
      const r = d.big ? 11 : 8.5, x = PCLD_X + (lerp(d.sx, d.fx, mv) + r) * PCLD_KX, y = PCLD_Y + (lerp(d.sy, d.fy, mv) + r) * PCLD_KY;
      k.globalAlpha = out * clamp(ap * 2.5) * lerp(0.78, 1, mv);
      k.fillStyle = d.big ? '#ffbf69' : '#8a72ff'; k.beginPath(); k.arc(x, y, (d.big ? 3.5 : 2.7) * s, 0, 7); k.fill();
    });
    k.shadowBlur = 0; k.shadowColor = 'transparent';
    k.restore();
    // 文字：坐标轴刻度、左上状态、右上计数（随原作标题 0–0.55 秒淡入，三次缓出）
    k.save(); k.globalAlpha = out * eOut(P(t, 0.2, 0.75));
    ['−3σ', '−2σ', '−1σ', 'μ', '+1σ', '+2σ', '+3σ'].forEach((s, i) => txt(k, s, PCLD_X + (115 + 8 + i * (1450 - 16) / 6) * PCLD_KX, PCLD_Y + 700 * PCLD_KY - 4, `700 8px ui-monospace, Menlo, monospace`, '#9890b8', 'center', 'alphabetic'));
    const phase = t >= 5.55 ? '均值锁定 / μ' : t >= 3.65 ? '分布浮现' : '样本未定';
    txt(k, phase, PCLD_X + 8, PCLD_Y + 16, `800 11px ${JP}`, '#ffbf69');
    const n = Math.round(98 * PCLD_qIO3(P(t, 2.05, 4.75)));
    txt(k, '观测', w - 64, PCLD_Y + 16, `700 9px ${JP}`, '#9890b8', 'right');
    txt(k, String(n).padStart(3, '0'), w - 16, PCLD_Y + 18, `700 17px ui-monospace, Menlo, monospace`, '#f3f0ff', 'right');
    k.restore();
  };

  // @element 28
  // 改写自 ui2v · illli Ai Studio · broll-network-diffusion（MIT-0）
  // 28 网络扩散：左侧源点亮起并放出 3 圈涟漪，信号沿 16 条曲线边一跳一跳向右传到 16 个节点，经过的边变成珊瑚色发光、到达的节点回弹点亮，左上角实时显示跳数与已触达节点数。
  // 时间按原作 8.5 秒 × 0.5 映射：源点 0.13–0.4 秒从 0.35 倍回弹出现（back 1.8）；3 圈涟漪 0.18 秒起每隔 0.11 秒放出、0.78 秒内由 0.3 倍扩到 4.8 倍并淡出（三次缓出）；
  // 16 条边的点亮时刻 0.35 / 0.46 / 1.03 / 1.13 / 1.21 / 1.31 / 1.73 / 1.81 / 1.9 / 1.99 / 2.08 / 2.17 / 2.26 / 2.83 / 2.95 / 3.08 秒，
  // 每条边 0.36 秒画完（三次缓入缓出 = power2.inOut），起点后 0.24 秒节点由 0.25 倍回弹出现（0.18 秒、back 1.7），跳数 = min(4, ⌊i/2⌋+1)、触达数 = i + 2；
  // 3.4 秒起三个光环依次放大到 1.2 倍并变淡；4.05–4.23 秒信号层淡出，回到只有暗色边的初始网络（与 u=0 相同）。
  // 尺寸换算：网络 1740×760 → 节点区 x 200–1640 映射到 20–519（×0.3465），y 30–730 映射到 8–200（×0.274），圆半径 ×0.31。
  // 配色照抄：底 #071421、信号 #ff7058、暗边 #315365、节点描边 #9bb0b8、字 #e8efe9 / #6f8794；节点标签译为「源」与 N1–N6。
  const NETD_KX = 499 / 1440, NETD_KY = 192 / 700, NETD_KR = 0.31, NETD_S = 0.5;
  const NETD_X = x => 20 + (x - 200) * NETD_KX, NETD_Y = y => 8 + (y - 30) * NETD_KY;
  const NETD_NODES = [[260, 380, 27, 58, '源'], [570, 220, 18, 39, 'N1'], [590, 500, 18, 39, 'N2'], [850, 115, 15, 0, 'N3'], [875, 300, 15, 0, 'N4'], [890, 415, 15, 0, 'N5'], [900, 625, 15, 0, 'N6'],
    [1165, 65, 12, 0], [1180, 195, 12, 0], [1200, 275, 12, 0], [1215, 365, 12, 0], [1230, 465, 12, 0], [1240, 570, 12, 0], [1280, 690, 12, 0], [1530, 115, 10, 0], [1580, 325, 10, 0], [1600, 500, 10, 0]];
  // 边：[起点节点, 终点节点, 控制点1 x, 控制点2 x]（原作三次贝塞尔，控制点 y 分别取起点、终点 y）
  const NETD_EDGES = [[0, 1, 390, 430], [0, 2, 400, 445], [1, 3, 690, 730], [1, 4, 700, 735], [2, 5, 715, 755], [2, 6, 720, 760], [3, 7, 990, 1025], [3, 8, 995, 1035],
    [4, 9, 1015, 1050], [4, 10, 1020, 1060], [5, 11, 1030, 1080], [6, 12, 1040, 1090], [6, 13, 1060, 1110], [7, 14, 1300, 1380], [10, 15, 1360, 1410], [11, 16, 1380, 1430]].map(([a, b, c1, c2]) => {
    const A = NETD_NODES[a], B = NETD_NODES[b], pts = [], cum = [0];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24, m = 1 - t;
      const x = m * m * m * A[0] + 3 * m * m * t * c1 + 3 * m * t * t * c2 + t * t * t * B[0], y = m * m * m * A[1] + 3 * m * m * t * A[1] + 3 * m * t * t * B[1] + t * t * t * B[1];
      pts.push([NETD_X(x), NETD_Y(y)]); if (i) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    return { b, pts, cum };
  });
  const NETD_START = [0.7, 0.92, 2.05, 2.25, 2.42, 2.62, 3.45, 3.62, 3.8, 3.98, 4.16, 4.34, 4.52, 5.65, 5.9, 6.15];
  const NETD_sIO = x => -(Math.cos(Math.PI * x) - 1) / 2;
  const NETD_BG = (() => {
    const c = mkCanvas(CW, CH), g = c.getContext('2d');
    g.fillStyle = '#071421'; g.fillRect(0, 0, CW, CH);
    const a = g.createRadialGradient(CW * 0.37, CH * 0.52, 0, CW * 0.37, CH * 0.52, CW * 0.26); a.addColorStop(0, 'rgba(255,112,88,.13)'); a.addColorStop(1, 'rgba(255,112,88,0)'); g.fillStyle = a; g.fillRect(0, 0, CW, CH);
    const b = g.createRadialGradient(CW * 0.78, CH * 0.48, 0, CW * 0.78, CH * 0.48, CW * 0.34); b.addColorStop(0, 'rgba(60,117,142,.2)'); b.addColorStop(1, 'rgba(60,117,142,0)'); g.fillStyle = b; g.fillRect(0, 0, CW, CH);
    for (let x = 4; x < CW; x += 9) for (let y = 4; y < CH; y += 9) {                     // 点阵（原 30px）两侧渐隐
      const f = clamp(Math.min(x, CW - x) / (CW * 0.16)); g.fillStyle = `rgba(232,239,233,${0.11 * f})`; g.fillRect(x, y, 1, 1);
    }
    g.strokeStyle = '#315365'; g.lineWidth = 1.3; g.lineCap = 'round';
    for (const e of NETD_EDGES) { g.beginPath(); e.pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); }
    return c;
  })();
  CELLS[27] = (k, w, h, u) => {
    u = snapU(u);
    const t = u / NETD_S;
    k.drawImage(NETD_BG, 0, 0);
    const out = 1 - eIn(P(t, 8.1, 8.45));
    if (out <= 0 || t < 0.25) return;
    k.save(); k.globalAlpha = out;
    // 亮边：按虚线偏移逐段画出
    k.lineCap = 'round'; k.lineJoin = 'round';
    let hop = 0, reached = 1;
    NETD_EDGES.forEach((e, i) => {
      const s = NETD_START[i]; if (t < s) return;
      const L = e.cum[e.cum.length - 1] * eIO(P(t, s, s + 0.72));
      k.beginPath(); k.moveTo(e.pts[0][0], e.pts[0][1]);
      for (let j = 1; j < e.pts.length; j++) {
        if (e.cum[j] <= L) { k.lineTo(e.pts[j][0], e.pts[j][1]); continue; }
        const q = (L - e.cum[j - 1]) / (e.cum[j] - e.cum[j - 1]); k.lineTo(lerp(e.pts[j - 1][0], e.pts[j][0], q), lerp(e.pts[j - 1][1], e.pts[j][1], q)); break;
      }
      k.strokeStyle = 'rgba(255,112,88,.28)'; k.lineWidth = 5; k.stroke();             // 原 drop-shadow 9px 光晕
      k.strokeStyle = '#ff7058'; k.lineWidth = 1.9; k.stroke();
      if (t >= s + 0.5) { hop = Math.min(4, Math.floor(i / 2) + 1); reached = i + 2; }
    });
    // 源点涟漪
    for (let r = 0; r < 3; r++) {
      const q = P(t, 0.35 + r * 0.22, 1.9 + r * 0.22); if (q <= 0 || q >= 1) continue;
      const e = eOut(q);
      k.save(); k.globalAlpha = out * 0.55 * (1 - e); k.strokeStyle = '#ff7058'; k.lineWidth = 1;
      k.beginPath(); k.arc(NETD_X(260), NETD_Y(380), 58 * NETD_KR * lerp(0.3, 4.8, e), 0, 7); k.stroke(); k.restore();
    }
    // 节点
    NETD_NODES.forEach(([x, y, cr, hr, lb], n) => {
      const s0 = n === 0 ? 0.25 : NETD_START[NETD_EDGES.findIndex(e => e.b === n)] + 0.48;
      const q = P(t, s0, s0 + (n === 0 ? 0.55 : 0.36)); if (q <= 0) return;
      const sc = lerp(n === 0 ? 0.35 : 0.25, 1, backOut(q, n === 0 ? 1.8 : 1.7)), active = n === 0 || t >= s0 - 0.01;
      const X = NETD_X(x), Y = NETD_Y(y);
      k.save(); k.globalAlpha = out * clamp(q * 1.6); k.translate(X, Y); k.scale(sc, sc);
      if (hr) {
        const hp = NETD_sIO(P(t, 6.8 + n * 0.025, 7.45 + n * 0.025));
        k.save(); k.globalAlpha *= lerp(0.35, 0.08, hp) / 1; k.strokeStyle = '#ff7058'; k.lineWidth = 1;
        k.beginPath(); k.arc(0, 0, hr * NETD_KR * (1 + 0.2 * hp), 0, 7); k.stroke(); k.restore();
      }
      k.fillStyle = active ? '#ff7058' : '#071421'; k.strokeStyle = active ? '#e8efe9' : '#9bb0b8'; k.lineWidth = n === 0 ? 1.9 : 1.25;
      k.beginPath(); k.arc(0, 0, Math.max(3, cr * NETD_KR), 0, 7); k.fill(); k.stroke();
      if (lb) txt(k, lb, 0, Math.max(3, cr * NETD_KR) + (n === 0 ? 13 : 10), `700 ${n === 0 ? 10 : 8}px ${n === 0 ? JP : 'ui-monospace, Menlo, monospace'}`, '#e8efe9', 'center', 'alphabetic');
      k.restore();
    });
    // 左上遥测（随原作状态栏 0.15–0.65 秒淡入）
    k.globalAlpha = out * eOut(P(t, 0.25, 0.75));
    txt(k, '跳数', 18, 22, `700 9px ${JP}`, '#6f8794');
    txt(k, String(hop).padStart(2, '0'), 44, 23, `700 13px ui-monospace, Menlo, monospace`, '#e8efe9');
    txt(k, `${String(reached).padStart(2, '0')} 个节点已触达`, 18, 38, `700 9px ${JP}`, '#e8efe9');
    k.restore();
  };

  // @element 29
  // 改写自 KittenJam Motion Library #1（Hannah）· 闪电砸落：两次闪白伴随折线闪电，「雷鸣」从 2.4 倍砸到 0.9 倍、回弹 1.06 倍并微震后停在 1 倍，之后保持黄色外发光；4.0–4.6 秒淡出复位。
  // 外发光用多层描边代替 shadowBlur，放大绘制时光晕比例不变。
  const LSTR_BOLT = [[318, 0], [280, 64], [312, 72], [254, 130], [290, 138], [238, 208]];
  CELLS[28] = (k, w, h, u) => {
    u = snapU(u);
    stage(k, '#0A1230');
    // 闪白两次：0.86–1.04 秒峰值 0.85，1.04–1.24 秒峰值 0.55
    const fl = u < 0.86 ? 0 : u < 0.9 ? 0.85 * P(u, 0.86, 0.9) : u < 1.04 ? 0.85 * (1 - P(u, 0.9, 1.04)) : u < 1.1 ? 0.55 * P(u, 1.04, 1.1) : 0.55 * (1 - P(u, 1.1, 1.24));
    let sc = 1, dx = 0, dy = 0, al = 1;
    if (u < 0.84) al = 0;
    else if (u < 1.0) { const q = eIn(P(u, 0.84, 1.0)); sc = lerp(2.4, 0.9, q); al = q; }
    else if (u < 1.12) { const q = P(u, 1.0, 1.12); sc = lerp(0.9, 1.06, q); dx = -4 * q; dy = 3 * q; }
    else if (u < 1.24) { const q = P(u, 1.12, 1.24); sc = lerp(1.06, 1, q); dx = lerp(-4, 3, q); dy = lerp(3, -2, q); }
    else if (u < 1.36) { const q = P(u, 1.24, 1.36); dx = 3 * (1 - q); dy = -2 * (1 - q); }
    al *= 1 - P(u, 4.0, 4.6);
    const glow = smooth(P(u, 1.24, 1.6));
    // 落地冲击环
    const ring = P(u, 1.0, 1.5);
    if (ring > 0 && ring < 1) { k.save(); k.globalAlpha = 0.6 * (1 - ring); k.strokeStyle = C.yel; k.lineWidth = 3; k.beginPath(); k.ellipse(w / 2, h / 2 + 46, 60 + 200 * eOut(ring), 8 + 18 * eOut(ring), 0, 0, 7); k.stroke(); k.restore(); }
    if (al > 0) {
      k.save(); k.translate(w / 2 + dx, h / 2 + 4 + dy); k.scale(sc, sc);
      k.font = `900 96px ${JP}`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.lineJoin = 'round';
      if (glow > 0) [[30, 0.1], [18, 0.16], [9, 0.28]].forEach(([lw, a]) => { k.globalAlpha = al * a * glow; k.strokeStyle = C.yel; k.lineWidth = lw; k.strokeText('雷鸣', 0, 0); });
      k.globalAlpha = al; k.fillStyle = '#fff'; k.fillText('雷鸣', 0, 0);
      k.restore();
    }
    // 闪电折线：0.86–1.3 秒逐渐变淡并闪烁
    const ba = u > 0.86 && u < 1.3 ? (1 - P(u, 0.86, 1.3)) * (H01(Math.floor(u * 40)) > 0.3 ? 1 : 0.4) : 0;
    if (ba > 0) {
      k.save(); k.lineJoin = 'round'; k.lineCap = 'round';
      const path = () => { k.beginPath(); LSTR_BOLT.forEach((p, i) => i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1])); };
      k.globalAlpha = 0.35 * ba; k.strokeStyle = C.yel; k.lineWidth = 12; path(); k.stroke();
      k.globalAlpha = ba; k.strokeStyle = '#fff'; k.lineWidth = 3.2; path(); k.stroke();
      k.restore();
    }
    if (fl > 0) { k.fillStyle = `rgba(255,255,255,${0.75 * fl})`; k.fillRect(0, 0, w, h); }
  };

  // @element 30
  // 改写自 KittenJam Motion Library #3（Hannah）· 硬币翻转：4 枚字币依次（间隔 0.2 秒）绕 Y 轴翻两圈（scaleX = cos）并上跳 96px，落地后再小跳 17px；正面是字，背面是星。
  const COIN_S = '好运连连', COIN_D = 0.2, COIN_T0 = 0.35, COIN_L = 1.7;
  CELLS[29] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const R = 36, GAP = 96, FLOOR = 170;
    k.fillStyle = C.navy2; rr(k, 40, FLOOR, w - 80, 4, 2); k.fill();
    [...COIN_S].forEach((ch, i) => {
      const x = w / 2 + (i - 1.5) * GAP, t = (u - COIN_T0 - i * COIN_D) / COIN_L;
      let y = 0, rot = 0;
      if (t > 0 && t < 1) {
        if (t < 0.28) { const q = t / 0.28; y = -96 * eOut(q); rot = Math.PI * 2 * q; }
        else if (t < 0.42) { const q = (t - 0.28) / 0.14; y = -96 * (1 - eIn(q)); rot = Math.PI * 2 * (1 + q); }
        else if (t < 0.48) { const q = (t - 0.42) / 0.06; y = -17 * eOut(q); }
        else if (t < 0.54) { const q = (t - 0.48) / 0.06; y = -17 * (1 - eIn(q)); }
      }
      // 影子随高度变小
      const hk = 1 + y / 160;
      k.fillStyle = 'rgba(0,0,0,.35)'; k.beginPath(); k.ellipse(x, FLOOR - 1, R * hk, 5 * hk, 0, 0, 7); k.fill();
      const c = Math.cos(rot), sx = Math.max(0.04, Math.abs(c));
      k.save(); k.translate(x, FLOOR - R - 6 + y);
      // 硬币厚度：深色边先画，随翻转方向左右偏移
      k.save(); k.translate(4 * Math.sin(rot), 0); k.scale(sx, 1); k.fillStyle = '#B87A0C'; k.beginPath(); k.arc(0, 0, R, 0, 7); k.fill(); k.restore();
      k.scale(sx, 1);
      k.fillStyle = c >= 0 ? C.yel : '#F0B429'; k.beginPath(); k.arc(0, 0, R, 0, 7); k.fill();
      k.strokeStyle = 'rgba(15,26,61,.35)'; k.lineWidth = 3; k.beginPath(); k.arc(0, 0, R - 6, 0, 7); k.stroke();
      if (c >= 0) txt(k, ch, 0, 2, `900 36px ${JP}`, C.navy, 'center', 'middle');
      else { k.fillStyle = C.navy; star(k, 0, 1, 15, 0, 0.45); k.fill(); }
      k.restore();
    });
  };

  // @element 31
  // 改写自 KittenJam Motion Library #17（Hannah）· 水面倒影：细水平线下是上下颠倒、向下渐隐的珊瑚色倒影，倒影以 2.35 秒周期 ±7° 斜切摇晃、纵向 0.92–1.04 倍伸缩，并按水平条带错位成水纹；上方文字轻微浮动 2.5px。
  const WREF_C = mkCanvas(CW, CH), WREF_G = WREF_C.getContext('2d');
  const WREF_STARS = (() => { const r = rand(3117); return Array.from({ length: 26 }, () => [r() * CW, r() * 90, 0.6 + r() * 1.2, r()]); })();
  CELLS[30] = (k, w, h, u) => {
    u = snapU(u);
    const LY = 118, S = '静水流深', F = `800 60px ${JP}`;
    const bg = k.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#0A1230'); bg.addColorStop(0.57, '#15245A'); bg.addColorStop(1, '#070D24');
    k.fillStyle = bg; k.fillRect(0, 0, w, h);
    WREF_STARS.forEach(([x, y, r, p]) => { k.fillStyle = `rgba(255,255,255,${0.25 + 0.35 * (0.5 + 0.5 * Math.sin(Math.PI * 2 * (u / CYC * 2 + p)))})`; k.fillRect(x, y, r, r); });
    const ph = Math.PI * 2 * u / 2.35;
    const bob = -2.5 * (1 - Math.cos(ph)) / 2;
    // 倒影：先在离屏画倒置文字并做向下渐隐，再按水平条带错位贴回
    const g = WREF_G; g.save(); g.clearRect(0, 0, CW, CH);
    const skew = 7 * Math.PI / 180 * Math.sin(ph), sy = 0.98 - 0.06 * Math.sin(ph);
    g.translate(CW / 2 + 3 * Math.sin(ph), LY + 3); g.transform(1, 0, Math.tan(skew), 1, 0, 0); g.scale(1, -sy);
    g.font = F; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = C.coral; g.fillText(S, 0, -36);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-in';
    const m = g.createLinearGradient(0, LY, 0, LY + 80); m.addColorStop(0, 'rgba(0,0,0,.55)'); m.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = m; g.fillRect(0, 0, CW, CH); g.restore();
    for (let y = LY; y < h; y += 3) {
      const dx = 2.5 * Math.sin(y * 0.25 - Math.PI * 2 * u / (CYC / 4));
      k.drawImage(WREF_C, 0, y, CW, 3, dx, y, CW, 3);
    }
    // 水纹细线
    for (let j = 0; j < 5; j++) {
      const y = LY + 14 + j * 15, x = w / 2 + Math.sin(Math.PI * 2 * u / CYC + j * 1.7) * 60 + (j % 2 ? 80 : -90);
      k.strokeStyle = `rgba(160,190,255,${0.22 - j * 0.03})`; k.lineWidth = 1; k.beginPath(); k.moveTo(x - 30 - j * 6, y); k.lineTo(x + 30 + j * 6, y); k.stroke();
    }
    const lg = k.createLinearGradient(w * 0.15, 0, w * 0.85, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,.55)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
    k.fillStyle = lg; k.fillRect(w * 0.15, LY, w * 0.7, 1);
    txt(k, S, w / 2, LY - 36 + bob, F, '#fff', 'center', 'middle');
  };

  // @element 32
  // 改写自 KittenJam Motion Library #19（Hannah）· 文字旗帜：左侧旗杆，每个字以左边为轴做 scaleX = cos(38°·f)、skewY −9°·f、上移 4px·f 的波浪（f 每 1.175 秒一个来回），字与字相位依次延后 0.17 秒，偶数位字用珊瑚色。
  CELLS[31] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const S = '乘风破浪', F = `900 58px ${JP}`, PX = 118, TOP = 30, BOT = 186, CY = 82;
    k.fillStyle = C.navy3; rr(k, PX - 22, BOT - 6, 44, 8, 3); k.fill();
    k.fillStyle = '#9AA6CC'; rr(k, PX - 4, TOP, 8, BOT - TOP, 3); k.fill();
    k.fillStyle = C.yel; k.beginPath(); k.arc(PX, TOP - 4, 7, 0, 7); k.fill();
    const cs = chars(k, S, F, 10), x0 = PX + 14 - (cs[0].x - cs[0].w / 2);
    cs.forEach((c, i) => {
      const f = (1 - Math.cos(Math.PI * 2 * (u - 0.17 * i) / 1.175)) / 2;
      k.save(); k.translate(x0 + c.x - c.w / 2, CY - 4 * f);
      k.transform(1, Math.tan(-9 * Math.PI / 180 * f), 0, 1, 0, 0);
      k.scale(Math.cos(38 * Math.PI / 180 * f), 1);
      txt(k, c.ch, 0, 0, F, i % 2 ? C.coral : '#fff', 'left', 'middle');
      k.restore();
    });
  };

  // @element 33
  // 改写自 KittenJam Motion Library #20（Hannah）· 重力反转：每个字（间隔 0.12 秒）加速往上「掉」90px 并转 180° 倒立，撞顶回弹后停住，再加速落回并转满 360°，落地小弹 16px；每字一轮 3.6 秒。
  function GRAV_k(t) {   // 返回 [上移比例 0..1, 旋转角]
    if (t < 0.1) return [0, 0];
    if (t < 0.33) { const e = eIn(P(t, 0.1, 0.33)); return [e, Math.PI * e]; }
    if (t < 0.4) return [lerp(1, 0.81, eOut(P(t, 0.33, 0.4))), Math.PI];
    if (t < 0.46) return [lerp(0.81, 1, eIn(P(t, 0.4, 0.46))), Math.PI];
    if (t < 0.58) return [1, Math.PI];
    if (t < 0.8) { const e = eIn(P(t, 0.58, 0.8)); return [1 - e, Math.PI * (1 + e)]; }
    if (t < 0.87) return [16 / 90 * eOut(P(t, 0.8, 0.87)), 0];
    if (t < 0.93) return [16 / 90 * (1 - eIn(P(t, 0.87, 0.93))), 0];
    return [0, 0];
  }
  CELLS[32] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const S = '重力反转', F = `900 60px ${JP}`, REST = 136, UP = 90;
    k.strokeStyle = C.navy3; k.lineWidth = 3; k.setLineDash([10, 8]);
    k.beginPath(); k.moveTo(60, 12); k.lineTo(w - 60, 12); k.stroke(); k.setLineDash([]);
    k.fillStyle = C.navy3; rr(k, 60, 170, w - 120, 4, 2); k.fill();
    const cs = chars(k, S, F, 16);
    cs.forEach((c, i) => {
      const [p, r] = GRAV_k((u - 0.3 - 0.12 * i) / 3.6);
      k.save(); k.translate(w / 2 + c.x, REST - UP * p); k.rotate(r);
      txt(k, c.ch, 0, 0, F, i % 2 ? C.coral : '#fff', 'center', 'middle');
      k.restore();
    });
  };

  // @element 34
  // 改写自 KittenJam Motion Library #25（Hannah）· 卡拉 OK 小球：发光小球每 0.38 秒跳到下一个字（跳高 34px），落点字从暗色亮成白色并带黄色光晕和 1.12 倍弹跳；整句跳完球从右侧离场，4.0–4.3 秒字回暗，4.3 秒起球在左侧淡入复位。
  CELLS[33] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const S = '一闪一闪亮晶晶', F = `800 44px ${JP}`, CY = 124, T0 = 0.3, PER = 0.38, n = [...S].length;
    const cs = chars(k, S, F, 10), X = i => w / 2 + (i < 0 ? cs[0].x - 60 : i >= n ? cs[n - 1].x + 60 : cs[i].x);
    const YB = CY - 22 - 16;
    // 小球
    let bx, by = YB, ba = 1;
    const tEnd = T0 + n * PER;
    if (u < T0) bx = X(-1);
    else if (u < tEnd + PER) { const i = Math.floor((u - T0) / PER), fr = (u - T0) / PER - i; bx = lerp(X(i - 1), X(i), fr); by = YB - 34 * Math.sin(Math.PI * fr); if (i >= n) ba = 1 - fr; }
    else { bx = X(-1); ba = P(u, 4.3, 4.65); }
    cs.forEach((c, i) => {
      const land = T0 + (i + 1) * PER;
      const L = P(u, land - 0.04, land + 0.1) * (1 - P(u, 4.0, 4.3));
      const pop = u > land && u < 4.0 ? 1 + 0.12 * Math.exp(-9 * (u - land)) * Math.cos(16 * (u - land)) : 1;
      k.save(); k.translate(w / 2 + c.x, CY); k.scale(pop, pop);
      k.font = F; k.textAlign = 'center'; k.textBaseline = 'middle'; k.lineJoin = 'round';
      if (L > 0) [[16, 0.12], [8, 0.22]].forEach(([lw, a]) => { k.globalAlpha = a * L; k.strokeStyle = C.yel; k.lineWidth = lw; k.strokeText(c.ch, 0, 0); });
      k.globalAlpha = 1; k.fillStyle = mix('#4A5680', '#FFFFFF', L); k.fillText(c.ch, 0, 0);
      k.restore();
    });
    if (ba > 0) {
      k.save(); k.globalAlpha = ba;
      [[16, 0.12], [11, 0.22]].forEach(([r, a]) => { k.fillStyle = `rgba(255,200,61,${a})`; k.beginPath(); k.arc(bx, by, r, 0, 7); k.fill(); });
      k.fillStyle = C.yel; k.beginPath(); k.arc(bx, by, 7, 0, 7); k.fill();
      k.fillStyle = '#fff'; k.beginPath(); k.arc(bx - 2, by - 2, 2.2, 0, 7); k.fill();
      k.restore();
    }
  };

  // @element 35
  // 改写自 KittenJam Motion Library #36（Hannah）· 墨水晕开：宣纸色底，每个字（间隔 0.25 秒）先是模糊 16px、1.3 倍的墨团，收敛成清晰字形，停留后再晕开到 1.2 倍消失；离屏画模糊墨字后用 contrast(16) 阈值化做出墨团粘连的边缘，再以 multiply 叠到纸上。
  const INKB_C = mkCanvas(CW, CH), INKB_G = INKB_C.getContext('2d');
  const INKB_FIB = (() => { const r = rand(3636); return Array.from({ length: 40 }, () => [r() * CW, r() * CH, 6 + r() * 18, r() * Math.PI]); })();
  CELLS[34] = (k, w, h, u) => {
    u = snapU(u);
    stage(k, '#F2EBDD');
    k.strokeStyle = 'rgba(150,120,80,.12)'; k.lineWidth = 1;
    INKB_FIB.forEach(([x, y, l, a]) => { k.beginPath(); k.moveTo(x, y); k.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); k.stroke(); });
    const S = '墨染江南', F = `900 68px ${JP}`, g = INKB_G;
    g.save(); g.filter = 'none'; g.globalAlpha = 1; g.fillStyle = '#fff'; g.fillRect(0, 0, CW, CH);
    g.font = F; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#000';
    chars(g, S, F, 14).forEach((c, i) => {
      const t = (u - 0.3 - 0.25 * i) / 3.6; if (t <= 0 || t >= 1) return;
      let b, op, sc;
      if (t < 0.55) { const q = smooth(t / 0.55); b = lerp(16, 0, q); sc = lerp(1.3, 1, q); op = clamp(t / 0.15); }
      else if (t < 0.8) { b = 0; sc = 1; op = 1; }
      else { const q = smooth((t - 0.8) / 0.2); b = lerp(0, 16, q); sc = lerp(1, 1.2, q); op = 1 - q; }
      g.filter = `blur(${b.toFixed(2)}px)`; g.globalAlpha = op;
      g.save(); g.translate(CW / 2 + c.x, CH / 2); g.scale(sc, sc); g.fillText(c.ch, 0, 0); g.restore();
    });
    g.restore();
    k.save(); k.filter = 'contrast(16)'; k.globalCompositeOperation = 'multiply'; k.drawImage(INKB_C, 0, 0); k.restore();
    // 角落朱印
    k.fillStyle = '#C8372D'; rr(k, w - 62, h - 54, 30, 30, 4); k.fill();
    txt(k, '印', w - 47, h - 38, `900 18px ${JP}`, '#F2EBDD', 'center', 'middle');
  };

  // @element 36
  // 改写自 KittenJam Motion Library #39（Hannah）· 崩落：每个字（间隔 0.16 秒）先歪斜 ±12° 以内，再加速下坠 109px、旋转 ±90° 以内并淡出，带碎屑；随后从上方 32px 处缓出落回原位重组。每字一轮 3.6 秒。
  const CRUM_R = (() => { const r = rand(3939); return Array.from({ length: 4 }, () => ({ r0: (r() * 2 - 1) * 12, r1: (r() * 2 - 1) * 90, bits: Array.from({ length: 5 }, () => [(r() - 0.5) * 50, (r() - 0.5) * 40, 1.2 + r() * 0.8, r() * 6, 3 + r() * 4]) })); })();
  CELLS[35] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const S = '土崩瓦解', F = `900 64px ${JP}`, CY = 92, D2R = Math.PI / 180;
    k.fillStyle = C.navy2; rr(k, 70, 132, w - 140, 4, 2); k.fill();
    chars(k, S, F, 18).forEach((c, i) => {
      const t = (u - 0.3 - 0.16 * i) / 3.6, R = CRUM_R[i % CRUM_R.length];   // 取模：脚本被按非 UTF-8 解码时字符数会变多
      let y = 0, rot = 0, op = 1;
      if (t > 0.22 && t < 0.27) rot = R.r0 * D2R * P(t, 0.22, 0.27);
      else if (t >= 0.27 && t < 0.3) rot = R.r0 * D2R;
      else if (t >= 0.3 && t < 0.62) { const q = P(t, 0.3, 0.62), e = eIn(q); y = 109 * e; rot = lerp(R.r0, R.r1, e) * D2R; op = 1 - q; }
      else if (t >= 0.62 && t < 0.8) op = 0;
      else if (t >= 0.8 && t < 0.92) { const q = eOut(P(t, 0.8, 0.92)); y = -32 * (1 - q); op = q; }
      // 碎屑跟随下坠
      if (t >= 0.3 && t < 0.62) {
        const q = P(t, 0.3, 0.62);
        R.bits.forEach(([bx, by, sp, a, s]) => {
          k.save(); k.globalAlpha = 0.8 * (1 - q); k.translate(w / 2 + c.x + bx * (0.4 + q), CY + by + 140 * sp * eIn(q)); k.rotate(a + q * 6);
          k.fillStyle = i % 2 ? C.yel : '#fff'; k.fillRect(-s / 2, -s / 2, s, s); k.restore();
        });
      }
      if (op <= 0) return;
      k.save(); k.globalAlpha = op; k.translate(w / 2 + c.x, CY + y); k.rotate(rot);
      txt(k, c.ch, 0, 0, F, i % 2 ? C.yel : '#fff', 'center', 'middle');
      k.restore();
    });
  };

  // @element 37
  // 改写自 KittenJam Motion Library #43（Hannah）· 印章：纸面上两枚粗框印章（−9° 与 7°）依次从 2.4 倍斜着砸到 0.93 倍再回 1 倍，间隔 0.55 秒，落下时纸面微震并扩出一圈印痕；印面用随机镂空点做斑驳质感（离屏 2 倍分辨率预生成）。3.9–4.4 秒淡出。
  const STMP_IMG = ['急件', '核准'].map((s, j) => {
    const c = mkCanvas(340, 200), g = c.getContext('2d'), r = rand(4343 + j * 7);
    g.scale(2, 2); g.strokeStyle = '#E2453A'; g.fillStyle = '#E2453A'; g.lineWidth = 6;
    g.beginPath(); g.roundRect(8, 8, 154, 84, 10); g.stroke();
    g.lineWidth = 1.5; g.beginPath(); g.roundRect(15, 15, 140, 70, 6); g.stroke();
    g.font = `900 50px ${JP}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 85, 52);
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 160; i++) { g.globalAlpha = 0.4 + r() * 0.6; g.beginPath(); g.arc(r() * 170, r() * 100, 0.5 + r() * 1.8, 0, 7); g.fill(); }
    g.globalAlpha = 0.5; g.lineWidth = 1;
    for (let i = 0; i < 6; i++) { const x = r() * 170, y = r() * 100; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10 + r() * 30, y + (r() - 0.5) * 6); g.stroke(); }
    return c;
  });
  CELLS[36] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const ST = [[196, 92, -9, 0.35], [350, 124, 7, 0.9]], fade = 1 - P(u, 3.9, 4.4);
    // 纸面受冲击的微震
    let jy = 0; ST.forEach(([, , , s]) => { const t = u - s - 0.24; if (t > 0 && t < 0.25) jy += 2.5 * Math.exp(-14 * t) * Math.sin(50 * t); });
    k.save(); k.translate(0, jy);
    k.fillStyle = C.cream; rr(k, 44, 14, w - 88, h - 28, 6); k.fill();
    k.fillStyle = 'rgba(15,26,61,.12)';
    for (let i = 0; i < 6; i++) { k.fillRect(70, 34 + i * 26, i % 3 === 2 ? 220 : 380, 6); }
    ST.forEach(([x, y, deg, s], j) => {
      const t = u - s; if (t <= 0) return;
      let sc, op;
      if (t < 0.24) { const q = eIn(t / 0.24); sc = lerp(2.4, 0.93, q); op = q; } else { sc = lerp(0.93, 1, eOut(P(t, 0.24, 0.36))); op = 1; }
      op *= fade; if (op <= 0) return;
      // 印痕扩散框
      const rg = P(t, 0.24, 0.6);
      k.save(); k.translate(x, y); k.rotate(deg * Math.PI / 180);
      if (rg > 0 && rg < 1) { k.globalAlpha = 0.4 * (1 - rg) * fade; k.strokeStyle = '#E2453A'; k.lineWidth = 2; const e = 1 + 0.3 * eOut(rg); rr(k, -85 * e, -50 * e, 170 * e, 100 * e, 12); k.stroke(); }
      k.globalAlpha = op * 0.92; k.scale(sc, sc); k.drawImage(STMP_IMG[j], -85, -50, 170, 100);
      k.restore();
    });
    k.restore();
  };

  // @element 38
  // 改写自 KittenJam Motion Library #57（Hannah）· 文字圆柱：三根圆柱各由同一字的 10 个副本（间隔 36°）环绕水平轴排成，每 4.7 秒转一圈，相邻两根方向相反，中间一根用珊瑚色；背面不画，近处更亮更大。
  CELLS[37] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const S = '立体字', R = 62, CY = 104, th = Math.PI * 2 * u / CYC;
    [...S].forEach((ch, c) => {
      const cx = w / 2 + (c - 1) * 150, dir = c % 2 ? -1 : 1, col = c === 1 ? C.coral : '#fff';
      const list = [];
      for (let i = 0; i < 10; i++) { const a = i * 36 * Math.PI / 180 + dir * th; list.push([Math.cos(a), Math.sin(a)]); }
      list.sort((A, B) => A[0] - B[0]).forEach(([z, s]) => {
        if (z < 0.05) return;
        const per = 400 / (400 - R * z);
        k.save(); k.globalAlpha = 0.2 + 0.8 * z; k.translate(cx, CY - R * s * per); k.scale(per, z * per);
        txt(k, ch, 0, 0, `900 50px ${JP}`, col, 'center', 'middle');
        k.restore();
      });
    });
  };

  // @element 39
  // 改写自 KittenJam Motion Library #65（Hannah）· 拉霸：4 个窗格里的滚带向上快速滚动随机字，从左到右依次减速（各 1.4 + 0.5i 秒，cubic-bezier(.2,.75,.25,1.04) 带轻微回弹）停在「大吉大利」，全部停下后边框闪两下；滚带首尾都是目标字，循环无缝。
  const SLOT_POOL = [...'大吉利福寿财中凶7★♥'], SLOT_TG = [...'大吉大利'];
  const SLOT_STRIPS = SLOT_TG.map((t, i) => { const r = rand(6565 + i * 17), n = 18 + i * 6; return Array.from({ length: n }, (_, j) => j === 0 || j === n - 1 ? t : SLOT_POOL[Math.floor(r() * SLOT_POOL.length)]); });
  function SLOT_bz(x) {   // cubic-bezier(.2,.75,.25,1.04)：二分求 t 再取 y
    const bx = t => 3 * (1 - t) * (1 - t) * t * 0.2 + 3 * (1 - t) * t * t * 0.25 + t * t * t;
    let a = 0, b = 1; for (let i = 0; i < 24; i++) { const m = (a + b) / 2; if (bx(m) < x) a = m; else b = m; }
    const t = (a + b) / 2; return 3 * (1 - t) * (1 - t) * t * 0.75 + 3 * (1 - t) * t * t * 1.04 + t * t * t;
  }
  CELLS[38] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const RW = 76, RH = 92, GAPR = 14, X0 = (w - (4 * RW + 3 * GAPR)) / 2, Y0 = (h - RH) / 2;
    const flash = u > 3.2 && u < 4.2 ? 0.5 - 0.5 * Math.cos(Math.PI * 2 * (u - 3.2) / 0.5) : 0;
    k.fillStyle = C.navy2; rr(k, X0 - 18, Y0 - 18, 4 * RW + 3 * GAPR + 36, RH + 36, 16); k.fill();
    k.strokeStyle = mix(C.navy3, C.yel, flash); k.lineWidth = 3; k.stroke();
    SLOT_STRIPS.forEach((st, i) => {
      const x = X0 + i * (RW + GAPR), n = st.length, dur = 1.4 + 0.5 * i;
      const p = SLOT_bz(P(u, 0.3, 0.3 + dur)), off = p * (n - 1) * RH;
      const sp = Math.abs(SLOT_bz(P(u + 0.02, 0.3, 0.3 + dur)) - p) * (n - 1) * RH / 0.02;   // 滚动速度 px/s，用于拖影
      k.save(); rr(k, x, Y0, RW, RH, 10); k.fillStyle = '#16204A'; k.fill(); k.clip();
      const j0 = Math.floor(off / RH);
      for (let j = j0 - 1; j <= j0 + 1; j++) {
        const ch = st[mod(j, n)], y = Y0 + RH / 2 + j * RH - off;
        const blur = Math.min(1, sp / 1800);
        if (blur > 0.05) { k.globalAlpha = 0.25 * blur; txt(k, ch, x + RW / 2, y - 14 * blur, `900 58px ${JP}`, C.yel, 'center', 'middle'); txt(k, ch, x + RW / 2, y + 14 * blur, `900 58px ${JP}`, C.yel, 'center', 'middle'); }
        k.globalAlpha = 1 - 0.5 * blur; txt(k, ch, x + RW / 2, y, `900 58px ${JP}`, C.yel, 'center', 'middle');
      }
      k.globalAlpha = 1;
      const gt = k.createLinearGradient(0, Y0, 0, Y0 + RH);
      gt.addColorStop(0, 'rgba(0,0,0,.6)'); gt.addColorStop(0.22, 'rgba(0,0,0,0)'); gt.addColorStop(0.78, 'rgba(0,0,0,0)'); gt.addColorStop(1, 'rgba(0,0,0,.6)');
      k.fillStyle = gt; k.fillRect(x, Y0, RW, RH);
      k.restore();
    });
  };

  // @element 40
  // 改写自 KittenJam Motion Library #73（Hannah）· 液体填满：薄荷色描边的空心字，0.3–3.3 秒正弦液面由下往上填满（波高 6px·sin(π·液位)，前后两层波错相），液中气泡上浮，停留到 4.2 秒后 0.4 秒清空；下方显示百分比。
  const LIQF_C = mkCanvas(CW, CH), LIQF_G = LIQF_C.getContext('2d');
  CELLS[39] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const S = '满格', F = `900 132px ${JP}`, TOP = h / 2 - 66, BOT = h / 2 + 52, CXT = w / 2, CYT = h / 2 - 6;
    const lv = u < 0.3 ? 0 : u < 3.3 ? eIOs(P(u, 0.3, 3.3)) : u < 4.2 ? 1 : 1 - eIOs(P(u, 4.2, 4.6));
    const g = LIQF_G; g.save(); g.clearRect(0, 0, CW, CH);
    const sy = lerp(BOT + 4, TOP - 6, lv), A = 6 * Math.sin(Math.PI * lv), ph = Math.PI * 2 * u / (CYC / 3);
    const wave = (col, off, dy) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, CH); for (let x = 0; x <= CW; x += 6) g.lineTo(x, sy + dy + A * Math.sin(x * 0.035 - ph + off)); g.lineTo(CW, CH); g.closePath(); g.fill(); };
    wave('#1F9E7A', 1.3, -3); wave(C.mint, 0, 0);
    for (let b = 0; b < 10; b++) {
      const bx = CXT + (H01(b) - 0.5) * 240, by = BOT - mod(u / CYC * 2 + H01(b + 20), 1) * (BOT - TOP);
      if (by > sy + 4) { g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.arc(bx + 3 * Math.sin(by * 0.1), by, 2 + 2 * H01(b + 40), 0, 7); g.fill(); }
    }
    g.globalCompositeOperation = 'destination-in'; g.font = F; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#000'; g.fillText(S, CXT, CYT);
    g.restore();
    k.drawImage(LIQF_C, 0, 0);
    k.font = F; k.textAlign = 'center'; k.textBaseline = 'middle'; k.lineJoin = 'round'; k.strokeStyle = C.mint; k.lineWidth = 3; k.strokeText(S, CXT, CYT);
    txt(k, `${Math.round(lv * 100)}%`, w / 2, h - 14, `700 13px ui-monospace, Menlo, monospace`, C.dim, 'center', 'alphabetic');
  };

  // @element 41
  // 改写自 KittenJam Motion Library #134（Hannah）· 手写签名：单笔草写路径（起笔大写弧 + 6 个连写圈 + 上扬收笔）在 0.3–2.9 秒按 sine 缓入缓出逐段写出，珊瑚色笔尖圆点跟随，线宽随方向 2–4.2px 变化；写完后 2.95–3.4 秒补一道微弯底线，4.0–4.5 秒淡出。
  const SIGN_PTS = (() => {
    const pts = [];
    const bez = (a, b, c, d, n) => { for (let i = pts.length ? 1 : 0; i <= n; i++) { const t = i / n, m = 1 - t; pts.push([m * m * m * a[0] + 3 * m * m * t * b[0] + 3 * m * t * t * c[0] + t * t * t * d[0], m * m * m * a[1] + 3 * m * m * t * b[1] + 3 * m * t * t * c[1] + t * t * t * d[1]]); } };
    bez([70, 140], [80, 70], [118, 22], [128, 46], 24);
    bez([128, 46], [136, 72], [104, 150], [96, 158], 24);
    bez([96, 158], [90, 164], [118, 124], [150, 122], 20);
    for (let i = 1; i <= 300; i++) {   // 连写圈：x 前进 + 正弦回绕，顶点处向后形成圈
      const t = i / 300, om = Math.PI * 2 * 6 * t, hh = 34 + 14 * Math.sin(t * 11.3 + 0.8);
      pts.push([150 + 290 * t + 12 * Math.sin(om), 122 - hh * (1 - Math.cos(om)) / 2]);
    }
    bez([440, 122], [470, 124], [486, 96], [500, 58], 24);
    return pts;
  })();
  const SIGN_CUM = pathLen(SIGN_PTS);
  const SIGN_LINE = (() => { const p = []; for (let i = 0; i <= 30; i++) { const t = i / 30, m = 1 - t; p.push([m * m * m * 96 + 3 * m * m * t * 220 + 3 * m * t * t * 380 + t * t * t * 486, m * m * m * 178 + 3 * m * m * t * 168 + 3 * m * t * t * 168 + t * t * t * 174]); } return p; })();
  const SIGN_LCUM = pathLen(SIGN_LINE);
  CELLS[40] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    txt(k, '签名', 30, 34, `700 12px ${JP}`, C.dim);
    const fade = 1 - P(u, 4.0, 4.5);
    const f = -(Math.cos(Math.PI * P(u, 0.3, 2.9)) - 1) / 2;
    if (f > 0 && fade > 0) {
      k.save(); k.globalAlpha = fade; k.strokeStyle = C.cream; k.lineCap = 'round';
      const L = SIGN_CUM[SIGN_CUM.length - 1] * f;
      for (let i = 1; i < SIGN_PTS.length && SIGN_CUM[i - 1] < L; i++) {
        const a = SIGN_PTS[i - 1], b = SIGN_PTS[i], q = Math.min(1, (L - SIGN_CUM[i - 1]) / Math.max(1e-6, SIGN_CUM[i] - SIGN_CUM[i - 1]));
        k.lineWidth = 2 + 2.2 * Math.abs(Math.sin(Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 4));
        k.beginPath(); k.moveTo(a[0], a[1]); k.lineTo(lerp(a[0], b[0], q), lerp(a[1], b[1], q)); k.stroke();
      }
      const ul = eOut(P(u, 2.95, 3.4));
      if (ul > 0) {
        const Lu = SIGN_LCUM[SIGN_LCUM.length - 1] * ul; k.lineWidth = 2.4; k.beginPath(); k.moveTo(SIGN_LINE[0][0], SIGN_LINE[0][1]);
        for (let i = 1; i < SIGN_LINE.length && SIGN_LCUM[i - 1] < Lu; i++) { const q = Math.min(1, (Lu - SIGN_LCUM[i - 1]) / (SIGN_LCUM[i] - SIGN_LCUM[i - 1])); k.lineTo(lerp(SIGN_LINE[i - 1][0], SIGN_LINE[i][0], q), lerp(SIGN_LINE[i - 1][1], SIGN_LINE[i][1], q)); }
        k.stroke();
      }
      k.restore();
    }
    if (u > 0.3 && u < 2.9) {
      const [x, y] = ptAt(SIGN_PTS, SIGN_CUM, f);
      k.fillStyle = 'rgba(255,107,92,.3)'; k.beginPath(); k.arc(x, y, 8, 0, 7); k.fill();
      k.fillStyle = C.coral; k.beginPath(); k.arc(x, y, 4, 0, 7); k.fill();
    }
  };

  // @element 42
  // 改写自 KittenJam Motion Library #322（Hannah）· 地图路线导航：淡色陆地与格线的地图上，三枚地标针从 30px 高处依次（间隔 0.18 秒）弹跳落下，1.3–3.5 秒实线路线沿弯曲路径画到终点，带光圈的小点同步前进，抵达后终点针放大 1.25 倍弹一下；4.1–4.55 秒淡出。
  const MAPR_PINS = [[86, 150, '起点'], [262, 100, '中转'], [452, 62, '终点']];
  const MAPR_PTS = (() => {
    const p = [], bez = (a, b, c, d) => { for (let i = p.length ? 1 : 0; i <= 40; i++) { const t = i / 40, m = 1 - t; p.push([m * m * m * a[0] + 3 * m * m * t * b[0] + 3 * m * t * t * c[0] + t * t * t * d[0], m * m * m * a[1] + 3 * m * m * t * b[1] + 3 * m * t * t * c[1] + t * t * t * d[1]]); } };
    bez([86, 150], [130, 60], [200, 176], [262, 100]); bez([262, 100], [320, 30], [380, 134], [452, 62]); return p;
  })();
  const MAPR_CUM = pathLen(MAPR_PTS);
  const MAPR_BG = (() => {
    const c = mkCanvas(CW, CH), g = c.getContext('2d');
    g.fillStyle = '#0D173A'; g.fillRect(0, 0, CW, CH);
    const blob = (cx, cy, rx, ry, s) => { g.beginPath(); for (let i = 0; i <= 72; i++) { const a = i / 72 * Math.PI * 2, r = 1 + 0.08 * Math.sin(3 * a + s) + 0.05 * Math.sin(5 * a + s * 2); const x = cx + Math.cos(a) * rx * r, y = cy + Math.sin(a) * ry * r; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.fill(); g.stroke(); };
    g.fillStyle = '#18275A'; g.strokeStyle = '#26397A'; g.lineWidth = 1.5;
    blob(270, 104, 236, 84, 1); blob(500, 182, 40, 18, 4);
    g.strokeStyle = 'rgba(127,144,196,.14)'; g.lineWidth = 1;
    for (let x = 0; x <= CW; x += 54) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, CH); g.stroke(); }
    for (let y = 24; y <= CH; y += 54) { g.beginPath(); g.moveTo(0, y); g.lineTo(CW, y); g.stroke(); }
    g.strokeStyle = 'rgba(255,241,214,.28)'; g.lineWidth = 2; g.setLineDash([5, 6]);
    g.beginPath(); MAPR_PTS.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
    return c;
  })();
  function MAPR_bounce(x) { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375; }
  CELLS[41] = (k, w, h, u) => {
    u = snapU(u);
    k.drawImage(MAPR_BG, 0, 0);
    const fade = 1 - P(u, 4.1, 4.55);
    if (fade <= 0) return;
    k.save(); k.globalAlpha = fade;
    const f = -(Math.cos(Math.PI * P(u, 1.3, 3.5)) - 1) / 2;
    if (f > 0) {
      const L = MAPR_CUM[MAPR_CUM.length - 1] * f;
      k.lineCap = 'round'; k.lineJoin = 'round'; k.beginPath(); k.moveTo(MAPR_PTS[0][0], MAPR_PTS[0][1]);
      for (let i = 1; i < MAPR_PTS.length && MAPR_CUM[i - 1] < L; i++) { const q = Math.min(1, (L - MAPR_CUM[i - 1]) / (MAPR_CUM[i] - MAPR_CUM[i - 1])); k.lineTo(lerp(MAPR_PTS[i - 1][0], MAPR_PTS[i][0], q), lerp(MAPR_PTS[i - 1][1], MAPR_PTS[i][1], q)); }
      k.strokeStyle = 'rgba(59,123,255,.3)'; k.lineWidth = 9; k.stroke();
      k.strokeStyle = C.blue; k.lineWidth = 3.5; k.stroke();
    }
    MAPR_PINS.forEach(([x, y, lb], i) => {
      const s = 0.3 + 0.18 * i, q = P(u, s, s + 0.6); if (q <= 0) return;
      const dy = -30 * (1 - MAPR_bounce(q));
      const pop = i === 2 && u > 3.5 ? 1 + 0.25 * Math.sin(Math.PI * P(u, 3.5, 3.85)) : 1;
      k.save(); k.globalAlpha = fade * clamp(q * 4);
      k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(x, y, 6, 2.5, 0, 0, 7); k.fill();
      k.translate(x, y + dy); k.scale(pop, pop);
      k.fillStyle = i === 2 ? C.coral : i === 0 ? C.mint : C.yel;
      k.beginPath(); k.moveTo(0, 0); k.bezierCurveTo(-8, -10, -11, -15, -11, -20); k.arc(0, -20, 11, Math.PI, 0); k.bezierCurveTo(11, -15, 8, -10, 0, 0); k.fill();
      k.fillStyle = C.navy; k.beginPath(); k.arc(0, -20, 4, 0, 7); k.fill();
      k.restore();
      txt(k, lb, x, y + 18, `700 12px ${JP}`, C.cream, 'center', 'alphabetic');
    });
    if (f > 0) {
      const [x, y] = ptAt(MAPR_PTS, MAPR_CUM, f), r = 9 + 3 * Math.sin(Math.PI * 2 * u / (CYC / 6));
      k.fillStyle = 'rgba(255,255,255,.22)'; k.beginPath(); k.arc(x, y, r, 0, 7); k.fill();
      k.fillStyle = '#fff'; k.beginPath(); k.arc(x, y, 4.5, 0, 7); k.fill();
    }
    k.restore();
  };

  // @element 43
  // 改写自 KittenJam Motion Library #328（Hannah）· 心电图：深色细格屏上，P 波、QRS 尖波、T 波每 96px 重复，扫描前端每 2.35 秒从左扫到右，前端后面是新画的发光波形，前方留 8% 空隙、更早的波形逐渐变暗；右侧心形随每次 R 波放大 1.25 倍，心率数字按拍切换。
  const ECG_XL = 20, ECG_XR = 404, ECG_YB = 120, ECG_PW = 96;
  const ECG_QRS = [[34, 0], [37, 6], [41, -62], [46, 18], [50, 0]];
  const ECG_BPM = [102, 101, 103, 102, 100, 102, 104, 103];
  function ECG_y(xl) {
    const x = mod(xl, ECG_PW);
    if (x > 14 && x < 28) return ECG_YB - 7 * Math.sin(Math.PI * (x - 14) / 14);
    if (x > 62 && x < 80) return ECG_YB - 14 * Math.sin(Math.PI * (x - 62) / 18);
    for (let i = 1; i < ECG_QRS.length; i++) if (x >= ECG_QRS[i - 1][0] && x <= ECG_QRS[i][0]) return ECG_YB + lerp(ECG_QRS[i - 1][1], ECG_QRS[i][1], (x - ECG_QRS[i - 1][0]) / (ECG_QRS[i][0] - ECG_QRS[i - 1][0]));
    return ECG_YB;
  }
  CELLS[42] = (k, w, h, u) => {
    u = snapU(u);
    stage(k, '#04100C');
    k.fillStyle = '#071A13'; rr(k, 10, 10, w - 20, h - 20, 12); k.fill();
    for (let x = 10; x <= w - 10; x += 16) { k.fillStyle = (x - 10) % 80 ? 'rgba(46,219,168,.06)' : 'rgba(46,219,168,.14)'; k.fillRect(x, 10, 1, h - 20); }
    for (let y = 10; y <= h - 10; y += 16) { k.fillStyle = (y - 10) % 80 ? 'rgba(46,219,168,.06)' : 'rgba(46,219,168,.14)'; k.fillRect(10, y, w - 20, 1); }
    const W = ECG_XR - ECG_XL, s = mod(u / (CYC / 2), 1), cx = ECG_XL + s * W;
    k.lineCap = 'round'; k.lineJoin = 'round';
    for (let x = ECG_XL; x < ECG_XR; x += 4) {
      const age = mod(cx - x, W) / W; if (age > 0.92) continue;
      const a = 1 - 0.75 * age, x2 = Math.min(ECG_XR, x + 4);
      k.beginPath(); k.moveTo(x, ECG_y(x - ECG_XL)); for (let xx = x + 1; xx <= x2; xx++) k.lineTo(xx, ECG_y(xx - ECG_XL));
      k.strokeStyle = `rgba(53,242,154,${0.18 * a})`; k.lineWidth = 7; k.stroke();
      k.strokeStyle = `rgba(53,242,154,${a})`; k.lineWidth = 2; k.stroke();
    }
    const cy = ECG_y(cx - ECG_XL);
    k.fillStyle = 'rgba(53,242,154,.25)'; k.beginPath(); k.arc(cx, cy, 9, 0, 7); k.fill();
    k.fillStyle = '#D9FFEC'; k.beginPath(); k.arc(cx, cy, 3.5, 0, 7); k.fill();
    // 右侧读数：R 波（局部 41px）经过后心形跳一下
    const d = mod(cx - ECG_XL - 41, ECG_PW), pulse = Math.exp(-d / 12);
    const beat = mod(Math.floor(u / (CYC / 2) * 4 - 41 / 96), 8);
    k.fillStyle = 'rgba(46,219,168,.2)'; k.fillRect(420, 30, 1, h - 60);
    txt(k, String(ECG_BPM[beat]), 438, 104, `700 40px ui-monospace, Menlo, monospace`, '#D9FFEC');
    txt(k, 'BPM', 440, 126, `700 12px ${DISP}`, 'rgba(53,242,154,.8)');
    k.save(); k.translate(488, 58); k.scale(1 + 0.25 * pulse, 1 + 0.25 * pulse); k.fillStyle = C.coral; heartPath(k, 10); k.fill(); k.restore();
  };

  // @element 44
  // 改写自 KittenJam Motion Library #329（Hannah）· 树枝生长：0.2–0.6 秒地面线向两侧画出，0.45 秒起主干 0.8 秒长出，4 根分枝间隔 0.15 秒、各 0.45 秒，5 根细枝间隔 0.12 秒、各 0.35 秒，2.6 秒起 14 片叶子乱序间隔 0.07 秒回弹长出，3.4 秒文字浮现；4.15–4.6 秒淡出。
  const TREE_BR = [   // [起点, 控制点, 终点, 线宽, 开始秒, 时长]
    [[270, 170], [266, 120], [272, 62], 9, 0.45, 0.8],
    [[270, 140], [248, 124], [216, 112], 5, 1.15, 0.45], [[270, 124], [296, 110], [326, 98], 5, 1.3, 0.45],
    [[271, 98], [250, 84], [238, 62], 4, 1.45, 0.45], [[271, 88], [292, 74], [304, 52], 4, 1.6, 0.45],
    [[230, 116], [214, 98], [204, 84], 2.5, 1.85, 0.35], [[318, 101], [340, 88], [350, 74], 2.5, 1.97, 0.35],
    [[244, 76], [226, 64], [220, 50], 2.5, 2.09, 0.35], [[300, 60], [318, 48], [324, 36], 2.5, 2.21, 0.35], [[272, 66], [268, 50], [272, 38], 2.5, 2.33, 0.35]];
  const TREE_LV = (() => {
    const pos = [[216, 112], [326, 98], [238, 62], [304, 52], [204, 84], [350, 74], [220, 50], [324, 36], [272, 38], [196, 110], [340, 104], [250, 92], [292, 80], [262, 50]];
    const r = rand(3290), order = pos.map((_, i) => i).sort(() => r() - 0.5);
    return pos.map((p, i) => [p[0], p[1], H01(i + 7) * Math.PI * 2, order.indexOf(i)]);
  })();
  CELLS[43] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const fade = 1 - P(u, 4.15, 4.6); if (fade <= 0) return;
    k.save(); k.globalAlpha = fade; k.lineCap = 'round';
    const gl = eOut(P(u, 0.2, 0.6));
    if (gl > 0) { k.strokeStyle = C.navy3; k.lineWidth = 3; k.beginPath(); k.moveTo(270 - 120 * gl, 170); k.lineTo(270 + 120 * gl, 170); k.stroke(); }
    TREE_BR.forEach(([a, c, b, lw, s, d]) => {
      const f = eIOs(P(u, s, s + d)); if (f <= 0) return;
      k.strokeStyle = '#C8A27A'; k.lineWidth = lw; k.beginPath(); k.moveTo(a[0], a[1]);
      const N = Math.max(1, Math.ceil(20 * f));
      for (let i = 1; i <= N; i++) { const t = f * i / N, m = 1 - t; k.lineTo(m * m * a[0] + 2 * m * t * c[0] + t * t * b[0], m * m * a[1] + 2 * m * t * c[1] + t * t * b[1]); }
      k.stroke();
    });
    TREE_LV.forEach(([x, y, rot, rank], i) => {
      const s = 2.6 + rank * 0.07, q = P(u, s, s + 0.32); if (q <= 0) return;
      const sc = backOut(q, 1.7);
      k.save(); k.translate(x, y); k.rotate(rot); k.scale(sc, sc);
      k.fillStyle = i % 3 ? C.mint : '#8BE8C4';
      k.beginPath(); k.moveTo(0, 0); k.bezierCurveTo(4, -6, 11, -6, 14, 0); k.bezierCurveTo(11, 6, 4, 6, 0, 0); k.fill();
      k.restore();
    });
    const tq = eOut(P(u, 3.4, 3.8));
    if (tq > 0) { k.globalAlpha = fade * tq; txt(k, '持续成长', w / 2, 197 - 6 * tq, `700 15px ${JP}`, C.cream, 'center', 'alphabetic'); }
    k.restore();
  };

  // @element 45
  // 改写自 KittenJam Motion Library #330（Hannah）· 齿轮联动：16 齿大齿轮顺时针每 4.7 秒转 180°（8 个齿距），10 齿与 8 齿小齿轮按齿数比反向转（每周期同样 8 个齿距），按接触方向计算初始相位让齿对齿槽；孔数 6/5/4 与转角整除，循环无缝。
  const GEAR_M = 6.4, GEAR_A = [200, 108, 16];
  const GEAR_B = (() => { const r = GEAR_M * (16 + 10) / 2, a = -20 * Math.PI / 180; return [200 + r * Math.cos(a), 108 + r * Math.sin(a), 10, a, 5, C.coral]; })();
  const GEAR_C = (() => { const r = GEAR_M * (16 + 8) / 2, a = 160 * Math.PI / 180; return [200 + r * Math.cos(a), 108 + r * Math.sin(a), 8, a, 4, C.yel]; })();
  function GEAR_draw(k, x, y, N, th, holes, col) {
    const r = GEAR_M * N / 2, st = Math.PI * 2 / N, ro = r - 1.2 * GEAR_M, rt = r + GEAR_M;
    k.save(); k.translate(x, y); k.rotate(th);
    k.beginPath();
    for (let j = 0; j < N; j++) {
      const c = j * st;
      [[c - 0.5 * st, ro], [c - 0.28 * st, ro], [c - 0.16 * st, rt], [c + 0.16 * st, rt], [c + 0.28 * st, ro]].forEach(([a, rr0], q) => { const px = Math.cos(a) * rr0, py = Math.sin(a) * rr0; j || q ? k.lineTo(px, py) : k.moveTo(px, py); });
    }
    k.closePath(); k.fillStyle = col; k.fill();
    k.strokeStyle = 'rgba(15,26,61,.35)'; k.lineWidth = 2; k.beginPath(); k.arc(0, 0, ro - 5, 0, 7); k.stroke();
    k.fillStyle = C.navy;
    for (let i = 0; i < holes; i++) { const a = i * Math.PI * 2 / holes; k.beginPath(); k.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.13, 0, 7); k.fill(); }
    k.beginPath(); k.arc(0, 0, r * 0.22, 0, 7); k.fill();
    k.fillStyle = col; k.beginPath(); k.arc(0, 0, r * 0.09, 0, 7); k.fill();
    k.restore();
  }
  CELLS[44] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const thA = Math.PI * u / CYC;   // 8 × (2π/16) 每周期
    // 接触方向 φ 上：大齿轮齿数单位 a=(φ−θA)·NA/2π，小齿轮须在 a 的对侧半齿处：θ = φ + π − π/N + (φ − θA)·NA/N
    const mesh = ([, , N, phi]) => phi + Math.PI - Math.PI / N + (phi - thA) * 16 / N;
    GEAR_draw(k, GEAR_A[0], GEAR_A[1], 16, thA, 6, C.blue);
    GEAR_draw(k, GEAR_B[0], GEAR_B[1], 10, mesh(GEAR_B), 5, GEAR_B[5]);
    GEAR_draw(k, GEAR_C[0], GEAR_C[1], 8, mesh(GEAR_C), 4, GEAR_C[5]);
    const dots = Math.floor(u / (CYC / 12)) % 4;
    txt(k, '系统运转中' + '·'.repeat(dots), 352, 100, `800 22px ${JP}`, '#fff');
    txt(k, '齿数 16 · 10 · 8', 352, 126, `600 12px ${JP}`, C.dim);
  };

  // @element 46
  // 改写自 KittenJam Motion Library #331（Hannah）· 指纹扫描解锁：圆角感应区内 7 道椭圆弧纹由内向外依次画出（间隔 0.08 秒、各 0.7 秒），1.25–2.05 秒发光扫描条向下、2.05–2.85 秒向上扫回；2.95 秒起纹路变淡到 0.3、对勾 3.0–3.3 秒画出、外框变绿发光，文字依次为「请轻触感应区 → 扫描中 → 验证成功」；4.2–4.6 秒复位。
  CELLS[45] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const CX = w / 2, CY = 90, BS = 112, X0 = CX - BS / 2, Y0 = CY - BS / 2;
    const ok = 1 - P(u, 4.2, 4.6), done = P(u, 2.95, 3.15) * ok;
    k.save(); rr(k, X0, Y0, BS, BS, 22); k.fillStyle = C.navy2; k.fill();
    if (done > 0) [[12, 0.12], [6, 0.25]].forEach(([lw, a]) => { k.strokeStyle = `rgba(46,219,168,${a * done})`; k.lineWidth = lw; k.stroke(); });
    k.strokeStyle = mix(C.navy3, C.mint, done); k.lineWidth = 2.5; k.stroke();
    k.clip();
    const arcA = (1 - 0.7 * P(u, 2.95, 3.2)) * ok;
    k.lineCap = 'round'; k.strokeStyle = '#8FB4FF'; k.lineWidth = 2.6; k.globalAlpha = arcA;
    for (let i = 0; i < 7; i++) {
      const f = -(Math.cos(Math.PI * P(u, 0.3 + 0.08 * i, 1.0 + 0.08 * i)) - 1) / 2; if (f <= 0) continue;
      const gp = i % 2 ? 0.75 : 0.4, a0 = Math.PI / 2 + gp, a1 = Math.PI / 2 - gp + Math.PI * 2;
      k.beginPath(); k.ellipse(CX, CY + 4, 7 + i * 6.2, 9 + i * 6.6, 0, a0, a0 + (a1 - a0) * f); k.stroke();
    }
    k.globalAlpha = 1;
    if (u > 1.2 && u < 2.9) {
      const sp = u < 2.05 ? -(Math.cos(Math.PI * P(u, 1.25, 2.05)) - 1) / 2 : 1 + (Math.cos(Math.PI * P(u, 2.05, 2.85)) - 1) / 2;
      const y = Y0 + 6 + (BS - 12) * sp, ga = Math.min(P(u, 1.2, 1.3), 1 - P(u, 2.8, 2.9));
      const g = k.createLinearGradient(0, y - 14, 0, y + 14); g.addColorStop(0, 'rgba(46,219,168,0)'); g.addColorStop(0.5, `rgba(46,219,168,${0.45 * ga})`); g.addColorStop(1, 'rgba(46,219,168,0)');
      k.fillStyle = g; k.fillRect(X0, y - 14, BS, 28);
      k.fillStyle = `rgba(217,255,236,${ga})`; k.fillRect(X0 + 8, y - 1, BS - 16, 2);
    }
    const tk = eOut(P(u, 3.0, 3.3));
    if (tk > 0 && ok > 0) {
      const T = [[CX - 20, CY + 2], [CX - 6, CY + 16], [CX + 22, CY - 14]], L1 = Math.hypot(14, 14), L2 = Math.hypot(28, 30), L = (L1 + L2) * tk;
      k.globalAlpha = ok; k.strokeStyle = C.mint; k.lineWidth = 7; k.lineJoin = 'round'; k.beginPath(); k.moveTo(T[0][0], T[0][1]);
      if (L <= L1) k.lineTo(lerp(T[0][0], T[1][0], L / L1), lerp(T[0][1], T[1][1], L / L1));
      else { k.lineTo(T[1][0], T[1][1]); const q = (L - L1) / L2; k.lineTo(lerp(T[1][0], T[2][0], q), lerp(T[1][1], T[2][1], q)); }
      k.stroke(); k.globalAlpha = 1;
    }
    k.restore();
    const a0 = clamp(1 - P(u, 1.15, 1.3) + P(u, 4.2, 4.6)), a1 = clamp(P(u, 1.15, 1.3) - P(u, 2.85, 3.0)), a2 = clamp(P(u, 2.9, 3.05) - P(u, 4.2, 4.4));
    const F = `700 15px ${JP}`;
    if (a0 > 0) { k.globalAlpha = a0; txt(k, '请轻触感应区', CX, 178, F, C.dim, 'center', 'alphabetic'); }
    if (a1 > 0) { k.globalAlpha = a1; txt(k, '扫描中' + '·'.repeat(1 + Math.floor(u / 0.25) % 3), CX, 178, F, '#fff', 'center', 'alphabetic'); }
    if (a2 > 0) { k.globalAlpha = a2; txt(k, '验证成功', CX, 178, F, C.mint, 'center', 'alphabetic'); }
    k.globalAlpha = 1;
  };

  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});
