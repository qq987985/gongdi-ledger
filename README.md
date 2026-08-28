# 工地台账管理系统 (Gongdi Ledger)

一款专为建筑工地设计的台账与考勤管理系统。人员、考勤、工资发放、合同收款，用浏览器操作。

为满足不同场景，提供 **Windows 便携版** 与 **Docker 容器版** 两个版本。

仓库：https://github.com/qq987985/gongdi-ledger  
当前版本：**1.1.0**（以仓库根目录 `VERSION.txt` 第一行为准）

镜像：

```text
ghcr.io/qq987985/gongdi-ledger:latest
ghcr.1ms.run/qq987985/gongdi-ledger:latest
```

**个人数据只在 NAS / Windows 的 `data` 目录。**  
软件、镜像、容器、本仓库都可以删或重装，只要 `data` 在就能恢复。  
`data`、真实照片、真实台账 Excel、`node.exe`、安装压缩包 **不要上传到 GitHub**。

---

## 当前版本（发版时先改这里）

发新版时改三处，保持一致：

1. `VERSION.txt` 第一行，例如 `1.1.1`
2. `VERSION.txt` 里加一节 `[1.1.1]` 说明（网页左下角只显示最近 10 条）
3. 本 README 这一节的版本号和更新说明

### 1.1.0

- 合同原件可上传扫描件，存到 `data/photos/合同扫描件`
- 没有合同时必填「无合同原因」
- 身份证正反面分成两个文件：`张三-身份证-正面.jpg` / `张三-身份证-反面.jpg`
- 人员页只显示正面，边上可点「查看反面」

### 1.0.2

- 按 v56 架构：飞牛可本机 `docker compose build`，也可拉镜像
- 修复打包循环引用导致打开首页 `{"status":500,"unhandled":true,"message":"HTTPError"}`
- Docker **只挂 `data`**，不要再挂 `VERSION.txt`
- 双版本：Windows 解压即用 + Docker

### 1.0.1

- 修复 NAS 点版本号时去连 GitHub
- 版本记录只显示最近 10 条

### 1.0.0

- 正式版号
- Windows 解压即用

---

## 发行版目录结构

下载双版本压缩包解压后：

```text
工地台账-1.1.0/
├── 说明.txt
├── 使用说明.md
├── 目录结构.txt
├── Windows解压即用/     ← 办公室电脑，双击即用
└── Docker-NAS/          ← 飞牛 OS / Linux 服务器
```

> **重要**：Windows 的 `data` 和 Docker / NAS 的 `data` **互不相通，请勿混用**。要从 NAS 拷到电脑，把整份 `data` 拷过去覆盖。

---

## 部署与使用

### 方案一：Windows 办公室端（开箱即用）

适合普通办公电脑单机运行，不用另装 Node。

1. 进入 `Windows解压即用/`（或解压 `gongdi-windows.zip`）
2. 双击 `启动.bat`
3. 浏览器打开 http://127.0.0.1:8501
4. 第一次创建管理员账号
5. 关掉黑窗口，或双击 `停止.bat`

数据在解压目录下的 `data`。需要 64 位 Windows。

### 方案二：Docker / NAS（以飞牛 OS 为例）

默认路径：`/vol1/1000/docker/attendance/`  
`data` 已经有台账的，解压软件时不要覆盖、不要删除 `data`。

**1. 本机构建（推荐，现在飞牛上好用的就是这个）**

把 `Docker-NAS/` 解压到服务器对应路径后：

```bash
cd /vol1/1000/docker/attendance
chmod +x 一键部署.sh 一键拉取.sh 初始化目录.sh
./初始化目录.sh          # 可选。只创建空目录，不清空已有文件
./一键部署.sh            # 等效 docker compose up -d --build
```

打开 `http://NAS的IP:8501`。左下角应显示 **1.1.0**。

compose **只挂 `data`**，不要挂 `VERSION.txt`。

**2. 拉 GitHub 镜像（生产备选）**

前提：Actions 全绿，并且 GitHub → Packages → `gongdi-ledger` 已设 **Public**（仓库 Public 不等于 Packages Public）。

```bash
cd /vol1/1000/docker/attendance
./一键拉取.sh
```

等效：

```bash
docker compose -f docker-compose.github.yml pull
docker compose -f docker-compose.github.yml up -d
```

国内请用：

