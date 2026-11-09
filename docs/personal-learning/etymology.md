# 词根词源学习模块

## 范围和使用

本模块为原 React 18 / TS 4.9 / Vite 4 / Dexie 3.2 应用的增量功能。没有替换词库、重排章节、更改单词标识、升级依赖或新增付费服务。

- 英语单词完整正确输入后，先完成原逐词保存，然后每次都自动在单词下方显示内嵌词源区域（不弹窗、不遮罩）。上方保留完整、正确的输入结果，只有回车、空格或“下一个词”才推进。
- 输入错误不会触发卡片。没有可靠词源资料（含待核实资料）时显示提示，仍保留当前词等待确认。资料读取超过 1.5 秒则显示无资料提示，不自动跳词，也不妨碍确认下一词。
- 卡片打开或查找期间暂停原练习计时、输入与切词快捷键。按回车或空格（松开按键后）或点击继续，只推进一次；长按不会把按键误输到下一个词，操作链接、按钮和展开项时保留控件原生键盘行为。答对卡片中的词根链接在新标签页打开，避免离开当前章节时丢失待完成的汇总。单词循环仍按原次数逐次记录。
- 练习页移除手动打开/关闭入口；旧的首次/关闭设置不再抑制显示。词根库仍可查阅资料（包括明确标记的待核实内容）。
- 我的词根库 `/roots` 支持词根/含义/关联单词搜索、语言和学习状态筛选、收藏、手动标记掌握/待复习、关联词跳转及查看历史。
- 阅读不代表掌握；不增加 wordRecords、chapterRecords、reviewRecords 或任何 FSRS 次数。当前仓库没有例句填空或 FSRS 实现，只提供可复用的完成反馈 hook。
- 释义和音标读取现有词库；当前词库缺失的英文释义、词性、用法明确显示未提供，不自动编造或建立第二份基础词典。没有新增 ECDICT 全量数据。

## 数据库与兼容

`RecordDB` 从版本 3 增量升级到 4，保留全部旧表和记录，不调用 clear/reset。新增：

| 表                 | 主键和作用                                              |
| ------------------ | ------------------------------------------------------- |
| etymologyEntries   | id；规范词形唯一索引、独立词源和构词结构                |
| roots              | id；来源语言、含义、证据和关联词根                      |
| rootWordRelations  | id；rootId、wordId、关系类别和来源                      |
| rootFavorites      | rootId；收藏时间                                        |
| rootLearningStates | rootId；首次/最近查看、次数、手动状态、通过哪些单词学习 |
| rootLearningEvents | 自增 id；每次查看时间及来源单词                         |
| etymologyViews     | normalizedWord；查看次数与首次答对展示时间              |
| etymologySettings  | key；保留旧版显示偏好以兼容备份，不再影响自动反馈       |
| etymologyPackages  | id；数据包导入时间及内置包初始化标记                    |

原词条没有全局 wordId。本模块使用 `en:规范词形` 作为额外关联标识，不修改原 JSON、词库 ID、章节索引或历史记录。当前按词形合并查阅；多义/多词源词应在后续数据版本增加义项区分，不自动合并成一种历史。

A cognate、B shared_root、C related_meaning 分别保留。A/B 在语言学上可能有交集，本模块按主要关系分类；C 不用于推断同源，也不据此标记用户已学某词根。所有来源状态和原文证据可展开检查。`confidence` 是资料包作者的评估，不是统计学概率。

## 首批数据来源和许可

`public/data/etymology/starter.json`：14 个词、4 个拉丁语词根学习标签（spect、port、struct、cancell）。包含 cancel、cancellate、inspect、inspection、spectator、spectacle、respect、perspective、transport、portable、import、export、construct、structure。

已实际取得并逐条对照以下原文：

- Webster's Unabridged Dictionary，Project Gutenberg #29765，2014-05-18 更新版本。
- 可核查镜像：<https://raw.githubusercontent.com/GITenberg/Webster-s-Unabridged-Dictionary_29765/master/29765-8.txt>
- 取得的完整文件 SHA-256：`9d5bfec1205c301f7a206762af8fa1542324fc34c7442e840d97eec4a6ebfda2`。
- 历史词典正文在美国属于公有领域；Project Gutenberg 文件自身附分发条款，其他地区须核查适用版权期限。本包只保留短原文词源证据和重新整理的中文说明，没有复制整本文件或 Etymonline 词条。对本包原创中文说明按 CC0 提供。

