import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import http from 'node:http';
const out=process.env.QA_7186_OUT;
if(!out?.startsWith('/tmp/paseo-pr-native-followup-20261017/'))throw Error('unsafe artifact directory');
const repo='/Users/luopeihuan/workspace/rrd/paseo/.worktrees/native-render-stream-cost';
const req=createRequire(repo+'/packages/server/package.json');
const load=p=>import(pathToFileURL(repo+'/'+p));
const {createTestPaseoDaemon}=await load('packages/server/src/server/test-utils/paseo-daemon.ts');
const {MockLoadTestAgentClient}=await load('packages/server/src/server/agent/providers/mock-load-test-agent.ts');
const {DaemonClient}=await load('packages/client/dist/daemon-client.js');
const {WebSocket,WebSocketServer}=req('ws');
const logger=req('pino')({level:'silent'});
const port=54883;
const sha=s=>createHash('sha256').update(s).digest('hex');
const log=(event,data={})=>fs.appendFileSync(out+'/ws-ledger.jsonl',JSON.stringify({at:new Date().toISOString(),event,...data})+'\n');
// Strict field allowlist. Never serialize credentials, request headers, text, cwd, or arbitrary errors.
const keys=new Set(['type','requestId','subscriptionId','status','serverId','workspaceId','agentId','clientId','clientType','appVersion','id','kind','errorCode','generation','seq','headSeq','hasMore','nextCursor','mode','protocolVersion']);
function select(value,depth=0){
 if(depth>9||value===null||typeof value!=='object')return undefined;
 if(Array.isArray(value))return value.map(v=>select(v,depth+1)).filter(v=>v!==undefined);
 const o={};
 for(const [k,v]of Object.entries(value)){
  if(keys.has(k)&&(typeof v==='string'||typeof v==='number'||typeof v==='boolean'||v===null))o[k]=v;
  else if(typeof v==='object'&&v!==null){const nested=select(v,depth+1);if(nested&&(Array.isArray(nested)?nested.length:Object.keys(nested).length))o[k]=nested;}
 }
 return Object.keys(o).length?o:undefined;
}
function frame(connection,direction,data,binary){
 const b=Buffer.from(data);let fields;
 try{fields=select(JSON.parse(b.toString('utf8')))}catch{}
 log('frame',{connection,direction,binary,bytes:b.length,sha256:sha(b),fields});
 // Read-only stream observation; frame Buffer and forwarding are unchanged.
 if(direction==='host->native'){
  let envelope;try{envelope=JSON.parse(b.toString('utf8'))}catch{}
  if(envelope?.message?.type==='agent_stream'){
   const texts=[];
   const visit=(v,path='payload')=>{if(!v||typeof v!=='object')return;for(const[k,x]of Object.entries(v)){
    if((k==='text'||k==='delta')&&typeof x==='string')texts.push({path:path+'.'+k,text:x});
    else if(x&&typeof x==='object')visit(x,path+'.'+k);
   }};visit(envelope.message.payload);
   fs.appendFileSync(out+'/native-stream-text-private.jsonl',JSON.stringify({at:new Date().toISOString(),connection,frameSha256:sha(b),texts})+'\n');
  }
 }

}
fs.mkdirSync(out+'/repo',{recursive:true});fs.mkdirSync(out+'/static',{recursive:true});execFileSync('git',['init','-q'],{cwd:out+'/repo'});
let daemon,client,projectId,proxy,wss;const sockets=new Set();
const response=('缓存😀'.repeat(2500)+'\n\n').repeat(2)+'QA7186-END';
const result={candidate:'85f7d56ea79f8b7c22538a2b763875f4ce2d74ad',provider:'MockLoadTestAgentClient',model:'e2e-fast-stream',expected:{chars:response.length,bytes:Buffer.byteLength(response),sha256:sha(response)},startedAt:new Date().toISOString()};
try{
 daemon=await createTestPaseoDaemon({listenPort:0,paseoHomeRoot:out+'/home',staticDir:out+'/static',cleanup:false,isDev:true,mcpEnabled:false,agentClients:{mock:new MockLoadTestAgentClient(logger)},providerOverrides:{mock:{enabled:true}},logger});
 if([6767,6768].includes(daemon.port))throw Error('Forbidden upstream port');
 const upstream=`ws://127.0.0.1:${daemon.port}`;
 proxy=http.createServer((incoming,res)=>{
  log('http',{method:incoming.method,path:new URL(incoming.url,'http://local').pathname});
  const target=http.request({host:'127.0.0.1',port:daemon.port,path:incoming.url,method:incoming.method,headers:incoming.headers},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res)});
  target.on('error',()=>{res.writeHead(502);res.end()});incoming.pipe(target);
 });
 wss=new WebSocketServer({noServer:true});
 proxy.on('upgrade',(r,s,h)=>{
  log('upgrade',{path:new URL(r.url,'http://local').pathname,address:s.remoteAddress,host:r.headers.host,origin:r.headers.origin?.match(/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]):54883$/)?.[0]??'absent-or-redacted'});
  wss.handleUpgrade(r,s,h,down=>{
   const connection=randomUUID();log('native-open',{connection,targetURL:upstream+new URL(r.url,'http://local').pathname,host:r.headers.host,origin:r.headers.origin?.match(/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]):54883$/)?.[0]??'absent-or-redacted',subprotocolCount:r.headers['sec-websocket-protocol']?.split(',').length??0});
   const protocols=r.headers['sec-websocket-protocol']?.split(',').map(s=>s.trim());
   const headers={...r.headers};for(const k of ['upgrade','connection','sec-websocket-key','sec-websocket-version','sec-websocket-extensions','sec-websocket-protocol'])delete headers[k];
   const up=new WebSocket(upstream+r.url,protocols,{headers});sockets.add(up);sockets.add(down);
   up.on('upgrade',res=>log('backend-upgrade',{connection,status:res.statusCode,remoteAddress:res.socket.remoteAddress,remotePort:res.socket.remotePort,host:headers.host??new URL(upstream).host,protocolNegotiated:!!res.headers['sec-websocket-protocol']}));
   up.on('unexpected-response',(_req,res)=>{log('backend-upgrade-rejected',{connection,status:res.statusCode});res.resume();up.terminate();});
   const pending=[];
   down.on('message',(d,b)=>{frame(connection,'native->host',d,b);if(up.readyState===WebSocket.OPEN)up.send(d,{binary:b});else pending.push([d,b]);});
   up.on('open',()=>{log('upstream-open',{connection});for(const[d,b]of pending)up.send(d,{binary:b});});
   up.on('message',(d,b)=>{frame(connection,'host->native',d,b);if(down.readyState===WebSocket.OPEN)down.send(d,{binary:b});});
   for(const [a,b]of [[down,up],[up,down]]){
    a.on('error',e=>{log('socket-error',{connection,code:e.code??'unknown',classification:/Unexpected server response: \d+/.exec(e.message)?.[0]??e.name});b.terminate()});
    a.on('close',code=>{log('socket-close',{connection,side:a===down?'native':'host',code});sockets.delete(a);if(b.readyState===WebSocket.OPEN)b.close();else if(b.readyState===WebSocket.CONNECTING)b.terminate()});
   }
  });
 });
 // Dual stack includes ::1 because the native localhost normalizer can resolve IPv6 first.
 await new Promise((resolve,reject)=>{proxy.once('error',reject);proxy.listen({port,host:'::',ipv6Only:false},resolve)});
 log('proxy-listening',{port,address:proxy.address(),upstream:daemon.daemon.getListenTarget(),upstreamPort:daemon.port});
 client=new DaemonClient({url:upstream+'/ws',clientId:'qa-7186-control',clientType:'cli',appVersion:'0.12.0-beta.1',webSocketFactory:(url,opt)=>{const ws=new WebSocket(url,{headers:opt?.headers});ws.on('message',(d,b)=>frame('control-cli','host->control',d,b));const send=ws.send.bind(ws);ws.send=(d,...args)=>{frame('control-cli','control->host',d,false);return send(d,...args)};return ws}});
 await client.connect();await client.fetchAgents({subscribe:{}});const serverId=client.getLastServerInfoMessage().serverId;
 const added=await client.addProject(out+'/repo');projectId=added.project.projectId;
 const ws=await client.createWorkspace({source:{kind:'directory',path:out+'/repo',projectId}});
 const agent=await client.createAgent({provider:'mock',cwd:out+'/repo',workspaceId:ws.workspace.id,title:'QA7186 native Release smoke',modeId:'load-test',model:'e2e-fast-stream',featureValues:{mockStreamingAssistantResponse:response,mockStreamingAssistantIntervalMs:5}});
 const info={port,upstreamPort:daemon.port,serverId,workspaceId:ws.workspace.id,agentId:agent.id};Object.assign(result,info);
 fs.writeFileSync(out+'/info.json',JSON.stringify(info));console.log('READY',JSON.stringify(info));
 let sent=false;const deadline=Date.now()+600000;
 while(!fs.existsSync(out+'/stop')){
  if(Date.now()>deadline)throw Error('QA host deadline');
  if(!sent&&fs.existsSync(out+'/stream')){
   sent=true;result.streamStartedAt=new Date().toISOString();
   await client.sendAgentMessage(agent.id,'Synthetic multi-byte replica persistence smoke.');
   result.finish=await client.waitForFinish(agent.id,120000);
   const timeline=await client.fetchAgentTimeline(agent.id);
   fs.writeFileSync(out+'/control-timeline.json',JSON.stringify(timeline));
   result.streamFinishedAt=new Date().toISOString();
   if(result.finish.status!=='idle')throw Error('Stream not finished: '+result.finish.status);
   fs.writeFileSync(out+'/stream-done',JSON.stringify({at:Date.now()}));
  }
  await new Promise(r=>setTimeout(r,100));
 }
}catch(e){result.error=String(e);process.exitCode=1;console.error(e)}finally{
 // Normal host shutdown preserves the synthetic project; no directory deletion RPC.
 result.normalHostStopAt=new Date().toISOString();
 if(client)await client.close().catch(()=>{});
 for(const s of sockets)s.terminate();wss?.close();
 if(proxy)await new Promise(r=>proxy.close(r));
 if(daemon)await daemon.close().catch(()=>{});
 result.cleanupAt=new Date().toISOString();fs.writeFileSync(out+'/host-result.json',JSON.stringify(result,null,2));
}
process.exit(process.exitCode??0);
