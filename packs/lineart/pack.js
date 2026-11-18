/* Motion Prompt · pack "lineart" · MIT License (c) 2026 JDhruv14 · https://github.com/JDhruv14/line-art-animation */
MotionPrompt.pack('lineart', function () {
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

  // @element 01
  // 提包行人脱帽：戴礼帽、围红围巾、提公文包的人沿街走，镜头跟着他，地砖缝和路灯向后退；
  // 走到一半放慢，抬手把帽子举起、放下，再走起来。手臂、公文包、围巾尾巴都经弹簧或钟摆，跟着身体滞后、摆动。
  // 对应原作 examples/walker（点一下才举帽、移动指针吹围巾）；这里举帽按时间发生，风是一阵缓慢的微风。
  {
    const GROUND = 172, SCALE = 1.3;
    const FX = 250;                                   // 人物脚下的画面 x 固定，街景向后退
    const T0 = 2.2;                                   // 开始举帽
    const TIP_IN = 0.35, TIP_HOLD = 1.2, TIP_OUT = 0.4;   // 原作：0.35 秒抬手，举到 1.2 秒，0.4 秒放下
    const SLOW = 0.85;                                // 举帽时步子慢到 15%（原作 go = 1 - tip*0.85）
    const SCARF = '#b3412d', CASE = '#6b4a32';
    const tip = u => {
      const t = u - T0;
      if (t < 0) return 0;
      if (t < TIP_IN) return ease(t / TIP_IN);
      if (t < TIP_HOLD) return 1;
      if (t < TIP_HOLD + TIP_OUT) return 1 - ease((t - TIP_HOLD) / TIP_OUT);
      return 0;
    };
    // tip 在 [0, u] 上的积分，用来算放慢后走过的步数
    const tipInt = u => {
      const t = u - T0;
      if (t <= 0) return 0;
      if (t < TIP_IN) return TIP_IN * easeInt(t / TIP_IN);
      const a = TIP_IN / 2;
      if (t < TIP_HOLD) return a + (t - TIP_IN);
      const b = a + TIP_HOLD - TIP_IN;
      if (t < TIP_HOLD + TIP_OUT) { const s = (t - TIP_HOLD) / TIP_OUT; return b + TIP_OUT * (s - easeInt(s)); }
      return b + TIP_OUT / 2;
    };
    // 一个周期走整数步：按原作步频取整，再反推步频，循环时腿的姿势首尾相接（不为走出画面去加快步子）
    const GO_INT = CYC - SLOW * tipInt(CYC);
    const STEPS = Math.max(1, Math.round(GO_INT / GAIT.walk.period));
    const walk = gait({ kind: 'walk', period: GO_INT / STEPS });
    const goAt = u => 1 - SLOW * tip(u);
    const phaseAt = u => (u - SLOW * tipInt(u)) / walk.period;
    // 一个周期走过的画面距离；地砖缝按它的 1/8、路灯按它的整倍重复，循环时街景也首尾相接
    const DIST = walk.speed * SCALE * walk.period * STEPS;
    const TILES = 8, TILE = DIST / TILES;
    const LAMP_X = 120, LAMP_H = 126;
    // 原作是指针风加缓慢微风；这里只留微风，两个正弦都按周期取整
    const wind = u => 0.2 + 0.25 * Math.sin(TAU * u / CYC) + 0.15 * Math.sin(TAU * 3 * u / CYC + 1);
    const FLUTTER = Math.round(9 * CYC / TAU);        // 原作围巾抖动约 9 rad/s，取整成周期内整数次
    const motion = sim([
      { type: 'spring', k: 60, d: 9 },                // 远侧手臂
      { type: 'spring', k: 60, d: 9 },                // 近侧手臂
      { type: 'pendulum', k: 14, d: 1.8 },            // 公文包
      { type: 'spring', k: 30, d: 4 },                // 围巾尾
    ], u => {
      const go = goAt(u), ph = phaseAt(u), p = walk.pose(ph, go);
      const legSwing = (p.feet[0].ankle[0] - 40) / (walk.stride / 2);
      const accel = Math.cos(TAU * ph * 2) * 1.6 * go;
      return [
        -legSwing * 16 * go,
        legSwing * 14 * go,
        -accel - wind(u) * 0.3,
        -6 - walk.speed * 0.08 * go - wind(u) * 5 + Math.sin(TAU * FLUTTER * u / CYC) * 0.8,
      ];
    });
    const lamp = (k, x) => {
      const top = GROUND - LAMP_H;
      shape(k, `M${x - 4} ${GROUND} L${x - 2} ${top} L${x + 2} ${top} L${x + 4} ${GROUND}Z`, 0.9);
      shape(k, `M${x - 10} ${top} L${x + 10} ${top} L${x + 7} ${top - 12} L${x - 7} ${top - 12}Z`, 0.9);
      pen(k, `M${x - 6} ${top - 6} L${x + 6} ${top - 6} M${x} ${top - 12} L${x} ${top - 18}`, 0.6);
    };
    CELLS[0] = (k, w, h, u) => {
      paper(k);
      const go = goAt(u), ph = phaseAt(u), tp = tip(u);
      const off = wrap(walk.speed * SCALE * walk.period * ph, DIST);   // 已走的画面距离
      const [farS, nearS, ca, flow] = motion(u);

      // 街：路缘两条线、地砖缝、路灯；偏移的种子按世界里的第几块砖取，街景移动时墨线形状跟着走
      inkLine(k, 0, GROUND, CW, GROUND, 0.9, 1);
      inkLine(k, 0, GROUND + 9, CW, GROUND + 9, 0.9, 2);
      const first = Math.floor(off / TILE);
      for (let i = first - 1; i <= first + Math.ceil(CW / TILE) + 1; i++) {
        const x = i * TILE - off + 10;
        if (x < -2 || x > CW + 2) continue;
        inkLine(k, x, GROUND, x + 0.0001, GROUND + 9, 0.55, ((i % TILES) + TILES) % TILES + 10, 0.2);
      }
      for (let j = -1; j <= Math.ceil(CW / DIST) + 1; j++) {
        const x = LAMP_X + j * DIST - off;
        if (x > -20 && x < CW + 20) lamp(k, x);
      }

      // 人物：全部在人物空间里画（脚踩 y=120），由远到近
      k.save();
      place(k, FX, GROUND, 1, SCALE);
      const p = walk.pose(ph, go), b = p.bob;
      const sh = [41, 41 + b], hemY = 92;
      const shF = [sh[0] - 1, sh[1] + 2], shN = [sh[0] + 1.6, sh[1] + 2.4];
      const farA = farS * Math.PI / 180, nearA = nearS * Math.PI / 180;
      const elbF = [shF[0] + 17 * Math.sin(farA), shF[1] + 17 * Math.cos(farA)];
      limb(k, [shF, elbF, [elbF[0] + 16 * Math.sin(farA + 0.25), elbF[1] + 16 * Math.cos(farA + 0.25)]], 3.6, [0.2, 0.5]);
      // 腿：在前的那条后画，压在上面
      [1 - p.front, p.front].forEach(i => { const fo = p.feet[i]; limb(k, [p.hip, fo.knee, fo.ankle], 4.2, [0.3, 0.8]); shoe(k, fo.ankle, fo.pitch); });

      // 大衣绕着前膝画，下摆随步子开合
      const kF = p.feet[p.front].knee, aF = p.feet[p.front].ankle;
      const fx = Math.max(kF[0] + 2.4, 46.4);
      shape(k, `M${sh[0] - 6} ${sh[1] + 1} Q${sh[0] - 1} ${sh[1] - 2.4} ${sh[0] + 5} ${sh[1] + 1} L${fx - 0.6} ${70 + b} Q${fx} ${82 + b * 0.5} ${Math.max(fx, aF[0] - 4)} ${hemY} L30.6 ${hemY + 1} L33.2 ${70 + b}Z`);
      pen(k, `M${sh[0] + 2.6} ${sh[1] + 4} L${sh[0] + 3.8} ${66 + b}`, PEN * 0.6);

      // 围巾尾、头、礼帽（举帽时升起）、围巾
      const hc = [42.6, 31.6 + b];
      paint(k, `M${hc[0] - 3.6} ${hc[1] + 6} Q${hc[0] - 6 + flow * 0.4} ${hc[1] + 9} ${hc[0] - 4 + flow} ${hc[1] + 16 + flow * 0.2} L${hc[0] - 1 + flow * 0.9} ${hc[1] + 16.6 + flow * 0.2} Q${hc[0] - 3 + flow * 0.3} ${hc[1] + 10} ${hc[0] - 0.8} ${hc[1] + 7.4}Z`, SCARF, PEN * 0.8);
      const head = new Path2D(); head.ellipse(hc[0], hc[1], 3.6, 4.6, 0, 0, TAU);
      shape(k, head);
      const l = tp * 5;
      blot(k, `M${hc[0] - 6.4} ${hc[1] - 3.6 - l} L${hc[0] + 6.6} ${hc[1] - 3.6 - l} Q${hc[0] + 4.4} ${hc[1] - 5 - l} ${hc[0] + 4} ${hc[1] - 8 - l} Q${hc[0]} ${hc[1] - 11 - l} ${hc[0] - 3.8} ${hc[1] - 8 - l} Q${hc[0] - 4.2} ${hc[1] - 5 - l} ${hc[0] - 6.4} ${hc[1] - 3.6 - l}Z`);
      paint(k, `M${hc[0] - 4.6} ${hc[1] + 4.6} Q${hc[0]} ${hc[1] + 8.4} ${hc[0] + 4} ${hc[1] + 4.8} L${hc[0] + 4.4} ${hc[1] + 7.6} Q${hc[0]} ${hc[1] + 11} ${hc[0] - 4.8} ${hc[1] + 7.4}Z`, SCARF, PEN * 0.8);

      // 近侧手臂：平时随步子摆，举帽时手移到帽檐
      const elbN = [shN[0] + 17 * Math.sin(nearA), shN[1] + 17 * Math.cos(nearA)];
      const handN = [elbN[0] + 16 * Math.sin(nearA + 0.1), elbN[1] + 16 * Math.cos(nearA + 0.1)];
      // 原作从一个近似的垂手姿势插值，起手时手会跳一下；这里从这一刻真实的手肘、手位置插值
      const target = [hc[0] + 4, hc[1] - 4 - l];
      const mid = lerpP(shN, target, 0.5);
      limb(k, [shN, lerpP(elbN, [mid[0] + 7 * tp, mid[1] + 3], tp), lerpP(handN, target, tp)], 3.6, [0.2, 0.4]);
      // 公文包挂在近侧手上；举帽时停在腰侧。原作在这里直接换位置，会跳一下，这里在抬手的前 1/4 里平滑移过去
      const ch = lerpP(handN, [shN[0] + 6, shN[1] + 34], ease(tp * 4));
      k.translate(ch[0], ch[1]); k.rotate(ca); k.translate(-ch[0], -ch[1]);
      paint(k, `M${ch[0] - 8} ${ch[1] + 2.4} L${ch[0] + 8} ${ch[1] + 2.4} L${ch[0] + 8} ${ch[1] + 13} L${ch[0] - 8} ${ch[1] + 13}Z`, CASE, PEN * 0.8);
      pen(k, `M${ch[0] - 2.4} ${ch[1] + 2.4} Q${ch[0]} ${ch[1]} ${ch[0] + 2.4} ${ch[1] + 2.4}`, PEN * 0.7);
      k.restore();
    };
  }

  // @element 02
  // 和服女子步态与鞠躬：穿木屐、撑红伞的和服女子碎步走，镜头跟着她，石砌边沟的接缝和路面裂纹向后退；
  // 走到一半慢慢停住，从腰弯下鞠躬、起身，再走起来。腿藏在和服里照样解算，下摆绕前膝和两脚开合，袖子和伞经弹簧滞后摆动。
  // 对应原作 examples/village/people.ts 的 createKimono（点一下才鞠躬、颜色随机、天黑换灯笼）；这里鞠躬按时间发生，颜色固定成白天的靛蓝和服、黄腰带、红伞。
  {
    const GROUND = 172, SCALE = 1.3;
    const FX = 250;                                   // 人物脚下的画面 x 固定，街面向后退
    // 原作 createKimono 自带一套 foot()：T=1.0、DUTY=0.62、S=24、抬脚 3.4、脚跟 15°，只把脚踝抬到 116 垫出木屐高度，
    // 与 GAIT.walk 只差 ankleY，所以用 walk 预设改 ankleY，而不是更短更低的 shuffle 预设
    const ANKLE = 116;
    // 原作四组随机配色里取第一组（靛蓝和服、黄腰带），伞取红色；白天 inkT=0，填色就是原色
    const KIMONO = '#34507a', OBI = '#d3a24c', PARASOL = '#7b2f2f';
    const FAR = '#2c4468';                            // 远侧袖：原作 mix(和服色, [10,12,20], 0.18) 在白天的结果
    const CORD = '#b3412d', PIN = '#c9a24a', RING = '#f1e7d0', MOTIF = '#f2ead8';
    // 鞠躬时间照原作 draw()：停步按每秒 2.4 爬升（约 0.42 秒停住），0.7 秒起用 0.45 秒弯下，保持到 1.9 秒，0.5 秒起身，2.4 秒起再走
    const T0 = 1.8;                                   // 开始停步；鞠躬最深落在 2.95–3.7 秒，正在周期中段
    const RATE = 2.4, RISE = 2.4;
    const stopAt = u => {
      const t = u - T0;
      if (t <= 0) return 0;
      if (t < RISE) return Math.min(1, t * RATE);
      return Math.max(0, 1 - (t - RISE) * RATE);
    };
    // ease(stop) 在 [0, u] 上的积分：放慢期间少走的那部分，用来换算走过的步数和距离
    const stopInt = u => {
      const t = u - T0, r = 1 / RATE;
      if (t <= 0) return 0;
      if (t < r) return easeInt(t * RATE) * r;
      if (t < RISE) return 0.5 * r + (t - r);
      if (t < RISE + r) return 0.5 * r + (RISE - r) + (0.5 - easeInt(1 - (t - RISE) * RATE)) * r;
      return RISE;
    };
    const bowAt = u => {
      const t = u - T0;
      if (t < 0.7) return 0;
      if (t < 1.15) return ease((t - 0.7) / 0.45);
      if (t < 1.9) return 1;
      if (t < 2.4) return 1 - ease((t - 1.9) / 0.5);
      return 0;
    };
    // 一个周期走整数个步态周期：按原作步频取整再反推，循环时腿首尾相接
    const GO_INT = CYC - stopInt(CYC);
    const STEPS = Math.max(1, Math.round(GO_INT / GAIT.walk.period));
    const walk = gait({ kind: 'walk', ankleY: ANKLE, period: GO_INT / STEPS });
    const goAt = u => 1 - ease(stopAt(wrap(u)));
    const phaseAt = u => { const v = wrap(u); return (v - stopInt(v)) / walk.period; };
    // 原作髋高每帧 hipS = lerp(hipS, hipY, dt*18)，把步态里髋高的折点抹圆；
    // 这里按 60 帧/秒把这段指数平滑展开成对过去 13 帧的加权和，结果只由 u 决定
    const LAG_A = Math.min(1, 18 / 60), LAG_W = [];
    for (let j = 0, s = 0; j < 13; j++) { LAG_W.push(LAG_A * Math.pow(1 - LAG_A, j)); s += LAG_W[j]; if (j === 12) LAG_W.forEach((_, i) => { LAG_W[i] /= s; }); }
    const hipAt = u => LAG_W.reduce((s, wt, j) => s + wt * walk.pose(phaseAt(u - j / 60), goAt(u - j / 60)).hip[1], 0);
    // 袖子和伞的弹簧照原作：袖 k40 d6、伞倾 k30 d5，目标随步子（每个步态周期两次）摆，停步时归位
    const motion = sim([
      { type: 'spring', k: 40, d: 6 },                // 袖子下摆的前后
      { type: 'spring', k: 30, d: 5 },                // 伞的倾角
    ], u => {
      const go = goAt(u), sp = 4 * Math.PI * phaseAt(u);
      return [(-1.4 + Math.sin(sp - 1.1) * 0.9) * go, Math.sin(sp - 0.8) * 1.6 * go];
    });

    // 一个周期走过的画面距离；边沟石板、路面裂纹都按它的整分重复，循环时街面首尾相接
    const DIST = walk.speed * SCALE * walk.period * STEPS;
    const BACK = GROUND - 16 * SCALE / 0.5;           // 屋前边线：原作在她脚下那条线后方 16 场景像素（人物缩放 0.5），按本格缩放换算
    const SLABS = 4, SLAB = DIST / SLABS, CRACKS = 5;

    const oval = (cx, cy, rx, ry) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
    const dots = (list, dy = 0) => list.map(([x, y]) => `M${x} ${y + dy} a1.1 1.1 0 1 0 0.1 0`).join(' ');
    // 原作有几处是彩色细线（纹样、腰绳、伞面那道亮边），kit 的 pen 只画墨色
    const tint = (k, d, col, w) => { k.lineWidth = w; k.strokeStyle = col; k.lineCap = 'round'; k.lineJoin = 'round'; k.stroke(path(d)); };
    // 上半身的静态轮廓，原作就是写死的路径，首次加载时建成 Path2D
    const UPPER = new Path2D('M36 43 Q32 45.5 32.2 52 Q31.6 60 32 69 L47.6 69 Q48.4 56 46.6 48 Q45.4 44 43.4 43Z');
    const OBI_P = new Path2D('M31.8 59 L47.8 59.5 L47.9 69.4 L31.7 69Z');
    const TAIKO = new Path2D('M32 57.5 L25.4 58.6 Q24.4 66 25.6 75 L32 74Z');
    const COLLAR = new Path2D('M37.4 43.4 L41.6 53.4 L44.8 43.6 L43 43 L41.4 49 L39.2 43.2Z');
    const HAIR = new Path2D(`M36.6 31 Q35.4 23.6 41 22.6 Q46.4 22.4 46 28.6 Q43.2 25.6 39.8 27 Q37.8 28.4 36.6 31Z ${oval(35.4, 31.4, 3, 3.8)} ${oval(40.2, 20.6, 3.8, 2.3)}`);
    const HEAD = new Path2D(); HEAD.ellipse(41, 32, 4.2, 5.1, 0, 0, TAU);
    const HAND_X = 50.4, HAND_Y = 54.6;
    const HAND = new Path2D(); HAND.ellipse(HAND_X, HAND_Y, 1.8, 1.5, 0, 0, TAU);
    const BALL = new Path2D(); BALL.arc(47.6, 17.4, 1.1, 0, TAU);
    const CANOPY = new Path2D('M-27 10 Q-25 -1.6 0 -4 Q25 -1.6 27 10 Q22 8 18 9.6 Q13 7.6 9 9 Q4.6 7.4 0 8.8 Q-4.6 7.4 -9 9 Q-13 7.6 -18 9.6 Q-22 8 -27 10Z');
    const RIBS = new Path2D(Array.from({ length: 9 }, (_, i) => { const x = mix(-24, 24, i / 8); return `M0 -3.6 L${x} ${8.8 - Math.abs(x) * 0.02}`; }).join(' '));
    // 木屐（两齿，墨色）和白足袋（纸色），照原作 getaPath，随脚跟抬起的角度转
    const foot = (k, ank, pitch) => {
      const r = pitch * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
      const R = (x, y) => pt([ank[0] + x * c - y * s, ank[1] + x * s + y * c]);
      shape(k, `M${R(-3.4, 0.2)} Q${R(-3.7, -5)} ${R(-0.7, -5.6)} L${R(1.6, -5)} Q${R(4.7, -3.4)} ${R(4.8, 0.2)}Z`, PEN * 0.75);
      blot(k, `M${R(-4.4, 0.2)} L${R(5.2, 0.2)} L${R(5.2, 1.5)} L${R(3.8, 1.5)} L${R(3.8, 4)} L${R(2.4, 4)} L${R(2.4, 1.5)} L${R(-1.4, 1.5)} L${R(-1.4, 4)} L${R(-2.8, 4)} L${R(-2.8, 1.5)} L${R(-4.4, 1.5)}Z`);
    };

    CELLS[1] = (k, w, h, u) => {
      paper(k);
      const go = goAt(u), ph = phaseAt(u), bow = bowAt(u);
      const off = wrap(walk.speed * SCALE * walk.period * ph, DIST);   // 已走的画面距离
      const [slv, tiltS] = motion(u);

      // 街面：照原作 houses.ts，屋前一条边线、其下石砌边沟（两线夹石板接缝）、路面零星短裂纹；
      // 接缝和裂纹的位置、墨线偏移都按世界里的第几块取，街面移动时形状跟着走
      inkLine(k, 0, BACK, CW, BACK, 0.9, 21);
      inkLine(k, 0, BACK + 8, CW, BACK + 8, 0.6, 22, 0.25);
      for (let i = Math.floor(off / SLAB) - 1; i <= Math.floor(off / SLAB) + Math.ceil(CW / SLAB) + 1; i++) {
        const m = ((i % SLABS) + SLABS) % SLABS;
        const x = (i + 0.5 + (rnd(m, 3) - 0.5) * 0.5) * SLAB - off;
        if (x > -2 && x < CW + 2) inkLine(k, x, BACK, x + 0.0001, BACK + 8, 0.55, m + 30, 0.2);
      }
      const CR = DIST / CRACKS;
      for (let i = Math.floor(off / CR) - 1; i <= Math.floor(off / CR) + Math.ceil(CW / CR) + 1; i++) {
        const m = ((i % CRACKS) + CRACKS) % CRACKS;
        const x = (i + rnd(m, 5)) * CR - off, y = GROUND - 22 + rnd(m, 6) * 56, len = 10 + rnd(m, 7) * 14;
        if (x > -30 && x < CW + 2) pen(k, `M${x} ${y} l${len} ${(rnd(m, 8) - 0.5) * 1.2}`, 0.5);
      }

      k.save();
      place(k, FX, GROUND, 1, SCALE);
      // 藏在和服里的两条腿：照原作解算出脚踝和膝，髋用平滑后的高度重算膝
      const p = walk.pose(ph, go), restHip = p.hip[1] - p.bob;
      const hipS = hipAt(u), b = hipS - restHip, hip = [40, hipS];
      const F = p.feet.map(fo => ({ a: fo.ankle, pitch: fo.pitch, k: knee(hip, fo.ankle, walk.thigh, walk.shin) }));
      const iF = F[0].a[0] >= F[1].a[0] ? 0 : 1, iR = 1 - iF;
      const aF = F[iF].a, aR = F[iR].a;
      const kF = F[0].k[0] >= F[1].k[0] ? F[0].k : F[1].k, kR = F[0].k[0] >= F[1].k[0] ? F[1].k : F[0].k;
      // 后脚先画，摆过来的前脚压在上面
      foot(k, aR, F[iR].pitch); foot(k, aF, F[iF].pitch);

      // 远侧袖子（暗一档），在身后
      paint(k, `M34 ${47 + b} Q${30 + slv * 0.5} ${56 + b} ${28.8 + slv} ${74 + b} Q${31 + slv} ${77.6 + b} 34 ${76 + b}Z`, FAR);
      // 腰带以下的和服：前缘鼓过前膝、下摆连着两只脚踝，迈步时张成 A 字，并拢时合上
      const wB = [31.8, 69 + b], wF = [47.8, 69.4 + b];
      const hemF = [Math.max(46.6, aF[0] + 4.2), 112.6], hemR = [Math.min(31.4, aR[0] - 2.4), 113];
      const kx = Math.max(kF[0] + 2.6, 47.4);
      paint(k, `M${pt(wB)} L${pt(wF)} C48.6 ${80 + b} ${kx} ${kF[1] - 9} ${kx} ${kF[1]} Q${kx - 0.2} ${(kF[1] + hemF[1]) / 2 + 2} ${pt(hemF)} Q${(hemF[0] + hemR[0]) / 2} 113.6 ${pt(hemR)} Q${Math.min(30.8, hemR[0] + 1.6)} ${92 + b * 0.5} ${pt(wB)}Z`, KIMONO);
      pen(k, `M44.4 ${72 + b} Q${kF[0] - 0.6} ${kF[1] + 3} ${Math.max(42, aF[0] + 0.8)} 112.6`, PEN * 0.6);              // 衽的交叠线
      pen(k, `M${kR[0] + 1.6} ${kR[1] - 4} Q${kR[0] + 0.4} ${kR[1] + 6} ${Math.max(hemR[0] + 3, aR[0] + 1.4)} 112.4`, PEN * 0.45);   // 后膝的褶
      tint(k, dots([[36.4, 84], [41.6, 96], [36, 104], [42, 79]], b * 0.6), MOTIF, PEN * 0.5);

      // 上半身骑在髋上，走路时前倾 1.4°；鞠躬时绕腰（40, 68）弯下 34°
      k.save();
      k.translate(0, b); k.translate(40, 68); k.rotate((bow * 34 + 1.4 * go) * Math.PI / 180); k.translate(-40, -68);
      paint(k, UPPER, KIMONO);
      tint(k, dots([[36, 55], [42, 50]]), MOTIF, PEN * 0.5);
      paint(k, OBI_P, OBI); paint(k, TAIKO, OBI);
      tint(k, 'M31.8 64.4 L47.9 64.6', CORD, 1.1);
      shape(k, COLLAR, PEN * 0.8);
      limb(k, [[40.6, 44], [40.8, 37]], 3.2, [0.2, 0.2]);
      shape(k, HEAD);
      blot(k, HAIR);
      pen(k, 'M42.6 21.2 L47.4 17.6', PEN * 0.7);
      k.fillStyle = PIN; k.fill(BALL); pen(k, BALL, 0.5);
      paint(k, `M43.6 46 Q49.6 49 50.4 55 L${50.6 + slv * 0.5} 72 Q${46 + slv} 75.6 ${41.6 + slv} 72.4 L41.6 54Z`, KIMONO);
      shape(k, HAND, PEN * 0.7);
      // 伞：伞柄从手里斜向后上方，伞面随弹簧倾，鞠躬时再往前收 10°
      const apex = [HAND_X - 15, HAND_Y - 50];
      pen(k, `M${HAND_X + 1} ${HAND_Y + 3} L${apex[0]} ${apex[1]}`, PEN * 0.9);
      k.translate(apex[0], apex[1]); k.rotate((-14 + tiltS - bow * 10) * Math.PI / 180);
      paint(k, CANOPY, PARASOL, PEN * 0.9);
      tint(k, 'M-18.6 2.8 Q0 -3 18.6 2.8', RING, 2.4);
      pen(k, RIBS, PEN * 0.4);
      blot(k, oval(0, -4.2, 2.6, 1.4));
      k.restore();
      k.restore();
    };
  }

  // @element 03
  // 骑车人与车铃：戴帽的学生骑着带车筐的买菜车往前骑，镜头跟着他，地砖缝和路灯向后退；曲柄带着两脚蹬踏，膝、踝跟着解算，
  // 车轮辐条转动；骑到一半拇指按一下车铃，铃盖抖动、冒出两道短声线。对应原作 examples/village/people.ts 的 createCyclist（点一下才响铃），这里响铃按时间发生。
  {
    const GROUND = 172, SCALE = 1.3;
    const FX = 262;                                   // 人物空间 x=40 的画面位置固定，街景向后退；车身略偏前，这样整车居中
    // 车架几何照搬原作：轮半径、后轮、前轮、中轴、曲柄长
    const R = 13.5, REAR = [18, 106.5], FRONT = [71, 106.5], BB = [41, 108], CR = 6.2;
    // 原作车速 66 px/s、人物缩放 0.5，曲柄转角是车轮转角的 0.42。
    // 一个周期里车轮转数、曲柄圈数都取整（10 圈、4 圈），反推车速和传动比，循环时轮子、脚踏首尾相接
    const SPEED0 = 66 / 0.5, GEAR0 = 0.42;
    const WHEEL_REV = Math.max(1, Math.round((SPEED0 * CYC) / (TAU * R)));
    const CRANK_REV = Math.max(1, Math.round(WHEEL_REV * GEAR0));
    const SPIN = (WHEEL_REV * TAU) / CYC;             // 车轮角速度 rad/s
    const GEAR = CRANK_REV / WHEEL_REV;
    const SPEED = SPIN * R;                           // 车轮不打滑：人物单位/秒
    // 一个周期骑过的画面距离；地砖缝、路灯的间距按它整除，循环时街景也首尾相接。间距取得和 01 款相近，两款并排时街景疏密一致
    const DIST = SPEED * SCALE * CYC;
    const TILES = Math.round(DIST / 32), TILE = DIST / TILES;
    const LAMPS = Math.max(1, Math.round(DIST / 260)), LAMP_SP = DIST / LAMPS;
    const LAMP_X = 120, LAMP_H = 126;
    // 原作 poke 后 ringT 从 0 走到 0.9 秒；这里放到 1.0 秒，铃盖抖动幅度和声线透明度都正好落到 0，结束时不跳
    const RING_T0 = 3.0, RING_LEN = 1.0;
    const BAG = '#4a3a2c', BELL = '#d8d2c0';

    // 原作 joint()：bend=+1 中间关节朝 +x（膝），-1 朝 -x（肘）；kit 的 knee() 只有朝前一种
    const ik = (a, b, l1, l2, bend) => {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01), th = Math.atan2(dy, dx);
      const al = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
      const c1 = [a[0] + l1 * Math.cos(th - al), a[1] + l1 * Math.sin(th - al)];
      const c2 = [a[0] + l1 * Math.cos(th + al), a[1] + l1 * Math.sin(th + al)];
      return (c1[0] - c2[0]) * bend > 0 ? c1 : c2;
    };
    // 原作 solid(limb())：同样的两笔四肢，只是中间填墨（黑校服的腿和袖子）；kit 的 limb() 固定填纸色，所以在这里另写
    const solidLimb = (k, joints, width, w = PEN) => {
      const [s, m, e] = joints;
      const c = [m[0] + 0.55 * (m[0] - (s[0] + e[0]) / 2), m[1] + 0.55 * (m[1] - (s[1] + e[1]) / 2)];
      const P = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16, v = 1 - t;
        P.push([v * v * s[0] + 2 * v * t * c[0] + t * t * e[0], v * v * s[1] + 2 * v * t * c[1] + t * t * e[1]]);
      }
      const half = (width - w) / 2;
      const side = sgn => P.map((p, i) => {
        const q = P[Math.min(16, i + 1)], o = P[Math.max(0, i - 1)];
        const dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1;
        return [p[0] - (dy / l) * half * sgn, p[1] + (dx / l) * half * sgn];
      });
      const L = side(1), Rr = side(-1);
      blot(k, 'M' + L.map(pt).join('L') + 'L' + Rr.slice().reverse().map(pt).join('L') + 'Z');
      pen(k, 'M' + L.map(pt).join('L'), w);
      pen(k, 'M' + Rr.map(pt).join('L'), w);
    };
    const footShoe = a => `M${a[0] - 2.6} ${a[1] + 0.6} L${a[0] + 4.4} ${a[1] + 0.6} Q${a[0] + 5.4} ${a[1] + 2.6} ${a[0] + 3} ${a[1] + 2.8} L${a[0] - 2.4} ${a[1] + 2.8}Z`;
    const lamp = (k, x) => {
      const top = GROUND - LAMP_H;
      shape(k, `M${x - 4} ${GROUND} L${x - 2} ${top} L${x + 2} ${top} L${x + 4} ${GROUND}Z`, 0.9);
      shape(k, `M${x - 10} ${top} L${x + 10} ${top} L${x + 7} ${top - 12} L${x - 7} ${top - 12}Z`, 0.9);
      pen(k, `M${x - 6} ${top - 6} L${x + 6} ${top - 6} M${x} ${top - 12} L${x} ${top - 18}`, 0.6);
    };
    // 车身不动的部分（原作 SVG 里只设一次 d 的那些）首次调用时建成 Path2D 缓存，结果只与常量有关
    let S = null;
    const build = () => {
      const ring = (c, r) => { const p = new Path2D(); p.arc(c[0], c[1], r, 0, TAU); return p; };
      S = {
        tyre: [REAR, FRONT].map(c => ring(c, R)),
        rim: [REAR, FRONT].map(c => ring(c, R - 1.6)),
        hub: [REAR, FRONT].map(c => ring(c, 1.4)),
        guards: new Path2D(`M${REAR[0] - 15} ${REAR[1] - 2} Q${REAR[0]} ${REAR[1] - 18} ${REAR[0] + 14} ${REAR[1] - 5} M${FRONT[0] - 13} ${FRONT[1] - 5} Q${FRONT[0]} ${FRONT[1] - 18} ${FRONT[0] + 14} ${FRONT[1] - 3}`),
        frame: new Path2D(`M64 79 Q52 103 ${BB[0]} ${BB[1]} L${REAR[0]} ${REAR[1]} L31 80 L${BB[0]} ${BB[1]} M31 80 L30 74 M64 79 L66.6 89 Q68.4 97 ${FRONT[0]} ${FRONT[1]} M64 79 L62.4 70 Q58 68 54.4 69.6`),
        chain: new Path2D(`M${BB[0] + 3} ${BB[1] - 3.6} L${REAR[0] + 1} ${REAR[1] - 3} Q${REAR[0] - 2} ${REAR[1]} ${REAR[0] + 1} ${REAR[1] + 3} L${BB[0] + 3} ${BB[1] + 3.6} Q${BB[0] + 6.4} ${BB[1]} ${BB[0] + 3} ${BB[1] - 3.6}Z`),
        saddle: new Path2D('M25 73 Q30 70.6 35.6 72.4 L34.6 75 L26 75Z'),
        basket: new Path2D('M66 71 L82 71 L80.6 84 L67.4 84Z'),
        weave: new Path2D('M66.5 75 L81.6 75 M66.9 79.4 L81 79.4 M70 71 L70.6 84 M74 71 L74 84 M78 71 L77.4 84'),
        bag: new Path2D('M68 71 Q68.5 64 74 64 Q80 64 80 71Z'),
        headlamp: new Path2D('M81.6 84 L85.4 84 L85.4 88 L81.6 88Z'),
        bell: new Path2D('M56 66.6 a1.8 1.8 0 0 1 3.6 0Z'),
        // 原作两道弧形声线，半径 5 和 9，同时出现、一起淡出
        rings: new Path2D([5, 9].map(r => `M${57.8 - r * 0.6} ${64 - r * 0.5} Q57.8 ${64 - r * 1.1} ${57.8 + r * 0.6} ${64 - r * 0.5}`).join(' ')),
      };
    };

    CELLS[2] = (k, w, h, u) => {
      if (!S) build();
      paper(k);
      u = wrap(u);
      const off = wrap(SPEED * SCALE * u, DIST);       // 已骑过的画面距离

      // 街：照 01 款，两条路缘线、地砖缝、路灯；墨线偏移的种子按世界里的第几块砖取
      inkLine(k, 0, GROUND, CW, GROUND, 0.9, 1);
      inkLine(k, 0, GROUND + 9, CW, GROUND + 9, 0.9, 2);
      const first = Math.floor(off / TILE);
      for (let i = first - 1; i <= first + Math.ceil(CW / TILE) + 1; i++) {
        const x = i * TILE - off + 10;
        if (x < -2 || x > CW + 2) continue;
        inkLine(k, x, GROUND, x + 0.0001, GROUND + 9, 0.55, ((i % TILES) + TILES) % TILES + 10, 0.2);
      }
      const offL = wrap(off, LAMP_SP);
      for (let j = -1; j <= Math.ceil(CW / LAMP_SP) + 1; j++) {
        const x = LAMP_X + j * LAMP_SP - offL;
        if (x > -20 && x < CW + 20) lamp(k, x);
      }

      // 车铃：rr 为按下后的秒数；不响时为 -1
      const tr = wrap(u - RING_T0);
      const rr = tr < RING_LEN ? tr : -1;
      // 原作手一直握在车把上；这里拇指往铃那边按一下（0.2 秒），让「按铃」看得出来
      const press = rr >= 0 ? Math.sin(Math.PI * clamp(rr / 0.2)) : 0;

      k.save();
      place(k, FX, GROUND, 1, SCALE);
      const wa = SPIN * u, ca = wa * GEAR;

      // 车轮：外胎、轮圈、8 根穿过轮心的辐条（16 根半辐，每 π/8 重复一次）、实心花鼓
      for (let n = 0; n < 2; n++) {
        const c = [REAR, FRONT][n];
        pen(k, S.tyre[n], PEN * 1.1);
        pen(k, S.rim[n], PEN * 0.45);
        let d = '';
        for (let i = 0; i < 8; i++) {
          const a = wa + (i * Math.PI) / 8, cx = Math.cos(a) * (R - 1.6), cy = Math.sin(a) * (R - 1.6);
          d += `M${c[0] + cx} ${c[1] + cy} L${c[0] - cx} ${c[1] - cy}`;
        }
        pen(k, d, PEN * 0.32);
        k.fillStyle = INK; k.fill(S.hub[n]);
      }

      // 曲柄转一圈，两只脚踏相差半圈；踝在脚踏上方，膝按大腿 21、小腿 21 两段解算
      const pN = [BB[0] + Math.cos(ca) * CR, BB[1] + Math.sin(ca) * CR];
      const pF = [BB[0] - Math.cos(ca) * CR, BB[1] - Math.sin(ca) * CR];
      const bob = Math.sin(ca * 2) * 0.35;              // 原作：每蹬一脚身子轻轻起伏一次
      const hip = [31, 70.6 + bob];
      const leg = (p, width) => {
        const ank = [p[0] - 0.6, p[1] - 2.2];
        solidLimb(k, [hip, knee(hip, ank, 21, 21), ank], width);
        blot(k, footShoe(ank));
      };
      leg(pF, 4.2);                                     // 远侧腿在车架后面

      pen(k, S.frame, PEN * 1.05);
      pen(k, S.guards, PEN * 0.6);
      shape(k, S.chain, PEN * 0.6);
      blot(k, S.saddle);
      shape(k, S.basket, PEN * 0.7);
      pen(k, S.weave, PEN * 0.35);
      paint(k, S.bag, BAG, PEN * 0.6);
      shape(k, S.headlamp, PEN * 0.6);                 // 白天车灯不亮，原作同样只填纸色
      // 铃盖：原作按 sin(rr·60) 抖，幅度 14° 随时间衰减
      k.save();
      if (rr >= 0) { k.translate(57.8, 66.6); k.rotate((Math.sin(rr * 60) * 14 * (1 - rr) * Math.PI) / 180); k.translate(-57.8, -66.6); }
      paint(k, S.bell, BELL, 0.5);
      k.restore();
      pen(k, `M${pF[0]} ${pF[1]} L${pN[0]} ${pN[1]} M${pN[0] - 2} ${pN[1]} l4 0 M${pF[0] - 2} ${pF[1]} l4 0`, PEN * 0.9);

      // 上身：黑校服躯干、领口一笔纸色、头、帽
      const sh = [44.6, 43 + bob];
      blot(k, `M${hip[0] - 3.6} ${hip[1] + 2} Q${hip[0] - 4.4} ${hip[1] - 14} ${sh[0] - 6} ${sh[1] + 1} Q${sh[0] - 1} ${sh[1] - 3.4} ${sh[0] + 3.4} ${sh[1] + 1.6} Q${sh[0] - 2} ${hip[1] - 12} ${hip[0] + 6} ${hip[1] + 2}Z`);
      k.lineWidth = PEN * 0.6; k.strokeStyle = PAPER; k.lineCap = 'round';
      k.stroke(path(`M${sh[0] - 2} ${sh[1] - 1} l3 1.6`));
      const hc = [sh[0] + 4.2, sh[1] - 9.4];
      const head = new Path2D(); head.ellipse(hc[0], hc[1], 4.3, 5, 0, 0, TAU);
      shape(k, head);
      blot(k, `M${hc[0] - 4.6} ${hc[1] - 1.6} Q${hc[0] - 4.4} ${hc[1] - 7} ${hc[0] + 0.4} ${hc[1] - 6.8} Q${hc[0] + 4.8} ${hc[1] - 6.4} ${hc[0] + 4.6} ${hc[1] - 2} L${hc[0] + 8} ${hc[1] - 1.2} L${hc[0] + 4.4} ${hc[1] - 0.6}Z`);

      leg(pN, 4.4);                                     // 近侧腿压在车架和躯干上
      // 手臂：肩到车把，肘朝后弯；按铃时手朝铃移一点
      const grip = [55.4 + 0.6 * press, 69.6 - 0.6 * press];
      const s2 = [sh[0], sh[1] + 2];
      solidLimb(k, [s2, ik(s2, grip, 11.5, 11.5, -1), grip], 3.6);
      const hand = new Path2D(); hand.ellipse(grip[0], grip[1], 1.7, 1.4, 0, 0, TAU);
      shape(k, hand, PEN * 0.7);

      if (rr >= 0) {
        k.globalAlpha = 1 - rr;
        pen(k, S.rings, PEN * 0.6);
        k.globalAlpha = 1;
      }
      k.restore();
    };
  }

  // @element 04
  // 长椅上的三花猫：三花猫坐在红面长椅上，伸个懒腰、坐回去、抬爪舔三下，再坐好；全程呼吸起伏，尾尖偶尔甩、耳朵抖一下。
  // 对应原作 examples/village/critters.ts 的 createCat（点一下才醒来走一遍姿势序列）和 houses.ts 的长椅；
  // 这里姿势序列按时间自己走，去掉了打哈欠和睡回去（一个周期放不下，且要回到开头的坐姿）。
  {
    // 原作场景坐标（猫脚下 y=0、长椅面 y=330）整体放大 S 倍放进卡片；线宽不跟着放大，
    // 按「原作场景笔 0.8 ≈ 01 款人物笔 1.75 px」换算，和 01 款的墨线粗细一致
    const S = 3.6, CX = 270, GY = 186;                 // 长椅中线 x=558 → CX，地面 y=352 → GY
    const PX = 1.75 / 0.8 / S;                         // 原作线宽 → 放大后坐标里的线宽
    const SP = 0.8 * PX;                               // 原作 scene pen
    const CAT = [548, 330];                            // 原作猫的位置：长椅左半边
    const RED = '#b3412d', CALICO = '#d08a4a';         // 原作长椅面的红、三花的橘
    const oval = (cx, cy, rx, ry) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
    const rect = (x0, y0, x1, y1) => `M${x0} ${y0} L${x1} ${y0} L${x1} ${y1} L${x0} ${y1}Z`;

    // 原作 POSES 里用到的三个，数值原样照搬（相对猫脚下的点；tilt 为头的转角，ear 为耳朵竖起程度，eye>0.5 睁眼）
    const POSES = {
      sit:     { S: [-4.4, -12.6], H: [4.6, -5.4], Bc: [2.2, -11.4], C: [-6.4, -1.4], Bt: [6.6, -0.2], hd: [-5.4, -17.6], tilt: 0, ear: 1, eye: 1, F1: [-5.6, 0], F2: [-3.4, 0], T0: [6.6, -1], T1: [13, 0.6], T2: [15.6, -4.4] },
      stretch: { S: [-9.4, -4.6], H: [5.4, -11.6], Bc: [-1, -8.6], C: [-11, -1], Bt: [7.4, -3.6], hd: [-15.6, -6.6], tilt: -6, ear: 0.7, eye: 0.3, F1: [-17.6, 0], F2: [-15, 0], T0: [7, -9.6], T1: [10, -17], T2: [8.6, -22] },
      groom:   { S: [-4.4, -12.6], H: [4.6, -5.4], Bc: [2.2, -11.4], C: [-6.4, -1.4], Bt: [6.6, -0.2], hd: [-5.2, -16.4], tilt: 22, ear: 1, eye: 0, F1: [-5.6, 0], F2: [-6.6, -13.6], T0: [6.6, -1], T1: [13, 0.6], T2: [15.6, -3.4] },
    };
    // 原作醒来序列去掉 yawn 和结尾的 sleep，最后一段坐姿拉长到正好 6.4 秒；各段时长照原作
    const SEQ = [['sit', 0.7], ['stretch', 1.5], ['sit', 0.6], ['groom', 0.45], ['sit', 0.35], ['groom', 0.45], ['sit', 0.35], ['groom', 0.45], ['sit', 1.55]];
    const START = []; SEQ.reduce((a, s) => (START.push(a), a + s[1]), 0);
    const lerpPose = (a, b, t) => { const o = {}; for (const n in a) o[n] = Array.isArray(a[n]) ? [mix(a[n][0], b[n][0], t), mix(a[n][1], b[n][1], t)] : mix(a[n], b[n], t); return o; };
    const poseAt = u => {
      let i = SEQ.length - 1;
      for (let j = 0; j < SEQ.length; j++) if (START[j] <= u) i = j;
      const prev = SEQ[(i + SEQ.length - 1) % SEQ.length][0];   // 第一段的「上一段」是最后一段的坐姿，循环接得上
      // 原作：每段在前 1/1.6 的时间里缓入缓出到新姿势，余下时间停住
      return lerpPose(POSES[prev], POSES[SEQ[i][0]], ease(Math.min(1, (u - START[i]) / SEQ[i][1] * 1.6)));
    };
    // 原作每隔 2–6 秒随机触发一次：六成甩尾尖、四成抖耳朵。这里固定成甩、抖、甩三次，相隔 1.7–2.8 秒：
    // 伸懒腰停住时甩一下（尾巴竖着最显眼）、舔爪间隙抖耳、最后坐定后再甩一下，在接缝前结束
    const FLICKS = [1.6, 5.3], EARS = [3.3];
    const decay = (list, u, rate) => { for (const t0 of list) { const d = u - t0; if (d >= 0 && d < 1 / rate) return [1 - d * rate, d]; } return [0, 0]; };
    // 原作呼吸 1.8 rad/s，一个周期约 1.8 次；取整成 2 次
    const BREATH = 2;

    const bench = k => {
      // 原作 houses.ts：红色凳面、下面一条横木、两对腿和一根拉档、凳上一只茶杯
      paint(k, rect(516, 330, 600, 336), RED, SP * 0.8);
      shape(k, rect(514, 336, 602, 339), SP * 0.7);
      pen(k, 'M520 339 L520 352 M596 339 L596 352 M522 339 L522 352 M594 339 L594 352 M520 348 L596 348', SP * 0.7);
      shape(k, 'M584 330 L585 325 L591 325 L592 330Z', SP * 0.6);
    };

    CELLS[3] = (k, w, h, u) => {
      paper(k);
      inkLine(k, 0, GY, CW, GY, 0.9, 4);
      k.save();
      k.translate(CX, GY); k.scale(S, S); k.translate(-558, -352);
      bench(k);

      const pose = poseAt(u);
      const breathe = Math.sin(TAU * BREATH * u / CYC) * 0.35;
      const [flick, fd] = decay(FLICKS, u, 1.6), [ear] = decay(EARS, u, 3);
      const X = p => CAT[0] + p[0], Y = p => CAT[1] + p[1];
      // 呼吸：肩、背、臀起伏幅度不同（原作 1、1.2、0.6 倍），着地的点不动
      const Sh = [X(pose.S), Y(pose.S) - breathe], H = [X(pose.H), Y(pose.H) - breathe * 0.6], Bc = [X(pose.Bc), Y(pose.Bc) - breathe * 1.2];
      const C = [X(pose.C), Y(pose.C)], Bt = [X(pose.Bt), Y(pose.Bt)];

      // 尾巴：原作 3.1 宽的墨线里压一笔 1.5 宽的橘色，墨边各 0.8 正好一支场景笔；橘色宽度是形体尺寸、跟着放大，墨边按本卡的笔宽算。原作甩尾一触发就从正弦中途起跳，这里从触发那一刻算相位，起手不跳
      const fl = Math.sin(14 * fd) * 2.5 * flick;
      const T0 = [X(pose.T0), Y(pose.T0)], T1 = [X(pose.T1), Y(pose.T1)], T2 = [X(pose.T2) + fl, Y(pose.T2) - fl * 0.4];
      const tail = new Path2D(`M${pt(T0)} Q${pt(T1)} ${pt(T2)}`);
      k.lineCap = 'round';
      k.lineWidth = 1.5 + 2 * SP; k.strokeStyle = INK; k.stroke(tail);
      k.lineWidth = 1.5; k.strokeStyle = CALICO; k.stroke(tail);

      // 前腿：单笔墨线，先画，被身体挡住根部
      const sh = [Sh[0] + 1.4, Sh[1] + 4];
      const F1 = [X(pose.F1), Y(pose.F1)], F2 = [X(pose.F2), Y(pose.F2)];
      pen(k, `M${pt(sh)} L${pt(F1)} M${sh[0] + 1.6} ${sh[1]} L${pt(F2)}`, SP * 1.6);
      // 身体：纸色闭合轮廓，四段二次曲线穿过胸、肩、背、臀
      shape(k, `M${pt(C)} Q${C[0] - 2} ${(C[1] + Sh[1]) / 2} ${pt(Sh)} Q${pt(Bc)} ${pt(H)} Q${H[0] + 4} ${(H[1] + Bt[1]) / 2} ${pt(Bt)} Q${(Bt[0] + C[0]) / 2} ${Math.max(Bt[1], C[1]) + 1} ${pt(C)}Z`, SP);
      // 三花：背上一块橘色、臀边一块墨色
      const mid = lerpP(Sh, H, 0.55);
      k.fillStyle = CALICO;
      k.fill(path(`M${mid[0] - 3.4} ${mid[1] + 0.6} Q${mid[0]} ${mid[1] - 3} ${mid[0] + 4} ${mid[1] + 0.2} Q${mid[0] + 1} ${mid[1] + 3.6} ${mid[0] - 3.4} ${mid[1] + 0.6}Z`));
      const hb = lerpP(Sh, H, 0.85);
      blot(k, oval(hb[0], hb[1] + 1.4, 1.8, 1.2));
      shape(k, `${oval(F1[0] - 0.4, F1[1] - 0.6, 1.5, 0.9)} ${oval(F2[0] - 0.4, F2[1] - 0.6, 1.5, 0.9)}`, SP * 0.7);

      // 头：在头的局部坐标里画（原作 translate + rotate），耳朵、头、头顶墨斑、眼睛和胡须
      k.save();
      k.translate(X(pose.hd), Y(pose.hd) - breathe);
      k.rotate(pose.tilt * Math.PI / 180);
      const e = pose.ear, tw = ear * 0.6;               // 抖耳：左耳尖一下压低再弹回
      k.lineJoin = 'round';
      shape(k, `M-4 -2 L${-4.2 - (1 - e) * 1.4} ${-7.4 + (1 - e) * 3 + tw} L-1 -3.6Z M1.4 -3.8 L${3.6 + (1 - e) * 1.6} ${-7.2 + (1 - e) * 3} L4.4 -1.8Z`, SP * 0.9);
      const head = new Path2D(); head.ellipse(0, 0, 4.6, 4.1, 0, 0, TAU);
      shape(k, head, SP);
      blot(k, 'M-4.4 -1.2 Q-3.6 -3.8 -0.6 -4 Q-1.6 -1.6 -4.4 -1.2Z');
      pen(k, (pose.eye > 0.5 ? 'M-2.6 -0.4 a0.6 0.8 0 1 0 0.1 0 M1 -0.4 a0.6 0.8 0 1 0 0.1 0' : 'M-3.2 -0.2 q0.7 0.7 1.4 0 M0.6 -0.2 q0.7 0.7 1.4 0') +
        ' M-1.2 1.4 l0.6 0.5 l0.6 -0.5 M-4.4 1.6 l-3.6 -0.4 M-4.4 2.4 l-3.4 0.8 M2.6 1.8 l3.4 -0.2', SP * 0.6);
      k.restore();
      k.restore();
    };
  }

  // @element 05
  // 电线上的麻雀：两根电线杆之间一根下垂的电线，七只麻雀停在上面跳、转身、啄羽、甩尾；中段一只被惊起，三只先后跟着飞走，
  // 再先后从画面外飞回原位，电线随停落的重量下沉、回弹。对应原作 examples/village/critters.ts 的 createSparrows 和 houses.ts 的电线杆与电线：
  // 原作的动作随机触发、点一下才惊飞，这里排成时间表；原作电线是静止的，这里给每只鸟的重量挂一个弹簧，电线才会下沉回弹。
  {
    // 原作麻雀按场景单位画（整幅 960 宽、一只鸟身长约 6 单位），卡片只看一段电线，所以整体放大 S 倍
    const S = 2.2;
    const SP = 0.8;                                   // 原作场景笔宽（village/kit.ts 的 SP），放大后约 1.8 px
    const Y0 = 36;                                    // 电线挂点高度（场景单位）；原作 112，整体上移 76
    const DY = 112 - Y0;
    const POLE_L = 26, POLE_R = 219;                  // 两根杆的中心；横担 ±22，两端都在画面里
    const XA = POLE_L + 20, XB = POLE_R - 20, L = XB - XA;   // 原作电线挂在杆中心外 20 单位（488 = 468 + 20）
    const SAG = 26 * L / 482;                         // 原作右侧一跨 482 单位垂 26，按跨度同比例
    const DIP = 1.2;                                  // 一只鸟停在跨中压下的深度；原作电线不动，这个值只为看得出下沉
    const PERCH = 0.8;                                // 原作身体基准在电线上方 2.5，放大后脚悬空，这里让脚正好踩在线上
    const CAP = '#7a5a3c';
    const WIRE = { type: 'spring', k: 40, d: 6 };     // 原作 motion.md 的默认弹簧 spring(40, 6)，欠阻尼，落下会回弹一两下
    const HOP = 0.22, HOP_UP = 3.2;                   // 原作一跳 0.22 秒、高 3.2
    const FLAP = Math.round(34 * CYC / TAU);          // 原作拍翅 34 rad/s，取整成周期内整数次
    // 原作七个停位 540…850 的疏密节奏，缩放到这一跨里（两端各留 16 单位）
    const SPOTS = [540, 575, 610, 660, 720, 790, 850].map(s => XA + 16 + (s - 540) / 310 * (L - 32));
    // 每只鸟的时间表：停着的动作照原作四种（跳、转身、啄羽、甩尾），原作间隔 0.8–3.6 秒，这里取 0.4–1.7 秒，否则 6.4 秒里每只鸟只动一两下；
    // 一个周期里跳的距离相加为零、转身次数为偶数，6.4 秒回到起始位置和朝向。
    // fly：起飞时刻、飞走用时、飞回时刻、飞回用时（原作 1.8–3.2 / 2.2–3.4 秒），和贝塞尔控制点。
    // 飞行距离按原作的约一半（爬高 26–32 单位，原作 40–80），否则一出发就飞出画面。
    // 飞回的最后一段从停位的「背后」进来，落下时朝向和起始时一致。
    const BIRDS = [
      { dir: 1, acts: [[0.8, 'peck'], [2.4, 'turn'], [3.4, 'hop', 6], [4.9, 'turn'], [5.9, 'hop', 6]] },
      { dir: -1, acts: [[1.2, 'tail'], [2.9, 'turn'], [4.6, 'peck'], [5.8, 'turn']] },
      { dir: 1, acts: [[0.7, 'peck']],
        fly: { off: 1.56, durA: 1.8, a: { c1: [12, -32], c2: [20, -28], p1: [-18, -4] }, back: 3.70, durB: 2.25, b: { p0: [-18, 18], c1: [40, 6], c2dx: -16 } } },
      // 中段这只最先被惊起
      { dir: -1, acts: [[0.6, 'peck'], [6.05, 'tail']],
        fly: { off: 1.30, durA: 1.85, a: { c1: [20, -30], c2: [200, -27], p1: [262, -8] }, back: 3.30, durB: 2.2, b: { p0: [262, 4], c1: [150, 8], c2dx: 18 } } },
      { dir: 1, acts: [[0.25, 'tail'], [1.05, 'turn']],
        fly: { off: 1.42, durA: 1.8, a: { c1: [-15, -26], c2: [215, -26], p1: [262, -6] }, back: 3.50, durB: 2.2, b: { p0: [-18, 10], c1: [70, 2], c2dx: -20 } } },
      { dir: -1, acts: [[0.2, 'hop', 5], [1.0, 'peck']],
        fly: { off: 1.72, durA: 1.9, a: { c1: [-10, -28], c2: [230, -30], p1: [262, 8] }, back: 3.85, durB: 2.25, b: { p0: [262, -6], c1: [200, 12], c2dx: 18 } } },
      { dir: -1, acts: [[0.4, 'hop', 5], [1.9, 'turn'], [3.0, 'hop', 5], [4.6, 'peck'], [5.6, 'turn']] },
    ];
    BIRDS.forEach((b, i) => { b.x = SPOTS[i]; });

    const baseY = x => { const v = (x - XA) / L; return Y0 + SAG * 4 * v * (1 - v); };
    // 一只鸟在 a 处的重量让整跨弯成两段直线（张紧的弦受集中力），跨中最深、靠杆处几乎不动
    const wireY = (x, s, ax) => {
      let y = baseY(x);
      if (x <= XA || x >= XB) return y;
      for (let i = 0; i < s.length; i++) {
        const a = clamp(ax[i], XA + 0.1, XB - 0.1), dx = x - XA, da = a - XA;
        y += DIP * s[i] * (4 / L) * (dx < da ? dx * (L - da) : da * (L - dx)) / L;
      }
      return y;
    };

    // 停在线上时的状态：每个动作都按「从哪一刻开始」直接算出来，不逐帧累加
    const perched = (b, u, from) => {
      let x = b.x, dir = b.dir, lift = 0, pk = 0, tf = 0;
      for (const [t, kind, dist] of b.acts) {
        if (t < from || t > u) continue;
        const e = u - t;
        if (kind === 'turn') dir = -dir;
        else if (kind === 'hop') {
          const h = e / HOP;
          if (h >= 1) x += dir * dist;
          else { x += dir * dist * ease(h); lift = Math.sin(Math.PI * h) * HOP_UP; }
        } else if (kind === 'peck' && e < 0.5) pk = Math.sin(Math.PI * (1 - 2 * e)) * 1.6;   // 原作 peck 每秒减 2
        else if (kind === 'tail' && e < 1 / 3) { const tl = 1 - 3 * e; tf = Math.sin(tl * 20) * 1.6 * tl; }   // 原作 tail 每秒减 3
      }
      return { x, dir, lift, pk, tf };
    };
    const bez = (p0, c1, c2, p1, s) => {
      const a = 1 - s;
      return [0, 1].map(j => a * a * a * p0[j] + 3 * a * a * s * c1[j] + 3 * a * s * s * c2[j] + s * s * s * p1[j]);
    };
    // 飞行朝向取曲线切线方向；原作取前方一小步的位置差，落地那一刻差为零会翻成朝右，这里用导数避免
    const bezDir = (p0, c1, c2, p1, s) => {
      const a = 1 - s, dx = 3 * a * a * (c1[0] - p0[0]) + 6 * a * s * (c2[0] - c1[0]) + 3 * s * s * (p1[0] - c2[0]);
      return dx >= 0 ? 1 : -1;
    };

    // 电线对每只鸟的「负重目标」：停着为 1，飞着为 0；起跳前一瞬和落下后一瞬蹬一下，弹簧被踢动才看得出回弹
    const load = (b, u) => {
      const f = b.fly;
      if (f) {
        const land = f.back + f.durB;
        if (u >= f.off - 0.06 && u < f.off) return 2.5;
        if (u >= f.off && u < land) return 0;
        if (u >= land && u < land + 0.06) return 2.5;
      }
      for (const [t, kind] of b.acts) {
        if (kind !== 'hop') continue;
        if (u >= t - 0.04 && u < t) return 2;
        if (u >= t && u < t + HOP) return 0;
        if (u >= t + HOP && u < t + HOP + 0.05) return 2;
      }
      return 1;
    };
    const wire = sim(BIRDS.map(() => WIRE), u => BIRDS.map(b => load(b, u)));

    // 原作 houses.ts 的电线杆（杆身、箍、横担、四个瓷瓶，右杆带变压器），平移到卡片坐标；只与参数有关，缓存成 Path2D
    let poles = null;
    const buildPoles = () => {
      const y = v => v - DY, out = [];
      for (const cx of [POLE_L, POLE_R]) {
        const o = cx - 468;
        const X = v => v + o;
        out.push(['shape', `M${X(465)} ${y(352)} L${X(466.5)} ${y(98)} L${X(470.5)} ${y(98)} L${X(472)} ${y(352)}Z`, SP * 0.9]);
        out.push(['pen', `M${X(466)} ${y(140)} L${X(471)} ${y(140)} M${X(466)} ${y(200)} L${X(471)} ${y(200)}`, SP * 0.5]);
        out.push(['shape', `M${X(446)} ${y(110)} L${X(490)} ${y(110)} L${X(490)} ${y(114)} L${X(446)} ${y(114)}Z`, SP * 0.8]);
        for (const ix of [450, 458, 478, 486]) out.push(['shape', `M${X(ix) - 1.6} ${y(110)} L${X(ix) + 1.6} ${y(110)} L${X(ix) + 1.2} ${y(105)} L${X(ix) - 1.2} ${y(105)}Z`, SP * 0.5]);
        if (cx === POLE_R) {
          out.push(['shape', `M${X(472)} ${y(140)} Q${X(480)} ${y(140)} ${X(480)} ${y(146)} L${X(480)} ${y(170)} Q${X(480)} ${y(176)} ${X(472)} ${y(176)}Z`, SP * 0.8]);
          out.push(['pen', `M${X(472)} ${y(150)} L${X(479)} ${y(150)} M${X(472)} ${y(160)} L${X(479)} ${y(160)}`, SP * 0.45]);
        }
      }
      return out.map(([kind, d, w]) => [kind, new Path2D(d), w]);
    };
    // 电线是细分折线，每个点按序号加固定小偏移，像墨线；偏移跟着线走，不随帧抖
    const wirePath = (fy, x1, x2, n, seed) => {
      let d = '';
      for (let j = 0; j <= n; j++) {
        const x = mix(x1, x2, j / n), o = j === 0 || j === n ? 0 : (rnd(j, seed) - 0.5) * 0.24;
        d += (j ? 'L' : 'M') + x + ' ' + (fy(x) + o);
      }
      return d;
    };
    const oval = (cx, cy, rx, ry) => { const p = new Path2D(); p.ellipse(cx, cy, rx, ry, 0, 0, TAU); return p; };

    CELLS[4] = (k, w, h, u) => {
      paper(k);
      if (!poles) poles = buildPoles();
      const s = wire(u);
      // 先解出每只鸟这一刻在哪、什么状态；电线的负重位置要用停着时的 x
      const st = BIRDS.map((b, i) => {
        const f = b.fly;
        if (!f) return Object.assign(perched(b, u, -1), { mode: 'perch' });
        const land = f.back + f.durB;
        if (u < f.off) return Object.assign(perched(b, u, -1), { mode: 'perch' });
        if (u >= land) return Object.assign(perched(b, u, land), { mode: 'perch' });
        const pre = perched(b, f.off, -1);
        if (u < f.off + f.durA) return Object.assign(pre, { mode: 'away', t: (u - f.off) / f.durA, lift: 0, pk: 0, tf: 0 });
        if (u < f.back) return { mode: 'gone', x: b.x };
        return { mode: 'back', t: (u - f.back) / f.durB, x: b.x, lift: 0, pk: 0, tf: 0 };
      });
      const ax = st.map(q => q.x);
      const wy = x => wireY(x, s, ax);

      k.save();
      k.scale(S, S);
      // 电线：上面一根载鸟、随弹簧下沉；下面一根在原作里比上面低 7、中段稍多垂一点，不载鸟、不动
      pen(k, wirePath(wy, XA, XB, 40, 1), SP * 0.5);
      pen(k, wirePath(x => baseY(x) + 7 * (1 + 0.3 * Math.sin(Math.PI * (x - XA) / L)), XA, XB, 40, 2), SP * 0.5);
      // 杆外侧的下一跨只露出一小段，照原作左跨的坡度向外垂
      for (const off of [0, 7]) {
        pen(k, `M${POLE_L - 20} ${Y0 + off} L${POLE_L - 40} ${Y0 + off + 3.4}`, SP * 0.5);
        pen(k, `M${POLE_R + 20} ${Y0 + off} L${POLE_R + 40} ${Y0 + off + 4.1}`, SP * 0.5);
      }
      for (const [kind, p, lw] of poles) (kind === 'shape' ? shape : pen)(k, p, lw);

      BIRDS.forEach((b, i) => {
        const q = st[i];
        if (q.mode === 'gone') return;
        let x, y, d, flying = false;
        if (q.mode === 'perch') { x = q.x; y = wy(x) - PERCH - q.lift; d = q.dir; }
        else {
          const f = b.fly;
          let p0, c1, c2, p1;
          if (q.mode === 'away') {
            // 起飞点取起飞那一刻电线的位置，之后电线回弹不再拖着鸟
            const s0 = wire(f.off), ax0 = ax.slice(); ax0[i] = q.x;
            p0 = [q.x, wireY(q.x, s0, ax0) - PERCH];
            c1 = [q.x + f.a.c1[0], p0[1] + f.a.c1[1]]; c2 = [f.a.c2[0], p0[1] + f.a.c2[1]]; p1 = f.a.p1;
          } else {
            p0 = f.b.p0; c1 = f.b.c1; c2 = [b.x + f.b.c2dx, baseY(b.x) - 22];
            p1 = [b.x, wy(b.x) - PERCH];                // 终点跟着这一刻的电线，落下时和停着的画法接上
          }
          const e = ease(q.t);
          [x, y] = bez(p0, c1, c2, p1, e);
          d = bezDir(p0, c1, c2, p1, e);
          flying = q.t < 0.97;
        }
        const pk = q.pk, X = dx => x + dx * d;
        // 以下造型照原作：身体椭圆、帽斑、颊点、喙、尾线、收着的翅、两条腿，飞时换成两条拍动的翅
        pen(k, `M${X(-2.4)} ${y - 2.6} L${X(-6)} ${y - 0.6 - q.tf}`, SP * 0.9);
        shape(k, oval(x, y - 2.8, 3.1, 2.4), SP * 0.7);
        // 原作帽斑的圆弧方向不随朝向翻转，朝左的鸟帽子会扣到下面；这里按朝向翻转弧的方向
        k.fillStyle = CAP;
        k.fill(new Path2D(`M${X(0.8)} ${y - 5.6 + pk} a2 1.8 0 0 ${d > 0 ? 1 : 0} ${3.6 * d} 0Z`));
        blot(k, oval(x + 2.6 * d, y - 4.4 + pk, 0.6, 0.6));
        blot(k, `M${X(4.4)} ${y - 5.2 + pk} L${X(6)} ${y - 4.8 + pk} L${X(4.4)} ${y - 4.3 + pk}Z`);
        if (flying) {
          const fl = Math.sin(TAU * FLAP * u / CYC + i) * 4;
          pen(k, `M${X(0)} ${y - 3.4} L${X(-2)} ${y - 3.4 - fl} M${X(0.6)} ${y - 3} L${X(2.4)} ${y - 3 - fl * 0.8}`, SP * 0.8);
        } else {
          pen(k, `M${X(-1.6)} ${y - 3.6} Q${X(0.6)} ${y - 2.2} ${X(-2.2)} ${y - 1.4}`, SP * 0.5);
          pen(k, `M${X(-0.4)} ${y - 0.6} L${X(-0.4)} ${y + 0.6} M${X(0.8)} ${y - 0.6} L${X(0.8)} ${y + 0.6}`, SP * 0.4);
        }
      });
      k.restore();
    };
  }

  // @element 06
  // 锦鲤跃水：运河护岸下的水面上墨线水纹慢慢漂，锦鲤在水下隐约游近，划弧跃出、空中顺着弧线翻身，落水溅起水珠，几圈涟漪扩散变淡，最后回到平静水面。
  // 对应原作 examples/village/canal.ts 的 buildCanal（护岸、水面、水纹、涟漪、锦鲤跃水）。原作点水面才跳、白天偶尔随机跳，这里按时间跳一次；
  // 原作锦鲤只在空中出现，这里补上水下隐约游近、落水后潜走（按水面裁开，水下那半淡画），并加了出水、落水的水珠，任务要求有水花。
  {
    // 全部按原作单位画，再整体放大：原作运河段（护岸顶到画面底）约 96 单位高，放大 2.3 倍正好填满卡片高度
    const S = 2.3;
    const VW = CW / S, VH = CH / S;
    const EDGE = 7, WATER = EDGE + 16;               // 原作 EDGE=384、WATER=400：护岸顶到水面 16 单位
    const SP = 0.8;                                   // 原作场景笔宽，放大后与 01 款人物线宽相近
    const R = (i, j, a, b) => a + rnd(i, j) * (b - a);   // 原作 srnd/rnd 的固定种子版
    const mixHex = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(mix(parseInt(a.slice(i, i + 2), 16), parseInt(b.slice(i, i + 2), 16), t)).toString(16).padStart(2, '0')).join('');
    const WATER_FILL = mixHex(PAPER, '#bfd0d8', 0.32);   // 原作白天水色：纸色混 32% 的灰蓝
    const KOI_BODY = '#f4ede0', KOI_SPOT = '#d4552f';

    // 跳跃照搬原作：1.1 秒，水平前进 30、拱高 26，从水面下 14 单位（水面上离护岸 14 的那一点）起跳并落回同一高度
    const T0 = 2.4, JUMP = 1.1, T1 = T0 + JUMP;
    const ARC_W = 30, ARC_H = 26, DEPTH = 14;
    const SURF = WATER + DEPTH;                       // 斜看的水面：锦鲤所在那一条水面线，涟漪也画在这一线上
    const DIR = 1;                                    // 原作随机左右，这里固定向右；改成 -1 即镜像
    const VX = ARC_W / JUMP;                          // 水下游速取跳跃的水平速度，出水、入水时不变速
    // 起跳点让整段可见轨迹（水下游近 → 跳 → 潜走）落在画面中间
    const SWIM_IN = 0.5, SWIM_OUT = T1 + 1.6;
    const X0 = VW / 2 - DIR * VX * ((SWIM_IN + SWIM_OUT) / 2 - T0);
    const DEEP = SURF + 18;                           // 水下巡游深度
    const SUB = 0.4;                                  // 水下的鱼只画四成浓，「隐约」
    // 与鱼弧线同高同时长的抛物线重力（8h/T²），水珠和鱼按同一种重力落下
    const G = 8 * ARC_H / (JUMP * JUMP);

    // 涟漪：原作 ring() 椭圆 rx=(2+12t)·big、ry=(0.6+2.2t)·big，1.6 秒淡完，一组里每圈晚 0.22 秒
    const RING_LIFE = 1.6, RING_GAP = 0.22;
    const rings = [];
    const ring = (t0, x, y, n = 1, big = 1) => { for (let i = 0; i < n; i++) rings.push({ t0: t0 + i * RING_GAP, x, y, big }); };
    ring(T0, X0, SURF, 2);                            // 原作：起跳时两圈
    ring(T0 + 0.1 * JUMP, X0, WATER + 12, 2, 0.9);    // 原作：u≈0.1 时出水滴落的两圈
    ring(T1, X0 + DIR * ARC_W, SURF, 3, 1.2);         // 原作：落水三圈、放大 1.2
    // 原作水面每秒约 0.5 次零星小涟漪（big 0.6）；一个周期约 3 次，时刻避开跳跃，最后一次在 6.0 秒前淡完
    [0.3, 1.5, 4.4].forEach((t, i) => ring(t, R(i, 61, 20, VW - 20), R(i, 62, WATER + 10, VH - 6), 1, 0.6));

    // 水珠：出水时从鱼身甩下几颗，落水时向四周溅起一圈；按抛体算，落回鱼所在的水面线就消失
    const drops = [];
    const spray = (t0, x, n, seed, vxMid, vxSpread, vyMin, vyMax) => {
      for (let i = 0; i < n; i++) drops.push({ t0, x, vx: vxMid + (rnd(i, seed) - 0.5) * vxSpread, vy: R(i, seed + 1, vyMin, vyMax) });
    };
    spray(T0 + 0.06, X0, 4, 80, DIR * 14, 16, 22, 40);
    spray(T1, X0 + DIR * ARC_W, 7, 70, 0, 34, 35, 60);

    // 水纹：原作 46 条横贯 960 宽、分 9 排，每条以 4–9 单位/秒向右漂、出右边回到左边。
    // 照原速一个周期只漂 26–58 单位，回绕不了整幅，循环会跳；所以每条只活一个周期：
    // 漂的同时头尾 1/5 淡入淡出，各条起始相位错开，任一时刻的水纹疏密差不多。条数按画面宽度和平均浓度换算
    const LINE_FADE = 0.2, LINE_MEAN = 1 - LINE_FADE;
    const lines = Array.from({ length: Math.round(46 * (VW + 40) / (960 + 40) / LINE_MEAN) }, (_, i) => ({
      x: R(i, 2, -30, VW), y: WATER + 5 + (i % 9) * 8.4 + R(i, 3, -2, 2), len: R(i, 4, 10, 34), v: R(i, 1, 4, 9), ph: rnd(i, 5),
    }));

    // 护岸：顶石一层、下面两层砌石、零星石面短划和垂下的苔藓，全部静态，首次调用时建好
    let wall = null;
    const buildWall = () => {
      const d = [`M-10 ${EDGE + 5} L${VW + 10} ${EDGE + 5}`, `M-10 ${EDGE + 10.5} Q${VW / 2} ${EDGE + 10} ${VW + 10} ${EDGE + 10.6}`];
      for (let x = R(0, 10, 0, 20), j = 0; x < VW; x += R(j, 11, 28, 44), j++) d.push(`M${x} ${EDGE} l0.4 5`);
      [[EDGE + 5, EDGE + 10.5, 0], [EDGE + 10.5, WATER, 8]].forEach(([y0, y1, o], c) => {
        for (let x = R(c, 12, 0, 14) + o, j = 0; x < VW; x += R(j, 13 + c, 12, 24), j++) {
          d.push(`M${x} ${y0 + 0.4} Q${x + R(j, 15 + c, -1, 1)} ${(y0 + y1) / 2} ${x + R(j, 17 + c, -0.6, 0.6)} ${y1 - 0.4}`);
        }
      });
      for (let i = 0, n = Math.round(40 * VW / 960); i < n; i++) {
        const x = R(i, 20, 4, VW - 4), y = R(i, 21, EDGE + 6, WATER - 2);
        d.push(`M${x} ${y} l${R(i, 22, 1, 2.6)} ${R(i, 23, -0.3, 0.3)}`);
      }
      const moss = [];
      for (let i = 0, n = Math.round(26 * VW / 960); i < n; i++) {
        const x = R(i, 30, 0, VW);
        moss.push(`M${x} ${EDGE + 5} q-1 3 0.4 5 M${x + 2} ${EDGE + 5} q1 2.6 -0.2 4.4`);
      }
      wall = {
        body: new Path2D(`M-10 ${EDGE} L${VW + 10} ${EDGE} L${VW + 10} ${WATER} L-10 ${WATER}Z`),
        joints: new Path2D(d.join(' ')),
        moss: new Path2D(moss.join(' ')),
        water: new Path2D(`M-10 ${WATER} L${VW + 10} ${WATER} L${VW + 10} ${VH + 10} L-10 ${VH + 10}Z`),
        spots: (() => { const p = new Path2D(); [[2, -1.5, 3.2, 1.8], [-5, 1, 2.6, 1.6], [8.6, -0.8, 1.6, 1.2]].forEach(([x, y, rx, ry]) => { p.moveTo(x + rx, y); p.ellipse(x, y, rx, ry, 0, 0, TAU); }); return p; })(),
        eye: (() => { const p = new Path2D(); p.arc(9, -0.8, 0.9, 0, TAU); return p; })(),
      };
    };

    // 鱼的轨迹：跳跃段用原作的正弦拱；前后把这条拱往水下延伸，再在 0.5 秒里和水平巡游混合，
    // 所以鱼是从水下斜着冲上来、落水后斜着扎下去再放平，位置和朝向都连续
    const arcY = u => SURF - ARC_H * Math.sin(Math.PI * u);
    const koiX = t => X0 + DIR * VX * (t - T0);
    const koiY = t => {
      const u = (t - T0) / JUMP;
      if (u >= 0 && u <= 1) return arcY(u);
      const w = u < 0 ? smooth(T0 - 0.5, T0, t) : 1 - smooth(T1, T1 + 0.5, t);
      return mix(DEEP + Math.sin(TAU * 2 * t / CYC), arcY(u), w);
    };
    // 原作：身体朝向切线（ang = atan2(dy, dx)），所以上升时抬头、过顶后低头扎下，这就是「空中翻身」
    const koiAng = t => Math.atan2(koiY(t + 0.01) - koiY(t - 0.01), VX * 0.02);
    // 原作尾巴摆动 sin(u·18)·2；水下沿用同一相位，出水入水不跳
    const koiBend = t => Math.sin((t - T0) * 18 / JUMP) * 2;
    const subAlpha = t => SUB * smooth(SWIM_IN, SWIM_IN + 0.7, t) * (1 - smooth(T1 + 0.4, SWIM_OUT, t));

    // 原作锦鲤：米白身体加墨线、三块朱红斑、纸色胸鳍、墨点眼；尾巴两叉随 bend 摆
    const koi = (k, x, y, ang, bend) => {
      k.save();
      k.translate(x, y); k.rotate(ang * DIR); k.scale(DIR, 1);
      const body = new Path2D(`M-11 0 Q-4 -5.4 6 -3.6 Q11 -2 12 0 Q11 2 6 3.6 Q-4 5.4 -11 0Z M-11 0 L-17 ${-4.5 + bend} Q-15 0 -17 ${4.5 + bend}Z`);
      k.fillStyle = KOI_BODY; k.fill(body); pen(k, body, SP * 0.8);
      k.fillStyle = KOI_SPOT; k.fill(wall.spots);
      shape(k, 'M-1 3 L-4 7.5 L2 4Z', SP * 0.6);
      blot(k, wall.eye);
      k.restore();
    };
    // 以鱼所在的水面线为界：线下是水里，淡画；线上是空中，实画
    const koiPart = (k, t, below) => {
      const a = below ? subAlpha(t) : 1;
      if (a <= 0.001) return;
      k.save();
      k.beginPath();
      if (below) k.rect(-20, SURF, VW + 40, VH); else k.rect(-20, -20, VW + 40, SURF + 20);
      k.clip();
      k.globalAlpha = a;
      koi(k, koiX(t), koiY(t), koiAng(t), koiBend(t));
      k.restore();
    };

    CELLS[5] = (k, w, h, u) => {
      if (!wall) buildWall();
      paper(k);
      k.save();
      k.scale(S, S);

      shape(k, wall.body, SP);
      pen(k, wall.joints, SP * 0.5);
      pen(k, wall.moss, SP * 0.45);
      k.fillStyle = WATER_FILL; k.fill(wall.water);

      // 水下的鱼在水纹、涟漪下面，被水纹划过，看起来是在水里
      if (u > SWIM_IN && u < SWIM_OUT) koiPart(k, u, true);

      inkLine(k, -10, WATER, VW + 10, WATER, SP * 0.8, 6, 0.15);
      for (const l of lines) {
        if (l.y > VH + 2) continue;
        const s = wrap(u / CYC + l.ph, 1);
        const x = l.x + l.v * CYC * (s - 0.5);
        // 原作 sin(t·1.3 + x·0.04)·0.7 的上下浮动，时间频率取整成一个周期一次
        const y = l.y + Math.sin(TAU * u / CYC + x * 0.04) * 0.7;
        k.globalAlpha = smooth(0, LINE_FADE, s) * (1 - smooth(1 - LINE_FADE, 1, s));
        pen(k, `M${x} ${y} Q${x + l.len / 2} ${y - 1.2} ${x + l.len} ${y}`, SP * 0.5);
      }
      k.globalAlpha = 1;
      for (const r of rings) {
        const t = u - r.t0;
        if (t < 0 || t > RING_LIFE) continue;
        k.globalAlpha = 1 - t / RING_LIFE;
        const e = new Path2D(); e.ellipse(r.x, r.y, (2 + t * 12) * r.big, (0.6 + t * 2.2) * r.big, 0, 0, TAU);
        pen(k, e, SP * 0.55);
      }
      k.globalAlpha = 1;
      for (const d of drops) {
        const t = u - d.t0;
        if (t <= 0) continue;
        const y = SURF - d.vy * t + G * t * t / 2;
        if (y > SURF) continue;
        // 水珠拉长成沿速度方向的小椭圆，纸色填充、细墨线
        const e = new Path2D(); e.ellipse(d.x + d.vx * t, y, 1.3, 0.75, Math.atan2(G * t - d.vy, d.vx), 0, TAU);
        shape(k, e, SP * 0.5);
      }

      // 出水前鱼头、入水后鱼尾也会露出水面线，所以整段可见时间里都画线上那半
      if (u > SWIM_IN && u < SWIM_OUT) koiPart(k, u, false);
      k.restore();
    };
  }

  // @element 07
  // 风吹柳条与暖帘：茶屋屋檐下挂着风铃、两盏红灯笼和四片暖帘，左边一棵垂柳；风从左边来，先一阵弱风、再一阵强风，然后慢慢停下。
  // 对应原作 examples/village 的 houses.ts（noren、chochin、fūrin）与 canal.ts（柳条）；钟摆 k/d 和推力系数照搬，指针风改成按时间的阵风。
  {
    const S = 2.2;                                    // 场景单位 → 画面像素；SP×S ≈ 01 款的笔宽，几款并排时线一样粗
    const SP = 0.8;                                   // 原作 village 的场景笔宽
    const RED = '#b3412d', CREAM = '#fbf3e6', GLASS = '#e8f2f4';
    const JP = '"Hiragino Mincho ProN","Yu Mincho","YuMincho","Noto Serif JP","Songti SC",serif';
    const GROUND = 88, EAVE = 16;
    const WIND_SPEED = 230;                           // 阵风前沿的推进速度（单位/秒），离左边越远越晚被吹到
    // 阵风：原作风力范围是 0.3 基础风到指针最大 2.4；这里弱风 0.8、强风到 2.4，强风里带一点起伏
    const WEAK = 1.0, STRONG = 2.4;
    const bump = (t, a, b, c, d) => smooth(a, b, t) * (1 - smooth(c, d, t));
    const wind = t => {
      t = wrap(t);
      return WEAK * bump(t, 0.1, 0.6, 0.9, 1.6) + STRONG * bump(t, 1.8, 2.3, 2.7, 3.5) * (1 + 0.12 * Math.sin(TAU * (t - 1.8) * 1.25));
    };
    // 原作每个物件都还有一点自己的小抖动（wobble、正弦）；它们只在有风时出现，风停后不再推，物件才能真的静下来
    const env = t => clamp(wind(t) / WEAK);
    // 风停后把物件「收住」：原作阻尼很小（柳条 d=0.9 要好几秒才停），6.4 秒时还在晃，接不回开头的静止。
    // 所以风过去后把回复力加到 CALM_K 倍、阻尼加到临界，像空气静下来；开头 0.15 秒内退回原作参数，此时还没有风，看不出切换
    const CALM = [3.4, 4.2], CALM_K = 3;
    const calm = t => { t = wrap(t); return t < 2 ? 1 - smooth(0, 0.15, t) : smooth(CALM[0], CALM[1], t); };
    const wobble = (t, k = 1) => Math.sin(t * 1.3 * k) * 0.6 + Math.sin(t * 2.7 * k + 1.7) * 0.3 + Math.sin(t * 5.1 * k + 4.1) * 0.1;

    // —— 物件位置（场景单位）——
    const FURIN = { x: 96, y: 30 };                  // 挂点；上面一段固定细绳连到檐下
    const LANTERNS = [{ x: 120, y: 22, ph: 0.7 }, { x: 216, y: 22, ph: 3.1 }];
    const NOREN = { x0: 136, x1: 202, y: 25, len: 24, panels: 4, label: '茶' };
    const DOOR = [132, 23, 206, 88];
    const PILLARS = [74, 232];
    // 柳：原作 canal.ts 的树干和枝条整体平移，树干大半出了左边，只露出几根枝条挂下来的柳条
    const WDX = -30, WDY = -200;
    const ROOTS = [[104, 212], [86, 252], [82, 190], [64, 216], [52, 252], [70, 196], [94, 230], [40, 226]];
    const strands = [];
    ROOTS.forEach(([rx, ry], i) => {
      for (let j = 0; j < 2; j++) {
        // 原作 srnd(-10,10)、srnd(-3,5)、srnd(80,150)、stiff 0.7–1.3，换成固定种子
        const y = ry + WDY - 3 + rnd(i, j + 7) * 8;
        // 原作柳条垂到水面；这里画面矮，末端停在地面上方
        strands.push({ x: rx + WDX + (rnd(i, j) - 0.5) * 20, y, len: Math.min(80 + rnd(i, j + 13) * 70, GROUND - 8 - y), ph: rnd(i, j + 19) * 6, stiff: 0.7 + rnd(i, j + 29) * 0.6 });
      }
    });

    // —— 钟摆：照搬原作每个物件的 k、d 和推力 ——
    // kit 的 sim() 推力只能由 u 决定；风铃舌要跟着铃身走（原作 -(sa - a·1.6)·9），风停后还要加阻尼，所以这里自己积分，做法与 sim() 相同
    const units = [];
    const unit = (k, d, x, force) => units.push({ k, d, delay: x / WIND_SPEED, force }) - 1;
    const iStrand = strands.map(s => unit(3.2 * s.stiff, 0.9, s.x, (t, tl) => wind(tl) * 0.32 + wobble(t * 0.6 + s.ph) * 0.12 * env(tl)));
    const iLantern = LANTERNS.map(l => unit(10, 1.1, l.x, (t, tl) => wind(tl) * 0.5 + Math.sin(t * 0.9 + l.ph) * 0.15 * env(tl)));
    const nw = (NOREN.x1 - NOREN.x0) / NOREN.panels;
    const iCloth = Array.from({ length: NOREN.panels }, (_, i) => unit(22, 3.2, NOREN.x0 + (i + 0.5) * nw, (t, tl) => wind(tl) * 2.2 + Math.sin(t * 1.7 + i * 1.9) * 0.6 * env(tl)));
    const iBell = unit(14, 1.4, FURIN.x, (t, tl) => wind(tl) * 0.9 + wobble(t * 0.7) * 0.4 * env(tl));
    // 舌的「弹簧」k=9 拉向铃身角度的 1.6 倍：k·1.6·a 作为推力的一部分
    const iClap = unit(9, 1.6, FURIN.x, (t, tl, x) => 9 * 1.6 * x[iBell] + wind(tl) * 2.2 + Math.sin(t * 2.3) * 0.6 * env(tl));
    const DT = SIM_DT, N = Math.round(CYC / DT), M = units.length;
    // 舌与铃身的相对角超过这个值算碰到铃身：只有强风里摆得最大的几下过线
    const HIT = 0.35;
    let table = null, hits = null;
    const build = () => {
      const x = new Float64Array(M), v = new Float64Array(M);
      table = new Float64Array(N * M);
      for (let c = 0; c < SIM_WARM; c++) for (let n = 0; n < N; n++) {
        if (c === SIM_WARM - 1) for (let m = 0; m < M; m++) table[n * M + m] = x[m];
        const t = n * DT;
        for (let m = 0; m < M; m++) {
          const s = units[m], tl = t - s.delay;
          const c = calm(tl), kk = s.k * mix(1, CALM_K, c), d = mix(s.d, Math.max(s.d, 2 * Math.sqrt(kk)), c);
          v[m] += (-x[m] * kk + s.force(t, tl, x) - v[m] * d) * DT;   // 原作 pendulum()
          x[m] += v[m] * DT;
        }
      }
      // 碰铃时刻：相对角向外越过 HIT；两次之间至少隔 0.3 秒，免得同一下在阈值附近抖出两次
      hits = [];
      for (let n = 0; n < N; n++) {
        const r0 = Math.abs(table[((n + N - 1) % N) * M + iClap] - table[((n + N - 1) % N) * M + iBell]);
        const r1 = Math.abs(table[n * M + iClap] - table[n * M + iBell]);
        if (r0 < HIT && r1 >= HIT && (!hits.length || n * DT - hits[hits.length - 1] > 0.3)) hits.push(n * DT);
      }
    };
    const state = u => {
      if (!table) build();
      const f = wrap(u) / DT, i = Math.floor(f) % N, t = f - Math.floor(f), j = (i + 1) % N;
      const out = new Float64Array(M);
      for (let m = 0; m < M; m++) out[m] = table[i * M + m] * (1 - t) + table[j * M + m] * t;
      return out;
    };
    // 原作 ring 每秒减 0.9：碰一下后声线在约 1.1 秒里淡出
    const ringAt = u => { let r = 0; for (const h of hits) r = Math.max(r, 1 - wrap(u - h) * 0.9); return r; };

    // —— 静止部分（屋檐、墙、门、柱、地面、树干），首次调用时建成 Path2D ——
    const rect = (x0, y0, x1, y1) => `M${x0} ${y0} L${x1} ${y0} L${x1} ${y1} L${x0} ${y1}Z`;
    let ST = null;
    const buildStatic = () => {
      // 原作 roof()：瓦沟线收向屋脊、檐口一排圆瓦头、封檐板和椽头；屋脊在画面上方之外
      const x0 = 70, x1 = 330, ridge = -24, inset = 30, tile = 5.6, sori = 2.8, depth = 2.6;
      const cx = (x0 + x1) / 2;
      const eaveY = x => EAVE - sori * Math.pow(Math.abs(x - cx) / ((x1 - x0) / 2), 2.2);
      const ch = [], ends = [], raf = [];
      for (let x = x0 + tile * 0.8; x < x1 - tile * 0.4; x += tile) {
        const t = (x - x0) / (x1 - x0), ey = eaveY(x) - 0.4, top = mix(x0 + inset, x1 - inset, t);
        ch.push(`M${x} ${ey - 1.6} Q${mix(x, top, 0.5) + (t - 0.5) * 2} ${mix(ey, ridge, 0.55)} ${top} ${ridge + 1}`);
        ends.push(`M${x + 1.35} ${ey} A1.35 1.35 0 1 0 ${x - 1.35} ${ey} A1.35 1.35 0 1 0 ${x + 1.35} ${ey}Z`);
      }
      for (let x = x0 + 5; x < x1 - 3; x += 4.2) raf.push(`M${x} ${eaveY(x) + depth + 0.6} l0 1.8`);
      // 柳：原作的树干和三根主枝，平移到左上
      const W = (x, y) => `${x + WDX} ${y + WDY}`;
      const gut = [];
      for (let x = 0, i = 0; x < CW / S; x += 16 + rnd(i, 3) * 10, i++) gut.push(`M${x} ${GROUND} L${x} ${GROUND + 4}`);
      ST = {
        wall: new Path2D(rect(x0 + 2, EAVE, CW / S + 2, GROUND)),
        beam: new Path2D(`M${x0 + 2} ${EAVE + 6} L${CW / S + 2} ${EAVE + 6}`),
        roof: new Path2D(`M${x0} ${eaveY(x0)} Q${cx} ${EAVE + sori * 0.6} ${x1} ${eaveY(x1)} L${x1 - inset} ${ridge} L${x0 + inset} ${ridge}Z`),
        channels: new Path2D(ch.join(' ')),
        tiles: new Path2D(ends.join(' ')),
        fascia: new Path2D(`M${x0 + 1} ${eaveY(x0) + depth} Q${cx} ${EAVE + sori * 0.6 + depth} ${x1 - 1} ${eaveY(x1) + depth}`),
        rafters: new Path2D(raf.join(' ')),
        pillars: PILLARS.map(x => new Path2D(rect(x, eaveY(x) + depth + 2.4, x + 5, GROUND))),
        // 门：原作茶屋入口，门框加一横一竖两道格（白天门里是纸色）
        door: new Path2D(rect(...DOOR)),
        doorLines: new Path2D(`M${DOOR[0] + 3} ${DOOR[1] + 34} L${DOOR[2] - 3} ${DOOR[1] + 34} M${(DOOR[0] + DOOR[2]) / 2} ${DOOR[1] + 3} L${(DOOR[0] + DOOR[2]) / 2} ${GROUND}`),
        string: new Path2D(`M${FURIN.x} ${eaveY(FURIN.x) + depth} L${FURIN.x} ${FURIN.y - 3}`),
        ground: new Path2D(`M0 ${GROUND} L${CW / S} ${GROUND}`),
        gutter: new Path2D(`M0 ${GROUND + 4} L${CW / S} ${GROUND + 4} ` + gut.join(' ')),
        trunk: new Path2D(`M${W(14, 384)} Q${W(20, 340)} ${W(16, 300)} Q${W(12, 262)} ${W(34, 236)} Q${W(46, 222)} ${W(40, 206)} L${W(46, 206)} Q${W(54, 226)} ${W(42, 244)} Q${W(24, 270)} ${W(28, 306)} Q${W(32, 344)} ${W(28, 384)}Z`),
        boughs: new Path2D(`M${W(36, 238)} Q${W(66, 214)} ${W(104, 212)} M${W(30, 260)} Q${W(60, 246)} ${W(86, 252)} M${W(40, 222)} Q${W(22, 204)} ${W(-4, 202)} M${W(42, 214)} Q${W(56, 196)} ${W(82, 190)}`),
        bark: new Path2D(`M${W(20, 330)} q3 -6 0 -12 M${W(24, 290)} q-3 -6 1 -12`),
      };
    };

    // 原作 chochin()：红纸灯笼、四道竹骨、上下黑箍、挂钩，字是奶白色
    const lantern = (k, l, a) => {
      const r = 6.4, h = 15;
      k.save(); k.translate(l.x, l.y); k.rotate(-a);
      paint(k, `M${-r * 0.75} 4 Q${-r * 1.18} ${4 + h / 2} ${-r * 0.75} ${4 + h} L${r * 0.75} ${4 + h} Q${r * 1.18} ${4 + h / 2} ${r * 0.75} 4Z`, RED, SP * 0.8);
      const ribs = [];
      for (let i = 1; i < 5; i++) { const yy = 4 + (h * i) / 5, wv = r * (1.18 - 0.3 * Math.abs(i / 5 - 0.5) * 2); ribs.push(`M${-wv * 0.95} ${yy} Q0 ${yy + 1} ${wv * 0.95} ${yy}`); }
      pen(k, ribs.join(' '), SP * 0.4);
      blot(k, `M${-r * 0.6} 2 L${r * 0.6} 2 L${r * 0.6} 4.4 L${-r * 0.6} 4.4Z M${-r * 0.6} ${4 + h - 0.4} L${r * 0.6} ${4 + h - 0.4} L${r * 0.6} ${6.4 + h} L${-r * 0.6} ${6.4 + h}Z`);
      pen(k, 'M0 -4 L0 2', SP * 0.5);
      k.fillStyle = CREAM; k.font = `700 ${h * 0.42}px ${JP}`; k.textAlign = 'center'; k.textBaseline = 'middle';
      k.fillText('茶', 0, 4 + h / 2);
      k.restore();
    };

    CELLS[6] = (k, w, h, u) => {
      paper(k);
      if (!ST) buildStatic();
      const x = state(u), ring = ringAt(u);
      k.save(); k.scale(S, S);

      // 墙、门、屋檐、柱
      shape(k, ST.wall, SP);
      pen(k, ST.beam, SP * 0.6);
      shape(k, ST.door, SP * 0.9);
      pen(k, ST.doorLines, SP * 0.45);
      shape(k, ST.roof, SP);
      pen(k, ST.channels, SP * 0.5);
      k.fillStyle = PAPER; k.fill(ST.tiles); pen(k, ST.tiles, SP * 0.55);
      pen(k, ST.fascia, SP * 0.7);
      pen(k, ST.rafters, SP * 0.6);
      ST.pillars.forEach(p => shape(k, p, SP * 0.8));
      pen(k, ST.ground, SP);
      pen(k, ST.gutter, SP * 0.5);

      // 暖帘：原作 noren()，每片下摆偏移 a·len·0.45，下沿再加一点抖动；字随各片平均偏移移动
      const { x0, x1, y, len, panels } = NOREN;
      pen(k, `M${x0 - 2} ${y} L${x1 + 2} ${y}`, SP * 1.2);
      let sw = 0;
      for (let i = 0; i < panels; i++) {
        const cxp = x0 + i * nw, cw = nw - 0.8;
        const s = x[iCloth[i]] * len * 0.45, flt = Math.sin(u * 3.1 + i) * 0.5 * env(u - units[iCloth[i]].delay);
        shape(k, `M${cxp} ${y} L${cxp + cw} ${y} Q${cxp + cw + s * 0.4} ${y + len * 0.6} ${cxp + cw + s + flt} ${y + len} L${cxp + s + flt} ${y + len - 0.6} Q${cxp + s * 0.4} ${y + len * 0.6} ${cxp} ${y}Z`, SP * 0.8);
        sw += s;
      }
      k.fillStyle = INK; k.font = `700 ${Math.min(len * 0.42, nw * 0.95)}px ${JP}`; k.textAlign = 'center'; k.textBaseline = 'middle';
      k.fillText(NOREN.label, (x0 + x1) / 2 + (sw / panels) * 0.6, y + len * 0.48);

      LANTERNS.forEach((l, i) => lantern(k, l, x[iLantern[i]]));

      // 风铃：原作 furin，铃身挂在 6 长的绳上平移（不转），舌从铃顶垂下、末端一小横，再挂一张短签
      const a = x[iBell], sa = x[iClap];
      pen(k, ST.string, SP * 0.45);
      const bx = FURIN.x + Math.sin(a) * 6, by = FURIN.y + Math.cos(a) * 6;
      pen(k, `M${FURIN.x} ${FURIN.y - 3} L${bx} ${by}`, SP * 0.45);
      const cx = bx + Math.sin(sa) * 4, cy = by + 5 + Math.cos(sa) * 4;
      pen(k, `M${bx} ${by} L${cx} ${cy} M${cx - 0.8} ${cy} l1.6 0`, SP * 0.45);
      paint(k, `M${bx - 4} ${by + 5} Q${bx - 4.2} ${by - 0.6} ${bx} ${by - 0.6} Q${bx + 4.2} ${by - 0.6} ${bx + 4} ${by + 5}Z`, GLASS, SP * 0.7);
      const sx = cx + Math.sin(sa) * 9, sy = cy + Math.cos(sa) * 9;
      shape(k, `M${cx - 1.6} ${cy + 1} L${cx + 1.6} ${cy + 1} L${sx + 1.6} ${sy} L${sx - 1.6} ${sy}Z`, SP * 0.55);
      if (ring > 0.02) {
        // 原作碰铃后铃顶上方两道弧线，随 ring 淡出
        k.globalAlpha = ring;
        pen(k, [7, 11].map(r => `M${bx - r * 0.7} ${by - r * 0.1 - 4} Q${bx} ${by - r - 4} ${bx + r * 0.7} ${by - r * 0.1 - 4}`).join(' '), SP * 0.5);
        k.globalAlpha = 1;
      }

      // 柳：树干纸色填充挡住后面的地面线；柳条是原作的钟摆，越往下摆得越开、末端略微上提，枝上交替小叶
      shape(k, ST.trunk, SP);
      pen(k, ST.boughs, SP * 0.8);
      pen(k, ST.bark, SP * 0.45);
      strands.forEach((s, i) => {
        const sa2 = x[iStrand[i]], e = env(u - units[iStrand[i]].delay);
        let d = '', lv = '';
        for (let j = 0; j <= 10; j++) {
          const q = j / 10, sway = sa2 * s.len * q * q * 0.9 + Math.sin(u * 1.6 + s.ph + q * 3) * 1.2 * q * e;
          const px = s.x + sway + q * 2, py = s.y + s.len * q - Math.abs(sa2) * s.len * q * q * 0.12;
          d += (j ? 'L' : 'M') + px + ' ' + py;
          if (j >= 2) lv += `M${px} ${py} l${j % 2 ? -2 : 2} 2.4`;
        }
        pen(k, d, SP * 0.5);
        pen(k, lv, SP * 0.45);
      });
      k.restore();
    };
  }

  // @element 08
  // 墨线町屋昼夜：取原作 examples/village 街景里酒屋右端到澡堂这一段（houses.ts 町屋、canal.ts 运河、sky.ts 天空），
  // 按 lib/daynight.ts 的配色从午后走到入夜再到天亮。原作一天 180 秒，靠点击和随机触发；这里把一天压进 6.4 秒，
  // 黄昏和夜里放慢、白天加快；窗灯按原作阈值的先后一扇扇亮，流星、炊烟都改成按时间发生
  {
    // 取景：原作画布 960×480，这里取 x 190–960、y 112 起的一段，缩到 0.7 倍放进 539×208
    const VX = 190, VY = 112, VW = 770, VS = CW / VW;
    // 原作场景笔宽 0.8；缩小后主线只剩 0.56 px，所以乘 1.8，让主线约 1 px，细节线按原作比例跟着变
    const SP = 0.8 * 1.8;
    // 屋脚线沿用原作 344；画面矮，运河岸从 384 收到 356、水面从 400 收到 370，水面才放得下倒影
    const BASE = 344, EDGE = 356, WATER = 370, BOT = VY + CH / VS + 4;
    const JP = '"Hiragino Mincho ProN","Yu Mincho","YuMincho","Noto Serif JP","Songti SC",serif';
    const W8 = TAU / CYC; // 一周期一圈的角速度；原作按秒的摆动频率都取整成它的整数倍，循环才接得上

    const RED = hx('#b3412d'), RED_NIGHT = hx('#6e2a22'), WARM = hx('#ffcf7e');
    const PAIL = hx('#e9c45a'), PAIL_NIGHT = hx('#6d6240');

    // —— 6.4 秒里的一天 ——
    // τ 按原作约定：0 午夜、0.25 黎明、0.5 正午、0.75 黄昏。从午后 0.62 走满一天回到 1.62，所以首尾自然相接；
    // 关键帧让黄昏（0.70–0.79）占约 1.7 秒、夜里占约 2 秒，白天几乎没有变化，就走得快
    const TK = [[0, 0.62], [0.9, 0.70], [2.6, 0.79], [4.3, 1.13], [5.1, 1.27], [5.8, 1.45], [6.4, 1.62]];
    const tauAt = dayClock(TK);
    // 开放时段 [o0, o1]（可跨午夜）里的显示量，两端各用 0.012 的 τ 渐变，代替原作逐帧累加的 show
    const within = (tm, o0, o1) => { const d = wrap(tm - o0, 1), L = wrap(o1 - o0, 1); return smooth(0, 0.012, d) * smooth(L, L - 0.012, d); };

    // 原作 kit.ts 的确定性随机（种子 11），静态街景每次建出来都一样
    let seed = 11;
    const srnd = (a, b) => { seed = (seed * 16807) % 2147483647; return a + ((seed - 1) / 2147483646) * (b - a); };
    const oval = (cx, cy, rx, ry) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
    const rect = (x0, y0, x1, y1) => `M${x0} ${y0} L${x1} ${y0} L${x1} ${y1} L${x0} ${y1}Z`;

    // —— 每帧现算的部分 ——
    // 原作烟囱顶在 y 66，取景从 y 112 开始会把烟裁掉，所以烟囱截短到 150，烟从画面里冒
    const CHIM_TOP = 150, CHIM_X = 901;
    // 原作的风是缓慢变化的噪声；这里取同样的均值 0.3，起伏按一周期 1 次和 2 次的正弦，循环才接得上
    const windAt = u => 0.3 + 0.1 * Math.sin(W8 * u) + 0.05 * Math.sin(2 * W8 * u + 1);
    // 夜里给平涂色压暗，原作 nightTint()
    const nightTint = (c, inkT, amt = 0.55) => mc(c, mc(c, [12, 16, 30], 0.6), inkT * amt);
    let F = null; // 当前帧的颜色和状态，画各物件时共用

    const strokeIt = (k, p, w) => { k.lineWidth = w; k.strokeStyle = F.ink; if (p) k.stroke(p); else k.stroke(); };
    function txt(k, x, y, s, size, vertical, wt, col) {
      k.fillStyle = col; k.font = `${wt} ${size}px ${JP}`; k.textAlign = 'center'; k.textBaseline = 'middle';
      if (!vertical) { k.fillText(s, x, y); return; }
      const ch = [...s];
      ch.forEach((c, i) => k.fillText(c, x, y + (i - (ch.length - 1) / 2) * size));
    }

    // 暖帘：原作 noren()。原作逐帧积分弹簧，这里直接取它的稳态：风把布推开 wind·2.2/22，
    // 加上 1.7 rad/s 的轻摆（远低于共振频率，振幅约 0.6/(22−1.7²)）
    function drawNoren(k, c, n) {
      const show = within(F.tau, n.open[0], n.open[1]);
      if (show < 0.005) return;
      k.save(); k.globalAlpha = show; k.translate(0, -(1 - ease(show)) * 6);
      const w = (n.x1 - n.x0) / n.panels;
      strokeIt(k, new Path2D(`M${n.x0 - 2} ${n.y} L${n.x1 + 2} ${n.y}`), SP * 1.2);
      let sw = 0;
      for (let i = 0; i < n.panels; i++) {
        const x = n.x0 + i * w, cw = w - 0.8;
        const a = F.wind * 0.1 + 0.031 * Math.sin(2 * W8 * F.u + n.ph[i]);
        const s = a * n.len * 0.45, flt = Math.sin(3 * W8 * F.u + i) * 0.5, y = n.y, L = n.len;
        const p = new Path2D(`M${x} ${y} L${x + cw} ${y} Q${x + cw + s * 0.4} ${y + L * 0.6} ${x + cw + s + flt} ${y + L} L${x + s + flt} ${y + L - 0.6} Q${x + s * 0.4} ${y + L * 0.6} ${x} ${y}Z`);
        k.fillStyle = F.paper; k.fill(p); k.lineJoin = 'round'; strokeIt(k, p, SP * 0.8);
        sw += s;
      }
      txt(k, (n.x0 + n.x1) / 2 + sw / n.panels * 0.6, n.y + n.len * 0.48, n.label, Math.min(n.len * 0.42, w * 0.95), false, 700, F.ink);
      k.restore();
    }
    // 灯笼：原作 chochin()。摆角取稳态 wind·0.5/10 加 0.9 rad/s 的轻摆；亮度按各自阈值 thr 跟着天黑程度亮
    function drawLantern(k, c, l) {
      const a = F.wind * 0.05 + 0.016 * Math.sin(W8 * F.u + l.ph);
      const lit = smooth(l.thr, l.thr + 0.2, F.P.lamp);
      l.a = a; l.lit = lit;
      const base = l.red ? mc(RED, RED_NIGHT, F.P.inkT * (1 - lit)) : F.P.paper;
      const { r, h } = l;
      k.save(); k.translate(l.x, l.y); k.rotate(-a);
      const body = new Path2D(`M${-r * 0.75} 4 Q${-r * 1.18} ${4 + h / 2} ${-r * 0.75} ${4 + h} L${r * 0.75} ${4 + h} Q${r * 1.18} ${4 + h / 2} ${r * 0.75} 4Z`);
      k.fillStyle = css(mc(base, l.red ? hx('#ff8a4a') : WARM, lit * 0.95)); k.fill(body); strokeIt(k, body, SP * 0.8);
      const ribs = [];
      for (let j = 1; j < 5; j++) { const yy = 4 + (h * j) / 5, wv = r * (1.18 - 0.3 * Math.abs(j / 5 - 0.5) * 2); ribs.push(`M${-wv * 0.95} ${yy} Q0 ${yy + 1} ${wv * 0.95} ${yy}`); }
      strokeIt(k, new Path2D(ribs.join(' ')), SP * 0.4);
      k.fillStyle = F.ink;
      k.fill(new Path2D(`M${-r * 0.6} 2 L${r * 0.6} 2 L${r * 0.6} 4.4 L${-r * 0.6} 4.4Z M${-r * 0.6} ${4 + h - 0.4} L${r * 0.6} ${4 + h - 0.4} L${r * 0.6} ${6.4 + h} L${-r * 0.6} ${6.4 + h}Z`));
      strokeIt(k, new Path2D('M0 -4 L0 2'), SP * 0.5);
      txt(k, 0, 4 + h / 2, l.label, h * 0.42, l.label.length > 1, 700, l.red ? '#fbf3e6' : F.ink);
      k.restore();
    }
    // 风铃：原作 H2 檐下的 fūrin。铃和舌都取稳态摆角；原作点一下才响，这里不点，所以不画响声弧线
    function drawFurin(k) {
      const x = 412, y = 207, u = F.u;
      const a = F.wind * 0.9 / 14 + 0.03 * Math.sin(W8 * u);
      const sa = a * 1.6 + F.wind * 2.2 / 9 + 0.1 * Math.sin(2 * W8 * u + 0.6);
      const bx = x + Math.sin(a) * 6, by = y + Math.cos(a) * 6;
      strokeIt(k, new Path2D(`M${x} ${y - 3} L${bx} ${by}`), SP * 0.45);
      const bell = new Path2D(`M${bx - 4} ${by + 5} Q${bx - 4.2} ${by - 0.6} ${bx} ${by - 0.6} Q${bx + 4.2} ${by - 0.6} ${bx + 4} ${by + 5}Z`);
      k.fillStyle = css(nightTint(hx('#e8f2f4'), F.P.inkT)); k.fill(bell); strokeIt(k, bell, SP * 0.7);
      const cx = bx + Math.sin(sa) * 4, cy = by + 5 + Math.cos(sa) * 4;
      strokeIt(k, new Path2D(`M${bx} ${by} L${cx} ${cy} M${cx - 0.8} ${cy} l1.6 0`), SP * 0.45);
      const sx = cx + Math.sin(sa) * 9, sy = cy + Math.cos(sa) * 9;
      const strip = new Path2D(`M${cx - 1.6} ${cy + 1} L${cx + 1.6} ${cy + 1} L${sx + 1.6} ${sy} L${sx - 1.6} ${sy}Z`);
      k.fillStyle = F.paper; k.fill(strip); strokeIt(k, strip, SP * 0.55);
    }

    // —— 静态街景：只在第一次调用时按原作 houses.ts 建一次 Path2D 清单 ——
    // 颜色每帧随昼夜变，所以清单只存路径和「颜色角色」，画的时候再按当前配色取色；不缓存位图，2× 画布也清楚
    // 角色：S 纸色填充+墨线（遮住后面）、P 墨线、B 实墨、C 平涂色+墨线、T 文字、W 会亮的窗格、D 每帧现算的物件
    let OPS = null, WINS = null, LANTERNS = null, NORENS = null, REFL = null, STARS = null, LINES = null, FLIES = null;
    function build() {
      // 原作先建天空：90 颗星各抽 x、y、r、ph、sp 共 450 次，再建街道；这里先空转 450 次，街景的窗灯阈值才和原作一致
      seed = 11;
      for (let i = 0; i < 450; i++) srnd(0, 1);
      const ops = [], wins = [], lanterns = [], norens = [];
      const S = (d, w = SP) => ops.push({ t: 'S', p: new Path2D(d), w });
      const P = (d, w = SP) => ops.push({ t: 'P', p: new Path2D(d), w });
      const B = d => ops.push({ t: 'B', p: new Path2D(d) });
      const C = (col, d, w = SP) => ops.push({ t: 'C', col, p: new Path2D(d), w });
      const T = (x, y, s, size, o = {}) => ops.push({ t: 'T', x, y, s, size, v: !!o.vertical, wt: o.weight || 600, col: o.col || 'ink' });
      const D = fn => ops.push({ t: 'D', fn });
      // 原作 pane() 的默认参数按 thr、lateOff、warmth 的顺序抽随机数，这里保持同样的顺序
      const pane = (x0, y0, x1, y1, o = {}) => {
        const thr = o.thr !== undefined ? o.thr : srnd(0.15, 0.6);
        const lateOff = o.lateOff !== undefined ? o.lateOff : (srnd(0, 1) < 0.45 ? srnd(0.93, 1.12) : 9);
        const warmth = o.warmth !== undefined ? o.warmth : srnd(0, 1);
        const w = { p: new Path2D(rect(x0, y0, x1, y1)), x0, y0, x1, y1, thr, lateOff, warmth };
        wins.push(w); ops.push({ t: 'W', w });
        return w;
      };

      function roof({ x0, x1, eave, ridge, inset, tile = 5.6, sori = 2.8, depth = 2.6, oni = true, rafters = true }) {
        const cx = (x0 + x1) / 2;
        const eaveY = x => eave - sori * Math.pow(Math.abs(x - cx) / ((x1 - x0) / 2), 2.2);
        S(`M${x0} ${eaveY(x0)} Q${cx} ${eave + sori * 0.6} ${x1} ${eaveY(x1)} L${x1 - inset} ${ridge} L${x0 + inset} ${ridge}Z`);
        const ch = [], ends = [];
        for (let x = x0 + tile * 0.8; x < x1 - tile * 0.4; x += tile) {
          const t = (x - x0) / (x1 - x0), ey = eaveY(x) - 0.4, top = mix(x0 + inset, x1 - inset, t);
          ch.push(`M${x} ${ey - 1.6} Q${mix(x, top, 0.5) + (t - 0.5) * 2} ${mix(ey, ridge, 0.55)} ${top} ${ridge + 1}`);
          ends.push(oval(x, ey, 1.35, 1.35));
        }
        P(ch.join(' '), SP * 0.5);
        S(ends.join(' '), SP * 0.55);
        P(`M${x0 + 1} ${eaveY(x0) + depth} Q${cx} ${eave + sori * 0.6 + depth} ${x1 - 1} ${eaveY(x1) + depth}`, SP * 0.7);
        if (rafters) {
          const r = [];
          for (let x = x0 + 5; x < x1 - 3; x += 4.2) r.push(`M${x} ${eaveY(x) + depth + 0.6} l0 1.8`);
          P(r.join(' '), SP * 0.6);
        }
        const rx0 = x0 + inset - 4, rx1 = x1 - inset + 4;
        S(rect(rx0, ridge - 5.5, rx1, ridge + 0.5), SP * 0.9);
        P(`M${rx0} ${ridge - 2.6} L${rx1} ${ridge - 2.6}`, SP * 0.5);
        if (oni) [rx0, rx1].forEach((x, i) => {
          const s = i ? 1 : -1;
          S(`M${x} ${ridge + 0.5} L${x} ${ridge - 6} Q${x + s * 0.5} ${ridge - 11} ${x + s * 4.5} ${ridge - 12} Q${x + s * 6.5} ${ridge - 9} ${x + s * 5} ${ridge - 6} L${x + s * 5} ${ridge + 0.5}Z`, SP * 0.85);
          P(`M${x + s * 1.6} ${ridge - 4} q${s * 1.4} -1 ${s * 1.8} 1`, SP * 0.5);
        });
      }
      function koshi(x0, x1, y0, y1, gap = 2.3) {
        const top = y0 + (y1 - y0) * 0.16;
        P(rect(x0, y0, x1, y1), SP * 0.9);
        const d = [`M${x0} ${top} L${x1} ${top}`, `M${x0} ${y1 - 3} L${x1} ${y1 - 3}`];
        let k = 0;
        for (let x = x0 + gap; x < x1 - 0.5; x += gap, k++) d.push(k % 4 === 3 ? `M${x} ${y0} L${x} ${y1}` : `M${x} ${top} L${x} ${y1 - 3}`);
        P(d.join(' '), SP * 0.55);
      }
      function mushiko(x0, y0, x1, y1) {
        S(`M${x0 + 3} ${y0} L${x1 - 3} ${y0} Q${x1} ${y0} ${x1} ${y0 + 3} L${x1} ${y1 - 3} Q${x1} ${y1} ${x1 - 3} ${y1} L${x0 + 3} ${y1} Q${x0} ${y1} ${x0} ${y1 - 3} L${x0} ${y0 + 3} Q${x0} ${y0} ${x0 + 3} ${y0}Z`);
        const d = [];
        for (let x = x0 + 4; x < x1 - 3; x += 5) d.push(`M${x} ${y0 + 2.5} Q${x - 0.6} ${(y0 + y1) / 2} ${x} ${y1 - 2.5} M${x + 2.4} ${y0 + 2.5} Q${x + 1.8} ${(y0 + y1) / 2} ${x + 2.4} ${y1 - 2.5}`);
        P(d.join(' '), SP * 0.55);
      }
      function inuyarai(x0, x1, y0) {
        const d = [`M${x0} ${y0 + 1} Q${(x0 + x1) / 2} ${y0 - 1} ${x1} ${y0 + 1}`, `M${x0 - 1} ${BASE - 1} L${x1 + 1} ${BASE - 1}`];
        for (let x = x0 + 1.5; x < x1; x += 2.6) d.push(`M${x} ${y0 + 1} Q${x + 0.4} ${(y0 + BASE) / 2 + 3} ${x - 0.6} ${BASE - 1}`);
        P(d.join(' '), SP * 0.5);
      }
      function shojiGrid(x0, y0, x1, y1, cols, rows) {
        const d = [rect(x0, y0, x1, y1)];
        for (let i = 1; i < cols; i++) { const x = mix(x0, x1, i / cols); d.push(`M${x} ${y0} L${x} ${y1}`); }
        for (let j = 1; j < rows; j++) { const y = mix(y0, y1, j / rows); d.push(`M${x0} ${y} L${x1} ${y}`); }
        P(d.join(' '), SP * 0.5);
      }
      // 暖帘与灯笼：形状照原作 noren() / chochin()，摆动和显隐每帧现算，所以登记成 D
      function noren(x0, x1, y, len, panels, label, open) {
        const n = { x0, x1, y, len, panels, label, open, ph: Array.from({ length: panels }, () => srnd(0, 6)) };
        norens.push(n); D((k, c) => drawNoren(k, c, n));
      }
      function chochin(x, y, r, h, label, red) {
        // 原作依次抽 a（初始摆角）、ph、thr；a 在纯函数里用不上，但照样抽掉，后面的随机数才和原作对得上
        const l = { x, y, r, h, label, red, a0: srnd(-0.05, 0.05), ph: srnd(0, 6), thr: srnd(0.1, 0.3) };
        lanterns.push(l); D((k, c) => drawLantern(k, c, l));
      }

      // ---------- 后景：樱树、小巷、烟囱、电线
      P('M452 344 Q450 300 446 268 Q440 236 420 214 M462 344 Q463 300 468 262 Q474 236 500 214 M447 262 Q458 248 456 226 Q455 206 462 192', SP * 1.1);
      P('M430 224 l-10 -6 M490 222 l12 -4 M456 212 l-8 -10 M468 236 q10 -4 14 -12', SP * 0.7);
      [[414, 206, 26], [502, 200, 28], [458, 176, 30], [434, 186, 22], [486, 180, 22], [460, 204, 26], [520, 216, 18], [400, 222, 18]].forEach(([cx, cy, r]) => {
        const pts = [];
        for (let i = 0; i <= 60; i++) { const a = (i / 60) * TAU; const rr = r + 2 * Math.abs(Math.sin(a * 6.5)) - 0.6 * Math.sin(a * 3); pts.push(`${cx + rr * Math.cos(a)} ${cy + rr * 0.78 * Math.sin(a)}`); }
        S('M' + pts.join('L') + 'Z', SP * 0.8);
      });
      const fl = [];
      for (let i = 0; i < 110; i++) {
        const a = srnd(0, TAU), dd = Math.sqrt(srnd(0, 1));
        const [cx, cy, r] = [[458, 196, 54], [414, 210, 26], [502, 204, 28]][i % 3];
        const x = cx + Math.cos(a) * r * dd * 0.95, y = cy + Math.sin(a) * r * 0.62 * dd, s = srnd(0.8, 1.3);
        fl.push(`M${x} ${y - s} l${s * 0.95} ${s * 0.7} l${-s * 0.4} ${s * 1.1} l${-s * 1.1} 0 l${-s * 0.4} ${-s * 1.1}Z`);
      }
      P(fl.join(' '), SP * 0.45);
      S(rect(432, 250, 482, BASE), SP * 0.6);
      S('M432 258 L449 286 L449 306 L432 344Z', SP * 0.6);
      S('M482 258 L465 286 L465 306 L482 344Z', SP * 0.6);
      P('M436 265 L436 337 M440 271 L440 330 M444 278 L444 322 M478 265 L478 337 M474 271 L474 330 M470 278 L470 322', SP * 0.4);
      S(rect(449, 288, 465, 306), SP * 0.7);
      S('M446 289 L468 289 L465 283 L449 283Z', SP * 0.7);
      P('M457 289 L457 306', SP * 0.5);
      [[457, 339, 7, 2.4], [456, 328, 5.6, 1.9], [458, 319, 4.4, 1.5], [457, 312, 3.4, 1.1]].forEach(([x, y, rx, ry]) => S(oval(x, y, rx, ry), SP * 0.5));
      pane(453.5, 293, 460.5, 301, { thr: 0.05, lateOff: 9 });
      P('M457 293 L457 301 M453.5 297 L460.5 297', SP * 0.4);
      // 澡堂烟囱：原作顶在 y 66，取景裁到 y 108 以下会看不见烟，所以烟囱截短到 CHIM_TOP，烟从画面里冒出来
      S(`M893 252 L895 ${CHIM_TOP + 6} L907 ${CHIM_TOP + 6} L909 252Z`);
      P('M894.3 160 L907.7 160 M893.9 190 L908.1 190 M893.4 220 L908.6 220', SP * 0.55);
      S(rect(892, CHIM_TOP, 910, CHIM_TOP + 6), SP * 0.9);
      T(901, 176, 'ゆ', 9, { weight: 800 });
      const wireY = x => { if (x >= 488) { const v = (x - 488) / (970 - 488); return 112 + (108 - 112) * v + 26 * 4 * v * (1 - v); } const v = (446 - x) / (446 + 10); return 112 + (104 - 112) * v + 22 * 4 * v * (1 - v); };
      const wd = [];
      for (const [a, b, off] of [[488, 970, 0], [446, -10, 0], [488, 970, 7], [446, -10, 7]]) {
        const pts = []; for (let i = 0; i <= 30; i++) { const x = mix(a, b, i / 30); pts.push(`${x} ${wireY(x) + off * (1 + 0.3 * Math.sin(i))}`); }
        wd.push('M' + pts.join('L'));
      }
      P(wd.join(' '), SP * 0.5);
      ops.push({ t: 'SMOKE' });

      // ---------- 房屋层：原作 houses.ts 的 H1 酒屋（只露出右端）、H2 带阳台的民家、H3 茶屋、H4 钱汤
      // H1 大部分在取景外，仍整段照建，是为了让 srnd 的调用顺序和原作一致，窗灯阈值也就和原作一致
      [[26, 206], [220, 206]].forEach(([x, y]) => { S(rect(x, y + 4, x + 8, 262), SP * 0.8); S(`M${x - 3} ${y + 5} L${x + 11} ${y + 5} L${x + 8} ${y} L${x} ${y}Z`, SP * 0.7); });
      S(rect(32, 214, 222, 262));
      roof({ x0: 12, x1: 242, eave: 218, ridge: 184, inset: 28 });
      mushiko(46, 230, 128, 252);
      S(rect(140, 228, 212, 250), SP * 1.1);
      P(rect(142.5, 230.5, 209.5, 247.5), SP * 0.5);
      T(176, 239.5, '白梅 酒', 11.5, { weight: 800 });
      S(rect(20, 270, 234, BASE));
      roof({ x0: 14, x1: 240, eave: 274, ridge: 262, inset: 6, tile: 5, sori: 1.4, oni: false });
      pane(28, 284, 88, 336);
      koshi(26, 90, 280, 340);
      S(rect(114, 280, 166, BASE), SP * 0.9);
      pane(117, 283, 163, BASE - 1, { thr: 0.05, lateOff: 0.9 });
      P('M117 314 L163 314 M140 283 L140 344', SP * 0.45);
      noren(116, 164, 281, 26, 3, '酒', [0.29, 0.86]);
      const barrel = (x, y, w, h) => {
        S(`M${x} ${y + 2} Q${x + w / 2} ${y - 1} ${x + w} ${y + 2} L${x + w} ${y + h - 2} Q${x + w / 2} ${y + h + 1} ${x} ${y + h - 2}Z`, SP * 0.9);
        P(`M${x} ${y + 6} Q${x + w / 2} ${y + 3.5} ${x + w} ${y + 6} M${x} ${y + h - 6} Q${x + w / 2} ${y + h - 3.5} ${x + w} ${y + h - 6} M${x + 3} ${y + 1} L${x + 3} ${y + h - 1} M${x + w - 3} ${y + 1} L${x + w - 3} ${y + h - 1}`, SP * 0.5);
        S(oval(x + w / 2, y + h / 2, w * 0.24, h * 0.24), SP * 0.6);
        T(x + w / 2, y + h / 2, '酒', w * 0.26, { weight: 800 });
      };
      barrel(172, 318, 28, 26); barrel(202, 318, 28, 26); barrel(187, 292, 28, 26);
      P('M102 274 L102 280', SP * 0.6);
      const sug = [];
      for (let i = 0; i < 360; i++) { const a = srnd(0, TAU), dd = Math.sqrt(srnd(0, 1)) * 11.2; const x = 102 + Math.cos(a) * dd, y = 292 + Math.sin(a) * dd, b = srnd(0, TAU); sug.push(`M${x} ${y} l${Math.cos(b) * 1.6} ${Math.sin(b) * 1.6}`); }
      S(oval(102, 292, 12, 12), SP * 0.8);
      P(sug.join(' '), SP * 0.45);
      P('M97 303 l10 0 M100 303 l-1 5 M105 303 l1 5', SP * 0.5);

      // H2：楼上的障子窗在原作里点一下会拉开、有人探身挥手；这里不加点击，障子一直关着，只随天色亮灯
      S(rect(246, 200, 424, 260));
      roof({ x0: 230, x1: 438, eave: 204, ridge: 168, inset: 26 });
      pane(262, 212, 318, 250, { thr: 0.12, lateOff: 1.08 });
      shojiGrid(290, 212, 318, 250, 3, 5);
      shojiGrid(262, 212, 290, 250, 3, 5);
      P(rect(262, 212, 318, 250));
      pane(340, 212, 404, 250, { thr: 0.3 });
      shojiGrid(340, 212, 372, 250, 3, 5); shojiGrid(372, 212, 404, 250, 3, 5);
      P(rect(340, 212, 404, 250));
      S(rect(250, 238, 418, 258), SP * 0.8);
      const bal = [];
      for (let x = 254; x < 416; x += 5.2) bal.push(`M${x} 241 L${x} 256`);
      P(bal.join(' ') + ' M250 241 L418 241', SP * 0.5);
      S(rect(240, 268, 428, BASE));
      roof({ x0: 232, x1: 436, eave: 272, ridge: 260, inset: 6, tile: 5, sori: 1.4, oni: false });
      pane(246, 282, 294, 322);
      koshi(244, 296, 278, 324);
      pane(366, 282, 422, 322, { thr: 0.25 });
      koshi(364, 424, 278, 324);
      inuyarai(244, 296, 326); inuyarai(364, 424, 326);
      S(rect(304, 278, 356, BASE), SP * 0.9);
      pane(306, 280, 354, BASE - 1, { thr: 0.2 });
      const dd2 = [];
      for (let x = 308; x < 354; x += 3.4) dd2.push(`M${x} 280 L${x} 343`);
      for (let y = 290; y < 342; y += 12) dd2.push(`M306 ${y} L354 ${y}`);
      P(dd2.join(' ') + ' M330 280 L330 344', SP * 0.45);
      S(rect(316, 270, 344, 276), SP * 0.6);
      T(330, 273, '伊 藤', 4.6, { weight: 700 });
      [[298, 'pine'], [360, 'asagao']].forEach(([x, kind]) => {
        S(`M${x - 5} 336 L${x + 5} 336 L${x + 4} ${BASE} L${x - 4} ${BASE}Z`, SP * 0.7);
        if (kind === 'pine') {
          P(`M${x} 336 Q${x - 3} 330 ${x + 1} 325 Q${x + 4} 321 ${x - 1} 316 M${x + 1} 325 Q${x + 5} 324 ${x + 7} 321`, SP * 0.8);
          [[x - 4, 324, 5.2], [x + 6, 319.5, 4], [x - 1, 314, 4.4]].forEach(([px, py, r]) => {
            S(`M${px - r} ${py} Q${px - r * 0.8} ${py - 2.6} ${px - r * 0.3} ${py - 2.2} Q${px} ${py - 3.4} ${px + r * 0.4} ${py - 2.4} Q${px + r} ${py - 2.2} ${px + r} ${py} Q${px} ${py + 1} ${px - r} ${py}Z`, SP * 0.6);
            P(Array.from({ length: 4 }, (_, j) => `M${px - r * 0.6 + j * r * 0.4} ${py - 0.5} l0.6 -1.4`).join(' '), SP * 0.35);
          });
        } else {
          P(`M${x - 2} 336 L${x - 2} 300 M${x + 2} 336 L${x + 2} 300 M${x - 3} 312 L${x + 3} 312 M${x - 3} 324 L${x + 3} 324`, SP * 0.5);
          P(`M${x} 334 q-4 -8 1 -14 q4 -6 -1 -12 q-3 -4 1 -8`, SP * 0.5);
          [[x - 3, 316], [x + 3, 306], [x - 2, 326]].forEach(([fx, fy]) => S(oval(fx, fy, 2.2, 1.8), SP * 0.5));
        }
      });
      D((k, c) => drawFurin(k, c));

      // H3 茶屋
      S(rect(496, 224, 690, 256));
      roof({ x0: 476, x1: 710, eave: 228, ridge: 196, inset: 24 });
      mushiko(520, 232, 668, 250);
      S(rect(486, 264, 700, BASE));
      roof({ x0: 478, x1: 708, eave: 268, ridge: 256, inset: 5, tile: 5, sori: 1.6, oni: false });
      pane(492, 272, 614, 330, { thr: 0.02, lateOff: 0.94 });
      P('M496 308 L610 308', SP * 0.55);
      ['だんご', '甘酒', '抹茶', 'おしるこ', '草餅'].forEach((s, i) => { const x = 506 + i * 22; P(`M${x} 283 L${x} 285.5`, SP * 0.4); S(rect(x - 5, 285.5, x + 5, 307), SP * 0.6); T(x, 296.2, s, 4.6, { vertical: true, weight: 700 }); });
      S(rect(490, 318, 616, 324), SP * 0.9);
      P('M494 324 L494 344 M612 324 L612 344', SP * 0.7);
      [528, 574].forEach(x => { S(`M${x - 9} 318 Q${x} 321 ${x + 9} 318 Z`, SP * 0.6); P(`M${x - 7} 315 L${x + 8} 307`, SP * 0.6); [0, 1, 2].forEach(j => S(oval(x - 4 + j * 4.4, 313.5 - j * 2.4, 2.3, 2.3), SP * 0.6)); });
      S(rect(490, 270, 616, 282), SP * 0.7);
      P(Array.from({ length: 5 }, (_, i) => `M490 ${272 + i * 2} L616 ${272 + i * 2}`).join(' ') + ' M520 268 L520 284 M586 268 L586 284', SP * 0.35);
      S('M488 268.5 a2.5 2.5 0 0 0 0 5 L618 273.5 a2.5 2.5 0 0 0 0 -5Z', SP * 0.7);
      S(rect(620, 270, 694, BASE), SP * 0.9);
      pane(622, 272, 692, BASE - 1, { thr: 0.02, lateOff: 0.95 });
      noren(624, 690, 271, 24, 4, '茶', [0.31, 0.9]);
      chochin(498, 268, 6.4, 15, '茶', true);
      chochin(696, 268, 6.4, 15, '茶', true);

      // H4 钱汤
      S(rect(708, 252, 944, BASE));
      roof({ x0: 700, x1: 952, eave: 256, ridge: 214, inset: 44 });
      S('M766 262 Q780 262 790 250 Q806 226 826 222 Q846 226 862 250 Q872 262 886 262 L882 268 Q870 268 860 258 Q846 236 826 232 Q806 236 792 258 Q782 268 770 268Z');
      P('M790 252 Q806 230 826 226 Q846 230 862 252', SP * 0.5);
      S('M821 222 Q826 214 831 222Z', SP * 0.7);
      P('M800 262 L800 344 M852 262 L852 344');
      pane(803, 266, 849, BASE - 1, { thr: 0.0, lateOff: 9 });
      noren(804, 848, 266, 30, 2, 'ゆ', [0.6, 1.08]);
      pane(716, 266, 774, 292, { thr: 0.05, lateOff: 9 });
      pane(878, 266, 936, 292, { thr: 0.05, lateOff: 9 });
      [[716, 774], [878, 936]].forEach(([a, b]) => shojiGrid(a, 266, b, 292, 6, 2));
      S(rect(714, 300, 734, 344), SP * 0.9);
      T(724, 322, '松の湯', 9, { vertical: true, weight: 800 });
      const ws = [];
      for (let x = 740; x < 800; x += 4) ws.push(`M${x} 304 L${x} 344`);
      for (let x = 856; x < 940; x += 4) ws.push(`M${x} 304 L${x} 344`);
      P(ws.join(' ') + ' M738 304 L800 304 M852 304 L940 304', SP * 0.5);
      [[902, 335], [915, 335], [928, 335], [908.5, 326], [921.5, 326], [915, 317]].forEach(([x, y]) => {
        C('pail', `M${x - 6} ${y} L${x + 6} ${y} L${x + 5} ${y + 9} L${x - 5} ${y + 9}Z`, SP * 0.7);
        P(`M${x - 5.6} ${y + 2.4} L${x + 5.6} ${y + 2.4}`, SP * 0.4);
      });
      chochin(790, 262, 5.6, 13, 'ゆ', false);
      chochin(862, 262, 5.6, 13, 'ゆ', false);

      // 窗灯、灯笼、路灯的光晕画在房子上面、前景下面，和原作的 glow 图层位置一样
      ops.push({ t: 'GLOW' });

      // ---------- 前景：茶屋门前的红伞和长凳、电线杆和路灯、街面
      S('M586 351 L586 296 M589 351 L589 296', SP * 0.6);
      P('M587.5 352 L587.5 262', SP * 0.9);
      let rimD = 'M536 273 Q548 256 587.5 252 Q627 256 639 273';
      for (let i = 12; i > 0; i--) { const xa = mix(536, 639, i / 12), xb = mix(536, 639, (i - 1) / 12); rimD += ` Q${(xa + xb) / 2} 276.4 ${xb} 273`; }
      C('red', rimD + 'Z', SP * 0.8);
      P(Array.from({ length: 13 }, (_, i) => `M587.5 252.6 L${mix(538, 637, i / 12)} 272.4`).join(' '), SP * 0.35);
      S(oval(587.5, 252, 3.2, 1.6), SP * 0.6);
      C('red', rect(516, 330, 600, 336), SP * 0.8);
      S(rect(514, 336, 602, 339), SP * 0.7);
      P('M520 339 L520 352 M596 339 L596 352 M522 339 L522 352 M594 339 L594 352 M520 348 L596 348', SP * 0.7);
      S('M584 330 L585 325 L591 325 L592 330Z', SP * 0.6);
      S('M465 352 L466.5 98 L470.5 98 L472 352Z', SP * 0.9);
      P('M466 140 L471 140 M466 200 L471 200 M466 260 L471 260 M466 320 L471 320', SP * 0.5);
      S(rect(446, 110, 490, 114), SP * 0.8);
      [450, 458, 478, 486].forEach(x => S(`M${x - 1.6} 110 L${x + 1.6} 110 L${x + 1.2} 105 L${x - 1.2} 105Z`, SP * 0.5));
      S('M472 140 Q480 140 480 146 L480 170 Q480 176 472 176Z', SP * 0.8);
      P('M472 150 L479 150 M472 160 L479 160', SP * 0.45);
      P('M466 226 Q452 222 446 230', SP * 0.8);
      S('M439 230 L453 230 L450 236 L442 236Z', SP * 0.8);
      C('lamp', oval(446, 237, 3, 1.6), SP * 0.5);
      // 街面：原作屋脚到河岸 40 单位，这里只有 12，裂缝和沟石按比例压进这一条
      P(`M0 ${BASE} L960 ${BASE}`);
      const cracks = [];
      for (let i = 0; i < 34; i++) { const x = srnd(0, 960), y = mix(BASE + 6, EDGE - 2, (srnd(350, 380) - 350) / 30); cracks.push(`M${x} ${y} l${srnd(6, 16)} ${srnd(-0.4, 0.4)}`); }
      P(cracks.join(' '), SP * 0.45);
      const gut = [];
      for (let x = 0; x < 960; x += srnd(16, 26)) gut.push(`M${x} ${BASE} L${x} ${BASE + 4}`);
      P(`M0 ${BASE + 4} L960 ${BASE + 4} ` + gut.join(' '), SP * 0.5);

      // ---------- 运河：岸石两层砌缝，水面颜色、倒影和波纹每帧现算
      S(`M-10 ${EDGE} L970 ${EDGE} L970 ${WATER} L-10 ${WATER}Z`);
      const md = [`M-10 ${EDGE + 4} L970 ${EDGE + 4}`, `M-10 ${EDGE + 9} Q480 ${EDGE + 8.6} 970 ${EDGE + 9.1}`];
      for (let x = srnd(0, 20); x < 960; x += srnd(28, 44)) md.push(`M${x} ${EDGE} l0.4 4`);
      [[EDGE + 4, EDGE + 9, 0], [EDGE + 9, WATER, 8]].forEach(([y0, y1, o]) => {
        for (let x = srnd(0, 14) + o; x < 960; x += srnd(12, 24)) md.push(`M${x} ${y0 + 0.4} Q${x + srnd(-1, 1)} ${(y0 + y1) / 2} ${x + srnd(-0.6, 0.6)} ${y1 - 0.4}`);
      });
      P(md.join(' '), SP * 0.5);
      ops.push({ t: 'WATER' });

      OPS = ops; WINS = wins; LANTERNS = lanterns; NORENS = norens;
      // 倒影只给取景内、离水面近的光源：一楼的窗和门、灯笼
      REFL = wins.filter(w => w.y1 > 300 && w.x1 > VX).map(w => ({ src: w, x: (w.x0 + w.x1) / 2, w: Math.min(40, (w.x1 - w.x0) * 0.8) }))
        .concat(lanterns.map(l => ({ src: l, x: l.x, w: 8 })));
      // 星星落在屋顶以上那条天空里；用 rnd(i, j) 定位置和闪烁，不和街景的 srnd 序列搅在一起
      STARS = Array.from({ length: 46 }, (_, i) => ({ x: VX + rnd(i, 1) * VW, y: VY + 2 + rnd(i, 2) * 96, r: 0.35 + rnd(i, 3) * 0.7, n: 1 + Math.floor(rnd(i, 4) * 3), ph: rnd(i, 5) * TAU }));
      LINES = Array.from({ length: 16 }, (_, i) => ({ x: VX + rnd(i, 11) * VW, y: WATER + 6 + (i % 4) * 8 + rnd(i, 12) * 3, len: 10 + rnd(i, 13) * 24, d: 18 + rnd(i, 14) * 22, ph: rnd(i, 15) }));
      FLIES = Array.from({ length: 12 }, (_, i) => ({ cx: VX + 20 + rnd(i, 21) * (VW - 40), cy: 300 + rnd(i, 22) * 100, ph: rnd(i, 23) * TAU, n: 2 + Math.floor(rnd(i, 24) * 4) }));
    }

    // —— 天空：原作 sky.ts。日月轨迹的顶点在原作 y 64，取景从 y 112 开始，
    // 所以轨迹的纵向压到 0.55 倍再下移，太阳从画面上沿附近往右下落到澡堂屋顶后面，月亮在夜里升到天空中段 ——
    const arcY = y => VY + 8 + (y - 64) * 0.55;
    const sunArc = s => [40 + 880 * s, arcY(300 - 236 * Math.sin(Math.PI * s))];
    const moonArc = s => [60 + 840 * s, arcY(290 - 205 * Math.sin(Math.PI * s))];
    const SUN_SPAN = [0.225, 0.55], MOON_SPAN = [0.775, 0.45];
    // 流星：原作夜里随机出现、点天空也会出；这里固定在夜最深时（u 3.3 起 0.9 秒）划过一颗
    const SHOOT = { u0: 3.3, dur: 0.9, x: 700, y: 128, dir: -1 };
    const MIST = [[330, 140, 100, 0.3], [760, 120, 130, 2.1]];
    const radial = (k, x, y, r, stops, alpha) => {
      if (alpha < 0.004) return;
      const g = k.createRadialGradient(x, y, 0, x, y, r);
      stops.forEach(([o, c, a]) => g.addColorStop(o, `rgba(${c},${a})`));
      k.globalAlpha = alpha; k.fillStyle = g; k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill(); k.globalAlpha = 1;
    };
    const WARMGLOW = [[0, '255,213,138', 0.75], [0.45, '255,184,92', 0.28], [1, '255,184,92', 0]];
    function cloudD(x, y, w) {
      const curl = (cx, cy, s) => `M${cx} ${cy} q${5 * s} 0 ${5 * s} -4 q0 -3.2 ${-3.2 * s} -3.2 q-2.2 0 -2.2 2.2 q0 1.4 1.4 1.4`;
      return `M${x} ${y} L${x + w} ${y} ${curl(x + w, y, 1)} ${curl(x, y, -1)} M${x + w * 0.18} ${y - 7} L${x + w * 0.66} ${y - 7} ${curl(x + w * 0.66, y - 7, 1)} M${x + w * 0.42} ${y + 6.5} L${x + w * 0.92} ${y + 6.5} ${curl(x + w * 0.42, y + 6.5, -1)}`;
    }
    let FAR = null;
    function drawSky(k) {
      const { P, u, tau } = F;
      const g = k.createLinearGradient(0, -20, 0, 500);
      g.addColorStop(0, css(P.top)); g.addColorStop(1, css(P.bot));
      k.fillStyle = g; k.fillRect(VX - 10, VY - 10, VW + 20, BOT - VY + 20);
      // 星星：亮度按原作 night，闪烁频率取一周期的整数倍
      if (P.night > 0.01) {
        k.fillStyle = '#f5efda';
        STARS.forEach(s => {
          const tw = 0.55 + 0.45 * Math.sin(s.n * W8 * u + s.ph);
          k.globalAlpha = P.night * tw; k.beginPath(); k.arc(s.x, s.y, s.r, 0, TAU); k.fill();
          if (s.r > 0.9) { k.globalAlpha = P.night * tw * 0.7 * 0.6; k.lineWidth = 0.35; k.strokeStyle = '#f5efda'; k.stroke(new Path2D(`M${s.x - 2.6} ${s.y} L${s.x + 2.6} ${s.y} M${s.x} ${s.y - 2.6} L${s.x} ${s.y + 2.6}`)); }
        });
        const su = (u - SHOOT.u0) / SHOOT.dur;
        if (su > 0 && su < 1) {
          const x = SHOOT.x + SHOOT.dir * 120 * su, y = SHOOT.y + 60 * su;
          k.globalAlpha = P.night * Math.sin(Math.PI * su); k.strokeStyle = '#fff6dc'; k.lineWidth = 0.9 * 1.6; k.lineCap = 'round';
          k.stroke(new Path2D(`M${x} ${y} L${x - SHOOT.dir * 34 * (1 - su)} ${y - 17 * (1 - su)}`));
        }
        k.globalAlpha = 1;
      }
      // 太阳：越近日落越红、光晕越大
      const su = (wrap(tau, 1) - SUN_SPAN[0]) / SUN_SPAN[1];
      if (su > -0.05 && su < 1.05) {
        const [x, y0] = sunArc(clamp(su)), y = y0 + (su < 0 || su > 1 ? 30 : 0);
        radial(k, x, y, 70, [[0, '255,217,160', 0.55], [1, '255,217,160', 0]], 0.35 + 0.65 * P.sunset);
        const d = new Path2D(oval(x, y, 21, 21));
        k.fillStyle = css(mc(hx('#fbf3df'), hx('#df5a3a'), P.sunset)); k.fill(d); strokeIt(k, d, SP);
      }
      // 月亮：两段弧画的蛾眉月，原作 rotate(-24°)
      const mu = wrap(tau - MOON_SPAN[0], 1) / MOON_SPAN[1];
      if (mu <= 1.02) {
        const [x, y] = moonArc(clamp(mu)), a = smooth(0, 0.08, mu) * smooth(1.02, 0.94, mu), r = 15;
        radial(k, x, y, 60, [[0, '233,228,255', 0.35], [1, '233,228,255', 0]], a);
        k.save(); k.translate(x, y); k.rotate(-24 * Math.PI / 180); k.globalAlpha = a;
        const m = new Path2D(`M0 ${-r} A${r} ${r} 0 1 1 0 ${r} A${r * 0.62} ${r} 0 1 0 0 ${-r}Z`);
        k.fillStyle = '#f3ecd6'; k.fill(m); k.lineWidth = 0.6; k.strokeStyle = '#f3ecd6'; k.stroke(m);
        k.globalAlpha = a * 0.7; k.lineWidth = 0.5; k.strokeStyle = '#cfc6ad'; k.stroke(new Path2D('M3 -6 a2.4 1.8 0 1 0 0.1 0 M8 4 a1.6 1.3 0 1 0 0.1 0'));
        k.restore();
      }
      // 霞：原作 suyari-gasumi 横云，白天最浓；这里不漂走，只在原地缓缓左右移
      k.globalAlpha = 0.75 - 0.45 * P.night;
      MIST.forEach(([x, y, w, ph]) => strokeIt(k, new Path2D(cloudD(x + 6 * Math.sin(W8 * u + ph), y, w)), SP * 0.75));
      // 远山与五重塔：原作用 0.42 的淡墨
      if (!FAR) {
        const d = [];
        let y = 236;
        for (let i = 0; i < 5; i++) {
          const w = 36 - i * 4.2, bh = 9 - i * 0.6, cx = 640;
          d.push({ s: rect(cx - w * 0.42, y - bh, cx + w * 0.42, y), w: 0.75 });
          d.push({ p: `M${cx - w * 0.18} ${y} L${cx - w * 0.18} ${y - bh} M${cx + w * 0.18} ${y} L${cx + w * 0.18} ${y - bh}`, w: 0.5 });
          y -= bh;
          d.push({ s: `M${cx - w} ${y + 1} Q${cx - w * 0.6} ${y - 1} ${cx - w * 0.35} ${y - 5} L${cx + w * 0.35} ${y - 5} Q${cx + w * 0.6} ${y - 1} ${cx + w} ${y + 1} Q${cx} ${y - 2} ${cx - w} ${y + 1}Z`, w: 0.75 });
          y -= 5;
        }
        d.push({ p: `M640 ${y} L640 ${y - 26}`, w: 0.8 });
        d.push({ p: Array.from({ length: 6 }, (_, j) => `M637.4 ${y - 4 - j * 3} L642.6 ${y - 4 - j * 3}`).join(' '), w: 0.5 });
        FAR = [{ p: 'M0 262 Q80 238 170 222 Q240 206 300 214 Q360 222 420 208 Q470 196 520 188 Q600 176 660 198 Q720 218 790 206 Q860 192 960 214', w: 0.8 },
          { p: 'M140 228 q20 -6 40 -4 M300 216 q16 -2 30 2 M560 186 q26 -4 44 4 M820 202 q18 -4 32 0', w: 0.55 }].concat(d)
          .map(o => ({ path: new Path2D(o.s || o.p), fill: !!o.s, w: o.w * SP }));
      }
      k.globalAlpha = 0.42;
      FAR.forEach(o => { if (o.fill) { k.fillStyle = F.paper; k.fill(o.path); } strokeIt(k, o.path, o.w); });
      k.globalAlpha = 1;
    }

    // 窗灯：原作 main.ts 的规则。天黑到各自阈值 thr 就亮；lateOff 小于 9 的窗到深夜按各自时刻熄灯，天亮前不再亮
    function winLit(w) {
      const lit = smooth(w.thr, w.thr + 0.25, F.P.lamp);
      if (w.lateOff >= 9) return lit;
      const sd = wrap(F.tau - 0.75, 1);
      // 原作是硬切再按每帧 0.08 追上去（约 0.2 秒）；这里换成 τ 上 0.008 的渐变，效果相同且是纯函数
      return lit * (1 - smooth(w.lateOff - 0.75, w.lateOff - 0.742, sd) * smooth(0.5, 0.49, sd));
    }
    function drawGlow(k) {
      const { u } = F;
      WINS.forEach(w => {
        if (w.lit < 0.01) return;
        const cx = (w.x0 + w.x1) / 2, cy = (w.y0 + w.y1) / 2, rx = (w.x1 - w.x0) * 0.9 + 10, ry = (w.y1 - w.y0) * 0.9 + 10;
        k.save(); k.translate(cx, cy); k.scale(rx, ry); radial(k, 0, 0, 1, WARMGLOW, w.lit * 0.8); k.restore();
      });
      LANTERNS.forEach(l => {
        const cx = l.x + Math.sin(l.a) * -(l.h / 2 + 4), cy = l.y + Math.cos(l.a) * (l.h / 2 + 4);
        radial(k, cx, cy, 30 + l.r, WARMGLOW, l.lit * (0.85 + 0.15 * Math.sin(7 * W8 * u + l.ph) * Math.sin(3 * W8 * u)));
      });
      // 路灯：灯罩下的光锥和光晕，比窗灯晚一点亮
      const on = F.lampOn;
      if (on > 0.004) {
        const g = k.createLinearGradient(0, 237, 0, 352);
        g.addColorStop(0, 'rgba(255,226,168,0.5)'); g.addColorStop(1, 'rgba(255,226,168,0.06)');
        k.globalAlpha = on * 0.75; k.fillStyle = g; k.fill(new Path2D('M441 237 L451 237 L496 352 L396 352Z')); k.globalAlpha = 1;
        radial(k, 446, 237, 34, WARMGLOW, on);
        // 绕灯飞的飞蛾，频率取整数倍
        k.fillStyle = '#fff4d2';
        for (let i = 0; i < 4; i++) {
          const a = (3 + i) * W8 * u + i * 1.7, r = 5 + i * 2.2;
          k.globalAlpha = on * (0.6 + 0.4 * Math.sin(5 * a));
          k.beginPath(); k.arc(446 + Math.cos(a) * r + Math.sin(2 * a) * 3, 240 + Math.sin(a) * r * 0.6, 0.7 * 1.5, 0, TAU); k.fill();
        }
        k.globalAlpha = 1;
      }
      // 萤火虫：只在夜里，沿慢速正弦漂移、一明一暗
      if (F.P.night > 0.01) FLIES.forEach(fl => {
        const a = W8 * u + fl.ph;
        const x = fl.cx + Math.sin(a) * 30 + Math.sin(2 * a) * 8, y = fl.cy + Math.sin(a + 1) * 16 + Math.cos(3 * a) * 5;
        const b = Math.pow(Math.max(0, Math.sin(fl.n * W8 * u + fl.ph)), 3);
        radial(k, x, y, 5.5, [[0, '233,255,154', 0.9], [1, '200,255,106', 0]], F.P.night * b);
        k.globalAlpha = F.P.night * (0.3 + 0.7 * b); k.fillStyle = '#f1ffb4'; k.beginPath(); k.arc(x, y, 0.9 * 1.4, 0, TAU); k.fill(); k.globalAlpha = 1;
      });
    }

    // 炊烟：原作澡堂午后开始烧水（τ > 0.55 或 < 0.08），每 0.55 秒冒一团，6.3 秒散尽。
    // 这里把间隔取成 CYC/12，烟团按发出时刻 e 和年龄 wrap(u − e) 现算位置，原作逐帧积分的速度改成积分后的式子
    const PUFFS = 12, PUFF_LIFE = 6.3;
    function drawSmoke(k) {
      const { u } = F;
      for (let j = 0; j < PUFFS; j++) {
        const e = j * CYC / PUFFS, tm = wrap(tauAt(e), 1);
        if (!(tm > 0.55 || tm < 0.08)) continue;
        const t = wrap(u - e);
        if (t > PUFF_LIFE) continue;
        const ph = rnd(j, 31) * TAU, wnd = windAt(e);
        const x = CHIM_X + (rnd(j, 32) * 4 - 2) + (4 + wnd * 10) * t - (2 / 1.2) * (Math.cos(1.2 * t + ph) - Math.cos(ph));
        const y = CHIM_TOP - (9 * t - 0.3 * t * t), r = 3 + rnd(j, 33) * 1.5 + 2.2 * t;
        const pts = [];
        for (let i = 0; i <= 14; i++) { const a = (i / 14) * TAU, rr = r * (1 + 0.16 * Math.sin(a * 3 + ph + t)); pts.push(`${x + Math.cos(a) * rr} ${y + Math.sin(a) * rr * 0.8}`); }
        const p = new Path2D('M' + pts.join('L') + 'Z');
        // 刚冒出的一小段淡入，免得烟团在烟囱口凭空出现
        k.globalAlpha = Math.max(0, 0.9 - t / 7) * smooth(0, 0.25, t);
        k.fillStyle = F.paper; k.fill(p); strokeIt(k, p, SP * 0.7);
      }
      k.globalAlpha = 1;
    }

    // 水波纹圈：原作随机冒出、锦鲤落水也会激起；这里固定 3 处
    const RINGS = [[0.8, 330, 384], [2.9, 610, 392], [5.0, 820, 380]];
    function drawWater(k) {
      const { P, u } = F;
      // 原作在 inkT 过 0.5 时把水色从灰蓝硬切到深靛；这里在 0.4–0.6 之间渐变，避免一帧跳色
      const nt = smooth(0.4, 0.6, P.inkT);
      const wc = mc(mc(P.paper, hx('#bfd0d8'), 0.32), mc(P.paper, hx('#0f1730'), 0.45), nt);
      k.fillStyle = css(wc); k.fillRect(VX - 10, WATER, VW + 20, BOT - WATER + 10);
      strokeIt(k, new Path2D(`M${VX - 10} ${WATER} L${VX + VW + 10} ${WATER}`), SP * 0.8);
      // 倒影：每个亮着的光源下面一串横向暖色短线，左右抖动、长短起伏
      k.lineCap = 'round';
      REFL.forEach(r => {
        const lit = r.src.lit || 0;
        if (lit < 0.02) return;
        for (let j = 0; j < 6; j++) {
          const y = WATER + 5 + j * 6, jit = Math.sin(2 * W8 * u + j * 1.7 + r.x * 0.1) * (2 + j * 0.5);
          const w = r.w * (1 - j * 0.07) * (0.7 + 0.3 * Math.sin(2 * W8 * u + j));
          k.globalAlpha = lit * (0.75 - j * 0.07); k.strokeStyle = '#ffcf7e'; k.lineWidth = (1.4 - j * 0.08) * 1.4;
          k.beginPath(); k.moveTo(r.x - w / 2 + jit, y); k.lineTo(r.x + w / 2 + jit, y); k.stroke();
        }
      });
      k.globalAlpha = 1;
      LINES.forEach(l => {
        const x = l.x + l.d * Math.sin(W8 * u + l.ph * TAU), y = l.y + Math.sin(W8 * u + l.x * 0.04) * 0.7;
        strokeIt(k, new Path2D(`M${x} ${y} Q${x + l.len / 2} ${y - 1.2} ${x + l.len} ${y}`), SP * 0.5);
      });
      RINGS.forEach(([u0, x, y]) => {
        const t = wrap(u - u0);
        if (t > 1.6) return;
        k.globalAlpha = 1 - t / 1.6;
        k.beginPath(); k.ellipse(x, y, 2 + t * 12, 0.6 + t * 2.2, 0, 0, TAU); strokeIt(k, null, SP * 0.55);
        k.globalAlpha = 1;
      });
    }

    CELLS[7] = (k, w, h, u) => {
      if (!OPS) build();
      const tau = tauAt(u), P = palette(wrap(tau, 1));
      F = { u, tau: wrap(tau, 1), P, wind: windAt(u), paper: css(P.paper), ink: css(P.ink), lampOn: smooth(0.2, 0.45, P.lamp) };
      WINS.forEach(wn => { wn.lit = winLit(wn); });
      const red = css(mc(RED, RED_NIGHT, P.inkT)), pail = css(mc(PAIL, PAIL_NIGHT, P.inkT)), lamp = css(mc(P.paper, hx('#fff1c9'), F.lampOn));
      const winCol = wn => css(mc(P.paper, mc(hx('#ffd58a'), hx('#f0a24e'), wn.warmth), wn.lit * 0.92));
      k.save();
      k.scale(VS, VS); k.translate(-VX, -VY);
      k.lineCap = 'round'; k.lineJoin = 'round';
      drawSky(k);
      for (const o of OPS) {
        switch (o.t) {
          case 'S': k.fillStyle = F.paper; k.fill(o.p); strokeIt(k, o.p, o.w); break;
          case 'P': strokeIt(k, o.p, o.w); break;
          case 'B': k.fillStyle = F.ink; k.fill(o.p); break;
          case 'C': k.fillStyle = o.col === 'red' ? red : o.col === 'pail' ? pail : lamp; k.fill(o.p); strokeIt(k, o.p, o.w); break;
          case 'W': k.fillStyle = winCol(o.w); k.fill(o.w.p); break;
          case 'T': txt(k, o.x, o.y, o.s, o.size, o.v, o.wt, F.ink); break;
          case 'D': o.fn(k); break;
          case 'SMOKE': drawSmoke(k); break;
          case 'GLOW': drawGlow(k); break;
          case 'WATER': drawWater(k); break;
        }
      }
      k.restore();
    };
  }

  // @element 09
  // 书桌一角：原作没有室内场景，这里按原作的画法（细墨线、纸色遮挡、一两处平涂色、daynight.ts 夜间反相）新编一张书桌。
  // 窗外从午后暗到夜里再亮回来；两阵风从窗口吹进来，窗帘、挂历、窗台上的绿植跟着摆，书页被翻过去；
  // 天黑后台灯亮起，光照到的地方纸和墨回到白天的颜色，其余部分保持夜里的反相
  {
    // 主线约 1 px，与 #4-100 一致；细节线（字行、页边、弹簧）按原作 0.4–0.6 倍
    const SP = 1.1, FP = 0.6;
    const JP = '"Hiragino Mincho ProN","Yu Mincho","YuMincho","Noto Serif JP","Songti SC",serif';
    const W = TAU / CYC; // 一周期一圈的角速度，周期性小动作都取它的整数倍
    const bump = (x, a, b, c, d) => smooth(a, b, x) * smooth(d, c, x);
    const poly = (pts, close) => 'M' + pts.map(pt).join('L') + (close ? 'Z' : '');
    const oval = (cx, cy, rx, ry) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;

    // 桌面用斜投影露出一条桌面：深度 z 往里每 1 单位，画面右移 0.25、上移 0.6；y 是离桌面的高度（负为向上）
    const FRONT = 156, DEPTH = 24;
    const P3 = (x, y, z) => [x + 0.25 * z, FRONT + y - 0.6 * z];

    // 一天的节奏与 #4-100 相同：午后 τ 0.62 开始，黄昏 0.70–0.79 约 1.7 秒，夜里约 2 秒，6.4 秒回到午后
    const tauAt = dayClock([[0, 0.62], [0.9, 0.70], [2.6, 0.79], [4.3, 1.13], [5.1, 1.27], [5.8, 1.45], [6.4, 1.62]]);
    // 台灯在天快黑时打开（开灯时闪一下），天亮后关掉；时刻按上面 τ 的关键帧挑
    const lampOn = u => smooth(2.3, 2.34, u) * (1 - 0.85 * bump(u, 2.37, 2.39, 2.43, 2.45)) * smooth(5.66, 5.56, u);

    // 风从右边的窗口往屋里（往左）吹：1.3 秒一阵弱风，3.7 秒一阵强风，阵风里带一点抖动；周期首尾都只剩微风
    const windAt = u => 0.06
      + 0.55 * bump(u, 0.8, 1.3, 1.9, 2.6) * (1 + 0.18 * Math.sin(11 * W * u))
      + 1.0 * bump(u, 3.25, 3.7, 4.5, 5.2) * (1 + 0.15 * Math.sin(13 * W * u + 1));
    // 窗帘下摆是布，用原作 walker 围巾尾的弹簧 (30, 4)；挂历用原作灯笼的钟摆 (10, 1.1)；叶子用原作袖子的弹簧 (40, 6)
    const swing = sim([{ type: 'spring', k: 30, d: 4 }, { type: 'pendulum', k: 10, d: 1.1 }, { type: 'spring', k: 40, d: 6 }],
      u => { const w = windAt(u); return [0.3 * w, 0.9 * w, 0.28 * w]; });

    // —— 颜色 ——
    // 夜里纸、墨按原作色带反相；平涂色（灯罩的红、书皮的靛蓝、茶色）按原作 nightTint() 压暗。
    // 台灯照到的地方换成 LIT：暖白纸、深墨，与原作窗灯照亮的意思一致
    const RED = hx('#b3412d'), RED_NIGHT = hx('#6e2a22'), INDIGO = hx('#34507a'), TEA = hx('#a8743c');
    const night = (c, t) => mc(c, mc(c, [12, 16, 30], 0.6), t * 0.55);
    const LIT = { paper: hx('#fbf1dc'), ink: INK_DARK, red: RED, indigo: INDIGO, tea: TEA };
    const KEYS = ['paper', 'ink', 'red', 'indigo', 'tea'];
    const sceneCol = P => ({ paper: P.paper, ink: P.ink, red: mc(RED, RED_NIGHT, P.inkT), indigo: night(INDIGO, P.inkT), tea: night(TEA, P.inkT) });
    const mixCol = (a, b, t) => { const o = {}; KEYS.forEach(n => { o[n] = mc(a[n], b[n], t); }); return o; };
    let C = null; // 当前这一遍用的 css 颜色
    let GA = 1;   // 当前这一遍的整体不透明度；灯光那几遍叠画时小于 1，各处的透明度都乘上它

    const strokeP = (k, d, w = SP, a = 1) => { k.globalAlpha = GA * (a); k.lineWidth = w; k.strokeStyle = C.ink; k.stroke(path(d)); k.globalAlpha = GA; };
    const shapeP = (k, d, w = SP, col = C.paper) => { const p = path(d); k.globalAlpha = GA; k.fillStyle = col; k.fill(p); k.lineWidth = w; k.strokeStyle = C.ink; k.stroke(p); };

    // —— 窗外（只在第一遍画，灯光照不到窗口）——
    const WIN = { x0: 352, x1: 500, y0: 18, y1: 128, gx0: 358, gx1: 494, gy0: 24, gy1: 122, mx: 426, my: 64 };
    const STARS = [[366, 30, 0.8, 3], [380, 46, 0.6, 5], [398, 28, 1.1, 4], [414, 40, 0.6, 7], [440, 30, 0.7, 6], [456, 48, 0.9, 3], [472, 28, 0.6, 8], [486, 40, 0.8, 5], [434, 52, 0.5, 9]];
    // 远处三栋房子：瓦顶、墙、几扇窗；窗按各自的暗度阈值亮，阈值依次错开，天黑时一扇扇亮
    const TOWN = [
      { roof: 'M356 106 L366 98 L392 98 L400 106Z', wall: [360, 106, 396, 122], tiles: [[368, 101, 390], [362, 104, 396]] },
      { roof: 'M400 102 L412 92 L438 92 L450 102Z', wall: [404, 102, 446, 122], tiles: [[414, 95, 436], [406, 99, 446]] },
      { roof: 'M448 108 L458 100 L486 100 L498 108Z', wall: [452, 108, 494, 122], tiles: [[460, 103, 484], [452, 106, 494]] },
    ];
    const FARWIN = [[368, 110, 376, 116, 0.15], [410, 106, 418, 112, 0.35], [430, 106, 438, 112, 0.55], [470, 112, 478, 118, 0.75]];
    function outside(k, F) {
      const { P, tau } = F, tw = wrap(tau, 1);
      k.save();
      k.beginPath(); k.rect(WIN.gx0, WIN.gy0, WIN.gx1 - WIN.gx0, WIN.gy1 - WIN.gy0); k.clip();
      const g = k.createLinearGradient(0, WIN.gy0, 0, WIN.gy1);
      g.addColorStop(0, css(P.top)); g.addColorStop(1, css(P.bot));
      k.fillStyle = g; k.fillRect(WIN.gx0, WIN.gy0, WIN.gx1 - WIN.gx0, WIN.gy1 - WIN.gy0);
      if (P.night > 0.01) {
        k.fillStyle = '#f5efda';
        STARS.forEach(([x, y, r, n], i) => { k.globalAlpha = GA * (P.night * (0.55 + 0.45 * Math.sin(n * W * F.u + i))); k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill(); });
        k.globalAlpha = GA;
      }
      // 太阳：午后从右上落到屋后（τ 0.56–0.78），早上从左边升起（τ 0.30–0.56），两段在右上角接上
      let sun = null;
      if (tw >= 0.56 && tw < 0.8) { const s = (tw - 0.56) / 0.22; sun = [476 - 56 * s, 30 + 86 * Math.pow(s, 1.2)]; }
      else if (tw >= 0.3 && tw < 0.56) { const s = (tw - 0.3) / 0.26; sun = [366 + 110 * s, 118 - 88 * ease(s)]; }
      if (sun) {
        const [x, y] = sun, gl = k.createRadialGradient(x, y, 0, x, y, 30);
        gl.addColorStop(0, 'rgba(255,217,160,0.55)'); gl.addColorStop(1, 'rgba(255,217,160,0)');
        k.globalAlpha = GA * (0.35 + 0.65 * P.sunset); k.fillStyle = gl; k.beginPath(); k.arc(x, y, 30, 0, TAU); k.fill(); k.globalAlpha = GA;
        shapeP(k, oval(x, y, 9, 9), SP, css(mc(hx('#fbf3df'), hx('#df5a3a'), P.sunset)));
      }
      // 蛾眉月：画法同 #4-100，夜里从左下升到右上
      if (tau > 0.84 && tau < 1.3) {
        const m = (tau - 0.84) / 0.46, x = 372 + 100 * m, y = 104 - 70 * Math.sin(Math.PI / 2 * m), r = 7;
        k.save(); k.translate(x, y); k.rotate(-24 * Math.PI / 180); k.globalAlpha = GA * (smooth(0, 0.1, m) * smooth(1, 0.85, m));
        k.fillStyle = '#f3ecd6'; k.fill(new Path2D(`M0 ${-r} A${r} ${r} 0 1 1 0 ${r} A${r * 0.62} ${r} 0 1 0 0 ${-r}Z`));
        k.restore();
      }
      // 电线杆与电线，远景用原作的淡墨 0.42 的思路，这里窗框里的景稍近一点，取 0.7
      strokeP(k, 'M400 58 L400 100 M391 66 L409 66 M391 66 Q374 72 356 70 M409 66 Q452 76 496 72', FP * 1.4, 0.7);
      TOWN.forEach(h => {
        const [x0, y0, x1, y1] = h.wall;
        shapeP(k, `M${x0} ${y0} L${x1} ${y0} L${x1} ${y1 + 2} L${x0} ${y1 + 2}Z`, FP * 1.4);
        shapeP(k, h.roof, FP * 1.4);
        h.tiles.forEach(([a, y, b]) => strokeP(k, `M${a} ${y} L${b} ${y}`, FP, 0.8));
      });
      FARWIN.forEach(([x0, y0, x1, y1, thr]) => {
        const lit = smooth(thr, thr + 0.25, P.lamp);
        k.fillStyle = css(mc(P.paper, hx('#ffd58a'), lit * 0.92)); k.fillRect(x0, y0, x1 - x0, y1 - y0);
        strokeP(k, `M${x0} ${y0} L${x1} ${y0} L${x1} ${y1} L${x0} ${y1}Z M${(x0 + x1) / 2} ${y0} L${(x0 + x1) / 2} ${y1}`, FP);
      });
      k.restore();
    }

    // —— 书 ——
    // 摊开的书平放在桌上，书脊沿深度方向；翻动的那一页绕书脊转 θ（0 平放在右、π 落到左），
    // 页面带一点弯：离书脊越远转得越慢，像纸被风兜着
    const BK = { x: 236, z0: 4, z1: 20, pw: 50 };
    const pageQuad = (th, bend) => {
      const near = [], far = [];
      for (let i = 0; i <= 8; i++) {
        const r = BK.pw * i / 8, a = th - bend * Math.pow(i / 8, 2);
        const x = BK.x + r * Math.cos(a), y = -1.6 - r * Math.sin(a);
        near.push(P3(x, y, BK.z0)); far.push(P3(x, y, BK.z1));
      }
      return 'M' + near.map(pt).join('L') + 'L' + far.reverse().map(pt).join('L') + 'Z';
    };
    // 翻页时刻：弱风只把一页掀起一半又落回；强风连翻三页。所有页的字行一样，翻完书的样子不变，循环接得上
    const FLIPS = [{ t: 1.25, d: 0.9, peak: 1.1, back: true }, { t: 3.75, d: 0.55 }, { t: 4.05, d: 0.55 }, { t: 4.4, d: 0.6 }];
    function flipAngle(f, u) {
      const s = (u - f.t) / f.d;
      if (s <= 0 || s >= 1) return null;
      if (f.back) return f.peak * Math.sin(Math.PI * s);
      return Math.PI * minJerk(s);
    }
    // 字行：每页 7 行，长短按行号固定
    const textLines = (x0, x1, dir) => {
      let d = '';
      for (let i = 0; i < 7; i++) {
        const z = BK.z1 - 2 - i * 2, len = (0.62 + 0.3 * rnd(i, dir > 0 ? 3 : 4)) * (BK.pw - 10);
        const a = P3(dir > 0 ? x0 + 5 : x1 - 5 - len, -1.6, z), b = P3(dir > 0 ? x0 + 5 + len : x1 - 5, -1.6, z);
        d += `M${pt(a)}L${pt(b)}`;
      }
      return d;
    };
    function book(k, u) {
      const L = BK.x - BK.pw, R = BK.x + BK.pw;
      // 书皮（靛蓝）比纸页略大，露出一圈
      shapeP(k, poly([P3(L - 3, 0, BK.z0 - 2), P3(R + 3, 0, BK.z0 - 2), P3(R + 3, 0, BK.z1 + 2), P3(L - 3, 0, BK.z1 + 2)], true), SP, C.indigo);
      // 纸页厚度：左右各两三道
      shapeP(k, poly([P3(L, -1.6, BK.z0), P3(BK.x, -1.6, BK.z0), P3(BK.x, -1.6, BK.z1), P3(L, -1.6, BK.z1)], true));
      shapeP(k, poly([P3(BK.x, -1.6, BK.z0), P3(R, -1.6, BK.z0), P3(R, -1.6, BK.z1), P3(BK.x, -1.6, BK.z1)], true));
      strokeP(k, `M${pt(P3(L, -0.8, BK.z0))}L${pt(P3(BK.x, -0.8, BK.z0))} M${pt(P3(BK.x, -0.8, BK.z0))}L${pt(P3(R, -0.8, BK.z0))}`, FP);
      strokeP(k, textLines(L, BK.x, -1) + textLines(BK.x, R, 1), FP, 0.75);
      // 翻动的页；一阵风里可能同时有两页在动，按角度从大到小画（先画已翻过去的）
      const live = FLIPS.map(f => flipAngle(f, u)).filter(a => a !== null).sort((a, b) => b - a);
      live.forEach(th => {
        const bend = 0.55 * Math.sin(th) * (th < Math.PI / 2 ? 1 : -1) * 0.6;
        shapeP(k, pageQuad(th, bend), SP);
        // 页面正对观者时露出几行字，侧过去就看不见
        const vis = Math.abs(Math.cos(th));
        if (vis > 0.35) {
          let d = '';
          for (let i = 0; i < 3; i++) {
            const z = BK.z1 - 4 - i * 4, r0 = 6, r1 = BK.pw * (0.55 + 0.1 * i);
            const a = P3(BK.x + r0 * Math.cos(th), -1.6 - r0 * Math.sin(th), z), b = P3(BK.x + r1 * Math.cos(th), -1.6 - r1 * Math.sin(th), z);
            d += `M${pt(a)}L${pt(b)}`;
          }
          strokeP(k, d, FP, 0.6 * (vis - 0.35) / 0.65);
        }
      });
      // 书脊的折缝
      strokeP(k, `M${pt(P3(BK.x, -1.6, BK.z0))}L${pt(P3(BK.x, -1.6, BK.z1))}`, SP);
    }

    // —— 台灯 ——
    // 底座在桌上，两节灯臂，红色灯罩口朝下斜对着书。灯光照到的地方是一个梯形光锥加桌面上的椭圆光斑
    const LAMP = { base: P3(96, 0, 14), elbow: [118, 66], head: [150, 52] };
    const SHADE = 'M138 50 L160 46 L176 74 L136 82Z';
        function lamp(k, on) {
      const [bx, by] = LAMP.base;
      shapeP(k, oval(bx, by - 1, 20, 5));
      shapeP(k, `M${bx - 20} ${by - 1} L${bx - 20} ${by - 4} A20 5 0 0 1 ${bx + 20} ${by - 4} L${bx + 20} ${by - 1}`);
      // 灯臂两笔开口，与人物四肢同一种画法
      limbP(k, [[bx, by - 6], LAMP.elbow, LAMP.head], 3.2);
      shapeP(k, oval(LAMP.elbow[0], LAMP.elbow[1], 2.4, 2.4));
      // 灯罩里的灯泡：亮时暖白
      shapeP(k, oval(156, 78, 6, 3.4), FP, css(mc(C.paperArr, hx('#fff1c9'), on)));
      shapeP(k, SHADE, SP, C.red);
      strokeP(k, 'M141 54 L162 50', FP, 0.8);
      shapeP(k, oval(LAMP.head[0], LAMP.head[1], 2.2, 2.2));
    }
    // limb() 用的是 kit 的 PAPER/INK，夜里颜色会变，所以在这里照它的做法换成当前颜色
    function limbP(k, joints, width) {
      const s = joints[0], e = joints[joints.length - 1], m = joints[1];
      let c = [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2];
      c = [m[0] + 0.55 * (m[0] - c[0]), m[1] + 0.55 * (m[1] - c[1])];
      const P = [];
      for (let i = 0; i <= 16; i++) { const t = i / 16, v = 1 - t; P.push([v * v * s[0] + 2 * v * t * c[0] + t * t * e[0], v * v * s[1] + 2 * v * t * c[1] + t * t * e[1]]); }
      const half = (width - SP) / 2;
      const side = sg => P.map((p, i) => {
        const q = P[Math.min(16, i + 1)], o = P[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1;
        return [p[0] - (dy / l) * half * sg, p[1] + (dx / l) * half * sg];
      });
      const A = side(1), B = side(-1);
      k.fillStyle = C.paper; k.fill(path(poly(A) + 'L' + B.slice().reverse().map(pt).join('L') + 'Z'));
      strokeP(k, poly(A.slice(0, 16))); strokeP(k, poly(B.slice(1)));
    }

    // —— 茶杯与热气 ——
    const CUP = P3(384, 0, 12);
    function cup(k, u, wind) {
      const [cx, cy] = CUP;
      shapeP(k, oval(cx, cy, 15, 4));                                               // 杯碟
      shapeP(k, `M${cx - 9} ${cy - 18} L${cx - 7} ${cy - 2} Q${cx} ${cy + 1} ${cx + 7} ${cy - 2} L${cx + 9} ${cy - 18}Z`);
      strokeP(k, `M${cx + 9} ${cy - 14} q6 0 5 5 q-1 4 -6 4`, SP);                  // 杯把
      shapeP(k, oval(cx, cy - 18, 9, 2.4), FP, C.tea);                              // 茶面
      // 热气：三缕各是一条波浪线，波形一个周期往上走 2 遍，越往上越淡；风越大越往左弯
      for (let i = 0; i < 3; i++) {
        let prev = null;
        for (let j = 0; j <= 10; j++) {
          const t = j / 10, x = cx - 4 + i * 4 + 2.4 * Math.sin(TAU * 1.4 * t - 2 * W * u + i * 2.1) * t - wind * 26 * t * t;
          const p = [x, cy - 22 - 34 * t];
          if (prev) strokeP(k, `M${pt(prev)}L${pt(p)}`, FP * 1.2, 0.5 * (1 - t) * (1 - 0.4 * clamp(wind)));
          prev = p;
        }
      }
    }

    // —— 窗帘、挂历、笔筒、绿植 ——
    function curtain(k, s) {
      strokeP(k, 'M338 12 L520 12', SP * 1.4);
      [344, 498, 506, 514].forEach(x => shapeP(k, oval(x, 12, 2.2, 2.2), FP));
      // 上沿挂在杆上不动，越往下被风推得越远，下摆偏 dx
      const dx = s * 54;
      shapeP(k, `M494 14 L514 14 C514 60 ${514 - dx * 0.22} 100 ${514 - dx * 0.55} 131 Q${505 - dx * 0.8} 135 ${494 - dx} 132 C${494 - dx * 0.4} 100 494 60 494 14Z`);
      // 两道褶线，跟着下摆偏
      strokeP(k, `M500 15 C500 60 ${500 - dx * 0.3} 100 ${500 - dx * 0.85} 132 M507 15 C507 60 ${507 - dx * 0.26} 100 ${507 - dx * 0.7} 133`, FP);
    }
    // 挂历：钉子上挂一根绳，挂历绕钉子按钟摆转；表头一条靛蓝，下面是日期格
    function calendar(k, a) {
      k.save(); k.translate(70, 20); k.rotate(-a);
      strokeP(k, 'M0 0 L-12 12 M0 0 L12 12', FP);
      shapeP(k, 'M-22 12 L22 12 L22 70 L-22 70Z');
      shapeP(k, 'M-22 12 L22 12 L22 22 L-22 22Z', FP, C.indigo);
      k.fillStyle = C.ink; k.font = `600 17px ${JP}`; k.textAlign = 'center'; k.textBaseline = 'middle';
      k.fillText('18', 0, 34);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) {
        k.globalAlpha = GA * (r * 7 + c === 16 ? 1 : 0.55);
        k.fillRect(-18 + c * 6, 46 + r * 5.5, 1.6, 1.6);
      }
      k.globalAlpha = GA;
      k.restore();
      shapeP(k, oval(70, 20, 1.6, 1.6), FP);
    }
    function pencils(k) {
      const [x, y] = P3(318, 0, 18);
      strokeP(k, `M${x - 3} ${y - 18} L${x - 9} ${y - 38} M${x + 1} ${y - 18} L${x + 3} ${y - 42} M${x + 4} ${y - 18} L${x + 12} ${y - 34}`, SP);
      shapeP(k, `M${x - 8} ${y - 20} L${x - 7} ${y} L${x + 7} ${y} L${x + 8} ${y - 20}Z`);
      shapeP(k, oval(x, y - 20, 8, 2), FP);
    }
    // 绿植：五片叶子从盆口伸出，叶尖按弹簧往左（屋里）偏，越高的叶子偏得越多；平时有一点轻颤
    const LEAVES = [[-14, -26, 0.8], [-6, -36, 1], [2, -40, 1.1], [9, -32, 0.95], [15, -22, 0.75]];
    function plant(k, s, u) {
      const [x, y] = P3(462, 0, 16);
      LEAVES.forEach(([lx, ly, f], i) => {
        const bend = -(s * 38 + 0.8 * Math.sin((3 + i) * W * u + i)) * f;
        const tip = [x + lx + bend, y - 18 + ly + Math.abs(bend) * 0.25], base = [x + lx * 0.2, y - 18];
        const mid = [(base[0] + tip[0]) / 2 + lx * 0.3, (base[1] + tip[1]) / 2];
        const n = [-(tip[1] - base[1]), tip[0] - base[0]], l = Math.hypot(n[0], n[1]) || 1, wv = 4.5;
        const a = [mid[0] + n[0] / l * wv, mid[1] + n[1] / l * wv], b = [mid[0] - n[0] / l * wv, mid[1] - n[1] / l * wv];
        shapeP(k, `M${pt(base)} Q${pt(a)} ${pt(tip)} Q${pt(b)} ${pt(base)}Z`, FP * 1.5);
        strokeP(k, `M${pt(base)} Q${pt(mid)} ${pt(lerpP(base, tip, 0.8))}`, FP, 0.7);
      });
      shapeP(k, `M${x - 12} ${y - 19} L${x - 9} ${y} L${x + 9} ${y} L${x + 12} ${y - 19}Z`);
      strokeP(k, `M${x - 12} ${y - 15} L${x + 12} ${y - 15}`, FP);
    }

    // —— 桌子与墙 ——
    const BACK = FRONT - 0.6 * DEPTH;
    function desk(k) {
      shapeP(k, `M14 ${BACK} L${520 + 0.25 * DEPTH} ${BACK} L520 ${FRONT} L14 ${FRONT}Z`);
      shapeP(k, `M14 ${FRONT} L520 ${FRONT} L520 ${FRONT + 12} L14 ${FRONT + 12}Z`);
      shapeP(k, `M520 ${FRONT} L${520 + 0.25 * DEPTH} ${BACK} L${520 + 0.25 * DEPTH} ${BACK + 12} L520 ${FRONT + 12}Z`);
      strokeP(k, `M190 ${FRONT + 3} L346 ${FRONT + 3} L346 ${FRONT + 10} L190 ${FRONT + 10}Z M262 ${FRONT + 6.5} L274 ${FRONT + 6.5}`, FP);
      shapeP(k, `M24 ${FRONT + 12} L32 ${FRONT + 12} L32 ${CH + 2} L24 ${CH + 2}Z M502 ${FRONT + 12} L510 ${FRONT + 12} L510 ${CH + 2} L502 ${CH + 2}Z`);
      strokeP(k, `M0 198 L24 198 M32 198 L502 198 M510 198 L${CW} 198`, FP);   // 地板线
    }
    const WINDOW = (() => {
      const { x0, x1, y0, y1, gx0, gx1, gy0, gy1 } = WIN;
      return `M${x0} ${y0} L${x1} ${y0} L${x1} ${y1} L${x0} ${y1}Z M${gx0} ${gy0} L${gx0} ${gy1} L${gx1} ${gy1} L${gx1} ${gy0}Z`;
    })();
    function windowFrame(k) {
      shapeP(k, WINDOW);
      shapeP(k, `M${WIN.mx - 2} ${WIN.gy0} L${WIN.mx + 2} ${WIN.gy0} L${WIN.mx + 2} ${WIN.gy1} L${WIN.mx - 2} ${WIN.gy1}Z M${WIN.gx0} ${WIN.my - 2} L${WIN.gx1} ${WIN.my - 2} L${WIN.gx1} ${WIN.my + 2} L${WIN.gx0} ${WIN.my + 2}Z`, FP * 1.4);
      shapeP(k, `M344 ${WIN.y1} L508 ${WIN.y1} L510 ${WIN.y1 + 5} L342 ${WIN.y1 + 5}Z`);
    }

    // 整个房间画一遍；full 为假时是灯光里的第二遍，窗外不在光里，跳过
    function room(k, F, st, full) {
      k.globalAlpha = GA; k.fillStyle = C.paper; k.fillRect(-2, -2, CW + 4, CH + 4);
      strokeP(k, `M0 ${BACK - 30} L344 ${BACK - 30} M510 ${BACK - 30} L${CW} ${BACK - 30}`, FP, 0.6);   // 墙裙线
      if (full) outside(k, F);
      windowFrame(k);
      curtain(k, st.cur);
      calendar(k, st.cal);
      desk(k);
      pencils(k);
      plant(k, st.leaf, F.u);
      book(k, F.u);
      cup(k, F.u, st.wind);
      lamp(k, st.on);
    }
    // 灯光照到的范围：桌面上以书为中心的椭圆光斑。由大到小叠画 5 层，从外圈到正中心亮度一层层加上去，边缘有一圈渐变
    const POOL_F = [1.3, 1.22, 1.14, 1.07, 1];
    const POOLS = POOL_F.map(f => { const p = new Path2D(); p.ellipse(226, 138, 128 * f, 42 * f, 0, 0, TAU); return p; });
    // 灯罩口到光斑的光锥，画法同 #4-100 路灯：上浓下淡的暖色半透明梯形
    const CONE = new Path2D('M137 81 L176 74 L340 150 L120 158Z');
    CELLS[8] = (k, w, h, u) => {
      const tau = tauAt(u), P = palette(wrap(tau, 1));
      const [cur, cal, leaf] = swing(u);
      const st = { cur, cal, leaf, wind: windAt(u), on: lampOn(u) };
      const F = { u, tau: wrap(tau, 1), P };
      const base = sceneCol(P);
      const use = c => { C = {}; KEYS.forEach(n => { C[n] = css(c[n]); }); C.paperArr = c.paper; };
      k.save();
      k.lineCap = 'round'; k.lineJoin = 'round';
      use(base);
      room(k, F, st, true);
      // 灯光：光斑里的纸和墨向暖白纸、深墨过渡。白天开着灯也不太看得出，所以强度跟着天黑程度从 0.35 加到 1
      const a = st.on * (0.35 + 0.65 * P.lamp);
      if (a > 0.004) {
        use(mixCol(base, LIT, a));
        // 第 j 层叠完后的亮度是 a·j/5；每层的不透明度按「叠上去刚好补到这一档」算
        POOLS.forEach((pl, j) => {
          const c0 = a * j / POOLS.length, c1 = a * (j + 1) / POOLS.length;
          k.save(); k.clip(pl); GA = (c1 - c0) / (1 - c0);
          room(k, F, st, false);
          k.restore();
        });
        GA = 1; use(base);
        const g = k.createLinearGradient(0, 78, 0, 156);
        g.addColorStop(0, 'rgba(255,226,168,0.5)'); g.addColorStop(1, 'rgba(255,226,168,0.06)');
        k.globalAlpha = a * 0.75; k.fillStyle = g; k.fill(CONE); k.globalAlpha = 1;
        // 灯泡周围的光晕画在灯罩外面，夜里能看到灯口一圈亮
        const gb = k.createRadialGradient(156, 79, 0, 156, 79, 22);
        gb.addColorStop(0, 'rgba(255,226,168,0.7)'); gb.addColorStop(1, 'rgba(255,226,168,0)');
        k.globalAlpha = st.on * P.lamp; k.fillStyle = gb; k.beginPath(); k.arc(156, 79, 22, 0, TAU); k.fill(); k.globalAlpha = 1;
      }
      k.restore();
    };
  }

  // @element 10
  // 路面电车过街：原作没有城市交通场景，这里按原作的画法（细墨线、纸色遮挡、一两处平涂色、daynight.ts 夜间反相）新编一条电车街。
  // 镜头跟着电车走，楼群分远、中、近三层按不同速度后退（视差）；电车减速进站、停一下、再起步，车里不画脸的乘客随刹车和起步前后晃（钟摆、弹簧）；
  // 集电杆一直顶着架空线。从午后走到黄昏，车窗、路灯、楼窗一盏盏亮起，复位段走过夜里回到午后
  {
    // 主线约 1 px、细节线按原作 0.4–0.6 倍，与 #4-101、#4-104 一致
    const SP = 1.1, FP = 0.6;
    const JP = '"Hiragino Mincho ProN","Yu Mincho","YuMincho","Noto Serif JP","Songti SC",serif';
    const W = TAU / CYC; // 一周期一圈的角速度，周期性小动作都取它的整数倍
    const oval = (cx, cy, rx, ry) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
    const rect = (x0, y0, x1, y1) => `M${x0} ${y0} L${x1} ${y0} L${x1} ${y1} L${x0} ${y1}Z`;
    const rot = (p, c, a) => { const s = Math.sin(a), co = Math.cos(a), x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * co - y * s, c[1] + x * s + y * co]; };

    // —— 6.4 秒里的一天 ——
    // 午后 τ 0.64 开始，进站时（约 2.5 秒）正是黄昏，停站时天暗下来、车窗灯亮；4.6 秒入夜，5.4–5.9 秒走过夜里和黎明，最后 0.5 秒回到午后。
    // 首末关键帧差整一天，首尾画面相同
    const tauAt = dayClock([[0, 0.64], [1.4, 0.69], [3.0, 0.745], [4.6, 0.79], [5.4, 0.86], [5.9, 1.3], [6.4, 1.64]]);

    // —— 电车的速度 ——
    // 速度占全速的比例：0.4–2.4 秒刹车到停，2.4–4.0 秒停站，4.0–6.0 秒起步回到全速，6.0–6.4 秒匀速接回开头。
    // 刹车按 v = 1 − t²：开始时轻轻带闸，停住那一下减速度最大、突然归零，车里的人先往前倒、停下时再往回荡；
    // 起步按 v = 1 − (1 − t)²：一松闸就猛地一拽，人往后仰。走过的路用这两条的积分直接算，不逐帧累加
    const BRAKE = [0.4, 2.4], START = [4.0, 6.0];
    const seg = ([a, b], u) => clamp((u - a) / (b - a));
    const G = u => {
      const D1 = BRAKE[1] - BRAKE[0], D2 = START[1] - START[0], s1 = seg(BRAKE, u), s2 = seg(START, u);
      return Math.min(u, BRAKE[0]) + D1 * (s1 - s1 * s1 * s1 / 3) + D2 * (s2 * s2 - s2 * s2 * s2 / 3) + Math.max(0, u - START[1]);
    };
    const gAt = u => { const s1 = seg(BRAKE, u), s2 = seg(START, u); return u < START[0] ? 1 - s1 * s1 : 1 - (1 - s2) * (1 - s2); };
    // 加速度，单位：全速 / 秒
    const accAt = u => {
      if (u > BRAKE[0] && u < BRAKE[1]) return -2 * seg(BRAKE, u) / (BRAKE[1] - BRAKE[0]);
      if (u > START[0] && u < START[1]) return 2 * (1 - seg(START, u)) / (START[1] - START[0]);
      return 0;
    };
    // 一个周期走过的画面距离：近景（电线杆、路面石块）按它重复。停站时正好走过一半；站台宽 400，
    // DIST 取 960 时周期开头站台还在画面右边外（x0 = 549）、结尾已出左边（x1 = −11），画面里一周期只经过一次
    const DIST = 960, GT = G(CYC), V0 = DIST / GT;
    const offAt = u => V0 * G(wrap(u));
    // 三层视差：近景 1 倍、中景楼 0.78 倍、远景楼 0.36 倍。每层一个周期刚好移过整数个自身的重复宽度，循环接得上
    const LAYER = { near: 1, mid: 0.78, far: 0.36 };

    // —— 乘客与吊环 ——
    // 刹车时车里的人往前（+x）倒、起步时往后仰：惯性力 = −加速度。
    // 站着的人用原作公文包的钟摆 (14, 1.8)，吊环用原作灯笼的钟摆 (10, 1.1)，坐着的人用原作手臂的弹簧 (60, 9)
    const sway = sim([
      { type: 'pendulum', k: 14, d: 1.8 },
      { type: 'pendulum', k: 14, d: 1.8 },
      { type: 'pendulum', k: 10, d: 1.1 },
      { type: 'spring', k: 60, d: 9 },
    ], u => { const f = -accAt(u); return [1.9 * f, 1.6 * f, 2.6 * f, 0.07 * f]; });

    // —— 颜色 ——
    // 平涂色两种：电车腰带的绿（原作的 #4e8a5a）和站牌的红（原作的 #b3412d），夜里按原作 nightTint() 压暗
    const GREEN = hx('#4e8a5a'), RED = hx('#b3412d'), RED_NIGHT = hx('#6e2a22');
    const nightTint = (c, inkT, amt = 0.55) => mc(c, mc(c, [12, 16, 30], 0.6), inkT * amt);
    // 灯光颜色用原作窗光那一档暖黄；乘客剪影在亮着的车窗前压成深褐（原作屋内的 #3a2c22）
    const WARM = '255,226,168', LITWIN = hx('#ffd58a'), SIL = hx('#3a2c22');
    const WARMGLOW = [[0, '255,213,138', 0.75], [0.45, '255,184,92', 0.28], [1, '255,184,92', 0]];
    let C = null; // 当前帧的 css 颜色；kit 的 pen/shape 用固定 INK/PAPER，夜里会反相，所以用下面两个按 C 画
    const strokeP = (k, d, w = SP, a = 1) => { k.globalAlpha = a; k.lineWidth = w; k.strokeStyle = C.ink; k.stroke(path(d)); k.globalAlpha = 1; };
    const shapeP = (k, d, w = SP, col = C.paper) => { const p = path(d); k.fillStyle = col; k.fill(p); k.lineWidth = w; k.strokeStyle = C.ink; k.stroke(p); };
    const radial = (k, x, y, r, stops, alpha) => {
      if (alpha < 0.004) return;
      const g = k.createRadialGradient(x, y, 0, x, y, r);
      stops.forEach(([o, c, a]) => g.addColorStop(o, `rgba(${c},${a})`));
      k.globalAlpha = alpha; k.fillStyle = g; k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill(); k.globalAlpha = 1;
    };
    // 某一层按偏移 off 平移、每 per 重复一次：对落在画面里的每一份调用 fn(dx)
    const tiles = (off, per, fn, pad = 40) => {
      const o = wrap(off, per);
      for (let x = -o; x < CW + pad; x += per) if (x + per > -pad) fn(x);
    };

    // —— 天空 ——
    const HZ = 150; // 街对面人行道的后沿，楼都站在这条线上
    const STARS = Array.from({ length: 14 }, (_, i) => [8 + rnd(i, 41) * 520, 6 + rnd(i, 42) * 60, 0.5 + rnd(i, 43) * 0.6, 2 + Math.floor(rnd(i, 44) * 7)]);
    function sky(k, F) {
      const { P, u, tau } = F;
      const g = k.createLinearGradient(0, 0, 0, HZ);
      g.addColorStop(0, css(P.top)); g.addColorStop(1, css(P.bot));
      k.fillStyle = g; k.fillRect(-2, -2, CW + 4, HZ + 2);
      if (P.night > 0.01) {
        k.fillStyle = '#f5efda';
        STARS.forEach(([x, y, r, n], i) => { k.globalAlpha = P.night * (0.55 + 0.45 * Math.sin(n * W * u + i)); k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill(); });
        k.globalAlpha = 1;
      }
      // 太阳在无穷远，不随镜头平移：沿原作 sky.ts 的弧（τ 0.225 升、0.775 落）落到楼群后面，越近日落越红
      const s = (tau - 0.225) / 0.55;
      if (s > -0.05 && s < 1.05) {
        const x = 40 + 420 * s, y = HZ + 6 - 130 * Math.sin(Math.PI * clamp(s));
        radial(k, x, y, 44, [[0, '255,217,160', 0.55], [1, '255,217,160', 0]], 0.35 + 0.65 * P.sunset);
        shapeP(k, oval(x, y, 10, 10), SP, css(mc(hx('#fbf3df'), hx('#df5a3a'), P.sunset)));
      }
      // 蛾眉月：画法同 #4-100，入夜后从左边升起
      if (tau > 0.8 && tau < 1.2) {
        const m = (tau - 0.8) / 0.4, x = 70 + 160 * m, y = 70 - 44 * Math.sin(Math.PI / 2 * m), r = 6;
        k.save(); k.translate(x, y); k.rotate(-24 * Math.PI / 180); k.globalAlpha = smooth(0, 0.1, m) * smooth(1, 0.85, m);
        k.fillStyle = '#f3ecd6'; k.fill(new Path2D(`M0 ${-r} A${r} ${r} 0 1 1 0 ${r} A${r * 0.62} ${r} 0 1 0 0 ${-r}Z`));
        k.restore();
      }
    }

    // —— 远景楼群：淡墨 0.42（原作远山的浓度），一份 252 宽 ——
    const FAR_PER = DIST * LAYER.far;
    // 远景楼要比中景楼高，楼顶才露得出来
    const FAR = [[0, 34, 96], [30, 22, 124, 'tower'], [56, 40, 84], [100, 30, 110], [134, 44, 78], [182, 26, 100, 'tank'], [212, 40, 90]];
    function farTown(k, off) {
      k.globalAlpha = 0.42;
      tiles(off, FAR_PER, dx => {
        FAR.forEach(([x, w, h, kind]) => {
          const x0 = dx + x * FAR_PER / 252, x1 = x0 + w, y0 = HZ - h;
          if (kind === 'tower') {
            // 钟楼：塔身加尖顶，上面一个圆钟面
            shapeP(k, `M${x0} ${HZ} L${x0} ${y0 + 14} L${x0 + w / 2} ${y0 - 6} L${x1} ${y0 + 14} L${x1} ${HZ}Z`, SP * 0.8);
            shapeP(k, oval(x0 + w / 2, y0 + 22, 5, 5), FP);
          } else {
            shapeP(k, rect(x0, y0, x1, HZ + 1), SP * 0.8);
            if (kind === 'tank') shapeP(k, `M${x0 + 6} ${y0} L${x0 + 6} ${y0 - 8} Q${x0 + 11} ${y0 - 12} ${x0 + 16} ${y0 - 8} L${x0 + 16} ${y0}Z`, FP);
          }
        });
      });
      k.globalAlpha = 1;
    }

    // —— 中景楼群：一份宽 DIST×0.78，街对面一排两三层的老店铺，立面画法（不画透视）——
    // [宽, 高, 招牌字, 屋顶样式]；宽按比例铺满一份，免得接缝处空一块
    const MID_PER = DIST * LAYER.mid;
    const MID_RAW = [[70, 62, '喫茶', 'flat'], [88, 86, '書店', 'bill'], [58, 56, '薬', 'gable'], [84, 78, '洋品', 'flat'], [72, 70, '時計', 'gable'], [96, 90, '銀行', 'clock'], [86, 64, '菓子', 'flat']];
    const MID_SUM = MID_RAW.reduce((s, b) => s + b[0], 0);
    const MID = (() => {
      let x = 0;
      return MID_RAW.map(([w, h, sign, roof], i) => {
        const ww = w * MID_PER / MID_SUM, b = { x0: x, x1: x + ww, h, sign, roof, i };
        x += ww;
        // 楼上的窗：每层 22 高，窗按楼宽均分；每扇窗有自己的点灯时刻（阈值 thr 换算成秒），天黑时一扇扇亮
        b.wins = [];
        const floors = Math.floor((h - 30) / 22), n = Math.max(2, Math.round(ww / 22));
        for (let f = 0; f < floors; f++) for (let j = 0; j < n; j++) {
          const cx = x - ww + ww * (j + 0.5) / n, y0 = HZ - 36 - f * 22 - 12;
          b.wins.push([cx - 4, y0, cx + 4, y0 + 12, 0.05 + 0.7 * rnd(i * 13 + f * 5 + j, 7)]);
        }
        return b;
      });
    })();
    // 楼窗点灯按时间排开：天色在 2.8–3.2 秒里很快变暗，按 P.lamp 阈值会几乎同时亮，所以改成 2.87–4.0 秒一扇扇亮，天亮前 5.48–5.84 秒一扇扇熄
    const winLit = (u, thr) => smooth(2.8 + 1.4 * thr, 2.95 + 1.4 * thr, u) * smooth(5.85 - 0.3 * thr, 5.7 - 0.3 * thr, u);
    function midTown(k, F, off) {
      const { P } = F, u = wrap(F.u);
      tiles(off, MID_PER, dx => {
        MID.forEach(b => {
          const x0 = dx + b.x0, x1 = dx + b.x1, top = HZ - b.h;
          if (x1 < -4 || x0 > CW + 4) return;
          shapeP(k, rect(x0, top, x1, HZ + 1));
          if (b.roof === 'gable') {
            // 瓦顶的山墙面朝街：两坡加一道屋脊，几道瓦沟
            const m = (x0 + x1) / 2;
            shapeP(k, `M${x0 - 3} ${top + 2} L${m} ${top - 14} L${x1 + 3} ${top + 2}Z`);
            strokeP(k, `M${m - 10} ${top - 8} L${m + 10} ${top - 8} M${x0 + 6} ${top - 2} L${x1 - 6} ${top - 2}`, FP, 0.8);
          } else {
            // 女儿墙压顶
            shapeP(k, rect(x0 - 2, top - 4, x1 + 2, top), FP * 1.4);
            if (b.roof === 'bill') {
              // 屋顶广告牌：两根支架顶一块牌子
              strokeP(k, `M${x0 + 12} ${top - 4} L${x0 + 12} ${top - 12} M${x1 - 12} ${top - 4} L${x1 - 12} ${top - 12}`, FP);
              shapeP(k, rect(x0 + 6, top - 30, x1 - 6, top - 12));
              k.fillStyle = C.ink; k.font = `600 12px ${JP}`; k.textAlign = 'center'; k.textBaseline = 'middle';
              k.fillText('新刊', (x0 + x1) / 2, top - 21);
            }
            if (b.roof === 'clock') {
              // 银行的钟楼：方塔顶一面圆钟
              const m = (x0 + x1) / 2;
              shapeP(k, rect(m - 12, top - 26, m + 12, top - 4));
              shapeP(k, `M${m - 14} ${top - 26} L${m} ${top - 38} L${m + 14} ${top - 26}Z`, FP * 1.4);
              shapeP(k, oval(m, top - 15, 7, 7), FP);
              strokeP(k, `M${m} ${top - 15} L${m} ${top - 20} M${m} ${top - 15} L${m + 4} ${top - 15}`, FP);
            }
          }
          // 楼上的窗：先填窗玻璃（夜里按阈值亮成暖黄），再描窗框和中棂
          b.wins.forEach(([a, y0, c, y1, thr]) => {
            if (c + dx < -4 || a + dx > CW + 4) return;
            const lit = winLit(u, thr);
            k.fillStyle = css(mc(P.paper, LITWIN, lit * 0.92)); k.fillRect(a + dx, y0, c - a, y1 - y0);
            strokeP(k, rect(a + dx, y0, c + dx, y1) + `M${a + dx} ${(y0 + y1) / 2} L${c + dx} ${(y0 + y1) / 2}`, FP);
          });
          // 一楼店面：遮阳篷、门洞、竖招牌（字用店名）
          const ay = HZ - 30;
          shapeP(k, `M${x0 + 3} ${ay - 4} L${x1 - 3} ${ay - 4} L${x1 - 1} ${ay + 4} L${x0 + 1} ${ay + 4}Z`, FP * 1.4);
          strokeP(k, rect(x0 + 6, ay + 6, x1 - 6, HZ), FP, 0.8);
          const sx = x0 + 9, len = b.sign.length;
          shapeP(k, rect(sx - 5, ay - 6 - 13 * len, sx + 5, ay - 6), FP);
          k.fillStyle = C.ink; k.font = `600 9px ${JP}`; k.textAlign = 'center'; k.textBaseline = 'middle';
          for (let c = 0; c < len; c++) k.fillText(b.sign[c], sx, ay - 12.5 - 13 * (len - 1 - c));
        });
      });
    }
    // 楼窗的光晕放在最后一层，单独画
    function midGlow(k, F, off) {
      const u = wrap(F.u);
      if (u < 2.8 || u > 5.85) return;
      tiles(off, MID_PER, dx => MID.forEach(b => b.wins.forEach(([a, y0, c, y1, thr]) => {
        const lit = winLit(u, thr), x = (a + c) / 2 + dx;
        if (x > -12 && x < CW + 12) radial(k, x, (y0 + y1) / 2, 10, WARMGLOW, lit * 0.45);
      })));
    }

    // —— 近景：电线杆、架空线、电车站、路面 ——
    // 一份宽 DIST，正好是电车一周期走过的路，所以电车站一周期只经过一次
    const WIRE = 34;                 // 架空线在电线杆处的高度
    const POLES = [80, 80 + DIST / 2]; // 一份里的两根电线杆（相距 480）
    const SAG = 5;                   // 两杆之间架空线下垂
    // 架空线在画面 x 处的高度：杆处最高，两杆中点下垂 SAG
    const wireY = (x, off) => {
      const span = DIST / POLES.length, s = wrap(x + off - POLES[0], span) / span;
      return WIRE + SAG * 4 * s * (1 - s);
    };
    function wires(k, off) {
      let d = '';
      for (let x = -4; x <= CW + 4; x += 6) d += (x > -4 ? 'L' : 'M') + x + ' ' + wireY(x, off).toFixed(2);
      strokeP(k, d, FP * 1.5);
      // 上面一根馈电线，淡一点
      let e = '';
      for (let x = -4; x <= CW + 4; x += 6) e += (x > -4 ? 'L' : 'M') + x + ' ' + (wireY(x, off) - 12 + SAG * 0.4).toFixed(2);
      strokeP(k, e, FP, 0.55);
    }
    function poles(k, F, off, lamps) {
      tiles(off, DIST, dx => POLES.forEach(px => {
        const x = px + dx;
        if (x < -20 || x > CW + 20) return;
        // 木杆立在对面人行道上，顶上横担挂着绝缘子和架空线，杆身中段挂一盏路灯
        shapeP(k, `M${x - 2.4} ${HZ + 6} L${x - 1.6} ${WIRE - 22} L${x + 1.6} ${WIRE - 22} L${x + 2.4} ${HZ + 6}Z`, SP);
        shapeP(k, rect(x - 9, WIRE - 16, x + 9, WIRE - 13), FP);
        strokeP(k, `M${x} ${WIRE - 13} L${x} ${WIRE} M${x - 6} ${WIRE - 13} L${x - 6} ${WIRE - 10}`, FP);
        shapeP(k, oval(x, WIRE - 1, 1.8, 1.8), FP);
        strokeP(k, `M${x} 70 Q${x + 10} 64 ${x + 16} 70`, FP * 1.4);
        shapeP(k, `M${x + 11} ${70} L${x + 21} ${70} L${x + 19} ${75} L${x + 13} ${75}Z`, FP);
        lamps.push([x + 16, 75]);
      }));
    }
    function road(k, F, off) {
      const { P } = F;
      // 路面铺纸色，对面人行道略深一点
      k.fillStyle = C.paper; k.fillRect(-2, HZ, CW + 4, CH - HZ + 2);
      k.fillStyle = css(mc(P.paper, P.ink, 0.04)); k.fillRect(-2, HZ, CW + 4, 8);
      strokeP(k, `M-2 ${HZ + 8} L${CW + 2} ${HZ + 8}`, SP);
      // 路面的石块：几排固定位置的短线，跟近景一起走
      tiles(off, DIST, dx => {
        let d = '';
        for (let r = 0; r < 5; r++) {
          const y = 164 + r * 7 + (r > 2 ? 9 : 0);
          for (let i = 0; i < 26; i++) {
            const x = dx + i * (DIST / 26) + rnd(r, i) * 14 - r * 5;
            if (x > -20 && x < CW + 20) d += `M${x.toFixed(1)} ${y} L${(x + 6 + rnd(i, r + 9) * 8).toFixed(1)} ${y}`;
          }
        }
        strokeP(k, d, FP, 0.45);
      }, 30);
      // 远轨在车下，近轨两道（轨头和轨腰），接缝每 DIST/12 一处
      strokeP(k, `M-2 179 L${CW + 2} 179`, FP, 0.7);
      strokeP(k, `M-2 186 L${CW + 2} 186 M-2 188.4 L${CW + 2} 188.4`, SP);
      tiles(off, DIST / 12, dx => strokeP(k, `M${dx} 186 L${dx} 188.4`, FP), 4);
      // 近处路缘和人行道
      strokeP(k, `M-2 202 L${CW + 2} 202`, SP);
    }

    // —— 电车站 ——
    // 近侧路边一座低矮的安全岛站台：红色圆站牌、长椅和顶棚。电车停住时车门正对站台中间。
    // 站台只此一座：周期开头在画面右边外，停车时在车门前，周期结尾在左边外，循环接得上
    const TRAM = { x0: 118, x1: 432, top: 88, bot: 174, win0: 98, win1: 138 };
    const DOORS = [[156, 182], [356, 382]];
    const STOP_OFF = V0 * G(BRAKE[1]);                           // 停站时近景的偏移
    const STOP_W = (DOORS[0][0] + DOORS[1][1]) / 2 + STOP_OFF;  // 站台中心在世界里的位置
    function station(k, F, off) {
      // 站台按近景的重复宽度 DIST 重复，周期首尾那一份都在画面外
      tiles(off - STOP_W + 200, DIST, x0 => stationAt(k, x0, x0 + 400), 40);
    }
    function stationAt(k, x0, x1) {
      // 站台：顶面一条、前沿一条，几道铺石缝
      shapeP(k, rect(x0, 190, x1, 204));
      strokeP(k, `M${x0} 193 L${x1} 193`, FP);
      let d = '';
      for (let i = 1; i < 16; i++) d += `M${x0 + i * 25} 193 L${x0 + i * 25 - 2} 204`;
      strokeP(k, d, FP, 0.6);
      // 站牌：红色圆牌，写站名；立在车尾后面（停车时不挡车窗，也让开 x = 80 的电线杆）
      const sx = x0 + 32;
      shapeP(k, rect(sx - 1.2, 132, sx + 1.2, 190), FP);
      shapeP(k, oval(sx, 128, 10, 10), SP, C.red);
      k.fillStyle = C.paper; k.font = `600 9px ${JP}`; k.textAlign = 'center'; k.textBaseline = 'middle';
      k.fillText('停', sx, 128.5);
      shapeP(k, rect(sx - 9, 141, sx + 9, 152), FP);
      k.fillStyle = C.ink; k.font = `600 7px ${JP}`;
      k.fillText('本町', sx, 146.8);
      // 右端一张长椅，在车头前面
      const bx = x1 - 14;
      shapeP(k, rect(bx - 14, 176, bx + 14, 179), FP * 1.4);
      strokeP(k, `M${bx - 11} 179 L${bx - 11} 190 M${bx + 11} 179 L${bx + 11} 190 M${bx - 14} 170 L${bx + 14} 170 M${bx - 12} 170 L${bx - 12} 176 M${bx + 12} 170 L${bx + 12} 176`, FP * 1.4);
    }

    // —— 电车 ——
    // 侧面立面图：拱形车顶、一排车窗、两扇折门，车窗下一条绿腰带；车头朝右（行进方向），车头灯和前窗上的行先牌。
    // 车轮 r = 6：一周期转过的角度 DIST/r 取成 4 根辐条间隔（π/2）的整数倍，循环时车轮花样接得上
    const WHEEL_R = DIST / (Math.round(DIST / 6 / (Math.PI / 2)) * (Math.PI / 2));
    const WHEELS = [150, 178, 372, 400];
    const SEATS = [[206, 0], [238, 1], [286, 2], [318, 3]];        // 坐着的乘客（x、样子）
    const STANDS = [[262, 0], [336, 1]];                         // 站着拉吊环的乘客
    const STRAPS = [200, 224, 248, 272, 296, 320, 344];
    const WINS = (() => {
      // 车窗按门分成三段，每段均分
      const segs = [[TRAM.x0 + 10, DOORS[0][0] - 4, 1], [DOORS[0][1] + 4, DOORS[1][0] - 4, 6], [DOORS[1][1] + 4, TRAM.x1 - 16, 1]], out = [];
      segs.forEach(([a, b, n]) => { const w = (b - a) / n; for (let i = 0; i < n; i++) out.push([a + i * w + 2, a + (i + 1) * w - 2]); });
      return out;
    })();
    // 车窗玻璃的形状（裁剪乘客用）
    const GLASS = (() => {
      let d = '';
      WINS.forEach(([a, b]) => { d += rect(a, TRAM.win0, b, TRAM.win1); });
      DOORS.forEach(([a, b]) => { d += rect(a + 3, TRAM.win0, b - 3, TRAM.win1); });
      return d;
    })();
    // 乘客：头加肩膀，不画脸；样子 0–3 分别是礼帽、短发、发髻、鸭舌帽。a 是绕脚（车厢地板）的倾角
    function rider(k, x, footY, a, look, F, lit) {
      const S = c => rot(c, [x, footY], a);
      const head = S([x, footY - 46]), neck = S([x, footY - 39]), sh = S([x, footY - 36]);
      const col = lit > 0.02 ? css(mc(F.P.paper, SIL, lit * 0.85)) : C.paper;
      // 肩膀和上身：一个纸色（夜里亮窗前是深褐剪影）的梯形
      const L = S([x - 8, footY - 34]), R = S([x + 8, footY - 34]), LB = S([x - 10, footY - 14]), RB = S([x + 10, footY - 14]);
      shapeP(k, `M${pt(LB)} L${pt(L)} Q${pt(neck)} ${pt(S([x, footY - 37]))} ${pt(R)} L${pt(RB)}Z`, FP * 1.4, col);
      k.save(); k.translate(head[0], head[1]); k.rotate(a);
      shapeP(k, oval(0, 0, 3.8, 4.8), FP * 1.4, col);
      k.fillStyle = C.ink;
      if (look === 0) k.fill(new Path2D('M-6 -3 L6 -3 Q4 -4.4 3.8 -7.4 Q0 -10 -3.8 -7.4 Q-4 -4.4 -6 -3Z'));
      else if (look === 1) k.fill(new Path2D('M-3.9 -0.6 Q-4.4 -5.4 0 -5.2 Q4.4 -5.4 3.9 -0.6 Q2.4 -3.4 -3.9 -0.6Z'));
      else if (look === 2) { k.fill(new Path2D('M-3.9 0 Q-4.4 -5.4 0 -5.2 Q4.4 -5.4 3.9 0 Q1 -3.6 -3.9 0Z')); k.beginPath(); k.arc(-3.2, -4.6, 2.4, 0, TAU); k.fill(); }
      else k.fill(new Path2D('M-4 -1.4 Q-4 -5.8 0.4 -5.6 Q4 -5.4 4 -2.2 L7.4 -1.6 L7 -0.6 L-4 -0.8Z'));
      k.restore();
      return { sh };
    }
    function tram(k, F, st) {
      const { P } = F, b = st.bob, T = TRAM;
      k.save(); k.translate(0, b);
      // 车顶：拱顶加一条通风顶
      shapeP(k, `M${T.x0} ${T.top} Q${T.x0 + 4} ${T.top - 8} ${T.x0 + 20} ${T.top - 8} L${T.x1 - 20} ${T.top - 8} Q${T.x1 - 4} ${T.top - 8} ${T.x1} ${T.top}Z`);
      shapeP(k, rect(T.x0 + 70, T.top - 12, T.x1 - 70, T.top - 8), FP);
      // 车身
      shapeP(k, `M${T.x0} ${T.top} L${T.x1} ${T.top} Q${T.x1 + 8} ${T.top + 30} ${T.x1 + 6} ${T.bot} L${T.x0 - 2} ${T.bot} Q${T.x0 - 4} ${T.top + 30} ${T.x0} ${T.top}Z`);
      // 车窗：先填玻璃（白天淡灰、天黑后暖黄），乘客画在玻璃里，再描窗框
      const lit = st.lit;
      k.fillStyle = css(mc(mc(P.paper, hx('#dfe4e2'), 0.5), LITWIN, lit * 0.95));
      k.fill(path(GLASS));
      k.save(); k.clip(path(GLASS));
      const tilt = st.sway;
      // 吊环：挂在车顶的扶杆上，按钟摆朝刹车方向甩
      strokeP(k, `M${T.x0 + 40} ${T.win0 + 3} L${T.x1 - 40} ${T.win0 + 3}`, FP);
      STRAPS.forEach((x, i) => {
        const a = tilt[2] * (1 + 0.08 * (i % 3)), e = rot([x, T.win0 + 14], [x, T.win0 + 3], -a);
        strokeP(k, `M${x} ${T.win0 + 3} L${pt(e)}`, FP);
        strokeP(k, oval(e[0], e[1] + 2.4, 2.4, 2.4), FP);
      });
      SEATS.forEach(([x, look], i) => rider(k, x + 40 * tilt[3] * (1 + 0.15 * i), 168, 0.02 * Math.sin(i), look, F, lit));
      STANDS.forEach(([x, look], i) => {
        const a = tilt[i];
        const r = rider(k, x, 156, a, look, F, lit);
        // 拉着吊环的那只手：从肩膀伸到头顶的吊环
        const ring = rot([x + 4, T.win0 + 16], [x + 4, T.win0 + 3], -tilt[2]);
        strokeP(k, `M${pt(r.sh)} Q${x + 8} ${T.win0 + 28} ${pt(ring)}`, SP * 1.6);
      });
      k.restore();
      let d = '';
      WINS.forEach(([a, c]) => { d += rect(a, T.win0, c, T.win1) + `M${a} ${T.win0 + 12} L${c} ${T.win0 + 12}`; });
      strokeP(k, d, FP * 1.4);
      // 折门：停站时两扇门板向两边收拢
      DOORS.forEach(([a, c]) => {
        const o = st.door * 9, m = (a + c) / 2;
        strokeP(k, rect(a, T.win0 - 2, c, T.bot), SP);
        if (st.door > 0.01) {
          k.fillStyle = css(mc(P.paper, LITWIN, lit * 0.7)); k.fillRect(m - o, T.win1, 2 * o, T.bot - T.win1);
        }
        strokeP(k, rect(a + 3, T.win0, m - 1 - o, T.bot - 3) + rect(m + 1 + o, T.win0, c - 3, T.bot - 3), FP);
        strokeP(k, `M${a + 3} ${T.win1} L${m - 1 - o} ${T.win1} M${m + 1 + o} ${T.win1} L${c - 3} ${T.win1}`, FP);
      });
      // 腰带（绿）和车号
      const belt = s => `M${s[0]} 144 L${s[1]} 144 L${s[1]} 152 L${s[0]} 152Z`;
      [[T.x0 - 3, DOORS[0][0]], [DOORS[0][1], DOORS[1][0]], [DOORS[1][1], T.x1 + 7]].forEach(s => shapeP(k, belt(s), FP, C.green));
      k.fillStyle = C.paper; k.font = `600 7px ${JP}`; k.textAlign = 'center'; k.textBaseline = 'middle';
      k.fillText('103', 270, 148.5);
      strokeP(k, `M${T.x0 - 3} 166 L${T.x1 + 7} 166`, FP);
      // 车头：行先牌、车头灯
      shapeP(k, rect(T.x1 - 34, T.top + 1, T.x1 - 6, T.top + 9), FP);
      k.fillStyle = C.ink; k.font = `600 7px ${JP}`; k.fillText('駅前', T.x1 - 20, T.top + 5.4);
      shapeP(k, oval(T.x1 + 6, 158, 2.6, 3), FP, css(mc(P.paper, hx('#fff1c2'), st.head)));
      // 台车与车轮：轮子转，辐条按走过的路转动
      WHEELS.forEach(x => {
        const a = st.off / WHEEL_R;
        shapeP(k, oval(x, 180, WHEEL_R, WHEEL_R), SP);
        const c = Math.cos(a) * (WHEEL_R - 1.6), s = Math.sin(a) * (WHEEL_R - 1.6);
        strokeP(k, `M${x - c} ${180 - s} L${x + c} ${180 + s} M${x + s} ${180 - c} L${x - s} ${180 + c}`, FP);
      });
      shapeP(k, rect(140, 172, 188, 178) + rect(362, 172, 410, 178), FP);
      shapeP(k, rect(T.x0 - 4, T.bot, T.x1 + 8, T.bot + 3), FP);
      k.restore();
    }
    // 集电杆：根部铰在车顶后部，弹簧把它往上顶，杆头的滑轮贴着架空线走。架空线在两杆之间下垂，杆的角度跟着变
    const POLE_L = 66, POLE_B = [TRAM.x0 + 64, TRAM.top - 12];
    function trolley(k, F, st, off) {
      const base = [POLE_B[0], POLE_B[1] + st.bob];
      // 解杆头位置：杆头在架空线上，迭代三次就收敛（下垂很缓）
      let y = wireY(base[0] - 50, off), x = base[0];
      for (let i = 0; i < 3; i++) { const dy = base[1] - y; x = base[0] - Math.sqrt(Math.max(1, POLE_L * POLE_L - dy * dy)); y = wireY(x, off); }
      const tip = [x, y + 1.6];
      shapeP(k, rect(base[0] - 6, base[1] - 3, base[0] + 6, base[1]), FP);
      strokeP(k, `M${pt(base)} L${pt(tip)}`, SP * 1.3);
      // 拉绳从杆头垂到车尾
      strokeP(k, `M${pt(tip)} Q${tip[0] - 4} ${tip[1] + 40} ${TRAM.x0 + 2} ${TRAM.top + 4 + st.bob}`, FP, 0.7);
      shapeP(k, oval(tip[0], tip[1], 2, 2), FP);
      return tip;
    }

    // 车厢灯：停站后天快黑时打开（开灯时闪一下），天亮时关掉；车头灯同一时刻开关
    const roomOn = u => smooth(2.9, 2.96, u) * (1 - 0.8 * smooth(2.99, 3.01, u) * smooth(3.07, 3.05, u)) * smooth(5.88, 5.78, u);
    // 停站时开门：停稳 0.2 秒后开，起步前 0.2 秒关
    const doorAt = u => smooth(BRAKE[1] + 0.2, BRAKE[1] + 0.5, u) * smooth(START[0] - 0.2, START[0] - 0.5, u);
    // 车身随轨缝一跳一跳：每过一道轨缝前后两个轮轴各压一下，跳动随车速减小，停住时不动
    const JOINT = DIST / 12;
    const bobAt = (off, g) => {
      const p = wrap(off, JOINT) / JOINT, q = wrap(off + 28, JOINT) / JOINT;
      return 0.7 * g * (Math.exp(-Math.pow((p - 0.5) * 14, 2)) + Math.exp(-Math.pow((q - 0.5) * 14, 2)));
    };

    CELLS[9] = (k, w, h, u) => {
      const tau = wrap(tauAt(u), 1), P = palette(tau);
      const F = { u, tau, P };
      C = { paper: css(P.paper), ink: css(P.ink), green: css(nightTint(GREEN, P.inkT)), red: css(mc(RED, RED_NIGHT, P.inkT)) };
      const off = offAt(u), g = gAt(wrap(u)), on = roomOn(wrap(u));
      const st = {
        off, sway: sway(u), door: doorAt(wrap(u)), bob: bobAt(off, g),
        lit: on * (0.45 + 0.55 * P.lamp), head: on,
      };
      k.save();
      k.lineCap = 'round'; k.lineJoin = 'round';
      sky(k, F);
      farTown(k, off * LAYER.far);
      midTown(k, F, off * LAYER.mid);
      const lamps = [];
      poles(k, F, off, lamps);
      wires(k, off);
      road(k, F, off);
      trolley(k, F, st, off);
      tram(k, F, st);
      station(k, F, off);
      // —— 光（都画在最上面，同原作的 glow 层）——
      midGlow(k, F, off * LAYER.mid);
      const sl = smooth(0.25, 0.5, P.lamp);
      lamps.forEach(([x, y]) => {
        // 路灯：灯罩下一个上浓下淡的暖色光锥（同 #4-100），加灯口光晕
        if (sl > 0.01) {
          const gc = k.createLinearGradient(0, y, 0, HZ + 6);
          gc.addColorStop(0, `rgba(${WARM},0.5)`); gc.addColorStop(1, `rgba(${WARM},0.04)`);
          k.globalAlpha = sl * 0.7; k.fillStyle = gc; k.fill(new Path2D(`M${x - 4} ${y} L${x + 4} ${y} L${x + 20} ${HZ + 6} L${x - 20} ${HZ + 6}Z`)); k.globalAlpha = 1;
        }
        radial(k, x, y, 16, WARMGLOW, sl * 0.8);
      });
      // 车窗往外透的光：车身周围一圈很淡的暖光，车头灯在前面路上照出一小片
      if (st.lit > 0.01) {
        k.save(); k.translate(275, 118 + st.bob); k.scale(170, 34); radial(k, 0, 0, 1, WARMGLOW, st.lit * 0.35 * P.lamp); k.restore();
        radial(k, TRAM.x1 + 7, 158 + st.bob, 18, WARMGLOW, st.head * (0.4 + 0.6 * P.lamp));
        k.save(); k.translate(TRAM.x1 + 40, 186); k.scale(36, 5); radial(k, 0, 0, 1, WARMGLOW, st.head * P.lamp * 0.6); k.restore();
      }
      k.restore();
    };
  }

  // @element 11
  // 山间瀑布：原作没有山水场景，这里按原作的画法（细墨线、纸色遮挡、远景淡墨、一两处平涂色）新编一幅：淡墨远山三层、勾云成团飘过、山腰一层云海，
  // 清晨的雾在前 2.8 秒散去；瀑布是一组沿竖向循环下移的墨线，潭面一圈圈涟漪、水花和水烟；背着柴篓、戴斗笠的行人从瀑布后面的山路走出来，
  // 沿岩架走出画面右边（原作 gait.ts 的步态）。远山淡墨、涟漪、水纹、水烟照原作 sky.ts、canal.ts、critters.ts 的画法与参数。
  {
    // 主线约 1 px，与 #4-100、#4-101 一致；细节线（皴纹、水纹、草）按原作 0.4–0.6 倍
    const SP = 1.0, FP = 0.55;
    const W11 = TAU / CYC;                            // 一周期一圈的角速度，周期性小动作都取它的整数倍
    const R = (i, j, a, b) => a + rnd(i, j) * (b - a);   // 原作 srnd 的固定种子版
    const STRAW = '#e6cf8e', SASH = '#b3412d';        // 原作孩子草帽的麦秆色、原作的红；全幅只有这两处平涂
    // 原作运河水面：mix(paper, #bfd0d8, 0.32)
    const WATER_FILL = css(mc(hx('#fdfcf8'), hx('#bfd0d8'), 0.32));
    const PAPER_RGB = '253,252,248';
    const POOL_Y = 182;                               // 潭面
    const GY = 160;                                   // 岩架山路（行人脚下）

    // —— 晨雾 ——
    // 开头雾最浓，0.3–2.8 秒散去，白天只剩山脚一层薄霞；5.4–6.4 秒雾重新漫上来，接回开头
    const morning = u => 1 - smooth(0.3, 2.8, u) + smooth(5.4, 6.4, u);

    // —— 远山 ——
    // 三层山脊，越远越淡：原作远山用 0.42 的淡墨，这里最远一层再淡到 0.26、最近一层 0.65。
    // 每层先铺不透明纸色再描脊线，近的一层挡住远的一层的线，像原作纸色填充的遮挡
    const RIDGES = [
      { a: 0.26, pts: [[-6, 74], [30, 58], [62, 40], [84, 26], [104, 38], [136, 56], [170, 44], [204, 24], [222, 16], [246, 30], [280, 50], [316, 40], [352, 54], [400, 44], [450, 30], [545, 46]],
        tex: 'M70 44 q8 10 6 22 M92 34 q-4 12 2 24 M210 28 q6 12 2 26 M232 26 q-6 14 0 28 M300 46 q4 8 2 18' },
      { a: 0.42, pts: [[-6, 104], [26, 92], [58, 80], [92, 92], [128, 100], [162, 86], [196, 74], [226, 84], [262, 98], [300, 90], [336, 102], [380, 96], [545, 104]],
        tex: 'M50 86 q10 -4 22 -2 M170 84 q6 8 4 18 M196 80 q-4 10 2 20 M282 96 q14 -4 26 0' },
      { a: 0.65, pts: [[-6, 132], [28, 122], [66, 112], [104, 118], [146, 128], [190, 132], [236, 140], [282, 146], [330, 156], [360, 170]],
        tex: 'M60 118 q10 -3 20 0 M120 124 q4 6 2 14 M200 138 q12 -3 22 1 M250 146 q4 6 2 12' },
    ];
    // 折线顶点之间用二次曲线连起来（控制点是顶点、端点是相邻顶点的中点），山脊圆顺、不出尖角
    const ridgeD = pts => {
      let d = `M${pt(pts[0])}`;
      for (let i = 1; i < pts.length - 1; i++) d += ` Q${pt(pts[i])} ${(pts[i][0] + pts[i + 1][0]) / 2} ${(pts[i][1] + pts[i + 1][1]) / 2}`;
      return d + ` L${pt(pts[pts.length - 1])}`;
    };
    // 纸色胶囊（顺时针，与云瓣的圆同向，叠在一起填充不会留洞）：做勾云平的云底
    const capsule = (x0, y0, x1, y1) => { const r = (y1 - y0) / 2; return `M${x0 + r} ${y0} L${x1 - r} ${y0} A${r} ${r} 0 0 1 ${x1 - r} ${y1} L${x0 + r} ${y1} A${r} ${r} 0 0 1 ${x0 + r} ${y0}Z`; };
    // 雾带：纸色上下渐隐的一条横带，盖在一层山的山脚上，山脚就淡进雾里（原作只给天空和光用渐变，雾属于天空这一层）
    function mistBand(k, y0, y1, a, x0 = 0, x1 = CW) {
      if (a < 0.01) return;
      const g = k.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, `rgba(${PAPER_RGB},0)`); g.addColorStop(0.5, `rgba(${PAPER_RGB},1)`); g.addColorStop(1, `rgba(${PAPER_RGB},0)`);
      k.globalAlpha = clamp(a); k.fillStyle = g; k.fillRect(x0, y0, x1 - x0, y1 - y0); k.globalAlpha = 1;
    }


    // —— 石头的画法 ——
    // 山水画里的石头讲「石分三面」：轮廓是有棱角的折线，块面之间的转折线是明暗交界，背光的一面用短皴笔排出来，
    // 石脚、石顶点几个苔点。这里的石头（山崖、立石、潭石、路边石子）都用同一套：
    // 轮廓折线加小圆角、2–4 条转折线、背光面横向短皴（斧劈皴那种一笔一笔的短笔）、苔点。几何全在建块时算好，每帧只描
    const f2 = v => Math.round(v * 100) / 100;
    // 折线加小圆角：每个顶点前后各退 r，以顶点作控制点的二次曲线连起来，棱角还在、不扎眼
    function roundPoly(P, r = 1.6) {
      const n = P.length; let d = '';
      for (let i = 0; i < n; i++) {
        const a = P[(i + n - 1) % n], b = P[i], c = P[(i + 1) % n];
        const la = Math.hypot(a[0] - b[0], a[1] - b[1]), lc = Math.hypot(c[0] - b[0], c[1] - b[1]);
        const ra = Math.min(r, la / 2) / la, rc = Math.min(r, lc / 2) / lc;
        d += `${i ? 'L' : 'M'}${f2(b[0] + (a[0] - b[0]) * ra)} ${f2(b[1] + (a[1] - b[1]) * ra)}Q${f2(b[0])} ${f2(b[1])} ${f2(b[0] + (c[0] - b[0]) * rc)} ${f2(b[1] + (c[1] - b[1]) * rc)}`;
      }
      return d + 'Z';
    }
    // 背光面的皴笔：在多边形 P 里沿角度 ang 排平行扫描线，每条切成长短不一的短笔，偶尔空一笔。
    // 扫描线从起点一侧（明暗交界）排起，只伸到 reach 比例那么远，所以贴着转折线最密、往外渐稀；
    // 交界在右边时 ang 加 π 反过来排。扫描线与多边形求交，凹多边形也行
    function hatch(P, ang, gap, seed, o = {}) {
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const Q = P.map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca]);
      const ys = Q.map(q => q[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const back = (x, y) => `${f2(x * ca - y * sa)} ${f2(x * sa + y * ca)}`;
      let d = '';
      for (let y = y0 + gap * 0.6, row = 0; y < y1 - gap * 0.3; y += gap, row++) {
        const xs = [];
        for (let i = 0; i < Q.length; i++) {
          const a = Q[i], b = Q[(i + 1) % Q.length];
          if ((a[1] <= y) !== (b[1] <= y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
        }
        xs.sort((p, q) => p - q);
        for (let j = 0; j + 1 < xs.length; j += 2) {
          const xa = xs[j] + (o.inset ?? 1), xb = xs[j + 1] - (o.inset ?? 1);
          if (xb - xa < 1.2) continue;
          const reach = xa + (xb - xa) * R(row, seed + j, o.reach ?? 0.5, 1);
          let x = xa + R(row, seed + 7, 0, 1);
          for (let s = 0; x < reach; s++) {
            const id = row * 31 + s, x2 = Math.min(reach, x + R(id, seed + 1, o.min ?? 2, o.max ?? 4.6));
            if (rnd(id, seed + 2) > (o.skip ?? 0.2) && x2 - x > 0.7) {
              const yy = y + R(id, seed + 3, -0.3, 0.3);
              d += `M${back(x, yy)}L${back(x2, yy + R(id, seed + 5, -0.25, 0.35))}`;
            }
            x = x2 + R(id, seed + 4, 0.8, 2);
          }
        }
      }
      return d;
    }
    // 苔点：[x, y, 个数, 散开半宽]，一团里多数是小墨点，夹几笔短竖
    function mossArt(list, seed) {
      let dots = '', ticks = '';
      list.forEach(([x, y, n, sp = 3], i) => {
        for (let j = 0; j < n; j++) {
          const id = i * 17 + j, px = f2(x + R(id, seed, -sp, sp)), py = f2(y + R(id, seed + 1, -0.9, 0.6));
          if (rnd(id, seed + 2) < 0.3) ticks += `M${px} ${py}l${f2(R(id, seed + 3, -0.4, 0.4))} ${f2(-R(id, seed + 4, 1.2, 2.2))}`;
          else { const r = f2(R(id, seed + 5, 0.4, 0.75)); dots += `M${f2(px - r)} ${py}a${r} ${r} 0 1 0 ${f2(2 * r)} 0a${r} ${r} 0 1 0 ${f2(-2 * r)} 0`; }
        }
      });
      return { dots: new Path2D(dots), ticks: new Path2D(ticks) };
    }
    // 一块石头：pts 轮廓、facets 转折线（折线）、shade 背光面 [{p, a, g, seed, reach…}]、cun 亮面的几笔淡皴、moss 苔点
    function rockArt(o, seed) {
      return {
        body: new Path2D(roundPoly(o.pts, o.r ?? 1.6)),
        facets: new Path2D(o.facets.map(l => 'M' + l.map(pt).join('L')).join('')),
        shade: new Path2D((o.shade || []).map((s, i) => hatch(s.p, s.a ?? 0, s.g ?? 2.2, seed + i * 13, s)).join('')),
        cun: new Path2D(o.cun || ''),
        moss: mossArt(o.moss || [], seed + 90),
        w: o.w ?? SP, fw: o.fw ?? FP * 0.95,
      };
    }
    function drawRock(k, r) {
      k.fillStyle = PAPER; k.fill(r.body);
      k.globalAlpha = 0.72; pen(k, r.shade, FP * 0.75);
      k.globalAlpha = 0.6; pen(k, r.cun, FP * 0.7);
      k.globalAlpha = 1; pen(k, r.facets, r.fw); pen(k, r.body, r.w);
      k.fillStyle = INK; k.fill(r.moss.dots); pen(k, r.moss.ticks, FP * 0.8);
    }

    // —— 山崖 ——
    // 瀑布从右边山崖的豁口落下；崖左缘斜下到潭边，右边一直高到画面外。斧劈皴的崖面：竖向的大块面，几道横的岩层转折，
    // 朝右的面背光、排短皴，崖顶和岩层上点苔
    // 崖脚在山路转弯处是一段竖直的石壁（x=CLIFF_X），行人走到这里绕到山后，被石壁挡住
    const CLIFF_X = 336;
    const CLIFF = rockArt({
      r: 1.4,
      pts: [[CLIFF_X, 186], [CLIFF_X, 104], [340, 96], [346, 88], [350, 78], [357, 70], [360, 60], [367, 52], [372, 42], [379, 36], [386, 30], [394, 28], [440, 28],
        [448, 22], [458, 19], [468, 17], [478, 15], [490, 12], [502, 12], [512, 10], [524, 9], [534, 7], [545, 4], [545, 186]],
      facets: [
        [[350, 80], [355, 98], [351, 118], [356, 140], [353, 162], [357, 182]],
        [[372, 42], [377, 60], [372, 82], [379, 106], [374, 128], [380, 152], [377, 182]],
        [[CLIFF_X, 128], [344, 125], [351, 127]], [[355, 98], [364, 95], [376, 97]], [[356, 140], [366, 137], [377, 140]], [[CLIFF_X, 160], [347, 157], [353, 160]],
        [[462, 18], [466, 40], [462, 62], [468, 90], [464, 118], [470, 150], [466, 182]],
        [[502, 12], [498, 34], [504, 58], [500, 84], [506, 112], [502, 140], [508, 182]],
        [[440, 56], [452, 52], [464, 55]], [[468, 90], [484, 86], [501, 88]], [[464, 118], [478, 122], [490, 118], [505, 121]],
        [[470, 150], [486, 146], [503, 148]], [[504, 58], [522, 55], [539, 58]], [[506, 112], [522, 108], [539, 111]],
      ],
      shade: [
        { p: [[355, 98], [351, 118], [356, 140], [353, 162], [357, 182], [377, 182], [380, 152], [374, 128], [379, 106], [372, 82], [364, 95]], a: 0.18, reach: 0.35 },
        { p: [[466, 40], [480, 36], [498, 34], [504, 58], [500, 84], [506, 112], [502, 140], [508, 182], [466, 182], [470, 150], [464, 118], [468, 90], [462, 62]], a: 0.18, g: 2.4, reach: 0.25 },
        { p: [[440, 56], [452, 52], [464, 55], [462, 62], [450, 60], [442, 61]], a: 0.1, g: 1.6, reach: 0.6 },
      ],
      cun: 'M344 112 q-3 10 -1 20 M362 70 q-3 8 -2 16 M486 40 q-3 14 1 30 M520 70 q-4 16 0 32 M524 130 q-3 12 1 24 M446 100 q-2 12 1 24 M446 140 q-2 10 1 20 M388 120 q-2 12 1 22 M530 20 q-3 10 0 22',
      moss: [[452, 23, 4], [488, 15, 5], [516, 12, 4], [368, 50, 3, 2], [358, 72, 3, 2], [346, 124, 3, 2.5], [484, 85, 4], [522, 54, 4], [488, 145, 4], [522, 107, 3]],
    }, 700);
    // 豁口两侧各一块凸出的岩石，压住瀑布顶的两角，看得出水是从石缝里冲出来的
    const LIPS = [
      rockArt({ r: 1, pts: [[378, 35], [379, 30], [383, 26], [388, 24], [393, 24.5], [397, 27], [400, 32], [395, 35.5], [387, 36.5]], facets: [[[388, 24], [389, 30], [387, 36.5]]],
        shade: [{ p: [[389, 30], [393, 24.5], [397, 27], [400, 32], [395, 35.5], [387, 36.5]], g: 1.5, reach: 0.6 }], moss: [[384, 25.5, 3, 2]] }, 760),
      rockArt({ r: 1, pts: [[432, 33], [433, 28], [437, 23.5], [443, 22], [449, 23], [453, 27], [452, 32], [446, 35], [438, 35.5]], facets: [[[443, 22], [445, 29], [446, 35]]],
        shade: [{ p: [[445, 29], [443, 22], [449, 23], [453, 27], [452, 32], [446, 35]], g: 1.5, reach: 0.7 }], moss: [[447, 22.4, 3, 2.5]] }, 780),
    ];
    // 崖顶的草丛：几笔短竖线，远看是草木
    const TUFTS = [[452, 21], [470, 17], [498, 12], [520, 9], [372, 52], [360, 80]];
    function cliff(k) {
      drawRock(k, CLIFF);
      TUFTS.forEach(([x, y], i) => pen(k, `M${x - 3} ${y} l-1 -4 M${x} ${y - 0.5} l0 -5.5 M${x + 3} ${y} l1.4 -4 M${x + 1.5} ${y} l0.6 -3`, FP * (i < 4 ? 1 : 0.8)));
      LIPS.forEach(r => drawRock(k, r));
    }

    // —— 云 ——
    // 勾云：一团云由几个大小不一的圆弧瓣叠成，纸色填满、墨线只勾外轮廓；瓣里画长短不一的卷涡，团的后侧拖出渐细的云尾，尾梢回卷。
    // 远层云小、扁、淡、线细，近层大而清楚。云团本身的纸色挡住后面的山脊，水墨山水里云遮山腰就是这样留白的。
    // 原作 sky.ts 的横云每秒只漂 1.2–2.6 单位，一个周期不到 17 px，看不出在动；这里每层做成一条横向周期为 P 的云带，
    // 一个周期正好往右平移 P（远层 108、近层 216、山脚云海 135），首尾无缝，不用淡入淡出。
    // 团的大小、高低、每个瓣的半径取决于它此刻的横坐标（两道慢正弦叠成的平滑起伏），所以云一边走一边慢慢变形，
    // 不会每隔 P 重复一个一模一样的团；平移 P 后每个位置上的团又是原来的样子，循环照样接得上
    const nz = (x, s) => 0.5 + 0.3 * Math.sin(x * 0.0363 + s * 1.7) + 0.2 * Math.sin(x * 0.0871 + s * 4.1);
    // 云的几何每帧都在变，直接往 Path2D 里加线段，省掉拼字符串再解析（这一层每帧有几十团）
    const circ = (P, x, y, r) => { P.moveTo(x + r, y); P.arc(x, y, r, 0, TAU); };
    // 卷涡：以 (cx, cy) 为心，从半径 r0、角 a0 起转 sweep 弧度，半径缩到 r0·kEnd；dir 取 ±1 定旋向
    function spiral(Q, cx, cy, r0, a0, sweep, kEnd, dir) {
      for (let i = 0; i <= 12; i++) {
        const t = i / 12, a = a0 + dir * sweep * t, r = r0 * mix(1, kEnd, t), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.85;
        if (i) Q.lineTo(x, y); else Q.moveTo(x, y);
      }
    }
    // 云尾：从 (x0, y0) 往 dir 的反方向拖出 len 长，中段略垂，梢头随 sway 上下摆，最后往上回卷一个小钩；
    // 画成一条从 w 收到 0.25w 的细长墨块，所以是渐细的
    function tail(T, x0, y0, len, dir, sway, w) {
      const P = [];
      for (let i = 0; i <= 14; i++) { const t = i / 14; P.push([x0 - dir * len * t, y0 + len * 0.05 * Math.sin(Math.PI * t) + sway * t * t]); }
      const [ex, ey] = P[14], rh = clamp(len * 0.08, 1.6, 3.2);
      // 尾梢顺着来势往上卷：钩的圆心在末点正上方，从圆的最低点起转 1.4π，半径缩一半
      for (let i = 1; i <= 8; i++) {
        const s = (i / 8) * 1.4 * Math.PI, r = rh * mix(1, 0.5, i / 8), a = Math.PI / 2 + dir * s;
        P.push([ex + Math.cos(a) * r, ey - rh + Math.sin(a) * r]);
      }
      const n = P.length, B = [];
      for (let i = 0; i < n; i++) {
        const p = P[Math.max(0, i - 1)], q = P[Math.min(n - 1, i + 1)];
        const dx = q[0] - p[0], dy = q[1] - p[1], m = Math.hypot(dx, dy) || 1, hw = w * 0.5 * mix(1, 0.25, i / (n - 1));
        const ax = P[i][0] - dy / m * hw, ay = P[i][1] + dx / m * hw;
        if (i) T.lineTo(ax, ay); else T.moveTo(ax, ay);
        B.push(P[i][0] + dy / m * hw, P[i][1] - dx / m * hw);
      }
      for (let i = B.length - 2; i >= 0; i -= 2) T.lineTo(B[i], B[i + 1]);
      T.closePath();
    }
    // ridge：插在第几层山前；D 是团距，P = 整数个 D；W、H 是团的基准宽高，a、w 是墨色浓淡和线宽
    // 崖顶在 x≈394 以右已高过两层云，云走到那里被崖挡住，不必再画
    const CLOUD_X1 = 400;
    const CLOUD_LAYERS = [
      { ridge: 0, P: 108, D: 54, y: 48, W: 44, H: 8, lobes: 5, a: 0.6, w: 0.6, tails: 2, seed: 1 },
      { ridge: 1, P: 216, D: 72, y: 76, W: 64, H: 13, lobes: 7, a: 0.85, w: 0.8, tails: 3, seed: 2 },
    ];
    // 一团云在横坐标 x 处的样子：底下一条扁胶囊做平的云底（绘卷里霞的下沿），上面一排瓣中间大两边小
    function clump(L, x, u, out, curls, tails) {
      const s = L.seed, g = mix(0.55, 1.15, nz(x, s));
      const W = L.W * g, H = L.H * g, by = L.y + (nz(x, s + 3) - 0.5) * L.H * 0.8;
      out.addPath(new Path2D(capsule(x - W / 2, by - H * 0.32, x + W / 2, by + H * 0.18)));
      for (let i = 0; i < L.lobes; i++) {
        const t = (i + 0.5) / L.lobes, arch = Math.sin(Math.PI * t);
        // 每个瓣的半径轻轻呼吸，一个周期 2 或 3 次，相位跟着位置走
        const br = 1 + 0.07 * Math.sin((2 + i % 2) * W11 * u + x * 0.05 + i * 1.9);
        const r = H * (0.32 + 0.38 * arch) * mix(0.6, 1.25, nz(x + i * 17, s + 5 + i)) * br;
        const lx = x + (t - 0.5) * W * 0.9, ly = by - H * 0.15 - arch * H * 0.45 - r * 0.25;
        circ(out, lx, ly, r);
        // 卷涡只画在一半的瓣上（哪几个瓣按层固定），长短随位置变：左半边从左下起顺时针卷进去，右半边反过来
        if ((i + s) % 2 === 0) {
          const left = t < 0.5, sweep = mix(0.9, 1.8, nz(x + i * 31, s + 9)) * Math.PI;
          spiral(curls, lx + (left ? 1 : -1) * r * 0.1, ly + r * 0.1, r * 0.7, left ? 0.9 * Math.PI : 0.1 * Math.PI, sweep, 0.25, left ? 1 : -1);
        }
      }
      for (let m = 0; m < L.tails; m++) {
        const len = W * mix(0.3, 1.0, nz(x + m * 23, s + 11)) * (1 - 0.22 * m);
        const sway = H * 0.3 * Math.sin((1 + m % 2) * W11 * u + x * 0.03 + m * 2.1);
        tail(tails, x - W / 2 + 1, by - H * 0.08 + m * H * 0.16, len, 1, sway, L.w * 1.3);
      }
    }
    function cloudLayer(k, u, ridge) {
      CLOUD_LAYERS.forEach(L => {
        if (L.ridge !== ridge) return;
        const sh = L.P * u / CYC, j0 = Math.floor((-L.W * 2 - sh) / L.D), j1 = Math.ceil((CLOUD_X1 + L.W - sh) / L.D);
        // 一层的所有团拼进同一组路径，四次画完：先填云尾，再用两倍线宽描所有瓣、纸色填满——
        // 瓣内、团与团相叠处的半截线和伸进别的团里的云尾都被纸色盖掉，只剩整条云带的外轮廓和露在外面的尾巴
        const out = new Path2D(), curls = new Path2D(), tails = new Path2D();
        for (let j = j0; j <= j1; j++) clump(L, j * L.D + sh, u, out, curls, tails);
        k.globalAlpha = L.a; k.fillStyle = INK; k.fill(tails);
        k.lineWidth = L.w * 2; k.strokeStyle = INK; k.lineJoin = 'round'; k.stroke(out);
        k.globalAlpha = 1; k.fillStyle = PAPER; k.fill(out);
        k.globalAlpha = L.a; pen(k, curls, L.w * 0.85);
      });
      k.globalAlpha = 1;
    }
    // 山脚云海：贴着中间一层山的山脚，一排连着的圆瓣做上沿，下面一整片纸色；瓣里偶尔一个卷涡，
    // 下面几道断开的横线是流动的霞。一个周期往右平移 135（6 个瓣距），比近层云慢
    const SEA = { P: 135, step: 22.5, y: 102, a: 0.6, w: 0.65 };
    function cloudSea(k, u) {
      const sh = SEA.P * u / CYC, j0 = Math.floor((-30 - sh) / SEA.step), j1 = Math.ceil((CLIFF_X + 30 - sh) / SEA.step);
      const out = new Path2D(), curls = [];
      for (let j = j0; j <= j1; j++) {
        const x = j * SEA.step + sh, n = nz(x, 21);
        const r = (7 + 7 * n) * (1 + 0.06 * Math.sin(3 * W11 * u + x * 0.07));
        const y = SEA.y + 3 * Math.sin(x * 0.021) - r * 0.3;
        circ(out, x, y, r);
        // 卷涡的浓淡随位置渐变（n 越过 0.45 才慢慢显出），走着走着出现、消失，不会突然跳出来
        const ca = smooth(0.45, 0.6, n);
        if (ca > 0.01) { const Q = new Path2D(); spiral(Q, x - r * 0.1, y + r * 0.15, r * 0.6, 0.9 * Math.PI, mix(1.0, 1.7, n) * Math.PI, 0.3, 1); curls.push([ca, Q]); }
      }
      const fill = new Path2D(out); fill.rect(-40, SEA.y, CW + 80, 24);
      k.globalAlpha = SEA.a; k.lineWidth = SEA.w * 2; k.strokeStyle = INK; k.lineJoin = 'round'; k.stroke(out);
      k.globalAlpha = 1; k.fillStyle = PAPER; k.fill(fill);
      curls.forEach(([ca, d]) => { k.globalAlpha = SEA.a * ca; pen(k, d, SEA.w * 0.85); });
      // 霞的横线：三道，每道一个周期内是两段（段距 67.5 = P/2），跟云海一起走
      let lines = '';
      for (let m = 0; m < 3; m++) {
        const y = SEA.y + 7 + m * 4.5, len = 34 - m * 6, off = m * 23;
        for (let j = Math.floor((-80 - sh - off) / 67.5); j * 67.5 + sh + off < CLIFF_X + 20; j++) {
          const x = j * 67.5 + sh + off;
          lines += `M${f2(x)} ${f2(y)}Q${f2(x + len / 2)} ${f2(y - 1.2)} ${f2(x + len)} ${f2(y)}`;
        }
      }
      k.globalAlpha = SEA.a * 0.7; pen(k, lines, SEA.w * 0.8);
      k.globalAlpha = 1;
    }

    // —— 瀑布 ——
    // 水从豁口 y=30 落到潭面，下面略宽。水柱先铺纸色挡住后面的皴纹，再画两条边线和 7 道竖向墨线。
    // 每道线是一串虚线段，沿竖向往下循环移动：段的排布在「下落参数 q ∈ [0,1]」上等距，q 匀速前进，
    // 画面高度 y = FALL0 + FALL_H·q·(0.45 + 0.55q)，越往下走得越快、线段拉得越长，看得出水在加速
    const FALL0 = 30, FALL_H = POOL_Y + 4 - FALL0;
    const fallY = q => FALL0 + FALL_H * q * (0.45 + 0.55 * q);
    const fallX = (f, y) => { const t = (y - FALL0) / FALL_H; return mix(401 - 5 * t, 431 + 6 * t, f); };
    // 每道线：横向位置 f、段的间距 per（q 单位）、实线占比 duty、浓淡 a、起始相位 ph。
    // 下落速度按 q 每秒约 0.8（整段约 1.25 秒落完）；每道线一个周期走过的段数取整，循环时线段首尾相接
    const LANES = Array.from({ length: 7 }, (_, i) => {
      const per = R(i, 31, 0.15, 0.24);
      return { f: (i + 0.5) / 7 + R(i, 32, -0.03, 0.03), per, duty: R(i, 33, 0.42, 0.7), a: R(i, 34, 0.55, 0.95), ph: rnd(i, 35), n: Math.round(0.8 * CYC / per) };
    });
    let FALL_SHAPE = null;
    function waterfall(k, u) {
      if (!FALL_SHAPE) {
        const L = [], Rr = [];
        for (let j = 0; j <= 12; j++) { const y = FALL0 + FALL_H * j / 12; L.push([fallX(0, y), y]); Rr.push([fallX(1, y), y]); }
        FALL_SHAPE = {
          body: new Path2D('M' + L.map(pt).join('L') + 'L' + Rr.slice().reverse().map(pt).join('L') + 'Z'),
          // 两条边线带一点固定的起伏，像水沿着石壁贴下去
          edges: new Path2D('M' + L.map(([x, y], j) => pt([x + (j % 2 ? 0.5 : -0.3), y])).join('L') + 'M' + Rr.map(([x, y], j) => pt([x + (j % 2 ? -0.4 : 0.4), y])).join('L')),
          // 豁口上沿水翻过石棱的弧线
          lip: new Path2D('M400 31 Q416 26.5 432 31 M404 34 Q410 32 415 33.4 M419 33 Q425 31.8 429 33.6'),
        };
      }
      k.fillStyle = PAPER; k.fill(FALL_SHAPE.body);
      pen(k, FALL_SHAPE.edges, SP * 0.9);
      LANES.forEach(l => {
        // q 方向的偏移：一个周期走 n 个间距
        const off = wrap(l.n * l.per * u / CYC + l.ph * l.per, l.per);
        let d = '';
        for (let q = off - l.per; q < 1; q += l.per) {
          const q0 = Math.max(0, q), q1 = Math.min(1, q + l.per * l.duty);
          if (q1 <= q0) continue;
          const y0 = fallY(q0), y1 = fallY(q1), ym = (y0 + y1) / 2;
          d += `M${fallX(l.f, y0)} ${y0} Q${fallX(l.f, ym) + 0.5 * Math.sin(ym * 0.08 + l.f * 9)} ${ym} ${fallX(l.f, y1)} ${y1}`;
        }
        k.globalAlpha = l.a; pen(k, d, FP * 1.1);
      });
      k.globalAlpha = 1;
      pen(k, FALL_SHAPE.lip, FP);
    }

    // —— 潭 ——
    const POOL = new Path2D(`M200 ${POOL_Y} L${CW + 2} ${POOL_Y} L${CW + 2} ${CH + 2} L200 ${CH + 2}Z`);
    const FX0 = 417;                                  // 落水点
    // 涟漪：原作 canal.ts ring() 的椭圆 rx=(2+12t)·big、ry=(0.6+2.2t)·big，1.6 秒淡完。
    // 落水点不停地出涟漪：每 0.4 秒一圈（一个周期 16 圈），放大 1.5；任一时刻同时有 4 圈在扩散
    const RING_LIFE = 1.6, RING_N = 16, RING_BIG = 1.5;
    // 潭面上零星的小涟漪（原作 big 0.6），水花落回水面的地方
    const SMALL_RINGS = [[0.6, 300, 194], [2.1, 470, 200], [3.3, 352, 199], [4.6, 508, 192], [5.5, 322, 203]];
    // 水纹：原作 canal.ts 每条 10–34 长、以 4–9 单位/秒漂；潭水从落水点往左流出，所以向左漂。
    // 照原速回绕不了整幅，照 #4-006 的办法每条只活一个周期、头尾 1/5 淡入淡出
    const LINE_FADE = 0.2;
    const PLINES = Array.from({ length: 16 }, (_, i) => ({
      x: R(i, 41, 230, 540), y: POOL_Y + 6 + (i % 4) * 5.4 + R(i, 42, -1.2, 1.2), len: R(i, 43, 10, 30), v: R(i, 44, 4, 9), ph: rnd(i, 45),
    }));
    // 潭里两块露出水面的石头（左边那块在岩架下沿前面）：同样分亮面、背光面，背光面横皴，水线上点苔
    const STONES = [
      rockArt({
        pts: [[273, 202.5], [274.5, 198], [277, 195], [281, 192.8], [286, 191.6], [291, 192.2], [296, 194.4], [299.5, 197.6], [302, 202.5]],
        facets: [[[286, 191.6], [289, 196], [287.5, 202.5]], [[277, 195], [282, 197], [289, 196]], [[289, 196], [295, 198.4], [299.5, 197.6]]],
        shade: [{ p: [[289, 196], [295, 198.4], [299.5, 197.6], [302, 202.5], [287.5, 202.5]], g: 1.4, min: 1.4, max: 3, reach: 0.85 }],
        moss: [[278, 201.6, 3, 2.5], [294, 201.8, 2, 1.5]],
      }, 860),
      rockArt({
        pts: [[487, 194.5], [488.5, 190.8], [491.5, 188], [496, 185.8], [501, 184.8], [506, 185.2], [511, 186.8], [515, 190], [518, 194.5]],
        facets: [[[501, 184.8], [503.5, 189], [502, 194.5]], [[491.5, 188], [497, 189.6], [503.5, 189]]],
        shade: [{ p: [[501, 184.8], [506, 185.2], [511, 186.8], [515, 190], [518, 194.5], [502, 194.5], [503.5, 189]], g: 1.4, min: 1.4, max: 3, reach: 0.8 }],
        moss: [[492, 193.6, 3, 2.5], [512, 193.8, 2, 1.5]],
      }, 880),
    ];
    // 水线处的两道短反光：石脚下的水面贴着一两笔断开的细横线，看得出石头站在水里
    const GLINTS = 'M269 204.4 L273.6 204.4 M277.4 204.8 L284 204.8 M294 204.6 L299.6 204.6 M288 206.6 L292.6 206.6 '
      + 'M483 196.4 L488 196.4 M492 196.8 L498 196.8 M509 196.6 L515.4 196.6 M502 198.6 L506 198.6';
    function pool(k, u) {
      k.fillStyle = WATER_FILL; k.fill(POOL);
      inkLine(k, 200, POOL_Y, CW + 2, POOL_Y, SP * 0.8, 21, 0.15);
      // 瀑布在水里的倒影：几道竖短线，长短随时间轻轻变（频率取整）
      for (let i = 0; i < 6; i++) {
        const x = fallX((i + 0.5) / 6, POOL_Y), len = 6 + 4 * Math.sin((3 + i) * W11 * u + i * 1.7);
        k.globalAlpha = 0.35; pen(k, `M${x} ${POOL_Y + 8} L${x + 0.4} ${POOL_Y + 8 + len}`, FP);
      }
      for (const l of PLINES) {
        const s = wrap(u / CYC + l.ph, 1), x = l.x - l.v * CYC * (s - 0.5);
        // 原作 sin(t·1.3 + x·0.04)·0.7 的上下浮动，时间频率取整成一个周期一次
        const y = l.y + Math.sin(W11 * u + x * 0.04) * 0.7;
        k.globalAlpha = smooth(0, LINE_FADE, s) * (1 - smooth(1 - LINE_FADE, 1, s)) * 0.9;
        pen(k, `M${x} ${y} Q${x + l.len / 2} ${y - 1.2} ${x + l.len} ${y}`, FP);
      }
      const ring = (x, y, t, big) => {
        k.globalAlpha = 1 - t / RING_LIFE;
        const e = new Path2D(); e.ellipse(x, y, (2 + t * 12) * big, (0.6 + t * 2.2) * big, 0, 0, TAU);
        pen(k, e, FP);
      };
      for (let j = 0; j < RING_N; j++) {
        const t = wrap(u - j * CYC / RING_N);
        if (t < RING_LIFE) ring(FX0 + R(j, 46, -5, 5), POOL_Y + 7, t, RING_BIG);
      }
      SMALL_RINGS.forEach(([t0, x, y]) => { const t = wrap(u - t0); if (t < RING_LIFE) ring(x, y, t, 0.6); });
      k.globalAlpha = 1;
      STONES.forEach(r => drawRock(k, r));
      // 石头脚下的水线和反光
      pen(k, 'M271 202.6 Q288 203.8 304 202.6 M485 194.6 Q503 195.8 520 194.6', FP);
      k.globalAlpha = 0.7; pen(k, GLINTS, FP * 0.7); k.globalAlpha = 1;
    }

    // 落水点的白沫：一圈起伏的纸色轮廓，起伏随时间滚动（频率取整）
    function foam(k, u) {
      const N = 28, P = [];
      for (let i = 0; i <= N; i++) {
        const a = Math.PI + Math.PI * i / N;               // 只画上半圈，下沿埋在潭面下
        const r = 1 + 0.16 * Math.sin(a * 7 + 5 * W11 * u) + 0.08 * Math.sin(a * 13 - 3 * W11 * u);
        P.push([FX0 + Math.cos(a) * 26 * r, POOL_Y + 3 + Math.sin(a) * 7 * r]);
      }
      shape(k, 'M' + P.map(pt).join('L') + 'Z', FP * 1.2);
    }
    // 水花：一组水珠按抛体从落水点溅起再落回，每颗按自己的周期反复（周期是 CYC 的整数分之一，循环接得上）。
    // 画法同 #4-006：沿速度方向拉长的小椭圆，纸色填充、细墨线
    const G = 220;
    const DROPS = Array.from({ length: 12 }, (_, i) => ({
      per: CYC / (7 + (i % 3)), ph: rnd(i, 51), x: FX0 + R(i, 52, -18, 18), vx: R(i, 53, -26, 26), vy: R(i, 54, 32, 58),
    }));
    function spray(k, u) {
      DROPS.forEach(d => {
        const t = wrap(u + d.ph * d.per, d.per), y = POOL_Y + 1 - d.vy * t + G * t * t / 2;
        if (y > POOL_Y + 2) return;
        const e = new Path2D(); e.ellipse(d.x + d.vx * t, y, 1.2, 0.7, Math.atan2(G * t - d.vy, d.vx), 0, TAU);
        shape(k, e, FP * 0.9);
      });
    }
    // 水烟：照原作 critters.ts 炊烟的画法（14 点起伏的圆、纵向压 0.8、越老越淡、半径每秒长 2.2），
    // 从落水点每 0.8 秒冒一团、往上飘、略向左散，3.2 秒散尽。出生时刻按周期等分，循环接得上
    const PUFFS = 8, PUFF_LIFE = 3.2;
    function spume(k, u) {
      for (let j = 0; j < PUFFS; j++) {
        const age = wrap(u - j * CYC / PUFFS);
        if (age > PUFF_LIFE) continue;
        const ph = R(j, 61, 0, 6), x = FX0 + R(j, 62, -14, 14) - 4 * age + Math.sin(age * 1.2 + ph) * 2, y = POOL_Y - 4 - 9 * age + 0.3 * age * age;
        const r = 5 + 2.2 * age * 1.4, P = [];
        for (let i = 0; i <= 14; i++) { const a = i / 14 * TAU, rr = r * (1 + 0.16 * Math.sin(a * 3 + ph + age)); P.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8]); }
        const a = Math.max(0, 0.9 - age / PUFF_LIFE * 0.9) * smooth(0, 0.25, age);
        const p = new Path2D('M' + P.map(pt).join('L') + 'Z');
        k.globalAlpha = a * 0.85; k.fillStyle = PAPER; k.fill(p);
        k.globalAlpha = a * 0.6; pen(k, p, FP * 0.8);
      }
      k.globalAlpha = 1;
    }

    // —— 山路、松、立石 ——
    // 山路是崖前一道岩架，路面 y=GY；左边地面往上坡收到画面外。路面下是岩架的立面，下沿没进潭里
    const GROUND = `M-4 140 Q40 134 88 142 Q140 152 180 ${GY} L${CLIFF_X + 6} ${GY} L${CLIFF_X + 6} 190 L262 190 Q232 192 214 200 Q204 206 200 212 L-4 212Z`;
    const LEDGE = 'M190 166 q30 -2 56 1 M262 172 q26 -2 50 1 M200 180 q22 -3 40 -1 M286 182 q18 -2 34 0 M120 160 q14 4 22 12 M60 150 q16 2 28 8 M30 176 q18 -4 34 -2';
    // 路边的小石子：也按「石分三面」画，只是小，一道转折线、背光面两三笔短皴、一个苔点
    const pebble = (x, y, r, i) => rockArt({
      r: 0.5, w: FP * 1.3, fw: FP * 0.8,
      pts: [[x - r, y], [x - r * 0.9, y - r * 0.55], [x - r * 0.4, y - r * 1.05], [x + r * 0.3, y - r * 1.15], [x + r * 0.85, y - r * 0.6], [x + r, y]],
      facets: [[[x + r * 0.3, y - r * 1.15], [x + r * 0.1, y - r * 0.5], [x + r * 0.2, y]]],
      shade: [{ p: [[x + r * 0.1, y - r * 0.5], [x + r * 0.3, y - r * 1.15], [x + r * 0.85, y - r * 0.6], [x + r, y], [x + r * 0.2, y]], g: 0.9, min: 0.8, max: 1.8, inset: 0.4, reach: 0.9, skip: 0.1 }],
      moss: [[x - r * 0.6, y - 0.2, 1, 0.4]],
    }, 800 + i * 7);
    const PEBBLES = [[266, GY - 0.4, 3.4], [276, GY - 0.3, 1.8], [298, GY - 0.4, 2.6], [320, GY - 0.4, 3.6], [329, GY - 0.3, 2]].map(([x, y, r], i) => pebble(x, y, r, i));
    // 路边的草：每丛 4–7 片，长短、斜度各不同（rnd 固定），外侧的叶片往外弯
    const GRASS = new Path2D([[150, 156], [168, 159], [196, 161], [286, 161], [304, 161], [312, 160.6], [40, 138], [58, 139], [74, 140], [100, 146], [128, 152]].map(([x, y], i) => {
      let d = ''; const n = 4 + Math.floor(rnd(i, 71) * 4);
      for (let j = 0; j < n; j++) {
        const t = n === 1 ? 0 : j / (n - 1) - 0.5, len = R(i * 9 + j, 72, 2.4, 7.2), lean = t * 1.2 + R(i * 9 + j, 73, -0.25, 0.25);
        const bx = x + t * 4, tx = bx + Math.sin(lean) * len, ty = y - Math.cos(lean) * len;
        d += `M${f2(bx)} ${y}Q${f2(bx + Math.sin(lean) * len * 0.3)} ${f2(y - len * 0.6)} ${f2(tx)} ${f2(ty)}`;
      }
      return d;
    }).join(''));
    function ground(k) {
      shape(k, GROUND, SP);
      pen(k, LEDGE, FP);
      PEBBLES.forEach(r => drawRock(k, r));
      pen(k, GRASS, FP);
    }
    // 立石：站在路的外沿，比行人高，行人从它后面走出来；纸色填充挡住后面的人。
    // 光从左上来：中间一道竖的转折线把石头分成亮面和背光面，背光面排横皴；左边几道横的转折是石头的层次
    const ROCK = rockArt({
      pts: [[206, 182], [203, 168], [202, 152], [205, 138], [204, 126], [209, 114], [214, 106], [221, 100], [229, 97], [238, 96.5], [246, 99], [252, 105], [255, 114], [257, 126], [260, 140], [259, 156], [261, 170], [260, 182]],
      facets: [
        [[238, 96.5], [241, 108], [236, 122], [240, 138], [237, 154], [240, 170], [238, 182]],
        [[214, 106], [225, 110], [241, 108]], [[205, 138], [214, 135], [223, 140], [240, 138]], [[203, 160], [212, 158], [219, 162]], [[240, 138], [249, 134], [257, 137]],
      ],
      shade: [
        { p: [[241, 108], [236, 122], [240, 138], [237, 154], [240, 170], [238, 182], [260, 182], [261, 170], [259, 156], [260, 140], [257, 126], [255, 114], [252, 105], [246, 99], [238, 96.5]], a: 0.12, reach: 0.55 },
        { p: [[205, 138], [214, 135], [223, 140], [221, 145], [212, 146], [204, 145]], g: 1.6, reach: 0.9 },
        { p: [[214, 106], [225, 110], [241, 108], [237, 114], [224, 115], [212, 112]], g: 1.6, reach: 0.9 },
      ],
      cun: 'M214 118 q-4 10 -3 22 M226 116 q-2 8 -1 16 M212 166 q-3 6 -1 12 M226 148 q-2 10 0 22',
      moss: [[211, 180.5, 5], [255, 181, 4], [224, 98.5, 3, 2.5], [244, 135.5, 3, 2], [208, 159, 2, 1.5]],
    }, 840);

    // 松：树干从坡上斜伸出来，枝条分叉、带几个结节；枝头是一簇簇扇形的松针，
    // 每簇从一个小枝点放射出 6–10 根细短针（山水画里的「扇形松针」）。一团松针分后、前两排，
    // 后排先画、前排后画，每簇先铺纸色扇面再描针，前面的簇挡住后面的；团的下沿留空，露出连到每簇的小枝
    const PADS = [[214, 64, 30], [176, 84, 22], [252, 82, 20], [204, 44, 18]];
    const BRANCHES = 'M180 100 Q172 94 168 86 M172 93 q-6 -1 -10 -4 M204 60 Q204 50 206 46 M205 52 q4 -3 7 -4 M226 77 q6 -6 11 -7 M241 78 q4 3 9 2 M190 72 q-6 -6 -12 -8';
    const KNOTS = 'M213.4 77 a1.6 1 0 1 0 3.2 0 a1.6 1 0 1 0 -3.2 0 M175.4 96 a1 1.4 0 1 0 2 0 a1 1.4 0 1 0 -2 0 M192.6 86 a1.4 1 0 1 0 2.8 0 a1.4 1 0 1 0 -2.8 0 M168 134 q2 -2 4 0 M184 92 l-3 -2';
    const BARK = 'M160 140 q4 -8 3 -16 M172 116 q2 -6 0 -12 M163 128 q3 -1 5 1 M181 100 q3 -1 4 1 M192 84 q2 -3 1 -6';
    function needleCluster(x, y, len, seed) {
      const n = 6 + Math.floor(rnd(seed, 1) * 5);
      const a0 = -Math.PI + R(seed, 2, 0.15, 0.35), a1 = -R(seed, 3, 0.15, 0.35);
      let fill = `M${f2(x)} ${f2(y + 0.6)}`, nd = '';
      for (let i = 0; i < n; i++) {
        const a = mix(a0, a1, i / (n - 1)) + R(seed * 13 + i, 4, -0.08, 0.08), l = len * R(seed * 13 + i, 5, 0.7, 1.1);
        // 扇面压扁一点（纵向 0.75），松针团是平的
        const dx = Math.cos(a), dy = Math.sin(a) * 0.75;
        fill += `L${f2(x + dx * l * 0.82)} ${f2(y + dy * l * 0.82)}`;
        nd += `M${f2(x + dx * 0.7)} ${f2(y + dy * 0.7)}L${f2(x + dx * l)} ${f2(y + dy * l)}`;
      }
      return { fill: new Path2D(fill + 'Z'), needles: new Path2D(nd) };
    }
    let PINE = null;
    function buildPine() {
      PINE = PADS.map(([cx, cy, w], p) => {
        const rows = [], base = [cx, cy + 3];
        let twigs = '';
        [[-4.5, Math.round(w / 6) + 1, 0.72, 5.6], [0, Math.round(w / 5) + 1, 1, 6.6]].forEach(([off, n, span, len], r) => {
          const row = [];
          for (let j = 0; j < n; j++) {
            const s = p * 100 + r * 30 + j, t = n === 1 ? 0 : (j / (n - 1)) * 2 - 1;
            const x = cx + t * w * span * 0.85 + R(s, 6, -1.2, 1.2), y = cy + off - 3.6 * (1 - t * t) + R(s, 7, -0.8, 0.8);
            row.push(needleCluster(x, y, len, s));
            twigs += `M${f2(base[0] + t * w * 0.3)} ${f2(base[1])}Q${f2((x + base[0]) / 2)} ${f2(y + 2.4)} ${f2(x)} ${f2(y + 0.4)}`;
          }
          rows.push(row);
        });
        return { base, rows, twigs: new Path2D(twigs) };
      });
    }
    function pine(k, u) {
      if (!PINE) buildPine();
      // 树干两笔开口，与人物四肢同一种画法；伸向右边那团的大枝也用双线，其余小枝单线
      limb(k, [[150, 150], [178, 104], [208, 64]], 7, [0.2, 0.6], SP);
      limb(k, [[194, 80], [222, 74.6], [250, 81]], 3, [0.2, 0.7], SP * 0.85);
      pen(k, BRANCHES, SP * 0.8);
      pen(k, KNOTS, FP);
      pen(k, BARK, FP);
      PINE.forEach((pd, i) => {
        // 松针团随风轻摆：绕团底的枝点转不到 1°，一个周期两个来回
        k.save();
        k.translate(pd.base[0], pd.base[1]); k.rotate(0.012 * Math.sin(2 * W11 * u + i * 1.7)); k.translate(-pd.base[0], -pd.base[1]);
        pen(k, pd.twigs, FP * 0.85);
        pd.rows.forEach(row => row.forEach(c => { k.fillStyle = PAPER; k.fill(c.fill); pen(k, c.needles, FP * 0.75); }));
        k.restore();
      });
    }

    // —— 背柴的行人 ——
    // 原作 gait.ts 的 walk 预设（每秒约两步）；一个周期走整数个步态周期，反推步频，腿的姿势首尾相接。
    // 人从立石后面走出来，沿岩架往右走到崖脚，绕进石壁后面；一个周期走过的距离由步速和缩放决定，起点挑在完全藏在立石后面的位置，
    // 终点正好完全进到石壁后面，接缝处人看不见，不会跳
    const S11 = 0.52, FPEN = 1.6;                    // 人物缩放；人物笔宽按人物单位，缩放后约 0.83 px，比场景主线略细，人物在远处
    const STEPS = Math.max(1, Math.round(CYC / GAIT.walk.period));
    const walk = gait({ kind: 'walk', period: CYC / STEPS });
    const DIST = walk.speed * S11 * CYC;
    const X_START = 234;
    const LEAN = 5 * Math.PI / 180;                   // 背着东西身子往前倾一点
    // 手臂照原作 walker 的弹簧 (60, 9)；背篓照原作 motion.md 的默认弹簧 (40, 6) 跟着身体上下颠，比身体慢半拍
    const motion = sim([{ type: 'spring', k: 60, d: 9 }, { type: 'spring', k: 40, d: 6 }], u => {
      const p = walk.pose(u / walk.period);
      return [-(p.feet[0].ankle[0] - 40) / (walk.stride / 2) * 16, p.bob];
    });
    function walker(k, u) {
      const ph = u / walk.period, p = walk.pose(ph), b = p.bob;
      const [armS, bk] = motion(u);
      k.save();
      place(k, X_START + DIST * u / CYC, GY, 1, S11);
      const hip = p.hip;
      // 上身绕髋前倾；腿不跟着转
      const up = (fn) => { k.save(); k.translate(hip[0], hip[1]); k.rotate(LEAN); k.translate(-hip[0], -hip[1]); fn(); k.restore(); };
      const sh = [41, 41 + b];
      // 远侧手臂：随步子前后摆（弹簧滞后）
      up(() => {
        const a = armS * Math.PI / 180, s0 = [sh[0] - 1, sh[1] + 2];
        const e = [s0[0] + 16 * Math.sin(a), s0[1] + 16 * Math.cos(a)];
        limb(k, [s0, e, [e[0] + 15 * Math.sin(a + 0.25), e[1] + 15 * Math.cos(a + 0.25)]], 3.6, [0.2, 0.5], FPEN);
      });
      // 腿：在前的那条后画
      [1 - p.front, p.front].forEach(i => { const fo = p.feet[i]; limb(k, [hip, fo.knee, fo.ankle], 4.2, [0.3, 0.8], FPEN); shoe(k, fo.ankle, fo.pitch); });
      up(() => {
        // 背篓：下窄上宽的篓子，横向编纹，上面露出一捆柴；高度跟着弹簧 bk
        const by = bk;
        pen(k, `M23 ${38 + by} L17 ${20 + by} M26.5 ${38 + by} L25 ${16 + by} M30 ${38 + by} L32 ${19 + by} M28 ${38 + by} L28.6 ${22 + by}`, FPEN * 1.1);
        pen(k, `M19 ${27 + by} Q25 ${25.4 + by} 31.4 ${27 + by}`, FPEN * 0.7);
        shape(k, `M19.6 ${38 + by} L35 ${38 + by} L34 ${70 + by} L23.4 ${70 + by}Z`, FPEN);
        let d = '';
        for (let y = 43; y < 70; y += 4.4) d += `M${mix(19.6, 23.4, (y - 38) / 32) + 0.4} ${y + by} L${mix(35, 34, (y - 38) / 32) - 0.4} ${y + by} `;
        d += `M25.5 ${39 + by} L27 ${69.4 + by} M30.2 ${39 + by} L30.4 ${69.4 + by}`;
        pen(k, d, FPEN * 0.5);
        pen(k, `M19.6 ${38 + by} L35 ${38 + by} M20 ${40.4 + by} L34.8 ${40.4 + by}`, FPEN);
        // 短上衣，盖住背篓前沿；腰上一条红腰带
        shape(k, `M${sh[0] - 6} ${sh[1] + 1} Q${sh[0] - 1} ${sh[1] - 2.4} ${sh[0] + 5} ${sh[1] + 1} L47.4 ${82 + b} L32 ${83 + b} L33.6 ${62 + b}Z`, FPEN);
        pen(k, `M${sh[0] + 3} ${sh[1] + 4} L45 ${82 + b}`, FPEN * 0.6);
        paint(k, `M33.2 ${69 + b} L46.6 ${69 + b} L46.8 ${72.6 + b} L33 ${72.6 + b}Z`, SASH, FPEN * 0.7);
        // 背带：从肩头斜到篓口、从腋下到篓底
        pen(k, `M${sh[0] + 2} ${sh[1]} Q38 ${36 + by} 34 ${39 + by} M38 ${58 + b} Q36 ${63 + by} 34 ${64 + by}`, FPEN * 0.8);
        // 脖子两笔、头、斗笠（不画脸）
        pen(k, `M40.4 ${36.6 + b} L40.2 ${41 + b} M43.4 ${36.8 + b} L43.6 ${40.8 + b}`, FPEN * 0.8);
        const hc = [42.4, 31.6 + b];
        const head = new Path2D(); head.ellipse(hc[0], hc[1], 3.6, 4.6, 0, 0, TAU);
        shape(k, head, FPEN);
        paint(k, `M${hc[0] - 12} ${hc[1] - 1.6} L${hc[0] + 0.6} ${hc[1] - 10.4} L${hc[0] + 12.4} ${hc[1] - 1.2} Q${hc[0]} ${hc[1] + 0.6} ${hc[0] - 12} ${hc[1] - 1.6}Z`, STRAW, FPEN * 0.8);
        pen(k, `M${hc[0] + 0.6} ${hc[1] - 10.4} L${hc[0] - 6} ${hc[1] - 0.6} M${hc[0] + 0.6} ${hc[1] - 10.4} L${hc[0] + 6.4} ${hc[1] - 0.4}`, FPEN * 0.4);
        // 近侧手臂：手握在胸前的背带上，跟着身体走，不摆
        const sN = [sh[0] + 1.6, sh[1] + 2.4];
        limb(k, [sN, [sN[0] + 2, sN[1] + 15], [sN[0] + 5.4, sN[1] + 7]], 3.6, [0.2, 0.4], FPEN);
      });
      k.restore();
    }

    CELLS[10] = (k, w, h, u) => {
      paper(k);
      const fog = morning(u);
      // 远山三层，由远到近；每层之后插山脚的薄霞和一层云，近的山挡住远的山和云
      RIDGES.forEach((r, i) => {
        const d = ridgeD(r.pts);
        k.fillStyle = PAPER; k.fill(path(d + ` L${CW + 6} ${CH + 6} L-6 ${CH + 6}Z`));
        k.globalAlpha = r.a; pen(k, d, SP * (0.8 + 0.1 * i)); pen(k, r.tex, FP * 0.8); k.globalAlpha = 1;
        // 白天也留一层山脚薄霞（0.55）；晨雾浓时整片山腰都埋在雾里。霞先铺，云画在霞上面，云的墨线不被冲淡
        const base = r.pts.reduce((m, p) => Math.max(m, p[1]), 0);
        mistBand(k, base - 26, base + 14, 0.55 + 0.4 * fog);
        // 中间一层山的山脚先铺云海，再画近层的云团；最近一层山画上来时挡住云海的下半截
        if (i === 1) cloudSea(k, u);
        cloudLayer(k, u, i);
      });
      // 晨雾：开头一大片纸色盖住远山，散去后只剩上面的山脚薄霞
      mistBand(k, 6, 150, 0.92 * fog);
      cliff(k);
      waterfall(k, u);
      pool(k, u);
      foam(k, u);
      spray(k, u);
      spume(k, u);
      // 潭面上方的晨雾，比山间的薄一些、散得一样快
      mistBand(k, 150, 214, 0.55 * fog, 196, CW);
      pine(k, u);
      ground(k);
      // 行人：在崖脚 x=CLIFF_X 处裁掉，看起来是绕进了石壁后面
      k.save(); k.beginPath(); k.rect(-10, 0, CLIFF_X + 10, CH); k.clip();
      walker(k, u);
      k.restore();
      drawRock(k, ROCK);
      // 路面在立石前那一段的边线
      pen(k, `M200 182 Q230 184 266 182`, FP);
    };
  }

  // @element 12
  // 港口灯塔：原作没有海边场景，这里按原作的画法（细墨线、纸色遮挡、一两处平涂色、daynight.ts 夜间反相）新编一幅港口。
  // 黄昏太阳沉进海里，入夜灯塔亮起、两道光束绕塔转着扫过海面；系在栈桥上的小船随浪起伏（钟摆），晾着的渔网被海风吹动（弹簧）；
  // 天亮前光束熄灭，复位段天亮，停在系船柱上过夜的海鸥飞回天上
  {
    // 主线约 1 px、细节线按原作 0.4–0.6 倍，与 #4-101 一致
    const SP = 1.1, FP = 0.6;
    const W = TAU / CYC; // 一周期一圈的角速度，周期性小动作都取它的整数倍
    const HZ = 116;      // 海平线
    const oval = (cx, cy, rx, ry) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
    const rect = (x0, y0, x1, y1) => `M${x0} ${y0} L${x1} ${y0} L${x1} ${y1} L${x0} ${y1}Z`;

    // —— 6.4 秒里的一天 ——
    // 从黄昏前 τ 0.68 开始（太阳已偏西），黄昏 τ 0.70–0.79 占约 2 秒（u 0.35–2.35），夜里约 3 秒；5.4 秒黎明，复位段 0.5 秒走完白天回到 1.68。
    // 首末关键帧差整一天，首尾画面相同
    const tauAt = dayClock([[0, 0.68], [1.3, 0.74], [2.4, 0.795], [4.4, 1.13], [5.4, 1.245], [5.9, 1.38], [6.4, 1.68]]);
    // 海风：均值 0.3 取原作 village 的风，起伏按一周期 1 次、3 次的正弦，循环才接得上
    const windAt = u => 0.3 + 0.12 * Math.sin(W * u) + 0.06 * Math.sin(3 * W * u + 1);

    // —— 浪 ——
    // 海面是一层层横向墨线：越近的行越低、间距越大、起伏越高、波长越长（近大远小）。每行是一串固定位置的短线，
    // 线上的起伏 y = A·sin(kx + 3Wt) 向左走，一周期起伏 3 次，所以线段本身不动、浪峰在走，循环接得上
    const ROWS = 13, WN = 3;
    const mkRow = (t, y, ph) => ({ t, y, A: 0.3 + 1.9 * t, k: TAU / (30 + 70 * t), ph });
    const ROW = Array.from({ length: ROWS }, (_, r) => {
      const t = r / (ROWS - 1), row = mkRow(t, HZ + 3 + 88 * Math.pow(t, 1.5), rnd(r, 5) * TAU), segs = [];
      let x = -10 - rnd(r, 1) * 30;
      for (let i = 0; x < CW + 10; i++) {
        const len = mix(10, 46, rnd(r, 10 + i * 2)) * mix(0.7, 1.2, t);
        segs.push([x, x + len]);
        x += len + mix(8, 30, rnd(r, 11 + i * 2)) * mix(1.6, 0.8, t);
      }
      return Object.assign(row, { segs });
    });
    const waveAt = (row, x, u) => row.y + row.A * Math.sin(row.k * x + WN * W * u + row.ph);
    const slopeAt = (row, x, u) => row.A * row.k * Math.cos(row.k * x + WN * W * u + row.ph);
    // 小船吃水线所在的那一层浪（介于第 6、7 行之间），船的上下起伏和受到的推力都取它
    const BOAT = { x: 268, row: mkRow(0.52, 152, 1.3) };

    // 小船横摇用原作灯笼的钟摆 (10, 1.1)：推力取船下浪面的坡度；渔网下摆用原作围巾尾的弹簧 (30, 4)，目标随海风
    const swing = sim([{ type: 'pendulum', k: 10, d: 1.1 }, { type: 'spring', k: 30, d: 4 }],
      u => [2.3 * slopeAt(BOAT.row, BOAT.x, u), 0.6 * windAt(u)]);

    // —— 颜色 ——
    // 平涂色两种：灯塔的红（同 #4-100 的红伞）和船身的木色（原作 boatman 的船 #8b6a48），夜里按原作 nightTint() 压暗
    const RED = hx('#b3412d'), RED_NIGHT = hx('#6e2a22'), WOOD = hx('#8b6a48');
    const nightTint = (c, inkT, amt = 0.55) => mc(c, mc(c, [12, 16, 30], 0.6), inkT * amt);
    // 光的颜色用原作窗光、路灯光锥那一档暖黄
    const WARM = '255,226,168';
    const WARMGLOW = [[0, '255,213,138', 0.75], [0.45, '255,184,92', 0.28], [1, '255,184,92', 0]];
    let C = null; // 当前帧的 css 颜色；kit 的 pen/shape 用固定 INK/PAPER，夜里会反相，所以用下面两个按 C 画
    const strokeP = (k, d, w = SP, a = 1) => { k.globalAlpha = a; k.lineWidth = w; k.strokeStyle = C.ink; k.stroke(path(d)); k.globalAlpha = 1; };
    const shapeP = (k, d, w = SP, col = C.paper) => { const p = path(d); k.fillStyle = col; k.fill(p); k.lineWidth = w; k.strokeStyle = C.ink; k.stroke(p); };
    const radial = (k, x, y, r, stops, alpha) => {
      if (alpha < 0.004) return;
      const g = k.createRadialGradient(x, y, 0, x, y, r);
      stops.forEach(([o, c, a]) => g.addColorStop(o, `rgba(${c},${a})`));
      k.globalAlpha = alpha; k.fillStyle = g; k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill(); k.globalAlpha = 1;
    };

    // —— 天空 ——
    const STARS = Array.from({ length: 16 }, (_, i) => [8 + rnd(i, 41) * 520, 6 + rnd(i, 42) * 84, 0.5 + rnd(i, 43) * 0.6, 2 + Math.floor(rnd(i, 44) * 7)]);
    function sky(k, F) {
      const { P, u, tau } = F, tw = wrap(tau, 1);
      const g = k.createLinearGradient(0, 0, 0, HZ);
      g.addColorStop(0, css(P.top)); g.addColorStop(1, css(P.bot));
      k.fillStyle = g; k.fillRect(-2, -2, CW + 4, HZ + 2);
      if (P.night > 0.01) {
        k.fillStyle = '#f5efda';
        STARS.forEach(([x, y, r, n], i) => { k.globalAlpha = P.night * (0.55 + 0.45 * Math.sin(n * W * u + i)); k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill(); });
        k.globalAlpha = 1;
      }
      k.save(); k.beginPath(); k.rect(-2, -2, CW + 4, HZ + 2); k.clip();
      // 太阳：沿原作 sky.ts 的弧（τ 0.225 升、0.775 落），落点在灯塔左边的海平线上，越近日落越红、光晕越大
      const s = (tw - 0.225) / 0.55;
      if (s > -0.05 && s < 1.05) {
        const x = 20 + 340 * s, y = HZ - 95 * Math.sin(Math.PI * clamp(s)) + (s < 0 || s > 1 ? 14 : 0);
        radial(k, x, y, 44, [[0, '255,217,160', 0.55], [1, '255,217,160', 0]], 0.35 + 0.65 * P.sunset);
        shapeP(k, oval(x, y, 10, 10), SP, css(mc(hx('#fbf3df'), hx('#df5a3a'), P.sunset)));
      }
      // 蛾眉月：画法同 #4-100，夜里从左下升到中天
      if (tau > 0.82 && tau < 1.22) {
        const m = (tau - 0.82) / 0.4, x = 120 + 200 * m, y = HZ - 14 - 70 * Math.sin(Math.PI / 2 * m), r = 7;
        k.save(); k.translate(x, y); k.rotate(-24 * Math.PI / 180); k.globalAlpha = smooth(0, 0.1, m) * smooth(1, 0.85, m);
        k.fillStyle = '#f3ecd6'; k.fill(new Path2D(`M0 ${-r} A${r} ${r} 0 1 1 0 ${r} A${r * 0.62} ${r} 0 1 0 0 ${-r}Z`));
        k.restore();
      }
      k.restore();
      // 远处的岬角和小岛：原作远山的淡墨 0.42
      k.globalAlpha = 0.42;
      shapeP(k, `M-4 ${HZ} L-4 104 Q30 98 62 103 Q96 96 128 106 Q150 112 176 ${HZ}Z`, SP * 0.8);
      shapeP(k, `M296 ${HZ} Q312 108 330 111 Q342 112 350 ${HZ}Z`, SP * 0.8);
      k.globalAlpha = 1;
    }

    // —— 海 ——
    // 浪行按传入的那一部分画：远处几行在船和栈桥后面，近处几行在它们前面
    function waves(k, F, rows) {
      rows.forEach(row => {
        let d = '';
        row.segs.forEach(([a, b]) => {
          const n = Math.max(2, Math.ceil((b - a) / 5));
          for (let i = 0; i <= n; i++) { const x = mix(a, b, i / n); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + waveAt(row, x, F.u).toFixed(2); }
        });
        strokeP(k, d, mix(0.5, 1.0, row.t), mix(0.5, 0.9, row.t));
      });
    }
    function sea(k, F, lights, rows) {
      const { P, u } = F;
      // 水色同 #4-100：白天淡灰蓝，夜里深靛，在 inkT 0.4–0.6 之间渐变
      const nt = smooth(0.4, 0.6, P.inkT);
      k.fillStyle = css(mc(mc(P.paper, hx('#bfd0d8'), 0.32), mc(P.paper, hx('#0f1730'), 0.45), nt));
      k.fillRect(-2, HZ, CW + 4, CH - HZ + 2);
      strokeP(k, `M-2 ${HZ} L${CW + 2} ${HZ}`, SP * 0.8);
      // 倒影：太阳和亮着的灯下面一串横向暖色短线，左右抖动、长短起伏（原作 canal 倒影的画法）
      k.lineCap = 'round';
      lights.forEach(([x, y0, w, a, n]) => {
        if (a < 0.02) return;
        for (let j = 0; j < n; j++) {
          const y = y0 + j * 5, jit = Math.sin(2 * W * u + j * 1.7 + x * 0.1) * (1.5 + j * 0.5);
          const ww = w * (1 - j * 0.06) * (0.7 + 0.3 * Math.sin(3 * W * u + j));
          k.globalAlpha = a * (0.75 - j * 0.06); k.strokeStyle = '#ffcf7e'; k.lineWidth = 1.4 - j * 0.06;
          k.beginPath(); k.moveTo(x - ww / 2 + jit, y); k.lineTo(x + ww / 2 + jit, y); k.stroke();
        }
      });
      k.globalAlpha = 1;
      waves(k, F, rows);
    }

    // —— 岬角、灯塔、守塔人小屋 ——
    // 灯塔照原作画房子的办法画成立面（不画透视）：塔身上窄下宽，两道红漆环带，顶上是回廊、灯室和穹顶
    const LT = { x: 446, top: 50, base: 122, hw0: 10, hw1: 15 };
    const LAMP = [LT.x, 38];
    const towerX = (y, s) => LT.x + s * mix(LT.hw0, LT.hw1, (y - LT.top) / (LT.base - LT.top));
    const band = (y0, y1) => `M${towerX(y0, -1)} ${y0} L${towerX(y0, 1)} ${y0} L${towerX(y1, 1)} ${y1} L${towerX(y1, -1)} ${y1}Z`;
    const ROCK = 'M380 152 Q388 134 406 128 L426 122 Q446 118 470 120 Q498 116 520 121 L541 123 L541 170 Q522 165 502 170 Q474 163 446 168 Q416 160 380 152Z';
    function headland(k, F, on) {
      const { u, P } = F;
      shapeP(k, ROCK);
      strokeP(k, 'M396 140 q8 -4 14 -2 M420 132 l10 4 M470 128 q10 3 18 0 M500 140 q8 -3 16 2 M440 150 q12 4 22 0 M516 152 l12 -3', FP, 0.8);
      // 礁石脚下的浪花：几段短弧随浪一伸一缩，频率取浪的 3 倍
      let d = '';
      [[384, 154], [412, 162], [444, 170], [476, 167], [508, 171]].forEach(([x, y], i) => {
        const s = 0.5 + 0.5 * Math.sin(WN * W * u + i * 1.9), len = 6 + 8 * s;
        d += `M${x - len} ${y + 2 - 2 * s} Q${x} ${y - 2 - 2 * s} ${x + len} ${y + 2 - 2 * s} `;
      });
      strokeP(k, d, FP * 1.3, 0.85);
      // 守塔人小屋：一扇窗，天黑后亮，到天亮
      const lit = smooth(0.2, 0.45, P.lamp);
      strokeP(k, 'M510 98 L510 88 M514 98 L514 88', SP);
      shapeP(k, rect(480, 104, 516, 121));
      shapeP(k, 'M475 105 L498 92 L521 105Z');
      strokeP(k, 'M482 101 L514 101 M488 97 L508 97', FP, 0.8);
      k.fillStyle = css(mc(C.paperArr, hx('#ffd58a'), lit * 0.92)); k.fillRect(487, 108, 9, 7);
      strokeP(k, `${rect(487, 108, 496, 115)} M491.5 108 L491.5 115`, FP);
      shapeP(k, rect(502, 110, 509, 121), FP);
      // 塔身
      shapeP(k, `M${towerX(LT.top, -1)} ${LT.top} L${towerX(LT.top, 1)} ${LT.top} L${towerX(LT.base, 1)} ${LT.base} L${towerX(LT.base, -1)} ${LT.base}Z`);
      shapeP(k, band(64, 74), SP, C.red);
      shapeP(k, band(92, 102), SP, C.red);
      shapeP(k, rect(442, 108, 450, 122), FP);
      shapeP(k, rect(444, 81, 448, 86), FP);
      // 回廊、栏杆
      shapeP(k, rect(431, 46, 461, 50));
      strokeP(k, 'M433 46 L433 40 M439 46 L439 40 M453 46 L453 40 M459 46 L459 40 M432 40 L460 40', FP);
      // 灯室：玻璃按亮度从纸色变成暖白，三根窗棂
      k.fillStyle = css(mc(C.paperArr, hx('#fff1c9'), on)); k.fillRect(438, 30, 16, 16);
      strokeP(k, `${rect(438, 30, 454, 46)} M443 30 L443 46 M449 30 L449 46`, FP * 1.4);
      shapeP(k, 'M435 30 Q446 16 457 30Z', SP, C.red);
      strokeP(k, 'M446 21 L446 14', SP);
      shapeP(k, oval(446, 13.5, 1.4, 1.4), FP);
    }

    // —— 木栈桥 ——
    // 立面：桥面一条，下面一排木桩伸进海里；桥头两根高桩是系船柱，也是海鸥过夜的地方
    const DECK = 146, PIER_END = 236;
    const PILES = [8, 42, 76, 110, 144, 178, 212];
    function pier(k) {
      PILES.forEach(x => shapeP(k, rect(x - 2.5, DECK + 4, x + 2.5, CH + 2)));
      let d = '';
      for (let i = 0; i < PILES.length - 1; i++) { const a = PILES[i] + 2.5, b = PILES[i + 1] - 2.5; d += `M${a} ${DECK + 8} L${b} ${DECK + 26} M${a} ${DECK + 26} L${b} ${DECK + 8} `; }
      strokeP(k, d, FP, 0.8);
      shapeP(k, rect(228, 128, 233, CH + 2));
      shapeP(k, rect(-4, DECK, PIER_END, DECK + 5));
      d = '';
      for (let x = 4; x < PIER_END; x += 9) d += `M${x} ${DECK + 0.8} L${x} ${DECK + 4.2} `;
      strokeP(k, d, FP, 0.7);
      shapeP(k, rect(219, 140, 224, DECK), FP);
      shapeP(k, oval(221.5, 140, 3.4, 1.4), FP);
      // 栈桥上的鱼篓和一卷缆绳，让人看得出这里有渔家
      shapeP(k, 'M176 146 L178 134 Q184 131 190 134 L192 146Z');
      strokeP(k, 'M177 140 L191 140 M180 135 L180 146 M184 133 L184 146 M188 135 L188 146', FP, 0.8);
      shapeP(k, oval(204, 143, 7, 3));
      strokeP(k, `${oval(204, 143, 4.4, 1.8)} ${oval(204, 143, 1.8, 0.7)}`, FP, 0.8);
    }

    // —— 晾网 ——
    // 两根竿子拉一根绳，网挂在绳上往下垂；下摆被海风往左（岸上）推，用弹簧值 s 推开 dx，越往下偏得越多
    const NA = [40, 92], NB = [150, 94];
    function net(k, s, u) {
      strokeP(k, `M${NA[0]} ${DECK} L${NA[0]} ${NA[1] - 4} M${NB[0]} ${DECK} L${NB[0]} ${NB[1] - 4}`, SP * 1.3);
      const dx = s * 48;
      const P = (i, j) => {
        const top = [mix(NA[0], NB[0], i), mix(NA[1], NB[1], i) + 9 * Math.sin(Math.PI * i)];
        const hem = 40 - 6 * Math.sin(Math.PI * i) + 1.2 * Math.sin(4 * W * u + i * 7);
        return [top[0] - dx * j * j * (0.6 + 0.4 * Math.sin(Math.PI * i)) + 1.5 * j * Math.sin(5 * W * u + i * 5), top[1] + hem * j];
      };
      strokeP(k, `M${pt(NA)} Q${(NA[0] + NB[0]) / 2} ${(NA[1] + NB[1]) / 2 + 18} ${pt(NB)}`, FP * 1.4);
      // 网眼是两组斜线交成的菱形；网是透的，不填纸色
      let d = '';
      const N = 14, R = 0.35;
      for (let f = -1; f <= 1; f += 2) for (let m = -3; m <= N + 3; m++) {
        let started = false;
        for (let j = 0; j <= 1.0001; j += 0.125) {
          const i = m / N + f * R * j;
          if (i < 0 || i > 1) { started = false; continue; }
          d += (started ? 'L' : 'M') + pt(P(i, j)); started = true;
        }
      }
      strokeP(k, d, FP, 0.75);
      let hem = '', fl = '';
      for (let n = 0; n <= 20; n++) hem += (n ? 'L' : 'M') + pt(P(n / 20, 1));
      strokeP(k, hem, FP * 1.4);
      // 下摆的浮子
      for (let n = 1; n < 8; n++) { const [x, y] = P(n / 8, 1); fl += oval(x, y + 1, 2, 1.4); }
      shapeP(k, fl, FP);
    }

    // —— 系着的小船 ——
    // 原点在船中段的吃水线：上下随船下那层浪起伏，横摇角 a 来自钟摆；船身木色平涂，船头立一盏原作 boatman 那样的船灯，船尾一把橹
    const HULL = 'M-34 -5 L26 -5 Q33 -6 37 -12 Q35 -2 28 4 L-28 4 Q-33 3 -34 -5Z';
    const toWorld = (bx, by, a, p) => [bx + p[0] * Math.cos(a) - p[1] * Math.sin(a), by + p[0] * Math.sin(a) + p[1] * Math.cos(a)];
    function boat(k, F, a, on) {
      const by = waveAt(BOAT.row, BOAT.x, F.u) - 1;
      // 缆绳：栈桥头的桩顶到船尾，松松垂下一点，船晃时跟着拉动
      const stern = toWorld(BOAT.x, by, a, [-31, -5]);
      strokeP(k, `M230.5 132 Q${(230.5 + stern[0]) / 2} ${Math.max(132, stern[1]) + 7} ${pt(stern)}`, FP * 1.3);
      k.save(); k.translate(BOAT.x, by); k.rotate(a);
      strokeP(k, 'M-30 -5 L-46 7', SP);                     // 橹
      shapeP(k, 'M-22 -5 L-22 -12 Q-10 -18 2 -12 L2 -5Z');   // 船篷
      strokeP(k, 'M-18 -13.8 L-18 -5 M-10 -15.6 L-10 -5 M-2 -14.6 L-2 -5', FP, 0.8);
      shapeP(k, HULL, SP, C.wood);
      strokeP(k, 'M-32 -2 L31 -2 M-14 -5 L-14 4 M10 -5 L10 4', FP);
      strokeP(k, 'M29 -5 L29 -19 Q29 -21 31 -21', SP * 0.9);
      shapeP(k, 'M30.4 -20 L34.6 -20 Q36 -17 34.6 -14 L30.4 -14 Q29 -17 30.4 -20Z', FP * 1.2, css(mc(C.paperArr, hx('#ffd38a'), on)));
      k.restore();
      return toWorld(BOAT.x, by, a, [32.5, -17]);
    }

    // —— 海鸥 ——
    // 白天和黄昏两只在海上绕圈飞，扇翅频率取原作 swallows 的 22 rad/s（取整到 22 倍 W）；天黑前落到栈桥头的两根桩上过夜，
    // 天亮后飞走（原作 scenes.md：鸟黄昏归巢）。飞的样子是一笔「M」形翅膀加一点墨色身子，停着是纸色身子、头、尾和两条腿
    const GULLS = [
      { perch: [230.5, 128], dir: -1, c: [300, 66], r: [86, 16], n: 1, ph: 0.4, land: [1.5, 2.2, 5.5, 6.05] },
      { perch: [221.5, 138.6], dir: 1, c: [170, 50], r: [54, 12], n: -2, ph: 2.6, land: [1.7, 2.45, 5.65, 6.2] },
    ];
    function gull(k, g, u) {
      const [l0, l1, t0, t1] = g.land, landed = smooth(l0, l1, u) * smooth(t1, t0, u);
      const th = g.n * W * u + g.ph;
      const fly = [g.c[0] + g.r[0] * Math.cos(th), g.c[1] + g.r[1] * Math.sin(th) + 3 * Math.sin(2 * th)];
      const e = ease(landed), x = mix(fly[0], g.perch[0], e), y = mix(fly[1], g.perch[1] - 5, e);
      if (landed > 0.93) {
        const [px, py] = g.perch, s = g.dir;
        strokeP(k, `M${px - 1} ${py} L${px - 1} ${py - 3} M${px + 1} ${py} L${px + 1} ${py - 3}`, FP);
        shapeP(k, `M${px - 6 * s} ${py - 5} Q${px - 2 * s} ${py - 2} ${px + 3 * s} ${py - 4} Q${px + 5 * s} ${py - 6} ${px + 4 * s} ${py - 8} Q${px} ${py - 9} ${px - 6 * s} ${py - 5}Z`, FP * 1.4);
        shapeP(k, oval(px + 4.4 * s, py - 9.4, 2, 1.9), FP * 1.4);
        strokeP(k, `M${px + 6.2 * s} ${py - 9.6} L${px + 8.6 * s} ${py - 9.2} M${px - 4 * s} ${py - 6.4} Q${px} ${py - 5} ${px + 3 * s} ${py - 6}`, FP);
        return;
      }
      // 翅膀高低在 +1（上举）和 −0.5（下压）之间；快落地时翅膀张开滑翔
      const flap = mix(Math.sin(22 * W * u + g.ph * 3) > 0 ? 1 : -0.5, 0.5, e), s = 7 * (1 - 0.3 * e);
      strokeP(k, `M${x - s} ${y - 3 * flap} Q${x - s * 0.45} ${y - 4 * flap - 1} ${x} ${y} Q${x + s * 0.45} ${y - 4 * flap - 1} ${x + s} ${y - 3 * flap}`, SP);
      k.fillStyle = C.ink; k.beginPath(); k.ellipse(x, y + 0.4, 1.6, 1, 0, 0, TAU); k.fill();
    }

    // —— 光束 ——
    // 灯室里的灯绕竖轴转，两道光束相背，一周期转 2 圈（3.2 秒一圈），所以每 1.6 秒有一道扫过海面。
    // 立面图里光束朝左右时最长；转到背面时被塔身挡住（画在塔身之前），转到正面时变短、灯口闪亮。
    // 光束是暖色半透明扇形，从灯口上浓下淡（同 #4-100 路灯光锥的渐变），斜着落到海面，落点处海面一块椭圆光斑
    const beamOn = u => smooth(1.5, 1.75, u) * smooth(5.55, 5.3, u);
    const beamEnd = th => [LAMP[0] + 330 * Math.cos(th), HZ + 4 + 30 * (1 + Math.sin(th)) / 2];
    function beam(k, th, a) {
      const c = Math.abs(Math.cos(th));
      if (a * c < 0.01) return;
      const [ex, ey] = beamEnd(th), dx = ex - LAMP[0], dy = ey - LAMP[1], L = Math.hypot(dx, dy);
      const nx = -dy / L, ny = dx / L, w0 = 3, w1 = 10 + 22 * c;
      const g = k.createLinearGradient(LAMP[0], LAMP[1], ex, ey);
      g.addColorStop(0, `rgba(${WARM},0.55)`); g.addColorStop(1, `rgba(${WARM},0.05)`);
      k.globalAlpha = a * (0.3 + 0.7 * c); k.fillStyle = g;
      k.fill(new Path2D(`M${LAMP[0] + nx * w0} ${LAMP[1] + ny * w0} L${ex + nx * w1} ${ey + ny * w1} L${ex - nx * w1} ${ey - ny * w1} L${LAMP[0] - nx * w0} ${LAMP[1] - ny * w0}Z`));
      k.globalAlpha = 1;
      // 落点光斑：压扁的径向渐变
      k.save(); k.translate(ex, ey + 3); k.scale(46 * (0.5 + 0.5 * c), 5); radial(k, 0, 0, 1, WARMGLOW, a * c * 0.8); k.restore();
    }

    const BACK_ROWS = ROW.filter(r => r.y < BOAT.row.y + 2), FRONT_ROWS = ROW.filter(r => r.y >= BOAT.row.y + 2);
    CELLS[11] = (k, w, h, u) => {
      const tau = wrap(tauAt(u), 1), P = palette(tau);
      const F = { u, tau, P };
      C = { paper: css(P.paper), ink: css(P.ink), red: css(mc(RED, RED_NIGHT, P.inkT)), wood: css(nightTint(WOOD, P.inkT)), paperArr: P.paper };
      const [rollA, netS] = swing(u);
      const bOn = beamOn(u), boatOn = smooth(0.3, 0.55, P.lamp);
      // 两道相背的光束；sin θ > 0 朝向观者（落点更近、画在塔身前面），sin θ < 0 转到塔后（先画，被塔身挡住）
      const th0 = 2 * W * u + 0.6, beams = [th0, th0 + Math.PI];
      k.save();
      k.lineCap = 'round'; k.lineJoin = 'round';
      sky(k, F);
      // 海面倒影：太阳贴近海平线时一道，船灯一小道
      const ts = (tau - 0.225) / 0.55, sunX = 20 + 340 * clamp(ts);
      const sunRefl = smooth(0.12, 0.02, Math.abs(clamp(ts) - 1)) * smooth(1.04, 1, ts) * P.sunset;
      const lights = [[sunX, HZ + 3, 26, sunRefl, 8], [BOAT.x + 33, 158, 7, boatOn, 4]];
      sea(k, F, lights, BACK_ROWS);
      beams.forEach(th => { if (Math.sin(th) < 0) beam(k, th, bOn); });
      pier(k);
      net(k, netS, u);
      const lampAt = boat(k, F, rollA, boatOn);
      waves(k, F, FRONT_ROWS);
      headland(k, F, bOn);
      beams.forEach(th => { if (Math.sin(th) >= 0) beam(k, th, bOn); });
      // 灯口光晕：光束转到正对观者时闪亮一下
      const flash = Math.max(...beams.map(th => Math.pow(Math.max(0, Math.sin(th)), 10)));
      radial(k, LAMP[0], LAMP[1], 22 + 14 * flash, WARMGLOW, bOn * (0.6 + 0.4 * flash));
      radial(k, lampAt[0], lampAt[1], 14, WARMGLOW, boatOn * 0.9);
      radial(k, 491.5, 111.5, 16, WARMGLOW, smooth(0.2, 0.45, P.lamp) * 0.7);
      GULLS.forEach(g => gull(k, g, u));
      k.restore();
    };
  }

  // @element 13
  // 厨房煮饭：一个不画脸的人站在案台后切胡萝卜，切完揭开锅盖、抬起砧板把胡萝卜片滑进锅里，盖回锅盖，
  // 再从菜篮里拿一根新的放上砧板。锅一直在灶上滚着，锅盖被蒸汽顶得一跳一跳，冒出一团团热气；
  // 墙上挂的勺铲随切菜的震动轻轻晃，窗外邻家的烟囱冒炊烟。原作没有室内场景，构图是新编的；
  // 墨线、纸色遮挡、两种平涂色（围裙靛蓝、胡萝卜橙）、炊烟画法和钟摆参数沿用原作。白天场景，不做昼夜。
  {
    const SP = 1.2, FP = 0.6;                         // 主线、细节线（原作细节笔 0.4–0.6×）
    const INDIGO = '#34507a', CARROT = '#c8643b';     // 围裙用原作和服的靛蓝；胡萝卜是这一款唯一的暖色
    const TOP = 150;                                  // 案台台面
    const W13 = TAU / CYC;                            // 一个周期一次的角频率，轻微晃动都取它的整数倍

    // —— 时间线（秒）——
    const CHOPS = 8, CH0 = 0.1, CHP = 0.29;           // 切 8 刀，每刀 0.29 秒
    const SW = 5, CA0 = 196, CA1 = 250;               // 每片厚 5；胡萝卜从叶端 x=196 到尖端 x=250
    const cutX = i => CA1 - SW * (i + 1);             // 第 i 刀落在哪
    const hitT = i => CH0 + i * CHP + 0.3 * CHP;      // 第 i 刀刀刃碰到砧板的时刻
    const cutsDone = u => { let n = 0; for (let i = 0; i < CHOPS; i++) if (u >= hitT(i)) n++; return n; };
    const LID_UP = [3.15, 3.35], LID_DOWN = [4.05, 4.3];          // 揭盖、盖回
    const TILT = [3.25, 3.55, 4.0, 4.25];                          // 砧板抬起、倾着、放回
    const BUMPS = [0.55, 1.25, 1.85, 2.4, 4.9, 5.45, 5.95];        // 盖着时锅盖被顶起的时刻，越到后面越密
    const BUMP_LEN = 0.22;

    // 关键帧轨迹：[[时刻, [x, y]], …]，相邻两帧之间 ease 过渡，首尾同一位置，循环接得上
    const track = keys => u => {
      if (u <= keys[0][0]) return keys[0][1];
      for (let i = 1; i < keys.length; i++) if (u <= keys[i][0]) {
        const [t0, a] = keys[i - 1], [t1, b] = keys[i], s = t1 > t0 ? ease((u - t0) / (t1 - t0)) : 1;
        return [mix(a[0], b[0], s), mix(a[1], b[1], s)];
      }
      return keys[keys.length - 1][1];
    };
    const win = (u, a, b) => smooth(a[0], a[1], u) * (1 - smooth(b[0], b[1], u));

    // —— 砧板：右下角为支点，抬起时支点挪到锅沿上方，板绕它顺时针转，左端抬高，板上的片往锅里滑 ——
    const PIV0 = [262, TOP], PIV1 = [270, 128], TH1 = 0.3, BL = 74, BT = 6;
    const tiltAt = u => smooth(TILT[0], TILT[1], u) * (1 - smooth(TILT[2], TILT[3], u));
    const boardXf = u => { const b = tiltAt(u); return { p: lerpP(PIV0, PIV1, b), th: TH1 * b }; };
    const toWorld = (xf, lx, ly) => {
      const c = Math.cos(xf.th), s = Math.sin(xf.th);
      return [xf.p[0] + lx * c - ly * s, xf.p[1] + lx * s + ly * c];
    };

    // —— 手的轨迹 ——
    // 右手拿刀：切菜时按刀数上下，切完把刀平放在案上，揭锅盖、举着、盖回，再拿起刀回到第一刀上方
    const KNIFE_DOWN = [262, 154];                  // 刀平放在砧板前面的台面上，砧板抬起时刀不跟着动
    const rightKeys = track([
      [CH0 + CHOPS * CHP, [cutX(CHOPS - 1), 112]], [2.5, [cutX(CHOPS - 1), 112]], [2.75, KNIFE_DOWN], [2.85, KNIFE_DOWN],
      [LID_UP[0], [300, 118]], [LID_UP[1], [306, 96]], [LID_DOWN[0], [306, 96]], [LID_DOWN[1], [300, 118]], [4.38, [300, 118]],
      [4.55, KNIFE_DOWN], [4.62, KNIFE_DOWN], [5.4, [cutX(0), 112]], [CYC, [cutX(0), 112]],
    ]);
    const chopY = s => s < 0.3 ? 112 + 18 * s * s / 0.09 : s < 0.45 ? 130 : 130 - 18 * ease((s - 0.45) / 0.55);
    const rightHand = u => {
      if (u < CH0) return [cutX(0), 112];
      const f = (u - CH0) / CHP, i = Math.floor(f);
      if (i >= CHOPS) return rightKeys(u);
      const s = f - i, x0 = cutX(i), x1 = cutX(Math.min(CHOPS - 1, i + 1));
      return [s < 0.45 ? x0 : mix(x0, x1, ease((s - 0.45) / 0.55)), chopY(s)];
    };
    // 刀的角度：拿在手里刀刃朝下（0），放下时转成平躺（π/2，刀尖朝左）
    const knifeAng = u => Math.PI / 2 * win(u, [2.55, 2.75], [4.62, 4.82]);
    const knifeHeld = u => !(u > 2.75 && u < 4.55);
    // 左手：按住胡萝卜，切完把剩下的叶头扔进菜篮，抬砧板（手跟着板的左端），放回后去菜篮拿新的一根放上砧板
    const REST_L = [200, 138], BASKET = [168, 134];   // 手伸进篮口以下，扔进去的叶头才被篮子挡住
    const leftKeys = track([
      [0, REST_L], [2.45, REST_L], [2.6, [197, 138]], [2.85, [170, 120]], [2.95, BASKET], [TILT[0], [191, 147]],
      [TILT[3], [191, 147]], [4.45, [200, 142]], [4.7, [170, 122]], [4.8, BASKET], [5.25, REST_L], [CYC, REST_L],
    ]);
    const leftHand = u => u >= TILT[0] && u <= TILT[3] ? toWorld(boardXf(u), -BL + 3, -BT / 2) : leftKeys(u);

    // —— 锅盖：盖着时被蒸汽顶得跳；揭开时被右手举着 ——
    const bumpAt = u => {
      for (const b of BUMPS) { const s = (u - b) / BUMP_LEN; if (s >= 0 && s < 1) return s; }
      return -1;
    };
    const LID_REST = [300, 132], KNOB = 14;          // 锅沿中心；手握的盖钮在它上方 14
    const lidPose = u => {
      const off = win(u, LID_UP, LID_DOWN);
      if (off > 0) {
        const h = rightHand(u);
        return { c: lerpP(LID_REST, [h[0], h[1] + KNOB], off), a: 0.35 * off };
      }
      const s = bumpAt(u);
      if (s < 0) return { c: LID_REST, a: 0 };
      // 一跳：先顶起再落下，落下时轻轻弹一下；一侧先起，所以带一点歪
      const lift = 2.8 * Math.sin(Math.PI * s) + 0.6 * Math.max(0, Math.sin(Math.PI * (s * 2 - 1)));
      return { c: [LID_REST[0], LID_REST[1] - lift], a: 0.05 * Math.sin(TAU * s) };
    };

    // —— 墙上挂的勺铲：原作灯笼的钟摆 (10, 1.1)，推力来自每一刀落下和锅盖落回的震动 ——
    const JOLTS = [...Array.from({ length: CHOPS }, (_, i) => [hitT(i), 3]), ...BUMPS.map(b => [b + BUMP_LEN, 1.6]), [LID_DOWN[1], 3]];
    const jolt = u => JOLTS.reduce((f, [t, a]) => { const d = wrap(u - t + CYC / 2) - CYC / 2; return f + a * Math.exp(-(d / 0.03) * (d / 0.03)); }, 0);
    const HANG = [{ x: 40, k: 10 }, { x: 70, k: 12 }, { x: 100, k: 9 }, { x: 132, k: 14 }];
    const sway = sim(HANG.map(h => ({ type: 'pendulum', k: h.k, d: 1.1 })), u => HANG.map((h, i) => jolt(u) * (i % 2 ? -1 : 1)));

    // —— 热气：照原作 critters.ts 炊烟的画法（14 点起伏的圆、越老越大越淡）；出生时刻和走法都是定值，同一时刻画面不变 ——
    const PUFFS = [];
    BUMPS.forEach((b, i) => [[268, -1], [332, 1]].forEach(([x, dir], j) =>
      PUFFS.push({ t0: b + 0.05, x, y: 130, vx: dir * (6 + 4 * rnd(i, j)), vy: 14 + 6 * rnd(i, j + 5), r0: 3, life: 1.3, ph: rnd(i, j + 9) * 6 })));
    for (let j = 0; j < 7; j++) PUFFS.push({ t0: LID_UP[0] + 0.05 + j * 0.11, x: 284 + 32 * rnd(j, 21), y: 128, vx: -4 + 8 * rnd(j, 22), vy: 26 + 12 * rnd(j, 23), r0: 4, life: 1.6, ph: rnd(j, 24) * 6 });
    const puffPath = (x, y, r, ph, age) => {
      const P = [];
      for (let i = 0; i <= 14; i++) { const a = i / 14 * TAU, rr = r * (1 + 0.16 * Math.sin(a * 3 + ph + age)); P.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8]); }
      return new Path2D('M' + P.map(pt).join('L') + 'Z');
    };
    function steam(k, u) {
      PUFFS.forEach(p => {
        const age = wrap(u - p.t0);
        if (age > p.life) return;
        const x = p.x + p.vx * age + Math.sin(age * 1.2 + p.ph) * 2, y = p.y - p.vy * age + 3 * age * age;
        const a = (1 - age / p.life) * smooth(0, 0.2, age), d = puffPath(x, y, p.r0 + 2.2 * age * 2, p.ph, age);
        k.globalAlpha = a * 0.85; k.fillStyle = PAPER; k.fill(d);
        k.globalAlpha = a * 0.6; pen(k, d, FP);
      });
      // 盖着的时候，锅盖顶上的气孔一直冒两缕细气，波形一个周期往上走 3 遍
      const on = 1 - win(u, [LID_UP[0], LID_UP[0] + 0.1], [LID_DOWN[1] - 0.1, LID_DOWN[1]]);
      if (on > 0.01) for (let i = 0; i < 2; i++) {
        let prev = null;
        for (let j = 0; j <= 10; j++) {
          const t = j / 10, p = [296 + i * 7 + 2.6 * Math.sin(TAU * 1.3 * t - 3 * W13 * u + i * 2) * t, LID_REST[1] - KNOB - 3 - 40 * t];
          if (prev) { k.globalAlpha = on * 0.55 * (1 - t); pen(k, `M${pt(prev)}L${pt(p)}`, FP * 1.1); }
          prev = p;
        }
      }
      k.globalAlpha = 1;
    }

    // —— 布景：墙、挂勺的横杆、窗外邻家烟囱、案台、灶、水缸 ——
    const BACK = 146, FRONT = 156;                   // 台面后沿、前沿：台面是一条看得见上表面的窄带
    const POT = { x: 300, rim: 134, hw: 34, bot: 152 };
    const WIN = { x0: 360, y0: 26, x1: 470, y1: 104 };

    // 窗外：邻家屋顶和烟囱，烟按原作 critters.ts 的炊烟一团团往上飘，每个周期 10 团，出生时刻均分，首尾接得上
    const SMOKE = Array.from({ length: 10 }, (_, j) => ({ t0: j * CYC / 10, ph: rnd(j, 31) * 6, dx: 4 + 4 * rnd(j, 32) }));
    function windowView(k, u) {
      const { x0, y0, x1, y1 } = WIN;
      k.save(); k.beginPath(); k.rect(x0, y0, x1 - x0, y1 - y0); k.clip();
      k.fillStyle = '#eef0ea'; k.fillRect(x0, y0, x1 - x0, y1 - y0);
      // 远山一道淡线
      k.globalAlpha = 0.45; pen(k, `M${x0} 70 Q${x0 + 30} 56 ${x0 + 58} 64 T${x1} 58`, FP); k.globalAlpha = 1;
      SMOKE.forEach(p => {
        const age = wrap(u - p.t0), life = CYC;
        const x = 446 + p.dx * age + Math.sin(age * 0.9 + p.ph) * 2.5, y = 62 - 9 * age;
        const a = smooth(0, 0.4, age) * (1 - age / life), d = puffPath(x, y, 3 + 1.6 * age, p.ph, age);
        k.globalAlpha = a * 0.9; k.fillStyle = '#eef0ea'; k.fill(d);
        k.globalAlpha = a * 0.55; pen(k, d, FP);
      });
      k.globalAlpha = 1;
      shape(k, `M436 66 L446 66 L446 86 L436 86 Z`, FP * 1.6);                           // 烟囱
      shape(k, `M${x0 - 4} 104 L${x0 - 4} 88 L392 80 L478 80 L478 104 Z`, SP);             // 邻家屋顶
      for (let x = 368; x < 478; x += 7) pen(k, `M${x} 82 L${x - 2} 104`, FP * 0.8);      // 瓦垄
      k.restore();
      // 窗框和格子
      pen(k, `M${x0} ${y0} L${x1} ${y0} L${x1} ${y1} L${x0} ${y1} Z`, SP * 1.2);
      for (let i = 1; i < 4; i++) inkLine(k, x0 + (x1 - x0) * i / 4, y0, x0 + (x1 - x0) * i / 4, y1, FP * 1.4, i, 0.2);
      inkLine(k, x0, (y0 + y1) / 2, x1, (y0 + y1) / 2, FP * 1.4, 7, 0.2);
      inkLine(k, x0 - 6, y1 + 4, x1 + 6, y1 + 4, SP, 8, 0.3);                               // 窗台
    }

    // 挂在横杆上的四件厨具：长柄勺、锅铲、小煎锅、打蛋器；每件绕挂钩转 sway 的角度
    function utensils(k, u) {
      inkLine(k, 22, 24, 152, 24, SP * 1.2, 3, 0.25);
      blot(k, `M20 21 L24 21 L24 27 L20 27 Z`); blot(k, `M150 21 L154 21 L154 27 L150 27 Z`);
      const ang = sway(u);
      const ITEMS = [
        k2 => { pen(k2, 'M0 2 L0 34', FP * 1.8); shape(k2, 'M-6 34 Q-6 43 0 43 Q6 43 6 34 Z', FP * 1.6); },
        k2 => { pen(k2, 'M0 2 L0 28', FP * 1.8); shape(k2, 'M-5 28 L5 28 L6 42 L-6 42 Z', FP * 1.6); pen(k2, 'M-2 31 L-2 39 M2 31 L2 39', FP); },
        k2 => { pen(k2, 'M0 2 L0 18', FP * 2.2); shape(k2, 'M-11 18 L11 18 Q11 34 0 34 Q-11 34 -11 18 Z', SP); pen(k2, 'M-8 22 Q0 26 8 22', FP); },
        k2 => { pen(k2, 'M0 2 L0 20', FP * 2); for (const s of [-1, -0.4, 0.4, 1]) pen(k2, `M0 20 Q${7 * s} 30 0 40`, FP); },
      ];
      HANG.forEach((h, i) => {
        k.save(); k.translate(h.x, 24); k.rotate(ang[i] * 1.6);
        pen(k, 'M0 0 Q2 1 1 3 Q0 4 0 2', FP);                  // 挂钩
        ITEMS[i](k);
        k.restore();
      });
    }

    function counter(k) {
      shape(k, `M-2 ${BACK} L258 ${BACK} L258 ${CH + 2} L-2 ${CH + 2} Z`, SP);
      inkLine(k, -2, FRONT, 258, FRONT, SP, 11, 0.3);
      for (const x of [86, 172]) inkLine(k, x, FRONT, x, CH, FP * 1.4, x, 0.25);          // 柜门缝
      for (const x of [76, 96, 162, 182]) pen(k, `M${x} 176 L${x} 184`, SP * 1.4);         // 柜门把手
      for (let i = 0; i < 6; i++) { const y = FRONT + 12 + i * 8; k.globalAlpha = 0.35; pen(k, `M${8 + 31 * (i % 3)} ${y} q10 -1 18 0`, FP); }
      k.globalAlpha = 1;
    }

    // 灶：砖砌的前脸，中间火门，火苗是胡萝卜色的一小团，三个尖按整数频率起伏
    function stove(k, u) {
      shape(k, `M258 ${BACK} L346 ${BACK} L346 ${CH + 2} L258 ${CH + 2} Z`, SP);
      inkLine(k, 258, FRONT, 346, FRONT, SP, 13, 0.3);
      for (let r = 0; r < 6; r++) {                            // 砖缝
        const y = FRONT + 8 * (r + 1); k.globalAlpha = 0.45; pen(k, `M258 ${y} L346 ${y}`, FP);
        for (let x = 262 + (r % 2) * 11; x < 346; x += 22) pen(k, `M${x} ${y - 8} L${x} ${y}`, FP);
      }
      k.globalAlpha = 1;
      const door = `M284 ${CH + 2} L284 182 Q300 168 316 182 L316 ${CH + 2} Z`;
      blot(k, door);
      const f = i => 7 + 3 * Math.sin(W13 * (5 + i) * u + i * 2);
      paint(k, `M287 ${CH} Q290 ${CH - f(0)} 293 ${CH - 4} Q296 ${CH - 4 - f(1)} 301 ${CH - 5} Q305 ${CH - 2 - f(2)} 313 ${CH} Z`, CARROT, FP);
    }

    // 水缸：灶右边，缸口搭一把木瓢
    function waterJar(k) {
      shape(k, `M384 ${CH + 2} Q372 170 388 150 L432 150 Q448 170 436 ${CH + 2} Z`, SP);
      pen(k, 'M386 150 Q410 156 434 150', FP * 1.4);
      pen(k, 'M392 166 Q410 170 428 166', FP);
      pen(k, 'M420 148 L452 128', FP * 1.8);
      shape(k, 'M410 146 Q412 140 420 142 Q426 148 418 151 Q410 151 410 146 Z', FP * 1.4);
    }

    // —— 砧板和胡萝卜 ——
    // 胡萝卜躺在砧板上，叶端在左（x=196）、尖在右（x=250），半径从 4.2 收到 1.6
    const CR = x => mix(4.2, 1.6, (x - CA0) / (CA1 - CA0));
    const carrotD = (x0, x1, dx = 0, dy = 0) => {
      const y = x => BACK - 2 - CR(x) + dy;            // 贴着砧板面
      return `M${x0 + dx} ${y(x0) - CR(x0)} L${x1 + dx} ${y(x1) - CR(x1)} Q${x1 + dx + 1.6} ${y(x1)} ${x1 + dx} ${y(x1) + CR(x1)} L${x0 + dx} ${y(x0) + CR(x0)} Q${x0 + dx - 1.4} ${y(x0)} ${x0 + dx} ${y(x0) - CR(x0)} Z`;
    };
    const leaves = (dx, dy) => `M${CA0 + dx} ${BACK - 6 + dy} q-6 -3 -11 -9 M${CA0 + dx} ${BACK - 7 + dy} q-3 -5 -4 -12 M${CA0 + dx} ${BACK - 6 + dy} q-8 0 -13 -3`;
    function wholeCarrot(k, x1, dx, dy) {
      paint(k, carrotD(CA0, x1, dx, dy), CARROT, FP * 1.4);
      for (let x = CA0 + 9; x < x1 - 3; x += 11) { k.globalAlpha = 0.55; pen(k, `M${x + dx} ${BACK - 2 - 2 * CR(x) + 1 + dy} l1 2`, FP * 0.8); }
      k.globalAlpha = 1;
      pen(k, leaves(dx, dy), FP * 1.2);
    }

    // 切下的片在砧板局部坐标里：lx 从支点（右端）往左量，ly 向下为正，板面是 ly=-BT
    const BOARD_PIV0_X = PIV0[0];
    const SLIDE_A = 320, SLIDE_T0 = TILT[0] + 0.15;    // 板倾到一半片才开始滑，越往后越快
    function slicePose(i, u) {
      const t = u - hitT(i);
      const fall = smooth(0, 0.1, t);                  // 切下后往右倒一点
      let lx = cutX(i) + SW / 2 + 1.4 * fall - BOARD_PIV0_X;
      const st = u - SLIDE_T0 - 0.015 * i;             // 靠近支点的先滑
      if (st > 0) lx += 0.5 * SLIDE_A * st * st;
      return { lx, rot: 0.22 * fall + (st > 0 ? 0.6 * st : 0), st };
    }
    // 已经滑出板端、正往锅里掉的片
    const offBoard = u => {
      if (u > TILT[3]) return [];
      const out = [];
      for (let i = 0; i < cutsDone(u); i++) { const s = slicePose(i, u); if (s.lx > 1) out.push([i, s]); }
      return out;
    };
    function boardAndSlices(k, u) {
      const xf = boardXf(u), n = cutsDone(u);
      k.save(); k.translate(xf.p[0], xf.p[1]); k.rotate(xf.th);
      shape(k, `M${-BL} ${-BT} L0 ${-BT} L0 0 L${-BL} 0 Z`, SP);
      pen(k, `M${-BL + 3} ${-BT + 2.4} L-3 ${-BT + 2.4}`, FP * 0.7);
      k.restore();
      for (let i = 0; i < n; i++) {
        if (u > TILT[3]) break;                        // 盖回之后片都在锅里了
        const s = slicePose(i, u), r = CR(cutX(i) + SW / 2);
        if (s.lx > 1) continue;
        const c = toWorld(xf, s.lx, -BT - r);
        k.save(); k.translate(c[0], c[1]); k.rotate(xf.th + s.rot);
        paint(k, `M${-SW / 2} ${-r} L${SW / 2} ${-r * 0.9} L${SW / 2} ${r * 0.9} L${-SW / 2} ${r} Z`, CARROT, FP * 1.2);
        k.restore();
      }
    }
    // 滑出板端的片：从板端抛出、按重力落进锅口，掉到锅沿以下就被锅身挡住
    function fallingSlices(k, u, list) {
      const xf = boardXf(u), end = toWorld(xf, 0, -BT - 2);
      list.forEach(([i, s]) => {
        const over = s.lx - 1, v = Math.sqrt(2 * SLIDE_A * Math.max(over, 0.01));
        const tf = over / Math.max(v, 1);              // 离开板端后的大致时间
        const x = end[0] + v * Math.cos(xf.th) * tf, y = end[1] + v * Math.sin(xf.th) * tf + 0.5 * 600 * tf * tf;
        if (y > POT.rim + 6) return;
        const r = CR(cutX(i) + SW / 2);
        k.save(); k.translate(x, y); k.rotate(s.rot * 2);
        paint(k, `M${-SW / 2} ${-r} L${SW / 2} ${-r} L${SW / 2} ${r} L${-SW / 2} ${r} Z`, CARROT, FP * 1.2);
        k.restore();
      });
    }

    // 菜篮：前脸画斜编纹；手伸进篮口时被前脸挡住
    function basketBack(k) {
      pen(k, 'M146 124 Q166 118 186 124', FP * 1.4);
      pen(k, 'M152 124 q2 -10 8 -12 M160 123 q0 -12 5 -15 M172 123 q4 -9 10 -10', FP * 1.1);   // 篮里冒出的菜叶
    }
    function basketFront(k) {
      shape(k, 'M146 124 Q166 130 186 124 L182 150 Q166 153 150 150 Z', SP);
      k.save(); k.clip(path('M146 124 Q166 130 186 124 L182 150 Q166 153 150 150 Z'));
      k.globalAlpha = 0.55;
      for (let x = 136; x < 196; x += 5) { pen(k, `M${x} 124 L${x + 10} 152`, FP * 0.8); pen(k, `M${x + 10} 124 L${x} 152`, FP * 0.8); }
      k.restore(); k.globalAlpha = 1;
      pen(k, 'M146 124 Q166 130 186 124', SP * 1.3);
    }

    function pot(k) {
      const { x, rim, hw, bot } = POT;
      shape(k, `M${x - hw} ${rim} L${x + hw} ${rim} Q${x + hw + 6} ${rim + 12} ${x + hw - 4} ${bot} L${x - hw + 4} ${bot} Q${x - hw - 6} ${rim + 12} ${x - hw} ${rim} Z`, SP);
      pen(k, `M${x - hw - 4} ${rim + 5} q-5 0 -5 3 M${x + hw + 4} ${rim + 5} q5 0 5 3`, SP);             // 两只锅耳
      pen(k, `M${x - hw + 2} ${rim + 3} L${x + hw - 2} ${rim + 3}`, FP * 0.8);
    }
    function lid(k, u) {
      const L = lidPose(u);
      k.save(); k.translate(L.c[0], L.c[1]); k.rotate(L.a);
      shape(k, `M${-POT.hw - 2} 0 Q0 -16 ${POT.hw + 2} 0 Z`, SP);
      shape(k, `M-4 -10 L4 -10 L3 -${KNOB} L-3 -${KNOB} Z`, FP * 1.6);
      k.restore();
    }

    // 刀：局部坐标握点在原点，+y 沿刀身；ang=π/2 时刀尖朝左平躺
    function knife(k, at, ang) {
      k.save(); k.translate(at[0], at[1]); k.rotate(ang);
      blot(k, 'M-1.4 -8 L1.4 -8 L1.4 0 L-1.4 0 Z');
      shape(k, 'M-2 0 L2.6 0 L2.6 15 Q0 15 -2 12.5 Z', FP * 1.4);
      k.restore();
    }

    // —— 人：站在案台后面，正面、不画脸；下半身被案台挡住 ——
    // 去菜篮拿放东西时上身往左探，揭锅盖时往右探，好让手够得着
    const lean = u => -14 * (win(u, [2.5, 2.75], [2.95, 3.15]) + win(u, [4.45, 4.7], [4.85, 5.2])) + 6 * win(u, [3.05, 3.2], [4.3, 4.5]);
    const BODY_X = 228, SHO_Y = 80, SHO_W = 16, UPPER = 38, FORE = 36, ARM_W = 7.4;
    // 两段手臂：肩到手，肘向外弯。右臂直接用 knee()（取 x 较大的解），左臂左右镜像后再用
    const elbow = (s, hd, side) => {
      if (side > 0) return knee(s, hd, UPPER, FORE);
      const e = knee([-s[0], s[1]], [-hd[0], hd[1]], UPPER, FORE);
      return [-e[0], e[1]];
    };
    function body(k, u) {
      const L = lean(u), sx = BODY_X + L;
      // 躯干：肩随前探移动，腰在案台后面不动
      shape(k, `M${sx - SHO_W} ${SHO_Y} Q${sx} ${SHO_Y - 5} ${sx + SHO_W} ${SHO_Y} L${BODY_X + 21} 152 L${BODY_X - 21} 152 Z`, SP);
      // 围裙：原作和服的靛蓝，挂脖带两笔
      paint(k, `M${sx - 10} 98 L${sx + 10} 98 L${BODY_X + 18} 152 L${BODY_X - 18} 152 Z`, INDIGO, FP * 1.4);
      pen(k, `M${sx - 10} 98 L${sx - 5} ${SHO_Y - 4} M${sx + 10} 98 L${sx + 5} ${SHO_Y - 4}`, FP * 1.2);
      pen(k, `M${BODY_X - 19} 122 L${BODY_X + 19} 122`, FP * 1.2);          // 围裙腰带
      // 脖子和头：头比肩多探一点；原作不画脸，头是纸色椭圆，后脑一个发髻
      const hx = sx + L * 0.15;
      pen(k, `M${sx - 3.5} ${SHO_Y - 3} L${hx - 3} ${SHO_Y - 12} M${sx + 3.5} ${SHO_Y - 3} L${hx + 3} ${SHO_Y - 12}`, SP);
      blot(k, `M${hx - 4.5} 38 a5 4.4 0 1 1 9 0 a5 4.4 0 1 1 -9 0 Z`);
      shape(k, `M${hx - 8.6} 56 a8.6 11 0 1 1 17.2 0 a8.6 11 0 1 1 -17.2 0 Z`, SP);
      blot(k, `M${hx - 8.6} 54 Q${hx - 8} 44 ${hx} 45 Q${hx + 8} 44 ${hx + 8.6} 54 Q${hx + 9.6} 42 ${hx} 42 Q${hx - 9.6} 42 ${hx - 8.6} 54 Z`);
    }
    function arms(k, u) {
      const sx = BODY_X + lean(u);
      [[-1, leftHand(u)], [1, rightHand(u)]].forEach(([side, hd]) => {
        const s = [sx + side * (SHO_W - 3), SHO_Y + 2], e = elbow(s, hd, side);
        limb(k, [s, e, hd], ARM_W, [0.6, 1.2], SP);
        shape(k, `M${hd[0] - 3.6} ${hd[1]} a3.6 3.2 0 1 1 7.2 0 a3.6 3.2 0 1 1 -7.2 0 Z`, FP * 1.4);   // 手
      });
    }

    // —— 胡萝卜的去向：切剩的叶头被左手扔进菜篮，新的一根从菜篮拿出来放上砧板 ——
    const STUB = [2.45, 2.95], FRESH = [4.8, 5.25];
    function carrots(k, u, onBoard) {
      const hd = leftHand(u), off = [hd[0] - REST_L[0], hd[1] - REST_L[1]], n = cutsDone(u);
      if (onBoard) {
        if (u < STUB[0]) wholeCarrot(k, n ? cutX(n - 1) : CA1, 0, 0);
        else if (u >= FRESH[1]) wholeCarrot(k, CA1, 0, 0);
        return;
      }
      // 手里拿着的这一根画在篮子前脸之前，伸进篮口以下就被前脸挡住
      if (u >= STUB[0] && u < STUB[1] + 0.05) wholeCarrot(k, cutX(CHOPS - 1), off[0], off[1]);
      if (u >= FRESH[0] && u < FRESH[1]) wholeCarrot(k, CA1, off[0], off[1]);
    }

    CELLS[12] = (k, w, h, u) => {
      paper(k);
      // 墙上一道腰线和几块墙砖的淡线，交代这是墙
      k.globalAlpha = 0.35;
      inkLine(k, 0, 112, CW, 112, FP, 41, 0.3);
      for (const [x, y] of [[20, 70], [150, 54], [500, 40], [508, 128], [190, 126]]) pen(k, `M${x} ${y} l14 0`, FP);
      k.globalAlpha = 1;
      windowView(k, u);
      utensils(k, u);
      body(k, u);
      counter(k);
      stove(k, u);
      waterJar(k);
      basketBack(k);
      carrots(k, u, false);
      fallingSlices(k, u, offBoard(u));
      pot(k);
      lid(k, u);
      boardAndSlices(k, u);
      carrots(k, u, true);
      knife(k, knifeHeld(u) ? rightHand(u) : KNIFE_DOWN, knifeHeld(u) ? knifeAng(u) : Math.PI / 2);
      arms(k, u);
      basketFront(k);
      steam(k, u);
    };
  }

  // @element 14
  // 溪边茶屋：原作没有这类演示，这里按原作 style.md 的分层画法（墨线 → 纸色遮挡 → 平涂 → 光）新编一幅「松下小亭、红栏拱桥、石灯笼」，
  // 让这几层一层层叠出来：先逐笔描线（后面的线先描、此时还透着），再铺纸色把被挡住的线盖掉，再一块块铺平涂色，最后天黑点灯，复位段淡回白纸
  {
    // 主线约 1 px、细节线按原作 0.4–0.6 倍、远山淡墨 0.42，与 #4-101、#4-104 一致
    const SP = 1.1, FP = 0.6, FAR = 0.42;
    const W = TAU / CYC; // 一周期一圈的角速度，星星闪烁取它的整数倍

    // —— 时间线（秒）——
    // 描线 0.1–1.95；纸色 2.0–3.0（各图层由后往前错开）；平涂 3.0–3.95；天黑 4.0–5.0；淡回白纸 5.4–6.3
    const T = { line0: 0.1, line1: 1.95, fill0: 2.0, fill1: 2.7, fillD: 0.3, paint0: 3.0, paint1: 3.72, paintD: 0.22, dusk0: 4.0, dusk1: 5.0, out0: 5.4, out1: 6.3 };
    // 天色：正午 τ 0.5 一直到 4 秒，再在 1 秒里走过黄昏到夜里 τ 0.92（原作 daynight.ts 的色带，用 kit 的 palette）
    const tauAt = u => 0.5 + 0.42 * smooth(T.dusk0, T.dusk1, u);
    // 每条线在描线段里占的那一截：按线长依次排开，相邻的线互相搭一点（OV），像几支笔接力，不会一条条干等
    const OV = 0.12;

    // —— 几何工具 ——
    // 所有线都先做成折线点列：线长好算（描线进度要用），也方便加一点固定的手抖
    const qb = (a, c, b, n = 10) => {
      const o = [];
      for (let i = 0; i <= n; i++) { const t = i / n, s = 1 - t; o.push([s * s * a[0] + 2 * s * t * c[0] + t * t * b[0], s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]]); }
      return o;
    };
    // 首尾相接的几段折线拼成一条（后一段的起点就是前一段的终点，去掉重复点）
    const cat = (...ps) => ps.reduce((o, p) => o.concat(o.length ? p.slice(1) : p), []);
    const rectP = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    const ovalP = (cx, cy, rx, ry, n = 20) => Array.from({ length: n }, (_, i) => [cx + rx * Math.cos(TAU * i / n), cy + ry * Math.sin(TAU * i / n)]);
    const fillPath = pts => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
    // 长于 8 px 的段先细分，再沿弧长加两个慢正弦的偏移（≤0.28 px），直线也带一点原作 inkDefs() 那种墨线的抖
    let SEED = 0;
    function inkStroke(src, w, a) {
      const pts = [];
      src.forEach((q, i) => {
        if (i) { const pr = src[i - 1], n = Math.ceil(Math.hypot(q[0] - pr[0], q[1] - pr[1]) / 8); for (let j = 1; j < n; j++) pts.push(lerpP(pr, q, j / n)); }
        pts.push(q);
      });
      const sd = ++SEED, p = new Path2D();
      let len = 0;
      pts.forEach(([x, y], i) => {
        if (i) len += Math.hypot(x - pts[i - 1][0], y - pts[i - 1][1]);
        const dx = 0.28 * Math.sin(len * 0.21 + sd * 1.7), dy = 0.28 * Math.sin(len * 0.17 + sd * 2.3 + 1);
        if (i) p.lineTo(x + dx, y + dy); else p.moveTo(x + dx, y + dy);
      });
      // D 是虚线的一节：比折线长稍长一点，抖动多出来的长度也盖得住
      return { p, len, w, a, D: len * 1.03 + 1 };
    }

    // —— 图层 ——
    // 场景按「从后往前」分成若干图层；每层有纸色填充、平涂块、墨线三样，画的时候也按这个顺序叠
    const LAYERS = [];
    let L = null;
    const layer = () => { L = { fills: [], paints: [], strokes: [], win: null }; LAYERS.push(L); };
    const ln = (pts, w = SP, a = 1) => L.strokes.push(inkStroke(pts, w, a));
    // 闭合的物件：纸色填充 + 一圈墨线
    const sh = (pts, w = SP, a = 1) => { L.fills.push(fillPath(pts)); ln(pts.concat([pts[0]]), w, a); };
    // 平涂块：几块多边形合成一块，按包围盒从左往右刷上去
    const pa = (polys, col) => {
      const p = new Path2D(), xs = [], ys = [];
      polys.forEach(q => { p.addPath(fillPath(q)); q.forEach(([x, y]) => { xs.push(x); ys.push(y); }); });
      L.paints.push({ p, col, x0: Math.min(...xs) - 1, x1: Math.max(...xs) + 1, y0: Math.min(...ys) - 1, y1: Math.max(...ys) + 1 });
    };

    // 平涂色两种：栏杆和柱子的红（同 #4-100 的红伞 #b3412d），松针的暗绿；夜里按原作 nightTint() 压暗
    const RED = hx('#b3412d'), PINE = hx('#6f8455');
    const nightTint = (c, inkT, amt = 0.55) => mc(c, mc(c, [12, 16, 30], 0.6), inkT * amt);
    const WARM_WIN = hx('#ffd58a');   // 原作窗灯的暖黄
    const WARMGLOW = [[0, '255,213,138', 0.75], [0.45, '255,184,92', 0.28], [1, '255,184,92', 0]];

    const HZ = 142;   // 远岸线：远山和天空的下沿

    // 一串控制点 → 平滑曲线：相邻两点的中点当端点、点本身当控制点，逐段二次曲线
    const chain = (pts, n = 8) => {
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      let o = [pts[0]], prev = pts[0];
      for (let i = 1; i < pts.length - 1; i++) { const m = mid(pts[i], pts[i + 1]); o = cat(o, qb(prev, pts[i], i === pts.length - 2 ? pts[i + 1] : m, n)); prev = m; }
      return o;
    };
    // 拱桥三条弧的控制点 x 都在两端正中，x 随参数线性变化，所以按 x 直接求 y
    const arcY = (a, c, b, x) => { const t = (x - a[0]) / (b[0] - a[0]), s = 1 - t; return s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]; };
    // 松针簇：日本画里松树那种底边平、顶上一串小圆鼓的「云片」
    const pad = (cx, cy, rw, rh, n) => {
      let top = [[cx + rw, cy]];
      for (let j = 0; j < n; j++) {
        const xa = cx + rw - 2 * rw * j / n, xb = cx + rw - 2 * rw * (j + 1) / n, xm = (xa + xb) / 2;
        const e = Math.sin(Math.PI * (j + 0.5) / n);   // 中间的圆鼓高、两头低
        top = cat(top, qb([xa, cy - rh * e * 0.55], [xm, cy - rh * (0.55 * e + 0.9)], [xb, cy - rh * Math.sin(Math.PI * (j + 1) / n) * 0.55], 6));
      }
      return cat(top, qb([cx - rw, cy], [cx, cy + 3], [cx + rw, cy], 6));
    };

    // —— 0 远山（淡墨）——
    layer();
    {
      const ridge = chain([[-4, 110], [50, 82], [110, 102], [170, 74], [240, 100], [300, 90], [360, 68], [420, 90], [470, 62], [543, 92]]);
      sh(cat(ridge, [[543, HZ], [-4, HZ]]), SP * 0.8, FAR);
      const near = chain([[268, HZ], [320, 118], [380, 106], [440, 122], [500, 110], [543, 120]]);
      sh(cat(near, [[543, HZ]]), SP * 0.8, FAR * 1.4);
      [[[356, 74], [344, 90], [350, 104]], [[466, 68], [478, 84], [470, 98]], [[168, 80], [180, 92], [176, 104]], [[48, 88], [38, 100]]].forEach(q => ln(q.length > 2 ? qb(q[0], q[1], q[2], 6) : q, FP, FAR));
      ln([[-4, HZ], [543, HZ]], FP, FAR);
    }

    // —— 1 两岸 ——
    layer();
    {
      sh([[-4, 154], [296, 154], [306, 160], [314, 172], [-4, 172]]);
      sh([[543, 158], [470, 158], [462, 164], [454, 172], [543, 172]]);
      // 岸边的石块、草（原作「道具让眼睛有地方停」）
      [[20, 166, 9, 4], [52, 168, 7, 3.5], [262, 167, 8, 4], [292, 168, 7, 3.4], [488, 167, 8, 4], [522, 168, 9, 3.6]].forEach(([x, y, rx, ry]) => sh(ovalP(x, y, rx, ry, 14), FP * 1.6));
      [[80, 154], [112, 154], [282, 154], [530, 158]].forEach(([x, y]) => {
        ln(qb([x, y], [x - 1, y - 4], [x - 4, y - 7], 4), FP); ln([[x + 1, y], [x + 2, y - 8]], FP); ln(qb([x + 2, y], [x + 4, y - 4], [x + 7, y - 6], 4), FP);
      });
      ln([[30, 160], [74, 160]], FP, 0.6); ln([[190, 161], [240, 161]], FP, 0.6); ln([[482, 162], [506, 162]], FP, 0.6);
    }

    // —— 2 松（在茶屋后面，下半截被屋子挡住）——
    layer();
    {
      sh(cat(qb([146, 150], [136, 108], [156, 70]), qb([156, 70], [170, 46], [150, 26]), [[157, 24]], qb([157, 24], [180, 48], [164, 72]), qb([164, 72], [148, 108], [160, 150])));
      // 枝：两笔开口的细枝，从树干伸到松针簇底下
      [[[160, 58], [196, 44], [228, 46], 2.4], [[146, 84], [116, 70], [90, 68], 2.2], [[154, 38], [128, 26], [108, 26], 1.8]].forEach(([a, c, b, wd]) => {
        ln(qb([a[0], a[1] - wd], [c[0], c[1] - wd], b, 8)); ln(qb([a[0], a[1] + wd], [c[0], c[1] + wd * 0.5], [b[0], b[1] + 0.6], 8));
      });
      // 树皮：几道短弧
      [[150, 116, 148, 106], [156, 96, 152, 88], [158, 64, 160, 56], [158, 44, 156, 36]].forEach(([x0, y0, x1, y1]) => ln(qb([x0, y0], [x0 + 3, (y0 + y1) / 2], [x1, y1], 4), FP));
      const pads = [[232, 46, 34, 12, 5], [88, 68, 30, 11, 4], [108, 26, 24, 9, 4], [160, 20, 22, 8, 3], [204, 64, 22, 8, 3]];
      pads.forEach(([cx, cy, rw, rh, n]) => {
        const q = pad(cx, cy, rw, rh, n);
        sh(q);
        pa([q], 'pine');
        // 松针：底边上一排短竖线
        for (let x = cx - rw + 6; x < cx + rw - 4; x += 7) ln([[x, cy - 1], [x + 1.5, cy - rh * 0.55]], FP, 0.8);
      });
    }

    // —— 3 茶屋 ——
    layer();
    {
      sh(rectP(130, 146, 262, 152));                       // 缘侧
      [134, 196, 258].forEach(x => ln([[x, 152], [x, 156]], SP));
      sh(rectP(142, 110, 252, 146));                       // 墙
      [176, 218].forEach(x => ln([[x, 112], [x, 146]], SP));
      // 左：格子拉门
      sh(rectP(147, 115, 171, 146), FP * 1.6);
      [155, 163].forEach(x => ln([[x, 115], [x, 146]], FP));
      [123, 131, 139].forEach(y => ln([[147, y], [171, y]], FP));
      // 中：灰泥墙上的圆窗，天黑后窗灯亮在这里
      const win = ovalP(197, 128, 11, 11, 28);
      sh(win, SP);
      L.win = { p: fillPath(win), x: 197, y: 128, r: 11, thr: 0.25 };
      [191, 197, 203].forEach(x => { const h = Math.sqrt(121 - (x - 197) ** 2); ln([[x, 128 - h], [x, 128 + h]], FP); });
      [123, 133].forEach(y => { const w2 = Math.sqrt(121 - (y - 128) ** 2); ln([[197 - w2, y], [197 + w2, y]], FP); });
      // 右：竖格子，每第四根通到顶（原作格子的节奏）
      for (let i = 0, x = 222; x <= 249; i++, x += 3.4) ln([[x, i % 4 ? 118 : 112], [x, 146]], FP);
      ln([[220, 118], [252, 118]], FP);
      // 屋顶：歇山顶简化成正立面的梯形，瓦沟向屋脊收拢，檐口一排圆瓦头，屋脊两端起翘
      sh([[118, 109], [276, 109], [262, 100], [242, 87], [152, 87], [132, 100]]);
      for (let i = 1; i < 16; i++) { const t = i / 16; ln([[mix(124, 270, t), 108], [mix(154, 240, t), 88]], FP, 0.85); }
      sh([[114, 108], [280, 108], [278, 113], [116, 113]], SP);
      for (let x = 122; x <= 272; x += 7.5) ln(ovalP(x, 110.5, 1.5, 1.5, 10).concat([[x + 1.5, 110.5]]), FP);
      sh([[146, 88], [248, 88], [252, 82], [256, 79], [250, 82.5], [144, 82.5], [138, 79], [142, 82]], SP);
      // 檐下挂的竹帘：一排横线
      sh(rectP(224, 113, 250, 117.5), FP * 1.4);
    }

    // —— 4 红栏拱桥（跨过茶屋右边流出来的小溪）——
    layer();
    {
      // 控制点 y = 2·拱顶 − 两端均值：桥面拱顶约 y 128，桥洞拱顶约 y 150
      const A = [[292, 156], [384, 99], [476, 158]];           // 桥面
      const B = A.map(([x, y]) => [x, y + 6]);                  // 桥面外沿下缘
      const R = A.map(([x, y]) => [x, y - 13]);                 // 扶手上沿
      const U = [[314, 171], [384, 128], [454, 172]];           // 桥洞
      const arc = (q, x0, x1, n = 14) => Array.from({ length: n + 1 }, (_, i) => { const x = mix(x0, x1, i / n); return [x, arcY(q[0], q[1], q[2], x)]; });
      sh(cat(arc(A, 292, 476), [[478, 166], [470, 172], [458, 172]], arc(U, 454, 314), [[310, 172], [298, 172], [290, 164]]));
      ln(arc(B, 293, 475));
      for (let x = 304; x < 470; x += 9) ln([[x, arcY(A[0], A[1], A[2], x) + 1], [x, arcY(B[0], B[1], B[2], x) - 1]], FP, 0.8);
      // 桥洞里的石缝
      [[330, 160], [350, 150], [418, 150], [438, 160]].forEach(([x, y]) => ln([[x, y], [x + (x < 384 ? 6 : -6), y - 4]], FP, 0.7));
      // 扶手：一条红的横木、一排红的望柱，栏下一道细的中横木
      const posts = [];
      for (let x = 296; x <= 474; x += 16.2) posts.push(x);
      const rail = cat(arc(R, 292, 476), arc(R.map(([x, y]) => [x, y + 3]), 476, 292));
      const postP = posts.map(x => rectP(x - 1.6, arcY(R[0], R[1], R[2], x) + 2.5, x + 1.6, arcY(A[0], A[1], A[2], x) - 0.3));
      postP.forEach(q => sh(q, FP * 1.6));
      sh(rail, FP * 1.6);
      pa(postP.concat([rail]), 'red');
      ln(arc(R.map(([x, y]) => [x, y + 8]), 296, 472), FP);
      // 两头的宝珠
      [292, 476].forEach(x => { const y = arcY(R[0], R[1], R[2], x); sh(cat(qb([x - 2.6, y + 1], [x - 3.2, y - 4], [x, y - 7], 5), qb([x, y - 7], [x + 3.2, y - 4], [x + 2.6, y + 1], 5)), FP * 1.6); });
    }

    // —— 5 石灯笼（右岸，夜里火袋亮）——
    layer();
    {
      sh(rectP(495, 165, 521, 171));
      sh([[503, 165], [513, 165], [512, 147], [504, 147]]);
      sh([[497, 147], [519, 147], [517, 142], [499, 142]]);
      sh(rectP(500, 128, 516, 142));
      const fire = rectP(504.5, 131, 511.5, 139.5);
      sh(fire, FP * 1.6);
      L.win = { p: fillPath(fire), x: 508, y: 135, r: 6, thr: 0.4 };
      sh(cat(qb([491, 129], [500, 126], [508, 117], 6), qb([508, 117], [516, 126], [525, 129], 6), [[521, 130], [495, 130]]));
      sh(ovalP(508, 114.5, 2.4, 2.8, 12), FP * 1.6);
    }
    // —— 6 水面（最前面：两岸之间的溪口和近处的水）——
    // 一排排固定位置的短横线，越近越疏越长
    layer();
    {
      for (let r = 0; r < 6; r++) {
        const y = 177 + r * 5 + r * r * 0.4;
        let x = -6 - rnd(r, 31) * 30;
        for (let i = 0; x < CW; i++) {
          const len = mix(14, 40, rnd(r, 40 + i)) * (1 + r * 0.12);
          ln([[x, y], [x + len, y]], FP, 0.75);
          x += len + mix(16, 44, rnd(r, 60 + i));
        }
      }
      [[332, 158, 354], [404, 157, 426], [326, 166, 348], [362, 164, 390], [420, 166, 446]].forEach(([x0, y, x1]) => ln([[x0, y], [x1, y]], FP, 0.65));
    }

    // —— 排好描线、平涂的时刻 ——
    // 描线：所有笔画按图层从后往前、层内按定义顺序排成一条，按长度分 0–1 的进度区间
    const ALL = [].concat(...LAYERS.map(l => l.strokes));
    const TOT = ALL.reduce((s, x) => s + x.len, 0);
    ALL.reduce((acc, s) => { s.a0 = acc / TOT * (1 - OV); s.a1 = (acc + s.len) / TOT * (1 - OV) + OV; return acc + s.len; }, 0);
    const PAINTS = [].concat(...LAYERS.map(l => l.paints));
    PAINTS.forEach((p, i) => { p.t0 = T.paint0 + (T.paint1 - T.paint0) * i / Math.max(1, PAINTS.length - 1); });
    const fillAt = (i, u) => smooth(0, 1, (u - (T.fill0 + (T.fill1 - T.fill0) * i / (LAYERS.length - 1))) / T.fillD);

    // —— 夜空 ——
    const STARS = Array.from({ length: 14 }, (_, i) => [10 + rnd(i, 71) * 520, 6 + rnd(i, 72) * 60, 0.5 + rnd(i, 73) * 0.6, 2 + Math.floor(rnd(i, 74) * 6)]);
    const radial = (k, x, y, r, stops, alpha) => {
      if (alpha < 0.004) return;
      const g = k.createRadialGradient(x, y, 0, x, y, r);
      stops.forEach(([o, c, a]) => g.addColorStop(o, `rgba(${c},${a})`));
      k.globalAlpha = alpha; k.fillStyle = g; k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill(); k.globalAlpha = 1;
    };

    CELLS[13] = (k, w, h, u) => {
      const tau = tauAt(u), P = palette(tau);
      const ink = css(P.ink), paperC = css(P.paper);
      const COL = { red: css(nightTint(RED, P.inkT)), pine: css(nightTint(PINE, P.inkT)) };
      const lineProg = (u - T.line0) / (T.line1 - T.line0);
      k.save();
      k.lineCap = 'round'; k.lineJoin = 'round';
      k.fillStyle = paperC; k.fillRect(-2, -2, CW + 4, CH + 4);
      // 天空的渐变算在纸色那一层里：远山铺纸色时一起出来；天黑后星星闪
      const skyA = fillAt(0, u);
      if (skyA > 0.004) {
        const g = k.createLinearGradient(0, 0, 0, HZ);
        g.addColorStop(0, css(P.top)); g.addColorStop(1, css(P.bot));
        k.globalAlpha = skyA; k.fillStyle = g; k.fillRect(-2, -2, CW + 4, HZ + 2);
        if (P.night > 0.01) {
          k.fillStyle = '#f5efda';
          STARS.forEach(([x, y, r, n], i) => { k.globalAlpha = skyA * P.night * (0.55 + 0.45 * Math.sin(n * W * u + i)); k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill(); });
        }
        k.globalAlpha = 1;
      }
      const glows = [];
      LAYERS.forEach((Ly, i) => {
        // 纸色：这一层的填充盖住它后面各层已经描好的线
        const fa = fillAt(i, u);
        if (fa > 0.004) {
          k.globalAlpha = fa; k.fillStyle = paperC;
          Ly.fills.forEach(p => k.fill(p));
          k.globalAlpha = 1;
        }
        // 平涂：每块从左往右刷开，刷子边缘留 6 px 的过渡
        Ly.paints.forEach(pb => {
          const s = clamp((u - pb.t0) / T.paintD);
          if (s <= 0) return;
          const x = mix(pb.x0 - 6, pb.x1, ease(s));
          k.save(); k.beginPath(); k.rect(pb.x0 - 6, pb.y0, x - pb.x0 + 6, pb.y1 - pb.y0); k.clip();
          k.fillStyle = COL[pb.col]; k.fill(pb.p);
          k.restore();
        });
        // 光：窗格和石灯笼的火袋按各自的暗度阈值亮起
        if (Ly.win && P.lamp > 0.01) {
          const lit = smooth(Ly.win.thr, Ly.win.thr + 0.25, P.lamp);
          k.fillStyle = css(mc(P.paper, WARM_WIN, lit * 0.92)); k.fill(Ly.win.p);
          glows.push([Ly.win, lit]);
        }
        // 墨线：还没描完的线用一节虚线露出前面那一截
        k.strokeStyle = ink;
        Ly.strokes.forEach(s => {
          const p = clamp((lineProg - s.a0) / (s.a1 - s.a0));
          if (p <= 0) return;
          k.globalAlpha = s.a; k.lineWidth = s.w;
          if (p < 1) { k.setLineDash([s.D, s.D]); k.lineDashOffset = s.D - p * s.len; }
          k.stroke(s.p);
          if (p < 1) { k.setLineDash([]); k.lineDashOffset = 0; }
        });
        k.globalAlpha = 1;
      });
      glows.forEach(([g, lit]) => radial(k, g.x, g.y, g.r * 2.4, WARMGLOW, lit * 0.85));
      // 复位：整张纸色盖上来，回到白纸；最后 0.1 秒是空白纸，与 0 秒相接
      const out = smooth(T.out0, T.out1, u);
      if (out > 0.004) { k.globalAlpha = out; k.fillStyle = PAPER; k.fillRect(-2, -2, CW + 4, CH + 4); k.globalAlpha = 1; }
      k.restore();
    };
  }

  // @shared
  // （本包目前没有跨元素共用的代码）
  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});
