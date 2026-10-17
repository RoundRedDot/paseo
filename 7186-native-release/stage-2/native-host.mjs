import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const out=process.env.QA_7186_OUT??'/tmp/paseo-pr-gap-20261017/7186-release/runtime';
const repo='/Users/luopeihuan/workspace/rrd/paseo/.worktrees/native-render-stream-cost';
const req=createRequire(repo+'/packages/server/package.json');
const load=p=>import(pathToFileURL(repo+'/'+p));
const {createTestPaseoDaemon}=await load('packages/server/src/server/test-utils/paseo-daemon.ts');
const {MockLoadTestAgentClient}=await load('packages/server/src/server/agent/providers/mock-load-test-agent.ts');
const {DaemonClient}=await load('packages/client/dist/daemon-client.js');
const {WebSocket}=req('ws');const logger=req('pino')({level:'silent'});
const port=Number(await fs.readFile('/tmp/paseo-pr-gap-20261017/7186-release/port','utf8'));
if(!Number.isInteger(port)||port<1024||[6767,6768].includes(port))throw Error('forbidden port');
await fs.mkdir(out+'/repo',{recursive:true});await fs.mkdir(out+'/static',{recursive:true});execFileSync('git',['init','-q'],{cwd:out+'/repo'});
let daemon,client,projectId;
const response=('缓存😀'.repeat(2500)+'\n\n').repeat(2)+'QA7186-END';
const sha=s=>createHash('sha256').update(s).digest('hex');
const result={candidate:'85f7d56ea79f8b7c22538a2b763875f4ce2d74ad',provider:'MockLoadTestAgentClient',model:'e2e-fast-stream',responseChars:response.length,responseBytes:Buffer.byteLength(response),responseSha256:sha(response),startedAt:new Date().toISOString()};
try{
 daemon=await createTestPaseoDaemon({listenPort:port,paseoHomeRoot:out+'/home',staticDir:out+'/static',cleanup:false,isDev:true,mcpEnabled:false,agentClients:{mock:new MockLoadTestAgentClient(logger)},providerOverrides:{mock:{enabled:true}},logger});
 client=new DaemonClient({url:`ws://127.0.0.1:${port}/ws`,clientId:'qa-7186-control',clientType:'cli',appVersion:'0.12.0-beta.1',webSocketFactory:(url,opt)=>new WebSocket(url,{headers:opt?.headers})});
 await client.connect();await client.fetchAgents({subscribe:{}});const serverId=client.getLastServerInfoMessage().serverId;
 const added=await client.addProject(out+'/repo');projectId=added.project.projectId;
 const ws=await client.createWorkspace({source:{kind:'directory',path:out+'/repo',projectId}});
 const agent=await client.createAgent({provider:'mock',cwd:out+'/repo',workspaceId:ws.workspace.id,title:'QA7186 native Release smoke',modeId:'load-test',model:'e2e-fast-stream',featureValues:{mockStreamingAssistantResponse:response,mockStreamingAssistantIntervalMs:5}});
 const info={port,serverId,workspaceId:ws.workspace.id,agentId:agent.id};Object.assign(result,info);
 await fs.writeFile(out+'/info.json',JSON.stringify(info));console.log('READY',JSON.stringify(info));
 let sent=false;const deadline=Date.now()+600000;
 while(!existsSync(out+'/stop')){
  if(Date.now()>deadline)throw Error('QA host deadline');
  if(!sent&&existsSync(out+'/stream')){
   sent=true;result.streamStartedAt=new Date().toISOString();
   await client.sendAgentMessage(agent.id,'Synthetic multi-byte replica persistence smoke.');
   result.finish=await client.waitForFinish(agent.id,120000);
   result.timeline=await client.fetchAgentTimeline(agent.id);
   result.streamFinishedAt=new Date().toISOString();
   if(result.finish.status!=='idle')throw Error('Stream not finished: '+result.finish.status);
   await fs.writeFile(out+'/stream-done',JSON.stringify({at:Date.now()}));
  }
  await new Promise(r=>setTimeout(r,100));
 }
}catch(e){result.error=String(e);process.exitCode=1;console.error(e)}finally{
 if(client&&projectId)await client.removeProject(projectId).catch(()=>{});
 if(client)await client.close().catch(()=>{});if(daemon)await daemon.close().catch(()=>{});
 result.cleanupAt=new Date().toISOString();await fs.writeFile(out+'/host-result.json',JSON.stringify(result,null,2));
}
process.exit(process.exitCode??0);
