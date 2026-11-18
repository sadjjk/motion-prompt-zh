// Motion Prompt #2 133–139 · #4 100–106 · MIT License (c) 2026 JDhruv14 · https://github.com/JDhruv14/line-art-animation
//
// Kit for pack "lineart" (Line-art animation / 線画アニメーション): the constants and helpers its elements share.
// Elements #2 133–139 · #4 100–106 · 539x208 px · cycle 6.4 s. Element code: https://sadjjk.github.io/motion-prompt-zh/api/v1/zh-Hans/e/<id>.txt (or /en/, /ja/).
//
// Run one element standalone in a browser:
//   1. paste this file into a <script>,
//   2. paste the element code below it (it assigns CELLS[n - 1], n = the element number inside the pack),
//   3. then add:
//        const c = document.createElement('canvas'); c.width = 539; c.height = 208; document.body.append(c);
//        const k = c.getContext('2d'), cell = CELLS.find(Boolean), t0 = performance.now();
//        (function loop() {
//          const u = ((performance.now() - t0) / 1000) % 6.4;   // seconds, 0 <= u < 6.4
//          k.setTransform(1, 0, 0, 1, 0, 0); k.clearRect(0, 0, 539, 208);
//          k.save(); cell(k, 539, 208, u); k.restore();
//          requestAnimationFrame(loop);
//        })();
// Every cell is a pure function of u, so the same call renders video frames: u = frame / fps.

// @kit
// 线描动画（每格 539x208、6.4 秒周期；每格都是只依赖时间 u 的纯函数）
// 改写自 line-art-animation（Dhruv Jaradi）：照搬其画法（暖纸、一支细墨线、两笔开口的四肢、纸色填充遮挡后面的线）
// 和运动规则（步态解算、弹簧、钟摆），从 SVG 改成 Canvas 2D；原作要点击、移动指针才发生的事，改成画面里按时间自己发生。
const CW = 539, CH = 208;
const CYC = 6.4;
const TAU = Math.PI * 2;
const INK = '#1c1c1c';
const PAPER = '#fdfcf8';
// 笔宽按人物单位（约 95 单位高的人物的 1.4%）；人物经 place() 缩放后笔宽跟着变，远近人物线条粗细自然不同
const PEN = 1.35;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
const ease = t => smooth(0, 1, t);
// smoothstep 在 [0, x] 上的积分；要把「放慢」换算成走过的步数和距离时用，免得逐帧累加
const easeInt = x => { x = clamp(x); return x * x * x - x * x * x * x / 2; };
const minJerk = s => s * s * s * (10 - 15 * s + 6 * s * s);
const hash = i => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const rnd = (i, j = 0) => hash(i * 127.1 + j * 311.7);
const lerpP = (a, b, t) => { t = clamp(t); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
const wrap = (u, p = CYC) => ((u % p) + p) % p;

// —— 墨与纸 ——
// 路径都写成 SVG 路径字符串交给 Path2D，原作的路径可以原样搬过来对照
const path = d => (typeof d === 'string' ? new Path2D(d) : d);
function pen(k, d, w = PEN) { k.lineWidth = w; k.strokeStyle = INK; k.lineCap = 'round'; k.lineJoin = 'round'; k.stroke(path(d)); }
// 纸色填充的闭合轮廓：挡住后面的线（大衣、头、墙、屋顶）
function shape(k, d, w = PEN) { const p = path(d); k.fillStyle = PAPER; k.fill(p); pen(k, p, w); }
// 实心墨：鞋、头发、小块深色
function blot(k, d) { k.fillStyle = INK; k.fill(path(d)); }
// 平涂颜色加描边：衣物和道具上那一两处颜色
function paint(k, d, col, w = PEN) { const p = path(d); k.fillStyle = col; k.fill(p); pen(k, p, w); }
const pt = p => `${p[0]} ${p[1]}`;

// 四肢：沿关节画一条柔和曲线，两侧各一笔、两端留口、中间填纸色。
// 这两笔开口是原作画风最认得出的地方，所以不画成闭合的管子。endGap 是两笔在远端各少画多少（原作单位）。
function limb(k, joints, width, endGap = [0.4, 0.9], w = PEN) {
  const s = joints[0], e = joints[joints.length - 1];
  let c = [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2];
  if (joints.length === 3) { const m = joints[1]; c = [m[0] + 0.55 * (m[0] - c[0]), m[1] + 0.55 * (m[1] - c[1])]; }
  const P = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16, v = 1 - t;
    P.push([v * v * s[0] + 2 * v * t * c[0] + t * t * e[0], v * v * s[1] + 2 * v * t * c[1] + t * t * e[1]]);
  }
  const half = (width - w) / 2;
  const side = sgn => P.map((p, i) => {
    const q = P[Math.min(P.length - 1, i + 1)], o = P[Math.max(0, i - 1)];
    const dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1;
    return [p[0] - (dy / l) * half * sgn, p[1] + (dx / l) * half * sgn];
  });
  const L = side(1), R = side(-1);
  k.fillStyle = PAPER;
  k.fill(path('M' + L.map(pt).join('L') + 'L' + R.slice().reverse().map(pt).join('L') + 'Z'));
  const cut = (arr, gap) => arr.slice(0, arr.length - Math.round(gap * 2));
  pen(k, 'M' + cut(L, endGap[0]).map(pt).join('L'), w);
  pen(k, 'M' + cut(R, endGap[1]).map(pt).join('L'), w);
}
// 鞋：脚踝处一块墨色楔形，toe 为脚尖向下的角度
function shoe(k, ankle, toe = 0) {
  const r = (toe * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  const S = (x, y) => pt([ankle[0] + x * c - y * s, ankle[1] + x * s + y * c]);
  blot(k, `M${S(-1.6, -0.6)} L${S(4.6, -0.2)} Q${S(6.6, 0.4)} ${S(5.6, 1.6)} L${S(-1.4, 1.5)} Q${S(-2.2, 0.5)} ${S(-1.6, -0.6)}Z`);
}
// 把人物空间（脚踩 y=120、站在 x=40、面朝 +x）放到画面 (x, y)；dir=-1 镜像，s 缩放。调用方负责 save/restore
function place(k, x, y, dir = 1, s = 0.5) { k.translate(x, y); k.scale(dir * s, s); k.translate(-40, -120); }
// 墨线质感：原作给整幅画加一层静态位移滤镜，线不是绝对笔直；这里把直线细分，按世界坐标给每个点固定的小偏移。
// 偏移只由坐标决定，不随帧变，所以不会像逐帧手绘那样抖。
function inkLine(k, x1, y1, x2, y2, w, seed = 0, amp = 0.35) {
  const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / 14));
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = mix(x1, x2, t), y = mix(y1, y2, t);
    const o = i === 0 || i === n ? 0 : (rnd(Math.round(x * 3), seed) - 0.5) * 2 * amp;
    d += (i ? 'L' : 'M') + x + ' ' + (y + o);
  }
  pen(k, d, w);
}

