import {fontCommand} from './fonts.js?v=native-v5';
import {code39} from './barcode.js?v=native-v5';
import {makeQr,qrContent} from './qr.js?v=native-v5';
// Escape command delimiters and non-ASCII UTF-8 bytes in field content.
export const fieldData=text=>Array.from(new TextEncoder().encode(text),b=>b>=32&&b<=126&&![94,126,92].includes(b)?String.fromCharCode(b):'\\'+b.toString(16).padStart(2,'0').toUpperCase()).join('');
export function nativeElement(e,dpi,labelWidth,labelHeight){
 const unit=dpi/25.4,px=mm=>Math.round(mm*unit);
 const x=px(e.x),y=px(e.y),w=px(e.w),h=px(e.h);
 if(!Number.isFinite(x+y)||x<0||y<0)throw new Error('Posición inválida.');
 if(['text','barcode','qr','url'].includes(e.type)&&!e.text.trim())return '';
 if(e.type==='text'){
  const size=px(e.size);if(!Number.isInteger(size)||size<1||e.size>50)throw new Error('Tamaño de texto inválido.');
  const font=fontCommand(e.font,size,e.fontFile);
  return e.text.split('\n').map((line,i)=>{
   const top=y+Math.round(i*size*1.2);
   const make=left=>`^FO${left},${top}\n${font}\n^FH\\\n^FD${fieldData(line)}^FS`;
   return make(x)+(e.bold?'\n'+make(x+1):'');
  }).join('\n');
 }
 if(e.type==='box'){
  if(!Number.isFinite(e.line)||e.line<.1||e.line>10||w<1||h<1)throw new Error('Recuadro inválido.');
  return `^FO${x},${y}\n^GB${w},${h},${Math.min(w,h,Math.max(1,px(e.line)))},B,0^FS`;
 }
 if(e.type==='barcode'){
  const code=code39(e.text),module=Math.floor(w/code.modules),barHeight=h-Math.round(3*unit)-3;
  if(module<1||module>10||barHeight<5)throw new Error('Ajusta el tamaño del código de barras: el módulo nativo debe medir entre 1 y 10 dots.');
  return `^FO${x+10*module},${y}\n^BY${module},3,${barHeight}\n^B3N,N,${barHeight},Y,N\n^FH\\\n^FD${fieldData(e.text)}^FS`;
 }
 if(e.type==='qr'||e.type==='url'){
  const qr=makeQr(e.text,e.type==='url'),module=Math.min(10,Math.floor(w/(qr.size+8)));
  if(module<2)throw new Error('Aumenta el tamaño del QR o reduce su contenido.');
  const total=(qr.size+8)*module;
  if(x+total>labelWidth||y+total>labelHeight)throw new Error('El QR debe caber completo dentro de la etiqueta.');
  return `^FO${x+4*module},${y+4*module}\n^BQN,2,${module}\n^FH\\\n^FDMA,${fieldData(qrContent(e.text,e.type==='url'))}^FS`;
 }
 throw new Error('Tipo de elemento nativo desconocido.');
}
export function graphicField(zpl,x,y){
 const graphic=zpl.match(/\^GFA,[^\n]+/);
 if(!graphic||![x,y].every(n=>Number.isInteger(n)&&n>=0))throw new Error('Gráfico inválido.');
 return `^FO${x},${y}\n${graphic[0]}\n^FS`;
}
export function nativeLabel(fields,width,height){
 if(![width,height].every(n=>Number.isInteger(n)&&n>0))throw new Error('Dimensiones ZPL inválidas.');
 return `^XA\n^CI28\n^PW${width}\n^LL${height}\n${fields.filter(Boolean).join('\n')}\n^XZ`;
}
