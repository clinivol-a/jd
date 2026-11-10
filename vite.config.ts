import {readFileSync} from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {salesDemoPlugin} from './server/sales-demo.mjs'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss(), salesDemoPlugin()],
  server: { port: 5210, strictPort: true, proxy: { '/api/auth': {target:'http://127.0.0.1:5211',configure(proxy){proxy.on('proxyReq',(proxyReq,req)=>{proxyReq.removeHeader('X-CliniVol-Dev-Console');if(req.url?.startsWith('/api/auth/dev/')&&['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress||'')&&/^(127\.0\.0\.1|localhost):5210$/.test(req.headers.host||'')){try{proxyReq.setHeader('X-CliniVol-Dev-Console',readFileSync(new URL('./.local/auth/dev-console-key',import.meta.url),'utf8').trim())}catch{/* Backend rejects requests until explicitly enabled. */}}})}} } },
})
