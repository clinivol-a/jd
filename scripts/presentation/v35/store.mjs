import {get,put,BlobPreconditionFailedError} from '@vercel/blob';
import {randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
export function createPreviewStore({namespace,stateKey,read=get,write=put}){
 const key=Buffer.from(stateKey,'hex');
 const seal=value=>{const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',key,iv);return Buffer.concat([iv,c.update(gzipSync(Buffer.from(JSON.stringify(value)))),c.final(),c.getAuthTag()])};
 const unseal=bytes=>{const b=Buffer.from(bytes),d=createDecipheriv('aes-256-gcm',key,b.subarray(0,12));d.setAuthTag(b.subarray(-16));return JSON.parse(gunzipSync(Buffer.concat([d.update(b.subarray(12,-16)),d.final()])).toString())};
 const path=kind=>`presentation/${namespace}/v35-${kind}.enc`;
 async function load(kind){const r=await read(path(kind),{access:'private',useCache:false});if(!r||r.statusCode!==200)throw Error('演示存储不可用。');return{state:unseal(Buffer.from(await new Response(r.stream).arrayBuffer())),etag:r.blob.etag?.replace(/^W\//,'')}}
 async function initialize(kind,value){await write(path(kind),seal(value),{access:'private',addRandomSuffix:false,allowOverwrite:false,contentType:'application/octet-stream'})}
 async function transaction(kind,run){for(let attempt=0;attempt<12;attempt++){const{state,etag}=await load(kind),before=JSON.stringify(state),result=await run(state);if(before===JSON.stringify(state))return result;try{await write(path(kind),seal(state),{access:'private',addRandomSuffix:false,allowOverwrite:true,ifMatch:etag,contentType:'application/octet-stream'});return result}catch(e){if(!(e instanceof BlobPreconditionFailedError)&&e.name!=='BlobPreconditionFailedError'&&e.message!=='Vercel Blob: The conditional request cannot succeed due to a conflicting operation against this resource.'||attempt===11)throw e;await new Promise(r=>setTimeout(r,Math.min(1000,80*2**attempt)+Math.random()*400))}}}
 return{load,initialize,transaction};
}
