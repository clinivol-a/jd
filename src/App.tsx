import { AiBoneIcon, BoneRebuildIcon, OrganIcon, LungVesselIcon, BronchusIcon, AbdomenIcon, SpineRibsIcon, AortaIcon, LungLobesIcon, SkinIcon, MeshEditIcon } from './design-system/MedicalToolIcon'
import { withDemoProjects, projectsFor, defaultFilters, periodRange, canEnter, owns, cleanOwner, noticeProjectTarget, formatNoticeTime, noticeTimestamp } from './projects/projectModel'
import type { Filters, Period, DateRange, ProjectTarget } from './projects/projectModel'
import { ProjectDashboard, ProjectList, ProjectDetail, ExtendedTaskDetail, StageLabel } from './projects/ProjectPages'
import { readProjectRoute, projectUrl } from './projects/routes'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { snapshotCadSubmission } from './cad/cadProject'
import { useCadPanels } from './cad/useCadPanels'
import HeaderHelp from './HeaderHelp'
import WorkspaceTaskActions from './WorkspaceTaskActions'
import ReconstructionStatistics from './ReconstructionStatistics'
import { cadAsset } from './cad/cadProject'
import ObjectStateIcon from './ObjectStateIcon'
const CadWorkspace = lazy(() => import('./cad/CadWorkspace'))
const engineerText = (value: string) => value.replace(/CAD\s+设计/g,'CAD设计').replace(/3D\s+打印/g,'3D打印').replace(/工作版本\s*V\d+/g, '当前成果').replace(/版本\s*V\d+/g, '成果').replace(/(^|\s)V\d+\b/g, '$1').replace(/\s{2,}/g, ' ').replace(/([\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])/g,'$1')
import { Button, Card, Dialog, Drawer, Dropdown, Input, Menu as TMenu, MessagePlugin, Popup, Switch, Table, Tag, Textarea, Tooltip } from 'tdesign-react'
import type { PrimaryTableCol } from 'tdesign-react/es/table'
import {
  AssignmentCheckedIcon, AssignmentErrorFilledIcon, AssignmentErrorIcon, ChatMessageIcon,
  BrowseIcon, CloudIcon,
  ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon,
  FileIcon, HelpCircleIcon, HomeIcon, ImageIcon as TImageIcon, LockOnIcon, MenuFoldIcon, MenuUnfoldIcon, MoonIcon,
  ListDemandIcon, LogoutIcon, Microphone1Icon, NotificationIcon, RefreshIcon, SearchIcon, SendIcon as TSendIcon, SettingIcon, SunnyIcon, TaskCheckedIcon,
  TaskCheckedFilledIcon, TaskFilledIcon, TaskIcon, TimeFilledIcon, TimeIcon,
  UserCircleIcon, UserSafetyIcon, WorkFilledIcon, WorkIcon,
} from './design-system/tdesign'
import {
  Activity, Box, Boxes, Camera, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
  CircleUserRound, Combine, Compass, Contrast, Copy, Crosshair, Database, Download, Eraser, Eye, EyeOff,
  FilePlus2, FolderOpen, Gauge, Grid2X2, Image as ImageIcon, Images, Info, Layers3, LayoutGrid, Lock,
  LockKeyhole, Maximize2, Minimize2, MonitorCog, MousePointer2, Move, Paintbrush, Palette, PanelTop,
  Plus, Puzzle, Rotate3D, RotateCcw, RotateCw, Ruler, Save, ScanLine, Scissors, Search, Send,
  Settings2, SlidersHorizontal, Split, Trash2, Unlock, Upload, WandSparkles, ZoomIn,
} from './design-system/lucide'

export type TaskStatus = '未开始' | '进行中' | '待审核' | '审核退回' | '已完成'
export type TaskType = '三维重建' | 'CAD 设计' | '有限元分析' | '3D 打印'
const taskStageOrder: Record<TaskType, number> = { 三维重建: 0, 'CAD 设计': 1, 有限元分析: 2, '3D 打印': 3 }
type WorkspaceMode = 'ai' | 'view' | 'image' | 'segment'
type WorkspaceTool = { label: string; icon: typeof Eye; options?: string[]; persistent?: boolean; available?: boolean; unavailableReason?: string }
type ReviewCommentStatus = '待修改' | '已修改 · 待复核' | '审核通过'
type ReviewView = 'Axial' | 'Coronal' | 'Sagittal' | '3D View'
type ReviewActorRole = 'doctor' | 'designer'
type ReviewReply = { id: string; author: string; role: ReviewActorRole; time: string; content: string }
type ReviewComment = {
  id: string; taskId: string; round: number; version: string; author: string; time: string
  title: string; content: string; status: ReviewCommentStatus; unread: boolean; submitted: boolean; view: ReviewView; seriesId: string
  position: { x: number; y: number }; slice?: number; camera?: string
  replies: ReviewReply[]
}
type ImagingSeries = {
  id: string; name: string; modality: 'CT' | 'MR'; format: 'DICOM'
  slices: number; thickness: string; studyId: string; studyName: string; studyDate: string
  description: string; downloadUrl?: string
}
export type ReviewerIdentity = { id?: string; name?: string; role: string }
type ApprovedModel = {
  id: string; name: string; version: string; format?: string; approvedAt: string; approvedBy: string; approver?: ReviewerIdentity
}
export type FlowEvent = { id: string; orderNo: string; taskId: string; type: string; name: string; at: string; actor: string; role: string; description: string; version?: string; commentCount?: number; modelId?: string; relatedTaskId?: string; actorId?: string; submissionId?: string }
type UpstreamFeedback = { id: string; cadTaskId: string; upstreamTaskId: string; modelId: string; modelVersion: string; description: string; createdAt: string; actor: string; recipient: string }
export type Task = {
  id: string; title: string; patient: string; orderNo: string; surgery: string; taskType: TaskType
  status: TaskStatus; owner: string; updated: string; deadline: string
  series: ImagingSeries[]; source: string
  upstreamTaskId?: string; approvedModel?: ApprovedModel; cadRequirement?: string
  hospital?: string; dataOrigin?: 'demo' | 'production'
  reviewer?: { id?: string; name: string; role: string }
  review: { time: string; actor: string; status: string; note: string; version?: string; round?: number; commentCount?: number; reviewerIdentity?: ReviewerIdentity; submissionId?: string }[]
}
type SettingsSection = 'profile' | 'security' | 'preferences'
type ThemePreference = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'
export type Screen = { kind: 'home' | 'tasks' | 'reviews' } | { kind: 'detail' | 'workspace' | 'cad-workspace'; taskId: string } | ({ kind: 'project' } & ProjectTarget) | { kind: 'settings'; section: SettingsSection }
type UserProfile = { name: string; employeeId: string; role: string; department: string; avatar: string; phone: string; email: string }
type NotificationPreferences = { taskAssigned: boolean; reviewResult: boolean; doctorComments: boolean; systemMessages: boolean }
export type Notice = { id: number; title: string; detail: string; time: string; createdAt?: string; eventId?: string; unread: boolean; dismissed?: boolean; projectId?: string; taskId?: string; tone: 'info' | 'success' | 'warning' | 'neutral' }
function NoticeSymbol({ notice }: { notice: Pick<Notice, 'tone' | 'unread'> }) {
  const Icon = notice.tone === 'warning' ? AssignmentErrorIcon : notice.tone === 'success' ? TaskCheckedIcon : notice.tone === 'info' ? NotificationIcon : ChatMessageIcon
  return <i className={`notice-symbol notice-symbol-${notice.tone}${notice.unread ? ' notice-symbol-unread' : ''}`} aria-hidden="true"><Icon size={16} /></i>
}
type ProfessionalTab = 'mask' | 'model' | 'measure' | 'property'
type ProfessionalObject = {
  id: string; tab: Exclude<ProfessionalTab, 'property'>; name: string; color: string
  meta: string; details: [string, string][]; value?: string
}

const originalTasks: Task[] = [
  { id: '001', title: '面部骨骼三维重建', patient: 'CV-P-2026-0184', orderNo: 'CV260910-0184', surgery: '颌面创伤术前评估；重建面中部骨性结构，供医生确认骨折范围。', taskType: '三维重建', status: '进行中', owner: '陈屿（三维重建设计师）', updated: '今天 14:32', deadline: '10 月 12 日 18:00', series: [{ id: '001-ct-thin', name: '头颌面薄层 CT', modality: 'CT', format: 'DICOM', slices: 742, thickness: '0.625 mm', studyId: 'ST-20261010-0184', studyName: '头颌面 CT 检查', studyDate: '2026-10-10', description: '原始薄层序列' }, { id: '001-ct-bone', name: '骨窗重建序列', modality: 'CT', format: 'DICOM', slices: 368, thickness: '0.625 mm', studyId: 'ST-20261010-0184', studyName: '头颌面 CT 检查', studyDate: '2026-10-10', description: '骨窗重建' }], source: '订单影像上传 / 原始 DICOM', review: [{ time: '10 月 10 日 09:20', actor: '系统', status: '已分配', note: '任务已分配给陈屿。' }] },
  { id: '002', title: '下颌骨三维重建', patient: 'CV-P-2026-0172', orderNo: 'CV260908-0172', surgery: '下颌骨缺损修复术前规划；确认缺损边界与残余骨段。', taskType: '三维重建', status: '审核退回', owner: '陈屿（三维重建设计师）', updated: '昨天 17:48', deadline: '10 月 11 日 16:00', series: [{ id: '002-ct-mandible', name: '下颌骨薄层 CT', modality: 'CT', format: 'DICOM', slices: 816, thickness: '0.5 mm', studyId: 'ST-20261008-0172', studyName: '下颌骨 CT 检查', studyDate: '2026-10-08', description: '原始薄层序列' }], source: '订单影像上传 / 原始 DICOM', review: [{ time: '10 月 9 日 16:10', actor: '陈屿', status: '已提交审核', note: '版本 V03 已提交。', version: 'V03', round: 1 }, { time: '10 月 10 日 08:42', actor: '周医生', status: '审核退回', note: '请补充分离右侧髁突区域，并检查下颌角边缘连续性。', version: 'V03', round: 1, commentCount: 3 }] },
  { id: '003', title: '颅骨三维重建', patient: 'CV-P-2026-0168', orderNo: 'CV260907-0168', surgery: '颅骨缺损修复术前评估；输出颅骨完整表面供医生审核。', taskType: '三维重建', status: '待审核', owner: '陈屿（三维重建设计师）', updated: '10 月 9 日 18:06', deadline: '10 月 13 日 12:00', series: [{ id: '003-ct-skull', name: '颅骨薄层 CT', modality: 'CT', format: 'DICOM', slices: 694, thickness: '0.625 mm', studyId: 'ST-20261007-0168', studyName: '颅骨 CT 检查', studyDate: '2026-10-07', description: '原始薄层序列' }], source: '订单影像上传 / 原始 DICOM', review: [{ time: '10 月 9 日 18:06', actor: '陈屿', status: '已提交审核', note: '版本 V02 已提交，等待医生审核。' }] },
  { id: '004', title: '面部骨骼手术项目 A', patient: 'CV-P-2026-0211', orderNo: 'CV261019-0211', surgery: '面部骨骼修复术前设计；完成骨性结构重建并提交医生确认。', taskType: '三维重建', status: '待审核', owner: '陈屿（三维重建设计师）', updated: '今天 11:24', deadline: '10 月 24 日 18:00', series: [{ id: '004-ct-face', name: '头颌面薄层 CT', modality: 'CT', format: 'DICOM', slices: 782, thickness: '0.625 mm', studyId: 'ST-20261019-0211', studyName: '头颌面 CT 检查', studyDate: '2026-10-19', description: '原始薄层序列' }], source: '订单影像上传 / 原始 DICOM', review: [{ time: '10 月 23 日 11:24', actor: '陈屿', status: '已提交审核', note: '版本 V04 已提交，等待医生审核。', version: 'V04', round: 1 }] },
  { id: '005', title: '面部骨骼手术项目 A', patient: 'CV-P-2026-0211', orderNo: 'CV261019-0211', surgery: '基于审核通过的三维重建成果开展 CAD 修复设计。', taskType: 'CAD 设计', status: '未开始', owner: '陈屿（CAD 设计师）', updated: '-', deadline: '10 月 28 日 18:00', series: [], source: '上游三维重建成果 / 系统自动关联', upstreamTaskId: '004', cadRequirement: '面部骨骼修复体与术前导板设计。', review: [] },
  { id: '006', title: '下颌骨修复手术项目 B', patient: 'CV-P-2026-0226', orderNo: 'CV261020-0226', surgery: '下颌骨缺损修复术前设计；输出唯一审核通过模型供 CAD 使用。', taskType: '三维重建', status: '已完成', owner: '陈屿（三维重建设计师）', updated: '今天 09:36', deadline: '10 月 22 日 18:00', series: [{ id: '006-ct-mandible', name: '下颌骨薄层 CT', modality: 'CT', format: 'DICOM', slices: 824, thickness: '0.5 mm', studyId: 'ST-20261020-0226', studyName: '下颌骨 CT 检查', studyDate: '2026-10-20', description: '原始薄层序列' }], source: '订单影像上传 / 原始 DICOM', approvedModel: { id: 'MODEL-006-V05', name: '下颌骨三维重建模型', version: 'V05', format: 'STL', approvedAt: '10 月 23 日 09:36', approvedBy: '周医生' }, review: [{ time: '10 月 22 日 16:12', actor: '陈屿', status: '已提交审核', note: '版本 V05 已提交。', version: 'V05', round: 2 }, { time: '10 月 23 日 09:36', actor: '周医生', status: '审核通过', note: '模型已通过最终审核并锁定。', version: 'V05', round: 2 }] },
  { id: '007', title: '下颌骨修复手术项目 B', patient: 'CV-P-2026-0226', orderNo: 'CV261020-0226', surgery: '基于已审核通过的下颌骨模型完成修复体 CAD 设计。', taskType: 'CAD 设计', status: '进行中', owner: '陈屿（CAD 设计师）', updated: '今天 10:08', deadline: '10 月 29 日 18:00', series: [], source: '上游三维重建成果 / 系统自动关联', upstreamTaskId: '006', approvedModel: { id: 'MODEL-006-V05', name: '下颌骨三维重建模型', version: 'V05', format: 'STL', approvedAt: '10 月 23 日 09:36', approvedBy: '周医生' }, cadRequirement: '设计下颌骨修复体，并保留与残余骨段的装配关系。', review: [] },
]

const initialTasks = originalTasks

const initialReviewComments: ReviewComment[] = [
  { id: '002-r1-c1', taskId: '002', round: 1, version: 'V03', author: '周医生', time: '10 月 10 日 08:42', title: '右侧髁突边界分离不完整，请重新检查第 286 层及相邻层面的分割结果，同时确认下颌骨边缘连续性，并进一步检查三维重建后模型表面的平滑程度及局部结构是否存在异常。', content: '右侧髁突边界分离不完整，需要重新检查。请在第 286 层结合相邻层面确认。', status: '待修改', unread: true, submitted: false, view: 'Axial', seriesId: '002-ct-mandible', position: { x: 67, y: 39 }, slice: 286, replies: [] },
  { id: '002-r1-c2', taskId: '002', round: 1, version: 'V03', author: '周医生', time: '10 月 10 日 08:44', title: '下颌骨外缘连续性问题', content: '下颌骨外缘存在连续性问题，需要修正，并注意保留下颌角自然过渡。', status: '待修改', unread: true, submitted: false, view: 'Coronal', seriesId: '002-ct-mandible', position: { x: 38, y: 63 }, slice: 412, replies: [] },
  { id: '002-r1-c3', taskId: '002', round: 1, version: 'V03', author: '周医生', time: '10 月 10 日 08:47', title: '左侧骨缘过渡需要调整', content: '左侧骨缘过渡略显突兀，请调整。复核时保留当前正位观察角度。', status: '待修改', unread: true, submitted: false, view: '3D View', seriesId: '002-ct-mandible', position: { x: 31, y: 44 }, camera: '正位 · 320 mm', replies: [] },
]

const initialNotices: Notice[] = [
  { id: 1, title: '收到新的三维重建任务', detail: '任务 001 已分配，请在预计交付时间前完成。', time: '09:20', eventId:'001-assigned', unread: true, taskId: '001', tone: 'info' },
  { id: 2, title: '医生审核通过', detail: '任务 015 的成果已通过审核。', time: '昨天', unread: false, tone: 'success' },
  { id: 3, title: '医生审核退回', detail: '任务 002 有新的修改意见。', time: '08:42', eventId:'002-review-1', unread: true, taskId: '002', tone: 'warning' },
  { id: 4, title: 'CAD 任务已具备开始条件', detail: '任务 007 已关联审核通过的上游模型。', time: '今天', eventId:'007-model-linked', unread: false, taskId: '007', tone: 'neutral' },
  { id: 5, title: '系统消息', detail: '当前没有需要处理的系统通知。', time: '10 月 8 日', unread: false, tone: 'neutral' },
]

const navItems = [
  { key: 'home', label: '工作台', icon: HomeIcon }, { key: 'tasks', label: '我的项目', icon: TaskIcon },
  { key: 'reviews', label: '审核记录', icon: TaskCheckedIcon },
] as const
const workspaceModes: { key: WorkspaceMode; label: string; icon: typeof Eye }[] = [
  { key: 'ai', label: 'AI', icon: AiBoneIcon }, { key: 'view', label: '视图', icon: Eye },
  { key: 'image', label: '图像', icon: ImageIcon }, { key: 'segment', label: '分割', icon: Layers3 },
]
const toolsets: Record<WorkspaceMode, WorkspaceTool[]> = {
  ai: [
    {label:'骨骼重建',icon:BoneRebuildIcon,available:false}, {label:'器官重建',icon:OrganIcon,available:false},
    {label:'肺血管重建',icon:LungVesselIcon,available:false}, {label:'支气管重建',icon:BronchusIcon,available:false},
    {label:'腹部器官重建',icon:AbdomenIcon,available:false}, {label:'脊柱与肋骨重建',icon:SpineRibsIcon,available:false},
    {label:'腹部大血管重建',icon:AortaIcon,available:false}, {label:'肺叶重建',icon:LungLobesIcon,available:false},
    {label:'皮肤重建',icon:SkinIcon,available:false}, {label:'Mesh编辑',icon:MeshEditIcon,available:false},
  ],
  view: [
    { label: '布局', icon: LayoutGrid, options: ['三位四窗', '多平面重建', '三维主视图（上下）', '三维主视图（左右）'] },
    { label: '伪色', icon: Palette, options: ['灰色', '全谱', '锯齿', '三角'] },
    { label: '参考平面', icon: PanelTop, persistent: true }, { label: '层切', icon: ScanLine, persistent: true },
    { label: '四角信息显隐', icon: Info }, { label: '十字线显隐', icon: Crosshair },
    { label: '浏览序列', icon: Images, persistent: true },
    { label: '蒙版阴影', icon: Layers3, options: ['半', '全', '活动', '二元'], persistent: true },
    { label:'蒙版体积与统计',icon:Gauge,available:false,unavailableReason:'当前工程没有可用于体积统计的体素蒙版数据' },
    { label:'STL属性统计',icon:Box },
  ],
  image: [
    { label: '移动图像', icon: Move, persistent: true }, { label: '缩放', icon: ZoomIn, persistent: true },
    { label: '旋转', icon: RotateCw, options: ['顺时针90', '逆时针90', '旋转180'] },
    { label: '测量距离', icon: Ruler, persistent: true }, { label: '测量角度', icon: Gauge, persistent: true },
    { label: '窗宽窗位调整', icon: SlidersHorizontal, persistent: true }, { label: '图像高级预处理', icon: WandSparkles },
  ],
  segment: [
    { label: '新建蒙版', icon: Plus }, { label: '阈值分割', icon: SlidersHorizontal, persistent: true },
    { label: '区域生长', icon: Paintbrush, persistent: true }, { label: '动态区域生长', icon: Gauge, persistent: true },
    { label: '编辑蒙版', icon: Layers3, persistent: true }, { label: '3D蒙版擦除', icon: Eraser, persistent: true },
    { label: '多断层编辑', icon: Grid2X2, persistent: true }, { label: '分离蒙版', icon: Split },
    { label: '布尔操作', icon: Combine }, { label: '拆分蒙版', icon: Scissors },
    { label: '快速重建', icon: Boxes, options: ['骨骼重建', '器官重建', '血管重建', '支气管重建', '皮肤重建'] },
  ],
}
const initialProfessionalObjects: ProfessionalObject[] = [
  { id: 'mask-bone', tab: 'mask', name: '牙齿与下颌骨密质骨', color: '#19B778', meta: '阈值 87–1286', details: [['阈值下限', '87'], ['阈值上限', '1286'], ['来源', 'CT · Head / Bone']] },
  { id: 'mask-lesion', tab: 'mask', name: '颧骨损伤疑似影区', color: '#F04444', meta: '阈值 87–1286', details: [['阈值下限', '87'], ['阈值上限', '1286'], ['来源', 'CT · Head / Bone']] },
  { id: 'mask-sinus', tab: 'mask', name: '上颌窦腔渗出软组织', color: '#2F74F0', meta: '阈值 38–286', details: [['阈值下限', '38'], ['阈值上限', '286'], ['来源', 'CT · Head / Soft Tissue']] },
  { id: 'model-skull', tab: 'model', name: '颅骨模型', color: '#19B778', meta: '三角面 245,320', details: [['模型类型', '表面模型'], ['三角面片', '245,320'], ['透明度', '80%']] },
  { id: 'model-teeth', tab: 'model', name: '牙骨模型', color: '#2F74F0', meta: '三角面 96,450', details: [['模型类型', 'STL 模型'], ['三角面片', '96,450'], ['透明度', '80%']] },
  { id: 'measure-distance', tab: 'measure', name: '距离测量 01', color: '#F0B429', meta: '32.6 mm', value: '32.6 mm', details: [['测量类型', '距离'], ['测量结果', '32.6 mm'], ['定位视图', 'Axial']] },
  { id: 'measure-angle', tab: 'measure', name: '角度测量 01', color: '#7B61D1', meta: '76.5°', value: '76.5°', details: [['测量类型', '角度'], ['测量结果', '76.5°'], ['定位视图', 'Coronal']] },
]
const statusTheme: Record<TaskStatus, 'default' | 'primary' | 'warning' | 'danger' | 'success'> = { 未开始: 'default', 进行中: 'primary', 审核退回: 'danger', 待审核: 'warning', 已完成: 'success' }
const layout = { sidebar: 224, sidebarCollapsed: 64 } as const
const initialUserProfile: UserProfile = { name: '陈屿', employeeId: 'CV-DS-028', role: '三维重建设计师', department: '数字医学设计中心', avatar: '/assets/avatar-chen-yu.png', phone: '', email: '' }
const initialNotificationPreferences: NotificationPreferences = { taskAssigned: true, reviewResult: true, doctorComments: true, systemMessages: false }

