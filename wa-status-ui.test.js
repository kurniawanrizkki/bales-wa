const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('public/dashboard.html', 'utf8');
const code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
const elements = new Map();
const el = id => { if (!elements.has(id)) elements.set(id, {classList:{add(){}}, hidden:false}); return elements.get(id); };
let state = 'STARTING', timer, reads = 0;
const context = {
 document:{querySelector:el}, location:{}, confirm:()=>false,
 renderActivation(){}, setTimeout(fn,ms){ if(ms===2000) timer=fn; },
 fetch:async url=>({ok:true,status:200,json:async()=>url==='/api/wa/status'?(reads++,{status:state,qrCode:'data:image/png;base64,test'}):{profile:{},products:[]}})
};
(async()=>{
 vm.runInNewContext(code,context);
 await new Promise(setImmediate);
 assert.equal(el('#waBadge').textContent,'Menyiapkan');
 assert.equal(typeof timer,'function','WhatsApp status must refresh automatically');
 state='QR_READY'; await timer();
 assert.equal(el('#qr').hidden,false);
 assert.equal(el('#waBadge').textContent,'Scan QR');
 state='READY'; await timer();
 assert.equal(el('#ready').hidden,false);
 assert.equal(el('#qr').hidden,true);
 assert.equal(el('#waBadge').textContent,'Terhubung');
 assert.equal(reads,3);
 console.log('PASS: STARTING → QR_READY → READY refreshed without reload');
})().catch(e=>{console.error(e);process.exitCode=1});
