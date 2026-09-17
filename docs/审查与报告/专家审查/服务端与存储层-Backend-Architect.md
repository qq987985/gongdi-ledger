# 专家审查 · 服务端与存储层（Backend Architect）

- 审查范围：`src/routes/api/*`（auth / ledger / year / audit / file / doc / photo / photo-file / photo-scan / photo-adopt / photo-flags / backup / health / images / update / update-log / version）、`src/lib/*.server.ts`（accounts / nas-fs / assets / paths / log / ledger-schema / ledger-transfer）、`src/lib/update/*`、`scripts/app-server-index.mjs`。
- 关注点：鉴权与租户隔离、请求体解析与 4xx/5xx 边界、原子写、CAS 版本口径、zod 校验、gzip 与解压炸弹上限、日志与审计可靠性、上传/下载/备份/导出与失败回滚、一键更新链路失败模式、备份保留与磁盘占用。
- 基线：`VERSION.txt` = **1.8.13**（`git status` 干净，未改任何代码/配置；**全程未读写仓库内 `data/`**）。
- 方法：①静态走查（file:line）；②**用仓库里已有的构建产物 `app/server/index.mjs`（1.8.13）在 `/tmp` 起真实服务**（`DATA_DIR=/tmp/glprobe/data`），用 curl 逐条复现。所有「实测」条目都可按附录步骤重跑。
- 去重说明：本目录《安全工程师.md》已报的 F-01（未鉴权即缓冲请求体）/F-02/F-03/F-08/F-11/F-12 等，**本报告不重复列为本轮必修**，只在相关条目里标注「同一根因，见安全组报告」。

---

## 一、结论摘要（按影响排序的 5 条必修）

| # | 结论 | 级别 | 影响 | 建议 |
|---|---|---|---|---|
| 1 | **台账上下文会「静默回落」到另一本台账**：请求指定的台账不可访问时，服务端不报错，改用该用户的第一本可访问台账，**读和写都落到那本**（实测：cookie 指着 copy1，写入落进了 default 的 `ledger.json`） | A | 整本台账被写到错误的册子上 → 数据完整性事故；界面还显示着旧册名 | 本轮修（几行） |
| 2 | **PUT /api/ledger 返回的版本号不能用作下一次 CAS 基准**（服务端用「请求体」算，GET/CAS 用「内存视图」算；`reconcileContractScans` 会往视图里补字段）→ 客户端每次保存都收到「台账已被其他设备修改」，若用户点「以本机覆盖」就会把别的设备的真实改动整本覆盖掉 | A | 误报冲突 + 诱导性覆盖 → 真实数据丢失；违背 AGENTS「版本号口径必须同源」硬约束 | 本轮修 |
| 3 | **审计「坏文件」标志是跨台账的全局量且不复位**：甲台账 audit.json 损坏后，**没有 audit.json 的乙台账**健康也读不出来 → `/api/audit` POST 对乙返回 503「已拒绝写入以免覆盖历史」，导出留痕（`appendAudit`）被静默丢弃而导出仍回 200 | A | 操作记录静默缺失（不可否认性/合规）+ 假报错 | 本轮修 |
| 4 | **`/api/doc` 文件名未做保留名校验**：`replace=1` + 文件名 `<别人的 id>.name.txt` 可覆盖另一条记录的指针 → 该单据影像变成 404、文件变孤儿且永不被清扫（实测复现） | B | 单据影像「打不开」（用户视角=丢失） | 本轮修 |
| 5 | **启动器 `SLOW_MS` 默认值形同虚设**：未设置时解析成 `0`，于是**每个请求都写一条 `慢请求` warn 到 `data/logs`**（实测 38 条 1–48ms 的「慢请求」；启动日志 `slowMs:0`） | B | 慢请求/5xx 观测被噪声淹没 + 每请求一次 fs 追加/滚动，磁盘与 IO 白费 | 本轮修（一行） |

> 另一条同样重要但已由安全组登记的：**写接口在鉴权前缓冲整个请求体**（实测未登录上传 40MB → 先吃满再回 `401 {"error":"login"}`），见《安全工程师.md》F-01，本报告不再重复列为必修（见 §3.5 备注）。

---

## 二、A 级：确认缺陷

### A-1 台账上下文静默回落 → 读/写落到另一本台账

**证据（代码）**

