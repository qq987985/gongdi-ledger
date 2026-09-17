# 前端与交互专家审查（2026-09-17 · 基线 1.8.13）

> 范围：本机缓存与同步的 UI 表现（键 / 归属 / 清缓存 / dirty / 409）、各页 fetch 的失败处理与 toast 文案、
> 竞态与卸载后 setState、375×667 与 390×844 的遮挡/弹窗/宽表与分页器、编辑弹窗重置与 `useGuardedClose`、
> 6 个打印入口的 `.no-print`/`.print-only` 分离与分页协议、键盘可达与 aria、空态/错误态、多主题。
>
> 手段：**只读静态取证**（源码 + 守卫测试 + 契约）+ `pnpm test` 基线复跑。
> 为什么不跑真实浏览器：本机驱动打包产物的脚本（`ci/mobile-print-check.mjs`）需要 `DATA_DIR=<临时>` 且
> **要经 `/api/auth` 登录**，登录只能读 `data/accounts.json`；本轮纪律禁止读写 `data/`，所以移动端/打印的
> 「视觉复测」不在本轮重做，只复用 `移动端与打印媒体验证-20260916.md` 的实测结论并据此判断新代码路径。
> 因此本轮所有结论都给出**源码行号 + 可复现的点击路径**；涉及像素的结论（如 §3.C3）明确标注为推理而非实测。
>
> 基线证据（本轮实跑，未改动任何文件）：
> ```
> $ pnpm test            # 392 pass / 0 fail / 0 todo（与 docs/README.md 记载一致）
> ```
> 也就是说下面这些项**没有被现有四道闸门覆盖**（否则测试会红）。

---

## 一、结论速览

### 用户最容易碰到的 5 条

| # | 一句话 | 级 | 处置 |
|---|---|---|---|
| 1 | **保存失败只在第一次弹提示，之后全静默**；401（会话失效）还被说成「请检查网络」；界面没有任何「未同步」指示 → 典型「说已保存但没落盘」 | B | 建议本轮修 |
| 2 | **只读账号切一下年份下拉，就弹红字「没有保存整本台账的权限，改动只保留在本机」**，且此后本机永远算「有未保存改动」，新建/切换台账时还会被问「本机改动会被覆盖」 | B | 建议本轮修 |
| 3 | **个人查询页的身份证/银行卡/IC 卡「上传 / 替换 / 删除」对只读账号全开**（该页只要 `query.view`），点了必然 403 且**界面毫无反应**（连 toast 都没有） | A | 建议本轮修 |
| 4 | 影像上传/替换/删除、成员「加入/移除/保存权限」、保险合同上传：**失败时界面什么都不显示**（未捕获的 promise 拒绝），文件超过 50MB 时服务端的 413 文案永远看不到 | A | 建议本轮修 |
| 5 | **保存成功后点「关闭」，仍被问「有未保存的更改，确定关闭吗？已填内容会丢失。」**（脏标记没有重置点） | B | 建议本轮修 |

另两条次高频：编辑弹窗里打开影像预览后按 Esc，会连带触发弹窗的「未保存更改」确认（§B3）；
409 冲突弹窗的「取消 / 右上角叉 / Esc」= 放弃本机改动（§B4，FAQ 已写两个选项，但「什么都不做」的手势会丢数据）。

### 分级汇总

| 级别 | 编号 | 标题 |
|---|---|---|
| A | A1 | 查询页影像/照片编辑入口无权限守卫（`DocActions` 的 9 个渲染点里只有 1 处传了 `readOnly`），与 1.8.7「只读入口必须拦」的约定相背，且守卫清单没覆盖该页 |
| A | A2 | 多处写操作没有 `catch`：失败时静默 no-op（不是假成功，是**没有任何反馈**） |
| B | B1 | 只读账号切年份 → 假错误 toast + `dirty` 永久为真 |
| B | B2 | 推送失败后静默（`pushFailed` 锁存）+ 401 归因错误 + 无同步状态指示 |
| B | B3 | 弹窗内预览按 Esc 连带触发「未保存更改」确认；`[data-modal]` 守卫是死代码 |
| B | B4 | 409 冲突弹窗「取消」= 放弃本机改动（含 Esc / 关闭对话框） |
| B | B5 | `useGuardedClose` 的脏标记保存后不重置 → 假警报 |
| C | C1 | `ExpenseSheets` 打印件有**两份实现**，`expense-editor.tsx` 那份是死代码且停在 1.8.11 之前的旧版式（文档还把它当在用的） |
| C | C2 | 保险弹窗没有 Esc 关闭；所有弹窗都没有 `role="dialog"` / `aria-modal` / 焦点约束 |
| C | C3 | 两个最大的编辑弹窗仍用 `max-h-[80vh]`（其它 4 个已改 `dvh`）—— 键盘弹出态的取舍，未实测 |
| C | C4 | 空台账分支 `pullNasLedger` 清掉本机 `accessHash`，与 `dropLocalLedger` 的保留策略不一致 |
| C | C5 | `settings.tsx` / `brand.tsx` 的 `authStatus()` 没有 `catch`（unhandledrejection + `isAdmin` 恒 false） |
| C | C6 | 「删除年度」两条路径行为不一致（设置页先备份、侧栏先拉服务器并可能弹覆盖确认） |

