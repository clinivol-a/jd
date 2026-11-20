import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {resolve} from 'node:path';
import {loadConfigFromFile} from 'vite';
import {seedSales,transition} from '../src/sales/model.ts';
import {orderErrors} from '../src/sales/orderRules.mjs';

// Exercise the plugin created by the REAL Vite configuration, not a separately wired factory.
test('actual Vite sales validator resolves auth origin and keeps session/owner/field checks',async()=>{
 const upstream=[];
 const auth=createServer((req,res)=>{upstream.push({url:req.url,cookie:req.headers.cookie});const cookie=req.headers.cookie;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({user:cookie==='sales'||cookie==='locked'?{id:'li',name:'李明',role:'sales'}:cookie==='designer'?{id:'chen-yu',role:'designer'}:null,locked:cookie==='locked'}));});
 await new Promise(r=>auth.listen(0,'127.0.0.1',r));
 const prior=process.env.CV_AUTH_ORIGIN;process.env.CV_AUTH_ORIGIN='http://127.0.0.1:'+auth.address().port;
 let bridge;
 try {
  const loaded=await loadConfigFromFile({command:'serve',mode:'development'},resolve('vite.config.ts'));
  const plugin=loaded.config.plugins.flat(Infinity).find(p=>p.name==='clinivol-sales-local-invitations');assert.ok(plugin);
  let handler;await plugin.configureServer({config:{server:{port:0}},middlewares:{use:f=>handler=f}});
  bridge=createServer((req,res)=>handler(req,res,()=>{res.statusCode=404;res.end()}));await new Promise(r=>bridge.listen(0,'127.0.0.1',r));
  const url='http://127.0.0.1:'+bridge.address().port+'/api/sales-demo/order-validate';
  const data=seedSales('li'),base=data.orders.find(o=>o.status==='草稿'),patientName=data.cases.find(c=>c.id===base.caseId)?.patientName;
  const payload={ownerId:'li',order:base,patientName};assert.deepEqual(orderErrors(base,patientName),{});
  const request=(cookie,body=payload)=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(cookie?{cookie}:{} )},body:JSON.stringify(body)});
  const accepted=await request('sales');assert.equal(accepted.status,200,JSON.stringify(await accepted.clone().json()));assert.deepEqual(await accepted.json(),{errors:{}});
  for(const cookie of ['', 'designer','locked'])assert.equal((await request(cookie)).status,403,cookie);
  assert.equal((await request('sales',{...payload,ownerId:'different-account'})).status,403);
  const invalid=await request('sales',{...payload,order:{...base,name:''}});assert.equal(invalid.status,422);assert.ok((await invalid.json()).errors.name);
  const after=transition(transition(data,{type:'order-save',value:base},{id:'li',permissions:[]}),{type:'order-submit',target:base.id},{id:'li',permissions:[]});assert.equal(after.orders.find(o=>o.id===base.id).status,'待审核');
  assert.ok(upstream.length>=6);assert.ok(upstream.every(r=>r.url==='/api/auth/session'));assert.ok(upstream.some(r=>r.cookie==='sales'));
 }finally{
  if(prior===undefined)delete process.env.CV_AUTH_ORIGIN;else process.env.CV_AUTH_ORIGIN=prior;
  if(bridge){bridge.closeAllConnections();await new Promise(r=>bridge.close(r));}
  auth.closeAllConnections();await new Promise(r=>auth.close(r));
 }
});
