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
  const JP = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Hiragino Sans", sans-serif';   // 画面文字为简体中文：中文字体优先，日文字体作后备
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
    fillRR(24, 92, 120, 36, 8, C.blue); text('打开', 84, 110, 16, '#fff', 600, 'center');
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
    strokeRR(24, 14, 110, 34, 8, C.line2, 1.5); text('菜单', 79, 31, 15, '#555', 600, 'center');
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
    fillRR(186, 144, 170, 36, 18, C.blue); text('查看详情', 271, 162, 15, '#fff', 600, 'center');
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
    if (ph > 0) { X.globalAlpha = clamp(ph); text('请选择', 40, 53, 15, '#9a9896', 500); X.globalAlpha = 1; }
    if (chosen > 0) { X.globalAlpha = chosen; text('广州', 40, 53, 16, C.ink, 600); X.globalAlpha = 1; }
    chevron(262, 52, 5, Math.PI * open, '#777');
    fillRR(310, 34, 208, 70, 8, C.block); bar(310, 120, 208); bar(310, 138, 160); bar(24, 150, 200); bar(24, 168, 150);
    if (open > 0) {
      X.save(); X.globalAlpha = open; const oy = 78 - 6 * (1 - open);
      shadowed(() => fillRR(24, oy, 260, 112, 8, '#fff'), 18, 6, .18); strokeRR(24, oy, 260, 112, 8, C.border, 1);
      const hi = seg(t, 1.55, 1.75) > 0 ? (t < 1.95 ? 1 : 2) : -1;
      ['北京', '上海', '广州', '深圳'].forEach((s, i) => { const yy = oy + 4 + i * 26; if (i === hi + (hi === 1 ? 0 : 0) && hi >= 0) fillRR(28, yy, 252, 26, 5, C.lb); text(s, 40, yy + 13, 15, i === hi ? C.blue : '#444', i === hi ? 600 : 500); });
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
      text('显示简短说明', 196, yy + 18, 15, '#fff', 600, 'center'); X.restore();
    }
    // 乗せるだけ（クリックしない）
    pointer([[.3, w + 30, h + 30], [1.05, 200, 126], [3.15, 200, 126], [4.1, w + 30, h + 30]], [], t);
  });

  // @element 07
  // 07 ポップオーバー（Popover）
  CELLS[6] = ui((w, h, t) => {
    pageLines(24, 16, 494);
    strokeRR(24, 112, 108, 36, 8, C.blue, 2); text('详情', 78, 130, 15, C.blue, 600, 'center');
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
      text('已保存', tx + 46, ty + 24, 15, '#fff', 600);
      const life = 1 - seg(t, 1.4, 3.2); fillRR(tx + 10, ty + th - 7, (tw0 - 20) * life, 3, 1.5, C.sb);
    }
    pointer([[.3, -30, h + 30], [.95, 84, 168], [1.5, 84, 168], [2.2, -40, h + 40]], [1.0], t);
  });

  // @element 09
  // 09 タブ（Tabs）
  CELLS[8] = ui((w, h, t) => {
    const labs = ['概览', '价格', '评价'], xs = [24, 114, 204], ws = [70, 70, 100];
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
    ['日', '周', '月'].forEach((s, i) => { const near = 1 - clamp(Math.abs(pos - i)); text(s, sx + cw * i + cw / 2, sy + sh / 2 + 1, 17, near > .5 ? '#fff' : '#6d6b69', 700, 'center'); });
    const sets = [[30, 55, 40, 70, 50, 85, 60], [60, 40, 90, 75, 100, 55, 80], [95, 70, 110, 60, 85, 115, 100]];
    const fi = Math.floor(pos), fr = pos - fi, gi = Math.min(2, fi + 1);
    X.fillStyle = C.line; X.fillRect(60, 182, 422, 1.5);
    for (let k = 0; k < 7; k++) { const bh = lerp(sets[fi][k], sets[gi][k], eio(fr)); fillRR(72 + k * 58, 180 - bh, 34, bh, 5, k === 5 ? C.blue : C.mb); }
    pointer([[.3, w + 30, h + 30], [.95, 276, 36], [1.6, 276, 36], [2.05, 376, 36], [2.8, 376, 36], [3.25, 176, 36], [3.7, 176, 36], [4.25, w + 30, h + 30]], [1.0, 2.1, 3.3], t);
  });

  // @element 13
  // 13 チップ（Filter chips）
  CELLS[12] = ui((w, h, t) => {
    const chips = ['全部', '最新', '热门', '免费']; let x = 24; const pos = [];
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
    text('价格', 24, 26, 16, '#555', 700);
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
    text('首页', x, y, 17, C.blue, 600); x += tw('首页', 17, 600) + 10; text('›', x, y, 17, '#aaa', 500); x += 18;
    const kx = x, kw = tw('课程', 17, 700);
    const hoverK = t > .9 && t < 1.2;
    text('课程', x, y, 17, up > .5 ? C.ink : C.blue, up > .5 ? 700 : 600); if (hoverK) { X.fillStyle = C.blue; X.fillRect(x, y + 12, kw, 2); }
    x += kw + 10;
    X.globalAlpha = 1 - up; text('›', x, y, 17, '#aaa', 500); text('网页制作', x + 18, y, 17, C.ink, 700); X.globalAlpha = 1;
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
    const nav = [['产品', 190], ['价格', 262], ['支持', 334]];
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
    const xs = [80, 207, 334, 461], labs = ['填写', '确认', '支付', '完成'];
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
    fillRR(w - 24 - 110, 142, 110, 38, 8, C.blue); text('下一步', w - 24 - 55, 161, 16, '#fff', 600, 'center');
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
    fillRR(w / 2 - 60, 140, 120, 40, 8, C.blue); text('发送', w / 2, 160, 16, '#fff', 600, 'center');
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
      text('暂无内容', w / 2, cy + 40, 16, '#555', 600, 'center');
      fillRR(w / 2 - 56, cy + 62, 112, 34, 8, C.blue); text('添加', w / 2, cy + 79, 15, '#fff', 600, 'center');
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

  // @element 30
  // 改写自 ui2v · illli Ai Studio · hero-otp-fill（MIT-0）
  // 验证码逐格填入：深色底上 6 个验证码格，数字 8 4 2 9 1 6 每隔 0.35 秒依次填入一格（0.95 / 1.30 / 1.65 / 2.00 / 2.35 / 2.70 秒，瞬时出现），
  // 刚填的格描边变蓝 #60a5fa 并带 3.3px 浅蓝外圈，其余格回到灰边；未填格不透明度 0.55，填后为 1。
  // 3.2 秒 6 格同时亮蓝边，提示由「验证码已发送至 ····4821」（#6b7280）换成「已验证 · 正在继续」（#60a5fa）；
  // 3.4–3.95 秒整组以 sine.inOut 上浮 4.4px。复位：3.95–4.35 秒 easeInOutCubic 数字淡出、蓝边与上浮退回，4.35–4.5 秒停在空白初始画面。
  // 尺寸换算：原作 1920×1080 中的格子组按 0.55 倍放到卡片中央（格 120×140→66×77、间距 24→13.2、圆角 20→11、数字 64→35px、提示 26→14px），
  // 去掉顶部标题区，提示上移到格子下方 30px。时间与原作 4.5 秒一一对应，原作 1.0 秒的上浮缩到 0.55 秒以留出复位段。
  // 配色取原作：底 #1f2937→#111827 径向渐变，格 #1f2937 / 边 #374151，数字 #f9fafb。
  const OTP_DIG = ['8', '4', '2', '9', '1', '6'];
  const OTP_S = 0.55;
  const OTP_SINE = x => -(Math.cos(Math.PI * x) - 1) / 2;
  const OTP_MIX = (a, b, k) => { const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; };
  CELLS[29] = ui((w, h, t) => {
    const g = X.createRadialGradient(w * .5, h * .4, 0, w * .5, h * .4, w * .62);
    g.addColorStop(0, '#1f2937'); g.addColorStop(1, '#111827'); X.fillStyle = g; X.fillRect(0, 0, w, h);
    const keep = 1 - eio(seg(t, 3.95, 4.35));
    const dy = -8 * OTP_S * OTP_SINE(seg(t, 3.4, 3.95)) * keep;
    const cw = 66, ch = 77, gap = 13.2, x0 = (w - (6 * cw + 5 * gap)) / 2, y0 = 36 + dy;
    const done = t >= 3.2;
    let cur = -1; for (let i = 0; i < 6; i++) if (t >= 0.95 + i * 0.35) cur = i;
    for (let i = 0; i < 6; i++) {
      const x = x0 + i * (cw + gap), filled = i <= cur, on = done || i === cur;
      const a = filled ? lerp(.55, 1, keep) : .55;
      X.save(); X.globalAlpha = a;
      X.save(); X.shadowColor = 'rgba(0,0,0,.25)'; X.shadowBlur = 22; X.shadowOffsetY = 8.8; fillRR(x, y0, cw, ch, 11, '#1f2937'); X.restore();
      const onK = on ? keep : 0;
      if (onK > 0) strokeRR(x - 1.65, y0 - 1.65, cw + 3.3, ch + 3.3, 12.65, `rgba(96,165,250,${.18 * onK})`, 3.3);
      strokeRR(x, y0, cw, ch, 11, OTP_MIX('#374151', '#60a5fa', onK), 1.2);
      if (filled) { X.globalAlpha = a * keep; text(OTP_DIG[i], x + cw / 2, y0 + ch / 2 + 1, 35, '#f9fafb', 700, 'center', NUMF); }
      X.restore();
    }
    const hy = 150 + dy;
    if (!done) text('验证码已发送至 ····4821', w / 2, hy, 14, '#6b7280', 500, 'center');
    else {
      X.save(); X.globalAlpha = 1 - keep; text('验证码已发送至 ····4821', w / 2, hy, 14, '#6b7280', 500, 'center');
      X.globalAlpha = keep; text('已验证 · 正在继续', w / 2, hy, 14, '#60a5fa', 600, 'center'); X.restore();
    }
  });

  // @element 31
  // 改写自 ui2v · illli Ai Studio · hero-password-meter（MIT-0）
  // 密码强度条：「新密码」卡片里，密码框圆点从 4 个依次增到 8 / 12 / 16 个（1.00 / 1.55 / 2.15 秒），
  // 下方 4 段强度条随之逐段着色：1.05 秒红 #ef4444「弱」、1.60 秒橙 #f59e0b「一般」、2.20 秒黄绿 #84cc16「良好」、2.75 秒绿 #22c55e「强」，
  // 每段颜色过渡 0.25 秒（末段 0.3 秒），缓动 power1.out（二次缓出）；左下强度文字同步换字换色，右下固定「至少 12 位 · 大小写混合」。
  // 3.2–3.95 秒卡片以 sine.inOut 上浮 4.4px。复位：3.95–4.35 秒 easeInOutCubic 多出的圆点淡出、四段退回灰 #44403c、强度文字回到初始琥珀色「弱」。
  // 尺寸换算：原作右侧 780 宽卡片按 0.55 倍居中（卡 780→429 宽、圆角 28→15.4、密码框高 88→48.4、强度条高 14→7.7、段间距 12→6.6、
  // 文字 22/34/24→12/19/13px），去掉左侧标题区，卡片上下内边距 48→22 以装进 191 高。时间与原作一一对应，上浮由 1.2 秒缩到 0.75 秒。
  // 配色取原作：底 #292524→#1c1917，卡 #292524 / 边 #44403c，密码框 #1c1917 / 边 #57534c。
  const PWD_S = 0.55;
  const PWD_SEG = [[1.05, .25, '#ef4444'], [1.6, .25, '#f59e0b'], [2.2, .25, '#84cc16'], [2.75, .3, '#22c55e']];
  const PWD_LV = [['弱', '#fbbf24'], ['弱', '#ef4444'], ['一般', '#f59e0b'], ['良好', '#84cc16'], ['强', '#22c55e']];
  const PWD_SINE = x => -(Math.cos(Math.PI * x) - 1) / 2;
  const PWD_MIX = (a, b, k) => { const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; };
  CELLS[30] = ui((w, h, t) => {
    const g = X.createRadialGradient(w * .3, h * .4, 0, w * .3, h * .4, w * .65);
    g.addColorStop(0, '#292524'); g.addColorStop(1, '#1c1917'); X.fillStyle = g; X.fillRect(0, 0, w, h);
    const keep = 1 - eio(seg(t, 3.95, 4.35));
    const dy = -8 * PWD_S * PWD_SINE(seg(t, 3.2, 3.95)) * keep;
    const cw = 429, chh = 169, cx = (w - cw) / 2, cy = (h - chh) / 2 + dy, px = 28.6;
    X.save(); X.shadowColor = 'rgba(0,0,0,.35)'; X.shadowBlur = 38; X.shadowOffsetY = 15; fillRR(cx, cy, cw, chh, 15.4, '#292524'); X.restore();
    strokeRR(cx, cy, cw, chh, 15.4, '#44403c', 1);
    text('新密码', cx + px, cy + 29, 12, '#a8a29e', 500);
    // 密码框与圆点
    const fx = cx + px, fy = cy + 45, fw = cw - 2 * px, fh = 48.4;
    fillRR(fx, fy, fw, fh, 8.8, '#1c1917'); strokeRR(fx, fy, fw, fh, 8.8, '#57534c', 1.1);
    const n = t >= 2.15 ? 16 : t >= 1.55 ? 12 : t >= 1.0 ? 8 : 4;
    for (let i = 0; i < n; i++) { X.save(); X.globalAlpha = i < 4 ? 1 : keep; circle(fx + 21.4 + i * 13.5, fy + fh / 2, 3.2, '#fafaf9'); X.restore(); }
    // 四段强度条
    const sw = (fw - 3 * 6.6) / 4, sy = fy + fh + 19.8;
    let lv = 0;
    PWD_SEG.forEach(([t0, d, col], i) => {
      const q = seg(t, t0, t0 + d), p = 1 - (1 - q) * (1 - q);
      if (t >= t0) lv = i + 1;
      fillRR(fx + i * (sw + 6.6), sy, sw, 7.7, 3.85, PWD_MIX('#44403c', col, p * keep));
    });
    const my = sy + 7.7 + 19;
    X.save(); X.globalAlpha = keep; text(PWD_LV[lv][0], fx, my, 13.2, PWD_LV[lv][1], 700);
    X.globalAlpha = 1 - keep; text(PWD_LV[0][0], fx, my, 13.2, PWD_LV[0][1], 700); X.restore();
    text('至少 12 位 · 大小写混合', fx + fw, my, 13.2, '#a8a29e', 500, 'right');
  });

  // @element 32
  // 改写自 ui2v · illli Ai Studio · hero-upload-drop（MIT-0）
  // 拖拽上传：浅绿渐变底上一块虚线上传区（左侧图标「↑」+「将文件包拖到这里」+ 文件清单），
  // 1.0–1.7 秒文件卡「hero-pack.zip」从上方落入（下移 100px、不透明度 0→1、缩放 0.96→1，power3.out 即三次缓出）；
  // 1.5 秒上传区变为激活态（虚线 #34d399 换成实线 #059669，底由 72% 白变纯白）；
  // 1.6–3.4 秒进度条 0→100%，power1.inOut（二次缓入缓出），百分比同步取整；3.45 秒文字变为「100% · 可以发布」（#047857）。
  // 3.5–3.95 秒上传区以 sine.inOut 上浮 4px。复位：3.95–4.35 秒 easeInOutCubic 文件卡淡出、上传区退回虚线态。
  // 尺寸换算：原作 780×680 竖向上传区改为横向 510×167 铺满卡片，文字与文件卡按 0.5 倍（文件卡 420×160→210×80、图标 120→52、
  // 标题 40→20px、说明 26→13px、文件名 28→14px），图标与文字放左半，文件卡落在右半；下落距离 200→100px。时间与原作一一对应，上浮由 0.9 秒缩到 0.45 秒。
  const UPL_S = 0.5;
  const UPL_SINE = x => -(Math.cos(Math.PI * x) - 1) / 2;
  CELLS[31] = ui((w, h, t) => {
    // 165deg 线性渐变：方向 (sin165°, −cos165°)，渐变线长 |w·sin|+|h·cos|
    const dx = Math.sin(165 * Math.PI / 180), dyy = -Math.cos(165 * Math.PI / 180), L = Math.abs(w * dx) + Math.abs(h * dyy);
    const g = X.createLinearGradient(w / 2 - dx * L / 2, h / 2 - dyy * L / 2, w / 2 + dx * L / 2, h / 2 + dyy * L / 2);
    g.addColorStop(0, '#ecfdf5'); g.addColorStop(.45, '#d1fae5'); g.addColorStop(1, '#f0fdf4'); X.fillStyle = g; X.fillRect(0, 0, w, h);
    const keep = 1 - eio(seg(t, 3.95, 4.35));
    const oy = -8 * UPL_S * UPL_SINE(seg(t, 3.5, 3.95)) * keep;
    const act = (t >= 1.5 ? 1 : 0) * keep;
    const zx = 16, zy = 12 + oy, zw = 510, zh = 167, zr = 16;
    X.save(); X.shadowColor = 'rgba(6,78,59,.1)'; X.shadowBlur = 30; X.shadowOffsetY = 12; fillRR(zx, zy, zw, zh, zr, `rgba(255,255,255,${.72 + .28 * act})`); X.restore();
    if (act < 1) { X.save(); X.globalAlpha = 1 - act; X.setLineDash([7, 5]); strokeRR(zx, zy, zw, zh, zr, '#34d399', 1.5); X.restore(); }
    if (act > 0) { X.save(); X.globalAlpha = act; strokeRR(zx, zy, zw, zh, zr, '#059669', 1.5); X.restore(); }
    // 左半：图标 + 标题 + 文件清单
    const lx = 152;
    fillRR(lx - 26, zy + 20, 52, 52, 12, '#d1fae5'); text('↑', lx, zy + 47, 28, '#059669', 700, 'center', NUMF);
    text('将文件包拖到这里', lx, zy + 98, 20, '#064e3b', 700, 'center');
    text('registry-item.json · index.html · assets/', lx, zy + 126, 13, '#059669', 500, 'center', NUMF);
    // 右半：文件卡下落
    const q = eo(seg(t, 1.0, 1.7)), fa = q * keep;
    if (fa > 0) {
      const fw = 210, fh = 81, fx = 296, fy = zy + 43 - 100 * (1 - q), s = .96 + .04 * q;
      X.save(); X.globalAlpha = fa; X.translate(fx + fw / 2, fy + fh / 2); X.scale(s, s); X.translate(-fx - fw / 2, -fy - fh / 2);
      X.save(); X.shadowColor = 'rgba(6,78,59,.16)'; X.shadowBlur = 20; X.shadowOffsetY = 9; fillRR(fx, fy, fw, fh, 9, '#fff'); X.restore();
      strokeRR(fx, fy, fw, fh, 9, '#a7f3d0', 1);
      text('hero-pack.zip', fx + 15, fy + 24, 14, '#064e3b', 700, 'left', NUMF);
      const v = seg(t, 1.6, 3.4), p = v < .5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
      if (t >= 3.45) text('100% · 可以发布', fx + 15, fy + 46, 11, '#047857', 500);
      else text(Math.round(p * 100) + '% · 上传中', fx + 15, fy + 46, 11, '#6ee7b7', 500);
      fillRR(fx + 15, fy + 61, fw - 30, 5, 2.5, '#d1fae5');
      if (p > 0) fillRR(fx + 15, fy + 61, (fw - 30) * p, 5, 2.5, '#059669');
      X.restore();
    }
  });

  // @element 33
  // 改写自 ui2v · illli Ai Studio · hero-keymap-press（MIT-0）
  // 快捷键逐键点亮：深色键盘板上三枚键 Ctrl / Shift / P，1.10 / 1.45 / 1.85 秒依次按下并保持：
  // 键面由 #292524 变琥珀 #fbbf24、边 #f59e0b，键身下沉 2.5px，底部投影由 5px 黑 #0c0a09 缩成 2.5px 棕 #92400e（瞬时切换）。
  // 下方提示：「按下即可发布」→ 1.45 秒「Ctrl + Shift + P」（Ctrl 琥珀）→ 1.85 秒整组琥珀「Ctrl + Shift + P · 发布」→ 2.6 秒「已排队 · hero-keymap-press@1.0.0」。
  // 2.2–2.6 秒键盘板以中心放大到 1.02 倍再回到 1（每程 0.2 秒，power1.out 往返）；3.2–3.95 秒板以 sine.inOut 上浮 5px。
  // 复位：3.95–4.35 秒 easeInOutCubic 三键同时抬起、提示交叉淡回「按下即可发布」。
  // 尺寸换算：原作键盘板按 0.62 倍（键 140/88×88→87/55×55、键距 14→8.7、圆角 14→8.7、键字 22/28→13.6/17.4px、提示 28→17.4px），
  // 板宽 980 收窄到 510 铺满卡片，去掉左侧标题区。时间与原作一一对应，上浮由 1.2 秒缩到 0.75 秒。
  const KEYS_S = 0.62;
  const KEYS_DEF = [['Ctrl', 87, 1.1], ['Shift', 87, 1.45], ['P', 55, 1.85]];
  const KEYS_SINE = x => -(Math.cos(Math.PI * x) - 1) / 2;
  const KEYS_MIX = (a, b, k) => { const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; };
  CELLS[32] = ui((w, h, t) => {
    X.fillStyle = '#fafaf9'; X.fillRect(0, 0, w, h);
    const keep = 1 - eio(seg(t, 3.95, 4.35));
    const dy = -8 * KEYS_S * KEYS_SINE(seg(t, 3.2, 3.95)) * keep;
    // 往返（yoyo）：上程 power1.out 放大到 1.02，回程为其倒放
    const pu = seg(t, 2.2, 2.4), pd = seg(t, 2.4, 2.6);
    const s = t < 2.2 || t >= 2.6 ? 1 : t < 2.4 ? 1 + .02 * (1 - (1 - pu) * (1 - pu)) : 1 + .02 * (1 - pd * pd);
    const bx = 16, by = 11.5 + dy, bw = 510, bh = 168;
    X.save(); X.translate(w / 2, by + bh / 2); X.scale(s, s); X.translate(-w / 2, -(by + bh / 2));
    X.save(); X.shadowColor = 'rgba(28,25,23,.2)'; X.shadowBlur = 43; X.shadowOffsetY = 17; fillRR(bx, by, bw, bh, 17, '#1c1917'); X.restore();
    const gap = 8.7, kh = 55, rowW = KEYS_DEF.reduce((a, d) => a + d[1], 0) + gap * 2;
    let kx = (w - rowW) / 2; const ky = by + 30;
    KEYS_DEF.forEach(([lab, kw, t0]) => {
      const p = (t >= t0 ? 1 : 0) * keep, ty = 2.48 * p, sh = 4.96 - 2.48 * p;
      fillRR(kx, ky + ty + sh, kw, kh, 8.7, KEYS_MIX('#0c0a09', '#92400e', p));
      fillRR(kx, ky + ty, kw, kh, 8.7, KEYS_MIX('#292524', '#fbbf24', p));
      strokeRR(kx + .6, ky + ty + .6, kw - 1.2, kh - 1.2, 8.1, KEYS_MIX('#44403c', '#f59e0b', p), 1.24);
      text(lab, kx + kw / 2, ky + ty + kh / 2 + 1, lab.length > 1 ? 13.6 : 17.4, KEYS_MIX('#e7e5e4', '#1c1917', p), 700, 'center', NUMF);
      kx += kw + gap;
    });
    // 提示行：分段着色，整体居中
    const cy = by + 137, A = '#fbbf24', G = '#a8a29e';
    const line = (parts, alpha) => {
      X.save(); X.globalAlpha = alpha;
      const tot = parts.reduce((a, [s0]) => a + tw(s0, 17.4, 600, NUMF), 0); let x = (w - tot) / 2;
      parts.forEach(([s0, c, wt]) => { text(s0, x, cy, 17.4, c, wt, 'left', NUMF); x += tw(s0, 17.4, 600, NUMF); });
      X.restore();
    };
    const init = [['按下即可发布', G, 600]];
    const cur = t >= 2.6 ? [['已排队 · hero-keymap-press@1.0.0', A, 600]]
      : t >= 1.85 ? [['Ctrl + Shift + P', A, 600], [' · 发布', G, 600]]
      : t >= 1.45 ? [['Ctrl', A, 600], [' + Shift + P', G, 600]] : init;
    if (cur === init) line(init, 1); else { line(cur, keep); line(init, 1 - keep); }
    X.restore();
  });

  // @element 34
  // 改写自 ui2v · illli Ai Studio · hero-diff-highlight（MIT-0）
  // 代码差异高亮：深色编辑器「motions.ts」中 5 行代码，上下文行（41 / 43 / 44）0.7–1.1 秒由 35% 亮到 100%；
  // 删除行「- if (count >= limit) …」1.2–1.65 秒、新增行「+ if (!isStaff && …) …」1.75–2.2 秒依次淡入并从左 6.4px 滑到原位（power2.out 即二次缓出），
  // 删除行底 rgba(239,68,68,.12)、字 #fecaca，新增行底 rgba(16,185,129,.14)、字 #a7f3d0；
  // 2.4–2.75 秒新增行底加深到 .28，2.85–3.3 秒回到 .14（各 power1.out）。3.2–3.95 秒编辑器以 sine.inOut 上浮 4.2px。
  // 复位：3.95–4.35 秒 easeInOutCubic 删除行与新增行淡出、上下文行回到 35%。
  // 尺寸换算：原作 980 宽编辑器按 0.53 倍铺满卡片（510×173，标题栏 56→29.7、字号 28→14.8px、行高 47.6→25.2、行左右内边距 36→19），
  // 代码区上下内边距 36→9 以装进 191 高，去掉左侧标题区。时间与原作一一对应，上浮由 1.2 秒缩到 0.75 秒。
  const DIFF_S = 0.53;
  const DIFF_MONO = 'Menlo, Consolas, "Courier New", monospace';
  const DIFF_LINES = [
    ['41', ' ', 'const limit = hourlyNewMotionLimit;', 0],
    ['42', '-', 'if (count >= limit) throw rateLimit;', 'del'],
    ['42', '+', 'if (!isStaff && count >= limit) throw rateLimit;', 'add'],
    ['43', ' ', 'return await insertMotion(ctx, args);', 0],
    ['44', ' ', '}', 0]];
  const DIFF_SINE = x => -(Math.cos(Math.PI * x) - 1) / 2;
  CELLS[33] = ui((w, h, t) => {
    X.fillStyle = '#0c0f14'; X.fillRect(0, 0, w, h);
    const keep = 1 - eio(seg(t, 3.95, 4.35));
    const q1 = x => 1 - (1 - x) * (1 - x);
    const dy = -8 * DIFF_S * DIFF_SINE(seg(t, 3.2, 3.95)) * keep;
    const ex = 16, ey = 9 + dy, ew = 510, eh = 173, er = 10.6;
    X.save(); X.shadowColor = 'rgba(0,0,0,.45)'; X.shadowBlur = 37; X.shadowOffsetY = 15; fillRR(ex, ey, ew, eh, er, '#111827'); X.restore();
    X.save(); rr(ex, ey, ew, eh, er); X.clip();
    X.fillStyle = '#0b1220'; X.fillRect(ex, ey, ew, 29.7); X.fillStyle = '#1f2937'; X.fillRect(ex, ey + 29.2, ew, 1);
    ['#f87171', '#fbbf24', '#34d399'].forEach((c, i) => circle(ex + 14.9 + i * 11.7, ey + 14.85, 3.2, c));
    text('motions.ts', ex + 14.9 + 2 * 11.7 + 3.2 + 7.4, ey + 15, 10.6, '#6b7280', 500, 'left', NUMF);
    const ctxA = lerp(.35, lerp(.35, 1, q1(seg(t, 0.7, 1.1))), keep);
    const enter = [0, q1(seg(t, 1.2, 1.65)), q1(seg(t, 1.75, 2.2)), 0, 0];
    const addBg = .14 + .14 * q1(seg(t, 2.4, 2.75)) - .14 * q1(seg(t, 2.85, 3.3));
    DIFF_LINES.forEach(([ln, mk, code, kind], i) => {
      const ly = ey + 29.7 + 9 + i * 25.2, a = kind ? enter[i] * keep : ctxA, ox = kind ? -6.4 * (1 - enter[i]) : 0;
      if (a <= 0) return;
      X.save(); X.globalAlpha = a; X.translate(ox, 0);
      if (kind === 'del') { X.fillStyle = 'rgba(239,68,68,.12)'; X.fillRect(ex, ly, ew, 25.2); }
      if (kind === 'add') { X.fillStyle = `rgba(16,185,129,${addBg})`; X.fillRect(ex, ly, ew, 25.2); }
      const col = kind === 'del' ? '#fecaca' : kind === 'add' ? '#a7f3d0' : '#d1d5db', my = ly + 12.6;
      text(ln, ex + 38, my, 14.8, '#4b5563', 400, 'right', DIFF_MONO);
      text(mk, ex + 52.8, my, 14.8, col, 400, 'left', DIFF_MONO);
      text(code, ex + 77.1, my, 14.8, col, 400, 'left', DIFF_MONO);
      X.restore();
    });
    X.restore();
    strokeRR(ex, ey, ew, eh, er, '#1f2937', 1);
  });

  // @element 35
  // 改写自 ui2v · illli Ai Studio · hero-deploy-pipeline（MIT-0）
  // 部署流水线：深色底上 4 个阶段卡 Lint → Test → Build → Deploy 依次变绿：
  // 0.85 秒阶段 01「运行中…」→ 1.25 秒「通过 · 0 个错误」；1.70 秒阶段 02 运行 → 2.15 秒「通过 · 128 项测试」；
  // 2.60 秒阶段 03 运行 → 3.05 秒「产物就绪」；3.50 秒阶段 04 直接「已上线 ui2v.com」。
  // 通过时卡片描边变绿 #16a34a、右上圆点亮 #22c55e 带光晕、状态字转绿加粗（瞬时）；每段通过后 0.05 秒起，连接线 0.35 秒（power1.out）由 0 填满到下一阶段。
  // 3.6–3.95 秒整排以 sine.inOut 上浮 2.5px。复位：3.95–4.35 秒 easeInOutCubic 绿色描边、圆点、连接线与状态字退回「排队中」。
  // 尺寸换算：原作 1640 宽四列按 510/1640≈0.311 横向换算（卡 389→117 宽、间距 28→14），卡高 280→124；
  // 文字放大以保证可读（阶段名 22→9px、标题 36→18px、状态 24→10px）；连接线保留原作位置关系：
  // 原作连接线行左右各留 12.5% 内边距，每条从本卡约 53% 处画到下一卡约 46% 处（卡中心到卡中心），压在卡片之上，
  // 竖向位于卡高 50%、标题与状态之间（此处卡高 124 → y 偏移 70），线高 4→2px。时间与原作一一对应，上浮由 0.85 秒缩到 0.35 秒。
  const PIPE_S = 510 / 1640;
  const PIPE_ST = [
    ['阶段 01', 'Lint', 0.85, 1.25, '通过 · 0 个错误'],
    ['阶段 02', 'Test', 1.7, 2.15, '通过 · 128 项测试'],
    ['阶段 03', 'Build', 2.6, 3.05, '产物就绪'],
    ['阶段 04', 'Deploy', null, 3.5, '已上线 ui2v.com']];
  const PIPE_BAR = [[.527, .46], [.532, .465], [.537, .47]];
  const PIPE_SINE = x => -(Math.cos(Math.PI * x) - 1) / 2;
  const PIPE_MIX = (a, b, k) => { const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; };
  CELLS[34] = ui((w, h, t) => {
    const g = X.createRadialGradient(w * .5, h * .35, 0, w * .5, h * .35, w * .6);
    g.addColorStop(0, '#0f172a'); g.addColorStop(1, '#020617'); X.fillStyle = g; X.fillRect(0, 0, w, h);
    const keep = 1 - eio(seg(t, 3.95, 4.35));
    const dy = -8 * PIPE_S * PIPE_SINE(seg(t, 3.6, 3.95)) * keep;
    const sw = 117, gap = 14, sh = 124, x0 = 16, y0 = (h - sh) / 2 + dy, SX = i => x0 + i * (sw + gap);
    PIPE_ST.forEach(([h4, name, tr, tp, ok], i) => {
      const x = SX(i), p = (t >= tp ? 1 : 0) * keep, run = tr !== null && t >= tr && t < tp;
      fillRR(x, y0, sw, sh, 8, '#0f172a');
      if (p > 0) strokeRR(x - 1, y0 - 1, sw + 2, sh + 2, 9, `rgba(34,197,94,${.35 * p})`, 1);
      strokeRR(x, y0, sw, sh, 8, PIPE_MIX('#1e293b', '#16a34a', p), 1);
      if (p > 0) { X.save(); X.shadowColor = `rgba(34,197,94,${.7 * p})`; X.shadowBlur = 5; circle(x + sw - 14, y0 + 20, 4.5, PIPE_MIX('#334155', '#22c55e', p)); X.restore(); }
      else circle(x + sw - 14, y0 + 20, 4.5, '#334155');
      text(h4, x + 11, y0 + 21, 9, '#64748b', 600);
      text(name, x + 11, y0 + 52, 18, '#e2e8f0', 700, 'left', NUMF);
      const sy = y0 + 98;
      if (t >= tp) {
        X.save(); X.globalAlpha = keep; text(ok, x + 11, sy, 10, '#22c55e', 700);
        X.globalAlpha = 1 - keep; text('排队中', x + 11, sy, 10, '#64748b', 500); X.restore();
      } else text(run ? '运行中…' : '排队中', x + 11, sy, 10, '#64748b', 500);
    });
    // 连接线：画在卡片之上（与原作层级一致）
    PIPE_BAR.forEach(([fa, fb], i) => {
      const a = SX(i) + fa * sw, b = SX(i + 1) + fb * sw, by = y0 + 70;
      fillRR(a, by - 1, b - a, 2, 1, '#1e293b');
      const q = seg(t, PIPE_ST[i][3] + .05, PIPE_ST[i][3] + .4), p = (1 - (1 - q) * (1 - q)) * keep;
      if (p > 0) { X.fillStyle = '#22c55e'; X.fillRect(a, by - 1, (b - a) * p, 2); }
    });
  });

  // @element 36
  // 改写自 KittenJam Motion Library #215 价格方案切换：顶部 160×30「月付 / 年付」胶囊开关，三张 150×124 价格卡（间距 18）。
  // 光标 1.0 秒点「年付」：滑块 0.3 秒 easeInOut 3 次方右移，三张卡价格数字依次（间隔 0.08 秒、各 0.4 秒）向上滚动到新值
  // （¥29/59/99 → ¥23/47/79），中间推荐卡 0.35 秒放大到 1.06 并描蓝边 2px，开关旁「省 20%」淡入。3.2 秒点「月付」全部反向切回。
  const PRICE_M = [29, 59, 99], PRICE_Y = [23, 47, 79], PRICE_NAME = ['基础版', '专业版', '团队版'];
  CELLS[35] = ui((w, h, t) => {
    X.fillStyle = C.bg; X.fillRect(0, 0, w, h);
    const yr = eio(seg(t, 1.0, 1.3)) * (1 - eio(seg(t, 3.2, 3.5)));
    const tx = 191, ty = 10, tw0 = 160, th = 30;
    fillRR(tx, ty, tw0, th, 15, '#fff'); strokeRR(tx, ty, tw0, th, 15, C.border, 1);
    fillRR(tx + 3 + 77 * yr, ty + 3, 77, 24, 12, C.blue);
    text('月付', tx + 41.5, ty + 15, 13, yr < .5 ? '#fff' : C.en, 600, 'center');
    text('年付', tx + 118.5, ty + 15, 13, yr >= .5 ? '#fff' : C.en, 600, 'center');
    X.save(); X.globalAlpha = yr; fillRR(tx + tw0 + 10, ty + 6, 54, 18, 9, C.lb); text('省 20%', tx + tw0 + 37, ty + 15, 11, C.blue, 700, 'center'); X.restore();
    // 当前滚动方向：去程月→年，回程年→月
    const back = t >= 2.2, t0 = back ? 3.2 : 1.0;
    for (let i = 0; i < 3; i++) {
      const x = 28 + i * 168, y = 54, cw = 150, ch = 124;
      const rec = i === 1 ? eio(seg(t, 1.0, 1.35)) * (1 - eio(seg(t, 3.2, 3.55))) : 0;
      const s = 1 + 0.06 * rec;
      X.save(); X.translate(x + cw / 2, y + ch / 2); X.scale(s, s); X.translate(-x - cw / 2, -y - ch / 2);
      shadowed(() => fillRR(x, y, cw, ch, 10, '#fff'), 12 + 10 * rec, 3, .08 + .1 * rec);
      if (rec > 0) strokeRR(x, y, cw, ch, 10, `rgba(31,90,232,${rec})`, 2);
      text(PRICE_NAME[i], x + 14, y + 20, 12, C.en, 600);
      if (i === 1) { fillRR(x + cw - 50, y + 11, 38, 18, 9, C.lb); text('推荐', x + cw - 31, y + 20, 10, C.blue, 700, 'center'); }
      // 价格数字滚动：旧值向上滚出、新值从下滚入，裁在一行高度内
      const q = eio(seg(t, t0 + .1 + i * .08, t0 + .5 + i * .08));
      const from = back ? PRICE_Y[i] : PRICE_M[i], to = back ? PRICE_M[i] : PRICE_Y[i];
      text('¥', x + 14, y + 54, 14, C.ink, 700, 'left', NUMF);
      X.save(); X.beginPath(); X.rect(x + 26, y + 38, 70, 32); X.clip();
      text(String(from), x + 27, y + 54 - 30 * q, 26, C.ink, 800, 'left', NUMF);
      text(String(to), x + 27, y + 54 + 30 * (1 - q), 26, C.ink, 800, 'left', NUMF);
      X.restore();
      text('/ 月', x + 64, y + 58, 11, C.hint, 500);
      bar(x + 14, y + 82, 110, C.line, 7); bar(x + 14, y + 96, 84, C.line, 7);
      X.restore();
    }
    pointer([[0, w + 30, h + 30], [.9, tx + 118, ty + 17], [1.6, tx + 118, ty + 17], [3.0, tx + 42, ty + 17], [3.6, tx + 42, ty + 17], [4.4, w + 30, h + 30]], [1.0, 3.2], t);
  });

  // @element 37
  // 改写自 KittenJam Motion Library #250 水滴单选：竖排 4 个选项（行距 38，外圈半径 10、选中点半径 5.5）。
  // 光标在 0.8 / 1.7 / 2.6 / 3.5 秒依次点第 2 / 3 / 4 / 1 项；选中点 0.45 秒内从旧圆心移到新圆心：
  // 头部按 easeOut 3 次方先到、尾部按 easeInOut 3 次方后到，中间连成渐细的水滴形，尾端半径缩到 0.6 倍，到位后收回正圆。
  const DROP_Y = i => 34 + i * 38, DROP_X = 64, DROP_LAB = ['按月提醒', '按周提醒', '每天提醒', '不提醒'];
  const DROP_CLICKS = [[0.8, 0, 1], [1.7, 1, 2], [2.6, 2, 3], [3.5, 3, 0]];
  CELLS[36] = ui((w, h, t) => {
    let cur = 0, from = -1, q = 0;
    for (const [tc, a, b] of DROP_CLICKS) if (t >= tc) { if (t < tc + .45) { from = a; cur = b; q = (t - tc) / .45; } else cur = b; }
    text('提醒频率', 40, 12, 12, C.hint, 600);
    for (let i = 0; i < 4; i++) {
      const on = from < 0 ? i === cur : (q > .5 ? i === cur : i === from);
      ring(DROP_X, DROP_Y(i), 10, on ? C.blue : C.line2, 2);
      text(DROP_LAB[i], DROP_X + 24, DROP_Y(i), 15, on ? C.ink : C.en, on ? 700 : 500);
    }
    // 选中点：静止时正圆，移动时为头圆 + 尾圆 + 两条切线围成的水滴
    X.fillStyle = C.blue;
    if (from < 0) circle(DROP_X, DROP_Y(cur), 5.5, C.blue);
    else {
      const ya = DROP_Y(from), yb = DROP_Y(cur);
      const hy = lerp(ya, yb, eo(q)), ty0 = lerp(ya, yb, eio(q));
      const stretch = Math.min(1, Math.abs(hy - ty0) / 20), rh = 5.5, rt = 5.5 * (1 - .4 * stretch);
      X.beginPath(); X.moveTo(DROP_X - rh, hy); X.lineTo(DROP_X - rt, ty0); X.lineTo(DROP_X + rt, ty0); X.lineTo(DROP_X + rh, hy); X.closePath(); X.fill();
      circle(DROP_X, hy, rh, C.blue); circle(DROP_X, ty0, rt, C.blue);
    }
    // 右侧摘要卡跟随当前选项
    shadowed(() => fillRR(300, 48, 210, 96, 12, '#fff'), 14, 4, .1);
    text('当前设置', 320, 72, 12, C.hint, 600);
    text(DROP_LAB[cur], 320, 102, 20, C.ink, 800);
    bar(320, 124, 120, C.line, 7);
    const cx = DROP_X + 50;
    pointer([[0, w + 30, h + 30], [.7, cx, DROP_Y(1) + 2], [1.6, cx, DROP_Y(2) + 2], [2.5, cx, DROP_Y(3) + 2], [3.4, cx, DROP_Y(0) + 2], [3.75, cx, DROP_Y(0) + 2], [4.45, w + 30, h + 30]], DROP_CLICKS.map(c => c[0]), t);
  });

  // @element 38
  // 改写自 KittenJam Motion Library #148 输入框浮动标签：350×52 输入框，标签「邮箱地址」初始在框内居中 15px 灰字。
  // 光标 0.9 秒点入：标签 0.25 秒 easeOut 缩到 11px、上浮 15px 变蓝；底部蓝线 0.3 秒从中间向两侧展开到 350px。
  // 1.4 秒起逐字输入「hello@kitten.cn」（每字 0.08 秒），光标竖线 0.5 秒闪烁；3.3 秒起每字 0.025 秒删空，3.85 秒点框外失焦，标签与底线 0.25 秒还原。
  const FLOAT_S = 'hello@kitten.cn';
  CELLS[37] = ui((w, h, t) => {
    pageLines(96, 14, 350);
    const bx = 96, by = 74, bw = 350, bh = 52;
    const focus = eo(seg(t, .9, 1.15)) * (1 - eo(seg(t, 3.85, 4.1)));
    const typed = Math.max(0, Math.min(FLOAT_S.length, Math.floor((t - 1.4) / .08) + 1));
    const del = t >= 3.3 ? Math.min(FLOAT_S.length, Math.floor((t - 3.3) / .025) + 1) : 0;
    const n = t < 1.4 ? 0 : Math.max(0, typed - del);
    fillRR(bx, by, bw, bh, 8, focus > 0 ? '#fff' : C.block); strokeRR(bx, by, bw, bh, 8, C.line2, 1);
    // 底线：灰色常驻，蓝线从中点展开
    X.fillStyle = C.line2; X.fillRect(bx + 8, by + bh - 2, bw - 16, 2);
    const lw = (bw - 16) * eo(seg(t, .9, 1.2)) * (1 - eo(seg(t, 3.85, 4.1)));
    X.fillStyle = C.blue; X.fillRect(bx + bw / 2 - lw / 2, by + bh - 2, lw, 2);
    const fl = n > 0 ? 1 : focus;
    const ls = lerp(15, 11, fl), ly = by + bh / 2 - 15 * fl;
    text('邮箱地址', bx + 16, ly, ls, fl > .5 ? C.blue : C.hint, fl > .5 ? 600 : 500);
    const s = FLOAT_S.slice(0, n);
    text(s, bx + 16, by + 33, 15, C.ink, 500, 'left', NUMF);
    if (focus > .5 && Math.floor((t - .9) / .5) % 2 === 0) { const cxp = bx + 17 + tw(s, 15, 500, NUMF); X.fillStyle = C.blue; X.fillRect(cxp, by + 24, 1.5, 18); }
    pointer([[0, w + 30, h + 30], [.8, 300, 104], [1.3, 300, 104], [1.9, 470, 160], [3.7, 470, 160], [4.4, w + 30, h + 30]], [.9, 3.85], t);
  });

  // @element 39
  // 改写自 KittenJam Motion Library #247 展开搜索框：右侧 44×44 圆形放大镜按钮，光标 0.9 秒点击，
  // 按钮右缘固定、0.45 秒 easeInOut 3 次方向左展开成 320×44 搜索框，放大镜随左缘移动；占位字「搜索动效…」1.3–1.5 秒淡入，
  // 1.8 秒起逐字输入「旋转按钮」（每字 0.18 秒），右侧出现 ×；3.4 秒点 × 清空，3.5–3.95 秒收回圆形按钮。
  const ESEARCH_S = '旋转按钮';
  CELLS[38] = ui((w, h, t) => {
    bar(24, 18, 90, C.line2, 11); bar(24, 92, 230, C.line); bar(24, 110, 180, C.line); fillRR(24, 132, 230, 44, 8, C.block);
    const ex = eio(seg(t, .95, 1.4)) * (1 - eio(seg(t, 3.5, 3.95)));
    const R = 492, by = 50, bh = 44, bw = lerp(44, 320, ex), bx = R - bw;
    shadowed(() => fillRR(bx, by, bw, bh, 22, '#fff'), 12, 3, .12);
    strokeRR(bx, by, bw, bh, 22, ex > .02 ? C.sb : C.line2, 1.5);
    // 放大镜（随左缘移动）
    const ix = bx + 22, iy = by + 22;
    ring(ix - 2, iy - 2, 7, ex > .02 ? C.blue : C.ink, 2.2);
    X.strokeStyle = ex > .02 ? C.blue : C.ink; X.lineWidth = 2.4; X.lineCap = 'round'; X.beginPath(); X.moveTo(ix + 3, iy + 3); X.lineTo(ix + 8, iy + 8); X.stroke(); X.lineCap = 'butt';
    const n = t < 1.8 || t >= 3.4 ? 0 : Math.min(ESEARCH_S.length, Math.floor((t - 1.8) / .18) + 1);
    const ph = eo(seg(t, 1.3, 1.5)) * (1 - seg(t, 3.5, 3.6));
    X.save(); X.beginPath(); X.rect(bx, by, bw, bh); X.clip();
    if (n === 0 && ph > 0) { X.globalAlpha = ph; text('搜索动效…', ix + 20, iy, 14, C.hint, 500); X.globalAlpha = 1; }
    if (n > 0) {
      text(ESEARCH_S.slice(0, n), ix + 20, iy, 14, C.ink, 600);
      circle(R - 22, iy, 9, C.block); text('×', R - 22, iy, 13, C.en, 600, 'center', NUMF);
    }
    X.restore();
    pointer([[0, w + 30, h + 30], [.8, R - 20, by + 24], [1.4, R - 20, by + 24], [2.0, R - 50, by + 70], [3.0, R - 50, by + 70], [3.35, R - 20, by + 24], [3.6, R - 20, by + 24], [4.4, w + 30, h + 30]], [.9, 3.4], t);
  });

  // @element 40
  // 改写自 KittenJam Motion Library #321 命令面板：页面右下角键帽提示「⌘ K」，0.5 秒两键按下（下沉 2px）；
  // 0.6–0.85 秒背景变暗到 0.4，面板以 easeOut 3 次方从 0.94 放大到 1 并淡入（300×159）。1.3、1.5 秒逐字输入「设置」，
  // 列表由 5 项筛成 3 项再筛成 2 项，匹配字标蓝；高亮条 2.3 秒 0.2 秒 easeInOut 下移一行，2.9 秒回车闪一下，3.1–3.4 秒面板与暗层淡出。
  const CMDK_ALL = ['新建文件', '打开设置', '切换主题', '设置快捷键', '设备信息'];
  CELLS[39] = ui((w, h, t) => {
    pageLines(24, 18, 494); fillRR(24, 84, 239, 92, 8, C.block); fillRR(279, 84, 239, 92, 8, C.block);
    // 键帽提示
    const pk = t >= .5 && t < .7 ? 2 : 0;
    [['⌘', 456], ['K', 488]].forEach(([s, x]) => { fillRR(x, 150 + 2, 26, 24, 5, C.line2); fillRR(x, 150 + pk, 26, 24 - 2, 5, '#fff'); strokeRR(x, 150 + pk, 26, 22, 5, C.line2, 1); text(s, x + 13, 161 + pk, 12, C.ink, 700, 'center', NUMF); });
    const a = eo(seg(t, .6, .85)) * (1 - eio(seg(t, 3.1, 3.4)));
    if (a <= 0) return;
    X.fillStyle = `rgba(18,20,28,${.4 * a})`; X.fillRect(0, 0, w, h);
    const s = .94 + .06 * a, px = 121, py = 16, pw = 300;
    const q = t < 1.3 ? '' : t < 1.5 ? '设' : '设置';
    const list = CMDK_ALL.filter(x => [...q].every(c => x.includes(c)));
    const ph = 36 + 5 * 24 + 3;
    X.save(); X.globalAlpha = a; X.translate(271, py + ph / 2); X.scale(s, s); X.translate(-271, -py - ph / 2);
    shadowed(() => fillRR(px, py, pw, ph, 12, '#fff'), 26, 10, .28);
    X.fillStyle = C.sep; X.fillRect(px, py + 36, pw, 1);
    ring(px + 18, py + 17, 5.5, C.hint, 1.8); X.strokeStyle = C.hint; X.lineWidth = 1.8; X.beginPath(); X.moveTo(px + 22, py + 21); X.lineTo(px + 26, py + 25); X.stroke();
    if (q) text(q, px + 34, py + 18, 14, C.ink, 600); else text('输入命令或搜索…', px + 34, py + 18, 14, C.hint, 500);
    if (t >= .85 && t < 3.1 && Math.floor((t - .85) / .5) % 2 === 0) { X.fillStyle = C.blue; X.fillRect(px + 35 + (q ? tw(q, 14, 600) : 0), py + 10, 1.5, 16); }
    // 高亮条：在当前列表内的行号，2.3 秒下移一行；2.9 秒回车时加深
    const hi = eio(seg(t, 2.3, 2.5)), flash = t >= 2.9 && t < 3.05 ? 1 : 0;
    fillRR(px + 6, py + 40 + 24 * hi, pw - 12, 22, 6, flash ? C.mb : C.lb);
    list.forEach((it, i) => {
      const iy = py + 51 + i * 24;
      fillRR(px + 16, iy - 6, 12, 12, 3, C.line2);
      let x = px + 38;
      for (const c of it) { text(c, x, iy, 13, q.includes(c) ? C.blue : C.ink, q.includes(c) ? 700 : 500); x += tw(c, 13, 500); }
    });
    if (q) text(`${list.length} 项`, px + pw - 14, py + 18, 11, C.hint, 500, 'right');
    X.restore();
  });

  // @element 41
  // 改写自 KittenJam Motion Library #309 翻页书：两页 150×148 的书摊开（书脊 x=271），光标在 0.9、2.1 秒点右页，
  // 每次一张纸以书脊为轴翻到左侧 0.7 秒：scaleX 按 cos(π·easeInOut) 从 1 到 −1，过 0 后显示背面页码，近 0 时加最多 0.25 的暗影模拟 3D。
  // 页码 1-2 → 3-4 → 5-6；3.4 秒点左页，上层纸 3.5 秒、下层纸 3.6 秒起各 0.55 秒翻回，回到 1-2。
  const BOOK_SP = 271, BOOK_PW = 150, BOOK_Y = 22, BOOK_H = 148;
  CELLS[40] = ui((w, h, t) => {
    X.fillStyle = C.bg; X.fillRect(0, 0, w, h);
    const page = (n, x) => {
      X.fillStyle = '#fff'; X.fillRect(x, BOOK_Y, BOOK_PW, BOOK_H);
      bar(x + 16, BOOK_Y + 18, 70, C.line2, 9);
      for (let i = 0; i < 5; i++) bar(x + 16, BOOK_Y + 40 + i * 16, i === 4 ? 70 : 118, C.line, 6);
      if (n % 2 === 0) mountains(x + 16, BOOK_Y + 92, 118, 34, n % 4 === 0 ? 1 : 0);
      text(String(n), x + BOOK_PW / 2, BOOK_Y + BOOK_H - 10, 10, C.hint, 600, 'center', NUMF);
    };
    // 两张纸：A 正面 2 背面 3，B 正面 4 背面 5；s = 1 在右、−1 在左
    const flip = (a, b) => Math.cos(Math.PI * eio(seg(t, a, b)));
    const sA = t < 3 ? flip(.95, 1.65) : -flip(3.6, 4.15), sB = t < 3 ? flip(2.15, 2.85) : -flip(3.5, 4.05);   // 翻回时上层的 B 先翻
    shadowed(() => { X.fillStyle = '#fff'; X.fillRect(BOOK_SP - BOOK_PW, BOOK_Y, BOOK_PW * 2, BOOK_H); }, 16, 6, .16);
    page(1, BOOK_SP - BOOK_PW); page(6, BOOK_SP);
    const sheet = (s, front, back) => {
      const wpx = BOOK_PW * Math.abs(s);
      if (wpx < .5) return;
      X.save();
      if (s > 0) { X.translate(BOOK_SP, 0); X.scale(Math.abs(s), 1); page(front, 0); }
      else { X.translate(BOOK_SP, 0); X.scale(Math.abs(s), 1); page(back, -BOOK_PW); }
      const d = .25 * (1 - Math.abs(s));
      if (d > 0) { X.fillStyle = `rgba(20,24,40,${d})`; X.fillRect(s > 0 ? 0 : -BOOK_PW, BOOK_Y, BOOK_PW, BOOK_H); }
      X.restore();
    };
    // 绘制顺序：左侧纸 A 在下、B 在上；右侧纸 B 在下、A 在上；正在翻的放最上
    const moving = s => Math.abs(s) < 1;
    const order = [];
    if (sA <= -1) order.push(['A', sA]);
    if (sB <= -1) order.push(['B', sB]);
    if (sB >= 1) order.push(['B', sB]);
    if (sA >= 1) order.push(['A', sA]);
    if (moving(sB)) order.push(['B', sB]);
    if (moving(sA)) order.push(['A', sA]);
    order.forEach(([id, s]) => id === 'A' ? sheet(s, 2, 3) : sheet(s, 4, 5));
    X.fillStyle = 'rgba(20,24,40,.12)'; X.fillRect(BOOK_SP - 1, BOOK_Y, 2, BOOK_H);
    pointer([[0, w + 30, h + 30], [.8, 380, 100], [2.2, 380, 100], [2.9, 380, 100], [3.3, 165, 100], [3.6, 165, 100], [4.4, w + 30, h + 30]], [.9, 2.1, 3.4], t);
  });

  // @element 42
  // 改写自 KittenJam Motion Library #311 对折邀请卡：150×130 合起的卡片居中，封面深蓝带「邀请函」。
  // 光标 0.8 秒点封面，0.9–1.6 秒封面以左边为轴打开（scaleX 1→−1，easeInOut 3 次方），过 0 后显示浅色内页左半；
  // 同时整张卡右移 75px 保持居中。内页右半三行文字 1.6 / 1.8 / 2.0 秒起各 0.3 秒淡入并上移 6px；
  // 3.4 秒点内页左半，文字 3.4–3.6 秒淡出，3.6–4.2 秒封面合上、卡片回到原位。
  const INVITE_W = 150, INVITE_H = 130, INVITE_Y = 30;
  const INVITE_L = [['诚邀您参加', 12, 500, C.hint], ['年度设计之夜', 18, 800, C.ink], ['10 月 29 日 19:00', 12, 600, C.blue]];
  CELLS[41] = ui((w, h, t) => {
    X.fillStyle = C.bg; X.fillRect(0, 0, w, h);
    const q = eio(seg(t, .9, 1.6)) * (1 - eio(seg(t, 3.6, 4.2)));
    const s = Math.cos(Math.PI * q), hx = 196 + 75 * q;
    // 内页右半（被封面盖住的那面）
    shadowed(() => fillRR(hx, INVITE_Y, INVITE_W, INVITE_H, 6, '#fffdf8'), 14, 4, .14);
    const fade = 1 - seg(t, 3.4, 3.6);
    INVITE_L.forEach(([s0, sz, wt, col], i) => {
      const p = eo(seg(t, 1.6 + i * .2, 1.9 + i * .2)) * fade;
      if (p <= 0) return;
      X.save(); X.globalAlpha = p; text(s0, hx + INVITE_W / 2, INVITE_Y + 40 + i * 26 + 6 * (1 - p), sz, col, wt, 'center', i === 2 ? NUMF : JP); X.restore();
    });
    // 封面 / 内页左半：以 hx 为轴压缩
    const cw = INVITE_W * Math.abs(s);
    if (cw > .5) {
      X.save(); X.translate(hx, 0); X.scale(Math.abs(s), 1);
      if (s > 0) {
        fillRR(0, INVITE_Y, INVITE_W, INVITE_H, 6, '#1d3a8a');
        strokeRR(10, INVITE_Y + 10, INVITE_W - 20, INVITE_H - 20, 4, 'rgba(255,255,255,.35)', 1);
        text('邀请函', INVITE_W / 2, INVITE_Y + 58, 20, '#fff', 800, 'center');
        bar(INVITE_W / 2 - 24, INVITE_Y + 80, 48, 'rgba(255,255,255,.4)', 4);
      } else {
        fillRR(-INVITE_W, INVITE_Y, INVITE_W, INVITE_H, 6, '#f6f1e7');
        circle(-INVITE_W / 2, INVITE_Y + INVITE_H / 2, 22, C.lb); text('★', -INVITE_W / 2, INVITE_Y + INVITE_H / 2 + 1, 18, C.blue, 700, 'center', NUMF);
      }
      const d = .3 * (1 - Math.abs(s));
      if (d > 0) { X.fillStyle = `rgba(20,24,40,${d})`; X.fillRect(s > 0 ? 0 : -INVITE_W, INVITE_Y, INVITE_W, INVITE_H); }
      X.restore();
    }
    pointer([[0, w + 30, h + 30], [.7, 290, 110], [1.2, 290, 110], [2.0, 470, 170], [3.0, 470, 170], [3.35, 200, 120], [3.6, 200, 120], [4.4, w + 30, h + 30]], [.8, 3.4], t);
  });

  // @element 43
  // 改写自 KittenJam Motion Library #142 下拉刷新：150×179 手机框内的消息列表（行高 30）。手指 0.8 秒按住列表，
  // 0.8–1.8 秒向下拖 120px，列表位移按阻力曲线 90·(1−e^(−拖动/90)) 只走约 66px，顶部圆形箭头随位移转到 270°；
  // 1.8 秒松手：列表 0.25 秒回到 44px 处停住，图标变转圈（0.8 秒 1 圈）；2.9–3.2 秒列表回弹到 0，3.0–3.4 秒顶部插入一条蓝色「新消息」行；
  // 复位：4.0–4.4 秒新消息行收起，回到初始列表。
  const PULL_ROWS = ['设计周报', '小林', '项目群', '日程提醒', '系统通知'];
  CELLS[42] = ui((w, h, t) => {
    X.fillStyle = C.bg; X.fillRect(0, 0, w, h);
    const fx = 196, fy = 6, fw = 150, fh = 179, sx = fx + 6, sy = fy + 6, sw = fw - 12, shh = fh - 12;
    fillRR(fx, fy, fw, fh, 20, C.dark); fillRR(sx, sy, sw, shh, 15, '#fff');
    X.save(); rr(sx, sy, sw, shh, 15); X.clip();
    // 顶部栏
    X.fillStyle = '#fff'; text('消息', sx + sw / 2, sy + 15, 12, C.ink, 700, 'center');
    X.fillStyle = C.sep; X.fillRect(sx, sy + 28, sw, 1);
    const top = sy + 29;
    const drag = 120 * eio(seg(t, .8, 1.8));
    const pull = 90 * (1 - Math.exp(-drag / 90));
    const PEAK = 90 * (1 - Math.exp(-120 / 90));
    let off;
    if (t < 1.8) off = pull;
    else if (t < 2.9) off = lerp(PEAK, 44, eo(seg(t, 1.8, 2.05)));
    else off = 44 * (1 - eo(seg(t, 2.9, 3.2)));
    // 刷新图标：拖动时按位移旋转，松手后匀速转圈
    if (off > 2) {
      const iy = top + off / 2, al = Math.min(1, off / 30);
      X.save(); X.globalAlpha = al; X.translate(sx + sw / 2, iy);
      const ang = t < 1.8 ? (off / PEAK) * Math.PI * 1.5 : Math.PI * 1.5 + (t - 1.8) / .8 * Math.PI * 2;
      X.rotate(ang);
      X.beginPath(); X.arc(0, 0, 8, 0, Math.PI * 1.5); X.strokeStyle = C.blue; X.lineWidth = 2.2; X.lineCap = 'round'; X.stroke();
      if (t < 1.8) { X.beginPath(); X.moveTo(0, -11); X.lineTo(4, -8); X.lineTo(0, -5); X.fillStyle = C.blue; X.fill(); }
      X.restore();
    }
    // 新消息行高度：插入 0→30，复位时收起
    const nh = 30 * eio(seg(t, 3.0, 3.4)) * (1 - eio(seg(t, 4.0, 4.4)));
    let y = top + off;
    if (nh > .5) {
      X.save(); X.beginPath(); X.rect(sx, y, sw, nh); X.clip(); X.globalAlpha = nh / 30;
      X.fillStyle = C.lb; X.fillRect(sx, y, sw, 30); circle(sx + 18, y + 15, 9, C.blue);
      text('新消息', sx + 34, y + 11, 11, C.blue, 700); bar(sx + 34, y + 19, 60, C.mb, 5);
      X.restore(); y += nh;
    }
    PULL_ROWS.forEach((r, i) => {
      const ry = y + i * 30;
      circle(sx + 18, ry + 15, 9, [C.mb, C.sb, C.line2, C.mb, C.line2][i]);
      text(r, sx + 34, ry + 11, 11, C.ink, 600); bar(sx + 34, ry + 19, 70 - i * 6, C.line, 5);
      X.fillStyle = C.sep; X.fillRect(sx + 34, ry + 29.5, sw - 40, 1);
    });
    X.restore();
    const lx = sx + sw / 2 + 20;
    finger([[0, lx, 50], [.8, lx, 50], [1.8, lx, 170]], [.8], t, t > .55 && t < 1.85);
  });

  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});