---

## 二、逐条发现

### A1 查询页（及 DocActions 未传 readOnly 的 8 处）影像/照片编辑入口对只读账号全开，失败后连提示都没有

**级别**：A（确认缺陷）　**处置**：建议本轮修

**证据链（每一环都可核对）**

1. `src/routes/query.tsx:384` 整页只要一个权限：
   ```tsx
   <Need perm="query.view">
   ```
2. 同页 `src/routes/query.tsx:537-539` 直接渲染照片槽（**没有任何权限包裹**、也没有 `readOnly` 之类入参）：
   ```tsx
   <div className="grid gap-4 md:grid-cols-3">
     <PhotoSlot name={p.name} kind="id" />
     <PhotoSlot name={p.name} kind="bank" />
     <PhotoSlot name={p.name} kind="ic" />
   </div>
   ```
3. `PhotoSlot` 本身**没有只读入口**（`src/components/photo-slot.tsx:430-450` 的 props 只有 `name/kind/compact/onChanged`），
   上传与删除按钮无条件渲染：上传 `photo-slot.tsx:308-326`（`await setPhoto(...)` → `src/lib/photos.ts:82-91` 的
   `fetch("/api/photo", {method:"PUT"})`），删除 `photo-slot.tsx:403-413`（`deletePhoto` → `photos.ts:93-104` 的 DELETE）。
4. 服务端口径：`src/routes/api/photo.ts:57`（PUT）与 `:86`（DELETE）都要求 `"photos.edit"`。
5. 同一页 `src/routes/query.tsx:622-629` 还渲染了影像资料操作条，**同样没传 `readOnly`**：
   ```tsx
   <DocActions id={d.id} kind="attendance" fileName={d.fileName} ... />
   ```
   `DocActions` 的 `readOnly` 默认 false（`src/components/doc-actions.tsx:289`、`:299`），
   只有 `src/routes/files.tsx:234` 传了 `readOnly={!canEditFile}`（全库仅此一处）。
   该条目的服务端口径是 `kindEdit("attendance") = "attendance.edit"`（`src/routes/api/doc.ts:19-24`）。
6. 「只读」预设包含 `query.view`、**不含** `photos.edit`/`attendance.edit`（`src/lib/perms.ts:158-165`）。
7. 1.8.7 立的约定「有编辑入口的页面必须调 `blockedWrite()`」的守卫清单里**没有 query.tsx**
   （`tests/readonly-guards.test.ts:32-40` 的 `EDIT_PAGES` 只有 people/attendance/payments/contracts/expenses/insurance/photos）。
   所以这一页以后回退也不会被 `pnpm test` 拦住。

**复现步骤（只读账号，例如设置页给成员勾「只读」预设）**

1. 登录只读账号 → 打开「个人查询」→ 选一个人；
2. 点身份证格子的「上传/替换」→ 选一张照片 → 传完后提示 `照片上传失败（403）`（`photos.ts:89`），
   照片白传（`/api/photo` 的 body 是 base64，20MB 上限，`api/photo.ts:37/:49`）；
3. 点银行卡/IC 卡的「删除」→ 确认「确认删除…」→ **界面没有任何反应**（既没删掉也没提示，见 A2）。

**影响面**：只读账号（含只读预设、以及任何「有 query.view 但无 photos.edit/attendance.edit」的账号）在
最高频的「查询」页看到可点的编辑入口，白传流量、白点按钮、以为删掉了。

**建议修法（两处，互不替代）**

- `PhotoSlot` 增加 `readOnly?: boolean`（照 `DocActions` 的既有做法），查询页/人员弹窗/照片弹窗按
  `useCanSave("photos.edit")` 传入，隐藏上传/替换/删除并写明「你是只读账号（缺「照片 上传/删除」权限）」；
- 更彻底：把 `EDIT_PAGES` 扩到「渲染了 `PhotoSlot`/`DocActions` 的页面」，即断言
  「`<PhotoSlot` 与 `<DocActions` 必须出现在 `Can perm=…`/`readOnly` 判定之后」，否则下轮还会漏。

---

### A2 多处写操作没有 `catch`：失败时界面静默、什么都不发生

**级别**：A（确认缺陷）　**处置**：建议本轮修

