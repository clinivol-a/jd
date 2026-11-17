import {previewModel} from './previewModel.mjs';
import {resultScenarios} from './resultCatalog.mjs';
import { createServer, request as httpRequest } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { networkInterfaces } from 'node:os';
import { fixtureBytes } from '../../src/sales/orderFixtures.mjs';
import { orderErrors } from '../../src/sales/orderRules.mjs';
import { BusinessService } from './service.mjs';
export function businessDesignPlugin({ authOrigin = 'http://127.0.0.1:5211', getSession, service, lan = true } = {}) {
    return { name: 'clinivol-v31-isolated-business', apply: 'serve', async configureServer(vite) {
            if (process.env.NODE_ENV === 'production')
                return;
            let gateway, lanOrigin = '';
            async function ensureLAN() { if (!lan)
                return ''; if (lanOrigin)
                return lanOrigin; const ip = Object.values(networkInterfaces()).flat().find(n => n?.family === 'IPv4' && !n.internal && /^(192\.168\.|10\.)/.test(n.address)); if (!ip)
                return ''; gateway = createServer((req, res) => { const path = new URL(req.url, 'http://local').pathname; if (!path.startsWith('/api/') && !(/^\/(order-results|src\/|node_modules\/|@vite\/|@react-refresh|@fs\/.*node_modules\/|assets\/clinivol-logo-light\.png)/.test(path))) {
                res.statusCode = 404;
                res.end();
                return;
            } if (path.startsWith('/api/') && !['/api/business-v31/public-info', '/api/business-v31/public-code', '/api/business-v31/public-verify', '/api/business-v31/public-image','/api/business-v31/public-model','/api/business-v31/public-open','/api/business-v31/public-viewed'].includes(path) || path.startsWith('/assets/cad/') || /\.(stl|obj|step|env|json)$/i.test(path)) {
                res.statusCode = 403;
                res.end('Access denied');
                return;
            } const proxy = httpRequest({ hostname: '127.0.0.1', port: vite.config.server.port, path: req.url, method: req.method, headers: { ...req.headers, host: '127.0.0.1:' + vite.config.server.port, origin: 'http://127.0.0.1:' + vite.config.server.port, cookie: '' } }, up => { res.writeHead(up.statusCode, up.headers); up.pipe(res); }); proxy.on('error', () => { res.statusCode = 502; res.end('Local preview unavailable'); }); req.pipe(proxy); }); await new Promise((resolve, reject) => { gateway.once('error', reject); gateway.listen(5213, ip.address, resolve); }); lanOrigin = 'http://' + ip.address + ':5213'; vite.httpServer?.once('close', () => gateway?.close()); return lanOrigin; }
            if (!service) {
                const dir = new URL('../../.local/business-v31/', import.meta.url);
                await mkdir(dir, { recursive: true });
                let key, state;
                try {
                    key = await readFile(new URL('key', dir));
                }
                catch {
                    key = randomBytes(32);
                    await writeFile(new URL('key', dir), key, { mode: 0o600 });
                }
                try {
                    state = new BusinessService({ key }).unseal(await readFile(new URL('records.enc', dir), 'utf8'));
                }
                catch { }
                const resultImages=new Map();for(const [id,spec] of Object.entries(resultScenarios))for(let i=1;i<=spec.stages.length;i++){try{resultImages.set(`${id}-${i}`,await readFile(new URL(`./fixtures/results/${id}-${i}.png`,import.meta.url)))}catch{}}
                service = new BusinessService({ key,state,demoShareCodes:true,resultModel:previewModel,resultImage:key=>resultImages.get(key), image: await readFile(new URL('./fixtures/approved-static-preview.png', import.meta.url)), persist: async (value) => { await writeFile(new URL('records.enc', dir), service.seal(value), { mode: 0o600 }); } });
            }
            vite.middlewares.use(async (req, res, next) => {
                if (!req.url?.startsWith('/api/business-v31/'))
                    return next();
                const send = (status, data) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.end(JSON.stringify(data)); };
                try {
                    const u = new URL(req.url, 'http://local'), a = u.pathname.split('/').at(-1);
                    if (req.method === 'POST' && req.headers.origin && new URL(req.headers.origin).host !== req.headers.host)
                        return send(403, { error: '来源不匹配。' });
                    let body = {};
                    if (req.method === 'POST') {
                        let text = '';
                        for await (const chunk of req) {
                            text += chunk;
                            if (text.length > 58 * 1024 * 1024)
                                throw Error('上传资料过大。');
                        }
                        body = JSON.parse(text || '{}');
                    }
                    const mutations = new Set(['public-open','public-viewed','share-copy','public-code', 'public-verify', 'patient', 'start', 'update', 'receipt', 'validate-order', 'validate-patient', 'sample', 'projection', 'share', 'revoke', 'export-code', 'export-verify', 'export']);
                    if (req.method !== (mutations.has(a) ? 'POST' : 'GET'))
                        return send(405, { error: '请求方式不支持。' });
                    const token = u.searchParams.get('token');
                    const binary = (bytes, type) => { res.setHeader('Content-Type', type); res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.end(bytes); };
                    if (a === 'public-info') {
                        service.publicOrder(token);
                        return send(200, { brand: '科立沃', message: '验证已授权手机号后查看订单成果。', adapter: 'isolated-demo' });
                    }
                    if (a === 'public-code')
                        return send(200, await service.code(token, body.phone));
                    if(a==='public-verify'){service.shareRecords.requireVisit(token,body.visitId);return send(200,await service.verify(token,body.phone,body.code,body.visitId));}
                    if(a==='public-open')return send(200,await service.shareRecords.open(token,body));
                    if(a==='public-viewed')return send(200,await service.shareRecords.viewed(token,{...body,proof:req.headers['x-result-proof']}));
                    if(a==='public-model'){const model=service.publicModel(token,req.headers['x-result-proof']);await service.persist(service.state);return send(200,model);}
                    if(a==='public-image'){const bytes=service.publicImage(token,req.headers['x-result-proof']);await service.persist(service.state);return binary(bytes,'image/png');}
                    const session = getSession ? await getSession(req) : await (await fetch(authOrigin + '/api/auth/session', { headers: { cookie: req.headers.cookie || '' } })).json();
                    if (session.locked)
                        return send(403, { error: '请先解锁账号。' });
                    const user = service.sales(session.user);
                    // Explicit local-only grant for the user's approved Li Ming acceptance scenario.
                    // The production plugin is absent; never infer production permissions from this map.
                    const localLi = session.capabilities?.mode === 'local' && session.capabilities?.demoUnlock && user.phone === '138****0002' && user.name === '李明';
                    if (localLi) {
                        user.permissions = [...(user.permissions || []), 'insurance.export'];
                        user.phone = '13800000002';user.demoBusiness=true;
                    }
                    if(a==='share-records')return send(200,service.shareRecords.records(user,{token,page:u.searchParams.get('page'),pageSize:u.searchParams.get('pageSize')}));
                    if(a==='share-copy')return send(200,await service.shareRecords.copy(user,body));
                    if (a === 'capabilities')
                        return send(200, { adapter: 'isolated-demo', insuranceExport: user.permissions?.includes('insurance.export'), samples: service.list(user) });
                    if (a === 'validate-patient') {
                        service.validatePatient(user, body.order || {});
                        return send(200, { ok: true });
                    }
                    if (a === 'patient')
                        return send(200, await service.patient(user, body));
                    if (a === 'start')
                        return send(200, await service.start(user, body));
                    if (a === 'update')
                        return send(200, await service.update(user, body));
                    if (a === 'imaging') {
                        const i = service.ownImport(user, u.searchParams.get('id'));
                        if (!i.matched)
                            throw Error('请先核对影像。');
                        return binary(fixtureBytes(0), 'application/octet-stream');
                    }
                    if (a === 'validate-order') {
                        service.validateReceipt(user, body.order || {});
                        const errors = orderErrors(body.order || {}, body.order?.patientName);
                        if (Object.keys(errors).length)
                            return send(422, { error: Object.values(errors).join(' ') });
                        return send(200, { ok: true });
                    }
                    if (a === 'receipt')
                        return send(200, await service.receipt(user, body));
                    if (a === 'sample')
                        return send(200, await service.sample(user));
                    if (a === 'artifacts')
                        return send(200, { artifacts: service.artifacts(user, u.searchParams.get('orderId')) });
                    if (a === 'image') {
                        const o = service.order(user, u.searchParams.get('orderId'));
                        if (!o.published)
                            throw Error('成果未发布。');
                        const a=service.artifact(o,u.searchParams.get('resultId'));if(!a||!service.artifacts(user,o.id).includes(a))throw Error('成果未获发布许可。');const bytes=service.imageFor(o,a);if(!bytes)throw Error('成果图片暂不可用。');return binary(bytes, 'image/png');
                    }
                    if (a === 'share') {
                        const origin = await ensureLAN() || 'http://' + req.headers.host;
                        return send(200, await service.share(user, body, origin));
                    }
                    if (a === 'revoke')
                        return send(200, await service.revoke(user, body.token));
                    if (a === 'projection')
                        return send(200, await service.projection(user, body.orders));
                    if (a === 'export-list')
                        return send(200, { orders: service.exportList(user, u.searchParams.get('month')) });
                    if (a === 'export-code')
                        return send(200, service.exportCode(user));
                    if (a === 'export-verify')
                        return send(200, service.exportVerify(user, body.code));
                    if (a === 'export') {
                        const bytes = await service.export(user, body);
                        res.setHeader('Content-Disposition', 'attachment; filename="clinivol-insurance-internal.xlsx"');
                        return binary(bytes, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    }
                    if (a === 'test-inbox') {
                        if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress))
                            return send(403, { error: '仅本机可读测试验证码。' });
                        return send(200, { codes: service.proofs.inbox(['export:' + user.id, ...Object.keys(service.state.shares).filter(t => service.state.shares[t].owner === user.id).map(t => 'share:' + t)]) });
                    }
                    return send(404, { error: '接口不可用。' });
                }
                catch (e) {
                    send(e.status || 400, { error: e.message });
                }
            });
        } };
}
