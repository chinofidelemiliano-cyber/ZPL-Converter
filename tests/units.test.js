import test from 'node:test';
import assert from 'node:assert/strict';
import {toMm,fromMm} from '../units.js';
import {fontById,fonts} from '../fonts.js';
test('inch dimensions produce exact printer dots at standard resolutions',()=>{
 assert.equal(toMm(4,'in'),101.6);assert.ok(Math.abs(toMm(6,'in')-152.4)<1e-10);
 for(const dpi of [203,300,600])assert.equal(Math.round(toMm(4,'in')*dpi/25.4),4*dpi);
});
test('unit round trips preserve physical size',()=>{for(const mm of [.1,1,5,25.4,100,200,300])assert.ok(Math.abs(toMm(fromMm(mm,'in'),'in')-mm)<1e-10);});
test('millimeter mode leaves values unchanged',()=>assert.equal(toMm(100,'mm'),100));
test('font catalog has unique choices and a safe default',()=>{assert.equal(new Set(fonts.map(f=>f.id)).size,fonts.length);assert.equal(fontById('missing'),fonts[0]);assert.ok(fonts.every(f=>fontById(f.id).family===f.family));});
