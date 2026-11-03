import { useEffect, useRef, useState } from 'react'
import { Dialog, Dropdown } from 'tdesign-react'
import { HelpCircleIcon } from './design-system/tdesign'
import './headerHelp.css'
export default function HeaderHelp({ onManageAccount }: { onManageAccount: () => void }) {
  const trigger = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState<string | null>(null)
  useEffect(() => {
    if (!open) return
    const key = (event: KeyboardEvent) => {
      const menu = document.querySelector('.header-help-menu'); const target = event.target as HTMLElement
      if (!menu?.contains(target) && target !== trigger.current) return
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); trigger.current?.click(); trigger.current?.focus() }
      if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
        event.preventDefault(); event.stopPropagation()
        const items = Array.from(menu?.querySelectorAll<HTMLElement>('.t-dropdown__item:not(.t-dropdown__item--disabled)') ?? [])
        const index = items.indexOf(target); const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length-1 : (index+(event.key === 'ArrowUp' ? -1 : 1)+items.length)%items.length
        if (items[next]) { items[next].tabIndex = -1; items[next].focus() }
      }
      if (target.classList.contains('t-dropdown__item') && ['Enter',' '].includes(event.key)) { event.preventDefault(); target.click() }
    }
    document.addEventListener('keydown',key,true); return () => document.removeEventListener('keydown',key,true)
  }, [open])
  const sections = page === '手册' ? <><h3>任务与资料</h3><p>从「我的项目」查看项目并进入对应设计阶段，点击「继续设计」进入对应专业工作区。任务关联资料会自动加载。</p><h3>专业工作区</h3><p>拖动左右面板分割线调整宽度，向边缘拖至阈值可完全收起；点击边缘按钮恢复。视图右上角按钮用于单视图最大化和还原。</p><h3>保存与审核</h3><p>真实工程编辑会自动保存。保存完成后可提交审核；审核意见在原问题下回复和处理，提交后的成果按任务状态锁定。</p></> : page === '教程' ? <><h3>CAD 基本操作</h3><ol><li>选择模型树中的对象，或点击模型，查看选中轮廓和属性。</li><li>从工具栏选择草图及建模命令，在视窗附近的参数面板中设置并预览。</li><li>点击确认写入工程，或取消放弃当前操作。</li></ol><h3>快捷操作</h3><p>左键旋转与选择，右键拖动平移，滚轮缩放。F 适配选中对象或全部模型；Ctrl/⌘+S 保存，Ctrl/⌘+Z 撤销，Ctrl+Y 或 Ctrl/⌘+Shift+Z 重做。</p></> : <><h3>CliniVol</h3><p>医学影像与专业设计工作台</p><p>版本 0.1.0</p></>
  return <><Dropdown options={['账号切换','账号管理','手册','教程','许可','关于'].map((label) => ({ value: label, content: label, disabled: label === '账号切换' || label === '许可' }))} trigger="click" placement="bottom-right" minColumnWidth={196} maxColumnWidth={280} popupProps={{ overlayClassName: 'header-help-menu', onVisibleChange: setOpen, popperOptions: { strategy: 'fixed', modifiers: [{ name: 'preventOverflow', options: { altAxis: true, padding: 8 } }] } }} onClick={(item) => { if (item.value === '账号管理') onManageAccount(); else setPage(String(item.value)) }}><button ref={trigger} className="header-icon" title="帮助" aria-label="帮助" aria-haspopup="menu" aria-expanded={open} onKeyDown={(event) => { if (!open && event.key === 'ArrowDown') { event.preventDefault(); event.currentTarget.click() } }}><HelpCircleIcon size={19} /></button></Dropdown><Dialog visible={!!page} header={page} width={600} footer={false} onClose={() => setPage(null)}><div className="header-help-content">{sections}</div></Dialog></>
}
