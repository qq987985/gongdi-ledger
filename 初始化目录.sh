#!/bin/sh
set -e
cd "$(dirname "$0")"

mkdir -p data/accounts data/books data/backups data/templates \
  data/photos/id data/photos/bank data/photos/ic \
  data/photos/报量单 data/photos/发票 data/photos/收款回单 data/photos/考勤影像 data/photos/合同扫描件 data/photos/报销凭证 data/photos/报销打款

if [ -e data/VERSION.txt ]; then
  echo "发现 data/VERSION.txt（旧挂载残留），已删除"
  rm -rf data/VERSION.txt
fi

echo "已准备 data 目录："
echo "  $(pwd)/data/accounts"
echo "  $(pwd)/data/books"
echo "  $(pwd)/data/backups"
echo "  $(pwd)/data/templates"
echo "  $(pwd)/data/photos/id"
echo "  $(pwd)/data/photos/bank"
echo "  $(pwd)/data/photos/ic"
echo "  $(pwd)/data/photos/报量单"
echo "  $(pwd)/data/photos/发票"
echo "  $(pwd)/data/photos/收款回单"
echo "  $(pwd)/data/photos/考勤影像"
echo "  $(pwd)/data/photos/合同扫描件"
echo "  $(pwd)/data/photos/报销凭证"
echo "  $(pwd)/data/photos/报销打款"
echo
echo "不会清空已有文件。"
