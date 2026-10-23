import { useMemo, useRef, useState } from 'react'
import { Button, Dialog, MessagePlugin, Tag, Textarea, Tooltip } from 'tdesign-react'
import {
  BrowseIcon, ChatMessageIcon, CheckCircleIcon, ChevronLeftIcon,
  CloseCircleIcon, CloudIcon, LockOnIcon, NotificationIcon, RefreshIcon, SendIcon,
  TaskCheckedIcon, UserCircleIcon,
} from 'tdesign-icons-react'

type Role = 'designer' | 'doctor'
type IssueStatus = 'pending' | 'modified' | 'approved'
type ViewName = 'Axial' | 'Coronal' | 'Sagittal' | '3D View'
type Comment = { id: number; author: string; role: Role; time: string; text: string }
type Issue = {
  id: 'A' | 'B' | 'C'
  view: ViewName
  location: string
  title: string
  detail: string
  status: IssueStatus
  submitted: boolean
  marker: { x: number; y: number }
  comments: Comment[]
}

const initialIssues: Issue[] = [
  {
    id: 'A', view: 'Axial', location: '第 286 层', title: '右侧髁突边界分离不完整',
    detail: '请重新检查右侧髁突与周围骨性结构的分离边界。', status: 'pending', submitted: false,
    marker: { x: 68, y: 36 },
    comments: [{ id: 1, author: '周医生', role: 'doctor', time: '10 月 20 日 09:18', text: '右侧髁突边界分离不完整，需要重新检查。请在第 286 层结合相邻层面确认。' }],
  },
  {
    id: 'B', view: 'Coronal', location: '第 412 层', title: '下颌骨外缘连续性问题',
    detail: '外缘存在一处断续，需要结合相邻切片修正模型连续性。', status: 'pending', submitted: false,
    marker: { x: 38, y: 64 },
    comments: [{ id: 2, author: '周医生', role: 'doctor', time: '10 月 20 日 09:21', text: '下颌骨外缘存在连续性问题，需要修正，并注意保留下颌角自然过渡。' }],
  },
  {
    id: 'C', view: '3D View', location: '正位 · 320 mm', title: '左侧骨缘过渡需要调整',
    detail: '保留当前观察角度，调整左侧骨缘的表面过渡。', status: 'pending', submitted: false,
    marker: { x: 31, y: 44 },
    comments: [{ id: 3, author: '周医生', role: 'doctor', time: '10 月 20 日 09:24', text: '左侧骨缘过渡略显突兀，请调整。复核时保留当前正位观察角度。' }],
  },
]

const statusMeta: Record<IssueStatus, { label: string; theme: 'danger' | 'warning' | 'success'; hint: string }> = {
  pending: { label: '待修改', theme: 'danger', hint: '等待设计师处理' },
  modified: { label: '已修改 · 待复核', theme: 'warning', hint: '等待医生逐条复核' },
  approved: { label: '审核通过', theme: 'success', hint: '该问题已完成复核' },
}

function copyInitialIssues() {
  return initialIssues.map((issue) => ({ ...issue, marker: { ...issue.marker }, comments: issue.comments.map((comment) => ({ ...comment })) }))
}

