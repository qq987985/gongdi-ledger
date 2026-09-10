# ci/ 目录说明（E 项：交付与发版）

这里的文件**不会自动生效**，因为开发规范 §2 规定：不要在本地改/加 `.github/workflows/`
（推送工作流文件需要 token 带 `workflow` 权限，权限不够 GitHub 会直接拒绝整次推送）。
所以统一做法是：在 GitHub 网页 → Actions → New workflow → 粘贴内容保存。

---

## 1. `check.workflow.yml` —— 质量闸门（**建议尽快启用**）

把本文件内容粘贴成 `.github/workflows/check.yml` 即可。启用后每次 push / PR 会跑：

1. `pnpm run typecheck`（tsc 0 错误）
2. `pnpm test`（零依赖回归测试，直接跑 tests/ 下的 .ts）
3. `pnpm run build` 后再校验 `app/` 与源码同步（产物必须是当前源码构建出来的）

注意：Node 需要 **≥ 22.18**（类型擦除）；pnpm 版本要和本机一致（当前 12.x）。

---

## 2. 让「合并」和「发版」解耦（建议，需在网页改 `docker.yml`）

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
