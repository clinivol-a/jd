import * as THREE from 'three'
import { newCadId } from './cadProject'
import type { CadObject, CadProject, CadSketch } from './cadProject'
export const extendedToolCommands: Record<string,string> = {
  revolve:'旋转体', sweep:'扫掠', loft:'放样', thicken:'加厚', chamfer:'倒角', draft:'拔模', shell:'抽壳',
  'linear-pattern':'线性阵列', 'circular-pattern':'环形阵列', 'curve-pattern':'曲线阵列', 'delete-part':'删除零件', 'modify-fillet':'修改圆角',
  plane:'平面', axis:'轴', point:'基准点', helix:'螺旋', 'fit-spline':'3D 拟合样条', fill:'填充', 'offset-surface':'偏移曲面',
}
export type CommandParams = { targetId: string; sketchId: string; sketch2Id: string; axis: 'X'|'Y'|'Z'; distance: number; radius: number; angle: number; count: number; spacing: number; thickness: number; x: number; y: number; z: number; points: string }
export const initialCommandParams: CommandParams = { targetId:'',sketchId:'',sketch2Id:'',axis:'Y',distance:30,radius:30,angle:360,count:3,spacing:20,thickness:1,x:0,y:0,z:0,points:'0,0,0\n15,10,10\n30,0,25' }
export const newSolidCommands = ['旋转体','扫掠','放样','填充']
export const datumCommands = ['平面','轴','基准点','螺旋','3D 拟合样条']
export const isExtendedCommand = (name: string | null) => Boolean(name && Object.values(extendedToolCommands).includes(name))
export function closedSketches(project: CadProject) { return project.sketches.filter((sketch) => sketch.primitives.some((primitive) => ['矩形','圆'].includes(primitive.kind))) }
export function commandShape(sketch: CadSketch) {
  const primitive = sketch.primitives.find((item) => ['矩形','圆'].includes(item.kind))!
  const [a,b] = primitive.points
  const shape = new THREE.Shape()
  if (primitive.kind === '圆') shape.absarc(a[0],a[1],Math.hypot(b[0]-a[0],b[1]-a[1]),0,Math.PI*2,false)
  else { const w=Math.abs(b[0]-a[0]),h=Math.abs(b[1]-a[1]); const x=Math.min(a[0],b[0]),y=Math.min(a[1],b[1]); shape.moveTo(x,y); shape.lineTo(x+w,y); shape.lineTo(x+w,y+h); shape.lineTo(x,y+h); shape.closePath() }
  return shape
}
export function parseCurvePoints(text: string) { return text.trim().split(/[;\n]+/).map((line) => line.trim().split(/[,，\s]+/).map(Number)) }
export function prepareCadCommand(project: CadProject, command: string, p: CommandParams, preview = false): { project: CadProject; error?: string; selectedId?: string } {
  const invalid = (error: string) => ({project,error})
  if (![p.distance,p.radius,p.angle,p.count,p.spacing,p.thickness,p.x,p.y,p.z].every(Number.isFinite)) return invalid('请输入有效数值')
  const sketch=project.sketches.find((item)=>item.id===p.sketchId), sketch2=project.sketches.find((item)=>item.id===p.sketch2Id)
  if (newSolidCommands.includes(command) && (!sketch || !closedSketches(project).includes(sketch))) return invalid('请选择包含矩形或圆的闭合草图')
  if (command==='放样' && (!sketch2 || sketch2.id===sketch?.id || !closedSketches(project).includes(sketch2))) return invalid('请选择另一张闭合草图作为第二截面')
  if (newSolidCommands.includes(command) && [sketch,...(command==='放样'?[sketch2]:[])].some((profile)=>!profile || Math.abs(THREE.ShapeUtils.area(commandShape(profile).getPoints(64)))<.000001)) return invalid('草图轮廓尺寸必须大于 0')
  if (['旋转体','扫掠','放样','螺旋','平面','轴'].includes(command) && (p.distance<=0 || p.radius<=0)) return invalid('尺寸必须大于 0')
  if (command==='旋转体' && (p.angle<=0 || p.angle>360)) return invalid('旋转角度应大于 0 且不超过 360°')
  if (['加厚','倒角','抽壳','修改圆角'].includes(command) && p.thickness<=0) return invalid('尺寸必须大于 0')
  if (command==='拔模' && (p.angle<=0 || p.angle>=45)) return invalid('拔模角度应大于 0 且小于 45°')
  if (['线性阵列','环形阵列','曲线阵列'].includes(command) && (!Number.isInteger(p.count)||p.count<2||p.count>20||p.spacing<=0)) return invalid('实例数应为 2–20 的整数，间距必须大于 0')
  if (command==='螺旋' && (!Number.isInteger(p.count)||p.count<1||p.count>20)) return invalid('圈数应为 1–20 的整数')
  if (command==='3D 拟合样条') { const pts=parseCurvePoints(p.points); if (pts.length<3 || pts.some((point)=>point.length!==3||point.some((n)=>!Number.isFinite(n)))) return invalid('每行输入 X,Y,Z，至少需要 3 个有效点') }
  const target=project.objects.find((item)=>item.id===p.targetId)
  const creates=newSolidCommands.includes(command)||datumCommands.includes(command)
  if (!creates && (!target || target.kind==='reference' || target.locked)) return invalid('请选择未锁定的设计对象')
  if (['拔模','偏移曲面'].includes(command) && ['curve','datum'].includes(target?.kind??'')) return invalid('请选择实体或曲面对象')
  if (command==='抽壳' && target?.kind!=='extrusion') return invalid('请选择拉伸实体进行抽壳')
  if (command==='倒角' && !['plate','extrusion'].includes(target?.kind??'')) return invalid('请选择修复板或拉伸实体进行倒角')
  if (command==='修改圆角' && target?.kind!=='plate') return invalid('请选择修复板调整圆角')
  if (command==='加厚' && target?.kind!=='plate' && target?.kind!=='extrusion' && target?.construction?.type!=='填充') return invalid('请选择修复板、拉伸实体或填充曲面')
  if (command==='旋转体' && sketch) { const points=commandShape(sketch).getPoints(64); if(points.some((point)=>point.x+p.radius<=0)) return invalid('旋转半径不足，请增大半径使轮廓位于旋转轴同侧') }
  if (command==='抽壳') { const profile=project.sketches.find((s)=>s.id===target!.sketchId); if(!profile) return invalid('当前实体缺少闭合草图'); const box=new THREE.Box2().setFromPoints(commandShape(profile).getPoints(64)); const size=box.getSize(new THREE.Vector2()); if(p.thickness*2>=Math.min(size.x,size.y))return invalid('壁厚应小于截面最小尺寸的一半') }
  if (command==='倒角' && p.thickness>3) return invalid('倒角尺寸不能超过 3 mm')
  const id=preview ? `preview-${command}` : newCadId(); let objects=[...project.objects]; let selectedId=target?.id
  if (creates) {
    const kind=command==='平面'||command==='轴'||command==='基准点' ? 'datum' : command==='螺旋'||command==='3D 拟合样条' ? 'curve' : 'generated'
    objects.push({id,name:`${command}${objects.filter((item)=>item.construction?.type===command).length+1}`,kind,visible:true,locked:false,color:kind==='generated'?'#7299ad':'#638cb0',opacity:command==='平面'?.22:1,material:'未指定',position:[p.x,p.y,p.z+(sketch?.plane==='XY'?45:0)],fillet:0,holes:[],sketchId:p.sketchId,construction:{type:command,parameters:{...p}}}); selectedId=id
  } else if (command.endsWith('阵列')) {
    for(let i=1;i<p.count;i++) {
      const copy=structuredClone(target!); copy.id=preview?`${id}-${i}`:newCadId(); copy.name=`${target!.name} · ${i+1}`
      const axis=p.axis==='X'?0:p.axis==='Y'?1:2
      if(command==='线性阵列') copy.position[axis]+=i*p.spacing
      else { const a=i*(command==='环形阵列'?Math.PI*2/p.count:Math.PI/(p.count-1)); const u=(axis+1)%3,v=(axis+2)%3; copy.position[u]+=Math.cos(a)*p.radius-p.radius; copy.position[v]+=Math.sin(a)*p.radius; if(command==='环形阵列') { const rotation=copy.rotation??[0,0,0]; rotation[axis]+=a*180/Math.PI; copy.rotation=rotation } }
      objects.push(copy)
    }
  } else if (command==='删除零件') { objects=objects.filter((item)=>item.id!==target!.id); selectedId=undefined }
  else objects=objects.map((item)=>item.id!==target!.id?item:{...item,
    ...(command==='加厚'?item.kind==='extrusion'?{distance:(item.distance??8)+p.thickness}:{thickness:(item.thickness??(item.kind==='plate'?2.1:0))+p.thickness}:{}),
    ...(command==='倒角'?{chamfer:p.thickness}:{}), ...(command==='抽壳'?{shellThickness:p.thickness}:{}),
    ...(command==='拔模'?{draft:{axis:p.axis,angle:p.angle}}:{}), ...(command==='修改圆角'?{fillet:p.thickness}:{}),
    ...(command==='偏移曲面'?{normalOffset:(item.normalOffset??0)+p.thickness}:{}),
  })
  if(command==='删除零件') return {project:{...project,objects,selectedId:null,features:project.features.filter((f)=>f.objectId!==target!.id)},selectedId}
  return {project:{...project,objects,selectedId:selectedId??null,features:preview?project.features:[...project.features,{id:newCadId(),name:command,tool:command,objectId:selectedId,at:new Date().toISOString(),parameters:{...p}}]},selectedId}
}
export function generatedGeometry(object: CadObject, project: CadProject): THREE.BufferGeometry | undefined {
  const spec=object.construction; if(!spec) return
  const p=spec.parameters; const n=(key:string)=>Number(p[key]); const sketch=project.sketches.find((item)=>item.id===object.sketchId)
  let geometry: THREE.BufferGeometry | undefined
  if(spec.type==='旋转体' && sketch) { const points=commandShape(sketch).getSpacedPoints(64).map((point)=>new THREE.Vector2(Math.max(.1,n('radius')+point.x),point.y)); geometry=new THREE.LatheGeometry(points,64,0,THREE.MathUtils.degToRad(n('angle'))) }
  if(spec.type==='扫掠' && sketch) { const path=new THREE.CatmullRomCurve3([new THREE.Vector3(),new THREE.Vector3(n('radius')*.45,0,n('distance')*.45),new THREE.Vector3(n('radius'),0,n('distance'))]); geometry=new THREE.ExtrudeGeometry(commandShape(sketch),{steps:48,bevelEnabled:false,extrudePath:path}) }
  if(spec.type==='填充' && sketch) geometry=object.thickness?new THREE.ExtrudeGeometry(commandShape(sketch),{depth:object.thickness,bevelEnabled:false}):new THREE.ShapeGeometry(commandShape(sketch),48)
  if(spec.type==='放样' && sketch) {
    const other=project.sketches.find((item)=>item.id===p.sketch2Id); if(!other) return
    const a=commandShape(sketch).getSpacedPoints(64).slice(0,64),b=commandShape(other).getSpacedPoints(64).slice(0,64)
    const vertices=[...a.flatMap((point)=>[point.x,point.y,0]),...b.flatMap((point)=>[point.x,point.y,n('distance')])]; const indices:number[]=[]
    for(let i=0;i<64;i++){const j=(i+1)%64;indices.push(i,j,j+64,i,j+64,i+64)}
    THREE.ShapeUtils.triangulateShape(a,[]).forEach(([x,y,z])=>indices.push(z,y,x));THREE.ShapeUtils.triangulateShape(b,[]).forEach(([x,y,z])=>indices.push(x+64,y+64,z+64))
    geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals()
  }
  if(spec.type==='平面') geometry=new THREE.PlaneGeometry(n('distance'),n('distance'))
  if(spec.type==='基准点') geometry=new THREE.SphereGeometry(.8,12,8)
  if(spec.type==='轴') geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-n('distance')/2,0),new THREE.Vector3(0,n('distance')/2,0)])
  if(spec.type==='螺旋') geometry=new THREE.BufferGeometry().setFromPoints(Array.from({length:257},(_,i)=>{const t=i/256;return new THREE.Vector3(Math.cos(t*Math.PI*2*n('count'))*n('radius'),t*n('distance'),Math.sin(t*Math.PI*2*n('count'))*n('radius'))}))
  if(spec.type==='3D 拟合样条') geometry=new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3(parseCurvePoints(String(p.points)).map((v)=>new THREE.Vector3(...v as [number,number,number]))).getPoints(128))
  if(geometry && sketch && ['扫掠','放样','填充'].includes(spec.type)){ if(sketch.plane==='XZ')geometry.rotateX(Math.PI/2); if(sketch.plane==='YZ')geometry.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1),new THREE.Vector3(1,0,0))) }
  if(geometry && ['旋转体','螺旋','轴'].includes(spec.type)){if(p.axis==='X')geometry.rotateZ(-Math.PI/2);if(p.axis==='Z')geometry.rotateX(Math.PI/2)}
  if(geometry && ['平面'].includes(spec.type)){if(p.axis==='X')geometry.rotateY(Math.PI/2);if(p.axis==='Y')geometry.rotateX(Math.PI/2)}
  return geometry
}