- `src/lib/accounts.server.ts:301` `const bookId = request.headers.get("x-book") || c.gongdi_b || "default";`
- `src/lib/accounts.server.ts:305` `const book = mine.find((b) => b.id === bookId) || mine[0] || null;` ← **`|| mine[0]` 是根因**：请求的台账不在 `booksOf(user)` 里时，不报错，改用「该用户的第一本可访问台账」。
- 之后 `withTenant` 用它执行：`src/lib/accounts.server.ts:772` `return runWithBook(t.bookId, () => fn(t));`，`t.bookId` 就来自上面的回落值。

**复现（实测，完整命令见附录 A）**

```
准备：default 的 people=[DEFAULT-人]，copy1 的 people=[COPY1-人]
m1 同时是 default / copy1 的成员 → 登录 → useBook copy1 → cookie: gongdi_b=copy1
① m1 读台账          → {"people":[{"name":"COPY1-人"}]}          ← 正确
② 管理员 removeMember(copy1, m1)
③ m1 拿同一个 cookie 再读 → 200 {"people":[{"name":"DEFAULT-人"}]}   ← 静默换成 default，无任何提示
④ m1 带步骤③的版本号 PUT（body 是它以为的 copy1 数据，year=2031）
     → {"ok":true} HTTP:200
   cat data/books/default/ledger.json → year=2031 people=[{"name":"M1以为的COPY1"}]   ← 写进了 default
   cat data/books/copy1/ledger.json  → year=2026（未变）
```

**影响面**

- 客户端的本机缓存归属键是 `userId::bookId`（`src/lib/nas-sync.ts:107-127`），cookie/cookie 里的册子与界面显示的册名都不变，用户**看不出**自己正在看/写另一本台账。
- 触发场景真实：成员被移出某册、某册被删、`members` 被改（A 组报告第 22 项之后成员自建台账更常见）。被移出后客户端的 HttpOnly cookie 不会自动刷新，直到重新登录/切换册子。
- 后果分两类：①**看**到另一本册的人员/工资数字（本人有权，不属越权泄露，但界面在骗人）；②**写**：整本 PUT 会把「以为在编辑的甲册」的数据覆盖进乙册（实测④；权限足够的账号一次自动保存就能做到）。

**修法建议（本轮）**

```ts
// accounts.server.ts:305 附近
const requested = bookId;
const book = mine.find((b) => b.id === requested) || (requested === "default" ? mine[0] ?? null : null);
```
即：**只有「完全没指定册子」时才允许取第一本**；显式指定（header/cookie）却不可访问，就让 `t.bookId` 为空 → `withTenant` 已有的分支会回 `403 {noBook:true}`（`accounts.server.ts:757`），客户端拿到 401/403 会走 `dropLocalLedger()` 清缓存并提示，**不会**再写错册子。
另外建议把这条口径写成守卫测试（`tests/accounts-server.test.ts`）：`请求册子不可访问 → withTenant 必须 403，且不得改动其它册子的 ledger.json`。

---

### A-2 PUT /api/ledger 的版本号口径与 GET/CAS 不同源 → 误报冲突，且诱导用户覆盖掉别人的改动

**证据（代码）**

- 服务端**写盘后返回的版本号取自请求体**：`src/routes/api/ledger.ts:149`
  `response.headers.set("X-Ledger-Revision", ledgerRevisionValue(body));`
- GET 与 CAS 基准都取自**读出来的内存视图**：`ledger.ts:67`（GET 头）、`nas-fs.server.ts:92`（CAS 比较）、`nas-fs.server.ts:72-74`（`ledgerRevisionValue`）。
- 而内存视图会被 `reconcileContractScans` **改动**：`src/lib/assets.server.ts:773-816`，第 811 行 `c.scanFileName = found;`；调用点 `src/lib/nas-fs.server.ts:59`（每次 `readLedger()` 都跑）。该函数只改内存、不回写（这是刻意的，`tests/ledger-server.test.ts:46` B1 用例把它钉住了）。
- 客户端**会把 PUT 响应头当成下一次的 CAS 基准**：`src/lib/nas-sync.ts:284` 与 `:295` `ledgerRevision = r.headers.get("x-ledger-revision") || ledgerRevision;`。

**复现（实测，见附录 A）**

```
前提：磁盘上存在匹配的扫描件（photos/default/合同扫描件/甲项目-合同电子版.pdf），而台账里该合同的 scanFileName 为空
PUT#1 body（contracts:[{id:"c1",name:"甲项目"}]）  → 200  x-ledger-revision: 3bdcfcb5…（= hash(body)）
GET                                             → contracts[0].scanFileName="甲项目-合同电子版.pdf"
                                                  x-ledger-revision: 36399c96…（= hash(视图)，与上面不同）
PUT#2 用服务端自己刚返回的 3bdcfcb5… 当 if-match  → 409 {"error":"台账已被其他设备修改，请重新加载后再保存"}
PUT#2 用 GET 的 36399c96… 当 if-match            → 200
```

