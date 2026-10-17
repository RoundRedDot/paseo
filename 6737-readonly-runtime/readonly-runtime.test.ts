import { test, expect } from 'vitest';
import { createServer, type IncomingMessage } from 'node:http';
import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { WebSocket, WebSocketServer } from 'ws';
import pino from 'pino';
import { createPaseoDaemon } from '/Users/luopeihuan/workspace/rrd/paseo/.worktrees/pr-6737-parallel-20261016/packages/server/src/server/bootstrap';
import { BuiltinPluginLoader } from '/Users/luopeihuan/workspace/rrd/paseo/.worktrees/pr-6737-parallel-20261016/packages/server/src/server/plugins/builtin';
import { DaemonClient, type WebSocketLike } from '/Users/luopeihuan/workspace/rrd/paseo/.worktrees/pr-6737-parallel-20261016/packages/client/src/daemon-client';
import { BUILTIN_PROVIDER_IDS } from '@getpaseo/protocol/provider-manifest';
import { sharedOrdering } from '@/ordering/index';
import { observeOrderErrors, type OrderError } from '@/ordering/intents';
import { useSidebarOrderStore } from '@/stores/sidebar-order-store';
import { useWorkspaceLayoutStore } from '@/stores/workspace-layout-store';
import { useSessionStore, normalizeWorkspaceDescriptor } from '@/stores/session-store';

