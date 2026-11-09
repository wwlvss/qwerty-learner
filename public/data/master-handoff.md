# Qwerty Learner 个人英语学习系统：完整项目交接

这是一份给本地 Codex 的完整背景，不是“重新从零写项目”的需求书。先安装、启动和验证已有源码，再增量开发。用户不熟悉安装开发工具，要求由本地 Codex 主导环境准备；用户只处理登录、必要系统确认和其无法代做的点击。

## 1. 项目身份、地址与基线

| 项目                              | 信息                                                                   |
| --------------------------------- | ---------------------------------------------------------------------- |
| 用户的源码仓库                    | https://github.com/wwlvss/qwerty-learner                               |
| 克隆 URL                          | https://github.com/wwlvss/qwerty-learner.git                           |
| 源码分支                          | master                                                                 |
| 没有 Git 时的源码 ZIP             | https://github.com/wwlvss/qwerty-learner/archive/refs/heads/master.zip |
| 用户的网站                        | https://wwlvss.github.io/qwerty-learner/                               |
| 个人词库入口                      | /my-dictionary                                                         |
| 农场资料阅读                      | /farm                                                                  |
| 不熟词本                          | /unfamiliar                                                            |
| 自定义词典                        | /my-dictionary/custom                                                  |
| 个人词根库                        | /roots                                                                 |
| 功能进度与 Excel 下载             | /progress                                                              |
| 源码技术交接                      | docs/personal-learning/LOCAL_CODEX_HANDOFF.md                          |
| 新手给本地 Codex 的完整第一条消息 | docs/personal-learning/LOCAL_CODEX_FIRST_MESSAGE.txt                   |
| 逐项完成率                        | docs/personal-learning/current-progress.md                             |
| 功能交接基线                      | ba2feb44c1b977222620c7c68f75e1f7870f57db                               |

上面的基线是本次补充文档前的已发布功能版本；后续交接文档提交后，以 master 最新提交为准，不要 reset 到基线。云端之前在本机 work 分支开发，并推到远端 master；不是要去找远端 work 分支。gh-pages 仅为编译后的静态产物，不能作为源码继续开发。

## 2. 用户已确认的信息和未知信息

已确认：岗位“生产主管”；地区“云南红河蒙自”；蓝莓农场学习场景；品种代号 L25、L29、L11、L36、L37。农场名称“龙潭农场”来自上传资料标题，名称来源在资料中单独标记。

尚未给出，不应猜测：真实姓名、农场面积、海拔、各品种正式名称/特性、种植规模、实际产量/增长率、人数、采收月份、目标 EC/pH/水肥配方、农药使用参数、公司工时制度、品质阈值、正式 SOP、用户电脑的实际系统/架构/权限。电脑信息由本地检测；农场细节只在开发真正需要时问用户，不阻塞首次启动。

不能直接读取用户账号的全部 ChatGPT 记忆或其他会话。不要声称“我已经看过你的其他 GPT 记忆”。登录相同账号也不应被当成交接上下文的替代；明确读取仓库文档和用户提供资料。

## 3. 最初的项目目标与分析要求

目标是将开源 Qwerty Learner 改造为用户自己的英语学习系统，主要服务工作和农场生产，而不是另建一个全新的打字产品。

最早要求先分析 10 项：技术栈版本、词库路径/格式、释义/音标/发音、输入核心、进度保存、历史记录、离线、构建测试部署、ECDICT/Tatoeba/FSRS 接入、填空/句子输入/薄弱分析。要求报告 A–H：架构、修改文件、新文件、数据库、词典/例句接入、FSRS、分阶段计划和风险。

原始约束：尽量复用、不破坏旧功能、不无必要升级依赖、不让学习功能依赖付费 API、必须本地保存、考虑公司电脑无管理员权限。初期“只分析、不修改、不提交”属于那个阶段，之后用户明确要求网页试用、开发和发布；不要用早期阶段指令阻止现在的本地安装和后续开发。

完整初始分析要求归档：requirements/00-original-analysis-request.md。用户上传的早期完整词根词源需求原文：requirements/01-original-etymology-request.md。