同库已经修过**同型**问题并写了注释与测试：`src/components/settings/accounts-card.tsx:212-224`
（改密码，A 组第 12 项）用 `try { await authOp(...) } catch { toast.error(...) }`；
`tests/readonly-guards.test.ts:90-97` 只钉了 `changePassword` 这一处。以下位置仍是裸 `await`：

| 位置 | 操作 | 失败时的表现 |
|---|---|---|
| `src/components/settings/members-card.tsx:72-77` | 移除成员（`authOp("removeMember")`） | 无提示（服务端 400「创建人权限不能改」/403 都看不到） |
| `src/components/settings/members-card.tsx:88-93` | 保存权限（`setMember`） | 无提示，复选框状态已改，用户以为存上了 |
| `src/components/settings/members-card.tsx:124-131` | 加入成员（`addMember`） | 无提示 |
| `src/routes/insurance.tsx:588-603` | 上传保险合同（`setDoc(id,"insurance",…)`） | 无提示；>50MB 时服务端 `413 {"error":"文件太大，最大 50MB"}`（`api/doc.ts:68/:85`）永远弹不出来 |
| `src/components/doc-actions.tsx:374-399` | 上传/替换影像（`setDoc`） | 无提示（403/413/网络断都一样）——查询页/报销/合同/保险/考勤的影像条共用 |
| `src/components/doc-actions.tsx:409-415` | 删除影像（`removeDoc`） | 已弹确认框，点确定后**什么也没发生**（`removeDoc` 在 `!res.ok` 时 throw，`doc-actions.tsx:108-111`） |
| `src/routes/attendance.tsx:629-654` | 考勤影像批量上传 | 只有 `try/finally`（无 `catch`）：中途抛错则整批静默中断，已上传的部分还留在台账里 |

**复现（最直白的一条）**：只读账号 → 个人查询 → 该区间有考勤影像时点「删除」→ 确认 →
界面无任何变化（配合 A1：入口本来就不该出现）。

**影响面**：网络抖动（工地 4G）、权限不足、文件超限这些都会走到这里；用户既看不到失败原因，
也没有任何可重试的入口，只能反复点。

**建议修法**：给这 7 处补 `try/catch` + `toast.error(err.message)`（`setDoc`/`removeDoc` 抛出的
`Error("文件上传失败（403）")` 已经是给人看的文案，直接显示即可）；并把守卫从「只钉 changePassword」
升级为「凡 `await authOp(` / `await setDoc(` / `await removeDoc(` / `await setPhoto(` 的处理器，
±30 行内必须有 `catch`」的静态扫描（与 `tests/api-guards.test.ts` 的同型写法一致）。

---

### B1 只读账号切一下年份，就报「没有保存整本台账的权限」；`dirty` 从此永久为真

**级别**：B（风险隐患，含推理链；但触发路径是「点一下下拉」，概率极高）　**处置**：建议本轮修

**推理链**

1. 年份下拉对所有人可见，`onChange` 直接写 store：
   `src/components/shell/year-switcher.tsx:51`（compact）与 `:70`（完整版）`onChange={(e) => setYear(Number(e.target.value))}`；
   `src/lib/store.ts:305` `setYear: (year) => { set({ year, years: derivedYears(...) }) }`。
2. `startNasSync()` 订阅了 **store 的任意变化**：`src/lib/nas-sync.ts:386-392`
   ```ts
   useApp.subscribe(() => {
     if (applyingRemote) return;
     dirty = true;                     // ← 只看了一眼年份，也算「本机有改动」
     window.clearTimeout(t);
     t = window.setTimeout(tick, 500); // ← 500ms 后整本 PUT
   });
   ```
3. `year` 确实在整本快照里（`nas-sync.ts:55-71` 的 `sliceState` 含 `year`），所以对**有**写权限的账号
   这是「同步当前工作年」，没问题；但对**没有** `ledger.manage` 的账号：
   `nas-sync.ts:254-260`
   ```ts
   if (!canManageLedger(livePerms())) {
     if (dirty && !pushFailed) { pushFailed = true;
       toast.error("当前账号没有保存整本台账的权限，改动只保留在本机，请联系管理员"); }
     return;
   }
   ```
   `canManageLedger` 只认 `people.edit` / `attendance.edit` / `settings.*`（`src/lib/perms.ts:248-252`），
   所以**只读预设**（`perms.ts:158-165`：全部 `.view` + 三个 print + `export.use` + `audit.view`）必然命中这一支。
4. 后果 1（看得见）：只读账号每换一次年份，就弹一条红字错误 toast，说的还是「改动只保留在本机」——
   用户并没有改任何数据，只会以为「软件坏了 / 我的数据没保存」。
