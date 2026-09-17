# ci/ 目录说明（E 项：交付与发版）

这里的文件**不会自动生效**，因为开发规范 §2 规定：不要在本地改/加 `.github/workflows/`
（推送工作流文件需要 token 带 `workflow` 权限，权限不够 GitHub 会直接拒绝整次推送）。
所以统一做法是：在 GitHub 网页 → Actions → 选中对应 workflow → 编辑 → 整段粘贴 → 提交。

---

## 本地等价命令

CI 跑的四步，本机一条命令等价（`package.json` 的 `check` 脚本）：

```sh
pnpm run check   # typecheck → test → test:roundtrip → build
```

`pnpm run build` 结束时会写 `app/.build-inputs`（源码指纹）—— **它要跟 `app/` 一起提交**，
CI 靠它在构建**之前**判断「这份 app/ 是不是当前源码构建出来的」。

另外 `tests/guards-paths.test.ts` 会校验「守卫测试引用的源码路径都存在」——
拆文件/改名后如果忘了同步守卫路径，`pnpm test` 会直接红（`开发规范.md` §12 末尾有说明）。

## 0. 两个 workflow 怎么装（2026-09-17 起，A8）

| 模板 | 粘成 | 作用 |
| --- | --- | --- |
| `ci/check.workflow.yml` | `.github/workflows/check.yml` | 类型检查 / 回归测试 / Excel 往返对拍 / 构建产物不漂移 |
| `ci/docker.workflow.yml` | `.github/workflows/docker.yml` | ghcr 镜像 + Windows zip Release |

每个文件各做一遍（约 1 分钟）：

1. 仓库 → **Actions** → 左侧选中 `check`（或 `docker`）→ 右上 **⋯ → Edit workflow**；
   首次还没有时用 **New workflow → set up a workflow yourself**，文件名填 `check.yml` / `docker.yml`。
2. 把 `ci/check.workflow.yml`（或 `ci/docker.workflow.yml`）的**全部内容**粘进去覆盖原内容，提交。
3. 以后再改这两个 workflow 都必须走这条网页路径（本地改会被 GitHub 拒绝推送）。

> **为什么这次必须换掉线上那两份**：线上 `check.yml` 的第四道闸是**恒真**的 ——
> 它先 `pnpm run build` 再去比 `app/VERSION.txt`，而 VERSION.txt 是构建时复制过去的、结构上永远相等；
> 唯一还能看出漂移的判据在 `76b8099` 被降级成 `::warning`。同时 `docker.yml` 的两个 job 一道闸都不跑，
> 直接拿仓库里那份 `app/` 构建/打包 → 「改了 src/ 忘了重建 app/」会全绿发版，
> 用户拿到旧代码而版本号已是新的（表现为「更新完版本变了、行为没变」）。
> 新模板：① `check` 第四道闸改回 `exit 1`，判据换成**跨环境稳定**的两条 ——
> `cmp` 三个「构建时原样复制」的文件（启动器 / 日志核心 / VERSION.txt），以及
> `node scripts/build-stamp.mjs --verify` 比源码指纹；② `docker` 的两个 job 在构建/打包前
> 自己 `pnpm install --frozen-lockfile && pnpm run build`。
> （不拿 `git diff --exit-code app/` 当硬失败：不同 OS / Node 版本构建出的字节不同，会让 CI 常红 ——
> 那正是它当年被降级的原因。字节差异现在仍然提示，只是不作为失败。）

---

## 1. `check.workflow.yml` —— 质量闸门

把本文件内容粘贴成 `.github/workflows/check.yml` 即可（步骤见 §0）。启用后每次 push / PR 会跑：

1. `pnpm run typecheck`（tsc 0 错误）
2. `pnpm test`（零依赖回归测试，直接跑 tests/ 下的 .ts）
3. `pnpm run test:roundtrip`（Excel 导出→导入对拍 70 用例）
4. **构建产物不漂移（硬闸门）**：`cmp` 三个直接复制的文件 + 源码指纹 `app/.build-inputs`
5. `pnpm run build`（确认源码能构建出产物；跨环境字节差异只提示不失败）

**依赖口径（1.8.15 起）：精确版本 + `pnpm-lock.yaml` 入库，CI 的 `pnpm install --frozen-lockfile` 是「真」按 lockfile 装的。**
`package.json` 里不再有 `latest`，lockfile 的 `specifier` 与 `package.json` 的依赖值**逐字相同**（`tests/dependency-pinning.test.ts` 守卫）：
- 漏提交 lockfile、或改了 `package.json` 没重新 `pnpm install` → 这一步**直接失败**，而不是悄悄装一套新依赖再让后面某道闸莫名变红；
- 想升级依赖：`pnpm install` 生成新 lockfile 后与 `package.json` **一起提交**（步骤见 `开发规范.md` §2「依赖与 lockfile」）；
- ⚠️ `package.json` 与 `pnpm-lock.yaml` 都是**构建指纹的输入**（`scripts/build-stamp.mjs` 的 `BUILD_INPUTS`）——
  动过它们必须重跑 `pnpm run build` 并提交 `app/`，否则上面第 4 道闸会红（指纹只覆盖构建输入，改文档/测试不会误报）。