## 4. 后续需求演变及最终规则

| 时间顺序     | 用户要求                                 | 当前接手时应遵守                                     |
| ------------ | ---------------------------------------- | ---------------------------------------------------- |
| 原项目分析   | 先分析，不改代码                         | 历史阶段已结束，保留结论与约束                       |
| 网页试用     | 能在站点直接使用                         | 用户网站继续保留，不只交本地包                       |
| 词源弹窗调整 | 不要弹窗，在正常界面显示                 | 内嵌资料区，不遮罩练习页                             |
| 资料自动显示 | 不要手动打开/关闭；答对后自己出现        | 答对后自动显示，不因资料缺失而跳词                   |
| 保留输入结果 | 完整正确单词停留，回车/空格再继续        | 释放按键才推进，长按不能串到下一词                   |
| 词库澄清     | 日常/工作/农业/商务/CET-6/IELTS 分别独立 | 各自 ID、词表、章节、记录，不合并成个人生词本        |
| 不熟词本     | 主动收藏不熟单词、短语、易混词           | 与自动错题记录分开，可备注、搜索、练习和导出         |
| 其他释义     | 不能只保留场景含义，例如 nursery         | Word.trans 保留其他中文释义，contextTrans 单列场景义 |
| 排版与设置   | 收起无用图标，设置放常用功能             | 默认简洁，低频工具可恢复，旧快捷键不删除             |
| Anki         | 可导出兼容格式                           | TSV 三列，保留释义、短语、例句、备注和标签           |
| 默写         | 短语也不能提前露出中文                   | 默认完成前隐藏练习区/词表中文；完成后显示资料        |
| Logo 与手机  | 不要跳作者官网/宣传页                    | React Router 站内导航，旧/mobile 转用户词库          |
| 框中文字     | 可选中、复制、查询并收藏                 | 阅读区 select-text；有选区时不误推进                 |
| 农场资料     | Excel 整合成一个新词库并扩展             | 新增 farm-english，不覆盖原六个词库                  |
| 近义表达     | 增加近义词/词组部分                      | 展示语境与差别，允许收藏，不假设总能互换             |
| 发音         | 不显示 AmE；语速确实要生效               | 去前缀留音标，playbackRate 作用到实际播放器          |
| 本地 Codex   | 用户不会安装，尽量代为准备               | Codex 装好后由本地代理检查/安装依赖/拉源码/启动      |

早期词源原文中的“首次显示后自动跳”“关闭后不等待”等交互设想，被后续明确要求替代。原词源资料结构和真实性要求仍有效；设置隐藏某类资料不意味着恢复自动跳词。

## 5. 最不能破坏的练习行为

1. 正确完成整词才显示答对资料；错误输入不显示答对卡片。
2. 上方完整正确单词保留，下方资料自动显示。
3. 阅读暂停练习计时及误输入；只有 Enter/Space 释放或明确下一词按钮推进一次。
4. 没有词源/例句不阻塞，也不自动推进。
5. 普通按键正确率、错键、速度和逐词/章节记录保持兼容；不要因 StrictMode 重复计数。
6. 单词循环次数每次仍记录，等待确认机制不丢重复练习。
7. 选字、复制、展开来源、点收藏不能冒充一次练习或 FSRS 复习。
8. 默写/隐藏释义的规则对短语、侧边词表及临时提示一致。
9. 不因为横竖屏/窗口宽度改变而重新加载或丢当前路径。
10. 不为排错清理真实 IndexedDB/localStorage，不改已有词库 ID 来做界面改名。

## 6. 当前技术栈与目录

云端现有安装核对值（以 yarn.lock 为准）：React18.2.0、TypeScript4.9.5、Vite4.3.8、Dexie3.2.3、Jotai2.1.0、Tailwind3.3.2、Playwright1.40.1、xlsx0.18.5。Node 运行环境 24，Yarn Classic1.22.22。package.json 中有版本范围，不要把范围误认为实际锁定版本。

