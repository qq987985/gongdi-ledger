# 代码审查报告 · 核心领域逻辑的正确性与可维护性 + 安全要点

> 审查范围（任务下发）：`src/lib` 的 `wage.ts`、`dates.ts`、`idcard.ts`、`attendance-summary.ts`、`payments-stats.ts`、
> `insurance.ts` / `insurance-stats.ts`、`contracts.ts` / `contracts-totals.ts`、`expense-rules.ts`（+`expenses-stats.ts`）、
> `num.ts`、`readonly.ts`、`receiver.ts`、`book-quota.ts`、`backup-keep.ts` / `buckets.ts` / `work.ts`，
> 以及边界值、口径重复实现、静默失败、类型断言滥用、测试是否真兜得住；安全要点按 CWE 编号看授权绕过 / 会话 /
> 上传下载 / 审计 / 日志 / 供应链。
>
> 基线：**1.8.13**（`VERSION.txt` 首行）；分支工作区 `git status --porcelain` 干净（`?? docs/审查与报告/专家审查/` 为本次审查新建目录）。
>
> 方法：只读代码走查 + **用真实源码写复现脚本**（写在 `/tmp/gdrev/`，未在仓库里产生任何文件）+
> 跑闸门（`pnpm run typecheck` / `pnpm test` / `pnpm run test:roundtrip`）。**未跑 `pnpm build`**：
> `app/` 是**入库的构建产物**，跑构建会改仓库文件，与「只读审查」约束冲突（本报告不改任何代码/配置/数据）。
>
> ⚠️ 本次审查与同目录 `安全工程师.md` 范围有重叠：**安全侧结论以该报告为准，本报告不重复**
> （cookie 缺 `Secure`＝其 F-05、scrypt/常量时间＝F-09、供应链 `latest`＝F-13、审计可改删＝F-03、`/api/doc` 内联类型＝F-11）。
> 我这边只保留**它没有列的**几条（§六 的 3 条 + C-4 / C-7）。

---

## 一、结论摘要

| 项 | 结果 |
|---|---|
| `pnpm run typecheck` | **0 错误**（`tsc --noEmit`，exit 0） |
| `pnpm test` | **392 / 392 通过，0 todo**（`ℹ pass 392 ℹ fail 0`，2.06s） |
| `pnpm run test:roundtrip` | **70 / 70 通过**（Excel 导出→导入对拍） |
| `pnpm build` | **未跑**（会写 `app/`，见上） |
| 核心领域逻辑 | 大体扎实：金额/日期单一实现、`receiverOf`/`isPaid` 口径收敛、`hasContent` 下沉确实解决了历史问题 |
| 但发现 | **2 条 A（确认缺陷，各带可复现证据）**、**5 条 B（风险隐患）**、**7 条 C（改进建议，含 1 条复核后降级项：文档上传扩展名白名单）**；其中 **9 条建议本轮修**（A-1/A-2/B-1/B-2/B-3/B-4/B-5/C-3/C-4），**5 条留待后续**（C-1/C-2/C-5/C-6/C-7） |
| 最该先做的一件事 | **把「姓名比较」收敛成一个函数**（A-1）：现在同一本台账里，人员姓名**从不 trim**，发放收款人**保存时 trim**，Excel 导入**trim**，而 `summarizeYear` **只在比较的一侧 trim** —— 一个人会被拆成两行／出勤静默归零 |

**最值得先修的 3 条**

1. **A-1｜姓名 trim 口径不统一** → 年度表把同一个人拆成两行（一行「未发 = 全额」，一行「已发、未发为负」），
   或整年出勤被静默归零（`应发 KPI = 0`）。可复现，改一个函数 + 4 处调用即可。
2. **A-2｜发放金额入库不 `round2`** → 亚分金额下「已发 ¥A + 待发放 ¥C = ¥总计」这条**印在界面和打印件上的等式**
   和「明细各节小计之和 = 表尾总计」会**差 0.01**（复现输出见 A-2）。1 行修法 + 1 条用例。
3. **B-1｜`round2()` 的 `Number.EPSILON` 修正基本无效**：`n + EPSILON` 只在 `0 ≤ n < 2` 时改变 `n`，
   而 JS 的 `Math.round` 对负半分向 +∞ 取整 → **负数方向相反**；同模块内 `2.675→2.68` 进位、
   `8.075→8.07` 不进位。它的注释与 `tests/wage.test.ts:35-40` 只锁了 4 个「正数、小数」样例，恰好全绿。

---

## 二、A 级（确认缺陷）

### A-1 姓名比较口径不统一：人员姓名不 trim，发放 owner / Excel 导入 trim，年度汇总只在一侧 trim

**证据（文件:行）**

