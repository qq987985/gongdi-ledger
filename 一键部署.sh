#!/bin/sh
set -e
cd "$(dirname "$0")"

if [ ! -f app/server/index.mjs ]; then
  echo "缺少 app/server/index.mjs，请把压缩包完整解压到本目录（和 data 平级）"
  exit 1
fi

# 旧 compose 曾把 VERSION.txt 挂进 data：文件缺失时 Docker 会建成文件夹，打开首页就 500。
# 版本号已打进镜像，data 里这块一律清掉（只删这个名字，绝不碰台账）。
if [ -e data/VERSION.txt ]; then
  echo "清理 data/VERSION.txt（旧挂载残留）..."
  rm -rf data/VERSION.txt
fi

mkdir -p data/accounts data/books data/backups data/templates \
  data/photos/id data/photos/bank data/photos/ic \
  data/photos/报量单 data/photos/发票 data/photos/收款回单 data/photos/考勤影像 data/photos/合同扫描件 data/photos/报销凭证 data/photos/报销打款 data/photos/保险合同

echo "停止旧容器..."
docker compose down --timeout 8 2>/dev/null || true
docker rm -f attendance-app 2>/dev/null || true

if [ ! -f docker-compose.build.yml ]; then
  echo "缺少 docker-compose.build.yml，无法本机构建。"
  echo "如需拉 GitHub 镜像，请运行 ./一键拉取.sh"
  exit 1
fi

echo "本机构建并启动（不拉 GitHub 镜像）..."
docker compose -f docker-compose.build.yml up -d --build --force-recreate

echo
echo "完成。打开：http://本机IP:8501"
echo "数据目录：$(pwd)/data  （原有台账不会被清空）"
echo "左下角应显示当前版本号"
