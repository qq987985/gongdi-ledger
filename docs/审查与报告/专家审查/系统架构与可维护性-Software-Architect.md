# 专家审查 · 系统架构与可维护性（Software Architect）

- **审查范围**：模块边界与依赖方向（`src/lib/*`、`src/routes/*`、`src/components/*`、`scripts/`、`src/lib/excel/*`、服务端三层 `paths ← assets ← nas-fs`）、文件体量、整本 JSON 快照的架构后果、`store.ts` + `nas-sync.ts` 同步状态机竞态、错误处理是否有一处统一约定。
- **不评**：业务口径（发放/保险/合同算法）、UI 细节、安全漏洞（各有专人）。
- **基线**：`VERSION.txt` 首行 `1.8.13`，HEAD `7674e24`；**工作区不干净** —— 本轮评审期间另一路正在改代码，`git status --porcelain` 显示已改动 `AGENTS.md / docs/README.md / package.json / scripts/app-server-index.mjs / src/components/{contract-editor,expense-editor}.tsx / src/lib/{confirm-close,log.server,wage}.ts / src/lib/excel/full.ts / src/routes/{contracts,payments,people}.tsx / 开发规范.md`，并新增未跟踪文件 `src/lib/unsaved.ts`、`src/components/unsaved-guard.tsx`、`src/lib/backup-book.ts`、`src/lib/rename-person.ts`、`src/lib/sync-status.ts`、`src/lib/sync-mute.ts`、`scripts/log-core.mjs`、`scripts/build-stamp.mjs`、`ci/docker.workflow.yml`、`docs/审查与报告/专家审查/`。**凡涉及这些文件的发现，均以本报告落盘这一刻的工作区内容为准，请复核时以 `git diff` 对齐。**

> **行号口径（重要）**：`src/lib/nas-sync.ts` 在我审查期间被另一路改了（`git diff --stat` = **+25/−8**），本报告所有 `nas-sync.ts` 行号都取自落盘前的最后一次核对：`let pushFailed = false` **:13**、`pushQueue` **:16**、`ledgerRevision` **:17**、`pullDepth` **:19**、`dirty` **:21**、`sliceState` **:57**、`reportPullFailure` **:82**、`dropLocalLedger` **:97**、`pullNasLedger` **:134**、`applyRemote`（定义 **:192**，`pullNasLedger` 内两处调用 **:157/:163**）、`syncFailed/syncOk` **:203-220**、`pushNasLedgerNow` **:269**、`enqueuePush` **:346**、`flushPendingLedger` **:367**、`pushNasBackup` **:372**、`startNasSync` **:407**、`useApp.subscribe` **:421**。核对命令：`grep -n 'let pushFailed\|let dirty\|pullNasLedger\|applyRemote\|flushPendingLedger\|useApp.subscribe' src/lib/nas-sync.ts`。
- **纪律**：只读。未改仓库里任何代码/配置；**未读写 `data/`**；除本报告外未在仓库内产生文件（复现脚本在 `/tmp/*.mjs`）。
- **闸门（我自己跑的）**：`pnpm run typecheck` → **0 错误**；`pnpm test` → **392 pass / 0 fail / 0 todo**（1.95s）。`pnpm run test:roundtrip` 与 `pnpm build` **未跑**：本报告不涉及 Excel 与构建产物，且 `build` 会重写被提交的 `app/`。
- **环境**：macOS，Node **v24.20.0**（`node --import ./tests/register.mjs` 跑源码级复现脚本）。

---

## 0. 结论速览

| 级别 | 条目 | 处置 |
|---|---|---|
| **A** | **A1 在途 pull 没有代际/互斥 → 迟到响应把上一本台账的数据写进当前台账**（已跑通复现，内存污染 + 下一次自动保存 PUT 带着旧册数据） | **建议本轮修** |
| **A** | **A2 `开发规范.md` §12 的三条结构红线没有任何机械守卫；现状已存在 3 个 import 环 + 1 条反向边，而 `pnpm test` 全绿** | **建议本轮修**（加守卫 + 机械消环，成本低） |
| B | B1 整本快照的真实成本与 CAS 粒度（实测：1.71MB 台账 17ms/次保存、写放大、冲突粒度=整本） | 留待后续（本轮给过渡措施 6 条） |
| B | B2 切台账/换年份的编排协议散在 4 处，且 `flushPendingLedger()` 失败后**无条件继续**（丢弃本机改动）—— 「UI 不可见」那半已由本轮 `sync-status.ts` 落地 | 建议本轮修（与 A1 同一处收口） |
| B | B3 备份/恢复口径不含影像，恢复后指针悬空且无一致性检查 | 留待后续（先补文案 + 导入后校验） |
| B | B4 保险页把 3 个弹窗塞在路由文件里（§12.1/§12.3 明文违反）；本地自造 `Modal` 外壳 | 建议本轮修（与拆分同批） |
| B | B5 工作区新增的 `unsaved.ts` / `useUnsavedChanges` **全库无调用方** —— 「考勤月表离开拦截」可能仍是半落地 | 需本轮确认 |
| C | C1 `update/log ↔ update/docker` 的互引例外**没在注释里写明原因**（§12.3 要求写） | 留待后续 |
| C | C2 `types.ts` 与 §3「接口定义唯一模型来源」不一致（契约类型实际定义在 `contracts.ts`） | 留待后续 |
| C | C3 错误处理有约定但**没有「服务端错误 → 用户文案」的唯一实现**（`src/` 152 个 catch 子句里 **50 个是空体**、11 处手写状态码文案）；根路由无 `errorComponent` | 留待后续 |

**一句话**：这个代码库的**模块划分整体是健康的**（出口 barrel、方向规矩、共用件下沉都做到了，Excel/update/shell 三条主线我逐条核过、方向都对），问题集中在**「规矩写进了文档但没人机械检查」**和**「客户端同步状态机的并发边界（pull 侧）没有任何防护」**两处。

---

## 1. A 级：确认缺陷

### A1 在途 `pullNasLedger` 没有代际/互斥 → 迟到的响应把**上一本台账**的数据写进当前台账

**级别**：A（确认缺陷，已跑通复现）　**处置**：**建议本轮修**

**证据（代码）**

- `src/lib/nas-sync.ts:134` `export async function pullNasLedger(...)`：函数体内对拉取结果**只有** `applyRemote(...)`（`:157` / `:163`），**没有**任何「这本台账还是不是当前台账」「这次拉取是不是最新一次」的判定。
- `src/lib/nas-sync.ts:97-103` `dropLocalLedger()`：只重置 `ledgerRevision = ""`、`pushFailed/dirty`、清内存（`:100`），**不使在途请求失效**（没有 AbortController、没有 generation 计数）。
- 切台账的实际顺序（`src/components/shell/book-switcher.tsx:41-51`）：`flushPendingLedger()` → `authOp("useBook")` → `dropLocalLedger()` → `setCacheOwner()` → `pullNasLedger()`。**切换期间若还有另一次 pull 在飞（开机 seed 拉取、年度切换、设置页刷新、上一次切换自身的拉取），它落地时会把旧册数据写回内存。**
- 反向对照：**推送**侧有 `pullDepth`（`nas-sync.ts:19`）和串行队列 `pushQueue`（`:16`、`:346`）；**拉取**侧既无队列也无代际 —— 保护只做了一半。

**证据（复现，可重跑）**：脚本 `/tmp/repro-pull-race2.mjs`（全文见附录 A；stub `fetch`，不连真实服务器）。输出：

```
   [fetch] GET /api/health
   [fetch] GET /api/ledger
1) 开机（台账A）： A人员0,A人员1,A人员2
   [fetch] GET /api/ledger
已清空本机台账缓存：切换到台账 B
   [fetch] GET /api/ledger
2) 切到台账 B 并拉到 B： B人员0,B人员1
3) 迟到的 A 响应落地后，内存： A人员0,A人员1,A人员2
   [store subscribe 触发]
   [fetch] POST /api/audit
   [fetch] PUT /api/ledger
4) 自动保存 PUT 的 people： A人员0,A人员1,A人员2,B台账新录入 | PUT 次数: 1
```