| 位置 | 行为 |
|---|---|
| `src/routes/people.tsx:489` | `onChange={(e) => set("name", e.target.value)}`，`save()`（`people.tsx:402-423`）只规范化 `idValidFrom/To`，**姓名原样入库** |
| `src/routes/payments.tsx:480`、`:492` | `const who = (c.owner \|\| "").trim();` → 发放的实际收款人**保存时被 trim** |
| `src/lib/excel/common.ts:116-119` | `pick()` 返回值一律 `String(row[k]).trim()` → Excel 导入的姓名/收款人都被 trim |
| `src/lib/attendance-summary.ts:144` | `(x.owner \|\| "").trim() === person.name` —— **只 trim 左侧**，右侧 `person.name` 是原始值 |
| `src/lib/attendance-summary.ts:98`、`:145` | `a.name === person.name`（两侧都未 trim） |
| `src/lib/attendance-summary.ts:172`、`:215` | `people.find((p) => p.name === name)`（左侧是 trim 过的 owner）、`rows.some((r) => r.person.name === (p.owner \|\| "").trim())` —— 同一处不对称 |

**复现 1：同一个人被拆成两行（人员名带尾空格，发放 owner 是 trim 形式）**

```ts
// 依据 src/lib/attendance-summary.ts 的真实源码运行（node --import tests/register.mjs）
import { summarizeYear } from ".../src/lib/attendance-summary.ts";
const people = [{ name: "张三 ", /* 其余字段见 tests/wage.test.ts 的 person() */ }];
const attendance = [{ year: 2026, month: 3, name: "张三 ", days: 20 }];   // 考勤表内姓名与人员表一致
const payments   = [{ owner: "张三", receiver: "", date: "2026-03-10", amount: 6000 }];
summarizeYear({ people, attendance, payments, year: 2026, fallbackYear: 2026 }).rows
```

实测输出（`/tmp/gdrev/repro1.mts`）：

```
rows = [
  { name: '"张三 "', paid: 0,    unpaid: 6000,  pay: 6000, remark: '' },
  { name: '"张三"',  paid: 6000, unpaid: -6000, pay: 0,    remark: '本年无考勤记录' }
]
should = 6000  paid = 6000  rowsPaidSum = 6000  orphan = { count: 0, amount: 0 }
```

→ 考勤页「年度工资汇总」/ 总览同一张表上，**同一个人出现两行**：一行「全年 6000 / 已发 0 / 未发 6000」，
另一行「全年 0 / 已发 6000 / **未发 −6000**」并备注「本年无考勤记录」。用户看到的是负数未发与重复人名。

**复现 2（更严重）：出勤被静默归零、`应发 KPI` 丢钱**

人员名 `"张三 "`，考勤来自 Excel 导入（`pick` 已 trim → `"张三"`）：

```
年度表行数 = 1  应发 KPI = 0  已发 KPI = 6000
行 = [ { 姓名: '张三', 全年工资: 0, 已发: 6000, 未发: -6000, 备注: '本年无考勤记录' } ]
月度卡「有内容」行数 = 1   → 但年度表里这个人出勤 = 0
```

→ 月度卡把 3 月标成「已录入」（`monthStatus` 只按 year/month 过滤，不看姓名），
年度表却认为这人整年没考勤（`worked` 用未 trim 的姓名精确匹配）→ **应发合计少算这个人的全部工资**。

**影响面**：`src/routes/index.tsx:20`（总览 KPI「应发合计/已发放/待发放」）、考勤页年度表、
Excel 整本导出的「汇总/工天加班」sheet（`src/lib/excel/full.ts:246/251/256` 同样是未 trim 精确匹配）、
以及打印件。是一处**静默**错误（没有任何提示，也没有 `console.warn`）。

**为什么 `pnpm test` 全绿**：`tests/attendance-summary.test.ts` 的 9 个用例 fixture 全部用干净姓名
（`"张三"`/`"李四"`），没有任何用例覆盖「姓名/收款人带首尾空格」。

**建议本轮修。最小修法**（三选一，推荐第 1 个）

1. 在 `src/lib/receiver.ts` 旁边加一个唯一实现 `nameKey(s: unknown): string = String(s ?? "").trim()`，
   把全部按姓名比较的地方换成 `nameKey(...) === nameKey(...)`：
   `attendance-summary.ts:98/144/145/172/215`、`excel/full.ts:190/246/251/256/279`、
   `excel/common.ts:323`、`excel-import.tsx:86/184/219`、`query.tsx:76/101/127/360`。
2. 或在 `store.upsertPerson`/`addPerson`（`src/lib/store.ts:336-355`）与人员表单保存处 `name: name.trim()`，
   并对存量数据做一次性清洗（**动存量要迁移，所以不如第 1 条安全**）。
3. 加守卫：`tests/caliber-guards.test.ts` 里扫 `src/lib/attendance-summary.ts`、`src/lib/excel/full.ts`，
   禁止出现 `.name ===` 两侧未包 `nameKey(`/`.trim()` 的比较（沿用该文件既有的源码扫描风格）。

---

### A-2 发放金额入库不 `round2`：印在界面/打印件上的「已发 + 待发 = 总计」等式会差 0.01

**证据（文件:行）**

| 位置 | 行为 |
|---|---|
| `src/routes/payments.tsx:492` | `amount: Number(c.amount) \|\| 0` —— **不入 `round2`**（输入框 `type="number"` 无 `step`，`:569`） |
| `src/lib/excel/payments.ts:27` | Excel 导入 `amount: parseNumber(...)` = `numOr(v,0)` —— **也不入 `round2`** |
| `src/components/expense-editor.tsx:207`（对照） | 报销入库**有** `amount: round2(c.amount \|\| c.qty * c.price)` |
| `src/lib/contracts.ts:124`（对照） | 合同明细 `numOrWarn(e.amount, 0, …)` —— 同样**不** round2 |
| `src/lib/payments-stats.ts:131-134` | `sumAmount` 注释写着「统一 round2，**保证 A + C 与总计逐分相等**」 |
| `src/routes/payments.tsx:389-390` | 界面/打印件上直接印出 `已发 ¥A（…） + 待发放 ¥C = ¥total` 这条等式 |

