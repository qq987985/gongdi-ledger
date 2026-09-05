#!/bin/sh
set -e
cd "$(dirname "$0")/.."
ROOT=$(pwd)
OUT=$ROOT/gongdi-windows.zip
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT

if [ ! -f app/server/index.mjs ]; then
  echo "缺少 app/server/index.mjs" >&2
  exit 1
fi

mkdir -p "$STAGE/node"
cp -a app "$STAGE/app"
rm -rf "$STAGE/app/public/__grok" 2>/dev/null || true
mkdir -p "$STAGE/win"
cp win/启动.bat win/停止.bat "$STAGE/win/"
# 同时在 zip 根目录放一份，保证在线更新脚本（只在解压根目录找 bat）能更新启动器
cp win/启动.bat win/停止.bat "$STAGE/"
cp VERSION.txt "$STAGE/" 2>/dev/null || true
cp 使用说明.md "$STAGE/" 2>/dev/null || true
cp 目录结构.txt "$STAGE/" 2>/dev/null || true
printf '%s\n' '工地台账 Windows 解压即用' '双击 win/启动.bat' 'http://127.0.0.1:8501' '数据在 data，不要删。' > "$STAGE/说明.txt"

if [ -f /tmp/node-win/node.exe ]; then
  cp /tmp/node-win/node.exe "$STAGE/node/node.exe"
  # 缓存可能损坏：不是 Windows 可执行（MZ 头）或过小则丢弃重下
  if [ "$(head -c 2 "$STAGE/node/node.exe")" != "MZ" ] || [ "$(wc -c < "$STAGE/node/node.exe" | tr -d ' ')" -lt 50000000 ]; then
    echo "本地缓存的 node.exe 损坏，重新下载" >&2
    rm -rf /tmp/node-win /tmp/node-win.zip /tmp/nodewin-ci "$STAGE/node/node.exe"
  fi
fi

if [ ! -f "$STAGE/node/node.exe" ]; then
  rm -rf /tmp/nodewin-ci /tmp/node-win.zip
  curl -fsSL -o /tmp/node-win.zip "https://nodejs.org/dist/v22.18.0/node-v22.18.0-win-x64.zip"
  python3 - <<PY
import zipfile, shutil
from pathlib import Path
z=zipfile.ZipFile("/tmp/node-win.zip")
z.extractall("/tmp/nodewin-ci")
src=next(Path("/tmp/nodewin-ci").glob("*/node.exe"))
shutil.copy2(src, Path("$STAGE")/"node"/"node.exe")
PY
  mkdir -p /tmp/node-win && cp "$STAGE/node/node.exe" /tmp/node-win/node.exe
fi

# 最终校验：必须是 Windows 可执行文件（MZ 头）且大于 50MB（node.exe 约 80MB）
if [ "$(head -c 2 "$STAGE/node/node.exe")" != "MZ" ] || [ "$(wc -c < "$STAGE/node/node.exe" | tr -d ' ')" -lt 50000000 ]; then
  echo "node.exe 下载校验失败" >&2
  exit 1
fi

python3 - <<PY
import zipfile
from pathlib import Path
root=Path("$STAGE")
out=Path("$OUT")
with zipfile.ZipFile(out,"w",zipfile.ZIP_DEFLATED) as z:
    for p in root.rglob("*"):
        rel=p.relative_to(root).as_posix()
        if p.is_dir():
            z.writestr(rel+"/","")
        elif p.is_file():
            z.write(p, rel)
print("wrote", out, out.stat().st_size)
PY
