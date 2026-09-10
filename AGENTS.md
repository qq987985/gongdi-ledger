# 其他智能体须知

## 项目概况

这是一个基于 TanStack Start、React、TypeScript 和 Zustand 的工地台账应用。生产数据位于 `data/`，主要包含人员、考勤、工资发放、合同、报销、保险和影像资料。

## 文档在哪（先看这里，不要满仓库找）

- **`docs/README.md`** —— 文档总索引：每份报告覆盖什么、状态如何，以及**当前未闭环项的唯一清单**。
- `docs/审查与报告/` —— 历轮审查 / 复审 / 体检 / 架构审核（每份末尾有「处理状态」）。
- `docs/使用与部署/` —— 使用说明、目录结构、部署说明、上传说明（注意：版本行还停在 1.2.x，内容滞后）。
- 根目录只留四个入口文档：`README.md`、`VERSION.txt`、`开发规范.md`（强制约定）、`AGENTS.md`（本文件）。
- 处理完一份报告：**在原报告末尾追加「处理状态」**，并更新 `docs/README.md`（开发规范 §2）。

## 修改前必须知道的约束

- API 写入必须经过 `withTenant(request, fn, need)`，并在当前台账上下文中执行。
- 全量台账包含身份证和银行卡等敏感字段。读取至少需要 `people.view`，整本写入需要 `ledger.manage`。
- 台账、账户和审计文件使用临时文件加 `rename` 原子写入。照片和文档上传也必须先写临时文件，再替换正式文件。
- 自动保存是整本台账快照，必须通过 `pushNasLedger()` 的串行队列，不能直接并发 PUT。
- 日期必须使用 `src/lib/dates.ts` 的解析函数；金额必须使用 `round2()`；工资计算必须集中在 `src/lib/wage.ts`。
- 修改数据模型时同步检查 `types.ts`、`store.ts`、`nas-sync.ts`、Excel 导入导出。
- 提交前跑三道闸：`pnpm run typecheck`、`pnpm test`、`pnpm build`（规范 §2，测试见 §10）。

## 回归测试与质量闸门（2026-09-10 起）

- `pnpm test` 用 **Node 内置测试器**直接跑 `tests/*.test.ts`（零依赖，不需要 vitest/jest —— 因为 `package.json` 里全是 `latest`，`pnpm add` 会顺带重解析无关依赖）。
- 只在 `tests/*.test.ts` 里测纯函数；`tests/register.mjs` 负责给省略扩展名的相对导入补 `.ts`。Node 需 ≥ 22.18。
- **改数据类代码前先看 `tests/excel-roundtrip.test.ts`**：Excel 导出→导入的往返断言是这套系统最容易悄悄改坏的地方（金额、年份、条数）。
- 已知未修的问题写成 `test(name, { todo: "原因" }, fn)`，fn 断言正确行为；修好后自动转 pass。**现在 0 个 todo（已知缺陷已清零）**。
- CI 闸门在 `ci/check.workflow.yml`：因为规范禁止本地改 `.github/workflows/`，首次要在 GitHub 网页建 `check.yml` 粘贴。**目前 CI 还没装**，所以三道闸只能靠人跑。
- 1.8.0 起覆盖 130 个用例（130 pass + 0 todo）：wage / contracts / dates / idcard / excel 往返 / 台账服务端（CAS、坏文件、
  读路径不写盘）/ 账户库自保与审计并发 / 影像按台账隔离与归入 / 权限声明表一致性 / 更新脚本（含镜像比对与旧镜像清理）。

## 1.8.0 的架构改动（A–F 已落地）

- **A 影像按台账隔离**：写入 `<影像根>/<台账id>/<分类>/`（见 `开发规范.md` §11.1）；读取回落历史公共目录（只读）；
  设置页「影像归入本台账」做一次性迁移；`PHOTO_LEGACY_FALLBACK=off` 可关闭回落。
  **动影像路径前先读 §11.1**，写回公共目录会重新造成跨台账越权。
- **B 持久化**：`readLedger()` 不再回写文件（补扫描件名只在内存视图）；`writeLedger` 返回
  `"ok" | "conflict" | "unreadable"`（坏文件拒绝覆盖）；GET 头与 CAS 同源；`LedgerState.schemaVersion`；
  `PUT /api/ledger` 用 zod 校验结构（`ledger-schema.server.ts`），`{}` 之类的写入被拒。
- **客户端同步**：`pullNasLedger` 前会检查未保存改动（`dirty`），409 会给出「以本机覆盖 / 放弃本机」两个选择；
  推送判据与服务的 `ledger.manage` 统一（不够权限时明确提示，不再假装成功）。
- **D 可观测性**：`logServer()` 写 `data/logs/YYYY-MM-DD.log` + stdout；坏台账/坏账户库判为 `unreadable`
  并拒绝写入（前端显示专门的兜底页，**不会**引导「初始化管理员」）；`accounts.json`/`audit.json` 写入串行化 + 随机临时名。
- **C 权限**：`PermId` / `NeedId` 由 `PERM_GROUPS` 推导（写错编译不过）；`tests/perms.test.ts` 扫全库兜底；
  敏感导出口径收紧；`/api/audit` 写入需要 `ledger.write`。