**复现**（`/tmp/gdrev/repro5.mts`，两笔 0.005 元）

```ts
const rows = [
  { owner: "甲", receiver: "甲", date: "2026-01-05", amount: 0.005 },  // 已发
  { owner: "乙", receiver: "乙", date: "",           amount: 0.005 },  // 待发放
];
paymentSummary(rows);  detailSections(rows, "__all__");  printSummary(rows, "__all__");
```

实测输出：

```
A(已发)= 0.01  C(待发)= 0.01  总计= 0.01  A+C= 0.02   相等? false
明细各节之和 = { count: 2, amount: 0.02 }  printTotals = { count: 2, amount: 0.01 }
汇总各行之和 = { count: 2, amount: 0.02 }
```

→ 发放页顶部/打印清单口径行会印成 **「已发 ¥0.01 + 待发放 ¥0.01 = ¥0.01」**；
明细清单**各节小计相加（0.02）≠ 表尾总计（0.01）**。`payments-stats.ts` 的模块注释与
`tests/payments-stats.test.ts`（fixture 全是整数元）都宣称这条恒等式成立，实测在亚分金额下不成立。

**可达性**：① 表单手填 `0.005`（`Number("0.005")` 直通）；② Excel 导入的「发放金额(元)」单元格是公式结果
（如 `1234.567`）时 `parseNumber` 原样入库；③ `mergePayments` → `replacePayments` 不做任何取整
（`src/components/excel-import.tsx:309/318-319/552`）。

**影响面**：发放页汇总行、两种打印清单的小计与总计、以及 `attendance-summary` / 总览 KPI 的
「已发放 / 待发放」两个数字（都走同一份 `round2` 分组求和）。金额本身只差 1 分，
**危害在于「对账等式对不上」**——现场对账时用户会认为系统算错。

**建议本轮修。最小修法**

1. 写入端统一取整（1 行/处）：`payments.tsx:492` → `amount: round2(Number(c.amount) \|\| 0)`；
   `src/lib/excel/payments.ts:27` → `round2(parseNumber(...))`；`src/lib/contracts.ts:124` → `amount: round2(numOrWarn(...))`
   （`normalizeEntry` 是合同明细的唯一入口：`store.addContractEntry/updateContractEntry`（`store.ts:472-482`）与 Excel 导入（`excel/contracts.ts:135/178/185/192`）都经它，改这一处即覆盖三条路径）。
   ⚠️ 改前先确认 `tests/roundtrip/run.ts` 的 70 个对拍用例不会因此变红（金额取整会改出参）。
2. 或者把 `sumAmount`/`paymentSummary` 改成**先取整到分再分组求和**（`Σ round2(amount)`），
   并加一条固定用例：`[{amount:0.005, date:"…"},{amount:0.005, date:""}]` 断言 `paidAmt + pendingAmt === total`。
3. 二者取其一即可，**不要两边都做**（会出现「存的是 0.005、算的是 0.01」两套口径）。

---

## 三、B 级（风险隐患，含推理链）

### B-1 `round2()` 的 `Number.EPSILON` 修正只在 `0 ≤ n < 2` 成立；负数方向反、半分进位不可预测

`src/lib/wage.ts:189-191`：

```ts
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
```

实测（`/tmp/gdrev/repro2.mts`，直接 import 源码）：

```
round2(1.005)= 1.01   round2(-1.005)= -1     round2(-2.675)= -2.67
round2(1234567.005)= 1234567          round2(1005000000.005)= 1005000000.01
round2(0.005)= 0.01   round2(-0.005)= 0 (显示为 -0)
round2(8.075)= 8.07   round2(1.335)= 1.34   round2(10.235)= 10.24
```

**推理链**（下面每个数字都是实测的，`/tmp/gdrev/repro2.mts` + `node -e`）

- `Number.EPSILON = 2.22e-16` 是**绝对量**，而浮点间距 `ULP(n)` 随量级增长。
  `n + EPSILON` 只在 `|n| < 2`（`ULP(n) ≤ EPSILON`）时才真的改变 `n`，实测：

  ```
  2.675 + EPSILON === 2.675       → true（这一项对它是恒等操作）
  8.075 + EPSILON === 8.075       → true
  1234.5678 + EPSILON === 1234.5678 → true
  1.005 + EPSILON === 1.005       → false（只有它真的被修正了）
  ```

  也就是说：**对 ≥ 2 元的金额，这行"修正"其实什么都没做**，进位与否完全取决于 `n*100` 的二进制值
  落在 `x.5` 的哪一侧：`2.675*100 = 267.5`（刚好落在边界 → 进位 2.68）、
  `8.075*100 = 807.4999999999999`（差一线 → 退成 8.07）、`10.235*100 = 1023.5`（进位 10.24）。
  同一套「半分进位」规则在同一模块里给出三种不同结果 —— 口径不自洽。
