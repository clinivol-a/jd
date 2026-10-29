import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
export type CadMenuAction = { id: string; label: string; disabled?: boolean; danger?: boolean }
export type CadMenuTarget = { x: number; y: number; id: string | null; kind: 'object' | 'sketch' | 'feature' | 'plane' | 'blank'; source: 'tree' | 'viewport' }
export default function CadContextMenu({ target, actions, bounds, onRun, onClose }: { target: CadMenuTarget; actions: CadMenuAction[]; bounds: DOMRect; onRun: (id: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ left: target.x, top: target.y })
  useLayoutEffect(() => {
    const menu = ref.current
    if (!menu) return
    const box = menu.getBoundingClientRect()
    setPosition({ left: Math.max(bounds.left + 4, Math.min(target.x, bounds.right - box.width - 4)), top: Math.max(bounds.top + 4, Math.min(target.y, bounds.bottom - box.height - 4)) })
    menu.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
  }, [target, bounds.left, bounds.top, bounds.right, bounds.bottom])
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) onClose() }
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose() }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault(); event.stopPropagation()
        const items = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])
        const index = items.indexOf(document.activeElement as HTMLButtonElement)
        items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowUp' ? -1 : 1) + items.length) % items.length]?.focus()
      }
    }
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', key, true)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', key, true) }
  }, [onClose])
  return createPortal(<div ref={ref} className="cad-context-menu" role="menu" aria-label="CAD 上下文菜单" style={{ ...position, maxHeight: Math.max(100, bounds.height - 8), maxWidth: bounds.width - 8 }} onContextMenu={(event) => event.preventDefault()}>{actions.map((action) => <button type="button" role="menuitem" key={action.id} disabled={action.disabled} className={action.danger ? 'cad-menu-danger' : ''} onClick={() => { onRun(action.id); onClose() }}>{action.label}</button>)}</div>, document.body)
}