**为什么这不是纸面推理**：只要「磁盘上有某合同的扫描件、客户端 body 里该合同 `scanFileName` 为空」，该客户端的基准版本号就**永久**是错的（写盘内容仍无 `scanFileName`，下一次读又补上）。这条完全覆盖文档化的两种用法：
① 把扫描件按 `项目名称-合同电子版.pdf` 放进影像目录（`assets.server.ts:802-806` 的名字回落规则就是认这个形状）；
② Excel 导入合同（`src/lib/excel/contracts.ts:111` 的 `scanFileName` 取自「合同扫描件」列，通常为空）。

**影响链（为什么算 A）**

1. 每次保存都撞 409 → `nas-sync.ts:264-290` 弹 `window.confirm("服务器上的台账已被其他设备修改…确定：用本机数据覆盖服务器")`；
2. 该提示在**没有真实冲突**时也出现，而用户点「确定」= 用本机 body 覆盖服务器当前内容 → **把别的设备在这个窗口里的真实改动整本抹掉**；
3. 点「取消」则丢弃本机改动重新拉取（用户的劳动白做）。
即：一个假的冲突提示把用户推向「覆盖」按钮 → 真实数据丢失。这也直接违背 AGENTS「台账同步三条硬约束 #1：版本号口径必须同源（GET 头与 PUT CAS 基准都走 `ledgerRevisionValue()`）」。

**修法建议（本轮，二选一）**

- **方案 A（推荐，最小且口径最硬）**：版本号一律基于**磁盘字节**。新增 `ledgerRevisionOfFile()`（`sha256(readFile(ledgerPath))`，空台账仍用 `""` 哨兵），`ledgerRevisionValue()` 的 GET 头、`ledgerRevisionOf()` 的 CAS 比较、以及 `ledger.ts:149` 的 PUT 响应头全部改走它。因为写盘写的就是 `JSON.stringify(body, null, 2)`，PUT 返回头必然等于下一次 GET 头；`reconcileContractScans` 彻底退出「版本号口径」（它只是显示视图）。需同步更新 `tests/ledger-server.test.ts` 里 `ledgerRevisionValue(await readLedger())` 的用法。
- **方案 B（改动更小）**：`ledger.ts:149` 改成写盘后重新读一遍再算：`ledgerRevisionValue(await readLedger())`（多一次读 + 一次哈希）。

**守卫测试建议（固化成不变量）**：`PUT 返回的 X-Ledger-Revision === 紧接着 GET 返回的 X-Ledger-Revision`，且「磁盘上有扫描件、body 无 scanFileName」这一 fixture 下 `PUT(if-match: 上一次 PUT 的头)` 必须 200。

---

### A-3 审计「坏文件」标志跨台账泄漏：健康的台账被误报损坏、留痕被静默丢弃

**证据（代码）**

- `src/lib/nas-fs.server.ts:140` `let auditBroken = false;` ← **模块级全局，不区分台账**。
- `readAudit()` 只在「文件存在且解析成功」分支里复位：`nas-fs.server.ts:151-160`（成功 → `auditBroken = false`）与 `:156-159`（失败 → `true`）。**「文件不存在」分支（`:163-173`）不复位**，直接 `return []`，于是**继承上一本台账留下的 `true`**。
- 拒写分支：`nas-fs.server.ts:195-208`（`if (auditBroken) { 只记日志、不写盘、返回条目 }`）。
- 路由侧的 503：`src/routes/api/audit.ts:30-35`（`await readAudit(); if (auditUnreadable()) → 503`）。
- 而**其它**调用 `appendAudit` 的写路径没有这层判断，例如导出留痕 `src/routes/api/file/$kind.ts:198-211`。

**复现（实测，见附录 A）**