- **E 交付**：`app/**` 标记为生成物（`.gitattributes`）；发版与合并解耦的做法写在 `ci/README.md`（需在 GitHub 网页改 workflow）。

## 台账同步的三条硬约束（1.7.1 起）

1. **版本号口径必须同源**：`nas-fs.server.ts` 的 `ledgerRevisionValue()` 是唯一入口，GET 的 `X-Ledger-Revision` 与 PUT 的 CAS 基准都走它。空台账（ledger.json 不存在）用 `""` 作哨兵 —— 曾因 GET 用 `ledgerRevisionOf(data)`、CAS 用 `ledgerRevision()`，导致空台账/新建台账第一笔保存永远 409。
2. **不要让「上一本台账」的状态被推给新台账**：`pullNasLedger()` 期间 `pullDepth > 0`，此时 `pushNasLedger()` 直接返回（只有 `seed: true` 的显式升级路径用 `enqueuePush(true)` 放行）。切台账/新建/删除前必须先 `flushPendingLedger()`。目标台账为空时重置为 `emptyState()`，**不要**顺手把内存里的数据推上去。
3. **`seed: true` 只给「开机/登录后第一次进当前台账」用**（把本机旧数据升级进空台账）；切换、新建台账一律不允许 seed。

## 1.7.1 修复

- 空台账 409（见上，两端统一 `ledgerRevisionValue`）。
- 新建/切换台账串本；切换前 flush；空台账重置内存状态。
- 工资条打印「已打款」改为只算 `owner === 本人`，代收单列 `collected`，不再出现负数未打款。
- 批量工资 `withHistory(prev, next, payType)`：没有今天之前的历史时补一条 `2000-01-01` 的调薪前基准，过去月份才真的不追溯重算。
- 合同导出→导入：报量取「录入金额」（原来退到含税金额被放大）、明细存在时不再从合同管理表合计列造「导入合计」（开票翻倍）、补「回单号」与「影像文件」列、跳过导出派生表「资金对照」「影像资料」。
- 整本导入考勤按 sheet 名里的年份（`/20\d{2}/`）入库，跨年度不再全落到第一年。

## 1.7.7 一键更新「可自证」

- 更新卡片显示**上次更新结果**（开始/结束时间、成功或失败、失败原因一句话），失败时并说明容器仍是旧版本、数据没动。
- 卡片下方「查看更新日志」在应用内直接读尾部 120 行：`GET /api/update-log`（登录 + 管理员，只读）返回
  `data/logs/update.log` 与 `data/.gongdi-update-error.txt`；`readUpdateLog()` 在 `update.server.ts`，超过 64KB 按行截断。
- 应用侧用 `appendUpdateLog()` 写**同一个** `update.log`（开始更新 / 拉镜像成功或失败 / 已启动更新容器 / 结果）。
  为什么要落盘：容器被替换或重启后内存里的 `updateJobState` 就没了，只有落盘能回答「上次更新到底怎么了」。
- 教训固化：`dockerReq` 第三参数必须是 `{ body: … }` 或 `{ stream: … }`（1.7.6 前直传容器配置被当成空请求体，
  飞牛点更新必失败）。`tests/update-script.test.ts` 扫源码守卫这条约定。

## 1.7.8 更新链路的两个坑

- **拉到的镜像必须与当前不同**：镜像加速站（`ghcr.1ms.run`）按标签缓存，刚发版时 `latest` 还是上一版，
  「拉取成功 + 换容器」后版本不变（现场：08:31 两次更新都"成功"，版本仍是 1.7.6）。
  `applyDockerUpdate` 现在拉完就用 `imageIdOf()` 比对 `me.Image`，相同则换下一个源；全都相同就报错并**不替换容器**。
- **旧镜像要清**：更新成功后由更新脚本删掉上一个版本的镜像（`oldImage!==newImage` 才删，失败只记日志）；
  另给管理员一个手动入口 `GET/POST /api/images`（界面上「清理旧镜像」），
  安全性由纯函数 `pickRemovableImages()` 保证：只删本项目镜像、且不是当前镜像、且没有任何容器（含已停止）引用。
  注意仓库只发布 `latest` 与 `sha-<sha>` 两种标签（`docker.yml` 的 semver 类型只在 `v*` tag 上生效），
  所以**没法用版本号标签拉取**；要定位到具体构建只能用 sha 标签。

## 1.7.9 镜像缓存的两道保险

- **优先按提交拉**：`buildImageCandidates()` 把 `<仓库>:sha-<main 最新提交>`（`latestCommitShort()` 取 GitHub
  `/commits/main` 的短 sha）排在最前，`latest` 兜底。加速站不缓存一次性标签，只能回源 → 绕开 `latest` 缓存。
- **核对镜像内版本**：`imageVersionOf(ref)` 起一个 `Entrypoint: []` + `Cmd: ["cat","/app/VERSION.txt"]` + `Tty: true`
  的临时容器（网络 none），读 `/containers/{id}/logs` 后用 `parseImageVersion()` 取版本号，然后 `DELETE` 掉容器。
  版本不比本机新 → 换下一个源；全都不新 → 抛错且**不替换容器**。读不到版本号时退回镜像 ID 比对（`sameImageId`）。