**复现步骤**：① 起一次「台账 A」的 pull 并让它的响应挂住；② 走切册流程（`dropLocalLedger` → 拉台账 B → B 落地，内存正确显示 B 的 2 人）；③ 让 A 的响应此刻才落地 → **内存被换成 A 的 3 人**；④ 在新台账里录一个人 → 500ms 后自动保存的**整本 PUT 请求体里带的是 A 的人员 + 新录入**。

**影响面**

1. **跨台账数据可见**：切册后屏幕上是上一本册子的人员工资（含身份证/银行卡字段），与 AGENTS.md「台账同步三条硬约束 #2（不要把上一本台账的状态推给新台账）」同一条战线；与另一路 **Backend Architect A1（租户解析静默回落写错册）** 是**两个不同机制、同一种后果**（那一条在服务端写入侧，这一条在客户端内存侧）。
2. **跨台账写入**：下一次自动保存就是整本快照（`sliceState` 含 people/attendance/payments…，`nas-sync.ts:62-77`）。真实服务器上这次 PUT 通常因 `if-match` 对不上而 409（此时用户被问「以本机覆盖 / 放弃本机」，点确定 = 把旧册数据写进新册）；**若两册的当前内容恰好完全一致（同一 hash，例如都刚用同一份模板整本导入过）这次 PUT 会被服务端接受并直接落盘**。
3. 触发窗口不大（需要 pull 在飞时切册），但**开机 seed 拉取 + 用户登录后立刻切册**在慢网下很容易撞上，且症状（数字对不上）极难归因。

**建议修法（最小改动，收口一处）**

1. 在 `nas-sync.ts` 加**代际令牌**：`let pullGen = 0`；`pullNasLedger` 进入时 `const gen = ++pullGen`，`applyRemote` 之前判 `if (gen !== pullGen) return;`（丢弃过期响应）；`dropLocalLedger()` 与切册入口 `pullGen++`。
2. 顺手把拉取串行化（与推送对称）：`pullQueue = pullQueue.then(run, run)`，避免同册两次 pull 乱序落地。
3. 把切册五步收成 `nas-sync` 的一个 `switchBook(id)`（见 B2）—— 顺序不再由 4 个调用点各自记忆。
4. 加一条回归守卫：`tests/` 里用 stub fetch 断言「旧册 pull 迟到不得覆盖新册状态」（本报告附录 A 的脚本可直接改写成用例）。

---

### A2 结构红线（§12）**没有任何机械守卫**；现状已有 3 个 import 环 + 1 条反向边，而三道闸全绿

**级别**：A（明文红线被违反 + 保护缺失）　**处置**：**建议本轮修**

**证据（检测方法与结果）**：对 `src/**`（排除 `routeTree.gen.ts`）做 import 图 SCC 检测（脚本见附录 B）。**含 `import type` 的静态环**：

```
3   src/lib/contracts.ts, src/lib/types.ts, src/lib/wage.ts
      contracts.ts -> wage.ts      (值：round2)
      types.ts     -> contracts.ts (import type：ContractRecord/ContractEntry)
      wage.ts      -> types.ts     (import type：Person/WageHistory)
2   src/lib/assets.server.ts, src/lib/nas-fs.server.ts
      nas-fs.server.ts -> assets.server.ts (值：reconcileContractScans)
      assets.server.ts -> nas-fs.server.ts (import type：LedgerRead)
2   src/lib/update/docker.ts, src/lib/update/log.ts
      docker.ts -> log.ts (值：appendUpdateLog)
      log.ts    -> docker.ts (值：dockerReq)
```

**只算运行期值导入**（排除 `import type`）时，环只剩最后一个 —— 也就是说**前两个环是「类型环」，运行期无害**，但它们照样违反 §12.3「**禁止循环依赖**」，而且 `assets.server.ts:10 import type { LedgerRead } from "./nas-fs.server"` 正是 §12.2 明写「影像层**不 import 台账存储**」的那条边（只是恰好写成了 type-only）。

**关键问题不是这两个环本身，而是「没有任何东西拦得住下一个环」**：

- `tests/` 下**没有一条测试**解析 import 关系（`perms.test.ts` / `ui-guards.test.ts` / `guards-paths.test.ts` 都会读源码，但读的是权限字面量、UI 约定与路径存在性；`grep -rn "循环依赖\|cycles\|import 图" tests/*.test.ts` 无命中）。
- 于是**同时**成立：`pnpm run typecheck` 0 错误 + `pnpm test` 392/392 通过 + 3 个环存在。§12 的三条红线和「拆分后守卫路径要同步改」这类约定，目前**全靠人记**——这与项目自己反复吃亏的教训（「少一句兜底、两边名字不一致，测试和构建都报不出来」）是同一类风险，只是这次的检查对象是依赖图。
- 对照 `update/log ↔ update/docker`：§12.3 允许这一例外，但**要求「必须在注释里写明原因」**，我在 `src/lib/update/docker.ts:1-4` 与 `src/lib/update/log.ts:1-4` 都没看到这句说明（只有「从 update.server.ts 原样搬出」）。见 C1。

**影响面**：不是运行期故障，而是**长期可维护性与「规矩的可验证性」**：模块化重构（1.7.18/1.7.19 两轮）的成果没有回归防线，下一次拆文件时把实体模块反向引 `full`、或让影像层 import 台账存储，都只会在很久以后以「改一处莫名其妙地坏三处」的形式暴露。

**建议修法（每条都小）**

1. **新增 `tests/structure-guards.test.ts`**（零依赖，读源码正则抓 `import/export ... from`，做 SCC）：
   - 断言「无环」，白名单**仅** `update/log ↔ update/docker`（且要求两侧注释里出现「互引/例外」字样，否则也红）；
   - 断言三条主线的方向：`paths.server` 不引 `assets/nas-fs`、`assets.server` 不引 `nas-fs`、`excel/common` 不被实体模块引、实体模块不引 `full`、`shell/nav` 不被 shell 各件反向依赖；
   - 把新守卫的文件路径登记进 `guards-paths` 的既有机制。
2. **机械消除两个类型环**（纯 `refactor:`，零行为变化）：
   - `ContractRecord / ContractEntry / EntryKind` 搬到 `types.ts`（`types.ts:2-3` 现在是 `export type {...} from "./contracts"` 的**反向再导出**，与 §3「定义层 = `types.ts`（唯一模型来源）」的表述**互相打脸**，见 C2），`contracts.ts` 改成 `import type { ... } from "./types"` → 环消失且文档变真；
   - `LedgerRead` 从 `nas-fs.server.ts:31-36` 下沉到一个叶子（`types.ts` 或新 `ledger-read.ts`），`assets.server.ts:10` 改引叶子 → 反向边消失，同时把 §12.2「影像层不 import 台账存储」变成字面成立；（`reconcileContractScans` 的入参本来就是内联结构类型，改动面很小。）

---

## 2. B 级：风险/隐患

### B1 整本快照的服务端成本与 CAS 粒度（实测数字 + 过渡措施）

**级别**：B　**处置**：**留待后续**（实体级存储本轮不做，见 §5 的过渡措施）

实测（`DATA_DIR=/tmp/ledger-bench-data`，脚本 `/tmp/bench-save.mjs`，Node v24.20.0，本机 SSD；非 NAS 磁盘，绝对值会偏乐观）：

| 台账规模（人/考勤/发放/合同明细） | `ledger.json` | 单次 `readLedger()` | 单次 `writeLedger`（含 CAS 读 + hash + indent 写 + rename） | gzip 后 |
|---|---|---|---|---|
| 30 / 360 / 140 / 300 | 0.22 MB | 1.1 ms | **2.8 ms** | 5 KB |
| 200 / 2400 / 2000 / 2000（≈文档里的「中等工地 1.45MB」） | 1.71 MB | 3.8 ms | **17.4 ms** | 36 KB |
| 600 / 7200 / 6000 / 6000 | 5.15 MB | 11.1 ms | **51.7 ms** | 126 KB |

