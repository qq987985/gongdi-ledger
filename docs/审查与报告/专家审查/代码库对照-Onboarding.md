# 代码库对照报告（只读审查）——一页地图 / 改动清单 / 文档事实核查

> 审查者角色：代码库对照与 onboarding（只读，不改任何代码/配置，不读 `data/`）
> 基线：HEAD（`VERSION.txt` 第一行 = 1.8.13；`package.json` version = 1.8.13）
> 本次只做三件事：① 从 HTTP 入口到打印/导出的「一页地图」；② 六个易漏改区域的同步清单；
> ③ 对 `AGENTS.md` / `docs/README.md` 描述与当前代码的一致性核查。
> 不做代码评审、不提重构建议；凡未亲眼看到的文件都在第 4 节列明「未检查」。

---

## 一、1-Line Summary

这是一个 **TanStack Start + React 19 + TypeScript 的单体 Web 应用**：15 个页面路由 + 17 个 API 路由共用一棵文件路由树，
服务端逻辑跑在 Node 进程里、以 **NAS 上的 JSON 文件为唯一持久化**（`data/books/<台账id>/ledger.json` + `audit.json` + `data/photos/<台账id>/…`），
浏览器侧用 **zustand（localStorage）** 持有一份整本台账快照，改动经 500ms 防抖后**整本 PUT** 回 `ledger.json`（带 `if-match` 版本号做 CAS）。

---

## 二、5-Minute Explanation

- **代码在做什么**：人员 / 考勤 / 工资发放 / 合同 / 报销 / 团体保险 / 影像资料 的录入、汇总、打印与 Excel 导入导出；
  多账号 + 多台账（每本台账一个目录），权限按「用户 × 台账」授予。
- **输入**：浏览器 HTTP 请求（页面 GET、`/api/*` 的 GET/PUT/POST/DELETE，请求体是 JSON 或 gzip、上传是 multipart/arrayBuffer）；
  客户端本地缓存（localStorage `gongdi-ledger-v5`）；Excel 上传文件；环境变量（`DATA_DIR`/`PHOTO_DIR`/`LEDGER_GZIP`/`LOG_*`/`BACKUP_KEEP`/`MAX_OWNED_BOOKS` 等）。
- **输出**：`data/books/<id>/ledger.json`（整本原子写）、`audit.json`（操作记录）、`data/backups/*.xlsx`（备份，保留 30 份）、
  `data/photos/<id>/<分类>/…`（影像/文档）、`data/logs/YYYY-MM-DD.log`（服务端日志）、Docker 容器替换（一键更新）；
  浏览器侧是渲染出的表格/弹窗/打印件与下载的 xlsx。
- **关键文件**（只读这三个也能知道全貌）：
  - `src/lib/accounts.server.ts` —— 账号库 + 登录会话 + **`withTenant()` 权限门禁**（`accounts.server.ts:746`）
  - `src/lib/nas-fs.server.ts` —— 台账/审计/备份的读写与 CAS（`readLedger:40`、`writeLedger:108`）
  - `src/lib/nas-sync.ts` —— 浏览器侧唯一的「拉/推整本台账」通道（`pullNasLedger:132`、`pushNasLedger:339`）
- **主代码路径**：启动器 `scripts/app-server-index.mjs`（生产副本 `app/server/index.mjs`）→ TanStack Start 的 fetch handler
  → 页面/接口路由 → `withTenant` 鉴权 + 绑定台账 → 业务逻辑（页面组件/zustand action 或 API handler）
  → `nas-fs.server` 原子写 NAS 文件 → 客户端 `useApp.setAll` 刷新 → 打印件 / xlsx 导出。

---

## 三、Deep Dive

### 3.1 类型与运行时

| 项 | 事实 | 证据 |
|---|---|---|
| 类型 | Web 应用（单体，前后端同仓同进程） | `src/routes/*.tsx`（15 个页面）+ `src/routes/api/**`（17 个接口）；`package.json:1-4` |
| 运行时 | Node（服务端，Docker `node:22-alpine`）+ 浏览器 | `Dockerfile:1`、`Dockerfile:12` |
| 服务端入口 | 自写 `node:http` 启动器：先静态文件，再交给 TanStack Start | `scripts/app-server-index.mjs:322`（`createServer`）、`:82`（`serveStatic`）、`:118-121`（`nodeFetch` → `fetch(req)`） |
| 生产副本 | `app/server/index.mjs` 与 `scripts/app-server-index.mjs` **字节相同** | `diff -q scripts/app-server-index.mjs app/server/index.mjs` → 无输出（相同） |
| 路由注册 | 文件路由，树是生成物 | `src/routeTree.gen.ts`（702 行）；`src/router.tsx:1-10` |
| 无数据库 | 数据全是文件 | `src/lib/paths.server.ts:37`（`bookRoot()`）、`:62`（`bookAssetsRoot()`） |
| 前端状态 | zustand + persist(localStorage) | `src/lib/store.ts:294`（`persist(`）、`:629`（`name: "gongdi-ledger-v5"`）、`:630`（`version: 10`） |
| 规模 | `src/` 120 个 ts/tsx、约 24,005 行（不含 `routeTree.gen.ts`） | `find src -name '*.ts*' \| wc -l`；`wc -l` 汇总 |
| 测试规模 | 40 个 `tests/*.test.ts`，**392 pass / 0 fail / 0 todo**；Excel 往返 **70/70** | `pnpm test` 尾部 `ℹ pass 392`；`pnpm run test:roundtrip` 尾部「往返用例 70 个 / 通过 70 / 失败 0」 |

### 3.2 一页地图（每一跳都给 文件:行）

**跳 1 — 进程与 HTTP 入口**
- `Dockerfile:12` `CMD ["sh","-c","… && node app/server/index.mjs"]`（镜像只 COPY `app/` 与 `VERSION.txt`：`Dockerfile:8-9`）
- `scripts/app-server-index.mjs:17` `process.env.DATA_DIR ??= join(here,"..","..","data")`（默认数据目录）
- `:132` 请求体上限 52MB；`:292-330` `requestBody()`（声明超限先返 413，发完响应再 `req.destroy()`）
- `:322` `createServer` → `:82` 命中静态文件（`app/public`）否则 `:121` `return fetch(req)`
- `:267` `recordRequest()` 在 `res.finish` 记 5xx / 慢请求；`:203` `logLine()` 同时写 stdout 与 `data/logs/YYYY-MM-DD.log`

