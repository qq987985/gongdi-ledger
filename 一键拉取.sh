#!/bin/sh
set -e
cd "$(dirname "$0")"

if [ -e data/VERSION.txt ]; then
  echo "清理 data/VERSION.txt（旧挂载残留）..."
  rm -rf data/VERSION.txt
fi

mkdir -p data/accounts data/books data/backups data/templates \
  data/photos/id data/photos/bank data/photos/ic \
  data/photos/报量单 data/photos/发票 data/photos/收款回单 data/photos/考勤影像 data/photos/合同扫描件 data/photos/报销凭证 data/photos/报销打款

if [ ! -f docker-compose.github.yml ] && [ ! -f docker-compose.yml ]; then
  echo "缺少 docker-compose.github.yml 或 docker-compose.yml"
  exit 1
fi

FILE=docker-compose.github.yml
if [ ! -f "$FILE" ]; then
  FILE=docker-compose.yml
fi

echo "停止旧容器..."
docker compose down --timeout 8 2>/dev/null || true
docker compose -f "$FILE" down --timeout 8 2>/dev/null || true
docker rm -f attendance-app 2>/dev/null || true

echo "拉取镜像 $FILE ..."
docker compose -f "$FILE" pull
docker compose -f "$FILE" up -d --force-recreate

echo
echo "完成。打开：http://本机IP:8501"
echo "数据目录：$(pwd)/data"
echo "左下角点版本号可检查更新；GitHub 有新版可直接点更新，台账不会动。"
echo "若拉取 403：GitHub Packages 里把 gongdi-ledger 改成 Public"
echo "若拉取 EOF：确认用的是 ghcr.1ms.run/qq987985/gongdi-ledger:latest"
