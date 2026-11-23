import { useCallback, useEffect, useRef } from 'react';
import { MessagePlugin } from 'tdesign-react';
import {useWorkspaceStorage} from '../auth/AuthContext';
import {linkedCatalogKey} from './linkedCatalog';
import type { Dispatch, SetStateAction } from 'react';
import type { Task, FlowEvent, Notice } from '../App';
import { unifiedRequest } from './unifiedClient';
import type { SharedDesigner } from './unifiedClient';
export function useUnifiedDesigner(accountId: string, setTasks: Dispatch<SetStateAction<Task[]>>, setEvents: Dispatch<SetStateAction<FlowEvent[]>>, setNotices?:Dispatch<SetStateAction<Notice[]>>) {
    const storage=useWorkspaceStorage(), failureShown=useRef(false);
    const refresh = useCallback(async () => {
        const result = await unifiedRequest<SharedDesigner>('designer');
        failureShown.current=false;
        if(result.catalogMode==='linked-only'){storage.setItem(linkedCatalogKey,JSON.stringify(result));if(setNotices)setNotices(current=>{const next=result.events.filter(e=>e.taskId&&['assigned','review-submit','review-pass','review-return'].includes(e.type)).map(e=>{const id=Array.from(e.id).reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0),old=current.find(n=>n.eventId===e.id);return {id,title:e.name,detail:e.description||result.tasks.find(t=>t.id===e.taskId)?.title||'',time:e.at,createdAt:e.at,eventId:e.id,projectId:e.orderNo,taskId:e.taskId,tone:e.type==='review-return'?'warning':e.type==='review-pass'?'success':'info',unread:old?.unread??true,dismissed:old?.dismissed} as Notice});return JSON.stringify(next)===JSON.stringify(current)?current:next;});}
        setTasks(current => { const next = [...(result.catalogMode==='linked-only'?[]:current.filter(t => !t.sharedBusiness)), ...result.tasks]; return JSON.stringify(current) === JSON.stringify(next) ? current : next; });
        setEvents(current => { const next = [...(result.catalogMode==='linked-only'?[]:current.filter(e => e.source !== 'isolated-shared')), ...result.events]; return JSON.stringify(current) === JSON.stringify(next) ? current : next; });
        return result;
    }, [accountId, setTasks, setEvents, setNotices, storage]);
    useEffect(() => { let alive = true; const sync = () => { if (alive && !document.hidden)
        void refresh().catch(error => {if(!failureShown.current){failureShown.current=true;void MessagePlugin.error((error as Error).message||'业务数据同步失败，请稍后重试。')}}); }; sync(); const timer = window.setInterval(sync, 8000); window.addEventListener('focus', sync); return () => { alive = false; window.clearInterval(timer); window.removeEventListener('focus', sync); }; }, [refresh]);
    return refresh;
}