const base = '/tmp/paseo-pr-gap-20261017/6737-readonly-runtime';
let phase = 'setup';
const transcript = join(base, 'raw-ordering.jsonl');
function record(event: string, payload: unknown) {
  appendFileSync(transcript, JSON.stringify({time:new Date().toISOString(),phase,event,payload})+'\n');
}
function wire(direction: string, data: Buffer, binary: boolean) {
  if(binary) return;
  const envelope=JSON.parse(data.toString());
  const message=envelope.type==='session' ? envelope.message : envelope;
  if(message.type?.startsWith('ui.order.') || message.type==='rpc_error') record(direction,message);
  if(message.type==='status' && message.payload?.status==='server_info') record(direction,{type:'server_info',permissions:message.payload.permissions,serverId:message.payload.serverId});
  if(message.type==='status' && message.status==='server_info') record(direction,{type:'server_info',permissions:message.permissions,serverId:message.serverId});
}
async function body(request: IncomingMessage) {
  const chunks=[]; for await(const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString());
}
async function startHub() {
  let verifier='';
  let daemonId='';
  let permissions:string[]=[];
  let backend:WebSocket|null=null;
  let frontend:WebSocket|null=null;
  let connections=0;
  let port=0;
  const queued:Array<{data:Buffer,binary:boolean}>=[];
  function authenticated(request:IncomingMessage) {
    const secret=request.headers.authorization?.replace(/^Bearer /,'') ?? '';
    return createHash('sha256').update(secret).digest('base64url')===verifier;
  }
  const server=createServer(async(req,res)=>{
    try {
      if(req.method==='POST' && req.url==='/api/daemons/enroll') {
        expect(req.headers.authorization).toBe('Bearer ephemeral-local-enrollment');
        const input=await body(req); verifier=input.credentialVerifier; daemonId=input.daemonId; permissions=input.permissions;
        record('hub.enroll',{daemonId,permissions,credential:'REDACTED'});
        res.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify({daemonId,permissions,webSocketUrl:`ws://127.0.0.1:${port}/daemon`})); return;
      }
      if(req.method==='PATCH' && req.url===`/api/daemons/${daemonId}` && authenticated(req)) {
        permissions=(await body(req)).permissions;
        record('hub.permission.echo',{permissions,credentialVerified:true});
        res.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify({permissions}));return;
      }
      if(req.method==='DELETE' && authenticated(req)) {res.writeHead(204).end();return;}
      res.writeHead(403).end();
    } catch(error) {res.writeHead(500).end();record('hub.error',String(error));}
  });
  const wss=new WebSocketServer({noServer:true});
  wss.on('headers',headers=>headers.push('x-paseo-session-protocol: 1'));
  server.on('upgrade',(request,socket,head)=>{
    if(request.url==='/daemon' && !authenticated(request)) {socket.destroy();return;}
    if(!['/daemon','/app'].includes(request.url!)) {socket.destroy();return;}
    if(request.url==='/app' && (!backend || backend.readyState!==WebSocket.OPEN)) {socket.destroy();return;}
    wss.handleUpgrade(request,socket,head,ws=>{
      if(request.url==='/daemon') {
        backend=ws; connections++;queued.length=0;record('hub.backend.connected',{connections,credentialVerified:true,permissions});
        ws.on('message',(data,binary)=>{
          wire('daemon.to.app',data as Buffer,binary);
          if(frontend?.readyState===WebSocket.OPEN) frontend.send(data,{binary});
          else queued.push({data:data as Buffer,binary});
        });
        ws.on('close',()=>{if(backend===ws){backend=null;frontend?.close();frontend=null;}});
      } else {
        frontend=ws;
        for(const item of queued.splice(0)) ws.send(item.data,{binary:item.binary});
        const target=backend!;
        ws.on('message',(data,binary)=>{wire('app.to.daemon',data as Buffer,binary);if(target.readyState===WebSocket.OPEN) target.send(data,{binary});});
        ws.on('close',()=>{if(frontend===ws) frontend=null;target.close(1000);});
      }
    });
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address(); if(!address || typeof address==='string') throw new Error('No Hub address');port=address.port;
  return {
    origin:`http://127.0.0.1:${port}`,
    appUrl:`ws://127.0.0.1:${port}/app`,
    async waitBackend(){await expect.poll(()=>backend?.readyState,{timeout:10000}).toBe(WebSocket.OPEN);},
    async close(){for(const socket of wss.clients) socket.terminate();await new Promise<void>(resolve=>wss.close(()=>resolve()));await new Promise<void>(resolve=>server.close(()=>resolve()));},
  };
}
function client(url:string,clientId:string) {
  return new DaemonClient({url,clientId,appVersion:'0.12.0-beta.1',connectTimeoutMs:10000,reconnect:{enabled:false},
    webSocketFactory:(url,options)=>new WebSocket(url,options?.protocols,{headers:options?.headers}) as unknown as WebSocketLike});
}
function requests(phaseName:string) {
  return readFile(transcript,'utf8').then(text=>text.trim().split('\n').map(line=>JSON.parse(line)).filter(row=>row.phase===phaseName && row.event==='app.to.daemon').map(row=>row.payload));
}

test('real bootstrap Session and production client/controller cancel offline moves on a locally authorized readonly Hub reconnect',async()=>{
  const started=new Date().toISOString();
  await writeFile(transcript,'');
  const home=join(base,'state','home');
  const staticDir=join(base,'state','static');
  await mkdir(home,{recursive:true});await mkdir(staticDir,{recursive:true});
  const hub=await startHub();
  const daemon=await createPaseoDaemon({listen:'127.0.0.1:0',paseoHome:home,staticDir,corsAllowedOrigins:[],hostnames:true,mcpEnabled:false,mcpDebug:false,
    agentClients:{},agentStoragePath:join(home,'agents'),relayEnabled:false,pluginsEnabled:false,
    providerOverrides:Object.fromEntries(BUILTIN_PROVIDER_IDS.map(id=>[id,{enabled:false}])),
    voiceLlmProvider:null,voiceLlmProviderExplicit:true,
  },pino({level:'silent'}),{builtinPlugins:new BuiltinPluginLoader(undefined,[])});
  const clients:DaemonClient[]=[];
  let host='';
  const errors:OrderError[]=[];
  const stopErrors=observeOrderErrors(error=>{errors.push(error);record('controller.error',error);});
  try {
    await daemon.start();const target=daemon.getListenTarget();if(target?.type!=='tcp')throw new Error('No daemon TCP port');
    expect([6767,6768]).not.toContain(target.port);
    const owner=client(`ws://127.0.0.1:${target.port}/ws`,'qa-local-owner');clients.push(owner);await owner.connect();
    host=daemon.getServerId();record('daemon.started',{port:target.port,serverId:host,providerRequests:0});
    expect(owner.getLastServerInfoMessage()?.permissions).toContain('access.manage');
    const cwd=join(base,'state','project');await mkdir(cwd,{recursive:true});
    const ids:string[]=[];
    let projectId:string|undefined;
    for(const title of ['A','B','C','D']) {
      const result=await owner.createWorkspace({source:{kind:'directory',path:cwd,...(projectId?{projectId}:{})},title});
      expect(result.error).toBeNull();projectId=result.workspace!.projectId;ids.push(result.workspace!.id);
      await owner.setWorkspacePinned(result.workspace!.id,true);
    }
    const [a,b,c,d]=ids;
    const keys=(values:readonly string[])=>values.map(id=>`${host}:${id}`);
    const scope={kind:'pinned'} as const;
    await owner.connectHub(hub.origin,'ephemeral-local-enrollment',['workspace.read','workspace.manage']);
    await hub.waitBackend();
    let mobile=client(hub.appUrl,'qa-order-mobile');clients.push(mobile);await mobile.connect();
    expect(mobile.getLastServerInfoMessage()?.permissions).toEqual(['workspace.read','workspace.manage']);
    expect((await mobile.setOrder({scope,expectedRevision:0,order:ids})).accepted).toBe(true);
    useSessionStore.getState().initializeSession(host,null);
    const hydrate=async()=>{
      const snapshot=await mobile.fetchWorkspaces({});
      useSessionStore.getState().setWorkspaces(host,new Map(snapshot.entries.map(item=>[item.id,normalizeWorkspaceDescriptor(item)])));
      useSessionStore.getState().setHasHydratedWorkspaces(host,true);
    };
    await useWorkspaceLayoutStore.persist.rehydrate();
    await hydrate();
    await sharedOrdering.connect({serverId:host,client:mobile,supported:mobile.getLastServerInfoMessage()?.features?.sharedOrderingTargets===true,directoryReady:true});
    expect(useSidebarOrderStore.getState().pinnedWorkspaceOrder).toEqual(keys(ids));
    await expect.poll(async()=>(await mobile.listOrders()).deviceRevision).toBe(1);
    expect(errors).toEqual([]);
    sharedOrdering.disconnect(host);await mobile.close();
    phase='offline';
    useSidebarOrderStore.getState().setPinnedWorkspaceOrder({keys:keys([d!,a!,b!,c!]),gesture:{userInitiated:true,movedKey:`${host}:${d}`}});
    expect(useSidebarOrderStore.getState().pinnedWorkspaceOrder).toEqual(keys([d!,a!,b!,c!]));
    expect(errors).toEqual([{kind:'failed'}]);errors.length=0;
    record('offline.gesture',{moved:d,order:[d,a,b,c]});
    await owner.updateHubPermissions({revoke:['workspace.manage']});
    await hub.waitBackend();
    phase='readonly';
    mobile=client(hub.appUrl,'qa-order-mobile');clients.push(mobile);await mobile.connect();
    const readonlyPermissions=mobile.getLastServerInfoMessage()?.permissions;
    expect(readonlyPermissions).toEqual(['workspace.read']);record('client.permissions',{readonlyPermissions,source:'real Session server_info after local Hub management revoke'});
    await sharedOrdering.connect({serverId:host,client:mobile,supported:mobile.getLastServerInfoMessage()?.features?.sharedOrderingTargets===true,directoryReady:false});
    expect(useSidebarOrderStore.getState().pinnedWorkspaceOrder).toEqual(keys(ids));
    expect(errors).toEqual([{kind:'permissionLost'}]);record('snapshot.projected',{order:ids,errors:[...errors]});
    sharedOrdering.directoryReady(host);
    await mobile.listOrders();
    await owner.setWorkspacePinned(b!,false);
    await expect.poll(async()=>(await mobile.listOrders()).records.find(item=>item.scope.kind==='pinned')?.order).toEqual([a,c,d]);
    useSidebarOrderStore.getState().setPinnedWorkspaceOrder({keys:keys([d!,c!,b!,a!])});
    expect(useSidebarOrderStore.getState().pinnedWorkspaceOrder).toEqual(keys([a!,c!,b!,d!]));
    record('update.1.projected',{order:[a,c,b,d],probe:'programmatic cache reorder proves controller holds pruned record, not the original snapshot'});
    await owner.setWorkspacePinned(c!,false);
    await expect.poll(async()=>(await mobile.listOrders()).records.find(item=>item.scope.kind==='pinned')?.order).toEqual([a,d]);
    useSidebarOrderStore.getState().setPinnedWorkspaceOrder({keys:keys([d!,a!,c!,b!])});
    expect(useSidebarOrderStore.getState().pinnedWorkspaceOrder).toEqual(keys([a!,d!,c!,b!]));
    record('update.2.projected',{order:[a,d,c,b]});
    const readRequests=await requests('readonly');
    expect(readRequests.filter(item=>['ui.order.targets.set.request','ui.order.set.request','ui.order.devices.forget.request'].includes(item.type))).toEqual([]);
    expect(errors).toEqual([{kind:'permissionLost'}]);
    record('readonly.no.write',{requests:readRequests.map(item=>item.type),illegalWriteCount:0});
    sharedOrdering.disconnect(host);await mobile.close();
    await owner.updateHubPermissions({grant:['workspace.manage']});await hub.waitBackend();
    phase='regain-before-gesture';
    mobile=client(hub.appUrl,'qa-order-mobile');clients.push(mobile);await mobile.connect();
    expect(mobile.getLastServerInfoMessage()?.permissions).toEqual(['workspace.read','workspace.manage']);
    await hydrate();
    await sharedOrdering.connect({serverId:host,client:mobile,supported:true,directoryReady:true});
    await mobile.listOrders();
    expect((await requests('regain-before-gesture')).filter(item=>item.type==='ui.order.set.request')).toEqual([]);
    phase='new-gesture';
    useSidebarOrderStore.getState().setPinnedWorkspaceOrder({keys:keys([d!,a!]),gesture:{userInitiated:true,movedKey:`${host}:${d}`}});
    await expect.poll(async()=>(await mobile.listOrders()).records.find(item=>item.scope.kind==='pinned')?.order).toEqual([d,a]);
    const newWrites=(await requests('new-gesture')).filter(item=>item.type==='ui.order.set.request');
    expect(newWrites).toHaveLength(1);expect(newWrites[0].expectedRevision).toBe(3);expect(newWrites[0].order).toEqual([d,a]);
    expect(errors).toEqual([{kind:'permissionLost'}]);
    record('PASS',{started,ended:new Date().toISOString(),snapshot:true,laterPruneUpdates:2,readonlyIllegalWrites:0,cancelFeedback:'permissionLost',regainOldMovesReplayed:0,newGestureWrites:1});
    await owner.removeProject(projectId!);
    await writeFile(join(base,'result.json'),JSON.stringify({status:'PASS',source:'f0f445e354298adc6385e11dfe6c2b1f85da9ca7',started,finished:new Date().toISOString(),host,daemonPort:target.port,workspaceIds:ids,readonlyPermissions,readonlyIllegalWrites:0,regainOldMovesReplayed:0,newGestureWrites:1,otherHost:'NOT_VERIFIED',laterUpdates:'real owner unpin -> atomic prune -> subscribed ui.order.update',externalHubAuthentication:'NOT_VERIFIED: local HTTP/WebSocket counterpart'},null,2));
  } finally {
    phase='cleanup';stopErrors();if(host)sharedOrdering.disconnect(host);
    await Promise.all(clients.map(item=>item.close()));
    await daemon.stop();await hub.close();
    await rm(join(base,'state'),{recursive:true,force:true});
    record('cleanup',{clientsClosed:true,daemonStopped:true,hubStopped:true,privateStateRemoved:true});
  }
});