```yaml
image: ghcr.1ms.run/qq987985/gongdi-ledger:latest
```

`ghcr.io` 在国内常 EOF。403 时去 Packages 改 Public。不行就继续本机构建。

---

## 数据目录 (`data/`)

系统运行后会自动生成。备份只拷这一份。

```text
data/
├── accounts/              登录账号、密码、台账名单、权限
├── books/                 每一本台账一个子文件夹（软件新建时自动建）
│   └── <台账编号>/
│       ├── book.json
│       └── ledger.json    人员、考勤、发放、合同、操作记录
├── photos/                所有影像，不按台账编号分
│   ├── id/                身份证正反面
│   ├── bank/              银行卡
│   ├── ic/                IC卡
│   ├── 报量单/
│   ├── 发票/
│   ├── 收款回单/
│   ├── 考勤影像/
│   └── 合同扫描件/         合同原件扫描（PDF / 照片）
├── backups/               软件里导出的 Excel 备份
└── templates/             运行时导入模板（不要传 GitHub）
```

必须有的空目录（脚本会自动建，缺哪个补哪个）：

```text
data
data/accounts
data/books
data/backups
data/templates
data/photos
data/photos/id
data/photos/bank
data/photos/ic
data/photos/报量单
data/photos/发票
data/photos/收款回单
data/photos/考勤影像
data/photos/合同扫描件
```

### 核心注意事项

1. **请勿**把 `VERSION.txt` 放进 `data/`。旧 compose 曾把版本文件挂进 data，文件不存在时 Docker 会建成文件夹，打开首页 500。脚本会自动删掉这个名字。
2. **请勿**把整个软件解压进 `data/`。`data` 只放业务数据和配置。
3. 跨版本升级通常只需覆盖程序或更新镜像，不要改 `data`（请提前备份）。
4. 建议飞牛每天把整个 `data` 同步到网盘。不必停容器。

---

## 身份证：正反面分开存

从 **1.1.0** 起，身份证按 **两个文件** 管理。人员页、照片页 **只显示正面**，边上有「查看反面」。

### 文件名（只放在 `data/photos/id/`）

```text
张三-身份证-正面.jpg
张三-身份证-反面.jpg
```

也认：`正面.png` / `反面.png` / `front` / `back`。旧文件 `张三-身份证.jpg`（没写正反面）仍能匹配到正面，建议逐步改名。

银行卡、IC 卡不变：

```text
张三-银行卡.jpg
张三-IC卡.jpg
```

也可先拷进目录，再在人员页点「扫描文件夹」。

照片 **不走 Excel**。导入模板 `app/public/templates/people.xlsx` 只有「身份证号」文字列，不用为了正反面去改模板。

---

## 合同扫描件

在合同编辑页：

- 选 **有合同扫描件** → 上传 PDF / 照片，自动存到 `data/photos/合同扫描件/`，文件名类似 `项目名-合同扫描件.pdf`
- 选 **无合同** → 必须填写「无合同原因」才能保存

影像资料页可以按类型筛选「合同扫描件」。Excel 导入导出增加列「有无合同」「无合同原因」。扫描件本身在软件里上传，不通过表格。

---

## 仓库里应该有什么

```text
qq987985/gongdi-ledger
├── .github/workflows/docker.yml     ← 网页上看不见时，用根目录 docker-workflow.yml 粘贴
├── docker-workflow.yml
├── Dockerfile                       ← COPY app，不在 NAS 上 npm 构建
├── docker-compose.yml               ← 拉镜像
├── docker-compose.build.yml         ← 本机构建
├── docker-compose.github.yml        ← 国内拉镜像
├── .dockerignore
├── .gitignore
├── VERSION.txt                      ← 第一行是版本号
├── README.md                        ← 本文件，发版时同步改
├── 使用说明.md
├── 目录结构.txt
├── 部署说明.txt
├── 一键部署.sh
├── 一键拉取.sh
├── 初始化目录.sh
├── win/
│   ├── 启动.bat
│   ├── 停止.bat
│   └── pack.sh
└── app/                             ← 必须完整，缺文件首页会 500
    ├── server/
    └── public/
        └── templates/               ← 软件自带的空白导入模板，要上传
            ├── people.xlsx
            ├── attendance.xlsx
            ├── payments.xlsx
            └── contracts.xlsx
```

网页一次最多传 **100** 个文件。超了就：先传整个 `app/` 并 Commit，再传其余；或用 GitHub Desktop。

