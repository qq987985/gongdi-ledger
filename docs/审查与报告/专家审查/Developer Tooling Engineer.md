# 专家审查 · 交付与运维工具链（Developer Tooling Engineer）

- **审查范围**：交付/运维工具链，**不评业务逻辑**。Dockerfile、`.github/workflows/docker.yml`、`.github/workflows/check.yml`（对照 `ci/check.workflow.yml`）、一键更新容器编排（`src/lib/update/*`）、启动器与静态服务（`scripts/app-server-index.mjs`）、`scripts/copy-output.mjs`、Windows 包（`win/pack.sh` + `win/*.bat`）、`tests/register.mjs`、`ci/*.mjs`、`.gitignore` / `.gitattributes`、发版与升级/回滚流程。
- **基线**：`VERSION.txt` 首行 `1.8.13`，HEAD `7674e24`，工作区干净（`git status --porcelain` 空）。
- **纪律**：只读审查。未改仓库里任何代码/配置/工作流；**未读写 `data/`**（所有实测都在 `/tmp/*` 里跑，见 §3 复现命令）；除本报告外未在仓库内产生文件。**刻意没跑 `pnpm build`**（它会重写被提交的产物 `app/` 与 `dist/`），第 2 条结论因此全部来自源码与 CI 配置的静态判定，并已在 §2 说明其可验证边界。
- **本机环境**：macOS，Node **v24.20.0**，pnpm **12.3.4**，TypeScript **7.0.2**（原生编译器）。**无 docker / 无 docker.sock、无 Windows 机器、无外网** → 凡涉及「镜像真的建得出来吗 / 容器真的换得过去吗 / ghcr 上到底有什么标签 / Release 实际状态」的结论，本报告一律只给代码级判定并显式标注「需真机复核」。

---

## 0. 闸门现状（我自己跑的，不是抄文档）

| 闸门 | 结果 | 备注 |
|---|---|---|
| `pnpm run typecheck` | **0 错误**，0.27s | 用的是 TS 7.0.2 原生编译器（`node_modules/.bin/tsc --version` = 7.0.2）。**已单独验证它不是空转**：在 `/tmp/tscheck/bad.ts` 写 `const x: number = "字符串"`，同一 tsc 报 `error TS2322` 且 exit=1 |
| `pnpm test` | **392 / 392 pass，0 todo**，2.06s | 与 AGENTS.md 记录一致 |
| `pnpm run test:roundtrip` | **70 / 70 pass** | 与 AGENTS.md 记录一致 |
| `pnpm build` | **未跑（故意）** | 见上；`app/` 与 `dist/` 是被提交/被生成的产物，只读审查不重写 |
| 闸门跑完后工作区 | `git status --porcelain` **空** | 测试不污染工作区（`tests/*.test.ts` 全部用 `mkdtemp(tmpdir)`） |

结论：**本地三道闸是真的、有效的**；问题出在**第四道闸（构建产物漂移）**和「闸门与发布链路之间没有连接」，见第 2 条。

---

## 1. 按风险排序的 5 条（Top 5）

### ① A · 启动器把「没设 `SLOW_MS`」解析成 **0** ⇒ **每一个 HTTP 请求都记一条「慢请求」**（含每个静态资源）
**建议本轮修**（一行代码 + 一条守卫）

- 证据（代码）：`scripts/app-server-index.mjs:164-168`
  ```js
  const SLOW_MS = (() => {
    const n = Number(String(process.env.SLOW_MS ?? "").trim());   // 未设 → "" → Number("") === 0
    return Number.isFinite(n) && n >= 0 ? n : 2000;              // 0 >= 0 成立 ⇒ SLOW_MS = 0
  })();
  ```
  对照同文件里另外两个环境变量解析都用的是「必须为正」的判据（`:152` `n >= 1`、`:158` `n > 0`），只有这一个写成 `>= 0`。
- 证据（实测，`DATA_DIR=/tmp/logtest PORT=4601 LOG_MAX_MB=0.0005 node app/server/index.mjs`）：
  - 启动行自己就把阈值打出来了：`{"event":"服务启动",...,"slowMs":0,"logLevel":"info"}`
  - 一次 **46ms** 的 `/api/health` 被记成慢请求：`{"level":"warn","event":"慢请求","method":"GET","path":"/api/health","status":200,"ms":46}`
  - 静态资源同样被记（另一次实测 `PORT=4603`）：`{"event":"慢请求","path":"/","ms":55}`、`{"event":"慢请求","path":"/assets/attendance-BsxZmFDG.js","ms":0}`
- 与文档/设计口径直接冲突：
  - `docs/使用与部署/常见问题解答(FAQ).md:147`：「**超过 2 秒**的慢请求会记进日志（`慢请求`）」；
  - `docs/审查与报告/架构优化方案-20260916.md:260`：候选 D 的落地口径「慢阈值 2000ms」；同文件 `:125` 明写这一步的目的是「**避免每次 GET 都写盘**」——这个 bug 恰好把目的反过来了。
