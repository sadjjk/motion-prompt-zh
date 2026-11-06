/* Motion Prompt — "Examples" page (found.html). Plain JS, no dependencies.
   Reads examples/found.json (URLs and our own one-line introductions only).
   Every post, X included, is shown as a link card; the page loads no third-party script or iframe. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  // 平台表：所有平台都只显示链接卡片（X 也不再用官方嵌入）；X 的作者主页可由账号推出。
  var PLATFORMS = {
    x: { home: function (it) { return 'https://x.com/' + encodeURIComponent(it.author.replace(/^@/, '')); } },
    xiaohongshu: {},
    wechat: {},
    other: {},
  };
  // 缺省为 x，保证旧条目不用改；写了未知平台时按「其他」处理。
  function platformOf(it) { return !it.platform ? 'x' : (PLATFORMS[it.platform] ? it.platform : 'other'); }
  // 只认 github.com 本站（含 www.）；github.io 上的项目页算网站
  function isGitHub(u) { try { return /^(www\.)?github\.com$/i.test(new URL(u).hostname); } catch (e) { return false; } }

  var I18N = {
    'zh-Hans': {
      localizationNotice: '本项目是 Motion Prompt 的非官方简体中文本地化版本，基于 Shohei Ohtaki 的开源项目开发。', sourceLink: '原始项目',
      title: '社区案例｜Motion Prompt',
      description: '社区作者用专业名称和动态示例建立共同语言的案例，保留原帖链接与作者归属。',
      skip: '跳转到案例列表', navLabel: '站点导航', navGallery: '效果库', navFound: '社区案例', langLabel: '语言',
      themeToDark: '切换深色模式', themeToLight: '切换浅色模式', eyebrow: '社区案例',
      h1: '用名称和示例，建立共同语言',
      lead: '这些作者整理了向 AI 描述需求的专业名称，配有动态示例或速查表，来自 X、小红书、微信公众号等平台，领域、语言和风格各不相同。我们选择包含作者自制示例的帖子或文章，内容与权利属于各位作者。',
      leadNote: '收录不代表作者认可或支持本站，案例介绍由本站编写。',
      listH: '案例列表', loadListFailed: '案例列表加载失败。',
      count: '{n} 条', postLang: { ja: '日语', en: '英语', zh: '中文' }, postLangLabel: '帖子语言：{l}',
      viewOn: '在{p}查看', viewOnLabel: '在{p}查看 {a} 的内容', platformName: { x: ' X ', xiaohongshu: '小红书', wechat: '公众号', other: '原网站', github: ' GitHub ' },
      moreH: '推荐你发现的案例', recH: '推荐帖子，也欢迎自荐',
      recP: '如果发现配有示例的专业术语帖子或文章（X、小红书、公众号等均可），可以通过 GitHub Issue 推荐。本站只放链接，不复制图片、视频或正文。', recLink: '推荐案例（GitHub Issue）',
      rmH: '申请移除或更正', rmP: '如需移除自己的帖子或更正介绍，请通过 Issue 表单提交，维护者核实后处理。', rmLink: '申请删除或更正（GitHub Issue）',
      author: '原作者', authorName: 'Shohei Ohtaki', whyLink: '原作者的创作缘起', addLink: '贡献专业术语', listLink: '中文名称列表（GitHub）',
      removeP1: '如需删除或更正本站介绍，请通过', removeLink: 'GitHub Issue 表单', removeP2: '提交，维护者核实后处理。',
      thanks1: '动态示例与可复制 Prompt 相结合的形式，受到', thanks2: '的启发，谨致谢意。',
    },
    ja: {
      localizationNotice: 'Shohei Ohtaki のオープンソースプロジェクトを基にした、Motion Prompt の非公式簡体字中国語版です。', sourceLink: '元のプロジェクト',
      title: '見つけた事例｜Motion Prompt',
      skip: '事例の一覧へ移動', navLabel: 'サイト内', navGallery: '見本', navFound: '事例', langLabel: '言語',
      themeToDark: 'ダークモードに切り替える', themeToLight: 'ライトモードに切り替える',
      eyebrow: '見つけた事例',
      h1: '名前と見本で、共通言語を作っている人たち',
      lead: 'AIに頼むための名前を、動く見本や早見表と一緒にまとめて公開している人たちの投稿です。X、小紅書、WeChat公式アカウントなど、分野も言語も見た目もそれぞれ違います。投稿者が自分で作った見本のある投稿を選んでいて、内容と権利は各投稿者にあります。',
      leadNote: 'ここで紹介していることは、投稿者がこのサイトを支持しているという意味ではありません。紹介文はこのサイトが書いています。',
      listH: '事例の一覧', loadListFailed: '一覧を読み込めませんでした。',
      count: '{n}件',
      postLang: { ja: '日本語', en: '英語', zh: '中国語' },
      postLangLabel: 'ポストの言語: {l}',
      viewOn: '{p}で見る',
      viewOnLabel: '{a} の投稿を{p}で見る',
      platformName: { x: 'X', xiaohongshu: '小紅書', wechat: 'WeChat公式アカウント', other: '元のサイト', github: 'GitHub' },
      moreH: '事例を教えてください',
      recH: 'ポストを推薦する（自薦も歓迎）',
      recP: '名前に見本を付けて公開している投稿（X、小紅書、WeChat公式アカウントなど）を見つけたら、GitHub の Issue で知らせてください。自分の投稿でもかまいません。載せるのはリンクだけで、画像や動画、本文をこのサイトに写すことはしません。',
      recLink: '事例を推薦する（GitHub Issue）',
      rmH: '外してほしいとき',
      rmP: 'ご自分のポストを外したい、紹介文が正しくない、という場合は Issue のフォームから依頼してください。確認できたら、すみやかに外します。',
      rmLink: '削除・訂正を依頼する（GitHub Issue）',
      author: '作者', authorName: '大滝昇平',
      whyLink: 'なぜ作ったか', addLink: 'あなたの分野の名前を足す', listLink: '名前の一覧（GitHub）',
      removeP1: '掲載の削除・訂正は', removeLink: 'GitHub の Issue のフォーム', removeP2: 'から依頼できます。確認後、すみやかに対応します。',
      thanks1: '動く見本を並べて、プロンプトをコピーして使う形は', thanks2: 'から着想を得ました。ありがとうございます。',
    },
    en: {
      localizationNotice: 'An unofficial Simplified Chinese localization of Motion Prompt, based on the open-source project by Shohei Ohtaki.', sourceLink: 'Original project',
      title: 'Examples — Motion Prompt',
      skip: 'Skip to the examples', navLabel: 'Site', navGallery: 'Gallery', navFound: 'Examples', langLabel: 'Language',
      themeToDark: 'Switch to dark mode', themeToLight: 'Switch to light mode',
      eyebrow: 'Examples we found',
      h1: 'People building a common language with names and samples',
      lead: 'Posts and articles by people who publish names to use with AI, together with moving samples or cheat sheets, from X, Xiaohongshu, WeChat official accounts and more. The fields, languages and looks all differ. We pick ones whose samples the author made, and each post and its rights belong to its author.',
      leadNote: 'Being listed here does not mean the author supports this site. The introductions are written by this site.',
      listH: 'Examples', loadListFailed: 'Could not load the list.',
      count: '{n} items',
      postLang: { ja: 'Japanese', en: 'English', zh: 'Chinese' },
      postLangLabel: 'Post language: {l}',
      viewOn: 'View on {p}',
      viewOnLabel: 'View the post by {a} on {p}',
      platformName: { x: 'X', xiaohongshu: 'Xiaohongshu', wechat: 'WeChat', other: 'the original site', github: 'GitHub' },
      moreH: 'Know a good one?',
      recH: 'Suggest a post (your own is welcome)',
      recP: 'If you find a post or article that shares names with samples (on X, Xiaohongshu, WeChat or elsewhere), tell us in a GitHub issue. It can be your own. We only link to it; images, videos and text are not copied to this site.',
      recLink: 'Suggest an example (GitHub issue)',
      rmH: 'To have a post removed',
      rmP: 'If you want your post taken off, or an introduction is wrong, use the issue form. We remove it as soon as the request is confirmed.',
      rmLink: 'Ask for a removal or correction (GitHub issue)',
      author: 'by', authorName: 'Shohei Ohtaki',
      whyLink: 'Why I made this', addLink: 'Add the names of your field', listLink: 'Name lists (GitHub)',
      removeP1: 'To ask for a removal or a correction, use the ', removeLink: 'issue form on GitHub', removeP2: '. We act on it once the request is confirmed.',
      thanks1: 'The format — moving samples with a prompt you can copy — was inspired by', thanks2: '. Thank you.',
    },
  };

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode etc. */ } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
  };
  var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : { matches: false };
  var state = { lang: window.MP_LANGUAGE.normalize(root.lang) || 'zh-Hans', data: null };

  function t(key, vars) {
    var s = I18N[state.lang][key];
    if (s == null) s = I18N.en[key];
    if (s == null) s = key;
    if (vars && typeof s === 'string') Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }
  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function isDark() {
    var a = root.getAttribute('data-theme');
    return a ? a === 'dark' : darkQuery.matches;
  }

  // ------------------------------------------------------------------ list
  function build() {
    var wrap = $('#themes');
    wrap.innerHTML = '';
    var data = state.data;
    data.themes.forEach(function (th) {
      var items = data.items.filter(function (it) { return it.theme === th.slug; });
      if (!items.length) return;
      var hid = 'th-' + th.slug;
      var list = h('ul', { class: 'ex-list' });
      items.forEach(function (it) {
        var pf = platformOf(it);
        var names = t('platformName') || {};
        var viewLink = function (href, key) {
          var p = names[key] || key;
          return h('a', { class: 'ex-x', href: href, rel: 'noopener', 'aria-label': t('viewOnLabel', { a: it.author, p: String(p).trim() }), text: t('viewOn', { p: p }) });
        };
        // 平台标签与「在…查看」按钮：X/小红书/公众号各一个；「其他」按网址推出——url 在 github.com 上只算 GitHub，
        // 否则算网站（Web），另填了 repoUrl 时再加 GitHub。标签与按钮成对生成，两者顺序一致：先 GitHub，后 Web。
        var tags = [], links = [];
        if (pf === 'other') {
          var urlOnGitHub = isGitHub(it.url);
          var repo = urlOnGitHub ? it.url : it.repoUrl;
          if (repo) { tags.push('GitHub'); links.push(viewLink(repo, 'github')); }
          if (!urlOnGitHub) { tags.push('Web'); links.push(viewLink(it.url, 'other')); }
        } else {
          if (pf !== 'x') tags.push(String(names[pf] || pf).trim());
          links.push(viewLink(it.url, pf));
        }
        // 作者主页：优先用数据里的 authorUrl；X 可由账号推出；其他平台没有时只显示文字
        var home = it.authorUrl || (PLATFORMS[pf].home ? PLATFORMS[pf].home(it) : '');
        var author = home ? h('a', { class: 'ex-author', href: home, rel: 'noopener', text: it.author }) : h('span', { class: 'ex-author', text: it.author });
        var langName = (t('postLang') || {})[it.lang] || it.lang;
        var li = h('li', { class: 'ex' }, [
          h('div', { class: 'ex-head' }, [
            author,
            h('span', { class: 'ex-tags' }, tags.map(function (s) { return h('span', { class: 'ex-lang ex-platform', text: s }); }).concat([
              h('span', { class: 'ex-lang', title: t('postLangLabel', { l: langName }), 'aria-label': t('postLangLabel', { l: langName }), text: String(it.lang).toUpperCase() }),
            ])),
          ]),
          h('p', { class: 'ex-intro', text: (it.intro && (it.intro[state.lang] || it.intro.en || it.intro.ja)) || '' }),
          h('div', { class: 'ex-act' }, links),
        ]);
        list.appendChild(li);
      });
      wrap.appendChild(h('section', { class: 'ex-theme', 'aria-labelledby': hid }, [
        h('div', { class: 'pack-h' }, [
          h('h3', { id: hid, text: th[state.lang] || th.en }),
          h('span', { text: t('count', { n: items.length }) }),
        ]),
        list,
      ]));
    });
  }

  // ------------------------------------------------------------------ text, language, theme
  function applyText() {
    var lang = state.lang;
    root.lang = lang;
    document.title = t('title');
    window.MP_LOCALIZE_PAGE(t('title'), I18N[lang].description || I18N[lang].lead);
    $$('[data-t]').forEach(function (n) { n.textContent = t(n.getAttribute('data-t')); });
    $$('[data-t-attr]').forEach(function (n) {
      n.getAttribute('data-t-attr').split(',').forEach(function (pair) {
        var kv = pair.split(':'); n.setAttribute(kv[0].trim(), t(kv[1].trim()));
      });
    });
    $$('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false'); });
    $$('[data-href-' + lang + ']').forEach(function (a) { a.href = a.getAttribute('data-href-' + lang); });
    applyTheme();
  }
  function applyTheme() { $('#theme').setAttribute('aria-label', t(isDark() ? 'themeToLight' : 'themeToDark')); }
  $$('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () {
      var lang = b.getAttribute('data-lang');
      if (lang === state.lang) return;
      state.lang = lang;
      store.set('mp-lang', lang);
      window.MP_LANGUAGE.updateUrl(lang);
      applyText();
      if (state.data) build();  // rebuild redraws the card intros in the new language
    });
  });
  $('#theme').addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    store.set('mp-theme', next);
    applyTheme();
  });
  if (darkQuery.addEventListener) darkQuery.addEventListener('change', applyTheme);

  // ------------------------------------------------------------------ start
  applyText();
  fetch('examples/found.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      state.data = data;
      build();
    })
    .catch(function () { $('#f-empty').hidden = false; });
})();
