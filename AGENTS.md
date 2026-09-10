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

## 本次修复

- 自动保存请求改为串行，避免慢请求用旧快照覆盖新数据。
- 台账自动修复、照片上传、文档上传改为临时文件加原子替换。
- 文档上传失败时保留旧文件，避免先删旧文件后写入失败造成数据丢失。

## 已知部署风险

带一键更新功能的 Docker 配置挂载了 `/var/run/docker.sock`。这赋予应用容器较高的宿主机 Docker 控制能力。可信内网部署可以保留；不需要网页更新时，应移除该挂载并关闭对应更新入口。
