import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const out='/tmp/paseo-pr-final-gaps-20261017/6736-native';
const repo='/Users/luopeihuan/workspace/rrd/paseo/.worktrees/pr-6736-parallel-20261016';
const oldRepo='/Users/luopeihuan/workspace/rrd/paseo/.worktrees/native-render-stream-cost';
const old='/tmp/paseo-review-repair-20261017/qa/native-7186',snap=out+'/snapshot';
if(fs.existsSync(snap))throw Error('New snapshot already exists; preserve overlap');
fs.mkdirSync(snap);fs.mkdirSync(out+'/tmp');fs.mkdirSync(out+'/build');
const archive=execFileSync('git',['-C',repo,'archive','bd3bbb45f612df5fcdd02f5355d545d13341ade0'],{maxBuffer:256*1024*1024});
execFileSync('/usr/bin/tar',['-xf','-','-C',snap],{input:archive});
const hash=b=>createHash('sha256').update(b).digest('hex');
const tracked=execFileSync('git',['-C',repo,'ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const before=tracked.map(file=>({file,sha256:hash(fs.lstatSync(snap+'/'+file).isSymbolicLink()?Buffer.from(fs.readlinkSync(snap+'/'+file)):fs.readFileSync(snap+'/'+file))}));
fs.writeFileSync(out+'/source-tracked-before.json',JSON.stringify(before,null,2));
fs.symlinkSync(repo+'/node_modules',snap+'/node_modules','dir');
const reused=[];
for(const name of fs.readdirSync(repo+'/packages')){
 const source=repo+'/packages/'+name,dest=snap+'/packages/'+name;
 if(!fs.existsSync(dest))continue;
 if(fs.existsSync(source+'/node_modules'))fs.symlinkSync(source+'/node_modules',dest+'/node_modules','dir');
 if(fs.existsSync(source+'/dist')){execFileSync('/bin/cp',['-cR',source+'/dist',dest+'/dist']);reused.push({workspace:name,distFrom:source+'/dist'})}
}
const compatibility=execFileSync('git',['-C',repo,'diff','85f7d56ea79f8b7c22538a2b763875f4ce2d74ad','HEAD','--','package-lock.json','packages/app/package.json','packages/app/app.config.js','packages/expo-two-way-audio','patches'],{encoding:'utf8',maxBuffer:10*1024*1024});
fs.writeFileSync(out+'/native-seed-compatibility.diff',compatibility);
if(compatibility)throw Error('Native seed inputs differ; review before copy');
execFileSync('/bin/cp',['-cR',old+'/packages/app/ios',snap+'/packages/app/ios']);
execFileSync('/bin/cp',['-cR','/tmp/paseo-review-repair-20261017/qa/7186-derived',out+'/DerivedData']);
const generated=[];
function relocate(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
 const p=dir+'/'+e.name;
 if(e.isSymbolicLink()){
  const original=fs.readlinkSync(p),updated=original.replaceAll(oldRepo,repo).replaceAll(old,snap);
  if(updated!==original){fs.unlinkSync(p);fs.symlinkSync(updated,p);generated.push({file:path.relative(snap,p),kind:'symlink',before:original,after:updated})}
 }else if(e.isDirectory())relocate(p);
 else if(e.isFile()&&fs.statSync(p).size<5*1024*1024){
  const b=fs.readFileSync(p);if(b.includes(0))continue;
  const original=b.toString('utf8');
  const updated=original.replaceAll(oldRepo,repo).replaceAll(old,snap);
  if(updated!==original){fs.writeFileSync(p,updated);generated.push({file:path.relative(snap,p),kind:'text',before:hash(b),after:hash(Buffer.from(updated))});
   try{execFileSync('/usr/bin/diff',['-u','--label','seed/'+path.relative(snap,p),'--label','relocated/'+path.relative(snap,p),'/dev/stdin',p],{input:b,encoding:'utf8'})}catch(error){if(error.status!==1)throw error;fs.appendFileSync(out+'/generated-ios-paths.diff',error.stdout)}
  }
 }
}}
relocate(snap+'/packages/app/ios');
const p=snap+'/packages/app/metro.config.cjs';
const base=fs.readFileSync(p,'utf8');
const extra=`
// QA snapshot only: expose already-installed dependency physical roots.
module.exports.watchFolders = [...new Set([...module.exports.watchFolders, ${JSON.stringify(repo)}])];
// QA snapshot only: unify native/core lexical identities after normal resolution.
const qaFs = require("node:fs");
const qaCrypto = require("node:crypto");
const qaOriginalResolve = module.exports.resolver.resolveRequest;
module.exports.resolver.resolveRequest = (context, specifier, platform) => {
  const result = qaOriginalResolve(context, specifier, platform);
  if (result.type !== "sourceFile" || !/[\\\\/]node_modules[\\\\/]@react-navigation[\\\\/](native|core)[\\\\/]/.test(result.filePath)) return result;
  const realpath = qaFs.realpathSync(result.filePath);
  const original = qaFs.readFileSync(result.filePath);
  const canonical = qaFs.readFileSync(realpath);
  if (!original.equals(canonical)) throw new Error("QA navigation canonicalization changed bytes");
  qaFs.appendFileSync(${JSON.stringify(out+'/build/resolver.jsonl')}, JSON.stringify({origin:context.originModulePath,specifier,platform,isESMImport:context.isESMImport,path:result.filePath,realpath,moduleIdentity:realpath,bytesEqual:true,sha256:qaCrypto.createHash("sha256").update(original).digest("hex")})+"\\n");
  return {...result,filePath:realpath};
};
`;
fs.writeFileSync(p,base+extra);
try{execFileSync('/usr/bin/diff',['-u','--label','candidate/packages/app/metro.config.cjs','--label','qa-snapshot/packages/app/metro.config.cjs','/dev/stdin',p],{input:base,encoding:'utf8'})}catch(error){if(error.status!==1)throw error;fs.writeFileSync(out+'/metro-environment.diff',error.stdout)}
const differences=[];
for(const entry of before){const p=snap+'/'+entry.file;const b=fs.lstatSync(p).isSymbolicLink()?Buffer.from(fs.readlinkSync(p)):fs.readFileSync(p);if(hash(b)!==entry.sha256)differences.push({file:entry.file,candidate:entry.sha256,snapshot:hash(b)})}
if(differences.length!==1||differences[0].file!=='packages/app/metro.config.cjs')throw Error('Unexpected source differences');
const server=net.createServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen({port:0,host:'::',ipv6Only:false},resolve)});
const port=server.address().port;await new Promise(resolve=>server.close(resolve));if([6767,6768].includes(port))throw Error('Forbidden port');
fs.writeFileSync(out+'/endpoint.json',JSON.stringify({allocatedAt:new Date().toISOString(),port,bundleEndpoint:'127.0.0.1:'+port,proxyListen:'dual-stack ::',upstream:'OS-selected 127.0.0.1 port per host process'},null,2));
fs.writeFileSync(out+'/source-provenance.json',JSON.stringify({candidate:'bd3bbb45f612df5fcdd02f5355d545d13341ade0',trackedFiles:tracked.length,differences,productSourceChanges:false,sourceMethod:'git archive exact candidate into fresh snapshot',dependencyReuse:'read-only symlinks to assigned checkout already-installed node_modules; owning workspace dist copied',reusedDist:reused,seedSource:old,seedPurpose:'generated iOS/Pods and DerivedData cache only; never installed previous app as current candidate',nativeSeedInputsIdentical:true,generatedPaths:generated,modelConfigured:'codex/gpt-6.1-sol High',actualHostModelMetadata:'not independently exposed'},null,2));
fs.writeFileSync(out+'/prepared',new Date().toISOString());
console.log(JSON.stringify({snapshot:snap,sourceDifferences:differences,generatedRelocations:generated.length,port},null,2));
