// Structured content only: never persist or render arbitrary HTML / external media URLs.
export function clinicalContentError(content, owner) {
  if (content == null) return '';
  if (content.version !== 1 || !Array.isArray(content.blocks) || content.blocks.length > 100) return '设计需求内容格式不正确。';
  const ids = new Set();
  for (const b of content.blocks) {
    if (!b || typeof b.id !== 'string' || ids.has(b.id)) return '设计需求内容格式不正确。';
    ids.add(b.id);
    if (['paragraph','ul','ol'].includes(b.type)) {
      if (typeof b.text !== 'string' || b.text.length > 20000 || typeof b.bold !== 'boolean') return '设计需求文字格式不正确。';
    } else if (['image','video'].includes(b.type)) {
      const f=b.file;
      if (!f || typeof f.id!=='string' || typeof f.name!=='string' || f.status!=='success' || f.storage!=='browser' || !Number.isFinite(f.size) || f.size<=0 || f.size>20*1024*1024 || !['image/png','image/jpeg','image/webp','video/mp4'].includes(f.type) || (b.type==='video')!==(f.type==='video/mp4') || typeof f.uploadedBy!=='string' || (owner && f.uploadedBy!==owner) || f.url || f.content) return '设计需求媒体未保存或无访问权限。';
    } else return '设计需求内容格式不正确。';
  }
  return '';
}
export function clinicalText(content) {
  if (!content || clinicalContentError(content)) return '';
  return content.blocks.filter(b=>['paragraph','ul','ol'].includes(b.type)).map(b=>b.text).join('\n');
}
export function hasClinicalContent(content) {
  return !!content && !clinicalContentError(content) && content.blocks.some(b=>b.file || b.text.trim());
}

/** Read-only compatibility: retain every original field and report disagreements. */
export function designDemand(order={}) {
 const content=order.clinicalContent;
 const structured=content && (clinicalContentError(content) || hasClinicalContent(content));
 const text=structured?clinicalText(content):[order.designRequirements,order.clinicalRequirements,order.requirements].find(v=>typeof v==='string'&&v.trim())||'';
 const conflicts=Object.entries({designRequirements:order.designRequirements,clinicalRequirements:order.clinicalRequirements,requirements:order.requirements}).filter(([,v])=>typeof v==='string'&&v.trim()&&v.trim()!==text.trim()).map(([field,value])=>({field,value}));
 return {content:structured?content:undefined,text,conflicts};
}
