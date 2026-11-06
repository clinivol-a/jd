import {networkInterfaces} from 'node:os'
import {spawn} from 'node:child_process'
const candidates=Object.entries(networkInterfaces()).filter(([name])=>!name.startsWith('utun')).flatMap(([,values])=>values||[]).filter(v=>v.family==='IPv4'&&!v.internal&&/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(v.address))
const address=candidates.find(v=>v.address.startsWith('192.168.'))?.address||candidates[0]?.address
const child=spawn(process.execPath,['server/auth/http.mjs'],{stdio:'inherit',env:{...process.env,AUTH_MODE:'local',AUTH_TEST_SMS:'1',AUTH_DEV_CONSOLE:'1',AUTH_DEMO_MODE:'1',AUTH_SCAN_ORIGIN:address?`http://${address}:5212`:''}})
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal))
child.on('exit',code=>process.exit(code||0))
