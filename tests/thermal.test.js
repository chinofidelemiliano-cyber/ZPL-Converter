import test from 'node:test';
import assert from 'node:assert/strict';
import {applyPrintSettings} from '../converter.js';
import {buildEditorJob} from '../jobs.js';
const label='^XA\n^PW100\n^LL50\n^FO0,0^A0N,20,12^FDHola^FS\n^XZ';
test('default thermal settings preserve printer configuration',()=>{
 const output=applyPrintSettings(label);assert.ok(!output.includes('~SD'));assert.ok(!output.includes('^MT'));assert.ok(!output.includes('^MM'));
});
test('heat is absolute darkness and resets any relative darkness offset',()=>{
 for(const darkness of [0,15,30]){const result=applyPrintSettings(label,1,'',{darkness});assert.ok(result.startsWith('~SD'+darkness+'\n^XA'));assert.ok(result.includes('^MD0'));}
 for(const darkness of [-1,31,15.5,NaN])assert.throws(()=>applyPrintSettings(label,1,'',{darkness}));
});
test('direct thermal and ribbon transfer use MT commands',()=>{
 assert.ok(applyPrintSettings(label,1,'',{method:'direct'}).includes('^MTD'));
 assert.ok(applyPrintSettings(label,1,'',{method:'transfer',ribbon:'wax'}).includes('^MTT'));
 assert.throws(()=>applyPrintSettings(label,1,'',{method:'direct',ribbon:'resin'}));
});
test('ribbon chemistry is a consumable reference, not an invented ZPL command',()=>{
 assert.equal(applyPrintSettings(label,1,'',{method:'transfer',ribbon:'wax'}),applyPrintSettings(label,1,'',{method:'transfer',ribbon:'resin'}));
});
test('handling mode emits only selected native MM value',()=>{
 for(const [handling,code] of [['tear','T'],['peel','P'],['rewind','R'],['cutter','C']])assert.ok(applyPrintSettings(label,1,'',{handling}).includes('^MM'+code));
 assert.throws(()=>applyPrintSettings(label,1,'',{handling:'^XA'}));
});
test('thermal settings reach each label of a consecutive job',()=>{
 const element={type:'barcode',x:1,y:1,w:40,h:15,numberMode:'sequence',sequenceStart:'1',sequenceStep:'1',sequenceCount:3,sequencePad:4};
 const output=buildEditorJob([{element,command:''}],800,400,203,2,'A','gap',{method:'transfer',darkness:12,ribbon:'wax-resin',handling:'tear'}).zpl;
 assert.equal(output.split('~SD12').length-1,3);assert.equal(output.split('^MTT').length-1,3);assert.equal(output.split('^PQ2').length-1,3);assert.ok(!output.includes('^GFA'));
});
