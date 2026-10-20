# Homepage: light & time

首页仍用 Jekyll / al-folio，采用 “Deep Field” 深色设计：深空底色，Instrument Serif 做标题，Geist 做正文，JetBrains Mono 做标签，朱红到琥珀的渐变做强调，四个研究章节各有一个颜色。首页始终是深色，因此隐藏了主题切换；其他页面使用相同的字体和强调色，保留浅色/深色切换。`_pages/about.md` 使用 `layout: research-home`（`_layouts/research-home.liquid`），al-folio 原有的 `about` 布局保持不变。页面依次是：四个研究章节、早期工作、一作论文、新闻和联系方式。所有交互图都是**合成示意**，不代表观测数据、拟合或检验结果。

## 通常只需要改这几个地方

- `_pages/about.md`：英文个人简介和折叠的中文简介。头像是 `assets/img/portrait.jpg`（800×800 正方形，网页上裁成圆形）。
- `_data/homepage.yml`：
  - `research`：四个章节的问题、介绍、Key results（每篇一作论文一句话）、Now 和图注。标题里用 `<em>` 包住的部分显示为彩色斜体；Key results 里用 `<strong>` 标出的数字或短语显示为该章节的颜色；
  - `earlier`：早期工作（X-ray AGN 与 GRB 220408B）；
  - `papers.groups`：按 arXiv 编号挑选的一作论文。ADS 每月自动重写 `papers.bib`，用 arXiv 编号可以避免列表被打乱；
  - Key results 和早期工作卡片里的 `eprint`：按 arXiv 编号从 `papers.bib` 读出论文标题和作者身份。是第一作者时显示 “First author”，否则显示作者序列，例如 “Fu, Zhang et al.”。
  - `papers.notes`：作者顺序看不出来的信息，按 arXiv 编号填写。`role` 表示作者身份（如 Co-first author），`status` 表示审稿状态（如 Under review at PRL）。首页、出版物页和简历页都会显示。写 `confirm:` 会在本地预览加一条虚线 “To confirm”，生产构建不显示。
- `_bibliography/papers.bib`：由 ADS 自动更新。新论文请加入 ADS library，不要只手工改这个文件。
- `_news/`：新闻；首页显示最近三条，`/news/` 显示全部。`ads-publication-*.md` 由 `bin/update_ads_publications.py` 每月重写，措辞也在这个脚本里：第一作者写成 “My paper … is now out in *期刊*.”，合作文章写成 “Now out in *期刊*: …（Fu, Zhang et al.）.”，预印本写成 “New preprint: …”。
- `_data/talks.yml`：报告列表，报告页和简历页共用。
- `_data/cv.yml`：简历。其中 `Publications: []` 和 `Talks: []` 留空，内容分别来自 `papers.bib`（按首页的 arXiv 编号列表）和 `_data/talks.yml`。
- `_sass/_research-home.scss`：首页样式。开头的 `--paper`、`--ink`、`--accent`、`--amber` 控制底色、文字和强调色，`--c1`–`--c4` 是四个章节的颜色，`--serif`、`--sans`、`--mono` 是三种字体。
- `_sass/_deep-field-site.scss`：其他页面的字体和浅色/深色配色。字体由 `_config.yml` 里 `google_fonts` 的链接加载。
- `_includes/research/*.liquid` 和 `assets/js/research-home.js`：四个交互图，均为内联 SVG，没有额外的前端依赖。

## 本地预览

需要 Ruby 3.3、Bundler、Node、ImageMagick 和 Jupyter/nbconvert。终端需要 UTF-8 locale，否则读取参考文献会出错：

```sh
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
bundle install
bundle exec jekyll serve --host 127.0.0.1 --port 4173
```

打开 `http://127.0.0.1:4173/`，检查手机宽度；其他页面还要检查浅色和深色两种模式。

## 四个图的内容与限制

- **01 光变**：两个视图。“Large sample” 是 314 个合成点的 Δmag–亮度图，只有样本数、8 个候选体和 0.24–0.82 mag 的振幅范围取自论文；“Lensed LRD” 是包层脉动加四个透镜像，只有约 130 年的时间跨度取自论文。
- **02 颜色 vs 光谱**：合成源只按颜色排成一行，加入光谱后分成宽线 LRD、窄线 LRD、强线伪装体、小蓝点和恒星形成星系。比例为示意（伪装体约 20%）。没有任何演化箭头。
- **03 无缝光谱**：图像 → grism → 一维光谱 → 证据 → LLM 判线与人工复核。88.3% 指 LLM 红移与最终人工确认红移的一致率，不是模型准确率。
- **04 IFU**：只有两步：slice 照明偏差（问题）→ 动力学质量（目标）。改正方法和两个 PA 的检验细节已按要求去掉，也不显示任何测量值或检验结果。

每个图右上角都有 “Synthetic” 标签。原来图下的长说明不再显示，改为这个标签的悬停提示，并保留给屏幕阅读器。

## 行为与无障碍

- 每个图都有自动轮播，可以暂停；用户点击后轮播停止，可再恢复。
- 系统 `prefers-reduced-motion` 为 reduce 时默认静止；屏外或隐藏的标签页停止逐帧更新。
- 所有按钮可用键盘操作；自动变化不会反复朗读，只有用户操作会通过屏幕阅读器播报。
- 动态状态用 SVG 属性或 HTML 中已有的 `data-*` 属性实现，避免被部署时的 PurgeCSS 删除。

## 2026-10-17 检查

- Jekyll 生产构建和现有 PurgeCSS 步骤成功，生产页面没有 JavaScript 错误。
- 用无头 Chrome 检查 1440/1280/1100 桌面和 375 手机宽度，包括浅色、深色和模拟的减少动态效果。
- 所有首页文件用仓库的 Prettier 配置检查通过。
- 2026-10-20 内容更新后，在本地预览上检查了桌面和手机宽度的首页卡片、论文列表、新闻、出版物、报告和简历页（浅色和深色）。这次没有重跑生产构建、PurgeCSS 和 Prettier，因为 `/private/tmp` 里的临时工具链被 macOS 自动清理了。
- Deep Field 改版后重新检查：1440/1100/900 桌面和 375 手机宽度没有横向滚动，手机菜单不透明；减少动态效果时脉冲动画停止；PurgeCSS 后章节颜色、自动轮播按钮和标题渐变都保留；出版物、报告和简历页在浅色和深色下正常。

发布仍走原仓库的 GitHub Actions：推送到 `master` 才会部署。这次只提交到本地分支，没有推送或发布。
