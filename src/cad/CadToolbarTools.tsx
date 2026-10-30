import { useEffect, useMemo, useRef, useState } from 'react'
import { Tooltip } from 'tdesign-react'
import { RollbackIcon, RollfrontIcon } from 'tdesign-icons-react'
import CadIcon from './CadIcon'
import CadToolDropdown from './CadToolDropdown'
import { cadSketchTools, cadToolbarGroups, cadToolById, fitCadToolbar } from './cadToolCatalog'
import type { CadToolbarEntry, CadToolDefinition } from './cadToolCatalog'

type Props = {
  ready: boolean; readOnly: boolean; activeTool: string | null; sketchMode: boolean; sketchTool: string
  canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void
  onChoose: (command: string) => void; onSketchChoose: (tool: string) => void
}
export default function CadToolbarTools({ ready, readOnly, activeTool, sketchMode, sketchTool, canUndo, canRedo, onUndo, onRedo, onChoose, onSketchChoose }: Props) {
  const paletteRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(900)
  useEffect(() => {
    const element = paletteRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const { groups, hidden } = useMemo(() => fitCadToolbar(Math.max(0, width - 80)), [width])
  const disabled = (definition: CadToolDefinition) => !definition.available || !ready || (readOnly && !definition.readOnlySafe)
  const reason = (definition: CadToolDefinition) => !ready ? '请等待模型加载' : readOnly && !definition.readOnlySafe ? '当前成果已锁定' : !definition.available ? '尚未接入几何命令' : ''
  const run = (id: string) => {
    const definition = cadToolById.get(id)
    if (definition?.command && !disabled(definition)) onChoose(definition.command)
  }
  const commandOption = (id: string) => {
    const definition = cadToolById.get(id)!
    return {
      value: id, disabled: disabled(definition), active: Boolean(definition.command && definition.command === activeTool),
      content: <span className="cad-menu-command" title={definition.description}><CadIcon name={definition.icon} size={20} /><span>{definition.name}</span>{reason(definition) && <small>{reason(definition)}</small>}</span>,
    }
  }
  // A compact viewport removes only the actual trailing overflow. Its commands
  // stay one click deep; there is no More → category → command nesting.
  const overflowIds = [...new Set(hidden.flatMap((item) => item.children ?? [item.primary!]))]
  const renderEntry = (entry: CadToolbarEntry) => {
    const primary = entry.primary ? cadToolById.get(entry.primary) : undefined
    const active = Boolean((primary?.command && primary.command === activeTool) || entry.children?.some((id) => cadToolById.get(id)?.command === activeTool))
    const className = `cad-tool${active ? ' cad-tool-active' : ''}`
    const title = primary ? [entry.name !== primary.name ? `${entry.name} · ${primary.name}` : primary.name, primary.description, reason(primary)].filter(Boolean).join(' · ') : `${entry.name} · 选择工具`
    const options = entry.children?.map(commandOption) ?? []
    const button = primary ? <Tooltip content={title}><span className="cad-tool-hit"><button type="button" className={className} aria-label={primary.name} aria-pressed={active} disabled={disabled(primary)} onClick={() => run(primary.id)}><CadIcon name={primary.icon} /></button></span></Tooltip> : null
    return entry.children ? <CadToolDropdown key={entry.id} label={`${entry.name}工具组`} active={active} options={options} onChoose={run}>{button}</CadToolDropdown> : <span className="cad-tool-entry" key={entry.id}>{button}</span>

  }
  return <div className="cad-tools-scroll cad-tool-palette" ref={paletteRef} role="toolbar" aria-label={sketchMode ? '草图工具' : 'CAD 建模工具'}>
    <div className="cad-palette-group cad-history-tools" role="group" aria-label="工程编辑历史"><Tooltip content="撤销（⌘/Ctrl+Z）"><span className="cad-tool-hit"><button type="button" className="cad-tool" aria-label="撤销" disabled={!canUndo} onClick={onUndo}><RollbackIcon size={20} /></button></span></Tooltip><Tooltip content="重做（⌘/Ctrl+Shift+Z、Ctrl+Y）"><span className="cad-tool-hit"><button type="button" className="cad-tool" aria-label="重做" disabled={!canRedo} onClick={onRedo}><RollfrontIcon size={20} /></button></span></Tooltip></div>
    {sketchMode ? <div className="cad-palette-group" role="group" aria-label="草图工具">{cadSketchTools.map((name) => <Tooltip key={name} content={name}><button type="button" className={`cad-tool${sketchTool === name ? ' cad-tool-active' : ''}`} aria-label={name} aria-pressed={sketchTool === name} onClick={() => onSketchChoose(name)}><CadIcon name={name} /></button></Tooltip>)}</div> : <>
      {groups.map((group) => <div className="cad-palette-group" role="group" aria-label={group.name} key={group.id}>{group.entries.map(renderEntry)}</div>)}
      {hidden.length > 0 && <div className="cad-palette-group cad-palette-more"><CadToolDropdown label="更多工具" icon={<CadIcon name="更多工具" />} options={overflowIds.map(commandOption)} onChoose={run} placement="bottom-right" /></div>}

    </>}
  </div>
}
