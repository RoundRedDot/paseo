#!/bin/zsh
set -eu
root=/Users/luopeihuan/workspace/rrd/paseo/.dev/pr-parallel-20261024
lease=''
while [[ ! -e "$root/slider-commit-slot-acquired" ]]; do sleep 5; done
while [[ ! -e "$root/slider-priority-acquired" ]]; do sleep 5; done
while [[ -z "$lease" ]]; do
  for n in 1 2; do
    candidate="$root/heavy-slot-$n"
    if mkdir "$candidate" 2>/dev/null; then
      lease="$candidate"
      print "electron-qa pid=$$ cwd=$PWD command=$*" > "$lease/owner"
      break
    fi
  done
  [[ -n "$lease" ]] || sleep 10
done
trap 'rm "$lease/owner"; rmdir "$lease"' EXIT
print "lease=$lease started=$(date -u +%FT%TZ)"
"$@"