- 放大规律：**线性**（三组规模严格成比例，`5.15/1.71 = 3.01`，`200→600` 人、`2400→7200` 考勤），单条记录 JSON 体积（indent 2，即磁盘格式）：人员 **792B**（compact 626B）、考勤 172B、发放 165B、合同明细 267B、报销 134B、被保人 190B、保单 233B。
- **容量不是问题**：按上面的线性关系，默认上限 `LEDGER_MAX_MB=32MB` ≈ **3,700 人 + 4.4 万条考勤 + 3.7 万笔发放 + 3.7 万条合同明细**。一个工地远小于此 ⇒ 「整本快照会撑爆」这个担心可以放下（**这一点本报告与「体积增长」相关的判断都是「不是瓶颈」**，真正的成本在下面两条）。
- **真正的后果 ①：写入放大**。磁盘格式是 `JSON.stringify(data, null, 2)`（`nas-fs.server.ts:97`）—— indent 版本比 compact 大 **26.5%**（792 vs 626B/人）。而 `ledger.json` 又是**每次改动整本重写**（rename 就位），NAS 机械盘上每次编辑 = 一次 1.7MB 写入 + 目录元数据变更；`data/backups/` 另有 30 份 XLSX 副本（`nas-fs.server.ts:237-269`）。这不是功能缺陷，是**长期磁盘寿命/写延迟**问题。
- **真正的后果 ②：CAS 与冲突粒度 = 整本台账**。`ledgerRevisionOf()` 是**整份 JSON 的 sha256**（`nas-fs.server.ts:63-65`），于是「A 设备改发放、B 设备改合同」**必然互相冲突**，而唯一解决方式是 `window.confirm` 二选一（`nas-sync.ts:264-292`）——**放弃的一方整本的改动都没了**。这条与 Backend Architect 的 A2（PUT 响应头版本号不同源导致**假冲突**）叠加时最危险：假冲突会诱导用户点「以本机覆盖」，真丢对方的改动。
- 附带观察（不单列条目）：`schemaVersion` 在 `sliceState`/`partialize` 里被写成常量 `LEDGER_SCHEMA_VERSION`（`nas-sync.ts:64`、`store.ts:684`），**读回来的 `j.schemaVersion` 只在 `setAll` 时被覆盖**——目前 `migrate()`（`store.ts:635+`）承担了字段级兼容，schemaVersion 实际没有参与任何判定；文档（AGENTS.md B 项「`LedgerState.schemaVersion`」）容易让人以为它是迁移开关。属文档口径，提醒即可。

**过渡措施（不动磁盘格式，按成本从低到高）**：见 §5。

---

### B2 切台账/换年份的编排协议散在 4 处；`flushPendingLedger()` 失败后**无条件继续**

**级别**：B（可致本机改动静默丢失）　**处置**：**建议本轮修**（与 A1 同一处收口）

**证据**

- **已落地的一半（本报告只记录，不重复报）**：`src/lib/sync-status.ts`（`setSyncFailed / setSyncIdle / subscribeSyncStatus`）+ `nas-sync.ts:203-220` 的 `syncFailed() / syncOk()` —— 「未同步」已能被顶部横幅读到，「失败只弹一次」也抽成了 `failedNotified`。
- **仍然缺的一半：失败没有短路。** `src/lib/nas-sync.ts:367-372`：
  ```ts
  export async function flushPendingLedger(): Promise<void> {
    if (!nasEnabled()) return;
    try { await pushNasLedger(); } catch {}
  }
  ```
  `pushNasLedgerNow` 本身**从不抛错**（失败只走 `syncFailed()`，`:322-344`）⇒ `flushPendingLedger()` 的成败**调用方无从区分**，而切册流程紧接着 `dropLocalLedger()`（`:97`）把本机状态清成 `emptyState()`。
- 调用点各写一遍同一串顺序：`src/components/shell/book-switcher.tsx:41-51`（flush → useBook → dropLocal → pull）、`src/components/settings/accounts-card.tsx:105-112`、`:144-148`、`:178-185`（新建/切册/删除，三处）、`src/components/shell.tsx:82-95`（开机：checkCacheOwner → dropLocal → detectNas → pull seed）。
- 后果链：`ledger.manage` 不足 / NAS 抖 / 会话失效（401）→ 保存失败 → 用户点「切换台账」（或切年份、新建册）→ 本机数据被丢弃，**同一秒还会弹一句「已切换到「X」」**（`book-switcher.tsx:52`）。前端报告的 **B2（推送失败只提示一次、无「未同步」状态）** 覆盖的是**可见性**（本轮已落地横幅），本条的**增量**是「**切换路径缺少失败短路**」这条结构性缺口 —— 可见性修好之后，用户会**看见**「未同步」却依然能一键切走把它丢掉。
- 同一族的第二个证据（与前端 C6 同源，从架构角度补一句）：`src/components/shell/year-switcher.tsx:40-45` 删年度前用的是 `pullNasLedger()`（**先覆盖本机**）而不是 `flushPendingLedger()`（先推上去）；`src/routes/settings.tsx:17` 里 `pullNasLedger, flushPendingLedger` 两个名字**只出现在 import 行、全文未使用**（死导入，TypeScript 未开 `noUnusedLocals` 所以闸门不会红）——像是一次「本来要在设置页做 flush」的痕迹。两条路径行为不一致已由前端 C6 记录，这里只补「死导入」这条证据。

**建议修法**

1. `nas-sync` 把 `syncState()` 用足：`flushPendingLedger()` 返回 `boolean`（或 `"ok" | "failed"`），切册/换年份/新建册的入口在 `false` 时**中止并提示**（「本机改动还没保存成功，切换会丢失：重试 / 放弃并切换」）——这与项目已有的 `blockedWrite()`（只读拦截）是同一种「先问再动」的习惯；横幅（`sync-status.ts`）已经能表达状态，缺的只是**让流程读它**。
2. 把「flush → useBook → dropLocal → setCacheOwner → pull」收成 `nas-sync.switchBook(id)`，4 个调用点只调它；`pullGen++` 也放在这里（A1 的修法 3）。

---

### B3 备份/恢复口径里没有影像；恢复后指针悬空且无一致性检查

**级别**：B　**处置**：**留待后续**（与汇总 A13「备份失真」是同一条恢复链的下一环，可一起排）

**证据**

- 应用内备份 = **只有 XLSX**：`src/lib/nas-sync.ts:372+`（`pushNasBackup()`；工作簿组装现已下沉 `src/lib/backup-book.ts` → `POST /api/backup`）→ `src/routes/api/backup.ts:30-38`（`saveBackup` 写 `data/backups/`）→ `src/lib/nas-fs.server.ts:252-269`（保留 30 份，只删自己生成的形状）。
- 影像**不在**这条口径里：`data/photos/<台账id>/…`（`开发规范.md` §11.1）既没有归档/导出入口，也没有随备份一起打包；`src/lib/excel/` 里**没有任何 `existsSync` / `findDoc` / `findPhotoPath`**（`grep` 0 命中）⇒ 导入/恢复**不会检查** `contracts[].scanFileName`、`contractEntries[].fileName`、`attendanceDocs[].fileName` 指向的文件是否存在。
- 文档侧的现状是「靠人记住整份 `data` 一起备份」：`docs/使用与部署/常见问题解答(FAQ).md:190`「整份 `data` 覆盖回去，或只恢复 `data/books`（数字）+ `data/photos`（影像）」；而设置页备份卡片只写「备份到 data/backups/…」「保留最近 N 份」（`src/routes/settings.tsx:161-183`），**没写「Excel 备份不含照片/扫描件」**。

**影响面**：只依赖应用内备份的用户，在换机/重装/误删 `data/photos` 后，**表格数字能回来、证件照与合同扫描件回不来**，而且看不到任何「附件缺失」的提示（要到点开某张单的影像时才发现 404）。取证/审计场景里证件照与扫描件是原始凭证，这一条比「少一列Excel」更重。

