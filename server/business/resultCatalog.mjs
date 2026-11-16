/** Explicit isolated-demo manifest. No rule promotes arbitrary completed orders or engineer projects. */
export const resultScenarios = {
    'SO-2026-0006': { scenario: 'SO', hospitalId: 'H-B', patientName: '顾清禾', stages: ['三维重建', 'CAD设计'], sex: '女', identityNumber: '11010519491231002X' },
    'SO-2026-0008': { scenario: 'SO', hospitalId: 'H-B', patientName: '顾清禾', stages: ['三维重建', 'CAD设计'], sex: '女', identityNumber: '11010519491231002X' },
    'SO-V28-1-05': { scenario: 'SO-V28-1', hospitalId: 'H-A', patientName: '沈嘉宁', stages: ['三维重建'], sex: '女', identityNumber: '11010519491231002X' },
};
export function approvedDemoChain(user, row) {
    const spec = resultScenarios[row.id];
    if (!user.demoBusiness || !spec || row.demoScenario !== spec.scenario || row.ownerSalesId !== user.id || row.hospitalId !== spec.hospitalId || row.patientName !== spec.patientName || row.status !== '已完成' || row.projectId !== `SP-${row.id}` || !Number.isFinite(Date.parse(row.completedAt)))
        return null;
    if (spec.stages.some((stage, i) => !row.stages?.some(s => s.name === stage && s.status === '已完成' && s.taskId === `${row.id}:stage:${i + 1}`)))
        return null;
    return { ...spec, projectId: row.projectId, artifacts: spec.stages.map((stage, i) => ({ id: `R33-${row.id}-${i + 1}`, orderId: row.id, projectId: row.projectId, taskId: `${row.id}:stage:${i + 1}`, stage, version: '1', name: stage + '成果', status: '审核通过', reviewStatus: 'approved', publishStatus: 'published', imageId: `P33-${row.id}-${i + 1}`, previewKey: `${row.id}-${i + 1}`, kind: 'model', dataOrigin: 'isolated-business-fixture' })) };
}
