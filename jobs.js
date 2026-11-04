import {barcodeContent,sequenceCount} from './sequence.js?v=native-v6';
import {nativeElement,nativeLabel} from './native.js?v=native-v6';
import {applyPrintSettings} from './converter.js?v=native-v6';
import {applyMedia} from './media.js?v=native-v6';
export function buildEditorJob(entries,width,height,dpi,copies,speed,media){
 const count=sequenceCount(entries.map(entry=>entry.element));
 const jobs=[];let bytes=0;
 for(let index=0;index<count;index++){
  const fields=entries.map(({element,command})=>element.type==='barcode'&&element.numberMode==='sequence'?nativeElement({...element,text:barcodeContent(element,index)},dpi,width,height):command);
  const job=applyMedia(applyPrintSettings(nativeLabel(fields,width,height),copies,speed),media);
  bytes+=job.length;
  if(bytes>16000000)throw new Error('El archivo supera los 16 MB. Reduce la cantidad de números o el tamaño de las imágenes.');
  jobs.push(job);
 }
 return {zpl:jobs.join('\n'),numbers:count,total:count*copies,hasSequence:entries.some(({element})=>element.type==='barcode'&&element.numberMode==='sequence')};
}
