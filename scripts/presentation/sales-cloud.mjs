import {get,put} from '@vercel/blob';
import {salesDemoPlugin} from './sales-demo.mjs';
import {InviteProof} from './sales-invite-proof.mjs';
export async function serveSales(req,res,{origin,session,namespace}){
 const pathname=`presentation/${namespace}/sales.json`;
 const blob=await get(pathname,{access:'private',useCache:false});
 const saved=blob?.statusCode===200?JSON.parse(await new Response(blob.stream).text()):null;
 // Download responses can include a weak HTTP ETag; conditional Blob writes require the strong value.
 let etag=blob?.blob?.etag?.replace(/^W\//, "");
 const proof=new InviteProof();for(const field of ['codes','proofs','files'])if(saved?.proof?.[field])proof[field]=new Map(saved.proof[field]);
 const plugin=salesDemoPlugin('',undefined,{
  getSession:()=>session,publicOrigin:origin,proofService:proof,allowTestInbox:true,exposeDemoCode:true,
  loadRecords:async()=>saved?.records||{invites:[],leads:[]},
  saveRecords:async records=>{const proofState={};for(const f of ['codes','proofs','files'])proofState[f]=[...proof[f]];
   const result=await put(pathname,JSON.stringify({records,proof:proofState}),{access:'private',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json',cacheControlMaxAge:60,...(etag?{ifMatch:etag}:{})});etag=result.etag;
  },
 });
 let middleware;await plugin.configureServer({config:{server:{port:443,host:false}},middlewares:{use(fn){middleware=fn}}});
 return middleware(req,res,()=>{res.statusCode=404;res.end()});
}
