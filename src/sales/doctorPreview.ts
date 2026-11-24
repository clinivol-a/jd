import type {Attachment} from './model';
import {getFile} from './files';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
/** Original browser-only files remain local; invitation files use an authorized raster endpoint. */
export async function doctorPreview(owner:string,file:Attachment,page=1):Promise<{blob:Blob;pages:number}>{
 if(file.storage==='directory'){const response=await fetch('/api/admin/business/doctor-file?id='+encodeURIComponent(file.id)+'&page='+page);if(!response.ok)throw Error('资料不可用或无预览权限。');return {blob:await response.blob(),pages:Number(response.headers.get('X-Preview-Pages')||1)};}
  if(file.storage==='invitation'){
    const response=await fetch('/api/sales-demo/file-preview?id='+encodeURIComponent(file.id)+'&page='+page);
    if(!response.ok)throw Error((await response.json()).error||'资料不可预览。');
    return {blob:await response.blob(),pages:Number(response.headers.get('X-Preview-Pages')||1)};
  }
  const blob=await getFile(owner,file);
  if(file.type==='application/pdf'){
    const pdf=await import('pdfjs-dist');pdf.GlobalWorkerOptions.workerSrc=workerUrl;
    const task=pdf.getDocument({data:new Uint8Array(await blob.arrayBuffer())});
    try{const doc=await task.promise;if(page<1||page>doc.numPages)throw Error('预览页码无效。');const sheet=await doc.getPage(page),first=sheet.getViewport({scale:1}),viewport=sheet.getViewport({scale:Math.min(1.5,1600/Math.max(first.width,first.height))}),canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);const context=canvas.getContext('2d');if(!context)throw Error('当前浏览器无法预览。');await sheet.render({canvas,canvasContext:context,viewport}).promise;const result=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('预览生成失败。')),'image/png'));return{blob:result,pages:doc.numPages};}finally{await task.destroy();}
  }
  if(file.type.startsWith('image/'))return{blob,pages:1};
  if(file.type==='text/plain'){
    const lines=(await blob.text()).match(/.{1,45}/gu)||[],pages=Math.max(1,Math.ceil(lines.length/28)),canvas=document.createElement('canvas');canvas.width=1000;canvas.height=800;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,1000,800);ctx.fillStyle='#222';ctx.font='20px sans-serif';lines.slice((page-1)*28,page*28).forEach((line,i)=>ctx.fillText(line,32,40+i*26));return{blob:await new Promise<Blob>((resolve,reject)=>canvas.toBlob(v=>v?resolve(v):reject(Error('预览生成失败。')))),pages};
  }
  throw Error('该文件暂不支持只读预览。');
}
