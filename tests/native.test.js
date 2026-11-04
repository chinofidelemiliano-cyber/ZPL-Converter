import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeElement,nativeLabel,fieldData,graphicField} from '../native.js';
import {rasterToZpl} from '../converter.js';
const base={x:5,y:5,w:40,h:15,size:5,line:.4,font:'arial',bold:false};
const make=e=>nativeElement({...base,...e},203,800,400);
test('text uses native font and field commands, not a graphic',()=>{
 const field=make({type:'text',text:'Café'});const zpl=nativeLabel([field],800,400);
 assert.match(zpl,/\^PW800\n\^LL400/);assert.match(zpl,/\^A0N,40,24/);assert.match(zpl,/\^FO40,40/);assert.match(zpl,/\^CI28/);assert.match(zpl,/\\C3\\A9/);assert.ok(!zpl.includes('^GF'));
});
test('data cannot inject ZPL commands and line breaks create separate fields',()=>{
 const field=make({type:'text',text:'^XZ~JA\\\nsecond'});
 assert.ok(!field.includes('^XZ'));assert.ok(!field.includes('~JA'));assert.equal((field.match(/\^FD/g)||[]).length,2);assert.equal(fieldData('^'),'\\5E');
});
test('barcode, QR, and box use their own commands',()=>{
 assert.match(make({type:'barcode',text:'ABC123'}),/\^BY\d+,3,\d+\n\^B3/);
 assert.match(make({type:'qr',text:'Texto',w:25}),/\^BQN,2,\d+/);
 assert.match(make({type:'url',text:'https://example.com',w:25}),/\^FDMA,/);
 assert.match(make({type:'box'}),/\^GB320,120,3,B,0/);
 for(const type of ['text','barcode','qr','url'])assert.ok(!make({type,text:type==='url'?'https://example.com':'ABC123',w:25}).includes('^GF'));
});
test('mixed labels include GFA only for the image and keep text native',()=>{
 const bitmap=rasterToZpl(new Uint8ClampedArray([0,0,0,255]),1,1);
 const image=graphicField(bitmap.zpl,15,20),text=make({type:'text',text:'Hello'}),label=nativeLabel([text,image],800,400);
 assert.equal((label.match(/\^GFA/g)||[]).length,1);assert.match(label,/\^FO15,20\n\^GFA/);assert.match(label,/\^A0N/);assert.equal((label.match(/\^XA/g)||[]).length,1);
});
test('fonts and simulated bold remain native',()=>{
 assert.match(make({type:'text',text:'Hello',font:'mono'}),/\^AHN/);
 assert.equal((make({type:'text',text:'Hello',bold:true}).match(/\^FD/g)||[]).length,2);
});
