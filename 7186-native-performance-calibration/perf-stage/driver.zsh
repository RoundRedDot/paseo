set -eu
out=/tmp/paseo-pr-native-followup-20261017/perf-stage
run_one(){
 qa_v=$1;qa_id=$2;qa_role=$3
 if /usr/bin/lockf -k /tmp/paseo-pr-followup-validation.lock /bin/zsh "$out/runtime.zsh" "$qa_v" "$qa_id" "$qa_role" > "$out/runs/$qa_id.log" 2>&1;then
  /usr/bin/lockf -k /tmp/paseo-pr-followup-validation.lock /bin/zsh "$out/analyze-run.zsh" "$qa_id" > "$out/runs/$qa_id.analysis.log" 2>&1
 else
  print -r -- "runtime failed: $qa_id" > "$out/driver.failed"
  /usr/bin/lockf -k /tmp/paseo-pr-followup-validation.lock /bin/zsh "$out/analyze-run.zsh" "$qa_id" > "$out/runs/$qa_id.analysis.log" 2>&1 || true
  return 1
 fi
}
[[ -f "$out/runs/WARM1/analysis.json" ]]
run_one A CAL01 calibration
run_one A CAL02 calibration
/usr/bin/lockf -k /tmp/paseo-pr-followup-validation.lock /bin/zsh "$out/calibrate.zsh" > "$out/calibrate.log" 2>&1
[[ -f "$out/calibration-passed" ]] || exit 0
run_one B WARM2 warmup
run_one A RUN01 scored
run_one B RUN02 scored
run_one B RUN03 scored
run_one A RUN04 scored
run_one B RUN05 scored
run_one A RUN06 scored
run_one A RUN07 scored
run_one B RUN08 scored