```
default/audit.json 写入 "broken{"（模拟损坏/手工改坏）
GET /api/audit (x-book: default)      → 200 {"entries":[]}          ← 顺带把全局 auditBroken 置 true
POST /api/audit (x-book: copy1，copy1 根本没有 audit.json)
   → 503 {"error":"操作记录文件读取失败，已拒绝写入以免覆盖历史。请从 data/backups 恢复该文件。","corrupt":true}
     ← copy1 完全健康，却被告知文件损坏、要去恢复备份
GET /api/file/people-export (x-book: copy1)
   → 200，6823 字节（文件正常导出）；日志里却出现：
     {"event":"操作记录写入被拒：文件读不出来","path":"…/books/copy1/audit.json"}   ← 留痕被丢，且日志指向的是被冤枉的那本
ls data/books/copy1/   → 只有 book.json / ledger.json（确认没写）
把 default/audit.json 修成 {"entries":[]} 再 GET 一次后，同样的 POST/导出立刻恢复正常（copy1 出现 audit.json）
```

**影响面**

- 操作记录**静默缺失**：导出、账户操作等留痕在这个状态下全部丢失（调用方只看到 200）。1.8.7 专门做的「导出必须 `appendAudit`」在这条路径上失效（`tests/export-audit.test.ts` 覆盖的是正常路径）。
- 跨台账耦合：甲册文件损坏 → 乙册（尤其是**新建/恢复上来、尚无 audit.json 的册子**）被拒写并显示错误提示；日志里的 path 还指向乙册，误导排查。
- 触发「文件不存在」+「别处有坏文件」两个条件。前者在恢复/迁移场景常见（只恢复 `ledger.json`、从快照拷目录、手工建册目录后由 `recoverBooksFromDisk()` 登记，`accounts.server.ts:246-273`）；后者是任何一次手工编辑/半截拷贝。
- 附带的并发面：`auditBroken` 是模块级可变量，多册请求交错时读写该标志本身存在竞态（`readAudit` 与 `appendAudit` 之间）。

**修法建议（本轮）**

1. `readAudit()` 开头就 `auditBroken = false;`（与 `readFileShape()` 的写法对齐，`accounts.server.ts:153`）。
2. 更好：把标志改成按路径的记录 `const auditBroken = new Set<string>()`，`auditUnreadable(bookId?)` 只回答「当前台账」是否坏；避免任何跨台账语义。
3. 顺带把 `appendAudit` 的「拒写」结果**显式化**（返回 `{entry, persisted:false}` 或抛出一个可识别错误），让调用方能决定是否告知用户——现在它返回的条目 `id` 是空串（`nas-fs.server.ts:199-207`），调用方无从分辨「写成功」与「没写」。
4. 守卫测试：`甲册 audit.json 损坏 → 乙册（无 audit.json）POST /api/audit 必须 200 且落盘`。

---

## 三、B 级：风险 / 隐患（含推理链）

### B-1 `/api/doc` 上传文件名未校验保留名 → 可覆盖别的记录的指针

**证据**：`src/lib/assets.server.ts:592` `let orig = (fileName || \`file${ext}\`).replace(/[\\/]/g, "");` —— 只去斜杠，不校验 `.name.txt` 形状/`.`/`..`；`:596` `if (!opts.replace) orig = uniqueFileName(...)` 说明**默认路径有防重名保护，`replace=1` 时没有**；`:600-613` 直接把 `join(dir, orig)` 当写入目标（合同/报销/打款三类走「指针 + 原文件名」）。
路由侧只拦了长度：`src/routes/api/doc.ts:83-85`。

**复现（实测，见附录 A）**

```
① PUT /api/doc {id:AAA,kind:contract,file:甲合同.pdf}          → 200，生成 合同扫描件/AAA.name.txt="甲合同.pdf"
② PUT /api/doc {id:ZZZ,kind:contract,replace=1,file:AAA.name.txt} → 200
   cat 合同扫描件/AAA.name.txt → "ZZZZ"（被覆盖）
③ GET /api/doc?id=AAA&kind=contract  → 404   ← AAA 的合同影像打不开了
   ls 合同扫描件/甲合同.pdf → 仍在（7 字节）→ 孤儿文件，且 sweepDocFiles 再也算不出它的名字，不会被清理
```
（同一次上传若不带 `replace=1`，`uniqueFileName` 会改名成 `AAA.name-2.txt`，不会覆盖——所以这是「`replace` 路径缺校验」而非普遍问题。）

**影响面**：单据影像「消失」（不可打开、无入口恢复），需人工在 NAS 上按文件名找回。触发需要构造性的文件名（正常客户端生成的名字不会长这样），且需要 `contracts.edit`/`expenses.edit`/`attendance.edit` 之类的编辑权限 → **不跨租户、不是提权**，属输入校验缺口。也解释了一个现象：这是「0 字节/超长文件名都拦了，但没拦保留名」的对称缺口。

