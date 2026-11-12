import { fixtureBytes } from './orderFixtures.mjs';
/** Isolated, stable synthetic documents; never real identity or medical credentials. */
export function completeDoctorFixtures(data) {
    const names = ['顾明哲', '宋知远', '程景行', '方清和', '许承安', '沈修远', '陆明轩', '江予安', '周景宁'];
    names.forEach((name, i) => {
        const id = `D26-${i + 1}`;
        if (data.doctors.some(d => d.id === id) || data.events.some(e => e.target === id && e.title === '医生草稿已删除'))
            return;
        const h = data.hospitals[i % data.hospitals.length];
        const status = ['审核通过', '待审核', '审核退回', '草稿'][i % 4];
        const phone = '199000020' + String(i + 1).padStart(2, '0');
        if (data.doctors.some(d => d.phone === phone))
            return;
        data.doctors.splice(6,0,{ id, name, phone, hospitalId: h.id, department: h.departments[0], title: i % 2 ? '副主任医师' : '主治医师', certificate: `SYN-V26-${i + 1}`, status, owner: status === '审核通过' ? data.ownerId : null, createdBy: data.ownerId, materials: [], reason: status === '审核退回' ? '请补充清晰的证明材料。' : '', source: '销售建档', updatedAt: '2026-11-11T08:00:00+08:00' });
    });
    for (const d of data.doctors) {
        const known = /^D26-\d+$/.test(d.id) || (/^D-[1-6]$/.test(d.id) && d.certificate === `DEMO-QUAL-${d.id.slice(2)}`);
        if (!known)
            continue;
        d.updatedAt ||= '2026-11-10T10:00:00+08:00';
        if (d.status !== '审核通过')
            d.owner = null;
        if (d.status === '草稿')
            continue;
        if (!d.materials.length)
            d.materials = ['identity', 'practice'].map((category, i) => ({ id: `doctor-fixture:${d.id}:${category}`, name: `合成材料-${category === 'identity' ? '身份资料' : '执业资料'}.pdf`, type: 'application/pdf', size: fixtureBytes(1).length, category, status: 'success', storage: 'demo-fixture', uploadedAt: '2026-11-09T08:00:00+08:00', uploadedBy: data.ownerId }));
        if (!data.events.some(e => e.target === d.id && e.title.includes('审核'))) {
            data.events.push({ id: `doctor-fixture:${d.id}:submit`, target: d.id, at: '2026-11-09T09:00:00+08:00', actor: '李明', title: '医生档案已提交审核', detail: '', read: true });
            if (d.status !== '待审核')
                data.events.push({ id: `doctor-fixture:${d.id}:review`, target: d.id, at: '2026-11-10T10:00:00+08:00', actor: '管理员', title: `医生${d.status}`, detail: d.status === '审核退回' ? d.reason : '资料审核通过。', read: true });
        }
    }
    return data;
}
export function doctorDraftDeleteError(data, doctor, actor) {
    if (!doctor || doctor.status !== '草稿')
        return '仅未提交的医生草稿可以删除。';
    if (doctor.createdBy !== actor.id && !actor.permissions.includes('doctor.draft.delete'))
        return '无权删除该医生草稿。';
    if (data.events.some(e => e.target === doctor.id && e.title.includes('审核')))
        return '档案已存在审核记录，不能删除。';
    if (data.cases.some(c => c.doctorId === doctor.id))
        return '档案已被病例引用，不能删除。';
    if (data.orders.some(o => o.doctorId === doctor.id))
        return '档案已被订单引用，不能删除。';
    return '';
}