“已核实”表示与所附历史词典原文对照过，不代表现代多来源学术定论。资料较旧，不提供未经核实的年代、原始印欧语词根或完整现代语义演变。`cancel` 不强拆为 can + cel；没有可靠拆解的词明确留空。现代学习拆解与历史借入路径分别呈现。

### Wiktionary

重要参考入口：<https://en.wiktionary.org/>。词源章节与词形模板可通过 Wikimedia dump / Wiktextract 提取；原始模板不能仅凭简单正则可靠展开。Wiktextract 工具与词典内容的许可需分开处理，工具开源不改变内容许可。

- 提取工具：<https://github.com/tatuylonen/wiktextract>（本次已阅读 README）。
- 已提取数据入口：<https://kaikki.org/>（README 提供，未下载全量）。
- Wikimedia dump 入口：<https://dumps.wikimedia.org/enwiktionary/>。
- Wiktionary 文本通常按 CC BY-SA 4.0 及其站点条款使用，导出前必须核对所选 dump 的实际许可，保存作者归属、词条链接、版本/修订链接；修改和再分发衍生内容时保留对应许可。不能将其混标成公有领域。

当前环境对 Wiktionary 域名的请求返回代理 403。因此首批数据没有声称已从该站核实。提供本地转换脚本，不尝试绕过访问限制：

```bash
python3 scripts/data/prepare-etymology.py \
  --input /path/to/english-wiktextract.jsonl \
  --words /path/to/selected-words.txt \
  --output /path/to/pending-etymology.json
```

脚本流式筛选英文 `etymology_text`，只生成 pending 状态、空构词与空关系的候选包，不推断拉丁语/希腊语词根，不生成历史事实。人工检查原文、词源编号、借入路径、拆解位置与来源许可后，才可调整核实状态并补充关系。脚本不覆盖已有输出。它是候选资料处理工具，不是自动权威词源引擎。

### Etymonline

<https://www.etymonline.com/> 仅作为人工辅助参考和链接。当前网络同样阻止访问，未读取/复制词条，也没有批量爬虫。获得许可前不把其词条装进离线数据包。

### ECDICT

<https://github.com/skywind3000/ECDICT> 用于以后补充基础词典。它的释义、词性、词频和词形变化不构成词源证据；不能据此自动认定同源关系。本模块未重复导入其基础词典。

## 数据包导入与本地备份

- 词源包格式 `qwerty-etymology` v1，完整示例见 starter.json；包含 entries、roots、relations，引用必须在包内完整闭合。
- 导入前检查 ID、规范词形、唯一性、语素范围/重叠/拼写、关系类型、可信度、来源证据及 HTTPS 链接。普通包最多 5 MB，词根备份恢复最多 50 MB（更大数据使用原完整数据库备份）。仅渲染纯文本，不执行 HTML，不请求来源链接。
- 数据包内“已核实”是作者声明，不是软件在线事实核查；用户应导入可信来源。
- 同 ID 资料会更新，但不清除用户收藏或学习历史；示例初始化只补缺失项目，不覆盖已有导入内容。
- “导出词根备份”包括资料、收藏、个人状态、查看历史和显示设置；恢复时合并词源资料并原子替换本模块个人数据，不写入或清理其他学习表。请在恢复前导出当前备份。
- 原“设置 → 数据导出”的 `.gz` 完整数据库导出会自动包含新表。原完整导入仍保留覆盖式语义；旧版备份没有新表，恢复前应另存词根备份。
- 所有已导入数据在 IndexedDB 本地保存，不需要账号或 API。清理站点数据、隐私模式、换浏览器或 origin 仍会影响可见性，需定期导出。
- 可断网查看已导入资料。整个网站尚无 Service Worker，本次不宣称断网冷启动，也没有改变公司电脑的执行策略；使用现有静态部署即可，无需新增管理员权限。

## 验证

```bash
CHROMIUM_PATH=/usr/bin/chromium node_modules/.bin/playwright test --config=tests/etymology.config.ts
node_modules/.bin/vite build
node_modules/.bin/tsc --noEmit
```

省略 CHROMIUM_PATH 可使用已安装的 Playwright Chromium。专用测试配置仅访问本地应用，不访问线上官网。覆盖正确/错误输入、旧显示偏好兼容、完整单词保留、暂停计时、无资料等待、单词循环、完整章节、收藏/掌握/历史、数据包校验、备份恢复、离线阅读，以及真实 v3 → v4 迁移。