**跳 2 — 路由与外壳**
- 页面：`src/routes/index.tsx`、`people.tsx`、`attendance.tsx`、`payments.tsx`、`contracts.tsx`、`expenses.tsx`、`insurance.tsx`、`photos.tsx`、`files.tsx`、`query.tsx`、`audit.tsx`、`import.tsx`、`export.tsx`、`settings.tsx`（+ `__root.tsx`）
- 外壳：`src/routes/__root.tsx:9-53`（root route）→ `src/components/shell.tsx:47` `AppShell()`
- 导航表：`src/components/shell/nav.ts:21-36`（NAV）、`:38-44`（TABS）；可见性按 `NAV_PERM` 过滤：`shell.tsx:114-121`
- API：`src/routes/api/*.ts` 用 `createFileRoute("/api/…")({ server: { handlers: { GET/PUT/POST/DELETE } } })`，例：`routes/api/ledger.ts:53-156`

**跳 3 — 鉴权 / 租户（每个 API 的第一道）**
- `src/lib/accounts.server.ts:746-771` `withTenant(request, fn, need)`：`broken → 503`、`needSetup → 401`、`!user → 401`、`!bookId → 403`、逐个 `need` 用 `checkNeed`（`:733-737`）判定，失败 `logServer("warn","权限拒绝")` + 403，最后 `runWithBook(t.bookId, fn)`
- 身份来源：`accounts.server.ts:296-317` `resolveTenant()`（cookie `gongdi_u/gongdi_t/gongdi_b` 或头 `x-user/x-token/x-book`，`:299-301`）；会话令牌 = `sha256("sess:userId:tokenSalt")`（`:106-108`）；Cookie 见 `:319-327`（HttpOnly/SameSite=Lax）
- 台账上下文：`src/lib/paths.server.ts:32` `runWithBook()`（AsyncLocalStorage）、`:28` `currentBookId()`
- 权限判据：`src/lib/perms.ts:232` `canWriteLedger()`、`:248` `canManageLedger()`（= `*` / `people.edit` / `attendance.edit` / `settings.*`）
- 客户端权限：`src/lib/perms.ts:290` `can()` + `setLivePerms`（`shell.tsx:73` 从 `/api/auth` 写入）；页面用 `components/can.tsx:18` `<Can>` / `:23` `<Need>` / `:35` `<ReadonlyNotice>`
- 不需要 `withTenant` 的写接口（用 `resolveTenant` + 自行校验）：`routes/api/auth.ts:30`（账号/台账册）、`routes/api/images.ts:37`（删镜像）、`routes/api/update.ts:25`（更新容器）——详见 5.6

**跳 4 — 业务处理**
- 页面（读）：`useApp()` 直接订阅 zustand，例 `routes/payments.tsx:45`
- 页面（写）：先过只读守卫再调 action，例 `routes/payments.tsx:116/124/163/302/343`（`blockedWrite("payments.edit"/"payments.delete")`）→ `store.ts:250-289` 的 action → 自动保存（跳 6）
- 接口侧业务：台账读写 `routes/api/ledger.ts:56`（GET）/`:73`（PUT）；导出 `routes/api/file/$kind.ts:184`；备份 `routes/api/backup.ts:9`；影像 `routes/api/photo.ts`、`photo-file.ts`、`photo-scan.ts`、`photo-flags.ts`、`photo-adopt.ts`；文档 `routes/api/doc.ts:41/64/97`；年度 `routes/api/year.ts:44-53`；操作记录 `routes/api/audit.ts:10/14/54/84`
- 统计口径集中处：`src/lib/payments-stats.ts`、`attendance-summary.ts`、`expenses-stats.ts`、`insurance-stats.ts`、`insurance.ts:22/35/42`（`memberDays`/`isActive`/`prevDayEnd`，页面只 import：`routes/insurance.tsx:16`）、`receiver.ts:17`（`receiverOf` 唯一实现）
- 日期/金额/工资：`src/lib/dates.ts`、`src/lib/wage.ts:189`（`round2`）、`src/lib/work.ts`（`hasWork`）

**跳 5 — 存储（NAS 文件）**
- 台账读：`src/lib/nas-fs.server.ts:40-61` `readLedger()`（解析失败 → `unreadable`，**不回写**；`:59` 合同扫描件补名只在内存视图）
- 台账写：`:108-112` `writeLedger()` 串行队列 → `:86-105` `writeLedgerNow()`：`:90` 先 `readLedger()`（坏文件→`"unreadable"`）、`:92` CAS 比对、`:94-98` 临时文件 + `rename` 原子写
- 版本号同源：`:72-74` `ledgerRevisionValue()`（空台账用 `""` 哨兵）；GET 响应头 `routes/api/ledger.ts:67`、PUT 响应头 `:149`、PUT 的 `if-match` 基准 `:138-139`
- 写前校验：`routes/api/ledger.ts:130-134` → `src/lib/ledger-schema.server.ts:46-66`（zod，`.passthrough()` + `TELLTALE_KEYS` 防空对象）+ `:68` `validateLedgerPayload`
- 传输：GET 侧 gzip `routes/api/ledger.ts:34-51`；PUT 侧解压与上限 `:75-120`（`src/lib/ledger-transfer.ts`）
- 审计：`:147-174` `readAudit()`（坏文件置 `auditBroken`）→ `:193-224` `appendAudit()`（串行 + 读不到就拒写）→ `:176-188` `writeAudit()`（上限 2e4，`:182`）
- 备份：`:273-293` `saveBackup()`（0 字节拒写、先时间戳后固定名）→ `:252-271` `pruneBackups()`（`BACKUP_KEEP`，`:239-243`）
- 台账册：`:294-304` `listBookIds()`、`:312-320` `readBookMeta()`、`:322-332` `writeBookMeta()`、`:334-345` `removeBookDir()`
- 影像/文档：`src/lib/assets.server.ts:311` `savePhoto()`、`:577-617` `saveDoc()`（临时文件→`rename` 就位→写指针→清旧）、`:684` `adoptLegacyAssets()`
- 路径与目录：`src/lib/paths.server.ts:16` `dataDir()`、`:37` `bookRoot()`、`:62-65` `bookAssetsRoot()`（`<影像根>/<台账id>/`）、`:90-115` `ensureDirs()`（缓存键 `DATA_DIR::bookId`：`:96`）

