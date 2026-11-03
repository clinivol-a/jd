import type { ReactNode } from 'react'
import type { TaskType } from '../App'
import { CliniVolIcon } from './CliniVolIcon'
const geometry: Record<TaskType, ReactNode> = {
  三维重建: <><path d="m3 7 7-4 7 4-7 4Zm0 5 7 4 7-4M3 17l7 4 7-4M10 11v10"/><path d="m17 4 4 2v8l-4 2"/></>,
  'CAD 设计': <><path d="m5 6 7-4 7 4v12l-7 4-7-4Zm0 0 7 4 7-4M12 10v12"/><path d="M2 4v16M1 4h3m-3 16h3M9 13l3-2 3 2v5l-3 2-3-2Z"/></>,
  有限元分析: <><path d="M3 7h14v14H3Zm0 0 14 14M3 21 17 7M3 14h14M10 7v14M12 3h9m-3-2 3 2-3 2"/></>,
  '3D 打印': <><path d="M4 21V3h16v18M2 21h20M8 3v5h8V3M10 8l2 3 2-3M7 18l5-3 5 3-5 3Zm0-4 5-3 5 3"/></>,
}
export function DesignStageIcon({stage}:{stage:TaskType}) { return <CliniVolIcon size={20}>{geometry[stage]}</CliniVolIcon> }
