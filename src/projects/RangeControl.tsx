import { useState } from 'react'
import { Button, DateRangePickerPanel, Input, Popup } from 'tdesign-react'
import { CalendarIcon, ChevronDownIcon } from '../design-system/tdesign'
import { periodRange } from './projectModel'
import type { DateRange, Period } from './projectModel'

export function validRange(range: DateRange) {
  return range.every(value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value) && range[0] <= range[1]
}

// Calendar edits are a draft. Only this component's confirm action commits a filter.
export function RangeControl({ period, range, onChange }: { period: Period; range: DateRange; onChange: (period: Period, range: DateRange) => void }) {
  const [open, setOpen] = useState(false)
  const [picking, setPicking] = useState(false)
  const [draft, setDraft] = useState<DateRange>(range)
  const [draftPeriod, setDraftPeriod] = useState<Period>(period)
  const show = (visible: boolean) => {
    if (visible) { setDraft(validRange(range) ? [...range] : periodRange('3m')); setDraftPeriod(period) }
    setPicking(false); setOpen(visible)
  }
  return <Popup visible={open} trigger="click" placement="bottom-right" popperOptions={{modifiers:[{name:"preventOverflow",options:{padding:8,altAxis:true,tether:false}}]}} onVisibleChange={show} overlayClassName="project-range-popup" content={<div className="project-date-panel" onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false) } }}>
    <div className="project-date-inputs">
      {(['开始日期', '结束日期'] as const).map((label, index) => <label key={label}><span>{label}</span><Input aria-label={label} value={draft[index]} placeholder="YYYY-MM-DD" onChange={value => { setDraft(old => index === 0 ? [String(value), old[1]] : [old[0], String(value)]); setDraftPeriod('custom'); setPicking(false) }} /></label>)}
    </div>
    <DateRangePickerPanel key={String(open)} value={validRange(draft) ? draft : []} format="YYYY-MM-DD" firstDayOfWeek={1} onCellClick={() => setPicking(true)} onChange={value => { setDraft(value as DateRange); setDraftPeriod('custom'); setPicking(false) }} />
    <div className="project-date-footer"><div className="project-date-presets">{(['3m', '6m', '12m'] as const).map((value, index) => <Button key={value} variant="text" aria-pressed={draftPeriod === value} theme={draftPeriod === value ? 'primary' : 'default'} onClick={() => { setDraft(periodRange(value)); setDraftPeriod(value); setPicking(false) }}>{['近三个月', '近六个月', '近一年'][index]}</Button>)}</div><div className="project-date-actions"><Button variant="outline" onClick={() => setOpen(false)}>取消</Button><Button theme="primary" disabled={picking || !validRange(draft)} onClick={() => { onChange(draftPeriod, [...draft]); setOpen(false) }}>确认</Button></div></div>
  </div>}>
    <Button className="project-range-trigger" variant="outline" icon={<CalendarIcon size={16} />} aria-label="项目创建时间范围" aria-expanded={open}>{range[0] && range[1] ? `${range[0]} — ${range[1]}` : '选择日期范围'}<ChevronDownIcon size={14} /></Button>
  </Popup>
}
