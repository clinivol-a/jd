import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Dropdown, Tooltip } from 'tdesign-react'
import type { DropdownProps } from 'tdesign-react'
import { ChevronDownIcon } from '../design-system/tdesign'

// Shared geometry for every CAD dropdown, including the camera menu trigger.
export default function CadToolDropdown({ label, icon, children, options, onChoose, active = false, placement = 'bottom-left', minWidth = 236 }: {
  label: string; icon?: ReactNode; children?: ReactNode; options: DropdownProps['options']; onChoose: (id: string) => void
  active?: boolean; placement?: DropdownProps['placement']; minWidth?: number
}) {
  const root = useRef<HTMLSpanElement>(null)
  const popupClass = `cad-popup-${useId().replace(/:/g, '')}`
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const key = (event: KeyboardEvent) => {
      const popup = document.querySelector(`.${popupClass}`)
      const target = event.target as HTMLElement
      if (!popup || (!popup.contains(target) && !root.current?.contains(target))) return
      const enabled = (scope: Element) => Array.from(scope.querySelectorAll<HTMLElement>('.t-dropdown__item:not(.t-dropdown__item--disabled)')).filter((item) => item.getClientRects().length && getComputedStyle(item).visibility !== 'hidden')
      const focus = (item?: HTMLElement) => { if (item) { item.tabIndex = -1; item.focus() } }
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); const trigger = root.current?.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]'); trigger?.click(); trigger?.focus(); return }
      const item = target.closest<HTMLElement>('.t-dropdown__item')
      if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
        event.preventDefault(); event.stopPropagation()
        const scope = item?.closest('.t-dropdown__submenu') ?? popup.querySelector('.t-dropdown__menu') ?? popup
        const submenu = scope.classList.contains('t-dropdown__submenu') ? scope : null
        const items = enabled(scope).filter((entry) => entry.closest('.t-dropdown__submenu') === submenu)
        const index = items.indexOf(item!)
        focus(items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length-1 : (index+(event.key === 'ArrowUp' ? -1 : 1)+items.length)%items.length])
      } else if (event.key === 'ArrowRight' && item?.classList.contains('t-dropdown__item--suffix')) { event.preventDefault(); event.stopPropagation(); focus(enabled(item).find((entry) => entry !== item)) }
      else if (event.key === 'ArrowLeft' && item) { const parent = item.parentElement?.closest<HTMLElement>('.t-dropdown__item'); if (parent) { event.preventDefault(); event.stopPropagation(); focus(parent) } }
      else if (item && ['Enter',' '].includes(event.key)) { event.preventDefault(); event.stopPropagation(); item.click() }
    }
    document.addEventListener('keydown',key,true)
    return () => document.removeEventListener('keydown',key,true)
  }, [open,popupClass])
  return <span ref={root} className={`cad-tool-entry${children ? ' cad-tool-split' : ''}${active ? ' cad-entry-active' : ''}`}>
    {children}
    <Dropdown options={options} trigger="click" placement={placement} direction={placement === 'bottom-right' ? 'left' : 'right'} minColumnWidth={minWidth} maxColumnWidth={360} maxHeight={Math.min(600, Math.max(220, window.innerHeight - 180))} popupProps={{ overlayClassName: `cad-tool-menu ${popupClass}`, overlayInnerClassName: 'cad-menu-surface', onVisibleChange: setOpen, popperOptions: { strategy: 'fixed', modifiers: [{ name: 'preventOverflow', options: { mainAxis: true, altAxis: true, padding: 8, tether: false, rootBoundary: 'viewport' } }] } }} onClick={(item) => onChoose(String(item.value))}>
      <button type="button" className={`cad-tool ${children ? 'cad-tool-menu-arrow' : 'cad-tool-group-trigger'}`} aria-label={label} aria-haspopup="menu" aria-expanded={open} onKeyDown={(event) => { if (!open && event.key === 'ArrowDown') { event.preventDefault(); event.currentTarget.click() } }}><Tooltip content={label}><span className="cad-trigger-icons">{icon}<ChevronDownIcon className="cad-dropdown-chevron" size={11} /></span></Tooltip></button>
    </Dropdown>
  </span>
}
