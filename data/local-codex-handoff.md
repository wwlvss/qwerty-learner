# 本地 Codex 交接与 Windows 启动

## 先分清两种本地使用

- 只学习：网页版“我的词典”下载 `local-study.zip`，解压并运行 `start-windows.cmd`。这是已构建的网站，不是源码开发目录。
- 用 Codex 继续开发：获取此 GitHub 仓库源码，安装 Node.js、Git、Yarn 和 Codex，再把源码文件夹作为 Codex 项目打开。不要让 Codex 修改静态包的压缩 JS 来代替源码修改。

仓库：https://github.com/wwlvss/qwerty-learner ，分支 `master`。网页版 https://wwlvss.github.io/qwerty-learner/ 。Git 中的提交、词库和文档可以交接；浏览器 IndexedDB 中的个人学习数据需要另外导出。

## Windows 安装顺序

1. 安装 Node.js 24 LTS：https://nodejs.org/ 。项目云端也使用 Node.js 24，不需要因此升级项目依赖。
2. 安装 Git：https://git-scm.com/downloads/win 。重新打开 PowerShell，确认 `node --version`、`npm.cmd --version`、`git --version` 可运行。
3. 可使用官方 Codex 桌面应用并选择源码目录，也可以通过官方支持的 npm 方式安装 CLI：

```powershell
npm.cmd install -g @openai/codex
npm.cmd install -g yarn@1.22.22
codex.cmd
```

若 PowerShell 找不到 `codex.cmd`，可运行 `& "$env:APPDATA\npm\codex.cmd"`。

首次运行 Codex 选择 **Sign in with ChatGPT**，按账号可用权限/额度登录；不要把密钥写入仓库。Windows 使用 `.cmd` 形式调用 npm/yarn 可避免 PowerShell 把命令当作受执行策略限制的 `.ps1`；不要求为了本项目修改系统执行策略。

Codex 官方安装参考：https://github.com/openai/codex#readme 。官方应用入口：https://chatgpt.com/codex?app-landing-page=true 。安装渠道和系统支持以官方说明为准。

4. 获取源码、安装锁定依赖并启动：

```powershell
cd $HOME
mkdir projects -Force
cd projects
git clone https://github.com/wwlvss/qwerty-learner.git
cd qwerty-learner
yarn.cmd install --frozen-lockfile
yarn.cmd start
```

浏览器打开终端显示的地址，通常为 http://localhost:5173 。另开一个 PowerShell：

```powershell
cd $HOME\projects\qwerty-learner
codex.cmd
```

若仓库已存在，先 `git status`，保留本地未提交内容，再 `git pull --ff-only origin master`。不要覆盖或重置本地改动。也可下载源码 ZIP，但 Git 克隆更方便后续更新。

原锁文件有 npmmirror 下载地址。网络失败时参考 `scripts/install-ci.sh`：它在临时目录替换下载域名为官方 npm、保留版本与完整性校验，不重写仓库锁文件。Windows 若需相同处理，应让本地 Codex 实现等效的安全临时安装流程；不要靠升级依赖或删除锁文件解决。

## 当前代码与约束

技术栈：React 18、TypeScript 4.9、Vite 4、Jotai、Dexie 3.2、Tailwind；Yarn Classic 锁文件保留。不要执行 `npm update`、`yarn upgrade` 或批量替换框架。

数据库 RecordDB v6。新增功能继续复用 `wordRecords/chapterRecords/reviewRecords`；词根、个人词典、用法、不熟词表保留。当前本轮未新增数据库版本。不要删除原表或为了排错清理真实浏览器数据。

七个固定词库 ID：`farm-english`、`work-english`、`agriculture-english`、`daily-english`、`business-english`、`cet6`、`ielts`。另保留 `personal`（自定义）和 `unfamiliar`（不熟词本）。不能为改名而更换这些 ID，已有历史按 ID 区分。

练习规则：答对后完整单词保留、自动显示资料、暂停阅读计时；只有回车/空格释放或“下一个词”推进。不要恢复自动跳词或词源弹窗。选区存在时不因回车/空格误推进，复制不是一次练习或复习。

免费本地资料优先，不增加必需的付费学习 API。仍有原网络音频及 Google/Mixpanel/Vercel 统计，尚未实现统一默认关闭，不要声称完全离线或零外发。

## 本轮已交付

- 资料框恢复文字选择；划词查询原词库、个人词典、原有配对译文，可补译文并收藏；未知整句没有自动翻译。
- 农场英语 160 词（119 原词条 + 41 扩展）、64 沟通句、15 构词/提醒笔记与 5 条原使用说明，8 章，独立历史。
- 已确认用户信息：生产主管；云南红河蒙自；品种代号 L25、L29、L11、L36、L37。农场名称依据上传文件标题“龙潭农场”。除此之外不推断面积、产量、品种特性、员工数量或制度。
- 32 组原创近义表达，70 个词或表达，带语境差别和收藏。不是权威词典导出或可无条件替换的同义表。
- 移除音标 AmE/BrE 标签；修复 use-sound 的 `playbackRate`，同步已有播放器，已验证实际 HTML 音频节点 1→0.5→2 倍和刷新后的播放。
- 已有多义词、词根库、不熟词本、Anki TSV、个人设置、手机本站入口和便携本地包继续保留。Anki 不含音频、复习历史或排程同步。

