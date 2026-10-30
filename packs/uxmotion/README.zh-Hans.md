<!-- 由 tools/build.mjs 从 meta.json 生成，请修改源文件后重新构建。 -->

# 交互与数据动效

67 个效果 · #1 061~097 · 129~141 · 164~175 · 190~194 · 分类包 `uxmotion` · 其他语言: [English](README.md) / [日本語](README.ja.md)

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
| [#1-164](https://sadjjk.github.io/motion-prompt-zh/#1-164) | **聊天消息出现** | Chat message pop | 输入中的点变成消息，再弹出你的回复 | 用聊天消息出现展示对话界面：对方先显示输入中的点 1.75 秒，再把气泡换成文字，然后用 0.4 秒从右下角弹出你的回复。 |

## 滚动交互

| 编号 | 中文名称 | 英文名称 | 名称解释 | 向 AI 提需求的示例 |
|---|---|---|---|---|
| [#1-069](https://sadjjk.github.io/motion-prompt-zh/#1-069) | **卡片堆叠吸顶** | Shrinking sticky card stack | 滚动时卡片依次吸在顶部、层层叠起的堆叠效果 | 功能介绍区做卡片堆叠吸顶：4 张卡片滚动时依次吸在顶部，被盖住的每层缩小 6%、压暗 18%。 |
| [#1-070](https://sadjjk.github.io/motion-prompt-zh/#1-070) | **滚动填色文字** | Scroll-filled sentence | 随滚动逐词由灰变实色的大段文字 | 品牌理念段落做滚动填色：句子随滚动逐词由灰变黑，重点词变紫并发光，读完弹出「下一篇」按钮。 |
| [#1-071](https://sadjjk.github.io/motion-prompt-zh/#1-071) | **分区背景切换** | Per-section background shift | 滚过每个分区时整页背景色平滑过渡的商品页 | 做一个按口味分区的商品页：滚动时背景在 4 种颜色间平滑过渡，中间的易拉罐跟着换色、换标签并轻微倾斜。 |
| [#1-072](https://sadjjk.github.io/motion-prompt-zh/#1-072) | **速度倾斜列表** | Velocity-lean list | 滚得越快列表越朝滚动方向倾斜的效果 | 列表加速度倾斜：滚得越快越朝滚动方向斜，skewY 为速度 ×3.2°、最多 10°，停下后弹回。 |
| [#1-073](https://sadjjk.github.io/motion-prompt-zh/#1-073) | **翻滚章节数字** | Rolling chapter numbers | 读到哪章、章节号就像数字带一样滚到哪章的侧栏 | 长文左侧加翻滚章节号：数字带随滚动连续滚动，每章读到 75% 时开始滚向下一章，旁边圆环显示本章进度。 |
| [#1-074](https://sadjjk.github.io/motion-prompt-zh/#1-074) | **滚筒时间选择器** | Drum time picker | 拨动滚筒选时间、数值沿滚筒弯向背面的选择器 | 闹钟 App 做滚筒时间选择器：3 列滚筒，离中线越远每格多倾斜 22° 并变淡，停下 120ms 后更新响铃倒计时。 |
| [#1-140](https://sadjjk.github.io/motion-prompt-zh/#1-140) | **圆形扩张转场** | Circle reveal transition | 随滚动从中央扩大的圆形遮罩揭开下一章 | 章节之间用圆形扩张转场：随滚动从中央扩出圆形直到铺满画面，上一章标题缩到 0.8 并淡出。 |
| [#1-141](https://sadjjk.github.io/motion-prompt-zh/#1-141) | **时间轴延伸** | Timeline draw | 线条往下延伸、碰到哪一步就出现哪一步的纵向时间轴 | 用时间轴延伸展示制作流程：随滚动让线往下延伸，到达的节点标题从左侧 10 px 滑入。 |
| [#1-174](https://sadjjk.github.io/motion-prompt-zh/#1-174) | **回到顶部进度环** | Back-to-top progress ring | 滚动后浮出、外环显示阅读进度的回顶按钮 | 给文章加回到顶部进度环：滚过 12% 后右下角浮出按钮，外环弧长表示阅读进度，点击后 0.8 秒回到顶部。 |
| [#1-175](https://sadjjk.github.io/motion-prompt-zh/#1-175) | **滚动放大全幅图片** | Scroll zoom to full | 随滚动小图放大到满幅 | 把专题的重点画面做成滚动放大全幅图片：38% × 46% 的图片随滚动放大到满幅，圆角从 16 px 变为 0，最后浮出标题。 |

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
| [#1-131](https://sadjjk.github.io/motion-prompt-zh/#1-131) | **全息闪卡** | Holographic card | 随光标倾斜、表面炫彩箔光与反光流动的收藏卡 | 把收藏卡做成全息闪卡：随光标位置最多倾斜 13°，炫彩箔光与反光随角度流动。 |
| [#1-132](https://sadjjk.github.io/motion-prompt-zh/#1-132) | **3D 倾斜视差图片** | Tilt parallax image | 图片朝光标方向倾斜、景物分层错动形成景深 | 给作品图加 3D 倾斜视差：朝光标最多倾斜 10° 并放大到 1.04，远景到近景分层向反方向位移。 |
| [#1-133](https://sadjjk.github.io/motion-prompt-zh/#1-133) | **眼睛跟随** | Following eyes | 一对大眼睛的眼珠一直盯着光标，偶尔眨眼 | 给 404 吉祥物加眼睛跟随：眼珠朝光标方向最多偏移 14 px，每 2 秒用 0.15 秒眨一次眼。 |
| [#1-134](https://sadjjk.github.io/motion-prompt-zh/#1-134) | **刮刮乐揭示** | Scratch reveal | 刮开表层露出下方内容的刮刮卡 | 用刮刮乐揭示优惠券：用 30 px 圆头笔刷刮掉银色表层，刮得够多后剩余表层 0.5 秒淡出。 |
| [#1-135](https://sadjjk.github.io/motion-prompt-zh/#1-135) | **流场线条** | Flow field | 细线顺着看不见的气流流动，光标搅动气流 | 把首屏背景做成流场线条：220 条细线以 60 px/s 顺着流场前进，光标周围卷成漩涡。 |
| [#1-165](https://sadjjk.github.io/motion-prompt-zh/#1-165) | **光源投影字** | Light source shadow | 光标当作灯，文字的长阴影朝反方向延伸 | 给标题加光源投影字：把光标当成光源，让 18 层阴影朝光标的反方向延伸。 |
| [#1-166](https://sadjjk.github.io/motion-prompt-zh/#1-166) | **反色混合光标** | Blend difference cursor | 圆形光标经过文字时放大，重叠处颜色反转 | 标题区使用反色混合光标：白色圆以差值混合叠加，移到标题上时半径用 0.45 秒从 12 px 放大到 46 px。 |
| [#1-167](https://sadjjk.github.io/motion-prompt-zh/#1-167) | **情境标签光标** | Contextual cursor | 移到不同内容上变成带动作文字的大圆 | 作品列表使用情境标签光标：平时是半径 5 px 的小点，移到卡片上弹性放大成半径 34 px 的圆并显示「播放」「查看」等文字。 |
| [#1-168](https://sadjjk.github.io/motion-prompt-zh/#1-168) | **十字准星坐标** | Crosshair cursor | 横竖细线跟随光标，旁边实时显示坐标 | 给主视觉加十字准星坐标：横竖两条线贯穿画面交于光标，右下方用等宽字显示换算到 1920 × 1080 的坐标。 |

## 进度反馈

| 编号 | 中文名称 | 英文名称 | 名称解释 | 向 AI 提需求的示例 |
|---|---|---|---|---|
| [#1-087](https://sadjjk.github.io/motion-prompt-zh/#1-087) | **支付成功对勾** | Payment ring & check | 支付按钮变成环形进度，最后画出成功对勾 | 点击支付按钮后收成 44 px 圆，环形进度 2.6 秒画满一圈，转绿并画出对勾，然后收据卡从下方滑入。 |
| [#1-088](https://sadjjk.github.io/motion-prompt-zh/#1-088) | **图标安装进度** | Install progress on icon | App 图标上的暗罩顺时针扫开，表示安装进度 | App 下载时，让图标上的暗罩随进度顺时针扫开，点击可暂停；安装包 186 MB。 |
| [#1-089](https://sadjjk.github.io/motion-prompt-zh/#1-089) | **不定转确定进度** | Indeterminate to determinate | 排队时的不定进度条直接转为分步的确定进度 | 部署页排队时用 1.6 秒一周期的不定进度条，开始构建后同一根进度条切换为 5 个步骤的确定进度。 |
| [#1-090](https://sadjjk.github.io/motion-prompt-zh/#1-090) | **点赞爱心迸发** | Heart burst like | 点赞时爱心跳动、圆环和彩点迸发的反馈 | 点赞时让爱心 0.7 秒先缩后弹，迸出粉色圆环和 7 对彩色小点，点赞数向上滚动加 1。 |
| [#1-091](https://sadjjk.github.io/motion-prompt-zh/#1-091) | **数字逐位滚动** | Rolling digits | 只有变化的数位上下滚动来更新的数字计数器 | 实时访客数变化时，只让变了的位滚动 0.9 秒，从左到右每位延迟 45 毫秒。 |
| [#1-136](https://sadjjk.github.io/motion-prompt-zh/#1-136) | **加入购物车飞入** | Add to cart fly | 商品缩略图沿弧线飞进购物车，数量跳一下 | 点「加入购物车」后让商品图飞入购物车：0.75 秒沿弧线飞行并缩到 0.15，抵达后角标弹一下。 |
| [#1-137](https://sadjjk.github.io/motion-prompt-zh/#1-137) | **纸飞机发送** | Send plane button | 按下后纸飞机飞走、文字换成「已发送」的发送按钮 | 按下发送时让纸飞机飞走：先向后蓄力，再加速飞向右上方，文字换成「已发送」，约 1.3 秒后换回。 |
| [#1-138](https://sadjjk.github.io/motion-prompt-zh/#1-138) | **星星评分** | Star rating | 星星由左到右依次填满并弹跳的评分 | 把评价区做成星星评分：点第 4 颗时，第 1 到 4 颗每隔 0.08 秒依次填满，各自弹到 1.35 倍。 |
| [#1-139](https://sadjjk.github.io/motion-prompt-zh/#1-139) | **滑动确认** | Slide to confirm | 把手拖到底才确认、中途松开会弹回的操作 | 把付款按钮做成滑动确认：超过 85% 松开即确认，不到则把手弹回起点。 |
| [#1-169](https://sadjjk.github.io/motion-prompt-zh/#1-169) | **成就徽章解锁** | Badge unlock | 六角徽章描边画出，星星盖上，光芒放射 | 成就页加入成就徽章解锁：0.8 秒画出六角外框，星星从 3 倍大像盖章一样落下，再放射 12 道光芒。 |
| [#1-170](https://sadjjk.github.io/motion-prompt-zh/#1-170) | **翻牌配对游戏** | Memory match | 翻开两张牌，不同翻回，相同留下 | 用翻牌配对游戏展示小游戏：4 × 2 张牌每次 0.4 秒翻开，不同则 0.8 秒后翻回，相同则变强调色并弹到 1.12 倍。 |
| [#1-171](https://sadjjk.github.io/motion-prompt-zh/#1-171) | **复制成功反馈** | Copy feedback | 点复制后图标旋转变成勾，弹出提示 | 给代码块加复制成功反馈：按下后图标旋转 90° 变成勾，上方弹出「已复制」，1.5 秒后恢复。 |
| [#1-190](https://sadjjk.github.io/motion-prompt-zh/#1-190) | **任务状态图标** | Task status icon | 同一个图标在等待、执行中、完成、失败之间连贯变形 | 给智能体的任务列表加任务状态图标：等待时是 12 段虚线环，开始后 0.35 秒收拢成旋转的进度弧，完成时填绿画勾，失败时变红画叉并轻轻抖动。 |
| [#1-191](https://sadjjk.github.io/motion-prompt-zh/#1-191) | **思考过程折叠** | Collapsible thinking | AI 思考时逐条列出推理步骤，结束后收成一行再给出回答 | 给 AI 回复卡片加思考过程折叠：「正在思考」旁边计秒，每 0.7 秒出现一条推理步骤，结束后标题改成「已思考 4.8 秒」，步骤向上收起，再淡入回答的第一行。 |
| [#1-192](https://sadjjk.github.io/motion-prompt-zh/#1-192) | **AI 生图分阶段进度** | Staged image generation | 固定尺寸的图片框里，画面由模糊色块经马赛克逐级变清晰 | 把生图等待做成 AI 生图分阶段进度：228 × 136 px 的图片框不变，从模糊色块经 6、12、24、48、96 列马赛克变成清晰图，下方显示进度条和「构图 › 上色 › 细化 › 完成」。 |
| [#1-193](https://sadjjk.github.io/motion-prompt-zh/#1-193) | **按住说话录音胶囊** | Hold-to-talk capsule | 按住麦克风按钮展开成录音胶囊，松开收回并弹出转写文字 | 给语音输入加按住说话录音胶囊：按住 68 px 的圆形麦克风按钮后横向展开成 304 px 胶囊，显示红点、均衡器竖条和计时；松开后竖条收成一条线，胶囊缩回圆钮，上方弹出转写气泡。 |
| [#1-194](https://sadjjk.github.io/motion-prompt-zh/#1-194) | **方格波浪加载** | Grid wave loader | 亮波反复扫过成排方格，完成时方格合并成一条进度条 | 把文件索引的加载做成方格波浪加载：12 列 × 2 行方格上一道亮波从左往右扫，速度随进度从每秒 0.6 次加快到 1.6 次，完成时全部点亮并合并成一条进度条，显示「完成 · 1,284 / 1,284 个文件」。 |

## 动态图表

| 编号 | 中文名称 | 英文名称 | 名称解释 | 向 AI 提需求的示例 |
|---|---|---|---|---|
| [#1-092](https://sadjjk.github.io/motion-prompt-zh/#1-092) | **等轴数据积木** | Isometric data blocks | 用等轴积木柱展示地区 × 月份数据的立体图表 | 用等轴积木展示 4 个地区 × 6 个月的数据，从最前排开始每排错开 70 毫秒弹起；悬停时只保留同行同列的颜色。 |
| [#1-093](https://sadjjk.github.io/motion-prompt-zh/#1-093) | **气泡分组重排** | Regrouping bubbles | 气泡互相推挤、按所选条件重新分组的图表 | 用气泡表示 36 个项目（大小代表预算），切换「按团队」「按状态」时气泡互相推挤，分成 4 群或 3 群。 |
| [#1-094](https://sadjjk.github.io/motion-prompt-zh/#1-094) | **表格实时插入** | Live table insert | 新行实时滑入、排序时各行互相穿过的表格 | 实时订单表中，新订单从顶部滑入并闪一下紫色，1.4 秒褪去；点表头排序时各行 0.45 秒移动到新位置。 |
| [#1-095](https://sadjjk.github.io/motion-prompt-zh/#1-095) | **排名赛跑柱状图** | Bar chart race | 按年份推进、排名不断交换的横向柱状赛跑图 | 把 8 种饮品 2019–2026 年的销量做成排名赛跑柱状图，只显示前 6 名，每年播放 0.6 秒，可拖动年份滑块。 |
| [#1-096](https://sadjjk.github.io/motion-prompt-zh/#1-096) | **华夫格翻转** | Waffle chart flip | 100 格华夫图中只有变了的格子翻转来更新占比 | 把 100 人的通勤方式做成 10 × 10 华夫图，切换年龄段时只让换了归属的格子沿对角线波浪翻转，每格 380 毫秒。 |
| [#1-097](https://sadjjk.github.io/motion-prompt-zh/#1-097) | **季度气泡移动** | Quarterly bubble motion | 气泡随季度沿各自路径移动的时间轴气泡图 | 把 8 个 App 画成月活用户（对数轴）× 30 日留存的气泡图，按季度移动气泡，拖动背景时每 8 px 前进或后退 1 个季度。 |
| [#1-129](https://sadjjk.github.io/motion-prompt-zh/#1-129) | **折线图绘制** | Line chart draw | 折线由左到右画出、数据点依次弹出的图表进场 | 把月营收做成折线图绘制：折线 1.6 秒由左到右画出，线头经过时数据点依次弹出。 |
| [#1-130](https://sadjjk.github.io/motion-prompt-zh/#1-130) | **环形图分段** | Donut chart segments | 环形图的弧段一段接一段画出的进场 | 把流量来源做成环形图分段：从正上方顺时针画，每段 0.45 秒，图例从右侧依次滑入。 |
| [#1-172](https://sadjjk.github.io/motion-prompt-zh/#1-172) | **数据仪表卡片** | Stat cards | 数据卡依次浮上，数字累加，迷你折线画出 | 用数据仪表卡片作为仪表盘开场：3 张卡片相隔 0.12 秒从下方 30 px 浮上，数字用 1.2 秒累加。 |
| [#1-173](https://sadjjk.github.io/motion-prompt-zh/#1-173) | **表格十字高亮** | Table crosshair highlight | 指到的格子整行整列亮起，该格放大 | 给对比表加表格十字高亮：指到的格子所在行与列用 0.25 秒铺上淡强调色，该格放大到 1.12 倍。 |

点击编号查看动画演示。单项的时序、缓动和参考代码： `api/v1/zh-Hans/e/<id>.txt` ([#1-061](../../api/v1/zh-Hans/e/1-061.txt)).

[全部分类包](../README.md)