- 影响面（为什么定 A）：
  1. **可观测性被稀释**：`data/logs/<date>.log` 变成请求流水（每请求 ~137B，实测 3 行=412B），真正要看的东西（真慢请求 / 5xx）淹没在里面；`LOG_KEEP_DAYS=14` 的保留窗口也会被这些流水吃掉。
  2. **撞 8MB 上限很快**：8MB ≈ 6 万行；页面加载本身是「1 个 HTML + N 个 assets」逐请求计费，`app/public/assets/` 里现有 29 个 `.js` + 1 个 `.css`。撞上限后启动器走的是**「当天停写」**分支（`:237-250`）并只往 stdout 打提示 —— 当天剩下的 5xx/慢请求就**只有 `docker logs` 里有、NAS 上翻不到**，而且这条路径与 1.8.4 定的「滚动 `.log.N`」口径不一致（见第 7 条）。
  3. **每个请求多一次同步写盘**：`logLine` 里是 `appendFileSync`（`:252`），由 `res.on("finish")` 触发（`:325`），落在 `data/logs/`（NAS 网络盘）上。`SLOW_MS=0` 让这条**同步**路径对 100% 的请求生效，在事件循环里阻塞后续请求处理（响应虽已发出，但同一个 loop 上排队的其它请求被推后）。
- 修法（最小改动）：
  ```js
  const SLOW_MS = (() => {
    const n = Number(String(process.env.SLOW_MS ?? "").trim());
    return Number.isFinite(n) && n > 0 ? n : 2000;   // 与 keepDays/maxLogMb 同款判据
  })();
  ```
  + 把 `shouldLog`/`MIN_LOG_LEVEL`/`keepDays`/`maxLogMb`/`SLOW_MS` 这五个解析挪成纯函数（可被 `tests/*.test.ts` 直接 import，或抽到一个 `scripts/` 下的模块），补一条「未设环境变量时 `SLOW_MS === 2000`」的用例。**这一条同时能修掉第 7 条的根因**（两套日志实现靠抽出来的同一份解析函数收敛）。

### ② A · CI 第四道闸（「构建产物不漂移」）**恒为真**，而 `latest` 镜像就是从这个产物目录发出去的 ⇒「忘了重建 `app/`」没有任何闸门拦得住
**建议本轮修**

- 证据（部署中的工作流）：`.github/workflows/check.yml:51-66`（第四步）
  ```sh
  pnpm run build
  APP_VER=$(head -n1 app/VERSION.txt | tr -d '[:space:]')
  SRC_VER=$(head -n1 VERSION.txt | tr -d '[:space:]')
  if [ "$APP_VER" != "$SRC_VER" ]; then … exit 1; fi
  for f in app/server/index.mjs app/server/server.js app/VERSION.txt; do [ -s "$f" ] || … exit 1; done
  if ! git diff --quiet -- app/; then echo "::warning::…"; git diff --stat -- app/; fi
  ```
- 为什么前两个判据**不可能失败**：`package.json:10` 的 `postbuild` → `scripts/copy-output.mjs:34-35` 在每次构建时把 `VERSION.txt` 复制进 `app/`，`:55` 再 swap 进 `app/VERSION.txt`。所以「先 `pnpm run build`，再比较 `app/VERSION.txt` 与 `VERSION.txt`」在结构上**永远相等**；三个文件的存在性检查同理（就是这一步刚生成的）。⇒ 这一步的唯一失败条件是 `pnpm run build` 自己失败。
- 唯一还能看出漂移的判据被降级了：`git diff --quiet -- app/` 现在只 `::warning`。这是**后来改的**，不是原设计：`git show 76b8099 -- .github/workflows/check.yml`（提交名「Refine CI workflow for type checking and builds」，2026-09-16 22:14，作者 GitHub 网页端）把原来的
  ```
  -      - name: 构建产物必须与源码同步
  -        run: |
  -          pnpm run build
  -          if ! git diff --quiet -- app/; then
  -            echo "::error::app/ 与 src/ 不同步——请本地跑 pnpm run build，把 app/ 一起提交"
  -            exit 1
  -          fi
  ```
  改成了版本号比较 + warning。
- 为什么这条仍然致命（不是「少一条提示」而已）：**发布链路只认这个产物目录**——
  `.github/workflows/docker.yml:31-38` 用 `docker/build-push-action` 从仓库根构建并 `push: true`，而 `Dockerfile:9-10` 只 `COPY app ./app` + `COPY VERSION.txt`，即**镜像内容 = 提交进仓库的 `app/`**，docker job 自己**不跑任何闸门**（无 `needs`、无 typecheck/test/build，两文件之间也没有依赖关系）。
  ⇒ 现实风险链：改了 `src/` → 忘了 `pnpm run build`（或 build 了没提交 `app/`）→ `check` 全绿（第四步恒真）→ 推 main 同时发布 `latest` 镜像 + Release → 用户点「一键更新」拉到的是**旧代码**，而 `VERSION.txt`/左下角已经是新版本号。这正是历轮报告反复想防的形态（版本号与实际行为不符）。
