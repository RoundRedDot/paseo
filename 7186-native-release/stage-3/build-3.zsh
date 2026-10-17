set -eu
out=/tmp/paseo-pr-gap-20261017/7186-release
snapshot=/private/tmp/paseo-review-repair-20261017/qa/native-7186
repo=/Users/luopeihuan/workspace/rrd/paseo/.worktrees/native-render-stream-cost
export TMPDIR=$out/tmp
[[ $(git -C "$repo" rev-parse HEAD) == 85f7d56ea79f8b7c22538a2b763875f4ce2d74ad ]]
[[ -z $(git -C "$repo" status --porcelain) ]]
mkdir -p "$out/stage-2-preserved" "$out/stage-3"
cp /tmp/paseo-review-repair-20261017/qa/7186-derived/Build/Products/Release-iphonesimulator/main.jsbundle "$out/stage-2-preserved/main.jsbundle"
cp "$snapshot/packages/app/metro.config.cjs" "$out/stage-2-preserved/metro.config.cjs"
cp "$out/public/manifest.json" "$out/stage-2-preserved/public-manifest.json"
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$out/stage-3/build.started"
cat >> "$snapshot/packages/app/metro.config.cjs" <<'JS'

// QA snapshot only: one physical navigation package must have one Metro identity.
const qaFs = require("node:fs");
const qaCrypto = require("node:crypto");
const qaResolveRequest = module.exports.resolver.resolveRequest;
module.exports.resolver.resolveRequest = (context, specifier, platform) => {
  const result = qaResolveRequest(context, specifier, platform);
  if (result.type !== "sourceFile" ||
      !/[\\/]node_modules[\\/]@react-navigation[\\/](native|core)[\\/]/.test(result.filePath)) {
    return result;
  }
  const realpath = qaFs.realpathSync(result.filePath);
  const original = qaFs.readFileSync(result.filePath);
  const canonical = qaFs.readFileSync(realpath);
  if (!original.equals(canonical)) throw new Error("QA navigation canonicalization changed bytes");
  qaFs.appendFileSync("/tmp/paseo-pr-gap-20261017/7186-release/stage-3/resolver.jsonl",
    JSON.stringify({origin: context.originModulePath, specifier, platform,
      isESMImport: context.isESMImport, path: result.filePath, realpath,
      moduleIdentity: realpath, bytesEqual: true,
      sha256: qaCrypto.createHash("sha256").update(canonical).digest("hex")}) + "\n");
  return {...result, filePath: realpath};
};
JS
diff -u "$out/stage-2-preserved/metro.config.cjs" "$snapshot/packages/app/metro.config.cjs" > "$out/stage-3/normalization.diff" || [[ $? == 1 ]]
export EXPO_PUBLIC_LOCAL_DAEMON=127.0.0.1:$(cat "$out/port")
export ENTRY_FILE=$snapshot/packages/app/index.ts
export APP_VARIANT=production EXPO_NO_TELEMETRY=1 CI=1
cd "$snapshot/packages/app/ios"
xcodebuild -workspace "$snapshot/packages/app/ios/Paseo.xcworkspace" -scheme Paseo -configuration Release -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/paseo-review-repair-20261017/qa/7186-derived -jobs 2 CODE_SIGNING_ALLOWED=NO IPHONEOS_DEPLOYMENT_TARGET=15.1 ONLY_ACTIVE_ARCH=YES ARCHS=arm64 build > "$out/stage-3/build.xcode.log" 2>&1
app=/tmp/paseo-review-repair-20261017/qa/7186-derived/Build/Products/Release-iphonesimulator/Paseo.app
file "$app/main.jsbundle" > "$out/stage-3/bundle-kind.txt"
shasum -a 256 "$app/main.jsbundle" "$app/Paseo" > "$out/stage-3/build-sha256.txt"
strings "$app/main.jsbundle" | rg -o "127\\.0\\.0\\.1:$(cat "$out/port")" > "$out/stage-3/baked-endpoint.txt"
[[ -s "$out/stage-3/baked-endpoint.txt" ]]
node <<'JS'
const fs=require('fs');const out='/tmp/paseo-pr-gap-20261017/7186-release/stage-3';
const b=fs.readFileSync('/tmp/paseo-review-repair-20261017/qa/7186-derived/Build/Products/Release-iphonesimulator/main.jsbundle','utf8');
const marker='var NavigationContext = /*#__PURE__*/React.createContext(undefined);';
const hits=[...b.matchAll(/var NavigationContext = \/\*#__PURE__\*\/React.createContext\(undefined\);/g)].map(m=>{const tail=b.slice(m.index).match(/^\},(\d+),(\[[^\n]*\])\);/m);return{moduleId:Number(tail[1]),line:b.slice(0,m.index).split('\n').length}});
const calls=fs.readFileSync(out+'/resolver.jsonl','utf8').trim().split('\n').map(JSON.parse);
const contexts=calls.filter(c=>c.realpath.endsWith('/core/lib/module/NavigationContext.js'));
const result={contextDefinitions:hits,resolverCalls:calls.length,contextCalls:contexts,allBytesEqual:calls.every(c=>c.bytesEqual),contextModuleIdentities:[...new Set(contexts.map(c=>c.moduleIdentity))]};
fs.writeFileSync(out+'/module-audit.json',JSON.stringify(result,null,2));
if(hits.length!==1||result.contextModuleIdentities.length!==1||!result.allBytesEqual)throw Error('Navigation identity did not converge');
JS
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$out/stage-3/build.finished"