function getStoredThemePreference(): ThemePreference {
  const stored = localStorage.getItem('clinivol-theme-preference')
  return stored === 'dark' || stored === 'system' ? stored : 'light'
}

function getStoredUserProfile(): UserProfile {
  try {
    const stored = JSON.parse(localStorage.getItem('clinivol-user-profile') ?? '{}') as Partial<UserProfile>
    const profile = { ...initialUserProfile, ...stored }
    if (profile.phone === '138 0000 0280') profile.phone = ''
    if (profile.email === 'chenyu.demo@clinivol.example') profile.email = ''
    return profile
  }
  catch { return initialUserProfile }
}

function getStoredNotificationPreferences(): NotificationPreferences {
  try { return { ...initialNotificationPreferences, ...JSON.parse(localStorage.getItem('clinivol-notification-preferences') ?? '{}') as Partial<NotificationPreferences> } }
  catch { return initialNotificationPreferences }
}

function getDashboardDate(date = new Date()) {
  const weekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'long' }).format(date)
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日 · ${weekday}`
}

const CAD_LOCKED_REASON = '上游三维重建尚未完成，暂无法开始 CAD 设计。'
const seedDates: Record<string, [string, string, string?]> = {
  '001': ['2026-10-09T09:00:00', '2026-10-10T09:20:00', '2026-10-10T10:05:00'],
  '002': ['2026-10-07T09:00:00', '2026-10-08T09:15:00', '2026-10-08T10:00:00'],
  '003': ['2026-10-06T09:00:00', '2026-10-07T09:15:00', '2026-10-07T10:00:00'],
  '004': ['2026-10-19T09:00:00', '2026-10-19T10:00:00', '2026-10-20T09:00:00'],
  '005': ['2026-10-19T09:00:00', '2026-10-19T10:10:00'],
  '006': ['2026-10-20T09:00:00', '2026-10-20T10:00:00', '2026-10-20T11:00:00'],
  '007': ['2026-10-20T09:00:00', '2026-10-20T10:10:00', '2026-10-23T10:08:00'],
}
const eventTime = (value: string) => { if (/^\d{4}-\d\d-\d\dT/.test(value)) return value; const match = value.match(/(\d+)\s*(?:月|\/)\s*(\d+)\s*日?\s*(\d+):(\d+)/); return match ? `2026-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}T${match[3].padStart(2, '0')}:${match[4]}:00` : '2026-10-23T00:00:00' }
const displayEventTime = (at: string) => { const date = new Date(at); return `${date.getMonth() + 1} 月 ${date.getDate()} 日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` }
function initialFlowEvents(): FlowEvent[] {
  return originalTasks.flatMap((task) => {
    const [created, assigned, started] = seedDates[task.id]
    const event = (suffix: string, at: string, name: string, actor: string, role: string, description: string): FlowEvent => ({ id: `${task.id}-${suffix}`, orderNo: task.orderNo, taskId: task.id, type: suffix, name, at, actor, role, description })
    const entries = [event('created', created, '任务已创建', '系统', '系统', `订单 ${task.orderNo} 创建，生成${task.taskType}任务。`), event('assigned', assigned, '任务已分配', '系统', '系统', `分配给${task.owner.split('（')[0]}`)]
    if (started) entries.push(event('started', started, '任务已开始', task.owner.split('（')[0], '工程师', `${task.taskType}任务开始处理。`))
    task.review.forEach((review, index) => { if (review.status !== '已分配') entries.push({ ...event(`review-${index}`, eventTime(review.time), review.status, review.actor, review.reviewerIdentity?.role ?? (review.actor.includes('医生') ? '医生' : '工程师'), review.status === '审核退回' ? '审核退回，请处理审核意见。' : review.note), version: review.version, commentCount: review.commentCount, actorId: review.reviewerIdentity?.id, submissionId: review.submissionId, modelId: review.status === '审核通过' ? task.approvedModel?.id : undefined }) })
    if (task.status === '已完成' && task.approvedModel) entries.push({ ...event('completed', eventTime(task.approvedModel.approvedAt), '任务已完成', '系统', '系统', `审核通过的成果 ${task.approvedModel.version} 已锁定。`), modelId: task.approvedModel.id })
    if (task.taskType === 'CAD 设计' && task.approvedModel && started) entries.push({ ...event('model-linked', '2026-10-23T09:37:00', '上游成果已关联', '系统', '系统', `已关联任务 ${task.upstreamTaskId} 的正式批准模型 ${task.approvedModel.version}，CAD 任务进入进行中。`), modelId: task.approvedModel.id, relatedTaskId: task.upstreamTaskId })
    return entries
  })
}
function getStoredFlowEvents() {
  try {
    const saved = JSON.parse(localStorage.getItem('clinivol-task-flow-events') ?? 'null') as FlowEvent[] | null
    const seeds = initialFlowEvents()
    const legacy = getStoredTasks().flatMap((task) => task.review.slice(initialTasks.find((item) => item.id === task.id)?.review.length ?? 0).filter((review) => review.status !== '已分配' && review.status !== '任务已分配').map((review, index) => ({ id: `${task.id}-legacy-review-${index}`, orderNo: task.orderNo, taskId: task.id, type: 'review-history', name: review.status, at: eventTime(review.time), actor: review.actor, role: review.actor.includes('医生') ? '医生' : '工程师', description: review.note, version: review.version, commentCount: review.commentCount } satisfies FlowEvent)))
    const combined = [...seeds, ...legacy]
    const retained = saved?.filter((event) => event.type !== 'workspace-opened' && event.name !== '进入 CAD 工作区' && event.name !== '已分配' && event.type !== 'assigned' && event.name !== '任务已分配')
    return retained ? [...combined.filter((event) => !retained.some((item) => item.id === event.id || item.taskId === event.taskId && item.name === event.name && item.at.slice(0, 16) === event.at.slice(0, 16))), ...retained] : combined
  } catch { return initialFlowEvents() }
}
function getStoredFeedback() { try { return JSON.parse(localStorage.getItem('clinivol-upstream-feedback') ?? '[]') as UpstreamFeedback[] } catch { return [] as UpstreamFeedback[] } }

function isCadTaskUnlocked(task: Task, tasks: Task[]) {
  if (task.taskType !== 'CAD 设计' || !task.upstreamTaskId) return task.taskType !== 'CAD 设计'
  const upstream = tasks.find((item) => item.id === task.upstreamTaskId)
  return upstream?.status === '已完成' && Boolean(upstream.approvedModel)
}

function synchronizeCadTasks(tasks: Task[]): Task[] {
  return tasks.map((task) => {
    if (task.taskType !== 'CAD 设计' || !task.upstreamTaskId) return task
    const upstream = tasks.find((item) => item.id === task.upstreamTaskId)
    const unlocked = upstream?.status === '已完成' && Boolean(upstream.approvedModel)
    const status: TaskStatus = unlocked ? (task.status === '未开始' ? '进行中' : task.status) : '未开始'
    return {
      ...task,
      status,
      approvedModel: unlocked ? task.approvedModel ?? upstream?.approvedModel : task.approvedModel,
    }
  })
}

function getStoredTasks() {
  try {
    const stored = localStorage.getItem('clinivol-prototype-tasks')
    if (!stored) return synchronizeCadTasks(initialTasks)
    const parsed = JSON.parse(stored) as Task[]
    return synchronizeCadTasks(initialTasks.map((task) => {
      const storedTask = parsed.find((item) => item.id === task.id)
      const merged = { ...task, ...storedTask, title: task.title, taskType: task.taskType, series: task.series, upstreamTaskId: task.upstreamTaskId, approvedModel: storedTask?.approvedModel ?? task.approvedModel, source: task.source }
      if (merged.approvedModel?.id === 'MODEL-006-V05') merged.approvedModel = { ...merged.approvedModel, name: '下颌骨三维重建模型' }
      if ((storedTask?.status as string) === '审核中') merged.status = '待审核'
      if (merged.id === '005') merged.updated = '-'
      if (merged.id === '003' && storedTask?.status === '审核退回' && task.status === '待审核') {
        merged.status = task.status
        merged.updated = task.updated
        merged.review = task.review
      }
      if (merged.id === '002' && merged.status === '审核退回' && !merged.review.some((item) => item.commentCount)) {
        merged.review = merged.review.map((item, index) => index === merged.review.length - 1 ? { ...item, version: 'V03', round: 1, commentCount: 3 } : item)
      }
      return merged
    }))
  }
  catch { return synchronizeCadTasks(initialTasks) }
}

function getStoredWorkspaceState(): { savedAt?: Record<string, string>; mode?: Record<string, WorkspaceMode>; activeSeries?: Record<string, string> } {
  try {
    const stored = localStorage.getItem('clinivol-workspace-state')
    if (!stored) return {}
    const parsed = JSON.parse(stored) as { savedAt?: Record<string, string>; mode?: Record<string, string>; activeSeries?: Record<string, string> }
    const mode = Object.fromEntries(Object.entries(parsed.mode ?? {}).map(([taskId, value]) => {
      const nextMode: WorkspaceMode = value === 'model' ? 'view' : value === 'measure' ? 'image' : value === 'ai' || value === 'view' || value === 'image' || value === 'segment' ? value : 'view'
      return [taskId, nextMode]
    }))
    return { ...parsed, mode }
  } catch { return {} }
}

function getStoredReviewComments() {
  try {
    const stored = localStorage.getItem('clinivol-review-comments')
    if (!stored) return initialReviewComments
    const parsed = JSON.parse(stored) as Array<Omit<Partial<ReviewComment>, 'status' | 'replies'> & { status?: string; replies?: Array<Partial<ReviewReply>> }>
    return parsed.map((comment, index) => {
      const fallback = initialReviewComments.find((item) => item.id === comment.id) ?? initialReviewComments[index] ?? initialReviewComments[0]
      const status: ReviewCommentStatus = comment.status === '审核通过'
        ? '审核通过'
        : comment.status === '已修改 · 待复核' || comment.status === '已解决'
          ? '已修改 · 待复核'
          : '待修改'
      return {
        ...fallback,
        ...comment,
        title: comment.id === '002-r1-c1' ? fallback.title : comment.title || fallback.title,
        status,
        unread: typeof comment.unread === 'boolean' ? comment.unread : comment.status === '未读',
        submitted: Boolean(comment.submitted),
        replies: (comment.replies ?? []).map((reply, replyIndex) => ({
          id: reply.id ?? `${comment.id ?? fallback.id}-reply-${replyIndex}`,
          author: reply.author ?? '陈屿',
          role: (reply.role === 'doctor' ? 'doctor' : reply.role === 'designer' ? 'designer' : reply.author?.includes('医生') ? 'doctor' : 'designer') as ReviewActorRole,
          time: reply.time ?? '刚刚',
          content: reply.content ?? '',
        })),
      }
    })
  } catch { return initialReviewComments }
}

function validateRoute(route:Screen,tasks:Task[]):Screen {
  if(route.kind==='detail'||route.kind==='workspace'||route.kind==='cad-workspace') {
    const task=tasks.find(t=>t.id===route.taskId)
    if(!task||!owns(task))return {kind:'tasks'}
    if(route.kind==='detail'&&task.taskType==='CAD 设计'&&!canEnter(task,tasks))return {kind:'project',projectId:task.orderNo}
    if((route.kind==='workspace'||route.kind==='cad-workspace')&&!canEnter(task,tasks))return {kind:'project',projectId:task.orderNo}
    if(route.kind!=='detail')return {kind:task.taskType==='CAD 设计'?'cad-workspace':'workspace',taskId:task.id}
  }
  if(route.kind==='detail'){const task=tasks.find(item=>item.id===route.taskId);if(task)return {kind:'project',projectId:task.orderNo,taskId:task.id}}
  return route
}
function App() {
  const storedWorkspaceState = useMemo(getStoredWorkspaceState, [])
  const [tasks, setTasks] = useState<Task[]>(getStoredTasks)
  const [screen, rawSetScreen] = useState<Screen>(() => validateRoute(readProjectRoute(),getStoredTasks()))
  const setScreen = (next:Screen) => { const safe=validateRoute(next,tasks); if(window.location.hash!==projectUrl(safe)) window.history.pushState(null,'',projectUrl(safe)); rawSetScreen(safe) }
  const detailReturnScreen=useRef<Screen>({kind:'tasks'})
  const projectReturnScreen=useRef<Screen>({kind:'tasks'})
  const [projectFilters,setProjectFilters] = useState<Filters>(()=>{try { const saved=JSON.parse(localStorage.getItem('project-list-filters')??'null'); return saved?{...defaultFilters(),...saved,range:saved.period==='custom'?saved.range:periodRange(saved.period)}:defaultFilters() }catch{return defaultFilters()}})
  const [homeFilter,setHomeFilter] = useState<{period:Period;range:DateRange}>(()=>{try {const saved=JSON.parse(localStorage.getItem('project-home-filter')??'null');return saved?{...saved,range:saved.period==='custom'?saved.range:periodRange(saved.period)}:{period:'3m',range:periodRange('3m')}}catch{return {period:'3m',range:periodRange('3m')}}})
  useEffect(()=>{localStorage.setItem('project-list-filters',JSON.stringify(projectFilters))},[projectFilters])
  useEffect(()=>{localStorage.setItem('project-home-filter',JSON.stringify(homeFilter))},[homeFilter])
  const settingsReturnScreen = useRef<Screen>({ kind: 'home' })
  const [themePreference, setThemePreference] = useState<ThemePreference>(getStoredThemePreference)
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)
  const [userProfile, setUserProfile] = useState<UserProfile>(getStoredUserProfile)
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(getStoredNotificationPreferences)
  const [authenticated, setAuthenticated] = useState(true)
  const [logoutVisible, setLogoutVisible] = useState(false)
  const [openTabs, setOpenTabs] = useState<string[]>(['001'])
  const [dirty, setDirty] = useState<Record<string, boolean>>({})
  const [savedAt, setSavedAt] = useState<Record<string, string>>(storedWorkspaceState.savedAt ?? { '001': '14:32' })
  const [workspaceMode, setWorkspaceMode] = useState<Record<string, WorkspaceMode>>(storedWorkspaceState.mode ?? { '001': 'view', '002': 'segment', '003': 'view' })
  const [activeSeries, setActiveSeries] = useState<Record<string, string>>(storedWorkspaceState.activeSeries ?? {})
  const [submitTask, setSubmitTask] = useState<string | null>(null)
  const [submitTarget, setSubmitTarget] = useState<'doctor' | 'salesperson'>('doctor')
  const [guardAction, setGuardAction] = useState<(() => void) | null>(null)
  const [locked, setLocked] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notices, setNotices] = useState(initialNotices)
  const [reviewComments, setReviewComments] = useState<ReviewComment[]>(getStoredReviewComments)
  const [flowEvents, setFlowEvents] = useState<FlowEvent[]>(getStoredFlowEvents)
  const [upstreamFeedback, setUpstreamFeedback] = useState<UpstreamFeedback[]>(getStoredFeedback)
  const [reviewFocus, setReviewFocus] = useState<{ taskId: string; commentId?: string } | null>(null)
  const [navCollapsed, setNavCollapsed] = useState(false)
  const reviewResetEnabled = useMemo(() => new URLSearchParams(window.location.search).has('build'), [])
  const resolvedTheme: ResolvedTheme = themePreference === 'system' ? (systemDark ? 'dark' : 'light') : themePreference
  useEffect(() => localStorage.setItem('clinivol-prototype-tasks', JSON.stringify(tasks)), [tasks])
  useEffect(() => {
    setTasks((current) => {
      const synchronized = synchronizeCadTasks(current)
      const changed = synchronized.some((task, index) => task.status !== current[index]?.status || task.approvedModel?.id !== current[index]?.approvedModel?.id)
      return changed ? synchronized : current
    })
  }, [tasks])
  useEffect(() => localStorage.setItem('clinivol-workspace-state', JSON.stringify({ savedAt, mode: workspaceMode, activeSeries })), [savedAt, workspaceMode, activeSeries])
  useEffect(() => localStorage.setItem('clinivol-review-comments', JSON.stringify(reviewComments)), [reviewComments])
  useEffect(() => localStorage.setItem('clinivol-task-flow-events', JSON.stringify(flowEvents)), [flowEvents])
  useEffect(() => localStorage.setItem('clinivol-upstream-feedback', JSON.stringify(upstreamFeedback)), [upstreamFeedback])
  useEffect(() => localStorage.setItem('clinivol-user-profile', JSON.stringify(userProfile)), [userProfile])
  useEffect(() => localStorage.setItem('clinivol-notification-preferences', JSON.stringify(notificationPreferences)), [notificationPreferences])
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = (event: MediaQueryListEvent | MediaQueryList) => setSystemDark(event.matches)
    update(media)
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])
  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.setAttribute('theme-mode', resolvedTheme)
    document.documentElement.style.colorScheme = resolvedTheme
    localStorage.setItem('clinivol-theme-preference', themePreference)
  }, [resolvedTheme, themePreference])

  const currentWorkspaceId = screen.kind === 'workspace' || screen.kind === 'cad-workspace' ? screen.taskId : null
  const currentTask = currentWorkspaceId ? tasks.find((task) => task.id === currentWorkspaceId) : undefined
  const projects=useMemo(()=>withDemoProjects(projectsFor(tasks,flowEvents)),[tasks,flowEvents])
  const unreadCount = notices.filter((notice) => notice.unread).length
  const runWithGuard = (action: () => void) => { if (currentWorkspaceId && dirty[currentWorkspaceId]) setGuardAction(() => action); else action() }
  useEffect(()=>{ const onHash=()=>runWithGuard(()=>rawSetScreen(validateRoute(readProjectRoute(),tasks)));window.addEventListener('popstate',onHash);window.addEventListener('hashchange',onHash);return ()=>{window.removeEventListener('popstate',onHash);window.removeEventListener('hashchange',onHash)} },[tasks,dirty,currentWorkspaceId])
  const [projectNavigationKey,setProjectNavigationKey]=useState(0)
  const openProject=(projectId:string,target?:ProjectTarget)=>runWithGuard(()=>{
    if(screen.kind!=='project')projectReturnScreen.current=screen.kind==='home'?{kind:'home'}:{kind:'tasks'}
    setProjectNavigationKey(key=>key+1)
    setScreen({kind:'project',projectId,taskId:target?.taskId,eventId:target?.eventId})
  })
  const openStat=(status:Filters['status'])=>{setProjectFilters({...defaultFilters(),view:'tasks',status,period:'custom',range:['',''],source:'a-statistics'});goPlatform('tasks')}
  const goPlatform = (kind: 'home' | 'tasks' | 'reviews') => runWithGuard(() => setScreen({ kind }))
  const openTaskDetail = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return
    openProject(task.orderNo,{projectId:task.orderNo,taskId})
  }
  const openWorkspace = (taskId: string, options?: { openComments?: boolean; commentId?: string }) => {
    const action = () => {
      const task = tasks.find((item) => item.id === taskId)
      if (!task) return
      if(!owns(task)||!['三维重建','CAD 设计'].includes(task.taskType)) return
      if (task.taskType === 'CAD 设计') {
        if (!isCadTaskUnlocked(task, tasks)) {
          void MessagePlugin.warning(CAD_LOCKED_REASON)
          return
        }
        setOpenTabs((tabs) => tabs.includes(taskId) ? tabs : [...tabs, taskId])
        setScreen({ kind: 'cad-workspace', taskId })
        setReviewFocus(options?.openComments ? { taskId, commentId: options.commentId } : null)
        setNotificationsOpen(false)
        return
      }
      if (task && !activeSeries[taskId]) setActiveSeries((value) => ({ ...value, [taskId]: task.series[0]?.id ?? '' }))
      setOpenTabs((tabs) => tabs.includes(taskId) ? tabs : [...tabs, taskId]); setScreen({ kind: 'workspace', taskId }); setNotificationsOpen(false)
      setReviewFocus(options?.openComments ? { taskId, commentId: options.commentId } : null)
      if (task?.series.length) void MessagePlugin.success(`任务 ${taskId}：已自动加载 ${task.series.length} 组关联序列${savedAt[taskId] ? '并恢复已保存工作状态' : ''}`)
      else if (task) void MessagePlugin.error('关联影像暂不可用，请稍后重试')
    }
    if (currentWorkspaceId !== taskId) runWithGuard(action); else action()
  }
  const closeTab = (taskId: string) => {
    const activeWorkspace = (screen.kind === 'workspace' || screen.kind === 'cad-workspace') && screen.taskId === taskId
    const action = () => { setOpenTabs((tabs) => tabs.filter((id) => id !== taskId)); if (activeWorkspace) setScreen({ kind: 'home' }) }
    if (activeWorkspace) runWithGuard(action); else action()
  }
  const saveTask = (taskId: string, announce = true) => {
    const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
    try { localStorage.setItem('clinivol-workspace-state', JSON.stringify({ savedAt: { ...savedAt, [taskId]: now }, mode: workspaceMode, activeSeries })) }
    catch { return false }
    setDirty((value) => ({ ...value, [taskId]: false })); setSavedAt((value) => ({ ...value, [taskId]: now })); setTasks((items) => items.map((task) => task.id === taskId ? { ...task, updated: `今天 ${now}` } : task))
    if (announce) void MessagePlugin.success(`任务 ${taskId} 已保存`)
    return true
  }
  const continueGuard = (saveFirst: boolean) => {
    if (currentWorkspaceId && saveFirst && !saveTask(currentWorkspaceId, false)) return
    if (currentWorkspaceId && !saveFirst) setDirty((value) => ({ ...value, [currentWorkspaceId]: false }))
    const action = guardAction; setGuardAction(null); action?.()
  }
  const submitReview = (taskId: string) => {
    const current = tasks.find((task) => task.id === taskId)
    if (!current || current.status === '待审核' || current.status === '已完成') return
    let version = 'V04'
    if (current.taskType === 'CAD 设计') {
      if (!isCadTaskUnlocked(current, tasks)) return
      try { version = snapshotCadSubmission(taskId) }
      catch { void MessagePlugin.error('CAD 工程版本保存失败，请返回工作区重试'); return }
    }
    const stamp = new Date().toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
    const note = `工作版本 ${version} 已冻结并提交审核。`
    setTasks((items) => items.map((task) => task.id === taskId ? { ...task, status: '待审核', updated: '刚刚', review: [...task.review, { time: stamp, actor: '陈屿', status: '已提交审核', note, ...(current.taskType === 'CAD 设计' ? { version } : {}) }] } : task))
    setFlowEvents((events) => [...events, { id: `${taskId}-review-${crypto.randomUUID()}`, orderNo: current.orderNo, taskId, type: 'review-submit', name: '已提交审核', at: new Date().toISOString(), actor: '陈屿', role: '工程师', description: note, version }])
    setReviewComments((items) => items.map((comment) => comment.taskId === taskId ? { ...comment, submitted: comment.status === '已修改 · 待复核' } : comment))
    setDirty((value) => ({ ...value, [taskId]: false })); setSubmitTask(null); void MessagePlugin.success(`任务 ${taskId} 已提交，成果已锁定`)
  }
  const openNotice = (notice: Notice) => {
    setNotices((items) => items.map((item) => item.id === notice.id ? { ...item, unread: false } : item))
    const target=noticeProjectTarget(notice,projects,flowEvents)
    if(target) {
      setNotificationsOpen(false)
      openProject(target.projectId,target)
    } else {
      // Unlinked notices remain readable in the existing notification center.
      setNotificationsOpen(true)
      if(notice.projectId||notice.taskId||notice.eventId)void MessagePlugin.warning('关联项目不可访问或已不存在')
    }
  }
  const dismissNotice = (noticeId: number) => setNotices((items) => items.map((item) => item.id === noticeId ? { ...item, dismissed: true } : item))
  const updateReviewComment = (commentId: string, changes: Partial<Pick<ReviewComment, 'status' | 'replies' | 'unread' | 'submitted'>>) => setReviewComments((items) => items.map((item) => item.id === commentId ? { ...item, ...changes } : item))
  const submitUpstreamFeedback = (task: Task, description: string) => {
    const upstream = tasks.find((item) => item.id === task.upstreamTaskId)
    if (!upstream || !task.approvedModel || !isCadTaskUnlocked(task, tasks) || !description.trim()) return false
    const id = crypto.randomUUID(); const at = new Date().toISOString()
    const feedback: UpstreamFeedback = { id, cadTaskId: task.id, upstreamTaskId: upstream.id, modelId: task.approvedModel.id, modelVersion: task.approvedModel.version, description: description.trim(), createdAt: at, actor: userProfile.name, recipient: upstream.owner }
    setUpstreamFeedback((items) => [...items, feedback])
    setFlowEvents((events) => [...events, { id: `feedback-${id}`, orderNo: task.orderNo, taskId: task.id, relatedTaskId: upstream.id, modelId: feedback.modelId, type: 'upstream-feedback', name: '已反馈上游问题', at, actor: feedback.actor, role: 'CAD 工程师', description: feedback.description }])
    return true
  }
  const resetReviewDemo = (taskId: string) => {
    const initialTask = initialTasks.find((task) => task.id === taskId)
    const initialComments = initialReviewComments.filter((comment) => comment.taskId === taskId)
    if (!initialTask || initialComments.length === 0) return
    setTasks((items) => items.map((task) => task.id === taskId ? { ...task, status: initialTask.status, updated: initialTask.updated, review: initialTask.review.map((item) => ({ ...item })) } : task))
    setReviewComments((items) => [...items.filter((comment) => comment.taskId !== taskId), ...initialComments.map((comment) => ({ ...comment, position: { ...comment.position }, replies: [] }))])
    setFlowEvents((events) => [...events.filter((event) => event.taskId !== taskId), ...initialFlowEvents().filter((event) => event.taskId === taskId)])
    setNotices((items) => items.map((notice) => notice.taskId === taskId && notice.tone === 'warning' ? { ...notice, unread: true, dismissed: false } : notice))
    setDirty((items) => ({ ...items, [taskId]: false }))
    setReviewFocus({ taskId, commentId: initialComments[0].id })
    void MessagePlugin.success(`任务 ${taskId} 的审核示例数据已重置`)
  }

  const openSettings = (section: SettingsSection) => {
    if (screen.kind !== 'settings') settingsReturnScreen.current = screen
    runWithGuard(() => setScreen({ kind: 'settings', section }))
  }
  const closeSettings = () => setScreen(settingsReturnScreen.current.kind === 'settings' ? { kind: 'home' } : settingsReturnScreen.current)
  const requestLogout = () => setLogoutVisible(true)
  const settingsReturnLabel = settingsReturnScreen.current.kind === 'home' ? '返回工作台' : settingsReturnScreen.current.kind === 'tasks' ? '返回项目' : settingsReturnScreen.current.kind === 'reviews' ? '返回审核记录' : settingsReturnScreen.current.kind === 'detail' ? '返回任务详情' : '返回专业工作区'

  if (!authenticated) return <SignedOutScreen onReenter={() => setAuthenticated(true)} />

  return <div className="app" style={{ '--layout-sidebar-width': `${layout.sidebar}px`, '--layout-sidebar-collapsed-width': `${layout.sidebarCollapsed}px` } as React.CSSProperties}>
    <GlobalHeader screen={screen} openTabs={openTabs} tasks={tasks} user={userProfile} theme={resolvedTheme} goHome={() => goPlatform('home')} openWorkspace={openWorkspace} closeTab={closeTab} unreadCount={unreadCount} onThemeToggle={() => setThemePreference(resolvedTheme === 'light' ? 'dark' : 'light')} onNotifications={() => setNotificationsOpen(true)} onLock={() => setLocked(true)} onOpenSettings={openSettings} onLogout={requestLogout} />
    <div className="content-stage">
      {screen.kind === 'workspace' && currentTask ? <Workspace task={currentTask} dirty={Boolean(dirty[currentTask.id])} savedAt={savedAt[currentTask.id]} mode={workspaceMode[currentTask.id] ?? 'view'} activeSeriesId={activeSeries[currentTask.id] ?? currentTask.series[0]?.id ?? ''} comments={reviewComments.filter((comment) => comment.taskId === currentTask.id)} reviewFocus={reviewFocus?.taskId === currentTask.id ? reviewFocus : null} reviewResetEnabled={reviewResetEnabled} onReviewFocusConsumed={() => setReviewFocus(null)} onUpdateComment={updateReviewComment} onResetReview={() => resetReviewDemo(currentTask.id)} onSeriesChange={(seriesId) => setActiveSeries((value) => ({ ...value, [currentTask.id]: seriesId }))} onModeChange={(mode) => setWorkspaceMode((value) => ({ ...value, [currentTask.id]: mode }))} onDirty={() => setDirty((value) => ({ ...value, [currentTask.id]: true }))} onSave={(announce = true) => saveTask(currentTask.id, announce)} onSubmit={() => { setSubmitTarget('doctor'); setSubmitTask(currentTask.id) }} onSubmitSalesperson={() => { setSubmitTarget('salesperson'); setSubmitTask(currentTask.id) }} /> : screen.kind === 'cad-workspace' && currentTask && isCadTaskUnlocked(currentTask, tasks) ? <Suspense fallback={<div className="panel-empty">正在打开 CAD 工作区…</div>}><CadWorkspace reviewFocus={reviewFocus?.taskId === currentTask.id ? reviewFocus : null} onReviewFocusConsumed={() => setReviewFocus(null)} key={currentTask.id} task={currentTask} comments={reviewComments.filter((comment) => comment.taskId === currentTask.id)} onBack={() => openProject(currentTask.orderNo,{projectId:currentTask.orderNo,taskId:currentTask.id})} onSubmit={() => { setSubmitTarget('doctor'); setSubmitTask(currentTask.id) }} onSubmitSalesperson={() => { setSubmitTarget('salesperson'); setSubmitTask(currentTask.id) }} renderReviewPanel={(bridge) => <ReviewCommentsPanel comments={reviewComments.filter((comment) => comment.taskId === currentTask.id)} selectedCommentId={bridge.selectedId} readOnly={currentTask.status === '待审核' || currentTask.status === '已完成'} syncState={bridge.syncState} syncedAt={bridge.syncedAt} resetEnabled={false} onSelect={(comment) => { bridge.onSelect(comment.id); if (comment.unread) updateReviewComment(comment.id, { unread: false }) }} onClose={bridge.onClose} onUpdate={updateReviewComment} onQueueSync={bridge.onQueueSync} onReset={() => {}} onSubmit={bridge.onSubmit} />} /></Suspense> :
        <PlatformShell screen={screen} goPlatform={goPlatform} collapsed={navCollapsed} onCollapsedChange={setNavCollapsed}>
          {screen.kind === 'home' && <ProjectDashboard projects={projects} tasks={tasks} events={flowEvents} notices={notices} userName={userProfile.name} homeFilter={homeFilter} onHomeFilter={setHomeFilter} onProject={openProject} onNotice={openNotice} onDismiss={dismissNotice} onStat={openStat} onAll={()=>{setProjectFilters({...defaultFilters(),period:homeFilter.period,range:homeFilter.range});goPlatform('tasks')}} />}
          {screen.kind === 'tasks' && <ProjectList projects={projects} tasks={tasks} filters={projectFilters} onFilters={setProjectFilters} onProject={openProject} onOpen={openWorkspace} />}
          {screen.kind==='project'&&<ProjectDetail project={projects.find(p=>p.id===screen.projectId)} tasks={tasks} events={flowEvents} target={screen} navigationKey={projectNavigationKey} onBack={()=>setScreen(projectReturnScreen.current)} onOpen={openWorkspace}/>}
          {screen.kind === 'reviews' && <Reviews tasks={tasks} onDetail={openTaskDetail} />}
          {screen.kind === 'detail' && <TaskDetail task={tasks.find((task) => task.id === screen.taskId)!} tasks={tasks} events={flowEvents} feedback={upstreamFeedback} comments={reviewComments.filter((comment) => comment.taskId === screen.taskId)} onBack={() => setScreen(detailReturnScreen.current)} onOpen={(taskId, options) => openWorkspace(taskId, options)} onFeedback={submitUpstreamFeedback} />}
          {screen.kind === 'settings' && <SettingsPage section={screen.section} onSectionChange={(section) => setScreen({ kind: 'settings', section })} onBack={closeSettings} returnLabel={settingsReturnLabel} user={userProfile} onUserChange={setUserProfile} themePreference={themePreference} onThemePreferenceChange={setThemePreference} notificationPreferences={notificationPreferences} onNotificationPreferencesChange={setNotificationPreferences} onLogout={requestLogout} />}
        </PlatformShell>}
    </div>
    <Drawer visible={notificationsOpen} placement="right" size="400px" header={<div className="drawer-title"><span>通知中心</span><Tag theme="primary" variant="light">{unreadCount} 条未读</Tag></div>} footer={false} onClose={() => setNotificationsOpen(false)}>
      <div className="notice-list">{notices.filter((notice) => !notice.dismissed).map((notice) => <div key={notice.id} className={`notice-item notice-${notice.tone} ${notice.unread ? 'notice-unread' : ''}`}><button className="notice-item-main" onClick={() => openNotice(notice)}><NoticeSymbol notice={notice} /><span><strong>{notice.title}</strong>{notice.detail && !/^[-—]$/.test(notice.detail.trim()) && <small>{notice.tone === 'warning' ? '查看意见并修改' : notice.detail}</small>}{formatNoticeTime(noticeTimestamp(notice,flowEvents)) && <em>{formatNoticeTime(noticeTimestamp(notice,flowEvents))}</em>}</span>{(notice.projectId||notice.taskId||notice.eventId) && <ChevronRightIcon size={16} />}</button>{notice.tone === 'warning' && <button className="notice-item-close" aria-label={`关闭${notice.title}`} onClick={() => dismissNotice(notice.id)}><CloseIcon size={14} /></button>}</div>)}</div>
      <Button variant="outline" block onClick={() => setNotices((items) => items.map((item) => ({ ...item, unread: false })))}>全部标记为已读</Button>
    </Drawer>
    <Dialog visible={Boolean(submitTask)} header={submitTarget === 'doctor' ? '提交审核' : '提交业务员审核'} theme="warning" placement="center" width={520} confirmBtn={submitTarget === 'doctor' ? '确认提交审核' : '关闭'} cancelBtn={submitTarget === 'doctor' ? '取消' : null} onClose={() => setSubmitTask(null)} onConfirm={() => { if (!submitTask) return; if (submitTarget === 'doctor') submitReview(submitTask); else setSubmitTask(null) }}>
      {submitTarget === 'doctor' ? <div className="dialog-copy"><p>确认提交任务 {submitTask} 的当前成果？</p><span>提交后将锁定本次正式成果。等待审核期间不能直接覆盖该版本；若审核退回，可基于已提交版本继续修改。</span><div><UserSafetyIcon size={17} />当前未保存修改将一并保存后提交。</div></div> : <div className="dialog-copy"><p>当前无法提交至业务员审核</p><span>该审核方式暂不可用，请稍后重试或联系管理员。</span></div>}
    </Dialog>
    <Dialog visible={Boolean(guardAction)} header="存在未保存修改" theme="warning" placement="center" width={560} footer={<div className="guard-actions"><Button theme="danger" variant="text" onClick={() => continueGuard(false)}>放弃修改</Button><span /><Button variant="outline" onClick={() => setGuardAction(null)}>继续编辑</Button><Button theme="primary" onClick={() => continueGuard(true)}>保存并离开</Button></div>} onClose={() => setGuardAction(null)}>
      <div className="dialog-copy"><p>离开前要保存当前工作吗？</p><span>任务 {currentWorkspaceId} 包含尚未保存的对象或视图调整。</span></div>
    </Dialog>
    <Dialog visible={logoutVisible} header="退出登录" theme="warning" placement="center" width={440} confirmBtn="退出登录" cancelBtn="取消" onClose={() => setLogoutVisible(false)} onConfirm={() => { setLogoutVisible(false); setAuthenticated(false) }}>
      <div className="dialog-copy"><p>确定要退出当前账号吗？</p><span>退出后将返回登录页面，本设备上的任务进度与个人偏好不会被清除。</span></div>
    </Dialog>
    {locked && <LockScreen onUnlock={() => setLocked(false)} />}
  </div>
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  const className = ['brand-logo', compact && 'brand-logo-compact'].filter(Boolean).join(' ')
  return <div className={className} role="img" aria-label="CliniVol"><img className="brand-logo-light" src="/assets/clinivol-logo-light.png" alt="" aria-hidden="true" /><img className="brand-logo-dark" src="/assets/clinivol-logo-dark.png" alt="" aria-hidden="true" /></div>
}

function GlobalHeader({ screen, openTabs, tasks, user, theme, goHome, openWorkspace, closeTab, unreadCount, onThemeToggle, onNotifications, onLock, onOpenSettings, onLogout }: { screen: Screen; openTabs: string[]; tasks: Task[]; user: UserProfile; theme: ResolvedTheme; goHome: () => void; openWorkspace: (id: string) => void; closeTab: (id: string) => void; unreadCount: number; onThemeToggle: () => void; onNotifications: () => void; onLock: () => void; onOpenSettings: (section: SettingsSection) => void; onLogout: () => void }) {
  const accountOptions = [
    { content: <span className="account-menu-label">个人资料</span>, value: 'profile', prefixIcon: <UserCircleIcon size={17} /> },
    { content: <span className="account-menu-label">账户安全</span>, value: 'security', prefixIcon: <UserSafetyIcon size={17} /> },
    { content: <span className="account-menu-label">偏好设置</span>, value: 'preferences', prefixIcon: <SettingIcon size={17} /> },
    { content: <span className="account-menu-label">退出登录</span>, value: 'logout', prefixIcon: <LogoutIcon size={17} /> },
  ]
  return <header className="global-header">
    <BrandLogo />
    <nav className="global-tabs" aria-label="打开的任务"><button className={screen.kind !== 'workspace' && screen.kind !== 'cad-workspace' ? 'global-tab global-tab-active global-home' : 'global-tab global-home'} onClick={goHome}><HomeIcon size={16} /><span>Home</span></button><div className="task-tabs-scroll">{openTabs.map((id) => { const task = tasks.find((item) => item.id === id); const label = task ? `任务${task.id} · ${task.title}` : `任务${id}`; const active = (screen.kind === 'workspace' || screen.kind === 'cad-workspace') && screen.taskId === id; return <div className={active ? 'global-tab global-tab-active' : 'global-tab'} key={id}><Tooltip content={label}><button className="global-tab-main" onClick={() => openWorkspace(id)}>{label}</button></Tooltip><button className="global-tab-close" aria-label={`关闭任务 ${id} 标签`} onClick={() => closeTab(id)}><CloseIcon size={14} /></button></div> })}</div></nav>
    <div className="global-actions"><Tooltip content={theme === 'light' ? '切换至深色模式' : '切换至浅色模式'}><button className="header-icon" aria-label={theme === 'light' ? '切换至深色模式' : '切换至浅色模式'} onClick={onThemeToggle}>{theme === 'light' ? <MoonIcon size={19} /> : <SunnyIcon size={19} />}</button></Tooltip><Tooltip content="通知中心"><button className="header-icon" aria-label={`通知中心，${unreadCount} 条未读`} onClick={onNotifications}><NotificationIcon size={19} />{unreadCount > 0 && <b>{unreadCount}</b>}</button></Tooltip><HeaderHelp onManageAccount={() => onOpenSettings('security')} /><Tooltip content="锁定屏幕"><button className="header-icon" aria-label="锁定屏幕" onClick={onLock}><LockOnIcon size={18} /></button></Tooltip><Dropdown options={accountOptions} trigger="click" placement="bottom-right" minColumnWidth={240} panelTopContent={<div className="account-summary"><img className="avatar avatar-photo" src={user.avatar} alt={`${user.name}头像`} /><div className="account-summary-copy"><strong>{user.name}</strong><small>工号 {user.employeeId}</small><small>{user.role} · {user.department}</small></div></div>} onClick={(item) => { if (item.value === 'logout') onLogout(); else onOpenSettings(item.value as SettingsSection) }}><button className="account-trigger"><img className="avatar avatar-photo" src={user.avatar} alt={`${user.name}头像`} /><span><strong>{user.name}</strong><small>{user.role}</small></span><ChevronDownIcon size={14} /></button></Dropdown></div>
  </header>
}

function PlatformShell({ screen, goPlatform, collapsed, onCollapsedChange, children }: { screen: Screen; goPlatform: (kind: 'home' | 'tasks' | 'reviews') => void; collapsed: boolean; onCollapsedChange: (value: boolean) => void; children: React.ReactNode }) {
  const active = screen.kind === 'detail'||screen.kind==='project' ? 'tasks' : screen.kind === 'settings' ? '' : screen.kind
  const routeKey = screen.kind === 'detail' || screen.kind === 'workspace' || screen.kind === 'cad-workspace' ? `${screen.kind}-${screen.taskId}` : screen.kind==='project'?`project-${screen.projectId}`:screen.kind
  const mainRef = useRef<HTMLElement>(null)
  useEffect(() => { mainRef.current?.scrollTo({ top: 0, left: 0 }) }, [routeKey])
  return <div className={collapsed ? 'platform-shell nav-collapsed' : 'platform-shell'}><aside className="business-nav"><TMenu value={active} collapsed={collapsed} width={[layout.sidebar, layout.sidebarCollapsed]} onChange={(value) => goPlatform(value as 'home' | 'tasks' | 'reviews')}>{navItems.map((item) => { const Icon = item.icon; const menuIcon = <span className="nav-menu-icon"><Icon size={18} /></span>; return <TMenu.MenuItem key={item.key} value={item.key} icon={collapsed ? <Tooltip content={item.label} placement="right">{menuIcon}</Tooltip> : menuIcon} content={item.label} /> })}</TMenu><Tooltip content={collapsed ? '展开导航' : '收起导航'} placement="right"><button className="nav-collapse" aria-label={collapsed ? '展开导航' : '收起导航'} onClick={() => onCollapsedChange(!collapsed)}>{collapsed ? <MenuUnfoldIcon size={18} /> : <MenuFoldIcon size={18} />}</button></Tooltip></aside><main ref={mainRef} className="platform-main">{children}</main></div>
}

function HomeDashboard({ userName, tasks, notices, onNotice, onDismissNotice, onDetail, onOpen, onAll }: { userName: string; tasks: Task[]; notices: Notice[]; onNotice: (notice: Notice) => void; onDismissNotice: (id: number) => void; onDetail: (id: string) => void; onOpen: (id: string) => void; onAll: () => void }) {
  const [noticeFilter, setNoticeFilter] = useState<'全部' | '未读' | '已读'>('全部')
  const todayText = useMemo(() => getDashboardDate(), [])
  const hour = new Date().getHours()
  const greeting = hour >= 5 && hour < 12 ? '上午好' : hour < 18 ? '下午好' : '晚上好'
  const actionableCount = tasks.filter((task) => task.status === '进行中' || task.status === '审核退回').length
  const reviewCount = tasks.filter((task) => task.status === '待审核').length
  const stats = [
    { label: '待处理任务', value: actionableCount, note: '含退回修改', icon: TaskFilledIcon, tone: 'pending' }, { label: '进行中任务', value: tasks.filter((task) => task.status === '进行中').length, note: '当前工作项', icon: WorkFilledIcon, tone: 'progress' },
    { label: '待审核任务', value: reviewCount, note: '成果已锁定', icon: TimeFilledIcon, tone: 'review' }, { label: '审核退回任务', value: tasks.filter((task) => task.status === '审核退回').length, note: '需要修改', icon: AssignmentErrorFilledIcon, tone: 'returned' },
    { label: '已完成任务', value: tasks.filter((task) => task.status === '已完成').length + 12, note: '本月累计', icon: TaskCheckedFilledIcon, tone: 'complete' },
  ]
  const dashboardNotices = notices.filter((notice) => !notice.dismissed && (noticeFilter === '全部' || (noticeFilter === '未读' ? notice.unread : !notice.unread))).slice(0, 3)
  return <div className="page dashboard-page"><section className="dashboard-welcome"><div className="dashboard-welcome-copy"><h1>{greeting}，{userName}</h1><p>今天有 {actionableCount} 项任务需要处理，{reviewCount} 项成果等待医生审核。</p></div><time className="dashboard-date-text" dateTime={new Date().toISOString()}>{todayText}</time></section><section className="stat-grid" aria-label="任务统计">{stats.map(({ label, value, note, icon: Icon, tone }) => <Card key={label} className={`stat-card stat-${tone}`} bordered={false}><div className="stat-card-head"><span>{label}</span><i><Icon size={20} /></i></div><strong>{value}</strong><small>{note}</small></Card>)}</section><section className="dashboard-grid"><Card className="dashboard-card task-card table-card" bordered={false}><div className="section-heading"><h2>我的任务</h2><Button className="view-all-button" variant="text" theme="primary" onClick={onAll}><span>查看全部</span><ChevronRightIcon size={15} /></Button></div><TaskTable tasks={tasks} onDetail={onDetail} onOpen={onOpen} /></Card><div className="dashboard-aside"><Card className="dashboard-card recent-card" bordered={false}><div className="section-heading"><h2>最近任务</h2></div><div className="recent-table" role="table" aria-label="最近任务"><div className="recent-table-head" role="row"><span>任务名称</span><span>任务编号</span><span>最近操作</span><span aria-hidden="true" /></div>{tasks.slice(-3).reverse().map((task) => <button className="recent-item" key={task.id} onClick={() => onDetail(task.id)} role="row"><Tooltip content={task.title}><strong>{task.title}</strong></Tooltip><span>任务 {task.id}</span><Tooltip content={task.updated}><time>{task.updated}</time></Tooltip><ChevronRightIcon size={16} /></button>)}</div></Card><Card className="dashboard-card attention-card" bordered={false}><div className="section-heading notice-heading"><h2>重要通知</h2><div className="notice-filters" aria-label="通知筛选">{(['全部', '未读', '已读'] as const).map((filter) => <Button key={filter} size="small" variant="text" theme={noticeFilter === filter ? 'primary' : 'default'} className={noticeFilter === filter ? 'notice-filter-active' : ''} onClick={() => setNoticeFilter(filter)}>{filter}</Button>)}</div></div><div className="dashboard-notice-table" role="table" aria-label={`${noticeFilter}通知`}><div className="dashboard-notice-head" role="row"><span>通知类型</span><span>内容</span><span>时间</span><span>状态</span><span aria-hidden="true" /></div>{dashboardNotices.length > 0 ? dashboardNotices.map((notice) => { return <div className={notice.unread ? 'dashboard-notice-row dashboard-notice-unread' : 'dashboard-notice-row'} key={notice.id} role="row"><button className="dashboard-notice-main" onClick={() => onNotice(notice)}><span className="notice-kind"><NoticeSymbol notice={notice} /><Tooltip content={notice.title}><strong>{notice.title}</strong></Tooltip></span><Tooltip content={notice.tone === 'warning' ? '查看意见并修改' : notice.detail}><span className="notice-summary">{notice.tone === 'warning' ? '查看意见并修改' : notice.detail}</span></Tooltip><time>{notice.time}</time><em>{notice.unread ? '未读' : '已读'}</em><ChevronRightIcon size={16} /></button>{notice.tone === 'warning' && <Tooltip content="关闭通知"><button className="notice-dismiss" aria-label={`关闭${notice.title}`} onClick={() => onDismissNotice(notice.id)}><CloseIcon size={13} /></button></Tooltip>}</div> }) : <div className="notice-empty">暂无{noticeFilter}通知</div>}</div></Card></div></section></div>
}

function StatusTag({ status }: { status: TaskStatus }) { return <Tag className={status === '进行中' ? 'status-in-progress' : undefined} theme={statusTheme[status]} variant="light" size="small">{status}</Tag> }

function ReturnedReviewAlert({ className = '', onClose }: { className?: string; onClose: () => void }) {
  return <div className={`returned-banner ${className}`.trim()} role="alert"><AssignmentErrorIcon size={17} /><span>医生审核退回，请处理审核意见</span><Tooltip content="关闭提示"><button type="button" className="returned-banner-close" aria-label="关闭审核退回提示" onClick={onClose}><CloseIcon size={15} /></button></Tooltip></div>
}

function TaskTable({ tasks, allTasks = tasks, onDetail, onOpen }: { tasks: Task[]; allTasks?: Task[]; onDetail: (id: string) => void; onOpen: (id: string) => void }) {
  const columns = useMemo<PrimaryTableCol<Task>[]>(() => [
    { colKey: 'relation', title: '', width: 30, cell: ({ row, rowIndex }) => { const next = tasks[rowIndex + 1]; const linked = next?.orderNo === row.orderNo && next.taskType !== row.taskType; return linked ? <span className="task-relation" aria-label="同订单关联任务" /> : null } },
    { colKey: 'type', title: '任务类型', width: 105, cell: ({ row }) => <StageLabel stage={row.taskType}/> },
    { colKey: 'id', title: '任务编号', width: 95, cell: ({ row }) => `任务 ${row.id}` },
    { colKey: 'title', title: '任务名称', ellipsis: true },
    { colKey: 'patient', title: '患者标识', width: 145 },
    { colKey: 'status', title: '状态', width: 95, cell: ({ row }) => <StatusTag status={row.status} /> }, { colKey: 'deadline', title: '预计交付时间', width: 145 }, { colKey: 'updated', title: '最后更新', width: 125 },
    { colKey: 'operation', title: '操作', width: 190, cell: ({ row }) => { const lockedCad = row.taskType === 'CAD 设计' && !isCadTaskUnlocked(row, allTasks); if (lockedCad) return <div className="table-actions"><Tooltip content={CAD_LOCKED_REASON}><span className="disabled-action-wrap"><Button size="small" variant="text" disabled>查看详情</Button></span></Tooltip></div>; return <div className="table-actions"><Button size="small" variant="text" theme="primary" onClick={() => onDetail(row.id)}>查看详情</Button><Button size="small" theme="primary" variant="text" onClick={() => onOpen(row.id)}>{row.taskType === 'CAD 设计' ? '继续设计' : row.status === '审核退回' ? '进入修改' : row.status === '待审核' || row.status === '已完成' ? '查看成果' : '继续设计'}</Button></div> } },
  ], [allTasks, onDetail, onOpen, tasks])
  return <Table className="app-table" rowKey="id" data={tasks} columns={columns} size="small" hover bordered={false} tableLayout="fixed" empty="当前筛选条件下没有任务" />
}

function TaskList({ tasks, title, onDetail, onOpen }: { tasks: Task[]; title: string; onDetail: (id: string) => void; onOpen: (id: string) => void }) {
  const [filter, setFilter] = useState<TaskStatus | '全部'>('全部'); const [typeFilter, setTypeFilter] = useState<TaskType | '全部'>('全部'); const [query, setQuery] = useState('')
  const filtered = tasks.filter((task) => (filter === '全部' || task.status === filter) && (typeFilter === '全部' || task.taskType === typeFilter) && `${task.id}${task.title}${task.patient}${task.orderNo}${task.taskType}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="page"><Card className="dashboard-card list-card table-card unified-list-card" bordered={false}><section className="list-page-heading"><h1>{title}</h1><Input className="task-search" value={query} onChange={(value) => setQuery(String(value))} prefixIcon={<SearchIcon size={16} />} placeholder="搜索任务、患者或订单" clearable /></section><div className="filter-groups"><div className="filter-bar"><span>任务类型</span>{(['全部', '三维重建', 'CAD 设计'] as const).map((item) => <Button key={item} size="small" theme={typeFilter === item ? 'primary' : 'default'} variant={typeFilter === item ? 'base' : 'text'} onClick={() => setTypeFilter(item)}>{item}</Button>)}</div><div className="filter-bar"><span>任务状态</span>{(['全部', '未开始', '进行中', '待审核', '审核退回', '已完成'] as const).map((item) => <Button key={item} size="small" theme={filter === item ? 'primary' : 'default'} variant={filter === item ? 'base' : 'text'} onClick={() => setFilter(item)}>{item}</Button>)}</div></div><TaskTable tasks={filtered} allTasks={tasks} onDetail={onDetail} onOpen={onOpen} /></Card></div>
}

