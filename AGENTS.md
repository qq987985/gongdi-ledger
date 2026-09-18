# 工地台账 · 智能体协作入口

默认简体中文，先结果后必要解释；优先交付可运行、可编辑成果。在用户已授权范围直接完成可逆操作，保留他人已有修改。

## 先读与唯一来源

1. [开发规范.md](开发规范.md)：现行规则唯一正文；本文件仅关键约束摘要。
2. [docs/README.md](docs/README.md)：报告索引和当前未闭环项；按任务读相关文件，不全仓重复搜索。
3. [专家职责.md](docs/开发协作/专家职责.md)：专家选择、派工、所有权、复核与交付协议。
4. [README.md](README.md)：使用入口；软件版本以 VERSION.txt 第一行为准。

历史事故和旧规则已归档到 [整理前快照](docs/审查与报告/规范历史-20260918.md)，仅供追溯，不重新当命令执行。用户最新明确决策优先，变规则同步正文、摘要和测试。

## 项目与边界

- TanStack Start / React / TypeScript / Zustand。沿用现有结构，普通修复不夹带换框架、存储格式或依赖升级。
- data 是生产资料，含证件、银行卡、工资和影像；试验用临时 DATA_DIR，不读写生产样本作测试，不把资料输出到日志/仓库。
- src 是源码，app 和 routeTree.gen.ts 是生成物，不手工改。依赖只写精确版本，pnpm-lock.yaml 入库，初次安装 frozen-lockfile。
- 常规实现直接完成；缺关键业务决策时集中提问。没有授权不推送、部署、发版或迁移生产数据。

## 权限、存储和同步红线

- 业务接口用 withTenant(request, fn, need)；body 决定模块的上传走 gateTenant → 有限读取 → needDenied → runInTenant，先身份门禁再读 body。
- 台账外操作 resolveTenant(request) + 适用的角色/归属/同源校验。
  现例：`src/routes/api/auth.ts`、`src/routes/api/images.ts`、`src/routes/api/update.ts`。
  初始化/登录使用独立门禁；见 `tests/api-input-guards.test.ts`、`tests/auth-before-body.test.ts`。
- 全量 GET 至少 people.view，PUT 需 ledger.manage；前端 Can/Need/blockedWrite/blockedImport 不代替服务端权限。
- 文件临时写+rename，新文件就位后更新指针和清旧；坏台账/账户不当空数据覆盖。CAS和账户/审计读改写均串行，当前只支持单写进程。
- 影像新写入本台账目录；公共旧目录只兼容读。服务器失败或模式未知不回落无台账维度的本地影像；明确本地模式保留原存储。
- 自动保存只走 pushNasLedger 队列；GET/PUT 修订号同源 ledgerRevisionValue，空册用空串哨兵。
- 切册前 flush，失败保留原册；拉取期间禁普通推送，迟到响应不覆盖新册。空册重置，不灌旧册数据。
- seed:true 仅开机/登录后旧数据升级，切换/新建禁止；换号/退出/拉取401或403清本机台账缓存并作废在途请求。

## 数据和业务红线

- 日期 dates.ts，金额 round2，外部数值 num.ts，工资 wage.ts，年度统计 attendance-summary.ts；不在页面重算。
- 已发 isPaid，含代发，代发是已发子集；isPaidSelf 用于工资条本人视角及代发子集判定，不能替代全局已发条件。无日期待发当前年归集、单列。
- 同实体按 ID 增删改；历史姓名关联用 nameKey/ownerKey/receiverOf。改名用事务，重名不猜测合并。
- 变模型检查 types/store/nas-sync/excel 四层，另外检查 ledger-schema.server、备份恢复；schema 不是全部业务规则的替代。
- Excel 模板动态生成，字段同步示例/表头/说明/解析/导出；金额年份条数与重复导入幂等必须验证。
- 新写操作留审计；前后值 audit-diff 唯一实现，敏感值只记填写状态。

## 结构、界面与打印

- 存储 paths ← assets ← nas-fs；Excel common ← 实体 ← full；lib 不依赖 routes/components。types 保持叶子。
- 禁新增环；既有 update/docker ↔ update/log 例外仅按规范 §12.3。拆文件同步守卫路径，不机械追求行数。
- 外壳 components/shell，设置 components/settings，更新 lib/update；优先复用既有业务模块。
- 编辑器本地副本随记录ID重置；useGuardedClose 防误关，保存后 resetDirty。手机按 dvh 限高、按钮可到达。
- 改打印先读 styles.css“打印分页协议”：no-print/print-only 分离、thead 跨页、tfoot不重复、print-doc 自然分页。
- 打印量真PDF（约703px内容宽），不用屏幕A4宽度猜页数。

## 已决策，不反复当缺陷修改

- 成员可建 owner 台账，默认最多5本，管理员不限；MAX_OWNED_BOOKS 可覆盖，book-quota 唯一实现。
- attendance.edit 对应的整本快照写入机制保持；实体级权限/增量存储另做专项。
- 四套主题、现行版本进位和 app 入库继续沿用，改变须明确决策。
- 历史特殊环境曾决定不单独补测；若本次修改涉及相同行为，仍需相关验证，不是永久免测。
- 待决策/专项只在 docs/README.md 维护，不在本文件复制待办。

## 专家协作

按 [专家职责](docs/开发协作/专家职责.md) 选择合适角色；小改由主智能体完成，复杂数据/权限/跨模块任务在授权允许时安排独立复核，不每次启动全部专家。

派工写明目标、负责文件、禁止事项和验收证据；告知所有参与者不是唯一协作者。相同文件指定单一写入责任人；主智能体整合、复核建议并统一验证，不能把专家意见未经核实直接执行。

## 验证和交付

- 源码：pnpm run typecheck、pnpm test、pnpm run build，再 node scripts/build-stamp.mjs --verify，源码与app一起交付。
- Excel/模型/金额/恢复加 pnpm run test:roundtrip；正式发布/大重构用 pnpm run check 和相关环境验证。
- 页面测1440桌面、375手机，布局变化加390；打印用真浏览器/PDF。未跑不算通过。
- 纯文档跑相关守卫和事实/路径核对，不无意义重建。用例数以 `pnpm test` 输出为准，不重复基线计数。
- Node内置测试器：纯函数/临时目录服务端在tests，浏览器脚本在ci；扫描守卫须命中下限和坏样本自检。
- workflow 的 ci 模板与 .github 生效文件同步，权限以实际结果为准；发布依赖同一提交质量门禁。
- 报告放 docs/审查与报告，追加处理状态并更新索引。最终说明交付物、运行方式、实测/未验证、本地与线上状态。
