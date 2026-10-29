import { Button, Dropdown, Tooltip } from 'tdesign-react'
import { CheckIcon, ChevronDownIcon, SendIcon, TimeIcon } from 'tdesign-icons-react'
import './workspaceTaskActions.css'

type Props = {
  saveState: 'saving' | 'saved' | 'failed'; savedAt?: string; disabled: boolean; disabledReason?: string
  submitButtonTag?: 'button'; readOnly: boolean; onSubmit: () => void; onSubmitSalesperson: () => void
}
export default function WorkspaceTaskActions({ saveState, savedAt, disabled, disabledReason = '', submitButtonTag, readOnly, onSubmit, onSubmitSalesperson }: Props) {
  return <div className="workspace-persistence-actions">
    <span className={`workspace-persistence-state workspace-persistence-${saveState}`} role="status">{saveState === 'saving' ? <><TimeIcon size={16} />保存中</> : saveState === 'failed' ? '保存失败' : <><CheckIcon size={16} />{savedAt ? `${savedAt} 已保存` : '已保存'}</>}</span>
    <span className="workspace-action-divider" aria-hidden="true" />
    <div className="review-split"><Tooltip content={disabledReason}><span><Button tag={submitButtonTag} className="review-submit-main" theme="primary" disabled={disabled} onClick={onSubmit}><SendIcon size={17} />提交审核</Button></span></Tooltip>
      <Dropdown trigger="click" placement="bottom-right" minColumnWidth={184} maxColumnWidth={240} popupProps={{ overlayClassName: 'workspace-review-menu' }} disabled={readOnly} options={[{ content: '提交业务员审核', value: 'salesperson' }]} onClick={(item) => { if (item.value === 'salesperson') onSubmitSalesperson() }}><button type="button" className="review-submit-menu" disabled={readOnly} aria-label="选择审核对象" aria-haspopup="menu"><ChevronDownIcon size={15} /></button></Dropdown>
    </div>
  </div>
}
