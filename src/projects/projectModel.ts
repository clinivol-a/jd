import { localDay, parseTimestamp, timestamp, formatAuditTime, formatDynamicTime, formatDateTime } from '../dateTime'
export { formatDate } from '../dateTime'
import type { Task, TaskStatus, TaskType, FlowEvent, Notice } from '../App'
export const CURRENT_ENGINEER = 'CV-DS-028'
export const stages: TaskType[] = ['三维重建','CAD 设计','有限元分析','3D 打印']
export const statuses: TaskStatus[] = ['未开始','进行中','待审核','审核退回','已完成']
export type DateRange = [string,string]
export type Period = '3m'|'6m'|'12m'|'custom'|'month'
export type Filters = { view:'projects'|'tasks'; search:string; period:Period; range:DateRange; stage:'全部'|TaskType; status:'全部'|'待处理'|TaskStatus; page:number; source?:'a-statistics' }
export type Project = { id:string; name:string; createdAt:string; dueAt:string; patient:string; tasks:Task[]; hospital:string; dataOrigin:'demo'|'production'|'unknown'; createdSource:'project'|'first-task' }
export type ProjectTarget = { projectId:string; taskId?:string; eventId?:string }
// Explicitly scoped prototype hospital assignments; never infer production partnerships.
export const demoProjectMetadata:Record<string,{hospital:string;dataOrigin:'demo'}>={
 'CV260910-0184':{hospital:'安徽医科大学第一附属医院',dataOrigin:'demo'},
 'CV260908-0172':{hospital:'中国科学技术大学附属第一医院（安徽省立医院）',dataOrigin:'demo'},
 'CV260907-0168':{hospital:'安徽医科大学第一附属医院',dataOrigin:'demo'},
 'CV261019-0211':{hospital:'安徽医科大学第一附属医院',dataOrigin:'demo'},
 'CV261020-0226':{hospital:'中国科学技术大学附属第一医院（安徽省立医院）',dataOrigin:'demo'},
}
const originalCreated: Record<string,string> = {'CV260910-0184':'2026-10-09','CV260908-0172':'2026-10-07','CV260907-0168':'2026-10-06','CV261019-0211':'2026-10-19','CV261020-0226':'2026-10-20'}
export const day = localDay
export function periodRange(period:Period, now=new Date()):DateRange {
  const end=day(now)
  return period==='month'?[day(new Date(now.getFullYear(),now.getMonth(),1)),day(new Date(now.getFullYear(),now.getMonth()+1,0))]:[day(new Date(now.getFullYear(),now.getMonth()-({ '3m':2,'6m':5,'12m':11,custom:2 }[period]),1)),end]
}
export const defaultFilters = ():Filters => ({view:'projects',search:'',period:'3m',range:periodRange('3m'),stage:'全部',status:'全部',page:1})
export const ownerId = (task:Task) => task.owner.split('（')[0]==='陈屿' ? CURRENT_ENGINEER : 'CV-DS-OTHER'
export const owns = (task:Task) => ownerId(task)===CURRENT_ENGINEER
export const cleanOwner = (task:Task) => displayPerson(task.owner)
export function isoDisplayTime(text:string, now=new Date()):string {
  if(!text || text==='-')return ''
  if(/^\d{4}-\d\d-\d\d/.test(text))return text
  const time=text.match(/(\d{1,2}):(\d{2})/);const clock=time?`${time[1].padStart(2,'0')}:${time[2]}:00`:'00:00:00'
  if(text.includes('今天')||/^\d\d?:\d\d$/.test(text))return `${day(now)}T${clock}`
  if(text.includes('昨天')){const date=new Date(now);date.setDate(date.getDate()-1);return `${day(date)}T${clock}`}
  const match=text.match(/(\d+)\s*月\s*(\d+)\s*日/)
  return match?`2026-${match[1].padStart(2,'0')}-${match[2].padStart(2,'0')}T${clock}`:''
}
export const formatShortDateTime = formatAuditTime
export const formatRecent = formatDynamicTime
export function noticeTimestamp(notice:Notice,events:FlowEvent[]=[]):string {
 // Event identity is explicit: later reviews must not move an old notice's received time.
 return notice.createdAt??(notice.eventId?events.find(event=>event.id===notice.eventId)?.at:undefined)??(parseTimestamp(notice.time)?notice.time:'')
}
export const formatNoticeTime = formatDynamicTime
export const formatTime = formatDateTime
export function projectsFor(tasks:Task[],events:FlowEvent[],now=new Date()):Project[] {
  const groups=new Map<string,Task[]>()
  tasks.forEach(t=>groups.set(t.orderNo,[...(groups.get(t.orderNo)??[]),t]))
  return [...groups].filter(([,items])=>items.some(owns)).map(([id,items])=>{
    const name=items[0].title
    const metadata=demoProjectMetadata[id]
    const production=items.some(task=>task.dataOrigin==='production')
    const hospital=items.find(task=>task.hospital)?.hospital??(!production?metadata?.hospital:undefined)??'—'
    const createdAt=events.filter(e=>e.orderNo===id&&e.type==='created').map(e=>e.at.slice(0,10)).sort()[0]??originalCreated[id]??items.find(t=>t.catalogDemo)?.catalogCreatedAt??''
    const dueStamp=(at:string)=>timestamp(at.length===10?at+'T00:00:00':at)
    const dueAt=items.map(t=>isoDisplayTime(t.deadline,now)).filter(at=>Number.isFinite(dueStamp(at))).sort((a,b)=>dueStamp(a)-dueStamp(b)).at(-1)??''
  return {id,name,createdAt,dueAt,patient:items[0].patient,tasks:[...items].sort((a,b)=>stages.indexOf(a.taskType)-stages.indexOf(b.taskType)),hospital,dataOrigin:production?'production' as const:metadata||items.some(t=>t.dataOrigin==='demo')?'demo' as const:'unknown' as const,createdSource:'first-task' as const}
  }).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id))
}
export const inRange=(createdAt:string,range:DateRange)=> (!range[0]||createdAt>=range[0])&&(!range[1]||createdAt.slice(0,10)<=range[1])
export const statusMatches=(task:Task,status:Filters['status'])=>status==='全部'||status==='待处理'?(status==='全部'||task.status==='进行中'||task.status==='审核退回'):task.status===status
export function projectProgress(project:Project):string {
  if(project.tasks.every(t=>t.status==='已完成'))return '全部专业任务已完成'
  const current=project.tasks.filter(t=>['审核退回','进行中','待审核'].includes(t.status)).sort((a,b)=>Number(b.status==='审核退回')-Number(a.status==='审核退回'))
  return (current.length?current:project.tasks.filter(t=>t.status==='未开始')).map(t=>`${compactText(t.taskType)}${t.status}`).join(' · ')
}
export function filterProjects(projects:Project[],f:Filters):Project[] {
  return projects.filter(p=>inRange(p.createdAt,f.range)&&(!f.search||[p.name,p.id].some(v=>v.toLowerCase().includes(f.search.toLowerCase())))&&(f.stage==='全部'||p.tasks.some(t=>t.taskType===f.stage))&&(f.status==='全部'||p.tasks.some(t=>statusMatches(t,f.status))))
}
export function statisticsTasks(tasks:Task[],range:DateRange,events:FlowEvent[]=[]):Task[] {
 return [...new Map(tasks.map(t=>[t.id,t])).values()].filter(t=>{
  if(!owns(t))return false
  const dates=[parseTimestamp(t.updated),...events.filter(e=>e.taskId===t.id&&e.orderNo===t.orderNo).map(e=>parseTimestamp(e.at))].filter((d):d is Date=>!!d)
  const latest=dates.sort((a,b)=>b.getTime()-a.getTime())[0]
  return !!latest&&inRange(day(latest),range)
 })
}
export function filterTasks(projects:Project[],f:Filters,events:FlowEvent[]=[]):{project:Project;task:Task}[] {
 const eligible=f.source?new Set(statisticsTasks(projects.flatMap(p=>p.tasks),f.range,events).map(t=>t.id)):null
 return projects.filter(p=>(!!f.source||inRange(p.createdAt,f.range))&&(!f.search||[p.name,p.id].some(v=>v.toLowerCase().includes(f.search.toLowerCase())))).flatMap(project=>project.tasks.filter(t=>owns(t)&&(!eligible||eligible.has(t.id))&&(f.stage==='全部'||t.taskType===f.stage)&&statusMatches(t,f.status)).map(task=>({project,task})))
}
export function monthlyCounts(projects:Project[],now=new Date(),events:FlowEvent[]=[]) {
 return aDashboardCounts(projects.flatMap(p=>p.tasks),events,now)
}
export function latestTaskActivity(task:Task,events:FlowEvent[]):string {
  return [(/今天|昨天/.test(task.updated)&&events.some(e=>e.taskId===task.id)?'':isoDisplayTime(task.updated)),...events.filter(e=>e.taskId===task.id).map(e=>e.at)].filter(at=>parseTimestamp(at)).sort((a,b)=>new Date(a).getTime()-new Date(b).getTime()).at(-1)??''
}
export function recentProjects(projects:Project[],events:FlowEvent[],limit=3) {
  return projects.map(project=>{
    const times=project.tasks.flatMap(task=>[
      // Relative labels alone cannot establish a real project activity timestamp.
      parseTimestamp(task.updated)?task.updated:'',
      ...events.filter(event=>event.orderNo===project.id&&event.taskId===task.id).map(event=>event.at),
    ]).filter(at=>parseTimestamp(at)).sort((a,b)=>new Date(b).getTime()-new Date(a).getTime())
    return {project,at:times[0]??''}
  }).filter(row=>row.at).sort((a,b)=>new Date(b.at).getTime()-new Date(a.at).getTime()||a.project.id.localeCompare(b.project.id)).slice(0,limit)
}
export function noticeProjectTarget(notice:Notice,projects:Project[],events:FlowEvent[]):ProjectTarget|null {
  const event=notice.eventId?events.find(item=>item.id===notice.eventId):undefined
  const taskId=notice.taskId??event?.taskId
  const project=notice.projectId?projects.find(item=>item.id===notice.projectId):taskId?projects.find(item=>item.tasks.some(task=>task.id===taskId)):event?projects.find(item=>item.id===event.orderNo):undefined
  // Conflicting or inaccessible identities must never fall through to another project.
  if(!project||(taskId&&!project.tasks.some(task=>task.id===taskId))||(event&&(event.orderNo!==project.id||(taskId&&event.taskId!==taskId))))return null
  return {projectId:project.id,...(taskId?{taskId}:{}),...(event?{eventId:event.id}:{})}
}
export function sortedNotices(notices:Notice[],events:FlowEvent[] = []) {return [...notices].sort((a,b)=>(parseTimestamp(noticeTimestamp(b,events))?.getTime()??-Infinity)-(parseTimestamp(noticeTimestamp(a,events))?.getTime()??-Infinity)||b.id-a.id)}
export function canEnter(task:Task,tasks:Task[]) {
  if(task.status==='未开始')return false
  if(['已完成','待审核'].includes(task.status))return true
  if(!owns(task))return false
  if(task.taskType==='CAD 设计') {const upstream=tasks.find(t=>t.id===task.upstreamTaskId);return upstream?.status==='已完成'&&!!upstream.approvedModel}
  return true
}
export function taskAction(task:Task){return task.status==='已完成'?'查看成果':task.status==='待审核'?'查看提交成果':task.status==='审核退回'?'查看意见并修改':'继续设计'}
export function projectEvents(project:Project,events:FlowEvent[]) {
 const stored=events.filter(e=>e.orderNo===project.id)
 const mock=project.dataOrigin==='demo'&&project.tasks.some(t=>t.catalogDemo)?demoFlowEvents(project):[]
 return [...new Map([...mock,...stored].map(e=>[e.id,e])).values()].sort((a,b)=>(parseTimestamp(b.at)?.getTime()??-Infinity)-(parseTimestamp(a.at)?.getTime()??-Infinity)||b.id.localeCompare(a.id))
}
type DemoMilestone = 'linked'|'started'|'review-submit'|'review-return'|'review-pass'|'completed'
// Recorded initial demo history, not a projection of configured stages or live status.
// Later operations come from the event store and never rewrite this history.
const completedHistory:DemoMilestone[]=['started','review-submit','review-pass','completed']
const returnedHistory:DemoMilestone[]=['started','review-submit','review-return']
const demoHistory:Record<string,DemoMilestone[]>={
 'P301-1':completedHistory,'P301-2':['linked','started'],'P301-3':[],'P301-4':[],
 'P302-1':completedHistory,
 'P303-1':completedHistory,'P303-2':['linked','started','review-submit'],
 'P304-1':returnedHistory,
 'P305-1':completedHistory,'P305-2':['linked','started'],
 'P306-1':completedHistory,
 'P307-1':completedHistory,'P307-2':['linked','started','review-submit'],
 'P308-1':returnedHistory,
}
export function demoFlowEvents(project:Project):FlowEvent[] {
 if(project.dataOrigin!=='demo')return []
 const seed=withDemoProjects([]).find(p=>p.id===project.id)
 if(!seed)return []
 const rows:FlowEvent[]=[]
 const add=(task:Task,key:string,name:string,description:string,offset:number)=>rows.push({id:`${task.id}-catalog-${key}`,orderNo:seed.id,taskId:task.id,type:key,name,description,at:new Date(new Date(seed.createdAt+'T08:00:00').getTime()+offset*60000).toISOString(),actor:key==='review-return'?'周医生':key==='review-pass'?'管理员':'陈屿',role:key==='review-return'?'医生':key==='review-pass'?'管理员':'工程师'})
 const first=seed.tasks[0];if(!first)return rows
 add(first,'project-created','项目已创建','项目已创建',0)
 seed.tasks.forEach((t,i)=>{
  add(t,'assigned','任务已分配','分配给陈屿',i+1)
  const base=20+i*120
  for(const milestone of demoHistory[t.id]??[]){
   if(milestone==='linked')add(t,milestone,'上游成果已解锁','已关联上游正式成果',base)
   if(milestone==='started')add(t,milestone,`${t.taskType}任务已开始`,'任务已开始',base+1)
   if(milestone==='review-submit')add(t,milestone,'已提交审核','成果已提交审核',base+20)
   if(milestone==='review-return')add(t,milestone,'审核退回','请处理审核意见',base+30)
   if(milestone==='review-pass')add(t,milestone,'审核通过','正式成果已确认并锁定',base+30)
   if(milestone==='completed')add(t,milestone,'任务已完成','任务已完成',base+31)
  }
 });return rows
}