function groupImagingStudies(seriesList: ImagingSeries[]) {
  const studies = new Map<string, { id: string; name: string; date: string; series: ImagingSeries[] }>()
  seriesList.forEach((series) => {
    const study = studies.get(series.studyId)
    if (study) study.series.push(series)
    else studies.set(series.studyId, { id: series.studyId, name: series.studyName, date: series.studyDate, series: [series] })
  })
  return [...studies.values()]
}

function TaskDetail({ task, tasks, events, feedback, comments, onBack, onOpen, onFeedback }: { task: Task; tasks: Task[]; events: FlowEvent[]; feedback: UpstreamFeedback[]; comments: ReviewComment[]; onBack: () => void; onOpen: (id: string, options?: { openComments?: boolean; commentId?: string }) => void; onFeedback: (task: Task, description: string) => boolean }) {
  if (task.taskType==='有限元分析'||task.taskType==='3D 打印') return <ExtendedTaskDetail task={task} tasks={tasks} events={events} onBack={onBack}/>
  if (task.taskType === 'CAD 设计') return <CadTaskDetail task={task} tasks={tasks} upstreamTask={tasks.find((item) => item.id === task.upstreamTaskId)} events={events} feedback={feedback} onBack={onBack} onOpen={onOpen} onFeedback={onFeedback} />
  return <ReconstructionTaskDetail task={task} tasks={tasks} events={events} comments={comments} onBack={onBack} onOpen={onOpen} />
}

