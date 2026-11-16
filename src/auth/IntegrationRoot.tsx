import {PublicOrderResults} from '../sales/business/OrderResults';
import '../sales/business/business.css';
import {lazy,Suspense,useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react'
import {Button,Dialog,Input,Tag} from 'tdesign-react'
import App from '../App'
import AuthPages,{ScanPhonePage} from './AuthPages'
import {AuthContext} from './AuthContext'
import {authRequest} from './client'
import type {Session} from './client'
import SalesWorkspace from '../sales/SalesWorkspace'
import {SalesInvitePage} from '../sales/SalesInvite'
import {roleName,AccountAvatar} from './AccountMenu'
const DevConsole=(import.meta.env.DEV||import.meta.env.VITE_PRESENTATION_DEMO==='1')?lazy(()=>import('./DevConsole')):null
const empty:Session={user:null,candidate:null,accounts:[],locked:false,capabilities:{wechat:false,sms:false,scan:false,mode:'unavailable'}}
async function flushWorkspace(){const checks:Promise<boolean>[]=[];window.dispatchEvent(new CustomEvent('clinivol-before-account-change',{detail:{checks}}));if((await Promise.all(checks)).some(v=>!v))throw new Error('工程尚未保存成功，请先处理保存错误。')}
export default function IntegrationRoot(){const [session,setSession]=useState<Session>(empty),[loading,setLoading]=useState(true),[error,setError]=useState(''),[route,setRoute]=useState(location.hash),[logoutOpen,setLogoutOpen]=useState(false),[unlock,setUnlock]=useState(''),[lockError,setLockError]=useState(''),[lockBusy,setLockBusy]=useState(false);const sessionRef=useRef(session);sessionRef.current=session
 const accept=useCallback((next:Session,keepRoute=false)=>{const previous=sessionRef.current.user;const scan=location.hash.startsWith('#scan/');if(previous&&previous.id!==next.user?.id&&!location.hash.startsWith('#auth/')&&!scan)sessionStorage.setItem(`clinivol-auth-route:${previous.id}`,location.hash);if(!scan&&!keepRoute){if(next.user&&(!previous||previous.id!==next.user.id||location.hash.startsWith('#auth/')))history.replaceState(null,'',sessionStorage.getItem(`clinivol-auth-route:${next.user.id}`)||'#home');else if(!next.user&&next.candidate)history.replaceState(null,'','#auth/status');else if(!next.user&&!location.hash.startsWith('#auth/'))history.replaceState(null,'','#auth/wechat')};sessionRef.current=next;setSession(next);setError('');setRoute(location.hash)},[])
 const refresh=useCallback(async()=>{try{const next=await authRequest<Session>('session');accept(next,location.hash.startsWith('#auth/'))}catch(e){setError((e as Error).message);setSession(empty)}finally{setLoading(false)}},[accept])
 useEffect(()=>{void refresh();const interval=setInterval(()=>void refresh(),30000);const hash=()=>setRoute(location.hash);const logout=()=>setLogoutOpen(true);window.addEventListener('hashchange',hash);window.addEventListener('popstate',hash);window.addEventListener('clinivol-request-logout',logout);const channel=new BroadcastChannel('clinivol-auth-session');channel.onmessage=()=>void refresh();return()=>{clearInterval(interval);channel.close();window.removeEventListener('hashchange',hash);window.removeEventListener('popstate',hash);window.removeEventListener('clinivol-request-logout',logout)}},[refresh])
 const announce=()=>{const c=new BroadcastChannel('clinivol-auth-session');c.postMessage('changed');c.close()}
 const perform=async(action:string,body:unknown)=>{await flushWorkspace();accept(await authRequest(action,body));announce()}
 const auth={session,user:session.user,loading,error,refresh,accept:(s:Session)=>{accept(s);announce()},switchAccount:async(id:string)=>perform('switch',{accountId:id}),logout:async()=>perform('logout',{}),addAccount:()=>{void flushWorkspace().then(()=>{if(session.user)sessionStorage.setItem(`clinivol-auth-route:${session.user.id}`,location.hash);location.hash='auth/wechat'}).catch(e=>setError(e.message))},lock:async()=>{accept(await authRequest('lock',{}));announce()},unlock:async(password:string)=>{accept(await authRequest('unlock',{password}));announce()},updateProfile:async(profile:{name:string;email:string;avatar?:string})=>{accept(await authRequest('profile',profile));announce()}}
 useEffect(()=>{const stored=localStorage.getItem('clinivol-theme-preference');const dark=stored==='dark'||stored==='system'&&matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.setAttribute('theme-mode',dark?'dark':'light');document.documentElement.dataset.theme=dark?'dark':'light'},[])
 useLayoutEffect(()=>{document.documentElement.dataset.authScreen=String(!session.user||route.startsWith('#auth/')||route.startsWith('#scan/'));return()=>{delete document.documentElement.dataset.authScreen}},[session.user?.id,route])
 if(import.meta.env.DEV&&location.pathname==='/order-results')return <PublicOrderResults/>
 if((import.meta.env.DEV||import.meta.env.VITE_PRESENTATION_DEMO==='1')&&location.pathname==='/sales-invite')return <SalesInvitePage/>
 if(loading)return <div className="auth-initial-loading">正在校验登录状态…</div>
 const user=session.user
 return <AuthContext.Provider value={auth}>{route.startsWith('#scan/')?<ScanPhonePage/>:!user||route.startsWith('#auth/')?<AuthPages route={route}/>:user.role==='designer'?<App key={user.id}/>:<SalesWorkspace key={user.id}/>}
 {DevConsole&&(!user||route.startsWith('#auth/'))&&<Suspense fallback={null}><DevConsole/></Suspense>}
 <Dialog visible={logoutOpen} header="退出登录" confirmBtn="退出登录" cancelBtn="取消" onClose={()=>setLogoutOpen(false)} onConfirm={()=>void auth.logout().then(()=>setLogoutOpen(false)).catch(e=>setError(e.message))}>确定要退出当前账号吗？{error&&<p role="alert">{error}</p>}</Dialog>
 {user&&session.locked&&!route.startsWith('#auth/')&&<div className="lock-screen"><form className="lock-panel auth-integration-lock" onSubmit={e=>{e.preventDefault();setLockBusy(true);setLockError('');void auth.unlock(unlock).then(()=>setUnlock('')).catch(e=>setLockError(e.message)).finally(()=>setLockBusy(false))}}><img className="auth-lock-brand" src={`/assets/clinivol-logo-${document.documentElement.getAttribute('theme-mode')==='dark'?'dark':'light'}.png`} alt="科立沃"/><div className="auth-lock-person"><AccountAvatar account={user} size={58}/><h2>已锁定</h2><p>{user.name} · {roleName(user)}</p><Tag theme="warning" variant="light">当前账号处于锁定状态</Tag></div><div className="auth-lock-input"><Input type="password" value={unlock} onChange={v=>{setUnlock(v);setLockError('')}} placeholder={session.capabilities.demoUnlock?'请输入任意非空数字':'请输入账号密码'} status={lockError?'error':undefined} tips={lockError||undefined}/></div><Button theme="primary" block type="submit" loading={lockBusy}>解锁并返回</Button></form></div>}
 </AuthContext.Provider>
}