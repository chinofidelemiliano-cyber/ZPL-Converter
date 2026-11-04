import {nativeElement,graphicField,nativeLabel} from './native.js';
import {rasterToZpl} from './converter.js';
import {code39} from './barcode.js';
import {makeQr} from './qr.js';
import {readMm,writeMm,unitLabel} from './units.js';
import {fonts,fontById} from './fonts.js';
const $=id=>document.getElementById(id);
const elements=[];let selected=null,redraw,report,nextId=1;
function current(){return elements.find(e=>e.id===selected);}
function updateList(){
 $('elements').replaceChildren();
 for(const e of elements){const button=document.createElement('button');button.textContent=({text:'Texto',box:'Recuadro',barcode:'Code 39',qr:'Código QR',url:'QR con enlace',image:'Imagen'})[e.type]+': '+(e.text||e.name||(e.type==='box'?'Borde':'Sin contenido'));button.classList.toggle('selected',e.id===selected);button.setAttribute('aria-pressed',String(e.id===selected));button.addEventListener('click',()=>{selected=e.id;updateList();properties();});$('elements').append(button);}
}
function properties(){
 const e=current();$('properties').hidden=!e;if(!e)return;
 $('content-field').hidden=!['text','barcode','qr','url'].includes(e.type);$('text-properties').hidden=e.type!=='text';$('size-properties').hidden=e.type==='text';$('box-properties').hidden=e.type!=='box';$('editor-image-properties').hidden=e.type!=='image';
 for(const [id,key] of Object.entries({'element-text':'text','element-x':'x','element-y':'y','element-w':'w','element-h':'h','font-size':'size','line-width':'line','element-mode':'mode'})){if(['x','y','w','h','size','line'].includes(key))writeMm(id,e[key]);else $(id).value=e[key]??'';}
 $('fo-x').value=Math.round(e.x*Number($('dpi').value)/25.4);$('fo-y').value=Math.round(e.y*Number($('dpi').value)/25.4);
 $('bold').checked=!!e.bold;$('italic').checked=!!e.italic;$('font-family').value=e.font||'arial';
 $('element-text').placeholder=e.type==='url'?'https://tusitio.com':e.type==='barcode'?'Escribe tu código, por ejemplo PRODUCTO123':'Escribe tu contenido';
 $('content-help').textContent=e.type==='url'?'El QR abrirá este enlace al escanearlo.':e.type==='barcode'?'Code 39: mayúsculas A–Z, números y - . $ / + %.':e.type==='qr'?'Texto, números o información para escanear.':'Admite varias líneas y acentos.';
 $('element-h').closest('.field').hidden=['qr','url'].includes(e.type);
 $('element-w').previousElementSibling.textContent=['qr','url'].includes(e.type)?`Tamaño del QR (${unitLabel()})`:`Ancho (${unitLabel()})`;
}
function add(type,extra={}){const e={id:nextId++,type,x:5,y:5,w:40,h:15,size:5,line:.4,bold:false,italic:false,font:'arial',mode:'threshold',text:'',...(['qr','url'].includes(type)?{w:25,h:25}:{}),...extra};elements.push(e);selected=e.id;updateList();properties();redraw();if(['text','barcode','qr','url'].includes(type))report(type==='url'?'Escribe el enlace web de tu QR en el campo Contenido.':'Escribe el contenido del elemento en el campo Contenido.');}
export function initEditor(render,status){
 redraw=render;report=status;
 for(const [id,key,target] of [['fo-x','x','element-x'],['fo-y','y','element-y']])$(id).addEventListener('input',()=>{
  const e=current();if(!e)return;const dots=$(id).value===''?NaN:Number($(id).value);e[key]=Number.isInteger(dots)?dots*25.4/Number($('dpi').value):NaN;writeMm(target,e[key]);redraw();
 });
 for(const font of fonts){const option=document.createElement('option');option.value=font.id;option.textContent=font.name;$('font-family').append(option);}
 for(const type of ['text','box','barcode','qr','url'])$('add-'+type).addEventListener('click',()=>add(type));
 for(const [id,key] of Object.entries({'element-text':'text','element-x':'x','element-y':'y','element-w':'w','element-h':'h','font-size':'size','line-width':'line','element-mode':'mode','bold':'bold','italic':'italic','font-family':'font'}))$(id).addEventListener('input',()=>{const e=current();if(!e)return;e[key]=['bold','italic'].includes(id)?$(id).checked:['text','mode','font'].includes(key)?$(id).value:readMm(id);updateList();if(['x','y'].includes(key))$('fo-'+key).value=Math.round(e[key]*Number($('dpi').value)/25.4);redraw();});
 $('delete-element').addEventListener('click',()=>{const e=current();if(!e)return;e.bitmap?.close();elements.splice(elements.indexOf(e),1);selected=elements.at(-1)?.id??null;updateList();properties();redraw();});
 $('editor-image').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>20*1024*1024){report('Usa PNG, JPG o WEBP de menos de 20 MB.');return;}
  try{const bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>40000000){bitmap.close();throw new Error('La imagen supera los 40 megapíxeles.');}add('image',{bitmap,name:file.name,w:30,h:Math.max(1,Math.min(100,30*bitmap.height/bitmap.width))});}catch(error){report('No se pudo cargar la imagen: '+error.message);}finally{event.target.value='';}
 });
}
export function drawEditor(ctx,dpi,width,height){
 const unit=dpi/25.4,fields=[];
 $('element-commands').textContent='';
 for(const e of elements){
  if(['text','barcode','qr','url'].includes(e.type)&&!e.text.trim())continue;
  if(!Number.isFinite(e.x+e.y)||e.x<0||e.y<0||e.x>200||e.y>300)throw new Error('La posición de los elementos debe estar entre 0 y 200 mm en X y 0 y 300 mm en Y.');
  if(e.type==='text'&&(!Number.isFinite(e.size)||e.size<1||e.size>50))throw new Error('Usa un tamaño de texto de 1 a 50 mm.');
  if(e.type!=='text'&&(!Number.isFinite(e.w+e.h)||e.w<1||e.w>200||e.h<1||e.h>300))throw new Error('El elemento debe medir entre 1 y 200 mm de ancho y entre 1 y 300 mm de alto.');
  const x=Math.round(e.x*unit),y=Math.round(e.y*unit),w=Math.round(e.w*unit),h=Math.round(e.h*unit);
  if(e.id===selected){$('fo-x').value=x;$('fo-y').value=y;}
  let command=e.type==='image'?'':nativeElement(e,dpi,width,height);
  ctx.fillStyle='black';ctx.strokeStyle='black';
  if(e.type==='text'){
   ctx.font=`normal ${e.bold?'bold':'normal'} ${Math.round(e.size*unit)}px ${fontById(e.font).family}`;ctx.textBaseline='top';
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
  }else if(e.type==='qr'||e.type==='url'){
   const qr=makeQr(e.text,e.type==='url'),module=Math.min(10,Math.floor(w/(qr.size+8)));
   if(module<2)throw new Error('El QR es demasiado pequeño para este contenido. Aumenta su tamaño o acorta el texto.');
   const total=(qr.size+8)*module;
   if(x+total>width||y+total>height)throw new Error('El QR debe caber completo dentro de la etiqueta, incluidos sus márgenes blancos.');
   ctx.fillStyle='white';ctx.fillRect(x,y,total,total);ctx.fillStyle='black';
   for(let row=0;row<qr.size;row++)for(let col=0;col<qr.size;col++)if(qr.dark(row,col))ctx.fillRect(x+(col+4)*module,y+(row+4)*module,module,module);
  }else if(e.type==='image'){
   const scale=Math.min(w/e.bitmap.width,h/e.bitmap.height);const iw=Math.max(1,Math.round(e.bitmap.width*scale)),ih=Math.max(1,Math.round(e.bitmap.height*scale));
   if(iw*ih>16000000)throw new Error('Reduce el tamaño de la imagen.');
   const c=document.createElement('canvas');c.width=iw;c.height=ih;const ic=c.getContext('2d',{willReadFrequently:true});ic.drawImage(e.bitmap,0,0,iw,ih);
   const result=rasterToZpl(ic.getImageData(0,0,iw,ih).data,iw,ih,128,false,e.mode);ic.putImageData(new ImageData(result.preview,iw,ih),0,0);ctx.drawImage(c,x,y);command=graphicField(result.zpl,x,y);
  }
  fields.push(command);if(e.id===selected)$('element-commands').textContent=command;
 }
 return nativeLabel(fields,width,height);
}

export function useEditorFont(font){
 let e=current();
 if(!e||e.type!=='text'){add('text',{font});e=current();}else{e.font=font;properties();redraw();}
 report('Fuente aplicada. Escribe o edita el contenido de tu texto.');
}
export function addEditorElement(type){if(type==='image')$('editor-image').click();else add(type);}
