import { InputNumber, Select, Textarea } from 'tdesign-react'
import { closedSketches, datumCommands, newSolidCommands } from './cadCommands'
import type { CommandParams } from './cadCommands'
import type { CadProject } from './cadProject'
export default function CadCommandParameters({ command, project, params, onChange, error }: { command: string; project: CadProject; params: CommandParams; onChange: (value: CommandParams) => void; error?: string }) {
  const field = (label: string, value: React.ReactNode) => <div className="cad-field" role="group" aria-label={label}><span>{label}</span><div>{value}</div></div>
  const number = (key: keyof CommandParams,label: string,min=-500,max=500) => field(label,<InputNumber value={Number(params[key])} min={min} max={max} onChange={(value)=>onChange({...params,[key]:Number(value)})} />)
  const choices=closedSketches(project).map((sketch)=>({label:sketch.name,value:sketch.id}))
  return <div className="cad-extended-parameters">
    {!newSolidCommands.includes(command)&&!datumCommands.includes(command)&&field('设计对象',<Select placeholder="请选择设计对象" value={params.targetId} options={project.objects.filter((object)=>object.kind!=='reference'&&!object.locked).map((object)=>({label:object.name,value:object.id}))} onChange={(value)=>onChange({...params,targetId:String(value)})} />)}
    {newSolidCommands.includes(command)&&field('闭合草图',<Select placeholder="请选择闭合草图" value={params.sketchId} options={choices} onChange={(value)=>onChange({...params,sketchId:String(value)})} />)}
    {command==='放样'&&field('第二截面',<Select placeholder="请选择另一张闭合草图" value={params.sketch2Id} options={choices.filter((option)=>option.value!==params.sketchId)} onChange={(value)=>onChange({...params,sketch2Id:String(value)})} />)}
    {['旋转体','拔模','平面','轴','螺旋','线性阵列','环形阵列','曲线阵列'].includes(command)&&field('方向 / 轴',<Select value={params.axis} options={['X','Y','Z'].map((value)=>({label:value,value}))} onChange={(value)=>onChange({...params,axis:value as CommandParams['axis']})} />)}
    {['扫掠','放样','平面','轴','螺旋'].includes(command)&&number('distance',command==='平面'?'平面尺寸 / mm':command==='扫掠'?'路径高度 / mm':'长度 / mm',.1,200)}
    {['旋转体','扫掠','环形阵列','曲线阵列','螺旋'].includes(command)&&number('radius',command==='扫掠'?'路径侧向偏移 / mm':'半径 / mm',.1,200)}
    {['旋转体','拔模'].includes(command)&&number('angle','角度 / °',.1,command==='拔模'?44:360)}
    {['线性阵列','环形阵列','曲线阵列','螺旋'].includes(command)&&number('count',command==='螺旋'?'圈数':'实例数',command==='螺旋'?1:2,20)}
    {command==='线性阵列'&&number('spacing','间距 / mm',.1,200)}
    {['加厚','倒角','抽壳','修改圆角','偏移曲面'].includes(command)&&number('thickness',command==='修改圆角'?'圆角半径 / mm':command==='偏移曲面'?'法向偏移 / mm':'尺寸 / mm',command==='偏移曲面'?-10:.1,command==='倒角'?3:20)}
    {datumCommands.includes(command)&&<>{number('x','位置 X / mm')}{number('y','位置 Y / mm')}{number('z','位置 Z / mm')}</>}
    {command==='3D 拟合样条'&&field('空间点（每行 X,Y,Z）',<Textarea value={params.points} onChange={(value)=>onChange({...params,points:String(value)})} autosize={{minRows:3,maxRows:6}} />)}
    {command==='删除零件'&&<p className="cad-muted">确认后删除当前设计对象及其关联特征，可通过撤销恢复。</p>}
    {error&&<p className="cad-command-validation" role="status">{error}</p>}
  </div>
}
