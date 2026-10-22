<!-- 由 tools/build.mjs 从 meta.json 生成，请修改源文件后重新构建。 -->

# 交互与数据动效

37 个效果 · #1 061~097 · 分类包 `uxmotion` · 其他语言: [English](README.md) / [日本語](README.ja.md)

找到效果名称后，直接告诉 AI；补充持续时间、强度与运动对象，结果会更接近你的想法。

## 交互文字

| 编号 | 中文名称 | 英文名称 | 名称解释 | 向 AI 提需求的示例 |
|---|---|---|---|---|
| [#1-061](https://sadjjk.github.io/motion-prompt-zh/#1-061) | **词立方翻滚** | Rolling word cube | 关键词贴在立方体各面上、依次翻滚切换的标题 | 在「我们做什么」标题里放一个词立方：4 个关键词每 1.6 秒向下翻一面，翻转 0.9 秒、两端带回弹。 |
| [#1-062](https://sadjjk.github.io/motion-prompt-zh/#1-062) | **环形文字徽章** | Circular text badge | 文字沿圆周旋转、悬停和点击会加速的环形徽章 | 给作品集首页加一个环形文字徽章：平时每秒转 18°，悬停加速到 150°/s，每点一下换一段文字。 |
| [#1-063](https://sadjjk.github.io/motion-prompt-zh/#1-063) | **字母飞散重组** | Scatter & reassemble letters | 点击后字母四散飞出、再像弹簧一样归位的标题字 | 把品牌标题做成可玩的字母：点一下 7 个字母四散弹飞、撞墙反弹，1.3 秒后像弹簧一样归位。 |
| [#1-064](https://sadjjk.github.io/motion-prompt-zh/#1-064) | **逐词卡点字幕** | Word-by-word kinetic captions | 按语速逐词弹出、重点词放大变色的视频字幕 | 给产品介绍视频做逐词卡点字幕：每词约 0.3 秒弹出，重点词放大到 1.45 倍并变黄。 |
| [#1-065](https://sadjjk.github.io/motion-prompt-zh/#1-065) | **手绘圈画标注** | Hand-drawn annotations | 用红笔在句中关键词上手绘圈画的标注 | 给落地页标语里的 3 个关键词加手绘红笔标注，可切换圈出、方框、删除线、下划线，每词间隔 0.24 秒画出。 |
| [#1-066](https://sadjjk.github.io/motion-prompt-zh/#1-066) | **剧透沙粒遮挡** | Spoiler sand cover | 剧透内容盖着闪烁沙粒、点击后炸开显出的遮挡 | 聊天里的剧透内容盖一层闪烁沙粒，点一下沙粒以每帧 2–5px 炸开，文字 0.5 秒显出。 |
| [#1-067](https://sadjjk.github.io/motion-prompt-zh/#1-067) | **阅读句子聚焦** | Sentence reading focus | 只让指针下那句话保持清晰的阅读聚焦模式 | 长文页面加阅读聚焦：只让鼠标下那句清晰，其余降到 25% 透明度并模糊，0.45 秒过渡。 |
| [#1-068](https://sadjjk.github.io/motion-prompt-zh/#1-068) | **字母弹簧涟漪** | Rippling letters | 指针划过时字母像弹簧一样起伏的标题 | 标题字母做弹簧涟漪：鼠标划过时附近字母按 σ 34px 的高斯范围抬起，再弹回原位。 |

## 滚动交互

| 编号 | 中文名称 | 英文名称 | 名称解释 | 向 AI 提需求的示例 |
|---|---|---|---|---|
| [#1-069](https://sadjjk.github.io/motion-prompt-zh/#1-069) | **卡片堆叠吸顶** | Shrinking sticky card stack | 滚动时卡片依次吸在顶部、层层叠起的堆叠效果 | 功能介绍区做卡片堆叠吸顶：4 张卡片滚动时依次吸在顶部，被盖住的每层缩小 6%、压暗 18%。 |
| [#1-070](https://sadjjk.github.io/motion-prompt-zh/#1-070) | **滚动填色文字** | Scroll-filled sentence | 随滚动逐词由灰变实色的大段文字 | 品牌理念段落做滚动填色：句子随滚动逐词由灰变黑，重点词变紫并发光，读完弹出「下一篇」按钮。 |
| [#1-071](https://sadjjk.github.io/motion-prompt-zh/#1-071) | **分区背景切换** | Per-section background shift | 滚过每个分区时整页背景色平滑过渡的商品页 | 做一个按口味分区的商品页：滚动时背景在 4 种颜色间平滑过渡，中间的易拉罐跟着换色、换标签并轻微倾斜。 |
| [#1-072](https://sadjjk.github.io/motion-prompt-zh/#1-072) | **速度倾斜列表** | Velocity-lean list | 滚得越快列表越朝滚动方向倾斜的效果 | 列表加速度倾斜：滚得越快越朝滚动方向斜，skewY 为速度 ×3.2°、最多 10°，停下后弹回。 |
| [#1-073](https://sadjjk.github.io/motion-prompt-zh/#1-073) | **翻滚章节数字** | Rolling chapter numbers | 读到哪章、章节号就像数字带一样滚到哪章的侧栏 | 长文左侧加翻滚章节号：数字带随滚动连续滚动，每章读到 75% 时开始滚向下一章，旁边圆环显示本章进度。 |
| [#1-074](https://sadjjk.github.io/motion-prompt-zh/#1-074) | **滚筒时间选择器** | Drum time picker | 拨动滚筒选时间、数值沿滚筒弯向背面的选择器 | 闹钟 App 做滚筒时间选择器：3 列滚筒，离中线越远每格多倾斜 22° 并变淡，停下 120ms 后更新响铃倒计时。 |

## 首屏背景

| 编号 | 中文名称 | 英文名称 | 名称解释 | 向 AI 提需求的示例 |
|---|---|---|---|---|
| [#1-075](https://sadjjk.github.io/motion-prompt-zh/#1-075) | **网格光束背景** | Grid-beam background | 光束沿深色网格线滑过的科技感首屏背景 | SaaS 首屏背景铺深色网格：光束沿网格线滑过，鼠标周围半径 90px 的网格亮成靛蓝色。 |
| [#1-076](https://sadjjk.github.io/motion-prompt-zh/#1-076) | **产品屏由斜到正** | Tilt-to-flat product screen | 滚动时向后倾倒的产品屏立起转正的首屏 | SaaS 首屏的产品截图做成由斜到正：初始后倾 34°、缩到 0.84，滚动 210px 内立正放大，之后图表柱子依次长高。 |
| [#1-077](https://sadjjk.github.io/motion-prompt-zh/#1-077) | **星空跃迁** | Warp starfield | 星星朝镜头飞来、按住按钮即可跃迁的星空首屏 | 首屏做星空跃迁：280 颗星飞向镜头，按住按钮速度从 0.22 升到 3.2，星星拉成蓝色光线。 |
| [#1-078](https://sadjjk.github.io/motion-prompt-zh/#1-078) | **粒子连线网** | Constellation mesh | 漂移的点彼此靠近就连线的星座网状背景 | 首屏背景做粒子连线网：72 个点相距 72px 内连线，鼠标 120px 内的点连到指针，点击炸出 9 个新点。 |
| [#1-079](https://sadjjk.github.io/motion-prompt-zh/#1-079) | **点阵涟漪** | Dot grid ripple | 指针经过处在点阵上荡开涟漪的背景 | 首屏铺 17px 间距的点阵：鼠标划过时每 110ms 留下一圈小涟漪，点击激起大波，以 170px/s 扩散。 |
| [#1-080](https://sadjjk.github.io/motion-prompt-zh/#1-080) | **粒子聚合成字** | Particles that form words | 成百上千的光点聚成单词、一碰就散开的首屏背景 | 给落地页首屏做一个粒子背景：720 颗光点用弹簧聚成单词，点击换成下一个词，指针靠近时把 60 px 内的光点推开。 |

## 光标交互

| 编号 | 中文名称 | 英文名称 | 名称解释 | 向 AI 提需求的示例 |
|---|---|---|---|---|
| [#1-081](https://sadjjk.github.io/motion-prompt-zh/#1-081) | **光标聚光边框** | Cursor-lit borders | 跟随光标的光晕把附近卡片的边框照亮 | 给功能卡片行加光标聚光效果：以光标为中心 160 px 的光晕点亮卡片描边，移开后慢慢熄灭。 |
| [#1-082](https://sadjjk.github.io/motion-prompt-zh/#1-082) | **悬停跟随预览图** | Hover-follow preview | 悬停作品列表的某一行，预览图跟着光标移动 | 作品列表悬停某行时，在光标右侧 18 px 显示预览图，稍微滞后跟随，按水平速度最多倾斜 12°。 |
| [#1-083](https://sadjjk.github.io/motion-prompt-zh/#1-083) | **光标图片拖尾** | Cursor photo trail | 光标移动时沿路径不断落下照片的趣味效果 | 在首屏标题上做光标图片拖尾：指针每移动 46 px 落下一张照片，0.9 秒后缩小消失。 |
| [#1-084](https://sadjjk.github.io/motion-prompt-zh/#1-084) | **方向感知遮罩** | Direction-aware overlay | 遮罩从光标进入的方向滑入的作品格 | 作品网格悬停时，说明面板从光标进入的那条边 0.32 秒滑入，离开时朝光标离开的方向滑出。 |
| [#1-085](https://sadjjk.github.io/motion-prompt-zh/#1-085) | **光标透镜揭示** | Cursor lens reveal | 光标处的圆形透镜里露出另一句隐藏文案 | 在大标题上给光标加一个半径 54 px 的圆形透镜，透镜内露出反色的另一句话；点击后透镜扩满整块区域。 |
| [#1-086](https://sadjjk.github.io/motion-prompt-zh/#1-086) | **滑动卡片堆叠** | Swipeable card stack | 把叠放的卡片左右滑动来收藏或跳过 | 把 4 张推荐地点卡叠放，拖动时按拖动量 × 0.06° 倾斜，右滑显示「收藏」、左滑显示「跳过」印章，松手后飞出。 |

## 进度反馈

| 编号 | 中文名称 | 英文名称 | 名称解释 | 向 AI 提需求的示例 |
|---|---|---|---|---|
| [#1-087](https://sadjjk.github.io/motion-prompt-zh/#1-087) | **支付成功对勾** | Payment ring & check | 支付按钮变成环形进度，最后画出成功对勾 | 点击支付按钮后收成 44 px 圆，环形进度 2.6 秒画满一圈，转绿并画出对勾，然后收据卡从下方滑入。 |
| [#1-088](https://sadjjk.github.io/motion-prompt-zh/#1-088) | **图标安装进度** | Install progress on icon | App 图标上的暗罩顺时针扫开，表示安装进度 | App 下载时，让图标上的暗罩随进度顺时针扫开，点击可暂停；安装包 186 MB。 |
| [#1-089](https://sadjjk.github.io/motion-prompt-zh/#1-089) | **不定转确定进度** | Indeterminate to determinate | 排队时的不定进度条直接转为分步的确定进度 | 部署页排队时用 1.6 秒一周期的不定进度条，开始构建后同一根进度条切换为 5 个步骤的确定进度。 |
| [#1-090](https://sadjjk.github.io/motion-prompt-zh/#1-090) | **点赞爱心迸发** | Heart burst like | 点赞时爱心跳动、圆环和彩点迸发的反馈 | 点赞时让爱心 0.7 秒先缩后弹，迸出粉色圆环和 7 对彩色小点，点赞数向上滚动加 1。 |
| [#1-091](https://sadjjk.github.io/motion-prompt-zh/#1-091) | **数字逐位滚动** | Rolling digits | 只有变化的数位上下滚动来更新的数字计数器 | 实时访客数变化时，只让变了的位滚动 0.9 秒，从左到右每位延迟 45 毫秒。 |

## 动态图表

| 编号 | 中文名称 | 英文名称 | 名称解释 | 向 AI 提需求的示例 |
|---|---|---|---|---|
| [#1-092](https://sadjjk.github.io/motion-prompt-zh/#1-092) | **等轴数据积木** | Isometric data blocks | 用等轴积木柱展示地区 × 月份数据的立体图表 | 用等轴积木展示 4 个地区 × 6 个月的数据，从最前排开始每排错开 70 毫秒弹起；悬停时只保留同行同列的颜色。 |
| [#1-093](https://sadjjk.github.io/motion-prompt-zh/#1-093) | **气泡分组重排** | Regrouping bubbles | 气泡互相推挤、按所选条件重新分组的图表 | 用气泡表示 36 个项目（大小代表预算），切换「按团队」「按状态」时气泡互相推挤，分成 4 群或 3 群。 |
| [#1-094](https://sadjjk.github.io/motion-prompt-zh/#1-094) | **表格实时插入** | Live table insert | 新行实时滑入、排序时各行互相穿过的表格 | 实时订单表中，新订单从顶部滑入并闪一下紫色，1.4 秒褪去；点表头排序时各行 0.45 秒移动到新位置。 |
| [#1-095](https://sadjjk.github.io/motion-prompt-zh/#1-095) | **排名赛跑柱状图** | Bar chart race | 按年份推进、排名不断交换的横向柱状赛跑图 | 把 8 种饮品 2019–2026 年的销量做成排名赛跑柱状图，只显示前 6 名，每年播放 0.6 秒，可拖动年份滑块。 |
| [#1-096](https://sadjjk.github.io/motion-prompt-zh/#1-096) | **华夫格翻转** | Waffle chart flip | 100 格华夫图中只有变了的格子翻转来更新占比 | 把 100 人的通勤方式做成 10 × 10 华夫图，切换年龄段时只让换了归属的格子沿对角线波浪翻转，每格 380 毫秒。 |
| [#1-097](https://sadjjk.github.io/motion-prompt-zh/#1-097) | **季度气泡移动** | Quarterly bubble motion | 气泡随季度沿各自路径移动的时间轴气泡图 | 把 8 个 App 画成月活用户（对数轴）× 30 日留存的气泡图，按季度移动气泡，拖动背景时每 8 px 前进或后退 1 个季度。 |

点击编号查看动画演示。单项的时序、缓动和参考代码： `api/v1/zh-Hans/e/<id>.txt` ([#1-061](../../api/v1/zh-Hans/e/1-061.txt)).

[全部分类包](../README.md)
