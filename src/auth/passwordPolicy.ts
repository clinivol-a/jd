// Shared client validation; the authentication service independently enforces the same policy.
export function validPassword(value:string){return value.length>=8&&value.length<=64&&/[A-Za-z]/.test(value)&&/\d/.test(value)}
export function validatePasswordPair(password:string,confirm:string){
 if(!validPassword(password))throw new Error('密码须为8–64位，包含字母和数字。')
 if(!confirm||password!==confirm)throw new Error('两次输入的密码不一致。')
}
