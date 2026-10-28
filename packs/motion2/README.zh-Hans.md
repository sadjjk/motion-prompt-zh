<!-- 由 tools/build.mjs 从 meta.json 生成，请修改源文件后重新构建。 -->

# 动态图形进阶

46 个效果 · #2 025~048 · 064~085 · 分类包 `motion2` · 其他语言: [English](README.md) / [日本語](README.ja.md)

找到效果名称后，直接告诉 AI；补充持续时间、强度与运动对象，结果会更接近你的想法。

## 运动技法

| 编号 | 中文名称 | 英文名称 | 名称解释 | 向 AI 提需求的示例 |
|---|---|---|---|---|
| [#2-025](https://sadjjk.github.io/motion-prompt-zh/#2-025) | **预备动作** | Anticipation | 先短暂反向蓄力，再向前运动 | 按钮向右飞出前加预备动作，先用 0.3 秒轻微后退并压缩，再冲出。 |
| [#2-026](https://sadjjk.github.io/motion-prompt-zh/#2-026) | **跟随惯性** | Follow-through | 主体停下后，附属部分继续摆动 | 角色停止后，头发与旗子保留约 0.5 秒的跟随惯性，继续摆动再稳定。 |
| [#2-027](https://sadjjk.github.io/motion-prompt-zh/#2-027) | **落地弹跳** | Bounce | 落下后反复弹起，幅度逐渐降低 | 球从上方落下，弹跳三次，每次高度都比上次低。 |
| [#2-028](https://sadjjk.github.io/motion-prompt-zh/#2-028) | **不规则抖动** | Wiggle | 持续细小、不规则地晃动 | 通知铃响起时持续轻微抖动，幅度不超过约 10°。 |
| [#2-029](https://sadjjk.github.io/motion-prompt-zh/#2-029) | **脉冲缩放** | Pulse | 尺寸像心跳一样周期起伏 | 心形图标做脉冲缩放，每 1.2 秒放大约 10% 再恢复。 |
| [#2-030](https://sadjjk.github.io/motion-prompt-zh/#2-030) | **运动路径** | Motion path | 沿预先定义的曲线移动 | 纸飞机沿这条运动路径飞行四秒，朝向始终跟随运动方向。 |
| [#2-031](https://sadjjk.github.io/motion-prompt-zh/#2-031) | **往返循环** | Ping-pong loop | 正向播放后再反向播放，持续重复 | 加载圆点做往返循环，单程一秒。 |
| [#2-032](https://sadjjk.github.io/motion-prompt-zh/#2-032) | **定格动画风格** | Stop-motion style | 通过跳帧产生逐格、顿挫的运动 | 这段运动做定格动画风格，每秒八帧，每帧加轻微抖动。 |
| [#2-080](https://sadjjk.github.io/motion-prompt-zh/#2-080) | **手写签名** | Signature animation | 草写签名一笔笔写出来 | 结尾加手写签名：草写线条在 2.6 秒内随笔尖圆点写出，最后补一道底线。 |
| [#2-081](https://sadjjk.github.io/motion-prompt-zh/#2-081) | **地图路线导航** | Map route animation | 地图上落下地标并画出路线 | 地图上做路线导航：3 枚地标弹跳落下，从起点到终点画线，小点沿线前进。 |
| [#2-082](https://sadjjk.github.io/motion-prompt-zh/#2-082) | **心电图线条** | ECG heartbeat line | 心电波形从左往右持续扫出 | 健康 App 画面加心电图线条：深色格子屏上波形从左往右扫出，心率数字与爱心跟着跳。 |
| [#2-083](https://sadjjk.github.io/motion-prompt-zh/#2-083) | **树枝生长** | Growing tree | 树从主干到分枝再到叶子逐步长出 | 品牌故事用树枝生长开场：地面与主干、分枝、细枝、叶子依次长出，最后出现文字。 |
| [#2-084](https://sadjjk.github.io/motion-prompt-zh/#2-084) | **齿轮联动** | Gear train | 咬合齿轮按齿数比转动 | 处理中画面放齿轮联动：一大两小齿轮咬合，按齿数比反向转动。 |
| [#2-085](https://sadjjk.github.io/motion-prompt-zh/#2-085) | **指纹扫描解锁** | Fingerprint scan | 读取指纹后验证通过 | 登录页加指纹扫描：纹路由内向外画出，光条上下扫过，最后变绿并打勾。 |

## 文字与图形

| 编号 | 中文名称 | 英文名称 | 名称解释 | 向 AI 提需求的示例 |
|---|---|---|---|---|
| [#2-033](https://sadjjk.github.io/motion-prompt-zh/#2-033) | **文字乱码解码** | Text scramble | 字符随机变化，随后逐个锁定为目标文字 | 标题用文字乱码解码入场，随机字符持续约一秒，再从左到右锁定。 |
| [#2-034](https://sadjjk.github.io/motion-prompt-zh/#2-034) | **波浪文字** | Wave text | 字符依次上下起伏，形成波浪 | 标志字符做波浪文字，依次略微延迟，上下约 20 px。 |
| [#2-035](https://sadjjk.github.io/motion-prompt-zh/#2-035) | **沿路径文字** | Text on a path | 文字沿线条或曲线流动 | 标语沿波浪路径从左向右滚动，每五秒走完一轮。 |
| [#2-036](https://sadjjk.github.io/motion-prompt-zh/#2-036) | **可变字重动画** | Variable font animation | 字形粗细连续变化 | 标题做可变字重动画，用一秒从 Thin 变到 Black，字重从 100 到 900。 |
| [#2-037](https://sadjjk.github.io/motion-prompt-zh/#2-037) | **文字遮罩** | Text mask | 用文字轮廓裁出内部图像 | 把 OCEAN 作为文字遮罩，内部播放海面素材，最后一秒显露完整画面。 |
| [#2-038](https://sadjjk.github.io/motion-prompt-zh/#2-038) | **图形重复器** | Repeater | 复制图形，并对副本做旋转排列 | 用重复器把花瓣复制十二份围成圆，每四秒转一圈。 |
| [#2-039](https://sadjjk.github.io/motion-prompt-zh/#2-039) | **万花筒** | Kaleidoscope | 镜像图案对称扩散 | 标志后加万花筒，八向镜像对称，缓慢转动并向外扩散。 |
| [#2-040](https://sadjjk.github.io/motion-prompt-zh/#2-040) | **手绘线条抖动** | Line boil | 手绘轮廓在逐帧重画时轻微变化 | 手绘插画加线条抖动，每秒十帧，线条仅移动 2–3 px。 |
| [#2-064](https://sadjjk.github.io/motion-prompt-zh/#2-064) | **文字逐字变换** | Text morph | 相同的字留下平移，只有不同的字替换 | 保存按钮的文字变化用文字逐字变换：相同的字平移 0.5 秒，新字错开 0.06 秒翻入，按钮宽度同步变化。 |
| [#2-065](https://sadjjk.github.io/motion-prompt-zh/#2-065) | **波的干涉** | Wave interference | 两列反向行进的波叠加，时而相长时而相消的图解 | 做一个波的干涉图解动画：上面 2 条泳道是反向行进的波 A、B，下方泳道画出两者相加的合成波，竖直虚线上 3 个点实时读数。 |
| [#2-066](https://sadjjk.github.io/motion-prompt-zh/#2-066) | **散点聚成正态分布** | Dots settling into a normal distribution | 散乱的观测点聚拢成钟形分布的统计图解 | 做一个正态分布形成动画：98 个点先散成一团云，再一个个落进 13 列钟形柱，均值线 μ 亮起锁定。 |
| [#2-067](https://sadjjk.github.io/motion-prompt-zh/#2-067) | **网络扩散** | Network diffusion | 信号从一个源点沿连线逐跳扩散的网络图解 | 做一个网络扩散动画：左侧源点亮起放出 3 圈涟漪，信号沿 16 条曲线边依次传到右侧 16 个节点，左上角显示跳数和已触达节点数。 |
| [#2-068](https://sadjjk.github.io/motion-prompt-zh/#2-068) | **闪电砸落** | Lightning strike | 文字伴随闪电强光重重砸下 | 标题用闪电砸落登场：两次闪白加一道闪电，文字从 2.4 倍砸下并轻微震动。 |
| [#2-069](https://sadjjk.github.io/motion-prompt-zh/#2-069) | **硬币翻转** | Coin flip | 每个字像硬币一样翻转跳起 | 4 个字做硬币翻转：每字绕竖轴转两圈并跳起，间隔 0.2 秒。 |
| [#2-070](https://sadjjk.github.io/motion-prompt-zh/#2-070) | **水面倒影** | Water reflection | 文字下方有摇晃的倒置倒影 | 给标题加水面倒影：细水平线下是向下渐隐、摇晃的倒置文字。 |
| [#2-071](https://sadjjk.github.io/motion-prompt-zh/#2-071) | **文字旗帜** | Flag wave | 文字像旗子一样迎风飘动 | 口号做成文字旗帜：左边立旗杆，字依次波浪飘动。 |
| [#2-072](https://sadjjk.github.io/motion-prompt-zh/#2-072) | **重力反转** | Gravity flip | 文字往上掉、倒立后再落回 | logo 文字做重力反转：每字往上掉并倒立，停一下再落回并小弹。 |
| [#2-073](https://sadjjk.github.io/motion-prompt-zh/#2-073) | **卡拉 OK 小球** | Karaoke bouncing ball | 跳动小球逐字点亮歌词 | 歌词加卡拉 OK 小球：发光小球每 0.38 秒跳一个字，落到的字亮起。 |
| [#2-074](https://sadjjk.github.io/motion-prompt-zh/#2-074) | **墨水晕开** | Ink bleed | 晕开的墨团收敛成字，再晕散消失 | 标题做墨水晕开：每字从模糊墨团收成清晰字形，最后再晕开消失。 |
| [#2-075](https://sadjjk.github.io/motion-prompt-zh/#2-075) | **崩落** | Crumble | 文字崩塌坠落，再落回重组 | 片尾文字做崩落：每字先歪斜，旋转下坠淡出，再从上方落回。 |
| [#2-076](https://sadjjk.github.io/motion-prompt-zh/#2-076) | **印章** | Rubber stamp | 带框印章啪地盖上 | 在文件画面上盖两枚印章：从 2.4 倍斜着砸下，印面带斑驳质感。 |
| [#2-077](https://sadjjk.github.io/motion-prompt-zh/#2-077) | **文字圆柱** | Text cylinder | 同一个字环绕成圆柱并旋转 | 3 个字做成文字圆柱，相邻反向旋转，中间那根用强调色。 |
| [#2-078](https://sadjjk.github.io/motion-prompt-zh/#2-078) | **拉霸** | Slot machine | 滚轮快速转动后从左到右停在结果 | 结果揭晓做成拉霸：4 个滚轮转动，从左到右减速并略带回弹停下。 |
| [#2-079](https://sadjjk.github.io/motion-prompt-zh/#2-079) | **液体填满** | Liquid fill | 空心字被液体由下往上填满 | 标题做液体填满：描边空心字在 3 秒内被波动液体由下往上填满，最后清空。 |

## 转场与强调

| 编号 | 中文名称 | 英文名称 | 名称解释 | 向 AI 提需求的示例 |
|---|---|---|---|---|
| [#2-041](https://sadjjk.github.io/motion-prompt-zh/#2-041) | **推移转场** | Push transition | 下一场景滑入，同时把当前场景推出 | 下一页从右侧推入转场，持续 0.8 秒。 |
| [#2-042](https://sadjjk.github.io/motion-prompt-zh/#2-042) | **百叶窗转场** | Blinds transition | 通过多条窄带逐渐打开下一场景 | 用七条横带做百叶窗转场，在一秒内展开。 |
| [#2-043](https://sadjjk.github.io/motion-prompt-zh/#2-043) | **立方体转场** | Cube transition | 像立方体转动一样切换场景 | 产品图片用立方体转场，用 0.8 秒向左转 90°。 |
| [#2-044](https://sadjjk.github.io/motion-prompt-zh/#2-044) | **卷页转场** | Page curl | 像纸张卷起一样显露下一页 | 从右下角卷页进入下一章节，持续 1.2 秒。 |
| [#2-045](https://sadjjk.github.io/motion-prompt-zh/#2-045) | **像素化转场** | Pixelate | 画面变成粗方块，在最粗时切换 | 做像素化转场，马赛克用 0.6 秒变粗，在最粗时切换场景。 |
| [#2-046](https://sadjjk.github.io/motion-prompt-zh/#2-046) | **碎裂转场** | Shatter | 像玻璃一样破碎，碎片飞散 | 标题出现前让旧场景碎裂，先出现裂纹，再让碎片在约一秒内落走。 |
| [#2-047](https://sadjjk.github.io/motion-prompt-zh/#2-047) | **爆炸分解图** | Exploded view | 将零件分离，展示内部结构 | 产品做爆炸分解图，四个部件在一秒内分开，各带名称标签。 |
| [#2-048](https://sadjjk.github.io/motion-prompt-zh/#2-048) | **分屏** | Split screen | 分割画面，同时并列展示多个场景 | 同时显示三个场景，从一屏变两屏、再变三屏，每次 0.5 秒。 |

点击编号查看动画演示。单项的时序、缓动和参考代码： `api/v1/zh-Hans/e/<id>.txt` ([#2-025](../../api/v1/zh-Hans/e/2-025.txt)).

[全部分类包](../README.md)
