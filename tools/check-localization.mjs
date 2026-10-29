#!/usr/bin/env node
// Regression checks for Chinese data, generated resources, gallery and local Skill hand-off.
// MP_PLAYWRIGHT=/path/to/playwright node tools/check-localization.mjs [--static] [--screenshots dir]
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolveConfig } from '../skills/motion-prompt-zh/scripts/config.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
const json = rel => JSON.parse(read(rel));
const CONFIG = resolveConfig(json('site.config.json'));
const args = process.argv.slice(2);
const shotIndex = args.indexOf('--screenshots');
const shots = shotIndex >= 0 ? path.resolve(args[shotIndex + 1]) : null;
const langs = ['zh-Hans', 'en', 'ja'];
const window = { MP_SITE_CONFIG: CONFIG };
vm.runInNewContext(read('assets/catalog.js'), { window });
const cat = window.MP_CATALOG;
assert.equal(cat.count, 363);
assert.equal(cat.packs.length, 10);
assert.equal(cat.groups.length, 4);
assert.equal(cat.site, CONFIG.site);
assert.equal(cat.repo, CONFIG.repo);
assert.equal(fs.existsSync(path.join(ROOT, 'api/v1/zh')), false);
const seenIds = new Set();
for (const el of cat.elements) {
  // 编号写在 meta.json，与展示位置无关：格式 <大类序号>-<3 位>，前缀与所在大类一致，全库唯一
  const g = cat.groups.find(x => x.id === el.group);
  assert.match(el.id, /^\d-\d{3}$/, `${el.id} id format`);
  assert.equal(el.id.split('-')[0], String(g.no), `${el.id} group prefix`);
  assert.ok(!seenIds.has(el.id), `${el.id} is used twice`); seenIds.add(el.id);
  // 添加日期：首页「最新添加」排序依据，build 由 meta.json 的 added 写入
  assert.match(el.added, /^\d{4}-\d{2}-\d{2}$/, `${el.id} added`);
  for (const key of ['name', 'meaning', 'ask', 'summary', 'use']) assert.match(el[key]['zh-Hans'], /[\u3400-\u9fff]/);
  const p = cat.packs.find(p => p.pack === el.pack);
  for (const lang of langs) {
    assert.equal(read(`api/v1/${lang}/p/${el.id}.txt`), window.MP_PROMPT(el, p.title[lang], lang, CONFIG.site, CONFIG.apiBase, el.author || p.author) + '\n');
    // 首行版权：效果级 license 优先（他人作品放进本包时），否则用所属包的 license，缺省为 Shohei Ohtaki
    assert.ok(read(`api/v1/${lang}/e/${el.id}.txt`).startsWith(`// Motion Prompt #${el.id} · ${el.license || p.license}`), `${el.id} licence line`);
  }
}
for (const p of cat.packs) {
  assert.equal(p.count, json(`packs/${p.pack}/meta.json`).elements.length);
  assert.ok(read(`packs/${p.pack}/README.zh-Hans.md`).includes(p.title['zh-Hans']));
  assert.ok(read(`api/v1/kit/${p.pack}.js`).split('\n')[0].includes(p.license), `${p.pack} kit licence line`);
}
assert.equal(cat.packs.filter(p => p.license === 'MIT License (c) 2026 Shohei Ohtaki').length, 6);
for (const lang of langs) assert.equal(read(`api/v1/${lang}/catalog.tsv`).trim().split('\n').length, cat.count + 1);
// 改写自 Libraries.dev 的包：版权行与署名指向 Jakub Antalik
assert.equal(read('api/v1/zh-Hans/e/1-049.txt').split('\n')[0], '// Motion Prompt #1-049 · MIT License (c) 2026 Jakub Antalik · https://libraries.dev/');
assert.equal(read('api/v1/kit/aiux.js').split('\n')[0], '// Motion Prompt #1 049~060 · 128 · MIT License (c) 2026 Jakub Antalik · https://libraries.dev/');
assert.match(read('api/v1/zh-Hans/p/1-049.txt'), /保留 Jakub Antalik 的 MIT 版权标识/);
assert.match(read('api/v1/zh-Hans/p/1-001.txt'), /保留 Shohei Ohtaki 的 MIT 版权标识/);
// 改写自 Motion Atlas 的包：版权行与署名指向 Yun
assert.equal(read('api/v1/zh-Hans/e/4-001.txt').split('\n')[0], '// Motion Prompt #4-001 · MIT License (c) 2026 Yun · https://github.com/skylarzzzz/motion-atlas');
assert.match(read('api/v1/zh-Hans/p/4-001.txt'), /保留 Yun 的 MIT 版权标识/);
// 改写自 Lucian UX/UI Prompt 的包：版权行与署名指向 Seokwoooo
assert.equal(read('api/v1/zh-Hans/e/1-061.txt').split('\n')[0], '// Motion Prompt #1-061 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/');
assert.match(read('api/v1/zh-Hans/p/1-061.txt'), /保留 Seokwoooo 的 MIT 版权标识/);
// 改写自 mg-styles-15 的包：版权行与署名指向 Vincentwei1021
assert.equal(read('api/v1/zh-Hans/e/2-049.txt').split('\n')[0], '// Motion Prompt #2-049 · MIT License (c) 2026 Vincentwei1021 · https://github.com/Vincentwei1021/mg-styles-15');
assert.match(read('api/v1/zh-Hans/p/2-049.txt'), /保留 Vincentwei1021 的 MIT 版权标识/);
// 放进 Shohei 原作包的效果：效果级版权指向 Emil Kowalski；同包原作仍为 Shohei 并链接原站；kit 首行之后列出其他版权人
assert.equal(read('api/v1/zh-Hans/e/1-098.txt').split('\n')[0], '// Motion Prompt #1-098 · MIT License (c) 2026 Emil Kowalski · https://github.com/emilkowalski/skills');
assert.match(read('api/v1/zh-Hans/p/1-098.txt'), /保留 Emil Kowalski 的 MIT 版权标识/);
// MIT-0 作品（改写自 ui2v，illli Ai Studio）：首行写 MIT-0 License，中文 Prompt 末句提示保留 MIT-0 版权标识
assert.equal(read('api/v1/zh-Hans/e/1-108.txt').split('\n')[0], '// Motion Prompt #1-108 · MIT-0 License (c) 2026 illli Ai Studio · https://ui2v.com/');
assert.match(read('api/v1/zh-Hans/p/1-108.txt'), /保留 illli Ai Studio 的 MIT-0 版权标识/);
assert.ok(read('api/v1/zh-Hans/e/1-001.txt').startsWith('// Motion Prompt #1-001 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#049'));
assert.match(read('api/v1/kit/ui.js').split('\n')[1], /^\/\/ Also: MIT License \(c\) 2026 Emil Kowalski · https:\/\/github\.com\/emilkowalski\/skills \(#1 098~102\)$/);
assert.deepEqual(json('skills/motion-prompt-zh/scripts/site-config.json'), CONFIG);
const cli = ['skills/motion-prompt-zh/scripts/motion-prompt.mjs'];
function runCli(words) {
  const r = spawnSync(process.execPath, [...cli, ...words], { cwd: ROOT, encoding: 'utf8', windowsHide: true });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.replace(/\r\n/g, '\n');
}
assert.match(runCli(['search', '弹性']), /#2-001/);
assert.match(runCli(['search', '遮罩']), /#2-005/);
assert.match(runCli(['search', '镜头推进']), /#3-003/);
assert.match(runCli(['search', 'typewriter']), /#2-006/);
assert.match(runCli(['search', '#2-048']), /#2-048/);
for (const lang of [...langs, 'zh']) assert.equal(runCli(['prompt', '2-012', '--lang', lang]).trim(), read(`api/v1/${lang === 'zh' ? 'zh-Hans' : lang}/p/2-012.txt`).trim());
console.log(`PASS: ${cat.count} Chinese entries, ${cat.count * 3} prompts match API, ${cat.count * 3} code resources, ${cat.packs.length} READMEs, per-pack licence lines, CLI search/languages.`);
if (args.includes('--static')) process.exit(0);

let chromium;
try { ({ chromium } = createRequire(import.meta.url)(process.env.MP_PLAYWRIGHT || 'playwright')); }
catch { console.error('Playwright unavailable. Static checks passed; browser checks NOT run. Set MP_PLAYWRIGHT.'); process.exit(2); }
const types = { '.js':'text/javascript', '.json':'application/json', '.html':'text/html', '.css':'text/css', '.svg':'image/svg+xml', '.txt':'text/plain', '.tsv':'text/tab-separated-values', '.png':'image/png', '.gif':'image/gif' };
const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (rel.startsWith('/motion-prompt-zh/')) rel = rel.slice('/motion-prompt-zh'.length);
  const file = path.resolve(ROOT, '.' + (rel.endsWith('/') ? rel + 'index.html' : rel));
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => { res.writeHead(err ? 404 : 200, { 'Content-Type': (types[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8' }); res.end(err ? 'Not found' : data); });
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
const errors = [];
try {
  browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch());
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
  await context.route('https://platform.twitter.com/**', route => route.abort());
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(`${r.status()} ${r.url()}`); });
  const open = async (suffix = '') => {
    await page.goto(base + '/motion-prompt-zh/' + suffix);
    await page.waitForFunction(() => document.querySelectorAll('.tile').length === 363 && Object.keys(window.MotionPrompt.packs).length === 10);
  };
  await open();
  assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
  // 默认按最新添加（同 assets/site.js 的排序）：首张为最新日期新增的效果里，所属分类包 order 最大者的第一个；
  // 新增的可以是新建分类包，也可以是往已有包补充的效果，所以按元素的 added 取，不按包的 added 取。第一个分节标题为「YYYY/MM/DD 添加」
  const newestDay = cat.elements.reduce((m, e) => (e.added > m ? e.added : m), '');
  const newestEls = cat.elements.filter(e => e.added === newestDay);
  const orderOf = id => cat.packs.find(p => p.pack === id).order;
  const newestFirst = newestEls.reduce((a, e) => (orderOf(e.pack) > orderOf(a.pack) ? e : a));
  assert.equal(await page.locator('.tile').first().getAttribute('data-id'), newestFirst.id);
  assert.equal(await page.locator('.group-h h3').first().innerText(), `${newestDay.replace(/-/g, '/')} 添加`);
  assert.equal(await page.locator('#sort [aria-pressed="true"]').innerText(), '最新添加');
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), CONFIG.site);
  // 标题不写死数量，避免新增分类包后过时
  assert.match(await page.title(), /动效与视觉效果中文名称库/);
  assert.equal(await page.locator('.seg-b').allTextContents().then(x => x.join('/')), 'ZH/EN/JA');
  assert.equal(await page.locator('.tile.is-broken').count(), 0);
  await page.locator('#play').click();
  assert.equal(await page.locator('#play').getAttribute('aria-pressed'), 'false');
  await page.locator('#play').click();
  assert.equal(await page.locator('#play').getAttribute('aria-pressed'), 'true');
  assert.equal(/[\u3040-\u30ff]/.test(await page.locator('body').innerText()), false, 'Untranslated Japanese outside Canvas');
  const searches = [['弹性', '2-001'], ['遮罩', '2-005'], ['镜头推进', '3-003'], ['typewriter', '2-006'], ['#2-048', '2-048'], ['2-012', '2-012']];
  for (const [term, id] of searches) {
    await page.locator('#q').fill(term);
    await page.waitForFunction(id => !document.querySelector('.tile[data-id="' + id + '"]').parentElement.hidden, id);
  }
  await page.locator('#q').fill('');
  // 切换「编号」：按大类（界面与网页 → 动态图形 → …）分节，首张为 #1-001，网址带 sort=id，可直接打开
  await page.locator('#sort .gseg-b', { hasText: '编号' }).click();
  assert.equal(await page.locator('.tile-name').first().innerText(), '模态对话框');
  assert.equal(new URL(page.url()).searchParams.get('sort'), 'id');
  await open('?lang=zh-Hans&sort=id');
  assert.equal(await page.locator('.tile-name').first().innerText(), '模态对话框');
  assert.equal(await page.locator('#sort [aria-pressed="true"]').innerText(), '编号');
  await open('?lang=zh-Hans');
  await page.locator('[data-lang=en]').click();
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  await open();
  assert.equal(await page.locator('html').getAttribute('lang'), 'en', 'Saved language without a URL override');
  assert.equal(await page.locator('meta[property="og:locale"]').getAttribute('content'), 'en_US');
  assert.deepEqual(await page.locator('meta[property="og:locale:alternate"]').evaluateAll(nodes => nodes.map(n => n.content)), ['zh_CN', 'ja_JP']);
  await open('?lang=ja');
  assert.equal(await page.locator('html').getAttribute('lang'), 'ja');
  await open('?lang=zh');
  assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
  assert.equal(new URL(page.url()).searchParams.get('lang'), 'zh-Hans');
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
  await open('?lang=invalid');
  assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
  await open('?lang=zh-Hans#2-048');
  await page.waitForFunction(() => document.querySelector('#detail').open);
  assert.equal(await page.locator('#d-name').innerText(), '分屏');
  await page.locator('#d-prev').click();
  assert.equal(await page.locator('#d-name').innerText(), '爆炸分解图');
  await page.locator('#d-next').click();
  assert.equal(await page.locator('#d-name').innerText(), '分屏');
  assert.equal(await page.locator('#d-prompt').innerText(), read('api/v1/zh-Hans/p/2-048.txt').trim());
  await page.locator('#d-copy-prompt').click();
  assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n'), read('api/v1/zh-Hans/p/2-048.txt').trim());
  await page.locator('#d-pick').click();
  await page.locator('#d-close').click();
  await page.locator('[data-pick="2-005"]').click();
  await page.locator('#tray-note').fill('用于开场标题');
  await page.locator('#tray-main').click();
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /用于开场标题/);
  await page.locator('#tray-share').click();
  const share = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(share.startsWith(base + '/motion-prompt-zh/?'));
  assert.equal(new URL(share).searchParams.get('lang'), 'zh-Hans');
  assert.equal(new URL(share).searchParams.get('cb'), null);
  await page.goto(share);
  assert.equal(await page.locator('.tile-box.is-picked').count(), 2);
  await page.locator('#tray-clear').click();
  assert.equal(await page.locator('.tile-box.is-picked').count(), 0);
  await page.goto(base + '/motion-prompt-zh/found.html?lang=zh');
  await page.waitForSelector('.ex-intro');
  assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
  assert.match(await page.locator('.ex-intro').first().innerText(), /六种/);
  for (const lang of ['en', 'ja', 'zh-Hans']) {
    await page.locator(`[data-lang="${lang}"]`).click();
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('lang'), lang);
  }
  await page.locator('a.logo').click();
  await page.waitForSelector('.tile');
  assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
  await page.goto(base + '/');
  await page.waitForSelector('.tile');
  assert.equal(await page.locator('.tile.is-broken').count(), 0);
  if (shots) fs.mkdirSync(shots, { recursive: true });
  for (const width of [1440, 390, 375, 361, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await open('?lang=zh-Hans');
    const overflow = await page.evaluate(() => Array.from(document.querySelectorAll('body *')).filter(el => {
      const r = el.getBoundingClientRect(); return r.width && r.right > innerWidth + 1 && getComputedStyle(el).position !== 'absolute';
    }).slice(0, 8).map(el => el.className || el.id || el.tagName));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Horizontal overflow at ${width}: ${overflow.join(', ')}`);
    const controls = await page.locator('.seg').boundingBox();
    assert.ok(controls.x >= 0 && controls.x + controls.width <= width, `Language buttons outside viewport at ${width}`);
    assert.ok(await page.locator('.top-nav').evaluate(el => el.getBoundingClientRect().right <= document.documentElement.clientWidth), `Header overflow at ${width}`);
    if (shots) await page.screenshot({ path: path.join(shots, `gallery-${width}.png`) });
    await open('?lang=zh-Hans#2-001');
    await page.waitForFunction(() => document.querySelector('#detail').open);
    await page.evaluate(() => Promise.all(document.getAnimations().map(a => a.finished.catch(() => {}))));
    assert.ok(await page.locator('#d-copy-prompt').isVisible());
    if (shots) await page.screenshot({ path: path.join(shots, `detail-${width}.png`) });
  }
  console.log('PASS: default Chinese, aliases, URL/storage precedence, refresh, 3 languages, searches, detail, clipboard, picks, share, examples, root/subpath, 1440/390/375/361/320 layouts.');

  // Exercise the actual local CLI listener: the browser selects and sends back canonical Chinese.
  const child = spawn(process.execPath, [...cli, 'pick', '--local', '--no-open', '--lang', 'en', '--timeout', '30'], { cwd: ROOT, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '', stderr = '';
  const result = new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', code => resolve(code)); });
  child.stdout.on('data', b => { output += b.toString(); });
  child.stderr.on('data', b => { stderr += b.toString(); });
  try {
    const until = Date.now() + 10000;
    let match;
    while (!(match = output.match(/http:\/\/127\.0\.0\.1:\d+\/\?[^\s]+/)) && Date.now() < until) await new Promise(r => setTimeout(r, 50));
    assert.ok(match, output + stderr);
    await page.goto(match[0]);
    await page.waitForSelector('[data-pick="2-012"]');
    await page.locator('[data-lang="zh-Hans"]').click();
    await page.locator('[data-pick="2-012"]').click();
    await page.locator('#tray-main').click();
    await page.waitForFunction(() => document.title === '已发送给 AI | Motion Prompt');
    assert.equal(await result, 0, stderr);
    assert.match(output, /#2-012.*形状变形/);
    assert.match(output, /四种形状/);
  } finally { child.kill(); }
  console.log('PASS: real Skill local pick → Chinese switch → Send to AI → callback acknowledgement and Chinese specs.');
  assert.deepEqual(errors, []);
  await context.close();
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
console.log('All localization checks passed.');
