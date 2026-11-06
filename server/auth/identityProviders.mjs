import {AuthFailure} from './service.mjs'
// Provider adapters are injected server-side, never supplied by a browser payload.
// A production adapter must verify OAuth code/state and signature/audience before returning a subject.
export class IdentityProviders {
 constructor(adapters={}){this.adapters=adapters}
 async start(provider,context){const adapter=this.adapters[provider];if(!adapter?.start)throw new AuthFailure(`${provider==='wecom'?'企业微信':'微信'}官方认证尚未配置。`,503);return adapter.start(context)}
 async verify(provider,callback,context){const adapter=this.adapters[provider];if(!adapter?.verify)throw new AuthFailure('官方身份核验服务尚未配置。',503);const identity=await adapter.verify(callback,context);if(!identity?.subject||identity.provider!==provider)throw new AuthFailure('官方身份验证失败。',401);return identity}
}
