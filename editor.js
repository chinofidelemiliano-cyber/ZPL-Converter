import {rasterToZpl} from './converter.js';
import {code39} from './barcode.js';
const $=id=>document.getElementById(id);
const elements=[];let selected=null,redraw,report,nextId=1;
function current(){return elements.find(e=>e.id===selected);}
function updateList(){
 $('elements').replaceChildren();
 for(const e of elements){const button=document.createElement('button');button.textContent=({text:'Texto',box:'Recuadro',barcode:'Code 39',image:'Imagen'})[e.type]+': '+(e.text||e.name||'Borde');button.classList.toggle('selected',e.id===selected);button.setAttribute('aria-pressed',String(e.id===selected));button.addEventListener('click',()=>{selected=e.id;updateList();properties();});$('elements').append(button);}
}
function properties(){
 const e=current();$('properties').hidden=!e;if(!e)return;
 $('content-field').hidden=!['text','barcode'].includes(e.type);$('text-properties').hidden=e.type!=='text';$('size-properties').hidden=e.type==='text';$('box-properties').hidden=e.type!=='box';$('editor-image-properties').hidden=e.type!=='image';
 for(const [id,key] of Object.entries({'element-text':'text','element-x':'x','element-y':'y','element-w':'w','element-h':'h','font-size':'size','line-width':'line','element-mode':'mode'}))$(id).value=e[key]??'';
 $('bold').checked=!!e.bold;
}
function add(type,extra={}){const e={id:nextId++,type,x:5,y:5,w:40,h:15,size:5,line:.4,bold:false,mode:'threshold',text:type==='barcode'?'ABC123':type==='text'?'Mi etiqueta':'',...extra};elements.push(e);selected=e.id;updateList();properties();redraw();}
export function initEditor(render,status){
 redraw=render;report=status;
 for(const type of ['text','box','barcode'])$('add-'+type).addEventListener('click',()=>add(type));
 for(const [id,key] of Object.entries({'element-text':'text','element-x':'x','element-y':'y','element-w':'w','element-h':'h','font-size':'size','line-width':'line','element-mode':'mode','bold':'bold'}))$(id).addEventListener('input',()=>{const e=current();if(!e)return;e[key]=id==='bold'?$(id).checked:['text','mode'].includes(key)?$(id).value:Number($(id).value);updateList();redraw();});
 $('delete-element').addEventListener('click',()=>{const e=current();if(!e)return;e.bitmap?.close();elements.splice(elements.indexOf(e),1);selected=elements.at(-1)?.id??null;updateList();properties();redraw();});
 $('editor-image').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>20*1024*1024){report('Usa PNG, JPG o WEBP de menos de 20 MB.');return;}
  try{const bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>40000000){bitmap.close();throw new Error('La imagen supera los 40 megapíxeles.');}add('image',{bitmap,name:file.name,w:30,h:Math.max(1,Math.min(100,30*bitmap.height/bitmap.width))});}catch(error){report('No se pudo cargar la imagen: '+error.message);}finally{event.target.value='';}
 });
}
export function drawEditor(ctx,dpi,width,height){
 const unit=dpi/25.4;
 for(const e of elements){
  if(!Number.isFinite(e.x+e.y)||e.x<0||e.y<0||e.x>200||e.y>300)throw new Error('La posición de los elementos debe estar entre 0 y 200 mm en X y 0 y 300 mm en Y.');
  if(e.type==='text'&&(!Number.isFinite(e.size)||e.size<1||e.size>50))throw new Error('Usa un tamaño de texto de 1 a 50 mm.');
  if(e.type!=='text'&&(!Number.isFinite(e.w+e.h)||e.w<1||e.w>200||e.h<1||e.h>300))throw new Error('El elemento debe medir entre 1 y 200 mm de ancho y entre 1 y 300 mm de alto.');
  const x=Math.round(e.x*unit),y=Math.round(e.y*unit),w=Math.round(e.w*unit),h=Math.round(e.h*unit);
  ctx.fillStyle='black';ctx.strokeStyle='black';
  if(e.type==='text'){
   ctx.font=`${e.bold?'bold':'normal'} ${Math.round(e.size*unit)}px Arial, sans-serif`;ctx.textBaseline='top';
   e.text.split('\n').forEach((line,i)=>ctx.fillText(line,x,y+i*e.size*unit*1.2));
  }else if(e.type==='box'){
   if(!Number.isFinite(e.line)||e.line<.1||e.line>10)throw new Error('El grosor del borde debe estar entre 0.1 y 10 mm.');
   const line=Math.min(w,h,Math.max(1,Math.round(e.line*unit)));ctx.lineWidth=line;ctx.strokeRect(x+line/2,y+line/2,w-line,h-line);
  }else if(e.type==='barcode'){
   const code=code39(e.text),module=Math.floor(w/code.modules);
   if(module<1)throw new Error('El código de barras no cabe. Aumenta su ancho o reduce el contenido.');
   const caption=Math.round(3*unit),barHeight=h-caption-3;
   if(barHeight<5)throw new Error('Aumenta la altura del código de barras.');
   ctx.fillStyle='white';ctx.fillRect(x,y,w,h);ctx.fillStyle='black';
   for(const bar of code.bars)ctx.fillRect(x+bar.x*module,y,bar.width*module,barHeight);
   ctx.font=`${caption}px monospace`;ctx.textBaseline='top';ctx.fillText(e.text,x+10*module,y+barHeight+3,w-20*module);
  }else if(e.type==='image'){
   const scale=Math.min(w/e.bitmap.width,h/e.bitmap.height);const iw=Math.max(1,Math.round(e.bitmap.width*scale)),ih=Math.max(1,Math.round(e.bitmap.height*scale));
   if(iw*ih>16000000)throw new Error('Reduce el tamaño de la imagen.');
   const c=document.createElement('canvas');c.width=iw;c.height=ih;const ic=c.getContext('2d',{willReadFrequently:true});ic.drawImage(e.bitmap,0,0,iw,ih);
   const result=rasterToZpl(ic.getImageData(0,0,iw,ih).data,iw,ih,128,false,e.mode);ic.putImageData(new ImageData(result.preview,iw,ih),0,0);ctx.drawImage(c,x,y);
  }
 }
}
