import test from 'node:test';
import assert from 'node:assert/strict';
import {parseZpl,decodeField,decodeGraphic} from '../zpl-parser.js';
import {nativeElement,nativeLabel} from '../native.js';
import {rasterToZpl} from '../converter.js';
test('native text and QR export round trips through pasted-code parser',()=>{
 const base={x:5,y:5,w:25,h:25,size:5,font:'arial'};
 const zpl=nativeLabel([nativeElement({...base,type:'text',text:'Café ^XZ'},203,800,400),nativeElement({...base,type:'url',text:'https://example.com'},203,800,400)],800,400);
 const result=parseZpl(zpl);assert.equal(result.labels.length,1);assert.equal(result.labels[0].fields[0].data,'Café ^XZ');assert.equal(result.labels[0].fields[1].kind,'qr');assert.equal(result.labels[0].fields[1].data,'MA,https://example.com');
});
test('native graphics round trip without interpreting image hex as commands',()=>{
 const label=parseZpl(rasterToZpl(new Uint8ClampedArray([0,0,0,255,255,255,255,255]),2,1).zpl).labels[0];
 assert.equal(label.fields[0].kind,'graphic');assert.deepEqual([...decodeGraphic(label.fields[0].data,label.fields[0].total,label.fields[0].rowBytes)],[128]);
});
test('ASCII compression, blank rows, and repeated rows decode correctly',()=>{
 assert.deepEqual([...decodeGraphic('J0',2,1)],[0,0]);assert.deepEqual([...decodeGraphic('FF:',2,1)],[255,255]);assert.deepEqual([...decodeGraphic(',,',2,1)],[0,0]);assert.deepEqual([...decodeGraphic('!!',2,1)],[255,255]);
 assert.throws(()=>decodeGraphic(':Z64:AAAA:0000',1,1));assert.throws(()=>decodeGraphic('FF',2,1));
});
test('stored graphics, offsets, and multiple labels are parsed',()=>{
 const labels=parseZpl('~DGR:A.GRF,1,1,80^XA^PW100^LL100^LH10,20^FO2,3^XGR:A.GRF,2,2^FS^XZ^XA^PW80^LL50^FO0,0^A0N,20,12^FDHola^FS^XZ').labels;
 assert.equal(labels.length,2);assert.deepEqual([labels[0].fields[0].x,labels[0].fields[0].y],[12,23]);assert.equal(labels[0].fields[0].scaleX,2);assert.equal(labels[1].fields[0].data,'Hola');
});
test('unsupported commands and assumed dimensions are disclosed',()=>{
 const label=parseZpl('^XA^FO0,0^FR^FDText^FS^XZ').labels[0];assert.ok(label.warnings.some(w=>w.includes('FR')));assert.ok(label.warnings.some(w=>w.includes('800')));
 assert.throws(()=>parseZpl('^XA^FDText'));assert.throws(()=>parseZpl('^XA^PW100000^LL100000^XZ'));assert.equal(decodeField('_C3_A9','_',28),'é');
});
