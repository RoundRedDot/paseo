import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const [db,out,stage,snapshotFile,countText]=process.argv.slice(2),count=Number(countText);
const info=JSON.parse(fs.readFileSync(out+'/canonical-info.json','utf8'));
const cases=JSON.parse(fs.readFileSync(out+'/cases.json','utf8')).slice(0,count);
const server=JSON.parse(fs.readFileSync(out+'/'+snapshotFile,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const deadline=Date.now()+30000;let lastError,summary;
while(Date.now()<deadline){
 try{
  const rows=JSON.parse(execFileSync('/usr/bin/sqlite3',['-readonly','-json',db,'SELECT server_id,kind,id,payload,length(CAST(payload AS BLOB)) AS sqlBytes,hex(CAST(payload AS BLOB)) AS sqlHex FROM rows ORDER BY kind,id;'],{encoding:'utf8',maxBuffer:16*1024*1024}));
  const matches=rows.filter(r=>r.server_id===info.serverId&&r.kind==='timeline'&&r.id===info.agentId);
  assert.equal(matches.length,1,'Target actual native timeline row');
  const row=matches[0],payload=JSON.parse(row.payload),users=payload.items.filter(i=>i.kind==='user_message');
  summary={at:new Date().toISOString(),stage,serverId:info.serverId,agentId:info.agentId,epochExpected:server.epoch,range:payload.range,timeline:{bytes:Buffer.byteLength(row.payload),sqlBlobBytes:row.sqlBytes,sqlHexBytes:row.sqlHex.length/2,sqlHexEqualsUtf8:Buffer.from(row.sqlHex,'hex').equals(Buffer.from(row.payload)),sha256:sha(row.payload)},users:users.map(i=>({id:i.id,messageId:i.messageId,clientMessageId:i.clientMessageId,text:i.text,images:(i.inlineImages??[]).map(image=>({mimeType:image.mimeType,base64Chars:image.data.length,bytes:Buffer.from(image.data,'base64').length,sha256:sha(Buffer.from(image.data,'base64'))}))}))};
  assert.equal(payload.range?.epoch,server.epoch,'Native cache must reflect actual current canonical epoch');
  assert.equal(users.length,count,'No missing/duplicate canonical image rows');
  cases.forEach((c,index)=>{const u=users[index];assert.equal(u.id,c.id);assert.equal(u.messageId,c.id);assert.equal(u.clientMessageId,c.id);assert.equal(u.text,c.text);assert.equal(u.inlineImages?.length,1);assert.equal(u.inlineImages[0].data,c.image.data);assert.equal(u.inlineImages[0].mimeType,c.image.mimeType)});
  assert.equal(summary.timeline.sqlBlobBytes,summary.timeline.bytes);assert(summary.timeline.sqlHexEqualsUtf8);
  fs.writeFileSync(out+'/cache-'+stage+'.json',JSON.stringify({...summary,passed:true},null,2));
  fs.writeFileSync(out+'/actual-timeline-'+stage+'.json',row.payload);
  for(const [index,u]of users.entries())fs.writeFileSync(out+'/actual-'+stage+'-'+index+'.png',Buffer.from(u.inlineImages[0].data,'base64'));
  console.log(JSON.stringify({stage,passed:true,range:payload.range,users:summary.users,timeline:summary.timeline},null,2));
  process.exit(0);
 }catch(error){lastError=String(error);await new Promise(resolve=>setTimeout(resolve,250))}
}
fs.writeFileSync(out+'/cache-'+stage+'.json',JSON.stringify({at:new Date().toISOString(),stage,passed:false,lastError,lastActual:summary},null,2));
throw Error(lastError??'Actual native cache readback timed out');
