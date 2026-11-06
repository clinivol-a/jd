// Client-side validation; the authentication service independently enforces password and directory checks.
export function validPassword(value:string){return value.length>=8&&value.length<=64&&/[A-Za-z]/.test(value)&&/\d/.test(value)}
export function passwordFieldErrors(password:string,confirm:string){
 const errors:Record<string,string>={}
 if(!validPassword(password))errors.password='密码须为8–64位，且包含字母和数字。'
 if(!confirm)errors.confirm='请确认登录密码。'
 else if(confirm!==password)errors.confirm='两次输入的密码不一致。'
 return errors
}
export function basicFieldErrors(name:string,role:string,organizationId:string){
 const errors:Record<string,string>={}
 if(!name.trim())errors.name='请输入真实姓名'
 if(!role)errors.role='请选择申请岗位'
 if(!organizationId)errors.org='请选择所属单位'
 return errors
}
export function validatePasswordPair(password:string,confirm:string){const first=Object.values(passwordFieldErrors(password,confirm))[0];if(first)throw new Error(first)}
