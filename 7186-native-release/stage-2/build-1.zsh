set -eu
out=/tmp/paseo-pr-gap-20261017/7186-release
snapshot=/private/tmp/paseo-review-repair-20261017/qa/native-7186
repo=/Users/luopeihuan/workspace/rrd/paseo/.worktrees/native-render-stream-cost
export TMPDIR=$out/tmp
[[ $(git -C "$repo" rev-parse HEAD) == 85f7d56ea79f8b7c22538a2b763875f4ce2d74ad ]]
[[ -z $(git -C "$repo" status --porcelain) ]]
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$out/build-1.started"
cp "$snapshot/packages/app/metro.config.cjs" "$out/metro.original.cjs"
cat >> "$snapshot/packages/app/metro.config.cjs" <<'JS'

// QA snapshot only: expose the real targets of checkout-local dependency symlinks.
module.exports.watchFolders = [...new Set([...module.exports.watchFolders,
  "/Users/luopeihuan/workspace/rrd/paseo/.worktrees/native-render-stream-cost",
])];
JS
diff -u "$out/metro.original.cjs" "$snapshot/packages/app/metro.config.cjs" > "$out/public/metro-snapshot.diff" || [[ $? == 1 ]]
node -e 'const n=require("net"),f=require("fs"),s=n.createServer();s.listen(0,"127.0.0.1",()=>{const p=s.address().port;if([6767,6768].includes(p))throw Error("forbidden");f.writeFileSync(process.argv[1],String(p));s.close()})' "$out/port"
export EXPO_PUBLIC_LOCAL_DAEMON=127.0.0.1:$(cat "$out/port")
export ENTRY_FILE=$snapshot/packages/app/index.ts
export APP_VARIANT=production EXPO_NO_TELEMETRY=1 CI=1
cd "$snapshot/packages/app/ios"
xcodebuild -workspace "$snapshot/packages/app/ios/Paseo.xcworkspace" -scheme Paseo -configuration Release -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/paseo-review-repair-20261017/qa/7186-derived -jobs 2 CODE_SIGNING_ALLOWED=NO IPHONEOS_DEPLOYMENT_TARGET=15.1 ONLY_ACTIVE_ARCH=YES ARCHS=arm64 build > "$out/build-1.xcode.log" 2>&1
app=/tmp/paseo-review-repair-20261017/qa/7186-derived/Build/Products/Release-iphonesimulator/Paseo.app
file "$app/main.jsbundle" > "$out/public/bundle-kind.txt"
shasum -a 256 "$app/main.jsbundle" "$app/Paseo" > "$out/public/build-sha256.txt"
strings "$app/main.jsbundle" | rg -o "127\\.0\\.0\\.1:$(cat "$out/port")" > "$out/baked-endpoint.txt"
[[ -s "$out/baked-endpoint.txt" ]]
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$out/build-1.finished"