**建议修法（低成本优先）**：① 备份卡片与 FAQ 各加一句「Excel 备份只含表格，影像在 `data/photos`，请单独备份整个 `data` 目录」；② 导入整本 / 恢复后跑一次「附件存在性检查」，把缺失的列成一张清单给用户（复用 `findDoc/findPhotoPath`，不需要新机制）；③ 真正的影像归档（zip/增量）留作专项。

---

### B4 保险页把 3 个弹窗塞在路由文件里（§12.1/§12.3 明文违反）；另有一份自造 `Modal` 外壳

**级别**：B（结构违规 + 变更成本）　**处置**：**建议本轮修**（与 §4 的拆分同批做）

**证据**：`src/routes/insurance.tsx`（801 行，**全库最大路由**）

- `:54-94` 本地 `Field` / `DateTimeField`（§6.3 允许本地 Field，不算问题）；
- `:95-129` **本地自造的 `ModalCloseCtx` / `ModalCancelButton` / `Modal`**（含 `useGuardedClose` 接线）—— §6.3 要求「一律 `Modal`（或同款 backdrop）」，但全库**没有共享的 Modal 组件**（`src/components/ui/` 只有 `badge/button/input`，共 82 行）：`useGuardedClose` 有 **5 个调用点**（`expense-editor.tsx:53`、`contract-editor.tsx:71`、`payments.tsx:462`、`insurance.tsx:107`、`people.tsx:388`），同一份 backdrop 外壳
  `fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 print:hidden md:items-center md:p-6`
  在 **6 处各写一遍**（`contract-editor.tsx:98`、`expense-editor.tsx:173`、`payments.tsx:519`、`people.tsx:458`、`photos.tsx:162`、`insurance.tsx:110` —— 最后这份还漏了 `print:hidden`，正是「拷贝式外壳」开始分叉的证据）⇒ 防误关/背板协议在 5–6 处各接一遍（这也是前端 B3/C2 那些「Esc 双重确认 / 缺 aria」能反复出现的原因）；
- `:130-797` `InsurancePage()` 一个函数 **668 行**，其中三个弹窗都在里面：`:511`（保单）、`:621`（被保人）、`:663`（替换人）。
- 规范原文：§12.1「编辑弹窗拆到 `src/components/` 独立文件（现例：`expense-editor.tsx`、`contract-editor.tsx`、`settings/` 五张卡片）」；§12.3「**不许往路由文件里塞第二个弹窗**」。这里塞了**三个**。

**影响面**：改「替换人」要滚过「保单」「被保人」两个弹窗与整页 800 行；弹窗外壳的 4 份拷贝让「防误关/Esc/aria」的每条修正都要改 4 处（前端报告 C2 已实测到缺 `role="dialog"`）。属可维护性成本，不影响运行正确性。

---

### B5 工作区新增的 `unsaved.ts` / `useUnsavedChanges` **全库无调用方**

**级别**：B　**处置**：**需本轮确认**（若正在接线请忽略本条，只作留痕）

**证据**

- `src/lib/unsaved.ts`（62 行）与 `src/components/unsaved-guard.tsx`（31 行）为本次评审期间的**未跟踪新文件**（`git status --porcelain` 显示 `??`）。
- `grep -rn "useUnsavedChanges" src/ tests/` → **只命中它自己的文件**（定义 + 注释）；`grep -rni "unsaved" src/ tests/` 的命中文件只有 `src/lib/unsaved.ts` 与 `src/components/unsaved-guard.tsx`（外加若干含中文「未保存」文案的页面，与本模块无关）。⇒ **没有任何页面接上它**，`tests/` 里也没有对应用例。
- 而 `unsaved.ts` 的注释明写它的目标是「底部导航、左侧导航、浏览器返回、F5 / 关标签、换台账、换年份全都不拦」，并且要求「**不要在页面里各写一份 `window.confirm`**」；对照现状：`src/routes/attendance.tsx:27-30` 仍写着页面本地的
  ```ts
  // 月表是本地编辑、「保存本月」才落盘：切月/返回总览前要拦住未保存的修改
  if (monthDirtyRef.current && !window.confirm("本月考勤有未保存的修改，确定离开吗？…")) return;
  ```

**影响**：如果这轮认定该机制「已落地」，那么**考勤月表在「底部导航 / F5 / 换台账 / 换年份」这几条离开路径上仍无拦截**（正是 `unsaved.ts` 自己列出的缺口）；如果只是接线未完成，请在报告/PR 里标成「进行中」，避免下轮评审把它当成已完成。**建议**：接线（`attendance.tsx` 调 `useUnsavedChanges(dirty, msg, canEdit)`）**与**删除 `attendance.tsx:27-30` 的页面本地 confirm 一起做，并补一条守卫测试（断言全库只有 `unsaved.ts` 一处 `LEAVE_CONFIRM_HINT` 文案 / 页面不许自写 `不确定=继续编辑` 式 confirm）。

---

## 3. C 级：改进建议（含取舍）

### C1 `update/log ↔ update/docker` 的互引例外没写明原因（§12.3 要求写）

- 证据：`src/lib/update/docker.ts:8` `import { appendUpdateLog } from "./log";`、`src/lib/update/log.ts:9` `import { dockerReq } from "./docker";`；两个文件头注释（`docker.ts:1-4`、`log.ts:1-4`）只写「从 update.server.ts 原样搬出，行为不变」，**没有** §12.3 要求的「运行期才互调、加载期无副作用」的原因说明。
- 修法（两选一，取舍写明）：
  - (a) **只补注释**（0 风险，但环保留）：在两个文件头各加一句「互引例外：`log` 读更新容器现场要发 Docker 请求、`docker` 清镜像/失败要写更新日志；加载期无副作用（§12.3）」。
  - (b) **常量/叶子下沉消环**（推荐，多一个 40 行文件）：把 `appendUpdateLog` 挪到 `update/log-file.ts`（只依赖 `paths.server`）→ `docker.ts → log-file.ts`、`log.ts → log-file.ts + docker.ts`，环消失；`readContainerLogs` 仍在 `docker.ts`。取舍：`update/` 目录从 6 个文件变 7 个，换来「结构守卫可一刀切禁环」。

### C2 `types.ts` 与 §3「唯一模型来源」不一致

- 证据：`开发规范.md` §3 表格写「定义 | `src/lib/types.ts` | 接口定义（**唯一模型来源**）」；实际 `src/lib/types.ts:1-3` 是
  ```ts
  import type { ContractRecord, ContractEntry } from "./contracts";
  export type { ContractRecord, ContractEntry, EntryKind } from "./contracts";
  ```
  —— 合同的三个类型**定义在** `src/lib/contracts.ts:36` / `:102` / `:104`。于是「合同域的类型在 contracts、其它域的类型在 types」这种二元格局没有任何文档记载，新人（本仓库有专门的「代码库对照」评审角色，可见这类需求真实存在）会按 §3 去 `types.ts` 找 `ContractRecord` 而找不到。
- 修法：与 A2 的建议 2 一起做 —— 三个类型搬回 `types.ts`、`contracts.ts` 反向 `import type`（同时消掉类型环）。取舍：`git blame` 上合同类型的历史被挪一次；收益是**文档与代码一致 + 环消失 + 守卫可断言「实体类型只定义在 types.ts」**。

### C3 错误处理「有约定，但没有唯一实现」；根路由无 `errorComponent`

