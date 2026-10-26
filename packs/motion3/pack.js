// Motion Prompt · pack "motion3" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt
MotionPrompt.pack('motion3', function () {
  // @kit
  const CW = 539, CH = 208, CYC = 6.0;
  const C = { navy: '#0F1A3D', navy2: '#1B2A5E', navy3: '#2A3D80', dim: '#7F90C4', blue: '#3B7BFF', coral: '#FF6B5C', yel: '#FFC83D', mint: '#2EDBA8', white: '#FFFFFF', cream: '#FFF1D6' };
  const JP = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Hiragino Sans", sans-serif';
  const DISP = '"Avenir Next", "Helvetica Neue", system-ui, sans-serif';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const eOut = x => 1 - Math.pow(1 - x, 3);
  const eIn = x => x * x * x;
  const smooth = x => x * x * (3 - 2 * x);
  const mod = (a, n) => ((a % n) + n) % n;
  const backOut = (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
  const spring = (t, w = 14, d = 7) => t <= 0 ? 0 : 1 - Math.exp(-d * t) * Math.cos(w * t);
  function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function txt(ctx, s, x, y, font, col, align = 'left', base = 'alphabetic', ls = '0px') { ctx.font = font; ctx.textAlign = align; ctx.textBaseline = base; ctx.letterSpacing = ls; ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.letterSpacing = '0px'; }
  function tw(ctx, s, font, ls = '0px') { ctx.font = font; ctx.letterSpacing = ls; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w; }
  function rand(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(a, b, t) { const A = hex(a), B = hex(b); return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`; }
  const PAL = [C.blue, C.coral, C.yel, C.mint];
  const eIOs = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const eOut5 = x => 1 - Math.pow(1 - x, 5);
  const backIn = (x, s = 1.70158) => (s + 1) * x * x * x - s * x * x;
  function star(k, x, y, R, rot = 0, inner = 0.5, n = 5) { k.beginPath(); for (let i = 0; i < n * 2; i++) { const r = i % 2 ? R * inner : R, a = rot + i * Math.PI / n; k.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } k.closePath(); }
  function heartPath(k, s) { k.beginPath(); k.moveTo(0, s * 0.92); k.bezierCurveTo(-s * 1.75, -s * 0.12, -s * 0.85, -s * 1.2, 0, -s * 0.42); k.bezierCurveTo(s * 0.85, -s * 1.2, s * 1.75, -s * 0.12, 0, s * 0.92); }
  const snapU = u => mod(Math.round(u * 1e6) / 1e6, CYC);
  function H01(n) { n = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); n ^= n >>> 16; return (n >>> 0) / 4294967296; }
  const TMP = mkCanvas(CW, CH), TK = TMP.getContext('2d');
  function stage(k, col = C.navy) { k.fillStyle = col; k.fillRect(0, 0, CW, CH); }
  function chars(k, s, font, ls = 0) { k.font = font; const ws = [...s].map(ch => k.measureText(ch).width + ls); const tot = ws.reduce((a, b) => a + b, 0) - ls; return [...s].map((ch, i) => ({ ch, x: ws.slice(0, i).reduce((a, b) => a + b, 0) + ws[i] / 2 })); }
  function pathLen(pts) { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return c; }
  function ptAt(pts, cum, f) { const L = cum[cum.length - 1] * clamp(f); let i = 1; while (i < cum.length - 1 && cum[i] < L) i++; const t = (L - cum[i - 1]) / (cum[i] - cum[i - 1]); return [lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t)]; }
  const CELLS = [];

  // @element 01
  // 手法参考 Lemomo 的 lemo-wake Logo 动效墙（OpenAI《一个结 一句话》），画面与代码为原创；
  // 结形按原作同一段弯折带绕中心转 6 次、一上一下互相穿过编成的结构重建（非商标图片）。
  // 01 打结的一句话：浅灰底中央六边形结（边带约 9.5px），0.55–1.05 秒六条带按 60° 间隔逐条缩回槽口，只剩最上一条；
  // 1.15–1.7 秒镜头推近 1.24 倍；1.75–2.6 秒留下的带边出纸带印字「every word」；
  // 2.7–3.6 秒第 2 条带从它底下转出接着写「in this knot」；3.65–4.5 秒第 3 条写「was a guess」；
  // 4.55–5.3 秒第 4 条写「about the」；5.35–5.9 秒第 5、6 条接力写「next one」并把尾端钻回第 1 条底下；
  // 5.9–6.5 秒结一拧收紧（旋转 8°、缩 0.94），字母飞散，5.95 秒后整句隐去，回到标准结。
  // 质感：纸底径向微渐变 + 纤维细点；带体白芯 + 深描边 + 下缘投影；字随带弧度贴排，新字随带生长、旧字保留在带上。
  const OA_CX = 270, OA_CY = 104, OA_R = 62, OA_W = 9.5, OA_N = 6;
  const OA_SENT = 'every word in this knot was a guess about the next one';
  const OA_CHUNKS = ['every word', 'in this knot', 'was a guess', 'about the', 'next one', ''];
  const OA_BG = (() => {
    const c = mkCanvas(CW, CH), g = c.getContext('2d');
    let gr = g.createRadialGradient(OA_CX, 96, 10, OA_CX, 100, 330);
    gr.addColorStop(0, '#F4F2EC'); gr.addColorStop(0.65, '#ECEAE0'); gr.addColorStop(1, '#DAD6C8');
    g.fillStyle = gr; g.fillRect(0, 0, CW, CH);
    gr = g.createRadialGradient(OA_CX, CH / 2, 130, OA_CX, CH / 2, 330);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(90,80,60,.22)');
    g.fillStyle = gr; g.fillRect(0, 0, CW, CH);
    const rr = rand(20261026);
    for (let i = 0; i < 4200; i++) { const x = rr() * CW, y = rr() * CH, v = rr(); g.fillStyle = v > 0.5 ? `rgba(255,255,255,${0.2 * (v - 0.5) + 0.03})` : `rgba(120,100,70,${0.04 + 0.07 * v})`; g.fillRect(x, y, 1, 1); }
    return c;
  })();
  // 单条带的几何：从槽口 (a0) 出发，向外弯一圈再回 (a0+2π/3)，形成六边形一瓣
  // 单条带的几何：内六边形顶点 → 外六边形顶点 → 下一个内六边形顶点
  // 内六边形：6 个顶点在半径 OA_R、角度 a0 = -90° + i*60°
  // 外六边形：6 个顶点在半径 OA_R + o、角度 = 内顶点 + 30°
  // 带 i：内顶点 i → 外顶点 i+0.5 → 内顶点 i+1（两段直线，在外顶点处形成尖角）
  function oaBandPath(i) {
    const a0 = -Math.PI / 2 + i * Math.PI / 3, a2 = a0 + 2 * Math.PI / 3;
    const mid = a0 + Math.PI / 3, o = OA_R * 0.6, rOut = OA_R + o;
    const P0 = [OA_CX + Math.cos(a0) * OA_R, OA_CY + Math.sin(a0) * OA_R];
    const M1 = [OA_CX + Math.cos(mid) * rOut, OA_CY + Math.sin(mid) * rOut];
    const P2 = [OA_CX + Math.cos(a2) * OA_R, OA_CY + Math.sin(a2) * OA_R];
    const p = new Path2D(`M ${P0[0]} ${P0[1]} L ${M1[0]} ${M1[1]} L ${P2[0]} ${P2[1]}`);
    const pU = new Path2D(`M ${P0[0]} ${P0[1]} L ${M1[0]} ${M1[1]}`);     // 上段（到外侧顶点）
    const pL = new Path2D(`M ${M1[0]} ${M1[1]} L ${P2[0]} ${P2[1]}`);     // 下段（回内侧顶点）
    return { p, pU, pL, P0, P1: M1, P2, M1, a0 };
  }
  const OA_BANDS = Array.from({ length: OA_N }, (_, i) => oaBandPath(i));
  CELLS[0] = (k, w, h, u) => {
    k.drawImage(OA_BG, 0, 0);
    // 节拍：0.55 起六条带按序缩回，只剩 i=0（最上，a0=-90°）；1.15 起镜头推近
    const shrink = i => eIO(P(u, 0.55 + i * 0.09, 0.9 + i * 0.09));   // i=5 最先，i=1 最后；i=0 不收
    const zoom = 1 + 0.24 * eIO(P(u, 1.15, 1.7)), rot = Math.sin(2 * Math.PI * u / CYC) * Math.PI / 22.5;
    const sc = zoom * (1 - 0.06 * Math.sin(Math.PI * u / CYC));
    k.save(); k.translate(OA_CX, OA_CY); k.scale(sc, sc); k.rotate(rot); k.translate(-OA_CX, -OA_CY);
    // 各条带：交点处一上一下——先画所有带的「下」段，再画所有带的「上」段
    // 带 i 在 a0 端进入时在上（盖过上一条），在 a2 端出去时在下（被下一条压）
    // 收起时同序绘制
    const halfAt = (i, t) => {
      const b = OA_BANDS[i];
      const t0 = i === 0 ? 1 : 1 - shrink(i);
      if (t0 <= 0.01) return null;
      // 上段 = P0→M1 的 t 比例；下段 = M1→P2 的 (t-1) 比例
      const tU = Math.min(1, t * 2), tL = Math.max(0, t * 2 - 1);
      const upper = new Path2D(), lower = new Path2D();
      if (tU > 0) { upper.moveTo(b.P0[0], b.P0[1]); upper.lineTo(lerp(b.P0[0], b.M1[0], tU), lerp(b.P0[1], b.M1[1], tU)); }
      if (tL > 0) { lower.moveTo(lerp(b.M1[0], b.P2[0], tL), lerp(b.M1[1], b.P2[1], tL)); lower.lineTo(b.P2[0], b.P2[1]); }
      return { upper: tU > 0 ? upper : null, lower: tL > 0 ? lower : null };
    };
    const bands = OA_BANDS.map((b, i) => halfAt(i, u));
    const drawSeg = (seg, kind) => {
      if (!seg || !seg[kind]) return;
      k.strokeStyle = '#0D1226'; k.lineWidth = OA_W + 2.5; k.stroke(seg[kind]);
      k.strokeStyle = '#E8E4DA'; k.lineWidth = OA_W; k.stroke(seg[kind]);
      k.strokeStyle = 'rgba(60,50,30,.35)'; k.lineWidth = OA_W - 3; k.save(); k.translate(0, 1.5); k.stroke(seg[kind]); k.restore();
    };
    // 下段（被压）：先画全部下段
    for (let i = 0; i < OA_N; i++) drawSeg(bands[i], 'lower');
    // 上段（压人）：后画全部上段
    for (let i = 0; i < OA_N; i++) drawSeg(bands[i], 'upper');
    // 纸带印字：每条带上按弧排字，新段生长、旧段保留
    const chunkAt = i => OA_CHUNKS[i] || '';
    const grow = i => eIO(P(u, 1.75 + i * 0.55, 2.35 + i * 0.55));
    for (let i = 0; i < OA_N && chunkAt(i); i++) {
      const g = i === 0 ? 1 : grow(i); if (g <= 0) continue;
      const b = OA_BANDS[i], len = chunkAt(i).length;
      const path = [b.P0, b.P1, b.P2], total = path.length - 1;
      let dist = (1 - g) * 0.9;                                  // 从带内向外生长
      k.font = `600 ${7.5}px ${DISP}`; k.textAlign = 'center'; k.textBaseline = 'middle';
      for (let c = 0; c < len; c++) {
        const p = Math.min(0.98, (dist + c * 0.035) * total / total + 0.12);
        const f = p * total, j = Math.min(total - 1, Math.floor(f)), q = f - j;
        const x = lerp(path[j][0], path[j + 1][0], q), y = lerp(path[j][1], path[j + 1][1], q);
        const tx = lerp(path[Math.max(0, j - 1)][0] + 1e-9, path[j + 1][0], 0.5), ty = lerp(path[Math.max(0, j - 1)][1] + 1e-9, path[j + 1][1], 0.5);
        const ang = Math.atan2(y - ty, x - tx);
        k.save(); k.translate(x, y); k.rotate(ang);
        // 字写在带内侧（沿法线向内）
        k.translate(0, -OA_W * 0.42);
        k.fillStyle = '#1A2E68'; k.fillText(chunkAt(i)[c], 0, 0); k.restore();
      }
    }
    // 第 6 条尾端钻回第 1 条底下（5.35–5.9）：在 a0 处加一段「穿底」小弧
    const tuck = P(u, 5.35, 5.9);
    if (tuck > 0) {
      const b = OA_BANDS[0], P0 = b.P0, d = Math.cos(b.a0) * 8, dy = Math.sin(b.a0) * 8;
      k.strokeStyle = '#0D1226'; k.lineWidth = OA_W + 2; k.lineCap = 'round';
      k.beginPath(); k.moveTo(P0[0], P0[1]); k.lineTo(P0[0] + d * tuck, P0[1] + dy * tuck); k.stroke();
      k.strokeStyle = '#E8E4DA'; k.lineWidth = OA_W - 1; k.beginPath(); k.moveTo(P0[0], P0[1]); k.lineTo(P0[0] + d * tuck, P0[1] + dy * tuck); k.stroke();
    }
    k.restore();
    // 拧收紧后字母飞散：5.95 秒后整句淡出，飞散的小点往外飘
    const disperse = P(u, 5.95, 6.5);
    if (disperse > 0 && disperse < 1) {
      for (let i = 0; i < 28; i++) {
        const t = H01(i), a = i * 0.79, r = (10 + 70 * t) * disperse;
        k.fillStyle = `rgba(26,46,104,${(1 - disperse) * 0.7})`;
        k.fillRect(OA_CX + Math.cos(a) * (OA_R * 0.9 + r), OA_CY + Math.sin(a) * (OA_R * 0.9 + r), 2, 2);
      }
    }
  };

  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});
