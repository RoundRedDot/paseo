import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
const out='/tmp/paseo-pr-final-gaps-20261017/6736-native',repo='/Users/luopeihuan/workspace/rrd/paseo/.worktrees/pr-6736-parallel-20261016',pods=out+'/snapshot/packages/app/ios/Pods';
const dest=out+'/native-assets/expo-sqlite';fs.mkdirSync(dest,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex'),proof=[];
for(const file of ['sqlite3.c','sqlite3.h']){
 const from=repo+'/node_modules/expo-sqlite/vendor/sqlite3/'+file,b=fs.readFileSync(from);
 fs.writeFileSync(dest+'/'+file,b);
 const seed=fs.readFileSync('/Users/luopeihuan/workspace/rrd/paseo/.worktrees/native-render-stream-cost/node_modules/expo-sqlite/ios/'+file);
 assert(b.equals(seed),'Candidate vendored SQLite differs from compatible podspec-prepared seed');
 proof.push({file,from,bytes:b.length,sha256:sha(b),identicalToNormalPodspecPreparedSeed:true});
}
const project=pods+'/Pods.xcodeproj/project.pbxproj',base=fs.readFileSync(project,'utf8');let updated=base;
for(const file of ['sqlite3.c','sqlite3.h']){
 const anchor='path = '+file+'; sourceTree = "<group>";';assert.equal(updated.split(anchor).length-1,1,'Unique SQLite source reference');
 updated=updated.replace(anchor,'path = "'+dest+'/'+file+'"; sourceTree = "<group>";');
}
fs.writeFileSync(out+'/build/sqlite-project-before.pbxproj',base);fs.writeFileSync(project,updated);
try{execFileSync('/usr/bin/diff',['-u','--label','before-qa-sqlite/Pods.xcodeproj/project.pbxproj','--label','qa-prepared-sqlite/Pods.xcodeproj/project.pbxproj',out+'/build/sqlite-project-before.pbxproj',project],{encoding:'utf8'})}catch(e){if(e.status!==1)throw e;fs.writeFileSync(out+'/sqlite-preparation.diff',e.stdout)}
const links=[];
for(const kind of ['Public','Private']){
 const target=pods+'/Headers/'+kind+'/ExpoSQLite/sqlite3.h';assert(fs.lstatSync(target).isSymbolicLink());const original=fs.readlinkSync(target);assert(!fs.existsSync(target),'Expected proven dangling prepared header');fs.unlinkSync(target);fs.symlinkSync(dest+'/sqlite3.h',target);links.push({file:path.relative(pods,target),before:original,after:dest+'/sqlite3.h'});
}
// Read generated project references only; no dependency/interface or route changes.
const object=JSON.parse(execFileSync('/usr/bin/plutil',['-convert','json','-o','-',project],{encoding:'utf8',maxBuffer:32*1024*1024})).objects;
const parent=new Map();for(const[id,value]of Object.entries(object))for(const child of value.children??[])parent.set(child,id);
const root=path.dirname(path.dirname(project));
function resolve(id,seen=new Set()){
 assert(!seen.has(id),'Generated group cycle');seen.add(id);const item=object[id];assert(item);
 const p=item.path??'';if(path.isAbsolute(p))return p;
 if(item.sourceTree==='SOURCE_ROOT')return path.resolve(root,p);
 if(!item.sourceTree||item.sourceTree==='<group>'){const owner=parent.get(id);return path.resolve(owner?resolve(owner,seen):root,p)}
 return null;
}
const missing=[],sources=[];
for(const value of Object.values(object))if(value.isa==='PBXSourcesBuildPhase')for(const buildFile of value.files??[]){const ref=object[buildFile]?.fileRef;if(!ref)continue;const p=resolve(ref);if(p){sources.push(p);if(!fs.existsSync(p))missing.push(p)}}
fs.writeFileSync(out+'/native-source-preflight.json',JSON.stringify({at:new Date().toISOString(),sourceReferences:sources.length,uniqueSources:new Set(sources).size,missing:[...new Set(missing)]},null,2));
fs.writeFileSync(out+'/sqlite-preparation-provenance.json',JSON.stringify({at:new Date().toISOString(),reason:'ExpoSQLite podspec vendor_sqlite_src! copies vendored sqlite3.c/h into ios; seeded references were dangling in current JS-only dependency install',podspecSha256:sha(fs.readFileSync(repo+'/node_modules/expo-sqlite/ios/ExpoSQLite.podspec')),version:JSON.parse(fs.readFileSync(repo+'/node_modules/expo-sqlite/package.json')).version,proof,links,semantics:'Exact copy of existing candidate vendor sources; unchanged flags/source Swift; only new Pods source/header paths redirect to owned copies',productWrites:false,downloads:false},null,2));
assert.equal(missing.length,0,'All generated native source references must exist before rebuilding');console.log(JSON.stringify({copied:proof,links,sourceReferences:sources.length,missing:0},null,2));
