const visits=new Map<string,string>();
/** Reload reuses an access session; a new navigation/tab starts another. StrictMode remains idempotent. */
export function shareVisitId(token:string){
  const cached=visits.get(token);if(cached)return cached;
  const key=`clinivol-share-visit:${token}`;
  let id:string|null=null;
  try{if((performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined)?.type==='reload')id=sessionStorage.getItem(key)}catch{}
  id ||= crypto.randomUUID();visits.set(token,id);try{sessionStorage.setItem(key,id)}catch{}
  return id;
}
