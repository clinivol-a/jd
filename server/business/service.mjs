import {linkedInsuranceRows} from './linkedInsurance.mjs';
import { ShareRecords } from './shareRecords.mjs';
import { approvedDemoChain } from './resultCatalog.mjs';
import { validIdentity } from '../../src/sales/patientRules.mjs';
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
    constructor({ state = { imports: {}, patients: {}, shares: {}, samples: {}, audit: [] }, key = randomBytes(32), image, now = () => new Date(), persist = async () => { }, resultImage, resultModel, sharedCatalog, linkedResultImage, demoShareCodes = false } = {}) { this.sharedCatalog=sharedCatalog; this.linkedResultImage=linkedResultImage; this.demoShareCodes = demoShareCodes === true && process.env.NODE_ENV !== 'production'; this.resultImage = resultImage; this.resultModel = resultModel; this.state = state; this.key = key; this.image = image; this.now = now; this.persist = persist; this.proofs = new InviteProof(); this.receipts = new Map(Object.entries(this.state.receipts || {})); this.projections = new Map(); this.state.orders ??= {}; this.scopes = new Map(); this.shareRecords=new ShareRecords(this); }
    sales(user) {
        if (!user || user.role !== 'sales' || user.status !== 'approved')
            fail('请使用已审核的销售账号。', 403);
        return user;
    }
    permitted(user) {
        this.sales(user);
        if (!user.permissions?.includes('insurance.export'))
            fail('无医保资料导出权限。', 403);
    }
    audit(user, type, target, detail = '') { this.state.audit.push({ id: randomUUID(), at: this.now().toISOString(), actor: user?.id || 'authorized-viewer', type, target, detail }); }
    seal(value) { const iv = randomBytes(12), c = createCipheriv('aes-256-gcm', this.key, iv); return [iv.toString('base64'), Buffer.concat([c.update(JSON.stringify(value)), c.final()]).toString('base64'), c.getAuthTag().toString('base64')].join('.'); }
    unseal(value) { const [iv, body, tag] = value.split('.').map(s => Buffer.from(s, 'base64')), d = createDecipheriv('aes-256-gcm', this.key, iv); d.setAuthTag(tag); return JSON.parse(Buffer.concat([d.update(body), d.final()]).toString()); }
    validatePatient(user, order) {
        this.sales(user);
        if (!order.insuranceConsent)
            return;
        const p = this.state.patients[order.patientIdentityRef];
        if (!p || p.owner !== user.id || this.unseal(p.record).sex !== order.patientSex)
            fail('医保资料凭证无效或无访问权限。', 403);
    }
    async patient(user, body) {
        this.sales(user);
        if (!['男', '女'].includes(body.sex) || !validIdentity(body.identityNumber))
            fail('请在授权核验后补齐性别和18位证件信息。');
        const ref = randomUUID();
        this.state.patients[ref] = { owner: user.id, record: this.seal({ identityNumber: body.identityNumber, sex: body.sex }), source: 'isolated-demo-verification' };
        this.audit(user, 'patient-authorized', ref);
        await this.persist(this.state);
        return { patientIdentityRef: ref, patientSex: body.sex, insuranceConsent: true };
    }
    async start(user, body) {
        this.sales(user);
        if (!['report', 'pacs'].includes(body.mode))
            fail('无效导入方式。');
        if (body.mode === 'report' && (!Array.isArray(body.photos) || body.photos.length !== 2 || body.photos.some(f => !/^image\/(png|jpeg|webp)$/.test(f.type) || !Number.isFinite(f.size) || f.size > 20 * 1024 * 1024 || !/^data:image\/(png|jpeg|webp);base64,/.test(f.content || '') || f.content.length > 28 * 1024 * 1024)))
            fail('请上传两张有效的报告/患者资料照片。');
        if (body.hospital && !['H-A', 'H-B', 'H-C', 'demo-hospital', 'h1', 'unconnected'].includes(body.hospital))
            fail('医院未获得当前隔离连接授权。', 403);
        if (body.mode === 'pacs' && body.hospital === 'unconnected')
            fail('该医院尚未建立授权连接。', 503);
        if (body.fail)
            fail('隔离连接获取失败，可重试或转人工。', 503);
        if (body.mode === 'report' && body.photos.some(f => { const b = Buffer.from(f.content.split(',')[1], 'base64'); return !b.length || b.length > 20 * 1024 * 1024 || !(f.type === 'image/png' && b[0] === 137 && b.subarray(1, 4).toString() === 'PNG' || f.type === 'image/jpeg' && b[0] === 255 && b[1] === 216 || f.type === 'image/webp' && b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP'); }))
            fail('照片内容与格式不符。');
        const value = { patientName: '沈嘉宁', sex: '女', identityNumber: '11010519491231002X', hospitalId: body.hospital || 'demo-hospital', examNo: 'LOCAL-CT-20261116-01', examDate: this.now().toISOString().slice(0, 10), bodyPart: '颌面部', modality: 'CT', series: ['薄层轴位', '骨窗重建'], qrSource: 'isolated-hospital-adapter', dataOrigin: 'isolated-demo' };
        const id = randomUUID();
        this.state.imports[id] = { id, owner: user.id, mode: body.mode, original: value, current: value, photos: body.photos?.map(({ content, ...f }) => f), actor: user.id, changes: [], matched: false, authorized: false, acquired: false };
        this.audit(user, 'import-started', id, body.mode);
        await this.persist(this.state);
        return { id, value, adapter: 'isolated-demo', series: value.series };
    }
    ownImport(user, id) {
        this.sales(user);
        const r = this.state.imports[id];
        if (!r || r.owner !== user.id)
            fail('导入记录无访问权限。', 403);
        return r;
    }
    async update(user, body) {
        const r = this.ownImport(user, body.id);
        if (body.values) {
            const next = { ...r.current };
            for (const field of keyFields)
                if (typeof body.values[field] === 'string' && next[field] !== body.values[field]) {
                    r.changes.push({ field, previous: next[field], value: body.values[field], at: this.now().toISOString(), actor: user.id });
                    next[field] = body.values[field];
                    r.matched = false;
                    r.acquired = false;
                }
            r.current = next;
        }
        if (body.authorized === true)
            r.authorized = true;
        if (body.acquire) {
            if (!r.authorized)
                fail('请先确认已取得医院影像访问授权。', 403);
            if (body.fail)
                fail('影像获取失败，请重试或人工上传。', 503);
            if (!body.series?.length || body.series.some(s => !r.original.series.includes(s)))
                fail('请选择有效检查序列。');
            r.acquired = true;
            r.selectedSeries = body.series;
            r.matched = false;
        }
        if (body.match) {
            if (!r.acquired)
                fail('尚未获取影像。');
            if (keyFields.some(k => r.current[k] !== r.original[k]))
                fail('修改后的身份/检查与原影像不一致，请恢复原值或转人工核对。', 409);
            r.matched = true;
        }
        this.audit(user, 'import-updated', r.id, r.matched ? 'matched' : 'pending');
        await this.persist(this.state);
        return { value: r.current, matched: r.matched, acquired: r.acquired, changes: r.changes.length };
    }
    async receipt(user, body) {
        const r = this.ownImport(user, body.id);
        if (!r.acquired || !r.matched)
            fail('影像与患者/检查尚未核对一致。', 409);
        const receipt = randomBytes(24).toString('hex');
        const reference = { id: r.id, owner: user.id };
        this.receipts.set(receipt, reference);
        (this.state.receipts ??= {})[receipt] = reference;
        this.audit(user, 'import-checked', r.id);
        await this.persist(this.state);
        return { receipt, source: { mode: r.mode, importId: r.id, adapter: 'isolated-demo', original: { ...r.original, identityNumber: undefined }, changes: r.changes.filter(c => c.field !== 'identityNumber'), matched: true, actor: user.id } };
    }
    validateReceipt(user, order) {
        const r = this.receipts.get(order.importReceipt), i = r && this.state.imports[r.id];
        if (!r || r.owner !== user.id || !i?.matched || i.current.patientName !== order.patientName || i.current.hospitalId !== order.hospitalId || order.patientSex && i.current.sex !== order.patientSex)
            fail('导入凭证已失效或患者/医院已变化，请重新核对。', 409);
        return i;
    }
    async sample(user) { this.permitted(user); const id = 'V31-ACCEPT-' + user.id.slice(0, 8); this.state.samples[id] ??= { id, owner: user.id, status: '已完成', completedAt: new Date(this.now().getFullYear(), this.now().getMonth(), 2, 10, 21).toISOString(), hospital: '隔离验收医院', patientName: '合成患者', sex: '女', identityNumber: '000000000000000000', surgery: '颌面数字模型展示', published: true, imageApproved: true, allowedPhones: ['13900000001'], dataOrigin: 'isolated-acceptance', artifact: { id: 'preview-' + id, name: '已批准的隔离展示图', stage: '三维重建', status: '审核通过', kind: 'image', version: '批准展示快照' } }; this.audit(user, 'sample-enabled', id); await this.persist(this.state); return this.list(user); }
    list(user) { this.sales(user); return Object.values(this.state.samples).filter(o => o.owner === user.id).map(({ identityNumber, allowedPhones, ...o }) => o); }
    order(user, id) {
        this.sales(user);
        const o = this.state.orders[id] || this.state.samples[id];
        if (!o || o.owner !== user.id || this.state.orders[id] && this.scopes.has(user.id) && !this.scopes.get(user.id).has(id))
            fail('无订单成果访问权限。', 403);
        return o;
    }
    artifacts(user, id) { const o = this.state.orders[id] || this.state.samples[id]; if (!o)
        return []; this.order(user, id); return (o.artifacts || [o.artifact]).filter(a => o.published && a && a.status === '审核通过' && (!a.reviewStatus||a.reviewStatus==='approved') && (!a.publishStatus || a.publishStatus === 'published') && this.previewAvailable(o,a)); }
    previewAvailable(o,a){try{return !!this.imageFor(o,a)?.length&&(!a.previewKey||!!this.resultModel)}catch{return false}}
    artifact(o, id, version) { return (o.artifacts || [o.artifact]).find(a => a && (!id || a.id === id) && (!version || a.version === version)); }
    imageFor(o, a) { return a?.previewKey && this.resultImage ? this.resultImage(a.previewKey) : this.image; }
    async share(user, body, origin) { const o = this.order(user, body.orderId), a = this.artifact(o, body.resultId, body.resultVersion); if (!a || body.stage && a.stage !== body.stage)
        fail('阶段或成果版本不匹配。', 409); if (!this.artifacts(user, o.id).includes(a))
        fail('暂无允许发布的成果。'); let r = Object.values(this.state.shares).find(s => s.orderId === o.id && s.resultId === a.id && s.resultVersion === a.version && s.owner === user.id && !s.revoked); if (!r) {
        const token = randomBytes(32).toString('hex');
        r = { id:randomUUID(), token, orderId: o.id, resultId: a.id, resultVersion: a.version, stage: a.stage, owner: user.id, createdAt: this.now().toISOString(), revoked: false };
        this.shareRecords.enrich(r,user,o,a);
        this.state.shares[token] = r;
        this.audit(user, 'share-created', a.id);
        await this.persist(this.state);
    } else {this.shareRecords.enrich(r,user,o,a);await this.persist(this.state);} return { url: origin + '/order-results?token=' + r.token, token: r.token, name: a.name, stats:this.shareRecords.summary(r) }; }
    async revoke(user, token) {
        const r = this.state.shares[token];
        if (!r || r.owner !== this.sales(user).id)
            fail('无撤销权限。', 403);
        r.revoked = true;
        this.audit(user, 'share-revoked', r.orderId);
        await this.persist(this.state);
        return { ok: true };
    }
    publicOrder(token) { const s = this.state.shares[token], o = s && (this.state.orders[s.orderId] || this.state.samples[s.orderId]), a = o && this.artifact(o, s.resultId, s.resultVersion); if (!s || s.revoked || !o?.published || !a || a.status !== '审核通过' || a.reviewStatus&&a.reviewStatus!=='approved' || a.publishStatus && a.publishStatus !== 'published'||!this.previewAvailable(o,a))
        fail('分享不可用或已撤销。', 403); return o; }
    async code(token, phone) { this.publicOrder(token); return this.proofs.send('share:' + token, phone, +this.now()); }
    async verify(token, phone, code, visitId) {
        const o=this.publicOrder(token);
        const pending=this.demoShareCodes&&/^\d+$/.test(String(code))?this.proofs.codes.get('share:'+token+':'+phone):null;
        let r;
        try {r=this.proofs.verify('share:'+token,phone,pending?pending.code:code,+this.now());}
        catch(e){await this.shareRecords.failed(token,visitId,phone,code);throw e;}
        if(!o.allowedPhones.includes(phone)){
            this.audit(null,'share-denied',o.id);await this.shareRecords.failed(token,visitId,phone,code,true);await this.persist(this.state);fail('该手机号未获此订单成果访问授权。',403);
        }
        this.shareRecords.verified(token,visitId,phone,r.proof);
        this.audit(null,'share-verified',o.id);await this.persist(this.state);
        return {proof:r.proof,artifact:this.artifact(o,this.state.shares[token].resultId,this.state.shares[token].resultVersion),patient:o.patientName,orderId:o.id};
    }
    publicImage(token, proof) {
        const p = this.proofs.check('share:' + token, proof, +this.now()), o = this.publicOrder(token);
        if (!o.allowedPhones.includes(p.phone))
            fail('无成果访问权限。', 403);
        const bytes=this.imageFor(o,this.artifact(o,this.state.shares[token].resultId,this.state.shares[token].resultVersion));if(bytes?.length)this.shareRecords.delivered(token,proof,'image');return bytes;
    }
    publicModel(token, proof) { this.publicImage(token, proof); const o = this.publicOrder(token), a = this.artifact(o, this.state.shares[token].resultId, this.state.shares[token].resultVersion); if (!a?.previewKey || !this.resultModel)
        fail('当前成果未提供三维预览。', 404); const model=this.resultModel(a.previewKey);if(model?.positions?.length)this.shareRecords.delivered(token,proof,'model');return model; }
    async projection(user, rows) {
        this.sales(user);
        const projected = [];
        this.scopes.set(user.id, new Set((rows || []).filter(o => o.ownerSalesId === user.id).map(o => o.id)));
        for (const row of rows || []) {
            if (row.ownerSalesId !== user.id)
                continue;
            const chain = approvedDemoChain(user, row);
            if (chain) {
                const old = this.state.orders[row.id];
                this.state.orders[row.id] = { id: row.id, businessNo:row.businessNo||row.id, owner: user.id, status: row.status, completedAt: row.completedAt, hospital: row.hospital, patientName: row.patientName, expectedRecipient:row.expectedRecipient?.id&&row.expectedRecipient.id===row.doctorId?{id:row.expectedRecipient.id,name:String(row.expectedRecipient.name||'')}:null, projectId: chain.projectId, sex: chain.sex, identityRecord: old?.identityRecord || this.seal({ identityNumber: chain.identityNumber }), surgery: row.name, standardMapped: false, allowedPhones: ['13900000001'], published: true, imageApproved: true, artifacts: chain.artifacts, dataOrigin: 'isolated-business-fixture' };
            }
            else if (this.state.orders[row.id]?.owner === user.id) {
                this.state.orders[row.id].published = false;
            }
            if (row.status === '已完成')
                projected.push({ id: String(row.id), businessNo:row.businessNo||'-', surgery:row.name||'', sex:row.patientSex||'', owner: user.id, hospital: String(row.hospital || ''), patientName: String(row.patientName || ''), completedAt: row.completedAt, status: row.status, issues: ['患者性别、身份证号及已审核成果'], dataOrigin: 'local-order-projection' });
        }
        this.projections.set(user.id, projected);
        await this.persist(this.state);
        return { ok: true };
    }
    exportList(user, month) { this.permitted(user); if (!/^\d{4}-\d{2}$/.test(month))
        fail('请选择有效月份。'); const linked=linkedInsuranceRows(this,user);if(linked)return linked.filter(o=>monthOf(o.completedAt)===month).map(({identityNumber,image,...o})=>({...o,maskedIdentity:identityNumber?identityNumber.slice(0,6)+'********'+identityNumber.slice(-4):'',image:image?.length?'/api/business-v31/insurance-image?orderId='+encodeURIComponent(o.id)+'&resultId='+encodeURIComponent(o.resultId)+'&resultVersion='+encodeURIComponent(o.resultVersion):''})).sort((a,b)=>Date.parse(b.completedAt)-Date.parse(a.completedAt)); const map = new Map((this.projections.get(user.id) || []).filter(o => monthOf(o.completedAt) === month).map(o => [o.id, o])); for (const o of [...Object.values(this.state.orders), ...Object.values(this.state.samples)]) {
        if (o.owner !== user.id || this.state.orders[o.id] && this.scopes.has(user.id) && !this.scopes.get(user.id).has(o.id) || o.dataOrigin === 'isolated-acceptance' || o.status !== '已完成' || monthOf(o.completedAt) !== month)
            continue;
        const a = this.artifacts(user, o.id)[0], identity = o.identityRecord ? this.unseal(o.identityRecord).identityNumber : o.identityNumber;
        const { identityNumber, identityRecord, allowedPhones, ...safe } = o;
        map.set(o.id, { ...safe, maskedIdentity: identity ? identity.slice(0, 6) + '********' + identity.slice(-4) : '', image: a ? '/api/business-v31/image?orderId=' + encodeURIComponent(o.id) + '&resultId=' + encodeURIComponent(a.id) : '', resultId: a?.id, resultVersion: a?.version, issues: [...(!o.sex ? ['患者性别'] : []), ...(!identity ? ['身份证号'] : []), ...(!o.surgery ? ['手术项目名称'] : []), ...(!a || !o.imageApproved ? ['已审核成果图片'] : [])] });
    } return [...map.values()].sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt)); }
    insuranceImage(user,id,resultId,resultVersion){this.permitted(user);const row=linkedInsuranceRows(this,user)?.find(o=>o.id===id&&o.resultId===resultId&&o.resultVersion===resultVersion);if(!row?.image?.length)fail('无已审核成果预览权限。',403);return row.image;}
    exportCode(user) { this.permitted(user); return this.proofs.send('export:' + user.id, user.phone, +this.now()); }
    exportVerify(user, code) { this.permitted(user); return this.proofs.verify('export:' + user.id, user.phone, code, +this.now()); }
    async export(user, body) {
        this.permitted(user);
        if (!Array.isArray(body.ids) || !body.ids.length || new Set(body.ids).size !== body.ids.length)
            fail('请选择有效订单。');
        const eligible = this.exportList(user, body.month);
        const linked=linkedInsuranceRows(this,user);
        if(linked){const rows=body.ids.map(id=>{const row=linked.find(o=>o.id===id&&monthOf(o.completedAt)===body.month);if(!row||row.issues.length)fail('订单'+(row?.businessNo||'-')+'：'+(row?.issues.join('、')||'无访问权限'),422);return row});const bytes=insuranceXlsx(rows);this.audit(user,'insurance-export',body.ids.join(','),`month=${body.month}; count=${rows.length}`);await this.persist(this.state);return bytes;}
        const rows = body.ids.map(id => {
            const row = eligible.find(o => o.id === id);
            if (!row || row.issues.length)
                fail('订单' + id + '：' + (row?.issues.join('、') || '无访问权限'), 422);
            const o = this.order(user, id);
            if (!(o.identityNumber || o.identityRecord) || !o.sex || !o.imageApproved || !this.image)
                fail('缺少医保必填资料或批准图片。', 422);
            const a = this.artifacts(user, o.id)[0];
            return { ...o, identityNumber: o.identityRecord ? this.unseal(o.identityRecord).identityNumber : o.identityNumber, image: this.imageFor(o, a) };
        });
        if (rows.some(o => !o.image?.length))
            fail('对应成果图片暂不可用，请稍后重试。', 422);
        const bytes = insuranceXlsx(rows);
        this.audit(user, 'insurance-export', body.ids.join(','), `month=${body.month}; count=${rows.length}`);
        await this.persist(this.state);
        return bytes;
    }
}
