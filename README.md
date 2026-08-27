# 工地台账

人员、考勤、发放、合同。网页操作。

版本 **1.0.2**。

## 镜像

- `ghcr.io/qq987985/gongdi-ledger:latest`
- 国内：`ghcr.1ms.run/qq987985/gongdi-ledger:latest`

个人数据只在 NAS / Windows 的 `data` 目录，不要提交到本仓库。

## 飞牛 NAS

目录：`/vol1/1000/docker/attendance/`  
`data` 不要删。

本机构建（推荐）：

```bash
chmod +x 一键部署.sh
./一键部署.sh
```

拉镜像：

```bash
./一键拉取.sh
```

打开 `http://NAS的IP:8501`。compose **只挂 data**，不要挂 `VERSION.txt`。

## Windows

Releases 里下载 `gongdi-windows.zip`，双击 `启动.bat`，打开 http://127.0.0.1:8501

## 发布

推到 `main` 后 Actions 自动打 Docker 镜像和 Windows 包。  
覆盖完整 `app/`，改 `VERSION.txt` 第一行即可。网页一次最多传 100 个文件。

完整目录和说明见 `使用说明.md`、`目录结构.txt`。