**跳 6 — 客户端状态与同步**
- 启动：`src/components/shell.tsx:16-33` `useHydrateStore()` → `persist.rehydrate()` → `startNasSync()`（`nas-sync.ts:372`）
- 探测：`nas-sync.ts:39-53` `detectNas()` 读 `/api/health`（`routes/api/health.ts:11-17` 返回 `persist/ledgerGzip/backupKeep`）
- 登录后：`shell.tsx:68-94` `refreshGate()`：`/api/auth` → `setLivePerms` → 缓存归属检查（`nas-sync.ts:116` `checkCacheOwner`）→ `dropLocalLedger`（`:95`）→ `pullNasLedger({seed:true})`
- 拉：`nas-sync.ts:132-187`（`GET /api/ledger`，`:144` 记 `X-Ledger-Revision`，`:161-179` `useApp.setAll`；401/403 清本机 `:141`）
- 推：`store.subscribe`（`:386-392`，500ms 防抖）→ `pushNasLedger`（`:339`）→ `enqueuePush` 串行（`:333`）→ `pushNasLedgerNow`（`:249`，`pullDepth>0` 不推 `:253`，`canManageLedger` 门槛 `:254`）→ `putLedger`（`:220-234`，`if-match` + gzip）→ 409 让用户二选一（`:264-292`）
- 切台账/退出：`flushPendingLedger()`（`:347`）、`dropLocalLedger()`（`:95`）、`checkCacheOwner`（`:116`）

**跳 7 — 打印 / 导出**
- 打印入口（含 `window.print()` 的 6 个文件）：`components/contract-editor.tsx:109`、`routes/payments.tsx:112`、`routes/insurance.tsx:425`、`routes/contracts.tsx:244`、`routes/expenses.tsx:194`+`:511`、`routes/query.tsx:467`
- 打印件本体（`.print-only`）：`components/payment-sheets.tsx:67`、`routes/expenses.tsx:674`、`routes/contracts.tsx:104`、`routes/insurance.tsx:703`、`routes/query.tsx:184`、`components/expense-editor.tsx:404`
- 协议唯一处：`src/styles.css:494-608`（说明块 `:494-520`，`@media print` `:521`：一屏高清零 `:527-535`、`thead` 每页重复 `:538`、`tr` 不拆 `:541`、`tfoot → table-row-group` `:552`、`.print-doc` `:562`、行高压 1px `:573`、`article` 留白 `:587`+`:590`、`.print-keep` `:598`、`.print-title` `:604`）
- 导出页 → 接口：`routes/export.tsx:22-29`（`EXPORT_ITEMS` 6 项）→ `/api/file/{kind}`（`routes/api/file/$kind.ts:184-272`，`EXPORT_VIEW_PERM` `:173-179`，别名 `ledger-export` `:171`）→ Excel barrel `src/lib/excel.ts:6-13` → `src/lib/xlsx-center.ts:17` `writeCenteredXlsx()` → 写操作记录 `routes/api/file/$kind.ts:201` `appendAudit`（权限 `export.use` + 实体 `.view`，`readonly-guards.test.ts:108` 有守卫）
- 整本备份：`nas-sync.ts:354-370` `pushNasBackup()` → `/api/backup`（`routes/api/backup.ts:9`）→ `nas-fs.server.ts:273` `saveBackup()`

### 3.3 关键边界（谁负责什么）

| 边界 | 文件 | 职责 |
|---|---|---|
| 外壳/UI 件 | `src/components/shell/*`（nav/brand/theme/book-switcher/year-switcher/win-update/version-log/screens）+ `src/components/shell.tsx` | 导航、品牌、主题、切换器、更新卡、版本日志、登录与兜底屏 |
| 页面骨架 | `src/routes/*.tsx`（15） | 装载数据、表格、Route 注册；弹窗拆到 `components/` |
| 编辑器弹窗 | `components/expense-editor.tsx`、`contract-editor.tsx`（共享小件 `expense-bits.tsx`） | 本地副本 + 「随 id 变化重置」同步 effect |
| 打印件 | `components/payment-sheets.tsx` + 4 个页面的 `.print-only` 块 | 纸面版式（样式只在 `styles.css`） |
| 领域逻辑 | `src/lib/*.ts`（wage/dates/work/insurance/receiver/contracts-totals/payments-stats/…） | 纯计算，页面只 import |
| 服务端存储 | `paths.server ← assets.server ← nas-fs.server`（单向） | 目录与原子写 → 影像/文档 → 台账/审计/备份/台账册 |
| 账号与权限 | `accounts.server.ts`、`perms.ts`、`book-quota.ts` | 账户库、会话、`withTenant`、权限声明表与预设、台账册配额 |
| Excel | `src/lib/excel/common.ts` + 6 实体模块 + `full.ts`，经 `excel.ts` barrel | 导出/导入与去重；`common ← 实体 ← full` 单向 |
| 更新 | `src/lib/update/{consts,log,version,docker,updater-script,apply}.ts`，经 `update.server.ts` barrel | Docker 引擎交互、镜像选择、内联替换脚本、更新日志 |
| 日志 | `src/lib/log.server.ts`（应用进程内）+ `scripts/app-server-index.mjs:182-258`（启动器内） | 落盘 + stdout；**两套实现**（见 5.3） |

