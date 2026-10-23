/* Motion Prompt · pack "ui" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt */
MotionPrompt.pack('ui', function () {
  // @kit
  // UIパーツの名前 24（カード 542x191 = 元動画のカード窓 542x222 から窓の上枠 31px を除いた中身）。
  // 各コマは時間 u の純関数。1周期 CYC=4.5秒。カーソル（指）の動きがきっかけで部品が動く。
  const CW = 542, CH = 191, CYC = 4.5;

  // パックの色（地・文字・差し色）
  const C = {
    bg: '#f5f3f1', card: '#ffffff', border: '#dcdbdb', dot: '#dddddd', url: '#eeeeeb', sep: '#ecebe9',
    line: '#e6e4e3', line2: '#d6d4d2', block: '#f0efed', ink: '#111111', en: '#7b7975', hint: '#868482',
    blue: '#1f5ae8', lb: '#eef3fe', mb: '#cad9f9', sb: '#a3bef7', scroll: '#c9c7c5', dark: '#26282c'
  };
  const JP = '"Hiragino Sans","Hiragino Kaku Gothic ProN",sans-serif';
  const NUMF = 'system-ui,-apple-system,"Helvetica Neue",sans-serif';

  // 描画の補助関数は元のまま X（2D コンテキスト）に描く。ui() が毎回 X を渡された k に向け、白地を敷いてから描く
  let X = null;
  const ui = draw => (k, w, h, u) => { X = k; k.fillStyle = C.card; k.fillRect(0, 0, w, h); draw(w, h, u); };

  // ---------- helpers ----------
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const eo = x => 1 - Math.pow(1 - x, 3);
  const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const lerp = (a, b, k) => a + (b - a) * k;
  function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); X.beginPath(); X.moveTo(x + r, y); X.arcTo(x + w, y, x + w, y + h, r); X.arcTo(x + w, y + h, x, y + h, r); X.arcTo(x, y + h, x, y, r); X.arcTo(x, y, x + w, y, r); X.closePath(); }
  function fillRR(x, y, w, h, r, c) { rr(x, y, w, h, r); X.fillStyle = c; X.fill(); }
  function strokeRR(x, y, w, h, r, c, lw = 1.5) { rr(x, y, w, h, r); X.strokeStyle = c; X.lineWidth = lw; X.stroke(); }
  function bar(x, y, w, c = C.line, h = 9) { fillRR(x, y, w, h, h / 2, c); }
  function text(s, x, y, size, color, weight = 500, align = 'left', font = JP) { X.font = `${weight} ${size}px ${font}`; X.fillStyle = color; X.textAlign = align; X.textBaseline = 'middle'; X.fillText(s, x, y); }
  function tw(s, size, weight = 500, font = JP) { X.font = `${weight} ${size}px ${font}`; return X.measureText(s).width; }
  function circle(x, y, r, c) { X.beginPath(); X.arc(x, y, r, 0, Math.PI * 2); X.fillStyle = c; X.fill(); }
  function ring(x, y, r, c, lw = 2) { X.beginPath(); X.arc(x, y, r, 0, Math.PI * 2); X.strokeStyle = c; X.lineWidth = lw; X.stroke(); }
  function shadowed(fn, blur = 18, oy = 6, a = .14) { X.save(); X.shadowColor = `rgba(20,24,40,${a})`; X.shadowBlur = blur; X.shadowOffsetY = oy; fn(); X.restore(); }
  function chevron(x, y, s, rot, c, lw = 2.2) { X.save(); X.translate(x, y); X.rotate(rot); X.beginPath(); X.moveTo(-s, -s / 2); X.lineTo(0, s / 2); X.lineTo(s, -s / 2); X.strokeStyle = c; X.lineWidth = lw; X.lineCap = 'round'; X.lineJoin = 'round'; X.stroke(); X.restore(); }
  function check(x, y, s, c, lw = 2.6) { X.beginPath(); X.moveTo(x - s, y); X.lineTo(x - s * .3, y + s * .7); X.lineTo(x + s, y - s * .7); X.strokeStyle = c; X.lineWidth = lw; X.lineCap = 'round'; X.lineJoin = 'round'; X.stroke(); }
  function mountains(x, y, w, h, tint = 0) {
    X.save(); rr(x, y, w, h, 8); X.clip();
    X.fillStyle = tint ? '#e3ebfd' : C.lb; X.fillRect(x, y, w, h);
    X.fillStyle = C.mb; X.beginPath(); X.moveTo(x, y + h); X.lineTo(x + w * .28, y + h * .42); X.lineTo(x + w * .5, y + h * .72); X.lineTo(x + w * .72, y + h * .35); X.lineTo(x + w, y + h * .8); X.lineTo(x + w, y + h); X.fill();
    X.fillStyle = C.sb; X.beginPath(); X.moveTo(x + w * .3, y + h); X.lineTo(x + w * .55, y + h * .62); X.lineTo(x + w * .8, y + h); X.fill();
    circle(x + w * .82, y + h * .26, Math.min(w, h) * .09, C.mb);
    X.restore();
  }
  // カーソル（矢印）。keys=[[t,x,y],...]、clicks=[t,...]
  function track(keys, t) {
    if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
    for (let i = 1; i < keys.length; i++) { const a = keys[i - 1], b = keys[i]; if (t <= b[0]) { const k = eio((t - a[0]) / (b[0] - a[0] || 1)); return [lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; } }
    const l = keys[keys.length - 1]; return [l[1], l[2]];
  }
  function ripple(x, y, clicks, t) {
    for (const c of clicks) { const k = (t - c) / .45; if (k >= 0 && k <= 1) { ring(x, y, 7 + 22 * eo(k), `rgba(31,90,232,${.75 * (1 - k)})`, 3); } }
  }
  function pointer(keys, clicks, t) {
    const [x, y] = track(keys, t);
    ripple(x, y, clicks, t);
    const pressed = clicks.some(c => t >= c - .07 && t < c + .1);
    X.save(); X.translate(x, y); const s = pressed ? 1.0 : 1.18; X.scale(s, s);
    X.beginPath(); X.moveTo(0, 0); X.lineTo(0, 22); X.lineTo(5.5, 17); X.lineTo(9.5, 26); X.lineTo(13, 24.5); X.lineTo(9, 15.8); X.lineTo(16, 15.8); X.closePath();
    X.lineJoin = 'round'; X.strokeStyle = '#fff'; X.lineWidth = 3; X.stroke(); X.fillStyle = '#111'; X.fill();
    X.restore();
  }
  function finger(keys, downs, t, visible) {
    if (!visible) return; const [x, y] = track(keys, t);
    ripple(x, y, downs, t);
    circle(x, y, 17, 'rgba(17,17,17,.24)'); ring(x, y, 17, 'rgba(255,255,255,.95)', 2.5);
  }
  // よく使う背景のワイヤーフレーム
  function pageLines(x, y, w) { bar(x, y, w * .45, C.line2, 11); bar(x, y + 24, w, C.line); bar(x, y + 42, w * .78, C.line); }
  const CELLS = [];

  // @element 01
  // 01 モーダル（Modal dialog）
  CELLS[0] = ui((w, h, t) => {
    pageLines(24, 18, 494);
    fillRR(24, 92, 120, 36, 8, C.blue); text('開く', 84, 110, 16, '#fff', 600, 'center');
    fillRR(170, 92, 348, 36, 8, C.block); fillRR(24, 142, 494, 38, 8, C.block);
    const a = eo(seg(t, 1.0, 1.32)) * (1 - eio(seg(t, 3.3, 3.58)));
    if (a > 0) {
      X.fillStyle = `rgba(18,20,28,${.42 * a})`; X.fillRect(0, 0, w, h);
      X.save(); X.globalAlpha = a; X.translate(271, 97); const s = .9 + .1 * a; X.scale(s, s);
      shadowed(() => fillRR(-140, -70, 280, 140, 12, '#fff'), 24, 8, .25);
      bar(-116, -48, 120, C.ink, 11); bar(-116, -20, 232); bar(-116, -2, 180);
      fillRR(28, 26, 88, 30, 7, C.blue);
      X.strokeStyle = '#9a9896'; X.lineWidth = 2.2; X.lineCap = 'round'; X.beginPath(); X.moveTo(110, -54); X.lineTo(120, -44); X.moveTo(120, -54); X.lineTo(110, -44); X.stroke();
      X.restore();
    }
    pointer([[.3, w + 30, h + 30], [.95, 86, 114], [1.5, 86, 114], [3.0, 389, 50], [3.5, 389, 50], [4.2, w + 30, h + 30]], [1.0, 3.3], t);
  });

  // @element 02
  // 02 ドロワー（Drawer (Off-canvas)）
  CELLS[1] = ui((w, h, t) => {
    strokeRR(24, 14, 110, 34, 8, C.line2, 1.5); text('メニュー', 79, 31, 15, '#555', 600, 'center');
    bar(160, 26, 140, C.line2, 11); pageLines(24, 70, 494); fillRR(24, 138, 494, 42, 8, C.block);
    const a = eo(seg(t, 1.0, 1.38)) * (1 - eio(seg(t, 3.3, 3.65)));
    if (a > 0) {
      X.fillStyle = `rgba(18,20,28,${.36 * a})`; X.fillRect(0, 0, w, h);
      const pw = 210, px = -pw + pw * a;
      shadowed(() => { X.fillStyle = '#fff'; X.fillRect(px, 0, pw, h); }, 22, 0, .25);
      circle(px + 34, 32, 14, C.mb); bar(px + 58, 27, 100, C.line2, 10);
      for (let i = 0; i < 4; i++) { const y = 62 + i * 32; if (i === 0) fillRR(px + 12, y - 2, pw - 24, 28, 6, C.lb); fillRR(px + 22, y + 5, 14, 14, 3, i === 0 ? C.blue : C.line2); bar(px + 46, y + 7, 90 + (i % 2) * 30, i === 0 ? C.sb : C.line); }
    }
    pointer([[.3, w + 30, h + 30], [.95, 70, 34], [1.6, 70, 34], [3.0, 420, 120], [3.6, 420, 120], [4.2, w + 30, h + 30]], [1.0, 3.3], t);
  });

  // @element 03
  // 03 ボトムシート（Bottom sheet）
  CELLS[2] = ui((w, h, t) => {
    pageLines(24, 16, 494); fillRR(24, 76, 239, 54, 8, C.block); fillRR(279, 76, 239, 54, 8, C.block);
    fillRR(186, 144, 170, 36, 18, C.blue); text('詳細を見る', 271, 162, 15, '#fff', 600, 'center');
    const open = eo(seg(t, 1.05, 1.45));
    const drag = eio(seg(t, 3.0, 3.6));
    const a = open * (1 - drag);
    if (open > 0 && a > 0.001) {
      X.fillStyle = `rgba(18,20,28,${.36 * a})`; X.fillRect(0, 0, w, h);
      const sh = 136, sy = h - sh * a;
      shadowed(() => { rr(0, sy, w, sh + 20, 18); X.fillStyle = '#fff'; X.fill(); }, 22, -4, .2);
      fillRR(w / 2 - 26, sy + 10, 52, 6, 3, C.line2);
      bar(28, sy + 30, 160, C.ink, 11);
      for (let i = 0; i < 2; i++) { const y = sy + 56 + i * 36; fillRR(28, y, 26, 26, 6, i ? C.mb : C.blue); bar(66, y + 4, 220, C.line); bar(66, y + 17, 140, C.line, 7); }
    }
    const sy = h - 136 * a;
    finger([[.3, 271, 162], [1.6, 271, 162], [2.75, w / 2, h - 136 + 13], [3.0, w / 2, h - 136 + 13], [3.6, w / 2, h + 10]], [1.0, 3.0], t, (t > .6 && t < 1.6) || (t > 2.75 && t < 3.6));
  });

  // @element 04
  // 04 アコーディオン（Accordion）
  CELLS[3] = ui((w, h, t) => {
    const ex = eio(seg(t, 1.0, 1.35)) * (1 - eio(seg(t, 3.3, 3.62)));
    let y = 12; const H0 = 34, EX = 58;
    for (let i = 0; i < 3; i++) {
      const extra = i === 0 ? EX * ex : 0;
      strokeRR(24, y, 494, H0 + extra, 8, i === 0 && ex > .05 ? C.sb : C.line2, 1.5);
      bar(42, y + 12, [180, 220, 150][i], i === 0 && ex > .05 ? C.blue : C.line2, 10);
      chevron(494, y + 17, 6, i === 0 ? Math.PI * ex : 0, i === 0 && ex > .05 ? C.blue : '#9a9896');
      if (i === 0 && ex > 0) { X.save(); rr(24, y, 494, H0 + extra, 8); X.clip(); X.globalAlpha = ex; bar(42, y + H0 + 6, 420); bar(42, y + H0 + 24, 320); X.restore(); }
      y += H0 + extra + 6;
    }
    pointer([[.3, w + 30, h + 30], [.95, 300, 31], [1.6, 300, 31], [3.0, 300, 31], [3.55, 300, 31], [4.2, w + 30, h + 30]], [1.0, 3.3], t);
  });

  // @element 05
  // 05 ドロップダウン（Dropdown menu）
  CELLS[4] = ui((w, h, t) => {
    bar(24, 14, 90, C.line2, 10);
    const open = eo(seg(t, 1.0, 1.25)) * (1 - eio(seg(t, 2.3, 2.45)));
    const chosen = seg(t, 2.32, 2.42) * (1 - seg(t, 3.9, 4.08));
    const ph = (1 - seg(t, 2.2, 2.3)) + seg(t, 4.1, 4.3); // プレースホルダーは先に消し、名前が消えてから戻す（重ねない）
    strokeRR(24, 34, 260, 38, 8, open > .1 || (chosen > 0 && t < 2.9) ? C.blue : C.line2, open > .1 ? 2 : 1.5);
    if (ph > 0) { X.globalAlpha = clamp(ph); text('選択してください', 40, 53, 15, '#9a9896', 500); X.globalAlpha = 1; }
    if (chosen > 0) { X.globalAlpha = chosen; text('名古屋', 40, 53, 16, C.ink, 600); X.globalAlpha = 1; }
    chevron(262, 52, 5, Math.PI * open, '#777');
    fillRR(310, 34, 208, 70, 8, C.block); bar(310, 120, 208); bar(310, 138, 160); bar(24, 150, 200); bar(24, 168, 150);
    if (open > 0) {
      X.save(); X.globalAlpha = open; const oy = 78 - 6 * (1 - open);
      shadowed(() => fillRR(24, oy, 260, 112, 8, '#fff'), 18, 6, .18); strokeRR(24, oy, 260, 112, 8, C.border, 1);
      const hi = seg(t, 1.55, 1.75) > 0 ? (t < 1.95 ? 1 : 2) : -1;
      ['東京', '大阪', '名古屋', '福岡'].forEach((s, i) => { const yy = oy + 4 + i * 26; if (i === hi + (hi === 1 ? 0 : 0) && hi >= 0) fillRR(28, yy, 252, 26, 5, C.lb); text(s, 40, yy + 13, 15, i === hi ? C.blue : '#444', i === hi ? 600 : 500); });
      X.restore();
    }
    pointer([[.3, w + 30, h + 30], [.95, 200, 56], [1.25, 200, 56], [1.6, 170, 121], [2.0, 170, 147], [2.45, 170, 147], [3.2, 170, 147], [4.2, w + 30, h + 30]], [1.0, 2.3], t);
  });

  // @element 06
  // 06 ツールチップ（Tooltip）
  CELLS[5] = ui((w, h, t) => {
    pageLines(24, 16, 494);
    bar(24, 116, 150, C.line2, 11); ring(196, 121, 13, C.blue, 2.2); text('?', 196, 122, 16, C.blue, 700, 'center', NUMF);
    fillRR(24, 146, 494, 34, 8, C.block);
    const a = eo(seg(t, 1.15, 1.35)) * (1 - seg(t, 3.25, 3.45));
    if (a > 0) {
      X.save(); X.globalAlpha = a; const yy = 64 + 6 * (1 - a);
      fillRR(196 - 92, yy, 184, 36, 8, C.dark);
      X.beginPath(); X.moveTo(196 - 8, yy + 36); X.lineTo(196, yy + 44); X.lineTo(196 + 8, yy + 36); X.fillStyle = C.dark; X.fill();
      text('小さな説明が出る', 196, yy + 18, 15, '#fff', 600, 'center'); X.restore();
    }
    // 乗せるだけ（クリックしない）
    pointer([[.3, w + 30, h + 30], [1.05, 200, 126], [3.15, 200, 126], [4.1, w + 30, h + 30]], [], t);
  });

  // @element 07
  // 07 ポップオーバー（Popover）
  CELLS[6] = ui((w, h, t) => {
    pageLines(24, 16, 494);
    strokeRR(24, 112, 108, 36, 8, C.blue, 2); text('詳細', 78, 130, 15, C.blue, 600, 'center');
    fillRR(24, 160, 494, 22, 6, C.block);
    const a = eo(seg(t, 1.0, 1.28)) * (1 - eio(seg(t, 3.3, 3.5)));
    if (a > 0) {
      X.save(); X.globalAlpha = a; X.translate(6 * (1 - a), 0);
      const px = 156, py = 62, pw = 300, ph = 120;
      shadowed(() => { fillRR(px, py, pw, ph, 10, '#fff'); }, 22, 6, .2); strokeRR(px, py, pw, ph, 10, C.border, 1);
      X.beginPath(); X.moveTo(px + 1, 122); X.lineTo(px - 10, 130); X.lineTo(px + 1, 138); X.fillStyle = '#fff'; X.fill();
      X.beginPath(); X.moveTo(px, 122); X.lineTo(px - 10, 130); X.lineTo(px, 138); X.strokeStyle = C.border; X.lineWidth = 1; X.stroke();
      bar(px + 18, py + 18, 130, C.ink, 11); bar(px + 18, py + 42, 250); bar(px + 18, py + 60, 200);
      strokeRR(px + 130, py + 82, 70, 26, 6, C.line2, 1.5); fillRR(px + 210, py + 82, 72, 26, 6, C.blue); text('OK', px + 246, py + 95, 14, '#fff', 700, 'center', NUMF);
      X.restore();
    }
    pointer([[.3, w + 30, h + 30], [.95, 84, 134], [1.6, 84, 134], [3.0, 402, 157], [3.5, 402, 157], [4.2, w + 30, h + 30]], [1.0, 3.3], t);
  });

  // @element 08
  // 08 トースト（Toast notification）
  CELLS[7] = ui((w, h, t) => {
    bar(24, 16, 90, C.line2, 10); strokeRR(24, 34, 300, 34, 7, C.line2, 1.5); bar(24, 82, 90, C.line2, 10); strokeRR(24, 100, 300, 34, 7, C.line2, 1.5);
    fillRR(24, 146, 110, 36, 8, C.blue); text('保存', 79, 164, 16, '#fff', 600, 'center');
    const tin = eo(seg(t, 1.05, 1.4)), tout = eio(seg(t, 3.2, 3.55));
    if (tin > 0 && tout < 1) {
      const tw0 = 214, th = 52, tx = w - 18 - tw0 + (1 - tin) * 240 + tout * 240, ty = h - 16 - th;
      shadowed(() => fillRR(tx, ty, tw0, th, 10, C.dark), 18, 6, .25);
      circle(tx + 26, ty + 24, 11, C.blue); check(tx + 26, ty + 24, 5, '#fff', 2.4);
      text('保存しました', tx + 46, ty + 24, 15, '#fff', 600);
      const life = 1 - seg(t, 1.4, 3.2); fillRR(tx + 10, ty + th - 7, (tw0 - 20) * life, 3, 1.5, C.sb);
    }
    pointer([[.3, -30, h + 30], [.95, 84, 168], [1.5, 84, 168], [2.2, -40, h + 40]], [1.0], t);
  });

  // @element 09
  // 09 タブ（Tabs）
  CELLS[8] = ui((w, h, t) => {
    const labs = ['概要', '料金', 'レビュー'], xs = [24, 114, 204], ws = [70, 70, 100];
    const c1 = eio(seg(t, 1.0, 1.25)), c2 = eio(seg(t, 2.2, 2.45)), c3 = eio(seg(t, 3.4, 3.65));
    const pos = c1 + c2 - 2 * c3; // 0 -> 1 -> 2 -> 0
    const fi = Math.floor(pos), fr = pos - fi, gi = Math.min(2, fi + 1);
    const ux = lerp(xs[fi], xs[gi], fr), uw = lerp(ws[fi], ws[gi], fr);
    const act = t < 1.1 ? 0 : t < 2.3 ? 1 : t < 3.5 ? 2 : 0;
    labs.forEach((s, i) => text(s, xs[i] + ws[i] / 2, 28, 17, i === act ? C.blue : '#8a8886', i === act ? 700 : 500, 'center'));
    X.fillStyle = C.line; X.fillRect(0, 50, w, 2); fillRR(ux, 48, uw, 4, 2, C.blue);
    // 中身（切替時にクロスフェード）
    const tabAlpha = [
      1 - seg(t, 1.0, 1.2) + seg(t, 3.45, 3.65),
      seg(t, 1.1, 1.3) - seg(t, 2.2, 2.4),
      seg(t, 2.3, 2.5) - seg(t, 3.4, 3.6)];
    tabAlpha.forEach((a, i) => {
      a = clamp(a); if (a <= 0) return; X.save(); X.globalAlpha = a; X.translate(0, 8 * (1 - a));
      if (i === 0) { bar(24, 70, 220, C.line2, 11); bar(24, 94, 494); bar(24, 112, 400); fillRR(24, 134, 494, 46, 8, C.block); }
      if (i === 1) { for (let k = 0; k < 3; k++) { const x = 24 + k * 168; fillRR(x, 68, 158, 112, 10, k === 1 ? C.lb : '#f6f5f3'); strokeRR(x, 68, 158, 112, 10, k === 1 ? C.sb : C.line, 1.5); bar(x + 16, 84, 60, k === 1 ? C.blue : C.line2, 10); text(['¥0', '¥980', '¥1,980'][k], x + 16, 118, 22, k === 1 ? C.blue : '#555', 700, 'left', NUMF); bar(x + 16, 148, 110); } }
      if (i === 2) { for (let k = 0; k < 3; k++) { const y = 70 + k * 38; circle(40, y + 14, 14, k === 0 ? C.mb : C.line); bar(64, y + 4, 120, C.line2, 10); bar(64, y + 20, 360); } }
      X.restore();
    });
    pointer([[.3, w + 30, h + 30], [.95, 152, 34], [1.6, 152, 34], [2.15, 256, 34], [2.8, 256, 34], [3.35, 62, 34], [3.7, 62, 34], [4.25, w + 30, h + 30]], [1.0, 2.2, 3.4], t);
  });

  // @element 10
  // 10 カルーセル（Carousel）
  CELLS[9] = ui((w, h, t) => {
    const p = eio(seg(t, 1.0, 1.4)) + eio(seg(t, 2.1, 2.5)) + eio(seg(t, 3.2, 3.6));
    const sw = 330, gap = 18, cx = w / 2;
    X.save(); X.beginPath(); X.rect(0, 0, w, 160); X.clip();
    for (let j = Math.floor(p) - 2; j <= Math.floor(p) + 2; j++) {
      const x = cx - sw / 2 + (j - p) * (sw + gap), idx = ((j % 3) + 3) % 3;
      if (idx === 0) mountains(x, 14, sw, 138);
      if (idx === 1) { fillRR(x, 14, sw, 138, 8, '#e3ebfd'); circle(x + 90, 83, 34, C.mb); circle(x + 165, 83, 34, C.sb); circle(x + 240, 83, 34, C.mb); }
      if (idx === 2) { fillRR(x, 14, sw, 138, 8, C.lb); for (let k = 0; k < 5; k++) { const bh = [40, 70, 55, 95, 80][k]; fillRR(x + 60 + k * 46, 132 - bh, 30, bh, 4, k === 3 ? C.blue : C.mb); } }
    }
    X.restore();
    [[30, 83, Math.PI / 2], [w - 30, 83, -Math.PI / 2]].forEach(([x, y, r]) => { shadowed(() => circle(x, y, 18, '#fff'), 10, 3, .2); chevron(x, y, 5, r, '#555'); });
    const act = Math.round(p) % 3;
    for (let k = 0; k < 3; k++) { const on = k === act; fillRR(w / 2 - 30 + k * 22 - (on ? 4 : 0), 172, on ? 16 : 8, 8, 4, on ? C.blue : C.line2); }
    pointer([[.3, w + 30, h + 30], [.95, w - 28, 88], [3.4, w - 28, 88], [4.2, w + 30, h + 30]], [1.0, 2.1, 3.2], t);
  });

  // @element 11
  // 11 トグルスイッチ（Toggle switch）
  CELLS[10] = ui((w, h, t) => {
    const st = [eo(seg(t, 1.0, 1.2)) * (1 - eo(seg(t, 3.0, 3.2))), eo(seg(t, 1.8, 2.0)) * (1 - eo(seg(t, 3.6, 3.8))), 0];
    for (let i = 0; i < 3; i++) {
      const y = 14 + i * 60; bar(24, y + 10, [170, 140, 190][i], C.line2, 11); bar(24, y + 30, [260, 220, 240][i], C.line, 8);
      if (i < 2) { X.fillStyle = C.line; X.fillRect(24, y + 52, 494, 1.5); }
      const k = st[i], tx = 450, ty = y + 10;
      fillRR(tx, ty, 64, 34, 17, k > .5 ? C.blue : '#d9d7d5'); if (k > 0 && k < 1) { X.globalAlpha = k; fillRR(tx, ty, 64, 34, 17, C.blue); X.globalAlpha = 1; }
      shadowed(() => circle(tx + 17 + 30 * k, ty + 17, 13, '#fff'), 4, 1, .25);
    }
    pointer([[.3, w + 30, h + 30], [.95, 486, 30], [1.35, 486, 30], [1.75, 486, 90], [2.5, 486, 90], [2.95, 486, 30], [3.25, 486, 30], [3.55, 486, 90], [3.85, 486, 90], [4.3, w + 30, h + 30]], [1.0, 1.8, 3.0, 3.6], t);
  });

  // @element 12
  // 12 セグメントコントロール（Segmented control）
  CELLS[11] = ui((w, h, t) => {
    const pos = eio(seg(t, 1.0, 1.25)) + eio(seg(t, 2.1, 2.35)) - 2 * eio(seg(t, 3.3, 3.55));
    const sx = 121, sy = 12, sw = 300, sh = 40, cw = sw / 3;
    fillRR(sx, sy, sw, sh, 10, '#efedeb');
    shadowed(() => fillRR(sx + 4 + pos * cw, sy + 4, cw - 8, sh - 8, 8, C.blue), 6, 2, .2);
    ['日', '週', '月'].forEach((s, i) => { const near = 1 - clamp(Math.abs(pos - i)); text(s, sx + cw * i + cw / 2, sy + sh / 2 + 1, 17, near > .5 ? '#fff' : '#6d6b69', 700, 'center'); });
    const sets = [[30, 55, 40, 70, 50, 85, 60], [60, 40, 90, 75, 100, 55, 80], [95, 70, 110, 60, 85, 115, 100]];
    const fi = Math.floor(pos), fr = pos - fi, gi = Math.min(2, fi + 1);
    X.fillStyle = C.line; X.fillRect(60, 182, 422, 1.5);
    for (let k = 0; k < 7; k++) { const bh = lerp(sets[fi][k], sets[gi][k], eio(fr)); fillRR(72 + k * 58, 180 - bh, 34, bh, 5, k === 5 ? C.blue : C.mb); }
    pointer([[.3, w + 30, h + 30], [.95, 276, 36], [1.6, 276, 36], [2.05, 376, 36], [2.8, 376, 36], [3.25, 176, 36], [3.7, 176, 36], [4.25, w + 30, h + 30]], [1.0, 2.1, 3.3], t);
  });

  // @element 13
  // 13 チップ（Filter chips）
  CELLS[12] = ui((w, h, t) => {
    const chips = ['すべて', '新着', '人気', '無料']; let x = 24; const pos = [];
    const on = [0, eo(seg(t, 0.95, 1.1)) * (1 - eo(seg(t, 3.0, 3.15))), 0, eo(seg(t, 1.75, 1.9)) * (1 - eo(seg(t, 3.6, 3.75)))];
    chips.forEach((s, i) => {
      const k = on[i], cw0 = tw(s, 15, 600) + 32 + (k > 0 ? 18 * k : 0);
      fillRR(x, 12, cw0, 34, 17, k > .5 ? C.lb : '#fff'); strokeRR(x, 12, cw0, 34, 17, k > .5 ? C.blue : C.line2, 1.5);
      if (k > 0) { X.globalAlpha = k; check(x + 18, 29, 5, C.blue, 2.4); X.globalAlpha = 1; }
      text(s, x + 16 + 18 * k, 30, 15, k > .5 ? C.blue : '#555', 600);
      pos.push(x + cw0 / 2); x += cw0 + 10;
    });
    // 一覧：条件に合わないカードが消える
    const vis = [1, 1 - Math.max(on[1], on[3]), 1 - on[3], 1];
    for (let i = 0; i < 4; i++) {
      const cx = 24 + (i % 2) * 252, cy = 60 + Math.floor(i / 2) * 64, a = clamp(.12 + .88 * vis[i]);
      X.save(); X.globalAlpha = a; strokeRR(cx, cy, 242, 54, 8, C.line2, 1.5); fillRR(cx + 10, cy + 10, 34, 34, 6, i === 0 ? C.mb : C.line); bar(cx + 54, cy + 14, 120, C.line2, 10); bar(cx + 54, cy + 32, 150, C.line, 7); X.restore();
    }
    const p1 = pos[1] || 120, p3 = pos[3] || 300;
    pointer([[.3, w + 30, h + 30], [.9, 130, 32], [1.3, 130, 32], [1.7, 300, 32], [2.5, 300, 32], [2.95, 130, 32], [3.2, 130, 32], [3.55, 296, 32], [3.85, 296, 32], [4.3, w + 30, h + 30]], [0.95, 1.75, 3.0, 3.6], t);
  });

  // @element 14
  // 14 レンジスライダー（Range slider）
  CELLS[13] = ui((w, h, t) => {
    // つまみ2つで範囲を選ぶ：下限 ¥1,000→¥3,000、上限 ¥10,000→¥8,000、のち元へ戻す
    const LO = tt => .1 + .2 * eio(seg(tt, 1.0, 1.6)) - .2 * eio(seg(tt, 3.55, 3.9));
    const HI = tt => 1.0 - .2 * eio(seg(tt, 2.1, 2.6)) + .2 * eio(seg(tt, 2.95, 3.3));
    const x0 = 54, x1 = 488, ty = 120, X_ = v => lerp(x0, x1, v);
    const lo = LO(t), hi = HI(t), lx = X_(lo), hx = X_(hi);
    const yen = v => '¥' + (Math.round(v * 100) * 100).toLocaleString('en-US');
    text('価格', 24, 26, 16, '#555', 700);
    text(yen(lo) + ' 〜 ' + yen(hi), w - 24, 26, 17, C.blue, 700, 'right', NUMF);
    fillRR(x0, ty - 4, x1 - x0, 8, 4, '#e3e1df'); fillRR(lx, ty - 4, hx - lx, 8, 4, C.blue);
    const loAct = (t > 1.0 && t < 1.7) || (t > 3.55 && t < 3.95), hiAct = t > 2.1 && t < 3.3;
    [[lx, lo, loAct], [hx, hi, hiAct]].forEach(([kx, v, act]) => {
      if (act) circle(kx, ty, 24, 'rgba(31,90,232,.14)');
      shadowed(() => circle(kx, ty, act ? 15 : 13, '#fff'), 6, 2, .25); ring(kx, ty, act ? 15 : 13, C.blue, 3);
      const val = yen(v), bw = tw(val, 15, 700, NUMF) + 18, bx = clamp(kx - bw / 2, 4, w - 4 - bw);
      fillRR(bx, ty - 60, bw, 28, 7, act ? C.blue : C.lb);
      X.beginPath(); X.moveTo(kx - 6, ty - 32); X.lineTo(kx, ty - 26); X.lineTo(kx + 6, ty - 32); X.fillStyle = act ? C.blue : C.lb; X.fill();
      text(val, bx + bw / 2, ty - 46, 15, act ? '#fff' : C.blue, 700, 'center', NUMF);
    });
    text('¥0', x0, 154, 14, '#9a9896', 500, 'center', NUMF); text('¥10,000', x1 - 10, 154, 14, '#9a9896', 500, 'center', NUMF);
    bar(24, 174, 220, C.line, 8);
    const off = [w + 30, h + 30], L = tt => [X_(LO(tt)), ty + 4], Hh = tt => [X_(HI(tt)), ty + 4];
    const mv = (a, b, ta, tb) => track([[ta, a[0], a[1]], [tb, b[0], b[1]]], t);
    let pos;
    if (t < 1.0) pos = mv(off, L(1.0), .3, .95);
    else if (t < 1.7) pos = L(t);
    else if (t < 2.1) pos = mv(L(1.7), Hh(2.1), 1.7, 2.05);
    else if (t < 3.3) pos = Hh(t);
    else if (t < 3.55) pos = mv(Hh(3.3), L(3.55), 3.3, 3.52);
    else if (t < 3.95) pos = L(t);
    else pos = mv(L(3.95), off, 3.95, 4.3);
    pointer([[0, pos[0], pos[1]]], [1.0, 2.1, 2.95, 3.55], t);
  });

  // @element 15
  // 15 ステッパー（Stepper (+/−)）
  CELLS[14] = ui((w, h, t) => {
    bar(171, 24, 90, C.line2, 10);
    const plus = [.9, 1.35, 1.8], minus = [2.8, 3.25, 3.7];
    let n = 1; plus.forEach(c => { if (t >= c) n++; }); minus.forEach(c => { if (t >= c) n--; });
    const last = [...plus, ...minus].filter(c => t >= c).pop();
    const pop = last !== undefined ? 1 - seg(t, last, last + .25) : 0;
    const bx = 171, by = 52, bw = 200, bh = 60;
    strokeRR(bx, by, bw, bh, 12, C.line2, 1.8);
    const pressP = plus.some(c => t >= c - .05 && t < c + .15), pressM = minus.some(c => t >= c - .05 && t < c + .15);
    if (pressM) fillRR(bx + 2, by + 2, 58, bh - 4, 10, C.lb); if (pressP) fillRR(bx + bw - 60, by + 2, 58, bh - 4, 10, C.lb);
    X.fillStyle = C.line2; X.fillRect(bx + 60, by + 10, 1.5, bh - 20); X.fillRect(bx + bw - 61, by + 10, 1.5, bh - 20);
    text('−', bx + 30, by + bh / 2, 30, '#555', 500, 'center', NUMF); text('+', bx + bw - 30, by + bh / 2, 30, C.blue, 500, 'center', NUMF);
    X.save(); X.translate(bx + bw / 2, by + bh / 2 + 1); X.scale(1 + .18 * pop, 1 + .18 * pop); text(String(n), 0, 0, 30, pop > .05 ? C.blue : C.ink, 700, 'center', NUMF); X.restore();
    bar(171, 136, 200, C.line); bar(171, 154, 140, C.line);
    pointer([[.3, w + 30, h + 30], [.85, 342, 86], [2.3, 342, 86], [2.75, 202, 86], [3.75, 202, 86], [4.3, w + 30, h + 30]], [...plus, ...minus], t);
  });

  // @element 16
  // 16 ページネーション（Pagination）
  CELLS[15] = ui((w, h, t) => {
    const page = t < 1.05 ? 0 : t < 2.15 ? 1 : t < 3.35 ? 2 : 0;
    const fade = Math.min(...[1.05, 2.15, 3.35].map(c => Math.abs(t - c) < .2 ? Math.abs(t - c) / .2 : 1));
    X.save(); X.globalAlpha = fade;
    for (let k = 0; k < 3; k++) { const y = 10 + k * 40; fillRR(24, y, 52, 32, 6, (k + page) % 3 === 0 ? C.mb : C.line); bar(90, y + 4, [200, 160, 240, 180][(k + page) % 4], C.line2, 10); bar(90, y + 20, [320, 280, 360][(k + 2 * page) % 3], C.line, 7); }
    X.restore();
    const items = ['‹', '1', '2', '3', '4', '5', '›'], d = 36, g = 8, total = items.length * d + (items.length - 1) * g, x0 = (w - total) / 2;
    const pos = eio(seg(t, 1.0, 1.2)) + eio(seg(t, 2.1, 2.3)) - 2 * eio(seg(t, 3.3, 3.5));
    circle(x0 + (1 + pos) * (d + g) + d / 2, 160, d / 2, C.blue);
    items.forEach((s, i) => { const cx = x0 + i * (d + g) + d / 2; const on = i >= 1 && i <= 5 && Math.abs(pos - (i - 1)) < .5; text(s, cx, 161, i === 0 || i === 6 ? 22 : 16, on ? '#fff' : '#666', 700, 'center', NUMF); });
    const px = i => x0 + i * (d + g) + d / 2 + 4;
    pointer([[.3, w + 30, h + 30], [.95, px(2), 166], [1.6, px(2), 166], [2.05, px(3), 166], [2.8, px(3), 166], [3.25, px(1), 166], [3.65, px(1), 166], [4.25, w + 30, h + 30]], [1.0, 2.1, 3.3], t);
  });

  // @element 17
  // 17 ハンバーガーメニュー（Hamburger menu）
  CELLS[16] = ui((w, h, t) => {
    const a = eio(seg(t, 1.0, 1.3)) * (1 - eio(seg(t, 3.3, 3.6)));
    pageLines(24, 66, 494); fillRR(24, 134, 494, 46, 8, C.block);
    if (a > 0) {
      X.save(); X.beginPath(); X.rect(0, 44, w, h); X.clip();
      const mh = 140, my = 44 - mh + mh * a;
      shadowed(() => { X.fillStyle = '#fff'; X.fillRect(0, my, w, mh); }, 16, 6, .16);
      for (let k = 0; k < 4; k++) { const y = my + 14 + k * 32; bar(24, y + 6, [110, 150, 90, 130][k], k === 0 ? C.blue : C.line2, 11); if (k < 3) { X.fillStyle = C.line; X.fillRect(24, y + 26, w - 48, 1); } }
      X.restore();
    }
    X.fillStyle = '#fff'; X.fillRect(0, 0, w, 44); X.fillStyle = C.line; X.fillRect(0, 44, w, 1.5);
    fillRR(24, 15, 76, 16, 4, C.mb);
    // 三本線 → ×
    const hx = w - 42, hy = 22; X.save(); X.translate(hx, hy); X.strokeStyle = a > .02 ? C.blue : '#333'; X.lineWidth = 3; X.lineCap = 'round';
    X.save(); X.translate(0, -8 * (1 - a)); X.rotate(Math.PI / 4 * a); X.beginPath(); X.moveTo(-12, 0); X.lineTo(12, 0); X.stroke(); X.restore();
    X.globalAlpha = 1 - a; X.beginPath(); X.moveTo(-12, 0); X.lineTo(12, 0); X.stroke(); X.globalAlpha = 1;
    X.save(); X.translate(0, 8 * (1 - a)); X.rotate(-Math.PI / 4 * a); X.beginPath(); X.moveTo(-12, 0); X.lineTo(12, 0); X.stroke(); X.restore();
    X.restore();
    pointer([[.3, w + 30, h + 30], [.95, w - 38, 26], [3.5, w - 38, 26], [4.2, w + 30, h + 30]], [1.0, 3.3], t);
  });

  // @element 18
  // 18 パンくずリスト（Breadcrumbs）
  CELLS[17] = ui((w, h, t) => {
    const up = eio(seg(t, 1.0, 1.25)) * (1 - eio(seg(t, 2.7, 2.95))); // 1=「講座」の階層にいる
    let x = 24; const y = 24;
    text('ホーム', x, y, 17, C.blue, 600); x += tw('ホーム', 17, 600) + 10; text('›', x, y, 17, '#aaa', 500); x += 18;
    const kx = x, kw = tw('講座', 17, 700);
    const hoverK = t > .9 && t < 1.2;
    text('講座', x, y, 17, up > .5 ? C.ink : C.blue, up > .5 ? 700 : 600); if (hoverK) { X.fillStyle = C.blue; X.fillRect(x, y + 12, kw, 2); }
    x += kw + 10;
    X.globalAlpha = 1 - up; text('›', x, y, 17, '#aaa', 500); text('Web制作', x + 18, y, 17, C.ink, 700); X.globalAlpha = 1;
    X.fillStyle = C.line; X.fillRect(24, 46, 494, 1.5);
    // 中身：詳細ページ ⇄ 一覧ページ
    if (up < 1) { X.save(); X.globalAlpha = 1 - up; bar(24, 64, 200, C.ink, 13); bar(24, 92, 494); bar(24, 110, 420); fillRR(24, 132, 494, 48, 8, C.block); X.restore(); }
    if (up > 0) { X.save(); X.globalAlpha = up; for (let k = 0; k < 3; k++) { const cx = 24 + k * 168, hov = k === 0 && t > 2.45 && t < 2.8; strokeRR(cx, 62, 158, 118, 8, hov ? C.blue : C.line2, hov ? 2 : 1.5); mountains(cx + 10, 72, 138, 58, k % 2); bar(cx + 10, 142, 90, k === 0 ? C.sb : C.line2, 10); bar(cx + 10, 160, 120, C.line, 7); } X.restore(); }
    pointer([[.3, w + 30, h + 30], [.95, kx + kw / 2, 30], [1.6, kx + kw / 2, 30], [2.4, 104, 120], [3.1, 104, 120], [3.9, w + 30, h + 30]], [1.0, 2.7], t);
  });

  // @element 19
  // 19 メガメニュー（Mega menu）
  CELLS[18] = ui((w, h, t) => {
    const a = eo(seg(t, 1.05, 1.3)) * (1 - eio(seg(t, 3.15, 3.4)));
    pageLines(24, 62, 494); fillRR(24, 130, 494, 50, 8, C.block);
    X.fillStyle = '#fff'; X.fillRect(0, 0, w, 42); X.fillStyle = C.line; X.fillRect(0, 42, w, 1.5);
    fillRR(24, 14, 70, 16, 4, C.mb);
    const nav = [['製品', 190], ['料金', 262], ['サポート', 334]];
    nav.forEach(([s, x], i) => { const on = i === 0 && a > .3; text(s, x, 22, 16, on ? C.blue : '#555', on ? 700 : 600); if (on) fillRR(x, 36, tw(s, 16, 700), 3, 1.5, C.blue); chevron(x + tw(s, 16, 700) + 10, 22, 3.5, 0, on ? C.blue : '#999', 1.8); });
    if (a > 0) {
      X.save(); X.globalAlpha = a; X.beginPath(); X.rect(0, 43, w, h); X.clip(); const py = 43 - 12 * (1 - a);
      shadowed(() => { X.fillStyle = '#fff'; X.fillRect(0, py, w, 146); }, 18, 8, .16);
      for (let c = 0; c < 3; c++) { const cx = 24 + c * 130; bar(cx, py + 16, 80, C.blue, 10); for (let k = 0; k < 3; k++) { const hov = c === 1 && k === 1 && t > 1.75 && t < 2.9; if (hov) fillRR(cx - 6, py + 34 + k * 26, 112, 22, 5, C.lb); bar(cx, py + 40 + k * 26, [90, 70, 100][(k + c) % 3], hov ? C.sb : C.line2, 9); } }
      mountains(414, py + 14, 104, 112);
      X.restore();
    }
    // 乗せるだけで開く（クリックしない）
    pointer([[.3, w + 30, h + 30], [1.0, 205, 26], [1.4, 205, 26], [1.8, 196, 98], [2.9, 196, 98], [3.2, 300, 200], [3.9, w + 30, h + 30]], [], t);
  });

  // @element 20
  // 20 ステップインジケーター（Step indicator）
  CELLS[19] = ui((w, h, t) => {
    const clicks = [.9, 1.7, 2.5]; let step = 0; clicks.forEach(c => { if (t >= c) step++; });
    const reset = seg(t, 3.75, 4.05), back = seg(t, 4.05, 4.3);
    const showStep = reset >= 1 ? 0 : step;
    const xs = [80, 207, 334, 461], labs = ['入力', '確認', '支払い', '完了'];
    const prog = clicks.reduce((s, c) => s + eio(seg(t, c, c + .3)), 0);
    X.save(); X.globalAlpha = reset < 1 ? 1 - reset : back;
    const pr = reset >= 1 ? 0 : prog;
    fillRR(xs[0], 33, xs[3] - xs[0], 4, 2, '#e3e1df'); fillRR(xs[0], 33, (xs[1] - xs[0]) * pr, 4, 2, C.blue);
    xs.forEach((x, i) => {
      const done = i < showStep || (showStep === 3 && i === 3), cur = i === showStep && showStep < 3;
      circle(x, 35, 17, done || cur ? C.blue : '#fff'); if (!(done || cur)) ring(x, 35, 16, C.line2, 2);
      if (done) check(x, 35, 7, '#fff', 2.6); else text(String(i + 1), x, 36, 16, cur ? '#fff' : '#9a9896', 700, 'center', NUMF);
      text(labs[i], x, 70, 14, done || cur ? C.blue : '#9a9896', 600, 'center');
    });
    X.restore();
    strokeRR(24, 96, 494, 30, 7, C.line2, 1.5); bar(36, 106, 160, C.line); bar(24, 148, 200, C.line);
    fillRR(w - 24 - 110, 142, 110, 38, 8, C.blue); text('次へ', w - 24 - 55, 161, 16, '#fff', 600, 'center');
    pointer([[.3, w + 30, h + 30], [.85, w - 74, 166], [2.6, w - 74, 166], [3.3, w + 30, h + 30]], clicks, t);
  });

  // @element 21
  // 21 スケルトン（Skeleton screen）
  CELLS[20] = ui((w, h, t) => {
    const sk = seg(t, 1.05, 1.2) * (1 - seg(t, 3.0, 3.3));
    ring(w - 40, 26, 14, C.line2, 1.8); X.beginPath(); X.arc(w - 40, 26, 7, -Math.PI * .1, Math.PI * 1.4); X.strokeStyle = '#666'; X.lineWidth = 2.2; X.stroke();
    bar(24, 20, 160, C.line2, 12);
    for (let k = 0; k < 2; k++) {
      const y = 56 + k * 66;
      X.save(); X.globalAlpha = 1 - sk; mountains(24, y, 96, 56, k); bar(136, y + 6, 200, C.ink, 11); bar(136, y + 26, 340); bar(136, y + 42, 260); X.restore();
      if (sk > 0) {
        X.save(); X.globalAlpha = sk; const g = '#e9e7e5';
        fillRR(24, y, 96, 56, 8, g); fillRR(136, y + 4, 200, 14, 7, g); fillRR(136, y + 26, 340, 10, 5, g); fillRR(136, y + 42, 260, 10, 5, g);
        // 光が横に流れる
        const sx = -200 + ((t - 1.1) % 0.9) / 0.9 * (w + 400);
        X.globalCompositeOperation = 'source-atop';
        const gr = X.createLinearGradient(sx - 80, 0, sx + 80, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        X.fillStyle = gr; X.fillRect(0, y - 2, w, 64);
        X.restore();
      }
    }
    pointer([[.3, w + 30, h + 30], [.95, w - 38, 30], [1.4, w - 38, 30], [2.1, w + 30, h + 30]], [1.0], t);
  });

  // @element 22
  // 22 スピナー（Spinner）
  CELLS[21] = ui((w, h, t) => {
    const load = seg(t, 1.05, 1.2) * (1 - seg(t, 2.95, 3.05));
    const done = seg(t, 2.95, 3.15) * (1 - seg(t, 3.75, 4.0));
    pageLines(24, 18, 494); strokeRR(24, 90, 494, 34, 7, C.line2, 1.5);
    fillRR(w / 2 - 60, 140, 120, 40, 8, C.blue); text('送信', w / 2, 160, 16, '#fff', 600, 'center');
    const ov = Math.max(load, done);
    if (ov > 0) {
      X.fillStyle = `rgba(255,255,255,${.78 * ov})`; X.fillRect(0, 0, w, h);
      if (load > 0) { X.save(); X.globalAlpha = load; ring(w / 2, 92, 26, '#e3e8f5', 6); X.beginPath(); const a0 = t * Math.PI * 2 * 1.3; X.arc(w / 2, 92, 26, a0, a0 + Math.PI * 1.35); X.strokeStyle = C.blue; X.lineWidth = 6; X.lineCap = 'round'; X.stroke(); X.restore(); }
      if (done > 0) { X.save(); X.globalAlpha = done; const s = .7 + .3 * eo(seg(t, 2.95, 3.2)); X.translate(w / 2, 92); X.scale(s, s); circle(0, 0, 28, C.blue); check(0, 0, 11, '#fff', 4); X.restore(); }
    }
    pointer([[.3, w + 30, h + 30], [.95, w / 2 + 6, 166], [1.5, w / 2 + 6, 166], [2.2, w + 30, h + 30]], [1.0], t);
  });

  // @element 23
  // 23 バッジ（Badge）
  CELLS[22] = ui((w, h, t) => {
    X.fillStyle = '#fff'; X.fillRect(0, 0, w, 54); X.fillStyle = C.line; X.fillRect(0, 54, w, 1.5);
    fillRR(24, 19, 76, 16, 4, C.mb);
    // ベル
    const bx = w - 60, by = 27; X.save(); X.translate(bx, by);
    X.beginPath(); X.moveTo(-12, 8); X.quadraticCurveTo(-11, -12, 0, -13); X.quadraticCurveTo(11, -12, 12, 8); X.lineTo(15, 11); X.lineTo(-15, 11); X.closePath();
    X.strokeStyle = '#333'; X.lineWidth = 2.4; X.lineJoin = 'round'; X.stroke(); X.beginPath(); X.arc(0, 14, 4, 0, Math.PI); X.stroke(); X.restore();
    const arr = [.7, 1.3, 1.9]; let n = 0; arr.forEach(c => { if (t >= c) n++; });
    const clear = eio(seg(t, 3.0, 3.25));
    if (n > 0 && clear < 1) {
      const last = arr.filter(c => t >= c).pop(), pop = 1 - seg(t, last, last + .3);
      const s = (n === 1 ? eo(seg(t, .7, .9)) : 1) * (1 + .3 * pop) * (1 - clear);
      // 届いた合図の波紋
      const k = seg(t, last, last + .5); if (k > 0 && k < 1) ring(bx + 12, by - 12, 12 + 16 * k, `rgba(31,90,232,${.5 * (1 - k)})`, 2.5);
      X.save(); X.translate(bx + 12, by - 12); X.scale(s, s); circle(0, 0, 12, C.blue); ring(0, 0, 12, '#fff', 2.5); text(String(n), 0, 1, 14, '#fff', 800, 'center', NUMF); X.restore();
    }
    bar(24, 76, 220, C.line2, 12); bar(24, 102, 494); bar(24, 120, 400); fillRR(24, 140, 494, 40, 8, C.block);
    pointer([[.3, w + 30, h + 30], [2.3, w + 30, h + 30], [2.95, bx + 2, by + 4], [3.4, bx + 2, by + 4], [4.1, w + 30, h + 30]], [3.0], t);
  });

  // @element 24
  // 24 エンプティステート（Empty state）
  CELLS[23] = ui((w, h, t) => {
    const r1 = eio(seg(t, 0.95, 1.25)), r2 = eio(seg(t, 1.65, 1.95));
    const back = eo(seg(t, 3.35, 3.7));
    const empty = seg(t, 1.95, 2.3) * (1 - seg(t, 3.25, 3.45));
    bar(24, 14, 130, C.line2, 11);
    const rows = [[r1, 0], [r2, 1]];
    rows.forEach(([g, i]) => {
      const gone = back > 0 ? 1 - back : g; if (gone >= 1) return;
      const y = 40 + i * 58 - (i === 1 ? 58 * (back > 0 ? 0 : r1) : 0);
      X.save(); X.globalAlpha = 1 - gone; X.translate(-60 * gone, 0);
      strokeRR(24, y, 494, 48, 8, C.line2, 1.5); ring(48, y + 24, 9, C.line2, 2); bar(70, y + 12, 200, C.line2, 10); bar(70, y + 28, 140, C.line, 7);
      // ゴミ箱
      X.strokeStyle = '#888'; X.lineWidth = 2; X.lineJoin = 'round'; X.strokeRect(476, y + 18, 16, 18); X.beginPath(); X.moveTo(472, y + 17); X.lineTo(496, y + 17); X.moveTo(480, y + 13); X.lineTo(488, y + 13); X.stroke();
      X.restore();
    });
    if (empty > 0) {
      X.save(); X.globalAlpha = empty; const cy = 70 + 8 * (1 - empty);
      X.strokeStyle = C.blue; X.lineWidth = 2.6; X.lineJoin = 'round';
      X.beginPath(); X.moveTo(w / 2 - 26, cy - 4); X.lineTo(w / 2 - 18, cy - 22); X.lineTo(w / 2 + 18, cy - 22); X.lineTo(w / 2 + 26, cy - 4); X.lineTo(w / 2 + 26, cy + 16); X.lineTo(w / 2 - 26, cy + 16); X.closePath(); X.stroke();
      X.beginPath(); X.moveTo(w / 2 - 26, cy - 4); X.lineTo(w / 2 - 9, cy - 4); X.lineTo(w / 2 - 6, cy + 3); X.lineTo(w / 2 + 6, cy + 3); X.lineTo(w / 2 + 9, cy - 4); X.lineTo(w / 2 + 26, cy - 4); X.stroke();
      text('まだ何もありません', w / 2, cy + 40, 16, '#555', 600, 'center');
      fillRR(w / 2 - 56, cy + 62, 112, 34, 8, C.blue); text('追加する', w / 2, cy + 79, 15, '#fff', 600, 'center');
      X.restore();
    }
    pointer([[.3, w + 30, h + 30], [.9, 486, 67], [1.25, 486, 67], [1.6, 486, 67], [2.4, 486, 67], [3.2, w / 2 + 4, 156], [3.5, w / 2 + 4, 156], [4.2, w + 30, h + 30]], [0.95, 1.65, 3.3], t);
  });

  // @element 25
  // 25 缩放淡入（Scale in）
  // 左侧 0–386 为页面：光标 0.95 秒到达左下 110×36「打开」按钮，1.0 秒点击。
  // 打开量 a = easeOutCubic(p)，p 在 1.0–1.25 秒（0.25 秒）由 0→1：对话框 220×112、圆角 12、中心 (193, 92)，
  // 缩放 0.95 + 0.05·a、不透明度 a、页面遮罩 0.36·a。a 单调升到 1，不越过目标尺寸（无过冲）。
  // 关闭：光标 3.0 秒移到 ×，3.3 秒点击；p 在 3.3–3.5 秒（0.2 秒）由 1→0，即把打开曲线倒放，缩回 0.95 倍并淡出。
  // 右侧 386–542 为曲线面板：蓝实线为本效果 easeOutCubic，灰虚线为弹性弹入 backOut（越过 1.0 再回落），蓝点随当前 p 沿曲线移动。
  const SCALEIN_S0 = 0.95;
  const SCALEIN_BACK = p => { const c = 1.70158; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
  CELLS[24] = ui((w, h, t) => {
    const SW = 386;
    pageLines(24, 18, 338); fillRR(24, 80, 338, 44, 8, C.block);
    fillRR(24, 138, 110, 36, 8, C.blue); text('打开', 79, 156, 16, '#fff', 600, 'center');
    fillRR(148, 138, 214, 36, 8, C.block);
    const cl = seg(t, 3.3, 3.5), p = cl > 0 ? 1 - cl : seg(t, 1.0, 1.25), a = eo(p);
    if (a > 0) {
      X.fillStyle = `rgba(18,20,28,${.36 * a})`; X.fillRect(0, 0, SW, h);
      X.save(); X.globalAlpha = a; X.translate(193, 92); const s = SCALEIN_S0 + (1 - SCALEIN_S0) * a; X.scale(s, s);
      shadowed(() => fillRR(-110, -56, 220, 112, 12, '#fff'), 24, 8, .25);
      bar(-92, -36, 96, C.ink, 11); bar(-92, -12, 184); bar(-92, 6, 140);
      strokeRR(-62, 22, 68, 26, 7, C.line2, 1.5); text('取消', -28, 35, 13, '#666', 600, 'center');
      fillRR(14, 22, 78, 26, 7, C.blue); text('确定', 53, 35, 13, '#fff', 600, 'center');
      X.strokeStyle = '#9a9896'; X.lineWidth = 2.2; X.lineCap = 'round'; X.beginPath(); X.moveTo(84, -44); X.lineTo(94, -34); X.moveTo(94, -44); X.lineTo(84, -34); X.stroke();
      X.restore();
    }
    // 曲线面板（不被遮罩覆盖）
    X.fillStyle = '#faf9f8'; X.fillRect(SW, 0, w - SW, h); X.fillStyle = C.line; X.fillRect(SW, 0, 1.5, h);
    const px0 = 404, px1 = 508, Y = v => 146 - 74 * v;
    text('缩放曲线', px0, 20, 13, '#555', 700);
    text('×' + (SCALEIN_S0 + (1 - SCALEIN_S0) * a).toFixed(3), px0, 40, 14, C.blue, 700, 'left', NUMF);
    X.fillStyle = C.line; X.fillRect(px0, Y(0), px1 - px0, 1.2);
    X.save(); X.setLineDash([3, 3]); X.strokeStyle = C.line2; X.lineWidth = 1; X.beginPath(); X.moveTo(px0, Y(1)); X.lineTo(px1, Y(1)); X.stroke(); X.restore();
    text('1.00', w - 6, Y(1) - 8, 9, '#9a9896', 500, 'right', NUMF); text('0.95', w - 6, Y(0) - 8, 9, '#9a9896', 500, 'right', NUMF);
    const curve = (f, col, dash, lw) => { X.save(); X.setLineDash(dash); X.strokeStyle = col; X.lineWidth = lw; X.lineJoin = 'round'; X.beginPath(); for (let i = 0; i <= 40; i++) { const q = i / 40, x = lerp(px0, px1, q), y = Y(f(q)); i ? X.lineTo(x, y) : X.moveTo(x, y); } X.stroke(); X.restore(); };
    curve(SCALEIN_BACK, '#a9a7a5', [4, 3], 1.6); curve(eo, C.blue, [], 2.4);
    circle(lerp(px0, px1, p), Y(a), 5, C.blue); ring(lerp(px0, px1, p), Y(a), 5, '#fff', 1.8);
    fillRR(px0, 161, 16, 3, 1.5, C.blue); text('缩放淡入', px0 + 22, 163, 10, '#555', 600);
    X.save(); X.setLineDash([4, 3]); X.strokeStyle = '#a9a7a5'; X.lineWidth = 1.6; X.beginPath(); X.moveTo(px0, 178); X.lineTo(px0 + 16, 178); X.stroke(); X.restore();
    text('弹性弹入（过冲）', px0 + 22, 178, 10, '#9a9896', 600);
    pointer([[.3, w + 30, h + 30], [.95, 80, 158], [1.5, 80, 158], [3.0, 284, 56], [3.5, 284, 56], [4.2, w + 30, h + 30]], [1.0, 3.3], t);
  });

  // @element 26
  // 26 从触发点展开（Origin-aware animation）
  // 卡片左右各一组：同样的「更多」按钮 92×34 与菜单 200×82，只改 transform-origin。
  // 左组 0.9 秒点击、右组 1.8 秒点击；展开量 a = easeOutCubic，0.3 秒，缩放 0.5 + 0.5·a、不透明度 a。
  // 左组以菜单中心 (140, 91) 为原点，菜单凭空在半空胀开；右组以按钮顶边中点 (341, 140) 为原点，菜单从按钮里长出。
  // 收起：左组 2.9 秒、右组 3.5 秒再次点击按钮，a 乘以 (1 − easeInOutCubic)，0.2 秒，沿同一原点缩回。
  // 蓝色十字标出各自的原点；动画进行中，原点到菜单四角显示虚线引导。
  const ORIGIN_SIDES = [
    { ox: 0, lab: '从中心展开', note: 'transform-origin：菜单中心', c0: 0.9, c1: 2.9, btn: false },
    { ox: 271, lab: '从按钮展开', note: 'transform-origin：按钮', c0: 1.8, c1: 3.5, btn: true }];
  CELLS[25] = ui((w, h, t) => {
    X.fillStyle = C.line; X.fillRect(270, 12, 1.5, h - 24);
    ORIGIN_SIDES.forEach(S => {
      const ox = S.ox, mx = ox + 40, my = 50, mw = 200, mh = 82;
      const oxp = S.btn ? ox + 70 : mx + mw / 2, oyp = S.btn ? 140 : my + mh / 2;
      text(S.lab, ox + 24, 18, 14, S.btn ? C.blue : '#555', 700);
      text(S.note, ox + 24, 36, 10, '#9a9896', 500);
      fillRR(ox + 132, 140, 116, 34, 8, C.block);
      const a = eo(seg(t, S.c0, S.c0 + .3)) * (1 - eio(seg(t, S.c1, S.c1 + .2)));
      strokeRR(ox + 24, 140, 92, 34, 8, C.blue, 2); if (a > .02) fillRR(ox + 26, 142, 88, 30, 7, C.lb);
      text('更多', ox + 60, 157, 15, C.blue, 600, 'center'); chevron(ox + 98, 158, 4, Math.PI * a, C.blue, 2);
      if (a > 0) {
        X.save(); X.globalAlpha = a; X.translate(oxp, oyp); const s = .5 + .5 * a; X.scale(s, s); X.translate(-oxp, -oyp);
        shadowed(() => fillRR(mx, my, mw, mh, 10, '#fff'), 18, 6, .2); strokeRR(mx, my, mw, mh, 10, C.border, 1);
        for (let i = 0; i < 3; i++) { const y = my + 8 + i * 24; if (i === 0) fillRR(mx + 6, y, mw - 12, 22, 5, C.lb); fillRR(mx + 14, y + 4, 14, 14, 3, i === 0 ? C.blue : C.line2); bar(mx + 36, y + 6, [110, 88, 124][i], i === 0 ? C.sb : C.line); }
        X.restore();
        // 引导线：只在动画进行中出现
        const g = 4 * a * (1 - a);
        if (g > .01) {
          const s = .5 + .5 * a, cx = q => oxp + (q - oxp) * s, cy = q => oyp + (q - oyp) * s;
          X.save(); X.globalAlpha = .7 * g; X.setLineDash([3, 3]); X.strokeStyle = C.blue; X.lineWidth = 1.2; X.beginPath();
          [[mx, my], [mx + mw, my], [mx, my + mh], [mx + mw, my + mh]].forEach(([qx, qy]) => { X.moveTo(oxp, oyp); X.lineTo(cx(qx), cy(qy)); });
          X.stroke(); X.restore();
        }
      }
      // 原点十字
      X.save(); X.globalAlpha = .45 + .55 * Math.max(4 * a * (1 - a), 0);
      ring(oxp, oyp, 6, C.blue, 2); X.strokeStyle = C.blue; X.lineWidth = 1.6; X.beginPath(); X.moveTo(oxp - 11, oyp); X.lineTo(oxp + 11, oyp); X.moveTo(oxp, oyp - 11); X.lineTo(oxp, oyp + 11); X.stroke();
      X.restore();
    });
    pointer([[.3, w + 30, h + 30], [.85, 64, 160], [1.4, 64, 160], [1.75, 335, 160], [2.4, 335, 160], [2.85, 64, 160], [3.0, 64, 160], [3.45, 335, 160], [3.6, 335, 160], [4.2, w + 30, h + 30]], [0.9, 1.8, 2.9, 3.5], t);
  });

  // @element 27
  // 28 橡皮筋回弹（Rubber-banding）
  // 底部面板已完全展开，顶边停在边界 y = 64（蓝色虚线）。手指 0.9 秒按住把手，0.95–2.35 秒 easeInOutCubic 向上拖 120px。
  // 面板只按阻尼函数 f(x) = (1 − 1 / (0.55·x / 190 + 1)) × 190 移动：手指 40 / 80 / 120px 时面板 20 / 36 / 49px，越拉越重，把手逐渐落后于手指。
  // 2.6 秒松手，面板 2.6–3.0 秒 easeOutCubic 弹回边界。面板右侧两条进度条对比手指位移（灰）与面板位移（蓝）。
  const RUBBER_D = 190, RUBBER_C = 0.55;
  const RUBBER_F = x => (1 - 1 / (x * RUBBER_C / RUBBER_D + 1)) * RUBBER_D;
  CELLS[26] = ui((w, h, t) => {
    pageLines(24, 14, 494); fillRR(24, 74, 239, 54, 8, C.block); fillRR(279, 74, 239, 54, 8, C.block);
    X.fillStyle = 'rgba(18,20,28,.36)'; X.fillRect(0, 0, w, h);
    const d = 120 * eio(seg(t, 0.95, 2.35)), rel = eo(seg(t, 2.6, 3.0));
    const off = t < 2.6 ? RUBBER_F(d) : RUBBER_F(120) * (1 - rel);
    const fd = t < 2.6 ? d : 120 * (1 - eo(seg(t, 2.6, 2.8)));
    const y0 = 64, sy = y0 - off, act = t > .9 && t < 2.6;
    shadowed(() => { rr(0, sy, w, h - sy + 30, 18); X.fillStyle = '#fff'; X.fill(); }, 22, -4, .2);
    fillRR(w / 2 - 26, sy + 10, 52, 6, 3, act ? C.sb : C.line2);
    bar(28, sy + 30, 150, C.ink, 11);
    for (let i = 0; i < 3; i++) { const y = sy + 54 + i * 36; fillRR(28, y, 26, 26, 6, i ? C.mb : C.blue); bar(66, y + 4, 200, C.line); bar(66, y + 17, 130, C.line, 7); }
    // 位移对比
    const mx = 336, tx = 372, tw0 = 120;
    text('手指', mx, sy + 60, 12, '#777', 600); fillRR(tx, sy + 56, tw0, 8, 4, '#eceae8'); if (fd > .5) fillRR(tx, sy + 56, fd, 8, 4, '#9a9896');
    text(Math.round(fd) + 'px', w - 20, sy + 60, 12, '#777', 700, 'right', NUMF);
    text('面板', mx, sy + 86, 12, C.blue, 600); fillRR(tx, sy + 82, tw0, 8, 4, '#eceae8'); if (off > .5) fillRR(tx, sy + 82, off, 8, 4, C.blue);
    text(Math.round(off) + 'px', w - 20, sy + 86, 12, C.blue, 700, 'right', NUMF);
    text('阻尼：越拉越重', mx, sy + 112, 11, '#9a9896', 600);
    // 边界线
    X.save(); X.setLineDash([5, 4]); X.strokeStyle = C.blue; X.globalAlpha = .85; X.lineWidth = 1.5; X.beginPath(); X.moveTo(0, y0); X.lineTo(w, y0); X.stroke(); X.restore();
    text('边界', w - 20, y0 - 9, 11, '#fff', 700, 'right');
    const fp = t < 0.95 ? track([[.3, w / 2, h + 30], [.9, w / 2, y0 + 13]], t) : [w / 2, y0 + 13 - d];
    finger([[0, fp[0], fp[1]]], [0.95], t, t > .55 && t < 2.62);
  });

  // @element 28
  // 29 可打断动画（Interruptible animation）
  // 左侧手机屏 304×171 内，光标 1.0 秒点右上角菜单按钮，抽屉（宽 160）以临界阻尼弹簧 ω = 10 rad/s 打开：p = 1 − (1 + ωs)e^(−ωs)。
  // 1.2 秒抽屉开到 59%、速度 2.7/s 时再次点击，目标改为关闭；从当前位置和当前速度接续：p = (p₀ + (v₀ + ωp₀)s)e^(−ωs)，
  // 先顺势略冲到约 63% 再平滑折返，约 0.7 秒回到 0，速度全程连续。遮罩 0.36·p。
  // 右侧曲线面板（时间 0.9–2.1 秒）：蓝实线为本效果位置曲线，随时间画出，无折角；灰虚线为「先开完再关」（0.35 秒开、0.35 秒关），顶部有折角。
  // 3.9–4.2 秒蓝线淡出复位。
  const INTR_W = 10, INTR_T0 = 1.0, INTR_T1 = 1.2;
  const INTR_ST = (() => { const s = INTR_T1 - INTR_T0, e = Math.exp(-INTR_W * s); return [1 - (1 + INTR_W * s) * e, INTR_W * INTR_W * s * e]; })();
  const INTR_P = t => {
    if (t < INTR_T0 || t > 2.6) return 0;
    if (t < INTR_T1) { const s = t - INTR_T0; return 1 - (1 + INTR_W * s) * Math.exp(-INTR_W * s); }
    const s = t - INTR_T1, x0 = INTR_ST[0], v0 = INTR_ST[1]; return (x0 + (v0 + INTR_W * x0) * s) * Math.exp(-INTR_W * s);
  };
  const INTR_NAIVE = t => eo(seg(t, 1.0, 1.35)) * (1 - eio(seg(t, 1.35, 1.7)));
  CELLS[27] = ui((w, h, t) => {
    const p = INTR_P(t);
    const fx = 14, fy = 10, fw = 304, fh = 171;
    X.save(); rr(fx, fy, fw, fh, 12); X.clip();
    fillRR(30, 24, 70, 14, 4, C.mb); pageLines(30, 58, 272); fillRR(30, 122, 272, 46, 8, C.block);
    if (p > 0) {
      X.fillStyle = `rgba(18,20,28,${.36 * p})`; X.fillRect(fx, fy, fw, fh);
      const pw = 160, px = fx - pw + pw * p;
      shadowed(() => { X.fillStyle = '#fff'; X.fillRect(px, fy, pw, fh); }, 22, 0, .25);
      circle(px + 30, fy + 24, 12, C.mb); bar(px + 50, fy + 19, 80, C.line2, 10);
      for (let i = 0; i < 4; i++) { const y = fy + 48 + i * 30; if (i === 0) fillRR(px + 10, y - 2, pw - 20, 26, 6, C.lb); fillRR(px + 18, y + 4, 14, 14, 3, i === 0 ? C.blue : C.line2); bar(px + 40, y + 6, 70 + (i % 2) * 24, i === 0 ? C.sb : C.line); }
    }
    X.restore();
    strokeRR(fx, fy, fw, fh, 12, C.line2, 1.5);
    // 菜单按钮（三本线）
    X.strokeStyle = p > .02 ? C.blue : '#333'; X.lineWidth = 2.6; X.lineCap = 'round'; X.beginPath();
    for (let k = -1; k <= 1; k++) { X.moveTo(274, 31 + 7 * k); X.lineTo(294, 31 + 7 * k); } X.stroke();
    // 位置曲线面板
    const qx0 = 342, qx1 = 514, T0 = 0.9, T1 = 2.1, QX = s => lerp(qx0, qx1, (s - T0) / (T1 - T0)), QY = v => 146 - 84 * v;
    text('抽屉位置', 334, 20, 13, '#555', 700);
    X.fillStyle = C.line; X.fillRect(qx0, QY(0), qx1 - qx0, 1.2);
    X.save(); X.setLineDash([4, 3]); X.strokeStyle = '#a9a7a5'; X.lineWidth = 1.6; X.beginPath();
    for (let i = 0; i <= 60; i++) { const s = lerp(T0, T1, i / 60), x = QX(s), y = QY(INTR_NAIVE(s)); i ? X.lineTo(x, y) : X.moveTo(x, y); } X.stroke();
    X.setLineDash([2, 3]); X.strokeStyle = C.sb; X.lineWidth = 1.2; X.beginPath(); X.moveTo(QX(INTR_T1), 44); X.lineTo(QX(INTR_T1), QY(0)); X.stroke(); X.restore();
    text('再次点击', QX(INTR_T1) + 4, 40, 10, C.blue, 600);
    const fade = 1 - seg(t, 3.9, 4.2), te = Math.min(t, T1);
    if (t > T0 && fade > 0) {
      X.save(); X.globalAlpha = fade; X.strokeStyle = C.blue; X.lineWidth = 2.4; X.lineJoin = 'round'; X.beginPath();
      const n = Math.max(1, Math.ceil(60 * (te - T0) / (T1 - T0)));
      for (let i = 0; i <= n; i++) { const s = lerp(T0, te, i / n), x = QX(s), y = QY(INTR_P(s)); i ? X.lineTo(x, y) : X.moveTo(x, y); } X.stroke();
      circle(QX(te), QY(INTR_P(te)), 5, C.blue); ring(QX(te), QY(INTR_P(te)), 5, '#fff', 1.8);
      X.restore();
    }
    fillRR(334, 163, 16, 3, 1.5, C.blue); text('可打断：从当前位置折返', 356, 165, 10, '#555', 600);
    X.save(); X.setLineDash([4, 3]); X.strokeStyle = '#a9a7a5'; X.lineWidth = 1.6; X.beginPath(); X.moveTo(334, 179); X.lineTo(350, 179); X.stroke(); X.restore();
    text('不可打断：先开完再关', 356, 179, 10, '#9a9896', 600);
    pointer([[.3, w + 30, h + 30], [.95, 286, 36], [1.6, 286, 36], [2.3, w + 30, h + 30]], [1.0, 1.2], t);
  });

  // @element 29
  // 30 拖拽排序（Drag to reorder）
  // 4 行列表，行高 38、行距 44（y = 12 / 56 / 100 / 144）。光标 0.95 秒到第 1 行左侧把手，1.0 秒按下。
  // 抬起量 1.0–1.15 秒 easeOutCubic：拖动行放大到 1.04 倍、阴影模糊 4→20、下移 1→7px，边框变蓝。
  // 1.15–2.1 秒 easeInOutCubic 向下拖 88px（两个行距）；拖动行越过第 2、3 行的一半（22 / 66px）时，该行用 0.2 秒 easeOutCubic 上移 44px 让位，
  // 原位留下浅蓝虚线占位框。2.2 秒松手，2.2–2.4 秒抬起量回 0 落位。
  // 复位：3.4–3.9 秒 easeInOutCubic 所有行回到原顺序。
  const REORD_ITEMS = ['设计稿评审', '接口联调', '撰写周报', '发布上线'];
  const REORD_TAG = [C.blue, C.sb, C.mb, C.line2];
  const REORD_Y0 = 12, REORD_GAP = 44, REORD_H = 38;
  const REORD_DY = t => 88 * eio(seg(t, 1.15, 2.1));
  // 越过阈值的时刻：二分求解（只在加载时算一次）
  const REORD_TC = [1, 2].map(j => { const thr = REORD_GAP * (j - .5); let a = 1.15, b = 2.1; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (REORD_DY(m) < thr) a = m; else b = m; } return b; });
  CELLS[28] = ui((w, h, t) => {
    const back = eio(seg(t, 3.4, 3.9));
    const lift = eo(seg(t, 1.0, 1.15)) * (1 - eo(seg(t, 2.2, 2.4)));
    const row = (i, y, lf) => {
      const x = 24, rw = 494;
      X.save();
      if (lf > 0) { const cx = x + rw / 2, cy = y + REORD_H / 2, s = 1 + .04 * lf; X.translate(cx, cy); X.scale(s, s); X.translate(-cx, -cy); }
      shadowed(() => fillRR(x, y, rw, REORD_H, 8, '#fff'), 4 + 16 * lf, 1 + 6 * lf, .06 + .16 * lf);
      strokeRR(x, y, rw, REORD_H, 8, lf > .05 ? C.sb : C.line2, 1.5);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) circle(x + 16 + c * 6, y + 12 + r * 7, 1.8, lf > .05 ? C.blue : '#aaa');
      ring(x + 46, y + 19, 8, C.line2, 2);
      text(REORD_ITEMS[i], x + 64, y + 20, 14, C.ink, 600);
      fillRR(x + rw - 70, y + 12, 52, 14, 7, REORD_TAG[i]);
      X.restore();
    };
    const dragY = REORD_Y0 + (t < 3.4 ? REORD_DY(t) : 88 * (1 - back));
    const passed = REORD_TC.filter(c => t >= c).length;
    if (lift > 0) { const py = REORD_Y0 + REORD_GAP * passed; X.save(); X.globalAlpha = lift; fillRR(24, py, 494, REORD_H, 8, C.lb); X.setLineDash([5, 4]); strokeRR(24, py, 494, REORD_H, 8, C.sb, 1.5); X.restore(); }
    for (let i = 1; i < 4; i++) {
      let y = REORD_Y0 + i * REORD_GAP;
      if (i <= 2) { const sh = t < 3.4 ? eo(seg(t, REORD_TC[i - 1], REORD_TC[i - 1] + .2)) : 1 - back; y -= REORD_GAP * sh; }
      row(i, y, 0);
    }
    row(0, dragY, lift);
    let pos;
    if (t < 1.0) pos = track([[.3, w + 30, h + 30], [.95, 44, 33]], t);
    else if (t < 2.25) pos = [44, dragY + 21];
    else pos = track([[2.25, 44, dragY + 21], [2.9, w + 30, h + 30]], t);
    pointer([[0, pos[0], pos[1]]], [1.0, 2.2], t);
  });

  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});