- 现状梳理（这部分其实做得比多数项目好）：
  - **服务端**：`logServer(level, event, detail)`（`src/lib/log.server.ts:275`）是唯一落盘通道（级别/保留/滚动都有纯函数与用例）；API 一律 `Response.json({ error, invalid?, conflict?, corrupt?, need? }, { status })`，且有守卫测试兜底「每个会写盘的 handler 必须有鉴权 + 第一次写盘前有 4xx 路径」（`tests/api-input-guards.test.ts`）。
  - **客户端**：`toast.error/warning` + `console.warn`；审计走 `logOp()`（`src/lib/audit.ts`，明写「不能静默失败」）；权限走 `blockedWrite()`（`src/lib/readonly.ts`，唯一判定）。**这三个是「唯一实现」的好范例。**
  - **缺口**：没有「**服务端错误 → 用户可读文案**」的唯一实现。全库 **11 处**手写 `` `失败（${status}）` ``、**7 处**「请检查网络」，`nas-sync.ts:82-88` 专门为 pull 写了 `reportPullFailure`（401/403/503 分文案），而 `pushNasLedgerNow`（`:322-344`）又另写一套，两者的 401 语义处理还不一致（前端 B2 已报 401 被说成网络问题）。**空体 catch 有 50 个**（我把 `src/**` 的 152 个 `catch` 子句逐个取了函数体：50 个函数体为空、连注释都没有 —— 复算脚本见附录 C）没有白名单规则，其中写路径上的空 catch 与「静默失败」的教训正面冲突（前端 A2 已报 7 处写操作缺 catch，这里是**系统性**的计数与规则缺失）。
  - **根路由无兜底 UI**：`grep -rn "errorComponent\|notFoundComponent\|defaultErrorComponent" src/` **0 命中**（`src/routes/__root.tsx` 只有 `head` 与 `component`）⇒ 页面渲染异常/非法 URL 落到框架默认 UI，与本项目「坏台账有专门兜底页、坏账户库有专门兜底页」的风格不一致（`shell/screens.tsx` 的 `BrokenAccountsScreen` 已经证明这套 UI 有现成做法）。
- 修法（取舍写明）：新增 `src/lib/api-error.ts`（`describeHttpError(status, body)` 覆盖 400/401/403/409/413/500/503 与 `invalid/conflict/corrupt/need` 字段 → 一句中文 + `retryable` 标记），`nas-sync` 与各页统一调用；给出「空 catch 三条规则」（① 写盘失败必须 `logServer`；② 用户动作失败必须 toast 且带重试入口；③ 纯探测/清理可吞）并加一条守卫扫 `catch {}` 周边。**取舍**：多一层间接、要改 ~15 处调用点；收益是文案/401 语义/重试入口一次性统一 —— 若本轮只做「`errorComponent` + 401 文案」两小步，收益/成本比最高。

### C4 启动器与 `paths.server` 的目录清单重复

- 证据：`scripts/app-server-index.mjs:26-44` 硬编码 11 个影像子目录（`id/bank/ic/报量单/…/保险合同`，且是**历史全局目录**语义），与 `src/lib/paths.server.ts:66-89` 的 `DOC_CN`（8 类）+ `PHOTO_SUBS`（11 项）**内容重复、来源两份**；启动器还多建了 §11.1 定义为「只读回落」的全局目录（无害，但会让人误以为那是写入目标）。
- 影响：新增一类影像（如 `insured`）时改 `paths.server` 就够用（`ensureDirs()` 已在每个「数据目录 × 台账」首次调用时创建，`:90-115`），启动器那份清单**永远不需要**——留着只会误导。
- 修法：删掉启动器里的 `photos/*` 预建清单（保留 `data` 根与 `accounts/books/backups/templates`），或改为读一份 JSON（启动器自述「不依赖外部 npm 包」，所以不能直接 import TS）。**取舍**：删掉后首次启动不再「目录一眼看全」，但 `ensureDirs()` 覆盖同样的范围，认知成本更低。

### C5 文件体量排行与拆分建议

见下节（§4）。

---

## 4. 体量排行与「最该拆的 3 个文件」

**大盘**：`src/` 共 **24,707 行** TS/TSX（含生成物 `routeTree.gen.ts` 702 行，应排除）；分布 `src/lib` 10,250（其中 `excel/` 1,512、`update/` 1,223）、`src/routes` 7,722（32 文件）、`src/components` 6,306（31 文件，其中 `shell/` 1,010、`settings/` 966）、`src/components/ui` 82。**>500 行的文件 12 个，>700 行的 5 个，最大 874 行** ⇒ 单文件 1000 行的红线**目前没有破**（1.7.18/19 两轮拆分的成效是真的），但已有 4 个文件进入「红线邻近区」。

| 文件 | 行数 | 职责数 | 处置建议 |
|---|---|---|---|
| `src/components/contract-editor.tsx` | 874 | 5（合同基本信息 + 报量/开票/回单三本明细书 + 扫描件 + 三个共享小件） | **拆**（见 ①） |
| `src/lib/assets.server.ts` | 816 | 2 域（照片 / 文档）+ 1 共享（目录缓存） | **拆**（见 ②） |
| `src/routes/insurance.tsx` | 801 | 页面 + 弹窗外壳 + 3 个弹窗 | **拆**（见 ③，同时消掉 B4 的结构违规） |
| `src/lib/accounts.server.ts` | 777 | 4（口令与哈希 / 登录限速与会话 / 账户库读写 / 租户解析与鉴权 + 台账册成员）；`handleAuthPost` 单函数 **351 行**（`:363-713`） | 候补第 4 位：`auth-crypto.server.ts`（`:78-140`）+ `accounts-store.server.ts`（`:141-274`）+ `tenant.server.ts`（`:275-362`、`:714-777`），`accounts.server.ts` 保留 barrel 与 `handleAuthPost` 的 action 分发 |
| `src/routes/people.tsx` | 768 | 页面 + `PersonEditor`（`:356-690`，**335 行内嵌编辑弹窗**）+ `DateFill`/`Field` | 候补：按 §12.1 把 `PersonEditor` 搬到 `components/person-editor.tsx`（与 `expense-editor.tsx` 同款），页面降到 ~430 行 |
| `src/components/excel-import.tsx` 716 / `src/routes/expenses.tsx` 725 / `src/lib/store.ts` 701 | — | 单一职责（导入器 / 页面 / 状态机） | 不动：store 是「数据四层」的一层，拆它会牵动 §3 的四层同步约定 |

### ① `src/components/contract-editor.tsx`（874 → 主件 ~230 + 3 个文件）

| 行段 | 内容 | 去向 |
|---|---|---|
| `:47-274` | `ContractEditor` 主件（本地副本 + 同步 effect + 保存/校验） | 留 |
| `:275-326` | `Field` / `DocPick` / `useTakenNames` / `askEntryEdit` | `contract-editor-bits.tsx`（§12.1 的「共享小件」先例：`expense-bits.tsx`） |
| `:327-457` | `ReportBook`（报量） | `contract-report-book.tsx` |
| `:458-609` | `InvoiceBook`（开票） | `contract-invoice-book.tsx` |
| `:610-745` | `ReceiptBook`（回单） | `contract-receipt-book.tsx` |
| `:746-874` | `FileLink` / `EntryRows` / `contractScanName` / `ContractScanBox` | `contract-scan.tsx` |

**为什么是它**：三类明细书互不引用、各自 130–150 行，却要共用同一份 874 行文件；改「回单」要滚过「报量 + 开票」近 300 行，`git blame` 也无法区分。**拆法**：机械提取（函数体逐字不动）+ 保持 `props` 签名不变 + 原文件不动导出名（调用方零改动）。**注意**：`tests/receiver-and-editor-guards.test.ts` 按路径扫「本地副本重置 effect」，搬文件时同步改扫描路径（§12 末尾 + `guards-paths`）。

### ② `src/lib/assets.server.ts`（816 → 3 个 ~300 行 + barrel）

| 行段 | 内容 | 去向 |
|---|---|---|
| `:24-60` / `:75-111` | `safeName` / `compactName` / `photoNameWritable` / `isWritablePhotoDataUrl` / `docIdWritable`（写入前置判定，路由 400 用） | `assets-shared.server.ts` |
| `:113-168` | 目录列表缓存（`listDirCached` 等，照片与文档**都用**） | `assets-shared.server.ts`（或独立 `assets-cache.server.ts`，与 `tests/assets-cache.test.ts` 同名更好找） |
| `:169-472` | 照片：回落目录、匹配打分、`savePhoto` / `removePhoto` / `photoFlags` / `scanPhotoFolder` | `assets-photo.server.ts` |
| `:473-816` | 文档：`docsDir` / `saveDoc` / `removeDocFile` / `findDoc` / `adoptLegacyAssets` / `reconcileContractScans` | `assets-doc.server.ts` |
| — | 原文件保留 **barrel**（`export * from ...`） | `assets.server.ts` —— 保持 §12.2「`paths ← assets ← nas-fs`」方向不变，`nas-fs.server.ts:12` 与本轮所有守卫的扫描路径**零改动** |