单向依赖实测：
- `paths.server` 不 import 业务：`src/lib/paths.server.ts:6-9` 仅 node 内建。
- `assets.server` 只从 `paths.server` 取路径（`:11-22`），对 `nas-fs.server` 只有 `import type { LedgerRead }`（`:10`，类型导入，编译后擦除）。
- `nas-fs.server` import `assets.server`（`:12` `reconcileContractScans`）与 `paths.server`（`:13-23`）→ 方向 `paths ← assets ← nas-fs` 成立。
- Excel 实体模块只依赖 `common`（`grep 'from "./'` 结果：attendance/contracts/expenses/insurance/payments/people 各 1 条 `./common`），只有 `full.ts:30-34` 依赖实体模块。
- `update/log.ts:9` import `./docker`，`update/docker.ts:8` import `./log` —— 互引（`开发规范.md:` 「互引的唯一例外」已登记）。

---

## 四、「改一处要动几处」清单

> 每条只列**必须同步看一眼/改一次**的文件，均附证据（grep / 行号）。用途：改完一处后对照检查是否漏改。

### 4.1 数据模型（例：给 `Payment` 加/改一个字段）

| # | 文件:行 | 为什么必须同步 |
|---|---|---|
| 1 | `src/lib/types.ts:64-72`（`Payment`）、`:109-126`（`LedgerState`）、`:107`（`LEDGER_SCHEMA_VERSION`） | 实体定义与结构版本 |
| 2 | `src/lib/store.ts:250-289`（`AppActions`：`addPayment`/`patchPayments`/`replacePayments`…）、`:294-700`（`persist`、`:635` `migrate`、`:683-699` `partialize`） | 本机持久化与旧数据迁移（`version: 10` 在 `:630`） |
| 3 | `src/lib/nas-sync.ts:55-71`（`sliceState`）、`:161-179`（`pullNasLedger` 的 `setAll`） | 上行/下行字段白名单：漏了 = 保存不到服务器 |
| 4 | `src/lib/ledger-schema.server.ts:23`（`payment` schema）、`:56`、`:33-44`（`TELLTALE_KEYS`）、`:87`（`ledgerPayloadSummary`） | 服务端 zod 校验与日志摘要 |
| 5 | `src/lib/excel/common.ts:215`（`paymentKey`）、`:159`（`normalizeDate`）、`:223`（`expenseKey`）、`:313`（`planAttendanceImport`） | 导入去重键与日期规范化（1.8.8 幂等口径） |
| 6 | `src/lib/excel/payments.ts` + `full.ts:33` + `src/lib/excel.ts:6-13`（barrel） | 导出列与整本导入 |
| 7 | `src/components/excel-import.tsx`（`PaymentImport` 等 6 个导入件，`routes/import.tsx:2` 引用） | 导入预览/冲突策略 |
| 8 | 页面与打印：`routes/payments.tsx`、`components/payment-sheets.tsx:67`、`routes/query.tsx:184`、`routes/index.tsx` | 列表、打印清单、工资条、总览 KPI |
| 9 | 统计：`src/lib/payments-stats.ts`、`src/lib/receiver.ts:17`（`receiverOf`，唯一实现）、`src/lib/dates.ts`（年份归属） | 汇总口径（`caliber-guards.test.ts` 管） |
| 10 | 测试：`tests/roundtrip/cases-payments.ts`、`cases-fullbook.ts`、`tests/excel-roundtrip.test.ts`、`tests/ledger-schema.test.ts`、`tests/ledger-server.test.ts`、`tests/import-idempotency.test.ts`、`tests/payments-stats.test.ts`、`tests/caliber-guards.test.ts` | 往返与口径守卫 |

（`grep -rln "Payment\|payments" src/` 命中 23 个文件，是本区域「改动面」的实际上界。）

### 4.2 权限（新增/调整一个权限 id）

| # | 文件:行 | 为什么 |
|---|---|---|
| 1 | `src/lib/perms.ts:21`（`PERM_TABLE`，唯一声明处）→ `:131` `PermId`、`:136` `PERM_GROUPS`、`:142` `ALL_PERMS`、`:151` `PRESETS`、`:254` `NAV_PERM` | id 只在这一张表里出现一次；写错/漏声明会编译不过或被 `perms.test.ts` 拦下 |
| 2 | `src/lib/perms.ts:232` `canWriteLedger` / `:248` `canManageLedger`（若影响整本写判据） | 前后端「能不能写整本」共同判据 |
| 3 | 页面权限点：`components/can.tsx`（`Can`/`Need`/`useCanSave`）、各页面 `<Can perm="…">` / `<Need perm="…">` | 界面按钮/入口可见性 |
| 4 | `src/lib/readonly.ts:19-46`（`canSaveToServer`/`blockedWrite`）与 `shell/year-switcher.tsx:28`、`routes/{attendance,payments,insurance,…}.tsx` 的 `blockedWrite(...)` 调用点 | 只读账号的拦截口径 |
| 5 | 服务端需要该权限的接口：`grep -rn "withTenant" src/routes` 共 30+ 处，例 `routes/api/ledger.ts:70/152`、`routes/api/photo-flags.ts:20/25`、`routes/api/file/$kind.ts:272` + `:173-179` | 接口门禁 |
| 6 | `src/components/shell/nav.ts:21-36`（NAV）+ `perms.ts:254`（NAV_PERM） | 导航项与权限的对应；少一处 = 导航可见但页面无权限（或反之） |
| 7 | `src/lib/book-quota.ts:20-40`（`MAX_OWNED_BOOKS`/`ownedBooksLimitMessage`）+ `accounts.server.ts`（`createBook` 分支） | 台账册数量门禁（已决策口径） |
| 8 | 测试：`tests/perms.test.ts:66-85`（扫 `src/` 全库的 `perm="…"` 与 `"x.y"` 字面量）、`tests/readonly-guards.test.ts:32-39`（`EDIT_PAGES` 白名单）、`tests/api-input-guards.test.ts:14-15`（写 handler 必须有 withTenant/resolveTenant + 首次写盘前有 4xx）、`tests/book-quota.test.ts` | 守卫 |
| 9 | 文档口径：`开发规范.md:242`（§6.7 权限协议）、`docs/使用与部署/使用说明书.md`（权限说明段） | 用户可见说明 |

### 4.3 打印件（改任何 `.print-only`）

