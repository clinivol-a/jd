import {Button} from 'tdesign-react';
import {ChevronLeftIcon} from './design-system/tdesign';
export function PageBack({label,onBack,className='',...props}:{label:string;onBack:()=>void;className?:string;'aria-label'?:string}){return <div className="page-back-row"><Button {...props} className={'page-back '+className} variant="text" size="medium" theme="default" icon={<ChevronLeftIcon size={16}/>} onClick={onBack}>{label}</Button></div>}
