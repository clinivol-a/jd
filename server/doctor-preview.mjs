import {createCanvas,loadImage,DOMMatrix,ImageData,Path2D} from '@napi-rs/canvas';
// Render a derivative for preview; original qualification bytes are never returned by the route.
export async function renderDoctorPreview(bytes,type,page=1){
  if(!Number.isInteger(page)||page<1)throw Error('预览页码无效。');
  if(type==='application/pdf'){
    globalThis.DOMMatrix??=DOMMatrix;globalThis.ImageData??=ImageData;globalThis.Path2D??=Path2D;
    const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
    const task=getDocument({data:new Uint8Array(bytes),useSystemFonts:true});
    let doc;try{doc=await task.promise;if(page>doc.numPages)throw Error('预览页码无效。');const pdfPage=await doc.getPage(page),initial=pdfPage.getViewport({scale:1}),viewport=pdfPage.getViewport({scale:Math.min(1.5,1600/Math.max(initial.width,initial.height))}),canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));await pdfPage.render({canvas,canvasContext:canvas.getContext('2d'),viewport}).promise;return{bytes:canvas.toBuffer('image/png'),pages:doc.numPages};}finally{await task.destroy();}
  }
  const canvas=createCanvas(1000,800),ctx=canvas.getContext('2d');
  if(type?.startsWith('image/')){const image=await loadImage(bytes),scale=Math.min(1,1600/Math.max(image.width,image.height));canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));ctx.drawImage(image,0,0,canvas.width,canvas.height);}
  else if(type==='text/plain'){ctx.fillStyle='#fff';ctx.fillRect(0,0,1000,800);ctx.fillStyle='#222';ctx.font='20px sans-serif';const lines=Buffer.from(bytes).toString('utf8').match(/.{1,45}/gu)||[];const pages=Math.max(1,Math.ceil(lines.length/28));if(page>pages)throw Error('预览页码无效。');lines.slice((page-1)*28,page*28).forEach((line,i)=>ctx.fillText(line,32,40+i*26));return{bytes:canvas.toBuffer('image/png'),pages};}
  else throw Error('该文件暂不支持只读预览。');
  return{bytes:canvas.toBuffer('image/png'),pages:1};
}
