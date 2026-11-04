import test from 'node:test';
import assert from 'node:assert/strict';
import {guidedLayout} from '../guided.js';
import {nativeElement} from '../native.js';
const qr={type:'url',id:1,x:5,y:5,w:25,h:25,text:'example.com',autoLayout:true};
test('QR automatically fits a small square label',()=>{
 const {element}=guidedLayout(qr,25,25,203);
 assert.ok(element.x+element.w<=25&&element.y+element.h<=25);
 const code=nativeElement(element,203,200,200);assert.ok(code.includes('^BQ'));assert.ok(code.includes('^FDMA,https://example.com'));assert.ok(!code.includes('^GF'));
});
test('optional caption is wrapped and placed below QR without overlap',()=>{
 const {element,caption}=guidedLayout({...qr,captionEnabled:true,captionText:'Visita mi página',captionSize:3},40,40,203);
 assert.ok(caption.y>=element.y+element.h);assert.ok(caption.y+caption.size*1.2<=40);
 assert.ok(nativeElement(caption,203,320,320).includes('^A0N'));
});
test('manual positions are preserved and insufficient caption space is reported',()=>{
 const {element}=guidedLayout({...qr,autoLayout:false},100,50,203);assert.equal(element.x,5);assert.equal(element.w,25);
 assert.throws(()=>guidedLayout({...qr,captionEnabled:true,captionText:'A'.repeat(160),captionSize:20},20,20,203));
});
