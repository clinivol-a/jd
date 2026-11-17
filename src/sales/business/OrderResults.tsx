import {ShareRecordsDrawer,type ShareStats} from './ShareRecordsDrawer';
import {shareVisitId} from './shareVisit';
import {formatDateTime} from '../../dateTime';
import {ChevronRightIcon} from '../../design-system/tdesign';
import { ReadOnlyModel, type PreviewModel } from './ReadOnlyModel';
import { syncOrders } from './projection';
import type { SalesData } from '../model';
import { QrcodeIcon } from 'tdesign-icons-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Dialog, Empty, Form, Input, QRCode, Tag, MessagePlugin } from 'tdesign-react';
import { business } from './client';
export function ReadOnlyPreview({ src,onReady }: {
    src: string;onReady?:()=>void;
}) {
    const [zoom, setZoom] = useState(1), [offset, setOffset] = useState({ x: 0, y: 0 });
    const drag = useRef<{
        x: number;
        y: number;
    } | null>(null);
    return <div className="business-preview"><div className="business-preview-controls"><Button theme="default" onClick={() => setZoom(z => Math.max(.5, z - .2))}>缩小</Button><Button theme="default" onClick={() => setZoom(z => Math.min(3, z + .2))}>放大</Button><Button theme="default" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}>适应视窗</Button><span>只读展示</span></div><div className="business-preview-canvas" onContextMenu={e => e.preventDefault()} onPointerDown={e => { drag.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => {
            if (drag.current)
                setOffset({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y });
        }} onPointerUp={() => drag.current = null} onPointerCancel={() => drag.current = null}><img onLoad={onReady} alt="获准展示的静态成果" draggable={false} src={src} style={{ transform: `translate(${offset.x}px,${offset.y}px) scale(${zoom})` }}/></div></div>;
}
export function OrderResults({ orderId }: {
    orderId: string;
}) {
    const [artifacts, setArtifacts] = useState<any[]>([]), [error, setError] = useState(''), [image, setImage] = useState(''), [share, setShare] = useState<{
        url: string;
        token: string;
    } | null>(null);
    useEffect(() => {
        let active = true;
        void business('artifacts?orderId=' + encodeURIComponent(orderId)).then(r => {
            if (active)
                setArtifacts(r.artifacts);
        }).catch(e => {
            if (active)
                setError(e.message);
        });
        return () => { active = false; };
    }, [orderId]);
    useEffect(() => () => {
        if (image)
            URL.revokeObjectURL(image);
    }, [image]);
    return <Card bordered={false} className="project-info-card"><h2>设计成果展示</h2>{error ? <Alert theme="error" message={error}/> : !artifacts.length ? <Empty description="暂无已审核且允许发布的设计成果"/> : artifacts.map(a => <div className="business-artifact" key={a.id}><div><strong>{a.name}</strong><p>{a.stage} · {a.version}</p><Tag theme="success">{a.status}</Tag></div><div className="sales-actions"><Button theme="default" onClick={() => void fetch('/api/business-v31/image?orderId=' + encodeURIComponent(orderId)).then(async (r) => {
                if (!r.ok)
                    throw Error('无法查看成果。');
                setImage(URL.createObjectURL(await r.blob()));
            }).catch(e => setError(e.message))}>查看成果</Button><Button theme="default" onClick={() => void business('share', { orderId }).then(setShare).catch(e => setError(e.message))}>分享二维码</Button></div></div>)}<Dialog visible={!!image} header="成果只读查看" footer={false} width="80%" onClose={() => setImage('')}>{image && <ReadOnlyPreview src={image}/>}</Dialog><Dialog visible={!!share} header="订单成果分享" footer={false} onClose={() => setShare(null)}>{share && <><QRCode value={share.url} size={196} type="svg"/><p>仅已获此订单授权的医生或患者，经手机验证后可查看。</p><Input value={share.url} readonly/><div className="sales-actions"><Button theme="default" onClick={() => void navigator.clipboard.writeText(share.url)}>复制链接</Button><Button theme="danger" variant="text" onClick={() => void business('revoke', { token: share.token }).then(() => setShare(null)).catch(e => setError(e.message))}>撤销分享</Button></div></>}</Dialog></Card>;
}
export function PublicOrderResults() {
    const token=new URLSearchParams(location.search).get('token')||'';
    const [visitId]=useState(()=>shareVisitId(token)),[phone,setPhone]=useState(''),[code,setCode]=useState(''),[error,setError]=useState(''),[feedback,setFeedback]=useState<{status:'success'|'error';text:string}|null>(null),[info,setInfo]=useState(''),[image,setImage]=useState(''),[model,setModel]=useState<PreviewModel|null>(null),[proof,setProof]=useState(''),[busy,setBusy]=useState(false),[retry,setRetry]=useState(0),[opened,setOpened]=useState(false),[recordError,setRecordError]=useState('');
    const recorded=useRef(false);
    useEffect(()=>{let active=true;void Promise.all([business('public-info?token='+encodeURIComponent(token)),business('public-open?token='+encodeURIComponent(token),{visitId})]).then(([r])=>{if(active){setInfo(r.message);setOpened(true)}}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[token,visitId]);
    useEffect(()=>{if(!retry)return;const timer=setTimeout(()=>setRetry(r=>r-1),1000);return()=>clearTimeout(timer)},[retry]);
    useEffect(()=>()=>{if(image)URL.revokeObjectURL(image)},[image]);
    const recordReady=useCallback(()=>{if(!proof||recorded.current)return;recorded.current=true;setRecordError('');void fetch('/api/business-v31/public-viewed?token='+encodeURIComponent(token),{method:'POST',headers:{'Content-Type':'application/json','X-Result-Proof':proof},body:JSON.stringify({visitId})}).then(async r=>{if(!r.ok)throw Error((await r.json()).error||'访问记录保存失败，请重试。')}).catch(e=>{recorded.current=false;setRecordError(e.message)})},[token,proof,visitId]);
    const verify=async()=>{setBusy(true);setFeedback(null);try{
        const r=await business('public-verify?token='+encodeURIComponent(token),{phone,code,visitId});
        const res=await fetch('/api/business-v31/public-image?token='+encodeURIComponent(token),{headers:{'X-Result-Proof':r.proof}});if(!res.ok)throw Error('成果访问权限失效。');
        const blob=await res.blob();let result:PreviewModel|null=null;
        if(r.artifact.kind==='model'){const mr=await fetch('/api/business-v31/public-model?token='+encodeURIComponent(token),{headers:{'X-Result-Proof':r.proof}});if(!mr.ok)throw Error('三维成果暂不可用。');result=await mr.json()}
        setProof(r.proof);setModel(result);setInfo(r.artifact.name);setImage(URL.createObjectURL(blob));
    }catch(e){setFeedback({status:'error',text:(e as Error).message})}finally{setBusy(false)}};
    const sendCode=async()=>{setFeedback(null);try{await business('public-code?token='+encodeURIComponent(token),{phone});setRetry(60);setFeedback({status:'success',text:'验证码已发送。'})}catch(e){setFeedback({status:'error',text:(e as Error).message})}};
    return <main className="business-public"><img className="business-public-logo" src="/assets/clinivol-logo-light.png" alt="科立沃"/><Card bordered={false}><h1>订单成果查看</h1>{image?<><p>{info}</p>{model?<ReadOnlyModel model={model} onReady={recordReady}/>:<ReadOnlyPreview src={image} onReady={recordReady}/>}</>:<><p>{info}</p><Form className="business-code-form" labelAlign="top" onSubmit={()=>void verify()}><Form.FormItem label="手机号"><Input value={phone} onChange={value=>{setPhone(value);setFeedback(null)}}/></Form.FormItem><Form.FormItem label="短信验证码" status={feedback?.status} tips={feedback?.text}><div className="business-code-row"><Input value={code} onChange={value=>{setCode(value);setFeedback(null)}}/><Button theme="default" variant="outline" disabled={retry>0} onClick={()=>void sendCode()}>{retry?`${retry}s`:'获取验证码'}</Button></div></Form.FormItem><Button type="submit" theme="primary" loading={busy} disabled={!opened}>验证并查看</Button></Form></>}{error&&<Alert theme="error" message={error}/>} {recordError&&<Alert theme="error" message={<>{recordError}<Button variant="text" onClick={recordReady}>重试</Button></>}/>}</Card></main>;
}
export function StageShare({ orderId, stage, completed, data }: {
    orderId: string;
    stage: string;
    completed: boolean;
    data: SalesData;
}) {
    const codeRef = useRef<HTMLDivElement>(null);
    const [artifact, setArtifact] = useState<any>(null), [share, setShare] = useState<any>(null), [error, setError] = useState(''),[recordsOpen,setRecordsOpen]=useState(false),[recordsPending,setRecordsPending]=useState(false),[stats,setStats]=useState<ShareStats|null>(null);
    useEffect(()=>{if(!share)return;let active=true;const load=()=>void business('share-records?token='+encodeURIComponent(share.token)).then(r=>{if(active)setStats(r.stats)}).catch(e=>{if(active)setError(e.message)});load();const timer=setInterval(load,5000);return()=>{active=false;clearInterval(timer)}},[share]);
    const copied=async(kind:'link'|'image')=>{const eventId=crypto.randomUUID();let failure:unknown;for(let i=0;i<2;i++){try{const r=await business('share-copy',{token:share.token,eventId,kind});setStats(r.stats);void MessagePlugin.success(kind==='link'?'分享链接已复制':'二维码图片已复制');return}catch(e){failure=e}}setError('复制已完成，但记录保存失败，请重试。');console.error(failure)};
    useEffect(() => {
        let active = true;
        setArtifact(null);
        if (completed)
            void syncOrders(data).then(() => business('artifacts?orderId=' + encodeURIComponent(orderId))).then(r => {
                if (active)
                    setArtifact(r.artifacts.find((a: any) => a.stage === stage && a.status === '审核通过' && a.publishStatus === 'published') || null);
            }).catch(() => { });
        return () => { active = false; };
    }, [orderId, stage, completed, data]);
    if (!artifact || !completed)
        return null;
    return <><Button className="sales-stage-share" theme="primary" variant="text" icon={<QrcodeIcon size={16}/>} onClick={() => void business('share', { orderId, stage, resultId: artifact.id, resultVersion: artifact.version }).then(value => { setError(''); setStats(value.stats); setShare(value); }).catch(e => { setError(e.message); void MessagePlugin.error(e.message); })}>分享二维码</Button><Dialog visible={!!share&&!recordsOpen&&!recordsPending} header={stage + '成果分享'} footer={false} closeOnEscKeydown={!recordsOpen&&!recordsPending} closeOnOverlayClick={!recordsOpen&&!recordsPending} onClosed={()=>{if(recordsPending){setRecordsOpen(true);setRecordsPending(false)}}} onClose={()=>setShare(null)}>{share && <div className="sales-invite stage-share-content"><div className="stage-share-code" ref={codeRef}><QRCode value={share.url} type="canvas" size={196}/></div><p className="sales-invite-description">扫码验证手机号后，即可查看设计成果。</p><div className="sales-invite-actions"><Button theme="default" variant="outline" onClick={() => void navigator.clipboard.writeText(share.url).then(() => copied('link')).catch(() => setError('复制失败，请重试。'))}>复制分享链接</Button><Button theme="primary" onClick={() => { const canvas = codeRef.current?.querySelector('canvas'); if (!canvas || !navigator.clipboard?.write || !window.ClipboardItem) {
        setError('当前浏览器不支持直接复制，请右键复制二维码图片。');
        return;
    } canvas.toBlob(blob => { if (blob)
        void navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(() => copied('image')).catch(() => setError('复制失败，请右键复制二维码图片。')); }); }}>复制二维码图片</Button></div><div className="stage-share-record-entry"><span>{stats?.lastViewedAt?'最近查看：'+formatDateTime(stats.lastViewedAt):'暂无查看记录'}</span><Button theme="default" variant="text" onClick={()=>setRecordsPending(true)}>查看分享记录<ChevronRightIcon size={16}/></Button></div>{error && <Alert theme="error" message={error}/>}</div>}</Dialog><ShareRecordsDrawer visible={recordsOpen} token={share?.token||''} onClose={()=>setRecordsOpen(false)} onStats={setStats}/></>;
}
