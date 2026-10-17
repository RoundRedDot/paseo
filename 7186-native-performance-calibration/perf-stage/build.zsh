set -eu
out=/tmp/paseo-pr-native-followup-20261017/perf-stage
snapshot=/tmp/paseo-review-repair-20261017/qa/native-7186
qa_variant=${1:?A or B}
[[ "$qa_variant" == A || "$qa_variant" == B ]]
[[ ! -e "$out/builds/$qa_variant" ]]
mkdir -p "$out/builds/$qa_variant" "$out/apps/$qa_variant" "$out/tmp"
if [[ ! -e "$out/prebuild-finalized" ]];then node "$out/finalize-prebuild.mjs";touch "$out/prebuild-finalized";fi
cp "$out/snapshots/$qa_variant/tree/packages/app/src/runtime/replica-cache/index.ts" "$snapshot/packages/app/src/runtime/replica-cache/index.ts"
cp "$out/snapshots/$qa_variant/tree/packages/app/metro.config.cjs" "$snapshot/packages/app/metro.config.cjs"
cmp "$out/snapshots/$qa_variant/tree/packages/app/src/runtime/replica-cache/index.ts" "$snapshot/packages/app/src/runtime/replica-cache/index.ts"
export TMPDIR=$out/tmp
export APP_VARIANT=production EXPO_NO_TELEMETRY=1 CI=1 EXPO_PUBLIC_LOCAL_DAEMON=127.0.0.1:54883
export ENTRY_FILE=/private/tmp/paseo-review-repair-20261017/qa/native-7186/packages/app/index.ts
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$out/builds/$qa_variant/started"
xcodebuild -workspace "$snapshot/packages/app/ios/Paseo.xcworkspace" -scheme Paseo -configuration Release -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/paseo-review-repair-20261017/qa/7186-derived -jobs 2 CODE_SIGNING_ALLOWED=NO IPHONEOS_DEPLOYMENT_TARGET=15.1 ONLY_ACTIVE_ARCH=YES ARCHS=arm64 build > "$out/builds/$qa_variant/xcode.log" 2>&1
cp -cR /tmp/paseo-review-repair-20261017/qa/7186-derived/Build/Products/Release-iphonesimulator/Paseo.app "$out/apps/$qa_variant/Paseo.app"
cp /tmp/paseo-review-repair-20261017/qa/7186-derived/Build/Products/Release-iphonesimulator/main.jsbundle "$out/builds/$qa_variant/raw.jsbundle"
shasum -a 256 "$out/apps/$qa_variant/Paseo.app/Paseo" "$out/apps/$qa_variant/Paseo.app/main.jsbundle" "$snapshot/packages/app/src/runtime/replica-cache/index.ts" > "$out/builds/$qa_variant/sha256.txt"
file "$out/apps/$qa_variant/Paseo.app/main.jsbundle" > "$out/builds/$qa_variant/hermes-kind.txt"
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$out/builds/$qa_variant/finished"
