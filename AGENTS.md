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
- 模块结构（1.7.18 起）：`hasWork` 在 `work.ts`（dates/wage 共同依赖，勿再造环）；`nasEnabled` 在
  `nas-flag.ts`（不要从 nas-sync 引）；Excel 导入导出在 `src/lib/excel/` 目录（common + 七个实体模块，
  经 `excel.ts` barrel 导出，实体模块不得反向依赖 full）；服务端存储三层单向依赖
  `paths.server ← assets.server ← nas-fs.server`（影像层要台账内容时由调用方传入，不要 import nas-fs）。
- 模块结构（1.7.19 起，UI/更新层）：应用外壳件在 `src/components/shell/`（导航/品牌/主题/切换器/
  更新卡/版本日志/登录与兜底屏）；报销、合同编辑弹窗分别是 `expense-editor.tsx`/`contract-editor.tsx`
  （共享小件在 `expense-bits.tsx`）；设置页卡片在 `src/components/settings/`；一键更新在
  `src/lib/update/`（consts/log/version/docker/updater-script/apply，经 `update.server.ts` barrel 导出；
  守卫测试按模块扫源码，拆文件时同步改扫描路径）；保险结算口径在 `src/lib/insurance.ts`
  （memberDays 夹紧/isActive/prevDayEnd，页面只导入不实现）。
- 结构三条标准（模块化/可拓展/低耦合）已写进 `开发规范.md` §12（1.7.19 起），
  红线：单文件约 1000 行评估拆分、禁循环依赖（共同依赖下沉第三模块）、存储三层/excel/shell
  三条主线依赖单向；拆分=机械提取+barrel 兼容+守卫扫描路径同步改。
- 修改数据模型时同步检查 `types.ts`、`store.ts`、`nas-sync.ts`、Excel 导入导出。
- **改打印件（`.print-only`）前先读 `src/styles.css` 的「打印分页协议」（1.8.10 起，1.8.11 补充）**：规则只在那一处写；
  组件里禁用容器级 `break-inside-avoid`（页底放不下会整块推移、上一页留一大片空白），
  「不许拆页」只下沉到 `tr` / `.print-keep`；打印态不许有一屏高的容器（`min-h-screen/min-h-dvh` 已在
  `@media print` 清零）。**1.8.11 两条**：① `tfoot` 必须 `display: table-row-group`（默认
  `table-footer-group` 会让整单合计在**每一页**页脚重复，半页下面印整单合计会被当成这页小计）；
  ② 单据抬头（保单号 / 合同编号 / 报销人）要写进 `<thead>` 第一行 —— 表头跨页重复，用户
  **拆开分发**时续页才认得出是哪张单。`开发规范.md` §6.6 与 `tests/ui-guards.test.ts` 同步约束。
- **量打印分页只能在真 PDF 上量**（`ci/mobile-print-check.mjs pages` + `ci/print-pdf.mjs`）：真实打印的
  内容宽是 703px（186mm），比屏幕按 A4 宽 794px 量的更窄 ⇒ 换行更多、纸面更高；只看屏幕 DOM 高度会误判
  「1 页装得下」（1.8.13 踩过）。
- 提交前跑三道闸：`pnpm run typecheck`、`pnpm test`、`pnpm build`（规范 §2，测试见 §10）。

## 回归测试与质量闸门（2026-09-10 起）

- `pnpm test` 用 **Node 内置测试器**直接跑 `tests/*.test.ts`（零依赖，不需要 vitest/jest —— 因为 `package.json` 里全是 `latest`，`pnpm add` 会顺带重解析无关依赖）。
- **改 Excel 相关代码（`src/lib/excel.ts` / `src/components/excel-import.tsx`）时，除了 `pnpm test` 还要跑
  `pnpm run test:roundtrip`** —— 那是 70 个"导出→导入"对拍用例（`tests/roundtrip/`），
  专门盯历史上反复出问题的地方：报量被换成含税金额、开票翻倍、跨年考勤落到第一年、调薪历史被清空、
  在保人员被写成"在保"、带格式数值被清零等。