// —— 步态（照搬原作 gait.ts 的四条规则）——
//  1. 落地脚以行进速度向后滑，所以相对地面不动；
//  2. 摆动脚走最小加加速度路径，走路贴地，跑步带后踢；
//  3. 抬脚前脚跟先离地，脚绕脚尖转；
//  4. 髋高由落地腿够得着的高度决定：走路过腿时最高、双脚着地时最低，不用正弦上下晃。
const GAIT = {
  // 成年人正常步行，约每秒两步
  walk: { period: 1.0, duty: 0.62, stride: 24, lift: 3.4, heelOff: 15, heelKick: 0, thigh: 23, shin: 23, ankleY: 118.4, ground: 120, toe: 4.2 },
  // 和服、窄裙、木屐：步幅短、抬脚很低
  shuffle: { period: 0.9, duty: 0.64, stride: 18, lift: 2.4, heelOff: 12, heelKick: 0, thigh: 23, shin: 23, ankleY: 116, ground: 120, toe: 4.2 },
  // 跑：着地短、有腾空、后踢
  run: { period: 0.5, duty: 0.36, stride: 16, lift: 12, heelOff: 10, heelKick: 3.5, thigh: 13, shin: 13, ankleY: 118, ground: 120, toe: 3 },
};
function knee(hip, ankle, l1, l2) {
  const dx = ankle[0] - hip[0], dy = ankle[1] - hip[1];
  const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01);
  const th = Math.atan2(dy, dx);
  const al = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const c1 = [hip[0] + l1 * Math.cos(th - al), hip[1] + l1 * Math.sin(th - al)];
  const c2 = [hip[0] + l1 * Math.cos(th + al), hip[1] + l1 * Math.sin(th + al)];
  return c1[0] > c2[0] ? c1 : c2;              // 膝盖向前弯
}
function gait(opts = {}) {
  const kind = opts.kind || 'walk';
  const o = Object.assign({}, GAIT[kind], opts, { kind });
  const { period, duty, stride: S, lift, heelOff, heelKick, thigh, shin, ankleY, ground, toe } = o;
  const reach = (thigh + shin) * 0.983;        // 落地腿接近伸直但不完全伸直
  const restHip = ankleY - reach;
  const foot = u => {
    u = wrap(u, 1);
    if (u < duty) {
      const x = 40 + S / 2 - (S * u) / duty;
      const peel = smooth(duty - 0.14, duty, u);
      const th = (heelOff * peel * Math.PI) / 180;
      const px = x + toe, py = ground, ox = -toe, oy = ankleY - ground;   // 绕地面上的脚尖转
      return { ankle: [px + ox * Math.cos(th) - oy * Math.sin(th), py + ox * Math.sin(th) + oy * Math.cos(th)], pitch: heelOff * peel, stance: true };
    }
    const s = (u - duty) / (1 - duty);
    const x = 40 - S / 2 + S * minJerk(s) - heelKick * Math.sin(Math.PI * Math.min(1, s * 1.6));
    const y = ankleY - lift * Math.pow(Math.sin(Math.PI * Math.pow(s, heelKick ? 0.7 : 1)), 1.2);
    return { ankle: [x, y], pitch: heelOff * Math.pow(1 - smooth(0, 0.55, s), 1.4), stance: false };
  };
  return Object.assign(o, {
    speed: S / (duty * period),              // 人物单位/秒；乘人物缩放得到画面速度
    // go ∈ [0,1]：把双脚混合到站定，用于停下鞠躬、举帽
    pose(phase, go = 1) {
      const raw = [foot(phase), foot(phase + 0.5)];
      if (go < 1) raw.forEach((fo, i) => {
        const rest = 40 + (i ? -2 : 2);
        fo.ankle = [rest + (fo.ankle[0] - rest) * go, ankleY + (fo.ankle[1] - ankleY) * go];
        fo.pitch *= go; fo.stance = true;
      });
      let hipY = restHip;
      const half = wrap(phase, 0.5);
      if (heelKick && go >= 1) {
        hipY = half < duty ? restHip + 1.4 * Math.sin((Math.PI * half) / duty) : restHip - 2.6 * Math.sin((Math.PI * (half - duty)) / (0.5 - duty));
      } else {
        for (const fo of raw) if (fo.stance) {
          const dx = fo.ankle[0] - 40;
          hipY = Math.max(hipY, fo.ankle[1] - Math.sqrt(Math.max(1, reach * reach - dx * dx)));
        }
      }
      const hip = [40, hipY];
      const feet = raw.map(fo => Object.assign(fo, { knee: knee(hip, fo.ankle, thigh, shin) }));
      return { hip, feet, front: feet[0].ankle[0] >= feet[1].ankle[0] ? 0 : 1, bob: hipY - restHip };
    },
  });
}

