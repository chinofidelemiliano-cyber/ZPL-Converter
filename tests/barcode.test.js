import test from 'node:test';
import assert from 'node:assert/strict';
import {code39} from '../barcode.js';
test('Code 39 includes start/stop symbols, integer modules and quiet zones',()=>{
 const r=code39('A');assert.equal(r.bars.length,15);assert.equal(r.bars[0].x,10);assert.equal(r.modules,67);
 assert.ok(r.bars.every(b=>b.width===1||b.width===3));assert.equal(r.modules-(r.bars.at(-1).x+r.bars.at(-1).width),10);
});
test('Code 39 rejects unsupported input instead of making an invalid symbol',()=>{
 for(const text of ['', 'abc','ñ','ABC*','A'.repeat(41)])assert.throws(()=>code39(text));
});
