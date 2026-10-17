import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const out='/tmp/paseo-pr-final-gaps-20261017/6736-native';
const candidates=[];
function find(dir){if(!fs.existsSync(dir))return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.isDirectory())find(dir+'/'+e.name);else if(/^(ExpoSQLite|SQLite3)-.*\.pcm$/.test(e.name))candidates.push(dir+'/'+e.name)}}
find(out+'/DerivedData-fresh/ModuleCache.noindex');
find(out+'/DerivedData-fresh/Build/Intermediates.noindex/ExplicitPrecompiledModules');
const records=[];
for(const [index,file]of candidates.entries()){
 let output,exit=0;try{output=execFileSync('xcrun',['clang','-module-file-info',file],{encoding:'utf8',maxBuffer:16*1024*1024})}catch(e){exit=e.status;output=String(e.stdout??'')+String(e.stderr??'')}
 fs.writeFileSync(out+'/build/sqlite-module-info-'+index+'.log',output);
 records.push({file,exit,mtime:fs.statSync(file).mtime.toISOString(),sqliteLines:output.split('\n').filter(line=>/sqlite3|ExpoSQLite|Module name:|Module map file:/.test(line))});
}
const headers=['Public','Private'].map(kind=>{const file=out+'/snapshot/packages/app/ios/Pods/Headers/'+kind+'/ExpoSQLite/sqlite3.h';return{kind,symlink:fs.readlinkSync(file),realpath:fs.realpathSync(file),hasExsqliteOpen:/SQLITE_API int exsqlite3_open\(/.test(fs.readFileSync(file,'utf8'))}});
const result={at:new Date().toISOString(),readOnly:true,noNewBuildOrRuntime:true,headers,modules:records,limitation:records.some(r=>r.exit===0)?'Some module metadata was readable; no source/cache repair performed':'Exact Swift imported header identity remains unproven: xcrun clang cannot read Swift-produced PCM due compiler-branch incompatibility; no source/cache repair performed'};
fs.writeFileSync(out+'/sqlite-readonly-diagnostic.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
