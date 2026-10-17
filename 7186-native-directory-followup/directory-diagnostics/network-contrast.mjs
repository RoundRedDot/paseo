import fs from 'node:fs';import {createRequire}from'node:module';import {pathToFileURL}from'node:url';
const root='/tmp/paseo-pr-native-followup-20261017',repo='/Users/luopeihuan/workspace/rrd/paseo/.worktrees/native-render-stream-cost';
const req=createRequire(repo+'/packages/server/package.json');const {WebSocket}=req('ws');
const {createTestPaseoDaemon}=await import(pathToFileURL(repo+'/packages/server/src/server/test-utils/paseo-daemon.ts'));
const result={startedAt:new Date().toISOString(),classification:'Node direct upgrade control, not native runtime'};
const daemon=await createTestPaseoDaemon({listenPort:0,listen:'127.0.0.1',paseoHomeRoot:root+'/network-control/home',staticDir:root+'/network-control/static',cleanup:false,isDev:true,mcpEnabled:false,logger:req('pino')({level:'silent'})});
if([6767,6768].includes(daemon.port))throw Error('forbidden port');
async function probe(label,url,headers){return new Promise(resolve=>{
 const row={label,url,headers};let settled=false;const done=()=>{if(settled)return;settled=true;clearTimeout(timer);ws.terminate();resolve(row)};
 const ws=new WebSocket(url,{headers,handshakeTimeout:2500});
 const timer=setTimeout(()=>{row.timeout=true;done()},3500);
 ws.on('upgrade',r=>{row.httpStatus=r.statusCode;row.remoteAddress=r.socket.remoteAddress;row.remotePort=r.socket.remotePort;});
 ws.on('open',()=>{row.open=true;done()});
 ws.on('error',e=>{row.code=e.code??null;row.message=/Unexpected server response: \d+/.exec(e.message)?.[0]??e.name;done()});
});}
try{
 result.listener=daemon.daemon.getListenTarget();
 result.probes=[];
 for(const host of ['127.0.0.1','[::1]','localhost'])result.probes.push(await probe('direct-ipv4-daemon',`ws://${host}:${daemon.port}/ws`));
 result.probes.push(await probe('proxy-original-host-replaced',`ws://127.0.0.1:${daemon.port}/ws`,{Origin:'http://localhost:54883'}));
 result.probes.push(await probe('proxy-original-host-preserved',`ws://127.0.0.1:${daemon.port}/ws`,{Origin:'http://localhost:54883',Host:'localhost:54883'}));
}finally{await daemon.close();result.finishedAt=new Date().toISOString();fs.mkdirSync(root+'/network-control',{recursive:true});fs.writeFileSync(root+'/network-control/result.json',JSON.stringify(result,null,2));}
process.exit(0);