| # | 文件:行 | 为什么 |
|---|---|---|
| 1 | `src/styles.css:494-608`「打印分页协议」 + `开发规范.md:190-241`（§6.6 打印协议） | 规则唯一处：不许在组件里各写一套 |
| 2 | 6 个含 `window.print()` 的入口（见 3.2 跳 7），必须「屏幕内容 `no-print` 包裹 + 打印件在包裹外」 | `tests/ui-guards.test.ts:185` 守卫 |
| 3 | 打印件本体 6 处（`payment-sheets.tsx:67`、`routes/expenses.tsx:674`、`routes/contracts.tsx:104`、`routes/insurance.tsx:703`、`routes/query.tsx:184`、`components/expense-editor.tsx:404`） | 纸面内容/表头/抬头 |
| 4 | `tests/ui-guards.test.ts` 的 9 条打印约定：`:185`（打印分离）、`:296`（一屏高清零+`thead` 重复）、`:327`（禁容器级 `break-inside-avoid`）、`:402`（`tfoot` 只印一次）、`:419`（抬头进 `<thead>`：`insurance.tsx`/`contracts.tsx`/`expenses.tsx` 三处 token 在 `:421-423`）、`:444`（`.print-doc`：`payment-sheets.tsx`/`contracts.tsx`，`:446-447`）、`:470`（行高与纸面留白）、`:493`（无待发放不印提示） | 改了会直接红的判据 |
| 5 | `ci/mobile-print-check.mjs`（`:20-27` 用法）+ `ci/print-pdf.mjs` | 分页只能在真 PDF 上量 |
| 6 | 若改动涉及口径（已发/待发/代发）：`src/lib/payments-stats.ts`、`receiver.ts`、`components/payment-sheets.tsx` + `tests/caliber-guards.test.ts` | 打印口径与汇总口径必须同源 |

### 4.4 Excel（改导入/导出/模板）

| # | 文件:行 | 为什么 |
|---|---|---|
| 1 | `src/lib/excel/common.ts`（`:215` `paymentKey`、`:223` `expenseKey`、`:159/165` 日期规范化、`:172` `isSafeFileName`、`:181` `parseContractFiles`、`:234` `mergeUnique`、`:313` `planAttendanceImport`、`:342-367` 建表件） | 共享层；`common.ts:8` re-export `num.ts`（数值解析唯一来源） |
| 2 | 实体模块 6 个：`excel/{people,attendance,payments,expenses,insurance,contracts}.ts`；整本：`excel/full.ts:30-34`；barrel：`src/lib/excel.ts:6-13` | 单向依赖 `common ← 实体 ← full` |
| 3 | `src/components/excel-import.tsx`（6 个导入组件）+ `src/routes/import.tsx:2` | 预览、增加/替换、去重提示 |
| 4 | `src/routes/api/file/$kind.ts:1-16`（模板）、`:173-179`（导出权限）、`:171`（别名）、`:201`（导出写审计） | 导出 kind 与模板必须在服务端认识 |
| 5 | `src/routes/export.tsx:22-29`（`EXPORT_ITEMS` 列表） | 客户端 kind 与服务端名字必须一致（历史上不一致踩过） |
| 6 | 测试：`tests/roundtrip/run.ts`（9 组用例：people/attendance/payments/contracts/expenses/insurance/fullbook/edge/more）+ `tests/excel-roundtrip.test.ts`、`tests/import-idempotency.test.ts`、`tests/num.test.ts`、`tests/xlsx-center.test.ts` | 70 例对拍 |
| 7 | 提交前额外闸门：`pnpm run test:roundtrip`（`package.json:12`；AGENTS.md 明确要求改 Excel 代码时加跑） | — |

### 4.5 一键更新链路

| # | 文件:行 | 为什么 |
|---|---|---|
| 1 | `src/lib/update/consts.ts:2-5`（REPO / DEFAULT_IMAGE / SOCK / HELPER_NAME） | 常量下沉处 |
| 2 | `src/lib/update/{version,log,docker,updater-script,apply}.ts` + `src/lib/update.server.ts:8-23`（barrel） | 导入路径不变（barrel 兼容） |
| 3 | `src/lib/update/updater-script.ts:6`（`UPDATER_SCRIPT` 模板字符串） | 改动必须能被 JS 引擎解析：`tests/update-script.test.ts` 用 `new Function(UPDATER_SCRIPT)` 真解析 |
| 4 | `src/lib/update/docker.ts:25`（`dockerReq`）、`:162`（`pickRemovableImages`）、`:190`（`usedImageIdsOf`）、`:236`（`pruneLocalImages`） | `dockerReq` 第三参数必须是 `{ body }` / `{ stream }`（1.7.6 教训，`tests/update-script.test.ts:200-211` 扫源码） |
| 5 | 接口：`src/routes/api/update.ts:9-70`、`src/routes/api/update-log.ts:17-25`、`src/routes/api/images.ts:24-45` | 管理员 + 同源校验 |
| 6 | 前端：`src/components/shell/win-update.tsx:13`（检查）、`:68`（轮询状态）、`:87`（触发）、`:135`（读日志）、`:159/189`（列/清镜像） | 更新卡 UI |
| 7 | 交付：`Dockerfile:12`（CMD）、`docker-compose.yml`（`/var/run/docker.sock` 挂载）、`.github/workflows/docker.yml:27-35`（镜像标签：只有 `latest` 与 sha 类）、`:47`（用 `head -n1 VERSION.txt` 取版本） | 镜像标签口径决定「能不能按版本拉」 |
| 8 | 测试：`tests/update-script.test.ts`（扫 `update/docker.ts`/`apply.ts`/`log.ts` 源码，`:200-360`）、`tests/update-log.test.ts` | 守卫 |
| 9 | 文档：`ci/README.md`（发版说明）、`docs/使用与部署/部署说明.txt` §七、`docs/使用与部署/常见问题解答(FAQ).md` 第 12 条 | 合规路径说明 |

### 4.6 版本号（发版）

