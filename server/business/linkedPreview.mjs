import {createCanvas} from '@napi-rs/canvas';
import {previewModel} from './previewModel.mjs';
const cache=new Map();
/** Static derivative of the same named display asset used by the isolated professional viewer. No approval or publication is created. */
export function linkedResultImage({task,artifact}) {
 if(task.workspace?.assetId!=='shared-jaw-demonstration'||!artifact.synthetic)return null;
 const key=artifact.id+':'+artifact.version;if(cache.has(key))return cache.get(key);
 const model=previewModel(key),pts=[];
 for(let i=0;i<model.positions.length;i+=3){const[x,y,z]=model.positions.slice(i,i+3);pts.push([x*.86-y*.5,z+y*.3,y*.86+x*.5]);}
 const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),scale=Math.min(540/(maxX-minX),350/(maxY-minY));
 const c=createCanvas(640,480),ctx=c.getContext('2d');ctx.fillStyle='#f5f7f9';ctx.fillRect(0,0,640,480);
 const faces=[];for(let i=0;i<model.indices.length;i+=3){const p=model.indices.slice(i,i+3).map(n=>pts[n]);faces.push(p)}faces.sort((a,b)=>a.reduce((s,p)=>s+p[2],0)-b.reduce((s,p)=>s+p[2],0));
 const zValues=pts.map(p=>p[2]),lo=Math.min(...zValues),hi=Math.max(...zValues);
 for(const p of faces){const shade=Math.round(110+110*(p.reduce((s,v)=>s+v[2],0)/3-lo)/(hi-lo));ctx.fillStyle=`rgb(${shade},${shade},${Math.max(0,shade-9)})`;ctx.beginPath();p.forEach((v,i)=>ctx[i?'lineTo':'moveTo'](320+(v[0]-(minX+maxX)/2)*scale,235-(v[1]-(minY+maxY)/2)*scale));ctx.closePath();ctx.fill();}
 const bytes=c.toBuffer('image/png');cache.set(key,bytes);return bytes;
}