- 负数侧方向相反：`(-1.005 + EPSILON)*100 = -100.49999999999997`，而 JS 的
  `Math.round(-100.5) === -100`（向 +∞ 取整），于是**负的半分永远向零退** → `round2(-1.005) = -1`
  （正数是 1.005 → 1.01）。负数金额**不是异常数据**：`monthPay().pay`（扣款 > 应发时）、
  `contractRollup()` 的 `remain`（开票 − 已付）与 `dueRemain`、`attendance-summary` 的 `unpaid`、
  `paymentSummary` 的差额都可能是负数。
- 结论：模块注释「带 EPSILON，边界值不进位丢失」的实际有效区间是 `0 ≤ n < 2`；
  `tests/wage.test.ts:35-40` 断言的 4 个值里，`1.005` 恰好落在有效区间、`2.675/0.1+0.2/1234.5678`
  恰好落在「本来就能进位」的一侧 —— 所以测试是绿的，而 `8.075→8.07` 这种同型输入没被覆盖。

**影响**：单笔偏差 ≤ 1 分，**但方向不可预测**（同一份数据在屏幕/打印/Excel 导出三处用到 `round2` 的地方
若输入路径不同，可能一个进一个退）。对账场景下"差一分"本身就是可信度问题；金额越杂（含折扣、比例、折算）
命中的概率越高。**不是**「金额越大偏差越大」（大金额下 EPSILON 是恒等操作，行为退化成裸 `Math.round`）。

**建议本轮修（成本极低）。最小修法**：把修正量改成与量级相关并对负数取绝对值，然后补 3 条断言：

```ts
export function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const sign = n < 0 ? -1 : 1;
  const cents = Math.round(Math.abs(n) * 100 + 1e-6); // 1e-6 = 半分钱量级下的容差
  return (sign * cents) / 100;                        // 顺带消掉 -0
}
```

取舍要说清：`1e-6` 是**「按十进制直觉半个分进位」**的容差，代价是「真值恰好 8.074999x 元」也会进位成 8.08
（二进制浮点没有完美解，两害相权取「与测试/业务直觉一致」）。补断言：
`round2(-1.005) === -1.01`、`round2(8.075) === 8.08`、`round2(1234567.005) === 1234567.01`
（再加 `Object.is(round2(-0.001), -0)` 之类的 `-0` 断言更好）。

**留待后续的部分**：真正干净的解法是全库改成**整数分**（所有金额以 `cents` 存取），
属数据格式变更，按 AGENTS.md「不要顺手夹带」的约定另排期。

### B-2 工资条的收款人判定是**第三/第四份实现**，且源码守卫的正则匹配不到它

`src/routes/query.tsx`（工资条「已打款合计（本人）/ 代收他人 / 他人代领」三步判定）：

```
query.tsx:101:  if (x.owner !== name && x.receiver !== name) return false;   // 记录是否进这个人的工资条
query.tsx:127:  const collected = pays.filter((x: any) => x.owner !== name)…
query.tsx:360:  if (x.owner !== name && x.receiver !== name) return false;     // 打印路径再来一遍
```

- 这里**没走** `src/lib/receiver.ts` 的 `receiverOf()`（口径：空/空白 = 同实际收款人，且 trim），
  而 `query.tsx:126`、`:129` 的另外两步**走的是** `isPaidSelf()`。**同一个函数里两套判定**。
- 具体后果：一笔「owner=李四、receiver=`"张三 "`（尾空格）」的记录，
  `receiverOf` 认作「张三代收」，而 `:101` 的裸比较把它判成「既不是张三也不是李四的 → 丢掉」，
  于是**这笔代收在张三的工资条上整条消失**（打印件同样）；发放页/汇总里它仍然算「张三名下代发」→ 两处对不上。
- **守卫为什么没拦住**：`tests/receiver-and-editor-guards.test.ts:50-62` 的正则是
  `\b[\w.]*owner\b\s*!==?\s*\b[\w.]*receiver\b`（右侧必须是标识符 `receiver`）。
  我对三个受管文件实跑该正则（`/tmp/gdrev/guard.mjs`，逐字复制守卫里的两条正则）：

  ```
  src/routes/query.tsx → 现有守卫匹配数 = 0 []
  src/routes/payments.tsx → 现有守卫匹配数 = 0 []
  src/components/payment-sheets.tsx → 现有守卫匹配数 = 0 []
  query.tsx:101: if (x.owner !== name && x.receiver !== name) return false;
  query.tsx:127: const collected = pays.filter((x: any) => x.owner !== name)…
  query.tsx:360: if (x.owner !== name && x.receiver !== name) return false;
  ```

  → 守卫「0 命中」是**假绿**：它扫的是 `owner !== receiver` 这一种写法，而真实残留的写法是
  `owner !== name && receiver !== name`（右侧是 `name`）。`<Can>`/权限那类守卫型测试都依赖这种源码正则，
  这一条说明了它的失效模式：**同一个判断换个右操作数就绕过**。