function Viewport({ name, issue, selected, onSelect }: { name: ViewName; issue?: Issue; selected: boolean; onSelect: () => void }) {
  const is3d = name === '3D View'
  const borderClass = name.toLowerCase().replace(' ', '-').replace('3d-view', 'view-3d')
  return (
    <button className={`viewport ${borderClass} ${is3d ? 'viewport-light' : ''} ${selected ? 'is-selected' : ''}`} onClick={onSelect} aria-label={`${name} 视图`}>
      <div className="view-head"><strong>{name}</strong><span>{issue ? issue.location : name === 'Sagittal' ? '第 338 层' : ''}</span></div>
      {!is3d && <><span className="orientation top">A</span><span className="orientation bottom">P</span><span className="orientation left">R</span><span className="orientation right">L</span><div className="crosshair cross-x" /><div className="crosshair cross-y" /></>}
      <svg className="anatomy" viewBox="0 0 440 300" aria-hidden="true">
        {is3d ? (
          <g fill="none" stroke="#c8d0d5" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
            <path d="M128 76c-15 18-24 44-21 73 4 48 27 88 63 104 23 10 78 10 101 0 36-16 59-56 63-104 3-29-6-55-21-73" />
            <path d="M121 106c30 13 53 18 99 18s69-5 99-18M156 211c18-14 35-20 64-20s46 6 64 20" />
            <path d="M117 83l22-28M323 83l-22-28" strokeWidth="9" />
          </g>
        ) : name === 'Axial' ? (
          <g fill="none" stroke="#d7d9db" strokeWidth="5" opacity=".88"><ellipse cx="220" cy="150" rx="112" ry="94"/><ellipse cx="220" cy="150" rx="78" ry="61"/><path d="M139 122c22-24 49-36 81-36s59 12 81 36M150 188c38 38 102 38 140 0"/></g>
        ) : name === 'Coronal' ? (
          <g fill="none" stroke="#d7d9db" strokeWidth="5" opacity=".88"><path d="M132 64c-27 30-35 74-25 117 12 52 51 83 113 84 62-1 101-32 113-84 10-43 2-87-25-117"/><path d="M142 120c24 20 49 27 78 27s54-7 78-27M162 205c21 13 38 17 58 17s37-4 58-17"/><ellipse cx="173" cy="128" rx="18" ry="25"/><ellipse cx="267" cy="128" rx="18" ry="25"/></g>
        ) : (
          <g fill="none" stroke="#d7d9db" strokeWidth="5" opacity=".88"><path d="M165 55c74 7 119 51 118 111-1 47-32 83-79 94-29 7-57-2-71-24-13-21-8-45 10-58 17-12 30-30 29-51-1-27-10-48-7-72z"/><path d="M159 207c31 19 71 17 101-3"/></g>
        )}
      </svg>
      {issue && <span className={`marker marker-${issue.status} ${selected ? 'marker-active' : ''}`} style={{ left: `${issue.marker.x}%`, top: `${issue.marker.y}%` }}><span>{issue.id}</span></span>}
      <div className="view-meta">{is3d ? 'Surface Preview · Camera saved' : 'W 1800 · L 450 · 0.5 mm'}<br/>模拟影像 · 非诊断用途</div>
    </button>
  )
}

