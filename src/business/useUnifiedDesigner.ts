import { useCallback, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Task, FlowEvent } from '../App';
import { unifiedRequest } from './unifiedClient';
import type { SharedDesigner } from './unifiedClient';
export function useUnifiedDesigner(accountId: string, setTasks: Dispatch<SetStateAction<Task[]>>, setEvents: Dispatch<SetStateAction<FlowEvent[]>>) {
    const refresh = useCallback(async () => {
        const result = await unifiedRequest<SharedDesigner>('designer');
        setTasks(current => { const next = [...current.filter(t => !t.sharedBusiness), ...result.tasks]; return JSON.stringify(current) === JSON.stringify(next) ? current : next; });
        setEvents(current => { const next = [...current.filter(e => e.source !== 'isolated-shared'), ...result.events]; return JSON.stringify(current) === JSON.stringify(next) ? current : next; });
        return result;
    }, [accountId, setTasks, setEvents]);
    useEffect(() => { let alive = true; const sync = () => { if (alive && !document.hidden)
        void refresh().catch(() => { }); }; sync(); const timer = window.setInterval(sync, 8000); window.addEventListener('focus', sync); return () => { alive = false; window.clearInterval(timer); window.removeEventListener('focus', sync); }; }, [refresh]);
    return refresh;
}
