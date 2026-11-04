/** Display in the user's local timezone; never sort by display text. */
const pad = (value: number) => String(value).padStart(2, '0')
export const localDay = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
export function parseTimestamp(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/.test(value)) return null
  const [year, month, day, hour, minute, second = 0] = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/)!.slice(1).map(part => Number(part ?? 0))
  const calendar = new Date(Date.UTC(year, month - 1, day))
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day || hour > 23 || minute > 59 || second > 59) return null
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date : null
}
export const timestamp = (value: string | null | undefined) => parseTimestamp(value)?.getTime() ?? -Infinity
export const clockTime = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`
export function formatDate(value: string | null | undefined): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return parseTimestamp(value + 'T00:00:00') ? value : '—'
  const date = parseTimestamp(value)
  return date ? localDay(date) : '—'
}
/** Legacy seed records belong to the explicitly dated 2026 prototype, not the year of viewing. */
export function legacyTimestamp(value: string | null | undefined): string {
  if (parseTimestamp(value)) return value!
  const match = value?.match(/^(?:(\d{4})[年/-]\s*)?(\d{1,2})\s*(?:月|\/)\s*(\d{1,2})\s*日?\s+(\d{1,2}):(\d{2})$/)
  if (!match) return ''
  const result = `${match[1] ?? '2026'}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}T${match[4].padStart(2, '0')}:${match[5]}:00`
  return parseTimestamp(result) ? result : ''
}
export function formatAuditTime(value: string | null | undefined, now = new Date()): string {
  const date = parseTimestamp(value)
  if (!date) return '—'
  const calendar = localDay(date)
  return `${date.getFullYear() === now.getFullYear() ? calendar.slice(5) : calendar} ${clockTime(date)}`
}
export function formatDynamicTime(value: string | null | undefined, now = new Date()): string {
  const date = parseTimestamp(value)
  if (!date) return ''
  const elapsed = now.getTime() - date.getTime()
  if (elapsed < 0 || !Number.isFinite(elapsed) || localDay(date) !== localDay(now)) return formatAuditTime(value, now)
  if (elapsed < 60000) return '刚刚'
  if (elapsed < 3600000) return `${Math.floor(elapsed / 60000)}分钟前`
  return clockTime(date)
}
export function formatOperationTime(value: string | null | undefined, now = new Date()): string {
  const date = parseTimestamp(value)
  return date ? localDay(date) === localDay(now) ? clockTime(date) : formatAuditTime(value, now) : '—'
}
export function formatOperation(value: string | null | undefined, actor: string, now = new Date()): string {
  // Old prototype activity rows contain a clock only; preserve it without inventing a day.
  const legacyClock = value && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : ''
  return `${legacyClock || formatOperationTime(value, now)} · ${actor}`
}
export function formatSavedTime(value: string | null | undefined, now = new Date()): string {
  return parseTimestamp(value) ? formatOperationTime(value, now) : ''
}
export function formatDateTime(value: string | null | undefined): string {
  const date = parseTimestamp(value)
  return date ? `${localDay(date)} ${clockTime(date)}` : formatDate(value)
}
