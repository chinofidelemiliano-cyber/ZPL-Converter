import {nativeElement,graphicField,nativeLabel} from './native.js?v=native-v10';
import {rasterToZpl} from './converter.js?v=native-v10';
import {code39} from './barcode.js?v=native-v10';
import {makeQr} from './qr.js?v=native-v10';
import {readMm,writeMm,unitLabel} from './units.js?v=native-v10';
import {fonts,fontById} from './fonts.js?v=native-v10';
import {barcodeContent,sequenceCount} from './sequence.js?v=native-v10';
import {buildEditorJob} from './jobs.js?v=native-v10';
import {guidedLayout} from './guided.js?v=native-v10';
import {clampPosition} from './positioning.js?v=native-v10';
const $=id=>document.getElementById(id);
const elements=[];let selected=null,redraw,report,nextId=1;const imageRasters=new WeakMap();let renderedEntries=[],renderedScene=[],positionTarget=null;let activeTool=null,freeLayout=false;const drafts=new Map();
function current(){return elements.find(e=>e.id===selected);}
function updateList(){
 $('elements').replaceChildren();
 for(const e of elements){const button=document.createElement('button');button.textContent=({text:'Texto',box:'Recuadro',barcode:'Code 39',qr:'Código QR',url:'QR con enlace',image:'Imagen gráfica (^GFA)'})[e.type]+': '+(e.type==='barcode'&&e.numberMode==='sequence'?'Serie desde '+e.sequenceStart:(e.text||e.name||(e.type==='box'?'Borde':'Sin contenido')));button.classList.toggle('selected',e.id===selected);button.setAttribute('aria-pressed',String(e.id===selected));button.addEventListener('click',()=>{selected=e.id;positionTarget=e.id;updateList();properties();});$('elements').append(button);}
}
function properties(){
 const e=current();$('properties').hidden=!e;updateFocusedUi();if(!e)return;
 $('companion-enabled').checked=!!e.captionEnabled;$('companion-text').value=e.captionText||'';writeMm('companion-size',e.captionSize||3);$('companion-fields').hidden=!e.captionEnabled;$('auto-fit-element').checked=!!e.autoLayout;
 $('optional-caption').hidden=freeLayout||e.type==='text';$('auto-fit-option').hidden=freeLayout||e.type==='text';
 $('content-field').hidden=!['text','barcode','qr','url'].includes(e.type)||(e.type==='barcode'&&e.numberMode==='sequence');
 $('barcode-options').hidden=e.type!=='barcode';
 for(const [id,key] of Object.entries({'barcode-number-mode':'numberMode','sequence-start':'sequenceStart','sequence-step':'sequenceStep','sequence-count':'sequenceCount','sequence-pad':'sequencePad','sequence-prefix':'sequencePrefix','sequence-suffix':'sequenceSuffix'}))$(id).value=e[key]??'';
 $('sequence-options').hidden=e.numberMode!=='sequence';$('text-properties').hidden=e.type!=='text';$('size-properties').hidden=e.type==='text';$('box-properties').hidden=e.type!=='box';$('editor-image-properties').hidden=e.type!=='image';
 for(const [id,key] of Object.entries({'element-text':'text','element-x':'x','element-y':'y','element-w':'w','element-h':'h','font-size':'size','line-width':'line','element-mode':'mode'})){if(['x','y','w','h','size','line'].includes(key))writeMm(id,e[key]);else $(id).value=e[key]??'';}
 $('fo-x').value=Math.round(e.x*Number($('dpi').value)/25.4);$('fo-y').value=Math.round(e.y*Number($('dpi').value)/25.4);
 const targetPosition=renderedScene.find(item=>item.id===positionTarget);if(positionTarget<0&&targetPosition){const unit=Number($('dpi').value)/25.4;writeMm('element-x',targetPosition.x/unit);writeMm('element-y',targetPosition.y/unit);$('fo-x').value=Math.round(targetPosition.x);$('fo-y').value=Math.round(targetPosition.y);}
 $('bold').checked=!!e.bold;$('italic').checked=!!e.italic;$('font-family').value=e.font||'arial';$('font-file').value=e.fontFile||'';$('font-file-card').hidden=!fontById(e.font).requiresFile;
 $('element-text').previousElementSibling.textContent=e.type==='url'?'Enlace de tu página web':e.type==='qr'?'Contenido del código QR':'Contenido';
 $('element-text').placeholder=e.type==='url'?'https://tusitio.com':e.type==='barcode'?'Escribe tu código, por ejemplo PRODUCTO123':'Escribe tu contenido';
 $('content-help').textContent=e.type==='url'?'Puedes escribir tusitio.com; añadiremos https:// para abrirlo al escanear.':e.type==='barcode'?'Code 39: mayúsculas A–Z, números y - . $ / + %.':e.type==='qr'?'Texto, números o información para escanear.':'Admite varias líneas y acentos.';
 $('element-h').closest('.field').hidden=['qr','url'].includes(e.type);
 document.querySelector('label[for=element-w]').textContent=['qr','url'].includes(e.type)?`Tamaño del QR`:`Ancho`;
}
function add(type,extra={}){const e={id:nextId++,type,x:5,y:5,w:40,h:15,size:5,line:.4,bold:false,italic:false,font:'arial',fontFile:'',numberMode:'fixed',sequenceStart:'1',sequenceStep:'1',sequenceCount:10,sequencePad:4,sequencePrefix:'',sequenceSuffix:'',mode:'threshold',text:'',autoLayout:!freeLayout,captionEnabled:false,captionText:'',captionSize:3,...(['qr','url'].includes(type)?{w:25,h:25}:{}),...extra};elements.push(e);selected=e.id;positionTarget=e.id;updateList();properties();redraw();if(['text','barcode','qr','url'].includes(type))report(type==='url'?'Escribe el enlace web de tu QR en el campo Contenido.':'Escribe el contenido del elemento en el campo Contenido.');}
export function initEditor(render,status){
 redraw=render;report=status;
 const settings=document.querySelector('.settings'),container=document.createElement('details');container.id='print-settings';container.open=true;
 const summary=document.createElement('summary');summary.textContent='Tamaño, material y opciones de impresión';container.append(summary);
 const units=document.querySelector('.unit-selector');units.before(container);
 for(const node of [units,document.querySelector('.settings-cards'),document.querySelector('.command-options')])container.append(node);
 settings.insertBefore($('editor-tools'),container);settings.insertBefore($('thermal-settings'),$('editor-tools'));
 $('free-layout').addEventListener('change',()=>{freeLayout=$('free-layout').checked;updateFocusedUi();properties();redraw();});
 for(const [id,key] of [['companion-enabled','captionEnabled'],['companion-text','captionText'],['companion-size','captionSize'],['auto-fit-element','autoLayout']])$(id).addEventListener('input',()=>{
  const e=current();if(!e)return;e[key]=id==='companion-enabled'||id==='auto-fit-element'?$(id).checked:id==='companion-size'?readMm(id):$(id).value;
  if(id==='auto-fit-element'&&e.autoLayout)e.captionManual=false;
  $('companion-fields').hidden=!e.captionEnabled;redraw();
 });
 for(const [id,key] of Object.entries({'barcode-number-mode':'numberMode','sequence-start':'sequenceStart','sequence-step':'sequenceStep','sequence-count':'sequenceCount','sequence-pad':'sequencePad','sequence-prefix':'sequencePrefix','sequence-suffix':'sequenceSuffix'}))$(id).addEventListener('input',()=>{
  const e=current();if(!e)return;e[key]=$(id).value;
  if(key==='numberMode'){properties();}
  updateList();redraw();
 });
 $('new-label').addEventListener('click',()=>{for(const e of elements)e.bitmap?.close();elements.length=0;selected=null;if(activeTool)drafts.set(activeTool,[]);updateList();properties();redraw();report('Etiqueta nueva. Añade texto, códigos o recuadros: se exportarán como ZPL nativo.');});
 for(const [id,key,target] of [['fo-x','x','element-x'],['fo-y','y','element-y']])$(id).addEventListener('input',()=>{
  const e=current();if(!e)return;const dots=$(id).value===''?NaN:Number($(id).value);if(positionTarget<0){const item=renderedScene.find(entry=>entry.id===positionTarget);if(item){moveEditorItem(positionTarget,key==='x'?dots:item.x,key==='y'?dots:item.y);return;}}e[key]=Number.isInteger(dots)?dots*25.4/Number($('dpi').value):NaN;e.autoLayout=false;$('auto-fit-element').checked=false;writeMm(target,e[key]);redraw();
 });
 for(const font of fonts){const option=document.createElement('option');option.value=font.id;option.textContent=font.name;$('font-family').append(option);}
 for(const type of ['text','box','barcode','qr','url'])$('add-'+type).addEventListener('click',()=>chooseType(type));
 for(const [id,key] of Object.entries({'element-text':'text','element-x':'x','element-y':'y','element-w':'w','element-h':'h','font-size':'size','line-width':'line','element-mode':'mode','bold':'bold','italic':'italic','font-family':'font','font-file':'fontFile'}))$(id).addEventListener('input',()=>{const e=current();if(!e)return;if(positionTarget<0&&['x','y'].includes(key)){const item=renderedScene.find(entry=>entry.id===positionTarget);if(item){const dots=readMm(id)*Number($('dpi').value)/25.4;moveEditorItem(positionTarget,key==='x'?dots:item.x,key==='y'?dots:item.y);return;}}if(['x','y','w','h'].includes(key)){e.autoLayout=false;$('auto-fit-element').checked=false;}e[key]=['bold','italic'].includes(id)?$(id).checked:['text','mode','font','fontFile'].includes(key)?$(id).value:readMm(id);updateList();if(key==='font')$('font-file-card').hidden=!fontById(e.font).requiresFile;if(['x','y'].includes(key))$('fo-'+key).value=Math.round(e[key]*Number($('dpi').value)/25.4);redraw();});
 $('delete-element').addEventListener('click',()=>{const e=current();if(!e)return;e.bitmap?.close();elements.splice(elements.indexOf(e),1);selected=elements.at(-1)?.id??null;updateList();properties();redraw();});
 $('editor-image').addEventListener('click',()=>{if(!freeLayout)activateDraft('image');});
 $('editor-image').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>20*1024*1024){report('Usa PNG, JPG o WEBP de menos de 20 MB.');return;}
  try{const bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>40000000){bitmap.close();throw new Error('La imagen supera los 40 megapíxeles.');}if(!freeLayout){for(const e of elements)e.bitmap?.close();elements.length=0;}add('image',{bitmap,name:file.name,w:30,h:Math.max(1,Math.min(100,30*bitmap.height/bitmap.width))});}catch(error){report('No se pudo cargar la imagen: '+error.message);}finally{event.target.value='';}
 });
}
export function drawEditor(ctx,dpi,width,height){
 const unit=dpi/25.4,fields=[];renderedEntries=[];renderedScene=[];
 const working=[];
 for(const original of elements){
  const result=guidedLayout(original,width/unit,height/unit,dpi);Object.assign(original,result.element);working.push(original);
  if(result.caption)working.push(result.caption);
 }
 const selectedElementForUnits=current();
 if(selectedElementForUnits?.autoLayout){for(const [id,key] of [['element-x','x'],['element-y','y'],['element-w','w'],['element-h','h']])writeMm(id,selectedElementForUnits[key]);}

 sequenceCount(elements);
 $('element-commands').textContent='';
 for(const original of working){
  const e=original.type==='barcode'?{...original,text:barcodeContent(original,0)}:original;
  if(['text','barcode','qr','url'].includes(e.type)&&!e.text.trim())continue;
  if(!Number.isFinite(e.x+e.y)||e.x<0||e.y<0||e.x>300||e.y>300)throw new Error('La posición de los elementos debe estar entre 0 y 300 mm en X y 0 y 300 mm en Y.');
  if(e.type==='text'&&(!Number.isFinite(e.size)||e.size<1||e.size>50))throw new Error('Usa un tamaño de texto de 1 a 50 mm.');
  if(e.type!=='text'&&(!Number.isFinite(e.w+e.h)||e.w<1||e.w>300||e.h<1||e.h>300))throw new Error('El elemento debe medir entre 1 y 300 mm de ancho y entre 1 y 300 mm de alto.');
  const x=Math.round(e.x*unit),y=Math.round(e.y*unit),w=Math.round(e.w*unit),h=Math.round(e.h*unit);
  if(e.id===(positionTarget??selected)){$('fo-x').value=x;$('fo-y').value=y;if(e.id<0){writeMm('element-x',e.x);writeMm('element-y',e.y);}}
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
   let cached=imageRasters.get(original);const key=iw+':'+ih+':'+e.mode;
   if(!cached||cached.key!==key||cached.bitmap!==e.bitmap){
    const c=document.createElement('canvas');c.width=iw;c.height=ih;const ic=c.getContext('2d',{willReadFrequently:true});ic.drawImage(e.bitmap,0,0,iw,ih);
    const result=rasterToZpl(ic.getImageData(0,0,iw,ih).data,iw,ih,128,false,e.mode);ic.putImageData(new ImageData(result.preview,iw,ih),0,0);cached={key,bitmap:e.bitmap,canvas:c,zpl:result.zpl};imageRasters.set(original,cached);
   }
   ctx.drawImage(cached.canvas,x,y);command=graphicField(cached.zpl,x,y);
  }
  let bw=w,bh=h;
  if(e.type==='text'){bw=Math.max(1,...e.text.split('\n').map(line=>ctx.measureText(line).width));bh=Math.max(1,Math.round(e.size*unit)*1.2*e.text.split('\n').length);}
  if(['qr','url'].includes(e.type)){const count=makeQr(e.text,e.type==='url').size;bw=bh=(count+8)*Math.min(10,Math.floor(w/(count+8)));}
  if(e.type==='image'){const scale=Math.min(w/e.bitmap.width,h/e.bitmap.height);bw=Math.max(1,Math.round(e.bitmap.width*scale));bh=Math.max(1,Math.round(e.bitmap.height*scale));}
  renderedScene.push({id:e.id,label:e.id<0?'Texto adicional':({text:'Texto',qr:'Código QR',url:'QR con enlace',barcode:'Código de barras',box:'Recuadro',image:'Imagen'})[e.type],x,y,width:bw,height:bh});
  fields.push(command);renderedEntries.push({element:original,command});if(e.id===(positionTarget??selected))$('element-commands').textContent=command;
 }
 const selectedElement=current();
 if(selectedElement?.type==='barcode'&&selectedElement.numberMode==='sequence'){
  const count=Number(selectedElement.sequenceCount);$('sequence-preview').textContent=`Primer código: ${barcodeContent(selectedElement,0)} · Último: ${barcodeContent(selectedElement,count-1)} · ${count} números distintos.`;
 }
 const label=nativeLabel(fields,width,height),images=elements.filter(e=>e.type==='image').length;
 if(!images&&label.includes('^GFA'))throw new Error('La etiqueta nativa no debe contener gráficos.');
 $('editor-export-info').textContent=images?`Etiqueta mixta: ${images} imagen(es) con ^GFA. El texto y los códigos usan comandos nativos.`:'ZPL nativo: texto, QR, barras y recuadros. Sin ^GFA ni datos de imagen.';
 return label;
}

