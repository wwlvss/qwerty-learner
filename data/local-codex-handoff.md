# 本地 Codex 交接与新手启动

## 你只需要先完成 Codex 本身的安装与登录

你不需要先自己装好 Node.js、Git、Yarn，也不用先学终端。这些准备工作可以在本地 Codex 启动后交给它检查和完成。详细技术命令放在后文，主要给 Codex 参考，不要求你逐条手工执行。

1. 打开官方 Codex 应用页面：https://chatgpt.com/codex?app-landing-page=true 。下载页面提供的、适合你系统的桌面应用，正常安装，使用自己的 ChatGPT 账号登录。不要把仍在浏览器运行的云端任务误当成已能操作你电脑的本地 Codex。
2. 在电脑上新建一个普通文件夹，例如桌面上的“英语学习项目”。在本地 Codex 中新建/添加项目或打开文件夹，选择这个目录；不同版本菜单名称可能不同。
3. 下载并解压完整交接包：https://wwlvss.github.io/qwerty-learner/data/codex-handoff.zip 。打开 FIRST_MESSAGE_TO_CODEX.txt，把全文复制给本地 Codex。无需先手动克隆项目，它的首个任务就是检查环境、准备工具和获取源码。
4. 本地 Codex 会准备必要开发环境、启动网站并给出浏览器地址。账号登录、系统安装确认等必须本人完成的动作，按它给出的单个步骤操作。不要把密码或密钥发到聊天里。

如果官方下载页没有适合你系统的桌面应用，使用官方独立 CLI 安装说明：https://github.com/openai/codex#readme 。独立安装器不要求事先安装 Node/Git；先完成 Codex 本身，再由它准备本项目环境。不要随意安装来源不明的同名软件。

## 交接文件怎么看

- FIRST_MESSAGE_TO_CODEX.txt：你发给本地 Codex 的第一条消息，已包含项目地址、安装授权、你的背景、核心规则和后续目标。
- MASTER_HANDOFF.md：从最初目标到当前状态的完整背景。
- current-progress.md / project-progress.xlsx：25 项完成率、已完成和待办；数据覆盖率单独列。
- requirements/：最初分析要求和完整词根需求原文，明确标记过时规则。
- 本文后半部分：技术、测试、数据迁移和故障处理参考。

源码仓库：https://github.com/wwlvss/qwerty-learner ，分支 master。网站：https://wwlvss.github.io/qwerty-learner/ 。完整源码 ZIP：https://github.com/wwlvss/qwerty-learner/archive/refs/heads/master.zip 。

## 不要混淆三个包/目录

| 名称                              | 用途                                           |
| --------------------------------- | ---------------------------------------------- |
| codex-handoff.zip 完整交接包      | 背景、要求、安装任务、进度表；不是完整应用源码 |
| GitHub 源码仓库或 master 源码 ZIP | 本地 Codex 继续开发的实际项目                  |
| local-study.zip 学习启动包        | 已构建网页，可直接学习；不适合作为源码开发目录 |

Codex 首次拿到空目录也可以先获取源码；如果你的应用明确提示当前环境缺少 Git 或不能打开目录，把具体提示交给当前助手，不要盲目覆盖或重置已有文件。

## 以下是给本地 Codex 的环境准备参考

1. 检测操作系统、架构、目录和已有工具。目标 Node.js24 LTS、Git、Yarn Classic1.22.22；优先复用兼容版本，优先当前用户或便携安装，不干扰其他项目。
2. 官方来源：https://nodejs.org/ 、https://git-scm.com/ 、https://github.com/openai/codex 。用户已请求协助安装，不应把本可自动完成的工作退回成一长串手工命令。
3. 源码 master：git clone；已有目录先 git status，不 reset/clean/覆盖。没有 Git 时可先取得官方 GitHub 源码 ZIP，随后再补 Git；交接包不等于源码。
4. 在源码目录执行 Yarn Classic 的 frozen-lockfile 安装并运行 yarn start。默认地址 http://localhost:5173，使用实际终端结果。给用户保留清楚、便捷的再次启动方法。
5. Windows 可用 npm.cmd/yarn.cmd/codex.cmd，避免 PowerShell 优先调用受执行策略限制的.ps1。不要要求为普通项目运行永久改系统执行策略。
6. 锁文件有 npmmirror 下载地址。网络失败可参考 scripts/install-ci.sh：临时副本替换为官方 npm 下载位置，保留版本/完整性，不重写仓库锁文件。Windows 做等效安全处理，不用升级依赖或删锁文件解决。
7. 先启动学习页面，再按需要准备 Python3 与测试浏览器。Python 用于数据生成/数据测试，不是首次跑已生成词库的前提。

高级用户或本地 Codex 可参考（以下不要求新手亲自逐条运行）：

```powershell
# 假设 Node / Git 已按本机情况准备好
npm.cmd install -g yarn@1.22.22
git clone https://github.com/wwlvss/qwerty-learner.git
cd qwerty-learner
yarn.cmd install --frozen-lockfile
yarn.cmd start
```

若选择 npm 方式安装 Codex，官方支持 npm install -g @openai/codex；Windows 可用 npm.cmd。已经安装桌面 Codex 时不必为本项目重复安装另一套 CLI。Codex 账号可用权限和额度以官方实际情况为准，不要求用户购买学习 API。

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