5. 后果 2（更隐蔽）：`dirty` 从此保持 `true`（该分支不重置它，只有推送成功或 409 选「放弃本机」才清，
   `nas-sync.ts:277/:286/:297`），于是之后每一次 `pullNasLedger()` 都会先弹
   `src/lib/nas-sync.ts:74-77`：
   ```
   本机有还没保存到服务器的改动。\n\n加载这本空台账会覆盖这些改动，确定继续吗？
   ```
   典型路径：只读账号切年份 → 设置页「新建台账」（`accounts-card.tsx:179-186` 里 `flushPendingLedger()` 对只读账号
   是空转，不会清 `dirty`）→ `pullNasLedger()` → 被问「本机改动会被覆盖」——用户完全不知道「改动」指什么。

**复现步骤**

1. 用「只读」预设立一个成员账号并登录；
2. 打开任意页，把左上/顶部「年份」下拉从 2026 换到 2027 → 右下弹红字
   「当前账号没有保存整本台账的权限，改动只保留在本机，请联系管理员」；
3. 再去设置页点「新建台账」→ 弹「本机有还没保存到服务器的改动。加载这本空台账会覆盖这些改动，确定继续吗？」。

**建议修法（取舍）**

- 最小改动、最符合现有约定的一处：在 `nas-sync.ts` 的订阅里先判权限——
  `if (!canManageLedger(livePerms())) return;`（不能落盘的账号不置 `dirty`、不推送、不弹错误；
  页面顶部的只读横幅 `ReadonlyNotice` 已经在解释了）。这样「看一眼年份」不会产生任何同步语义。
- 反向取舍：如果产品希望**当前工作年跨设备同步**（换设备打开还是上次的年），就不能简单跳过推送，
  而要区分「视图状态（year）」与「台账内容」，这需要把 `year` 拆出整本快照 → 属实体级存储的范畴，
  按 `docs/README.md` 未闭环清单 A1 是**专项、本轮不做**。建议本轮先按最小改动修，并在
  `开发规范.md` §6 记一句「`year` 属于整本快照，只读账号不得因它触发推送」。

---

### B2 推送失败后只提示一次，之后静默；401 被归因为「网络」；没有任何「未同步」状态

**级别**：B（风险隐患）　**处置**：建议本轮修（第 1、2 条文案与指示器属小改动）

**证据**

- `pushFailed` 锁存：`src/lib/nas-sync.ts:11`（模块级变量），只在推送成功（`:296`）或 409 选「放弃本机」（`:276`）时清；
  失败分支都写成 `if (!pushFailed) { pushFailed = true; toast.error(...) }`：`:317-324`。
  即：**第一次失败会报，之后一直静默**（用户继续编辑，页面继续弹「已保存」）。
- `401` 没有专门文案：只有 400/403/503 有分支（`:310` / `:305` / `:300`），401 落到默认分支
  ```
  toast.error(`保存到服务器失败（401），请检查网络后重试`);
  ```
  而服务端 401 的语义是**会话失效**（`src/lib/accounts.server.ts:755` `if (!t.user) return Response.json({error:"login"},{status:401})`），
  典型触发是「账户被停用 / 改过密码 / cookie 被清」（`:303` 的 token 校验）。这时让用户「检查网络」是错的，
  真正要做的是重新登录——而界面既不提示重新登录，也不把用户带回登录页。
- 全库没有任何同步状态指示：`grep -rn "未保存\|同步" src/` 只命中「考勤月表本地编辑」的
  `src/routes/attendance.tsx:499`（`有未保存的修改`）与版本日志，**没有一处**表示「本机改动还没推到服务器」；
  也没有 `beforeunload` 提醒（`grep -rn beforeunload src/` 无命中）。
- 各页的成功提示只判权限、不判落盘结果：例如 `src/routes/payments.tsx:373`「发放已保存」、
  `src/routes/expenses.tsx:505`「报销已保存」——它们只过了 `blockedWrite()`（权限）这一关，
  **推送结果与它们无关**。

**影响面 / 场景**：工地现场 4G 抖动或 NAS 容器重启的窗口里连续录入 1 小时：第一条失败弹一次红字，
之后每次编辑都写进 localStorage 但没有任何提示；用户关机/换设备后这批数据不在服务器上
（本机缓存是浏览器 `localStorage`，键 `gongdi-ledger-v5`，`src/lib/store.ts:629`）。

**建议修法**
1. 401 单独文案：「登录已失效（401），请重新登录后再保存，本机改动还在」+ 引导到登录（或直接 `setGate("login")`）；
2. 顶部/侧栏加一个常驻的同步状态（「已同步 / 有改动未保存 / 保存失败，点此重试」），
   把 `dirty`/`pushFailed` 暴露给 UI（目前它们是模块内私有变量，`nas-sync.ts:11-17`）；
3. 失败后除下一笔改动外，给一次指数退避重试（现在只靠「下一次编辑」触发）。

---