- 只在 `tests/*.test.ts` 里测纯函数；`tests/register.mjs` 负责给省略扩展名的相对导入补 `.ts`。Node 需 ≥ 22.18。
- **改数据类代码前先看 `tests/excel-roundtrip.test.ts`**：Excel 导出→导入的往返断言是这套系统最容易悄悄改坏的地方（金额、年份、条数）。
- 已知未修的问题写成 `test(name, { todo: "原因" }, fn)`，fn 断言正确行为；修好后自动转 pass。**现在 0 个 todo（已知缺陷已清零）**。
- CI 闸门在 `ci/check.workflow.yml`：因为规范禁止本地改 `.github/workflows/`，首次要在 GitHub 网页建 `check.yml` 粘贴
  （1.8.1 已在该模板里补「Excel 往返对拍」一步；本机等价命令 `pnpm run check`）。
  **`check.yml` 已于 2026-09-16 建到 GitHub（1.8.10 起生效，推送 main / PR 都会跑 typecheck → test →
  test:roundtrip → build + `app/VERSION.txt` 一致性）**；本地 `git log origin/main` 里能看到它
  （本地 `git pull` 之前看不到文件，属正常）。
- 1.8.13 起覆盖 **392 个用例（392 pass + 0 todo）**（1.8.12 时是 390、1.8.11 时是 389、1.8.10 时是 387、1.8.9 时是 384、1.8.8 时是 375、1.8.7 时是 344、1.8.6 时是 315、1.8.5 时是 314、1.8.4 时是 307）：wage / contracts / dates / idcard / excel 往返 / 台账服务端（CAS、坏文件、
  读路径不写盘）/ 账户库自保与审计并发 / 影像按台账隔离与归入 / 权限声明表一致性 / 更新脚本（含镜像比对与旧镜像清理）/
  UI 约定守卫（1.7.16 起：防误关不被 onClick={onClose} 绕过、round2 与 localToday 唯一来源；
  1.8.4 起还管**打印件与屏幕内容分离**——含 window.print() 的页面必须有 no-print 包裹且打印件在包裹外；
  **1.8.10 起还管打印分页**——打印态一屏高必须清零（`min-h-screen/min-h-dvh` → 0 + `.app-bg`
  `overflow:visible`）、打印表格必须有 `thead { display: table-header-group }`、
  **不许出现容器级 `break-inside-avoid`**（白名单只有 `tr` / `.print-keep` / `.payslip`）；
  **1.8.11 再加两条**：`tfoot` 必须 `display: table-row-group`（合计只在最后一页印一次）、
  保险 / 合同 / 报销三个打印件的单据抬头必须在 `<thead>` 里（跨页重复、拆开也认得出）；
  **1.8.12 再加一条**：「一条 = 一个人 / 一份单据」（发放明细里每个人的整节、合同对账单里每份合同）
  必须带 `.print-doc`（整条放得下就并排塞满、放不下才整条另起一页，**不许** `break-before: page`）；
  **1.8.13 再加两条**：打印态必须**压行高**（`th/td` 纵向 1px）与**纸面留白**
  （`article { padding: 2mm 3mm }` + 尾部段落 `margin-top: 1mm` 且 `break-before: avoid`），
  且「无日期的待发放记录…」那句提示只在真有待发放时才印 —— 这几处正是「第 2 页只印一行、留白 243mm」
  的来源；见 tests/ui-guards.test.ts 与 `src/styles.css` 的「打印分页协议」）/
  工具函数与版本日志解析（1.7.19 起：tests/utils.test.ts、changelog.test.ts、xlsx-center.test.ts）/
  保险结算口径（1.7.20 起：tests/insurance.test.ts，函数在 src/lib/insurance.ts，勿在页面重写）/
  全面检查守卫（1.8.0 起：savePhoto 先 rename 就位后清旧、导出月份识别含纯备注行、启动器请求级 500 落盘，
  见 tests/api-guards.test.ts 与 docs/审查与报告/全面检查-20260916.md）/
  版本号规则守卫（1.8.0 起：当前版本 Y≤9、Z≤19，违规直接测试失败，见 tests/changelog.test.ts；
  发版升版本前必看开发规范 §1——1.6.20 与 1.7.20 两次误发都是「知道规则、发版没核对」）/
  数值解析唯一实现（1.8.1 起：src/lib/num.ts 是全库唯一来源，excel/common.ts 只 re-export，见 tests/num.test.ts）/
  日志模块（1.8.1 起：级别/保留天数/单文件上限、慢请求与 5xx 观测；**1.8.4 起上限触发的是滚动
  `YYYY-MM-DD.log.N` 而不是停写**，且 .log.N 受保留策略管辖，见 tests/log-server.test.ts）/
  台账 gzip 传输与影像目录缓存（1.8.1 起：tests/ledger-transfer.test.ts、tests/assets-cache.test.ts；
  **1.8.4 起还测解压炸弹 413 / LEDGER_MAX_MB / LEDGER_GZIP=off**，纯逻辑在 src/lib/ledger-transfer.ts）/
  守卫路径元测试（1.8.1 起：守卫引用的源码路径必须存在，拆文件忘改会让 pnpm test 直接红，见 tests/guards-paths.test.ts）/
  写接口输入口径守卫（1.8.1 起：写 handler 必须有鉴权、必须在第一次写盘前有 4xx/重定向拒绝路径、
  非法 dataUrl/空名字/空 id 必须 400 且不写盘，见 tests/api-input-guards.test.ts）/
  备份接口不写空文件（1.8.4 起：0 字节 body 必须 400 且不动已有备份，见 tests/backup-guard.test.ts）/
  口径决策不变量（1.8.5 起、**1.8.6 纠正代发口径**：`isPaid`（有发放日期即算，按实际收款人、**含代发**）
  是「已发」的唯一判定，`isPaidSelf`（收款人=本人）**只管工资条的单人视角与「其中代发」的子集标注**，
  两处用途不许再混；**已发 A + 待发放 C = 全部合计**，且**代发 B ⊆ A**（单列「其中代发」、不减 A）；
  两种打印清单口径故意不同：明细把待发列入实际收款人名下并逐笔标「已发/待发」+ 拆「已发小计/待发小计」，
  汇总把待发单列一组；年度表逐行「已发」之和 == 总览「已发放」KPI；组合险标注只有一份 `COMBINED_POLICY_NOTE`。
  见 tests/payments-stats.test.ts / tests/attendance-summary.test.ts / tests/insurance-stats.test.ts / tests/caliber-guards.test.ts）/
  权限与账户体验（1.8.7 起：`src/lib/readonly.ts` 是「这次改动能不能落盘」的唯一判定
  ——`canManageLedger()` **且** 该模块 `.edit`，与服务端 `ledger.manage` 同口径；
  有编辑入口的页面必须调 `blockedWrite()`，只读账号的编辑/新增/删除/保存入口禁用或隐藏并写明
  「改动不会保存」；换账号/换台账/退出登录必须 `dropLocalLedger()` 清本机缓存、拉取 401/403 也要清；
  导出必须 `appendAudit`；备份保留 `BACKUP_KEEP` 且只删自己生成的文件名形状。
  见 tests/readonly.test.ts / tests/readonly-guards.test.ts / tests/backup-retention.test.ts / tests/export-audit.test.ts）/
  导入幂等与编辑器重置（**1.8.8 起**：① 发放/报销的 **Excel 去重键**里日期必须**先规范化**
  （`keyDate()`）、收款人必须走 `receiverOf()`（空 = 同实际收款人）——否则「导出→导入→再导入」会
  因为 `2026-9-5`→`2026-09-05`、或空收款人被回填而**多记一笔**；历史重复只提示不自动删
  （`duplicateNotice()`）。② 收款人判定唯一实现是 `src/lib/receiver.ts` 的 `receiverOf()`，
  **禁止**在页面/打印里写裸比较 `owner !== receiver`（空收款人会被标成「代收」，与「其中代发」打架）。
  ③ 所有「本地副本」型编辑弹窗（payments / expense-editor / contract-editor / people）必须有一条
  **随目标记录 id 变化重置本地副本**的同步 effect——少了它「编辑 A 时点新增」会沿用 A 的字段、
  保存后按同 id **覆盖 A**（实测丢数据）。④ 弹窗面板不许用裸 `max-h-screen`（375×667 下顶部会被裁），
  用 `max-h-[calc(100dvh-4rem)]` + `md:max-h-[calc(100dvh-3rem)]`。
  见 tests/import-idempotency.test.ts / tests/receiver-and-editor-guards.test.ts / tests/file-list.test.ts）。

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
  `data/logs/update.log` 与 `data/.gondi-update-error.txt`；`readUpdateLog()` 在 `update.server.ts`，超过 64KB 按行截断。
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