| # | 文件:行 | 为什么 |
|---|---|---|
| 1 | `VERSION.txt` 第一行（唯一来源；`tests/changelog.test.ts:70-76` 断言首行 = 解析出的 current） | — |
| 2 | `package.json:4`（`version`） | 与 VERSION 同步 |
| 3 | `README.md:11`（当前版本）+ `:25` 起「当前版本（每次发版改这里）」 | 根入口文档 |
| 4 | `app/VERSION.txt`（由 `scripts/copy-output.mjs:35` 从根复制；`ci/check.workflow.yml` 构建后要求 `git diff --quiet -- app/`） | 产物一致性闸门 |
| 5 | `src/routes/api/version.ts:8-11` + `src/lib/changelog.ts:48`（`parseChangelog`）+ `src/components/shell/version-log.tsx:33`（读 `/api/version`） | 界面「版本日志」 |
| 6 | `tests/changelog.test.ts:89-98`（规则守卫：当前版本第三位 Z ≤ 19） | 违规直接测试失败 |
| 7 | `开发规范.md:11-30`（§1 版本号规则）、`docs/使用与部署/*`（统一写「以 VERSION.txt 第一行为准」） | 说明文档 |
| 8 | `Dockerfile:9`（`COPY VERSION.txt`）、`win/pack.sh:21`（打进 Windows 包） | 交付物 |

---

## 五、事实核查：AGENTS.md / docs/README.md 与当前代码的一致性

### 5.1 已核对一致的关键描述（抽样，均带证据）

| 描述 | 出处 | 现状证据 | 结论 |
|---|---|---|---|
| 当前版本 1.8.13、392 用例 0 todo | `AGENTS.md:63` | `VERSION.txt:1` = `1.8.13`；`pnpm test` → `ℹ pass 392 / ℹ fail 0 / ℹ todo 0` | ✅ 一致 |
| Excel 往返 70 例 | `AGENTS.md:52` | `pnpm run test:roundtrip` → 「往返用例 70 个 / 通过 70 / 失败 0」 | ✅ 一致 |
| 日期/金额/工资唯一实现 | `AGENTS.md:21` | `src/lib/wage.ts:189`（`round2` 唯一）、`src/lib/num.ts` 经 `excel/common.ts:8` re-export | ✅ 一致 |
| `hasWork` 在 `work.ts`、`nasEnabled` 在 `nas-flag.ts` | `AGENTS.md:22-23` | `grep -rn nasEnabled src/` 全部来自 `~/lib/nas-flag`；`nas-sync.ts:5` 也是从 `nas-flag` 引 | ✅ 一致 |
| 存储三层单向 `paths ← assets ← nas-fs` | `AGENTS.md:23-25` | `paths.server.ts:6-9` 无业务 import；`assets.server.ts:10` 对 nas-fs 只有 `import type`；`nas-fs.server.ts:12` import assets | ✅ 一致（`assets → nas-fs` 的边是类型导入，编译后擦除） |
| Excel 单向 `common ← 实体 ← full` | `AGENTS.md:23-24` | 实体模块各只有 1 条 `./common`；`full.ts:30-34` 才 import 实体 | ✅ 一致 |
| 影像按台账隔离 + 历史回落可关 | `AGENTS.md:118-121` | `paths.server.ts:62-65`、`assets.server.ts:169-170`（`PHOTO_LEGACY_FALLBACK`） | ✅ 一致 |
| 写入需 `ledger.manage`、读取需 `people.view` | `AGENTS.md:18` | `routes/api/ledger.ts:70`（GET `people.view`）、`:152`（PUT `ledger.manage`） | ✅ 一致 |
| 审计上限 2 万、备份保留 30 | `AGENTS.md:230、:103` | `nas-fs.server.ts:182`（`MAX_AUDIT_ENTRIES = 2e4`）、`:239-243`（`BACKUP_KEEP` 默认 30） | ✅ 一致 |
| 启动器 52MB 上限 + 请求级 500 落盘 | `AGENTS.md:252-253` | `scripts/app-server-index.mjs:132`、`:385-390` | ✅ 一致 |
| `pnpm dev` 已修（`ssr.noExternal` 仅构建时） | `docs/README.md` §三 10 | `vite.config.ts:14-19`（`noExternal: command === "build" ? true : []`） | ✅ 一致 |
| `saveDoc` 先就位后清旧 | `docs/README.md` §三 9 | `assets.server.ts:602-610` | ✅ 一致 |
| 预设「合同财务」无 `people.view` | `AGENTS.md:250`、`docs/README.md` §三 2 | `perms.ts:190-206`（`contract` 预设的 12 项里没有 `people.view`） | ✅ 一致 |
| 成员自建台账限 5 本 | `AGENTS.md:265-269`、`docs/README.md` §三 4 | `book-quota.ts:20-40` | ✅ 一致 |
| 「整本台账一个 `ledger.json`、每次改动整本上传」 | `docs/README.md` §三 1 | `routes/api/ledger.ts:73-153` + `nas-sync.ts:220-234`（整本 PUT） | ✅ 一致 |
| 容器 root + 挂 docker.sock | `AGENTS.md:279-281`、`docs/README.md` §三 3 | `Dockerfile` 无 `USER`；`docker-compose.yml` 挂载 `/var/run/docker.sock` | ✅ 一致 |
| 打印分页协议 5 条守卫 | `docs/README.md` 索引行 + `AGENTS.md:67-76` | `tests/ui-guards.test.ts:402/419/444/470/493` | ✅ 一致 |

### 5.2 **已过时的描述**（A 级：文档与现状直接矛盾）

**F1 — `AGENTS.md:11`：`docs/使用与部署/` 的说法已作废**
- 原文：`- docs/使用与部署/ —— 使用说明、目录结构、部署说明、上传说明（注意：版本行还停在 1.2.x，内容滞后）。`
- 现状（8 份文件全部写「以 `VERSION.txt` 第一行为准」）：
  - `docs/使用与部署/使用说明.md:3`、`:334`；`目录结构.txt:2`；`部署说明.txt:3`、`:39`；`说明.txt:2`；
    `程序文件说明.txt:2`；`GITHUB上传说明.txt:2`；`使用说明书.md:4`；`常见问题解答(FAQ).md:4`
- 复现：`grep -n "VERSION.txt" docs/使用与部署/*` → 每份都有；`grep -n "1\.2\.[0-9]" docs/使用与部署/*` 只剩 `使用说明.md:17-18`/`:431` 的历史包名
- 同一文件 `AGENTS.md:248-250` 已写「说明文档落后 —— 已于 1.8.0 集中重写」，与本行自相矛盾
- 影响面：新读者按 `AGENTS.md:11` 会跳过 8 份实际已对齐的文档，或误信「不可用」
- 判定：**A（文档失实）｜建议本轮修**（改这一行文字即可，与 `AGENTS.md:248` 对齐）

