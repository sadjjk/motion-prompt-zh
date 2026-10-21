/* Motion Prompt · pack "photo" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt */
MotionPrompt.pack('photo', function () {
  // @kit
  // 写真の表現・光と画風 24（カード 539x208、1周 5秒）。各コマは時間 u の純関数。
  // 絵は平らな図形だけで描く。場面は3つを全コマで使い回す: ①光＝地平線の前の胸像 ②レンズ＝街角 ③仕上げ＝胸像と風景。
  // 人物は顔・髪のない丸い頭のピクト。光はアンバー1色の面、影は一段濃い平らな面で表す。
  // 色が主役の効果（モノクロ・デュオトーンなど）は、同じ場面の色の割り当て（パレット）を差し替えて見せる。
  // 多くの見本は「効果なし → あり → なし」を env(u) で切り替える（0.4〜1.4秒で入り、4.0秒まで保ち、4.8秒までに戻る）。
  const CW = 539, CH = 208, CYC = 5;
  const TAU = Math.PI * 2;
  const MONO = '"SF Mono", ui-monospace, Menlo, monospace';

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  // 効果の量: 0（なし）→ 1（あり）→ 0。イージングは3次のイーズインアウト
  const IN0 = 0.4, IN1 = 1.4, OUT0 = 4.0, OUT1 = 4.8;
  const env = u => eIO(P(u, IN0, IN1)) * (1 - eIO(P(u, OUT0, OUT1)));
  // 固定シードの乱数（mulberry32）
  function rng(seed) { let s = seed >>> 0; return () => { s = s + 0x6D2B79F5 >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  // 1回だけ作って使い回す物（中身は固定なので毎回同じ）
  const MEMO = {};
  const once = (name, fn) => MEMO[name] || (MEMO[name] = fn());

  // ---------- 色 ----------
  const HEX = {};
  const hx = s => HEX[s] || (HEX[s] = [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)));
  const toHex = c => '#' + c.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  const mixc = (a, b, t) => t <= 0 ? a : t >= 1 ? b : toHex(hx(a).map((v, i) => lerp(v, hx(b)[i], t)));
  const lum = s => { const c = hx(s); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  // パレット同士を t で混ぜる（効果の入り・戻りはこれで色を移す）
  const pal = (a, b, t) => { if (t <= 0) return a; if (t >= 1) return b; const o = {}; for (const key in a) o[key] = mixc(a[key], b[key], t); return o; };
  const mapPal = (a, f) => { const o = {}; for (const key in a) o[key] = f(a[key]); return o; };

  // 基本の場面の色: 明るいニュートラル（camera パックと同じ灰色の段）＋人物の青みグレー＋光のアンバー
  const BASE = {
    sky: '#FAF9F7', sky2: '#FAF9F7', far: '#EAEDF1', mid: '#DEE3EA', ground: '#F1F0EE', ground2: '#E2E1DE', mark: '#FAF9F7', cast: '#E2E1DE',
    bld: '#F1F0EE', edge: '#CFCECB', win: '#E2E1DE', winOff: '#E2E1DE', tree: '#E2E1DE', trunk: '#CFCECB', post: '#A9A8A5', bulb: '#CFCECB',
    person: '#4D5A75', shade: '#33405A', lit: '#FFC75A', car: '#8D97AA', glass: '#EEF1F5', tire: '#3E4452',
    sun: '#F5A524', glow: '#FFE3A3'
  };
  // 周りの明かりを落とした場面（ライティングの見本で、光の当たる所だけを見せる）
  const DIM = {
    sky: '#E7E5E1', sky2: '#E7E5E1', far: '#DADCDF', mid: '#CFD2D7', ground: '#DDDBD7', ground2: '#D0CECA', mark: '#E7E5E1', cast: '#D0CECA',
    bld: '#DDDBD7', edge: '#C0BEBA', win: '#D0CECA', winOff: '#D0CECA', tree: '#D0CECA', trunk: '#C0BEBA', post: '#9D9B97', bulb: '#C0BEBA',
    person: '#4D5A75', shade: '#2C3750', lit: '#FFC75A', car: '#7E889B', glass: '#DDE1E7', tire: '#353B48',
    sun: '#F5A524', glow: '#FFE3A3'
  };
  // 夜（ブルーアワー・長時間露光）。窓と街灯はアンバーに灯る
  const NIGHT = {
    sky: '#2C3B5E', sky2: '#4A6191', far: '#34466D', mid: '#2C3C60', ground: '#283452', ground2: '#222C47', mark: '#3A4A70', cast: '#1F2840',
    bld: '#34446B', edge: '#283657', win: '#FFC75A', winOff: '#2A3859', tree: '#2F3F64', trunk: '#253252', post: '#1E2843', bulb: '#FFC75A',
    person: '#1C2439', shade: '#141B2D', lit: '#FFC75A', car: '#222C47', glass: '#3A4A70', tire: '#141B2D',
    sun: '#F5A524', glow: '#FFE3A3'
  };
  // 暗い場面（リムライト・ローキー）
  const DARK = {
    sky: '#2B2D33', sky2: '#2B2D33', far: '#313339', mid: '#36383E', ground: '#24252A', ground2: '#202125', mark: '#2B2D33', cast: '#1D1E22',
    bld: '#2F3137', edge: '#27292E', win: '#34363C', winOff: '#34363C', tree: '#323439', trunk: '#2A2C31', post: '#3B3D43', bulb: '#3B3D43',
    person: '#1F2128', shade: '#18191E', lit: '#FFC75A', car: '#303238', glass: '#3B3D43', tire: '#18191E',
    sun: '#F5A524', glow: '#FFE3A3'
  };

  // ---------- 図形 ----------
  // 図形を描く道具。M（点の写像）を渡すと、輪郭を細かく刻んでから写す（魚眼用）。M がなければそのまま描く
  function arcPts(x, y, r, n = 40) { const o = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; o.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } return o; }
  function rrPts(x, y, w, h, r) {
    const R = (Array.isArray(r) ? r : [r, r, r, r]).map(v => Math.min(v, w / 2, h / 2)), o = [];
    const corner = (cx, cy, rad, a0) => { if (rad <= 0) { o.push([cx, cy]); return; } for (let i = 0; i <= 6; i++) { const a = a0 + i / 6 * Math.PI / 2; o.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); } };
    corner(x + w - R[1], y + R[1], R[1], -Math.PI / 2);
    corner(x + w - R[2], y + h - R[2], R[2], 0);
    corner(x + R[3], y + h - R[3], R[3], Math.PI / 2);
    corner(x + R[0], y + R[0], R[0], Math.PI);
    return o;
  }
  function pen(k, M) {
    const cut = (pts, closed) => {
      const o = [], n = pts.length;
      for (let i = 0; i < (closed ? n : n - 1); i++) {
        const a = pts[i], b = pts[(i + 1) % n], m = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 6));
        for (let j = 0; j < m; j++) o.push([lerp(a[0], b[0], j / m), lerp(a[1], b[1], j / m)]);
      }
      if (!closed) o.push(pts[n - 1]);
      return o.map(q => M(q[0], q[1]));
    };
    const path = (pts, closed) => { const q = M ? cut(pts, closed) : pts; k.beginPath(); q.forEach((p, i) => i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1])); if (closed) k.closePath(); };
    const D = {
      k,
      poly(pts, col) { path(pts, true); k.fillStyle = col; k.fill(); },
      rect(x, y, w, h, col) { if (!M) { k.fillStyle = col; k.fillRect(x, y, w, h); } else D.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], col); },
      rr(x, y, w, h, r, col) { if (!M) { k.fillStyle = col; k.beginPath(); k.roundRect(x, y, w, h, r); k.fill(); } else D.poly(rrPts(x, y, w, h, r), col); },
      circ(x, y, r, col) { if (!M) { k.fillStyle = col; k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill(); } else D.poly(arcPts(x, y, r), col); },
      line(pts, lw, col, dash) { path(pts, false); k.strokeStyle = col; k.lineWidth = lw; k.lineCap = 'round'; k.lineJoin = 'round'; if (dash) k.setLineDash(dash); k.stroke(); if (dash) k.setLineDash([]); },
      frame(x, y, w, h, lw, col) { path([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true); k.strokeStyle = col; k.lineWidth = lw; k.stroke(); }
    };
    return D;
  }

  // 小物（3つの場面で共通）: 建物・木・街灯・太陽・車
  function building(D, x, base, w, h, p, seed = 0) {
    D.rect(x, base - h, w, h, p.bld); D.frame(x, base - h, w, h, 1.4, p.edge);
    let n = seed;
    for (let y = base - h + 8; y < base - 12; y += 13) for (let xx = x + 7; xx < x + w - 9; xx += 11) { n++; D.rect(xx, y, 5, 7, (n * 7 + seed) % 3 === 0 ? p.win : p.winOff); }
  }
  function tree(D, x, base, r, p) { D.rect(x - r * 0.15, base - r * 1.4, r * 0.3, r * 1.4, p.trunk); D.circ(x, base - r * 1.6, r, p.tree); }
  function lamp(D, x, base, h, p) { D.rect(x - 1.6, base - h, 3.2, h, p.post); D.rect(x - 1.6, base - h, 10, 3, p.post); D.circ(x + 9, base - h + 5, 4, p.bulb); }
  // 太陽: 平らな2段の光の輪＋円
  function sun(D, x, y, r, p, a = 1) {
    const k = D.k; k.save();
    k.globalAlpha = 0.35 * a; D.circ(x, y, r * 2.6, p.glow);
    k.globalAlpha = 0.6 * a; D.circ(x, y, r * 1.7, p.glow);
    k.globalAlpha = a; D.circ(x, y, r, p.sun);
    k.restore();
  }
  function car(D, x, p, o = {}) {   // x = 車の中心、道の奥の車線を走る
    D.rr(x - 22, 128, 42, 13, [6, 6, 0, 0], p.car);
    D.rr(x - 18, 131, 16, 8, 2, p.glass); D.rr(x + 1, 131, 15, 8, 2, p.glass);
    D.rr(x - 35, 140, 70, 15, 5, p.car);
    D.rr(x + 30, 143, 5, 4, 1.5, o.head || p.glass); D.rr(x - 35, 143, 4, 4, 1.5, o.tail || p.edge);
    D.circ(x - 21, 156, 6, p.tire); D.circ(x + 21, 156, 6, p.tire);
    D.circ(x - 21, 156, 2.2, p.glass); D.circ(x + 21, 156, 2.2, p.glass);
  }

  // 人のピクト（全身）。camera パックと同じ組み方（頭・胴・腕・脚の角丸）。x = 足元の中心、feet = 足元の y、s = 身長(px)
  function figure(D, x, feet, s, col) {
    const m = s / 1.79, X = v => x + v * m, Y = v => feet - v * m;
    D.rr(X(-0.155), Y(0.88), 0.15 * m, 0.88 * m, 0.07 * m, col); D.rr(X(0.005), Y(0.88), 0.15 * m, 0.88 * m, 0.07 * m, col);
    D.rr(X(-0.31), Y(1.40), 0.12 * m, 0.6 * m, 0.06 * m, col); D.rr(X(0.19), Y(1.40), 0.12 * m, 0.6 * m, 0.06 * m, col);
    D.rr(X(-0.23), Y(1.46), 0.46 * m, 0.64 * m, 0.12 * m, col);
    D.circ(x, Y(1.63), 0.16 * m, col);
  }
  // 胸から上のピクト（同じ組み方を頭の半径 R で切り出す）。cx,cy = 頭の中心
  function bustPath(k, cx, cy, R) {
    k.beginPath(); k.arc(cx, cy, R, 0, TAU);
    k.roundRect(cx - 1.4375 * R, cy + 1.0625 * R, 2.875 * R, CH, 0.75 * R);
    k.roundRect(cx - 1.9375 * R, cy + 1.4375 * R, 0.75 * R, CH, 0.375 * R);
    k.roundRect(cx + 1.1875 * R, cy + 1.4375 * R, 0.75 * R, CH, 0.375 * R);
  }
  // 胸像を色 col で塗り、paint(k) で光と影の面を胸像の形の中だけに塗る
  function bust(k, cx, cy, R, col, paint) {
    k.save(); bustPath(k, cx, cy, R); k.fillStyle = col; k.fill();
    if (paint) { k.clip(); paint(k); }
    k.restore();
  }
  // 頭の影の面: 光が横から角度 az（0 = 正面、90° = 真横）で当たるとき、明暗の境は x = cx ± cos(az)·√(R²−dy²)。side = +1 で右側が影
  function headShade(k, cx, cy, R, az, side, col) {
    const c = Math.cos(az), n = 28; k.beginPath();
    for (let i = 0; i <= n; i++) { const y = cy - R + 2 * R * i / n; k.lineTo(cx + side * c * Math.sqrt(Math.max(0, R * R - (y - cy) ** 2)), y); }
    k.lineTo(cx + side * (R + 4), cy + R); k.lineTo(cx + side * (R + 4), cy - R); k.closePath(); k.fillStyle = col; k.fill();
  }

  // ---------- 3つの場面 ----------
  // ① 光: 地平線（y150）の前の胸像。左に建物2棟、右に街灯と木
  const PX = 270, PY = 78, PR = 29, HZ = 150;
  function stagePortrait(k, p, o = {}) {
    const D = pen(k);
    D.rect(0, 0, CW, CH, p.sky); D.rect(0, 92, CW, HZ - 92, p.sky2);
    if (o.sun) sun(D, o.sun[0], o.sun[1], o.sun[2], p, o.sun[3]);
    D.poly([[0, HZ], [0, 134], [70, 124], [150, 136], [230, 126], [330, 134], [420, 122], [539, 132], [539, HZ]], p.far);
    building(D, 34, HZ, 38, 50, p, 1); building(D, 76, HZ, 30, 32, p, 2);
    D.rect(0, HZ, CW, CH - HZ, p.ground);
    if (o.cast) { const L = o.cast; D.poly([[402, HZ], [405, HZ], [405 + L, HZ + 9], [402 + L, HZ + 9]], p.cast); D.poly([[452, HZ], [460, HZ], [460 + L * 0.9, HZ + 16], [452 + L * 0.9, HZ + 16]], p.cast); }
    lamp(D, 404, HZ, 58, p); tree(D, 456, HZ, 17, p);
    if (o.after) o.after(D);
  }
  // ② レンズ: 街角。奥に建物の列・木・街灯、手前に道と歩道、人物は左手前
  const BLD = [[-8, 52, 66], [48, 40, 90], [92, 54, 58], [150, 44, 78], [208, 32, 52], [296, 52, 84], [352, 48, 60], [404, 42, 98], [470, 40, 70], [514, 40, 88]];
  const TREES = [[136, 17], [262, 17], [384, 15]], LAMPS = [114, 292, 494], ROAD = 132, WALK = 162;
  const FIG = [176, 200, 124];   // 人物: 足元の x・y、身長
  function stageStreet(k, p, o = {}) {
    const D = pen(k, o.M);
    D.rect(-40, -40, CW + 80, CH + 80, p.sky);
    if (o.sun) sun(D, o.sun[0], o.sun[1], o.sun[2], p, o.sun[3]);
    BLD.forEach(([x, w, h], i) => building(D, x, ROAD, w, h, p, i));
    TREES.forEach(([x, r]) => tree(D, x, ROAD, r, p));
    LAMPS.forEach(x => lamp(D, x, ROAD, 58, p));
    D.rect(-40, ROAD, CW + 80, WALK - ROAD, p.ground2);
    D.line([[-40, 147], [CW + 40, 147]], 2, p.mark, [14, 12]);
    if (o.car !== undefined && o.car !== false) car(D, o.car, p, o.carLights || {});
    D.rect(-40, WALK, CW + 80, CH - WALK + 40, p.ground); D.line([[-40, WALK], [CW + 40, WALK]], 1.4, p.edge);
    if (o.person !== false) figure(D, FIG[0], FIG[1], FIG[2], p.person);
    D.circ(18, 206, 17, p.tree); D.circ(42, 210, 11, p.tree); D.circ(516, 204, 19, p.tree); D.circ(494, 211, 11, p.tree);
    if (o.after) o.after(D);
  }
  // ③ 仕上げ: 左に胸像、右に丘と家と木と太陽。日は右から当たり、胸像の右の縁が光る
  const QX = 140, QY = 82, QR = 28;
  function stageLand(k, p, o = {}) {
    const D = pen(k);
    D.rect(0, 0, CW, CH, p.sky); D.rect(0, 100, CW, 60, p.sky2);
    if (o.sunOn !== false) sun(D, 432, 54, 15, p);
    if (o.land !== false) {
      D.poly([[150, 162], [150, 130], [210, 116], [262, 124], [318, 100], [372, 114], [430, 104], [490, 120], [539, 110], [539, 162]], p.far);
      building(D, 346, 134, 30, 24, p, 3);
      D.poly([[150, 162], [150, 146], [226, 136], [300, 144], [368, 130], [440, 140], [500, 132], [539, 136], [539, 162]], p.mid);
      D.rect(0, 160, CW, CH - 160, p.ground);
      tree(D, 486, 162, 19, p); tree(D, 452, 162, 12, p);
    } else D.rect(0, 160, CW, CH - 160, p.ground);
    if (o.person !== false) bust(k, QX, QY, QR, p.person, kk => { headShade(kk, QX, QY, QR, 0.86, 1, p.lit); kk.fillStyle = p.lit; kk.fillRect(QX + 1.55 * QR, QY + QR, QR, CH); });
    if (o.after) o.after(D);
  }

  // ---------- 表示 ----------
  // 右上の数値（camera パックと同じ控えめな札）
  function hud(k, s) {
    k.save(); k.globalAlpha = 1;
    const m = 13, f = `600 15px ${MONO}`; k.font = f; const ww = k.measureText(s).width;
    k.fillStyle = 'rgba(255,255,255,.82)'; k.beginPath(); k.roundRect(CW - m - 14 - ww - 10, m + 6, ww + 20, 23, 6); k.fill();
    k.fillStyle = '#6E6E73'; k.textAlign = 'right'; k.textBaseline = 'middle'; k.fillText(s, CW - m - 14, m + 18);
    k.restore();
  }
  // 右下の、真上から見た配置図: 頭（下がカメラ側）と光の位置。lights = [[角度, 明るさ0..1]]、角度は 0 = カメラ側、+90° = 画面の左
  function plan(k, lights) {
    const w = 66, h = 66, x = CW - 13 - w, y = CH - 13 - h, cx = x + w / 2, cy = y + h / 2 - 3;
    k.save();
    k.fillStyle = 'rgba(255,255,255,.9)'; k.beginPath(); k.roundRect(x, y, w, h, 8); k.fill();
    k.strokeStyle = '#E3E1DC'; k.lineWidth = 1.2; k.stroke();
    k.fillStyle = '#CFCECB'; k.beginPath(); k.roundRect(cx - 6, y + h - 10, 12, 6, 2); k.fill();
    k.fillStyle = '#A9A8A5'; k.beginPath(); k.arc(cx, cy, 8, 0, TAU); k.fill();
    k.beginPath(); k.moveTo(cx - 3.5, cy + 7); k.lineTo(cx + 3.5, cy + 7); k.lineTo(cx, cy + 12); k.fill();
    for (const [az, a] of lights) {
      const lx = cx - Math.sin(az) * 22, ly = cy + Math.cos(az) * 22;
      k.globalAlpha = a;
      k.strokeStyle = '#F5A524'; k.lineWidth = 1.4; k.setLineDash([2.5, 2.5]); k.beginPath(); k.moveTo(lx, ly); k.lineTo(lerp(lx, cx, 0.55), lerp(ly, cy, 0.55)); k.stroke(); k.setLineDash([]);
      k.fillStyle = '#F5A524'; k.beginPath(); k.arc(lx, ly, 4.5, 0, TAU); k.fill();
    }
    k.restore();
  }
  // 作業用のオフスクリーン（名前ごとに1枚・使う前に空にする）
  const LAYERS = {};
  function layer(name) {
    const c = LAYERS[name] || (LAYERS[name] = (() => { const e = document.createElement('canvas'); e.width = CW; e.height = CH; return e; })());
    const kk = c.getContext('2d'); kk.globalAlpha = 1; kk.filter = 'none'; kk.globalCompositeOperation = 'source-over'; kk.clearRect(0, 0, CW, CH);
    return [c, kk];
  }
  const cell = fn => (k, w, h, u) => { k.save(); fn(k, u); k.restore(); };

  // 胴の光と影（胴は円柱とみなし、左右に分けて塗る）。W = 胴の外側までの半幅
  const torsoW = R => 1.9375 * R;
  function torso(k, cx, cy, R, x0, x1, col) { k.fillStyle = col; k.fillRect(x0, cy + R, x1 - x0, CH); }
  // 時刻の表示（分 → hh:mm）
  const clock = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
  // 右下の小さなヒストグラム（明るさの分布）。c = 山の中心 0..1、s = 山の幅
  function histo(k, c, s) {
    const w = 96, h = 46, x = CW - 13 - w, y = CH - 13 - h, n = 20;
    k.save();
    k.fillStyle = 'rgba(255,255,255,.9)'; k.beginPath(); k.roundRect(x, y, w, h, 8); k.fill();
    k.strokeStyle = '#E3E1DC'; k.lineWidth = 1.2; k.stroke();
    k.fillStyle = '#A9A8A5';
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, v = Math.exp(-((t - c) ** 2) / (2 * s * s)) * 0.92 + 0.06; const bh = v * (h - 16); k.fillRect(x + 8 + i * (w - 16) / n, y + h - 8 - bh, (w - 16) / n - 1.2, bh); }
    k.restore();
  }

  const CELLS = [];

  // @element 01
  // 逆光: 太陽が画面の外から頭の真後ろへ回り込み、輪郭が光って人物は暗くなる
  CELLS[0] = cell((k, u) => {
    const a = env(u);
    const BACK = Object.assign({}, BASE, { sky: '#FFF4DC', sky2: '#FFEBC4', far: '#F6E2BE', ground: '#F7EAD3', bld: '#F7E9D2', winOff: '#EEDCBF', win: '#EEDCBF', tree: '#EEDCBF', edge: '#E3CFAE', post: '#CDB894', trunk: '#E3CFAE', bulb: '#E3CFAE' });
    stagePortrait(k, pal(BASE, BACK, a), { sun: [lerp(40, PX, a), lerp(-40, PY - 22, a), 20, 1] });
    // 輪郭の光: 胸像の形を太い線でなぞってから中を塗り、縁だけを残す
    k.save(); k.globalAlpha = a; bustPath(k, PX, PY, PR); k.strokeStyle = BASE.lit; k.lineWidth = 7; k.lineJoin = 'round'; k.stroke(); k.restore();
    bust(k, PX, PY, PR, mixc(BASE.person, BASE.shade, a));
    // かすみ: 全体に光の色を薄く重ねる
    k.save(); k.globalAlpha = 0.22 * a; k.fillStyle = BASE.glow; k.fillRect(0, 0, CW, CH); k.restore();
  });

  // @element 02
  // リムライト: 周りが暗くなり、斜め後ろ左右の2灯で頭と肩の輪郭だけが細く光る
  CELLS[1] = cell((k, u) => {
    const a = env(u);
    stagePortrait(k, pal(BASE, DARK, a));
    k.save(); k.globalAlpha = a; k.fillStyle = BASE.lit;
    for (const dx of [-3.5, 3.5]) { k.save(); k.translate(dx, -2.5); bustPath(k, PX, PY, PR); k.fill(); k.restore(); }
    k.restore();
    bust(k, PX, PY, PR, mixc(BASE.person, DARK.person, a));
    plan(k, [[Math.PI * 0.75, a], [-Math.PI * 0.75, a]]);
    hud(k, '±135°');
  });

  // @element 03
  // シルエット: 露出を明るい空に合わせると、人物も建物も木も黒い形だけになる
  CELLS[2] = cell((k, u) => {
    const a = env(u), INK = '#2A2D36';
    const SILH = mapPal(BASE, () => INK);
    Object.assign(SILH, { sky: '#FFEDC4', sky2: '#FFCF73', far: '#4A4546', sun: BASE.sun, glow: BASE.glow });
    stagePortrait(k, pal(BASE, SILH, a), { sun: [404, lerp(60, 128, a), 20, a] });
    bust(k, PX, PY, PR, mixc(BASE.person, '#22252D', a));
    hud(k, `${(-2 * a).toFixed(1).replace('-0.0', '±0.0')} EV`);
  });

  // @element 04
  // スプリットライティング: 光が真横（90°）へ回り、顔の右半分が影に沈む
  CELLS[3] = cell((k, u) => {
    const a = env(u), az = lerp(0.35, Math.PI / 2, a);
    stagePortrait(k, pal(BASE, DIM, a));
    const lit = mixc(BASE.person, BASE.lit, a), sh = mixc(BASE.person, BASE.shade, a), W = torsoW(PR);
    bust(k, PX, PY, PR, BASE.person, kk => {
      kk.fillStyle = lit; kk.beginPath(); kk.arc(PX, PY, PR, 0, TAU); kk.fill();
      headShade(kk, PX, PY, PR, az, 1, sh);
      torso(kk, PX, PY, PR, PX - W, PX - Math.cos(az) * 0.4 * W - 0.4 * W, lit);
      torso(kk, PX, PY, PR, PX + Math.cos(az) * W, PX + W, sh);
    });
    plan(k, [[az, a]]);
    hud(k, `${Math.round(az * 180 / Math.PI)}° · ↑0°`);
  });

  // @element 05
  // レンブラントライティング: 斜め45°・上からの光。影側の頬に三角形の光が残る
  CELLS[4] = cell((k, u) => {
    const a = env(u), R = PR, W = torsoW(R);
    stagePortrait(k, pal(BASE, DIM, a));
    const lit = mixc(BASE.person, BASE.lit, a), sh = mixc(BASE.person, BASE.shade, a);
    bust(k, PX, PY, R, BASE.person, kk => {
      kk.fillStyle = lit; kk.beginPath(); kk.arc(PX, PY, R, 0, TAU); kk.fill();
      kk.fillStyle = sh; kk.fillRect(PX + 0.04 * R, PY - R - 2, R * 2, R * 2 + 4);       // 鼻筋から右は影
      kk.beginPath(); kk.arc(PX, PY, R, 0, TAU); kk.clip();
      kk.fillStyle = lit; kk.beginPath();                                                   // 影側の頬に残る光の三角形
      kk.moveTo(PX + 0.24 * R, PY - 0.12 * R); kk.lineTo(PX + 0.7 * R, PY - 0.12 * R); kk.lineTo(PX + 0.24 * R, PY + 0.5 * R); kk.closePath(); kk.fill();
    });
    bust(k, PX, PY, R, 'rgba(0,0,0,0)', kk => {
      kk.fillStyle = 'rgba(0,0,0,0)';
      torso(kk, PX, PY, R, PX - W, PX - 0.45 * W, lit);
      torso(kk, PX, PY, R, PX + 0.3 * W, PX + W, sh);
    });
    plan(k, [[Math.PI / 4, a]]);
    hud(k, '45° · ↑45°');
  });

  // @element 06
  // バタフライライティング: 顔の正面・高い位置からの光。顔は左右対称に明るく、あごの下にだけ小さな影
  CELLS[5] = cell((k, u) => {
    const a = env(u), R = PR, W = torsoW(R);
    stagePortrait(k, pal(BASE, DIM, a));
    const lit = mixc(BASE.person, BASE.lit, a), sh = mixc(BASE.person, BASE.shade, a);
    bust(k, PX, PY, R, BASE.person, kk => {
      torso(kk, PX, PY, R, PX - 0.8 * W, PX + 0.8 * W, lit);
      kk.fillStyle = sh; kk.beginPath(); kk.ellipse(PX, PY + R * 1.06, R * 0.72, R * 0.38, 0, 0, TAU); kk.fill();    // あごの下の影（左右対称）
      kk.fillStyle = lit; kk.beginPath(); kk.arc(PX, PY, R, 0, TAU); kk.fill();
    });
    plan(k, [[0, a]]);
    hud(k, '0° · ↑45°');
  });

  // @element 07
  // ゴールデンアワー: 太陽が地平線近くまで下り、全体が橙に染まって影が長く伸びる
  CELLS[6] = cell((k, u) => {
    const a = env(u), R = PR, W = torsoW(R);
    const GOLD = {
      sky: '#FFE8BC', sky2: '#FFCF80', far: '#F2C58C', mid: '#E8B27A', ground: '#F6DDB0', ground2: '#ECC892', mark: '#F6DDB0', cast: '#DDAA6E',
      bld: '#F7DCAE', edge: '#D9AE76', win: '#ECC892', winOff: '#ECC892', tree: '#E9C08A', trunk: '#C9965E', post: '#B98A58', bulb: '#C9965E',
      person: '#5C5470', shade: '#3E3650', lit: '#FFB547', car: '#A08E8E', glass: '#F6DDB0', tire: '#3E3650', sun: '#F59A24', glow: '#FFD48A'
    };
    const p = pal(BASE, GOLD, a);
    stagePortrait(k, p, { sun: [lerp(110, 96, a), lerp(-30, 136, a), 18, 1], cast: lerp(0, 150, a) });
    const lit = mixc(p.person, GOLD.lit, a), sh = mixc(p.person, GOLD.shade, a);
    bust(k, PX, PY, R, p.person, kk => {
      kk.fillStyle = lit; kk.beginPath(); kk.arc(PX, PY, R, 0, TAU); kk.fill();
      headShade(kk, PX, PY, R, 1.15, 1, sh);
      torso(kk, PX, PY, R, PX - W, PX - 0.5 * W, lit);
      torso(kk, PX, PY, R, PX + 0.4 * W, PX + W, sh);
    });
    hud(k, clock(lerp(720, 1060, a)));
  });

  // @element 08
  // ブルーアワー: 日が沈んだ後、空が深い青になり、窓と街灯の暖かい光が灯る
  CELLS[7] = cell((k, u) => {
    const a = env(u);
    const p = pal(BASE, NIGHT, a);
    stagePortrait(k, p, {
      sun: [120, lerp(40, 190, P(a, 0, 0.7)), 18, 1 - P(a, 0.4, 0.8)],
      after: D => { const k2 = D.k; k2.save(); k2.globalAlpha = 0.35 * a; D.circ(413, HZ - 53, 13, BASE.glow); k2.globalAlpha = 0.6 * a; D.circ(413, HZ - 53, 8, BASE.glow); k2.restore(); D.circ(413, HZ - 53, 4, p.bulb); }
    });
    bust(k, PX, PY, PR, p.person);
    hud(k, clock(lerp(720, 1115, a)));
  });

  // @element 09
  // ボケ: 絞りを開けると、人物はくっきりのまま、背景の灯りが大きな丸になってにじむ
  CELLS[8] = cell((k, u) => {
    const a = env(u), p = pal(BASE, DIM, a);
    const [B, kb] = layer('bokeh'); stageStreet(kb, p, { person: false });
    const [Bb, kbb] = layer('bokeh-b'); kbb.filter = `blur(${(6 * a).toFixed(2)}px)`; kbb.drawImage(B, 0, 0); kbb.filter = 'none';
    k.drawImage(B, 0, 0); k.drawImage(Bb, 0, 0);
    // 灯り: 街灯3つと、窓や遠くの灯り12個（横に45pxおき・高さと大きさは固定シード）。絞りを開くほど丸が大きく薄くなる
    const pts = once('bokeh-pts', () => {
      const o = LAMPS.map(x => [x + 9, ROAD - 53, 1.25, 0]), r = rng(9);
      for (let i = 0; i < 12; i++) o.push([22 + i * 45 + r() * 20, 44 + r() * 70, 0.6 + r() * 0.6, 1]);
      return o;
    });
    k.save();
    for (const [x, y, s, w] of pts) {
      const r = (2.4 + 15 * a) * s;
      k.globalAlpha = lerp(1, 0.55, a); k.fillStyle = w ? BASE.glow : BASE.lit; k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill();
      k.globalAlpha = 0.7 * a; k.strokeStyle = BASE.lit; k.lineWidth = 1.2; k.stroke();
    }
    k.restore();
    figure(pen(k), FIG[0], FIG[1], FIG[2], p.person);
    const stops = ['f/16', 'f/11', 'f/8', 'f/5.6', 'f/4', 'f/2.8', 'f/2', 'f/1.4'];
    hud(k, stops[Math.round(a * 7)]);
  });

  // @element 10
  // ティルトシフト: 上下の帯がぼけて中央の帯だけピントが合い、街と小さな人と車が模型のように見える
  CELLS[9] = cell((k, u) => {
    const a = env(u), carX = lerp(-60, 600, u / CYC);
    const minis = D => { [[196, 26], [322, 26], [340, 23], [452, 25]].forEach(([x, h]) => figure(D, x, 172, h, BASE.person)); };
    const [S, ks] = layer('tilt'); stageStreet(ks, BASE, { car: carX, person: false, after: minis });
    const [B1, k1] = layer('tilt-1'); k1.filter = `blur(${(3 * a).toFixed(2)}px)`; k1.drawImage(S, 0, 0); k1.filter = 'none';
    const [B2, k2] = layer('tilt-2'); k2.filter = `blur(${(7 * a).toFixed(2)}px)`; k2.drawImage(S, 0, 0); k2.filter = 'none';
    k.drawImage(S, 0, 0);
    const band = (img, y0, y1) => { k.save(); k.beginPath(); k.rect(0, y0, CW, y1 - y0); k.clip(); k.drawImage(img, 0, 0); k.restore(); };
    band(B2, 0, 42); band(B1, 42, 66); band(B1, 176, 190); band(B2, 190, CH);
    // ピントの帯の目印（写真アプリの線）
    k.save(); k.globalAlpha = 0.75 * a; k.strokeStyle = '#8E8E93'; k.lineWidth = 1.4; k.setLineDash([6, 5]);
    k.beginPath(); k.moveTo(0, 66); k.lineTo(CW, 66); k.moveTo(0, 176); k.lineTo(CW, 176); k.stroke(); k.setLineDash([]);
    k.restore();
  });

  // @element 11
  // 長時間露光: シャッターを開け続けると、夜道の車は消え、ライトだけが光の線になる
  CELLS[10] = cell((k, u) => {
    const a = env(u), x = lerp(-60, 600, u / CYC);
    const p = pal(BASE, NIGHT, a);
    stageStreet(k, p, {
      car: false, person: false,
      after: D => {
        const kk = D.k;
        // 車の通った跡: 尾灯（赤）と前照灯（白〜アンバー）の線。車の後ろに伸びる
        kk.save(); kk.globalAlpha = a; kk.lineCap = 'round';
        const x0 = -60, x1 = Math.min(x, CW + 40);
        const ln = (ya, yb, c1, c2, w1, w2) => { kk.strokeStyle = c1; kk.lineWidth = w1; kk.beginPath(); kk.moveTo(x0, ya); kk.lineTo(x1, ya); kk.stroke(); kk.strokeStyle = c2; kk.lineWidth = w2; kk.beginPath(); kk.moveTo(x0, yb); kk.lineTo(x1, yb); kk.stroke(); };
        ln(145, 149, '#FF5B4D', '#FF8A6E', 2.6, 1.4);
        // 反対車線の車たちの跡（画面いっぱい）
        for (const [y, c, lw] of [[135, '#FFE9B8', 2.6], [138.5, BASE.lit, 1.6], [141.5, '#FFE9B8', 1.2]]) { kk.strokeStyle = c; kk.lineWidth = lw; kk.beginPath(); kk.moveTo(-10, y); kk.lineTo(CW + 10, y); kk.stroke(); }
        kk.restore();
      }
    });
    // 車の本体は露光が長いほど薄く写る
    k.save(); k.globalAlpha = 1 - 0.9 * a; const D = pen(k);
    car(D, x, p, { head: BASE.lit, tail: '#FF5B4D' }); k.restore();
    figure(pen(k), FIG[0], FIG[1], FIG[2], p.person);
    hud(k, a > 0.5 ? '8″' : '1/250');
  });

  // @element 12
  // 流し撮り: 走る車を追ってカメラを振ると、車はくっきり、背景だけ横に流れる
  CELLS[11] = cell((k, u) => {
    const a = env(u);
    const drive = lerp(-80, 620, u / CYC), x = lerp(drive, 270 + 10 * Math.sin(u / CYC * TAU), a);
    const S = 46 * a, n = S < 0.5 ? 1 : 12;
    for (let i = 0; i < n; i++) {   // 背景を横にずらして重ね、平均をとる（流れ）
      k.save(); k.globalAlpha = 1 / (i + 1); k.translate(n > 1 ? lerp(-S / 2, S / 2, i / (n - 1)) : 0, 0); stageStreet(k, BASE, { car: false, person: false }); k.restore();
    }
    const D = pen(k); car(D, x, BASE, { head: BASE.lit });
    // 車輪の回転（1周に12回転＝継ぎ目なし）
    k.save(); k.strokeStyle = BASE.tire; k.lineWidth = 1.6;
    for (const wx of [x - 21, x + 21]) { const t = u / CYC * TAU * 12; k.beginPath(); k.moveTo(wx - Math.cos(t) * 5, 156 - Math.sin(t) * 5); k.lineTo(wx + Math.cos(t) * 5, 156 + Math.sin(t) * 5); k.stroke(); }
    k.restore();
    hud(k, a > 0.5 ? '1/15' : '1/1000');
  });

  // @element 13
  // レンズフレア: 建物の陰から太陽が出ると、画面の中心をはさんで反対側へ光の玉が並ぶ
  CELLS[12] = cell((k, u) => {
    const a = env(u), sx = lerp(428, 474, a), sy = lerp(74, 30, a);
    stageStreet(k, BASE, { sun: [sx, sy, 13, 1] });
    const cx = CW / 2, cy = CH / 2, dx = cx - sx, dy = cy - sy;
    k.save();
    // 太陽の光の筋
    k.globalAlpha = 0.75 * a; k.strokeStyle = BASE.lit; k.lineWidth = 1.6; k.lineCap = 'round';
    for (let i = 0; i < 8; i++) { const t = i / 8 * TAU + 0.2, L = i % 2 ? 26 : 44; k.beginPath(); k.moveTo(sx + Math.cos(t) * 17, sy + Math.sin(t) * 17); k.lineTo(sx + Math.cos(t) * L, sy + Math.sin(t) * L); k.stroke(); }
    // 光の玉: 太陽から中心を通る線の上（t = 0.45〜2.0）
    const G = [[0.45, 7, 'c', 0.6], [0.8, 13, 'h', 0.55], [1.15, 5, 'c', 0.7], [1.45, 22, 'h', 0.4], [1.75, 9, 'c', 0.55], [2.0, 30, 'r', 0.55]];
    for (const [t, r, kind, al] of G) {
      const x = sx + dx * t, y = sy + dy * t;
      k.globalAlpha = al * a;
      if (kind === 'r') { k.strokeStyle = BASE.lit; k.lineWidth = 3; k.beginPath(); k.arc(x, y, r, 0, TAU); k.stroke(); continue; }
      k.fillStyle = kind === 'h' ? BASE.glow : BASE.lit; k.beginPath();
      if (kind === 'h') for (let i = 0; i < 6; i++) { const t2 = i / 6 * TAU; k.lineTo(x + Math.cos(t2) * r, y + Math.sin(t2) * r); } else k.arc(x, y, r, 0, TAU);
      k.closePath(); k.fill();
    }
    k.restore();
  });

  // @element 14
  // 魚眼レンズ: 中心がふくらみ、建物の縦の線が外側へ丸く曲がる
  CELLS[13] = cell((k, u) => {
    const a = env(u), kk = 1.25 * a, cx = CW / 2, cy = CH / 2, R2 = cx * cx + cy * cy;
    const M = kk < 0.002 ? null : (x, y) => { const dx = x - cx, dy = y - cy, g = (1 + kk) / (1 + kk * (dx * dx + dy * dy) / R2); return [cx + dx * g, cy + dy * g]; };
    stageStreet(k, BASE, { M });
    hud(k, `${Math.round(lerp(24, 8, a))}mm`);
  });

  // @element 15
  // 色収差: 赤・緑・青を少しずつ違う大きさで重ね、画面の端ほど縁に赤と青のずれが出る
  CELLS[14] = cell((k, u) => {
    const a = env(u), s = 0.02 * a, cx = CW / 2, cy = CH / 2;
    if (s < 0.0005) { stageStreet(k, BASE); return; }
    const [S, ks] = layer('ca'); stageStreet(ks, BASE);
    k.fillStyle = '#000000'; k.fillRect(0, 0, CW, CH);
    for (const [col, sc] of [['#FF0000', 1 + 2 * s], ['#00FF00', 1 + s], ['#0000FF', 1]]) {
      const [L, kl] = layer('ca-' + col); kl.drawImage(S, 0, 0); kl.globalCompositeOperation = 'multiply'; kl.fillStyle = col; kl.fillRect(0, 0, CW, CH); kl.globalCompositeOperation = 'source-over';
      k.save(); k.globalCompositeOperation = 'lighter'; k.translate(cx, cy); k.scale(sc, sc); k.translate(-cx, -cy); k.drawImage(L, 0, 0); k.restore();
    }
  });

  // @element 16
  // 周辺減光（ビネット）: 四隅だけがなだらかに暗くなり、中央の人物に目が集まる
  CELLS[15] = cell((k, u) => {
    const a = env(u);
    stageStreet(k, BASE);
    // 楕円の放射グラデーション: 半径の45%までは素通し、外へ向かって 0 → 70% の濃さ
    k.save(); k.translate(CW / 2, CH / 2); k.scale(1, CH / CW * 1.35);
    const g = k.createRadialGradient(0, 0, CW * 0.45 * 0.62, 0, 0, CW * 0.62);
    g.addColorStop(0, 'rgba(32,35,43,0)'); g.addColorStop(1, `rgba(32,35,43,${(0.7 * a).toFixed(3)})`);
    k.fillStyle = g; k.fillRect(-CW, -CW, CW * 2, CW * 2); k.restore();
  });

  // @element 17
  // ハイキー: 明るい色だけになり、影はごく薄く、明るさの山が右端へ寄る
  CELLS[16] = cell((k, u) => {
    const a = env(u);
    const HIGH = {
      sky: '#FFFFFF', sky2: '#FFFFFF', far: '#F5F6F8', mid: '#EEF0F3', ground: '#FBFBFA', ground2: '#F3F3F1', mark: '#FFFFFF', cast: '#F3F3F1',
      bld: '#FBFBFA', edge: '#E9E9E7', win: '#F2F2F0', winOff: '#F2F2F0', tree: '#F0F0EE', trunk: '#E5E5E3', post: '#DADAD8', bulb: '#E5E5E3',
      person: '#B9C0CE', shade: '#A6AEBF', lit: '#FFE6AE', car: '#E4E7EC', glass: '#FFFFFF', tire: '#C5CAD3', sun: '#FFD889', glow: '#FFF3D8'
    };
    stageLand(k, pal(BASE, HIGH, a));
    histo(k, lerp(0.56, 0.85, a), lerp(0.2, 0.09, a));
  });

  // @element 18
  // ローキー: 画面の大半が暗く沈み、横からの光が当たる縁だけが浮かぶ
  CELLS[17] = cell((k, u) => {
    const a = env(u);
    const LOW = Object.assign({}, DARK, { sun: DARK.sky, glow: DARK.sky, person: '#25272E', lit: '#FFB547' });
    stageLand(k, pal(BASE, LOW, a));
    histo(k, lerp(0.56, 0.14, a), lerp(0.2, 0.08, a));
  });

  // @element 19
  // モノクロ: 色を抜き、明るさだけで見せる（コントラストを少し強める）
  CELLS[18] = cell((k, u) => {
    const a = env(u);
    const GRAY = mapPal(BASE, c => { const g = clamp((lum(c) - 140) * 1.25 + 140, 0, 255); return toHex([g, g, g]); });
    stageLand(k, pal(BASE, GRAY, a));
  });

  // @element 20
  // デュオトーン: 暗い所を藍、明るい所をピンクの2色だけに置き換える
  CELLS[19] = cell((k, u) => {
    const a = env(u);
    const DUO = mapPal(BASE, c => mixc('#1F2A5C', '#FF9FB2', Math.pow(clamp((lum(c) - 70) / (250 - 70)), 2.4)));
    stageLand(k, pal(BASE, DUO, a));
  });

  // @element 21
  // ティール＆オレンジ: 空と影を青緑、日の当たる肌と太陽を橙に寄せる
  CELLS[20] = cell((k, u) => {
    const a = env(u);
    const TO = {
      sky: '#CFE6E3', sky2: '#B7DAD6', far: '#8CC1BE', mid: '#62A2A1', ground: '#3F8083', ground2: '#2F6A6E', mark: '#CFE6E3', cast: '#2F6A6E',
      bld: '#A8D1CE', edge: '#4E8E8F', win: '#62A2A1', winOff: '#62A2A1', tree: '#2F6A6E', trunk: '#1F5357', post: '#1F5357', bulb: '#1F5357',
      person: '#1D4E53', shade: '#143F43', lit: '#FF9248', car: '#2F6A6E', glass: '#CFE6E3', tire: '#143F43', sun: '#FF8236', glow: '#FFC48C'
    };
    stageLand(k, pal(BASE, TO, a));
  });

  // @element 22
  // フィルムグレイン: 細かい粒子が全体に乗り、全体が少し暖かい色に寄る
  CELLS[21] = cell((k, u) => {
    const a = env(u);
    const FILM = mapPal(BASE, c => mixc(c, '#F2DDBE', 0.16));
    const p = pal(BASE, FILM, a);
    const G = once('grain', () => { const r = rng(22), o = []; for (let i = 0; i < 2600; i++) o.push([r() * CW, r() * CH, 0.8 + r() * 0.9, r() < 0.55 ? 0 : 1, 0.16 + r() * 0.22]); return o; });
    const grain = kk => { kk.save(); for (const [x, y, s, d, al] of G) { kk.globalAlpha = al * a; kk.fillStyle = d ? '#FFFFFF' : '#3A3530'; kk.fillRect(x, y, s, s); } kk.restore(); };
    stageLand(k, p); grain(k);
  });

  // @element 23
  // ライトリーク: 右端から、フィルムに光がもれたような赤と橙のにじみが帯になって入る
  CELLS[22] = cell((k, u) => {
    const a = env(u), w = Math.sin(u / CYC * TAU);
    stageLand(k, BASE);
    k.save();
    // 縦長の楕円を右端の外に中心を置いて重ねる（外ほど淡い黄、端ほど赤）
    const band = (rx, col, al) => { k.globalAlpha = al * a; k.fillStyle = col; k.beginPath(); k.ellipse(CW + 30 + 6 * w, CH / 2, rx * a, CH * 1.1, 0, 0, TAU); k.fill(); };
    band(250, '#FFD089', 0.35); band(170, '#FF9A3D', 0.4); band(95, '#FF5A3A', 0.45); band(45, '#FF3B30', 0.5);
    k.restore();
  });

  // @element 24
  // 二重露光: 背景が白く飛び、胸像の形の中にだけ丘と家と木と太陽が写り込む
  CELLS[23] = cell((k, u) => {
    const a = env(u);
    const DX = Object.assign({}, BASE, { sky: '#D3DBE6', sky2: '#D3DBE6', far: '#9AA8BD', mid: '#76869F', ground: '#55647E', bld: '#E8ECF2', edge: '#55647E', win: '#9AA8BD', winOff: '#9AA8BD', tree: '#3F4C66', trunk: '#3F4C66' });
    const draw = kk => {
      kk.fillStyle = '#FFFFFF'; kk.fillRect(0, 0, CW, CH);
      kk.save(); bustPath(kk, QX, QY, QR); kk.clip();
      // 風景を0.7倍にして、太陽が頭の右上、丘の稜線が首のあたりに来るように置く
      kk.translate(QX, QY); kk.scale(0.7, 0.7); kk.translate(-415, -77);
      kk.fillStyle = DX.sky; kk.fillRect(0, -200, CW * 2, CH * 3);
      stageLand(kk, DX, { person: false });
      kk.fillStyle = DX.ground; kk.fillRect(-CW, 200, CW * 3, CH * 3);
      kk.restore();
    };
    if (a >= 0.999) { draw(k); return; }   // 効果が入りきったら直接描く（拡大表示でも輪郭がくっきり）
    stageLand(k, BASE);
    if (a < 0.002) return;
    const [L, kl] = layer('dx'); draw(kl);   // 入り・戻りの途中は、別の面に描いて重ねる
    k.save(); k.globalAlpha = a; k.drawImage(L, 0, 0); k.restore();
  });

  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});
