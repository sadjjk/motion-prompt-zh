/* Motion Prompt · pack "lp" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt */
MotionPrompt.pack('lp', function () {
  // @kit
  // LP・Webサイトの演出の名前 24（各カード 539x208・4.8秒周期。各コマは時間 u の純関数）
  // カードの中にブラウザの窓を1つ描き、その中の簡略化したページで演出を見せる。
  // きっかけ（スクロールバー・カーソル・クリック）も一緒に描く。色は 地・文字・差し色（朱）＋写真用の青。
  const CW = 539, CH = 208;
  const CYC = 4.8;                                   // 各カードは4.8秒周期（ループの継ぎ目なし）
  const C = {
    desk: '#E7EAF0', win: '#FFFFFF', bar: '#F3F5F8', rule: '#E2E6ED', ink: '#1C2333', sub: '#7D879B',
    faint: '#DCE1EA', soft: '#F3F5F9', skel: '#E4E8EF', acc: '#FF5A2C', accL: '#FFE5DB', blue: '#3B64E8', blueL: '#E1E8FF'
  };
  const JP = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Hiragino Sans", sans-serif';   // 画面文字为简体中文：中文字体优先，日文字体作后备
  const EN = '"Avenir Next", "Helvetica Neue", system-ui, sans-serif';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;   // easeInOut（3乗）
  const eIOs = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;      // easeInOut（2乗）
  const eOut = x => 1 - Math.pow(1 - x, 3);                                      // easeOut（3乗）
  const eIn = x => x * x * x;
  const mod = (a, n) => ((a % n) + n) % n;
  // GSAP の elastic.out(1, 0.3) と同じ式
  const eEl = x => x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x - 0.075) * 2 * Math.PI / 0.3) + 1;
  function rr(k, x, y, w, h, r) { k.beginPath(); k.roundRect(x, y, w, h, r); }
  function txt(k, s, x, y, font, col, align = 'left', base = 'alphabetic', ls = '0px') {
    k.font = font; k.fillStyle = col; k.textAlign = align; k.textBaseline = base; k.letterSpacing = ls; k.fillText(s, x, y); k.letterSpacing = '0px';
  }
  // キーフレーム [[秒, 値], …] を easeInOut（3乗）でつなぐ。u は周期で折り返す
  function steps(keys, u) {
    u = mod(u, CYC);
    if (u <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (u < keys[i][0]) { const [t0, a] = keys[i - 1], [t1, b] = keys[i]; return lerp(a, b, eIO((u - t0) / (t1 - t0))); }
    return keys[keys.length - 1][1];
  }
  // カーソルの通り道 [[秒, x, y], …]（easeInOut 3乗でつなぐ）
  function path(keys, u) {
    u = mod(u, CYC);
    if (u <= keys[0][0]) return [keys[0][1], keys[0][2]];
    for (let i = 1; i < keys.length; i++) if (u < keys[i][0]) { const a = keys[i - 1], b = keys[i], f = eIO((u - a[0]) / (b[0] - a[0])); return [lerp(a[1], b[1], f), lerp(a[2], b[2], f)]; }
    const l = keys[keys.length - 1]; return [l[1], l[2]];
  }
  // on(t) が最後に切り替わった時刻から dur 秒の遷移（CSS の transition と同じ考え方）。過去へさかのぼって調べる
  function trans(on, u, dur, ease = eOut) {
    const s = on(u);
    for (let i = 0, t = u; i < 600; i++, t -= 1 / 120) if (on(t - 1 / 120) !== s) { const q = ease(P(u, t, t + dur)); return s ? q : 1 - q; }
    return s ? 1 : 0;
  }
  // ブラウザの窓。中のページは V（511x168）の座標で描く
  const WIN = { x: 14, y: 8, w: 511, h: 192, r: 10, bar: 24 };
  const VW = WIN.w, VH = WIN.h - WIN.bar;
  function frame(k, url = 'example.com') {
    k.fillStyle = C.desk; k.fillRect(0, 0, CW, CH);
    k.save(); k.shadowColor = 'rgba(28,35,51,.16)'; k.shadowBlur = 16; k.shadowOffsetY = 4;
    k.fillStyle = C.win; rr(k, WIN.x, WIN.y, WIN.w, WIN.h, WIN.r); k.fill(); k.restore();
    k.save(); rr(k, WIN.x, WIN.y, WIN.w, WIN.h, WIN.r); k.clip();
    k.fillStyle = C.bar; k.fillRect(WIN.x, WIN.y, WIN.w, WIN.bar); k.fillStyle = C.rule; k.fillRect(WIN.x, WIN.y + WIN.bar - 1, WIN.w, 1); k.restore();
    for (let i = 0; i < 3; i++) { k.fillStyle = '#CDD3DD'; k.beginPath(); k.arc(WIN.x + 15 + i * 12, WIN.y + 12, 3.6, 0, 7); k.fill(); }
    k.fillStyle = '#E6E9EF'; rr(k, WIN.x + WIN.w / 2 - 110, WIN.y + 5, 220, 14, 7); k.fill();
    txt(k, url, WIN.x + WIN.w / 2, WIN.y + 12.5, `500 9.5px ${EN}`, C.sub, 'center', 'middle');
  }
  function view(k, fn) {
    k.save(); rr(k, WIN.x, WIN.y + WIN.bar, VW, VH, [0, 0, WIN.r, WIN.r]); k.clip(); k.translate(WIN.x, WIN.y + WIN.bar);
    k.fillStyle = '#fff'; k.fillRect(0, 0, VW, VH); fn(); k.restore();
  }
  // スクロールバー（つまみだけ。pos 0〜1、ratio＝見えている割合）
  function sbar(k, pos, ratio = 0.42) { const th = (VH - 8) * ratio; k.fillStyle = 'rgba(28,35,51,.38)'; rr(k, VW - 9, 4 + (VH - 8 - th) * clamp(pos), 5, th, 2.5); k.fill(); }
  // 文字の代わりの棒（n 行。最後の行は短い）
  function bars(k, x, y, w, n, col = C.faint, hh = 6, gap = 11, last = 0.62) {
    k.fillStyle = col; for (let i = 0; i < n; i++) { rr(k, x, y + i * gap, i === n - 1 && n > 1 ? w * last : w, hh, hh / 2); k.fill(); }
  }
  // 写真の代わりの絵（空・太陽・山）。v で色ちがい、z で中身だけ拡大（枠は固定）
  const PICS = [
    { sky: ['#A9C0FF', '#E4EBFF'], sun: '#FF5A2C', sx: .74, sy: .32, m1: '#7D9AF4', m2: '#4B6BDB' },
    { sky: ['#FFC7B2', '#FFEDE5'], sun: '#FFFFFF', sx: .28, sy: .34, m1: '#F4977A', m2: '#DD5F3B' },
    { sky: ['#3A4884', '#7484CC'], sun: '#FFE5DB', sx: .6, sy: .3, m1: '#2B3770', m2: '#1C2349' }
  ];
  const M1 = [[0, .62], [.22, .4], [.42, .56], [.66, .3], [.86, .5], [1, .42]], M2 = [[0, .8], [.28, .6], [.5, .76], [.76, .58], [1, .74]];
  function mount(k, w, h, pts, col, flip) { k.fillStyle = col; k.beginPath(); k.moveTo(flip ? w : 0, h + 1); pts.forEach(([a, b]) => k.lineTo((flip ? 1 - a : a) * w, b * h)); k.lineTo(flip ? 0 : w, h + 1); k.closePath(); k.fill(); }
  function pic(k, x, y, w, h, v = 0, r = 6, z = 1) {
    const p = PICS[v % PICS.length];
    k.save(); rr(k, x, y, w, h, r); k.clip();
    k.translate(x + w / 2, y + h / 2); k.scale(z, z); k.translate(-w / 2, -h / 2);
    const g = k.createLinearGradient(0, 0, 0, h); g.addColorStop(0, p.sky[0]); g.addColorStop(1, p.sky[1]); k.fillStyle = g; k.fillRect(-1, -1, w + 2, h + 2);
    k.fillStyle = p.sun; k.beginPath(); k.arc(w * p.sx, h * p.sy, Math.min(w, h) * 0.13, 0, 7); k.fill();
    mount(k, w, h, M1, p.m1, v % 2); mount(k, w, h, M2, p.m2, (v + 1) % 2);
    k.restore();
  }
  function btn(k, x, y, w, h, label, col = C.acc, tcol = '#fff', fs = 12) {
    k.fillStyle = col; rr(k, x, y, w, h, h / 2); k.fill(); txt(k, label, x + w / 2, y + h / 2 + 0.5, `700 ${fs}px ${JP}`, tcol, 'center', 'middle');
  }
  function logo(k, x, y, col = C.ink) { k.fillStyle = C.acc; rr(k, x, y - 7, 14, 14, 4); k.fill(); txt(k, 'SAMPLE', x + 20, y + 0.5, `800 12px ${EN}`, col, 'left', 'middle', '1px'); }
  // ページのヘッダー（高さ34）
  const NAVX = [300, 346, 392];
  function header(k, y, active = -1) {
    k.fillStyle = '#fff'; k.fillRect(0, y, VW, 34); k.fillStyle = C.rule; k.fillRect(0, y + 33, VW, 1);
    logo(k, 18, y + 17);
    ['特色', '价格', 'FAQ'].forEach((s, i) => txt(k, s, NAVX[i], y + 17.5, `600 12px ${JP}`, active === i ? C.acc : C.ink, 'left', 'middle'));
    btn(k, 428, y + 7, 70, 20, '免费试用', C.acc, '#fff', 10.5);
  }
  // マウスのカーソル（矢印）。press で少し縮む
  function cursor(k, x, y, press = 0) {
    const s = 1.2 * (1 - 0.12 * press);
    k.save(); k.translate(x, y); k.scale(s, s); k.beginPath();
    [[0, 0], [0, 16.5], [4.2, 12.6], [7, 19], [9.8, 17.8], [7.1, 11.6], [12.6, 11.6]].forEach(([a, b], i) => i ? k.lineTo(a, b) : k.moveTo(a, b));
    k.closePath(); k.lineJoin = 'round'; k.lineWidth = 1.6; k.strokeStyle = '#fff'; k.fillStyle = C.ink; k.fill(); k.stroke(); k.restore();
  }
  // クリックした所に出る小さな輪（0.35秒）と、押している間の縮み
  function click(k, x, y, u, times) {
    let press = 0;
    for (const tc of times) {
      const d = mod(u - tc + 0.1, CYC) - 0.1;
      if (d > -0.1 && d < 0.12) press = Math.max(press, 1 - Math.abs(d - 0.01) / 0.11);
      if (d >= 0 && d < 0.35) { const q = d / 0.35; k.strokeStyle = `rgba(28,35,51,${0.45 * (1 - q)})`; k.lineWidth = 2; k.beginPath(); k.arc(x, y, 5 + 13 * eOut(q), 0, 7); k.stroke(); }
    }
    cursor(k, x, y, clamp(press));
  }
  // 回る読み込み表示（0.8秒で1回転）
  function spinner(k, x, y, r, u, col = C.acc) {
    const a = u / 0.8 * Math.PI * 2;
    k.lineCap = 'round'; k.lineWidth = r * 0.28; k.strokeStyle = C.faint; k.beginPath(); k.arc(x, y, r, 0, 7); k.stroke();
    k.strokeStyle = col; k.beginPath(); k.arc(x, y, r, a, a + Math.PI * 0.6); k.stroke(); k.lineCap = 'butt';
  }
  // ページ上の top にある要素が、判定線 line より上に入った時刻（画面の下へ出たらリセット）。過去 CYC 秒をさかのぼる
  function enteredAt(sy, top, line, u) {
    const dt = 1 / 120, y = t => top - sy(t);
    if (y(u) >= VH) return null;
    for (let t = u; t > u - CYC; t -= dt) {
      const a = y(t), b = y(t - dt);
      if (a >= VH) return null;
      if (a < line && b >= line) return t - dt + dt * (b - line) / (b - a);
    }
    return y(u) < line ? -1e9 : null;
  }
  const CELLS = [];

  // @element 01
  // 01 パララックススクロール（スクロールすると、空・山・見出しが違う速さで動く）
  CELLS[0] = (k, w, h, u) => {
    frame(k);
    const s = steps([[0.3, 0], [1.9, 1], [2.9, 1], [4.3, 0]], u), y = s * 120;
    view(k, () => {
      const g = k.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, '#9DB6FB'); g.addColorStop(1, '#E6ECFF');
      k.save(); k.translate(0, -y * 0.15);                         // 空と太陽: 0.15倍
      k.fillStyle = g; k.fillRect(0, 0, VW, 260); k.fillStyle = C.acc; k.beginPath(); k.arc(392, 54, 25, 0, 7); k.fill(); k.restore();
      k.save(); k.translate(0, -y * 0.4); mount(k, VW, 190, M1, '#7D9AF4', 0); k.restore();   // 遠い山: 0.4倍
      k.save(); k.translate(0, -y * 0.7); mount(k, VW, 205, M2, '#4B6BDB', 1); k.restore();   // 近い山: 0.7倍
      k.save(); k.translate(0, -y);                                // 見出し・ボタン・次のセクション: 1倍
      txt(k, '去山里走走。', 34, 64, `800 28px ${JP}`, '#fff', 'left', 'alphabetic', '1px');
      bars(k, 34, 78, 160, 2, 'rgba(255,255,255,.85)');
      btn(k, 34, 106, 92, 26, '立即预订');
      k.fillStyle = '#fff'; k.fillRect(0, VH, VW, 200);
      txt(k, '热门路线', 34, VH + 34, `800 16px ${JP}`, C.ink);
      for (let i = 0; i < 3; i++) { pic(k, 34 + i * 152, VH + 50, 136, 58, i, 6); bars(k, 34 + i * 152, VH + 116, 110, 1, C.faint); }
      k.restore();
      sbar(k, s * 0.35, 0.4);
    });
  };

  // @element 02
  // 02 スクロールでフェードイン（画面に入った要素が、下から浮かび上がって現れる）
  CELLS[1] = (k, w, h, u) => {
    frame(k);
    const SY = t => steps([[0.35, 0], [1.0, 95], [1.5, 95], [2.1, 200], [3.2, 200], [4.4, 0]], t), y = SY(u);
    const LINE = VH * 0.85, DUR = 0.7, RISE = 28;
    view(k, () => {
      k.save(); k.translate(0, -y);
      txt(k, '让生活更轻松。', 34, 52, `800 24px ${JP}`, C.ink); bars(k, 34, 68, 190, 3); btn(k, 34, 108, 96, 26, '了解更多');
      pic(k, 286, 18, 196, 110, 0, 8);
      const items = [
        [172, () => txt(k, '选择我们的 3 个理由', VW / 2, 172 + 20, `800 18px ${JP}`, C.ink, 'center')],
        [206, () => { for (let i = 0; i < 3; i++) { const x = 34 + i * 152; k.fillStyle = C.soft; rr(k, x, 206, 136, 106, 8); k.fill(); pic(k, x + 8, 214, 120, 56, i, 5); bars(k, x + 10, 280, 112, 2, '#CBD2DE'); } }],
        [334, () => bars(k, 110, 334, 290, 3, C.faint, 7, 13)]
      ];
      for (const [top, draw] of items) {
        const t0 = enteredAt(SY, top, LINE, u); if (t0 === null) continue;
        const q = eOut(P(u, t0, t0 + DUR));
        k.save(); k.globalAlpha = q; k.translate(0, RISE * (1 - q)); draw(); k.restore();
      }
      k.restore();
      sbar(k, y / 200, 0.5);
    });
  };

  // @element 03
  // 03 追従ヘッダー（スクロールすると、ヘッダーが画面の上で止まってついてくる）
  CELLS[2] = (k, w, h, u) => {
    frame(k);
    const y = steps([[0.4, 0], [1.3, 110], [1.9, 110], [2.8, 250], [3.4, 250], [4.4, 0]], u);
    const STRIP = 22;
    view(k, () => {
      k.save(); k.translate(0, -y);
      pic(k, 24, 70, 214, 112, 0, 8);
      txt(k, '开启崭新的每一天，', 262, 104, `800 22px ${JP}`, C.ink); bars(k, 262, 120, 210, 3); btn(k, 262, 160, 100, 26, '了解更多');
      k.fillStyle = C.soft; k.fillRect(0, 212, VW, 240);
      txt(k, '特色', VW / 2, 246, `800 18px ${JP}`, C.ink, 'center');
      for (let i = 0; i < 3; i++) { const x = 34 + i * 152; k.fillStyle = '#fff'; rr(k, x, 262, 136, 120, 8); k.fill(); pic(k, x + 8, 270, 120, 58, i, 5); bars(k, x + 10, 340, 110, 3, C.faint, 6, 11); }
      k.fillStyle = C.ink; k.fillRect(0, 0, VW, STRIP);
      txt(k, '限时活动进行中', VW / 2, STRIP / 2 + 0.5, `600 11px ${JP}`, '#fff', 'center', 'middle');
      k.restore();
      const hy = Math.max(STRIP - y, 0), sh = clamp((y - STRIP) / 24);
      if (sh > 0) { const g = k.createLinearGradient(0, hy + 34, 0, hy + 46); g.addColorStop(0, `rgba(28,35,51,${0.16 * sh})`); g.addColorStop(1, 'rgba(28,35,51,0)'); k.fillStyle = g; k.fillRect(0, hy + 34, VW, 12); }
      header(k, hy);
      sbar(k, y / 250, 0.42);
    });
  };

  // @element 04
  // 04 ピン留め（セクションが画面に止まったまま、中身だけがスクロールで進む）
  CELLS[3] = (k, w, h, u) => {
    frame(k);
    const y = steps([[0.3, 0], [3.0, 500], [3.5, 500], [4.5, 0]], u);
    const PIN0 = 110, PD = 300;
    const top = y < PIN0 ? PIN0 - y : y < PIN0 + PD ? 0 : PIN0 + PD - y, p = clamp((y - PIN0) / PD);
    // 中身は 1/3・2/3 の所で次のステップへ（前後 ±0.07 の範囲で easeInOut）
    const f = eIO(P(p, 1 / 3 - 0.07, 1 / 3 + 0.07)) + eIO(P(p, 2 / 3 - 0.07, 2 / 3 + 0.07));
    view(k, () => {
      txt(k, '3 步完成', 34, 56 - y, `800 22px ${JP}`, C.ink); bars(k, 34, 72 - y, 240, 2);
      k.save(); k.translate(0, top);
      k.fillStyle = C.ink; k.fillRect(0, 0, VW, VH);
      // 左: STEP の番号（スクロール量に合わせて回る）
      txt(k, 'STEP', 34, 40, `700 12px ${EN}`, 'rgba(255,255,255,.6)', 'left', 'alphabetic', '2px');
      k.save(); k.beginPath(); k.rect(30, 46, 120, 52); k.clip();
      for (let i = 0; i < 3; i++) txt(k, '0' + (i + 1), 32, 90 + (i - f) * 52, `800 46px ${EN}`, '#fff');
      k.restore();
      bars(k, 34, 110, 150, 3, 'rgba(255,255,255,.28)');
      // 進み具合の線
      k.fillStyle = 'rgba(255,255,255,.16)'; rr(k, 232, 22, 4, 124, 2); k.fill();
      k.fillStyle = C.acc; rr(k, 232, 22, 4, 124 * p, 2); k.fill();
      // 右: 写真が順に入れ替わる
      k.save(); rr(k, 256, 22, 226, 124, 8); k.clip();
      for (let i = 0; i < 3; i++) pic(k, 256, 22 + (i - f) * 124, 226, 124, i, 0);
      k.restore();
      k.fillStyle = '#fff'; k.fillRect(0, VH, VW, 200); bars(k, 34, VH + 30, 300, 3);
      k.restore();
      sbar(k, y / 500, 0.3);
    });
  };

  // @element 05
  // 05 横スクロール（縦にスクロールすると、カードの列が横へ流れる）
  CELLS[4] = (k, w, h, u) => {
    frame(k);
    const y = steps([[0.3, 0], [3.0, 420], [3.5, 420], [4.5, 0]], u);
    const PIN0 = 40, PD = 380, N = 4, PWD = 200, GAP = 20;
    const top = y < PIN0 ? PIN0 - y : 0, p = clamp((y - PIN0) / PD);
    const travel = 34 * 2 + N * PWD + (N - 1) * GAP - VW;
    view(k, () => {
      txt(k, 'WORKS', 34, 30 - y, `800 20px ${EN}`, C.ink, 'left', 'alphabetic', '2px');
      k.save(); k.translate(0, top);
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH + 40);
      for (let i = 0; i < N; i++) {
        const x = 34 + i * (PWD + GAP) - p * travel;
        pic(k, x, 18, PWD, 112, i % 3, 8);
        txt(k, '0' + (i + 1), x + 14, 118, `800 22px ${EN}`, '#fff');
        bars(k, x, 140, 120, 1, '#CBD2DE');
      }
      k.restore();
      sbar(k, y / 420, 0.36);
    });
  };

  // @element 06
  // 06 スクロールスナップ（少しスクロールすると、次のセクションの頭までピタッと送られる）
  CELLS[5] = (k, w, h, u) => {
    frame(k);
    const T = CYC / 2, lu = mod(u, T), dir = u < T ? 1 : -1, from = u < T ? 0 : VH, DRIFT = 34;
    const y = from + dir * (DRIFT * eOut(P(lu, 0.45, 0.85)) + (VH - DRIFT) * eOut(P(lu, 0.9, 1.5)));
    view(k, () => {
      k.save(); k.translate(0, -y);
      for (let i = 0; i < 2; i++) {
        const y0 = i * VH, dark = i === 1;
        k.fillStyle = dark ? C.ink : C.blueL; k.fillRect(0, y0, VW, VH);
        txt(k, '0' + (i + 1), 34, y0 + 70, `800 46px ${EN}`, C.acc);
        txt(k, dark ? '上手试用' : '了解产品', 34, y0 + 102, `800 18px ${JP}`, dark ? '#fff' : C.ink);
        bars(k, 34, y0 + 118, 170, 2, dark ? 'rgba(255,255,255,.3)' : '#C3CDEA');
        pic(k, 262, y0 + 24, 220, 120, dark ? 2 : 0, 8);
      }
      k.restore();
      sbar(k, y / VH, 0.5);
    });
  };

  // @element 07
  // 07 スクロールプログレスバー（読み進めた分だけ、画面上の線が伸びる）
  CELLS[6] = (k, w, h, u) => {
    frame(k);
    const MAX = 430;
    const y = steps([[0.3, 0], [0.75, 110], [1.15, 110], [1.6, 220], [2.0, 220], [2.45, 330], [2.85, 330], [3.3, MAX], [3.75, MAX], [4.55, 0]], u);
    view(k, () => {
      k.save(); k.translate(0, -y);
      txt(k, '网页设计入门', 70, 44, `800 20px ${JP}`, C.ink); bars(k, 70, 56, 120, 1, C.faint, 5);
      pic(k, 70, 74, 371, 112, 0, 8);
      for (let b = 0; b < 4; b++) { const y0 = 204 + b * 82; k.fillStyle = C.ink; rr(k, 70, y0, 140, 9, 4.5); k.fill(); bars(k, 70, y0 + 22, 371, 4, C.faint, 6, 12); }
      k.restore();
      k.fillStyle = C.faint; k.fillRect(0, 0, VW, 6);
      k.fillStyle = C.acc; k.fillRect(0, 0, VW * (y / MAX), 6);
      sbar(k, y / MAX, 0.3);
    });
  };

  // @element 08
  // 08 マーカーアニメーション（大事な言葉が画面に入ると、蛍光ペンの線が左から引かれる）
  CELLS[7] = (k, w, h, u) => {
    frame(k);
    const SY = t => steps([[0.35, 0], [1.0, 90], [1.6, 90], [2.2, 180], [3.3, 180], [4.4, 0]], t), y = SY(u);
    const LINE = VH * 0.8, DUR = 0.8, MARK = '#FFE36B', F = `800 20px ${JP}`;
    const rows = [[190, ['每天的饭菜', '只要 10 分钟', '就能做好。']], [290, ['新手也能', '一次成功的食谱', '全在这里。']]];
    view(k, () => {
      k.save(); k.translate(0, -y);
      txt(k, '为忙碌的人准备', 70, 50, `700 14px ${JP}`, C.sub); txt(k, '厨房新帮手', 70, 80, `800 24px ${JP}`, C.ink);
      bars(k, 70, 96, 330, 4, C.faint, 6, 12, 0.8);
      for (const [base, parts] of rows) {
        k.font = F; const ws = parts.map(s => k.measureText(s).width); let x = (VW - ws.reduce((a, b) => a + b, 0)) / 2;
        const t0 = enteredAt(SY, base - 20, LINE, u), q = t0 === null ? 0 : eOut(P(u, t0, t0 + DUR));
        if (q > 0) { k.fillStyle = MARK; k.fillRect(x + ws[0], base - 8, ws[1] * q, 11); }
        parts.forEach((s, i) => { txt(k, s, x, base, F, i === 1 ? C.ink : '#4A5368'); x += ws[i]; });
        bars(k, 110, base + 22, 291, 2, C.faint, 6, 12, 0.7);
      }
      k.restore();
      sbar(k, y / 180, 0.5);
    });
  };

  // @element 09
  // 09 ホバーで浮き上がる（カーソルが乗ったカードが、影をつけて少し持ち上がる）
  CELLS[8] = (k, w, h, u) => {
    frame(k);
    const CX = [26, 192, 358], CY = 18, CWD = 146, CHT = 128, LIFT = 10;
    const cur = t => path([[0, 70, 160], [0.45, 96, 78], [1.4, 110, 86], [1.62, 262, 80], [2.5, 276, 88], [2.72, 428, 80], [3.6, 440, 88], [4.0, 470, 160], [4.8, 70, 160]], t);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      for (let i = 0; i < 3; i++) {
        const inside = t => { const [x, y] = cur(t); return x > CX[i] && x < CX[i] + CWD && y > CY && y < CY + CHT; };
        const q = trans(inside, u, 0.3), x = CX[i], y = CY - LIFT * q;
        k.save(); k.shadowColor = `rgba(28,35,51,${0.08 + 0.14 * q})`; k.shadowBlur = 6 + 16 * q; k.shadowOffsetY = 2 + 10 * q;
        k.fillStyle = '#fff'; rr(k, x, y, CWD, CHT, 10); k.fill(); k.restore();
        pic(k, x + 8, y + 8, CWD - 16, 66, i, 6);
        txt(k, ['山间民宿', '海边民宿', '星空民宿'][i], x + 12, y + 96, `800 13px ${JP}`, C.ink); bars(k, x + 12, y + 106, 100, 1);
      }
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 10
  // 10 ホバーで画像ズーム（枠はそのままで、中の写真だけがゆっくり拡大する）
  CELLS[9] = (k, w, h, u) => {
    frame(k);
    const FX = [22, 267], FY = 16, FW = 222, FH = 118, ZOOM = 0.15;
    const cur = t => path([[0, 60, 160], [0.5, 120, 70], [1.8, 140, 84], [2.2, 370, 70], [3.4, 390, 84], [3.9, 470, 160], [4.8, 60, 160]], t);
    view(k, () => {
      for (let i = 0; i < 2; i++) {
        const inside = t => { const [x, y] = cur(t); return x > FX[i] && x < FX[i] + FW && y > FY && y < FY + FH; };
        const q = trans(inside, u, 0.5);
        pic(k, FX[i], FY, FW, FH, i, 8, 1 + ZOOM * q);
        txt(k, ['夏日山间小屋', '海边咖啡馆'][i], FX[i], FY + FH + 20, `800 13px ${JP}`, C.ink); bars(k, FX[i], FY + FH + 28, 150, 1);
      }
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 11
  // 11 マウスストーカー（カーソルのあとを、丸が少し遅れて追いかける）
  CELLS[10] = (k, w, h, u) => {
    frame(k);
    const cur = t => [255 + 175 * Math.sin(2 * Math.PI * t / CYC), 86 + 46 * Math.sin(4 * Math.PI * t / CYC)];
    // 毎フレーム（60fps）残りの距離の 12% ずつ近づく
    let t = u - 2, [fx, fy] = cur(t);
    for (let i = 0; i < 120; i++) { t += 1 / 60; const [tx, ty] = cur(t); fx += (tx - fx) * 0.12; fy += (ty - fy) * 0.12; }
    view(k, () => {
      txt(k, 'CREATIVE STUDIO', VW / 2, 74, `800 34px ${EN}`, C.ink, 'center', 'alphabetic', '3px');
      bars(k, VW / 2 - 120, 96, 240, 2, C.faint, 6, 12, 0.7);
      btn(k, VW / 2 - 50, 128, 100, 24, '查看作品', C.ink);
      k.fillStyle = C.acc; k.globalAlpha = 0.88; k.beginPath(); k.arc(fx, fy, 17, 0, 7); k.fill(); k.globalAlpha = 1;
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 12
  // 12 マグネティックボタン（カーソルが近づくと、ボタンが吸い寄せられ、離れるとぷるんと戻る）
  CELLS[11] = (k, w, h, u) => {
    frame(k);
    const BX = VW / 2, BY = 84, R = 110, PULL = 0.35;
    const cur = t => path([[0, -20, 130], [0.9, 170, 104], [1.5, 300, 62], [2.1, 318, 110], [2.7, 205, 66], [3.1, 250, 92], [3.6, 545, 120], [4.8, 545, 120]], t);
    const inside = t => { const [x, y] = cur(t); return Math.hypot(x - BX, y - BY) < R; };
    // 範囲に入った時刻から 60fps で目標（カーソルとの差 × 0.35）へ毎フレーム 18% ずつ近づく
    const pull = t => {
      let t0 = t; for (let i = 0; i < 600 && inside(t0 - 1 / 120); i++) t0 -= 1 / 120;
      let ox = 0, oy = 0; for (let s = t0; s <= t; s += 1 / 60) { const [x, y] = cur(s); ox += ((x - BX) * PULL - ox) * 0.18; oy += ((y - BY) * PULL - oy) * 0.18; }
      return [ox, oy];
    };
    let ox = 0, oy = 0;
    if (inside(u)) [ox, oy] = pull(u);
    else {
      let t1 = u; for (let i = 0; i < 600 && !inside(t1); i++) t1 -= 1 / 120;
      if (inside(t1)) { const [lx, ly] = pull(t1), e = 1 - eEl(P(u, t1, t1 + 1.1)); ox = lx * e; oy = ly * e; }
    }
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      k.save(); k.translate(BX + ox, BY + oy);
      k.shadowColor = 'rgba(255,90,44,.35)'; k.shadowBlur = 16; k.shadowOffsetY = 6;
      k.fillStyle = C.acc; rr(k, -84, -26, 168, 52, 26); k.fill(); k.shadowColor = 'transparent';
      txt(k, '联系我们', 0, 1, `800 16px ${JP}`, '#fff', 'center', 'middle');
      k.restore();
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 13
  // 13 リップルエフェクト（押した場所から、ボタンの中に波紋が広がる）
  CELLS[12] = (k, w, h, u) => {
    frame(k);
    const B = { x: 115, y: 78, w: 280, h: 56 }, TAPS = [[0.7, 165, 110], [2.9, 345, 100]], DUR = 0.6;
    const [cx, cy] = path([[0, 430, 160], [0.55, 165, 110], [1.6, 165, 110], [2.7, 345, 100], [3.6, 345, 100], [4.4, 430, 160], [4.8, 430, 160]], u);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      txt(k, '立即报名', VW / 2, 38, `800 18px ${JP}`, C.ink, 'center'); bars(k, VW / 2 - 110, 50, 220, 1, C.faint, 6, 11, 1);
      k.save(); k.shadowColor = 'rgba(28,35,51,.18)'; k.shadowBlur = 8; k.shadowOffsetY = 3; k.fillStyle = C.acc; rr(k, B.x, B.y, B.w, B.h, 10); k.fill(); k.restore();
      k.save(); rr(k, B.x, B.y, B.w, B.h, 10); k.clip();
      for (const [tc, px, py] of TAPS) {
        const d = u - tc; if (d < 0 || d > 0.8) continue;
        const Rm = Math.max(Math.hypot(px - B.x, py - B.y), Math.hypot(px - B.x - B.w, py - B.y), Math.hypot(px - B.x, py - B.y - B.h), Math.hypot(px - B.x - B.w, py - B.y - B.h));
        k.fillStyle = `rgba(255,255,255,${0.4 * (1 - P(d, 0.3, 0.8))})`; k.beginPath(); k.arc(px, py, Rm * eOut(P(d, 0, DUR)), 0, 7); k.fill();
      }
      k.restore();
      txt(k, '提交', VW / 2, B.y + B.h / 2 + 1, `800 17px ${JP}`, '#fff', 'center', 'middle');
      click(k, cx, cy, u, TAPS.map(a => a[0]));
    });
  };

  // @element 14
  // 14 下線アニメーション（リンクにカーソルを乗せると下線が左から伸び、離れると右へ抜ける）
  CELLS[13] = (k, w, h, u) => {
    frame(k);
    const LINKS = ['服务', '案例', '公司简介'], F = `800 20px ${JP}`, GAP = 56, LY = 84, DUR = 0.3;
    const cur = t => path([[0, 120, 150], [0.45, 170, 80], [1.3, 186, 84], [1.55, 268, 80], [2.4, 282, 84], [2.65, 372, 80], [3.5, 390, 84], [3.95, 430, 150], [4.8, 120, 150]], t);
    view(k, () => {
      logo(k, 22, 28); bars(k, 90, 132, 331, 2, C.faint, 6, 12, 0.6);
      k.font = F; const ws = LINKS.map(s => k.measureText(s).width); let x = (VW - ws.reduce((a, b) => a + b, 0) - GAP * (LINKS.length - 1)) / 2;
      LINKS.forEach((s, i) => {
        const x0 = x, x1 = x + ws[i], inside = t => { const [a, b] = cur(t); return a > x0 - 6 && a < x1 + 6 && b > LY - 22 && b < LY + 14; };
        txt(k, s, x0, LY, F, C.ink);
        // 最後に乗った・離れた時刻から 0.3秒（乗る: 左端から伸びる / 離れる: 左端から縮んで右へ抜ける）
        const on = inside(u); let tc = null; for (let j = 0, t = u; j < 600; j++, t -= 1 / 120) if (inside(t - 1 / 120) !== on) { tc = t; break; }
        if (tc !== null) {
          const q = eOut(P(u, tc, tc + DUR)), a = on ? 0 : q, b = on ? q : 1;
          if (b > a) { k.fillStyle = C.acc; k.fillRect(x0 + ws[i] * a, LY + 8, ws[i] * (b - a), 3); }
        }
        x += ws[i] + GAP;
      });
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 15
  // 15 ビフォーアフタースライダー（真ん中の線をドラッグすると、加工前と加工後の写真の境目が動く）
  CELLS[14] = (k, w, h, u) => {
    frame(k);
    const F = { x: 76, y: 14, w: 359, h: 140 };
    const pos = steps([[0.75, 0.5], [1.55, 0.2], [2.65, 0.82], [3.55, 0.5]], u), hx = F.x + F.w * pos, hy = F.y + F.h / 2;
    const drag = u > 0.68 && u < 3.62;
    const [cx, cy] = u < 0.7 ? path([[0, 430, 160], [0.62, hx, hy + 4]], u) : drag ? [hx, hy + 4] : path([[3.6, hx, hy + 4], [4.3, 430, 160], [4.8, 430, 160]], u);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      pic(k, F.x, F.y, F.w, F.h, 1, 10);                      // 後（色あり）
      k.save(); k.beginPath(); k.rect(F.x, F.y, hx - F.x, F.h); k.clip();
      pic(k, F.x, F.y, F.w, F.h, 1, 10);                      // 前（色を抜いて暗く）
      k.globalCompositeOperation = 'saturation'; k.fillStyle = '#888'; k.fillRect(F.x, F.y, F.w, F.h);
      k.globalCompositeOperation = 'source-over'; k.fillStyle = 'rgba(28,35,51,.18)'; k.fillRect(F.x, F.y, F.w, F.h);
      k.restore();
      const tag = (s, x, al) => { k.font = `800 11px ${EN}`; const tw = k.measureText(s).width + 16; const bx = al ? x - tw : x; k.fillStyle = 'rgba(28,35,51,.55)'; rr(k, bx, F.y + 10, tw, 20, 10); k.fill(); txt(k, s, bx + tw / 2, F.y + 20.5, `800 11px ${EN}`, '#fff', 'center', 'middle', '1px'); };
      k.save(); rr(k, F.x, F.y, F.w, F.h, 10); k.clip(); tag('BEFORE', F.x + 10, false); tag('AFTER', F.x + F.w - 10, true); k.restore();
      k.fillStyle = '#fff'; k.fillRect(hx - 1.5, F.y, 3, F.h);
      k.save(); k.shadowColor = 'rgba(28,35,51,.3)'; k.shadowBlur = 8; k.shadowOffsetY = 2; k.fillStyle = '#fff'; k.beginPath(); k.arc(hx, hy, 17, 0, 7); k.fill(); k.restore();
      k.fillStyle = C.ink; k.beginPath(); k.moveTo(hx - 4, hy - 6); k.lineTo(hx - 11, hy); k.lineTo(hx - 4, hy + 6); k.closePath(); k.moveTo(hx + 4, hy - 6); k.lineTo(hx + 11, hy); k.lineTo(hx + 4, hy + 6); k.closePath(); k.fill();
      cursor(k, cx, cy, drag ? 1 : 0);
    });
  };

  // @element 16
  // 16 離脱防止ポップアップ（カーソルがタブや閉じるボタンの方へ出ていくと、引き止める小窓が出る）
  CELLS[15] = (k, w, h, u) => {
    frame(k);
    const OX = WIN.x, OY = WIN.y + WIN.bar;               // カーソルは窓の外（タブ・アドレスバー）まで出るので、カードの座標で描く
    const [cx, cy] = path([[0, 440, 150], [0.7, 300, 120], [1.25, 360, -18], [1.9, 372, -20], [2.6, 366, 38], [3.3, 366, 38], [4.4, 440, 150], [4.8, 440, 150]], u);
    const CLOSE = 2.9;
    let TRIG = 0.7; while (TRIG < 1.3 && path([[0.7, 300, 120], [1.25, 360, -18]], TRIG)[1] >= 0) TRIG += 1 / 240;   // 表示域の上端（y = 0）を越えた時刻（約1.07秒）
    const m = eOut(P(u, TRIG + 0.05, TRIG + 0.45)) * (1 - P(u, CLOSE + 0.03, CLOSE + 0.25));
    const D = { x: 125.5, y: 18, w: 260, h: 132 };
    view(k, () => {
      header(k, 0);
      pic(k, 24, 46, 222, 110, 0, 8); txt(k, '新用户指南', 264, 82, `800 19px ${JP}`, C.ink); bars(k, 264, 96, 210, 3); btn(k, 264, 132, 100, 24, '立即申请');
      if (m > 0) {
        k.fillStyle = `rgba(28,35,51,${0.5 * m})`; k.fillRect(0, 0, VW, VH);
        k.save(); k.globalAlpha = m; k.translate(D.x + D.w / 2, D.y + D.h / 2); const s = 0.9 + 0.1 * m; k.scale(s, s); k.translate(-D.w / 2, -D.h / 2);
        k.fillStyle = '#fff'; rr(k, 0, 0, D.w, D.h, 12); k.fill();
        txt(k, '请稍等！', D.w / 2, 34, `800 17px ${JP}`, C.ink, 'center');
        txt(k, '首单立减 10%', D.w / 2, 60, `800 15px ${JP}`, C.acc, 'center');
        btn(k, D.w / 2 - 75, 80, 150, 30, '领取优惠券', C.acc, '#fff', 12);
        k.strokeStyle = C.sub; k.lineWidth = 2; k.lineCap = 'round'; k.beginPath(); k.moveTo(D.w - 26, 14); k.lineTo(D.w - 14, 26); k.moveTo(D.w - 14, 14); k.lineTo(D.w - 26, 26); k.stroke();
        k.restore();
      }
    });
    // カーソルの × のクリック（窓の中）と、窓の外への移動
    k.save(); k.beginPath(); k.rect(0, 0, CW, CH); k.clip(); k.translate(OX, OY); click(k, cx, cy, u, [CLOSE]); k.restore();
  };

  // @element 17
  // 17 ローディング画面（数字が100%まで進むと、幕が上がってページが現れる）
  CELLS[16] = (k, w, h, u) => {
    frame(k);
    const n = Math.round(100 * eOut(P(u, 0.25, 2.1)));
    const cy = u < 4.25 ? -VH * eIO(P(u, 2.3, 2.85)) : -VH * (1 - eIO(P(u, 4.25, 4.75)));
    const show = eOut(P(u, 2.35, 2.95));
    view(k, () => {
      header(k, 0);
      k.save(); k.globalAlpha = show; k.translate(0, 14 * (1 - show));
      txt(k, '欢迎。', 34, 82, `800 26px ${JP}`, C.ink); bars(k, 34, 98, 200, 3); btn(k, 34, 136, 96, 24, '开始');
      pic(k, 270, 46, 214, 112, 0, 8); k.restore();
      if (cy > -VH) {
        k.save(); k.translate(0, cy); k.fillStyle = C.ink; k.fillRect(0, 0, VW, VH);
        logo(k, VW / 2 - 40, 56, '#fff');
        txt(k, (u >= 4.25 ? 0 : n) + '%', VW / 2, 98, `800 28px ${EN}`, '#fff', 'center', 'middle');
        k.fillStyle = 'rgba(255,255,255,.15)'; rr(k, VW / 2 - 90, 122, 180, 4, 2); k.fill();
        k.fillStyle = C.acc; rr(k, VW / 2 - 90, 122, 180 * (u >= 4.25 ? 0 : n / 100), 4, 2); k.fill();
        k.restore();
      }
    });
  };

  // @element 18
  // 18 遅延読み込み（画面に入った画像だけ、その時点で読み込まれて表示される）
  CELLS[17] = (k, w, h, u) => {
    frame(k);
    const SY = t => steps([[0.35, 0], [1.1, 110], [1.7, 110], [2.5, 225], [3.5, 225], [4.5, 0]], t), y = SY(u);
    const COLX = [15, 180, 345], IW = 151, IH = 92, ROWS = [12, 168, 276], WAIT = 0.45, FADE = 0.35;
    view(k, () => {
      k.save(); k.translate(0, -y);
      txt(k, '作品集', 15, 140, `800 18px ${JP}`, C.ink); bars(k, 120, 128, 200, 1);
      ROWS.forEach((top, r) => COLX.forEach((x, c) => {
        const t0 = r === 0 ? -1e9 : enteredAt(SY, top, VH, u), age = t0 === null ? -1 : u - t0 - c * 0.12;
        k.fillStyle = C.skel; rr(k, x, top, IW, IH, 6); k.fill();
        if (age < WAIT + FADE) {   // まだの画像: 灰色の枠と画像の印
          k.save(); k.translate(x + IW / 2, top + IH / 2); k.strokeStyle = '#B9C1CF'; k.lineWidth = 2; k.lineJoin = 'round';
          if (age >= 0 && age < WAIT) spinner(k, 0, 0, 11, u, C.blue);
          else { rr(k, -15, -11, 30, 22, 3); k.stroke(); k.beginPath(); k.moveTo(-11, 7); k.lineTo(-3, -1); k.lineTo(3, 5); k.lineTo(7, 1); k.lineTo(11, 6); k.stroke(); }
          k.restore();
        }
        if (age >= WAIT) { k.save(); k.globalAlpha = eOut(P(age, WAIT, WAIT + FADE)); pic(k, x, top, IW, IH, (r + c) % 3, 6); k.restore(); }
      }));
      k.restore();
      sbar(k, y / 225, 0.45);
    });
  };

  // @element 19
  // 19 無限スクロール（いちばん下まで来ると読み込み表示が出て、続きが足される）
  CELLS[18] = (k, w, h, u) => {
    frame(k);
    // 1周期で 3件（156px）ぶん進む。周期の終わりは始まりと同じ見た目（内容は3件ごとにくり返す）
    const PITCH = 52, BATCH = 3, L0 = 6, TL = 2.6;
    const y = steps([[0.25, 38], [0.85, 116], [1.15, 116], [1.75, 194], [4.8, 194]], u);
    const n = u < TL ? L0 : L0 + BATCH, end = 10 + n * PITCH;
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      k.save(); k.translate(0, -y);
      for (let i = 0; i < n; i++) {
        const top = 10 + i * PITCH, v = i % 3, fresh = i >= L0 ? eOut(P(u, TL, TL + 0.35)) : 1;
        if (top - y > VH || top + 44 - y < 0) continue;
        k.save(); k.globalAlpha = fresh; k.translate(0, 10 * (1 - fresh));
        k.fillStyle = '#fff'; rr(k, 90, top, 331, 44, 8); k.fill(); pic(k, 98, top + 6, 48, 32, v, 5);
        bars(k, 158, top + 12, [180, 140, 200][v], 1, C.ink, 7); bars(k, 158, top + 26, [120, 150, 100][v], 1, C.faint, 6);
        k.restore();
      }
      spinner(k, VW / 2, end + 18, 10, u);
      k.restore();
    });
  };

  // @element 20
  // 20 ページ遷移アニメーション（リンクを押すと、色の幕が横切って次のページに切り替わる）
  CELLS[19] = (k, w, h, u) => {
    frame(k, u >= 1.3 && u < 3.5 ? 'example.com/works/02' : 'example.com/works');
    const CLK = [0.8, 3.0];
    const cover = t0 => eIO(P(u, t0, t0 + 0.4)), uncover = t0 => eIO(P(u, t0, t0 + 0.45));
    // 幕の左端: 入る −VW→0、出る 0→VW
    const xs = u < 1.4 ? -VW * (1 - cover(0.9)) : u < 3.1 ? VW * uncover(1.4) : u < 3.6 ? -VW * (1 - cover(3.1)) : VW * uncover(3.6);
    const pageB = u >= 1.3 && u < 3.5;
    const [cx, cy] = path([[0, 420, 150], [0.65, 255, 100], [2.6, 255, 100], [2.85, 46, 50], [3.3, 46, 50], [4.6, 420, 150], [4.8, 420, 150]], u);
    view(k, () => {
      header(k, 0);
      if (!pageB) {
        txt(k, 'WORKS', 34, 62, `800 18px ${EN}`, C.ink, 'left', 'alphabetic', '2px');
        for (let i = 0; i < 3; i++) { const x = 34 + i * 152; pic(k, x, 74, 136, 60, i, 6); bars(k, x, 142, 100, 1, C.ink, 7); }
      } else {
        txt(k, '← 返回列表', 34, 55, `700 12px ${JP}`, C.sub, 'left', 'middle');
        pic(k, 34, 68, 240, 90, 1, 8);
        txt(k, 'Project 02', 296, 96, `800 22px ${EN}`, C.ink); bars(k, 296, 110, 180, 3);
      }
      if (xs > -VW && xs < VW) { k.fillStyle = C.acc; k.fillRect(xs, 0, VW, VH); logo(k, xs + VW / 2 - 40, VH / 2, '#fff'); }
      click(k, cx, cy, u, CLK);
    });
  };

  // @element 21
  // 21 スムーススクロール（メニューを押すと、ページがなめらかに目的の場所まで動く）
  CELLS[20] = (k, w, h, u) => {
    frame(k);
    const TO = 296;   // 「料金」セクションの頭（330）− ヘッダーの高さ（34）
    const y = TO * eIO(P(u, 0.95, 2.0)) * (1 - eIO(P(u, 3.15, 4.2)));
    const [cx, cy] = path([[0, 380, 132], [0.75, 360, 18], [1.0, 360, 18], [2.9, 478, 140], [3.25, 478, 140], [4.8, 380, 132]], u);
    view(k, () => {
      k.save(); k.translate(0, -y);
      pic(k, 24, 46, 222, 110, 0, 8); txt(k, '恰到好处的工具。', 264, 84, `800 19px ${JP}`, C.ink); bars(k, 264, 98, 210, 3);
      k.fillStyle = C.soft; k.fillRect(0, 170, VW, 160);
      txt(k, '特色', VW / 2, 206, `800 17px ${JP}`, C.ink, 'center');
      for (let i = 0; i < 3; i++) { const x = 100 + i * 155; k.fillStyle = C.blueL; k.beginPath(); k.arc(x, 252, 24, 0, 7); k.fill(); bars(k, x - 46, 288, 92, 2); }
      txt(k, '价格', VW / 2, 370, `800 17px ${JP}`, C.ink, 'center');
      ['¥0', '¥980', '¥2,980'].forEach((s, i) => {
        const x = 50 + i * 143, hi = i === 1; k.fillStyle = '#fff'; rr(k, x, 388, 125, 96, 8); k.fill();
        k.lineWidth = hi ? 2.5 : 1.5; k.strokeStyle = hi ? C.acc : C.faint; k.stroke();
        txt(k, s, x + 62.5, 428, `800 20px ${EN}`, hi ? C.acc : C.ink, 'center'); bars(k, x + 22, 444, 81, 2);
      });
      k.restore();
      header(k, 0, y > 250 ? 1 : -1);
      const tb = clamp((y - 60) / 40);   // ページトップへ戻るボタン
      if (tb > 0) { k.globalAlpha = tb; k.fillStyle = C.ink; k.beginPath(); k.arc(478, 140, 15, 0, 7); k.fill(); k.strokeStyle = '#fff'; k.lineWidth = 2.4; k.lineCap = 'round'; k.lineJoin = 'round'; k.beginPath(); k.moveTo(472, 143); k.lineTo(478, 136.5); k.lineTo(484, 143); k.stroke(); k.globalAlpha = 1; }
      sbar(k, y / TO * 0.7, 0.36);
      click(k, cx, cy, u, [0.9, 3.1]);
    });
  };

  // @element 22
  // 22 マーキー（文字の帯が、途切れずに横へ流れ続ける）
  CELLS[21] = (k, w, h, u) => {
    frame(k);
    const WORDS = ['WEB DESIGN', 'BRANDING', 'MOTION', 'UI/UX'], F = `800 30px ${EN}`, GAPW = 64;
    view(k, () => {
      bars(k, 34, 20, 180, 1, C.ink, 10); bars(k, 34, 38, 300, 1);
      k.fillStyle = C.ink; k.fillRect(0, 58, VW, 58);
      k.font = F; k.letterSpacing = '1px'; const ws = WORDS.map(s => k.measureText(s).width); k.letterSpacing = '0px';
      const unit = ws.reduce((a, b) => a + b + GAPW, 0);
      let x = -mod(u / CYC, 1) * unit;                 // 1周期で1組ぶん左へ
      for (let rep = 0; x < VW; rep++) WORDS.forEach((s, i) => {
        txt(k, s, x, 88, F, '#fff', 'left', 'middle', '1px');
        k.fillStyle = C.acc; k.beginPath(); k.arc(x + ws[i] + GAPW / 2, 88, 6, 0, 7); k.fill();
        x += ws[i] + GAPW;
      });
      for (let i = 0; i < 3; i++) { k.fillStyle = C.soft; rr(k, 34 + i * 152, 130, 136, 30, 6); k.fill(); bars(k, 46 + i * 152, 142, 90, 1, C.faint); }
    });
  };

  // @element 23
  // 23 グラデーションアニメーション（背景のグラデーションの色が、ゆっくり流れるように動き続ける）
  CELLS[22] = (k, w, h, u) => {
    frame(k);
    const a = 2 * Math.PI * u / CYC;                        // 4.8秒で1周
    const BLOBS = [[C.acc, 150, 60, 230, 70, 30, 0], ['#FFB08F', 380, 40, 210, 60, 40, 2.1], [C.blue, 330, 150, 240, 80, 30, 4.2], ['#9DB6FB', 90, 170, 200, 50, 35, 1.0]];
    view(k, () => {
      k.fillStyle = '#FFF1EB'; k.fillRect(0, 0, VW, VH);
      for (const [col, x0, y0, r, ax, ay, ph] of BLOBS) {
        const x = x0 + ax * Math.cos(a + ph), y = y0 + ay * Math.sin(a + ph);
        const g = k.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)');
        k.globalAlpha = 0.85; k.fillStyle = g; k.fillRect(0, 0, VW, VH); k.globalAlpha = 1;
      }
      txt(k, 'Hello, Future.', 40, 82, `800 34px ${EN}`, '#fff', 'left', 'alphabetic', '1px');
      bars(k, 40, 100, 200, 2, 'rgba(255,255,255,.8)', 6, 12, 0.6);
      btn(k, 40, 128, 104, 26, '开始使用', '#fff', C.ink);
    });
  };

  // @element 24
  // 24 ふわふわアニメーション（画面の飾りが、ゆっくり上下に浮き沈みし続ける）
  CELLS[23] = (k, w, h, u) => {
    frame(k);
    const bob = (T, A, ph) => -A * Math.sin(2 * Math.PI * u / T + ph);   // 上下（easeInOut に近いサイン波）
    const y1 = bob(2.4, 8, 0), y2 = bob(1.6, 6, 1.2), y3 = bob(2.4, 6, 2.4);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      txt(k, '用 App，', 34, 62, `800 24px ${JP}`, C.ink); txt(k, '更轻松。', 34, 94, `800 24px ${JP}`, C.ink);
      bars(k, 34, 108, 170, 2); btn(k, 34, 134, 112, 24, '下载');
      // 影（上がるほど小さく薄く）
      const sh = 1 + y1 / 40;
      k.fillStyle = `rgba(28,35,51,${0.16 * sh})`; k.beginPath(); k.ellipse(352, 160, 54 * sh, 6 * sh, 0, 0, 7); k.fill();
      // スマホ
      k.save(); k.translate(0, y1);
      k.fillStyle = C.ink; rr(k, 306, 18, 92, 132, 16); k.fill(); k.fillStyle = '#fff'; rr(k, 312, 24, 80, 120, 11); k.fill();
      pic(k, 318, 32, 68, 52, 0, 6); bars(k, 318, 92, 68, 3, C.faint, 5, 10);
      k.restore();
      // 飾り（ハートの丸と星のチップ）
      k.save(); k.translate(0, y2); k.shadowColor = 'rgba(28,35,51,.18)'; k.shadowBlur = 10; k.shadowOffsetY = 4;
      k.fillStyle = C.acc; k.beginPath(); k.arc(268, 54, 20, 0, 7); k.fill(); k.shadowColor = 'transparent';
      k.fillStyle = '#fff'; k.beginPath(); k.moveTo(268, 62); k.bezierCurveTo(254, 53, 260, 41, 268, 48); k.bezierCurveTo(276, 41, 282, 53, 268, 62); k.fill(); k.restore();
      k.save(); k.translate(0, y3); k.shadowColor = 'rgba(28,35,51,.16)'; k.shadowBlur = 10; k.shadowOffsetY = 4;
      k.fillStyle = '#fff'; rr(k, 410, 92, 76, 30, 15); k.fill(); k.shadowColor = 'transparent';
      txt(k, '★ 4.8', 448, 108, `800 13px ${EN}`, C.acc, 'center', 'middle'); k.restore();
    });
  };
  // @element 25
  // 25 按压缩小（Press / Tap feedback）：左右两颗同样的「立即购买」按钮做对比。光标先按左边（无反馈：按下、松开按钮都不变），
  // 再按右边两次（有反馈）：按下后 0.1 秒内 easeOut（3 次方）缩到 0.97，阴影由 blur 14 / 下移 6 收紧到 blur 4 / 下移 2；
  // 松开后 0.25 秒 easeOut（3 次方）回到 1。按下区间：左 0.80–1.15 秒；右 2.20–2.55、3.05–3.40 秒。光标 3.6–4.2 秒回到起点。
  // 与「点击涟漪」的区别：没有任何波纹，只有按钮本身的缩小与阴影收紧，像真的被按下去。
  const PRESS_L = [[0.8, 1.15]], PRESS_R = [[2.2, 2.55], [3.05, 3.4]];
  const PRESS_AMT = (u, list) => {
    for (const [d, r] of list) {
      if (u >= d && u < r) return eOut(P(u, d, d + 0.1));
      if (u >= r && u < r + 0.25) return 1 - eOut(P(u, r, r + 0.25));
    }
    return 0;
  };
  CELLS[24] = (k, w, h, u) => {
    frame(k);
    const BW = 170, BH = 50, BY = 46, LX = 70, RX = 271;
    const [cx, cy] = path([[0, 255, 150], [0.6, 160, 74], [1.4, 160, 74], [2.0, 360, 74], [3.6, 360, 74], [4.2, 255, 150], [4.8, 255, 150]], u);
    const pl = PRESS_AMT(u, PRESS_L), pr = PRESS_AMT(u, PRESS_R);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      // 按钮：p 为按下程度（0〜1），fb 为是否有反馈
      const button = (x, p) => {
        const s = 1 - 0.03 * p;
        k.save(); k.translate(x + BW / 2, BY + BH / 2); k.scale(s, s);
        k.shadowColor = 'rgba(255,90,44,.38)'; k.shadowBlur = lerp(14, 4, p); k.shadowOffsetY = lerp(6, 2, p);
        k.fillStyle = C.acc; rr(k, -BW / 2, -BH / 2, BW, BH, BH / 2); k.fill(); k.shadowColor = 'transparent';
        txt(k, '立即购买', 0, 1, `800 16px ${JP}`, '#fff', 'center', 'middle');
        k.restore();
      };
      button(LX, 0); button(RX, pr);
      txt(k, '无反馈', LX + BW / 2, 124, `700 13px ${JP}`, C.sub, 'center', 'middle');
      txt(k, '按下缩小', RX + BW / 2, 124, `700 13px ${JP}`, C.acc, 'center', 'middle');
      txt(k, 'scale 1.00', LX + BW / 2, 143, `600 11px ${EN}`, C.sub, 'center', 'middle');
      txt(k, `scale ${(1 - 0.03 * pr).toFixed(2)}`, RX + BW / 2, 143, `600 11px ${EN}`, C.acc, 'center', 'middle');
      k.fillStyle = C.faint; k.fillRect(VW / 2 - 0.5, 40, 1, 110);
      cursor(k, cx, cy, Math.max(pl, pr));
    });
  };

  // @element 26
  // 26 长按确认（Hold to confirm）：按住「按住删除」按钮，深色进度从左向右匀速填满（需按满 1.2 秒）才执行删除。
  // 第 1 次 0.70–1.40 秒只按了 0.7 秒（约 58%）就松手，进度 0.35 秒 easeOut（3 次方）退回 0；
  // 第 2 次 2.00–3.20 秒按满，3.20 秒执行：上方文件卡片 0.35 秒淡出并压扁，按钮显示「已删除」。
  // 4.30–4.70 秒复位：进度 easeInOut（3 次方）退回、卡片淡入、文字换回「按住删除」。
  // 与普通点击的区别：单击不触发，必须持续按住到进度满；中途松手会看到进度回退。
  const HOLD_NEED = 1.2, HOLD_DOWN = [[0.7, 1.4], [2.0, 3.2]], HOLD_DONE = 3.2, HOLD_RESET = 4.3;
  const HOLD_PROG = u => {
    const [a, b] = HOLD_DOWN;
    if (u < a[0]) return 0;
    if (u < a[1]) return (u - a[0]) / HOLD_NEED;
    if (u < b[0]) return (a[1] - a[0]) / HOLD_NEED * (1 - eOut(P(u, a[1], a[1] + 0.35)));
    if (u < b[1]) return (u - b[0]) / HOLD_NEED;
    if (u < HOLD_RESET) return 1;
    return 1 - eIO(P(u, HOLD_RESET, HOLD_RESET + 0.4));
  };
  CELLS[25] = (k, w, h, u) => {
    frame(k, 'example.com/files');
    const B = { x: 145, y: 96, w: 220, h: 46 };
    const prog = clamp(HOLD_PROG(u)), done = u >= HOLD_DONE && u < HOLD_RESET;
    const gone = u < HOLD_RESET ? eOut(P(u, HOLD_DONE, HOLD_DONE + 0.35)) : 1 - eOut(P(u, HOLD_RESET, HOLD_RESET + 0.4));
    let press = 0; for (const [d, r] of HOLD_DOWN) if (u >= d && u < r) press = eOut(P(u, d, d + 0.08));
    const [cx, cy] = path([[0, 420, 150], [0.55, 262, 122], [3.6, 262, 122], [4.3, 420, 150], [4.8, 420, 150]], u);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      // 要删除的文件卡片（执行后淡出并压扁）
      if (gone < 1) {
        k.save(); k.globalAlpha = 1 - gone; k.translate(VW / 2, 47); k.scale(1, 1 - 0.4 * gone); k.translate(-VW / 2, -47);
        k.fillStyle = '#fff'; rr(k, 105, 20, 300, 54, 8); k.fill();
        pic(k, 113, 28, 56, 38, 2, 5);
        txt(k, '季度报告.pdf', 182, 42, `800 13px ${JP}`, C.ink); bars(k, 182, 54, 120, 1);
        k.restore();
      }
      if (gone > 0.5) txt(k, '文件已删除', VW / 2, 47, `700 12px ${JP}`, C.sub, 'center', 'middle');
      // 按钮底色 + 进度
      const label = done ? '已删除' : '按住删除';
      k.fillStyle = C.accL; rr(k, B.x, B.y, B.w, B.h, B.h / 2); k.fill();
      txt(k, label, B.x + B.w / 2, B.y + B.h / 2 + 1, `800 15px ${JP}`, C.acc, 'center', 'middle');
      if (prog > 0) {
        k.save(); rr(k, B.x, B.y, B.w, B.h, B.h / 2); k.clip();
        k.beginPath(); k.rect(B.x, B.y, B.w * prog, B.h); k.clip();
        k.fillStyle = C.acc; k.fillRect(B.x, B.y, B.w, B.h);
        txt(k, label, B.x + B.w / 2, B.y + B.h / 2 + 1, `800 15px ${JP}`, '#fff', 'center', 'middle');
        k.restore();
      }
      const cancel = u >= 1.4 && u < 1.95;
      txt(k, done ? '已执行' : cancel ? '未按满，已取消' : '按住 1.2 秒确认', VW / 2, 156, `600 11px ${JP}`, done ? C.acc : C.sub, 'center', 'middle');
      cursor(k, cx, cy, press);
    });
  };

  // @element 27
  // 27 共享元素转场（Shared element transition）：列表第 2 行的缩略图（56×32、圆角 5）在 0.80–1.40 秒（0.6 秒 easeInOut 3 次方）
  // 连续移动并放大成详情页大图（250×140、圆角 10），位置、尺寸、圆角同时插值；其余列表 0.25 秒淡出，详情文字 1.25–1.55 秒淡入。
  // 3.0 秒点「← 返回」，3.10–3.70 秒同一张图沿原路缩回列表，列表 3.45–3.75 秒淡入。
  // 与「页面转场」的区别：没有遮罩切换，同一个元素从旧位置一路变形到新位置，两页靠它连起来。
  const SHARED_A = [36, 69, 56, 32, 5], SHARED_B = [24, 14, 250, 140, 10];
  CELLS[26] = (k, w, h, u) => {
    frame(k, u >= 1.1 && u < 3.4 ? 'example.com/photos/02' : 'example.com/photos');
    const q = eIO(P(u, 0.8, 1.4)) * (1 - eIO(P(u, 3.1, 3.7)));
    const la = u < 2 ? 1 - eOut(P(u, 0.8, 1.05)) : eOut(P(u, 3.45, 3.75));
    const da = eOut(P(u, 1.25, 1.55)) * (1 - eOut(P(u, 3.05, 3.2)));
    const [cx, cy] = path([[0, 420, 150], [0.6, 200, 85], [1.6, 200, 85], [2.8, 322, 24], [3.3, 322, 24], [4.4, 420, 150], [4.8, 420, 150]], u);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      if (la > 0) {
        k.save(); k.globalAlpha = la;
        const NAMES = ['海边清晨', '山间日落', '夜色湖面'];
        for (let i = 0; i < 3; i++) {
          const top = 14 + i * 50;
          k.fillStyle = '#fff'; rr(k, 30, top, 451, 42, 8); k.fill();
          if (i !== 1) pic(k, 36, top + 5, 56, 32, i === 0 ? 0 : 2, 5);
          txt(k, NAMES[i], 106, top + 19, `800 13px ${JP}`, C.ink); bars(k, 106, top + 26, [160, 130, 180][i], 1);
          txt(k, '›', 462, top + 22, `700 18px ${EN}`, C.sub, 'center', 'middle');
        }
        k.restore();
      }
      if (da > 0) {
        k.save(); k.globalAlpha = da;
        txt(k, '← 返回', 300, 24, `700 12px ${JP}`, C.sub, 'left', 'middle');
        txt(k, '山间日落', 300, 66, `800 22px ${JP}`, C.ink);
        bars(k, 300, 82, 180, 3);
        k.fillStyle = C.accL; rr(k, 300, 124, 64, 20, 10); k.fill(); txt(k, '风景', 332, 134.5, `700 11px ${JP}`, C.acc, 'center', 'middle');
        k.restore();
      }
      // 共享元素：同一张图，位置、尺寸、圆角连续插值
      const R = SHARED_A.map((a, i) => lerp(a, SHARED_B[i], q));
      if (q > 0.001) { k.save(); k.shadowColor = `rgba(28,35,51,${0.22 * Math.sin(Math.PI * clamp(q))})`; k.shadowBlur = 16; k.shadowOffsetY = 6; k.fillStyle = '#fff'; rr(k, R[0], R[1], R[2], R[3], R[4]); k.fill(); k.restore(); }
      pic(k, R[0], R[1], R[2], R[3], 1, R[4]);
      click(k, cx, cy, u, [0.7, 3.0]);
    });
  };

  // @element 28
  // 28 方向感知转场（Direction-aware transition）：三步引导页。点「下一页 →」（0.6、1.6 秒）时旧页向左滑出、新页从右滑入；
  // 点「← 返回」（2.7、3.7 秒）时方向相反：旧页向右滑出、新页从左滑入。每次滑动 0.5 秒 easeInOut（3 次方），距离为整个视口宽 511px。
  // 页面顺序 1→2→3→2→1，周期末回到第 1 页。与「页面转场」的区别：滑动方向跟着前进 / 后退变化，看得出自己在往哪走。
  const DIRT_TR = [[0.65, 0, 1], [1.65, 1, 2], [2.75, 2, 1], [3.75, 1, 0]], DIRT_DUR = 0.5;
  const DIRT_PAGES = [['欢迎使用', 0], ['选择套餐', 1], ['完成设置', 2]];
  CELLS[27] = (k, w, h, u) => {
    let cur = 0, nxt = -1, q = 0;
    for (const [t0, a, b] of DIRT_TR) if (u >= t0) { if (u < t0 + DIRT_DUR) { cur = a; nxt = b; q = eIO(P(u, t0, t0 + DIRT_DUR)); } else { cur = b; nxt = -1; } }
    const idx = nxt >= 0 ? nxt : cur;
    frame(k, `example.com/setup/${idx + 1}`);
    const [cx, cy] = path([[0, 330, 110], [0.5, 441, 145], [1.7, 441, 145], [2.45, 70, 145], [3.9, 70, 145], [4.6, 330, 110], [4.8, 330, 110]], u);
    view(k, () => {
      const page = (i, x) => {
        k.save(); k.translate(x, 0);
        k.fillStyle = '#fff'; k.fillRect(0, 0, VW, 124);
        pic(k, 34, 14, 190, 100, DIRT_PAGES[i][1], 8);
        txt(k, `步骤 ${i + 1} / 3`, 250, 38, `700 12px ${JP}`, C.acc);
        txt(k, DIRT_PAGES[i][0], 250, 68, `800 22px ${JP}`, C.ink);
        bars(k, 250, 84, 200, 3);
        k.restore();
      };
      k.save(); k.beginPath(); k.rect(0, 0, VW, 124); k.clip();
      if (nxt >= 0) { const dir = nxt > cur ? 1 : -1; page(cur, -dir * VW * q); page(nxt, dir * VW * (1 - q)); }
      else page(cur, 0);
      k.restore();
      // 底部导航（固定不动）
      k.fillStyle = C.soft; k.fillRect(0, 124, VW, VH - 124); k.fillStyle = C.rule; k.fillRect(0, 124, VW, 1);
      btn(k, 24, 132, 92, 26, '← 返回', idx === 0 ? C.faint : C.ink, '#fff', 12);
      btn(k, 395, 132, 92, 26, '下一页 →', idx === 2 ? C.faint : C.acc, '#fff', 12);
      for (let i = 0; i < 3; i++) { k.fillStyle = i === idx ? C.acc : C.faint; rr(k, VW / 2 - 26 + i * 20 - (i === idx ? 4 : 0), 142, i === idx ? 20 : 12, 6, 3); k.fill(); }
      click(k, cx, cy, u, [0.6, 1.6, 2.7, 3.7]);
    });
  };

  // @element 29
  // 29 布局动画（Layout animation）：4×2 卡片网格。光标在 1.0 秒点第 2 张卡的 ×：该卡 0.2 秒 easeOut 缩到 0.85 并淡出，
  // 其余卡片 1.25–1.75 秒（0.5 秒 easeInOut 3 次方）平滑移到新格子补位，第 5 张从第 2 行行首斜着移到第 1 行行尾，不瞬移。
  // 1.3 秒出现「已删除 1 项 · 撤销」提示，3.35 秒点「撤销」：其余卡片 3.5–4.0 秒移回原位，第 2 张 3.95–4.25 秒放大淡入。
  // 与「拖拽排序」的区别：没有拖动，是布局变化（删除 / 恢复）引起的自动补位。
  const LAYOUT_CW = 110, LAYOUT_CH = 66, LAYOUT_GX = 122, LAYOUT_GY = 78, LAYOUT_X0 = 17.5, LAYOUT_Y0 = 16;
  const LAYOUT_SLOT = i => [LAYOUT_X0 + (i % 4) * LAYOUT_GX, LAYOUT_Y0 + Math.floor(i / 4) * LAYOUT_GY];
  CELLS[28] = (k, w, h, u) => {
    frame(k, 'example.com/board');
    const mv = eIO(P(u, 1.25, 1.75)) * (1 - eIO(P(u, 3.5, 4.0)));
    const vis = u < 3.9 ? 1 - eOut(P(u, 1.05, 1.25)) : eOut(P(u, 3.95, 4.25));
    const toast = eOut(P(u, 1.3, 1.5)) * (1 - eOut(P(u, 3.4, 3.6)));
    const [cx, cy] = path([[0, 330, 120], [0.8, 240, 27], [1.15, 240, 27], [1.9, 330, 118], [2.6, 330, 118], [3.1, 302, 147], [3.6, 302, 147], [4.4, 330, 120], [4.8, 330, 120]], u);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      const card = (x, y, i) => {
        k.save(); k.shadowColor = 'rgba(28,35,51,.10)'; k.shadowBlur = 6; k.shadowOffsetY = 2;
        k.fillStyle = '#fff'; rr(k, x, y, LAYOUT_CW, LAYOUT_CH, 8); k.fill(); k.restore();
        pic(k, x + 6, y + 6, LAYOUT_CW - 12, 36, i % 3, 5);
        bars(k, x + 8, y + 50, [70, 52, 80, 60][i % 4], 1, C.ink, 6);
      };
      for (let i = 0; i < 8; i++) {
        if (i === 1) continue;
        const [ax, ay] = LAYOUT_SLOT(i), [bx, by] = LAYOUT_SLOT(i > 1 ? i - 1 : i);
        card(lerp(ax, bx, mv), lerp(ay, by, mv), i);
      }
      // 被删除的第 2 张
      if (vis > 0) {
        const [x, y] = LAYOUT_SLOT(1), s = 0.85 + 0.15 * vis;
        k.save(); k.globalAlpha = vis; k.translate(x + LAYOUT_CW / 2, y + LAYOUT_CH / 2); k.scale(s, s); k.translate(-x - LAYOUT_CW / 2, -y - LAYOUT_CH / 2);
        card(x, y, 1);
        const hov = cx > x && cx < x + LAYOUT_CW && cy > y && cy < y + LAYOUT_CH && u < 1.3;
        if (hov) { k.fillStyle = C.ink; k.beginPath(); k.arc(x + LAYOUT_CW - 10, y + 10, 8, 0, 7); k.fill(); txt(k, '×', x + LAYOUT_CW - 10, y + 10.5, `700 12px ${EN}`, '#fff', 'center', 'middle'); }
        k.restore();
      }
      if (toast > 0) {
        k.save(); k.globalAlpha = toast; k.translate(0, 8 * (1 - toast));
        k.fillStyle = C.ink; rr(k, 180, 134, 150, 26, 13); k.fill();
        txt(k, '已删除 1 项', 196, 147.5, `600 11px ${JP}`, '#fff', 'left', 'middle');
        txt(k, '撤销', 302, 147.5, `800 11px ${JP}`, C.acc, 'center', 'middle');
        k.restore();
      }
      click(k, cx, cy, u, [1.0, 3.35]);
    });
  };

  // @element 30
  // 改写自 KittenJam Motion Library #110 旋转光边按钮：深色页面中央 200×52 胶囊按钮，外框是一圈 3px 锥形渐变（朱 → 蓝 → 紫 → 朱）。
  // 渐变角度 = 每周期 1 圈的基础转速 + 光标悬停期间（0.7–3.8 秒，easeInOut 2 次方）额外 2 圈，合计每周期整数 3 圈，首尾无缝。
  // 光标 0.6 秒移到按钮上，外光晕（shadowBlur 26）0.25 秒 easeOut 亮起；3.8 秒移开后 0.25 秒熄灭。
  const RGB_BW = 200, RGB_BH = 52;
  CELLS[29] = (k, w, h, u) => {
    frame(k);
    const [cx, cy] = path([[0, 430, 150], [0.6, 300, 94], [3.8, 300, 94], [4.4, 430, 150], [4.8, 430, 150]], u);
    const glow = eOut(P(u, 0.55, 0.8)) * (1 - eOut(P(u, 3.8, 4.05)));
    const ang = Math.PI * 2 * (u / CYC + 2 * eIOs(P(u, 0.7, 3.8))) - Math.PI / 2;
    view(k, () => {
      k.fillStyle = '#151A26'; k.fillRect(0, 0, VW, VH);
      const bx = (VW - RGB_BW) / 2, by = (VH - RGB_BH) / 2;
      const g = k.createConicGradient(ang, VW / 2, VH / 2);
      [[0, C.acc], [0.33, C.blue], [0.66, '#B57CFF'], [1, C.acc]].forEach(([o, c]) => g.addColorStop(o, c));
      // 外光晕：同一圈渐变带阴影，悬停时出现
      if (glow > 0) { k.save(); k.globalAlpha = glow; k.shadowColor = 'rgba(181,124,255,.9)'; k.shadowBlur = 26; k.fillStyle = g; rr(k, bx - 3, by - 3, RGB_BW + 6, RGB_BH + 6, (RGB_BH + 6) / 2); k.fill(); k.restore(); }
      k.fillStyle = g; rr(k, bx - 3, by - 3, RGB_BW + 6, RGB_BH + 6, (RGB_BH + 6) / 2); k.fill();
      k.fillStyle = '#1C2333'; rr(k, bx, by, RGB_BW, RGB_BH, RGB_BH / 2); k.fill();
      txt(k, '开始使用', VW / 2, VH / 2 + 1, `700 16px ${JP}`, '#fff', 'center', 'middle', '1px');
      cursor(k, cx, cy, 0);
    });
  };

  // @element 31
  // 改写自 KittenJam Motion Library #233 果冻弹跳按钮：160×50 朱色胶囊按钮，光标在 1.0、2.8 秒各点一次。
  // 每次点击后按关键帧缩放 (1,1) → 0.12 秒 (1.18,0.82) → 0.15 秒 (0.85,1.15) → 0.15 秒 (1.05,0.95) → 0.18 秒回到 (1,1)，每段 easeInOut 3 次方，像果冻被压扁后回弹。
  const JELLY_KEYS = [[0, 1, 1], [0.12, 1.18, 0.82], [0.27, 0.85, 1.15], [0.42, 1.05, 0.95], [0.6, 1, 1]];
  const JELLY_AT = (d) => {
    if (d <= 0 || d >= 0.6) return [1, 1];
    for (let i = 1; i < JELLY_KEYS.length; i++) if (d < JELLY_KEYS[i][0]) { const a = JELLY_KEYS[i - 1], b = JELLY_KEYS[i], f = eIO((d - a[0]) / (b[0] - a[0])); return [lerp(a[1], b[1], f), lerp(a[2], b[2], f)]; }
    return [1, 1];
  };
  CELLS[30] = (k, w, h, u) => {
    frame(k, 'example.com/shop');
    const [cx, cy] = path([[0, 430, 150], [0.7, 262, 88], [3.4, 262, 88], [4.2, 430, 150], [4.8, 430, 150]], u);
    let sx = 1, sy = 1;
    for (const tc of [1.0, 2.8]) { const [a, b] = JELLY_AT(u - tc); sx *= a; sy *= b; }
    const n = (u >= 1.0 ? 1 : 0) + (u >= 2.8 ? 1 : 0);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      k.save(); k.translate(VW / 2, VH / 2); k.scale(sx, sy);
      k.save(); k.shadowColor = 'rgba(255,90,44,.35)'; k.shadowBlur = 14; k.shadowOffsetY = 5; k.fillStyle = C.acc; rr(k, -80, -25, 160, 50, 25); k.fill(); k.restore();
      txt(k, '加入购物车', 0, 1, `800 15px ${JP}`, '#fff', 'center', 'middle');
      k.restore();
      txt(k, n ? `已加入 ${n} 件` : '点一下试试', VW / 2, VH / 2 + 50, `600 11px ${JP}`, n ? C.acc : C.sub, 'center', 'middle');
      click(k, cx, cy, u, [1.0, 2.8]);
    });
  };

  // @element 32
  // 改写自 KittenJam Motion Library #98 发牌展开：光标 0.5 秒点「发牌」，5 张 60×84 卡片从视口下方依次发出（间隔 0.12 秒、每张 0.55 秒），
  // 绕下方同一枢轴展开成 −24°…+24°（每张差 12°）的扇形，角度用 back-out（过冲 1.7）回弹；停留到 3.1 秒点「收牌」，
  // 从最后一张开始每张间隔 0.1 秒、0.35 秒 easeInOut 3 次方收回下方。
  const DEAL_N = 5, DEAL_W = 60, DEAL_H = 84, DEAL_R = 132;
  const DEAL_BACK = x => { const s = 1.7; return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
  CELLS[31] = (k, w, h, u) => {
    frame(k, 'example.com/cards');
    const [cx, cy] = path([[0, 430, 150], [0.4, 62, 136], [3.4, 62, 136], [4.2, 430, 150], [4.8, 430, 150]], u);
    const out = u >= 0.5 && u < 3.1;
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      btn(k, 24, 122, 76, 28, out ? '收牌' : '发牌', out ? C.ink : C.acc, '#fff', 12);
      const px = VW / 2 + 30, pyBase = 64 + DEAL_R;
      for (let i = 0; i < DEAL_N; i++) {
        const pin = P(u, 0.6 + i * 0.12, 1.15 + i * 0.12);
        const pout = eIO(P(u, 3.2 + (DEAL_N - 1 - i) * 0.1, 3.55 + (DEAL_N - 1 - i) * 0.1));
        const q = pin * (1 - pout);
        if (q <= 0) continue;
        const a = (-24 + 12 * i) * Math.PI / 180 * (u < 3.2 ? DEAL_BACK(pin) : 1 - pout);
        const py = pyBase + 150 * (1 - (u < 3.2 ? eOut(pin) : 1 - pout));
        k.save(); k.translate(px, py); k.rotate(a); k.translate(-DEAL_W / 2, -DEAL_R - DEAL_H / 2);
        k.shadowColor = 'rgba(28,35,51,.18)'; k.shadowBlur = 8; k.shadowOffsetY = 3;
        k.fillStyle = '#fff'; rr(k, 0, 0, DEAL_W, DEAL_H, 7); k.fill(); k.shadowColor = 'transparent';
        pic(k, 5, 5, DEAL_W - 10, 46, i, 5);
        bars(k, 7, 58, 40, 2, C.faint, 5, 9);
        k.restore();
      }
      click(k, cx, cy, u, [0.5, 3.1]);
    });
  };

  // @element 33
  // 改写自 KittenJam Motion Library #270 拍立得洗牌：一叠 4 张歪斜的拍立得（96×112，各槽位角度 −3°/4°/−7°/6°），
  // 光标在 0.6、1.5、2.4、3.3 秒点顶张：顶张前 0.36 秒 easeOut 向右抽出 170px 并多转 10°，后 0.39 秒插回最底层槽位；
  // 其余 3 张同时 easeInOut 3 次方各上移一个槽位。4 次后顺序回到初始，周期首尾一致。
  const PSTACK_SLOT = [[0, 0, -3], [7, 4, 4], [-6, 7, -7], [4, 10, 6]];
  const PSTACK_CLICKS = [0.6, 1.5, 2.4, 3.3], PSTACK_DUR = 0.75;
  CELLS[32] = (k, w, h, u) => {
    frame(k, 'example.com/memories');
    const [cx, cy] = path([[0, 430, 150], [0.45, 205, 70], [3.5, 205, 70], [4.2, 430, 150], [4.8, 430, 150]], u);
    let n = 0, p = -1;
    for (const tc of PSTACK_CLICKS) if (u >= tc + 0.05) { if (u < tc + 0.05 + PSTACK_DUR) p = (u - tc - 0.05) / PSTACK_DUR; else n++; }
    const ox = 190, oy = 84;
    const pola = (card, x, y, deg) => {
      k.save(); k.translate(ox + x, oy + y); k.rotate(deg * Math.PI / 180);
      k.shadowColor = 'rgba(28,35,51,.2)'; k.shadowBlur = 10; k.shadowOffsetY = 3;
      k.fillStyle = '#fff'; k.fillRect(-48, -56, 96, 112); k.shadowColor = 'transparent';
      pic(k, -42, -50, 84, 80, card, 2);
      bars(k, -38, 38, 50, 1, C.faint, 5);
      txt(k, `0${card + 1}`, 34, 42, `700 9px ${EN}`, C.sub, 'right', 'middle');
      k.restore();
    };
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      txt(k, '旅行回忆', 330, 70, `800 20px ${JP}`, C.ink); bars(k, 330, 86, 140, 2);
      // 槽位 j 上的卡 = (j + n) % 4；动画中槽位 0 的卡在抽出
      const draws = [];
      for (let j = 3; j >= 0; j--) {
        const card = (j + n) % 4;
        if (p < 0) { draws.push([card, ...PSTACK_SLOT[j]]); continue; }
        if (j === 0) continue;
        const f = eIO(clamp(p / 0.9)), A = PSTACK_SLOT[j], B = PSTACK_SLOT[j - 1];
        draws.push([card, lerp(A[0], B[0], f), lerp(A[1], B[1], f), lerp(A[2], B[2], f)]);
      }
      if (p >= 0) {
        const top = n % 4, S0 = PSTACK_SLOT[0], S3 = PSTACK_SLOT[3];
        if (p < 0.48) { const f = eOut(p / 0.48); draws.push([top, S0[0] + 170 * f, S0[1], S0[2] + 10 * f]); }
        else { const f = eIO((p - 0.48) / 0.52); draws.unshift([top, lerp(S0[0] + 170, S3[0], f), S3[1], lerp(S0[2] + 10, S3[2], f)]); }
      }
      draws.forEach(d => pola(...d));
      click(k, cx, cy, u, PSTACK_CLICKS);
    });
  };

  // @element 34
  // 改写自 KittenJam Motion Library #269 切片转场：431×128 画框内两张几何示意图交替。当前图被切成 6 条竖条，
  // 每条间隔 0.08 秒、各 0.5 秒 easeInOut 3 次方滑出 148px，单数条向上、双数条向下，露出下面的另一张图。
  // 时间线：图 A 停留到 0.9 秒 → 0.9–1.8 秒切走露出图 B → 停到 3.3 秒 → 3.3–4.2 秒切走露出图 A，周期首尾都是图 A。
  const SLICE_N = 6, SLICE_X = 40, SLICE_Y = 20, SLICE_W = 431, SLICE_H = 128;
  CELLS[33] = (k, w, h, u) => {
    frame(k, 'example.com/gallery');
    const art = (v) => {
      if (v === 0) {
        k.fillStyle = C.blueL; k.fillRect(SLICE_X, SLICE_Y, SLICE_W, SLICE_H);
        k.fillStyle = C.blue; k.beginPath(); k.arc(SLICE_X + 120, SLICE_Y + 64, 40, 0, 7); k.fill();
        k.fillStyle = C.acc; k.beginPath(); k.moveTo(SLICE_X + 230, SLICE_Y + 104); k.lineTo(SLICE_X + 290, SLICE_Y + 24); k.lineTo(SLICE_X + 350, SLICE_Y + 104); k.closePath(); k.fill();
        txt(k, '01', SLICE_X + 16, SLICE_Y + 22, `800 13px ${EN}`, C.blue);
      } else {
        k.fillStyle = C.accL; k.fillRect(SLICE_X, SLICE_Y, SLICE_W, SLICE_H);
        k.fillStyle = C.ink; rr(k, SLICE_X + 90, SLICE_Y + 28, 72, 72, 10); k.fill();
        k.fillStyle = C.acc; k.save(); k.translate(SLICE_X + 270, SLICE_Y + 64); k.rotate(Math.PI / 4); k.fillRect(-32, -32, 64, 64); k.restore();
        k.strokeStyle = C.blue; k.lineWidth = 8; k.beginPath(); k.arc(SLICE_X + 360, SLICE_Y + 64, 26, 0, 7); k.stroke();
        txt(k, '02', SLICE_X + 16, SLICE_Y + 22, `800 13px ${EN}`, C.acc);
      }
    };
    // 当前要切走的图与底图
    const t0 = u < 2.55 ? 0.9 : 3.3, top = u < 2.55 ? 0 : 1;
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      k.save(); k.beginPath(); k.rect(SLICE_X, SLICE_Y, SLICE_W, SLICE_H); k.clip();
      art(1 - top);
      const sw = SLICE_W / SLICE_N;
      for (let i = 0; i < SLICE_N; i++) {
        const q = eIO(P(u, t0 + i * 0.08, t0 + i * 0.08 + 0.5));
        if (q >= 1) continue;
        k.save(); k.beginPath(); k.rect(SLICE_X + i * sw, SLICE_Y, sw + 0.5, SLICE_H); k.clip();
        k.translate(0, (i % 2 ? 1 : -1) * 148 * q); art(top); k.restore();
      }
      k.restore();
      bars(k, SLICE_X, SLICE_Y + SLICE_H + 8, 180, 1);
    });
  };

  // @element 35
  // 改写自 KittenJam Motion Library #324 天气图标动画：4 张 110×128 小卡（间距 14）各放一个线性图标，全部为周期内整数次循环：
  // 晴：12 道光芒每周期自转 1 圈；多云：云朵左右飘 ±6px（每周期 2 次往返）；雨：3 滴雨错开 0.27 秒、每 0.8 秒落下一次；
  // 雷暴：闪电在 1.2、1.5、3.6 秒各闪一下（0.12 秒），闪时卡片底色微亮。
  const WX_W = 110, WX_H = 128, WX_GAP = 14;
  CELLS[34] = (k, w, h, u) => {
    frame(k, 'example.com/weather');
    const x0 = (VW - (WX_W * 4 + WX_GAP * 3)) / 2, y0 = 18;
    const cloud = (x, y, s, col) => {
      k.fillStyle = col; k.beginPath();
      k.arc(x - 14 * s, y + 4 * s, 12 * s, 0, 7); k.arc(x + 2 * s, y - 6 * s, 16 * s, 0, 7); k.arc(x + 18 * s, y + 4 * s, 11 * s, 0, 7); k.fill();
      rr(k, x - 26 * s, y + 2 * s, 55 * s, 14 * s, 7 * s); k.fill();
    };
    const flash = [1.2, 1.5, 3.6].reduce((a, tc) => Math.max(a, u >= tc && u < tc + 0.12 ? 1 - (u - tc) / 0.12 : 0), 0);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      ['晴', '多云', '小雨', '雷暴'].forEach((lab, i) => {
        const x = x0 + i * (WX_W + WX_GAP), mx = x + WX_W / 2, my = y0 + 50;
        k.fillStyle = '#fff'; rr(k, x, y0, WX_W, WX_H, 12); k.fill();
        if (i === 3 && flash > 0) { k.fillStyle = `rgba(255,229,219,${flash})`; rr(k, x, y0, WX_W, WX_H, 12); k.fill(); }
        txt(k, lab, mx, y0 + 108, `700 12px ${JP}`, C.ink, 'center', 'middle');
        if (i === 0) {
          const a = u / CYC * Math.PI * 2;
          k.save(); k.translate(mx, my); k.rotate(a); k.strokeStyle = C.acc; k.lineWidth = 3; k.lineCap = 'round';
          for (let r = 0; r < 12; r++) { k.rotate(Math.PI / 6); k.beginPath(); k.moveTo(0, -22); k.lineTo(0, -30); k.stroke(); }
          k.restore(); k.fillStyle = C.acc; k.beginPath(); k.arc(mx, my, 16, 0, 7); k.fill(); k.lineCap = 'butt';
        } else if (i === 1) {
          k.fillStyle = '#FFB199'; k.beginPath(); k.arc(mx + 14, my - 12, 13, 0, 7); k.fill();
          cloud(mx + 6 * Math.sin(u / CYC * Math.PI * 4) - 4, my + 4, 1, C.blueL);
        } else if (i === 2) {
          k.strokeStyle = C.blue; k.lineWidth = 2.5; k.lineCap = 'round';
          [-14, 0, 14].forEach((dx, j) => {
            const q = mod(u - j * 0.27, 0.8) / 0.8;
            // 起落两端淡入淡出，避免雨滴突然出现
            k.globalAlpha = Math.min(1, q / 0.15, (1 - q) / 0.2);
            k.beginPath(); k.moveTo(mx + dx, my + 6 + 30 * q); k.lineTo(mx + dx - 2, my + 13 + 30 * q); k.stroke();
          });
          k.globalAlpha = 1; k.lineCap = 'butt';
          cloud(mx, my - 4, 1, '#A9B4CC');
        } else {
          cloud(mx, my - 4, 1, '#5C6680');
          k.fillStyle = flash > 0 ? '#FFC93C' : '#E7C35A'; k.globalAlpha = 0.35 + 0.65 * flash;
          k.beginPath(); k.moveTo(mx + 2, my + 6); k.lineTo(mx - 8, my + 24); k.lineTo(mx, my + 24); k.lineTo(mx - 5, my + 38); k.lineTo(mx + 10, my + 18); k.lineTo(mx + 2, my + 18); k.closePath(); k.fill();
          k.globalAlpha = 1;
        }
      });
    });
  };

  // @shared
  // 第二批 KittenJam 改写款共用：flipAt 求悬停状态 on(t) 最后一次切换的时刻（与 trans 同样按 1/120 秒往回查，最多 5 秒，找不到返回 null）；
  // mixHex 在两个 #RRGGBB 颜色之间按 x（0〜1）线性混色，用于悬停时的反色、变色。
  function flipAt(on, u) {
    const s = on(u);
    for (let i = 0, t = u; i < 600; i++, t -= 1 / 120) if (on(t - 1 / 120) !== s) return t;
    return null;
  }
  function mixHex(a, b, x) {
    const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(x)))).join(',')})`;
  }

  // @element 36
  // 改写自 KittenJam Motion Library #285 图标微动画：一排 4 个 64×64 图标格（中心间距 90），光标依次在每格停 0.7 秒，悬停时底色 0.2 秒 easeOut 亮起、图标变朱色。
  // 铃铛以顶端为轴摇 ±18°（每 0.3 秒一个来回、0.7 秒内线性衰减到 0）；爱心填色并在 0.35 秒内放大到 1.25 再回到 1；
  // 齿轮 0.5 秒转 90° 带回弹（back-out 过冲 1.7）；信封盖 0.35 秒 easeOut 翻开、信纸上移 10px。离开后各自复原，4.25 秒光标回到起点。
  const ICON_X = [120, 210, 300, 390], ICON_Y = 76, ICON_S = 64;
  const ICON_BACK = x => { const s = 1.7; return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
  CELLS[35] = (k, w, h, u) => {
    frame(k, 'example.com/app');
    const cur = t => path([[0, 255, 150], [0.35, 124, 80], [1.05, 124, 80], [1.3, 214, 80], [2.0, 214, 80], [2.25, 304, 80], [2.95, 304, 80], [3.2, 394, 80], [3.9, 394, 80], [4.25, 255, 150], [4.8, 255, 150]], t);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      ICON_X.forEach((x, i) => {
        const on = t => { const [a, b] = cur(t); return Math.abs(a - x) < ICON_S / 2 && Math.abs(b - ICON_Y) < ICON_S / 2; };
        const q = trans(on, u, 0.2), fa = flipAt(on, u), d = on(u) && fa !== null ? u - fa : -1;
        const bg = mixHex('#FFFFFF', C.accL, q), col = mixHex(C.ink, C.acc, q);
        k.fillStyle = bg; rr(k, x - ICON_S / 2, ICON_Y - ICON_S / 2, ICON_S, ICON_S, 14); k.fill();
        txt(k, ['通知', '收藏', '设置', '邮件'][i], x, ICON_Y + 50, `600 11px ${JP}`, C.sub, 'center', 'middle');
        k.save(); k.translate(x, ICON_Y); k.strokeStyle = col; k.fillStyle = col; k.lineWidth = 2.4; k.lineJoin = 'round'; k.lineCap = 'round';
        if (i === 0) {
          // 铃铛：以顶端挂点 (0,−15) 为轴摇摆，振幅随悬停时间线性衰减
          const a = d >= 0 && d < 0.7 ? 18 * Math.sin(2 * Math.PI * d / 0.3) * (1 - d / 0.7) : 0;
          k.translate(0, -15); k.rotate(a * Math.PI / 180); k.translate(0, 15);
          k.beginPath(); k.moveTo(-13, 8); k.lineTo(-11, 5); k.lineTo(-11, -3); k.arc(0, -3, 11, Math.PI, 0); k.lineTo(11, 5); k.lineTo(13, 8); k.closePath(); k.stroke();
          k.beginPath(); k.arc(0, 12, 3, 0, 7); k.fill();
          k.beginPath(); k.moveTo(0, -14); k.lineTo(0, -17); k.stroke();
        } else if (i === 1) {
          // 爱心：悬停开始 0.35 秒内跳一下，填色随底色一起淡入
          const s = d >= 0 && d < 0.35 ? 1 + 0.25 * Math.sin(Math.PI * d / 0.35) : 1;
          k.scale(s, s);
          k.beginPath(); k.moveTo(0, 12); k.bezierCurveTo(-20, 0, -12, -16, 0, -6); k.bezierCurveTo(12, -16, 20, 0, 0, 12); k.closePath();
          k.globalAlpha = q; k.fill(); k.globalAlpha = 1; k.stroke();
        } else if (i === 2) {
          // 齿轮：8 个齿，悬停转 90°（离开时同样带回弹转回）
          k.rotate(90 * trans(on, u, 0.5, ICON_BACK) * Math.PI / 180);
          k.lineWidth = 5; k.lineCap = 'butt';
          for (let j = 0; j < 8; j++) { const b = j * Math.PI / 4; k.beginPath(); k.moveTo(Math.cos(b) * 10, Math.sin(b) * 10); k.lineTo(Math.cos(b) * 16, Math.sin(b) * 16); k.stroke(); }
          k.beginPath(); k.arc(0, 0, 11, 0, 7); k.fill();
          k.fillStyle = bg; k.beginPath(); k.arc(0, 0, 5, 0, 7); k.fill();
        } else {
          // 信封：先画信纸，再用底色盖住信封身体，最后画翻开的盖子
          const f = trans(on, u, 0.35);
          k.fillStyle = '#fff'; k.fillRect(-10, -6 - 10 * f, 20, 14); k.lineWidth = 1.6; k.strokeRect(-10, -6 - 10 * f, 20, 14);
          k.lineWidth = 2.4; k.fillStyle = bg; rr(k, -16, -10, 32, 22, 3); k.fill(); k.stroke();
          k.beginPath(); k.moveTo(-16, -10); k.lineTo(0, -10 + 12 * (1 - 2 * f)); k.lineTo(16, -10); k.stroke();
        }
        k.restore();
      });
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 37
  // 改写自 KittenJam Motion Library #220 聚焦淡化其他：一排 4 张 100×120 卡片（间距 16）。光标进入整排后，被指的卡 0.45 秒 easeOut 上浮 8px、放大到 1.04；
  // 其他卡同时淡到不透明度 0.45、缩小到 0.95，并蒙上 35% 的灰（降低饱和）。光标依次停在第 1、2、4 张，约 4.1 秒离开整排后全部复原。
  const FOCUS_W = 100, FOCUS_H = 120, FOCUS_GAP = 16;
  CELLS[36] = (k, w, h, u) => {
    frame(k, 'example.com/plans');
    const x0 = (VW - (FOCUS_W * 4 + FOCUS_GAP * 3)) / 2, y0 = 26, rowW = FOCUS_W * 4 + FOCUS_GAP * 3;
    const cur = t => path([[0, 255, 162], [0.5, 84, 90], [1.4, 84, 90], [1.7, 200, 90], [2.6, 200, 90], [2.9, 432, 90], [3.8, 432, 90], [4.3, 255, 162], [4.8, 255, 162]], t);
    // 整排的悬停（像 CSS 的容器 :hover），卡片间的空隙也算在内
    const inRow = t => { const [a, b] = cur(t); return a > x0 && a < x0 + rowW && b > y0 && b < y0 + FOCUS_H; };
    const row = trans(inRow, u, 0.45);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      for (let i = 0; i < 4; i++) {
        const x = x0 + i * (FOCUS_W + FOCUS_GAP);
        const on = t => { const [a, b] = cur(t); return a > x && a < x + FOCUS_W && b > y0 && b < y0 + FOCUS_H; };
        const f = trans(on, u, 0.45), dim = clamp(row - f), s = 1 + 0.04 * f - 0.05 * dim;
        k.save(); k.globalAlpha = 1 - 0.55 * dim;
        k.translate(x + FOCUS_W / 2, y0 + FOCUS_H / 2 - 8 * f); k.scale(s, s); k.translate(-FOCUS_W / 2, -FOCUS_H / 2);
        k.save(); k.shadowColor = `rgba(28,35,51,${0.08 + 0.16 * f})`; k.shadowBlur = 6 + 14 * f; k.shadowOffsetY = 2 + 8 * f;
        k.fillStyle = '#fff'; rr(k, 0, 0, FOCUS_W, FOCUS_H, 10); k.fill(); k.restore();
        pic(k, 6, 6, FOCUS_W - 12, 58, i, 6);
        txt(k, ['入门', '标准', '专业', '团队'][i], 10, 82, `800 13px ${JP}`, C.ink); bars(k, 10, 92, 70, 2, C.faint, 5, 9);
        if (dim > 0) { k.fillStyle = `rgba(200,204,212,${0.35 * dim})`; rr(k, 0, 0, FOCUS_W, FOCUS_H, 10); k.fill(); }
        k.restore();
      }
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 38
  // 改写自 KittenJam Motion Library #209 Bento 格局展开：3×2 便当盒格局（471×144、格间距 8），各栏各列平时都是 1fr。
  // 光标停在某格时，该格所在栏 0.55 秒 easeInOut 3 次方放大到 2.4fr、所在列放大到 1.8fr，其他栏列同步让位；该格标题字号 13px → 18px。
  // 时间线：0.45–2.0 秒指左上格 → 2.0–3.6 秒指右下格 → 光标移出，全部回到平均。
  const BENTO = { x: 20, y: 12, w: 471, h: 144, gap: 8 };
  const BENTO_LAY = (fc, fr) => {
    const cw = BENTO.w - BENTO.gap * 2, ch = BENTO.h - BENTO.gap, sc = fc[0] + fc[1] + fc[2], sr = fr[0] + fr[1];
    const ws = fc.map(f => cw * f / sc), hs = fr.map(f => ch * f / sr);
    return { ws, hs, xs: [BENTO.x, BENTO.x + ws[0] + BENTO.gap, BENTO.x + ws[0] + ws[1] + BENTO.gap * 2], ys: [BENTO.y, BENTO.y + hs[0] + BENTO.gap] };
  };
  // 光标落点 = 目标格完全展开后的中心；悬停目标按时间表决定，避免「布局决定悬停、悬停又改布局」的循环
  const BENTO_PT = (c, r) => { const fc = [1, 1, 1], fr = [1, 1]; fc[c] = 2.4; fr[r] = 1.8; const L = BENTO_LAY(fc, fr); return [L.xs[c] + L.ws[c] / 2, L.ys[r] + L.hs[r] / 2]; };
  const BENTO_TGT = t => { t = mod(t, CYC); return t >= 0.45 && t < 2.0 ? [0, 0] : t >= 2.0 && t < 3.6 ? [2, 1] : null; };
  CELLS[37] = (k, w, h, u) => {
    frame(k, 'example.com/dashboard');
    const A = BENTO_PT(0, 0), B = BENTO_PT(2, 1);
    const [cx, cy] = path([[0, 470, 162], [0.45, A[0], A[1]], [1.9, A[0], A[1]], [2.15, B[0], B[1]], [3.6, B[0], B[1]], [4.0, 470, 162], [4.8, 470, 162]], u);
    const cq = [0, 1, 2].map(j => trans(t => { const g = BENTO_TGT(t); return !!g && g[0] === j; }, u, 0.55, eIO));
    const rq = [0, 1].map(j => trans(t => { const g = BENTO_TGT(t); return !!g && g[1] === j; }, u, 0.55, eIO));
    const L = BENTO_LAY(cq.map(q => 1 + 1.4 * q), rq.map(q => 1 + 0.8 * q));
    const COLS = [C.blueL, C.accL, '#E6F4EC', '#EEE8FF', '#FFF3D6', C.skel], DOTS = [C.blue, C.acc, '#3FA56B', '#8A6BEA', '#E0A21C', C.sub];
    view(k, () => {
      k.fillStyle = '#fff'; k.fillRect(0, 0, VW, VH);
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
        const i = r * 3 + c, x = L.xs[c], y = L.ys[r], cw = L.ws[c], ch = L.hs[r], e = cq[c] * rq[r];
        k.fillStyle = COLS[i]; rr(k, x, y, cw, ch, 10); k.fill();
        k.fillStyle = DOTS[i]; k.beginPath(); k.arc(x + cw - 18, y + 18, 7, 0, 7); k.fill();
        txt(k, ['数据', '团队', '设计', '日程', '消息', '发布'][i], x + 12, y + ch - 14, `800 ${13 + 5 * e}px ${JP}`, C.ink);
      }
      cursor(k, cx, cy);
    });
  };

  // @element 39
  // 改写自 KittenJam Motion Library #102 文字翻滚按钮：220×56 胶囊按钮，左侧文字「查看作品」、右侧直径 40 的圆形箭头。
  // 光标 0.6 秒移入：每个字依次延迟 0.035 秒，各在 0.55 秒内（easeInOut 3 次方）往上翻走一个行高（26px），下面同一个字补上；
  // 同时按钮底色白 → 墨色、文字墨色 → 白，圆圈墨色 → 朱色，箭头从 → 转到 ↗（−45°）。3.4 秒移开后全部反向翻回。
  const ROLL_W = 220, ROLL_H = 56, ROLL_TXT = '查看作品';
  CELLS[38] = (k, w, h, u) => {
    frame(k, 'example.com/works');
    const bx = (VW - ROLL_W) / 2, by = (VH - ROLL_H) / 2;
    const cur = t => path([[0, 430, 150], [0.6, 250, 90], [3.4, 250, 90], [4.0, 430, 150], [4.8, 430, 150]], t);
    const on = t => { const [a, b] = cur(t); return a > bx && a < bx + ROLL_W && b > by && b < by + ROLL_H; };
    const q = trans(on, u, 0.55, eIO);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      k.fillStyle = mixHex('#FFFFFF', C.ink, q); rr(k, bx, by, ROLL_W, ROLL_H, ROLL_H / 2); k.fill();
      k.strokeStyle = C.ink; k.lineWidth = 1.5; k.stroke();
      const font = `800 17px ${JP}`, ty = by + ROLL_H / 2, LH = 26, tc = mixHex(C.ink, '#FFFFFF', q);
      let x = bx + 30;
      k.save(); k.beginPath(); k.rect(bx + 20, ty - LH / 2, 130, LH); k.clip();
      [...ROLL_TXT].forEach((ch, i) => {
        // 每个字的时间线整体往后错开 i×0.035 秒
        const p = trans(on, u - i * 0.035, 0.55, eIO);
        txt(k, ch, x, ty + 1 - LH * p, font, tc, 'left', 'middle');
        txt(k, ch, x, ty + 1 + LH * (1 - p), font, tc, 'left', 'middle');
        k.font = font; x += k.measureText(ch).width;
      });
      k.restore();
      const ax = bx + ROLL_W - 28;
      k.fillStyle = mixHex(C.ink, C.acc, q); k.beginPath(); k.arc(ax, ty, 20, 0, 7); k.fill();
      k.save(); k.translate(ax, ty); k.rotate(-Math.PI / 4 * q); k.strokeStyle = '#fff'; k.lineWidth = 2.2; k.lineCap = 'round'; k.lineJoin = 'round';
      k.beginPath(); k.moveTo(-7, 0); k.lineTo(7, 0); k.moveTo(2, -5); k.lineTo(7, 0); k.lineTo(2, 5); k.stroke(); k.restore();
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 40
  // 改写自 KittenJam Motion Library #166 Dock 放大菜单：7 个 40×40 圆角图标排成 Dock（间距 10，底边对齐）。光标在图标列上左右扫过时，
  // 每个图标按与光标的水平距离放大：scale = 1 + 0.9 × max(0, 1 − 距离 / 110)，最近的约 1.9 倍，变宽后把邻居往两侧推开。
  // 光标 0.5 秒进入 → 2.3 秒扫到右侧 → 3.8 秒扫回左侧 → 4.3 秒离开；进出 Dock 时放大量 0.2 秒 easeOut 渐变。
  const DOCK_N = 7, DOCK_S = 40, DOCK_GAP = 10, DOCK_R = 110;
  const DOCK_COL = [C.acc, C.blue, '#3FA56B', '#8A6BEA', '#E0A21C', '#1C2333', '#E5487A'];
  CELLS[39] = (k, w, h, u) => {
    frame(k, 'example.com/desktop');
    const cur = t => path([[0, 256, 162], [0.5, 120, 104], [2.3, 400, 104], [3.8, 140, 104], [4.3, 256, 162], [4.8, 256, 162]], t);
    const [cx, cy] = cur(u);
    const m = trans(t => cur(t)[1] < 140, u, 0.2);
    // 放大量按图标「原位」的中心计算（不受推开后的位置影响）
    const s = [];
    for (let i = 0; i < DOCK_N; i++) { const c0 = VW / 2 + (i - (DOCK_N - 1) / 2) * (DOCK_S + DOCK_GAP); s.push(1 + 0.9 * m * Math.max(0, 1 - Math.abs(cx - c0) / DOCK_R)); }
    const tot = s.reduce((a, v) => a + v * DOCK_S, 0) + DOCK_GAP * (DOCK_N - 1), BOT = 132;
    view(k, () => {
      const g = k.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, '#C9D5FF'); g.addColorStop(1, '#FFE1D6'); k.fillStyle = g; k.fillRect(0, 0, VW, VH);
      k.fillStyle = 'rgba(255,255,255,.55)'; rr(k, VW / 2 - tot / 2 - 10, BOT - DOCK_S - 10, tot + 20, DOCK_S + 20, 16); k.fill();
      let x = VW / 2 - tot / 2;
      for (let i = 0; i < DOCK_N; i++) {
        const z = DOCK_S * s[i];
        k.fillStyle = DOCK_COL[i]; rr(k, x, BOT - z, z, z, z * 0.24); k.fill();
        k.fillStyle = 'rgba(255,255,255,.85)'; k.beginPath(); k.arc(x + z / 2, BOT - z / 2, z * 0.2, 0, 7); k.fill();
        x += z + DOCK_GAP;
      }
      cursor(k, cx, cy);
    });
  };

  // @element 41
  // 改写自 KittenJam Motion Library #171 边框描绘按钮：180×52 按钮平时只有 1px 淡色细框。光标 0.6 秒移入后，2px 朱色边框从左上角依次画出：
  // 上边向右 → 右边向下 → 下边向左 → 左边向上，每段 0.18 秒（共 0.72 秒、匀速），最后一段画的同时文字变成朱色；3.2 秒移出后按相反顺序收回。
  const BDRAW_W = 180, BDRAW_H = 52;
  CELLS[40] = (k, w, h, u) => {
    frame(k, 'example.com/contact');
    const bx = (VW - BDRAW_W) / 2, by = (VH - BDRAW_H) / 2;
    const cur = t => path([[0, 430, 150], [0.6, 262, 88], [3.2, 262, 88], [3.8, 430, 150], [4.8, 430, 150]], t);
    const on = t => { const [a, b] = cur(t); return a > bx && a < bx + BDRAW_W && b > by && b < by + BDRAW_H; };
    // 总进度匀速 0→1（离开时 1→0），四段各占四分之一，所以收回时顺序自然相反
    const g = trans(on, u, 0.72, x => x), sg = [0, 1, 2, 3].map(j => clamp(g * 4 - j));
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      k.fillStyle = '#fff'; k.fillRect(bx, by, BDRAW_W, BDRAW_H);
      k.strokeStyle = C.faint; k.lineWidth = 1; k.strokeRect(bx + 0.5, by + 0.5, BDRAW_W - 1, BDRAW_H - 1);
      const L = bx + 1, R = bx + BDRAW_W - 1, T = by + 1, B = by + BDRAW_H - 1;
      const seg = (x1, y1, x2, y2, f) => { if (f <= 0) return; k.beginPath(); k.moveTo(x1, y1); k.lineTo(lerp(x1, x2, f), lerp(y1, y2, f)); k.stroke(); };
      k.strokeStyle = C.acc; k.lineWidth = 2; k.lineCap = 'square';
      seg(L, T, R, T, sg[0]); seg(R, T, R, B, sg[1]); seg(R, B, L, B, sg[2]); seg(L, B, L, T, sg[3]);
      k.lineCap = 'butt';
      txt(k, '联系我们', VW / 2, VH / 2 + 1, `700 15px ${JP}`, mixHex(C.ink, C.acc, sg[3]), 'center', 'middle', '2px');
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 42
  // 改写自 KittenJam Motion Library #237 箭头接力按钮：180×50 墨色胶囊按钮，文字「了解更多」右侧一个箭头。光标 0.6 秒移入后 0.4 秒 easeInOut 3 次方：
  // 右侧箭头向右滑出 40px 并淡出，另一个箭头从按钮左外侧（−16px）滑到文字左边（+30px）并淡入，文字同步右移 20px 让位；3.4 秒移开后反向复原。
  const ISLIDE_W = 180, ISLIDE_H = 50;
  CELLS[41] = (k, w, h, u) => {
    frame(k, 'example.com/about');
    const bx = (VW - ISLIDE_W) / 2, by = (VH - ISLIDE_H) / 2, my = by + ISLIDE_H / 2;
    const cur = t => path([[0, 430, 150], [0.6, 250, 90], [3.4, 250, 90], [4.0, 430, 150], [4.8, 430, 150]], t);
    const on = t => { const [a, b] = cur(t); return a > bx && a < bx + ISLIDE_W && b > by && b < by + ISLIDE_H; };
    const q = trans(on, u, 0.4, eIO);
    const arrow = (x, a) => {
      if (a <= 0) return;
      k.save(); k.globalAlpha = a; k.strokeStyle = '#fff'; k.lineWidth = 2.2; k.lineCap = 'round'; k.lineJoin = 'round';
      k.beginPath(); k.moveTo(x - 7, my); k.lineTo(x + 7, my); k.moveTo(x + 2, my - 5); k.lineTo(x + 7, my); k.lineTo(x + 2, my + 5); k.stroke(); k.restore();
    };
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      k.save(); k.shadowColor = 'rgba(28,35,51,.25)'; k.shadowBlur = 12; k.shadowOffsetY = 4; k.fillStyle = C.ink; rr(k, bx, by, ISLIDE_W, ISLIDE_H, ISLIDE_H / 2); k.fill(); k.restore();
      k.save(); rr(k, bx, by, ISLIDE_W, ISLIDE_H, ISLIDE_H / 2); k.clip();
      txt(k, '了解更多', bx + 78 + 20 * q, my + 1, `700 15px ${JP}`, '#fff', 'center', 'middle');
      arrow(bx + 140 + 40 * q, 1 - q);
      arrow(bx - 16 + 46 * q, q);
      k.restore();
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 43
  // 改写自 KittenJam Motion Library #240 展开文字按钮：平时是直径 52 的朱色圆形「+」按钮。光标 0.6 秒移上去后 0.5 秒 easeInOut 3 次方：
  // 按钮向右展开成 140px 宽的胶囊，加号旋转 90°；文字「新建项目」在展开过半（进度 0.5 之后）才淡入。3.4 秒光标往左下移开后收回成圆形。
  const EXPB_D = 52, EXPB_W = 140;
  CELLS[42] = (k, w, h, u) => {
    frame(k, 'example.com/projects');
    const bx = (VW - EXPB_W) / 2, by = (VH - EXPB_D) / 2, ccx = bx + EXPB_D / 2, ccy = by + EXPB_D / 2;
    const cur = t => path([[0, 110, 150], [0.6, ccx + 4, ccy + 4], [3.4, ccx + 4, ccy + 4], [4.0, 110, 150], [4.8, 110, 150]], t);
    // 判定只看原来的圆，光标从左下离开，避免展开后的胶囊挡住离开路线
    const on = t => { const [a, b] = cur(t); return Math.hypot(a - ccx, b - ccy) < EXPB_D / 2; };
    const q = trans(on, u, 0.5, eIO), bw = lerp(EXPB_D, EXPB_W, q), ta = clamp((q - 0.5) / 0.5);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      k.save(); k.shadowColor = 'rgba(255,90,44,.35)'; k.shadowBlur = 14; k.shadowOffsetY = 5; k.fillStyle = C.acc; rr(k, bx, by, bw, EXPB_D, EXPB_D / 2); k.fill(); k.restore();
      if (ta > 0) {
        k.save(); rr(k, bx, by, bw, EXPB_D, EXPB_D / 2); k.clip();
        k.globalAlpha = ta; txt(k, '新建项目', bx + EXPB_D - 4, ccy + 1, `700 15px ${JP}`, '#fff', 'left', 'middle');
        k.restore();
      }
      k.save(); k.translate(ccx, ccy); k.rotate(Math.PI / 2 * q); k.strokeStyle = '#fff'; k.lineWidth = 3; k.lineCap = 'round';
      k.beginPath(); k.moveTo(-9, 0); k.lineTo(9, 0); k.moveTo(0, -9); k.lineTo(0, 9); k.stroke(); k.restore();
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 44
  // 改写自 KittenJam Motion Library #103 光标扩散填满按钮：深色页面上 200×52 朱色描边胶囊按钮。光标从左下方进入按钮，
  // 朱色圆以「进入点」为圆心、0.55 秒 easeInOut 3 次方从 0 放大到能盖住最远角的半径，文字由朱色变白；
  // 3.0 秒后光标往上方离开，圆改以「离开点」为圆心 0.55 秒缩小消失，颜色往出口方向收回。
  const DFILL_W = 200, DFILL_H = 52;
  CELLS[43] = (k, w, h, u) => {
    frame(k, 'example.com/contact');
    const bx = (VW - DFILL_W) / 2, by = (VH - DFILL_H) / 2;
    const cur = t => path([[0, 40, 150], [0.9, 250, 86], [3.0, 262, 84], [3.5, 320, 16], [4.2, 40, 16], [4.8, 40, 150]], t);
    const on = t => { const [a, b] = cur(t); return a > bx && a < bx + DFILL_W && b > by && b < by + DFILL_H; };
    // 圆心 = 最后一次进入或离开按钮那一刻的光标位置
    const q = trans(on, u, 0.55, eIO), ft = flipAt(on, u);
    const [ox, oy] = ft === null ? [bx, by] : cur(ft);
    const R = Math.max(...[[bx, by], [bx + DFILL_W, by], [bx, by + DFILL_H], [bx + DFILL_W, by + DFILL_H]].map(([a, b]) => Math.hypot(a - ox, b - oy)));
    view(k, () => {
      k.fillStyle = '#151A26'; k.fillRect(0, 0, VW, VH);
      if (q > 0) { k.save(); rr(k, bx, by, DFILL_W, DFILL_H, DFILL_H / 2); k.clip(); k.fillStyle = C.acc; k.beginPath(); k.arc(ox, oy, R * q, 0, 7); k.fill(); k.restore(); }
      k.strokeStyle = C.acc; k.lineWidth = 2; rr(k, bx, by, DFILL_W, DFILL_H, DFILL_H / 2); k.stroke();
      txt(k, '立即联系', VW / 2, VH / 2 + 1, `700 16px ${JP}`, mixHex(C.acc, '#FFFFFF', q), 'center', 'middle', '2px');
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 45
  // 改写自 KittenJam Motion Library #168 展开式图片面板：5 片等宽竖条面板（总宽 471、高 136、间距 6，平时各 flex 1）。
  // 光标停在哪片，那片 0.6 秒 easeOut 3 次方展开到 flex 4、其他同步缩窄；展开进度超过 0.6 后左下角标题淡入。
  // 时间线：0.35–1.75 秒停第 2 片 → 1.75–3.6 秒移到第 4 片接棒 → 移出后全部回到等宽。面板画面是几何示意图，按面板中心裁切、不变形。
  const XPAN = { x: 20, y: 14, w: 471, h: 136, gap: 6, n: 5 };
  const XPAN_LAY = fl => {
    const tot = fl.reduce((a, b) => a + b, 0), aw = XPAN.w - XPAN.gap * (XPAN.n - 1);
    let x = XPAN.x;
    return fl.map(f => { const r = [x, aw * f / tot]; x += r[1] + XPAN.gap; return r; });
  };
  // 与 Bento 款同样：悬停目标按时间表决定，光标落点取目标完全展开后的中心
  const XPAN_PT = i => { const fl = Array(XPAN.n).fill(1); fl[i] = 4; const [x, pw] = XPAN_LAY(fl)[i]; return [x + pw / 2, XPAN.y + XPAN.h / 2]; };
  const XPAN_TGT = t => { t = mod(t, CYC); return t >= 0.35 && t < 1.75 ? 1 : t >= 1.75 && t < 3.6 ? 3 : -1; };
  CELLS[44] = (k, w, h, u) => {
    frame(k, 'example.com/explore');
    const A = XPAN_PT(1), B = XPAN_PT(3);
    const [cx, cy] = path([[0, 256, 162], [0.35, A[0], A[1]], [1.6, A[0], A[1]], [1.9, B[0], B[1]], [3.5, B[0], B[1]], [3.9, 256, 162], [4.8, 256, 162]], u);
    const q = Array.from({ length: XPAN.n }, (_, i) => trans(t => XPAN_TGT(t) === i, u, 0.6));
    const lay = XPAN_LAY(q.map(v => 1 + 3 * v));
    view(k, () => {
      k.fillStyle = '#fff'; k.fillRect(0, 0, VW, VH);
      lay.forEach(([x, pw], i) => {
        k.save(); rr(k, x, XPAN.y, pw, XPAN.h, 10); k.clip();
        pic(k, x + pw / 2 - 130, XPAN.y, 260, XPAN.h, i, 0);
        const ta = clamp((q[i] - 0.6) / 0.4);
        if (ta > 0) {
          k.globalAlpha = ta; k.fillStyle = 'rgba(28,35,51,.35)'; k.fillRect(x, XPAN.y + XPAN.h - 34, pw, 34);
          txt(k, ['山野', '海岸', '城市', '森林', '星空'][i], x + 12, XPAN.y + XPAN.h - 12, `800 15px ${JP}`, '#fff');
        }
        k.restore();
      });
      cursor(k, cx, cy);
    });
  };

  // @element 46
  // 改写自 KittenJam Motion Library #264 低饱和唤醒：一排 4 张 104×118 的几何示意图（间距 16）平时低饱和偏暗（90% 去饱和、压暗 20%）。
  // 光标滑过的那张 0.6 秒 easeOut 3 次方恢复鲜艳与亮度，画面在框内放大到 1.05，底部名字标签上浮 10px 淡入；光标依次停第 1、3 张，离开后恢复。
  const SAT_W = 104, SAT_H = 118, SAT_GAP = 16;
  CELLS[45] = (k, w, h, u) => {
    frame(k, 'example.com/team');
    const x0 = (VW - (SAT_W * 4 + SAT_GAP * 3)) / 2, y0 = 22, x3 = x0 + 2 * (SAT_W + SAT_GAP) + 56;
    const cur = t => path([[0, 255, 160], [0.5, x0 + 56, 80], [1.7, x0 + 56, 80], [2.1, x3, 80], [3.4, x3, 80], [3.9, 255, 160], [4.8, 255, 160]], t);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      for (let i = 0; i < 4; i++) {
        const x = x0 + i * (SAT_W + SAT_GAP);
        const on = t => { const [a, b] = cur(t); return a > x && a < x + SAT_W && b > y0 && b < y0 + SAT_H; };
        const q = trans(on, u, 0.6), d = 1 - q;
        pic(k, x, y0, SAT_W, SAT_H, i, 10, 1 + 0.05 * q);
        k.save(); rr(k, x, y0, SAT_W, SAT_H, 10); k.clip();
        if (d > 0) {
          // 用灰色做 saturation 合成来去饱和（相当于 grayscale），再叠一层黑色压暗（相当于 brightness）
          k.globalCompositeOperation = 'saturation'; k.globalAlpha = 0.9 * d; k.fillStyle = '#808080'; k.fillRect(x, y0, SAT_W, SAT_H);
          k.globalCompositeOperation = 'source-over'; k.globalAlpha = 1; k.fillStyle = `rgba(0,0,0,${0.2 * d})`; k.fillRect(x, y0, SAT_W, SAT_H);
        }
        if (q > 0) {
          k.globalAlpha = q; k.fillStyle = 'rgba(255,255,255,.92)'; rr(k, x + 8, y0 + SAT_H - 30 + 10 * d, SAT_W - 16, 22, 11); k.fill();
          txt(k, ['设计', '开发', '产品', '运营'][i], x + SAT_W / 2, y0 + SAT_H - 19 + 10 * d, `700 11px ${JP}`, C.ink, 'center', 'middle');
        }
        k.restore();
      }
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 47
  // 改写自 KittenJam Motion Library #323 指针时钟：直径 140 的表盘，60 个刻度（每 5 格较粗较长）；时针、分针停在示意时间 10:10（不读真实时间）。
  // 朱色秒针每 0.4 秒跳到下一个粗刻度（30°），每跳 0.15 秒 back-out（过冲 1.7）略超过再弹回；一周期跳 12 次刚好一圈，首尾无缝。
  const CLK_R = 70, CLK_STEP = 0.4;
  const CLK_BACK = x => { const s = 1.7; return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
  CELLS[46] = (k, w, h, u) => {
    frame(k, 'example.com/clock');
    const n = Math.floor(u / CLK_STEP), f = clamp((u - n * CLK_STEP) / 0.15);
    const sa = (n + CLK_BACK(f)) * Math.PI / 6;   // 秒针角度（0 = 12 点方向）
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      const ox = VW / 2, oy = VH / 2;
      k.save(); k.shadowColor = 'rgba(28,35,51,.16)'; k.shadowBlur = 14; k.shadowOffsetY = 4; k.fillStyle = '#fff'; k.beginPath(); k.arc(ox, oy, CLK_R, 0, 7); k.fill(); k.restore();
      k.strokeStyle = C.ink; k.lineWidth = 3; k.beginPath(); k.arc(ox, oy, CLK_R, 0, 7); k.stroke();
      for (let i = 0; i < 60; i++) {
        const a = i * Math.PI / 30, big = i % 5 === 0, r0 = CLK_R - (big ? 13 : 8);
        k.strokeStyle = big ? C.ink : C.sub; k.lineWidth = big ? 2.4 : 1;
        k.beginPath(); k.moveTo(ox + Math.sin(a) * r0, oy - Math.cos(a) * r0); k.lineTo(ox + Math.sin(a) * (CLK_R - 5), oy - Math.cos(a) * (CLK_R - 5)); k.stroke();
      }
      const hand = (a, len, tail, lw, col) => {
        k.strokeStyle = col; k.lineWidth = lw; k.lineCap = 'round';
        k.beginPath(); k.moveTo(ox - Math.sin(a) * tail, oy + Math.cos(a) * tail); k.lineTo(ox + Math.sin(a) * len, oy - Math.cos(a) * len); k.stroke();
      };
      hand((10 + 10 / 60) * Math.PI / 6, 36, 6, 5, C.ink);   // 时针 10:10
      hand(10 * Math.PI / 30, 52, 8, 3.5, C.ink);             // 分针 10 分
      hand(sa, 58, 14, 1.8, C.acc);
      k.lineCap = 'butt';
      k.fillStyle = C.acc; k.beginPath(); k.arc(ox, oy, 4.5, 0, 7); k.fill();
    });
  };

  // @element 48
  // 改写自 KittenJam Motion Library #325 选取框蚂蚁线：蓝色 1.5px 虚线选取框（线段 6、间隔 5），虚线偏移每 0.48 秒走 −11（一周期 10 轮），持续同向流动；
  // 四角各一个 8×8 白底蓝框控制点。框尺寸在 200×90 与 280×120 之间变化（0.4–2.0 秒放大、2.8–4.4 秒缩小，easeInOut 3 次方），下方标签实时显示取整后的宽 × 高。
  const ANTS_DASH = [6, 5], ANTS_STEP = 0.48;
  CELLS[47] = (k, w, h, u) => {
    frame(k, 'example.com/editor');
    const s = steps([[0.4, 0], [2.0, 1], [2.8, 1], [4.4, 0]], u);
    const bw = lerp(200, 280, s), bh = lerp(90, 120, s), x = VW / 2 - bw / 2, y = 72 - bh / 2;
    view(k, () => {
      k.fillStyle = '#F7F8FA'; k.fillRect(0, 0, VW, VH);
      k.fillStyle = C.faint; for (let gx = 12; gx < VW; gx += 20) for (let gy = 12; gy < VH; gy += 20) k.fillRect(gx, gy, 2, 2);
      // 被选中的图层（随选取框一起改变尺寸）
      k.fillStyle = C.blueL; k.fillRect(x, y, bw, bh);
      k.fillStyle = C.acc; k.beginPath(); k.arc(x + 30, y + bh / 2, 14, 0, 7); k.fill();
      txt(k, '设计工具', x + 54, y + bh / 2 + 1, `800 16px ${JP}`, C.ink, 'left', 'middle');
      // 先描一圈白线垫底，虚线的间隙才看得清
      k.lineWidth = 1.5; k.strokeStyle = '#fff'; k.strokeRect(x, y, bw, bh);
      k.strokeStyle = C.blue; k.setLineDash(ANTS_DASH); k.lineDashOffset = -11 * (mod(u, ANTS_STEP) / ANTS_STEP); k.strokeRect(x, y, bw, bh);
      k.setLineDash([]); k.lineDashOffset = 0;
      [[x, y], [x + bw, y], [x, y + bh], [x + bw, y + bh]].forEach(([a, b]) => { k.fillStyle = '#fff'; k.fillRect(a - 4, b - 4, 8, 8); k.strokeStyle = C.blue; k.strokeRect(a - 4, b - 4, 8, 8); });
      const lab = `${Math.round(bw)} × ${Math.round(bh)}`;
      k.font = `700 11px ${EN}`; const lw = k.measureText(lab).width + 16;
      k.fillStyle = C.blue; rr(k, VW / 2 - lw / 2, y + bh + 10, lw, 18, 4); k.fill();
      txt(k, lab, VW / 2, y + bh + 19.5, `700 11px ${EN}`, '#fff', 'center', 'middle');
    });
  };

  // @element 49
  CELLS[48] = (function () {
    // 撕票根：一张有纸感的活动门票，光标抓住右侧票根往下拖，票根沿打孔线从上往下撕开（撕口带纸纤维毛边），
    // 撕开后票根旋转掉出画面，主票面回弹，「已检票」印章盖下；随后印章褪去、票根重新出现，回到首帧。
    // 纯函数：画面只由 u 决定；纸面、阴影、印章等静态层首次调用时预渲染缓存。
    const W = 539, H = 208, CYC = 4.8;
    const SANS = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif';
    const MONO = '"SF Mono", Menlo, Consolas, monospace';

    // 配色：暖米色棚拍底 + 奶油纸票 + lp 包的橙色强调 / 墨蓝文字 + 朱红印泥
    const PAL = {
      bgTop: '#f7f3ec', bgMid: '#efe9df', bgBot: '#e2d9cb', vignette: '60,44,28',
      paperHi: '#fffdf8', paperLo: '#f4ecdd', thick: '#d8cab2', edge: '#c9b89a',
      ink: '#1c2333', ink2: '#4a5368', mut: '#8a8478',
      acc: '#ff5a2c', accDeep: '#d9431c', perf: '#b9a888',
      shadow: '58,40,22', stamp: '#e0412f'
    };

    // 票面几何：主票面 + 票根共宽 340（约占画宽 63%），两者以打孔线 PX 为界
    const TX = 104, TY = 40, MW = 262, SW = 82, TH = 128;
    const PX = TX + MW;            // 打孔线 x
    const N = 9, R = 10;           // 半圆缺口半径、外圆角
    const P = 6;                   // 缓存留边（放厚度层）
    const S = 3;                   // 缓存分辨率倍数：调用方最多 2×dpr 放大
    const REST = { x: 500, y: 186 }, GRIP = { x: 44, y: 14 };  // 光标候场点；票根上的抓取点（票根局部坐标）

    const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
    const ease = t => (t = clamp(t), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
    const lerp = (a, b, t) => a + (b - a) * t;
    const hs = (i, s) => { const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };
    const rgba = (c, a) => `rgba(${c},${a})`;

    // 主票面轮廓（局部坐标 0..MW × 0..TH）：左侧圆角，右侧打孔线处上下各咬一个半圆缺口
    function mainPath(x) {
      x.beginPath();
      x.moveTo(R, 0); x.lineTo(MW - N, 0);
      x.arc(MW, 0, N, Math.PI, Math.PI / 2, true);
      x.lineTo(MW, TH - N);
      x.arc(MW, TH, N, -Math.PI / 2, -Math.PI, true);
      x.lineTo(R, TH); x.arcTo(0, TH, 0, TH - R, R);
      x.lineTo(0, R); x.arcTo(0, 0, R, 0, R);
      x.closePath();
    }
    // 票根轮廓（局部坐标 0..SW × 0..TH）：左侧缺口与主票面对齐，右侧圆角
    function stubPath(x) {
      x.beginPath();
      x.moveTo(N, 0); x.lineTo(SW - R, 0); x.arcTo(SW, 0, SW, R, R);
      x.lineTo(SW, TH - R); x.arcTo(SW, TH, SW - R, TH, R);
      x.lineTo(N, TH);
      x.arc(0, TH, N, 0, -Math.PI / 2, true);
      x.lineTo(0, N);
      x.arc(0, 0, N, Math.PI / 2, 0, true);
      x.closePath();
    }

    function mk(w, h, draw) {
      const c = document.createElement('canvas'); c.width = Math.ceil(w * S); c.height = Math.ceil(h * S);
      const x = c.getContext('2d'); x.scale(S, S); draw(x); return c;
    }

    // 纸张材质：右下厚度层 + 竖向渐变 + 确定性细噪点纤维 + 左上镜面光斑 + 左上高光边
    function paper(x, path, w, seed) {
      x.save(); x.translate(1.2, 1.8); path(x); x.fillStyle = PAL.thick; x.fill(); x.restore();
      path(x);
      const gr = x.createLinearGradient(0, 0, 0, TH);
      gr.addColorStop(0, PAL.paperHi); gr.addColorStop(1, PAL.paperLo);
      x.fillStyle = gr; x.fill();
      x.save(); path(x); x.clip();
      for (let i = 0; i < w * 5; i++) {
        const dark = hs(i, seed + 3) > 0.45;
        x.fillStyle = dark ? 'rgba(120,96,60,0.07)' : 'rgba(255,255,255,0.5)';
        const len = 0.6 + hs(i, seed + 4) * 2.2;   // 短纤维：横向小划痕比圆点更像纸
        x.fillRect(hs(i, seed + 1) * w, hs(i, seed + 2) * TH, len, 0.5);
      }
      const sp = x.createRadialGradient(w * 0.2, -8, 0, w * 0.2, -8, w * 0.75);
      sp.addColorStop(0, 'rgba(255,255,255,0.55)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = sp; x.fillRect(0, 0, w, TH);
      x.restore();
      const hl = x.createLinearGradient(0, 0, w * 0.45, TH);
      hl.addColorStop(0, 'rgba(255,255,255,0.95)'); hl.addColorStop(0.5, 'rgba(255,255,255,0.2)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      path(x); x.strokeStyle = hl; x.lineWidth = 1; x.stroke();
    }

    // 主票面与票根在打孔线两侧各多画 EXT 的纸：完好时按打孔线裁切拼成一张，撕开时毛边才有纸可露
    const EXT = 3;
    function mainShape(x) {
      x.beginPath();
      x.moveTo(R, 0); x.lineTo(MW - N, 0);
      x.arc(MW, 0, N, Math.PI, Math.PI / 2, true);
      x.lineTo(MW + EXT, N); x.lineTo(MW + EXT, TH - N); x.lineTo(MW, TH - N);
      x.arc(MW, TH, N, -Math.PI / 2, -Math.PI, true);
      x.lineTo(R, TH); x.arcTo(0, TH, 0, TH - R, R);
      x.lineTo(0, R); x.arcTo(0, 0, R, 0, R);
      x.closePath();
    }
    function stubShape(x) {
      x.beginPath();
      x.moveTo(N, 0); x.lineTo(SW - R, 0); x.arcTo(SW, 0, SW, R, R);
      x.lineTo(SW, TH - R); x.arcTo(SW, TH, SW - R, TH, R);
      x.lineTo(N, TH);
      x.arc(0, TH, N, 0, -Math.PI / 2, true);
      x.lineTo(-EXT, TH - N); x.lineTo(-EXT, N); x.lineTo(0, N);
      x.arc(0, 0, N, Math.PI / 2, 0, true);
      x.closePath();
    }

    // 主票面内容（局部坐标）：左侧橙色色条 + 活动名 + 三栏信息 + 座位
    function mainArt(x) {
      x.save(); mainPath(x); x.clip();
      const band = x.createLinearGradient(0, 0, 0, TH);
      band.addColorStop(0, PAL.acc); band.addColorStop(1, PAL.accDeep);
      x.fillStyle = band; x.fillRect(0, 0, 8, TH);
      x.restore();
      x.textBaseline = 'alphabetic'; x.textAlign = 'left';
      x.fillStyle = PAL.acc; x.font = `600 9.5px ${SANS}`;
      x.fillText('LIVE · 2026 秋季巡演', 24, 26);
      x.fillStyle = PAL.ink; x.font = `700 21px ${SANS}`;
      x.fillText('夜航星 · 城市音乐会', 24, 54);
      const cols = [['日期', '11.15 周六'], ['开场', '19:30'], ['场馆', '星海音乐厅']];
      const cx = [24, 104, 160];
      cols.forEach(([a, b], i) => {
        x.fillStyle = PAL.mut; x.font = `500 9px ${SANS}`; x.fillText(a, cx[i], 80);
        x.fillStyle = PAL.ink2; x.font = `600 11.5px ${SANS}`; x.fillText(b, cx[i], 96);
      });
      x.strokeStyle = 'rgba(140,120,90,0.25)'; x.lineWidth = 0.8;
      x.beginPath(); x.moveTo(24, 106.5); x.lineTo(MW - 22, 106.5); x.stroke();
      x.fillStyle = PAL.ink; x.font = `600 10.5px ${SANS}`; x.fillText('A 区 12 排 08 座', 24, 121);
      x.fillStyle = PAL.mut; x.font = `500 9px ${MONO}`; x.textAlign = 'right'; x.fillText('¥ 380', MW - 22, 121);
    }
    // 票根内容（局部坐标）：竖排「入场券」+ 编号 + 条码
    function stubArt(x) {
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = PAL.acc; x.font = `700 13px ${SANS}`;
      ['入', '场', '券'].forEach((c, i) => x.fillText(c, SW / 2 + 2, 26 + i * 17));
      x.fillStyle = PAL.mut; x.font = `500 8.5px ${MONO}`; x.fillText('No.0815', SW / 2 + 2, 86);
      // 条码：宽窄由哈希决定，固定不变
      let bx = 16;
      for (let i = 0; bx < SW - 14; i++) {
        const bw = hs(i, 9) > 0.6 ? 2 : 1;
        if (hs(i, 7) > 0.3) { x.fillStyle = PAL.ink2; x.fillRect(bx, 98, bw, 18); }
        bx += bw + 1;
      }
    }
    // 印章：朱红双圈 + 「已检票」，用哈希小点擦出印泥不匀的斑驳
    function stampArt(x) {
      const c = 42;
      x.strokeStyle = PAL.stamp; x.fillStyle = PAL.stamp;
      x.lineWidth = 3; x.beginPath(); x.arc(c, c, 36, 0, Math.PI * 2); x.stroke();
      x.lineWidth = 1.2; x.beginPath(); x.arc(c, c, 30, 0, Math.PI * 2); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = `800 17px ${SANS}`; x.fillText('已检票', c, c - 1);
      x.font = `700 6.5px ${SANS}`; x.fillText('CHECKED · 11.15', c, c + 16);
      x.font = `700 6.5px ${SANS}`; x.fillText('★  入场  ★', c, c - 17);
      x.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 140; i++) {
        x.globalAlpha = 0.35 + hs(i, 12) * 0.6;
        x.beginPath(); x.arc(hs(i, 10) * 84, hs(i, 11) * 84, 0.4 + hs(i, 13) * 1.3, 0, Math.PI * 2); x.fill();
      }
      x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    }

    const PAD = 24;
    let C = null;
    function build() {
      const bg = mk(W, H, x => {
        const gr = x.createLinearGradient(0, 0, 0, H);
        gr.addColorStop(0, PAL.bgTop); gr.addColorStop(0.55, PAL.bgMid); gr.addColorStop(1, PAL.bgBot);
        x.fillStyle = gr; x.fillRect(0, 0, W, H);
        // 顶部柔光 + 四周暗角：视线落在票面中央
        const v = x.createRadialGradient(W * 0.48, 70, 40, W * 0.5, 100, 330);
        v.addColorStop(0, 'rgba(255,255,255,0.5)'); v.addColorStop(0.5, 'rgba(255,255,255,0)'); v.addColorStop(1, rgba(PAL.vignette, 0.2));
        x.fillStyle = v; x.fillRect(0, 0, W, H);
      });
      // 阴影精灵：形状移到画外，只留 shadowBlur 的影子
      const shadow = (path, w, blur, a) => mk(w + PAD * 2, TH + PAD * 2, x => {
        x.shadowColor = rgba(PAL.shadow, a); x.shadowBlur = blur * S; x.shadowOffsetY = 3000 * S;
        x.translate(PAD, PAD - 3000); path(x); x.fillStyle = '#000'; x.fill();
      });
      const main = mk(MW + EXT + P * 2, TH + P * 2, x => { x.translate(P, P); paper(x, mainShape, MW + EXT, 1); mainArt(x); });
      const stub = mk(SW + EXT + P * 2, TH + P * 2, x => { x.translate(P + EXT, P); paper(x, stubShape, SW, 2); stubArt(x); });
      return {
        bg, main, stub, stamp: mk(84, 84, stampArt),
        mainAmb: shadow(mainPath, MW, 14, 0.2), mainCon: shadow(mainPath, MW, 2.5, 0.24),
        stubAmb: shadow(stubPath, SW, 14, 0.2), stubCon: shadow(stubPath, SW, 2.5, 0.24)
      };
    }

    // ---------- 时间线（秒） ----------
    const T = {
      go0: 0.1, go1: 0.6,        // 光标从候场点移到票根抓取点
      press: 0.66,               // 按下
      drag0: 0.78, drag1: 1.98,  // 往下拖，撕口从上往下走完整条打孔线
      fall: 1.98, fallEnd: 2.9,  // 票根脱离、旋转掉出画面
      back0: 2.0, back1: 2.8,    // 光标回候场点
      hit: 2.42, stampIn: 0.12,  // 印章落下（命中时刻 + 下落时长）
      out0: 3.7, out1: 4.05,     // 印章褪去
      ret0: 3.95, ret1: 4.45     // 票根回到原位（之后静止到周期末，与 u=0 相同）
    };
    const TILT = 0.3;            // 撕到底时票根相对打孔线的张角
    const PULL = 0.024;          // 拖拽时主票面被带歪的角度
    const FALL = { vx: 70, g: 900, w: 2.4 };   // 票根掉落：横向速度、重力、角速度

    // 撕口进度 0..1：前 15% 慢（要用点力才撕开），之后加速
    const tearP = u => { const t = clamp((u - T.drag0) / (T.drag1 - T.drag0)); return t * t * (1.6 - 0.6 * t); };

    // 主票面姿态：拖拽时被带歪，松手后阻尼回弹；印章命中时轻轻下沉
    function mainPose(u) {
      let ang = 0, dy = 0;
      if (u < T.drag1) ang = PULL * tearP(u);
      else { const t = u - T.drag1; ang = PULL * Math.exp(-7 * t) * Math.cos(16 * t); }
      if (u > T.hit) { const t = u - T.hit; dy = 2.2 * Math.exp(-11 * t) * Math.sin(28 * t); }
      return { ang, dy };
    }
    // 主票面坐标变换：绕左缘中点旋转（左缘像被另一只手按着）
    const PIV = { x: TX, y: TY + TH / 2 };
    function applyMain(k, m) { k.translate(PIV.x, PIV.y + m.dy); k.rotate(m.ang); k.translate(-PIV.x, -PIV.y); }
    function mapMain(m, x, y) {
      const c = Math.cos(m.ang), s = Math.sin(m.ang), dx = x - PIV.x, dy = y - PIV.y;
      return { x: PIV.x + dx * c - dy * s, y: PIV.y + m.dy + dx * s + dy * c };
    }

    // 票根状态：附着（整张票根绕撕口前端 front 刚性旋转 a；front 以下那段压在主票面下面，看起来仍连着）/ 掉落 / 隐藏 / 回位淡入
    function stubState(u) {
      if (u < T.drag0) return { mode: 'on', front: 0, a: 0, d: 0, alpha: 1, lift: u > T.press ? 0.25 : 0 };
      if (u < T.fall) { const p = tearP(u); return { mode: 'on', front: p * TH, a: TILT * p, d: 2 * p, alpha: 1, lift: 0.25 + 0.75 * p }; }
      if (u < T.fallEnd) return { mode: 'fall', t: u - T.fall, front: TH };
      if (u < T.ret0) return { mode: 'off', front: TH };
      const e = easeOut((u - T.ret0) / (T.ret1 - T.ret0));
      return { mode: 'on', front: 0, a: 0, d: -9 * (1 - e), alpha: e, lift: 0 };
    }
    // 已撕部分在票面坐标里的变换：绕 (PX, TY+front) 旋转 a，再下移 d
    function torn(st, x, y) {
      const c = Math.cos(st.a), s = Math.sin(st.a), dx = x - PX, dy = y - (TY + st.front);
      return { x: PX + dx * c - dy * s, y: TY + st.front + st.d + dx * s + dy * c };
    }

    // 锯齿撕边：每 1.6px 一个纤维长度，哈希决定；side 区分主票面与票根两侧
    const STEP = 1.6;
    const jag = (i, side) => 0.3 + hs(i, 20 + side) * 2.3;

    // 主票面：未撕段在打孔线处直切（与票根拼成一张），已撕段（0..front）沿锯齿纤维向右伸出
    function mainClip(k, front) {
      k.beginPath(); k.moveTo(TX - P, TY - P); k.lineTo(PX, TY - P);
      const n = Math.floor(front / STEP);
      for (let i = 0; i <= n; i++) k.lineTo(PX + jag(i, 0), TY + i * STEP);
      k.lineTo(PX, TY + front); k.lineTo(PX, TY + TH + P); k.lineTo(TX - P, TY + TH + P); k.closePath();
    }
    // 撕口纤维的浅色描边：撕开的纸芯比表面更白
    function fiberEdge(k, front, side, sign) {
      const n = Math.floor(front / STEP);
      if (n < 1) return;
      k.beginPath();
      for (let i = 0; i <= n; i++) k.lineTo(PX + sign * jag(i, side), TY + i * STEP);
      k.strokeStyle = 'rgba(255,255,255,0.85)'; k.lineWidth = 0.7; k.stroke();
    }
    // 票根已撕段（翻起的那片）的裁切区：撕口前端以上、打孔线左侧锯齿纤维以右
    function flapClip(k, front) {
      const n = Math.floor(front / STEP);
      k.beginPath(); k.moveTo(PX + SW + PAD, TY - PAD); k.lineTo(PX + SW + PAD, TY + front); k.lineTo(PX, TY + front);
      for (let i = n; i >= 0; i--) k.lineTo(PX - jag(i, 1), TY + i * STEP);
      k.lineTo(PX - jag(0, 1), TY - PAD); k.closePath();
    }
    const stubImg = (k, img) => k.drawImage(img, PX - P - EXT, TY - P, img.width / S, img.height / S);
    function stubShadow(k, lift) {
      k.globalAlpha = 0.7 + 0.5 * lift;
      k.drawImage(C.stubAmb, PX - PAD, TY - PAD + 3 + 6 * lift, C.stubAmb.width / S, C.stubAmb.height / S);
      k.globalAlpha = 1 - 0.6 * lift;
      k.drawImage(C.stubCon, PX - PAD, TY - PAD + 1, C.stubCon.width / S, C.stubCon.height / S);
      k.globalAlpha = 1;
    }

    // 附着状态的票根（已在主票面坐标系内）：先画未撕段（直切），再画翻起的一片（带锯齿与自身投影）
    function drawStubOn(k, st) {
      k.save(); k.globalAlpha = st.alpha;
      k.save(); k.translate(0, st.d < 0 ? st.d : 0);
      if (st.front <= 0) stubShadow(k, st.lift);
      k.beginPath(); k.rect(PX, TY + st.front, SW + PAD, TH - st.front + PAD); k.clip();
      if (st.front > 0) stubShadow(k, 0);
      stubImg(k, C.stub);
      k.restore();
      if (st.front > 0) {
        k.save();
        k.translate(PX, TY + st.front + st.d); k.rotate(st.a); k.translate(-PX, -(TY + st.front));
        flapClip(k, st.front); k.clip();
        stubShadow(k, st.lift); stubImg(k, C.stub); fiberEdge(k, st.front, 1, -1);
        k.restore();
      }
      k.restore();
    }
    // 打孔线：未撕段才有，一排小圆孔 + 极淡的折痕
    function perforation(k, front) {
      const y0 = TY + Math.max(front, N) + 2, y1 = TY + TH - N - 2;
      if (y1 <= y0) return;
      k.strokeStyle = 'rgba(150,130,100,0.18)'; k.lineWidth = 0.6;
      k.beginPath(); k.moveTo(PX + 0.5, y0); k.lineTo(PX + 0.5, y1); k.stroke();
      k.fillStyle = PAL.perf;
      for (let y = TY + N + 4; y < y1; y += 5.2) { if (y < y0) continue; k.beginPath(); k.arc(PX, y, 0.95, 0, Math.PI * 2); k.fill(); }
    }
    // 自绘箭头光标：深色填充白描边，按下缩小
    function cursor(k, x, y, down) {
      k.save(); k.translate(x, y); const sc = down ? 0.86 : 1; k.scale(sc, sc);
      k.shadowColor = 'rgba(0,0,0,0.28)'; k.shadowBlur = 4; k.shadowOffsetY = 1.5;
      k.beginPath(); k.moveTo(0, 0); k.lineTo(0, 17); k.lineTo(4.2, 13.2); k.lineTo(7.2, 19.6); k.lineTo(10, 18.4); k.lineTo(7.1, 12.2); k.lineTo(12.4, 12.2); k.closePath();
      k.fillStyle = PAL.ink; k.fill(); k.shadowColor = 'transparent';
      k.strokeStyle = '#fff'; k.lineWidth = 1.4; k.lineJoin = 'round'; k.stroke();
      k.restore();
    }

    // 抓取点在全局坐标中的位置（随票根已撕段与主票面姿态一起动）
    function gripAt(u) {
      const st = stubState(u), m = mainPose(u);
      const p = st.mode === 'on' && st.front > 0 ? torn(st, PX + GRIP.x, TY + GRIP.y) : { x: PX + GRIP.x, y: TY + GRIP.y };
      return mapMain(m, p.x, p.y);
    }
    function cursorAt(u) {
      if (u < T.go0) return { ...REST, down: false };
      if (u < T.go1) { const g = gripAt(T.go1), e = ease((u - T.go0) / (T.go1 - T.go0)); return { x: lerp(REST.x, g.x, e), y: lerp(REST.y, g.y, e), down: false }; }
      if (u < T.drag1) { const g = gripAt(u); return { x: g.x, y: g.y, down: u >= T.press }; }
      const g = gripAt(T.drag1 - 1e-4), e = ease((u - T.back0) / (T.back1 - T.back0));
      return { x: lerp(g.x, REST.x, e), y: lerp(g.y, REST.y, e), down: false };
    }

    const fn = (k, w, h, u) => {
      if (!C) C = build();
      u = ((u % CYC) + CYC) % CYC;
      k.save();
      k.drawImage(C.bg, 0, 0, W, H);
      const m = mainPose(u), st = stubState(u);

      k.save(); applyMain(k, m);
      // 主票面投影
      k.drawImage(C.mainAmb, TX - PAD, TY - PAD + 4, C.mainAmb.width / S, C.mainAmb.height / S);
      k.drawImage(C.mainCon, TX - PAD, TY - PAD + 1, C.mainCon.width / S, C.mainCon.height / S);
      if (st.mode === 'on') drawStubOn(k, st);
      // 主票面：已撕段露出锯齿纤维
      k.save(); mainClip(k, st.front); k.clip();
      k.drawImage(C.main, TX - P, TY - P, C.main.width / S, C.main.height / S);
      k.restore();
      fiberEdge(k, st.front, 0, 1);
      if (st.mode === 'on' && st.alpha >= 1) perforation(k, st.front);
      // 印章：从 1.6 倍落下到 1 倍，命中后停留，再淡出
      const s0 = T.hit - T.stampIn;
      if (u > s0 && u < T.out1) {
        const pin = clamp((u - s0) / T.stampIn), sc = lerp(1.6, 1, pin * pin);
        const a = 0.92 * pin * (1 - clamp((u - T.out0) / (T.out1 - T.out0)));
        k.save(); k.translate(TX + 206, TY + 66); k.rotate(-0.22); k.scale(sc, sc);
        k.globalAlpha = a; k.globalCompositeOperation = 'multiply';
        k.drawImage(C.stamp, -42, -42, 84, 84);
        k.restore();
      }
      k.restore();

      // 掉落中的票根：从撕下那一刻的姿态出发，抛物线下落 + 匀速旋转
      if (st.mode === 'fall') {
        const t = st.t, m0 = mainPose(T.fall), p0 = mapMain(m0, PX, TY + TH + 2);
        k.save();
        k.translate(p0.x + FALL.vx * t, p0.y + 0.5 * FALL.g * t * t);
        k.rotate(m0.ang + TILT + FALL.w * t);
        k.translate(-PX, -(TY + TH));
        flapClip(k, TH); k.clip();
        stubShadow(k, 1); stubImg(k, C.stub); fiberEdge(k, TH, 1, -1);
        k.restore();
      }
      const c = cursorAt(u);
      cursor(k, c.x, c.y, c.down);
      k.restore();
    };
    return fn;
  })();

  // @element 50
  CELLS[49] = (function () {
    'use strict';
    // 碎纸机样稿：左侧文件列表，光标把一行拖进右侧碎纸机，机身震动、纸条卷曲落入纸篓，其余行上移补位，周期末复位。
    const W = 539, H = 208, CYC = 4.8;
    // 配色：沿用 lp 包的冷灰桌面 + 墨蓝字 + 橙色强调，碎纸机用石墨深色压住右侧重心
    const C = {
      bgTop: '#F2F4F8', bgMid: '#E7EAF1', bgBot: '#D6DCE6',
      ink: '#1C2333', sub: '#7D879B', faint: '#DCE1EA', soft: '#F3F5F9',
      paper: '#FFFFFF', paper2: '#F1F3F8', edge: '#C6CDDA',
      acc: '#FF5A2C', accL: '#FFE5DB', blue: '#3B64E8', blueL: '#E8EDFF',
      gTop: '#5E6880', gMid: '#373F53', gBot: '#1D2231', slot: '#07090E',
    };
    const SANS = '-apple-system, "PingFang SC", "Helvetica Neue", sans-serif';
    const TAU = Math.PI * 2;
    const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
    const lerp = (a, b, x) => a + (b - a) * x;
    const P = (t, a, b) => clamp((t - a) / (b - a));
    const eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    const eOut = x => 1 - Math.pow(1 - x, 3);
    const eIn = x => x * x;
    // 确定性哈希：代替 Math.random，保证同一 u 画面一致
    const hash = (i, s) => { const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };
    function rr(k, x, y, w, h, r) {
      k.beginPath(); k.moveTo(x + r, y);
      k.arcTo(x + w, y, x + w, y + h, r); k.arcTo(x + w, y + h, x, y + h, r);
      k.arcTo(x, y + h, x, y, r); k.arcTo(x, y, x + w, y, r); k.closePath();
    }
    // 静态层按 2 倍分辨率预渲染一次；缓存只存不随 u 变化的像素，不算跨帧状态
    const SS = 2, cache = {};
    function sprite(key, w, h, draw) {
      let c = cache[key];
      if (!c) {
        c = document.createElement('canvas'); c.width = Math.ceil(w * SS); c.height = Math.ceil(h * SS);
        const x = c.getContext('2d'); x.scale(SS, SS); draw(x); cache[key] = c;
      }
      return c;
    }

    // 布局：列表面板占左侧约 42% 宽，碎纸机居右偏下，两者之间留出拖拽路径
    const LIST = { x: 26, y: 20, w: 228, h: 168, r: 12 };
    const ROW = { x: 36, y0: 52, h: 30, w: 208 };
    const SHR = { cx: 407, x0: 322, x1: 492, topBack: 84, slotY: 91, topFront: 96, faceBot: 136, binBot: 194 };

    function drawBG(x) {
      const gr = x.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, C.bgTop); gr.addColorStop(0.6, C.bgMid); gr.addColorStop(1, C.bgBot);
      x.fillStyle = gr; x.fillRect(0, 0, W, H);
      const hl = x.createRadialGradient(300, 60, 20, 300, 60, 340);
      hl.addColorStop(0, 'rgba(255,255,255,0.55)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = hl; x.fillRect(0, 0, W, H);
      const vg = x.createRadialGradient(W / 2, H * 0.42, 110, W / 2, H * 0.5, 360);
      vg.addColorStop(0, 'rgba(28,35,51,0)'); vg.addColorStop(1, 'rgba(28,35,51,0.2)');
      x.fillStyle = vg; x.fillRect(0, 0, W, H);
      // 碎纸机地面接触影（机身只做亚像素震动，影子可静态烘焙）
      x.save(); x.translate(SHR.cx, SHR.binBot + 3); x.scale(1, 0.09);
      const sh = x.createRadialGradient(0, 0, 0, 0, 0, 100);
      sh.addColorStop(0, 'rgba(20,26,40,0.42)'); sh.addColorStop(1, 'rgba(20,26,40,0)');
      x.fillStyle = sh; x.beginPath(); x.arc(0, 0, 100, 0, TAU); x.fill(); x.restore();
      drawPanel(x);
    }

    // 列表面板：柔和投影 + 右下厚度层 + 竖向渐变 + 左上高光边
    function drawPanel(x) {
      const { x: px, y: py, w, h, r } = LIST;
      x.save(); x.shadowColor = 'rgba(28,35,51,0.18)'; x.shadowBlur = 18; x.shadowOffsetY = 8;
      rr(x, px + 1.5, py + 3, w, h, r); x.fillStyle = C.edge; x.fill(); x.restore();
      const gr = x.createLinearGradient(0, py, 0, py + h);
      gr.addColorStop(0, C.paper); gr.addColorStop(1, C.paper2);
      rr(x, px, py, w, h, r); x.fillStyle = gr; x.fill();
      const hl = x.createLinearGradient(px, py, px + w * 0.6, py + h * 0.6);
      hl.addColorStop(0, 'rgba(255,255,255,1)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      rr(x, px + 0.75, py + 0.75, w - 1.5, h - 1.5, r - 0.75); x.strokeStyle = hl; x.lineWidth = 1.5; x.stroke();
      x.font = `600 12px ${SANS}`; x.fillStyle = C.ink; x.textAlign = 'left'; x.textBaseline = 'middle';
      x.fillText('项目文件', px + 14, py + 16);
      x.fillStyle = C.faint; x.fillRect(px + 10, py + 29, w - 20, 1);
    }

    // 文件列表：第 TGT 行被拖去粉碎；图标色带区分类型
    const FILES = [
      { name: '需求说明.docx', ext: 'DOC', size: '128 KB', col: '#3B64E8' },
      { name: '季度报表_草稿.pdf', ext: 'PDF', size: '2.4 MB', col: '#FF5A2C' },
      { name: '会议纪要.txt', ext: 'TXT', size: '16 KB', col: '#8A93A6' },
      { name: '旧版设计稿.fig', ext: 'FIG', size: '8.1 MB', col: '#8C5CE6' },
    ];
    const TGT = 1, PITCH = 33;
    const rowY = i => ROW.y0 + i * PITCH;

    // 文件图标：折角纸页 + 类型色带，带轻微厚度
    function icon(x, ix, iy, f) {
      const w = 15, h = 19, fo = 5;
      x.fillStyle = 'rgba(28,35,51,0.12)';
      x.beginPath(); x.moveTo(ix + 1, iy + 1.5); x.lineTo(ix + w - fo + 1, iy + 1.5); x.lineTo(ix + w + 1, iy + fo + 1.5);
      x.lineTo(ix + w + 1, iy + h + 1.5); x.lineTo(ix + 1, iy + h + 1.5); x.fill();
      const gr = x.createLinearGradient(0, iy, 0, iy + h); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(1, '#E9EDF4');
      x.beginPath(); x.moveTo(ix, iy); x.lineTo(ix + w - fo, iy); x.lineTo(ix + w, iy + fo); x.lineTo(ix + w, iy + h); x.lineTo(ix, iy + h); x.closePath();
      x.fillStyle = gr; x.fill(); x.strokeStyle = C.edge; x.lineWidth = 0.8; x.stroke();
      x.fillStyle = C.faint; x.beginPath(); x.moveTo(ix + w - fo, iy); x.lineTo(ix + w - fo, iy + fo); x.lineTo(ix + w, iy + fo); x.fill();
      x.fillStyle = f.col; rr(x, ix - 2, iy + 10, w - 1, 7, 1.5); x.fill();
      x.font = `700 5px ${SANS}`; x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(f.ext, ix - 2 + (w - 1) / 2, iy + 13.7);
    }
    // 行内容精灵（透明底）：图标 + 文件名 + 大小
    function rowSprite(i) {
      const f = FILES[i];
      return sprite('row' + i, ROW.w, ROW.h, x => {
        icon(x, 12, 5, f);
        x.font = `500 11px ${SANS}`; x.fillStyle = C.ink; x.textAlign = 'left'; x.textBaseline = 'middle';
        x.fillText(f.name, 36, ROW.h / 2);
        x.font = `400 9.5px ${SANS}`; x.fillStyle = C.sub; x.textAlign = 'right';
        x.fillText(f.size, ROW.w - 10, ROW.h / 2);
      });
    }
    // 被拖起的卡片：白色底 + 预烘焙柔和投影（避免逐帧 shadowBlur）
    function cardSprite() {
      return sprite('card', ROW.w + 40, ROW.h + 40, x => {
        x.save(); x.shadowColor = 'rgba(28,35,51,0.28)'; x.shadowBlur = 14; x.shadowOffsetY = 6;
        rr(x, 20, 20, ROW.w, ROW.h, 7); x.fillStyle = '#fff'; x.fill(); x.restore();
        const gr = x.createLinearGradient(0, 20, 0, 20 + ROW.h); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(1, '#F2F4F9');
        rr(x, 20, 20, ROW.w, ROW.h, 7); x.fillStyle = gr; x.fill();
        x.strokeStyle = 'rgba(59,100,232,0.35)'; x.lineWidth = 1; x.stroke();
        x.drawImage(rowSprite(TGT), 20, 20, ROW.w, ROW.h);
      });
    }
    // 箭头光标：深色填充 + 白描边，按下时缩小
    function cursor(k, x, y, press) {
      const s = 1.05 * (1 - 0.14 * press);
      k.save(); k.translate(x, y); k.scale(s, s);
      k.shadowColor = 'rgba(0,0,0,0.25)'; k.shadowBlur = 3; k.shadowOffsetY = 1.5;
      k.beginPath(); k.moveTo(0, 0); k.lineTo(0, 16); k.lineTo(4, 12.4); k.lineTo(6.8, 18.6); k.lineTo(9.4, 17.4);
      k.lineTo(6.7, 11.4); k.lineTo(11.6, 11.2); k.closePath();
      k.lineJoin = 'round'; k.lineWidth = 1.6; k.strokeStyle = '#fff'; k.stroke(); k.shadowColor = 'transparent';
      k.fillStyle = C.ink; k.fill(); k.restore();
    }

    // 纸篓窗口：烟色玻璃，纸条在其中可见
    const WINB = { x: SHR.x0 + 18, y: SHR.faceBot + 4, w: SHR.x1 - SHR.x0 - 36, h: SHR.binBot - SHR.faceBot - 14, r: 6 };
    // 纸篓：比机头略窄的石墨箱体，正面开窗（窗内为暗色底，纸条另画）
    function drawBin(x) {
      const bx = SHR.x0 + 7, bw = SHR.x1 - SHR.x0 - 14, by = SHR.faceBot - 4, bh = SHR.binBot - by;
      rr(x, bx + 2, by + 2, bw, bh, 8); x.fillStyle = C.gBot; x.fill();               // 右下厚度层
      const gr = x.createLinearGradient(bx, 0, bx + bw, 0);
      gr.addColorStop(0, '#4A5268'); gr.addColorStop(0.45, '#3A4256'); gr.addColorStop(1, '#262C3C');
      rr(x, bx, by, bw, bh, 8); x.fillStyle = gr; x.fill();
      const hl = x.createLinearGradient(bx, by, bx + bw * 0.5, by + bh);
      hl.addColorStop(0, 'rgba(255,255,255,0.35)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      rr(x, bx + 0.6, by + 0.6, bw - 1.2, bh - 1.2, 7.5); x.strokeStyle = hl; x.lineWidth = 1.2; x.stroke();
      const { x: wx, y: wy, w: ww, h: wh, r } = WINB;
      const wg = x.createLinearGradient(0, wy, 0, wy + wh);
      wg.addColorStop(0, '#10131C'); wg.addColorStop(1, '#1E2433');
      rr(x, wx, wy, ww, wh, r); x.fillStyle = wg; x.fill();
    }
    // 玻璃覆层：斜向反光带 + 内阴影边，盖在纸条之上
    function drawGlass(x) {
      const { x: wx, y: wy, w: ww, h: wh, r } = WINB;
      x.save(); rr(x, wx, wy, ww, wh, r); x.clip();
      x.fillStyle = 'rgba(120,140,190,0.10)'; x.fillRect(wx, wy, ww, wh);
      x.globalCompositeOperation = 'lighter';
      x.fillStyle = 'rgba(255,255,255,0.07)';
      x.beginPath(); x.moveTo(wx + 18, wy); x.lineTo(wx + 52, wy); x.lineTo(wx + 22, wy + wh); x.lineTo(wx - 12, wy + wh); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.04)';
      x.beginPath(); x.moveTo(wx + 60, wy); x.lineTo(wx + 70, wy); x.lineTo(wx + 40, wy + wh); x.lineTo(wx + 30, wy + wh); x.fill();
      x.restore();
      rr(x, wx, wy, ww, wh, r); x.strokeStyle = 'rgba(0,0,0,0.45)'; x.lineWidth = 1.2; x.stroke();
      rr(x, wx - 1, wy - 1, ww + 2, wh + 2, r + 1); x.strokeStyle = 'rgba(255,255,255,0.12)'; x.lineWidth = 0.8; x.stroke();
    }
    // 机头：后窄前宽的顶面（含进纸口暗缝）+ 正面面板（品牌字、指示灯底座）
    function drawHead(x) {
      const { x0, x1, topBack: tb, slotY: sy, topFront: tf, faceBot: fb, cx } = SHR;
      rr(x, x0 + 2, tf - 2, x1 - x0, fb - tf + 5, 9); x.fillStyle = C.gBot; x.fill();   // 厚度
      // 顶面
      const tg = x.createLinearGradient(0, tb, 0, tf);
      tg.addColorStop(0, '#7C869E'); tg.addColorStop(1, '#5A6379');
      x.beginPath(); x.moveTo(x0 + 10, tb); x.lineTo(x1 - 10, tb); x.quadraticCurveTo(x1 - 2, tb, x1, tf);
      x.lineTo(x0, tf); x.quadraticCurveTo(x0 + 2, tb, x0 + 10, tb); x.closePath(); x.fillStyle = tg; x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.4)'; x.lineWidth = 1; x.beginPath(); x.moveTo(x0 + 10, tb + 0.5); x.lineTo(x1 - 10, tb + 0.5); x.stroke();
      // 进纸口：外凹槽 + 暗缝 + 下唇反光
      const sw = 66;
      rr(x, cx - sw - 4, sy - 3.2, sw * 2 + 8, 6.4, 3.2); x.fillStyle = 'rgba(30,36,50,0.55)'; x.fill();
      rr(x, cx - sw, sy - 1.4, sw * 2, 2.8, 1.4); x.fillStyle = C.slot; x.fill();
      x.fillStyle = 'rgba(255,255,255,0.28)'; x.fillRect(cx - sw + 2, sy + 1.9, sw * 2 - 4, 0.7);
      // 正面
      const fg = x.createLinearGradient(0, tf, 0, fb);
      fg.addColorStop(0, C.gTop); fg.addColorStop(0.35, C.gMid); fg.addColorStop(1, '#2A3142');
      rr(x, x0, tf - 2, x1 - x0, fb - tf + 2, 9); x.fillStyle = fg; x.fill();
      x.fillStyle = 'rgba(255,255,255,0.22)'; x.fillRect(x0 + 6, tf - 1, x1 - x0 - 12, 1);   // 顶棱高光
      const sp = x.createRadialGradient(x0 + 40, tf + 6, 0, x0 + 40, tf + 6, 60);             // 镜面光斑
      sp.addColorStop(0, 'rgba(255,255,255,0.20)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = sp; x.fillRect(x0, tf - 2, 120, fb - tf);
      // 正面细分割线与品牌字
      x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(x0 + 8, fb - 9, x1 - x0 - 16, 1);
      x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(x0 + 8, fb - 8, x1 - x0 - 16, 1);
      x.font = `600 10px ${SANS}`; x.textAlign = 'left'; x.textBaseline = 'middle';
      x.fillStyle = 'rgba(255,255,255,0.82)'; x.fillText('安全粉碎', x0 + 16, tf + 17);
      x.font = `500 7px ${SANS}`; x.fillStyle = 'rgba(255,255,255,0.42)'; x.fillText('CROSS-CUT · P-4', x0 + 16, tf + 29);
      // 指示灯底座（灯光逐帧画）
      x.beginPath(); x.arc(x1 - 24, tf + 20, 6.5, 0, TAU); x.fillStyle = '#151924'; x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.18)'; x.lineWidth = 0.8; x.stroke();
    }

    // 时间线（秒）：光标移入 0–0.45 → 按下 0.45–0.6 → 拖拽 0.6–1.55 → 对准松手 1.55–1.7 →
    // 吸入 1.7–2.45（震动 1.7–2.95，灯闪）→ 纸条 1.95–3.9 → 补位 2.05–2.5 → 复位 4.05–4.7 → 静止至 4.8
    const T = { hov: 0.3, grab: 0.45, drag0: 0.6, drag1: 1.55, rel: 1.68, feed0: 1.7, feed1: 2.45,
      up0: 2.05, up1: 2.5, back0: 4.05, back1: 4.45, in0: 4.3, in1: 4.7 };
    const REST = { x: 300, y: 170 };                          // 光标静止点：首尾帧一致
    const CARD_S = 0.6;                                       // 卡片进纸时缩到与进纸口等宽
    const GRIP = { x: -40, y: 2 };                            // 光标抓在卡片中心偏左处
    const rowCenter = () => ({ x: ROW.x + ROW.w / 2, y: rowY(TGT) + ROW.h / 2 });

    // 卡片姿态：返回中心、缩放、旋转；无卡片时返回 null
    function cardPose(u) {
      if (u < T.grab || u > T.feed1) return null;
      const a = rowCenter(), b = { x: SHR.cx, y: SHR.slotY - ROW.h * CARD_S / 2 - 3 };
      if (u < T.drag0) { const q = eOut(P(u, T.grab, T.drag0)); return { x: a.x, y: a.y - 2 * q, s: 1 + 0.03 * q, r: 0 }; }
      if (u < T.drag1) {
        const q = eIO(P(u, T.drag0, T.drag1));
        // 二次贝塞尔：先上抬再落向进纸口
        const mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - 46;
        const x = (1 - q) * (1 - q) * a.x + 2 * q * (1 - q) * mx + q * q * b.x;
        const y = (1 - q) * (1 - q) * (a.y - 2) + 2 * q * (1 - q) * my + q * q * b.y;
        return { x, y, s: lerp(1.03, CARD_S, eIO(q)), r: Math.sin(q * Math.PI) * 0.12 };
      }
      if (u < T.feed0) return { x: b.x, y: b.y, s: CARD_S, r: 0 };
      const q = eIn(P(u, T.feed0, T.feed1));                  // 先慢后快地被吸入
      return { x: b.x, y: b.y + q * (ROW.h * CARD_S + 6), s: CARD_S, r: 0 };
    }
    function cursorPose(u) {
      const a = rowCenter(), g0 = { x: a.x + GRIP.x, y: a.y + GRIP.y };
      if (u < T.grab) { const q = eIO(P(u, 0, T.grab - 0.05)); return { x: lerp(REST.x, g0.x, q), y: lerp(REST.y, g0.y, q), p: 0 }; }
      if (u < T.rel) {
        const c = cardPose(u), p = u < T.drag0 ? P(u, T.grab, T.grab + 0.1) : 1 - P(u, T.drag1 + 0.05, T.rel);
        return { x: c.x + GRIP.x * c.s, y: c.y + GRIP.y * c.s, p };
      }
      const r0 = { x: SHR.cx + GRIP.x * CARD_S, y: SHR.slotY - ROW.h * CARD_S / 2 - 3 + GRIP.y * CARD_S };
      const q = eIO(P(u, T.rel + 0.15, T.rel + 1.0));
      return { x: lerp(r0.x, REST.x, q), y: lerp(r0.y, REST.y, q), p: 0 };
    }

    // 列表：悬停高亮 → 原位留虚线空位 → 下方行上移补位 → 复位时下方行回落、目标行淡入
    function drawRows(k, u) {
      const up = eIO(P(u, T.up0, T.up1)) * (1 - eIO(P(u, T.back0, T.back1)));
      const n = u >= T.up1 - 0.2 && u < T.back0 + 0.2 ? FILES.length - 1 : FILES.length;
      k.font = `500 9.5px ${SANS}`; k.fillStyle = C.sub; k.textAlign = 'right'; k.textBaseline = 'middle';
      k.fillText(n + ' 项', LIST.x + LIST.w - 14, LIST.y + 16);
      k.save(); rr(k, LIST.x, LIST.y + 30, LIST.w, LIST.h - 30, LIST.r); k.clip();
      // 悬停与按住时的行底色
      const hv = P(u, T.hov, T.hov + 0.12) * (1 - P(u, T.grab, T.drag0));
      if (hv > 0) { k.globalAlpha = hv; rr(k, ROW.x, rowY(TGT), ROW.w, ROW.h, 7); k.fillStyle = C.blueL; k.fill(); k.globalAlpha = 1; }
      // 空位虚线：卡片被拿起后出现，补位时被下一行盖过而淡出
      const ph = P(u, T.grab, T.drag0) * (1 - P(u, T.up0, T.up0 + 0.25));
      if (ph > 0) {
        k.globalAlpha = ph; k.setLineDash([3, 3]); k.lineWidth = 1; k.strokeStyle = C.edge;
        rr(k, ROW.x + 0.5, rowY(TGT) + 0.5, ROW.w - 1, ROW.h - 1, 7); k.stroke(); k.setLineDash([]); k.globalAlpha = 1;
      }
      for (let i = 0; i < FILES.length; i++) {
        let y = rowY(i), a = 1, dx = 0;
        if (i === TGT) {
          if (u >= T.grab && u < T.in0) continue;            // 被拖走期间由卡片代替
          if (u >= T.in0) { const q = eOut(P(u, T.in0, T.in1)); a = q; dx = -10 * (1 - q); }
        } else if (i > TGT) y -= PITCH * up;
        k.globalAlpha = a; k.drawImage(rowSprite(i), ROW.x + dx, y, ROW.w, ROW.h);
        // 行间分隔线：最后一行不画；目标行淡入前不画，免得补位时出现悬空细线
        if (i < FILES.length - 1 && !(i === TGT && u < T.in1 && u >= T.grab)) {
          k.fillStyle = 'rgba(220,225,234,0.7)'; k.fillRect(ROW.x + 36 + dx, y + ROW.h + 1.5, ROW.w - 46, 1);
        }
      }
      k.globalAlpha = 1; k.restore();
    }
    function drawCard(k, c, u) {
      k.save();
      if (u >= T.drag1) { k.beginPath(); k.rect(0, 0, W, SHR.slotY + shake(u).y); k.clip(); }
      k.translate(c.x, c.y); k.rotate(c.r); k.scale(c.s, c.s);
      k.drawImage(cardSprite(), -ROW.w / 2 - 20, -ROW.h / 2 - 20, ROW.w + 40, ROW.h + 40);
      k.restore();
    }
    // 震动：起止有包络，频率取整数倍以免出现突变
    function shake(u) {
      const env = P(u, T.feed0, T.feed0 + 0.1) * (1 - P(u, 2.7, 2.95));
      return { x: env * 0.9 * Math.sin(u * 95), y: env * 0.5 * Math.sin(u * 71 + 1.3) };
    }

    // 纸条：每条有出生时刻 tb，按 d = u − tb 解析计算——先从刀口挤出（长度增长），再脱落下坠、卷曲、淡出
    const NS = 15, EXT = 0.34, FALL = 1.15;
    const STRIPS = Array.from({ length: NS }, (_, i) => {
      const r1 = hash(i, 1), r2 = hash(i, 2), r3 = hash(i, 3);
      return {
        x: SHR.cx - 60 + (i + 0.5) * (120 / NS) + (r1 - 0.5) * 3,
        tb: 1.98 + 0.32 * (i % 5) / 5 + r2 * 0.12 + (i % 3) * 0.04,
        len: 26 + r3 * 16, curl: (r1 > 0.5 ? 1 : -1) * (0.9 + r2 * 0.9), drift: (r3 - 0.5) * 18,
        tint: i === 6 || i === 7 ? FILES[TGT].col : null,      // 中间两条带有文件色带的碎片
      };
    });
    function drawStrips(k, u, ox, oy) {
      const { x: wx, y: wy, w: ww, h: wh, r } = WINB;
      k.save(); rr(k, wx + ox, wy + oy, ww, wh, r); k.clip();
      k.lineCap = 'round'; k.lineJoin = 'round';
      const top = SHR.faceBot + oy;
      for (const s of STRIPS) {
        const d = u - s.tb;
        if (d <= 0 || d > EXT + FALL) continue;
        const grow = clamp(d / EXT), fall = Math.max(0, d - EXT);
        const L = s.len * eOut(grow);
        const y0 = top + 0.5 * 120 * fall * fall + 18 * fall;  // 解析抛物下坠
        const x0 = s.x + ox + s.drift * fall;
        const bend = s.curl * (0.15 + 1.6 * fall);             // 脱落后越卷越紧
        const a = 1 - P(fall, FALL * 0.55, FALL);
        if (a <= 0 || L < 1) continue;
        const seg = 9, dl = L / seg;
        let x = x0, y = y0, ang = Math.PI / 2;
        const pts = [[x, y]];
        for (let j = 0; j < seg; j++) { ang += bend * dl / 22 * (0.4 + j / seg); x += Math.cos(ang) * dl; y += Math.sin(ang) * dl; pts.push([x, y]); }
        k.globalAlpha = a;
        // 厚度/背面：略偏移的暗线
        k.strokeStyle = 'rgba(150,160,180,0.9)'; k.lineWidth = 3.4; k.beginPath();
        pts.forEach((p, j) => j ? k.lineTo(p[0] + 0.7, p[1] + 0.5) : k.moveTo(p[0] + 0.7, p[1] + 0.5)); k.stroke();
        k.strokeStyle = s.tint || '#F6F8FC'; k.lineWidth = 2.8; k.beginPath();
        pts.forEach((p, j) => j ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1])); k.stroke();
        // 卷曲受光面：前半段一道细高光
        k.strokeStyle = 'rgba(255,255,255,0.9)'; k.lineWidth = 0.8; k.beginPath();
        for (let j = 0; j < 5; j++) j ? k.lineTo(pts[j][0] - 0.6, pts[j][1] - 0.3) : k.moveTo(pts[j][0] - 0.6, pts[j][1] - 0.3); k.stroke();
      }
      k.globalAlpha = 1; k.restore();
    }

    // 机身合成：纸篓 → 纸条 → 玻璃 → 机头（机头与纸篓一起震动）→ 指示灯
    const MW = SHR.x1 - SHR.x0 + 8, MY0 = SHR.topBack - 2, MH = SHR.binBot - MY0 + 6;
    function drawMachine(k, u) {
      const sk = shake(u), ox = sk.x, oy = sk.y;
      const box = (key, f) => sprite(key, MW, MH, x => { x.translate(-SHR.x0 + 2, -MY0); f(x); });
      k.drawImage(box('bin', drawBin), SHR.x0 - 2 + ox, MY0 + oy, MW, MH);
      drawStrips(k, u, ox, oy);
      k.drawImage(box('glass', drawGlass), SHR.x0 - 2 + ox, MY0 + oy, MW, MH);
      k.drawImage(box('head', drawHead), SHR.x0 - 2 + ox, MY0 + oy, MW, MH);
      // 指示灯：待机为柔和绿；工作期间橙色以 7 Hz 闪动，带外发光
      const lx = SHR.x1 - 24 + ox, ly = SHR.topFront + 20 + oy;
      const on = u >= T.feed0 - 0.05 && u < 3.0;
      const blink = on ? 0.55 + 0.45 * Math.cos((u - T.feed0) * TAU * 7) : 0;
      const col = on ? '255,122,60' : '86,214,140', lv = on ? blink : 0.75;
      const gl = k.createRadialGradient(lx, ly, 0, lx, ly, 15);
      gl.addColorStop(0, `rgba(${col},${0.55 * lv})`); gl.addColorStop(1, `rgba(${col},0)`);
      k.fillStyle = gl; k.fillRect(lx - 15, ly - 15, 30, 30);
      const core = k.createRadialGradient(lx - 1.2, ly - 1.2, 0, lx, ly, 4.2);
      core.addColorStop(0, `rgba(255,255,255,${0.6 + 0.4 * lv})`); core.addColorStop(0.45, `rgba(${col},${0.5 + 0.5 * lv})`); core.addColorStop(1, `rgba(${col},${0.25 + 0.4 * lv})`);
      k.fillStyle = core; k.beginPath(); k.arc(lx, ly, 4.2, 0, TAU); k.fill();
      k.font = `500 7.5px ${SANS}`; k.textAlign = 'right'; k.textBaseline = 'middle';
      k.fillStyle = on ? 'rgba(255,190,160,0.9)' : 'rgba(255,255,255,0.45)';
      k.fillText(on ? '粉碎中' : '待机', lx - 11, ly + 0.5);
    }

    const fn = (k, w, h, u) => {
      u = ((u % CYC) + CYC) % CYC;
      k.drawImage(sprite('bg', W, H, drawBG), 0, 0, W, H);
      drawRows(k, u);
      drawMachine(k, u);
      const c = cardPose(u);
      if (c) drawCard(k, c, u);
      const cp = cursorPose(u);
      cursor(k, cp.x, cp.y, cp.p);
    };
    return fn;
  })();

  // @element 51
  CELLS[50] = (function () {
    // 文件夹弹出便签：桌面中央一个立体文件夹（后片 + 前片分层），光标悬停时前片向前下方翻开，
    // 三张便签卡（色板 / 草图 / 一句话）依次带旋转弹到文件夹上方与两侧并轻轻浮动；光标移开后依次收回、前片合上，复位。
    // 纯函数：画面只由 u 决定；背景、文件夹各片、卡面、阴影块首次调用时按 3 倍分辨率预渲染缓存。
    const W = 539, H = 208, CYC = 4.8;
    const SANS = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif';
    const MONO = '"SF Mono", Menlo, Consolas, monospace';
    const S = 3;   // 缓存分辨率倍数：调用方最多约 2×dpr 放大

    // 配色：lp 包的冷灰桌面 + 朱橙文件夹（取自 lp 差し色 #FF5A2C）+ 墨蓝文字；三张卡用白 / 奶黄 / 浅蓝
    const PAL = {
      bgTop: '#f1f3f7', bgBot: '#dde2ea', vignette: '28,35,51', shadow: '40,30,40',
      backHi: '#e8643a', backLo: '#c9471f', inner: '#a83a1a',
      frontHi: '#ff9566', frontLo: '#f0602e', thick: '#b8441f', tab: '#e25a30',
      sheet: '#fbfaf7', sheetEdge: '#e6e1d8',
      ink: '#1c2333', ink2: '#4a5368', mut: '#7d879b', acc: '#ff5a2c', blue: '#3b64e8',
      cardW: '#ffffff', cardY: '#ffe9a6', cardB: '#dfe7ff'
    };

    // 文件夹几何：后片带左上标签页；前片略宽、顶边低于后片，底边是翻开时的转轴
    const BK = { x: 160, y: 80, w: 220, h: 106, r: 7 };
    const TAB = { x: 170, y: 64, w: 86, h: 20 };
    const FR = { x: 155, y: 97, w: 230, h: 89, r: 8 };
    const GROUND = 186;   // 文件夹底边 / 桌面接触线

    const clamp = (x, a, b) => Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, x));
    const lerp = (a, b, t) => a + (b - a) * t;
    const seg = (u, a, b) => clamp((u - a) / (b - a));
    const eIO = t => (t = clamp(t), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const eOut = t => 1 - Math.pow(1 - clamp(t), 3);
    const eBack = t => { t = clamp(t); const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
    const rgba = (c, a) => 'rgba(' + c + ',' + a + ')';

    // 圆角矩形路径（Safari 兼容：用 arcTo 自绘）；r 可为 [左上, 右上, 右下, 左下]
    function rr(x, X, Y, w, h, r) {
      const q = Array.isArray(r) ? r : [r, r, r, r];
      x.beginPath(); x.moveTo(X + q[0], Y);
      x.arcTo(X + w, Y, X + w, Y + h, q[1]); x.arcTo(X + w, Y + h, X, Y + h, q[2]);
      x.arcTo(X, Y + h, X, Y, q[3]); x.arcTo(X, Y, X + w, Y, q[0]); x.closePath();
    }
    function mk(w, h, draw) {
      const c = document.createElement('canvas'); c.width = Math.ceil(w * S); c.height = Math.ceil(h * S);
      const x = c.getContext('2d'); x.scale(S, S); draw(x); return c;
    }

    // 背景：柔和竖向渐变 + 径向暗角 + 桌面上的一道淡光
    function bgArt(x) {
      const gr = x.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, PAL.bgTop); gr.addColorStop(1, PAL.bgBot);
      x.fillStyle = gr; x.fillRect(0, 0, W, H);
      const sp = x.createRadialGradient(W * 0.5, H * 0.32, 10, W * 0.5, H * 0.32, W * 0.42);
      sp.addColorStop(0, 'rgba(255,255,255,0.55)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = sp; x.fillRect(0, 0, W, H);
      x.save(); x.translate(W / 2, H / 2); x.scale(1, H / W);
      const vg = x.createRadialGradient(0, 0, W * 0.3, 0, 0, W * 0.62);
      vg.addColorStop(0, rgba(PAL.vignette, 0)); vg.addColorStop(1, rgba(PAL.vignette, 0.16));
      x.fillStyle = vg; x.fillRect(-W, -W, W * 2, W * 2); x.restore();
    }

    // 柔影块：把圆角矩形画到画布外，只让 shadow 落在画布内（shadowBlur / offset 不受 transform 影响，需乘 S）
    function blob(w, h, r, blur) {
      const p = blur * 2 + 2;
      return { c: mk(w + p * 2, h + p * 2, x => {
        x.shadowColor = 'rgba(0,0,0,1)'; x.shadowBlur = blur * S; x.shadowOffsetX = 2000 * S;
        x.fillStyle = '#000'; rr(x, p - 2000, p, w, h, r); x.fill();
      }), p: p, w: w, h: h };
    }
    // 后片轮廓：主体 + 左上标签页（标签两侧斜肩，圆角顶）
    function backPath(x) {
      const b = BK, t = TAB;
      x.beginPath();
      x.moveTo(b.x, b.y + b.r);
      x.arcTo(b.x, b.y, b.x + b.r, b.y, b.r);
      x.lineTo(t.x, b.y);
      x.lineTo(t.x + 6, t.y + 4); x.arcTo(t.x + 8, t.y, t.x + 14, t.y, 4);
      x.lineTo(t.x + t.w - 14, t.y); x.arcTo(t.x + t.w - 8, t.y, t.x + t.w - 6, t.y + 4, 4);
      x.lineTo(t.x + t.w, b.y);
      x.arcTo(b.x + b.w, b.y, b.x + b.w, b.y + b.h, b.r);
      x.arcTo(b.x + b.w, b.y + b.h, b.x, b.y + b.h, 3);
      x.arcTo(b.x, b.y + b.h, b.x, b.y, 3);
      x.closePath();
    }
    // 夹在后片与前片之间的两张纸（静态）：一张奶白、一张浅蓝，顶边从前片上沿露出
    function sheetArt(x, cx, top, w, rot, col, edge) {
      x.save(); x.translate(cx, GROUND); x.rotate(rot);
      rr(x, -w / 2, top - GROUND, w, GROUND - top + 6, 3);
      x.fillStyle = col; x.fill(); x.strokeStyle = edge; x.lineWidth = 0.8; x.stroke();
      x.fillStyle = 'rgba(28,35,51,0.10)';
      for (let i = 0; i < 4; i++) x.fillRect(-w / 2 + 12, top - GROUND + 10 + i * 9, (i === 3 ? 0.5 : 0.8) * (w - 24), 2);
      x.restore();
    }
    // 后片（文件夹的内壁）：渐变 + 底部折痕暗部 + 标签页文字 + 左上高光边
    function backArt(x) {
      backPath(x);
      const gr = x.createLinearGradient(0, TAB.y, 0, GROUND);
      gr.addColorStop(0, PAL.backHi); gr.addColorStop(1, PAL.backLo);
      x.fillStyle = gr; x.fill();
      x.save(); backPath(x); x.clip();
      const cr = x.createLinearGradient(0, GROUND - 40, 0, GROUND);
      cr.addColorStop(0, 'rgba(90,20,5,0)'); cr.addColorStop(1, 'rgba(90,20,5,0.38)');
      x.fillStyle = cr; x.fillRect(BK.x, GROUND - 40, BK.w, 40);
      sheetArt(x, 262, 86, 168, -0.025, PAL.sheet, PAL.sheetEdge);
      sheetArt(x, 290, 90, 150, 0.035, '#eef2fb', '#d5dcec');
      x.restore();
      x.fillStyle = 'rgba(255,255,255,0.96)'; x.font = '600 11px ' + SANS; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('设计灵感', TAB.x + TAB.w / 2, TAB.y + 9.5);
      const hl = x.createLinearGradient(BK.x, TAB.y, BK.x + 120, GROUND);
      hl.addColorStop(0, 'rgba(255,255,255,0.75)'); hl.addColorStop(0.6, 'rgba(255,255,255,0)');
      backPath(x); x.strokeStyle = hl; x.lineWidth = 1; x.stroke();
    }

    // 前片（局部坐标 0..FR.w × 0..FR.h，缓存留边 FP 放厚度层）：
    // 右下暗厚度层 + 竖向渐变 + 顶边受光的纸板截面 + 左上镜面光斑 + 压印的小字与文件夹图标
    const FP = 4;
    function frontArt(x) {
      x.translate(FP, FP);
      const w = FR.w, h = FR.h;
      rr(x, 1.5, 2.5, w, h, FR.r); x.fillStyle = PAL.thick; x.fill();
      rr(x, 0, 0, w, h, FR.r);
      const gr = x.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, PAL.frontHi); gr.addColorStop(1, PAL.frontLo);
      x.fillStyle = gr; x.fill();
      x.save(); rr(x, 0, 0, w, h, FR.r); x.clip();
      x.fillStyle = 'rgba(255,236,220,0.9)'; x.fillRect(0, 0, w, 2.2);          // 顶边截面（纸板厚度朝上受光）
      x.fillStyle = 'rgba(150,50,20,0.25)'; x.fillRect(0, 2.2, w, 1);
      const sp = x.createRadialGradient(w * 0.22, -10, 0, w * 0.22, -10, w * 0.6);
      sp.addColorStop(0, 'rgba(255,255,255,0.42)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = sp; x.fillRect(0, 0, w, h);
      const bt = x.createLinearGradient(0, h - 22, 0, h);
      bt.addColorStop(0, 'rgba(120,30,8,0)'); bt.addColorStop(1, 'rgba(120,30,8,0.22)');
      x.fillStyle = bt; x.fillRect(0, h - 22, w, 22);
      x.restore();
      // 压印：左下小标签 + 右下页数
      x.textBaseline = 'alphabetic'; x.textAlign = 'left';
      x.fillStyle = 'rgba(255,255,255,0.92)'; x.font = '700 13px ' + SANS;
      x.fillText('2026 秋季提案', 16, h - 30);
      x.fillStyle = 'rgba(255,255,255,0.7)'; x.font = '500 9.5px ' + SANS;
      x.fillText('品牌视觉 · 共 3 份素材', 16, h - 15);
      x.fillStyle = 'rgba(255,255,255,0.7)'; x.font = '600 9px ' + MONO; x.textAlign = 'right';
      x.fillText('FN-1030', w - 14, h - 15);
      x.strokeStyle = 'rgba(160,50,18,0.35)'; x.lineWidth = 1;                  // 压线：一道横向折痕
      x.beginPath(); x.moveTo(12, 16.5); x.lineTo(w - 12, 16.5); x.stroke();
      x.strokeStyle = 'rgba(255,220,200,0.45)';
      x.beginPath(); x.moveTo(12, 17.5); x.lineTo(w - 12, 17.5); x.stroke();
      const hl = x.createLinearGradient(0, 0, w * 0.5, h);
      hl.addColorStop(0, 'rgba(255,255,255,0.95)'); hl.addColorStop(0.5, 'rgba(255,255,255,0.15)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      rr(x, 0.5, 0.5, w - 1, h - 1, FR.r); x.strokeStyle = hl; x.lineWidth = 1; x.stroke();
    }

    // 三张卡：起点都在文件夹内（前片后面），终点分在左侧 / 上方 / 右侧；rot 为终点旋转，fp 为浮动相位
    const CARDS = [
      { w: 100, h: 76, col: PAL.cardW, ex: 98, ey: 98, rot: -0.17, sx: 236, sy: 174, fp: 0.0 },
      { w: 86, h: 76, col: PAL.cardY, ex: 292, ey: 50, rot: 0.06, sx: 270, sy: 176, fp: 1.9 },
      { w: 110, h: 68, col: PAL.cardB, ex: 444, ey: 100, rot: 0.14, sx: 304, sy: 172, fp: 3.7 }
    ];
    const CP = 3;   // 卡片缓存留边
    // 卡片底材：右下厚度 + 竖向渐变 + 左上镜面 + 左上高光边
    function cardBase(x, c, hi, lo, thick) {
      rr(x, 0.8, 1.2, c.w, c.h, 4); x.fillStyle = thick; x.fill();
      rr(x, 0, 0, c.w, c.h, 4);
      const gr = x.createLinearGradient(0, 0, 0, c.h); gr.addColorStop(0, hi); gr.addColorStop(1, lo);
      x.fillStyle = gr; x.fill();
      x.save(); rr(x, 0, 0, c.w, c.h, 4); x.clip();
      const sp = x.createRadialGradient(c.w * 0.2, -6, 0, c.w * 0.2, -6, c.w * 0.7);
      sp.addColorStop(0, 'rgba(255,255,255,0.6)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = sp; x.fillRect(0, 0, c.w, c.h); x.restore();
      const hl = x.createLinearGradient(0, 0, c.w * 0.5, c.h);
      hl.addColorStop(0, 'rgba(255,255,255,1)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      rr(x, 0.5, 0.5, c.w - 1, c.h - 1, 4); x.strokeStyle = hl; x.lineWidth = 1; x.stroke();
    }
    function label(x, s, X, Y, font, col, al) {
      x.font = font; x.fillStyle = col; x.textAlign = al || 'left'; x.textBaseline = 'alphabetic'; x.fillText(s, X, Y);
    }
    // 卡 1：色板照片卡（白底），五块色样 + 色值
    function card0(x) {
      const c = CARDS[0]; cardBase(x, c, '#ffffff', '#f2f0ec', '#d6d1c8');
      label(x, '秋日色板', 9, 15, '700 9.5px ' + SANS, PAL.ink);
      label(x, '05 色', c.w - 9, 15, '500 7.5px ' + SANS, PAL.mut, 'right');
      const sw = ['#ff5a2c', '#f6b34a', '#e9dcc4', '#3b64e8', '#1c2333'];
      const hex = ['FF5A2C', 'F6B34A', 'E9DCC4', '3B64E8', '1C2333'];
      for (let i = 0; i < 5; i++) {
        const X = 9 + i * 17;
        rr(x, X, 22, 14, 30, 2.5); x.fillStyle = sw[i]; x.fill();
        x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(X + 1, 23, 12, 3);
        x.save(); x.translate(X + 7, 56); x.rotate(-Math.PI / 2);
        label(x, hex[i], -2, 2.5, '500 5.6px ' + MONO, PAL.ink2, 'right'); x.restore();
      }
      label(x, '主色 #FF5A2C', 9, 70, '600 7.5px ' + SANS, PAL.ink2);
    }
    // 卡 2：便利贴（奶黄），铅笔画的 App 首页草图 + 手写式标注
    function card1(x) {
      const c = CARDS[1]; cardBase(x, c, '#fff0b8', '#ffe08a', '#e3bf5a');
      x.fillStyle = 'rgba(255,255,255,0.45)'; x.save(); x.translate(c.w / 2, -1); x.rotate(-0.04);
      x.fillRect(-16, -4, 32, 10); x.restore();                                       // 顶部半透明胶带
      x.strokeStyle = 'rgba(60,52,40,0.78)'; x.lineWidth = 1.1; x.lineJoin = 'round'; x.lineCap = 'round';
      rr(x, 12, 14, 34, 52, 5); x.stroke();                                          // 手机外框
      x.beginPath(); x.moveTo(25, 18); x.lineTo(33, 18); x.stroke();
      x.beginPath(); x.arc(29, 32, 7, 0, Math.PI * 2); x.stroke();                   // 头像圆
      x.beginPath(); x.moveTo(17, 45); x.lineTo(41, 45); x.moveTo(17, 51); x.lineTo(35, 51); x.stroke();
      rr(x, 17, 56, 24, 6, 3); x.fillStyle = 'rgba(255,90,44,0.85)'; x.fill();        // 橙色按钮
      x.strokeStyle = 'rgba(255,90,44,0.9)'; x.lineWidth = 1;                         // 标注箭头
      x.beginPath(); x.moveTo(50, 30); x.quadraticCurveTo(46, 32, 38, 31); x.stroke();
      x.beginPath(); x.moveTo(41, 28.5); x.lineTo(37.5, 31); x.lineTo(41, 33.5); x.stroke();
      label(x, '头像', 52, 33, '600 8px ' + SANS, PAL.ink2);
      label(x, '按钮', 52, 61, '600 8px ' + SANS, PAL.ink2);
      label(x, 'v2', 52, 21, '700 8px ' + MONO, PAL.acc);
      label(x, '首页草图', 52, 47, '700 7.5px ' + SANS, PAL.ink);
    }
    // 卡 3：一句话卡（浅蓝），引号 + 文案 + 署名
    function card2(x) {
      const c = CARDS[2]; cardBase(x, c, '#eef2ff', '#d7e1ff', '#b5c3ef');
      label(x, '\u201C', 8, 26, '700 26px Georgia, serif', PAL.blue);
      label(x, '留白不是空，', 24, 26, '700 11px ' + SANS, PAL.ink);
      label(x, '是给内容呼吸。', 24, 41, '700 11px ' + SANS, PAL.ink);
      x.fillStyle = PAL.blue; x.fillRect(24, 49, 14, 1.4);
      label(x, '林夏 · 10/28 例会', 24, 60, '500 7.5px ' + SANS, PAL.ink2);
    }

    let C = null;   // 预渲染缓存
    function build() {
      const arts = [card0, card1, card2];
      C = {
        bg: mk(W, H, bgArt),
        back: mk(W, H, backArt),
        front: mk(FR.w + FP * 2, FR.h + FP * 2, frontArt),
        cards: CARDS.map((c, i) => mk(c.w + CP * 2, c.h + CP * 2, x => { x.translate(CP, CP); arts[i](x); })),
        cardSoft: CARDS.map(c => blob(c.w, c.h, 5, 7)),     // 卡片悬空时的柔和投影
        cardTight: CARDS.map(c => blob(c.w, c.h, 4, 1.6)),  // 卡片贴身的接触影
        folderSoft: blob(BK.w + 6, 60, 20, 12),             // 文件夹落在桌面上的大投影
        folderTight: blob(FR.w - 4, 4, 2, 2),               // 文件夹底边的接触影
        ground: blob(90, 8, 4, 6)                            // 卡片投到桌面上的椭圆影
      };
    }
    // 把柔影块画在 (cx, cy) 为中心、可旋转缩放的位置
    function drawBlob(k, b, cx, cy, rot, sx, sy, a) {
      k.save(); k.globalAlpha = a; k.translate(cx, cy); k.rotate(rot); k.scale(sx, sy);
      k.drawImage(b.c, -b.w / 2 - b.p, -b.h / 2 - b.p, b.w + b.p * 2, b.h + b.p * 2); k.restore();
    }

    // 时间线（秒）：光标进入 → 前片翻开 → 卡片依次弹出、悬浮 → 光标离开 → 卡片依次收回 → 前片合上并回弹 → 静止
    const T = {
      curIn: [0.25, 0.85], open: [0.72, 1.22], pop0: 0.92, popGap: 0.17, popDur: 0.66,
      curOut: [2.95, 3.55], back0: 3.02, backGap: 0.13, backDur: 0.44, close: [3.6, 4.05], settle: 4.45
    };
    const OPEN_SY = 0.56;   // 前片翻开时的纵向压缩（越小翻得越开）
    const OPEN_WIDEN = 0.1; // 翻开后前片顶边离观者更近，横向放宽的比例
    const OPEN_SKEW = 0.05; // 翻开时整体轻微右斜切，模拟视角偏左上

    // 前片开合量 0..1（合上后带一次衰减回弹，周期末尾回到 0）
    function openAmt(u) {
      if (u < T.open[0]) return 0;
      if (u < T.close[0]) return eBack(seg(u, T.open[0], T.open[1])) ;
      if (u < T.close[1]) return 1 - eIO(seg(u, T.close[0], T.close[1]));
      const d = u - T.close[1];
      return u < T.settle ? 0.07 * Math.abs(Math.sin(d * Math.PI / 0.24)) * Math.exp(-d * 9) : 0;
    }
    // 卡片 i 的状态：q 为出场进度（0 在夹内，1 在终点），float 为悬浮位移的权重
    function cardState(i, u) {
      const c = CARDS[i];
      const t0 = T.pop0 + i * T.popGap, tb = T.back0 + (CARDS.length - 1 - i) * T.backGap;  // 先出的后回
      let qx, qy, sc;
      if (u < tb) {
        const t = seg(u, t0, t0 + T.popDur);
        qy = eBack(seg(t, 0, 0.8)); qx = eBack(seg(t, 0.14, 1)); sc = lerp(0.86, 1, eOut(t));
      } else {
        const q = 1 - eIO(seg(u, tb, tb + T.backDur)); qx = q; qy = q; sc = lerp(0.86, 1, q);
      }
      // x 比 y 晚 14% 起步，路径先竖直冒出再斜飞向终点；悬浮权重随 qx 收放，收回时浮动自然归零
      const flo = clamp(qx);
      const fy = 2.6 * Math.sin((u - t0) * Math.PI * 2 / 1.7 + c.fp) * flo;
      const fr = 0.022 * Math.sin((u - t0) * Math.PI * 2 / 2.3 + c.fp * 1.3) * flo;
      return {
        x: lerp(c.sx, c.ex, qx), y: lerp(c.sy, c.ey, qy) + fy, fy: fy,
        rot: c.rot * qx + fr, sc: sc, vis: u >= t0 && u < tb + T.backDur, q: clamp(qy)
      };
    }

    // 前片：以底边为转轴，按横条切片绘制——纵向压缩 + 越靠上越宽（离观者更近）+ 轻微斜切，近似透视翻开
    const STRIPS = 16;
    function drawFront(k, a) {
      const sy = lerp(1, OPEN_SY, a), cw = FR.w + FP * 2, ch = FR.h + FP * 2, base = FP + FR.h;
      k.save(); k.translate(FR.x + FR.w / 2, GROUND); k.transform(1, 0, OPEN_SKEW * a, 1, 0, 0);
      for (let j = 0; j < STRIPS; j++) {
        const y0 = ch * j / STRIPS, hh = ch / STRIPS;
        const f = 1 + OPEN_WIDEN * a * clamp(1 - (y0 + hh / 2 - FP) / FR.h);
        const dw = cw * f;
        k.drawImage(C.front, 0, y0 * S, cw * S, hh * S, -dw / 2, (y0 - base) * sy, dw, hh * sy + 0.6);
      }
      // 翻开后正面朝向桌面、背离顶光：整体压暗一层，顶端更暗
      if (a > 0.01) {
        const top = -FR.h * sy, tw = FR.w * (1 + OPEN_WIDEN * a);
        const dk = k.createLinearGradient(0, top, 0, 0);
        dk.addColorStop(0, 'rgba(110,30,10,' + (0.26 * a) + ')'); dk.addColorStop(1, 'rgba(110,30,10,' + (0.08 * a) + ')');
        k.fillStyle = dk; k.beginPath();
        k.moveTo(-tw / 2 + 3, top); k.lineTo(tw / 2 - 3, top); k.lineTo(FR.w / 2, 0); k.lineTo(-FR.w / 2, 0); k.closePath(); k.fill();
      }
      k.restore();
    }
    // 箭头光标：白描边深色填充
    function cursor(k, x, y) {
      k.save(); k.translate(x, y); k.scale(1.2, 1.2);
      k.shadowColor = 'rgba(28,35,51,0.3)'; k.shadowBlur = 3; k.shadowOffsetY = 1.5;
      k.beginPath();
      [[0, 0], [0, 16.5], [4.2, 12.6], [7, 19], [9.8, 17.8], [7.1, 11.6], [12.6, 11.6]].forEach((p, i) => i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1]));
      k.closePath(); k.lineJoin = 'round'; k.lineWidth = 1.6; k.strokeStyle = '#fff'; k.fillStyle = PAL.ink;
      k.stroke(); k.shadowColor = 'rgba(0,0,0,0)'; k.fill(); k.stroke(); k.restore();
    }
    const REST = { x: 498, y: 196 }, HOVER = { x: 322, y: 158 };

    const fn = (k, w, h, u) => {
      if (!C) build();
      u = ((u % CYC) + CYC) % CYC;
      k.save();
      k.drawImage(C.bg, 0, 0, W, H);
      const a = openAmt(u);
      const st = CARDS.map((c, i) => cardState(i, u));
      // 桌面投影：文件夹大投影 + 底边接触影（翻开时前片向前探，影子向下长一点）+ 卡片投到桌面的椭圆影
      drawBlob(k, C.folderSoft, W / 2 + 5, GROUND - 6 + 4 * a, 0, 1, 0.42 + 0.12 * a, 0.3);
      drawBlob(k, C.folderTight, W / 2 + 1, GROUND + 0.5 + 2 * a, 0, 1 + 0.06 * a, 1, 0.5);
      st.forEach((s, i) => {
        if (!s.vis) return;
        const c = CARDS[i], hgt = GROUND - (s.y + c.h / 2);
        drawBlob(k, C.ground, s.x + 6 + hgt * 0.12, GROUND + 4, 0, c.w / 90 * (1 + hgt / 160), 1, 0.16 * s.q * clamp(1 - hgt / 200));
      });
      k.drawImage(C.back, 0, 0, W, H);
      // 卡片：在后片与前片之间绘制（出发时被前片挡住），裁到桌面线以上
      k.save(); k.beginPath(); k.rect(0, 0, W, GROUND - 1); k.clip();
      st.forEach((s, i) => {
        if (!s.vis) return;
        const c = CARDS[i], ts = C.cardTight[i];
        const lift = 3 + 7 * s.q - s.fy * 0.6;      // 浮得越高，投影越远越淡
        drawBlob(k, C.cardSoft[i], s.x + 2 + lift * 0.35, s.y + lift, s.rot, s.sc * 1.02, s.sc * 1.02, 0.12 + 0.12 * s.q);
        drawBlob(k, ts, s.x + 0.6, s.y + 1.6, s.rot, s.sc, s.sc, 0.28);
        k.save(); k.translate(s.x, s.y); k.rotate(s.rot); k.scale(s.sc, s.sc);
        k.drawImage(C.cards[i], -c.w / 2 - CP, -c.h / 2 - CP, c.w + CP * 2, c.h + CP * 2); k.restore();
      });
      k.restore();
      // 前片上沿在内壁上的接触暗影（合上时贴着，翻开时随前片顶边下移并变淡）
      const ft = GROUND - FR.h * lerp(1, OPEN_SY, a);
      const ao = k.createLinearGradient(0, ft - 9, 0, ft);
      ao.addColorStop(0, 'rgba(70,15,3,0)'); ao.addColorStop(1, 'rgba(70,15,3,' + (0.3 - 0.12 * a) + ')');
      k.fillStyle = ao; k.fillRect(BK.x + 2, ft - 9, BK.w - 4, 9);
      drawFront(k, a);
      // 光标：从右下进入悬停在前片上，稍后移开回原位
      const ci = eIO(seg(u, T.curIn[0], T.curIn[1])) * (1 - eIO(seg(u, T.curOut[0], T.curOut[1])));
      const dr = Math.sin(seg(u, T.curIn[1], T.curOut[0]) * Math.PI) * 4;   // 悬停时手的轻微漂移
      cursor(k, lerp(REST.x, HOVER.x, ci) + dr, lerp(REST.y, HOVER.y, ci) - dr * 0.4);
      k.restore();
    };
    return fn;
  })();

  // @element 52
  CELLS[51] = (function () {
    // 树状菜单：立体侧边导航面板，左侧竖向主干，菜单项经圆角折线枝杈接到主干。
    // 光标点「产品」→ 子枝杈从主干按长度逐段长出、子项依次淡入；点「案例」→ 主干到该项的路径被一段光沿线点亮；
    // 再点「产品」收起，光标回候场点，末尾静止。纯函数：画面只由 u 决定；背景与面板主体首次调用时预渲染缓存。
    const W = 539, H = 208, CYC = 4.8;
    const SANS = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif';

    // 配色：取 lp 包的墨蓝文字 / 朱橙强调，底色偏冷灰蓝，与白色面板拉开层次
    const PAL = {
      bgTop: '#f3f5f9', bgBot: '#dde3ec', vignette: '28,35,51',
      panHi: '#ffffff', panLo: '#f2f4f8', thick: '#cdd4df', edge: 'rgba(28,35,51,.10)',
      ink: '#1c2333', sub: '#7d879b', faint: '#e3e7ee', trunk: '#cbd2de',
      acc: '#ff5a2c', accDeep: '#e2461d', accL: '#ffe5db', hover: '#eef1f6',
      shadow: '28,35,51', ok: '#2fb67c'
    };

    // 面板几何（约占画宽 47%）
    const PX = 140, PY = 10, PW = 252, PH = 188, PR = 14;
    const S = 3;                                  // 缓存分辨率倍数：调用方最多 2×dpr 放大
    // 树的几何：TX 主干（对准页眉 logo 中心）；BE 一级枝杈终点；ICX 图标中心；LX 一级文字；
    // SX 子菜单在「产品」枝杈上的分叉点；KX 子枝杈终点（接节点圆点）；KLX 子项文字；BR 折角半径
    const TX = 158, TOP = 32, BE = 174, ICX = 182, LX = 196, SX = 166, KX = 197, KLX = 206, BR = 6;
    const ROWL = 171, KROWL = 189, ROWR = 382, RX = 373;   // 行底左右边；RX 右侧数值右对齐线
    const CLIP0 = 38, CLIP1 = 164;                // 列表可视区：展开后被推下去的条目在底部渐隐、被裁掉
    // 一级菜单：y 为收起时的行中心；下标大于 PARENT 的条目展开时被子菜单往下推
    const TOPS = [
      { name: '概览', y: 54, icon: 'grid' },
      { name: '产品', y: 74, icon: 'box' },
      { name: '团队', y: 94, icon: 'user', note: '12' },
      { name: '消息', y: 114, icon: 'chat', badge: '3' },
      { name: '设置', y: 134, icon: 'gear' }
    ];
    const PARENT = 1;
    // 「产品」的子菜单：KY0 起、KSTEP 行距；SHIFT 为展开后下方条目的位移（按子项数量算）
    const KIDS = [
      { name: '定价', note: '¥99 起' },
      { name: '案例', note: '24 篇' },
      { name: '文档', note: 'v3.2' }
    ];
    const KY0 = TOPS[PARENT].y + 18, KSTEP = 18, SHIFT = KIDS.length * KSTEP;
    const PICK = 1;                               // 被点开的子项下标（案例）
    const PY0 = TOPS[PARENT].y, KY = i => KY0 + i * KSTEP;

    // 时间线（秒）：光标路径关键帧 [t, x, y]，点击时刻，展开 / 点亮 / 收起区间
    const REST = [452, 150], AT_PARENT = [214, 77], AT_PICK = [216, KY(PICK) + 3];
    const CUR = [[0.3, REST], [0.95, AT_PARENT], [1.65, AT_PARENT], [2.15, AT_PICK], [3.25, AT_PICK], [3.65, AT_PARENT], [3.95, AT_PARENT], [4.45, REST]];
    const CLICKS = [1.0, 2.25, 3.75];
    const T = {
      open0: 1.05, open1: 1.5,                  // 下方条目下移
      grow0: 1.1, growDur: 0.4, kidGap: 0.13,   // 子枝杈逐条生长
      fade0: 1.36, fadeDur: 0.26,               // 子项淡入（枝杈快长到时开始）
      lit0: 2.3, lit1: 2.88,                    // 光从主干流到「案例」
      close0: 3.8, close1: 4.28                 // 收起
    };

    // 把带圆角的折线采样成点列：每个中间拐点用二次曲线（控制点即拐点）替换，近似圆角
    function sample(pts, r) {
      const out = [pts[0]];
      for (let i = 1; i < pts.length - 1; i++) {
        const a = pts[i - 1], b = pts[i], c = pts[i + 1];
        const d1 = Math.hypot(b[0] - a[0], b[1] - a[1]), d2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
        const r1 = Math.min(r, d1 / 2), r2 = Math.min(r, d2 / 2);
        const p0 = [b[0] - (b[0] - a[0]) / d1 * r1, b[1] - (b[1] - a[1]) / d1 * r1];
        const p2 = [b[0] + (c[0] - b[0]) / d2 * r2, b[1] + (c[1] - b[1]) / d2 * r2];
        for (let s = 0; s <= 6; s++) {
          const t = s / 6, m = 1 - t;
          out.push([m * m * p0[0] + 2 * m * t * b[0] + t * t * p2[0], m * m * p0[1] + 2 * m * t * b[1] + t * t * p2[1]]);
        }
      }
      out.push(pts[pts.length - 1]);
      // 累计长度，供「按长度画出」与「光沿线流动」使用
      const L = [0];
      for (let i = 1; i < out.length; i++) L.push(L[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
      return { p: out, L: L, len: L[L.length - 1] };
    }
    // 只描出 [a, b]（长度）之间的那一段
    function stroke(k, sp, a, b) {
      a = Math.max(0, a); b = Math.min(sp.len, b);
      if (b <= a) return;
      const at = d => {
        let i = 1; while (i < sp.L.length - 1 && sp.L[i] < d) i++;
        const t = (d - sp.L[i - 1]) / ((sp.L[i] - sp.L[i - 1]) || 1);
        return [lerp(sp.p[i - 1][0], sp.p[i][0], t), lerp(sp.p[i - 1][1], sp.p[i][1], t), i];
      };
      const s = at(a), e = at(b);
      k.beginPath(); k.moveTo(s[0], s[1]);
      for (let i = s[2]; i < e[2]; i++) k.lineTo(sp.p[i][0], sp.p[i][1]);
      k.lineTo(e[0], e[1]); k.stroke();
    }
    function pointAt(sp, d) {
      d = clamp(d, 0, sp.len);
      let i = 1; while (i < sp.L.length - 1 && sp.L[i] < d) i++;
      const t = (d - sp.L[i - 1]) / ((sp.L[i] - sp.L[i - 1]) || 1);
      return [lerp(sp.p[i - 1][0], sp.p[i][0], t), lerp(sp.p[i - 1][1], sp.p[i][1], t)];
    }

    const clamp = (x, a, b) => Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, x));
    const P = (t, a, b) => clamp((t - a) / (b - a));
    const eIO = t => (t = clamp(t), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const eOut = t => 1 - Math.pow(1 - clamp(t), 3);
    const lerp = (a, b, t) => a + (b - a) * t;
    const rgba = (c, a) => 'rgba(' + c + ',' + a + ')';

    // 圆角矩形路径：用 arcTo 自己画（Safari 旧版没有原生圆角矩形 API）
    function rr(x, l, t, w, h, r) {
      x.beginPath(); x.moveTo(l + r, t);
      x.arcTo(l + w, t, l + w, t + h, r); x.arcTo(l + w, t + h, l, t + h, r);
      x.arcTo(l, t + h, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath();
    }
    function txt(x, s, px, py, font, col, align) {
      x.font = font; x.fillStyle = col; x.textAlign = align || 'left'; x.textBaseline = 'middle'; x.fillText(s, px, py);
    }

    // 静态层：背景（竖向渐变 + 径向暗角）+ 面板（投影、接触影、厚度、渐变、高光边、镜面光斑）+ 页眉页脚
    let cache = null;
    function buildCache() {
      const c = document.createElement('canvas'); c.width = W * S; c.height = H * S;
      const x = c.getContext('2d'); x.scale(S, S);
      const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, PAL.bgTop); bg.addColorStop(1, PAL.bgBot);
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      const vg = x.createRadialGradient(W / 2, H * 0.45, 60, W / 2, H * 0.5, W * 0.62);
      vg.addColorStop(0, rgba(PAL.vignette, 0)); vg.addColorStop(1, rgba(PAL.vignette, 0.16));
      x.fillStyle = vg; x.fillRect(0, 0, W, H);
      // 柔和投影 + 贴底接触影
      x.save(); x.shadowColor = rgba(PAL.shadow, 0.22); x.shadowBlur = 22; x.shadowOffsetY = 8;
      rr(x, PX, PY, PW, PH, PR); x.fillStyle = PAL.thick; x.fill(); x.restore();
      x.save(); x.shadowColor = rgba(PAL.shadow, 0.28); x.shadowBlur = 5; x.shadowOffsetY = 2;
      rr(x, PX + 6, PY + PH - 8, PW - 12, 8, 4); x.fillStyle = PAL.thick; x.fill(); x.restore();
      // 右下厚度层
      rr(x, PX + 1.5, PY + 2.5, PW, PH, PR); x.fillStyle = PAL.thick; x.fill();
      // 面板正面
      rr(x, PX, PY, PW, PH, PR);
      const pg = x.createLinearGradient(0, PY, 0, PY + PH); pg.addColorStop(0, PAL.panHi); pg.addColorStop(1, PAL.panLo);
      x.fillStyle = pg; x.fill();
      x.strokeStyle = PAL.edge; x.lineWidth = 0.8; x.stroke();
      // 镜面光斑（左上）
      x.save(); rr(x, PX, PY, PW, PH, PR); x.clip();
      const sp = x.createRadialGradient(PX + 40, PY + 6, 0, PX + 40, PY + 6, 120);
      sp.addColorStop(0, 'rgba(255,255,255,.95)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = sp; x.fillRect(PX, PY, PW, PH); x.restore();
      // 左上白高光边
      x.save(); rr(x, PX + 0.8, PY + 0.8, PW - 1.6, PH - 1.6, PR - 0.8); x.clip();
      const hl = x.createLinearGradient(PX, PY, PX + PW * 0.6, PY + PH * 0.6);
      hl.addColorStop(0, 'rgba(255,255,255,1)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      x.strokeStyle = hl; x.lineWidth = 1.6; rr(x, PX + 0.8, PY + 0.8, PW - 1.6, PH - 1.6, PR - 0.8); x.stroke(); x.restore();
      chrome(x);
      return c;
    }

    // 页眉（logo 即树根，主干从它正下方出发）与页脚（当前用户）
    function chrome(x) {
      const ly = 22;
      x.save(); x.shadowColor = rgba('226,70,29', 0.35); x.shadowBlur = 4; x.shadowOffsetY = 1;
      const lg = x.createLinearGradient(TX - 7, ly - 7, TX + 7, ly + 7); lg.addColorStop(0, '#ff8a5c'); lg.addColorStop(1, PAL.accDeep);
      x.beginPath(); x.arc(TX, ly, 7.5, 0, 7); x.fillStyle = lg; x.fill(); x.restore();
      x.beginPath(); x.arc(TX - 2.4, ly - 2.6, 2.6, 0, 7); x.fillStyle = 'rgba(255,255,255,.45)'; x.fill();
      x.strokeStyle = '#fff'; x.lineWidth = 1.4; x.lineCap = 'round';
      x.beginPath(); x.moveTo(TX - 3, ly + 2.5); x.lineTo(TX, ly - 3); x.lineTo(TX + 3, ly + 2.5); x.stroke();
      txt(x, '织云', 172, ly, '700 11.5px ' + SANS, PAL.ink);
      txt(x, '控制台', 197, ly + 0.5, '500 10px ' + SANS, PAL.sub);
      // ⌘K 快捷键小胶囊：凹进去的效果（上暗下亮）
      rr(x, 350, ly - 7, 32, 14, 5); x.fillStyle = '#eef1f5'; x.fill();
      x.strokeStyle = 'rgba(28,35,51,.10)'; x.lineWidth = 0.8; x.stroke();
      txt(x, '⌘K', 366, ly + 0.5, '600 8.5px ' + SANS, PAL.sub, 'center');
      x.fillStyle = PAL.faint; x.fillRect(171, 37.5, 211, 1); x.fillRect(171, 166, 211, 1);
      // 页脚：头像 + 姓名 + 在线状态
      const fy = 182;
      const ag = x.createLinearGradient(0, fy - 8, 0, fy + 8); ag.addColorStop(0, '#5b7cf0'); ag.addColorStop(1, '#3654c9');
      x.beginPath(); x.arc(TX, fy, 8, 0, 7); x.fillStyle = ag; x.fill();
      x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 1.2; x.stroke();
      txt(x, '陈', TX, fy + 0.5, '600 8.5px ' + SANS, '#fff', 'center');
      txt(x, '陈思远', 172, fy - 5, '600 10px ' + SANS, PAL.ink);
      txt(x, '产品设计 · 杭州', 172, fy + 7, '400 8px ' + SANS, PAL.sub);
      x.beginPath(); x.arc(347, fy, 2.6, 0, 7); x.fillStyle = PAL.ok; x.fill();
      txt(x, '在线', 354, fy + 0.5, '500 8.5px ' + SANS, PAL.sub);
    }

    // 线性小图标（约 10px 见方），col 为描边色
    function icon(k, type, cx, cy, col) {
      k.save(); k.strokeStyle = col; k.fillStyle = col; k.lineWidth = 1.25; k.lineCap = 'round'; k.lineJoin = 'round';
      if (type === 'grid') {
        for (let i = 0; i < 4; i++) { rr(k, cx - 4.5 + (i % 2) * 5, cy - 4.5 + (i > 1 ? 5 : 0), 4, 4, 1); k.stroke(); }
      } else if (type === 'box') {
        k.beginPath(); k.moveTo(cx, cy - 5); k.lineTo(cx + 4.5, cy - 2.5); k.lineTo(cx + 4.5, cy + 2.5); k.lineTo(cx, cy + 5);
        k.lineTo(cx - 4.5, cy + 2.5); k.lineTo(cx - 4.5, cy - 2.5); k.closePath(); k.stroke();
        k.beginPath(); k.moveTo(cx - 4.5, cy - 2.5); k.lineTo(cx, cy); k.lineTo(cx + 4.5, cy - 2.5); k.moveTo(cx, cy); k.lineTo(cx, cy + 5); k.stroke();
      } else if (type === 'user') {
        k.beginPath(); k.arc(cx, cy - 2, 2.3, 0, 7); k.stroke();
        k.beginPath(); k.arc(cx, cy + 5, 4.3, Math.PI * 1.1, Math.PI * 1.9); k.stroke();
      } else if (type === 'chat') {
        rr(k, cx - 4.8, cy - 4, 9.6, 7, 2.2); k.stroke();
        k.beginPath(); k.moveTo(cx - 2, cy + 3); k.lineTo(cx - 3, cy + 5.2); k.lineTo(cx + 0.5, cy + 3); k.stroke();
      } else if (type === 'gear') {
        k.beginPath(); k.arc(cx, cy, 2, 0, 7); k.stroke();
        for (let i = 0; i < 6; i++) {
          const a = i * Math.PI / 3; k.beginPath();
          k.moveTo(cx + Math.cos(a) * 3.4, cy + Math.sin(a) * 3.4); k.lineTo(cx + Math.cos(a) * 4.9, cy + Math.sin(a) * 4.9); k.stroke();
        }
        k.beginPath(); k.arc(cx, cy, 3.6, 0, 7); k.stroke();
      }
      k.restore();
    }

    // 光标位置：关键帧之间用 easeInOut 连接
    function cursorAt(u) {
      if (u <= CUR[0][0]) return CUR[0][1];
      for (let i = 1; i < CUR.length; i++) if (u < CUR[i][0]) {
        const a = CUR[i - 1], b = CUR[i], f = eIO((u - a[0]) / (b[0] - a[0]));
        return [lerp(a[1][0], b[1][0], f), lerp(a[1][1], b[1][1], f)];
      }
      return CUR[CUR.length - 1][1];
    }

    // 由 u 解析出整帧状态（不保留跨帧状态）
    function state(u) {
      const cl = eIO(P(u, T.close0, T.close1));
      const open = eIO(P(u, T.open0, T.open1)) * (1 - cl);
      const kids = KIDS.map((_, i) => {
        const g0 = T.grow0 + i * T.kidGap, f0 = T.fade0 + i * T.kidGap;
        const r0 = T.close0 + (KIDS.length - 1 - i) * 0.06;     // 收起时由下往上依次缩回
        return {
          y: KY(i),
          grow: eOut(P(u, g0, g0 + T.growDur)) * (1 - eIO(P(u, r0, r0 + 0.3))),
          a: eOut(P(u, f0, f0 + T.fadeDur)) * (1 - P(u, T.close0, T.close0 + 0.22))
        };
      });
      const litA = 1 - P(u, T.close0 - 0.05, T.close0 + 0.2);
      return {
        open: open, kids: kids, shift: SHIFT * open,
        lit: eIO(P(u, T.lit0, T.lit1)), litA: litA,
        pick: eOut(P(u, T.lit1 - 0.12, T.lit1 + 0.18)) * litA,
        cur: cursorAt(u)
      };
    }

    // 路径缓存：一级枝杈随位移变化每帧采样；子枝杈与点亮路径固定，只采样一次
    const KID_SP = KIDS.map((_, i) => sample([[TX, PY0], [SX, PY0], [SX, KY(i)], [KX, KY(i)]], BR));
    const LIT_SP = sample([[TX, TOP], [TX, PY0], [SX, PY0], [SX, KY(PICK)], [KX, KY(PICK)]], BR);
    const topY = (i, st) => TOPS[i].y + (i > PARENT ? st.shift : 0);

    // 树线：主干 + 一级枝杈 + 按长度生长的子枝杈 + 生长尖端的小光点
    function drawTree(k, st) {
      k.save(); k.lineCap = 'round'; k.lineJoin = 'round'; k.strokeStyle = PAL.trunk; k.lineWidth = 1.5;
      const last = topY(TOPS.length - 1, st);
      k.beginPath(); k.moveTo(TX, TOP); k.lineTo(TX, last - BR); k.stroke();
      for (let i = 0; i < TOPS.length; i++) {
        const y = topY(i, st);
        stroke(k, sample([[TX, y - BR - 1], [TX, y], [BE, y]], BR), 0, 1e9);
      }
      st.kids.forEach((kd, i) => {
        if (kd.grow <= 0) return;
        const sp = KID_SP[i], d = kd.grow * sp.len;
        k.strokeStyle = PAL.trunk; stroke(k, sp, 0, d);
        if (kd.grow < 1) {                       // 生长尖端：暖色小亮点，提示「正在长出来」
          const p = pointAt(sp, d);
          k.fillStyle = rgba('255,90,44', 0.25); k.beginPath(); k.arc(p[0], p[1], 3.6, 0, 7); k.fill();
          k.fillStyle = PAL.acc; k.beginPath(); k.arc(p[0], p[1], 1.6, 0, 7); k.fill();
        }
        // 枝杈到位后末端出现节点圆点
        const na = P(kd.grow, 0.9, 1);
        if (na > 0) {
          k.globalAlpha = na; k.fillStyle = '#fff'; k.beginPath(); k.arc(KX, kd.y, 2.6, 0, 7); k.fill();
          k.strokeStyle = PAL.trunk; k.lineWidth = 1.3; k.stroke(); k.globalAlpha = 1; k.lineWidth = 1.5;
        }
      });
      k.restore();
    }

    // 靠近可视区底边的条目渐隐（被子菜单推下去时自然消失）
    const edgeA = y => clamp((CLIP1 - 6 - y) / 12);
    const hoverOn = (st, y, l) => (st.cur[0] > l && st.cur[0] < ROWR && Math.abs(st.cur[1] - 2 - y) < 8.5) ? 1 : 0;

    // 一级菜单行：悬停底、图标、文字、右侧数值 / 角标 /「产品」的展开箭头
    function drawTops(k, st) {
      for (let i = 0; i < TOPS.length; i++) {
        const it = TOPS[i], y = topY(i, st), a = edgeA(y);
        if (a <= 0) continue;
        k.globalAlpha = a;
        const isP = i === PARENT, hv = hoverOn(st, y, ROWL);
        if (hv || (isP && st.open > 0)) {
          rr(k, ROWL, y - 8.5, ROWR - ROWL, 17, 6);
          k.fillStyle = hv ? PAL.hover : rgba('238,241,246', 0.7 * st.open); k.fill();
        }
        const col = isP && st.open > 0.5 ? PAL.ink : '#4a5368';
        icon(k, it.icon, ICX, y, isP ? (st.open > 0.5 ? PAL.acc : '#6b7488') : '#6b7488');
        txt(k, it.name, LX, y + 0.5, (isP ? '600 ' : '500 ') + '10.5px ' + SANS, col);
        if (it.note) txt(k, it.note, RX, y + 0.5, '500 9px ' + SANS, PAL.sub, 'right');
        if (it.badge) {
          rr(k, RX - 14, y - 6, 15, 12, 6); k.fillStyle = PAL.acc; k.fill();
          txt(k, it.badge, RX - 6.5, y + 0.5, '700 8px ' + SANS, '#fff', 'center');
        }
        if (isP) {                                // 箭头：收起朝右，展开朝下
          k.save(); k.translate(RX - 3, y); k.rotate(st.open * Math.PI / 2);
          k.strokeStyle = PAL.sub; k.lineWidth = 1.3; k.lineCap = 'round'; k.lineJoin = 'round';
          k.beginPath(); k.moveTo(-1.5, -3); k.lineTo(1.5, 0); k.lineTo(-1.5, 3); k.stroke(); k.restore();
        }
      }
      k.globalAlpha = 1;
    }

    // 子菜单行：依次淡入并略微右移就位；被选中的「案例」有强调色浅底、左侧色条、文字变色
    function drawKids(k, st) {
      // 子菜单托盘：凹进面板的一块浅槽（上沿暗线 + 下沿白线），随展开淡入并向下撑开
      if (st.open > 0) {
        const t0 = KY0 - 10, th = (SHIFT - 2) * st.open;
        k.save(); k.globalAlpha = st.open;
        rr(k, ROWL, t0, ROWR - ROWL, th, 7);
        const tg = k.createLinearGradient(0, t0, 0, t0 + SHIFT); tg.addColorStop(0, '#e4e9f1'); tg.addColorStop(1, '#edf0f5');
        k.fillStyle = tg; k.fill();
        k.clip();
        k.fillStyle = 'rgba(28,35,51,.08)'; k.fillRect(ROWL, t0, ROWR - ROWL, 1.2);
        k.fillStyle = 'rgba(255,255,255,.9)'; k.fillRect(ROWL, t0 + th - 1, ROWR - ROWL, 1);
        k.restore();
      }
      st.kids.forEach((kd, i) => {
        if (kd.a <= 0) return;
        const y = kd.y, dx = (1 - kd.a) * -6;
        k.globalAlpha = kd.a;
        const sel = i === PICK ? st.pick : 0, hv = hoverOn(st, y, KROWL);
        if (hv && sel < 1) { rr(k, KROWL, y - 8, ROWR - KROWL, 16, 6); k.fillStyle = PAL.hover; k.fill(); }
        if (sel > 0) {                            // 选中：实心强调色药丸（竖向渐变 + 顶部高光 + 投影）
          k.save(); k.globalAlpha = kd.a * sel;
          k.shadowColor = rgba('226,70,29', 0.35); k.shadowBlur = 6; k.shadowOffsetY = 2;
          const sg = k.createLinearGradient(0, y - 8, 0, y + 8); sg.addColorStop(0, '#ff7646'); sg.addColorStop(1, PAL.accDeep);
          rr(k, KROWL, y - 8, ROWR - KROWL, 16, 6); k.fillStyle = sg; k.fill(); k.restore();
          k.globalAlpha = kd.a * sel * 0.5; k.fillStyle = '#fff'; k.fillRect(KROWL + 6, y - 7.5, ROWR - KROWL - 12, 0.8);
          k.globalAlpha = kd.a;
        }
        const on = sel > 0.5;
        txt(k, KIDS[i].name, KLX + dx, y + 0.5, (on ? '600 ' : '500 ') + '10px ' + SANS, on ? '#fff' : '#4a5368');
        txt(k, KIDS[i].note, RX - 6 + dx, y + 0.5, '500 8.5px ' + SANS, on ? 'rgba(255,255,255,.85)' : PAL.sub, 'right');
      });
      k.globalAlpha = 1;
    }

    // 点亮路径：已走过的部分是强调色细线 + 柔光，前端是一段更亮的光头（带拖尾）沿线流过去
    function drawLit(k, st, u) {
      if (st.lit <= 0 || st.litA <= 0) return;
      const sp = LIT_SP, d = st.lit * sp.len;
      k.save(); k.lineCap = 'round'; k.lineJoin = 'round'; k.globalAlpha = st.litA;
      k.strokeStyle = rgba('255,90,44', 0.18); k.lineWidth = 5; stroke(k, sp, 0, d);
      k.strokeStyle = PAL.acc; k.lineWidth = 1.7; stroke(k, sp, 0, d);
      if (st.lit < 1) {
        // 拖尾：由暗到亮分 6 段叠画
        for (let j = 0; j < 6; j++) {
          k.strokeStyle = rgba('255,200,170', 0.15 + j * 0.13); k.lineWidth = 2.2 + j * 0.15;
          stroke(k, sp, d - 30 + j * 5, d - 24 + j * 5);
        }
        const p = pointAt(sp, d);
        const hg = k.createRadialGradient(p[0], p[1], 0, p[0], p[1], 9);
        hg.addColorStop(0, 'rgba(255,255,255,1)'); hg.addColorStop(0.3, 'rgba(255,140,90,.8)'); hg.addColorStop(1, 'rgba(255,90,44,0)');
        k.fillStyle = hg; k.beginPath(); k.arc(p[0], p[1], 9, 0, 7); k.fill();
      }
      // 到达后：节点圆点填充强调色，并放出一圈扩散环
      if (st.lit >= 1) {
        const y = KY(PICK);
        k.fillStyle = PAL.acc; k.beginPath(); k.arc(KX, y, 3, 0, 7); k.fill();
        k.fillStyle = '#fff'; k.beginPath(); k.arc(KX, y, 1.1, 0, 7); k.fill();
        const r = P(u, T.lit1, T.lit1 + 0.5);
        if (r > 0 && r < 1) {
          k.strokeStyle = rgba('255,90,44', 0.5 * (1 - r)); k.lineWidth = 1.2;
          k.beginPath(); k.arc(KX, y, 3 + eOut(r) * 9, 0, 7); k.stroke();
        }
      }
      k.restore();
    }

    // 点击涟漪：每次点击在光标尖端放出一圈淡环
    function drawRipples(k, u) {
      CLICKS.forEach(t => {
        const r = P(u, t, t + 0.45);
        if (r <= 0 || r >= 1) return;
        const p = cursorAt(t);
        k.strokeStyle = rgba('28,35,51', 0.28 * (1 - r)); k.lineWidth = 1.2;
        k.beginPath(); k.arc(p[0], p[1], 3 + eOut(r) * 12, 0, 7); k.stroke();
      });
    }

    // 箭头光标：深色填充 + 白描边 + 柔和投影；按下时缩到 0.86
    function drawCursor(k, st, u) {
      let press = 0;
      CLICKS.forEach(t => { press = Math.max(press, Math.sin(Math.PI * P(u, t - 0.06, t + 0.12))); });
      const s = 1 - 0.14 * press;
      k.save(); k.translate(st.cur[0], st.cur[1]); k.scale(s, s);
      k.beginPath(); k.moveTo(0, 0); k.lineTo(0, 14.5); k.lineTo(3.6, 11.2); k.lineTo(6.2, 17); k.lineTo(8.6, 16);
      k.lineTo(6.1, 10.3); k.lineTo(10.8, 10.3); k.closePath();
      k.shadowColor = 'rgba(0,0,0,.28)'; k.shadowBlur = 4; k.shadowOffsetY = 1.5;
      k.fillStyle = PAL.ink; k.fill(); k.shadowColor = 'transparent';
      k.strokeStyle = '#fff'; k.lineWidth = 1.3; k.lineJoin = 'round'; k.stroke();
      k.restore();
    }

    const fn = (k, w, h, u) => {
      u = ((u % CYC) + CYC) % CYC;
      if (!cache) cache = buildCache();
      k.drawImage(cache, 0, 0, W, H);
      const st = state(u);
      k.save(); k.beginPath(); k.rect(PX, CLIP0, PW, CLIP1 - CLIP0); k.clip();
      drawTops(k, st);
      drawKids(k, st);
      drawTree(k, st);
      drawLit(k, st, u);
      k.restore();
      drawRipples(k, u);
      drawCursor(k, st, u);
    };
    return fn;
  })();

  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});
