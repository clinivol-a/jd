import {adminResultPreview} from './resultPreview.mjs';
import {renderDoctorPreview} from '../doctor-preview.mjs';
import {AdminFailure} from './service.mjs';
import {managementActor} from './memberAccess.mjs';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function adminHandler(auth,admin,{origin}) {
 return async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');
  try{
   if(process.env.NODE_ENV==='production'||auth.mode!=='local'||!auth.demoMode)throw new AdminFailure('接口不存在。',404);
   if(req.headers.origin&&req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site')throw new AdminFailure('请求来源不允许。',403);
   if(req.method!=='GET'&&(req.headers.origin!==origin||req.headers['x-clinivol-request']!=='1'))throw new AdminFailure('安全校验失败。',403);
   const token=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('cv_auth_device='))?.slice(15);
   if(!token)throw new AdminFailure('请先登录。',401);
   let actor=auth.require(auth.device(token));const url=new URL(req.url,origin);
   if(url.pathname.startsWith('/api/admin/business/')){
    const action=url.pathname.slice('/api/admin/business/'.length);let body={};
    if(req.method==='POST'){let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>(action==='doctor-upload'?29:2)*1024*1024)throw new AdminFailure('请求内容过大。',413)}try{body=JSON.parse(raw)}catch{throw new AdminFailure('请求格式不正确。')}}
    let result;
    if(req.method==='GET'&&action==='sales')result=admin.shared.salesSnapshot(actor);
    else if(req.method==='GET'&&action==='directory')result=admin.institutions.salesSnapshot(actor);
    else if(req.method==='POST'&&action==='doctor-upload')result=admin.institutions.upload(actor,body);
    else if(req.method==='GET'&&action==='doctor-file'){const file=admin.institutions.file(actor,url.searchParams.get('id'));const rendered=await renderDoctorPreview(file.bytes,file.type,Number(url.searchParams.get('page')||1));res.setHeader('X-Preview-Pages',String(rendered.pages));res.setHeader('Content-Type','image/png');res.setHeader('X-Content-Type-Options','nosniff');res.end(rendered.bytes);return;}
    else if(req.method==='POST'&&action==='doctor-save')result=admin.institutions.saveDoctor(actor,body);
    else if(req.method==='GET'&&action==='designer')result=admin.shared.designerSnapshot(actor);
    else if(req.method==='POST'&&action==='save')result=admin.shared.save(actor,body);
    else if(req.method==='POST'&&action==='submit')result=admin.receiveOrder(actor,body);
    else if(req.method==='POST'&&action==='delete')result=admin.shared.remove(actor,body);
    else if(req.method==='POST'&&action==='task')result=admin.shared.taskCommand(actor,body);
    else throw new AdminFailure('接口不存在。',404);
    res.end(JSON.stringify(result));return;
   }
   actor=managementActor(admin,actor);
   if(req.method==='GET'&&url.pathname==='/api/admin/state'){res.end(JSON.stringify(admin.snapshot(actor)));return}
   if(req.method==='GET'&&url.pathname==='/api/admin/result-preview'){res.end(JSON.stringify(adminResultPreview(admin,actor,url.searchParams.get('resultId'),url.searchParams.get('resultVersion'))));return}
   if(req.method==='GET'&&url.pathname==='/api/admin/order-attachment'){
    const result=admin.orderAttachment(actor,url.searchParams.get('orderId'),url.searchParams.get('fileId'));
    res.setHeader('Content-Type',result.type);res.setHeader('Content-Disposition','inline');res.setHeader('X-Content-Type-Options','nosniff');
    res.end(Buffer.from(result.bytes));return;
   }
   if(req.method==='GET'&&url.pathname.startsWith('/api/admin/preview/')){
    const id=decodeURIComponent(url.pathname.slice('/api/admin/preview/'.length));if(admin.institutions.snapshot().doctors.some(d=>d.materials?.some(m=>m.id===id))){const file=admin.institutions.file(actor,id),rendered=await renderDoctorPreview(file.bytes,file.type,Number(url.searchParams.get('page')||1));res.setHeader('X-Preview-Pages',String(rendered.pages));res.setHeader('Content-Type','image/png');res.setHeader('X-Content-Type-Options','nosniff');res.end(rendered.bytes);return;}const file=admin.preview(actor,id);res.setHeader('Content-Type','image/svg+xml; charset=utf-8');res.setHeader('Content-Disposition','inline');res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; sandbox");res.end(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="480" viewBox="0 0 720 480"><rect width="720" height="480" fill="white"/><g fill="#333" font-family="sans-serif"><text x="56" y="88" font-size="28">隔离合成资质资料</text><text x="56" y="150" font-size="20">${escape(file.name)}</text><text x="56" y="200" font-size="18">提交来源：${escape(file.submittedBy)}</text><text x="56" y="250" font-size="18">仅用于本地审核交互，不含真实身份证或执业证件。</text></g></svg>`);return;
   }
   if(req.method==='POST'&&url.pathname==='/api/admin/command'){
    let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>32768)throw new AdminFailure('请求内容过大。',413)}let body;try{body=JSON.parse(text)}catch{throw new AdminFailure('请求格式不正确。')};const result=admin.command(actor,body);if(result.file){res.setHeader('Content-Type',result.mime);res.setHeader('Content-Disposition','attachment; filename="'+result.filename+'"');res.setHeader('X-Content-Type-Options','nosniff');res.end(result.file);return}res.end(JSON.stringify(result));return
   }
   throw new AdminFailure('接口不存在。',404)
  }catch(error){res.statusCode=error.status||500;res.end(JSON.stringify({error:error.status?error.message:'管理服务暂不可用，请重试。'}))}
 }
}