- 现状核对（说明这是「隐患」而不是「已经坏了」）：本仓库现在**没有**漂移 —— `app/VERSION.txt` 首行 = `VERSION.txt` 首行 = `1.8.13`，且 1.8.12/1.8.13 的打印改动确实在产物里（`grep -l "print-doc" app/public/assets/*.css`、`grep -o "padding:2mm 3mm"`、`grep -c "table-row-group"` 都命中）。所以这条是「闸门无效」而不是「产物是坏的」。
- 修法（二选一，取舍写在括号里）：
  1. **推荐**：`docker.yml` 的 image job 在 `docker build` 之前自己 `pnpm install --frozen-lockfile && pnpm run build`（并把 checkout 到的 `app/` 覆盖掉）。镜像由 CI 从源码现构建，`app/` 不再是「必须提交且必须同步」的东西，漂移风险从根上消失；代价是 image job 变慢（+1~2 分钟）。
     - 注意：`.github/workflows/*` 按 `开发规范.md §2` **不能在本地改**，这条必须走 GitHub 网页（做法见 `ci/README.md` 抬头）。
  2. 次选：把第四步的判据换成**跨环境稳定**的确定性判据，例如构建前后比对 `app/server/*.js` 的 sha256（先在 checkout 的 `app/` 上取哈希 → `pnpm run build` → 再取哈希 → 不等就 `exit 1`）。这样也能拦住漂移，但保留「`app/` 必须手提交」的负担。
- 附带说明：`ci/check.workflow.yml`（`ci/` 下的模板）与线上这份**已经不是同一份**（模板是 `exit 1` + node 22，线上是 warning + node 24 + timeout/concurrency），见第 9 条。

### ③ B · 一键更新「新容器起来了吗」只等于「`start` 返回 200」：老容器与老镜像**在没有任何健康校验的情况下被删掉**，回滚窗口为零
**建议本轮修**

- 证据（脚本顺序）：`src/lib/update/updater-script.ts`
  - `:52` 脚本自己先 `setTimeout(r, 2500)`；
  - `:57-58` 建新容器（临时名 `<name>-next`，**此时老容器还活着**——这段设计是对的，是 1.7.x 修出来的）；
  - `:61` 停老容器（留着准备回滚）；
  - `:63-70` 起新容器；**只有 `start` 抛错**才删新容器 + 把老容器拉回来（这条回滚只覆盖「起不来」）；
  - `:71-74` **紧接着**删掉老容器 → 把新容器改名为正式名；
  - `:77-88` 删掉上一个版本的镜像 → `log("更新成功，已启动 "+job.name)`。
  ⇒ 「`start` 成功、进程随后自己退出（数据目录不可写、环境变量不对、应用启动即抛）」「容器 Running 但服务没在监听」这两种最常见的坏情况**都不在判定里**：老容器已删、老镜像已删，日志却写「更新成功」。此时 Docker 只会按继承来的 `RestartPolicy`（compose 里是 `unless-stopped`）反复重启一个起不来的容器，现场表现是「点点点更新完了，页面打不开」。
- 证据（应用侧的存活探针也补不上）：`src/lib/update/apply.ts:149-164` 只 `setTimeout(2000)` 后查一次 `State.Running === false`，而脚本 `:52` 要 2.5 秒才开始干活 —— 这个探针**只能**抓住「node 解析阶段就退出」这一类（= 1.7.10 那个真因），抓不住 create/stop/start 之后的任何失败。设计上是刻意的（失败原因落 `update.log` + 界面「查看更新日志」+ 客户端 2 分钟版本轮询兜底，见 `src/components/shell/win-update.tsx:42-62, 96-101`），残留风险就是 ③。
- 证据（没有健康检查可用）：`Dockerfile` **无 `HEALTHCHECK`**，4 份 `docker-compose*.yml` **都没有 `healthcheck:`** ⇒ 即便想「等它就绪」也没有现成信号（alpine 自带 busybox `wget`，加一条 `HEALTHCHECK CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1` 成本极低，`/api/health` 已存在且不依赖登录）。
- 修法（最小、且不引入新依赖）：脚本 `:64` 起新容器后，轮询 `GET /containers/{id}/json` 10~20 秒，确认 `State.Running === true` 且 `Restarting === false` 且 `ExitCode` 未置位（或容器健康），**再**执行 `:71-74` 的「删老容器 + 改名」；未通过就走已有的回滚分支（删新容器 → 启动老容器 → 报错退出）。代价：更新多等 10~20 秒。
- 顺带：`Dockerfile` 加 `HEALTHCHECK` 后，`pickRemovableImages()`（`src/lib/update/docker.ts`，已有「只删本项目镜像、非当前镜像、无任何容器引用」的纯函数保险）与「清理旧镜像」的判定不受影响。

### ④ B · 容器的 PID 1 是 `sh` 不是 node ⇒ `SIGTERM` 到不了 node（`docker stop` 的宽限期形同虚设）
**建议本轮修**（一行：加 `exec`）

- 证据（代码）：`Dockerfile:13`
  ```dockerfile
  CMD ["sh","-c","mkdir -p /data/… && node app/server/index.mjs"]
  ```
- 证据（实测，用同一形状复现，**不是我推的**）：
  ```bash
  sh -c "mkdir -p /tmp/p1 && DATA_DIR=/tmp/p1 PORT=4602 node app/server/index.mjs" &
  pgrep -f 'sh -c mkdir -p /tmp/p1'        # → 35039（shell 仍然是独立进程，没有 exec 成 node）
  kill -TERM 35039                          # 等价于 docker stop 给 PID 1 发 SIGTERM
  # 之后：shell 已 Terminated；node(35041) 仍在跑，curl /api/health 仍 200
  ```
  （本机 `ps` 被沙箱拒绝，改用 `pgrep -f` + `/api/health` 判活，结论一致：**shell 没把 SIGTERM 转发给 node**。）
