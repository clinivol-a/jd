import {useState} from 'react'
import {Button,Card,Empty,Pagination,Table,Tooltip} from 'tdesign-react'
import type {PrimaryTableCol} from 'tdesign-react/es/table'
import type {FlowEvent,Notice} from '../App'
import {PageBack} from '../PageBack'
import {AssignmentErrorIcon,NotificationIcon,TaskCheckedIcon} from '../design-system/tdesign'
import {useViewportPagination} from '../tables/useViewportPagination'
import {formatNoticeTime,noticeTimestamp,projectNumber,recentProjects,sortedNotices} from './projectModel'
import type {Project} from './projectModel'
import {formatDateTime} from '../dateTime'

export function RecentProjectList({projects,events,onProject,onBack}:{projects:Project[];events:FlowEvent[];onProject:(id:string)=>void;onBack:()=>void}) {
  const rows=recentProjects(projects,events,projects.length)
  const paging=useViewportPagination(rows.length,rows.map(row=>row.project.id).join('|'))
  const columns:PrimaryTableCol<(typeof rows)[number]>[]=[
    {colKey:'number',title:'项目编号',width:160,ellipsis:true,cell:({row})=>projectNumber(row.project)},
    {colKey:'name',title:'手术项目名称',width:240,ellipsis:true,cell:({row})=>row.project.name},
    {colKey:'hospital',title:'医院',width:260,ellipsis:true,cell:({row})=>row.project.hospital},
    {colKey:'at',title:'最近操作',width:170,cell:({row})=><Tooltip content={formatDateTime(row.at)}><time>{formatNoticeTime(row.at)}</time></Tooltip>},
    {colKey:'actions',title:'操作',width:110,align:'left',className:'business-action-cell',cell:({row})=><Button variant="text" theme="primary" onClick={()=>onProject(row.project.id)}>查看详情</Button>},
  ]
  return <div className="page project-page designer-list-page"><PageBack label="返回工作台" onBack={onBack}/><Card bordered={false} className="project-list-card"><div className="project-page-heading"><h1>最近项目</h1></div><div className="viewport-table" ref={paging.ref}><Table className="app-table" rowKey="project.id" data={rows.slice(paging.start,paging.end)} columns={columns} tableLayout="fixed" hover bordered={false} empty={<Empty description="暂无最近项目"/>}/>{paging.showPagination&&<div className="project-pagination" data-viewport-pagination><Pagination current={paging.page} pageSize={paging.pageSize} total={rows.length} showPageSize={false} showJumper={false} onCurrentChange={paging.setPage}/></div>}</div></Card></div>
}

export function ProjectNoticeList({notices,events,onNotice,onBack}:{notices:Notice[];events:FlowEvent[];onNotice:(notice:Notice)=>void;onBack:()=>void}) {
  const [filter,setFilter]=useState('全部')
  const rows=sortedNotices(notices.filter(notice=>!notice.dismissed&&(filter==='全部'||notice.unread===(filter==='未读'))),events)
  const paging=useViewportPagination(rows.length,filter+'|'+rows.map(row=>row.id).join('|'))
  const columns:PrimaryTableCol<Notice>[]=[
    {colKey:'title',title:'通知类型',width:210,ellipsis:true,cell:({row})=>{const Icon=row.tone==='warning'?AssignmentErrorIcon:row.tone==='success'?TaskCheckedIcon:NotificationIcon;return <span className="notice-kind"><i className={`notice-symbol notice-symbol-${row.tone}${row.unread?' notice-symbol-unread':''}`}><Icon size={16}/></i><strong>{row.title}</strong></span>}},
    {colKey:'detail',title:'内容',width:350,ellipsis:true,cell:({row})=>row.tone==='warning'?'查看意见并修改':row.detail},
    {colKey:'at',title:'时间',width:170,cell:({row})=><Tooltip content={formatDateTime(noticeTimestamp(row,events))}><time>{formatNoticeTime(noticeTimestamp(row,events))}</time></Tooltip>},
    {colKey:'unread',title:'状态',width:90,cell:({row})=>row.unread?'未读':'已读'},
    {colKey:'actions',title:'操作',width:110,align:'left',className:'business-action-cell',cell:({row})=><Button variant="text" theme="primary" onClick={()=>onNotice(row)}>查看详情</Button>},
  ]
  return <div className="page project-page designer-list-page"><PageBack label="返回工作台" onBack={onBack}/><Card bordered={false} className="project-list-card"><div className="project-page-heading"><h1>重要通知</h1><div className="notice-filters" aria-label="通知筛选">{['全部','未读','已读'].map(value=><Button key={value} variant="text" size="small" theme={filter===value?'primary':'default'} className={filter===value?'notice-filter-active':''} onClick={()=>{setFilter(value);paging.setPage(1)}}>{value}</Button>)}</div></div><div className="viewport-table" ref={paging.ref}><Table className="app-table" rowKey="id" data={rows.slice(paging.start,paging.end)} columns={columns} tableLayout="fixed" hover bordered={false} empty={<Empty description="暂无通知"/>}/>{paging.showPagination&&<div className="project-pagination" data-viewport-pagination><Pagination current={paging.page} pageSize={paging.pageSize} total={rows.length} showPageSize={false} showJumper={false} onCurrentChange={paging.setPage}/></div>}</div></Card></div>
}