**建议本轮修。最小修法**：
① `query.tsx:101/360` 改成 `if (receiverOf(x) !== name && (x.owner || "").trim() !== name) return false;`（或直接 `nameKey`）；
② `:127` 的 `collected` 改成 `pays.filter((x) => (x.owner || "").trim() !== name)`；
③ 守卫正则加上 `owner` 与 `name`/`receiver` 混用这一型：
`/\bowner\b\s*!==?\s*(?:[\w.]*\.)?(?:name|receiver)\b(?!\s*\()/` —— 注意要**白名单** `receiverOf(` 调用，
否则会把正确写法也报红；更稳的做法是「页面里不许出现 owner/receiver 的 `!==`/`===` 比较，只许调用 lib」，
与新加的 `nameKey` 一起扫（见 A-1 的修法 3）。

### B-3 保单期结束为空时，全员保费结算静默变成 0

`src/lib/insurance.ts:22-32`（`memberDays`，人天照算）与 `src/lib/insurance-stats.ts:27-30`：

```ts
const periodDays = policy ? daysBetween(policy.periodStart, policy.periodEnd) : 0;   // 结束为空 → 0 天
const perPersonDaily = periodDays > 0 ? (policy?.premiumPerPerson || 0) / periodDays : 0;
```

- `emptyPolicy()`（`insurance.ts:51-67`）的默认 `periodEnd: ""`；`insurance.tsx:558-563` 的「保险期结束」是
  可留空的时间字段 → **用户完全可能建一张「起期已填、结束未填」的在保中保单**。
- 此时：`memberStats().personDays` **> 0**（人天按 `m.endDate || today()` 算），而 `settle` **恒为 0**。
  界面上「累计人天 120 / 保费合计 ¥0.00」并列出现，**没有任何提示**，也没有 `console.warn`。
- 这个行为**已被测试锁定**：`tests/insurance-stats.test.ts:116-118`
  「保单期结束为空 → 保险期 0 天、每人每天 0（不按『到今天』算）」—— 但它锁定的是**实现细节**，
  没写清「用户会看到 0 保费」这一后果，也没提示 UI 需要给出警示文案。
- 对比：`src/routes/insurance.tsx:360` 的保单卡片「累计人天」用的是 `memberDays` 直接相加（不经 `round2`），
  与人天字段同源，所以这里不是数据问题，纯粹是**保费静默归零**。

**建议本轮修（口径已定，只需补提示）。最小修法**：在 `insurance-stats.ts` 的 `MemberCalc` 上加一个
`settleUnavailable = periodDays <= 0`（或让 `memberCalc` 返回 `{ days, settle, perPersonDaily, periodDays }`），
保险页在「保费合计」旁显示一行警示：「保险期结束未填（或起止相同）→ 每人每天保费为 0，结算金额暂按 0 显示」；
打印件同源带上这句。**不要改 `memberDays`**（唯一实现，改它会改口径）。

### B-4 负出勤天数：工资算出负数，而「有内容」判定认为这天「没有内容」

- 录入端：`src/routes/attendance.tsx:423-425` 的 `patch()` 对 `days > 31` **只 `toast.warning` 不拦**，
  负值更是静默通过（`Number(value) || 0`）。
- 计算端：`monthPay({days:-5}, {dailyWage:300, mealAllowance:12})` 实测输出
  `{"days":-5,"base":-1500,"meal":-60,"pay":-1560}`（`/tmp/gdrev/repro2.mts`）→ 负工资。
- 判定端：`src/lib/work.ts:10-18` 的 `hasWork` 是 `(a.days||0) > 0` —— 负数天数**不算有内容**；
  `hasContent` 只在「有备注」时才补上。于是：
  - 月度卡/「已录月份」（`dates.ts:140-160` 的 `monthStatus` + `attendance-summary.ts:92-94`）判它「空表」；
  - 年度表（`attendance-summary.ts:145` 的 `worked`）整行不出现该人；
  - 但月度表页脚（`attendance.tsx:415` 的 `totalPay`）与 `personMonths`（`attendance-summary.ts:97-118`，
    **不过滤 hasContent**）都会把 −1560 算进去。
  → 同一份数据「屏幕说空表、页脚是负数、年度表没有这个人」。
- 这与 `work.ts` 里刻意区分的 `hasWork`（工资口径）/`hasContent`（有没有记录）**不矛盾**，
  矛盾在 `personMonths` **不判 hasContent 就算钱** —— 两处过滤条件不一致。

**建议本轮修。最小修法**：① 录入端把 `days < 0` 与 `days > 31` 一并拦下（`toast.error` + 不写值），
或至少把 `days < 0` 也 warn；② 若要保留负天数（冲正场景），就把 `hasWork` 改成 `!== 0`
（但那会改**工资口径**，需同时改 `tests/wage.test.ts` 的 `hasWork` 断言——**属口径决策，建议先问用户**）。
**更保守的修法**：只统一 `personMonths` 与 `worked` 的过滤条件（都用 `hasContent`），
让「年度表有没有这个人」与「算不算他的钱」永远一致。

### B-5 `/api/backup`：内容不做任何类型校验，且能覆盖固定名「最新备份」

- `src/routes/api/backup.ts:25-35`：只校验大小（≤50MB）与「非 0 字节」，然后
  `saveBackup(buf, fname)`；权限只要 `export.use`。
