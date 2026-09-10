# 其他智能体须知

## 项目概况

这是一个基于 TanStack Start、React、TypeScript 和 Zustand 的工地台账应用。生产数据位于 `data/`，主要包含人员、考勤、工资发放、合同、报销、保险和影像资料。

## 修改前必须知道的约束

- API 写入必须经过 `withTenant(request, fn, need)`，并在当前台账上下文中执行。
- 全量台账包含身份证和银行卡等敏感字段。读取至少需要 `people.view`，整本写入需要 `ledger.manage`。
- 台账、账户和审计文件使用临时文件加 `rename` 原子写入。照片和文档上传也必须先写临时文件，再替换正式文件。
- 自动保存是整本台账快照，必须通过 `pushNasLedger()` 的串行队列，不能直接并发 PUT。
- 日期必须使用 `src/lib/dates.ts` 的解析函数；金额必须使用 `round2()`；工资计算必须集中在 `src/lib/wage.ts`。
- 修改数据模型时同步检查 `types.ts`、`store.ts`、`nas-sync.ts`、Excel 导入导出。
- 发版前运行 `pnpm exec tsc --noEmit` 和 `pnpm run build`。

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

## 仍待处理（已核实、未修）

- 照片/合同影像存的是全局目录（`PHOTO_DIR`，不含台账段），跨台账可互相读到、覆盖、删除；删除台账只删 `books/{id}`，影像残留。需要按台账分目录 + 一次性迁移。
- `readLedger()` 里的自动修复会整本写盘，不在写队列、绕过 CAS，可能与并发 PUT 抢写。
- `accounts.json` / `audit.json` 的临时文件名固定（`${target}.tmp`）且读改写无锁；解析失败被当成「没有账户」会显示「创建管理员」，可能覆盖残缺账户库。
- `saveDoc` 仍是先删旧文件再 rename（崩溃窗口会丢文档），与 `审查修复说明-20260910.md` 的说法不符。
- `photos.ts` 的 `setPhoto/deletePhoto` 不检查 `res.ok`，失败仍提示「已保存」。
- 仅需 `export.use` 即可导出含身份证/银行卡的人员表（预设「合同财务」没有 `people.view`）。
- `dates.ts` 的 `ymd()` 不校验「日」（`2026-02-31` 会入库并被 `daysBetween` 溢出放大）；`idcard.ts` 对 16/17 位静默通过。
- `/api/audit` POST 无权限位；HTTP 层无请求体上限（鉴权前就解析 body）。
- 说明文档落后：`使用说明.md`(1.2.22)、`说明.txt`(1.2.22)、`目录结构.txt`/`部署说明.txt`(1.2.20)、`程序文件说明.txt`（称仓库没有 .ts/.tsx）、`GITHUB上传说明.txt`（要求上传已删除的 `app/public/templates`）。

## 已知部署风险

带一键更新功能的 Docker 配置挂载了 `/var/run/docker.sock`。这赋予应用容器较高的宿主机 Docker 控制能力。可信内网部署可以保留；不需要网页更新时，应移除该挂载并关闭对应更新入口。
