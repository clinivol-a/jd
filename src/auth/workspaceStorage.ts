/** Per-account UI persistence. It is not an authorization boundary for production data. */
export function accountStorage(storage:Storage,id:string):Storage {
 const prefix=`clinivol-account-data:${id}:`
 if(id==='chen-yu'&&!storage.getItem(prefix+'legacy-migrated')){
  const keys=Array.from({length:storage.length},(_,i)=>storage.key(i)).filter((key):key is string=>!!key&&(key.startsWith('clinivol-')||key.startsWith('project-'))&&!key.startsWith('clinivol-account-')&&!['clinivol-theme-preference','clinivol-session-profile'].includes(key)&&!key.startsWith('clinivol-auth'))
  for(const key of keys){const value=storage.getItem(key);if(value!==null&&storage.getItem(prefix+key)===null)storage.setItem(prefix+key,value)}
  storage.setItem(prefix+'legacy-migrated','1')
 }
 return {get length(){return Array.from({length:storage.length},(_,i)=>storage.key(i)).filter(key=>key?.startsWith(prefix)).length},key(index){return Array.from({length:storage.length},(_,i)=>storage.key(i)).filter((key):key is string=>!!key&&key.startsWith(prefix))[index]?.slice(prefix.length)??null},getItem(key){return storage.getItem(prefix+key)},setItem(key,value){storage.setItem(prefix+key,value)},removeItem(key){storage.removeItem(prefix+key)},clear(){const keys=Array.from({length:this.length},(_,i)=>this.key(i));keys.forEach(key=>key&&this.removeItem(key))}}
}
