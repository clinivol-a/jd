import type { Screen } from '../App'
export function readProjectRoute():Screen {
  const [path,query]=window.location.hash.replace(/^#/,'').split('?');const [kind,id]=path.split('/');const params=new URLSearchParams(query)
  if(kind==='projects')return {kind:'tasks'}
  if(kind==='project'&&id)return {kind:'project',projectId:decodeURIComponent(id),taskId:params.get('taskId')||undefined,eventId:params.get('eventId')||undefined}
  if(['task','workspace','cad'].includes(kind)&&id)return {kind:kind==='task'?'detail':kind==='cad'?'cad-workspace':'workspace',taskId:decodeURIComponent(id)}
  if(kind==='reviews')return {kind:'reviews'}
  return {kind:'home'}
}
export function projectUrl(screen:Screen) {
  const focus=new URLSearchParams()
  if(screen.kind==='project'){if(screen.taskId)focus.set('taskId',screen.taskId);if(screen.eventId)focus.set('eventId',screen.eventId)}
  return screen.kind==='tasks'?'#projects':screen.kind==='project'?`#project/${encodeURIComponent(screen.projectId)}${focus.size?`?${focus}`:''}`:screen.kind==='detail'?`#task/${screen.taskId}`:screen.kind==='workspace'?`#workspace/${screen.taskId}`:screen.kind==='cad-workspace'?`#cad/${screen.taskId}`:screen.kind==='reviews'?'#reviews':'#home'
}