**修法建议（本轮）**：在 `saveDoc` 或路由里拒掉 `orig` 命中 `/^\..*/` 或以 `.name.txt` 结尾的名字（`return ""`/400），并把指针文件挪到子目录（如 `.pointers/<sid>.name.txt`）以根治同名冲突；错误信息保持可读（「文件名不能以点开头/不能使用 .name.txt」）。

### B-2 启动器 `SLOW_MS` 默认值失效 → 每个请求都记「慢请求」

**证据**：`scripts/app-server-index.mjs:164-167`

```js
/** SLOW_MS：请求耗时达到该毫秒数就记「慢请求」（默认 2000） */
const SLOW_MS = (() => {
  const n = Number(String(process.env.SLOW_MS ?? "").trim());   // 未设置 → Number("") = 0
  return Number.isFinite(n) && n >= 0 ? n : 2000;               // 0 >= 0 → 取 0
```
写日志处 `:274` `else if (ms >= SLOW_MS) logLine("warn", "慢请求", …)`；启动横幅 `:402` 也把 `slowMs: SLOW_MS` 打出来。
`SLOW_MS` 在 `docker-compose*.yml`、`Dockerfile`、`一键部署.sh`、`一键拉取.sh`、`ci/` 中**从未设置**（`grep -rn SLOW_MS` 只命中 `VERSION.txt` 与两份文档）。

**复现（实测）**：`DATA_DIR=/tmp/glprobe/data node app/server/index.mjs` 后随便调几个接口：

```
grep -c '"event":"慢请求"' data/logs/2026-09-17.log  → 38
"event":"慢请求","method":"GET","path":"/api/ledger","status":200,"ms":2
"event":"慢请求","method":"PUT","path":"/api/ledger","status":409,"ms":2
"event":"服务启动",…,"slowMs":0,"logLevel":"info"}
```
每一条的阈值是 0ms，所以**每一个请求**都会命中。

**影响面**：①「慢请求」这个告警位失效（真正的慢请求被 2ms 的噪声埋掉，`SLOW_MS` 想做的事没做成）；②每个请求多一次 `appendFileSync` + 每日 8MB 上限更早触发滚动（`logState.capped`/`.log.N`），无谓磁盘写与 IO；③排查现场时 `data/logs` 里 99% 是这类无用行。

**修法建议（本轮，一行）**：`const n = Number(String(process.env.SLOW_MS ?? "").trim()); return Number.isFinite(n) && n >= 0 ? n : 2000;` → 改成「空串/非法值走 2000，只有显式给了数字才采用（显式 0 = 关闭）」：
```js
const raw = String(process.env.SLOW_MS ?? "").trim();
const n = raw === "" ? Number.NaN : Number(raw);
return Number.isFinite(n) && n >= 0 ? n : 2000;
```
并加一条守卫（`tests/log-server.test.ts` 或新的启动器用例），照 `tests/update-script.test.ts` 的做法直接 `new Function` 解析启动器里的这段逻辑。

### B-3 版本号口径的其余不一致点（同一根因的边角）

1. **缺 `If-Match` 时 CAS 被完全跳过**：`ledger.ts:138-139` `const expected = request.headers.get("if-match"); … expected === null ? undefined : expected`，`nas-fs.server.ts:92` 只在 `expectedRevision !== undefined` 时比对 → 不带头 = 无声 last-write-wins 覆盖整本台账。客户端总会带（`nas-sync.ts:199`），但对第三方/老客户端就是个静默覆盖口子。建议：**缺失时返回 428/400**（或至少记一条 warn），并明确写进规范。（取舍：可能与历史客户端不兼容，需一次公告。）
2. `/api/year` 的 CAS 是「读—改—写」两段（`year.ts:24-36`）：读时拿版本号，写时再比一次，逻辑正确，但中间若有别的写成功它会 409 并只给「请重新打开页面后再试」——可接受。
3. `ledgerRevisionOf` 依赖 `JSON.parse` 后的键序（`nas-fs.server.ts:63-65`）：同内容不同键序 = 不同版本号。只在「别处生成了同一份数据」时才会遇到，属可接受取舍，但若采用 A-2 的方案 A（按磁盘字节哈希）这条自然消失。

### B-4 一键更新链路：重建容器的配置复制不完整（含一个真实副作用）

**证据**：`src/lib/update/apply.ts:92-113` 手工挑字段构造 `create`：

