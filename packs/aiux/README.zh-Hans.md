<!-- 由 tools/build.mjs 从 meta.json 生成，请修改源文件后重新构建。 -->

# 光效与液态

13 个效果 · #1 049~060 · 128 · 分类包 `aiux` · 其他语言: [English](README.md) / [日本語](README.ja.md)

找到效果名称后，直接告诉 AI；补充持续时间、强度与运动对象，结果会更接近你的想法。

## 加载与思考

| 编号 | 中文名称 | 英文名称 | 名称解释 | 向 AI 提需求的示例 |
|---|---|---|---|---|
| [#1-049](https://sadjjk.github.io/motion-prompt-zh/#1-049) | **环绕光束** | Border beam | 一道彩色光沿边框绕行，表示正在处理 | AI 生成回复期间，给输入框加环绕光束，光沿边框绕一圈 4.8 秒。 |
| [#1-050](https://sadjjk.github.io/motion-prompt-zh/#1-050) | **底边光束** | Line beam | 光沿输入框底边左右扫动，表示正在搜索 | 提交搜索到结果返回之间，给搜索框加底边光束，光沿底边左右往返，单程 2.2 秒。 |
| [#1-051](https://sadjjk.github.io/motion-prompt-zh/#1-051) | **内呼吸光晕** | Inner pulse | 彩色光在按钮内部明暗呼吸，吸引注意 | 给“Ask AI”按钮加内呼吸光晕，彩光在按钮内部明暗呼吸，一次 2.4 秒，不溢出按钮。 |
| [#1-052](https://sadjjk.github.io/motion-prompt-zh/#1-052) | **外扩呼吸光晕** | Outer pulse | 彩光在输入框外侧扩散又收回，引导用户在这里输入 | 给首页主输入框加外扩呼吸光晕，光向外扩 4–18 px，一次呼吸 2.4 秒。 |
| [#1-053](https://sadjjk.github.io/motion-prompt-zh/#1-053) | **思考球·运转** | Thinking orb: working | 粒子沿倾斜轨道绕点阵球运行，表示 AI 正在工作 | 工具执行期间，在“Working…”旁放思考球，粒子沿三条轨道绕点阵球运行。 |
| [#1-054](https://sadjjk.github.io/motion-prompt-zh/#1-054) | **思考球·搜索** | Thinking orb: searching | 一条亮经线扫过点阵地球，表示 AI 正在搜索 | 联网搜索期间，在“Searching the web…”旁放思考球，一条光线扫过点阵地球。 |
| [#1-055](https://sadjjk.github.io/motion-prompt-zh/#1-055) | **思考球·聆听** | Thinking orb: listening | 纬线环像声波一样起伏，表示正在聆听语音 | 语音输入开麦期间，在“Listening…”旁放思考球，纬线环像声波一样起伏。 |
| [#1-056](https://sadjjk.github.io/motion-prompt-zh/#1-056) | **思考球·连接** | Thinking orb: connecting | 球面节点依次连线、数据沿线流动，表示正在连接服务 | 连接外部服务期间，在“Connecting sources…”旁放思考球，节点依次连线，然后数据沿线流动。 |
| [#1-057](https://sadjjk.github.io/motion-prompt-zh/#1-057) | **思考球·写作** | Thinking orb: composing | 点阵波带绕球起伏流动，表示 AI 正在写作 | AI 生成文字期间，在“Writing…”旁放思考球，点阵波带绕球起伏流动。 |
| [#1-128](https://sadjjk.github.io/motion-prompt-zh/#1-128) | **旋转光芒** | Sunburst rays | 标题背后缓缓旋转的放射状光芒 | 在获奖标题后面加旋转光芒：12 条放射光纹，每 4.8 秒转过一个光纹间距。 |

## 液态交互

| 编号 | 中文名称 | 英文名称 | 名称解释 | 向 AI 提需求的示例 |
|---|---|---|---|---|
| [#1-058](https://sadjjk.github.io/motion-prompt-zh/#1-058) | **液态分裂菜单** | Gooey morph menu | 操作按钮像液体一样从“+”按钮里被拉出，再拉断成独立的按钮 | 点“+”按钮后展开液态菜单：三个操作按钮像液体一样拉出并分离，各 550 ms，依次错开 40 ms，带一点回弹。 |
| [#1-059](https://sadjjk.github.io/motion-prompt-zh/#1-059) | **液态拖尾** | Gooey trail | 移动的指示块被拉长，身后拖出液滴尾巴 | 把标签切换的指示块做成液态：移动时拉长并拖出液滴尾巴，每次移动 0.45 秒，尾巴滞后 0.09 秒。 |
| [#1-060](https://sadjjk.github.io/motion-prompt-zh/#1-060) | **液态弯曲** | Gooey bend | 被拖动的卡片向运动反方向柔软地弯曲 | 拖动卡片时让它像液体一样向运动反方向弯曲，弯曲量与速度成正比，最多 9 px。 |

点击编号查看动画演示。单项的时序、缓动和参考代码： `api/v1/zh-Hans/e/<id>.txt` ([#1-049](../../api/v1/zh-Hans/e/1-049.txt)).

[全部分类包](../README.md)