## 1.7.13 全量走查修掉的 26 项（要点）

- **接口/权限**（我改的）：导出 kind 客户端与服务端名字不一致（ledger-export → export，服务端加别名）；
  `createUser` 忽略 `perms`；`members.manage` 自我提权；`/api/audit` POST 覆盖损坏历史；
  `/api/year` NaN 写坏台账；7 个接口非 JSON body → 500；超长文件名 → 500；伪造 Content-Length 挂住连接；
  未捕获异常不落 `data/logs`。
- **Excel 往返**（16 项）：年份识别、重复导入去重、派生表排除、带格式数值解析、合计行过滤、合同列名/扫描件/税率/日期、
  保险合同文件与备注、按 姓名+年+月 跳过冲突、只有备注的考勤行、报销 0 值语义、合同明细两趟解析。
- **约定守卫**（`tests/api-guards.test.ts`）：导出 kind 必须服务端认识；`createUser` 必须读 perms；
  成员接口必须挡自我提权/越权授予；所有读 body 的地方必须有 try/catch；启动器必须有请求体上限与崩溃日志。
- **教训**：像"两边名字不一致""少一句兜底"这类问题，单元测试测不到、构建也不报错 —— 只有
  ①端到端走查 ②写进约定守卫 两条路。以后新增接口/导出项时，顺手补一条守卫。

