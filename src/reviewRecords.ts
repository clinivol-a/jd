import type { FlowEvent, Task } from './App'
import { legacyTimestamp, timestamp } from './dateTime'
import { projectEvents, projectsFor } from './projects/projectModel'

export type ReviewStatus = '已提交审核' | '提交审核' | '审核通过' | '审核退回'
export function isReviewStatus(status: string): status is ReviewStatus {
  return ['已提交审核', '提交审核', '审核通过', '审核退回'].includes(status)
}
/** One review-only projection for original tasks, saved records and demo projects.
 * Task activity remains in the event store; reviewer/actor identities are never rewritten.
 */
export function reviewRecords(tasks: Task[], events: FlowEvent[]) {
  const records = tasks.flatMap(task => task.review.flatMap((review, index) => isReviewStatus(review.status)
    ? [{ ...review, task, recordId: `${task.id}-${index}-${review.time}`, at: legacyTimestamp(review.time) }] : []))
  const mirrored = new Set<string>()
  const taskRecords = [...records]
  for (const project of projectsFor(tasks, events)) {
    for (const event of projectEvents(project, events)) {
      const task = tasks.find(item => item.id === event.taskId)
      const isReviewEvent = /^(review-(?:submit|pass|return|history|\d+))$/.test(event.type)
      if (!task || !isReviewEvent || !isReviewStatus(event.name)) continue
      // Flow and task.review are two projections of the same submission/decision.
      const represented = taskRecords.find(record => !mirrored.has(record.recordId) && record.task.id === task.id && record.actor === event.actor && record.status.replace(/^已/, '') === event.name.replace(/^已/, '') && (
        record.submissionId && record.submissionId === event.submissionId ||
        Number.isFinite(timestamp(record.at)) && Math.floor(timestamp(record.at) / 60000) === Math.floor(timestamp(event.at) / 60000)
      ))
      if (represented) mirrored.add(represented.recordId)
      else records.push({ task, recordId: event.id, time: event.at, at: event.at, actor: event.actor, status: event.name, note: event.description, version: event.version, submissionId: event.submissionId })
    }
  }
  return records.sort((a, b) => timestamp(b.at) - timestamp(a.at) || b.recordId.localeCompare(a.recordId))
}