- `src/lib/nas-fs.server.ts:273-293`：`saveBackup` 把上传内容写成 `backups/<时间戳>_考勤表.xlsx`
  **和固定名** `backups/考勤表.xlsx`（后者被 `isManagedBackupFile` 排除在清理之外，永不自动删）。
- 后果：任何有 `export.use` 的账号（普通成员常有）POST 一段任意字节，就顶掉「最新备份」这个入口的内容，
  且**没有任何内容校验**（连 `PK\x03\x04` 的 xlsx 魔数都不查）→ 用户点「下载最新备份」拿到的是垃圾。
  另外 30 份 × 50MB 上限 = 最多约 1.5GB 的写入配额可被反复占满（`pruneBackups` 只删旧的时间戳文件）。
- 不可否认性/权限侧的审计问题（备份/影像操作是否留痕）已由 `安全工程师.md` F-03 覆盖，本条只讲**内容完整性**。

**建议本轮修。最小修法**：`backup.ts` 写盘前查魔数
`if (!(buf[0] === 0x50 && buf[1] === 0x4b)) return 400 "备份文件不是 .xlsx（缺少 ZIP 头）"`，
并只允许覆盖**固定名**那一份（时间戳文件由服务端生成，不受影响）；同时把权限从 `export.use`
改成 `export.use` + `settings.data`（备份是「数据管理」动作，与导出不是一回事）。

## 四、C 级（改进建议，含取舍）

### C-1 `sumContractRollups` / `expenseTotals` 不做 `round2`（与其它模块不一致）

`src/lib/contracts-totals.ts:36-67` 与 `src/lib/expenses-stats.ts:66-77` 是裸 `+=` 累加，实测
`sumContractRollups([{contractAmount:0.1},{contractAmount:0.2}])` → `amount = 0.30000000000000004`
（`/tmp/gdrev/repro4.mts`），而同族的 `payments-stats.ts:132-134` / `insurance-stats.ts:59-60` 都 `round2`。
**目前不构成可见缺陷**：屏幕上所有出口都走 `money()`（`src/lib/utils.ts:29-35`，`toLocaleString` 最多 2 位小数，
`contracts.tsx:531-539` 的 `Mini` 也走它），所以 0.30000000000000004 显示成「0.30」。
**建议留待后续**：统一在累加结束处 `round2`（与 `contracts-totals.ts:72` 的 `contractPayable` 一起），
目的是「函数返回值本身就是可直接比较的金额」，避免以后有人拿它做 `===` 对拍时踩灰。

### C-2 类型断言滥用（`as any` / `as Tenant`）

| 位置 | 断言 | 说明 |
|---|---|---|
| `src/lib/attendance-summary.ts:93` | `monthStatus(attendance as any, year, i + 1)` | `MonthAttendance` 与 `{year,month}` 交叉类型不匹配被 `any` 掩盖；应让 `monthStatus` 的入参类型放宽成 `{year:number;month:number} & Partial<MonthAttendance>` |
| `src/lib/accounts.server.ts:751` | `if (!persistOn()) return fn({} as Tenant)` | 本地（无 `DATA_DIR`）模式把空对象当 `Tenant` 交给回调；回调里 `t.user` 是 `undefined`，靠各处 `?.` 兜着。改成显式类型（如 `Tenant` 的字段全可选）或 `fn(EMPTY_TENANT)` 常量 |
| `src/routes/query.tsx:127/129` | `pays.filter((x: any) => …)` | 该函数上游 `buildSlips` 的 `pays` 是手搓映射（已丢类型），建议给它一个 `SlipPay` 接口 |

**留待后续**。**取舍**：这些断言**当前没有引发缺陷**（我逐个追了调用方），属可维护性债；其中 `monthStatus` 那条最容易顺手修。

### C-3 `filterPayments` 在「唯一实现模块内部」又写了一遍 `isPaid`/`isPending`

`src/lib/payments-stats.ts:120-121`：

```ts
if (f.status === "pending") list = list.filter((p) => !p.date);
if (f.status === "paid") list = list.filter((p) => Boolean(p.date));
```

同文件 `:67-74` 刚定义了 `isPaid`/`isPending`（口径是「有没有发放日期」）。改一处忘另一处就会出现
「筛选出的条数」与「汇总笔数」不同——这正是本模块要防的那一型。**建议本轮修**（4 个字符的改动）：
改成 `filter(isPending)` / `filter(isPaid)`，并在 `tests/payments-stats.test.ts` 加一条
「`filterPayments(status:'paid').length === paymentSummary(rows).paidCount`」。

### C-4 500 日志记录完整 URL（含查询串里的姓名）

`scripts/app-server-index.mjs:387`：`logLine("error", "请求处理失败", { url: req.url, method, error })` ——
用的是 `req.url`（含 query），而慢请求/5xx 那条（`:273`）用的是 `safePath(req.url)`（只有 pathname）。
`/api/photo?name=张三&kind=id`（`src/routes/api/photo.ts:17`）与 `/api/photo-file?name=…`
会把**姓名**写进 `data/logs/YYYY-MM-DD.log`。属 CWE-532（敏感信息写日志）的低危形态：
日志在 NAS 上可被更多角色看到，而姓名本身在台账里也是敏感数据。
**建议本轮修（1 行）**：`:387` 也改用 `safePath(req.url)`。