// —— 原作 lib/daynight.ts 的昼夜配色 ——
// τ 按原作约定：0 午夜、0.25 黎明、0.5 正午、0.75 黄昏。色带和派生量（墨色、点灯、星空、晚霞）原样搬过来，
// 有昼夜变化的款共用，同一时刻的纸色、墨色各款一致
const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mc = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const css = c => `rgb(${c.map(v => Math.round(v)).join(',')})`;
const lum = c => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
const RMP = a => a.map(([p, h]) => [p, hx(h)]);
const SKY_TOP = RMP([[0, '#0d1222'], [0.19, '#131a30'], [0.235, '#3d4066'], [0.27, '#cfd8e2'], [0.33, '#f3f2ee'], [0.5, '#f6f5f1'], [0.68, '#f3eee4'], [0.735, '#e3c6a6'], [0.762, '#5a5279'], [0.8, '#1b2140'], [0.86, '#0d1222']]);
const SKY_BOT = RMP([[0, '#1a2240'], [0.19, '#283050'], [0.235, '#d49884'], [0.27, '#f3d0b3'], [0.33, '#faf6ee'], [0.5, '#fcfbf7'], [0.68, '#f9efdc'], [0.735, '#f0a379'], [0.762, '#d47f68'], [0.8, '#383a60'], [0.86, '#1a2240']]);
const PAPERS = RMP([[0, '#1a2036'], [0.19, '#1f263e'], [0.235, '#4a4561'], [0.27, '#ede4d8'], [0.33, '#fbf8f1'], [0.5, '#fdfcf8'], [0.68, '#faf4e8'], [0.735, '#f0dbc4'], [0.756, '#5d5571'], [0.8, '#262c48'], [0.86, '#1a2036']]);
const INK_DARK = hx('#1c1c1c'), INK_LIGHT = hx('#efe6cf');
function ramp(keys, x) {
  x = wrap(x, 1);
  const n = keys.length;
  let i = n - 1;
  for (let j = 0; j < n; j++) if (keys[j][0] <= x) i = j;
  const [p0, c0] = keys[i], [p1, c1] = keys[(i + 1) % n];
  const span = (i + 1 < n ? p1 : p1 + 1) - p0;
  let d = x - p0; if (d < 0) d += 1;
  return mc(c0, c1, ease(d / span));
}
function palette(tau) {
  const top = ramp(SKY_TOP, tau), bot = ramp(SKY_BOT, tau), paper = ramp(PAPERS, tau), L = lum(paper);
  const inkT = smooth(0.56, 0.36, L);
  return {
    top, bot, paper, inkT, ink: mc(INK_DARK, INK_LIGHT, inkT),
    lamp: smooth(0.78, 0.4, L),
    night: smooth(0.42, 0.1, lum(top)),
    sunset: Math.max(smooth(0.67, 0.735, tau) * smooth(0.79, 0.745, tau), smooth(0.215, 0.245, tau) * smooth(0.3, 0.26, tau)),
  };
}
// 把「卡片时间 → τ」的关键帧 [[秒, τ], …] 变成函数。单调三次 Hermite：切线取相邻斜率的调和平均，τ 不会倒退；
// 首尾切线取同一个值，接缝处速度也连续。关键帧末项的 τ 比首项多整数天，首尾画面就相同
function dayClock(TK) {
  const TM = (() => {
    const n = TK.length, d = [], m = [];
    for (let i = 0; i < n - 1; i++) d.push((TK[i + 1][1] - TK[i][1]) / (TK[i + 1][0] - TK[i][0]));
    for (let i = 0; i < n; i++) {
      const a = i ? d[i - 1] : d[n - 2], b = i < n - 1 ? d[i] : d[0];
      m.push(a * b <= 0 ? 0 : (2 * a * b) / (a + b));
    }
    return m;
  })();
  return u => {
    u = wrap(u);
    let i = 0;
    while (i < TK.length - 2 && u > TK[i + 1][0]) i++;
    const [u0, t0] = TK[i], [u1, t1] = TK[i + 1], hh = u1 - u0, s = (u - u0) / hh;
    const s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * t0 + (s3 - 2 * s2 + s) * hh * TM[i] + (-2 * s3 + 3 * s2) * t1 + (s3 - s2) * hh * TM[i + 1];
  };
}

