import { forwardRef } from 'react'
import type { ReactNode } from 'react'
import { CliniVolIcon } from './CliniVolIcon'
import type { CliniVolIconProps } from './CliniVolIcon'
const make=(paths:ReactNode)=>forwardRef<SVGSVGElement,CliniVolIconProps>(function SemanticIcon(props,ref){return <CliniVolIcon {...props} ref={ref}>{paths}</CliniVolIcon>})
export const MaskRegionIcon=make(<><rect x="3" y="3" width="18" height="18"/><path d="M7 11c0-5 7-5 7-1 5 0 5 7 0 7H9c-3 0-4-4-2-6Z"/></>)
export const ReferencePlaneIcon=make(<><path d="m3 13 10-6 8 4-10 6ZM12 3v4m0 10v4"/></>)
export const BooleanUnionIcon=make(<path d="M4 4h10v6h6v10H10v-6H4Z"/>)
export const MaskSplitIcon=make(<><path d="M9 4H3v16h6M15 4h6v16h-6M12 3v3m0 3v3m0 3v3m0 3v1M5 12h4m6 0h4"/></>)
export const VolumeStatisticsIcon=make(<><path d="m3 6 5-3 5 3v6l-5 3-5-3Zm0 0 5 3 5-3M8 9v6M15 21h7m-6-3v-3m3 3v-7m3 7V8"/></>)
export const StlStatisticsIcon=make(<><path d="M4 3h10l5 5v13H4ZM14 3v5h5"/><path d="m7 16 4-5 5 7H7Zm4-5 1 7"/></>)
