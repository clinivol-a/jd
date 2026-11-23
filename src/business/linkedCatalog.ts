import type {SharedDesigner} from './unifiedClient';
/** Business cache only. Original engineering persistence remains untouched for rollback. */
export const linkedCatalogKey='unified-linked-designer-v1';
export function linkedDesignerCache(storage:Storage):SharedDesigner|null {
 try {const value=JSON.parse(storage.getItem(linkedCatalogKey)||'null');return value?.catalogMode==='linked-only'&&Array.isArray(value.tasks)&&Array.isArray(value.events)?value:null;} catch{return null;}
}