**F2 — `开发规范.md:337`：用例数停在 315，与 AGENTS 和实测都不一致**
- 原文：`**目前覆盖：** **315 个用例（315 通过 / 0 个 todo）**——1.8.4 从 291 增到 307，1.8.5 增到 314，1.8.6 增到 315；…`
- 现状：`pnpm test` → `ℹ tests 392 / ℹ pass 392 / ℹ todo 0`；`AGENTS.md:63` 写「1.8.13 起覆盖 **392 个用例**」
- 复现：`pnpm test 2>&1 | tail -6`；`grep -n "315 个用例" 开发规范.md`
- 影响面：`开发规范.md` §10 是「测试怎么算过关」的依据文档，数字落后 6 个版本（315→392，差 77 例）
- 判定：**A（文档失实）｜建议本轮修**（`开发规范.md` §10 未随 1.8.7–1.8.13 同步）

### 5.3 **代码行为与文档宣称相反**（A 级：日志上限「滚动」还是「停写」）

**F3 — 同一天日志文件有两个写入者，上限语义相反**
- 文档 / AGENTS 宣称（1.8.4 口径）：
  - `AGENTS.md:85-86`：「**1.8.4 起上限触发的是滚动 `YYYY-MM-DD.log.N` 而不是停写**，且 .log.N 受保留策略管辖」
  - `开发规范.md:337` 同句；`docs/使用与部署/使用说明书.md:163`：「1.8.4 起单文件写满会**自动滚动**成 `2026-09-16.log.1`、`.2`……（不再停写，当天的现场不会丢）」
- 代码事实（两套实现，写同一个文件）：
  - 应用进程内：`src/lib/log.server.ts:42`（正则含 `.log.N`）、`:110`（`isManagedLogFile`）、`:152`（`nextRotationName`）、`:217-252`（超限 → `rename` 成 `.log.N` 后继续写）、`:275`（`logServer`）。**行为 = 滚动。**
  - 生产启动器：`scripts/app-server-index.mjs:184-185`（`capped` 状态）、`:226`（`if (logState.capped) return;`）、`:240-247`（超限置 `capped=true` 并只往 stdout 打一句「当天日志已达上限，**今天不再写文件**」）；`:228-233` 的字节计数**只在当天首写 `statSync` 一次**，之后不再刷新，也不感知基名被滚动搬走。`app/server/index.mjs` 与 `scripts/app-server-index.mjs` 字节相同（`diff -q` 无输出）。
- 复现（本人实测，命令与输出）：
  1) 启动器侧：
     ```
     DATA_DIR=/tmp/gxlog1 PORT=18123 SLOW_MS=0 LOG_MAX_MB=0.001 node app/server/index.mjs &
     for i in $(seq 1 12); do curl -s -o /dev/null "http://127.0.0.1:18123/?n=$i"; done
     ls /tmp/gxlog1/logs → 只有 2026-09-17.log（955 字节 / 8 行）
     grep -c 慢请求 /tmp/gxlog1/logs/2026-09-17.log → 7
     stdout 出现：{"event":"当天日志已达上限，今天不再写文件", ...}
     ```
     即：12 次请求只留下 7 条「慢请求」，其余**静默丢弃**（文件不再增长）。
  2) 应用侧同样参数（同一库函数）：
     ```
     DATA_DIR=/tmp/gxlog2 LOG_MAX_MB=0.0005 node -e 'const {logServer}=await import("./src/lib/log.server.ts"); for(let i=0;i<8;i++) await logServer("warn","测试事件"+i,{i});'
     ls /tmp/gxlog2/logs → 2026-09-17.log + 2026-09-17.log.1（8 条一条不丢）
     ```
- 影响面：`data/logs/<当天>.log` 达到 8MB（`LOG_MAX_MB`）后，**启动器那一路**的事件（慢请求、HTTP 5xx、请求处理失败、未捕获异常、请求体被拒——`scripts/app-server-index.mjs:203/267/385-390`）当天不再落盘，只剩 stdout；而应用侧 `logServer` 的事件继续写 `.log.N`（`:247`）。排查现场时「同一个日志文件里的记录完整程度取决于事件来自哪一路」。若应用侧先滚动（基名被 `rename` 走、基名重新变小），启动器的陈旧计数仍会认为已到上限。
- 判定：**A（确认不一致：代码 vs 文档/测试宣称）｜建议本轮修**（口径二选一：把启动器改成与 `log.server.ts` 同口径，或把 AGENTS/开发规范/使用说明书三处描述改回「停写」）。注：`tests/log-server.test.ts` 只覆盖 `src/lib/log.server.ts`，**不覆盖启动器的复刻实现**，所以 `pnpm test` 全绿并不会发现这条。

### 5.4 文档自述与实际文件不符（C 级）

**F4 — `docs/README.md:17-18`「每份报告末尾都有『处理状态』小节」与实测不符**
- 原文（`docs/README.md:19`）：「按时间顺序。每份报告末尾都有「处理状态」小节，逐条写 ✅已修 / ⏭️无需改 + 理由（项目惯例，见 `开发规范.md` §2）。」
- 实测：`grep -c 处理状态 docs/审查与报告/*.md` → 6 份为 0，其中
  - `打印分页与省纸排查-20260916.md` 尾部是实测表 + 「结论」段（无状态小节），但其索引行标「✅ 四条已修…」；
  - `代码审查纪要.md`（尾部为「复审更正」）、`代码复审报告-20260908.md`（「终审结论」/「复审核验」）、`架构优化方案-20260916.md`（「第 1 波落地与决策记录追加时间」）用的是别的标题；
  - `审查修复说明-20260910.md`、`代码库现状报告-20260916.md` 正文确无状态小节（后者索引状态为「🔄 待用户定优先级」）
- 判定：**C｜留待后续**（不影响代码，但会让新读者以为状态一定在报告里；`打印分页与省纸排查` 那份最像是漏补）