function TaskFlow({ task, tasks, events, comments, onOpen }: { task: Task; tasks: Task[]; events: FlowEvent[]; comments?: ReviewComment[]; onOpen?: (id: string, options?: { openComments?: boolean; commentId?: string }) => void }) {
  const orderTasks = tasks.filter((item) => item.orderNo === task.orderNo)
  const orderEvents = [...new Map(events.filter((event) => event.orderNo === task.orderNo).map((event) => [event.id, event])).values()]
  const firstAssignments = new Map<string, string>()
  orderEvents.filter((event) => event.type === 'assigned').sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id)).forEach((event) => {
    if (!firstAssignments.has(event.taskId)) firstAssignments.set(event.taskId, event.id)
  })
  const visible = orderEvents.filter((event) => {
    const eventTask = orderTasks.find((item) => item.id === event.taskId)
    if (!eventTask) return false
    return event.type === 'created' || firstAssignments.get(event.taskId) === event.id || taskStageOrder[eventTask.taskType] <= taskStageOrder[task.taskType]
  }).sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id))
  return <InfoSection title="任务流转记录"><div className="timeline">{visible.map((event) => <div className="timeline-item" key={event.id}><i /><div><strong>{event.name}{orderTasks.length > 1 && <span className="flow-source">{orderTasks.find((item) => item.id === event.taskId)?.taskType ?? '关联任务'}</span>}</strong><p><span className="timeline-meta">{displayEventTime(event.at)} · {event.actor}</span><span className="timeline-note">{engineerText(event.description)}</span>{event.commentCount && onOpen ? <Button variant="text" theme="primary" size="small" onClick={() => onOpen(event.taskId, { openComments: true, commentId: comments?.find((item) => item.taskId === event.taskId)?.id })}>查看{event.commentCount}条意见</Button> : null}</p></div></div>)}</div></InfoSection>
}

