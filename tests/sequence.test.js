import test from 'node:test';
import assert from 'node:assert/strict';
import {barcodeContent,sequenceCount} from '../sequence.js';
import {buildEditorJob} from '../jobs.js';
import {nativeElement} from '../native.js';
import {applyPrintSettings} from '../converter.js';
const seq={type:'barcode',x:5,y:5,w:70,h:15,text:'',numberMode:'sequence',sequenceStart:'1',sequenceStep:'1',sequenceCount:3,sequencePad:4,sequencePrefix:'',sequenceSuffix:''};
test('letter speed settings preserve legacy PR parameters exactly',()=>{
 for(const speed of ['A','B','C','D','E'])assert.ok(applyPrintSettings('^XA\n^XZ',1,speed).includes('^PR'+speed+'\n'));
 assert.ok(applyPrintSettings('^XA\n^XZ',1,'4').includes('^PR4\n'));
 for(const speed of ['F','PRA','A^XZ','0','1.5'])assert.throws(()=>applyPrintSettings('^XA\n^XZ',1,speed));
});
test('fixed barcode content is repeated without changing digits',()=>{
 assert.equal(barcodeContent({...seq,numberMode:'fixed',text:'00012'}),'00012');
});
test('sequence supports prefixes, suffixes, increments and leading zeros',()=>{
 const e={...seq,sequenceStart:'0010',sequenceStep:'2',sequencePrefix:'LOT-',sequenceSuffix:'-A9'};
 assert.deepEqual([0,1,2].map(i=>barcodeContent(e,i)),['LOT-0010-A9','LOT-0012-A9','LOT-0014-A9']);
});
test('large serial numbers retain all digits and descending sequences work',()=>{
 assert.equal(barcodeContent({...seq,sequenceStart:'9007199254740993',sequencePad:1},1),'9007199254740994');
 assert.equal(barcodeContent({...seq,sequenceStart:'5',sequenceStep:'-2'},2),'0001');
 assert.throws(()=>barcodeContent({...seq,sequenceStart:'1',sequenceStep:'-2'},1));
});
test('invalid sequence settings cannot create a print job',()=>{
 for(const change of [{sequenceStep:'0'},{sequenceStart:'abc'},{sequencePad:'0'},{sequenceCount:0},{sequenceCount:1001},{sequencePrefix:'^XA'}])assert.throws(()=>sequenceCount([{...seq,...change}]));
 assert.throws(()=>sequenceCount([seq,{...seq,sequenceCount:5}]));
});
test('consecutive print job contains distinct native fields with copies per number',()=>{
 const fixed={...seq,numberMode:'fixed',text:'FIXED',x:5,y:25};
 const entries=[{element:seq,command:nativeElement({...seq,text:barcodeContent(seq)},203,800,400)},{element:fixed,command:nativeElement(fixed,203,800,400)}];
 const job=buildEditorJob(entries,800,400,203,2,'A','gap');
 assert.equal(job.numbers,3);assert.equal(job.total,6);assert.equal((job.zpl.match(/\^XA/g)||[]).length,3);
 for(const value of ['0001','0002','0003'])assert.ok(job.zpl.includes('^FD'+value+'^FS'));
 assert.equal((job.zpl.match(/\^FDFIXED\^FS/g)||[]).length,3);assert.equal((job.zpl.match(/\^PQ2/g)||[]).length,3);assert.equal((job.zpl.match(/\^PRA/g)||[]).length,3);assert.ok(!job.zpl.includes('^GF'));
});