### B3 编辑弹窗里打开影像预览后按 Esc，会连带触发弹窗的「未保存更改」确认；`[data-modal]` 守卫是死代码

**级别**：B（风险隐患，可致丢了填一半的表单）　**处置**：建议本轮修（很小）

**证据**

- `src/routes/photos.tsx:153-160` 里的 Esc 处理器写了防嵌套判断：
  ```ts
  if (document.querySelector("[data-modal]")) return;
  ```
  但全库**只有这一处出现 `data-modal`**（`grep -rn "data-modal" src/ tests/` → 1 命中），
  没有任何元素声明过这个属性 ⇒ 判断恒为 false，等于没写。
- 预览弹窗自己监听 Esc：`src/components/preview.tsx:21-28`（`if (e.key === "Escape") onClose()`）；
- 而预览弹窗是被 `DocActions` 渲染在其所属弹窗**内部**的（`src/components/doc-actions.tsx:330-331` 渲染
  `<PreviewModal …>`，按钮「查看」在 `:334-341`）。编辑弹窗内部确实渲染了 `DocActions`：
  - 合同编辑弹窗：`src/components/contract-editor.tsx:92`（遮罩）内 → `ReportBook/InvoiceBook/ReceiptBook`
    （`:327/:458/:610`）与 `ContractScanBox`（`:827`、`:862`）
  - 报销编辑弹窗：`src/components/expense-editor.tsx:166`（遮罩）内 → `VoucherSlot`（`:300/:339`）
    → `expense-bits.tsx:152` `<DocActions …/>`
- 编辑弹窗自己的 Esc → `requestClose`（合同 `contract-editor.tsx:84-89`，报销 `expense-editor.tsx:60-65`，
  发放/人员 `payments.tsx:461-468`、`people.tsx:449-454`），`requestClose` 在脏的时候会
  `window.confirm("有未保存的更改，确定关闭吗？已填内容会丢失。")`（`src/lib/confirm-close.ts:9-17`）。

**复现步骤**

1. 合同页 → 点开一个合同（编辑弹窗）→ 随便改一个字段（比如备注）；
2. 在弹窗里的报量明细点影像的「查看」（图片/PDF 预览浮层出现）；
3. 按 **Esc**：预期只关预览；实际**同时**弹出「有未保存的更改，确定关闭吗？已填内容会丢失。」
   （两个 handler 都挂在 window 上，弹窗的那个先注册先执行）；点「确定」= 填的内容没了。

**建议修法**：给所有弹窗根节点加 `data-modal`（或改成 CSS 选择器 `[role="dialog"]` 并给弹窗加 role，
见 C2），让 `photos.tsx` 那条判断真正生效；同时给 `PreviewModal` 用 `stopPropagation` 之外的方式
（例如把「当前打开的模态层数量」记在 context/模块变量里，Esc 只处理最上层）——**不要**只加 `data-modal`
就收工：`photo-slot.tsx:242/387` 的照片放大浮层也是同一类内层浮层，同样没有声明。

---

### B4 409 冲突弹窗的「取消」等于「放弃本机改动」

**级别**：B　**处置**：留待后续（FAQ 已写明两个选项；但交互语义建议改）

`src/lib/nas-sync.ts:272-281`：
```ts
const overwrite = window.confirm(
  "服务器上的台账已被其他设备修改。\n\n确定：用本机数据覆盖服务器\n取消：放弃本机改动，加载服务器上的版本",
);
if (!overwrite) { pushFailed = false; dirty = false; await pullNasLedger({ discardLocal: true }); … }
```
`window.confirm` 的「取消」按钮、右上角 ×、Esc **三者返回值都是 false**，而这里 false = 丢本机改动。
用户「不确定所以先不做」的直觉手势恰好是破坏性的那个。FAQ 第 3 条
（`docs/使用与部署/常见问题解答(FAQ).md:53-66`）把两个选项写清楚了，但没法表达「我还没决定」。

**建议修法**：三选一（保留本机 / 以服务器为准 / 稍后再说），或在 false 分支先「什么都不做」并给出
一次显式二次确认；后者改动最小（`if (!overwrite) return;` + 另一次 `confirm` 才丢本机）。
风险：会让「冲突」停在未解决状态，需要同时保留顶部的同步告警（见 B2 建议 2）。

---

### B5 保存成功后点「关闭」，仍被问「有未保存的更改」

**级别**：B　**处置**：建议本轮修

`src/lib/confirm-close.ts:7-21` 只导出 `{ markDirty, requestClose }`，**没有重置入口**；
而各弹窗的 `markDirty` 是挂在整个面板上的 `onChange`（`expense-editor.tsx:171`、`contract-editor.tsx:97`、
`payments.tsx:526`、`people.tsx:460`、`insurance.tsx:115`），一旦改过任何字段就永远是脏的。