**为什么是它**：`assets.server.ts` 是全库最大的服务端文件，816 行里塞了两个安全边界完全不同的域（照片按「姓名+标签」匹配、文档按「id+保留名」匹配），`安全工程师` 报告里的 B8（`replace=1` 不查保留名 → 覆盖他人指针）与 `CWE-284`（删照片连删共享回落目录同名件）**恰好都发生在「照片/文档两套规则混在同一文件、同一命名习惯」的区域** —— 拆开本身就降低了「把 A 域的判定套到 B 域」的概率。**拆法**：纯搬运 + barrel，不动逻辑；`isInsideBookAssets`（`:663-683`）是文档侧专用，留在文档模块。

### ③ `src/routes/insurance.tsx`（801 → 页面 ~430 + 3 个弹窗 + 1 个共享外壳）

- `:106-129` 本地 `Modal`/`ModalCancelButton` → **顺带上移为共享件** `src/components/modal.tsx`（6 处各写一遍的外壳先做「同一份」，再谈 aria/Esc 修复，前端 C2 的修法才只需改一处）；
- `:511-620` 保单弹窗 → `components/insurance-policy-editor.tsx`
- `:621-662` 被保人弹窗 → `components/insurance-member-editor.tsx`
- `:663-696` 替换人弹窗 → `components/insurance-replace-editor.tsx`
- **为什么是它**：它同时是「最大路由」「唯一自造弹窗外壳的路由」「违反 §12.3 '不许塞第二个弹窗' 的文件」，三个问题一次拆分一起解决；且保险结算是本项目口径最绕的模块（§4 保险结算口径 + `insurance-stats.ts` 的互挂同步），弹窗独立后「页面只留骨架 + 只导入口径函数」才真的成立。

---

## 5. 整本 JSON 快照：架构后果与「不落实体级存储」的过渡措施

**结论先行**：整本快照在**容量**上不是问题（实测线性外推，32MB 上限约等于 3,700 人规模，见 B1），真正的代价是三条 ——**写入放大**（每次改动整本 indent 重写，NAS 盘 +26.5% 字节）、**冲突粒度=整本**（两台设备改不同模块必然二选一，放弃方整本丢失）、**「读路径」与「写路径」耦合在同一份文件上**（`ensureDirs` 的首写、`reconcileContractScans` 的内存补名、`X-Ledger-Revision` 的口径，全都要么避开写盘要么解释为什么不算改动 —— 这三处历史上都出过缺陷：1.7.17 的读路径降载、1.8.0 的读路径不回写、本轮 Backend Architect 的 A2 假冲突）。

**过渡措施（不动磁盘格式，按成本从低到高；建议按序挑）**

1. **「内容没变就不 PUT」**（客户端，改动最小）：`nas-sync` 记住上次成功推送的 `sliceState` 序列化串，新的与它相同时直接 `dirty = false; return;`。**直接消灭**「改界面风格 / 改锁屏口令 → 整本 PUT」这类无效写（见下面 L2 的实测），也顺手缩小 409 面。取舍：多一次 `JSON.stringify`（1.7MB 量级 ~5ms，可接受；可只算「长度 + 少数关键字段」的弱指纹）。
2. **服务端「相同即短路」**：`writeLedgerNow` 在 CAS 通过后，若 `ledgerRevisionValue(cur) === ledgerRevisionOf(data)` 就直接返回 `"ok"`（不写盘、不 rename）。取舍：省一次 1.7MB 写；语义上「版本号不变」本来就等价，风险极低（**建议加一条单测锁住**）。
3. **compact 落盘**：`JSON.stringify(data)` 去掉 `null, 2`（`nas-fs.server.ts:97`）→ 磁盘占用 −21%，`readLedger` 的 `JSON.parse` 也更快。取舍：`ledger.json` 人眼可读性下降（调试时可用 `jq`）；**属于磁盘格式变更（虽然向后兼容）**，要按「先备份 + 可回滚」流程走。
4. **把「本册大小 / 最后保存时间」暴露到 `GET /api/health` 或设置页**：让用户与运维看得见增长趋势（当前只能 `ls -l`）。
5. **冲突解决提示按「模块」说明**：409 弹窗现在只说「已被其他设备修改」，可加一句「本机改的是：发放 3 条 / 考勤 1 月」—— 让「放弃本机」的代价变得可见（不给合并，只给信息）。**这一条最贴近用户吃亏点**（汇总 A2 的假冲突同样靠它减害）。
6. **影像归档**（见 B3）与**真正的实体级存储**（按实体拆分 + 索引 + 迁移/回滚方案）：**本轮明确不做**（AGENTS.md 已决策），本报告只把它记为「上述 1–5 的长期替代」。

**顺带记两条「整本快照」的边界，供未来专项参考**（不作为本轮条目）：① `year` 与 `accessHash` 都在快照里（`sliceState:64-77`），前者是**视图状态**（前端 B1 已报只读账号因 `year` 被置脏），后者是**本机门禁 hash**（安全工程师已报它被抬成管理员口令 hash 的风险）；实体级存储应当把「视图状态 / 本机偏好 / 业务数据」三者的**同步范围**分开定义。② `data/logs`、`data/backups` 与 `ledger.json` 寿命不同（日志 14 天 / 备份 30 份 / 台账永久），恢复流程要分别说明。

---

## 6. `store.ts` + `nas-sync.ts` 同步状态机：全景与判定

### 6.1 现状（我核过的状态与流转）

| 状态 | 位置 | 置位 | 清除 | 判定 |
|---|---|---|---|---|
| `dirty` | `nas-sync.ts:21` | `useApp.subscribe`（`:421-427`）里**任何** state 变化（`runMuted` / `applyingRemote` 期间除外） | `syncOk()`（`:214-220`）、409 选放弃、`dropLocalLedger` `:101`、pull 成功 | ⚠️ **语义过宽**（纯本机偏好也算「本机改动」，与前端 B1 同源；本报告补 L2 的写入放大实测） |
| `applyingRemote` / `runMuted` | 旧 `:19` 位置现下沉 `src/lib/sync-mute.ts` | `applyRemote()`（`:192-196`）包裹 `setAll` 期间 | 同上 | ✅ 正确，且已避免 store → nas-sync 反向 import（见 `sync-mute.ts` 注释） |
| `pullDepth` | `:19` | `pullNasLedger` 进入 / `finally` 退出 | — | ✅ 挡住了「拉取期间推送」，但**只挡推、不挡拉**（A1） |
| `pushQueue` | `:16` `:346` | 每次 `enqueuePush` 串联 | — | ✅ 串行正确（先到先写，旧快照不会覆盖新快照） |
| `ledgerRevision` | `:17` | GET / PUT / 409 后 `refreshRevision` | `dropLocalLedger` `:100` | ⚠️ 全局单值，与「当前是哪本册」没有绑定（A1 的放大器） |
| `pushFailed` | `:13` | `syncFailed()`（`:203-211`） | `syncOk()`（`:214-220`）、`dropLocalLedger` `:102` | ⚠️ 已有 `sync-status.ts` 横幅可见；但**切换路径不读它**（B2） |
| `pullGen`（**不存在**） | — | — | — | ❌ **A1** |
| `pullQueue`（**不存在**） | — | — | — | ❌ **A1（次级）** |

### 6.2 我另跑的两条实测（都指向「有效状态判定缺一层」）

**L1（A1 的复现）**：见 §1 A1。

**L2（`dirty` 过宽 → 无效整本写盘）**：脚本 `/tmp/repro-uistyle.mjs`（stub fetch，不连真实服务），输出：

```
开机后 PUT 次数： 0
改界面风格后 PUT 次数： 1 （body 与服务器内容字节相同，服务端仍会整本重写 ledger.json）
改锁屏口令后 PUT 次数： 2
```