function ReconstructionTaskDetail({ task, tasks, events, comments, onBack, onOpen }: { task: Task; tasks: Task[]; events: FlowEvent[]; comments: ReviewComment[]; onBack: () => void; onOpen: (id: string, options?: { openComments?: boolean; commentId?: string }) => void }) {
  const [metadataSeries, setMetadataSeries] = useState<ImagingSeries | null>(null)
  const imagingStudies = groupImagingStudies(task.series)
  const totalSlices = task.series.reduce((total, series) => total + series.slices, 0)
  const primaryAction = task.status === '待审核' || task.status === '已完成' ? '查看已提交成果' : task.status === '审核退回' ? '查看意见并修改' : '继续设计'
  return <div className="page detail-page">
    <Button variant="text" icon={<ChevronLeftIcon size={16} />} onClick={onBack}>返回项目</Button>
    <Card className="detail-title-card" bordered={false}><section className="detail-title"><div className="detail-title-copy"><div className="detail-title-line"><h1>{task.title}</h1></div><p>三维重建 · 任务 {task.id} · {task.patient} · 订单 {task.orderNo}</p></div><div className="detail-actions"><Button theme="primary" onClick={() => onOpen(task.id, { openComments: task.status === '审核退回' })}>{primaryAction}</Button></div></section></Card>
    <section className="detail-grid"><div className="detail-main">
      <InfoSection title="病例与任务信息"><dl className="info-grid"><div><dt>订单编号</dt><dd>{task.orderNo}</dd></div><div><dt>患者标识</dt><dd>{task.patient}</dd></div><div><dt>任务负责人</dt><dd>{cleanOwner(task)}</dd></div><div><dt>任务类型</dt><dd><StageLabel stage={task.taskType}/></dd></div><div><dt>当前任务状态</dt><dd><StatusTag status={task.status} /></dd></div><div><dt>最后更新</dt><dd>{task.updated}</dd></div><div className="info-wide"><dt>手术需求</dt><dd>{task.surgery}</dd></div></dl></InfoSection>
      <InfoSection title="医学影像资料">
        <div className="imaging-studies">{imagingStudies.map((study) => <section className="imaging-study" key={study.id}>
          <header className="imaging-study-header"><FileIcon size={18} /><span className="imaging-study-name"><strong>{study.name}</strong><small>{study.date} · Study {study.id} · {study.series.length} 个 Series</small></span></header>
          <div className="series-list">{study.series.map((series) => <div className="series-data-row" key={series.id}><TImageIcon size={18} /><span className="series-data-name"><strong>{series.name}</strong><small>{series.modality} · {series.format} · {series.slices} 张图像 · 层厚 {series.thickness}</small></span><div className="series-data-actions"><Button theme="primary" variant="text" size="small" icon={<BrowseIcon size={15} />} onClick={() => setMetadataSeries(series)}>查看资料</Button></div></div>)}</div>
        </section>)}</div>
      </InfoSection>
      <TaskFlow task={task} tasks={tasks} events={events} comments={comments} onOpen={onOpen} />
    </div><aside className="detail-aside">
      <Card className="source-guide-card" bordered={false}><h3>数据来源与使用说明</h3><dl className="source-summary"><div><dt>资料来源</dt><dd>{task.source}</dd></div><div><dt>关联资料数量</dt><dd>{imagingStudies.length} 项检查 · {task.series.length} 个序列 · {totalSlices.toLocaleString('zh-CN')} 张图像</dd></div><div><dt>数据就绪状态</dt><dd><Tag theme="success" variant="light" size="small"><CloudIcon size={14} />已就绪</Tag></dd></div></dl><div className="source-guide-instructions"><span>使用说明</span><ul><li>进入专业工作区时自动加载关联影像及已保存进度，无需提前下载导入</li><li>再次进入会恢复最近保存的工作状态和当前序列</li><li>提交审核后成果版本将被锁定</li></ul></div></Card>
    </aside></section>
    <Dialog visible={Boolean(metadataSeries)} header="影像资料信息" width={520} footer={<Button theme="primary" onClick={() => setMetadataSeries(null)}>关闭</Button>} onClose={() => setMetadataSeries(null)}>
      {metadataSeries && <dl className="metadata-grid"><div><dt>序列名称</dt><dd>{metadataSeries.name}</dd></div><div><dt>检查资料包</dt><dd>{metadataSeries.studyName}</dd></div><div><dt>影像类型</dt><dd>{metadataSeries.modality}</dd></div><div><dt>影像格式</dt><dd>{metadataSeries.format}</dd></div><div><dt>切片数量</dt><dd>{metadataSeries.slices} 张</dd></div><div><dt>层厚</dt><dd>{metadataSeries.thickness}</dd></div><div><dt>检查日期</dt><dd>{metadataSeries.studyDate}</dd></div><div><dt>Study 标识</dt><dd>{metadataSeries.studyId}</dd></div><div className="metadata-wide"><dt>任务关联</dt><dd>任务 {task.id} · {task.patient}</dd></div></dl>}
    </Dialog>
  </div>
}

function CadTaskDetail({ task, tasks, upstreamTask, events, feedback, onBack, onOpen, onFeedback }: { task: Task; tasks: Task[]; upstreamTask?: Task; events: FlowEvent[]; feedback: UpstreamFeedback[]; onBack: () => void; onOpen: (id: string, options?: { openComments?: boolean; commentId?: string }) => void; onFeedback: (task: Task, description: string) => boolean }) {
  const [feedbackVisible, setFeedbackVisible] = useState(false)
  const [description, setDescription] = useState('')
  const [feedbackError, setFeedbackError] = useState('')
  const model = task.approvedModel
  const closeFeedback = () => { setFeedbackVisible(false); setDescription(''); setFeedbackError('') }
  const submitFeedback = () => { if (!description.trim()) { setFeedbackError('请填写问题描述'); return } if (onFeedback(task, description)) { closeFeedback(); void MessagePlugin.success('上游问题已记录') } else setFeedbackError('当前关联模型不可用，请返回任务列表检查') }
  return <div className="page detail-page cad-detail-page">
    <Button variant="text" icon={<ChevronLeftIcon size={16} />} onClick={onBack}>返回项目</Button>
    <Card className="detail-title-card" bordered={false}><section className="detail-title"><div className="detail-title-copy"><div className="detail-title-line"><h1>{task.title}</h1></div><p>CAD 设计 · 任务 {task.id} · {task.patient} · 订单 {task.orderNo}</p></div><div className="detail-actions"><Button theme="primary" onClick={() => onOpen(task.id)}>继续设计</Button></div></section></Card>
    <section className="detail-grid"><div className="detail-main">
      <InfoSection title="病例与任务信息"><dl className="info-grid"><div><dt>订单编号</dt><dd>{task.orderNo}</dd></div><div><dt>患者标识</dt><dd>{task.patient}</dd></div><div><dt>任务负责人</dt><dd>{cleanOwner(task)}</dd></div><div><dt>任务类型</dt><dd><StageLabel stage={task.taskType}/></dd></div><div><dt>当前任务状态</dt><dd><StatusTag status={task.status} /></dd></div><div><dt>最后更新</dt><dd>{task.updated}</dd></div><div className="info-wide"><dt>设计需求</dt><dd>{task.cadRequirement}</dd></div></dl></InfoSection>
      <InfoSection title="上游三维重建成果">
        {model && upstreamTask ? <div className="approved-model-card"><dl><div><dt>模型名称</dt><dd>{model.name}</dd></div><div><dt>文件格式</dt><dd>{model.format ?? '未提供'}</dd></div><div><dt>来源任务</dt><dd>任务 {upstreamTask.id} · 三维重建</dd></div><div><dt>审核人</dt><dd>{model.approvedBy}</dd></div><div><dt>审核通过时间</dt><dd>{model.approvedAt}</dd></div></dl><Button variant="outline" onClick={() => setFeedbackVisible(true)}>反馈上游问题</Button></div> : <div className="cad-empty-state"><Box size={28} /><strong>上游成果尚未就绪</strong><span>{CAD_LOCKED_REASON}</span></div>}
      </InfoSection>
      <TaskFlow task={task} tasks={tasks} events={events} onOpen={onOpen} />
    </div><aside className="detail-aside">
      <Card className="source-guide-card" bordered={false}><h3>数据来源与使用说明</h3><dl className="source-summary"><div><dt>资料来源</dt><dd>{task.source}</dd></div><div><dt>关联模型</dt><dd>{model ? model.name : '尚未就绪'}</dd></div><div><dt>数据就绪状态</dt><dd>{model ? <Tag theme="success" variant="light" size="small"><CloudIcon size={14} />已就绪</Tag> : <Tag theme="warning" variant="light" size="small">等待上游</Tag>}</dd></div></dl><div className="source-guide-instructions"><span>使用说明</span><ul><li>进入 CAD 工作区后自动加载医生最终批准的三维模型</li><li>上游原始成果保持锁定，不允许在 CAD 阶段直接修改</li></ul></div></Card>
    </aside></section>
    <Dialog visible={feedbackVisible} header="反馈上游问题" width={560} footer={<div className="feedback-actions"><Button variant="outline" onClick={closeFeedback}>取消</Button><Button theme="primary" onClick={submitFeedback}>提交反馈</Button></div>} onClose={closeFeedback}><dl className="feedback-context"><div><dt>当前 CAD 任务</dt><dd>任务 {task.id} · {task.title}</dd></div><div><dt>来源三维重建任务</dt><dd>任务 {upstreamTask?.id} · {upstreamTask?.title}</dd></div><div><dt>最终批准模型</dt><dd>{model?.name}</dd></div></dl><label className="feedback-label" htmlFor={`feedback-description-${task.id}`}>问题描述 <em>*</em></label><Textarea id={`feedback-description-${task.id}`} value={description} onChange={(value) => { setDescription(String(value)); setFeedbackError('') }} placeholder="请说明模型问题、出现位置及对 CAD 设计的影响" maxlength={1000} autosize={{ minRows: 4, maxRows: 7 }} />{feedbackError && <p className="feedback-error" role="alert">{feedbackError}</p>}{feedback.filter((item) => item.cadTaskId === task.id).length > 0 && <p className="feedback-count">已记录 {feedback.filter((item) => item.cadTaskId === task.id).length} 条上游问题反馈</p>}</Dialog>
  </div>
}
function InfoSection({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) { return <Card className="info-section" bordered={false}><div className="info-section-title"><h2>{title}</h2>{action}</div>{children}</Card> }


function Reviews({ tasks, onDetail }: { tasks: Task[]; onDetail: (id: string) => void }) {
  const records = tasks.flatMap((task) => task.review.map((review, index) => ({ ...review, task, recordId: `${task.id}-${index}-${review.time}` }))).reverse()
  const columns: PrimaryTableCol<(typeof records)[number]>[] = [
    { colKey: 'taskType', title: '任务类型', width: 130, cell: ({ row }) => <StageLabel stage={row.task.taskType}/> },
    { colKey: 'taskId', title: '任务编号', width: 95, cell: ({ row }) => `任务 ${row.task.id}` },
    { colKey: 'taskName', title: '任务名称', width: 220, fixed:'left', ellipsis: true, cell: ({ row }) => row.task.title },
    { colKey: 'status', title: '审核状态', width: 125, cell: ({ row }) => <Tag theme={row.status.includes('退回')?'danger':row.status.includes('通过')?'success':'warning'} variant="light">{row.status}</Tag> },
    { colKey: 'note', title: '审核备注', width: 330, ellipsis: true, cell: ({ row }) => engineerText(row.note) },
    { colKey: 'actor', title: '审核人 / 操作人', width: 150 },
    { colKey: 'time', title: '审核时间', width: 160 },
    { colKey: 'operation', title: '操作', width: 108, fixed:'right', cell: ({ row }) => <Button variant="text" size="small" theme="primary" onClick={() => onDetail(row.task.id)}>查看任务</Button> },
  ]
  return <div className="page"><Card className="dashboard-card review-card table-card unified-list-card" bordered={false}><section className="list-page-heading"><h1>审核记录</h1></section><Table className="app-table" rowKey="recordId" data={records} columns={columns} size="small" hover bordered={false} tableLayout="fixed" /></Card></div>
}

function Workspace({ task, dirty, savedAt, mode, activeSeriesId, comments, reviewFocus, reviewResetEnabled, onReviewFocusConsumed, onUpdateComment, onResetReview, onSeriesChange, onModeChange, onDirty, onSave, onSubmit, onSubmitSalesperson }: { task: Task; dirty: boolean; savedAt?: string; mode: WorkspaceMode; activeSeriesId: string; comments: ReviewComment[]; reviewFocus: { taskId: string; commentId?: string } | null; reviewResetEnabled: boolean; onReviewFocusConsumed: () => void; onUpdateComment: (commentId: string, changes: Partial<Pick<ReviewComment, 'status' | 'replies' | 'unread' | 'submitted'>>) => void; onResetReview: () => void; onSeriesChange: (seriesId: string) => void; onModeChange: (mode: WorkspaceMode) => void; onDirty: () => void; onSave: (announce?: boolean) => boolean; onSubmit: () => void; onSubmitSalesperson: () => void }) {
  const [statisticsOpen,setStatisticsOpen]=useState(false)
  const [hiddenModels,setHiddenModels]=useState<string[]>([])
  const [activeObject, setActiveObject] = useState('mask-bone'); const [tool, setTool] = useState((toolsets[mode].find(definition=>definition.available!==false)?.label ?? '—')); const [toolAction, setToolAction] = useState((toolsets[mode].find(definition=>definition.available!==false)?.label ?? '—'))
  const [toolRevision, setToolRevision] = useState(0)
  const [professionalTab, setProfessionalTab] = useState<ProfessionalTab>('mask')
  const panels = useCadPanels(true, { storageKey: 'clinivol-reconstruction-panel-layout', left: 228, right: 308, labels: ['调整影像序列面板宽度','调整对象属性面板宽度'] })
  const leftOpen = panels.layout.leftOpen; const rightOpen = panels.layout.rightOpen
  const [loadNoticeVisible, setLoadNoticeVisible] = useState(true)
  const [returnAlertVisible, setReturnAlertVisible] = useState(task.status === '审核退回')
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null)
  const [reviewSyncState, setReviewSyncState] = useState<'synced' | 'syncing' | 'failed'>('synced')
  const [engineeringSaveState, setEngineeringSaveState] = useState<'saving' | 'saved' | 'failed'>('saved')
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave
  const [reviewSyncedAt, setReviewSyncedAt] = useState(savedAt ?? '09:02')
  const reviewSyncTimer = useRef<number | null>(null)
  const readOnly = task.status === '待审核' || task.status === '已完成'
  const reviewPending = task.status === '待审核'
  useEffect(() => {
    if (!dirty || readOnly) { setEngineeringSaveState('saved'); return }
    setEngineeringSaveState('saving')
    const timer = window.setTimeout(() => setEngineeringSaveState(onSaveRef.current(false) ? 'saved' : 'failed'), 1000)
    return () => window.clearTimeout(timer)
  }, [dirty, readOnly, task.id])
  useEffect(() => {
    const defaultTool = (toolsets[mode].find(definition=>definition.available!==false)?.label ?? '—')
    setTool(defaultTool)
    setToolAction(defaultTool)
  }, [mode])
  useEffect(() => setLoadNoticeVisible(true), [task.id])
  useEffect(() => setReturnAlertVisible(task.status === '审核退回'), [task.id, task.status])
  useEffect(() => {
    setReviewSyncState('synced')
    setReviewSyncedAt(savedAt ?? '09:02')
    return () => {
      if (reviewSyncTimer.current) window.clearTimeout(reviewSyncTimer.current)
      reviewSyncTimer.current = null
    }
  }, [task.id])
  useEffect(() => {
    const saveShortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') return
      event.preventDefault()
      if (readOnly) void MessagePlugin.warning('当前成果已提交或锁定，暂不可保存')
      else onSave()
    }
    window.addEventListener('keydown', saveShortcut)
    return () => window.removeEventListener('keydown', saveShortcut)
  }, [onSave, readOnly])
  useEffect(() => {
    if (!reviewFocus) return
    const nextCommentId = reviewFocus.commentId ?? comments[0]?.id ?? null
    setCommentsOpen(true)
    setSelectedCommentId(nextCommentId)
    const focused = comments.find((comment) => comment.id === nextCommentId)
    if (focused?.unread) onUpdateComment(focused.id, { unread: false })
    onReviewFocusConsumed()
  }, [comments, onReviewFocusConsumed, onUpdateComment, reviewFocus])
  const chooseTool = (label: string) => {
    const definition=toolsets[mode].find(item=>item.label===label)
    if(definition?.available===false)return
    if(label==='STL属性统计'){if(task.approvedModel?.id===cadAsset.modelId)setStatisticsOpen(true);return}
    if (label === '保存项目') {
      if (readOnly) void MessagePlugin.warning('当前成果已提交或锁定，暂不可保存')
      else onSave()
      return
    }
    const isMutation = mode === 'segment' || ['测量距离', '测量角度', '图像高级预处理'].includes(label)
    if (readOnly && isMutation) {
      void MessagePlugin.warning('当前成果待审核，暂不可修改')
      return
    }
    setToolAction(label)
    const selectedDefinition = toolsets[mode].find((definition) => definition.label === label || definition.options?.includes(label))
    if (selectedDefinition?.persistent) setTool(label)
    setToolRevision((value) => value + 1)
    const implementedViewAction = ['三位四窗', '四角信息显隐', '十字线显隐', '移动图像', '缩放', '窗宽窗位调整'].includes(label)
    const algorithmPrototypeAction = mode === 'segment' || ['图像高级预处理', '顺时针90', '逆时针90', '旋转180'].includes(label)
    if (algorithmPrototypeAction) void MessagePlugin.info(`${label}为交互原型入口，专业处理能力待接入`)
    if (!readOnly && isMutation && !implementedViewAction) onDirty()
  }
  const currentMode = workspaceModes.find((item) => item.key === mode) ?? workspaceModes[0]
  const visibleTools = toolsets[mode]
  const setPanelOpen = panels.toggle
  const changeMode = onModeChange
  const selectedSeries = task.series.find((series) => series.id === activeSeriesId) ?? task.series[0]
  const selectedComment = comments.find((comment) => comment.id === selectedCommentId)
  const unreadReviewCount = comments.filter((comment) => comment.unread).length
  const locateComment = (comment: ReviewComment) => {
    setSelectedCommentId(comment.id)
    onSeriesChange(comment.seriesId)
    if (comment.unread) onUpdateComment(comment.id, { unread: false })
  }
  const openCommentsPanel = (commentId?: string) => {
    const nextComment = comments.find((comment) => comment.id === commentId) ?? selectedComment ?? comments[0]
    if (nextComment) locateComment(nextComment)
    setCommentsOpen(true)
  }
  const toggleCommentsPanel = () => {
    if (commentsOpen) setCommentsOpen(false)
    else openCommentsPanel()
  }
  const queueReviewSync = () => {
    setReviewSyncState('syncing')
    if (reviewSyncTimer.current) window.clearTimeout(reviewSyncTimer.current)
    reviewSyncTimer.current = window.setTimeout(() => {
      try {
        const stamp = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
        setReviewSyncedAt(stamp)
        setReviewSyncState('synced')
      } catch {
        setReviewSyncState('failed')
      }
      reviewSyncTimer.current = null
    }, 650)
  }
  const resetCurrentReview = () => {
    if (reviewSyncTimer.current) window.clearTimeout(reviewSyncTimer.current)
    reviewSyncTimer.current = null
    setReviewSyncState('synced')
    setReviewSyncedAt('09:02')
    setSelectedCommentId(initialReviewComments.find((comment) => comment.taskId === task.id)?.id ?? null)
    onResetReview()
  }
  const requestReviewSubmit = () => {
    if (dirty || engineeringSaveState !== 'saved') { void MessagePlugin.warning(engineeringSaveState === 'failed' ? '工程保存失败，暂不可提交' : '工程正在自动保存，请稍候'); return }
    if (comments.length > 0) {
      const pendingCount = comments.filter((comment) => comment.status === '待修改').length
      const modifiedCount = comments.filter((comment) => comment.status === '已修改 · 待复核').length
      if (reviewSyncState === 'syncing') { void MessagePlugin.warning('云端正在同步，请稍候再提交'); return }
      if (reviewSyncState === 'failed') { void MessagePlugin.error('云端同步失败，恢复同步后才能提交'); return }
      if (pendingCount > 0) { void MessagePlugin.warning(`仍有 ${pendingCount} 条问题未标记已修改`); return }
      if (modifiedCount === 0) { void MessagePlugin.warning('当前没有待提交的修改问题'); return }
    }
    onSubmit()
  }
  const workspaceStyle = { '--series-panel-width': `${panels.leftWidth}px`, '--object-panel-width': `${panels.rightWidth}px` } as React.CSSProperties
  return <main className="workspace-shell">
    <section className="professional-toolbar" aria-label="三维重建专业工具栏">
      <div className="workspace-mode-group" role="group" aria-label="工具类型切换">
        {workspaceModes.map(({ key, label, icon: Icon }) => <button type="button" key={key} className={mode === key ? 'workspace-mode-button workspace-mode-button-active' : 'workspace-mode-button'} aria-pressed={mode === key} onClick={() => changeMode(key)}><Icon size={18} /><span>{label}</span></button>)}
      </div>
      <span className="toolbar-module-divider" aria-hidden="true" />
      <div className="context-tools" aria-label={`${currentMode.label}工具`}>{visibleTools.map((definition) => { const mutationTool = mode === 'segment' || ['测量距离', '测量角度', '图像高级预处理'].includes(definition.label); return <ToolControl key={definition.label} definition={definition} activeTool={tool} disabled={definition.available===false || (definition.label==='STL属性统计'&&task.approvedModel?.id!==cadAsset.modelId) || readOnly && mutationTool} disabledReason={definition.available===false?definition.unavailableReason??'当前操作不可用':definition.label==='STL属性统计'&&task.approvedModel?.id!==cadAsset.modelId?'当前任务没有可读取的 STL 文件':reviewPending?'当前成果待审核，暂不可修改':'当前成果已锁定，暂不可修改'} onChoose={chooseTool} /> })}</div>


      <div className="workspace-task-actions">{comments.length > 0 && <Button className={commentsOpen ? 'review-opinion-trigger review-opinion-trigger-active' : 'review-opinion-trigger'} size="small" variant="text" theme="primary" aria-expanded={commentsOpen} onClick={toggleCommentsPanel}><span className="review-opinion-icon"><ListDemandIcon size={16} />{unreadReviewCount > 0 && <i aria-label={`${unreadReviewCount} 条未读审核意见`} />}</span>审核意见 {comments.length}</Button>}<WorkspaceTaskActions saveState={engineeringSaveState === 'failed' || reviewSyncState === 'failed' ? 'failed' : dirty || engineeringSaveState === 'saving' || reviewSyncState === 'syncing' ? 'saving' : 'saved'} savedAt={savedAt} readOnly={readOnly} disabled={readOnly || dirty || engineeringSaveState !== 'saved' || reviewSyncState !== 'synced'} disabledReason={readOnly ? '当前成果已锁定' : engineeringSaveState === 'failed' || reviewSyncState === 'failed' ? '保存失败，暂不可提交' : ''} onSubmit={requestReviewSubmit} onSubmitSalesperson={onSubmitSalesperson} /></div>
    </section>
    <div className="workspace-banner-slot">{task.status === '审核退回' && returnAlertVisible && <ReturnedReviewAlert onClose={() => setReturnAlertVisible(false)} />}{readOnly && <div className="locked-banner"><LockKeyhole size={17} /><span>{reviewPending ? '当前成果正在审核：影像浏览与视图操作可用，分割、模型及测量修改已锁定。' : '当前成果版本已锁定，仅可查看。'}</span></div>}</div>
    <div ref={panels.bodyRef} className={`workspace-body unified-workspace-body ${panels.resizing ? 'workspace-resizing' : ''} ${!leftOpen ? 'workspace-no-left' : ''} ${!rightOpen ? 'workspace-no-right' : ''}`} style={workspaceStyle}>{!leftOpen && <Tooltip content="展开影像序列" placement="right"><button className="panel-edge-handle panel-edge-handle-left" aria-label="展开影像序列" onClick={() => setPanelOpen('left', true)}><ChevronRight size={15} /></button></Tooltip>}<div className="workspace-left-panel" hidden={!leftOpen}><SeriesPanel task={task} activeSeriesId={selectedSeries?.id ?? ''} onSeriesChange={onSeriesChange} loadNoticeVisible={loadNoticeVisible} onCloseLoadNotice={() => setLoadNoticeVisible(false)} /></div><div className="panel-resizer workspace-resizer-left" hidden={!leftOpen && panels.resizing !== 'left'} {...panels.resizerProps('left')}><span /></div><ViewGrid hiddenModels={hiddenModels} taskId={task.id} series={selectedSeries} tool={toolAction} toolRevision={toolRevision} activeObject={activeObject} comments={comments} selectedComment={selectedComment} onSelectComment={locateComment} onChooseTool={chooseTool} /><div className="panel-resizer workspace-resizer-right" hidden={!rightOpen && panels.resizing !== 'right'} {...panels.resizerProps('right')}><span /></div><div className="workspace-right-panel" hidden={!rightOpen}><ProfessionalPanel onViewVisibility={(id,hidden)=>setHiddenModels(current=>hidden?[...current.filter(item=>item!==id),id]:current.filter(item=>item!==id))} task={task} savedAt={savedAt} activeObject={activeObject} setActiveObject={setActiveObject} tab={professionalTab} onTabChange={setProfessionalTab} readOnly={readOnly} onDirty={onDirty} /></div>{!rightOpen && <Tooltip content="展开对象面板" placement="left"><button className="panel-edge-handle panel-edge-handle-right" aria-label="展开对象面板" onClick={() => setPanelOpen('right', true)}><ChevronLeft size={15} /></button></Tooltip>}{commentsOpen && <ReviewCommentsPanel comments={comments} selectedCommentId={selectedCommentId} readOnly={readOnly} syncState={reviewSyncState} syncedAt={reviewSyncedAt} resetEnabled={reviewResetEnabled} onSelect={locateComment} onClose={() => setCommentsOpen(false)} onUpdate={onUpdateComment} onQueueSync={queueReviewSync} onReset={resetCurrentReview} onSubmit={requestReviewSubmit} />}</div>
    <footer className="workspace-status"><span>当前序列：{selectedSeries ? `${selectedSeries.modality} · ${selectedSeries.name}` : '无'}</span><span>{selectedSeries ? `层厚 ${selectedSeries.thickness} · ${selectedSeries.slices} 张` : '未关联影像'}</span><span>视图联动：开启</span><span /><span>当前工具：{tool}</span></footer><ReconstructionStatistics visible={statisticsOpen} onClose={()=>setStatisticsOpen(false)}/>
  </main>
}

