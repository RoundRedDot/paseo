import fs from 'node:fs';
import {randomUUID,createHash} from 'node:crypto';
// Temporary provider transport fixture over the repository's existing FakePi seam.
// Inputs are the actual images passed by PiRpcAgentSession after normal API submission.
export function createNativeImageFixture({FakePi,out,log}) {
 const file=out+'/provider-fixture/messages.json';
 fs.mkdirSync(out+'/provider-fixture',{recursive:true});
 if(!fs.existsSync(file))fs.writeFileSync(file,'[]');
 const model={provider:'qa-fixture',id:'native-images',name:'Synthetic native image fixture',input:['text','image']};
 const runtime=new FakePi(['/usr/bin/true']);
 const originalStart=runtime.startSession.bind(runtime);
 runtime.startSession=async input=>{
  const session=await originalStart(input);
  session.state={...session.state,model,sessionId:'qa6736-native-image-fixture',sessionFile:file};
  session.models=[model];session.setModelResult=model;
  const entries=JSON.parse(fs.readFileSync(file,'utf8'));
  session.messages=entries.map(e=>e.message);
  session.treeUserEntries=entries.filter(e=>e.message.role==='user').map(e=>({id:e.id,parentId:e.parentId,text:e.message.content.filter(p=>p.type==='text').map(p=>p.text).join('\n\n')}));
  session.contextUserEntries=[...session.treeUserEntries];
  log('fixture-session-open',{sessionFile:'owned synthetic provider fixture',resumed:!!input.session,entries:entries.length,model:'qa-fixture/native-images',realModelRequests:0});
  const originalPrompt=session.prompt.bind(session);
  session.prompt=async(message,images)=>{
   const ack=await originalPrompt(message,images);
   if(message.startsWith('/paseo_'))return ack;
   if(images?.length!==1)throw Error('Fixture requires exactly one actual API image');
   const stored=JSON.parse(fs.readFileSync(file,'utf8'));
   const index=stored.filter(e=>e.message.role==='user').length;
   if(index>=2)throw Error('Synthetic input budget exceeded');
   const nativeId='qa6736-native-'+randomUUID();
   const content=[{type:'text',text:message},...images.map(i=>({type:'image',data:i.data,mimeType:i.mimeType}))];
   const user={id:nativeId,parentId:stored.at(-1)?.id??null,message:{role:'user',content}};
   const reply='QA6736 fixture reply '+(index+1);
   const assistant={id:'qa6736-reply-'+randomUUID(),parentId:nativeId,message:{role:'assistant',content:[{type:'text',text:reply}],responseId:'qa6736-response-'+(index+1)}};
   // This file is provider-owned fixture persistence, not a daemon/cache/store injection.
   fs.writeFileSync(file,JSON.stringify([...stored,user,assistant],null,2));
   session.messages=[...session.messages,user.message];
   session.treeUserEntries.push({id:nativeId,parentId:user.parentId,text:message});
   session.contextUserEntries=[...session.treeUserEntries];
   session.state={...session.state,messageCount:stored.length+2};
   log('fixture-normal-prompt',{index:index+1,nativeId,text:message,images:images.map(i=>({mimeType:i.mimeType,bytes:Buffer.from(i.data,'base64').length,sha256:createHash('sha256').update(Buffer.from(i.data,'base64')).digest('hex')})),realModelRequests:0});
   setTimeout(()=>{
    session.emit({type:'agent_start'});session.emit({type:'turn_start'});
    session.finishSubmittedUserMessage({id:nativeId,parentId:user.parentId,text:message});
    session.emit({type:'message_start',message:assistant.message});
    session.emit({type:'message_update',message:assistant.message,assistantMessageEvent:{type:'text_delta',delta:reply}});
    session.emit({type:'message_end',message:assistant.message});
    session.finishTurn(assistant.message);
   },30);
   return ack;
  };
  return session;
 };
 return runtime;
}