- 影响：Docker 在 PID 1 退出后按宽限期结束会 `SIGKILL` 掉容器内剩余进程，所以
  1. 更新脚本 `:61` 的 `stop?t=12` 与人工 `docker stop -t …` 的宽限时间**对 node 完全无效**（shell 秒退，node 直接吃 SIGKILL）；
  2. 没有优雅退出的机会：更新/重启那一刻正在进行的自动保存（整本快照 `pushNasLedger`）被硬中断。正式文件有「临时文件 + rename」兜底（`开发规范.md` 的原子写约定），所以**不会写坏台账**，但那次保存丢失、临时文件可能残留；
  3. 排障时看不到「准备退出 / 正在落盘」这类收尾日志。
- 修法：`CMD ["sh","-c","mkdir -p /data/… && exec node app/server/index.mjs"]`（`exec` 让 node 接管 PID 1）。同理建议考虑 `--init`/`tini`（非必须，`exec` 已解决信号问题；僵尸回收方面该应用只 spawn 子进程在 Windows 路径，容器里不 spawn）。

### ⑤ B · Windows 包 **zip 根目录那份 `启动.bat` 自身是坏的**，而在线更新恰恰用它重启服务
**留待后续（需真机复核一次）**

- 证据（文件与逻辑）：
  - `win/启动.bat:3` `cd /d "%~dp0.."` —— 这是为「bat 在 `win/` 子目录里」写的（`git log -- win/启动.bat` 里 `afc9679 fix(win): bat 文件切换到上级目录运行…打包脚本将 bat 放入 win/ 子目录`）。
  - `win/pack.sh:19-20`：**同一份文件**同时放进 `$STAGE/win/` 和 zip 根目录：
    ```
    mkdir -p "$STAGE/win"
    cp win/启动.bat win/停止.bat "$STAGE/win/"
    # 同时在 zip 根目录放一份，保证在线更新脚本（只在解压根目录找 bat）能更新启动器
    cp win/启动.bat win/停止.bat "$STAGE/"
    ```
    （该改动来自 `5ae0857` 1.4.19，注释就是这么写的。）
  - zip 根 = 安装根（`pack.sh:14-25`：`$STAGE` 里就是 `app/`、`node/`、`win/`、`启动.bat`）。于是**根目录那份** `%~dp0` = 安装根，`cd ..` 会切到安装根的**上一层**，随后 `win/启动.bat:11` 的 `if not exist "app\server\index.mjs"` 失败 → 打印
    `[ERROR] Missing node\node.exe. Please re-extract the full package.`（对一份完好的包说「请重新解压」——错误信息本身也是误导）。
  - 在线更新脚本正是启动这一份：`src/lib/update/apply.ts:237,240`
    ```
    if exist "%SRC%\启动.bat" copy /Y "%SRC%\启动.bat" "启动.bat" >nul
    …
    start "" "%~dp0启动.bat"
    ```
    更新 bat 被写在安装根（`apply.ts:218-219,246`，`home = portableHome() = 启动.bat 设的 GONGDI_HOME = %CD% = 安装根`），`%~dp0` = 安装根 ⇒ 启动的就是**根目录那份坏 bat**。
