import type { ReactNode } from 'react'
import type { TaskType } from '../App'
import { CliniVolIcon } from './CliniVolIcon'

// Final reference: one geometric reconstruction solid with two slice lines,
// isometric CAD cube, three-branch analysis network, and layered printer.
const geometry: Record<TaskType, ReactNode> = {
  三维重建: <><path d="m6 5 6-3 6 3-6 3Zm0 0v6l6 3 6-3V5M12 8v6"/><path d="M5 18h14M7 21h10"/></>,
  'CAD 设计': <path d="m4 7 8-4 8 4v10l-8 4-8-4Zm0 0 8 5 8-5M12 12v9"/>,
  有限元分析: <><path d="m7 7 5 4 5-4M12 11v5.5"/><circle cx="5" cy="5" r="2.5"/><circle cx="19" cy="5" r="2.5"/><circle cx="12" cy="19" r="2.5"/></>,
  '3D 打印': <><path d="M4 20V3h16v17M2 21h20M9 3v5l3 3 3-3V3M12 11v3"/><path d="M8 16h8M7 18h10"/></>,
}
export function DesignStageIcon({ stage }: { stage: TaskType }) {
  return <CliniVolIcon size={20}>{geometry[stage]}</CliniVolIcon>
}
