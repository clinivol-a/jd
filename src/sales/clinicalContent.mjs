// Structured content only: never persist or render arbitrary HTML / external media URLs.
export function clinicalContentError(content, owner) {
  if (content == null) return '';
  if (content.version !== 1 || !Array.isArray(content.blocks) || content.blocks.length > 100) return '临床需求内容格式不正确。';
  const ids = new Set();
  for (const b of content.blocks) {
    if (!b || typeof b.id !== 'string' || ids.has(b.id)) return '临床需求内容格式不正确。';
    ids.add(b.id);
    if (['paragraph','ul','ol'].includes(b.type)) {
      if (typeof b.text !== 'string' || b.text.length > 20000 || typeof b.bold !== 'boolean') return '临床需求文字格式不正确。';
    } else if (['image','video'].includes(b.type)) {
      const f=b.file;
      if (!f || typeof f.id!=='string' || typeof f.name!=='string' || f.status!=='success' || f.storage!=='browser' || !Number.isFinite(f.size) || f.size<=0 || f.size>20*1024*1024 || !['image/png','image/jpeg','image/webp','video/mp4'].includes(f.type) || (b.type==='video')!==(f.type==='video/mp4') || typeof f.uploadedBy!=='string' || (owner && f.uploadedBy!==owner) || f.url || f.content) return '临床需求媒体未保存或无访问权限。';
    } else return '临床需求内容格式不正确。';
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
