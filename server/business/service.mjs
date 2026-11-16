import {validIdentity} from '../../src/sales/patientRules.mjs';
import { randomBytes, randomUUID, createCipheriv, createDecipheriv } from 'node:crypto';
import { InviteProof } from '../sales-invite-proof.mjs';
import { insuranceXlsx } from './xlsx.mjs';
export const monthOf = value => { const d = new Date(value); return Number.isFinite(+d) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : ''; };
export class BusinessFailure extends Error {
    constructor(message, status = 400) { super(message); this.status = status; }
}
const fail = (message, status = 400) => { throw new BusinessFailure(message, status); };
const keyFields = ['patientName', 'sex', 'identityNumber', 'examNo', 'examDate', 'bodyPart', 'hospitalId'];
export class BusinessService {
    constructor({ state = { imports: {}, patients: {}, shares: {}, samples: {}, audit: [] }, key = randomBytes(32), image, now = () => new Date(), persist = async () => { } } = {}) { this.state = state; this.key = key; this.image = image; this.now = now; this.persist = persist; this.proofs = new InviteProof(); this.receipts = new Map(Object.entries(this.state.receipts || {})); this.projections = new Map(); }
    sales(user) { if (!user || user.role !== 'sales' || user.status !== 'approved')
        fail('请使用已审核的销售账号。', 403); return user; }
    permitted(user) { this.sales(user); if (!user.permissions?.includes('insurance.export'))
        fail('无医保资料导出权限。', 403); }
    audit(user, type, target, detail = '') { this.state.audit.push({ id: randomUUID(), at: this.now().toISOString(), actor: user?.id || 'authorized-viewer', type, target, detail }); }
    seal(value) { const iv = randomBytes(12), c = createCipheriv('aes-256-gcm', this.key, iv); return [iv.toString('base64'), Buffer.concat([c.update(JSON.stringify(value)), c.final()]).toString('base64'), c.getAuthTag().toString('base64')].join('.'); }
    unseal(value) { const [iv, body, tag] = value.split('.').map(s => Buffer.from(s, 'base64')), d = createDecipheriv('aes-256-gcm', this.key, iv); d.setAuthTag(tag); return JSON.parse(Buffer.concat([d.update(body), d.final()]).toString()); }
    validatePatient(user, order) { this.sales(user); if (!order.insuranceConsent)
        return; const p = this.state.patients[order.patientIdentityRef]; if (!p || p.owner !== user.id || this.unseal(p.record).sex !== order.patientSex)
        fail('医保资料凭证无效或无访问权限。', 403); }
    async patient(user, body) { this.sales(user); if (!['男','女'].includes(body.sex)||!validIdentity(body.identityNumber))
        fail('请在授权核验后补齐性别和18位证件信息。'); const ref = randomUUID(); this.state.patients[ref] = { owner: user.id, record: this.seal({ identityNumber: body.identityNumber, sex: body.sex }), source: 'isolated-demo-verification' }; this.audit(user, 'patient-authorized', ref); await this.persist(this.state); return { patientIdentityRef: ref, patientSex: body.sex, insuranceConsent: true }; }
    async start(user, body) { this.sales(user); if (!['report', 'pacs'].includes(body.mode))
        fail('无效导入方式。'); if (body.mode === 'report' && (!Array.isArray(body.photos) || body.photos.length !== 2 || body.photos.some(f => !/^image\/(png|jpeg|webp)$/.test(f.type) || !Number.isFinite(f.size) || f.size > 20 * 1024 * 1024 || !/^data:image\/(png|jpeg|webp);base64,/.test(f.content || '') || f.content.length > 28 * 1024 * 1024)))
        fail('请上传两张有效的报告/患者资料照片。'); if(body.hospital&&!['H-A','H-B','H-C','demo-hospital','h1','unconnected'].includes(body.hospital))fail('医院未获得当前隔离连接授权。',403);
        if (body.mode === 'pacs' && body.hospital === 'unconnected')
        fail('该医院尚未建立授权连接。', 503); if (body.fail)
        fail('隔离连接获取失败，可重试或转人工。', 503); if(body.mode==='report'&&body.photos.some(f=>{const b=Buffer.from(f.content.split(',')[1],'base64');return !b.length||b.length>20*1024*1024||!(f.type==='image/png'&&b[0]===137&&b.subarray(1,4).toString()==='PNG'||f.type==='image/jpeg'&&b[0]===255&&b[1]===216||f.type==='image/webp'&&b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP')}))fail('照片内容与格式不符。');
        const value = { patientName: '沈嘉宁', sex: '女', identityNumber: '11010519491231002X', hospitalId: body.hospital || 'demo-hospital', examNo: 'LOCAL-CT-20261116-01', examDate: this.now().toISOString().slice(0, 10), bodyPart: '颌面部', modality: 'CT', series: ['薄层轴位', '骨窗重建'], qrSource: 'isolated-hospital-adapter', dataOrigin: 'isolated-demo' }; const id = randomUUID(); this.state.imports[id] = { id, owner: user.id, mode: body.mode, original: value, current: value, photos: body.photos?.map(({ content, ...f }) => f), actor: user.id, changes: [], matched: false, authorized: false, acquired: false }; this.audit(user, 'import-started', id, body.mode); await this.persist(this.state); return { id, value, adapter: 'isolated-demo', series: value.series }; }
    ownImport(user, id) { this.sales(user); const r = this.state.imports[id]; if (!r || r.owner !== user.id)
        fail('导入记录无访问权限。', 403); return r; }
    async update(user, body) { const r = this.ownImport(user, body.id); if (body.values) {
        const next = { ...r.current };
        for (const field of keyFields)
            if (typeof body.values[field] === 'string' && next[field] !== body.values[field]) {
                r.changes.push({ field, previous: next[field], value: body.values[field], at: this.now().toISOString(), actor: user.id });
                next[field] = body.values[field];
                r.matched = false;
                r.acquired = false;
            }
        r.current = next;
    } if (body.authorized === true)
        r.authorized = true; if (body.acquire) {
        if (!r.authorized)
            fail('请先确认已取得医院影像访问授权。', 403);
        if (body.fail)
            fail('影像获取失败，请重试或人工上传。', 503);
        if (!body.series?.length || body.series.some(s => !r.original.series.includes(s)))
            fail('请选择有效检查序列。');
        r.acquired = true;
        r.selectedSeries = body.series;
        r.matched = false;
    } if (body.match) {
        if (!r.acquired)
            fail('尚未获取影像。');
        if (keyFields.some(k => r.current[k] !== r.original[k]))
            fail('修改后的身份/检查与原影像不一致，请恢复原值或转人工核对。', 409);
        r.matched = true;
    } this.audit(user, 'import-updated', r.id, r.matched ? 'matched' : 'pending'); await this.persist(this.state); return { value: r.current, matched: r.matched, acquired: r.acquired, changes: r.changes.length }; }
    async receipt(user, body) { const r = this.ownImport(user, body.id); if (!r.acquired || !r.matched)
        fail('影像与患者/检查尚未核对一致。', 409); const receipt = randomBytes(24).toString('hex'); const reference = { id: r.id, owner: user.id }; this.receipts.set(receipt, reference); (this.state.receipts ??= {})[receipt] = reference; this.audit(user, 'import-checked', r.id); await this.persist(this.state); return { receipt, source: { mode: r.mode, importId: r.id, adapter: 'isolated-demo', original: { ...r.original, identityNumber: undefined }, changes: r.changes.filter(c => c.field !== 'identityNumber'), matched: true, actor: user.id } }; }
    validateReceipt(user, order) { const r = this.receipts.get(order.importReceipt), i = r && this.state.imports[r.id]; if (!r || r.owner !== user.id || !i?.matched || i.current.patientName !== order.patientName || i.current.hospitalId !== order.hospitalId || order.patientSex && i.current.sex !== order.patientSex)
        fail('导入凭证已失效或患者/医院已变化，请重新核对。', 409); return i; }
    async sample(user) { this.permitted(user); const id = 'V31-ACCEPT-' + user.id.slice(0, 8); this.state.samples[id] ??= { id, owner: user.id, status: '已完成', completedAt: new Date(this.now().getFullYear(), this.now().getMonth(), 2, 10, 21).toISOString(), hospital: '隔离验收医院', patientName: '合成患者', sex: '女', identityNumber: '000000000000000000', surgery: '颌面数字模型展示', published: true, imageApproved: true, allowedPhones: ['13900000001'], dataOrigin: 'isolated-acceptance', artifact: { id: 'preview-' + id, name: '已批准的隔离展示图', stage: '三维重建', status: '审核通过', kind: 'image', version: '批准展示快照' } }; this.audit(user, 'sample-enabled', id); await this.persist(this.state); return this.list(user); }
    list(user) { this.sales(user); return Object.values(this.state.samples).filter(o => o.owner === user.id).map(({ identityNumber, allowedPhones, ...o }) => o); }
    order(user, id) { this.sales(user); const o = this.state.samples[id]; if (!o || o.owner !== user.id)
        fail('无订单成果访问权限。', 403); return o; }
    artifacts(user, id) { const o = this.state.samples[id]; if (!o)
        return []; this.order(user, id); return o.published ? [o.artifact] : []; }
    async share(user, body, origin) { const o = this.order(user, body.orderId); if(body.stage&&(o.artifact.stage!==body.stage||o.artifact.id!==body.resultId||o.artifact.version!==body.resultVersion))fail('阶段或成果版本不匹配。',409); if (!o.published)
        fail('暂无允许发布的成果。'); let r = Object.values(this.state.shares).find(s => s.orderId === o.id && s.owner === user.id && !s.revoked); if (!r) {
        const token = randomBytes(32).toString('hex');
        r = { token, orderId: o.id, resultId:o.artifact.id,resultVersion:o.artifact.version,stage:o.artifact.stage, owner: user.id, createdAt: this.now().toISOString(), revoked: false };
        this.state.shares[token] = r;
        this.audit(user, 'share-created', o.id);
        await this.persist(this.state);
    } return { url: origin + '/order-results?token=' + r.token, token: r.token, allowedPhoneHint: '仅预授权的医生或患者手机号可访问。' }; }
    async revoke(user, token) { const r = this.state.shares[token]; if (!r || r.owner !== this.sales(user).id)
        fail('无撤销权限。', 403); r.revoked = true; this.audit(user, 'share-revoked', r.orderId); await this.persist(this.state); return { ok: true }; }
    publicOrder(token) { const s = this.state.shares[token], o = s && this.state.samples[s.orderId]; if (!s || s.revoked || !o?.published||s.resultId&&s.resultId!==o.artifact.id||s.resultVersion&&s.resultVersion!==o.artifact.version)
        fail('分享不可用或已撤销。', 403); return o; }
    async code(token, phone) { this.publicOrder(token); return this.proofs.send('share:' + token, phone, +this.now()); }
    async verify(token, phone, code) { const o = this.publicOrder(token), r = this.proofs.verify('share:' + token, phone, code, +this.now()); if (!o.allowedPhones.includes(phone)) {
        this.audit(null, 'share-denied', o.id);
        await this.persist(this.state);
        fail('该手机号未获此订单成果访问授权。', 403);
    } this.audit({ id: phone.replace(/(\d{3})\d{4}/, '$1****') }, 'share-viewed', o.id); await this.persist(this.state); return { proof: r.proof, artifact: o.artifact, patient: '合成患者', orderId: o.id }; }
    publicImage(token, proof) { const p = this.proofs.check('share:' + token, proof, +this.now()), o = this.publicOrder(token); if (!o.allowedPhones.includes(p.phone))
        fail('无成果访问权限。', 403); return this.image; }
    projection(user, rows) { this.sales(user); this.projections.set(user.id, (rows || []).filter(o => o.status === '已完成' && o.ownerSalesId === user.id).map(o => ({ id: String(o.id), owner: user.id, hospital: String(o.hospital || ''), patientName: String(o.patientName || ''), completedAt: o.completedAt, status: '已完成', issues: ['资料待补充'], dataOrigin: 'local-order-projection' }))); return { ok: true }; }
    exportList(user, month) { this.permitted(user); if (!/^\d{4}-\d{2}$/.test(month))
        fail('请选择有效月份。'); return [...(this.projections.get(user.id) || []).filter(o => monthOf(o.completedAt) === month), ...this.list(user).filter(o => o.dataOrigin!=='isolated-acceptance' && o.status === '已完成' && monthOf(o.completedAt) === month).map(o => ({ ...o, issues: !o.imageApproved ? ['资料待补充'] : [] }))]; }
    exportCode(user) { this.permitted(user); return this.proofs.send('export:' + user.id, user.phone, +this.now()); }
    exportVerify(user, code) { this.permitted(user); return this.proofs.verify('export:' + user.id, user.phone, code, +this.now()); }
    async export(user, body) { this.permitted(user);  if (!Array.isArray(body.ids) || !body.ids.length || new Set(body.ids).size !== body.ids.length)
        fail('请选择有效订单。'); const eligible = this.exportList(user, body.month); const rows = body.ids.map(id => { const row = eligible.find(o => o.id === id); if (!row || row.issues.length)
        fail('选择包含未授权或资料不完整的订单。', 403); const o = this.order(user, id); if (!o.identityNumber || !o.sex || !o.imageApproved || !this.image)
        fail('缺少医保必填资料或批准图片。', 422); return { ...o, image: this.image }; }); const bytes = insuranceXlsx(rows); this.audit(user, 'insurance-export', body.ids.join(','), `month=${body.month}; count=${rows.length}`); await this.persist(this.state); return bytes; }
}
