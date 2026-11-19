import {readFileSync} from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {salesDemoPlugin} from './server/sales-demo.mjs'
import {businessDesignPlugin} from './server/business/plugin.mjs'
import tailwindcss from '@tailwindcss/vite'

const devPort=Number(process.env.CV_DEV_PORT||5210)
const authOrigin=process.env.CV_AUTH_ORIGIN||'http://127.0.0.1:5211'
export default defineConfig({
  plugins: [react(), tailwindcss(), salesDemoPlugin({authOrigin}), businessDesignPlugin({authOrigin,lan:process.env.CV_ADMIN_LOCAL!=='1'})],
  server: { port: devPort, strictPort: true, proxy: { ...(process.env.CV_ADMIN_LOCAL==='1'?{'/api/admin':{target:authOrigin}}:{}), '/api/auth': {target:authOrigin,configure(proxy){proxy.on('proxyReq',(proxyReq,req)=>{proxyReq.removeHeader('X-CliniVol-Dev-Console');if(req.url?.startsWith('/api/auth/dev/')&&['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress||'')&&['127.0.0.1:'+devPort,'localhost:'+devPort].includes(req.headers.host||'')){try{proxyReq.setHeader('X-CliniVol-Dev-Console',readFileSync(new URL('./.local/auth/dev-console-key',import.meta.url),'utf8').trim())}catch{/* Backend rejects requests until explicitly enabled. */}}})}} } },
})