**F5 — 「未闭环项唯一清单」少一项：AGENTS 有、`docs/README.md` §三 没有**
- `docs/README.md` §三 标题自述：「当前未闭环项（**唯一清单**）… AGENTS.md 里保留一份同样的清单给智能体看。」
- `AGENTS.md:259` 列了「照片类型仍按文件名匹配（张三-身份证-正面.jpg）：跨台账隔离已做，但同名不同人仍需人工核对」
- `grep -n "照片类型\|文件名匹配" docs/README.md` → **无命中**；代码侧该行为仍成立（`assets.server.ts:28-33` 的 `labelOf` 按类别名匹配，`src/lib/photos.ts:25`/`:72-75` 用「身份证-正面/银行卡/IC卡」等文件名关键词）
- 判定：**C｜留待后续**（两处清单不一致；要么补进 §三，要么在 AGENTS 注明是「不跟踪的观察」）

### 5.5 描述粒度偏差（C 级）

**F6 — `AGENTS.md:17`「API 写入必须经过 `withTenant(request, fn, need)`」覆盖面比代码宽**
- 事实：3 个写接口没有走 `withTenant`，而是 `resolveTenant` + 自行校验角色/同源：
  - `src/routes/api/auth.ts:30-31`（POST：登录/建号/建台账册 → 写 `accounts/accounts.json`）
  - `src/routes/api/images.ts:37-43`（POST 清镜像：`resolveTenant` + `role !== "admin"` → 403）
  - `src/routes/api/update.ts:25-46`（POST 触发更新：`checkSameOrigin` + `resolveTenant` + `role !== "admin"`）
- 守卫测试的**真实口径**是二者其一：`tests/api-input-guards.test.ts:14-15`「每个会写盘的 handler 必须有鉴权（withTenant / resolveTenant）」
- 判定：**C｜留待后续**（这三个接口写的不是台账数据；把 AGENTS 的绝对句改成「台账/业务数据写入必须走 withTenant；账号/容器类接口至少要 resolveTenant + 角色校验」即与代码一致）

**F7 — `AGENTS.md:36` 与 `src/styles.css:494` 的版本标注落后于内容**
- `AGENTS.md:36` 写「（1.8.10 起，1.8.11 补充）」，但同一 bullet 与紧邻条目（`:67-76`）已含 1.8.12（`.print-doc`）、1.8.13（行高/纸面留白）条款；`styles.css:494` 的协议块自述「打印分页协议（1.8.10）」但正文 `:556-596` 是 1.8.12/1.8.13 条款
- 判定：**C｜留待后续**（纯版本标注，不影响规则本身）

### 5.6 无法核实 / 未核实的条目（如实列出）

| 条目 | 出处 | 为什么这次核不了 |
|---|---|---|
| 「中等工地约 1.45 MB/次」「1.05MB → 52KB」 | `docs/README.md` §三 1、`AGENTS.md:241-242` | 需要 `data/` 里的生产台账；本次禁止读写 `data/`，未验证 |
| 「飞牛一键更新 2026-09-11 现场闭环」 | `docs/README.md` §三 D | 需现场环境（NAS + docker.sock） |
| 各历史版本的页数/留白实测数字（243.7mm、0.1mm 等） | `打印分页与省纸排查-20260916.md` | 需真 PDF 复测；本次只静态核对规则与守卫存在 |
| 「20 条未记录的问题线索」等报告内部计数 | `docs/README.md` §一 索引行 | 未逐条核对报告正文 |
| `tests/roundtrip` 每个用例的业务正确性 | `tests/roundtrip/cases-*.ts` | 本次只跑「是否通过」（70/70），未逐例审阅断言 |

---

## 六、本次检查范围（可复核）

**检查过**（只读，命令可复现）：
- 入口与交付：`Dockerfile`、`docker-compose.yml`、`scripts/app-server-index.mjs` 与 `app/server/index.mjs`（`diff -q` 相同）、`scripts/copy-output.mjs`、`package.json`、`vite.config.ts`、`.gitattributes`、`.github/workflows/{check.yml,docker.yml}`、`ci/check.workflow.yml`、`ci/mobile-print-check.mjs`（头部）
- 服务端：`src/lib/{accounts.server,paths.server,nas-fs.server,assets.server,perms,readonly,ledger-schema.server,ledger-transfer,log.server,nas-sync,store,types,changelog,book-quota,receiver,xlsx-center,insurance}.ts`、`src/lib/excel.ts` + `excel/*.ts` 的 import 关系、`src/routes/api/*.ts` 与 `api/file/$kind.ts` 的 handlers/need
- 前端：`src/components/shell.tsx`、`shell/nav.ts`、`components/can.tsx`、`settings.tsx` 引用、6 个打印入口的 `window.print()` 行、`routes/export.tsx`
- 样式/协议：`src/styles.css:520-608`（打印态）+ `:390-440`（`.print-only`/`.payslip`）
- 测试：`pnpm test`（392/392）、`pnpm run test:roundtrip`（70/70）、`tests/{ui-guards,guards-paths,perms,api-input-guards,changelog}.test.ts` 的判据与扫描路径
- 文档：`AGENTS.md`（全 281 行）、`docs/README.md`（全）、`开发规范.md` §1/§6.6/§10/§11/§12、`docs/使用与部署/` 8 份的版本行与相关段落、`docs/审查与报告/` 20 份的尾部与状态字样

**未检查**：`data/**`（生产数据，按要求未读写）、`node_modules/`、`dist/`、`browser-screenshots/`、`win/启动.bat`/`停止.bat` 的运行行为、
各历史审查报告的正文细节（只核对了索引行、尾部状态与本次相关的结论）、`.dsh-vision-router/`、`public/`。
本次未运行 `pnpm run typecheck` 与 `pnpm build`（只跑了 `pnpm test` 与 `pnpm run test:roundtrip`；两条命令结束后 `git status --porcelain` 为空，未产生/修改仓库文件）。

**本次产生的文件**：仅本报告 `docs/审查与报告/专家审查/代码库对照-Onboarding.md`；
临时实验目录 `/tmp/gxlog1`、`/tmp/gxlog2`（仓库外）。
