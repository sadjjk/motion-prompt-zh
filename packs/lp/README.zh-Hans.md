<!-- 由 tools/build.mjs 从 meta.json 生成，请修改源文件后重新构建。 -->

# 落地页与网页动效

35 个效果 · #1 025~048 · 103~107 · 122~127 · 分类包 `lp` · 其他语言: [English](README.md) / [日本語](README.ja.md)

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

点击编号查看动画演示。单项的时序、缓动和参考代码： `api/v1/zh-Hans/e/<id>.txt` ([#1-025](../../api/v1/zh-Hans/e/1-025.txt)).

[全部分类包](../README.md)