- src/resources/dictionary.ts：静态词库注册、ID、路径和长度；脚本用其字面量元数据建立索引，改写结构时要兼顾脚本。
- public/dicts/\*.json：Word 数组。兼容字段 name、trans、usphone、ukphone；新增 contextTrans 保存场景义，不覆盖其他义项。
- src/pages/Typing：原输入核心、状态、结果、快捷键、资料及统计。
- src/store：原配置、Jotai 状态、本机章节偏好。
- src/utils/db：Dexie 定义、记录保存和备份。
- src/features/etymology：词源/词根数据与 UI。
- src/features/personal-dictionary、unfamiliar-words：个人词典、不熟词本。
- src/features/word-support：多义释义、用法和近义表达。
- src/features/selection-lookup：阅读区选词浮层。
- src/features/farm-english、src/pages/FarmEnglish：农场资料。
- src/features/anki：Anki TSV 导出。
- src/features/learning-preferences：简洁布局、资料显示等偏好。
- scripts/data：资料整理和生成；不要直接只改生成结果而丢来源。
- scripts/local-study、scripts/package-local-study.py：静态学习包。
- docs/personal-learning：说明、缺口和交接。

## 7. 七个固定词库与其他集合

| 名称         | ID                  | 词条 | 优先级与内容                                         |
| ------------ | ------------------- | ---: | ---------------------------------------------------- |
| 农场英语     | farm-english        |  160 | 最高；上传资料、工时、农机、水肥、蓝莓 QA 与主管沟通 |
| 工作英语     | work-english        |  120 | 最高；工作沟通、安排任务、汇报                       |
| 农业专业英语 | agriculture-english |  160 | 最高；种植、土壤、灌溉、水肥、植保                   |
| 日常英语     | daily-english       |  100 | 高；生活交流                                         |
| 商务英语     | business-english    |  100 | 中；会议、邮件、采购、协调                           |
| CET-6        | cet6                | 2345 | 中；沿用原 CET6_T.json 和历史                        |
| IELTS        | ielts               | 3575 | 后续；沿用原 IELTS_3_T.json                          |

另有 personal（自定义词典）和 unfamiliar（不熟词本），均来自本机数据库，URL 分别 personal://words、unfamiliar://words，不是普通 HTTP 词表。

每 20 词一章。新增词表尽量追加，不重排旧词，避免章节含义改变。逐词断点和词典版本快照尚未完成，不能声称已可无损恢复任意未完成章节。

## 8. 农场 Excel 与个性化资料

上传文件名：龙潭农场英语学习资料\_词根词缀与蓝莓生产 QA 扩展版(1).xlsx。

| 原工作表             | 已提取内容                                 |
| -------------------- | ------------------------------------------ |
| 分类词汇             | 74 词，含工时/农机/灌溉/设施等             |
| 蓝莓生产 QA 扩展词汇 | 45 词                                      |
| 沟通场景句库         | 45 句，面向工人、同事、人事、领导和跨部门  |
| 专业沟通句扩展       | 19 句，采收、产量、品质、安全、长势和水肥  |
| 使用说明             | 5 条                                       |
| 词根词缀学习指南     | 15 条构词/提醒笔记，跳过其中的重复分组表头 |

合计 119 原词＋ 41 原创扩展＝ 160 词，8 章，另有 64 沟通句。原词条的例句、译文、分类、词性、近似发音、拼写、记忆/构词提示保留。未精确匹配词形的例句仍在阅读资料中，不伪造高亮。

原 XLSX 未随 Git 发布；提取后的学习字段在 scripts/data/farm-source.json，运行当前源码不需要再拿到原 Excel。扩展在 farm-extra.tsv，生成器 build-farm-english.py，输出 public/dicts/farm-english.json 及 public/data/farm-english/materials.json、usage.json。

不能把例句里的“8%”“12 月”“五名工人”等当农场实绩；不能把沟通句当公司已批准工时政策。QA 主要是质量保证，不表示已经实现 AI 问答系统。构词提示未按历史词源核实，不能自动灌入已核实词源库；近似拼读不是 IPA。