```ts
const binds = [...(me.HostConfig?.Binds || [])];
if (!binds.some((b) => String(b).includes("docker.sock"))) binds.push(`${SOCK}:${SOCK}`);   // ← 第 93 行
const hostConfig = { ...me.HostConfig, Binds: binds }; delete hostConfig.Mounts;
const create = { Image, Env, Labels, ExposedPorts, WorkingDir, Cmd, Entrypoint, HostConfig, NetworkingConfig };
```
- `Config` 里的 `User` / `Healthcheck` / `Volumes` / `StopSignal` / `StopTimeout` / `Hostname` **都没有透传** → 如果部署方在 compose 里写了 `user: 1000:1000`（AGENTS「已决策」提到非 root 是待排期项，这是最可能的落地方式），**应用内更新一次就会把容器还原成 root 运行**，随后写进 `data/` 的文件属主变 root，非 root 部署立刻出权限问题。标准 `docker-compose.yml`（已核对：没有 `user:`/`healthcheck:`/`stop_signal:`/`cap_add:`）不受影响。
- `:93` 会在旧容器**没有** docker.sock 挂载、但 sock 在别的容器路径可见时，给新容器补一个 `/var/run/docker.sock:/var/run/docker.sock` 挂载。只有在 `hasDockerSock()` 为真（`version.ts:63-70` 只检查 `/var/run/docker.sock` 可读）时才会走到这里，所以实际影响小，但语义上「更新会把用户去掉的挂载加回来」，与 docs「删掉挂载即合规升级」的取向有张力。

**修法建议（留待后续，属一处小改）**：`create` 直接透传需要保留的 `Config` 字段（至少 `User`/`Healthcheck`/`StopSignal`/`Volumes`），或明确写进文档「网页更新会把容器以 root 重建；非 root 部署请走脚本升级」。建议顺手加断言：重建后的 `create.Config.User === me.Config.User`。

### B-5 磁盘占用/保留策略的边界（风险，非当前缺陷）

- **日志**：`LOG_MAX_MB`（默认 8）触发的是**滚动**（`log.server.ts:238-269`，`nextRotationName` 上限 999），所以单日理论上限 ≈ 8MB × 999 ≈ **8GB**（`MAX_ROTATION_INDEX`，`log.server.ts:143`）；保留期只按天（`LOG_KEEP_DAYS`），没有「目录总大小」上限。配合 B-2 的噪声，长期运行需要留意 NAS 剩余空间。建议：滚动时同时按「目录总大小」封顶（例如 `LOG_DIR_MAX_MB`，超了删最老的 `.log.N`）。
- **备份**：保留策略只在 `saveBackup()` 里跑（`nas-fs.server.ts:291`），`data/backups` 里非本程序命名形状的文件一个都不动（这是刻意的，见 `isManagedBackupFile` 注释）→ 用户自己的对账表长期堆着不会被清，属可接受取舍，但「保留份数」不代表「磁盘上限」，建议在设置页把实际占用显示出来（把 `BACKUP_KEEP` 的提示从「份数」扩展到「份数 + 当前目录大小」）。
- **`data/logs/update.log`**：刻意不受保留策略管辖（`PROTECTED_LOG_FILES`），永不清理；每次更新只写十来行，风险可忽略，但建议在文档里点明「它只增不减」。

---

## 四、C 级：改进建议（含取舍）

