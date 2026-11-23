import {useLayoutEffect,useRef,useState} from 'react'
import './viewportTables.css'

export function pageCapacity(available:number,header:number,row:number,footer:number) {
  return Math.max(1,Math.floor((available-header-footer)/Math.max(1,row)))
}
export function pageAfterResize(page:number,oldSize:number,newSize:number,total:number) {
  return Math.min(Math.max(1,Math.ceil(total/newSize)),Math.floor((page-1)*oldSize/newSize)+1)
}
/** Measures the incumbent table, without changing row density or stretching sparse cards. */
export function useViewportPagination(total:number,resetKey:string,{enabled=true,page:controlled,onChange}:{enabled?:boolean;page?:number;onChange?:(page:number)=>void}={}) {
  const ref=useRef<HTMLDivElement>(null)
  const metrics=useRef({footer:72})
  const [size,setSize]=useState(6),[local,setLocal]=useState(controlled||1)
  const page=Math.max(1,Math.min(controlled??local,Math.ceil(total/size)||1))
  const state=useRef({page,size,total,onChange})
  state.current={page,size,total,onChange}
  const setPage=(next:number)=>{setLocal(next);state.current.onChange?.(next)}
  const previous=useRef(resetKey)
  useLayoutEffect(()=>{if(previous.current!==resetKey){previous.current=resetKey;setPage(1)}},[resetKey])
  useLayoutEffect(()=>{
    if(!enabled||!ref.current)return
    const root=ref.current,scroller=root.closest('.platform-main'),card=root.closest('.t-card')
    let frame=0,disposed=false
    const measure=()=>{
      frame=0;if(disposed)return
      const table=root.querySelector('table'),row=table?.querySelector('tbody tr:not(.t-table__empty-row)')
      const rowHeight=total>0&&(row?.querySelectorAll('td').length||0)>1?row!.getBoundingClientRect().height:48
      const head=table?.querySelector('thead')?.getBoundingClientRect().height||48
      const footer=root.querySelector('[data-viewport-pagination]')
      // Reserve the same pagination footprint even when the current result fits one page.
      const measuredFooter=footer?.getBoundingClientRect().height
      if(measuredFooter)metrics.current.footer=measuredFooter
      const footerHeight=metrics.current.footer
      const scrollTop=scroller?.scrollTop||0
      const top=root.getBoundingClientRect().top+scrollTop
      const bottom=Math.min(window.innerHeight,scroller?.getBoundingClientRect().bottom||window.innerHeight)
      let padding=24,node:Element|null=root.parentElement
      while(node&&node!==card?.parentElement){padding+=parseFloat(getComputedStyle(node).paddingBottom)||0;node=node.parentElement}
      const next=pageCapacity(bottom-top-padding,head,rowHeight,footerHeight)
      const current=state.current
      if(next!==current.size){
        const nextPage=pageAfterResize(current.page,current.size,next,current.total)
        state.current={...current,size:next,page:nextPage}
        setSize(next);setPage(nextPage)
      }
    }
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(measure)}
    const observer=new ResizeObserver(schedule)
    observer.observe(root);if(scroller)observer.observe(scroller);if(card)observer.observe(card)
    window.addEventListener('resize',schedule);measure()
    return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',schedule)}
  },[enabled,resetKey,total])
  return {ref,page,pageSize:size,setPage,showPagination:enabled&&total>size,start:(page-1)*size,end:page*size}
}
