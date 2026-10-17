import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
const out='/tmp/paseo-pr-final-gaps-20261017/6736-native',repo='/Users/luopeihuan/workspace/rrd/paseo/.worktrees/pr-6736-parallel-20261016';
const lib=repo+'/packages/app/node_modules/react-native-enriched-markdown';
const seed='/Users/luopeihuan/workspace/rrd/paseo/.worktrees/native-render-stream-cost/packages/app/node_modules/react-native-enriched-markdown';
const vendor=out+'/native-assets/enriched-vendor',generated=vendor+'/generated-getpaseo-app';
if(fs.existsSync(vendor))throw Error('Owned native assets already exist; preserve overlap');
const hash=b=>createHash('sha256').update(b).digest('hex');
const files=(dir,rel='')=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(dir+'/'+e.name,rel+e.name+'/'):[rel+e.name]);
const inputFiles=files(lib).filter(f=>!f.startsWith('cpp/highlight/vendor/')&&!f.startsWith('ios/vendor/'));
const compared=[];
for(const file of inputFiles){
 const a=fs.readFileSync(lib+'/'+file),b=fs.readFileSync(seed+'/'+file);if(!a.equals(b))throw Error('Native asset seed dependency source differs: '+file);compared.push({file,sha256:hash(a)});
}
fs.mkdirSync(out+'/native-assets',{recursive:true});fs.mkdirSync(out+'/build/native-asset-backup',{recursive:true});
execFileSync('/bin/cp',['-cR',seed+'/cpp/highlight/vendor',vendor]);
const config=JSON.parse(fs.readFileSync(out+'/snapshot/packages/app/package.json','utf8'))['enriched-markdown'];
if(!config?.codeHighlightLanguages?.length)throw Error('Explicit candidate subset missing');
const commands=[lib+'/cpp/highlight/gen-registry.mjs','--vendor-dir',vendor,'--languages',config.codeHighlightLanguages.join(','),'--out',generated];
execFileSync(process.execPath,commands,{stdio:'inherit'});
const generatedProof=[];
for(const file of ['generated_registry.cpp','generated_queries.h']){
 const a=fs.readFileSync(generated+'/'+file),b=fs.readFileSync(seed+'/cpp/highlight/vendor/generated-getpaseo-app/'+file);
 if(!a.equals(b))throw Error('Current candidate generated output differs from compatible seed');
 generatedProof.push({file,sha256:hash(a),bytes:a.length,identicalToCompatibleInstalledSeed:true});
}
for(const rel of ['Pods.xcodeproj/project.pbxproj','Target Support Files/ReactNativeEnrichedMarkdown/ReactNativeEnrichedMarkdown.release.xcconfig','Target Support Files/ReactNativeEnrichedMarkdown/ReactNativeEnrichedMarkdown.debug.xcconfig']){
 const target=out+'/snapshot/packages/app/ios/Pods/'+rel,base=fs.readFileSync(target,'utf8');let updated;
 if(rel.endsWith('pbxproj')){
  const expression=/([A-F0-9]+ \/\* vendor \*\/ = \{[^}]*generated-getpaseo-app[^}]*?\n\s*)path = vendor;/;
  if(!expression.test(base))throw Error('Exact enriched vendor group not found');
  updated=base.replace(expression,'$1path = "'+vendor+'";');
 }else{
  const anchor='$(PODS_TARGET_SRCROOT)/cpp/highlight/vendor';if(!base.includes(anchor))throw Error('Vendor header path missing');updated=base.replaceAll(anchor,vendor);
 }
 const backup=out+'/build/native-asset-backup/'+rel;fs.mkdirSync(backup.slice(0,backup.lastIndexOf('/')),{recursive:true});fs.writeFileSync(backup,base);fs.writeFileSync(target,updated);
 try{execFileSync('/usr/bin/diff',['-u','--label','candidate-generated-pods/'+rel,'--label','owned-native-assets/'+rel,backup,target],{encoding:'utf8'})}catch(error){if(error.status!==1)throw error;fs.appendFileSync(out+'/native-asset-paths.diff',error.stdout)}
}
const assetManifest=files(vendor).map(file=>({file,bytes:fs.statSync(vendor+'/'+file).size,sha256:hash(fs.readFileSync(vendor+'/'+file))}));
fs.writeFileSync(out+'/native-assets-manifest.json',JSON.stringify(assetManifest,null,2));
fs.writeFileSync(out+'/native-asset-provenance.json',JSON.stringify({at:new Date().toISOString(),packageVersion:JSON.parse(fs.readFileSync(lib+'/package.json','utf8')).version,sourceFilesCompared:compared.length,sourceFileHashes:compared,packageConfig:config,command:[process.execPath,...commands],generatedProof,assetFiles:assetManifest.length,assetManifestSha256:hash(fs.readFileSync(out+'/native-assets-manifest.json')),origin:seed,reason:'Current JS-only dependency install lacks vendored native grammars and generated registry; reuse byte-compatible installed native assets in QA-only root',writes:'owned /tmp assets and three generated Pods files only; product node_modules untouched; no download or version change'},null,2));
console.log(JSON.stringify({sourceFilesCompared:compared.length,assetFiles:assetManifest.length,generatedProof},null,2));
