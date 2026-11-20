import { randomUUID } from 'node:crypto';
import { mkdirSync, existsSync, readFileSync, writeFileSync, renameSync, openSync, closeSync, unlinkSync, fsyncSync } from 'node:fs';
import { join } from 'node:path';
import { designStages, orderErrors } from '../../src/sales/orderRules.mjs';
import { upgradeKnownSharedDesignFixtures } from '../../src/sales/orderFixtures.mjs';
import { clinicalContentError, designDemand } from '../../src/sales/clinicalContent.mjs';
export class BusinessFailure extends Error {
    constructor(message, status = 400) { super(message); this.status = status; }
}
const copy = value => structuredClone(value);
const aggregate = tasks => tasks.length && tasks.every(t => t.status === '已完成') ? '已完成' : ['审核退回', '进行中', '待审核'].find(status => tasks.some(t => t.status === status)) || '未开始';
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const empty = () => ({ schema: 1, source: 'isolated-shared', sequences: {}, orders: [], projects: [], tasks: [], events: [], artifacts: [] });
const editable = ['name', 'caseId', 'doctorId', 'hospitalId', 'department', 'service', 'quantity', 'requirements', 'clinicalRequirements', 'clinicalContent', 'designRequirements', 'requestedDueDate', 'due', 'patientName', 'patientSex', 'patientIdentityRef', 'insuranceConsent', 'importReceipt', 'importSource', 'materials', 'plannedStages'];
/** A single local database. Role snapshots are projections, never three persisted copies. */
export class UnifiedBusinessService {
    constructor({ directory, directoryProvider = () => ({ hospitals: [], doctors: [], salesScopes: {}, engineers: [] }), now = Date.now } = {}) { this.directory = directory; this.directoryProvider = directoryProvider; this.now = now; this.state = empty(); if (directory)
        mkdirSync(directory, { recursive: true, mode: 0o700 }); this.reload(); if(directory && upgradeKnownSharedDesignFixtures(copy(this.state.orders)))this.transaction(()=>upgradeKnownSharedDesignFixtures(this.state.orders)); }
    reload() { if (this.directory && existsSync(join(this.directory, 'state.json'))) {
        const next = JSON.parse(readFileSync(join(this.directory, 'state.json'), 'utf8'));
        if (next.schema !== 1 || next.source !== 'isolated-shared')
            throw Error('Unexpected shared business database');
        this.state = next;
    } return this.state; }
    transaction(work) { let lock; const previous = copy(this.state); try {
        if (this.directory) {
            try {
                lock = openSync(join(this.directory, 'write.lock'), 'wx', 0o600);
            }
            catch (e) {
                if (e.code === 'EEXIST')
                    throw new BusinessFailure('业务记录正在更新，请重试。', 409);
                throw e;
            }
        }
        this.reload();
        const result = work();
        this.assertRelations();
        if (this.directory) {
            const file = join(this.directory, `state-${randomUUID()}.tmp`);
            let fd;
            try {
                fd = openSync(file, 'wx', 0o600);
                writeFileSync(fd, JSON.stringify(this.state));
                fsyncSync(fd);
                closeSync(fd);
                fd = undefined;
                renameSync(file, join(this.directory, 'state.json'));
            }
            catch (e) {
                if (fd !== undefined)
                    closeSync(fd);
                if (existsSync(file))
                    unlinkSync(file);
                throw e;
            }
        }
        return copy(result);
    }
    catch (e) {
        this.state = previous;
        throw e;
    }
    finally {
        if (lock !== undefined) {
            closeSync(lock);
            unlinkSync(join(this.directory, 'write.lock'));
        }
    } }
    assertRelations() { const s = this.state, unique = (rows, key) => new Set(rows.map(r => r[key])).size === rows.length; if (!unique(s.orders, 'id') || !unique(s.projects, 'id') || !unique(s.tasks, 'id') || !unique(s.projects, 'orderId') || !unique(s.orders.filter(o => o.businessNo), 'businessNo'))
        throw Error('Business identity constraint failed'); for (const p of s.projects) {
        const o = s.orders.find(o => o.id === p.orderId);
        if (!o || o.projectId !== p.id || p.taskIds.some(id => !s.tasks.some(t => t.id === id && t.projectId === p.id && t.orderId === o.id)))
            throw Error('Broken project relation');
    } for (const t of s.tasks)
        if (!s.projects.some(p => p.id === t.projectId && p.orderId === t.orderId && p.taskIds.includes(t.id)))
            throw Error('Broken task relation'); }
    actor(actor, role, permission) { if (!actor || actor.status !== 'approved' || actor.role !== role || !actor.permissions?.includes(permission))
        throw new BusinessFailure('当前账号无此业务权限。', 403); }
    sales(actor) { this.actor(actor, 'sales', 'sales:landing'); return this.directoryProvider().salesScopes[actor.id] || []; }
    order(actor, id) { const o = this.state.orders.find(o => o.id === id); if (!o)
        throw new BusinessFailure('订单不存在。', 404); if (actor.role === 'sales') {
        if (o.ownerSalesId !== actor.id || (o.hospitalId ? !this.sales(actor).includes(o.hospitalId) : o.status !== '草稿'))
            throw new BusinessFailure('无订单访问权限。', 403);
    }
    else {
        if (actor.status !== 'approved' || !['super_admin', 'admin', 'leader'].includes(actor.role) || !actor.permissions?.includes('orders:read') || actor.role !== 'super_admin' && !actor.hospitalIds?.includes(o.hospitalId))
            throw new BusinessFailure('无订单访问权限。', 403);
    } return o; }
    version(row, version) { if (version !== row.version)
        throw new BusinessFailure('记录已更新，请刷新后重试。', 409); }
    event(actor, o, title, type, extra = {}) { const e = { id: randomUUID(), orderId: o.id, projectId: o.projectId || null, businessNo: o.businessNo, actorId: actor.id, actor: actor.name, role: actor.role, at: new Date(this.now()).toISOString(), title, type, source: 'isolated-shared', ...extra }; this.state.events.push(e); return e; }
    has(id) { this.reload(); return this.state.orders.some(o => o.id === id) || this.state.tasks.some(t => t.id === id); }
    save(actor, input, { submit = false } = {}) {
        this.sales(actor);
        return this.transaction(() => {
            const incoming = input.order || {}, id = incoming.id;
            if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,120}$/.test(id) || id.startsWith('ADM-'))
                throw new BusinessFailure('订单内部标识无效。');
            let o = this.state.orders.find(o => o.id === id);
            const before = o ? copy(o) : null;
            if (o) {
                this.order(actor, id);
                if (submit && o.status === '待审核')
                    return this.salesOrder(o);
                this.version(o, input.version);
                if (!['草稿', '审核退回'].includes(o.status))
                    throw new BusinessFailure('当前订单不可修改。', 409);
            }
            else if (input.version !== undefined)
                throw new BusinessFailure('尚未关联的历史订单需先核实原编号及关联，不能自动创建或重编号。', 409);
            if (!o && input.legacy) {
                const manifest = this.directoryProvider().legacyOrders?.find(r => r.id === id && r.ownerSalesId === actor.id && r.doctorId === incoming.doctorId && r.hospitalId === incoming.hospitalId && r.demoScenario === incoming.demoScenario);
                if (!manifest || incoming.status !== '审核退回' || !Number.isFinite(Date.parse(incoming.created)))
                    throw new BusinessFailure('历史订单需核实原编号和关联后迁移，不能自动重新编号。', 409);
                if (this.state.orders.some(r => r.businessNo === manifest.businessNo))
                    throw new BusinessFailure('原业务编号已关联其他记录。', 409);
                o = { id, businessNo: manifest.businessNo, status: '审核退回', version: 0, created: incoming.created, legacySource: manifest.demoScenario, createdBy: actor.id, reason: incoming.reason || '' };
            }
            else if (!o && incoming.status && incoming.status !== '草稿')
                throw new BusinessFailure('历史订单需核实原编号后迁移。', 409);
            const directory = this.directoryProvider(), doctor = directory.doctors.find(d => d.id === incoming.doctorId && d.salesId === actor.id && d.status === '审核通过'), hospital = directory.hospitals.find(h => h.id === doctor?.hospitalId);
            if ((submit || incoming.doctorId) && (!doctor || !hospital || !this.sales(actor).includes(hospital.id) || incoming.hospitalId !== hospital.id || incoming.department !== doctor.department || !hospital.departments.includes(doctor.department)) || !incoming.doctorId && incoming.hospitalId && !this.sales(actor).includes(incoming.hospitalId))
                throw new BusinessFailure('请选择本人授权医院及已审核客户。', 403);
            const values = Object.fromEntries(editable.filter(key => incoming[key] !== undefined).map(key => [key, copy(incoming[key])]));
            const at = new Date(this.now()).toISOString();
            o = { ...values, id, ownerSalesId: actor.id, createdBy: o?.createdBy || actor.id, created: o?.created || at, updated: at, businessDate: o?.businessDate || at, status: o?.status || '草稿', businessNo: o?.businessNo || null, version: (o?.version || 0) + 1, source: 'isolated-shared', reason: o?.reason || '', stages: [], ...Object.fromEntries(['projectId', 'taskIds', 'confirmedDeliveryDate', 'submittedAt', 'reviewedAt', 'leaderId', 'legacySource', 'designFixtureRevision'].filter(k => o?.[k] !== undefined).map(k => [k, o[k]])) };
            o.designRequirementConflicts=designDemand(o).conflicts;
            if (!Number.isInteger(o.quantity) || o.quantity < 1)
                throw new BusinessFailure('需求数量须为正整数。');
            const contentError = clinicalContentError(o.clinicalContent, actor.id);
            if (contentError)
                throw new BusinessFailure(contentError, 422);
            if (submit) {
                const errors = orderErrors(o, o.patientName, new Date(this.now()));
                if (!['男', '女'].includes(o.patientSex) || !o.patientIdentityRef)
                    errors.patientIdentity = '请先验证患者资料。';
                if (Object.keys(errors).length)
                    throw new BusinessFailure(Object.values(errors)[0], 422);
                o.plannedStages = designStages.filter(name => o.plannedStages.includes(name));
                if (!o.businessNo) {
                    const year = new Date(this.now()).getFullYear();
                    let sequence = this.state.sequences[year] || 0;
                    do {
                        o.businessNo = `CV-${year}-${String(++sequence).padStart(4, '0')}`;
                    } while (this.state.orders.some(r => r.businessNo === o.businessNo) || directory.reservedBusinessNumbers?.includes(o.businessNo));
                    this.state.sequences[year] = sequence;
                }
                o.status = '待审核';
                o.submittedAt = at;
                o.reason = '';
                o.leaderId = o.leaderId || hospital.leaderId;
            }
            this.state.orders = this.state.orders.filter(r => r.id !== id);
            this.state.orders.push(o);
            this.event(actor, o, submit ? '订单已提交审核' : '订单草稿已保存', submit ? 'order-submit' : 'draft-save', { before, after: copy(o), ...(input.legacy && !before ? { legacyImport: true } : {}) });
            return this.salesOrder(o);
        });
    }
    remove(actor, { id, version }) { return this.transaction(() => { const o = this.order(actor, id); this.sales(actor); this.version(o, version); if (o.status !== '草稿' || o.businessNo || o.projectId)
        throw new BusinessFailure('只能删除未提交草稿。', 409); this.event(actor, o, '订单草稿已删除', 'draft-delete', { before: copy(o), after: null }); this.state.orders = this.state.orders.filter(o => o.id !== id); return { ok: true }; }); }
    salesOrder(o) { const tasks = this.state.tasks.filter(t => t.orderId === o.id); return { ...copy(o), taskIds: tasks.map(t => t.id), stages: tasks.map(t => ({ name: designStages[t.stage], status: t.status, taskId: t.id, owner: this.directoryProvider().engineers.find(e => e.id === t.assignee)?.name || '', artifactId: t.approvedModel?.id })) }; }
    salesSnapshot(actor) { this.reload(); this.sales(actor); const orders = this.state.orders.filter(o => o.ownerSalesId === actor.id && (o.hospitalId ? this.sales(actor).includes(o.hospitalId) : o.status === '草稿')), ids = new Set(orders.map(o => o.id)); return { orders: orders.map(o => this.salesOrder(o)), projects: copy(this.state.projects.filter(p => ids.has(p.orderId))), events: copy(this.state.events.filter(e => ids.has(e.orderId)).map(e => ({ ...e, target: e.orderId, detail: e.reason || '', read: false }))) }; }
    adminSnapshot(actor) { this.reload(); if (!actor || actor.status !== 'approved' || !['super_admin', 'admin', 'leader'].includes(actor.role) || !actor.permissions?.includes('orders:read'))
        throw new BusinessFailure('无订单访问权限。', 403); const directory = this.directoryProvider(), orders = this.state.orders.filter(o => o.businessNo && (actor.role === 'super_admin' || actor.hospitalIds?.includes(o.hospitalId))), ids = new Set(orders.map(o => o.id)); return { orders: orders.map(o => ({ ...copy(o), salesId: o.ownerSalesId, requestedStages: o.plannedStages.map(s => designStages.indexOf(s)), createdAt: o.created, patientRef: o.patientIdentityRef, version: o.version })), tasks: copy(this.state.tasks.filter(t => ids.has(t.orderId))), hospitals: copy(directory.hospitals.filter(h => orders.some(o => o.hospitalId === h.id))), doctors: copy(directory.doctors.filter(d => orders.some(o => o.doctorId === d.id))), people: copy(directory.people || []), assets: copy(this.state.artifacts.filter(a => actor.permissions.includes('assets:read') && ids.has(a.orderId)).map(a => ({ ...a, name: '专业提交成果', stage: this.state.tasks.find(t => t.id === a.taskId).stage, publishStatus: '未发布', sourceFileAvailable: false, revision: 1 }))), events: copy(this.state.events.filter(e => actor.permissions.includes('audit:read') && ids.has(e.orderId)).map(e => ({ ...e, objectId: e.taskId || e.orderId, category: e.taskId ? '任务调度' : '订单审核', result: '成功', reason: e.reason || '' }))) }; }
    manage(actor, { action, id, version, ...input }) {
        return this.transaction(() => {
            const isTask = action === 'assign-task', task = isTask ? this.state.tasks.find(t => t.id === id) : null, o = this.order(actor, task?.orderId || id);
            if (!actor.permissions?.includes(isTask ? 'tasks:assign' : 'orders:review'))
                throw new BusinessFailure('无管理权限。', 403);
            this.version(task || o, version);
            const before = copy(task || o);
            if (action === 'takeover' || action === 'reassign') {
                if (!input.reason?.trim())
                    throw new BusinessFailure('请填写责任变更原因。');
                if (action === 'takeover' && actor.role !== 'super_admin')
                    throw new BusinessFailure('无接管权限。', 403);
                const target = action === 'takeover' ? actor.id : input.leaderId;
                if (action === 'reassign' && !this.directoryProvider().people?.some(p => p.id === target && p.role === '业务组长' && p.status === '已启用'))
                    throw new BusinessFailure('负责组长无效。');
                o.leaderId = target;
                o.version++;
                this.event(actor, o, '订单责任人已更新', action, { reason: input.reason, before, after: copy(o) });
                return { ok: true };
            }
            if (o.leaderId !== actor.id)
                throw new BusinessFailure('请由当前责任人处理或先接管订单。', 403);
            if (action === 'review-order') {
                if (o.status !== '待审核')
                    throw new BusinessFailure('订单已处理，请刷新。', 409);
                if (!['approved', 'returned'].includes(input.result))
                    throw new BusinessFailure('审核结果无效。');
                if (input.result === 'returned') {
                    if (!input.reason?.trim())
                        throw new BusinessFailure('请填写退回原因。');
                    o.status = '审核退回';
                    o.reason = input.reason;
                }
                else {
                    if (!date(input.confirmedDeliveryDate))
                        throw new BusinessFailure('请确认有效预计交付时间。');
                    o.status = '处理中';
                    o.confirmedDeliveryDate = input.confirmedDeliveryDate;
                    const existing = this.state.projects.find(p => p.orderId === o.id);
                    if (existing)
                        throw new BusinessFailure('项目已建立，请刷新。', 409);
                    const p = { id: `PRJ-${randomUUID()}`, orderId: o.id, createdAt: new Date(this.now()).toISOString(), taskIds: [], source: 'isolated-shared' };
                    o.projectId = p.id;
                    this.state.projects.push(p);
                    o.plannedStages.forEach((name, i) => { const t = { id: `TASK-${randomUUID()}`, projectId: p.id, orderId: o.id, stage: designStages.indexOf(name), status: '未开始', assignee: null, upstreamId: i ? p.taskIds[i - 1] : null, plannedDate: o.confirmedDeliveryDate, version: 1, createdAt: p.createdAt, updatedAt: p.createdAt, review: [], source: 'isolated-shared' }; p.taskIds.push(t.id); this.state.tasks.push(t); });
                    o.taskIds = p.taskIds;
                }
                o.version++;
                o.updated = o.reviewedAt = new Date(this.now()).toISOString();
                this.event(actor, o, input.result === 'approved' ? '订单审核受理' : '订单审核退回', 'order-review', { reason: input.reason || '', result: input.result, before, after: copy(o) });
                return { ok: true, orderId: o.id, projectId: o.projectId };
            }
            if (isTask && task) {
                if (task.status !== '未开始')
                    throw new BusinessFailure('当前任务不能重新分配。', 409);
                const engineer = this.directoryProvider().engineers.find(e => e.id === input.assignee && e.stages.includes(task.stage) && e.status === '已启用');
                if (!engineer)
                    throw new BusinessFailure('工程师不具备对应专业能力。', 403);
                if (!date(input.plannedDate) || input.plannedDate > o.confirmedDeliveryDate)
                    throw new BusinessFailure('计划时间不得晚于预计交付时间。');
                task.assignee = engineer.id;
                task.plannedDate = input.plannedDate;
                task.updatedAt = new Date(this.now()).toISOString();
                task.version++;
                this.event(actor, o, '专业任务已分配', 'assigned', { taskId: task.id, assignee: engineer.id, before, after: copy(task) });
                return { ok: true };
            }
            throw new BusinessFailure('当前共享业务不支持此操作。', 400);
        });
    }
    designerSnapshot(actor) { this.reload(); this.actor(actor, 'designer', 'projects:own'); const own = this.state.tasks.filter(t => t.assignee === actor.id), projectIds = new Set(own.map(t => t.projectId)), projects = this.state.projects.filter(p => projectIds.has(p.id)); const tasks = own.map(t => { const p = projects.find(p => p.id === t.projectId), o = this.state.orders.find(o => o.id === p.orderId), up = this.state.tasks.find(u => u.id === t.upstreamId); return { ...copy(t), businessNo: o.businessNo, title: o.name, patient: o.patientIdentityRef, patientName: o.patientName, orderNo: p.id, surgery: designDemand(o).text, designDemandContent: designDemand(o).content, designDemandOwnerId: o.ownerSalesId, taskType: ['三维重建', 'CAD 设计', '有限元分析', '3D 打印'][t.stage], owner: actor.name, updated: t.updatedAt, deadline: t.plannedDate, series: [], source: '订单关联资料', hospital: this.directoryProvider().hospitals.find(h => h.id === o.hospitalId)?.name || '', dataOrigin: 'demo', sharedBusiness: true, projectStatus: aggregate(this.state.tasks.filter(row => row.projectId === p.id)), accessible: true, assigneeId: t.assignee, projectCreatedAt: p.createdAt, orderCreatedAt: o.created, agreedDueAt: o.confirmedDeliveryDate, upstreamTaskId: t.upstreamId, upstreamApproved: !!up?.approvedModel && up.status === '已完成', approvedModel: t.approvedModel || up?.approvedModel }; }); const ids = new Set(own.map(t => t.id)), byOrder = new Map(projects.map(p => [p.orderId, p])); return { tasks, events: copy(this.state.events.filter(e => byOrder.has(e.orderId) && (!e.taskId || ids.has(e.taskId))).map(e => ({ ...e, orderNo: byOrder.get(e.orderId).id, taskId: e.taskId || '', type: e.type, name: e.title, description: e.reason || '' }))) }; }
    taskCommand(actor, { id, action, version, artifact }) { return this.transaction(() => { this.actor(actor, 'designer', 'projects:own'); const t = this.state.tasks.find(t => t.id === id && t.assignee === actor.id); if (!t)
        throw new BusinessFailure('无任务访问权限。', 403); this.version(t, version); const o = this.state.orders.find(o => o.id === t.orderId), up = this.state.tasks.find(u => u.id === t.upstreamId); if (up && (up.status !== '已完成' || !up.approvedModel))
        throw new BusinessFailure('等待上游正式成果审核通过。', 409); if (action === 'start') {
        if (t.status !== '未开始')
            return { ok: true };
        t.status = '进行中';
        this.event(actor, o, '专业任务已开始', 'started', { taskId: t.id });
    }
    else if (action === 'submit') {
        if (!['进行中', '审核退回'].includes(t.status) || !artifact?.id || !artifact?.version)
            throw new BusinessFailure('当前任务不可提交审核。', 409);
        const a = { id: artifact.id, version: artifact.version, taskId: t.id, orderId: o.id, projectId: t.projectId, reviewStatus: '待审核', source: 'isolated-shared', submittedBy: actor.id, submittedAt: new Date(this.now()).toISOString() };
        if (this.state.artifacts.some(r => r.id === a.id && r.version === a.version))
            throw new BusinessFailure('成果提交快照已存在。', 409);
        this.state.artifacts.push(a);
        t.status = '待审核';
        t.review.push({ time: a.submittedAt, actor: actor.name, status: '已提交审核', note: '成果已提交审核', submissionId: a.id });
        this.event(actor, o, '已提交审核', 'review-submit', { taskId: t.id, resultId: a.id, resultVersion: a.version });
    }
    else
        throw new BusinessFailure('任务操作无效。'); t.version++; t.updatedAt = new Date(this.now()).toISOString(); return { ok: true }; }); }
}