export function aDashboardCounts(tasks:Task[],events:FlowEvent[]=[],now=new Date()) {
 const mine=statisticsTasks(tasks,periodRange('month',now),events)
 return {待处理:mine.filter(t=>statusMatches(t,'待处理')).length,进行中:mine.filter(t=>t.status==='进行中').length,待审核:mine.filter(t=>t.status==='待审核').length,审核退回:mine.filter(t=>t.status==='审核退回').length,已完成:mine.filter(t=>t.status==='已完成').length}
}
export function projectStatus(project:Project):TaskStatus {
 if(project.tasks.every(t=>t.status==='已完成'))return '已完成'
 for(const status of ['审核退回','进行中','待审核'] as const)if(project.tasks.some(t=>t.status===status))return status
 return '未开始'
}
export const compactText=(text:string)=>text.replace(/CAD\s+设计/g,'CAD设计').replace(/3D\s+打印/g,'3D打印').replace(/版本\s*V\d+\b/g,'成果').replace(/\s+V\d+\b/g,'').replace(/([\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])/g,'$1')

export function displayPerson(value:string) {
 const name=value.split('（')[0]
 return !name||['刘工','张工','某工程师'].includes(name)?'—':name
}

// Presentation-only catalog: no engineering assets, no writes to task/audit stores.
export function withDemoProjects(existing:Project[]):Project[] {
 if(existing.some(p=>p.dataOrigin==='production'))return existing
 const names=['颌面联合修复规划','颅颌面重建项目','下颌骨精准修复','眶颧复合体修复','颅骨缺损修复','上颌骨重建规划','颌骨联合设计','下颌角修复规划']
 const hospitals=['安徽医科大学第一附属医院','安徽省立医院','中国科学技术大学附属第一医院','合肥市第一人民医院','蚌埠医学院第一附属医院']
 const states:TaskStatus[]=['进行中','已完成','待审核','审核退回','进行中','已完成','待审核','审核退回']
 const catalog=names.map((name,i):Project=>{
  const id=`CV26110${2-i%2}-${String(301+i).padStart(4,'0')}`,createdAt=`2026-11-0${2-i%2||1}`
  const types=i===0?stages:i%2===0?stages.slice(0,2):stages.slice(0,1)
  const items=types.map((taskType,j):Task=>({id:`P${301+i}-${j+1}`,title:name,patient:`CV-P-2026-${301+i}`,orderNo:id,surgery:'术前结构评估、修复设计及成果确认。',taskType,status:i===0?(j===0?'已完成':j===1?'进行中':'未开始'):j===0&&types.length>1?'已完成':states[i],catalogDemo:true,catalogCreatedAt:createdAt,owner:'陈屿',updated:`${createdAt}T${String(9+i).padStart(2,'0')}:20:00`,deadline:'2026-11-20T18:00:00',series:[{id:`${id}-series`,name:'头颌面 CT',modality:'CT',format:'DICOM',slices:742,thickness:'0.625 mm',studyId:`${id}-study`,studyName:'头颌面 CT',studyDate:createdAt,description:'头颌面结构影像'}],source:'项目关联资料',hospital:hospitals[i%hospitals.length],dataOrigin:'demo',review:[]}))
  items.forEach((t,j)=>{if(j>0){t.upstreamTaskId=items[j-1].id;if(t.taskType==='CAD 设计')t.approvedModel=items[j-1].approvedModel}if(t.status==='已完成')t.approvedModel={id:`${t.id}-result`,name:`${t.title}成果`,version:'V01',approvedAt:createdAt,approvedBy:'管理员'}})
  return {id,name,createdAt,dueAt:'2026-11-20',patient:items[0].patient,tasks:items,hospital:items[0].hospital!,dataOrigin:'demo',createdSource:'project'}
 })
 return [...existing,...catalog.filter(p=>!existing.some(e=>e.id===p.id))].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id))
}