### C-5 保单「在保」判定在路由里重写了一遍

`src/routes/insurance.tsx:335`：`const polActive = p.periodEnd ? p.periodEnd.slice(0, 10) >= today() : true;`
与 `src/lib/insurance.ts:35-39` 的 `isActive()` 是同一口径的第二份实现（`isActive` 只读 `endDate`，
把它参数类型放宽成 `{endDate?: string}` 就能复用）。**建议留待后续**（当前两份行为一致，属结构债）。

### C-6 `insurance.tsx` 的「累计人天」直接相加（未 `round2`）

`src/routes/insurance.tsx:360`：`pm.reduce((s, m) => s + memberDays(...), 0)` —— 与
`insurance-stats.ts:59` 的 `round2(members.reduce(...))` 是两个出口。人天已各自 `round2` 到 2 位，
大量相加可能出现 `1234.5600000000002` 这类显示灰（`daysBetween` 会产出 `0.04` 这种非二进制友好值：
`(2026-01-01 08:00 → 18:00) = 0.42`）。**建议留待后续**：卡片那一行也走 `memberStats`/`round2`。

---

### C-7 文档上传无扩展名白名单（纵深防御；嗅探型 XSS 已被 `nosniff` 挡住）

- 我**最初怀疑这里有同源 XSS，复核后否掉**：启动器对**所有**响应兜底注入
  `x-content-type-options: nosniff`（`scripts/app-server-index.mjs:361`，第 1 层静态文件处还有一处 `:103`），
  所以「上传 HTML 改名成 .png 让浏览器嗅探执行」这条路不通。
- 仍存在的是**类型混淆＋无白名单**：`src/routes/api/doc.ts:26-36` 的 `MIME` 表把 `.xml` 映射成
  `application/xml`、`.ofd` 成 `application/ofd`，全部按 `Content-Disposition: inline` 返回（`:52-59`）；
  **上传端不校验扩展名**（`:64-96` 只看 body 大小与文件名长度），任何扩展名/任意字节都能进 `data/photos/合同扫描件/` 等目录。
  未识别扩展名会落到 `application/octet-stream`（会走下载），`.xml` 会在同源以 XML 树方式渲染 —— 不执行脚本，
  但用户会看到一个不像「影像」的页面。照片侧反而是安全的：`savePhoto` 用 MIME 白名单推扩展名
  （`assets.server.ts:318-319`，非 png/webp/bmp 一律存成 `.jpg`，并按 `:279` 的 MIME 表返回）。
- **留待后续**（低成本、低收益）：上传端加扩展名白名单（`pdf/ofd/xml/jpg/jpeg/png/webp/xlsx/xls`，超出即 400 并给可读原因），
  既防呆也把「inline 呈现」的面收窄到业务真的需要的类型。

---

## 五、`tests/` 断言是否真兜得住（只列结论与证据）

| 断言/守卫 | 名不副实之处（本轮实测） |
|---|---|
| `tests/receiver-and-editor-guards.test.ts:50-62`「不许再用裸比较 `owner !== receiver`」 | 正则对 3 个受管文件**0 命中**，而 `query.tsx:101/360` 的 `owner !== name && receiver !== name` 就在同一个文件里 → **假绿**（见 B-2） |
| `tests/wage.test.ts:35-40`「round2 带 EPSILON，边界值不进位丢失」 | 只断言 4 个**正数小数**；负数（−1.005→−1；正确应为 −1.01）、大数（1234567.005→1234567.00）、`8.075→8.07` 都不覆盖（见 B-1） |
| `tests/payments-stats.test.ts`「A + C == 总计（金额）」「明细=汇总=总计」 | fixture 金额全为整数元；亚分金额下实测**不成立**（0.02 vs 0.01，见 A-2） |
| `tests/attendance-summary.test.ts`（9 例） | 姓名 fixture 全为干净字符串；**没有任何**带首尾空格的用例 → A-1 完全在覆盖之外 |
| `tests/insurance-stats.test.ts:116-118`「保单期结束为空 → 每人每天 0」 | 锁定了实现，但没锁定「界面会显示 0 保费且无提示」这一后果（B-3） |
| `tests/insurance.test.ts` / `dates.test.ts` / `idcard.test.ts` / `num.test.ts` / `book-quota.test.ts` / `backup-retention.test.ts` / `contracts*.test.ts` | 抽查后**未发现虚假断言**：边界（`2026-02-31`、平年 2/29、非法年月、16/17 位身份证、`(1,200)`→−1200、超额建台账、只删自生成备份名）都真实覆盖，且带坏样本自检。这部分质量很好。 |

> 方法说明：我把「源码正则型守卫」逐个拿去对真实源码实跑（`/tmp/gdrev/guard.mjs`），
> 只有 `owner !== receiver` 那一条 0 命中；`work.ts` 的 `hasContent` 系列守卫（`caliber-guards.test.ts`）
> 命中数与预期一致，属**真守卫**。

---

## 六、安全要点（只列 `安全工程师.md` 未覆盖的部分，CWE 编号）

