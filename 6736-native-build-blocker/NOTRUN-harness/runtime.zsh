set -eu
out=/tmp/paseo-pr-final-gaps-20261017/6736-native
repo=/Users/luopeihuan/workspace/rrd/paseo/.worktrees/pr-6736-parallel-20261016
qa_attempt=${1:?unique attempt name}
qa_run=$out/runs/$qa_attempt
[[ ! -e "$qa_run" ]]
[[ -e "$out/build/finished" ]]
mkdir -p "$qa_run" "$out/maestro-home"
export TMPDIR=$out/tmp PASEO_HOME=$qa_run/home/.paseo QA_6736_RUN=$qa_run
export MAESTRO_CLI_NO_ANALYTICS=1 JAVA_OPTS="-Duser.home=$out/maestro-home"
qa_host_pid='';qa_sim_id='';qa_video_pid='';qa_log_pid=''
mark(){ node -e 'require("fs").appendFileSync(process.argv[1],JSON.stringify({at:new Date().toISOString(),event:process.argv[2]})+"\n")' "$qa_run/ui-markers.jsonl" "$1"; }
cleanup(){
 qa_exit=$?;print -r -- "$qa_exit" > "$qa_run/exit-code"
 touch "$qa_run/stop"
 if [[ -n "$qa_video_pid" ]];then kill -INT "$qa_video_pid" 2>/dev/null||true;wait "$qa_video_pid" 2>/dev/null||true;fi
 if [[ -n "$qa_log_pid" ]];then kill -TERM "$qa_log_pid" 2>/dev/null||true;wait "$qa_log_pid" 2>/dev/null||true;fi
 if [[ -n "$qa_sim_id" ]];then
  xcrun simctl io "$qa_sim_id" screenshot "$qa_run/final-state.png" >> "$qa_run/cleanup.log" 2>&1||true
  xcrun simctl spawn "$qa_sim_id" log show --info --debug --last 15m --style compact --predicate 'process == "Paseo"' > "$qa_run/app-unified.log" 2>&1||true
  xcrun simctl shutdown "$qa_sim_id" >> "$qa_run/cleanup.log" 2>&1||true
  xcrun simctl delete "$qa_sim_id" >> "$qa_run/cleanup.log" 2>&1||true
 fi
 if [[ -n "$qa_host_pid" ]];then wait "$qa_host_pid"||true;fi
 xcrun simctl list -j devices > "$qa_run/devices-after.json"
 date -u '+%Y-%m-%dT%H:%M:%SZ' > "$qa_run/cleanup.finished"
}
trap cleanup EXIT
trap 'exit 143' TERM
trap 'exit 130' INT
wait_file(){ for qa_n in {1..180};do [[ -f "$1" ]]&&return 0;kill -0 "$qa_host_pid";sleep 0.2;done;return 1; }
start_host(){
 export QA_6736_PHASE=$1
 node --import "$repo/node_modules/tsx/dist/loader.mjs" "$out/native-host.mjs" > "$qa_run/host-$1.log" 2>&1 &
 qa_host_pid=$!;print -r -- "$qa_host_pid" > "$qa_run/host-pid-$1"
 wait_file "$qa_run/ready-$1"
}
flow(){
 qa_name=$1;qa_yaml=$2
 mkdir -p "$qa_run/ui/$qa_name"
 cd "$qa_run/ui/$qa_name"
 /Users/luopeihuan/.maestro/bin/maestro --device "$qa_sim_id" test --debug-output "$qa_run/maestro-$qa_name" "$out/$qa_yaml" > "$qa_run/maestro-$qa_name.log" 2>&1
}
reload_app(){
 mark "$1-terminate"
 xcrun simctl terminate "$qa_sim_id" sh.paseo
 xcrun simctl launch "$qa_sim_id" sh.paseo > "$qa_run/launch-$1.log" 2>&1
 sleep 8
 xcrun simctl openurl "$qa_sim_id" "$qa_route"
 sleep 4
 flow "$1-menu" normal-menu.yaml
 mark "$1-known-workspace-open"
}
[[ $(git -C "$repo" rev-parse HEAD) == bd3bbb45f612df5fcdd02f5355d545d13341ade0 ]]
[[ -z $(git -C "$repo" status --porcelain) ]]
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$qa_run/started"
node --check "$out/native-host.mjs"
node --check "$out/provider-fixture.mjs"
node --check "$out/verify-cache.mjs"
start_host 1
qa_sim_id=$(xcrun simctl create "Paseo-QA6736-images-$qa_attempt" com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro com.apple.CoreSimulator.SimRuntime.iOS-18-6)
print -r -- "$qa_sim_id" > "$qa_run/device-id"
xcrun simctl bootstatus "$qa_sim_id" -b > "$qa_run/boot.log" 2>&1
xcrun simctl install "$qa_sim_id" "$out/app/Paseo.app"
xcrun simctl spawn "$qa_sim_id" log stream --level debug --style compact --predicate 'process == "Paseo"' > "$qa_run/app-console.log" 2>&1 &
qa_log_pid=$!
xcrun simctl launch "$qa_sim_id" sh.paseo > "$qa_run/launch.log" 2>&1
mark initial-app-launched
xcrun simctl io "$qa_sim_id" recordVideo --codec h264 "$qa_run/continuous-native.mov" > "$qa_run/video.log" 2>&1 &
qa_video_pid=$!
sleep 12
qa_route=$(node -e 'const i=require(process.argv[1]);console.log(`paseo:///h/${i.serverId}/workspace/${i.workspaceId}?open=${encodeURIComponent("agent:"+i.agentId)}`)' "$qa_run/canonical-info.json")
print -r -- "$qa_route" > "$qa_run/route.txt"
mark initial-known-workspace-deeplink
xcrun simctl openurl "$qa_sim_id" "$qa_route"
sleep 5
flow initial-menu normal-menu.yaml
mark normal-menu-demand-and-chat
mark api-image-only-submit
touch "$qa_run/send-1";wait_file "$qa_run/send-1.done"
flow image-only one-image.yaml
qa_data=$(xcrun simctl get_app_container "$qa_sim_id" sh.paseo data)
qa_db=$(find "$qa_data" -name paseo-replica-row-store.db -print -quit)
[[ -n "$qa_db" ]]
node "$out/verify-cache.mjs" "$qa_db" "$qa_run" live-image-only live-image-only-sender.json 1 > "$qa_run/cache-live-image-only.log" 2>&1
mark image-only-preview-lightbox-and-sql-passed
mark api-text-image-submit
touch "$qa_run/send-2";wait_file "$qa_run/send-2.done"
flow live-two two-images.yaml
node "$out/verify-cache.mjs" "$qa_db" "$qa_run" live-two live-text-image-sender.json 2 > "$qa_run/cache-live-two.log" 2>&1
mark live-both-previews-lightboxes-and-sql-passed
reload_app app-reload
touch "$qa_run/snapshot-after-app-reload";wait_file "$qa_run/after-app-reload.done"
node "$out/verify-cache.mjs" "$qa_db" "$qa_run" app-reload after-app-reload-sender.json 2 > "$qa_run/cache-app-reload.log" 2>&1
flow app-reload two-images.yaml
mark app-reload-current-epoch-images-passed
mark first-host-normal-stop
touch "$qa_run/stop";wait "$qa_host_pid";qa_host_pid=''
node "$out/port-proof.mjs" "$qa_run/info-1.json" "$qa_run/ports-closed-between-host-processes.json"
mark first-host-exited-and-ports-closed
rm "$qa_run/stop"
start_host 2
wait_file "$qa_run/host-disk-restart.done"
node "$out/verify-cache.mjs" "$qa_db" "$qa_run" host-restart host-disk-restart-sender.json 2 > "$qa_run/cache-host-restart.log" 2>&1
flow host-restart two-images.yaml
mark new-host-disk-replay-current-epoch-images-passed
reload_app final-cold-reload
touch "$qa_run/snapshot-after-host-restart";wait_file "$qa_run/after-host-restart.done"
node "$out/verify-cache.mjs" "$qa_db" "$qa_run" final-cold-reload after-host-restart-sender.json 2 > "$qa_run/cache-final-cold-reload.log" 2>&1
flow final-cold-reload two-images.yaml
sleep 4
node "$out/verify-cache.mjs" "$qa_db" "$qa_run" final-steady after-host-restart-sender.json 2 > "$qa_run/cache-final-steady.log" 2>&1
mark all-requested-checks-completed
touch "$qa_run/stop";wait "$qa_host_pid";qa_host_pid=''
node "$out/port-proof.mjs" "$qa_run/info-2.json" "$qa_run/ports-closed-final.json"
