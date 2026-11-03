import type { ReactNode } from 'react'
import type { TaskType } from '../App'
import { CliniVolIcon } from './CliniVolIcon'

// A shared 18px optical field: fewer strokes, no overlapping miniature symbols.
const geometry: Record<TaskType, ReactNode> = {
  三维重建: <><path d="m3 7 9-4 9 4-9 4Z"/><path d="m3 12 9 4 9-4M3 17l9 4 9-4"/></>,
  'CAD 设计': <><path d="m5 7 7-4 7 4v10l-7 4-7-4Zm0 0 7 4 7-4M12 11v10"/><path d="M3 3h3M3 3v3m15 15h3v-3"/></>,
  有限元分析: <><rect x="4" y="6" width="15" height="15" rx="1"/><path d="M4 6l15 15M4 21 19 6M4 13.5h15M11.5 6v15M12 2v4m-2-2 2 2 2-2"/></>,
  '3D 打印': <><path d="M4 20V4h16v16M2 21h20M9 4v5l3 3 3-3V4M12 12v3"/><path d="M8 17h8M7 19h10"/></>,
}
export function DesignStageIcon({ stage }: { stage: TaskType }) {
  return <CliniVolIcon size={20}>{geometry[stage]}</CliniVolIcon>
}
