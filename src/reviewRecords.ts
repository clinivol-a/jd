import type { FlowEvent, Task } from './App'
import { legacyTimestamp, timestamp } from './dateTime'
import { projectEvents, projectsFor, projectNumber } from './projects/projectModel'

export type ReviewStatus = '已提交审核' | '提交审核' | '审核通过' | '审核退回'
export function isReviewStatus(status: string): status is ReviewStatus {
  return ['已提交审核', '提交审核', '审核通过', '审核退回'].includes(status)
}
/** One review-only projection for original tasks, saved records and demo projects.
 * Task activity remains in the event store; reviewer/actor identities are never rewritten.
 */
export function reviewRecords(tasks: Task[], events: FlowEvent[]) {
  const projects=projectsFor(tasks,events)
  const byTask=new Map(projects.flatMap(project=>project.tasks.map(task=>[task.id,project] as const)))
  const records = tasks.flatMap(task => task.review.flatMap((review, index) => isReviewStatus(review.status)
    ? [{ ...review, eventId:undefined as string|undefined, task, recordId: `${task.id}-${index}-${review.time}`, at: legacyTimestamp(review.time) }] : []))
  const mirrored = new Set<string>()
  const taskRecords = [...records]
  for (const project of projects) {
    for (const event of projectEvents(project, events)) {
      const task = tasks.find(item => item.id === event.taskId)
      const isReviewEvent = /^(review-(?:submit|pass|return|history|\d+))$/.test(event.type)
      if (!task || !isReviewEvent || !isReviewStatus(event.name)) continue
      // Flow and task.review are two projections of the same submission/decision.
      const represented = taskRecords.find(record => !mirrored.has(record.recordId) && record.task.id === task.id && record.actor === event.actor && record.status.replace(/^已/, '') === event.name.replace(/^已/, '') && (
        record.submissionId && record.submissionId === event.submissionId ||
        Number.isFinite(timestamp(record.at)) && Math.floor(timestamp(record.at) / 60000) === Math.floor(timestamp(event.at) / 60000)
      ))
      if (represented) { mirrored.add(represented.recordId); Object.assign(represented, {eventId:event.id}) }
      else records.push({ reviewerIdentity: undefined, eventId:event.id, task, recordId: event.id, time: event.at, at: event.at, actor: event.actor, status: event.name, note: event.description, version: event.version, submissionId: event.submissionId })
    }
  }
  return records.map(record=>{const project=byTask.get(record.task.id);return {...record,projectId:project?.id||record.task.projectId||record.task.orderNo,orderId:project?.orderId||record.task.orderId,projectNumber:project?projectNumber(project):(record.task.businessNo||(!record.task.sharedBusiness?record.task.orderNo:'-')),hospital:project?.hospital||record.task.hospital||'-',patientName:project?.patientName||record.task.patientName||'-',reviewerName: /^(已)?提交审核$/.test(record.status) ? '-' : record.reviewerIdentity?.name || record.actor || '-', submitter: /^(已)?提交审核$/.test(record.status) ? record.actor : undefined}}).sort((a, b) => timestamp(b.at) - timestamp(a.at) || b.recordId.localeCompare(a.recordId))
}

export function filterReviewRecords(records:ReturnType<typeof reviewRecords>,filters:{project:string;stage:string;status:string}) {
  return records.filter(record=>(!filters.project||record.projectNumber.toLowerCase().includes(filters.project.trim().toLowerCase()))&&(!filters.stage||record.task.taskType===filters.stage)&&(!filters.status||record.status===filters.status))
}
