#!/bin/sh
set -e
cd "$(dirname "$0")"
if [ ! -f app/server/index.mjs ]; then
  echo "缺少 app/server/index.mjs"
  exit 1
fi
mkdir -p data/accounts data/books data/backups data/templates \
  data/photos/id data/photos/bank data/photos/ic \
  data/photos/报量单 data/photos/发票 data/photos/收款回单 data/photos/考勤影像
echo "停止旧容器..."
docker compose down --timeout 8 2>/dev/null || true
docker rm -f attendance-app 2>/dev/null || true
echo "本地构建并启动..."
docker compose -f docker-compose.build.yml up -d --build --force-recreate
echo
echo "打开 http://本机IP:8501"
echo "数据目录: $(pwd)/data"