`.github` 在 Windows / 飞牛解压后经常看不见。打开仓库 → Actions → 新建工作流，把 `docker-workflow.yml` 全文贴成 `.github/workflows/docker.yml`。

推到 `main` 后 Actions 自动：

1. 打 Docker 镜像 `ghcr.io/qq987985/gongdi-ledger:latest`
2. 打 Windows 包，放到 Releases，文件名 `gongdi-windows.zip`

---

## 哪些不要上传到 GitHub

| 东西 | 上传？ | 原因 |
|---|---|---|
| `app/` 整份（含 `app/public/templates/*.xlsx`） | **要** | 程序和空白导入模板 |
| `Dockerfile`、compose、脚本、`VERSION.txt`、`win/`、说明文档 | **要** | 部署和发版 |
| `.github/workflows/docker.yml` | **要** | 自动打镜像和 Windows 包 |
| `data/` 整个目录 | **不要** | 真实账号、台账、照片 |
| `data/photos/` 里任何人的身份证、银行卡、IC 卡、合同扫描件 | **不要** | 证件和合同原件 |
| `data/templates/` | **不要** | 这是运行时目录，可能被改过 |
| `data/backups/`、`data/accounts/`、`data/books/` | **不要** | 备份和业务数据 |
| 办公室原来的 `人员台账.xlsx`、`考勤表.xlsx`、合同表 | **不要** | 真实名单 |
| `node/node.exe`、`Windows解压即用/` | **不要** | 太大，Actions 会自己打 Windows 包 |
| `*.zip` 安装包 | **不要** | 用 Releases，不要塞进仓库 |

判断方法：

- **软件空白模板**在 `app/public/templates/`，要进仓库
- **你们工地自己的表和照片**在 `data/` 或办公室文件夹，不要进仓库

`.gitignore` 已忽略 `data/`、`node/`、`*.zip`。

---

## 功能摘要

- **人员**：姓名、班组、日工资（可 0）、加班规则。身份证号自动性别年龄。照片正反面、银行卡、IC 卡。
- **月度考勤**：按年按月，出勤、加班、补助、扣款、考勤影像。
- **发放**：按实际收款人入账，可代收。无发放日期也可导入，后补日期。
- **个人查询**：按月或跨月，打印工资条，一键复制。
- **合同**：报量、开票、收款、剩余款、对账单；报量单 / 发票 / 收款回单 / 合同扫描件。无合同可填原因。
- **多账户**：第一人注册为管理员。可共享台账、按模块授权。

---

## 以后怎么更新

| 环境 | 做法 | data |
|---|---|---|
| 改程序并发版 | 覆盖完整 `app/`，改 `VERSION.txt` 第一行和本 README「当前版本」，推 `main` | 不上传 |
| 飞牛本机构建 | 覆盖软件文件后 `./一键部署.sh` | 不动 |
| 飞牛拉镜像 | Actions 绿了之后 `./一键拉取.sh` | 不动 |
| Windows | 软件内「检查更新」，或解压新包留下旧 `data` | 不动 |

版本号：修问题 `1.1.0` → `1.1.1`；加功能 `1.2.0`；大改 `2.0.0`。

---

## 常见问题

**打开变成 `{"status":500,"unhandled":true,"message":"HTTPError"}`**  
1.0.0 / 1.0.1 拉不完整镜像或打包问题时会出现。用 1.1.0 本机构建。若 `data/VERSION.txt` 是文件夹，脚本会删掉这个名字。

**网页一直转圈**  
`docker rm -f attendance-app` 再 `./一键部署.sh`。不要删 `data`。

**照片没有 / 身份证只有正面**  
文件名必须带姓名和类型。身份证用 `姓名-身份证-正面`、`姓名-身份证-反面`。人员页默认只显示正面，点「查看反面」。照片在 `data/photos/`，不在 `books`。

**国内 pull 失败 EOF / 403**  
镜像改 `ghcr.1ms.run/qq987985/gongdi-ledger:latest`，Packages 设 Public。不行就继续本机构建。

**GitHub 网页拖文件没反应**  
一次超过 100 个文件。分两次 Commit。

**Windows 点更新没反应**  
Releases 里要先有更新的 `gongdi-windows.zip`。NAS 没有「点更新」，用脚本重建或拉取。

管理员账号自己记牢。备份只拷 `data`。
