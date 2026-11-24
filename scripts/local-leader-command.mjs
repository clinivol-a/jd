/** Explicit local-only bridge until authenticated leader workbench is delivered.
 * Example: node scripts/local-leader-command.mjs --data .local/qa --leader ADM-L01 --command /tmp/decision.json
 * The command is a normal {action,id,version,...} review-order or assign-task payload.
 * Never expose this script as an HTTP endpoint or use it against production storage.
 */
import { resolve, join, relative, isAbsolute } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { AuthService } from '../server/auth/service.mjs';
import { AdminService } from '../server/admin/service.mjs';
import { localLeaderActor } from '../server/admin/localLeader.mjs';
const args = process.argv.slice(2), get = key => args[args.indexOf(key) + 1];
if (process.env.NODE_ENV === 'production' || process.env.VERCEL || process.env.AUTH_PUBLIC_ORIGIN)
    throw Error('Only isolated local data is supported');
if (!args.includes('--data') || !args.includes('--leader') || !args.includes('--command'))
    throw Error('Required: --data .local/<isolated-data> --leader <registered-id> --command <json-file>');
const root = resolve('.local'), directory = resolve(get('--data')), sub = relative(root, directory);
if (!sub || sub.startsWith('..') || isAbsolute(sub))
    throw Error('Use a named, existing isolated data copy under .local');
for (const file of ['auth/accounts.json', 'admin/state.json', 'unified-business/state.json'])
    if (!existsSync(join(directory, file)))
        throw Error('Existing isolated auth/admin/shared data required');
const input = JSON.parse(readFileSync(resolve(get('--command')), 'utf8'));
if (!['review-order', 'assign-task'].includes(input.action))
    throw Error('Only leader order decisions or task assignment are supported');
const auth = new AuthService({ directory: join(directory, 'auth'), mode: 'local', demoMode: true }), admin = new AdminService({ directory: join(directory, 'admin'), authService: auth });
const actor = localLeaderActor(admin, get('--leader'));
if (!admin.shared.has(input.id))
    throw Error('This bridge supports shared business orders only');
admin.command(actor, input);
const task = admin.shared.state.tasks.find(t => t.id === input.id), order = admin.shared.state.orders.find(o => o.id === (task?.orderId || input.id));
if (!order)
    throw Error('This bridge supports shared business orders only');
console.log(JSON.stringify({ actorId: actor.id, orderId: order.id, businessNo: order.businessNo, projectId: order.projectId, status: order.status, version: order.version, tasks: admin.shared.state.tasks.filter(t => t.orderId === order.id).map(t => ({ id: t.id, stage: t.stage, assignee: t.assignee, status: t.status, version: t.version })) }, null, 2));