- 影响：a) 用户双击 zip 根目录的 `启动.bat`（最显眼的入口）会得到「请重新解压」的假错误；b) Windows 版**应用内更新后服务不会自己回来**，用户得手动点 `win\启动.bat` 才恢复（`win/pack.sh` 的 `说明.txt` 写的正是「双击 win/启动.bat」，所以这条一直被绕过、没暴露）。
- 复现步骤（我做不到，必须 Windows）：解压 `gongdi-windows.zip` 到 `D:\gongdi` → 双击根目录 `启动.bat`（看是否报 Missing node\node.exe）→ 再双击 `win\启动.bat` 起服务 → 在软件里点一次「更新」→ 观察更新 bat 结束后服务是否自己起来。
- 修法（任选）：把 `apply.ts:240` 改成 `start "" "%~dp0win\启动.bat"`（同时把 `pack.sh` 的根目录副本删掉/只留更新用副本）；或把 `启动.bat` 的目录判定改成「`%~dp0` 里没有 `app\` 才 `cd ..`」。**建议先真机复核再改**（本条结论建立在「zip 根 = 安装根」这一结构推论上，代码证据充分但未在 Windows 上实证）。

---

## 2. 其余发现（按级别）

### B（风险隐患，含推理链）

**B1 · 破坏性开发脚本无护栏：`ci/mobile-print-check.mjs seed` 直接覆写 `books/default/ledger.json`**
**建议本轮修**
- 证据：`ci/mobile-print-check.mjs:315-320`
  ```js
  async function seed() {
    const dir = join(DATA_DIR, "books", "default");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "ledger.json"), JSON.stringify(ledger, null, 2), "utf8");
  ```
  `DATA_DIR = process.env.DATA_DIR`（`:34`）**没有校验、没有存在性判断、没有备份、没有 `--force`/确认**。
- 实测（在 `/tmp` 里，未碰 `data/`）：
  ```bash
  mkdir -p /tmp/seedtest/books/default && echo '{"KEEP":"不要覆盖我"}' > /tmp/seedtest/books/default/ledger.json
  DATA_DIR=/tmp/seedtest node ci/mobile-print-check.mjs seed
  # → 已写入 /tmp/seedtest/books/default/ledger.json：12 人 / 108 考勤 / …
  ```
  原来的 80 字节文件被 53KB 样例台账覆盖，**没有产生任何备份**（`/tmp/seedtest` 下只有 `books/`）。
- 影响面：这是**规范推荐使用的复现工具**（`开发计划`：改打印件前要按 §6.6 与 `VERSION.txt` 1.8.13 的方法在真 PDF 上量页数；`ci/README.md` 与 `docs/审查与报告/移动端与打印媒体验证-20260916.md` 都指向它）。任何人（或任何 AI）把 `DATA_DIR` 指向真实数据目录（例如在容器里执行、或照抄命令时把 `/tmp/gongdi-e2e` 换成 `./data`）就会**静默覆盖当前台账**，且 `data/backups/` 不会有任何新文件可救。这与仓库最高优先级的硬约束（「绝对不要读写 `data/`」）方向相反。
- 修法（最小）：`seed()` 开头加三道之一 —— ① `books/default/ledger.json` 已存在则**拒绝**并提示用 `--force`（并在这时先写 `ledger.json.bak-<时间戳>`）；② 强制要求 `DATA_DIR` 以 `/tmp` 或 `TMPDIR` 开头；③ 至少打印「即将覆盖 <绝对路径>」。任一条都能把「一次误操作 = 数据没了」变成「一次误操作 = 一条提示」。

**B2 · 启动器与 `src/lib/log.server.ts` 是**两份**日志实现，且已经在「到上限怎么办」上**分叉**
**建议本轮修（与 ① 一起做最省）**
- 证据：
  - 启动器 `scripts/app-server-index.mjs:169-171` 的受管文件名正则 `^\d{4}-\d{2}-\d{2}\.log$`（**不含 `.log.N`**）、`:237-250` 到上限的处理是「`logState.capped = true` → 今天不再写文件」，提示只 `console.warn`（**不落盘**）；
  - 应用侧 `src/lib/log.server.ts:42` 的正则是 `^\d{4}-\d{2}-\d{2}\.log(\.\d+)?$`（含 `.log.N`）、`:237-268` 到上限的处理是**滚动** `rename` 到 `nextRotationName()`（提示写 stdout）。
- 口径冲突：`AGENTS.md`（1.8.4 段）与 `开发规范.md:337` 都写「**1.8.4 起上限触发的是滚动 `YYYY-MM-DD.log.N` 而不是停写**，且 `.log.N` 受保留策略管辖」。这句话**只对应用侧成立**；启动器这条路径（5xx / 慢请求 / 请求体被拒 / 服务启动都走它的 `logLine`）仍然是「停写」，而且它**不 prune `.log.N`**（`isExpiredLogName` 认不出这个形状）。实测印证了「停写+提示只到 stdout」：`LOG_MAX_MB=0.0005` 时文件停在 3 行 412B，stdout 里出现 1 条 `已达上限`，文件里 0 条。
- 为什么修不掉的代价是持续的：同一个文件被两个进程/两段代码写，**上限语义必须一致**，否则「撞上限后当天还剩什么」取决于谁先撞（谁先撞就决定后面走滚动还是停写）。配合 ①（每个请求都写盘）这一点会天天触发。
- 守卫为什么没拦住：`tests/api-guards.test.ts:78-92` 对启动器只做**文本存在性**断言（有 `MAX_BODY_BYTES`、有 `uncaughtException`、有 `logLine("error","请求处理失败")`），`tests/log-server.test.ts` 只测 `src/lib/log.server.ts` 的纯函数 —— 两套实现的**行为分叉**没有任何测试覆盖。
- 修法：把「级别 / 保留天数 / 单文件上限 / 是否受管文件名 / 下一个滚动编号 / 上限动作」抽成一份**零依赖、启动器能直接 import 的实现**（启动器不能 import `src/`，但可以 import 一个 `scripts/` 或 `shared/` 下的 `.mjs`；或由构建把这份纯逻辑生成到 `app/`），两侧共用；补一条「两份实现共用同一解析」的守卫。

**B3 · 环境要求散落 4 处且互不一致，`package.json` 又没有 `engines` ⇒ 在不达标机器上只会得到怪错误**
**留待后续**
- 证据：`Dockerfile:1` `node:22-alpine`（浮动 minor）；`.github/workflows/check.yml:36` `node-version: 24`（注释写「与开发者本机一致」）；`win/pack.sh:38` 硬编码 `https://nodejs.org/dist/v22.18.0/node-v22.18.0-win-x64.zip`；`ci/check.workflow.yml:37` 还是 `node-version: 22`；文档口径是「≥22.18」。
- `package.json` **无 `engines` 字段**（`grep -n engines package.json` → 无）。`tests/register.mjs:11-15` 依赖 `node:module` 的 `registerHooks`（Node ≥22.15 的实验 API）与类型擦除。
- 推理链：本地 Node 20/21（或某台 NAS 上的 node）执行 `pnpm test` → 安装照样成功 → 报错是「`registerHooks` 不是函数」或 `.ts` 语法错误，排查成本落在使用者身上。
- 修法（便宜）：`package.json` 加 `"engines": { "node": ">=22.18" }`（pnpm 会 warn；也可加 `engine-strict`），并把「运行版本」的口径统一写一处（建议 Dockerfile 与 CI 都跟 `engines` 对齐；Windows 包固定 22.18 属另一件事，可注明）。

