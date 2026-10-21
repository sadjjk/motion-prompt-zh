# Motion Prompt 简体中文版

用专业名称向 AI 说清你要的动效。每个效果都有动态示例、中文解释和可复制的 Prompt，把运动规格和参考实现一起交给 AI。

**在线体验**：[sadjjk.github.io/motion-prompt-zh](https://sadjjk.github.io/motion-prompt-zh/)

## 三大类

| 大类 | 内容 | 分类包 |
|---|---|---|
| **界面与网页** `#1` | 弹窗、开关、导航、状态，滚动、悬停、加载等交互动效；适合给网页或 App 挑动效 | UI 组件 `ui` · 落地页与网页动效 `lp` |
| **动态图形** `#2` | 入场、文字、图形、转场与强调等图形动画；适合片头、讲解视频、演示动画 | 动态图形基础 `motion` · 动态图形进阶 `motion2` |
| **剪辑与摄影** `#3` | 镜头运动、拍摄风格、剪辑转场、布光、镜头效果与色调；适合写视频或图片生成提示词、定剪辑方案 | 镜头运动与剪辑 `camera` · 摄影光线与风格 `photo` |

编号格式为 `#大类-序号`，如 `#1-001`，按页面展示顺序排列。

## 使用方式

### 纯 Skill 运行（强烈推荐）

装一个 Skill，在 AI 对话里直接用，不用下载仓库：

```sh
npx skills add sadjjk/motion-prompt-zh --skill motion-prompt-zh
```

然后直接对 AI 说：

- "打开中文动效库，帮我挑几个适合首页的动画"
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