`src/routes/expenses.tsx:501-506`（保存后**不关闭**弹窗）：
```tsx
onSave={(row: any) => { … upsertExpense(row); setEditing(row); setCreating(false); toast.success("报销已保存"); }}
```
复现：报销页「编辑」→ 改备注 → 「保存报销信息」(提示「已报销已保存」) → 点「关闭」→
弹「有未保存的更改，确定关闭吗？已填内容会丢失。」——刚才明明保存成功了。

**建议修法**：`useGuardedClose` 返回 `markClean`，在保存成功的回调里调用（`onSave` 之后再 `markClean()`）；
或让脏标记改为「表单快照与已保存值比较」，但那是更大改动，先做 `markClean` 即可。

---

### C1 打印件 `ExpenseSheets` 有两份实现，`expense-editor.tsx` 那份是死代码且停在旧版式

**级别**：C（结构/维护陷阱，§12 的「禁重复实现」精神）　**处置**：建议本轮修（删死代码，零风险）

```
$ grep -rn "ExpenseSheets" src/
src/components/expense-editor.tsx:393:function ExpenseSheets({ rows, showVoucher }: …)   ← 从未被引用
src/routes/expenses.tsx:651:        <ExpenseSheets rows={printSingle ? [printSingle] : printRows} … />   ← 真正在用的
src/routes/expenses.tsx:656:function ExpenseSheets({ rows, showVoucher }: …)
```
两份内容已经**分叉**：在用的那份（`expenses.tsx:665-707`）在 1.8.11 把「报销人/收款人/开户行/打款账户」
搬进了 `thead` 第一行（跨页重复），而 `expense-editor.tsx:404-443` 那份还停留在**表外小表**的老写法。
守卫测试只检查 `src/routes/expenses.tsx`（`tests/ui-guards.test.ts:419-424` 的 `cases` 列表），
所以死代码里的旧版式永远不会被测试发现。
另：`docs/审查与报告/移动端与打印媒体验证-20260916.md` §2.4 把「`expenses.tsx` + `expense-editor.tsx` 的
`ExpenseSheets`」当成同一个在用的打印件记录，说明这份重复已经造成过一次误判。

**建议**：删掉 `expense-editor.tsx:393-465`（约 70 行），或反向抽成 `src/components/expense-sheets.tsx`
由页面渲染（后者更符合 §12，但要同步改守卫的扫描路径 —— 见 `AGENTS.md` 关于「守卫路径元测试」的约定）。

---

### C2 保险弹窗没有 Esc 关闭；所有弹窗都没有 `role="dialog"` / `aria-modal` / 焦点约束

**级别**：C（无障碍）　**处置**：留待后续

- Esc 处理只有 5 处：`payments.tsx:466`、`people.tsx:452`、`photos.tsx:158`、
  `contract-editor.tsx:88`、`expense-editor.tsx:64`（另加 `preview.tsx:26`）。
  **`insurance.tsx:107-119` 的保单/被保人弹窗没有任何 keydown**（`grep -rn keydown src/routes src/components`
  可见），键盘用户只能靠 Tab 找到「关闭」按钮。
- `role="dialog"` 全库只有 2 处：`src/components/preview.tsx:35-36` 与 `doc-actions.tsx:221` 的内联重命名提示框。
  5 个编辑弹窗都是裸 `<div className="fixed inset-0 …">`（如 `insurance.tsx:110`、`expense-editor.tsx:166`），
  没有 `aria-modal`、没有初始焦点、也没有焦点陷阱 ⇒ Tab 会跑到弹窗背后的页面上，
  屏幕阅读器不会把弹窗当对话框播报。

**建议**：抽一个 `<Modal>` 壳（遮罩 + `role="dialog"` `aria-modal="true"` + 打开时聚焦第一个控件 + Tab 环内 +
Esc 走 `requestClose`），5 个弹窗改用它。这也顺手解决 B3 的「只关最上层」问题（列表栈管理）。

---

### C3 两个最大的编辑弹窗仍用 `max-h-[80vh]`

**级别**：C（一致性 + 键盘态折衷；**未实测**）　**处置**：留待后续

