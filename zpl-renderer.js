import './vendor/JsBarcode.all.min.js';
import {decodeGraphic} from './zpl-parser.js?v=native-v9';
import {code39} from './barcode.js?v=native-v9';
import {makeQr} from './qr.js?v=native-v9';
const fontFamily=font=>['H','E'].includes(font)?'monospace':'Arial, sans-serif';
export function renderZplLabel(label,canvas){
 canvas.width=label.width;canvas.height=label.height;const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;
 const warnings=[...label.warnings];let rendered=0,graphicPixels=0,textChars=0;
 const bounded=(value,min,max,name)=>{if(!Number.isFinite(value)||value<min||value>max)throw new Error(name+' fuera de los límites del visor.');return value;};
 for(const field of label.fields){
  try{
   bounded(field.x,-10000,10000,'Posición X');bounded(field.y,-10000,10000,'Posición Y');ctx.fillStyle='black';ctx.strokeStyle='black';ctx.save();
   if(field.kind==='text'){
    const size=bounded(field.size,1,1000,'Tamaño de texto');textChars+=(field.data||'').length;if(textChars>100000)throw new Error('Demasiado texto para una sola vista previa.');
    ctx.font=`${size}px ${fontFamily(field.font)}`;ctx.textBaseline='top';
    let text=String(field.data||'').replace(/\\&/g,'\n'),lines=text.split('\n');
    if(field.block){
     bounded(field.block.width,1,10000,'Ancho del bloque de texto');const wrapped=[];
     for(const line of lines){let current='';for(const char of line){if(current&&ctx.measureText(current+char).width>field.block.width){wrapped.push(current);current='';}current+=char;}wrapped.push(current);}lines=wrapped.slice(0,Math.min(1000,Math.max(1,field.block.lines)));
    }
    const top=field.baseline?field.y-size:field.y;
    if(field.rotation!=='N'){warnings.push('La rotación del texto se representa de forma aproximada.');ctx.translate(field.x,top);ctx.rotate(({R:90,I:180,B:270}[field.rotation]||0)*Math.PI/180);}
    lines.forEach((line,index)=>{
     const x=field.rotation!=='N'?0:field.x;let offset=0;
     if(field.block?.align==='C')offset=(field.block.width-ctx.measureText(line).width)/2;
     if(field.block?.align==='R')offset=field.block.width-ctx.measureText(line).width;
     ctx.fillText(line,x+offset,(field.rotation!=='N'?0:top)+index*(size*1.2+(field.block?.spacing||0)));
    });
   }else if(field.kind==='shape'){
    const w=bounded(field.width,1,10000,'Ancho de figura'),h=bounded(field.height,1,10000,'Alto de figura'),thickness=bounded(field.thickness,0,10000,'Grosor');ctx.strokeStyle=ctx.fillStyle=field.color==='W'?'white':'black';
    if(field.shape==='GB'){
     if(thickness>=Math.min(w,h)/2)ctx.fillRect(field.x,field.y,w,h);else{ctx.lineWidth=Math.max(1,thickness);ctx.strokeRect(field.x+thickness/2,field.y+thickness/2,w-thickness,h-thickness);}
    }else{ctx.lineWidth=Math.max(1,thickness);ctx.beginPath();ctx.ellipse(field.x+w/2,field.y+h/2,Math.max(.1,(w-thickness)/2),Math.max(.1,(h-thickness)/2),0,0,2*Math.PI);ctx.stroke();}
   }else if(field.kind==='qr'){
    if(field.rotation!=='N')warnings.push('La orientación del QR no se simula; se muestra sin rotar.');
    const data=String(field.data||'');if(!/^[LMQH][AM],/.test(data))throw new Error('El QR usa un modo de datos no compatible.');
    if(data[0]!=='M')warnings.push('La matriz QR se aproxima con corrección M; el ZPL solicita otro nivel.');
    if(data[1]!=='A')throw new Error('El modo manual de QR no está soportado. Usa ^FDMA,contenido.');
    const qr=makeQr(data.slice(3)),module=bounded(field.module,1,10,'Magnificación QR');
    for(let r=0;r<qr.size;r++)for(let c=0;c<qr.size;c++)if(qr.dark(r,c))ctx.fillRect(field.x+c*module,field.y+r*module,module,module);
   }else if(field.kind==='barcode'){
    const c=document.createElement('canvas');let data=field.data||'';
    if(field.format==='CODE128'&&data.includes('>')){warnings.push('Las secuencias de control Code 128 se aproximan con selección automática.');data=data.replace(/>[0-9:;]/g,'');}
    if(data.length>200)throw new Error('Código de barras demasiado largo para el visor.');
    const width=bounded(field.module,1,10,'Módulo de barras'),height=bounded(field.height,1,3000,'Altura de barras');if((data.length+4)*20*width*(height+60)>16000000)throw new Error('El código de barras requiere demasiada memoria para el visor.');
    if(field.format==='CODE39'&&field.ratio===3&&data.length<=40){
     const bars=code39(data),fontSize=Math.max(12,Math.min(40,height/5));c.width=(bars.modules-20)*width;c.height=height+(field.showText?fontSize+4:0);const bc=c.getContext('2d');bc.fillStyle='black';for(const bar of bars.bars)bc.fillRect((bar.x-10)*width,0,bar.width*width,height);
     if(field.showText){bc.font=`${fontSize}px monospace`;bc.textBaseline='top';bc.textAlign='center';bc.fillText(data,c.width/2,height+3);}
    }else globalThis.JsBarcode(c,data,{format:field.format,width,height,displayValue:field.showText,margin:0,fontSize:Math.max(12,Math.min(40,height/5)),textMargin:3});
    if(c.width*c.height>16000000)throw new Error('Código de barras demasiado grande.');
    if(field.rotation!=='N')warnings.push('La orientación del código de barras no se simula; se muestra sin rotar.');
    if(field.format==='CODE39'&&field.ratio!==3)warnings.push('Code 39: el visor usa su relación de barras predeterminada; comprueba ^BY en la impresora.');
    ctx.drawImage(c,field.x,field.y);
   }else if(field.kind==='graphic'){
    if(field.encoding!=='A')throw new Error('Solo se admiten gráficos ^GFA en ASCII.');
    graphicPixels+=field.total*8;if(graphicPixels>16000000)throw new Error('La suma de gráficos supera 16 millones de puntos.');
    const bytes=decodeGraphic(field.data,field.total,field.rowBytes),w=field.rowBytes*8,h=field.total/field.rowBytes;
    if(w>10000||h>10000)throw new Error('Las dimensiones del gráfico superan los límites del visor.');
    const sx=bounded(field.scaleX||1,1,10,'Escala de gráfico'),sy=bounded(field.scaleY||1,1,10,'Escala de gráfico');if(w*h*sx*sy>16000000)throw new Error('Gráfico ampliado demasiado grande.');
    const c=document.createElement('canvas');c.width=w;c.height=h;const ic=c.getContext('2d'),pixels=ic.createImageData(w,h);
    for(let i=0;i<w*h;i++){const black=bytes[Math.floor(i/w)*field.rowBytes+Math.floor((i%w)/8)]&(128>>(i%8));pixels.data[i*4]=pixels.data[i*4+1]=pixels.data[i*4+2]=black?0:255;pixels.data[i*4+3]=black?255:0;}
    ic.putImageData(pixels,0,0);ctx.drawImage(c,field.x,field.y,w*sx,h*sy);
   }
   rendered++;
  }catch(error){warnings.push('No se pudo dibujar un campo: '+(error.message||String(error)));}finally{ctx.restore();}
 }
 if(!rendered)warnings.push('No hay elementos compatibles que mostrar en esta etiqueta.');
 return {warnings:[...new Set(warnings)],rendered};
}