export function useEditorFont(font){
 if(!freeLayout&&activeTool!=='text')chooseType('text');
 let e=current();
 if(!e||e.type!=='text'){add('text',{font});e=current();}else{e.font=font;properties();redraw();}
 report('Fuente aplicada. Escribe o edita el contenido de tu texto.');
}
export function addEditorElement(type){if(type==='image')$('editor-image').click();else chooseType(type);}

export function editorPrintJob(width,height,dpi,copies,speed,media,thermal={}){return buildEditorJob(renderedEntries,width,height,dpi,copies,speed,media,thermal);}

const names={text:'Etiqueta de texto',box:'Etiqueta con recuadro',barcode:'Etiqueta de código de barras',qr:'Etiqueta de código QR',url:'Código QR con enlace',image:'Etiqueta con imagen'};
function updateFocusedUi(){
 $('tool-picker-title').textContent=freeLayout?'Añadir elementos a mi diseño':activeTool?names[activeTool]+' · cambiar tipo':'¿Qué tipo de etiqueta quieres crear?';
 $('focused-tool-note').textContent=freeLayout?'Diseño libre: los elementos se añaden a la misma etiqueta.':activeTool?'Configura este tipo de etiqueta. Los otros tipos se mantienen separados.':'Selecciona una opción para ver únicamente sus campos.';
 $('elements').hidden=$('position-hint').hidden=$('delete-element').hidden=!freeLayout;
 $('tool-picker').open=freeLayout||!current();
}
function activateDraft(type){
 if(activeTool!==type){if(activeTool)drafts.set(activeTool,[...elements]);elements.length=0;elements.push(...(drafts.get(type)||[]));activeTool=type;selected=elements[0]?.id??null;}
 updateList();properties();
}
function chooseType(type){
 if(freeLayout){add(type);return;}
 activateDraft(type);if(!elements.length)add(type);else redraw();
 $('tool-picker').open=false;$('placement-options').open=false;
}
export function editorHasContent(){return elements.some(e=>e.type==='image'||e.type==='box'||(e.type==='barcode'&&e.numberMode==='sequence')||!!e.text?.trim());}
export function editorEmptyMessage(){return activeTool==='url'?'Escribe el enlace para ver tu código QR.':activeTool?'Escribe el contenido para generar la vista previa.':'Elige el tipo de etiqueta para empezar.';}

