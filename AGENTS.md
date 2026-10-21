# AGENTS.md — motion-prompt-zh

## 项目概览

Motion Prompt 动效库的非官方简体中文 fork：Canvas 动效静态网站 + 静态 API + Agent Skill，由 GitHub Pages 托管。
技术栈：原生 HTML/CSS/JS + Canvas 2D；Node.js 构建脚本（无 npm 依赖）；Python 3 仅用于本地预览和浏览器检查。

## 工具链

- 包管理器：无（仓库没有 `package.json` 和锁文件）。需要 Node.js 18+（`tools/build.mjs` 第 2 行、`README.md`「本地运行」节）。
- build：`node tools/build.mjs`；只校验不写文件：`node tools/build.mjs --check`
- test：
  - `node tools/check-localization.mjs`（加 `--static` 时不启动浏览器）
  - `node tools/check-skill.mjs`（加 `--static` 时只测 CLI）
  - `node tools/check.mjs`（用浏览器逐帧绘制所有动效；`--pack <pack>` 只查单包，`--strict` 时警告也算失败）
- 浏览器检查依赖：Playwright 不在本仓库依赖里，用 `MP_PLAYWRIGHT=<playwright 安装目录>` 指定；`check.mjs` 会启动 `python3 -m http.server`，可用 `MP_PYTHON` 指定 Python 路径（`tools/check.mjs` 开头注释及第 131 行）。
- lint：无
- dev：在仓库根目录运行 `python3 -m http.server 8000`，打开 `index.html`，或用 `dev/preview.html?pack=<pack>` 预览单包（可加 `&t=1.2` 定帧、`&only=5` 只看第 5 个）（`FORMAT.md` Tooling 节）。

## 验证流程

改完以下命令都通过才算完成，数量和结果以脚本输出为准：

1. `node tools/build.mjs`：退出码为 0。它同时负责校验，有任何问题都会退出码 1，并且不写入文件。
2. `node tools/build.mjs --check`：退出码为 0。
3. `node tools/check-localization.mjs`：最后一行为 `All localization checks passed.`
4. `node tools/check-skill.mjs`：全部为 `PASS`。
5. `node tools/check.mjs`：输出 `0 failed`。只改了某个包时，可以用 `--pack <pack>` 缩小范围。
6. 用 `git status` 确认生成物已和源文件一起提交（build 会改写下文「生成物」清单里的文件）。

没有 Playwright 的环境里，只能跑第 3、4 项的 `--static` 版本；这时要说明浏览器检查没有执行。

## 硬约束

### 生成物：禁止手改，修改源文件后重新 build

| 生成物 | 源头 |
|---|---|
| `api/v1/**`（`catalog.json`、`<lang>/catalog.tsv`、`<lang>/e/*.txt`、`<lang>/p/*.txt`、`kit/*.js`） | `packs/<pack>/{meta.json,pack.js}` |
| `assets/catalog.js` | 同上 |
| `packs/README.md`、`packs/<pack>/README*.md` | `meta.json` |
| `assets/site-config.js`、`skills/motion-prompt-zh/scripts/site-config.json` | `site.config.json` |
| `.claude-plugin/plugin.json`、`.claude-plugin/marketplace.json` | `site.config.json`（`tools/build.mjs` 第 596–606 行） |
| `index.html`、`found.html` 中带 `data-t` 的文字、带 `data-repo-path` 的链接、head 中的 meta 和 `#cmd` | `assets/site.js`、`assets/found.js` 的 `I18N['zh-Hans']`，以及 `site.config.json`（`tools/build.mjs` 第 543–575 行） |

`.github/ISSUE_TEMPLATE/{config,2-example}.yml` 也会被 build 改写，但只替换 `*.github.io` 格式的地址和 CONTRIBUTING 链接（`tools/build.mjs` 第 590–594 行）。其他地址要手动维护。

### 数据契约

- 已发布的编号永不重排、不复用，已发布的名称不改名；新动效只能接在已有编号之后（`FORMAT.md` 第 43 行、`CONTRIBUTING.md` 第 97 行）。
- `pack.js` 必须遵守 `FORMAT.md` 的标记和纯函数规则：
  - 用 `// @kit`、`// @element NN`、`// @shared`、`// @end` 切分；
  - `cells[i](k, w, h, u)` 只能依赖 `u`：不用 `Date`，绘制时不用 `Math.random`，不在两次调用之间保留状态；
  - 循环在 `u = cycle → 0` 处必须无缝衔接；
  - 除了创建离屏 canvas，不访问 DOM，不联网。
- `spec` 中的数字必须取自代码，不得编造（`FORMAT.md` 第 116 行）。
- 新增分类包时，需在 `assets/site.js` 的 `GROUP_DEFS` 中登记所属大类；未登记的包会显示在「其他」组。
- `examples/found.json` 的 `theme` 只能使用大类 id（`web`、`motion`、`film`）；`platform` 缺省为 `x`，为 `x` 时必须有 `id`。

### 版权与署名

- 原作者署名不可修改（`tools/build.mjs` 第 8 行）。
- `pack.js`、`e/<id>.txt`、`kit/<pack>.js` 的首行 MIT 版权行必须保留（`FORMAT.md` 第 50、154 行）。
- `LICENSE` 是 Shohei Ohtaki 的版权声明，不得改动。

### 禁止的操作

- **未经用户确认，不得 push `main`**。Pages 从 `main` 的根目录发布（`.github/pages-source.json`），push 就等于公开上线。
- 未经用户确认，不得 force push，不得修改 Pages 设置或仓库可见性。
- 不手改生成物，不修改 `tools/` 中的逻辑来让检查通过；被测对象删除时，可同步删除对应的测试。

### 接口契约（Skill 与站点）

- Skill CLI（`skills/motion-prompt-zh/scripts/motion-prompt.mjs`）按 `site.config.json` 中 `apiBase` 在前、`rawApiBase` 在后的顺序读取 `api/v1`。读到的中文资源必须和 `catalog.json` 一致，否则报错，不回退到英文。
- `pick` 回传地址只接受 `http://127.0.0.1:<端口>/` 或 `http://localhost:<端口>/`（`assets/site.js` 第 618–622 行），不得放宽。

## 发布

1. 完成上面的验证流程并提交。
2. 获得用户确认后 `git push origin main`，等 Pages 部署完成。
3. 刷新 jsDelivr 上 `@main` 的 `api/v1` 缓存（`https://purge.jsdelivr.net/gh/sadjjk/motion-prompt-zh@main/<路径>`）。不刷新的话，备用源会返回旧数据。
4. 如果改过 `site.config.json`，把生成的 `skills/motion-prompt-zh/scripts/site-config.json` 同步到本机安装的 skill。