// —— 弹簧与钟摆查表 ——
// 原作逐帧积分（这一帧取决于上一帧），卡片要求同一时刻画出来永远一样。输入（目标、推力）随周期重复，
// 所以首次用到时从静止起按 SIM_DT 积分 SIM_WARM 个周期，存下最后一个周期的状态，之后按 u 插值查表。
// 前几个周期里起步的扰动已经衰减掉，最后一个周期首尾相接。
const SIM_DT = 1 / 120, SIM_WARM = 3;
// units: [{ type: 'spring' | 'pendulum', k, d }]；input(u) 返回每个单元这一刻的目标（弹簧）或推力（钟摆）
function sim(units, input) {
  const N = Math.round(CYC / SIM_DT), M = units.length;
  let table = null;
  const build = () => {
    const x = units.map(() => 0), v = units.map(() => 0);
    table = new Float64Array(N * M);
    for (let c = 0; c < SIM_WARM; c++) for (let n = 0; n < N; n++) {
      if (c === SIM_WARM - 1) for (let m = 0; m < M; m++) table[n * M + m] = x[m];
      const tg = input(n * SIM_DT);
      units.forEach((s, m) => {
        if (s.type === 'spring') v[m] += (s.k * (tg[m] - x[m]) - s.d * v[m]) * SIM_DT;   // 原作 spring()
        else v[m] += (-x[m] * s.k + tg[m] - v[m] * s.d) * SIM_DT;                       // 原作 pendulum()，x 为弧度
        x[m] += v[m] * SIM_DT;
      });
    }
  };
  return u => {
    if (!table) build();
    const f = wrap(u) / SIM_DT, i = Math.floor(f) % N, t = f - Math.floor(f), j = (i + 1) % N;
    const out = [];
    for (let m = 0; m < M; m++) out.push(table[i * M + m] * (1 - t) + table[j * M + m] * t);
    return out;
  };
}

// 周期 Catmull-Rom：[时间, 值] 关键帧之间平滑过渡，给关键姿势用
function curve(keys, period = CYC) {
  return x => {
    x = wrap(x, period);
    const n = keys.length;
    let i = n - 1;
    for (let j = 0; j < n; j++) if (keys[j][0] <= x) i = j;
    const K = j => { const w = Math.floor(j / n); const e = keys[((j % n) + n) % n]; return [e[0] + w * period, e[1]]; };
    const p0 = K(i - 1), p1 = K(i), p2 = K(i + 1), p3 = K(i + 2);
    const span = p2[0] - p1[0], v = (x - p1[0]) / span;
    const m1 = ((p2[1] - p0[1]) / (p2[0] - p0[0])) * span, m2 = ((p3[1] - p1[1]) / (p3[0] - p1[0])) * span;
    const v2 = v * v, v3 = v2 * v;
    return (2 * v3 - 3 * v2 + 1) * p1[1] + (v3 - 2 * v2 + v) * m1 + (-2 * v3 + 3 * v2) * p2[1] + (v3 - v2) * m2;
  };
}

function paper(k) { k.fillStyle = PAPER; k.fillRect(0, 0, CW, CH); }
const CELLS = [];

// @shared
// （本包目前没有跨元素共用的代码）