export function editorScene(){return {items:renderedScene,width:$('preview').width,height:$('preview').height,selected:positionTarget??selected};}
export function selectEditorItem(id){
 const real=elements.find(e=>e.id===Math.abs(id));if(!real)return;selected=real.id;positionTarget=id;updateList();properties();
}
export function moveEditorItem(id,x,y,interactive=false){
 const item=renderedScene.find(entry=>entry.id===id),e=elements.find(element=>element.id===Math.abs(id));if(!item||!e)return;
 const position=clampPosition(x,y,item,{width:$('preview').width,height:$('preview').height}),unit=Number($('dpi').value)/25.4;
 if(id<0){e.captionManual=true;e.captionX=Math.round(position.x)/unit;e.captionY=Math.round(position.y)/unit;writeMm('element-x',e.captionX);writeMm('element-y',e.captionY);$('fo-x').value=Math.round(position.x);$('fo-y').value=Math.round(position.y);}
 else{
  const caption=renderedScene.find(entry=>entry.id===-id);if(caption&&!e.captionManual){e.captionManual=true;e.captionX=caption.x/unit;e.captionY=caption.y/unit;}
  e.autoLayout=false;e.x=Math.round(position.x)/unit;e.y=Math.round(position.y)/unit;$('auto-fit-element').checked=false;
  writeMm('element-x',e.x);writeMm('element-y',e.y);$('fo-x').value=Math.round(position.x);$('fo-y').value=Math.round(position.y);
 }
 positionTarget=id;redraw({interactive});
}
export function commitEditorPosition(){redraw();}
