import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

type Side = 'left' | 'right'
type Layout = { left: number; right: number; leftOpen: boolean; rightOpen: boolean }
type PanelOptions = { storageKey: string; left: number; right: number; labels: [string, string] }
const defaults: PanelOptions = { storageKey: 'clinivol-cad-panel-layout', left: 280, right: 304, labels: ['调整 CAD 模型树宽度','调整 CAD 属性面板宽度'] }
const minimum = { left: 184, right: 252 }
const readLayout = (hasSelection: boolean, options: PanelOptions): Layout => {
  try {
    const saved = JSON.parse(localStorage.getItem(options.storageKey) ?? 'null') as Partial<Layout> | null
    if (saved) return { left: Math.max(184, Math.min(480, Number(saved.left) || options.left)), right: Math.max(252, Math.min(480, Number(saved.right) || options.right)), leftOpen: saved.leftOpen !== false, rightOpen: hasSelection && saved.rightOpen !== false }
  } catch { /* UI preferences do not affect the CAD project. */ }
  return { left: options.left, right: options.right, leftOpen: true, rightOpen: hasSelection }
}

/** UI-only panel preferences: resizing never writes or dirties the CAD project. */
export function useCadPanels(hasSelection: boolean, options = defaults) {
  const [layout, setLayout] = useState(() => readLayout(hasSelection, options))
  const [available, setAvailable] = useState(window.innerWidth)
  const [resizing, setResizing] = useState<Side | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const manualRightClosed = useRef(!layout.rightOpen && hasSelection)
  const drag = useRef<{ side: Side; x: number; width: number; max: number; pointerId: number } | null>(null)
  useEffect(() => {
    const body = bodyRef.current
    if (!body) return
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width))
    observer.observe(body)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (resizing) return
    try { localStorage.setItem(options.storageKey, JSON.stringify(layout)) } catch { /* Retain in-memory preferences if storage is unavailable. */ }
  }, [layout, resizing, options.storageKey])
  const toggle = (side: Side, open: boolean, manual = true) => {
    if (side === 'right' && manual) manualRightClosed.current = !open
    setLayout((current) => ({ ...current, [`${side}Open`]: open }))
  }
  const autoInspect = (selected: boolean) => {
    if (!selected) toggle('right', false, false)
    else if (!manualRightClosed.current) toggle('right', true, false)
  }
  const maxWidth = (side: Side) => Math.max(minimum[side], Math.min(480, available - (side === 'left' ? layout.rightOpen ? layout.right : 0 : layout.leftOpen ? layout.left : 0) - 342))
  const resize = (side: Side, width: number) => {
    if (width < 80) { toggle(side, false); return }
    setLayout((current) => ({ ...current, [side]: Math.min(maxWidth(side), Math.max(minimum[side], width)), [`${side}Open`]: true }))
  }
  const resizerProps = (side: Side) => ({
    role: 'separator' as const, 'aria-label': options.labels[side === 'left' ? 0 : 1], 'aria-orientation': 'vertical' as const,
    'aria-valuemin': minimum[side], 'aria-valuemax': Math.round(maxWidth(side)), 'aria-valuenow': Math.round(Math.min(layout[side], maxWidth(side))), tabIndex: 0,
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); resize(side, layout[side] + (event.key === 'ArrowRight' ? 12 : -12) * (side === 'left' ? 1 : -1)) }
      if (event.key === 'Home') { event.preventDefault(); toggle(side, false) }
    },
    onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId)
      drag.current = { side, x: event.clientX, width: layout[side], max: maxWidth(side), pointerId: event.pointerId }; setResizing(side)
    },
    onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => {
      const current = drag.current
      if (!current || current.side !== side || current.pointerId !== event.pointerId) return
      event.preventDefault(); event.stopPropagation()
      const width = current.width + (event.clientX - current.x) * (side === 'left' ? 1 : -1)
      // Keep the handle mounted and pointer-captured until release, even after collapse.
      if (width < 80) { if (side === 'right') manualRightClosed.current = true; setLayout((value) => ({ ...value, [side]: current.width, [`${side}Open`]: false })) }
      else setLayout((value) => ({ ...value, [side]: Math.max(minimum[side], Math.min(current.max, width)), [`${side}Open`]: true }))
    },
    onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => {
      if (drag.current?.pointerId !== event.pointerId) return
      event.stopPropagation(); drag.current = null; setResizing(null)
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    },
    onPointerCancel: () => { drag.current = null; setResizing(null) },
    onLostPointerCapture: () => { drag.current = null; setResizing(null) },
  })
  return { bodyRef, layout, toggle, autoInspect, resizerProps, resizing, leftWidth: layout.leftOpen ? Math.min(layout.left, maxWidth('left')) : 0, rightWidth: layout.rightOpen ? Math.min(layout.right, maxWidth('right')) : 0 }
}