```
src/routes/payments.tsx:524       max-h-[calc(100dvh-4rem)] … md:max-h-[calc(100dvh-3rem)]
src/routes/insurance.tsx:113      同上
src/routes/photos.tsx:164         同上
src/routes/people.tsx:458         同上
src/components/expense-editor.tsx:169   max-h-[80vh]   ← 例外
src/components/contract-editor.tsx:95   max-h-[80vh]   ← 例外
```
1.8.8 的 D6 修复（`max-h-screen` → `dvh`）只覆盖了 4 个；其余 2 个恰好是字段最多、最需要滚动的报销/合同编辑器。
`移动端与打印媒体验证-20260916.md` §1.1 已实测「5 个弹窗 × 2 尺寸都合格」（不含键盘弹出态），
所以**无键盘时不是缺陷**；但手机上打开软键盘后 `vh` 不缩、面板底部（弹窗内最后几个字段与
「上传凭证/影像」区）会被键盘盖住，得先收起键盘才能点到 —— 这是 `dvh` 想解决的那一类问题。
建议与 C2 的 `<Modal>` 壳一起统一为 `max-h-[calc(100dvh-4rem)] md:max-h-[calc(100dvh-3rem)]`，
并在 `ci/mobile-print-check.mjs` 的弹窗检查里加一条「键盘态（`visualViewport.height` 变小后）底部控件可达」。

---

### C4 空台账分支会清掉本机 `accessHash`（与 `dropLocalLedger` 的策略不一致）

**级别**：C　**处置**：留待后续

```
src/lib/nas-sync.ts:95-103  dropLocalLedger：setAll({ ...emptyState(), accessHash, uiStyle })   ← 有意保留
src/lib/nas-sync.ts:155-157 服务器上是空台账：setAll({ ...emptyState(), uiStyle })                ← accessHash 被清成 ""
```
`accessHash` 是旧版「访问密码」门禁（无账户体系时用），清成 `""` 后
`src/components/shell.tsx:102-104` 的 `setUnlocked(!accessHash || …)` 会让门禁直接通过，且这次清空会经
`persist` 落进 localStorage（键 `gongdi-ledger-v5`，`src/lib/store.ts:629-700`），**不可逆**（服务端空台账里也没有它）。
现实影响有限（空台账没数据，且账户体系才是真门禁），但两处策略不一致本身就是以后踩坑的地方。
**建议**：空台账分支也照 `dropLocalLedger` 保留 `accessHash`。

---

### C5 `authStatus()` 有两处没 `catch`

**级别**：C　**处置**：留待后续

- `src/routes/settings.tsx:40-42`：`authStatus().then((s) => setIsAdmin(s.user?.role === "admin"));`
- `src/components/shell/brand.tsx:14`：同型 `.then(...)`

`authStatus()` 内部是裸 `await fetch(...).json()`（`src/lib/auth.ts:136-149`），网络失败即 reject ⇒
Promise 拒绝无人处理（控制台 `unhandledrejection`），且 `isAdmin` 恒为 `false`：
设置页的「清空全部数据」「账户管理」区块对**管理员**也不显示，而页面上没有任何解释。
**建议**：`.catch(() => setIsAdmin(false))` 或补一条「读取账户失败，请刷新重试」的提示。

---

### C6 「删除年度」两条路径行为不一致

**级别**：C　**处置**：留待后续

- 设置页 `src/routes/settings.tsx:78-88`：先 `pushNasBackup()`（把当前整本台账导出一份 Excel 到
  `data/backups/`）再 `removeYear(y)`；
- 侧栏 `src/components/shell/year-switcher.tsx:40-45`：先 `await pullNasLedger()` 再 `removeYear(y)`。

后者会在 `dirty` 时弹「本机有还没保存到服务器的改动…会覆盖这些改动」，而且它是**先覆盖本机状态再删除年份**，
与设置页「先备份再删」的直觉完全相反。两条路径的破坏性相同、保护措施不同，用户换一条路径就没有备份了。
**建议**：统一为「先备份（`pushNasBackup`）→ 再删」，把 `pullNasLedger()` 去掉（它的原意大概是
「按服务器最新年份列表删」，但这等于把本地未保存的改动当垃圾）。

---

## 三、已核对、判定「不是缺陷」的（避免下轮重复报）

1. **6 个打印入口的分离与分页协议都成立**（本轮静态复核，与 1.8.4/1.8.10–1.8.13 的实测记录一致）：
   `payments.tsx:145` + `PaymentSheets`、`expenses.tsx:320/651`、`contracts.tsx:249` + `ContractStatementSheets`、
   `insurance.tsx:307/703`、`query.tsx:386/184` + `PayslipSheets` 都是「屏幕内容 `no-print` 包裹 + 打印件在包裹之外」；
   打印态规则（一屏高清零、`thead` 跨页、`tfoot` 只印一次、`.print-doc` 整条不拆、行高 1px、`article` 2mm 3mm）
   全部集中在 `src/styles.css:521-608` 一处，`tests/ui-guards.test.ts` 的 6 条断言 + 坏样本自检都在（`pnpm test` 392/392 通过）。
   两个编辑器弹窗的「打印对账单/打印报销单」按设计走**页面**里的打印件（弹窗自身 `print:hidden`），
   守卫里写明了这条例外及其理由（`tests/ui-guards.test.ts:209-212`），不是缺陷。