改成 `apple` 风格（`useApp.setUiStyle`，**`sliceState` 里根本没有 `uiStyle`**，`nas-sync.ts:57-72`）也会触发一次整本 PUT：服务端 `readLedger` + sha256 + `stringify(indent)` + 写 1.7MB + `rename`。**修法**就是 §5 过渡措施 1（内容相同即跳过）—— 一行判断，收益是「无效写盘 / 无效 revision 变动 / 无效 409」一起消失。

### 6.3 判定

状态机的**推送侧**（串行 + 防抖 + CAS + 409 二选一 + 权限同口径）设计是成立的、也有测试；**拉取侧**（代际、互斥、失败可见）与**切换编排**（顺序、失败短路）是这一轮真正该补的两块 —— 也正好是 A1 与 B2。

---

## 7. 与其它专家报告的去重对照（本报告**不重复**已报条目）

| 已由他人报出 | 报告/编号 | 本报告的处理 |
|---|---|---|
| 缺 `If-Match` 时 CAS 被跳过（静默覆盖） | 服务端与存储层-Backend-Architect | **不重复报**，仅在 §5 措施 1/2 里作为「缩小冲突面」的依据引用 |
| PUT 响应头版本号与 GET/CAS 不同源（假冲突） | 汇总 A2（父会话已复核） | 引用为 B1「冲突粒度」的风险叠加项 |
| 租户解析静默回落 → 写错册子 | 汇总 A1 | 与 A1 区分：**服务端写入侧 vs 客户端在途 pull**，两种机制同一种后果 |
| 推送失败只提示一次、无「未同步」状态、401 说成网络 | 前端 B2 | **不重复**；且本轮已见 `src/lib/sync-status.ts` + 顶部横幅（`syncFailed/syncOk`）落地。本报告只补**尚未被覆盖的那半**：切换路径没有失败短路（B2） |
| `dirty` 因只读账号切 `year` 永久为真 | 前端 B1 | **不重复**；本报告用实测补「写入放大」这一面（§6.2 L2） |
| 删年度两条路径不一致（设置页备份 vs 侧栏 pull） | 前端 C6 | **不重复**；本报告补「设置页两个死导入」的证据 |
| 备份漏 `expenses` / 合同不在备份里 | 汇总 A13 | **不重复**；本报告只补下一环「影像不在口径内 + 恢复后无校验」（B3） |
| 影像 `replace=1` 覆盖他人指针、删照片连删共享件 | 汇总 B8 / 安全工程师 CWE-284 | **不重复**；B4/§4② 只把它们当作「照片/文档两套规则同文件」的证据 |
| `accessHash` 权限面 | 安全工程师 | 作为 §5 边界说明引用，不单列条目 |
| `[data-modal]` 守卫是死代码 | 前端 B3 | **不重复**；B5 报的是**另一个**新增文件的未接线状态（`unsaved.ts`） |

> 三位一体的「实体级存储 / 容器 root+docker.sock / `attendance.edit` 整本写 / 成员自建限 5 本 / A 组 4 项不补测」已决策项，本报告一条没报。

---

## 8. 若只改三处（我的排序：**风险 × 投入**）

1. **A1：给 pull 加代际 + 串行，并把切册收成 `switchBook()`**（~40 行改动 + 1 条 stub-fetch 回归用例）。理由：这是本轮唯一**已复现的跨台账数据污染**，而且改法小、可测（附录 A 的脚本可直接改成用例）；同时消掉 B2 的一半（编排收口）。
2. **A2：新增 `tests/structure-guards.test.ts`（禁环 + 三条主线方向 + 例外白名单）**，顺手做两个机械消环（合同三类型回 `types.ts`、`LedgerRead` 下沉叶子）。理由：**一次投入、永久防线**，直接保护 1.7.18/1.7.19 两轮重构的成果；成本是「1 个测试文件 + 2 处 `import type` 改向」，几乎零行为风险。（若时间只够一件事：**先加守卫、暂不消环**——把两个类型环写进白名单并留 TODO 也行，但别让红线继续无人看守。）
3. **B2 + B5：`flushPendingLedger()` 返回成败并在切换路径短路；确认 `unsaved.ts` 是否接线（未接线就接上考勤页并删掉页面本地 confirm）**。理由：两条都是「本机改动会丢」的同一类问题，用户侧后果比结构问题更早发生；改动面小（1 个返回值 + 4 个调用点 + 1 处接线）。

---

## 9. 局限与未覆盖

- **A1/L2 的复现是「逻辑级」**：脚本 stub 了 `fetch`（不连真实服务器），证明的是**模块级状态与无条件的 `applyRemote`** 会互相覆盖；时序是人为安排的（真实触发需要「pull 在飞 + 切册」重合，慢网下不罕见但非每次必现）。仓库外未做浏览器 E2E、未连真实 NAS。
- **未跑**：`pnpm run test:roundtrip`、`pnpm build`（本报告不涉及 Excel 与构建产物；`build` 会重写被提交的 `app/`）。**未测**：真实 NAS 磁盘上的写入延迟（B1 的 ms 值来自本机 SSD，NAS 机械盘会明显更差，方向不变）。
- **未覆盖**：`src/styles.css` 的打印协议实现细节（另有专项报告）、`win/` 与 Docker 交付链（Developer Tooling Engineer）、业务口径正确性（Code Reviewer / Backend Architect）。
- **工作区不干净的提醒**：本报告的模块图与行号取自同一时刻的工作区快照；若另一路正在改 `contract-editor.tsx` / `assets.server.ts` / `accounts.server.ts`，请以 `git diff` 复核行号后再动手。

---

## 附录 A：A1 复现脚本（`/tmp/repro-pull-race2.mjs`，可改写成回归用例）

```js
// node --import ./tests/register.mjs /tmp/repro-pull-race2.mjs   （在仓库根目录跑）
const R = process.cwd();
globalThis.window = { setTimeout, clearTimeout, confirm: () => true, dispatchEvent: () => true };
const mem = new Map();
globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const nas = await import(`${R}/src/lib/nas-sync.ts`);
const { setLivePerms } = await import(`${R}/src/lib/perms.ts`);
const { useApp } = await import(`${R}/src/lib/store.ts`);
const peopleOf = (tag, n) => Array.from({ length: n }, (_, i) => ({ id: `${tag}-${i}`, name: `${tag}人员${i}`, team: "", personNo: "", idCard: "", gender: "", age: null, birthday: "", phone: "", dailyWage: 0, monthWage: 0, payType: "day", otRule: "", mealAllowance: 0, wageHistory: [], bank: "", cardNo: "", address: "", idIssuer: "", idValidFrom: "", idValidTo: "", remark: "" }));
const payload = (tag, n) => ({ persist: true, schemaVersion: 2, year: 2026, years: [2026], people: peopleOf(tag, n), attendance: [], payments: [], contracts: [], contractEntries: [], expenses: [], insurancePolicies: [], insuranceMembers: [], accessHash: "" });
let putBodies = [], pending = [];
globalThis.fetch = (url, init) => {
  if (init && init.method === "PUT") { putBodies.push(decode(init)); return Promise.resolve(new Response('{"ok":true}', { status: 200, headers: { "x-ledger-revision": "rev-after-put" } })); }
  if (String(url).includes("/api/health")) return Promise.resolve(Response.json({ persist: true, ledgerGzip: true, backupKeep: 30 }));
  if (String(url).includes("/api/audit")) return Promise.resolve(Response.json({ ok: true }));
  return new Promise((resolve) => pending.push((p, rev) => resolve(new Response(JSON.stringify(p), { status: 200, headers: { "x-ledger-revision": rev } }))));
};
const take = (i) => { const f = pending[i]; pending.splice(i, 1); return f; };
const tick = () => new Promise((r) => setTimeout(r, 0));
setLivePerms(["*"]);
const boot = nas.startNasSync();                 // detectNas + 首次 pull(seed)
await tick(); take(0)(payload("A", 3), "revA"); await boot;
const slowPull = nas.pullNasLedger();            // 后台的一次拉取（响应慢）
await tick();
nas.dropLocalLedger("切换到台账 B");               // 用户切册
setLivePerms(["*"]);
const pullB = nas.pullNasLedger();
await tick(); take(pending.length - 1)(payload("B", 2), "revB"); await pullB;
take(0)(payload("A", 3), "revA");                 // 属于台账 A 的迟到响应此刻才落地
await slowPull;
console.log("内存 people =", useApp.getState().people.map((p) => p.name).join(","));   // A人员0,A人员1,A人员2 ← 污染
useApp.getState().upsertPerson({ name: "B台账新录入" });
await new Promise((r) => setTimeout(r, 900));
console.log("自动保存 PUT 的 people =", (putBodies.at(-1)?.people || []).map((p) => p.name).join(","));
```

