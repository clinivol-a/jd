import { forwardRef } from 'react'
import type { ReactNode } from 'react'
import { CliniVolIcon } from './CliniVolIcon'
import type { CliniVolIconProps } from './CliniVolIcon'
const bone=<path d="M7 4a2.5 2.5 0 0 0-4 3l2 2 10 10 2 2a2.5 2.5 0 0 0 3-4 2.5 2.5 0 0 0-3-4l-2 1-5-5 1-2a2.5 2.5 0 0 0-4-3Z"/>
const lungs=<path d="M10 5C7 5 3 11 3 17c0 3 5 2 7 0V5Zm4 0c3 0 7 6 7 12 0 3-5 2-7 0V5Z"/>
function icon(name:string,paths:ReactNode) { return forwardRef<SVGSVGElement,CliniVolIconProps>(function MedicalIcon(props,ref){return <CliniVolIcon {...props} ref={ref} data-medical-icon={name}>{paths}</CliniVolIcon>}) }
export const BoneRebuildIcon=icon('bone',bone)
export const AiBoneIcon=icon('ai-bone',<><path d="M5 9a2 2 0 0 0-3 3l2 1 6 6 1 2a2 2 0 0 0 3-3 2 2 0 0 0 3-3l-2-1-6-6-1-2a2 2 0 0 0-3 3Z"/><path d="m18 2 1.3 3.7L23 7l-3.7 1.3L18 12l-1.3-3.7L13 7l3.7-1.3Z"/></>)
export const OrganIcon=icon('organ',<><path d="M12 7C7 1 1 8 5 13l7 8 7-8c4-5-2-12-7-6Z"/><path d="M12 7v5l4 3M12 12l-4 3"/></>)
export const LungVesselIcon=icon('lung-vessel',<>{lungs}<path d="M12 2v8m0-2-5 5m5-5 5 5M7 13l-1 3m11-3 1 3"/></>)
export const BronchusIcon=icon('bronchus',<><path d="M10 2v7l-6 6m10-13v7l6 6M10 4h4m-4 3h4M4 15l-2 4m2-4 4 3m12-3 2 4m-2-4-4 3M8 18v4m8-4v4"/></>)
export const AbdomenIcon=icon('abdomen',<><path d="M6 2C4 7 3 16 6 22m12-20c2 5 3 14 0 20"/><path d="M9 7C3 8 6 15 9 13c2-2-2-3 0-6Zm6 0c6 1 3 8 0 6-2-2 2-3 0-6ZM8 17h8m-8 3h8"/></>)
export const SpineRibsIcon=icon('spine-ribs',<><rect x="10" y="3" width="4" height="4"/><rect x="10" y="10" width="4" height="4"/><rect x="10" y="17" width="4" height="4"/><path d="M10 5C3 4 1 9 5 11m9-6c7-1 9 4 5 6M10 12c-6-1-8 3-4 6m8-6c6-1 8 3 4 6"/></>)
export const AortaIcon=icon('aorta',<><path d="M10 2v11l-5 8m9-19v11l5 8M10 6 5 8m9-2 5 2M10 11l-6 2m10-2 6 2M5 21l3 1m11-1-3 1"/></>)
export const LungLobesIcon=icon('lung-lobes',<>{lungs}<path d="m4 12 6 2m4-3 5 1m-5 2 6 2"/></>)
export const SkinIcon=icon('skin',<><path d="M3 7c3-5 5 4 9 0s6-4 9 0M3 12c3-5 5 4 9 0s6-4 9 0M3 17c3-5 5 4 9 0s6-4 9 0M3 7v12m18-12v12"/></>)
export const MeshEditIcon=icon('mesh',<><path d="m3 6 9-3 9 3-3 14H6Zm0 0 9 7 9-7M6 20l6-7 6 7M12 3v10"/><path d="m16 2 3 3"/></>)
