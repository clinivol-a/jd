import {Tooltip,Empty} from 'tdesign-react';
import {formatAuditTime,formatDateTime} from '../dateTime';
import {doctorHistory} from './doctorDisplay.mjs';
import type {DoctorHistoryEvent} from './doctorDisplay.mjs';
import './doctorDetails.css';
export type CredentialFile={id:string;name:string;category:string;submittedBy?:string;at?:string};
export function DoctorMaterials({files,certificate,showCertificate=true,onPreview,busy=false}:{files:CredentialFile[];certificate?:string;showCertificate?:boolean;onPreview:(id:string)=>void;busy?:boolean}){
 return <dl className="project-info-grid doctor-credential-fields">{showCertificate&&certificate&&<div><dt>执业证书编号</dt><dd>{certificate}</dd></div>}{[['身份证明','identity'],['执业证明材料','practice'],['其他附件','other']].map(([label,category])=><div key={category}><dt>{label}</dt><dd>{files.filter(f=>f.category===category||f.category===label).length?files.filter(f=>f.category===category||f.category===label).map(file=><div className="doctor-credential-file" key={file.id}><Tooltip content={file.name}><button type="button" className="doctor-credential-name" disabled={busy} onClick={()=>onPreview(file.id)}>{file.name}</button></Tooltip><span className="doctor-credential-meta">{file.submittedBy||'提交人未记录'} · {file.at?formatAuditTime(file.at):'提交时间未记录'} 提交</span></div>):<span>暂无附件</span>}</dd></div>)}</dl>;
}
export function DoctorTimeline({events,doctorId}:{events:DoctorHistoryEvent[];doctorId:string}){
 const rows=doctorHistory(events,doctorId);
 return rows.length?<ol className="timeline doctor-history">{rows.map(e=><li className="timeline-item" key={e.id}><i/><div><strong>{e.title}</strong><p><span className="timeline-meta">{formatDateTime(e.at)} · {e.actor||'操作人未记录'}</span>{e.detail&&<span className="timeline-note">{e.detail}</span>}</p></div></li>)}</ol>:<Empty title="暂无操作记录" description={null}/>;
}
