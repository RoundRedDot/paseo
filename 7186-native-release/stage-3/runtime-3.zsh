set -eu
out=/tmp/paseo-pr-gap-20261017/7186-release
repo=/Users/luopeihuan/workspace/rrd/paseo/.worktrees/native-render-stream-cost
export TMPDIR=$out/tmp
export PASEO_HOME=$out/runtime-3/home/.paseo
mkdir -p "$out/runtime-3"
export QA_7186_OUT=$out/runtime-3
mkdir -p "$out/maestro-home"
export MAESTRO_CLI_NO_ANALYTICS=1
export JAVA_OPTS="-Duser.home=$out/maestro-home"
qa_host_pid=''; qa_sim_id=''; qa_video_pid=''
cleanup() {
  if [[ -n "$qa_video_pid" ]]; then kill -INT "$qa_video_pid" 2>/dev/null || true; wait "$qa_video_pid" 2>/dev/null || true; fi
  if [[ -n "$qa_sim_id" ]]; then
    xcrun simctl spawn "$qa_sim_id" log show --last 8m --style compact --predicate 'process == "Paseo"' > "$out/runtime-3/app-unified.log" 2>&1 || true
    xcrun simctl shutdown "$qa_sim_id" >> "$out/runtime-3/cleanup.log" 2>&1 || true
    xcrun simctl delete "$qa_sim_id" >> "$out/runtime-3/cleanup.log" 2>&1 || true
  fi
  touch "$out/runtime-3/stop"
  if [[ -n "$qa_host_pid" ]]; then wait "$qa_host_pid" || true; fi
  xcrun simctl list -j devices > "$out/devices-after.json"
  date -u '+%Y-%m-%dT%H:%M:%SZ' > "$out/runtime-3/cleanup.finished"
}
trap cleanup EXIT
trap "exit 143" TERM
trap "exit 130" INT
[[ -f "$out/stage-3/build.finished" ]]
[[ -s "$out/stage-3/baked-endpoint.txt" ]]
node --import "$repo/node_modules/tsx/dist/loader.mjs" "$out/native-host.mjs" > "$out/runtime-3/host.log" 2>&1 &
qa_host_pid=$!
print -r -- "$qa_host_pid" > "$out/runtime-3/host-pid"
for qa_n in {1..100}; do [[ -f "$out/runtime-3/info.json" ]] && break; kill -0 "$qa_host_pid"; sleep 0.2; done
[[ -f "$out/runtime-3/info.json" ]]
qa_sim_id=$(xcrun simctl create 'Paseo-QA7186-Release-Gap-20261017' com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro com.apple.CoreSimulator.SimRuntime.iOS-18-6)
print -r -- "$qa_sim_id" > "$out/runtime-3/device-id"
xcrun simctl bootstatus "$qa_sim_id" -b > "$out/runtime-3/boot.log" 2>&1
xcrun simctl install "$qa_sim_id" /tmp/paseo-review-repair-20261017/qa/7186-derived/Build/Products/Release-iphonesimulator/Paseo.app
xcrun simctl launch "$qa_sim_id" sh.paseo > "$out/runtime-3/launch.log" 2>&1
xcrun simctl io "$qa_sim_id" recordVideo --codec h264 "$out/runtime-3/release-smoke.mov" > "$out/runtime-3/video.log" 2>&1 &
qa_video_pid=$!
sleep 12
xcrun simctl io "$qa_sim_id" screenshot "$out/runtime-3/first-launch.png"
qa_route=$(node -e 'const i=require(process.argv[1]);console.log(`paseo:///h/${i.serverId}/workspace/${i.workspaceId}?open=${encodeURIComponent("agent:"+i.agentId)}`)' "$out/runtime-3/info.json")
xcrun simctl openurl "$qa_sim_id" "$qa_route"
sleep 8
xcrun simctl io "$qa_sim_id" screenshot "$out/runtime-3/before-stream.png"
cd "$out/runtime-3"
/Users/luopeihuan/.maestro/bin/maestro --device "$qa_sim_id" test --debug-output "$out/runtime-3/maestro" "$out/permissions.yaml" > "$out/runtime-3/maestro.log" 2>&1
xcrun simctl io "$qa_sim_id" screenshot "$out/runtime-3/prepared-chat.png"
touch "$out/runtime-3/ready"
touch "$out/runtime-3/stream"
sleep 4
xcrun simctl io "$qa_sim_id" screenshot "$out/runtime-3/during-stream.png"
for qa_n in {1..140}; do [[ -f "$out/runtime-3/stream-done" ]] && break; kill -0 "$qa_host_pid"; sleep 1; done
[[ -f "$out/runtime-3/stream-done" ]]
sleep 8
xcrun simctl io "$qa_sim_id" screenshot "$out/runtime-3/after-stream.png"
qa_data=$(xcrun simctl get_app_container "$qa_sim_id" sh.paseo data)
qa_db=$(find "$qa_data" -name paseo-replica-row-store.db -print -quit)
[[ -n "$qa_db" ]]
node "$out/verify-cache.mjs" "$qa_db" "$out/runtime-3/cache-after-stream.json"
# Stop only this synthetic daemon before restarting, so history cannot come from the network.
xcrun simctl terminate "$qa_sim_id" sh.paseo
touch "$out/runtime-3/stop"
wait "$qa_host_pid"
qa_host_pid=''
node -e 'const n=require("net"),f=require("fs"),p=Number(f.readFileSync(process.argv[1],"utf8")),s=n.connect(p,"127.0.0.1");s.on("connect",()=>{s.destroy();process.exit(1)});s.on("error",e=>{if(e.code!=="ECONNREFUSED")process.exit(1);console.log("isolated host closed: ECONNREFUSED")})' "$out/port" > "$out/runtime-3/offline-proof.log"
xcrun simctl launch "$qa_sim_id" sh.paseo > "$out/runtime-3/relaunch.log" 2>&1
sleep 12
xcrun simctl openurl "$qa_sim_id" "$qa_route"
sleep 6
/Users/luopeihuan/.maestro/bin/maestro --device "$qa_sim_id" test --debug-output "$out/runtime-3/maestro-reload" "$out/permissions.yaml" > "$out/runtime-3/maestro-reload.log" 2>&1
xcrun simctl io "$qa_sim_id" screenshot "$out/runtime-3/after-offline-reload.png"
node "$out/verify-cache.mjs" "$qa_db" "$out/runtime-3/cache-after-reload.json"
touch "$out/runtime-3/reload-ready"
sleep 6
xcrun simctl io "$qa_sim_id" screenshot "$out/runtime-3/after-offline-stable.png"
node "$out/verify-cache.mjs" "$qa_db" "$out/runtime-3/cache-after-stable.json"
