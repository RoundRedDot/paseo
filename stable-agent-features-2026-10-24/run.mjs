import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
const root = process.cwd();
const require = createRequire(root + '/package.json');
const { chromium } = require('playwright');
const { WebSocket } = require('ws');
const { DaemonClient } = await import(root + '/packages/client/dist/daemon-client.js');
const phase = process.argv[2];
const client = new DaemonClient({url:'ws://127.0.0.1:6943/ws',clientId:'stable-features-qa-'+phase,clientType:'cli',appVersion:'0.13.0-beta.2',webSocketFactory:(url,options)=>new WebSocket(url,{headers:options?.headers})});
await client.connect();
if (client.getLastServerInfoMessage()?.serverId !== 'stable-features-qa') throw new Error('Expected the private QA daemon');
for (const project of (await client.listProjects()).projects) await client.removeProject(project.projectId);
const created = await client.createWorkspace({source:{kind:'directory',path:'/tmp/stable-agent-features-qa/project'},title:'Features identity QA'});
if (!created.workspace) throw new Error(JSON.stringify(created));
const workspace = created.workspace;
const agent = await client.createAgent({provider:'mock',cwd:workspace.workspaceDirectory,workspaceId:workspace.id,title:'Features identity QA',model:'ten-second-stream',featureValues:{mockStreamingAssistantResponse:'Stable features keep unchanged agent configuration out of the stream render path.\n\nThis deterministic mock response verifies streaming text, completion, and the unchanged conversation UI.',mockStreamingAssistantIntervalMs:200}});
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});
const errors=[];
page.on('pageerror', e=>errors.push(e.message));
page.on('console', m=>{if(m.type()==='error') errors.push(m.text());});
await page.route(/:6767\b/, r=>r.abort());
await page.routeWebSocket(/:6767\b/, w=>w.close());
await page.addInitScript(({workspace,agent})=>{
  const now = new Date().toISOString();
  localStorage.setItem('@paseo:e2e','1');
  localStorage.setItem('@paseo:daemon-registry', JSON.stringify([{serverId:'stable-features-qa',label:'Features QA',connections:[{id:'direct:127.0.0.1:6943',type:'directTcp',endpoint:'127.0.0.1:6943'}],preferredConnectionId:'direct:127.0.0.1:6943',createdAt:now,updatedAt:now}]));
  globalThis.__PASEO_RENDER_PROFILE_ENABLED__=true;
  globalThis.__qaCollect=false;
  globalThis.__qaFiber={features:new Set(),capabilities:new Set(),capabilityValues:new Set(),rowCallbacks:new Set(),viewObservations:0};
  globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__={
    supportsFiber:true, renderers:new Map(),
    inject(renderer){const id=this.renderers.size+1;this.renderers.set(id,renderer);return id;},
    onCommitFiberRoot(_id,root){
      if(!globalThis.__qaCollect)return;
      const stack=[root.current];const q=globalThis.__qaFiber;
      while(stack.length){const f=stack.pop();if(!f)continue;
        if(f.elementType?.displayName==='AgentStreamView' && f.memoizedProps?.context){
          const context=f.memoizedProps.context;q.features.add(context.features);q.capabilities.add(context.capabilities);q.capabilityValues.add(JSON.stringify(context.capabilities));q.viewObservations++;
        }
        const p=f.memoizedProps;if(p?.layoutItem && p?.item && typeof p.renderStreamItem==='function')q.rowCallbacks.add(p.renderStreamItem);
        if(f.child)stack.push(f.child);if(f.sibling)stack.push(f.sibling);
      }
    },
    onCommitFiberUnmount(){},
  };
  globalThis.__qaWire=[];
  const Original=globalThis.WebSocket;
  globalThis.WebSocket=class extends Original {
    constructor(...args){super(...args);this.addEventListener('message',e=>{try{const envelope=JSON.parse(e.data);const m=envelope.message;if(m?.type==='agent_update' && m.payload.agent?.id===agent.id) globalThis.__qaWire.push({status:m.payload.agent.status,features:m.payload.agent.features,updatedAt:m.payload.agent.updatedAt});}catch{}});}
  };
  document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='#error-toast { display:none !important; }';document.head.append(s);});
},{workspace,agent});
try {
  // Workspace IDs are URL-safe opaque IDs on this daemon.
  await page.goto(`http://localhost:8234/h/stable-features-qa/workspace/${encodeURIComponent(workspace.id)}?open=${encodeURIComponent('agent:'+agent.id)}`,{timeout:180000});
  await page.getByRole('textbox',{name:'Message agent...'}).first().waitFor({timeout:120000});
  await page.waitForTimeout(1500);
  await page.evaluate(()=>{globalThis.__PASEO_RESET_RENDER_PROFILE__?.();globalThis.__qaWire=[];globalThis.__qaCollect=true;});
  await client.sendAgentMessage(agent.id,'Verify stable features while streaming.');
  for (let tick=1; tick<=50; tick++) {
    await client.updateAgent(agent.id,{labels:{'qa.tick':String(tick)}});
    await page.waitForTimeout(80);
  }
  const result=await client.waitForFinish(agent.id,60000);
  await page.waitForTimeout(1500);
  const report=await page.evaluate(()=>({reasons:globalThis.__PASEO_RENDER_PROFILE_REASONS__,wire:globalThis.__qaWire,commits:globalThis.__PASEO_RENDER_PROFILE__,text:document.body.innerText,fiber:{featureReferences:globalThis.__qaFiber.features.size,capabilityReferences:globalThis.__qaFiber.capabilities.size,capabilityValues:[...globalThis.__qaFiber.capabilityValues],rowCallbackReferences:globalThis.__qaFiber.rowCallbacks.size,viewObservations:globalThis.__qaFiber.viewObservations}}));
  report.agentId=agent.id;report.workspaceId=workspace.id;report.phase=phase;report.result=result.status;report.errors=errors;
  await writeFile(`/tmp/stable-agent-features-qa/${phase}.json`,JSON.stringify(report,null,2));
  await page.screenshot({path:`/tmp/stable-agent-features-qa/${phase}.png`});
  console.log(JSON.stringify({phase,agentId:agent.id,result:result.status,wire:report.wire.length,featuresValues:[...new Set(report.wire.map(x=>JSON.stringify(x.features)))],reasons:report.reasons,fiber:report.fiber,errors}));
} finally {await browser.close();await client.close();}
