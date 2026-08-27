./初始化目录.sh

# 运行本地构建部署 (等效于 docker compose up -d --build)
./一键部署.sh
```
*注：本地部署仅挂载 `data` 目录，不挂载 `VERSION.txt`。*

**2. 使用 GitHub 官方镜像一键部署（生产环境）**

当 GitHub Actions 镜像发布成功后，可以通过拉取官方镜像直接启动（镜像地址：`ghcr.io/qq987985/gongdi-ledger:latest` 或加速地址 `ghcr.1ms.run/...`）：

```bash
cd /vol1/1000/docker/attendance

# 直接拉取远端镜像并启动
./一键拉取.sh
```
*该脚本等效于执行 `docker compose -f docker-compose.github.yml pull` 及 `up -d`。*

---

## 📁 数据目录 (`data/`) 结构说明

系统运行后，会在根目录自动生成 `data/` 文件夹。请确保对该目录做好定期备份。具体结构如下：

```text
data/
├── 📁 accounts/          # 账号与权限配置文件
├── 📁 books/             # 各本台账数据（软件自动创建子文件夹）
├── 📁 backups/           # Excel 自动备份
├── 📁 templates/         # 导入模板存放区
└── 📁 photos/            # 影像资料库
    ├── 📁 id/            # 身份证照片
    ├── 📁 bank/          # 银行卡照片
    ├── 📁 ic/            # IC卡照片
    ├── 📁 报量单/         # 报量单扫描件
    ├── 📁 发票/          # 发票影像
    ├── 📁 收款回单/       # 财务收款回单
    └── 📁 考勤影像/       # 考勤打卡记录照片
```

### 🛑 核心注意事项
1. **请勿**将 `VERSION.txt` 文件放入 `data/` 目录中。
2. **请勿**将整个软件程序直接解压到 `data/` 目录内，`data/` 仅用于存放系统生成的业务数据和配置。
3. 跨版本升级时，通常只需覆盖程序主体或更新镜像，无需对 `data/` 目录做任何改动（请提前备份）。
