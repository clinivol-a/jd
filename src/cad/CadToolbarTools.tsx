import { useEffect, useMemo, useRef, useState } from 'react'
import { Dropdown, Tooltip } from 'tdesign-react'
import { ChevronDownIcon } from 'tdesign-icons-react'
import CadIcon from './CadIcon'
import { cadSketchTools, cadToolbarGroups, cadToolById, fitCadToolbar } from './cadToolCatalog'
import type { CadToolbarEntry, CadToolDefinition } from './cadToolCatalog'

type Props = {
  ready: boolean; readOnly: boolean; activeTool: string | null; sketchMode: boolean; sketchTool: string
  onChoose: (command: string) => void; onSketchChoose: (tool: string) => void; onBack: () => void
}
const popupProps = { overlayClassName: 'cad-tool-menu' }
export default function CadToolbarTools({ ready, readOnly, activeTool, sketchMode, sketchTool, onChoose, onSketchChoose, onBack }: Props) {
  const paletteRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(900)
  useEffect(() => {
    const element = paletteRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const { groups, hidden } = useMemo(() => fitCadToolbar(width), [width])
  const disabled = (definition: CadToolDefinition) => !definition.available || !ready || (readOnly && !definition.readOnlySafe)
  const reason = (definition: CadToolDefinition) => !ready ? '请等待模型加载' : readOnly && !definition.readOnlySafe ? '当前成果已锁定' : ''
  const run = (id: string) => {
    if (id === 'back') { onBack(); return }
    const definition = cadToolById.get(id)
    if (definition?.command && !disabled(definition)) onChoose(definition.command)
  }
  const commandOption = (id: string) => {
    const definition = cadToolById.get(id)!
    return {
      value: id, disabled: disabled(definition),
      content: <span className="cad-menu-command" title={definition.description}><CadIcon name={definition.icon} size={20} /><span>{definition.name}</span>{reason(definition) && <small>{reason(definition)}</small>}</span>,
    }
  }
  const entryOption = (entry: CadToolbarEntry) => entry.children
    ? { value: entry.id, content: <span className="cad-menu-command"><CadIcon name={entry.icon} size={20} /><span>{entry.name}</span></span>, children: entry.children.map(commandOption) }
    : commandOption(entry.primary!)
  const hiddenIds = new Set(hidden.map((entry) => entry.id))
  const overflow = cadToolbarGroups.flatMap((group) => {
    const children = group.entries.filter((entry) => hiddenIds.has(entry.id)).map(entryOption)
    if (group.id === 'solid') children.push(commandOption('rib'))
    return children.length ? [{ value: `overflow-${group.id}`, content: group.name, children }] : []
  })
  const renderEntry = (entry: CadToolbarEntry) => {
    const primary = entry.primary ? cadToolById.get(entry.primary) : undefined
    const active = Boolean((primary?.command && primary.command === activeTool) || entry.children?.some((id) => cadToolById.get(id)?.command === activeTool))
    const className = `cad-tool${active ? ' cad-tool-active' : ''}`
    const title = primary ? [entry.name !== primary.name ? `${entry.name} · ${primary.name}` : primary.name, primary.description, reason(primary)].filter(Boolean).join(' · ') : `${entry.name} · 选择工具`
    const options = entry.children?.map(commandOption) ?? []
    return <span className={`cad-tool-entry${entry.children && primary ? ' cad-tool-split' : ''}`} key={entry.id}>
      {primary ? <Tooltip content={title}><span className="cad-tool-hit"><button type="button" className={className} aria-label={primary.name} aria-pressed={active} disabled={disabled(primary)} onClick={() => run(primary.id)}><CadIcon name={primary.icon} /></button></span></Tooltip> : null}
      {entry.children && <Dropdown options={options} trigger="click" placement="bottom-left" minColumnWidth={244} maxColumnWidth={300} popupProps={popupProps} onClick={(item) => run(String(item.value))}>
        <button type="button" className={`${className}${primary ? ' cad-tool-menu-arrow' : ' cad-tool-group-trigger'}`} aria-label={`${entry.name}工具组`} aria-haspopup="menu"><Tooltip content={`${entry.name}工具组`}><span>{!primary && <CadIcon name={entry.icon} />}<ChevronDownIcon size={11} /></span></Tooltip></button>
      </Dropdown>}
    </span>
  }
  return <div className="cad-tools-scroll cad-tool-palette" ref={paletteRef} role="toolbar" aria-label={sketchMode ? '草图工具' : 'CAD 建模工具'}>
    {sketchMode ? <div className="cad-palette-group" role="group" aria-label="草图工具">{cadSketchTools.map((name) => <Tooltip key={name} content={name}><button type="button" className={`cad-tool${sketchTool === name ? ' cad-tool-active' : ''}`} aria-label={name} aria-pressed={sketchTool === name} onClick={() => onSketchChoose(name)}><CadIcon name={name} /></button></Tooltip>)}</div> : <>
      {groups.map((group) => <div className="cad-palette-group" role="group" aria-label={group.name} key={group.id}>{group.entries.map(renderEntry)}</div>)}
      <div className="cad-palette-group cad-palette-more"><Dropdown trigger="click" placement="bottom-right" minColumnWidth={244} maxColumnWidth={300} popupProps={popupProps} options={[...overflow, { value: 'back', content: <span className="cad-menu-command"><CadIcon name="返回" size={20} /><span>返回任务详情</span></span> }]} onClick={(item) => run(String(item.value))}><button type="button" className="cad-tool cad-tool-group-trigger" aria-label="更多工具" aria-haspopup="menu"><Tooltip content="更多工具"><span><CadIcon name="更多工具" /><ChevronDownIcon size={11} /></span></Tooltip></button></Dropdown></div>
    </>}
  </div>
}
