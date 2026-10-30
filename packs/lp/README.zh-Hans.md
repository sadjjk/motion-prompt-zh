<!-- 由 tools/build.mjs 从 meta.json 生成，请修改源文件后重新构建。 -->

# 落地页与网页动效

52 个效果 · #1 025~048 · 103~107 · 122~127 · 151~163 · 186~189 · 分类包 `lp` · 其他语言: [English](README.md) / [日本語](README.ja.md)

找到效果名称后，直接告诉 AI；补充持续时间、强度与运动对象，结果会更接近你的想法。

## 滚动效果

| 编号 | 中文名称 | 英文名称 | 名称解释 | 向 AI 提需求的示例 |
|---|---|---|---|---|
| [#1-025](https://sadjjk.github.io/motion-prompt-zh/#1-025) | **视差滚动** | Parallax scrolling | 页面滚动时背景图层比内容移动得慢 | 首屏背景做视差滚动，位移为滚动距离的 0.3×。 |
| [#1-026](https://sadjjk.github.io/motion-prompt-zh/#1-026) | **滚动淡入** | Fade-in on scroll | 元素滚入视口时逐渐显现 | 各区标题和卡片滚入时，从下方 30 px 处用 0.6 秒上移淡入。 |
| [#1-027](https://sadjjk.github.io/motion-prompt-zh/#1-027) | **吸顶页头** | Sticky header | 页面滚动时页头固定在顶部 | 页头设置吸顶，固定后增加柔和阴影。 |
| [#1-028](https://sadjjk.github.io/motion-prompt-zh/#1-028) | **滚动固定分区** | Pinning | 分区保持固定，滚动推进内部内容 | 固定三步介绍分区，用户滚动时逐步切换图片和编号。 |
| [#1-029](https://sadjjk.github.io/motion-prompt-zh/#1-029) | **横向滚动** | Horizontal scroll | 向下滚动，内容横向移动 | 作品区做横向滚动，用户下滚时卡片向左移动相应距离。 |
| [#1-030](https://sadjjk.github.io/motion-prompt-zh/#1-030) | **滚动吸附** | Scroll snap | 滚动后准确停在下一分区边缘 | 每个分区加滚动吸附，轻微滚动后自动停在下一分区顶部。 |
| [#1-031](https://sadjjk.github.io/motion-prompt-zh/#1-031) | **阅读进度条** | Scroll progress bar | 顶部进度条显示阅读位置 | 文章页顶部加 4 px 品牌橙色阅读进度条。 |
| [#1-032](https://sadjjk.github.io/motion-prompt-zh/#1-032) | **荧光笔划线** | Highlighter animation | 关键词下方逐渐画出高亮笔迹 | 关键词滚入视口后，用 0.8 秒从左向右画出黄色荧光笔高亮。 |

## 悬停与点击交互

| 编号 | 中文名称 | 英文名称 | 名称解释 | 向 AI 提需求的示例 |
|---|---|---|---|---|
| [#1-033](https://sadjjk.github.io/motion-prompt-zh/#1-033) | **悬停抬升** | Hover lift | 悬停时元素上浮，阴影加深 | 卡片悬停时用 0.3 秒上浮 8 px，阴影加深。 |
| [#1-034](https://sadjjk.github.io/motion-prompt-zh/#1-034) | **悬停图片放大** | Image zoom on hover | 固定边框内的照片逐渐放大 | 作品照片悬停时保持边框不变，内部用 0.5 秒放大到 1.1×。 |
| [#1-035](https://sadjjk.github.io/motion-prompt-zh/#1-035) | **光标跟随** | Cursor follower | 图形稍有延迟地跟随鼠标 | 全站增加光标跟随，30 px 橙色圆略微落后于鼠标。 |
| [#1-036](https://sadjjk.github.io/motion-prompt-zh/#1-036) | **磁吸按钮** | Magnetic button | 按钮被附近的光标轻微吸引 | 联系按钮做磁吸效果，向光标移动距离的 0.3×，移开后弹回。 |
| [#1-037](https://sadjjk.github.io/motion-prompt-zh/#1-037) | **点击涟漪** | Ripple effect | 波纹从按下位置向外扩散 | 提交按钮加点击涟漪，白圆从点击点扩散，并在 0.6 秒内淡出。 |
| [#1-038](https://sadjjk.github.io/motion-prompt-zh/#1-038) | **下划线动画** | Underline animation | 悬停链接时，下划线从左侧伸展 | 菜单链接悬停时用 0.3 秒从左侧画出下划线，移开后向右消退。 |
| [#1-039](https://sadjjk.github.io/motion-prompt-zh/#1-039) | **前后对比滑块** | Before/after slider | 拖动分隔线比较处理前后 | 项目照片做前后对比滑块，拖动中线比较左侧处理前与右侧处理后。 |
| [#1-040](https://sadjjk.github.io/motion-prompt-zh/#1-040) | **离站挽留弹窗** | Exit-intent popup | 访客准备离开时出现弹窗 | 落地页增加一次性的离站挽留弹窗，光标从顶部移出时展示优惠券。 |
| [#1-103](https://sadjjk.github.io/motion-prompt-zh/#1-103) | **按压缩小** | Press / tap feedback | 按下时按钮微微缩小，让点击有按下去的实感 | 所有按钮加按压反馈：按下 0.1 秒缩到 0.97，松开 0.25 秒恢复到 1。 |
| [#1-104](https://sadjjk.github.io/motion-prompt-zh/#1-104) | **长按确认** | Hold to confirm | 按住按钮直到进度填满才执行操作 | 删除按钮改成长按确认：按住 1.2 秒填满进度才删除，中途松手进度回退。 |
| [#1-122](https://sadjjk.github.io/motion-prompt-zh/#1-122) | **旋转光边按钮** | Rotating gradient border | 按钮外框的渐变光持续绕圈 | 给主按钮加旋转光边：锥形渐变外框持续绕圈，悬停时加速并亮起外光晕。 |
| [#1-123](https://sadjjk.github.io/motion-prompt-zh/#1-123) | **果冻弹跳按钮** | Jelly button | 点击后像果冻一样横竖弹动再复原 | 把“加入购物车”按钮做成果冻弹跳：点击后先横向压扁再纵向拉高，0.6 秒内回弹复原。 |
| [#1-124](https://sadjjk.github.io/motion-prompt-zh/#1-124) | **发牌展开** | Card deal | 卡片依次发出并展开成扇形 | 点“发牌”后 5 张卡片从底部依次发出，回弹展开成约 ±24° 的扇形。 |
| [#1-125](https://sadjjk.github.io/motion-prompt-zh/#1-125) | **拍立得洗牌** | Photo stack shuffle | 叠放照片的顶张抽出插回底部 | 把回忆照片做成拍立得洗牌：每次点击把顶张向右抽出，再插回最底下。 |
| [#1-151](https://sadjjk.github.io/motion-prompt-zh/#1-151) | **图标微动画** | Icon micro-animations | 悬停的图标各做符合意思的小动作 | 给工具栏图标加微动画：悬停时铃铛摇、爱心跳、齿轮转 90°、信封打开。 |
| [#1-152](https://sadjjk.github.io/motion-prompt-zh/#1-152) | **聚焦淡化其他** | Focus dim siblings | 悬停的卡片浮起，其他卡片变淡缩小 | 价格方案卡片做成聚焦淡化其他：悬停的卡上浮 8px，其他卡 0.45 秒内变淡缩小。 |
| [#1-153](https://sadjjk.github.io/motion-prompt-zh/#1-153) | **Bento 格局展开** | Bento grid expand | 悬停的格子变大，其他格子同步让位 | 功能介绍做成 Bento 格局展开：悬停格所在栏 0.55 秒放大到 2.4fr、所在列放大到 1.8fr。 |
| [#1-154](https://sadjjk.github.io/motion-prompt-zh/#1-154) | **文字翻滚按钮** | Rolling text button | 悬停时按钮文字逐字往上翻滚替换 | 把「查看作品」按钮做成文字翻滚按钮：每个字错开 0.035 秒往上翻滚，按钮同时反色。 |
| [#1-155](https://sadjjk.github.io/motion-prompt-zh/#1-155) | **Dock 放大菜单** | Dock magnification | 离光标越近的图标越大，并推开邻居 | 应用切换菜单做成 Dock 放大：最近的图标放大到约 1.9 倍，110px 范围内按距离放大。 |
| [#1-156](https://sadjjk.github.io/motion-prompt-zh/#1-156) | **边框描绘按钮** | Border draw button | 悬停时四条边框依次画出围住按钮 | 把「联系我们」按钮做成边框描绘按钮：从左上角起按上、右、下、左的顺序，每段 0.18 秒画出边框。 |
| [#1-157](https://sadjjk.github.io/motion-prompt-zh/#1-157) | **箭头接力按钮** | Icon slide button | 右侧箭头滑出，新箭头从左侧滑入 | 把「了解更多」按钮做成箭头接力按钮：0.4 秒内右侧箭头滑出，新箭头从左侧滑入，文字右移让位。 |
| [#1-158](https://sadjjk.github.io/motion-prompt-zh/#1-158) | **展开文字按钮** | Expanding button | 圆形「+」按钮悬停时向右展开出文字 | 新建按钮做成展开文字按钮：悬停 0.5 秒向右展开，加号转 90°，展开过半后文字才淡入。 |
| [#1-159](https://sadjjk.github.io/motion-prompt-zh/#1-159) | **光标扩散填满按钮** | Direction-aware fill button | 从光标进入处圆形扩散填满，离开时往出口收回 | 把「立即联系」按钮做成光标扩散填满按钮：从进入点 0.55 秒圆形扩散填满，离开时向离开点缩小消失。 |
| [#1-160](https://sadjjk.github.io/motion-prompt-zh/#1-160) | **展开式图片面板** | Expanding panels | 一排窄图片面板中被悬停的一片展开并显示标题 | 分类入口做成展开式图片面板：悬停的一片 0.6 秒展开到其他片的 4 倍宽，展开后再显示标题。 |
| [#1-161](https://sadjjk.github.io/motion-prompt-zh/#1-161) | **低饱和唤醒** | Saturate on hover | 低饱和的图片悬停时恢复鲜艳并微微放大 | 团队照片做成低饱和唤醒：平时去饱和 90% 且偏暗，悬停 0.6 秒恢复色彩并放大到 1.05。 |
| [#1-186](https://sadjjk.github.io/motion-prompt-zh/#1-186) | **撕票根** | Tear-off ticket stub | 拖动票根沿打孔线撕下，主票面盖上检票印章 | 把活动购票成功页做成撕票根：拖住右侧 82 px 宽的票根往下拉，1.2 秒内沿打孔线撕开并掉落，主票面随后盖上「已检票」印章。 |
| [#1-187](https://sadjjk.github.io/motion-prompt-zh/#1-187) | **碎纸机删除** | Shredder delete | 把文件拖进碎纸机粉碎删除，列表随后补位 | 把删除文件做成碎纸机删除：拖起的行缩成 0.6 倍卡片被吸进进纸口，机身震动，15 条纸条卷曲着落进纸篓，下方行上移 33 px 补位。 |
| [#1-188](https://sadjjk.github.io/motion-prompt-zh/#1-188) | **文件夹弹出卡片** | Folder pop-out cards | 悬停时文件夹翻开，里面的卡片弹到四周并轻轻浮动 | 把作品集文件夹做成悬停弹出卡片：前片 0.5 秒向前翻开，3 张卡片间隔 0.17 秒带旋转弹到左、上、右三处，并以 2.6 px 幅度轻轻浮动。 |

## 加载、导航与循环动效

| 编号 | 中文名称 | 英文名称 | 名称解释 | 向 AI 提需求的示例 |
|---|---|---|---|---|
| [#1-041](https://sadjjk.github.io/motion-prompt-zh/#1-041) | **预加载屏** | Preloader | 页面加载期间显示的过渡屏幕 | 站点加载时显示标志和百分比，达到 100% 后整屏向上移走。 |
| [#1-042](https://sadjjk.github.io/motion-prompt-zh/#1-042) | **懒加载** | Lazy loading | 图片进入视口后才开始加载 | 图库图片使用懒加载，完成前显示灰色占位，加载后用 0.3 秒淡入。 |
| [#1-043](https://sadjjk.github.io/motion-prompt-zh/#1-043) | **无限滚动** | Infinite scroll | 到达列表底部时自动加载更多 | 新闻列表做无限滚动，底部显示旋转指示器，每次追加十条。 |
| [#1-044](https://sadjjk.github.io/motion-prompt-zh/#1-044) | **页面转场** | Page transition | 用动画连接两个页面 | 点击链接后让橙色面板从左向右扫过，再显示下一页面。 |
| [#1-045](https://sadjjk.github.io/motion-prompt-zh/#1-045) | **平滑滚动** | Smooth scroll | 页内链接平滑移动到目标，而非直接跳转 | 菜单页内链接使用平滑滚动，停在固定页头下方。 |
| [#1-046](https://sadjjk.github.io/motion-prompt-zh/#1-046) | **无缝跑马灯** | Marquee | 文字或标志沿条带持续循环滚动 | 服务名称从右向左无缝跑马灯滚动，速度约每秒 80 px。 |
| [#1-047](https://sadjjk.github.io/motion-prompt-zh/#1-047) | **动态渐变** | Animated gradient | 背景颜色持续漂移融合 | 首屏使用橙蓝缓慢融合的动态渐变背景，每十秒一轮。 |
| [#1-048](https://sadjjk.github.io/motion-prompt-zh/#1-048) | **悬浮动画** | Floating animation | 元素轻柔地上下浮动 | 首屏手机图加悬浮动画，上下 8 px，每 2.4 秒起伏一次。 |
| [#1-105](https://sadjjk.github.io/motion-prompt-zh/#1-105) | **共享元素转场** | Shared element transition | 同一元素从列表变形到详情页，把两页连起来 | 从相册列表进详情页时做共享元素转场：缩略图用 0.6 秒移动并放大成详情大图。 |
| [#1-106](https://sadjjk.github.io/motion-prompt-zh/#1-106) | **方向感知转场** | Direction-aware transition | 前进与后退时页面滑动方向相反 | 多步表单切换跟随方向：下一步向左推，返回向右推，0.5 秒 ease-in-out。 |
| [#1-107](https://sadjjk.github.io/motion-prompt-zh/#1-107) | **布局动画** | Layout animation | 布局变化时，其余元素平滑移到新位置 | 删除卡片后其余卡片用布局动画补位，0.5 秒 ease-in-out 平滑移到新位置。 |
| [#1-126](https://sadjjk.github.io/motion-prompt-zh/#1-126) | **切片转场** | Slice transition | 图片切成竖条交替上下滑走露出下一张 | 轮播切换用切片转场：当前图切成 6 条，间隔 0.08 秒交替向上、向下滑走。 |
| [#1-127](https://sadjjk.github.io/motion-prompt-zh/#1-127) | **天气图标动画** | Animated weather icons | 晴、云、雨、雷图标各自小幅循环动 | 让天气预报图标动起来：太阳光芒自转、云朵飘动、雨滴错时落下、闪电闪烁。 |
| [#1-162](https://sadjjk.github.io/motion-prompt-zh/#1-162) | **指针时钟** | Analog clock | 秒针逐格跳动并带一点回弹的指针时钟 | 在营业时间旁放一个指针时钟，秒针每跳一格 0.15 秒内略超过再弹回。 |
| [#1-163](https://sadjjk.github.io/motion-prompt-zh/#1-163) | **选取框蚂蚁线** | Marching ants selection | 虚线选取框的线条持续流动，四角带控制点 | 编辑器选区做成选取框蚂蚁线：线段 6、间隔 5 持续流动，框变大小时宽 × 高标签跟着更新。 |
| [#1-189](https://sadjjk.github.io/motion-prompt-zh/#1-189) | **树状菜单** | Tree menu | 菜单项用枝杈线连到主干的侧边导航，展开时长出子枝，选中时点亮路径 | 把后台侧边导航做成树状菜单：点击「产品」后下方条目下移 54 px，3 条子枝杈间隔 0.13 秒、各用 0.4 秒长出，再用 0.58 秒点亮到所选子项的连线。 |

点击编号查看动画演示。单项的时序、缓动和参考代码： `api/v1/zh-Hans/e/<id>.txt` ([#1-025](../../api/v1/zh-Hans/e/1-025.txt)).

[全部分类包](../README.md)