- 拉到的版本会写进 `updateJobState.imageVersion`，前端在「版本没变」时直接说明「本次拉到的镜像就是 X」。
  现场教训：1.7.8 发布 1 分钟后在 1.7.7 里点更新，加速站给的还是 1.7.7 的镜像 → 容器换了、版本没变。

## 1.7.10 一键更新的真因（重要教训）

- **更新脚本必须做语法检查**。`UPDATER_SCRIPT` 是「用模板字符串拼出来的一段 JS」，
  里面写 `"\n"` 会被模板字符串变成**真换行**，生成的 .cjs 里字符串字面量跨行 →
  node 连解析都过不去（报 SyntaxError 到 stderr）→ 容器 AutoRemove 删掉 →
  界面只有「已受理」，日志一字没有。**症状是「更新说成功、什么都不变」，极难猜。**
  `tests/update-script.test.ts` 现在用 `new Function(UPDATER_SCRIPT)` 真的解析一遍 —— 改脚本必须过这条。
- 生成脚本要写日志，用 `log()` / `fail()`（同时写 stdout 与 `data/logs/update.log`），
  第一步就写「更新容器已启动」：脚本没跑起来时也要有痕迹。
- 更新容器：任务走 `GONGDI_JOB` 环境变量 + `Cmd: ["node","-e",UPDATER_SCRIPT]`（不依赖 data 挂载）；
  `AutoRemove: false`（失败后还能查它的日志）；启动两秒后 `GET /containers/{id}/json` 检查是否已退出，
  退出就抛错并把 `readContainerLogs()` 的输出贴出来；`/api/update-log` 会带上
  「更新容器：已退出（exit N）」+ 它的日志。
- 镜像侧的两道保险（`buildImageCandidates()` 按 sha 拉、`imageVersionOf()` 读镜像内 VERSION.txt、
  `sameImageId()` 比对）保留：对付加速站缓存旧 `latest` 有用，但**不是**上面那个病根。

## 1.7.12 更新容器（gongdi-updater）的生命周期

- 它是**容器**不是镜像：由 `applyDockerUpdate()` 用应用镜像创建，`Cmd: ["node","-e",UPDATER_SCRIPT]`，
  任务走 `GONGDI_JOB` 环境变量；换完容器就退出（exit 0）。
- **故意不自动删**（`AutoRemove: false`，1.7.10 起）：失败时 `docker logs gongdi-updater` 与
  `/api/update-log` 的「更新容器：已退出（exit N）」是唯一的现场证据。
- 但它是可丢弃的：手动 `docker rm -f gongdi-updater` 无副作用；下次更新会先 stop/remove 再重建。
- **别让它占住镜像**：已退出的更新容器在 Docker 里仍算「引用了镜像」。`usedImageIdsOf()` 在统计占用时
  跳过「已退出且名为 gongdi-updater」的容器；`pruneLocalImages()` 在清理前先把它删掉。
  否则它会让上一次更新拉到的那份镜像永远删不掉。

## 仍待处理（已核实、未修）

- **实体级存储**（B 中期剩下的一半）：现在整本台账仍是一个 `ledger.json`，每次改动整本上传。
  实测「中等工地」（100 人×3 年考勤+50 合同+300 报销）约 1.45 MB/次。要拆成按实体保存 + 索引，
  属于专项（见架构报告 §2「中期」），不要在顺手改功能时夹带。
- **容器以 root 运行 / docker.sock**：属部署取舍，改非 root 需要入口脚本先 chown 再降权；见 `ci/README.md` §3。
- **说明文档落后**：`说明.txt`(1.2.22)、`目录结构.txt`/`部署说明.txt`(1.2.20)、
  `程序文件说明.txt`（称仓库没有 .ts/.tsx）、`GITHUB上传说明.txt`（要求上传已删除的 `app/public/templates`）。
  （`使用说明.md` 已于 1.7.7 改为「版本以 `VERSION.txt` 为准」并对齐版本号规则。）
- **权限预设缺口**：预设「合同财务」没有 `people.view`，而全量台账读取需要它 → 该预设实际上看不到数据。
  修它要么给该预设 `people.view`（会连身份证/银行卡一起开放），要么做实体级权限；属产品决策。
- **HTTP 层无请求体上限**：`scripts/app-server-index.mjs` 在鉴权前把整个 body 读进内存。
- **`dates.ts` 的日校验、`idcard.ts` 的 16/17 位、工资历史 `fromDate` 补零**：均已于 1.7.8 修复
  （原来的 `todo` 用例已转成正式用例）。
- **照片类型仍按文件名匹配**（张三-身份证-正面.jpg）：跨台账隔离已做，但同名不同人仍需人工核对。

## 已知部署风险

带一键更新功能的 Docker 配置挂载了 `/var/run/docker.sock`。这赋予应用容器较高的宿主机 Docker 控制能力。可信内网部署可以保留；不需要网页更新时，应移除该挂载并关闭对应更新入口。
