import { Button, Tooltip } from 'tdesign-react'
import { CheckIcon, SendIcon, TimeIcon } from './design-system/tdesign'
import './workspaceTaskActions.css'

type Props = {
  saveState: 'saving' | 'saved' | 'failed'; savedAt?: string; disabled: boolean; disabledReason?: string
  submitButtonTag?: 'button'; readOnly: boolean; onSubmit: () => void; onSubmitSalesperson: () => void
}
export default function WorkspaceTaskActions({ saveState, savedAt, disabled, disabledReason = '', submitButtonTag, onSubmit }: Props) {
  return <div className="workspace-persistence-actions">
    <span className={`workspace-persistence-state workspace-persistence-${saveState}`} role="status">{saveState === 'saving' ? <><TimeIcon size={16} />保存中</> : saveState === 'failed' ? '保存失败' : <><CheckIcon size={16} />{savedAt ? `${savedAt} 已保存` : '已保存'}</>}</span>
    <span className="workspace-action-divider" aria-hidden="true" />
    <div className="review-split"><Tooltip content={disabledReason}><span><Button tag={submitButtonTag} className="review-submit-main" theme="primary" disabled={disabled} onClick={onSubmit}><SendIcon size={17} />提交审核</Button></span></Tooltip>

    </div>
  </div>
}