## 9. 词源系统：原始要求的保留部分

目标学习链：打字正确 → 构词解释 → 历史来源 → 真实相关词 → 词根知识网络。

需要区分 prefix/root/suffix/stem/inflection；有来源时高亮对应字母，不强行拆词。展示来源语言、原形、原义、演变和现代含义；没有证据的年代和拉丁/希腊词根不生成。

相关词关系分 A 真正同源、B 相同词根构词、C 语义相关。拼写相似不构成同源证明。记忆联想与历史事实分开。

独立词根库已有搜索、收藏、筛选、关联词、学习状态和查看来源历史。查看词源不等于掌握；不增加单词 FSRS 次数。词根复习如以后实现，应有独立卡片和日志。

当前可靠起始数据仅 14 词/4 个词根标签，见 etymology.md 与 starter.json。来源是已对照的历史词典原文，不代表现代多来源学术定论。词源资料与原词表解耦，不把全部词源塞进 Word JSON。

Wiktionary/Wiktextract 可作未来合法离线候选来源；Etymonline 只作允许范围内的参考，不未经许可批量复制。ECDICT 是基础词典，不是完整词源库。现有候选脚本不等于正式全量接入。

## 10. 数据库与本地数据

数据库名称 RecordDB，当前版本 6：v1–3 原记录，v4 词根词源，v5 个人词典/用法，v6 不熟词。

| 表                                                      | 作用                             |
| ------------------------------------------------------- | -------------------------------- |
| wordRecords                                             | 逐词、词库、章节、时间、错键等   |
| chapterRecords                                          | 章节结果、关联逐词记录           |
| reviewRecords                                           | 原复习队列与进度                 |
| personalWords                                           | 自定义词条、添加顺序             |
| unfamiliarWords                                         | 收藏词形、来源、分类、备注、时间 |
| wordUsageEntries                                        | 用户导入的用法资料               |
| etymologyEntries / roots / rootWordRelations            | 独立词源、词根与关系             |
| rootFavorites / rootLearningStates / rootLearningEvents | 词根收藏、状态与历史             |
| etymologyViews / etymologySettings / etymologyPackages  | 查看、兼容设置、包标识           |

revisionDictRecords/revisionWordRecords 有类型声明，不能仅凭声明认定已注册了这些表；以构造函数 stores 为准。没有 FSRS 卡片表或调度日志表。

单词关联规范形用于 en:word 等额外 ID；不重写原 Word 名称和已有记录键。原完整.gz 备份包含新增表，但恢复仍是覆盖式。根库有专用备份，不等于完整数据库备份。不熟词 JSON 导入按规范词形合并，不删除练习历史。

localStorage 中还有章节选择、learningDictionaryChapters、发音、默写、learningPreferences 等；不是完整.gz 数据库备份的一部分。

### 三类地址不能混淆

https 网页版、http://localhost:4173 学习包、http://localhost:5173 开发版，各有独立浏览器存储。127.0.0.1 与 localhost、不同端口/浏览器/用户配置也不同。Git 克隆不带个人学习记录。

先在原地址导出.gz，再在新的本地地址导入。目标已有数据先备份。不要让用户为了刷新网页清站点数据；不要把真实浏览器配置交给会清库的测试。

## 11. 当前数据覆盖：功能可用不等于数据齐全

基线 manifest：317 个英语词库，42917 个不同词条；中文释义 40643（94.701%），短语 15619（36.394%），结构化例句 655（1.526%），可靠词源 14（0.033%）。32 组近义教学资料含 70 个不同词/表达，其中 61 个在基础索引内（0.142%）。数据变化后运行生成器重算，不继续引用旧数字。

这是按资料存在与否计算，不是准确率、学习效果或工期完成率。百分比交付表单独按每模块 5 个里程碑算，当前 25 项，见 current-progress.md 与 project-progress.xlsx；不要把模块 80%解释为 80%词汇已有完整资料。

## 12. 当前可用的其他功能与边界

