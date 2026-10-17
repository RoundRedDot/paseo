set -eu
root=/tmp/paseo-pr-native-followup-20261017
out=$root/causal-stage
repo=/Users/luopeihuan/workspace/rrd/paseo/.worktrees/native-render-stream-cost
qa_run=$out/runtime
[[ ! -e "$qa_run" ]]
mkdir -p "$qa_run" "$out/tmp" "$out/maestro-home"
export TMPDIR=$out/tmp PASEO_HOME=$qa_run/home/.paseo QA_7186_OUT=$qa_run
export MAESTRO_CLI_NO_ANALYTICS=1 JAVA_OPTS="-Duser.home=$out/maestro-home"
qa_host_pid='';qa_sim_id='';qa_video_pid='';qa_log_pid=''
mark(){ node -e 'require("fs").appendFileSync(process.argv[1],JSON.stringify({at:new Date().toISOString(),event:process.argv[2]})+"\n")' "$qa_run/ui-markers.jsonl" "$1"; }
cleanup(){
 qa_exit=$?;print -r -- "$qa_exit" > "$qa_run/exit-code"
 if [[ -n "$qa_video_pid" ]];then kill -INT "$qa_video_pid" 2>/dev/null||true;wait "$qa_video_pid" 2>/dev/null||true;fi
 if [[ -n "$qa_log_pid" ]];then kill -TERM "$qa_log_pid" 2>/dev/null||true;wait "$qa_log_pid" 2>/dev/null||true;fi
 if [[ -n "$qa_sim_id" ]];then
  xcrun simctl io "$qa_sim_id" screenshot "$qa_run/final-state.png" >> "$qa_run/cleanup.log" 2>&1||true
  xcrun simctl spawn "$qa_sim_id" log show --info --debug --last 10m --style compact --predicate 'process == "Paseo"' > "$qa_run/app-unified.log" 2>&1||true
  qa_data=$(xcrun simctl get_app_container "$qa_sim_id" sh.paseo data 2>/dev/null)||true
  if [[ -n "${qa_data:-}" ]];then
   qa_db=$(find "$qa_data" -name paseo-replica-row-store.db -print -quit)||true
   if [[ -n "${qa_db:-}" ]];then /usr/bin/sqlite3 -readonly -json "$qa_db" 'SELECT server_id,kind,id,length(CAST(payload AS BLOB)) AS bytes FROM rows ORDER BY kind,id;' > "$qa_run/cache-row-index-final.json" 2> "$qa_run/sqlite-error.log"||true;fi
  fi
  xcrun simctl shutdown "$qa_sim_id" >> "$qa_run/cleanup.log" 2>&1||true
  xcrun simctl delete "$qa_sim_id" >> "$qa_run/cleanup.log" 2>&1||true
 fi
 touch "$qa_run/stop"
 if [[ -n "$qa_host_pid" ]];then wait "$qa_host_pid"||true;fi
 xcrun simctl list -j devices > "$out/devices-after.json"
 date -u '+%Y-%m-%dT%H:%M:%SZ' > "$qa_run/cleanup.finished"
}
trap cleanup EXIT
trap 'exit 143' TERM
trap 'exit 130' INT
[[ $(git -C "$repo" rev-parse HEAD) == 85f7d56ea79f8b7c22538a2b763875f4ce2d74ad ]]
[[ -z $(git -C "$repo" status --porcelain) ]]
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$qa_run/started"
node --import "$repo/node_modules/tsx/dist/loader.mjs" "$out/native-host.mjs" > "$qa_run/host.log" 2>&1 &
qa_host_pid=$!;print -r -- "$qa_host_pid" > "$qa_run/host-pid"
for qa_n in {1..100};do [[ -f "$qa_run/info.json" ]]&&break;kill -0 "$qa_host_pid";sleep 0.2;done
[[ -f "$qa_run/info.json" ]]
qa_sim_id=$(xcrun simctl create 'Paseo-QA7186-causal-menu-20261017' com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro com.apple.CoreSimulator.SimRuntime.iOS-18-6)
print -r -- "$qa_sim_id" > "$qa_run/device-id"
xcrun simctl bootstatus "$qa_sim_id" -b > "$qa_run/boot.log" 2>&1
xcrun simctl install "$qa_sim_id" /tmp/paseo-review-repair-20261017/qa/7186-derived/Build/Products/Release-iphonesimulator/Paseo.app
xcrun simctl spawn "$qa_sim_id" log stream --level debug --style compact --predicate 'process == "Paseo" AND eventMessage CONTAINS "QA7186 "' > "$qa_run/observer-console.log" 2>&1 &
qa_log_pid=$!
xcrun simctl launch "$qa_sim_id" sh.paseo > "$qa_run/launch.log" 2>&1
mark app-launched
xcrun simctl io "$qa_sim_id" recordVideo --codec h264 "$qa_run/continuous-release.mov" > "$qa_run/video.log" 2>&1 &
qa_video_pid=$!
sleep 12
qa_route=$(node -e 'const i=require(process.argv[1]);console.log(`paseo:///h/${i.serverId}/workspace/${i.workspaceId}?open=${encodeURIComponent("agent:"+i.agentId)}`)' "$qa_run/info.json")
print -r -- "$qa_route" > "$qa_run/route.txt"
mark cold-deeplink
xcrun simctl openurl "$qa_sim_id" "$qa_route"
sleep 8
cd "$qa_run"
/Users/luopeihuan/.maestro/bin/maestro --device "$qa_sim_id" test --debug-output "$qa_run/maestro-loading" "$out/prepare-loading.yaml" > "$qa_run/maestro-loading.log" 2>&1
xcrun simctl io "$qa_sim_id" screenshot "$qa_run/loading-before-menu.png"
node "$out/checkpoint.mjs" "$qa_run" before-menu
mark before-normal-menu-flow
/Users/luopeihuan/.maestro/bin/maestro --device "$qa_sim_id" test --debug-output "$qa_run/maestro-menu" "$out/open-menu.yaml" > "$qa_run/maestro-menu.log" 2>&1
mark after-normal-menu-flow
node "$out/checkpoint.mjs" "$qa_run" after-menu
xcrun simctl io "$qa_sim_id" screenshot "$qa_run/chat-after-menu-close.png"
qa_data=$(xcrun simctl get_app_container "$qa_sim_id" sh.paseo data)
qa_db=$(find "$qa_data" -name paseo-replica-row-store.db -print -quit)
[[ -n "$qa_db" ]]
/usr/bin/sqlite3 -readonly -json "$qa_db" 'SELECT server_id,kind,id,length(CAST(payload AS BLOB)) AS bytes FROM rows ORDER BY kind,id;' > "$qa_run/cache-before-stream.json"
mark control-stream-trigger
touch "$qa_run/stream"
sleep 4
xcrun simctl io "$qa_sim_id" screenshot "$qa_run/during-stream.png"
for qa_n in {1..140};do [[ -f "$qa_run/stream-done" ]]&&break;kill -0 "$qa_host_pid";sleep 1;done
[[ -f "$qa_run/stream-done" ]]
sleep 8
mark stream-finished-and-settled
xcrun simctl io "$qa_sim_id" screenshot "$qa_run/after-stream.png"
QA_CACHE_STAGE=after-stream node "$out/verify-cache.mjs" "$qa_db" "$qa_run"
/Users/luopeihuan/.maestro/bin/maestro --device "$qa_sim_id" test --debug-output "$qa_run/maestro-content" "$out/assert-content.yaml" > "$qa_run/maestro-content.log" 2>&1
xcrun simctl io "$qa_sim_id" screenshot "$qa_run/content-steady.png"
sleep 6
QA_CACHE_STAGE=steady node "$out/verify-cache.mjs" "$qa_db" "$qa_run"
xcrun simctl io "$qa_sim_id" screenshot "$qa_run/content-steady-second.png"
xcrun simctl terminate "$qa_sim_id" sh.paseo
mark app-terminated-before-host-stop
touch "$qa_run/stop";wait "$qa_host_pid";qa_host_pid=''
node -e 'const n=require("net");Promise.all([54883,Number(require(process.argv[1]).upstreamPort)].flatMap(p=>["127.0.0.1","::1"].map(host=>new Promise((resolve,reject)=>{const s=n.connect(p,host);s.on("connect",()=>{s.destroy();reject(Error("unexpected listener"))});s.on("error",e=>e.code==="ECONNREFUSED"?resolve({port:p,host,error:e.code}):reject(e));})))).then(v=>console.log(JSON.stringify({at:new Date().toISOString(),checks:v}))).catch(e=>{console.error(e);process.exitCode=1})' "$qa_run/info.json" > "$qa_run/offline-proof.json"
mark daemon-offline-before-cold-reload
xcrun simctl launch "$qa_sim_id" sh.paseo > "$qa_run/relaunch.log" 2>&1
sleep 12
xcrun simctl openurl "$qa_sim_id" "$qa_route"
sleep 6
/Users/luopeihuan/.maestro/bin/maestro --device "$qa_sim_id" test --debug-output "$qa_run/maestro-reload" "$out/reload-content.yaml" > "$qa_run/maestro-reload.log" 2>&1
mark cold-offline-content-visible
xcrun simctl io "$qa_sim_id" screenshot "$qa_run/after-offline-reload.png"
QA_CACHE_STAGE=after-reload node "$out/verify-cache.mjs" "$qa_db" "$qa_run"
sleep 6
xcrun simctl io "$qa_sim_id" screenshot "$qa_run/after-offline-stable.png"
QA_CACHE_STAGE=offline-steady node "$out/verify-cache.mjs" "$qa_db" "$qa_run"
mark all-functional-checks-completed
