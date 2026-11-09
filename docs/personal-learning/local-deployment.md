# 本地部署与资料扩展

网页版继续更新并保留：https://wwlvss.github.io/qwerty-learner/ 。本地版与网页版使用同一套功能和数据。

## 无项目依赖安装的启动包

从网页版“我的词典”下载 `local-study.zip`，解压后按包内 README 操作。Windows 双击 `start-windows.cmd`；没有 Node.js 时，脚本首次联网从官方 nodejs.org 下载便携版 Node.js 24，校验 SHA256，保存到包内 runtime 文件夹，无需管理员安装。只对当前进程调用 PowerShell 脚本，不修改系统执行策略。若企业策略阻止脚本或程序，使用网页版或按企业许可方式运行。

服务器由 Node.js 标准库实现，仅监听 127.0.0.1，默认打开 http://localhost:4173，支持 React 路由刷新，拒绝非读取请求和目录穿越，不接收学习记录。学习数据仍在浏览器本地 IndexedDB。Linux 环境验证服务器、构建包和浏览器；Windows 下载/启动脚本未在 Windows 实机验证。

macOS/Linux 需要先安装 Node.js LTS，之后运行 `sh start-macos-linux.sh`。如果自己从源码运行：

```bash
yarn install --frozen-lockfile
yarn start
```

使用项目现有锁文件，不升级依赖。便携静态包无需执行以上命令。

## 从网页迁移学习数据

先在网页版设置中导出完整 `.gz` 学习数据，再在新的本地站点导入。原完整导入采用覆盖语义，应先备份目标已有数据。只迁移不熟词可单独导出/合并导入不熟词 JSON。词根也可使用原有专用数据包。

网页版和 localhost 是不同来源，不会自动共享浏览器数据。始终使用同一浏览器配置和 `http://localhost:4173`；localhost 与 127.0.0.1、不同端口各自独立。浏览器偏好（例如所选章节）需要重新选择。软件更新不应清除浏览器数据。

## 本地后能否补齐所有解释

可以继续接入免费、合法的本地资料，但“换成本地”不会自动补齐。建议先处理 ECDICT 的释义、词性、词频和词形，再按来源许可整理 Tatoeba 例句与中译；近义/易混词需要明确对比依据，历史词源需要可追溯证据。尚无资料时继续明确显示缺失状态。

内置四个主题词库每词已有场景释义、搭配与例句，可靠历史词源仍只有原来的 14 个词。ECDICT/Tatoeba 完整数据、自动近义比较、FSRS 尚未完成，不要求付费 API。已有入口允许导入自定义词条、用法及词源包。

启动包能从本机读取静态词库、资料和记录；原发音及外链仍可能联网，未实现完整离线音频或统一关闭原统计脚本。

## 打包

先构建普通根路径版本，再压缩。Pages 版本包含 `/qwerty-learner/` 基础路径，不可直接当根路径包。

```bash
yarn build
python3 scripts/package-local-study.py --site build --output /tmp/local-study.zip
```

发布端将 ZIP 放到 Pages 构建产物根目录，不将运行时、个人数据或 node_modules 放进包。
