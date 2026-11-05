import {createContext,useContext,useMemo} from 'react'
import type {AuthAccount,Session} from './client'
import {accountStorage} from './workspaceStorage'
export type AuthController={session:Session;user:AuthAccount|null;loading:boolean;error:string;refresh:()=>Promise<void>;accept:(s:Session)=>void;switchAccount:(id:string)=>Promise<void>;logout:()=>Promise<void>;addAccount:()=>void;lock:()=>Promise<void>;unlock:(password:string)=>Promise<void>;updateProfile:(profile:{name:string;email:string;avatar?:string})=>Promise<void>}
export const AuthContext=createContext<AuthController|null>(null)
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('AuthContext required');return value}
export function useWorkspaceStorage(){const {user}=useAuth();return useMemo(()=>accountStorage(localStorage,user?.id??'unauthenticated'),[user?.id])}
