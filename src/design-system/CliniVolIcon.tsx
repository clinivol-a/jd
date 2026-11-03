import { Children, cloneElement, forwardRef, isValidElement } from 'react'
import type { ElementType, ReactNode, SVGProps } from 'react'

export type CliniVolIconProps = SVGProps<SVGSVGElement> & { size?: number | string }
export function iconSize(size: number | string = 20): 16 | 20 | 24 {
  const value = Number(size)
  return value <= 16 ? 16 : value <= 20 || !Number.isFinite(value) ? 20 : 24
}
function roundedShapes(children: ReactNode): ReactNode {
  return Children.map(children, child => {
    if (!isValidElement<{ children?: ReactNode; rx?: number }>(child)) return child
    return cloneElement(child, {
      ...(child.type === 'rect' && child.props.rx === undefined ? { rx: 1 } : {}),
      ...(child.props.children ? { children: roundedShapes(child.props.children) } : {}),
    })
  })
}
/** Shared 24px authoring grid. Filled statistical symbols intentionally keep their silhouettes. */
export const CliniVolIcon = forwardRef<SVGSVGElement, CliniVolIconProps & { source?: ElementType }>(function CliniVolIcon({ source: Source, size = 20, className = '', style, children, ...props }, ref) {
  const pixels = iconSize(size)
  const shared = { ...props, ref, 'data-cv-icon': Source ? 'catalog' : 'custom', className: `cv-icon ${className}`, width: pixels, height: pixels, style: { ...style, '--cv-icon-size': `${pixels}px` } as React.CSSProperties, strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': props['aria-label'] ? undefined : true as const }
  return Source ? <Source {...shared} size={pixels} /> : <svg {...shared} viewBox="0 0 24 24" fill="none" stroke="currentColor">{roundedShapes(children)}</svg>
})
export function adaptIcon(Source: ElementType) {
  return forwardRef<SVGSVGElement, CliniVolIconProps>(function AdaptedIcon(props, ref) { return <CliniVolIcon {...props} source={Source} ref={ref} /> })
}
