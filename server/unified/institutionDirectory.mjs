import { randomUUID } from 'node:crypto';
import { mkdirSync, existsSync, readFileSync, writeFileSync, renameSync, openSync, closeSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import fixtureDetails from './doctor-fixture-details.json' with {type:'json'};
import {fixtureBytes} from '../../src/sales/orderFixtures.mjs';
export class DirectoryFailure extends Error {
    constructor(message, status = 400) { super(message); this.status = status; }
}
const clone = v => structuredClone(v);
const text = (value, label, max = 120) => { if (typeof value !== 'string' || !value.trim() || value.length > max)
    throw new DirectoryFailure(`请填写有效${label}。`); return value.trim(); };
/** Local shared master data. Existing IDs survive; no joins or merges by display name. */
export class InstitutionDirectory {
    constructor({ directory, seed, now = Date.now, invitationProvider = () => ({ leads: [], files: [] }) } = {}) { this.invitationProvider = invitationProvider; this.directory = directory; this.seed = seed; this.now = now; const initial = seed(); this.state = { schema: 1, source: 'isolated-institution-directory', hospitals: clone(initial.hospitals), doctors: clone(initial.doctors), salesScopes: clone(initial.salesScopes), files: [], events: [] }; if (directory)
        mkdirSync(directory, { recursive: true, mode: 0o700 }); this.transaction(() => { for (const h of this.state.hospitals) {
        h.departmentRecords ||= (h.departments || []).map((name, i) => ({ id: `DEP-${h.id}-${i + 1}`, hospitalId: h.id, name, status: '已启用', version: 1 }));
        h.version ||= 1;
        h.region ||= '';
        h.contact ||= '';
    } for (const d of this.state.doctors)
        d.version ||= 1;
        this.completeFixtureStubs(); }); }
    completeFixtureStubs(){
      for(const entry of fixtureDetails.rows){
        const row=this.state.doctors.find(d=>d.id===entry.doctor.id),fixture=entry.doctor;
        if(!row||row.version!==1||row.name!==fixture.name||row.hospitalId!==fixture.hospitalId||row.phone||this.state.events.some(e=>e.objectId===row.id))continue;
        const salesId=row.salesId;if(!salesId)continue;
        const replace=value=>JSON.parse(JSON.stringify(value).replaceAll('__fixture_sales__',salesId));
        const original=replace(fixture);row.seedOrigin='existing-sales-synthetic-fixtures';
        for(const key of ['phone','title','certificate','source','submissionMode','submittedBy','createdBy','invitedBy','updatedAt'])if(original[key]!==undefined)row[key]=original[key];
        row.materials=original.materials.map(file=>({...file,uploadedByName:file.uploadedByName||this.seed().people.find(p=>p.id===salesId)?.name,storage:'directory'}));
        for(const file of row.materials)this.state.files.push({...file,owner:salesId,content:Buffer.from(fixtureBytes(1)).toString('base64')});
        for(const event of replace(entry.events))this.state.events.push({...event,objectId:row.id,reason:event.detail,noteSource:event.reviewNoteSource,source:'existing-sales-synthetic-fixtures'});
      }
    }
    reload() { if (this.directory && existsSync(join(this.directory, 'state.json'))) {
        const value = JSON.parse(readFileSync(join(this.directory, 'state.json'), 'utf8'));
        if (value.source !== 'isolated-institution-directory' || value.schema !== 1)
            throw Error('Unexpected institution directory');
        this.state = value;
        this.state.files ||= [];
    } return this.state; }
    persist() { if (!this.directory)
        return; const f = join(this.directory, 'state.json'); writeFileSync(f + '.tmp', JSON.stringify(this.state, null, 2), { mode: 0o600 }); renameSync(f + '.tmp', f); }
    transaction(fn) { let lock; const before = clone(this.state); try {
        if (this.directory) {
            try {
                lock = openSync(join(this.directory, 'write.lock'), 'wx', 0o600);
            }
            catch (e) {
                if (e.code === 'EEXIST')
                    throw new DirectoryFailure('机构资料正在更新，请重试。', 409);
                throw e;
            }
        }
        this.reload();
        const result = fn();
        this.persist();
        return clone(result);
    }
    catch (e) {
        this.state = before;
        throw e;
    }
    finally {
        if (lock !== undefined) {
            closeSync(lock);
            unlinkSync(join(this.directory, 'write.lock'));
        }
    } }
    management(actor, permission = 'people:manage') { if (!actor || actor.status !== 'approved' || !['super_admin', 'admin'].includes(actor.role) || !actor.permissions?.includes(permission))
        throw new DirectoryFailure('无此机构管理权限。', 403); }
    scope(actor, id) { if (actor.role !== 'super_admin' && !actor.hospitalIds?.includes(id))
        throw new DirectoryFailure('无此医院管理权限。', 403); }
    sales(actor) { if (actor?.role !== 'sales' || actor.status !== 'approved' || !actor.permissions?.includes('sales:landing'))
        throw new DirectoryFailure('请使用有效销售账号。', 403); return this.state.salesScopes[actor.id] || []; }
    current(row, version) { if (row.version !== version)
        throw new DirectoryFailure('资料已更新，请刷新后重试。', 409); }
    event(actor, title, objectId, before, after, reason = '') { this.state.events.push({ id: randomUUID(), title, objectId, actorId: actor.id, actor: actor.name, at: new Date(this.now()).toISOString(), category: '机构与人员', result: '成功', reason, before: clone(before), after: clone(after), source: 'isolated-institution-directory' }); }
    snapshot() { this.reload(); this.syncInvitations(); const seed = this.seed(), hospitals = this.state.hospitals.map(h => ({ ...clone(h), departments: h.departmentRecords.filter(d => d.status === '已启用').map(d => d.name), managementEditable: true })); return { ...seed, hospitals, doctors: clone(this.state.doctors).map(d=>({...d,salesName:seed.people.find(p=>p.id===d.salesId)?.name})), salesScopes: clone(this.state.salesScopes), events: clone(this.state.events) }; }
    validLeader(id, hospitalId, region) { const p = this.seed().people.find(p => p.id === id && p.role === '业务组长' && p.status === '已启用' && ['orders:read', 'orders:review', 'tasks:assign'].every(permission => p.permissions?.includes(permission))); return !!(p && (p.scope?.includes(hospitalId) || p.regions?.includes(region) || this.state.hospitals.some(h => h.id === hospitalId && h.leaderId === id))); }
    canSelectDoctor(actor, doctor, hospital, department) { return !!doctor && !!hospital && this.sales(actor).includes(hospital.id) && hospital.status === '已启用' && doctor.status === '审核通过' && doctor.hospitalId === hospital.id && doctor.department === department && hospital.departmentRecords.some(d => d.name === department && d.status === '已启用') && (doctor.salesId === actor.id || doctor.businessAccess === 'hospital' || doctor.allowedSalesIds?.includes(actor.id)); }
    salesSnapshot(actor) { this.reload(); const ids = this.sales(actor), hospitals = this.snapshot().hospitals.filter(h => ids.includes(h.id)), doctors = this.state.doctors.filter(d => ids.includes(d.hospitalId)); return { hospitals, orderDoctors: doctors.filter(d => this.canSelectDoctor(actor, d, this.state.hospitals.find(h => h.id === d.hospitalId), d.department)).map(d => ({ id: d.id, name: d.name, hospitalId: d.hospitalId, department: d.department, departmentId: d.departmentId, status: d.status, orderSelectable: true })), ownDoctors: clone(doctors.filter(d => d.salesId === actor.id || d.createdBy === actor.id || d.invitedBy === actor.id)).map(d=>({...d,salesName:this.seed().people.find(p=>p.id===d.salesId)?.name})), events: clone(this.state.events.filter(e => doctors.some(d => d.id === e.objectId && (d.salesId === actor.id || d.createdBy === actor.id || d.invitedBy === actor.id)))) }; }
    command(actor, { action, id, version, ...input }) {
        if (typeof action !== 'string')
            throw new DirectoryFailure('请选择有效操作。');
        this.management(actor, action.startsWith('doctor-') ? 'doctors:review' : 'people:manage');
        return this.transaction(() => {
            if (action === 'hospital-save') {
                const old = id ? this.state.hospitals.find(h => h.id === id) : null;
                if (id && !old)
                    throw new DirectoryFailure('医院不存在。', 404);
                if (old) {
                    this.scope(actor, id);
                    this.current(old, version);
                }
                else if (actor.role !== 'super_admin')
                    throw new DirectoryFailure('新增医院须由超级管理员维护。', 403);
                const name = text(input.name, '医院名称'), region = text(input.region, '所属区域'), contact = String(input.contact || '').trim();
                const leader = this.seed().people.find(p => p.id === input.leaderId && p.role === '业务组长' && p.status === '已启用' && ['orders:read', 'orders:review', 'tasks:assign'].every(permission => p.permissions?.includes(permission)));
                if (!leader || !(old && this.validLeader(leader.id, old.id, region) || leader.regions?.includes(region)))
                    throw new DirectoryFailure('组长须具备该医院或区域的管理资格。');
                const salesIds = input.salesIds;
                if (!Array.isArray(salesIds) || salesIds.some(sid => !this.seed().people.some(p => p.id === sid && p.role === '销售' && p.status === '已启用')))
                    throw new DirectoryFailure('请选择有效的授权销售。');
                const h = { ...(old || { id: `H-${randomUUID()}`, status: '已启用', departmentRecords: [], departments: [] }), name, region, contact, leaderId: leader.id, version: (old?.version || 0) + 1 };
                const previousSalesIds = Object.entries(this.state.salesScopes).filter(([, ids]) => ids.includes(h.id)).map(([sid]) => sid);
                const before = old ? { ...clone(old), salesIds: previousSalesIds } : null;
                this.state.hospitals = this.state.hospitals.filter(r => r.id !== h.id);
                this.state.hospitals.push(h);
                for (const p of this.seed().people.filter(p => p.role === '销售')) {
                    const scope = this.state.salesScopes[p.id] || [];
                    this.state.salesScopes[p.id] = salesIds.includes(p.id) ? [...new Set([...scope, h.id])] : scope.filter(hid => hid !== h.id);
                }
                this.event(actor, old ? '医院资料已更新' : '医院已创建', h.id, before, { ...h, salesIds }, old ? text(input.reason, '修改原因') : String(input.reason || ''));
                return h;
            }
            const h = this.state.hospitals.find(h => h.id === id || h.departmentRecords.some(d => d.id === id));
            if (action.startsWith('hospital-') || action.startsWith('department-')) {
                if (!h)
                    throw new DirectoryFailure('医院不存在。', 404);
                this.scope(actor, h.id);
                const before = clone(h), reason = text(input.reason, '操作原因');
                if (action === 'hospital-status') {
                    this.current(h, version);
                    h.status = h.status === '已启用' ? '已停用' : '已启用';
                }
                else if (action === 'hospital-leader') {
                    this.current(h, version);
                    if (!this.validLeader(input.leaderId, h.id, h.region))
                        throw new DirectoryFailure('组长不具备相应医院或区域资格。');
                    if (h.leaderId === input.leaderId)
                        throw new DirectoryFailure('组长未发生变化。');
                    h.leaderId = input.leaderId;
                }
                else if (action === 'department-save') {
                    const d = h.departmentRecords.find(d => d.id === input.departmentId);
                    if (input.departmentId && !d)
                        throw new DirectoryFailure('科室不属于该医院。', 404);
                    if (d)
                        this.current(d, version);
                    else
                        this.current(h, version);
                    const name = text(input.name, '科室名称');
                    if (h.departmentRecords.some(r => r.name === name && r.id !== d?.id))
                        throw new DirectoryFailure('该医院已有同名科室。', 409);
                    if (d) {
                        d.previousNames = [...new Set([...(d.previousNames || []), d.name])];
                        d.name = name;
                        d.version++;
                        for (const doctor of this.state.doctors.filter(doc => doc.hospitalId === h.id && (doc.departmentId === d.id || !doc.departmentId && doc.department === before.departmentRecords.find(x => x.id === d.id)?.name))) {
                            doctor.departmentId = d.id;
                            doctor.department = name;
                            doctor.version++;
                        }
                    }
                    else
                        h.departmentRecords.push({ id: `DEP-${randomUUID()}`, hospitalId: h.id, name, status: '已启用', version: 1 });
                }
                else if (action === 'department-status') {
                    const d = h.departmentRecords.find(d => d.id === id);
                    if (!d)
                        throw new DirectoryFailure('科室不存在。', 404);
                    this.current(d, version);
                    d.status = d.status === '已启用' ? '已停用' : '已启用';
                }
                else
                    throw new DirectoryFailure('不支持此机构操作。', 404);
                h.departments = h.departmentRecords.filter(d => d.status === '已启用').map(d => d.name);
                h.version++;
                this.event(actor, action === 'hospital-leader' ? '医院负责组长变更' : action === 'hospital-status' ? '医院状态已更新' : action === 'department-status' ? '科室状态已更新' : '科室资料已更新', h.id, before, h, reason);
                return h;
            }
            if (['doctor-review','doctor-status','doctor-review-reopen'].includes(action)) {
                const d = this.state.doctors.find(d => d.id === id);
                if (!d)
                    throw new DirectoryFailure('医生档案不存在。', 404);
                this.scope(actor, d.hospitalId);
                this.current(d, version);
                const before = clone(d);
                let reason = '';
                if(action==='doctor-review-reopen'){if(d.status!=='审核退回')throw new DirectoryFailure('档案已更新，请刷新。',409);reason=text(input.reason,'纠正原因');d.status='待审核';}
                else if (action === 'doctor-review') {
                    if (d.status !== '待审核')
                        throw new DirectoryFailure('档案不在待审核状态。', 409);
                    if (!['approved', 'returned'].includes(input.result))
                        throw new DirectoryFailure('审核结果无效。');
                    reason = input.result === 'returned' ? text(input.reason, '退回原因', 1000) : String(input.reason || '').trim();
                    d.status = input.result === 'approved' ? '审核通过' : '审核退回';
                    if (input.result === 'approved' && !input.basis?.trim())throw new DirectoryFailure('请填写书面审批依据。');
                    if (input.result === 'approved')
                        d.salesId = d.createdBy || d.invitedBy || d.salesId;
                    d.reason = input.result === 'returned' ? reason : '';
                    d.reviewNoteSource = reason ? 'reviewer' : 'system-default';
                    d.businessAccess = input.result === 'approved' ? 'hospital' : d.businessAccess;
                }
                else {
                    if (!['审核通过', '已停用'].includes(d.status))
                        throw new DirectoryFailure('只能停用或恢复正式档案。', 409);
                    reason = text(input.reason, '操作原因');
                    if(d.status==='已停用'){const h=this.state.hospitals.find(h=>h.id===d.hospitalId);if(d.qualificationStatus==='invalid'||d.qualificationExpiresAt&&Date.parse(d.qualificationExpiresAt)<this.now()||!h||h.status!=='已启用'||!h.departmentRecords.some(dep=>dep.status==='已启用'&&(d.departmentId?dep.id===d.departmentId:dep.name===d.department)))throw new DirectoryFailure('资质或机构关系需要重新核验，不能直接恢复。',409)}
                    d.status = d.status === '已停用' ? '审核通过' : '已停用';
                }
                d.version++;
                d.updatedAt = new Date(this.now()).toISOString();
                if (action === 'doctor-review') {
                    d.reviewedAt = d.updatedAt;
                    d.reviewedById = actor.id;
                    d.reviewedBy = actor.name;
                }
                this.event(actor, action==='doctor-review-reopen'?'医生档案审核退回已撤销':action === 'doctor-review' ? (d.status === '审核通过' ? '医生档案审核通过' : '医生档案审核退回') : (d.status === '已停用' ? '医生档案已停用' : '医生档案已恢复'), d.id, before, d, reason);
                if (action === 'doctor-review') {
                    const event = this.state.events.at(-1);
                    event.noteSource = d.reviewNoteSource;
                    event.note = reason || '审核通过';
                    if (input.basis?.trim())
                        event.basis = input.basis.trim();
                }
                return d;
            }
            throw new DirectoryFailure('不支持此目录操作。', 404);
        });
    }
    syncInvitations() {
        const records = this.invitationProvider(), pending = (records.leads || []).filter(l => l.phoneVerified && Number.isFinite(Date.parse(l.at)) && !this.state.doctors.some(d => d.invitationLeadId === l.id && d.invitationSubmittedAt === l.at));
        if (!pending.length)
            return;
        this.transaction(() => {
            for (const lead of pending) {
                const h = this.state.hospitals.find(h => h.id === lead.hospitalId && h.status === '已启用' && this.state.salesScopes[lead.owner]?.includes(h.id)), dep = h?.departmentRecords.find(d => d.name === lead.department && d.status === '已启用');
                if (!h || !dep || !/^1[3-9]\d{9}$/.test(lead.phone) || !lead.name?.trim() || !lead.title?.trim() || !lead.certificate?.trim())
                    continue;
                const existing = this.state.doctors.find(d => d.id === 'D-LEAD-' + lead.id || d.phone === lead.phone);
                if (existing && ((existing.salesId !== lead.owner && existing.createdBy !== lead.owner && existing.invitedBy !== lead.owner) || !['草稿', '审核退回'].includes(existing.status)))
                    continue;
                const materials = (lead.materials || []).filter(m => records.files?.some(f => f.id === m.id && f.owner === lead.owner && f.phone === lead.phone && f.content));
                if (!materials.some(m => m.category === 'identity') || !materials.some(m => m.category === 'practice'))
                    continue;
                const before = existing ? clone(existing) : null, d = { ...existing, id: existing?.id || 'D-LEAD-' + lead.id, name: lead.name, phone: lead.phone, hospitalId: h.id, departmentId: dep.id, department: dep.name, title: lead.title, certificate: lead.certificate, materials: clone(materials), status: '待审核', salesId: null, createdBy: lead.owner, invitedBy: lead.owner, source: lead.submissionMode === 'sales-assisted' ? '销售建档' : '医生自主建档', submissionMode: lead.submissionMode, submittedBy: lead.submittedBy, phoneVerified: true, invitationLeadId: lead.id, invitationSubmittedAt: lead.at, updatedAt: lead.at, version: (existing?.version || 0) + 1, reason: '' };
                this.state.doctors = this.state.doctors.filter(row => row.id !== d.id);
                this.state.doctors.push(d);
                if(!existing){this.event({id:lead.submissionMode==='sales-assisted'?lead.owner:'invite-'+lead.id,name:lead.submittedBy||lead.name},'医生档案已创建',d.id,null,d);this.state.events.at(-1).at=lead.at;}
                this.event({ id: lead.submissionMode === 'sales-assisted' ? lead.owner : 'invite-' + lead.id, name: lead.submittedBy || lead.name }, existing?.status === '审核退回' ? '医生档案已重新提交审核' : '医生档案已提交审核', d.id, before, d);
                this.state.events.at(-1).at = lead.at;
            }
        });
    }
    upload(actor, { file }) { this.sales(actor); if (!file || !['identity', 'practice', 'other'].includes(file.category) || !/^image\/(png|jpeg)$|^application\/pdf$|^text\/plain$/.test(file.type || '') || typeof file.content !== 'string' || !/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(file.content))
        throw new DirectoryFailure('请选择支持的资质文件。'); const bytes = Buffer.from(file.content, 'base64'); if (!bytes.length || bytes.length > 20 * 1024 * 1024)
        throw new DirectoryFailure('请选择20MB以内的非空文件。'); return this.transaction(() => { const f = { id: randomUUID(), owner: actor.id, name: text(file.name, '文件名', 240), type: file.type, category: file.category, size: bytes.length, content: bytes.toString('base64'), uploadedAt: new Date(this.now()).toISOString(), uploadedBy: actor.id, uploadedByName: actor.name, status: 'success', storage: 'directory' }; this.state.files.push(f); const { content, owner, ...meta } = f; return meta; }); }
    ownedFile(actor, meta, old) { const f = this.state.files.find(f => f.id === meta.id && f.owner === actor.id) || this.invitationProvider().files?.find(f => f.id === meta.id && f.owner === actor.id); if (!f) {
        if (old?.materials?.some(m => m.id === meta.id))
            return clone(old.materials.find(m => m.id === meta.id));
        throw new DirectoryFailure('资质文件尚未保存至共享资料服务，请重新上传。', 422);
    } const { content, owner, ...row } = f; return { ...row, status: 'success', storage: row.storage || 'invitation', size: f.size || Buffer.from(f.content, 'base64').length }; }
    file(actor, id) { this.reload(); const d = this.state.doctors.find(d => d.materials?.some(m => m.id === id)); if (actor.role === 'sales') {
        this.sales(actor);
        if (d && d.salesId !== actor.id && d.createdBy !== actor.id && d.invitedBy !== actor.id)
            throw new DirectoryFailure('无此资料访问权限。', 403);
    }
    else {
        this.management(actor, 'doctors:review');
        if (!d)
            throw new DirectoryFailure('资料不存在。', 404);
        this.scope(actor, d.hospitalId);
    } const f = this.state.files.find(f => f.id === id && (actor.role !== 'sales' || f.owner === actor.id)) || this.invitationProvider().files?.find(f => f.id === id && (actor.role !== 'sales' || f.owner === actor.id)); if (!f?.content)
        throw new DirectoryFailure('资料文件未归档或不可用。', 404); return { bytes: Buffer.from(f.content, 'base64'), type: f.type, name: f.name }; }
    saveDoctor(actor, { doctor: input, submit = false, version }) {
        this.sales(actor);
        return this.transaction(() => {
            const old = this.state.doctors.find(d => d.id === input?.id);
            if (old && (old.salesId !== actor.id && old.createdBy !== actor.id && old.invitedBy !== actor.id))
                throw new DirectoryFailure('无此档案编辑权限。', 403);
            if (old) {
                this.current(old, version);
                if (!['草稿', '审核退回'].includes(old.status))
                    throw new DirectoryFailure('当前档案不能编辑。', 409);
            }
            const h = this.state.hospitals.find(h => h.id === input?.hospitalId && h.status === '已启用' && this.sales(actor).includes(h.id)), dep = h?.departmentRecords.find(d => d.name === input.department && d.status === '已启用');
            if (!h || !dep)
                throw new DirectoryFailure('请选择授权医院及有效科室。', 403);
            if (typeof input.id !== 'string' || !input.id || input.id.length > 120)
                throw new DirectoryFailure('档案ID无效。');
            if (!/^1[3-9]\d{9}$/.test(input.phone || ''))
                throw new DirectoryFailure('请填写有效手机号。');
            if (this.state.doctors.some(d => d.phone === input.phone && d.id !== input.id))
                throw new DirectoryFailure('该手机号已有档案，请使用原档案关联。', 409);
            if (submit && (!input.title?.trim() || !input.certificate?.trim() || !input.materials?.some(f => f.category === 'identity' && f.status === 'success') || !input.materials?.some(f => f.category === 'practice' && f.status === 'success')))
                throw new DirectoryFailure('请补齐职称、执业证书编号及身份证明和执业证明。', 422);
            const lead = this.invitationProvider().leads?.find(l => 'D-LEAD-' + l.id === input.id && l.owner === actor.id && l.phone === input.phone && l.phoneVerified);
            if (input.submissionMode === 'invite' && !lead && !old?.invitedBy)
                throw new DirectoryFailure('邀请来源未通过服务端校验。', 403);
            const materials = [...new Map((input.materials || []).map(m => { const stored = this.ownedFile(actor, m, old); return [stored.id, stored]; })).values()];
            if (submit && (!materials.some(f => f.category === 'identity' && f.status === 'success') || !materials.some(f => f.category === 'practice' && f.status === 'success')))
                throw new DirectoryFailure('请上传有效身份证明及执业证明。', 422);
            const d = { id: input.id, name: text(input.name, '医生姓名', 60), phone: input.phone, hospitalId: h.id, departmentId: dep.id, department: dep.name, title: String(input.title || ''), certificate: String(input.certificate || ''), materials, status: submit ? '待审核' : '草稿', salesId: null, createdBy: old?.createdBy || actor.id, source: lead?.submissionMode === 'invite' || old?.source === '医生自主建档' ? '医生自主建档' : '销售建档', submissionMode: lead?.submissionMode || old?.submissionMode || 'sales-assisted', invitedBy: lead ? actor.id : old?.invitedBy || null, submittedBy: lead?.submittedBy || old?.submittedBy || actor.name, version: (old?.version || 0) + 1, createdAt: old?.createdAt || new Date(this.now()).toISOString(), updatedAt: new Date(this.now()).toISOString(), reason: '' };
            this.state.doctors = this.state.doctors.filter(row => row.id !== d.id);
            this.state.doctors.push(d);
            if(!old)this.event(actor,'医生档案已创建',d.id,null,d);
            this.event(actor, submit ? (old?.status === '审核退回' ? '医生档案已重新提交审核' : '医生档案已提交审核') : '医生档案草稿已保存', d.id, old || null, d);
            return d;
        });
    }
}
