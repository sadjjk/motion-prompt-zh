# Motion Prompt 简体中文版

用专业名称向 AI 说清你要的动效。每个效果都有动态示例、中文解释和可复制的 Prompt，把运动规格和参考实现一起交给 AI。

**在线体验**：[sadjjk.github.io/motion-prompt-zh](https://sadjjk.github.io/motion-prompt-zh/)

## 四大类

| 大类 | 内容 | 分类包 |
|---|---|---|
| **界面与网页** `#1` | 弹窗、开关、导航、状态，滚动、悬停、加载等交互动效，以及 AI 产品的思考与加载、交互文字、光标交互与动态图表；适合给网页或 App 挑动效 | UI 组件 `ui` · 落地页与网页动效 `lp` · 光效与液态 `aiux` · 交互与数据动效 `uxmotion` |
| **动态图形** `#2` | 入场、文字、图形、转场与强调等图形动画，以及扁平、线条、等轴、像素、赛博朋克等整套 MG 风格；适合片头、讲解视频、演示动画 | 动态图形基础 `motion` · 动态图形进阶 `motion2` · MG 风格 `mgstyles` |
| **剪辑与摄影** `#3` | 镜头运动、拍摄风格、剪辑转场、布光、镜头效果与色调；适合写视频或图片生成提示词、定剪辑方案 | 镜头运动与剪辑 `camera` · 摄影光线与风格 `photo` |
| **氛围元素** `#4` | 文字、科技、纹样、器物等题材的整幅风格化动态画面；可当视频开场、首屏背景、海报封面与演示过场 | 风格画面 `scenes` |

编号格式为 `#大类-序号`，如 `#1-001`。编号固定不变，与展示位置无关；新效果放进最合适的分类，编号接着本大类往后排，所以一个分类包的编号可能分成几段，如 `#1 001~024 · 098~102`。

## 使用方式

### 纯 Skill 运行（强烈推荐）

装一个 Skill，在 AI 对话里直接用，不用下载仓库：

```sh
npx skills add sadjjk/motion-prompt-zh --skill motion-prompt-zh
```

然后直接对 AI 说：

- "从 motion-prompt 动效库里挑几个合适的动画"
- "搜索和文字入场有关的动画"
- "用 #2-012 实现这个动效"
- "把 #3-008 的镜头运动写成视频生成提示词"

AI 会打开效果库让你挑选，选好后点"发送给 AI"，它会读取真实的规格和代码，实现到你的项目里。

### 本地运行

需要修改或新增动效时使用。需要 Node.js 18+ 和 Python 3：

```sh
git clone https://github.com/sadjjk/motion-prompt-zh.git
cd motion-prompt-zh
node tools/build.mjs
python3 -m http.server 8000
```

打开 http://127.0.0.1:8000/ 。数据格式见 [FORMAT.md](FORMAT.md)，修改后的验证流程见 [AGENTS.md](AGENTS.md)。

## 来源与授权

- 原项目：[showheyohtaki/motion-prompt](https://github.com/showheyohtaki/motion-prompt)，作者 Shohei Ohtaki（[@showheyohtaki](https://x.com/showheyohtaki)）。
- 中文翻译与本地化：[rainman016/motion-prompt-zh](https://github.com/rainman016/motion-prompt-zh)。
- [MIT License](LICENSE) © 2026 Shohei Ohtaki。使用参考代码时请保留版权行。案例帖子及其媒体归原作者所有，不在 MIT 许可范围内，详见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。
- 光效与液态（`aiux`）改写自 [Libraries.dev](https://libraries.dev/)，作者 Jakub Antalik，[MIT License](https://github.com/Jakubantalik/Libraries.dev/blob/main/LICENSE)。使用这部分代码时保留其版权行。
- 交互与数据动效（`uxmotion`）改写自 [Lucian UX/UI Prompt](https://lucianlabs.dev/uxui-prompt/)，作者 Seokwoooo，MIT License。使用这部分代码时保留其版权行。
- MG 风格（`mgstyles`）改写自 [mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15)，作者 Vincentwei1021，MIT License；未使用原作的照片、纹理、字形与音频。使用这部分代码时保留其版权行。
- 风格画面（`scenes`）改写自 [Motion Atlas](https://github.com/skylarzzzz/motion-atlas)，作者 Yun，MIT License。使用这部分代码时保留其版权行。
- `#1-098`～`#1-107`、`#2-064` 改写自 [skills](https://github.com/emilkowalski/skills)，作者 Emil Kowalski，MIT License。使用这部分代码时保留其版权行。
- `#1-108`～`#1-113`、`#4-033`～`#4-035`、`#2-065`～`#2-067` 改写自 [ui2v](https://ui2v.com/) 上 illli Ai Studio 的动效包，MIT-0（MIT No Attribution）；未使用原作的代码与字体。我们仍在版权行中署名作者。
- `#1-114`～`#1-141`、`#2-068`～`#2-085`、`#4-036`～`#4-039` 改写自 Hannah 整理的 [KittenJam Motion Library](https://kittenjam-motion-library.vercel.app/)；原站声明「僅供個人參考學習」，未使用原站的提示词、代码与字体，名称、说明与提示词为本仓库自写，详见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。版权行署名 Hannah。
