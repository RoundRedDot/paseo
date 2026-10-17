set -eu
out=/tmp/paseo-pr-native-followup-20261017
repo=/Users/luopeihuan/workspace/rrd/paseo/.worktrees/native-render-stream-cost
qa_round=${1:?round required}
qa_run=$out/$qa_round
mkdir -p "$qa_run" "$out/maestro-home" "$out/tmp"
export TMPDIR=$out/tmp
export PASEO_HOME=$qa_run/home/.paseo
export QA_7186_OUT=$qa_run
export MAESTRO_CLI_NO_ANALYTICS=1
export JAVA_OPTS="-Duser.home=$out/maestro-home"
qa_host_pid=''; qa_sim_id=''; qa_video_pid=''
cleanup() {
  qa_exit=$?
  print -r -- "$qa_exit" > "$qa_run/exit-code"
  if [[ -n "$qa_video_pid" ]]; then kill -INT "$qa_video_pid" 2>/dev/null || true; wait "$qa_video_pid" 2>/dev/null || true; fi
  if [[ -n "$qa_sim_id" ]]; then
    xcrun simctl io "$qa_sim_id" screenshot "$qa_run/final-state.png" >> "$qa_run/cleanup.log" 2>&1 || true
    xcrun simctl spawn "$qa_sim_id" log show --last 8m --style compact --predicate 'process == "Paseo"' > "$qa_run/app-unified.log" 2>&1 || true
    qa_data=$(xcrun simctl get_app_container "$qa_sim_id" sh.paseo data 2>/dev/null) || true
    if [[ -n "${qa_data:-}" ]]; then
      find "$qa_data" -name '*.db' -print > "$qa_run/db-paths-private.txt" || true
      qa_db=$(find "$qa_data" -name paseo-replica-row-store.db -print -quit) || true
      if [[ -n "${qa_db:-}" ]]; then /usr/bin/sqlite3 -readonly -json "$qa_db" 'SELECT kind,id,length(CAST(payload AS BLOB)) AS bytes FROM rows ORDER BY kind,id;' > "$qa_run/cache-row-index.json" 2> "$qa_run/sqlite-error.log" || true; fi
    fi
    xcrun simctl shutdown "$qa_sim_id" >> "$qa_run/cleanup.log" 2>&1 || true
    xcrun simctl delete "$qa_sim_id" >> "$qa_run/cleanup.log" 2>&1 || true
  fi
  touch "$qa_run/stop"
  if [[ -n "$qa_host_pid" ]]; then wait "$qa_host_pid" || true; fi
  xcrun simctl list -j devices > "$qa_run/devices-after.json"
  date -u '+%Y-%m-%dT%H:%M:%SZ' > "$qa_run/cleanup.finished"
}
trap cleanup EXIT
trap "exit 143" TERM
trap "exit 130" INT
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$qa_run/started"
node --import "$repo/node_modules/tsx/dist/loader.mjs" "$out/native-host.mjs" > "$qa_run/host.log" 2>&1 &
qa_host_pid=$!
print -r -- "$qa_host_pid" > "$qa_run/host-pid"
for qa_n in {1..100}; do [[ -f "$qa_run/info.json" ]] && break; kill -0 "$qa_host_pid"; sleep 0.2; done
[[ -f "$qa_run/info.json" ]]
qa_sim_id=$(xcrun simctl create "Paseo-QA7186-native-followup-$qa_round" com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro com.apple.CoreSimulator.SimRuntime.iOS-18-6)
print -r -- "$qa_sim_id" > "$qa_run/device-id"
xcrun simctl bootstatus "$qa_sim_id" -b > "$qa_run/boot.log" 2>&1
qa_app=${QA_7186_APP:-$out/backup/stage3-app/Paseo.app}
xcrun simctl install "$qa_sim_id" "$qa_app"
xcrun simctl launch "$qa_sim_id" sh.paseo > "$qa_run/launch.log" 2>&1
xcrun simctl io "$qa_sim_id" recordVideo --codec h264 "$qa_run/release-smoke.mov" > "$qa_run/video.log" 2>&1 &
qa_video_pid=$!
sleep 12
xcrun simctl io "$qa_sim_id" screenshot "$qa_run/first-launch.png"
qa_route=$(node -e 'const i=require(process.argv[1]);console.log(`paseo:///h/${i.serverId}/workspace/${i.workspaceId}?open=${encodeURIComponent("agent:"+i.agentId)}`)' "$qa_run/info.json")
print -r -- "$qa_route" > "$qa_run/route.txt"
xcrun simctl openurl "$qa_sim_id" "$qa_route"
sleep 8
xcrun simctl io "$qa_sim_id" screenshot "$qa_run/before-stream.png"
cd "$qa_run"
/Users/luopeihuan/.maestro/bin/maestro --device "$qa_sim_id" test --debug-output "$qa_run/maestro" "$out/permissions.yaml" > "$qa_run/maestro.log" 2>&1
xcrun simctl io "$qa_sim_id" screenshot "$qa_run/prepared-chat.png"
touch "$qa_run/stream"
sleep 4
xcrun simctl io "$qa_sim_id" screenshot "$qa_run/during-stream.png"
for qa_n in {1..140}; do [[ -f "$qa_run/stream-done" ]] && break; kill -0 "$qa_host_pid"; sleep 1; done
[[ -f "$qa_run/stream-done" ]]
sleep 8
xcrun simctl io "$qa_sim_id" screenshot "$qa_run/after-stream.png"
qa_data=$(xcrun simctl get_app_container "$qa_sim_id" sh.paseo data)
qa_db=$(find "$qa_data" -name paseo-replica-row-store.db -print -quit)
[[ -n "$qa_db" ]]
node "$out/verify-cache.mjs" "$qa_db" "$qa_run/cache-after-stream.json"
xcrun simctl terminate "$qa_sim_id" sh.paseo
touch "$qa_run/stop"
wait "$qa_host_pid"
qa_host_pid=''
node -e 'const n=require("net");Promise.all([54883,Number(require(process.argv[1]).upstreamPort)].flatMap(p=>["127.0.0.1","::1"].map(host=>new Promise((resolve,reject)=>{const s=n.connect(p,host);s.on("connect",()=>{s.destroy();reject(Error("unexpected listener"))});s.on("error",e=>e.code==="ECONNREFUSED"?resolve({p,host,error:e.code}):reject(e));})))).then(v=>console.log(JSON.stringify(v))).catch(e=>{console.error(e);process.exitCode=1})' "$qa_run/info.json" > "$qa_run/offline-proof.json"
xcrun simctl launch "$qa_sim_id" sh.paseo > "$qa_run/relaunch.log" 2>&1
sleep 12
xcrun simctl openurl "$qa_sim_id" "$qa_route"
sleep 6
/Users/luopeihuan/.maestro/bin/maestro --device "$qa_sim_id" test --debug-output "$qa_run/maestro-reload" "$out/permissions.yaml" > "$qa_run/maestro-reload.log" 2>&1
xcrun simctl io "$qa_sim_id" screenshot "$qa_run/after-offline-reload.png"
node "$out/verify-cache.mjs" "$qa_db" "$qa_run/cache-after-reload.json"
sleep 6
xcrun simctl io "$qa_sim_id" screenshot "$qa_run/after-offline-stable.png"
node "$out/verify-cache.mjs" "$qa_db" "$qa_run/cache-after-stable.json"
