import fs from 'node:fs';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';
const [db,out]=process.argv.slice(2),info=JSON.parse(fs.readFileSync(out+'/info.json','utf8'));
const rows=JSON.parse(execFileSync('/usr/bin/sqlite3',['-readonly','-json',db,'SELECT server_id,kind,id,payload,length(CAST(payload AS BLOB)) AS sqlBytes,hex(CAST(payload AS BLOB)) AS sqlHex FROM rows ORDER BY kind,id;'],{encoding:'utf8',maxBuffer:16*1024*1024}));
const sha=s=>createHash('sha256').update(s).digest('hex');
const timeline=rows.filter(r=>r.kind==='timeline'&&r.id===info.agentId&&r.server_id===info.serverId);
const stage=process.env.QA_CACHE_STAGE;
const summary={at:new Date().toISOString(),stage,rows:rows.map(r=>({serverId:r.server_id,kind:r.kind,id:r.id,payloadChars:r.payload.length,payloadBytes:Buffer.byteLength(r.payload),sqliteBytes:r.sqlBytes,sqlHexBytes:r.sqlHex.length/2,sqlHexEqualsUtf8:Buffer.from(r.sqlHex,'hex').equals(Buffer.from(r.payload,'utf8')),payloadSha256:sha(r.payload)}))};
if(timeline.length!==1){fs.writeFileSync(out+'/cache-'+stage+'.json',JSON.stringify(summary,null,2));throw Error('Expected actual target native timeline');}
const parsed=JSON.parse(timeline[0].payload),text=parsed.items.filter(i=>i.kind==='assistant_message').map(i=>i.text).join('');
const expected=('缓存😀'.repeat(2500)+'\n\n').repeat(2)+'QA7186-END';
summary.assistant={agentId:parsed.agentId,chars:text.length,bytes:Buffer.byteLength(text),sha256:sha(text),matchesExpected:text===expected,utf8RoundTrip:Buffer.from(text).toString('utf8')===text,replacementCharacters:[...text].filter(c=>c==='\ufffd').length,nonAsciiCodePoints:[...text].filter(c=>c.codePointAt(0)>127).length};
fs.writeFileSync(out+'/cache-'+stage+'.json',JSON.stringify(summary,null,2));
fs.writeFileSync(out+'/actual-timeline-'+stage+'.json',timeline[0].payload);
fs.writeFileSync(out+'/actual-assistant-'+stage+'.txt',text);
if(!summary.assistant.matchesExpected||!summary.assistant.utf8RoundTrip||summary.rows.some(r=>r.payloadBytes!==r.sqliteBytes||!r.sqlHexEqualsUtf8))throw Error('Actual native cache bytes mismatch');
