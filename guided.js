import {makeQr} from './qr.js?v=native-v5';
export function guidedLayout(element,width,height,dpi){
 const e={...element},margin=Math.min(3,width/12,height/12),size=Number(e.captionSize||3);
 let caption=null,lines=[];
 if(e.captionEnabled&&e.captionText?.trim()){
  if(!Number.isFinite(size)||size<1||size>20)throw new Error('El texto adicional debe medir entre 1 y 20 mm.');
  const columns=Math.max(1,Math.floor((width-2*margin)/(size*.65)));
  for(const line of e.captionText.split('\n')){if(!line.length)lines.push('');for(let i=0;i<line.length;i+=columns)lines.push(line.slice(i,i+columns));}
 }
 const reserve=lines.length?lines.length*size*1.2+2:0;
 if(e.autoLayout){
  e.x=margin;e.y=margin;
  if(['qr','url'].includes(e.type)){
   const count=e.text?.trim()?makeQr(e.text,e.type==='url').size:21;
   const minSide=(count+8)*2*25.4/dpi;
   e.w=e.h=Math.min(Math.max(25,minSide+.1),width-2*margin,height-2*margin-reserve);
   if(e.w<=0)throw new Error('No hay espacio para el QR y el texto. Aumenta el largo de la etiqueta o reduce el texto.');
   e.x=(width-e.w)/2;
  }else if(e.type!=='text'){e.w=Math.min(e.w,width-2*margin);e.h=Math.min(e.h,height-2*margin-reserve);}
 }
 if(lines.length){
  const bottom=e.type==='text'?e.y+e.size*1.2*Math.max(1,e.text.split('\n').length):e.y+(['qr','url'].includes(e.type)?e.w:e.h);
  caption={type:'text',id:-e.id,x:margin,y:bottom+2,size,font:'arial',bold:false,text:lines.join('\n')};
  if(caption.y+lines.length*size*1.2>height-margin+1e-6)throw new Error('El texto adicional no cabe debajo del elemento. Activa el ajuste automático o aumenta el largo de la etiqueta.');
 }
 return {element:e,caption};
}
