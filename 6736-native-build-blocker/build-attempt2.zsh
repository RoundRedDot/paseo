set -eu
out=/tmp/paseo-pr-final-gaps-20261017/6736-native
repo=/Users/luopeihuan/workspace/rrd/paseo/.worktrees/pr-6736-parallel-20261016
[[ $(git -C "$repo" rev-parse HEAD) == bd3bbb45f612df5fcdd02f5355d545d13341ade0 ]]
[[ -z $(git -C "$repo" status --porcelain) ]]
[[ ! -e "$out/build/attempt-2" ]]
mkdir "$out/build/attempt-2"
export TMPDIR=$out/tmp APP_VARIANT=production EXPO_NO_TELEMETRY=1 CI=1
qa_port=$(node -e 'console.log(require(process.argv[1]).port)' "$out/endpoint.json")
export EXPO_PUBLIC_LOCAL_DAEMON=127.0.0.1:$qa_port
export ENTRY_FILE=/private/tmp/paseo-pr-final-gaps-20261017/6736-native/snapshot/packages/app/index.ts
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$out/build/attempt-2/started"
xcodebuild -workspace "$out/snapshot/packages/app/ios/Paseo.xcworkspace" -scheme Paseo -configuration Release -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath "$out/DerivedData-fresh" -jobs 2 CODE_SIGNING_ALLOWED=NO IPHONEOS_DEPLOYMENT_TARGET=15.1 ONLY_ACTIVE_ARCH=YES ARCHS=arm64 build > "$out/build/attempt-2/xcode.log" 2>&1
mkdir -p "$out/app"
cp -cR "$out/DerivedData-fresh/Build/Products/Release-iphonesimulator/Paseo.app" "$out/app/Paseo.app"
cp "$out/DerivedData-fresh/Build/Products/Release-iphonesimulator/main.jsbundle" "$out/build/attempt-2/raw.jsbundle"
shasum -a 256 "$out/app/Paseo.app/Paseo" "$out/app/Paseo.app/main.jsbundle" > "$out/build/sha256.txt"
file "$out/app/Paseo.app/main.jsbundle" > "$out/build/hermes-kind.txt"
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$out/build/attempt-2/finished"
cp "$out/build/attempt-2/finished" "$out/build/finished"