1. **原子写没有 fsync**（`paths.server.ts:238-247` 的 `atomicWriteFile`、`nas-fs.server.ts:95-98` 的台账写入）：`writeFile` → `rename` 之间不 `fsync` 文件，也不 `fsync` 目录。进程崩溃安全（rename 原子），但**NAS 掉电/强拔**时可能留下 0 字节或旧内容（尤其在部分 NAS/ext4 `data=writeback` 或 NFS 挂载下）。建议给台账/账户库这两处加 `fd.sync()` 后再 rename（成本：每次保存多一次 fsync，HDD 上约数 ms）。属明确取舍，需用户拍板。
2. **`gzipSync` 在请求线程里同步压缩**（`ledger.ts:41`）：实测高度重复数据 1.45MB → 2.4ms、8MB → 11ms、32MB → 43.5ms；真实台账熵更高，按 3–5 倍估约 10–30ms/次（默认上限 32MB 时最坏几百 ms）。当前规模下**不必改**，量级已量化；若将来台账再大，改用异步 `gzip` 或加「按 revision 缓存压缩结果」。
3. **`/api/health`、`/api/version` 无鉴权**（`health.ts`、`version.ts`）：分别暴露 `persist/ledgerGzip/backupKeep` 与版本历史，信息量很小；若做安全加固顺手加个 `persistOn() && !user → 401` 也无妨（不影响客户端：这两处都在登录前后都可能被调用，改前需确认调用点）。
4. **审计条目本质是「客户端自述」**：`POST /api/audit` 的 `action/detail/module` 由客户端提供（只在服务端截断长度，`audit.ts:40-43`），服务端只强制补 `userId/时间`。关键动作（导出）1.8.7 已在服务端补记，但「谁删了人员/谁改了工资」这类仍可能被客户端漏报或改写措辞。取舍：全量服务端审计需要把每个业务动作搬到服务端（架构级改动，同「实体级存储」量级）；建议至少把**删除类**动作补成服务端留痕。与《安全工程师.md》F-03 同一议题，此处只给取舍判断。
5. **备份写入的失败模式**：`saveBackup`（`nas-fs.server.ts:288-289`）先写时间戳文件、再写固定名「最新备份」；若第二步失败，接口仍回 `{ok:true, path}`，而「最新备份」还是上一份。建议第二步失败时也回 200 但带 `warning`，或把固定名文件放在最后一步并允许重试（现状不会写坏文件，只是「最新」指针可能滞后）。
6. **大文件全量驻留内存**：`/api/doc` GET 整份 `readFile` 返回（`assets.server.ts:657-661` → `doc.ts:53`）、导出在内存里造整个工作簿（`file/$kind.ts:152-162`）、上传整体 `formData()`（50MB）。单体 NAS + 内网场景可接受；若将来上大附件，改成流式（`createReadStream` + `ReadableStream`）即可，接口形态不变。
7. **`ensureDirs()` 的进程内缓存**（`paths.server.ts:96-97`）：键已含 DATA_DIR，正确；但若同一 DATA_DIR 被两个进程（例如手工起两份）共用，各自会做一遍迁移/写 `说明.txt`（`writeDataReadme` 只在文件缺失时写，`seedTemplates` 也按文件存在判断）→ 无害，无需改。

---

## 五、已核对、判定「不构成缺陷」的项（避免下轮重复报）

| 项 | 结论 |
|---|---|
| 解压炸弹与传输上限 | `ledger-transfer.ts:105-138` 顺序正确：不认识编码 400 → `gunzipSync(maxOutputLength)` 掐断 → 413；content-length 粗筛 + 解压后再查；实测 `content-encoding: br` → 400、`gzip 头 + 非 gzip 体` → 400、`null`/`[]`/非 JSON → 400，**全部不写盘** |
| 请求体边界 | 实测全部 400 而非 500：超长文件名（200B）、空备份（0 字节，且不动现有备份）、`/api/doc` 非 multipart、`/api/year` 非表单、`/api/photo` 非法 dataUrl / 名字全非法字符、`/api/audit` 非 JSON/缺 action。与 `tests/api-input-guards.test.ts`、`tests/backup-guard.test.ts` 一致 |
| 原子写 + 串行队列 | 台账写队列 `nas-fs.server.ts:84-112`、账户库 `accounts.server.ts:169-199`、审计 `nas-fs.server.ts:191-224` 均为「随机临时名 + rename + 队列」，坏文件一律拒写（`unreadable`/`conflict`/`ok` 三态）；实测坏台账 503、坏审计文件拒写 |
| 读路径不写盘 | `readLedger()` 不回写（`tests/ledger-server.test.ts` B1 已钉住）；`reconcileContractScans` 只改内存视图——**问题在版本号口径（见 A-2），不在回写** |
| 租户隔离（资产） | 影像/文档写入均在 `photos/<台账id>/<分类>`（`paths.server.ts:62-65`、`assets.server.ts:43-46`、`473-478`），读回落历史公共目录只读；`removePhoto` 只删本册同名副本（`assets.server.ts:399-412`） |
| 鉴权覆盖面 | 逐个路由核对 `withTenant(..., need)`：ledger/audit/file/doc/photo/photo-file/photo-scan/photo-adopt/photo-flags/backup/year 全覆盖；`images`/`update`/`update-log` 为「登录 + 管理员（+ 同源）」。**唯一缺 `need` 的两处**（`audit.ts:65`、`:91`）已在路由内先做 `role !== "admin" → 403`，不构成绕过 |
| 一键更新的失败模式 | 拉了非新版本不换容器（`apply.ts:63-76`）、更新容器启动 2s liveness 检查 + 贴日志（`:152-164`）、脚本本身 `new Function` 语法守卫（`tests/update-script.test.ts`）；实测本机无 docker.sock 时 `POST /api/update` 立刻安全失败（`{"ok":false,"error":"飞牛请先运行一次「一键拉取」…"}`）且落 `update.log` |
| 镜像清理安全边界 | `pickRemovableImages`（`docker.ts:162-181`）+ `usedImageIdsOf` 忽略已退出的 updater（`:190-200`）；`selfContainer()` 失败时 `currentId` 为空也不会误删（当前镜像仍被 `usedIds` 保护） |
| 备份保留 | `isManagedBackupFile` 只认自己生成的名字形状，`BACKUP_KEEP` 默认 30/封顶 1000，固定名「考勤表.xlsx」永不删（`tests/backup-retention.test.ts`） |
| 审计上限截断留痕 | 2 万条上限截断时 `logServer("warn", …)` 留痕（`nas-fs.server.ts:182-186`） |
| 空台账 409 哨兵 | GET 头与 CAS 都走 `ledgerRevisionValue`（`nas-fs.server.ts:72-74`）——**A-2 是这条原则在 PUT 响应头上的破例** |