原仓库存在 4 处 TS2339 错误：mixpanel.ts 的 isWordVisible 两处、trackEvent.ts 的 window.gtag 两处；与本模块无关，未顺带修复。

## 后续

先扩展经过人工核实的数据，而不是扩大未经核实的覆盖率。以后例句填空可以在原保存成功之后复用 useEtymologyFeedback；上下文释义应由例句模块提供，不能用历史本义替代现代语境义。FSRS 接入时仍不得在任何阅读函数里调度；如要复习词根，为词根建立独立卡片和显式评分流程。

## 本次修改清单

现有文件：

- `src/utils/db/index.ts`：v4 增量表与类型声明。
- `src/pages/Typing/store/{index.ts,type.ts}`：词源阅读暂停标记。
- `src/pages/Typing/index.tsx`：阅读时暂停计时及自动开始监听。
- `src/pages/Typing/components/WordPanel/index.tsx`：正确完成后的自动反馈及显式下一词边界。
- `src/pages/Typing/components/WordPanel/components/Word/index.tsx`：完成后禁止额外输入、防止重复保存、保存后进入反馈。
- `src/pages/Typing/components/WordPanel/components/{KeyEventHandler,TextAreaHandler}/index.tsx`：阅读时停收输入。
- `src/pages/Typing/components/StartButton/index.tsx`：阅读时停用开始/重启快捷操作。
- `src/pages/Typing/components/Setting/ViewSetting.tsx`：自动显示流程说明（移除旧开关）。
- `src/components/Header/index.tsx`、`src/index.tsx`：词根库入口和路由。
- `package.json`：专用测试命令；构建使用 Vite 配置中的部署 base，无依赖变更。
- `vite.config.ts`、`public/default.conf`：普通部署根路径 / GitHub Pages 前缀及 Nginx SPA 回退，支持深层详情 URL 刷新。

新增文件：

- `src/features/etymology/types.ts`、`schema.ts`、`repository.ts`：数据模型、表定义和读写。
- `src/features/etymology/packages.ts`、`backup.ts`：严格数据包校验、导入和本模块备份恢复。
- `src/features/etymology/EtymologyCard.tsx`、`EtymologyContent.tsx`、`EtymologyPanel.tsx`、`EtymologyDialog.tsx`、`EtymologySettings.tsx`：卡片、共享内容、练习内嵌说明、词根库详情对话框和设置。
- `src/features/etymology/useEtymologyFeedback.ts`：可供未来例句模式复用的反馈 hook。
- `src/pages/RootLibrary/index.tsx`：我的词根库。
- `public/data/etymology/starter.json`：附证据的 14 词 / 4 词根资料包。
- `scripts/data/prepare-etymology.py`：本地 Wiktextract 候选包转换。
- `tests/etymology.config.ts`、`tests/e2e/etymology.spec.ts`：本地 Chromium 回归测试。
- `tests/data/test_prepare_etymology.py`：候选资料提取规则测试。
- 本文档。

最终验证：18 项 Chromium 功能/迁移/备份测试通过；1 项 Python 数据转换测试通过。新增及修改的运行时代码通过 ESLint，格式与 diff 检查通过；普通生产构建与 GitHub Pages 前缀构建均通过，两种部署下的生产深层详情 URL 都能加载词根和词源卡片，浏览器没有 pageerror。全项目类型检查仍有上述 4 处既有错误，没有新增类型错误。源码及静态站点已在用户授权后发布到个人 GitHub 仓库。

## GitHub Pages 发布

个人仓库：`wwlvss/qwerty-learner`。master 推送后，`deploy-pages.yml` 使用 GitHub 自动提供的 `GITHUB_TOKEN` 更新 `gh-pages` 分支；不需要旧的 ACTIONS_DEPLOY_KEY 或 Gitee 密钥，也不再同步上游 Gitee 仓库。部署使用已验证的 Node 24、Yarn 1.22.22 和冻结锁文件安装；安装脚本只在临时副本中替换下载域名，保留版本、完整性校验和原锁文件。

如需重新配置，可在仓库 Settings → Pages 中选择 Deploy from a branch，分支 `gh-pages`、目录 `/(root)`。预期地址为 `https://wwlvss.github.io/qwerty-learner/`，实际启用和可访问状态以 GitHub Pages 显示与 HTTP 验证为准。如果 fork 的 Actions 被禁用，先在 Actions 页面启用工作流，然后手动运行部署工作流。

`e2e.yml` 使用专用本地测试配置运行 18 项回归测试，不再把线上官网作为测试目标。
