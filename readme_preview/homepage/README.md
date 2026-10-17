# Homepage: light & time

首页仍用 Jekyll / al-folio，以暖白、墨蓝和朱红为基础。`_pages/about.md` 使用 `layout: research-home`（`_layouts/research-home.liquid`），al-folio 原有的 `about` 布局保持不变。页面依次是：四个研究章节、早期工作、一作论文、新闻和联系方式。所有交互图都是**合成示意**，不代表观测数据、拟合或检验结果。

## 通常只需要改这几个地方

- `_pages/about.md`：英文个人简介和折叠的中文简介。
- `_data/homepage.yml`：
  - `research`：四个章节的问题、介绍、Key results（每篇一作论文一句话）、Now 和图注；
  - `earlier`：早期工作（X-ray AGN 与 GRB 220408B）；
  - `papers.groups`：按 arXiv 编号挑选的一作论文。ADS 每月自动重写 `papers.bib`，用 arXiv 编号可以避免列表被打乱；
  - `papers.notes` 和 `contribution: confirmed: false`：待确认的事实。本地预览显示虚线 “To confirm”，`JEKYLL_ENV=production` 构建时自动隐藏。
- `_bibliography/papers.bib`：由 ADS 自动更新。新论文请加入 ADS library，不要只手工改这个文件。
- `_news/`：新闻；首页显示最近三条，`/news/` 显示全部。
- `_sass/_research-home.scss`：样式。开头的 `--paper`、`--ink`、`--accent` 分别控制底色、文字和强调色，深色模式紧随其后。
- `_includes/research/*.liquid` 和 `assets/js/research-home.js`：四个交互图，均为内联 SVG，没有额外的前端依赖。

## 本地预览

需要 Ruby 3.3、Bundler、Node、ImageMagick 和 Jupyter/nbconvert。终端需要 UTF-8 locale，否则读取参考文献会出错：

```sh
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
bundle install
bundle exec jekyll serve --host 127.0.0.1 --port 4173
```

打开 `http://127.0.0.1:4173/`，检查手机宽度和深色模式。

## 四个图的内容与限制

- **01 光变**：两个视图。“Large sample” 是 314 个合成点的 Δmag–亮度图，只有样本数、8 个候选体和 0.24–0.82 mag 的振幅范围取自论文；“Lensed LRD” 是包层脉动加四个透镜像，只有约 130 年的时间跨度取自论文。
- **02 颜色 vs 光谱**：合成源只按颜色排成一行，加入光谱后分成宽线 LRD、窄线 LRD、强线伪装体、小蓝点和恒星形成星系。比例为示意（伪装体约 20%）。没有任何演化箭头。
- **03 无缝光谱**：图像 → grism → 一维光谱 → 证据 → LLM 判线与人工复核。88.3% 指 LLM 红移与最终人工确认红移的一致率，不是模型准确率。
- **04 IFU**：slice 照明偏差 → 在 drizzle 前改正 → 两个 PA 检验 → 动力学质量。不显示任何测量值或检验结果。发布前请确认这一方法描述可以公开。

## 行为与无障碍

- 每个图都有自动轮播，可以暂停；用户点击后轮播停止，可再恢复。
- 系统 `prefers-reduced-motion` 为 reduce 时默认静止；屏外或隐藏的标签页停止逐帧更新。
- 所有按钮可用键盘操作；自动变化不会反复朗读，只有用户操作会通过屏幕阅读器播报。
- 动态状态用 SVG 属性或 HTML 中已有的 `data-*` 属性实现，避免被部署时的 PurgeCSS 删除。

## 2026-10-17 检查

- Jekyll 生产构建和现有 PurgeCSS 步骤成功，生产页面没有 JavaScript 错误。
- 用无头 Chrome 检查 1440/1280/1100 桌面和 375 手机宽度，包括浅色、深色和模拟的减少动态效果。
- 所有首页文件用仓库的 Prettier 配置检查通过。

发布仍走原仓库的 GitHub Actions：推送到 `master` 才会部署。这次只提交到本地分支，没有推送或发布。