function ToolControl({ definition, activeTool, disabled, disabledReason, onChoose }: { definition: WorkspaceTool; activeTool: string; disabled: boolean; disabledReason: string; onChoose: (label: string) => void }) {
  const Icon = definition.icon; const active = Boolean(definition.persistent && (activeTool === definition.label || definition.options?.includes(activeTool)))
  const control = <button className={active ? 'context-tool context-tool-active' : 'context-tool'} aria-pressed={definition.persistent ? active : undefined} aria-haspopup={definition.options ? 'menu' : undefined} disabled={disabled} onClick={() => !definition.options && onChoose(definition.label)}><span className="context-tool-symbol"><Icon size={18} />{definition.options && <ChevronDownIcon size={11} className="tool-chevron" />}</span><span className="context-tool-label">{definition.label}</span></button>
  if (disabled) return <Tooltip content={disabledReason}><span className="disabled-tool-wrap">{control}</span></Tooltip>
  if (!definition.options) return <Tooltip content={definition.label}>{control}</Tooltip>
  return <Dropdown trigger="click" placement="bottom-left" minColumnWidth={196} options={definition.options.map((option) => ({ content: <span className="toolbar-dropdown-option">{option}</span>, value: option }))} onClick={(item) => onChoose(String(item.value))}>{control}</Dropdown>
}

type SpeechRecognitionResultLike = { isFinal: boolean; 0: { transcript: string } }
type SpeechRecognitionEventLike = { resultIndex: number; results: { length: number; [index: number]: SpeechRecognitionResultLike } }
type BrowserSpeechRecognition = {
  continuous: boolean; interimResults: boolean; lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void; stop: () => void; abort: () => void
}
type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition

function ReviewCommentsPanel({ comments, selectedCommentId, readOnly, syncState, syncedAt, resetEnabled, onSelect, onClose, onUpdate, onQueueSync, onReset, onSubmit }: { comments: ReviewComment[]; selectedCommentId: string | null; readOnly: boolean; syncState: 'synced' | 'syncing' | 'failed'; syncedAt: string; resetEnabled: boolean; onSelect: (comment: ReviewComment) => void; onClose: () => void; onUpdate: (commentId: string, changes: Partial<Pick<ReviewComment, 'status' | 'replies' | 'unread' | 'submitted'>>) => void; onQueueSync: () => void; onReset: () => void; onSubmit: () => void }) {
  const [reply, setReply] = useState('')
  const [expanded, setExpanded] = useState(true)
  const [expandedTitleId, setExpandedTitleId] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const [resetVisible, setResetVisible] = useState(false)
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const user = useMemo(getStoredUserProfile, [])
  const selected = comments.find((comment) => comment.id === selectedCommentId) ?? comments[0]
  const selectedIndex = Math.max(0, comments.findIndex((comment) => comment.id === selected?.id))
  const selectedKey = String.fromCharCode(65 + selectedIndex)
  const pendingCount = comments.filter((comment) => comment.status === '待修改').length
  const modifiedCount = comments.filter((comment) => comment.status === '已修改 · 待复核').length
  const visibleComments = expanded ? comments : selected ? [selected] : []
  const statusThemeFor = (status: ReviewCommentStatus) => status === '审核通过' ? 'success' : status === '已修改 · 待复核' ? 'warning' : 'danger'
  const locationFor = (comment: ReviewComment) => comment.camera ?? `${comment.view}${comment.slice ? ` · 第 ${comment.slice} 层` : ''}`
  useEffect(() => setReply(''), [selectedCommentId])
  useEffect(() => () => recognitionRef.current?.abort(), [])
  const toggleIssueTitle = (commentId: string) => {
    setExpandedTitleId((current) => current === commentId ? null : commentId)
  }
  const submitReply = () => {
    const content = reply.trim()
    if (!selected || !content || readOnly) return
    const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
    onUpdate(selected.id, { replies: [...selected.replies, { id: `${selected.id}-${Date.now()}`, author: user.name, role: 'designer', time: `今天 ${now}`, content }] })
    setReply('')
    onQueueSync()
    void MessagePlugin.success('回复已添加到当前问题讨论')
  }
  const toggleSpeech = () => {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const speechWindow = window as typeof window & { SpeechRecognition?: BrowserSpeechRecognitionConstructor; webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor }
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
    if (!Recognition) { void MessagePlugin.warning('当前浏览器不支持语音识别，请使用文字输入'); return }
    const recognition = new Recognition()
    const original = reply.trimEnd()
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.onresult = (event) => {
      let transcript = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) transcript += event.results[index][0].transcript
      setReply(`${original}${original && transcript ? ' ' : ''}${transcript}`.slice(0, 240))
    }
    recognition.onerror = (event) => {
      setListening(false)
      void MessagePlugin.error(event.error === 'not-allowed' || event.error === 'service-not-allowed' ? '未获得麦克风权限，请检查浏览器设置' : '语音识别失败，请稍后重试')
    }
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
    } catch {
      setListening(false)
      void MessagePlugin.error('无法启动语音识别，请稍后重试')
    }
  }
  const markModified = () => {
    if (!selected || readOnly || selected.status !== '待修改') return
    onUpdate(selected.id, { status: '已修改 · 待复核', submitted: false })
    onQueueSync()
    void MessagePlugin.success(`问题 ${selectedKey} 已标记为已修改，尚未通知医生`)
  }
  return <aside className="review-comments-panel" aria-label="审核意见">
    <header className="review-panel-header"><div><strong>审核意见</strong><Tag size="small" variant="outline">{comments.length} 条</Tag></div><span>{resetEnabled && <Button className="review-reset-button" variant="text" size="small" icon={<RefreshIcon size={15} />} onClick={() => setResetVisible(true)}>重置示例数据</Button>}<Tooltip content={expanded ? '收起问题列表' : '展开全部问题'}><button type="button" aria-label={expanded ? '收起问题列表' : '展开全部问题'} aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button></Tooltip><Tooltip content="关闭审核意见"><button type="button" aria-label="关闭审核意见" onClick={onClose}><CloseIcon size={16} /></button></Tooltip></span></header>
    {comments.length === 0 ? <div className="review-comments-empty">当前任务暂无空间定位意见</div> : <>
      <div className={expanded ? 'review-issue-list review-issue-list-expanded' : 'review-issue-list review-issue-list-collapsed'}>{visibleComments.map((comment) => { const index = comments.findIndex((item) => item.id === comment.id); const issueKey = String.fromCharCode(65 + index); const titleExpanded = expanded && expandedTitleId === comment.id; return <div key={comment.id} className={comment.id === selected?.id ? 'review-issue-item review-issue-active' : 'review-issue-item'}><button type="button" className="review-issue-select" aria-pressed={comment.id === selected?.id} onClick={() => onSelect(comment)}><i>{issueKey}</i><span className="review-issue-copy"><strong className={titleExpanded ? 'review-issue-title-expanded' : ''} title={titleExpanded ? undefined : comment.title}>{comment.title}</strong><small>{locationFor(comment)}</small></span><Tag className="review-issue-status" size="small" variant="light" theme={statusThemeFor(comment.status)}>{comment.status}</Tag></button>{expanded && <Tooltip content={titleExpanded ? '收起问题标题' : '展开完整标题'}><button type="button" className="review-issue-title-toggle" aria-label={titleExpanded ? `收起问题 ${issueKey} 标题` : `展开问题 ${issueKey} 完整标题`} aria-expanded={titleExpanded} onClick={(event) => { event.stopPropagation(); toggleIssueTitle(comment.id) }}>{titleExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button></Tooltip>}</div> })}</div>
      {selected && <section className="review-thread"><header><strong>问题 {selectedKey} · 讨论</strong><span>{selected.replies.length + 1} 条消息</span></header><div className="review-thread-messages" aria-live="polite"><article className="review-thread-message review-thread-doctor"><span className="review-thread-avatar">{selected.author.slice(0, 1)}</span><div><header><strong>{selected.author}</strong><Tag size="small" variant="light">医生</Tag><time>{selected.time}</time></header><p>{selected.content}</p></div></article>{selected.replies.map((item) => <article className={`review-thread-message review-thread-${item.role}`} key={item.id}>{item.role === 'designer' ? <img className="review-thread-avatar" src={user.avatar} alt="" /> : <span className="review-thread-avatar">{item.author.slice(0, 1)}</span>}<div><header><strong>{item.author}</strong><Tag size="small" variant="light">{item.role === 'doctor' ? '医生' : '设计师'}</Tag><time>{item.time}</time></header><p>{item.content}</p></div></article>)}</div><div className="review-composer"><Textarea className="review-composer-input" value={reply} onChange={(value) => setReply(String(value))} placeholder={readOnly ? '当前成果为只读状态' : '回复医生，说明修改位置或处理方式…'} maxlength={240} count={false} autosize={{ minRows: 2, maxRows: 4 }} disabled={readOnly} /><div className="review-composer-actions"><span>{reply.length}/240</span><Tooltip content={listening ? '停止语音识别' : '语音输入'}><button type="button" className={listening ? 'review-voice-button review-voice-active' : 'review-voice-button'} aria-label={listening ? '停止语音识别' : '开始语音输入'} aria-pressed={listening} disabled={readOnly} onClick={toggleSpeech}><Microphone1Icon size={18} /></button></Tooltip><Tooltip content="发送回复"><Button shape="circle" theme="primary" aria-label="发送回复" icon={<TSendIcon size={17} />} disabled={readOnly || !reply.trim()} onClick={submitReply} /></Tooltip></div>{listening && <span className="review-listening-state" role="status">正在识别中文，点击麦克风可停止</span>}</div></section>}
      <footer className="review-action-dock"><div className={`review-sync-status review-sync-${syncState}`}><span><CloudIcon size={16} />{syncState === 'syncing' ? '云端同步中…' : syncState === 'failed' ? '云端同步失败' : `云端已同步 · ${syncedAt}`}</span><strong>待提交 {modifiedCount}/{comments.length}</strong></div><Button block size="large" variant="outline" disabled={readOnly || !selected || selected.status !== '待修改' || syncState === 'syncing'} onClick={markModified}>{selected?.status === '审核通过' ? '当前问题已通过' : selected?.status === '已修改 · 待复核' ? '当前问题已标记修改' : '标记当前问题已修改'}</Button><Button block size="large" theme="primary" loading={syncState === 'syncing'} disabled={readOnly || syncState !== 'synced' || pendingCount > 0 || modifiedCount === 0} onClick={onSubmit}>{readOnly ? '已提交 · 等待医生复核' : '提交审核'}</Button></footer>
    </>}
    <Dialog visible={resetVisible} header="重置示例数据" theme="warning" placement="center" width={460} confirmBtn="确认重置" cancelBtn="取消" onClose={() => setResetVisible(false)} onConfirm={() => { setResetVisible(false); setExpanded(false); setExpandedTitleId(null); setReply(''); onReset() }}><div className="dialog-copy"><p>确定重置当前任务的审核示例数据吗？</p><span>问题状态、评论回复、已读与提交状态将恢复为医生首次提出 3 条问题时的初始状态。其他任务和个人设置不会受到影响。</span></div></Dialog>
  </aside>
}


function SeriesPanel({ task, activeSeriesId, onSeriesChange, loadNoticeVisible, onCloseLoadNotice }: { task: Task; activeSeriesId: string; onSeriesChange: (seriesId: string) => void; loadNoticeVisible: boolean; onCloseLoadNotice: () => void }) {
  const [open, setOpen] = useState({ patient: true, study: true, series: true })
  const [patientInfoOpen, setPatientInfoOpen] = useState(false)
  const primaryStudy = task.series[0]
  const studies = Array.from(new Map(task.series.map((series) => [series.studyId, series])).values())
  const totalImages = task.series.reduce((total, series) => total + series.slices, 0)
  useEffect(() => setPatientInfoOpen(false), [task.id])
  const patientInfo = <div className="patient-info-popover" role="group" aria-label="患者信息"><h3>患者信息</h3><dl><div><dt>患者标识</dt><dd>{task.patient}</dd></div><div><dt>关联订单</dt><dd>{task.orderNo}</dd></div><div><dt>检查资料</dt><dd>{studies.map((study) => study.studyName).join('、') || '未关联'}</dd></div><div><dt>检查日期</dt><dd>{studies.map((study) => study.studyDate).filter(Boolean).join('、') || '未提供'}</dd></div><div><dt>关联数据</dt><dd>{studies.length} 项检查 · {task.series.length} 组序列 · {totalImages} 张图像</dd></div></dl></div>
  const patientAction = <Popup visible={patientInfoOpen} content={patientInfo} trigger="hover" delay={[80, 160]} placement="right-top" showArrow overlayInnerClassName="patient-info-popover-surface" onVisibleChange={(visible) => setPatientInfoOpen(visible)}><button type="button" className="patient-info-trigger" aria-label="查看患者信息" aria-haspopup="dialog" aria-expanded={patientInfoOpen} onFocus={() => setPatientInfoOpen(true)} onBlur={() => setPatientInfoOpen(false)} onClick={(event) => event.stopPropagation()}><Info size={14} /></button></Popup>
  return <aside className="series-panel"><div className="professional-panel-head"><span>影像序列</span><div><button aria-label="查看关联影像加载状态" onClick={() => task.series.length ? void MessagePlugin.success(`已加载任务 ${task.id} 的 ${task.series.length} 组关联序列`) : void MessagePlugin.error('关联影像暂不可用，请稍后重试')}><FolderOpen size={16} /></button><button aria-label="搜索序列" onClick={() => void MessagePlugin.info('序列搜索已就绪')}><Search size={16} /></button></div></div>{loadNoticeVisible && (task.series.length ? <div className="series-load-state" role="status"><CloudIcon size={14} /><span>任务数据已自动加载</span><button type="button" className="series-load-close" aria-label="关闭数据加载提示" onClick={onCloseLoadNotice}><CloseIcon size={13} /></button></div> : <div className="series-load-error" role="alert"><AssignmentErrorIcon size={14} /><span>关联影像暂不可用</span><Button size="small" variant="text" theme="danger" onClick={() => void MessagePlugin.info('正在重新请求关联影像，请稍后重试')}>重试</Button></div>)}<div className="series-tree"><TreeRow level={0} open={open.patient} icon={<CircleUserRound size={15} />} label={`Patient · ${task.patient}`} endAction={patientAction} onClick={() => setOpen((value) => ({ ...value, patient: !value.patient }))} />{open.patient && <><TreeRow level={1} open={open.study} icon={<Database size={15} />} label={`Study · ${primaryStudy?.studyId ?? '未关联'}`} onClick={() => setOpen((value) => ({ ...value, study: !value.study }))} />{open.study && <><TreeRow level={2} open={open.series} icon={<ImageIcon size={15} />} label={`Series · ${task.series.length} 组`} onClick={() => setOpen((value) => ({ ...value, series: !value.series }))} />{open.series && <div className="series-options">{task.series.map((series, index) => <button key={series.id} aria-pressed={activeSeriesId === series.id} className={activeSeriesId === series.id ? 'series-selected' : ''} onClick={() => onSeriesChange(series.id)}><span>{index + 1}</span><strong>{series.modality} · {series.name}</strong><small>{series.slices}</small></button>)}</div>}</>}</>}</div></aside>
}
function TreeRow({ level, open, icon, label, endAction, onClick }: { level: number; open: boolean; icon: React.ReactNode; label: string; endAction?: React.ReactNode; onClick: () => void }) { return <div className="tree-row" style={{ paddingLeft: 12 + level * 15 }}><button type="button" className="tree-row-main" aria-expanded={open} onClick={onClick}>{open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}{icon}<span>{label}</span></button>{endAction}</div> }

