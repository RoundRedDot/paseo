import fs from 'node:fs';import net from 'node:net';
const [infoFile,outFile]=process.argv.slice(2),info=JSON.parse(fs.readFileSync(infoFile,'utf8'));
const checks=await Promise.all([info.port,info.upstreamPort].flatMap(port=>['127.0.0.1','::1'].map(host=>new Promise((resolve,reject)=>{
 const s=net.connect(port,host);s.once('connect',()=>{s.destroy();reject(Error('Unexpected owned listener remains'))});s.once('error',error=>error.code==='ECONNREFUSED'?resolve({port,host,error:error.code}):reject(error));s.setTimeout(2000,()=>{s.destroy();reject(Error('Port probe timeout'))});
}))));
fs.writeFileSync(outFile,JSON.stringify({at:new Date().toISOString(),checks},null,2));
