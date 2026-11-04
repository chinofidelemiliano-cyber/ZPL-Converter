import test from 'node:test';
import assert from 'node:assert/strict';
import {printerModels,profileById,validatePrinter,customProfile} from '../printers.js';
test('catalog has distinct model identities and keeps unverified capabilities unknown',()=>{
 assert.ok(printerModels.length>100);assert.equal(new Set(printerModels.map(p=>p.id)).size,printerModels.length);
 assert.equal(profileById('z4m').maxWidth,104);assert.equal(profileById('z4m').maxSpeed,null);assert.equal(profileById('zq112').dpi,null);
});
test('selected printer constrains resolution, printable width, and speed where known',()=>{
 const model=profileById('zd220');validatePrinter(model,{width:100,dpi:203,speed:'A'});
 for(const config of [{width:105,dpi:203,speed:''},{width:100,dpi:600,speed:''},{width:100,dpi:203,speed:'E'}])assert.throws(()=>validatePrinter(model,config));
 assert.throws(()=>validatePrinter(profileById('zc300'),{width:100,dpi:203,speed:''}));
});
test('custom profile supports unlisted models without inventing printer data',()=>{
 const profile=customProfile({name:'Mi modelo',dpi:'300',maxWidth:'120',maxSpeed:'',zpl:'unknown'});
 assert.equal(profile.maxSpeed,null);assert.equal(profile.zpl,null);assert.deepEqual(profile.dpi,[300]);
 for(const patch of [{dpi:'72'},{maxWidth:1000},{maxSpeed:99}])assert.throws(()=>customProfile({name:'Test',dpi:203,maxWidth:100,maxSpeed:'',zpl:'yes',...patch}));
});
