import fs from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {createNativeImageFixture} from './provider-fixture.mjs';
const base='/tmp/paseo-pr-final-gaps-20261017/6736-native';
const out=process.env.QA_6736_RUN;
if(!out?.startsWith(base+'/runs/'))throw Error('Unsafe QA artifact root');
const phase=process.env.QA_6736_PHASE??'1';
const repo='/Users/luopeihuan/workspace/rrd/paseo/.worktrees/pr-6736-parallel-20261016';
const req=createRequire(repo+'/packages/server/package.json');
const load=p=>import(pathToFileURL(repo+'/'+p));
const {createTestPaseoDaemon}=await load('packages/server/src/server/test-utils/paseo-daemon.ts');
const {PiRpcAgentClient}=await load('packages/server/src/server/agent/providers/pi/agent.ts');
const {FakePi}=await load('packages/server/src/server/agent/providers/pi/test-utils/fake-pi.ts');
const {imageHistory}=await load('packages/server/src/server/agent/providers/pi/fixtures/image-history.ts');
const {DaemonClient}=await load('packages/client/dist/daemon-client.js');
const {WebSocket,WebSocketServer}=req('ws');
const logger=req('pino')({level:'silent'});
const endpoint=JSON.parse(fs.readFileSync(base+'/endpoint.json','utf8'));
const port=endpoint.port;assert(![6767,6768].includes(port));
const sha=b=>createHash('sha256').update(b).digest('hex');
const log=(event,data={})=>fs.appendFileSync(out+'/ws-ledger.jsonl',JSON.stringify({at:new Date().toISOString(),phase,event,...data})+'\n');
const keys=new Set(['type','requestId','subscriptionId','status','serverId','workspaceId','agentId','clientId','clientType','appVersion','id','kind','errorCode','generation','seq','headSeq','hasMore','nextCursor','mode','protocolVersion','messageId','clientMessageId','epoch','turnId']);
function select(value,depth=0){
 if(depth>12||value===null||typeof value!=='object')return undefined;
 if(Array.isArray(value))return value.map(v=>select(v,depth+1)).filter(v=>v!==undefined);
 const result={};
 for(const[k,v]of Object.entries(value)){
  if((k==='images'||k==='inlineImages')&&Array.isArray(v))result[k]=v.map(i=>({mimeType:i.mimeType,bytes:typeof i.data==='string'?Buffer.from(i.data,'base64').length:null,sha256:typeof i.data==='string'?sha(Buffer.from(i.data,'base64')):null}));
  else if(keys.has(k)&&(typeof v==='string'||typeof v==='number'||typeof v==='boolean'||v===null))result[k]=v;
  else if(typeof v==='object'&&v!==null){const nested=select(v,depth+1);if(nested&&(Array.isArray(nested)?nested.length:Object.keys(nested).length))result[k]=nested}
 }
 return Object.keys(result).length?result:undefined;
}
function frame(connection,direction,data,binary){const bytes=Buffer.from(data);let fields;try{fields=select(JSON.parse(bytes.toString('utf8')))}catch{}log('frame',{connection,direction,binary,bytes:bytes.length,sha256:sha(bytes),fields})}
fs.mkdirSync(out+'/repo',{recursive:true});fs.mkdirSync(out+'/static',{recursive:true});execFileSync('git',['init','-q'],{cwd:out+'/repo'});
const users=imageHistory.entries.filter(e=>e.message.role==='user');
const cases=users.map((e,i)=>({id:['qa6736-native-image-only','qa6736-native-text-image'][i],name:['image-only','text-image'][i],text:i?'QA6736-TEXT-IMAGE':'',image:e.message.content.find(p=>p.type==='image')}));
fs.writeFileSync(out+'/cases.json',JSON.stringify(cases,null,2));
for(const c of cases)fs.writeFileSync(out+'/'+c.name+'.png',Buffer.from(c.image.data,'base64'));
const result={candidate:'bd3bbb45f612df5fcdd02f5355d545d13341ade0',phase,provider:'PiRpcAgentClient with existing FakePi transport fixture',model:'qa-fixture/native-images',realModelRequests:0,pid:process.pid,startedAt:new Date().toISOString(),checks:[]};
let daemon,sender,receiver,proxy,wss;const sockets=new Set();
const write=(name,value)=>fs.writeFileSync(out+'/'+name,JSON.stringify(value,null,2));
const valid=(payload,count)=>{const rows=payload.entries.filter(e=>e.item?.type==='user_message');return rows.length===count&&cases.slice(0,count).every((c,i)=>rows[i].item.messageId===c.id&&rows[i].item.clientMessageId===c.id&&rows[i].item.text===c.text&&rows[i].item.images?.length===1&&rows[i].item.images[0].data===c.image.data&&rows[i].item.images[0].mimeType===c.image.mimeType)};
try{
 const runtime=createNativeImageFixture({FakePi,out,log});
 daemon=await createTestPaseoDaemon({listenPort:0,paseoHomeRoot:out+'/home',staticDir:out+'/static',cleanup:false,mcpEnabled:false,isDev:true,agentClients:{pi:new PiRpcAgentClient({logger,runtime})},providerOverrides:{pi:{enabled:true}},logger});
 assert(![6767,6768].includes(daemon.port));
 const upstream=`ws://127.0.0.1:${daemon.port}`;
 proxy=http.createServer((incoming,res)=>{
  const target=http.request({host:'127.0.0.1',port:daemon.port,path:incoming.url,method:incoming.method,headers:incoming.headers},response=>{res.writeHead(response.statusCode,response.headers);response.pipe(res)});
  target.on('error',()=>{res.writeHead(502);res.end()});incoming.pipe(target);
 });
 wss=new WebSocketServer({noServer:true});
 proxy.on('upgrade',(r,s,h)=>{
  log('upgrade',{path:new URL(r.url,'http://local').pathname,address:s.remoteAddress,host:r.headers.host,subprotocolCount:r.headers['sec-websocket-protocol']?.split(',').length??0});
  wss.handleUpgrade(r,s,h,down=>{
   const connection=randomUUID();const protocols=r.headers['sec-websocket-protocol']?.split(',').map(s=>s.trim());
   const headers={...r.headers};for(const k of ['upgrade','connection','sec-websocket-key','sec-websocket-version','sec-websocket-extensions','sec-websocket-protocol'])delete headers[k];
   const up=new WebSocket(upstream+r.url,protocols,{headers});sockets.add(up);sockets.add(down);
   log('native-open',{connection,targetURL:upstream+new URL(r.url,'http://local').pathname});
   up.on('upgrade',res=>log('backend-upgrade',{connection,status:res.statusCode,remoteAddress:res.socket.remoteAddress,remotePort:res.socket.remotePort}));
   up.on('unexpected-response',(_req,res)=>{log('backend-upgrade-rejected',{connection,status:res.statusCode});res.resume();up.terminate()});
   const pending=[];
   down.on('message',(d,b)=>{frame(connection,'native->host',d,b);if(up.readyState===WebSocket.OPEN)up.send(d,{binary:b});else pending.push([d,b])});
   up.on('open',()=>{for(const[d,b]of pending)up.send(d,{binary:b})});
   up.on('message',(d,b)=>{frame(connection,'host->native',d,b);if(down.readyState===WebSocket.OPEN)down.send(d,{binary:b})});
   for(const[a,b]of[[down,up],[up,down]]){
    a.on('error',e=>{log('socket-error',{connection,code:e.code??e.name});b.terminate()});
    a.on('close',code=>{log('socket-close',{connection,side:a===down?'native':'host',code});sockets.delete(a);if(b.readyState===WebSocket.OPEN)b.close();else if(b.readyState===WebSocket.CONNECTING)b.terminate()});
   }
  });
 });
 await new Promise((resolve,reject)=>{proxy.once('error',reject);proxy.listen({port,host:'::',ipv6Only:false},resolve)});
 log('proxy-listening',{port,address:proxy.address(),upstreamPort:daemon.port});
 const connect=async id=>{const c=new DaemonClient({url:upstream+'/ws',clientId:id,clientType:'cli',appVersion:'0.12.0-beta.1',webSocketFactory:(url,opt)=>{const ws=new WebSocket(url,{headers:opt?.headers});ws.on('message',(d,b)=>frame(id,'host->control',d,b));const send=ws.send.bind(ws);ws.send=(d,...args)=>{frame(id,'control->host',d,false);return send(d,...args)};return ws}});await c.connect();await c.fetchAgents({subscribe:{}});return c};
 sender=await connect('qa6736-native-sender-'+phase);receiver=await connect('qa6736-native-receiver-'+phase);
 let info;
 if(phase==='1'){
  const added=await sender.addProject(out+'/repo');
  const workspace=await sender.createWorkspace({source:{kind:'directory',path:out+'/repo',projectId:added.project.projectId}});
  const agent=await sender.createAgent({provider:'pi',cwd:out+'/repo',workspaceId:workspace.workspace.id,title:'QA6736 synthetic native images',model:'qa-fixture/native-images',providerOptions:{sessionDir:out+'/provider-fixture'}});
  info={serverId:sender.getLastServerInfoMessage().serverId,workspaceId:workspace.workspace.id,agentId:agent.id};write('canonical-info.json',info);
 }else{
  info=JSON.parse(fs.readFileSync(out+'/canonical-info.json','utf8'));
  assert.equal(sender.getLastServerInfoMessage().serverId,info.serverId,'server ID must come from same actual disk home');
 }
 info={...info,port,upstreamPort:daemon.port,pid:process.pid,phase};write('info-'+phase+'.json',info);write('ready-'+phase,info);
 const snapshot=async(name,count)=>{const a=await sender.fetchAgentTimeline(info.agentId),b=await receiver.fetchAgentTimeline(info.agentId);write(name+'-sender.json',a);write(name+'-receiver.json',b);assert(valid(a,count)&&valid(b,count),'Actual canonical bytes/identity/order mismatch: '+name);const check={name,passed:true,at:new Date().toISOString(),epoch:a.epoch,userRows:count};result.checks.push(check);write(name+'.done',check)};
 if(phase!=='1')await snapshot('host-disk-restart',2);
 const deadline=Date.now()+600000;
 const handled=new Set();
 while(!fs.existsSync(out+'/stop')){
  if(Date.now()>deadline)throw Error('Host runtime deadline');
  for(const[index,c]of cases.entries())if(phase==='1'&&fs.existsSync(out+'/send-'+(index+1))&&!handled.has('send-'+index)){
   handled.add('send-'+index);await sender.sendAgentMessage(info.agentId,c.text,{messageId:c.id,images:[{data:c.image.data,mimeType:c.image.mimeType}]});await sender.waitForFinish(info.agentId,30000);await snapshot('live-'+c.name,index+1);write('send-'+(index+1)+'.done',{at:new Date().toISOString()});
  }
  for(const name of ['after-app-reload','after-host-restart'])if(fs.existsSync(out+'/snapshot-'+name)&&!handled.has(name)){handled.add(name);await snapshot(name,2)}
  await new Promise(resolve=>setTimeout(resolve,100));
 }
}catch(error){result.error=String(error);process.exitCode=1;console.error(error)}finally{
 result.normalStopAt=new Date().toISOString();
 if(sender)await sender.close().catch(()=>{});if(receiver)await receiver.close().catch(()=>{});
 for(const s of sockets)s.terminate();wss?.close();if(proxy)await new Promise(resolve=>proxy.close(resolve));
 if(daemon)await daemon.close();
 result.finishedAt=new Date().toISOString();write('host-result-'+phase+'.json',result);
}
process.exit(process.exitCode??0);