- 多义释义：场景义与原词库其他解释分开，来源可展开，不只是把词义删成一个。
- 选词：阅读区可真实拖选/复制；本地精确词/短语查询、页面原有配对译文、个人资料合并；未知整句没有自动翻译，可手填后收藏；不向外部翻译服务发选区。
- 不熟词本：主动收藏、词/短语/易混分类、备注、搜索、独立练习、JSON 和 Anki 导出。自动错题仍独立。
- 近义表达：32 组原创教学辨析，带语境；不是自动全量 WordNet 或同源关系，尚无易混专项题。
- Anki：七固定词库和个人集合可导出 UTF-8 TSV，Front/Back/Tags；HTML 转义，保留当前资料和备注。不含音频、.apkg、网站历史或调度同步。尚未在真实 Anki 桌面客户端做导入验收。
- 语速：use-sound 要传 playbackRate，不能只传 rate；同时对已加载 sound 同步.rate。已用测试音频检验 HTMLMediaElement 实际速率和刷新持久化。发音仍依赖原网络服务。
- 设置：简洁界面、更多工具、释义/例句/词源/近义显示、默写译文、音效、发音、倍速、主题；原高级/字体/数据设置保留。
- 手机版：去掉<=600px 强制跳宣传页；旧/mobile 到本站词库。修正 resize 直接 location='/'导致的丢路径。小屏可阅读/收藏/导出，打字仍需外接键盘，尚未适配软键盘和真实移动设备验收。
- 离线：本地静态包和 IndexedDB 基础可用，但浏览器 SW 冷启动与离线音频未完成。
- 隐私：原 Google/Mixpanel/Vercel 统计尚未统一默认关闭，不声称零外发。学习功能不增加必需付费 API，不意味着开发用 Codex 账号不受其方案/额度限制。

## 13. 测试、构建和已知基线问题

交接前 58 项 Chromium 浏览器测试、11 项 Python 数据测试、Vite 构建通过。语速用测试音频，手机用 Chromium 触屏/尺寸/UA 模拟；不是 Windows/iOS/Android/Anki 全实机验收。

- 浏览器：yarn test:etymology，配置 tests/etymology.config.ts；需要已安装 Playwright Chromium，可用 yarn playwright install chromium。云端曾用 CHROMIUM_PATH=/usr/bin/chromium，本地无需照抄 Linux 路径。
- 数据：python -m unittest discover -s tests/data -v。
- 构建：yarn build；npm test 并非实际回归，它只打印 No tests，不能当全部测试通过。
- tsc --noEmit 仍有 4 个旧 TS2339：mixpanel 的 isWordVisible 两处，trackEvent 的 window.gtag 两处。不靠升级依赖掩盖，新增错误要修。
- Node 静态服务器测试会创建临时文件符号链接，Windows 可能需要处理测试权限差异；不为了普通启动强制管理员权限。
- .gitattributes 默认强制文本 LF，已为 xlsx 设 binary 以免 Excel 损坏。新 ZIP 交接包也要作为 binary。不要将二进制下载文件文本化。

## 14. 资料生成、发音与缓存

农场：import-farm-workbook.cjs（需要原 Excel 时）→farm-source.json ＋ farm-extra.tsv→build-farm-english.py。

原四主题：learning-dictionaries.tsv→build-learning-dictionaries.py。然后统一运行 build-word-support.py，再 build-project-progress.cjs 更新进度/覆盖。

定义按双字母分片，catalog/usage 按首字母分片，URL 带构建版本，避免更新后仍从缓存读旧词数/旧释义。不要删版本标记来“减少 URL 复杂度”。

语音 URL 仍为原有道接口，Howler/use-sound 播放。更改发音提供方须另外验证许可、网络、缓存、速率、跨域、失败回退和离线，不把示例音节当实际发音。

## 15. 构建、部署和源码/学习包差别

普通本地 build 基础路径/；Pages 通过 REACT_APP_DEPLOY_ENV=pages 生成/qwerty-learner/基础路径。不要混用两种构建。

