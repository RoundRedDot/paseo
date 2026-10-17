import fs from'node:fs';
const [out,stage]=process.argv.slice(2);
const ledger=fs.readFileSync(out+'/ws-ledger.jsonl','utf8').trim().split('\n').map(JSON.parse);
const native=ledger.filter(e=>e.event==='frame'&&e.connection!=='control-cli');
const counts={};for(const e of native){const type=e.fields?.message?.type??e.fields?.type;const key=e.direction+':'+type;counts[key]=(counts[key]??0)+1;}
const id=JSON.parse(fs.readFileSync(out+'/info.json','utf8'));
const directory=native.filter(e=>/fetch_(agents|workspaces)_(request|response)|project.list/.test(e.fields?.message?.type??''));
const result={at:new Date().toISOString(),stage,counts,directoryEvents:directory,expectedWorkspaceId:id.workspaceId};
fs.writeFileSync(out+'/'+stage+'.json',JSON.stringify(result,null,2));
if(stage==='before-menu'&&directory.length)throw Error('Directory fetch already happened before normal menu action');
if(stage==='after-menu'){
 const workspace=directory.find(e=>e.direction==='host->native'&&e.fields?.message?.type==='fetch_workspaces_response'&&JSON.stringify(e.fields).includes(id.workspaceId));
 if(!workspace)throw Error('Target native workspace response not observed');
}
