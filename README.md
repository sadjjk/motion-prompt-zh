# Motion Prompt 简体中文版

用专业名称向 AI 说清你要的动效。每个效果都有动态示例、中文解释和可复制的 Prompt，把运动规格和参考实现一起交给 AI。

**在线体验**：[sadjjk.github.io/motion-prompt-zh](https://sadjjk.github.io/motion-prompt-zh/)

## 四大类

| 大类 | 内容 | 分类 |
|---|---|---|
| **界面与网页** `#1` | 弹窗、开关、导航、状态，滚动、悬停、光标、加载等交互动效，以及 AI 状态、交互文字与动态图表；适合给网页或 App 挑动效 | 组件 · 页面 · 指针交互 · 反馈 · 文字与数据 |
| **动态图形** `#2` | 入场与缓动、文字动画、图形与物件、粒子光效与转场；适合片头、讲解视频、演示动画 | 运动原理 · 文字动画 · 图形与物件 · 特效与转场 |
| **剪辑与摄影** `#3` | 镜头运动、剪辑转场、景别与构图、布光与光色、镜头效果与调色；适合写视频或图片生成提示词、定剪辑方案 | 镜头与剪辑 · 景别与构图 · 光线与色彩 · 镜头效果与后期 |
| **审美风格** `#4` | 扁平、等轴、拼贴等整套动画画风，构成主义、孟菲斯、故障艺术、像素风等艺术流派，孔版印刷、几何纹样与书法、青花瓷；可当视频开场、首屏背景、海报封面 | 动画画风 · 艺术流派 · 工艺与纹样 · 东方传统 |

每个分类下再分小类，网站和 Skill 都按「大类 → 分类 → 小类」筛选。各小类的款数与编号范围见 [packs/README.md](packs/README.md)（由 build 生成）。

编号格式为 `#大类-序号`，如 `#1-001`，每个大类从 001 连续编号。同一主版本内编号不变；新效果放进最合适的小类，编号接着本大类往后排。v1.0.0 按新分类整体重排过一次编号，旧编号不再对应。

## 使用方式

### 纯 Skill 运行（强烈推荐）

装一个 Skill，在 AI 对话里直接用，不用下载仓库：

```sh
npx skills add sadjjk/motion-prompt-zh --skill motion-prompt-zh
```

然后直接对 AI 说：

- "从 motion-prompt 动效库里挑几个合适的动画"
- "搜索和文字入场有关的动画"
- "用 #2-056 实现这个动效"
- "把 #3-008 的镜头运动写成视频生成提示词"

AI 会打开效果库让你挑选，选好后点"发送给 AI"，它会读取真实的规格和代码，实现到你的项目里。

### 建议与反馈

本仓库只发布网站与 Skill，不接受 Pull Request。想补充名称、推荐案例或申请更正，请提 Issue：

- [提交名称或分类包](https://github.com/sadjjk/motion-prompt-zh/issues/new?template=1-contribution.yml)
- [推荐案例](https://github.com/sadjjk/motion-prompt-zh/issues/new?template=2-example.yml)
- [申请删除或更正](https://github.com/sadjjk/motion-prompt-zh/issues/new?template=3-removal.yml)

## 来源与授权

- 原项目：[showheyohtaki/motion-prompt](https://github.com/showheyohtaki/motion-prompt)，作者 Shohei Ohtaki（[@showheyohtaki](https://x.com/showheyohtaki)）。
- 中文翻译与本地化：[rainman016/motion-prompt-zh](https://github.com/rainman016/motion-prompt-zh)。
- [MIT License](LICENSE) © 2026 Shohei Ohtaki。使用参考代码时请保留版权行。案例帖子及其媒体归原作者所有，不在 MIT 许可范围内，详见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。
效果代码按画布尺寸与周期放在几个代码包（`packs/<包>/`）里，下面按包写明来源；每款的作者与原作见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。

- `aiux` 包中署名 Jakub Antalik 的效果改写自 [Libraries.dev](https://libraries.dev/)，作者 Jakub Antalik，[MIT License](https://github.com/Jakubantalik/Libraries.dev/blob/main/LICENSE)。使用这部分代码时保留其版权行。
- `aiux` 包的液态玻璃透镜改写自 [liquid-glass](https://github.com/samasante/liquid-glass)，作者 Sam Asante，[MIT License](https://github.com/samasante/liquid-glass/blob/main/LICENSE)；未复制原库源码。使用这部分代码时保留其版权行。
- `uxmotion` 包中署名 Seokwoooo 的效果改写自 [Lucian UX/UI Prompt](https://lucianlabs.dev/uxui-prompt/)，作者 Seokwoooo，MIT License。使用这部分代码时保留其版权行。
- `mgstyles` 包中署名 Vincentwei1021 的效果改写自 [mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15)，作者 Vincentwei1021，MIT License；未使用原作的照片、纹理、字形与音频。使用这部分代码时保留其版权行。
- `scenes` 包中署名 Yun 的效果改写自 [Motion Atlas](https://github.com/skylarzzzz/motion-atlas)，作者 Yun，MIT License。使用这部分代码时保留其版权行。
- `ui`、`lp`、`motion2` 包中署名 Emil Kowalski 的效果改写自 [skills](https://github.com/emilkowalski/skills)，作者 Emil Kowalski，MIT License。使用这部分代码时保留其版权行。
- `ui`、`motion2`、`scenes` 包中署名 illli Ai Studio 的效果改写自 [ui2v](https://ui2v.com/) 上 illli Ai Studio 的动效包，MIT-0（MIT No Attribution）；未使用原作的代码与字体。我们仍在版权行中署名作者。
- `ui`、`lp`、`aiux`、`uxmotion`、`motion2`、`scenes` 包中署名 Hannah 的效果改写自 Hannah 整理的 [KittenJam Motion Library](https://kittenjam-motion-library.vercel.app/)；原站声明「僅供個人參考學習」，未使用原站的提示词、代码与字体，名称、说明与提示词为本仓库自写，详见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。版权行署名 Hannah。
- `ui`、`lp`、`uxmotion`、`motion2` 包中署名 sadjjk 的效果为本仓库原创，MIT License © 2026 sadjjk。使用这部分代码时保留其版权行。
- `explainer` 包的效果改写自 [vibe-knowledge](https://github.com/andyhuo520/vibe-knowledge)，作者 Berryxia，MIT License；只取画风，画面为通用案例，未使用原作的风格图、视频、配乐与字体。使用这部分代码时保留其版权行。
- `webfx` 包的效果为本仓库原创，MIT License © 2026 sadjjk；效果思路参考 [React Bits](https://reactbits.dev/)（作者 David Haz），代码按其效果说明与在线演示独立重写，未复制或移植其源码。使用这部分代码时保留其版权行。
- `vibefx` 包的效果改写自 [vibe-fx](https://github.com/ai-martin-lau/vibe-fx)，作者 ai-martin-lau，MIT License；未使用原作的生图素材、three.js 场景与字体。使用这部分代码时保留其版权行。
- `drawstyles` 包的效果为本仓库原创，MIT License © 2026 sadjjk；画风思路参考 [anidoodle](https://github.com/alexgreensh/anidoodle)（作者 Alex Greenshpun），代码按其画风说明与效果图独立重写，未复制或移植其源码。使用这部分代码时保留其版权行。
- `infostyles` 包的效果为本仓库原创，MIT License © 2026 sadjjk；风格思路参考 [lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar)（作者 Lemomo），代码按其风格说明独立重写，未复制或移植其源码。使用这部分代码时保留其版权行。
- `artstyles` 包的效果改写自 [huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion)，作者花叔，MIT License；未使用原作的笔画数据、字体与卡通形象。使用这部分代码时保留其版权行。
- `camera`、`photo`、`motion2`、`scenes`、`mgstyles` 包中署名阿梦freedom 的效果，术语与定义参考 [镜语](https://idea.ameng.dev/)（[jingyu-skill](https://github.com/hemengke1997/jingyu-skill)，作者阿梦freedom，MIT License）；动画为本仓库实现，未使用原站的演示代码、图片与文字。使用这部分代码时保留其版权行。
- 每款的版权行写在它的代码首行（`e/<编号>.txt`），Skill 的 `get` 会一并取回。