注意：Node 需要 **≥ 22.18**（类型擦除）；pnpm 版本要和本机一致（当前 12.x）。
第 4 步的原理、以及「为什么不用 git diff」写在 `scripts/build-stamp.mjs` 顶部注释里。

---

## 1b. `docker.workflow.yml` —— 镜像与 Windows 包（同样建议尽快换）

模板包含两处改动：①（A8）两个 job 构建/打包前自己 `pnpm install --frozen-lockfile && pnpm run build`；
②（C4④）windows job 加了发版守卫
`if: startsWith(github.ref, 'refs/tags/v') || github.event_name == 'workflow_dispatch'`
—— **推 main 只出 `latest` 镜像；打 `v*` tag 或网页手动触发才打包 + 发 Release**。
`version` 步骤同时改成「打 tag 时以 tag 名为准」（`v1.8.14` → `1.8.14`），
避免 tag 名与 `VERSION.txt` 首行不一致时把 Release 发到别的 tag 上。
贴上这份模板之后，下面 §2 说的「推一次文档就移动一次 Release」就不存在了 ——
§2 保留原文当决策记录，**不用**再单独做一遍。

**粘贴后自检一条（1.8.15 实测踩过）**：Release 步骤的 `files:` 必须与打包脚本写出的文件名**逐字一致** ——
`win/pack.sh` 写的是 `gongdi-windows.zip`，模板里曾写成 `gongzi-windows.zip`（差一个字母）。
`softprops/action-gh-release` 遇到匹配不到的文件**只打一行警告、照样报成功**：
Release 建出来了、镜像推上去了、**zip 一个字节都没挂**（2026-09-17 的 1.8.15 就是如此，只能事后手工补传）。
所以粘贴后请顺手核对：

```sh
grep -n 'windows.zip' ci/docker.workflow.yml win/pack.sh     # 两个名字必须一模一样
grep -n 'windows.zip' .github/workflows/docker.yml           # 线上那份也应一致
```

本地有守卫（`tests/deploy-guards.test.ts`）盯着模板与 `win/pack.sh` 的一致性；
线上一份因为要 GitHub 网页粘贴、本地 token 没有 workflow 权限，只能靠上面这条自检。

---

## 2. 让「合并」和「发版」解耦（**已并入 §1b 的模板**，此处留档）

> 2026-09-17：本节的「建议改法」已经写进 `ci/docker.workflow.yml`（含 `if:` 守卫与 tag 名优先）。
> 下面保留背景与决策记录；装模板时不必再做第二遍。

### 现状问题

`.github/workflows/docker.yml` 里 release 步骤是：

```yaml
      - name: pack
        run: bash win/pack.sh
      - uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ steps.ver.outputs.ver }}   # ← 取 VERSION.txt 第一行
          name: 工地台账 ${{ steps.ver.outputs.ver }} Windows
          body_path: VERSION.txt
          files: gongdi-windows.zip
          make_latest: true
```

而触发条件是 `push: branches: [main]`。结果是：**任何一次推 main 都会创建/移动一个 Release**。
改一个错别字、补一份文档，也会把当前版本的 Release 重打一遍（用户看到"有新版本"的错觉，
CI 也白跑一次镜像构建）。

### 建议改法

只让「打 tag」和「手动触发」发版，推 main 只构建镜像：

```yaml
on:
  push:
    branches: [main]
    tags: ["v*"]
  workflow_dispatch:

jobs:
  image:
    # 保持原样：推 main 就构建镜像（给 ./一键拉取.sh 用）

  windows:
    # 只在打 tag 或手动触发时打包 + 发 Release
    if: startsWith(github.ref, 'refs/tags/v') || github.event_name == 'workflow_dispatch'
    steps:
      - uses: actions/checkout@v4
      - name: version
        id: ver
        run: |
          VER=$(head -n1 VERSION.txt | awk '{print $1}' | tr -d '[:space:]')
          # 打 tag 时用 tag 名，否则用 VERSION.txt
          TAG="${{ github.ref_name }}"
          case "$TAG" in v*) VER="${TAG#v}";; esac
          [ -n "$VER" ] || VER=latest
          echo "ver=$VER" >> "$GITHUB_OUTPUT"
      # 其余（pack + action-gh-release）保持原样
```

发版流程随之变成：
1. 改好 `VERSION.txt` / `README.md` → 提交 → 推 `main`（只出镜像，不发版）
2. 在仓库页面打 tag `v1.8.0` → 自动打包 Windows zip 并发 Release

**为什么值得改**：现在的耦合已经造成过两次"发版说明和实际版本不一致"的困扰，
而且文档提交会顺带触发一次完整发版，用户侧会看到多余的版本提醒。

---

## 3. 已知仍未做（留档）

- **容器以 root 运行**（Dockerfile 无 `USER`）：飞牛上 `./data` 的属主通常是 root 或宿主机某个 uid，
  改成非 root 大概率导致**写不进 data**。要做得先把入口脚本改成「root 启动 → chown → 降权」，
  属于独立改动，不宜和业务修复混在一起。当前风险由"可信内网 + 只挂 data"承担。
- **docker.sock 挂载**：一键更新需要它。不需要网页更新时按 `AGENTS.md` 的建议删掉挂载。
