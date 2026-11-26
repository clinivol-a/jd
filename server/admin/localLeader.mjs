import {eligibleHospitalLeaders} from '../../src/admin/institutionRules.mjs';
/** Controlled local adapter until the leader account/workbench is implemented.
 * No HTTP route and no role changes to the super-administrator account. */
export function localLeaderActor(admin, leaderId) {
    const auth = admin.authService;
    if (process.env.NODE_ENV === 'production' || !auth || auth.mode !== 'local' || !auth.demoMode || auth.publicOrigin)
        throw Error('Leader adapter is local demo only');
    const directory = admin.institutions.snapshot(), person = directory.people.find(p => p.id === leaderId && p.role === '业务组长' && p.status === '已启用');
    if (!person || !['orders:read', 'orders:review', 'tasks:assign'].every(permission => person.permissions.includes(permission)))
        throw Error('Leader needs enabled registration, order access, review and assignment permissions');
    return { id: person.id, name: person.name, role: 'leader', status: 'approved', permissions: person.permissions.filter(p => ['orders:read', 'orders:review', 'tasks:assign', 'audit:read'].includes(p)), hospitalIds: directory.hospitals.filter(h => eligibleHospitalLeaders([person],h).length>0).map(h => h.id), authenticationSource: 'isolated-local-leader-adapter' };
}
