<!-- 由 tools/build.mjs 从 meta.json 生成，请修改源文件后重新构建。 -->

# UI 组件

29 个效果 · #1 001~024 · 098~102 · 分类包 `ui` · 其他语言: [English](README.md) / [日本語](README.ja.md)

找到效果名称后，直接告诉 AI；补充持续时间、强度与运动对象，结果会更接近你的想法。

## 弹出与覆盖

| 编号 | 中文名称 | 英文名称 | 名称解释 | 向 AI 提需求的示例 |
|---|---|---|---|---|
| [#1-001](https://sadjjk.github.io/motion-prompt-zh/#1-001) | **模态对话框** | Modal dialog | 居中弹出窗口，后方页面变暗 | 点击删除按钮时显示模态确认框，背景约变暗 40%，用 0.3 秒淡入并略微放大。 |
| [#1-002](https://sadjjk.github.io/motion-prompt-zh/#1-002) | **侧边抽屉** | Drawer (Off-canvas) | 菜单面板从屏幕侧边滑入 | 点击菜单按钮后从左侧打开抽屉，宽度为屏幕的 40%，滑入耗时 0.4 秒，背景略微变暗。 |
| [#1-003](https://sadjjk.github.io/motion-prompt-zh/#1-003) | **底部弹出面板** | Bottom sheet | 面板从屏幕底部向上滑出 | 点击“查看详情”后弹出底部面板，高度为屏幕的 40%，用 0.4 秒升起，下拖关闭。 |
| [#1-004](https://sadjjk.github.io/motion-prompt-zh/#1-004) | **折叠面板** | Accordion | 点击标题展开或收起对应内容 | FAQ 用折叠面板，点击项在 0.35 秒内展开，箭头转动 180°。 |
| [#1-005](https://sadjjk.github.io/motion-prompt-zh/#1-005) | **下拉选择器** | Dropdown (select) | 点击字段后在下方展开选项 | 地区字段用下拉选择器，0.25 秒展开下方选项，选中后关闭并填入值。 |
| [#1-006](https://sadjjk.github.io/motion-prompt-zh/#1-006) | **悬浮提示** | Tooltip | 悬停时显示简短说明 | 给“?”图标加悬浮提示，悬停 0.2 秒后在上方显示，移开即隐藏。 |
| [#1-007](https://sadjjk.github.io/motion-prompt-zh/#1-007) | **气泡弹出框** | Popover | 点击按钮打开指向该按钮的小面板 | 给“详情”按钮加气泡弹出框，点击后用 0.3 秒在右侧打开，点“确定”关闭。 |
| [#1-008](https://sadjjk.github.io/motion-prompt-zh/#1-008) | **轻提示通知** | Toast notification | 角落短暂出现消息，随后自动消失 | 保存后在右下角显示“已保存”轻提示，用 0.35 秒从右侧滑入，两秒后自动关闭。 |
| [#1-098](https://sadjjk.github.io/motion-prompt-zh/#1-098) | **缩放淡入** | Scale in | 弹层从略小尺寸放大到原尺寸并淡入 | 弹窗出现时用缩放淡入：从 0.95 倍放大到原尺寸并淡入，0.25 秒 ease-out，不要回弹。 |
| [#1-099](https://sadjjk.github.io/motion-prompt-zh/#1-099) | **从触发点展开** | Origin-aware animation | 弹出菜单从触发它的按钮处长出 | 下拉菜单的 transform-origin 设在触发按钮上，从 0.5 倍放大展开，0.3 秒 ease-out。 |
| [#1-100](https://sadjjk.github.io/motion-prompt-zh/#1-100) | **橡皮筋回弹** | Rubber-banding | 拖过边界时带阻力移动，松手后弹回 | 底部面板拖到顶后加橡皮筋阻尼：手指多拖 120px 面板只移动约 49px，松手后弹回。 |
| [#1-101](https://sadjjk.github.io/motion-prompt-zh/#1-101) | **可打断动画** | Interruptible animation | 动画进行中可随时改向，从当前状态接续 | 抽屉开关用弹簧动画并支持中途打断：开到一半再点，就从当前位置和速度直接折返（ω = 10）。 |

## 选择与切换

| 编号 | 中文名称 | 英文名称 | 名称解释 | 向 AI 提需求的示例 |
|---|---|---|---|---|
| [#1-009](https://sadjjk.github.io/motion-prompt-zh/#1-009) | **标签页** | Tabs | 点击标签切换显示的内容面板 | 价格页顶部放三个标签页，点击后下划线用 0.25 秒滑动，内容用 0.2 秒交叉淡化。 |
| [#1-010](https://sadjjk.github.io/motion-prompt-zh/#1-010) | **轮播** | Carousel | 横向滑动，每次展示一个项目 | 顶部图片做成轮播，点击右箭头用 0.4 秒切一张，下方显示位置指示点。 |
| [#1-011](https://sadjjk.github.io/motion-prompt-zh/#1-011) | **开关** | Toggle switch | 在开启和关闭之间切换设置 | 每个通知设置加开关，滑块用 0.2 秒移动，开启时轨道变蓝。 |
| [#1-012](https://sadjjk.github.io/motion-prompt-zh/#1-012) | **分段控制器** | Segmented control | 一组相连按钮用于切换视图 | 图表上方加日、周、月分段控制器，选中背景用 0.25 秒滑动，图表同步变化。 |
| [#1-013](https://sadjjk.github.io/motion-prompt-zh/#1-013) | **筛选标签** | Filter chips | 点击胶囊标签添加或移除筛选条件 | 列表上方加筛选标签，选中后变蓝并出现对勾，列表在 0.15 秒内筛选完成。 |
| [#1-014](https://sadjjk.github.io/motion-prompt-zh/#1-014) | **区间滑块** | Range slider | 在同一轨道上用两个滑块选择上下限 | 价格筛选使用双滑块区间选择器，拖动时在气泡中显示数值。 |
| [#1-015](https://sadjjk.github.io/motion-prompt-zh/#1-015) | **数字步进器** | Stepper (+/−) | 通过加减按钮逐个调整数值 | 数量字段用数字步进器，+ 和 − 每次改变一，按下后数字用 0.25 秒轻微弹动。 |
| [#1-016](https://sadjjk.github.io/motion-prompt-zh/#1-016) | **分页器** | Pagination | 使用带页码的按钮切换页面 | 搜索结果下方加分页器，当前页用蓝圆标记，点击后用 0.2 秒移动并替换列表。 |
| [#1-102](https://sadjjk.github.io/motion-prompt-zh/#1-102) | **拖拽排序** | Drag to reorder | 按住拖动列表项，其他项让位改变顺序 | 待办列表支持拖拽排序：按住把手时行抬起放大到 1.04 倍，其他行用 0.2 秒滑开让位。 |

## 导航与状态

| 编号 | 中文名称 | 英文名称 | 名称解释 | 向 AI 提需求的示例 |
|---|---|---|---|---|
| [#1-017](https://sadjjk.github.io/motion-prompt-zh/#1-017) | **汉堡菜单** | Hamburger menu | 点击三横线图标打开菜单 | 移动端页头右侧放汉堡菜单，点击后用 0.3 秒把三条线变成 ×，菜单从顶部下拉。 |
| [#1-018](https://sadjjk.github.io/motion-prompt-zh/#1-018) | **面包屑导航** | Breadcrumbs | 用链接路径标明当前页面在站点中的位置 | 文章上方加“首页 › 课程 › 网页设计”面包屑，当前页加粗且不可点击。 |
| [#1-019](https://sadjjk.github.io/motion-prompt-zh/#1-019) | **大型下拉菜单** | Mega menu | 从主导航展开含分组链接的宽面板 | 页头“产品”用大型下拉菜单，悬停后用 0.25 秒展开全宽面板，放三列链接和一张图。 |
| [#1-020](https://sadjjk.github.io/motion-prompt-zh/#1-020) | **步骤指示器** | Step indicator | 显示流程当前进行到哪一步 | 注册表单上方放四步指示器：资料、确认、支付、完成，已完成步骤显示对勾。 |
| [#1-021](https://sadjjk.github.io/motion-prompt-zh/#1-021) | **骨架屏** | Skeleton screen | 加载时用灰色形状占据内容位置 | 列表加载时显示骨架屏，用灰块保持内容形状，每 0.9 秒从左向右扫过一道光。 |
| [#1-022](https://sadjjk.github.io/motion-prompt-zh/#1-022) | **加载旋转指示器** | Spinner | 旋转圆环表示正在等待 | 发送时在表单上显示加载旋转指示器，每秒转略多于一圈，完成后换成蓝色对勾。 |
| [#1-023](https://sadjjk.github.io/motion-prompt-zh/#1-023) | **数字角标** | Badge | 用小圆点中的数字提示数量 | 页头铃铛加未读角标，计数增加时用 0.3 秒弹动，打开后消失。 |
| [#1-024](https://sadjjk.github.io/motion-prompt-zh/#1-024) | **空状态** | Empty state | 没有可列出的内容时展示引导界面 | 列表为空时显示线描图标、“暂无内容”和添加按钮，在 0.35 秒内淡入。 |

点击编号查看动画演示。单项的时序、缓动和参考代码： `api/v1/zh-Hans/e/<id>.txt` ([#1-001](../../api/v1/zh-Hans/e/1-001.txt)).

[全部分类包](../README.md)
