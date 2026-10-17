import fs from'node:fs';import{createHash}from'node:crypto';
const root='/tmp/paseo-pr-native-followup-20261017/perf-stage',id=process.argv[2],dir=root+'/runs/'+id;
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sha=s=>createHash('sha256').update(s).digest('hex');
const config=read(dir+'/run-config.json'),exit=Number(fs.readFileSync(dir+'/exit-code','utf8'));
const markers=fs.readFileSync(dir+'/ui-markers.jsonl','utf8').trim().split('\n').map(JSON.parse);
const when=event=>Date.parse(markers.find(e=>e.event===event)?.at??'');
const windowStart=when('control-stream-trigger'),windowEnd=when('stream-finished-and-settled'),exportStart=when('perf-export-start'),exportEnd=when('perf-export-finished');
const raw=[];let parseErrors=0;
for(const line of fs.readFileSync(dir+'/observer-console.log','utf8').split('\n')){const match=line.match(/QA7186PERF (\{.*\})$/);if(!match)continue;try{raw.push(JSON.parse(match[1]))}catch{parseErrors++}}
fs.writeFileSync(dir+'/perf-raw-events.json',JSON.stringify(raw,null,2));
const headers=raw.filter(e=>e.event==='header'&&e.at>=exportStart&&e.at<=exportEnd).sort((a,b)=>a.at-b.at);
const header=headers.at(-1);let metrics=null,error=null;
const percentile=(values,p)=>{const a=[...values].sort((a,b)=>a-b);return a.length?a[Math.min(a.length-1,Math.floor((a.length-1)*p))]:null};
try{
 if(exit!==0)throw Error('Functional runtime exit '+exit);
 if(!header)throw Error('No end-of-window background metric header');
 const group=raw.filter(e=>e.launch===header.launch&&e.dump===header.dump),end=group.find(e=>e.event==='end');
 const allCounters=group.filter(e=>e.event==='counter'),allPersists=group.filter(e=>e.event==='persist');
 const clock=group.filter(e=>e.event==='clock').sort((a,b)=>a.index-b.index).flatMap(e=>e.values);
 if(!end||allCounters.length!==end.counters||allPersists.length!==end.persists||clock.length!==header.clock.reads)throw Error('Metric export incomplete');
 if(header.counterOverflow||header.persistOverflow)throw Error('Metric bound overflow');
 const inside=e=>header.wallAtZero+e.startMs>=windowStart&&header.wallAtZero+e.startMs<=windowEnd;
 const counters=allCounters.filter(inside),timeline=counters.filter(e=>e.kind==='timeline');
 const persists=allPersists.filter(inside),withTimeline=persists.filter(e=>e.rows.some(r=>r.kind==='timeline'));
 const counterMs=timeline.reduce((n,e)=>n+e.durationMs,0),counterBytes=timeline.reduce((n,e)=>n+e.bytes,0);
 const persistMs=withTimeline.reduce((n,e)=>n+e.durationMs,0),upsertBytes=withTimeline.reduce((n,e)=>n+e.rows.reduce((x,r)=>x+(r.bytes??0),0),0);
 if(!timeline.length||!withTimeline.length||!counterMs||!persistMs||!counterBytes||!upsertBytes)throw Error('Required metric denominator zero/unmeasurable');
 if(withTimeline.some(e=>e.rows.some(r=>r.bytes===null)))throw Error('Unmeasured materialized upsert bytes');
 const correctness={};
 for(const stage of ['after-stream','steady','after-reload','offline-steady']){
  const cache=read(dir+'/cache-'+stage+'.json'),row=cache.rows.find(r=>r.kind==='timeline');
  if(!cache.assistant?.matchesExpected||cache.assistant.bytes!==50014||cache.rows.some(r=>!r.sqlHexEqualsUtf8))throw Error('Actual SQL correctness failed: '+stage);
  correctness[stage]={assistantSha:cache.assistant.sha256,timelineSha:row?.payloadSha256,timelineBytes:row?.payloadBytes};
 }
 if(new Set(Object.values(correctness).map(v=>v.assistantSha)).size!==1||new Set(Object.values(correctness).map(v=>v.timelineSha)).size!==1)throw Error('Offline content hash changed');
 if(Math.max(...timeline.map(e=>e.bytes))!==correctness['after-stream'].timelineBytes)throw Error('Native bytecounter final size differs from actual SQLite');
 const offline=read(dir+'/offline-proof.json');if(offline.checks.some(c=>c.error!=='ECONNREFUSED'))throw Error('Offline proof invalid');
 const input=fs.readFileSync(dir+'/ws-ledger.jsonl','utf8').trim().split('\n').map(JSON.parse).filter(e=>e.event==='frame'&&e.direction==='host->native'&&e.fields?.message?.type==='agent_stream');
 const assistantFrames=input.filter(e=>e.fields?.message?.payload?.event?.item?.type==='assistant_message');
 const gaps=assistantFrames.slice(1).map((e,i)=>Date.parse(e.at)-Date.parse(assistantFrames[i].at));
 const frameTypesBySha=new Map(input.map(e=>[e.sha256,e.fields?.message?.payload?.event?.item?.type]));
 const texts=fs.readFileSync(dir+'/native-stream-text-private.jsonl','utf8').trim().split('\n').map(JSON.parse).filter(e=>frameTypesBySha.get(e.frameSha256)==='assistant_message').flatMap(e=>e.texts.map(t=>t.text)).join('');
 if(Buffer.byteLength(texts)!==50014||sha(texts)!==correctness['after-stream'].assistantSha)throw Error('Actual incoming content differs from DB');
 metrics={window:{start:new Date(windowStart).toISOString(),end:new Date(windowEnd).toISOString(),durationMs:windowEnd-windowStart,filter:'operation start within window; full operation duration; queue wait excluded from persist'},
  primary:{counterMs,counterMsPerMiB:counterMs/(counterBytes/1048576),persistMs,persistMsPerMiB:persistMs/(upsertBytes/1048576)},
  volume:{allCounterMisses:counters.length,timelineCounterMisses:timeline.length,counterBytes,allPersistOperations:persists.length,timelinePersistOperations:withTimeline.length,materializedUpsertRows:withTimeline.reduce((n,e)=>n+e.rows.length,0),materializedUpsertBytes:upsertBytes},
  timing:{counter:{p50:percentile(timeline.map(e=>e.durationMs),.5),p95:percentile(timeline.map(e=>e.durationMs),.95),max:Math.max(...timeline.map(e=>e.durationMs)),zeroDurations:timeline.filter(e=>e.durationMs===0).length},persist:{p50:percentile(withTimeline.map(e=>e.durationMs),.5),p95:percentile(withTimeline.map(e=>e.durationMs),.95),max:Math.max(...withTimeline.map(e=>e.durationMs))}},
  clock:{...header.clock,zeroReads:clock.filter(v=>v===0).length,p50EmptyReadMs:percentile(clock,.5),p95EmptyReadMs:percentile(clock,.95),maxEmptyReadMs:Math.max(...clock)},
  input:{agentStreamFrames:input.length,assistantFrames:assistantFrames.length,assistantBytes:Buffer.byteLength(texts),assistantSha256:sha(texts),first:assistantFrames[0]?.at,last:assistantFrames.at(-1)?.at,interarrivalMs:{p50:percentile(gaps,.5),p95:percentile(gaps,.95),max:Math.max(...gaps)}},
  dump:{launch:header.launch,dump:header.dump,at:new Date(header.at).toISOString(),totalCounterCalls:header.counterCalls,totalCacheHits:header.cacheHits,exportedCounters:allCounters.length,exportedPersists:allPersists.length},correctness,
  scope:'wall durations of actual existing calls; materialized upsert volume, not physical filesystem I/O count; no CPU/full-app-frame-rate claim'};
}catch(e){error=String(e)}
const result={config,exit,parseErrors,metrics,error,analyzedAt:new Date().toISOString()};fs.writeFileSync(dir+'/analysis.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({config,exit,error,primary:metrics?.primary,volume:metrics?.volume,clock:metrics?.clock,input:metrics?.input},null,2));if(error)process.exitCode=1;