| # | 结论 | CWE | 证据 | 建议 |
|---|---|---|---|---|
| 1 | 备份内容不校验、可顶掉固定名「最新备份」 | CWE-434 / CWE-345 | `src/routes/api/backup.ts:14-35`、`nas-fs.server.ts:273-293` | 见 B-5（建议本轮修） |
| 2 | 500 日志写完整 URL（含姓名查询参数） | CWE-532 | `scripts/app-server-index.mjs:387` vs `:273` | 见 C-4（建议本轮修） |
| 3 | 文档上传无扩展名白名单（`nosniff` **已由启动器全局注入**，嗅探型 XSS 不成立） | CWE-430（纵深） | `src/routes/api/doc.ts:26-36,52-59,64-96`；`scripts/app-server-index.mjs:361` | 见 C-7（留待后续） |
| 4 | 敏感数据读取的授权面：我复核了 `GET /api/ledger`（`people.view`，`ledger.ts:60-71`）、`/api/file/$kind` 导出（`export.use` + 模块 `*.view`，`file/$kind.ts:173-192`）、`/api/doc`（`kindView`）、`/api/photo*`（`people.view`）、`/api/audit`（`audit.view`）—— **未发现授权绕过**；`withTenant` 的 `need` 覆盖完整 | — | 同上 | ⏭️ 无需改（结论：这一层是好的） |

---

## 七、最小修法汇总（按建议优先级）

| 优先 | 项 | 改动量 | 验收 |
|---|---|---|---|
| 1 | A-1 姓名比较收敛（`nameKey`） | lib 1 个函数 + 4 文件约 12 处 | 新增用例：姓名带首尾空格时年度表**只有一行**、出勤与已发都归位 |
| 2 | A-2 写入端 `round2`（发放/合同明细/Excel 导入） | 3 处各 1 行 | `pnpm run test:roundtrip` 仍 70/70 + 新增亚分金额恒等式用例 |
| 3 | B-1 `round2` 重写 | `wage.ts:189-191` + 3 条断言 | `round2(-1.005)/8.075/1234567.005` 三条新断言通过 |
| 4 | B-2 `query.tsx` 走 `receiverOf` + 守卫正则收紧 | 3 处 + 1 正则 | 守卫能对 `owner !== name` 报红（拿旧写法当坏样本自检） |
| 5 | C-3 `filterPayments` 复用 `isPaid/isPending` | 2 行 | 新断言「筛选条数 == 汇总笔数」 |
| 6 | C-4 500 日志改 `safePath`；B-5 备份魔数校验 + 权限 | 各 1-2 行 | 手工构造 500 后 `data/logs` 里无姓名；`POST /api/backup` 传文本 → 400 |
| 7 | B-3 保险页「保费为 0」提示 | 文案 + 1 个返回值 | 空 `periodEnd` 保单页面出现警示 |
| 8 | B-4 负天数拦截（或统一过滤条件） | 1 行（或口径决策） | 负天数录不进去；月表页脚与年度表口径一致 |
| — | C-7 扩展名白名单、C-1/C-2/C-5/C-6 | 零散 | **留待后续**（不改行为、不影响对账） |

---

## 八、与既有决策/其它审查的关系（不重复报）

- 「实体级存储」「容器 root + docker.sock」「`attendance.edit` 可整本写台账」「成员自建台账限 5 本」
  「A 组 4 项未验证」按 AGENTS.md「已决策」视为**取舍，不作为缺陷**（本报告未列入）。
- 安全侧 F-01～F-18（含 cookie `Secure`、scrypt、审计可改删、`/api/doc` 内联类型、供应链 `latest`）
  归 `docs/审查与报告/专家审查/安全工程师.md`，本报告不重复，仅在其未覆盖处补 3 条（§6）。
- 打印分页 / Excel 往返 / 权限 UI 相关结论归既有专项报告（`打印分页与省纸排查-20260916.md`、
  `口径一致性排查-20260916.md` 等），本报告只在「口径重复实现」范围内引用它们已固化的口径。

## 九、方法与局限

- **做过的**：逐文件读 `src/lib` 的 17 个目标模块 + `src/routes/api` 与 `src/routes` 的相关调用方；
  对每个可疑点写**真实源码复现脚本**（`/tmp/gdrev/repro1-5.mts`、`guard.mjs`，仅 import 源码、不写仓库文件）；
  跑三道本地闸门（typecheck / test / test:roundtrip）。
- **没做的**：① 未跑 `pnpm build`（会改入库产物 `app/`，与「只读」冲突）；
  ② 未起服务做端到端 HTTP 复现（A-2/B-5 的请求侧结论来自代码走查，金额/恒等式部分已用纯函数实测）；
  ③ 未读 `data/`（生产数据），所有复现都用自造 fixture；
  ④ 子代理权限固定，**未申请任何权限提升**（本次审查全程只读，不需要）。
- **置信度**：A-1 / A-2 / B-1 / B-2 / C-3 / C-4 为**已复现**（可直接照 §2-§4 的命令重跑）；
  B-3～B-6 / C-1 / C-2 / C-5 / C-6 为**代码走查 + 推理**，其中 B-3 的「测试已锁定该行为」已核对到行号。
