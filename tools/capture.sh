#!/bin/bash
# sites.json に載っているサイトのサムネイルを thumbs/ に撮り直す
# 使い方: tools/capture.sh            … 全サイト
#         tools/capture.sh <repo>     … 1 サイトだけ
# 撮影サイズは sites.json の "shot"（例: "1280x1600"）。指定がなければ 1280x900
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
only="${1:-}"

python3 -I -c 'import json,sys
for s in json.load(open("sites.json", encoding="utf-8")):
    print(s["repo"], s.get("url") or "https://msk-1.github.io/%s/" % s["repo"], s.get("shot", "1280x900"))' |
while read -r repo url shot; do
  [ -n "$only" ] && [ "$only" != "$repo" ] && continue
  w="${shot%x*}"; h="${shot#*x}"
  tmp="$(mktemp -t thumb).png"
  "$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=1 \
    --window-size="$w,$h" --virtual-time-budget=5000 --screenshot="$tmp" "$url" >/dev/null 2>&1
  # 幅 800px の JPEG にして容量を抑える
  sips -s format jpeg -s formatOptions 82 --resampleWidth 800 "$tmp" --out "thumbs/$repo.jpg" >/dev/null
  rm -f "$tmp"
  echo "thumbs/$repo.jpg ($shot)"
done