2. **屏幕与打印数字同源**：发放两张清单的合计一律来自 `src/lib/payments-stats.ts` 的同一份结果
   （`payment-sheets.tsx` 顶部注释 + 守卫禁止组件内再 `.reduce`）；报销单的「打印范围」是与屏幕筛选
   并列的独立口径，按钮上写着条数（`expenses.tsx:385`）、勾选时也有文字说明（`:391`），属已决策口径。
3. **照片上传/删除本身有 `catch` 与错误文案**（`photo-slot.tsx:122-130`、`:316-324`、`photos.ts:82-104`（失败即 `throw`，由上面的 `catch` 转成 `toast.error`）「上传失败也会提示已保存」的旧缺陷已修）——
   A2 列的是 `doc-actions`/成员管理/保险上传，不要混为一谈。
4. **移动端 375×667 / 390×844 的遮挡、宽表横滑、分页器**已由 1.8.4 的 14 页 × 2 尺寸实测覆盖（含 56 张截图），
   本轮未复现新问题，不再重报 `max-h-screen` 类（守卫 `tests/ui-guards.test.ts:221-238` 仍在）。
5. **多主题**：`theme-classic/apple/movie` 三套都是浅色变量（`src/styles.css:87-190`），
   硬编码颜色只剩设置页「清空数据」的红色警示块（`settings.tsx:196-197`，浅红底深红字，三套主题下都可读）
   与首页 hero 的 `bg-white/15 text-white`（配渐变底，`index.tsx:132`）——不构成漏样式缺陷。
6. **不重报**：实体级存储、容器 root + docker.sock、`attendance.edit` 可整本写台账、成员自建台账限 5 本、
   A 组 4 项「未能验证」——见 `AGENTS.md`「已决策」。

---

## 四、建议补的守卫（防止下轮再退）

1. `tests/readonly-guards.test.ts`：把「渲染了 `<PhotoSlot` / `<DocActions`」的页面纳入扫描，
   断言它们出现在 `Can perm=` 判定或 `readOnly=` 之后（本轮 A1 的实例是 `src/routes/query.tsx`）。
2. `tests/api-guards.test.ts` 同型：**所有 `await` 到网络函数的 `onClick/onChange/onFiles` 处理器
   必须含 `catch`**（本轮 A2 的 7 处里，`insurance.tsx:589`、`members-card.tsx:73/89/125`、
   `doc-actions.tsx:374/409`、`attendance.tsx:629` 都会被这条抓出）。
3. `tests/ui-guards.test.ts`：`grep "data-modal"` 必须「赋值 ≥ 1 处」，否则守卫本身就是空转
   （本轮 B3 的死代码）。
4. `tests/ui-guards.test.ts`：`useGuardedClose` 的使用方必须在保存成功路径调用 `markClean`（本轮 B5）。
5. `src/lib/nas-sync.ts` 的订阅加权限前置后，补一条断言：**没有 `ledger.manage` 的账号不得因
   `setYear` 触发 `dirty`/PUT**（本轮 B1）。

---

## 五、处理状态

| 编号 | 条目 | 状态 |
|---|---|---|
| A1 | 查询页 / DocActions 编辑入口无权限守卫（1.8.7 约定缺口） | ⏳ 待处理（建议本轮修） |
| A2 | 7 处写操作无 `catch`（静默失败） | ⏳ 待处理（建议本轮修） |
| B1 | 只读账号切年份假报错 + `dirty` 永久为真 | ⏳ 待处理（建议本轮修） |
| B2 | 推送失败只提示一次 / 401 归因错 / 无同步指示 | ⏳ 待处理（建议本轮修） |
| B3 | 弹窗内预览 Esc 连带触发未保存确认（`data-modal` 死代码） | ⏳ 待处理（建议本轮修） |
| B4 | 409 冲突弹窗「取消」= 放弃本机 | ⏳ 待处理（留待后续） |
| B5 | 保存成功后脏标记不重置 | ⏳ 待处理（建议本轮修） |
| C1 | `ExpenseSheets` 重复实现 / 死代码停在旧版式 | ⏳ 待处理（建议本轮修，删死代码） |
| C2 | 保险弹窗无 Esc；弹窗无 `role="dialog"`/焦点约束 | ⏳ 留待后续 |
| C3 | 报销/合同弹窗仍用 `max-h-[80vh]`（键盘态未实测） | ⏳ 留待后续 |
| C4 | 空台账分支清掉本机 `accessHash` | ⏳ 留待后续 |
| C5 | `authStatus()` 两处无 `catch` | ⏳ 留待后续 |
| C6 | 删除年度两条路径保护措施不一致 | ⏳ 留待后续 |

> 说明：处理完请在**本文件**末尾追加实际处理结果（按 `开发规范.md` §2 的惯例），
> 并同步 `docs/README.md` 的未闭环清单。