### C（改进建议，含取舍）

**C1 · 发布仍与合并耦合（`ci/README.md §2` 的建议一直没落地，改它必须走 GitHub 网页）**
- 证据：`.github/workflows/docker.yml:40-57` 的 `windows` job 没有 `if:` 守卫；`ci/README.md:50-53` 已写明现状问题（「任何一次推 main 都会创建/移动一个 Release」）并给出了 `if: startsWith(github.ref, 'refs/tags/v') || github.event_name == 'workflow_dispatch'` 的改法。
- 附带两点（同一处改动可以一起处理）：① `tag_name` 取 `VERSION.txt` 首行（无 `v` 前缀），于是 `docker.yml:29` 的 `type=semver,pattern={{version}}`（要 `v*` tag）实际上只在 `v1.8.1` 那种手动 tag 上生效过（本机 `git tag` 里 `1.8.6~1.8.9` 无 v、`v1.8.1` 有 v）—— 与 AGENTS.md「只发布 `latest` 与 `sha-<sha>` 两种标签」的说法需要对齐一次；② Release body 用的是**整份** `VERSION.txt`（`body_path: VERSION.txt`），当前 **63,918 字符**（`python3 -c "print(len(open('VERSION.txt').read()))"`；`wc -m` 一致），GitHub 的 release body 上限是 125,000 字符，按每版约 +2k（1.8.10 58,433 → 1.8.13 63,918）的增长，大约再 30 个版本会顶到上限——一旦超限，发版步骤会失败、`gongzi-windows.zip` 就不会挂上去，Windows 版的「应用内更新」会跟着拿不到包。建议 body 只放最新一节。
- 取舍：改它需要 GitHub 网页操作（规范 §2 禁止本地改 workflows），成本在流程上而不在代码上。

**C2 · `ci/check.workflow.yml`（模板）与线上 `.github/workflows/check.yml` 已是两份不同的东西，照模板「重装」会把闸门改成另一套**
- 证据：`ci/check.workflow.yml:37` `node-version: 22`、`:51-58` `exit 1` 的字节级判据、无 `timeout-minutes`/`concurrency`；线上 `check.yml` 是 24 + warning + timeout/concurrency。`ci/README.md:20-28` 还在教人「把本文件内容粘贴成 `.github/workflows/check.yml`」，而 `AGENTS.md` 说「1.8.1 已在该模板里补『Excel 往返对拍』一步」—— 双方都以为模板是权威。
- 建议：让 `ci/check.workflow.yml` 与线上文件逐字一致（或直接删掉，`ci/README.md` 改成「线上为准，改它去网页」），避免下次「按模板装一遍」= 一次闸门回退。

**C3 · 量打印分页的工具链挂在「某台机器的本地 playwright」上，换机/换 Chrome 可能量不出来**
- 证据：`ci/mobile-print-check.mjs:45-51` 写死了作者机器的绝对路径
  ```js
  const PW = process.env.PLAYWRIGHT_CORE ||
    ["/Users/wsir/.dsh/profiles/web/node_modules/playwright-core/index.js",
     join(process.cwd(), "node_modules/playwright-core/index.js")].find(existsSync) || "playwright-core";
  ```
  `node_modules` 里**没有** playwright（`ls node_modules | grep -i play` → 空），`package.json` 也没有它 —— 即「打印留白 0.1mm」「2 页→1 页」这些结论的复现条件依赖**仓库外的一个未固定版本的浏览器驱动**。`ci/print-pdf.mjs` 是自写的 PDF 解析（只认 `FlateDecode` + `/ToUnicode` CMap + 对象流外的传统 xref），注释里也说明它不进 CI（`:9-12`），**没有自检**（换 Chrome 版本后若解析不到内容，只会得到「0 页/0mm」这类看起来很正常的结果）。
- 建议（取舍）：不要求进 CI（它是端到端工具，进 CI 成本高），但要 ① `ci/README.md` 写明 `PLAYWRIGHT_CORE`/`E2E_CHROME` 的获取方式与已验证版本；② `print-pdf.mjs` 加一句「解析不出任何页/任何文字就抛错」（宁可红，也别给出「很省纸」的假结论）。这条直接关系到 1.8.10~1.8.13 四轮打印结论的可信度。

