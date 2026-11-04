import test from 'node:test';
import assert from 'node:assert/strict';
import {alignedPosition,clampPosition,hitTest} from '../positioning.js';
test('alignment positions the selected object at center and label corners',()=>{
 const item={width:20,height:10},label={width:100,height:50};
 assert.deepEqual(alignedPosition(item,label,'center','center'),{x:40,y:20});
 assert.deepEqual(alignedPosition(item,label,'left','top'),{x:0,y:0});
 assert.deepEqual(alignedPosition(item,label,'right','bottom'),{x:80,y:40});
});
test('manual moves stay inside printable bounds',()=>{
 assert.deepEqual(clampPosition(-20,200,{width:20,height:10},{width:100,height:50}),{x:0,y:40});
 assert.deepEqual(clampPosition(10,10,{width:200,height:100},{width:100,height:50}),{x:0,y:0});
});
test('pointer selection chooses the topmost element and can select captions',()=>{
 const items=[{id:1,x:0,y:0,width:20,height:20},{id:-1,x:10,y:10,width:10,height:10}];
 assert.equal(hitTest(items,15,15).id,-1);assert.equal(hitTest(items,2,2).id,1);assert.equal(hitTest(items,40,40),undefined);
});
