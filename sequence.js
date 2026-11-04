import {code39} from './barcode.js?v=native-v4';
export function barcodeContent(element,index=0){
 if(element.numberMode!=='sequence')return element.text||'';
 if(!Number.isInteger(index)||index<0)throw new Error('Índice de consecutivo inválido.');
 const start=String(element.sequenceStart??'1'),step=String(element.sequenceStep??'1');
 if(!/^\d{1,24}$/.test(start)||! /^-?\d{1,24}$/.test(step)||BigInt(step)===0n)throw new Error('El inicio debe contener hasta 24 dígitos y el incremento debe ser un entero distinto de cero.');
 const padding=Number(element.sequencePad??start.length);
 if(!Number.isInteger(padding)||padding<1||padding>24)throw new Error('Usa entre 1 y 24 posiciones para los ceros a la izquierda.');
 const value=BigInt(start)+BigInt(step)*BigInt(index);
 if(value<0n)throw new Error('La serie genera números negativos. Ajusta el inicio, incremento o cantidad.');
 const content=(element.sequencePrefix||'')+value.toString().padStart(Math.max(padding,start.length),'0')+(element.sequenceSuffix||'');
 code39(content);
 return content;
}
export function sequenceCount(elements){
 const sequences=elements.filter(e=>e.type==='barcode'&&e.numberMode==='sequence');
 if(!sequences.length)return 1;
 const count=Number(sequences[0].sequenceCount);
 if(!Number.isInteger(count)||count<1||count>1000)throw new Error('La serie debe contener entre 1 y 1000 números.');
 for(const element of sequences){
  if(Number(element.sequenceCount)!==count)throw new Error('Los códigos consecutivos de una misma etiqueta deben usar la misma cantidad de números.');
  barcodeContent(element,0);barcodeContent(element,count-1);
 }
 return count;
}
