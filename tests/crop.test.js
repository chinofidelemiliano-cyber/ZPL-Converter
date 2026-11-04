import test from 'node:test';
import assert from 'node:assert/strict';
import {centeredCrop,fitCrop,moveCrop,zoomCrop,resizeCrop} from '../crop.js';
const inside=(c,w,h,ratio)=>{assert.ok(c.width>0&&c.height>0);assert.ok(c.x>=-1e-8&&c.y>=-1e-8&&c.x+c.width<=w+1e-8&&c.y+c.height<=h+1e-8);assert.ok(Math.abs(c.width/c.height-ratio)<1e-8);};
test('initial selection follows label proportions and is centered',()=>{
 assert.deepEqual(centeredCrop(240,120,1),{x:60,y:0,width:120,height:120});
 assert.deepEqual(centeredCrop(100,200,2),{x:0,y:75,width:100,height:50});
});
test('moving or zooming never selects pixels outside the original image',()=>{
 const initial=centeredCrop(240,120,1),small=zoomCrop(initial,.8,240,120);
 assert.equal(small.width,96);assert.equal(small.x,72);
 const moved=moveCrop(small,-100,999,240,120);inside(moved,240,120,1);assert.equal(moved.x,0);assert.equal(moved.y,24);
 inside(zoomCrop(moved,100,240,120),240,120,1);
});
test('corner resize preserves the opposite anchor and label aspect ratio',()=>{
 const crop={x:20,y:20,width:100,height:50};
 const result=resizeCrop(crop,'se',{x:80,y:50},200,100);inside(result,200,100,2);assert.equal(result.x,20);assert.equal(result.y,20);assert.equal(result.width,60);
 for(const corner of ['nw','ne','sw','se'])for(const point of [{x:-100,y:-100},{x:300,y:200},{x:100,y:50}])inside(resizeCrop(crop,corner,point,200,100),200,100,2);
});
test('changing label dimensions adapts the crop while preserving its center where possible',()=>{
 const crop={x:60,y:20,width:80,height:80};const changed=fitCrop(crop,240,120,2);inside(changed,240,120,2);assert.ok(Math.abs(changed.x+changed.width/2-100)<1e-8);assert.ok(Math.abs(changed.y+changed.height/2-60)<1e-8);
 assert.throws(()=>centeredCrop(0,10,1));assert.throws(()=>centeredCrop(10,10,NaN));
});
