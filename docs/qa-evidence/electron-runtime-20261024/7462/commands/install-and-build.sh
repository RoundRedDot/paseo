#!/bin/zsh
set -eu
lease=/Users/luopeihuan/workspace/rrd/paseo/.dev/pr-parallel-20261024/git-hooks-lease
while ! mkdir "$lease" 2>/dev/null; do sleep 5; done
print "electron-qa 7462 install=$$" > "$lease/owner"
trap '[[ ! -e "$lease/owner" ]] || { rm "$lease/owner"; rmdir "$lease"; }' EXIT
npm ci --no-audit --no-fund > .dev/electron-qa-evidence/install.log 2>&1
rm "$lease/owner"
rmdir "$lease"
trap - EXIT
zsh .dev/electron-qa-evidence/build.sh
node .dev/electron-qa-evidence/receipt.cjs
node .dev/electron-qa-evidence/run-packaged.cjs 7462