（`decode(init)` 是 `gzipSync` 的逆：`init.headers["content-encoding"]` 含 `gzip` 时先 `gunzipSync(Buffer.from(init.body))` 再 `JSON.parse`。）

## 附录 C：空体 catch 计数（C3 的口径）

```python
# 逐个 catch 子句取函数体、去注释后判空
import os, re
empty = total = 0
for root, _, fs in os.walk('src'):
    for f in fs:
        if not f.endswith(('.ts', '.tsx')): continue
        s = open(os.path.join(root, f), encoding='utf-8').read()
        for m in re.finditer(r'catch\s*(\([^)]*\))?\s*\{', s):
            total += 1
            i, depth = m.end(), 1
            while i < len(s) and depth:
                depth += (s[i] == '{') - (s[i] == '}'); i += 1
            body = re.sub(r'//[^\n]*', '', re.sub(r'/\*.*?\*/', '', s[m.end():i-1], flags=re.S))
            if not body.strip(): empty += 1
print(total, empty)     # → 152 50
```

## 附录 B：依赖环检测（本报告用的方法）

```python
# python3 /tmp/dep.py  → 输出 src/** 的 import 图强连通分量（即环）
import os, re, sys
from collections import defaultdict
files = [os.path.join(r, f) for r, _, fs in os.walk('src') for f in fs
         if f.endswith(('.ts', '.tsx')) and 'routeTree.gen' not in f]
rt = re.compile(r"^\s*(?:import|export)\s*([^'\"]*?)\s*from\s*['\"]([^'\"]+)['\"]", re.M)  # 含 import type
def resolve(src, spec):
    if not spec.startswith('.'): return None
    base = os.path.normpath(os.path.join(os.path.dirname(src), spec))
    for c in (base + '.ts', base + '.tsx', base + '/index.ts', base + '/index.tsx'):
        if os.path.exists(c): return c
edges = defaultdict(set)
for f in files:
    for _, spec in rt.findall(open(f, encoding='utf-8').read()):
        t = resolve(f, spec)
        if t: edges[f].add(t)
# 想看「只算运行期值导入」的图：把上面正则的 ([^'\"]*?) 改成 (?!type\b)([^'\"]*?)
# 然后跑 Tarjan/朴素 SCC；本报告两版结果都列在 §1 A2。
```

**本报告的三个环可单独用 rg 逐条核**：

```bash
rg -n '^import' src/lib/types.ts src/lib/contracts.ts src/lib/wage.ts          # types→contracts、contracts→wage、wage→types
rg -n 'reconcileContractScans' src/lib/nas-fs.server.ts src/lib/assets.server.ts
rg -n 'from "\./(log|docker)"' src/lib/update/docker.ts src/lib/update/log.ts
```

---

## 处理状态（工作包 G，2026-09-17）

**A2（§12 结构红线没有机械守卫 + 3 个 import 环）/ 已修**

- 新增 `tests/structure-guards.test.ts`（7 条）+ 扫描器 `tests/import-graph.ts`（唯一实现，IEEE 稳定输出）：
  ① 禁新环（白名单**只有** §12.3 允许的 `update/docker ↔ update/log`，且要求白名单每条写明原因 + 那两个文件的注释里
  真有这段说明）；② 三条主线方向（`paths.server ← assets.server ← nas-fs.server`、`excel/common ← 实体 ← full`、
  `lib ← components/routes`）；③ `types.ts` 必须是叶子、`contracts.ts` 不许再定义合同三型。
  自带坏样本自检（多行 import / 注释里的 `from` / 动态 import 三个对照 + 合成环必须被识别）。
- 机械消环（纯 refactor，零行为变化）：`ContractRecord / EntryKind / ContractEntry` 下沉到叶子 `types.ts`
  （`contracts.ts` 仍再导出，调用点不变）；`LedgerRead` 下沉到 `types.ts`（`assets.server.ts` 改从这个叶子拿，
  §12.2「影像层不 import 台账存储」由字面成立）；`update/log ↔ update/docker` 按 §12.3 在两份文件头部写明互引原因。
- 现状：`src/` 的环只剩白名单那一条（值环与含类型环的图都是），`pnpm test` 全绿。

**A15（在途 pull 覆盖新册）/ 已修**

- `src/lib/nas-sync.ts`：拉取侧补上与推送对称的两道保护 —— **代际号 `pullGen`**（每次拉取、每次作废都 +1，
  响应回来代际对不上就**整包丢弃**：不写 store、不写本机缓存、不弹提示）与**串行队列 `pullQueue`**；
  `invalidateInFlightPulls()` 顺手中断在途请求；`dropLocalLedger()` 现在也会作废在途拉取（换账号/退出登录同样受益）。
- 切册顺序收成唯一入口 `switchBook()` / `createBookAndEnter()` / `deleteBook()`（都在 `nas-sync.ts`）：
  flush → 调服务器 → 作废在途 → 记缓存归属 → 清本机 → 拉目标册；左侧下拉、设置页「进入/新建/删除」四个调用点
  只负责界面（提示 + 广播），不再各自抄一遍顺序。顺带修掉：`useBook` 失败原来在左侧下拉是 unhandledrejection（无提示）。
- 新踩到并一并修掉的自锁：串行队列 + **嵌套拉取**（seed 拉取 → 空台账 → 推送撞 409 → 用户选「放弃本机」→ 再拉）
  会「排在自己后面」永久挂住 —— 现在 `awaitingSeedPush` 窗口内放行不入队（窗口外仍严格串行）。
- `tests/pull-generation.test.ts`（8 条，stub fetch、不连服务器）：迟到响应不覆盖新册（内存 + 本机 localStorage
  + 整本 PUT 三者都断言）、新册拉取失败时旧册数据也不许画回屏幕、拉取串行（后一次必须等前一次落地）、
  嵌套拉取不自锁，以及「切册/新建/删除只能走唯一入口」的静态守卫。
  **变异测试**证明这几条抓得住回归：关掉代际判断 → U3 红；去掉串行队列 → U2 红；去掉嵌套放行 → U6 红（三条都实测过）。

**B18（`flushPendingLedger()` 结果没人读）/ 已修**

- `flushPendingLedger()` 返回 `{ status: "ok" } | { status: "skipped"; reason } | { status: "failed"; reason }`
  （判据用 `dirty`，与「覆盖本机之前先问一声」同源；失败原因取横幅那份状态，不再有写进去没人读的布尔）。
- 读结果并**失败即中止**的调用点：`switchBook`/`createBookAndEnter`/`deleteBook`（失败时把原因写进确认框，
  「取消＝留在当前台账，先把改动保存成功再切」）与 `year-switcher.tsx` 的删除年度
  （原来那里是 `pullNasLedger()` —— **先覆盖本机**，等于把没保存的改动丢掉；现在改 flush + 读结果）。
- `src/routes/settings.tsx` 清掉 `pullNasLedger/flushPendingLedger` 两个死导入（本报告 B2 末尾那条证据）。
- 回归：`tests/pull-generation.test.ts` 的 U4/U5 两条（推不上去 → 被拦下 + 提示原因 + 本机改动保留 + 不发 `useBook`；
  推得上去 → 顺序是「先 flush 再 useBook」）。

**本轮未动（按工作包排除项）**：B1 实体级存储、B3 备份不含影像、B4 保险页拆分、C1/C3 其余部分 —— 仍留后续专轮。
本报告 A2 里提到的「shell/nav 不许被反向依赖」只覆盖了 `lib ← components/routes` 这一条（其余方向未见违反，
未加断言以避免把正常写法写死）。
