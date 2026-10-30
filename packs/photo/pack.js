/* Motion Prompt · pack "photo" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt */
MotionPrompt.pack('photo', function () {
  // @kit
  // 写真の表現・光と画風 47（カード 539x208、1周 5秒）。各コマは時間 u の純関数。
  // 32〜47 は光（镜语の用語による）。レンズの光 3・ライティング 5・光源と色 8。
  // 25〜31 は構図。同じ平らな場面で、env(u) に合わせて主役を構図どおりの位置へ動かし、補助線を出す。
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
  // 右下の、真上から見た配置図: 頭（下がカメラ側）と光の位置。lights = [[角度, 明るさ0..1, 色]]、角度は 0 = カメラ側、+90° = 画面の左
  // 色は省略可（既定はアンバー）。2色の光（バイカラー）で灯ごとに色を変えるときだけ渡す
  function plan(k, lights) {
    const w = 66, h = 66, x = CW - 13 - w, y = CH - 13 - h, cx = x + w / 2, cy = y + h / 2 - 3;
    k.save();
    k.fillStyle = 'rgba(255,255,255,.9)'; k.beginPath(); k.roundRect(x, y, w, h, 8); k.fill();
    k.strokeStyle = '#E3E1DC'; k.lineWidth = 1.2; k.stroke();
    k.fillStyle = '#CFCECB'; k.beginPath(); k.roundRect(cx - 6, y + h - 10, 12, 6, 2); k.fill();
    k.fillStyle = '#A9A8A5'; k.beginPath(); k.arc(cx, cy, 8, 0, TAU); k.fill();
    k.beginPath(); k.moveTo(cx - 3.5, cy + 7); k.lineTo(cx + 3.5, cy + 7); k.lineTo(cx, cy + 12); k.fill();
    for (const [az, a, col = '#F5A524'] of lights) {
      const lx = cx - Math.sin(az) * 22, ly = cy + Math.cos(az) * 22;
      k.globalAlpha = a;
      k.strokeStyle = col; k.lineWidth = 1.4; k.setLineDash([2.5, 2.5]); k.beginPath(); k.moveTo(lx, ly); k.lineTo(lerp(lx, cx, 0.55), lerp(ly, cy, 0.55)); k.stroke(); k.setLineDash([]);
      k.fillStyle = col; k.beginPath(); k.arc(lx, ly, 4.5, 0, TAU); k.fill();
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
  // 明るい所だけの面: 透明な面に paint(kk) で灯り・窓・太陽などを描いて返す（泛光・柔焦・プリズムの元）
  // 場面と位置を合わせるため、paint の中では場面と同じ座標の定数（LAMPS・BLD・QX など）を使う
  function brights(name, paint) { const [c, kk] = layer(name); paint(kk, pen(kk)); return c; }
  // 色温度（K）→ 画面に重ねる色と濃さ。5500K（昼光）は重ねない。間は隣の2点を混ぜる
  const KELVIN = [[2000, '#FF8A2A', 0.42], [2700, '#FFA552', 0.3], [3500, '#FFC489', 0.16], [5500, '#FFFFFF', 0], [7500, '#A9C8FF', 0.2], [10000, '#7FA8FF', 0.36]];
  function kelvin(K) {
    let i = 0; while (i < KELVIN.length - 2 && K > KELVIN[i + 1][0]) i++;
    const [k0, c0, a0] = KELVIN[i], [k1, c1, a1] = KELVIN[i + 1], t = clamp((K - k0) / (k1 - k0));
    // 5500K の白は色を持たないので、混ぜるときは相手の色のまま濃さだけ変える
    const col = a0 === 0 ? c1 : a1 === 0 ? c0 : mixc(c0, c1, t);
    return [col, lerp(a0, a1, t)];
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

  // @shared
  // 构图（25〜31）：同一个平面场景，env(u) 从「普通摆法」过渡到「按构图规则摆好 + 画出辅助线」，再回到普通摆法。
  // 构图概念参考 jingyu-skill（MIT · 阿梦freedom）。辅助线用本包的强调色（琥珀），标注用中文字体栈。
  const ZH = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif';
  const GUIDE = BASE.sun, T3 = [CW / 3, CW * 2 / 3], H3 = [CH / 3, CH * 2 / 3];
  // 辅助线：pts 为折线点列，a 为不透明度（跟着 env 渐显）。调用方可在外面设 lineDashOffset 让虚线流动
  function guide(k, pts, a, dash = [6, 5]) {
    if (a <= 0.01) return;
    k.save(); k.globalAlpha = a; k.strokeStyle = GUIDE; k.lineWidth = 1.6; k.setLineDash(dash);
    k.beginPath(); pts.forEach((p, i) => i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1])); k.stroke(); k.restore();
  }
  // 标注小牌：琥珀底白字，居中于 (x, y)
  function tag(k, s, x, y, a) {
    if (a <= 0.01) return;
    k.save(); k.globalAlpha = a; k.font = `600 12px ${ZH}`; const w = k.measureText(s).width + 12;
    k.fillStyle = GUIDE; k.beginPath(); k.roundRect(x - w / 2, y - 10, w, 20, 5); k.fill();
    k.fillStyle = '#FFFFFF'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(s, x, y); k.restore();
  }
  // 构图用的空场景：天空、远山、地平线 hz 以下是地面；返回画笔 D 供后续加元素
  function field(k, p, hz) {
    const D = pen(k);
    D.rect(0, 0, CW, CH, p.sky);
    D.poly([[0, hz], [0, hz - 14], [120, hz - 22], [240, hz - 10], [360, hz - 24], [460, hz - 12], [539, hz - 18], [539, hz]], p.far);
    D.rect(0, hz, CW, CH - hz, p.ground);
    return D;
  }

  // @element 25
  // 三分法: 主体从中央移到左三分线，地平线从中线降到下三分线；辅助线只是参照，不要求压线
  CELLS[24] = cell((k, u) => {
    const a = env(u), hz = lerp(CH / 2, H3[1], a);
    const D = field(k, BASE, hz);
    tree(D, lerp(CW / 2 + 120, T3[1], a), hz, 16, BASE);
    figure(D, lerp(CW / 2, T3[0], a), hz + 30, 92, BASE.person);   // 头顶约在上三分线附近
    T3.forEach(X => guide(k, [[X, 0], [X, CH]], a)); H3.forEach(Y => guide(k, [[0, Y], [CW, Y]], a));
    k.save(); k.globalAlpha = a; k.fillStyle = GUIDE;   // 四个交点
    T3.forEach(X => H3.forEach(Y => { k.beginPath(); k.arc(X, Y, 3.5, 0, TAU); k.fill(); })); k.restore();
  });

  // @element 26
  // 居中构图: 主体移到中轴，标出中轴与视觉重心；背景故意不镜像（左建筑、右树），说明居中看的是重心，不是对称
  CELLS[25] = cell((k, u) => {
    const a = env(u), D = field(k, BASE, 150);
    building(D, 60, 150, 40, 46, BASE, 1); tree(D, 470, 150, 18, BASE); tree(D, 432, 150, 11, BASE);
    figure(D, lerp(150, CW / 2, a), 178, 110, BASE.person);
    guide(k, [[CW / 2, 0], [CW / 2, CH]], a);
    k.save(); k.globalAlpha = a; k.strokeStyle = GUIDE; k.lineWidth = 2; k.beginPath(); k.arc(CW / 2, 118, 28, 0, TAU); k.stroke(); k.restore();
    tag(k, '视觉重心', CW / 2 + 76, 118, a);
  });

  // @element 27
  // 对称构图: 中间的踏脚石一直在；两侧的树随 a 由近到远逐对长出，围绕中轴呼应
  CELLS[26] = cell((k, u) => {
    const a = env(u), D = field(k, BASE, 120);
    [[196, 18], [172, 13], [152, 9], [136, 6]].forEach(([y, r]) => D.rr(CW / 2 - r, y, r * 2, r * 0.6, r * 0.3, BASE.edge));
    for (let i = 0; i < 4; i++) {   // 第 i 对在 a 走到 0.2i 时开始长，0.4 内长满（近大远小）
      const g = P(a, i * 0.2, i * 0.2 + 0.4); if (g <= 0) continue;
      const off = 70 + i * 50, r = (20 - i * 3.5) * g, base = 196 - i * 20;
      tree(D, CW / 2 - off, base, r, BASE); tree(D, CW / 2 + off, base, r, BASE);
    }
    guide(k, [[CW / 2, 0], [CW / 2, CH]], a); tag(k, '对称轴', CW / 2, 22, a);
  });

  // @element 28
  // 引导线: 道路边线从画面下沿汇聚到远处；主体从路外移到汇聚点，虚线沿边线流向主体
  CELLS[27] = cell((k, u) => {
    const a = env(u), VX = 380, VY = 112, D = field(k, BASE, VY);
    D.poly([[150, CH], [VX - 6, VY], [VX + 6, VY], [CW + 60, CH]], BASE.ground2);
    figure(D, lerp(120, VX, a), VY + 4, 40, BASE.person);
    // 虚线每秒流动 28 px；[8,6] 一周 14 px，5 秒正好 10 周，循环无缝
    k.save(); k.lineDashOffset = -u * 28;
    guide(k, [[150, CH], [VX - 6, VY + 2]], a, [8, 6]); guide(k, [[CW + 60, CH], [VX + 6, VY + 2]], a, [8, 6]);
    k.restore();
    tag(k, '引导线', 250, 176, a);
  });

  // @element 29
  // 留白: 主体移到左侧、面朝右；右侧的建筑和树淡出，空出的大片简单区域标为留白
  CELLS[28] = cell((k, u) => {
    const a = env(u), D = field(k, BASE, 150);
    k.save(); k.globalAlpha = 1 - a; building(D, 360, 150, 36, 40, BASE, 2); building(D, 420, 150, 30, 28, BASE, 3); tree(D, 488, 150, 16, BASE); k.restore();
    figure(D, lerp(CW / 2, 110, a), 176, 100, BASE.person);
    k.save(); k.globalAlpha = 0.35 * a; k.fillStyle = BASE.glow; k.fillRect(200, 20, 320, 170); k.restore();
    guide(k, [[200, 20], [520, 20], [520, 190], [200, 190], [200, 20]], a);
    tag(k, '留白', 360, 100, a);
  });

  // @element 30
  // 框中框: 近处的门框淡入，把远处的主体再框一次；门框内沿留一条浅色边，表示它有厚度（不是后期加的装饰边框）
  CELLS[29] = cell((k, u) => {
    const a = env(u), D = field(k, BASE, 150);
    tree(D, 120, 150, 14, BASE); building(D, 400, 150, 44, 50, BASE, 4);
    figure(D, CW / 2, 162, 56, BASE.person);
    const hx = CW / 2 - 84, hy = 30, hw = 168, hh = CH - 30;
    k.save(); k.globalAlpha = a;
    k.fillStyle = BASE.shade; k.beginPath(); k.rect(0, 0, CW, CH); k.rect(hx, hy, hw, hh); k.fill('evenodd');
    k.fillStyle = BASE.edge; k.fillRect(hx - 6, hy - 6, hw + 12, 6); k.fillRect(hx - 6, hy, 6, hh); k.fillRect(hx + hw, hy, 6, hh);
    k.restore();
    guide(k, [[hx, hy], [hx + hw, hy], [hx + hw, CH], [hx, CH], [hx, hy]], a);
    tag(k, '框中框', CW / 2, 16, a);
  });

  // @element 31
  // 前中后景: 三层以不同幅度横移（视差）：后景（湖与对岸树林）最慢、中景（人物）中速、前景（花丛）最快
  CELLS[30] = cell((k, u) => {
    const a = env(u), s = Math.sin(u / CYC * TAU) * a;   // 摆幅跟着 env 渐入；sin 以 CYC 为周期，首尾相接
    const D = pen(k);
    D.rect(0, 0, CW, CH, BASE.sky);
    k.save(); k.translate(s * 6, 0);
    D.poly([[-20, 118], [-20, 96], [90, 86], [200, 98], [330, 82], [450, 96], [560, 88], [560, 118]], BASE.far);
    [40, 120, 210, 300, 390, 480].forEach((x, i) => tree(D, x, 118, 9 + (i % 2) * 3, BASE));
    D.rect(-20, 118, CW + 40, 18, BASE.mid);   // 湖面
    k.restore();
    D.rect(0, 136, CW, CH - 136, BASE.ground);
    k.save(); k.translate(s * 18, 0); figure(D, CW / 2, 170, 66, BASE.person); k.restore();
    k.save(); k.translate(s * 48, 0);
    [[30, 206, 26], [96, 212, 18], [470, 204, 28], [530, 212, 20]].forEach(([x, y, r]) => { D.circ(x, y, r, BASE.tree); D.circ(x - r * 0.3, y - r * 0.5, 4, BASE.sun); });
    k.restore();
    tag(k, '后景', 90 + s * 6, 70, a); tag(k, '中景', CW / 2 + 52 + s * 18, 120, a); tag(k, '前景', 96 + s * 48, 182, a);
  });

  // @element 32
  // 泛光（ブルーム）: 夜の街角で、窓・街灯・車のライトの明るい所からだけ光がにじみ出す。暗い建物の輪郭はそのまま
  CELLS[31] = cell((k, u) => {
    const a = env(u), x = lerp(-60, 600, u / CYC);
    const lights = { head: '#FFE9B8', tail: '#FF5B4D' };
    stageStreet(k, NIGHT, { car: x, carLights: lights });
    if (a < 0.002) { hud(k, 'BLOOM 0%'); return; }
    // 明るい所だけ: 同じ場面を、窓と電球と車のライト以外を透明にした色で描く
    const NONE = 'rgba(0,0,0,0)', BR = mapPal(NIGHT, () => NONE);
    Object.assign(BR, { win: NIGHT.win, bulb: '#FFE3A3' });
    const L = brights('bloom', kk => stageStreet(kk, BR, { car: x, carLights: lights, person: false }));
    const [G, kg] = layer('bloom-g');
    kg.globalCompositeOperation = 'lighter';
    for (const [b, al] of [[3, 0.9], [7, 0.85], [10, 0.8]]) { kg.filter = `blur(${b}px)`; kg.globalAlpha = al; kg.drawImage(L, 0, 0); }
    kg.filter = 'none';
    // 広いにじみ: 半分の大きさで 10px ぼかす（全面で 20px 相当）
    const [Hh, kh] = layer('bloom-h'); kh.filter = 'blur(5px)'; kh.drawImage(L, 0, 0, CW / 2, CH / 2); kh.filter = 'none';
    k.save(); k.globalCompositeOperation = 'lighter';
    k.globalAlpha = a; k.drawImage(G, 0, 0);
    k.globalAlpha = 0.9 * a; k.drawImage(Hh, 0, 0, CW / 2, CH / 2, 0, 0, CW, CH);
    k.restore();
    hud(k, `BLOOM ${Math.round(a * 100)}%`);
  });

  // @element 33
  // 柔焦（ソフトフォーカス）: 画面全体のぼかした写しを明るくしてスクリーンで重ねる。太陽と人物の光る縁がにじみ、
  // 全体のコントラストが下がって暗部が浮くが、山・木・人物の輪郭は元の絵が残るのでくっきりしたまま
  CELLS[32] = cell((k, u) => {
    const a = env(u);
    stageLand(k, BASE);
    if (a < 0.002) { hud(k, 'SOFT 0%'); return; }
    const [S, ks] = layer('soft'); stageLand(ks, BASE);
    const [B, kb] = layer('soft-b'); kb.filter = 'blur(7px) brightness(1.12)'; kb.drawImage(S, 0, 0); kb.filter = 'none';
    k.save(); k.globalCompositeOperation = 'screen'; k.globalAlpha = 0.6 * a; k.drawImage(B, 0, 0);
    // 暗部が浮く: ごく薄い白を重ねてコントラストを下げる
    k.globalCompositeOperation = 'source-over'; k.globalAlpha = 0.1 * a; k.fillStyle = '#FFFFFF'; k.fillRect(0, 0, CW, CH);
    k.restore();
    hud(k, `SOFT ${Math.round(a * 100)}%`);
  });

  // @element 34
  // 棱镜彩虹（プリズム）: 夜の街角で、明るい所だけが赤〜紫の6色に分かれて左上へずれた虹色の重影になる。
  // 暗い所はそのまま。淡い虹の帯がゆっくり画面の左側を横切る
  CELLS[33] = cell((k, u) => {
    const a = env(u);
    stageStreet(k, NIGHT);
    if (a < 0.002) { hud(k, 'PRISM'); return; }
    const NONE = 'rgba(0,0,0,0)', BR = mapPal(NIGHT, () => NONE);
    Object.assign(BR, { win: NIGHT.win, bulb: '#FFE3A3' });
    const L = brights('prism', kk => stageStreet(kk, BR, { person: false }));
    const RAINBOW = ['#FF4D4D', '#FF9F3D', '#FFE14D', '#5CE27A', '#4DB8FF', '#9B6BFF'];
    const [C, kc] = layer('prism-c');
    k.save(); k.globalCompositeOperation = 'lighter';
    RAINBOW.forEach((col, i) => {
      // 明るい所の形を1色に塗り替えて、色ごとに少しずつ左上へずらす
      kc.globalCompositeOperation = 'source-over'; kc.clearRect(0, 0, CW, CH); kc.drawImage(L, 0, 0);
      kc.globalCompositeOperation = 'source-in'; kc.fillStyle = col; kc.fillRect(0, 0, CW, CH);
      const d = (i + 1) * 2.4 * a;
      k.globalAlpha = 0.5 * a; k.drawImage(C, -d * 1.3, -d);
    });
    // 虹の帯: 斜めの帯が左から右へ（端では a = 0 なので位置の飛びは見えない）
    const bx = lerp(-160, 260, u / CYC), g = k.createLinearGradient(bx, 0, bx + 90, 40);
    RAINBOW.forEach((col, i) => g.addColorStop(i / 5, col));
    k.globalAlpha = 0.16 * a; k.fillStyle = g;
    k.beginPath(); k.moveTo(bx, -10); k.lineTo(bx + 70, -10); k.lineTo(bx + 150, CH + 10); k.lineTo(bx + 80, CH + 10); k.closePath(); k.fill();
    k.restore();
    hud(k, 'PRISM');
  });

  // @element 35
  // 体積光束（ゴッドレイ）: 周りが暗くなり、左上の外にある一つの光源から明暗の筋になった光の束が斜めに差し込み、人物を横切る。
  // 束ごとに明るさがゆっくり揺れ、束と束の間には暗い隙間が残る
  CELLS[34] = cell((k, u) => {
    const a = env(u), T = u / CYC * TAU, W = torsoW(PR);
    stagePortrait(k, pal(BASE, DARK, 0.8 * a));
    const lit = mixc(BASE.person, BASE.lit, a), sh = mixc(BASE.person, BASE.shade, a);
    bust(k, PX, PY, PR, BASE.person, kk => {
      kk.fillStyle = lit; kk.beginPath(); kk.arc(PX, PY, PR, 0, TAU); kk.fill();
      headShade(kk, PX, PY, PR, 0.9, 1, sh);
      torso(kk, PX, PY, PR, PX + 0.15 * W, PX + W, sh);
    });
    if (a < 0.002) { hud(k, '↘ 35°'); return; }
    // 光の束: 光源 (SX,SY) から放射状の細い扇を9本。角度と幅は固定、明るさだけ整数倍の周期で揺れる
    const SX = -40, SY = -50, [R, kr] = layer('rays');
    const g = kr.createRadialGradient(SX, SY, 0, SX, SY, 640);
    g.addColorStop(0, 'rgba(255,228,168,0.95)'); g.addColorStop(1, 'rgba(255,228,168,0)');
    kr.fillStyle = g;
    const rays = once('rays', () => { const r = rng(35), o = []; for (let i = 0; i < 9; i++) o.push([0.26 + i * 0.085 + r() * 0.02, 0.012 + r() * 0.016, r() * TAU, 1 + Math.floor(r() * 3)]); return o; });
    for (const [ang, hw, ph, n] of rays) {
      kr.globalAlpha = 0.35 + 0.3 * Math.sin(T * n + ph);
      kr.beginPath(); kr.moveTo(SX, SY);
      kr.lineTo(SX + Math.cos(ang - hw) * 900, SY + Math.sin(ang - hw) * 900); kr.lineTo(SX + Math.cos(ang + hw) * 900, SY + Math.sin(ang + hw) * 900);
      kr.closePath(); kr.fill();
    }
    k.save(); k.globalCompositeOperation = 'lighter'; k.globalAlpha = 0.75 * a; k.filter = 'blur(2px)'; k.drawImage(R, 0, 0); k.restore();
    hud(k, '↘ 35°');
  });

  // @element 36
  // 窗格光影: 明るい壁の前の胸像。窓枠の格子の影が斜めに壁と人物へ落ち、時間とともにゆっくり横へ動いて長く伸びる。
  // 光の当たる所は格子のガラスの形、それ以外は影（縁はくっきり）
  CELLS[35] = cell((k, u) => {
    const a = env(u), s = u / CYC, D = pen(k);
    D.rect(0, 0, CW, CH, '#F3EEE6'); D.rect(0, 168, CW, CH - 168, '#E4DCCF'); D.rect(0, 166, CW, 3, '#D6CCBC');
    bust(k, PX, PY, PR, '#5A6884');
    if (a > 0.002) {
      // ガラス1枚の四隅を、光の傾き sh で右下へ流して壁に写す
      const tx = lerp(96, 176, s), sh = lerp(0.42, 0.72, s), PW = 52, PH = 46, G = 9;
      const mp = (x, y) => [tx + x + sh * y, y];
      k.save(); k.globalCompositeOperation = 'multiply'; k.globalAlpha = a; k.fillStyle = '#AEA9BB';
      k.beginPath(); k.rect(0, 0, CW, CH);
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
        const x0 = i * (PW + G), y0 = 14 + j * (PH + G) * 1.08;
        const q = [mp(x0, y0), mp(x0 + PW, y0), mp(x0 + PW, y0 + PH), mp(x0, y0 + PH)];
        k.moveTo(q[0][0], q[0][1]); for (const [x, y] of q.slice(1)) k.lineTo(x, y); k.closePath();
      }
      k.fill('evenodd');
      k.restore();
    }
    hud(k, clock(lerp(900, 940, s)));
  });

  // @element 37
  // 舞台追光（スポットライト）: 舞台の明かりが落ち、上からの追いかけ照明だけが歩く人を丸く照らす。
  // 丸の外はほぼ真っ黒、煙の中で光の柱が見え、手前に客席の頭の影が並ぶ
  CELLS[36] = cell((k, u) => {
    const a = env(u), x = 270 + 120 * Math.sin(u / CYC * TAU), FEET = 170, SY = 110, SR = 62;
    const D = pen(k);
    // 舞台: 奥の幕（縦のひだ）と床
    D.rect(0, 0, CW, CH, '#4A4C55');
    for (let i = 0; i < 18; i++) D.rect(i * 30 + 8, 0, 12, 140, '#42444C');
    D.rect(0, 140, CW, CH - 140, '#5A5B62'); D.rect(0, 140, CW, 3, '#3A3B42');
    figure(D, x, FEET, 104, '#33384A');
    // 暗転: 丸の外を黒く沈める（縁はくっきり）
    k.save(); k.globalAlpha = 0.92 * a; k.fillStyle = '#07080B';
    k.beginPath(); k.rect(0, 0, CW, CH); k.arc(x, SY, SR, 0, TAU); k.fill('evenodd'); k.restore();
    // 丸の中は明るく暖かく（スクリーンで持ち上げる）
    k.save(); k.globalCompositeOperation = 'screen'; k.globalAlpha = 0.55 * a; k.fillStyle = '#FFE2A8';
    k.beginPath(); k.arc(x, SY, SR, 0, TAU); k.fill();
    k.globalAlpha = 0.5 * a; k.beginPath(); k.ellipse(x, FEET, SR * 0.9, 9, 0, 0, TAU); k.fill();   // 床の光の楕円
    k.restore();
    // 光の柱: 画面上の外の灯体から丸へ。煙で見える柱は薄い台形
    const sx = lerp(x, CW / 2, 0.45), top = -20;
    k.save(); k.globalCompositeOperation = 'lighter';
    const g = k.createLinearGradient(sx, top, x, SY);
    g.addColorStop(0, `rgba(255,232,180,${(0.34 * a).toFixed(3)})`); g.addColorStop(1, `rgba(255,232,180,${(0.1 * a).toFixed(3)})`);
    k.fillStyle = g; k.beginPath(); k.moveTo(sx - 6, top); k.lineTo(sx + 6, top); k.lineTo(x + SR * 0.96, SY - 12); k.lineTo(x - SR * 0.96, SY - 12); k.closePath(); k.fill();
    k.restore();
    // 客席: 手前に頭と肩の影（ゆっくり小さく揺れる）
    const crowd = once('crowd', () => { const r = rng(37), o = []; for (let i = 0; i < 13; i++) o.push([i * 44 + r() * 18 - 6, 8 + r() * 6, r() * TAU, 1 + Math.floor(r() * 2)]); return o; });
    for (const [cx, hr, ph, n] of crowd) {
      const cy = 196 + 1.2 * Math.sin(u / CYC * TAU * n + ph);
      D.circ(cx, cy - hr * 1.2, hr, '#0B0C10'); D.rr(cx - hr * 2.1, cy, hr * 4.2, 30, hr, '#0B0C10');
    }
  });

  // @element 38
  // 慢门闪光（スローシンクロ）: 夜の街角、上に色電球の飾り。閃光が一瞬光って人物はくっきり明るく止まり、
  // 背景の電球・街灯・窓は長い露光の間にカメラが回った分だけ弧を描く色の尾になる
  CELLS[37] = cell((k, u) => {
    const a = env(u);
    // 色電球の飾り: 2本の垂れた線に沿って12個ずつ
    const BULBS = once('garland', () => { const o = [], C = ['#FF5A5A', '#FFC24D', '#5CE27A', '#4DB8FF', '#C77DFF']; for (let s = 0; s < 2; s++) for (let i = 0; i < 12; i++) { const t = (i + 0.5) / 12, x = s * 270 + t * 270; o.push([x, 18 + 26 * Math.sin(t * Math.PI), C[(i + s * 2) % 5]]); } return o; });
    const garland = (kk, bright) => {
      kk.strokeStyle = bright ? 'rgba(0,0,0,0)' : '#1A2238'; kk.lineWidth = 1.2;
      for (let s = 0; s < 2; s++) { kk.beginPath(); for (let i = 0; i <= 24; i++) { const t = i / 24; kk.lineTo(s * 270 + t * 270, 18 + 26 * Math.sin(t * Math.PI)); } kk.stroke(); }
      for (const [x, y, c] of BULBS) { kk.fillStyle = c; kk.beginPath(); kk.arc(x, y, 3.2, 0, TAU); kk.fill(); }
    };
    stageStreet(k, NIGHT, { person: false, after: () => garland(k, false) });
    // 尾: 明るい所だけの面を、画面上の点 (270, 300) を中心に少しずつ回して重ねる
    const NONE = 'rgba(0,0,0,0)', BR = mapPal(NIGHT, () => NONE);
    Object.assign(BR, { win: NIGHT.win, bulb: '#FFE3A3' });
    const L = brights('drag', kk => { stageStreet(kk, BR, { person: false }); garland(kk, true); });
    if (a > 0.002) {
      k.save(); k.globalCompositeOperation = 'lighter';
      for (let i = 1; i <= 16; i++) {
        k.save(); k.translate(270, 300); k.rotate(-0.07 * a * i / 16); k.translate(-270, -300);
        k.globalAlpha = 0.16 * a; k.drawImage(L, 0, 0); k.restore();
      }
      k.restore();
    }
    // 人物: 閃光で止まり、明るい色で写る（閃光の瞬間 1.3〜1.7 秒に白く光る）
    const flash = Math.exp(-(((u - 1.45) / 0.09) ** 2));
    figure(pen(k), FIG[0], FIG[1], FIG[2], mixc(NIGHT.person, '#D9D4E6', a));
    k.save(); k.globalAlpha = 0.55 * flash; k.fillStyle = '#FFFFFF'; k.fillRect(0, 0, CW, CH); k.restore();
    hud(k, a > 0.5 ? '1/4s · ⚡' : '1/60s');
  });

  // @element 39
  // 底光（アンダーライト）: 周りが暗くなり、胸の前の懐中電灯があごの下から上へ照らす。頭は下半分が明るく上ほど暗い。
  // 後ろの壁に、上へ伸びて大きくなった影が出る
  CELLS[38] = cell((k, u) => {
    const a = env(u), D = pen(k);
    stagePortrait(k, pal(BASE, DARK, a));
    // 壁と影: 暗い壁を重ね、胸像の形を上へ大きく伸ばした影を落とす
    k.save(); k.globalAlpha = a; D.rect(0, 0, CW, CH, '#34363E');
    k.translate(PX, PY + 70); k.scale(1.45, 1.75); k.translate(-PX, -(PY + 70) - 14);
    bustPath(k, PX, PY, PR); k.fillStyle = '#1C1D22'; k.fill();
    k.restore();
    const lit = BASE.lit, sh = mixc(BASE.person, '#15161B', a), FY = PY + PR * 1.75;
    bust(k, PX, PY, PR, mixc(BASE.person, sh, 0.6 * a), kk => {
      // 光の中心はあごの下（懐中電灯の位置）。上へ行くほど暗くなる
      const g = kk.createRadialGradient(PX, FY, 4, PX, FY, PR * 2.6);
      g.addColorStop(0, mixc(BASE.person, '#FFE6B0', a)); g.addColorStop(0.45, mixc(BASE.person, lit, a)); g.addColorStop(1, sh);
      kk.fillStyle = g; kk.fillRect(0, 0, CW, CH);
    });
    // 懐中電灯と光の点
    k.save(); k.globalAlpha = a;
    D.rr(PX - 5, FY + 2, 10, 26, 3, '#2A2C33'); D.circ(PX, FY + 2, 5.5, '#FFF4D6');
    k.globalCompositeOperation = 'lighter'; k.globalAlpha = 0.35 * a; D.circ(PX, FY, 14, '#FFE3A3'); k.restore();
    plan(k, [[0, a]]);
    hud(k, '0° · ↓60°');
  });

  // @element 40
  // 斑驳树影（木漏れ日）: 画面の外の木の下に入り、全体が緑がかった木陰に沈む。日の光は葉のすき間だけを抜けて、
  // 人物・建物・地面に形のそろわない光の斑が散る。風が吹くと斑がまとめて流れ、隣どうしがくっついたり離れたりして形が変わる。
  // 地面には、すき間がピンホールになった太陽の像が横長の丸い光で並ぶ。手前の上の角にはピントの外れた葉がぼんやりかかる
  // 斑の形: 1/4 の小さな面に白い点を打ち、ぼかしてからコントラストを上げて二値化する（点どうしが有機的につながる）。
  // それを等倍に引き伸ばして少しぼかすと、縁の柔らかい斑になる
  const DLW = 135, DLH = 52;
  const DAPPLE = once('dapple-lo', () => {
    const mk = () => { const c = document.createElement('canvas'); c.width = DLW; c.height = DLH; return c; };
    return { s: mk(), t: mk() };
  });
  CELLS[39] = cell((k, u) => {
    const a = env(u), T = u / CYC * TAU;
    stagePortrait(k, BASE);
    if (a < 0.002) return;
    // 木陰: 緑がかった色を乗算で重ねて全体を沈める
    k.save(); k.globalCompositeOperation = 'multiply'; k.globalAlpha = a; k.fillStyle = '#7F9682'; k.fillRect(0, 0, CW, CH); k.restore();
    // 葉のすき間（小さな面の座標）。[x, y, 半径, 位相, 揺れの回数]。地面の帯（y ≥ 38）は横長の太陽の像
    const gaps = once('dapple-gap', () => {
      const r = rng(40), o = [];
      for (let i = 0; i < 64; i++) o.push([r() * DLW, r() * 36, 1.3 + r() * 1.5, r() * TAU, 1 + Math.floor(r() * 2), 0]);
      for (let i = 0; i < 12; i++) o.push([4 + i * 11 + r() * 5, 39 + r() * 11, 1.6 + r() * 0.8, r() * TAU, 1, 1]);
      return o;
    });
    const gs = DAPPLE.s.getContext('2d'), gt = DAPPLE.t.getContext('2d');
    gs.fillStyle = '#000'; gs.fillRect(0, 0, DLW, DLH); gs.fillStyle = '#FFF';
    const wind = 1.6 * Math.sin(T) + 0.6 * Math.sin(T * 3 + 1);   // 全体を流す風（1周と3周の重ね）
    for (const [x, y, r, ph, n, ground] of gaps) {
      const sx = x + wind + 0.9 * Math.sin(T * n + ph), sy = y + 0.5 * Math.cos(T * n + ph);
      gs.beginPath();
      if (ground) gs.ellipse(sx, sy, r * 1.9, r * 0.7, 0, 0, TAU); else gs.arc(sx, sy, r, 0, TAU);
      gs.fill();
    }
    gt.clearRect(0, 0, DLW, DLH); gt.filter = 'blur(1.1px) contrast(16)'; gt.drawImage(DAPPLE.s, 0, 0); gt.filter = 'none';
    // 光の面: 二値の斑を等倍へ → 暖かい日の色を乗算で乗せる（黒は黒のまま）→ スクリーンで場面に足す
    const [L, kl] = layer('dapple');
    kl.imageSmoothingEnabled = true; kl.filter = 'blur(1.6px)'; kl.drawImage(DAPPLE.t, 0, 0, CW, CH); kl.filter = 'none';
    kl.globalCompositeOperation = 'multiply'; kl.fillStyle = '#FFE0A0'; kl.fillRect(0, 0, CW, CH);
    k.save(); k.globalCompositeOperation = 'screen'; k.globalAlpha = 0.92 * a; k.drawImage(L, 0, 0); k.restore();
    // 手前のぼけた葉: 上の左右の角に、風に合わせてゆっくり揺れる
    k.save(); k.globalAlpha = 0.55 * a; k.filter = 'blur(7px)'; k.fillStyle = '#3B5442';
    for (const [x, y, r, ph] of [[-6, -14, 46, 0], [46, -24, 34, 1.4], [512, -18, 48, 2.2], [470, -30, 30, 3.1]]) {
      k.beginPath(); k.arc(x + 4 * Math.sin(T + ph) + wind * 2, y + 3 * Math.cos(T + ph), r, 0, TAU); k.fill();
    }
    k.restore();
  });

  // @element 41
  // 水下焦散（コースティクス）: 場面が水の中の淡い青に沈む。上に揺れる水面の線、斜めに差し込む光の筋。
  // 人物と水底に、水面の揺れで曲がった網目の明るい線が流れる
  CELLS[40] = cell((k, u) => {
    const a = env(u), T = u / CYC * TAU;
    const WATER = mapPal(BASE, c => mixc(c, '#3F8FB0', 0.55));
    Object.assign(WATER, { sky: '#7CC3D9', sky2: '#5FAFCB', ground: '#5E9FB4', person: '#2E5A78', shade: '#24485F' });
    stagePortrait(k, pal(BASE, WATER, a));
    bust(k, PX, PY, PR, mixc(BASE.person, WATER.person, a));
    if (a < 0.002) return;
    // 網目: 2方向に走る曲がった線。線の位置は水面の揺れ（整数倍の周期）で変形する
    const [L, kl] = layer('caustic');
    kl.strokeStyle = '#E8FBFF'; kl.lineCap = 'round';
    const wob = (x, y) => 7 * Math.sin(x * 0.045 + T * 2) + 5 * Math.sin(y * 0.07 - T + x * 0.02) + 3 * Math.sin((x + y) * 0.09 + T * 3);
    for (let dir = 0; dir < 2; dir++) {
      for (let i = -6; i < 28; i++) {
        kl.lineWidth = 1.2 + (i % 3) * 0.5; kl.beginPath();
        for (let s = 0; s <= 60; s++) {
          const t = s / 60;
          // dir 0: 右下がりの線、dir 1: 左下がりの線。交わって網になる
          const bx = dir ? i * 26 - t * 120 : i * 26 - 160 + t * 120, by = 30 + t * (CH - 30);
          const x = bx + wob(bx, by), y = by + 0.6 * wob(by, bx);
          s ? kl.lineTo(x, y) : kl.moveTo(x, y);
        }
        kl.stroke();
      }
    }
    k.save(); k.globalCompositeOperation = 'screen'; k.globalAlpha = 0.5 * a; k.filter = 'blur(1px)'; k.drawImage(L, 0, 0); k.restore();
    // 光の筋と水面
    k.save(); k.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const x0 = 120 + i * 110 + 10 * Math.sin(T + i), g = k.createLinearGradient(0, 0, 0, CH);
      g.addColorStop(0, `rgba(220,248,255,${(0.22 * a).toFixed(3)})`); g.addColorStop(1, 'rgba(220,248,255,0)');
      k.fillStyle = g; k.beginPath(); k.moveTo(x0, 0); k.lineTo(x0 + 26, 0); k.lineTo(x0 + 26 - 70, CH); k.lineTo(x0 - 40 - 70, CH); k.closePath(); k.fill();
    }
    k.restore();
    k.save(); k.globalAlpha = a; k.strokeStyle = '#EAFBFF'; k.lineWidth = 2; k.beginPath();
    for (let x = 0; x <= CW; x += 6) { const y = 9 + 3 * Math.sin(x * 0.05 + T * 2) + 2 * Math.sin(x * 0.11 - T * 3); x ? k.lineTo(x, y) : k.moveTo(x, y); }
    k.stroke(); k.restore();
  });

  // @element 42
  // 篝火光（焚き火の光）: 深い青の夜。画面右下の焚き火の低い橙の光が、人物の火に向いた側だけを下から照らし、
  // 明るさは炎に合わせて揺れる。光はすぐ弱まり、遠い所は闇に沈む。火の粉が上へ舞う
  CELLS[41] = cell((k, u) => {
    const a = env(u), T = u / CYC * TAU;
    const NIGHTB = Object.assign({}, mapPal(NIGHT, c => mixc(c, '#0E1530', 0.45)), { win: '#25304E', bulb: '#25304E', sky: '#16224A', sky2: '#1E2C58' });
    const p = pal(BASE, NIGHTB, a);
    stagePortrait(k, p);
    // 揺れ: 整数倍の周波数を重ねたちらつき（0.8〜1.1）
    const fl = 0.95 + 0.06 * Math.sin(T * 7) + 0.04 * Math.sin(T * 13 + 1) + 0.03 * Math.sin(T * 23 + 2);
    const FX = 382, FY = 188, warm = mixc(BASE.person, '#FF9A3D', a), sh = mixc(BASE.person, '#10162C', a), W = torsoW(PR);
    bust(k, PX, PY, PR, sh, kk => {
      const g = kk.createRadialGradient(FX, FY, 10, FX, FY, 170 * fl);
      g.addColorStop(0, warm); g.addColorStop(0.75, mixc(warm, sh, 0.55)); g.addColorStop(1, sh);
      kk.fillStyle = g; kk.fillRect(0, 0, CW, CH);
      headShade(kk, PX, PY, PR, 1.0, -1, mixc(sh, '#000000', 0.2 * a));
      torso(kk, PX, PY, PR, PX - W, PX - 0.1 * W, mixc(sh, '#000000', 0.2 * a));
    });
    if (a < 0.002) return;
    // 周りの闇と地面の照り返し
    k.save();
    const d = k.createRadialGradient(FX, FY, 20, FX, FY, 330 * fl);
    d.addColorStop(0, 'rgba(255,140,50,0.28)'); d.addColorStop(0.35, 'rgba(40,20,20,0)'); d.addColorStop(1, 'rgba(4,6,16,0.72)');
    k.globalAlpha = a; k.fillStyle = d; k.fillRect(0, 0, CW, CH);
    // 炎: 3枚の揺れる滴形（橙→黄）
    const flame = (h, w, col, ph) => {
      const sw = 3 * Math.sin(T * 9 + ph);
      k.fillStyle = col; k.beginPath(); k.moveTo(FX - w, FY);
      k.quadraticCurveTo(FX - w, FY - h * 0.5, FX + sw, FY - h * (0.92 + 0.08 * Math.sin(T * 11 + ph)));
      k.quadraticCurveTo(FX + w, FY - h * 0.5, FX + w, FY); k.closePath(); k.fill();
    };
    k.globalCompositeOperation = 'lighter';
    flame(34 * fl, 14, '#E8501E', 0); flame(26 * fl, 10, '#FF9A2E', 1.3); flame(15 * fl, 6, '#FFE07A', 2.1);
    k.globalCompositeOperation = 'source-over';
    k.fillStyle = '#3A2418'; k.beginPath(); k.roundRect(FX - 22, FY - 2, 44, 6, 3); k.fill();
    // 火の粉: 決まった種で作り、周期ごとに下から上へ（1周で整数回）
    const sparks = once('embers', () => { const r = rng(42), o = []; for (let i = 0; i < 16; i++) o.push([r(), r() * TAU, 1 + Math.floor(r() * 2), 1 + r() * 1.2]); return o; });
    k.globalCompositeOperation = 'lighter'; k.fillStyle = '#FFB34D';
    for (const [o0, ph, n, sz] of sparks) {
      const t = (u / CYC * n + o0) % 1, x = FX + 12 * Math.sin(ph) + 18 * t * Math.sin(T + ph), y = FY - 10 - t * 150;
      k.globalAlpha = a * (1 - t); k.beginPath(); k.arc(x, y, sz, 0, TAU); k.fill();
    }
    k.restore();
    hud(k, '1800K');
  });

  // @element 43
  // 屏幕光（画面の光）: 部屋が暗くなり、人物の前の背中向きのノートPCだけが光る。冷たい白い光が正面の少し下から顔と胸元を照らし、
  // 外へはすぐ弱まる。画面の中身が切り替わる瞬間に明るさが少し跳ねる
  CELLS[42] = cell((k, u) => {
    const a = env(u), D = pen(k);
    stagePortrait(k, pal(BASE, DARK, a));
    k.save(); k.globalAlpha = 0.8 * a; D.rect(0, 0, CW, CH, '#0F1116'); k.restore();
    // 切り替え: 1.9 秒・3.1 秒に一瞬明るくなる
    const jump = 1 + 0.18 * (Math.exp(-(((u - 1.9) / 0.06) ** 2)) + Math.exp(-(((u - 3.1) / 0.06) ** 2)));
    const LX = PX, LY = 176, cool = mixc(BASE.person, '#DCE8FF', a), sh = mixc(BASE.person, '#0C0E14', a);
    bust(k, PX, PY, PR, sh, kk => {
      const g = kk.createRadialGradient(LX, LY, 6, LX, LY, 120 * jump);
      g.addColorStop(0, cool); g.addColorStop(0.55, mixc(cool, sh, 0.5)); g.addColorStop(1, sh);
      kk.fillStyle = g; kk.fillRect(0, 0, CW, CH);
    });
    if (a > 0.002) {
      k.save(); k.globalCompositeOperation = 'lighter';
      const s = k.createRadialGradient(LX, LY, 4, LX, LY, 110 * jump);
      s.addColorStop(0, `rgba(190,215,255,${(0.32 * a).toFixed(3)})`); s.addColorStop(1, 'rgba(190,215,255,0)');
      k.fillStyle = s; k.fillRect(0, 0, CW, CH); k.restore();
      // ノートPC（背中向き）: 天板と、縁からもれる光
      k.save(); k.globalAlpha = a;
      D.rr(LX - 58, LY - 18, 116, 50, 5, '#272A32'); D.circ(LX, LY + 6, 4, '#3A3E48');
      k.globalCompositeOperation = 'lighter'; k.globalAlpha = 0.6 * a * jump; D.rect(LX - 56, LY - 20, 112, 2, '#CFE0FF');
      k.restore();
    }
    hud(k, '6500K');
  });

  // @element 44
  // 雾中光（霧の中の光）: 夕方の街並みに霧が出る。遠い山・建物の列・並木と街灯・手前の人物の4層があり、
  // 1層描くごとに霧の色を薄く重ねるので、遠い層ほど何度も霧をかぶって霧の色に近づき、コントラストが下がる（空気遠近）。
  // 地平線のあたりを霧の帯がゆっくり流れ、街灯は霧の中で大きな光の輪になる。手前の人物はくっきり残る
  const FOGW = 68, FOGH = 26;
  const FOGLO = once('fog-lo', () => { const c = document.createElement('canvas'); c.width = FOGW; c.height = FOGH; return c; });
  CELLS[43] = cell((k, u) => {
    const a = env(u), T = u / CYC * TAU, D = pen(k), FOG = '#D5DADF';
    // 夕方の色: 晴れた昼（BASE）から、街灯の灯る青灰色の夕方へ。霧の差が見えるよう、建物と木は濃い色にする
    const DUSK = Object.assign({}, BASE, {
      sky: '#C9D1DA', sky2: '#D3D9DF', far: '#56677C', bld: '#4F5D73', edge: '#3F4B5E', win: '#FFD27A', winOff: '#435064',
      tree: '#34493F', trunk: '#2B3330', post: '#262C36', bulb: '#FFD27A', ground: '#8C949E', ground2: '#5D6672', mark: '#8C949E', person: '#232A38'
    });
    const p = pal(BASE, DUSK, a);
    // 霧を1枚かぶせる（深さ d ぶん）。下ほど少し薄くして、地面に近い霧が溜まって見えるように
    const veil = d => {
      if (a < 0.002) return;
      const g = k.createLinearGradient(0, 40, 0, CH);
      g.addColorStop(0, mixc(FOG, '#FFFFFF', 0.2)); g.addColorStop(1, FOG);
      k.save(); k.globalAlpha = d * a; k.fillStyle = g; k.fillRect(0, 0, CW, CH); k.restore();
    };
    D.rect(0, 0, CW, CH, p.sky);
    // 4: 遠い山
    D.poly([[0, 112], [70, 82], [150, 100], [232, 66], [318, 96], [400, 74], [480, 94], [539, 80], [539, ROAD], [0, ROAD]], p.far);
    veil(0.42);
    // 3: 建物の列（窓は夕方に灯る）
    BLD.forEach(([x, w, h], i) => building(D, x, ROAD, w, h * 0.8, p, i));
    veil(0.32);
    // 霧の帯: 小さな面に白い塊を描いて引き伸ばす（ぼかし代わり）。1周で整数回横に流れる
    if (a > 0.002) {
      const g = FOGLO.getContext('2d');
      g.clearRect(0, 0, FOGW, FOGH);
      for (let i = 0; i < 7; i++) {
        const x = ((i * 13 + u / CYC * FOGW * (1 + (i % 2))) % (FOGW + 24)) - 12, y = 12 + 4 * Math.sin(i * 2.1), r = 7 + (i % 3) * 3;
        const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(240,243,246,0.9)'); gr.addColorStop(1, 'rgba(240,243,246,0)');
        g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
      }
      k.save(); k.globalAlpha = 0.7 * a; k.imageSmoothingEnabled = true; k.drawImage(FOGLO, 0, 50, CW, 100); k.restore();
    }
    // 2: 並木・街灯・道
    TREES.forEach(([x, r]) => tree(D, x, ROAD, r, p));
    LAMPS.forEach(x => lamp(D, x, ROAD, 58, p));
    D.rect(0, ROAD, CW, WALK - ROAD, p.ground2); D.line([[0, 147], [CW, 147]], 2, p.mark, [14, 12]);
    veil(0.22);
    // 街灯の光の輪: 霧の粒が光を散らすので、電球の周りに大きな輪と下へ広がる光の円錐が出る
    if (a > 0.002) {
      k.save(); k.globalCompositeOperation = 'lighter';
      for (const x of LAMPS) {
        const bx = x + 9, by = ROAD - 53, R = 18 + 26 * a;
        const g = k.createRadialGradient(bx, by, 1, bx, by, R);
        g.addColorStop(0, `rgba(255,214,140,${(0.6 * a).toFixed(3)})`); g.addColorStop(0.35, `rgba(255,214,140,${(0.2 * a).toFixed(3)})`); g.addColorStop(1, 'rgba(255,214,140,0)');
        k.fillStyle = g; k.fillRect(bx - R, by - R, R * 2, R * 2);
        const c = k.createLinearGradient(0, by, 0, ROAD + 4);
        c.addColorStop(0, `rgba(255,214,140,${(0.22 * a).toFixed(3)})`); c.addColorStop(1, 'rgba(255,214,140,0)');
        k.fillStyle = c; k.beginPath(); k.moveTo(bx - 3, by); k.lineTo(bx + 3, by); k.lineTo(bx + 22, ROAD + 4); k.lineTo(bx - 22, ROAD + 4); k.closePath(); k.fill();
      }
      k.restore();
    }
    // 1: 手前の歩道と人物（霧はかけない）
    D.rect(0, WALK, CW, CH - WALK, p.ground); D.line([[0, WALK], [CW, WALK]], 1.4, p.edge);
    figure(D, FIG[0], FIG[1], FIG[2], p.person);
    hud(k, `FOG ${Math.round(a * 100)}%`);
  });

  // @element 45
  // 月光夜景（月夜）: 空が黒に近い深い青になり、左上に満月が昇る。人物は高い所からの冷たい青い光で片側だけ照らされ、影ははっきり。
  // 地面に銀色の照り返しが一筋。窓は灯らず、色はごく少ない
  CELLS[44] = cell((k, u) => {
    const a = env(u), W = torsoW(PR);
    const MOON = Object.assign(mapPal(NIGHT, c => mixc(c, '#0A1020', 0.5)), { win: '#1C2640', winOff: '#1C2640', bulb: '#1C2640', sky: '#0D1630', sky2: '#122042', person: '#2A3550', shade: '#0E1424' });
    const p = pal(BASE, MOON, a);
    stagePortrait(k, p, { after: D => {
      if (a < 0.002) return;
      const my = lerp(70, 38, a);
      D.k.save(); D.k.globalAlpha = 0.25 * a; D.circ(84, my, 30, '#C9DAF5'); D.k.globalAlpha = a; D.circ(84, my, 16, '#EEF4FF'); D.k.restore();
      // 地面の銀色の照り返し（月の下にゆれる細い帯）
      D.k.save(); D.k.globalAlpha = 0.7 * a;
      for (let i = 0; i < 5; i++) D.rect(66 - i * 3 + 6 * Math.sin(u * TAU / CYC * 2 + i), 156 + i * 9, 36 + i * 6, 2.2, '#BFD3F2');
      D.k.restore();
    } });
    const lit = mixc(BASE.person, '#9DB4DE', a), sh = mixc(BASE.person, MOON.shade, a);
    bust(k, PX, PY, PR, BASE.person, kk => {
      kk.fillStyle = lit; kk.beginPath(); kk.arc(PX, PY, PR, 0, TAU); kk.fill();
      headShade(kk, PX, PY, PR, 1.1, 1, sh);
      torso(kk, PX, PY, PR, PX - W, PX - 0.35 * W, lit); torso(kk, PX, PY, PR, PX - 0.35 * W, PX + W, sh);
    });
    plan(k, [[1.1, a, '#9DB4DE']]);
    hud(k, '4100K · ↑60°');
  });

  // @element 46
  // 双色光（バイカラー）: 周りが暗くなり、左にマゼンタ、右にシアンの灯がともる。人物の左右が別の色に染まり、
  // 鼻筋のあたりで2色が混ざって淡い紫になる。配置図にも色の違う2灯
  CELLS[45] = cell((k, u) => {
    const a = env(u), MG = '#FF3FA4', CY = '#33D6FF';
    stagePortrait(k, pal(BASE, DARK, a));
    bust(k, PX, PY, PR, BASE.person, kk => {
      if (a < 0.002) return;
      const g = kk.createLinearGradient(PX - 2.2 * PR, 0, PX + 2.2 * PR, 0);
      g.addColorStop(0, MG); g.addColorStop(0.42, MG); g.addColorStop(0.5, '#A98CFF'); g.addColorStop(0.58, CY); g.addColorStop(1, CY);
      kk.globalAlpha = a; kk.fillStyle = g; kk.fillRect(0, 0, CW, CH);
      // 胴の陰り: 下ほど暗く
      const v = kk.createLinearGradient(0, PY, 0, CH); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,10,20,0.45)');
      kk.fillStyle = v; kk.fillRect(0, 0, CW, CH);
    });
    // 壁に色のこぼれ
    if (a > 0.002) {
      k.save(); k.globalCompositeOperation = 'lighter';
      for (const [x, c] of [[60, '255,63,164'], [480, '51,214,255']]) {
        const g = k.createRadialGradient(x, 80, 6, x, 80, 200); g.addColorStop(0, `rgba(${c},${(0.32 * a).toFixed(3)})`); g.addColorStop(1, `rgba(${c},0)`);
        k.fillStyle = g; k.fillRect(0, 0, CW, CH);
      }
      k.restore();
    }
    plan(k, [[Math.PI / 2, a, MG], [-Math.PI / 2, a, CY]]);
    hud(k, 'MAGENTA · CYAN');
  });

  // @element 47
  // 色温（色温度）: 右下に K の目盛り。針が 5500K → 2000K（画面が橙）→ 10000K（画面が青）→ 5500K と動き、
  // 画面の冷暖が数値に合わせて変わる。数値が低いほど暖かい
  CELLS[46] = cell((k, u) => {
    // K の動き: 0.4〜1.4 で 2000K へ、2.0〜3.0 で 10000K へ、3.6〜4.6 で 5500K へ戻る
    const K = 5500 + (2000 - 5500) * eIO(P(u, 0.4, 1.4)) + (10000 - 2000) * eIO(P(u, 2.0, 3.0)) + (5500 - 10000) * eIO(P(u, 3.6, 4.6));
    stageLand(k, BASE);
    const [col, al] = kelvin(K);
    if (al > 0.001) { k.save(); k.globalCompositeOperation = 'multiply'; k.globalAlpha = al * 1.6; k.fillStyle = col; k.fillRect(0, 0, CW, CH); k.restore(); }
    // 目盛り: 2000〜10000K のグラデーション帯と針
    const x = CW - 13 - 150, y = CH - 13 - 34, w = 150, D = pen(k);
    k.save();
    k.fillStyle = 'rgba(255,255,255,.9)'; k.beginPath(); k.roundRect(x, y, w, 34, 8); k.fill();
    const g = k.createLinearGradient(x + 10, 0, x + w - 10, 0);
    for (const [kv, c] of KELVIN) g.addColorStop((kv - 2000) / 8000, kv === 5500 ? '#FFFFFF' : c);
    k.fillStyle = g; k.beginPath(); k.roundRect(x + 10, y + 8, w - 20, 8, 4); k.fill();
    k.strokeStyle = '#CFCECB'; k.lineWidth = 1; k.stroke();
    const px = x + 10 + (w - 20) * (K - 2000) / 8000;
    D.poly([[px, y + 18], [px - 4, y + 25], [px + 4, y + 25]], '#6E6E73');
    k.restore();
    hud(k, `${Math.round(K / 100) * 100}K`);
  });

  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});