**C4 · 「版本四处一致」目前只有 1 处在测试里**
- 证据：`开发规范.md:61` 与 `:308` 要求 `VERSION.txt` 首行 / `package.json` / `app/VERSION.txt` / `README.md` 当前版本行四处一致；现在四处**都是** `1.8.13`（✔），但只有 `VERSION.txt` 首行有守卫（`tests/changelog.test.ts:89-100` 的 Y≤9/Z≤19 + 首行与最新节一致）；`package.json:4`、`README.md:11`、`app/VERSION.txt` 全靠人记。另外 CI 里那条「APP_VER == SRC_VER」（②）看似覆盖了 `app/VERSION.txt`，但它恒真、且在 CI 现场构建后才比 —— 拦不住「提交里 `app/VERSION.txt` 是旧的」（那种情况只会在本地 `git status` 或发布后被发现）。
- 建议：加 1 条零依赖守卫（读三个文件比字符串，跨平台稳定）：`VERSION.txt` 首行 == `package.json.version` == `README.md` 的 `当前版本：**x.y.z**`；`app/VERSION.txt` 因跨环境构建哈希问题仍不入闸（可只比首行，但注意它必须由 `pnpm run build` 产生 —— 若采纳 ② 的推荐改法，这条就自然不需要了）。

**C5 · 其它小而具体的项（逐条都可直接核）**
1. `scripts/app-server-index.mjs:124-131`：同一个变量上压了两段注释（先「默认 64MB」再「默认 52MB」），实现是 52MB —— 删掉前一段。**留待后续**
2. `scripts/copy-output.mjs:28`：`pnpm run build` 会 `mkdir(data/)`——**构建过程去创建/触碰生产数据目录**。本机 `data/` 里是真数据（今天是 no-op 的 `recursive:true`，但这一步的存在本身是个 footgun）。建议删掉（`app/server/index.mjs:20-44` 启动时本来就会建全）。**建议本轮修**
3. `scripts/copy-output.mjs:35`：`copyFile(VERSION.txt).catch(()=>{})` 吞掉失败 + `:55` `swap("VERSION.txt")` 在 stage 缺文件时执行 `rm(target)` ⇒ 复制失败会把 `app/VERSION.txt` **删掉**（CI 的 `-s` 检查能兜住，本地不跑 build 检查的人看不到）。建议 catch 里给出显式错误并 `process.exit(1)`。**留待后续**
4. `.dockerignore` 未排除 `browser-screenshots/`（21MB）、`docs/`、`src/`、`tests/`、`ci/`、`dist/` ⇒ 构建上下文实测 **31.6MB**（`tar --exclude… | wc -c` = 31641600），而 `Dockerfile` 只用 `app/`(6.9MB) + `VERSION.txt`。加几行即可显著减少每次 build 的上下文传输。**留待后续**
5. 更新卡的「检查更新」每次都带 `fresh=1`（`src/components/shell/win-update.tsx:13,26` + `src/lib/update/version.ts:219` 的 2 分钟缓存被绕过），而 `checkUpdate` 一次会并发打 8 个 VERSION 源 + 3 个 release 源（`version.ts:221-235`）。每进一次设置页/版本弹窗 ≈ 最多 11 个外网请求，没有退避；`api.github.com` 未认证额度是 60 次/小时（每次含 2 个 api.github.com 调用 ⇒ 约 30 次打开就吃满），吃满后退回 jsdelivr/gh-proxy 等镜像源，功能上还能用（`versionFromResponse` 对 `!ok` 抛错后换源），但表现是「检查更新时快时慢/偶发拿不到 notes」。建议：默认走缓存，`fresh=1` 只在用户手动点「重新检查」时用 + 失败退避。**留待后续**
6. `src/lib/update/log.ts:42-52`：取尾部 64KB 前先 `readFile` 整文件（`update.log` 不在保留策略内、无上限；正常情况很小，但读法可以换成定位读）。**留待后续**
7. `win/启动.bat:75-79`：就绪探测完全依赖 `curl`（Win10 1803+ 才有），没有 curl 时循环空转到 60 秒再打开浏览器；也不检测 8501 是否已被占用（重复双击会在窗口里报 EADDRINUSE，而浏览器打开的是**上一个**实例，看起来像「没生效」）。**留待后续**
8. `win/启动.bat` 用 `chcp 65001` + UTF-8 无 BOM 文件（已核：`head -c3` = `@ec`），当前顺序正确（先 chcp 再建中文目录），**这一项没问题**，列出来是为了说明我查过。
9. `初始化目录.sh:7` 少建 `data/photos/保险合同`（`一键部署.sh:19`、`一键拉取.sh:12`、`启动.bat:41` 都有）—— 影响仅限「只用这个脚本建目录」，启动器会补齐。**留待后续**
10. compose 三份的命名与用途容易让人拉错源：`一键拉取.sh:19-22` 只认 `docker-compose.github.yml` / `docker-compose.yml`，而**「GitHub 官方源」那份叫 `docker-compose.ghcr.yml`，脚本永远不会选中它**；`docker-compose.github.yml` 与 `docker-compose.yml` 内容等价（都是 `ghcr.1ms.run` 加速）。建议改名或让脚本按 `ghcr.yml` 显式可选（当前只能手敲 `docker compose -f`）。**留待后续**
11. Windows 在线更新用 `xcopy /E /Y /I` 覆盖（`apply.ts:235-236`）**不清理旧文件**：`app/public/assets/` 里历次构建的哈希文件会累积（无功能影响，磁盘慢慢涨）；每次更新都要下 ~100MB（含 80MB `node.exe`，`pack.sh:38`）——在弱网/墙内是主要耗时。若要优化，可另发一个不含 node 的「代码包」给更新用（取舍：要维护两种包）。**留待后续**
12. `.gitattributes:6-7` 把 `app/**` 标成 `linguist-generated=true` 且 `-diff` ⇒ PR 里**看不到**被发布的产物改了什么（只是「Binary files differ」），再加上 ②（CI 只 warning），「这一版实际发出去的静态资源是什么」在仓库里没有可核对的地方。若采纳 ② 的推荐改法（CI 从源码构建镜像），这条的影响就基本消失。**留待后续**

