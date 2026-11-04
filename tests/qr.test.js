import test from 'node:test';
import assert from 'node:assert/strict';
import {makeQr,qrContent} from '../qr.js';
import {applyPrintSettings,rasterToZpl} from '../converter.js';
test('QR supports URLs, Unicode, and standard finder patterns',()=>{
 for(const text of ['https://converterzpl.netlify.app','Café y té ☕']){
  const qr=makeQr(text,text.startsWith('https:'));
  assert.equal((qr.size-21)%4,0);
  for(const [r,c] of [[0,0],[0,qr.size-7],[qr.size-7,0]]){
   for(let y=0;y<7;y++)for(let x=0;x<7;x++)assert.equal(qr.dark(r+y,c+x),y===0||y===6||x===0||x===6||(y>=2&&y<=4&&x>=2&&x<=4));
  }
 }
});
test('QR rejects empty, overly long, and non-web links',()=>{
 for(const link of ['','not a web link','javascript:alert(1)','file:///tmp/test'])assert.throws(()=>makeQr(link,true));
 assert.throws(()=>makeQr('A'.repeat(1001)));
});
test('QR matrix changes with content',()=>{
 const a=makeQr('https://example.com/a',true),b=makeQr('https://example.com/b',true);
 assert.ok(Array.from({length:a.size},(_,r)=>Array.from({length:a.size},(_,c)=>a.dark(r,c)!==b.dark(r,c))).flat().some(Boolean));
});
test('print quantity and speed are encoded as ZPL commands',()=>{
 const zpl=rasterToZpl(new Uint8ClampedArray([0,0,0,255]),1,1).zpl;
 assert.match(applyPrintSettings(zpl,12,4),/^\^XA\n\^PR4\n/);
 assert.match(applyPrintSettings(zpl,12,4),/\^PQ12\n\^XZ$/);
 assert.ok(!applyPrintSettings(zpl).includes('^PR'));
 for(const [copies,speed] of [[0,3],[1.5,3],[10000,3],[1,15],[1,1.5],[NaN,3]])assert.throws(()=>applyPrintSettings(zpl,copies,speed));
});

test('bare website addresses get HTTPS in preview and export payload',()=>{assert.equal(qrContent('example.com/path',true),'https://example.com/path');assert.equal(qrContent(' https://example.com ',true),'https://example.com');});