---

## 六、与既有决策的关系

- 未把「实体级存储」「容器 root + docker.sock」「`attendance.edit` 可整本写台账」「成员自建台账限 5 本」「A 组 4 项未验证」当缺陷报（AGENTS「已决策」+ `docs/README.md` 第三节）。
- A-1 与「成员自建台账限 5 本」（1.8.9）无关，是**册子上下文解析**的问题，两者可以并存修。
- A-2 与 1.7.1 的空台账 409 是**同一类**（版本号口径不同源），建议修完后把「PUT 头 == 下一次 GET 头」写成不变量测试，避免第三次复发。

---

## 附录 A：复现环境与命令（可在本机重跑）

```bash
cd /Users/wsir/办公/WL/0测试/gongzi-lenger
# 用仓库里已有的构建产物起服务，DATA_DIR 指向 /tmp（绝不碰仓库 data/）
DATA_DIR=/tmp/glprobe/data PORT=8199 HOST=127.0.0.1 node app/server/index.mjs &
curl -s -c /tmp/glprobe/c.txt -X POST localhost:8199/api/auth \
  -H 'content-type: application/json' \
  -d '{"op":"setup","username":"admin","password":"12345678","name":"管理员"}'
```

- **A-2 版本号口径**：① 造扫描件 `mkdir -p /tmp/glprobe/data/photos/default/合同扫描件 && printf PDF > "/tmp/glprobe/data/photos/default/合同扫描件/甲项目-合同电子版.pdf"`；② `PUT /api/ledger`（`contracts:[{"id":"c1","name":"甲项目","year":2026}]`，`if-match:` 空）→ 记下响应头；③ `GET /api/ledger` → 记下响应头（两者不同，且 contracts[0] 多了 `scanFileName`）；④ 用①的头再 PUT → **409**；用②的头再 PUT → 200。
- **A-3 审计跨台账**：`printf 'broken{' > data/books/default/audit.json` → `GET /api/audit`（`x-book: default`）→ 对另一本没有 `audit.json` 的册子 `POST /api/audit` → 503；`GET /api/file/people-export` → 200 但 `data/logs` 出现「操作记录写入被拒：文件读不出来」。把 default 的文件修好并读一次后，同序列恢复正常。
- **A-1 台账回落**：建 `m1`（`op:createUser`）→ `op:addMember` 加入 default 与 copy1 → `m1` 登录并 `op:useBook{copy1}` → 管理员 `op:removeMember{copy1,m1}` → `m1` 用同一 cookie `GET /api/ledger` 得到 default 数据；`PUT` 后 `data/books/default/ledger.json` 被改写。
- **B-1 doc 指针覆盖**：`PUT /api/doc {id:AAA,kind:contract,file:甲合同.pdf}` → `PUT /api/doc {id:ZZZ,kind:contract,replace=1,file:<内容随意>;filename=AAA.name.txt}` → `GET /api/doc?id=AAA&kind=contract` → 404。
- **B-2 SLOW_MS**：不设 `SLOW_MS` 直接起服务，若干请求后 `grep -c '"event":"慢请求"' data/logs/*.log`，并看启动行的 `slowMs`。

> 本次审查未修改仓库任何代码/配置；`data/`（生产数据）全程未读写。唯一产出的文件是本报告。

## 处理状态

（待处理。修完请在本节逐条写 ✅已修 / ⏭️无需改 + 理由，并同步 `docs/README.md` 第三节与 `AGENTS.md` 未闭环清单。）
