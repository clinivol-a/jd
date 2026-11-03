import { useEffect, useState } from 'react'
import { Dialog } from 'tdesign-react'
import { cadAsset } from './cad/cadProject'

/** Statistics from the actual supplied STL resource, never a generated reconstruction. */
export default function ReconstructionStatistics({visible,onClose}:{visible:boolean;onClose:()=>void}) {
  const [result,setResult]=useState<{triangles:number;size:number;dimensions:string}|null>(null)
  const [error,setError]=useState('')
  useEffect(()=>{
    if(!visible)return
    const abort=new AbortController()
    setResult(null);setError('')
    void (async()=>{
      try {
        const response=await fetch(cadAsset.url,{signal:abort.signal})
        if(!response.ok)throw new Error('无法读取当前关联的 STL 文件')
        const [buffer,{STLLoader}]=await Promise.all([response.arrayBuffer(),import('three/examples/jsm/loaders/STLLoader.js')])
        const geometry=new STLLoader().parse(buffer)
        geometry.computeBoundingBox()
        const box=geometry.boundingBox
        if(!box)throw new Error('当前 STL 没有可统计的几何数据')
        const dimensions=[box.max.x-box.min.x,box.max.y-box.min.y,box.max.z-box.min.z].map(value=>value.toFixed(2)).join(' × ')
        const triangles=geometry.getAttribute('position').count/3
        geometry.dispose()
        if(!abort.signal.aborted)setResult({triangles,size:buffer.byteLength,dimensions})
      }catch(cause){if(!abort.signal.aborted)setError(cause instanceof Error?cause.message:'无法读取 STL 属性')}
    })()
    return()=>abort.abort()
  },[visible])
  return <Dialog visible={visible} header="STL属性统计" footer={false} width={460} onClose={onClose}>
    {error?<p role="alert">{error}</p>:result?<dl className="property-statistics"><div><dt>文件</dt><dd>{cadAsset.filename}</dd></div><div><dt>三角面</dt><dd>{result.triangles.toLocaleString('zh-CN')}</dd></div><div><dt>包围盒（模型单位）</dt><dd>{result.dimensions}</dd></div><div><dt>文件大小</dt><dd>{(result.size/1024/1024).toFixed(2)} MB</dd></div></dl>:<p role="status">正在读取 STL 属性…</p>}
  </Dialog>
}