export default function App() {
  const [role, setRole] = useState<Role>('designer')
  const [issues, setIssues] = useState<Issue[]>(copyInitialIssues)
  const [selectedId, setSelectedId] = useState<Issue['id']>('A')
  const [draft, setDraft] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncedAt, setSyncedAt] = useState('09:02')
  const syncTimer = useRef<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [finalApproved, setFinalApproved] = useState(false)
  const [submitDialog, setSubmitDialog] = useState(false)
  const [finalDialog, setFinalDialog] = useState(false)
  const [notice, setNotice] = useState<string | null>('周医生退回了 3 条定位审核意见')

  const selected = issues.find((issue) => issue.id === selectedId)!
  const approvedCount = issues.filter((issue) => issue.status === 'approved').length
  const modifiedCount = issues.filter((issue) => issue.status === 'modified').length
  const pendingCount = issues.filter((issue) => issue.status === 'pending').length
  const allMarked = issues.every((issue) => issue.status !== 'pending')
  const allApproved = issues.every((issue) => issue.status === 'approved')
  const progress = finalApproved ? 100 : Math.round(((approvedCount + modifiedCount * .5) / issues.length) * 100)
  const overall = finalApproved ? '审核通过' : submitted ? '医生复核中' : pendingCount ? '审核退回' : '修改完成 · 待提交'
  const overallTheme = finalApproved ? 'success' : submitted ? 'warning' : pendingCount ? 'danger' : 'primary'
  const actorName = role === 'designer' ? '陈屿' : '周医生'
  const viewIssue = (name: ViewName) => issues.find((issue) => issue.view === name)

  const updateIssue = (id: Issue['id'], patch: Partial<Issue>) => setIssues((current) => current.map((issue) => issue.id === id ? { ...issue, ...patch } : issue))
  const now = () => new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())

  function queueCloudSync() {
    setSyncing(true)
    if (syncTimer.current) window.clearTimeout(syncTimer.current)
    syncTimer.current = window.setTimeout(() => {
      setSyncing(false)
      setSyncedAt(now())
      syncTimer.current = null
    }, 650)
  }

  function sendComment() {
    const value = draft.trim()
    if (!value) return
    updateIssue(selected.id, { comments: [...selected.comments, { id: Date.now(), author: actorName, role, time: `今天 ${now()}`, text: value }] })
    setDraft('')
    if (role === 'designer') queueCloudSync()
    MessagePlugin.success('回复已添加到原问题讨论串')
  }

  function markModified() {
    if (submitted || finalApproved) return
    updateIssue(selected.id, { status: 'modified', submitted: false })
    queueCloudSync()
    MessagePlugin.success(`问题 ${selected.id} 已标记为已修改；尚未提交医生复核`)
  }

  function submitReview() {
    setIssues((current) => current.map((issue) => ({ ...issue, submitted: issue.status === 'modified' })))
    setSubmitted(true)
    setSubmitDialog(false)
    setNotice(`设计师已统一提交 ${modifiedCount} 条修改，等待逐条复核`)
    MessagePlugin.success('已统一提交医生复核')
  }

  function approveIssue() {
    if (!submitted || selected.status !== 'modified' || !selected.submitted) return
    updateIssue(selected.id, { status: 'approved' })
    MessagePlugin.success(`问题 ${selected.id} 已审核通过`)
  }

  function returnIssue() {
    if (!submitted || selected.status !== 'modified') return
    updateIssue(selected.id, { status: 'pending', submitted: false })
    setSubmitted(false)
    setNotice(`周医生将问题 ${selected.id} 退回继续修改`)
    MessagePlugin.warning('已在原讨论串中退回该问题，请补充具体意见')
  }

  function approveAll() {
    setFinalApproved(true)
    setSubmitted(false)
    setFinalDialog(false)
    setNotice('本次三维重建成果已审核通过，可进入下游 CAD 阶段')
    MessagePlugin.success('整项成果已审核通过')
  }

  function resetDemo() {
    setIssues(copyInitialIssues())
    setSelectedId('A')
    setDraft('')
    if (syncTimer.current) window.clearTimeout(syncTimer.current)
    syncTimer.current = null
    setSyncing(false)
    setSyncedAt('09:02')
    setSubmitted(false)
    setFinalApproved(false)
    setNotice('周医生退回了 3 条定位审核意见')
    MessagePlugin.success('示例数据已重置')
  }

  const timeline = useMemo(() => [
    { label: '医生提出定位意见', done: true },
    { label: '设计师修改并统一提交', done: submitted || approvedCount > 0 || finalApproved },
    { label: '医生逐条复核', done: approvedCount > 0 || finalApproved },
    { label: '整项审核通过', done: finalApproved },
  ], [submitted, approvedCount, finalApproved])

  return (
    <div className="app-shell">
      <header className="global-header">
        <div className="brand"><img src="/assets/clinivol-logo.png" alt="CliniVol" /><span>审核协作探索</span></div>
        <div className="role-switch" aria-label="切换当前角色">
          <button className={role === 'designer' ? 'active' : ''} onClick={() => setRole('designer')}><UserCircleIcon />三维重建设计师视角</button>
          <button className={role === 'doctor' ? 'active' : ''} onClick={() => setRole('doctor')}><BrowseIcon />医生审核视角</button>
        </div>
        <div className="header-actions">
          <Tooltip content="仅用于内部评审，不属于正式业务操作"><Button aria-label="重置示例数据" variant="text" icon={<RefreshIcon />} onClick={resetDemo}>重置示例数据</Button></Tooltip>
          <button className="user-chip"><span className={`avatar role-${role}`}>{actorName.slice(0, 1)}</span><span><strong>{actorName}</strong><small>{role === 'designer' ? '三维重建设计师' : '颌面外科医生'}</small></span></button>
        </div>
      </header>

      <section className="task-strip">
        <div className="task-title"><button aria-label="返回任务列表"><ChevronLeftIcon /></button><div><span>任务 002</span><h1>下颌骨三维重建</h1></div><Tag theme={overallTheme} variant="light">{overall}</Tag></div>
        <div className="task-progress"><div className="progress-copy"><strong>{approvedCount}/{issues.length}</strong><span>问题已通过 · {pendingCount} 待修改 · {modifiedCount} 待复核</span></div><div className="progress-track"><i style={{ width: `${progress}%` }} /></div></div>
        <div className="workflow-steps">{timeline.map((step, index) => <div key={step.label} className={step.done ? 'done' : ''}><span>{step.done ? <CheckCircleIcon /> : index + 1}</span><small>{step.label}</small></div>)}</div>
      </section>

      {notice && <div className="notice-bar"><NotificationIcon /><span>{notice}</span><button onClick={() => setNotice(null)}>关闭</button></div>}

      <main className="workspace">
        <section className="imaging-stage">
          <div className="stage-toolbar">
            <div><strong>下颌骨薄层 CT</strong><span>0.5 mm · 816 层 · 模拟数据</span></div>
            <div className="tool-group"><Button size="small" variant="outline">窗宽窗位</Button><Button size="small" variant="outline">缩放</Button><Button size="small" variant="outline">平移</Button><Button size="small" variant="outline">旋转</Button><Button size="small" variant="outline">重置视图</Button></div>
            <div className="readonly-state"><LockOnIcon />{role === 'doctor' || submitted || finalApproved ? '成果只读' : '可编辑工程'}</div>
          </div>
          <div className="viewport-grid">
            {(['Axial', 'Coronal', 'Sagittal', '3D View'] as ViewName[]).map((name) => {
              const issue = viewIssue(name)
              return <Viewport key={name} name={name} issue={issue} selected={issue?.id === selectedId} onSelect={() => issue && setSelectedId(issue.id)} />
            })}
          </div>
          <div className="stage-status"><span>Patient: CV-P-2026-0172</span><span>Series: Mandible Thin CT</span><span>当前定位：{selected.view} · {selected.location}</span><span>非诊断用途</span></div>
        </section>

        <aside className="review-panel">
          <div className="panel-head"><h2>定位审核意见</h2><Tag variant="outline">{issues.length} 条</Tag></div>
          <div className="issue-list">
            {issues.map((issue) => <button key={issue.id} className={`issue-item status-${issue.status} ${selectedId === issue.id ? 'selected' : ''}`} onClick={() => setSelectedId(issue.id)}>
              <span className="issue-index">{issue.id}</span><span className="issue-main"><strong>{issue.title}</strong><small>{issue.view} · {issue.location}</small></span><Tag className="issue-status-tag" theme={statusMeta[issue.status].theme} variant="light">{statusMeta[issue.status].label}</Tag>
            </button>)}
          </div>

          <section className="thread">
            <div className="thread-head"><h3>问题 {selected.id} · 讨论</h3><span>{selected.comments.length} 条消息</span></div>
            <div className="comments" aria-live="polite">
              {selected.comments.map((comment) => <article key={comment.id} className={`comment comment-${comment.role}`}><div className="comment-avatar">{comment.author.slice(0, 1)}</div><div className="comment-body"><div><strong>{comment.author}</strong><Tag size="small" variant="light">{comment.role === 'doctor' ? '医生' : '设计师'}</Tag><time>{comment.time}</time></div><p>{comment.text}</p></div></article>)}
            </div>
            <div className="composer"><Textarea value={draft} onChange={(value) => setDraft(value as string)} placeholder={role === 'designer' ? '回复医生，说明修改位置或处理方式…' : '补充复核意见，回复将保留在原问题串…'} autosize={{ minRows: 2, maxRows: 3 }} maxlength={240} /><div><span>回复不会创建新问题</span><Button theme="primary" icon={<SendIcon />} disabled={!draft.trim()} onClick={sendComment}>发送</Button></div></div>
          </section>

          <footer className="action-dock">
            {role === 'designer' ? <>
              <div className={`sync-status ${syncing ? 'is-syncing' : ''}`}><span><CloudIcon />{syncing ? '云端同步中…' : `云端已同步 · ${syncedAt}`}</span><strong>待提交 {modifiedCount}/{issues.length}</strong></div>
              {!submitted && !finalApproved && <Button block size="large" variant="outline" disabled={selected.status !== 'pending'} onClick={markModified}><TaskCheckedIcon />标记当前问题已修改</Button>}
              <Button block size="large" theme="primary" loading={syncing} disabled={submitted || finalApproved || syncing} onClick={() => {
                if (!allMarked) MessagePlugin.warning(`仍有 ${pendingCount} 条问题未标记已修改`)
                else setSubmitDialog(true)
              }}>{submitted ? '已提交 · 等待医生复核' : finalApproved ? '成果已审核锁定' : `提交审核（待提交 ${modifiedCount}）`}</Button>
            </> : <>
              <div className="review-summary"><div><strong>{allApproved ? '全部问题已通过' : submitted ? `${modifiedCount} 条待复核` : '等待设计师提交'}</strong><span>{allApproved ? '可进行整项成果确认' : submitted ? '请结合空间定位逐条确认' : '尚未收到正式复核版本'}</span></div><ChatMessageIcon /></div>
              {submitted && selected.status === 'modified' && <div className="review-actions"><Button size="large" variant="outline" theme="danger" icon={<CloseCircleIcon />} onClick={returnIssue}>继续修改</Button><Button size="large" theme="success" icon={<CheckCircleIcon />} onClick={approveIssue}>审核通过</Button></div>}
              <Button block size="large" theme="primary" disabled={!allApproved || finalApproved} onClick={() => setFinalDialog(true)}>{finalApproved ? '整项成果已审核通过' : '整项审核通过'}</Button>
              {!allApproved && <p className="dock-hint"><LockOnIcon />所有问题逐条通过后，才能确认整项成果。</p>}
            </>}
          </footer>
        </aside>
      </main>

      <Dialog visible={submitDialog} header="统一提交医生复核" confirmBtn="确认提交" cancelBtn="取消" onConfirm={submitReview} onClose={() => setSubmitDialog(false)} onCancel={() => setSubmitDialog(false)}>
        <div className="dialog-content"><span className="dialog-icon warning"><TaskCheckedIcon /></span><div><h3>本次将提交 {modifiedCount} 条已修改问题</h3><p>云端最新修改已同步。提交后成果进入只读状态，医生会收到一次统一待复核通知；问题评论、切片位置与三维相机角度将一并保留。</p><ul>{issues.map((issue) => <li key={issue.id}><span>{issue.id} · {issue.title}</span><strong>{statusMeta[issue.status].label}</strong></li>)}</ul></div></div>
      </Dialog>

      <Dialog visible={finalDialog} header="确认整项审核通过" confirmBtn="确认审核通过" cancelBtn="返回检查" onConfirm={approveAll} onClose={() => setFinalDialog(false)} onCancel={() => setFinalDialog(false)}>
        <div className="dialog-content"><span className="dialog-icon success"><CheckCircleIcon /></span><div><h3>本次三维重建成果将通过审核</h3><p>确认后，任务 002 将更新为“审核通过”，成果进入已审核锁定状态，并具备下游 CAD 阶段流转条件。</p></div></div>
      </Dialog>
    </div>
  )
}
