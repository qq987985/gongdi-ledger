#!/bin/sh
set -e
cd "$(dirname "$0")"

if [ ! -f app/server/index.mjs ]; then
  echo "缺少 app/server/index.mjs，请把压缩包完整解压到本目录"
  exit 1
fi

# 只补目录，绝不清空 data
mkdir -p data/accounts data/books data/backups data/templates \
  data/photos/id data/photos/bank data/photos/ic \
  data/photos/报量单 data/photos/发票 data/photos/收款回单 data/photos/考勤影像

if [ ! -f VERSION.txt ]; then
  printf 'v56\n\n[v56]\n纯净安装包\n' > VERSION.txt
fi

echo "停止旧容器（如果有）..."
docker compose down --timeout 8 2>/dev/null || true
docker rm -f attendance-app 2>/dev/null || true

echo "构建并启动..."
docker compose up -d --build --force-recreate

echo
echo "完成。打开：http://本机IP:8501"
echo "数据目录：$(pwd)/data  （原有台账会自动接上，不会被覆盖清空）"
echo "左下角应显示 VERSION 56"