## 1.7.12 更新容器（gongdi-updater）的生命周期

- 它是**容器**不是镜像：由 `applyDockerUpdate()` 用应用镜像创建，`Cmd: ["node","-e",UPDATER_SCRIPT]`，
  任务走 `GONGDI_JOB` 环境变量；换完容器就退出（exit 0）。
- **故意不自动删**（`AutoRemove: false`，1.7.10 起）：失败时 `docker logs gongdi-updater` 与
  `/api/update-log` 的「更新容器：已退出（exit N）」是唯一的现场证据。
- 但它是可丢弃的：手动 `docker rm -f gongdi-updater` 无副作用；下次更新会先 stop/remove 再重建。
- **别让它占住镜像**：已退出的更新容器在 Docker 里仍算「引用了镜像」。`usedImageIdsOf()` 在统计占用时
  跳过「已退出且名为 gongdi-updater」的容器；`pruneLocalImages()` 在清理前先把它删掉。
  否则它会让上一次更新拉到的那份镜像永远删不掉。

## 1.7.17 整体复查修掉的 8 项（要点）

- **一键更新去硬编码**：更新任务写 `join(DATA_DIR, ".gondi-next.json")`（原写字面量 `/data`，自定义挂载点必坏）；
  更新容器的 `DATA_DIR` 环境变量与数据挂载识别都按本机实际挂载（按「容器内路径 === DATA_DIR」找挂载），
  找不到只记警告、不再猜飞牛默认路径（换 NAS/目录会挂错）。`.gongdi-updater.cjs` 不再生成
  （脚本早已改 Cmd 内联，文件是 1.7.10 之前的残留写法）。
- **`saveDoc` 先就位后清旧**（未闭环清单第 9 条闭环）：临时文件 → rename 就位 → 写指针 → 清旧文件。
  旧指针/旧文件在新文件就位前一律不动，崩溃不再两头空；`sweepDocFiles` 的 keep 比较的是 basename；
  共享文件（别的 id 指针还指着）不删。`removeDocFile` 逐目录先读指针再清，与 save 同口径。
- **读路径降载**：`ensureDirs` 每个「数据目录 × 台账」只做一次（缓存键必须含 DATA_DIR 本身，
  只按台账 id 会在换 DATA_DIR 后误判已就绪、写盘 ENOENT）；合同扫描件补名在没有缺名合同时直接跳过，
  不再每次读台账都 readdir 约 10 个影像目录。
- **审计上限 2000 → 20000**，截断最老记录时 `logServer` 留痕（原静默 slice）。
- 小项：登录限速表超限自动淘汰；启动器请求体超限拒绝后停止缓冲；Windows 更新 bat 拒绝含
  `& | < > ^ % ! " ` 等特殊字符的安装目录；文档更正 `.gondi-update-error.txt`（原误写 gongdi）。
- 完整清单与处理状态见 `docs/审查与报告/全量复查-20260913.md`。

## 仍待处理（已核实、未修）

> 「飞牛一键更新」已于 2026-09-11 现场闭环（1.7.11 → 1.7.12 应用内更新成功）。
> 真因（更新脚本语法错误）与三次修复、两次误判的完整历史见 docs/README.md §三 D 第 10 条。


