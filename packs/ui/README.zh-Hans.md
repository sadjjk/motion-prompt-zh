<!-- 由 tools/build.mjs 从 meta.json 生成，请修改源文件后重新构建。 -->

# UI 组件

52 个效果 · #1 001~024 · 098~102 · 108~121 · 142~150 · 分类包 `ui` · 其他语言: [English](README.md) / [日本語](README.ja.md)

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
| [#1-110](https://sadjjk.github.io/motion-prompt-zh/#1-110) | **拖拽上传** | Drag-and-drop upload | 文件拖进上传区后区域激活并开始上传 | 做一个拖拽上传区：文件拖进来后虚线框变成绿色实线，进度条从 0 走到 100%，最后显示“可以发布”。 |
| [#1-118](https://sadjjk.github.io/motion-prompt-zh/#1-118) | **命令面板** | Command palette | 快捷键唤出、边输入边筛选命令 | 按 ⌘K 唤出命令面板：背景变暗、面板微微放大出现，输入时实时筛选列表。 |
| [#1-119](https://sadjjk.github.io/motion-prompt-zh/#1-119) | **翻页书** | Page flip | 书页以书脊为轴翻到另一侧 | 把产品目录做成翻页书：点右页后以书脊为轴 0.7 秒翻到左侧。 |
| [#1-120](https://sadjjk.github.io/motion-prompt-zh/#1-120) | **对折邀请卡** | Folding card | 对折卡片翻开封面露出内页文字 | 邀请函做成对折卡：点封面后以左边为轴打开，内页文字依次淡入。 |
| [#1-147](https://sadjjk.github.io/motion-prompt-zh/#1-147) | **Cookie 同意横幅** | Cookie banner | 从底部弹出的 Cookie 使用同意卡片 | 网站加 Cookie 同意横幅：从底部弹上来，饼干图标晃一下，点同意后卡片滑出。 |
| [#1-148](https://sadjjk.github.io/motion-prompt-zh/#1-148) | **浮动按钮展开菜单** | Speed dial | 浮动“+”按钮展开一列小操作按钮 | 右下角新增按钮做成浮动按钮展开菜单：点击后 + 转成 ×，上方小按钮自下而上依次弹出。 |

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
| [#1-108](https://sadjjk.github.io/motion-prompt-zh/#1-108) | **验证码逐格填入** | OTP input fill | 验证码一格一位依次填满后自动确认 | 做一个验证码输入动画：6 个格子每隔 0.35 秒填入一位数字，填满后所有格子亮蓝边并提示已验证。 |
| [#1-109](https://sadjjk.github.io/motion-prompt-zh/#1-109) | **密码强度条** | Password strength meter | 密码越输越长，强度条逐段着色 | 在密码框下加强度条：4 段强度条随输入依次变红、橙、黄绿、绿，文字从“弱”变到“强”。 |
| [#1-114](https://sadjjk.github.io/motion-prompt-zh/#1-114) | **价格方案切换** | Pricing toggle | 切换月付 / 年付时价格数字滚动变化 | 价格表加月付 / 年付切换：切换后价格数字向上滚动到新值，推荐方案略微放大并描边。 |
| [#1-115](https://sadjjk.github.io/motion-prompt-zh/#1-115) | **水滴单选** | Liquid radio | 选中点像水滴一样拉长移到新选项 | 单选框做成水滴单选：换选时选中点像水滴一样拉长，0.45 秒移到新选项后收回圆形。 |
| [#1-116](https://sadjjk.github.io/motion-prompt-zh/#1-116) | **输入框浮动标签** | Floating label | 聚焦输入框时标签缩小上浮 | 邮箱输入框用浮动标签：聚焦时标签缩小上浮，底线从中间向两侧展开。 |
| [#1-117](https://sadjjk.github.io/motion-prompt-zh/#1-117) | **展开搜索框** | Expanding search | 圆形放大镜按钮横向展开成搜索框 | 顶栏搜索做成展开搜索框：点放大镜后 0.45 秒向左展开成输入框。 |
| [#1-142](https://sadjjk.github.io/motion-prompt-zh/#1-142) | **滑动删除** | Swipe to delete | 列表项左滑露出删除，滑到底即移除 | 通知列表做滑动删除：向左拖露出红色删除区，松手后该行滑出，下方行补位上移。 |
| [#1-143](https://sadjjk.github.io/motion-prompt-zh/#1-143) | **多选卡片** | Selectable cards | 点选多张卡片，底部出现已选数量栏 | 图片卡片做成多选卡片：选中时出现框线与勾，底部弹出“已选 N 项”操作栏。 |
| [#1-144](https://sadjjk.github.io/motion-prompt-zh/#1-144) | **错误震动提示** | Shake on error | 输入错误时字段左右震动 | 密码错误时用错误震动提示：输入框左右震动 0.45 秒，边框变红，下方滑出错误提示。 |
| [#1-145](https://sadjjk.github.io/motion-prompt-zh/#1-145) | **勾选框打勾** | Animated checkbox | 点击时方框弹一下，勾像笔画出 | 待办勾选做成勾选框打勾：方框弹一下，勾从左下画到右上，项目文字加删除线。 |
| [#1-146](https://sadjjk.github.io/motion-prompt-zh/#1-146) | **标签输入** | Tag input | 输入文字回车后变成标签的输入框 | 兴趣栏做成标签输入：回车后文字变成弹出的标签，点 × 时标签缩小消失、后面补位。 |

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
| [#1-111](https://sadjjk.github.io/motion-prompt-zh/#1-111) | **快捷键逐键点亮** | Keyboard shortcut press | 组合键一枚枚按下并点亮 | 做一个快捷键演示：Ctrl、Shift、P 三枚键依次按下变琥珀色，下方提示随按键逐步拼出，最后显示“已排队”。 |
| [#1-112](https://sadjjk.github.io/motion-prompt-zh/#1-112) | **代码差异高亮** | Code diff highlight | 代码删除行与新增行以红绿两色依次出现 | 做一个编辑器代码差异动画：上下文行亮起后，红色删除行和绿色新增行依次从左 6.4px 滑入，新增行再闪亮一次。 |
| [#1-113](https://sadjjk.github.io/motion-prompt-zh/#1-113) | **部署流水线** | Deploy pipeline | 构建各阶段依次运行通过并连成一线 | 做一个部署进度动画：Lint、Test、Build、Deploy 4 张阶段卡依次由“运行中”变绿“通过”，连接线逐段接通，最后显示“已上线”。 |
| [#1-121](https://sadjjk.github.io/motion-prompt-zh/#1-121) | **下拉刷新** | Pull to refresh | 下拉列表松手后重新加载 | 消息列表加下拉刷新：越拉越沉，图标随距离转动，松手后转圈加载，顶部插入新消息。 |
| [#1-149](https://sadjjk.github.io/motion-prompt-zh/#1-149) | **3D 环形轮播** | 3D ring carousel | 卡片围成一圈在 3D 中旋转的轮播 | 作品集做成 3D 环形轮播：8 张卡片围成一圈 24 秒转一周，可以拖动转动。 |
| [#1-150](https://sadjjk.github.io/motion-prompt-zh/#1-150) | **侧栏收合** | Collapsible sidebar | 侧边栏收成只剩图标的窄条 | 后台左侧菜单做成侧栏收合：点按钮后 0.45 秒收成只剩图标，主内容区变宽。 |

点击编号查看动画演示。单项的时序、缓动和参考代码： `api/v1/zh-Hans/e/<id>.txt` ([#1-001](../../api/v1/zh-Hans/e/1-001.txt)).

[全部分类包](../README.md)