原 Excel 未放入 Git；提取后的学习字段在 `scripts/data/farm-source.json`，当前源码运行不需要再次上传 Excel。原资料标为用户资料，未声明开放许可，不自动改标 CC0；新增原创补充单独标明。构词提示未核实，不导入为可靠历史词源。原句中的百分比、月份和人数是示例，不是用户农场事实。

## 关键位置

| 内容                       | 文件或目录                                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 逐项完成率、缺口、真实覆盖 | docs/personal-learning/current-progress.md；public/data/project-progress.xlsx；网页 /progress               |
| 里程碑计算源               | scripts/data/project-milestones.json                                                                        |
| 划词选择与收藏             | src/features/selection-lookup/SelectionLookup.tsx                                                           |
| 农场资料与页面             | src/pages/FarmEnglish；src/features/farm-english；public/data/farm-english                                  |
| 农场数据提取与生成         | scripts/data/import-farm-workbook.cjs；scripts/data/build-farm-english.py；farm-source.json；farm-extra.tsv |
| 近义表达                   | scripts/data/synonyms.json；src/features/word-support/SynonymPanel.tsx                                      |
| 释义/短语/例句查询         | src/features/word-support/repository.ts；scripts/data/build-word-support.py                                 |
| 语速修复                   | src/hooks/usePronunciation.ts；Typing/components/Setting                                                    |
| 本地包                     | scripts/local-study；scripts/package-local-study.py                                                         |
| 已知剩余工作               | docs/personal-learning/roadmap.md                                                                           |

## 测试与构建

```powershell
yarn.cmd playwright install chromium
yarn.cmd test:etymology
yarn.cmd build
yarn.cmd tsc --noEmit
```

浏览器配置 `tests/etymology.config.ts` 会启动 127.0.0.1:5173 的开发服务；使用默认 Playwright 隔离上下文，不要把会删除测试数据库的迁移测试接到自己的日常 Chrome 配置。

全项目 `tsc --noEmit` 原有 4 处 TS2339：`src/utils/mixpanel.ts` 的 isWordVisible 两处，`src/utils/trackEvent.ts` 的 window.gtag 两处。本轮不通过升级依赖来掩盖它们；新增类型错误必须处理。

需要更新生成资料时才需要 Python 3，生成脚本只用标准库：

```powershell
python scripts/data/build-farm-english.py
python scripts/data/build-word-support.py
node scripts/data/build-project-progress.cjs
python -m unittest discover -s tests/data -v
```

若修改原四个主题词表，先运行 `python scripts/data/build-learning-dictionaries.py`。不要随意插入旧词表中段，旧章节依据顺序划分。`node --test tests/local-study-server.test.cjs` 用于服务器安全检查；该测试创建临时文件符号链接，Windows 未启用相应权限时需要本地 Codex 处理测试环境差异，不必为了普通学习启动提权。

Pages 构建有 `/qwerty-learner/` 基础路径，普通本地构建没有：

```powershell
$env:REACT_APP_DEPLOY_ENV = "pages"
yarn.cmd build
Remove-Item Env:REACT_APP_DEPLOY_ENV
```

不要把 Pages 构建直接当本地根路径包。学习包应使用普通构建并运行 `python scripts/package-local-study.py --site build --output local-study.zip`，输出 ZIP 不应提交源码分支。

## 学习数据迁移

网页版、`http://localhost:4173` 学习包、`http://localhost:5173` 开发版、127.0.0.1 与不同浏览器配置，是不同存储来源，不自动共享数据。

先在原地址设置中导出完整 `.gz`，再到新的本地地址导入。原完整导入会覆盖目标已有记录，先备份目标。只迁移不熟词可用其 JSON 合并导入。章节选择、显示偏好等 localStorage 设置不在数据库备份里，需要重新选择。软件 Git 更新不会迁移或代替浏览器学习数据。

## 建议接手顺序

1. 先确认本地能启动、跑测试、迁移并恢复一份备份；优先改进导入预检/合并/回滚和普通章节断点续学。
2. 接入固定版本的 ECDICT 和合法 Tatoeba 资料，提高真实释义、词形、例句覆盖；继续校核农场术语与原构词提示。
3. 实现例句填空与完整句子练习，记录提示、回忆失败和作答模式。
4. 在有意义的回忆型练习上接 FSRS，再做可解释薄弱分析。抄写或阅读不自动算成功复习。
5. 手机软键盘、真实设备验收、离线资源/音频、个人模式统计开关仍待做。

当前无任意命名多词典、可靠任意整句翻译、自动易混专项、完整 FSRS 或跨设备实时同步。不要仅凭存在数据字段就声称功能已实现。

## 可复制给本地 Codex 的第一条任务

> 请先阅读 docs/personal-learning/LOCAL_CODEX_HANDOFF.md、current-progress.md 和 roadmap.md，并检查 git status、最近提交及本地环境。这个项目是我的个人英语学习系统，我是云南红河蒙自的农场生产主管，学习场景以蓝莓生产、工时、农机、灌溉水肥、QA 与沟通为主，品种代号 L25/L29/L11/L36/L37。先把源码版在本地启动并验证现有功能、告知浏览器地址，再按交接顺序推进。复用原代码，不无必要升级依赖，不清理真实学习数据，不编造词源，不引入必需的付费学习 API。先做本地改动；除非我另行要求，不默认提交、推送或发布到 GitHub。请明确区分已实现、仅有基础设施和仍未实现的功能。
