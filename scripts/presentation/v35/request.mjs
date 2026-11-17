import {Readable} from 'node:stream';
export async function invoke(middleware,{url,method='GET',headers={},body,remoteAddress='127.0.0.1'}){
 const bytes=body===undefined?Buffer.alloc(0):Buffer.from(typeof body==='string'?body:JSON.stringify(body));
 const req=Object.assign(Readable.from(bytes.length?[bytes]:[]),{url,method,headers:{...headers},socket:{remoteAddress}});
 return new Promise((resolve,reject)=>{const output=[],values=new Map();const res={statusCode:200,headersSent:false,setHeader(k,v){values.set(k.toLowerCase(),v)},getHeader(k){return values.get(k.toLowerCase())},removeHeader(k){values.delete(k.toLowerCase())},writeHead(code,h={}){this.statusCode=code;for(const[k,v]of Object.entries(h))this.setHeader(k,v);return this},write(data){if(data)output.push(Buffer.from(data));return true},end(data){if(data)output.push(Buffer.from(data));this.headersSent=true;resolve({status:this.statusCode,headers:Object.fromEntries(values),body:Buffer.concat(output)})}};Promise.resolve(middleware(req,res,()=>{res.statusCode=404;res.end()})).catch(reject)});
}