function ProfessionalPanel({ task, savedAt, activeObject, setActiveObject, tab, onTabChange, readOnly, onDirty, onViewVisibility }: { task: Task; savedAt?: string; activeObject: string; setActiveObject: (value: string) => void; tab: ProfessionalTab; onTabChange: (value: ProfessionalTab) => void; readOnly: boolean; onDirty: () => void; onViewVisibility:(id:string,hidden:boolean)=>void }) {
  const [objects, setObjects] = useState(initialProfessionalObjects)
  const [expanded, setExpanded] = useState<string[]>(['mask-bone'])
  const [hidden, setHidden] = useState<string[]>([])
  const [locked, setLocked] = useState<string[]>(['mask-bone'])
  const [deleteTarget, setDeleteTarget] = useState<ProfessionalObject | null>(null)
  const [opacity, setOpacity] = useState<Record<string, number>>({ 'model-skull': 80, 'model-teeth': 80 })
  const selectedObject = objects.find((item) => item.id === activeObject) ?? objects[0]
  const selectObject = (object: ProfessionalObject) => { setActiveObject(object.id); if (object.tab !== tab) onTabChange(object.tab) }
  const selectTab = (nextTab: ProfessionalTab) => {
    onTabChange(nextTab)
    if (nextTab !== 'property') {
      const firstObject = objects.find((object) => object.tab === nextTab)
      if (firstObject) setActiveObject(firstObject.id)
    }
  }
  const confirmDelete = () => {
    if (!deleteTarget) return
    const remaining = objects.filter((object) => object.id !== deleteTarget.id)
    setObjects(remaining)
    if (activeObject === deleteTarget.id) setActiveObject(remaining.find((object) => object.tab === deleteTarget.tab)?.id ?? remaining[0]?.id ?? '')
    setDeleteTarget(null); onDirty(); void MessagePlugin.success(`${deleteTarget.name} 已从当前工程移除`)
  }
  return <aside className="professional-panel"><div className="professional-tabs" role="tablist" aria-label="专业对象面板">{([['mask', '蒙版'], ['model', '对象'], ['measure', '测量'], ['property', '属性']] as const).map(([key, label]) => <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'professional-tab-active' : ''} onClick={() => selectTab(key)}>{label}</button>)}</div><div className="professional-content">{tab !== 'property' && <ObjectTabContent tab={tab} objects={objects.filter((object) => object.tab === tab)} activeObject={activeObject} expanded={expanded} hidden={hidden} locked={locked} opacity={opacity} readOnly={readOnly} onSelect={selectObject} onExpand={(id) => setExpanded((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])} onVisibility={(id) => { setHidden((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]); onViewVisibility(id,!hidden.includes(id)); if(!readOnly)onDirty() }} onLock={(id) => { setLocked((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]); onDirty() }} onOpacity={(id, value) => { setOpacity((items) => ({ ...items, [id]: value })); onDirty() }} onDelete={setDeleteTarget} />}{tab === 'property' && selectedObject && <PropertiesContent task={task} savedAt={savedAt} activeObject={selectedObject} hidden={hidden.includes(selectedObject.id)} readOnly={readOnly} onVisibility={(id) => { setHidden((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]); onViewVisibility(id,!hidden.includes(id)); if(!readOnly)onDirty() }} />}</div><Dialog visible={Boolean(deleteTarget)} header="删除专业对象" theme="danger" confirmBtn="确认删除" cancelBtn="取消" onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete}><div className="dialog-copy"><p>确认删除“{deleteTarget?.name}”吗？</p><span>该操作只影响当前工程中的对象，不会删除原始医学影像资料。</span></div></Dialog></aside>
}

function ObjectTabContent({ tab, objects, activeObject, expanded, hidden, locked, opacity, readOnly, onSelect, onExpand, onVisibility, onLock, onOpacity, onDelete }: { tab: Exclude<ProfessionalTab, 'property'>; objects: ProfessionalObject[]; activeObject: string; expanded: string[]; hidden: string[]; locked: string[]; opacity: Record<string, number>; readOnly: boolean; onSelect: (object: ProfessionalObject) => void; onExpand: (id: string) => void; onVisibility: (id: string) => void; onLock: (id: string) => void; onOpacity: (id: string, value: number) => void; onDelete: (object: ProfessionalObject) => void }) {
  const [contextMenu, setContextMenu] = useState<{ object: ProfessionalObject; x: number; y: number } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const title = tab === 'mask' ? '蒙版列表' : tab === 'model' ? '对象列表' : '测量结果'
  const disabledTip = '当前成果待审核，暂不可修改'
  useEffect(() => {
    if (!contextMenu) return
    const closeOnPointerDown = (event: PointerEvent) => { if (!contextMenuRef.current?.contains(event.target as Node)) setContextMenu(null) }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setContextMenu(null) }
    document.addEventListener('pointerdown', closeOnPointerDown)
    window.addEventListener('keydown', closeOnEscape)
    return () => { document.removeEventListener('pointerdown', closeOnPointerDown); window.removeEventListener('keydown', closeOnEscape) }
  }, [contextMenu])
  const contextActions = tab === 'mask'
    ? ['重命名', '更改颜色', '删除', '蒙版透明度', '计算零件']
    : tab === 'model'
      ? ['重命名', '更改颜色', '模型透明度', '移动', '旋转', '编辑轮廓', '光滑操作', '减面操作', '包裹操作', '镜像操作', '3D布尔操作', '重新缩放', '导出STL', '批量导出STL', '删除模型']
      : ['重命名', '更改颜色', '删除', '导出测量结果']
  const openContextMenu = (event: React.MouseEvent, object: ProfessionalObject) => {
    event.preventDefault(); event.stopPropagation(); onSelect(object)
    const menuWidth = 196; const menuHeight = Math.min(contextActions.length * 34 + 12, window.innerHeight - 16)
    setContextMenu({ object, x: Math.max(8, Math.min(event.clientX, window.innerWidth - menuWidth - 8)), y: Math.max(8, Math.min(event.clientY, window.innerHeight - menuHeight - 8)) })
  }
  const runContextAction = (action: string) => {
    if (!contextMenu) return
    if (action === '删除' || action === '删除模型') onDelete(contextMenu.object)
    else void MessagePlugin.info(`${action}为交互原型入口，专业处理能力待接入`)
    setContextMenu(null)
  }
  return <div className="object-list"><div className="object-list-title"><span><strong>{title}</strong><small>{objects.length}</small></span><Tooltip content={readOnly ? disabledTip : `添加${title}`}><span><button aria-label={`添加${title}`} disabled={readOnly} onClick={() => void MessagePlugin.info(`请先在中央视图中创建${tab === 'measure' ? '测量' : '对象'}`)}><Plus size={16} /></button></span></Tooltip></div>{objects.length === 0 ? <div className="panel-empty"><Info size={22} /><strong>暂无{title}</strong><span>当前工程中没有可显示的对象。</span></div> : objects.map((object) => { const isExpanded = expanded.includes(object.id); const isHidden = hidden.includes(object.id); const isLocked = locked.includes(object.id); return <div key={object.id} className={activeObject === object.id ? 'object-row object-row-active' : 'object-row'} onContextMenu={(event) => openContextMenu(event, object)}><button className="object-main" onClick={() => onSelect(object)}><i className="object-color" style={{ background: object.color }} /><span><strong>{object.name}</strong><small>{object.meta}</small></span>{object.value && <b>{object.value}</b>}</button><div className="object-actions"><Tooltip content={readOnly&&tab!=='model' ? disabledTip : isHidden ? '显示对象' : '隐藏对象'}><span><button className={isHidden ? 'object-state-action object-state-persistent' : 'object-state-action'} aria-label={isHidden ? `显示${object.name}` : `隐藏${object.name}`} disabled={readOnly&&tab!=='model'} onClick={() => onVisibility(object.id)}><ObjectStateIcon kind="visibility" active={!isHidden} /></button></span></Tooltip>{tab === 'mask' && <Tooltip content={readOnly ? disabledTip : isLocked ? '解锁对象' : '锁定对象'}><span><button className={isLocked ? 'object-state-action object-state-persistent' : 'object-state-action'} aria-label={isLocked ? `解锁${object.name}` : `锁定${object.name}`} disabled={readOnly} onClick={() => onLock(object.id)}><ObjectStateIcon kind="lock" active={isLocked} /></button></span></Tooltip>}{tab === 'model' && <Tooltip content="查看模型设置"><button aria-label={`${object.name}设置`} onClick={() => { onSelect(object); onExpand(object.id) }}><Settings2 size={15} /></button></Tooltip>}<Tooltip content={readOnly ? disabledTip : '删除对象'}><span><button className="danger-icon" aria-label={`删除${object.name}`} disabled={readOnly} onClick={() => onDelete(object)}><Trash2 size={15} /></button></span></Tooltip><button aria-label={isExpanded ? `收起${object.name}详情` : `展开${object.name}详情`} aria-expanded={isExpanded} onClick={() => onExpand(object.id)}>{isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button></div>{isExpanded && <div className="object-details"><dl>{object.details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{label === '透明度' && tab === 'model' ? `${opacity[object.id] ?? 80}%` : value}</dd></div>)}</dl>{tab === 'model' && <Tooltip content={readOnly ? disabledTip : '调整模型透明度'}><label className="opacity-control"><span>透明度</span><input aria-label={`${object.name}透明度`} type="range" min="0" max="100" value={opacity[object.id] ?? 80} disabled={readOnly} onChange={(event) => onOpacity(object.id, Number(event.target.value))} /></label></Tooltip>}</div>}</div> })}{contextMenu && <div ref={contextMenuRef} className="object-context-menu" role="menu" aria-label={`${contextMenu.object.name}操作菜单`} style={{ left: contextMenu.x, top: contextMenu.y }} onContextMenu={(event) => event.preventDefault()}>{contextActions.map((action) => { const disabled = readOnly && !action.startsWith('导出'); return <button key={action} type="button" role="menuitem" disabled={disabled} onClick={() => runContextAction(action)}>{action}</button> })}</div>}</div>
}

function PropertiesContent({ task, savedAt, activeObject, hidden, readOnly, onVisibility }: { task: Task; savedAt?: string; activeObject: ProfessionalObject; hidden: boolean; readOnly: boolean; onVisibility: (id: string) => void }) { const history = [['创建下颌骨蒙版', '14:32', '陈屿'], ['调整窗宽窗位', '14:20', '陈屿'], ['生成三维模型', '13:56', '陈屿'], ['导入 CT 数据', '11:03', '系统']]; return <div className="properties-content"><div className="selected-object"><i style={{ background: activeObject.color }} /><span><strong>{activeObject.name}</strong><small>{activeObject.tab === 'mask' ? '蒙版对象' : activeObject.tab === 'model' ? '三维模型' : '测量对象'} · {hidden ? '已隐藏' : '可见'}</small></span></div><section className="property-section"><h3><Info size={14} />当前对象属性</h3><dl><div><dt>对象类型</dt><dd>{activeObject.tab === 'mask' ? '蒙版' : activeObject.tab === 'model' ? '模型' : '测量'}</dd></div>{activeObject.details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><label><span>当前显示</span><input key={activeObject.id} type="checkbox" checked={!hidden} disabled={readOnly&&activeObject.tab!=='model'} onChange={() => onVisibility(activeObject.id)} /></label></section><section className="property-section"><h3><Info size={14} />任务信息</h3><dl><div><dt>任务</dt><dd>三维重建 · {task.id}</dd></div><div><dt>患者标识</dt><dd>{task.patient}</dd></div><div><dt>订单编号</dt><dd>{task.orderNo}</dd></div><div><dt>任务状态</dt><dd>{task.status}</dd></div><div><dt>最后保存</dt><dd>{savedAt ? `今天 ${savedAt}` : task.updated}</dd></div></dl></section><section className="property-section activity-section"><h3><Activity size={14} />操作记录</h3>{history.map(([action, time, actor]) => <div className="history-item" key={`${action}-${time}`}><strong>{action}</strong><small>{time} · {actor}</small></div>)}</section></div> }

function ViewGrid({ hiddenModels, taskId, series, tool, toolRevision, activeObject, comments, selectedComment, onSelectComment, onChooseTool }: { hiddenModels: string[]; taskId: string; series?: ImagingSeries; tool: string; toolRevision: number; activeObject: string; comments: ReviewComment[]; selectedComment?: ReviewComment; onSelectComment: (comment: ReviewComment) => void; onChooseTool: (label: string) => void }) {
  const [focusedView, setFocusedView] = useState<number | null>(null)
  const [locatedView, setLocatedView] = useState<number | null>(null)
  const [showCrosshair, setShowCrosshair] = useState(true)
  const [showDirections, setShowDirections] = useState(true)
  const [active3DTool, setActive3DTool] = useState('选择视角')
  const [volumeRendering, setVolumeRendering] = useState(false)
  const [showGyroscope, setShowGyroscope] = useState(true)
  const [dark3DBackground, setDark3DBackground] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ viewIndex: number; x: number; y: number } | null>(null)
  const viewAreaRef = useRef<HTMLElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const rightDragRef = useRef<{ startX: number; startY: number; moved: boolean; ctrl: boolean } | null>(null)
  const suppressContextMenuRef = useRef(false)
  useEffect(() => {
    if (tool === '三位四窗' || tool === '重置视角') setFocusedView(null)
    if (tool === '重置视角') { setShowCrosshair(true); setShowDirections(true) }
    if (tool === '四角信息显隐') setShowDirections((value) => !value)
    if (tool === '十字线显隐') setShowCrosshair((value) => !value)
  }, [tool, toolRevision])
  useEffect(() => {
    if (!selectedComment) { setLocatedView(null); return }
    const viewIndex = ['Axial', 'Coronal', 'Sagittal', '3D View'].indexOf(selectedComment.view)
    setLocatedView(viewIndex >= 0 ? viewIndex : null)
  }, [selectedComment])
  useEffect(() => {
    if (!contextMenu) return
    const closeOnPointerDown = (event: PointerEvent) => {
      if (!contextMenuRef.current?.contains(event.target as Node)) setContextMenu(null)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setContextMenu(null)
    }
    document.addEventListener('pointerdown', closeOnPointerDown)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnPointerDown)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [contextMenu])
  const sliceCount = series?.slices ?? 0
  const thickness = series?.thickness ?? '—'
  const locatedSlice = selectedComment?.slice
  const views = [{ name: 'Axial', cn: '轴位', info: [`S: ${selectedComment?.view === 'Axial' && locatedSlice ? locatedSlice : Math.min(126, sliceCount)} / ${sliceCount}`, 'WL: 300  WW: 1500', `T: ${thickness}`], dirs: ['A', 'R', 'L', 'P'] }, { name: 'Coronal', cn: '冠状位', info: [`S: ${selectedComment?.view === 'Coronal' && locatedSlice ? locatedSlice : Math.min(386, sliceCount)} / ${sliceCount}`, 'WL: 300  WW: 1500', `T: ${thickness}`], dirs: ['S', 'R', 'L', 'I'] }, { name: 'Sagittal', cn: '矢状位', info: [`S: ${selectedComment?.view === 'Sagittal' && locatedSlice ? locatedSlice : Math.min(318, sliceCount)} / ${sliceCount}`, 'WL: 300  WW: 1500', `T: ${thickness}`], dirs: ['S', 'A', 'P', 'I'] }, { name: '3D View', cn: '三维视图', info: [selectedComment?.view === '3D View' && selectedComment.camera ? selectedComment.camera : '表面预览', 'R / A / S'], dirs: ['', '', '', ''] }]
  const toggleFocusedView = (viewIndex: number) => setFocusedView((value) => value === viewIndex ? null : viewIndex)
  const openContextMenu = (event: React.MouseEvent, viewIndex: number) => {
    event.preventDefault()
    event.stopPropagation()
    if (suppressContextMenuRef.current) { suppressContextMenuRef.current = false; return }
    const bounds = viewAreaRef.current?.getBoundingClientRect()
    if (!bounds) return
    const menuWidth = 176
    const itemCount = viewIndex === 3 ? 4 : 5
    const menuHeight = itemCount * 34 + 18
    setContextMenu({
      viewIndex,
      x: Math.max(8, Math.min(event.clientX - bounds.left, bounds.width - menuWidth - 8)),
      y: Math.max(8, Math.min(event.clientY - bounds.top, bounds.height - menuHeight - 8)),
    })
  }
  const runContextAction = (action: string) => {
    if (!contextMenu) return
    onChooseTool(action)
    setContextMenu(null)
  }
  const contextActions = contextMenu ? [
    ...(contextMenu.viewIndex < 3 ? [{ label: '窗宽窗位调整', icon: SlidersHorizontal }] : []),
    { label: '缩放', icon: ZoomIn },
    { label: '移动图像', icon: Move },
    { label: '旋转', icon: Rotate3D },
    { label: '重置视角', icon: RotateCcw },
  ] : []
  const beginRightDrag = (event: React.PointerEvent) => {
    if (event.button !== 2) return
    rightDragRef.current = { startX: event.clientX, startY: event.clientY, moved: false, ctrl: event.ctrlKey || event.metaKey }
  }
  const updateRightDrag = (event: React.PointerEvent) => {
    const gesture = rightDragRef.current
    if (!gesture || (event.buttons & 2) === 0) return
    if (Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) <= 5 || gesture.moved) return
    gesture.moved = true
    onChooseTool(gesture.ctrl ? '缩放' : '窗宽窗位调整')
  }
  const endRightDrag = (event: React.PointerEvent) => {
    if (event.button !== 2 || !rightDragRef.current) return
    suppressContextMenuRef.current = rightDragRef.current.moved
    rightDragRef.current = null
  }
  const quick3DTools = [
    { label: '选择视角', icon: MousePointer2 }, { label: '重置视角', icon: RotateCcw },
    { label: '体渲染开关', icon: Contrast }, { label: '导入STL', icon: Upload },
    { label: '导出STL', icon: Download }, { label: '截图', icon: Camera },
    { label: '陀螺仪显隐', icon: Compass }, { label: '背景黑白切换', icon: MonitorCog },
  ]
  const run3DQuickAction = (label: string) => {
    if (label === '选择视角') setActive3DTool(label)
    else if (label === '重置视角') { setActive3DTool('选择视角'); onChooseTool(label) }
    else if (label === '体渲染开关') setVolumeRendering((value) => !value)
    else if (label === '陀螺仪显隐') setShowGyroscope((value) => !value)
    else if (label === '背景黑白切换') setDark3DBackground((value) => !value)
    else void MessagePlugin.info(`${label}为交互原型入口，文件服务待接入`)
  }
  return <section className="view-area" ref={viewAreaRef}>
    <div className={focusedView === null ? 'view-grid' : 'view-grid view-grid-focused'}>{views.map((view, index) => <div className={`medical-view view-${index}${index===3&&hiddenModels.includes('model-skull')?' result-hide-skull':''}${index===3&&hiddenModels.includes('model-teeth')?' result-hide-teeth':''}${index === 3 && dark3DBackground ? ' view-3-dark' : ''}${focusedView !== null && focusedView !== index ? ' medical-view-hidden' : ''}${locatedView === index ? ' medical-view-comment-target' : ''}`} key={view.name} onPointerDown={beginRightDrag} onPointerMove={updateRightDrag} onPointerUp={endRightDrag} onPointerCancel={() => { rightDragRef.current = null }} onContextMenu={(event) => openContextMenu(event, index)}><div className="view-label"><span>{view.name} <b>{view.cn}</b></span><button aria-label={focusedView === index ? `恢复${view.name}四视图` : `放大${view.name}`} aria-pressed={focusedView === index} onClick={() => toggleFocusedView(index)}>{focusedView === index ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button></div><MedicalGraphic kind={index} taskId={taskId} />{index < 3 && <>{showDirections && <><span className="dir dir-top">{view.dirs[0]}</span><span className="dir dir-left">{view.dirs[1]}</span><span className="dir dir-right">{view.dirs[2]}</span><span className="dir dir-bottom">{view.dirs[3]}</span></>}{showCrosshair && <><div className="crosshair crosshair-h" /><div className="crosshair crosshair-v" /></>}</>}{comments.filter((comment) => comment.view === view.name && comment.seriesId === series?.id).map((comment) => { const markerIndex = comments.findIndex((item) => item.id === comment.id); const markerKey = String.fromCharCode(65 + markerIndex); const statusClass = comment.status === '审核通过' ? 'review-marker-approved' : comment.status === '已修改 · 待复核' ? 'review-marker-modified' : 'review-marker-pending'; return <button key={comment.id} className={`review-marker ${statusClass}${comment.id === selectedComment?.id ? ' review-marker-active' : ''}`} style={{ left: `${comment.position.x}%`, top: `${comment.position.y}%` }} aria-label={`定位审核意见 ${markerKey}`} onClick={(event) => { event.stopPropagation(); onSelectComment(comment) }}>{markerKey}</button> })}{activeObject === 'measure-distance' && index === 0 && <div className="measurement-overlay measurement-distance"><span /><b>32.6 mm</b></div>}{activeObject === 'measure-angle' && index === 1 && <div className="measurement-overlay measurement-angle"><span /><span /><b>76.5°</b></div>}<div className="view-info">{view.info.map((item) => <span key={item}>{item}</span>)}</div><small className="simulation-label">图像预览</small>{index === 3 && <><div className="view-3-toolbar" role="toolbar" aria-label="三维视图快捷工具">{quick3DTools.map(({ label, icon: Icon }) => { const active = label === active3DTool || (label === '体渲染开关' && volumeRendering) || (label === '陀螺仪显隐' && showGyroscope) || (label === '背景黑白切换' && dark3DBackground); return <Tooltip key={label} content={label} placement="left"><button type="button" className={active ? 'view-3-tool view-3-tool-active' : 'view-3-tool'} aria-label={label} aria-pressed={['选择视角', '体渲染开关', '陀螺仪显隐', '背景黑白切换'].includes(label) ? active : undefined} onClick={(event) => { event.stopPropagation(); run3DQuickAction(label) }}><Icon size={16} /></button></Tooltip> })}</div>{showGyroscope && <div className="axis-cube"><b>S</b><span>R</span><small>A</small></div>}{activeObject.startsWith('model-') && <div className="viewport-selection">已选：{initialProfessionalObjects.find((object) => object.id === activeObject)?.name}</div>}</>}</div>)}</div>
    {contextMenu && <div ref={contextMenuRef} className="viewport-context-menu" role="menu" aria-label={`${contextMenu.viewIndex === 3 ? '三维视图' : `${views[contextMenu.viewIndex].cn}视图`}快捷操作`} style={{ left: contextMenu.x, top: contextMenu.y }} onContextMenu={(event) => event.preventDefault()}>{contextActions.map(({ label, icon: Icon }) => <button key={label} type="button" role="menuitem" onClick={() => runContextAction(label)}><Icon size={15} /><span>{label}</span></button>)}</div>}
    <div className="floating-tool"><MousePointer2 size={14} />{tool}</div>
  </section>
}
function MedicalGraphic({ kind, taskId }: { kind: number; taskId: string }) {
  if (kind === 3) return <svg className="medical-graphic skull-3d" viewBox="0 0 320 240" role="img" aria-label={`任务 ${taskId} 的三维骨骼预览`}><path className="bone-main" d="M111 46C72 64 58 104 69 141c7 24 22 39 37 48l3 28 18-4 11-24h45l11 24 19 4 2-30c20-15 34-43 31-74-4-44-40-78-83-78-19 0-36 4-52 11Z" /><path className="bone-hole" d="M95 95c11-18 34-21 50-6-5 21-17 31-36 26-11-3-17-10-14-20Zm82-6c16-15 39-12 49 6 4 10-2 17-13 20-19 5-31-5-36-26Z" /><path className="bone-hole" d="m150 115-11 28h34l-12-28Z" /><path className="bone-line" d="M113 154c24 12 71 12 95 0l-11 36h-72l-12-36ZM128 161v29m16-26v28m18-28v28m18-31v29" /></svg>
  const shape = kind === 0 ? 'M160 31c65 0 116 38 116 91 0 57-51 91-116 91S44 179 44 122c0-53 51-91 116-91Z' : kind === 1 ? 'M160 22c62 0 99 43 99 104 0 40-18 62-44 80l-11 25h-28l-9-22h-15l-9 22h-28l-10-25c-27-17-44-40-44-80 0-61 37-104 99-104Z' : 'M128 23c43-4 84 25 99 70 10 30 5 63-13 90l8 33-31 6-19-25c-30 2-61-11-78-40-19-32-13-75 7-103 7-12 17-22 27-31Z'
  return <svg className="medical-graphic slice-graphic" viewBox="0 0 320 240" aria-hidden="true"><ellipse className="scan-halo" cx="160" cy="122" rx="124" ry="103" /><path className="scan-soft" d={shape} /><path className="scan-bone" d={kind === 0 ? 'M78 119c13-48 52-70 82-70s70 22 83 70c-8 50-46 76-83 76s-75-26-82-76Zm42-16c9-15 25-19 40-7 15-12 31-8 40 7 10 17 0 35-18 37-9 1-16-3-22-10-6 7-13 11-22 10-18-2-28-20-18-37Z' : kind === 1 ? 'M100 83c17-32 103-32 120 0l5 62c-11 35-35 56-65 56s-54-21-65-56l5-62Zm27 12c10-14 25-14 33 0 9-14 24-14 34 0-3 19-13 28-32 28s-31-9-35-28Z' : 'M104 74c31-31 82-20 96 22 10 29-2 64-29 80-30 18-65 5-78-25-11-27-6-56 11-77Z'} /><path className="scan-detail" d={kind === 0 ? 'M87 123h146M160 49v146M112 72c12 7 22 9 48 9s37-2 49-9' : kind === 1 ? 'M160 43v158M104 145h112M126 169c22 13 46 13 68 0' : 'M103 133h98M160 47v151M121 89c24-17 56-8 65 18'} /></svg>
}

