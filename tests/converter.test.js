import test from 'node:test';
import assert from 'node:assert/strict';
import {rasterToZpl} from '../converter.js';
const pixels=(...values)=>new Uint8ClampedArray(values.flatMap(v=>[v,v,v,255]));
test('packs black pixels most significant bit first and pads rows white',()=>{
 const r=rasterToZpl(pixels(0,255,0,255,0,255,0,255,0),9,1);
 assert.deepEqual([...r.bytes],[0xAA,0x80]);assert.match(r.zpl,/\^GFA,2,2,2,AA80/);assert.match(r.zpl,/\^PW9\n\^LL1/);
});
test('starts each row at a byte boundary',()=>assert.deepEqual([...rasterToZpl(pixels(0,255),1,2).bytes],[128,0]));
test('composites transparency onto white',()=>assert.deepEqual([...rasterToZpl(new Uint8ClampedArray([0,0,0,0]),1,1).bytes],[0]));
test('inverts image and produces opaque preview',()=>{const r=rasterToZpl(pixels(0,255),2,1,128,true);assert.deepEqual([...r.bytes],[64]);assert.deepEqual([...r.preview],[255,255,255,255,0,0,0,255]);});
test('rejects invalid dimensions',()=>assert.throws(()=>rasterToZpl(pixels(0),2,1)));
test('dithering preserves middle gray as a mix of black and white',()=>{
 const data=new Uint8ClampedArray(32*32*4);for(let i=0;i<data.length;i+=4){data[i]=data[i+1]=data[i+2]=128;data[i+3]=255;}
 const r=rasterToZpl(data,32,32,128,false,'dither');const black=[...r.preview].filter((v,i)=>i%4===0&&v===0).length;
 assert.ok(black>450&&black<575);assert.ok(r.bytes.some(b=>b!==0&&b!==255));
});
test('dithering keeps pure white and pure black unchanged',()=>{
 assert.deepEqual([...rasterToZpl(pixels(0,0,255,255),4,1,128,false,'dither').bytes],[192]);
});
test('dither density increases with threshold',()=>{
 const data=pixels(...Array(256).fill(128));const count=t=>[...rasterToZpl(data,16,16,t,false,'dither').preview].filter((v,i)=>i%4===0&&v===0).length;
 assert.ok(count(180)>count(80));
});