---

## 3. 升级 / 回滚演练结论（本报告能给出的部分）

- **升级路径（Docker，桌面路径）**：应用内 POST `/api/update` → 立刻返回「已受理」→ 后台拉镜像（**优先按 `sha-<main 短 sha>`**，`latest` 兜底，逐源核对镜像内 `VERSION.txt`，不比本机新就换源）→ 写 `data/.gondi-next.json`（兼容旧路径）+ 用 `GONGDI_JOB` 环境变量把任务交给 `gongdi-updater` 容器 → 2 秒存活探针 → 脚本 2.5 秒后：建新容器（临时名）→ 停老 → 起新 → 删老 → 改名 → 删旧镜像。**只有「起新失败」会回滚**（脚本 `:66-70`）。
- **回滚**：**没有一键回滚，也没有文档化的回滚流程**。老容器在新容器 `start` 返回 200 后立刻被删（`:71-72`），旧镜像随后被删（`:77-84`）；而 `docker-compose*.yml` 里只有 `:latest`、仓库只发布 `latest` + `sha-<sha>`（AGENTS.md 1.7.8 段）。要退回旧版本，只能：手改 compose 指到某个 `sha-<sha>`（需要事先知道 sha）→ `docker compose pull && up -d`，或直接 `docker compose -f docker-compose.yml up -d` 重新拉 `latest`（那还是新版）。
  - 结论与建议：至少把「回滚到某个 sha」写成 `docs/使用与部署/部署说明.txt` 的一节（含 `docker compose` 命令与「先备份 data」的提醒）。**留待后续**（涉及文档，且属产品/运维决策）。
- **我无法验证的（能力边界，明确声明）**：本机**没有 docker**（`which docker` → 空），因此以下三条我**没做**，本报告中也没有据此下结论：① 镜像真的构建得出来、体积多大、`app/server/server.js` 是否真的自带全部依赖；② `docker stop`/`start`（`t=12`）、端口占用顺序（「老容器还活着时用临时名 create 是否成功」）—— 这一点由 1.7.11→1.7.12 的现场闭环作为历史证据，我未复现；③ ghcr 上 `latest`/`sha-<sha>` 的实际标签与 Release 状态（无外网）。

---

## 4. 明确**不**作为缺陷的（已决策 / 已闭环）

- 「容器以 root 运行 / 挂 docker.sock」：属部署取舍，合规路径已写在 `ci/README.md §3`、`部署说明.txt §七`、`FAQ 第 12 条`（本报告只把「加 `HEALTHCHECK`」当作 ③ 的手段提到，不主张非 root 化）。
- 「实体级存储不做」「`attendance.edit` 可整本写台账」「成员自建台账限 5 本」「A 组 4 项未能验证不补测」：按 `AGENTS.md`「已决策」不重复提。
- 「启动器在鉴权前把整 body 读进内存（52MB 上限）」：1.7.13 已按上限处理并落盘，本报告只把它当作 ① 里「同步日志写盘」之外的已知取舍，不另开条目。
- 「`app/` 作为构建产物提交进仓库」本身：在 ② 的推荐改法落地前是**有意**的（Windows 包与 `win/pack.sh` 依赖它），所以我不把它单独算缺陷，只算「必须让闸门真的能发现不同步」。

---

## 5. 建议的本轮最小修法清单（改动量从小到大）

1. `scripts/app-server-index.mjs:167`：`n >= 0` → `n > 0`（+ 抽纯函数 + 1 条用例）。【Top ①】
2. `Dockerfile:13`：`CMD` 里 `node` 前加 `exec`。【Top ④】
3. `scripts/copy-output.mjs:28`：删掉 `mkdir(root/data)`。
4. `ci/mobile-print-check.mjs:315` 的 `seed()`：已有 `ledger.json` 就拒绝（`--force` 才覆盖，且先写 `.bak`）。【B1】
5. `tests/` 加一条「版本四处一致」守卫（VERSION.txt / package.json / README 当前版本行）。【C4】
6. `Dockerfile` 加 `HEALTHCHECK` + `updater-script.ts` 起新容器后轮询 `State.Running` 再删老容器/旧镜像。【Top ③】
7. `.github/workflows/*`：按 ② 的推荐改法改 `docker.yml`（build 前先 `pnpm build`）+ 给 `windows` job 加 `if:` 守卫 + body 只放最新一节 —— **必须走 GitHub 网页**。【Top ② + C1】

> 每条都给了「文件:行 + 可复现命令/输出」，未改动仓库里任何文件；报告外的临时文件只落在 `/tmp`（`/tmp/logtest`、`/tmp/p3`、`/tmp/seedtest`、`/tmp/tscheck`、`/tmp/p1`）与 `/tmp/*.mjs`，未写入 `data/`。