- **实体级存储**（B 中期剩下的一半）：现在整本台账仍是一个 `ledger.json`，每次改动整本上传（1.8.1 起上行 gzip 压缩止血，
  实测 1.05MB → 52KB）。要拆成按实体保存 + 索引，属于专项（见架构报告 §2「中期」与
  `docs/审查与报告/架构优化方案-20260916.md` §7.3 的决策记录），不要在顺手改功能时夹带 ——
  动它等于改磁盘格式，先要有迁移 + 回滚方案与备份流程。
- **容器以 root 运行 / docker.sock**：属部署取舍，改非 root 需要入口脚本先 chown 再降权；见 `ci/README.md` §3。
  「不需要网页更新」的合规路径（删挂载 → 重建容器 → 改用脚本升级）已写在
  `docs/使用与部署/部署说明.txt` §七与 `常见问题解答(FAQ).md` 第 12 条（1.8.1）。
- ~~**说明文档落后**~~：已于 **1.8.0** 集中重写 `docs/使用与部署/` 下 5 份说明（版本行统一「以 VERSION.txt 为准」、
  影像隔离/logs/一键更新入库、两处失实描述更正），本条闭环。
- **权限预设缺口**：预设「合同财务」没有 `people.view`，而全量台账读取需要它 → 该预设实际上看不到数据。
  修它要么给该预设 `people.view`（会连身份证/银行卡一起开放），要么做实体级权限；属产品决策。
- **HTTP 层无请求体上限**：~~`scripts/app-server-index.mjs` 在鉴权前把整个 body 读进内存。~~
  已于 1.7.13 加 52MB 上限 + 崩溃日志落盘（本条过时，待删）。
- **`pnpm dev` 起不来**（2026-09-12 复查发现）：已于 **1.7.15** 修复 —— 根因是 `vite.config.ts` 的
  `ssr.noExternal: true` 在 dev 下把 CJS 的 react 内联成 ESM；现仅构建时生效。
  详见 `docs/审查与报告/全量复查-20260912.md` §三.1。
- **`dates.ts` 的日校验、`idcard.ts` 的 16/17 位、工资历史 `fromDate` 补零**：均已于 1.7.8 修复
  （原来的 `todo` 用例已转成正式用例）。
- **照片类型仍按文件名匹配**（张三-身份证-正面.jpg）：跨台账隔离已做，但同名不同人仍需人工核对。

## 已决策（不要再当缺陷提 / 不重复改）

> 1.8.9 起把 CTO 已拍板的口径写在这里，避免下次审查把同样的东西又当缺陷报一遍。

- **成员自建台账：允许建，但限数量（1.8.9 落地）**。普通成员最多 **5** 本「自己作为 owner」的台账
  （`MAX_OWNED_BOOKS` 可覆盖，默认 5；**管理员/超管不受限**），超限 400 +「你已创建 N 套台账，已达上限；
  需要更多请联系管理员。」；**只统计 owner**，被加为成员的不算。唯一实现 `src/lib/book-quota.ts`，
  门禁在 `accounts.server.ts` 的 `createBook` 分支（`push` 之前）。改这条口径要同时改
  `tests/book-quota.test.ts` 与 A 组报告第 22 项的处理状态。
- **`attendance.edit` 可整本写台账 —— 保持现状，不改代码（1.8.9 决策）**。整本 PUT 是客户端同步机制
  （自动保存就是整本台账快照），**能改考勤数据的人必须能保存**；收严会出现「能改考勤却保存不了」。
  要收严需改成**按模块增量写**（存储层较大改造），不在顺手改功能时夹带。
  决策记录：A 组报告 `docs/审查与报告/功能测试-A-账户权限设置-20260916.md`「处理状态」
  + 本文件 + `docs/README.md` 未闭环清单。
- **A 组 4 项「未能验证」不补测（用户决定，1.8.9）**：属特殊环境项（无 `docker.sock` /
  跨设备并发 / 真实 print 引擎 / 需先构造整本模板样本），已在 A 组报告第九节与 `docs/README.md` 标注，
  不再作为未闭环项跟踪。

## 已知部署风险

带一键更新功能的 Docker 配置挂载了 `/var/run/docker.sock`。这赋予应用容器较高的宿主机 Docker 控制能力。可信内网部署可以保留；不需要网页更新时，应移除该挂载并关闭对应更新入口。
