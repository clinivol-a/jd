import type { ReactNode } from 'react'
import type { TaskType } from '../App'
import { BoneRebuildIcon } from './MedicalToolIcon'
import { CliniVolIcon } from './CliniVolIcon'

// A shared 18px optical field: fewer strokes, no overlapping miniature symbols.
const geometry: Record<TaskType, ReactNode> = {
  三维重建: <><path d="m3 7 9-4 9 4-9 4Z"/><path d="m3 12 9 4 9-4M3 17l9 4 9-4"/></>,
  'CAD 设计': <><path d="m5 8 7-4 7 4v9l-7 4-7-4Zm0 0 7 4 7-4M12 12v9"/><path d="M3 3h4M3 3v4m14 14h4v-4"/></>,
  有限元分析: <><path d="m4 6 7-3 9 4-2 13-12 1Zm0 0 7 7 9-6M6 21l5-8 7 7M11 3v10"/><path d="M1 13h5m-2-2 2 2-2 2"/></>,
  '3D 打印': <><path d="M4 20V3h16v17M2 21h20M9 3v5l3 3 3-3V3M12 11v3"/><path d="M8 16h8M7 18h10"/></>,
}
export function DesignStageIcon({ stage }: { stage: TaskType }) {
  if(stage==='三维重建') return <BoneRebuildIcon size={20}/>
  return <CliniVolIcon size={20}>{geometry[stage]}</CliniVolIcon>
}
