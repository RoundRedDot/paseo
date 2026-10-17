set -eu
out=/tmp/paseo-pr-gap-20261017/7186-release
snapshot=/private/tmp/paseo-review-repair-20261017/qa/native-7186
repo=/Users/luopeihuan/workspace/rrd/paseo/.worktrees/native-render-stream-cost
export TMPDIR=$out/tmp
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$out/build-2.started"
for p in highlight protocol client plugin relay; do
  [[ -d "$repo/packages/$p/dist" ]]
  cp -R "$repo/packages/$p/dist" "$snapshot/packages/$p/"
done
cp -R "$repo/packages/expo-two-way-audio/build" "$snapshot/packages/expo-two-way-audio/"
export EXPO_PUBLIC_LOCAL_DAEMON=127.0.0.1:$(cat "$out/port")
export ENTRY_FILE=$snapshot/packages/app/index.ts
export APP_VARIANT=production EXPO_NO_TELEMETRY=1 CI=1
cd "$snapshot/packages/app/ios"
xcodebuild -workspace "$snapshot/packages/app/ios/Paseo.xcworkspace" -scheme Paseo -configuration Release -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/paseo-review-repair-20261017/qa/7186-derived -jobs 2 CODE_SIGNING_ALLOWED=NO IPHONEOS_DEPLOYMENT_TARGET=15.1 ONLY_ACTIVE_ARCH=YES ARCHS=arm64 build > "$out/build-2.xcode.log" 2>&1
app=/tmp/paseo-review-repair-20261017/qa/7186-derived/Build/Products/Release-iphonesimulator/Paseo.app
file "$app/main.jsbundle" > "$out/public/bundle-kind.txt"
shasum -a 256 "$app/main.jsbundle" "$app/Paseo" > "$out/public/build-sha256.txt"
strings "$app/main.jsbundle" | rg -o "127\\.0\\.0\\.1:$(cat "$out/port")" > "$out/baked-endpoint.txt"
[[ -s "$out/baked-endpoint.txt" ]]
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$out/build-2.finished"
