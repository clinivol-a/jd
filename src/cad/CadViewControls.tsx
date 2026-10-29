import { Dropdown, Tooltip } from 'tdesign-react'
import { ChevronDownIcon } from 'tdesign-icons-react'
import CadIcon from './CadIcon'
import type { CadViewState } from './CadScene'
export default function CadViewControls({ view, onAction }: { view: CadViewState; onAction: (action: string) => void }) {
  const options = [
    ...[['前','前视图'],['后','后视图'],['左','左视图'],['右','右视图'],['上','俯视图'],['下','仰视图'],['等轴','等轴测视图']].map(([value, content]) => ({ value, content })),
    { value: 'fit', content: '缩放至适合大小' }, { value: 'previous', content: '上一个视图', disabled: !view.hasPrevious },
    { value: 'projection', content: view.projection === 'orthographic' ? '切换至透视投影' : '切换至正交投影' },
    { value: 'edges', content: view.edges ? '隐藏边线' : '显示边线' }, { value: 'reset', content: '恢复默认方向' },
  ]
  return <div className="cad-view-cube" aria-label="视图方向"><div className="cad-cube-stage"><div className="cad-cube-body" style={{ transform: view.cubeMatrix }}>{[['前','front'],['后','back'],['右','right'],['左','left'],['上','top'],['下','bottom']].map(([name, face]) => <Tooltip key={face} content={name === '上' ? '俯视图' : name === '下' ? '仰视图' : `${name}视图`}><button className={`cad-cube-side cad-cube-${face}`} aria-label={name === '上' ? '俯视图' : name === '下' ? '仰视图' : `${name}视图`} onClick={() => onAction(name)}>{name}</button></Tooltip>)}</div></div><div className="cad-cube-axis"><i>X</i><i>Y</i><i>Z</i></div><Dropdown trigger="click" placement="bottom-right" maxHeight={Math.min(420, Math.max(180, window.innerHeight - 290))} minColumnWidth={208} maxColumnWidth={244} popupProps={{ overlayClassName: 'cad-tool-menu' }} options={options} onClick={(item) => onAction(String(item.value))}><button className="cad-view-options-trigger" aria-label="视图选项" aria-haspopup="menu"><CadIcon name="立方体" size={18} /><ChevronDownIcon size={12} /></button></Dropdown></div>
}