static local-study.zip 含 site 和 Node 标准库服务器，Windows 启动脚本第一次下载官方便携 Node24 并校验 SHA256，不安装项目依赖。这个 ZIP 供学习，不是源码开发包。其 Windows 启动仍待实机验收。

源码 master 上有 deploy-pages.yml（push master 或手动触发，Node24，Yarn 锁定安装，Pages 构建，发到 gh-pages）与 e2e.yml。正常 GitHub 推送可能触发线上发布，因此本地接手不能把“提交/推送只是备份”当成无影响操作。

已知部署交接点：deploy-pages.yml 目前只构建网站，不自动完成“普通根路径学习包 →ZIP→ 再 Pages 构建”的整套附件打包。云端现有发布另行打包了 local-study.zip 并随 gh-pages 发布。以后要在正常 CI 发布时保留这个下载，需把附件步骤补齐并验证；不能推一次网站就让本地包下载变成 404。

构建学习包参考 scripts/package-local-study.py；许可证和 SOURCE.txt 随包提供。不要把 node_modules、用户数据库、.env、登录信息打入包，不把编译 JS 当源码。不要强制 Docker 或 Tauri。

## 16. 本地接手的授权边界

用户希望本地 Codex 帮助安装和启动。允许必要官方工具准备、拉源码、安装锁定依赖、启服务、隔离测试和本地修改；尽量自动完成，不把一堆安装命令退给新手。必要登录与系统窗口由用户处理。先检测，不无必要覆盖已有软件、用户文件或开发环境。

本地新会话默认不继承云端“继续发布站点”的权限：除非用户另行要求，不提交、推送或发布，不删除网站、仓库或历史，不更换账号。明确说明需要系统权限的具体动作，不绕过系统安全限制。

## 17. 推荐下一阶段及验收

1. 安装启动、给出可点击地址和一键/便捷启动方式，确保用户下次能打开。
2. 数据保护：导入预检、合并/覆盖选择、差异报告、回滚/备份提醒；用隔离样例实测恢复，不碰真实数据。
3. 普通章节断点：保存当前词、章节快照、练习状态和恢复规则，处理词表变动，不能重复记完成记录。
4. ECDICT：固定数据版本/许可，释义/词性/词形映射与检索，先高频和农场词，保留来源；不把它当词源库。
5. Tatoeba：合法真实导出、句子 ID、作者归属、准确中译关联、目标匹配与抽检；不将现有原创教学句冒充语料引文。
6. 填空/句子练习：定义提示、接受答案、标点/空格、评分、日志、暂停恢复和不同练习模式；先最小可用再扩展。
7. FSRS：基于回忆型行为设计卡片和到期队列，显式评分、日志、事务/撤销、迁移与测试；不能把抄写正确或看词源算成功记忆。
8. 薄弱分析：除错键速度外，加入回忆失败、提示率、首键耗时、近期权重与模式区分，给可解释建议。
9. 真实手机与软键盘、浏览器离线/音频、Windows 实机、统计开关和跨设备同步另行逐步做。

绝不能说已经完成的：正式 ECDICT 导入、真实 Tatoeba 全量、填空、句子模式、FSRS、完整离线音频、跨设备实时同步、任意命名多词典、可靠任意整句机器翻译、自动个性化易混专项。字段或脚本存在不等于功能已完成。

## 18. 当前文档导航

- 新手安装与启动：LOCAL_CODEX_HANDOFF.md。
- 第一条可复制消息：LOCAL_CODEX_FIRST_MESSAGE.txt。
- 详细进度：current-progress.md；原计划：roadmap.md。
- 词根：etymology.md；词典/用法：usage.md、dictionary-and-settings.md。
- 词库：learning-dictionaries.md；农场：farm-english.md。
- 收藏：unfamiliar-words.md；Anki：anki.md。
- 选词/近义/语速：selection-synonyms-audio.md。
- 手机：mobile.md；本地包：local-deployment.md。
- 最初要求原文：requirements/目录。

本地 Codex 应读代码和最新 Git 状态核实本文。用户是使用者和需求方，不要要求用户先掌握 Git、Node、终端、构建、数据库等概念才开始帮助。
