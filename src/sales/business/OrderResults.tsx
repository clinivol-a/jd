import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Dialog, Empty, Input, QRCode, Tag } from 'tdesign-react';
import { business } from './client';
export function ReadOnlyPreview({ src }: {
    src: string;
}) { const [zoom, setZoom] = useState(1), [offset, setOffset] = useState({ x: 0, y: 0 }); const drag = useRef<{
    x: number;
    y: number;
} | null>(null); return <div className="business-preview"><div className="business-preview-controls"><Button theme="default" onClick={() => setZoom(z => Math.max(.5, z - .2))}>缩小</Button><Button theme="default" onClick={() => setZoom(z => Math.min(3, z + .2))}>放大</Button><Button theme="default" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}>适应视窗</Button><span>只读展示</span></div><div className="business-preview-canvas" onContextMenu={e => e.preventDefault()} onPointerDown={e => { drag.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => { if (drag.current)
    setOffset({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }); }} onPointerUp={() => drag.current = null} onPointerCancel={() => drag.current = null}><img alt="获准展示的静态成果" draggable={false} src={src} style={{ transform: `translate(${offset.x}px,${offset.y}px) scale(${zoom})` }}/></div></div>; }
export function OrderResults({ orderId }: {
    orderId: string;
}) { const [artifacts, setArtifacts] = useState<any[]>([]), [error, setError] = useState(''), [image, setImage] = useState(''), [share, setShare] = useState<{
    url: string;
    token: string;
} | null>(null); useEffect(() => { let active = true; void business('artifacts?orderId=' + encodeURIComponent(orderId)).then(r => { if (active)
    setArtifacts(r.artifacts); }).catch(e => { if (active)
    setError(e.message); }); return () => { active = false; }; }, [orderId]); useEffect(() => () => { if (image)
    URL.revokeObjectURL(image); }, [image]); return <Card bordered={false} className="project-info-card"><h2>设计成果展示</h2>{error ? <Alert theme="error" message={error}/> : !artifacts.length ? <Empty description="暂无已审核且允许发布的设计成果"/> : artifacts.map(a => <div className="business-artifact" key={a.id}><div><strong>{a.name}</strong><p>{a.stage} · {a.version}</p><Tag theme="success">{a.status}</Tag></div><div className="sales-actions"><Button theme="default" onClick={() => void fetch('/api/business-v31/image?orderId=' + encodeURIComponent(orderId)).then(async (r) => { if (!r.ok)
    throw Error('无法查看成果。'); setImage(URL.createObjectURL(await r.blob())); }).catch(e => setError(e.message))}>查看成果</Button><Button theme="default" onClick={() => void business('share', { orderId }).then(setShare).catch(e => setError(e.message))}>分享二维码</Button></div></div>)}<Dialog visible={!!image} header="成果只读查看" footer={false} width="80%" onClose={() => setImage('')}>{image && <ReadOnlyPreview src={image}/>}</Dialog><Dialog visible={!!share} header="订单成果分享" footer={false} onClose={() => setShare(null)}>{share && <><QRCode value={share.url} size={196} type="svg"/><p>仅已获此订单授权的医生或患者，经手机验证后可查看。</p><Input value={share.url} readonly/><div className="sales-actions"><Button theme="default" onClick={() => void navigator.clipboard.writeText(share.url)}>复制链接</Button><Button theme="danger" variant="text" onClick={() => void business('revoke', { token: share.token }).then(() => setShare(null)).catch(e => setError(e.message))}>撤销分享</Button></div></>}</Dialog></Card>; }
export function PublicOrderResults() { const token = new URLSearchParams(location.search).get('token') || '', [phone, setPhone] = useState(''), [code, setCode] = useState(''), [error, setError] = useState(''), [message, setMessage] = useState(''), [info, setInfo] = useState(''), [image, setImage] = useState(''), [busy, setBusy] = useState(false), [retry, setRetry] = useState(0); useEffect(() => { void business('public-info?token=' + token).then(r => setInfo(r.message)).catch(e => setError(e.message)); }, [token]); useEffect(() => { if (!retry)
    return; const t = setTimeout(() => setRetry(r => r - 1), 1000); return () => clearTimeout(t); }, [retry]); useEffect(() => () => { if (image)
    URL.revokeObjectURL(image); }, [image]); const verify = async () => { setBusy(true); setError(''); try {
    const r = await business('public-verify?token=' + token, { phone, code }), res = await fetch('/api/business-v31/public-image?token=' + token, { headers: { 'X-Result-Proof': r.proof } });
    if (!res.ok)
        throw Error('成果访问权限失效。');
    setImage(URL.createObjectURL(await res.blob()));
}
catch (e) {
    setMessage('');
    setError((e as Error).message);
}
finally {
    setBusy(false);
} }; return <main className="business-public"><img className="business-public-logo" src="/assets/clinivol-logo-light.png" alt="科立沃"/><Card bordered={false}><h1>订单成果查看</h1>{image ? <ReadOnlyPreview src={image}/> : <><p>{info}</p><label>手机号<Input value={phone} onChange={setPhone}/></label><label>短信验证码<div className="business-code-row"><Input value={code} onChange={setCode}/><Button theme="default" disabled={retry > 0} onClick={() => void business('public-code?token=' + token, { phone }).then(() => { setRetry(60); setMessage('验证码已发送至隔离测试收件箱。'); setError(''); }).catch(e => setError(e.message))}>{retry ? `${retry}s` : '获取验证码'}</Button></div></label>{message && <p className="field-hint">{message}</p>}<Button theme="primary" loading={busy} onClick={() => void verify()}>验证并查看</Button></>}{error && <Alert theme="error" message={error}/>}</Card></main>; }