function SettingsPage({ section, onSectionChange, onBack, returnLabel, user, onUserChange, themePreference, onThemePreferenceChange, notificationPreferences, onNotificationPreferencesChange, onLogout }: { section: SettingsSection; onSectionChange: (section: SettingsSection) => void; onBack: () => void; returnLabel: string; user: UserProfile; onUserChange: (user: UserProfile) => void; themePreference: ThemePreference; onThemePreferenceChange: (theme: ThemePreference) => void; notificationPreferences: NotificationPreferences; onNotificationPreferencesChange: (preferences: NotificationPreferences) => void; onLogout: () => void }) {
  const [editing, setEditing] = useState(false)
  const [profileDraft, setProfileDraft] = useState(user)
  const [profileError, setProfileError] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [passwordError, setPasswordError] = useState('')
  const [avatarVisible, setAvatarVisible] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(user.avatar)
  const [avatarFileName, setAvatarFileName] = useState('')
  const [avatarError, setAvatarError] = useState('')
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [verificationVisible, setVerificationVisible] = useState(false)
  const [verificationMethod, setVerificationMethod] = useState<'alipay' | 'wechat' | null>(null)
  const [verificationError, setVerificationError] = useState('')
  useEffect(() => { if (!editing) setProfileDraft(user) }, [editing, user])
  const saveProfile = () => {
    const name = profileDraft.name.trim()
    if (!name) { setProfileError('姓名不能为空'); return }
    if (profileDraft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileDraft.email)) { setProfileError('请输入有效的电子邮箱'); return }
    setProfileError(''); onUserChange({ ...profileDraft, name }); setEditing(false); void MessagePlugin.success('个人资料已保存')
  }
  const closePassword = () => { setPasswordVisible(false); setPasswords({ current: '', next: '', confirm: '' }); setPasswordError('') }
  const validatePassword = () => {
    if (!passwords.current || !passwords.next || !passwords.confirm) { setPasswordError('请完整填写三项密码'); return }
    if (passwords.next.length < 8 || !/[A-Za-z]/.test(passwords.next) || !/\d/.test(passwords.next)) { setPasswordError('新密码至少 8 位，且需同时包含字母和数字'); return }
    if (passwords.next !== passwords.confirm) { setPasswordError('两次输入的新密码不一致'); return }
    setPasswordError('密码服务当前不可用，请稍后重试或联系管理员。')
  }
  const openAvatar = () => { setAvatarPreview(user.avatar); setAvatarFileName(''); setAvatarError(''); setAvatarVisible(true) }
  const closeAvatar = () => { setAvatarVisible(false); setAvatarPreview(user.avatar); setAvatarFileName(''); setAvatarError('') }
  const handleAvatarFile = (file?: File) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setAvatarError('请选择 JPG、PNG 或 WebP 格式的图片。'); return }
    if (file.size > 2 * 1024 * 1024) { setAvatarError('图片大小不能超过 2 MB。'); return }
    const reader = new FileReader()
    reader.onload = () => { if (typeof reader.result === 'string') { setAvatarPreview(reader.result); setAvatarFileName(file.name); setAvatarError('') } }
    reader.onerror = () => setAvatarError('图片读取失败，请重新选择。')
    reader.readAsDataURL(file)
  }
  const confirmAvatar = () => {
    if (!avatarFileName || avatarError) return
    const updated = { ...user, avatar: avatarPreview }
    try { localStorage.setItem('clinivol-user-profile', JSON.stringify(updated)) }
    catch { setAvatarError('图片无法保存，请选择更小的文件。'); return }
    onUserChange(updated)
    setProfileDraft((draft) => ({ ...draft, avatar: avatarPreview }))
    setAvatarVisible(false)
    void MessagePlugin.success('头像已更新')
  }
  const closeVerification = () => { setVerificationVisible(false); setVerificationMethod(null); setVerificationError('') }
  const requestVerificationSession = () => {
    if (!verificationMethod) { setVerificationError('请选择实名认证方式。'); return }
    setVerificationError('认证服务当前不可用，请稍后重试或联系管理员。')
  }
  const navigation: { key: SettingsSection; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: '个人资料', icon: <UserCircleIcon size={18} /> },
    { key: 'security', label: '账户安全', icon: <UserSafetyIcon size={18} /> },
    { key: 'preferences', label: '偏好设置', icon: <SettingIcon size={18} /> },
  ]
  return <div className="page settings-page"><section className="settings-heading"><Button variant="text" icon={<ChevronLeftIcon size={16} />} onClick={onBack}>{returnLabel}</Button></section><div className="settings-layout"><nav className="settings-nav" aria-label="账户设置导航">{navigation.map((item) => <button key={item.key} className={section === item.key ? 'settings-nav-item settings-nav-active' : 'settings-nav-item'} onClick={() => onSectionChange(item.key)}>{item.icon}<span>{item.label}</span></button>)}</nav><main className="settings-content">
    {section === 'profile' && <section className="settings-section"><header><h2>个人资料</h2>{editing ? <div className="settings-actions"><Button variant="outline" onClick={() => { setProfileDraft(user); setProfileError(''); setEditing(false) }}>取消</Button><Button theme="primary" onClick={saveProfile}>保存</Button></div> : <Button theme="primary" variant="outline" onClick={() => setEditing(true)}>编辑资料</Button>}</header><div className="profile-overview"><div className="profile-avatar-control"><img src={user.avatar} alt={`${user.name}头像`} /><Button variant="text" theme="primary" onClick={openAvatar}>更换头像</Button></div><div><strong>{user.name}</strong><span>{user.role} · {user.department}</span></div></div><div className="settings-form-grid"><SettingField label="姓名" value={profileDraft.name} editable={editing} onChange={(value) => setProfileDraft((draft) => ({ ...draft, name: value }))} /><SettingField label="账号" value={user.employeeId} /><SettingField label="所属部门" value={user.department} /><SettingField label="岗位 / 角色" value={user.role} /><SettingField label="手机号码" value={profileDraft.phone} editable={editing} onChange={(value) => setProfileDraft((draft) => ({ ...draft, phone: value }))} /><SettingField label="电子邮箱" value={profileDraft.email} editable={editing} onChange={(value) => setProfileDraft((draft) => ({ ...draft, email: value }))} /></div>{profileError && <p className="settings-error" role="alert">{profileError}</p>}</section>}
    {section === 'security' && <section className="settings-section"><header><h2>账户安全</h2></header><div className="settings-group"><div className="settings-group-title"><div><h3>登录密码</h3><p>定期更新密码有助于保护账号安全。</p></div><Button theme="primary" variant="outline" onClick={() => setPasswordVisible(true)}>修改密码</Button></div></div><div className="settings-group"><div className="settings-group-title"><div><h3>实名认证</h3><p>完成实名核验后，可用于需要身份确认的关键操作。</p></div><Button theme="primary" variant="outline" onClick={() => { setVerificationVisible(true); setVerificationError('') }}>去认证</Button></div><dl className="identity-summary"><div><dt>认证状态</dt><dd><Tag theme="warning" variant="light">未认证</Tag></dd></div><div><dt>认证方式</dt><dd>—</dd></div><div><dt>已认证姓名</dt><dd>—</dd></div><div><dt>认证完成时间</dt><dd>—</dd></div></dl></div><div className="settings-group"><div className="settings-group-title"><div><h3>登录安全</h3><p>最近登录：当前会话 · 本设备</p></div><Button theme="danger" variant="outline" onClick={onLogout}>退出当前登录</Button></div></div></section>}
    {section === 'preferences' && <section className="settings-section"><header><h2>偏好设置</h2></header><div className="settings-group"><h3>外观设置</h3><div className="theme-options" role="group" aria-label="外观主题">{([{ key: 'light', label: '浅色模式', icon: <SunnyIcon size={18} /> }, { key: 'dark', label: '深色模式', icon: <MoonIcon size={18} /> }, { key: 'system', label: '跟随系统', icon: <SettingIcon size={18} /> }] as const).map((item) => <button key={item.key} className={themePreference === item.key ? 'theme-option theme-option-active' : 'theme-option'} aria-pressed={themePreference === item.key} onClick={() => onThemePreferenceChange(item.key)}>{item.icon}<span>{item.label}</span></button>)}</div></div><div className="settings-group"><h3>语言设置</h3><div className="language-setting"><span>界面语言</span><strong>简体中文</strong><small>当前仅支持简体中文</small></div></div><div className="settings-group"><h3>通知偏好</h3><div className="preference-list">{([{ key: 'taskAssigned', label: '任务分配通知' }, { key: 'reviewResult', label: '审核结果通知' }, { key: 'doctorComments', label: '医生评论与回复通知' }, { key: 'systemMessages', label: '系统消息通知' }] as const).map((item) => <label key={item.key}><span>{item.label}</span><Switch value={notificationPreferences[item.key]} aria-checked={notificationPreferences[item.key]} onChange={(value) => onNotificationPreferencesChange({ ...notificationPreferences, [item.key]: value })} /></label>)}</div></div></section>}
  </main></div>
  <Dialog visible={avatarVisible} header="更换头像" width={460} footer={<div className="settings-dialog-actions"><Button variant="outline" onClick={closeAvatar}>取消</Button><Button theme="primary" disabled={!avatarFileName || Boolean(avatarError)} onClick={confirmAvatar}>确认更换</Button></div>} onClose={closeAvatar}><div className="avatar-upload"><img src={avatarPreview} alt="头像预览" /><div><Button variant="outline" onClick={() => avatarInputRef.current?.click()}>选择本地图片</Button><span>支持 JPG、PNG、WebP，文件不超过 2 MB。</span>{avatarFileName && <strong>{avatarFileName}</strong>}</div><input ref={avatarInputRef} className="avatar-file-input" type="file" accept="image/jpeg,image/png,image/webp" onClick={(event) => { event.currentTarget.value = '' }} onChange={(event) => handleAvatarFile(event.target.files?.[0])} />{avatarError && <p className="settings-error" role="alert">{avatarError}</p>}</div></Dialog>
  <Dialog visible={verificationVisible} header="实名认证" width={520} footer={<div className="settings-dialog-actions"><Button variant="outline" onClick={closeVerification}>取消</Button><Button theme="primary" disabled={!verificationMethod} onClick={requestVerificationSession}>获取认证二维码</Button></div>} onClose={closeVerification}><div className="verification-panel"><ol className="verification-steps"><li>选择认证方式</li><li>使用对应 App 扫码</li><li>确认认证结果</li></ol><div className="verification-methods"><button type="button" className={verificationMethod === 'alipay' ? 'verification-method verification-method-active' : 'verification-method'} aria-pressed={verificationMethod === 'alipay'} onClick={() => { setVerificationMethod('alipay'); setVerificationError('') }}><UserSafetyIcon size={20} /><span><strong>支付宝实名认证</strong><small>使用支付宝扫码完成实名核验</small></span></button><button type="button" className={verificationMethod === 'wechat' ? 'verification-method verification-method-active' : 'verification-method'} aria-pressed={verificationMethod === 'wechat'} onClick={() => { setVerificationMethod('wechat'); setVerificationError('') }}><UserSafetyIcon size={20} /><span><strong>微信实名认证</strong><small>使用微信扫码完成实名核验</small></span></button></div><p className="verification-privacy">认证过程由第三方认证服务完成，CliniVol 不在当前页面采集身份证照片或人脸影像。</p>{verificationError && <p className="settings-error" role="alert">{verificationError}</p>}</div></Dialog>
  <Dialog visible={passwordVisible} header="修改密码" width={480} footer={<div className="settings-dialog-actions"><Button variant="outline" onClick={closePassword}>取消</Button><Button theme="primary" onClick={validatePassword}>确认修改</Button></div>} onClose={closePassword}><div className="password-form"><label><span>原密码</span><Input type="password" value={passwords.current} onChange={(value) => setPasswords((draft) => ({ ...draft, current: String(value) }))} placeholder="请输入原密码" /></label><label><span>新密码</span><Input type="password" value={passwords.next} onChange={(value) => setPasswords((draft) => ({ ...draft, next: String(value) }))} placeholder="至少 8 位，包含字母和数字" /></label><label><span>确认新密码</span><Input type="password" value={passwords.confirm} onChange={(value) => setPasswords((draft) => ({ ...draft, confirm: String(value) }))} placeholder="请再次输入新密码" /></label>{passwordError && <p className="settings-error" role="alert">{passwordError}</p>}<p className="security-note">密码修改仅在验证当前密码并通过安全策略后生效。</p></div></Dialog></div>
}

function SettingField({ label, value, hint, editable = false, onChange }: { label: string; value: string; hint?: string; editable?: boolean; onChange?: (value: string) => void }) {
  return <label className="setting-field"><span>{label}</span>{editable ? <Input value={value} placeholder="未填写" onChange={(next) => onChange?.(String(next))} /> : <div className="setting-readonly"><strong>{value || '未填写'}</strong>{hint && <small>{hint}</small>}</div>}</label>
}

function SignedOutScreen({ onReenter }: { onReenter: () => void }) {
  return <div className="signed-out-screen"><section className="signed-out-panel"><BrandLogo compact /><UserCircleIcon size={48} /><h1>已退出当前账号</h1><p>当前会话已结束，本设备上的任务进度与个人偏好均已保留。</p><Button theme="primary" size="large" onClick={onReenter}>重新登录</Button></section></div>
}

function LockScreen({ onUnlock }: { onUnlock: () => void }) { return <div className="lock-screen"><div className="lock-panel"><BrandLogo compact /><div className="lock-avatar">陈</div><h2>CliniVol 已锁定</h2><p>陈屿 · 三维重建设计师</p><Tag theme="warning" variant="light"><LockOnIcon size={14} />当前账号处于锁定状态</Tag><Input type="password" placeholder="请输入账号密码" /><Button theme="primary" block onClick={onUnlock}>解锁并返回</Button></div></div> }

export default App
